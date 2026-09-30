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
	"sort"
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

type listedModule struct {
	Path    string
	Main    bool
	Replace *struct{ Path, Version string }
}

type listedPackage struct {
	ImportPath string
	Standard   bool
	Module     *listedModule
}

// CheckModules runs `go list -deps -test -json ./...` in moduleDir and reports every non-stdlib
// module outside the main module that is not in allowed, and every replaced module.
//
// The environment is pinned so the answer is the go.mod's and nobody else's: GOWORK=off keeps a
// go.work from adding modules, and GOFLAGS=-mod=readonly keeps a vendor directory or an inherited
// flag from substituting code. go list failing (an import no go.mod requires, say) is an error.
func CheckModules(ctx context.Context, moduleDir string, allowed map[string]bool) ([]Finding, error) {
	cmd := exec.CommandContext(ctx, "go", "list", "-deps", "-test", "-json", "./...")
	cmd.Dir = moduleDir
	cmd.Env = append(os.Environ(), "GOWORK=off", "GOFLAGS=-mod=readonly")
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("go list in %s: %w\n%s", moduleDir, err, strings.TrimSpace(stderr.String()))
	}

	byModule := map[string]Finding{}
	dec := json.NewDecoder(bytes.NewReader(out))
	for {
		var p listedPackage
		if err := dec.Decode(&p); errors.Is(err, io.EOF) {
			break
		} else if err != nil {
			return nil, fmt.Errorf("decoding go list output: %w", err)
		}
		if p.Standard || (p.Module != nil && p.Module.Main) {
			continue
		}
		switch m := p.Module; {
		case m == nil:
			byModule["\x00"+p.ImportPath] = Finding{CheckModule, p.ImportPath, "package belongs to no module"}
		case !allowed[m.Path]:
			byModule[m.Path] = Finding{CheckModule, m.Path,
				fmt.Sprintf("not in ALLOWED_MODULES (imported as %s)", p.ImportPath)}
		case m.Replace != nil:
			byModule[m.Path] = Finding{CheckModule, m.Path,
				fmt.Sprintf("replaced by %s; a replace swaps the code behind the name, so the kernel allows none",
					strings.TrimSpace(m.Replace.Path+" "+m.Replace.Version))}
		}
	}

	findings := make([]Finding, 0, len(byModule))
	for _, f := range byModule {
		findings = append(findings, f)
	}
	sort.Slice(findings, func(i, j int) bool { return findings[i].Where < findings[j].Where })
	return findings, nil
}
