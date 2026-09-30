package boundary

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// The real tree, relative to this package's directory.
const (
	kernelRoot = "../.."
	repoRoot   = "../../.."
)

var ctx = context.Background()

// offline keeps every go invocation off the network: a fixture that needed a download is a broken
// fixture, and a download would make the answer depend on the proxy.
func offline(t *testing.T) {
	t.Helper()
	t.Setenv("GOPROXY", "off")
	t.Setenv("GOFLAGS", "")
}

// tree writes files under a fresh temporary root. A kernel that violates its own boundary cannot be
// committed under kernel/ (the real-tree tests would fail on it), so every kernel-side negative
// fixture is built here at run time.
func tree(t *testing.T, files map[string]string) string {
	t.Helper()
	root := t.TempDir()
	for rel, body := range files {
		p := filepath.Join(root, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(p, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return root
}

// has reports whether any finding sits at where (a prefix match on the location) and says detail.
func has(fs []Finding, where, detail string) bool {
	for _, f := range fs {
		if strings.HasPrefix(f.Where, where) && strings.Contains(f.Detail, detail) {
			return true
		}
	}
	return false
}

const cleanGoMod = "module example.com/k\n\ngo 1.25\n"

func mustNone(t *testing.T, what string, fs []Finding, err error) {
	t.Helper()
	if err != nil || len(fs) != 0 {
		t.Fatalf("%s: findings=%v err=%v", what, fs, err)
	}
}

func TestParseAllowed(t *testing.T) {
	got, err := ParseAllowed(strings.NewReader("# header\n\nmodernc.org/sqlite  # the Journal\n  example.com/b\n"))
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 || !got["modernc.org/sqlite"] || !got["example.com/b"] {
		t.Fatalf("got %v", got)
	}
	for _, bad := range []string{"modernc.org/sqlite v1.0.0\n", "example.com/a\nexample.com/a\n"} {
		if _, err := ParseAllowed(strings.NewReader(bad)); err == nil {
			t.Errorf("ParseAllowed(%q) accepted it", bad)
		}
	}
}

// Every kernel-side check passes on the kernel as committed, and the Journal scan on the repository.
func TestRealTreePasses(t *testing.T) {
	offline(t)
	allowed, err := LoadAllowed(filepath.Join(kernelRoot, "ALLOWED_MODULES"))
	if err != nil {
		t.Fatal(err)
	}
	fs, mod, err := CheckGoMod(kernelRoot, allowed)
	mustNone(t, "go.mod", fs, err)
	fs, err = CheckKernelTree(kernelRoot)
	mustNone(t, "tree", fs, err)
	fs, err = CheckImports(ctx, kernelRoot, mod, allowed)
	mustNone(t, "imports", fs, err)
	fs, err = CheckModules(ctx, kernelRoot, allowed)
	mustNone(t, "go list matrix", fs, err)
	fs, n, err := CheckSize(kernelRoot, DefaultMaxLines)
	mustNone(t, "size", fs, err)
	if n == 0 {
		t.Fatal("counted zero lines in the real kernel")
	}
	fs, err = CheckJournalWriters(repoRoot, "kernel")
	mustNone(t, "journal", fs, err)
}

// A stdlib-only kernel, Ed25519 included, passes every module check.
func TestStdlibKernelPasses(t *testing.T) {
	offline(t)
	root := tree(t, map[string]string{
		"go.mod":  cleanGoMod,
		"main.go": "package main\n\nimport (\n\t\"crypto/ed25519\"\n\t\"fmt\"\n)\n\nfunc main() { fmt.Println(ed25519.PublicKeySize) }\n",
	})
	fs, mod, err := CheckGoMod(root, nil)
	mustNone(t, "go.mod", fs, err)
	fs, err = CheckImports(ctx, root, mod, nil)
	mustNone(t, "imports", fs, err)
	fs, err = CheckModules(ctx, root, nil)
	mustNone(t, "go list matrix", fs, err)
}

// An unrequired import cannot resolve; go list reports it and the check fails rather than passing.
func TestUnresolvableImportFails(t *testing.T) {
	offline(t)
	root := tree(t, map[string]string{
		"go.mod":  cleanGoMod,
		"main.go": "package main\n\nimport \"example.com/nowhere\"\n\nfunc main() { nowhere.Do() }\n",
	})
	fs, err := CheckModules(ctx, root, nil)
	if err != nil || !has(fs, "example.com/nowhere", "could not resolve") {
		t.Fatalf("want an unresolved finding, got findings=%v err=%v", fs, err)
	}
	fs, err = CheckImports(ctx, root, "example.com/k", nil)
	if err != nil || !has(fs, "main.go", "example.com/nowhere") {
		t.Fatalf("want a static import finding, got findings=%v err=%v", fs, err)
	}
}

// Reviewer bypass: a darwin-only file importing a replaced module, checked from GOOS=linux, where
// the go tool never lists that file. Refused four ways: the require, the replace, the import as
// parsed, and the darwin cells of the go list matrix.
func TestBypassPlatformOnlyReplacedModule(t *testing.T) {
	offline(t)
	t.Setenv("GOOS", "linux")
	root := tree(t, map[string]string{
		"go.mod":       cleanGoMod + "\nrequire example.com/evil v0.0.0\n\nreplace example.com/evil => ./evil\n",
		"main.go":      "package main\n\nfunc main() {}\n",
		"x_darwin.go":  "package main\n\nimport _ \"example.com/evil\"\n",
		"evil/go.mod":  "module example.com/evil\n\ngo 1.25\n",
		"evil/evil.go": "package evil\n",
	})
	fs, mod, err := CheckGoMod(root, nil)
	if err != nil || !has(fs, "go.mod:5", "requires example.com/evil") || !has(fs, "go.mod:7", `"replace" directive`) {
		t.Fatalf("go.mod: findings=%v err=%v", fs, err)
	}
	// Listing the module does not admit a replacement of it.
	fs, _, _ = CheckGoMod(root, map[string]bool{"example.com/evil": true})
	if len(fs) != 1 || !has(fs, "go.mod:7", `"replace" directive`) {
		t.Fatalf("go.mod with evil allowed: want only the replace finding, got %v", fs)
	}
	fs, err = CheckImports(ctx, root, mod, nil)
	if err != nil || !has(fs, "x_darwin.go", "example.com/evil") {
		t.Fatalf("imports: findings=%v err=%v", fs, err)
	}
	fs, err = CheckModules(ctx, root, nil)
	if err != nil || !has(fs, "example.com/evil", "darwin/") {
		t.Fatalf("go list matrix: findings=%v err=%v", fs, err)
	}
	fs, err = CheckKernelTree(root)
	if err != nil || !has(fs, "evil/go.mod", "nested module") {
		t.Fatalf("tree: findings=%v err=%v", fs, err)
	}
}

// Reviewer bypasses: a nested module (kernel/tools/go.mod), cgo, foreign source, a workspace file
// and a vendor directory. Each is refused by what it is, not by what it imports.
func TestBypassTreeContents(t *testing.T) {
	root := tree(t, map[string]string{
		"go.mod":          cleanGoMod,
		"tools/go.mod":    "module example.com/tools\n\ngo 1.25\n",
		"tools/t.go":      "package tools\n",
		"cgo.go":          "package k\n\n// int f(void) { return 1; }\nimport \"C\"\n",
		"helper.c":        "int g(void) { return 2; }\n",
		"blob.syso":       "\x00",
		"go.work":         "go 1.25\n\nuse ./tools\n",
		"vendor/x/y/y.go": "package y\n",
		"broken.go":       "this is not go\n",
	})
	fs, err := CheckKernelTree(root)
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range [][2]string{
		{"tools/go.mod", "nested module"}, {"cgo.go", `imports "C"`}, {"helper.c", ".c source"},
		{"blob.syso", ".syso source"}, {"go.work", "workspace"}, {"vendor/x/y/y.go", "vendor"},
		{"broken.go", "does not parse"},
	} {
		if !has(fs, want[0], want[1]) {
			t.Errorf("no finding at %s saying %q; got %v", want[0], want[1], fs)
		}
	}
}

// Reviewer bypasses: code parked in an _underscore or testdata directory, or behind a symlinked
// directory, where the go tool does not look. All of it counts, and the symlink itself is refused.
func TestBypassHiddenLines(t *testing.T) {
	outside := tree(t, map[string]string{"far.go": strings.Repeat("// far\n", 7)})
	root := tree(t, map[string]string{
		"a.go":          "package k\n",               // 1
		"a_test.go":     strings.Repeat("//\n", 50),  // tests do not count
		"_big/b.go":     strings.Repeat("// b\n", 5), // 5
		"testdata/c.go": strings.Repeat("// c\n", 3), // 3
	})
	if err := os.Symlink(outside, filepath.Join(root, "linked")); err != nil {
		t.Fatal(err)
	}
	const want = 1 + 5 + 3 + 7
	if fs, n, err := CheckSize(root, want); err != nil || len(fs) != 0 || n != want {
		t.Fatalf("at the budget: n=%d findings=%v err=%v; want n=%d", n, fs, err, want)
	}
	if fs, _, err := CheckSize(root, want-1); err != nil || len(fs) != 1 {
		t.Fatalf("one line over: findings=%v err=%v; want one size finding", fs, err)
	}
	if fs, err := CheckKernelTree(root); err != nil || !has(fs, "linked", "symlink") {
		t.Fatalf("tree: want the symlink refused, got findings=%v err=%v", fs, err)
	}
}

func TestJournalCleanFixturePasses(t *testing.T) {
	fs, err := CheckJournalWriters("testdata/journal/clean", "kernel")
	mustNone(t, "clean fixture", fs, err)
}

func TestJournalWriterOutsideKernelFails(t *testing.T) {
	fs, err := CheckJournalWriters("testdata/journal/violating", "kernel")
	if err != nil {
		t.Fatal(err)
	}
	got := map[string]bool{}
	for _, x := range fs {
		got[x.Where] = true
	}
	// kernel/store.go names it too and is exempt. docs/ is prose and exempt; everything else,
	// Markdown included, is scanned.
	want := []string{"bin/tap:3", "scripts/open-journal.mjs:5", "scripts/tap.sh:2", "tools/peek.py:4"}
	if len(got) != len(want) {
		t.Fatalf("got %v, want exactly %v", fs, want)
	}
	for _, w := range want {
		if !got[w] {
			t.Errorf("missing finding at %s; got %v", w, fs)
		}
	}
}

// Reviewer bypasses: the Journal named where no source extension is — a workflow, a package.json
// script, a Makefile, node_modules, an agent command file — and a symlink whose target names it.
// A nested checkout is still skipped: it is not this tree, and git cannot commit a .git entry.
func TestBypassJournalInAnyFile(t *testing.T) {
	root := tree(t, map[string]string{
		".github/workflows/w.yml":   "steps:\n  - run: sqlite3 ~/.agentvibe/kernel/journal.db .dump\n",
		"package.json":              "{\n  \"scripts\": {\"tap\": \"sqlite3 $HOME/.agentvibe/kernel/journal.db\"}\n}\n",
		"Makefile":                  "tap:\n\tsqlite3 ~/.agentvibe/kernel/journal.db\n",
		"node_modules/pkg/index.js": "open('.agentvibe/kernel/journal.db')\n",
		".claude/commands/tap.md":   "Run `sqlite3 ~/.agentvibe/kernel/journal.db`.\n",
		"other/.git":                "gitdir: elsewhere\n",
		"other/x.js":                "open('.agentvibe/kernel/journal.db')\n",
		"docs/design.md":            "The Journal lives at ~/.agentvibe/kernel/journal.db.\n",
	})
	if err := os.Symlink("/home/avk/.agentvibe/kernel/journal.db", filepath.Join(root, "j")); err != nil {
		t.Fatal(err)
	}
	fs, err := CheckJournalWriters(root, "kernel")
	if err != nil {
		t.Fatal(err)
	}
	want := []string{".github/workflows/w.yml:2", "package.json:2", "Makefile:2", "node_modules/pkg/index.js:1",
		".claude/commands/tap.md:1", "j"}
	if len(fs) != len(want) {
		t.Fatalf("got %v, want exactly %v", fs, want)
	}
	for _, w := range want {
		if !has(fs, w, "") {
			t.Errorf("missing finding at %s; got %v", w, fs)
		}
	}
}

// Reviewer bypass: a case variant, which names the same file on the case-insensitive file systems
// the Kernel runs on, and the directory spelled as separate tokens.
func TestBypassJournalCaseAndTokens(t *testing.T) {
	root := tree(t, map[string]string{
		"a.mjs": "open(join(homedir(), '.AgentVibe', 'Kernel', 'Journal.DB'))\n",
		"b.py":  "d = os.path.join(HOME, '.agentvibe', 'kernel')\n",
		"c.sh":  "ls ~/.agentvibe/releases  # not the Journal\n",
	})
	fs, err := CheckJournalWriters(root, "kernel")
	if err != nil || len(fs) != 2 || !has(fs, "a.mjs:1", "file") || !has(fs, "b.py:1", "directory") {
		t.Fatalf("want a.mjs:1 (file) and b.py:1 (directory) only, got findings=%v err=%v", fs, err)
	}
}

// Reviewer bypass: a glob that matches the Journal without spelling it. Globs too broad to be aimed
// at anything (`*`, `*/*`) are not findings.
func TestBypassJournalGlob(t *testing.T) {
	for _, line := range []string{
		"sqlite3 ~/.agentvibe/*/journal.*",
		"cp ~/.agentvibe/k?rnel/*.db /tmp",
		"glob('**/j[o]urnal.d?')",
		`open("C:\\Users\\x\\.agentvibe\\kern*\\*.db")`,
	} {
		if matchJournal(strings.ToLower(line)) == "" {
			t.Errorf("%q: not matched", line)
		}
	}
	for _, line := range []string{"rm -rf *", "cp */* out/", "for f in *.*; do", "x = a[0] * b"} {
		if why := matchJournal(strings.ToLower(line)); why != "" {
			t.Errorf("%q: matched (%s), want no finding", line, why)
		}
	}
}
