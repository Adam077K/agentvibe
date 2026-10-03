//go:build donetest

// Done-tests for B1-12b, the second half of the outbox (docs/vision-v3/14-BUILD-PLAN.md §6, B1-12:
// "Outbox + Operation IDs + reconciler; local effectors: git PR, preview deploy, founder-mailbox
// email"; acceptance "faults at 4 crash points -> one effect; `uncertain` never auto-retries").
// B1-12a, the outbox core, is kernel/internal/outbox and its done-tests are B0-17b's register.
// This file is hash-registered in build/done-tests/B1-12b.yml; effector.go is the contract the job
// implements and is not registered.
//
// Canon: 09a §2 (propose_effect), §6 and §7 (fencing, "held --> dispatching: journaled BEFORE the
// provider call · epoch checked", "proposed --> refused: … stale token"), §7.1 (business key),
// §7.2 (classes; mailbox send is check_before; a digest-pinned deploy is natural). Founder rulings
// A-C: docs/vision-v3/_process/FOUNDER-RULINGS-2026-10-02-outbox.md. The 2-minute and 15-minute
// figures are literals here, never the outbox's constants, so moving a constant cannot move a test.
//
// RE-FROZEN 2026-10-03, "2026-10-03 rulings B1-12b" (docs/vision-v3/_process/DR-B1-12B-RULINGS-2026-10-03.md):
// the venture comes from the job's lease, never the request (Q1); no lease is refused (Q2); the
// target is a string id (Q3); tokens are {resource: decimal string} (Q4); no request id (Q5); a
// lease lost mid-dispatch is uncertain, never definite, and the new holder sends only after a
// reconcile reads Absent (Q6); effectors are limited tightly until widened (Q7).
//
// Death is simulated as the outbox's own done-tests and Deps.Crash do: a hook or a provider panics
// on the goroutine of the Gateway call, and the next life opens a fresh Gateway on the same Dir.
// So the Gateway must call Deps.Crash and the effector's Do on the caller's goroutine.
//
// Run: go -C kernel test -count=1 -tags donetest ./internal/effector/
package effector_test

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"go/parser"
	"go/token"
	"io/fs"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/effector"
	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
	"github.com/Adam077K/agentvibe/kernel/internal/outbox"
	"github.com/Adam077K/agentvibe/kernel/internal/socket"
)

const (
	venture   = "keel"
	verb      = "test.send"
	job       = "J7"
	rulingA   = 2 * time.Minute  // founder ruling A: the default visibility lag
	rulingB   = 15 * time.Minute // founder ruling B: a call silent this long goes to Human
	goodSHA   = "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
	founderTo = "founder@mailbox.local"
)

var ctx = context.Background()

type fakeClock struct {
	mu sync.Mutex
	t  time.Time
}

func (c *fakeClock) Now() time.Time { c.mu.Lock(); defer c.mu.Unlock(); return c.t }
func (c *fakeClock) add(d time.Duration) {
	c.mu.Lock()
	c.t = c.t.Add(d)
	c.mu.Unlock()
}

// death is what a provider or hook panics with to simulate the worker dying there.
type death struct{ where string }

// testEff counts every request that reaches it. onDo runs after the request is counted; a nil
// return means the effect landed.
type testEff struct {
	mu        sync.Mutex
	class     outbox.Class
	sends     int
	landed    map[string]bool
	landFirst bool // the effect lands before onDo runs, whatever onDo then does
	onDo      func(n int) error
}

func newEff(c outbox.Class) *testEff { return &testEff{class: c, landed: map[string]bool{}} }

func (e *testEff) Class() outbox.Class { return e.class }
func (e *testEff) Do(_ context.Context, idem string, _ []byte) error {
	e.mu.Lock()
	e.sends++
	n, hook := e.sends, e.onDo
	if e.landFirst {
		e.landed[idem] = true
	}
	e.mu.Unlock()
	if hook != nil {
		if err := hook(n); err != nil {
			return err
		}
	}
	e.mu.Lock()
	e.landed[idem] = true
	e.mu.Unlock()
	return nil
}
func (e *testEff) Lookup(_ context.Context, idem string) (outbox.Presence, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.landed[idem] {
		return outbox.Present, nil
	}
	return outbox.Absent, nil
}
func (e *testEff) total() int { e.mu.Lock(); defer e.mu.Unlock(); return e.sends }

// lagEff is a testEff that declares its visibility lag.
type lagEff struct {
	*testEff
	lag time.Duration
}

func (e lagEff) VisibilityLag() time.Duration { return e.lag }

// claimFence backs effector.Fence with the real job:// lease (B1-05); down makes it unreachable.
type claimFence struct {
	c    lease.Claimer
	down atomic.Bool
}

func (f *claimFence) Check(ctx context.Context, resource string, tok uint64) error {
	if f.down.Load() {
		return errors.New("fencing authority unreachable")
	}
	id, ok := strings.CutPrefix(resource, "job://")
	if !ok {
		return fmt.Errorf("not a job resource: %q", resource)
	}
	return f.c.Check(ctx, id, tok)
}

// ventures is the job -> venture record admission keeps (Q1). J9 belongs to another venture.
type ventures map[string]string

func (v ventures) VentureOf(_ context.Context, resource string) (string, error) {
	if name, ok := v[resource]; ok {
		return name, nil
	}
	return "", fmt.Errorf("no venture recorded for %q", resource)
}

var jobVentures = ventures{"job://J7": venture, "job://J8": venture, "job://J99": venture, "job://J9": "other-venture"}

type world struct {
	t       *testing.T
	dir     string
	j       journal.Journal
	claims  lease.Claimer
	fence   *claimFence
	clock   *fakeClock
	eff     effector.Effector
	count   func() int
	crash   func(outbox.Point)
	payload journal.BlobRef
}

func newWorld(t *testing.T, eff effector.Effector, count func() int) *world {
	t.Helper()
	dir := t.TempDir()
	j, err := journal.Open(filepath.Join(dir, "kernel.db"))
	if err != nil {
		t.Fatalf("journal.Open: %v", err)
	}
	t.Cleanup(func() { j.Close() })
	c, err := lease.New(j)
	if err != nil {
		t.Fatalf("lease.New: %v", err)
	}
	ref, err := j.PutBlob(ctx, venture, []byte(`{"n":1}`))
	if err != nil {
		t.Fatalf("PutBlob: %v", err)
	}
	return &world{t: t, dir: dir, j: j, claims: c, fence: &claimFence{c: c}, eff: eff, count: count,
		clock: &fakeClock{t: time.Unix(1_800_000_000, 0)}, payload: ref}
}

func (w *world) open(worker string) effector.Gateway {
	w.t.Helper()
	gw, err := effector.Open(effector.Config{Dir: filepath.Join(w.dir, "gateway"), Venture: venture,
		WorkerID: worker, Clock: w.clock, Blobs: w.j, Fence: w.fence, Ventures: jobVentures,
		Effectors: map[string]effector.Effector{verb: w.eff}, Crash: w.crash})
	if err != nil {
		w.t.Fatalf("effector.Open: %v", err)
	}
	return gw
}

func (w *world) claim(runner string) lease.Claim {
	w.t.Helper()
	cl, err := w.claims.ClaimJob(ctx, job, runner, time.Hour)
	if err != nil {
		w.t.Fatalf("ClaimJob(%s): %v", runner, err)
	}
	return cl
}

// lose ends cl's lease and gives the job to runner: cl's token is stale from here on.
func (w *world) lose(cl lease.Claim, runner string) lease.Claim {
	w.t.Helper()
	if err := w.claims.Release(ctx, cl); err != nil {
		w.t.Fatalf("Release: %v", err)
	}
	next := w.claim(runner)
	if next.Token <= cl.Token {
		w.t.Fatalf("token did not advance: %d -> %d", cl.Token, next.Token)
	}
	return next
}

func tokensJSON(cl lease.Claim) string {
	return fmt.Sprintf(`{%q:%q}`, cl.Resource, strconv.FormatUint(cl.Token, 10))
}

func tokens(cl lease.Claim) effector.Tokens { return effector.Tokens{cl.Resource: cl.Token} }

func (w *world) cmd(ref string, cl lease.Claim) socket.ProposeEffect {
	return socket.ProposeEffect{Verb: verb, Target: json.RawMessage(`"supplier-44"`), BusinessRef: ref,
		PayloadRef: string(w.payload), LeaseTokens: json.RawMessage(tokensJSON(cl))}
}

func result(t *testing.T, raw json.RawMessage) effector.ProposeResult {
	t.Helper()
	var r effector.ProposeResult
	if err := json.Unmarshal(raw, &r); err != nil || r.OperationID == "" {
		t.Fatalf("result %s: %v; want {\"operation_id\":…,\"state\":…}", raw, err)
	}
	return r
}

func (w *world) propose(gw effector.Gateway, c socket.ProposeEffect) string {
	w.t.Helper()
	raw, err := gw.ProposeEffect(ctx, c)
	if err != nil {
		w.t.Fatalf("ProposeEffect: %v", err)
	}
	return result(w.t, raw).OperationID
}

func (w *world) sends(want int, when string) {
	w.t.Helper()
	if got := w.count(); got != want {
		w.t.Fatalf("%s: %d requests reached the provider, want %d", when, got, want)
	}
}

func (w *world) state(gw effector.Gateway, id string, want outbox.State, when string) outbox.Operation {
	w.t.Helper()
	op, err := gw.Get(ctx, id)
	if err != nil || op.State != want {
		w.t.Fatalf("%s: Get = %+v, %v; want state %s", when, op, err, want)
	}
	return op
}

func mustDie(t *testing.T, what string, f func()) {
	t.Helper()
	defer func() {
		if r := recover(); r == nil {
			t.Fatalf("%s: want the simulated death, got a return", what)
		} else if _, ok := r.(death); !ok {
			panic(r)
		}
	}()
	f()
}

// backend is the B1-03 socket's Backend with the Gateway behind propose_effect.
type backend struct{ gw effector.Gateway }

var errOther = errors.New("not B1-12b's verb")

func (b backend) ProposeEffect(ctx context.Context, c socket.ProposeEffect) (json.RawMessage, error) {
	return b.gw.ProposeEffect(ctx, c)
}
func (backend) RequestLeases(context.Context, socket.RequestLeases) (json.RawMessage, error) {
	return nil, errOther
}
func (backend) AdmitJob(context.Context, socket.AdmitJob) (json.RawMessage, error) {
	return nil, errOther
}
func (backend) Compile(context.Context, socket.Compile) (json.RawMessage, error) {
	return nil, errOther
}
func (backend) Renew(context.Context, socket.LeaseCommand) (json.RawMessage, error) {
	return nil, errOther
}
func (backend) Release(context.Context, socket.LeaseCommand) (json.RawMessage, error) {
	return nil, errOther
}

// TestB112bProposeOverSocketIsOneOperation: propose_effect lines through the real B1-03 socket,
// the same business key sent twice on one connection and once on each of six concurrent ones,
// produce one Operation, and proposing never reaches the provider.
func TestB112bProposeOverSocketIsOneOperation(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	gw := w.open("w1")
	cl := w.claim("A")
	sockDir, err := os.MkdirTemp("", "b112b") // short: a Unix socket path is at most 104 bytes
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(sockDir) })
	srv, err := socket.Serve(ctx, socket.Config{SocketPath: filepath.Join(sockDir, "avk.sock"),
		JournalPath: filepath.Join(sockDir, "avk.db"), UserlandGID: os.Getgid(), Backend: backend{gw}})
	if err != nil {
		t.Fatalf("socket.Serve: %v", err)
	}
	t.Cleanup(func() { srv.Close() })
	line := func(ref string) string {
		return fmt.Sprintf(`{"cmd":"propose_effect","verb":%q,"target":"supplier-44","business_ref":%q,"payload_ref":%q,"lease_tokens":%s}`,
			verb, ref, w.payload, tokensJSON(cl))
	}
	send := func(conn net.Conn, rd *bufio.Reader, l string) (socket.Response, error) {
		if _, err := conn.Write([]byte(l + "\n")); err != nil {
			return socket.Response{}, err
		}
		b, err := rd.ReadBytes('\n')
		if err != nil {
			return socket.Response{}, err
		}
		var r socket.Response
		return r, json.Unmarshal(b, &r)
	}
	type answer struct {
		r   socket.Response
		err error
	}
	var mu sync.Mutex
	var answers []answer
	var wg sync.WaitGroup
	for c := 0; c < 7; c++ {
		wg.Add(1)
		go func(c int) {
			defer wg.Done()
			conn, err := net.DialTimeout("unix", filepath.Join(sockDir, "avk.sock"), 5*time.Second)
			if err != nil {
				mu.Lock()
				answers = append(answers, answer{err: err})
				mu.Unlock()
				return
			}
			defer conn.Close()
			conn.SetDeadline(time.Now().Add(30 * time.Second))
			rd := bufio.NewReader(conn)
			n := 1
			if c == 0 {
				n = 2 // the duplicate on one connection
			}
			for i := 0; i < n; i++ {
				r, err := send(conn, rd, line("inv-8812"))
				mu.Lock()
				answers = append(answers, answer{r, err})
				mu.Unlock()
			}
		}(c)
	}
	wg.Wait()
	if len(answers) != 8 {
		t.Fatalf("%d answers, want 8", len(answers))
	}
	id := ""
	for i, a := range answers {
		if a.err != nil || !a.r.OK {
			t.Fatalf("answer %d: %+v, %v; want ok", i, a.r, a.err)
		}
		r := result(t, a.r.Result)
		if id == "" {
			id = r.OperationID
		}
		if r.OperationID != id || r.State != outbox.Proposed {
			t.Fatalf("answer %d: %+v; want operation %s, proposed", i, r, id)
		}
	}
	w.sends(0, "after proposing")
	conn, err := net.DialTimeout("unix", filepath.Join(sockDir, "avk.sock"), 5*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	rd := bufio.NewReader(conn)
	other, err := send(conn, rd, line("inv-8813"))
	if err != nil || !other.OK || result(t, other.Result).OperationID == id {
		t.Fatalf("another business_ref: %+v, %v; want ok with a new Operation", other, err)
	}
	// Q1: the venture is never taken from the request; a line naming one is refused before the Gateway.
	withVenture := strings.Replace(line("inv-8814"), `{"cmd"`, `{"venture":"other-venture","cmd"`, 1)
	if r, err := send(conn, rd, withVenture); err != nil || r.OK || r.Reason != socket.ReasonInvalidField {
		t.Fatalf("Q1: a request naming a venture: %+v, %v; want refused, invalid_field", r, err)
	}
	if op, err := gw.Dispatch(ctx, id, tokens(cl)); err != nil || op.State != outbox.Confirmed {
		t.Fatalf("Dispatch = %+v, %v; want confirmed", op, err)
	}
	w.sends(1, "after one dispatch")
	again, err := send(conn, rd, line("inv-8812"))
	if err != nil || !again.OK {
		t.Fatalf("re-proposal after confirm: %+v, %v", again, err)
	}
	if r := result(t, again.Result); r.OperationID != id || r.State != outbox.Confirmed {
		t.Fatalf("re-proposal after confirm = %+v; want %s confirmed", r, id)
	}
	w.sends(1, "after re-proposing a confirmed Operation")
}

// TestB112bConcurrentDuplicatesAcrossGatewaysAreOneOperation: the same propose_effect, sixteen
// times at once through two Gateways on one Dir (two workers), is one Operation.
func TestB112bConcurrentDuplicatesAcrossGatewaysAreOneOperation(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	gws := []effector.Gateway{w.open("w1"), w.open("w2")}
	cl := w.claim("A")
	ids := make([]string, 16)
	errs := make([]error, 16)
	var wg sync.WaitGroup
	for i := range ids {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			raw, err := gws[i%2].ProposeEffect(ctx, w.cmd("inv-1", cl))
			if errs[i] = err; err == nil {
				var r effector.ProposeResult
				errs[i] = json.Unmarshal(raw, &r)
				ids[i] = r.OperationID
			}
		}(i)
	}
	wg.Wait()
	for i := range ids {
		if errs[i] != nil || ids[i] == "" || ids[i] != ids[0] {
			t.Fatalf("proposal %d = %q, %v; want %q for every one", i, ids[i], errs[i], ids[0])
		}
	}
	w.sends(0, "after proposing")
	if _, err := gws[1].Dispatch(ctx, ids[0], tokens(cl)); err != nil {
		t.Fatalf("Dispatch: %v", err)
	}
	if op, err := gws[0].Dispatch(ctx, ids[0], tokens(cl)); err != nil || op.State != outbox.Confirmed {
		t.Fatalf("second Dispatch = %+v, %v; want confirmed, no call", op, err)
	}
	w.sends(1, "after dispatching from both workers")
}

// TestB112bProposeRefusals: what propose_effect refuses, each with its named error and nothing sent.
// The ErrUndecided cases are where canon is silent (listed OPEN in the register).
func TestB112bProposeRefusals(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	gw := w.open("w1")
	old := w.claim("A")
	cl := w.lose(old, "B")
	other, err := w.j.PutBlob(ctx, "another-venture", []byte(`{"n":2}`))
	if err != nil {
		t.Fatal(err)
	}
	otherVenture, err := w.claims.ClaimJob(ctx, "J9", "B", time.Hour) // current, but not keel's
	if err != nil {
		t.Fatal(err)
	}
	mod := func(f func(*socket.ProposeEffect)) socket.ProposeEffect {
		c := w.cmd("inv-1", cl)
		f(&c)
		return c
	}
	raw := func(s string) func(*socket.ProposeEffect) {
		return func(c *socket.ProposeEffect) { c.LeaseTokens = json.RawMessage(s) }
	}
	cases := []struct {
		name string
		c    socket.ProposeEffect
		want error // nil: any error
	}{
		{"unknown verb", mod(func(c *socket.ProposeEffect) { c.Verb = "payment.pay" }), effector.ErrUnknownVerb},
		{"payload ref names no blob", mod(func(c *socket.ProposeEffect) { c.PayloadRef = "sha256:" + strings.Repeat("0", 64) }), effector.ErrUnknownPayload},
		{"payload of another venture", mod(func(c *socket.ProposeEffect) { c.PayloadRef = string(other) }), effector.ErrUnknownPayload},
		{"stale lease token", mod(raw(tokensJSON(old))), effector.ErrStaleToken},
		{"token of a never-claimed job", mod(raw(`{"job://J99":"1"}`)), effector.ErrStaleToken},
		{"Q2: no lease at all", mod(raw(`{}`)), effector.ErrNoLease},
		{"Q3: target is an object", mod(func(c *socket.ProposeEffect) { c.Target = json.RawMessage(`{"id":"supplier-44"}`) }), effector.ErrInvalidTarget},
		{"Q3: target is a number", mod(func(c *socket.ProposeEffect) { c.Target = json.RawMessage(`44`) }), effector.ErrInvalidTarget},
		{"Q1: lease of another venture", mod(raw(tokensJSON(otherVenture))), effector.ErrWrongVenture},
		{"Q1: one lease of another venture among ours", mod(raw(fmt.Sprintf(`{%q:%q,%q:%q}`, cl.Resource,
			strconv.FormatUint(cl.Token, 10), otherVenture.Resource, strconv.FormatUint(otherVenture.Token, 10)))), effector.ErrWrongVenture},
		{"tokens are an array", mod(raw(`["job://J7"]`)), nil},
		{"token is a JSON number", mod(raw(fmt.Sprintf(`{%q:%d}`, cl.Resource, cl.Token))), nil},
		{"token has a leading zero", mod(raw(fmt.Sprintf(`{%q:"0%d"}`, cl.Resource, cl.Token))), nil},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			res, err := gw.ProposeEffect(ctx, tc.c)
			if err == nil || (tc.want != nil && !errors.Is(err, tc.want)) {
				t.Fatalf("ProposeEffect = %s, %v; want an error wrapping %v", res, err, tc.want)
			}
		})
	}
	w.sends(0, "after the refusals")
	if id := w.propose(gw, w.cmd("inv-1", cl)); id == "" {
		t.Fatal("the well-formed proposal was not accepted")
	}
}

// TestB112bDispatchRefusesStaleLease: a dispatch presenting a lease token that is no longer
// current, or none for a resource the proposal named, or one the fence cannot check, sends nothing
// and leaves the Operation as it was. The current holder then dispatches it once.
func TestB112bDispatchRefusesStaleLease(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	gw := w.open("w1")
	a := w.claim("A")
	id := w.propose(gw, w.cmd("inv-1", a))
	b := w.lose(a, "B")
	otherJob, err := w.claims.ClaimJob(ctx, "J8", "B", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	refused := []struct {
		name string
		p    effector.Tokens
	}{
		{"old epoch", tokens(a)},
		{"nil tokens", nil},
		{"no token for the proposal's resource", effector.Tokens{}},
		{"only another resource's current token", tokens(otherJob)},
		{"a token from the future", effector.Tokens{b.Resource: b.Token + 1}},
	}
	for _, r := range refused {
		if op, err := gw.Dispatch(ctx, id, r.p); !errors.Is(err, effector.ErrStaleToken) {
			t.Fatalf("%s: Dispatch = %+v, %v; want ErrStaleToken", r.name, op, err)
		}
		w.sends(0, r.name)
		if op := w.state(gw, id, outbox.Proposed, r.name); op.Attempt != 0 {
			t.Fatalf("%s: attempt %d journaled; a refused dispatch journals none", r.name, op.Attempt)
		}
	}
	w.fence.down.Store(true)
	if op, err := gw.Dispatch(ctx, id, tokens(b)); err == nil {
		t.Fatalf("fence unreachable: Dispatch = %+v, nil; an unchecked token is not current", op)
	}
	w.sends(0, "fence unreachable")
	w.state(gw, id, outbox.Proposed, "fence unreachable")
	w.fence.down.Store(false)
	if op, err := gw.Dispatch(ctx, id, tokens(b)); err != nil || op.State != outbox.Confirmed {
		t.Fatalf("current holder: Dispatch = %+v, %v; want confirmed", op, err)
	}
	w.sends(1, "current holder")
}

// TestB112bFenceSurvivesRestart: the resources a proposal named are durable. A replacement
// Gateway (a new process on the same Dir) refuses a dispatch that omits them, and a re-proposal
// under the new holder's lease returns the same Operation.
func TestB112bFenceSurvivesRestart(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	a := w.claim("A")
	id := w.propose(w.open("w1"), w.cmd("inv-1", a))
	otherJob, err := w.claims.ClaimJob(ctx, "J8", "C", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	gw2 := w.open("w2")
	for name, p := range map[string]effector.Tokens{"none": {}, "another resource": tokens(otherJob)} {
		if _, err := gw2.Dispatch(ctx, id, p); !errors.Is(err, effector.ErrStaleToken) {
			t.Fatalf("after restart, %s: Dispatch err = %v; want ErrStaleToken", name, err)
		}
	}
	w.sends(0, "after restart")
	b := w.lose(a, "B")
	gw3 := w.open("w3")
	if again := w.propose(gw3, w.cmd("inv-1", b)); again != id {
		t.Fatalf("re-proposal under the new lease = %q; want the existing %q", again, id)
	}
	if _, err := gw3.Dispatch(ctx, id, tokens(a)); !errors.Is(err, effector.ErrStaleToken) {
		t.Fatalf("old holder after re-proposal: err = %v; want ErrStaleToken", err)
	}
	w.sends(0, "old holder after re-proposal")
	if op, err := gw3.Dispatch(ctx, id, tokens(b)); err != nil || op.State != outbox.Confirmed {
		t.Fatalf("new holder: Dispatch = %+v, %v; want confirmed", op, err)
	}
	w.sends(1, "new holder")
}

// TestB112bLeaseLostAfterDispatchingSendsNothing: the lease is lost after the attempt is journaled
// and before the provider call. The re-check before Do sends nothing, but the attempt is NOT
// definite (Q6): it is uncertain, the new holder is refused until a reconcile past the 2-minute
// lag reads Absent, and then it sends exactly once.
func TestB112bLeaseLostAfterDispatchingSendsNothing(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	a := w.claim("A")
	var b lease.Claim
	var fired bool
	w.crash = func(p outbox.Point) {
		if p == outbox.AfterDispatchingJournaled && !fired {
			fired = true
			b = w.lose(a, "B")
		}
	}
	gw := w.open("A")
	id := w.propose(gw, w.cmd("inv-1", a))
	if op, err := gw.Dispatch(ctx, id, tokens(a)); !errors.Is(err, outbox.ErrUncertain) {
		t.Fatalf("lease lost before the provider call: Dispatch = %+v, %v; want ErrUncertain (Q6)", op, err)
	}
	if !fired {
		t.Fatal("Crash(AfterDispatchingJournaled) never fired: Config.Crash must reach the outbox")
	}
	w.sends(0, "lease lost before the provider call")
	w.state(gw, id, outbox.Uncertain, "lease lost mid-dispatch (Q6: never definite)")
	gwB := w.open("B")
	if err := gwB.Reconcile(ctx); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	if op, err := gwB.Dispatch(ctx, id, tokens(b)); !errors.Is(err, outbox.ErrUncertain) {
		t.Fatalf("new holder inside the lag: Dispatch = %+v, %v; want ErrUncertain", op, err)
	}
	w.sends(0, "new holder inside the lag")
	w.clock.add(rulingA + time.Minute)
	if err := gwB.Reconcile(ctx); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	w.sends(0, "Reconcile never dispatches")
	if op, err := gwB.Dispatch(ctx, id, tokens(b)); err != nil || op.State != outbox.Confirmed {
		t.Fatalf("new holder after Absent past the lag: Dispatch = %+v, %v; want confirmed", op, err)
	}
	w.sends(1, "new holder after Absent past the lag")
}

// TestB112bLeaseLostInFlightEffectHappensOnce: the old holder's effect LANDS and its lease is lost
// while the call is in flight (Q6). However the call ends — the worker dies, it times out, or it
// answers ok — the new holder never sends: its dispatch is refused while the attempt is
// unresolved, and a reconcile finds the effect Present. The effect happens exactly once.
func TestB112bLeaseLostInFlightEffectHappensOnce(t *testing.T) {
	for _, end := range []string{"worker dies", "call times out", "call answers ok"} {
		t.Run(end, func(t *testing.T) {
			e := newEff(outbox.CheckBefore)
			e.landFirst = true
			w := newWorld(t, e, e.total)
			a := w.claim("A")
			var b lease.Claim
			e.onDo = func(int) error {
				b = w.lose(a, "B")
				switch end {
				case "worker dies":
					panic(death{"provider in flight"})
				case "call times out":
					return errors.New("timeout")
				}
				return nil
			}
			gwA := w.open("A")
			id := w.propose(gwA, w.cmd("inv-1", a))
			switch end {
			case "worker dies":
				mustDie(t, "Dispatch", func() { gwA.Dispatch(ctx, id, tokens(a)) })
			case "call times out":
				if _, err := gwA.Dispatch(ctx, id, tokens(a)); !errors.Is(err, outbox.ErrUncertain) {
					t.Fatalf("old holder: err = %v; want ErrUncertain", err)
				}
			default:
				if op, err := gwA.Dispatch(ctx, id, tokens(a)); err != nil || op.State != outbox.Confirmed {
					t.Fatalf("old holder, provider ok: Dispatch = %+v, %v; want confirmed (a Receipt)", op, err)
				}
			}
			w.sends(1, "the old holder's landed call")
			gwB := w.open("B")
			if end != "call answers ok" {
				if op, err := gwB.Dispatch(ctx, id, tokens(b)); !errors.Is(err, outbox.ErrUncertain) {
					t.Fatalf("new holder before any reconcile: Dispatch = %+v, %v; want refused, ErrUncertain", op, err)
				}
				w.sends(1, "new holder before any reconcile")
			}
			for _, step := range []time.Duration{0, rulingA + time.Minute, time.Hour} {
				w.clock.add(step)
				if err := gwB.Reconcile(ctx); err != nil {
					t.Fatalf("Reconcile: %v", err)
				}
				if op, err := gwB.Dispatch(ctx, id, tokens(b)); err != nil || op.State != outbox.Confirmed {
					t.Fatalf("new holder at +%v: Dispatch = %+v, %v; want confirmed with no call", step, op, err)
				}
				w.sends(1, fmt.Sprintf("new holder at +%v", step))
			}
		})
	}
}

// TestB112bCrashBetweenLeaseLossAndDispatchSendsNothing: the worker dies after journaling the
// attempt, its lease is then lost, and its replacement still presents the old token: nothing is
// sent. The current holder reconciles and dispatches once.
func TestB112bCrashBetweenLeaseLossAndDispatchSendsNothing(t *testing.T) {
	e := newEff(outbox.CheckBefore)
	w := newWorld(t, e, e.total)
	var dead bool
	w.crash = func(p outbox.Point) {
		if p == outbox.AfterDispatchingJournaled && !dead {
			dead = true
			panic(death{string(p)})
		}
	}
	a := w.claim("A")
	gwA := w.open("A")
	id := w.propose(gwA, w.cmd("inv-1", a))
	mustDie(t, "Dispatch", func() { gwA.Dispatch(ctx, id, tokens(a)) })
	w.sends(0, "the death")
	b := w.lose(a, "B")
	gwA2 := w.open("A-restarted")
	if err := gwA2.Reconcile(ctx); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	w.sends(0, "reconcile after the death")
	if op, err := gwA2.Dispatch(ctx, id, tokens(a)); !errors.Is(err, effector.ErrStaleToken) {
		t.Fatalf("restarted old holder: Dispatch = %+v, %v; want ErrStaleToken", op, err)
	}
	w.sends(0, "restarted old holder")
	gwB := w.open("B")
	if err := gwB.Reconcile(ctx); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	if op, err := gwB.Dispatch(ctx, id, tokens(b)); err != nil || op.State != outbox.Confirmed {
		t.Fatalf("new holder: Dispatch = %+v, %v; want confirmed", op, err)
	}
	w.sends(1, "new holder")
}

// dieOnce makes the provider's first request land nowhere and kill its worker (ruling C's case:
// a call that never answered).
func dieOnce(e *testEff) {
	e.onDo = func(n int) error {
		if n == 1 {
			panic(death{"provider in flight"})
		}
		return nil
	}
}

// lagCase dispatches through the Gateway, the worker dies in flight, and a reconciler reads
// Absent at early (inside the lag: no re-send) and at late (past the lag measured from the later
// of the send and the early uncertain record, ruling A as implemented: exactly one re-send).
func lagCase(t *testing.T, eff effector.Effector, e *testEff, early, late time.Duration) {
	t.Helper()
	dieOnce(e)
	w := newWorld(t, eff, e.total)
	a := w.claim("A")
	id := w.propose(w.open("A"), w.cmd("inv-1", a))
	mustDie(t, "Dispatch", func() { w.open("A").Dispatch(ctx, id, tokens(a)) })
	w.clock.add(early)
	gw := w.open("R1")
	if err := gw.Reconcile(ctx); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	if op, err := gw.Dispatch(ctx, id, tokens(a)); !errors.Is(err, outbox.ErrUncertain) {
		t.Fatalf("Absent at +%v, inside the lag: Dispatch = %+v, %v; want ErrUncertain", early, op, err)
	}
	w.sends(1, fmt.Sprintf("Absent at +%v", early))
	w.clock.add(late - early)
	gw = w.open("R2")
	if err := gw.Reconcile(ctx); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	w.sends(1, "Reconcile never dispatches")
	if op, err := gw.Dispatch(ctx, id, tokens(a)); err != nil || op.State != outbox.Confirmed {
		t.Fatalf("Absent at +%v, past the lag: Dispatch = %+v, %v; want one re-send, confirmed", late, op, err)
	}
	w.sends(2, fmt.Sprintf("Absent at +%v", late))
}

// TestB112bLagGuardThroughGateway: ruling A through the Gateway. An effector's declared lag
// reaches the outbox; a lag of zero or less, or none declared, is the 2-minute default.
func TestB112bLagGuardThroughGateway(t *testing.T) {
	t.Run("declared 10m", func(t *testing.T) {
		e := newEff(outbox.CheckBefore)
		lagCase(t, lagEff{e, 10 * time.Minute}, e, 3*time.Minute, 14*time.Minute)
	})
	t.Run("declared 0 is the default", func(t *testing.T) {
		e := newEff(outbox.CheckBefore)
		lagCase(t, lagEff{e, 0}, e, rulingA-time.Second, 2*rulingA)
	})
	t.Run("declared negative is the default", func(t *testing.T) {
		e := newEff(outbox.CheckBefore)
		lagCase(t, lagEff{e, -time.Hour}, e, rulingA-time.Second, 2*rulingA)
	})
	t.Run("undeclared is the default", func(t *testing.T) {
		e := newEff(outbox.CheckBefore)
		lagCase(t, e, e, rulingA-time.Second, 2*rulingA)
	})
}

// TestB112bRulingsBAndCThroughGateway: founder rulings B and C hold when the Operation came in
// through propose_effect and is dispatched through the Gateway.
func TestB112bRulingsBAndCThroughGateway(t *testing.T) {
	setup := func(t *testing.T, onDo func(w *world) func(int) error) (*world, string, lease.Claim) {
		e := newEff(outbox.CheckBefore)
		w := newWorld(t, e, e.total)
		e.onDo = onDo(w)
		a := w.claim("A")
		return w, w.propose(w.open("A"), w.cmd("inv-1", a)), a
	}
	never := func(w *world, gw effector.Gateway, id string, a lease.Claim, sends int) {
		w.t.Helper()
		w.clock.add(time.Hour)
		if err := gw.Reconcile(ctx); err != nil {
			w.t.Fatalf("Reconcile: %v", err)
		}
		if op, err := gw.Dispatch(ctx, id, tokens(a)); !errors.Is(err, outbox.ErrUncertain) {
			w.t.Fatalf("Dispatch after Human = %+v, %v; want ErrUncertain", op, err)
		}
		w.state(gw, id, outbox.Human, "an hour later")
		w.sends(sends, "an hour later")
	}
	t.Run("B: silent 15m then a timeout goes to Human and is never re-sent", func(t *testing.T) {
		w, id, a := setup(t, func(w *world) func(int) error {
			return func(int) error { w.clock.add(rulingB + time.Minute); return errors.New("timeout") }
		})
		gw := w.open("A")
		if _, err := gw.Dispatch(ctx, id, tokens(a)); !errors.Is(err, outbox.ErrUncertain) {
			t.Fatalf("Dispatch err = %v; want ErrUncertain", err)
		}
		w.state(gw, id, outbox.Human, "after the hung call")
		never(w, w.open("R"), id, a, 1)
	})
	t.Run("C: dead before 15m, Absent past the lag: one retry, a second death is Human", func(t *testing.T) {
		w, id, a := setup(t, func(*world) func(int) error {
			return func(int) error { panic(death{"provider in flight"}) }
		})
		mustDie(t, "first send", func() { w.open("A").Dispatch(ctx, id, tokens(a)) })
		w.clock.add(5 * time.Minute)
		gw := w.open("R1")
		if err := gw.Reconcile(ctx); err != nil {
			t.Fatalf("Reconcile: %v", err)
		}
		mustDie(t, "the one retry", func() { gw.Dispatch(ctx, id, tokens(a)) })
		w.sends(2, "the one retry")
		w.clock.add(5 * time.Minute)
		gw = w.open("R2")
		if err := gw.Reconcile(ctx); err != nil {
			t.Fatalf("Reconcile: %v", err)
		}
		w.state(gw, id, outbox.Human, "second unanswered death")
		never(w, gw, id, a, 2)
	})
	t.Run("C: dead, found past 15m: Human, no re-send", func(t *testing.T) {
		w, id, a := setup(t, func(*world) func(int) error {
			return func(int) error { panic(death{"provider in flight"}) }
		})
		mustDie(t, "first send", func() { w.open("A").Dispatch(ctx, id, tokens(a)) })
		w.clock.add(rulingB)
		gw := w.open("R")
		if err := gw.Reconcile(ctx); err != nil {
			t.Fatalf("Reconcile: %v", err)
		}
		w.state(gw, id, outbox.Human, "dead worker found at 15m")
		never(w, gw, id, a, 1)
	})
}

// TestB112bEffectorClassReachesOutbox: the Operation takes its class from the effector. An
// at_most_once effect whose call ends ambiguously goes straight to Human (09a §7.2).
func TestB112bEffectorClassReachesOutbox(t *testing.T) {
	e := newEff(outbox.AtMostOnce)
	e.onDo = func(int) error { return errors.New("connection reset") }
	w := newWorld(t, e, e.total)
	a := w.claim("A")
	gw := w.open("A")
	id := w.propose(gw, w.cmd("inv-1", a))
	if _, err := gw.Dispatch(ctx, id, tokens(a)); !errors.Is(err, outbox.ErrUncertain) {
		t.Fatalf("Dispatch err = %v; want ErrUncertain", err)
	}
	if op := w.state(gw, id, outbox.Human, "at_most_once, ambiguous"); op.Class != outbox.AtMostOnce {
		t.Fatalf("Operation class = %s; want at_most_once", op.Class)
	}
}

// effectiveLag is the lag the outbox applies to e (ruling A: <= 0 or undeclared is the default).
func effectiveLag(e effector.Effector) time.Duration {
	if l, ok := e.(outbox.VisibilityLagger); ok && l.VisibilityLag() > 0 {
		return l.VisibilityLag()
	}
	return rulingA
}

func mustJSON(t *testing.T, v any) []byte {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func presence(t *testing.T, e effector.Effector, idem string, want outbox.Presence) {
	t.Helper()
	if p, err := e.Lookup(ctx, idem); err != nil || p != want {
		t.Fatalf("Lookup(%s) = %v, %v; want %v", idem, p, err, want)
	}
}

func rejected(t *testing.T, what string, err error, outside bool) {
	t.Helper()
	if !errors.Is(err, outbox.ErrRejected) || (outside && !errors.Is(err, effector.ErrOutsideSandbox)) {
		t.Fatalf("%s: err = %v; want outbox.ErrRejected (and ErrOutsideSandbox: %v)", what, err, outside)
	}
}

// messages returns every delivered message in a Maildir.
func messages(t *testing.T, dir string) []string {
	t.Helper()
	var out []string
	for _, sub := range []string{"new", "cur"} {
		ents, err := os.ReadDir(filepath.Join(dir, sub))
		if err != nil {
			t.Fatalf("read %s: %v", sub, err)
		}
		for _, e := range ents {
			b, err := os.ReadFile(filepath.Join(dir, sub, e.Name()))
			if err != nil {
				t.Fatal(err)
			}
			out = append(out, string(b))
		}
	}
	return out
}

func messageID(msg string) string {
	for _, l := range strings.Split(msg, "\n") {
		if k, v, ok := strings.Cut(l, ":"); ok && strings.EqualFold(strings.TrimSpace(k), "Message-ID") {
			return v
		}
	}
	return ""
}

// TestB112bMailboxEffector: the founder-mailbox effector is check_before by Message-ID, delivers to
// a local Maildir only, at most once per idem, and only to the founder.
func TestB112bMailboxEffector(t *testing.T) {
	root := t.TempDir()
	dir := filepath.Join(root, "mail")
	e, err := effector.NewMailbox(effector.MailboxConfig{Dir: dir, Founder: founderTo})
	if err != nil {
		t.Fatalf("NewMailbox: %v", err)
	}
	if e.Class() != outbox.CheckBefore {
		t.Fatalf("class %s; want check_before (09a §7.2)", e.Class())
	}
	if l := effectiveLag(e); l != rulingA {
		t.Fatalf("VisibilityLag 0: effective lag %v; want the %v default", l, rulingA)
	}
	presence(t, e, "01OPMAIL1", outbox.Absent)
	msg := mustJSON(t, effector.MailPayload{To: founderTo, Subject: "Subject-8812", Body: "Body-8812"})
	if err := e.Do(ctx, "01OPMAIL1", msg); err != nil {
		t.Fatalf("Do: %v", err)
	}
	presence(t, e, "01OPMAIL1", outbox.Present)
	presence(t, e, "01OPMAIL2", outbox.Absent)
	if err := e.Do(ctx, "01OPMAIL1", msg); err != nil {
		t.Fatalf("second Do, same idem: %v", err)
	}
	got := messages(t, dir)
	if len(got) != 1 {
		t.Fatalf("%d messages after two Do with one idem; want 1", len(got))
	}
	for _, want := range []string{founderTo, "Subject-8812", "Body-8812"} {
		if !strings.Contains(got[0], want) {
			t.Fatalf("message lacks %q:\n%s", want, got[0])
		}
	}
	if !strings.Contains(messageID(got[0]), "01OPMAIL1") {
		t.Fatalf("Message-ID %q does not carry the idem", messageID(got[0]))
	}
	err = e.Do(ctx, "01OPMAIL3", mustJSON(t, effector.MailPayload{To: "someone@example.com", Subject: "s", Body: "b"}))
	rejected(t, "a recipient other than the founder", err, true)
	err = e.Do(ctx, "01OPMAIL5", mustJSON(t, effector.MailPayload{To: strings.ToUpper(founderTo), Subject: "s", Body: "b"}))
	rejected(t, "Q7: the founder's address in another case (exact match only, until widened)", err, true)
	rejected(t, "a payload that is not a message", e.Do(ctx, "01OPMAIL4", []byte("not json")), false)
	presence(t, e, "01OPMAIL3", outbox.Absent)
	if n := len(messages(t, dir)); n != 1 {
		t.Fatalf("%d messages after the refusals; want 1", n)
	}
	if ents, _ := os.ReadDir(root); len(ents) != 1 {
		t.Fatalf("%d entries beside the Maildir; the effector writes only inside it", len(ents))
	}
	if err := os.Rename(dir, dir+".gone"); err != nil {
		t.Fatal(err)
	}
	if p, err := e.Lookup(ctx, "01OPMAIL1"); err == nil {
		t.Fatalf("Lookup with the Maildir gone = %v, nil; a failed read is an error, never an answer", p)
	}
	lagged, err := effector.NewMailbox(effector.MailboxConfig{Dir: filepath.Join(root, "m2"), Founder: founderTo,
		VisibilityLag: 7 * time.Minute})
	if err != nil {
		t.Fatalf("NewMailbox: %v", err)
	}
	if l := effectiveLag(lagged); l != 7*time.Minute {
		t.Fatalf("VisibilityLag 7m: effective lag %v", l)
	}
}

type fakeGit struct {
	mu        sync.Mutex
	prs       map[string]effector.PRPayload
	creates   int
	createErr error
	findErr   error
}

func (g *fakeGit) CreatePR(_ context.Context, pr effector.PRPayload, marker string) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.creates++
	if g.createErr != nil {
		return g.createErr
	}
	g.prs[marker] = pr
	return nil
}
func (g *fakeGit) FindPR(_ context.Context, marker string) (bool, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.findErr != nil {
		return false, g.findErr
	}
	_, ok := g.prs[marker]
	return ok, nil
}

// TestB112bGitPREffector: the git PR effector maps Do/Lookup onto a GitHost (a fake: no network),
// queries before it opens, and opens PRs only in its configured repos.
func TestB112bGitPREffector(t *testing.T) {
	g := &fakeGit{prs: map[string]effector.PRPayload{}}
	e, err := effector.NewGitPR(effector.GitPRConfig{Host: g, Repos: []string{"adam077k/venture-keel"},
		VisibilityLag: 3 * time.Minute})
	if err != nil {
		t.Fatalf("NewGitPR: %v", err)
	}
	if e.Class() != outbox.CheckBefore {
		t.Fatalf("class %s; want check_before", e.Class())
	}
	if l := effectiveLag(e); l != 3*time.Minute {
		t.Fatalf("VisibilityLag 3m: effective lag %v", l)
	}
	pr := effector.PRPayload{Repo: "adam077k/venture-keel", Base: "main", Head: "feat/x", Title: "T-1", Body: "B-1"}
	presence(t, e, "01OPPR1", outbox.Absent)
	if err := e.Do(ctx, "01OPPR1", mustJSON(t, pr)); err != nil {
		t.Fatalf("Do: %v", err)
	}
	if got := g.prs["01OPPR1"]; got != pr {
		t.Fatalf("host holds %+v under the idem; want %+v", got, pr)
	}
	presence(t, e, "01OPPR1", outbox.Present)
	presence(t, e, "01OPPR2", outbox.Absent)
	if err := e.Do(ctx, "01OPPR1", mustJSON(t, pr)); err != nil || g.creates != 1 {
		t.Fatalf("second Do, same idem: %v, %d creates; want nil, 1 (query before send)", err, g.creates)
	}
	outside := pr
	outside.Repo = "someone/else"
	rejected(t, "a repo outside the sandbox", e.Do(ctx, "01OPPR3", mustJSON(t, outside)), true)
	rejected(t, "a payload that is not a PR", e.Do(ctx, "01OPPR4", []byte(`[1]`)), false)
	if g.creates != 1 {
		t.Fatalf("%d creates after refusals; want 1", g.creates)
	}
	g.createErr = fmt.Errorf("%w: 422 unprocessable", effector.ErrHostRejected)
	rejected(t, "host definitely refused", e.Do(ctx, "01OPPR5", mustJSON(t, pr)), false)
	g.createErr = errors.New("502 bad gateway")
	if err := e.Do(ctx, "01OPPR6", mustJSON(t, pr)); err == nil || errors.Is(err, outbox.ErrRejected) {
		t.Fatalf("ambiguous host error: err = %v; want an error that is not ErrRejected", err)
	}
	g.createErr, g.findErr = nil, errors.New("timeout")
	before := g.creates
	if p, err := e.Lookup(ctx, "01OPPR1"); err == nil {
		t.Fatalf("Lookup with the host failing = %v, nil; want an error", p)
	}
	if err := e.Do(ctx, "01OPPR7", mustJSON(t, pr)); err == nil || errors.Is(err, outbox.ErrRejected) || g.creates != before {
		t.Fatalf("Do with the query failing: err = %v, creates %d -> %d; want an ambiguous error and no create",
			err, before, g.creates)
	}
}

type fakeDeploy struct {
	mu        sync.Mutex
	deploys   map[string]string // marker -> project@digest
	n         int
	deployErr error
	findErr   error
}

func (d *fakeDeploy) Deploy(_ context.Context, project, digest, marker string) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.n++
	if d.deployErr != nil {
		return d.deployErr
	}
	d.deploys[marker] = project + "@" + digest
	return nil
}
func (d *fakeDeploy) FindDeploy(_ context.Context, marker string) (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.findErr != nil {
		return false, d.findErr
	}
	_, ok := d.deploys[marker]
	return ok, nil
}

// TestB112bPreviewDeployEffector: the preview-deploy effector is natural (digest-pinned), maps
// Do/Lookup onto a DeployHost (a fake: no network), and never deploys anything but a preview.
func TestB112bPreviewDeployEffector(t *testing.T) {
	d := &fakeDeploy{deploys: map[string]string{}}
	e, err := effector.NewPreviewDeploy(effector.DeployConfig{Host: d})
	if err != nil {
		t.Fatalf("NewPreviewDeploy: %v", err)
	}
	if e.Class() != outbox.Natural {
		t.Fatalf("class %s; want natural (09a §7.2, digest-pinned deploy)", e.Class())
	}
	if l := effectiveLag(e); l != rulingA {
		t.Fatalf("VisibilityLag unset: effective lag %v; want %v", l, rulingA)
	}
	p := effector.DeployPayload{Project: "keel-site", Digest: goodSHA, Environment: "preview"}
	presence(t, e, "01OPDEP1", outbox.Absent)
	if err := e.Do(ctx, "01OPDEP1", mustJSON(t, p)); err != nil {
		t.Fatalf("Do: %v", err)
	}
	if got := d.deploys["01OPDEP1"]; got != "keel-site@"+goodSHA {
		t.Fatalf("host holds %q under the idem", got)
	}
	presence(t, e, "01OPDEP1", outbox.Present)
	presence(t, e, "01OPDEP2", outbox.Absent)
	for _, env := range []string{"production", "", "Preview"} {
		q := p
		q.Environment = env
		rejected(t, "environment "+strconv.Quote(env), e.Do(ctx, "01OPDEP3", mustJSON(t, q)), true)
	}
	for _, dg := range []string{"latest", "sha256:abc", "sha256:" + strings.Repeat("A", 64)} {
		q := p
		q.Digest = dg
		rejected(t, "digest "+dg, e.Do(ctx, "01OPDEP4", mustJSON(t, q)), false)
	}
	if d.n != 1 {
		t.Fatalf("%d host calls after refusals; want 1", d.n)
	}
	d.deployErr = fmt.Errorf("%w: quota", effector.ErrHostRejected)
	rejected(t, "host definitely refused", e.Do(ctx, "01OPDEP5", mustJSON(t, p)), false)
	d.deployErr = errors.New("connection reset")
	if err := e.Do(ctx, "01OPDEP6", mustJSON(t, p)); err == nil || errors.Is(err, outbox.ErrRejected) {
		t.Fatalf("ambiguous host error: err = %v; want an error that is not ErrRejected", err)
	}
	d.findErr = errors.New("timeout")
	if pr, err := e.Lookup(ctx, "01OPDEP1"); err == nil {
		t.Fatalf("Lookup with the host failing = %v, nil; want an error", pr)
	}
}

// TestB112bEffectorsReachNoNetwork: nothing in package effector (or under it) can open a network
// connection or run a program: mail is a Maildir, git and deploy are interfaces the caller fills.
// GAP: syscall is not banned (the outbox's flock needs it), so a raw socket(2) is not caught here.
func TestB112bEffectorsReachNoNetwork(t *testing.T) {
	allowedNet := map[string]bool{"net/mail": true, "net/url": true, "net/netip": true, "net/textproto": true}
	banned := func(p string) bool {
		switch {
		case allowedNet[p]:
			return false
		case p == "net", strings.HasPrefix(p, "net/"), p == "crypto/tls", p == "os/exec", p == "plugin",
			strings.HasPrefix(p, "golang.org/x/net"):
			return true
		}
		return false
	}
	seen := 0
	err := filepath.WalkDir(".", func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
			return err
		}
		f, err := parser.ParseFile(token.NewFileSet(), path, nil, parser.ImportsOnly)
		if err != nil {
			return err
		}
		seen++
		for _, im := range f.Imports {
			if p, _ := strconv.Unquote(im.Path.Value); banned(p) {
				t.Errorf("%s imports %q: an effector here must not reach a network or run a program", path, p)
			}
		}
		return nil
	})
	if err != nil || seen == 0 {
		t.Fatalf("walk: %v, %d files; want the package's sources", err, seen)
	}
}
