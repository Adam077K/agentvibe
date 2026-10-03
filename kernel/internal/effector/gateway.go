package effector

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/outbox"
	"github.com/Adam077K/agentvibe/kernel/internal/socket"
)

// The Gateway keeps one outbox per verb, under Dir/ops/<hex(verb)>, so that each effector's class
// and declared visibility lag reach the outbox as the effector states them (rulings A-C are the
// outbox's). The resources a first proposal named are kept under Dir/fence/<operation id>, written
// create-if-absent, so a replacement Gateway fences exactly as the first one did.

// bigint is a B1-02 bigint: an unsigned decimal string with no leading zero (Q4).
var bigint = regexp.MustCompile(`^(0|[1-9][0-9]*)$`)

// opID is the outbox's Operation ID alphabet (a ULID), checked before it names a file.
var opID = regexp.MustCompile(`^[0-9A-HJKMNP-TV-Z]{26}$`)

type gateway struct {
	cfg   Config
	verbs []string // sorted, so Get and Reconcile visit outboxes in a fixed order
	obs   map[string]outbox.Outbox
}

func open(cfg Config) (Gateway, error) {
	if cfg.Dir == "" || cfg.Venture == "" || cfg.Clock == nil || cfg.Blobs == nil || cfg.Fence == nil ||
		cfg.Ventures == nil || len(cfg.Effectors) == 0 {
		return nil, errors.New("effector: Config needs Dir, Venture, Clock, Blobs, Fence, Ventures and Effectors")
	}
	if err := os.MkdirAll(filepath.Join(cfg.Dir, "fence"), 0o700); err != nil {
		return nil, fmt.Errorf("effector: %w", err)
	}
	g := &gateway{cfg: cfg, obs: map[string]outbox.Outbox{}}
	for verb, eff := range cfg.Effectors {
		if eff == nil {
			return nil, fmt.Errorf("effector: no effector for verb %q", verb)
		}
		ob, err := outbox.Open(filepath.Join(cfg.Dir, "ops", hex.EncodeToString([]byte(verb))), outbox.Deps{
			WorkerID: cfg.WorkerID, Clock: cfg.Clock, Provider: fenced{eff, cfg.Fence}, Crash: cfg.Crash})
		if err != nil {
			return nil, err
		}
		g.verbs, g.obs[verb] = append(g.verbs, verb), ob
	}
	sort.Strings(g.verbs)
	return g, nil
}

func (g *gateway) ProposeEffect(ctx context.Context, c socket.ProposeEffect) (json.RawMessage, error) {
	eff, ok := g.cfg.Effectors[c.Verb]
	if !ok {
		return nil, fmt.Errorf("%w: %q", ErrUnknownVerb, c.Verb)
	}
	var target string
	if err := json.Unmarshal(c.Target, &target); err != nil || target == "" {
		return nil, fmt.Errorf("%w: %s", ErrInvalidTarget, c.Target)
	}
	toks, err := parseTokens(c.LeaseTokens)
	if err != nil {
		return nil, err
	}
	for _, r := range sortedResources(toks) {
		// Q1: the venture is the lease's, never the request's.
		v, err := g.cfg.Ventures.VentureOf(ctx, r)
		if err != nil {
			return nil, fmt.Errorf("effector: venture of %s cannot be read: %w", r, err)
		}
		if v != g.cfg.Venture {
			return nil, fmt.Errorf("%w: %s belongs to %q, the Gateway serves %q", ErrWrongVenture, r, v, g.cfg.Venture)
		}
	}
	if err := g.check(ctx, sortedResources(toks), toks); err != nil {
		return nil, err
	}
	payload, err := g.cfg.Blobs.GetBlob(ctx, g.cfg.Venture, journal.BlobRef(c.PayloadRef))
	if err != nil {
		return nil, fmt.Errorf("%w: %s: %v", ErrUnknownPayload, c.PayloadRef, err)
	}
	op, err := g.obs[c.Verb].Propose(ctx, outbox.Effect{Class: eff.Class(), Payload: payload,
		Key: outbox.BusinessKey{Venture: g.cfg.Venture, Verb: c.Verb, Target: target, Ref: c.BusinessRef}})
	if err != nil {
		return nil, err
	}
	if err := g.recordFence(op.ID, sortedResources(toks)); err != nil {
		return nil, err
	}
	return json.Marshal(ProposeResult{OperationID: op.ID, State: op.State})
}

// parseTokens reads lease_tokens: a JSON object of resource -> B1-02 bigint string (Q4). An empty
// object is no lease (Q2); any other shape is refused.
func parseTokens(raw json.RawMessage) (Tokens, error) {
	var m map[string]string
	if err := json.Unmarshal(raw, &m); err != nil || m == nil {
		return nil, fmt.Errorf("effector: lease_tokens must be an object of resource -> decimal string: %s", raw)
	}
	if len(m) == 0 {
		return nil, ErrNoLease
	}
	toks := Tokens{}
	for r, s := range m {
		n, err := strconv.ParseUint(s, 10, 64)
		if r == "" || !bigint.MatchString(s) || err != nil {
			return nil, fmt.Errorf("effector: lease token for %q is not a bigint: %q", r, s)
		}
		toks[r] = n
	}
	return toks, nil
}

func sortedResources(t Tokens) []string {
	rs := make([]string, 0, len(t))
	for r := range t {
		rs = append(rs, r)
	}
	sort.Strings(rs)
	return rs
}

// check passes iff every resource has a presented token and the Fence calls it current. Any Fence
// error refuses: an unchecked token is not a current one.
func (g *gateway) check(ctx context.Context, resources []string, presented Tokens) error {
	return checkFence(ctx, g.cfg.Fence, resources, presented)
}

func checkFence(ctx context.Context, f Fence, resources []string, presented Tokens) error {
	if len(resources) == 0 {
		return fmt.Errorf("%w: no fenced resource", ErrStaleToken)
	}
	for _, r := range resources {
		tok, ok := presented[r]
		if !ok {
			return fmt.Errorf("%w: no token presented for %s", ErrStaleToken, r)
		}
		if err := f.Check(ctx, r, tok); err != nil {
			return fmt.Errorf("%w: %s token %d: %v", ErrStaleToken, r, tok, err)
		}
	}
	return nil
}

func (g *gateway) fencePath(id string) (string, error) {
	if !opID.MatchString(id) {
		return "", fmt.Errorf("%w: %q", outbox.ErrUnknownOperation, id)
	}
	return filepath.Join(g.cfg.Dir, "fence", id+".json"), nil
}

// recordFence keeps the first proposal's resources: written to a temporary file and linked into
// place, so it appears whole or not at all and a later proposal never replaces it.
func (g *gateway) recordFence(id string, resources []string) error {
	path, err := g.fencePath(id)
	if err != nil {
		return err
	}
	if _, err := os.Stat(path); err == nil {
		return nil
	}
	data, err := json.Marshal(resources)
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(path), "."+id+".*")
	if err != nil {
		return fmt.Errorf("effector: fence record: %w", err)
	}
	defer os.Remove(tmp.Name())
	if _, err := tmp.Write(data); err == nil {
		err = tmp.Sync()
	}
	if cerr := tmp.Close(); err != nil || cerr != nil {
		return fmt.Errorf("effector: fence record: %w", errors.Join(err, cerr))
	}
	if err := os.Link(tmp.Name(), path); err != nil && !errors.Is(err, os.ErrExist) {
		return fmt.Errorf("effector: fence record: %w", err)
	}
	return nil
}

func (g *gateway) fenceOf(id string) ([]string, error) {
	path, err := g.fencePath(id)
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("%w: no fence record for %s: %v", ErrStaleToken, id, err)
	}
	var rs []string
	if err := json.Unmarshal(data, &rs); err != nil || len(rs) == 0 {
		return nil, fmt.Errorf("%w: unreadable fence record for %s", ErrStaleToken, id)
	}
	return rs, nil
}

// fenceCall carries one Dispatch's fence to the provider wrapper, which re-checks it immediately
// before the effector's Do.
type fenceCall struct {
	resources []string
	presented Tokens
}

type fenceKey struct{}

func (g *gateway) Dispatch(ctx context.Context, id string, presented Tokens) (outbox.Operation, error) {
	ob, op, err := g.find(ctx, id)
	if err != nil {
		return op, err
	}
	resources, err := g.fenceOf(id)
	if err == nil {
		err = g.check(ctx, resources, presented)
	}
	if err != nil {
		return op, err // refused before the outbox: nothing journaled, nothing sent
	}
	return ob.Dispatch(context.WithValue(ctx, fenceKey{}, fenceCall{resources, presented}), id)
}

func (g *gateway) find(ctx context.Context, id string) (outbox.Outbox, outbox.Operation, error) {
	for _, v := range g.verbs {
		op, err := g.obs[v].Get(ctx, id)
		if err == nil {
			return g.obs[v], op, nil
		}
		if !errors.Is(err, outbox.ErrUnknownOperation) {
			return nil, op, err
		}
	}
	return nil, outbox.Operation{}, fmt.Errorf("%w: %q", outbox.ErrUnknownOperation, id)
}

func (g *gateway) Reconcile(ctx context.Context) error {
	var errs []error
	for _, v := range g.verbs {
		errs = append(errs, g.obs[v].Reconcile(ctx))
	}
	return errors.Join(errs...)
}

func (g *gateway) Get(ctx context.Context, id string) (outbox.Operation, error) {
	_, op, err := g.find(ctx, id)
	return op, err
}

// fenced is the Provider the outbox calls. Do re-checks the dispatch's fence first: a lease lost
// after dispatching was journaled sends nothing and answers ambiguously, never definitely, so the
// attempt is uncertain and reconciled by lookup (Q6). Its class and lag are the effector's.
type fenced struct {
	eff   Effector
	fence Fence
}

func (f fenced) Do(ctx context.Context, idem string, payload []byte) error {
	fc, ok := ctx.Value(fenceKey{}).(fenceCall)
	if !ok {
		return fmt.Errorf("%w: dispatch carried no fence; nothing sent", ErrStaleToken)
	}
	if err := checkFence(ctx, f.fence, fc.resources, fc.presented); err != nil {
		return fmt.Errorf("lease lost before the provider call, nothing sent: %v", err) // ambiguous by design
	}
	return f.eff.Do(ctx, idem, payload)
}

func (f fenced) Lookup(ctx context.Context, idem string) (outbox.Presence, error) {
	return f.eff.Lookup(ctx, idem)
}

// VisibilityLag forwards the effector's declared lag; 0 (none declared) leaves the outbox default.
func (f fenced) VisibilityLag() time.Duration {
	if l, ok := f.eff.(outbox.VisibilityLagger); ok {
		return l.VisibilityLag()
	}
	return 0
}
