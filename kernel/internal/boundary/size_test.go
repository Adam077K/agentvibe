package boundary

import (
	"strings"
	"testing"
)

func lines(n int) string { return strings.Repeat("//\n", n) }

// Founder decision 2026-10-02: the default budget is 10,000 lines.
func TestDefaultBudgetIsTenThousand(t *testing.T) {
	if DefaultMaxLines != 10000 {
		t.Fatalf("DefaultMaxLines = %d, want 10000", DefaultMaxLines)
	}
}

// At the default budget a Kernel tree passes; one line over, it fails.
func TestDefaultBudgetEdge(t *testing.T) {
	at := tree(t, map[string]string{"internal/k/k.go": lines(10000)})
	if fs, n, err := CheckSize(at, DefaultMaxLines); err != nil || len(fs) != 0 || n != 10000 {
		t.Fatalf("10,000 lines: n=%d findings=%v err=%v; want n=10000 and no finding", n, fs, err)
	}
	over := tree(t, map[string]string{"internal/k/k.go": lines(10001)})
	fs, n, err := CheckSize(over, DefaultMaxLines)
	if err != nil || len(fs) != 1 || n != 10001 || !strings.Contains(fs[0].Detail, "10001 non-test Go lines, over the budget of 10000") {
		t.Fatalf("10,001 lines: n=%d findings=%v err=%v; want one size finding", n, fs, err)
	}
}

// The checker's own two package directories are not counted. Everything else is: their
// subdirectories (testdata included), ordinary Kernel packages, and every near-miss path that a
// prefix, suffix or glob match would wrongly swallow.
func TestCheckerPackagesNotCounted(t *testing.T) {
	root := tree(t, map[string]string{
		// excluded: files directly in the checker's package directories
		"internal/boundary/size.go": lines(1000),
		"cmd/avk-boundary/main.go":  lines(500),
		// counted
		"internal/boundary/testdata/journal/clean/kernel/store.go": lines(3),
		"cmd/avk-boundary/sub/y.go":                                lines(2),
		"internal/launcher/launcher.go":                            lines(5),
		"internal/boundaryx/a.go":                                  lines(7),
		"x/internal/boundary/b.go":                                 lines(11),
		"cmd/avk-boundary-extra/d.go":                              lines(13),
		"boundary/e.go":                                            lines(17),
		"internal/boundary.go":                                     lines(19),
		"cmd/avk/f.go":                                             lines(23),
	})
	const want = 3 + 2 + 5 + 7 + 11 + 13 + 17 + 19 + 23
	if n, err := CountLines(root); err != nil || n != want {
		t.Fatalf("CountLines = %d, %v; want %d (checker package files excluded, nothing else)", n, err, want)
	}
	// A normal Kernel package alone is counted in full.
	only := tree(t, map[string]string{"internal/launcher/launcher.go": lines(42)})
	if n, err := CountLines(only); err != nil || n != 42 {
		t.Fatalf("Kernel package: CountLines = %d, %v; want 42", n, err)
	}
	// A checker package alone counts nothing, whatever its size.
	checker := tree(t, map[string]string{"internal/boundary/big.go": lines(20000), "cmd/avk-boundary/main.go": lines(20000)})
	if fs, n, err := CheckSize(checker, DefaultMaxLines); err != nil || n != 0 || len(fs) != 0 {
		t.Fatalf("checker only: n=%d findings=%v err=%v; want 0 and no finding", n, fs, err)
	}
}
