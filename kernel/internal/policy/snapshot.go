package policy

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"slices"
	"strings"
	"time"
	"unicode/utf8"
)

// Version is a versioned, digested input.
type Version struct {
	Version string
	Digest  string
}

// Charter is the venture's signed charter as of the snapshot.
type Charter struct {
	Venture string
	Version string
	Level   Level
	Grants  []string
}

// Overlay is an active narrowing overlay read from the Journal (DR-58): a P2 deny within Scope.
type Overlay struct {
	ID      string
	Scope   Scope
	Reason  string
	Expires time.Time
}

// ContinuityRoute is a pre-authorised route a P2 deny lets through (DR-56).
type ContinuityRoute struct {
	ID    string
	Scope Scope
}

// SafeState is the venture's SCRAM safe state.
type SafeState struct {
	ID         string
	Continuity []ContinuityRoute
}

// Label is the authorising label (09a §5).
type Label struct {
	Schema     string
	Taint      string
	DClass     string
	Boundary   string
	Permission string
}

// Freshness is one input's freshness; State is fresh, stale or unknown.
type Freshness struct {
	Input      string
	ObservedAt time.Time
	MaxAgeS    int64
	State      string
}

// Snapshot is the policy snapshot of 09a §5: immutable and content-addressed. Every list in it is
// a set: order is not content, nil equals empty, and a repeated member (or a repeated id or input
// in a keyed set) is ErrSnapshot.
type Snapshot struct {
	JournalOffset      uint64
	Constitution       Version
	Charter            Charter
	Mandates           []string
	LimitsBook         string
	Overlays           []Overlay
	SafeState          SafeState
	AuthorisingLabel   Label
	InputsFreshness    []Freshness
	ClockUncertaintyMS int64
}

// The canonical encoding is JSON written from these structs: fixed field order, every field
// present, every set sorted and never null, every instant in UTC at nanosecond precision.
// ParseSnapshot re-encodes what it read and compares bytes, so a spelling, a duplicate key, a
// missing field or a stray byte is a refusal and not a second spelling of the same snapshot.
type wireScope struct {
	Venture string   `json:"venture"`
	Verbs   []string `json:"verbs"`
}

type wireOverlay struct {
	ID      string    `json:"id"`
	Scope   wireScope `json:"scope"`
	Reason  string    `json:"reason"`
	Expires string    `json:"expires"`
}

type wireRoute struct {
	ID    string    `json:"id"`
	Scope wireScope `json:"scope"`
}

type wireFreshness struct {
	Input      string `json:"input"`
	ObservedAt string `json:"observed_at"`
	MaxAgeS    int64  `json:"max_age_s"`
	State      string `json:"state"`
}

type wireSnapshot struct {
	JournalOffset uint64 `json:"journal_offset"`
	Constitution  struct {
		Version string `json:"version"`
		Digest  string `json:"digest"`
	} `json:"constitution"`
	Charter struct {
		Venture string   `json:"venture"`
		Version string   `json:"version"`
		Level   string   `json:"level"`
		Grants  []string `json:"grants"`
	} `json:"charter"`
	Mandates   []string      `json:"mandates"`
	LimitsBook string        `json:"limits_book"`
	Overlays   []wireOverlay `json:"overlays"`
	SafeState  struct {
		ID         string      `json:"id"`
		Continuity []wireRoute `json:"continuity"`
	} `json:"safe_state"`
	AuthorisingLabel struct {
		Schema     string `json:"schema"`
		Taint      string `json:"taint"`
		DClass     string `json:"dclass"`
		Boundary   string `json:"boundary"`
		Permission string `json:"permission"`
	} `json:"authorising_label"`
	InputsFreshness    []wireFreshness `json:"inputs_freshness"`
	ClockUncertaintyMS int64           `json:"clock_uncertainty_ms"`
}

var freshnessStates = []string{"fresh", "stale", "unknown"}

// text refuses a string that is not valid UTF-8: JSON would write it as U+FFFD and two different
// strings would share one encoding.
func text(s string) error {
	if !utf8.ValidString(s) {
		return fmt.Errorf("%w: %q is not valid UTF-8", ErrSnapshot, s)
	}
	return nil
}

// instant writes t in UTC with nanoseconds. A year outside 0000..9999 has no RFC 3339 spelling that
// reads back, so it is refused rather than written.
func instant(t time.Time) (string, error) {
	if y := t.UTC().Year(); y < 0 || y > 9999 {
		return "", fmt.Errorf("%w: instant in year %d", ErrSnapshot, y)
	}
	return t.UTC().Format(time.RFC3339Nano), nil
}

// sortedSet returns members sorted, refusing an empty member, a non-UTF-8 member and a repeat.
func sortedSet(what string, in []string) ([]string, error) {
	out := slices.Clone(in)
	if out == nil {
		out = []string{}
	}
	slices.Sort(out)
	for i, m := range out {
		if m == "" {
			return nil, fmt.Errorf("%w: empty member of %s", ErrSnapshot, what)
		}
		if err := text(m); err != nil {
			return nil, err
		}
		if i > 0 && out[i-1] == m {
			return nil, fmt.Errorf("%w: %s repeats %q", ErrSnapshot, what, m)
		}
	}
	return out, nil
}

func wireOf(sc Scope, what string) (wireScope, error) {
	if err := validScope(sc); err != nil {
		return wireScope{}, fmt.Errorf("%w: %s: %v", ErrSnapshot, what, err)
	}
	verbs, err := sortedSet(what+" verbs", sc.Verbs)
	return wireScope{Venture: sc.Venture, Verbs: verbs}, err
}

// wire validates s and lays it out for encoding.
func (s Snapshot) wire() (wireSnapshot, error) {
	var w wireSnapshot
	var err error
	w.JournalOffset = s.JournalOffset
	w.Constitution.Version, w.Constitution.Digest = s.Constitution.Version, s.Constitution.Digest
	w.Charter.Venture, w.Charter.Version, w.Charter.Level = s.Charter.Venture, s.Charter.Version, string(s.Charter.Level)
	if !validName(s.Charter.Venture, false) {
		return w, fmt.Errorf("%w: charter venture %q is not a lowercase dotted name", ErrSnapshot, s.Charter.Venture)
	}
	if _, ok := levelIndex(s.Charter.Level); !ok {
		return w, fmt.Errorf("%w: charter level %q is not A0..A4", ErrSnapshot, s.Charter.Level)
	}
	if w.Charter.Grants, err = sortedSet("grants", s.Charter.Grants); err != nil {
		return w, err
	}
	if w.Mandates, err = sortedSet("mandates", s.Mandates); err != nil {
		return w, err
	}
	w.LimitsBook = s.LimitsBook

	overlays := slices.Clone(s.Overlays)
	slices.SortFunc(overlays, func(a, b Overlay) int { return strings.Compare(a.ID, b.ID) })
	w.Overlays = make([]wireOverlay, len(overlays))
	for i, o := range overlays {
		if err := keyed("overlay id", o.ID, overlays, i, func(o Overlay) string { return o.ID }); err != nil {
			return w, err
		}
		x := &w.Overlays[i]
		x.ID, x.Reason = o.ID, o.Reason
		if x.Scope, err = wireOf(o.Scope, "overlay "+o.ID); err != nil {
			return w, err
		}
		if x.Expires, err = instant(o.Expires); err != nil {
			return w, err
		}
	}

	w.SafeState.ID = s.SafeState.ID
	routes := slices.Clone(s.SafeState.Continuity)
	slices.SortFunc(routes, func(a, b ContinuityRoute) int { return strings.Compare(a.ID, b.ID) })
	w.SafeState.Continuity = make([]wireRoute, len(routes))
	for i, r := range routes {
		if err := keyed("continuity id", r.ID, routes, i, func(r ContinuityRoute) string { return r.ID }); err != nil {
			return w, err
		}
		w.SafeState.Continuity[i].ID = r.ID
		if w.SafeState.Continuity[i].Scope, err = wireOf(r.Scope, "continuity "+r.ID); err != nil {
			return w, err
		}
	}

	l := s.AuthorisingLabel
	w.AuthorisingLabel.Schema, w.AuthorisingLabel.Taint, w.AuthorisingLabel.DClass = l.Schema, l.Taint, l.DClass
	w.AuthorisingLabel.Boundary, w.AuthorisingLabel.Permission = l.Boundary, l.Permission

	fresh := slices.Clone(s.InputsFreshness)
	slices.SortFunc(fresh, func(a, b Freshness) int { return strings.Compare(a.Input, b.Input) })
	w.InputsFreshness = make([]wireFreshness, len(fresh))
	for i, f := range fresh {
		if err := keyed("freshness input", f.Input, fresh, i, func(f Freshness) string { return f.Input }); err != nil {
			return w, err
		}
		if !slices.Contains(freshnessStates, f.State) {
			return w, fmt.Errorf("%w: input %q has state %q, want fresh, stale or unknown", ErrSnapshot, f.Input, f.State)
		}
		if f.MaxAgeS < 0 {
			return w, fmt.Errorf("%w: input %q has a negative max age", ErrSnapshot, f.Input)
		}
		x := &w.InputsFreshness[i]
		x.Input, x.MaxAgeS, x.State = f.Input, f.MaxAgeS, f.State
		if x.ObservedAt, err = instant(f.ObservedAt); err != nil {
			return w, err
		}
	}
	if s.ClockUncertaintyMS < 0 {
		return w, fmt.Errorf("%w: negative clock uncertainty", ErrSnapshot)
	}
	w.ClockUncertaintyMS = s.ClockUncertaintyMS

	for _, v := range []string{s.Constitution.Version, s.Constitution.Digest, s.Charter.Venture, s.Charter.Version,
		s.LimitsBook, s.SafeState.ID, l.Schema, l.Taint, l.DClass, l.Boundary, l.Permission} {
		if err := text(v); err != nil {
			return w, err
		}
	}
	for _, o := range overlays {
		if err := text(o.Reason); err != nil {
			return w, err
		}
	}
	return w, nil
}

// keyed checks member i of a set already sorted by key: a non-empty, valid key that the previous
// member does not repeat.
func keyed[T any](what, key string, sorted []T, i int, keyOf func(T) string) error {
	if key == "" {
		return fmt.Errorf("%w: empty %s", ErrSnapshot, what)
	}
	if err := text(key); err != nil {
		return err
	}
	if i > 0 && keyOf(sorted[i-1]) == key {
		return fmt.Errorf("%w: %s %q twice", ErrSnapshot, what, key)
	}
	return nil
}

// Canonical is the snapshot's canonical encoding, or ErrSnapshot.
func (s Snapshot) Canonical() ([]byte, error) {
	w, err := s.wire()
	if err != nil {
		return nil, err
	}
	b, err := json.Marshal(w)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrSnapshot, err)
	}
	return b, nil
}

// Digest is "sha256:" + the hex sha256 of Canonical: the snapshot's content address.
func (s Snapshot) Digest() (string, error) {
	b, err := s.Canonical()
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(b)
	return "sha256:" + hex.EncodeToString(sum[:]), nil
}

// ParseSnapshot reads canonical bytes back. Bytes that are not exactly a canonical encoding are
// ErrSnapshot.
func ParseSnapshot(b []byte) (Snapshot, error) {
	var w wireSnapshot
	if err := json.Unmarshal(b, &w); err != nil {
		return Snapshot{}, fmt.Errorf("%w: %v", ErrSnapshot, err)
	}
	var s Snapshot
	var err error
	s.JournalOffset = w.JournalOffset
	s.Constitution = Version{Version: w.Constitution.Version, Digest: w.Constitution.Digest}
	s.Charter = Charter{Venture: w.Charter.Venture, Version: w.Charter.Version, Level: Level(w.Charter.Level), Grants: w.Charter.Grants}
	s.Mandates, s.LimitsBook = w.Mandates, w.LimitsBook
	for _, o := range w.Overlays {
		x := Overlay{ID: o.ID, Scope: Scope{Venture: o.Scope.Venture, Verbs: o.Scope.Verbs}, Reason: o.Reason}
		if x.Expires, err = time.Parse(time.RFC3339Nano, o.Expires); err != nil {
			return Snapshot{}, fmt.Errorf("%w: overlay %q expires: %v", ErrSnapshot, o.ID, err)
		}
		s.Overlays = append(s.Overlays, x)
	}
	s.SafeState.ID = w.SafeState.ID
	for _, r := range w.SafeState.Continuity {
		s.SafeState.Continuity = append(s.SafeState.Continuity, ContinuityRoute{ID: r.ID, Scope: Scope{Venture: r.Scope.Venture, Verbs: r.Scope.Verbs}})
	}
	l := w.AuthorisingLabel
	s.AuthorisingLabel = Label{Schema: l.Schema, Taint: l.Taint, DClass: l.DClass, Boundary: l.Boundary, Permission: l.Permission}
	for _, f := range w.InputsFreshness {
		x := Freshness{Input: f.Input, MaxAgeS: f.MaxAgeS, State: f.State}
		if x.ObservedAt, err = time.Parse(time.RFC3339Nano, f.ObservedAt); err != nil {
			return Snapshot{}, fmt.Errorf("%w: input %q observed_at: %v", ErrSnapshot, f.Input, err)
		}
		s.InputsFreshness = append(s.InputsFreshness, x)
	}
	s.ClockUncertaintyMS = w.ClockUncertaintyMS
	again, err := s.Canonical()
	if err != nil {
		return Snapshot{}, err
	}
	if !bytes.Equal(again, b) {
		return Snapshot{}, fmt.Errorf("%w: bytes are not the canonical encoding", ErrSnapshot)
	}
	return s, nil
}
