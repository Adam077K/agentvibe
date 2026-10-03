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
	"maps"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/adapter"
	"github.com/Adam077K/agentvibe/kernel/internal/journal"
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

// B1-08 r7 (DR-B1-08-THREAT-MODEL-2026-10-03, item 4): each admitted launch appends one event to
// Deps.Journal on JournalStream, of type JournalLaunchType, whose Data is the Receipt's JSON.
const (
	JournalStream     = "kernel.launcher"
	JournalLaunchType = "launch"
)

// GenesisReporter (B1-08 r7, item 3) is how New learns the receipt log's genesis: New refuses a
// Deps.Receipts that does not implement it, or whose Genesis() is not Grant.ReceiptGenesis.
type GenesisReporter interface {
	Genesis() string
}

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
	// FounderResetReceiptLog returned it). B1-08 r7: New checks it against Deps.Receipts'
	// GenesisReporter and refuses a mismatch (ErrState or ErrGrant).
	ReceiptGenesis string
	// EnvPinned (B1-08 r7, item 2) is the only value HOME, CODEX_HOME and PATH may take. A request
	// passing one of them with any other value, or with no pin, is ErrSpec.
	//
	// B1-08h: New refuses (ErrGrant) a table with no HOME pin, and a request whose Env lacks HOME
	// (ErrSpec): a worker with no HOME falls back to the real home directory. The HOME and CODEX_HOME
	// pins are clean absolute paths other than "/", and PATH is ":"-joined clean absolute entries,
	// none empty, none equal to or inside a worker root.
	EnvPinned map[string]string
	// TmpRoots (B1-08 r7, item 1) is every TMPDIR root handed to workers. New refuses (ErrGrant) a
	// State dir equal to, inside, or containing WorktreeRoot, JobRoot, EnvPinned["HOME"],
	// EnvPinned["CODEX_HOME"] or any TmpRoots entry, each compared after resolving symlinks (of the
	// longest existing prefix). A root or State dir that resolves to "/", or cannot be resolved (a
	// dangling or looping link), is ErrGrant.
	TmpRoots []string
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
	// Journal (B1-08 r7, item 4, required: nil is ErrDeps) is the Kernel's main journal. Before
	// admitting, the receipts in the trailing hour and the journal's launch records in the
	// trailing hour must agree in number, or the launch is ErrState; a failed journal append
	// never execs.
	Journal journal.Journal
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
// slot's display name). A slot whose flag is not here is refused by New. Paths are scoped to
// THIS job: -C is WorktreeRoot/<JobID> or inside it, job files lie inside JobRoot/<JobID>/.
var slotRules = map[string]func(g *Grant, q *Request, v string) bool{
	"--setting-sources": pinnedOnly, "-p": pinnedOnly,
	"--settings": jobFile, "--agents": jobFile, "--json-schema": jobFile, "--output-schema": jobFile, "-o": jobFile,
	"-C": func(g *Grant, q *Request, v string) bool {
		own := g.WorktreeRoot + "/" + q.JobID
		return v == own || inside(v, own)
	},
	"--agent":           func(_ *Grant, _ *Request, v string) bool { return agentName.MatchString(v) },
	"--allowedTools":    func(_ *Grant, _ *Request, v string) bool { n, ok := tools(v); return ok && !n["Agent"] && !n["Task"] },
	"--disallowedTools": func(_ *Grant, _ *Request, v string) bool { n, ok := tools(v); return ok && n["Agent"] && n["Task"] },
	"--max-budget-usd": func(_ *Grant, q *Request, v string) bool {
		n, ok := cents(v)
		return ok && n > 0 && n <= q.Requires.BudgetCapCents
	},
	"--session-id": func(_ *Grant, _ *Request, v string) bool { return uuidLower.MatchString(v) },
	"-c":           func(g *Grant, _ *Request, v string) bool { return slices.Contains(g.ConfigAllow, v) },
}

// pinnedOnly: the value is checked against the template's pin, which New requires.
func pinnedOnly(*Grant, *Request, string) bool { return true }

func jobFile(g *Grant, q *Request, v string) bool {
	return inside(v, g.JobRoot+"/"+q.JobID) && strings.HasSuffix(v, ".json")
}

// segment: a JobID that can scope a path is one clean path segment.
func segment(job string) bool {
	return job != "" && job != "." && job != ".." && !strings.ContainsAny(job, "/\x00")
}

// envNames is the only environment a worker may receive (B1-07 r5; AV_JOB is not passed).
var envNames = []string{"HOME", "CODEX_HOME", "PATH", "LANG"}

// pinnedEnv (B1-08 r7, item 2) take only Grant.EnvPinned's value; with no pin they are refused.
var pinnedEnv = []string{"HOME", "CODEX_HOME", "PATH"}

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
	if d.Clock == nil || d.Exec == nil || d.Digester == nil || d.Receipts == nil || d.Leases == nil || d.Grant == nil || d.State == "" ||
		d.Journal == nil {
		return nil, ErrDeps
	}
	if g.Holder != Holder || g.Caps.Concurrent <= 0 || g.Caps.PerHour <= 0 || len(g.Templates) == 0 ||
		!cleanRoot(g.WorktreeRoot) || !cleanRoot(g.JobRoot) || !cleanRoot(g.State) || g.State != d.State {
		return nil, fmt.Errorf("%w: holder %q, caps %+v, %d templates, roots %q %q, State pinned %q used %q",
			ErrGrant, g.Holder, g.Caps, len(g.Templates), g.WorktreeRoot, g.JobRoot, g.State, d.State)
	}
	for _, f := range g.ForbiddenFlags {
		if !strings.HasPrefix(f, "-") {
			return nil, fmt.Errorf("%w: forbidden flag %q", ErrGrant, f)
		}
	}
	for _, n := range g.EnvAllow {
		if !slices.Contains(envNames, n) {
			return nil, fmt.Errorf("%w: env name %q is not one of %v", ErrGrant, n, envNames)
		}
	}
	for n, v := range g.EnvPinned {
		if !slices.Contains(pinnedEnv, n) || strings.ContainsRune(v, 0) {
			return nil, fmt.Errorf("%w: env pin %q is not one of %v", ErrGrant, n, pinnedEnv)
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
	g.EnvPinned = maps.Clone(g.EnvPinned)
	g.TmpRoots = slices.Clone(g.TmpRoots)
	// B1-08 r7: both checks run before the State dir is touched.
	if err := outOfReach(g, d.State); err != nil {
		return nil, err
	}
	if gr, ok := d.Receipts.(GenesisReporter); !ok || gr.Genesis() == "" || gr.Genesis() != g.ReceiptGenesis {
		return nil, fmt.Errorf("%w: the receipt log's genesis is not the pinned %q", ErrState, g.ReceiptGenesis)
	}
	l := &launcher{g: g, d: d}
	// Only a fresh State dir (its lock file created now) is initialised. A used one whose
	// state.json is gone fails closed: the running jobs it recorded are unknown.
	lock, err := os.OpenFile(filepath.Join(d.State, "lock"), os.O_RDWR|os.O_CREATE|os.O_EXCL, 0o600)
	fresh := err == nil
	if fresh {
		lock.Close()
	}
	unlock, err := l.flock()
	if err != nil {
		return nil, err
	}
	defer unlock()
	_, err = os.Stat(l.statePath())
	if fresh && errors.Is(err, fs.ErrNotExist) {
		err = replace(l.statePath(), `{"consumed":{},"running":{}}`)
	}
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrState, err)
	}
	return l, nil
}

// outOfReach (B1-08 r7, item 1; B1-08h F3, F4, F6, F7) refuses a State dir equal to, inside, or
// containing a root a worker is handed: WorktreeRoot, JobRoot, the HOME and CODEX_HOME pins and every
// TmpRoots entry. It refuses a grant with no HOME pin, a root or State dir that resolves to "/", and
// a PATH pin with an entry that is not a clean absolute path or lies in a worker root. Every path is
// compared after resolving the symlinks of its longest existing prefix, on both sides, and one that
// does not resolve is refused, never skipped.
func outOfReach(g Grant, state string) error {
	home, ok := g.EnvPinned["HOME"]
	if !ok {
		return fmt.Errorf("%w: EnvPinned has no HOME pin", ErrGrant)
	}
	roots := append([]string{g.WorktreeRoot, g.JobRoot, home}, g.TmpRoots...)
	if c, ok := g.EnvPinned["CODEX_HOME"]; ok {
		roots = append(roots, c)
	}
	s, err := resolve(state)
	if err != nil || s == "/" {
		return fmt.Errorf("%w: State %q resolves to %q (%v)", ErrGrant, state, s, err)
	}
	resolvedRoots := make([]string, len(roots))
	for i, r := range roots {
		if !cleanRoot(r) {
			return fmt.Errorf("%w: worker root %q is not a clean absolute path", ErrGrant, r)
		}
		rr, err := resolve(r)
		if err != nil || rr == "/" {
			return fmt.Errorf("%w: worker root %q resolves to %q (%v)", ErrGrant, r, rr, err)
		}
		if rr == s || strings.HasPrefix(rr, s+"/") || strings.HasPrefix(s, rr+"/") {
			return fmt.Errorf("%w: State %q is within reach of worker root %q", ErrGrant, state, r)
		}
		resolvedRoots[i] = rr
	}
	path, ok := g.EnvPinned["PATH"]
	if !ok {
		return nil
	}
	for _, e := range strings.Split(path, ":") {
		if !cleanRoot(e) {
			return fmt.Errorf("%w: PATH entry %q is not a clean absolute path", ErrGrant, e)
		}
		re, err := resolve(e)
		if err != nil {
			return fmt.Errorf("%w: PATH entry %q: %v", ErrGrant, e, err)
		}
		for i, rr := range resolvedRoots {
			if re == rr || strings.HasPrefix(re, rr+"/") {
				return fmt.Errorf("%w: PATH entry %q is inside worker root %q", ErrGrant, e, roots[i])
			}
		}
	}
	return nil
}

// resolve resolves the symlinks of p's longest existing prefix and appends the rest unchanged. A
// prefix that exists but does not resolve (a dangling or looping link) is an error.
func resolve(p string) (string, error) {
	tail := ""
	for {
		r, err := filepath.EvalSymlinks(p)
		if err == nil {
			return filepath.Join(r, tail), nil
		}
		if _, lerr := os.Lstat(p); lerr == nil || !errors.Is(err, fs.ErrNotExist) || p == filepath.Dir(p) {
			return "", err
		}
		tail, p = filepath.Join(filepath.Base(p), tail), filepath.Dir(p)
	}
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

// checkSlots applies each slot's pin and its flag's rule, for this request's job.
func (l *launcher) checkSlots(t ArgvTemplate, req *Request) error {
	if !segment(req.JobID) {
		return fmt.Errorf("%w: JobID %q is not one clean path segment", ErrSpec, req.JobID)
	}
	for i, tok := range t.Tokens {
		if !isSlot(tok) {
			continue
		}
		pin, pinned := t.Pinned[tok]
		if pinned && req.Argv[i] != pin || !slotRules[t.Tokens[i-1]](&l.g, req, req.Argv[i]) {
			return fmt.Errorf("%w: %s %q", ErrSpec, t.Tokens[i-1], req.Argv[i])
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

// environ builds the worker's complete environment from req.Env: allow-listed names only, each
// pinned name at its pin, HOME always present, sorted, never nil, so nothing is inherited from the
// Kernel.
func (l *launcher) environ(env map[string]string) ([]string, error) {
	if _, ok := env["HOME"]; !ok {
		return nil, fmt.Errorf("%w: env has no HOME", ErrSpec)
	}
	out := make([]string, 0, len(env))
	for k, v := range env {
		pin, ok := l.g.EnvPinned[k]
		if !slices.Contains(l.g.EnvAllow, k) || strings.ContainsRune(v, 0) || slices.Contains(pinnedEnv, k) && (!ok || v != pin) {
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
	if err := l.checkSlots(*tmpl, &req); err != nil {
		return Receipt{}, err
	}
	env, err := l.environ(req.Env)
	if err != nil {
		return Receipt{}, err
	}
	if got, err := l.d.Digester.Digest(bin.Path); err != nil || got != bin.Digest {
		return Receipt{}, fmt.Errorf("%w: %q measured %q (%v)", ErrBinary, bin.Path, got, err)
	}
	rc, err := l.admit(ctx, req, bin.Digest, tmpl.Digest)
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
// verifies at the launcher's clock, the receipt log holds fewer than per_hour launches in the
// trailing hour, and fewer than concurrent jobs run. Last, the lease is consumed in the
// AUTHORITATIVE store (Consume, compare-and-set); only then is the Receipt appended, the launch
// recorded in the journal and the job recorded running. The local Consumed set is a second refusal,
// never the one relied on.
//
// B1-08 r7 (item 4): the receipts and the journal's launch records in the trailing hour must agree
// in number, checked before the lease is consumed; a mismatch either way is ErrState.
func (l *launcher) admit(ctx context.Context, req Request, digest, tmpl string) (rc Receipt, err error) {
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
		logged, head, err := l.journalled(ctx, now.Add(-time.Hour))
		if err != nil {
			return false, fmt.Errorf("%w: journal launch records: %v", ErrState, err)
		}
		if logged != len(recent) {
			return false, fmt.Errorf("%w: %d receipts but %d journal launch records in the trailing hour", ErrState, len(recent), logged)
		}
		if len(recent) >= l.g.Caps.PerHour {
			return false, fmt.Errorf("%w: %d in the trailing hour", ErrRateCap, len(recent))
		}
		if len(s.Running) >= l.g.Caps.Concurrent {
			return false, fmt.Errorf("%w: %d running", ErrConcurrentCap, len(s.Running))
		}
		if err := l.d.Leases.Consume(job, lease); err != nil {
			return false, fmt.Errorf("%w: consume: %v", ErrLease, err)
		}
		rc = Receipt{JobID: job, Binary: req.Binary, Digest: digest, Template: tmpl, Argv: slices.Clone(req.Argv), At: now}
		if err := l.d.Receipts.Append(rc); err != nil {
			return false, fmt.Errorf("%w: %v", ErrReceipt, err)
		}
		// A failed journal append leaves a receipt the journal lacks: this launch never execs, and
		// every later one is ErrState until the two are re-established.
		data, err := json.Marshal(rc)
		if err == nil {
			err = l.appendLaunch(ctx, head, data)
		}
		if err != nil {
			return false, fmt.Errorf("%w: journal: %v", ErrReceipt, err)
		}
		s.Consumed[job+" "+lease] = true
		s.Running[job] = lease
		return true, nil
	})
	return rc, err
}

// maxAppendTries bounds how often appendLaunch re-reads the head after a conflicting append.
const maxAppendTries = 8

// appendLaunch appends one launch record to JournalStream at head. It alone ignores the caller's
// cancellation (B1-08h F2): a caller cancelling between the Receipt and here must not leave the
// receipts and the journal disagreeing. Exec.Run still gets the caller's ctx. A foreign append that
// moved the head since journalled read it is not the launch's failure (F1): the head is read again
// and the append retried, so the receipt is never left without its record.
func (l *launcher) appendLaunch(ctx context.Context, head uint64, data []byte) error {
	ctx = context.WithoutCancel(ctx)
	for try := 0; ; try++ {
		_, err := l.d.Journal.Append(ctx, journal.Proposal{Stream: JournalStream, ExpectSeq: head, Type: JournalLaunchType, Data: data})
		if !errors.Is(err, journal.ErrSeqConflict) || try == maxAppendTries {
			return err
		}
		if head, _, err = l.d.Journal.Head(ctx, JournalStream); err != nil {
			return err
		}
	}
}

// journalled counts the journal's launch records whose At is after t, and returns the stream head.
// A launch record that is not a Receipt's JSON is an error.
func (l *launcher) journalled(ctx context.Context, t time.Time) (n int, head uint64, err error) {
	evs, err := l.d.Journal.Read(ctx, JournalStream, 1)
	if err != nil {
		return 0, 0, err
	}
	for _, e := range evs {
		head = e.Seq
		if e.Type != JournalLaunchType {
			continue
		}
		var rc Receipt
		if err := json.Unmarshal(e.Data, &rc); err != nil {
			return 0, 0, fmt.Errorf("launch record %d: %v", e.Seq, err)
		}
		if rc.At.After(t) {
			n++
		}
	}
	return n, head, nil
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
