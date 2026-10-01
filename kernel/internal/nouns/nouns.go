// Package nouns holds the Kernel's six nouns and Operation (docs/vision-v3/09a-ENGINEERING.md §3;
// the label record is §12.0) as Go structs whose JSON is the wire format Userland mirrors in Zod,
// and the upcaster registry that keeps a past decision's meaning fixed (09a §4.1: "an upcaster can
// change what a past decision meant").
//
// Frozen by B1-02's done-test (build/done-tests/B1-02.yml) so the test exists before the job does
// (docs/vision-v3/14-BUILD-PLAN.md §6). This file is the contract the job implements and is NOT
// registered; the test file and its three fixture files are. Every function returns
// ErrNotImplemented until B1-02 lands; nothing here holds logic.
//
// WIRE RULES (pinned by testdata/nouns/*.json, which both languages read):
//   - Keys are 09a §3's snake_case names. An optional field is ABSENT when unset, never null or "".
//   - bigint fields (Lease.fencing_token, Lease.epoch, Effect.gateway_epoch) are JSON decimal
//     strings. A JSON number above 2^53 loses precision in JavaScript's JSON.parse, so a number is
//     refused, not coerced.
//   - Hex is 64 lowercase hex characters (a SHA-256), as the Journal's hashes are.
//   - Decode refuses: an unknown key, a missing required key (even where Go's zero value would be
//     valid, e.g. Label.exportable), a value outside a closed enum of 09a §3 / §12.0, a wrong JSON
//     type, an Event.seq below 1 or Event.schema below 1, and a nested Label that would be refused
//     on its own. Each refusal wraps ErrInvalid.
//   - A Label whose schema is not "label/1" is refused wrapping ErrUnknownSchema (§12.0: "readers
//     refuse unknown versions"), wherever the label sits.
//   - Types the canon names but does not define (Actor, Rationale, Target, Budget, TokenSet,
//     SourceRef, an event's data) are carried as raw JSON: required where 09a §3 requires them,
//     otherwise unchecked. Every *Id and *Ref type is a non-empty string.
package nouns

import (
	"encoding/json"
	"errors"
)

// ErrNotImplemented is returned by every entry point until B1-02 implements it.
var ErrNotImplemented = errors.New("nouns: not implemented")

// ErrInvalid: the bytes are not a valid noun under the wire rules above.
var ErrInvalid = errors.New("nouns: invalid")

// ErrUnknownSchema: a Label carries a schema version this reader does not know.
var ErrUnknownSchema = errors.New("nouns: unknown label schema")

// ErrMeaningChanged: an upcaster changed, or made unreadable, the Outcome of at least one past
// decision in the history it was checked against. The upcaster is not installed.
var ErrMeaningChanged = errors.New("nouns: upcaster changes a past decision's meaning")

// ErrUnverifiable: the replay check could not run, so the upcaster is not installed. There is no
// Reader for its type at From or at From+1, or the history holds no event of its type. An unchecked
// upcaster is never an admitted one.
var ErrUnverifiable = errors.New("nouns: upcaster cannot be checked against history")

// ErrDuplicate: a Reader for that (type, schema) or an Upcaster for that (type, From) is already
// registered. Replacing a reader would change a past decision's meaning as surely as an upcaster.
var ErrDuplicate = errors.New("nouns: already registered")

// Label is LabelV1, 09a §12.0. Seven distinct fields; none is inferred from another.
type Label struct {
	Schema          string            `json:"schema"`     // "label/1"
	Origin          string            `json:"origin"`     // founder|system_of_record|internal|public_web|customer|counterparty|synthetic
	DClass          string            `json:"dclass"`     // D0|D1|D2|D3|D4
	Boundary        string            `json:"boundary"`   // open|guarded|sealed
	Venture         string            `json:"venture"`    // a VentureId or "portfolio"
	Retention       Retention         `json:"retention"`  //
	Permission      string            `json:"permission"` // none|informs|may_authorise
	Exportable      bool              `json:"exportable"`
	Taint           string            `json:"taint"` // clean|untrusted|quarantined
	Provenance      []json.RawMessage `json:"provenance"`
	ConsentScope    string            `json:"consent_scope,omitempty"`
	Confidence      *float64          `json:"confidence,omitempty"`
	Subjects        []string          `json:"subjects,omitempty"`
	RevocationEpoch uint64            `json:"revocation_epoch"`
}

// Retention is LabelV1.retention.
type Retention struct {
	Class    string `json:"class"`              // journal_metadata|operational|personal|client|synthetic
	Hold     string `json:"hold"`               // none|obligation|legal|safety|pinned
	Deadline string `json:"deadline,omitempty"` // computed; never a class
}

// Event is 09a §3's Event. Only the Kernel writes Events.
type Event struct {
	ID            string          `json:"id"` // ULID
	Stream        string          `json:"stream"`
	Seq           uint64          `json:"seq"` // >= 1
	Type          string          `json:"type"`
	Ts            string          `json:"ts"`
	Actor         json.RawMessage `json:"actor"`
	CorrelationID string          `json:"correlation_id"`
	CausationID   string          `json:"causation_id,omitempty"`
	Label         Label           `json:"label"`
	Rationale     json.RawMessage `json:"rationale,omitempty"`
	SnapshotRef   string          `json:"snapshot_ref,omitempty"`
	Schema        int             `json:"schema"` // the data's schema version, >= 1; upcasters move it
	Data          json.RawMessage `json:"data"`
	PrevHash      string          `json:"prev_hash"` // Hex
	Hash          string          `json:"hash"`      // Hex
}

// ToolLease is Job.tool_lease.
type ToolLease struct {
	Allowed   []string `json:"allowed"`
	Forbidden []string `json:"forbidden"`
}

// Job is 09a §3's Job. A Job never holds a credential and never outlives its leases.
type Job struct {
	ID             string          `json:"id"`
	Venture        string          `json:"venture"`
	RecordRef      string          `json:"record_ref"`
	ModelID        string          `json:"model_id"`
	Family         string          `json:"family"` // open: 'claude'|'codex'|string
	Headless       bool            `json:"headless"`
	ParentJob      string          `json:"parent_job,omitempty"`
	ProviderMode   string          `json:"provider_mode"` // sub|api
	Isolation      string          `json:"isolation"`     // I1|I2|I3|I4
	ContextProfile string          `json:"context_profile"`
	ToolLease      ToolLease       `json:"tool_lease"`
	Label          Label           `json:"label"`
	Budget         json.RawMessage `json:"budget"`
	LeaseIDs       []string        `json:"lease_ids"`
	State          string          `json:"state"`
}

// Lease is 09a §3's Lease.
type Lease struct {
	ID                string `json:"id"`
	Resource          string `json:"resource"`
	Holder            string `json:"holder"`
	ResponsibilityRef string `json:"responsibility_ref,omitempty"`
	FencingToken      uint64 `json:"fencing_token,string"` // bigint, decimal string on the wire
	Epoch             uint64 `json:"epoch,string"`         // bigint, decimal string on the wire
	Mode              string `json:"mode"`                 // excl|shared
	Kind              string `json:"kind"`                 // optimistic|pessimistic
	ExpiresAt         string `json:"expires_at"`
}

// Operation is 09a §3's Operation: an effect's business identity, assigned before dispatch.
type Operation struct {
	ID            string          `json:"id"`
	Venture       string          `json:"venture"`
	Verb          string          `json:"verb"`
	Target        json.RawMessage `json:"target"`
	BusinessKey   string          `json:"business_key"`
	PayloadDigest string          `json:"payload_digest"` // Hex
	Amendments    []string        `json:"amendments"`
	Reservation   string          `json:"reservation,omitempty"`
	State         string          `json:"state"` // open|settled|failed|compensated|human
}

// Effect is 09a §3's Effect.
type Effect struct {
	ID               string          `json:"id"`
	OperationID      string          `json:"operation_id"`
	Attempt          int             `json:"attempt"`
	ContractRef      string          `json:"contract_ref"`
	SnapshotRef      string          `json:"snapshot_ref"`
	EffectClass      string          `json:"effect_class"` // R0|R1|R2|R3|R4
	IdemClass        string          `json:"idem_class"`   // native_key|check_before|natural|at_most_once
	AuthorisingLabel Label           `json:"authorising_label"`
	Approvals        []string        `json:"approvals"`
	FencingTokens    json.RawMessage `json:"fencing_tokens"`
	GatewayEpoch     uint64          `json:"gateway_epoch,string"` // bigint, decimal string on the wire
	State            string          `json:"state"`
}

// Receipt is 09a §3's Receipt: its issuer's assertion, never proof of world state (DR-03).
type Receipt struct {
	EffectID               string `json:"effect_id"`
	OperationID            string `json:"operation_id"`
	Attempt                int    `json:"attempt"`
	RequestDigest          string `json:"request_digest"` // Hex
	ProviderRef            string `json:"provider_ref,omitempty"`
	ProviderResponseDigest string `json:"provider_response_digest,omitempty"` // Hex
	ObservedAt             string `json:"observed_at"`
	Issuer                 string `json:"issuer"` // gateway|treasury|runner|merge_queue
	Sig                    string `json:"sig"`
	ChainPrev              string `json:"chain_prev"` // Hex
}

// Noun is the set of wire types Decode and Encode accept.
type Noun interface {
	Event | Job | Lease | Effect | Receipt | Label | Operation
}

// Decode parses one noun from its wire JSON, refusing per the wire rules above.
func Decode[T Noun](data []byte) (T, error) {
	var zero T
	return zero, ErrNotImplemented
}

// Encode writes v as wire JSON. Decode(Encode(v)) == v, and Encode(Decode(b)) is b up to key order
// and whitespace.
func Encode[T Noun](v T) ([]byte, error) {
	return nil, ErrNotImplemented
}

// DecisionCompiled is the event type recording a compiled Decision Contract (00-CANON §3). Its
// schema-1 data is that contract as JSON, keys as in the canon:
// {"action":{"operation_id",…},"snapshot":{…},"effect_class","door","disposition","satisfied",
// "blockers","precedence_applied","valid_until"}.
const DecisionCompiled = "decision.compiled"

// Outcome is the meaning of a past decision: what was decided, about which operation, at what
// computed consequence. An upcaster may change how a decision is stored, never this.
type Outcome struct {
	OperationID string `json:"operation_id"` // action.operation_id
	Disposition string `json:"disposition"`  // auto|notify|ask|co_sign|never
	EffectClass string `json:"effect_class"` // R0..R4
	Door        string `json:"door"`         // two_way|costly_reversible|one_way
}

// Reader reads the Outcome of one event type's data written at one schema version. Readers are
// protected-base code, frozen once their version ships.
type Reader func(data json.RawMessage) (Outcome, error)

// Upcaster rewrites one event type's data from schema From to From+1. It sees only data: the
// envelope (id, stream, seq, label, hashes, …) is not its to change.
type Upcaster struct {
	Type string
	From int
	Up   func(data json.RawMessage) (json.RawMessage, error)
}

// Registry holds the readers and upcasters for event types that record decisions. Its zero value
// is not usable; call NewRegistry or Kernel.
type Registry struct {
	impl any // B1-02 replaces this with its own state
}

// NewRegistry returns an empty Registry.
func NewRegistry() *Registry { return &Registry{} }

// Kernel returns a new Registry holding every Reader and Upcaster the Kernel ships: at least the
// schema-1 Reader of DecisionCompiled, reading the canon §3 layout.
func Kernel() *Registry { return &Registry{} }

// AddReader registers read for eventType at schema. A second reader for the same pair is refused
// wrapping ErrDuplicate and the first stays in force.
func (r *Registry) AddReader(eventType string, schema int, read Reader) error {
	return ErrNotImplemented
}

// AddUpcaster installs u only if it keeps every past decision's meaning. For every event in history
// of type u.Type, the Outcome read from the event as written (at its own schema) must equal the
// Outcome read after upcasting it through the installed chain and then u. Any difference, or any
// read that fails, refuses u wrapping ErrMeaningChanged. Missing readers at u.From or u.From+1, or
// no history event of u.Type, refuse u wrapping ErrUnverifiable. A refused upcaster is not
// installed; the registry is unchanged.
func (r *Registry) AddUpcaster(u Upcaster, history []Event) error {
	return ErrNotImplemented
}

// Upcast returns a copy of e with its data upcast through every installed upcaster for e.Type,
// from e.Schema to the latest version. Every envelope field but Schema and Data is unchanged, and
// e itself is not modified (its Data is not aliased).
func (r *Registry) Upcast(e Event) (Event, error) {
	return Event{}, ErrNotImplemented
}

// Outcome reads e's decision with the Reader registered for (e.Type, e.Schema).
func (r *Registry) Outcome(e Event) (Outcome, error) {
	return Outcome{}, ErrNotImplemented
}
