// Package boundary checks the three lines the Kernel must not cross
// (docs/vision-v3/09a-ENGINEERING.md §2):
//
//   - every module the Kernel can reach is stdlib or named in ALLOWED_MODULES: go.mod and go.sum
//     read directly (CheckGoMod), every import in every file parsed (CheckImports), and the build
//     resolved on a GOOS/GOARCH/tag matrix (CheckModules);
//   - the tree holds only Go: no symlink, cgo, foreign source, nested module, workspace or vendor
//     directory (CheckKernelTree);
//   - the Kernel's non-test Go source stays under a line budget (CheckSize);
//   - nothing outside kernel/ names the Journal (CheckJournalWriters, a tripwire; see its doc).
//
// The principle is default-deny on what the checker cannot see: a file the go tool would skip on
// this platform is still read, and a directive or file kind the checker cannot reason about is
// refused rather than trusted. Each check returns findings for violations and an error only when it
// could not look. A caller must treat an error as a failure: a check that could not run has not
// passed.
package boundary

import "fmt"

// Check names, as they appear in a Finding.
const (
	CheckModule  = "module"
	CheckLines   = "size"
	CheckJournal = "journal"
)

// Finding is one violation: which check, where, and what.
type Finding struct {
	Check  string
	Where  string
	Detail string
}

func (f Finding) String() string {
	return fmt.Sprintf("[%s] %s: %s", f.Check, f.Where, f.Detail)
}
