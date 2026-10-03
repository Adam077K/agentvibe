//go:build donetest

// Round-5 done-tests for B1-06, added after the Opus re-review of the implementation at a8ea780
// (FAILED). Rounds 1-4 (claude_donetest_test.go, claude_r4_donetest_test.go) and the 14 fixtures
// are unchanged; this file reuses their helpers and adds no fixture (NothingElseAdjudicates pins
// the count). Registered in build/done-tests/B1-06.yml (re-freeze r5).
// Run: go -C kernel test -count=1 -tags donetest -run B1_06 ./internal/adapter/
package adapter

import (
	"bytes"
	"errors"
	"slices"
	"strings"
	"testing"
)

// argvRefused asserts Argv refuses a lease, funded or not as given.
func argvRefused(t *testing.T, c *Claude, funded bool, allowed, forbidden []string) {
	t.Helper()
	s := spec()
	s.FundedTeam = funded
	s.ToolLease = ToolLease{Allowed: allowed, Forbidden: forbidden}
	if argv, err := c.Argv(s); !errors.Is(err, ErrSpec) || argv != nil {
		t.Errorf("funded=%v allowed=%q forbidden=%q: Argv = %q, %v; want nil, ErrSpec", funded, allowed, forbidden, argv, err)
	}
}

// ---- r5 item 1 (HIGH, security). Founder ruling B (DR-B1-06-ADAPTER-RULINGS): one element is one
// tool rule. The installed CLI (2.1.287, measured by the re-review) splits a tool list with a
// boolean in-parentheses flag, not a depth counter, so a nested parenthesis closes the rule early:
// "Read(a(b) Bash c)" becomes a bare Bash grant, unfunded, and "Bash(echo (x) Agent y)" a bare
// Agent grant, funded. Fail-safe rule pinned here: a rule has at most ONE parenthesised argument,
// containing no parenthesis and no comma; whitespace in it is only what the frozen canon permits
// (r3, DR note: "A rule with an inner space, Bash(git diff:*), is one name"), read as single ASCII
// spaces between non-space characters. Everything else is ErrSpec.

func TestB1_06_R5_NestedParenthesesRefused(t *testing.T) {
	c := NewClaude(claudeDigest)
	exploits := []struct {
		name   string
		funded bool
		rule   string
	}{
		{"review exploit: bare Bash, unfunded", false, "Read(a(b) Bash c)"},
		{"review exploit: bare Agent, funded", true, "Bash(echo (x) Agent y)"},
		{"bare Agent, unfunded", false, "Read(a(b) Agent c)"},
		{"bare Task, funded", true, "Read(a(b) Task c)"},
		{"no spaces around the inner group", false, "Read(a(b)Bash)"},
		{"inner group at the start", false, "Bash((x) Agent)"},
		{"inner group at the end", true, "Bash(echo Agent (x))"},
		{"two inner groups", true, "Bash(a(b) Agent (c) d)"},
		{"doubled parentheses", false, "Read((x))"},
		{"empty inner group", false, "Bash(echo () Agent)"},
		{"unbalanced, extra open", true, "Bash(echo (Agent)"},
		{"an Agent rule with an inner group", true, "Agent(reviewer(x) Bash)"},
	}
	for _, e := range exploits {
		t.Run(e.name, func(t *testing.T) {
			argvRefused(t, c, e.funded, []string{"Read", e.rule}, []string{"WebFetch"})
			argvRefused(t, c, !e.funded, []string{"Read", e.rule}, []string{"WebFetch"})
			argvRefused(t, c, e.funded, []string{"Read"}, []string{"WebFetch", e.rule})
		})
	}
	// Whitespace in an argument beyond the canon's single interior spaces.
	for _, rule := range []string{"Bash( git diff:*)", "Bash(git diff:* )", "Bash(git  diff:*)", "Bash( )", "Bash(git\tdiff:*)"} {
		argvRefused(t, c, true, []string{"Read", rule}, []string{"WebFetch"})
	}
	// A comma inside the argument is refused too (frozen since r2; restated with an Agent grant).
	argvRefused(t, c, true, []string{"Read", "Bash(echo x,Agent)"}, []string{"WebFetch"})

	// Paired controls: the frozen canon's forms still pass, so the refusals above are about
	// nesting and whitespace, not about parentheses at all.
	for _, rules := range [][]string{
		{"Read", "Bash(git diff:*)"},
		{"Read", "Bash(npm run test:*)"},
		{"Read", "Agent(reviewer)"},
		{"Read", "Bash(echo x Agent y)"}, // one level: the CLI keeps it as one rule
	} {
		s := spec()
		s.FundedTeam = true
		s.ToolLease = ToolLease{Allowed: rules, Forbidden: []string{"WebFetch"}}
		argv, err := c.Argv(s)
		if err != nil {
			t.Errorf("control %q: Argv: %v, want success", rules, err)
			continue
		}
		if got := strings.Split(slot(t, argv, "--allowedTools"), ","); !slices.Equal(got, rules) {
			t.Errorf("control %q: --allowedTools %q", rules, got)
		}
	}
}

// ---- r5 item 2 (LOW). The CLI emits JSON from JavaScript, where keys are case-sensitive; Go's
// encoding/json matches struct tags case-insensitively and lets a later key win. Pinned: keys are
// matched exactly. A case-variant key never decides an outcome: it is not the field, and it never
// overrides the exact field, in system/init or in a result. Each case must abort or stay
// unresolved; none may adjudicate, and none may take the variant's value. ----

func TestB1_06_R5_KeysAreMatchedExactly(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	success := lines(fixture(t, "success.jsonl"))
	ii := initIndex(t, success)
	last := len(success) - 1
	// raw edits keep key order and duplicates, which a map round-trip would lose.
	edit := func(l []byte, from, to string) []byte {
		if !bytes.Contains(l, []byte(from)) {
			t.Fatalf("fixture drift: %q not in line", from)
		}
		return bytes.Replace(l, []byte(from), []byte(to), 1)
	}

	t.Run("init: the mode under a case-variant key only", func(t *testing.T) {
		l := edit(success[ii], `"permissionMode":"dontAsk"`, `"permissionmode":"dontAsk"`)
		tr := mustAbortBeforeToolCall(t, c, replaced(success, ii, l), ii+1, expect)
		mustNotAdjudicateHarness(t, c, tr)
	})
	t.Run("init: exact mode bypassPermissions, a later variant says dontAsk", func(t *testing.T) {
		l := edit(success[ii], `"permissionMode":"dontAsk"`, `"permissionMode":"bypassPermissions","PermissionMode":"dontAsk"`)
		tr := mustAbortBeforeToolCall(t, c, replaced(success, ii, l), ii+1, expect)
		mustNotAdjudicateHarness(t, c, tr)
	})
	t.Run("init: exact mode bypassPermissions, an earlier variant says dontAsk", func(t *testing.T) {
		l := edit(success[ii], `"permissionMode":"dontAsk"`, `"PERMISSIONMODE":"dontAsk","permissionMode":"bypassPermissions"`)
		tr := mustAbortBeforeToolCall(t, c, replaced(success, ii, l), ii+1, expect)
		mustNotAdjudicateHarness(t, c, tr)
	})
	t.Run("init: a variant model key never becomes model_id", func(t *testing.T) {
		l := edit(success[ii], `"model":"claude-opus-5"`, `"model":"claude-opus-5","Model":"claude-haiku-4-5"`)
		w := watch(c, join(replaced(success, ii, l)), expect)
		o := c.Classify(w.tr, ExitInfo{})
		if w.err == nil && o.ModelID != "claude-opus-5" {
			t.Errorf("ModelID = %q, want the exact key's claude-opus-5 (or an abort)", o.ModelID)
		}
		if o.Status == Adjudicate && o.ModelID != "claude-opus-5" {
			t.Errorf("adjudicated with model_id %q from a case-variant key", o.ModelID)
		}
	})

	results := map[string][]byte{
		"is_error true, a later variant says false":       edit(success[last], `"is_error":false`, `"is_error":true,"Is_Error":false`),
		"is_error only under a variant key":               edit(success[last], `"is_error":false`, `"IS_ERROR":false`),
		"structured_output only under a variant key":      edit(success[last], `"structured_output"`, `"Structured_Output"`),
		"subtype error, a later variant says success":     edit(success[last], `"subtype":"success"`, `"subtype":"error_during_execution","Subtype":"success"`),
		"type only under a variant key":                   edit(success[last], `"type":"result"`, `"Type":"result"`),
		"is_error under a variant, exact key absent, too": edit(success[last], `"is_error":false,`, `"Is_error":false,`),
	}
	for name, l := range results {
		t.Run("result: "+name, func(t *testing.T) {
			w := watch(c, join(replaced(success, last, l)), expect)
			if o := c.Classify(w.tr, ExitInfo{}); o.Status == Adjudicate || len(o.Output) != 0 {
				t.Errorf("Classify = %s(%s) output %s; a case-variant key decided the outcome", o.Status, o.Reason, o.Output)
			}
		})
	}
	// Paired control: the unedited run adjudicates.
	if o := c.Classify(watch(c, join(success), expect).tr, ExitInfo{}); o.Status != Adjudicate {
		t.Errorf("control: success.jsonl = %s(%s), want adjudicate", o.Status, o.Reason)
	}
}

// ---- r5 item 3. Two mutants the re-review found alive.
// (a) 09a §8.2 pins --permission-mode dontAsk for the whole run (DR r4): every system/init is
// checked, so a later init that matches init_expect but reports another mode aborts.
// (b) Ruling B: a nested-agent tool may be allowed only for a funded team, and the check must not
// be beaten by spelling: "agent", "AGENT(x)", "task" are refused unfunded. ----

func TestB1_06_R5_LaterInitModeChecked(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	success := lines(fixture(t, "success.jsonl"))
	ii := initIndex(t, success)
	for _, mode := range []string{"bypassPermissions", "acceptEdits", "default"} {
		late := bytes.Replace(success[ii], []byte(`"permissionMode":"dontAsk"`), []byte(`"permissionMode":"`+mode+`"`), 1)
		if h, err := c.InitHash(late); err != nil || h != expect {
			t.Fatalf("fixture drift: the later init must match init_expect (%s, %v)", h, err)
		}
		ls := append(slices.Clone(success[:ii+3]), late)
		ls = append(ls, success[ii+3:]...)
		w := watch(c, join(ls), expect)
		if !errors.Is(w.err, ErrHarness) || len(w.reasons) != 1 || w.reasons[0] != ReasonHarness {
			t.Errorf("later init with mode %s: Watch = %v, aborts %v; want ErrHarness and one harness abort", mode, w.err, w.reasons)
		}
		mustNotAdjudicateHarness(t, c, w.tr)
	}
	// Paired control: a later init that repeats the pinned mode does not abort.
	ls := append(slices.Clone(success[:ii+3]), success[ii])
	ls = append(ls, success[ii+3:]...)
	if w := watch(c, join(ls), expect); w.err != nil || len(w.reasons) != 0 {
		t.Errorf("control, later init with dontAsk: Watch = %v, aborts %v", w.err, w.reasons)
	}
}

func TestB1_06_R5_NestedAgentSpellingRefused(t *testing.T) {
	c := NewClaude(claudeDigest)
	for _, rule := range []string{"agent", "AGENT", "aGeNt", "task", "TASK", "agent(reviewer)", "AGENT(x)", "tAsK(tester)"} {
		argvRefused(t, c, false, []string{"Read", rule}, []string{"WebFetch"})
	}
	// Funded: a variant spelling may be accepted, but it never lifts the default forbid of the
	// real tool.
	for _, rule := range []string{"agent", "AGENT(x)"} {
		s := spec()
		s.FundedTeam = true
		s.ToolLease = ToolLease{Allowed: []string{"Read", rule}, Forbidden: []string{"WebFetch"}}
		argv, err := c.Argv(s)
		if err != nil {
			continue // refusing is also safe
		}
		if forbidden := strings.Split(slot(t, argv, "--disallowedTools"), ","); !slices.Contains(forbidden, "Agent") {
			t.Errorf("funded %q: --disallowedTools %q lacks Agent", rule, forbidden)
		}
	}
}
