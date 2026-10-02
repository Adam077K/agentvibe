package secretscan

import (
	"math"
	"regexp"
)

// RulesVersion names the rule set below. A receipt records it, and RequireScanned treats a receipt
// made under any other version as stale, so adding or changing a rule forces a rescan.
const RulesVersion = "secretscan/v0.2"

// Rule names, as they appear in findings.
const (
	RulePrivateKey    = "private-key"
	RuleAWSKeyID      = "aws-access-key-id"
	RuleGitHub        = "github-token"
	RuleAnthropic     = "anthropic-api-key"
	RuleOpenAI        = "openai-api-key"
	RuleSlack         = "slack-token"
	RuleStripe        = "stripe-secret-key"
	RuleJWT           = "jwt"
	RuleAssignedKey   = "high-entropy-assignment"
	RuleSymlinkEscape = "symlink-escape" // emitted by the walk, not by a line match
)

type rule struct {
	name string
	re   *regexp.Regexp
}

// shapeRules match a token by its shape alone. Go's regexp is RE2 (no lookahead), so the Anthropic
// and OpenAI rules are kept disjoint by construction: "sk-ant-" never matches the OpenAI alternatives,
// which require "sk-proj-"/"sk-svcacct-"/"sk-admin-" or 48 hyphen-free characters after "sk-".
// A JWT always begins header and payload with `eyJ` (base64 of `{"`), which is what the JWT rule
// keys on; it fires wherever the token sits, assigned or not.
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
	{RuleJWT, regexp.MustCompile(`\bey` + `J[A-Za-z0-9_-]{8,}\.ey` + `J[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}`)},
}

// assignRE finds a value assigned to a secret-named key, in shell/env (`X=v`), YAML (`x: v`),
// JSON (`"x": "v"`) and most source forms. Names: anything ending _KEY, _SECRET, _TOKEN, _PASSWORD,
// _PASSWD or _PWD in any case (api_key, DB_PASSWORD); camelCase ending Key/Secret/Token/Password
// (apiKey, clientSecret); and bare password/passwd/secret/apikey. The value is every character up
// to whitespace, a quote, a comma, a semicolon or a closing parenthesis, 16 or more of them.
var assignRE = regexp.MustCompile(`\b((?i:[a-z0-9_]*_(?:key|secret|token|password|passwd|pwd))` +
	`|[a-z][a-zA-Z0-9]*(?:Key|Secret|Token|Password)|(?i:password|passwd|secret|apikey))` +
	`["']?\s*[:=]\s*["'` + "`" + `]?([^\s"'` + "`" + `,;)]{16,})`)

// referenceRE is the only suppression the assignment rule applies, and it is exact: the whole value
// must be an environment-variable reference — ${NAME}, $NAME, process.env.NAME, import.meta.env.NAME.
// No such value can be a literal secret. Nothing else is suppressed: a dotted value, a hyphenated
// phrase and a JWT are all reported, because an earlier "looks like a reference" heuristic hid
// hyphen-free JWTs assigned to *_KEY names (review of 4176882).
var referenceRE = regexp.MustCompile(`^(\$\{[A-Za-z_][A-Za-z0-9_]*\}|\$[A-Za-z_][A-Za-z0-9_]*|(process\.env|import\.meta\.env)\.[A-Za-z_][A-Za-z0-9_]*)$`)

var hexRE = regexp.MustCompile(`^[0-9a-fA-F]+$`)

// Entropy floors, in bits per character, by value length: a value is reported when its entropy is
// at or above the floor for its length, interpolated linearly between knots and held flat past the
// last one. Length-aware because the entropy of a short random value has a long lower tail.
// Measured 2026-10-02, 1,000,000 random values per alphabet per length: the lowest entropy seen was
// 1.79 bits for 18-character hex and 2.58 for 16-character base64; by 36 (hex) and 28 (alphanumeric,
// base64) it is above 2.8 and 3.5. The flat floors this replaced (2.5 hex, 3.2 otherwise) missed
// 1,188 of 30M random 16-64 character values, nearly all short, which is why the coverage test
// failed whenever its sample drew one. Each short knot sits 0.25-0.5 bits below the measured minimum;
// the curves end at the old flat floors, so no value reported before is unreported now.
// TestAssignedSecretRandomMissRate asserts 0 misses over 3 seeds x all 6 set orders x 3000 values
// per set (hex, alphanumeric, base64; 54,000 per set, lengths 16-64); a 10M-value sweep per
// alphabet also missed none.
// The cost, stated: more non-secret values assigned to secret names are reported — short, mildly
// repetitive ones such as "deadbeefdeadbeef" or "changeme-changeme". Measured over this repository's
// 1,979 tracked text files (704,630 lines): the same 32 lines are flagged under both the old floors
// and these, so the corpus shows no new false positive; the cost is real but did not occur there.
// The floor still holds: near-constant
// values ("xxxxxxxxxxxxxxxx", "changeme-changeme-changeme") are not reported, nor is anything under
// 16 characters, nor a low-entropy real secret such as a dictionary password.
type entropyKnot struct {
	length int
	bits   float64
}

var (
	hexFloor  = []entropyKnot{{16, 1.35}, {20, 1.65}, {24, 2.0}, {32, 2.4}, {36, 2.5}}
	textFloor = []entropyKnot{{16, 2.3}, {20, 2.7}, {24, 3.0}, {28, 3.2}}
)

// floorAt returns the entropy floor for a value of n bytes.
func floorAt(knots []entropyKnot, n int) float64 {
	if n <= knots[0].length {
		return knots[0].bits
	}
	for i := 1; i < len(knots); i++ {
		if a, b := knots[i-1], knots[i]; n <= b.length {
			return a.bits + (b.bits-a.bits)*float64(n-a.length)/float64(b.length-a.length)
		}
	}
	return knots[len(knots)-1].bits
}

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

func highEntropy(v string) bool {
	knots := textFloor
	if hexRE.MatchString(v) {
		knots = hexFloor
	}
	return entropy(v) >= floorAt(knots, len(v))
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
		if !referenceRE.MatchString(m[2]) && highEntropy(m[2]) {
			return []string{RuleAssignedKey}
		}
	}
	return nil
}
