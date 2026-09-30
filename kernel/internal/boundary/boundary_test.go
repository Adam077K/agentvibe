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

// offline keeps every go invocation off the network: a fixture that needed a download is a broken
// fixture, and a download would make the answer depend on the proxy.
func offline(t *testing.T) {
	t.Helper()
	t.Setenv("GOPROXY", "off")
	t.Setenv("GOFLAGS", "")
}

func mustModules(t *testing.T, dir string, allowed map[string]bool) []Finding {
	t.Helper()
	findings, err := CheckModules(context.Background(), dir, allowed)
	if err != nil {
		t.Fatalf("CheckModules(%s): %v", dir, err)
	}
	return findings
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

func TestModulesRealKernelPasses(t *testing.T) {
	offline(t)
	allowed, err := LoadAllowed(filepath.Join(kernelRoot, "ALLOWED_MODULES"))
	if err != nil {
		t.Fatal(err)
	}
	if f := mustModules(t, kernelRoot, allowed); len(f) != 0 {
		t.Fatalf("real kernel: %v", f)
	}
}

func TestModulesStdlibOnlyPasses(t *testing.T) {
	offline(t)
	if f := mustModules(t, "testdata/modules/stdlib", nil); len(f) != 0 {
		t.Fatalf("stdlib-only fixture: %v", f)
	}
}

func TestModulesDisallowedImportFails(t *testing.T) {
	offline(t)
	f := mustModules(t, "testdata/modules/disallowed", map[string]bool{"modernc.org/sqlite": true})
	if len(f) != 1 || f[0].Where != "example.com/evil" || !strings.Contains(f[0].Detail, "not in ALLOWED_MODULES") {
		t.Fatalf("want one disallowed finding for example.com/evil, got %v", f)
	}
}

// Listing a module by name must not admit a different body of code under that name.
func TestModulesReplacedModuleFailsEvenWhenAllowed(t *testing.T) {
	offline(t)
	f := mustModules(t, "testdata/modules/disallowed", map[string]bool{"example.com/evil": true})
	if len(f) != 1 || f[0].Where != "example.com/evil" || !strings.Contains(f[0].Detail, "replaced by ./evil") {
		t.Fatalf("want one replace finding for example.com/evil, got %v", f)
	}
}

// An import no go.mod requires makes go list fail, and a check that could not look must not pass.
func TestModulesUnlistableIsAnError(t *testing.T) {
	offline(t)
	if f, err := CheckModules(context.Background(), "testdata/modules/unrequired", nil); err == nil {
		t.Fatalf("want an error, got findings %v and no error", f)
	}
}

func TestSizeRealKernelPasses(t *testing.T) {
	f, n, err := CheckSize(kernelRoot, DefaultMaxLines)
	if err != nil {
		t.Fatal(err)
	}
	if len(f) != 0 || n == 0 {
		t.Fatalf("real kernel: %d lines, findings %v", n, f)
	}
}

// testdata/size holds 5 lines of kernel code, plus a _test.go file, a nested testdata directory and
// an _underscore directory that the Go tool never compiles and so must not count.
func TestSizeBudget(t *testing.T) {
	const fixture, lines = "testdata/size", 5
	if f, n, err := CheckSize(fixture, lines); err != nil || len(f) != 0 || n != lines {
		t.Fatalf("at the budget: n=%d findings=%v err=%v; want n=%d and no finding", n, f, err, lines)
	}
	f, _, err := CheckSize(fixture, lines-1)
	if err != nil || len(f) != 1 || f[0].Check != CheckLines {
		t.Fatalf("one line over the budget: findings=%v err=%v; want one size finding", f, err)
	}
}

func TestJournalRealRepoPasses(t *testing.T) {
	f, err := CheckJournalWriters(repoRoot, "kernel")
	if err != nil {
		t.Fatal(err)
	}
	if len(f) != 0 {
		t.Fatalf("real repo: %v", f)
	}
}

func TestJournalCleanFixturePasses(t *testing.T) {
	f, err := CheckJournalWriters("testdata/journal/clean", "kernel")
	if err != nil || len(f) != 0 {
		t.Fatalf("clean fixture: findings=%v err=%v", f, err)
	}
}

func TestJournalWriterOutsideKernelFails(t *testing.T) {
	f, err := CheckJournalWriters("testdata/journal/violating", "kernel")
	if err != nil {
		t.Fatal(err)
	}
	got := map[string]bool{}
	for _, x := range f {
		got[x.Where] = true
	}
	// kernel/store.go names it too and is exempt; docs/notes.md is prose, not code.
	want := []string{"bin/tap:3", "scripts/open-journal.mjs:5", "scripts/tap.sh:2", "tools/peek.py:4"}
	if len(got) != len(want) {
		t.Fatalf("got %v, want exactly %v", f, want)
	}
	for _, w := range want {
		if !got[w] {
			t.Errorf("missing finding at %s; got %v", w, f)
		}
	}
}

// Dependencies and nested checkouts are not this tree. Built at run time because git will not commit
// a directory entry named .git, and node_modules/ is ignored by this repository.
func TestJournalSkipsDependenciesAndNestedCheckouts(t *testing.T) {
	root := t.TempDir()
	write := func(rel, body string) {
		t.Helper()
		p := filepath.Join(root, rel)
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(p, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	ref := "open('.agentvibe/kernel/journal.db')\n"
	write("node_modules/pkg/index.js", ref)
	write("other-checkout/.git", "gitdir: elsewhere\n")
	write("other-checkout/scripts/x.js", ref)
	write("nested/kernel/x.ts", ref) // only the top-level kernel/ is exempt
	f, err := CheckJournalWriters(root, "kernel")
	if err != nil {
		t.Fatal(err)
	}
	if len(f) != 1 || f[0].Where != "nested/kernel/x.ts:1" {
		t.Fatalf("want exactly nested/kernel/x.ts:1, got %v", f)
	}
}
