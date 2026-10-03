//go:build donetest

// Done-tests for B1-09a, "Runner: admission, capacity/wall/idle backstops, pgid kill"; acceptance
// "Daemon killed mid-job → reconciled, no orphan" (build/jobs.yml). Frozen 2026-10-03, round 1.
// RE-FREEZE r2 2026-10-03: "2026-10-03 founder+orchestrator rulings". Founder Q1 (exec model, HYBRID):
// exec in place only when the resolved binary and EVERY ancestor directory lie outside all worker
// roots and are not writable by the worker (owner/group/other mode bits against the worker's uid and
// gids, symlinks resolved, at exec time); otherwise copy to a private dir and exec the copy. NewExec
// takes that ExecConfig. Orchestrator, fail-safe: Q2 the double-fork + setsid escape is a known gap
// until B1-10 (DR, no test); Q3 an interrupted job is terminal and never requeued; Q4 Run before
// Reconcile is refused (ErrState); Q5 Capacity defaults to 4 when 0, must be <= 12 (the launcher cap).
// Canon: 09a §8.2 ("own process group"; "wall-clock (SIGINT 90%, SIGKILL pgid 100%) and 5-minute
// idle backstops"), §15 ("orphan processes 2 min after kill: 0"). Measured first, on this machine,
// with no model turn and no network: docs/vision-v3/_process/DR-B1-09a-MEASURE-2026-10-03.md.
//
// Every worker here is this test binary re-executed in a helper mode named by argv[1] (never
// claude or codex), or a /bin/sh script. Each test pins one item:
//
//	ExecInPlaceOrCopy           r2: protected binary in place; worker-writable file or ancestor,
//	                            or a worker root, is copied; NewExec refuses a bad ExecConfig
//	ExecRunsOnlyMatchingDigest  the real Exec runs only bytes that hash to the digest, and refuses
//	                            a file changed after the check (rename, in-place, and a live swapper)
//	ExecEnvExact                the child gets exactly the env passed, and exactly the argv
//	CapacityCap                 with Capacity N, the N+1th admission is refused before Launch;
//	                            r2: 0 means 4, above 12 is refused, Run before Reconcile is refused
//	WallBackstopKillsTree       SIGINT the group at 90%, SIGKILL the whole tree at 100%
//	IdleBackstopKillsTree       no stdout byte for Idle kills the whole tree; output resets it
//	CtxCancelKillsTree          ctx cancellation kills the whole tree
//	DaemonKilledMidJob          the acceptance: SIGKILL the daemon, restart, Reconcile: no orphan,
//	                            the job is interrupted, its launch is ended once; r2: Run before
//	                            Reconcile is refused; a later restart leaves it interrupted, unlaunched
//
// "The whole tree" is the leader, its child and a grandchild that called setsid(2): measured, a
// kill(-pgid) misses the setsid grandchild, so every test checks it by pid.
//
// Run: go -C kernel test -count=1 -tags donetest ./internal/runner/
// Process tests: run with the sandbox off if a spawn is refused; /bin/ps is refused under it.
package runner_test

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/signal"
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

const helperPrefix = "b109a-helper:"

// TestMain dispatches helper modes. A copy spawned without its helper argv exits 3 rather than
// running the suite again: go test always passes -test.* flags, a worker never does.
func TestMain(m *testing.M) {
	if len(os.Args) > 1 && strings.HasPrefix(os.Args[1], helperPrefix) {
		helper(strings.TrimPrefix(os.Args[1], helperPrefix))
		os.Exit(0)
	}
	for _, a := range os.Args[1:] {
		if strings.HasPrefix(a, "-test.") {
			os.Exit(m.Run())
		}
	}
	os.Exit(3)
}

func appendLine(path, line string) {
	if path == "" {
		return
	}
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o600)
	if err == nil {
		fmt.Fprintln(f, line)
		f.Close()
	}
}

func sleepForever() {
	for {
		time.Sleep(time.Hour)
	}
}

func spawnSelf(mode string) {
	c := exec.Command(os.Getenv("B1_09A_SELF"), helperPrefix+mode)
	c.Env = os.Environ()
	if err := c.Start(); err != nil {
		fmt.Fprintln(os.Stderr, "spawn", mode, err)
		os.Exit(4)
	}
}

func helper(mode string) {
	switch mode {
	case "env": // the environment, then the argv after the mode
		fmt.Print(strings.Join(os.Environ(), "\n"))
		fmt.Print("\n--argv--\n")
		fmt.Print(strings.Join(os.Args[2:], "\n"))
	case "tree": // leader: traps SIGINT, spawns mid, which spawns a setsid grandchild
		ch := make(chan os.Signal, 4)
		signal.Notify(ch, syscall.SIGINT)
		go func() {
			for range ch {
				appendLine(os.Getenv("B1_09A_INT"), strconv.FormatInt(time.Now().UnixNano(), 10))
			}
		}()
		spawnSelf("mid")
		appendLine(os.Getenv("B1_09A_PIDS"), strconv.Itoa(os.Getpid()))
		sleepForever()
	case "mid": // default SIGINT action: it dies at the 90% stage
		spawnSelf("setsid")
		appendLine(os.Getenv("B1_09A_PIDS"), strconv.Itoa(os.Getpid()))
		sleepForever()
	case "setsid":
		if _, err := syscall.Setsid(); err != nil {
			os.Exit(5)
		}
		appendLine(os.Getenv("B1_09A_PIDS"), strconv.Itoa(os.Getpid()))
		sleepForever()
	case "sleep":
		appendLine(os.Getenv("B1_09A_PIDS"), strconv.Itoa(os.Getpid()))
		sleepForever()
	case "chatty": // one line every 100ms, N times, then exit 0
		n, _ := strconv.Atoi(os.Getenv("B1_09A_N"))
		for i := 0; i < n; i++ {
			fmt.Println("x")
			time.Sleep(100 * time.Millisecond)
		}
	case "daemon":
		daemon()
	default:
		os.Exit(6)
	}
}

// daemon is a runner process the test SIGKILLs mid-job.
func daemon() {
	self := os.Getenv("B1_09A_SELF")
	e, err := runner.NewExec(workerConfig())
	if err != nil {
		fmt.Fprintln(os.Stderr, "daemon: NewExec:", err)
		os.Exit(1)
	}
	fl := &fakeLauncher{exec: e}
	r, err := runner.New(runner.Config{State: os.Getenv("B1_09A_STATE"), Capacity: 2, Launcher: fl})
	if err == nil {
		err = r.Reconcile(context.Background())
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "daemon: New/Reconcile:", err)
		os.Exit(1)
	}
	job := runner.Job{
		Req:    request("job-d", self, []string{helperPrefix + "tree"}, map[string]string{"B1_09A_SELF": self, "B1_09A_PIDS": os.Getenv("B1_09A_PIDS")}),
		Limits: runner.Limits{Wall: 5 * time.Minute, Idle: 5 * time.Minute, Stdout: io.Discard},
	}
	err = r.Run(context.Background(), job)
	fmt.Fprintln(os.Stderr, "daemon: Run returned:", err)
	os.Exit(1)
}

// ---- fixtures ---------------------------------------------------------------------------------

// workerConfig: the worker is this uid with its groups (the single-user machine before B1-10), and
// its one root is a path nothing here lives in.
func workerConfig() runner.ExecConfig {
	gids, _ := os.Getgroups()
	return runner.ExecConfig{WorkerUID: os.Getuid(), WorkerGIDs: gids, WorkerRoots: []string{"/nonexistent-b109a-root"}}
}

func mustExec(t *testing.T, c runner.ExecConfig) launcher.Exec {
	t.Helper()
	e, err := runner.NewExec(c)
	if err != nil {
		t.Fatalf("NewExec(%+v): %v", c, err)
	}
	return e
}

func lease(job string) string { return "job://" + job + "#7" }

func request(job, bin string, argv []string, env map[string]string) launcher.Request {
	return launcher.Request{JobID: job, Binary: bin, Argv: argv, Env: env,
		Requires: launcher.Prerequisites{FencedLease: lease(job)}}
}

func fileDigest(path string) string {
	b, err := os.ReadFile(path)
	if err != nil {
		return "sha256:unreadable"
	}
	s := sha256.Sum256(b)
	return "sha256:" + hex.EncodeToString(s[:])
}

func envList(m map[string]string) []string {
	out := []string{}
	for k, v := range m {
		out = append(out, k+"="+v)
	}
	slices.Sort(out)
	return out
}

// fakeLauncher stands in for the B1-08 launcher: it measures the digest, then calls the real Exec
// once, as Launch does, and records End.
type fakeLauncher struct {
	exec     launcher.Exec
	mu       sync.Mutex
	launches int
	ends     []string
}

func (f *fakeLauncher) Launch(ctx context.Context, req launcher.Request) (launcher.Receipt, error) {
	f.mu.Lock()
	f.launches++
	f.mu.Unlock()
	d := fileDigest(req.Binary)
	rc := launcher.Receipt{JobID: req.JobID, Binary: req.Binary, Digest: d, Argv: slices.Clone(req.Argv), At: time.Now()}
	return rc, f.exec.Run(ctx, req.Binary, d, slices.Clone(req.Argv), envList(req.Env))
}

func (f *fakeLauncher) End(_ context.Context, job, l string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.ends = append(f.ends, job+" "+l)
	return nil
}

func (f *fakeLauncher) count() int { f.mu.Lock(); defer f.mu.Unlock(); return f.launches }

func self(t *testing.T) string {
	t.Helper()
	p, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	p, err = filepath.EvalSymlinks(p)
	if err != nil {
		t.Fatal(err)
	}
	return p
}

func readPids(path string) []int {
	b, _ := os.ReadFile(path)
	var out []int
	for _, f := range strings.Fields(string(b)) {
		if n, err := strconv.Atoi(f); err == nil && n > 1 {
			out = append(out, n)
		}
	}
	return out
}

func alive(pid int) bool { return syscall.Kill(pid, 0) == nil }

// waitPids waits for n pids in path; the test fails if they never appear.
func waitPids(t *testing.T, path string, n int, within time.Duration) []int {
	t.Helper()
	deadline := time.Now().Add(within)
	for time.Now().Before(deadline) {
		if p := readPids(path); len(p) >= n {
			return p
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("only %v of %d worker pids appeared in %v", readPids(path), n, within)
	return nil
}

// assertDead: no recorded pid is alive within 2s (zombies are reaped by launchd, not at once).
func assertDead(t *testing.T, path string, what string) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for {
		var live []int
		for _, p := range readPids(path) {
			if alive(p) {
				live = append(live, p)
			}
		}
		if len(live) == 0 {
			return
		}
		if time.Now().After(deadline) {
			t.Fatalf("%s: orphan worker pids still alive: %v", what, live)
		}
		time.Sleep(20 * time.Millisecond)
	}
}

// reap kills every recorded pid at test end, so a failing implementation leaves nothing behind.
func reap(t *testing.T, path string) {
	t.Cleanup(func() {
		for _, p := range readPids(path) {
			syscall.Kill(p, syscall.SIGKILL)
		}
	})
}

func treeEnv(t *testing.T, dir string) (env []string, pids, ints string) {
	pids, ints = filepath.Join(dir, "pids"), filepath.Join(dir, "int")
	reap(t, pids)
	return []string{"B1_09A_SELF=" + self(t), "B1_09A_PIDS=" + pids, "B1_09A_INT=" + ints}, pids, ints
}

func runExec(t *testing.T, ctx context.Context, path, digest string, argv, env []string, l runner.Limits) (error, time.Duration) {
	t.Helper()
	e := mustExec(t, workerConfig())
	t0 := time.Now()
	err := e.Run(runner.WithLimits(ctx, l), path, digest, argv, env)
	return err, time.Since(t0)
}

func exists(p string) bool { _, err := os.Stat(p); return err == nil }

// ---- the done-tests ---------------------------------------------------------------------------

func TestB1_09a_ExecRunsOnlyMatchingDigest(t *testing.T) {
	dir := t.TempDir()
	good, bad := filepath.Join(dir, "good"), filepath.Join(dir, "bad")
	script := func(marker string) []byte { return []byte("#!/bin/sh\n/usr/bin/touch " + marker + "\n") }
	bin := filepath.Join(dir, "bin")
	write := func(b []byte) {
		tmp := bin + ".tmp"
		if err := os.WriteFile(tmp, b, 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.Rename(tmp, bin); err != nil {
			t.Fatal(err)
		}
	}
	lim := runner.Limits{Wall: 20 * time.Second, Idle: 20 * time.Second, Stdout: io.Discard}
	ctx := context.Background()
	exe := mustExec(t, workerConfig())
	write(script(good))
	goodD := fileDigest(bin)
	write(script(bad))
	badD := fileDigest(bin)
	write(script(good))

	if err, _ := runExec(t, ctx, bin, goodD, nil, []string{}, lim); err != nil || !exists(good) {
		t.Fatalf("matching digest: err %v, ran %v; want nil and the worker ran", err, exists(good))
	}
	os.Remove(good)

	refuse := func(name, digest string, ctx context.Context, env []string, want error) {
		t.Helper()
		err := exe.Run(ctx, bin, digest, nil, env)
		if !errors.Is(err, want) {
			t.Errorf("%s: err %v, want %v", name, err, want)
		}
		if exists(good) || exists(bad) {
			t.Errorf("%s: a worker ran (good %v, bad %v)", name, exists(good), exists(bad))
		}
		os.Remove(good)
		os.Remove(bad)
	}
	wl := runner.WithLimits(ctx, lim)
	refuse("digest of other bytes", badD, wl, []string{}, runner.ErrDigest)
	refuse("bare hex", strings.TrimPrefix(goodD, "sha256:"), wl, []string{}, runner.ErrDigest)
	refuse("upper-case hex", "sha256:"+strings.ToUpper(strings.TrimPrefix(goodD, "sha256:")), wl, []string{}, runner.ErrDigest)
	refuse("trailing newline", goodD+"\n", wl, []string{}, runner.ErrDigest)
	refuse("empty digest", "", wl, []string{}, runner.ErrDigest)
	refuse("no limits on ctx", goodD, ctx, []string{}, runner.ErrSpec)
	refuse("nil env", goodD, wl, nil, runner.ErrSpec)
	refuse("zero wall", goodD, runner.WithLimits(ctx, runner.Limits{Idle: time.Second, Stdout: io.Discard}), []string{}, runner.ErrSpec)
	refuse("zero idle", goodD, runner.WithLimits(ctx, runner.Limits{Wall: time.Second, Stdout: io.Discard}), []string{}, runner.ErrSpec)

	// Changed after the launcher's check: by rename, then in place (same inode).
	write(script(bad))
	refuse("replaced by rename after the check", goodD, wl, []string{}, runner.ErrDigest)
	write(script(good))
	if err := os.WriteFile(bin, script(bad), 0o755); err != nil {
		t.Fatal(err)
	}
	refuse("rewritten in place after the check", goodD, wl, []string{}, runner.ErrDigest)

	// A live swapper: measured, hash-path-then-exec-path ran the other bytes in 71 of 300 runs.
	write(script(good))
	stop := make(chan struct{})
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; ; i++ {
			select {
			case <-stop:
				return
			default:
			}
			b := script(good)
			if i%2 == 1 {
				b = script(bad)
			}
			tmp := filepath.Join(dir, "swap.tmp")
			if os.WriteFile(tmp, b, 0o755) == nil {
				os.Rename(tmp, bin)
			}
		}
	}()
	ran, refused := 0, 0
	for i := 0; i < 100; i++ {
		err := exe.Run(wl, bin, goodD, nil, []string{})
		switch {
		case err == nil:
			ran++
		case errors.Is(err, runner.ErrDigest):
			refused++
		default:
			t.Errorf("swap run %d: err %v, want nil or ErrDigest", i, err)
		}
	}
	close(stop)
	wg.Wait()
	if exists(bad) {
		t.Fatalf("under a live swapper the worker executed bytes that do not hash to the digest (%d ran, %d refused)", ran, refused)
	}
	if ran == 0 {
		t.Fatalf("under a live swapper nothing ran in 100 tries (%d refused): the check refuses good bytes", refused)
	}
}

func TestB1_09a_ExecEnvExact(t *testing.T) {
	t.Setenv("B1_09A_LEAK", "from-the-kernel")
	bin := self(t)
	d := fileDigest(bin)
	cases := []struct {
		name string
		env  []string
		argv []string
	}{
		{"three vars", []string{"A=1", "B1_09A_X=two words", "PATH=/nonexistent"}, []string{helperPrefix + "env", "a b", "--flag=1"}},
		{"empty env", []string{}, []string{helperPrefix + "env"}},
	}
	for _, c := range cases {
		var out bytes.Buffer
		err, _ := runExec(t, context.Background(), bin, d, c.argv, c.env,
			runner.Limits{Wall: 20 * time.Second, Idle: 20 * time.Second, Stdout: &out})
		if err != nil {
			t.Fatalf("%s: err %v", c.name, err)
		}
		envPart, argvPart, ok := strings.Cut(out.String(), "\n--argv--\n")
		if !ok {
			t.Fatalf("%s: helper output malformed: %q", c.name, out.String())
		}
		var got []string
		if envPart != "" {
			got = strings.Split(envPart, "\n")
		}
		slices.Sort(got)
		want := slices.Sorted(slices.Values(c.env))
		if !slices.Equal(got, want) {
			t.Errorf("%s: child env %q, want exactly %q", c.name, got, want)
		}
		var gotArgv []string
		if argvPart != "" {
			gotArgv = strings.Split(argvPart, "\n")
		}
		if !slices.Equal(gotArgv, c.argv[1:]) {
			t.Errorf("%s: child argv %q, want exactly %q", c.name, gotArgv, c.argv[1:])
		}
	}
}

func TestB1_09a_CapacityCap(t *testing.T) {
	for _, bad := range []runner.Config{
		{State: t.TempDir(), Capacity: -1, Launcher: &fakeLauncher{}},
		{State: t.TempDir(), Capacity: 13, Launcher: &fakeLauncher{}}, // above the launcher's cap of 12
		{State: "", Capacity: 2, Launcher: &fakeLauncher{}},
		{State: t.TempDir(), Capacity: 2},
	} {
		if _, err := runner.New(bad); !errors.Is(err, runner.ErrSpec) {
			t.Errorf("New(%+v): err %v, want ErrSpec", bad, err)
		}
	}
	if _, err := runner.New(runner.Config{State: t.TempDir(), Capacity: 12, Launcher: &fakeLauncher{}}); err != nil {
		t.Errorf("New with Capacity 12 (the launcher cap): %v", err)
	}
	capacityRound(t, 2, 2)
	capacityRound(t, 0, 4) // Q5: 0 means the default, 4
}

// capacityRound: with Config.Capacity cfgCap, exactly capN of six concurrent Runs are admitted.
func capacityRound(t *testing.T, cfgCap, capN int) {
	t.Helper()
	bin := self(t)
	dir := t.TempDir()
	pids := filepath.Join(dir, "pids")
	reap(t, pids)
	fl := &fakeLauncher{exec: mustExec(t, workerConfig())}
	r, err := runner.New(runner.Config{State: t.TempDir(), Capacity: cfgCap, Launcher: fl})
	if err != nil {
		t.Fatal(err)
	}
	job := func(i int) runner.Job {
		id := "job-c" + strconv.Itoa(i)
		return runner.Job{Req: request(id, bin, []string{helperPrefix + "sleep"}, map[string]string{"B1_09A_PIDS": pids}),
			Limits: runner.Limits{Wall: 30 * time.Second, Idle: 30 * time.Second, Stdout: io.Discard}}
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	// Q4: Run before Reconcile is refused, even on an empty State, and never reaches Launch.
	if err := r.Run(ctx, job(50)); !errors.Is(err, runner.ErrState) || fl.count() != 0 {
		t.Fatalf("Run before Reconcile: err %v, Launch calls %d; want ErrState and none", err, fl.count())
	}
	if err := r.Reconcile(ctx); err != nil {
		t.Fatalf("Reconcile on an empty State: %v", err)
	}
	// Six at once against the cap: exactly capN are admitted, whatever the interleaving.
	const n = 6
	errs := make(chan error, n)
	for i := 0; i < n; i++ {
		go func() { errs <- r.Run(ctx, job(i)) }()
	}
	refused := 0
	deadline := time.After(10 * time.Second)
	for refused < n-capN {
		select {
		case err := <-errs:
			if !errors.Is(err, runner.ErrCapacity) {
				t.Fatalf("an admission past the cap returned %v, want ErrCapacity", err)
			}
			refused++
		case <-deadline:
			t.Fatalf("%d of %d over-cap admissions refused in 10s", refused, n-capN)
		}
	}
	waitPids(t, pids, capN, 10*time.Second)
	if got := fl.count(); got != capN {
		t.Fatalf("Launch called %d times with capacity %d", got, capN)
	}
	// The N+1th, now, while N run: refused, and Launch is not called.
	if err := r.Run(ctx, job(99)); !errors.Is(err, runner.ErrCapacity) {
		t.Fatalf("N+1th admission: err %v, want ErrCapacity", err)
	}
	if got := fl.count(); got != capN {
		t.Fatalf("a refused admission reached Launch (%d calls)", got)
	}
	// Ending the running jobs frees their slots.
	cancel()
	for i := 0; i < capN; i++ {
		select {
		case <-errs:
		case <-time.After(10 * time.Second):
			t.Fatal("a cancelled job did not return in 10s")
		}
	}
	assertDead(t, pids, "after cancel")
	ctx2, cancel2 := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- r.Run(ctx2, job(100)) }()
	deadline2 := time.Now().Add(10 * time.Second)
	for fl.count() != capN+1 && time.Now().Before(deadline2) {
		time.Sleep(20 * time.Millisecond)
	}
	cancel2()
	if err := <-done; errors.Is(err, runner.ErrCapacity) || fl.count() != capN+1 {
		t.Fatalf("after the running jobs ended a new admission was refused: %v (Launch calls %d)", err, fl.count())
	}
}

func TestB1_09a_WallBackstopKillsTree(t *testing.T) {
	env, pids, ints := treeEnv(t, t.TempDir())
	bin := self(t)
	const wall = 2 * time.Second
	t0 := time.Now()
	err, took := runExec(t, context.Background(), bin, fileDigest(bin), []string{helperPrefix + "tree"}, env,
		runner.Limits{Wall: wall, Idle: 30 * time.Second, Stdout: io.Discard})
	if !errors.Is(err, runner.ErrWall) {
		t.Fatalf("err %v, want ErrWall", err)
	}
	if took < wall-50*time.Millisecond || took > wall+4*time.Second {
		t.Fatalf("Run returned after %v; the wall is %v", took, wall)
	}
	if n := len(readPids(pids)); n != 3 {
		t.Fatalf("%d of 3 tree pids recorded", n)
	}
	assertDead(t, pids, "wall backstop")
	got := readPids(ints)
	if len(got) == 0 {
		t.Fatal("the leader never received SIGINT before the kill")
	}
	at := time.Duration(int64(got[0]) - t0.UnixNano())
	if at < wall*80/100 || at >= wall {
		t.Fatalf("SIGINT reached the leader at %v; want 90%% of %v", at, wall)
	}
}

func TestB1_09a_IdleBackstopKillsTree(t *testing.T) {
	env, pids, _ := treeEnv(t, t.TempDir())
	bin := self(t)
	const idle = 700 * time.Millisecond
	err, took := runExec(t, context.Background(), bin, fileDigest(bin), []string{helperPrefix + "tree"}, env,
		runner.Limits{Wall: 30 * time.Second, Idle: idle, Stdout: io.Discard})
	if !errors.Is(err, runner.ErrIdle) {
		t.Fatalf("silent tree: err %v, want ErrIdle", err)
	}
	if took < idle-50*time.Millisecond || took > idle+4*time.Second {
		t.Fatalf("silent tree: Run returned after %v; idle is %v", took, idle)
	}
	assertDead(t, pids, "idle backstop")

	// Control: a worker that writes every 100ms for 1.5s outlives an idle of 700ms.
	var out bytes.Buffer
	err, took = runExec(t, context.Background(), bin, fileDigest(bin), []string{helperPrefix + "chatty"},
		[]string{"B1_09A_N=15"}, runner.Limits{Wall: 30 * time.Second, Idle: idle, Stdout: &out})
	if err != nil || took < 1400*time.Millisecond {
		t.Fatalf("chatty worker: err %v after %v; output must reset the idle timer", err, took)
	}
	if out.String() != strings.Repeat("x\n", 15) {
		t.Fatalf("chatty worker: stdout %q, want 15 lines delivered to Limits.Stdout", out.String())
	}
}

func TestB1_09a_CtxCancelKillsTree(t *testing.T) {
	env, pids, _ := treeEnv(t, t.TempDir())
	bin := self(t)
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		for end := time.Now().Add(10 * time.Second); len(readPids(pids)) < 3 && time.Now().Before(end); {
			time.Sleep(20 * time.Millisecond)
		}
		cancel()
	}()
	err, took := runExec(t, ctx, bin, fileDigest(bin), []string{helperPrefix + "tree"}, env,
		runner.Limits{Wall: 30 * time.Second, Idle: 30 * time.Second, Stdout: io.Discard})
	if !errors.Is(err, context.Canceled) || errors.Is(err, runner.ErrWall) || errors.Is(err, runner.ErrIdle) {
		t.Fatalf("err %v, want context.Canceled and no backstop", err)
	}
	if took > 12*time.Second {
		t.Fatalf("Run returned %v after start", took)
	}
	assertDead(t, pids, "ctx cancel")
}

func TestB1_09a_DaemonKilledMidJob(t *testing.T) {
	bin := self(t)
	state := t.TempDir()
	pids := filepath.Join(t.TempDir(), "pids")
	reap(t, pids)
	var stderr bytes.Buffer
	d := exec.Command(bin, helperPrefix+"daemon")
	d.Env = []string{"B1_09A_SELF=" + bin, "B1_09A_STATE=" + state, "B1_09A_PIDS=" + pids}
	d.Stderr = &stderr
	d.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	if err := d.Start(); err != nil {
		t.Fatal(err)
	}
	exited := make(chan struct{})
	go func() { d.Wait(); close(exited) }()
	t.Cleanup(func() { syscall.Kill(-d.Process.Pid, syscall.SIGKILL); <-exited })

	deadline := time.Now().Add(10 * time.Second)
	for len(readPids(pids)) < 3 {
		select {
		case <-exited:
			t.Fatalf("the daemon exited before its job started: %s", stderr.String())
		default:
		}
		if time.Now().After(deadline) {
			t.Fatalf("the job's tree never started (%v): %s", readPids(pids), stderr.String())
		}
		time.Sleep(20 * time.Millisecond)
	}
	// Kill the daemon alone (its own process group; the worker is in another).
	syscall.Kill(-d.Process.Pid, syscall.SIGKILL)
	<-exited
	survivors := 0
	for _, p := range readPids(pids) {
		if alive(p) {
			survivors++
		}
	}
	t.Logf("after the daemon's SIGKILL, %d of 3 worker pids survive (measured: all 3)", survivors)

	fl := &fakeLauncher{exec: mustExec(t, workerConfig())}
	r, err := runner.New(runner.Config{State: state, Capacity: 2, Launcher: fl})
	if err != nil {
		t.Fatalf("restart: %v", err)
	}
	if st, err := r.Status("job-d"); err != nil || st != runner.StatusRunning {
		t.Fatalf("before Reconcile, State records job-d as %q (%v); want running, recorded before the daemon died", st, err)
	}
	// Q4: Run before Reconcile is refused and never reaches Launch.
	other := runner.Job{Req: request("job-e", bin, []string{helperPrefix + "sleep"}, map[string]string{}),
		Limits: runner.Limits{Wall: 30 * time.Second, Idle: 30 * time.Second, Stdout: io.Discard}}
	if err := r.Run(context.Background(), other); !errors.Is(err, runner.ErrState) || fl.count() != 0 {
		t.Fatalf("Run before Reconcile: err %v, Launch calls %d; want ErrState and none", err, fl.count())
	}
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	assertDead(t, pids, "after Reconcile")
	if st, err := r.Status("job-d"); err != nil || st != runner.StatusInterrupted {
		t.Fatalf("after Reconcile job-d is %q (%v), want interrupted", st, err)
	}
	if want := []string{"job-d " + lease("job-d")}; !slices.Equal(fl.ends, want) {
		t.Fatalf("Launcher.End calls %q, want %q", fl.ends, want)
	}
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatalf("second Reconcile: %v", err)
	}
	if len(fl.ends) != 1 {
		t.Fatalf("a second Reconcile ended the launch again: %q", fl.ends)
	}
	if fl.count() != 0 {
		t.Fatalf("Reconcile relaunched the job (%d launches); it must only kill and record", fl.count())
	}
	// Q3: interrupted is terminal. Another restart neither requeues nor ends it again.
	fl3 := &fakeLauncher{exec: mustExec(t, workerConfig())}
	r3, err := runner.New(runner.Config{State: state, Capacity: 2, Launcher: fl3})
	if err != nil {
		t.Fatalf("second restart: %v", err)
	}
	if err := r3.Reconcile(context.Background()); err != nil {
		t.Fatalf("Reconcile after the second restart: %v", err)
	}
	if st, err := r3.Status("job-d"); err != nil || st != runner.StatusInterrupted || fl3.count() != 0 || len(fl3.ends) != 0 {
		t.Fatalf("after another restart job-d is %q (%v), launches %d, ends %q; want interrupted, untouched", st, err, fl3.count(), fl3.ends)
	}
}

func TestB1_09a_ExecInPlaceOrCopy(t *testing.T) {
	wc := workerConfig()
	for _, bad := range []runner.ExecConfig{
		{WorkerUID: 0, WorkerGIDs: wc.WorkerGIDs, WorkerRoots: wc.WorkerRoots}, // root, or unset
		{WorkerUID: -1, WorkerRoots: wc.WorkerRoots},
		{WorkerUID: wc.WorkerUID, WorkerGIDs: wc.WorkerGIDs},              // no worker root
		{WorkerUID: wc.WorkerUID, WorkerRoots: []string{"relative/root"}}, // not absolute
		{WorkerUID: wc.WorkerUID, WorkerRoots: []string{"/a/../b"}},       // not clean
		{WorkerUID: wc.WorkerUID, WorkerRoots: []string{"/"}},             // every path
	} {
		if _, err := runner.NewExec(bad); !errors.Is(err, runner.ErrSpec) {
			t.Errorf("NewExec(%+v): err %v, want ErrSpec", bad, err)
		}
	}
	lim := func(out io.Writer) runner.Limits {
		return runner.Limits{Wall: 20 * time.Second, Idle: 20 * time.Second, Stdout: out}
	}
	// bash reports the path it was executed as in $BASH (measured: /bin/bash in place, the link
	// path through a symlink; a copy of /bin/bash is SIGKILLed by code signing, exit 137).
	invoked := func(name string, e launcher.Exec, path string, argv []string) (string, error) {
		t.Helper()
		var out bytes.Buffer
		err := e.Run(runner.WithLimits(context.Background(), lim(&out)), path, fileDigest(path), argv, []string{})
		return strings.TrimSpace(out.String()), err
	}
	bashArgv := []string{"-c", `printf %s "$BASH"`}

	// 1. Protected: /bin/bash, and /, /bin root-owned 0755, outside every worker root: in place.
	if got, err := invoked("protected", mustExec(t, wc), "/bin/bash", bashArgv); err != nil || got != "/bin/bash" {
		t.Errorf("protected /bin/bash: ran as %q (err %v), want in place as /bin/bash", got, err)
	}
	// 2. A symlink in a worker-writable dir to the protected binary: resolved, then in place, at the
	// resolved path (the link itself can be swapped).
	link := filepath.Join(t.TempDir(), "bash-link")
	if err := os.Symlink("/bin/bash", link); err != nil {
		t.Fatal(err)
	}
	if got, err := invoked("symlink", mustExec(t, wc), link, bashArgv); err != nil || got != "/bin/bash" {
		t.Errorf("symlink to /bin/bash: ran as %q (err %v), want the resolved /bin/bash in place", got, err)
	}
	// 3. The same protected binary inside a worker root is copied: never in place.
	inRoot := wc
	inRoot.WorkerRoots = []string{"/nonexistent-b109a-root", "/bin"}
	if got, err := invoked("in a worker root", mustExec(t, inRoot), "/bin/bash", bashArgv); err == nil && got == "/bin/bash" {
		t.Errorf("/bin/bash inside a worker root ran in place; want a copy")
	}

	script := []byte("#!/bin/sh\nprintf %s \"$0\"\n")
	// 4. A binary in a worker-writable dir is copied: $0 is not its path.
	wdir := t.TempDir()
	wbin := filepath.Join(wdir, "w")
	if err := os.WriteFile(wbin, script, 0o555); err != nil {
		t.Fatal(err)
	}
	if got, err := invoked("writable dir", mustExec(t, wc), wbin, nil); err != nil || got == wbin || got == "" {
		t.Errorf("binary in a worker-writable dir ran as %q (err %v), want a private copy", got, err)
	}
	// 5. A read-only file in a read-only dir whose ANCESTOR is worker-writable is copied.
	ro := filepath.Join(t.TempDir(), "ro")
	rbin := filepath.Join(ro, "w")
	if err := os.Mkdir(ro, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(rbin, script, 0o555); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(ro, 0o555); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.Chmod(ro, 0o755) })
	if got, err := invoked("writable ancestor", mustExec(t, wc), rbin, nil); err != nil || got == rbin || got == "" {
		t.Errorf("binary under a worker-writable ancestor ran as %q (err %v), want a private copy", got, err)
	}
	// 6. Writability is the WORKER's, by mode and owner. A fixture under this package dir (owned by
	// the test's uid; no ancestor writable by others) is in place for a worker with another uid and
	// no groups, and copied for a worker with the test's uid.
	pkg, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for p := pkg; p != "/"; p = filepath.Dir(p) {
		if fi, err := os.Stat(p); err != nil || fi.Mode().Perm()&0o002 != 0 {
			t.Skipf("precondition: ancestor %s is writable by others (%v); case 6 needs a private tree", p, err)
		}
	}
	fdir, err := os.MkdirTemp(pkg, ".b109a-fixture-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(fdir) })
	fbin := filepath.Join(fdir, "w")
	if err := os.WriteFile(fbin, script, 0o755); err != nil {
		t.Fatal(err)
	}
	other := runner.ExecConfig{WorkerUID: 4242, WorkerRoots: wc.WorkerRoots}
	if got, err := invoked("other uid", mustExec(t, other), fbin, nil); err != nil || got != fbin {
		t.Errorf("a binary the worker (uid 4242) cannot write ran as %q (err %v), want in place as %q", got, err, fbin)
	}
	if got, err := invoked("same uid", mustExec(t, wc), fbin, nil); err != nil || got == fbin || got == "" {
		t.Errorf("a binary the worker owns ran as %q (err %v), want a private copy", got, err)
	}
}
