package boundary

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// ParseAllowed reads an ALLOWED_MODULES file: one module path per line, '#' starts a comment, blank
// lines are ignored. A line carrying anything besides a single path (a version, say) is an error, as
// is a duplicate, so the file cannot quietly mean something other than what it lists.
func ParseAllowed(r io.Reader) (map[string]bool, error) {
	allowed := map[string]bool{}
	sc := bufio.NewScanner(r)
	for n := 1; sc.Scan(); n++ {
		line, _, _ := strings.Cut(sc.Text(), "#")
		fields := strings.Fields(line)
		switch {
		case len(fields) == 0:
			continue
		case len(fields) > 1:
			return nil, fmt.Errorf("line %d: want one module path, got %q", n, strings.TrimSpace(line))
		case allowed[fields[0]]:
			return nil, fmt.Errorf("line %d: %s is listed twice", n, fields[0])
		}
		allowed[fields[0]] = true
	}
	return allowed, sc.Err()
}

// LoadAllowed reads an ALLOWED_MODULES file from disk.
func LoadAllowed(path string) (map[string]bool, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	allowed, err := ParseAllowed(f)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	return allowed, nil
}

// inAllowedModule reports whether an import path belongs to a listed module.
func inAllowedModule(importPath string, allowed map[string]bool) bool {
	for m := range allowed {
		if importPath == m || strings.HasPrefix(importPath, m+"/") {
			return true
		}
	}
	return false
}

// goModLine is one directive of a go.mod, a block entry carrying its block's verb.
type goModLine struct {
	verb string
	args []string
	line int
}

// parseGoMod splits a go.mod into directives. It reads the file directly rather than trusting the go
// tool's resolution, so a directive the tool would honour on some other platform or flag is seen.
func parseGoMod(src []byte) ([]goModLine, error) {
	var out []goModLine
	block := ""
	for n, raw := range strings.Split(string(src), "\n") {
		line, _, _ := strings.Cut(raw, "//")
		fields := strings.Fields(line)
		if len(fields) == 0 {
			continue
		}
		switch {
		case block != "" && fields[0] == ")":
			block = ""
			continue
		case block != "":
			out = append(out, goModLine{block, fields, n + 1})
			continue
		case len(fields) == 2 && fields[1] == "(":
			block = fields[0]
			continue
		}
		out = append(out, goModLine{fields[0], fields[1:], n + 1})
	}
	if block != "" {
		return nil, fmt.Errorf("unterminated %s block", block)
	}
	for i, d := range out {
		for j, a := range d.args {
			if strings.HasPrefix(a, `"`) || strings.HasPrefix(a, "`") {
				u, err := strconv.Unquote(a)
				if err != nil {
					return nil, fmt.Errorf("line %d: %w", d.line, err)
				}
				out[i].args[j] = u
			}
		}
	}
	return out, nil
}

// CheckGoMod reads kernelDir/go.mod and go.sum directly. Only `module`, `go`, `toolchain` and
// `require` are permitted, and every required module must be listed. Anything else is refused,
// because each one changes what a module path resolves to or brings in code: `replace` swaps the
// code behind an allowed name, `tool` adds a module outside the build, and a directive this checker
// does not know is one it cannot reason about. Every module go.sum names must be listed too. It
// returns the module path for CheckImports.
func CheckGoMod(kernelDir string, allowed map[string]bool) ([]Finding, string, error) {
	src, err := os.ReadFile(filepath.Join(kernelDir, "go.mod"))
	if err != nil {
		return nil, "", err
	}
	lines, err := parseGoMod(src)
	if err != nil {
		return nil, "", fmt.Errorf("go.mod: %w", err)
	}
	var findings []Finding
	modulePath := ""
	for _, d := range lines {
		where := fmt.Sprintf("go.mod:%d", d.line)
		switch d.verb {
		case "module":
			if len(d.args) == 1 {
				modulePath = d.args[0]
			}
		case "go", "toolchain":
		case "require":
			if len(d.args) == 0 || !allowed[d.args[0]] {
				findings = append(findings, Finding{CheckModule, where,
					fmt.Sprintf("requires %s, which is not in ALLOWED_MODULES", strings.Join(d.args, " "))})
			}
		default:
			findings = append(findings, Finding{CheckModule, where,
				fmt.Sprintf("%q directive is not permitted in the kernel's go.mod (%s)", d.verb, strings.Join(d.args, " "))})
		}
	}
	if modulePath == "" {
		return nil, "", errors.New("go.mod: no module directive")
	}

	sum, err := os.ReadFile(filepath.Join(kernelDir, "go.sum"))
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, "", err
	}
	for n, line := range strings.Split(string(sum), "\n") {
		if f := strings.Fields(line); len(f) > 0 && !allowed[f[0]] {
			findings = append(findings, Finding{CheckModule, fmt.Sprintf("go.sum:%d", n+1),
				fmt.Sprintf("names %s, which is not in ALLOWED_MODULES", f[0])})
		}
	}
	return findings, modulePath, nil
}

// standardPackages returns the standard library's package paths as the local go tool knows them.
func standardPackages(ctx context.Context) (map[string]bool, error) {
	out, err := goCommand(ctx, "", nil, "list", "std")
	if err != nil {
		return nil, err
	}
	std := map[string]bool{}
	for _, p := range strings.Fields(string(out)) {
		std[p] = true
	}
	return std, nil
}

// CheckImports parses every .go file under root, tests and every build constraint included, and
// reports each import that is not the standard library, the kernel's own module, or a listed
// module. It reads source rather than a build, so a file built only on some other GOOS, GOARCH or
// tag is checked like any other.
func CheckImports(ctx context.Context, root, modulePath string, allowed map[string]bool) ([]Finding, error) {
	std, err := standardPackages(ctx)
	if err != nil {
		return nil, err
	}
	files, _, err := walkKernel(root)
	if err != nil {
		return nil, err
	}
	var findings []Finding
	for _, f := range files {
		if !strings.HasSuffix(f.rel, ".go") {
			continue
		}
		imports, err := goImports(f.abs)
		if err != nil {
			continue // CheckKernelTree reports a file that does not parse
		}
		for _, imp := range imports {
			if imp == "C" || std[imp] || imp == modulePath || strings.HasPrefix(imp, modulePath+"/") ||
				inAllowedModule(imp, allowed) {
				continue
			}
			findings = append(findings, Finding{CheckModule, f.rel,
				fmt.Sprintf("imports %s, which is neither the standard library nor in ALLOWED_MODULES", imp)})
		}
	}
	return findings, nil
}

type listedModule struct {
	Path    string
	Main    bool
	Replace *struct{ Path, Version string }
}

type listedPackage struct {
	ImportPath string
	Standard   bool
	Module     *listedModule
	Error      *struct{ Err string }
}

// Platforms is the GOOS/GOARCH matrix CheckModules resolves the build on.
var Platforms = [][2]string{{"darwin", "arm64"}, {"darwin", "amd64"}, {"linux", "arm64"}, {"linux", "amd64"}}

var buildTagIdent = regexp.MustCompile(`[A-Za-z0-9_.]+`)

// buildTags returns every identifier used in a build constraint anywhere under root.
func buildTags(root string) ([]string, error) {
	files, _, err := walkKernel(root)
	if err != nil {
		return nil, err
	}
	set := map[string]bool{}
	for _, f := range files {
		if !strings.HasSuffix(f.rel, ".go") {
			continue
		}
		src, err := os.ReadFile(f.abs)
		if err != nil {
			return nil, err
		}
		for _, line := range strings.Split(string(src), "\n") {
			line = strings.TrimSpace(line)
			expr, ok := strings.CutPrefix(line, "//go:build ")
			if !ok {
				expr, ok = strings.CutPrefix(line, "// +build ")
			}
			if ok {
				for _, id := range buildTagIdent.FindAllString(expr, -1) {
					set[id] = true
				}
			}
		}
	}
	tags := make([]string, 0, len(set))
	for t := range set {
		tags = append(tags, t)
	}
	sort.Strings(tags)
	return tags, nil
}

// CheckModules resolves the kernel's build, tests included, with `go list -deps -test -json` on
// every platform in Platforms, with no tags and with every build tag the sources use, and reports
// every package outside the standard library and the main module whose module is not listed or is
// replaced, and every package go list could not resolve.
//
// GOWORK=off keeps a go.work from adding modules; GOFLAGS=-mod=readonly keeps a vendor directory or
// an inherited flag from substituting code. go list failing outright is an error, never a pass.
func CheckModules(ctx context.Context, moduleDir string, allowed map[string]bool) ([]Finding, error) {
	tags, err := buildTags(moduleDir)
	if err != nil {
		return nil, err
	}
	tagSets := []string{""}
	if len(tags) > 0 {
		tagSets = append(tagSets, strings.Join(tags, ","))
	}
	byKey := map[string]Finding{}
	for _, pl := range Platforms {
		for _, ts := range tagSets {
			env := []string{"GOOS=" + pl[0], "GOARCH=" + pl[1], "CGO_ENABLED=1"}
			args := []string{"list", "-e", "-deps", "-test", "-json"}
			if ts != "" {
				args = append(args, "-tags", ts)
			}
			out, err := goCommand(ctx, moduleDir, env, append(args, "./...")...)
			if err != nil {
				return nil, err
			}
			on := pl[0] + "/" + pl[1]
			if ts != "" {
				on += " -tags " + ts
			}
			if err := collectListed(out, allowed, on, byKey); err != nil {
				return nil, err
			}
		}
	}
	findings := make([]Finding, 0, len(byKey))
	for _, f := range byKey {
		findings = append(findings, f)
	}
	sort.Slice(findings, func(i, j int) bool { return findings[i].Where < findings[j].Where })
	return findings, nil
}

func collectListed(out []byte, allowed map[string]bool, on string, byKey map[string]Finding) error {
	dec := json.NewDecoder(bytes.NewReader(out))
	for {
		var p listedPackage
		if err := dec.Decode(&p); errors.Is(err, io.EOF) {
			return nil
		} else if err != nil {
			return fmt.Errorf("decoding go list output: %w", err)
		}
		if p.Error != nil {
			byKey["\x00err "+p.ImportPath] = Finding{CheckModule, p.ImportPath,
				fmt.Sprintf("go list could not resolve it on %s: %s", on, p.Error.Err)}
			continue
		}
		if p.Standard || (p.Module != nil && p.Module.Main) {
			continue
		}
		switch m := p.Module; {
		case m == nil:
			byKey["\x00"+p.ImportPath] = Finding{CheckModule, p.ImportPath, "package belongs to no module (" + on + ")"}
		case !allowed[m.Path]:
			byKey[m.Path] = Finding{CheckModule, m.Path,
				fmt.Sprintf("not in ALLOWED_MODULES (imported as %s on %s)", p.ImportPath, on)}
		case m.Replace != nil:
			byKey[m.Path] = Finding{CheckModule, m.Path,
				fmt.Sprintf("replaced by %s; a replace swaps the code behind the name, so the kernel allows none",
					strings.TrimSpace(m.Replace.Path+" "+m.Replace.Version))}
		}
	}
}

// goCommand runs the go tool with the module environment pinned.
func goCommand(ctx context.Context, dir string, env []string, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, "go", args...)
	cmd.Dir = dir
	cmd.Env = append(append(os.Environ(), "GOWORK=off", "GOFLAGS=-mod=readonly"), env...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("go %s: %w\n%s", strings.Join(args, " "), err, strings.TrimSpace(stderr.String()))
	}
	return out, nil
}
