//go:build donetest

// Round-3 done-tests for B1-08, after the Opus review FAILED build/b1-08 @ 29abadd: the frozen
// tests killed 2 of its 23 mutants. The orchestrator's decisions, fail-safe and within canon
// (09a §8.5 per_launch_requires, §9 isolation ladder I1-I4, §10 provider mode 'sub'|'api'):
//
//  1. An unattended launch is headless: Unattended without Headless is ErrSpec, and an
//     unattended launch needs I2 or above. Isolation stays within I1..I4.
//  2. A LeaseVerifier (Deps.Leases, required) is called under the admit lock with the job, its
//     fenced lease and the launcher's clock; a forged, expired, revoked, stale-fence or other
//     job's lease is ErrLease, and so is a second launch of a job that is still running.
//  3. Slot values obey their adapter's rules: -C clean, absolute and not /; a template's
//     Pinned slots (codex -p, claude --setting-sources) equal their pin; --max-budget-usd is a
//     decimal of at most two places, above 0 and within the budget cap.
//  4. The per-hour count is read from the ReceiptSink (Since), so it survives a restart.
//  5. Exec receives the pinned digest: the Exec implementation hashes and execs the same file,
//     which closes the window between the digest check and exec.
//  6. Exec receives the complete environment, built only from Grant.EnvAllow names and never
//     inherited; it is never nil.
//  7. The grant is asked whether it is live (Deps.Grant, required) at every admit.
//  8. Provider mode "sub" only; "api" stays ErrUndecided.
//  9. The review's surviving mutants: the rolling-hour boundary, the isolation bound, the slot
//     released after a failed receipt, the "-s=value" form, a cancelled context, a slot "-",
//     an empty JobID, and a forbidden flag with no leading '-'.
//
// Hashed in build/done-tests/B0-17b.yml. Run: go -C kernel test -count=1 -tags donetest ./internal/launcher/
package launcher

import (
	"context"
	"errors"
	"slices"
	"sync"
	"testing"
	"time"
)

type r3Call struct {
	path, digest string
	argv, env    []string
}

// r3Exec records every call; while gate is non-nil, Run reports entry and waits on it.
type r3Exec struct {
	mu      sync.Mutex
	calls   []r3Call
	entered chan struct{}
	gate    chan struct{}
}

func (e *r3Exec) Run(_ context.Context, path, digest string, argv, env []string) error {
	e.mu.Lock()
	e.calls = append(e.calls, r3Call{path, digest, slices.Clone(argv), env})
	entered, gate := e.entered, e.gate
	e.mu.Unlock()
	if entered != nil {
		entered <- struct{}{}
	}
	if gate != nil {
		<-gate
	}
	return nil
}

func (e *r3Exec) n() int { e.mu.Lock(); defer e.mu.Unlock(); return len(e.calls) }

// r3Log is a durable receipt log: a second launcher may read what the first appended.
type r3Log struct {
	mu        sync.Mutex
	got       []Receipt
	appendErr error
	sinceErr  error
}

func (r *r3Log) Append(x Receipt) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.appendErr != nil {
		return r.appendErr
	}
	r.got = append(r.got, x)
	return nil
}

func (r *r3Log) Since(t time.Time) ([]Receipt, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.sinceErr != nil {
		return nil, r.sinceErr
	}
	var out []Receipt
	for _, x := range r.got {
		if x.At.After(t) {
			out = append(out, x)
		}
	}
	return out, nil
}

func (r *r3Log) n() int { r.mu.Lock(); defer r.mu.Unlock(); return len(r.got) }

type r3Lease struct {
	job            string
	expires        time.Time
	revoked        bool
	fence, current int
}

type r3Verify struct {
	job, lease string
	now        time.Time
}

// r3Leases is the lease store's view: it knows each lease's true owner, expiry and fence.
type r3Leases struct {
	mu      sync.Mutex
	live    map[string]r3Lease
	calls   []r3Verify
	entered chan string   // when non-nil, every call reports its job
	block   chan struct{} // when non-nil, the first call waits on it
	// r6: the authoritative store's consumption, compare-and-set; shared by every launcher that
	// shares this store, whatever its State dir.
	consumed map[string]bool
	consumes []string
}

// Consume is the authoritative store's atomic compare-and-set (B1-08 r6).
func (v *r3Leases) Consume(job, lease string) error {
	v.mu.Lock()
	defer v.mu.Unlock()
	key := job + "\x00" + lease
	v.consumes = append(v.consumes, key)
	if v.consumed == nil {
		v.consumed = map[string]bool{}
	}
	if v.consumed[key] {
		return errors.New("lease already consumed in the authoritative store")
	}
	v.consumed[key] = true
	return nil
}

func (v *r3Leases) isConsumed(job, lease string) bool {
	v.mu.Lock()
	defer v.mu.Unlock()
	return v.consumed[job+"\x00"+lease]
}

func (v *r3Leases) Verify(job, lease string, now time.Time) error {
	v.mu.Lock()
	v.calls = append(v.calls, r3Verify{job, lease, now})
	entered, block := v.entered, v.block
	v.block = nil
	v.mu.Unlock()
	if entered != nil {
		entered <- job
	}
	if block != nil {
		<-block
	}
	v.mu.Lock()
	defer v.mu.Unlock()
	l, ok := v.live[lease]
	switch {
	case !ok:
		return errors.New("no such lease")
	case l.job != job:
		return errors.New("lease belongs to " + l.job)
	case !now.Before(l.expires):
		return errors.New("expired")
	case l.revoked:
		return errors.New("revoked")
	case l.fence != l.current:
		return errors.New("stale fencing token")
	}
	return nil
}

func (v *r3Leases) nCalls() int { v.mu.Lock(); defer v.mu.Unlock(); return len(v.calls) }

type r3Live struct {
	mu    sync.Mutex
	err   error
	calls int
}

func (g *r3Live) Live() error { g.mu.Lock(); defer g.mu.Unlock(); g.calls++; return g.err }

type r3Rig struct {
	l      Launcher
	clock  *fakeClock
	exec   *r3Exec
	log    *r3Log
	leases *r3Leases
	live   *r3Live
	state  string // r4: Deps.State
}

func r3Grant() Grant {
	g := grant()
	for i := range g.Templates {
		if slices.Contains(g.Templates[i].Tokens, "<profile>") { // claude only since B1-07 round 4
			g.Templates[i].Pinned = map[string]string{"<profile>": "project"}
		}
	}
	g.EnvAllow = []string{"HOME", "CODEX_HOME", "PATH", "LANG"} // B1-07 r5: the env allowlist; AV_JOB is refused
	return g
}

func (r *r3Rig) deps() Deps {
	return Deps{Clock: r.clock, Exec: r.exec, Digester: fakeDigester{claudeBin: claudeDigest, codexBin: codexDigest},
		Receipts: r.log, Leases: r.leases, Grant: r.live, State: r.state}
}

func r3NewWith(t *testing.T, at time.Time, g Grant, log *r3Log) *r3Rig {
	t.Helper()
	r := &r3Rig{clock: &fakeClock{t: at}, exec: &r3Exec{}, log: log,
		leases: &r3Leases{live: map[string]r3Lease{}}, live: &r3Live{}, state: t.TempDir()}
	l, err := New(pinned(g, r.deps()))
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	r.l = l
	return r
}

func r3New(t *testing.T, at time.Time) *r3Rig { return r3NewWith(t, at, r3Grant(), &r3Log{}) }

// issue registers a live lease for job, valid for a day after the rig's clock.
func (r *r3Rig) issue(job string) {
	r.leases.mu.Lock()
	defer r.leases.mu.Unlock()
	r.leases.live["job://"+job+"#fence=1"] = r3Lease{job: job, expires: r.clock.t.Add(24 * time.Hour), fence: 1, current: 1}
}

// r3Req is a launch that satisfies every rule, its lease issued.
func (r *r3Rig) req(job string) Request {
	r.issue(job)
	q := request(job)
	q.Env = map[string]string{"LANG": "C.UTF-8"} // B1-07 r5: AV_JOB is no longer passed
	return q
}

func (r *r3Rig) codexReq(job string) Request {
	q := r.req(job)
	q.Binary, q.Argv = codexBin, renderJob(job, codexTokens)
	return q
}

// refused: err is want, and nothing reached exec or the receipt log.
func (r *r3Rig) refused(t *testing.T, name string, err, want error) {
	t.Helper()
	if !errors.Is(err, want) {
		t.Errorf("%s: error = %v, want %v", name, err, want)
	}
	if r.exec.n() != 0 || r.log.n() != 0 {
		t.Errorf("%s: a refused launch reached exec (%d) or the log (%d)", name, r.exec.n(), r.log.n())
	}
}

func r3Launch(t *testing.T, name string, mutate func(r *r3Rig, q *Request), want error) {
	t.Helper()
	r := r3New(t, at0300())
	q := r.req("job-r3")
	mutate(r, &q)
	_, err := r.l.Launch(context.Background(), q)
	if want == nil {
		if err != nil || r.exec.n() != 1 {
			t.Errorf("%s: Launch = %v with %d execs, want success", name, err, r.exec.n())
		}
		return
	}
	r.refused(t, name, err, want)
}

func TestB108_R3_DepsRequired(t *testing.T) {
	r := &r3Rig{clock: &fakeClock{t: at0300()}, exec: &r3Exec{}, log: &r3Log{}, leases: &r3Leases{}, live: &r3Live{}, state: t.TempDir()}
	d := r.deps()
	d.Leases = nil
	if _, err := New(pinned(r3Grant(), d)); !errors.Is(err, ErrDeps) {
		t.Errorf("New with no lease verifier: %v, want ErrDeps", err)
	}
	d = r.deps()
	d.Grant = nil
	if _, err := New(pinned(r3Grant(), d)); !errors.Is(err, ErrDeps) {
		t.Errorf("New with no grant status: %v, want ErrDeps", err)
	}
	g := r3Grant()
	g.ForbiddenFlags = append(g.ForbiddenFlags, "bare") // :187, a forbidden flag must start with '-'
	if _, err := New(pinned(g, r.deps())); !errors.Is(err, ErrGrant) {
		t.Errorf("New with forbidden flag %q: %v, want ErrGrant", "bare", err)
	}
}

func TestB108_R3_UnattendedIsHeadless(t *testing.T) {
	r3Launch(t, "unattended, not headless", func(_ *r3Rig, q *Request) { q.Requires.Headless = false }, ErrSpec)
	r3Launch(t, "unattended, not headless, I1", func(_ *r3Rig, q *Request) { q.Requires.Headless, q.Requires.Isolation = false, 1 }, ErrSpec)
	r3Launch(t, "unattended headless at I1", func(_ *r3Rig, q *Request) { q.Requires.Isolation = 1 }, ErrPrerequisite)
	r3Launch(t, "I4", func(_ *r3Rig, q *Request) { q.Requires.Isolation = 4 }, nil)
	r3Launch(t, "I5", func(_ *r3Rig, q *Request) { q.Requires.Isolation = 5 }, ErrPrerequisite) // :258
	r3Launch(t, "I0", func(_ *r3Rig, q *Request) { q.Requires.Isolation = 0 }, ErrPrerequisite)
	// r4, 2026-10-03: headless is derived from the argv, and claude's line carries -p, so an
	// attended non-headless claude launch contradicts itself. This read nil until r4.
	r3Launch(t, "attended interactive at I1", func(_ *r3Rig, q *Request) {
		q.Unattended, q.Requires.Headless, q.Requires.Isolation = false, false, 1
	}, ErrSpec)
}

func TestB108_R3_LeaseVerified(t *testing.T) {
	r := r3New(t, at0300())
	q := r.req("job-ok")
	if _, err := r.l.Launch(context.Background(), q); err != nil {
		t.Fatalf("live lease: %v", err)
	}
	want := []r3Verify{{"job-ok", q.Requires.FencedLease, at0300()}}
	if !slices.Equal(r.leases.calls, want) {
		t.Errorf("Verify calls = %+v, want %+v", r.leases.calls, want)
	}

	set := func(lease string, l r3Lease) func(*r3Rig, *Request) {
		return func(r *r3Rig, q *Request) { r.leases.live[lease] = l }
	}
	lease := "job://job-r3#fence=1"
	far := at0300().Add(time.Hour)
	r3Launch(t, "forged lease", func(r *r3Rig, q *Request) { delete(r.leases.live, lease) }, ErrLease)
	r3Launch(t, "another job's lease", set(lease, r3Lease{job: "job-other", expires: far, fence: 1, current: 1}), ErrLease)
	r3Launch(t, "expired lease", set(lease, r3Lease{job: "job-r3", expires: at0300().Add(-time.Second), fence: 1, current: 1}), ErrLease)
	r3Launch(t, "lease expiring now", set(lease, r3Lease{job: "job-r3", expires: at0300(), fence: 1, current: 1}), ErrLease)
	r3Launch(t, "revoked lease", set(lease, r3Lease{job: "job-r3", expires: far, revoked: true, fence: 1, current: 1}), ErrLease)
	r3Launch(t, "stale fencing token", set(lease, r3Lease{job: "job-r3", expires: far, fence: 1, current: 2}), ErrLease)

	// Expiry is judged at the launcher's clock, not the wall clock.
	late := time.Date(2031, 1, 1, 3, 0, 0, 0, time.UTC)
	r = r3New(t, late)
	q = r.req("job-late")
	r.leases.live[q.Requires.FencedLease] = r3Lease{job: "job-late", expires: time.Date(2030, 1, 1, 0, 0, 0, 0, time.UTC), fence: 1, current: 1}
	_, err := r.l.Launch(context.Background(), q)
	r.refused(t, "lease expired by the launcher's clock", err, ErrLease)
}

func TestB108_R3_DoubleLaunchRefused(t *testing.T) {
	r := r3New(t, at0300())
	r.exec.entered, r.exec.gate = make(chan struct{}, 1), make(chan struct{})
	q := r.req("job-twice")
	first := make(chan error, 1)
	go func() { _, err := r.l.Launch(context.Background(), q); first <- err }()
	select {
	case <-r.exec.entered:
	case <-time.After(5 * time.Second):
		t.Fatal("first launch never reached exec")
	}
	second := make(chan error, 1)
	go func() { _, err := r.l.Launch(context.Background(), q); second <- err }()
	select {
	case err := <-second:
		if !errors.Is(err, ErrLease) {
			t.Errorf("second launch of a running job: %v, want ErrLease", err)
		}
	case <-r.exec.entered:
		t.Error("second launch of a running job reached exec")
	case <-time.After(5 * time.Second):
		t.Error("second launch of a running job neither refused nor ran")
	}
	close(r.exec.gate)
	if err := <-first; err != nil {
		t.Errorf("first launch: %v", err)
	}
}

// The lease check and the slot it admits are one step: no other launch is verified meanwhile.
func TestB108_R3_LeaseVerifiedUnderAdmitLock(t *testing.T) {
	r := r3New(t, at0300())
	release := make(chan struct{})
	r.leases.entered, r.leases.block = make(chan string, 4), release
	a, b := r.req("job-a"), r.req("job-b")
	done := make(chan error, 2)
	go func() { _, err := r.l.Launch(context.Background(), a); done <- err }()
	select {
	case <-r.leases.entered:
	case <-time.After(5 * time.Second):
		t.Fatal("job-a never reached Verify")
	}
	go func() { _, err := r.l.Launch(context.Background(), b); done <- err }()
	select {
	case job := <-r.leases.entered:
		t.Errorf("%s was verified while job-a's verification held the admit lock", job)
	case <-time.After(300 * time.Millisecond):
	}
	close(release)
	for i := 0; i < 2; i++ {
		if err := <-done; err != nil {
			t.Errorf("launch: %v", err)
		}
	}
	if n := r.leases.nCalls(); n != 2 {
		t.Errorf("Verify calls = %d, want 2", n)
	}
}

func TestB108_R3_SlotRules(t *testing.T) {
	codexSlot := func(slot, v string) func(*r3Rig, *Request) {
		return func(r *r3Rig, q *Request) {
			*q = r.codexReq("job-r3")
			q.Argv[index(codexTokens, slot)] = v
		}
	}
	claudeSlot := func(slot, v string) func(*r3Rig, *Request) {
		return func(_ *r3Rig, q *Request) { q.Argv[index(claudeTokens, slot)] = v }
	}
	r3Launch(t, "codex pinned line", codexSlot("<worktree>", "/w/job-r3"), nil)
	for _, v := range []string{"/", "w/job-1", "/w/job-1/..", "/w//job-1", "/w/./job-1", "/w/job-1/"} {
		r3Launch(t, "codex -C "+v, codexSlot("<worktree>", v), ErrSpec)
	}
	// B1-07 round 4: codex carries no -p; a locked -c is a template literal, so changing or adding one is ErrArgvNotPinned.
	r3Launch(t, "codex -c network on", func(r *r3Rig, q *Request) {
		*q = r.codexReq("job-r3")
		q.Argv[index(codexTokens, "sandbox_workspace_write.network_access=false")] = "sandbox_workspace_write.network_access=true"
	}, ErrArgvNotPinned)
	r3Launch(t, "codex extra -c", func(r *r3Rig, q *Request) {
		*q = r.codexReq("job-r3")
		q.Argv = append(q.Argv, "-c", `model="gpt-6-astra"`)
	}, ErrArgvNotPinned)
	r3Launch(t, "codex -p back in", func(r *r3Rig, q *Request) {
		*q = r.codexReq("job-r3")
		q.Argv = append(q.Argv, "-p", "project")
	}, ErrArgvNotPinned)
	r3Launch(t, "claude --setting-sources not the pin", claudeSlot("<profile>", "user"), ErrSpec)
	for _, v := range []string{"5", "4.99", "0.01", "5.00"} {
		r3Launch(t, "--max-budget-usd "+v, claudeSlot("<B>", v), nil)
	}
	for _, v := range []string{"5.01", "6", "0", "0.00", "NaN", "Inf", "1e0", "0x5", " 5", "5 ", "5.", ".5", "5.001", "+5", "05.00.0"} {
		r3Launch(t, "--max-budget-usd "+v, claudeSlot("<B>", v), ErrSpec)
	}
	r3Launch(t, "--max-budget-usd 6 within a 600-cent cap", func(r *r3Rig, q *Request) {
		claudeSlot("<B>", "6")(r, q)
		q.Requires.BudgetCapCents = 600
	}, nil)
}

func TestB108_R3_RateSurvivesRestart(t *testing.T) {
	start := time.Date(2026, 10, 13, 3, 17, 0, 0, time.UTC)
	full := func(at func(i int) time.Time) *r3Log {
		l := &r3Log{}
		for i := 0; i < 120; i++ {
			l.got = append(l.got, Receipt{JobID: "earlier", At: at(i)})
		}
		return l
	}
	spread := func(i int) time.Time { return start.Add(time.Duration(i) * 29 * time.Second) }

	r := r3NewWith(t, start.Add(58*time.Minute), r3Grant(), full(spread))
	execs := r.exec.n()
	if _, err := r.l.Launch(context.Background(), r.req("job-121")); !errors.Is(err, ErrRateCap) || r.exec.n() != execs {
		t.Errorf("121st launch after a restart: %v, want ErrRateCap and no exec", err)
	}

	r = r3NewWith(t, start.Add(time.Hour+time.Second), r3Grant(), full(spread))
	if _, err := r.l.Launch(context.Background(), r.req("job-aged")); err != nil {
		t.Errorf("one launch aged out before the restart: %v, want success", err)
	}

	// :324, the boundary: a launch exactly an hour old no longer counts; a nanosecond less does.
	same := func(int) time.Time { return start }
	r = r3NewWith(t, start.Add(time.Hour), r3Grant(), full(same))
	if _, err := r.l.Launch(context.Background(), r.req("job-hour")); err != nil {
		t.Errorf("120 launches exactly an hour old: %v, want success", err)
	}
	r = r3NewWith(t, start.Add(time.Hour-time.Nanosecond), r3Grant(), full(same))
	if _, err := r.l.Launch(context.Background(), r.req("job-hour")); !errors.Is(err, ErrRateCap) {
		t.Errorf("120 launches an hour less a nanosecond old: %v, want ErrRateCap", err)
	}

	// A log that cannot be read never admits.
	bad := &r3Log{sinceErr: errors.New("disk")}
	rr := &r3Rig{clock: &fakeClock{t: start}, exec: &r3Exec{}, log: bad, leases: &r3Leases{live: map[string]r3Lease{}}, live: &r3Live{}, state: t.TempDir()}
	if l, err := New(pinned(r3Grant(), rr.deps())); err == nil {
		rr.l = l
		if _, err := l.Launch(context.Background(), rr.req("job-blind")); err == nil || rr.exec.n() != 0 {
			t.Errorf("unreadable history: Launch = %v with %d execs, want a refusal", err, rr.exec.n())
		}
	}
}

func TestB108_R3_ExecGetsPinnedDigestAndAllowListedEnv(t *testing.T) {
	t.Setenv("KERNEL_SECRET", "s3cret")
	r := r3New(t, at0300())
	q := r.req("job-env")
	q.Env = map[string]string{"LANG": "C", "PATH": "/usr/bin"}
	if _, err := r.l.Launch(context.Background(), q); err != nil {
		t.Fatalf("Launch: %v", err)
	}
	c := r.exec.calls[0]
	if c.digest != claudeDigest {
		t.Errorf("Exec digest = %q, want the pinned %q (Exec must exec the bytes it hashes)", c.digest, claudeDigest)
	}
	if want := []string{"LANG=C", "PATH=/usr/bin"}; !slices.Equal(c.env, want) {
		t.Errorf("Exec env = %q, want exactly %q", c.env, want)
	}

	r = r3New(t, at0300())
	q = r.codexReq("job-empty")
	q.Env = nil
	if _, err := r.l.Launch(context.Background(), q); err != nil {
		t.Fatalf("Launch with no env: %v", err)
	}
	if c := r.exec.calls[0]; c.env == nil || len(c.env) != 0 || c.digest != codexDigest {
		t.Errorf("Exec env = %#v digest %q, want an empty non-nil env (nil inherits) and %q", c.env, c.digest, codexDigest)
	}

	for name, env := range map[string]map[string]string{
		"a name not on the allow-list": {"AV_JOB": "j", "ANTHROPIC_API_KEY": "sk-x"},
		"an inherited secret by name":  {"KERNEL_SECRET": "s3cret"},
		"a name holding =":             {"AV_JOB=x": "y"},
		"an empty name":                {"": "y"},
		"a NUL in a value":             {"LANG": "a\x00b"},
	} {
		r3Launch(t, "env: "+name, func(_ *r3Rig, q *Request) { q.Env = env }, ErrSpec)
	}
	g := r3Grant()
	g.EnvAllow = nil
	rr := r3NewWith(t, at0300(), g, &r3Log{})
	_, err := rr.l.Launch(context.Background(), rr.req("job-noallow"))
	rr.refused(t, "env with an empty allow-list", err, ErrSpec)
}

func TestB108_R3_GrantLiveAtEveryAdmit(t *testing.T) {
	r := r3New(t, at0300())
	if _, err := r.l.Launch(context.Background(), r.req("job-1")); err != nil {
		t.Fatalf("live grant: %v", err)
	}
	r.live.mu.Lock()
	r.live.err = errors.New("revoked by the founder")
	r.live.mu.Unlock()
	execs, logged := r.exec.n(), r.log.n()
	if _, err := r.l.Launch(context.Background(), r.req("job-2")); !errors.Is(err, ErrGrant) {
		t.Errorf("launch after revocation: %v, want ErrGrant", err)
	}
	if r.exec.n() != execs || r.log.n() != logged {
		t.Error("a launch under a revoked grant reached exec or the log")
	}
	if r.live.calls < 2 {
		t.Errorf("Live asked %d times for 2 launches, want once per launch", r.live.calls)
	}
}

func TestB108_R3_ProviderModeSubOnly(t *testing.T) {
	for _, m := range []string{"subscription", "Sub", "SUB", " sub", "sub ", ""} {
		r3Launch(t, "provider mode "+m, func(_ *r3Rig, q *Request) { q.Requires.ProviderMode = m }, ErrPrerequisite)
	}
	r3Launch(t, "provider mode api", func(_ *r3Rig, q *Request) { q.Requires.ProviderMode = "api" }, ErrUndecided)
	r3Launch(t, "provider mode sub", func(_ *r3Rig, q *Request) { q.Requires.ProviderMode = "sub" }, nil)
}

func TestB108_R3_ReviewMutants(t *testing.T) {
	// :310 a failed receipt releases its per-hour and concurrent slots.
	g := r3Grant()
	g.Caps = Caps{Concurrent: 1, PerHour: 1}
	r := r3NewWith(t, at0300(), g, &r3Log{appendErr: errors.New("disk full")})
	if _, err := r.l.Launch(context.Background(), r.req("job-a")); !errors.Is(err, ErrReceipt) || r.exec.n() != 0 {
		t.Errorf("failed receipt: %v with %d execs, want ErrReceipt and none", err, r.exec.n())
	}
	r.log.mu.Lock()
	r.log.appendErr = nil
	r.log.mu.Unlock()
	if _, err := r.l.Launch(context.Background(), r.req("job-b")); err != nil {
		t.Errorf("launch after a failed receipt with caps of 1: %v, want success (slots released)", err)
	}

	// :223 every spelling of a two-word forbidden flag is ErrForbiddenFlag itself.
	for _, v := range []string{"-s=danger-full-access", "-sdanger-full-access"} {
		r3Launch(t, "codex "+v, func(r *r3Rig, q *Request) {
			*q = r.codexReq("job-r3")
			i := index(q.Argv, "-s")
			q.Argv = with(with(q.Argv, i, v), i+1)
		}, ErrForbiddenFlag)
	}
	r3Launch(t, "--bare=1 appended", func(_ *r3Rig, q *Request) { q.Argv = append(q.Argv, "--bare=1") }, ErrForbiddenFlag)

	// :273 a cancelled context: nothing verified, nothing run, nothing logged.
	r = r3New(t, at0300())
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_, err := r.l.Launch(ctx, r.req("job-cancelled"))
	r.refused(t, "cancelled context", err, context.Canceled)
	if r.leases.nCalls() != 0 {
		t.Error("a cancelled launch was verified")
	}

	// :239 a slot holding "-", "--" or "-x" is not a slot value.
	for _, v := range []string{"-", "--", "-x"} {
		r3Launch(t, "slot "+v, func(_ *r3Rig, q *Request) { q.Argv[index(claudeTokens, "<record>")] = v }, ErrArgvNotPinned)
	}

	// :252 an empty JobID, even with a lease shaped for it.
	r3Launch(t, "empty JobID", func(r *r3Rig, q *Request) {
		q.JobID, q.Requires.FencedLease = "", "job://#fence=1"
		r.leases.live["job://#fence=1"] = r3Lease{job: "", expires: at0300().Add(time.Hour), fence: 1, current: 1}
	}, ErrPrerequisite)
}
