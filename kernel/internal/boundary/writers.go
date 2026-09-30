package boundary

import (
	"bufio"
	"bytes"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// scannedExts are the source languages this repository writes code in.
var scannedExts = map[string]bool{
	".go": true, ".py": true, ".sh": true, ".bash": true, ".zsh": true,
	".js": true, ".mjs": true, ".cjs": true, ".jsx": true,
	".ts": true, ".mts": true, ".cts": true, ".tsx": true,
}

// skippedDirs are never source of this repository: dependencies, git internals, other checkouts.
var skippedDirs = map[string]bool{".git": true, "node_modules": true, ".worktrees": true}

// journalNeedles are what a reference to the Journal must spell somewhere: its file name (which also
// matches the -wal and -shm sidecars, and every path.join form, since the name is one literal) and
// its directory. Both derive from journal.Path, so moving the Journal moves the check.
var journalNeedles = []string{path.Base(journal.Path), path.Dir(journal.Path)}

// CheckJournalWriters walks repoRoot and reports every line, in every source file outside the
// kernel directory kernelRel (relative to repoRoot), that names the Journal. Only the Kernel writes
// the Journal and Userland reaches it through the command socket (09a §2), so outside kernel/ there
// is no legitimate reason to name it: any reference, a sqlite open included, is a finding.
//
// Scanned: files with a source extension in scannedExts, and extensionless files starting "#!".
// Skipped: .git, node_modules, .worktrees, and any nested directory holding its own .git (another
// checkout, which is not this tree). Blind spot, stated: a path assembled at run time from pieces
// that never spell a needle (an environment variable, "journal" + ".db") is invisible to a static
// scan. Go code cannot reach journal.Path from outside kernel/ at all; the compiler refuses it.
func CheckJournalWriters(repoRoot, kernelRel string) ([]Finding, error) {
	kernelRel = filepath.Clean(kernelRel)
	var findings []Finding
	err := filepath.WalkDir(repoRoot, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(repoRoot, p)
		if err != nil {
			return err
		}
		if d.IsDir() {
			if p == repoRoot {
				return nil
			}
			if skippedDirs[d.Name()] || rel == kernelRel {
				return filepath.SkipDir
			}
			if _, err := os.Lstat(filepath.Join(p, ".git")); err == nil {
				return filepath.SkipDir
			}
			return nil
		}
		ext := filepath.Ext(d.Name())
		if !d.Type().IsRegular() || (!scannedExts[ext] && ext != "") {
			return nil
		}
		src, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		if ext == "" && !bytes.HasPrefix(src, []byte("#!")) {
			return nil
		}
		sc := bufio.NewScanner(bytes.NewReader(src))
		sc.Buffer(nil, len(src)+1)
		for n := 1; sc.Scan(); n++ {
			for _, needle := range journalNeedles {
				if strings.Contains(sc.Text(), needle) {
					findings = append(findings, Finding{CheckJournal, fmt.Sprintf("%s:%d", filepath.ToSlash(rel), n),
						fmt.Sprintf("names the Journal (%q); only kernel/ may", needle)})
					break
				}
			}
		}
		return sc.Err()
	})
	return findings, err
}
