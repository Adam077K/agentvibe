package nouns

// The wire rules of nouns.go's package comment, as checks over the JSON before it reaches a
// struct. The checks themselves are kernel/internal/wire's, shared with kernel/internal/label; the
// Label inside every noun is checked by label.Check, the one label/1 reader (DR-LABEL-RECONCILE:61).

import (
	"errors"
	"fmt"

	"github.com/Adam077K/agentvibe/kernel/internal/label"
	"github.com/Adam077K/agentvibe/kernel/internal/wire"
)

// The shared checks under the names this package and registry.go use.
var (
	req      = wire.Req
	opt      = wire.Opt
	object   = wire.Object
	arrayOf  = wire.ArrayOf
	str      = wire.Str
	id       = wire.ID
	enum     = wire.Enum
	hex      = wire.Hex
	boolean  = wire.Boolean
	bigint   = wire.Bigint
	integer  = wire.Integer
	anyJSON  = wire.AnyJSON
	members  = wire.Members
	scanWire = wire.ScanWire
	stringOf = wire.StringOf
	marshal  = wire.Marshal
)

const maxSafe = wire.MaxSafe

func wrapInvalid(path, format string, args ...any) error {
	return fmt.Errorf("%w: %v", ErrInvalid, wire.Invalid(path, format, args...))
}

// classify wraps a check's refusal in exactly one of this package's sentinels: ErrUnknownSchema
// for a label/1 version this reader does not know, wherever the label sits, and ErrInvalid else.
func classify(err error) error {
	if errors.Is(err, label.ErrUnknownSchema) {
		return fmt.Errorf("%w: %v", ErrUnknownSchema, err)
	}
	return fmt.Errorf("%w: %v", ErrInvalid, err)
}

var eventCheck = object(
	req("id", id),
	req("stream", str),
	req("seq", integer(1)),
	req("type", str),
	req("ts", str),
	req("actor", anyJSON),
	req("correlation_id", id),
	opt("causation_id", id),
	req("label", label.Check),
	opt("rationale", anyJSON),
	opt("snapshot_ref", id),
	req("schema", integer(1)),
	req("data", anyJSON),
	req("prev_hash", hex),
	req("hash", hex),
)

var jobCheck = object(
	req("id", id),
	req("venture", id),
	req("record_ref", id),
	req("model_id", str),
	req("family", str),
	req("headless", boolean),
	opt("parent_job", id),
	req("provider_mode", enum("sub", "api")),
	req("isolation", enum("I1", "I2", "I3", "I4")),
	req("context_profile", id),
	req("tool_lease", object(
		req("allowed", arrayOf(str)),
		req("forbidden", arrayOf(str)),
	)),
	req("label", label.Check),
	req("budget", anyJSON),
	req("lease_ids", arrayOf(id)),
	req("state", str),
)

var leaseCheck = object(
	req("id", id),
	req("resource", str),
	req("holder", id),
	opt("responsibility_ref", id),
	req("fencing_token", bigint),
	req("epoch", bigint),
	req("mode", enum("excl", "shared")),
	req("kind", enum("optimistic", "pessimistic")),
	req("expires_at", str),
)

var operationCheck = object(
	req("id", id),
	req("venture", id),
	req("verb", str),
	req("target", anyJSON),
	req("business_key", str),
	req("payload_digest", hex),
	req("amendments", arrayOf(id)),
	opt("reservation", id),
	req("state", enum("open", "settled", "failed", "compensated", "human")),
)

var effectCheck = object(
	req("id", id),
	req("operation_id", id),
	req("attempt", integer(-maxSafe)),
	req("contract_ref", id),
	req("snapshot_ref", id),
	req("effect_class", enum("R0", "R1", "R2", "R3", "R4")),
	req("idem_class", enum("native_key", "check_before", "natural", "at_most_once")),
	req("authorising_label", label.Check),
	req("approvals", arrayOf(id)),
	req("fencing_tokens", anyJSON),
	req("gateway_epoch", bigint),
	req("state", str),
)

var receiptCheck = object(
	req("effect_id", id),
	req("operation_id", id),
	req("attempt", integer(-maxSafe)),
	req("request_digest", hex),
	opt("provider_ref", str),
	opt("provider_response_digest", hex),
	req("observed_at", str),
	req("issuer", enum("gateway", "treasury", "runner", "merge_queue")),
	req("sig", str),
	req("chain_prev", hex),
)

// validate checks data as the wire form of v's type and returns it compacted, so every raw JSON
// field Decode fills holds no insignificant whitespace and Encode reproduces it byte for byte.

// validate checks data as the wire form of v's type and returns it compacted, so every raw JSON
// field Decode fills holds no insignificant whitespace and Encode reproduces it byte for byte.
func validate(v any, data []byte) ([]byte, error) {
	var c wire.Check
	switch v.(type) {
	case Event:
		c = eventCheck
	case Job:
		c = jobCheck
	case Lease:
		c = leaseCheck
	case Effect:
		c = effectCheck
	case Receipt:
		c = receiptCheck
	case Label:
		c = label.Check
	case Operation:
		c = operationCheck
	default:
		return nil, wrapInvalid("", "is a %T, not a noun", v)
	}
	buf, err := wire.Compact(data)
	if err != nil {
		return nil, classify(err)
	}
	if err := c("", buf); err != nil {
		return nil, classify(err)
	}
	return buf, nil
}
