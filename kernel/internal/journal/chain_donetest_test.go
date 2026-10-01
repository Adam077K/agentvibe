//go:build donetest

// B1-01b done-test, frozen by B0-17a (docs/vision-v3/14-BUILD-PLAN.md §6): "State hash reproduced
// on rebuild; a tampered row breaks the chain and is refused". Hash-registered in
// build/done-tests/B0-17a.yml. Shares TestMain and helpers with core_donetest_test.go.
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/journal/
package journal_test

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"testing"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

var hexHash = regexp.MustCompile(`^[0-9a-f]{64}$`)

// The frozen formulas from api.go, recomputed here independently of the implementation.
func u64(b *bytes.Buffer, n uint64) { binary.Write(b, binary.BigEndian, n) }

func rawHash(t *testing.T, h string) []byte {
	t.Helper()
	r, err := hex.DecodeString(h)
	if err != nil || len(r) != 32 {
		t.Fatalf("%q is not a 32-byte hex hash", h)
	}
	return r
}

func wantEventHash(t *testing.T, stream string, seq uint64, typ string, data []byte, prev string) string {
	t.Helper()
	var b bytes.Buffer
	b.WriteString("avk.event.v1\n")
	u64(&b, uint64(len(stream)))
	b.WriteString(stream)
	u64(&b, seq)
	u64(&b, uint64(len(typ)))
	b.WriteString(typ)
	u64(&b, uint64(len(data)))
	b.Write(data)
	b.Write(rawHash(t, prev))
	sum := sha256.Sum256(b.Bytes())
	return hex.EncodeToString(sum[:])
}

func wantStateHash(t *testing.T, j journal.Journal) string {
	t.Helper()
	ctx := context.Background()
	streams, err := j.Streams(ctx)
	if err != nil {
		t.Fatalf("Streams: %v", err)
	}
	if !sort.StringsAreSorted(streams) {
		t.Fatalf("Streams() not sorted: %v", streams)
	}
	var b bytes.Buffer
	b.WriteString("avk.state.v1\n")
	for _, s := range streams {
		seq, h, err := j.Head(ctx, s)
		if err != nil {
			t.Fatalf("Head(%s): %v", s, err)
		}
		u64(&b, uint64(len(s)))
		b.WriteString(s)
		u64(&b, seq)
		b.Write(rawHash(t, h))
	}
	sum := sha256.Sum256(b.Bytes())
	return hex.EncodeToString(sum[:])
}

// checkChain recomputes every event's hash from its content and predecessor, and StateHash from
// the heads. An implementation cannot pass with a hash that ignores content or history.
func checkChain(t *testing.T, j journal.Journal) {
	t.Helper()
	ctx := context.Background()
	streams, err := j.Streams(ctx)
	if err != nil {
		t.Fatalf("Streams: %v", err)
	}
	for _, s := range streams {
		evs, err := j.Read(ctx, s, 1)
		if err != nil {
			t.Fatalf("Read(%s): %v", s, err)
		}
		prev := strings.Repeat("0", 64)
		for _, e := range evs {
			if e.PrevHash != prev {
				t.Fatalf("%s seq %d: prev_hash %s, want %s", s, e.Seq, e.PrevHash, prev)
			}
			if want := wantEventHash(t, s, e.Seq, e.Type, e.Data, prev); e.Hash != want {
				t.Fatalf("%s seq %d: hash %s, the frozen formula gives %s", s, e.Seq, e.Hash, want)
			}
			prev = e.Hash
		}
	}
	got, err := j.StateHash(ctx)
	if err != nil {
		t.Fatalf("StateHash: %v", err)
	}
	if want := wantStateHash(t, j); got != want {
		t.Fatalf("StateHash %s, the frozen formula gives %s", got, want)
	}
}

// buildJournal writes datas to stream "s" of a fresh Journal and returns its head hash and
// StateHash.
func buildJournal(t *testing.T, datas ...string) (head, state string) {
	t.Helper()
	ctx := context.Background()
	j := openOrFail(t, filepath.Join(t.TempDir(), "journal.db"))
	defer j.Close()
	appendN(t, j, "s", len(datas), func(i int) []byte { return []byte(datas[i]) })
	checkChain(t, j)
	_, head, err := j.Head(ctx, "s")
	if err != nil {
		t.Fatalf("Head: %v", err)
	}
	if state, err = j.StateHash(ctx); err != nil {
		t.Fatalf("StateHash: %v", err)
	}
	return head, state
}

func TestB1_01b_HistorySensitivity(t *testing.T) {
	baseHead, baseState := buildJournal(t, "one", "two", "three")
	againHead, againState := buildJournal(t, "one", "two", "three")
	if againHead != baseHead || againState != baseState {
		t.Fatalf("identical histories gave different hashes: head %s/%s, state %s/%s", baseHead, againHead, baseState, againState)
	}
	editHead, editState := buildJournal(t, "ONE", "two", "three") // only event 1's Data differs
	if editHead == baseHead || editState == baseState {
		t.Fatalf("changing event 1's Data left head (%v) or StateHash (%v) unchanged", editHead == baseHead, editState == baseState)
	}
	swapHead, swapState := buildJournal(t, "two", "one", "three") // events 1 and 2 reordered
	if swapHead == baseHead || swapState == baseState {
		t.Fatalf("reordering two events left head (%v) or StateHash (%v) unchanged", swapHead == baseHead, swapState == baseState)
	}
}

func appendN(t *testing.T, j journal.Journal, stream string, n int, data func(i int) []byte) {
	t.Helper()
	ctx := context.Background()
	for i := 0; i < n; i++ {
		head, _, err := j.Head(ctx, stream)
		if err != nil {
			t.Fatalf("Head(%s): %v", stream, err)
		}
		if _, err := j.Append(ctx, journal.Proposal{Stream: stream, ExpectSeq: head, Type: "t", Data: data(i)}); err != nil {
			t.Fatalf("Append(%s #%d): %v", stream, i, err)
		}
	}
}

func TestB1_01b_ChainLinks(t *testing.T) {
	ctx := context.Background()
	j := openOrFail(t, filepath.Join(t.TempDir(), "journal.db"))
	defer j.Close()
	for _, s := range []string{"x", "y", "z"} {
		appendN(t, j, s, 20, func(i int) []byte { return []byte(fmt.Sprintf("%s-%d", s, i)) })
	}
	seen := map[string]bool{}
	for _, s := range []string{"x", "y", "z"} {
		evs, err := j.Read(ctx, s, 1)
		if err != nil || len(evs) != 20 {
			t.Fatalf("Read(%s): %d events, err=%v", s, len(evs), err)
		}
		prev := strings.Repeat("0", 64)
		for _, e := range evs {
			if e.PrevHash != prev {
				t.Fatalf("%s seq %d: prev_hash %s, want %s", s, e.Seq, e.PrevHash, prev)
			}
			if !hexHash.MatchString(e.Hash) || seen[e.Hash] {
				t.Fatalf("%s seq %d: hash %q is not a fresh lowercase hex SHA-256", s, e.Seq, e.Hash)
			}
			seen[e.Hash] = true
			prev = e.Hash
		}
		if _, h, _ := j.Head(ctx, s); h != prev {
			t.Fatalf("Head(%s) hash %s, last event hash %s", s, h, prev)
		}
	}
	if err := j.Verify(ctx); err != nil {
		t.Fatalf("Verify on an untouched Journal: %v", err)
	}
	checkChain(t, j)
}

func TestB1_01b_StateHashReproducedOnRebuild(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "journal.db")
	j := openOrFail(t, path)
	for _, s := range []string{"a", "b", "c", "d"} {
		appendN(t, j, s, 25, func(i int) []byte { return []byte(fmt.Sprintf("%s:%d", s, i)) })
	}
	before, err := j.StateHash(ctx)
	if err != nil || before == "" {
		t.Fatalf("StateHash: %q, %v", before, err)
	}
	if err := j.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}
	j = openOrFail(t, path)
	defer j.Close()
	after, err := j.StateHash(ctx)
	if err != nil || after != before {
		t.Fatalf("StateHash after rebuild = %q (%v), before = %q", after, err, before)
	}
	checkChain(t, j) // the reproduced value is the frozen formula over the heads, not a file digest
	appendN(t, j, "a", 1, func(int) []byte { return []byte("one more") })
	if moved, _ := j.StateHash(ctx); moved == before {
		t.Fatalf("StateHash did not change after an append; it must digest the heads")
	}
}

func TestB1_01b_TamperedRowRefused(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "journal.db")
	j := openOrFail(t, path)
	nonce := make([]byte, 16)
	rand.Read(nonce)
	marker := []byte("TAMPER-MARKER-" + hex.EncodeToString(nonce))
	appendN(t, j, "tamper", 10, func(i int) []byte {
		if i == 4 {
			return marker
		}
		return []byte(fmt.Sprintf("row-%d", i))
	})
	appendN(t, j, "bystander", 3, func(i int) []byte { return []byte(fmt.Sprintf("b-%d", i)) })
	if err := j.Verify(ctx); err != nil {
		t.Fatalf("control: Verify before tampering: %v", err)
	}
	if err := j.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}

	// Edit the row the way an attacker with file access would: rewrite its bytes in place,
	// behind the Journal's back. Only the main database file is edited. Its pages carry no
	// checksum, so the chain is the only thing that can notice. WAL frames DO carry checksums,
	// and a corrupted frame is silently dropped on recovery, which would test SQLite, not the
	// chain. That is why Close must checkpoint, and why a marker still in -wal fails this test.
	if b, err := os.ReadFile(path + "-wal"); err == nil && bytes.Contains(b, marker) {
		t.Fatalf("event data still in %s-wal after Close; Close must checkpoint into the database file", path)
	}
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Contains(b, marker) {
		t.Fatalf("event data not found verbatim in %s after Close; the Proposal.Data contract requires it", path)
	}
	b = bytes.ReplaceAll(b, marker, append([]byte("XAMPER"), marker[6:]...))
	if err := os.WriteFile(path, b, 0o600); err != nil {
		t.Fatal(err)
	}

	j2, err := journal.Open(path)
	if err != nil {
		if !errors.Is(err, journal.ErrChainBroken) {
			t.Fatalf("Open of a tampered Journal: %v, want ErrChainBroken", err)
		}
		return // refused at the door
	}
	defer j2.Close()
	if err := j2.Verify(ctx); !errors.Is(err, journal.ErrChainBroken) {
		t.Fatalf("Verify after tampering: %v, want ErrChainBroken", err)
	}
	if _, err := j2.Read(ctx, "tamper", 1); !errors.Is(err, journal.ErrChainBroken) {
		t.Fatalf("Read of the tampered stream: %v, want ErrChainBroken (a broken chain is not served)", err)
	}
	head, _, _ := j2.Head(ctx, "tamper")
	if _, err := j2.Append(ctx, journal.Proposal{Stream: "tamper", ExpectSeq: head, Type: "t", Data: []byte("extend")}); !errors.Is(err, journal.ErrChainBroken) {
		t.Fatalf("Append to the tampered stream: %v, want ErrChainBroken (a broken chain is not extended)", err)
	}
}

func TestB1_01b_BlobsContentAddressed(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "journal.db")
	j := openOrFail(t, path)
	data := []byte("a blob with nothing secret in it\n")
	sum := sha256.Sum256(data)
	want := journal.BlobRef("sha256:" + hex.EncodeToString(sum[:]))

	ref, err := j.PutBlob(ctx, "beacon", data)
	if err != nil || ref != want {
		t.Fatalf("PutBlob = %q, %v; want %q", ref, err, want)
	}
	if again, err := j.PutBlob(ctx, "beacon", data); err != nil || again != ref {
		t.Fatalf("PutBlob of identical bytes = %q, %v; want the same ref %q", again, err, ref)
	}
	if got, err := j.GetBlob(ctx, "beacon", ref); err != nil || !bytes.Equal(got, data) {
		t.Fatalf("GetBlob = %q, %v", got, err)
	}
	if _, err := j.GetBlob(ctx, "other-venture", ref); !errors.Is(err, journal.ErrBlobNotFound) {
		t.Fatalf("GetBlob across ventures: %v, want ErrBlobNotFound (blobs are per venture)", err)
	}
	if err := j.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}
	j = openOrFail(t, path)
	defer j.Close()
	if got, err := j.GetBlob(ctx, "beacon", ref); err != nil || !bytes.Equal(got, data) {
		t.Fatalf("GetBlob after reopen = %q, %v", got, err)
	}
}
