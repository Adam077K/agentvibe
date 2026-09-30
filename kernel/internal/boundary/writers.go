package boundary

import (
	"bufio"
	"bytes"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// ProseDirs are the only directories outside kernel/ that may name the Journal: the design
// documents that specify it. Everything else is scanned whatever its extension, because a Makefile,
// a workflow, a package.json script or an agent command file each runs as surely as a .mjs does.
var ProseDirs = []string{"docs"}

// journalSegments are journal.Path's components, lowercased: the scan is case-insensitive because
// the file systems the Kernel runs on are.
var journalSegments = strings.Split(strings.ToLower(journal.Path), "/")

var (
	// A path token: everything except whitespace, quotes and the punctuation code puts around paths.
	pathToken = regexp.MustCompile("[^\\s'\"`(),;=<>|&+{}]+")
	// The Journal's directory as separate tokens: '.agentvibe' and 'kernel' on one line, in any
	// join style — "a/b", path.join('a', 'b'), ["a", "b"].
	dirWord = regexp.MustCompile(`(^|[^a-z0-9_])kernel([^a-z0-9_]|$)`)
)

// matchJournal reports why a lowercased line names the Journal, or "" when it does not.
func matchJournal(line string) string {
	base, dir := journalSegments[len(journalSegments)-1], journalSegments[0]
	if strings.Contains(line, base) {
		return fmt.Sprintf("names the Journal's file %q", base)
	}
	if strings.Contains(line, dir) && dirWord.MatchString(line) {
		return fmt.Sprintf("names the Journal's directory (%q and %q)", dir, "kernel")
	}
	for _, tok := range pathToken.FindAllString(line, -1) {
		if strings.ContainsAny(tok, "*?[") && globReachesJournal(tok) {
			return fmt.Sprintf("has a glob, %q, that matches the Journal", tok)
		}
	}
	return ""
}

// globReachesJournal reports whether a glob token can match journal.Path, aligned from the end so
// that whatever home-directory prefix it carries does not matter. `**` matches any number of
// segments. The glob must be AIMED: at least one segment carrying two or more literal characters
// must match a Journal segment. Without that, `scripts/**` or `*/*` would match everything.
func globReachesJournal(tok string) bool {
	var segs []string
	for _, s := range strings.Split(strings.ReplaceAll(tok, `\`, "/"), "/") {
		if s != "" {
			segs = append(segs, s)
		}
	}
	return suffixMatch(segs, journalSegments, false)
}

// suffixMatch matches glob segments against target segments from the end. Glob segments left over
// once the target is exhausted are the path's prefix (a home directory) and match, but only when
// an aimed segment has matched on the way.
func suffixMatch(glob, target []string, aimed bool) bool {
	switch {
	case len(target) == 0:
		return aimed
	case len(glob) == 0:
		return false
	}
	g, t := glob[len(glob)-1], target[len(target)-1]
	if g == "**" {
		for k := 0; k <= len(target); k++ {
			if suffixMatch(glob[:len(glob)-1], target[:len(target)-k], aimed) {
				return true
			}
		}
		return false
	}
	ok, err := path.Match(g, t)
	return err == nil && ok && suffixMatch(glob[:len(glob)-1], target[:len(target)-1], aimed || literals(g) >= 2)
}

// literals counts a glob segment's characters that are not glob syntax.
func literals(seg string) int {
	n := 0
	for _, r := range seg {
		if !strings.ContainsRune("*?[]!^-", r) {
			n++
		}
	}
	return n
}

// CheckJournalWriters walks repoRoot and reports every line, in every non-binary file outside the
// kernel directory kernelRel and the ProseDirs, that names the Journal, whatever the file's name or
// extension: node_modules, workflows, Makefiles, package.json and extensionless scripts included.
// Only the Kernel writes the Journal and Userland reaches it through the command socket (09a §2),
// so outside kernel/ there is no reason to name it; any reference is a finding. A symlink is
// resolved: its target text is checked, and a file behind it is read.
//
// Skipped: .git, and a nested directory holding its own .git entry (another checkout; git refuses
// to commit a path named .git, so no committed file can hide behind one). THIS IS A TRIPWIRE, NOT
// THE BOUNDARY: a path assembled at run time from pieces that never spell a token is invisible to
// any static scan. The enforced boundary is the OS: the Journal is owned by avk, mode 600, and
// reached only through the command socket, mode 660 (09a §2, §4.1; B1-03).
func CheckJournalWriters(repoRoot, kernelRel string) ([]Finding, error) {
	kernelRel = filepath.ToSlash(filepath.Clean(kernelRel))
	var findings []Finding
	scan := func(rel string, src []byte) error {
		if bytes.IndexByte(src[:min(len(src), 8000)], 0) >= 0 {
			return nil // binary, by git's own test
		}
		sc := bufio.NewScanner(bytes.NewReader(src))
		sc.Buffer(nil, len(src)+1)
		for n := 1; sc.Scan(); n++ {
			if why := matchJournal(strings.ToLower(sc.Text())); why != "" {
				findings = append(findings, Finding{CheckJournal, fmt.Sprintf("%s:%d", rel, n), why + "; only kernel/ may"})
			}
		}
		return sc.Err()
	}
	err := filepath.WalkDir(repoRoot, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(repoRoot, p)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		if d.Name() == ".git" && p != repoRoot {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if d.IsDir() {
			if p == repoRoot {
				return nil
			}
			if rel == kernelRel || isProse(rel) {
				return filepath.SkipDir
			}
			if _, err := os.Lstat(filepath.Join(p, ".git")); err == nil {
				return filepath.SkipDir
			}
			return nil
		}
		if d.Type()&fs.ModeSymlink != 0 {
			target, err := os.Readlink(p)
			if err != nil {
				return err
			}
			if why := matchJournal(strings.ToLower(target)); why != "" {
				findings = append(findings, Finding{CheckJournal, rel, "is a symlink whose target " + why})
			}
			info, err := os.Stat(p)
			if err != nil {
				return nil // dangling: nothing behind it to read
			}
			if info.IsDir() {
				// Scanned where it lives when that is inside the repository. Outside, nothing
				// here can read it, so the link itself is refused rather than trusted.
				if outside, err := leavesRoot(repoRoot, p); err != nil {
					return err
				} else if outside {
					findings = append(findings, Finding{CheckJournal, rel,
						"is a symlink to a directory outside the repository, which this scan cannot read"})
				}
				return nil
			}
			if !info.Mode().IsRegular() {
				return nil
			}
		} else if !d.Type().IsRegular() {
			return nil
		}
		src, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		return scan(rel, src)
	})
	return findings, err
}

// leavesRoot reports whether the symlink p resolves outside root.
func leavesRoot(root, p string) (bool, error) {
	realRoot, err := filepath.EvalSymlinks(root)
	if err != nil {
		return false, err
	}
	target, err := filepath.EvalSymlinks(p)
	if err != nil {
		return false, err
	}
	rel, err := filepath.Rel(realRoot, target)
	return err != nil || !filepath.IsLocal(rel), nil
}

func isProse(rel string) bool {
	for _, d := range ProseDirs {
		if rel == d {
			return true
		}
	}
	return false
}
