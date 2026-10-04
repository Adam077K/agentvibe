package journal

import (
	"context"
	"path/filepath"
	"testing"
)

// TestReadHonoursFromSeq pins Read's lower bound. The B1-01a done-tests only ever read from seq 1,
// so a Read that ignored fromSeq passed them; this test reads from every other position.
func TestReadHonoursFromSeq(t *testing.T) {
	ctx := context.Background()
	j, err := Open(filepath.Join(t.TempDir(), "journal.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer j.Close()
	const n = 5
	var all []Event
	for i := uint64(0); i < n; i++ {
		e, err := j.Append(ctx, Proposal{Stream: "s", ExpectSeq: i, Type: "t", Data: []byte{byte(i)}})
		if err != nil {
			t.Fatalf("append %d: %v", i+1, err)
		}
		all = append(all, e)
	}
	// A second stream, so a Read that drops its stream filter is caught as well.
	if _, err := j.Append(ctx, Proposal{Stream: "other", ExpectSeq: 0, Type: "t", Data: []byte("x")}); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		name    string
		from    uint64
		wantSeq []uint64
	}{
		{"zero reads all", 0, []uint64{1, 2, 3, 4, 5}},
		{"from first", 1, []uint64{1, 2, 3, 4, 5}},
		{"from second", 2, []uint64{2, 3, 4, 5}},
		{"mid-stream", 3, []uint64{3, 4, 5}},
		{"at head", n, []uint64{5}},
		{"one past head", n + 1, nil},
		{"far past head", 1 << 40, nil},
		{"max uint64", ^uint64(0), nil},
	} {
		got, err := j.Read(ctx, "s", tc.from)
		if err != nil {
			t.Fatalf("%s: Read(%d): %v", tc.name, tc.from, err)
		}
		if len(got) != len(tc.wantSeq) {
			t.Fatalf("%s: Read(%d) returned %d events, want %d", tc.name, tc.from, len(got), len(tc.wantSeq))
		}
		for i, e := range got {
			want := all[tc.wantSeq[i]-1]
			if e.Stream != want.Stream || e.Seq != want.Seq || e.Type != want.Type ||
				string(e.Data) != string(want.Data) || e.PrevHash != want.PrevHash || e.Hash != want.Hash {
				t.Fatalf("%s: Read(%d)[%d] = %+v, want %+v", tc.name, tc.from, i, e, want)
			}
		}
	}
}
