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
