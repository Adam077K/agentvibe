package socket

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/Adam077K/agentvibe/kernel/internal/nouns"
)

// command is one parsed request whose shape has passed validation.
type command struct {
	cmd    string
	fields map[string]json.RawMessage
}

// refusal is why a line was refused, and the cmd string when the line had one.
type refusal struct {
	reason string
	cmd    string
	detail string
}

func (r *refusal) Error() string { return r.reason + ": " + r.detail }

func refuse(reason, cmd, format string, args ...any) *refusal {
	return &refusal{reason: reason, cmd: cmd, detail: fmt.Sprintf(format, args...)}
}

// check validates one present, non-null value.
type check func(raw json.RawMessage) error

type field struct {
	name     string
	required bool
	c        check
}

func req(name string, c check) field { return field{name, true, c} }
func opt(name string, c check) field { return field{name, false, c} }

// commands is 09a §2's KernelCommand: every cmd and its keys besides `cmd` itself.
var commands = map[string][]field{
	"propose_event": {req("stream", stream), req("expect_seq", seq), req("type", nonEmpty),
		req("label", label), req("data", anyJSON), opt("rationale", anyJSON)},
	"request_leases": {req("job", id), req("resources", ids),
		req("mode", enum("excl", "shared")), req("policy", enum("all_or_nothing", "wound_wait"))},
	"propose_effect": {req("verb", nonEmpty), req("target", anyJSON), req("business_ref", nonEmpty),
		req("payload_ref", id), req("lease_tokens", anyJSON)},
	"admit_job": {req("spec", anyJSON)},
	"compile":   {req("action", anyJSON)},
	"renew":     {req("lease_id", id), req("token", bigint)},
	"release":   {req("lease_id", id), req("token", bigint)},
}

// parse judges a line in the order socket.go fixes; the first failure names the reason.
func parse(line []byte) (command, *refusal) {
	if !utf8.Valid(line) || !json.Valid(line) || kindOf(line) != "object" {
		return command{}, refuse(ReasonBadJSON, "", "not exactly one JSON object")
	}
	m, err := members(line)
	if err != nil {
		// A key that appears twice is not one object: which copy wins is the parser's choice.
		return command{}, refuse(ReasonBadJSON, "", "%v", err)
	}
	raw, ok := m["cmd"]
	if !ok || kindOf(raw) == "null" {
		return command{}, refuse(ReasonMissingField, "", "cmd is absent")
	}
	if kindOf(raw) != "string" {
		return command{}, refuse(ReasonInvalidField, "", "cmd is a JSON %s; want a string", kindOf(raw))
	}
	var cmd string
	if err := json.Unmarshal(raw, &cmd); err != nil {
		return command{}, refuse(ReasonInvalidField, "", "cmd: %v", err)
	}
	spec, ok := commands[cmd]
	if !ok {
		return command{}, refuse(ReasonUnknownCmd, cmd, "no command %q", cmd)
	}
	for _, f := range spec {
		if v, ok := m[f.name]; f.required && (!ok || kindOf(v) == "null") {
			return command{}, refuse(ReasonMissingField, cmd, "%s is required", f.name)
		}
	}
	for k, v := range m {
		if k == "cmd" {
			continue
		}
		i := slices.IndexFunc(spec, func(f field) bool { return f.name == k })
		if i < 0 {
			return command{}, refuse(ReasonInvalidField, cmd, "unknown key %q", k)
		}
		if kindOf(v) == "null" { // an optional key is absent when unset, never null (B1-02)
			return command{}, refuse(ReasonInvalidField, cmd, "%s is null; omit it instead", k)
		}
		if err := spec[i].c(v); err != nil {
			return command{}, refuse(ReasonInvalidField, cmd, "%s %v", k, err)
		}
	}
	return command{cmd: cmd, fields: m}, nil
}

// members reads a JSON object's members, refusing a key that appears twice.
func members(raw []byte) (map[string]json.RawMessage, error) {
	dec := json.NewDecoder(bytes.NewReader(raw))
	if _, err := dec.Token(); err != nil {
		return nil, err
	}
	m := map[string]json.RawMessage{}
	for dec.More() {
		t, err := dec.Token()
		if err != nil {
			return nil, err
		}
		key := t.(string) // an object key is always a string to a decoder that accepted the line
		if _, dup := m[key]; dup {
			return nil, fmt.Errorf("the key %q appears twice", key)
		}
		var v json.RawMessage
		if err := dec.Decode(&v); err != nil {
			return nil, err
		}
		m[key] = v
	}
	return m, nil
}

// kindOf names the JSON type of a valid JSON value by its first significant byte.
func kindOf(raw []byte) string {
	raw = bytes.TrimLeft(raw, " \t\r\n")
	if len(raw) == 0 {
		return "nothing"
	}
	switch raw[0] {
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

func stringOf(raw json.RawMessage) (string, error) {
	if k := kindOf(raw); k != "string" {
		return "", fmt.Errorf("is a JSON %s; want a string", k)
	}
	var s string
	err := json.Unmarshal(raw, &s)
	return s, err
}

// nonEmpty is a string with at least one character.
func nonEmpty(raw json.RawMessage) error {
	s, err := stringOf(raw)
	if err == nil && s == "" {
		err = errors.New("is empty")
	}
	return err
}

// id is B1-02's id: a non-empty string.
func id(raw json.RawMessage) error { return nonEmpty(raw) }

// stream is a non-empty stream name that is not the socket's own refusal stream: Userland may
// propose events, but not forge the Kernel's record of what it refused.
func stream(raw json.RawMessage) error {
	s, err := stringOf(raw)
	switch {
	case err != nil:
		return err
	case s == "":
		return errors.New("is empty")
	case s == RefusalStream:
		return fmt.Errorf("is %q, which only the Kernel appends to", s)
	}
	return nil
}

// ids is a non-empty array of ids.
func ids(raw json.RawMessage) error {
	if k := kindOf(raw); k != "array" {
		return fmt.Errorf("is a JSON %s; want an array", k)
	}
	var items []json.RawMessage
	if err := json.Unmarshal(raw, &items); err != nil {
		return err
	}
	if len(items) == 0 {
		return errors.New("is empty; want at least one id")
	}
	for i, it := range items {
		if err := id(it); err != nil {
			return fmt.Errorf("[%d] %v", i, err)
		}
	}
	return nil
}

func enum(values ...string) check {
	return func(raw json.RawMessage) error {
		s, err := stringOf(raw)
		if err == nil && !slices.Contains(values, s) {
			err = fmt.Errorf("is %q; want one of %s", s, strings.Join(values, "|"))
		}
		return err
	}
}

// maxSafe is 2^53-1: above it Userland's JSON.parse rounds a number (B1-02's wire rule).
const maxSafe = 1<<53 - 1

// seq is an integer in 0..2^53-1, written without fraction, exponent or sign.
func seq(raw json.RawMessage) error {
	_, err := seqOf(raw)
	return err
}

func seqOf(raw json.RawMessage) (uint64, error) {
	if k := kindOf(raw); k != "number" {
		return 0, fmt.Errorf("is a JSON %s; want an integer", k)
	}
	s := string(raw)
	n, err := strconv.ParseUint(s, 10, 64)
	if err != nil || strings.ContainsAny(s, ".eE-+") || n > maxSafe {
		return 0, fmt.Errorf("is %s; want an integer in 0..%d", s, uint64(maxSafe))
	}
	return n, nil
}

// bigint is B1-02's bigint: an unsigned decimal string, no leading zero, that fits 64 bits.
func bigint(raw json.RawMessage) error {
	_, err := bigintOf(raw)
	return err
}

func bigintOf(raw json.RawMessage) (uint64, error) {
	s, err := stringOf(raw)
	if err != nil {
		return 0, err
	}
	if s == "" || (len(s) > 1 && s[0] == '0') || strings.Trim(s, "0123456789") != "" {
		return 0, fmt.Errorf("is %q; want an unsigned decimal string without leading zeros", s)
	}
	n, err := strconv.ParseUint(s, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("is %q; it does not fit 64 bits", s)
	}
	return n, nil
}

// label is a Label B1-02's decoder accepts.
func label(raw json.RawMessage) error {
	_, err := nouns.Decode[nouns.Label](raw)
	return err
}

// anyJSON is a type 09a names but does not define: carried as raw JSON, unchecked.
func anyJSON(json.RawMessage) error { return nil }

// str returns a field already validated as a string.
func (c command) str(key string) string {
	s, _ := stringOf(c.fields[key])
	return s
}

// compactJSON is raw without insignificant whitespace; raw has already passed json.Valid.
func compactJSON(raw json.RawMessage) json.RawMessage {
	var b bytes.Buffer
	if err := json.Compact(&b, raw); err != nil {
		return raw
	}
	return b.Bytes()
}
