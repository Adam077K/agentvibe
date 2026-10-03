// Package policy is the Kernel's policy compiler v0 (09a §5; 00-CANON §3): the policy snapshot, the
// P1→P8 precedence walk, typed rules, and the seed decision-rights matrix (05 §5).
//
// B1-14a froze its done-tests in policy_donetest_test.go (build tag donetest). This file is NOT
// registered: it is the stub the job replaces, and every done-test is red against it. The types are
// the surface the tests drive; the job may add to them, not rename them.
//
// Out of scope for B1-14a, and why Walk takes base as an argument: classify (effect class and door,
// 16 §4) and dispose (05 §3.3's level × grant × door table) are composed in by B1-14b and B2-13a.
// The walk applies precedence on top of whatever base disposition the caller computed.
package policy

import (
	"errors"
	"time"
)

// Sentinels. Every refusal wraps exactly one of them (errors.Is).
var (
	ErrRule     = errors.New("policy: rule refused")
	ErrRights   = errors.New("policy: rights matrix refused")
	ErrSnapshot = errors.New("policy: snapshot refused")
)

var errStub = errors.New("policy: not implemented (B1-14a stub)")

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

// Rights is a validated, immutable decision-rights matrix.
type Rights struct{}

// SeedRights returns the seed matrix: 05 §5, compiled into the Kernel as a generated table or a
// literal. It never reads a file at runtime (orchestrator ruling R1, 2026-10-03).
func SeedRights() (*Rights, error) { return nil, errStub }

// NewRights validates rows (known holders, letters and levels; at most one D per row per level;
// unique row numbers) and returns the matrix, or ErrRights.
func NewRights(rows []DecisionRow) (*Rights, error) { return nil, errStub }

// Rows returns every row ordered by Num. The caller owns the result.
func (r *Rights) Rows() []DecisionRow { return nil }

// Right is what holder h holds on decision n at level l, NoRight for an empty cell. An unknown
// decision, holder or level is ErrRights.
func (r *Rights) Right(n int, h Holder, l Level) (Right, error) { return NoRight, errStub }

// Decider is the holder with D on decision n at level l. A row with no D at l defaults to the
// Founder (founder ruling 2026-10-03), never to an agent holder; false only for an unknown n or l.
func (r *Rights) Decider(n int, l Level) (Holder, bool) { return "", false }

// Scope selects actions: Venture is a venture id or "*" for every venture; each Verbs entry is a
// verb, "*", or a prefix pattern "payments.*" matching "payments.<anything>".
type Scope struct {
	Venture string
	Verbs   []string
}

// Disposition is a Decision Contract disposition (00-CANON §3; 09a §5 adds held). Most restrictive
// first (orchestrator ruling 2026-10-03): never > held > co_sign > ask > notify > auto.
type Disposition string

const (
	Auto   Disposition = "auto"
	Notify Disposition = "notify"
	Ask    Disposition = "ask"
	CoSign Disposition = "co_sign"
	Never  Disposition = "never"
	Held   Disposition = "held"
)

// RuleType is the DR-05 typing: only invariants and consequences may block.
type RuleType string

const (
	Invariant   RuleType = "invariant"
	Consequence RuleType = "consequence"
	Method      RuleType = "method"
)

// Rule is one typed rule. Precedence is 1..8 (P1..P8). Admission marks an admission rule: one that
// may block. A rule that is not an admission rule is advice and never changes a disposition. Effect
// is what an admission rule imposes when its Scope matches.
type Rule struct {
	ID         string
	Precedence int
	Type       RuleType
	Admission  bool
	Scope      Scope
	Effect     Disposition
	Owner      string
	Remedy     string
	Expires    time.Time
}

// Policy is a validated, immutable rule set.
type Policy struct{}

// NewPolicy validates every rule and returns the policy, or ErrRule and no policy. It refuses a
// method-typed admission rule (DR-05) at any precedence.
func NewPolicy(rules []Rule) (*Policy, error) { return nil, errStub }

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

// Canonical is the snapshot's canonical encoding, or ErrSnapshot.
func (s Snapshot) Canonical() ([]byte, error) { return nil, errStub }

// Digest is "sha256:" + the hex sha256 of Canonical: the snapshot's content address.
func (s Snapshot) Digest() (string, error) { return "", errStub }

// ParseSnapshot reads canonical bytes back. Bytes that are not exactly a canonical encoding are
// ErrSnapshot.
func ParseSnapshot(b []byte) (Snapshot, error) { return Snapshot{}, errStub }

// Action is a proposed effect (00-CANON §3).
type Action struct {
	OperationID string
	Venture     string
	Verb        string
	Target      string
	AmountUSD   int64
	Audience    int64
	Identity    string
}

// Blocker is a rule or overlay in force against the action.
type Blocker struct {
	Rule       string
	Precedence int
	Owner      string
	Remedy     string
	Expires    time.Time
}

// Contract is the Decision Contract v0. Snapshot is the digest of the one snapshot it cites.
// Applied is the precedence of the rule or overlay that set Disposition, 0 when base did; of rules
// imposing the same disposition, the highest precedence (lowest P).
type Contract struct {
	OperationID string
	Snapshot    string
	Disposition Disposition
	Applied     int
	Blockers    []Blocker
}

// Walk applies the P1→P8 precedence walk of 09a §5 to action a under snap, on top of base. A base
// that is not a Disposition is an error. A rule that only equals the base does not decide (ruling R2).
// One snapshot address and one rule set give one Contract, whatever the input order.
func Walk(p *Policy, snap Snapshot, a Action, base Disposition) (Contract, error) {
	return Contract{}, errStub
}
