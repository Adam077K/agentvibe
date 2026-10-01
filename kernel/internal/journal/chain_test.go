package journal

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"testing"
)

// Unit tests for B1-01b behaviour the frozen done-tests do not reach: a row edited while the
// Journal is held, the bystander rule, and blob integrity. They edit through the store's own
// connection, which is the closest in-process stand-in for a second hand on the file.

func openTestStore(t *testing.T) (*store, string) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "journal.db")
	j, err := Open(path)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { j.Close() })
	return j.(*store), path
}

func fill(t *testing.T, s *store, stream string, n int) {
	t.Helper()
	ctx := context.Background()
	for i := 0; i < n; i++ {
		seq, _, err := s.Head(ctx, stream)
		if err != nil {
			t.Fatalf("Head(%s): %v", stream, err)
		}
		if _, err := s.Append(ctx, Proposal{Stream: stream, ExpectSeq: seq, Type: "t", Data: []byte(fmt.Sprintf("%s-%d", stream, i))}); err != nil {
			t.Fatalf("Append(%s): %v", stream, err)
		}
	}
}

func exec(t *testing.T, s *store, q string, args ...any) {
	t.Helper()
	if _, err := s.conn.ExecContext(context.Background(), q, args...); err != nil {
		t.Fatalf("%s: %v", q, err)
	}
}

func TestInSessionEditIsRefusedAndBystanderServed(t *testing.T) {
	ctx := context.Background()
	s, _ := openTestStore(t)
	fill(t, s, "a", 5)
	fill(t, s, "b", 3)
	exec(t, s, `UPDATE events SET data = ? WHERE stream = 'a' AND seq = 3`, []byte("edited"))

	if _, err := s.Read(ctx, "a", 2); !errors.Is(err, ErrChainBroken) {
		t.Fatalf("Read of an edited range: %v, want ErrChainBroken", err)
	}
	// Once recorded, every path refuses the stream, even a read that would skip the edited row.
	if _, err := s.Read(ctx, "a", 5); !errors.Is(err, ErrChainBroken) {
		t.Fatalf("Read after the stream was refused: %v, want ErrChainBroken", err)
	}
	if _, _, err := s.Head(ctx, "a"); !errors.Is(err, ErrChainBroken) {
		t.Fatalf("Head of a broken stream: %v, want ErrChainBroken", err)
	}
	if _, err := s.Append(ctx, Proposal{Stream: "a", ExpectSeq: 5, Type: "t"}); !errors.Is(err, ErrChainBroken) {
		t.Fatalf("Append to a broken stream: %v, want ErrChainBroken", err)
	}
	if _, err := s.StateHash(ctx); !errors.Is(err, ErrChainBroken) {
		t.Fatalf("StateHash with a broken stream: %v, want ErrChainBroken", err)
	}
	if err := s.Verify(ctx); !errors.Is(err, ErrChainBroken) {
		t.Fatalf("Verify: %v, want ErrChainBroken", err)
	}
	evs, err := s.Read(ctx, "b", 1)
	if err != nil || len(evs) != 3 {
		t.Fatalf("bystander Read: %d events, %v", len(evs), err)
	}
	if _, err := s.Append(ctx, Proposal{Stream: "b", ExpectSeq: 3, Type: "t"}); err != nil {
		t.Fatalf("bystander Append: %v", err)
	}
}

func TestHeadRewriteCaughtByAppend(t *testing.T) {
	ctx := context.Background()
	s, _ := openTestStore(t)
	fill(t, s, "a", 3)
	// Rewrite the head consistently with itself: new data and a matching hash. Only the verified
	// head held in memory can tell.
	h, err := eventHash("a", 3, "t", []byte("forged"), mustPrev(t, s, "a", 3))
	if err != nil {
		t.Fatal(err)
	}
	exec(t, s, `UPDATE events SET data = ?, hash = ? WHERE stream = 'a' AND seq = 3`, []byte("forged"), h)
	if _, err := s.Append(ctx, Proposal{Stream: "a", ExpectSeq: 3, Type: "t"}); !errors.Is(err, ErrChainBroken) {
		t.Fatalf("Append over a rewritten head: %v, want ErrChainBroken", err)
	}
}

func mustPrev(t *testing.T, s *store, stream string, seq int) string {
	t.Helper()
	var prev string
	if err := s.conn.QueryRowContext(context.Background(), `SELECT prev_hash FROM events WHERE stream = ? AND seq = ?`, stream, seq).Scan(&prev); err != nil {
		t.Fatal(err)
	}
	return prev
}

func TestVerifyCatchesTruncationAndInjection(t *testing.T) {
	ctx := context.Background()
	s, _ := openTestStore(t)
	fill(t, s, "a", 4)
	fill(t, s, "b", 2)
	exec(t, s, `DELETE FROM events WHERE stream = 'a' AND seq = 4`) // a valid chain, one shorter
	h, _ := eventHash("c", 1, "t", nil, zeroHash)
	exec(t, s, `INSERT INTO events VALUES ('c', 1, 't', x'', ?, ?)`, zeroHash, h) // a valid, unjournaled stream
	if err := s.Verify(ctx); !errors.Is(err, ErrChainBroken) {
		t.Fatalf("Verify: %v, want ErrChainBroken", err)
	}
	for _, st := range []string{"a", "c"} {
		if _, err := s.Read(ctx, st, 1); !errors.Is(err, ErrChainBroken) {
			t.Fatalf("Read(%s): %v, want ErrChainBroken", st, err)
		}
	}
	if _, err := s.Read(ctx, "b", 1); err != nil {
		t.Fatalf("bystander Read: %v", err)
	}
}

func TestReadRanges(t *testing.T) {
	ctx := context.Background()
	s, _ := openTestStore(t)
	fill(t, s, "a", 5)
	for _, c := range []struct {
		from uint64
		n    int
	}{{0, 5}, {1, 5}, {2, 4}, {5, 1}, {6, 0}, {9, 0}} {
		evs, err := s.Read(ctx, "a", c.from)
		if err != nil || len(evs) != c.n {
			t.Fatalf("Read(a, %d): %d events, %v; want %d", c.from, len(evs), err, c.n)
		}
		if c.n > 0 && evs[0].Seq != max(c.from, 1) {
			t.Fatalf("Read(a, %d) starts at seq %d", c.from, evs[0].Seq)
		}
	}
	if evs, err := s.Read(ctx, "none", 1); err != nil || len(evs) != 0 {
		t.Fatalf("Read of an unknown stream: %v, %v", evs, err)
	}
}

func TestBlobIntegrity(t *testing.T) {
	ctx := context.Background()
	s, _ := openTestStore(t)
	ref, err := s.PutBlob(ctx, "v", []byte("payload"))
	if err != nil {
		t.Fatal(err)
	}
	if empty, err := s.PutBlob(ctx, "v", nil); err != nil || empty != blobRef([]byte{}) {
		t.Fatalf("PutBlob(nil) = %q, %v", empty, err)
	}
	if _, err := s.PutBlob(ctx, "", []byte("x")); err == nil {
		t.Fatal("PutBlob with an empty venture succeeded")
	}
	for _, bad := range []BlobRef{"", "sha256:", "SHA256:" + ref[7:], BlobRef(string(ref[:20])), "md5:" + ref[7:]} {
		if _, err := s.GetBlob(ctx, "v", bad); !errors.Is(err, ErrBlobNotFound) {
			t.Fatalf("GetBlob(%q): %v, want ErrBlobNotFound", bad, err)
		}
	}
	exec(t, s, `UPDATE blobs SET data = ? WHERE ref = ?`, []byte("PAYLOAD"), string(ref))
	if _, err := s.GetBlob(ctx, "v", ref); !errors.Is(err, ErrBlobCorrupt) {
		t.Fatalf("GetBlob of altered bytes: %v, want ErrBlobCorrupt", err)
	}
	if _, err := s.PutBlob(ctx, "v", []byte("payload")); !errors.Is(err, ErrBlobCorrupt) {
		t.Fatalf("PutBlob over altered bytes: %v, want ErrBlobCorrupt", err)
	}
}
