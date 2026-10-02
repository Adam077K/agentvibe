package adapter

import (
	"errors"
	"io"
)

// Codex is the WorkerAdapter for the `codex` CLI (09a §8.1: codex-cli 0.154.0, `exec` with -s, -p,
// --json, --output-schema, -o, --ephemeral). B1-07 froze its done-tests in
// codex_donetest_test.go (build tag donetest, fixtures under testdata/codex/). This file is NOT
// registered: it is the stub the job replaces, and every done-test is red against it.
type Codex struct {
	digest string
}

// NewCodex returns the adapter for the codex binary whose content digest is binaryDigest
// ("sha256:<hex>", the launcher grant's Binary.Digest).
func NewCodex(binaryDigest string) *Codex { return &Codex{digest: binaryDigest} }

var _ WorkerAdapter = (*Codex)(nil)

// ErrUndecided: the LaunchSpec asks for something the pinned codex line cannot carry and canon
// does not say how codex should carry it — a tool lease, a funded team, an init_expect. It is
// not ErrSpec: the spec may be right and the founder has not ruled (B1-07 OPEN list,
// build/done-tests/B1-07.yml). Never a reason to drop the field and launch anyway.
var ErrUndecided = errors.New("adapter: codex: canon is silent here; a founder ruling is required")

var errCodexStub = errors.New("adapter: codex: not implemented (B1-07 stub)")

// Family is "codex".
func (c *Codex) Family() string { return "" }

// Template is the pinned codex launch line of 09a §8.2 as argv[1:] tokens, "<name>" tokens being
// slots: exactly the template the launcher grant pins.
func (c *Codex) Template() []string { return nil }

// ContractHash is ContractHashOf(the binary digest, Template()).
func (c *Codex) ContractHash() string { return "" }

// Argv fills Template's slots from spec: -C Cwd, -p CodexProfile, --output-schema SchemaPath,
// -o ResultPath. It returns ErrSpec or ErrUndecided rather than an argv the launcher would
// refuse or one that drops what the spec asked for.
func (c *Codex) Argv(spec LaunchSpec) ([]string, error) { return nil, errCodexStub }

// Watch reads the `codex exec --json` JSONL stream from r, one event per line, to EOF.
func (c *Codex) Watch(r io.Reader, initExpect string, abort func(Reason)) (Transcript, error) {
	return Transcript{}, errCodexStub
}

// Classify maps the stream to a WorkerOutcome. It never uses the worker's own claim, and empty
// stdout (Codex bug #19945) is unresolved, never adjudicate.
func (c *Codex) Classify(t Transcript, exit ExitInfo) WorkerOutcome { return WorkerOutcome{} }

// Children returns every nested agent (collab_tool_call) in t.
func (c *Codex) Children(t Transcript) []ChildJob { return nil }
