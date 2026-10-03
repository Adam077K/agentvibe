// Package journal owns the Journal's location.
//
// Only the Kernel writes the Journal (docs/vision-v3/09a-ENGINEERING.md §2-§3), so only code under
// kernel/ may name it. Two mechanisms hold that line: Go's internal-package rule refuses this import
// from any Go code outside kernel/, and avk-boundary refuses the path itself in every other source
// file of the repository, whatever its language.
package journal

// Path is the Journal's location relative to the avk user's home directory (09a §4.1).
const Path = ".agentvibe/kernel/journal.db"
