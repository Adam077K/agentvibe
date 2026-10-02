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
package label

import "errors"

// ErrNotImplemented is returned by every entry point until B1-26 implements it.
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

// Decode parses one LabelV1 from its wire JSON, refusing per the wire rules above.
func Decode(data []byte) (V1, error) {
	return V1{}, ErrNotImplemented
}

// Encode writes v as wire JSON. Decode(Encode(v)) == v, and Encode(Decode(b)) is b up to key order and
// whitespace. A value Decode would refuse is refused here, with the same sentinel.
func Encode(v V1) ([]byte, error) {
	return nil, ErrNotImplemented
}

// MapLegacy is 09a §12's published mapping for one 06 name. field is the 06 field ("data_class",
// "origin", "authority", "tainted", "retention", "retention_deadline", …; "envelope.confidence" and
// "envelope.provenance" for the 06 §3 envelope copies); value is its JSON value as encoding/json
// decodes it. The result assigns wire values by dotted LabelV1 path ("dclass", "retention.hold",
// "provenance.human_principal"), each value JSON-shaped; a wire field the row does not set is absent.
// Refusals wrap ErrNotAnOrigin or ErrUnknownName.
func MapLegacy(field string, value any) (map[string]any, error) {
	return nil, ErrNotImplemented
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

// OriginFor returns the wire origin of material by its author (09a §12: "origin follows the author").
func OriginFor(c Contributor) (string, error) {
	return "", ErrNotImplemented
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
func Join(own Provenance, inputs []Input) (V1, error) {
	return V1{}, ErrNotImplemented
}
