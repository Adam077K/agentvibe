// Package policy is the Kernel's policy compiler v0 (09a §5; 00-CANON §3): the policy snapshot, the
// P1→P8 precedence walk, typed rules, and the seed decision-rights matrix (05 §5).
//
// The matrix lives in rights.go and seed.go, the snapshot in snapshot.go, and the typed rules and
// the walk here.
//
// Out of scope for B1-14a, and why Walk takes base as an argument: classify (effect class and door,
// 16 §4) and dispose (05 §3.3's level × grant × door table) are composed in by B1-14b and B2-13a.
// The walk applies precedence on top of whatever base disposition the caller computed.
package policy

import (
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"
	"unicode/utf8"
)

// Sentinels. Every refusal wraps exactly one of them (errors.Is).
var (
	ErrRule     = errors.New("policy: rule refused")
	ErrRights   = errors.New("policy: rights matrix refused")
	ErrSnapshot = errors.New("policy: snapshot refused")
	ErrWalk     = errors.New("policy: walk refused")
)

// Scope selects actions: Venture is a venture id or "*" for every venture; each Verbs entry is a
// verb, "*", or a prefix pattern "payments.*" matching "payments.<anything>". A verb that is not a
// pattern matches exactly, never as a prefix.
type Scope struct {
	Venture string
	Verbs   []string
}

// validVerb accepts "*", a pattern whose only "*" is the final ".*", or a verb with no "*".
func validVerb(v string) bool {
	switch {
	case v == "" || !utf8.ValidString(v):
		return false
	case v == "*":
		return true
	case strings.HasSuffix(v, ".*"):
		return len(v) > 2 && !strings.Contains(v[:len(v)-2], "*")
	}
	return !strings.Contains(v, "*")
}

// validScope refuses a scope that selects nothing or names a verb it cannot match.
func validScope(sc Scope) error {
	if sc.Venture == "" || !utf8.ValidString(sc.Venture) {
		return fmt.Errorf("scope venture %q is empty or not UTF-8", sc.Venture)
	}
	if len(sc.Verbs) == 0 {
		return errors.New("scope names no verb")
	}
	for _, v := range sc.Verbs {
		if !validVerb(v) {
			return fmt.Errorf("scope verb %q is not a verb, \"*\" or a \"prefix.*\" pattern", v)
		}
	}
	return nil
}

func verbMatches(pattern, verb string) bool {
	if pattern == "*" {
		return true
	}
	if prefix, ok := strings.CutSuffix(pattern, "*"); ok && strings.HasSuffix(prefix, ".") {
		return strings.HasPrefix(verb, prefix)
	}
	return pattern == verb
}

func (sc Scope) matches(a Action) bool {
	return (sc.Venture == "*" || sc.Venture == a.Venture) && slices.ContainsFunc(sc.Verbs, func(p string) bool { return verbMatches(p, a.Verb) })
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

// restrictiveness orders the dispositions, least restrictive first.
var restrictiveness = map[Disposition]int{Auto: 0, Notify: 1, Ask: 2, CoSign: 3, Held: 4, Never: 5}

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
type Policy struct {
	rules []Rule // ordered by precedence, then id; a private deep copy
}

// NewPolicy validates every rule and returns the policy, or ErrRule and no policy. It refuses a
// method-typed admission rule (DR-05) at any precedence, and an admission rule at P8, which holds
// optional methods only.
func NewPolicy(rules []Rule) (*Policy, error) {
	p := &Policy{}
	seen := map[string]bool{}
	for _, r := range rules {
		if err := r.validate(); err != nil {
			return nil, fmt.Errorf("%w: rule %q: %v", ErrRule, r.ID, err)
		}
		if seen[r.ID] {
			return nil, fmt.Errorf("%w: rule id %q twice", ErrRule, r.ID)
		}
		seen[r.ID] = true
		r.Scope.Verbs = slices.Clone(r.Scope.Verbs)
		p.rules = append(p.rules, r)
	}
	slices.SortFunc(p.rules, func(a, b Rule) int {
		if a.Precedence != b.Precedence {
			return a.Precedence - b.Precedence
		}
		return strings.Compare(a.ID, b.ID)
	})
	return p, nil
}

func (r Rule) validate() error {
	if r.ID == "" || !utf8.ValidString(r.ID) {
		return errors.New("id is empty or not UTF-8")
	}
	if r.Precedence < 1 || r.Precedence > 8 {
		return fmt.Errorf("precedence %d is not P1..P8", r.Precedence)
	}
	if r.Type != Invariant && r.Type != Consequence && r.Type != Method {
		return fmt.Errorf("type %q is not invariant, consequence or method", r.Type)
	}
	if err := validScope(r.Scope); err != nil {
		return err
	}
	if !r.Admission {
		if _, ok := restrictiveness[r.Effect]; !ok && r.Effect != "" {
			return fmt.Errorf("effect %q is not a disposition", r.Effect)
		}
		return nil
	}
	switch {
	case r.Type == Method:
		return errors.New("a method-typed rule cannot be an admission rule (DR-05)")
	case r.Precedence == 8:
		return errors.New("an admission rule cannot sit at P8")
	case r.Precedence == 1 && r.Effect != Never:
		return fmt.Errorf("a P1 admission rule imposes never, not %q", r.Effect)
	case r.Precedence == 2 && r.Effect != Held:
		return fmt.Errorf("a P2 admission rule imposes held, not %q", r.Effect)
	}
	if _, ok := restrictiveness[r.Effect]; !ok {
		return fmt.Errorf("effect %q is not a disposition", r.Effect)
	}
	return nil
}

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

// admitting returns the admission rules at precedences lo..hi whose scope matches a.
func (p *Policy) admitting(a Action, lo, hi int) []Rule {
	var out []Rule
	for _, r := range p.rules {
		if r.Admission && r.Precedence >= lo && r.Precedence <= hi && r.Scope.matches(a) {
			out = append(out, r)
		}
	}
	return out
}

func ruleBlockers(rules []Rule) []Blocker {
	out := make([]Blocker, len(rules))
	for i, r := range rules {
		out[i] = Blocker{Rule: r.ID, Precedence: r.Precedence, Owner: r.Owner, Remedy: r.Remedy, Expires: r.Expires}
	}
	return out
}

// sortBlockers fixes one order, so one rule set and one snapshot give one Contract.
func sortBlockers(bs []Blocker) []Blocker {
	slices.SortFunc(bs, func(a, b Blocker) int {
		switch {
		case a.Precedence != b.Precedence:
			return a.Precedence - b.Precedence
		case a.Rule != b.Rule:
			return strings.Compare(a.Rule, b.Rule)
		case a.Owner != b.Owner:
			return strings.Compare(a.Owner, b.Owner)
		case a.Remedy != b.Remedy:
			return strings.Compare(a.Remedy, b.Remedy)
		}
		return a.Expires.Compare(b.Expires)
	})
	return bs
}

// Walk applies the P1→P8 precedence walk of 09a §5 to action a under snap, on top of base. A base
// that is not a Disposition is an error. A rule that only equals the base does not decide (ruling R2),
// and no rule loosens it. One snapshot address and one rule set give one Contract, whatever the
// input order.
func Walk(p *Policy, snap Snapshot, a Action, base Disposition) (Contract, error) {
	if p == nil {
		return Contract{}, fmt.Errorf("%w: no policy", ErrWalk)
	}
	if _, ok := restrictiveness[base]; !ok {
		return Contract{}, fmt.Errorf("%w: base %q is not a disposition", ErrWalk, base)
	}
	if a.OperationID == "" || a.Venture == "" || a.Verb == "" {
		return Contract{}, fmt.Errorf("%w: action needs an operation id, a venture and a verb", ErrWalk)
	}
	addr, err := snap.Digest()
	if err != nil {
		return Contract{}, err
	}
	c := Contract{OperationID: a.OperationID, Snapshot: addr, Disposition: base}
	impose := func(d Disposition, precedence int) {
		if restrictiveness[d] > restrictiveness[c.Disposition] {
			c.Disposition, c.Applied = d, precedence
		}
	}

	// P1: a denying rule ends evaluation.
	if never := p.admitting(a, 1, 1); len(never) > 0 {
		impose(Never, 1)
		c.Blockers = sortBlockers(ruleBlockers(never))
		return c, nil
	}

	// P2: a deny holds within its scope, unless the safe state names a continuity route for the action.
	held := ruleBlockers(p.admitting(a, 2, 2))
	for _, o := range snap.Overlays {
		if o.Scope.matches(a) {
			held = append(held, Blocker{Rule: o.ID, Precedence: 2, Expires: o.Expires})
		}
	}
	if len(held) > 0 && !slices.ContainsFunc(snap.SafeState.Continuity, func(r ContinuityRoute) bool { return r.Scope.matches(a) }) {
		impose(Held, 2)
		c.Blockers = sortBlockers(held)
		return c, nil
	}

	// P3..P8: the most restrictive admission rule decides; rules rank by precedence, so on a tie the
	// first one to reach the maximum is the highest precedence.
	rules := p.admitting(a, 3, 8)
	for _, r := range rules {
		impose(r.Effect, r.Precedence)
	}
	if len(rules) > 0 {
		c.Blockers = sortBlockers(ruleBlockers(rules))
	}
	return c, nil
}
