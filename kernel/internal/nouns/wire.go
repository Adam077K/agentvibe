package nouns

// The wire rules of nouns.go's package comment, as checks over the JSON before it reaches a
// struct. encoding/json alone cannot hold them: it drops unknown keys, matches keys without regard
// to case, leaves a missing key at its zero value, and accepts null for a string as "no change".
// So Decode validates the bytes first and only then lets encoding/json fill the struct.

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"slices"
	"strconv"
	"strings"
	"unicode/utf8"
)

// check validates one JSON value found at path. raw is compact: no insignificant whitespace.
type check func(path string, raw json.RawMessage) error

// field is one key of an object. An optional key is absent when unset: present as null or "" it is
// refused, and an optional list (slice) is refused when empty too, because Encode's omitempty would
// drop it and Encode(Decode(b)) would no longer be b.
type field struct {
	name  string
	opt   bool
	slice bool
	c     check
}

func req(name string, c check) field { return field{name: name, c: c} }
func opt(name string, c check) field { return field{name: name, opt: true, c: c} }
func optList(name string, c check) field {
	return field{name: name, opt: true, slice: true, c: c}
}

func wrapInvalid(path, format string, args ...any) error {
	if path == "" {
		path = "value"
	}
	return fmt.Errorf("%w: %s %s", ErrInvalid, path, fmt.Sprintf(format, args...))
}

func join(path, key string) string {
	if path == "" {
		return key
	}
	return path + "." + key
}

// kindOf names the JSON type of raw by its first byte.
func kindOf(raw json.RawMessage) string {
	b := bytes.TrimLeft(raw, " \t\r\n")
	if len(b) == 0 {
		return "nothing"
	}
	switch b[0] {
	case '{':
		return "object"
	case '[':
		return "array"
	case '"':
		return "string"
	case 't', 'f':
		return "boolean"
	case 'n':
		return "null"
	}
	return "number"
}

func object(fields ...field) check {
	known := make(map[string]bool, len(fields))
	for _, f := range fields {
		known[f.name] = true
	}
	return func(path string, raw json.RawMessage) error {
		if k := kindOf(raw); k != "object" {
			return wrapInvalid(path, "is a JSON %s; want an object", k)
		}
		var m map[string]json.RawMessage
		if err := json.Unmarshal(raw, &m); err != nil {
			return wrapInvalid(path, "%v", err)
		}
		var unknown []string
		for k := range m {
			if !known[k] {
				unknown = append(unknown, k)
			}
		}
		if len(unknown) > 0 {
			slices.Sort(unknown)
			return wrapInvalid(path, "has unknown key(s) %q", unknown)
		}
		for _, f := range fields {
			p := join(path, f.name)
			v, ok := m[f.name]
			if !ok {
				if f.opt {
					continue
				}
				return wrapInvalid(p, "is required")
			}
			if f.opt {
				switch {
				case kindOf(v) == "null":
					return wrapInvalid(p, "is null; an optional field is absent when unset, never null")
				case string(v) == `""`:
					return wrapInvalid(p, `is ""; an optional field is absent when unset, never ""`)
				case f.slice && string(v) == "[]":
					return wrapInvalid(p, "is []; an optional list is absent when empty")
				}
			}
			if err := f.c(p, v); err != nil {
				return err
			}
		}
		return nil
	}
}

func arrayOf(c check) check {
	return func(path string, raw json.RawMessage) error {
		if k := kindOf(raw); k != "array" {
			return wrapInvalid(path, "is a JSON %s; want an array", k)
		}
		var items []json.RawMessage
		if err := json.Unmarshal(raw, &items); err != nil {
			return wrapInvalid(path, "%v", err)
		}
		for i, it := range items {
			if err := c(fmt.Sprintf("%s[%d]", path, i), it); err != nil {
				return err
			}
		}
		return nil
	}
}

func stringOf(path string, raw json.RawMessage) (string, error) {
	if k := kindOf(raw); k != "string" {
		return "", wrapInvalid(path, "is a JSON %s; want a string", k)
	}
	var s string
	if err := json.Unmarshal(raw, &s); err != nil {
		return "", wrapInvalid(path, "%v", err)
	}
	return s, nil
}

// str accepts any string.
func str(path string, raw json.RawMessage) error {
	_, err := stringOf(path, raw)
	return err
}

// id accepts a non-empty string: every *Id and *Ref type.
func id(path string, raw json.RawMessage) error {
	s, err := stringOf(path, raw)
	if err == nil && s == "" {
		err = wrapInvalid(path, "is empty; an id or ref is a non-empty string")
	}
	return err
}

func enum(values ...string) check {
	return func(path string, raw json.RawMessage) error {
		s, err := stringOf(path, raw)
		if err != nil {
			return err
		}
		if !slices.Contains(values, s) {
			return wrapInvalid(path, "is %q; want one of %s", s, strings.Join(values, "|"))
		}
		return nil
	}
}

// hex accepts 64 lowercase hex characters.
func hex(path string, raw json.RawMessage) error {
	s, err := stringOf(path, raw)
	if err != nil {
		return err
	}
	if len(s) != 64 || strings.Trim(s, "0123456789abcdef") != "" {
		return wrapInvalid(path, "is %q; want 64 lowercase hex characters", s)
	}
	return nil
}

func boolean(path string, raw json.RawMessage) error {
	if k := kindOf(raw); k != "boolean" {
		return wrapInvalid(path, "is a JSON %s; want a boolean", k)
	}
	return nil
}

// bigint accepts an unsigned decimal string with no sign and no leading zero that fits a uint64.
// A JSON number is refused: above 2^53 JavaScript's JSON.parse would round it.
func bigint(path string, raw json.RawMessage) error {
	s, err := stringOf(path, raw)
	if err != nil {
		if kindOf(raw) == "number" {
			return wrapInvalid(path, "is a JSON number; a bigint is a decimal string")
		}
		return err
	}
	if s == "" || (len(s) > 1 && s[0] == '0') || strings.Trim(s, "0123456789") != "" {
		return wrapInvalid(path, "is %q; want an unsigned decimal string without leading zeros", s)
	}
	if _, err := strconv.ParseUint(s, 10, 64); err != nil {
		return wrapInvalid(path, "is %q; it does not fit 64 bits", s)
	}
	return nil
}

// integerText returns raw's literal if it is a JSON number written as an integer: no fraction, no
// exponent, and not "-0", any of which would not survive a round trip through a Go integer.
func integerText(path string, raw json.RawMessage) (string, error) {
	if k := kindOf(raw); k != "number" {
		return "", wrapInvalid(path, "is a JSON %s; want an integer", k)
	}
	s := string(raw)
	if strings.ContainsAny(s, ".eE") || s == "-0" {
		return "", wrapInvalid(path, "is %s; want an integer", s)
	}
	return s, nil
}

// unsigned accepts a JSON integer that fits a uint64 and is at least min.
func unsigned(min uint64) check {
	return func(path string, raw json.RawMessage) error {
		s, err := integerText(path, raw)
		if err != nil {
			return err
		}
		n, err := strconv.ParseUint(s, 10, 64)
		if err != nil {
			return wrapInvalid(path, "is %s; want an integer in 0..2^64-1", s)
		}
		if n < min {
			return wrapInvalid(path, "is %s; want at least %d", s, min)
		}
		return nil
	}
}

// signed accepts a JSON integer that fits a Go int and is at least min.
func signed(min int) check {
	return func(path string, raw json.RawMessage) error {
		s, err := integerText(path, raw)
		if err != nil {
			return err
		}
		n, err := strconv.ParseInt(s, 10, strconv.IntSize)
		if err != nil {
			return wrapInvalid(path, "is %s; it does not fit a %d-bit integer", s, strconv.IntSize)
		}
		if n < int64(min) {
			return wrapInvalid(path, "is %s; want at least %d", s, min)
		}
		return nil
	}
}

func number(path string, raw json.RawMessage) error {
	if k := kindOf(raw); k != "number" {
		return wrapInvalid(path, "is a JSON %s; want a number", k)
	}
	if _, err := strconv.ParseFloat(string(raw), 64); err != nil {
		return wrapInvalid(path, "is %s; it does not fit a float64", raw)
	}
	return nil
}

// anyJSON accepts any value: the types the canon names but does not define.
func anyJSON(string, json.RawMessage) error { return nil }

const labelSchema = "label/1"

var labelFields = object(
	req("schema", enum(labelSchema)),
	req("origin", enum("founder", "system_of_record", "internal", "public_web", "customer", "counterparty", "synthetic")),
	req("dclass", enum("D0", "D1", "D2", "D3", "D4")),
	req("boundary", enum("open", "guarded", "sealed")),
	req("venture", id),
	req("retention", object(
		req("class", enum("journal_metadata", "operational", "personal", "client", "synthetic")),
		req("hold", enum("none", "obligation", "legal", "safety", "pinned")),
		opt("deadline", str),
	)),
	req("permission", enum("none", "informs", "may_authorise")),
	req("exportable", boolean),
	req("taint", enum("clean", "untrusted", "quarantined")),
	req("provenance", arrayOf(anyJSON)),
	opt("consent_scope", id),
	opt("confidence", number),
	optList("subjects", arrayOf(id)),
	req("revocation_epoch", unsigned(0)),
)

// label refuses an unknown schema version before anything else: a reader that does not know the
// version cannot judge the rest of the record, so "unknown key" would be the wrong refusal.
func label(path string, raw json.RawMessage) error {
	var m map[string]json.RawMessage
	if kindOf(raw) == "object" && json.Unmarshal(raw, &m) == nil && kindOf(m["schema"]) == "string" {
		var s string
		if json.Unmarshal(m["schema"], &s) == nil && s != labelSchema {
			return fmt.Errorf("%w: %s.schema is %q; this reader knows %q", ErrUnknownSchema, pathOr(path), s, labelSchema)
		}
	}
	return labelFields(path, raw)
}

func pathOr(path string) string {
	if path == "" {
		return "label"
	}
	return path
}

var eventCheck = object(
	req("id", id),
	req("stream", str),
	req("seq", unsigned(1)),
	req("type", str),
	req("ts", str),
	req("actor", anyJSON),
	req("correlation_id", id),
	opt("causation_id", id),
	req("label", label),
	opt("rationale", anyJSON),
	opt("snapshot_ref", id),
	req("schema", signed(1)),
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
	req("label", label),
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
	req("attempt", signed(math.MinInt)),
	req("contract_ref", id),
	req("snapshot_ref", id),
	req("effect_class", enum("R0", "R1", "R2", "R3", "R4")),
	req("idem_class", enum("native_key", "check_before", "natural", "at_most_once")),
	req("authorising_label", label),
	req("approvals", arrayOf(id)),
	req("fencing_tokens", anyJSON),
	req("gateway_epoch", bigint),
	req("state", str),
)

var receiptCheck = object(
	req("effect_id", id),
	req("operation_id", id),
	req("attempt", signed(math.MinInt)),
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
func validate(v any, data []byte) ([]byte, error) {
	var c check
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
		c = label
	case Operation:
		c = operationCheck
	default:
		return nil, wrapInvalid("", "is a %T, not a noun", v)
	}
	if !utf8.Valid(data) {
		return nil, wrapInvalid("", "is not valid UTF-8")
	}
	var buf bytes.Buffer
	if err := json.Compact(&buf, data); err != nil {
		return nil, wrapInvalid("", "is not one JSON value: %v", err)
	}
	if err := c("", buf.Bytes()); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// marshal is json.Marshal without HTML escaping, so a raw field holding "<" is written as "<" and
// Decode(Encode(v)) returns the same bytes in it that v held.
func marshal(v any) ([]byte, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		return nil, err
	}
	return bytes.TrimSuffix(buf.Bytes(), []byte("\n")), nil
}
