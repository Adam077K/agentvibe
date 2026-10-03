//go:build donetest

// Round-3 done-tests for B1-07, after the Opus re-review PASSED b0f1e27 on security and adversarial
// lenses with four MED findings and one surviving mutant (DR-B1-07-CODEX-RULINGS-2026-10-02.md,
// "Round 3").
//
//  1. The required-key check reads TOML as TOML: a key that appears only inside a string (a
//     """ or ”' multi-line one included), a comment, an array-of-tables or another table is
//     missing; a duplicate key in any spelling is refused; a value that is not valid TOML is
//     refused. No Go TOML library is in the offline module cache, so this pins behaviour, not a
//     library: a minimal strict parser that refuses what it does not understand passes.
//  2. -o and CODEX_HOME are compared to the worktree after resolution, not lexically: through a
//     symlink, through an alias of the worktree, or in another letter case on a case-insensitive
//     filesystem, a path inside the worktree is inside it.
//  3. -C is resolved through symlinks and must land inside the worktree.
//  4. HOME: measured on codex-cli 0.154.0 (throwaway homes, no credential, no turn served), with
//     CODEX_HOME unset codex loads $HOME/.codex/config.toml; it does NOT load XDG_CONFIG_HOME,
//     XDG_DATA_HOME or XDG_STATE_HOME config. So Env[HOME] is absent (the launcher's own, the
//     real user home) or exactly the pinned LaunchSpec.Home, which is clean and outside the
//     worktree. XDG is not pinned.
//  5. noSymlink: an Lstat error other than not-exist (permission denied, not a directory) refuses.
//
// ROUND 4 (2026-10-03, DR-B1-07 "Round 4"): the profile is superseded, so item 1's test
// (R3_ProfileIsParsedAsTOML) is removed; items 2-5 stand.
//
// Hashed in build/done-tests/B1-07.yml. Run: go -C kernel test -count=1 -tags donetest -run B1_07 ./internal/adapter/
package adapter

import (
	"os"
	"path/filepath"
	"testing"
)

// cxR3Dirs makes a real worktree W (named "Worktree", so its case can be flipped) under a
// symlink-free temp dir, with a sub-directory, and returns both.
func cxR3Dirs(t *testing.T) (dir, wt string) {
	t.Helper()
	d, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	wt = filepath.Join(d, "Worktree")
	if err := os.MkdirAll(filepath.Join(wt, "pkg"), 0o755); err != nil {
		t.Fatal(err)
	}
	return d, wt
}

func cxR3Symlink(t *testing.T, target, link string) {
	t.Helper()
	if err := os.Symlink(target, link); err != nil {
		t.Fatal(err)
	}
}

// cxR3CaseInsensitive: the filesystem under dir folds letter case.
func cxR3CaseInsensitive(t *testing.T, dir string) bool {
	t.Helper()
	p := filepath.Join(dir, "caseprobe")
	if err := os.WriteFile(p, nil, 0o644); err != nil {
		t.Fatal(err)
	}
	_, err := os.Stat(filepath.Join(dir, "CASEPROBE"))
	return err == nil
}

func cxR3Spec(wt string) LaunchSpec {
	s := cxSpec()
	s.Worktree, s.Cwd = wt, wt
	return s
}

// 2 and 3. -C, -o and CODEX_HOME are compared after resolution.
func TestB1_07_R3_PathsResolvedBeforeComparison(t *testing.T) {
	dir, wt := cxR3Dirs(t)
	cxArgv(t, cxR3Spec(wt)) // a real worktree, -C at its root: accepted
	sub := cxR3Spec(wt)
	sub.Cwd = filepath.Join(wt, "pkg")
	cxArgv(t, sub) // -C in a real sub-directory: accepted

	// 3. -C through a symlink inside the worktree that leaves it.
	cxR3Symlink(t, "/", filepath.Join(wt, "to-root"))
	cxR3Symlink(t, dir, filepath.Join(wt, "to-parent"))
	cxR3Symlink(t, filepath.Join(wt, "pkg"), filepath.Join(wt, "to-pkg"))
	for _, c := range []string{"to-root", "to-parent", "to-root/w"} {
		s := cxR3Spec(wt)
		s.Cwd = filepath.Join(wt, c)
		cxRefused(t, "-C through "+c, s, ErrSpec)
	}

	// 2. -o inside the worktree by another name.
	alias := filepath.Join(dir, "alias")
	cxR3Symlink(t, wt, alias)
	s := cxR3Spec(alias) // the worktree given by its alias
	s.ResultPath = filepath.Join(wt, "r.json")
	cxRefused(t, "-o by the real path, worktree by an alias", s, ErrSpec)
	s = cxR3Spec(alias)
	s.CodexHome = filepath.Join(wt, ".codex")
	s.Env = map[string]string{"CODEX_HOME": s.CodexHome}
	cxRefused(t, "CODEX_HOME by the real path, worktree by an alias", s, ErrSpec)
	homeLink := filepath.Join(dir, "home-link")
	cxR3Symlink(t, filepath.Join(wt, "pkg"), homeLink)
	s = cxR3Spec(wt)
	s.CodexHome = homeLink
	s.Env = map[string]string{"CODEX_HOME": homeLink}
	cxRefused(t, "CODEX_HOME through a symlink into the worktree", s, ErrSpec)

	if cxR3CaseInsensitive(t, dir) {
		flipped := filepath.Join(dir, "wORKTREE")
		s = cxR3Spec(wt)
		s.ResultPath = filepath.Join(flipped, "r.json")
		cxRefused(t, "-o in the worktree in another case", s, ErrSpec)
		s = cxR3Spec(wt)
		s.CodexHome = filepath.Join(flipped, ".codex")
		s.Env = map[string]string{"CODEX_HOME": s.CodexHome}
		cxRefused(t, "CODEX_HOME in the worktree in another case", s, ErrSpec)
		s = cxR3Spec(wt)
		s.Home = filepath.Join(flipped, "home")
		s.Env = map[string]string{"HOME": s.Home}
		cxRefused(t, "HOME in the worktree in another case", s, ErrSpec)
	} else {
		t.Log("case-sensitive filesystem: the case-variant rows do not apply here")
	}

	// Controls: outside the worktree, by real paths, still accepted.
	out := filepath.Join(dir, "out")
	if err := os.Mkdir(out, 0o755); err != nil {
		t.Fatal(err)
	}
	s = cxR3Spec(wt)
	s.ResultPath = filepath.Join(out, "r.json")
	s.CodexHome = filepath.Join(out, "codex-home")
	s.Env = map[string]string{"CODEX_HOME": s.CodexHome}
	cxArgv(t, s)
}

// 4. HOME is the real user home (absent from Env) or exactly the pinned Home, outside the worktree.
func TestB1_07_R3_HomePinned(t *testing.T) {
	env := func(home, pinned string, set bool) LaunchSpec {
		s := cxSpec()
		s.Home = pinned
		s.Env = map[string]string{"LANG": "C.UTF-8"}
		if set {
			s.Env["HOME"] = home
		}
		return s
	}
	cxArgv(t, env("", "", false))
	cxArgv(t, env("", "/h/user", false))
	cxArgv(t, env("/h/user", "/h/user", true))
	for name, s := range map[string]LaunchSpec{
		"another home":        env("/h/other", "/h/user", true),
		"set, nothing pinned": env("/h/user", "", true),
		"set empty":           env("", "", true),
		"trailing slash":      env("/h/user/", "/h/user", true),
		"pin relative":        env("h/user", "h/user", true),
		"pin with ..":         env("/h/x/../user", "/h/x/../user", true),
		"pin is the worktree": env("/w/job-1", "/w/job-1", true),
		"pin in the worktree": env("/w/job-1/home", "/w/job-1/home", true),
		"pin is /":            env("/", "/", true),
	} {
		cxRefused(t, "HOME "+name, s, ErrSpec)
	}
}

// 5. noSymlink: any Lstat error but not-exist refuses (the re-review's surviving mutant at :96).
func TestB1_07_R3_LstatErrorRefuses(t *testing.T) {
	dir, _ := cxR3Dirs(t)
	file := filepath.Join(dir, "plain.json")
	if err := os.WriteFile(file, []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	s := cxSpec()
	s.ResultPath = filepath.Join(file, "r.json") // ENOTDIR, not ENOENT
	cxRefused(t, "-o under a regular file", s, ErrSpec)

	locked := filepath.Join(dir, "locked")
	if err := os.MkdirAll(filepath.Join(locked, "sub"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(locked, 0o000); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.Chmod(locked, 0o755) })
	if _, err := os.Lstat(filepath.Join(locked, "sub")); err == nil || os.IsNotExist(err) {
		t.Skipf("Lstat under a mode-000 directory returned %v (running as root?)", err)
	}
	s = cxSpec()
	s.ResultPath = filepath.Join(locked, "sub", "r.json") // EACCES
	cxRefused(t, "-o under an unreadable directory", s, ErrSpec)
}
