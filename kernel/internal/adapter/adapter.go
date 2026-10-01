// Package adapter holds the Kernel's WorkerAdapters: one per worker family, each turning a
// LaunchSpec into the pinned argv the launcher may exec, checking the worker's harness before
// its first tool call, and classifying its stream into a WorkerOutcome
// (docs/vision-v3/09a-ENGINEERING.md §8, "The runner and the WorkerAdapter").
//
// B1-06 freezes the `claude` adapter's done-tests (claude_donetest_test.go, build tag donetest,
// fixtures under testdata/claude/). This file is NOT registered: it is the interface the job
// implements. Until B1-06 lands every entry point returns ErrNotImplemented or a zero value and
// the done-tests fail red.
//
// The adapter never spawns. 09a §8.5 makes kernel.launcher the only principal that may spawn a
// worker, and the launcher execs only argv matching a pinned template. So canon's
// `launch(spec): Running` is split here: the adapter returns argv (Argv), the launcher
// (internal/launcher, B1-08) execs it, and the adapter reads the stream (Watch).
package adapter

import (
	"encoding/json"
	"errors"
	"io"
)

// ErrNotImplemented is returned by every entry point until B1-06 lands.
var ErrNotImplemented = errors.New("adapter: not implemented")

var (
	// ErrSpec: the LaunchSpec cannot fill the pinned argv: an empty slot, a slot value that
	// begins with '-' (the launcher's slot rule, so a flag cannot ride in a slot), a budget
	// that is not positive, an empty InitExpect, or a nested-agent tool on the allowed list.
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
	ReasonUnparsed Reason = "unparsed" // UNPARSED (09a §8.8), a kind of unresolved
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
// but the pinned launch line needs them (--agents, --agent, --session-id).
type LaunchSpec struct {
	Cwd              string
	ContextProfile   string // --setting-sources <profile>
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

// Transcript is what Watch read. Its fields are the implementation's.
type Transcript struct{}

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
func ContractHashOf(binaryDigest string, template []string) string {
	return ""
}
