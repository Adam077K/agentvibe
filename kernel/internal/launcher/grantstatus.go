// B1-08d: the real GrantStatus. It is not registered in build/done-tests/B1-08d.yml; the done-tests
// that freeze it are grantstatus_donetest_test.go and grantstatus_r2_donetest_test.go.
//
// Where the grant's status lives (09a §4.2 and §8.5): launcher_grant is a Constitution record, a
// signed versioned file; its release reaches the Journal as a policy.released event carrying the
// file digest, and a revocation is an authority transition, whose canonical store is the Journal.
// So the status is the GrantStream of the Kernel's main Journal, read at every Live(). Verifying the
// founder signature on the record is upstream of this type (Grant's doc comment).
package launcher

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"regexp"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// GrantStream is the Journal stream holding the launcher_grant's releases and revocations.
const GrantStream = "policy:launcher_grant"

// Event types of GrantStream.
const (
	grantReleased = "policy.released"
	grantRevoked  = "policy.revoked"
)

// grantMaxAttempts bounds the optimistic retry loop on GrantStream, as lease's maxAttempts does.
const grantMaxAttempts = 64

var grantDigest = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)

// grantRecord is the data of a policy.released or policy.revoked event. Until is the release's
// expiry in Unix nanoseconds; a revocation carries none.
type grantRecord struct {
	Digest string `json:"digest"`
	Until  int64  `json:"until_unix_nano,omitempty"`
}

// grantFold is GrantStream read whole: every digest ever revoked, and its latest transition.
type grantFold struct {
	head    uint64
	revoked map[string]bool
	last    string // type of the latest transition; "" for an empty stream
	rec     grantRecord
}

// foldGrants reads all of GrantStream and parses every record strictly, whatever its position or
// type: one it cannot read, a gap in the seqs, or a read error fails the whole fold.
func foldGrants(ctx context.Context, j journal.Journal) (grantFold, error) {
	evs, err := j.Read(ctx, GrantStream, 1)
	if err != nil {
		return grantFold{}, fmt.Errorf("launcher: read %s: %w", GrantStream, err)
	}
	f := grantFold{revoked: map[string]bool{}}
	for i, ev := range evs {
		if ev.Stream != GrantStream || ev.Seq != uint64(i)+1 {
			return grantFold{}, fmt.Errorf("launcher: %s holds seq %d at position %d", GrantStream, ev.Seq, i+1)
		}
		rec, err := parseGrant(ev)
		if err != nil {
			return grantFold{}, err
		}
		if ev.Type == grantRevoked {
			f.revoked[rec.Digest] = true
		}
		f.head, f.last, f.rec = ev.Seq, ev.Type, rec
	}
	return f, nil
}

// decodeGrant reads data as one JSON object holding only the two keys of grantRecord, spelled
// exactly and each at most once, and nothing after it. encoding/json alone would match keys
// case-insensitively, let the last duplicate win and stop at a trailing "}".
func decodeGrant(data []byte) (grantRecord, error) {
	var rec grantRecord
	dec := json.NewDecoder(bytes.NewReader(data))
	if tok, err := dec.Token(); err != nil || tok != json.Delim('{') {
		return rec, errors.New("not a JSON object")
	}
	seen := map[string]bool{}
	for dec.More() {
		tok, err := dec.Token()
		key, ok := tok.(string)
		if err != nil || !ok || seen[key] {
			return rec, errors.New("bad or repeated key")
		}
		seen[key] = true
		switch key {
		case "digest":
			err = dec.Decode(&rec.Digest)
		case "until_unix_nano":
			err = dec.Decode(&rec.Until)
		default:
			err = fmt.Errorf("unknown key %q", key)
		}
		if err != nil {
			return rec, err
		}
	}
	if tok, err := dec.Token(); err != nil || tok != json.Delim('}') {
		return rec, errors.New("unterminated object")
	}
	if _, err := dec.Token(); err != io.EOF {
		return rec, errors.New("data after the object")
	}
	return rec, nil
}

// parseGrant decodes ev as exactly one of the two records a writer here produces.
func parseGrant(ev journal.Event) (grantRecord, error) {
	rec, err := decodeGrant(ev.Data)
	if err != nil {
		return grantRecord{}, fmt.Errorf("launcher: %s seq %d (%s) is unreadable: %v", GrantStream, ev.Seq, ev.Type, err)
	}
	if !grantDigest.MatchString(rec.Digest) {
		return grantRecord{}, fmt.Errorf("launcher: %s seq %d (%s) names digest %q", GrantStream, ev.Seq, ev.Type, rec.Digest)
	}
	switch {
	case ev.Type == grantReleased && rec.Until > 0, ev.Type == grantRevoked && rec.Until == 0:
		return rec, nil
	default:
		return grantRecord{}, fmt.Errorf("launcher: %s seq %d has type %q with until %d", GrantStream, ev.Seq, ev.Type, rec.Until)
	}
}

// appendGrant appends one record to GrantStream at head, retrying when another writer moved it
// first. prepare sees the fold the write is conditioned on and may refuse.
func appendGrant(ctx context.Context, j journal.Journal, typ string, rec grantRecord, prepare func(grantFold) error) error {
	data, err := json.Marshal(rec)
	if err != nil {
		return err
	}
	for attempt := 0; attempt < grantMaxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return err
		}
		f, err := foldGrants(ctx, j)
		if err != nil {
			return err
		}
		if err := prepare(f); err != nil {
			return err
		}
		_, err = j.Append(ctx, journal.Proposal{Stream: GrantStream, ExpectSeq: f.head, Type: typ, Data: data})
		if errors.Is(err, journal.ErrSeqConflict) {
			continue
		}
		if err != nil {
			return fmt.Errorf("launcher: append %s to %s: %w", typ, GrantStream, err)
		}
		return nil
	}
	return fmt.Errorf("launcher: append %s to %s: gave up after %d contended attempts", typ, GrantStream, grantMaxAttempts)
}

// ReleaseGrant journals the release of the launcher_grant record whose file digest is digest
// ("sha256:" + 64 lowercase hex), live until until. A later release supersedes an earlier one.
// Rulings Q1-Q2 (2026-10-03): until is required and must be in the future; a digest ever revoked
// is refused, forever. A digest that is not "sha256:" + 64 lowercase hex is refused and nothing is
// written (red-team r1).
func ReleaseGrant(ctx context.Context, j journal.Journal, digest string, until time.Time) error {
	if j == nil {
		return errors.New("launcher: nil journal")
	}
	if !grantDigest.MatchString(digest) {
		return fmt.Errorf("launcher: grant digest %q is not sha256: and 64 lowercase hex", digest)
	}
	// The expiry is stored as int64 Unix nanoseconds; a time past that range would wrap.
	if until.IsZero() || !until.After(time.Now()) || !time.Unix(0, until.UnixNano()).Equal(until) {
		return fmt.Errorf("launcher: grant until %v must be a representable time in the future", until)
	}
	rec := grantRecord{Digest: digest, Until: until.UnixNano()}
	return appendGrant(ctx, j, grantReleased, rec, func(f grantFold) error {
		if f.revoked[digest] {
			return fmt.Errorf("launcher: grant %s was revoked and is never released again", digest)
		}
		return nil
	})
}

// RevokeGrant journals the revocation of the released record digest; it binds the next Live().
// Ruling G16 (2026-10-03): a revoke after any release wins, so nothing is live until a new digest
// is released. A malformed digest is refused and nothing is written.
func RevokeGrant(ctx context.Context, j journal.Journal, digest string) error {
	if j == nil {
		return errors.New("launcher: nil journal")
	}
	if !grantDigest.MatchString(digest) {
		return fmt.Errorf("launcher: grant digest %q is not sha256: and 64 lowercase hex", digest)
	}
	return appendGrant(ctx, j, grantRevoked, grantRecord{Digest: digest}, func(grantFold) error { return nil })
}

// NewGrantStatus returns the status of the grant whose record digest the launcher holds. Live()
// reads GrantStream at every call and returns nil only when its latest transition releases exactly
// digest, that digest was never revoked anywhere in the stream, and now() is before that
// release's until. Every record in the stream is parsed strictly, not only the head: one it cannot
// read, of any type at any position, is an error, as is a stream it cannot read. It fails closed.
// Review r1 (2026-10-03): a now() that is the zero time or lies outside the int64 Unix-nanosecond
// range is an error, never compared.
func NewGrantStatus(j journal.Journal, digest string, now func() time.Time) (GrantStatus, error) {
	if j == nil {
		return nil, errors.New("launcher: nil journal")
	}
	if !grantDigest.MatchString(digest) {
		return nil, fmt.Errorf("launcher: grant digest %q is not sha256: and 64 lowercase hex", digest)
	}
	if now == nil {
		return nil, errors.New("launcher: nil clock")
	}
	return &grantStatus{j: j, digest: digest, now: now}, nil
}

type grantStatus struct {
	j      journal.Journal
	digest string
	now    func() time.Time
}

func (g *grantStatus) Live() error {
	// A zero clock, or one past the int64 Unix-nanosecond range, has no meaningful UnixNano and
	// must never read as "before until": refuse it.
	now := g.now()
	if now.IsZero() || !time.Unix(0, now.UnixNano()).Equal(now) {
		return fmt.Errorf("launcher: clock %v is zero or outside the representable range", now)
	}
	f, err := foldGrants(context.Background(), g.j)
	if err != nil {
		return err
	}
	switch {
	case f.last == "":
		return fmt.Errorf("launcher: no grant has been released on %s", GrantStream)
	case f.revoked[g.digest]:
		return fmt.Errorf("launcher: grant %s was revoked", g.digest)
	case f.last != grantReleased:
		return fmt.Errorf("launcher: the latest transition on %s is a revocation", GrantStream)
	case f.rec.Digest != g.digest:
		return fmt.Errorf("launcher: grant %s is not the released grant %s", g.digest, f.rec.Digest)
	case now.UnixNano() >= f.rec.Until:
		return fmt.Errorf("launcher: grant %s expired at %s", g.digest, time.Unix(0, f.rec.Until).UTC().Format(time.RFC3339Nano))
	}
	return nil
}
