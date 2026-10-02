// Package adapter holds the Kernel's WorkerAdapters: one per worker family, each turning a
// LaunchSpec into the pinned argv the launcher may exec, checking the worker's harness before
// its first tool call, and classifying its stream into a WorkerOutcome
// (docs/vision-v3/09a-ENGINEERING.md §8, "The runner and the WorkerAdapter").
//
// B1-06 froze the `claude` adapter's done-tests (claude_donetest_test.go, build tag donetest,
// fixtures under testdata/claude/). This file is NOT registered: it is the interface the job
// implements, and claude.go implements it.
//
// The adapter never spawns. 09a §8.5 makes kernel.launcher the only principal that may spawn a
// worker, and the launcher execs only argv matching a pinned template. So canon's
// `launch(spec): Running` is split here: the adapter returns argv (Argv), the launcher
// (internal/launcher, B1-08) execs it, and the adapter reads the stream (Watch).
package adapter

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
)

var (
	// ErrSpec: the LaunchSpec cannot fill the pinned argv: an empty slot or tool name; a slot
	// value or tool name that begins with '-' (the launcher's slot rule, so a flag cannot ride
	// in a slot); a tool name holding a comma, or whitespace outside parentheses (the CLI splits on
	// both; "Bash(git diff:*)" is one rule, "Read Agent" is two); a tool both allowed and
	// forbidden; a budget that is not finite and positive; an empty InitExpect; a context
	// profile not in the pinned table; Agent or Task allowed without FundedTeam; or nothing
	// left to forbid (DR-B1-06-ADAPTER-RULINGS-2026-10-02, rulings B and C).
	ErrSpec = errors.New("adapter: launch spec cannot fill the pinned argv")
	// ErrHarness: the worker's system/init does not match init_expect, or a non-system event
	// came before system/init. Watch has already called abort.
	ErrHarness = errors.New("adapter: harness does not match init_expect")
)

// Status is the adapter's verdict on one run. The set is closed and has no "pass": a run that
// succeeds goes to adjudication (diff, lease, done-test), and only adjudication can make it
// done (ENGINE-SPEC §8.3; Rule 10, `unresolved` never `pass`).
type Status string

const (
	Adjudicate Status = "adjudicate" // non-empty schema-valid output: hand to adjudication
	Partial    Status = "partial"    // runner-built continuation
	Blocked    Status = "blocked"
	Unresolved Status = "unresolved"
)

// Reason qualifies a Status where canon names a qualifier. An implementation may use other
// values for rows canon leaves unqualified.
type Reason string

const (
	ReasonBudget   Reason = "budget"   // blocked(budget)
	ReasonCapacity Reason = "capacity" // blocked(capacity)
	ReasonSchema   Reason = "schema"   // unresolved(schema)
	ReasonTimeout  Reason = "timeout"  // unresolved(timeout)
	ReasonHarness  Reason = "harness"  // init mismatch: aborted before the first tool call
	ReasonUnparsed Reason = "unparsed" // UNPARSED (09a §8.8), a kind of unresolved; also an unrecognised event (DR r4)
)

// WorkerOutcome is what classify returns. It never carries the worker's own verdict as a
// status: Claimed is logged, never used.
type WorkerOutcome struct {
	Status    Status
	Reason    Reason
	Claimed   string          // the worker's own result subtype, verbatim; logged, never used
	SessionID string          // as reported in system/init
	ModelID   string          // as reported in system/init (09a §8.7), never from the slot
	Output    json.RawMessage // the top-level structured_output; set only when Status == Adjudicate
	Denied    []string        // tool names in the top-level result's permission_denials
}

// Kill says why the process ended, if the runner ended it.
type Kill string

const (
	NotKilled     Kill = ""
	KilledWall    Kill = "wall"    // wall-clock backstop
	KilledIdle    Kill = "idle"    // idle-stream backstop
	KilledHarness Kill = "harness" // Watch called abort
)

// ExitInfo is how the worker process ended.
type ExitInfo struct {
	Code   int
	Killed Kill
}

// ToolLease is the job's tool lease (09a §8.4: tool leases carry a forbidden list).
type ToolLease struct {
	Allowed   []string
	Forbidden []string
}

// LaunchSpec is 09a §8.2's LaunchSpec. AgentsPath, Record and SessionID are not in canon's type
// but the pinned claude line needs them (--agents, --agent, --session-id); CodexProfile and
// ResultPath likewise for the pinned codex line (-p, -o; B1-07).
type LaunchSpec struct {
	Cwd              string
	ContextProfile   string // key into the pinned profile table; its row fills --setting-sources (ruling C)
	FundedTeam       bool   // the job is explicitly a funded team: Agent/Task may be allowed (ruling B)
	ToolLease        ToolLease
	SchemaPath       string  // --json-schema <f>
	BudgetUSD        float64 // --max-budget-usd <B>
	WallS            int
	IdleS            int
	Env              map[string]string // never a secret
	ProviderMode     string            // "sub" | "api"
	InferenceBaseURL string            // I3+: the proxy
	SettingsPath     string            // --settings <job.json>
	InitExpect       string            // harness hash system/init must match
	AgentsPath       string            // --agents <compiled.json>
	Record           string            // --agent <record>
	SessionID        string            // --session-id <uuid>
	CodexProfile     string            // codex -p <generated profile>: a profile name, never a path (B1-07)
	ResultPath       string            // codex -o <result.json> (B1-07)
}

// ChildJob is one nested agent, keyed by the tool_use id that spawned it; its events carry that
// id as parent_tool_use_id (09a §8.4).
type ChildJob struct {
	ToolUseID string // the spawning tool_use id
	Parent    string // parent_tool_use_id of the event that spawned it; "" when top-level or unseen
	Tool      string // the spawning tool's name; "" when the spawn was never seen
	AgentType string // the spawn's input.subagent_type; "" when unseen
	Events    int    // stream events whose parent_tool_use_id is ToolUseID
}

// Transcript is what Watch read. Its fields are the implementation's; the zero Transcript is a
// run whose harness was never verified, and classifies as unresolved(harness).
type Transcript struct {
	events   []event   // every event Watch parsed, in stream order, up to where it stopped
	init     *initInfo // the verified system/init; nil when none was verified
	aborted  bool      // Watch refused the harness (and called abort, unless the stream had ended)
	readErr  bool      // the stream failed before EOF after system/init
	unparsed int       // lines after system/init that are not a JSON event with a string type
	unknown  int       // top-level events whose type is not system, assistant, user or result
	results  int       // top-level result events (more than one is not a typed outcome)
	trailing int       // events after the first top-level result
	result   *event    // the first top-level result event
}

// WorkerAdapter is 09a §8.2's contract with launch split into Argv (adapter) + exec (launcher)
// + Watch (adapter). resume is not here: no resume line is pinned in 09a §8.2 or on the grant.
type WorkerAdapter interface {
	Family() string
	ContractHash() string
	Template() []string
	Argv(spec LaunchSpec) ([]string, error)
	Watch(r io.Reader, initExpect string, abort func(Reason)) (Transcript, error)
	Classify(t Transcript, exit ExitInfo) WorkerOutcome
	Children(t Transcript) []ChildJob
}

// ContractHashOf is the contract_hash of a binary digest ("sha256:<hex>") and a pinned flag
// surface (argv template tokens). It returns "sha256:" + 64 lowercase hex, and it is injective
// in practice: every change to the digest, to any token, to token order or to token boundaries
// changes it.
//
// Encoding: sha256 over a domain tag, the digest, the token count and each token, every string
// prefixed by its byte length as a big-endian uint64. The prefixes make the encoding
// prefix-free, so moving a boundary (between two tokens, or between the digest and the first
// token) changes the bytes hashed.
func ContractHashOf(binaryDigest string, template []string) string {
	h := sha256.New()
	var n [8]byte
	putLen := func(l int) {
		binary.BigEndian.PutUint64(n[:], uint64(l))
		h.Write(n[:])
	}
	put := func(s string) {
		putLen(len(s))
		h.Write([]byte(s))
	}
	put("agentvibe.adapter.contract_hash.v1")
	put(binaryDigest)
	putLen(len(template))
	for _, tok := range template {
		put(tok)
	}
	return "sha256:" + hex.EncodeToString(h.Sum(nil))
}
