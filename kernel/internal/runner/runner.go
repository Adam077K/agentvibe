// Package runner is the Kernel runner's process half (B1-09a, 09a §8.2): admission under a
// capacity cap, the wall-clock and idle backstops, the process-group kill, and reconciliation after
// the daemon dies mid-job. It also holds the real launcher.Exec.
//
// The surface is frozen with the B1-09a done-tests (runner_donetest_test.go, build tag donetest).
// exec.go is the real launcher.Exec, proc.go the process tree, acl.go the ACL reader. Measurements
// behind the contract: docs/vision-v3/_process/DR-B1-09a-MEASURE-2026-10-03.md.
package runner

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"syscall"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/launcher"
)

var (
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

// ExecConfig names the worker the Exec defends against (r2, founder ruling Q1: the HYBRID exec model).
type ExecConfig struct {
	WorkerUID   int      // the worker's uid; 0 (root, or unset) is ErrSpec
	WorkerGIDs  []int    // the worker's groups
	WorkerRoots []string // every root a worker may write (worktrees, job dirs, TMPDIRs); >= 1, clean, absolute, not "/"
	// ACLWritable is the ACL half of the writability check (r4, a seam for the fail-closed ruling);
	// nil means the platform's ACL reader. Exec asks it about the resolved binary and each resolved
	// ancestor up to "/" until one is writable. (true, nil) makes that path writable, and so does ANY
	// error: an ACL it cannot read is writable. Only (false, nil) for every path allows in place.
	ACLWritable func(path string) (bool, error)
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
type Runner struct {
	cfg        Config
	identify   func(pid int) (Identity, error)
	mu         sync.Mutex
	reconciled bool
	active     map[string]bool
}

const (
	defaultCapacity = 4
	maxCapacity     = 12 // the launcher's cap
)

// New returns a Runner on cfg. A malformed Config is ErrSpec.
func New(cfg Config) (*Runner, error) {
	if cfg.Capacity == 0 {
		cfg.Capacity = defaultCapacity
	}
	if cfg.State == "" || cfg.Launcher == nil || cfg.Capacity < 0 || cfg.Capacity > maxCapacity {
		return nil, fmt.Errorf("%w: Config needs State, a Launcher, and Capacity 0..%d", ErrSpec, maxCapacity)
	}
	if err := os.MkdirAll(cfg.State, 0o700); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrState, err)
	}
	r := &Runner{cfg: cfg, identify: cfg.Identify, active: map[string]bool{}}
	if r.identify == nil {
		r.identify = ProcIdentity
	}
	return r, nil
}

// record is a job's persisted state: one file in Config.State, replaced atomically.
type record struct {
	Job    string `json:"job"`
	Lease  string `json:"lease"`
	Status Status `json:"status"`
	PID    int    `json:"pid,omitempty"`      // the leader, which is also its process group
	Start  int64  `json:"start_us,omitempty"` // the leader's kernel start time, unix microseconds
}

func (r *Runner) path(job string) string {
	return filepath.Join(r.cfg.State, hex.EncodeToString([]byte(job))+".json") // any job id is a safe file name
}

func (r *Runner) write(rec record) error {
	b, err := json.Marshal(rec)
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(r.cfg.State, ".tmp-")
	if err != nil {
		return err
	}
	_, err = tmp.Write(b)
	if err == nil {
		err = tmp.Sync()
	}
	if cerr := tmp.Close(); err == nil {
		err = cerr
	}
	if err == nil {
		err = os.Rename(tmp.Name(), r.path(rec.Job))
	}
	if err != nil {
		os.Remove(tmp.Name())
		return fmt.Errorf("%w: %v", ErrState, err)
	}
	return nil
}

func (r *Runner) read(file string) (record, error) {
	b, err := os.ReadFile(file)
	if err != nil {
		return record{}, err
	}
	var rec record
	if err := json.Unmarshal(b, &rec); err != nil || rec.Job == "" {
		return record{}, fmt.Errorf("%w: %s is corrupt", ErrState, file)
	}
	return rec, nil
}

// Run admits job (ErrState before Reconcile has completed on this Runner; ErrCapacity when Capacity
// jobs are already admitted; both before Launch is called),
// records it running with its process identity in State before the worker can outlive the daemon,
// launches it under job.Limits (every one of Wall, Idle, Stdout and Dir) and returns the Launch error
// once the whole tree is dead. It then records the job StatusKilled when that error is ErrWall,
// ErrIdle or ctx's error, and StatusExited otherwise (r3); a restart's Reconcile leaves either alone.
// A job id runs once: an id State already holds is ErrSpec, so no Runner relaunches it.
func (r *Runner) Run(ctx context.Context, job Job) error {
	id := job.Req.JobID
	r.mu.Lock()
	switch {
	case !r.reconciled:
		r.mu.Unlock()
		return fmt.Errorf("%w: Reconcile has not completed", ErrState)
	case len(r.active) >= r.cfg.Capacity:
		r.mu.Unlock()
		return fmt.Errorf("%w: %d jobs admitted", ErrCapacity, r.cfg.Capacity)
	case id == "" || r.active[id]:
		r.mu.Unlock()
		return fmt.Errorf("%w: job id %q is empty or already admitted", ErrSpec, id)
	}
	if _, err := os.Stat(r.path(id)); err == nil {
		r.mu.Unlock()
		return fmt.Errorf("%w: job %q is already recorded", ErrSpec, id)
	}
	r.active[id] = true
	r.mu.Unlock()
	defer func() { r.mu.Lock(); delete(r.active, id); r.mu.Unlock() }()

	rec := record{Job: id, Lease: job.Req.Requires.FencedLease, Status: StatusRunning}
	if err := r.write(rec); err != nil {
		return err
	}
	lctx := withStart(WithLimits(ctx, job.Limits), func(pid int) error {
		rec.PID = pid
		if idn, err := r.identify(pid); err == nil && idn.PID == pid {
			rec.Start = idn.Start.UnixMicro()
		}
		return r.write(rec) // a zero Start reads, to Reconcile, as an identity it cannot judge; a failed write kills the worker
	})
	_, err := r.cfg.Launcher.Launch(lctx, job.Req)
	rec.Status = StatusExited
	if errors.Is(err, ErrWall) || errors.Is(err, ErrIdle) || (ctx.Err() != nil && errors.Is(err, ctx.Err())) {
		rec.Status = StatusKilled
	}
	if e := r.write(rec); err == nil {
		err = e
	}
	return err
}

// Reconcile runs after a restart: for every job State records as running, it kills the surviving
// process group and every descendant (guarding against pid reuse), marks the job
// StatusInterrupted and calls Launcher.End for its lease. Interrupted is terminal: no Runner ever
// relaunches or re-ends it (r2, ruling Q3). A second Reconcile is a no-op. It must complete before
// Run admits anything (Q4). A recorded leader whose identity still matches is killed itself, with its
// descendants, even if it left its process group (r4). "Cannot judge" is not "interrupted" (r4): when
// Identify fails with anything but syscall.ESRCH, nothing is signalled through that pid, and when
// Launcher.End fails, the job stays running; either way Reconcile returns the error, Run stays
// refused (ErrState), and the next Reconcile retries the job.
func (r *Runner) Reconcile(ctx context.Context) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	files, err := filepath.Glob(filepath.Join(r.cfg.State, "*.json"))
	if err != nil {
		return fmt.Errorf("%w: %v", ErrState, err)
	}
	var errs []error
	for _, f := range files {
		if err := ctx.Err(); err != nil {
			return err
		}
		rec, err := r.read(f)
		if err != nil {
			errs = append(errs, fmt.Errorf("%w: %v", ErrState, err))
			continue
		}
		if rec.Status != StatusRunning || r.active[rec.Job] {
			continue
		}
		if err := r.interrupt(ctx, rec); err != nil {
			errs = append(errs, err)
		}
	}
	if err := errors.Join(errs...); err != nil {
		return err
	}
	r.reconciled = true
	return nil
}

// interrupt kills rec's tree, ends its launch, and records it interrupted. It records nothing, and
// ends nothing, for a tree it could not judge (an identity it cannot confirm, a failed scan) or could
// not kill: the job stays running and the next Reconcile retries it.
func (r *Runner) interrupt(ctx context.Context, rec record) error {
	if rec.PID > 1 {
		id, err := r.identify(rec.PID)
		var t *tree
		switch {
		case errors.Is(err, syscall.ESRCH): // the leader is gone; its group and descendants may not be
			t = r.tree(rec.PID)
		case err != nil:
			return fmt.Errorf("%w: job %q: cannot identify pid %d: %v", ErrState, rec.Job, rec.PID, err)
		case id.PID != rec.PID || rec.Start == 0:
			return fmt.Errorf("%w: job %q: pid %d is alive and its recorded identity is unknown", ErrState, rec.Job, rec.PID)
		case id.Start.UnixMicro() == rec.Start: // the leader: found by identity, wherever its group is
			t = r.tree(rec.PID)
			t.known[rec.PID] = procInfo{pid: rec.PID, start: id.Start}
		default: // the pid is another process now: nothing is signalled through it
		}
		if t != nil && !t.kill() {
			return fmt.Errorf("%w: job %q: its process tree could not be confirmed dead", ErrState, rec.Job)
		}
	}
	if err := r.cfg.Launcher.End(ctx, rec.Job, rec.Lease); err != nil && !errors.Is(err, launcher.ErrLease) {
		return fmt.Errorf("job %q: end launch: %w", rec.Job, err) // ErrLease: its end is already recorded
	}
	rec.Status = StatusInterrupted
	return r.write(rec)
}

// tree is pgid's process tree, each member vetted against Identify before it is touched.
func (r *Runner) tree(pgid int) *tree {
	return newTree(pgid, func(p procInfo) bool {
		i, err := r.identify(p.pid)
		return err == nil && i.PID == p.pid && i.Start.Equal(p.start)
	})
}

// Status reports jobID's recorded status.
func (r *Runner) Status(jobID string) (Status, error) {
	rec, err := r.read(r.path(jobID))
	if err != nil {
		return "", fmt.Errorf("runner: job %q: %w", jobID, err)
	}
	return rec.Status, nil
}
