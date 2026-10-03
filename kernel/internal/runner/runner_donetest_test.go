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
// RE-FREEZE r3 2026-10-04: red-team r1 found seven wrong implementations that passed r2. r3 closes
// each with a test that fails it, and adds the pid-reuse seam (runner.Identity, ProcIdentity,
// Config.Identify). Orchestrator ruling (ceo-1, 2026-10-04): "not worker-writable" includes ACLs and
// fails closed.
// Canon: 09a §8.2 ("own process group"; "wall-clock (SIGINT 90%, SIGKILL pgid 100%) and 5-minute
// idle backstops"), §15 ("orphan processes 2 min after kill: 0"). Measured first, on this machine,
// with no model turn and no network: docs/vision-v3/_process/DR-B1-09a-MEASURE-2026-10-03.md.
//
// Every worker here is this test binary re-executed in a helper mode named by argv[1] (never
// claude or codex), or a /bin/sh script. Each test pins one item:
//
//	ExecInPlaceOrCopy           r2: protected binary in place; worker-writable file or ancestor,
//	                            or a worker root, is copied; NewExec refuses a bad ExecConfig.
//	                            r3: a copy is judged against the resolved path too; every ancestor
//	                            of the RESOLVED path is checked, four levels up and through a
//	                            symlinked directory; group bits count; a protected binary in a
//	                            worker root is copied and SIGKILLed by code signing (the specific
//	                            error); the uid-4242 fixtures live under $HOME/.agentvibe, never
//	                            /tmp, and their every ancestor is checked first (Fatal, not Skip)
//	ExecRunsOnlyMatchingDigest  the real Exec runs only bytes that hash to the digest, and refuses
//	                            a file changed after the check (rename, in-place, and a live swapper:
//	                            r3, the copy execs the bytes it hashed); r3: the in-place path checks
//	                            the digest too
//	ExecEnvExact                the child gets exactly the env passed, and exactly the argv
//	CapacityCap                 with Capacity N, the N+1th admission is refused before Launch;
//	                            r2: 0 means 4, above 12 is refused, Run before Reconcile is refused
//	WallBackstopKillsTree       SIGINT the GROUP at 90% (r3: in [85%, 95%); 60ms after it the group
//	                            member that does not trap it is dead, the leader that does is alive);
//	                            SIGKILL the whole tree at 100% (r3: Run returns within wall + 1s)
//	IdleBackstopKillsTree       no stdout byte for Idle kills the whole tree; output resets it
//	CtxCancelKillsTree          ctx cancellation kills the whole tree (r3: within 1s of the cancel)
//	LeaderExitKillsTree         r3: a leader that exits 0 or 3 leaves a group member and a setsid
//	                            grandchild; Run kills both before it returns, and reports exit 3 as
//	                            an *exec.ExitError
//	RunnerAppliesLimits         r3: the Runner launches under job.Limits (Stdout, Dir, Wall, Idle)
//	                            and records exited or killed, which a restart leaves alone
//	DaemonKilledMidJob          the acceptance: SIGKILL the daemon, restart, Reconcile: no orphan,
//	                            the job is interrupted, its launch is ended once; r2: Run before
//	                            Reconcile is refused; a later restart leaves it interrupted, unlaunched
//	ReconcileAfterLeaderDied    r3: the daemon dies, then the leader; Reconcile still kills the
//	                            group member and the setsid grandchild
//	ProcIdentity                r3: pid + kernel start time; a dead pid is ESRCH
//	ReconcileGuardsPidReuse     r3: when Config.Identify reports another start time for every
//	                            recorded pid, Reconcile signals nothing, and still ends the launch
//
// "The whole tree" is the leader, its child and a grandchild that called setsid(2): measured, a
// kill(-pgid) misses the setsid grandchild, so every test checks it by pid.
//
// Strays: every recorded worker pid is SIGKILLed, with its process group, by t.Cleanup; and by a
// reaper process (this binary, own process group) that does it when the suite dies without running
// t.Cleanup — a -timeout panic, SIGINT, SIGKILL. The reaper wakes on EOF of a pipe only the suite
// holds open.
//
// Run: go -C kernel test -count=1 -tags donetest ./internal/runner/
// Process tests: run with the sandbox off if a spawn is refused; /bin/ps is refused under it, so
// nothing here uses it (process facts come from sysctl kern.proc.pid).
package runner_test

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"io/fs"
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

	"golang.org/x/sys/unix"

	"github.com/Adam077K/agentvibe/kernel/internal/launcher"
	"github.com/Adam077K/agentvibe/kernel/internal/runner"
)

const helperPrefix = "b109a-helper:"

var suiteStart time.Time

// TestMain dispatches helper modes. A copy spawned without its helper argv exits 3 rather than
// running the suite again: go test always passes -test.* flags, a worker never does.
func TestMain(m *testing.M) {
	if len(os.Args) > 1 && strings.HasPrefix(os.Args[1], helperPrefix) {
		helper(strings.TrimPrefix(os.Args[1], helperPrefix))
		os.Exit(0)
	}
	for _, a := range os.Args[1:] {
		if strings.HasPrefix(a, "-test.") {
			suiteStart = time.Now()
			stop := startReaper()
			code := m.Run()
			stop()
			os.Exit(code)
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
	case "tree": // leader: logs when it began running, traps SIGINT, spawns mid, which spawns a setsid grandchild
		appendLine(os.Getenv("B1_09A_T"), strconv.FormatInt(time.Now().UnixNano(), 10))
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
	case "pwd":
		wd, err := os.Getwd()
		if err != nil {
			os.Exit(8)
		}
		fmt.Print(wd)
	case "daemon":
		daemon()
	case "reaper":
		reaper(os.Args[2], os.Args[3])
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

// ---- strays -----------------------------------------------------------------------------------

var reaperRegistry string

// startReaper starts the reaper and returns the suite's normal-end hook. The registry lists, one per
// line, "pids <file>" (every pid in the file, and its process group, is SIGKILLed) and "dir <path>"
// (removed). On a normal end the suite writes "done" first: t.Cleanup has already reaped, and a pid
// recorded long ago is not signalled again.
func startReaper() (stop func()) {
	dir, err := os.MkdirTemp("", "b109a-reaper-")
	if err != nil {
		fmt.Fprintln(os.Stderr, "reaper:", err)
		os.Exit(7)
	}
	reaperRegistry = filepath.Join(dir, "registry")
	exe, err := os.Executable()
	if err == nil {
		err = os.WriteFile(reaperRegistry, nil, 0o600)
	}
	pr, pw, perr := os.Pipe()
	if err == nil {
		err = perr
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "reaper:", err)
		os.Exit(7)
	}
	c := exec.Command(exe, helperPrefix+"reaper", reaperRegistry, strconv.FormatInt(suiteStart.Add(-time.Second).UnixMicro(), 10))
	c.Stdin = pr
	c.SysProcAttr = &syscall.SysProcAttr{Setpgid: true} // a terminal's ^C to the suite's group does not reach it
	if err := c.Start(); err != nil {
		fmt.Fprintln(os.Stderr, "reaper:", err)
		os.Exit(7)
	}
	pr.Close()
	return func() {
		appendLine(reaperRegistry, "done")
		pw.Close()
		c.Wait()
		os.RemoveAll(dir)
	}
}

// reaper blocks until the suite's pipe closes, then reaps what the registry names, unless the suite
// ended normally. It signals only processes that started after the suite did.
func reaper(registry, sinceMicros string) {
	signal.Ignore(syscall.SIGINT, syscall.SIGHUP, syscall.SIGTERM, syscall.SIGPIPE)
	io.Copy(io.Discard, os.Stdin)
	since, _ := strconv.ParseInt(sinceMicros, 10, 64)
	b, _ := os.ReadFile(registry)
	lines := strings.Split(strings.TrimSpace(string(b)), "\n")
	if slices.Contains(lines, "done") {
		return
	}
	for _, l := range lines {
		kind, path, _ := strings.Cut(l, " ")
		switch kind {
		case "pids":
			for _, p := range readPids(path) {
				if k, ok := kinfo(p); ok && k.start >= since {
					syscall.Kill(-p, syscall.SIGKILL)
					syscall.Kill(p, syscall.SIGKILL)
				}
			}
		case "dir":
			forceRemove(path)
		}
	}
	os.RemoveAll(filepath.Dir(registry))
}

// reap kills every pid recorded in path, and its process group, when the test ends however it ends:
// t.Cleanup on a normal end or a t.Fatal, the reaper when the suite itself dies.
func reap(t *testing.T, path string) {
	appendLine(reaperRegistry, "pids "+path)
	t.Cleanup(func() {
		for _, p := range readPids(path) {
			syscall.Kill(-p, syscall.SIGKILL)
			syscall.Kill(p, syscall.SIGKILL)
		}
	})
}

// forceRemove removes a fixture tree whose directories may be read-only.
func forceRemove(root string) {
	filepath.WalkDir(root, func(p string, d fs.DirEntry, err error) error {
		if err == nil && d.IsDir() {
			os.Chmod(p, 0o700)
		}
		return nil
	})
	os.RemoveAll(root)
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

func (f *fakeLauncher) endCalls() []string {
	f.mu.Lock()
	defer f.mu.Unlock()
	return slices.Clone(f.ends)
}

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

// proc is the kernel's record of a process: sysctl kern.proc.pid, which works under the sandbox
// where /bin/ps does not (DR M2, M2b).
type proc struct {
	ppid, pgid int
	start      int64 // µs since the epoch
	zombie     bool
}

func kinfo(pid int) (proc, bool) {
	k, err := unix.SysctlKinfoProc("kern.proc.pid", pid)
	if err != nil || int(k.Proc.P_pid) != pid {
		return proc{}, false
	}
	st := k.Proc.P_starttime
	return proc{ppid: int(k.Eproc.Ppid), pgid: int(k.Eproc.Pgid), start: int64(st.Sec)*1e6 + int64(st.Usec),
		zombie: k.Proc.P_stat == 5 /* SZOMB */}, true
}

// running: the pid is a live process, not a zombie awaiting its parent's wait.
func running(pid int) bool { k, ok := kinfo(pid); return ok && !k.zombie }

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

// treeEnv: the tree records its pids in pids, the leader's SIGINT times in ints, and the moment the
// leader began running in starts.
func treeEnv(t *testing.T, dir string) (env []string, pids, ints, starts string) {
	pids, ints, starts = filepath.Join(dir, "pids"), filepath.Join(dir, "int"), filepath.Join(dir, "start")
	reap(t, pids)
	return []string{"B1_09A_SELF=" + self(t), "B1_09A_PIDS=" + pids, "B1_09A_INT=" + ints, "B1_09A_T=" + starts}, pids, ints, starts
}

// leaderRan is when the tree's leader began running. Exec may start its clocks when Run is called or
// when the worker starts; either is legitimate, so a deadline is judged from the later of the two,
// and an exec slowed by load (measured: over 700ms once in about twenty runs) is not a failure.
func leaderRan(t *testing.T, starts string) time.Time {
	t.Helper()
	ns := readPids(starts)
	if len(ns) == 0 {
		t.Fatal("the tree's leader never logged its start")
	}
	return time.Unix(0, int64(ns[0]))
}

// treeRoles names the tree's three processes from the kernel: mid is the one in another process's
// group, the leader is that group's leader, and the setsid grandchild is the third.
func treeRoles(t *testing.T, pids string) (leader, mid, gc int) {
	t.Helper()
	all := readPids(pids)
	for _, p := range all {
		if k, ok := kinfo(p); ok && k.pgid != p {
			mid, leader = p, k.pgid
		}
	}
	for _, p := range all {
		if p != mid && p != leader {
			gc = p
		}
	}
	if mid == 0 || !slices.Contains(all, leader) || gc == 0 {
		t.Fatalf("tree %v: cannot name leader %d, mid %d, grandchild %d", all, leader, mid, gc)
	}
	return leader, mid, gc
}

// runExec runs one worker through a fresh Exec. A Run still blocked 10s past the worker's wall fails
// the test rather than holding the suite; t.Cleanup's reap then ends the worker.
func runExec(t *testing.T, ctx context.Context, path, digest string, argv, env []string, l runner.Limits) (error, time.Duration) {
	t.Helper()
	e := mustExec(t, workerConfig())
	done := make(chan error, 1)
	t0 := time.Now()
	go func() { done <- e.Run(runner.WithLimits(ctx, l), path, digest, argv, env) }()
	select {
	case err := <-done:
		return err, time.Since(t0)
	case <-time.After(l.Wall + 10*time.Second):
		t.Fatalf("Run(%s) has not returned 10s past its wall of %v", path, l.Wall)
	}
	return nil, 0
}

func exists(p string) bool { _, err := os.Stat(p); return err == nil }

// daemonMidJob starts the daemon helper on state, waits for its job's three-process tree, SIGKILLs
// the daemon alone (its own process group; the worker is in another), and returns with the tree
// orphaned. The daemon gets this test's TMPDIR: its Exec copies the test binary somewhere private.
func daemonMidJob(t *testing.T, state, pids string) {
	t.Helper()
	bin := self(t)
	reap(t, pids)
	logf := filepath.Join(t.TempDir(), "daemon.log")
	log, err := os.Create(logf)
	if err != nil {
		t.Fatal(err)
	}
	defer log.Close()
	d := exec.Command(bin, helperPrefix+"daemon")
	d.Env = []string{"B1_09A_SELF=" + bin, "B1_09A_STATE=" + state, "B1_09A_PIDS=" + pids, "TMPDIR=" + os.TempDir()}
	d.Stderr = log
	d.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	if err := d.Start(); err != nil {
		t.Fatal(err)
	}
	dpid := filepath.Join(t.TempDir(), "daemon.pid")
	appendLine(dpid, strconv.Itoa(d.Process.Pid))
	reap(t, dpid)
	exited := make(chan struct{})
	go func() { d.Wait(); close(exited) }()
	t.Cleanup(func() { syscall.Kill(-d.Process.Pid, syscall.SIGKILL); <-exited })
	stderr := func() string { b, _ := os.ReadFile(logf); return string(b) }

	deadline := time.Now().Add(10 * time.Second)
	for len(readPids(pids)) < 3 {
		select {
		case <-exited:
			t.Fatalf("the daemon exited before its job started: %s", stderr())
		default:
		}
		if time.Now().After(deadline) {
			t.Fatalf("the job's tree never started (%v): %s", readPids(pids), stderr())
		}
		time.Sleep(20 * time.Millisecond)
	}
	syscall.Kill(-d.Process.Pid, syscall.SIGKILL)
	<-exited
	survivors := 0
	for _, p := range readPids(pids) {
		if alive(p) {
			survivors++
		}
	}
	t.Logf("after the daemon's SIGKILL, %d of 3 worker pids survive (measured: all 3)", survivors)
}

// privateRoot is a fixture root no worker but this uid can write: under $HOME/.agentvibe, never
// /tmp or $TMPDIR (both sit under the world-writable, sticky /private/tmp). Every ancestor is checked
// against w — mode bits, owner, and any ACL "allow" entry (read with /bin/ls -led) — and a failed
// check is fatal: the in-place half of ExecInPlaceOrCopy is meaningless on a tree w can write.
func privateRoot(t *testing.T, w runner.ExecConfig) string {
	t.Helper()
	home, err := os.UserHomeDir()
	if err != nil {
		t.Fatal(err)
	}
	base := filepath.Join(home, ".agentvibe")
	if err := os.MkdirAll(base, 0o755); err != nil {
		t.Fatal(err)
	}
	root, err := os.MkdirTemp(base, "b109a-fixture-")
	if err != nil {
		t.Fatal(err)
	}
	appendLine(reaperRegistry, "dir "+root)
	t.Cleanup(func() { forceRemove(root) })
	if root, err = filepath.EvalSymlinks(root); err != nil {
		t.Fatal(err)
	}
	for p := root; ; p = filepath.Dir(p) {
		var st syscall.Stat_t
		if err := syscall.Stat(p, &st); err != nil {
			t.Fatalf("precondition: stat %s: %v", p, err)
		}
		m := st.Mode & 0o777
		if int(st.Uid) == w.WorkerUID || m&0o002 != 0 || (m&0o020 != 0 && slices.Contains(w.WorkerGIDs, int(st.Gid))) {
			t.Fatalf("precondition: fixture ancestor %s (uid %d gid %d mode %o) is writable by worker %+v", p, st.Uid, st.Gid, m, w)
		}
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		out, err := exec.CommandContext(ctx, "/bin/ls", "-led", p).Output()
		cancel()
		if err != nil {
			t.Fatalf("precondition: cannot read the ACL of %s: %v", p, err)
		}
		for _, l := range strings.Split(string(out), "\n")[1:] {
			if strings.Contains(l, " allow ") {
				t.Fatalf("precondition: fixture ancestor %s carries an ACL allow entry: %q", p, l)
			}
		}
		if p == "/" {
			break
		}
	}
	return root
}

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

	// r3: the in-place path checks the digest too. /bin/bash is protected (root-owned, outside every
	// worker root), so it runs in place, and only under its own digest.
	marker := filepath.Join(dir, "in-place-ran")
	touch := []string{"-c", "/usr/bin/touch " + marker}
	for _, c := range []struct{ name, digest string }{
		{"in place, a foreign digest", "sha256:" + strings.Repeat("0", 64)},
		{"in place, the digest of other bytes", goodD},
	} {
		if err := exe.Run(wl, "/bin/bash", c.digest, touch, []string{}); !errors.Is(err, runner.ErrDigest) || exists(marker) {
			t.Errorf("%s: err %v, ran %v; want ErrDigest and nothing ran", c.name, err, exists(marker))
		}
	}
	if err := exe.Run(wl, "/bin/bash", fileDigest("/bin/bash"), touch, []string{}); err != nil || !exists(marker) {
		t.Errorf("in place, its own digest: err %v, ran %v; want nil and the worker ran", err, exists(marker))
	}

	// A live swapper: measured, hash-path-then-exec-path ran the other bytes in 71 of 300 runs. The
	// path is in a worker-writable dir, so this is the copy path, and the copy must be the bytes that
	// were hashed: measured, hashing the file and then reading it again to copy ran the other bytes
	// within the first 5 runs.
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
	for i := 0; i < 100 && !exists(bad); i++ {
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
	env, pids, ints, starts := treeEnv(t, t.TempDir())
	bin := self(t)
	const wall = 2 * time.Second
	e := mustExec(t, workerConfig())
	d := fileDigest(bin)
	done := make(chan error, 1)
	t0 := time.Now()
	go func() {
		done <- e.Run(runner.WithLimits(context.Background(), runner.Limits{Wall: wall, Idle: 30 * time.Second, Stdout: io.Discard}),
			bin, d, []string{helperPrefix + "tree"}, env)
	}()
	waitPids(t, pids, 3, wall*80/100)
	leader, mid, _ := treeRoles(t, pids)
	// r3: 60ms after the leader's SIGINT, the SIGINT has reached the whole GROUP: mid keeps the default
	// action, so it is dead. The leader traps SIGINT, so it is alive: SIGKILL is due 10% of the wall
	// (200ms) after the SIGINT, not with it.
	var err error
	returned, probed := false, false
	var midRunning, leaderRunning bool
	for deadline := time.Now().Add(wall + 3*time.Second); !probed && !returned && time.Now().Before(deadline); {
		select {
		case err = <-done:
			returned = true
		default:
			if len(readPids(ints)) > 0 {
				time.Sleep(60 * time.Millisecond)
				midRunning, leaderRunning, probed = running(mid), running(leader), true
			} else {
				time.Sleep(5 * time.Millisecond)
			}
		}
	}
	if !returned {
		select {
		case err = <-done:
		case <-time.After(wall + 10*time.Second):
			t.Fatalf("Run has not returned 10s past the wall of %v", wall)
		}
	}
	end := time.Now()
	ran := leaderRan(t, starts)
	if !errors.Is(err, runner.ErrWall) {
		t.Fatalf("err %v, want ErrWall", err)
	}
	if end.Sub(t0) < wall-50*time.Millisecond || end.Sub(ran) > wall+time.Second {
		t.Fatalf("Run returned %v after it was called and %v after the leader began; the wall is %v, and the SIGKILL stage is at 100%%",
			end.Sub(t0), end.Sub(ran), wall)
	}
	if n := len(readPids(pids)); n != 3 {
		t.Fatalf("%d of 3 tree pids recorded", n)
	}
	assertDead(t, pids, "wall backstop")
	got := readPids(ints)
	if len(got) == 0 || !probed {
		t.Fatal("the leader never received SIGINT before the kill")
	}
	at := time.Unix(0, int64(got[0]))
	if at.Before(t0.Add(wall*85/100)) || !at.Before(ran.Add(wall*95/100)) {
		t.Fatalf("SIGINT reached the leader %v after Run was called and %v after the leader began; want 90%% of %v",
			at.Sub(t0), at.Sub(ran), wall)
	}
	if midRunning {
		t.Fatalf("60ms after the leader's SIGINT the group member %d (default SIGINT action) still runs: the SIGINT did not reach the process group", mid)
	}
	if !leaderRunning {
		t.Fatalf("60ms after its SIGINT the leader %d (which traps SIGINT) is dead: it was killed before 100%% of the wall", leader)
	}
}

func TestB1_09a_IdleBackstopKillsTree(t *testing.T) {
	env, pids, _, starts := treeEnv(t, t.TempDir())
	bin := self(t)
	const idle = 700 * time.Millisecond
	err, took := runExec(t, context.Background(), bin, fileDigest(bin), []string{helperPrefix + "tree"}, env,
		runner.Limits{Wall: 30 * time.Second, Idle: idle, Stdout: io.Discard})
	end := time.Now()
	if !errors.Is(err, runner.ErrIdle) {
		t.Fatalf("silent tree: err %v, want ErrIdle", err)
	}
	if ran := leaderRan(t, starts); took < idle-50*time.Millisecond || end.Sub(ran) > idle+time.Second {
		t.Fatalf("silent tree: Run returned %v after it was called and %v after the leader began; idle is %v", took, end.Sub(ran), idle)
	}
	assertDead(t, pids, "idle backstop")

	// Control: a worker that writes every 100ms for 2.5s outlives an idle of 1.5s. (The idle here is
	// longer than the silent tree's: the first byte waits on exec, and measured, exec alone has
	// exceeded 700ms under load.)
	var out bytes.Buffer
	err, took = runExec(t, context.Background(), bin, fileDigest(bin), []string{helperPrefix + "chatty"},
		[]string{"B1_09A_N=25"}, runner.Limits{Wall: 30 * time.Second, Idle: 1500 * time.Millisecond, Stdout: &out})
	if err != nil || took < 2400*time.Millisecond {
		t.Fatalf("chatty worker: err %v after %v; output must reset the idle timer", err, took)
	}
	if out.String() != strings.Repeat("x\n", 25) {
		t.Fatalf("chatty worker: stdout %q, want 25 lines delivered to Limits.Stdout", out.String())
	}
}

func TestB1_09a_CtxCancelKillsTree(t *testing.T) {
	env, pids, _, _ := treeEnv(t, t.TempDir())
	bin := self(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancelled := make(chan time.Time, 1)
	go func() {
		for end := time.Now().Add(10 * time.Second); len(readPids(pids)) < 3 && time.Now().Before(end); {
			time.Sleep(20 * time.Millisecond)
		}
		cancelled <- time.Now()
		cancel()
	}()
	err, took := runExec(t, ctx, bin, fileDigest(bin), []string{helperPrefix + "tree"}, env,
		runner.Limits{Wall: 30 * time.Second, Idle: 30 * time.Second, Stdout: io.Discard})
	returned := time.Now()
	if !errors.Is(err, context.Canceled) || errors.Is(err, runner.ErrWall) || errors.Is(err, runner.ErrIdle) {
		t.Fatalf("err %v, want context.Canceled and no backstop", err)
	}
	if took > 12*time.Second {
		t.Fatalf("Run returned %v after start", took)
	}
	if lag := returned.Sub(<-cancelled); lag > time.Second {
		t.Fatalf("Run returned %v after the cancel; want the tree killed at once", lag)
	}
	assertDead(t, pids, "ctx cancel")
}

// r3: a leader that ends on its own leaves its group member and the member's setsid child. Run does
// not return until both are dead, whatever the leader's exit status, and it reports a non-zero
// status as the leader's *exec.ExitError.
func TestB1_09a_LeaderExitKillsTree(t *testing.T) {
	for _, code := range []int{0, 3} {
		dir := t.TempDir()
		env, pids, _, _ := treeEnv(t, dir)
		sh := filepath.Join(dir, "leader.sh")
		script := "#!/bin/sh\n\"$B1_09A_SELF\" " + helperPrefix + "mid &\n" +
			"while [ ! -s \"$B1_09A_PIDS\" ] || [ $(/usr/bin/wc -l < \"$B1_09A_PIDS\") -lt 2 ]; do /bin/sleep 0.05; done\n" +
			"exit " + strconv.Itoa(code) + "\n"
		if err := os.WriteFile(sh, []byte(script), 0o755); err != nil {
			t.Fatal(err)
		}
		err, took := runExec(t, context.Background(), sh, fileDigest(sh), nil, env,
			runner.Limits{Wall: 20 * time.Second, Idle: 20 * time.Second, Stdout: io.Discard})
		var ee *exec.ExitError
		switch {
		case code == 0 && err != nil:
			t.Errorf("leader exit 0: err %v, want nil", err)
		case code != 0 && (!errors.As(err, &ee) || ee.ExitCode() != code):
			t.Errorf("leader exit %d: err %v, want an *exec.ExitError with code %d", code, err, code)
		}
		if took > 5*time.Second {
			t.Errorf("leader exit %d: Run returned after %v; a backstop, not the exit, ended it", code, took)
		}
		if n := len(readPids(pids)); n != 2 {
			t.Fatalf("leader exit %d: %d of 2 pids recorded", code, n)
		}
		assertDead(t, pids, "leader exited "+strconv.Itoa(code))
	}
}

// r3: the Runner hands every one of job.Limits to the launch, and records how the job ended in State,
// where a restart finds it ended and leaves it alone.
func TestB1_09a_RunnerAppliesLimits(t *testing.T) {
	bin := self(t)
	state := t.TempDir()
	pids := filepath.Join(t.TempDir(), "pids")
	reap(t, pids)
	fl := &fakeLauncher{exec: mustExec(t, workerConfig())}
	r, err := runner.New(runner.Config{State: state, Capacity: 2, Launcher: fl})
	if err != nil {
		t.Fatal(err)
	}
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatal(err)
	}
	long := runner.Limits{Wall: 20 * time.Second, Idle: 20 * time.Second}
	job := func(id, mode string, env map[string]string, l runner.Limits) runner.Job {
		return runner.Job{Req: request(id, bin, []string{helperPrefix + mode}, env), Limits: l}
	}
	// run fails the test if Run has not returned in d: a Runner that drops job.Limits would hold the
	// test until its own backstops, minutes away. t.Cleanup's reap then ends the worker.
	run := func(ctx context.Context, j runner.Job, d time.Duration) (error, time.Duration) {
		t.Helper()
		done := make(chan error, 1)
		t0 := time.Now()
		go func() { done <- r.Run(ctx, j) }()
		select {
		case err := <-done:
			return err, time.Since(t0)
		case <-time.After(d):
			t.Fatalf("%s: Run has not returned in %v; job.Limits did not reach the launch", j.Req.JobID, d)
		}
		return nil, 0
	}
	status := func(id string, want runner.Status) {
		t.Helper()
		if st, err := r.Status(id); err != nil || st != want {
			t.Errorf("%s: status %q (%v), want %q", id, st, err, want)
		}
	}

	var out bytes.Buffer
	l := long
	l.Stdout = &out
	if err, _ := run(context.Background(), job("job-ok", "chatty", map[string]string{"B1_09A_N": "3"}, l), 10*time.Second); err != nil || out.String() != "x\nx\nx\n" {
		t.Errorf("job-ok: err %v, stdout %q; want nil and every byte at job.Limits.Stdout", err, out.String())
	}
	status("job-ok", runner.StatusExited)

	wd := t.TempDir()
	wantWd, _ := filepath.EvalSymlinks(wd)
	var pwd bytes.Buffer
	l = long
	l.Stdout, l.Dir = &pwd, wd
	if err, _ := run(context.Background(), job("job-dir", "pwd", map[string]string{}, l), 10*time.Second); err != nil || pwd.String() != wantWd {
		t.Errorf("job-dir: err %v, cwd %q; want nil and job.Limits.Dir %q", err, pwd.String(), wantWd)
	}
	status("job-dir", runner.StatusExited)

	err, took := run(context.Background(), job("job-wall", "tree", map[string]string{"B1_09A_SELF": bin, "B1_09A_PIDS": pids},
		runner.Limits{Wall: 2 * time.Second, Idle: 20 * time.Second, Stdout: io.Discard}), 10*time.Second)
	if !errors.Is(err, runner.ErrWall) || took > 3500*time.Millisecond {
		t.Errorf("job-wall (Wall 2s): err %v after %v; want ErrWall from job.Limits.Wall", err, took)
	}
	assertDead(t, pids, "job-wall")
	status("job-wall", runner.StatusKilled)

	err, took = run(context.Background(), job("job-idle", "sleep", map[string]string{"B1_09A_PIDS": pids},
		runner.Limits{Wall: 20 * time.Second, Idle: 500 * time.Millisecond, Stdout: io.Discard}), 10*time.Second)
	if !errors.Is(err, runner.ErrIdle) || took > 2*time.Second {
		t.Errorf("job-idle (Idle 500ms): err %v after %v; want ErrIdle from job.Limits.Idle", err, took)
	}
	assertDead(t, pids, "job-idle")
	status("job-idle", runner.StatusKilled)

	ctx, cancel := context.WithCancel(context.Background())
	n := len(readPids(pids))
	go func() {
		for end := time.Now().Add(10 * time.Second); len(readPids(pids)) <= n && time.Now().Before(end); {
			time.Sleep(20 * time.Millisecond)
		}
		cancel()
	}()
	if err, _ := run(ctx, job("job-cancel", "sleep", map[string]string{"B1_09A_PIDS": pids}, runner.Limits{Wall: 20 * time.Second, Idle: 20 * time.Second, Stdout: io.Discard}), 15*time.Second); !errors.Is(err, context.Canceled) {
		t.Errorf("job-cancel: err %v, want context.Canceled", err)
	}
	assertDead(t, pids, "job-cancel")
	status("job-cancel", runner.StatusKilled)

	// A restart finds every job ended: it neither ends nor relaunches any, and changes no status.
	fl2 := &fakeLauncher{exec: mustExec(t, workerConfig())}
	r2, err := runner.New(runner.Config{State: state, Capacity: 2, Launcher: fl2})
	if err != nil {
		t.Fatal(err)
	}
	if err := r2.Reconcile(context.Background()); err != nil || len(fl2.endCalls()) != 0 || fl2.count() != 0 {
		t.Errorf("restart after ended jobs: err %v, ends %q, launches %d; want none", err, fl2.endCalls(), fl2.count())
	}
	for id, want := range map[string]runner.Status{"job-ok": runner.StatusExited, "job-dir": runner.StatusExited,
		"job-wall": runner.StatusKilled, "job-idle": runner.StatusKilled, "job-cancel": runner.StatusKilled} {
		if st, err := r2.Status(id); err != nil || st != want {
			t.Errorf("after a restart %s is %q (%v), want %q", id, st, err, want)
		}
	}
}

func TestB1_09a_DaemonKilledMidJob(t *testing.T) {
	bin := self(t)
	state := t.TempDir()
	pids := filepath.Join(t.TempDir(), "pids")
	daemonMidJob(t, state, pids)

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
	if want := []string{"job-d " + lease("job-d")}; !slices.Equal(fl.endCalls(), want) {
		t.Fatalf("Launcher.End calls %q, want %q", fl.endCalls(), want)
	}
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatalf("second Reconcile: %v", err)
	}
	if len(fl.endCalls()) != 1 {
		t.Fatalf("a second Reconcile ended the launch again: %q", fl.endCalls())
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
	if st, err := r3.Status("job-d"); err != nil || st != runner.StatusInterrupted || fl3.count() != 0 || len(fl3.endCalls()) != 0 {
		t.Fatalf("after another restart job-d is %q (%v), launches %d, ends %q; want interrupted, untouched", st, err, fl3.count(), fl3.endCalls())
	}
}

// r3: the daemon dies, and then the job's leader dies before the restart. The leader's process group
// lives on in mid, and mid's setsid child lives on outside it; Reconcile kills both.
func TestB1_09a_ReconcileAfterLeaderDied(t *testing.T) {
	state := t.TempDir()
	pids := filepath.Join(t.TempDir(), "pids")
	daemonMidJob(t, state, pids)
	leader, mid, gc := treeRoles(t, pids)
	syscall.Kill(leader, syscall.SIGKILL)
	for end := time.Now().Add(2 * time.Second); running(leader) && time.Now().Before(end); {
		time.Sleep(10 * time.Millisecond)
	}
	if running(leader) || !running(mid) || !running(gc) {
		t.Fatalf("precondition: leader %d running %v, mid %d running %v, grandchild %d running %v; want only the leader dead",
			leader, running(leader), mid, running(mid), gc, running(gc))
	}
	fl := &fakeLauncher{exec: mustExec(t, workerConfig())}
	r, err := runner.New(runner.Config{State: state, Capacity: 2, Launcher: fl})
	if err != nil {
		t.Fatalf("restart: %v", err)
	}
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	assertDead(t, pids, "Reconcile after the leader died")
	if st, err := r.Status("job-d"); err != nil || st != runner.StatusInterrupted {
		t.Fatalf("after Reconcile job-d is %q (%v), want interrupted", st, err)
	}
	if want := []string{"job-d " + lease("job-d")}; !slices.Equal(fl.endCalls(), want) || fl.count() != 0 {
		t.Fatalf("Launcher.End calls %q, launches %d; want %q and none", fl.endCalls(), fl.count(), want)
	}
}

// r3: the pid-reuse guard's seam. A process's identity is its pid and the kernel's start time.
func TestB1_09a_ProcIdentity(t *testing.T) {
	me, err := runner.ProcIdentity(os.Getpid())
	if err != nil || me.PID != os.Getpid() {
		t.Fatalf("ProcIdentity(self): %+v, %v", me, err)
	}
	if me.Start.After(suiteStart) || me.Start.Before(suiteStart.Add(-30*time.Second)) {
		t.Fatalf("ProcIdentity(self).Start %v; this process started just before %v", me.Start, suiteStart)
	}
	if again, err := runner.ProcIdentity(os.Getpid()); err != nil || again != me {
		t.Fatalf("ProcIdentity(self) twice: %+v then %+v (%v); want the same identity", me, again, err)
	}
	c := exec.Command(self(t), helperPrefix+"sleep")
	c.Env = []string{}
	t1 := time.Now()
	if err := c.Start(); err != nil {
		t.Fatal(err)
	}
	t2 := time.Now()
	pidf := filepath.Join(t.TempDir(), "pid")
	appendLine(pidf, strconv.Itoa(c.Process.Pid))
	reap(t, pidf)
	id, err := runner.ProcIdentity(c.Process.Pid)
	if err != nil || id.PID != c.Process.Pid {
		t.Fatalf("ProcIdentity(child): %+v, %v", id, err)
	}
	if id.Start.Before(t1.Add(-100*time.Millisecond)) || id.Start.After(t2.Add(100*time.Millisecond)) {
		t.Fatalf("ProcIdentity(child).Start %v; the child started between %v and %v", id.Start, t1, t2)
	}
	if !id.Start.After(me.Start) {
		t.Fatalf("the child's start %v is not after this process's %v", id.Start, me.Start)
	}
	c.Process.Kill()
	c.Wait()
	if _, err := runner.ProcIdentity(c.Process.Pid); !errors.Is(err, syscall.ESRCH) {
		t.Fatalf("ProcIdentity of a dead, reaped pid: err %v, want ESRCH", err)
	}
	for _, p := range []int{0, -1} {
		if _, err := runner.ProcIdentity(p); err == nil {
			t.Errorf("ProcIdentity(%d): no error", p)
		}
	}
}

// r3: the pid-reuse guard. After the daemon dies, a restart whose Identify reports a different start
// time for every pid sees each recorded pid as reused: another process. Reconcile signals none of
// them, nor any group or descendant found through them, and still ends the launch and marks the job
// interrupted (its leader is gone). The test reaps the tree it left alive.
func TestB1_09a_ReconcileGuardsPidReuse(t *testing.T) {
	state := t.TempDir()
	pids := filepath.Join(t.TempDir(), "pids")
	daemonMidJob(t, state, pids)
	reused := func(pid int) (runner.Identity, error) {
		id, err := runner.ProcIdentity(pid)
		if err == nil {
			id.Start = id.Start.Add(time.Second)
		}
		return id, err
	}
	fl := &fakeLauncher{exec: mustExec(t, workerConfig())}
	r, err := runner.New(runner.Config{State: state, Capacity: 2, Launcher: fl, Identify: reused})
	if err != nil {
		t.Fatalf("restart: %v", err)
	}
	if err := r.Reconcile(context.Background()); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	time.Sleep(300 * time.Millisecond)
	for _, p := range readPids(pids) {
		if !running(p) {
			t.Errorf("Reconcile signalled pid %d although Identify no longer reported the identity it recorded", p)
		}
	}
	if st, err := r.Status("job-d"); err != nil || st != runner.StatusInterrupted {
		t.Errorf("after Reconcile job-d is %q (%v), want interrupted", st, err)
	}
	if want := []string{"job-d " + lease("job-d")}; !slices.Equal(fl.endCalls(), want) || fl.count() != 0 {
		t.Errorf("Launcher.End calls %q, launches %d; want %q and none", fl.endCalls(), fl.count(), want)
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
	invoked := func(e launcher.Exec, path string, argv []string) (string, error) {
		t.Helper()
		var out bytes.Buffer
		err := e.Run(runner.WithLimits(context.Background(), lim(&out)), path, fileDigest(path), argv, []string{})
		return strings.TrimSpace(out.String()), err
	}
	// copied: the worker ran, from neither the path given nor that path resolved ($TMPDIR is under
	// a symlink on darwin: /var -> /private/var, /tmp -> /private/tmp).
	copied := func(name string, e launcher.Exec, path string) {
		t.Helper()
		real, _ := filepath.EvalSymlinks(path)
		if got, err := invoked(e, path, nil); err != nil || got == "" || got == path || got == real {
			t.Errorf("%s: ran as %q (err %v), want a private copy, neither %s nor %s", name, got, err, path, real)
		}
	}
	inPlace := func(name string, e launcher.Exec, path string) {
		t.Helper()
		if got, err := invoked(e, path, nil); err != nil || got != path {
			t.Errorf("%s: ran as %q (err %v), want in place as %q", name, got, err, path)
		}
	}
	bashArgv := []string{"-c", `printf %s "$BASH"`}

	// 1. Protected: /bin/bash, and /, /bin root-owned 0755, outside every worker root: in place.
	if got, err := invoked(mustExec(t, wc), "/bin/bash", bashArgv); err != nil || got != "/bin/bash" {
		t.Errorf("protected /bin/bash: ran as %q (err %v), want in place as /bin/bash", got, err)
	}
	// 2. A symlink in a worker-writable dir to the protected binary: resolved, then in place, at the
	// resolved path (the link itself can be swapped).
	link := filepath.Join(t.TempDir(), "bash-link")
	if err := os.Symlink("/bin/bash", link); err != nil {
		t.Fatal(err)
	}
	if got, err := invoked(mustExec(t, wc), link, bashArgv); err != nil || got != "/bin/bash" {
		t.Errorf("symlink to /bin/bash: ran as %q (err %v), want the resolved /bin/bash in place", got, err)
	}
	// 3. The same protected binary inside a worker root is copied, never in place; and a copied
	// platform binary is SIGKILLed by code signing (DR M5b). That kill is the specific outcome: a
	// refusal, or any other error, is not a copy.
	inRoot := wc
	inRoot.WorkerRoots = []string{"/nonexistent-b109a-root", "/bin"}
	got, err := invoked(mustExec(t, inRoot), "/bin/bash", bashArgv)
	var ee *exec.ExitError
	ws := syscall.WaitStatus(0)
	if errors.As(err, &ee) {
		ws, _ = ee.Sys().(syscall.WaitStatus)
	}
	if got != "" || ee == nil || !ws.Signaled() || ws.Signal() != syscall.SIGKILL {
		t.Errorf("/bin/bash inside a worker root: printed %q, err %v; want a private copy, SIGKILLed by code signing: an *exec.ExitError, signal killed", got, err)
	}

	script := []byte("#!/bin/sh\nprintf %s \"$0\"\n")
	// 4. A binary in a worker-writable dir is copied.
	wbin := filepath.Join(t.TempDir(), "w")
	if err := os.WriteFile(wbin, script, 0o555); err != nil {
		t.Fatal(err)
	}
	copied("binary in a worker-writable dir", mustExec(t, wc), wbin)
	// 5. A read-only file in read-only dirs whose ancestor is worker-writable is copied.
	ro := t.TempDir()
	rbin := filepath.Join(ro, "r1", "r2", "r3", "w")
	if err := os.MkdirAll(filepath.Dir(rbin), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(rbin, script, 0o555); err != nil {
		t.Fatal(err)
	}
	for _, d := range []string{"r1/r2/r3", "r1/r2", "r1"} {
		if err := os.Chmod(filepath.Join(ro, d), 0o555); err != nil {
			t.Fatal(err)
		}
	}
	t.Cleanup(func() { forceRemove(filepath.Join(ro, "r1")) })
	copied("binary under a worker-writable ancestor", mustExec(t, wc), rbin)

	// 6. Writability is the WORKER's: uid 4242 in this tree's group. The root is private (checked
	// against that worker), so what the worker may write below it is only what a case grants.
	other := runner.ExecConfig{WorkerUID: 4242, WorkerRoots: wc.WorkerRoots}
	var rst syscall.Stat_t
	home, _ := os.UserHomeDir()
	if err := syscall.Stat(home, &rst); err != nil {
		t.Fatal(err)
	}
	other.WorkerGIDs = []int{int(rst.Gid)}
	root := privateRoot(t, other)
	mk := func(rel string, mode os.FileMode) string {
		t.Helper()
		p := filepath.Join(root, rel)
		if err := os.MkdirAll(p, 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.Chmod(p, mode); err != nil {
			t.Fatal(err)
		}
		return p
	}
	put := func(dir string) string {
		t.Helper()
		p := filepath.Join(dir, "w")
		if err := os.WriteFile(p, script, 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.Chmod(p, 0o755); err != nil {
			t.Fatal(err)
		}
		return p
	}
	// 6a. Not writable by 4242: in place. The same file, for a worker with this test's uid: copied.
	fbin := put(mk("p", 0o755))
	inPlace("a binary uid 4242 cannot write", mustExec(t, other), fbin)
	copied("a binary the worker owns", mustExec(t, wc), fbin)
	// 6b. The same protected file inside a worker root: copied (and it runs: a script, not a
	// platform binary).
	otherRoot := other
	otherRoot.WorkerRoots = []string{"/nonexistent-b109a-root", filepath.Join(root, "p")}
	copied("a protected binary inside a worker root", mustExec(t, otherRoot), fbin)
	// 6c. Group-writable four levels up: every ancestor is checked, not the binary and its parent.
	mk("g", 0o775)
	copied("a group-writable ancestor four levels up", mustExec(t, other), put(mk("g/a/b/c", 0o755)))
	// 6d. A path whose lexical ancestors are all protected but which resolves, through a symlinked
	// directory, into a group-writable one: judged by the resolved path.
	mk("g2", 0o775)
	target := mk("g2/ro", 0o755)
	put(target)
	if err := os.Symlink(target, filepath.Join(mk("pub", 0o755), "lnk")); err != nil {
		t.Fatal(err)
	}
	copied("a path through a symlink into a group-writable dir", mustExec(t, other), filepath.Join(root, "pub", "lnk", "w"))
}
