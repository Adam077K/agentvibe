//go:build donetest

// B1-26 done-test, round 3 (re-freeze r3 after the re-review of build/b1-26 @ 9096164, 2026-10-02).
// Go half; userland/test/label.r3.donetest.test.ts runs the SAME vectors from
// testdata/label/r3_{deadlines,wire_text,order}.json. Hash-registered in build/done-tests/B1-26.yml.
//
//   - Lone surrogates, escaped or raw, anywhere (values and keys), are refused in both languages.
//   - confidence.p is a canonical number in range; -0 is refused on read; the join stays order-free.
//   - Decode/Encode symmetry: whatever Decode accepts, Encode writes back with the same values and the
//     same number spellings.
//   - Deadline vectors that kill the surviving r2 mutants: tie-break, leap second, 1900 vs 2000, fraction
//     trailing zeros, the floored era at year 0, month 00.
//
// Run: go -C kernel test -tags donetest -count=1 -run R3 ./internal/label/
package label_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/Adam077K/agentvibe/kernel/internal/label"
	"github.com/Adam077K/agentvibe/kernel/internal/nouns"
)

type r3Text struct {
	Name string `json:"name"`
	Want string `json:"want"`
	Raw  bool   `json:"raw"`
	Text string `json:"text"`
	Cite string `json:"cite"`
}

var surrogateEscape = regexp.MustCompile(`\\u([dD][89abAB][0-9a-fA-F]{2})(?:\\u([dD][c-fC-F][0-9a-fA-F]{2}))?|\\u([dD][c-fC-F][0-9a-fA-F]{2})`)

// rawify replaces each surrogate escape with the raw character: a valid pair as UTF-8, a lone
// surrogate as its 3-byte WTF-8 form (what a Go []byte holding one looks like).
func rawify(text string) []byte {
	cu := func(h string) rune { v, _ := strconv.ParseUint(h, 16, 16); return rune(v) }
	wtf8 := func(r rune) string {
		return string([]byte{byte(0xE0 | r>>12), byte(0x80 | (r>>6)&0x3F), byte(0x80 | r&0x3F)})
	}
	return []byte(surrogateEscape.ReplaceAllStringFunc(text, func(m string) string {
		s := surrogateEscape.FindStringSubmatch(m)
		switch {
		case s[3] != "":
			return wtf8(cu(s[3]))
		case s[2] != "":
			return string(utf8.AppendRune(nil, 0x10000+(cu(s[1])-0xD800)<<10+(cu(s[2])-0xDC00)))
		}
		return wtf8(cu(s[1]))
	}))
}

func (c r3Text) bytes() []byte {
	if c.Raw {
		return rawify(c.Text)
	}
	return []byte(c.Text)
}

func r3Deadlines(t *testing.T, file string, min int) {
	var f struct {
		Cases []struct {
			Name      string    `json:"name"`
			Deadlines []*string `json:"deadlines"`
			Want      string    `json:"want"`
			Cite      string    `json:"cite"`
		} `json:"cases"`
	}
	load(t, file, &f)
	if len(f.Cases) < min {
		t.Fatalf("%s holds %d cases; the register froze %d", file, len(f.Cases), min)
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
				out, err := label.Join(in[0].Label.Provenance, in)
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

func TestB126R3Deadlines(t *testing.T) { r3Deadlines(t, "r3_deadlines.json", 10) }

func loadR3Text(t *testing.T, file string, min int) []r3Text {
	var f struct {
		Cases []r3Text `json:"cases"`
	}
	load(t, file, &f)
	if len(f.Cases) < min {
		t.Fatalf("%s holds %d cases; the register froze %d", file, len(f.Cases), min)
	}
	return f.Cases
}

// Lone surrogates and non-canonical p, refused by label.Decode and by nouns.Decode[Label] alike.
func TestB126R3WireText(t *testing.T) {
	for _, c := range loadR3Text(t, "r3_wire_text.json", 37) {
		t.Run(c.Name, func(t *testing.T) {
			b := c.bytes()
			_, err := label.Decode(b)
			_, nerr := nouns.Decode[nouns.Label](b)
			switch c.Want {
			case "valid":
				if err != nil || nerr != nil {
					t.Fatalf("refused a valid label: %v / %v (%s)", err, nerr, c.Cite)
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

// Decode/Encode symmetry over every valid text the suite holds: Encode(Decode(b)) carries the same
// values, and every number in the same spelling, as b (canonical keeps number literals as text).
func TestB126R3DecodeEncodeSymmetry(t *testing.T) {
	var texts []r3Text
	for _, file := range []string{"r3_wire_text.json", "r2_wire_text.json"} {
		var f struct {
			Cases []r3Text `json:"cases"`
		}
		load(t, file, &f)
		for _, c := range f.Cases {
			if c.Want == "valid" {
				texts = append(texts, c)
			}
		}
	}
	var valid struct {
		Cases []validCase `json:"cases"`
	}
	load(t, "valid.json", &valid)
	for _, c := range valid.Cases {
		var buf bytes.Buffer
		json.Compact(&buf, c.Value)
		texts = append(texts, r3Text{Name: "valid.json/" + c.Name, Text: buf.String(), Cite: c.Cite})
	}
	if len(texts) < 70 {
		t.Fatalf("only %d valid texts gathered", len(texts))
	}
	for _, c := range texts {
		t.Run(c.Name, func(t *testing.T) {
			b := c.bytes()
			v, err := label.Decode(b)
			if err != nil {
				t.Fatalf("Decode refused a valid text: %v", err)
			}
			out, err := label.Encode(v)
			if err != nil {
				t.Fatalf("Decode accepted what Encode refuses: %v (%s)", err, b)
			}
			in, _ := canonical(b)
			got, _ := canonical(out)
			if !reflect.DeepEqual(in, got) {
				t.Fatalf("Encode(Decode(b)) differs from b\n b   %s\n out %s", b, out)
			}
			nout, err := nouns.Encode(v)
			if err != nil || !bytes.Equal(nout, out) {
				t.Fatalf("nouns.Encode disagrees: %s, %v", nout, err)
			}
		})
	}
}

// The join over p of zero is byte-identical in every input order (no -0 can arise from a read).
func TestB126R3JoinIsOrderFree(t *testing.T) {
	var f struct {
		Cases []joinCase `json:"cases"`
	}
	load(t, "r3_order.json", &f)
	if len(f.Cases) < 1 {
		t.Fatal("r3_order.json holds no case")
	}
	for _, c := range f.Cases {
		t.Run(c.Name, func(t *testing.T) {
			var decoded []label.Input
			for _, in := range c.Inputs {
				l, err := label.Decode(in.Label)
				if err != nil {
					t.Fatalf("fixture input %s: %v", in.ID, err)
				}
				decoded = append(decoded, label.Input{ID: in.ID, Label: l, Control: in.Control})
			}
			var first []byte
			for _, perm := range permutations(len(decoded)) {
				var in []label.Input
				var order []string
				for _, i := range perm {
					in = append(in, decoded[i])
					order = append(order, decoded[i].ID)
				}
				out, err := label.Join(c.Own, in)
				if err != nil {
					t.Fatalf("Join(%v): %v", order, err)
				}
				b, err := label.Encode(out)
				if err != nil {
					t.Fatalf("Encode: %v", err)
				}
				if strings.Contains(string(b), `"p":-0`) {
					t.Fatalf("the join wrote p -0 (%s): %s", c.Cite, b)
				}
				if first == nil {
					first = b
				} else if !bytes.Equal(first, b) {
					t.Fatalf("the join depends on input order %v (%s)\n %s\n %s", order, c.Cite, first, b)
				}
			}
		})
	}
}
