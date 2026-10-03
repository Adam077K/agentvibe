//go:build donetest

// Round-6 done-tests for B1-08, after the Opus review FAILED f9f54d6 (the implementation on the
// merged tests 7275a72). Re-frozen 2026-10-03, "2026-10-03 re-freeze r6 after review". Root cause:
// lease consumption and the launch count lived in launcher-local files that can be deleted or
// forked. Reproduced: a separate State dir replayed a consumed lease (24 jobs against a cap of
// 12); deleting state.json and restarting replayed it; deleting the log and calling
// CreateReceiptLog reset the count. Every decision is the orchestrator's, fail-safe:
//
//  1. Consumption is authoritative: LeaseVerifier.Consume, compare-and-set in the lease store,
//     one winner across processes. No launcher-local file is trusted for it. The store is a fake
//     shared by every launcher here (r3Leases).
//  2. The launch count comes from an append-only hash-chained log whose genesis is pinned
//     (Grant.ReceiptGenesis). Deleted, truncated, re-created or broken fails CLOSED;
//     CreateReceiptLog is refused once a log exists for the machine; only a recorded founder
//     reset (FounderResetReceiptLog) replaces it. The journal (internal/journal) is importable by
//     the launcher — ALLOWED_MODULES governs third-party modules only — but the pinned-genesis
//     log is the shape chosen, as the journal is as local and as deletable.
//  3. One State location per machine: Grant.State pins it, and New refuses any other.
//  4. MED-sec :260/:272: -C and every job file lie inside THIS job's worktree and job directory.
//  5. The review's survivors: :251 (--agent), :252 (--session-id), :287 (tool list), :577
//     (state.json with missing maps) and receiptlog.go:108 (the final newline).
//
// Shares the r1, r3 and r4 helpers. Run: go -C kernel test -count=1 -tags donetest ./internal/launcher/
package launcher

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// openWith is a launcher on its own State dir, pinned there, sharing r's lease store.
func (r *r4Rig) openWith(t *testing.T, g Grant, state string) Launcher {
	t.Helper()
	d := r.deps()
	d.State = state
	l, err := New(pinned(g, d))
	if err != nil {
		t.Fatalf("New on %s: %v", state, err)
	}
	return l
}

// TestB108_R6_ConsumeIsAuthoritative: item 1.
func TestB108_R6_ConsumeIsAuthoritative(t *testing.T) {
	t.Run("a lease consumed elsewhere is refused by a fresh launcher", func(t *testing.T) {
		r := newR4(t, at0300())
		lease := r.lease("job-x", 1)
		if err := r.leases.Consume("job-x", lease); err != nil { // another machine's launcher won it
			t.Fatal(err)
		}
		if err := launchErr(r.open(t, r3Grant()), r.req("job-x", lease)); !errors.Is(err, ErrLease) || r.exec.n() != 0 {
			t.Errorf("a lease the authoritative store already consumed: %v with %d execs, want ErrLease and none", err, r.exec.n())
		}
		if n := r.sink.(*r3Log).n(); n != 0 {
			t.Errorf("%d receipts for a refused launch; want none", n)
		}
	})

	t.Run("a second launcher with a different State dir", func(t *testing.T) {
		r := newR4(t, at0300())
		lease := r.lease("job-y", 1)
		if err := launchErr(r.open(t, r3Grant()), r.req("job-y", lease)); err != nil {
			t.Fatalf("first launch: %v", err)
		}
		other := r.openWith(t, r3Grant(), t.TempDir()) // another State dir, its own pin, the same store
		if err := launchErr(other, r.req("job-y", lease)); !errors.Is(err, ErrLease) || r.exec.n() != 1 {
			t.Errorf("the same lease from another State dir: %v with %d execs, want ErrLease and 1", err, r.exec.n())
		}
	})

	t.Run("a launch after state.json is deleted", func(t *testing.T) {
		r := newR4(t, at0300())
		lease := r.lease("job-z", 1)
		if err := launchErr(r.open(t, r3Grant()), r.req("job-z", lease)); err != nil {
			t.Fatalf("first launch: %v", err)
		}
		must(t, os.Remove(filepath.Join(r.state, "state.json")))
		d := r.deps()
		if l, err := New(pinned(r3Grant(), d)); err == nil {
			if err := launchErr(l, r.req("job-z", lease)); err == nil {
				t.Error("the consumed lease after state.json was deleted: nil, want refused")
			}
		}
		if r.exec.n() != 1 {
			t.Errorf("%d execs; the deleted state.json replayed the lease", r.exec.n())
		}
	})

	t.Run("Consume is the last check, once, for an admitted launch only", func(t *testing.T) {
		r := newR4(t, at0300())
		g := r3Grant()
		g.Caps.PerHour = 1
		l := r.open(t, g)
		la := r.lease("job-a", 1)
		if err := launchErr(l, r.req("job-a", la)); err != nil {
			t.Fatalf("job-a: %v", err)
		}
		r.leases.mu.Lock()
		got := strings.Join(r.leases.consumes, "|")
		r.leases.mu.Unlock()
		if want := "job-a\x00" + la; got != want {
			t.Errorf("Consume calls %q; want exactly one, %q", got, want)
		}
		lb := r.lease("job-b", 1)
		if err := launchErr(l, r.req("job-b", lb)); !errors.Is(err, ErrRateCap) {
			t.Fatalf("job-b over the per-hour cap: %v, want ErrRateCap", err)
		}
		if r.leases.isConsumed("job-b", lb) {
			t.Error("a launch refused by the rate cap consumed its lease; Consume must be the last check")
		}
		q := r.req("job-c", r.lease("job-c", 1))
		q.Argv[index(claudeTokens, "<forbidden>")] = "Read"
		if err := launchErr(l, q); !errors.Is(err, ErrSpec) || r.leases.isConsumed("job-c", q.Requires.FencedLease) {
			t.Errorf("a refused slot: %v; its lease must not be consumed", err)
		}
	})
}

// TestB108_R6_StateIsPinned: item 3.
func TestB108_R6_StateIsPinned(t *testing.T) {
	r := newR4(t, at0300())
	for name, pin := range map[string]string{
		"another dir":    t.TempDir(),
		"no pin":         "",
		"a relative pin": "state",
		"an unclean pin": r.state + "/../" + filepath.Base(r.state),
		"a trailing /":   r.state + "/",
		"a parent of it": filepath.Dir(r.state),
	} {
		g := r3Grant()
		g.State = pin
		if _, err := New(g, r.deps()); err == nil {
			t.Errorf("New with State %q and the grant pinning %s: nil, want refused", r.state, name)
		}
	}
	g := r3Grant()
	g.State = r.state
	if _, err := New(g, r.deps()); err != nil {
		t.Errorf("New on the pinned State: %v", err)
	}
}

// TestB108_R6_ReceiptLogPinnedGenesis: item 2.
func TestB108_R6_ReceiptLogPinnedGenesis(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "receipts.log")
	genesis, err := CreateReceiptLog(path, "")
	if err != nil || genesis == "" {
		t.Fatalf("CreateReceiptLog: %q, %v", genesis, err)
	}
	other := filepath.Join(dir, "second.log")
	if _, err := CreateReceiptLog(other, genesis); err == nil {
		t.Error("CreateReceiptLog with a log already pinned for this machine: nil, want refused")
	}
	if _, err := os.Stat(other); err == nil {
		t.Error("a refused CreateReceiptLog left a file behind")
	}
	for _, pin := range []string{"", "sha256:wrong", genesis + "0"} {
		if _, err := OpenReceiptLog(path, pin); err == nil {
			t.Errorf("OpenReceiptLog against pin %q: nil, want refused", pin)
		}
	}
	sink, err := OpenReceiptLog(path, genesis)
	if err != nil {
		t.Fatalf("OpenReceiptLog with the pin: %v", err)
	}
	r := newR4(t, at0300())
	r.sink = sink
	l := r.open(t, r3Grant())
	for i := 0; i < 2; i++ {
		job := fmt.Sprintf("job-g%d", i)
		if err := launchErr(l, r.req(job, r.lease(job, 1))); err != nil {
			t.Fatalf("launch %d: %v", i, err)
		}
	}
	// The reproduced reset: delete the log and its head, create a fresh one.
	must(t, os.Remove(path))
	_ = os.Remove(path + ".head")
	again, err := CreateReceiptLog(path, "") // a caller that ignores the pin
	if err == nil && again == genesis {
		t.Fatal("a re-created log has the pinned genesis; each genesis must be unique")
	}
	if err := launchErr(l, r.req("job-g2", r.lease("job-g2", 1))); err == nil {
		t.Error("the running launcher after the log was re-created: nil, want refused (fail closed)")
	}
	if _, err := OpenReceiptLog(path, genesis); err == nil {
		t.Error("OpenReceiptLog of the re-created log against the old pin: nil, want refused")
	}
	if r.exec.n() != 2 {
		t.Fatalf("%d execs after the re-creation; want 2", r.exec.n())
	}
	// Only an explicit, recorded founder reset replaces the pinned log.
	at := r.clock.t
	for name, fr := range map[string]FounderReset{"no By": {Reason: "x", At: at}, "no Reason": {By: "founder", At: at}} {
		if _, err := FounderResetReceiptLog(path, genesis, fr); err == nil {
			t.Errorf("FounderResetReceiptLog with %s: nil, want refused", name)
		}
	}
	if _, err := FounderResetReceiptLog(path, "", FounderReset{By: "founder", Reason: "x", At: at}); err == nil {
		t.Error("FounderResetReceiptLog without the prior pin: nil, want refused")
	}
	reset, err := FounderResetReceiptLog(path, genesis, FounderReset{By: "founder", Reason: "disk replaced", At: at})
	if err != nil || reset == "" || reset == genesis {
		t.Fatalf("FounderResetReceiptLog: %q, %v; want a new genesis", reset, err)
	}
	if _, err := CreateReceiptLog(filepath.Join(dir, "third.log"), reset); err == nil {
		t.Error("CreateReceiptLog after a founder reset is pinned: nil, want refused")
	}
	sink, err = OpenReceiptLog(path, reset)
	if err != nil {
		t.Fatalf("OpenReceiptLog after the reset: %v", err)
	}
	r.sink = sink
	l = r.open(t, r3Grant())
	r.clock.t = at.Add(59 * time.Minute)
	if err := launchErr(l, r.req("job-r1", r.lease("job-r1", 1))); err == nil {
		t.Error("59m after a founder reset: nil, want refused (the count is never reset to 0)")
	}
	r.clock.t = at.Add(time.Hour + time.Second)
	if err := launchErr(l, r.req("job-r2", r.lease("job-r2", 1))); err != nil {
		t.Errorf("an hour after the founder reset: %v, want success", err)
	}
	// receiptlog.go:108, the final newline: cutting only it is a truncation.
	fi, err := os.Stat(path)
	must(t, err)
	must(t, os.Truncate(path, fi.Size()-1))
	if err := launchErr(l, r.req("job-r3", r.lease("job-r3", 1))); err == nil {
		t.Error("a log cut by its final newline: nil, want refused")
	}
}

// TestB108_R6_PathsScopedToThisJob: item 4.
func TestB108_R6_PathsScopedToThisJob(t *testing.T) {
	g := r3Grant()
	claude := func(tok, v string) func(*Request) {
		return func(q *Request) { q.Argv[index(claudeTokens, tok)] = v }
	}
	codex := func(tok, v string) func(*Request) {
		return func(q *Request) { codexReq(q); q.Argv[index(codexTokens, tok)] = v }
	}
	// r4Refused launches job "job-r4".
	for _, v := range []string{"/w/job-other", "/w/job-r4x", "/w/job-r", "/w/job-other/job-r4", "/w"} {
		r4Refused(t, "-C "+v, g, codex("<worktree>", v), ErrSpec)
	}
	for _, v := range []string{"/w/job-r4", "/w/job-r4/sub"} {
		r4Refused(t, "-C "+v, g, codex("<worktree>", v), nil)
	}
	for _, tok := range []string{"<job.json>", "<compiled.json>", "<f>"} {
		for _, v := range []string{"/run/av/job-other/job.json", "/run/av/job-r4x/job.json", "/run/av/job.json", "/run/av/job-r4"} {
			r4Refused(t, tok+" "+v, g, claude(tok, v), ErrSpec)
		}
		r4Refused(t, tok+" own", g, claude(tok, "/run/av/job-r4/own.json"), nil)
	}
	for _, tok := range []string{"<f>", "<result.json>"} {
		r4Refused(t, "codex "+tok+" another job's", g, codex(tok, "/run/av/job-other/x.json"), ErrSpec)
	}
	// A JobID that is not one clean segment cannot scope anything.
	for _, job := range []string{"a/b", "..", "."} {
		r := newR4(t, at0300())
		q := r.req(job, r.lease(job, 1))
		q.Argv = renderJob(job, claudeTokens)
		if err := launchErr(r.open(t, g), q); err == nil || r.exec.n() != 0 {
			t.Errorf("JobID %q: %v with %d execs, want refused", job, err, r.exec.n())
		}
	}
}

// TestB108_R6_ReviewSurvivors: item 5.
func TestB108_R6_ReviewSurvivors(t *testing.T) {
	g := r3Grant()
	slotIs := func(tok, v string, want error) {
		t.Helper()
		r4Refused(t, tok+" "+v, g, slot(claudeTokens, tok, v), want)
	}
	// :251 --agent ^[a-z][a-z0-9-]{0,63}$
	slotIs("<record>", "a"+strings.Repeat("b", 63), nil)
	for _, v := range []string{"a" + strings.Repeat("b", 64), "1builder", "builder_x", "builderX", "xbuilder\n"} {
		slotIs("<record>", v, ErrSpec)
	}
	// :252 --session-id, anchored
	for _, v := range []string{"x0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c", "0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3cx",
		"0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c-0192f7a4"} {
		slotIs("<uuid>", v, ErrSpec)
	}
	// :287 a tool name: non-empty, no leading '-', no whitespace
	for _, v := range []string{"Read,-x", "Read,Bad Name", "Read,\tX", "Read,X\n"} {
		slotIs("<allowed>", v, ErrSpec)
	}
	for _, v := range []string{"Agent,Task,-x", "Agent,Task,Bad Name"} {
		slotIs("<forbidden>", v, ErrSpec)
	}
	// :577 a state.json that parses but lacks its maps fails closed, never panics.
	for _, bad := range []string{`{}`, `{"running":{}}`, `{"consumed":{}}`, `{"consumed":null,"running":{}}`} {
		r := newR4(t, at0300())
		l := r.open(t, g)
		must(t, os.WriteFile(filepath.Join(r.state, "state.json"), []byte(bad), 0o600))
		func() {
			defer func() {
				if p := recover(); p != nil {
					t.Errorf("state.json %s: panic %v; want ErrState", bad, p)
				}
			}()
			if err := launchErr(l, r.req("job-s", r.lease("job-s", 1))); !errors.Is(err, ErrState) || r.exec.n() != 0 {
				t.Errorf("state.json %s: %v with %d execs, want ErrState and none", bad, err, r.exec.n())
			}
		}()
	}
}

// TestB108_R6_EnvAllowlistIsB107s: the B1-07 r5 sync. A worker's environment is drawn only from
// HOME, CODEX_HOME, PATH and LANG; AV_JOB is no longer passed. New refuses a grant whose EnvAllow
// names anything else, and a request carrying AV_JOB is ErrSpec.
func TestB108_R6_EnvAllowlistIsB107s(t *testing.T) {
	r := newR4(t, at0300())
	for _, extra := range []string{"AV_JOB", "OPENAI_API_KEY", "LC_ALL", "path"} {
		g := r3Grant()
		g.EnvAllow = append(g.EnvAllow, extra)
		if _, err := New(pinned(g, r.deps())); !errors.Is(err, ErrGrant) {
			t.Errorf("New with EnvAllow + %s: %v, want ErrGrant", extra, err)
		}
	}
	r4Refused(t, "AV_JOB passed", r3Grant(), func(q *Request) { q.Env = map[string]string{"AV_JOB": q.JobID} }, ErrSpec)
	r4Refused(t, "the four allowed names", r3Grant(), func(q *Request) {
		q.Env = map[string]string{"HOME": "/h", "CODEX_HOME": "/h/.codex", "PATH": "/usr/bin", "LANG": "C"}
	}, nil)
}
