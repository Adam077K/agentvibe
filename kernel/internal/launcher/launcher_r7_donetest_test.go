//go:build donetest

// Round-7 done-tests for B1-08, after the Opus review FAILED 160381f. Re-frozen 2026-10-03,
// "2026-10-03 re-freeze r7 threat-model ruling" (docs/vision-v3/_process/
// DR-B1-08-THREAT-MODEL-2026-10-03.md). The launcher defends against workers and bugs, not against
// a writer of its own State dir; these pin what makes that premise true, fail-safe:
//
//  1. The State dir is out of every worker's reach. New refuses (ErrGrant) a State dir equal to,
//     inside, or containing WorktreeRoot, JobRoot (the -o and job-file directory), the CODEX_HOME
//     pin, or any Grant.TmpRoots entry (every TMPDIR root handed to workers). Paths are compared
//     after resolving symlinks, of the longest existing prefix when the rest does not exist yet.
//  2. MED-sec, launcher.go:528 (160381f). HOME, CODEX_HOME and PATH take only Grant.EnvPinned's
//     value. Any other value, or a value with no pin, is ErrSpec: refused before exec.
//  3. Tripwire, launcher.go:191 (160381f). Grant.ReceiptGenesis was declared and never compared.
//     New refuses (ErrState or ErrGrant) unless Deps.Receipts is a GenesisReporter whose Genesis()
//     is exactly the pin.
//  4. The journal anchor. Deps.Journal is required (nil is ErrDeps). Each admitted launch appends
//     one event on JournalStream, of type JournalLaunchType, whose Data is the Receipt's JSON; a
//     refused launch appends none. The receipts in the trailing hour and the journal's launch
//     records in the trailing hour must agree in number before a launch is admitted: a mismatch
//     either way is ErrState, nothing execs, and the lease is not consumed. A failed journal
//     append never execs.
//
// Earlier rounds change in one place: pinned(g, d) also calls r7Pinned, which pins the env and the
// TMPDIR roots to fixture values, sets ReceiptGenesis to the sink's own, and hands every launcher
// on the same receipt sink the same in-memory journal. The r6 StateIsPinned positive case now
// builds through pinned. Run: go -C kernel test -count=1 -tags donetest ./internal/launcher/
package launcher

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// The fixture pins: the values earlier rounds already pass (r3, r6), and a TMPDIR root none of
// their State dirs (t.TempDir) lies in.
var r7EnvPins = map[string]string{"HOME": "/h", "CODEX_HOME": "/h/.codex", "PATH": "/usr/bin"}

const (
	r7Tmp         = "/wtmp"
	r7FakeGenesis = "r7-fake-genesis"
)

// The earlier rounds' fake sinks report one genesis; the real log reports its own pin.
func (*r3Log) Genesis() string    { return r7FakeGenesis }
func (*receipts) Genesis() string { return r7FakeGenesis }

// r7Blank is a sink that reports an empty genesis: "" is never a pin, even when the grant's is "".
type r7Blank struct{ *r3Log }

func (r7Blank) Genesis() string { return "" }

// r7Seed gives a pre-seeded receipt log the launch records its shared journal would hold, as the
// launcher that admitted those launches would have written them (r3 RateSurvivesRestart).
func r7Seed(l *r3Log) *r3Log {
	ctx := context.Background()
	v, _ := r7Journals.LoadOrStore(ReceiptSink(l), &memJournal{})
	j := v.(*memJournal)
	for _, rc := range l.got {
		data, err := json.Marshal(rc)
		seq, _, _ := j.Head(ctx, JournalStream)
		if err == nil {
			_, err = j.Append(ctx, journal.Proposal{Stream: JournalStream, ExpectSeq: seq, Type: JournalLaunchType, Data: data})
		}
		if err != nil {
			panic(err)
		}
	}
	return l
}

// r7Journals is the journal of each receipt sink: every launcher on one sink shares one journal,
// as every launcher on one machine shares the Kernel's.
var r7Journals sync.Map

func r7Pinned(g Grant, d Deps) (Grant, Deps) {
	if g.EnvPinned == nil {
		g.EnvPinned = maps.Clone(r7EnvPins)
	}
	if g.TmpRoots == nil {
		g.TmpRoots = []string{r7Tmp}
	}
	if gr, ok := d.Receipts.(GenesisReporter); ok && g.ReceiptGenesis == "" {
		g.ReceiptGenesis = gr.Genesis()
	}
	if d.Journal == nil && d.Receipts != nil {
		j, _ := r7Journals.LoadOrStore(d.Receipts, &memJournal{})
		d.Journal = j.(*memJournal)
	}
	return g, d
}

// memJournal is an in-memory journal.Journal that enforces ExpectSeq like the real one.
type memJournal struct {
	mu        sync.Mutex
	ev        map[string][]journal.Event
	appendErr error
}

func (m *memJournal) Append(_ context.Context, p journal.Proposal) (journal.Event, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.appendErr != nil {
		return journal.Event{}, m.appendErr
	}
	if m.ev == nil {
		m.ev = map[string][]journal.Event{}
	}
	s := m.ev[p.Stream]
	if p.ExpectSeq != uint64(len(s)) {
		return journal.Event{}, fmt.Errorf("%w: expect %d, head %d", journal.ErrSeqConflict, p.ExpectSeq, len(s))
	}
	e := journal.Event{Stream: p.Stream, Seq: uint64(len(s)) + 1, Type: p.Type, Data: slices.Clone(p.Data),
		PrevHash: strings.Repeat("0", 64), Hash: fmt.Sprintf("%064x", len(s)+1)}
	m.ev[p.Stream] = append(s, e)
	return e, nil
}

func (m *memJournal) Read(_ context.Context, stream string, from uint64) ([]journal.Event, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []journal.Event
	for _, e := range m.ev[stream] {
		if e.Seq >= from {
			out = append(out, e)
		}
	}
	return out, nil
}

func (m *memJournal) Head(_ context.Context, stream string) (uint64, string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s := m.ev[stream]
	if len(s) == 0 {
		return 0, "", nil
	}
	return s[len(s)-1].Seq, s[len(s)-1].Hash, nil
}

func (m *memJournal) Streams(context.Context) ([]string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	return slices.Sorted(maps.Keys(m.ev)), nil
}

func (m *memJournal) Verify(context.Context) error              { return nil }
func (m *memJournal) StateHash(context.Context) (string, error) { return "", nil }
func (m *memJournal) PutBlob(context.Context, string, []byte) (journal.BlobRef, error) {
	return "", errors.New("memJournal: no blobs")
}
func (m *memJournal) GetBlob(context.Context, string, journal.BlobRef) ([]byte, error) {
	return nil, journal.ErrBlobNotFound
}
func (m *memJournal) Close() error { return nil }

// launches returns the launch records on JournalStream.
func launches(t *testing.T, j journal.Journal) []Receipt {
	t.Helper()
	evs, err := j.Read(context.Background(), JournalStream, 1)
	if err != nil {
		t.Fatalf("journal Read: %v", err)
	}
	var out []Receipt
	for _, e := range evs {
		if e.Type != JournalLaunchType {
			continue
		}
		var rc Receipt
		if err := json.Unmarshal(e.Data, &rc); err != nil {
			t.Fatalf("launch record %d is not a Receipt's JSON: %v", e.Seq, err)
		}
		out = append(out, rc)
	}
	return out
}

// appendLaunch writes one launch record straight into j, as a bug or a second writer would.
func appendLaunch(t *testing.T, j journal.Journal, rc Receipt) {
	t.Helper()
	ctx := context.Background()
	seq, _, err := j.Head(ctx, JournalStream)
	must(t, err)
	data, err := json.Marshal(rc)
	must(t, err)
	_, err = j.Append(ctx, journal.Proposal{Stream: JournalStream, ExpectSeq: seq, Type: JournalLaunchType, Data: data})
	must(t, err)
}

func resolved(t *testing.T, p string) string {
	t.Helper()
	r, err := filepath.EvalSymlinks(p)
	must(t, err)
	return r
}

func mkdir(t *testing.T, p string) string {
	t.Helper()
	must(t, os.MkdirAll(p, 0o755))
	return p
}

// TestB108_R7_StateOutOfWorkerReach: item 1.
func TestB108_R7_StateOutOfWorkerReach(t *testing.T) {
	type layout struct {
		wt, job, codex string
		tmp            []string
		state          string
	}
	check := func(name string, setup func(base string) layout, wantOK bool) {
		t.Run(name, func(t *testing.T) {
			base := resolved(t, t.TempDir())
			lo := setup(base)
			r := newR4(t, at0300())
			r.state = lo.state
			g := r3Grant()
			g.WorktreeRoot, g.JobRoot, g.TmpRoots = lo.wt, lo.job, lo.tmp
			g.EnvPinned = maps.Clone(r7EnvPins)
			g.EnvPinned["CODEX_HOME"] = lo.codex
			_, err := New(pinned(g, r.deps()))
			switch {
			case wantOK && err != nil:
				t.Errorf("State %s, out of every worker root: %v, want accepted", lo.state, err)
			case !wantOK && !errors.Is(err, ErrGrant):
				t.Errorf("State %s within a worker's reach: %v, want ErrGrant", lo.state, err)
			}
		})
	}
	// def is the accepted layout: every worker root and the State dir are siblings under base.
	def := func(base string) layout {
		return layout{wt: base + "/roots/w", job: base + "/roots/job", codex: base + "/roots/codex",
			tmp: []string{base + "/roots/tmp1", base + "/roots/tmp2"}, state: mkdir(t, base+"/state")}
	}
	with := func(f func(base string, lo *layout)) func(string) layout {
		return func(base string) layout { lo := def(base); f(base, &lo); return lo }
	}
	check("siblings", def, true)
	check("a sibling sharing a name prefix", with(func(b string, lo *layout) {
		lo.state = mkdir(t, b+"/roots/w-state")
	}), true)

	check("inside the worktree root", with(func(b string, lo *layout) { lo.state = mkdir(t, lo.wt+"/s") }), false)
	check("the worktree root itself", with(func(b string, lo *layout) { lo.state = mkdir(t, lo.wt) }), false)
	check("the job-file root itself", with(func(b string, lo *layout) { lo.state = mkdir(t, lo.job) }), false)
	check("inside this job's -o dir", with(func(b string, lo *layout) { lo.state = mkdir(t, lo.job+"/job-1/s") }), false)
	check("inside CODEX_HOME", with(func(b string, lo *layout) { lo.state = mkdir(t, lo.codex+"/s") }), false)
	check("inside the second TMPDIR root", with(func(b string, lo *layout) { lo.state = mkdir(t, lo.tmp[1]+"/s") }), false)

	check("containing the worktree root", with(func(b string, lo *layout) { lo.wt = lo.state + "/w" }), false)
	check("containing the job-file root", with(func(b string, lo *layout) { lo.job = lo.state + "/job" }), false)
	check("containing CODEX_HOME", with(func(b string, lo *layout) { lo.codex = lo.state + "/codex" }), false)
	check("containing a TMPDIR root", with(func(b string, lo *layout) { lo.tmp = append(lo.tmp, lo.state+"/t") }), false)

	check("a symlink into the worktree root", with(func(b string, lo *layout) {
		inner := mkdir(t, lo.wt+"/s")
		must(t, os.Symlink(inner, b+"/link"))
		lo.state = b + "/link"
	}), false)
	check("a worker root that is a symlink to the State dir's parent", with(func(b string, lo *layout) {
		real := mkdir(t, b+"/real")
		must(t, os.Symlink(real, b+"/tlink"))
		lo.tmp = []string{b + "/tlink"}
		lo.state = mkdir(t, real+"/s")
	}), false)
	check("a symlinked worker root whose tail does not exist yet", with(func(b string, lo *layout) {
		real := mkdir(t, b+"/real")
		must(t, os.Symlink(real, b+"/clink"))
		lo.codex = b + "/clink/codex"
		lo.state = mkdir(t, real+"/codex/s")
	}), false)
	check("a worker root under a symlinked parent containing the State dir", with(func(b string, lo *layout) {
		must(t, os.Symlink(lo.state, b+"/slink"))
		lo.wt = b + "/slink/w"
	}), false)
}

// TestB108_R7_EnvTakesOnlyPinnedValues: item 2 (launcher.go:528).
func TestB108_R7_EnvTakesOnlyPinnedValues(t *testing.T) {
	env := func(kv ...string) func(q *Request) {
		return func(q *Request) {
			for i := 0; i < len(kv); i += 2 {
				q.Env[kv[i]] = kv[i+1]
			}
		}
	}
	r4Refused(t, "every pinned name at its pin", r3Grant(), env("HOME", "/h", "CODEX_HOME", "/h/.codex", "PATH", "/usr/bin"), nil)
	r4Refused(t, "LANG is not pinned", r3Grant(), env("LANG", "en_US.UTF-8"), nil)
	for _, c := range [][2]string{
		{"HOME", "/other"}, {"HOME", "/h/"}, {"HOME", "/h/../h"}, {"HOME", ""}, {"HOME", "/h/.codex"},
		{"CODEX_HOME", "/h"}, {"CODEX_HOME", "/h/.codex2"}, {"CODEX_HOME", "/w/job-r4/.codex"},
		{"PATH", "/usr/bin:/bin"}, {"PATH", "/bin"}, {"PATH", "/usr/bin/"}, {"PATH", "/w/job-r4/bin:/usr/bin"},
	} {
		r4Refused(t, c[0]+"="+c[1], r3Grant(), env(c[0], c[1]), ErrSpec)
	}
	for _, name := range []string{"HOME", "CODEX_HOME", "PATH"} {
		g := r3Grant()
		g.EnvPinned = maps.Clone(r7EnvPins)
		delete(g.EnvPinned, name)
		r4Refused(t, name+" with no pin", g, env(name, r7EnvPins[name]), ErrSpec)
	}
	g := r3Grant()
	g.EnvPinned = map[string]string{}
	r4Refused(t, "HOME with an empty pin table", g, env("HOME", "/h"), ErrSpec)
}

// TestB108_R7_ReceiptGenesisChecked: item 3 (launcher.go:191).
func TestB108_R7_ReceiptGenesisChecked(t *testing.T) {
	dir := t.TempDir()
	gA, err := CreateReceiptLog(filepath.Join(dir, "a.log"), "")
	must(t, err)
	gB, err := CreateReceiptLog(filepath.Join(dir, "b.log"), "")
	must(t, err)
	sinkA, err := OpenReceiptLog(filepath.Join(dir, "a.log"), gA)
	must(t, err)

	refused := func(name string, sink ReceiptSink, pin string, hide bool) {
		r := newR4(t, at0300())
		r.sink = sink
		g, d := pinned(r3Grant(), r.deps())
		g.ReceiptGenesis = pin
		if hide {
			d.Receipts = struct{ ReceiptSink }{sink}
		}
		_, err := New(g, d)
		if !errors.Is(err, ErrState) && !errors.Is(err, ErrGrant) {
			t.Errorf("%s: New %v, want ErrState or ErrGrant", name, err)
		}
	}
	refused("another log's genesis", sinkA, gB, false)
	refused("no pin", sinkA, "", false)
	refused("the pin with one byte dropped", sinkA, gA[:len(gA)-1], false)
	refused("the pin upper-cased", sinkA, strings.ToUpper(gA), false)
	refused("a sink that reports no genesis", sinkA, gA, true)
	refused("a fake sink under another pin", &r3Log{}, gA, false)
	refused("an empty genesis matching an empty pin", r7Blank{&r3Log{}}, "", false)

	r := newR4(t, at0300())
	r.sink = sinkA
	g, d := pinned(r3Grant(), r.deps())
	g.ReceiptGenesis = gA
	l, err := New(g, d)
	if err != nil {
		t.Fatalf("New on the pinned genesis: %v", err)
	}
	if err := launchErr(l, r.req("job-g", r.lease("job-g", 1))); err != nil {
		t.Errorf("a launch on the pinned genesis: %v", err)
	}
	if got, err := sinkA.Since(time.Time{}); err != nil || len(got) != 1 {
		t.Errorf("receipts on the pinned log: %d, %v; want 1", len(got), err)
	}
}

// TestB108_R7_JournalAnchor: item 4.
func TestB108_R7_JournalAnchor(t *testing.T) {
	ctx := context.Background()

	t.Run("the journal is required", func(t *testing.T) {
		r := newR4(t, at0300())
		g, d := pinned(r3Grant(), r.deps())
		d.Journal = nil
		if _, err := New(g, d); !errors.Is(err, ErrDeps) {
			t.Errorf("New with no journal: %v, want ErrDeps", err)
		}
	})

	t.Run("one launch record per admitted launch, on the real journal", func(t *testing.T) {
		j, err := journal.Open(filepath.Join(t.TempDir(), "journal.db"))
		if err != nil {
			t.Fatalf("journal.Open: %v", err)
		}
		t.Cleanup(func() { j.Close() })
		r := newR4(t, at0300())
		d := r.deps()
		d.Journal = j
		g := r3Grant()
		g.Caps.PerHour = 2
		l, err := New(pinned(g, d))
		if err != nil {
			t.Fatalf("New: %v", err)
		}
		var want []Receipt
		for _, job := range []string{"job-a", "job-b"} {
			rc, err := l.Launch(ctx, r.req(job, r.lease(job, 1)))
			if err != nil {
				t.Fatalf("%s: %v", job, err)
			}
			want = append(want, rc)
			r.clock.t = r.clock.t.Add(time.Minute)
		}
		q := r.req("job-c", r.lease("job-c", 1))
		q.Argv[index(claudeTokens, "<forbidden>")] = "Read"
		if err := launchErr(l, q); !errors.Is(err, ErrSpec) {
			t.Errorf("job-c, a refused slot: %v, want ErrSpec", err)
		}
		if err := launchErr(l, r.req("job-d", r.lease("job-d", 1))); !errors.Is(err, ErrRateCap) {
			t.Errorf("job-d, over the per-hour cap: %v, want ErrRateCap", err)
		}
		got := launches(t, j)
		if len(got) != len(want) {
			t.Fatalf("%d launch records for %d admitted launches (and 2 refused)", len(got), len(want))
		}
		for i := range want {
			if got[i].JobID != want[i].JobID || !got[i].At.Equal(want[i].At) || got[i].Template != want[i].Template {
				t.Errorf("launch record %d is %+v; want the Receipt %+v", i, got[i], want[i])
			}
		}
		if err := j.Verify(ctx); err != nil {
			t.Errorf("journal Verify: %v", err)
		}
	})

	// mismatch runs one launch, breaks the agreement with skew, and expects the next refused.
	mismatch := func(name string, skew func(t *testing.T, r *r4Rig, j *memJournal, d *Deps)) {
		t.Run(name, func(t *testing.T) {
			r := newR4(t, at0300())
			j := &memJournal{}
			d := r.deps()
			d.Journal = j
			l, err := New(pinned(r3Grant(), d))
			if err != nil {
				t.Fatalf("New: %v", err)
			}
			if err := launchErr(l, r.req("job-a", r.lease("job-a", 1))); err != nil {
				t.Fatalf("job-a: %v", err)
			}
			if n := len(launches(t, j)); n != 1 {
				t.Fatalf("%d launch records after one launch; want 1", n)
			}
			r.clock.t = r.clock.t.Add(time.Minute)
			skew(t, r, j, &d)
			if l2, err := New(pinned(r3Grant(), d)); err == nil {
				l = l2
			} else if !errors.Is(err, ErrState) {
				t.Fatalf("New after the skew: %v, want accepted or ErrState", err)
			} else {
				return // refused at New: fail closed
			}
			lb := r.lease("job-b", 1)
			if err := launchErr(l, r.req("job-b", lb)); !errors.Is(err, ErrState) || r.exec.n() != 1 {
				t.Errorf("a launch after the receipt log and the journal disagree: %v with %d execs, want ErrState and 1", err, r.exec.n())
			}
			if r.leases.isConsumed("job-b", lb) {
				t.Error("a launch refused for the mismatch consumed its lease")
			}
		})
	}
	mismatch("a receipt the journal lacks", func(t *testing.T, r *r4Rig, _ *memJournal, _ *Deps) {
		must(t, r.sink.Append(Receipt{JobID: "ghost", Binary: claudeBin, At: r.clock.t}))
	})
	mismatch("a launch record the receipt log lacks", func(t *testing.T, r *r4Rig, j *memJournal, _ *Deps) {
		appendLaunch(t, j, Receipt{JobID: "ghost", Binary: claudeBin, At: r.clock.t})
	})
	mismatch("a restart on an empty journal", func(_ *testing.T, _ *r4Rig, _ *memJournal, d *Deps) {
		d.Journal = &memJournal{}
	})
	mismatch("a restart on an emptied receipt log", func(_ *testing.T, r *r4Rig, _ *memJournal, d *Deps) {
		r.sink = &r3Log{}
		d.Receipts = r.sink
	})

	t.Run("a failed journal append never execs", func(t *testing.T) {
		r := newR4(t, at0300())
		d := r.deps()
		d.Journal = &memJournal{appendErr: errors.New("disk full")}
		l, err := New(pinned(r3Grant(), d))
		if err != nil {
			t.Fatalf("New: %v", err)
		}
		if err := launchErr(l, r.req("job-a", r.lease("job-a", 1))); err == nil || r.exec.n() != 0 {
			t.Errorf("a launch whose journal append failed: %v with %d execs, want refused and none", err, r.exec.n())
		}
	})
}
