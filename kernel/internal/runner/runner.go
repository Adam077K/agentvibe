// Package runner is the Kernel runner's process half (B1-09a, 09a §8.2): admission under a
// capacity cap, the wall-clock and idle backstops, the process-group kill, and reconciliation after
// the daemon dies mid-job. It also holds the real launcher.Exec.
//
// This file is the surface frozen with the B1-09a done-tests (runner_donetest_test.go, build tag
// donetest). Every entry point returns ErrNotImplemented: B1-09a implements it. Measurements behind
// the contract: docs/vision-v3/_process/DR-B1-09a-MEASURE-2026-10-03.md.
package runner

import (
	"context"
	"errors"
	"io"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/launcher"
)

var (
	// ErrNotImplemented is returned by every entry point until B1-09a lands.
	ErrNotImplemented = errors.New("runner: not implemented")
	// ErrDigest: the bytes Exec would execute do not hash to the digest it was given, or the digest
	// is not "sha256:" + 64 lowercase hex. Nothing ran.
	ErrDigest = errors.New("runner: executed bytes do not match the pinned digest")
	// ErrSpec: Exec.Run was called with no Limits on its ctx, a nil env, or a non-positive Wall or
	// Idle; or New was given a malformed Config. Nothing ran.
	ErrSpec = errors.New("runner: missing or malformed launch limits")
	// ErrCapacity: Config.Capacity jobs are already admitted. Refused before Launcher.Launch.
	ErrCapacity = errors.New("runner: capacity reached")
	// ErrWall: the wall-clock backstop fired. SIGINT went to the process group at 90% of Wall and
	// SIGKILL to the group and every descendant at 100%.
	ErrWall = errors.New("runner: wall-clock backstop")
	// ErrIdle: the worker wrote no stdout byte for Idle; the group and every descendant were killed.
	ErrIdle = errors.New("runner: idle backstop")
	// ErrState: Run was called before Reconcile completed on this Runner (r2, ruling Q4), or State is
	// unreadable. Refused before Launch.
	ErrState = errors.New("runner: not reconciled, or state unreadable")
)

// Limits are one launch's backstops and plumbing. launcher.Exec.Run's signature is frozen by B1-08,
// so they travel on the ctx passed to Launcher.Launch (WithLimits); Exec.Run refuses a ctx that
// carries none (ErrSpec), so no worker ever runs without backstops.
type Limits struct {
	Wall   time.Duration // SIGINT the process group at 90%, SIGKILL it and every descendant at 100%
	Idle   time.Duration // no stdout byte for Idle: SIGKILL the group and every descendant
	Stdout io.Writer     // receives every byte of the worker's stdout; each byte resets Idle
	Dir    string        // the worker's working directory; "" is the Exec's choice
}

// WithLimits returns ctx carrying l for Exec.Run.
func WithLimits(ctx context.Context, l Limits) context.Context { return ctx }

// ExecConfig names the worker the Exec defends against (r2, founder ruling Q1: the HYBRID exec model).
type ExecConfig struct {
	WorkerUID   int      // the worker's uid; 0 (root, or unset) is ErrSpec
	WorkerGIDs  []int    // the worker's groups
	WorkerRoots []string // every root a worker may write (worktrees, job dirs, TMPDIRs); >= 1, clean, absolute, not "/"
}

// NewExec returns the real launcher.Exec, or ErrSpec for a malformed cfg. Run executes only bytes
// that hash to digest, on both paths below. It execs in place only when the binary, symlinks resolved
// at exec time, and EVERY ancestor directory of the resolved path lie outside all WorkerRoots and are
// not writable by the worker (owner, group and other mode bits against WorkerUID and WorkerGIDs); it
// then execs the resolved path. "Not writable" includes ACLs and fails closed (r3, orchestrator
// ceo-1, 2026-10-04): an extended ACL entry on the binary or any resolved ancestor that grants a
// write-class right (write, append, add_file, add_subdirectory, delete, delete_child, writeattr,
// writeextattr, writesecurity, chown) to anyone other than root or the daemon's uid, or an ACL that
// cannot be read, makes it writable. Otherwise it copies into a private directory and execs the
// copy, and the bytes it execs are the bytes it hashed: never hash once and read the file again.
// The worker runs in a new process group, with exactly env as the environment (nil env is ErrSpec;
// nothing is inherited from the Kernel), and Run returns only after the group and every descendant
// are dead, however the leader ended, a leader that exits 0 included. The 90% SIGINT goes to the
// whole process group. ctx cancellation kills the tree and returns ctx.Err(). A worker that exits
// non-zero, or dies by a signal that no backstop and no ctx sent, is reported as an error wrapping
// its *exec.ExitError (r3).
func NewExec(cfg ExecConfig) (launcher.Exec, error) { return stubExec{}, nil }

type stubExec struct{}

func (stubExec) Run(context.Context, string, string, []string, []string) error {
	return ErrNotImplemented
}

// Status is a job's state in the runner's persisted record.
type Status string

const (
	StatusRunning Status = "running"
	StatusExited  Status = "exited" // Launch returned; the worker's outcome is the adapter's to classify
	StatusKilled  Status = "killed" // a backstop or ctx cancellation killed it
	// StatusInterrupted: the daemon died while the job ran; Reconcile killed what survived and
	// ended the launch. Never a pass.
	StatusInterrupted Status = "interrupted"
)

// Job is one admitted unit of work.
type Job struct {
	Req    launcher.Request // Req.JobID names the job; Req.Requires.FencedLease is its lease
	Limits Limits
}

// Identity is a process's identity: its pid and the kernel's start time for it. The kernel reuses
// pids, so a pid alone names no process; a pid whose start time differs is another process (r3, the
// pid-reuse guard).
type Identity struct {
	PID   int
	Start time.Time
}

// ProcIdentity returns pid's identity from the kernel's process table (kern.proc.pid on darwin; never
// a ps subprocess), or an error wrapping syscall.ESRCH when no live process has that pid.
func ProcIdentity(pid int) (Identity, error) { return Identity{}, ErrNotImplemented }

// Config configures a Runner.
type Config struct {
	State    string            // the runner's persisted state directory; it survives the daemon
	Capacity int               // at most Capacity jobs at once; 0 means 4; above 12 (the launcher cap) or negative is ErrSpec
	Launcher launcher.Launcher // the Kernel launcher, built with NewExec()
	// Identify is the pid-reuse guard's only source of process identity (r3); nil means
	// ProcIdentity. Run records the identity Identify returns for the job's leader. Reconcile
	// signals a recorded process, its process group, or any process found through either, only while
	// Identify still returns the recorded identity; a differing start time means the pid was reused
	// and nothing is signalled through it. When Identify reports the leader gone (syscall.ESRCH),
	// Reconcile still kills what survives in its process group and every descendant.
	Identify func(pid int) (Identity, error)
}

// Runner admits jobs and launches them under their Limits.
type Runner struct{}

// New returns a Runner on cfg. A malformed Config is ErrSpec.
func New(cfg Config) (*Runner, error) { return nil, ErrNotImplemented }

// Run admits job (ErrState before Reconcile has completed on this Runner; ErrCapacity when Capacity
// jobs are already admitted; both before Launch is called),
// records it running with its process identity in State before the worker can outlive the daemon,
// launches it under job.Limits (every one of Wall, Idle, Stdout and Dir) and returns the Launch error
// once the whole tree is dead. It then records the job StatusKilled when that error is ErrWall,
// ErrIdle or ctx's error, and StatusExited otherwise (r3); a restart's Reconcile leaves either alone.
func (r *Runner) Run(ctx context.Context, job Job) error { return ErrNotImplemented }

// Reconcile runs after a restart: for every job State records as running, it kills the surviving
// process group and every descendant (guarding against pid reuse), marks the job
// StatusInterrupted and calls Launcher.End for its lease. Interrupted is terminal: no Runner ever
// relaunches or re-ends it (r2, ruling Q3). A second Reconcile is a no-op. It must complete before
// Run admits anything (Q4).
func (r *Runner) Reconcile(ctx context.Context) error { return ErrNotImplemented }

// Status reports jobID's recorded status.
func (r *Runner) Status(jobID string) (Status, error) { return "", ErrNotImplemented }
