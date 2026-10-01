package nouns_test

// Unit tests for what the frozen done-test (nouns_donetest_test.go) does not pin: Upcast's
// no-aliasing contract, and wire edges the fixtures do not reach.

import (
	"bytes"
	"encoding/json"
	"errors"
	"reflect"
	"strings"
	"testing"

	"github.com/Adam077K/agentvibe/kernel/internal/nouns"
)

const labelMin = `{"schema":"label/1","origin":"internal","dclass":"D0","boundary":"open","venture":"portfolio",` +
	`"retention":{"class":"journal_metadata","hold":"none"},"permission":"none","exportable":false,` +
	`"taint":"clean","provenance":[{"source":"s"}],"revocation_epoch":0}`

const zeroHex = "0000000000000000000000000000000000000000000000000000000000000000"

// decision is a schema-1 decision.compiled event in the canon §3 layout.
func decision(t *testing.T) nouns.Event {
	t.Helper()
	b := `{"id":"01J9ZQ3M4K8V2N6P0R5T7W1YA0","stream":"mission:m_1","seq":1,"type":"decision.compiled",` +
		`"ts":"2026-10-01T09:00:00Z","actor":{"kind":"engine","id":"avd"},"correlation_id":"m_1",` +
		`"label":` + labelMin + `,"rationale":{"why":"r"},"schema":1,` +
		`"data":{"action":{"operation_id":"op_1"},"effect_class":"R2","door":"two_way","disposition":"ask"},` +
		`"prev_hash":"` + zeroHex + `","hash":"` + zeroHex + `"}`
	e, err := nouns.Decode[nouns.Event]([]byte(b))
	if err != nil {
		t.Fatalf("Decode: %v", err)
	}
	return e
}

// scribble overwrites every byte of b in place, so any alias of b shows the damage.
func scribble(b []byte) {
	for i := range b {
		b[i] = 'X'
	}
}

func snapshot(e nouns.Event) []byte {
	b, err := json.Marshal(e)
	if err != nil {
		panic(err)
	}
	return b
}

// TestUpcastDoesNotAliasData pins the contract comment on Upcast: e is not modified and its Data
// is not aliased — neither by Upcast's result, nor by an Up or a Reader that writes to its input.
func TestUpcastDoesNotAliasData(t *testing.T) {
	t.Run("no upcaster installed", func(t *testing.T) {
		e := decision(t)
		before := snapshot(e)
		up, err := nouns.Kernel().Upcast(e)
		if err != nil {
			t.Fatalf("Upcast: %v", err)
		}
		if up.Schema != 1 || !bytes.Equal(up.Data, e.Data) {
			t.Fatalf("Upcast with nothing installed changed the data: %s", up.Data)
		}
		scribble(up.Data)
		scribble(up.Actor)
		scribble(up.Rationale)
		scribble(up.Label.Provenance[0])
		if got := snapshot(e); !bytes.Equal(got, before) {
			t.Errorf("writing to Upcast's result reached the stored event\n got: %s\nwant: %s", got, before)
		}
	})

	t.Run("upcaster and reader write to their input", func(t *testing.T) {
		e := decision(t)
		before := snapshot(e)
		r := nouns.NewRegistry()
		v1 := func(data json.RawMessage) (nouns.Outcome, error) {
			defer scribble(data)
			return nouns.Kernel().Outcome(nouns.Event{Type: nouns.DecisionCompiled, Schema: 1, Data: data})
		}
		if err := r.AddReader(nouns.DecisionCompiled, 1, v1); err != nil {
			t.Fatalf("AddReader: %v", err)
		}
		v2 := func(data json.RawMessage) (nouns.Outcome, error) {
			defer scribble(data)
			var m map[string]json.RawMessage
			if err := json.Unmarshal(data, &m); err != nil {
				return nouns.Outcome{}, err
			}
			return nouns.Kernel().Outcome(nouns.Event{Type: nouns.DecisionCompiled, Schema: 1, Data: m["v1"]})
		}
		if err := r.AddReader(nouns.DecisionCompiled, 2, v2); err != nil {
			t.Fatalf("AddReader: %v", err)
		}
		wrap := nouns.Upcaster{Type: nouns.DecisionCompiled, From: 1, Up: func(data json.RawMessage) (json.RawMessage, error) {
			out, err := json.Marshal(map[string]json.RawMessage{"v1": append(json.RawMessage(nil), data...)})
			scribble(data)
			return out, err
		}}
		if err := r.AddUpcaster(wrap, []nouns.Event{e}); err != nil {
			t.Fatalf("AddUpcaster: %v", err)
		}
		if got := snapshot(e); !bytes.Equal(got, before) {
			t.Fatalf("AddUpcaster's replay modified the history it was given\n got: %s\nwant: %s", got, before)
		}
		up, err := r.Upcast(e)
		if err != nil {
			t.Fatalf("Upcast: %v", err)
		}
		if up.Schema != 2 {
			t.Fatalf("upcast to schema %d; want 2", up.Schema)
		}
		if _, err := r.Outcome(up); err != nil {
			t.Fatalf("Outcome(upcast): %v", err)
		}
		if _, err := r.Outcome(e); err != nil {
			t.Fatalf("Outcome(stored): %v", err)
		}
		scribble(up.Data)
		if got := snapshot(e); !bytes.Equal(got, before) {
			t.Errorf("Upcast, Outcome or a write to the result modified the stored event\n got: %s\nwant: %s", got, before)
		}
		if up2, err := r.Upcast(e); err != nil || !json.Valid(up2.Data) {
			t.Errorf("a second Upcast of the same event reads %s (err %v)", up2.Data, err)
		}
	})
}

// TestWireEdges covers refusals the frozen fixtures do not exercise. Each follows from a stated
// wire rule or from Encode(Decode(b)) == b.
func TestWireEdges(t *testing.T) {
	lease := func(fencing string) string {
		return `{"id":"l_1","resource":"job://j","holder":"j","fencing_token":` + fencing +
			`,"epoch":"0","mode":"excl","kind":"optimistic","expires_at":"t"}`
	}
	withLabel := func(old, repl string) string { return strings.Replace(labelMin, old, repl, 1) }
	refused := []struct {
		name, kind, value string
		want              error
	}{
		{"optional string present but empty", "label", withLabel(`"revocation_epoch"`, `"consent_scope":"","revocation_epoch"`), nouns.ErrInvalid},
		{"optional list present but empty", "label", withLabel(`"revocation_epoch"`, `"subjects":[],"revocation_epoch"`), nouns.ErrInvalid},
		{"id empty", "label", withLabel(`"portfolio"`, `""`), nouns.ErrInvalid},
		{"required string null", "label", withLabel(`"taint":"clean"`, `"taint":null`), nouns.ErrInvalid},
		{"key differs only in case", "label", withLabel(`"taint"`, `"Taint"`), nouns.ErrInvalid},
		{"integer written with a fraction", "label", withLabel(`"revocation_epoch":0`, `"revocation_epoch":0.0`), nouns.ErrInvalid},
		{"unknown schema reported before unknown key", "label", withLabel(`"label/1"`, `"label/2","novel":1`), nouns.ErrUnknownSchema},
		{"trailing value", "label", labelMin + ` {}`, nouns.ErrInvalid},
		{"not JSON", "label", `{"schema":`, nouns.ErrInvalid},
		{"invalid UTF-8", "label", withLabel(`"portfolio"`, "\"v_\xff\""), nouns.ErrInvalid},
		{"bigint with a leading zero", "lease", lease(`"01"`), nouns.ErrInvalid},
		{"bigint with a sign", "lease", lease(`"+1"`), nouns.ErrInvalid},
		{"bigint above 2^64-1", "lease", lease(`"18446744073709551616"`), nouns.ErrInvalid},
		{"bigint empty", "lease", lease(`""`), nouns.ErrInvalid},
	}
	for _, c := range refused {
		t.Run(c.name, func(t *testing.T) {
			var err error
			switch c.kind {
			case "label":
				_, err = nouns.Decode[nouns.Label]([]byte(c.value))
			case "lease":
				_, err = nouns.Decode[nouns.Lease]([]byte(c.value))
			}
			if !errors.Is(err, c.want) {
				t.Errorf("Decode = %v; want an error wrapping %v", err, c.want)
			}
		})
	}

	t.Run("controls accepted", func(t *testing.T) {
		if _, err := nouns.Decode[nouns.Lease]([]byte(lease(`"18446744073709551615"`))); err != nil {
			t.Errorf("max uint64 bigint refused: %v", err)
		}
		if _, err := nouns.Decode[nouns.Label]([]byte(" \n" + labelMin + "\n ")); err != nil {
			t.Errorf("surrounding whitespace refused: %v", err)
		}
	})

	t.Run("Encode refuses what Decode would refuse", func(t *testing.T) {
		if _, err := nouns.Encode(nouns.Label{}); !errors.Is(err, nouns.ErrUnknownSchema) {
			t.Errorf("Encode(Label{}) = %v; want ErrUnknownSchema (schema \"\")", err)
		}
		l, err := nouns.Decode[nouns.Label]([]byte(labelMin))
		if err != nil {
			t.Fatal(err)
		}
		l.Provenance = nil
		if _, err := nouns.Encode(l); !errors.Is(err, nouns.ErrInvalid) {
			t.Errorf("Encode with nil provenance = %v; want ErrInvalid (it would be written as null)", err)
		}
	})

	t.Run("Decode(Encode(v)) == v with markup in raw data", func(t *testing.T) {
		e := decision(t)
		e.Data = json.RawMessage(`{"html":"<b>&</b>"}`)
		b, err := nouns.Encode(e)
		if err != nil {
			t.Fatalf("Encode: %v", err)
		}
		back, err := nouns.Decode[nouns.Event](b)
		if err != nil {
			t.Fatalf("Decode: %v", err)
		}
		if !reflect.DeepEqual(back, e) {
			t.Errorf("round trip changed the event\n got: %+v\nwant: %+v", back, e)
		}
	})
}

// TestKernelReaderRefusesUnknownValues: the shipped reader returns no Outcome it cannot vouch for.
func TestKernelReaderRefusesUnknownValues(t *testing.T) {
	r := nouns.Kernel()
	for _, data := range []string{
		`{"action":{"operation_id":"op_1"},"effect_class":"R2","door":"two_way","disposition":"maybe"}`,
		`{"action":{"operation_id":"op_1"},"effect_class":"R5","door":"two_way","disposition":"ask"}`,
		`{"action":{"operation_id":""},"effect_class":"R2","door":"two_way","disposition":"ask"}`,
		`{"action":{"operation_id":"op_1"},"effect_class":"R2","disposition":"ask"}`,
		`[]`,
	} {
		e := nouns.Event{Type: nouns.DecisionCompiled, Schema: 1, Data: json.RawMessage(data)}
		if o, err := r.Outcome(e); err == nil {
			t.Errorf("Outcome(%s) = %+v; want a refusal", data, o)
		}
	}
	liar := func(json.RawMessage) (nouns.Outcome, error) { return nouns.Outcome{}, nil }
	if err := r.AddReader(nouns.DecisionCompiled, 1, liar); !errors.Is(err, nouns.ErrDuplicate) {
		t.Errorf("replacing the shipped reader = %v; want ErrDuplicate", err)
	}
}

// ---- review round 1: exact-case keys, no duplicates, JS-safe integers --------------------------

const decisionData = `{"action":{"operation_id":"op_1"},"effect_class":"R4","door":"one_way","disposition":"never"}`

func encodedDecision(t *testing.T) string {
	t.Helper()
	b, err := nouns.Encode(decision(t))
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

func decodeEvent(b []byte) error { _, err := nouns.Decode[nouns.Event](b); return err }

// mustRefuse decodes edit(base) and wants ErrInvalid; it fails loudly if the edit did not apply,
// so a fixture typo cannot pass as a refusal.
func mustRefuse(t *testing.T, base, edited string, dec func([]byte) error) {
	t.Helper()
	if edited == base {
		t.Fatal("the fixture edit did not apply")
	}
	if err := dec([]byte(edited)); !errors.Is(err, nouns.ErrInvalid) {
		t.Errorf("Decode(%s) = %v; want an error wrapping ErrInvalid", edited, err)
	}
}

// TestDecodeRefusesDuplicateAndCaseVariantKeys: Decode matches keys exactly. A key twice, at any
// depth, or a key that differs from a known one only by case, is refused rather than resolved.
func TestDecodeRefusesDuplicateAndCaseVariantKeys(t *testing.T) {
	ev := encodedDecision(t)
	if err := decodeEvent([]byte(ev)); err != nil {
		t.Fatalf("control: the unedited event is refused: %v", err)
	}
	for _, c := range []struct{ name, old, repl string }{
		{"seq twice, string then number", `"seq":1`, `"seq":"x","seq":7`},
		{"seq twice, both valid", `"seq":1`, `"seq":1,"seq":2`},
		{"case variant beside the key", `"seq":1`, `"seq":1,"SEQ":2`},
		{"case variant instead of the key", `"seq":1`, `"Seq":1`},
		{"duplicate inside the label", `"taint":"clean"`, `"taint":"clean","taint":"untrusted"`},
		{"case variant inside the label", `"taint":"clean"`, `"taint":"clean","Taint":"untrusted"`},
		{"duplicate inside data", `"disposition":"ask"`, `"disposition":"ask","disposition":"auto"`},
		{"duplicate inside actor", `"id":"avd"`, `"id":"avd","id":"evil"`},
		{"duplicate inside a provenance entry", `{"source":"s"}`, `{"source":"s","source":"t"}`},
	} {
		t.Run(c.name, func(t *testing.T) {
			mustRefuse(t, ev, strings.Replace(ev, c.old, c.repl, 1), decodeEvent)
		})
	}
}

// TestKernelReaderMatchesKeysExactly: the shipped decision reader cannot be talked out of a past
// decision by a second spelling of a key.
func TestKernelReaderMatchesKeysExactly(t *testing.T) {
	r := nouns.Kernel()
	read := func(data string) (nouns.Outcome, error) {
		return r.Outcome(nouns.Event{Type: nouns.DecisionCompiled, Schema: 1, Data: json.RawMessage(data)})
	}
	if o, err := read(decisionData); err != nil || o.Disposition != "never" {
		t.Fatalf("control: %s reads %+v (err %v)", decisionData, o, err)
	}
	for _, c := range []struct{ old, repl string }{
		{`"disposition":"never"`, `"disposition":"never","Disposition":"auto"`},
		{`"disposition":"never"`, `"DISPOSITION":"auto"`},
		{`"disposition":"never"`, `"disposition":"never","disposition":"auto"`},
		{`"operation_id":"op_1"`, `"operation_id":"op_1","Operation_ID":"op_2"`},
		{`"action"`, `"Action"`},
		{`"door":"one_way"`, `"door":"one_way","note":{"a":1,"a":2}`},
		{`"door":"one_way"`, `"door":"one_way","n":9007199254740993`},
	} {
		data := strings.Replace(decisionData, c.old, c.repl, 1)
		if data == decisionData {
			t.Fatalf("the edit %q did not apply", c.repl)
		}
		if o, err := read(data); err == nil {
			t.Errorf("Outcome(%s) = %+v; want a refusal", data, o)
		}
	}
}

// TestUpcasterRenamingKeyCaseIsRefused: an upcaster that only changes a key's case changes what
// the exact-case reader sees, so the meaning check refuses it.
func TestUpcasterRenamingKeyCaseIsRefused(t *testing.T) {
	e := decision(t)
	shipped := func(data json.RawMessage) (nouns.Outcome, error) {
		return nouns.Kernel().Outcome(nouns.Event{Type: nouns.DecisionCompiled, Schema: 1, Data: data})
	}
	r := nouns.Kernel()
	if err := r.AddReader(nouns.DecisionCompiled, 2, shipped); err != nil {
		t.Fatal(err)
	}
	rename := nouns.Upcaster{Type: nouns.DecisionCompiled, From: 1, Up: func(data json.RawMessage) (json.RawMessage, error) {
		return json.RawMessage(strings.Replace(string(data), `"disposition"`, `"Disposition"`, 1)), nil
	}}
	if err := r.AddUpcaster(rename, []nouns.Event{e}); !errors.Is(err, nouns.ErrMeaningChanged) {
		t.Errorf("AddUpcaster(case rename) = %v; want an error wrapping ErrMeaningChanged", err)
	}
	identity := nouns.Upcaster{Type: nouns.DecisionCompiled, From: 1, Up: func(data json.RawMessage) (json.RawMessage, error) {
		return data, nil
	}}
	if err := r.AddUpcaster(identity, []nouns.Event{e}); err != nil {
		t.Errorf("control: the identity upcaster is refused: %v", err)
	}
}

// TestIntegersAreJavaScriptSafe: an integer literal holds at most 2^53-1 in magnitude, in the
// typed number fields and inside raw ones; above it JavaScript's JSON.parse rounds, so Userland
// could not carry the value without changing the bytes the Kernel hashes.
func TestIntegersAreJavaScriptSafe(t *testing.T) {
	ev := encodedDecision(t)
	const safe, unsafe = "9007199254740991", "9007199254740992"
	receipt := `{"effect_id":"ef_1","operation_id":"op_1","attempt":ATTEMPT,"request_digest":"` + zeroHex +
		`","observed_at":"t","issuer":"gateway","sig":"s","chain_prev":"` + zeroHex + `"}`
	effect := `{"id":"ef_1","operation_id":"op_1","attempt":ATTEMPT,"contract_ref":"dc","snapshot_ref":"snap",` +
		`"effect_class":"R0","idem_class":"natural","authorising_label":` + labelMin +
		`,"approvals":[],"fencing_tokens":{"t":ATTEMPT},"gateway_epoch":"1","state":"s"}`
	decLabel := func(b []byte) error { _, err := nouns.Decode[nouns.Label](b); return err }
	decEffect := func(b []byte) error { _, err := nouns.Decode[nouns.Effect](b); return err }
	decReceipt := func(b []byte) error { _, err := nouns.Decode[nouns.Receipt](b); return err }
	for _, c := range []struct {
		name string
		at   func(n string) string
		dec  func([]byte) error
	}{
		{"event.seq", func(n string) string { return strings.Replace(ev, `"seq":1`, `"seq":`+n, 1) }, decodeEvent},
		{"event.schema", func(n string) string { return strings.Replace(ev, `"schema":1,`, `"schema":`+n+`,`, 1) }, decodeEvent},
		{"event.data", func(n string) string { return strings.Replace(ev, `"data":{`, `"data":{"n":`+n+`,`, 1) }, decodeEvent},
		{"event.data nested negative", func(n string) string {
			return strings.Replace(ev, `"data":{`, `"data":{"deep":[{"n":-`+n+`}],`, 1)
		}, decodeEvent},
		{"event.actor", func(n string) string { return strings.Replace(ev, `"id":"avd"`, `"id":"avd","n":`+n, 1) }, decodeEvent},
		{"label.revocation_epoch", func(n string) string {
			return strings.Replace(labelMin, `"revocation_epoch":0`, `"revocation_epoch":`+n, 1)
		}, decLabel},
		{"effect.attempt and fencing_tokens", func(n string) string { return strings.ReplaceAll(effect, "ATTEMPT", n) }, decEffect},
		{"receipt.attempt", func(n string) string { return strings.Replace(receipt, "ATTEMPT", n, 1) }, decReceipt},
		{"receipt.attempt negative", func(n string) string { return strings.Replace(receipt, "ATTEMPT", "-"+n, 1) }, decReceipt},
	} {
		t.Run(c.name, func(t *testing.T) {
			if err := c.dec([]byte(c.at(safe))); err != nil {
				t.Errorf("2^53-1 refused: %v", err)
			}
			mustRefuse(t, c.at(safe), c.at(unsafe), c.dec)
		})
	}

	t.Run("the reviewer's case: 2^53+1 inside data", func(t *testing.T) {
		mustRefuse(t, ev, strings.Replace(ev, `"data":{`, `"data":{"n":9007199254740993,`, 1), decodeEvent)
	})
	t.Run("non-integer numbers are unaffected", func(t *testing.T) {
		for _, n := range []string{"9007199254740993.5", "1e300", "-9.1e15"} {
			if err := decodeEvent([]byte(strings.Replace(ev, `"data":{`, `"data":{"n":`+n+`,`, 1))); err != nil {
				t.Errorf("data holding %s refused: %v", n, err)
			}
		}
	})
}
