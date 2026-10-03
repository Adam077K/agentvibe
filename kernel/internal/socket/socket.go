// Package socket is the Kernel's command socket, `avk:avd` mode 660: the only way Userland
// reaches the Kernel (docs/vision-v3/09a-ENGINEERING.md §2: "The Kernel validates each command
// and appends the resulting events; Userland never appends").
//
// B1-03 freezes this surface and its done-tests (socket_donetest_test.go, build tag donetest,
// registered in build/done-tests/B1-03.yml). This file is NOT registered: it is the interface the
// job implements. B1-03 implements it in server.go (transport, dispatch), command.go (validation)
// and files.go (modes).
//
// TRANSPORT. A Unix stream socket at Config.SocketPath. A request is one JSON object on one line,
// terminated by '\n'; the Kernel answers each request with exactly one Response on one line, in
// order. A connection may carry any number of requests; a refused request does not end it.
//
// BOUNDS (ratified by the founder 2026-10-01; server.go holds the numbers). A line longer than
// MaxLine is not judged: it is refused and journaled (ReasonLineTooLong, its digest and length
// taken over the first MaxLine+1 bytes, the most the Kernel reads of it), it is never answered,
// and the connection is closed. At most MaxConns connections are served at once; one accepted
// beyond that is closed unanswered. A connection that takes longer than StallTimeout to deliver a
// line or to accept an answer is closed.
//
// FILE MODES (the OS, not this code, is what stops Userland appending directly):
//   - the socket: owner the Kernel's uid, group Config.UserlandGID, mode exactly 0660 (09a §2).
//   - the Journal at Config.JournalPath and every file beside it whose name begins with the
//     Journal's file name (-wal, -shm, .lock): owner the Kernel's uid, mode exactly 0600 (09a §4.1).
//
// COMMANDS (09a §2 KernelCommand). Keys are exactly these; an unknown key is refused. `cmd` selects:
//
//	propose_event  stream string, expect_seq integer ≥ 0, type string, label Label, data any,
//	               rationale? any
//	request_leases job id, resources [id, …], mode "excl"|"shared",
//	               policy "all_or_nothing"|"wound_wait"
//	propose_effect verb string, target any, business_ref string, payload_ref id, lease_tokens any
//	admit_job      spec any
//	compile        action any
//	renew, release lease_id id, token bigint
//
// "id" is a non-empty string and "bigint" is a decimal string, both under B1-02's wire rules
// (kernel/internal/nouns); a Label must pass nouns.Decode[nouns.Label]. Types 09a names but does
// not define (Target, TokenSet, JobSpec, ProposedAction, Rationale, data) are carried as raw JSON:
// required where 09a requires them, otherwise unchecked. A required key present as null is
// refused (missing_field); an optional key present as null is refused (invalid_field), because
// under B1-02's wire rules an optional key is absent when unset. A key that appears twice in the
// line is refused (bad_json): which copy wins would be the parser's choice, not the bytes'.
//
// B1-03 narrows four places the table above leaves open, each refused as invalid_field: `stream`,
// `type`, `verb` and `business_ref` are non-empty; `resources` holds at least one id; and `stream`
// may not be RefusalStream or launcher.JournalStream, which only the Kernel appends to (Userland may
// not forge the record of what was refused, or of what was launched).
//
// propose_event is the Kernel's own: it appends one event to `stream` with ExpectSeq expect_seq
// and Type `type`, whose Data is a JSON object holding at least "label" (the command's label) and
// "data" (the command's data), plus "rationale" when the command carries one. Its Result is
// {"stream","seq","hash"} of the appended event. Every other verb is validated here and then
// handed to Backend, once; its result is returned to the caller.
//
// FAILURE IS NOT REFUSAL. A well-formed command that cannot be carried out is answered
// {"ok":false,"reason":…} with ReasonSeqConflict or ReasonFailed and journals no refusal: the
// command was valid, and socket:refusals records only malformed input.
//
// REFUSAL. A request that is not one JSON object, names no known cmd, lacks a required key, or
// carries an invalid value is refused: the Response is {"ok":false,"reason":<Reason…>}, nothing
// reaches Backend, nothing is appended to any stream the command names, and exactly one event of
// type RefusalType is appended to RefusalStream with RefusalData as its Data. A refusal that
// cannot be journaled is not answered as a refusal: the connection is closed instead.
package socket

import (
	"context"
	"encoding/json"
	"errors"
)

// ErrNotImplemented was returned by Serve before B1-03 implemented it. Nothing returns it now; it
// stays exported because the frozen contract named it.
var ErrNotImplemented = errors.New("socket: not implemented")

// Refusal reasons: Response.Reason and RefusalData.Reason. A line is judged in this order and the
// first failure names the reason: is it one JSON object; is `cmd` present (missing_field), a string
// (invalid_field) and known (unknown_cmd); are the command's required keys present (missing_field);
// are all keys known and all values valid (invalid_field).
const (
	// ReasonBadJSON: the line is not exactly one JSON object (unparseable, an array, a scalar,
	// or more than one value).
	ReasonBadJSON = "bad_json"
	// ReasonMissingField: `cmd` or a key the command requires is absent or null.
	ReasonMissingField = "missing_field"
	// ReasonUnknownCmd: `cmd` is a string naming no command above. Matched exactly, case included.
	ReasonUnknownCmd = "unknown_cmd"
	// ReasonInvalidField: a key is unknown, or a value has the wrong JSON type, is outside its
	// enum, or is refused by B1-02's decoder (nouns.ErrInvalid, nouns.ErrUnknownSchema).
	ReasonInvalidField = "invalid_field"
	// ReasonLineTooLong: the line exceeds MaxLine and was not judged. It appears only in
	// RefusalData, never in a Response: such a line is not answered. Its SHA256 and Bytes cover
	// the line's first MaxLine+1 bytes, not the whole line.
	ReasonLineTooLong = "line_too_long"
)

// Failure reasons: a well-formed command that was not carried out. Never journaled as refusals.
const (
	// ReasonSeqConflict: propose_event's expect_seq is not the stream's head (journal.ErrSeqConflict).
	ReasonSeqConflict = "seq_conflict"
	// ReasonFailed: the Journal or the Backend failed the command, or the Backend's result is not JSON.
	ReasonFailed = "failed"
)

// RefusalStream is the Journal stream refusals are appended to; RefusalType is their event type.
const (
	RefusalStream = "socket:refusals"
	RefusalType   = "command.refused"
)

// RefusalData is the Data of a RefusalType event. The refused bytes are identified by digest, not
// stored: a malformed command is attacker-shaped input and need not be kept to be accounted for.
type RefusalData struct {
	Reason string `json:"reason"`        // one of the Reason constants
	Cmd    string `json:"cmd,omitempty"` // the cmd string when the line had one
	SHA256 string `json:"sha256"`        // lowercase hex SHA-256 of the line, without its '\n'
	Bytes  int    `json:"bytes"`         // the line's length, without its '\n'
}

// Response is one line the Kernel writes back per request.
type Response struct {
	OK     bool            `json:"ok"`
	Reason string          `json:"reason,omitempty"` // set when OK is false
	Result json.RawMessage `json:"result,omitempty"` // Backend's result, or propose_event's
}

// RequestLeases is a validated request_leases command.
type RequestLeases struct {
	Job       string
	Resources []string
	Mode      string
	Policy    string
}

// ProposeEffect is a validated propose_effect command.
type ProposeEffect struct {
	Verb        string
	Target      json.RawMessage
	BusinessRef string
	PayloadRef  string
	LeaseTokens json.RawMessage
}

// AdmitJob is a validated admit_job command.
type AdmitJob struct{ Spec json.RawMessage }

// Compile is a validated compile command.
type Compile struct{ Action json.RawMessage }

// LeaseCommand is a validated renew or release command.
type LeaseCommand struct {
	LeaseID string
	Token   uint64
}

// Backend carries out the verbs the socket does not own: leases (B1-05), effects, the launcher
// (B1-08) and the compiler. Each method is called only with a command that passed validation.
type Backend interface {
	RequestLeases(ctx context.Context, c RequestLeases) (json.RawMessage, error)
	ProposeEffect(ctx context.Context, c ProposeEffect) (json.RawMessage, error)
	AdmitJob(ctx context.Context, c AdmitJob) (json.RawMessage, error)
	Compile(ctx context.Context, c Compile) (json.RawMessage, error)
	Renew(ctx context.Context, c LeaseCommand) (json.RawMessage, error)
	Release(ctx context.Context, c LeaseCommand) (json.RawMessage, error)
}

// Config is what Serve needs.
type Config struct {
	SocketPath  string // created by Serve; an existing file there is refused, not removed
	JournalPath string // opened by Serve as the Journal's single writer, created if absent
	UserlandGID int    // the avd group: the socket's group
	Backend     Backend
}

// Server is a listening command socket.
type Server interface {
	// Close stops accepting, finishes or drops in-flight requests, removes the socket file, and
	// closes the Journal, releasing its writer lock.
	Close() error
}

// Serve opens the Journal, creates the socket with its final owner, group and mode, and returns
// once the socket accepts connections. A Journal file the Kernel owns at a wider mode is narrowed
// to 0600, not refused; Serve refuses only a Journal it cannot hold at mode 0600. Modes do not
// depend on the umask Serve inherits (the done-tests run it under umask 0).
//
// Serve's ctx bounds the server: when it ends, the server closes as Close does.
func Serve(ctx context.Context, cfg Config) (Server, error) {
	return serve(ctx, cfg)
}
