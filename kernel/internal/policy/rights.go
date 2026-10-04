package policy

import (
	"fmt"
	"maps"
	"slices"
)

// Level is an autonomy level, "A0".."A4" (05 §3.2).
type Level string

// Holder is a column of the decision-rights matrix (05 §5).
type Holder string

const (
	Founder    Holder = "founder"
	CoFounder  Holder = "cofounder"
	Shadow     Holder = "shadow"
	Allocation Holder = "allocation"
	Execution  Holder = "execution"
	Acceptance Holder = "acceptance"
	Record     Holder = "record"
	Custody    Holder = "custody"
	Regulation Holder = "regulation"
)

// Right is a matrix letter: D decides · P proposes · V vetoes · E executes · I informed. NoRight is
// an empty cell.
type Right string

const (
	NoRight Right = ""
	Decides Right = "D"
	Propose Right = "P"
	Veto    Right = "V"
	Execute Right = "E"
	Inform  Right = "I"
)

// LevelRight is one part of a cell: Right held at Levels. Empty Levels means every level.
type LevelRight struct {
	Right  Right
	Levels []Level
}

// Cell is one holder's entry in one decision row. Note is the cell's parenthetical, verbatim
// ("passkey only; never silence"), or "".
type Cell struct {
	Rights []LevelRight
	Note   string
}

// DecisionRow is one row of the matrix. Name and EnforcedBy are the table's text, verbatim.
type DecisionRow struct {
	Num        int
	Name       string
	EnforcedBy string
	Cells      map[Holder]Cell
}

var (
	allLevels  = []Level{"A0", "A1", "A2", "A3", "A4"}
	allHolders = []Holder{Founder, CoFounder, Shadow, Allocation, Execution, Acceptance, Record, Custody, Regulation}
	allRights  = []Right{Decides, Propose, Veto, Execute, Inform}
)

// levelIndex is the position of l in A0..A4, or false for anything else.
func levelIndex(l Level) (int, bool) {
	i := slices.Index(allLevels, l)
	return i, i >= 0
}

// rowIndex is what Right and Decider read: the row's cells by level, resolved once at build time.
type rowIndex struct {
	at      map[Holder][5]Right
	decider [5]Holder
}

// Rights is a validated, immutable decision-rights matrix.
type Rights struct {
	rows  []DecisionRow // ordered by Num; a private deep copy
	index map[int]rowIndex
}

// NewRights validates rows (known holders, letters and levels; at most one D per row per level;
// unique row numbers) and returns the matrix, or ErrRights. It keeps its own copy of rows.
func NewRights(rows []DecisionRow) (*Rights, error) {
	r := &Rights{index: map[int]rowIndex{}}
	for _, row := range rows {
		if row.Num < 1 {
			return nil, fmt.Errorf("%w: row number %d is not positive", ErrRights, row.Num)
		}
		if _, dup := r.index[row.Num]; dup {
			return nil, fmt.Errorf("%w: row %d twice", ErrRights, row.Num)
		}
		ix, err := indexRow(row)
		if err != nil {
			return nil, err
		}
		r.index[row.Num] = ix
		r.rows = append(r.rows, cloneRow(row))
	}
	slices.SortFunc(r.rows, func(a, b DecisionRow) int { return a.Num - b.Num })
	return r, nil
}

// indexRow resolves one row to a right per holder per level, refusing what 05 §5 forbids.
func indexRow(row DecisionRow) (rowIndex, error) {
	ix := rowIndex{at: map[Holder][5]Right{}}
	for h, c := range row.Cells {
		if !slices.Contains(allHolders, h) {
			return rowIndex{}, fmt.Errorf("%w: row %d: unknown holder %q", ErrRights, row.Num, h)
		}
		var at [5]Right
		for _, part := range c.Rights {
			if !slices.Contains(allRights, part.Right) {
				return rowIndex{}, fmt.Errorf("%w: row %d %s: unknown right %q", ErrRights, row.Num, h, part.Right)
			}
			levels := part.Levels
			if len(levels) == 0 {
				levels = allLevels
			}
			for _, l := range levels {
				i, ok := levelIndex(l)
				if !ok {
					return rowIndex{}, fmt.Errorf("%w: row %d %s: unknown level %q", ErrRights, row.Num, h, l)
				}
				if at[i] != NoRight {
					return rowIndex{}, fmt.Errorf("%w: row %d %s holds two rights at %s", ErrRights, row.Num, h, l)
				}
				at[i] = part.Right
				if part.Right != Decides {
					continue
				}
				if ix.decider[i] != "" {
					return rowIndex{}, fmt.Errorf("%w: row %d has two deciders at %s: %s and %s", ErrRights, row.Num, l, ix.decider[i], h)
				}
				ix.decider[i] = h
			}
		}
		ix.at[h] = at
	}
	return ix, nil
}

func cloneRow(row DecisionRow) DecisionRow {
	row.Cells = maps.Clone(row.Cells)
	for h, c := range row.Cells {
		c.Rights = slices.Clone(c.Rights)
		for i := range c.Rights {
			c.Rights[i].Levels = slices.Clone(c.Rights[i].Levels)
		}
		row.Cells[h] = c
	}
	return row
}

// Rows returns every row ordered by Num. The caller owns the result.
func (r *Rights) Rows() []DecisionRow {
	out := make([]DecisionRow, len(r.rows))
	for i, row := range r.rows {
		out[i] = cloneRow(row)
	}
	return out
}

// Right is what holder h holds on decision n at level l, NoRight for an empty cell. An unknown
// decision, holder or level is ErrRights.
func (r *Rights) Right(n int, h Holder, l Level) (Right, error) {
	ix, ok := r.index[n]
	if !ok {
		return NoRight, fmt.Errorf("%w: no decision %d", ErrRights, n)
	}
	if !slices.Contains(allHolders, h) {
		return NoRight, fmt.Errorf("%w: unknown holder %q", ErrRights, h)
	}
	i, ok := levelIndex(l)
	if !ok {
		return NoRight, fmt.Errorf("%w: unknown level %q", ErrRights, l)
	}
	return ix.at[h][i], nil
}

// Decider is the holder with D on decision n at level l. A row with no D at l defaults to the
// Founder (founder ruling 2026-10-03), never to an agent holder; false only for an unknown n or l.
func (r *Rights) Decider(n int, l Level) (Holder, bool) {
	ix, ok := r.index[n]
	i, lok := levelIndex(l)
	if !ok || !lok {
		return "", false
	}
	if ix.decider[i] == "" {
		return Founder, true
	}
	return ix.decider[i], true
}
