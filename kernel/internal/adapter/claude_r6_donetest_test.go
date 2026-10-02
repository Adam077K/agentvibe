//go:build donetest

// Round-6 done-tests for B1-06, after the Opus re-review PASSED the implementation at a90071b
// and found one contract gap, decided by founder ruling F (2026-10-02, DR-B1-06-ADAPTER-RULINGS).
// claude_donetest_test.go is re-frozen in the same round: two funded-team assertions that
// required Task forbidden beside an allowed Agent contradict ruling F and now require the
// opposite. claude_r4/r5 and the 14 fixtures are unchanged; r6 adds no fixture.
// Registered in build/done-tests/B1-06.yml (re-freeze r6).
// Run: go -C kernel test -count=1 -tags donetest -run B1_06 ./internal/adapter/
package adapter

import (
	"errors"
	"strings"
	"testing"
)

var (
	backslash = string(rune(92))
	ctrl      = func(n int) string { return string(rune(n)) }
)

// blocks reports whether a disallow rule f would deny the allowed nested-agent rule a, with
// Task and Agent as one tool (ruling F): a bare Agent or Task denies every use; an argument form
// denies the same argument.
func blocks(f, a string) bool {
	fb, farg, _ := strings.Cut(f, "(")
	ab, aarg, _ := strings.Cut(a, "(")
	nested := func(b string) bool { return strings.EqualFold(b, "Agent") || strings.EqualFold(b, "Task") }
	if !nested(fb) || !nested(ab) {
		return false
	}
	return farg == "" || farg == aarg
}

// ---- r6 item 1. Founder ruling F (2026-10-02): Task is an alias of Agent; one rule covers both
// names. Unfunded, both are forbidden. Funded, the approved Agent(x) form is allowed, and the
// CLI maps Task to Agent, so a forbidden Task (or Agent) would deny it. Task(x) is Agent(x). ----

func TestB1_06_R6_TaskIsAnAliasOfAgent(t *testing.T) {
	c := NewClaude(claudeDigest)

	t.Run("funded: no disallow blocks an allowed Agent(x) or Task(x)", func(t *testing.T) {
		for _, allowed := range [][]string{
			{"Read", "Agent(reviewer)"},
			{"Read", "Task(tester)"},
			{"Read", "Agent(reviewer)", "Task(tester)"},
			{"Read", "Agent(reviewer)", "Bash(git diff:*)"},
		} {
			s := spec()
			s.FundedTeam = true
			s.ToolLease = ToolLease{Allowed: allowed, Forbidden: []string{"WebFetch"}}
			argv, err := c.Argv(s)
			if err != nil {
				t.Errorf("funded %q: Argv: %v, want success", allowed, err)
				continue
			}
			forbidden := strings.Split(slot(t, argv, "--disallowedTools"), ",")
			for _, a := range allowed {
				for _, f := range forbidden {
					if blocks(f, a) {
						t.Errorf("funded %q: --disallowedTools %q holds %q, which denies %q", allowed, forbidden, f, a)
					}
				}
			}
			if !strings.Contains(slot(t, argv, "--allowedTools"), allowed[1]) {
				t.Errorf("funded %q: --allowedTools %q lost %q", allowed, slot(t, argv, "--allowedTools"), allowed[1])
			}
		}
	})

	t.Run("funded: an explicit forbid that blocks an allowed rule never yields such an argv", func(t *testing.T) {
		for _, tc := range []struct{ allowed, forbidden string }{
			{"Agent(reviewer)", "Task"},
			{"Agent(reviewer)", "Agent"},
			{"Agent(reviewer)", "Task(reviewer)"},
			{"Task(tester)", "Agent(tester)"},
			{"Task(tester)", "Agent"},
		} {
			s := spec()
			s.FundedTeam = true
			s.ToolLease = ToolLease{Allowed: []string{"Read", tc.allowed}, Forbidden: []string{"WebFetch", tc.forbidden}}
			argv, err := c.Argv(s)
			if err != nil {
				if !errors.Is(err, ErrSpec) {
					t.Errorf("allowed %q forbidden %q: %v, want ErrSpec", tc.allowed, tc.forbidden, err)
				}
				continue
			}
			for _, f := range strings.Split(slot(t, argv, "--disallowedTools"), ",") {
				if blocks(f, tc.allowed) {
					t.Errorf("allowed %q forbidden %q: argv denies the allowed rule through %q; want ErrSpec", tc.allowed, tc.forbidden, f)
				}
			}
		}
	})

	t.Run("unfunded: both names are forbidden, and neither form may be allowed", func(t *testing.T) {
		s := spec()
		s.ToolLease = ToolLease{Allowed: []string{"Read"}, Forbidden: []string{"WebFetch"}}
		argv, err := c.Argv(s)
		if err != nil {
			t.Fatalf("Argv: %v", err)
		}
		forbidden := strings.Split(slot(t, argv, "--disallowedTools"), ",")
		for _, n := range []string{"Agent", "Task"} {
			found := false
			for _, f := range forbidden {
				found = found || f == n
			}
			if !found {
				t.Errorf("unfunded: --disallowedTools %q lacks bare %s", forbidden, n)
			}
		}
		for _, rule := range []string{"Agent", "Task", "Agent(reviewer)", "Task(reviewer)", "Task(tester)"} {
			argvRefused(t, c, false, []string{"Read", rule}, []string{"WebFetch"})
		}
	})
}

// ---- r6 item 2 (LOW). The CLI ignores a rule such as Bash(x\) whose argument it cannot read,
// so a forbidden rule written that way is silently void. Pinned: a backslash anywhere in a tool
// rule is ErrSpec, in either list, funded or not. ----

func TestB1_06_R6_BackslashRefused(t *testing.T) {
	c := NewClaude(claudeDigest)
	for _, rule := range []string{
		"Bash(x" + backslash + ")",
		"Bash(rm -rf" + backslash + ")",
		"Bash(a" + backslash + "b)",
		"Bash(" + backslash + "x)",
		"Read" + backslash,
		"Agent(reviewer" + backslash + ")",
	} {
		for _, funded := range []bool{false, true} {
			argvRefused(t, c, funded, []string{"Read", rule}, []string{"WebFetch"})
			argvRefused(t, c, funded, []string{"Read"}, []string{"WebFetch", rule})
		}
	}
}

// ---- r6 item 3. Mutants the re-review found alive. ----

// An empty argument: Bash() is refused, in either list; it is never read as all of Bash.
func TestB1_06_R6_EmptyArgumentRefused(t *testing.T) {
	c := NewClaude(claudeDigest)
	for _, rule := range []string{"Bash()", "Read()", "Agent()", "Task()"} {
		for _, funded := range []bool{false, true} {
			argvRefused(t, c, funded, []string{"Read", rule}, []string{"WebFetch"})
			argvRefused(t, c, funded, []string{"Read"}, []string{"WebFetch", rule})
		}
	}
}

// A control character inside an argument (not whitespace, so the space checks do not see it).
func TestB1_06_R6_ControlCharacterInArgumentRefused(t *testing.T) {
	c := NewClaude(claudeDigest)
	for _, n := range []int{1, 7, 8, 27, 31, 127} {
		for _, rule := range []string{"Bash(git" + ctrl(n) + "diff:*)", "Bash(" + ctrl(n) + "x)", "Bash(x" + ctrl(n) + ")"} {
			argvRefused(t, c, true, []string{"Read", rule}, []string{"WebFetch"})
			argvRefused(t, c, false, []string{"Read"}, []string{"WebFetch", rule})
		}
	}
}

// A permission_denials entry that is not an object with a string tool_name leaves the result
// mistyped: unresolved(unparsed), never adjudicated (09a §8.8; the entry-level twin of r4's
// "permission_denials is mistyped").
func TestB1_06_R6_PermissionDenialEntryChecked(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	success := lines(fixture(t, "success.jsonl"))
	last := len(success) - 1
	entries := map[string]any{
		"an entry with no tool_name":     map[string]any{"tool_use_id": "toolu_03Web"},
		"tool_name a number":             map[string]any{"tool_name": 7, "tool_use_id": "toolu_03Web"},
		"tool_name null":                 map[string]any{"tool_name": nil},
		"an entry that is a number":      42,
		"an entry that is a string":      "WebFetch",
		"tool_name under a variant key":  map[string]any{"Tool_Name": "WebFetch"},
		"an entry that is an empty list": []any{},
	}
	for name, entry := range entries {
		t.Run(name, func(t *testing.T) {
			m := decode(t, success[last])
			m["permission_denials"] = []any{map[string]any{"tool_name": "WebFetch", "tool_use_id": "toolu_03Web"}, entry}
			w := watch(c, join(replaced(success, last, encode(t, m))), expect)
			if w.err != nil || len(w.reasons) != 0 {
				t.Fatalf("Watch = %v, aborts %v", w.err, w.reasons)
			}
			if o := c.Classify(w.tr, ExitInfo{}); o.Status != Unresolved || o.Reason != ReasonUnparsed || len(o.Output) != 0 {
				t.Errorf("Classify = %s(%s) output %s; want unresolved(unparsed)", o.Status, o.Reason, o.Output)
			}
		})
	}
}
