package lease

// Plain unit tests for fence.go: the edges the B1-04 done-test does not reach. Every clock is
// injected; nothing sleeps.

import (
	"context"
	"errors"
	"math"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

type fClock struct {
	mu sync.Mutex
	t  time.Time
}

func (c *fClock) now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.t
}

func (c *fClock) advance(d time.Duration) {
	c.mu.Lock()
	c.t = c.t.Add(d)
	c.mu.Unlock()
}

var fEpoch = time.Date(2026, 10, 1, 9, 0, 0, 0, time.UTC)

func fOpen(t *testing.T) journal.Journal {
	t.Helper()
	j, err := journal.Open(filepath.Join(t.TempDir(), "journal.db"))
	if err != nil {
		t.Fatalf("journal.Open: %v", err)
	}
	t.Cleanup(func() { j.Close() })
	return j
}

func fCoord(t *testing.T, j journal.Journal, clk *fClock) Coordinator {
	t.Helper()
	c, err := NewCoordinator(j, clk.now)
	if err != nil {
		t.Fatalf("NewCoordinator: %v", err)
	}
	return c
}

func fVerifier(t *testing.T, j journal.Journal) Verifier {
	t.Helper()
	v, err := NewRepoVerifier(j)
	if err != nil {
		t.Fatalf("NewRepoVerifier: %v", err)
	}
	return v
}

func fReq(job string, born time.Time, p Policy, res ...string) Request {
	return Request{Job: job, Born: born, Resources: res, Policy: p, TTL: time.Minute}
}

func fGrant(t *testing.T, c Coordinator, r Request) Grant {
	t.Helper()
	g, err := c.Acquire(context.Background(), r)
	if err != nil {
		t.Fatalf("%s Acquire(%v): %v", r.Job, r.Resources, err)
	}
	return g
}

func fWait(t *testing.T, c Coordinator, r Request) {
	t.Helper()
	if _, err := c.Acquire(context.Background(), r); !errors.Is(err, ErrWait) {
		t.Fatalf("%s Acquire(%v): want ErrWait, got %v", r.Job, r.Resources, err)
	}
}

func fHolder(t *testing.T, c Coordinator, r string) string {
	t.Helper()
	l, ok, err := c.Holder(context.Background(), r)
	if err != nil {
		t.Fatalf("Holder(%s): %v", r, err)
	}
	if !ok {
		return ""
	}
	return l.Job
}

func fHead(t *testing.T, j journal.Journal) uint64 {
	t.Helper()
	seq, _, err := j.Head(context.Background(), FenceStream)
	if err != nil {
		t.Fatalf("Head: %v", err)
	}
	return seq
}

const (
	fA = "repo://r/src/a.ts#*"
	fB = "repo://r/src/b.ts#*"
	fC = "repo://r/src/c.ts#*"
	fD = "repo://r/src/d.ts#*"
)

func TestFenceConstructorsRefuseNil(t *testing.T) {
	if _, err := NewCoordinator(nil, time.Now); err == nil {
		t.Fatal("NewCoordinator(nil journal) accepted")
	}
	if _, err := NewCoordinator(fOpen(t), nil); err == nil {
		t.Fatal("NewCoordinator(nil clock) accepted")
	}
	if _, err := NewRepoVerifier(nil); err == nil {
		t.Fatal("NewRepoVerifier(nil) accepted")
	}
}

// A malformed request is refused before anything is written, and is never mistaken for a wait.
func TestFenceAcquireRefusesMalformedRequests(t *testing.T) {
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	c := fCoord(t, j, clk)
	ok := fReq("job_1", fEpoch, AllOrNothing, fA)
	for name, mut := range map[string]func(r *Request){
		"no job":        func(r *Request) { r.Job = "" },
		"slash in job":  func(r *Request) { r.Job = "a/b" },
		"zero born":     func(r *Request) { r.Born = time.Time{} },
		"no policy":     func(r *Request) { r.Policy = "" },
		"bad policy":    func(r *Request) { r.Policy = "wait_die" },
		"no resources":  func(r *Request) { r.Resources = nil },
		"duplicate":     func(r *Request) { r.Resources = []string{fA, fB, fA} },
		"empty uri":     func(r *Request) { r.Resources = []string{""} },
		"no scheme":     func(r *Request) { r.Resources = []string{"src/a.ts#*"} },
		"empty path":    func(r *Request) { r.Resources = []string{"repo://"} },
		"control char":  func(r *Request) { r.Resources = []string{"repo://r/a\n.ts"} },
		"bad utf8":      func(r *Request) { r.Resources = []string{"repo://r/\xff"} },
		"zero ttl":      func(r *Request) { r.TTL = 0 },
		"negative ttl":  func(r *Request) { r.TTL = -time.Second },
		"overflown ttl": func(r *Request) { r.TTL = time.Duration(math.MaxInt64) },
	} {
		r := ok
		r.Resources = append([]string(nil), ok.Resources...)
		mut(&r)
		_, err := c.Acquire(context.Background(), r)
		if err == nil || errors.Is(err, ErrWait) {
			t.Errorf("%s: Acquire(%+v) = %v, want a refusal that is not ErrWait", name, r, err)
		}
	}
	if seq := fHead(t, j); seq != 0 {
		t.Fatalf("malformed requests wrote %d events", seq)
	}
	fGrant(t, c, ok) // the control: the unmutated request is fine
}

// A job has one Born; a second Born for the same job is refused rather than silently changing its
// age under wound-wait and the detector.
func TestFenceOneBornPerJob(t *testing.T) {
	j := fOpen(t)
	c := fCoord(t, j, &fClock{t: fEpoch})
	fGrant(t, c, fReq("job_1", fEpoch, WoundWait, fA))
	if _, err := c.Acquire(context.Background(), fReq("job_1", fEpoch.Add(-time.Hour), WoundWait, fB)); err == nil || errors.Is(err, ErrWait) {
		t.Fatalf("a younger-held job re-requested as older: %v, want refused", err)
	}
	fGrant(t, c, fReq("job_2", fEpoch.Add(time.Minute), AllOrNothing, fC))
	fWait(t, c, fReq("job_3", fEpoch.Add(2*time.Minute), AllOrNothing, fC))
	if _, err := c.Acquire(context.Background(), fReq("job_3", fEpoch, AllOrNothing, fD)); err == nil || errors.Is(err, ErrWait) {
		t.Fatalf("a waiting job re-requested with another Born: %v, want refused", err)
	}
}

// Re-requesting a resource the job already holds is not a wait on itself: it is re-granted with a
// higher token, and the earlier token goes stale at storage.
func TestFenceRequestingOwnResourceRegrants(t *testing.T) {
	j := fOpen(t)
	c := fCoord(t, j, &fClock{t: fEpoch})
	v := fVerifier(t, j)
	g1 := fGrant(t, c, fReq("job_1", fEpoch, AllOrNothing, fA))
	g2 := fGrant(t, c, fReq("job_1", fEpoch, AllOrNothing, fA, fB))
	if g2.Tokens[fA] <= g1.Tokens[fA] {
		t.Fatalf("re-grant token %d not above %d", g2.Tokens[fA], g1.Tokens[fA])
	}
	if br, err := c.Detect(context.Background()); err != nil || len(br) != 0 {
		t.Fatalf("Detect = %+v, %v; a job does not wait on itself", br, err)
	}
	if err := v.Receive(context.Background(), Push{Job: "job_1", Tokens: g1.Tokens, Touched: []string{fA}}); !errors.Is(err, ErrStaleToken) {
		t.Fatalf("superseded own token: %v, want ErrStaleToken", err)
	}
	if err := v.Receive(context.Background(), Push{Job: "job_1", Tokens: g2.Tokens, Touched: []string{fA, fB}}); err != nil {
		t.Fatalf("current tokens refused: %v", err)
	}
}

// An expired lease is free by the injected clock: Holder stops reporting it and another job is
// granted it with a higher token, without anyone releasing it.
func TestFenceExpiredLeaseIsFree(t *testing.T) {
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	c := fCoord(t, j, clk)
	g1 := fGrant(t, c, fReq("job_1", fEpoch, AllOrNothing, fA))
	clk.advance(time.Minute - time.Nanosecond)
	if h := fHolder(t, c, fA); h != "job_1" {
		t.Fatalf("one nanosecond before expiry A is held by %q", h)
	}
	fWait(t, c, fReq("job_2", fEpoch.Add(time.Second), AllOrNothing, fA))
	clk.advance(time.Nanosecond)
	if h := fHolder(t, c, fA); h != "" {
		t.Fatalf("at expiry A is still held by %q", h)
	}
	g2 := fGrant(t, c, fReq("job_2", fEpoch.Add(time.Second), AllOrNothing, fA))
	if g2.Tokens[fA] <= g1.Tokens[fA] {
		t.Fatalf("token %d not above the expired %d", g2.Tokens[fA], g1.Tokens[fA])
	}
}

// Wound-wait wounds only a STRICTLY younger holder, and only on the resources requested: the
// wounded job keeps everything else it holds.
func TestFenceWoundWaitEdges(t *testing.T) {
	j := fOpen(t)
	c := fCoord(t, j, &fClock{t: fEpoch})
	v := fVerifier(t, j)
	gy := fGrant(t, c, fReq("young", fEpoch.Add(time.Minute), WoundWait, fA, fB))
	fGrant(t, c, fReq("old", fEpoch, WoundWait, fA))
	if h := fHolder(t, c, fB); h != "young" {
		t.Fatalf("wounding A also took B: held by %q", h)
	}
	if err := v.Receive(context.Background(), Push{Job: "young", Tokens: gy.Tokens, Touched: []string{fB}}); err != nil {
		t.Fatalf("young's unwounded B refused: %v", err)
	}

	fGrant(t, c, fReq("twin_1", fEpoch.Add(time.Hour), WoundWait, fC))
	fWait(t, c, fReq("twin_2", fEpoch.Add(time.Hour), WoundWait, fC))
	if h := fHolder(t, c, fC); h != "twin_1" {
		t.Fatalf("an equal Born wounded: C held by %q", h)
	}
}

// Release of a job holding nothing writes nothing; Release removes an expired row too, so the
// verifier stops accepting it.
func TestFenceReleaseEdges(t *testing.T) {
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	c := fCoord(t, j, clk)
	v := fVerifier(t, j)
	if err := c.Release(context.Background(), "nobody"); err != nil {
		t.Fatalf("Release(nobody): %v", err)
	}
	if seq := fHead(t, j); seq != 0 {
		t.Fatalf("a no-op Release wrote %d events", seq)
	}
	g := fGrant(t, c, fReq("job_1", fEpoch, AllOrNothing, fA))
	clk.advance(2 * time.Minute)
	if err := c.Release(context.Background(), "job_1"); err != nil {
		t.Fatalf("Release(job_1): %v", err)
	}
	if err := v.Receive(context.Background(), Push{Job: "job_1", Tokens: g.Tokens, Touched: []string{fA}}); !errors.Is(err, ErrStaleToken) {
		t.Fatalf("released expired token: %v, want ErrStaleToken", err)
	}
	if err := c.Release(context.Background(), ""); err == nil {
		t.Fatal("Release(\"\") accepted")
	}
}

// Two disjoint cycles are both broken, each at its own youngest; a two-job cycle is a cycle; and
// a tie in Born goes to the larger job id.
func TestFenceDetectTwoCyclesAndTie(t *testing.T) {
	j := fOpen(t)
	c := fCoord(t, j, &fClock{t: fEpoch})
	same := fEpoch.Add(time.Minute)
	born := map[string]time.Time{"p": fEpoch, "q": fEpoch.Add(time.Second), "x": same, "y": same}
	req := func(job string, res ...string) Request { return fReq(job, born[job], AllOrNothing, res...) }
	fGrant(t, c, req("p", fA))
	fGrant(t, c, req("q", fB))
	fGrant(t, c, req("x", fC))
	fGrant(t, c, req("y", fD))
	fWait(t, c, req("p", fB))
	fWait(t, c, req("q", fA))
	fWait(t, c, req("x", fD))
	fWait(t, c, req("y", fC))
	br, err := c.Detect(context.Background())
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	victims := map[string]bool{}
	for _, b := range br {
		victims[b.Victim] = true
		if len(b.Cycle) != 2 {
			t.Errorf("break %+v: want a two-job cycle", b)
		}
	}
	if len(br) != 2 || !victims["q"] || !victims["y"] {
		t.Fatalf("Detect = %+v, want victims q (younger) and y (tie, larger id)", br)
	}
	for _, r := range []string{fB, fD} {
		if h := fHolder(t, c, r); h != "" {
			t.Fatalf("victim's %s still held by %q", r, h)
		}
	}
	if _, ok, _ := c.Waiting(context.Background(), "q"); ok {
		t.Fatal("victim q still waits")
	}
	if w, ok, _ := c.Waiting(context.Background(), "p"); !ok || len(w) != 1 || w[0] != fB {
		t.Fatalf("survivor p's wait = %v, %v; a broken cycle leaves the survivor's wait", w, ok)
	}
}

// Two Coordinators detecting the same cycle at once break it once between them.
func TestFenceConcurrentDetectBreaksOnce(t *testing.T) {
	for i := 0; i < 30; i++ {
		j := fOpen(t)
		clk := &fClock{t: fEpoch}
		cs := []Coordinator{fCoord(t, j, clk), fCoord(t, j, clk)}
		fGrant(t, cs[0], fReq("p", fEpoch, AllOrNothing, fA))
		fGrant(t, cs[0], fReq("q", fEpoch.Add(time.Second), AllOrNothing, fB))
		fWait(t, cs[0], fReq("p", fEpoch, AllOrNothing, fB))
		fWait(t, cs[0], fReq("q", fEpoch.Add(time.Second), AllOrNothing, fA))
		var wg sync.WaitGroup
		got := make([][]Break, 2)
		errs := make([]error, 2)
		for k := range cs {
			wg.Add(1)
			go func(k int) {
				defer wg.Done()
				got[k], errs[k] = cs[k].Detect(context.Background())
			}(k)
		}
		wg.Wait()
		if errs[0] != nil || errs[1] != nil {
			t.Fatalf("Detect errors: %v, %v", errs[0], errs[1])
		}
		if n := len(got[0]) + len(got[1]); n != 1 {
			t.Fatalf("round %d: %d breaks between two detectors (%+v, %+v), want 1", i, n, got[0], got[1])
		}
	}
}

// The verifier: a glob covers only below its directory; a stale exact lease is excused by a current
// covering glob; a non-repo:// touched resource is refused without either sentinel; duplicates in
// Touched are named once.
func TestFenceVerifierEdges(t *testing.T) {
	j := fOpen(t)
	c := fCoord(t, j, &fClock{t: fEpoch})
	v := fVerifier(t, j)
	ctx := context.Background()
	const glob, inside, beside = "repo://r/src/**", "repo://r/src/deep/x.ts#f", "repo://r/srcx/y.ts#f"
	gOld := fGrant(t, c, fReq("job_1", fEpoch, AllOrNothing, inside))
	g := fGrant(t, c, fReq("job_1", fEpoch, AllOrNothing, glob, inside))

	if err := v.Receive(ctx, Push{Job: "job_1", Tokens: g.Tokens, Touched: []string{inside}}); err != nil {
		t.Fatalf("current tokens refused: %v", err)
	}
	mixed := map[string]uint64{glob: g.Tokens[glob], inside: gOld.Tokens[inside]}
	if err := v.Receive(ctx, Push{Job: "job_1", Tokens: mixed, Touched: []string{inside}}); err != nil {
		t.Fatalf("a current covering glob did not excuse a stale exact token: %v", err)
	}
	err := v.Receive(ctx, Push{Job: "job_1", Tokens: g.Tokens, Touched: []string{beside, beside, inside}})
	if !errors.Is(err, ErrUndeclared) || errors.Is(err, ErrStaleToken) {
		t.Fatalf("beside the glob: %v, want ErrUndeclared only", err)
	}
	if n := strings.Count(err.Error(), beside); n != 1 {
		t.Fatalf("refusal names %s %d times: %v", beside, n, err)
	}
	if strings.Contains(err.Error(), inside) {
		t.Fatalf("refusal echoes the accepted %s: %v", inside, err)
	}

	err = v.Receive(ctx, Push{Job: "job_1", Tokens: map[string]uint64{"budget://r/2026-10": 1}, Touched: []string{"budget://r/2026-10"}})
	if err == nil || errors.Is(err, ErrUndeclared) || errors.Is(err, ErrStaleToken) || !strings.Contains(err.Error(), "budget://r/2026-10") {
		t.Fatalf("non-repo:// touched: %v, want a named refusal wrapping neither sentinel", err)
	}
	if err := v.Receive(ctx, Push{Job: "job_1", Tokens: g.Tokens}); err != nil {
		t.Fatalf("a push touching nothing: %v", err)
	}
	if err := v.Receive(ctx, Push{Job: "", Tokens: g.Tokens, Touched: []string{inside}}); err == nil {
		t.Fatal("a push with no Lease-Holder accepted")
	}
}

// A row in the fence stream that this package did not write fails every operation closed.
func TestFenceCorruptStreamFailsClosed(t *testing.T) {
	for name, ev := range map[string]journal.Proposal{
		"unknown type": {Type: "lease.mystery", Data: []byte(`{}`)},
		"bad json":     {Type: TypeGranted, Data: []byte(`{`)},
		"wrong token":  {Type: TypeGranted, Data: []byte(`{"job":"j","resources":["repo://r/a"],"token":7}`)},
		"phantom drop": {Type: TypeJobReleased, Data: []byte(`{"victim":"j","removed":[{"resource":"repo://r/a","job":"j","token":1}]}`)},
	} {
		t.Run(name, func(t *testing.T) {
			j := fOpen(t)
			ev.Stream = FenceStream
			if _, err := j.Append(context.Background(), ev); err != nil {
				t.Fatalf("Append: %v", err)
			}
			c := fCoord(t, j, &fClock{t: fEpoch})
			if _, err := c.Acquire(context.Background(), fReq("job_1", fEpoch, AllOrNothing, fA)); !errors.Is(err, ErrCorrupt) {
				t.Fatalf("Acquire over a corrupt stream: %v, want ErrCorrupt", err)
			}
			if _, _, err := c.Holder(context.Background(), fA); !errors.Is(err, ErrCorrupt) {
				t.Fatalf("Holder over a corrupt stream: %v, want ErrCorrupt", err)
			}
			if err := fVerifier(t, j).Receive(context.Background(), Push{Job: "j", Touched: []string{fA}}); !errors.Is(err, ErrCorrupt) {
				t.Fatalf("Receive over a corrupt stream: %v, want ErrCorrupt", err)
			}
		})
	}
}

// hashLie serves the fence stream with every hash altered once armed, as if the events the cache
// was folded from had been replaced.
type hashLie struct {
	journal.Journal
	mu    sync.Mutex
	armed bool
}

func (h *hashLie) Read(ctx context.Context, s string, from uint64) ([]journal.Event, error) {
	evs, err := h.Journal.Read(ctx, s, from)
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.armed {
		for i := range evs {
			evs[i].Hash = strings.Repeat("0", 64)
		}
	}
	return evs, err
}

// The fold cache is never the authority: if the head it was folded from no longer carries the
// same hash, the Coordinator refuses rather than act on its memory.
func TestFenceCacheRefusesAReplacedHead(t *testing.T) {
	h := &hashLie{Journal: fOpen(t)}
	c := fCoord(t, h, &fClock{t: fEpoch})
	fGrant(t, c, fReq("job_1", fEpoch, AllOrNothing, fA))
	if hd := fHolder(t, c, fA); hd != "job_1" {
		t.Fatalf("A held by %q", hd)
	}
	h.mu.Lock()
	h.armed = true
	h.mu.Unlock()
	if _, _, err := c.Holder(context.Background(), fA); !errors.Is(err, ErrCorrupt) {
		t.Fatalf("Holder over a replaced head: %v, want ErrCorrupt", err)
	}
}

// A cancelled context is honoured before anything is written.
func TestFenceCancelledContext(t *testing.T) {
	j := fOpen(t)
	c := fCoord(t, j, &fClock{t: fEpoch})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := c.Acquire(ctx, fReq("job_1", fEpoch, AllOrNothing, fA)); !errors.Is(err, context.Canceled) {
		t.Fatalf("Acquire: %v, want context.Canceled", err)
	}
	if seq := fHead(t, j); seq != 0 {
		t.Fatalf("a cancelled Acquire wrote %d events", seq)
	}
}
