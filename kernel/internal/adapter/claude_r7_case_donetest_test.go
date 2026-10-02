//go:build donetest

// Round-7 addendum for B1-06: case-variant tool names. Closes the OPEN raised by r7
// (DR-B1-06-ADAPTER-RULINGS, "Also frozen by r7"). Rule pinned by the orchestrator, 2026-10-02,
// fail-safe: the CLI matches tool names case-sensitively (evidence in claude_r7_donetest_test.go),
// so a rule spelled "bash" or "BASH" names no tool. As a forbid it is a deny the founder believes
// is in force and is not; as an allow it is a grant that silently grants nothing. Either way it
// is ErrSpec. claude_r7_donetest_test.go and every earlier file are unchanged.
// Registered in build/done-tests/B1-06.yml (re-freeze "2026-10-02 r7 case-variant tool names").
// Run: go -C kernel test -count=1 -tags donetest -run B1_06 ./internal/adapter/
package adapter

import (
	"strings"
	"testing"
)

// ---- A rule whose tool name equals a known tool case-insensitively but not exactly is ErrSpec,
// in the allowed list and in the forbidden list, funded or not, bare or with an argument.
// Known tools pinned here: Bash, Read, Edit, Write, WebFetch; and the mcp__ prefix, whose case
// the CLI matches exactly too (an MCP rule spelled MCP__x__y names no MCP tool). ----

func TestB1_06_R7_CaseVariantToolNamesRefused(t *testing.T) {
	c := NewClaude(claudeDigest)
	variants := []string{
		"bash", "BASH", "bAsh", "bash(git diff:*)", "BASH(*)",
		"read", "READ", "read(src/**)",
		"edit", "EDIT", "eDit(src/**)",
		"write", "WRITE", "wRITE(*)",
		"webfetch", "WEBFETCH", "Webfetch", "WebFETCH(domain:example.com)",
		"MCP__tracker__create_issue", "Mcp__docs__search", "mCp__tracker__list_issues(*)",
	}
	for _, rule := range variants {
		t.Run(rule, func(t *testing.T) {
			for _, funded := range []bool{false, true} {
				argvRefused(t, c, funded, []string{"Read", rule}, []string{"WebFetch"})
				argvRefused(t, c, funded, []string{"Grep"}, []string{"WebFetch", rule})
			}
		})
	}
}

// Paired controls: the exact names still pass in both lists, and names that are not a case
// variant of a known tool (a longer name, an unknown tool, an exact mcp__ name) are untouched,
// so the refusals above are about case and nothing else.
func TestB1_06_R7_ExactToolNamesStillPass(t *testing.T) {
	c := NewClaude(claudeDigest)
	for _, tc := range []struct{ allowed, forbidden []string }{
		{[]string{"Bash", "Read", "Edit", "Write"}, []string{"WebFetch"}},
		{[]string{"Read", "Bash(git diff:*)", "Read(src/**)", "Edit(src/**)"}, []string{"WebFetch(domain:example.com)", "Bash(rm:*)"}},
		{[]string{"Read", "mcp__tracker__create_issue", "mcp__docs__search(*)"}, []string{"WebFetch", "mcp__tracker__list_issues"}},
		{[]string{"Read", "Bashful", "ReadMe", "SomeNewTool"}, []string{"WebFetchX", "Writer"}},
		{[]string{"Read", "bashful", "readme"}, []string{"webfetcher", "writer"}}, // longer names, any case

		{[]string{"Read", "mcpx__tool"}, []string{"WebFetch", "mcp_tracker"}},
	} {
		s := spec()
		s.ToolLease = ToolLease{Allowed: tc.allowed, Forbidden: tc.forbidden}
		argv, err := c.Argv(s)
		if err != nil {
			t.Errorf("allowed %q forbidden %q: Argv: %v, want success", tc.allowed, tc.forbidden, err)
			continue
		}
		if got := slot(t, argv, "--allowedTools"); got != strings.Join(tc.allowed, ",") {
			t.Errorf("allowed %q: --allowedTools %q", tc.allowed, got)
		}
	}
}
