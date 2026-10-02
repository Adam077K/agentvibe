//go:build donetest

// Round-4 done-tests for B1-06, added after the Opus review of the implementation at 22ab9a4
// (which PASSED). The round-1..3 file, claude_donetest_test.go, and its 14 fixtures are
// unchanged; this file reuses its helpers. No fixture is added: TestB1_06_NothingElseAdjudicates
// pins the fixture count, so every r4 stream is derived in-test from a frozen fixture.
// Registered in build/done-tests/B1-06.yml (re-freeze r4).
// Run: go -C kernel test -count=1 -tags donetest -run B1_06 ./internal/adapter/
package adapter

import (
	"errors"
	"slices"
	"testing"
)

// ---- r4 item 1 (MED, security). Founder ruling B (DR-B1-06-ADAPTER-RULINGS) makes each
// tool-list element exactly one tool rule. The CLI side splits tool lists with JavaScript's \s,
// which matches Unicode separators (U+00A0, U+2028, U+3000, U+FEFF, ...) that Go's ASCII view
// of a rule does not see, so "Agent(x<sep>Bash)" for a funded team, or "Read<sep>Agent" for any
// team, becomes two rules on the far side. Refused: any non-ASCII rune, anywhere in the element.

func TestB1_06_R4_ToolListsAreASCII(t *testing.T) {
	c := NewClaude(claudeDigest)
	allowed := map[string]string{
		"U+FEFF between names":            "Read\uFEFFAgent",
		"U+200B between names":            "Read\u200BAgent",
		"U+00A0 between names":            "Read\u00A0Agent",
		"U+2028 between names":            "Read\u2028Agent",
		"U+3000 between names":            "Read\u3000Agent",
		"U+FF0C fullwidth comma":          "Read\uFF0CAgent",
		"a non-ASCII letter":              "\u00C4gent",
		"U+00A0 inside parentheses":       "Bash(git\u00A0diff:*)",
		"U+FEFF inside parentheses":       "Bash(git\uFEFFdiff:*)",
		"U+2028 inside parentheses":       "Bash(git\u2028diff:*)",
		"a non-ASCII letter in the specs": "Bash(\u00E9cho:*)",
	}
	for name, tool := range allowed {
		for _, funded := range []bool{false, true} {
			s := spec()
			s.FundedTeam = funded
			s.ToolLease = ToolLease{Allowed: []string{"Read", tool}, Forbidden: []string{"WebFetch"}}
			if argv, err := c.Argv(s); !errors.Is(err, ErrSpec) || argv != nil {
				t.Errorf("allowed %s (%+q), funded=%v: Argv = %q, %v; want nil, ErrSpec", name, tool, funded, argv, err)
			}
		}
	}
	// The funded-team case the review named: Agent(x) must stay one rule.
	for _, tool := range []string{"Agent(reviewer\u00A0Bash)", "Agent(reviewer\u3000Bash)", "Agent(reviewer\uFEFFBash)", "Task(tester\u2029Bash)"} {
		s := spec()
		s.FundedTeam = true
		s.ToolLease = ToolLease{Allowed: []string{"Read", tool}, Forbidden: []string{"WebFetch"}}
		if argv, err := c.Argv(s); !errors.Is(err, ErrSpec) || argv != nil {
			t.Errorf("funded %+q: Argv = %q, %v; want nil, ErrSpec", tool, argv, err)
		}
	}
	for _, tool := range []string{"WebFetch\uFEFF", "Web\u00A0Fetch", "Web\u3000Fetch"} {
		s := spec()
		s.ToolLease = ToolLease{Allowed: []string{"Read"}, Forbidden: []string{tool}}
		if argv, err := c.Argv(s); !errors.Is(err, ErrSpec) || argv != nil {
			t.Errorf("forbidden %+q: Argv = %q, %v; want nil, ErrSpec", tool, argv, err)
		}
	}
	// Paired control: ASCII rules, an inner ASCII space inside parentheses included, still pass.
	s := spec()
	s.FundedTeam = true
	s.ToolLease = ToolLease{Allowed: []string{"Read", "Bash(git diff:*)", "Agent(reviewer)"}, Forbidden: []string{"WebFetch"}}
	if _, err := c.Argv(s); err != nil {
		t.Errorf("ASCII control: Argv: %v, want success", err)
	}
}

// ---- r4 item 2 (MED). 09a \u00A78.8: "Any run whose stream the adapter cannot parse into a typed
// outcome is classified UNPARSED (a kind of unresolved)" and is counted per family. Canon is
// silent on unrecognised events; founder ruling E says they never pass. ASSUMPTION (test
// builder, r4, the safe reading): a run carrying an unrecognised top-level event has no typed
// outcome, so it is UNPARSED and counts toward the UNPARSED rate. Reason == ReasonUnparsed is
// the observable for that count.

func TestB1_06_R4_UnrecognisedCountsAsUnparsed(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	success := lines(fixture(t, "success.jsonl"))
	last := len(success) - 1
	streams := map[string][]byte{
		"status rejected": fixture(t, "unrecognised-signal-rejected.jsonl"),
		"status allowed":  fixture(t, "unrecognised-signal-allowed.jsonl"),
		"an unknown type": join(append(append(slices.Clone(success[:last]),
			[]byte(`{"type":"capacity_notice","session_id":"0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c"}`)), success[last])),
	}
	for name, b := range streams {
		w := watch(c, b, expect)
		if w.err != nil || len(w.reasons) != 0 {
			t.Fatalf("%s: Watch = %v, aborts %v", name, w.err, w.reasons)
		}
		if o := c.Classify(w.tr, ExitInfo{}); o.Status != Unresolved || o.Reason != ReasonUnparsed {
			t.Errorf("%s: Classify = %s(%s), want unresolved(unparsed): it must count toward the UNPARSED rate", name, o.Status, o.Reason)
		}
	}
}

// ---- r4 item 3 (LOW). 09a \u00A78.2 pins `--permission-mode dontAsk`; the init reports the mode the
// worker actually runs in. A worker not in the pinned mode aborts before the first tool call,
// like a harness mismatch. permissionMode is NOT in init_expect (ruling A keeps that to four
// fields): this is a separate check, so the expect still matches and only the mode can abort.

func TestB1_06_R4_PermissionModeIsThePinnedOne(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	base := lines(fixture(t, "success.jsonl"))
	ii := initIndex(t, base)
	modes := map[string]func(m map[string]any){
		"bypassPermissions": func(m map[string]any) { m["permissionMode"] = "bypassPermissions" },
		"acceptEdits":       func(m map[string]any) { m["permissionMode"] = "acceptEdits" },
		"default":           func(m map[string]any) { m["permissionMode"] = "default" },
		"plan":              func(m map[string]any) { m["permissionMode"] = "plan" },
		"DontAsk":           func(m map[string]any) { m["permissionMode"] = "DontAsk" },
		"empty":             func(m map[string]any) { m["permissionMode"] = "" },
		"not a string":      func(m map[string]any) { m["permissionMode"] = true },
		"missing":           func(m map[string]any) { delete(m, "permissionMode") },
	}
	for name, mutate := range modes {
		t.Run(name, func(t *testing.T) {
			m := decode(t, base[ii])
			mutate(m)
			l := encode(t, m)
			if h, err := c.InitHash(l); err != nil || h != expect {
				t.Fatalf("fixture drift: permissionMode moved the harness hash (%s, %v)", h, err)
			}
			tr := mustAbortBeforeToolCall(t, c, replaced(base, ii, l), ii+1, expect)
			mustNotAdjudicateHarness(t, c, tr)
		})
	}
}

// ---- r4 item 4. Behaviours 22ab9a4 gets right that no frozen test pinned. Each case is a
// success.jsonl run with one defect; each must never adjudicate. ENGINE-SPEC \u00A78.3 (the agent's
// claimed status is logged, never used; non-zero/killed runs unresolved), 09a \u00A78.8 (a stream
// that is not one typed outcome is UNPARSED), Rule 10. ----

func TestB1_06_R4_NoTypedOutcomeNeverAdjudicates(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	success := lines(fixture(t, "success.jsonl"))
	ii := initIndex(t, success)
	last := len(success) - 1
	withResult := func(edit func(m map[string]any)) [][]byte {
		m := decode(t, success[last])
		edit(m)
		return replaced(success, last, encode(t, m))
	}
	appendLine := func(ls [][]byte, l []byte) [][]byte { return append(slices.Clone(ls), l) }
	insertAt := func(ls [][]byte, i int, l []byte) [][]byte {
		out := append(slices.Clone(ls[:i]), l)
		return append(out, ls[i:]...)
	}
	trailing := []byte(`{"type":"assistant","message":{"id":"msg_late","type":"message","role":"assistant","model":"claude-opus-5","content":[{"type":"text","text":"one more thing"}]},"parent_tool_use_id":null,"session_id":"0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c","uuid":"a-late"}`)
	during := func() []byte {
		m := decode(t, success[last])
		m["subtype"], m["is_error"] = "error_during_execution", true
		delete(m, "structured_output")
		return encode(t, m)
	}()
	lateInit := func() []byte {
		m := decode(t, success[ii])
		m["tools"] = append(m["tools"].([]any), "mcp__tracker__read_file")
		return encode(t, m)
	}()

	cases := []struct {
		name     string
		ls       [][]byte
		exit     ExitInfo
		unparsed bool // the reason is pinned to UNPARSED (09a \u00A78.8)
	}{
		{"is_error missing", withResult(func(m map[string]any) { delete(m, "is_error") }), ExitInfo{}, false},
		{"is_error null", withResult(func(m map[string]any) { m["is_error"] = nil }), ExitInfo{}, false},
		{"is_error \"false\" (a string)", withResult(func(m map[string]any) { m["is_error"] = "false" }), ExitInfo{}, false},
		{"an event after the result", appendLine(success, trailing), ExitInfo{}, true},
		{"a non-JSON line mid-stream", insertAt(success, ii+2, []byte("this is not json")), ExitInfo{}, true},
		{"a JSON line with no type mid-stream", insertAt(success, ii+2, []byte(`{"foo":1}`)), ExitInfo{}, true},
		{"two results, both success", appendLine(success, success[last]), ExitInfo{}, true},
		{"two results, error then success", insertAt(success, last, during), ExitInfo{}, true},
		{"a result whose permission_denials is mistyped", withResult(func(m map[string]any) { m["permission_denials"] = "none" }), ExitInfo{}, true},
		{"a result whose structured_output is fine but subtype is a number", withResult(func(m map[string]any) { m["subtype"] = 1 }), ExitInfo{}, true},
		{"an unknown kill", success, ExitInfo{Code: -1, Killed: Kill("oom")}, false},
		{"an unknown kill, exit 0", success, ExitInfo{Killed: Kill("signal")}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			w := watch(c, join(tc.ls), expect)
			if w.err != nil || len(w.reasons) != 0 {
				t.Fatalf("Watch = %v, aborts %v; the harness matched", w.err, w.reasons)
			}
			o := c.Classify(w.tr, tc.exit)
			if o.Status != Unresolved || len(o.Output) != 0 {
				t.Errorf("Classify = %s(%s) output %s; want unresolved, never a pass", o.Status, o.Reason, o.Output)
			}
			if tc.unparsed && o.Reason != ReasonUnparsed {
				t.Errorf("Reason = %q, want unparsed: the stream is not one typed outcome", o.Reason)
			}
		})
	}

	// A system/init after other events (here, after the first tool call) is checked against
	// init_expect like the first: a harness that changes mid-run aborts and never adjudicates.
	t.Run("a later system/init with another harness", func(t *testing.T) {
		w := watch(c, join(insertAt(success, ii+3, lateInit)), expect)
		if !errors.Is(w.err, ErrHarness) || len(w.reasons) != 1 || w.reasons[0] != ReasonHarness {
			t.Errorf("Watch = %v, aborts %v; want ErrHarness and one harness abort", w.err, w.reasons)
		}
		mustNotAdjudicateHarness(t, c, w.tr)
	})
	// Paired control: the unmodified run adjudicates, so each defect above is what stops it.
	if o := c.Classify(watch(c, join(success), expect).tr, ExitInfo{}); o.Status != Adjudicate {
		t.Errorf("control: success.jsonl = %s(%s), want adjudicate", o.Status, o.Reason)
	}
}
