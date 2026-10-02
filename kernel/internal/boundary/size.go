package boundary

import (
	"bytes"
	"fmt"
	"os"
	"path"
	"strings"
)

// DefaultMaxLines is the Kernel's size budget (09a §2, "~10,000 lines (parameter)"). Raised from
// 8,000 by founder decision 2026-10-02 (docs/vision-v3/_process/DR-KERNEL-BUDGET-2026-10-02.md).
const DefaultMaxLines = 10000

// checkerPackages are the directories, relative to the kernel root, of the boundary checker itself.
// The checker measures the Kernel and is not part of what it measures, so its files are not counted
// (founder decision 2026-10-02). The match is the exact directory of the file: a file directly in one
// of these is skipped, and a file in any subdirectory of one, testdata included, still counts. No
// prefix, suffix or glob is involved, so no other Kernel package can match by accident.
var checkerPackages = map[string]bool{
	"internal/boundary": true,
	"cmd/avk-boundary":  true,
}

// CountLines counts the physical lines of every .go file under root except _test.go files, in
// every directory: testdata and _ or . prefixed directories count, and so does anything reached
// through a symlink. The go tool skips those directories today; one build flag or rename later it
// does not, so the budget counts what is present rather than what one command happens to compile.
// Blank and comment lines count, so the budget cannot be met by reformatting. The one exclusion is
// the checker's own package directories (checkerPackages), matched exactly.
func CountLines(root string) (int, error) {
	files, _, err := walkKernel(root)
	if err != nil {
		return 0, err
	}
	total := 0
	for _, f := range files {
		if !strings.HasSuffix(f.rel, ".go") || strings.HasSuffix(f.rel, "_test.go") || checkerPackages[path.Dir(f.rel)] {
			continue
		}
		src, err := os.ReadFile(f.abs)
		if err != nil {
			return 0, err
		}
		total += bytes.Count(src, []byte("\n"))
		if len(src) > 0 && src[len(src)-1] != '\n' {
			total++
		}
	}
	return total, nil
}

// CheckSize reports a finding when the Go source under root exceeds maxLines.
func CheckSize(root string, maxLines int) ([]Finding, int, error) {
	n, err := CountLines(root)
	if err != nil {
		return nil, 0, err
	}
	if n > maxLines {
		return []Finding{{CheckLines, root,
			fmt.Sprintf("%d non-test Go lines, over the budget of %d; move the overflow to Userland or refuse it", n, maxLines)}}, n, nil
	}
	return nil, n, nil
}
