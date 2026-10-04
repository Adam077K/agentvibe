//go:build donetest

// B1-08d done-tests, round 2: "2026-10-03 red-team r1 gaps + rulings". Adapted from the red-team's
// proposals on 26000de, plus ruling G16:
//
//	R1 (HIGH) end to end: after a launch, the same lease re-rendered zero-padded is ErrLease, one exec.
//	R7 (MED) Parsing is strict over the whole of GrantStream: an unreadable record below a replayed
//	   valid release fails Live.
//	R8 (LOW) ReleaseGrant and RevokeGrant refuse a malformed digest.
//	G16 (ruling) Live follows the latest TRANSITION: a revoke after any release wins, so nothing is
//	   live until a new grant is released, even when the revoked digest was not the current one.
//
// Run: go -C kernel test -count=1 -tags donetest -run B1_08d ./internal/launcher/
package launcher

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

const d8GrantC = "sha256:" + "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"

// TestB1_08d_R2_NonCanonicalReplayEndToEnd: R1.
func TestB1_08d_R2_NonCanonicalReplayEndToEnd(t *testing.T) {
	r := newD8(t)
	l1, err := r.launcher(t, r.state)
	if err != nil {
		t.Fatal(err)
	}
	c, err := r.claims.ClaimJob(context.Background(), "job-nc", "runner-1", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	ls := lease.FencedLease(c)
	if want := fmt.Sprintf("job://job-nc#%d", c.Token); ls != want {
		t.Fatalf("FencedLease = %q; want the canonical %q", ls, want)
	}
	if err := launchErr(l1, r.req("job-nc", ls)); err != nil {
		t.Fatalf("first launch: %v", err)
	}
	for _, p := range []string{fmt.Sprintf("job://job-nc#0%d", c.Token), fmt.Sprintf("job://job-nc#+%d", c.Token)} {
		other, err := r.launcher(t, t.TempDir())
		if err != nil {
			t.Fatal(err)
		}
		if err := launchErr(other, r.req("job-nc", p)); !errors.Is(err, ErrLease) {
			t.Errorf("replay re-rendered as %q: %v; want ErrLease", p, err)
		}
	}
	if r.exec.n() != 1 {
		t.Errorf("%d execs; a re-rendered lease reached exec", r.exec.n())
	}
}

// TestB1_08d_R2_StrictOverWholeStream: R7.
func TestB1_08d_R2_StrictOverWholeStream(t *testing.T) {
	ctx := context.Background()
	for _, bad := range []struct{ typ, data string }{
		{"policy.revoked", `{"record":"x"}`},
		{"policy.revoked", "not json"},
		{"policy.released", `{}`},
		{"something.else", `{}`},
	} {
		j, _ := d8Journal(t)
		d8Release(t, j, d8GrantA, time.Now().Add(24*time.Hour))
		evs, err := j.Read(ctx, GrantStream, 1)
		if err != nil || len(evs) == 0 {
			t.Fatalf("GrantStream after a release: %d events, %v", len(evs), err)
		}
		h, _, err := j.Head(ctx, GrantStream)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := j.Append(ctx, journal.Proposal{Stream: GrantStream, ExpectSeq: h, Type: bad.typ, Data: []byte(bad.data)}); err != nil {
			t.Fatal(err)
		}
		if _, err := j.Append(ctx, journal.Proposal{Stream: GrantStream, ExpectSeq: h + 1, Type: evs[0].Type, Data: evs[0].Data}); err != nil {
			t.Fatal(err)
		}
		if err := d8Status(t, j, d8GrantA, time.Now).Live(); err == nil {
			t.Errorf("Live with a %q %q record below a valid head: nil; want an error", bad.typ, bad.data)
		}
	}
}

// TestB1_08d_R2_MalformedDigestRefused: R8.
func TestB1_08d_R2_MalformedDigestRefused(t *testing.T) {
	ctx := context.Background()
	j, _ := d8Journal(t)
	for _, d := range []string{"", "sha256:", "sha256:aaaa", strings.ToUpper(d8GrantA), "SHA256:" + strings.TrimPrefix(d8GrantA, "sha256:"),
		strings.TrimPrefix(d8GrantA, "sha256:"), d8GrantA + "a", d8GrantA[:len(d8GrantA)-1] + "g", " " + d8GrantA} {
		if err := ReleaseGrant(ctx, j, d, time.Now().Add(time.Hour)); err == nil {
			t.Errorf("ReleaseGrant(%q): nil; want refused", d)
		}
		if err := RevokeGrant(ctx, j, d); err == nil {
			t.Errorf("RevokeGrant(%q): nil; want refused", d)
		}
	}
	if h, _, err := j.Head(ctx, GrantStream); err != nil || h != 0 {
		t.Errorf("GrantStream head %d (%v) after only refused transitions; want 0", h, err)
	}
	// Control: the well-formed digest is accepted, so the refusals above are about the form.
	if err := ReleaseGrant(ctx, j, d8GrantA, time.Now().Add(time.Hour)); err != nil {
		t.Errorf("ReleaseGrant of a well-formed digest: %v; want nil (control)", err)
	}
	if err := RevokeGrant(ctx, j, d8GrantA); err != nil {
		t.Errorf("RevokeGrant of a well-formed released digest: %v; want nil (control)", err)
	}
}

// TestB1_08d_R2_LatestTransitionWins: G16.
func TestB1_08d_R2_LatestTransitionWins(t *testing.T) {
	ctx := context.Background()
	day := time.Now().Add(24 * time.Hour)
	j, _ := d8Journal(t)
	d8Release(t, j, d8GrantA, day)
	d8Release(t, j, d8GrantB, day)
	if err := d8Status(t, j, d8GrantB, time.Now).Live(); err != nil {
		t.Fatalf("Live for B, the current release: %v (control)", err)
	}
	if err := RevokeGrant(ctx, j, d8GrantA); err != nil {
		t.Fatalf("RevokeGrant(A) after B was released: %v", err)
	}
	for _, d := range []string{d8GrantA, d8GrantB} {
		if err := d8Status(t, j, d, time.Now).Live(); err == nil {
			t.Errorf("Live for %s after a revoke that follows every release: nil; want an error", d[:12])
		}
	}
	d8Release(t, j, d8GrantC, day)
	if err := d8Status(t, j, d8GrantC, time.Now).Live(); err != nil {
		t.Errorf("Live for a new grant C released after the revoke: %v; want nil", err)
	}
}
