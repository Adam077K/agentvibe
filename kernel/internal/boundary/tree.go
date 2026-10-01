package boundary

import (
	"fmt"
	"go/parser"
	"go/token"
	"io/fs"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// CheckTree is the check name for what the Kernel's directory may hold at all.
const CheckTree = "tree"

// kernelFile is one regular file under the kernel root, reached directly or through a symlink.
type kernelFile struct {
	rel string // slash-separated, relative to the kernel root, as reached
	abs string
}

// walkKernel returns every regular file under root, in every directory (testdata, _ and . prefixed
// included, since what is present is what can be built one flag later), following symlinks so that
// nothing behind a link goes uncounted. Every symlink is also returned, because the tree must not
// hold one. A directory reached twice through links is walked once.
func walkKernel(root string) (files []kernelFile, links []string, err error) {
	seen := map[string]bool{}
	var walk func(dir, relDir string) error
	walk = func(dir, relDir string) error {
		real, err := filepath.EvalSymlinks(dir)
		if err != nil {
			return err
		}
		if seen[real] {
			return nil
		}
		seen[real] = true
		entries, err := os.ReadDir(dir)
		if err != nil {
			return err
		}
		for _, e := range entries {
			abs := filepath.Join(dir, e.Name())
			rel := pathJoin(relDir, e.Name())
			mode := e.Type()
			if mode&fs.ModeSymlink != 0 {
				links = append(links, rel)
				info, err := os.Stat(abs)
				if err != nil {
					continue // dangling: reported as a link, nothing behind it to count
				}
				mode = info.Mode().Type()
			}
			switch {
			case mode.IsDir():
				if err := walk(abs, rel); err != nil {
					return err
				}
			case mode.IsRegular():
				files = append(files, kernelFile{rel, abs})
			}
		}
		return nil
	}
	return files, links, walk(root, "")
}

func pathJoin(dir, name string) string {
	if dir == "" {
		return name
	}
	return dir + "/" + name
}

// Extensions the go tool compiles or links from a package directory besides .go: C, C++,
// Objective-C, Fortran, assembly, SWIG and prebuilt objects. Any one is a way into the binary that
// neither the module list nor the line budget sees.
var foreignSourceExts = map[string]bool{
	".c": true, ".h": true, ".s": true, ".sx": true, ".m": true, ".mm": true,
	".cc": true, ".cpp": true, ".cxx": true, ".hh": true, ".hpp": true, ".hxx": true,
	".f": true, ".for": true, ".f90": true, ".swig": true, ".swigcxx": true, ".syso": true,
}

// CheckKernelTree reports what the Kernel's directory must not contain: any symlink; any non-Go
// source the go tool would build; any cgo; a second go.mod, a go.work or go.work.sum, or a vendor
// directory, each of which changes which code a module path resolves to; and any .go file that
// does not parse, since a file the checker cannot read is a file it has not checked.
func CheckKernelTree(root string) ([]Finding, error) {
	files, links, err := walkKernel(root)
	if err != nil {
		return nil, err
	}
	var findings []Finding
	add := func(where, detail string) { findings = append(findings, Finding{CheckTree, where, detail}) }
	for _, l := range links {
		add(l, "is a symlink; the kernel tree holds none, so what is checked is what is built")
	}
	for _, f := range files {
		base := filepath.Base(f.rel)
		for _, dir := range strings.Split(filepath.Dir(f.rel), "/") {
			if dir == "vendor" {
				add(f.rel, "is under a vendor directory, which substitutes code for module paths")
				break
			}
		}
		switch ext := strings.ToLower(filepath.Ext(base)); {
		case base == "go.mod" && f.rel != "go.mod":
			add(f.rel, "is a nested module; the kernel is one module")
		case base == "go.work" || base == "go.work.sum":
			add(f.rel, "is a workspace file, which adds modules outside go.mod")
		case foreignSourceExts[ext]:
			add(f.rel, fmt.Sprintf("is %s source the go tool would build; the kernel is Go only", ext))
		case ext == ".go":
			imports, err := goImports(f.abs)
			if err != nil {
				add(f.rel, fmt.Sprintf("does not parse, so it cannot be checked: %v", err))
				continue
			}
			for _, imp := range imports {
				if imp == "C" {
					add(f.rel, `imports "C" (cgo); the kernel is pure Go`)
				}
			}
		}
	}
	return findings, nil
}

// goImports returns the import paths of one Go file, whatever its build constraints.
func goImports(path string) ([]string, error) {
	f, err := parser.ParseFile(token.NewFileSet(), path, nil, parser.ImportsOnly)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(f.Imports))
	for _, s := range f.Imports {
		p, err := strconv.Unquote(s.Path.Value)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}
