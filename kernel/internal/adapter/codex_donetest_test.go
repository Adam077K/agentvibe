//go:build donetest

// Done-tests for B1-07 (docs/vision-v3/14-BUILD-PLAN.md §6 row B1-07, "WorkerAdapter `codex`:
// `exec`, `--output-schema`, `-o`, `--ephemeral`"; acceptance "Fixtures; empty stdout (known
// detached-TTY bug) → `unresolved`, never `pass`"). Canon: 09a §8.1 (codex-cli 0.154.0), §8.2
// (the contract and the pinned codex line), §8.4 (nested agents), §8.5 (forbidden flags), §8.7
// (model_id), §8.8 (UNPARSED). The sibling is B1-06 (claude_donetest_test.go and
// docs/vision-v3/_process/DR-B1-06-ADAPTER-RULINGS-2026-10-02.md); its fail-safe stance is
// kept: a rate-limit or unrecognised signal never adjudicates, a rule the argv cannot carry is
// refused rather than dropped, and nothing reaches the worker that the pinned line does not.
//
// Evidence, no model turn run: `codex exec --help` of the installed codex-cli 0.154.0; the serde
// strings of its native binary (event types thread.started, turn.started, turn.completed,
// turn.failed, item.started, item.updated, item.completed, error; item types agent_message,
// reasoning, command_execution, file_change, mcp_tool_call, web_search, todo_list,
// collab_tool_call, error); and the recorded --json runs in
// docs/03-system-design/final-v2/research/codex-in-the-pane.md and
// docs/03-system-design/final-v2/review/codex-rehearsal.md (the answer is at
// item.completed.item.text). The usage-limit and unknown-event fixtures are illustrative: their
// shape is unmeasured (ruling E), so the tests pin only that they never adjudicate.
//
// Founder rulings B1-07, 2026-10-02 (docs/vision-v3/_process/DR-B1-07-CODEX-RULINGS-2026-10-02.md):
// (1+3) tool limits live in the generated Codex profile; the launch pins the sha256 of that
// profile (init_expect) and of the codex binary (the grant digest), and a mismatch is ErrSpec;
// (2) nested agents are never allowed for codex, funded or not; (4) --ignore-user-config is
// always passed; (5) the -o file must equal the stream's answer, else UNPARSED; (6) rate limits
// are measured before they are frozen, and until then no such signal is ever a pass.
// Every file here and every fixture under testdata/codex/ is hashed in build/done-tests/B1-07.yml.
// Run: go -C kernel test -count=1 -tags donetest -run B1_07 ./internal/adapter/
package adapter

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"slices"
	"strings"
	"testing"
)

// The launcher grant's codex binary and pinned line, verbatim from the frozen B1-08 done-test
// (internal/launcher/launcher_donetest_test.go): the adapter's argv is what that launcher execs.
const cxDigest = "sha256:2222222222222222222222222222222222222222222222222222222222222222"

var (
	cxTokens = []string{"exec", "-C", "<worktree>", "-s", "workspace-write", "-p", "<profile>",
		"--json", "--output-schema", "<f>", "-o", "<result.json>", "--ephemeral"}
	cxSlotValues = map[string]string{"<worktree>": "/w/job-1", "<profile>": "project",
		"<f>": "/run/av/job-1/schema.json", "<result.json>": "/run/av/job-1/result.json"}
	// Ruling 4: the adapter's template is the canon line plus --ignore-user-config. The frozen
	// B1-08 launcher test still pins cxTokens without it; that test must follow (DR-B1-07).
	cxTemplate = append(slices.Clone(cxTokens), "--ignore-user-config")
	cxHash     = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)
)

const (
	// cxProfileDigest is the pinned sha256 of the generated profile file (ruling 1+3).
	cxProfileDigest = "sha256:4444444444444444444444444444444444444444444444444444444444444444"
	cxThreadID      = "0199a3c1-7e2f-7b40-9c1d-2f6e8a4b5c01"
	cxOutput        = `{"verdict":"PASS","summary":"ok"}`
	cxForged        = `{"verdict":"FORGED"}`
)

// The fixtures, every one of them. Only the first two may adjudicate.
var cxFixtures = []string{"success.jsonl", "two-messages.jsonl", "empty.jsonl", "turn-failed.jsonl",
	"usage-limit.jsonl", "reconnect-then-success.jsonl", "truncated.jsonl", "malformed.jsonl",
	"trailing.jsonl", "unknown-event.jsonl", "collab-spawn.jsonl", "no-message.jsonl"}

func cxRender() []string {
	out := make([]string, len(cxTemplate))
	for i, tok := range cxTemplate {
		if v, ok := cxSlotValues[tok]; ok {
			out[i] = v
		} else {
			out[i] = tok
		}
	}
	return out
}

// cxSpec fills exactly the launcher done-test's codex slot values and the two pinned digests,
// measured equal to their pins. It carries no tool lease (ruling 1+3: the profile holds it), no
// funded team (ruling 2) and none of the claude-only fields.
func cxSpec() LaunchSpec {
	return LaunchSpec{
		BinaryDigest:   cxDigest,
		ProfileDigest:  cxProfileDigest,
		InitExpect:     cxProfileDigest,
		Cwd:            "/w/job-1",
		ContextProfile: "launch-pack",
		SchemaPath:     "/run/av/job-1/schema.json",
		ResultPath:     "/run/av/job-1/result.json",
		CodexProfile:   "project",
		BudgetUSD:      5,
		WallS:          1800,
		IdleS:          300,
		Env:            map[string]string{"AV_JOB": "job-1"},
		ProviderMode:   "sub",
	}
}

func cxArgv(t *testing.T, s LaunchSpec) []string {
	t.Helper()
	argv, err := NewCodex(cxDigest).Argv(s)
	if err != nil {
		t.Fatalf("Argv: %v", err)
	}
	return argv
}

func cxRefused(t *testing.T, name string, s LaunchSpec, want error) {
	t.Helper()
	argv, err := NewCodex(cxDigest).Argv(s)
	if !errors.Is(err, want) || argv != nil {
		t.Errorf("%s: Argv = %q, %v; want nil, %v", name, argv, err, want)
	}
}

func cxSlotAfter(t *testing.T, argv []string, flag string) string {
	t.Helper()
	i := slices.Index(argv, flag)
	if i < 0 || i+1 >= len(argv) {
		t.Fatalf("argv %q has no %s value", argv, flag)
	}
	return argv[i+1]
}

func cxFixture(t *testing.T, name string) []byte {
	t.Helper()
	b, err := os.ReadFile(filepath.Join("testdata", "codex", name))
	if err != nil {
		t.Fatalf("fixture %s: %v", name, err)
	}
	return b
}

// cxLines is a fixture's lines, without their newlines.
func cxLines(t *testing.T, name string) []string {
	t.Helper()
	return strings.Split(strings.TrimSuffix(string(cxFixture(t, name)), "\n"), "\n")
}

func cxJoin(lines ...string) []byte { return []byte(strings.Join(lines, "\n") + "\n") }

// cxEvent marshals an event line. Go's encoder writes map keys sorted and exactly as given.
func cxEvent(v map[string]any) string {
	b, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return string(b)
}

func cxMsg(id, text string) string {
	return cxEvent(map[string]any{"type": "item.completed",
		"item": map[string]any{"id": id, "type": "agent_message", "text": text}})
}

// success.jsonl line indices.
const (
	cxLThread = 0
	cxLTurn   = 1
	cxLMsg    = 5
	cxLDone   = 6
)

func cxSuccessWith(t *testing.T, i int, line string) []byte {
	t.Helper()
	l := cxLines(t, "success.jsonl")
	l[i] = line
	return cxJoin(l...)
}

type cxResult struct {
	o      WorkerOutcome
	tr     Transcript
	err    error
	aborts []Reason
}

// cxRunRaw watches r with initExpect and classifies with exit exactly as given.
func cxRunRaw(r io.Reader, initExpect string, exit ExitInfo) cxResult {
	c := NewCodex(cxDigest)
	var res cxResult
	res.tr, res.err = c.Watch(r, initExpect, func(why Reason) { res.aborts = append(res.aborts, why) })
	res.o = c.Classify(res.tr, exit)
	return res
}

// cxLenientText is the last agent message as a lenient reader would take it: encoding/json
// folds key case and lets the last duplicate win, and every Unicode line break splits a line.
func cxLenientText(stream []byte) (string, bool) {
	var last string
	found := false
	split := func(r rune) bool { return strings.ContainsRune("\n\r\v\f\u0085\u2028\u2029", r) }
	for _, line := range strings.FieldsFunc(string(stream), split) {
		var ev struct {
			Type string
			Item struct{ Type, Text string }
		}
		if json.Unmarshal([]byte(strings.TrimPrefix(line, "\ufeff")), &ev) == nil &&
			strings.EqualFold(strings.TrimSpace(ev.Type), "item.completed") && strings.EqualFold(ev.Item.Type, "agent_message") {
			last, found = ev.Item.Text, true
		}
	}
	return last, found
}

// cxWithFile supplies the -o file (ruling 5) unless exit already carries one: the answer a
// lenient reader would find, else the success answer. A stream the adapter must refuse is then
// never refused merely because the file is missing, and a lenient adapter would find it matching.
func cxWithFile(stream []byte, exit ExitInfo) ExitInfo {
	if exit.ResultFileRead {
		return exit
	}
	text, ok := cxLenientText(stream)
	if !ok {
		text = cxOutput
	}
	exit.ResultFile, exit.ResultFileRead = text, true
	return exit
}

func cxRunReader(stream []byte, exit ExitInfo) cxResult {
	return cxRunRaw(bytes.NewReader(stream), cxProfileDigest, cxWithFile(stream, exit))
}

func cxRun(stream []byte, exit ExitInfo) WorkerOutcome { return cxRunReader(stream, exit).o }

func cxJSONEqual(a, b []byte) bool {
	var x, y any
	return json.Unmarshal(a, &x) == nil && json.Unmarshal(b, &y) == nil && reflect.DeepEqual(x, y)
}

// cxNot: a status in the closed set, not Adjudicate, and no output.
func cxNot(t *testing.T, name string, o WorkerOutcome) {
	t.Helper()
	switch o.Status {
	case Partial, Blocked, Unresolved:
	default:
		t.Errorf("%s: Status = %q, want partial, blocked or unresolved (never adjudicate)", name, o.Status)
	}
	if o.Output != nil {
		t.Errorf("%s: Output = %s, want none unless adjudicated", name, o.Output)
	}
}

func cxStatus(t *testing.T, name string, o WorkerOutcome, s Status, r Reason) {
	t.Helper()
	cxNot(t, name, o)
	if o.Status != s || o.Reason != r {
		t.Errorf("%s: outcome = %s(%s), want %s(%s)", name, o.Status, o.Reason, s, r)
	}
}

func cxUnparsed(t *testing.T, name string, o WorkerOutcome) {
	t.Helper()
	cxStatus(t, name, o, Unresolved, ReasonUnparsed)
}

func cxAdjudicated(t *testing.T, name string, o WorkerOutcome, output string) {
	t.Helper()
	if o.Status != Adjudicate || o.Reason != "" {
		t.Fatalf("%s: outcome = %s(%s), want adjudicate", name, o.Status, o.Reason)
	}
	if !cxJSONEqual(o.Output, []byte(output)) {
		t.Errorf("%s: Output = %.200s, want %s", name, o.Output, output)
	}
}

// ---- the argv ----

func TestB1_07_TemplateAndContract(t *testing.T) {
	c := NewCodex(cxDigest)
	if c.Family() != "codex" {
		t.Errorf("Family = %q, want codex", c.Family())
	}
	if got := c.Template(); !reflect.DeepEqual(got, cxTemplate) {
		t.Fatalf("Template = %q\nwant the canon codex line plus --ignore-user-config (ruling 4) %q", got, cxTemplate)
	}
	tmpl := c.Template()
	tmpl[0], tmpl[4] = "review", "danger-full-access"
	if got := c.Template(); got[0] != "exec" || got[4] != "workspace-write" {
		t.Errorf("Template returned shared storage: a caller's write changed it to %q", got)
	}
	if h := c.ContractHash(); h != ContractHashOf(cxDigest, cxTemplate) || !cxHash.MatchString(h) {
		t.Errorf("ContractHash = %q, want ContractHashOf(digest, Template()) = %q", h, ContractHashOf(cxDigest, cxTemplate))
	}
	other := "sha256:" + strings.Repeat("3", 64)
	if NewCodex(other).ContractHash() == c.ContractHash() {
		t.Error("ContractHash ignores the binary digest")
	}
}

func TestB1_07_PinnedArgv(t *testing.T) {
	argv := cxArgv(t, cxSpec())
	if want := cxRender(); !reflect.DeepEqual(argv, want) {
		t.Fatalf("Argv(spec) = %q\nwant the B1-08 launcher's rendered codex line plus --ignore-user-config %q", argv, want)
	}
	if n := slices.Index(argv, "--ignore-user-config"); n < 0 || slices.Contains(argv[n+1:], "--ignore-user-config") {
		t.Errorf("argv must carry --ignore-user-config exactly once (ruling 4): %q", argv)
	}
	// Each slot comes from its own field.
	for _, c := range []struct {
		flag string
		set  func(*LaunchSpec, string)
		v    string
	}{
		{"-C", func(s *LaunchSpec, v string) { s.Cwd = v }, "/w/job-2"},
		{"--output-schema", func(s *LaunchSpec, v string) { s.SchemaPath = v }, "/run/av/job-2/schema.json"},
		{"-o", func(s *LaunchSpec, v string) { s.ResultPath = v }, "/run/av/job-2/result.json"},
		{"-p", func(s *LaunchSpec, v string) { s.CodexProfile = v }, "job-2"},
	} {
		s := cxSpec()
		c.set(&s, c.v)
		got := cxArgv(t, s)
		if v := cxSlotAfter(t, got, c.flag); v != c.v {
			t.Errorf("%s = %q, want %q", c.flag, v, c.v)
		}
		i := slices.Index(got, c.flag) + 1
		want := cxRender()
		want[i] = c.v
		if !reflect.DeepEqual(got, want) {
			t.Errorf("changing %s changed another token: %q", c.flag, got)
		}
	}
	// Sandbox pinned: exactly one -s, workspace-write, and no other sandbox or approval control.
	if n := strings.Count(" "+strings.Join(argv, " ")+" ", " -s "); n != 1 {
		t.Errorf("argv carries %d -s flags, want 1", n)
	}
	if cxSlotAfter(t, argv, "-s") != "workspace-write" {
		t.Errorf("-s = %q, want workspace-write", cxSlotAfter(t, argv, "-s"))
	}
	// Approval mode: codex exec 0.154.0 has no approval flag, so the argv carries none and no
	// override that could set one (-c approval_policy=…, the profile is the Kernel's).
	for _, tok := range argv {
		for _, bad := range []string{"--sandbox", "danger-full-access", "read-only", "-c", "--config",
			"--dangerously-bypass-approvals-and-sandbox", "--approve-for-me", "--dangerously-bypass-hook-trust",
			"-a", "--ask-for-approval", "--full-auto", "--yolo", "--add-dir", "--enable", "--disable",
			"--worktree", "--oss", "--local-provider", "-m", "--model", "-i", "--image", "--ignore-rules",
			"--skip-git-repo-check", "--dangerously-skip-permissions", "--bare", "resume", "fork", "review"} {
			if tok == bad || strings.HasPrefix(tok, bad+"=") {
				t.Errorf("argv carries %q: %q", tok, argv)
			}
		}
	}
}

func TestB1_07_ForbiddenFlagRefusedBeforeExec(t *testing.T) {
	slots := map[string]func(*LaunchSpec, string){
		"Cwd":          func(s *LaunchSpec, v string) { s.Cwd = v },
		"SchemaPath":   func(s *LaunchSpec, v string) { s.SchemaPath = v },
		"ResultPath":   func(s *LaunchSpec, v string) { s.ResultPath = v },
		"CodexProfile": func(s *LaunchSpec, v string) { s.CodexProfile = v },
	}
	for name, set := range slots {
		for _, v := range []string{"--dangerously-bypass-approvals-and-sandbox", "--approve-for-me", "-s",
			"--sandbox=danger-full-access", "-sdanger-full-access", "-c", `-capproval_policy="never"`,
			`--config=sandbox_mode="danger-full-access"`, "--dangerously-skip-permissions", "--bare", "-", ""} {
			s := cxSpec()
			set(&s, v)
			cxRefused(t, name+"="+v, s, ErrSpec)
		}
	}
}

func TestB1_07_SlotValuesAreASCII(t *testing.T) {
	for _, v := range []string{"../evil", "a/b", `a\b`, ".", "..", "\uff30roject", "proj\u200bect", "proj\u00a0ect",
		"proj\u2028ect", "proj\u0085ect", "proj\u00e9ct", "proj ect", "proj\tect", "proj\x00ect", "proj\nect", "\ufeffproject"} {
		s := cxSpec()
		s.CodexProfile = v
		cxRefused(t, "profile "+v, s, ErrSpec)
	}
	for _, v := range []string{"project", "job-1", "job_1", "J0b"} {
		s := cxSpec()
		s.CodexProfile = v
		cxArgv(t, s)
	}
	paths := map[string]func(*LaunchSpec, string){
		"Cwd":        func(s *LaunchSpec, v string) { s.Cwd = v },
		"SchemaPath": func(s *LaunchSpec, v string) { s.SchemaPath = v },
		"ResultPath": func(s *LaunchSpec, v string) { s.ResultPath = v },
	}
	for name, set := range paths {
		for _, v := range []string{"w/job-1", "./job-1", "/w/job\u20281", "/w/job\u20291", "/w/job\u00851",
			"/w/job\u00a01", "/w/job\u200b1", "/w/j\u00f6b-1", "/w/job\x00", "/w/job\n1", "/w/job\r", "/w/job\x7f", "/w/job\t1"} {
			s := cxSpec()
			set(&s, v)
			cxRefused(t, name+" "+v, s, ErrSpec)
		}
		for _, v := range []string{"/w/job-1", "/tmp/av/x.json"} {
			s := cxSpec()
			set(&s, v)
			cxArgv(t, s)
		}
	}
}

func TestB1_07_SpecRefusals(t *testing.T) {
	for _, p := range []string{"", "user", "project", "Launch-Pack", "launch-pack ", "launch\u2010pack"} {
		s := cxSpec()
		s.ContextProfile = p
		cxRefused(t, "context profile "+p, s, ErrSpec)
	}
	for _, b := range []float64{0, -1, math.NaN(), math.Inf(1), math.Inf(-1)} {
		s := cxSpec()
		s.BudgetUSD = b
		cxRefused(t, "budget", s, ErrSpec)
	}
	// Claude-only fields have no codex token: a spec carrying one was built for another family,
	// and dropping it would launch something other than what was asked.
	for name, set := range map[string]func(*LaunchSpec){
		"SettingsPath": func(s *LaunchSpec) { s.SettingsPath = "/run/av/job-1/job.json" },
		"AgentsPath":   func(s *LaunchSpec) { s.AgentsPath = "/run/av/job-1/agents.json" },
		"Record":       func(s *LaunchSpec) { s.Record = "builder" },
		"SessionID":    func(s *LaunchSpec) { s.SessionID = "0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c" },
	} {
		s := cxSpec()
		set(&s)
		cxRefused(t, name, s, ErrSpec)
	}
}

// Ruling 1+3: the launch pins two sha256 values. The codex binary's measured digest
// (BinaryDigest) must equal the grant digest the adapter was built with; the generated
// profile's measured digest (ProfileDigest) must equal init_expect, which for codex is the
// pinned profile hash. Either missing, malformed or different is ErrSpec, before exec.
func TestB1_07_PinnedHashes(t *testing.T) {
	other := "sha256:" + strings.Repeat("5", 64)
	upper := "sha256:" + strings.Repeat("A", 64)
	for name, set := range map[string]func(*LaunchSpec){
		"binary digest differs":    func(s *LaunchSpec) { s.BinaryDigest = other },
		"binary digest missing":    func(s *LaunchSpec) { s.BinaryDigest = "" },
		"binary digest upper hex":  func(s *LaunchSpec) { s.BinaryDigest = strings.ToUpper(cxDigest) },
		"binary digest bare hex":   func(s *LaunchSpec) { s.BinaryDigest = strings.TrimPrefix(cxDigest, "sha256:") },
		"profile digest differs":   func(s *LaunchSpec) { s.ProfileDigest = other },
		"profile digest missing":   func(s *LaunchSpec) { s.ProfileDigest = "" },
		"pin missing":              func(s *LaunchSpec) { s.InitExpect = "" },
		"pin differs":              func(s *LaunchSpec) { s.InitExpect = other },
		"both missing, equal":      func(s *LaunchSpec) { s.ProfileDigest, s.InitExpect = "", "" },
		"both malformed, equal":    func(s *LaunchSpec) { s.ProfileDigest, s.InitExpect = "x", "x" },
		"both upper hex, equal":    func(s *LaunchSpec) { s.ProfileDigest, s.InitExpect = upper, upper },
		"profile is binary digest": func(s *LaunchSpec) { s.ProfileDigest, s.InitExpect = cxDigest, cxDigest; s.BinaryDigest = other },
	} {
		s := cxSpec()
		set(&s)
		cxRefused(t, name, s, ErrSpec)
	}
	// Another pinned pair that matches is accepted: the pin is the comparison, not one constant.
	s := cxSpec()
	s.ProfileDigest, s.InitExpect = other, other
	cxArgv(t, s)
	if got := NewCodex(other).ContractHash(); got == NewCodex(cxDigest).ContractHash() {
		t.Error("ContractHash ignores the binary digest")
	}
	b := cxSpec()
	b.BinaryDigest = other
	if _, err := NewCodex(other).Argv(b); err != nil {
		t.Errorf("an adapter pinned to %s refused a binary measured as %s: %v", other, other, err)
	}
	// A pin that is not a sha256 is no pin, even when the measurement equals it.
	for _, d := range []string{"", "x", strings.ToUpper(cxDigest)} {
		b := cxSpec()
		b.BinaryDigest = d
		if argv, err := NewCodex(d).Argv(b); !errors.Is(err, ErrSpec) || argv != nil {
			t.Errorf("adapter pinned to binary %q: Argv = %q, %v; want ErrSpec", d, argv, err)
		}
	}
	// Watch is handed the pin; a run with no well-formed pin was never pinned, so it never passes.
	ok := cxFixture(t, "success.jsonl")
	for _, pin := range []string{"", "x", upper, strings.TrimPrefix(cxProfileDigest, "sha256:")} {
		r := cxRunRaw(bytes.NewReader(ok), pin, cxWithFile(ok, ExitInfo{}))
		cxNot(t, "Watch with pin "+pin, r.o)
	}
}

// Ruling 2: nested agents are never allowed for codex, funded or not. Ruling 1+3: tool limits
// live in the pinned profile, so a lease in the spec is a rule the argv would drop: refused.
func TestB1_07_NestedAgentsAndLeaseRefused(t *testing.T) {
	for name, set := range map[string]func(*LaunchSpec){
		"funded team":            func(s *LaunchSpec) { s.FundedTeam = true },
		"funded team with Agent": func(s *LaunchSpec) { s.FundedTeam = true; s.ToolLease.Allowed = []string{"Agent"} },
		"allowed":                func(s *LaunchSpec) { s.ToolLease.Allowed = []string{"Read"} },
		"forbidden":              func(s *LaunchSpec) { s.ToolLease.Forbidden = []string{"Agent"} },
		"both": func(s *LaunchSpec) {
			s.ToolLease = ToolLease{Allowed: []string{"Read"}, Forbidden: []string{"Agent", "Task"}}
		},
	} {
		s := cxSpec()
		set(&s)
		cxRefused(t, name, s, ErrSpec)
	}
	s := cxSpec()
	s.ToolLease = ToolLease{Allowed: []string{}, Forbidden: []string{}}
	cxArgv(t, s) // empty lists carry no rule
}

// Ruling 5: the -o file must equal the stream's answer byte for byte. Missing on either side, or
// different, is UNPARSED, never a pass.
func TestB1_07_ResultFileMustMatch(t *testing.T) {
	ok := cxFixture(t, "success.jsonl")
	file := func(b string) ExitInfo { return ExitInfo{ResultFile: b, ResultFileRead: true} }
	cxAdjudicated(t, "matching file", cxRunRaw(bytes.NewReader(ok), cxProfileDigest, file(cxOutput)).o, cxOutput)
	for name, exit := range map[string]ExitInfo{
		"file missing":                  {},
		"file missing, bytes present":   {ResultFile: cxOutput},
		"file empty":                    file(""),
		"file differs":                  file(cxForged),
		"file is JSON-equal, reordered": file(`{"summary":"ok","verdict":"PASS"}`),
		"file is JSON-equal, spaced":    file(`{"verdict": "PASS", "summary": "ok"}`),
		"file has a prefix":             file(" " + cxOutput),
	} {
		cxUnparsed(t, name, cxRunRaw(bytes.NewReader(ok), cxProfileDigest, exit).o)
	}
	for _, f := range []string{"no-message.jsonl", "truncated.jsonl"} {
		cxUnparsed(t, f+" with a file", cxRunRaw(bytes.NewReader(cxFixture(t, f)), cxProfileDigest, file(cxOutput)).o)
	}
	two := cxFixture(t, "two-messages.jsonl")
	cxUnparsed(t, "file holds the first message", cxRunRaw(bytes.NewReader(two), cxProfileDigest,
		file(`{"verdict":"FAIL","summary":"first"}`)).o)
}

// ---- the stream ----

func TestB1_07_Success(t *testing.T) {
	r := cxRunReader(cxFixture(t, "success.jsonl"), ExitInfo{})
	if r.err != nil || len(r.aborts) != 0 {
		t.Errorf("Watch(success) = %v, aborts %v; want nil, none", r.err, r.aborts)
	}
	cxAdjudicated(t, "success", r.o, cxOutput)
	if r.o.SessionID != cxThreadID {
		t.Errorf("SessionID = %q, want the thread.started thread_id %q", r.o.SessionID, cxThreadID)
	}
	if r.o.ModelID != "" {
		t.Errorf("ModelID = %q: the codex stream reports no model, and it never comes from the slot (09a \u00a78.7)", r.o.ModelID)
	}
	if len(r.o.Denied) != 0 {
		t.Errorf("Denied = %q, want none", r.o.Denied)
	}
	if ch := NewCodex(cxDigest).Children(r.tr); len(ch) != 0 {
		t.Errorf("Children(success) = %+v, want none", ch)
	}
	// The last agent message is the answer (-o --output-last-message writes the same one).
	cxAdjudicated(t, "two messages", cxRun(cxFixture(t, "two-messages.jsonl"), ExitInfo{}),
		`{"verdict":"PASS","summary":"second"}`)
	// A pseudo-TTY (09a §8.8) ends lines with CRLF.
	crlf := bytes.ReplaceAll(cxFixture(t, "success.jsonl"), []byte("\n"), []byte("\r\n"))
	cxAdjudicated(t, "CRLF", cxRun(crlf, ExitInfo{}), cxOutput)
	// A line far beyond any default scanner buffer is still one line.
	big := `{"verdict":"PASS","blob":"` + strings.Repeat("a", 4<<20) + `"}`
	o := cxRun(cxSuccessWith(t, cxLMsg, cxMsg("item_2", big)), ExitInfo{})
	cxAdjudicated(t, "4 MiB message", o, big)
}

func TestB1_07_EmptyStdoutUnresolved(t *testing.T) {
	l := cxLines(t, "success.jsonl")
	for name, stream := range map[string][]byte{
		"empty.jsonl (bug #19945)": cxFixture(t, "empty.jsonl"),
		"one newline":              []byte("\n"),
		"thread.started only":      cxJoin(l[cxLThread]),
		"thread and turn started":  cxJoin(l[cxLThread], l[cxLTurn]),
	} {
		for _, code := range []int{0, 1} {
			cxUnparsed(t, name, cxRun(stream, ExitInfo{Code: code}))
		}
	}
}

func TestB1_07_ErrorAndRateLimitNeverPass(t *testing.T) {
	o := cxRun(cxFixture(t, "turn-failed.jsonl"), ExitInfo{Code: 1})
	cxNot(t, "turn-failed", o)
	if o.Status != Unresolved {
		t.Errorf("turn-failed: Status = %q, want unresolved", o.Status)
	}
	l := cxLines(t, "success.jsonl")
	errEv := `{"type":"error","message":"Reconnecting... 2/5 (unexpected status 429 Too Many Requests)"}`
	errItem := `{"type":"item.completed","item":{"id":"item_9","type":"error","message":"illustrative"}}`
	ins := func(i int, line string) []byte { return cxJoin(slices.Insert(slices.Clone(l), i, line)...) }
	for name, stream := range map[string][]byte{
		"usage-limit.jsonl":               cxFixture(t, "usage-limit.jsonl"),
		"reconnect-then-success.jsonl":    cxFixture(t, "reconnect-then-success.jsonl"),
		"error event before thread":       ins(0, errEv),
		"error event after the answer":    ins(cxLDone, errEv),
		"error item mid-turn":             ins(cxLMsg, errItem),
		"turn.failed then turn.completed": ins(cxLDone, `{"type":"turn.failed","error":{"message":"x"}}`),
		"turn.completed then turn.failed": cxJoin(append(slices.Clone(l), `{"type":"turn.failed","error":{"message":"x"}}`)...),
		"answer, then turn.failed":        cxSuccessWith(t, cxLDone, `{"type":"turn.failed","error":{"message":"x"}}`),
	} {
		o := cxRun(stream, ExitInfo{})
		cxNot(t, name, o)
		if o.Status != Unresolved && o.Status != Blocked {
			t.Errorf("%s: Status = %q, want unresolved or blocked (ruling E: unmeasured)", name, o.Status)
		}
	}
}

func TestB1_07_KilledAndExitNeverPass(t *testing.T) {
	ok := cxFixture(t, "success.jsonl")
	cxStatus(t, "killed wall", cxRun(ok, ExitInfo{Killed: KilledWall}), Unresolved, ReasonTimeout)
	cxStatus(t, "killed idle", cxRun(ok, ExitInfo{Killed: KilledIdle}), Unresolved, ReasonTimeout)
	cxStatus(t, "killed harness", cxRun(ok, ExitInfo{Killed: KilledHarness}), Unresolved, ReasonHarness)
	for _, k := range []Kill{"oom", "Wall"} {
		o := cxRun(ok, ExitInfo{Killed: k})
		cxNot(t, "unknown kill "+string(k), o)
		if o.Status != Unresolved {
			t.Errorf("unknown kill %q: Status = %q, want unresolved", k, o.Status)
		}
	}
	for _, code := range []int{1, -1, 2, 137} {
		o := cxRun(ok, ExitInfo{Code: code})
		cxNot(t, "non-zero exit", o)
		if o.Status != Unresolved {
			t.Errorf("exit %d: Status = %q, want unresolved", code, o.Status)
		}
	}
}

type cxFailingReader struct{}

func (cxFailingReader) Read([]byte) (int, error) { return 0, errors.New("pty: input/output error") }

func TestB1_07_UnparsedStreams(t *testing.T) {
	for _, f := range []string{"malformed.jsonl", "truncated.jsonl", "trailing.jsonl", "unknown-event.jsonl"} {
		cxUnparsed(t, f, cxRun(cxFixture(t, f), ExitInfo{}))
	}
	l := cxLines(t, "success.jsonl")
	ins := func(i int, line string) []byte { return cxJoin(slices.Insert(slices.Clone(l), i, line)...) }
	swap := func(i, j int) []byte {
		c := slices.Clone(l)
		c[i], c[j] = c[j], c[i]
		return cxJoin(c...)
	}
	for name, stream := range map[string][]byte{
		"unknown item type":            ins(cxLMsg, `{"type":"item.completed","item":{"id":"item_8","type":"frobnicate"}}`),
		"item with no type":            ins(cxLMsg, `{"type":"item.completed","item":{"id":"item_8"}}`),
		"item not an object":           ins(cxLMsg, `{"type":"item.completed","item":"agent_message"}`),
		"event with no type":           ins(cxLMsg, `{"thread_id":"x"}`),
		"type not a string":            ins(cxLMsg, `{"type":1}`),
		"a JSON array line":            ins(cxLMsg, `[]`),
		"a JSON string line":           ins(cxLMsg, `"turn.completed"`),
		"turn before thread":           swap(cxLThread, cxLTurn),
		"answer before turn":           swap(cxLTurn, cxLMsg),
		"second thread.started":        ins(cxLTurn, l[cxLThread]),
		"second turn.started":          ins(cxLMsg, l[cxLTurn]),
		"two turn.completed":           ins(cxLDone, l[cxLDone]),
		"byte-order mark":              append([]byte("\ufeff"), cxFixture(t, "success.jsonl")...),
		"blank line mid-stream":        ins(cxLMsg, ""),
		"two events on one line":       cxJoin(append(slices.Clone(l[:cxLDone-1]), l[cxLMsg]+l[cxLDone])...),
		"trailing data after an event": cxSuccessWith(t, cxLDone, l[cxLDone]+` {"type":"turn.failed"}`),
	} {
		cxUnparsed(t, name, cxRun(stream, ExitInfo{}))
	}
	for name, line := range map[string]string{
		"empty thread_id":   `{"type":"thread.started","thread_id":""}`,
		"no thread_id":      `{"type":"thread.started"}`,
		"numeric thread_id": `{"type":"thread.started","thread_id":7}`,
	} {
		cxNot(t, name, cxRun(cxSuccessWith(t, cxLThread, line), ExitInfo{}))
	}
	ok := cxFixture(t, "success.jsonl")
	r := cxRunRaw(io.MultiReader(bytes.NewReader(ok), cxFailingReader{}), cxProfileDigest, cxWithFile(ok, ExitInfo{}))
	cxUnparsed(t, "read error after a full stream", r.o)
}

func TestB1_07_OutputMustBeNonEmptyObject(t *testing.T) {
	o := cxRun(cxFixture(t, "no-message.jsonl"), ExitInfo{})
	cxNot(t, "no-message.jsonl", o)
	if o.Status != Unresolved {
		t.Errorf("no-message.jsonl: Status = %q, want unresolved", o.Status)
	}
	for _, text := range []string{"Done. Everything passes.", "", "   ", "{}", "null", "[]", `[{"verdict":"PASS"}]`,
		`"PASS"`, "true", "1", `{"verdict":"PASS"} trailing`, `{"verdict":"PASS"}{"x":1}`, `{"verdict":`} {
		o := cxRun(cxSuccessWith(t, cxLMsg, cxMsg("item_2", text)), ExitInfo{})
		cxNot(t, "message "+text, o)
		if o.Status != Unresolved {
			t.Errorf("message %q: Status = %q, want unresolved", text, o.Status)
		}
	}
	for name, line := range map[string]string{
		"answer only in item.started": cxEvent(map[string]any{"type": "item.started",
			"item": map[string]any{"id": "item_2", "type": "agent_message", "text": cxOutput}}),
		"answer only in item.updated": cxEvent(map[string]any{"type": "item.updated",
			"item": map[string]any{"id": "item_2", "type": "agent_message", "text": cxOutput}}),
		"text is an object, not a string": `{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":{"verdict":"PASS"}}}`,
		"answer in a reasoning item": cxEvent(map[string]any{"type": "item.completed",
			"item": map[string]any{"id": "item_2", "type": "reasoning", "text": cxOutput}}),
	} {
		o := cxRun(cxSuccessWith(t, cxLMsg, line), ExitInfo{})
		cxNot(t, name, o)
	}
}

// JSON keys are matched exactly (Go's encoding/json folds case; the CLI's serde does not), and a
// duplicated key is never resolved in the worker's favour.
func TestB1_07_KeysMatchedExactly(t *testing.T) {
	for name, c := range map[string]struct {
		i    int
		line string
	}{
		"Type on turn.completed":          {cxLDone, `{"Type":"turn.completed","usage":{}}`},
		"TYPE on thread.started":          {cxLThread, `{"TYPE":"thread.started","thread_id":"` + cxThreadID + `"}`},
		"Item":                            {cxLMsg, `{"type":"item.completed","Item":{"id":"item_2","type":"agent_message","text":"{\"verdict\":\"PASS\"}"}}`},
		"Text":                            {cxLMsg, `{"type":"item.completed","item":{"id":"item_2","type":"agent_message","Text":"{\"verdict\":\"PASS\"}"}}`},
		"item Type":                       {cxLMsg, `{"type":"item.completed","item":{"id":"item_2","Type":"agent_message","text":"{\"verdict\":\"PASS\"}"}}`},
		"Thread_id":                       {cxLThread, `{"type":"thread.started","Thread_id":"` + cxThreadID + `"}`},
		"duplicate type, completed last":  {cxLDone, `{"type":"turn.failed","type":"turn.completed","usage":{}}`},
		"duplicate type, completed first": {cxLDone, `{"type":"turn.completed","type":"turn.failed","usage":{}}`},
		"duplicate text, forged last":     {cxLMsg, `{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":"{\"verdict\":\"PASS\"}","text":"{\"verdict\":\"FORGED\"}"}}`},
		"duplicate text, forged first":    {cxLMsg, `{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":"{\"verdict\":\"FORGED\"}","text":"{\"verdict\":\"PASS\"}"}}`},
		"duplicate item type":             {cxLMsg, `{"type":"item.completed","item":{"id":"item_2","type":"reasoning","type":"agent_message","text":"{\"verdict\":\"PASS\"}"}}`},
	} {
		o := cxRun(cxSuccessWith(t, c.i, c.line), ExitInfo{})
		cxNot(t, name, o)
		if o.SessionID != "" && o.SessionID != cxThreadID {
			t.Errorf("%s: SessionID = %q", name, o.SessionID)
		}
	}
	o := cxRun(cxSuccessWith(t, cxLThread, `{"type":"thread.started","Thread_id":"forged-thread"}`), ExitInfo{})
	if o.SessionID == "forged-thread" {
		t.Error("Thread_id was read as thread_id")
	}
	// A case variant beside the exact key is not the field: it never overrides it.
	for _, line := range []string{
		`{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":"{\"verdict\":\"PASS\",\"summary\":\"ok\"}","TEXT":"{\"verdict\":\"FORGED\"}"}}`,
		`{"type":"item.completed","item":{"id":"item_2","type":"agent_message","TEXT":"{\"verdict\":\"FORGED\"}","text":"{\"verdict\":\"PASS\",\"summary\":\"ok\"}"}}`,
	} {
		o := cxRun(cxSuccessWith(t, cxLMsg, line), ExitInfo{})
		if cxJSONEqual(o.Output, []byte(cxForged)) {
			t.Errorf("TEXT overrode text: Output = %s", o.Output)
		}
		if o.Status == Adjudicate && !cxJSONEqual(o.Output, []byte(cxOutput)) {
			t.Errorf("adjudicated with Output = %s, want %s", o.Output, cxOutput)
		}
	}
}

// Event and item type names are ASCII and compared byte for byte; a line is split only at '\n'.
func TestB1_07_UnicodeNeverMatches(t *testing.T) {
	for _, typ := range []string{"turn.completed\u200b", "turn.completed\u00a0", "turn.completed ", " turn.completed",
		"Turn.completed", "TURN.COMPLETED", "\uff54urn.completed", "turn\u2024completed", "turn.complet\u0435d", "\ufeffturn.completed"} {
		line := cxEvent(map[string]any{"type": typ, "usage": map[string]any{}})
		cxNot(t, "turn type "+typ, cxRun(cxSuccessWith(t, cxLDone, line), ExitInfo{}))
	}
	for _, typ := range []string{"agent_message\u2028", "agent_message\u200b", "AGENT_MESSAGE", "agent_messag\u0435", "agent\u2010message", "agent_message "} {
		line := cxEvent(map[string]any{"type": "item.completed",
			"item": map[string]any{"id": "item_2", "type": typ, "text": cxOutput}})
		cxNot(t, "item type "+typ, cxRun(cxSuccessWith(t, cxLMsg, line), ExitInfo{}))
	}
	l := cxLines(t, "success.jsonl")
	for _, sep := range []string{"\u2028", "\u2029", "\u0085", "\v", "\f", "\r"} {
		joined := append(slices.Clone(l[:cxLMsg]), l[cxLMsg]+sep+l[cxLDone])
		cxUnparsed(t, fmt.Sprintf("answer and turn.completed joined by U+%04X", []rune(sep)[0]),
			cxRun(cxJoin(joined...), ExitInfo{}))
	}
}

// 09a §8.4: a nested agent is visible, and ruling B07-2 forbids one for codex, funded or not.
func TestB1_07_NestedAgentVisibleNeverPasses(t *testing.T) {
	r := cxRunReader(cxFixture(t, "collab-spawn.jsonl"), ExitInfo{})
	cxNot(t, "collab-spawn.jsonl", r.o)
	ch := NewCodex(cxDigest).Children(r.tr)
	if !slices.ContainsFunc(ch, func(c ChildJob) bool { return c.ToolUseID == "item_3" }) {
		t.Errorf("Children(collab-spawn) = %+v, want the collab_tool_call item_3", ch)
	}
	l := cxLines(t, "collab-spawn.jsonl")
	only := cxJoin(slices.Delete(slices.Clone(l), 4, 5)...) // the item.started alone
	r = cxRunReader(only, ExitInfo{})
	cxNot(t, "collab spawn started, never completed", r.o)
	if len(NewCodex(cxDigest).Children(r.tr)) == 0 {
		t.Error("a spawn seen only in item.started is not reported as a child")
	}
}

func TestB1_07_OnlyTwoFixturesAdjudicate(t *testing.T) {
	entries, err := os.ReadDir(filepath.Join("testdata", "codex"))
	if err != nil {
		t.Fatal(err)
	}
	var got []string
	for _, e := range entries {
		got = append(got, e.Name())
	}
	want := slices.Clone(cxFixtures)
	slices.Sort(want)
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("testdata/codex = %q, want exactly %q (a new fixture is a re-freeze)", got, want)
	}
	for _, f := range cxFixtures {
		for _, exit := range []ExitInfo{{}, {Code: 1}} {
			o := cxRun(cxFixture(t, f), exit)
			if (f == "success.jsonl" || f == "two-messages.jsonl") && exit.Code == 0 {
				if o.Status != Adjudicate {
					t.Errorf("%s: Status = %q, want adjudicate", f, o.Status)
				}
				continue
			}
			cxNot(t, f, o)
		}
	}
}
