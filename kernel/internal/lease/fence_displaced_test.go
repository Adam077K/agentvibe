package lease

// Plain unit tests for the Displaced half of the grant event (LC-2 ship-review LOWs): the fold judges
// a displaced row by the predicate Acquire used, and a grant that displaces is journaled under its
// own event type, so a binary that predates it fails closed instead of ignoring the field.

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// craft appends a hand-built grant event over a journal whose seq-1 grant is job_1's lease on lib,
// with displaced naming that lease, and returns the Coordinator that folds it.
func craftDisplace(t *testing.T, typ, granted string) (Coordinator, error) {
	t.Helper()
	const lib = "repo://a/lib/x.ts#f"
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	c := fCoord(t, j, clk)
	g := fGrant(t, c, fReq("job_1", fEpoch, AllOrNothing, lib))
	data, err := json.Marshal(grantedData{Job: "job_2", Born: fEpoch.UnixNano(), Policy: AllOrNothing,
		Resources: []string{granted}, ExpiresAt: fEpoch.Add(time.Minute).UnixNano(), Token: 2,
		Displaced: []held{{Resource: lib, Job: "job_1", Token: g.Tokens[lib]}}})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := j.Append(context.Background(), journal.Proposal{Stream: FenceStream, ExpectSeq: 1, Type: typ, Data: data}); err != nil {
		t.Fatalf("Append: %v", err)
	}
	_, _, err = c.Holder(context.Background(), lib)
	return c, err
}

// A displaced row that overlaps nothing the grant takes is refused: a crafted event may not delete
// another job's unrelated live lease.
func TestFenceFoldRefusesDisplacedRowThatDoesNotOverlap(t *testing.T) {
	if _, err := craftDisplace(t, TypeGrantedDisplacing, "repo://a/src/y.ts#g"); !errors.Is(err, ErrCorrupt) {
		t.Fatalf("fold of a grant displacing an unrelated lease: %v, want ErrCorrupt", err)
	}
	// Positive control: the same event over an overlapping resource is accepted and the row is gone.
	c, err := craftDisplace(t, TypeGrantedDisplacing, "repo://a/lib/**")
	if err != nil {
		t.Fatalf("fold of a grant displacing an overlapping lease: %v", err)
	}
	if h := fHolder(t, c, "repo://a/lib/x.ts#f"); h != "" {
		t.Fatalf("displaced row still held by %q", h)
	}
	if h := fHolder(t, c, "repo://a/lib/**"); h != "job_2" {
		t.Fatalf("grant held by %q, want job_2", h)
	}
}

// The event type says whether a grant displaces: a plain grant carrying Displaced, and a displacing
// grant carrying none, are both refused.
func TestFenceFoldDisplacedFollowsEventType(t *testing.T) {
	if _, err := craftDisplace(t, TypeGranted, "repo://a/lib/**"); !errors.Is(err, ErrCorrupt) {
		t.Fatalf("lease.granted carrying Displaced: %v, want ErrCorrupt", err)
	}
	j := fOpen(t)
	data := []byte(`{"job":"job_1","born_unix_nano":1,"resources":["repo://r/a.ts#f"],"expires_at_unix_nano":9,"token":1}`)
	if _, err := j.Append(context.Background(), journal.Proposal{Stream: FenceStream, Type: TypeGrantedDisplacing, Data: data}); err != nil {
		t.Fatal(err)
	}
	if _, _, err := fCoord(t, j, &fClock{t: fEpoch}).Holder(context.Background(), "repo://r/a.ts#f"); !errors.Is(err, ErrCorrupt) {
		t.Fatalf("displacing grant carrying no Displaced: %v, want ErrCorrupt", err)
	}
}

// preLC2Types are the event types of a fold that predates LC-2. Its apply refuses any other type as
// "unknown event type" (TestFenceCorruptStreamFailsClosed pins that path), so a grant journaled under
// a type outside this set cannot be folded by it. Journals written without displacement hold only
// these types and replay identically.
var preLC2Types = map[string]bool{
	"lease.granted": true, "lease.waited": true, "lease.job_released": true,
	"lease.deadlock_broken": true, "lease.starved": true, "lease.hot_added": true,
}

func fenceTypes(t *testing.T, c Coordinator, j journal.Journal) map[string]int {
	t.Helper()
	evs, err := j.Read(context.Background(), FenceStream, 1)
	if err != nil {
		t.Fatal(err)
	}
	out := map[string]int{}
	for _, ev := range evs {
		out[ev.Type]++
	}
	return out
}

func TestFenceDisplacingGrantHasItsOwnEventType(t *testing.T) {
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	c := fCoord(t, j, clk)
	// No displacement, including a wound of an identical name: only pre-LC-2 types, replayed as before.
	fGrant(t, c, fReq("young", fEpoch.Add(time.Hour), WoundWait, "repo://a/x.ts#f"))
	fGrant(t, c, fReq("old", fEpoch, WoundWait, "repo://a/x.ts#f"))
	for typ := range fenceTypes(t, c, j) {
		if !preLC2Types[typ] {
			t.Fatalf("a grant that displaces nothing was journaled as %q", typ)
		}
	}
	if h := fHolder(t, fCoord(t, j, clk), "repo://a/x.ts#f"); h != "old" {
		t.Fatalf("replay: held by %q, want old", h)
	}
	// Displacement: a wound of an overlapping lease, and an expired overlapping one.
	fGrant(t, c, fReq("young2", fEpoch.Add(time.Hour), WoundWait, "repo://a/src/y.ts#g"))
	fGrant(t, c, fReq("old2", fEpoch, WoundWait, "repo://a/src/**"))
	fGrant(t, c, fReq("exp", fEpoch, AllOrNothing, "repo://a/lib/**"))
	clk.advance(2 * time.Minute)
	fGrant(t, c, fReq("next", fEpoch, AllOrNothing, "repo://a/lib/z.ts#f"))
	n := fenceTypes(t, c, j)[TypeGrantedDisplacing]
	if n != 2 {
		t.Fatalf("%d grants journaled as %q, want 2 (the wound and the reclaim)", n, TypeGrantedDisplacing)
	}
	if preLC2Types[TypeGrantedDisplacing] {
		t.Fatalf("%q is a type a pre-LC-2 fold knows, so it would not fail closed", TypeGrantedDisplacing)
	}
	if h := fHolder(t, fCoord(t, j, clk), "repo://a/src/y.ts#g"); h != "" {
		t.Fatalf("replay: displaced row held by %q", h)
	}
}
