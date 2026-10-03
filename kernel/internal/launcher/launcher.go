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
)

// Holder is the only principal that may hold the grant (09a §8.5).
const Holder = "kernel.launcher"

// Clock is the launcher's only source of time.
type Clock interface{ Now() time.Time }

// Exec runs one worker process and returns when it exits. The launcher calls it at most once
// per admitted launch and never for a refused one.
type Exec interface {
	Run(ctx context.Context, path string, argv []string) error
}

// Digester returns the content digest ("sha256:<hex>") of the binary at path.
type Digester interface {
	Digest(path string) (string, error)
}

// ReceiptSink receives one Receipt per launch that reached Exec.Run.
type ReceiptSink interface {
	Append(Receipt) error
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
}

// Grant is launcher_grant as the launcher consumes it. Verifying the founder signature on the
// Constitution record is upstream of this type.
type Grant struct {
	Holder         string
	Binaries       []Binary
	Templates      []ArgvTemplate // the only argv that may run
	ForbiddenFlags []string       // e.g. "--dangerously-skip-permissions", "--bare", "-s danger-full-access"
	Caps           Caps
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
}

// Launcher spawns workers under a Grant.
type Launcher interface {
	// Launch checks req against the grant, then calls Exec.Run exactly once and appends
	// exactly one Receipt; or it refuses before exec with one of the refusal errors above.
	Launch(ctx context.Context, req Request) (Receipt, error)
}

// TemplateOf pins a WorkerAdapter's launch line for the binary at path: the grant's templates
// are built from the adapters' Template(), never typed twice.
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
	mu       sync.Mutex
	inflight int
	recent   []time.Time // admission times of launches that may still be inside the trailing hour
}

// New returns a Launcher holding g. It refuses a template whose Digest does not match its
// Tokens (ErrGrant) or that carries a forbidden flag (ErrForbiddenFlag).
func New(g Grant, d Deps) (Launcher, error) {
	if d.Clock == nil || d.Exec == nil || d.Digester == nil || d.Receipts == nil {
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
	g.Binaries = append([]Binary(nil), g.Binaries...)
	g.Templates = append([]ArgvTemplate(nil), g.Templates...)
	g.ForbiddenFlags = append([]string(nil), g.ForbiddenFlags...)
	return &launcher{g: g, d: d}, nil
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

// matches reports whether argv is exactly tokens with each "<slot>" filled by one token that is
// non-empty and does not begin with '-'.
func matches(tokens, argv []string) bool {
	if len(tokens) != len(argv) {
		return false
	}
	for i, t := range tokens {
		slot := len(t) > 2 && t[0] == '<' && t[len(t)-1] == '>'
		if slot && (argv[i] == "" || argv[i][0] == '-') || !slot && argv[i] != t {
			return false
		}
	}
	return true
}

// prerequisites checks per_launch_requires (09a §8.5).
func prerequisites(req Request) error {
	p := req.Requires
	miss := func(what string) error { return fmt.Errorf("%w: %s", ErrPrerequisite, what) }
	lease := "job://" + req.JobID + "#"
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
	case p.ProviderMode != "sub" && p.ProviderMode != "subscription":
		return miss(fmt.Sprintf("provider mode %q", p.ProviderMode))
	case p.BudgetCapCents <= 0:
		return miss("budget cap")
	case !strings.HasPrefix(p.FencedLease, lease) || len(p.FencedLease) == len(lease):
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
	tmpl := ""
	for _, t := range l.g.Templates {
		if t.Binary == req.Binary && matches(t.Tokens, req.Argv) {
			tmpl = t.Digest
			break
		}
	}
	if tmpl == "" {
		return Receipt{}, ErrArgvNotPinned
	}
	if err := prerequisites(req); err != nil {
		return Receipt{}, err
	}
	if got, err := l.d.Digester.Digest(bin.Path); err != nil || got != bin.Digest {
		return Receipt{}, fmt.Errorf("%w: %q measured %q (%v)", ErrBinary, bin.Path, got, err)
	}
	rc, err := l.admit(req, bin.Digest, tmpl)
	if err != nil {
		return Receipt{}, err
	}
	defer l.done()
	if err := l.d.Receipts.Append(rc); err != nil {
		l.unadmit(rc.At)
		return Receipt{}, fmt.Errorf("%w: %v", ErrReceipt, err)
	}
	return rc, l.d.Exec.Run(ctx, bin.Path, append([]string(nil), req.Argv...))
}

// admit takes a concurrent slot and a per-hour slot, or neither. The hour is rolling: a launch
// counts while less than an hour has passed since it was admitted.
func (l *launcher) admit(req Request, digest, tmpl string) (Receipt, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.d.Clock.Now()
	kept := l.recent[:0]
	for _, t := range l.recent {
		if now.Sub(t) < time.Hour {
			kept = append(kept, t)
		}
	}
	l.recent = kept
	if len(l.recent) >= l.g.Caps.PerHour {
		return Receipt{}, fmt.Errorf("%w: %d in the trailing hour", ErrRateCap, len(l.recent))
	}
	if l.inflight >= l.g.Caps.Concurrent {
		return Receipt{}, fmt.Errorf("%w: %d running", ErrConcurrentCap, l.inflight)
	}
	l.recent = append(l.recent, now)
	l.inflight++
	return Receipt{JobID: req.JobID, Binary: req.Binary, Digest: digest, Template: tmpl,
		Argv: append([]string(nil), req.Argv...), At: now}, nil
}

// unadmit returns the per-hour slot of a launch that never reached exec.
func (l *launcher) unadmit(at time.Time) {
	l.mu.Lock()
	defer l.mu.Unlock()
	for i := len(l.recent) - 1; i >= 0; i-- {
		if l.recent[i].Equal(at) {
			l.recent = append(l.recent[:i], l.recent[i+1:]...)
			return
		}
	}
}

func (l *launcher) done() {
	l.mu.Lock()
	l.inflight--
	l.mu.Unlock()
}
