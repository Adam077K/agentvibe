//go:build donetest

// B1-08h done-tests, launcher hardening, frozen 2026-10-03 from the B1-08 r7 Opus review's follow-ups
// (HANDOFF-NEXT.md, "B1-08 follow-ups"; PR #166 at d715c18). Every earlier B1-08 done-test is
// unchanged and must stay green. Each test names the follow-up it pins:
//
//	F1  A foreign append racing the launcher's journal append on JournalStream (the socket's
//	    `kernel.launcher` hole, command.go:176-189) never yields ErrState and never burns a lease.
//	    The socket half is socket_b108h_donetest_test.go.
//	F2  A context cancelled after Consume and the Receipt still lets the journal append complete:
//	    receipts and launch records agree, and the next launch is admitted.
//	F3  New refuses (ErrGrant) a State dir equal to, inside or containing EnvPinned["HOME"], after
//	    symlink resolution, as for the r7 worker roots. The request-with-no-HOME half is NOT pinned
//	    here: both fail-safe readings contradict frozen r3 and r7 assertions (founder question).
//	F4  A root that resolves to "/" (worker root, HOME pin, or the State dir itself) is ErrGrant.
//	F6  The HOME and PATH pins are clean and absolute, PATH has no empty entry, and no PATH entry is
//	    equal to or inside a worker root (WorktreeRoot, JobRoot, CODEX_HOME, HOME, TmpRoots), after
//	    symlink resolution. Each violation is ErrGrant at New.
//	F7  A dangling or looping symlink root is ErrGrant; every refused New here leaves the State dir
//	    as it found it (no lock, no state.json), so the genesis and reach checks run first.
//
// Run: go -C kernel test -count=1 -tags donetest -run B108_H ./internal/launcher/ ./internal/socket/
package launcher

import (
	"context"
	"errors"
	"maps"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// hGrant is r3Grant with the r7 fixture pins made explicit, so a case can change one of them.
func hGrant() Grant {
	g := r3Grant()
	g.EnvPinned = maps.Clone(r7EnvPins)
	g.TmpRoots = []string{r7Tmp}
	return g
}

// hNew builds a launcher on a fresh rig whose State dir is state ("" keeps the rig's temp dir).
func hNew(t *testing.T, g Grant, state string) (*r4Rig, error) {
	t.Helper()
	r := newR4(t, at0300())
	if state != "" {
		r.state = state
	}
	_, err := New(pinned(g, r.deps()))
	return r, err
}

// untouched: a refused New created neither of the files New writes into State.
func untouched(t *testing.T, name, state string) {
	t.Helper()
	for _, f := range []string{"lock", "state.json"} {
		if _, err := os.Lstat(filepath.Join(state, f)); !errors.Is(err, os.ErrNotExist) {
			t.Errorf("%s: a refused New left State/%s behind (%v)", name, f, err)
		}
	}
}

func hRefused(t *testing.T, name string, g Grant, state string, want error) {
	t.Helper()
	r, err := hNew(t, g, state)
	if !errors.Is(err, want) {
		t.Errorf("%s: New %v, want %v", name, err, want)
	}
	untouched(t, name, r.state)
}

func hAccepted(t *testing.T, name string, g Grant, state string) {
	t.Helper()
	if _, err := hNew(t, g, state); err != nil {
		t.Errorf("%s: New %v, want accepted", name, err)
	}
}

// nReceipts is every receipt on the rig's sink.
func nReceipts(t *testing.T, r *r4Rig) int {
	t.Helper()
	got, err := r.sink.Since(time.Time{})
	must(t, err)
	return len(got)
}

func symlink(t *testing.T, target, link string) string {
	t.Helper()
	must(t, os.Symlink(target, link))
	return link
}

func realJournal(t *testing.T) journal.Journal {
	t.Helper()
	j, err := journal.Open(filepath.Join(t.TempDir(), "journal.db"))
	if err != nil {
		t.Fatalf("journal.Open: %v", err)
	}
	t.Cleanup(func() { j.Close() })
	return j
}

// raceJournal appends one foreign, non-launch event to JournalStream just before the launcher's
// first append there: the head moves between the launcher's read and its append, as a Userland
// propose_event through the socket could make it today.
type raceJournal struct {
	*memJournal
	raced bool
}

func (r *raceJournal) Append(ctx context.Context, p journal.Proposal) (journal.Event, error) {
	if !r.raced && p.Stream == JournalStream {
		r.raced = true
		seq, _, _ := r.memJournal.Head(ctx, JournalStream)
		if _, err := r.memJournal.Append(ctx, journal.Proposal{Stream: JournalStream, ExpectSeq: seq,
			Type: "note.recorded", Data: []byte(`{}`)}); err != nil {
			panic(err)
		}
	}
	return r.memJournal.Append(ctx, p)
}

// TestB108_H_F1_RacingAppendNeverBurnsALease: F1, the launcher half. What is checked: one foreign
// event that is NOT a launch record lands on JournalStream between the launcher's read of the head and
// its append. The racing launch is then either admitted (one exec) or refused with no exec, not
// ErrState, and with its lease unconsumed; the next launch is admitted; receipts and launch records
// agree in number. Not checked here: a racing forged LAUNCH record. With the socket reservation only
// Kernel-internal code can write the stream, and the requirement there is fail-closed only (r7's
// mismatch cases: while the counts disagree nothing is admitted); whether a forgery is later absorbed
// is unspecified (2026-10-03 orchestrator ruling, red-team r1).
func TestB108_H_F1_RacingAppendNeverBurnsALease(t *testing.T) {
	r := newR4(t, at0300())
	j := &raceJournal{memJournal: &memJournal{}}
	d := r.deps()
	d.Journal = j
	l, err := New(pinned(r3Grant(), d))
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	la := r.lease("job-a", 1)
	err = launchErr(l, r.req("job-a", la))
	switch {
	case !j.raced:
		t.Fatal("the launcher never appended to JournalStream")
	case errors.Is(err, ErrState):
		t.Errorf("the launch a foreign append raced: %v, want admitted or refused without ErrState", err)
	case err == nil && r.exec.n() != 1:
		t.Errorf("the launch a foreign append raced was admitted with %d execs, want 1", r.exec.n())
	case err != nil && (r.exec.n() != 0 || r.leases.isConsumed("job-a", la)):
		t.Errorf("the launch a foreign append raced: %v with %d execs, lease consumed %v; a refusal must not exec or burn the lease",
			err, r.exec.n(), r.leases.isConsumed("job-a", la))
	}
	r.clock.t = r.clock.t.Add(time.Minute)
	n := r.exec.n()
	if err := launchErr(l, r.req("job-b", r.lease("job-b", 1))); err != nil || r.exec.n() != n+1 {
		t.Errorf("the next launch after the race: %v with %d execs, want admitted", err, r.exec.n()-n)
	}
	if got, want := len(launches(t, j)), nReceipts(t, r); got != want {
		t.Errorf("%d journal launch records for %d receipts after the race; want them equal", got, want)
	}
}

type cancelOnConsume struct {
	*r3Leases
	cancel context.CancelFunc
}

func (c cancelOnConsume) Consume(job, lease string) error {
	err := c.r3Leases.Consume(job, lease)
	c.cancel()
	return err
}

type cancelOnReceipt struct {
	*r3Log
	cancel context.CancelFunc
}

func (c cancelOnReceipt) Append(x Receipt) error {
	err := c.r3Log.Append(x)
	c.cancel()
	return err
}

// TestB108_H_F2_JournalAppendSurvivesCancel: F2. The caller's context is cancelled the moment the
// lease is consumed, or the moment the Receipt is appended. The real journal honours a cancelled
// context (BeginTx), so only an append that does not inherit the cancellation (context.WithoutCancel
// or equivalent) completes. Afterwards receipts and launch records agree and the next launch is
// admitted: a cancelled caller cannot leave the launcher in ErrState.
func TestB108_H_F2_JournalAppendSurvivesCancel(t *testing.T) {
	for _, c := range []struct {
		name     string
		wrap     func(r *r4Rig, d *Deps, cancel context.CancelFunc)
		receipts int // the receipts a correct launcher must have journalled; -1: any, if they agree
	}{
		{"cancelled at Consume", func(r *r4Rig, d *Deps, cancel context.CancelFunc) {
			d.Leases = cancelOnConsume{r.leases, cancel}
		}, -1},
		{"cancelled at the Receipt append", func(r *r4Rig, d *Deps, cancel context.CancelFunc) {
			d.Receipts = cancelOnReceipt{r.sink.(*r3Log), cancel}
		}, 1},
	} {
		t.Run(c.name, func(t *testing.T) {
			j := realJournal(t)
			r := newR4(t, at0300())
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			d := r.deps()
			d.Journal = j
			c.wrap(r, &d, cancel)
			l, err := New(pinned(r3Grant(), d))
			if err != nil {
				t.Fatalf("New: %v", err)
			}
			l.Launch(ctx, r.req("job-a", r.lease("job-a", 1))) // its error is not the subject
			if ctx.Err() == nil {
				t.Fatal("the launch never reached the cancellation point")
			}
			got, rcpts := len(launches(t, j)), nReceipts(t, r)
			if got != rcpts || c.receipts >= 0 && rcpts != c.receipts {
				t.Errorf("%d journal launch records for %d receipts after the cancel; want them equal (and %d)", got, rcpts, c.receipts)
			}
			r.clock.t = r.clock.t.Add(time.Minute)
			n := r.exec.n()
			if err := launchErr(l, r.req("job-b", r.lease("job-b", 1))); err != nil || r.exec.n() != n+1 {
				t.Errorf("the next launch after a cancelled one: %v with %d execs, want admitted", err, r.exec.n()-n)
			}
			if err := j.Verify(context.Background()); err != nil {
				t.Errorf("journal Verify: %v", err)
			}
		})
	}
}

// TestB108_H_F3_StateOutOfHomeReach: F3. HOME is handed to every worker, so it joins r7's worker
// roots: a State dir equal to, inside or containing the HOME pin is ErrGrant, after symlink resolution
// of the longest existing prefix. A grant with no HOME pin is unaffected (r7 pins that case).
func TestB108_H_F3_StateOutOfHomeReach(t *testing.T) {
	check := func(name string, setup func(base string) (home, state string), ok bool) {
		t.Run(name, func(t *testing.T) {
			home, state := setup(resolved(t, t.TempDir()))
			g := hGrant()
			g.EnvPinned["HOME"] = home
			if ok {
				hAccepted(t, name, g, state)
			} else {
				hRefused(t, name, g, state, ErrGrant)
			}
		})
	}
	check("a sibling", func(b string) (string, string) { return b + "/home", mkdir(t, b+"/state") }, true)
	check("a sibling sharing a name prefix", func(b string) (string, string) {
		return b + "/state-home", mkdir(t, b+"/state")
	}, true)

	check("inside HOME", func(b string) (string, string) { return mkdir(t, b+"/home"), mkdir(t, b+"/home/s") }, false)
	check("HOME itself", func(b string) (string, string) { h := mkdir(t, b+"/home"); return h, h }, false)
	check("containing HOME", func(b string) (string, string) { s := mkdir(t, b+"/state"); return s + "/home", s }, false)
	check("a symlink into HOME", func(b string) (string, string) {
		h := mkdir(t, b+"/home")
		return h, symlink(t, mkdir(t, h+"/s"), b+"/link")
	}, false)
	check("HOME a symlink to the State dir's parent", func(b string) (string, string) {
		real := mkdir(t, b+"/real")
		return symlink(t, real, b+"/hlink"), mkdir(t, real+"/s")
	}, false)
	check("HOME under a symlinked parent, its tail not yet existing", func(b string) (string, string) {
		real := mkdir(t, b+"/real")
		symlink(t, real, b+"/clink")
		return b + "/clink/home", mkdir(t, real+"/home/s")
	}, false)
}

// TestB108_H_F4_RootAtSlashRefused: F4 (launcher.go:505). A root that resolves to "/" contains every
// path, so it is ErrGrant whatever the State dir; so is a State dir that resolves to "/".
func TestB108_H_F4_RootAtSlashRefused(t *testing.T) {
	for _, c := range []struct {
		name string
		set  func(g *Grant, slash string)
	}{
		{"WorktreeRoot", func(g *Grant, s string) { g.WorktreeRoot = s }},
		{"JobRoot", func(g *Grant, s string) { g.JobRoot = s }},
		{"a TmpRoots entry", func(g *Grant, s string) { g.TmpRoots = []string{r7Tmp, s} }},
		{"the CODEX_HOME pin", func(g *Grant, s string) { g.EnvPinned["CODEX_HOME"] = s }},
		{"the HOME pin", func(g *Grant, s string) { g.EnvPinned["HOME"] = s }},
	} {
		t.Run(c.name, func(t *testing.T) {
			base := resolved(t, t.TempDir())
			slash := symlink(t, "/", base+"/slash")
			chain := symlink(t, slash, base+"/chain")
			for _, root := range []string{slash, chain} {
				g := hGrant()
				c.set(&g, root)
				hRefused(t, c.name+" resolving to / via "+filepath.Base(root), g, "", ErrGrant)
			}
		})
	}
	t.Run("the State dir", func(t *testing.T) {
		slash := symlink(t, "/", resolved(t, t.TempDir())+"/slash")
		if _, err := hNew(t, hGrant(), slash); !errors.Is(err, ErrGrant) {
			t.Errorf("a State dir resolving to /: New %v, want ErrGrant", err)
		}
	})
}

// TestB108_H_F6_EnvPinsCleanAndOutsideWorkerRoots: F6. The HOME and PATH pins are clean absolute
// paths; PATH is ':'-joined clean absolute entries, none empty (an empty entry is the cwd); and no
// PATH entry is equal to or inside a worker root, compared after symlink resolution. ErrGrant at New.
// The fixture's worker roots: WorktreeRoot /w, JobRoot /run/av, TmpRoots /wtmp, CODEX_HOME /h/.codex,
// HOME /h.
func TestB108_H_F6_EnvPinsCleanAndOutsideWorkerRoots(t *testing.T) {
	pin := func(name, v string) Grant { g := hGrant(); g.EnvPinned[name] = v; return g }
	hAccepted(t, "the fixture pins", hGrant(), "")
	hAccepted(t, "PATH with two clean entries", pin("PATH", "/usr/bin:/bin"), "")
	hAccepted(t, "PATH entries sharing a worker root's name prefix", pin("PATH", "/usr/bin:/wx:/run/avx:/hx"), "")

	for _, v := range []string{"h", "", "/h/", "/h/../h", "//h", "/h/.", "/"} {
		hRefused(t, "HOME pin "+`"`+v+`"`, pin("HOME", v), "", ErrGrant)
	}
	for _, v := range []string{
		"usr/bin", "", ":", "/usr/bin/", "/usr/bin:", ":/usr/bin", "/usr/bin::/bin", "/usr/bin:bin",
		"/usr/../usr/bin", "/usr/bin:/bin/", "/usr/bin:.", "/usr/bin://bin",
	} {
		hRefused(t, "PATH pin "+`"`+v+`"`, pin("PATH", v), "", ErrGrant)
	}
	for _, v := range []string{
		"/usr/bin:/w/job-r4/bin", "/w:/usr/bin", "/usr/bin:/run/av/bin", "/usr/bin:/wtmp/bin",
		"/usr/bin:/h/.codex/bin", "/usr/bin:/h/bin", "/usr/bin:/h",
	} {
		hRefused(t, "PATH entry in a worker root "+`"`+v+`"`, pin("PATH", v), "", ErrGrant)
	}

	t.Run("a PATH entry that is a symlink into the worktree root", func(t *testing.T) {
		base := resolved(t, t.TempDir())
		wt := mkdir(t, base+"/w")
		link := symlink(t, wt, base+"/plink")
		for _, entry := range []string{link, link + "/job-r4/bin"} {
			g := pin("PATH", "/usr/bin:"+entry)
			g.WorktreeRoot = wt
			hRefused(t, "PATH entry "+entry, g, "", ErrGrant)
		}
	})
}

// TestB108_H_F7_DanglingRootRefusedAndStateUntouched: F7. A worker root or HOME pin that is a
// dangling or looping symlink, or lies under one, cannot be resolved, so it is ErrGrant. And the
// genesis and reach checks run before State is touched: every refusal below leaves the State dir empty.
func TestB108_H_F7_DanglingRootRefusedAndStateUntouched(t *testing.T) {
	empty := func(t *testing.T, name, state string) {
		t.Helper()
		if ents, err := os.ReadDir(state); err != nil || len(ents) != 0 {
			t.Errorf("%s: a refused New left %d entries in State (%v), want none", name, len(ents), err)
		}
	}
	for _, c := range []struct {
		name string
		set  func(g *Grant, p string)
	}{
		{"WorktreeRoot", func(g *Grant, p string) { g.WorktreeRoot = p }},
		{"JobRoot", func(g *Grant, p string) { g.JobRoot = p }},
		{"a TmpRoots entry", func(g *Grant, p string) { g.TmpRoots = []string{r7Tmp, p} }},
		{"the CODEX_HOME pin", func(g *Grant, p string) { g.EnvPinned["CODEX_HOME"] = p }},
		{"the HOME pin", func(g *Grant, p string) { g.EnvPinned["HOME"] = p }},
	} {
		t.Run(c.name, func(t *testing.T) {
			base := resolved(t, t.TempDir())
			dangling := symlink(t, base+"/nowhere", base+"/dangling")
			loop := symlink(t, base+"/loopB", base+"/loopA")
			symlink(t, loop, base+"/loopB")
			for _, p := range []string{dangling, dangling + "/sub", loop} {
				g := hGrant()
				c.set(&g, p)
				r, err := hNew(t, g, "")
				if !errors.Is(err, ErrGrant) {
					t.Errorf("%s at %s: New %v, want ErrGrant", c.name, p, err)
				}
				empty(t, c.name+" at "+p, r.state)
			}
		})
	}

	t.Run("a genesis mismatch", func(t *testing.T) {
		g := hGrant()
		g.ReceiptGenesis = "not-the-sink's"
		r, err := hNew(t, g, "")
		if !errors.Is(err, ErrState) && !errors.Is(err, ErrGrant) {
			t.Errorf("a genesis mismatch: New %v, want ErrState or ErrGrant", err)
		}
		empty(t, "a genesis mismatch", r.state)
	})
	t.Run("a State dir inside the worktree root", func(t *testing.T) {
		base := resolved(t, t.TempDir())
		g := hGrant()
		g.WorktreeRoot = mkdir(t, base+"/w")
		state := mkdir(t, base+"/w/s")
		if _, err := hNew(t, g, state); !errors.Is(err, ErrGrant) {
			t.Errorf("a State dir inside the worktree root: New %v, want ErrGrant", err)
		}
		empty(t, "a State dir inside the worktree root", state)
	})
	t.Run("an unclean worker root", func(t *testing.T) {
		g := hGrant()
		g.TmpRoots = []string{r7Tmp + "/"}
		r, err := hNew(t, g, "")
		if !errors.Is(err, ErrGrant) {
			t.Errorf("an unclean TmpRoots entry: New %v, want ErrGrant", err)
		}
		empty(t, "an unclean worker root", r.state)
	})
}

// TestB108_H_F3_RequestCarriesPinnedHome: F3, the founder ruling of 2026-10-03 ("HOME required",
// option a). While EnvPinned holds a HOME pin, a request whose Env lacks HOME, or carries any other
// HOME, is ErrSpec before exec: a worker with no HOME falls back to the real home directory. That
// holds for codex too, which itself needs only one of HOME and CODEX_HOME (B1-07 r5).
func TestB108_H_F3_RequestCarriesPinnedHome(t *testing.T) {
	setEnv := func(env map[string]string) func(q *Request) { return func(q *Request) { q.Env = env } }
	r4Refused(t, "HOME at its pin", r3Grant(), setEnv(map[string]string{"HOME": "/h"}), nil)
	r4Refused(t, "HOME at its pin, with LANG", r3Grant(), setEnv(map[string]string{"HOME": "/h", "LANG": "C"}), nil)
	r4Refused(t, "codex, HOME and CODEX_HOME at their pins", r3Grant(), func(q *Request) {
		codexReq(q)
		q.Env = map[string]string{"HOME": "/h", "CODEX_HOME": "/h/.codex", "PATH": "/usr/bin"}
	}, nil)

	r4Refused(t, "no Env at all", r3Grant(), setEnv(nil), ErrSpec)
	r4Refused(t, "an empty Env", r3Grant(), setEnv(map[string]string{}), ErrSpec)
	r4Refused(t, "LANG but no HOME", r3Grant(), setEnv(map[string]string{"LANG": "C.UTF-8"}), ErrSpec)
	r4Refused(t, "every other pinned name but no HOME", r3Grant(),
		setEnv(map[string]string{"CODEX_HOME": "/h/.codex", "PATH": "/usr/bin", "LANG": "C"}), ErrSpec)
	r4Refused(t, "codex with CODEX_HOME but no HOME", r3Grant(), func(q *Request) {
		codexReq(q)
		q.Env = map[string]string{"CODEX_HOME": "/h/.codex", "PATH": "/usr/bin"}
	}, ErrSpec)
	for _, v := range []string{"", "/other", "/h/", "/h/.codex", "/"} {
		r4Refused(t, `HOME "`+v+`"`, r3Grant(), setEnv(map[string]string{"HOME": v}), ErrSpec)
	}
}

// TestB108_H_F3_GrantPinsHome: 2026-10-03 orchestrator ruling: HOME pin required. New refuses
// (ErrGrant) a grant whose EnvPinned has no HOME, so a request can never run without the pinned
// HOME; the refusal leaves State untouched.
func TestB108_H_F3_GrantPinsHome(t *testing.T) {
	hAccepted(t, "every pin present", hGrant(), "")
	g := hGrant()
	delete(g.EnvPinned, "HOME")
	hRefused(t, "CODEX_HOME and PATH pinned, HOME not", g, "", ErrGrant)
	g = hGrant()
	g.EnvPinned = map[string]string{}
	hRefused(t, "an empty pin table", g, "", ErrGrant)
	g = hGrant()
	g.EnvPinned = map[string]string{"HOME": "/h"}
	hAccepted(t, "HOME the only pin", g, "")
}

// ctxExec records the context error each Exec.Run sees.
type ctxExec struct {
	*r3Exec
	seen []error
}

func (e *ctxExec) Run(ctx context.Context, path, digest string, argv, env []string) error {
	e.seen = append(e.seen, ctx.Err())
	return e.r3Exec.Run(ctx, path, digest, argv, env)
}

// TestB108_H_F2_ExecSeesCallerCancel: F2 detaches the journal append only (red-team r1). Exec.Run is
// still handed the caller's context, so a launch whose caller cancelled at Consume is either not
// exec'd or exec'd with a context that reports Canceled; never with a live, detached one.
func TestB108_H_F2_ExecSeesCallerCancel(t *testing.T) {
	r := newR4(t, at0300())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	ce := &ctxExec{r3Exec: r.exec}
	d := r.deps()
	d.Exec = ce
	d.Leases = cancelOnConsume{r.leases, cancel}
	l, err := New(pinned(r3Grant(), d))
	must(t, err)
	l.Launch(ctx, r.req("job-a", r.lease("job-a", 1))) // its error is not the subject
	if ctx.Err() == nil {
		t.Fatal("the launch never reached Consume")
	}
	for _, e := range ce.seen {
		if !errors.Is(e, context.Canceled) {
			t.Errorf("Exec.Run got a live context after the caller cancelled (%v)", e)
		}
	}
}

// TestB108_H_F6_PathComparedResolved: F6, red-team r1. PATH entries and worker roots are BOTH
// compared after symlink resolution: a PATH entry naming the real target of a symlinked worker root
// is inside it. And a PATH entry that cannot be resolved (dangling, even toward a path a worker could
// create later, or looping) is ErrGrant, never skipped.
func TestB108_H_F6_PathComparedResolved(t *testing.T) {
	base := resolved(t, t.TempDir())
	wt := mkdir(t, base+"/w")
	g := hGrant()
	g.WorktreeRoot = symlink(t, wt, base+"/wlink")
	g.EnvPinned["PATH"] = "/usr/bin:" + wt + "/bin"
	hRefused(t, "PATH entry under the real target of a symlinked WorktreeRoot", g, "", ErrGrant)

	realTmp := mkdir(t, base+"/realtmp")
	g = hGrant()
	g.TmpRoots = []string{symlink(t, realTmp, base+"/tmplink")}
	g.EnvPinned["PATH"] = "/usr/bin:" + realTmp + "/bin"
	hRefused(t, "PATH entry under the resolved path of an unresolved TmpRoot", g, "", ErrGrant)
	if tmp := t.TempDir(); resolved(t, tmp) != tmp { // where TMPDIR itself lies under a symlink
		g = hGrant()
		g.TmpRoots = []string{tmp}
		g.EnvPinned["PATH"] = "/usr/bin:" + resolved(t, tmp) + "/bin"
		hRefused(t, "PATH entry under the resolved t.TempDir() TmpRoot", g, "", ErrGrant)
	}

	later := symlink(t, wt+"/later", base+"/dl")
	loop := symlink(t, base+"/lb", base+"/la")
	symlink(t, loop, base+"/lb")
	for _, e := range []string{later, loop, later + "/bin"} {
		g := hGrant()
		g.WorktreeRoot = wt
		g.EnvPinned["PATH"] = "/usr/bin:" + e
		hRefused(t, "unresolvable PATH entry "+e, g, "", ErrGrant)
	}
}

// TestB108_H_F7_RefusedNewLeavesUsedStateIntact: F7, red-team r1. A refused New on a State dir a
// launcher has already used leaves state.json byte-identical and its lock file in place.
func TestB108_H_F7_RefusedNewLeavesUsedStateIntact(t *testing.T) {
	r := newR4(t, at0300())
	l, err := New(pinned(hGrant(), r.deps()))
	must(t, err)
	must(t, launchErr(l, r.req("job-a", r.lease("job-a", 1))))
	before, err := os.ReadFile(filepath.Join(r.state, "state.json"))
	must(t, err)
	pathInRoot := hGrant()
	pathInRoot.EnvPinned["PATH"] = "/usr/bin:/w"
	noHome := hGrant()
	delete(noHome.EnvPinned, "HOME")
	for name, g := range map[string]Grant{"a PATH entry in a worker root": pathInRoot, "no HOME pin": noHome} {
		if _, err := New(pinned(g, r.deps())); !errors.Is(err, ErrGrant) {
			t.Errorf("%s on a used State: New %v, want ErrGrant", name, err)
		}
		after, err := os.ReadFile(filepath.Join(r.state, "state.json"))
		if err != nil || string(after) != string(before) {
			t.Errorf("%s: a refused New changed a used State's state.json: %v %q -> %q", name, err, before, after)
		}
		if _, err := os.Lstat(filepath.Join(r.state, "lock")); err != nil {
			t.Errorf("%s: a refused New removed a used State's lock: %v", name, err)
		}
	}
}

// TestB108_H_F3_NoHomePinWhateverAllowlist: 2026-10-03 review r1, pinning the HOME-pin ruling. A grant
// with no HOME pin is ErrGrant at New whatever its EnvAllow, including one that omits HOME and nil.
func TestB108_H_F3_NoHomePinWhateverAllowlist(t *testing.T) {
	for _, allow := range [][]string{{"LANG"}, {"LANG", "PATH"}, nil} {
		g := hGrant()
		g.EnvAllow = allow
		delete(g.EnvPinned, "HOME")
		hRefused(t, "no HOME pin, EnvAllow "+filepath.Join(allow...), g, "", ErrGrant)
	}
}

// TestB108_H_F3_MissingHomeKeepsLease: 2026-10-03 review r1, pinning the HOME-required ruling. A
// request refused for its missing HOME is ErrSpec before admit: no exec, no receipt, and its lease is
// not consumed.
func TestB108_H_F3_MissingHomeKeepsLease(t *testing.T) {
	r := newR4(t, at0300())
	l, err := New(pinned(r3Grant(), r.deps()))
	must(t, err)
	la := r.lease("job-a", 1)
	q := r.req("job-a", la)
	q.Env = map[string]string{"LANG": "C"}
	err = launchErr(l, q)
	if !errors.Is(err, ErrSpec) || r.exec.n() != 0 || r.leases.isConsumed("job-a", la) || nReceipts(t, r) != 0 {
		t.Errorf("missing HOME: %v, %d execs, lease consumed %v, %d receipts; want ErrSpec, none, unconsumed, none",
			err, r.exec.n(), r.leases.isConsumed("job-a", la), nReceipts(t, r))
	}
}
