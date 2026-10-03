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
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"sync"
	"syscall"
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
	// Consume (B1-08 r6, 2026-10-03 re-freeze r6 after review) atomically consumes the fenced
	// lease in the AUTHORITATIVE lease store: compare-and-set, exactly one winner across every
	// process and machine. lease carries the job's fencing token. The launcher calls it under its
	// admit lock as the last check before the Receipt is appended, and never admits unless it
	// succeeds; no launcher-local file is trusted for consumption. A second Consume of the same
	// (job, lease) fails.
	Consume(jobID, lease string) error
}

// FounderReset (B1-08 r6) is the explicit, recorded reset of a machine's receipt log. The new
// log's genesis records it, with the prior pinned genesis.
type FounderReset struct {
	By     string // who reset it; required
	Reason string // why; required
	At     time.Time
}

// B1-08 r6 receipt log. The launch count comes from an append-only, hash-chained log whose
// genesis is pinned (Grant.ReceiptGenesis). A deleted, truncated (mid-record, at a record
// boundary, or by its final newline), re-created or broken log fails CLOSED. Declared here, not
// implemented: each stub refuses. r4's functions survive unexported in receiptlog.go.

// CreateReceiptLog creates a machine's receipt log at path and returns its genesis hash, which
// the founder pins as Grant.ReceiptGenesis. It is refused while pinned is non-empty (a prior log,
// and so prior receipts, exist for this machine), and refuses an existing path. Each genesis is
// unique, so a log re-created after a deletion never matches the pin.
func CreateReceiptLog(path, pinned string) (string, error) {
	return "", fmt.Errorf("%w: CreateReceiptLog not implemented (r6)", ErrState)
}

// OpenReceiptLog opens the log at path; it refuses one whose genesis hash is not genesis (the
// pin), a missing one, and one that does not verify. Since and Append re-verify every call.
func OpenReceiptLog(path, genesis string) (ReceiptSink, error) {
	return nil, fmt.Errorf("%w: OpenReceiptLog not implemented (r6)", ErrState)
}

// FounderResetReceiptLog replaces the log at path, explicitly: prior is the currently pinned
// genesis, r names who and why. The new genesis records r and prior and is returned for the
// founder to pin. The count is never reset to 0: the hour after r.At counts as full.
func FounderResetReceiptLog(path, prior string, r FounderReset) (string, error) {
	return "", fmt.Errorf("%w: FounderResetReceiptLog not implemented (r6)", ErrState)
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
	// B1-08 r6: -C must be WorktreeRoot/<JobID> or inside it, and every job file must be inside
	// JobRoot/<JobID>/: THIS job's lease-scoped worktree and files, never another job's. A JobID
	// that is not one clean path segment is ErrSpec.
	//
	// State (B1-08 r6) pins the machine's one State location: New refuses a Deps.State that is
	// not exactly this clean absolute path. The State dir is flocked across processes at admit.
	State string
	// ReceiptGenesis (B1-08 r6) pins the receipt log's genesis hash (CreateReceiptLog or
	// FounderResetReceiptLog returned it).
	ReceiptGenesis string
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

// TemplateOf pins a WorkerAdapter's launch line for the binary at path: the grant's templates
// are built from the adapters' Template(), never typed twice. B1-08 r4: the result is the full
// template, every slot's pin included: --setting-sources is pinned to "project", the one value
// of the adapter's pinned profile table (DR-B1-06 rulings C and D).
func TemplateOf(path string, a adapter.WorkerAdapter) ArgvTemplate {
	t := a.Template()
	at := ArgvTemplate{Binary: path, Tokens: t, Digest: digestOf(t)}
	for i := 1; i < len(t); i++ {
		if t[i-1] == "--setting-sources" && isSlot(t[i]) {
			at.Pinned = map[string]string{t[i]: "project"}
		}
	}
	return at
}

func digestOf(tokens []string) string {
	s := sha256.Sum256([]byte(strings.Join(tokens, "\x00")))
	return "sha256:" + hex.EncodeToString(s[:])
}

var (
	agentName = regexp.MustCompile(`^[a-z][a-z0-9-]{0,63}$`)
	uuidLower = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
)

// slotRules is every slot's rule, keyed by the flag the slot is the value of (never by the
// slot's display name). A slot whose flag is not here is refused by New.
var slotRules = map[string]func(g *Grant, v string, capCents int64) bool{
	"--setting-sources": pinnedOnly, "-p": pinnedOnly,
	"--settings": jobFile, "--agents": jobFile, "--json-schema": jobFile, "--output-schema": jobFile, "-o": jobFile,
	"-C":                func(g *Grant, v string, _ int64) bool { return inside(v, g.WorktreeRoot) },
	"--agent":           func(_ *Grant, v string, _ int64) bool { return agentName.MatchString(v) },
	"--allowedTools":    func(_ *Grant, v string, _ int64) bool { n, ok := tools(v); return ok && !n["Agent"] && !n["Task"] },
	"--disallowedTools": func(_ *Grant, v string, _ int64) bool { n, ok := tools(v); return ok && n["Agent"] && n["Task"] },
	"--max-budget-usd":  func(_ *Grant, v string, c int64) bool { n, ok := cents(v); return ok && n > 0 && n <= c },
	"--session-id":      func(_ *Grant, v string, _ int64) bool { return uuidLower.MatchString(v) },
	"-c":                func(g *Grant, v string, _ int64) bool { return slices.Contains(g.ConfigAllow, v) },
}

// pinnedOnly: the value is checked against the template's pin, which New requires.
func pinnedOnly(*Grant, string, int64) bool { return true }

func jobFile(g *Grant, v string, _ int64) bool {
	return inside(v, g.JobRoot) && strings.HasSuffix(v, ".json")
}

// inside: a clean absolute path strictly inside root.
func inside(v, root string) bool {
	return filepath.IsAbs(v) && filepath.Clean(v) == v && strings.HasPrefix(v, root+"/")
}

// tools parses a comma-joined tool list into the set of base names (the part before any "(");
// every name is non-empty, not a flag, and has no whitespace in its base.
func tools(v string) (map[string]bool, bool) {
	out := map[string]bool{}
	for _, name := range strings.Split(v, ",") {
		base, _, _ := strings.Cut(name, "(")
		if base == "" || base[0] == '-' || strings.ContainsAny(base, " \t\r\n") {
			return nil, false
		}
		out[base] = true
	}
	return out, true
}

// argvHeadless: claude's bare "-p" is print mode, and "codex exec" runs headless (09a §8.8).
func argvHeadless(tokens []string) bool {
	for i, t := range tokens {
		if t == "-p" && (i+1 == len(tokens) || !isSlot(tokens[i+1])) {
			return true
		}
	}
	return len(tokens) > 0 && tokens[0] == "exec"
}

func cleanRoot(r string) bool { return filepath.IsAbs(r) && filepath.Clean(r) == r && r != "/" }

// jobState is the launcher's persisted state under Deps.State: every lease consumed, ever, and
// each running job with the lease it runs on. Only a recorded end removes a running job.
type jobState struct {
	Consumed map[string]bool   `json:"consumed"` // job + " " + lease
	Running  map[string]string `json:"running"`  // job -> lease
}

type launcher struct {
	g  Grant
	d  Deps
	mu sync.Mutex // in-process half of the admit lock; the State flock is the cross-process half
}

// New returns a Launcher holding g. It refuses a template whose Digest does not match its
// Tokens (ErrGrant), that carries a forbidden flag (ErrForbiddenFlag), or that has a slot with no
// rule, a pinned flag with no pin, or a literal -c off ConfigAllow (ErrGrant).
func New(g Grant, d Deps) (Launcher, error) {
	if d.Clock == nil || d.Exec == nil || d.Digester == nil || d.Receipts == nil || d.Leases == nil || d.Grant == nil || d.State == "" {
		return nil, ErrDeps
	}
	if g.Holder != Holder || g.Caps.Concurrent <= 0 || g.Caps.PerHour <= 0 || len(g.Templates) == 0 ||
		!cleanRoot(g.WorktreeRoot) || !cleanRoot(g.JobRoot) {
		return nil, fmt.Errorf("%w: holder %q, caps %+v, %d templates, roots %q %q", ErrGrant, g.Holder, g.Caps, len(g.Templates), g.WorktreeRoot, g.JobRoot)
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
		for i, tok := range t.Tokens {
			flag := ""
			if i > 0 {
				flag = t.Tokens[i-1]
			}
			_, ruled := slotRules[flag]
			_, pinned := t.Pinned[tok]
			switch {
			case isSlot(tok) && !ruled,
				isSlot(tok) && (flag == "--setting-sources" || flag == "-p") && !pinned,
				!isSlot(tok) && flag == "-c" && !slices.Contains(g.ConfigAllow, tok):
				return nil, fmt.Errorf("%w: template for %q: %s %s has no rule", ErrGrant, t.Binary, flag, tok)
			}
		}
	}
	g.Binaries = slices.Clone(g.Binaries)
	g.Templates = slices.Clone(g.Templates)
	g.ForbiddenFlags = slices.Clone(g.ForbiddenFlags)
	g.EnvAllow = slices.Clone(g.EnvAllow)
	g.ConfigAllow = slices.Clone(g.ConfigAllow)
	l := &launcher{g: g, d: d}
	// A State directory with no state yet is initialised, under the flock; an existing one is kept.
	unlock, err := l.flock()
	if err != nil {
		return nil, err
	}
	defer unlock()
	if _, err := os.Stat(l.statePath()); errors.Is(err, fs.ErrNotExist) {
		err = replace(l.statePath(), `{"consumed":{},"running":{}}`)
	}
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrState, err)
	}
	return l, nil
}

func (l *launcher) statePath() string { return filepath.Join(l.d.State, "state.json") }

// flock takes the cross-process half of the admit lock: an exclusive flock on State/lock.
func (l *launcher) flock() (func(), error) {
	f, err := os.OpenFile(filepath.Join(l.d.State, "lock"), os.O_RDWR|os.O_CREATE, 0o600)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrState, err)
	}
	if err := syscall.Flock(int(f.Fd()), syscall.LOCK_EX); err != nil {
		f.Close()
		return nil, fmt.Errorf("%w: flock: %v", ErrState, err)
	}
	return func() { f.Close() }, nil // closing releases the flock
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

// checkSlots applies each slot's pin and its flag's rule.
func (l *launcher) checkSlots(t ArgvTemplate, argv []string, capCents int64) error {
	for i, tok := range t.Tokens {
		if !isSlot(tok) {
			continue
		}
		pin, pinned := t.Pinned[tok]
		if pinned && argv[i] != pin || !slotRules[t.Tokens[i-1]](&l.g, argv[i], capCents) {
			return fmt.Errorf("%w: %s %q", ErrSpec, t.Tokens[i-1], argv[i])
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

// prerequisites checks per_launch_requires (09a §8.5).
func prerequisites(req Request) error {
	p := req.Requires
	miss := func(what string) error { return fmt.Errorf("%w: %s", ErrPrerequisite, what) }
	switch {
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
	// Headless is the argv's, not the request's: a headless line runs only unattended, and an
	// unattended launch is always headless.
	if h := argvHeadless(tmpl.Tokens); req.Requires.Headless != h || req.Unattended != h {
		return Receipt{}, fmt.Errorf("%w: argv headless %v, request headless %v, unattended %v", ErrSpec, h, req.Requires.Headless, req.Unattended)
	}
	if err := prerequisites(req); err != nil {
		return Receipt{}, err
	}
	if err := l.checkSlots(*tmpl, req.Argv, req.Requires.BudgetCapCents); err != nil {
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
	// Exec hashes and execs the same open file against the pinned digest: no swap in between.
	runErr := l.d.Exec.Run(ctx, bin.Path, bin.Digest, slices.Clone(req.Argv), env)
	return rc, errors.Join(runErr, l.end(req.JobID, req.Requires.FencedLease, false))
}

// locked runs fn on the persisted state under the admit lock (this launcher's mutex, then an
// exclusive flock on State/lock), writing the state back when fn says so. A missing or corrupt
// state is ErrState.
func (l *launcher) locked(fn func(s *jobState) (bool, error)) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	unlock, err := l.flock()
	if err != nil {
		return err
	}
	defer unlock()
	path := l.statePath()
	var s jobState
	if b, err := os.ReadFile(path); err != nil || json.Unmarshal(b, &s) != nil || s.Consumed == nil || s.Running == nil {
		return fmt.Errorf("%w: %s missing or corrupt", ErrState, path)
	}
	write, err := fn(&s)
	if err != nil || !write {
		return err
	}
	b, err := json.Marshal(s)
	if err == nil {
		err = replace(path, string(b))
	}
	if err != nil {
		return fmt.Errorf("%w: %v", ErrState, err)
	}
	return nil
}

// admit is one step under the admit lock: the grant is live, the job is not running, the lease
// was never consumed and verifies at the launcher's clock, the receipt log holds fewer than
// per_hour launches in the trailing hour, fewer than concurrent jobs run, and the Receipt is
// appended. Then the lease is consumed and the job recorded running. A refusal takes nothing.
func (l *launcher) admit(req Request, digest, tmpl string) (rc Receipt, err error) {
	job, lease := req.JobID, req.Requires.FencedLease
	err = l.locked(func(s *jobState) (bool, error) {
		now := l.d.Clock.Now()
		if err := l.d.Grant.Live(); err != nil {
			return false, fmt.Errorf("%w: not live: %v", ErrGrant, err)
		}
		if _, running := s.Running[job]; running {
			return false, fmt.Errorf("%w: job %q is already running", ErrLease, job)
		}
		if s.Consumed[job+" "+lease] {
			return false, fmt.Errorf("%w: lease %q was already consumed", ErrLease, lease)
		}
		if err := l.d.Leases.Verify(job, lease, now); err != nil {
			return false, fmt.Errorf("%w: %v", ErrLease, err)
		}
		recent, err := l.d.Receipts.Since(now.Add(-time.Hour))
		if err != nil {
			return false, fmt.Errorf("%w: launch history: %w", ErrState, err)
		}
		if len(recent) >= l.g.Caps.PerHour {
			return false, fmt.Errorf("%w: %d in the trailing hour", ErrRateCap, len(recent))
		}
		if len(s.Running) >= l.g.Caps.Concurrent {
			return false, fmt.Errorf("%w: %d running", ErrConcurrentCap, len(s.Running))
		}
		rc = Receipt{JobID: job, Binary: req.Binary, Digest: digest, Template: tmpl, Argv: slices.Clone(req.Argv), At: now}
		if err := l.d.Receipts.Append(rc); err != nil {
			return false, fmt.Errorf("%w: %v", ErrReceipt, err)
		}
		s.Consumed[job+" "+lease] = true
		s.Running[job] = lease
		return true, nil
	})
	return rc, err
}

// end records jobID's end on lease. strict refuses a job not running on that lease (End); the
// launch's own end after an End already recorded it is not an error.
func (l *launcher) end(job, lease string, strict bool) error {
	return l.locked(func(s *jobState) (bool, error) {
		if got, ok := s.Running[job]; !ok || got != lease {
			if strict {
				return false, fmt.Errorf("%w: job %q is not running on %q", ErrLease, job, lease)
			}
			return false, nil
		}
		delete(s.Running, job)
		return true, nil
	})
}

func (l *launcher) End(ctx context.Context, jobID, lease string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	return l.end(jobID, lease, true)
}
