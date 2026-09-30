// Package launcher is the Kernel launcher: the only principal that may spawn workers, under the
// standing launcher_grant (docs/vision-v3/09a-ENGINEERING.md §8.5, DR-53, F1).
//
// B0-17b freezes this surface and its done-tests (launcher_donetest_test.go, build tag
// donetest). The implementation is B1-08's; until it lands every entry point returns
// ErrNotImplemented and the done-tests fail red.
//
// Time and exec are injected so a 03:00 unattended launch and a 121st launch in an hour are
// deterministic in a test, and so no test ever execs a real worker.
package launcher

import (
	"context"
	"errors"
	"time"
)

// ErrNotImplemented is returned by every entry point until B1-08 lands.
var ErrNotImplemented = errors.New("launcher: not implemented")

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
)

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

// New returns a Launcher holding g. It refuses a template whose Digest does not match its
// Tokens (ErrGrant) or that carries a forbidden flag (ErrForbiddenFlag).
func New(g Grant, d Deps) (Launcher, error) {
	return nil, ErrNotImplemented
}
