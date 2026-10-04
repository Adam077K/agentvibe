//go:build donetest

// B1-26 done-test, round 2 (re-freeze r2 after the implementation review of build/b1-26 @ 4a5094e,
// 2026-10-02). Go half; userland/test/label.r2.donetest.test.ts runs the SAME vectors from
// testdata/label/r2_{deadlines,wire_text,order}.json, so the two languages cannot pick different
// answers. Hash-registered in build/done-tests/B1-26.yml.
//
//   - Deadlines: one strict grammar orders a join's retention.deadline; anything else is ErrUndecided.
//   - Wire text: non-canonical integers, duplicate keys at any depth and case-variant keys are refused.
//   - Order: the encoded join is byte-identical over every order of its inputs, so neither p nor
//     derived_from may depend on which input came first.
//
// Run: go -C kernel test -tags donetest -count=1 -run R2 ./internal/label/
package label_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"github.com/Adam077K/agentvibe/kernel/internal/label"
	"github.com/Adam077K/agentvibe/kernel/internal/nouns"
)

func r2Label(t *testing.T, deadline *string) label.V1 {
	t.Helper()
	m := generic(t, []byte(minLabel))
	if deadline != nil {
		m["retention"].(map[string]any)["deadline"] = *deadline
	}
	b, _ := json.Marshal(m)
	v, err := label.Decode(b)
	if err != nil {
		t.Fatalf("decode base label with deadline %v: %v", deadline, err)
	}
	return v
}

// The deadline grammar (orchestrator ruling 2026-10-02, impl review r2; each vector cites it): RFC 3339
// with 'T', and 'Z' or ±hh:mm, uppercase, a valid calendar date, hour and offset hour < 24.
func TestB126R2DeadlineGrammar(t *testing.T) {
	var f struct {
		Cases []struct {
			Name      string    `json:"name"`
			Deadlines []*string `json:"deadlines"`
			Want      string    `json:"want"`
			Cite      string    `json:"cite"`
		} `json:"cases"`
	}
	load(t, "r2_deadlines.json", &f)
	if len(f.Cases) < 31 {
		t.Fatalf("r2_deadlines.json holds %d cases; the register froze 31", len(f.Cases))
	}
	for _, c := range f.Cases {
		var inputs []label.Input
		for i, d := range c.Deadlines {
			inputs = append(inputs, label.Input{ID: "rec_" + string(rune('a'+i)), Label: r2Label(t, d)})
		}
		for _, perm := range permutations(len(inputs)) {
			var in []label.Input
			for _, i := range perm {
				in = append(in, inputs[i])
			}
			t.Run(c.Name+"/"+in[0].ID, func(t *testing.T) {
				own := in[0].Label.Provenance
				out, err := label.Join(own, in)
				if c.Want == "undecided" {
					if !errors.Is(err, label.ErrUndecided) || errors.Is(err, label.ErrInvalid) {
						t.Fatalf("Join = deadline %q, %v; want ErrUndecided alone (%s)", out.Retention.Deadline, err, c.Cite)
					}
					return
				}
				if err != nil || out.Retention.Deadline != c.Want {
					t.Fatalf("Join = deadline %q, %v; want %q (%s)", out.Retention.Deadline, err, c.Want, c.Cite)
				}
			})
		}
	}
}

// One canonical encoding per value and one occurrence per key, at every depth, in both languages.
func TestB126R2WireText(t *testing.T) {
	var f struct {
		Cases []struct {
			Name string `json:"name"`
			Want string `json:"want"`
			Text string `json:"text"`
			Cite string `json:"cite"`
		} `json:"cases"`
	}
	load(t, "r2_wire_text.json", &f)
	if len(f.Cases) < 17 {
		t.Fatalf("r2_wire_text.json holds %d cases; the register froze 17", len(f.Cases))
	}
	for _, c := range f.Cases {
		t.Run(c.Name, func(t *testing.T) {
			_, err := label.Decode([]byte(c.Text))
			_, nerr := nouns.Decode[nouns.Label]([]byte(c.Text))
			switch c.Want {
			case "valid":
				if err != nil || nerr != nil {
					t.Fatalf("refused a valid label: %v / %v", err, nerr)
				}
			case "invalid":
				wantOnly(t, err, label.ErrInvalid, label.ErrUnknownSchema, c.Cite)
				if !errors.Is(nerr, nouns.ErrInvalid) {
					t.Fatalf("nouns.Decode[Label] = %v; want ErrInvalid (one reader; %s)", nerr, c.Cite)
				}
			default:
				t.Fatalf("fixture names unknown want %q", c.Want)
			}
		})
	}
}

// The join is a function of the SET of inputs (09a:665; 06:180 L1), so its encoding is byte-identical
// over every order: neither confidence.p nor derived_from (nor subjects) may follow input order.
func TestB126R2JoinIsOrderFree(t *testing.T) {
	var f struct {
		Cases []joinCase `json:"cases"`
	}
	load(t, "r2_order.json", &f)
	if len(f.Cases) < 3 {
		t.Fatalf("r2_order.json holds %d cases; the register froze 3", len(f.Cases))
	}
	for _, c := range f.Cases {
		t.Run(c.Name, func(t *testing.T) {
			var decoded []label.Input
			pset := map[float64]bool{}
			for _, in := range c.Inputs {
				l, err := label.Decode(in.Label)
				if err != nil {
					t.Fatalf("fixture input %s: %v", in.ID, err)
				}
				if l.Confidence != nil && l.Confidence.P != nil {
					pset[*l.Confidence.P] = true
				}
				decoded = append(decoded, label.Input{ID: in.ID, Label: l, Control: in.Control})
			}
			var first []byte
			var firstOrder string
			for _, perm := range permutations(len(decoded)) {
				var in []label.Input
				var order []string
				for _, i := range perm {
					in = append(in, decoded[i])
					order = append(order, decoded[i].ID)
				}
				out, err := label.Join(c.Own, in)
				if err != nil {
					t.Fatalf("Join(%v): %v (%s)", order, err, c.Cite)
				}
				if out.Confidence != nil && out.Confidence.P != nil && !pset[*out.Confidence.P] {
					t.Fatalf("Join(%v) confidence.p %v is no input's p (%s)", order, *out.Confidence.P, c.Cite)
				}
				b, err := label.Encode(out)
				if err != nil {
					t.Fatalf("Encode(Join(%v)): %v", order, err)
				}
				if first == nil {
					first, firstOrder = b, strings.Join(order, ",")
					continue
				}
				if !bytes.Equal(b, first) {
					t.Fatalf("the join depends on input order (%s)\n %s: %s\n %s: %s", c.Cite, firstOrder, first, strings.Join(order, ","), b)
				}
			}
		})
	}
}
