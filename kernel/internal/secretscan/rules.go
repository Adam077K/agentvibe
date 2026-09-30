package secretscan

import (
	"math"
	"regexp"
)

// RulesVersion names the rule set below. A receipt records it, and RequireScanned treats a receipt
// made under any other version as stale, so adding or changing a rule forces a rescan.
const RulesVersion = "secretscan/v0.1"

// Rule names, as they appear in findings.
const (
	RulePrivateKey  = "private-key"
	RuleAWSKeyID    = "aws-access-key-id"
	RuleGitHub      = "github-token"
	RuleAnthropic   = "anthropic-api-key"
	RuleOpenAI      = "openai-api-key"
	RuleSlack       = "slack-token"
	RuleStripe      = "stripe-secret-key"
	RuleAssignedKey = "high-entropy-assignment"
)

type rule struct {
	name string
	re   *regexp.Regexp
}

// shapeRules match a token by its shape alone. Go's regexp is RE2 (no lookahead), so the Anthropic
// and OpenAI rules are kept disjoint by construction: "sk-ant-" never matches the OpenAI alternatives,
// which require "sk-proj-"/"sk-svcacct-"/"sk-admin-" or 48 hyphen-free characters after "sk-".
//
// The PEM header is assembled from two halves only so this file does not itself read as a key.
var shapeRules = []rule{
	{RulePrivateKey, regexp.MustCompile(`-----BEGIN [A-Z0-9 ]{0,24}PRIVATE` + ` KEY( BLOCK)?-----`)},
	{RuleAWSKeyID, regexp.MustCompile(`\b(AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}\b`)},
	{RuleGitHub, regexp.MustCompile(`\bgh[pousr]_[A-Za-z0-9]{36,255}\b|\bgithub_pat_[A-Za-z0-9_]{50,255}\b`)},
	{RuleAnthropic, regexp.MustCompile(`\bsk-ant-[A-Za-z0-9_-]{32,}`)},
	{RuleOpenAI, regexp.MustCompile(`\bsk-(proj|svcacct|admin)-[A-Za-z0-9_-]{32,}|\bsk-[A-Za-z0-9]{48}\b`)},
	{RuleSlack, regexp.MustCompile(`\bxox[baprse]-[0-9A-Za-z-]{10,}`)},
	{RuleStripe, regexp.MustCompile(`\b(sk|rk)_(live|test)_[0-9A-Za-z]{24,}\b`)},
}

// assignRE finds a value assigned to a name ending in _KEY, _SECRET or _TOKEN (any case), in
// shell/env (`X=v`), YAML (`x: v`), JSON (`"x": "v"`) and most source-code forms.
var assignRE = regexp.MustCompile(`(?i)\b([A-Z0-9_]*_(KEY|SECRET|TOKEN))["']?\s*[:=]\s*["'` + "`" + `]?([A-Za-z0-9+/=_.-]{20,})`)

// minEntropy is the Shannon entropy, in bits per character, at or above which an assigned value is
// treated as a secret. Words, repeated placeholders and ${VAR} references sit well under it; random
// base64 or alphanumerics of 20+ characters sit above it. Lowercase hex tops out at 4.0 bits and is
// the weakest case this rule covers.
const minEntropy = 3.5

func entropy(s string) float64 {
	if s == "" {
		return 0
	}
	var counts [256]int
	for i := 0; i < len(s); i++ {
		counts[s[i]]++
	}
	n := float64(len(s))
	h := 0.0
	for _, c := range counts {
		if c > 0 {
			p := float64(c) / n
			h -= p * math.Log2(p)
		}
	}
	return h
}

// matchLine returns the rules that fire on one line, each at most once. The assignment rule is only
// consulted when no shape rule fired, so `GITHUB_TOKEN=<a github token>` is one finding, not two.
func matchLine(line string) []string {
	var hits []string
	for _, r := range shapeRules {
		if r.re.MatchString(line) {
			hits = append(hits, r.name)
		}
	}
	if len(hits) > 0 {
		return hits
	}
	for _, m := range assignRE.FindAllStringSubmatch(line, -1) {
		if entropy(m[3]) >= minEntropy {
			return []string{RuleAssignedKey}
		}
	}
	return nil
}
