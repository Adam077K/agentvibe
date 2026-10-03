// Package launcher is the Kernel launcher: the only principal that may spawn workers, under the
// standing launcher_grant (docs/vision-v3/09a-ENGINEERING.md §8.5, DR-53, F1).
//
// B0-17b froze this surface and its done-tests (launcher_donetest_test.go, build tag donetest);
// B1-08 implements it. A launch passes, in order: forbidden flags, the granted binary, a pinned
// argv template, per_launch_requires, the binary's measured digest, then the two caps; only then
// is one Receipt appended and Exec.Run called once. Every refusal happens before exec.
//
// Time and exec are injected so a 03:00 unattended launch and a 121st launch in an hour are
// deterministic in a test, and so no test ever execs a real worker.
package launcher

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/adapter"
)

// Refusals. Each is returned before Exec.Run is called; a refused launch never execs.
var (
	// ErrForbiddenFlag: argv carries a flag on the grant's forbidden list (§8.5 forbidden_flags).
	// New also returns it for a grant whose own template carries a forbidden flag.
	ErrForbiddenFlag = errors.New("launcher: forbidden flag")
	// ErrArgvNotPinned: argv matches no ArgvTemplate on the grant. Only pinned argv runs;
	// an unknown flag, a changed literal, an equivalent spelling ("--flag=value" for
	// "--flag value"), a reordering, or a slot filled with a flag is refused (§8.5 argv).
	ErrArgvNotPinned = errors.New("launcher: argv is not a pinned template")
	// ErrGrant: New was given a malformed grant, e.g. a template whose Digest does not match
	// its Tokens.
	ErrGrant = errors.New("launcher: malformed grant")
	// ErrRateCap: the launch would exceed caps.per_hour within the trailing hour.
	ErrRateCap = errors.New("launcher: per-hour cap reached")
	// ErrConcurrentCap: the launch would exceed caps.concurrent.
	ErrConcurrentCap = errors.New("launcher: concurrent cap reached")
	// ErrBinary: the binary is not on the grant, or its digest does not match.
	ErrBinary = errors.New("launcher: binary not granted or digest mismatch")
	// ErrPrerequisite: a per_launch_requires item is missing.
	ErrPrerequisite = errors.New("launcher: per-launch prerequisite missing")
	// ErrUndecided: canon does not decide the case, so the launcher refuses it rather than guess.
	// Today: provider mode "api", which needs the founder's Constitution flag (09a §10) that
	// neither the Grant nor the Request carries.
	ErrUndecided = errors.New("launcher: undecided by canon, refused")
	// ErrDeps: New was given a nil collaborator.
	ErrDeps = errors.New("launcher: missing dependency")
	// ErrReceipt: the Receipt could not be appended, so the launch did not exec.
	ErrReceipt = errors.New("launcher: receipt append failed")
	// ErrSpec: the request contradicts itself (unattended but not headless) or a slot value breaks
	// its adapter's rule (B1-08 r3: -C clean, absolute, not /; a pinned slot equal to its pin;
	// --max-budget-usd a decimal within the budget cap; Env only allow-listed names).
	ErrSpec = errors.New("launcher: request breaks a slot rule or contradicts itself")
	// ErrLease: the fenced lease is not this job's live claim, the job is already running, or the
	// lease was already consumed by an earlier admit (B1-08 r4: a lease admits one launch, ever).
	ErrLease = errors.New("launcher: lease is not live for this job")
	// ErrState (B1-08 r4): the launcher's persisted state or its receipt log is missing, emptied,
	// truncated or corrupt. Every launch is refused until it is explicitly re-established.
	ErrState = errors.New("launcher: persisted state missing or corrupt")
)

// B1-08 r4 surface, 2026-10-03 re-freeze r4 after review (build/done-tests/B0-17b.yml). Declared
// here, not implemented: each stub below refuses, so nothing fails open before B1-08 lands it.
//
// RECEIPT LOG. A file-backed ReceiptSink. It is created only explicitly (CreateReceiptLog), never
// implicitly by opening. Since and Append fail closed with ErrState on a log that is missing,
// emptied, truncated (mid-record or at a record boundary) or corrupt (a changed byte, an appended
// line). ReestablishReceiptLog is the only way back, and it never resets the count to 0: for an
// hour after re-establishment the unknown history counts as full, so Since over a window that
// reaches before the re-establishment fails closed.

// CreateReceiptLog creates an empty receipt log at path; it refuses one that exists.
func CreateReceiptLog(path string) error {
	return fmt.Errorf("%w: CreateReceiptLog not implemented", ErrState)
}

// OpenReceiptLog opens the receipt log at path; it refuses one that was never created.
func OpenReceiptLog(path string) (ReceiptSink, error) {
	return nil, fmt.Errorf("%w: OpenReceiptLog not implemented", ErrState)
}

// ReestablishReceiptLog explicitly replaces a broken (or absent) log at path with one whose
// history before at is unknown and counts as full for the trailing hour.
func ReestablishReceiptLog(path string, at time.Time) error {
	return fmt.Errorf("%w: ReestablishReceiptLog not implemented", ErrState)
}

// Holder is the only principal that may hold the grant (09a §8.5).
const Holder = "kernel.launcher"

// Clock is the launcher's only source of time.
type Clock interface{ Now() time.Time }

// Exec runs one worker process and returns when it exits. The launcher calls it at most once
// per admitted launch and never for a refused one.
//
// B1-08 r3: Run execs the binary at path only if the bytes it execs hash to digest (open, hash
// and exec the same file, so nothing can swap the binary between the check and the exec); env is
// the complete environment, built from the grant's allow-list, and is never nil: nothing is
// inherited from the Kernel.
type Exec interface {
	Run(ctx context.Context, path, digest string, argv, env []string) error
}

// Digester returns the content digest ("sha256:<hex>") of the binary at path.
type Digester interface {
	Digest(path string) (string, error)
}

// ReceiptSink receives one Receipt per launch that reached Exec.Run.
type ReceiptSink interface {
	Append(Receipt) error
	// Since returns the receipts whose At is after t, oldest first. B1-08 r3: the per-hour count
	// is read from here, so it survives a restart.
	Since(t time.Time) ([]Receipt, error)
}

// LeaseVerifier checks a fenced lease (B1-08 r3): issued for jobID, unexpired at now, unrevoked,
// and carrying the current fencing token. The launcher calls it under its admit lock.
type LeaseVerifier interface {
	Verify(jobID, lease string, now time.Time) error
}

// GrantStatus reports whether the grant is still live (B1-08 r3): nil while signed and
// unrevoked. The launcher asks at every admit, so a revocation binds the next launch.
type GrantStatus interface {
	Live() error
}

// Binary is one granted binary, pinned by digest.
type Binary struct {
	Path   string
	Digest string
}

// Caps are the grant's parameters (§8.5: concurrent 12, per_hour 120).
type Caps struct {
	Concurrent int
	PerHour    int
}

// ArgvTemplate is one pinned launch line (09a §8, "Pinned launch lines"). Tokens are literal
// argv tokens, except a token of the form "<name>", which is a slot. A slot matches exactly one
// argv token that is non-empty and does not begin with '-'. Every other token must be equal.
// Digest is "sha256:" + hex(sha256(strings.Join(Tokens, "\x00"))): argv tokens cannot hold a
// NUL, so the encoding is unambiguous.
type ArgvTemplate struct {
	Binary string // path of the Binary the template belongs to
	Tokens []string
	Digest string
	// Pinned maps a slot to the only value it may take (B1-08 r3), e.g. "<profile>" -> "project".
	Pinned map[string]string
}

// Grant is launcher_grant as the launcher consumes it. Verifying the founder signature on the
// Constitution record is upstream of this type.
type Grant struct {
	Holder         string
	Binaries       []Binary
	Templates      []ArgvTemplate // the only argv that may run
	ForbiddenFlags []string       // e.g. "--dangerously-skip-permissions", "--bare", "-s danger-full-access"
	Caps           Caps
	EnvAllow       []string // B1-08 r3: the only environment names a worker may receive
	// B1-08 r4: every slot has a rule, keyed by the flag the slot is the value of (never by the
	// slot's display name); New refuses a slot whose flag has no rule. The rules:
	//   --setting-sources, -p        the template's Pinned value (a pin is required)
	//   --settings, --agents,        a clean absolute path strictly inside JobRoot, ending ".json"
	//   --json-schema, --output-schema, -o
	//   -C                           a clean absolute path strictly inside WorktreeRoot
	//   --agent                      ^[a-z][a-z0-9-]{0,63}$
	//   --allowedTools               comma-joined tool names, neither Agent nor Task
	//   --disallowedTools            comma-joined tool names including both Agent and Task
	//   --max-budget-usd             cents: no leading zero, at most 12 whole digits, within the cap
	//   --session-id                 a lowercase canonical UUID
	//   -c                           exactly one of ConfigAllow; a literal -c value must be on it too
	// B1-07 round 4 (r5 merge, 2026-10-03): codex runs --ignore-user-config with every locked
	// setting a literal -c and no -p, so ConfigAllow is exactly those values; a -p slot (none in
	// either line today) still needs a pin.
	WorktreeRoot string
	JobRoot      string
	ConfigAllow  []string
}

// Prerequisites is per_launch_requires (§8.5).
type Prerequisites struct {
	AdmittedJob    bool
	ToolLease      []string // the tool lease's forbidden list; nil means no lease
	ContextProfile string
	Isolation      int // 2 = I2, 3 = I3; a headless launch needs >= 2
	Headless       bool
	ProviderMode   string
	BudgetCapCents int64
	FencedLease    string // "job://<id>" plus its fencing token
}

// Request is one launch request.
type Request struct {
	JobID      string
	Binary     string   // path; must be on the grant
	Argv       []string // argv[1:]; must match one of the grant's templates for Binary
	Unattended bool     // no human is present; the grant alone authorises the launch
	Requires   Prerequisites
	Env        map[string]string // B1-08 r3: the worker's environment; every name on Grant.EnvAllow
}

// Receipt records one launch.
type Receipt struct {
	JobID    string
	Binary   string
	Digest   string // the binary's digest
	Template string // Digest of the ArgvTemplate the argv matched
	Argv     []string
	At       time.Time
}

// Deps are the launcher's injected collaborators.
type Deps struct {
	Clock    Clock
	Exec     Exec
	Digester Digester
	Receipts ReceiptSink
	Leases   LeaseVerifier // B1-08 r3: required
	Grant    GrantStatus   // B1-08 r3: required
	// State (B1-08 r4, required) is the launcher's persisted state directory: the running jobs and
	// the consumed leases, keyed by job and fenced lease, read and written under a file lock, so
	// a second launcher on the same State, or one after a restart, sees them.
	State string
}

// Launcher spawns workers under a Grant.
type Launcher interface {
	// Launch checks req against the grant, then calls Exec.Run exactly once and appends
	// exactly one Receipt; or it refuses before exec with one of the refusal errors above.
	//
	// B1-08 r4: headless is derived from the argv. A template whose "-p" is a bare flag (claude's)
	// is headless, so a request claiming non-headless, or an attended one, is ErrSpec. The lease
	// is consumed at admit; when Exec.Run returns, Launch records the job's end.
	Launch(ctx context.Context, req Request) (Receipt, error)
	// End (B1-08 r4) records the end of jobID's launch on lease, for a launch whose launcher died
	// before recording it; only a recorded end frees the job's concurrent slot. It refuses a job
	// that is not running on that lease. The lease stays consumed.
	End(ctx context.Context, jobID, lease string) error
}

func (l *launcher) End(context.Context, string, string) error {
	return fmt.Errorf("%w: End not implemented", ErrLease)
}

// TemplateOf pins a WorkerAdapter's launch line for the binary at path: the grant's templates
// are built from the adapters' Template(), never typed twice. B1-08 r4: the result is the full
// template — every slot's pin included (claude's --setting-sources is pinned to "project").
func TemplateOf(path string, a adapter.WorkerAdapter) ArgvTemplate {
	t := a.Template()
	return ArgvTemplate{Binary: path, Tokens: t, Digest: digestOf(t)}
}

func digestOf(tokens []string) string {
	s := sha256.Sum256([]byte(strings.Join(tokens, "\x00")))
	return "sha256:" + hex.EncodeToString(s[:])
}

type launcher struct {
	g        Grant
	d        Deps
	mu       sync.Mutex // the admit lock: grant, lease, history and caps are one step
	inflight int
	running  map[string]bool // JobIDs between admit and Exec.Run's return
}

// New returns a Launcher holding g. It refuses a template whose Digest does not match its
// Tokens (ErrGrant) or that carries a forbidden flag (ErrForbiddenFlag).
func New(g Grant, d Deps) (Launcher, error) {
	if d.Clock == nil || d.Exec == nil || d.Digester == nil || d.Receipts == nil || d.Leases == nil || d.Grant == nil {
		return nil, ErrDeps
	}
	if g.Holder != Holder || g.Caps.Concurrent <= 0 || g.Caps.PerHour <= 0 || len(g.Templates) == 0 {
		return nil, fmt.Errorf("%w: holder %q, caps %+v, %d templates", ErrGrant, g.Holder, g.Caps, len(g.Templates))
	}
	for _, f := range g.ForbiddenFlags {
		if !strings.HasPrefix(f, "-") {
			return nil, fmt.Errorf("%w: forbidden flag %q", ErrGrant, f)
		}
	}
	for _, n := range g.EnvAllow {
		if n == "" || strings.ContainsAny(n, "=\x00") {
			return nil, fmt.Errorf("%w: env name %q", ErrGrant, n)
		}
	}
	bins := map[string]bool{}
	for _, b := range g.Binaries {
		if b.Path == "" || bins[b.Path] || !strings.HasPrefix(b.Digest, "sha256:") {
			return nil, fmt.Errorf("%w: binary %q", ErrGrant, b.Path)
		}
		bins[b.Path] = true
	}
	for _, t := range g.Templates {
		if !bins[t.Binary] || len(t.Tokens) == 0 || t.Digest != digestOf(t.Tokens) {
			return nil, fmt.Errorf("%w: template for %q", ErrGrant, t.Binary)
		}
		if f := forbidden(g.ForbiddenFlags, t.Tokens); f != "" {
			return nil, fmt.Errorf("%w: template for %q carries %q", ErrForbiddenFlag, t.Binary, f)
		}
	}
	g.Binaries = slices.Clone(g.Binaries)
	g.Templates = slices.Clone(g.Templates)
	g.ForbiddenFlags = slices.Clone(g.ForbiddenFlags)
	g.EnvAllow = slices.Clone(g.EnvAllow)
	return &launcher{g: g, d: d, running: map[string]bool{}}, nil
}

// forbidden returns the first forbidden flag argv carries, in any spelling: "--f", "--f=v",
// "-s v" as two tokens, "-s=v", or "-sv" for a short flag. "" when none.
func forbidden(flags, argv []string) string {
	for _, f := range flags {
		w := strings.Fields(f)
		for i, a := range argv {
			switch {
			case len(w) == 1 && (a == w[0] || strings.HasPrefix(a, w[0]+"=")):
				return f
			case len(w) == 2 && i+1 < len(argv) && a == w[0] && argv[i+1] == w[1]:
				return f
			case len(w) == 2 && (a == w[0]+"="+w[1] || (!strings.HasPrefix(w[0], "--") && a == w[0]+w[1])):
				return f
			}
		}
	}
	return ""
}

func isSlot(t string) bool { return len(t) > 2 && t[0] == '<' && t[len(t)-1] == '>' }

// matches reports whether argv is exactly tokens with each "<slot>" filled by one token that is
// non-empty and does not begin with '-'.
func matches(tokens, argv []string) bool {
	if len(tokens) != len(argv) {
		return false
	}
	for i, t := range tokens {
		slot := isSlot(t)
		if slot && (argv[i] == "" || argv[i][0] == '-') || !slot && argv[i] != t {
			return false
		}
	}
	return true
}

// slotRules checks each slot value against its adapter's rule: a Pinned slot equals its pin;
// <worktree> (codex -C) is clean, absolute and not /; <B> (--max-budget-usd) is a decimal of
// at most two places, above zero and within the budget cap.
func slotRules(t ArgvTemplate, argv []string, capCents int64) error {
	for i, tok := range t.Tokens {
		v := argv[i]
		if pin, ok := t.Pinned[tok]; ok && v != pin {
			return fmt.Errorf("%w: %s = %q, pinned %q", ErrSpec, tok, v, pin)
		}
		switch tok {
		case "<worktree>":
			if !filepath.IsAbs(v) || filepath.Clean(v) != v || v == "/" {
				return fmt.Errorf("%w: -C %q", ErrSpec, v)
			}
		case "<B>":
			if c, ok := cents(v); !ok || c <= 0 || c > capCents {
				return fmt.Errorf("%w: --max-budget-usd %q against a cap of %d cents", ErrSpec, v, capCents)
			}
		}
	}
	return nil
}

// cents parses "D", "D.d" or "D.dd" (D decimal digits, no sign, no leading zero but "0").
func cents(v string) (int64, bool) {
	whole, frac, dot := strings.Cut(v, ".")
	if whole == "" || len(whole) > 12 || len(whole) > 1 && whole[0] == '0' || dot && (frac == "" || len(frac) > 2) {
		return 0, false
	}
	var c int64
	for _, r := range whole + (frac + "00")[:2] {
		if r < '0' || r > '9' {
			return 0, false
		}
		c = c*10 + int64(r-'0')
	}
	return c, true
}

// environ builds the worker's complete environment from req.Env: allow-listed names only,
// sorted, never nil, so nothing is inherited from the Kernel.
func (l *launcher) environ(env map[string]string) ([]string, error) {
	out := make([]string, 0, len(env))
	for k, v := range env {
		if !slices.Contains(l.g.EnvAllow, k) || strings.ContainsRune(v, 0) {
			return nil, fmt.Errorf("%w: env %q", ErrSpec, k)
		}
		out = append(out, k+"="+v)
	}
	slices.Sort(out)
	return out, nil
}

// prerequisites checks per_launch_requires (09a §8.5). An unattended launch is headless.
func prerequisites(req Request) error {
	p := req.Requires
	miss := func(what string) error { return fmt.Errorf("%w: %s", ErrPrerequisite, what) }
	switch {
	case req.Unattended && !p.Headless:
		return fmt.Errorf("%w: unattended but not headless", ErrSpec)
	case req.JobID == "" || !p.AdmittedJob:
		return miss("admitted Job")
	case len(p.ToolLease) == 0:
		return miss("tool lease with forbidden list")
	case p.ContextProfile == "":
		return miss("context profile")
	case p.Isolation < 1 || p.Isolation > 4 || p.Headless && p.Isolation < 2:
		return miss(fmt.Sprintf("isolation I%d (headless %v)", p.Isolation, p.Headless))
	case p.ProviderMode == "api":
		return fmt.Errorf("%w: provider mode api", ErrUndecided)
	case p.ProviderMode != "sub":
		return miss(fmt.Sprintf("provider mode %q", p.ProviderMode))
	case p.BudgetCapCents <= 0:
		return miss("budget cap")
	case p.FencedLease == "":
		return miss("fenced lease on job://" + req.JobID)
	}
	return nil
}

func (l *launcher) Launch(ctx context.Context, req Request) (Receipt, error) {
	if err := ctx.Err(); err != nil {
		return Receipt{}, err
	}
	if f := forbidden(l.g.ForbiddenFlags, req.Argv); f != "" {
		return Receipt{}, fmt.Errorf("%w: %q", ErrForbiddenFlag, f)
	}
	var bin *Binary
	for i := range l.g.Binaries {
		if l.g.Binaries[i].Path == req.Binary {
			bin = &l.g.Binaries[i]
		}
	}
	if bin == nil {
		return Receipt{}, fmt.Errorf("%w: %q", ErrBinary, req.Binary)
	}
	var tmpl *ArgvTemplate
	for i, t := range l.g.Templates {
		if t.Binary == req.Binary && matches(t.Tokens, req.Argv) {
			tmpl = &l.g.Templates[i]
			break
		}
	}
	if tmpl == nil {
		return Receipt{}, ErrArgvNotPinned
	}
	if err := prerequisites(req); err != nil {
		return Receipt{}, err
	}
	if err := slotRules(*tmpl, req.Argv, req.Requires.BudgetCapCents); err != nil {
		return Receipt{}, err
	}
	env, err := l.environ(req.Env)
	if err != nil {
		return Receipt{}, err
	}
	if got, err := l.d.Digester.Digest(bin.Path); err != nil || got != bin.Digest {
		return Receipt{}, fmt.Errorf("%w: %q measured %q (%v)", ErrBinary, bin.Path, got, err)
	}
	rc, err := l.admit(req, bin.Digest, tmpl.Digest)
	if err != nil {
		return Receipt{}, err
	}
	defer l.done(req.JobID)
	// Exec hashes and execs the same open file against the pinned digest: no swap in between.
	return rc, l.d.Exec.Run(ctx, bin.Path, bin.Digest, slices.Clone(req.Argv), env)
}

// admit is one step under the admit lock: the grant is live, the job is not already running,
// its fenced lease verifies at the launcher's clock, the durable receipt log holds fewer than
// per_hour launches in the trailing hour, a concurrent slot is free, and the Receipt is
// appended. Any refusal takes nothing.
func (l *launcher) admit(req Request, digest, tmpl string) (Receipt, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.d.Clock.Now()
	if err := l.d.Grant.Live(); err != nil {
		return Receipt{}, fmt.Errorf("%w: not live: %v", ErrGrant, err)
	}
	if l.running[req.JobID] {
		return Receipt{}, fmt.Errorf("%w: job %q is already running", ErrLease, req.JobID)
	}
	if err := l.d.Leases.Verify(req.JobID, req.Requires.FencedLease, now); err != nil {
		return Receipt{}, fmt.Errorf("%w: %v", ErrLease, err)
	}
	recent, err := l.d.Receipts.Since(now.Add(-time.Hour))
	if err != nil {
		return Receipt{}, fmt.Errorf("%w: launch history unreadable: %v", ErrReceipt, err)
	}
	if len(recent) >= l.g.Caps.PerHour {
		return Receipt{}, fmt.Errorf("%w: %d in the trailing hour", ErrRateCap, len(recent))
	}
	if l.inflight >= l.g.Caps.Concurrent {
		return Receipt{}, fmt.Errorf("%w: %d running", ErrConcurrentCap, l.inflight)
	}
	rc := Receipt{JobID: req.JobID, Binary: req.Binary, Digest: digest, Template: tmpl,
		Argv: slices.Clone(req.Argv), At: now}
	if err := l.d.Receipts.Append(rc); err != nil {
		return Receipt{}, fmt.Errorf("%w: %v", ErrReceipt, err)
	}
	l.inflight++
	l.running[req.JobID] = true
	return rc, nil
}

func (l *launcher) done(job string) {
	l.mu.Lock()
	l.inflight--
	delete(l.running, job)
	l.mu.Unlock()
}
