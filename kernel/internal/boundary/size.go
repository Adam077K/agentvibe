package boundary

import (
	"bytes"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// DefaultMaxLines is the Kernel's size budget (09a §2, "~8,000 lines (parameter)").
const DefaultMaxLines = 8000

// CountLines counts the physical lines of every non-test .go file under root. It skips what the Go
// tool never compiles into the Kernel: _test.go files and directories named testdata or starting
// with '.' or '_'. Blank and comment lines count, so the budget cannot be met by reformatting.
func CountLines(root string) (int, error) {
	total := 0
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		name := d.Name()
		if d.IsDir() {
			if path != root && (name == "testdata" || strings.HasPrefix(name, ".") || strings.HasPrefix(name, "_")) {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(name, ".go") || strings.HasSuffix(name, "_test.go") {
			return nil
		}
		src, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		total += bytes.Count(src, []byte("\n"))
		if len(src) > 0 && src[len(src)-1] != '\n' {
			total++
		}
		return nil
	})
	return total, err
}

// CheckSize reports a finding when the non-test Go source under root exceeds maxLines.
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
