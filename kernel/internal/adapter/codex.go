package adapter

import (
	"errors"
	"io"
)

// Codex is the WorkerAdapter for the `codex` CLI (09a §8.1: codex-cli 0.154.0, `exec` with -s, -p,
// --json, --output-schema, -o, --ephemeral). B1-07 froze its done-tests in
// codex_donetest_test.go (build tag donetest, fixtures under testdata/codex/), against the
// founder rulings in docs/vision-v3/_process/DR-B1-07-CODEX-RULINGS-2026-10-02.md. This file is
// NOT registered: it is the stub the job replaces, and every done-test is red against it.
type Codex struct {
	digest string
}

// NewCodex returns the adapter for the codex binary whose content digest is binaryDigest
// ("sha256:<hex>", the launcher grant's Binary.Digest): the pinned binary hash (ruling 1+3).
func NewCodex(binaryDigest string) *Codex { return &Codex{digest: binaryDigest} }

var _ WorkerAdapter = (*Codex)(nil)

var errCodexStub = errors.New("adapter: codex: not implemented (B1-07 stub)")

// Family is "codex".
func (c *Codex) Family() string { return "" }

// Template is the pinned codex launch line of 09a §8.2 plus --ignore-user-config (ruling 4), as
// argv[1:] tokens, "<name>" tokens being slots.
func (c *Codex) Template() []string { return nil }

// ContractHash is ContractHashOf(the binary digest, Template()).
func (c *Codex) ContractHash() string { return "" }

// Argv fills Template's slots from spec: -C Cwd, -p CodexProfile, --output-schema SchemaPath,
// -o ResultPath. Before that it checks the two pins (ruling 1+3): BinaryDigest equals the
// adapter's binary digest, and ProfileDigest equals InitExpect, the pinned profile hash. A tool
// lease (the profile holds it) and a funded team (ruling 2: never for codex) are ErrSpec.
func (c *Codex) Argv(spec LaunchSpec) ([]string, error) { return nil, errCodexStub }

// Watch reads the `codex exec --json` JSONL stream from r, one event per line, to EOF.
// initExpect is the pinned profile hash; a run with none was never pinned and never passes.
func (c *Codex) Watch(r io.Reader, initExpect string, abort func(Reason)) (Transcript, error) {
	return Transcript{}, errCodexStub
}

// Classify maps the stream to a WorkerOutcome. It never uses the worker's own claim; empty
// stdout (Codex bug #19945) is unresolved; and the -o file (exit.ResultFile) must equal the
// stream's answer byte for byte, else UNPARSED (ruling 5).
func (c *Codex) Classify(t Transcript, exit ExitInfo) WorkerOutcome { return WorkerOutcome{} }

// Children returns every nested agent (collab_tool_call) in t.
func (c *Codex) Children(t Transcript) []ChildJob { return nil }
