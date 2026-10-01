package boundary

import (
	"bytes"
	"fmt"
	"os"
	"strings"
)

// DefaultMaxLines is the Kernel's size budget (09a §2, "~8,000 lines (parameter)").
const DefaultMaxLines = 8000

// CountLines counts the physical lines of every .go file under root except _test.go files, in
// every directory: testdata and _ or . prefixed directories count, and so does anything reached
// through a symlink. The go tool skips those directories today; one build flag or rename later it
// does not, so the budget counts what is present rather than what one command happens to compile.
// Blank and comment lines count, so the budget cannot be met by reformatting.
func CountLines(root string) (int, error) {
	files, _, err := walkKernel(root)
	if err != nil {
		return 0, err
	}
	total := 0
	for _, f := range files {
		if !strings.HasSuffix(f.rel, ".go") || strings.HasSuffix(f.rel, "_test.go") {
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
