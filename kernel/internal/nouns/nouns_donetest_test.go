//go:build donetest

// B1-02 done-test (docs/vision-v3/14-BUILD-PLAN.md §6): "Round-trip fixtures in both languages; an
// upcaster cannot change a past decision's meaning (replay test)". This file is the Go half. It and
// testdata/nouns/{valid,invalid,decisions}.json are hash-registered in build/done-tests/B1-02.yml;
// editing any of them changes the job's acceptance, which is a register change, not a fix. The
// fixtures are language-neutral so the Userland (Zod) half reads the same bytes.
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/nouns/
package nouns_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"testing"

	"github.com/Adam077K/agentvibe/kernel/internal/nouns"
)

// kinds is every wire type: the six nouns and Operation.
var kinds = []string{"event", "job", "lease", "effect", "receipt", "label", "operation"}

type validCase struct {
	Name  string          `json:"name"`
	Kind  string          `json:"kind"`
	Value json.RawMessage `json:"value"`
}

type invalidCase struct {
	Name  string          `json:"name"`
	Kind  string          `json:"kind"`
	Error string          `json:"error"`
	Why   string          `json:"why"`
	Value json.RawMessage `json:"value"`
}

type pastDecision struct {
	Event   json.RawMessage `json:"event"`
	Outcome nouns.Outcome   `json:"outcome"`
}

func load(t *testing.T, name string, v any) {
	t.Helper()
	b, err := os.ReadFile(filepath.Join("testdata", "nouns", name))
	if err != nil {
		t.Fatalf("fixture: %v", err)
	}
	d := json.NewDecoder(bytes.NewReader(b))
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		t.Fatalf("fixture %s: %v", name, err)
	}
}

func decode(kind string, b []byte) (any, error) {
	switch kind {
	case "event":
		return nouns.Decode[nouns.Event](b)
	case "job":
		return nouns.Decode[nouns.Job](b)
	case "lease":
		return nouns.Decode[nouns.Lease](b)
	case "effect":
		return nouns.Decode[nouns.Effect](b)
	case "receipt":
		return nouns.Decode[nouns.Receipt](b)
	case "label":
		return nouns.Decode[nouns.Label](b)
	case "operation":
		return nouns.Decode[nouns.Operation](b)
	}
	return nil, fmt.Errorf("fixture names unknown kind %q", kind)
}

func encode(v any) ([]byte, error) {
	switch x := v.(type) {
	case nouns.Event:
		return nouns.Encode(x)
	case nouns.Job:
		return nouns.Encode(x)
	case nouns.Lease:
		return nouns.Encode(x)
	case nouns.Effect:
		return nouns.Encode(x)
	case nouns.Receipt:
		return nouns.Encode(x)
	case nouns.Label:
		return nouns.Encode(x)
	case nouns.Operation:
		return nouns.Encode(x)
	}
	return nil, fmt.Errorf("not a noun: %T", v)
}

// canonical parses JSON keeping numbers as their literal text, so 9007199254740993 stays exact and
// a decimal string never compares equal to a number.
func canonical(b []byte) (any, error) {
	d := json.NewDecoder(bytes.NewReader(b))
	d.UseNumber()
	var v any
	if err := d.Decode(&v); err != nil {
		return nil, err
	}
	if _, err := d.Token(); err != io.EOF {
		return nil, fmt.Errorf("trailing data after the JSON value")
	}
	return v, nil
}

func mustSameJSON(t *testing.T, what string, got, want []byte) {
	t.Helper()
	g, err := canonical(got)
	if err != nil {
		t.Fatalf("%s is not JSON: %v\n%s", what, err, got)
	}
	w, err := canonical(want)
	if err != nil {
		t.Fatalf("fixture is not JSON: %v", err)
	}
	if !reflect.DeepEqual(g, w) {
		t.Errorf("%s differs from the fixture\n got: %s\nwant: %s", what, got, want)
	}
}

// structJSON is v's fields as encoding/json writes them from the struct tags: a direct read of the
// decoded value, whatever Go type nouns.Label is.
func structJSON(t *testing.T, v any) map[string]any {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return m
}

// pins check decoded values directly, so a Decode that stashes the input bytes for Encode to replay
// cannot pass: the value has to be in the struct.
var pins = map[string]func(t *testing.T, v any){
	"lease.full": func(t *testing.T, v any) {
		l := v.(nouns.Lease)
		if l.FencingToken != 9007199254740993 || l.Epoch != 18446744073709551615 {
			t.Errorf("bigints decoded as fencing_token=%d epoch=%d", l.FencingToken, l.Epoch)
		}
	},
	// The label pins read the struct through its own JSON tags, not through Encode, so they hold for
	// nouns.Label as label.V1 (re-frozen 2026-10-02 B1-26: single Label reader).
	"label.full": func(t *testing.T, v any) {
		l := v.(nouns.Label)
		m := structJSON(t, l)
		conf, _ := m["confidence"].(map[string]any)
		prov, _ := m["provenance"].(map[string]any)
		hp, _ := prov["human_principal"].(map[string]any)
		if conf == nil || conf["rung"] != "E1" || conf["p"] != 0.0 || !l.Exportable || l.Permission != "informs" ||
			l.Retention.Hold != "obligation" || hp["role"] != "founder" {
			t.Errorf("label decoded as %+v", l)
		}
	},
	"label.min": func(t *testing.T, v any) {
		l := v.(nouns.Label)
		m := structJSON(t, l)
		prov, _ := m["provenance"].(map[string]any)
		if _, has := m["confidence"]; has || l.Exportable || prov == nil || prov["sources"] == nil {
			t.Errorf("label decoded as %+v", l)
		}
	},
	"event.full": func(t *testing.T, v any) {
		e := v.(nouns.Event)
		if e.Seq != 7 || e.Schema != 2 || e.CausationID == "" || e.Label.Taint != "untrusted" {
			t.Errorf("event decoded as %+v", e)
		}
	},
	"effect.full": func(t *testing.T, v any) {
		e := v.(nouns.Effect)
		if e.GatewayEpoch != 9007199254740995 || e.AuthorisingLabel.Permission != "may_authorise" || e.Attempt != 2 {
			t.Errorf("effect decoded as %+v", e)
		}
	},
	"operation.full": func(t *testing.T, v any) {
		o := v.(nouns.Operation)
		if o.BusinessKey != "refund:cust_812:inv_77" || o.Reservation != "res_5" || len(o.Amendments) != 1 {
			t.Errorf("operation decoded as %+v", o)
		}
	},
}

// TestDoneB102_RoundTrip: every valid fixture decodes, and both Encode and the standard library's
// json.Marshal of the decoded struct reproduce it exactly: no field dropped, none added as null,
// no bigint turned into a number or rounded through float64.
func TestDoneB102_RoundTrip(t *testing.T) {
	var f struct {
		Cases []validCase `json:"cases"`
	}
	load(t, "valid.json", &f)
	seen := map[string]int{}
	for _, c := range f.Cases {
		seen[c.Kind]++
		t.Run(c.Name, func(t *testing.T) {
			v, err := decode(c.Kind, c.Value)
			if err != nil {
				t.Fatalf("Decode refused a valid %s: %v", c.Kind, err)
			}
			out, err := encode(v)
			if err != nil {
				t.Fatalf("Encode: %v", err)
			}
			mustSameJSON(t, "Encode(Decode(fixture))", out, c.Value)
			std, err := json.Marshal(v)
			if err != nil {
				t.Fatalf("json.Marshal: %v", err)
			}
			mustSameJSON(t, "json.Marshal(Decode(fixture))", std, c.Value)
			if pin := pins[c.Name]; pin != nil {
				pin(t, v)
			}
		})
	}
	for _, k := range kinds {
		if seen[k] < 2 {
			t.Errorf("valid.json holds %d %s fixture(s); want a full and a minimal one", seen[k], k)
		}
	}
}

// TestDoneB102_RejectsMalformed: every malformed fixture is refused with the sentinel it names.
func TestDoneB102_RejectsMalformed(t *testing.T) {
	var f struct {
		Cases []invalidCase `json:"cases"`
	}
	load(t, "invalid.json", &f)
	sentinel := map[string]error{"invalid": nouns.ErrInvalid, "unknown_schema": nouns.ErrUnknownSchema}
	seen := map[string]int{}
	for _, c := range f.Cases {
		seen[c.Kind]++
		t.Run(c.Name, func(t *testing.T) {
			want := sentinel[c.Error]
			if want == nil {
				t.Fatalf("fixture names unknown error %q", c.Error)
			}
			v, err := decode(c.Kind, c.Value)
			switch {
			case err == nil:
				t.Errorf("accepted, but %s; decoded %+v", c.Why, v)
			case !errors.Is(err, want):
				t.Errorf("refused with %v; want an error wrapping %v (%s)", err, want, c.Why)
			}
		})
	}
	for _, k := range kinds {
		if seen[k] == 0 {
			t.Errorf("invalid.json holds no %s fixture", k)
		}
	}
}

// ---- the replay test -------------------------------------------------------------------------

type obj = map[string]any

func parse(data json.RawMessage) (obj, error) {
	d := json.NewDecoder(bytes.NewReader(data))
	d.UseNumber()
	var m obj
	if err := d.Decode(&m); err != nil {
		return nil, err
	}
	if m == nil {
		return nil, errors.New("data is not an object")
	}
	return m, nil
}

// str walks keys and requires a non-empty string at the end.
func str(m obj, keys ...string) (string, error) {
	var cur any = m
	for _, k := range keys {
		o, ok := cur.(obj)
		if !ok {
			return "", fmt.Errorf("%v: not an object at %q", keys, k)
		}
		cur = o[k]
	}
	s, ok := cur.(string)
	if !ok || s == "" {
		return "", fmt.Errorf("%v: missing or not a string", keys)
	}
	return s, nil
}

// reader builds a strict Reader: the operation id at opPath, the three outcome fields under ans
// (the data's top level when ans is empty).
func reader(opPath []string, ans string) nouns.Reader {
	return func(data json.RawMessage) (nouns.Outcome, error) {
		m, err := parse(data)
		if err != nil {
			return nouns.Outcome{}, err
		}
		at := func(k string) (string, error) {
			if ans == "" {
				return str(m, k)
			}
			return str(m, ans, k)
		}
		var o nouns.Outcome
		var errs [4]error
		o.OperationID, errs[0] = str(m, opPath...)
		o.Disposition, errs[1] = at("disposition")
		o.EffectClass, errs[2] = at("effect_class")
		o.Door, errs[3] = at("door")
		return o, errors.Join(errs[:]...)
	}
}

// Three layouts of decision.compiled: v1 is the canon §3 contract as written; v2 moves the answer
// under "answer"; v3 renames "action" to "proposed_action". Each reader refuses the other layouts.
var readers = map[int]nouns.Reader{
	1: reader([]string{"action", "operation_id"}, ""),
	2: reader([]string{"action", "operation_id"}, "answer"),
	3: reader([]string{"proposed_action", "operation_id"}, "answer"),
}

func upcaster(from int, edits ...func(m obj)) nouns.Upcaster {
	return nouns.Upcaster{Type: nouns.DecisionCompiled, From: from, Up: func(data json.RawMessage) (json.RawMessage, error) {
		m, err := parse(data)
		if err != nil {
			return nil, err
		}
		for _, e := range edits {
			e(m)
		}
		return json.Marshal(m)
	}}
}

// The benign upcasters: they change how a decision is stored, never what it says.
func moveAnswer(m obj) {
	ans := obj{}
	for _, k := range []string{"disposition", "effect_class", "door"} {
		if v, ok := m[k]; ok {
			ans[k] = v
			delete(m, k)
		}
	}
	m["answer"] = ans
}

func renameAction(m obj) {
	m["proposed_action"] = m["action"]
	delete(m, "action")
}

var up12, up23 = upcaster(1, moveAnswer), upcaster(2, renameAction)

// answerEdit applies f to the "answer" object a v2/v3 layout carries.
func answerEdit(f func(ans obj)) func(m obj) {
	return func(m obj) {
		if ans, ok := m["answer"].(obj); ok {
			f(ans)
		}
	}
}

func swap(field, from, to string) func(m obj) {
	return answerEdit(func(ans obj) {
		if ans[field] == from {
			ans[field] = to
		}
	})
}

func newReg(t *testing.T, schemas ...int) *nouns.Registry {
	t.Helper()
	r := nouns.NewRegistry()
	for _, s := range schemas {
		if err := r.AddReader(nouns.DecisionCompiled, s, readers[s]); err != nil {
			t.Fatalf("AddReader(%s, %d): %v", nouns.DecisionCompiled, s, err)
		}
	}
	return r
}

// loadHistory decodes the past decisions with the real Decode and returns them with the outcome
// written by hand next to each.
func loadHistory(t *testing.T) ([]nouns.Event, []nouns.Outcome) {
	t.Helper()
	var f struct {
		History []pastDecision `json:"history"`
	}
	load(t, "decisions.json", &f)
	var events []nouns.Event
	var want []nouns.Outcome
	dispositions := map[string]bool{}
	for i, h := range f.History {
		e, err := nouns.Decode[nouns.Event](h.Event)
		if err != nil {
			t.Fatalf("history[%d]: Decode: %v", i, err)
		}
		if e.Type != nouns.DecisionCompiled || e.Schema != 1 {
			t.Fatalf("history[%d] is %s schema %d; want %s schema 1", i, e.Type, e.Schema, nouns.DecisionCompiled)
		}
		events = append(events, e)
		want = append(want, h.Outcome)
		dispositions[h.Outcome.Disposition] = true
	}
	for _, d := range []string{"auto", "notify", "ask", "co_sign", "never"} {
		if !dispositions[d] {
			t.Fatalf("decisions.json has no past %q decision", d)
		}
	}
	return events, want
}

func copyEvent(e nouns.Event) nouns.Event {
	c := e
	c.Data = append(json.RawMessage(nil), e.Data...)
	c.Actor = append(json.RawMessage(nil), e.Actor...)
	c.Rationale = append(json.RawMessage(nil), e.Rationale...)
	if e.Rationale == nil {
		c.Rationale = nil
	}
	return c
}

// TestDoneB102_UpcastReplayKeepsDecision: past decisions written at schema 1 replay through two
// admitted upcasters to schema 3 and read exactly as they were decided. The upcast is a view: the
// envelope is untouched and the stored event is not modified.
func TestDoneB102_UpcastReplayKeepsDecision(t *testing.T) {
	history, want := loadHistory(t)
	r := newReg(t, 1, 2, 3)
	for i, e := range history {
		if got, err := r.Outcome(e); err != nil || got != want[i] {
			t.Fatalf("past decision %d as written reads %+v (err %v); decided %+v", i, got, err, want[i])
		}
	}
	if err := r.AddUpcaster(up12, history); err != nil {
		t.Fatalf("a meaning-preserving upcaster 1->2 was refused: %v", err)
	}
	if err := r.AddUpcaster(up23, history); err != nil {
		t.Fatalf("a meaning-preserving upcaster 2->3 was refused: %v", err)
	}
	for i, e := range history {
		before := copyEvent(e)
		up, err := r.Upcast(e)
		if err != nil {
			t.Fatalf("Upcast(history[%d]): %v", i, err)
		}
		if up.Schema != 3 {
			t.Errorf("history[%d] upcast to schema %d; want 3, the latest", i, up.Schema)
		}
		if m, err := parse(up.Data); err != nil || m["answer"] == nil || m["proposed_action"] == nil {
			t.Errorf("history[%d] data was not run through both upcasters: %s", i, up.Data)
		}
		a, b := up, e
		a.Schema, a.Data, b.Schema, b.Data = 0, nil, 0, nil
		if !reflect.DeepEqual(a, b) {
			t.Errorf("history[%d]: Upcast changed the envelope\n got: %+v\nwant: %+v", i, a, b)
		}
		if !reflect.DeepEqual(e, before) {
			t.Errorf("history[%d]: Upcast modified the stored event it was given", i)
		}
		if got, err := r.Outcome(up); err != nil || got != want[i] {
			t.Errorf("past decision %d replayed reads %+v (err %v); decided %+v", i, got, err, want[i])
		}
	}
}

// TestDoneB102_UpcasterCannotChangeMeaning: an upcaster that changes, or makes unreadable, what any
// one past decision said is refused, and a refused upcaster is not installed.
func TestDoneB102_UpcasterCannotChangeMeaning(t *testing.T) {
	history, want := loadHistory(t)

	// Positive control: the same registry shape admits the benign upcaster, so a registry that
	// refuses everything cannot pass this test.
	if err := newReg(t, 1, 2).AddUpcaster(up12, history); err != nil {
		t.Fatalf("a meaning-preserving upcaster was refused: %v", err)
	}

	tampered := []struct {
		name string
		u    nouns.Upcaster
	}{
		{"ask becomes auto", upcaster(1, moveAnswer, swap("disposition", "ask", "auto"))},
		{"never becomes notify, last past decision only", upcaster(1, moveAnswer, swap("disposition", "never", "notify"))},
		{"R4 lowered to R3", upcaster(1, moveAnswer, swap("effect_class", "R4", "R3"))},
		{"one_way door becomes costly_reversible", upcaster(1, moveAnswer, swap("door", "one_way", "costly_reversible"))},
		{"decision re-pointed at another operation", upcaster(1, moveAnswer, func(m obj) {
			if a, ok := m["action"].(obj); ok && a["operation_id"] == "op_b2" {
				a["operation_id"] = "op_zz"
			}
		})},
		{"co_sign decision made unreadable", upcaster(1, moveAnswer, answerEdit(func(ans obj) {
			if ans["disposition"] == "co_sign" {
				delete(ans, "disposition")
			}
		}))},
	}
	for _, tc := range tampered {
		t.Run(tc.name, func(t *testing.T) {
			r := newReg(t, 1, 2)
			if err := r.AddUpcaster(tc.u, history); !errors.Is(err, nouns.ErrMeaningChanged) {
				t.Errorf("AddUpcaster = %v; want an error wrapping ErrMeaningChanged", err)
			}
			for i, e := range history {
				up, err := r.Upcast(e)
				if err != nil {
					t.Fatalf("Upcast(history[%d]) after the refusal: %v", i, err)
				}
				if up.Schema != 1 {
					t.Errorf("history[%d] upcast to schema %d: the refused upcaster was installed", i, up.Schema)
				}
				if got, err := r.Outcome(up); err != nil || got != want[i] {
					t.Errorf("past decision %d reads %+v (err %v); decided %+v", i, got, err, want[i])
				}
			}
		})
	}

	// The check reaches past decisions written below u.From: a 2->3 tamper is checked against the
	// schema-1 history, upcast through the installed 1->2 first.
	t.Run("ask becomes auto at the second step", func(t *testing.T) {
		r := newReg(t, 1, 2, 3)
		if err := r.AddUpcaster(up12, history); err != nil {
			t.Fatalf("AddUpcaster(1->2): %v", err)
		}
		bad := upcaster(2, renameAction, swap("disposition", "ask", "auto"))
		if err := r.AddUpcaster(bad, history); !errors.Is(err, nouns.ErrMeaningChanged) {
			t.Errorf("AddUpcaster(2->3) = %v; want an error wrapping ErrMeaningChanged", err)
		}
	})
}

// TestDoneB102_UpcasterUncheckedIsRefused: an upcaster the replay check cannot run against is not
// admitted, and a reader that already reads a version cannot be replaced.
func TestDoneB102_UpcasterUncheckedIsRefused(t *testing.T) {
	history, want := loadHistory(t)
	cases := []struct {
		name    string
		readers []int
		history []nouns.Event
	}{
		{"no readers at all", nil, history},
		{"no reader at From+1", []int{1}, history},
		{"empty history", []int{1, 2}, nil},
	}
	others := make([]nouns.Event, len(history))
	for i, e := range history {
		others[i] = copyEvent(e)
		others[i].Type = "job.leased"
	}
	cases = append(cases, struct {
		name    string
		readers []int
		history []nouns.Event
	}{"history holds no event of the upcaster's type", []int{1, 2}, others})

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r := newReg(t, tc.readers...)
			if err := r.AddUpcaster(up12, tc.history); !errors.Is(err, nouns.ErrUnverifiable) {
				t.Errorf("AddUpcaster = %v; want an error wrapping ErrUnverifiable", err)
			}
			// Adding the readers afterwards must not activate the refused upcaster.
			for _, s := range []int{1, 2} {
				if err := r.AddReader(nouns.DecisionCompiled, s, readers[s]); err != nil && !errors.Is(err, nouns.ErrDuplicate) {
					t.Fatalf("AddReader(%d): %v", s, err)
				}
			}
			up, err := r.Upcast(history[0])
			if err != nil {
				t.Fatalf("Upcast: %v", err)
			}
			if up.Schema != 1 {
				t.Errorf("upcast to schema %d: the refused upcaster was installed", up.Schema)
			}
		})
	}

	t.Run("a reader cannot be replaced", func(t *testing.T) {
		r := newReg(t, 1)
		liar := func(data json.RawMessage) (nouns.Outcome, error) {
			o, err := readers[1](data)
			o.Disposition = "auto"
			return o, err
		}
		if err := r.AddReader(nouns.DecisionCompiled, 1, liar); !errors.Is(err, nouns.ErrDuplicate) {
			t.Errorf("AddReader over an existing version = %v; want an error wrapping ErrDuplicate", err)
		}
		for i, e := range history {
			if got, err := r.Outcome(e); err != nil || got != want[i] {
				t.Errorf("past decision %d reads %+v (err %v); decided %+v", i, got, err, want[i])
			}
		}
	})
}

// TestDoneB102_KernelReplaysPastDecisions: the registry the Kernel ships reads every past decision
// as decided, both as written and after replay through whatever upcasters it ships.
func TestDoneB102_KernelReplaysPastDecisions(t *testing.T) {
	history, want := loadHistory(t)
	r := nouns.Kernel()
	for i, e := range history {
		if got, err := r.Outcome(e); err != nil || got != want[i] {
			t.Errorf("past decision %d as written reads %+v (err %v); decided %+v", i, got, err, want[i])
		}
		up, err := r.Upcast(e)
		if err != nil {
			t.Errorf("Upcast(history[%d]): %v", i, err)
			continue
		}
		if got, err := r.Outcome(up); err != nil || got != want[i] {
			t.Errorf("past decision %d replayed to schema %d reads %+v (err %v); decided %+v", i, up.Schema, got, err, want[i])
		}
	}
}
