// Package effector is B1-12b, the second half of the outbox (docs/vision-v3/14-BUILD-PLAN.md §6,
// B1-12: "Outbox + Operation IDs + reconciler; local effectors: git PR, preview deploy,
// founder-mailbox email"). B1-12a, the outbox core, is kernel/internal/outbox.
//
// This file is the surface; gateway.go implements the Gateway and local.go the three effectors.
// It is NOT registered; the done-tests beside it (effector_donetest_test.go, build tag
// donetest) are, in build/done-tests/B1-12b.yml.
//
// THE GATEWAY. Gateway.ProposeEffect is socket.Backend.ProposeEffect: the B1-03 socket validates a
// propose_effect line and hands it here, once. It finds or creates the Operation for the business
// key venture ‖ verb ‖ target ‖ business_ref (09a §7.1) in the outbox, and never calls a provider:
// approval is upstream (09a §7 diagram, proposed --> approved), so dispatch is a separate call.
// A re-proposal of an open key returns the existing Operation ID; propose_effect carries no
// request id, so the business key is the only deduplication.
//
//   - venture: Config.Venture, taken from the job's lease and never from the request (founder
//     ruling Q1, 2026-10-03). A Gateway serves one venture. The socket refuses a `venture` key
//     before it reaches the Gateway, and every presented lease must belong to Config.Venture as
//     Config.Ventures reports it; a lease of another venture, or one whose venture cannot be read,
//     refuses the proposal (ErrWrongVenture for a mismatch).
//   - verb: selects Config.Effectors[verb]; an unknown verb is ErrUnknownVerb.
//   - target: a JSON string id, used as BusinessKey.Target (Q3); any other JSON type is
//     ErrInvalidTarget.
//   - payload_ref: a journal.BlobRef under Config.Venture, read through Config.Blobs. A ref that
//     does not resolve is ErrUnknownPayload.
//   - lease_tokens: a JSON object mapping a resource id to its fencing token as a B1-02 bigint (an
//     unsigned decimal string), e.g. {"job://J7":"3"} (Q4). Every token must pass Config.Fence or
//     the proposal is ErrStaleToken (09a §7, "proposed --> refused: … stale token"). Another shape
//     is refused. An empty object is ErrNoLease: an effect with no lease is refused (Q2).
//   - there is no request id: the business key is the only deduplication (Q5).
//
// Rulings Q1-Q7: docs/vision-v3/_process/DR-B1-12B-RULINGS-2026-10-03.md.
//
// The result is ProposeResult as JSON. Every refusal writes nothing and calls no provider.
//
// FENCING (09a §7, "held --> dispatching: journaled BEFORE the provider call · epoch checked";
// §6, §15). The resources named at the first proposal are recorded durably with the Operation.
// Dispatch must present a token for each of them, and each must pass Config.Fence at the moment of
// dispatch, or Dispatch returns an error wrapping ErrStaleToken with no provider call and the
// Operation unchanged. A Fence error of any other kind refuses too: an unchecked token is not a
// current one. The tokens are checked again immediately before the effector's Do, and a stale one
// there sends nothing. A lease lost during a dispatch — before the call or while it is in flight —
// NEVER makes the attempt definite, because the effect may have landed (Q6): the attempt is
// uncertain (or confirmed, if the provider answered ok), and the lease's new holder cannot send
// until a reconcile past the visibility lag reads Absent; rulings A-C then apply as for any
// uncertain attempt.
//
// RULINGS A–C (docs/vision-v3/_process/FOUNDER-RULINGS-2026-10-02-outbox.md) are the outbox's.
// The Gateway must not hide them: an effector's declared visibility lag (outbox.VisibilityLagger)
// and its class reach the outbox unchanged.
//
// THE LOCAL EFFECTORS each implement outbox.Provider's Do/Lookup contract: Do performs the effect
// under idem; a definite refusal wraps outbox.ErrRejected and any other error is ambiguous;
// Lookup answers Present or Absent only from what it read, and a read that fails is an error,
// never Absent. None of them reaches a network: mail goes to a local Maildir, and git and deploy
// go through the GitHost and DeployHost interfaces, which tests fill with fakes. An effect aimed
// outside an effector's sandbox is refused, wrapping both ErrOutsideSandbox and outbox.ErrRejected,
// and touches nothing.
package effector

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/outbox"
	"github.com/Adam077K/agentvibe/kernel/internal/socket"
)

var (
	// ErrNoLease: the proposal presents no lease token at all (Q2).
	ErrNoLease = errors.New("effector: an effect with no lease is refused")
	// ErrInvalidTarget: target is not a JSON string id (Q3).
	ErrInvalidTarget = errors.New("effector: target is not a string id")
	// ErrWrongVenture: a presented lease belongs to another venture than the Gateway's (Q1).
	ErrWrongVenture = errors.New("effector: lease belongs to another venture")
	// ErrUnknownVerb: no effector is configured for the verb.
	ErrUnknownVerb = errors.New("effector: no effector for verb")
	// ErrUnknownPayload: payload_ref names no blob of this venture.
	ErrUnknownPayload = errors.New("effector: payload_ref does not resolve")
	// ErrStaleToken: a lease token is missing or is not current. Nothing is sent.
	ErrStaleToken = errors.New("effector: stale or missing lease token")
	// ErrOutsideSandbox: the effect would land outside the effector's sandbox. Nothing is done.
	ErrOutsideSandbox = errors.New("effector: effect outside the effector's sandbox")
	// ErrHostRejected is what a GitHost or DeployHost wraps to say it definitely did not act.
	ErrHostRejected = errors.New("effector: host rejected the request")
)

// Tokens maps a resource id (e.g. "job://J7") to the fencing token presented for it.
type Tokens map[string]uint64

// Fence says whether token is the current fencing token of resource; nil means current.
// lease.Claimer.Check backs it for job:// resources.
type Fence interface {
	Check(ctx context.Context, resource string, token uint64) error
}

// Ventures reports the venture a leased resource belongs to: the job's venture, fixed when the job
// was admitted. It is the only source of an effect's venture (Q1).
type Ventures interface {
	VentureOf(ctx context.Context, resource string) (string, error)
}

// Blobs reads payload blobs; journal.Journal implements it.
type Blobs interface {
	GetBlob(ctx context.Context, venture string, ref journal.BlobRef) ([]byte, error)
}

// Effector is an outbox.Provider that declares its idempotency class (09a §7.2). It may also
// implement outbox.VisibilityLagger.
type Effector interface {
	outbox.Provider
	Class() outbox.Class
}

// ProposeResult is ProposeEffect's result.
type ProposeResult struct {
	OperationID string       `json:"operation_id"`
	State       outbox.State `json:"state"`
}

// Config is what Open needs.
type Config struct {
	Dir       string // all Gateway and outbox state persists under here
	Venture   string
	WorkerID  string
	Clock     outbox.Clock
	Blobs     Blobs
	Fence     Fence
	Ventures  Ventures
	Effectors map[string]Effector // by verb
	Crash     func(outbox.Point)  // passed to the outbox as Deps.Crash
}

// Gateway is the Effect Gateway over the outbox.
type Gateway interface {
	// ProposeEffect is socket.Backend.ProposeEffect.
	ProposeEffect(ctx context.Context, c socket.ProposeEffect) (json.RawMessage, error)
	// Dispatch runs the Operation's next attempt (outbox.Outbox.Dispatch) under the presented
	// tokens, fenced as above.
	Dispatch(ctx context.Context, id string, presented Tokens) (outbox.Operation, error)
	// Reconcile is outbox.Outbox.Reconcile over every effector's Operations. It never dispatches.
	Reconcile(ctx context.Context) error
	// Get reads an Operation by ID.
	Get(ctx context.Context, id string) (outbox.Operation, error)
}

// Open opens (creating if needed) the Gateway persisted under cfg.Dir. Two Gateways opened on one
// Dir see one set of Operations, as two outboxes on one directory do.
func Open(cfg Config) (Gateway, error) { return open(cfg) }

// MailPayload is the founder-mailbox effector's payload, as JSON.
type MailPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

// MailboxConfig configures the founder-mailbox effector. Dir is a Maildir (tmp, new, cur), created
// if absent; a delivered message is a file under new/ or cur/ whose Message-ID header contains the
// idem. To must equal Founder byte for byte: no display name, list, padding or case variant. A CR
// or LF in any header field (To, Subject) is refused; the body may carry line breaks. An idem
// that cannot name a file inside Dir is refused. VisibilityLag <= 0 leaves the outbox default
// (ruling A).
type MailboxConfig struct {
	Dir           string
	Founder       string
	VisibilityLag time.Duration
}

// NewMailbox returns the founder-mailbox effector: class check_before (09a §7.2, "Mailbox send
// (Sent by Message-ID)"). Do delivers at most one message per idem.
func NewMailbox(cfg MailboxConfig) (Effector, error) { return newMailbox(cfg) }

// PRPayload is the git PR effector's payload, as JSON.
type PRPayload struct {
	Repo  string `json:"repo"`
	Base  string `json:"base"`
	Head  string `json:"head"`
	Title string `json:"title"`
	Body  string `json:"body"`
}

// GitHost is where a PR is opened. marker is the idem; the host keeps it with the PR.
type GitHost interface {
	CreatePR(ctx context.Context, pr PRPayload, marker string) error
	FindPR(ctx context.Context, marker string) (bool, error)
}

// GitPRConfig configures the git PR effector. A PR against a repo not in Repos is outside the sandbox.
type GitPRConfig struct {
	Host          GitHost
	Repos         []string
	VisibilityLag time.Duration
}

// NewGitPR returns the git PR effector: class check_before (no native key; query by marker, send
// if absent). Do opens at most one PR per idem.
func NewGitPR(cfg GitPRConfig) (Effector, error) { return newGitPR(cfg) }

// DeployPayload is the preview-deploy effector's payload, as JSON. Digest is "sha256:" + 64
// lowercase hex; Environment must be "preview".
type DeployPayload struct {
	Project     string `json:"project"`
	Digest      string `json:"digest"`
	Environment string `json:"environment"`
}

// DeployHost is where a preview is deployed. marker is the idem. The environment is passed
// explicitly and is always "preview" (r2, 2026-10-03): a host is never left to pick a default.
type DeployHost interface {
	Deploy(ctx context.Context, project, digest, environment, marker string) error
	FindDeploy(ctx context.Context, marker string) (bool, error)
}

// DeployConfig configures the preview-deploy effector. A project not in Projects is outside the
// sandbox; with no Projects every deploy is refused until the list is widened (Q7).
type DeployConfig struct {
	Host          DeployHost
	Projects      []string
	VisibilityLag time.Duration
}

// NewPreviewDeploy returns the preview-deploy effector: class natural (09a §7.2, "digest-pinned
// deploy … payload is the digest"). A payload whose digest is not a digest is rejected; any
// environment but exactly "preview", or any project not allow-listed, is outside the sandbox. A
// payload is refused unless it is exactly one JSON object with only the three known keys, each
// once: a production flag or target cannot ride along in an unknown key, a duplicate key or
// trailing data (r2, 2026-10-03).
func NewPreviewDeploy(cfg DeployConfig) (Effector, error) { return newPreviewDeploy(cfg) }
