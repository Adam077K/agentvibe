//go:build donetest

// Done-tests for B1-14a, "Policy compiler v0: snapshot, P1→P8 walk, typed rules" (14-BUILD-PLAN.md
// §6; build/jobs.yml acceptance "100% table tests on the seed rights matrix; a method-typed admission
// rule is rejected"). Canon: 00-CANON §3 (precedence P1..P8, rule typing, DR-05), 09a §5 (snapshot,
// algorithm), 05 §5 (the decision-rights matrix).
//
// The matrix is read from its canonical file, 05 §5, at test time — not from a copy. A row, column
// or cell edited there changes what these tests expect, so an edit cannot skip a cell silently: the
// seed must follow it or the test fails. A cell grammar the parser does not know fails the test
// rather than being read as empty.
//
// Run: go -C kernel test -count=1 -tags donetest -run B1_14a ./internal/policy/
package policy

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"maps"
	"os"
	"reflect"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"testing"
	"time"
)

const matrixDoc = "../../../docs/vision-v3/05-AUTONOMY-INITIATIVE-FOUNDER.md"

// canonDecisions is 00-CANON §5's "22 decisions × holders". It only guards the parser against
// finding a different table; if the canon count changes, change it here in the same PR.
const canonDecisions = 22

var levels = []Level{"A0", "A1", "A2", "A3", "A4"}

var headerHolder = map[string]Holder{
	"Founder": Founder, "Co-founder seat": CoFounder, "Shadow seat": Shadow, "Alloc.": Allocation,
	"Exec.": Execution, "Accept.": Acceptance, "Record": Record, "Custody": Custody, "Regul.": Regulation,
}

type docCell struct {
	at   map[Level]Right
	note string
}

type docRow struct {
	num      int
	name     string
	enforced string
	cells    map[Holder]docCell
}

func splitRow(line string) []string {
	line = strings.TrimSpace(line)
	line = strings.TrimPrefix(line, "|")
	line = strings.TrimSuffix(line, "|")
	parts := strings.Split(line, "|")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return parts
}

var (
	reNote = regexp.MustCompile(`^(.*?)\s*\((.*)\)$`)
	rePart = regexp.MustCompile(`^([DPVEI])(?:\s+(.+))?$`)
	reLvl  = regexp.MustCompile(`^A([0-4])$`)
)

func levelIdx(s string) (int, error) {
	m := reLvl.FindStringSubmatch(s)
	if m == nil {
		return 0, fmt.Errorf("level %q is not A0..A4", s)
	}
	n, _ := strconv.Atoi(m[1])
	return n, nil
}

// parseCellText reads one matrix cell. Grammar, as 05 §5 writes it: optional **bold**; parts joined
// by " · "; each part a letter and an optional level condition (A3, <A4, ≥A2, A0–A1, or "below" =
// every level no other part names); one trailing parenthetical is the note. Anything else — an
// unknown condition, an empty or reversed range ("<A0", "A1–A0"), a level named twice — is an
// error, never an empty cell (orchestrator ruling R3, 2026-10-03).
func parseCellText(raw string) (docCell, error) {
	s := strings.TrimSpace(strings.ReplaceAll(raw, "**", ""))
	c := docCell{at: map[Level]Right{}}
	if s == "" {
		return c, nil
	}
	if m := reNote.FindStringSubmatch(s); m != nil {
		s, c.note = m[1], m[2]
	}
	below := Right("")
	for _, part := range strings.Split(s, " · ") {
		m := rePart.FindStringSubmatch(strings.TrimSpace(part))
		if m == nil {
			return c, fmt.Errorf("cell part %q is not a matrix letter with an optional level condition", part)
		}
		r, cond := Right(m[1]), m[2]
		var lo, hi int
		var err, err2 error
		switch {
		case cond == "":
			lo, hi = 0, 4
		case cond == "below":
			if below != "" {
				return c, fmt.Errorf("two \"below\" parts in %q", raw)
			}
			below = r
			continue
		case strings.HasPrefix(cond, "<"):
			hi, err = levelIdx(cond[1:])
			hi--
		case strings.HasPrefix(cond, "≥"):
			lo, err = levelIdx(strings.TrimPrefix(cond, "≥"))
			hi = 4
		case strings.Contains(cond, "–"):
			a, b, _ := strings.Cut(cond, "–")
			lo, err = levelIdx(a)
			hi, err2 = levelIdx(b)
			if err == nil && err2 == nil && lo >= hi {
				err = fmt.Errorf("range %q is empty or reversed", cond)
			}
		default:
			lo, err = levelIdx(cond)
			hi = lo
		}
		if err = errors.Join(err, err2); err != nil {
			return c, err
		}
		if lo > hi {
			return c, fmt.Errorf("condition %q names no level", cond)
		}
		for i := lo; i <= hi; i++ {
			if _, dup := c.at[levels[i]]; dup {
				return c, fmt.Errorf("level %s named twice in %q", levels[i], raw)
			}
			c.at[levels[i]] = r
		}
	}
	if below != "" {
		n := 0
		for _, l := range levels {
			if _, ok := c.at[l]; !ok {
				c.at[l] = below
				n++
			}
		}
		if n == 0 {
			return c, fmt.Errorf("\"below\" names no level in %q", raw)
		}
	}
	return c, nil
}

func parseCell(t *testing.T, where, raw string) docCell {
	t.Helper()
	c, err := parseCellText(raw)
	if err != nil {
		t.Fatalf("%s: %v", where, err)
	}
	return c
}

// The drift parser refuses what it cannot place, so a grammar 05 §5 starts using cannot be read as
// an empty cell. Run inside the red tests, ahead of the seed comparison.
func checkParser(t *testing.T) {
	t.Helper()
	for raw, want := range map[string]map[Level]Right{
		"**D** ≥A3 · P below": {"A0": "P", "A1": "P", "A2": "P", "A3": "D", "A4": "D"},
		"D <A4":               {"A0": "D", "A1": "D", "A2": "D", "A3": "D"},
		"D A0–A1":             {"A0": "D", "A1": "D"},
		"**D** A4 · P A3":     {"A3": "P", "A4": "D"},
		"V (envelope)":        {"A0": "V", "A1": "V", "A2": "V", "A3": "V", "A4": "V"},
	} {
		c, err := parseCellText(raw)
		if err != nil || !maps.Equal(c.at, want) {
			t.Fatalf("parser control %q: %v, %v; want %v", raw, c.at, err, want)
		}
	}
	for _, raw := range []string{"D A1–A0", "D A1–A1", "D <A0", "D A5", "D ≥A9", "D <", "D A3 · P A3",
		"D · P below · I below", "D · P below", "D foo", "X", "D A-1", "DA3", "D A0-A1"} {
		if c, err := parseCellText(raw); err == nil {
			t.Fatalf("parser accepted %q as %v; want an error", raw, c.at)
		}
	}
}

// loadDocMatrix parses 05 §5. It fails the test on anything it cannot place.
func loadDocMatrix(t *testing.T) []docRow {
	t.Helper()
	b, err := os.ReadFile(matrixDoc)
	if err != nil {
		t.Fatalf("read the canonical matrix: %v", err)
	}
	lines := strings.Split(string(b), "\n")
	i := slices.IndexFunc(lines, func(l string) bool { return strings.HasPrefix(l, "## 5. The decision-rights matrix") })
	if i < 0 {
		t.Fatalf("%s: no \"## 5. The decision-rights matrix\" section", matrixDoc)
	}
	for i < len(lines) && !strings.HasPrefix(lines[i], "| # |") {
		i++
	}
	if i == len(lines) {
		t.Fatalf("%s §5: no table header", matrixDoc)
	}
	head := splitRow(lines[i])
	if head[0] != "#" || head[1] != "Decision" || head[len(head)-1] != "Enforced by" {
		t.Fatalf("§5 header %q: want # | Decision | holders… | Enforced by", head)
	}
	var cols []Holder
	for _, h := range head[2 : len(head)-1] {
		hd, ok := headerHolder[h]
		if !ok {
			t.Fatalf("§5 header column %q has no Holder: add it to the test and the seed", h)
		}
		cols = append(cols, hd)
	}
	if len(cols) != len(headerHolder) {
		t.Fatalf("§5 has %d holder columns, the test maps %d", len(cols), len(headerHolder))
	}
	if !strings.HasPrefix(lines[i+1], "|---") {
		t.Fatalf("§5: no separator under the header")
	}
	var rows []docRow
	for _, l := range lines[i+2:] {
		if !strings.HasPrefix(l, "|") {
			break
		}
		f := splitRow(l)
		if len(f) != len(head) {
			t.Fatalf("§5 row %q: %d cells, header has %d", l, len(f), len(head))
		}
		n, err := strconv.Atoi(f[0])
		if err != nil {
			t.Fatalf("§5 row number %q: %v", f[0], err)
		}
		r := docRow{num: n, name: f[1], enforced: f[len(f)-1], cells: map[Holder]docCell{}}
		for j, h := range cols {
			r.cells[h] = parseCell(t, fmt.Sprintf("§5 row %d %s", n, h), f[2+j])
		}
		rows = append(rows, r)
	}
	if len(rows) != canonDecisions {
		t.Fatalf("§5 parsed %d rows; 00-CANON states %d decisions", len(rows), canonDecisions)
	}
	for k, r := range rows {
		if r.num != k+1 {
			t.Fatalf("§5 row %d is numbered %d", k+1, r.num)
		}
		for _, l := range levels {
			ds := 0
			for _, c := range r.cells {
				if c.at[l] == Decides {
					ds++
				}
			}
			if ds > 1 {
				t.Fatalf("§5 row %d has %d D at %s; canon says one D per row", r.num, ds, l)
			}
		}
	}
	return rows
}

// B1-14a acceptance 1: "100% table tests on the seed rights matrix". Every holder × level of every
// row, plus each row's name, enforcement and every cell note, against 05 §5.
func TestB1_14a_SeedRightsEveryCell(t *testing.T) {
	checkParser(t)
	doc := loadDocMatrix(t)
	r, err := SeedRights()
	if err != nil || r == nil {
		t.Fatalf("SeedRights: %v", err)
	}
	seed := r.Rows()
	if len(seed) != len(doc) {
		t.Fatalf("seed has %d rows, 05 §5 has %d", len(seed), len(doc))
	}
	byNum := map[int]DecisionRow{}
	for _, s := range seed {
		if _, dup := byNum[s.Num]; dup {
			t.Fatalf("seed row %d twice", s.Num)
		}
		byNum[s.Num] = s
	}
	cells := 0
	for _, d := range doc {
		s, ok := byNum[d.num]
		if !ok {
			t.Errorf("row %d: missing from the seed", d.num)
			continue
		}
		if s.Name != d.name {
			t.Errorf("row %d name %q, want %q", d.num, s.Name, d.name)
		}
		if s.EnforcedBy != d.enforced {
			t.Errorf("row %d enforced by %q, want %q", d.num, s.EnforcedBy, d.enforced)
		}
		for h := range s.Cells {
			if _, ok := d.cells[h]; !ok {
				t.Errorf("row %d: seed has a cell for holder %q, which 05 §5 has no column for", d.num, h)
			}
		}
		for h, dc := range d.cells {
			if got := s.Cells[h].Note; got != dc.note {
				t.Errorf("row %d %s note %q, want %q", d.num, h, got, dc.note)
			}
			for _, l := range levels {
				got, err := r.Right(d.num, h, l)
				if err != nil {
					t.Errorf("Right(%d, %s, %s): %v", d.num, h, l, err)
				} else if want := dc.at[l]; got != want {
					t.Errorf("Right(%d, %s, %s) = %q, want %q", d.num, h, l, got, want)
				}
				cells++
			}
		}
		for _, l := range levels {
			want := Founder // founder ruling 2026-10-03: a row with no D at a level defaults to the founder
			for h, dc := range d.cells {
				if dc.at[l] == Decides {
					want = h
				}
			}
			got, ok := r.Decider(d.num, l)
			if !ok || got != want {
				t.Errorf("Decider(%d, %s) = %q, %v; want %q, true", d.num, l, got, ok, want)
			}
		}
	}
	// The cells the ruling named, pinned by value as well as derived: row 17 (pre-listed one-way
	// door) has no D below A3, and row 4's co-founder seat is empty below A3. No agent holder
	// ever inherits an empty decision.
	for _, n := range []int{4, 17} {
		for _, l := range levels[:3] {
			if got, ok := r.Decider(n, l); !ok || got != Founder {
				t.Errorf("Decider(%d, %s) = %q, %v; want founder, true (founder ruling 2026-10-03)", n, l, got, ok)
			}
		}
	}
	if got, _ := r.Right(4, CoFounder, "A0"); got != NoRight {
		t.Errorf("Right(4, cofounder, A0) = %q: the default decider is reported by Decider, the cell stays as 05 §5 writes it", got)
	}
	if want := len(doc) * len(headerHolder) * len(levels); cells != want {
		t.Fatalf("checked %d holder×level cells, want %d", cells, want)
	}
	t.Logf("checked %d rows × %d holders × %d levels = %d cells", len(doc), len(headerHolder), len(levels), cells)
}

// The matrix answers only what it holds: anything outside it is refused, never read as NoRight.
func TestB1_14a_RightsRefuseUnknown(t *testing.T) {
	r, err := SeedRights()
	if err != nil || r == nil {
		t.Fatalf("SeedRights: %v", err)
	}
	if _, err := r.Right(1, Founder, "A0"); err != nil {
		t.Fatalf("positive control Right(1, founder, A0): %v", err)
	}
	for _, c := range []struct {
		n int
		h Holder
		l Level
	}{
		{0, Founder, "A0"}, {canonDecisions + 1, Founder, "A0"}, {-1, Founder, "A0"},
		{1, "ceo", "A0"}, {1, "Founder", "A0"}, {1, "", "A0"},
		{1, Founder, "A5"}, {1, Founder, "a0"}, {1, Founder, ""},
	} {
		if got, err := r.Right(c.n, c.h, c.l); !errors.Is(err, ErrRights) {
			t.Errorf("Right(%d, %q, %q) = %q, %v; want ErrRights", c.n, c.h, c.l, got, err)
		}
		// Red-team r1: the founder default is for a known row with no D, never for an unknown one.
		if c.h == Founder {
			if h, ok := r.Decider(c.n, c.l); ok {
				t.Errorf("Decider(%d, %q) = %q, true; want false: an unknown decision or level has no decider", c.n, c.l, h)
			}
		}
	}
}

// Orchestrator ruling R1 (2026-10-03): the Kernel never reads docs at runtime. The seed is compiled
// in; SeedRightsEveryCell is the drift test that holds it to 05 §5.
func TestB1_14a_SeedCompiledIn(t *testing.T) {
	t.Chdir(t.TempDir())
	r, err := SeedRights()
	if err != nil || r == nil {
		t.Fatalf("SeedRights from an empty cwd: %v", err)
	}
	if n := len(r.Rows()); n != canonDecisions {
		t.Fatalf("SeedRights from an empty cwd: %d rows, want %d", n, canonDecisions)
	}
	if got, err := r.Right(11, Acceptance, "A2"); err != nil || got != Decides {
		t.Fatalf("SeedRights from an empty cwd: Right(11, acceptance, A2) = %q, %v; want D", got, err)
	}
}

// The typed matrix refuses what 05 §5 forbids: two deciders on one row at one level, and anything
// untyped. The seed itself round-trips. Rows() is the caller's copy.
func TestB1_14a_NewRightsValidates(t *testing.T) {
	seed, err := SeedRights()
	if err != nil || seed == nil {
		t.Fatalf("SeedRights: %v", err)
	}
	rows := seed.Rows()
	again, err := NewRights(rows)
	if err != nil || again == nil {
		t.Fatalf("NewRights(seed.Rows()): %v", err)
	}
	for _, row := range rows {
		for h := range headerHolder {
			for _, l := range levels {
				a, _ := seed.Right(row.Num, headerHolder[h], l)
				b, _ := again.Right(row.Num, headerHolder[h], l)
				if a != b {
					t.Fatalf("round trip: row %d %s %s: %q vs %q", row.Num, headerHolder[h], l, a, b)
				}
			}
		}
	}

	rows[0].Cells[Founder] = Cell{}
	rows[0].Name = "mutated"
	if got, _ := seed.Right(1, Founder, "A0"); got != Decides {
		t.Errorf("mutating Rows()' result changed the matrix: Right(1, founder, A0) = %q", got)
	}

	// Red-team r1: NewRights builds from ITS input, not from the seed, and keeps its own copy.
	in := seed.Rows()
	in[10].Cells[Acceptance] = Cell{Rights: []LevelRight{{Right: Inform}}} // row 11, merge to main: Accept D -> I
	m, err := NewRights(in)
	if err != nil || m == nil {
		t.Fatalf("NewRights(row 11 without a D): %v", err)
	}
	for _, l := range levels {
		if got, _ := m.Right(11, Acceptance, l); got != Inform {
			t.Errorf("NewRights ignored its input: Right(11, acceptance, %s) = %q, want I", l, got)
		}
		if got, ok := m.Decider(11, l); !ok || got != Founder {
			t.Errorf("row 11 with no D: Decider(11, %s) = %q, %v; want founder", l, got, ok)
		}
	}
	in[10].Cells[Acceptance] = Cell{Rights: []LevelRight{{Right: Decides}}}
	in[0].Cells[CoFounder] = Cell{Rights: []LevelRight{{Right: Decides}}}
	if got, _ := m.Right(11, Acceptance, "A0"); got != Inform {
		t.Errorf("editing NewRights' input afterwards changed the matrix: Right(11, acceptance, A0) = %q", got)
	}
	if _, err := NewRights(m.Rows()); err != nil {
		t.Errorf("editing NewRights' input afterwards leaked into Rows(): %v", err)
	}

	edit := func(name string, f func(rows []DecisionRow) []DecisionRow) {
		t.Helper()
		if _, err := NewRights(f(seed.Rows())); !errors.Is(err, ErrRights) {
			t.Errorf("%s: NewRights err = %v, want ErrRights", name, err)
		}
	}
	noD := seed.Rows()
	noD[0].Cells[Founder] = Cell{Rights: []LevelRight{{Right: Inform}}}
	noD[0].Cells[CoFounder] = Cell{Rights: []LevelRight{{Right: Propose}}}
	if m, err := NewRights(noD); err != nil {
		t.Errorf("a row with no D is valid (it defaults to the founder): %v", err)
	} else {
		for _, l := range levels {
			if got, ok := m.Decider(1, l); !ok || got != Founder {
				t.Errorf("row 1 with no D: Decider(1, %s) = %q, %v; want founder, never the proposer", l, got, ok)
			}
		}
	}

	edit("second D on row 1, every level", func(r []DecisionRow) []DecisionRow {
		r[0].Cells[CoFounder] = Cell{Rights: []LevelRight{{Right: Decides}}}
		return r
	})
	edit("second D on row 6 at A1 only", func(r []DecisionRow) []DecisionRow {
		r[5].Cells[CoFounder] = Cell{Rights: []LevelRight{{Right: Decides, Levels: []Level{"A1", "A2", "A3", "A4"}}}}
		return r
	})
	edit("unknown letter", func(r []DecisionRow) []DecisionRow {
		r[0].Cells[Record] = Cell{Rights: []LevelRight{{Right: "X"}}}
		return r
	})
	edit("lower-case letter", func(r []DecisionRow) []DecisionRow {
		r[0].Cells[Record] = Cell{Rights: []LevelRight{{Right: "i"}}}
		return r
	})
	edit("unknown holder", func(r []DecisionRow) []DecisionRow {
		r[0].Cells["ceo"] = Cell{Rights: []LevelRight{{Right: Inform}}}
		return r
	})
	edit("unknown level", func(r []DecisionRow) []DecisionRow {
		r[0].Cells[Record] = Cell{Rights: []LevelRight{{Right: Inform, Levels: []Level{"A5"}}}}
		return r
	})
	edit("one holder, two rights at one level", func(r []DecisionRow) []DecisionRow {
		r[0].Cells[Record] = Cell{Rights: []LevelRight{{Right: Inform}, {Right: Propose, Levels: []Level{"A3"}}}}
		return r
	})
	edit("duplicate row number", func(r []DecisionRow) []DecisionRow {
		r[1].Num = r[0].Num
		return r
	})
}

// ---- snapshot ----

func at(s string) time.Time {
	v, err := time.Parse(time.RFC3339, s)
	if err != nil {
		panic(err)
	}
	return v
}

const constDigest = "sha256:9c1e000000000000000000000000000000000000000000000000000000000001"

// baseSnap is 09a §5's example snapshot, every list holding at least two entries.
func baseSnap() Snapshot {
	return Snapshot{
		JournalOffset: 88213,
		Constitution:  Version{Version: "v14", Digest: constDigest},
		Charter:       Charter{Venture: "keel", Version: "v6", Level: "A3", Grants: []string{"spend", "outbound", "deploy"}},
		Mandates:      []string{"m_refund_v3", "m_ads_v1"},
		LimitsBook:    "l_2026-10-02T09:00",
		Overlays: []Overlay{
			{ID: "ov_4471", Scope: Scope{Venture: "keel", Verbs: []string{"payments.*", "ads.spend"}}, Reason: "fraud alarm → freeze", Expires: at("2026-10-03T09:00:00Z")},
			{ID: "ov_4480", Scope: Scope{Venture: "keel", Verbs: []string{"outbound.email", "outbound.sms"}}, Reason: "reputation meter tripped", Expires: at("2026-10-02T21:00:00Z")},
		},
		SafeState: SafeState{ID: "ss_keel_v2", Continuity: []ContinuityRoute{
			{ID: "refund_le_original_charge", Scope: Scope{Venture: "keel", Verbs: []string{"payments.refund", "payments.refund_partial"}}},
			{ID: "notify_customer_of_delay", Scope: Scope{Venture: "keel", Verbs: []string{"outbound.email", "support.reply"}}},
		}},
		AuthorisingLabel: Label{Schema: "label/1", Taint: "clean", DClass: "D2", Boundary: "guarded", Permission: "may_authorise"},
		InputsFreshness: []Freshness{
			{Input: "stripe.balance", ObservedAt: at("2026-10-02T08:58:00Z"), MaxAgeS: 600, State: "fresh"},
			{Input: "reputation.meter.keel.email", ObservedAt: at("2026-10-02T08:00:00Z"), MaxAgeS: 300, State: "unknown"},
		},
		ClockUncertaintyMS: 40,
	}
}

func digest(t *testing.T, s Snapshot) string {
	t.Helper()
	d, err := s.Digest()
	if err != nil {
		t.Fatalf("Digest: %v", err)
	}
	return d
}

var timeType = reflect.TypeOf(time.Time{})

type step struct {
	field, index int
	isIndex      bool
}

type leafPath struct {
	name  string
	steps []step
	drop  bool // drop the slice's last element instead of mutating a leaf
}

func collectLeaves(v reflect.Value, steps []step, name string, out *[]leafPath) {
	switch {
	case v.Type() == timeType:
		*out = append(*out, leafPath{name: name, steps: slices.Clone(steps)})
	case v.Kind() == reflect.Struct:
		for i := 0; i < v.NumField(); i++ {
			collectLeaves(v.Field(i), append(slices.Clone(steps), step{field: i}), name+"."+v.Type().Field(i).Name, out)
		}
	case v.Kind() == reflect.Slice:
		*out = append(*out, leafPath{name: name + "[drop last]", steps: slices.Clone(steps), drop: true})
		for i := 0; i < v.Len(); i++ {
			collectLeaves(v.Index(i), append(slices.Clone(steps), step{index: i, isIndex: true}), fmt.Sprintf("%s[%d]", name, i), out)
		}
	default:
		*out = append(*out, leafPath{name: name, steps: slices.Clone(steps)})
	}
}

var reDigest = regexp.MustCompile(`^sha256:[0-9a-f]{64}$`)

// mutate changes one leaf to a different VALID value, so a refusal cannot stand in for "hashed".
func mutate(t *testing.T, s *Snapshot, p leafPath) {
	t.Helper()
	v := reflect.ValueOf(s).Elem()
	for _, st := range p.steps {
		if st.isIndex {
			v = v.Index(st.index)
		} else {
			v = v.Field(st.field)
		}
	}
	if p.drop {
		v.Set(v.Slice(0, v.Len()-1))
		return
	}
	switch {
	case v.Type() == timeType:
		v.Set(reflect.ValueOf(v.Interface().(time.Time).Add(time.Second)))
	case v.Type() == reflect.TypeOf(Level("")):
		if v.String() == "A2" {
			v.SetString("A3")
		} else {
			v.SetString("A2")
		}
	case v.Kind() == reflect.String && strings.HasSuffix(p.name, ".State"):
		if v.String() == "fresh" {
			v.SetString("stale")
		} else {
			v.SetString("fresh")
		}
	case v.Kind() == reflect.String && reDigest.MatchString(v.String()):
		s := v.String()
		v.SetString(s[:len(s)-1] + "f")
	case v.Kind() == reflect.String:
		v.SetString("x" + v.String())
	case v.Kind() == reflect.Int64, v.Kind() == reflect.Int:
		v.SetInt(v.Int() + 1)
	case v.Kind() == reflect.Uint64:
		v.SetUint(v.Uint() + 1)
	case v.Kind() == reflect.Bool:
		v.SetBool(!v.Bool())
	default:
		t.Fatalf("%s: leaf kind %s has no mutation; extend the test", p.name, v.Kind())
	}
}

// reverseAll reverses every slice, recursively: same sets, different order.
func reverseAll(v reflect.Value) {
	switch {
	case v.Type() == timeType:
	case v.Kind() == reflect.Struct:
		for i := 0; i < v.NumField(); i++ {
			reverseAll(v.Field(i))
		}
	case v.Kind() == reflect.Slice:
		n := v.Len()
		c := reflect.MakeSlice(v.Type(), n, n)
		for i := 0; i < n; i++ {
			c.Index(i).Set(v.Index(n - 1 - i))
			reverseAll(c.Index(i))
		}
		v.Set(c)
	}
}

func rezone(v reflect.Value, loc *time.Location) {
	switch {
	case v.Type() == timeType:
		v.Set(reflect.ValueOf(v.Interface().(time.Time).In(loc)))
	case v.Kind() == reflect.Struct:
		for i := 0; i < v.NumField(); i++ {
			rezone(v.Field(i), loc)
		}
	case v.Kind() == reflect.Slice:
		for i := 0; i < v.Len(); i++ {
			rezone(v.Index(i), loc)
		}
	}
}

// B1-14a "snapshot": deterministic. The same content always has the same address, whatever the
// order of its sets or the zone its instants were written in, and computing it changes nothing.
func TestB1_14a_SnapshotDeterministic(t *testing.T) {
	s := baseSnap()
	d := digest(t, s)
	if !reDigest.MatchString(d) {
		t.Fatalf("Digest %q: want sha256:<64 lowercase hex>", d)
	}
	can, err := s.Canonical()
	if err != nil {
		t.Fatalf("Canonical: %v", err)
	}
	if sum := sha256.Sum256(can); d != "sha256:"+hex.EncodeToString(sum[:]) {
		t.Fatalf("Digest %s is not the sha256 of Canonical", d)
	}
	for i := 0; i < 50; i++ {
		c2, _ := s.Canonical()
		if string(c2) != string(can) || digest(t, s) != d {
			t.Fatalf("call %d: encoding or digest changed", i)
		}
	}
	if !reflect.DeepEqual(s, baseSnap()) {
		t.Fatalf("Digest/Canonical modified the snapshot it was called on (in-place sort?)")
	}
	if got := digest(t, baseSnap()); got != d {
		t.Fatalf("an independently built equal snapshot has digest %s, want %s", got, d)
	}
	r := baseSnap()
	reverseAll(reflect.ValueOf(&r).Elem())
	if reflect.DeepEqual(r, baseSnap()) {
		t.Fatalf("test bug: reverseAll changed nothing")
	}
	if got := digest(t, r); got != d {
		t.Errorf("every set reversed: digest %s, want %s (lists in a snapshot are sets)", got, d)
	}
	z := baseSnap()
	rezone(reflect.ValueOf(&z).Elem(), time.FixedZone("UTC+5:30", 5*3600+1800))
	if got := digest(t, z); got != d {
		t.Errorf("same instants in another zone: digest %s, want %s", got, d)
	}
}

// B1-14a "snapshot": content-addressed. Every field is in the address; the address is of exactly
// the canonical bytes; a byte that differs is a different snapshot or no snapshot.
func TestB1_14a_SnapshotContentAddressed(t *testing.T) {
	base := baseSnap()
	d := digest(t, base)
	var leaves []leafPath
	collectLeaves(reflect.ValueOf(base), nil, "Snapshot", &leaves)
	seen := map[string]string{}
	for _, p := range leaves {
		s := baseSnap()
		mutate(t, &s, p)
		got, err := s.Digest()
		if err != nil {
			t.Errorf("%s mutated to a valid value: Digest refused: %v", p.name, err)
			continue
		}
		if got == d {
			t.Errorf("%s changed and the digest did not: the field is not in the address", p.name)
		}
		if other, dup := seen[got]; dup {
			t.Errorf("%s and %s mutated to the same digest", p.name, other)
		}
		seen[got] = p.name
	}
	t.Logf("%d single-field mutations, each a distinct address", len(leaves))

	can, err := base.Canonical()
	if err != nil {
		t.Fatalf("Canonical: %v", err)
	}
	back, err := ParseSnapshot(can)
	if err != nil {
		t.Fatalf("ParseSnapshot(Canonical): %v", err)
	}
	if got := digest(t, back); got != d {
		t.Fatalf("round trip digest %s, want %s", got, d)
	}
	for _, nc := range [][]byte{append(slices.Clone(can), '\n'), append([]byte(" "), can...), nil, []byte("{}")} {
		if _, err := ParseSnapshot(nc); !errors.Is(err, ErrSnapshot) {
			t.Errorf("ParseSnapshot(non-canonical %q…): err = %v, want ErrSnapshot", trunc(nc), err)
		}
	}
	for i := range can {
		b := slices.Clone(can)
		b[i] ^= 0x01
		s, err := ParseSnapshot(b)
		if err != nil {
			if !errors.Is(err, ErrSnapshot) {
				t.Errorf("byte %d flipped: err %v, want ErrSnapshot", i, err)
			}
			continue
		}
		// Red-team r1: whatever parses is canonical — it re-encodes to exactly the bytes read.
		if c2, err := s.Canonical(); err != nil || string(c2) != string(b) {
			t.Errorf("byte %d flipped: ParseSnapshot accepted bytes that are not their own canonical encoding", i)
		}
	}

	dup := baseSnap()
	dup.Overlays[1].ID = dup.Overlays[0].ID
	if _, err := dup.Digest(); !errors.Is(err, ErrSnapshot) {
		t.Errorf("two overlays with one id: Digest err = %v, want ErrSnapshot", err)
	}
	bad := baseSnap()
	bad.Charter.Level = "A5"
	if _, err := bad.Digest(); !errors.Is(err, ErrSnapshot) {
		t.Errorf("charter level A5: Digest err = %v, want ErrSnapshot", err)
	}

	// Red-team r1: a set member repeated is refused, in every set.
	for name, f := range map[string]func(*Snapshot){
		"mandates":           func(s *Snapshot) { s.Mandates = append(s.Mandates, s.Mandates[0]) },
		"grants":             func(s *Snapshot) { s.Charter.Grants = append(s.Charter.Grants, s.Charter.Grants[1]) },
		"continuity ids":     func(s *Snapshot) { s.SafeState.Continuity[1].ID = s.SafeState.Continuity[0].ID },
		"freshness inputs":   func(s *Snapshot) { s.InputsFreshness[1].Input = s.InputsFreshness[0].Input },
		"overlay scope verb": func(s *Snapshot) { s.Overlays[0].Scope.Verbs = append(s.Overlays[0].Scope.Verbs, "ads.spend") },
		"route scope verb":   func(s *Snapshot) { s.SafeState.Continuity[0].Scope.Verbs[1] = "payments.refund" },
	} {
		s := baseSnap()
		f(&s)
		if _, err := s.Digest(); !errors.Is(err, ErrSnapshot) {
			t.Errorf("repeated member in %s: Digest err = %v, want ErrSnapshot", name, err)
		}
	}

	// Red-team r1: the encoding is injective — a member holding a separator is not two members.
	joined := baseSnap()
	joined.Mandates = []string{"m_ads_v1,m_refund_v3"}
	if dj, err := joined.Digest(); err == nil && dj == d {
		t.Errorf(`mandates {"m_ads_v1,m_refund_v3"} and {"m_ads_v1","m_refund_v3"}: one address`)
	}
	split := baseSnap()
	split.Overlays[0].Scope.Verbs = []string{"payments.*,ads.spend"}
	if ds, err := split.Digest(); err == nil && ds == d {
		t.Errorf(`verbs {"payments.*,ads.spend"} and {"payments.*","ads.spend"}: one address`)
	}

	// Red-team r1: nil and empty are the same (empty) set.
	for name, f := range map[string][2]func(*Snapshot){
		"overlays":   {func(s *Snapshot) { s.Overlays = nil }, func(s *Snapshot) { s.Overlays = []Overlay{} }},
		"mandates":   {func(s *Snapshot) { s.Mandates = nil }, func(s *Snapshot) { s.Mandates = []string{} }},
		"grants":     {func(s *Snapshot) { s.Charter.Grants = nil }, func(s *Snapshot) { s.Charter.Grants = []string{} }},
		"continuity": {func(s *Snapshot) { s.SafeState.Continuity = nil }, func(s *Snapshot) { s.SafeState.Continuity = []ContinuityRoute{} }},
		"freshness":  {func(s *Snapshot) { s.InputsFreshness = nil }, func(s *Snapshot) { s.InputsFreshness = []Freshness{} }},
	} {
		a, b := baseSnap(), baseSnap()
		f[0](&a)
		f[1](&b)
		if da, db := digest(t, a), digest(t, b); da != db {
			t.Errorf("nil and empty %s: two addresses for one content", name)
		}
	}

	// Red-team r1: sub-second precision is content.
	ms := baseSnap()
	ms.InputsFreshness[0].ObservedAt = ms.InputsFreshness[0].ObservedAt.Add(500 * time.Millisecond)
	if digest(t, ms) == d {
		t.Errorf("observed_at +500ms: same address")
	}
}

func trunc(b []byte) string {
	if len(b) > 12 {
		return string(b[:12])
	}
	return string(b)
}

// ---- typed rules and the walk ----

func admit(id string, p int, typ RuleType, verbs []string, eff Disposition) Rule {
	return Rule{ID: id, Precedence: p, Type: typ, Admission: true, Scope: Scope{Venture: "keel", Verbs: verbs},
		Effect: eff, Owner: "owner." + id, Remedy: "remedy." + id, Expires: at("2026-10-02T12:00:00Z")}
}

func mustPolicy(t *testing.T, rules ...Rule) *Policy {
	t.Helper()
	p, err := NewPolicy(rules)
	if err != nil || p == nil {
		t.Fatalf("NewPolicy: %v", err)
	}
	return p
}

func act(venture, verb string) Action {
	return Action{OperationID: "op_7f3", Venture: venture, Verb: verb, Target: "cust_812", AmountUSD: 49, Audience: 1, Identity: "brand:keel"}
}

func walk(t *testing.T, p *Policy, s Snapshot, a Action, base Disposition) Contract {
	t.Helper()
	c, err := Walk(p, s, a, base)
	if err != nil {
		t.Fatalf("Walk(%s, base %s): %v", a.Verb, base, err)
	}
	return c
}

func blockerIDs(c Contract) []string {
	var ids []string
	for _, b := range c.Blockers {
		ids = append(ids, b.Rule)
	}
	slices.Sort(ids)
	return ids
}

func expect(t *testing.T, name string, c Contract, disp Disposition, applied int) {
	t.Helper()
	if c.Disposition != disp || c.Applied != applied {
		t.Errorf("%s: disposition %q applied P%d; want %q P%d (blockers %v)", name, c.Disposition, c.Applied, disp, applied, blockerIDs(c))
	}
}

func noOverlays(s Snapshot) Snapshot { s.Overlays = nil; return s }

func noContinuity(s Snapshot) Snapshot { s.SafeState.Continuity = nil; return s }

// B1-14a "P1→P8 walk": precedence as 00-CANON §3 and 09a §5 state it. P1 ends the walk with never;
// a P2 deny in scope holds unless a continuity route matches; P3..P8 compose to the most
// restrictive admission rule; the order rules were supplied in never matters.
func TestB1_14a_WalkPrecedence(t *testing.T) {
	snap := baseSnap() // ov_4471 freezes keel payments.* and ads.spend; continuity lets payments.refund through
	p1 := admit("never.cross_venture_money", 1, Invariant, []string{"payments.charge", "payments.refund"}, Never)
	p1.Scope.Venture = "*"
	p2 := admit("kill.payments", 2, Invariant, []string{"payments.*"}, Held)
	p3 := admit("obligation.reserve", 3, Consequence, []string{"payments.*"}, Ask)
	p4n := admit("limits.refund_cap", 4, Consequence, []string{"payments.*"}, Notify)
	p4a := admit("limits.refunds_per_day", 4, Consequence, []string{"payments.*"}, Ask)
	p5 := admit("acceptance.coverage", 5, Consequence, []string{"payments.*"}, CoSign)
	p6 := admit("funding.tranche", 6, Consequence, []string{"payments.*"}, Notify)
	p7 := admit("goal.activation", 7, Consequence, []string{"payments.*"}, Ask)

	t.Run("P1 ends the walk with never, over P2 and lower, in any rule order", func(t *testing.T) {
		rules := []Rule{p4a, p2, p5, p1, p7}
		for _, order := range [][]Rule{rules, reversed(rules)} {
			c := walk(t, mustPolicy(t, order...), snap, act("keel", "payments.charge"), Auto)
			expect(t, "P1 + P2 rule + overlay + P4/P5/P7", c, Never, 1)
			if ids := blockerIDs(c); !slices.Equal(ids, []string{p1.ID}) {
				t.Errorf("P1 ends evaluation: blockers %v, want only %s", ids, p1.ID)
			}
		}
	})
	t.Run("P1 is not lifted by a continuity route", func(t *testing.T) {
		c := walk(t, mustPolicy(t, p1, p4a), snap, act("keel", "payments.refund"), Auto)
		expect(t, "P1 over continuity", c, Never, 1)
	})
	t.Run("P1 with venture * covers every venture", func(t *testing.T) {
		c := walk(t, mustPolicy(t, p1), snap, act("other", "payments.charge"), Auto)
		expect(t, "P1 venture *", c, Never, 1)
	})
	t.Run("a P2 overlay in scope holds, over P3..P8, and ends the walk", func(t *testing.T) {
		c := walk(t, mustPolicy(t, p3, p4a, p5, p7), snap, act("keel", "payments.charge"), Auto)
		expect(t, "overlay ov_4471", c, Held, 2)
		if ids := blockerIDs(c); !slices.Equal(ids, []string{"ov_4471"}) {
			t.Errorf("held by overlay: blockers %v, want only ov_4471", ids)
		}
	})
	t.Run("a P2 rule in scope holds, with its owner, remedy and expiry", func(t *testing.T) {
		c := walk(t, mustPolicy(t, p2, p4a), noOverlays(snap), act("keel", "payments.charge"), Auto)
		expect(t, "kill switch rule", c, Held, 2)
		if len(c.Blockers) != 1 || c.Blockers[0] != (Blocker{Rule: p2.ID, Precedence: 2, Owner: p2.Owner, Remedy: p2.Remedy, Expires: p2.Expires}) {
			t.Errorf("blockers %+v, want exactly the P2 rule with owner, remedy and expiry", c.Blockers)
		}
	})
	t.Run("an existing obligation (P3) does not override a P2 deny", func(t *testing.T) {
		c := walk(t, mustPolicy(t, p3), noContinuity(snap), act("keel", "payments.refund"), Auto)
		expect(t, "P3 under freeze, no route", c, Held, 2)
	})
	t.Run("a continuity match falls through to P3..P8", func(t *testing.T) {
		c := walk(t, mustPolicy(t, p4a), snap, act("keel", "payments.refund"), Notify)
		expect(t, "refund on its continuity route, P4 ask", c, Ask, 4)
		c = walk(t, mustPolicy(t), snap, act("keel", "payments.refund"), Notify)
		expect(t, "refund on its continuity route, no rule", c, Notify, 0)
		c = walk(t, mustPolicy(t, p2), noOverlays(snap), act("keel", "payments.refund"), Auto)
		expect(t, "P2 rule, continuity route", c, Auto, 0)
	})
	t.Run("a P2 deny out of scope does not apply", func(t *testing.T) {
		for _, a := range []Action{act("other", "payments.charge"), act("keel", "paymentsx.charge"), act("keel", "billing.charge")} {
			c := walk(t, mustPolicy(t, p2), snap, a, Auto)
			expect(t, a.Venture+" "+a.Verb, c, Auto, 0)
		}
	})
	t.Run("P3..P8: the most restrictive admission rule decides, in any order", func(t *testing.T) {
		free := noOverlays(snap)
		rules := []Rule{p4n, p7, p5, p6}
		var first Contract
		for i, order := range [][]Rule{rules, reversed(rules), {p5, p6, p4n, p7}} {
			c := walk(t, mustPolicy(t, order...), free, act("keel", "payments.charge"), Auto)
			expect(t, "P4 notify, P5 co_sign, P6 notify, P7 ask", c, CoSign, 5)
			for _, id := range []string{p4n.ID, p5.ID, p6.ID, p7.ID} {
				if !slices.Contains(blockerIDs(c), id) {
					t.Errorf("order %d: matched admission rule %s missing from blockers %v", i, id, blockerIDs(c))
				}
			}
			if i == 0 {
				first = c
			} else if !slices.Equal(blockerIDs(c), blockerIDs(first)) {
				t.Errorf("order %d: blockers %v, first order %v", i, blockerIDs(c), blockerIDs(first))
			}
		}
		c := walk(t, mustPolicy(t, p6, p3), free, act("keel", "payments.charge"), Auto)
		expect(t, "P3 ask over P6 notify", c, Ask, 3)
		c = walk(t, mustPolicy(t, p7, p4n), free, act("keel", "payments.charge"), Auto)
		expect(t, "P7 ask over P4 notify", c, Ask, 7)
	})
	// Orchestrator ruling 2026-10-03: never > held > co_sign > ask > notify > auto; on equal
	// restrictiveness the rule at the highest precedence (lowest P) is the one applied.
	t.Run("restrictiveness: never > held > co_sign, whatever the precedence", func(t *testing.T) {
		free := noOverlays(snap)
		h6 := admit("funding.hold", 6, Consequence, []string{"payments.*"}, Held)
		n7 := admit("goal.never", 7, Consequence, []string{"payments.*"}, Never)
		for _, rules := range [][]Rule{{p5, h6}, {h6, p5}} {
			c := walk(t, mustPolicy(t, rules...), free, act("keel", "payments.charge"), Auto)
			expect(t, "P5 co_sign, P6 held", c, Held, 6)
		}
		for _, rules := range [][]Rule{{p5, h6, n7}, {n7, h6, p5}} {
			c := walk(t, mustPolicy(t, rules...), free, act("keel", "payments.charge"), Auto)
			expect(t, "P5 co_sign, P6 held, P7 never", c, Never, 7)
		}
		c := walk(t, mustPolicy(t, p4n), free, act("keel", "payments.charge"), Held)
		expect(t, "base held, P4 notify", c, Held, 0)
	})
	t.Run("tie: the highest precedence is applied, in any order", func(t *testing.T) {
		free := noOverlays(snap)
		for _, rules := range [][]Rule{{p4n, p6}, {p6, p4n}} {
			c := walk(t, mustPolicy(t, rules...), free, act("keel", "payments.charge"), Auto)
			expect(t, "P4 notify, P6 notify", c, Notify, 4)
		}
		for _, rules := range [][]Rule{{p7, p3, p4a}, {p4a, p7, p3}} {
			c := walk(t, mustPolicy(t, rules...), free, act("keel", "payments.charge"), Auto)
			expect(t, "P3, P4, P7 all ask", c, Ask, 3)
		}
	})
	// ---- red-team r1, 2026-10-03 ----
	t.Run("verb * matches every verb", func(t *testing.T) {
		all := admit("never.all", 1, Invariant, []string{"*"}, Never)
		c := walk(t, mustPolicy(t, all), noOverlays(snap), act("keel", "support.reply"), Auto)
		expect(t, "P1 verbs [*], support.reply", c, Never, 1)
	})
	t.Run("a verb matches exactly, never as a prefix", func(t *testing.T) {
		c := walk(t, mustPolicy(t), snap, act("keel", "payments.refund_everything"), Auto)
		expect(t, "freeze vs a verb a continuity route only prefixes", c, Held, 2)
		one := admit("never.charge", 1, Invariant, []string{"payments.charge"}, Never)
		c = walk(t, mustPolicy(t, one), noOverlays(snap), act("keel", "payments.chargeback"), Auto)
		expect(t, "P1 payments.charge vs payments.chargeback", c, Auto, 0)
	})
	t.Run("continuity respects the venture", func(t *testing.T) {
		all := admit("kill.payments.all", 2, Invariant, []string{"payments.*"}, Held)
		all.Scope.Venture = "*"
		c := walk(t, mustPolicy(t, all), noOverlays(snap), act("other", "payments.refund"), Auto)
		expect(t, "keel's continuity route vs venture other", c, Held, 2)
	})
	t.Run("scope applies at P1 and at P3..P8", func(t *testing.T) {
		one := admit("never.charge", 1, Invariant, []string{"payments.charge"}, Never)
		c := walk(t, mustPolicy(t, one), noOverlays(snap), act("keel", "support.reply"), Auto)
		expect(t, "P1 out of scope", c, Auto, 0)
		p4 := admit("limits.never", 4, Consequence, []string{"payments.*"}, Never)
		for _, a := range []Action{act("keel", "support.reply"), act("other", "payments.charge")} {
			c := walk(t, mustPolicy(t, p4), noOverlays(snap), a, Auto)
			expect(t, "P4 out of scope "+a.Venture+" "+a.Verb, c, Auto, 0)
			if len(c.Blockers) != 0 {
				t.Errorf("out-of-scope rule listed as a blocker: %v", blockerIDs(c))
			}
		}
	})
	t.Run("a P1 rule that is not an admission rule never blocks", func(t *testing.T) {
		adv := admit("advice.p1", 1, Invariant, []string{"payments.*"}, Never)
		adv.Admission = false
		c := walk(t, mustPolicy(t, adv), noOverlays(snap), act("keel", "payments.charge"), Auto)
		expect(t, "non-admission P1", c, Auto, 0)
	})
	t.Run("one snapshot address, one contract: overlay order", func(t *testing.T) {
		s := baseSnap()
		s.Overlays[1].Scope.Verbs = append(s.Overlays[1].Scope.Verbs, "payments.charge")
		r := s
		r.Overlays = slices.Clone(s.Overlays)
		slices.Reverse(r.Overlays)
		if digest(t, s) != digest(t, r) {
			t.Fatal("precondition: one set, one digest")
		}
		a := walk(t, mustPolicy(t), s, act("keel", "payments.charge"), Auto)
		b := walk(t, mustPolicy(t), r, act("keel", "payments.charge"), Auto)
		if !reflect.DeepEqual(a, b) {
			t.Errorf("one snapshot address, two contracts: %+v vs %+v", a.Blockers, b.Blockers)
		}
	})
	t.Run("one rule set, one contract: blockers in a deterministic order", func(t *testing.T) {
		p4b := admit("limits.aaa", 4, Consequence, []string{"payments.*"}, Notify)
		rules := []Rule{p4n, p5, p7, p4b, p6}
		a := walk(t, mustPolicy(t, rules...), noOverlays(snap), act("keel", "payments.charge"), Auto)
		for _, order := range [][]Rule{reversed(rules), {p6, p4b, p7, p4n, p5}} {
			b := walk(t, mustPolicy(t, order...), noOverlays(snap), act("keel", "payments.charge"), Auto)
			if !reflect.DeepEqual(a, b) {
				t.Errorf("same rule set, two contracts: %v vs %v", blockerIDs(a), blockerIDs(b))
			}
		}
	})
	t.Run("blockers carry the rule's owner, remedy and expiry", func(t *testing.T) {
		c := walk(t, mustPolicy(t, p4a), noOverlays(snap), act("keel", "payments.charge"), Auto)
		if want := (Blocker{Rule: p4a.ID, Precedence: 4, Owner: p4a.Owner, Remedy: p4a.Remedy, Expires: p4a.Expires}); len(c.Blockers) != 1 || c.Blockers[0] != want {
			t.Errorf("P4 blockers %+v, want exactly %+v", c.Blockers, want)
		}
		c = walk(t, mustPolicy(t), snap, act("keel", "payments.charge"), Auto)
		if len(c.Blockers) != 1 || c.Blockers[0].Rule != "ov_4471" || c.Blockers[0].Precedence != 2 || !c.Blockers[0].Expires.Equal(snap.Overlays[0].Expires) {
			t.Errorf("overlay blockers %+v, want ov_4471 at P2 with the overlay's expiry", c.Blockers)
		}
	})
	t.Run("a rule that only equals the base does not decide (ruling R2)", func(t *testing.T) {
		free := noOverlays(snap)
		c := walk(t, mustPolicy(t, p4a), free, act("keel", "payments.charge"), Ask)
		expect(t, "base ask, P4 ask", c, Ask, 0)
		c = walk(t, mustPolicy(t, p4a, p5), free, act("keel", "payments.charge"), Ask)
		expect(t, "base ask, P4 ask, P5 co_sign", c, CoSign, 5)
	})
	t.Run("the base disposition is validated", func(t *testing.T) {
		for _, b := range []Disposition{"", "bogus", "Auto", "co-sign", " ask"} {
			if c, err := Walk(mustPolicy(t), noOverlays(snap), act("keel", "payments.charge"), b); err == nil {
				t.Errorf("base %q accepted: disposition %q", b, c.Disposition)
			}
		}
	})
	t.Run("no rule loosens the base", func(t *testing.T) {
		c := walk(t, mustPolicy(t, p4n, p7), noOverlays(snap), act("keel", "payments.charge"), CoSign)
		expect(t, "base co_sign, rules notify/ask", c, CoSign, 0)
	})
	t.Run("advice never changes a disposition", func(t *testing.T) {
		adv := admit("advice.invariant", 4, Invariant, []string{"payments.*"}, Never)
		adv.Admission = false
		m := admit("recipe.onboarding", 8, Method, []string{"payments.*"}, Never)
		m.Admission = false
		m3 := admit("pattern.learned", 3, Method, []string{"payments.*"}, Never)
		m3.Admission = false
		c := walk(t, mustPolicy(t, adv, m, m3), noOverlays(snap), act("keel", "payments.charge"), Auto)
		expect(t, "non-admission never-rules", c, Auto, 0)
		if len(c.Blockers) != 0 {
			t.Errorf("advice listed as blockers: %v", blockerIDs(c))
		}
	})
	t.Run("the contract cites exactly its snapshot and operation", func(t *testing.T) {
		c := walk(t, mustPolicy(t), noOverlays(snap), act("keel", "payments.charge"), Auto)
		if want := digest(t, noOverlays(snap)); c.Snapshot != want || c.OperationID != "op_7f3" {
			t.Errorf("contract cites snapshot %q operation %q; want %q op_7f3", c.Snapshot, c.OperationID, want)
		}
		s2 := noOverlays(snap)
		s2.JournalOffset++
		if c2 := walk(t, mustPolicy(t), s2, act("keel", "payments.charge"), Auto); c2.Snapshot == c.Snapshot {
			t.Errorf("two snapshots, one cited address %q", c.Snapshot)
		}
	})
	t.Run("the policy is immutable once built", func(t *testing.T) {
		rules := []Rule{p4n}
		rules[0].Scope.Verbs = slices.Clone(p4n.Scope.Verbs)
		pol := mustPolicy(t, rules...)
		rules[0].Effect = Never
		rules[0].Scope.Verbs[0] = "billing.*"
		c := walk(t, pol, noOverlays(snap), act("keel", "payments.charge"), Auto)
		expect(t, "after mutating the caller's rules", c, Notify, 4)
	})
}

// valid is one admission rule of each type that NewPolicy must accept at P.
func validEffect(p int) Disposition {
	switch p {
	case 1:
		return Never
	case 2:
		return Held
	}
	return Ask
}

// B1-14a acceptance 2: "a method-typed admission rule is rejected" — at compile time, at every
// precedence, and it takes the whole policy down with it.
func TestB1_14a_MethodAdmissionRejected(t *testing.T) {
	for p := 1; p <= 7; p++ {
		for _, typ := range []RuleType{Invariant, Consequence} {
			if _, err := NewPolicy([]Rule{admit("ok", p, typ, []string{"payments.*"}, validEffect(p))}); err != nil {
				t.Errorf("positive control: %s admission rule at P%d refused: %v", typ, p, err)
			}
		}
	}
	adv := admit("recipe", 8, Method, []string{"payments.*"}, "")
	adv.Admission = false
	if _, err := NewPolicy([]Rule{adv}); err != nil {
		t.Errorf("positive control: a method that is advice at P8 refused: %v", err)
	}
	for p := 1; p <= 8; p++ {
		m := admit("method.gate", p, Method, []string{"payments.*"}, validEffect(p))
		if pol, err := NewPolicy([]Rule{m}); !errors.Is(err, ErrRule) || pol != nil {
			t.Errorf("method-typed admission rule at P%d: policy %v err %v; want nil, ErrRule", p, pol != nil, err)
		}
		good := admit("ok", 4, Consequence, []string{"payments.*"}, Ask)
		if pol, err := NewPolicy([]Rule{good, m, adv}); !errors.Is(err, ErrRule) || pol != nil {
			t.Errorf("method-typed admission rule at P%d among valid rules: policy %v err %v; want nil, ErrRule", p, pol != nil, err)
		}
	}
}

// B1-14a "typed rules": validation refuses what is not one of the three types, and every other
// untyped field of a rule, instead of reading it as advice.
func TestB1_14a_UnknownRuleTypeRejected(t *testing.T) {
	refuse := func(name string, r Rule) {
		t.Helper()
		if pol, err := NewPolicy([]Rule{r}); !errors.Is(err, ErrRule) || pol != nil {
			t.Errorf("%s: policy %v err %v; want nil, ErrRule", name, pol != nil, err)
		}
	}
	for _, typ := range []RuleType{"", "Method", "METHOD", "Invariant", " method", "method ", "invariant\n", "heuristic", "optional_method", "authority_invariant"} {
		for _, adm := range []bool{true, false} {
			r := admit("r", 4, typ, []string{"payments.*"}, Ask)
			r.Admission = adm
			refuse(fmt.Sprintf("type %q admission=%v", typ, adm), r)
		}
	}
	for _, p := range []int{0, 9, -1, 100} {
		refuse(fmt.Sprintf("precedence %d", p), admit("r", p, Invariant, []string{"payments.*"}, Ask))
	}
	for _, eff := range []Disposition{"", "deny", "Ask", "co-sign"} {
		refuse(fmt.Sprintf("admission effect %q", eff), admit("r", 4, Consequence, []string{"payments.*"}, eff))
	}
	refuse("admission rule at P8 (optional methods never block)", admit("r", 8, Invariant, []string{"payments.*"}, Ask))
	refuse("consequence admission rule at P8", admit("r", 8, Consequence, []string{"payments.*"}, Ask))
	refuse("empty id", admit("", 4, Consequence, []string{"payments.*"}, Ask))
	if _, err := NewPolicy([]Rule{admit("same", 4, Consequence, []string{"payments.*"}, Ask), admit("same", 5, Consequence, []string{"ads.*"}, Ask)}); !errors.Is(err, ErrRule) {
		t.Errorf("duplicate rule id: err %v, want ErrRule", err)
	}
}

func reversed(r []Rule) []Rule {
	c := slices.Clone(r)
	slices.Reverse(c)
	return c
}
