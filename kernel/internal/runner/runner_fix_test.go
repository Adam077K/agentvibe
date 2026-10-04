package runner_test

// Regression tests for the independent review of B1-09a @260d5ec (one HIGH, six LOW). Not frozen, and
// they build without the donetest tag; every helper is fx-prefixed so it cannot meet the frozen file's.

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/launcher"
	"github.com/Adam077K/agentvibe/kernel/internal/runner"
)

func fxDigest(t *testing.T, path string) string {
	t.Helper()
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	s := sha256.Sum256(b)
	return "sha256:" + hex.EncodeToString(s[:])
}

func fxExec(t *testing.T, uid int) launcher.Exec {
	t.Helper()
	gids, _ := os.Getgroups()
	e, err := runner.NewExec(runner.ExecConfig{WorkerUID: uid, WorkerGIDs: gids, WorkerRoots: []string{"/nonexistent-b109a-root", filepath.Dir(t.TempDir())}})
	if err != nil {
		t.Fatal(err)
	}
	return e
}

func fxLive(pid int) bool { return syscall.Kill(pid, 0) == nil }

func fxPids(path string) []int {
	b, _ := os.ReadFile(path)
	var out []int
	for _, f := range strings.Fields(string(b)) {
		if n, err := strconv.Atoi(f); err == nil && n > 1 {
			out = append(out, n)
		}
	}
	return out
}

func fxReap(t *testing.T, pids string) {
	t.Cleanup(func() {
		for _, p := range fxPids(pids) {
			syscall.Kill(p, syscall.SIGKILL)
		}
	})
}

func fxWaitDead(t *testing.T, what string, pids string) {
	t.Helper()
	for end := time.Now().Add(2 * time.Second); ; time.Sleep(20 * time.Millisecond) {
		var live []int
		for _, p := range fxPids(pids) {
			if fxLive(p) {
				live = append(live, p)
			}
		}
		if len(live) == 0 {
			return
		}
		if time.Now().After(end) {
			t.Fatalf("%s: still alive: %v", what, live)
		}
	}
}

// fxEscapeScript is perl code that leaves its process group at once, by joining its parent's group,
// then records its pid: a kill(-pgid) never reaches it. Run through /usr/bin/perl in place, which is
// warm and protected, so it has left before the Exec's first scan at 50ms; a freshly copied binary
// measured 150ms to start and would be seen in its group first.
const (
	fxPerl         = "/usr/bin/perl"
	fxEscapeScript = `setpgrp(0, getpgrp(getppid())); open(F, ">>", $ENV{FX_PIDS}); print F "$$\n"; close(F); sleep 100;`
)

// fxStartEscaper starts the escaper as its own group leader, as Exec does, and waits for it to record.
func fxStartEscaper(t *testing.T, pids string) *exec.Cmd {
	t.Helper()
	c := exec.Command(fxPerl, "-e", fxEscapeScript)
	c.Env = []string{"FX_PIDS=" + pids}
	c.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	if err := c.Start(); err != nil {
		t.Fatal(err)
	}
	go c.Wait()
	for end := time.Now().Add(5 * time.Second); len(fxPids(pids)) == 0 && time.Now().Before(end); time.Sleep(10 * time.Millisecond) {
	}
	return c
}

type fxLauncher struct {
	exec  launcher.Exec
	mu    sync.Mutex
	ends  []string
	prime func() // runs inside Launch, before Exec.Run
}

func (f *fxLauncher) Launch(ctx context.Context, req launcher.Request) (launcher.Receipt, error) {
	if f.prime != nil {
		f.prime()
	}
	var env []string
	for k, v := range req.Env {
		env = append(env, k+"="+v)
	}
	d := "sha256:unreadable"
	if b, err := os.ReadFile(req.Binary); err == nil {
		s := sha256.Sum256(b)
		d = "sha256:" + hex.EncodeToString(s[:])
	}
	if env == nil {
		env = []string{}
	}
	return launcher.Receipt{JobID: req.JobID}, f.exec.Run(ctx, req.Binary, d, slices.Clone(req.Argv), env)
}

func (f *fxLauncher) End(_ context.Context, job, l string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.ends = append(f.ends, job+" "+l)
	return nil
}

func fxRunner(t *testing.T, state string, l launcher.Launcher) *runner.Runner {
	t.Helper()
	r, err := runner.New(runner.Config{State: state, Capacity: 2, Launcher: l})
	if err != nil {
		t.Fatal(err)
	}
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatal(err)
	}
	return r
}

func fxJob(id, bin string, argv []string, env map[string]string, l runner.Limits) runner.Job {
	return runner.Job{Req: launcher.Request{JobID: id, Binary: bin, Argv: argv, Env: env, Requires: launcher.Prerequisites{FencedLease: "job://" + id + "#1"}}, Limits: l}
}

// HIGH: a leader that leaves its group before the first scan must be dead when Run returns.
func TestFix_ExecKillsLeaderThatLeftItsGroup(t *testing.T) {
	dir := t.TempDir()
	pids := filepath.Join(dir, "pids")
	fxReap(t, pids)
	const wall = 1500 * time.Millisecond
	done := make(chan error, 1)
	t0 := time.Now()
	go func() {
		done <- fxExec(t, os.Getuid()).Run(runner.WithLimits(context.Background(), runner.Limits{Wall: wall, Idle: time.Minute, Stdout: io.Discard}),
			fxPerl, fxDigest(t, fxPerl), []string{"-e", fxEscapeScript}, []string{"FX_PIDS=" + pids})
	}()
	select {
	case err := <-done:
		if !errors.Is(err, runner.ErrWall) {
			t.Fatalf("err %v, want ErrWall", err)
		}
		if took := time.Since(t0); took > wall+2*time.Second {
			t.Errorf("Run took %v for a wall of %v", took, wall)
		}
	case <-time.After(wall + 10*time.Second):
		t.Fatal("Run did not return")
	}
	if len(fxPids(pids)) != 1 {
		t.Fatalf("recorded pids %v, want the leader's", fxPids(pids))
	}
	fxWaitDead(t, "leader that left its group, after Run", pids)
}

// HIGH, Reconcile: the recorded leader's identity matches, and it has left its group.
func TestFix_ReconcileKillsLeaderThatLeftItsGroup(t *testing.T) {
	dir := t.TempDir()
	pids := filepath.Join(dir, "pids")
	fxReap(t, pids)
	c := fxStartEscaper(t, pids)
	id, err := runner.ProcIdentity(c.Process.Pid)
	if err != nil {
		t.Fatal(err)
	}
	fxRecord(t, state(t, dir), "job-x", c.Process.Pid, id.Start.UnixMicro())
	fl := &fxLauncher{}
	r, err := runner.New(runner.Config{State: state(t, dir), Capacity: 2, Launcher: fl})
	if err != nil {
		t.Fatal(err)
	}
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	fxWaitDead(t, "leader that left its group, after Reconcile", pids)
	if st, err := r.Status("job-x"); err != nil || st != runner.StatusInterrupted {
		t.Fatalf("status %q (%v), want interrupted", st, err)
	}
}

func state(t *testing.T, dir string) string {
	t.Helper()
	s := filepath.Join(dir, "state")
	if err := os.MkdirAll(s, 0o700); err != nil {
		t.Fatal(err)
	}
	return s
}

// fxRecord writes a running job record the way the Runner persists one.
func fxRecord(t *testing.T, state, job string, pid int, startUS int64) {
	t.Helper()
	body := `{"job":"` + job + `","lease":"job://` + job + `#1","status":"running","pid":` + strconv.Itoa(pid) + `,"start_us":` + strconv.FormatInt(startUS, 10) + `}`
	if err := os.WriteFile(filepath.Join(state, hex.EncodeToString([]byte(job))+".json"), []byte(body), 0o600); err != nil {
		t.Fatal(err)
	}
}

// LOW 4: a recorded leader whose identity cannot be judged (Start 0) and is alive is neither killed
// nor recorded interrupted: the job stays running and Reconcile says so.
func TestFix_ReconcileDoesNotGuess(t *testing.T) {
	dir := t.TempDir()
	pids := filepath.Join(dir, "pids")
	fxReap(t, pids)
	c := fxStartEscaper(t, pids)
	fxRecord(t, state(t, dir), "job-g", c.Process.Pid, 0)
	fl := &fxLauncher{}
	r, err := runner.New(runner.Config{State: state(t, dir), Capacity: 2, Launcher: fl})
	if err != nil {
		t.Fatal(err)
	}
	if err := r.Reconcile(context.Background()); err == nil {
		t.Fatal("Reconcile returned nil for a job whose process it could not judge")
	}
	if st, _ := r.Status("job-g"); st != runner.StatusRunning {
		t.Fatalf("status %q, want running", st)
	}
	if len(fl.ends) != 0 {
		t.Fatalf("End called for a job that was not judged: %q", fl.ends)
	}
	if !fxLive(c.Process.Pid) {
		t.Fatal("the unjudged process was signalled")
	}
	if err := r.Run(context.Background(), fxJob("job-n", "/bin/sh", nil, map[string]string{}, runner.Limits{Wall: time.Second, Idle: time.Second})); !errors.Is(err, runner.ErrState) {
		t.Fatalf("Run after a failed Reconcile: %v, want ErrState", err)
	}
}

// LOW 5: a Stdout that blocks forever must not hang Run past the worker's end.
func TestFix_BlockingStdoutDoesNotHangRun(t *testing.T) {
	dir := t.TempDir()
	bin := filepath.Join(dir, "talk")
	if err := os.WriteFile(bin, []byte("#!/bin/sh\necho hi\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	block := make(chan struct{})
	defer close(block)
	done := make(chan error, 1)
	go func() {
		done <- fxExec(t, os.Getuid()).Run(runner.WithLimits(context.Background(), runner.Limits{Wall: 30 * time.Second, Idle: 30 * time.Second, Stdout: fxBlocked(block)}),
			bin, fxDigest(t, bin), nil, []string{})
	}()
	select {
	case <-done:
	case <-time.After(8 * time.Second):
		t.Fatal("Run is held by a Stdout that never returns")
	}
}

type fxBlocked chan struct{}

func (b fxBlocked) Write(p []byte) (int, error) { <-b; return len(p), nil }

// LOW 6: when the pid record cannot be written the worker is killed and the job fails.
func TestFix_PidRecordFailureKillsWorker(t *testing.T) {
	dir := t.TempDir()
	pids := filepath.Join(dir, "pids")
	fxReap(t, pids)
	st := state(t, dir)
	t.Cleanup(func() { os.Chmod(st, 0o700) })
	fl := &fxLauncher{exec: fxExec(t, os.Getuid())}
	fl.prime = func() { os.Chmod(st, 0o500) } // the running record is written; the pid record is not
	r := fxRunner(t, st, fl)
	done := make(chan error, 1)
	go func() {
		done <- r.Run(context.Background(), fxJob("job-w", fxPerl, []string{"-e", fxEscapeScript}, map[string]string{"FX_PIDS": pids}, runner.Limits{Wall: time.Minute, Idle: time.Minute, Stdout: io.Discard}))
	}()
	select {
	case err := <-done:
		if err == nil {
			t.Fatal("Run succeeded with an unwritable State")
		}
	case <-time.After(10 * time.Second):
		t.Fatal("Run did not return: the unrecorded worker was left running")
	}
	fxWaitDead(t, "worker whose pid could not be recorded", pids)
}

// LOW 3: a private copy must not live under a directory the worker can write.
func TestFix_CopyDirMustNotBeWorkerWritable(t *testing.T) {
	root := t.TempDir()
	bin := filepath.Join(root, "w")
	marker := filepath.Join(root, "ran")
	if err := os.WriteFile(bin, []byte("#!/bin/sh\n/usr/bin/touch "+marker+"\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	run := func() error {
		e, err := runner.NewExec(runner.ExecConfig{WorkerUID: 4242, WorkerGIDs: []int{4242}, WorkerRoots: []string{"/nonexistent-b109a-root", root}})
		if err != nil {
			t.Fatal(err)
		}
		return e.Run(runner.WithLimits(context.Background(), runner.Limits{Wall: 10 * time.Second, Idle: 10 * time.Second, Stdout: io.Discard}),
			bin, fxDigest(t, bin), nil, []string{})
	}
	if err := run(); err != nil || !fxExists(marker) {
		t.Fatalf("control, a private temp dir: err %v, ran %v", err, fxExists(marker))
	}
	os.Remove(marker)
	open := t.TempDir()
	if err := os.Chmod(open, 0o777); err != nil {
		t.Fatal(err)
	}
	t.Setenv("TMPDIR", open)
	if err := run(); err == nil || fxExists(marker) {
		t.Fatalf("a world-writable TMPDIR: err %v, ran %v; want a refusal and nothing run", err, fxExists(marker))
	}
}

func fxExists(p string) bool { _, err := os.Stat(p); return err == nil }
