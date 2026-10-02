//go:build donetest

// Round-7 done-tests for B1-06, after the Opus re-review PASSED b3cc99d and found one MED gap.
// Rounds 1-6 and the 14 fixtures are unchanged; r7 adds no fixture.
// Registered in build/done-tests/B1-06.yml (re-freeze r7).
// Run: go -C kernel test -count=1 -tags donetest -run B1_06 ./internal/adapter/
//
// CLI evidence, read 2026-10-02 from the installed binaries' embedded source (strings of
// ~/.local/share/claude/versions/2.1.284 and 2.1.287; no CLI process was run):
//   - the rule parser returns the bare tool when the argument is "" or "*":
//     if(n.rawContent===""||n.rawContent==="*")return{toolName:Zl(n.toolName)}
//   - tool names match case-sensitively: the alias table is an exact-key lookup
//     (c={Task:"Agent",...}; Object.hasOwn(c,e)), the matcher compares with ===
//     (if(n.ruleValue.toolName===h)return!0), and the glob fallback builds its RegExp with
//     flags "s" or "su", never "i". So "agent" or "TASK(*)" denies no tool at all.
package adapter

import (
	"errors"
	"strings"
	"testing"
)

// ---- r7 item 1 (MED). The CLI reads Tool(*) as the bare Tool, for every tool. Ruling F: a
// forbid that would deny an allowed Agent/Task rule is ErrSpec, so Task(*) and Agent(*) are
// such forbids. Wherever the adapter compares rules, X(*) behaves exactly like X. ----

func TestB1_06_R7_StarArgumentIsTheBareTool(t *testing.T) {
	c := NewClaude(claudeDigest)

	t.Run("funded: Agent(x) with Task(*) or Agent(*) forbidden is ErrSpec", func(t *testing.T) {
		for _, allowed := range []string{"Agent(reviewer)", "Task(tester)", "Agent", "Task"} {
			for _, forbid := range []string{"Task(*)", "Agent(*)"} {
				argvRefused(t, c, true, []string{"Read", allowed}, []string{"WebFetch", forbid})
			}
		}
	})

	t.Run("unfunded: Agent(*) and Task(*) are refused", func(t *testing.T) {
		for _, rule := range []string{"Agent(*)", "Task(*)"} {
			argvRefused(t, c, false, []string{"Read", rule}, []string{"WebFetch"})
		}
	})

	// The outcome of a lease holding X(*) equals the outcome of the same lease holding X:
	// success, or ErrSpec, the same way, for every tool.
	type lease struct {
		funded             bool
		allowed, forbidden []string
	}
	outcome := func(l lease) (bool, string) {
		s := spec()
		s.FundedTeam = l.funded
		s.ToolLease = ToolLease{Allowed: l.allowed, Forbidden: l.forbidden}
		argv, err := c.Argv(s)
		if err != nil {
			if !errors.Is(err, ErrSpec) {
				return false, "unexpected error: " + err.Error()
			}
			return false, "ErrSpec"
		}
		return true, slot(t, argv, "--allowedTools")
	}
	pairs := []struct {
		name       string
		star, bare lease
	}{
		{"Bash(*) allowed and Bash forbidden",
			lease{false, []string{"Read", "Bash(*)"}, []string{"Bash"}},
			lease{false, []string{"Read", "Bash"}, []string{"Bash"}}},
		{"Bash allowed and Bash(*) forbidden",
			lease{false, []string{"Read", "Bash"}, []string{"Bash(*)"}},
			lease{false, []string{"Read", "Bash"}, []string{"Bash"}}},
		{"Read(*) allowed and Read forbidden",
			lease{false, []string{"Grep", "Read(*)"}, []string{"Read"}},
			lease{false, []string{"Grep", "Read"}, []string{"Read"}}},
		{"WebFetch(*) on both lists",
			lease{false, []string{"Read", "WebFetch(*)"}, []string{"WebFetch(*)"}},
			lease{false, []string{"Read", "WebFetch"}, []string{"WebFetch"}}},
		{"funded Agent(*) allowed, Agent forbidden",
			lease{true, []string{"Read", "Agent(*)"}, []string{"WebFetch", "Agent"}},
			lease{true, []string{"Read", "Agent"}, []string{"WebFetch", "Agent"}}},
		{"funded Agent(x) allowed, Task(*) forbidden",
			lease{true, []string{"Read", "Agent(x)"}, []string{"WebFetch", "Task(*)"}},
			lease{true, []string{"Read", "Agent(x)"}, []string{"WebFetch", "Task"}}},
	}
	for _, p := range pairs {
		t.Run("X(*) is X: "+p.name, func(t *testing.T) {
			okStar, gotStar := outcome(p.star)
			okBare, gotBare := outcome(p.bare)
			if okStar != okBare || (!okStar && gotStar != gotBare) {
				t.Errorf("with (*): ok=%v %q; bare: ok=%v %q; want the same outcome", okStar, gotStar, okBare, gotBare)
			}
		})
	}
	// Paired control: a real argument is not the bare tool.
	s := spec()
	s.ToolLease = ToolLease{Allowed: []string{"Read", "Bash(git diff:*)"}, Forbidden: []string{"WebFetch", "Bash(rm:*)"}}
	if _, err := c.Argv(s); err != nil {
		t.Errorf("control, Bash(git diff:*) allowed and Bash(rm:*) forbidden: %v, want success", err)
	}
}

// ---- r7 item 2. The CLI matches tool names case-sensitively (evidence above), so a forbid
// spelled "agent" or "TASK(*)" denies nothing: it is silently void, which r6 rules out for
// forbids ("a forbidden rule can never be silently void"). Ruling B already folds case on the
// allowed side. Pinned here, on the forbid side, where it meets ruling F: for a funded team
// allowed a nested-agent rule, a case-variant Agent/Task forbid that names the same rule is
// ErrSpec - it is not passed through as if it protected anything. This kills the exact-name
// mutant at claude.go:150 (b3cc99d), which the re-review asked to be pinned or shown
// equivalent; it is not equivalent under r6. ----

func TestB1_06_R7_CaseVariantNestedForbidRefused(t *testing.T) {
	c := NewClaude(claudeDigest)
	for _, allowed := range []string{"Agent(reviewer)", "Agent"} {
		for _, forbid := range []string{"agent", "AGENT", "task", "tAsK", "agent(reviewer)", "TASK(*)"} {
			if strings.Contains(forbid, "(") && !strings.Contains(forbid, "*") && !strings.Contains(allowed, "(") {
				continue // a named forbid against a bare allow names a different rule
			}
			argvRefused(t, c, true, []string{"Read", allowed}, []string{"WebFetch", forbid})
		}
	}
}
