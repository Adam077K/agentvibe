package journal

import (
	"errors"
	"path/filepath"
	"strings"
	"testing"
)

func TestWriterLockExcludesSecondHolder(t *testing.T) {
	path := filepath.Join(t.TempDir(), "journal.db")
	l, err := acquireWriterLock(path)
	if err != nil {
		t.Fatalf("first acquire: %v", err)
	}
	if _, err := acquireWriterLock(path); !errors.Is(err, ErrLocked) {
		t.Fatalf("second acquire while held: %v, want ErrLocked", err)
	}
	if err := l.release(); err != nil {
		t.Fatalf("release: %v", err)
	}
	l2, err := acquireWriterLock(path)
	if err != nil {
		t.Fatalf("acquire after release: %v", err)
	}
	l2.release()
}

func TestHashesRefuseMalformedPrevHash(t *testing.T) {
	for _, bad := range []string{"", strings.Repeat("A", 64), strings.Repeat("0", 63), strings.Repeat("g", 64)} {
		if _, err := eventHash("s", 1, "t", nil, bad); !errors.Is(err, ErrChainBroken) {
			t.Fatalf("eventHash(prev %q): %v, want ErrChainBroken", bad, err)
		}
	}
	a, err := eventHash("ab", 1, "c", nil, zeroHash)
	if err != nil {
		t.Fatal(err)
	}
	b, _ := eventHash("a", 1, "bc", nil, zeroHash)
	if a == b || len(a) != 64 {
		t.Fatalf("length prefixes must separate (ab,c) from (a,bc): %s %s", a, b)
	}
	s1, _ := stateHash([]head{{"a", 1, a}})
	s2, _ := stateHash([]head{{"a", 1, a}})
	if s1 != s2 || s1 == "" {
		t.Fatalf("stateHash not deterministic: %s %s", s1, s2)
	}
}
