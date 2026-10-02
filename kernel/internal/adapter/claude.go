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
	"unicode/utf8"
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

// nestedAgentTools are the tools that spawn a nested agent (09a §8.4, founder ruling B). Task is
// an alias of Agent (founder ruling F): one tool under two names.
var nestedAgentTools = [...]string{"Agent", "Task"}

// nestedAgentBase: a rule's base names a nested-agent tool, in any spelling.
func nestedAgentBase(base string) bool {
	for _, n := range nestedAgentTools {
		if strings.EqualFold(base, n) {
			return true
		}
	}
	return false
}

var harnessHash = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)

func specErr(format string, a ...any) error {
	return fmt.Errorf("%w: %s", ErrSpec, fmt.Sprintf(format, a...))
}

// Argv fills Template's slots from spec (DR-B1-06-ADAPTER-RULINGS-2026-10-02).
//   - --setting-sources comes from a pinned table keyed by ContextProfile. Its one row is
//     launch-pack → project; any other profile is ErrSpec.
//   - Allowed and Forbidden are lists of single tool names, comma-joined into their slots.
//   - Agent and Task, bare or as a rule such as Agent(x), are added to the forbidden slot unless
//     FundedTeam is set and either is on the allowed list (ruling F: Task is an alias of Agent,
//     so allowing one lifts the forbid of both); allowing either without FundedTeam is ErrSpec,
//     and so is a lease forbid that would deny an allowed nested-agent rule.
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
	// Ruling F: Task is an alias of Agent (the CLI maps one to the other), so they are one tool:
	// an exact Agent or Task rule on a funded allow list lifts the default forbid of both, and a
	// lease forbid that would deny an allowed nested-agent rule is refused, not passed through.
	nestedLifted := false
	for _, t := range allowed {
		base, arg, _ := strings.Cut(t, "(")
		if !nestedAgentBase(base) {
			continue
		}
		if !spec.FundedTeam {
			return nil, specErr("%q spawns a nested agent and the job is not a funded team", t)
		}
		if slices.Contains(nestedAgentTools[:], base) {
			nestedLifted = true
		}
		for _, f := range forbidden {
			fbase, farg, _ := strings.Cut(f, "(")
			if nestedAgentBase(fbase) && (farg == "" || farg == arg) {
				return nil, specErr("forbidden %q would deny allowed %q (Task is an alias of Agent)", f, t)
			}
		}
	}
	if !nestedLifted {
		for _, n := range nestedAgentTools {
			if !slices.Contains(forbidden, n) {
				forbidden = append(forbidden, n)
			}
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
	// r6: no backslash anywhere: the CLI ignores a rule whose argument it cannot read, so a
	// forbidden Bash(x\) would be silently void.
	if !slotValue(t) || strings.ContainsAny(t, ",\\") {
		return false
	}
	// r4: ASCII only. The CLI splits with JavaScript's \s, which matches Unicode separators
	// (U+00A0, U+2028, U+3000, U+FEFF, ...) that unicode.IsSpace partly misses.
	for i := 0; i < len(t); i++ {
		if t[i] >= utf8.RuneSelf {
			return false
		}
	}
	// r5: at most one parenthesised argument, ending the rule, holding no parenthesis. The CLI
	// tracks parentheses with a boolean, not a depth, so a nested group would end the rule early.
	base, arg, hasArg := strings.Cut(t, "(")
	if base == "" || strings.ContainsRune(base, ')') {
		return false
	}
	for _, r := range base {
		if unicode.IsSpace(r) || unicode.IsControl(r) {
			return false
		}
	}
	if !hasArg {
		return true
	}
	arg, closed := strings.CutSuffix(arg, ")")
	if !closed || arg == "" || strings.ContainsAny(arg, "()") {
		return false
	}
	// Whitespace inside the argument: single ASCII spaces between non-space characters only
	// (r3's "Bash(git diff:*)"); no leading, trailing or doubled space, no other whitespace.
	if arg[0] == ' ' || arg[len(arg)-1] == ' ' || strings.Contains(arg, "  ") {
		return false
	}
	for _, r := range arg {
		if unicode.IsControl(r) || (r != ' ' && unicode.IsSpace(r)) {
			return false
		}
	}
	return true
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
	o, ok := objectOf(line)
	if !ok {
		return event{}, false
	}
	if ev.typ, ok = o.str("type"); !ok {
		return event{}, false
	}
	ev.parent, _ = o.str("parent_tool_use_id") // null or absent: top level
	if _, present := o["subtype"]; present {
		ev.subtype, ev.subtypeOK = o.str("subtype")
	}
	switch ev.typ {
	case "assistant":
		ev.spawns = spawnsOf(o)
	case "result":
		ev.isErrorFalse = string(bytes.TrimSpace(o["is_error"])) == "false"
		ev.output = o["structured_output"]
		if raw, present := o["permission_denials"]; present {
			var ds []json.RawMessage
			if json.Unmarshal(raw, &ds) != nil {
				ev.malformed = true
				return ev, true
			}
			for _, d := range ds {
				do, ok := objectOf(d)
				name, okName := do.str("tool_name")
				if !ok || !okName {
					ev.malformed = true
					return ev, true
				}
				ev.denied = append(ev.denied, name)
			}
		}
	}
	return ev, true
}

// obj is one JSON object, keyed exactly. Go's struct decoding matches keys case-insensitively
// and lets a later variant win; the CLI writes JSON from JavaScript, where keys are exact, so
// the adapter reads every field it decides on through obj (DR r5).
type obj map[string]json.RawMessage

func objectOf(b []byte) (obj, bool) {
	var o obj
	if json.Unmarshal(b, &o) != nil || o == nil {
		return nil, false
	}
	return o, true
}

// str is the exact key k as a JSON string; ok is false when k is absent, null or not a string.
func (o obj) str(k string) (string, bool) {
	raw, present := o[k]
	if !present || string(bytes.TrimSpace(raw)) == "null" {
		return "", false
	}
	var s string
	if json.Unmarshal(raw, &s) != nil {
		return "", false
	}
	return s, true
}

// spawnsOf returns the nested-agent tool_use blocks of an assistant event. It is lenient about
// everything else in the message: a spawn it misses still shows up as a child through its
// events' parent_tool_use_id.
func spawnsOf(ev obj) []spawn {
	msg, ok := objectOf(ev["message"])
	if !ok {
		return nil
	}
	var blocks []json.RawMessage
	if json.Unmarshal(msg["content"], &blocks) != nil {
		return nil
	}
	var out []spawn
	for _, raw := range blocks {
		b, ok := objectOf(raw)
		if !ok {
			continue
		}
		typ, _ := b.str("type")
		id, _ := b.str("id")
		name, _ := b.str("name")
		if typ != "tool_use" || id == "" || !slices.Contains(nestedAgentTools[:], name) {
			continue
		}
		in, _ := objectOf(b["input"])
		at, _ := in.str("subagent_type")
		out = append(out, spawn{id: id, name: name, agentType: at})
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
//
// Every system/init must also report permissionMode "dontAsk", the pinned mode (DR r4).
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
				if err != nil || initExpect == "" || h != initExpect || !pinnedPermissionMode(line) {
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

// pinnedPermissionMode: the init reports the pinned `--permission-mode dontAsk` (09a §8.2;
// DR-B1-06 r4). A separate check from init_expect, which keeps ruling A's four fields.
func pinnedPermissionMode(line []byte) bool {
	o, ok := objectOf(line)
	mode, okMode := o.str("permissionMode")
	return ok && okMode && mode == "dontAsk"
}

func initOf(line []byte) *initInfo {
	o, _ := objectOf(line) // InitHash has already parsed the line as an object
	sid, _ := o.str("session_id")
	model, _ := o.str("model")
	return &initInfo{sessionID: sid, model: model}
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
//  3. an unrecognised top-level event → unresolved(unparsed) (ruling E; the r4 assumption in
//     the DR note: such a run has no typed outcome, so it counts toward the UNPARSED rate);
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
	case t.unknown > 0: // ruling E; r4 assumption: no typed outcome, so UNPARSED
		return set(Unresolved, ReasonUnparsed)
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
