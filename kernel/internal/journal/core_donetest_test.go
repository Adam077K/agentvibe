//go:build donetest

// B1-01a done-test, frozen by B0-17a (docs/vision-v3/14-BUILD-PLAN.md §6): "10k random appends +
// crash injection → identical rebuild". Hash-registered in build/done-tests/B0-17a.yml; editing
// this file changes the job's acceptance, which is a register change, not a fix.
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/journal/
package journal_test

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

const (
	crashChildEnv  = "AVK_DONETEST_CRASH_CHILD" // set to the Journal path: run as the crash child
	crashSeedEnv   = "AVK_DONETEST_CRASH_SEED"
	totalAppends   = 10000
	crashStreams   = 16
	maxAcksPerLife = 1500
)

// TestMain lets the test binary re-execute itself as the crash child, which the parent SIGKILLs.
func TestMain(m *testing.M) {
	if path := os.Getenv(crashChildEnv); path != "" {
		os.Exit(crashChild(path))
	}
	os.Exit(m.Run())
}

// crashChild appends random events until killed, printing one "ack" line per durable append.
// A deliberately stale ExpectSeq must be refused with ErrSeqConflict and leave nothing behind.
func crashChild(path string) int {
	ctx := context.Background()
	seed, _ := strconv.ParseInt(os.Getenv(crashSeedEnv), 10, 64)
	rng := rand.New(rand.NewSource(seed))
	j, err := journal.Open(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "child open: %v\n", err)
		return 3
	}
	for {
		stream := fmt.Sprintf("s%02d", rng.Intn(crashStreams))
		head, _, err := j.Head(ctx, stream)
		if err != nil {
			fmt.Fprintf(os.Stderr, "child head: %v\n", err)
			return 3
		}
		if rng.Intn(8) == 0 {
			_, err := j.Append(ctx, journal.Proposal{Stream: stream, ExpectSeq: head + 1, Type: "stale", Data: []byte("x")})
			if !errors.Is(err, journal.ErrSeqConflict) {
				fmt.Fprintf(os.Stdout, "bad stale append on %s at head %d: err=%v\n", stream, head, err)
				return 4
			}
			continue
		}
		// ≤128 bytes keeps each ack line under PIPE_BUF (512), so a kill never leaves half a line.
		data := make([]byte, 1+rng.Intn(128))
		rng.Read(data)
		ev, err := j.Append(ctx, journal.Proposal{Stream: stream, ExpectSeq: head, Type: "t" + strconv.Itoa(rng.Intn(4)), Data: data})
		if err != nil {
			fmt.Fprintf(os.Stderr, "child append: %v\n", err)
			return 3
		}
		fmt.Fprintf(os.Stdout, "ack %s %d %s %s %s\n", ev.Stream, ev.Seq, ev.Type, ev.Hash, hex.EncodeToString(ev.Data))
	}
}

func openOrFail(t *testing.T, path string) journal.Journal {
	t.Helper()
	j, err := journal.Open(path)
	if err != nil {
		t.Fatalf("journal.Open(%s): %v", path, err)
	}
	return j
}

// digest folds every stream's full event list into one value: the "rebuild" the test compares.
func digest(t *testing.T, j journal.Journal) (string, int) {
	t.Helper()
	ctx := context.Background()
	streams, err := j.Streams(ctx)
	if err != nil {
		t.Fatalf("Streams: %v", err)
	}
	h, n := sha256.New(), 0
	for _, s := range streams {
		evs, err := j.Read(ctx, s, 1)
		if err != nil {
			t.Fatalf("Read(%s): %v", s, err)
		}
		for i, e := range evs {
			if e.Stream != s || e.Seq != uint64(i+1) {
				t.Fatalf("stream %s: event %d has (stream %q, seq %d); seq must be gapless from 1", s, i, e.Stream, e.Seq)
			}
			fmt.Fprintf(h, "%s|%d|%s|%x|%s|%s\n", e.Stream, e.Seq, e.Type, e.Data, e.PrevHash, e.Hash)
			n++
		}
	}
	return hex.EncodeToString(h.Sum(nil)), n
}

type acked struct{ typ, hash, data string }

func TestB1_01a_SingleWriter(t *testing.T) {
	path := filepath.Join(t.TempDir(), "journal.db")
	j := openOrFail(t, path)
	if second, err := journal.Open(path); !errors.Is(err, journal.ErrLocked) {
		if second != nil {
			second.Close()
		}
		t.Fatalf("second Open of a held Journal: err=%v, want ErrLocked", err)
	}
	if err := j.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}
	j = openOrFail(t, path)
	j.Close()
}

func TestB1_01a_OptimisticSeq(t *testing.T) {
	ctx := context.Background()
	j := openOrFail(t, filepath.Join(t.TempDir(), "journal.db"))
	defer j.Close()

	ev, err := j.Append(ctx, journal.Proposal{Stream: "a", ExpectSeq: 0, Type: "t", Data: []byte("1")})
	if err != nil || ev.Seq != 1 {
		t.Fatalf("first append: seq=%d err=%v, want seq 1", ev.Seq, err)
	}
	if _, err := j.Append(ctx, journal.Proposal{Stream: "a", ExpectSeq: 0, Type: "t", Data: []byte("dup")}); !errors.Is(err, journal.ErrSeqConflict) {
		t.Fatalf("append with stale expect_seq: err=%v, want ErrSeqConflict", err)
	}
	if head, _, _ := j.Head(ctx, "a"); head != 1 {
		t.Fatalf("head after refused append = %d, want 1 (a refused append writes nothing)", head)
	}
	if head, hash, err := j.Head(ctx, "never-written"); head != 0 || hash != "" || err != nil {
		t.Fatalf("Head(unknown) = (%d, %q, %v), want (0, \"\", nil)", head, hash, err)
	}

	// Eight writers race one stream; every success must take a distinct seq and the result must
	// be gapless. Streams are independent: "b" does not disturb "a".
	var wg sync.WaitGroup
	var mu sync.Mutex
	wins := map[uint64]int{}
	for w := 0; w < 8; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			for i := 0; i < 200; i++ {
				head, _, err := j.Head(ctx, "b")
				if err != nil {
					t.Errorf("Head: %v", err)
					return
				}
				ev, err := j.Append(ctx, journal.Proposal{Stream: "b", ExpectSeq: head, Type: "t", Data: []byte(fmt.Sprintf("w%d-%d", w, i))})
				if errors.Is(err, journal.ErrSeqConflict) {
					continue
				}
				if err != nil {
					t.Errorf("Append: %v", err)
					return
				}
				mu.Lock()
				wins[ev.Seq]++
				mu.Unlock()
			}
		}(w)
	}
	wg.Wait()
	head, _, _ := j.Head(ctx, "b")
	if uint64(len(wins)) != head || head == 0 {
		t.Fatalf("stream b: %d distinct winning seqs, head %d; want equal and non-zero", len(wins), head)
	}
	for seq, n := range wins {
		if n != 1 {
			t.Fatalf("seq %d won by %d writers; optimistic seq must admit exactly one", seq, n)
		}
	}
	if a, _, _ := j.Head(ctx, "a"); a != 1 {
		t.Fatalf("stream a head = %d after writes to b, want 1", a)
	}
	digest(t, j)
}

func TestB1_01a_RandomAppendsCrashRebuild(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "journal.db")
	openOrFail(t, path).Close() // fail fast, in-process, before spawning anything

	model := map[string][]acked{}
	total, rng := 0, rand.New(rand.NewSource(1701))
	for life := 0; total < totalAppends; life++ {
		killAfter := 1 + rng.Intn(maxAcksPerLife)
		if killAfter > totalAppends-total {
			killAfter = totalAppends - total
		}
		cmd := exec.Command(os.Args[0], "-test.run=^$")
		cmd.Env = append(os.Environ(), crashChildEnv+"="+path, crashSeedEnv+"="+strconv.Itoa(life))
		var stderr strings.Builder
		cmd.Stderr = &stderr
		out, err := cmd.StdoutPipe()
		if err != nil {
			t.Fatal(err)
		}
		if err := cmd.Start(); err != nil {
			t.Fatal(err)
		}
		sc := bufio.NewScanner(out)
		sc.Buffer(make([]byte, 1<<16), 1<<20)
		lines, killed := 0, false
		watchdog := time.AfterFunc(2*time.Minute, func() { cmd.Process.Kill() })
		for sc.Scan() {
			f := strings.Fields(sc.Text())
			if len(f) != 6 || f[0] != "ack" {
				t.Fatalf("life %d: child reported %q", life, sc.Text())
			}
			seq, _ := strconv.ParseUint(f[2], 10, 64)
			if want := uint64(len(model[f[1]]) + 1); seq != want {
				t.Fatalf("life %d: child acked %s seq %d, model expects %d", life, f[1], seq, want)
			}
			model[f[1]] = append(model[f[1]], acked{f[3], f[4], f[5]})
			lines++
			if lines == killAfter && !killed {
				cmd.Process.Signal(syscall.SIGKILL) // crash injection: no Close, no checkpoint
				killed = true
			}
		}
		watchdog.Stop()
		cmd.Wait()
		if !killed {
			t.Fatalf("life %d: child exited after %d acks without being killed; stderr: %s", life, lines, stderr.String())
		}
		total += lines

		// Recovery: every acknowledged append is present and unchanged. At most one event per
		// stream may exist beyond the model: the append in flight when the kill landed.
		j := openOrFail(t, path)
		if err := j.Verify(ctx); err != nil {
			t.Fatalf("life %d: Verify after crash: %v", life, err)
		}
		extra := 0
		for s := 0; s < crashStreams; s++ {
			stream := fmt.Sprintf("s%02d", s)
			evs, err := j.Read(ctx, stream, 1)
			if err != nil {
				t.Fatalf("life %d: Read(%s): %v", life, stream, err)
			}
			want := model[stream]
			if len(evs) < len(want) || len(evs) > len(want)+1 {
				t.Fatalf("life %d: stream %s holds %d events, %d acknowledged", life, stream, len(evs), len(want))
			}
			for i, e := range evs {
				if i < len(want) {
					if e.Hash != want[i].hash || hex.EncodeToString(e.Data) != want[i].data || e.Type != want[i].typ {
						t.Fatalf("life %d: %s seq %d differs from what was acknowledged", life, stream, e.Seq)
					}
					continue
				}
				extra++
				model[stream] = append(model[stream], acked{e.Type, e.Hash, hex.EncodeToString(e.Data)})
				total++
			}
		}
		if extra > 1 {
			t.Fatalf("life %d: %d unacknowledged events survived; a sequential writer has at most one in flight", life, extra)
		}
		if err := j.Close(); err != nil {
			t.Fatalf("life %d: Close: %v", life, err)
		}
	}

	// Identical rebuild: two independent reopens agree with each other and with the model.
	h := sha256.New()
	n := 0
	for s := 0; s < crashStreams; s++ {
		stream := fmt.Sprintf("s%02d", s)
		prev := strings.Repeat("0", 64)
		for i, a := range model[stream] {
			d, _ := hex.DecodeString(a.data)
			fmt.Fprintf(h, "%s|%d|%s|%x|%s|%s\n", stream, i+1, a.typ, d, prev, a.hash)
			prev = a.hash
			n++
		}
	}
	wantDigest := hex.EncodeToString(h.Sum(nil))
	var states [2]string
	for r := 0; r < 2; r++ {
		j := openOrFail(t, path)
		got, count := digest(t, j)
		if count != n || count < totalAppends {
			t.Fatalf("rebuild %d: %d events, model %d, want ≥ %d", r, count, n, totalAppends)
		}
		if got != wantDigest {
			t.Fatalf("rebuild %d: digest %s, model %s", r, got, wantDigest)
		}
		st, err := j.StateHash(ctx)
		if err != nil {
			t.Fatalf("rebuild %d: StateHash: %v", r, err)
		}
		states[r] = st
		j.Close()
	}
	if states[0] != states[1] || states[0] == "" {
		t.Fatalf("StateHash differs across rebuilds: %q vs %q", states[0], states[1])
	}
}
