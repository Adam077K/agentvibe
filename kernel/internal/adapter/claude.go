package adapter

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"unicode"
)

// Claude is the WorkerAdapter for the `claude` CLI (09a §8.1: 2.1.284, no --max-turns).
type Claude struct {
	digest string
}

// NewClaude returns the adapter for the claude binary whose content digest is binaryDigest
// ("sha256:<hex>", the launcher grant's Binary.Digest).
func NewClaude(binaryDigest string) *Claude { return &Claude{digest: binaryDigest} }

var _ WorkerAdapter = (*Claude)(nil)

// claudeTemplate is the pinned claude launch line of 09a §8.2 as argv[1:] tokens. It is the
// template the launcher grant pins (the frozen B1-08 done-test's claudeTokens), so every
// change here is a protected-base change on both sides.
var claudeTemplate = [...]string{"-p", "--setting-sources", "<profile>", "--settings", "<job.json>",
	"--agents", "<compiled.json>", "--agent", "<record>", "--permission-mode", "dontAsk",
	"--allowedTools", "<allowed>", "--disallowedTools", "<forbidden>",
	"--output-format", "stream-json", "--verbose", "--json-schema", "<f>",
	"--max-budget-usd", "<B>", "--session-id", "<uuid>"}

// Family is "claude".
func (c *Claude) Family() string { return "claude" }

// Template is the pinned claude launch line of 09a §8.2 as argv[1:] tokens, "<name>" tokens
// being slots: exactly the template the launcher grant pins (launcher.ArgvTemplate.Tokens).
// Each call returns a fresh copy.
func (c *Claude) Template() []string { return slices.Clone(claudeTemplate[:]) }

// ContractHash is ContractHashOf(the binary digest, Template()).
func (c *Claude) ContractHash() string { return ContractHashOf(c.digest, claudeTemplate[:]) }

// settingSources is the pinned context-profile table (founder rulings C and D): the profile
// name is a key, never a value, and a profile the table does not hold is refused. `user`
// appears in no row: inheriting the operator's user settings is what 09a §8.3 forbids. A new
// row is a protected-base change.
func settingSources(profile string) (string, bool) {
	switch profile {
	case "launch-pack":
		return "project", true
	}
	return "", false
}

// nestedAgentTools are the tools that spawn a nested agent (09a §8.4, founder ruling B).
var nestedAgentTools = [...]string{"Agent", "Task"}

var harnessHash = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)

func specErr(format string, a ...any) error {
	return fmt.Errorf("%w: %s", ErrSpec, fmt.Sprintf(format, a...))
}

// Argv fills Template's slots from spec (DR-B1-06-ADAPTER-RULINGS-2026-10-02).
//   - --setting-sources comes from a pinned table keyed by ContextProfile. Its one row is
//     launch-pack → project; any other profile is ErrSpec.
//   - Allowed and Forbidden are lists of single tool names, comma-joined into their slots.
//   - Agent and Task, bare or as a rule such as Agent(x), are added to the forbidden slot unless
//     FundedTeam is set and the tool is
//     on the allowed list; allowing either without FundedTeam is ErrSpec.
//   - InitExpect must be a harness hash in InitHash's form ("sha256:" + 64 lowercase hex): any
//     other value could never match, so the run would only abort later.
//
// It returns ErrSpec (see its doc) rather than an argv the launcher would refuse.
func (c *Claude) Argv(spec LaunchSpec) ([]string, error) {
	sources, ok := settingSources(spec.ContextProfile)
	if !ok {
		return nil, specErr("context profile %q is not in the pinned table", spec.ContextProfile)
	}
	if !harnessHash.MatchString(spec.InitExpect) {
		return nil, specErr("init_expect %q is not a harness hash", spec.InitExpect)
	}
	if b := spec.BudgetUSD; math.IsNaN(b) || math.IsInf(b, 0) || b <= 0 {
		return nil, specErr("budget %v is not finite and positive", b)
	}
	for name, v := range map[string]string{"--settings": spec.SettingsPath, "--agents": spec.AgentsPath,
		"--agent": spec.Record, "--json-schema": spec.SchemaPath, "--session-id": spec.SessionID} {
		if !slotValue(v) {
			return nil, specErr("%s value %q cannot fill a slot", name, v)
		}
	}
	allowed, err := toolList("allowed", spec.ToolLease.Allowed)
	if err != nil {
		return nil, err
	}
	if len(allowed) == 0 {
		return nil, specErr("the tool lease allows nothing")
	}
	forbidden, err := toolList("forbidden", spec.ToolLease.Forbidden)
	if err != nil {
		return nil, err
	}
	for _, t := range allowed {
		if slices.Contains(forbidden, t) {
			return nil, specErr("tool %q is both allowed and forbidden", t)
		}
	}
	// Ruling B: a nested-agent tool may be allowed only for a funded team. The check folds case
	// so a variant spelling cannot pass unfunded; only an exact base name lifts the default
	// forbid, so a variant spelling never unforbids the real tool.
	allowedNested := map[string]bool{}
	for _, t := range allowed {
		base, _, _ := strings.Cut(t, "(")
		for _, n := range nestedAgentTools {
			if strings.EqualFold(base, n) {
				if !spec.FundedTeam {
					return nil, specErr("%q spawns a nested agent and the job is not a funded team", t)
				}
				if base == n {
					allowedNested[n] = true
				}
			}
		}
	}
	for _, n := range nestedAgentTools {
		if !allowedNested[n] && !slices.Contains(forbidden, n) {
			forbidden = append(forbidden, n)
		}
	}
	if len(forbidden) == 0 {
		return nil, specErr("the tool lease forbids nothing")
	}

	fill := map[string]string{
		"<profile>": sources, "<job.json>": spec.SettingsPath, "<compiled.json>": spec.AgentsPath,
		"<record>": spec.Record, "<allowed>": strings.Join(allowed, ","),
		"<forbidden>": strings.Join(forbidden, ","), "<f>": spec.SchemaPath,
		"<B>": strconv.FormatFloat(spec.BudgetUSD, 'f', -1, 64), "<uuid>": spec.SessionID,
	}
	argv := make([]string, len(claudeTemplate))
	for i, tok := range claudeTemplate {
		if !isSlot(tok) {
			argv[i] = tok
			continue
		}
		v, ok := fill[tok]
		if !ok || !slotValue(v) { // every slot filled, and every value passes the launcher's slot rule
			return nil, specErr("slot %s cannot be filled", tok)
		}
		argv[i] = v
	}
	return argv, nil
}

func isSlot(tok string) bool { return strings.HasPrefix(tok, "<") && strings.HasSuffix(tok, ">") }

// slotValue is the launcher's slot rule (non-empty, not beginning with '-'), plus no NUL byte,
// which no argv element can carry.
func slotValue(v string) bool {
	return v != "" && !strings.HasPrefix(v, "-") && !strings.ContainsRune(v, 0)
}

// toolList validates each element as exactly one tool rule: a name, optionally followed by one
// parenthesised specifier that ends the rule ("Bash(git diff:*)"). The CLI splits tool lists
// on commas and whitespace, so a comma anywhere, or whitespace outside the parentheses, would
// make one element two rules.
func toolList(which string, list []string) ([]string, error) {
	out := make([]string, 0, len(list))
	for _, t := range list {
		if !toolRule(t) {
			return nil, specErr("%s tool %q is not one tool rule", which, t)
		}
		out = append(out, t)
	}
	return out, nil
}

func toolRule(t string) bool {
	if !slotValue(t) || strings.ContainsRune(t, ',') {
		return false
	}
	base, spec, hasSpec := strings.Cut(t, "(")
	if base == "" || strings.ContainsRune(base, ')') {
		return false
	}
	for _, r := range base {
		if unicode.IsSpace(r) || unicode.IsControl(r) {
			return false
		}
	}
	if !hasSpec {
		return true
	}
	depth := 1
	for i, r := range spec {
		if unicode.IsControl(r) {
			return false
		}
		switch r {
		case '(':
			depth++
		case ')':
			depth--
			if depth == 0 && i != len(spec)-1 {
				return false // text after the rule's closing parenthesis
			}
		}
	}
	return depth == 0
}

// errNotInit: InitHash was given a line that is not a system/init event.
var errNotInit = errors.New("adapter: not a system/init line")

// initHarnessFields are the fields init_expect covers (founder ruling A), in hashing order.
var initHarnessFields = [...]string{"tools", "mcp_servers", "agents", "plugins"}

// InitHash is the harness hash of one system/init line: exactly its tools, mcp_servers, agents
// and plugins (founder ruling A), and nothing per-run (session_id, uuid, cwd, model).
// init_expect is this hash of the init the Kernel's pinned MCP config and record imply.
//
// Each field is hashed as canonical JSON (object keys sorted, insignificant whitespace
// dropped), so re-encoding a line does not change its hash. Array order is kept: a reordered
// tool list is a different harness. A missing field hashes differently from any present value,
// null included.
func (c *Claude) InitHash(initLine []byte) (string, error) {
	var m map[string]json.RawMessage
	if err := json.Unmarshal(initLine, &m); err != nil || m == nil {
		return "", errNotInit
	}
	var typ, sub string
	if json.Unmarshal(m["type"], &typ) != nil || json.Unmarshal(m["subtype"], &sub) != nil ||
		typ != "system" || sub != "init" {
		return "", errNotInit
	}
	h := sha256.New()
	var n [8]byte
	put := func(b []byte) {
		binary.BigEndian.PutUint64(n[:], uint64(len(b)))
		h.Write(n[:])
		h.Write(b)
	}
	put([]byte("agentvibe.adapter.claude.init_expect.v1"))
	for _, k := range initHarnessFields {
		put([]byte(k))
		raw, ok := m[k]
		if !ok {
			put([]byte{0})
			continue
		}
		canon, err := canonicalJSON(raw)
		if err != nil {
			return "", fmt.Errorf("%w: field %s: %v", errNotInit, k, err)
		}
		put(append([]byte{1}, canon...))
	}
	return "sha256:" + hex.EncodeToString(h.Sum(nil)), nil
}

func canonicalJSON(raw []byte) ([]byte, error) {
	d := json.NewDecoder(bytes.NewReader(raw))
	d.UseNumber()
	var v any
	if err := d.Decode(&v); err != nil {
		return nil, err
	}
	return json.Marshal(v)
}

// initInfo is what the adapter records from a verified system/init.
type initInfo struct {
	sessionID string
	model     string
}

// spawn is one tool_use block that spawns a nested agent.
type spawn struct {
	id, name, agentType string
}

// event is one parsed stream line. Only what classify and children read is kept, so a
// multi-megabyte tool result is not held in memory.
type event struct {
	typ       string
	subtype   string
	subtypeOK bool   // subtype was a JSON string
	parent    string // parent_tool_use_id; "" when null or absent
	spawns    []spawn

	// result events only
	malformed    bool // the result's fields do not have their documented types
	isErrorFalse bool // is_error is present and exactly false
	output       json.RawMessage
	denied       []string
}

// parseEvent parses one stream line. ok is false when the line is not a JSON object with a
// string type.
func parseEvent(line []byte) (ev event, ok bool) {
	var env struct {
		Type    *string         `json:"type"`
		Subtype json.RawMessage `json:"subtype"`
		Parent  *string         `json:"parent_tool_use_id"`
	}
	if json.Unmarshal(line, &env) != nil || env.Type == nil {
		return event{}, false
	}
	ev.typ = *env.Type
	if env.Parent != nil {
		ev.parent = *env.Parent
	}
	if env.Subtype != nil {
		ev.subtypeOK = json.Unmarshal(env.Subtype, &ev.subtype) == nil
	}
	switch ev.typ {
	case "assistant":
		ev.spawns = spawnsOf(line)
	case "result":
		var res struct {
			IsError json.RawMessage `json:"is_error"`
			Output  json.RawMessage `json:"structured_output"`
			Denials []struct {
				ToolName string `json:"tool_name"`
			} `json:"permission_denials"`
		}
		if json.Unmarshal(line, &res) != nil {
			ev.malformed = true
			return ev, true
		}
		ev.isErrorFalse = string(bytes.TrimSpace(res.IsError)) == "false"
		ev.output = res.Output
		for _, d := range res.Denials {
			ev.denied = append(ev.denied, d.ToolName)
		}
	}
	return ev, true
}

// spawnsOf returns the nested-agent tool_use blocks of an assistant event. It is lenient about
// everything else in the message: a spawn it misses still shows up as a child through its
// events' parent_tool_use_id.
func spawnsOf(line []byte) []spawn {
	var a struct {
		Message struct {
			Content json.RawMessage `json:"content"`
		} `json:"message"`
	}
	if json.Unmarshal(line, &a) != nil {
		return nil
	}
	var blocks []struct {
		Type  string          `json:"type"`
		ID    string          `json:"id"`
		Name  string          `json:"name"`
		Input json.RawMessage `json:"input"`
	}
	if json.Unmarshal(a.Message.Content, &blocks) != nil {
		return nil
	}
	var out []spawn
	for _, b := range blocks {
		if b.Type != "tool_use" || b.ID == "" || !slices.Contains(nestedAgentTools[:], b.Name) {
			continue
		}
		var in struct {
			SubagentType any `json:"subagent_type"`
		}
		_ = json.Unmarshal(b.Input, &in)
		at, _ := in.SubagentType.(string)
		out = append(out, spawn{id: b.ID, name: b.Name, agentType: at})
	}
	return out
}

// Watch reads stream-json from r, one event per line, to EOF; a line may be of any length.
// System events may precede system/init; any other event before it, or an init whose InitHash
// is not initExpect, makes Watch call abort(ReasonHarness) once, before it reads anything more
// from r, and return ErrHarness. After abort the launcher kills the process group and r
// reaches EOF.
//
// Fail-safe additions, none of which the frozen tests pin:
//   - a line before system/init that is not a JSON event is "any other event": abort;
//   - a stream that ends, or fails, before a verified system/init aborts too: the harness was
//     never verified, and a worker that closed its stdout may still be running;
//   - a later system/init is checked against initExpect like the first one.
func (c *Claude) Watch(r io.Reader, initExpect string, abort func(Reason)) (Transcript, error) {
	var t Transcript
	refuse := func() (Transcript, error) {
		t.aborted = true
		t.init = nil
		abort(ReasonHarness)
		return t, ErrHarness
	}
	br := bufio.NewReaderSize(r, 64<<10)
	for {
		line, rerr := br.ReadBytes('\n')
		if len(bytes.TrimSpace(line)) > 0 {
			ev, ok := parseEvent(line)
			isInit := ok && ev.typ == "system" && ev.subtype == "init"
			switch {
			case isInit:
				h, err := c.InitHash(line)
				if err != nil || initExpect == "" || h != initExpect {
					return refuse()
				}
				if t.init == nil {
					t.init = initOf(line)
				}
			case t.init == nil && (!ok || ev.typ != "system"):
				return refuse()
			case !ok:
				t.unparsed++
			}
			if ok {
				t.record(ev)
			}
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			if t.init == nil {
				return refuse()
			}
			t.readErr = true
			return t, rerr
		}
	}
	if t.init == nil {
		return refuse()
	}
	return t, nil
}

func initOf(line []byte) *initInfo {
	var m struct {
		SessionID string `json:"session_id"`
		Model     string `json:"model"`
	}
	_ = json.Unmarshal(line, &m) // InitHash has already parsed the line as an object
	return &initInfo{sessionID: m.SessionID, model: m.Model}
}

// record keeps one parsed event and counts what Classify needs.
func (t *Transcript) record(ev event) {
	if t.result != nil {
		t.trailing++
	}
	switch ev.typ {
	case "system", "assistant", "user":
	case "result":
		if ev.parent == "" {
			t.results++
		}
	default:
		t.unknown++ // founder ruling E: never a pass
	}
	t.events = append(t.events, ev)
	if ev.typ == "result" && ev.parent == "" && t.result == nil {
		r := ev
		t.result = &r
	}
}

// Classify applies ENGINE-SPEC §8.3's subtype map to the top-level result event. It never
// uses the worker's claimed status, and an empty result is never Adjudicate. A stream holding
// any top-level event type other than system, assistant, user or result (a rate-limit signal
// among them, whatever its status) is Unresolved or Blocked, never Adjudicate (founder ruling
// E: the rate-limit shape is measured first, frozen later).
//
// Precedence, first match wins:
//  1. harness not verified (aborted, no init) or killed by abort → unresolved(harness);
//  2. wall-clock or idle kill → unresolved(timeout); any other kill → unresolved;
//  3. an unrecognised top-level event → unresolved(unrecognised) (ruling E);
//  4. no typed outcome: a read error, an unparsed line, zero or several top-level results,
//     events after the result, or a result whose fields are mistyped → unresolved(unparsed);
//  5. the subtype map. success adjudicates only with exit 0, is_error exactly false and a
//     non-empty JSON object as structured_output; an unknown subtype is unresolved(unparsed).
func (c *Claude) Classify(t Transcript, exit ExitInfo) WorkerOutcome {
	var o WorkerOutcome
	if t.init != nil {
		o.SessionID, o.ModelID = t.init.sessionID, t.init.model
	}
	res := t.result
	if res != nil {
		o.Claimed = res.subtype
		o.Denied = slices.Clone(res.denied)
	}
	set := func(s Status, r Reason) WorkerOutcome {
		o.Status, o.Reason = s, r
		return o
	}
	switch {
	case t.aborted || t.init == nil || exit.Killed == KilledHarness:
		return set(Unresolved, ReasonHarness)
	case exit.Killed == KilledWall || exit.Killed == KilledIdle:
		return set(Unresolved, ReasonTimeout)
	case exit.Killed != NotKilled:
		return set(Unresolved, "")
	case t.unknown > 0:
		return set(Unresolved, ReasonUnrecognised)
	case t.readErr || t.unparsed > 0 || t.results != 1 || t.trailing > 0 || res == nil ||
		res.malformed || !res.subtypeOK:
		return set(Unresolved, ReasonUnparsed)
	}
	switch res.subtype {
	case "success":
		if exit.Code != 0 || !res.isErrorFalse || !nonEmptyObject(res.output) {
			return set(Unresolved, "") // non-zero exit, an error flag, or empty output
		}
		o.Output = slices.Clone(res.output)
		return set(Adjudicate, "")
	case "error_max_turns":
		return set(Partial, "")
	case "error_max_budget_usd":
		return set(Blocked, ReasonBudget)
	case "error_max_structured_output_retries":
		return set(Unresolved, ReasonSchema)
	case "error_during_execution":
		return set(Unresolved, "")
	}
	return set(Unresolved, ReasonUnparsed)
}

// nonEmptyObject: structured output from --json-schema is a JSON object; null, {}, [], "" and
// any non-object are empty for adjudication.
func nonEmptyObject(raw json.RawMessage) bool {
	var m map[string]json.RawMessage
	return json.Unmarshal(raw, &m) == nil && len(m) > 0
}

// Children returns every nested agent in t, keyed by parent_tool_use_id, in order of first
// appearance. A child is a Agent/Task tool_use (its spawn) or any id some event names as its
// parent_tool_use_id; a child seen only through its events has no Tool, AgentType or Parent.
func (c *Claude) Children(t Transcript) []ChildJob {
	var out []ChildJob
	idx := map[string]int{}
	at := func(id string) int {
		i, ok := idx[id]
		if !ok {
			i = len(out)
			idx[id] = i
			out = append(out, ChildJob{ToolUseID: id})
		}
		return i
	}
	for _, ev := range t.events {
		for _, sp := range ev.spawns {
			i := at(sp.id)
			if out[i].Tool == "" {
				out[i].Tool, out[i].AgentType, out[i].Parent = sp.name, sp.agentType, ev.parent
			}
		}
		if ev.parent != "" {
			out[at(ev.parent)].Events++
		}
	}
	return out
}
