// Package boundary checks the three lines the Kernel must not cross
// (docs/vision-v3/09a-ENGINEERING.md §2):
//
//   - every module in the Kernel's build is stdlib or named in ALLOWED_MODULES (CheckModules);
//   - the Kernel's non-test Go source stays under a line budget (CheckSize);
//   - nothing outside kernel/ names the Journal (CheckJournalWriters).
//
// Each check returns findings for violations and an error only when it could not look. A caller must
// treat an error as a failure: a check that could not run has not passed.
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
