package adapter

import "io"

// Claude is the WorkerAdapter for the `claude` CLI (09a §8.1: 2.1.284, no --max-turns).
type Claude struct {
	digest string
}

// NewClaude returns the adapter for the claude binary whose content digest is binaryDigest
// ("sha256:<hex>", the launcher grant's Binary.Digest).
func NewClaude(binaryDigest string) *Claude { return &Claude{digest: binaryDigest} }

var _ WorkerAdapter = (*Claude)(nil)

// Family is "claude".
func (c *Claude) Family() string { return "" }

// Template is the pinned claude launch line of 09a §8.2 as argv[1:] tokens, "<name>" tokens
// being slots: exactly the template the launcher grant pins (launcher.ArgvTemplate.Tokens).
func (c *Claude) Template() []string { return nil }

// ContractHash is ContractHashOf(the binary digest, Template()).
func (c *Claude) ContractHash() string { return "" }

// Argv fills Template's slots from spec. Allowed and forbidden tools are comma-joined; the
// forbidden list always carries Agent and Task. It returns ErrSpec rather than an argv the
// launcher would refuse.
func (c *Claude) Argv(spec LaunchSpec) ([]string, error) { return nil, ErrNotImplemented }

// InitHash is the harness hash of one system/init line: the tools, MCP servers, agents,
// plugins and tool-description hashes it reports, and nothing per-run (session_id, uuid).
// init_expect is this hash of the compiled record's expected init.
func (c *Claude) InitHash(initLine []byte) (string, error) { return "", ErrNotImplemented }

// Watch reads stream-json from r, one event per line, to EOF. System events may precede
// system/init; any other event before it, or an init whose InitHash is not initExpect, makes
// Watch call abort(ReasonHarness) once, before it reads anything more from r, and return
// ErrHarness. After abort the launcher kills the process group and r reaches EOF.
func (c *Claude) Watch(r io.Reader, initExpect string, abort func(Reason)) (Transcript, error) {
	return Transcript{}, ErrNotImplemented
}

// Classify applies ENGINE-SPEC §8.3's subtype map to the top-level result event. It never
// uses the worker's claimed status, and an empty result is never Adjudicate.
func (c *Claude) Classify(t Transcript, exit ExitInfo) WorkerOutcome { return WorkerOutcome{} }

// Children returns every nested agent in t, keyed by parent_tool_use_id.
func (c *Claude) Children(t Transcript) []ChildJob { return nil }
