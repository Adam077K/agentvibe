// Package wire holds the Kernel's strict JSON checks, shared by every package that reads a wire
// record (kernel/internal/nouns, kernel/internal/label), so the rules below have one implementation.
// encoding/json alone cannot hold them: it drops unknown keys, matches keys without regard to case,
// leaves a missing key at its zero value, and accepts null for a string as "no change". A reader
// validates the bytes first and only then lets encoding/json fill the struct. Keys are matched
// exactly: a duplicate key, or a key that differs from a known key only by case, is refused rather
// than resolved.
//
// A check's error carries no sentinel: the package that owns the record wraps it in its own
// (nouns.ErrInvalid, label.ErrInvalid), so one refusal never names two packages' sentinels.
// Moved from kernel/internal/nouns/wire.go by B1-26 (one label reader, DR-LABEL-RECONCILE:61).
package wire

import (
	"bytes"
	"encoding/json"
	"fmt"
	"slices"
	"strconv"
	"strings"
	"unicode/utf8"
)

// Check validates one JSON value found at path. raw is compact: no insignificant whitespace.
type Check func(path string, raw json.RawMessage) error

// Field is one key of an object. An optional key is absent when unset: present as null or "" it is
// refused, and an optional list (slice) is refused when empty too, because Encode's omitempty would
// drop it and Encode(Decode(b)) would no longer be b.
type Field struct {
	name  string
	opt   bool
	slice bool
	c     Check
}

func Req(name string, c Check) Field { return Field{name: name, c: c} }
func Opt(name string, c Check) Field { return Field{name: name, opt: true, c: c} }
func OptList(name string, c Check) Field {
	return Field{name: name, opt: true, slice: true, c: c}
}

func Invalid(path, format string, args ...any) error {
	if path == "" {
		path = "value"
	}
	return fmt.Errorf("%s %s", path, fmt.Sprintf(format, args...))
}

func Join(path, key string) string {
	if path == "" {
		return key
	}
	return path + "." + key
}

// Members parses raw as one JSON object, keys matched exactly. It refuses a key that appears twice,
// and a key that equals one of known only when case is ignored: encoding/json would match
// "Disposition" to the field "disposition" and keep whichever came last, so a second spelling
// could overrule the first while every reader saw only one.
func Members(raw json.RawMessage, known ...string) (map[string]json.RawMessage, error) {
	if k := KindOf(raw); k != "object" {
		return nil, fmt.Errorf("is a JSON %s; want an object", k)
	}
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
		key, ok := t.(string)
		if !ok {
			return nil, fmt.Errorf("has a non-string key %v", t)
		}
		if _, dup := m[key]; dup {
			return nil, fmt.Errorf("has the key %q twice", key)
		}
		for _, kn := range known {
			if key != kn && strings.EqualFold(key, kn) {
				return nil, fmt.Errorf("has the key %q; the key is %q, matched exactly", key, kn)
			}
		}
		var v json.RawMessage
		if err := dec.Decode(&v); err != nil {
			return nil, err
		}
		m[key] = v
	}
	if _, err := dec.Token(); err != nil {
		return nil, err
	}
	return m, nil
}

// ScanWire walks every value of raw at any depth, including inside the fields the canon leaves
// undefined (actor, data, budget, …), and refuses two things there:
//   - a key that appears twice in one object: a reader of those values decodes them too, and which
//     copy wins is a property of the parser, not of the bytes;
//   - a number whose exact value is an integer outside ±(2^53-1), in any notation (1e300,
//     9007199254740993.0, 9.007199254740993e15): Userland's JSON.parse rounds it, so it could not
//     carry the value without changing the bytes the Kernel hashes. A value that is not an integer
//     (1.5, 1.5e-3, 9007199254740993.5) is left alone.
func ScanWire(raw json.RawMessage) error {
	switch KindOf(raw) {
	case "number":
		s := string(bytes.TrimSpace(raw))
		if UnsafeInteger(s) {
			return fmt.Errorf("holds %s, an integer outside ±(2^53-1)", s)
		}
	case "object":
		m, err := Members(raw)
		if err != nil {
			return err
		}
		for k, v := range m {
			if err := ScanWire(v); err != nil {
				return fmt.Errorf("under %q: %w", k, err)
			}
		}
	case "array":
		var items []json.RawMessage
		if err := json.Unmarshal(raw, &items); err != nil {
			return err
		}
		for i, it := range items {
			if err := ScanWire(it); err != nil {
				return fmt.Errorf("at [%d]: %w", i, err)
			}
		}
	}
	return nil
}

// KindOf names the JSON type of raw by its first byte.
func KindOf(raw json.RawMessage) string {
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

func Object(fields ...Field) Check {
	known := make(map[string]bool, len(fields))
	names := make([]string, len(fields))
	for i, f := range fields {
		known[f.name] = true
		names[i] = f.name
	}
	return func(path string, raw json.RawMessage) error {
		if k := KindOf(raw); k != "object" {
			return Invalid(path, "is a JSON %s; want an object", k)
		}
		m, err := Members(raw, names...)
		if err != nil {
			return Invalid(path, "%v", err)
		}
		var unknown []string
		for k := range m {
			if !known[k] {
				unknown = append(unknown, k)
			}
		}
		if len(unknown) > 0 {
			slices.Sort(unknown)
			return Invalid(path, "has unknown key(s) %q", unknown)
		}
		for _, f := range fields {
			p := Join(path, f.name)
			v, ok := m[f.name]
			if !ok {
				if f.opt {
					continue
				}
				return Invalid(p, "is required")
			}
			if f.opt {
				switch {
				case KindOf(v) == "null":
					return Invalid(p, "is null; an optional field is absent when unset, never null")
				case string(v) == `""`:
					return Invalid(p, `is ""; an optional Field is absent when unset, never ""`)
				case f.slice && string(v) == "[]":
					return Invalid(p, "is []; an optional list is absent when empty")
				}
			}
			if err := f.c(p, v); err != nil {
				return err
			}
		}
		return nil
	}
}

func ArrayOf(c Check) Check {
	return func(path string, raw json.RawMessage) error {
		if k := KindOf(raw); k != "array" {
			return Invalid(path, "is a JSON %s; want an array", k)
		}
		var items []json.RawMessage
		if err := json.Unmarshal(raw, &items); err != nil {
			return Invalid(path, "%v", err)
		}
		for i, it := range items {
			if err := c(fmt.Sprintf("%s[%d]", path, i), it); err != nil {
				return err
			}
		}
		return nil
	}
}

func StringOf(path string, raw json.RawMessage) (string, error) {
	if k := KindOf(raw); k != "string" {
		return "", Invalid(path, "is a JSON %s; want a string", k)
	}
	var s string
	if err := json.Unmarshal(raw, &s); err != nil {
		return "", Invalid(path, "%v", err)
	}
	return s, nil
}

// Str accepts any string.
func Str(path string, raw json.RawMessage) error {
	_, err := StringOf(path, raw)
	return err
}

// ID accepts a non-empty string: every *Id and *Ref type.
func ID(path string, raw json.RawMessage) error {
	s, err := StringOf(path, raw)
	if err == nil && s == "" {
		err = Invalid(path, "is empty; an id or ref is a non-empty string")
	}
	return err
}

func Enum(values ...string) Check {
	return func(path string, raw json.RawMessage) error {
		s, err := StringOf(path, raw)
		if err != nil {
			return err
		}
		if !slices.Contains(values, s) {
			return Invalid(path, "is %q; want one of %s", s, strings.Join(values, "|"))
		}
		return nil
	}
}

// Hex accepts 64 lowercase hex characters.
func Hex(path string, raw json.RawMessage) error {
	s, err := StringOf(path, raw)
	if err != nil {
		return err
	}
	if len(s) != 64 || strings.Trim(s, "0123456789abcdef") != "" {
		return Invalid(path, "is %q; want 64 lowercase hex characters", s)
	}
	return nil
}

func Boolean(path string, raw json.RawMessage) error {
	if k := KindOf(raw); k != "boolean" {
		return Invalid(path, "is a JSON %s; want a boolean", k)
	}
	return nil
}

// Bigint accepts an unsigned decimal string with no sign and no leading zero that fits a uint64.
// A JSON number is refused: above 2^53 JavaScript's JSON.parse would round it.
func Bigint(path string, raw json.RawMessage) error {
	s, err := StringOf(path, raw)
	if err != nil {
		if KindOf(raw) == "number" {
			return Invalid(path, "is a JSON number; a bigint is a decimal string")
		}
		return err
	}
	if s == "" || (len(s) > 1 && s[0] == '0') || strings.Trim(s, "0123456789") != "" {
		return Invalid(path, "is %q; want an unsigned decimal string without leading zeros", s)
	}
	if _, err := strconv.ParseUint(s, 10, 64); err != nil {
		return Invalid(path, "is %q; it does not fit 64 bits", s)
	}
	return nil
}

// IntegerText returns raw's literal if it is a JSON number written as an integer: no fraction, no
// exponent, and not "-0", any of which would not survive a round trip through a Go integer.
func IntegerText(path string, raw json.RawMessage) (string, error) {
	if k := KindOf(raw); k != "number" {
		return "", Invalid(path, "is a JSON %s; want an integer", k)
	}
	s := string(raw)
	if strings.ContainsAny(s, ".eE") || s == "-0" {
		return "", Invalid(path, "is %s; want an integer", s)
	}
	return s, nil
}

// UnsafeInteger reports whether the JSON number literal lit has an exact value that is an integer
// of magnitude above 2^53-1. It decides on the decimal digits rather than through math/big: the
// value is D × 10^E with D's digits, and building 10^E for an exponent like 1e999999999 would cost
// memory the size of the exponent. lit has already passed JSON's number grammar.
func UnsafeInteger(lit string) bool {
	s := strings.TrimPrefix(lit, "-")
	mant, exp := s, "0"
	if i := strings.IndexAny(s, "eE"); i >= 0 {
		mant, exp = s[:i], s[i+1:]
	}
	whole, frac, _ := strings.Cut(mant, ".")
	digits := strings.TrimLeft(whole+frac, "0")
	trimmed := strings.TrimRight(digits, "0")
	if trimmed == "" {
		return false // zero
	}
	// value = trimmed × 10^(e + shift), and trimmed ends in a non-zero digit.
	shift := int64(len(digits)-len(trimmed)) - int64(len(frac))
	e, err := strconv.ParseInt(exp, 10, 64)
	switch {
	case err != nil || e > 1<<40 || e < -(1<<40):
		// An exponent this large in magnitude: positive makes an integer far above 2^53, negative
		// leaves a fraction, whatever the (input-bounded) digits are.
		return !strings.HasPrefix(exp, "-")
	}
	pow := e + shift
	if pow < 0 {
		return false // a non-zero last digit below the units place: not an integer
	}
	if int64(len(trimmed))+pow > 16 {
		return true // 17 or more digits; 2^53-1 has 16
	}
	n, err := strconv.ParseInt(trimmed+strings.Repeat("0", int(pow)), 10, 64)
	return err != nil || n > MaxSafe
}

// MaxSafe is 2^53-1, JavaScript's Number.MAX_SAFE_INTEGER. 09a §3 types these fields `number`;
// above it JSON.parse rounds, so Userland would read a different value from the same bytes. A value
// that needs more range is a bigint, written as a decimal string.
const MaxSafe = 1<<53 - 1

// Integer accepts a JSON integer in min..2^53-1 (min is never below -(2^53-1)).
func Integer(min int64) Check {
	return func(path string, raw json.RawMessage) error {
		s, err := IntegerText(path, raw)
		if err != nil {
			return err
		}
		n, err := strconv.ParseInt(s, 10, 64)
		if err != nil || n > MaxSafe || n < -MaxSafe {
			return Invalid(path, "is %s; a number is an integer within ±(2^53-1), or JavaScript rounds it", s)
		}
		if n < min {
			return Invalid(path, "is %s; want at least %d", s, min)
		}
		return nil
	}
}

func Number(path string, raw json.RawMessage) error {
	if k := KindOf(raw); k != "number" {
		return Invalid(path, "is a JSON %s; want a number", k)
	}
	if _, err := strconv.ParseFloat(string(raw), 64); err != nil {
		return Invalid(path, "is %s; it does not fit a float64", raw)
	}
	return nil
}

// AnyJSON accepts any value: the types the canon names but does not define.
func AnyJSON(string, json.RawMessage) error { return nil }

// Marshal is json.Marshal without HTML escaping, so a raw field holding "<" is written as "<" and
// Decode(Encode(v)) returns the same bytes in it that v held.
func Marshal(v any) ([]byte, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		return nil, err
	}
	return bytes.TrimSuffix(buf.Bytes(), []byte("\n")), nil
}

// Compact checks that data is one valid UTF-8 JSON value that ScanWire accepts, and returns it
// compacted, so every raw JSON field a reader fills holds no insignificant whitespace and an
// encoder reproduces it byte for byte.
func Compact(data []byte) ([]byte, error) {
	if !utf8.Valid(data) {
		return nil, Invalid("", "is not valid UTF-8")
	}
	var buf bytes.Buffer
	if err := json.Compact(&buf, data); err != nil {
		return nil, Invalid("", "is not one JSON value: %v", err)
	}
	if err := ScanWire(buf.Bytes()); err != nil {
		return nil, Invalid("", "%v", err)
	}
	return buf.Bytes(), nil
}
