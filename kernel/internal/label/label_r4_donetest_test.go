//go:build donetest

// B1-26 done-test, round 4 (re-freeze r4 after the re-review of build/b1-26 @ 8daed9d, 2026-10-02).
// Go half; userland/test/label.r4.donetest.test.ts runs the SAME vectors from
// testdata/label/r4_{line_separators,wire_text}.json. Hash-registered in build/done-tests/B1-26.yml.
//
//   - U+2028 and U+2029 are written as the raw UTF-8 character in both languages, so a canonical text
//     re-encodes byte for byte, and an escaped one re-encodes as the raw character.
//   - A high surrogate escape is a pair only with DC00-DFFF after it (the pair's upper bound).
//
// Run: go -C kernel test -tags donetest -count=1 -run R4 ./internal/label/
package label_test

import (
	"bytes"
	"testing"

	"github.com/Adam077K/agentvibe/kernel/internal/label"
	"github.com/Adam077K/agentvibe/kernel/internal/nouns"
)

func TestB126R4LineSeparatorsByteIdentical(t *testing.T) {
	var f struct {
		Cases []struct {
			Name string `json:"name"`
			In   string `json:"in"`
			Out  string `json:"out"`
			Cite string `json:"cite"`
		} `json:"cases"`
	}
	load(t, "r4_line_separators.json", &f)
	if len(f.Cases) < 7 {
		t.Fatalf("r4_line_separators.json holds %d cases; the register froze 7", len(f.Cases))
	}
	for _, c := range f.Cases {
		t.Run(c.Name, func(t *testing.T) {
			v, err := label.Decode([]byte(c.In))
			if err != nil {
				t.Fatalf("Decode refused: %v", err)
			}
			out, err := label.Encode(v)
			if err != nil || !bytes.Equal(out, []byte(c.Out)) {
				t.Fatalf("Encode(Decode(in)) is not the canonical bytes (%s)\n got  %q\n want %q", c.Cite, out, c.Out)
			}
			n, err := nouns.Decode[nouns.Label]([]byte(c.In))
			if err != nil {
				t.Fatalf("nouns.Decode refused: %v", err)
			}
			if nout, err := nouns.Encode(n); err != nil || !bytes.Equal(nout, []byte(c.Out)) {
				t.Fatalf("nouns.Encode is not the canonical bytes: %q, %v", nout, err)
			}
		})
	}
}

func TestB126R4WireText(t *testing.T) {
	for _, c := range loadR3Text(t, "r4_wire_text.json", 8) {
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
				if nerr == nil {
					t.Fatalf("nouns.Decode[Label] accepted it (one reader; %s)", c.Cite)
				}
			default:
				t.Fatalf("fixture names unknown want %q", c.Want)
			}
		})
	}
}
