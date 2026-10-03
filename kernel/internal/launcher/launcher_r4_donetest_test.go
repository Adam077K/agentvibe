//go:build donetest

// Round-4 done-tests for B1-08, after the Opus review FAILED build/b1-08 @ 75980d5 (code afed458,
// on the r3 tests at 92ac55d). Re-frozen 2026-10-03, "2026-10-03 re-freeze r4 after review". Every
// decision is the orchestrator's, fail-safe and within canon (09a §8.5 launcher_grant and
// per_launch_requires, §8.2 pinned launch lines):
//
//  1. HIGH :430, the lease is consumed at admit. The launcher records the running job durably in
//     its own persisted state (Deps.State, a directory), keyed by job and fencing lease, under a
//     file lock. Refused (ErrLease): a relaunch on the same lease, ever; a second launcher on the
//     same state; a launcher after a restart while the job still runs. A job frees its concurrent
//     slot only through a recorded end: Launch records one when Exec.Run returns, and End records
//     one for a launch whose launcher died. An end is never inferred.
//  2. HIGH :291, every slot has a rule. Rules are keyed by the flag the slot is the value of,
//     never by the slot's display name, and New refuses a slot whose flag has no rule. The three
//     admitted examples are refused: --disallowedTools without Agent and Task, --settings
//     /tmp/x.json, and -C /Users/adamks. Job files live under Grant.JobRoot, worktrees under
//     Grant.WorktreeRoot. TemplateOf pins the full template.
//  3. HIGH :433, a receipt log that is missing, emptied, truncated or corrupt fails CLOSED: every
//     launch is refused until a founder reset (r6: FounderResetReceiptLog; r4 named ReestablishReceiptLog), and the count is never reset to 0 — the hour
//     after a re-establishment admits nothing.
//  4. MED :354, headless is derived from the argv: claude -p is headless, so a request claiming
//     non-headless with -p is ErrSpec, and an attended launch never uses -p.
//  5. Codex: slot rules are keyed by flag, and a -c value not on Grant.ConfigAllow, exactly, is
//     refused (-c sandbox_mode=danger-full-access included). Synced with B1-07 round 4 in the
//     2026-10-03 merge re-freeze (r5): the codex line has no -p and its locked settings are
//     literal -c values, which are exactly ConfigAllow.
//  6. The review's survivors at :314: the leading-zero guard and the 12-digit guard of cents.
//
// Shares fakeClock, r3Exec, r3Log, r3Leases, r3Live, request, render, with, index, claudeTokens,
// codexTokens, slotValues and argvDigest with rounds 1 and 3.
// Run: go -C kernel test -count=1 -tags donetest ./internal/launcher/
package launcher

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/adapter"
)

type r4Rig struct {
	clock  *fakeClock
	exec   *r3Exec
	leases *r3Leases
	live   *r3Live
	sink   ReceiptSink
	state  string
}

func newR4(t *testing.T, at time.Time) *r4Rig {
	t.Helper()
	return &r4Rig{clock: &fakeClock{t: at}, exec: &r3Exec{}, leases: &r3Leases{live: map[string]r3Lease{}},
		live: &r3Live{}, sink: &r3Log{}, state: t.TempDir()}
}

func (r *r4Rig) deps() Deps {
	return Deps{Clock: r.clock, Exec: r.exec, Digester: fakeDigester{claudeBin: claudeDigest, codexBin: codexDigest},
		Receipts: r.sink, Leases: r.leases, Grant: r.live, State: r.state}
}

// open is one launcher process on the rig's persisted state.
func (r *r4Rig) open(t *testing.T, g Grant) Launcher {
	t.Helper()
	l, err := New(pinned(g, r.deps()))
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	return l
}

// lease issues a lease the verifier calls live; earlier leases of the job stay live too, so only
// the launcher's own record can refuse them.
func (r *r4Rig) lease(job string, fence int) string {
	r.leases.mu.Lock()
	defer r.leases.mu.Unlock()
	key := fmt.Sprintf("job://%s#fence=%d", job, fence)
	r.leases.live[key] = r3Lease{job: job, expires: r.clock.t.Add(24 * time.Hour), fence: fence, current: fence}
	return key
}

func (r *r4Rig) req(job, lease string) Request {
	q := request(job)
	q.Requires.FencedLease = lease
	q.Env = map[string]string{"HOME": "/h", "LANG": "C.UTF-8"} // B1-07 r5: AV_JOB is no longer passed; 2026-10-03 re-freeze B1-08h founder ruling: HOME required
	return q
}

func gated(r *r4Rig) {
	r.exec.mu.Lock()
	r.exec.entered, r.exec.gate = make(chan struct{}, 64), make(chan struct{})
	r.exec.mu.Unlock()
}

func waitEntered(t *testing.T, r *r4Rig) {
	t.Helper()
	select {
	case <-r.exec.entered:
	case <-time.After(5 * time.Second):
		t.Fatal("launch never reached exec")
	}
}

func launchErr(l Launcher, q Request) error { _, err := l.Launch(context.Background(), q); return err }

var errReachedExec = errors.New("the launch reached exec")

// tryLaunch is for a gated rig: an admitted launch would block in exec, so reaching exec is
// reported as errReachedExec instead of waited on, and a wrong implementation fails, never hangs.
func tryLaunch(t *testing.T, r *r4Rig, l Launcher, q Request) error {
	t.Helper()
	done := make(chan error, 1)
	go func() { done <- launchErr(l, q) }()
	select {
	case err := <-done:
		return err
	case <-r.exec.entered:
		return errReachedExec
	case <-time.After(5 * time.Second):
		t.Fatal("launch neither refused nor reached exec")
		return nil
	}
}

// TestB108_R4_LeaseConsumedAtAdmit: item 1.
func TestB108_R4_LeaseConsumedAtAdmit(t *testing.T) {
	t.Run("State is required", func(t *testing.T) {
		r := newR4(t, at0300())
		r.state = ""
		if _, err := New(pinned(r3Grant(), r.deps())); !errors.Is(err, ErrDeps) {
			t.Errorf("New with no State: %v, want ErrDeps (no persisted state, no launches)", err)
		}
	})

	t.Run("relaunch on the same lease after the run ended", func(t *testing.T) {
		r := newR4(t, at0300())
		l := r.open(t, r3Grant())
		l1 := r.lease("job-a", 1)
		if err := launchErr(l, r.req("job-a", l1)); err != nil {
			t.Fatalf("first launch: %v", err)
		}
		if err := launchErr(l, r.req("job-a", l1)); !errors.Is(err, ErrLease) {
			t.Errorf("relaunch on a consumed lease: %v, want ErrLease", err)
		}
		if err := launchErr(r.open(t, r3Grant()), r.req("job-a", l1)); !errors.Is(err, ErrLease) {
			t.Errorf("relaunch on a consumed lease after a restart: %v, want ErrLease", err)
		}
		if r.exec.n() != 1 {
			t.Fatalf("%d execs; a consumed lease never runs again", r.exec.n())
		}
		if err := launchErr(l, r.req("job-a", r.lease("job-a", 2))); err != nil || r.exec.n() != 2 {
			t.Errorf("the ended job on a new lease: %v with %d execs, want it to run", err, r.exec.n())
		}
	})

	t.Run("a second launcher while the job runs", func(t *testing.T) {
		r := newR4(t, at0300())
		gated(r)
		l1 := r.lease("job-b", 1)
		first, lA := make(chan error, 1), r.open(t, r3Grant())
		go func() { first <- launchErr(lA, r.req("job-b", l1)) }()
		waitEntered(t, r)
		other := r.open(t, r3Grant())
		for name, lease := range map[string]string{"same lease": l1, "a new lease": r.lease("job-b", 2)} {
			if err := tryLaunch(t, r, other, r.req("job-b", lease)); !errors.Is(err, ErrLease) {
				t.Errorf("second launcher, %s, job running: %v, want ErrLease", name, err)
			}
		}
		if r.exec.n() != 1 {
			t.Errorf("%d execs while the job runs; want 1", r.exec.n())
		}
		close(r.exec.gate)
		if err := <-first; err != nil {
			t.Errorf("first launch: %v", err)
		}
	})

	t.Run("a restart while the job runs; only a recorded end frees it", func(t *testing.T) {
		r := newR4(t, at0300())
		g := r3Grant()
		g.Caps.Concurrent = 1
		gated(r)
		l1 := r.lease("job-c", 1)
		first, lA := make(chan error, 1), r.open(t, g)
		go func() { first <- launchErr(lA, r.req("job-c", l1)) }() // this launcher "dies" here
		waitEntered(t, r)
		restarted := r.open(t, g)
		if err := tryLaunch(t, r, restarted, r.req("job-c", r.lease("job-c", 2))); !errors.Is(err, ErrLease) {
			t.Errorf("after a restart, job still running, new lease: %v, want ErrLease", err)
		}
		ld := r.lease("job-d", 1)
		if err := tryLaunch(t, r, restarted, r.req("job-d", ld)); !errors.Is(err, ErrConcurrentCap) {
			t.Errorf("after a restart, the running job's slot: %v, want ErrConcurrentCap (an end is never inferred)", err)
		}
		if err := restarted.End(context.Background(), "job-c", r.lease("job-c", 2)); err == nil {
			t.Error("End with a lease the job was not launched on succeeded; want refused")
		}
		if err := tryLaunch(t, r, restarted, r.req("job-d", ld)); !errors.Is(err, ErrConcurrentCap) {
			t.Errorf("after a refused End: %v, want ErrConcurrentCap", err)
		}
		if err := restarted.End(context.Background(), "job-c", l1); err != nil {
			t.Fatalf("End(job-c, its lease): %v", err)
		}
		close(r.exec.gate)
		<-first
		if err := launchErr(r.open(t, g), r.req("job-d", ld)); err != nil {
			t.Errorf("after the recorded end: %v, want the slot free", err)
		}
		if err := launchErr(r.open(t, g), r.req("job-c", l1)); !errors.Is(err, ErrLease) {
			t.Errorf("job-c's first lease after its end: %v, want ErrLease (consumed)", err)
		}
	})

	t.Run("an end recorded by Launch is durable", func(t *testing.T) {
		r := newR4(t, at0300())
		g := r3Grant()
		g.Caps.Concurrent = 1
		if err := launchErr(r.open(t, g), r.req("job-f", r.lease("job-f", 1))); err != nil {
			t.Fatalf("job-f: %v", err)
		}
		if err := launchErr(r.open(t, g), r.req("job-g", r.lease("job-g", 1))); err != nil {
			t.Errorf("another launcher after job-f ended: %v, want the slot free", err)
		}
	})

	t.Run("two launchers race one lease", func(t *testing.T) {
		r := newR4(t, at0300())
		l1 := r.lease("job-e", 1)
		ls := []Launcher{r.open(t, r3Grant()), r.open(t, r3Grant())}
		errs := make([]error, 16)
		var wg sync.WaitGroup
		for i := range errs {
			wg.Add(1)
			go func(i int) { defer wg.Done(); errs[i] = launchErr(ls[i%2], r.req("job-e", l1)) }(i)
		}
		wg.Wait()
		ok := 0
		for _, err := range errs {
			if err == nil {
				ok++
			} else if !errors.Is(err, ErrLease) {
				t.Errorf("racing launch: %v, want nil or ErrLease", err)
			}
		}
		if ok != 1 || r.exec.n() != 1 {
			t.Errorf("%d launches admitted, %d execs; want exactly 1 of each", ok, r.exec.n())
		}
	})
}

func r4Refused(t *testing.T, name string, g Grant, mutate func(q *Request), want error) {
	t.Helper()
	r := newR4(t, at0300())
	l := r.open(t, g)
	q := r.req("job-r4", r.lease("job-r4", 1))
	mutate(&q)
	err := launchErr(l, q)
	if want == nil {
		if err != nil || r.exec.n() != 1 {
			t.Errorf("%s: %v with %d execs, want success", name, err, r.exec.n())
		}
		return
	}
	if !errors.Is(err, want) || r.exec.n() != 0 {
		t.Errorf("%s: %v with %d execs, want %v and none", name, err, r.exec.n(), want)
	}
}

func slot(tokens []string, tok string, v string) func(q *Request) {
	return func(q *Request) { q.Argv[index(tokens, tok)] = v }
}

func codexReq(q *Request) { q.Binary, q.Argv = codexBin, renderJob(q.JobID, codexTokens) }

// TestB108_R4_EverySlotHasARule: item 2.
func TestB108_R4_EverySlotHasARule(t *testing.T) {
	g := r3Grant()
	// The three admitted examples.
	r4Refused(t, "--disallowedTools Read (no Agent, no Task)", g, slot(claudeTokens, "<forbidden>", "Read"), ErrSpec)
	r4Refused(t, "--settings /tmp/x.json", g, slot(claudeTokens, "<job.json>", "/tmp/x.json"), ErrSpec)
	r4Refused(t, "-C /Users/adamks", g, func(q *Request) {
		codexReq(q)
		q.Argv[index(codexTokens, "<worktree>")] = "/Users/adamks"
	}, ErrSpec)
	for _, v := range []string{"Agent", "Task", "Read,Edit", "Agent,Read", "Task,Read", "Agent,Task,"} {
		r4Refused(t, "--disallowedTools "+v, g, slot(claudeTokens, "<forbidden>", v), ErrSpec)
	}
	for _, v := range []string{"Agent,Task", "Read,Task,Agent"} {
		r4Refused(t, "--disallowedTools "+v, g, slot(claudeTokens, "<forbidden>", v), nil)
	}
	for _, v := range []string{"Read,Agent", "Task", "Read,,Edit"} {
		r4Refused(t, "--allowedTools "+v, g, slot(claudeTokens, "<allowed>", v), ErrSpec)
	}
	for _, tok := range []string{"<job.json>", "<compiled.json>", "<f>"} {
		for _, v := range []string{"/tmp/x.json", "/run/av/../x.json", "/run/av", "/run/av/", "/run/avx/a.json",
			"run/av/a.json", "/run/av/a.txt"} {
			r4Refused(t, tok+" "+v, g, slot(claudeTokens, tok, v), ErrSpec)
		}
	}
	for _, v := range []string{"/Users/adamks", "/", "/w", "/w/", "/wx/job", "/w/../etc", "w/job-1"} {
		r4Refused(t, "-C "+v, g, func(q *Request) { codexReq(q); q.Argv[index(codexTokens, "<worktree>")] = v }, ErrSpec)
	}
	for _, v := range []string{"/tmp/r.json", "/run/av"} {
		r4Refused(t, "codex -o "+v, g, func(q *Request) { codexReq(q); q.Argv[index(codexTokens, "<result.json>")] = v }, ErrSpec)
	}
	for _, v := range []string{"not-a-uuid", "0192F7A4-6F1E-7C3A-9B1D-3C5E7A9B1D3C", "0192f7a46f1e7c3a9b1d3c5e7a9b1d3c"} {
		r4Refused(t, "--session-id "+v, g, slot(claudeTokens, "<uuid>", v), ErrSpec)
	}
	for _, v := range []string{"Builder", "builder!", "a/b"} {
		r4Refused(t, "--agent "+v, g, slot(claudeTokens, "<record>", v), ErrSpec)
	}
	r4Refused(t, "the pinned claude line", g, func(*Request) {}, nil)
	r4Refused(t, "the pinned codex line", g, codexReq, nil)

	// New refuses a slot with no rule, a pinned flag with no pin, and a grant without its roots.
	r := newR4(t, at0300())
	refuse := func(name string, mod func(g *Grant)) {
		t.Helper()
		g := r3Grant()
		mod(&g)
		if _, err := New(pinned(g, r.deps())); !errors.Is(err, ErrGrant) {
			t.Errorf("New with %s: %v, want ErrGrant", name, err)
		}
	}
	set := func(i int, tokens []string) func(*Grant) {
		return func(g *Grant) {
			g.Templates[i].Tokens, g.Templates[i].Digest = tokens, argvDigest(tokens)
		}
	}
	refuse("a slot after an unruled flag", set(0, append(slices.Clone(claudeTokens), "--add-dir", "<dir>")))
	refuse("a slot with no flag before it", set(1, append([]string{"<sub>"}, codexTokens[1:]...)))
	refuse("--setting-sources not pinned", func(g *Grant) { g.Templates[0].Pinned = nil })
	refuse("a codex -p slot not pinned", set(1, append(slices.Clone(codexTokens), "-p", "<prof>")))
	refuse("no WorktreeRoot", func(g *Grant) { g.WorktreeRoot = "" })
	refuse("WorktreeRoot /", func(g *Grant) { g.WorktreeRoot = "/" })
	refuse("a relative JobRoot", func(g *Grant) { g.JobRoot = "run/av" })
	refuse("no JobRoot", func(g *Grant) { g.JobRoot = "" })
	refuse("an unclean JobRoot", func(g *Grant) { g.JobRoot = "/run/av/../av" })

	// TemplateOf pins the full template.
	tc := TemplateOf(claudeBin, adapter.NewClaude(claudeDigest))
	if tc.Binary != claudeBin || !slices.Equal(tc.Tokens, claudeTokens) || tc.Digest != argvDigest(claudeTokens) ||
		tc.Pinned["<profile>"] != "project" || len(tc.Pinned) != 1 {
		t.Errorf("TemplateOf(claude) = %+v; want the full pinned line with --setting-sources pinned to project", tc)
	}
	gt := r3Grant()
	gt.Templates = []ArgvTemplate{tc}
	if l, err := New(pinned(gt, r.deps())); err != nil {
		t.Errorf("New with TemplateOf(claude): %v; every slot of the adapter's line must have a rule", err)
	} else if err := launchErr(l, r.req("job-tmpl", r.lease("job-tmpl", 1))); err != nil {
		t.Errorf("a launch on TemplateOf(claude): %v", err)
	}
	// B1-07 round 4: the full codex line, no -p and so no pin, its -c values exactly ConfigAllow.
	tx := TemplateOf(codexBin, adapter.NewCodex(codexDigest))
	if tx.Binary != codexBin || !slices.Equal(tx.Tokens, codexTokens) || tx.Digest != argvDigest(codexTokens) ||
		len(tx.Pinned) != 0 || slices.Contains(tx.Tokens, "-p") {
		t.Errorf("TemplateOf(codex) = %+v; want the full locked line with no -p and no pin", tx)
	}
	gx := r3Grant()
	gx.Templates = []ArgvTemplate{tx}
	if l, err := New(pinned(gx, r.deps())); err != nil {
		t.Errorf("New with TemplateOf(codex): %v; every slot of the adapter's line must have a rule", err)
	} else if err := launchErr(l, func() Request { q := r.req("job-tmplx", r.lease("job-tmplx", 1)); codexReq(&q); return q }()); err != nil {
		t.Errorf("a launch on TemplateOf(codex): %v", err)
	}
	gx.ConfigAllow = gx.ConfigAllow[1:]
	if _, err := New(pinned(gx, r.deps())); !errors.Is(err, ErrGrant) {
		t.Errorf("New with a locked -c value missing from ConfigAllow: %v, want ErrGrant", err)
	}
}

// TestB108_R4_CodexRulesKeyedByFlag: item 5, on the B1-07 round 4 line (r5).
func TestB108_R4_CodexRulesKeyedByFlag(t *testing.T) {
	codexWith := func(tokens []string, pinned map[string]string, extra ...string) Grant {
		g := r3Grant()
		g.Templates[1] = ArgvTemplate{Binary: codexBin, Tokens: tokens, Digest: argvDigest(tokens), Pinned: pinned}
		g.ConfigAllow = append(lockedConfig(codexTokens), extra...)
		return g
	}
	rename := map[string]string{"<worktree>": "<w>", "<f>": "<s>", "<result.json>": "<r>"}
	// Renamed slots keep their flag's rule; the display name carries none.
	renamed := slices.Clone(codexTokens)
	for i, tok := range renamed {
		if n, ok := rename[tok]; ok {
			renamed[i] = n
		}
	}
	g := codexWith(renamed, nil)
	argv := func(c string) []string {
		out := renderJob("job-r4", codexTokens)
		out[index(codexTokens, "<worktree>")] = c
		return out
	}
	r4Refused(t, "renamed -C slot, /Users/adamks", g, func(q *Request) { q.Binary, q.Argv = codexBin, argv("/Users/adamks") }, ErrSpec)
	r4Refused(t, "renamed -C slot, inside the root", g, func(q *Request) { q.Binary, q.Argv = codexBin, argv("/w/job-r4") }, nil)
	// A -C slot that borrows the budget slot's display name still takes the worktree rule.
	asBudget := slices.Clone(renamed)
	asBudget[2] = "<B>"
	g = codexWith(asBudget, nil)
	r4Refused(t, "-C <B> given 5", g, func(q *Request) { q.Binary, q.Argv = codexBin, argv("5") }, ErrSpec)
	r4Refused(t, "-C <B> given a worktree", g, func(q *Request) { q.Binary, q.Argv = codexBin, argv("/w/job-r4") }, nil)

	// -c: only an exact value on Grant.ConfigAllow.
	withC := append(slices.Clone(codexTokens), "-c", "<cfg>")
	g = codexWith(withC, nil, "approval_policy=\"never\"")
	cArg := func(v string) func(q *Request) {
		return func(q *Request) { q.Binary, q.Argv = codexBin, append(renderJob("job-r4", codexTokens), "-c", v) }
	}
	r4Refused(t, "-c on the list", g, cArg("approval_policy=\"never\""), nil)
	for _, v := range []string{"sandbox_mode=danger-full-access", "approval_policy=\"never\" ", "approval_policy=never",
		"sandbox_mode=\"danger-full-access\""} {
		r4Refused(t, "-c "+v, g, cArg(v), ErrSpec)
	}
	r := newR4(t, at0300())
	for _, lit := range []string{"sandbox_mode=danger-full-access", "approval_policy=on-request"} {
		bad := append(slices.Clone(codexTokens), "-c", lit)
		if _, err := New(pinned(codexWith(bad, nil, "approval_policy=\"never\""), r.deps())); err == nil {
			t.Errorf("New with a literal -c %s off the list: nil, want refused", lit)
		}
	}
	good := append(slices.Clone(codexTokens), "-c", "approval_policy=\"never\"")
	if _, err := New(pinned(codexWith(good, nil, "approval_policy=\"never\""), r.deps())); err != nil {
		t.Errorf("New with a literal -c on the list: %v", err)
	}
}

// TestB108_R4_ReceiptLogFailsClosed: item 3.
func TestB108_R4_ReceiptLogFailsClosed(t *testing.T) {
	missing := filepath.Join(t.TempDir(), "never-created.log")
	if _, err := OpenReceiptLog(missing, "sha256:never-pinned"); err == nil {
		t.Error("OpenReceiptLog on a log that was never created: nil, want refused (never created implicitly)")
	}
	sabotage := map[string]func(t *testing.T, path string, mid int64){
		"deleted": func(t *testing.T, p string, _ int64) { must(t, os.Remove(p)) },
		"emptied": func(t *testing.T, p string, _ int64) { must(t, os.Truncate(p, 0)) },
		"truncated mid-record": func(t *testing.T, p string, _ int64) {
			fi, err := os.Stat(p)
			must(t, err)
			must(t, os.Truncate(p, fi.Size()-3))
		},
		"truncated at a record boundary": func(t *testing.T, p string, mid int64) { must(t, os.Truncate(p, mid)) },
		"one byte flipped": func(t *testing.T, p string, _ int64) {
			b, err := os.ReadFile(p)
			must(t, err)
			b[len(b)/2] ^= 0x01
			must(t, os.WriteFile(p, b, 0o600))
		},
		"garbage appended": func(t *testing.T, p string, _ int64) {
			f, err := os.OpenFile(p, os.O_APPEND|os.O_WRONLY, 0)
			must(t, err)
			_, err = f.WriteString("garbage\n")
			must(t, errors.Join(err, f.Close()))
		},
	}
	for name, sab := range sabotage {
		t.Run(name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "receipts.log")
			genesis, err := CreateReceiptLog(path, "")
			if err != nil {
				t.Fatalf("CreateReceiptLog: %v", err)
			}
			if _, err := CreateReceiptLog(path, ""); err == nil {
				t.Error("CreateReceiptLog over an existing log: nil, want refused")
			}
			sink, err := OpenReceiptLog(path, genesis)
			if err != nil {
				t.Fatalf("OpenReceiptLog: %v", err)
			}
			r := newR4(t, at0300())
			r.sink = sink
			l := r.open(t, r3Grant())
			var mid int64
			for i := 0; i < 3; i++ {
				job := fmt.Sprintf("job-log-%d", i)
				if err := launchErr(l, r.req(job, r.lease(job, 1))); err != nil {
					t.Fatalf("launch %d on a healthy log: %v", i, err)
				}
				if i == 1 {
					fi, err := os.Stat(path)
					must(t, err)
					mid = fi.Size()
				}
			}
			sab(t, path, mid)
			execs := r.exec.n()
			for _, later := range []time.Duration{0, 2 * time.Hour, 48 * time.Hour} {
				r.clock.t = at0300().Add(later)
				job := fmt.Sprintf("job-after-%v", later)
				if err := launchErr(l, r.req(job, r.lease(job, 1))); err == nil {
					t.Errorf("a launch %v after the log was %s: nil, want refused (fail closed, never a count of 0)", later, name)
				}
				if s2, err := OpenReceiptLog(path, genesis); err == nil {
					r2 := *r
					r2.sink = s2
					if err := launchErr(r2.open(t, r3Grant()), r.req(job, r.lease(job, 2))); err == nil {
						t.Errorf("a restarted launcher %v after the log was %s: nil, want refused", later, name)
					}
				}
			}
			if r.exec.n() != execs {
				t.Fatalf("%d execs after the log was %s; want none", r.exec.n()-execs, name)
			}
			at := r.clock.t
			genesis2, err := FounderResetReceiptLog(path, genesis, FounderReset{By: "founder", Reason: "r4 sabotage test", At: at})
			if err != nil {
				t.Fatalf("FounderResetReceiptLog: %v", err)
			}
			sink, err = OpenReceiptLog(path, genesis2)
			if err != nil {
				t.Fatalf("OpenReceiptLog after re-establishing: %v", err)
			}
			r.sink = sink
			l = r.open(t, r3Grant())
			r.clock.t = at.Add(59 * time.Minute)
			if err := launchErr(l, r.req("job-soon", r.lease("job-soon", 1))); err == nil || r.exec.n() != execs {
				t.Errorf("59m after re-establishing: %v, want refused (the unknown hour counts as full)", err)
			}
			r.clock.t = at.Add(time.Hour + time.Second)
			if err := launchErr(l, r.req("job-later", r.lease("job-later", 1))); err != nil {
				t.Errorf("an hour after re-establishing: %v, want success", err)
			}
		})
	}
}

func must(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
}

// TestB108_R4_HeadlessFromArgv: item 4. Every claude line carries -p, so every claude launch is
// headless and unattended.
func TestB108_R4_HeadlessFromArgv(t *testing.T) {
	g := r3Grant()
	for _, c := range []struct {
		name                 string
		unattended, headless bool
		isolation            int
		want                 error
	}{
		{"attended, claims non-headless, I1", false, false, 1, ErrSpec},
		{"attended, claims non-headless, I3", false, false, 3, ErrSpec},
		{"attended, claims headless, I3", false, true, 3, ErrSpec},
		{"unattended, claims non-headless, I3", true, false, 3, ErrSpec},
		{"unattended, headless, I3", true, true, 3, nil},
	} {
		r4Refused(t, c.name, g, func(q *Request) {
			q.Unattended, q.Requires.Headless, q.Requires.Isolation = c.unattended, c.headless, c.isolation
		}, c.want)
	}
}

// TestB108_R4_BudgetGuards: item 6. 4611686018427387905 is 2^62 + 1: without the 12-digit guard its
// cents wrap int64 to exactly 100, inside a 500-cent cap.
func TestB108_R4_BudgetGuards(t *testing.T) {
	g := r3Grant()
	for _, v := range []string{"05", "00", "05.00", "007", "4611686018427387905", "4611686018427387905.00",
		"18446744073709551617", "1000000000000"} {
		r4Refused(t, "--max-budget-usd "+v, g, slot(claudeTokens, "<B>", v), ErrSpec)
	}
	for _, v := range []string{"5", "0.01", "5.00", "4.5"} {
		r4Refused(t, "--max-budget-usd "+v, g, slot(claudeTokens, "<B>", v), nil)
	}
}
