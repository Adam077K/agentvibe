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
// mapping tables :624-663, Join :665-670); 06-MEMORY.md §4 (:146-187); the founder decisions in
// _process/DR-LABEL-RECONCILE-2026-10-01.md (rounds 1-5). One reader: nouns.Label IS label.V1
// (DR-LABEL-RECONCILE:61, "no label/1 reader has shipped yet. B1-26 is that reader").
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
	"github.com/Adam077K/agentvibe/kernel/internal/nouns"
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

type joinInput struct {
	ID      string          `json:"id"`
	Label   json.RawMessage `json:"label"`
	Control bool            `json:"control"`
}

type joinCase struct {
	Name   string           `json:"name"`
	Cite   string           `json:"cite"`
	Own    label.Provenance `json:"own"`
	Inputs []joinInput      `json:"inputs"`
	Expect struct {
		IdentityExceptProvenance bool     `json:"identity_except_provenance"`
		Taint                    string   `json:"taint"`
		TaintNot                 string   `json:"taint_not"`
		ConfidenceRung           string   `json:"confidence_rung"`
		Boundary                 string   `json:"boundary"`
		PermissionAtMost         string   `json:"permission_at_most"`
		DClass                   string   `json:"dclass"`
		Exportable               *bool    `json:"exportable"`
		RetentionClass           string   `json:"retention_class"`
		RetentionHold            string   `json:"retention_hold"`
		RetentionDeadline        string   `json:"retention_deadline"`
		ConsentScope             string   `json:"consent_scope"`
		Origin                   string   `json:"origin"`
		Subjects                 []string `json:"subjects"`
		RevocationEpoch          *uint64  `json:"revocation_epoch"`
		Error                    string   `json:"error"`
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

// wantOnly asserts err wraps want and NOT other: an implementation that wraps both sentinels on
// every refusal would otherwise pass both kinds of case.
func wantOnly(t *testing.T, err, want, other error, ctx string) {
	t.Helper()
	if !errors.Is(err, want) || errors.Is(err, other) {
		t.Fatalf("error = %v; want %v and not %v (%s)", err, want, other, ctx)
	}
}

// B1-26 acceptance (14-BUILD-PLAN.md:315): the seven fields "round-trip as distinct fields". Every
// enum value of 09a:595-620 appears in valid.json; each case cites its line.
func TestB126LabelV1RoundTrip(t *testing.T) {
	var f struct {
		Cases []validCase `json:"cases"`
	}
	load(t, "valid.json", &f)
	if len(f.Cases) < 60 {
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

func refusalSentinels(t *testing.T, kind string) (want, other error) {
	t.Helper()
	switch kind {
	case "unknown_schema":
		return label.ErrUnknownSchema, label.ErrInvalid
	case "invalid":
		return label.ErrInvalid, label.ErrUnknownSchema
	}
	t.Fatalf("fixture names unknown error %q", kind)
	return nil, nil
}

// 09a:588 "exactly this record", 09a:594 "readers refuse unknown versions", the closed enums of
// 09a:595-620, the removed 06 names of 09a:644-663, and the null/empty/integer wire rules of the one
// reader. Each case cites its line; each refusal names exactly one sentinel.
func TestB126LabelV1Refuses(t *testing.T) {
	var f struct {
		Cases []invalidCase `json:"cases"`
	}
	load(t, "invalid.json", &f)
	if len(f.Cases) < 97 {
		t.Fatalf("invalid.json holds %d cases; the register froze 97", len(f.Cases))
	}
	legacy := 0
	for _, c := range f.Cases {
		if strings.HasPrefix(c.Name, "label.legacy-") {
			legacy++
		}
		t.Run(c.Name, func(t *testing.T) {
			want, other := refusalSentinels(t, c.Error)
			_, err := label.Decode(c.Value)
			wantOnly(t, err, want, other, c.Why+"; "+c.Cite)
		})
	}
	if legacy < 20 {
		t.Fatalf("invalid.json holds %d removed-06-name cases; the register froze 20", legacy)
	}
}

const minLabel = `{"schema":"label/1","origin":"internal","dclass":"D1","boundary":"guarded","venture":"v_keel",` +
	`"retention":{"class":"operational","hold":"none"},"permission":"informs","exportable":false,"taint":"clean",` +
	`"provenance":{"sources":[{"ref":"crm:acct_77"}],"derived_from":[],"author":{"title":"Kernel Engineer","family":"claude"}},"revocation_epoch":0}`

// A duplicate key, at any depth, is refused rather than resolved: encoding/json keeps the last, so a
// second spelling could overrule the first while every reader saw one (09a:588 "exactly this
// record"; B1-02 9d519cb). Userland cannot see a duplicate after JSON.parse, so this half is Go's: the
// Kernel is the writer, and refusing here keeps a duplicated label out of the Journal.
func TestB126RefusesDuplicateKeys(t *testing.T) {
	if _, err := label.Decode([]byte(minLabel)); err != nil {
		t.Fatalf("control: the unedited label is refused: %v", err)
	}
	for _, c := range []struct{ name, old, repl string }{
		{"taint twice", `"taint":"clean"`, `"taint":"clean","taint":"untrusted"`},
		{"permission twice, wider last", `"permission":"informs"`, `"permission":"informs","permission":"may_authorise"`},
		{"origin twice", `"origin":"internal"`, `"origin":"internal","origin":"founder"`},
		{"hold twice inside retention", `"hold":"none"`, `"hold":"none","hold":"legal"`},
		{"family twice inside author", `"family":"claude"`, `"family":"claude","family":"founder"`},
		{"ref twice inside a source", `{"ref":"crm:acct_77"}`, `{"ref":"crm:acct_77","ref":"crm:acct_78"}`},
		{"schema twice", `"schema":"label/1"`, `"schema":"label/1","schema":"label/1"`},
	} {
		t.Run(c.name, func(t *testing.T) {
			edited := strings.Replace(minLabel, c.old, c.repl, 1)
			if edited == minLabel {
				t.Fatal("the fixture edit did not apply")
			}
			_, err := label.Decode([]byte(edited))
			wantOnly(t, err, label.ErrInvalid, label.ErrUnknownSchema, "09a:588; B1-02 9d519cb")
			_, err = nouns.Decode[nouns.Label]([]byte(edited))
			if !errors.Is(err, nouns.ErrInvalid) {
				t.Fatalf("nouns.Decode[Label] = %v; want ErrInvalid (one reader)", err)
			}
		})
	}
}

// Encode refuses what Decode refuses (09a:588, :594), with the same single sentinel: a writer may not
// emit a label no reader accepts, nor a removed 06 name (09a:644).
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
		{"unsafe-epoch", func(v *label.V1) { v.RevocationEpoch = 1 << 60 }, label.ErrInvalid, "B1-02 9d519cb (JS-safe integers)"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			v := base()
			c.mut(&v)
			other := label.ErrInvalid
			if c.want == label.ErrInvalid {
				other = label.ErrUnknownSchema
			}
			_, err := label.Encode(v)
			wantOnly(t, err, c.want, other, c.cite)
		})
	}
}

// One reader (DR-LABEL-RECONCILE:61: "no label/1 reader has shipped yet. B1-26 is that reader"; 09a:588
// "the one wire schema"): nouns.Label, which every Event, Job and Effect embeds, IS label.V1, and
// nouns' Decode and Encode accept and refuse exactly what label's do.
func TestB126SingleLabelReader(t *testing.T) {
	if a, b := reflect.TypeOf(nouns.Label{}), reflect.TypeOf(label.V1{}); a != b {
		t.Fatalf("nouns.Label is %v, a second label/1 type beside %v; want one type (an alias)", a, b)
	}
	var valid struct {
		Cases []validCase `json:"cases"`
	}
	load(t, "valid.json", &valid)
	for _, c := range valid.Cases {
		t.Run("accepts/"+c.Name, func(t *testing.T) {
			n, err := nouns.Decode[nouns.Label](c.Value)
			if err != nil {
				t.Fatalf("nouns.Decode[Label] refused a valid LabelV1: %v (%s)", err, c.Cite)
			}
			v, ok := any(n).(label.V1)
			if !ok {
				t.Fatalf("nouns.Decode[Label] returned %T, not label.V1", n)
			}
			if got, want := fieldsOf(v), generic(t, c.Value); !reflect.DeepEqual(got, want) {
				t.Fatalf("nouns decoded fields differ\n got  %v\n want %v", got, want)
			}
			nb, err1 := nouns.Encode(n)
			lb, err2 := label.Encode(v)
			if err1 != nil || err2 != nil || !bytes.Equal(nb, lb) {
				t.Fatalf("nouns.Encode and label.Encode disagree: %s (%v) vs %s (%v)", nb, err1, lb, err2)
			}
		})
	}
	var invalid struct {
		Cases []invalidCase `json:"cases"`
	}
	load(t, "invalid.json", &invalid)
	for _, c := range invalid.Cases {
		t.Run("refuses/"+c.Name, func(t *testing.T) {
			want, other := nouns.ErrInvalid, nouns.ErrUnknownSchema
			if c.Error == "unknown_schema" {
				want, other = other, want
			}
			_, err := nouns.Decode[nouns.Label](c.Value)
			wantOnly(t, err, want, other, c.Why+"; "+c.Cite)
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

// B1-26 acceptance: "every 06 label name maps to one wire name" — every row of 09a:628-663 as a table
// test (testdata/label/mapping.json, one fixture row per 06 name, each citing its table line).
func TestB126MappingTable(t *testing.T) {
	var f struct {
		Rows []mappingRow `json:"rows"`
	}
	load(t, "mapping.json", &f)
	if len(f.Rows) < 54 {
		t.Fatalf("mapping.json holds %d rows; the register froze 54", len(f.Rows))
	}
	for _, r := range f.Rows {
		v, _ := json.Marshal(r.Value)
		t.Run(fmt.Sprintf("%s=%s", r.Field, v), func(t *testing.T) {
			got, err := label.MapLegacy(r.Field, r.Value)
			if r.Error != "" {
				var want, other error
				switch r.Error {
				case "not_an_origin":
					want, other = label.ErrNotAnOrigin, label.ErrUnknownName
				case "unknown_name":
					want, other = label.ErrUnknownName, label.ErrNotAnOrigin
				default:
					t.Fatalf("fixture names unknown error %q", r.Error)
				}
				if got != nil {
					t.Fatalf("MapLegacy returned %v with a refusal", got)
				}
				wantOnly(t, err, want, other, r.Cite)
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
// founder decisions of DR-LABEL-RECONCILE (1, 3, A, B, C, E, H, I, K, P).
func TestB126OriginByAuthor(t *testing.T) {
	var f struct {
		Cases []originCase `json:"cases"`
	}
	load(t, "origin.json", &f)
	if len(f.Cases) < 31 {
		t.Fatalf("origin.json holds %d cases; the register froze 31", len(f.Cases))
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

// permutations returns every order of the indices 0..n-1.
func permutations(n int) [][]int {
	if n == 0 {
		return [][]int{{}}
	}
	var out [][]int
	for _, p := range permutations(n - 1) {
		for i := 0; i <= len(p); i++ {
			q := append(append(append([]int{}, p[:i]...), n-1), p[i:]...)
			out = append(out, q)
		}
	}
	return out
}

// 09a:665-670 (Join), 06:180 (L1), 06:187 (L8), 09a:602; decisions F, J, M, N, O (DR-LABEL-RECONCILE:99,
// :121, :136-143). Origin cases marked PROVISIONAL pin the orchestrator's proposed trust order (OPEN, :151). The join is a function of the SET of inputs: every case runs over every order of its inputs,
// so "copy the first label" and "copy the last label" both fail.
func TestB126Join(t *testing.T) {
	var f struct {
		Cases []joinCase `json:"cases"`
	}
	load(t, "join.json", &f)
	if len(f.Cases) < 41 {
		t.Fatalf("join.json holds %d cases; the register froze 41", len(f.Cases))
	}
	for _, c := range f.Cases {
		var decoded []label.Input
		for _, in := range c.Inputs {
			l, err := label.Decode(in.Label)
			if err != nil {
				t.Fatalf("%s: fixture input %s: %v", c.Name, in.ID, err)
			}
			decoded = append(decoded, label.Input{ID: in.ID, Label: l, Control: in.Control})
		}
		for _, perm := range permutations(len(decoded)) {
			var order []string
			var inputs []label.Input
			for _, i := range perm {
				inputs = append(inputs, decoded[i])
				order = append(order, decoded[i].ID)
			}
			t.Run(c.Name+"/"+strings.Join(order, ","), func(t *testing.T) {
				checkJoin(t, c, inputs)
			})
		}
	}
}

func checkJoin(t *testing.T, c joinCase, inputs []label.Input) {
	t.Helper()
	out, err := label.Join(c.Own, inputs)
	if c.Expect.Error != "" {
		// Decision M (DR-LABEL-RECONCILE:136): inputs from different ventures do not join.
		if c.Expect.Error != "cross_venture" {
			t.Fatalf("fixture names unknown error %q", c.Expect.Error)
		}
		if !errors.Is(err, label.ErrCrossVenture) || errors.Is(err, label.ErrInvalid) {
			t.Fatalf("Join = %+v, %v; want ErrCrossVenture alone (%s)", out, err, c.Cite)
		}
		return
	}
	if err != nil {
		t.Fatalf("Join: %v (%s)", err, c.Cite)
	}
	if _, err := label.Encode(out); err != nil {
		t.Fatalf("the join is not a valid LabelV1: %v", err)
	}
	// Provenance is not joined (09a:668-670): the output's own author, human principal and sources;
	// every input and every own derived_from id reachable through derived_from, and no input's own
	// ancestry copied in beside it (its ancestors stay reachable through the input's own record).
	p := out.Provenance
	if p.Author != c.Own.Author {
		t.Fatalf("author %+v, want the output's own %+v (09a:668)", p.Author, c.Own.Author)
	}
	if !reflect.DeepEqual(p.HumanPrincipal, c.Own.HumanPrincipal) {
		t.Fatalf("human_principal %+v, want the output's own %+v (09a:668-669)", p.HumanPrincipal, c.Own.HumanPrincipal)
	}
	if len(p.Sources) != len(c.Own.Sources) || (len(p.Sources) > 0 && !reflect.DeepEqual(p.Sources, c.Own.Sources)) {
		t.Fatalf("sources %+v, want the output's own %+v (provenance is not joined, 09a:668)", p.Sources, c.Own.Sources)
	}
	ids := map[string]bool{}
	for _, in := range inputs {
		ids[in.ID] = true
		if !slices.Contains(p.DerivedFrom, in.ID) {
			t.Fatalf("input %s not reachable through derived_from %v (09a:669)", in.ID, p.DerivedFrom)
		}
	}
	for _, id := range c.Own.DerivedFrom {
		ids[id] = true
		if !slices.Contains(p.DerivedFrom, id) {
			t.Fatalf("own derived_from %s dropped: %v", id, p.DerivedFrom)
		}
	}
	for _, in := range inputs {
		for _, anc := range in.Label.Provenance.DerivedFrom {
			if !ids[anc] && slices.Contains(p.DerivedFrom, anc) {
				t.Fatalf("input %s's ancestor %s was merged into derived_from %v: provenance is not joined (09a:668-670)", in.ID, anc, p.DerivedFrom)
			}
		}
	}
	e := c.Expect
	if e.IdentityExceptProvenance {
		got, want := fieldsOf(out), fieldsOf(inputs[0].Label)
		delete(got, "provenance")
		delete(want, "provenance")
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("the join of one label is not that label (%s)\n got  %v\n want %v", c.Cite, got, want)
		}
	}
	str := func(field, got, want string) {
		if want != "" && got != want {
			t.Fatalf("%s %q, want %q (%s)", field, got, want, c.Cite)
		}
	}
	str("taint", out.Taint, e.Taint)
	if e.TaintNot != "" && out.Taint == e.TaintNot {
		t.Fatalf("taint %q, must not be %q (%s)", out.Taint, e.TaintNot, c.Cite)
	}
	if e.ConfidenceRung != "" && (out.Confidence == nil || out.Confidence.Rung != e.ConfidenceRung) {
		t.Fatalf("confidence %+v, want rung %s (%s)", out.Confidence, e.ConfidenceRung, c.Cite)
	}
	str("boundary", out.Boundary, e.Boundary)
	str("dclass", out.DClass, e.DClass)
	str("retention.class", out.Retention.Class, e.RetentionClass)
	str("retention.hold", out.Retention.Hold, e.RetentionHold)
	str("retention.deadline", out.Retention.Deadline, e.RetentionDeadline)
	str("consent_scope", out.ConsentScope, e.ConsentScope)
	str("origin", out.Origin, e.Origin)
	if e.Subjects != nil {
		got := slices.Sorted(slices.Values(out.Subjects))
		want := slices.Sorted(slices.Values(e.Subjects))
		if !slices.Equal(slices.Compact(got), want) || len(got) != len(want) {
			t.Fatalf("subjects %v, want the union %v (%s)", out.Subjects, e.Subjects, c.Cite)
		}
	}
	if e.RevocationEpoch != nil && out.RevocationEpoch != *e.RevocationEpoch {
		t.Fatalf("revocation_epoch %d, want the newer %d (%s)", out.RevocationEpoch, *e.RevocationEpoch, c.Cite)
	}
	if e.Exportable != nil && out.Exportable != *e.Exportable {
		t.Fatalf("exportable %v, want %v (%s)", out.Exportable, *e.Exportable, c.Cite)
	}
	if e.PermissionAtMost != "" {
		r, ok := permRank[out.Permission]
		if !ok || r > permRank[e.PermissionAtMost] {
			t.Fatalf("permission %q widens past %q (%s)", out.Permission, e.PermissionAtMost, c.Cite)
		}
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
