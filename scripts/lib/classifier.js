'use strict';
// POSTURE: library. `scripts/classify.mjs` is its CLI and exits non-zero;
// `.github/workflows/qa-lead-pass.yml` calls that CLI.
//
// scripts/lib/classifier.js — THE classifier. One file computes risk.
//
// Before this existed there were two: `.claude/qa-tier-floor.yml` (the data) and a
// 25-line inline bash reimplementation of the matching logic inside
// `.github/workflows/qa-lead-pass.yml`. Two implementations of risk classification
// will disagree, and you find out during the incident. The bash is now deleted and
// calls this instead.
//
// It answers three questions about a path, from one rule set:
//   tier                  — the minimum review tier (the "floor")
//   resolvers             — which claim resolvers must run over claims in that file
//   required_claim_kinds  — which kinds of claim that file must carry
//   enforcement           — block (fails the build today) or shadow (logs would_block)
//
// MATCH SEMANTICS — note the repair.
// The YAML header used to say "first match wins (most-specific patterns FIRST)". Its
// only consumer never did that: the bash took the MAXIMUM tier across all matching
// patterns. The outputs happened to coincide because the rules are ordered
// strictest-first, so nothing had broken — but the stated semantics were false, and
// they would have become wrong the moment anyone reordered the file. Max-rank is what
// the file's own name ("tier-FLOOR") and purpose imply, so max-rank is what is
// implemented here and what the header now says.
//
// `resolvers` and `required_claim_kinds` take the UNION of every matching rule, and
// `enforcement` takes the strictest. Both directions are the safe one: a file matched
// by two rules gets checked by both, not by whichever happened to sort first.

const fs = require('fs');
const path = require('path');
const { parseYamlSubset, KINDS } = require('./claims.js');
const { RESOLVER_NAMES } = require('./resolvers.js');

const TIERS = ['trivial', 'lite', 'full', 'irreversible'];
const RANK = { trivial: 0, lite: 1, full: 2, irreversible: 3 };
const ENFORCEMENTS = ['shadow', 'block'];
const DEFAULT_TIER = 'lite'; // unmatched files — was set in qa-lead-pass.yml, now here

/**
 * Translate a glob to an anchored regex.
 *
 *   `**` between slashes  → zero or more path segments
 *   trailing `/**`        → this path or anything beneath it
 *   `*`                   → any run of characters within one segment
 *   `?`                   → one character within one segment
 *
 * Unlike the shell `case` globbing it replaces, `*` does NOT cross a `/`. That is the
 * one deliberate behaviour change, and `scripts/classifier.test.mjs` pins the cases
 * where it matters.
 */
function globToRegex(glob) {
  let re = '';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        const after = glob[i + 2];
        if (after === '/') { re += '(?:[^/]+/)*'; i += 3; continue; }
        if (after === undefined) {
          if (re.endsWith('/')) { re = re.slice(0, -1) + '(?:/.*)?'; }
          else { re += '.*'; }
          i += 2;
          continue;
        }
        re += '[^/]*'; i += 2; continue;
      }
      re += '[^/]*'; i++; continue;
    }
    if (c === '?') { re += '[^/]'; i++; continue; }
    re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    i++;
  }
  return new RegExp('^' + re + '$');
}

function loadRules(mapPath) {
  if (!fs.existsSync(mapPath)) {
    // Refuse rather than default. A missing tier map used to mean "skip auto-tier" in
    // the bash, i.e. every path silently classified as trivial. That is a fail-open on
    // the file that decides how hard everything else is reviewed.
    throw new Error(`classifier: tier map not found at ${mapPath} — refusing to classify with no rules`);
  }
  const doc = parseYamlSubset(fs.readFileSync(mapPath, 'utf8'));
  if (!doc || !Array.isArray(doc.rules)) {
    throw new Error(`classifier: ${mapPath} has no "rules:" list`);
  }
  return doc.rules.map((r, i) => {
    const where = `${mapPath} rules[${i}]`;
    if (typeof r.pattern !== 'string' || r.pattern === '') throw new Error(`${where}: pattern is required`);
    if (!TIERS.includes(r.tier)) throw new Error(`${where}: tier "${r.tier}" not in (${TIERS.join('|')})`);
    const enforcement = r.enforcement === undefined || r.enforcement === null ? 'shadow' : r.enforcement;
    if (!ENFORCEMENTS.includes(enforcement)) {
      throw new Error(`${where}: enforcement "${enforcement}" not in (${ENFORCEMENTS.join('|')})`);
    }
    const asList = (v, name, allowed) => {
      if (v === undefined || v === null) return [];
      if (!Array.isArray(v)) throw new Error(`${where}: ${name} must be a list`);
      const out = v.map(String);
      // The registry is closed. A rule may not name a resolver or a claim kind that no
      // code implements — that is how `claim-arithmetic` would have entered the system
      // as a mechanism nothing runs, which is the defect this rebuild exists to remove.
      if (allowed) {
        for (const item of out) {
          if (!allowed.includes(item)) {
            throw new Error(`${where}: ${name} entry "${item}" is not implemented (available: ${allowed.join(', ')})`);
          }
        }
      }
      return out;
    };
    return {
      pattern: r.pattern,
      regex: globToRegex(r.pattern),
      tier: r.tier,
      enforcement,
      resolvers: asList(r.resolvers, 'resolvers', RESOLVER_NAMES),
      required_claim_kinds: asList(r.required_claim_kinds, 'required_claim_kinds', KINDS),
      reason: typeof r.reason === 'string' ? r.reason : '',
    };
  });
}

function normalise(file) {
  return String(file).replace(/\\/g, '/').replace(/^\.\//, '');
}

/** Everything the system knows about one path. */
function classifyFile(file, rules) {
  const f = normalise(file);
  const matched = rules.filter((r) => r.regex.test(f));

  // Matched: the strictest matching rule wins. Unmatched: DEFAULT_TIER.
  //
  // The bash this replaces started its accumulator at `trivial`, so an unmatched path —
  // package.json, bin/warroom, every script in scripts/ — classified as trivial, while
  // the tier map's own footer said the default was lite. Another stated-vs-implemented
  // divergence, and this one had teeth: it rated the launcher a typo. The stated
  // default is the correct one and is now the implemented one.
  let tier = DEFAULT_TIER;
  let reason = 'no pattern matched — default tier';
  let pattern = null;
  if (matched.length > 0) {
    const top = matched.reduce((a, b) => (RANK[b.tier] > RANK[a.tier] ? b : a));
    tier = top.tier;
    reason = top.reason;
    pattern = top.pattern;
  }

  const resolvers = [...new Set(matched.flatMap((r) => r.resolvers))].sort();
  const kinds = [...new Set(matched.flatMap((r) => r.required_claim_kinds))].sort();
  const enforcement = matched.some((r) => r.enforcement === 'block') ? 'block' : 'shadow';
  return {
    file: f,
    tier,
    rank: RANK[tier],
    pattern,
    reason,
    resolvers,
    required_claim_kinds: kinds,
    enforcement,
    matched_patterns: matched.map((r) => r.pattern),
  };
}

/** The floor across a change set: the strictest tier any touched file demands. */
function classifyFiles(files, rules) {
  const per = files.map((f) => classifyFile(f, rules));
  let floor = { tier: 'trivial', rank: 0, file: null, pattern: null, reason: '' };
  for (const p of per) {
    if (p.rank > floor.rank) floor = { tier: p.tier, rank: p.rank, file: p.file, pattern: p.pattern, reason: p.reason };
  }
  return { floor, files: per };
}

module.exports = {
  TIERS,
  RANK,
  DEFAULT_TIER,
  globToRegex,
  loadRules,
  classifyFile,
  classifyFiles,
};
