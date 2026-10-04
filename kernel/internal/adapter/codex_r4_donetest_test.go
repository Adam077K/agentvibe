//go:build donetest

// Round-4 done-tests for B1-07, after the Opus review FAILED 763ed2c with two HIGH findings,
// measured on codex-cli 0.154.0: MCP servers from the user config survive the profile's
// `mcp_servers = {}` (one was launched), and when the user config trusts the repo,
// <worktree>/.codex/config.toml overrides the profile (network on, an MCP server launched).
//
// Founder ruling, 2026-10-03 (AskUserQuestion), superseding the profile approach: always pass
// --ignore-user-config; no -p and no profile file; every locked setting is a -c on the argv; pin
// the sha256 of the whole argv and of the codex binary, any difference being ErrSpec.
//
// Measured before this freeze (DR-B1-07 "Round 4"), throwaway HOME and CODEX_HOME holding a user
// config with an MCP server and project trust, plus a hostile <worktree>/.codex/config.toml:
//   - control, no flags: both MCP servers started; the project's model and network applied;
//   - the locked line (this file's cxTokens, plus --strict-config): neither MCP server started;
//     the project config was not applied (default model); the banner read
//     `approval: never`, `sandbox: workspace-write [workdir]` (no /tmp, no network);
//   - auth is still read from CODEX_HOME under --ignore-user-config: with a FAKE API key the
//     server answered `invalid_api_key` (the key was sent); with none, `Missing bearer`.
//
// So a .codex/config.toml in the worktree is proven ignored; this file does not refuse it.
//
// codex_profile.go is dead code under this ruling: the implementer deletes it.
// Hashed in build/done-tests/B1-07.yml. Run: go -C kernel test -count=1 -tags donetest -run B1_07 ./internal/adapter/
package adapter

import (
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

// cxLocked: the 16 locked settings (r5: features={} is replaced by one pin per feature, codex_r5_donetest_test.go), key -> the value the argv pins (DR-B1-07 "Round 4").
var cxLocked = map[string]string{
	"approval_policy":                                `"never"`,
	"approvals_reviewer":                             `"user"`,
	"sandbox_mode":                                   `"workspace-write"`,
	"sandbox_workspace_write.network_access":         `false`,
	"sandbox_workspace_write.writable_roots":         `[]`,
	"sandbox_workspace_write.exclude_tmpdir_env_var": `true`,
	"sandbox_workspace_write.exclude_slash_tmp":      `true`,
	"shell_environment_policy.inherit":               `"core"`,
	"mcp_servers":                                    `{}`,
	"web_search":                                     `"disabled"`,
	"model_provider":                                 `"openai"`,
	"model_providers":                                `{}`,
	"notify":                                         `[]`,
	"hooks":                                          `{}`,
	"tools":                                          `{}`,
	"projects":                                       `{}`,
}

// cxArgvDigest is the launcher's ArgvTemplate digest: sha256 over the tokens joined by NUL.
func cxArgvDigest(tokens []string) string { return cxSHA(strings.Join(tokens, "\x00")) }

func TestB1_07_R4_LockedLine(t *testing.T) {
	tmpl := NewCodex(cxDigest).Template()
	argv := cxArgv(t, cxSpec())
	for name, a := range map[string][]string{"Template": tmpl, "Argv": argv} {
		count := func(tok string) int {
			n := 0
			for _, x := range a {
				if x == tok {
					n++
				}
			}
			return n
		}
		if count("--ignore-user-config") != 1 || count("--ignore-rules") != 1 {
			t.Errorf("%s must carry --ignore-user-config and --ignore-rules once each: %q", name, a)
		}
		for _, bad := range []string{"-p", "--profile", "<profile>"} {
			if count(bad) != 0 || slices.ContainsFunc(a, func(x string) bool { return strings.HasPrefix(x, bad+"=") }) {
				t.Errorf("%s carries %q: there is no profile since round 4", name, bad)
			}
		}
		got := map[string]string{}
		for i, x := range a {
			if x != "-c" {
				continue
			}
			if i+1 >= len(a) {
				t.Fatalf("%s ends with a bare -c", name)
			}
			k, v, ok := strings.Cut(a[i+1], "=")
			if _, dup := got[k]; !ok || dup {
				t.Errorf("%s: -c %q is not one new key=value", name, a[i+1])
			}
			got[k] = v
		}
		if len(got) != len(cxLocked) {
			t.Errorf("%s sets %d -c keys, want exactly the %d locked ones", name, len(got), len(cxLocked))
		}
		for k, v := range cxLocked {
			if got[k] != v {
				t.Errorf("%s: -c %s=%q, want %q", name, k, got[k], v)
			}
		}
	}
}

// The whole argv template is pinned (init_expect) as is the binary; any drift is ErrSpec.
func TestB1_07_R4_ArgvAndBinaryPinned(t *testing.T) {
	s := cxSpec()
	if s.InitExpect != cxArgvDigest(NewCodex(cxDigest).Template()) {
		t.Fatalf("the base spec's pin is not the template's digest")
	}
	cxArgv(t, s)
	at := func(tokens []string, i int, v ...string) []string {
		out := slices.Clone(tokens[:i])
		out = append(out, v...)
		return append(out, tokens[i:]...)
	}
	set := func(tokens []string, from, to string) []string {
		out := slices.Clone(tokens)
		out[slices.Index(out, from)] = to
		return out
	}
	n := len(cxTokens)
	for name, tokens := range map[string][]string{
		"an extra -c":              at(cxTokens, n, "-c", `model="gpt-6-astra"`),
		"a changed -c value":       set(cxTokens, "sandbox_workspace_write.network_access=false", "sandbox_workspace_write.network_access=true"),
		"a -c removed":             slices.Delete(slices.Clone(cxTokens), n-2, n),
		"two -c swapped":           append(slices.Clone(cxTokens[:n-4]), cxTokens[n-2], cxTokens[n-1], cxTokens[n-4], cxTokens[n-3]),
		"-p back in":               at(cxTokens, 5, "-p", "<profile>"),
		"no --ignore-user-config":  slices.DeleteFunc(slices.Clone(cxTokens), func(x string) bool { return x == "--ignore-user-config" }),
		"an extra --strict-config": at(cxTokens, n, "--strict-config"),
		"the old r3 line":          []string{"exec", "-C", "<worktree>", "-s", "workspace-write", "-p", "<profile>", "--json", "--output-schema", "<f>", "-o", "<result.json>", "--ephemeral", "--ignore-rules"},
	} {
		s := cxSpec()
		s.InitExpect = cxArgvDigest(tokens)
		cxRefused(t, "pin of "+name, s, ErrSpec)
	}
	b := cxSpec()
	b.BinaryDigest = "sha256:" + strings.Repeat("9", 64)
	cxRefused(t, "another binary", b, ErrSpec)
}

// A spec carrying a profile field was built for the superseded line: refused, not dropped.
func TestB1_07_R4_ProfileFieldsRefused(t *testing.T) {
	for name, set := range map[string]func(*LaunchSpec){
		"CodexProfile":     func(s *LaunchSpec) { s.CodexProfile = "project" },
		"CodexProfileTOML": func(s *LaunchSpec) { s.CodexProfileTOML = "approval_policy = \"never\"\n" },
		"ProfileDigest":    func(s *LaunchSpec) { s.ProfileDigest = cxPin },
	} {
		s := cxSpec()
		set(&s)
		cxRefused(t, name, s, ErrSpec)
	}
}

// :227: a dangling symlink cannot be resolved, so it is never taken for a path that does not
// exist yet: as CODEX_HOME, HOME, -C or the worktree itself it is ErrSpec.
func TestB1_07_R4_DanglingSymlinkRefused(t *testing.T) {
	dir, wt := cxR3Dirs(t)
	into := filepath.Join(dir, "dangle-into")
	cxR3Symlink(t, filepath.Join(wt, "not-yet"), into) // points into the worktree, at nothing
	out := filepath.Join(dir, "dangle-out")
	cxR3Symlink(t, filepath.Join(dir, "nowhere"), out)
	inside := filepath.Join(wt, "dangle")
	cxR3Symlink(t, "/nonexistent-agentvibe-target", inside)

	for name, s := range map[string]LaunchSpec{
		"CODEX_HOME dangling into the worktree": func() LaunchSpec {
			s := cxR3Spec(wt)
			s.CodexHome, s.Env = into, map[string]string{"CODEX_HOME": into}
			return s
		}(),
		"CODEX_HOME dangling elsewhere": func() LaunchSpec {
			s := cxR3Spec(wt)
			s.CodexHome, s.Env = out, map[string]string{"CODEX_HOME": out}
			return s
		}(),
		"HOME dangling into the worktree": func() LaunchSpec {
			s := cxR3Spec(wt)
			s.Home, s.Env = into, map[string]string{"HOME": into}
			return s
		}(),
		"-C a dangling symlink in the worktree": func() LaunchSpec {
			s := cxR3Spec(wt)
			s.Cwd = inside
			return s
		}(),
		"-C under a dangling symlink in the worktree": func() LaunchSpec {
			s := cxR3Spec(wt)
			s.Cwd = filepath.Join(inside, "sub")
			return s
		}(),
		"worktree a dangling symlink": cxR3Spec(out),
	} {
		cxRefused(t, name, s, ErrSpec)
	}
	// Controls: a path that does not exist yet, under real directories, is still accepted.
	s := cxR3Spec(wt)
	s.CodexHome = filepath.Join(dir, "codex-home-later")
	s.Env = map[string]string{"CODEX_HOME": s.CodexHome}
	cxArgv(t, s)
	if _, err := os.Lstat(s.CodexHome); !os.IsNotExist(err) {
		t.Fatalf("control path exists: %v", err)
	}
}
