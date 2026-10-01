//go:build donetest

// Done-tests for B1-06 (docs/vision-v3/14-BUILD-PLAN.md §6 row B1-06, "WorkerAdapter `claude`:
// pinned argv, `contract_hash`, subtype map, children, `init_expect`"; acceptance "Contract
// fixtures; a changed MCP description aborts before the first tool call; empty result →
// `unresolved`"). The file's sha256 and every fixture's are registered in
// build/done-tests/B1-06.yml. No test runs a `claude` process: every stream is a recorded
// stream-json transcript under testdata/claude/.
// Run: go -C kernel test -count=1 -tags donetest -run B1_06 ./internal/adapter/
package adapter

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
)

// The launcher grant's claude binary and pinned line, verbatim from the frozen B1-08 done-test
// (internal/launcher/launcher_donetest_test.go): the adapter's argv is what that launcher execs.
const claudeDigest = "sha256:1111111111111111111111111111111111111111111111111111111111111111"

var (
	claudeTokens = []string{"-p", "--setting-sources", "<profile>", "--settings", "<job.json>",
		"--agents", "<compiled.json>", "--agent", "<record>", "--permission-mode", "dontAsk",
		"--allowedTools", "<allowed>", "--disallowedTools", "<forbidden>",
		"--output-format", "stream-json", "--verbose", "--json-schema", "<f>",
		"--max-budget-usd", "<B>", "--session-id", "<uuid>"}
	slotValues = map[string]string{
		"<profile>": "project", "<job.json>": "/run/av/job-1/job.json", "<compiled.json>": "/run/av/job-1/agents.json",
		"<record>": "builder", "<allowed>": "Read,Edit,Bash", "<forbidden>": "Agent,Task",
		"<f>": "/run/av/job-1/schema.json", "<B>": "5", "<uuid>": "0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c",
	}
	hexHash = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)
)

// argvDigest is launcher.ArgvTemplate's frozen digest encoding.
func argvDigest(tokens []string) string {
	s := sha256.Sum256([]byte(strings.Join(tokens, "\x00")))
	return "sha256:" + hex.EncodeToString(s[:])
}

func render(tokens []string) []string {
	out := make([]string, len(tokens))
	for i, tok := range tokens {
		if v, ok := slotValues[tok]; ok {
			out[i] = v
		} else {
			out[i] = tok
		}
	}
	return out
}

// matchesTemplate is the launcher's slot rule (launcher.ArgvTemplate): a "<name>" token matches
// one argv token that is non-empty and does not begin with '-'; every other token is equal.
func matchesTemplate(tokens, argv []string) bool {
	if len(tokens) != len(argv) {
		return false
	}
	for i, tok := range tokens {
		if strings.HasPrefix(tok, "<") && strings.HasSuffix(tok, ">") {
			if argv[i] == "" || strings.HasPrefix(argv[i], "-") {
				return false
			}
		} else if argv[i] != tok {
			return false
		}
	}
	return true
}

// spec fills exactly the launcher done-test's slot values.
func spec() LaunchSpec {
	return LaunchSpec{
		Cwd:            "/w/job-1",
		ContextProfile: "project",
		ToolLease:      ToolLease{Allowed: []string{"Read", "Edit", "Bash"}, Forbidden: []string{"Agent", "Task"}},
		SchemaPath:     "/run/av/job-1/schema.json",
		BudgetUSD:      5,
		WallS:          1800,
		IdleS:          300,
		Env:            map[string]string{"AV_JOB": "job-1"},
		ProviderMode:   "sub",
		SettingsPath:   "/run/av/job-1/job.json",
		InitExpect:     "sha256:" + strings.Repeat("ab", 32),
		AgentsPath:     "/run/av/job-1/agents.json",
		Record:         "builder",
		SessionID:      "0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c",
	}
}

func slot(t *testing.T, argv []string, flag string) string {
	t.Helper()
	i := slices.Index(argv, flag)
	if i < 0 || i+1 >= len(argv) {
		t.Fatalf("argv %q has no %s value", argv, flag)
	}
	return argv[i+1]
}

// ---- fixtures ----

func fixture(t *testing.T, name string) []byte {
	t.Helper()
	b, err := os.ReadFile(filepath.Join("testdata", "claude", name))
	if err != nil {
		t.Fatalf("fixture %s: %v", name, err)
	}
	return b
}

// lines splits a transcript into its lines, each without the newline.
func lines(b []byte) [][]byte {
	parts := bytes.Split(bytes.TrimSuffix(b, []byte("\n")), []byte("\n"))
	return parts
}

func join(ls [][]byte) []byte { return append(bytes.Join(ls, []byte("\n")), '\n') }

// initIndex is the index of the system/init line.
func initIndex(t *testing.T, ls [][]byte) int {
	t.Helper()
	for i, l := range ls {
		var m map[string]any
		if json.Unmarshal(l, &m) == nil && m["type"] == "system" && m["subtype"] == "init" {
			return i
		}
	}
	t.Fatal("transcript has no system/init line")
	return -1
}

func decode(t *testing.T, l []byte) map[string]any {
	t.Helper()
	var m map[string]any
	if err := json.Unmarshal(l, &m); err != nil {
		t.Fatalf("fixture line is not JSON: %v", err)
	}
	return m
}

func encode(t *testing.T, m map[string]any) []byte {
	t.Helper()
	b, err := json.Marshal(m)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

// replaced returns a copy of ls with line i replaced (or dropped, for nil).
func replaced(ls [][]byte, i int, l []byte) [][]byte {
	out := append([][]byte{}, ls[:i]...)
	if l != nil {
		out = append(out, l)
	}
	return append(out, ls[i+1:]...)
}

// golden is the expected harness: InitHash of success.jsonl's system/init, as the compiled
// record's init_expect would be.
func golden(t *testing.T, c *Claude) string {
	t.Helper()
	ls := lines(fixture(t, "success.jsonl"))
	h, err := c.InitHash(ls[initIndex(t, ls)])
	if err != nil {
		t.Fatalf("InitHash(golden init): %v", err)
	}
	if !hexHash.MatchString(h) {
		t.Fatalf("InitHash = %q, want sha256:<64 hex>", h)
	}
	return h
}

// gate is a worker's stdout as a live pipe: one line per Read. The line at hold is not written
// until the worker gets there, so a Read for it blocks; if abort comes first the process is
// killed and the pipe reaches EOF. A Read that is still blocked after 2s means the adapter
// waited for the worker's next event before aborting, and the worker made its tool call.
type gate struct {
	mu        sync.Mutex
	ls        [][]byte
	next      int
	pending   []byte
	hold      int
	aborted   chan struct{}
	once      sync.Once
	reasons   []Reason
	violation bool
}

func newGate(ls [][]byte, hold int) *gate {
	return &gate{ls: ls, hold: hold, aborted: make(chan struct{})}
}

func (g *gate) abort(r Reason) {
	g.mu.Lock()
	g.reasons = append(g.reasons, r)
	g.mu.Unlock()
	g.once.Do(func() { close(g.aborted) })
}

func (g *gate) isAborted() bool {
	select {
	case <-g.aborted:
		return true
	default:
		return false
	}
}

func (g *gate) Read(p []byte) (int, error) {
	if g.isAborted() {
		return 0, io.EOF
	}
	g.mu.Lock()
	if len(g.pending) == 0 {
		if g.next >= len(g.ls) {
			g.mu.Unlock()
			return 0, io.EOF
		}
		if g.next == g.hold {
			g.mu.Unlock()
			select {
			case <-g.aborted:
				return 0, io.EOF
			case <-time.After(2 * time.Second):
			}
			g.mu.Lock()
			g.violation = true
		}
		g.pending = append(append([]byte{}, g.ls[g.next]...), '\n')
		g.next++
	}
	n := copy(p, g.pending)
	g.pending = g.pending[n:]
	g.mu.Unlock()
	return n, nil
}

type watched struct {
	tr      Transcript
	err     error
	reasons []Reason
}

// watch runs Watch over b with no gate, collecting abort calls.
func watch(c *Claude, b []byte, expect string) watched {
	var w watched
	var mu sync.Mutex
	w.tr, w.err = c.Watch(bytes.NewReader(b), expect, func(r Reason) {
		mu.Lock()
		w.reasons = append(w.reasons, r)
		mu.Unlock()
	})
	return w
}

// mustAbortBeforeToolCall drives ls through a gate held at the first tool-call line and asserts
// a harness abort happened before the adapter asked for it.
func mustAbortBeforeToolCall(t *testing.T, c *Claude, ls [][]byte, hold int, expect string) Transcript {
	t.Helper()
	g := newGate(ls, hold)
	tr, err := c.Watch(g, expect, g.abort)
	if !errors.Is(err, ErrHarness) {
		t.Errorf("Watch error = %v, want ErrHarness", err)
	}
	if g.violation {
		t.Errorf("the adapter read line %d (the first tool call) before aborting", hold)
	}
	if len(g.reasons) != 1 || g.reasons[0] != ReasonHarness {
		t.Errorf("abort calls = %v, want exactly one, ReasonHarness", g.reasons)
	}
	return tr
}

func mustNotAdjudicateHarness(t *testing.T, c *Claude, tr Transcript) {
	t.Helper()
	for _, exit := range []ExitInfo{{Code: 0}, {Code: -1, Killed: KilledHarness}} {
		o := c.Classify(tr, exit)
		if o.Status == Adjudicate || o.Status == Partial || o.Reason != ReasonHarness || len(o.Output) != 0 {
			t.Errorf("Classify(aborted, %+v) = %+v, want a non-adjudicate, non-partial outcome with Reason harness and no output", exit, o)
		}
	}
}

func jsonEqual(a, b []byte) bool {
	var x, y any
	if json.Unmarshal(a, &x) != nil || json.Unmarshal(b, &y) != nil {
		return false
	}
	return reflect.DeepEqual(x, y)
}

// ---- pinned argv: 09a §8.2 "Pinned launch lines"; §8.5 "argv: pinned templates above, any
// other flag → refused before exec"; "Never --bare, never --dangerously-skip-permissions" ----

func TestB1_06_PinnedArgv(t *testing.T) {
	c := NewClaude(claudeDigest)
	if got := c.Family(); got != "claude" {
		t.Errorf("Family() = %q, want claude", got)
	}
	if got := c.Template(); !slices.Equal(got, claudeTokens) {
		t.Fatalf("Template() = %q,\nwant the 09a §8.2 pinned line %q", got, claudeTokens)
	}
	if got := argvDigest(c.Template()); got != argvDigest(claudeTokens) {
		t.Errorf("Template digest = %s, want the grant's %s", got, argvDigest(claudeTokens))
	}

	t.Run("spec renders exactly the argv the launcher execs", func(t *testing.T) {
		argv, err := c.Argv(spec())
		if err != nil {
			t.Fatalf("Argv: %v", err)
		}
		if want := render(claudeTokens); !slices.Equal(argv, want) {
			t.Errorf("Argv = %q,\nwant  %q", argv, want)
		}
		if !matchesTemplate(c.Template(), argv) {
			t.Errorf("Argv does not match the pinned template under the launcher's slot rule")
		}
		for _, a := range argv {
			if a == "--dangerously-skip-permissions" || a == "--bare" || a == "--max-turns" || a == "--resume" ||
				(strings.HasPrefix(a, "--") && strings.Contains(a, "=")) {
				t.Errorf("Argv carries %q", a)
			}
		}
	})

	t.Run("values flow into their slots", func(t *testing.T) {
		s := spec()
		s.BudgetUSD = 2.5
		s.SessionID = "0192f7a6-1111-7222-8333-944455556666"
		s.Record = "reviewer"
		s.SettingsPath = "/run/av/job-9/job.json"
		argv, err := c.Argv(s)
		if err != nil {
			t.Fatalf("Argv: %v", err)
		}
		if !matchesTemplate(claudeTokens, argv) {
			t.Fatalf("Argv %q does not match the pinned template", argv)
		}
		if b, err := strconv.ParseFloat(slot(t, argv, "--max-budget-usd"), 64); err != nil || b != 2.5 {
			t.Errorf("--max-budget-usd %q, want 2.5", slot(t, argv, "--max-budget-usd"))
		}
		for flag, want := range map[string]string{"--session-id": s.SessionID, "--agent": "reviewer",
			"--settings": s.SettingsPath, "--json-schema": s.SchemaPath, "--agents": s.AgentsPath, "--setting-sources": s.ContextProfile} {
			if got := slot(t, argv, flag); got != want {
				t.Errorf("%s %q, want %q", flag, got, want)
			}
		}
	})

	// "--disallowedTools <forbidden, incl. Agent,Task>" (09a §8.2; DR-24, §8.4).
	t.Run("nested-agent tools are always forbidden", func(t *testing.T) {
		s := spec()
		s.ToolLease = ToolLease{Allowed: []string{"Read", "Grep"}, Forbidden: []string{"WebFetch"}}
		argv, err := c.Argv(s)
		if err != nil {
			t.Fatalf("Argv: %v", err)
		}
		forbidden := strings.Split(slot(t, argv, "--disallowedTools"), ",")
		allowed := strings.Split(slot(t, argv, "--allowedTools"), ",")
		for _, want := range []string{"WebFetch", "Agent", "Task"} {
			if !slices.Contains(forbidden, want) {
				t.Errorf("--disallowedTools %q lacks %s", forbidden, want)
			}
		}
		if !slices.Equal(allowed, []string{"Read", "Grep"}) {
			t.Errorf("--allowedTools %q, want [Read Grep]", allowed)
		}
	})

	t.Run("a spec that cannot fill the pinned line is refused", func(t *testing.T) {
		cases := map[string]func(*LaunchSpec){
			"no init_expect":               func(s *LaunchSpec) { s.InitExpect = "" },
			"zero budget":                  func(s *LaunchSpec) { s.BudgetUSD = 0 },
			"negative budget":              func(s *LaunchSpec) { s.BudgetUSD = -1 },
			"flag in the session-id slot":  func(s *LaunchSpec) { s.SessionID = "--dangerously-skip-permissions" },
			"flag in the record slot":      func(s *LaunchSpec) { s.Record = "--bare" },
			"flag in the settings slot":    func(s *LaunchSpec) { s.SettingsPath = "-s" },
			"empty record":                 func(s *LaunchSpec) { s.Record = "" },
			"empty settings":               func(s *LaunchSpec) { s.SettingsPath = "" },
			"empty schema":                 func(s *LaunchSpec) { s.SchemaPath = "" },
			"empty agents":                 func(s *LaunchSpec) { s.AgentsPath = "" },
			"empty profile":                func(s *LaunchSpec) { s.ContextProfile = "" },
			"empty session id":             func(s *LaunchSpec) { s.SessionID = "" },
			"nothing allowed":              func(s *LaunchSpec) { s.ToolLease.Allowed = nil },
			"Agent allowed":                func(s *LaunchSpec) { s.ToolLease.Allowed = []string{"Read", "Agent"} },
			"Task allowed":                 func(s *LaunchSpec) { s.ToolLease.Allowed = []string{"Task"} },
			"flag smuggled as a tool name": func(s *LaunchSpec) { s.ToolLease.Allowed = []string{"--add-dir", "/"} },
		}
		for name, mutate := range cases {
			t.Run(name, func(t *testing.T) {
				s := spec()
				mutate(&s)
				argv, err := c.Argv(s)
				if !errors.Is(err, ErrSpec) || argv != nil {
					t.Errorf("Argv = %q, %v; want nil, ErrSpec", argv, err)
				}
			})
		}
	})
}

// ---- contract_hash: 09a §8.2 "contract_hash(): Hex; // pinned binary + flag surface; checked
// nightly"; ENGINE-SPEC §8.2 "Pinning: CLIs/SDKs pinned ... nightly contract suite" ----

func TestB1_06_ContractHash(t *testing.T) {
	c := NewClaude(claudeDigest)
	h := c.ContractHash()
	if !hexHash.MatchString(h) {
		t.Fatalf("ContractHash() = %q, want sha256:<64 hex>", h)
	}
	if got := ContractHashOf(claudeDigest, claudeTokens); got != h {
		t.Errorf("ContractHash() = %s, want ContractHashOf(digest, Template()) = %s", h, got)
	}
	if NewClaude(claudeDigest).ContractHash() != h {
		t.Error("ContractHash is not deterministic")
	}
	other := "sha256:" + strings.Repeat("3", 64)
	if NewClaude(other).ContractHash() == h {
		t.Error("a different binary digest leaves contract_hash unchanged: the pinned binary is not in it")
	}

	seen := map[string]string{h: "pinned"}
	add := func(name string, d string, toks []string) {
		got := ContractHashOf(d, toks)
		if !hexHash.MatchString(got) {
			t.Errorf("%s: ContractHashOf = %q, want sha256:<64 hex>", name, got)
		}
		if prev, dup := seen[got]; dup {
			t.Errorf("%s: contract_hash equals that of %s; the flag surface is not fully in it", name, prev)
		}
		seen[got] = name
	}
	for i := range claudeTokens {
		toks := slices.Clone(claudeTokens)
		toks[i] += "x"
		add("token "+strconv.Itoa(i)+" changed", claudeDigest, toks)
	}
	add("a token dropped", claudeDigest, claudeTokens[1:])
	add("--bare appended", claudeDigest, append(slices.Clone(claudeTokens), "--bare"))
	swapped := slices.Clone(claudeTokens)
	swapped[0], swapped[1] = swapped[1], swapped[0]
	add("two tokens swapped", claudeDigest, swapped)
	merged := append([]string{claudeTokens[0] + claudeTokens[1]}, claudeTokens[2:]...)
	add("a token boundary moved", claudeDigest, merged)
	add("digest/token boundary moved", claudeDigest+claudeTokens[0], claudeTokens[1:])
}

// ---- init_expect: 09a §8.2 "the system/init harness check against init_expect
// (tool-description hashes included, so a changed MCP description aborts before the first tool
// call)"; ENGINE-SPEC §8.2 "Harness check: Parse system/init (tools, agents, MCP servers,
// plugins) against the compiled record's expected hash; mismatch aborts before any tool use";
// ENGINE-SPEC §8.1 "running: adapter launched, system/init verified" ----

func TestB1_06_ChangedMCPDescriptionAbortsBeforeFirstToolCall(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	ls := lines(fixture(t, "mcp-description-changed.jsonl"))
	ii := initIndex(t, ls)

	// The fixture's init differs from the golden one in exactly one MCP tool's description.
	gl := lines(fixture(t, "success.jsonl"))
	want, got := decode(t, gl[initIndex(t, gl)]), decode(t, ls[ii])
	wd, gd := want["tool_description_sha256"].(map[string]any), got["tool_description_sha256"].(map[string]any)
	diff := []string{}
	for k := range wd {
		if wd[k] != gd[k] {
			diff = append(diff, k)
		}
	}
	delete(want, "tool_description_sha256")
	delete(got, "tool_description_sha256")
	if !reflect.DeepEqual(want, got) || len(wd) != len(gd) || !slices.Equal(diff, []string{"mcp__tracker__create_issue"}) {
		t.Fatalf("fixture drift: the inits must differ only in mcp__tracker__create_issue's description (diff %v)", diff)
	}
	if h, err := c.InitHash(ls[ii]); err != nil || h == expect {
		t.Errorf("InitHash(changed init) = %s, %v; want a hash other than init_expect", h, err)
	}

	tr := mustAbortBeforeToolCall(t, c, ls, ii+1, expect)
	mustNotAdjudicateHarness(t, c, tr)
}

func TestB1_06_InitExpectHarnessCheck(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	base := lines(fixture(t, "success.jsonl"))
	ii := initIndex(t, base)

	t.Run("a matching init runs to the end and adjudicates", func(t *testing.T) {
		g := newGate(base, -1)
		tr, err := c.Watch(g, expect, g.abort)
		if err != nil || len(g.reasons) != 0 {
			t.Fatalf("Watch = %v, aborts %v; want nil and none", err, g.reasons)
		}
		if g.next != len(base) {
			t.Errorf("Watch stopped after %d of %d lines", g.next, len(base))
		}
		if o := c.Classify(tr, ExitInfo{}); o.Status != Adjudicate {
			t.Errorf("Classify = %+v, want adjudicate", o)
		}
	})

	harness := map[string]func(m map[string]any){
		"a tool removed": func(m map[string]any) { m["tools"] = m["tools"].([]any)[1:] },
		"a tool added":   func(m map[string]any) { m["tools"] = append(m["tools"].([]any), "WebFetch") },
		"MCP server failed": func(m map[string]any) {
			m["mcp_servers"] = []any{map[string]any{"name": "tracker", "status": "failed"}}
		},
		"an MCP server added": func(m map[string]any) {
			m["mcp_servers"] = append(m["mcp_servers"].([]any), map[string]any{"name": "evil", "status": "connected"})
		},
		"an agent added": func(m map[string]any) { m["agents"] = append(m["agents"].([]any), "reviewer") },
		"a plugin added": func(m map[string]any) { m["plugins"] = []any{map[string]any{"name": "p", "path": "/tmp/p"}} },
		"a built-in description": func(m map[string]any) {
			m["tool_description_sha256"].(map[string]any)["Bash"] = "sha256:" + strings.Repeat("9", 64)
		},
		"a description dropped": func(m map[string]any) {
			delete(m["tool_description_sha256"].(map[string]any), "mcp__tracker__list_issues")
		},
		"the description map gone": func(m map[string]any) { delete(m, "tool_description_sha256") },
	}
	for name, mutate := range harness {
		t.Run("aborts: "+name, func(t *testing.T) {
			m := decode(t, base[ii])
			mutate(m)
			tr := mustAbortBeforeToolCall(t, c, replaced(base, ii, encode(t, m)), ii+1, expect)
			mustNotAdjudicateHarness(t, c, tr)
		})
	}

	perRun := map[string]func(m map[string]any){
		"re-encoded":         func(map[string]any) {},
		"another session_id": func(m map[string]any) { m["session_id"] = "0192f7a7-0000-7000-8000-000000000000" },
		"another uuid":       func(m map[string]any) { m["uuid"] = "b0c1d2e3-ffff-4fff-8fff-ffffffffffff" },
	}
	for name, mutate := range perRun {
		t.Run("does not abort: "+name, func(t *testing.T) {
			m := decode(t, base[ii])
			mutate(m)
			w := watch(c, join(replaced(base, ii, encode(t, m))), expect)
			if w.err != nil || len(w.reasons) != 0 {
				t.Errorf("Watch = %v, aborts %v; a per-run field is not the harness", w.err, w.reasons)
			}
		})
	}

	t.Run("aborts: init_expect does not match", func(t *testing.T) {
		tr := mustAbortBeforeToolCall(t, c, base, ii+1, "sha256:"+strings.Repeat("0", 64))
		mustNotAdjudicateHarness(t, c, tr)
	})
	t.Run("aborts: no init_expect at all", func(t *testing.T) {
		tr := mustAbortBeforeToolCall(t, c, base, ii+1, "")
		mustNotAdjudicateHarness(t, c, tr)
	})
	t.Run("aborts: a tool call before system/init", func(t *testing.T) {
		ls := lines(fixture(t, "no-init.jsonl"))
		tr := mustAbortBeforeToolCall(t, c, ls, 1, expect)
		mustNotAdjudicateHarness(t, c, tr)
	})
	t.Run("InitHash refuses a line that is not system/init", func(t *testing.T) {
		for _, l := range [][]byte{base[0], base[ii+1], []byte("not json")} {
			if h, err := c.InitHash(l); err == nil {
				t.Errorf("InitHash(%.40s…) = %s, nil; want an error", l, h)
			}
		}
	})
}

// ---- subtype map: ENGINE-SPEC §8.3 "Result-subtype mapping (the agent's claimed status is
// logged, never used)", kept verbatim by 09a §8.2; Rule 10 ----

func TestB1_06_SubtypeMap(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	success := lines(fixture(t, "success.jsonl"))
	last := len(success) - 1
	withResult := func(edit func(m map[string]any)) []byte {
		m := decode(t, success[last])
		edit(m)
		return join(replaced(success, last, encode(t, m)))
	}

	cases := []struct {
		name    string
		stream  []byte
		exit    ExitInfo
		status  Status
		reason  Reason // "" = canon names no qualifier; not checked
		claimed string
	}{
		{"success, exit 0", fixture(t, "success.jsonl"), ExitInfo{}, Adjudicate, "", "success"},
		{"error_max_turns", fixture(t, "error-max-turns.jsonl"), ExitInfo{Code: 1}, Partial, "", "error_max_turns"},
		{"error_max_budget_usd", fixture(t, "error-max-budget-usd.jsonl"), ExitInfo{Code: 1}, Blocked, ReasonBudget, "error_max_budget_usd"},
		{"error_max_structured_output_retries", fixture(t, "error-max-structured-output-retries.jsonl"), ExitInfo{Code: 1}, Unresolved, ReasonSchema, "error_max_structured_output_retries"},
		{"error_during_execution claiming success", fixture(t, "error-during-execution.jsonl"), ExitInfo{Code: 1}, Unresolved, "", "error_during_execution"},
		{"error_during_execution, exit 0", fixture(t, "error-during-execution.jsonl"), ExitInfo{}, Unresolved, "", "error_during_execution"},
		{"success, non-zero exit", fixture(t, "success.jsonl"), ExitInfo{Code: 1}, Unresolved, "", "success"},
		{"success with is_error", withResult(func(m map[string]any) { m["is_error"] = true }), ExitInfo{}, Unresolved, "", "success"},
		{"success, then wall-clock kill", fixture(t, "success.jsonl"), ExitInfo{Code: -1, Killed: KilledWall}, Unresolved, ReasonTimeout, "success"},
		{"no result, idle kill", join(success[:last]), ExitInfo{Code: -1, Killed: KilledIdle}, Unresolved, ReasonTimeout, ""},
		{"truncated result, wall-clock kill", fixture(t, "truncated.jsonl"), ExitInfo{Code: -1, Killed: KilledWall}, Unresolved, ReasonTimeout, ""},
		{"unknown subtype", withResult(func(m map[string]any) { m["subtype"] = "error_new_in_2_2" }), ExitInfo{Code: 1}, Unresolved, ReasonUnparsed, "error_new_in_2_2"},
		{"unknown subtype, exit 0", withResult(func(m map[string]any) { m["subtype"] = "ok" }), ExitInfo{}, Unresolved, ReasonUnparsed, "ok"},
		{"no result event, exit 0", join(success[:last]), ExitInfo{}, Unresolved, ReasonUnparsed, ""},
		{"truncated result, exit 0", fixture(t, "truncated.jsonl"), ExitInfo{}, Unresolved, ReasonUnparsed, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			w := watch(c, tc.stream, expect)
			if len(w.reasons) != 0 || errors.Is(w.err, ErrHarness) {
				t.Fatalf("Watch aborted (%v, %v) on a matching harness", w.reasons, w.err)
			}
			o := c.Classify(w.tr, tc.exit)
			if o.Status != tc.status || (tc.reason != "" && o.Reason != tc.reason) {
				t.Errorf("Classify = %s(%s), want %s(%s)", o.Status, o.Reason, tc.status, tc.reason)
			}
			if tc.claimed != "" && o.Claimed != tc.claimed {
				t.Errorf("Claimed = %q, want the worker's subtype %q, logged", o.Claimed, tc.claimed)
			}
			if o.Status != Adjudicate && len(o.Output) != 0 {
				t.Errorf("a %s outcome carries output %s", o.Status, o.Output)
			}
		})
	}

	t.Run("adjudicate carries the init's identity and the top-level output", func(t *testing.T) {
		o := c.Classify(watch(c, fixture(t, "success.jsonl"), expect).tr, ExitInfo{})
		if !jsonEqual(o.Output, []byte(`{"summary":"rate limit added","files":["src/api/scan/route.ts"]}`)) {
			t.Errorf("Output = %s, want the result's structured_output", o.Output)
		}
		// 09a §8.7: model_id as the worker reported it in system/init.
		if o.ModelID != "claude-opus-5" || o.SessionID != "0192f7a4-6f1e-7c3a-9b1d-3c5e7a9b1d3c" {
			t.Errorf("ModelID %q SessionID %q, want claude-opus-5 and the init's session_id", o.ModelID, o.SessionID)
		}
		// ENGINE-SPEC §8.2 contract fixture "a denied tool is visible".
		if !slices.Equal(o.Denied, []string{"WebFetch"}) {
			t.Errorf("Denied = %q, want [WebFetch]", o.Denied)
		}
		// 09a §8.7 again: the assistant messages name another model; the init's id still wins.
		other := slices.Clone(success)
		for i, l := range other {
			if m := decode(t, l); m["type"] == "assistant" {
				m["message"].(map[string]any)["model"] = "claude-haiku-4-5"
				other[i] = encode(t, m)
			}
		}
		if o := c.Classify(watch(c, join(other), expect).tr, ExitInfo{}); o.ModelID != "claude-opus-5" {
			t.Errorf("ModelID = %q with assistant messages naming claude-haiku-4-5, want the init's claude-opus-5", o.ModelID)
		}
	})
}

// ---- Rule 10, B1-06 acceptance "empty result → `unresolved`"; ENGINE-SPEC §8.3 "non-empty
// schema-valid output → adjudication", "empty output ... → unresolved" ----

func TestB1_06_EmptyResultIsUnresolved(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	empty := lines(fixture(t, "empty-result.jsonl"))
	last := len(empty) - 1
	variants := map[string]func(m map[string]any){
		"the fixture":                func(map[string]any) {},
		"structured_output null":     func(m map[string]any) { m["structured_output"] = nil },
		"structured_output {}":       func(m map[string]any) { m["structured_output"] = map[string]any{} },
		"structured_output []":       func(m map[string]any) { m["structured_output"] = []any{} },
		"structured_output \"\"":     func(m map[string]any) { m["structured_output"] = "" },
		"a PASS claim and no output": func(m map[string]any) { m["result"] = "PASS: all done-tests green" },
		"no result field either":     func(m map[string]any) { delete(m, "result") },
	}
	for name, edit := range variants {
		t.Run(name, func(t *testing.T) {
			m := decode(t, empty[last])
			edit(m)
			w := watch(c, join(replaced(empty, last, encode(t, m))), expect)
			if w.err != nil || len(w.reasons) != 0 {
				t.Fatalf("Watch = %v, aborts %v", w.err, w.reasons)
			}
			o := c.Classify(w.tr, ExitInfo{})
			if o.Status != Unresolved {
				t.Errorf("Classify(empty result, exit 0) = %s(%s), want unresolved, never pass", o.Status, o.Reason)
			}
			if len(o.Output) != 0 {
				t.Errorf("an unresolved outcome carries output %s", o.Output)
			}
		})
	}
}

// Rule 10 across every fixture: the status set is closed, and exactly one recorded run
// (success.jsonl, exit 0, not killed) reaches adjudication.
func TestB1_06_NothingElseAdjudicates(t *testing.T) {
	c := NewClaude(claudeDigest)
	expect := golden(t, c)
	names, err := filepath.Glob(filepath.Join("testdata", "claude", "*.jsonl"))
	if err != nil || len(names) < 10 {
		t.Fatalf("fixtures: %v, %d files; want the 10 registered", err, len(names))
	}
	exits := []ExitInfo{{}, {Code: 1}, {Code: -1, Killed: KilledWall}, {Code: -1, Killed: KilledIdle}}
	adjudicated := 0
	for _, path := range names {
		name := filepath.Base(path)
		b := fixture(t, name)
		e := expect
		if name == "children.jsonl" {
			ls := lines(b)
			if e, err = c.InitHash(ls[initIndex(t, ls)]); err != nil {
				t.Fatalf("InitHash(children init): %v", err)
			}
		}
		for _, exit := range exits {
			o := c.Classify(watch(c, b, e).tr, exit)
			switch o.Status {
			case Adjudicate:
				adjudicated++
				if name != "success.jsonl" || exit != (ExitInfo{}) {
					t.Errorf("%s with %+v adjudicates; only success.jsonl at exit 0 may", name, exit)
				}
			case Partial, Blocked, Unresolved:
			default:
				t.Errorf("%s with %+v: status %q is outside the closed set", name, exit, o.Status)
			}
		}
	}
	if adjudicated != 1 {
		t.Errorf("%d runs adjudicated, want exactly 1", adjudicated)
	}
}

// ---- children: 09a §8.2 "children(stream): ChildJob[]; // nested agents, keyed by
// parent_tool_use_id"; §8.4 "the runner keys events on parent_tool_use_id and journals a child
// Job ... a child's verdict never counts" ----

func TestB1_06_Children(t *testing.T) {
	c := NewClaude(claudeDigest)
	b := fixture(t, "children.jsonl")
	ls := lines(b)
	expect, err := c.InitHash(ls[initIndex(t, ls)])
	if err != nil {
		t.Fatalf("InitHash: %v", err)
	}
	w := watch(c, b, expect)
	if w.err != nil || len(w.reasons) != 0 {
		t.Fatalf("Watch = %v, aborts %v", w.err, w.reasons)
	}
	want := map[string]ChildJob{
		"toolu_01A": {ToolUseID: "toolu_01A", Parent: "", Tool: "Agent", AgentType: "reviewer", Events: 6},
		"toolu_03T": {ToolUseID: "toolu_03T", Parent: "toolu_01A", Tool: "Task", AgentType: "tester", Events: 1},
		"toolu_09X": {ToolUseID: "toolu_09X", Parent: "", Tool: "", AgentType: "", Events: 1},
		"toolu_04B": {ToolUseID: "toolu_04B", Parent: "", Tool: "Task", AgentType: "researcher", Events: 1},
		"toolu_05Z": {ToolUseID: "toolu_05Z", Parent: "", Tool: "Agent", AgentType: "tester", Events: 0},
	}
	got := map[string]ChildJob{}
	for _, ch := range c.Children(w.tr) {
		if _, dup := got[ch.ToolUseID]; dup {
			t.Errorf("child %s reported twice", ch.ToolUseID)
		}
		got[ch.ToolUseID] = ch
	}
	for id, ch := range want {
		if got[id] != ch {
			t.Errorf("child %s = %+v, want %+v", id, got[id], ch)
		}
	}
	for id := range got {
		if _, ok := want[id]; !ok {
			t.Errorf("unexpected child %s (a plain tool call is not a nested agent)", id)
		}
	}

	t.Run("a child's verdict never counts", func(t *testing.T) {
		o := c.Classify(w.tr, ExitInfo{Code: 1})
		if o.Status != Unresolved || o.Claimed != "error_during_execution" || len(o.Output) != 0 {
			t.Errorf("Classify = %+v, want unresolved from the top-level error_during_execution", o)
		}
		if o.ModelID != "claude-opus-5" {
			t.Errorf("ModelID = %q, want the init's claude-opus-5, not a child's", o.ModelID)
		}
		// The child's success result moved after the top-level one: still not the outcome.
		ci := slices.IndexFunc(ls, func(l []byte) bool { return bytes.Contains(l, []byte(`"uuid":"z-child"`)) })
		if ci < 0 {
			t.Fatal("fixture drift: no child result line")
		}
		moved := append(replaced(ls, ci, nil), ls[ci])
		o = c.Classify(watch(c, join(moved), expect).tr, ExitInfo{})
		if o.Status == Adjudicate || o.Claimed != "error_during_execution" {
			t.Errorf("with the child's result last: %+v, want the top-level error_during_execution, unresolved", o)
		}
	})

	t.Run("no nested agents, no children", func(t *testing.T) {
		if got := c.Children(watch(c, fixture(t, "success.jsonl"), golden(t, c)).tr); len(got) != 0 {
			t.Errorf("Children(success) = %+v, want none", got)
		}
	})
}
