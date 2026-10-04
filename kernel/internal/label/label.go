// Package label is LabelV1, the one versioned wire schema for labels (docs/vision-v3/09a-ENGINEERING.md
// §12.0, DR-68), with the mapping 09a publishes from 06's semantic names (§12, "Mapping from 06's
// semantic names" and "06 → wire"), the origin-by-author rule (the "a person's contribution" row) and
// the join (§12 "Join"; 06-MEMORY.md §4 L1).
//
// The contract below was frozen by B1-26's done-test (build/done-tests/B1-26.yml) before the job was
// built (docs/vision-v3/14-BUILD-PLAN.md §6). This file is NOT registered: it is the interface the job
// implements. The test file and the five fixture files in testdata/label/ are registered; Userland's
// half (userland/test/label.donetest.test.ts) reads the same fixture bytes.
//
// WIRE RULES (pinned by testdata/label/{valid,invalid}.json):
//   - Keys are LabelV1's names (09a §12.0). "Every event, blob, pack, trace and export carries exactly
//     this record": an unknown key is refused, not dropped, at every depth, and every non-optional
//     key is required. Seven fields are distinct and none is inferred from another.
//   - A closed enum is closed. The names 06 used before 2026-10-01 (origin system/web/worker/
//     collaborator, data_only, non_exportable, tainted, data_class, authority, a single retention
//     name, retention_deadline, provenance as a SourceRef array, confidence as a number) are refused.
//   - Keys match exactly: a duplicate key at any depth, or a key that differs from a known one only by
//     case, is refused (B1-02's rule, 9d519cb). An integer outside ±(2^53-1) is refused.
//   - An optional field is absent when unset, never null, "" or []; null is refused everywhere.
//   - ONE READER (DR-LABEL-RECONCILE:61): nouns.Label is this V1 (a type alias), and nouns' Decode and
//     Encode accept and refuse exactly what this package's do. That re-froze B1-02's fixtures to the
//     LabelV1 shape on 2026-10-02.
//   - A label whose schema is not "label/1" is refused wrapping ErrUnknownSchema (§12.0: "readers
//     refuse unknown versions"). Every other refusal wraps ErrInvalid.
//   - ConsentScopeRef, VentureId and SubjectId are strings; the canon does not define them further.
//
// IMPLEMENTATION CHOICES (B1-26; each one the contract leaves open)
//   - Every *Id/*Ref string (venture, consent_scope, subjects[], SourceRef.ref, derived_from[],
//     PrincipalRef.id) is non-empty. author.title is any string; the optional strings (quote,
//     accessed, system_of_record, mission, retention.deadline) are absent rather than "".
//     confidence.p is any JSON number the safe-integer rule admits; no range is stated by the canon.
//   - OPEN items of DR-LABEL-RECONCILE are refused with ErrUndecided, never guessed: see Join and
//     OriginFor.
package label

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"slices"
	"strconv"
	"strings"

	"github.com/Adam077K/agentvibe/kernel/internal/wire"
)

// ErrNotImplemented was returned by every entry point before B1-26 implemented them. Nothing in this
// package returns it now; it stays exported because the frozen contract named it.
var ErrNotImplemented = errors.New("label: not implemented")

// ErrInvalid: the bytes or value are not a valid LabelV1.
var ErrInvalid = errors.New("label: invalid")

// ErrUnknownSchema: the label carries a schema version this reader does not know.
var ErrUnknownSchema = errors.New("label: unknown label schema")

// ErrNotAnOrigin: a former 06 origin that is no origin on the wire. 09a §12: `origin: collaborator`
// is "not an origin: the channel row above, plus provenance.human_principal"; use OriginFor.
var ErrNotAnOrigin = errors.New("label: not an origin")

// ErrUnknownName: a 06 field or value with no row in 09a §12's mapping.
var ErrUnknownName = errors.New("label: no wire name for this 06 name")

// ErrCrossVenture: Join's inputs come from different ventures (founder, 2026-10-02, decision M). Only
// the founder's approval lets such a join run; the form of that approval is OPEN.
var ErrCrossVenture = errors.New("label: join across ventures")

// ErrConsentConflict: two of Join's inputs carry different consent refs (founder, 2026-10-02, decision
// S). Only identical refs join.
var ErrConsentConflict = errors.New("label: join across different consent scopes")

// ErrUndecided: the case is one DR-LABEL-RECONCILE-2026-10-01 lists as OPEN, so no answer is
// canon. It is refused rather than answered with a guess; deciding it is the founder's.
var ErrUndecided = errors.New("label: the canon leaves this case OPEN (DR-LABEL-RECONCILE); refused, not guessed")

// Schema is the one version this reader knows.
const Schema = "label/1"

// V1 is LabelV1, 09a §12.0.
type V1 struct {
	Schema          string      `json:"schema"`     // "label/1"
	Origin          string      `json:"origin"`     // founder|system_of_record|internal|public_web|customer|counterparty|synthetic
	DClass          string      `json:"dclass"`     // D0|D1|D2|D3|D4
	Boundary        string      `json:"boundary"`   // open|guarded|sealed
	Venture         string      `json:"venture"`    // a VentureId, "portfolio" or "founder"
	Retention       Retention   `json:"retention"`  //
	Permission      string      `json:"permission"` // none|informs|may_authorise
	Exportable      bool        `json:"exportable"`
	Taint           string      `json:"taint"` // clean|untrusted|quarantined
	Provenance      Provenance  `json:"provenance"`
	ConsentScope    string      `json:"consent_scope,omitempty"`
	Confidence      *Confidence `json:"confidence,omitempty"`
	Subjects        []string    `json:"subjects,omitempty"`
	RevocationEpoch uint64      `json:"revocation_epoch"`
}

// Retention is LabelV1.retention.
type Retention struct {
	Class    string `json:"class"`              // journal_metadata|operational|personal|client|synthetic
	Hold     string `json:"hold"`               // none|obligation|legal|safety|pinned
	Deadline string `json:"deadline,omitempty"` // computed; never a class
}

// Provenance is 09a §12's Provenance: the only copy; never joined.
type Provenance struct {
	Sources        []SourceRef   `json:"sources"`
	DerivedFrom    []string      `json:"derived_from"` // record ids → transitive labels
	Author         Author        `json:"author"`
	HumanPrincipal *PrincipalRef `json:"human_principal,omitempty"` // one per record
}

// SourceRef is 09a §12's SourceRef.
type SourceRef struct {
	Ref            string `json:"ref"`
	Quote          string `json:"quote,omitempty"`
	Accessed       string `json:"accessed,omitempty"`
	SystemOfRecord string `json:"system_of_record,omitempty"`
}

// Author is Provenance.author.
type Author struct {
	Title   string `json:"title"`
	Family  string `json:"family"` // claude|codex|founder|human|system
	Mission string `json:"mission,omitempty"`
}

// PrincipalRef is 09a §12's PrincipalRef.
type PrincipalRef struct {
	ID   string `json:"id"`
	Role string `json:"role"` // founder|collaborator|contractor|customer
}

// Confidence is LabelV1.confidence: the only copy; never raises permission.
type Confidence struct {
	Rung string   `json:"rung"` // E0..E5
	P    *float64 `json:"p,omitempty"`
}

// The closed sets of 09a §12.0, in the orders the join uses where it uses one (index = rank).
var (
	origins     = []string{"founder", "system_of_record", "internal", "public_web", "customer", "counterparty", "synthetic"}
	dclasses    = []string{"D0", "D1", "D2", "D3", "D4"} // higher is stricter
	boundaries  = []string{"open", "guarded", "sealed"}  // higher is stricter (06 L8)
	classes     = []string{"journal_metadata", "operational", "personal", "client", "synthetic"}
	holds       = []string{"none", "obligation", "legal", "safety", "pinned"}
	permissions = []string{"none", "informs", "may_authorise"}  // lower is narrower
	taints      = []string{"clean", "untrusted", "quarantined"} // higher is less trusted
	families    = []string{"claude", "codex", "founder", "human", "system"}
	roles       = []string{"founder", "collaborator", "contractor", "customer"}
	rungs       = []string{"E0", "E1", "E2", "E3", "E4", "E5"} // lower is weaker
	// Decision Q: founder > system_of_record > internal > customer > counterparty (most trusted
	// first). public_web and synthetic have no place in it (OPEN).
	originTrust = []string{"founder", "system_of_record", "internal", "customer", "counterparty"}
	// Decision R: personal > client > operational > synthetic (strictest last here). Where
	// journal_metadata sits is OPEN.
	classStrict = []string{"synthetic", "operational", "client", "personal"}
)

var (
	sourceRefCheck = wire.Object(
		wire.Req("ref", wire.ID),
		wire.Opt("quote", wire.Str),
		wire.Opt("accessed", wire.Str),
		wire.Opt("system_of_record", wire.Str),
	)
	principalCheck = wire.Object(
		wire.Req("id", wire.ID),
		wire.Req("role", wire.Enum(roles...)),
	)
	provenanceCheck = wire.Object(
		wire.Req("sources", wire.ArrayOf(sourceRefCheck)),
		wire.Req("derived_from", wire.ArrayOf(wire.ID)),
		wire.Req("author", wire.Object(
			wire.Req("title", wire.Str),
			wire.Req("family", wire.Enum(families...)),
			wire.Opt("mission", wire.Str),
		)),
		wire.Opt("human_principal", principalCheck),
	)
	confidenceCheck = wire.Object(
		wire.Req("rung", wire.Enum(rungs...)),
		wire.Opt("p", wire.Number),
	)
	fieldsCheck = wire.Object(
		wire.Req("schema", wire.Enum(Schema)),
		wire.Req("origin", wire.Enum(origins...)),
		wire.Req("dclass", wire.Enum(dclasses...)),
		wire.Req("boundary", wire.Enum(boundaries...)),
		wire.Req("venture", wire.ID),
		wire.Req("retention", wire.Object(
			wire.Req("class", wire.Enum(classes...)),
			wire.Req("hold", wire.Enum(holds...)),
			wire.Opt("deadline", wire.Str),
		)),
		wire.Req("permission", wire.Enum(permissions...)),
		wire.Req("exportable", wire.Boolean),
		wire.Req("taint", wire.Enum(taints...)),
		wire.Req("provenance", provenanceCheck),
		wire.Opt("consent_scope", wire.ID),
		wire.Opt("confidence", confidenceCheck),
		wire.OptList("subjects", wire.ArrayOf(wire.ID)),
		wire.Req("revocation_epoch", wire.Integer(0)),
	)
)

// Check validates raw, compact JSON that wire.Compact has accepted, as a LabelV1 found at path. It
// is the one label/1 check: nouns runs it on every label inside a noun. An unknown schema version
// is refused first, wrapping ErrUnknownSchema: a reader that does not know the version cannot judge
// the rest of the record. Every other refusal is a plain wire error that the caller wraps in its own
// ErrInvalid.
func Check(path string, raw json.RawMessage) error {
	m, err := wire.Members(raw)
	if err == nil && wire.KindOf(m["schema"]) == "string" {
		var s string
		if json.Unmarshal(m["schema"], &s) == nil && s != Schema {
			if path == "" {
				path = "label"
			}
			return fmt.Errorf("%w: %s.schema is %q; this reader knows %q", ErrUnknownSchema, path, s, Schema)
		}
	}
	return fieldsCheck(path, raw)
}

// classify wraps a refusal in exactly one sentinel.
func classify(err error) error {
	if errors.Is(err, ErrUnknownSchema) {
		return err
	}
	return fmt.Errorf("%w: %v", ErrInvalid, err)
}

// Decode parses one LabelV1 from its wire JSON, refusing per the wire rules above.
func Decode(data []byte) (V1, error) {
	buf, err := wire.Compact(data)
	if err != nil {
		return V1{}, classify(err)
	}
	if err := Check("", buf); err != nil {
		return V1{}, classify(err)
	}
	var v V1
	if err := json.Unmarshal(buf, &v); err != nil {
		return V1{}, classify(err) // Check refuses what would make this fail; still never a zero value
	}
	return v, nil
}

// Encode writes v as wire JSON. Decode(Encode(v)) == v, and Encode(Decode(b)) is b up to key order and
// whitespace. A value Decode would refuse is refused here, with the same sentinel.
func Encode(v V1) ([]byte, error) {
	out, err := wire.Marshal(v)
	if err != nil {
		return nil, classify(err)
	}
	if _, err := Decode(out); err != nil {
		return nil, err
	}
	return out, nil
}

// Clone returns a copy of v that shares no slice or pointer with it.
func Clone(v V1) V1 {
	c := v
	c.Subjects = slices.Clone(v.Subjects)
	if v.Confidence != nil {
		cf := *v.Confidence
		if v.Confidence.P != nil {
			p := *v.Confidence.P
			cf.P = &p
		}
		c.Confidence = &cf
	}
	c.Provenance = cloneProvenance(v.Provenance)
	return c
}

func cloneProvenance(p Provenance) Provenance {
	c := p
	c.Sources = slices.Clone(p.Sources)
	c.DerivedFrom = slices.Clone(p.DerivedFrom)
	if p.HumanPrincipal != nil {
		hp := *p.HumanPrincipal
		c.HumanPrincipal = &hp
	}
	return c
}

// MapLegacy is 09a §12's published mapping for one 06 name. field is the 06 field ("data_class",
// "origin", "authority", "tainted", "retention", "retention_deadline", …; "envelope.confidence" and
// "envelope.provenance" for the 06 §3 envelope copies); value is its JSON value as encoding/json
// decodes it. The result assigns wire values by dotted LabelV1 path ("dclass", "retention.hold",
// "provenance.human_principal"), each value JSON-shaped; a wire field the row does not set is absent.
// Refusals wrap ErrNotAnOrigin or ErrUnknownName.
//
// Only the rows 09a §12 publishes map; a field or value with no row is ErrUnknownName, never a
// best guess.
func MapLegacy(field string, value any) (map[string]any, error) {
	s, isStr := value.(string)
	b, isBool := value.(bool)
	one := func(path string, v any) (map[string]any, error) { return map[string]any{path: v}, nil }
	switch field {
	case "data_class":
		switch s {
		case "public":
			return one("dclass", "D0")
		case "internal":
			return one("dclass", "D1")
		case "personal":
			return one("dclass", "D2")
		case "confidential":
			return one("dclass", "D3")
		case "sealed":
			return map[string]any{"dclass": "D3", "boundary": "sealed"}, nil
		}
	case "origin":
		switch {
		case isStr && slices.Contains(origins, s):
			return one("origin", s)
		case s == "system":
			return one("origin", "system_of_record")
		case s == "web":
			return one("origin", "public_web")
		case s == "worker":
			return one("origin", "internal")
		case s == "participant", s == "external":
			return one("origin", "counterparty")
		case s == "collaborator":
			return nil, fmt.Errorf("%w: origin collaborator is the channel's origin plus provenance.human_principal (09a §12); use OriginFor", ErrNotAnOrigin)
		}
	case "consent_scope", "venture", "retention_deadline":
		if isStr && s != "" {
			path := map[string]string{"consent_scope": "consent_scope", "venture": "venture", "retention_deadline": "retention.deadline"}[field]
			return one(path, s)
		}
	case "taint":
		if isStr && slices.Contains(taints, s) {
			return one("taint", s)
		}
	case "authority":
		if isStr && slices.Contains(permissions, s) {
			return one("permission", s)
		}
	case "exportable":
		if isBool {
			return one("exportable", b)
		}
	case "tainted":
		if isBool {
			return one("taint", map[bool]string{true: "untrusted", false: "clean"}[b])
		}
	case "retention":
		switch {
		case s == "ordinary":
			return one("retention.hold", "none")
		case s == "synthetic":
			return map[string]any{"retention.class": "synthetic", "retention.hold": "none", "exportable": false}, nil
		case isStr && s != "none" && slices.Contains(holds, s):
			return one("retention.hold", s)
		}
	case "permission":
		switch s {
		case "data_only":
			return one("permission", "informs")
		case "non_exportable":
			return one("exportable", false)
		}
	case "subjects":
		if xs, ok := value.([]any); ok && len(xs) > 0 {
			out := make([]any, len(xs))
			for i, x := range xs {
				if t, ok := x.(string); !ok || t == "" {
					return nil, fmt.Errorf("%w: subjects[%d] is not a SubjectId", ErrUnknownName, i)
				}
				out[i] = x
			}
			return one("subjects", out)
		}
	case "envelope.confidence":
		return mapRecord("confidence", confidenceCheck, value)
	case "envelope.provenance":
		return mapRecord("provenance", provenanceCheck, value)
	case "provenance.human_principal":
		return mapRecord("provenance.human_principal", principalCheck, value)
	}
	return nil, fmt.Errorf("%w: %s %v", ErrUnknownName, field, value)
}

// mapRecord maps a record-valued 06 name whose wire value is the same record, held to the wire
// check of its LabelV1 field.
func mapRecord(path string, c wire.Check, value any) (map[string]any, error) {
	raw, err := json.Marshal(value)
	if err == nil {
		raw, err = wire.Compact(raw)
	}
	if err == nil {
		err = c(path, raw)
	}
	var out any
	if err == nil {
		err = json.Unmarshal(raw, &out)
	}
	if err != nil {
		return nil, fmt.Errorf("%w: %s: %v", ErrUnknownName, path, err)
	}
	return map[string]any{path: out}, nil
}

// Contributor names who wrote a piece of material and through which channel (09a §12, "a person's
// contribution, on any channel (HumanTask, email, form, Room)").
type Contributor struct {
	// Kind: founder | agent (the founder's agents) | collaborator | contractor | customer |
	// customer_proxy (writing on a customer's behalf) | outsider (any other outside person).
	Kind string
	// Channel: human_task | email | form | room.
	Channel string
	// Task is the HumanTask kind (16-EXTERNAL-WORLD-HUMANS.md:556) when Channel is human_task, e.g. participant, taste_panel.
	Task string
}

// humanTaskKinds is 16-EXTERNAL-WORLD-HUMANS.md:556's HumanTask.kind.
var humanTaskKinds = []string{"signature", "notarization", "physical", "human_only_call", "licensed_review",
	"taste_panel", "kyc", "local_presence", "contribution", "participant"}

// OriginFor returns the wire origin of material by its author (09a §12: "origin follows the author").
//
// A Contributor outside the documented sets, a human_task with no Task or an unknown one, a Task on
// another channel, and an agent on a HumanTask (a HumanTask is a person's) are ErrUnknownName. A
// panel task (participant, taste_panel) done on a customer's behalf is ErrUndecided: decision P makes
// a HumanTask done on a customer's behalf `customer`, and decision B makes a panel `counterparty`,
// and the canon does not say which governs.
func OriginFor(c Contributor) (string, error) {
	switch c.Channel {
	case "human_task":
		if !slices.Contains(humanTaskKinds, c.Task) {
			return "", fmt.Errorf("%w: HumanTask kind %q (16:556)", ErrUnknownName, c.Task)
		}
	case "email", "form", "room":
		if c.Task != "" {
			return "", fmt.Errorf("%w: a task %q on channel %s", ErrUnknownName, c.Task, c.Channel)
		}
	default:
		return "", fmt.Errorf("%w: channel %q", ErrUnknownName, c.Channel)
	}
	panel := c.Channel == "human_task" && (c.Task == "participant" || c.Task == "taste_panel")
	switch c.Kind {
	case "founder":
		return "founder", nil
	case "agent":
		if c.Channel == "human_task" {
			return "", fmt.Errorf("%w: an agent on a HumanTask; a HumanTask is a person's", ErrUnknownName)
		}
		return "internal", nil
	case "collaborator":
		return "internal", nil
	case "contractor", "outsider":
		return "counterparty", nil
	case "customer":
		if panel {
			return "counterparty", nil // decisions B and K: a panel is counterparty
		}
		return "customer", nil
	case "customer_proxy":
		if panel {
			return "", fmt.Errorf("%w: a %s task on a customer's behalf (decision P vs decision B)", ErrUndecided, c.Task)
		}
		return "customer", nil
	}
	return "", fmt.Errorf("%w: contributor kind %q", ErrUnknownName, c.Kind)
}

// Input is one Launch Pack input to a job.
type Input struct {
	ID      string // the input's record id
	Label   V1
	Control bool // read only to choose which branch ran (06 §4 L1)
}

// Join returns the label of a job's output: the join of every input, data and control (09a §12 Join;
// 06 §4 L1), independent of input order. Provenance is not joined: the result's provenance is own, and
// every input's ID is reachable through its derived_from. For dclass, retention, exportable and
// consent_scope the strictest input wins, and otherwise the least trusted value (founder, 2026-10-02;
// DR-LABEL-RECONCILE decisions J, M-O, Q-T). Inputs from different ventures are refused with
// ErrCrossVenture; founder and portfolio inputs join a venture's and the result is that venture's.
// Different consent refs are refused with ErrConsentConflict.
//
// Every field is a function of the set of inputs; control inputs count exactly as data inputs do.
// permission is the narrowest input's (only a declassifier widens it, 09a §12); confidence starts at
// the lowest rung (decision F) with the lowest p, and is absent if any input carries none, so a join
// never claims more confidence than its weakest input. A join with no inputs, an input with no id or
// an invalid label is ErrInvalid.
//
// The OPEN items of DR-LABEL-RECONCILE are refused with ErrUndecided, never resolved by a guess:
//   - origins that differ where one is public_web or synthetic (no place in decision Q's order);
//   - retention classes that differ where one is journal_metadata (no place in decision R's order);
//   - two different holds among obligation, safety and pinned (no duration on the wire);
//   - a deadline on some inputs and not others, or one outside the deadline grammar (parseDeadline);
//   - founder and portfolio inputs with no venture input (decision T names no owner); this one also
//     wraps ErrCrossVenture, being data crossing between owners. There is no approved path for a
//     cross-venture join: the wire form of the founder's approval is OPEN.
func Join(own Provenance, inputs []Input) (V1, error) {
	if len(inputs) == 0 {
		return V1{}, fmt.Errorf("%w: a join of no inputs", ErrInvalid)
	}
	for _, in := range inputs {
		if in.ID == "" {
			return V1{}, fmt.Errorf("%w: an input with no record id", ErrInvalid)
		}
		if _, err := Encode(in.Label); err != nil {
			return V1{}, fmt.Errorf("input %s: %w", in.ID, err)
		}
	}
	set := func(get func(V1) string) []string {
		var out []string
		for _, in := range inputs {
			if s := get(in.Label); s != "" && !slices.Contains(out, s) {
				out = append(out, s)
			}
		}
		slices.Sort(out)
		return out
	}
	// highest returns the member of vals ranked last in order.
	highest := func(order, vals []string) string {
		best := -1
		for _, v := range vals {
			best = max(best, slices.Index(order, v))
		}
		return order[best]
	}
	lowest := func(order, vals []string) string {
		best := len(order)
		for _, v := range vals {
			best = min(best, slices.Index(order, v))
		}
		return order[best]
	}
	var out V1
	out.Schema = Schema

	// Venture (decisions M, T).
	var ventures []string
	hasFounder, hasPortfolio := false, false
	for _, v := range set(func(l V1) string { return l.Venture }) {
		switch v {
		case "founder":
			hasFounder = true
		case "portfolio":
			hasPortfolio = true
		default:
			ventures = append(ventures, v)
		}
	}
	switch {
	case len(ventures) > 1:
		return V1{}, fmt.Errorf("%w: inputs from %v", ErrCrossVenture, ventures)
	case len(ventures) == 1:
		out.Venture = ventures[0]
	case hasFounder && hasPortfolio:
		return V1{}, fmt.Errorf("%w: %w: founder and portfolio inputs with no venture input", ErrCrossVenture, ErrUndecided)
	case hasFounder:
		out.Venture = "founder"
	default:
		out.Venture = "portfolio"
	}

	// Consent (decision S): identical refs only; an input with none does not narrow it.
	switch cs := set(func(l V1) string { return l.ConsentScope }); len(cs) {
	case 0:
	case 1:
		out.ConsentScope = cs[0]
	default:
		return V1{}, fmt.Errorf("%w: %v", ErrConsentConflict, cs)
	}

	// Origin (decisions N, Q): the least-trusted author.
	switch os := set(func(l V1) string { return l.Origin }); {
	case len(os) == 1:
		out.Origin = os[0]
	case slices.ContainsFunc(os, func(o string) bool { return !slices.Contains(originTrust, o) }):
		return V1{}, fmt.Errorf("%w: origins %v; public_web and synthetic have no place in the trust order", ErrUndecided, os)
	default:
		out.Origin = highest(originTrust, os)
	}

	// Retention (decisions J, O, R).
	switch cl := set(func(l V1) string { return l.Retention.Class }); {
	case len(cl) == 1:
		out.Retention.Class = cl[0]
	case slices.Contains(cl, "journal_metadata"):
		return V1{}, fmt.Errorf("%w: retention classes %v; where journal_metadata sits is OPEN", ErrUndecided, cl)
	default:
		out.Retention.Class = highest(classStrict, cl)
	}
	hs := set(func(l V1) string { return l.Retention.Hold })
	switch {
	case slices.Contains(hs, "legal"):
		out.Retention.Hold = "legal"
	default:
		hs = slices.DeleteFunc(hs, func(h string) bool { return h == "none" })
		switch len(hs) {
		case 0:
			out.Retention.Hold = "none"
		case 1:
			out.Retention.Hold = hs[0]
		default:
			return V1{}, fmt.Errorf("%w: holds %v carry no duration on the wire", ErrUndecided, hs)
		}
	}
	dl, err := latestDeadline(inputs)
	if err != nil {
		return V1{}, err
	}
	out.Retention.Deadline = dl

	// Classification, boundary, taint, permission (decisions J, N; 06 L1, L8).
	out.DClass = highest(dclasses, set(func(l V1) string { return l.DClass }))
	out.Boundary = highest(boundaries, set(func(l V1) string { return l.Boundary }))
	out.Taint = highest(taints, set(func(l V1) string { return l.Taint }))
	out.Permission = lowest(permissions, set(func(l V1) string { return l.Permission }))

	out.Exportable = true
	var subjects []string
	for _, in := range inputs {
		out.Exportable = out.Exportable && in.Label.Exportable
		out.RevocationEpoch = max(out.RevocationEpoch, in.Label.RevocationEpoch)
		for _, s := range in.Label.Subjects {
			if !slices.Contains(subjects, s) {
				subjects = append(subjects, s)
			}
		}
	}
	slices.Sort(subjects)
	out.Subjects = subjects

	// Confidence (decision F).
	out.Confidence = joinConfidence(inputs)

	// Provenance is not joined (09a §12): own, with every input reachable through derived_from.
	out.Provenance = cloneProvenance(own)
	if out.Provenance.Sources == nil {
		out.Provenance.Sources = []SourceRef{}
	}
	derived := []string{}
	for _, id := range own.DerivedFrom {
		if !slices.Contains(derived, id) {
			derived = append(derived, id)
		}
	}
	var ids []string
	for _, in := range inputs {
		if !slices.Contains(derived, in.ID) && !slices.Contains(ids, in.ID) {
			ids = append(ids, in.ID)
		}
	}
	slices.Sort(ids)
	out.Provenance.DerivedFrom = append(derived, ids...)

	if _, err := Encode(out); err != nil {
		return V1{}, fmt.Errorf("the join is not a LabelV1 (own provenance?): %w", err)
	}
	return out, nil
}

// latestDeadline is the longest retention deadline: the latest instant when every input carries
// one, none when no input does. A deadline against an absent one is OPEN, and so is a deadline
// outside the one grammar (parseDeadline): this reader cannot order it. Equal instants written
// differently resolve to the greater string, so the result does not depend on input order.
func latestDeadline(inputs []Input) (string, error) {
	var best string
	var bestT deadline
	n := 0
	for _, in := range inputs {
		d := in.Label.Retention.Deadline
		if d == "" {
			continue
		}
		n++
		t, ok := parseDeadline(d)
		if !ok {
			return "", fmt.Errorf("%w: retention.deadline %q is outside the deadline grammar and cannot be ordered", ErrUndecided, d)
		}
		if c := t.cmp(bestT); best == "" || c > 0 || (c == 0 && d > best) {
			best, bestT = d, t
		}
	}
	if n != 0 && n != len(inputs) {
		return "", fmt.Errorf("%w: a retention.deadline on %d of %d inputs; a deadline against an absent one is unordered", ErrUndecided, n, len(inputs))
	}
	return best, nil
}

// THE DEADLINE GRAMMAR (orchestrator ruling 2026-10-02, B1-26 impl review r2), one grammar in both
// languages: userland/src/label.ts's parseDeadline is this function, step for step, and both run the
// vectors in testdata/label/r2_deadlines.json. A deadline is RFC 3339's date-time with an uppercase
// 'T', two-digit fields, an optional '.' fraction of one or more digits, and an uppercase 'Z' or a
// +hh:mm / -hh:mm offset; the date is a real calendar date, hour < 24, minute and second < 60 (no
// leap second), offset hour < 24 and offset minute < 60. Anything else (a lowercase 't' or 'z', a
// space, a comma fraction, a single-digit field, hour 24, offset +24:00, 2026-02-30, a trailing
// space) is outside it. time.Parse is not used: it accepts some of those.
var deadlineGrammar = regexp.MustCompile(`^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]+))?(?:Z|([+-])([0-9]{2}):([0-9]{2}))$`)

// deadline is an instant: whole seconds since 1970-01-01T00:00:00Z, and the fraction's digits with
// trailing zeros removed. Two such fractions compare as strings exactly as they compare as numbers.
type deadline struct {
	sec  int64
	frac string
}

func (a deadline) cmp(b deadline) int {
	switch {
	case a.sec < b.sec:
		return -1
	case a.sec > b.sec:
		return 1
	}
	return strings.Compare(a.frac, b.frac)
}

func parseDeadline(s string) (deadline, bool) {
	m := deadlineGrammar.FindStringSubmatch(s)
	if m == nil {
		return deadline{}, false
	}
	n := func(i int) int64 {
		v, _ := strconv.ParseInt(m[i], 10, 64) // the grammar admits only digits here
		return v
	}
	y, mo, d, h, mi, sec := n(1), n(2), n(3), n(4), n(5), n(6)
	if mo < 1 || mo > 12 || d < 1 || d > daysIn(y, mo) || h > 23 || mi > 59 || sec > 59 {
		return deadline{}, false
	}
	off := int64(0)
	if m[8] != "" {
		oh, om := n(9), n(10)
		if oh > 23 || om > 59 {
			return deadline{}, false
		}
		off = oh*3600 + om*60
		if m[8] == "-" {
			off = -off
		}
	}
	return deadline{
		sec:  daysFromCivil(y, mo, d)*86400 + h*3600 + mi*60 + sec - off,
		frac: strings.TrimRight(m[7], "0"),
	}, true
}

func daysIn(y, m int64) int64 {
	switch m {
	case 2:
		if y%4 == 0 && (y%100 != 0 || y%400 == 0) {
			return 29
		}
		return 28
	case 4, 6, 9, 11:
		return 30
	}
	return 31
}

// daysFromCivil is the number of days from 1970-01-01 to y-m-d in the proleptic Gregorian calendar
// (H. Hinnant's days_from_civil). y is 0..9999, so y-1 can be -1: era is a floor division.
func daysFromCivil(y, m, d int64) int64 {
	if m <= 2 {
		y--
	}
	era := y
	if era < 0 {
		era -= 399
	}
	era /= 400
	yoe := y - era*400
	mp := (m + 9) % 12 // March is 0
	doy := (153*mp+2)/5 + d - 1
	doe := yoe*365 + yoe/4 - yoe/100 + doy
	return era*146097 + doe - 719468
}

// joinConfidence is the lowest rung and the lowest p (decision F), absent when any input has no
// confidence; p is absent when any input has none.
func joinConfidence(inputs []Input) *Confidence {
	var out *Confidence
	allP := true
	var p float64
	for i, in := range inputs {
		c := in.Label.Confidence
		if c == nil {
			return nil
		}
		if out == nil || slices.Index(rungs, c.Rung) < slices.Index(rungs, out.Rung) {
			out = &Confidence{Rung: c.Rung}
		}
		switch {
		case c.P == nil:
			allP = false
		case i == 0 || *c.P < p:
			p = *c.P
		}
	}
	if allP {
		out.P = &p
	}
	return out
}
