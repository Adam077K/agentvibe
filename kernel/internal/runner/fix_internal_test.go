package runner

// Regression tests for the three LOWs of the re-review of B1-09a @b67e2f9. Internal, because each
// needs a seam (lookup, killTree) that no black-box test can make fail on demand. Not frozen.

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"os"
	"slices"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/launcher"
)

type iLauncher struct {
	exec launcher.Exec
	mu   sync.Mutex
	ends []string
}

func (l *iLauncher) Launch(ctx context.Context, req launcher.Request) (launcher.Receipt, error) {
	b, err := os.ReadFile(req.Binary)
	if err != nil {
		return launcher.Receipt{}, err
	}
	s := sha256.Sum256(b)
	return launcher.Receipt{JobID: req.JobID}, l.exec.Run(ctx, req.Binary, "sha256:"+hex.EncodeToString(s[:]), slices.Clone(req.Argv), []string{})
}

func (l *iLauncher) End(_ context.Context, job, lease string) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.ends = append(l.ends, job+" "+lease)
	return nil
}

func iExec(t *testing.T) launcher.Exec {
	t.Helper()
	gids, _ := os.Getgroups()
	e, err := NewExec(ExecConfig{WorkerUID: os.Getuid(), WorkerGIDs: gids, WorkerRoots: []string{"/nonexistent-b109a-root"}})
	if err != nil {
		t.Fatal(err)
	}
	return e
}

func iRunner(t *testing.T, identify func(int) (Identity, error)) *Runner {
	t.Helper()
	r, err := New(Config{State: t.TempDir(), Capacity: 2, Launcher: &iLauncher{exec: iExec(t)}, Identify: identify})
	if err != nil {
		t.Fatal(err)
	}
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatal(err)
	}
	return r
}

func iJob(id string, argv ...string) Job {
	return Job{Req: launcher.Request{JobID: id, Binary: "/bin/sh", Argv: argv, Requires: launcher.Prerequisites{FencedLease: "job://" + id + "#1"}},
		Limits: Limits{Wall: 30 * time.Second, Idle: 30 * time.Second, Stdout: io.Discard}}
}

func gone(t *testing.T, pid int, what string) {
	t.Helper()
	for end := time.Now().Add(2 * time.Second); time.Now().Before(end); time.Sleep(10 * time.Millisecond) {
		if syscall.Kill(pid, 0) == syscall.ESRCH {
			return
		}
	}
	t.Fatalf("%s: pid %d still exists", what, pid)
}

// The escaper leaves its process group at once (joins its parent's), then records its pid and sleeps.
// Run through /usr/bin/perl in place: warm and protected, so it has left before any scan.
const escapeScript = `setpgrp(0, getpgrp(getppid())); open(F, ">>", $ENV{FX_PIDS}); print F "$$\n"; close(F); sleep 100;`

// LOW 1: when the leader cannot be identified after Start, the worker is killed and Run fails at once,
// not at the wall. An escaper is the worker, because an unseeded tree cannot find one outside its
// group: with the fail-closed branch removed, Run runs on to the wall and returns ErrWall.
func TestFix2_LookupFailureKillsWorker(t *testing.T) {
	var pid int
	old := lookup
	lookup = func(p int) (procInfo, error) {
		pid = p
		return procInfo{}, errors.New("b109a: process table unreadable")
	}
	defer func() { lookup = old }()
	e := iExec(t)
	pids := t.TempDir() + "/pids"
	done := make(chan error, 1)
	go func() {
		done <- e.Run(WithLimits(context.Background(), Limits{Wall: 100 * time.Second, Idle: 100 * time.Second, Stdout: io.Discard}),
			"/usr/bin/perl", fileSum(t, "/usr/bin/perl"), []string{"-e", escapeScript}, []string{"FX_PIDS=" + pids})
	}()
	defer func() {
		if b, err := os.ReadFile(pids); err == nil {
			for _, f := range strings.Fields(string(b)) {
				if n, err := strconv.Atoi(f); err == nil && n > 1 {
					syscall.Kill(n, syscall.SIGKILL)
				}
			}
		}
	}()
	select {
	case err := <-done:
		if err == nil || errors.Is(err, ErrWall) {
			t.Fatalf("Run returned %v; want a prompt failure that is not the wall backstop", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Run did not return within 5s: the unidentified leader was left running to the wall")
	}
	if pid == 0 {
		t.Fatal("lookup was never asked about the leader")
	}
	gone(t, pid, "leader that could not be identified")
}

func fileSum(t *testing.T, path string) string {
	t.Helper()
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	s := sha256.Sum256(b)
	return "sha256:" + hex.EncodeToString(s[:])
}

// LOW 2: an Identify that fails (other than ESRCH, a leader already gone) at start kills the worker and
// fails the job; recording Start 0 for a live worker would wedge the next Reconcile.
func TestFix2_IdentifyFailureKillsWorker(t *testing.T) {
	var pid int
	r := iRunner(t, func(p int) (Identity, error) { pid = p; return Identity{}, errors.New("b109a: identify broke") })
	done := make(chan error, 1)
	go func() { done <- r.Run(context.Background(), iJob("job-i", "-c", "sleep 100")) }()
	select {
	case err := <-done:
		if err == nil {
			t.Fatal("Run succeeded although the leader could not be identified")
		}
	case <-time.After(10 * time.Second):
		t.Fatal("Run did not return: the unidentified worker was left running")
	}
	gone(t, pid, "worker whose identity could not be recorded")
}

// LOW 2, the other side: a leader that is already gone at start (ESRCH) ran and ended; that is not a
// failure.
func TestFix2_IdentifyESRCHIsNotAFailure(t *testing.T) {
	r := iRunner(t, func(p int) (Identity, error) { return Identity{}, syscall.ESRCH })
	if err := r.Run(context.Background(), iJob("job-e", "-c", "exit 0")); err != nil {
		t.Fatalf("Run: %v", err)
	}
	if st, err := r.Status("job-e"); err != nil || st != StatusExited {
		t.Fatalf("status %q (%v), want exited", st, err)
	}
}

// LOW 3: a tree not confirmed dead is neither exited nor killed: the job stays running, so the next
// Reconcile retries it.
func TestFix2_SurvivorsKeepTheJobRunning(t *testing.T) {
	old := killTree
	killTree = func(tr *tree) bool { tr.kill(); return false } // the tree is dead; the confirmation failed
	defer func() { killTree = old }()
	r := iRunner(t, nil)
	err := r.Run(context.Background(), iJob("job-s", "-c", "exit 0"))
	if !errors.Is(err, errSurvivors) {
		t.Fatalf("Run: %v, want errSurvivors", err)
	}
	if st, err := r.Status("job-s"); err != nil || st != StatusRunning {
		t.Fatalf("status %q (%v), want running so Reconcile retries it", st, err)
	}
	killTree = old
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatalf("the retry: %v", err)
	}
	if st, _ := r.Status("job-s"); st != StatusInterrupted {
		t.Fatalf("after the retry status %q, want interrupted", st)
	}
}
