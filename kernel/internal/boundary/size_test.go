package boundary

import (
	"strings"
	"testing"
)

func lines(n int) string { return strings.Repeat("//\n", n) }

// Founder decision 2026-10-03: the default budget is 11,000 lines, nothing excluded.
func TestDefaultBudgetIsElevenThousand(t *testing.T) {
	if DefaultMaxLines != 11000 {
		t.Fatalf("DefaultMaxLines = %d, want 11000", DefaultMaxLines)
	}
}

// At the default budget a Kernel tree passes; one line over, it fails.
func TestDefaultBudgetEdge(t *testing.T) {
	at := tree(t, map[string]string{"internal/k/k.go": lines(11000)})
	if fs, n, err := CheckSize(at, DefaultMaxLines); err != nil || len(fs) != 0 || n != 11000 {
		t.Fatalf("11,000 lines: n=%d findings=%v err=%v; want n=11000 and no finding", n, fs, err)
	}
	over := tree(t, map[string]string{"internal/k/k.go": lines(11001)})
	fs, n, err := CheckSize(over, DefaultMaxLines)
	if err != nil || len(fs) != 1 || n != 11001 || !strings.Contains(fs[0].Detail, "11001 non-test Go lines, over the budget of 11000") {
		t.Fatalf("11,001 lines: n=%d findings=%v err=%v; want one size finding", n, fs, err)
	}
}

// The boundary checker is Kernel code and counts like any other package: no directory is exempt.
func TestCheckerPackagesCounted(t *testing.T) {
	root := tree(t, map[string]string{
		"internal/boundary/size.go":     lines(100),
		"cmd/avk-boundary/main.go":      lines(50),
		"internal/launcher/launcher.go": lines(5),
	})
	if n, err := CountLines(root); err != nil || n != 100+50+5 {
		t.Fatalf("CountLines = %d, %v; want 155 (checker packages count)", n, err)
	}
	over := tree(t, map[string]string{"internal/boundary/big.go": lines(11001)})
	if fs, _, err := CheckSize(over, DefaultMaxLines); err != nil || len(fs) != 1 {
		t.Fatalf("11,001 lines in the checker package: findings=%v err=%v; want one size finding", fs, err)
	}
}
