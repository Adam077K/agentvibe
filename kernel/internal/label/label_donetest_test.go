//go:build donetest

// B1-26 done-test (docs/vision-v3/14-BUILD-PLAN.md:315): "Classification, boundary, retention class,
// retention deadline, permission, taint and origin round-trip as distinct fields; human provenance is a
// provenance field; every 06 label name maps to one wire name (DR-68)". This file is the Go half. It and
// testdata/label/{valid,invalid,mapping,origin,join}.json are hash-registered in
// build/done-tests/B1-26.yml; editing any of them changes the job's acceptance, which is a register
// change, not a fix. Every fixture case carries a `cite` naming the canon line it enforces; the
// Userland (Zod) half reads the same bytes.
//
// Canon: 09a-ENGINEERING.md §12 (LabelV1 :592-609, Provenance/SourceRef/PrincipalRef :611-621, the
// mapping tables :624-662, Join :664-669); 06-MEMORY.md §4 (:146-187); the founder decisions in
// _process/DR-LABEL-RECONCILE-2026-10-01.md.
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/label/
package label_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"slices"
	"strings"
	"testing"

	"github.com/Adam077K/agentvibe/kernel/internal/label"
)

type validCase struct {
	Name  string          `json:"name"`
	Cite  string          `json:"cite"`
	Value json.RawMessage `json:"value"`
}

type invalidCase struct {
	Name  string          `json:"name"`
	Error string          `json:"error"`
	Why   string          `json:"why"`
	Cite  string          `json:"cite"`
	Value json.RawMessage `json:"value"`
}

type mappingRow struct {
	Field string         `json:"field"`
	Value any            `json:"value"`
	Wire  map[string]any `json:"wire"`
	Error string         `json:"error"`
	Cite  string         `json:"cite"`
}

type originCase struct {
	Name   string `json:"name"`
	Author struct {
		Kind    string `json:"kind"`
		Channel string `json:"channel"`
		Task    string `json:"task"`
	} `json:"author"`
	Origin string `json:"origin"`
	Cite   string `json:"cite"`
}

type joinCase struct {
	Name   string           `json:"name"`
	Cite   string           `json:"cite"`
	Own    label.Provenance `json:"own"`
	Inputs []struct {
		ID      string          `json:"id"`
		Label   json.RawMessage `json:"label"`
		Control bool            `json:"control"`
	} `json:"inputs"`
	Expect struct {
		IdentityExceptProvenance bool   `json:"identity_except_provenance"`
		Taint                    string `json:"taint"`
		TaintNot                 string `json:"taint_not"`
		ConfidenceRung           string `json:"confidence_rung"`
		Boundary                 string `json:"boundary"`
		PermissionAtMost         string `json:"permission_at_most"`
	} `json:"expect"`
}

func load(t *testing.T, name string, v any) {
	t.Helper()
	b, err := os.ReadFile(filepath.Join("testdata", "label", name))
	if err != nil {
		t.Fatalf("fixture: %v", err)
	}
	d := json.NewDecoder(bytes.NewReader(b))
	d.DisallowUnknownFields()
	if err := d.Decode(v); err != nil {
		t.Fatalf("fixture %s: %v", name, err)
	}
}

// canonical parses JSON keeping numbers as their literal text.
func canonical(b []byte) (any, error) {
	d := json.NewDecoder(bytes.NewReader(b))
	d.UseNumber()
	var v any
	if err := d.Decode(&v); err != nil {
		return nil, err
	}
	if _, err := d.Token(); err != io.EOF {
		return nil, fmt.Errorf("trailing data after JSON value")
	}
	return v, nil
}

// plain is v as encoding/json's generic form (float64 numbers), for comparing JSON-shaped values.
func plain(t *testing.T, v any) any {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal %v: %v", v, err)
	}
	var out any
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return out
}

// fieldsOf reads a decoded V1 field by field, never through Encode, so a Decode that drops, infers
// or rewrites a value fails even if Encode happens to restore the text.
func fieldsOf(v label.V1) map[string]any {
	ret := map[string]any{"class": v.Retention.Class, "hold": v.Retention.Hold}
	if v.Retention.Deadline != "" {
		ret["deadline"] = v.Retention.Deadline
	}
	sources := []any{}
	for _, s := range v.Provenance.Sources {
		m := map[string]any{"ref": s.Ref}
		for k, x := range map[string]string{"quote": s.Quote, "accessed": s.Accessed, "system_of_record": s.SystemOfRecord} {
			if x != "" {
				m[k] = x
			}
		}
		sources = append(sources, m)
	}
	derived := []any{}
	for _, d := range v.Provenance.DerivedFrom {
		derived = append(derived, d)
	}
	author := map[string]any{"title": v.Provenance.Author.Title, "family": v.Provenance.Author.Family}
	if v.Provenance.Author.Mission != "" {
		author["mission"] = v.Provenance.Author.Mission
	}
	prov := map[string]any{"sources": sources, "derived_from": derived, "author": author}
	if hp := v.Provenance.HumanPrincipal; hp != nil {
		prov["human_principal"] = map[string]any{"id": hp.ID, "role": hp.Role}
	}
	m := map[string]any{
		"schema": v.Schema, "origin": v.Origin, "dclass": v.DClass, "boundary": v.Boundary,
		"venture": v.Venture, "retention": ret, "permission": v.Permission, "exportable": v.Exportable,
		"taint": v.Taint, "provenance": prov, "revocation_epoch": float64(v.RevocationEpoch),
	}
	if v.ConsentScope != "" {
		m["consent_scope"] = v.ConsentScope
	}
	if c := v.Confidence; c != nil {
		cm := map[string]any{"rung": c.Rung}
		if c.P != nil {
			cm["p"] = *c.P
		}
		m["confidence"] = cm
	}
	if len(v.Subjects) > 0 {
		subj := []any{}
		for _, s := range v.Subjects {
			subj = append(subj, s)
		}
		m["subjects"] = subj
	}
	return m
}

func generic(t *testing.T, raw []byte) map[string]any {
	t.Helper()
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatalf("fixture value: %v", err)
	}
	return m
}

// B1-26 acceptance (14-BUILD-PLAN.md:315): the seven fields "round-trip as distinct fields". Every
// enum value of 09a:595-620 appears in valid.json; each case cites its line.
func TestB126LabelV1RoundTrip(t *testing.T) {
	var f struct {
		Cases []validCase `json:"cases"`
	}
	load(t, "valid.json", &f)
	if len(f.Cases) < 50 {
		t.Fatalf("valid.json holds %d cases; the register froze 60", len(f.Cases))
	}
	for _, c := range f.Cases {
		t.Run(c.Name, func(t *testing.T) {
			v, err := label.Decode(c.Value)
			if err != nil {
				t.Fatalf("Decode refused a valid label (%s): %v", c.Cite, err)
			}
			if got, want := fieldsOf(v), generic(t, c.Value); !reflect.DeepEqual(got, want) {
				t.Fatalf("decoded fields differ from the wire (%s)\n got  %v\n want %v", c.Cite, got, want)
			}
			out, err := label.Encode(v)
			if err != nil {
				t.Fatalf("Encode refused a decoded label: %v", err)
			}
			got, err := canonical(out)
			if err != nil {
				t.Fatalf("Encode wrote bad JSON: %v", err)
			}
			want, _ := canonical(c.Value)
			if !reflect.DeepEqual(got, want) {
				t.Fatalf("Encode(Decode(fixture)) differs (%s)\n got  %s\n want %s", c.Cite, out, c.Value)
			}
			again, err := label.Decode(out)
			if err != nil || !reflect.DeepEqual(fieldsOf(again), fieldsOf(v)) {
				t.Fatalf("Decode(Encode(v)) != v: err=%v", err)
			}
		})
	}
}

// 09a:588 "exactly this record", 09a:594 "readers refuse unknown versions", the closed enums of
// 09a:595-620, and the removed 06 names of 09a:644-662. Each case cites its line.
func TestB126LabelV1Refuses(t *testing.T) {
	var f struct {
		Cases []invalidCase `json:"cases"`
	}
	load(t, "invalid.json", &f)
	if len(f.Cases) < 70 {
		t.Fatalf("invalid.json holds %d cases; the register froze 80", len(f.Cases))
	}
	legacy := 0
	for _, c := range f.Cases {
		if strings.HasPrefix(c.Name, "label.legacy-") {
			legacy++
		}
		t.Run(c.Name, func(t *testing.T) {
			_, err := label.Decode(c.Value)
			want := label.ErrInvalid
			switch c.Error {
			case "unknown_schema":
				want = label.ErrUnknownSchema
			case "invalid":
			default:
				t.Fatalf("fixture names unknown error %q", c.Error)
			}
			if !errors.Is(err, want) {
				t.Fatalf("Decode = %v, want %v: %s (%s)", err, want, c.Why, c.Cite)
			}
		})
	}
	if legacy < 20 {
		t.Fatalf("invalid.json holds %d removed-06-name cases; the register froze 20", legacy)
	}
}

// Encode refuses what Decode refuses (09a:588, :594), with the same sentinel: a writer may not emit
// a label no reader accepts, nor a removed 06 name (09a:644).
func TestB126EncodeRefuses(t *testing.T) {
	base := func() label.V1 {
		return label.V1{
			Schema: "label/1", Origin: "internal", DClass: "D1", Boundary: "guarded", Venture: "v_keel",
			Retention: label.Retention{Class: "operational", Hold: "none"}, Permission: "informs", Taint: "clean",
			Provenance: label.Provenance{Sources: []label.SourceRef{}, DerivedFrom: []string{},
				Author: label.Author{Title: "Kernel Engineer", Family: "claude"}},
		}
	}
	if _, err := label.Encode(base()); err != nil {
		t.Fatalf("Encode refused a valid label: %v", err)
	}
	cases := []struct {
		name string
		mut  func(*label.V1)
		want error
		cite string
	}{
		{"schema-label2", func(v *label.V1) { v.Schema = "label/2" }, label.ErrUnknownSchema, "09a:594"},
		{"origin-worker", func(v *label.V1) { v.Origin = "worker" }, label.ErrInvalid, "09a:652"},
		{"origin-collaborator", func(v *label.V1) { v.Origin = "collaborator" }, label.ErrInvalid, "09a:653"},
		{"dclass-sealed", func(v *label.V1) { v.DClass = "sealed" }, label.ErrInvalid, "09a:632"},
		{"permission-data_only", func(v *label.V1) { v.Permission = "data_only" }, label.ErrInvalid, "09a:656"},
		{"hold-ordinary", func(v *label.V1) { v.Retention.Hold = "ordinary" }, label.ErrInvalid, "09a:639"},
		{"role-participant", func(v *label.V1) {
			v.Provenance.HumanPrincipal = &label.PrincipalRef{ID: "person_x", Role: "participant"}
		}, label.ErrInvalid, "09a:620"},
		{"rung-E6", func(v *label.V1) { v.Confidence = &label.Confidence{Rung: "E6"} }, label.ErrInvalid, "09a:607"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			v := base()
			c.mut(&v)
			if _, err := label.Encode(v); !errors.Is(err, c.want) {
				t.Fatalf("Encode = %v, want %v (%s)", err, c.want, c.cite)
			}
		})
	}
}

// setPath writes value at a dotted LabelV1 path in a generic label.
func setPath(m map[string]any, path string, value any) {
	ks := strings.Split(path, ".")
	cur := m
	for _, k := range ks[:len(ks)-1] {
		cur = cur[k].(map[string]any)
	}
	cur[ks[len(ks)-1]] = value
}

const minLabel = `{"schema":"label/1","origin":"internal","dclass":"D1","boundary":"guarded","venture":"v_keel",` +
	`"retention":{"class":"operational","hold":"none"},"permission":"informs","exportable":false,"taint":"clean",` +
	`"provenance":{"sources":[],"derived_from":[],"author":{"title":"Kernel Engineer","family":"claude"}},"revocation_epoch":0}`

// B1-26 acceptance: "every 06 label name maps to one wire name" — every row of 09a:628-662 as a table
// test (testdata/label/mapping.json, one fixture row per 06 name, each citing its table line).
func TestB126MappingTable(t *testing.T) {
	var f struct {
		Rows []mappingRow `json:"rows"`
	}
	load(t, "mapping.json", &f)
	if len(f.Rows) < 50 {
		t.Fatalf("mapping.json holds %d rows; the register froze 52", len(f.Rows))
	}
	for _, r := range f.Rows {
		v, _ := json.Marshal(r.Value)
		t.Run(fmt.Sprintf("%s=%s", r.Field, v), func(t *testing.T) {
			got, err := label.MapLegacy(r.Field, r.Value)
			if r.Error != "" {
				want := map[string]error{"not_an_origin": label.ErrNotAnOrigin, "unknown_name": label.ErrUnknownName}[r.Error]
				if want == nil {
					t.Fatalf("fixture names unknown error %q", r.Error)
				}
				if !errors.Is(err, want) {
					t.Fatalf("MapLegacy = %v, %v; want %v (%s)", got, err, want, r.Cite)
				}
				return
			}
			if err != nil {
				t.Fatalf("MapLegacy refused a mapped 06 name (%s): %v", r.Cite, err)
			}
			if !reflect.DeepEqual(plain(t, got), plain(t, r.Wire)) {
				t.Fatalf("MapLegacy(%s, %s) = %v, want exactly %v (%s)", r.Field, v, plain(t, got), r.Wire, r.Cite)
			}
			// One wire name, deterministically.
			if again, _ := label.MapLegacy(r.Field, r.Value); !reflect.DeepEqual(plain(t, again), plain(t, got)) {
				t.Fatalf("MapLegacy is not deterministic: %v then %v", got, again)
			}
			// The wire values are LabelV1 values: written onto a valid label, it still decodes.
			m := generic(t, []byte(minLabel))
			for p, x := range plain(t, got).(map[string]any) {
				setPath(m, p, x)
			}
			b, _ := json.Marshal(m)
			if _, err := label.Decode(b); err != nil {
				t.Fatalf("the mapped wire values do not form a LabelV1: %v (%s)", err, b)
			}
		})
	}
}

// 09a:634, the "a person's contribution, on any channel" row: origin follows the author, with the
// founder decisions of DR-LABEL-RECONCILE (1, 3, A, B, C, E, H, I).
func TestB126OriginByAuthor(t *testing.T) {
	var f struct {
		Cases []originCase `json:"cases"`
	}
	load(t, "origin.json", &f)
	if len(f.Cases) < 25 {
		t.Fatalf("origin.json holds %d cases; the register froze 28", len(f.Cases))
	}
	for _, c := range f.Cases {
		t.Run(c.Name, func(t *testing.T) {
			got, err := label.OriginFor(label.Contributor{Kind: c.Author.Kind, Channel: c.Author.Channel, Task: c.Author.Task})
			if err != nil || got != c.Origin {
				t.Fatalf("OriginFor(%+v) = %q, %v; want %q (%s)", c.Author, got, err, c.Origin, c.Cite)
			}
		})
	}
}

var permRank = map[string]int{"none": 0, "informs": 1, "may_authorise": 2}

// 09a:664-669 (Join), 06:180 (L1), 06:187 (L8), 09a:602; founder decision F (DR-LABEL-RECONCILE:99).
func TestB126Join(t *testing.T) {
	var f struct {
		Cases []joinCase `json:"cases"`
	}
	load(t, "join.json", &f)
	if len(f.Cases) < 12 {
		t.Fatalf("join.json holds %d cases; the register froze 13", len(f.Cases))
	}
	for _, c := range f.Cases {
		t.Run(c.Name, func(t *testing.T) {
			var inputs []label.Input
			var inputSources []label.SourceRef
			for _, in := range c.Inputs {
				l, err := label.Decode(in.Label)
				if err != nil {
					t.Fatalf("fixture input %s: %v", in.ID, err)
				}
				inputs = append(inputs, label.Input{ID: in.ID, Label: l, Control: in.Control})
				inputSources = append(inputSources, l.Provenance.Sources...)
			}
			out, err := label.Join(c.Own, inputs)
			if err != nil {
				t.Fatalf("Join: %v (%s)", err, c.Cite)
			}
			if _, err := label.Encode(out); err != nil {
				t.Fatalf("the join is not a valid LabelV1: %v", err)
			}
			// Provenance is not joined (09a:667-669): the output's own author, human principal and
			// sources; every input and every own derived_from id reachable through derived_from.
			p := out.Provenance
			if p.Author != c.Own.Author {
				t.Fatalf("author %+v, want the output's own %+v (09a:667)", p.Author, c.Own.Author)
			}
			if !reflect.DeepEqual(p.HumanPrincipal, c.Own.HumanPrincipal) {
				t.Fatalf("human_principal %+v, want the output's own %+v (09a:667-668)", p.HumanPrincipal, c.Own.HumanPrincipal)
			}
			if len(p.Sources) != len(c.Own.Sources) || (len(p.Sources) > 0 && !reflect.DeepEqual(p.Sources, c.Own.Sources)) {
				t.Fatalf("sources %+v, want the output's own %+v (provenance is not joined, 09a:667)", p.Sources, c.Own.Sources)
			}
			for _, s := range inputSources {
				if slices.Contains(p.Sources, s) && !slices.Contains(c.Own.Sources, s) {
					t.Fatalf("an input's source %+v was merged into the output (09a:667)", s)
				}
			}
			for _, in := range c.Inputs {
				if !slices.Contains(p.DerivedFrom, in.ID) {
					t.Fatalf("input %s not reachable through derived_from %v (09a:668)", in.ID, p.DerivedFrom)
				}
			}
			for _, id := range c.Own.DerivedFrom {
				if !slices.Contains(p.DerivedFrom, id) {
					t.Fatalf("own derived_from %s dropped: %v", id, p.DerivedFrom)
				}
			}
			e := c.Expect
			if e.IdentityExceptProvenance {
				got, want := fieldsOf(out), fieldsOf(inputs[0].Label)
				delete(got, "provenance")
				delete(want, "provenance")
				if !reflect.DeepEqual(got, want) {
					t.Fatalf("the join of one input is not its label (%s)\n got  %v\n want %v", c.Cite, got, want)
				}
			}
			if e.Taint != "" && out.Taint != e.Taint {
				t.Fatalf("taint %q, want %q (%s)", out.Taint, e.Taint, c.Cite)
			}
			if e.TaintNot != "" && out.Taint == e.TaintNot {
				t.Fatalf("taint %q, must not be %q (%s)", out.Taint, e.TaintNot, c.Cite)
			}
			if e.ConfidenceRung != "" && (out.Confidence == nil || out.Confidence.Rung != e.ConfidenceRung) {
				t.Fatalf("confidence %+v, want rung %s (%s)", out.Confidence, e.ConfidenceRung, c.Cite)
			}
			if e.Boundary != "" && out.Boundary != e.Boundary {
				t.Fatalf("boundary %q, want %q (%s)", out.Boundary, e.Boundary, c.Cite)
			}
			if e.PermissionAtMost != "" {
				r, ok := permRank[out.Permission]
				if !ok || r > permRank[e.PermissionAtMost] {
					t.Fatalf("permission %q widens past %q (%s)", out.Permission, e.PermissionAtMost, c.Cite)
				}
			}
		})
	}
}

// 09a:598 "venture: VentureId | 'portfolio' | 'founder'" (founder, 2026-10-01; DR-LABEL-RECONCILE:107,
// decision G): 'founder' is a venture value on the wire, kept through decode, encode and a join.
func TestB126VentureFounder(t *testing.T) {
	m := generic(t, []byte(minLabel))
	m["venture"] = "founder"
	b, _ := json.Marshal(m)
	v, err := label.Decode(b)
	if err != nil || v.Venture != "founder" {
		t.Fatalf("Decode venture founder = %q, %v (09a:598)", v.Venture, err)
	}
	out, err := label.Encode(v)
	if err != nil || !strings.Contains(string(out), `"venture":"founder"`) {
		t.Fatalf("Encode venture founder = %s, %v (09a:598)", out, err)
	}
	j, err := label.Join(v.Provenance, []label.Input{{ID: "rec_founder_note", Label: v}})
	if err != nil || j.Venture != "founder" {
		t.Fatalf("Join over founder memory = venture %q, %v (09a:598; 06:180)", j.Venture, err)
	}
}
