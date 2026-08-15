// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:lenses`.
//
// scripts/lenses.test.mjs — the lens linter, tested by constructing its failures.
//
// AGENT-SYSTEM-REBUILD.md §7 names the risk this file guards: "Lens files are prose in
// YAML. They rot exactly as agent definitions did unless the linter checks their content,
// not only their shape." A shape-only linter would pass a lens whose every step said
// "handle it appropriately", which is how the agent prose rotted in the first place.
//
// Each test builds the bad lens and asserts the linter refuses it. The Phase 2 lesson is
// the reason: six install guards were each verified by hand, all six passed, and one still
// shipped broken because the mismatch the bug needed was never constructed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { lintLensFile } = require('../.claude/hooks/schema-lint.js');

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Write a lens file into the repo tree (so relative `sources:` resolve) and lint it. */
function lintYaml(yaml, kind) {
  const tmp = path.join(REPO_ROOT, `.lens-fixture-${process.pid}-${Math.abs(yaml.length)}.yml`);
  fs.writeFileSync(tmp, yaml);
  try {
    return lintLensFile(tmp, kind).issues;
  } finally {
    fs.unlinkSync(tmp);
  }
}

const GOOD_DOMAIN = `version: 1
lenses:
  - id: example
    summary: "A lens that exists purely to be well-formed"
    applies_to: [sourcer]
    procedure:
      - "Pull live numbers from the system of record rather than recalling them"
      - "Label every number as fact, estimate with a source, or assumed"
      - "State reversibility before the recommendation, not after it"
    refuses:
      - "a single-point projection"
    requires_claims: [external-fact]
    sources: ["git:.claude/agents/cbo.md@cda6de9"]
`;

const GOOD_REVIEW = `version: 1
review_lenses:
  - id: example
    summary: "A review lens that exists purely to be well-formed"
    checks:
      - "Inputs crossing a trust boundary are validated against a stated schema"
      - "Error paths return rather than continuing on bad state"
    blocking_severities: [p1]
    scope: diff-only
    independent: false
    model_families: [anthropic]
    sources: ["git:.claude/agents/code-reviewer.md@cda6de9"]
`;

// ── The live files ──────────────────────────────────────────────────────────

test('the shipped lens files lint clean', () => {
  assert.deepEqual(lintLensFile(path.join(REPO_ROOT, '.claude', 'lenses.yml'), 'domain').issues, []);
  assert.deepEqual(lintLensFile(path.join(REPO_ROOT, '.claude', 'review-lenses.yml'), 'review').issues, []);
});

test('every shipped lens records provenance that resolves', () => {
  // A lens may not claim expertise it cannot point at. Same dead-path discipline
  // check-registration.mjs applies to governing docs.
  const r = lintLensFile(path.join(REPO_ROOT, '.claude', 'lenses.yml'), 'domain');
  assert.ok(r.count >= 8, `expected the full lens set, got ${r.count}`);
});

test('the fixtures themselves are valid, so failures below are the rule and not the fixture', () => {
  assert.deepEqual(lintYaml(GOOD_DOMAIN, 'domain'), []);
  assert.deepEqual(lintYaml(GOOD_REVIEW, 'review'), []);
});

// ── Content rules ───────────────────────────────────────────────────────────

test('a vague, unfalsifiable step is refused', () => {
  // "The spacing looks off" is not a finding — design-critic's own anti-pattern.
  const bad = GOOD_DOMAIN.replace(
    '"State reversibility before the recommendation, not after it"',
    '"Check that the output looks reasonable and reads nicely"');
  const issues = lintYaml(bad, 'domain');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /vague and unfalsifiable/);
});

test('a vague step WITH a measurable anchor is accepted', () => {
  const ok = GOOD_DOMAIN.replace(
    '"State reversibility before the recommendation, not after it"',
    '"Reject spacing that looks off only when it differs from the written design system"');
  assert.deepEqual(lintYaml(ok, 'domain'), []);
});

test('a placeholder step is refused', () => {
  const bad = GOOD_DOMAIN.replace('"State reversibility before the recommendation, not after it"', '"TODO: write this step"');
  assert.match(lintYaml(bad, 'domain').join('\n'), /is a placeholder/);
});

test('prose that MENTIONS a TODO is not itself a placeholder', () => {
  // Regression: the first version of this rule failed a real review check reading
  // "No placeholder, stub or TODO shipped as a deliverable".
  const ok = GOOD_REVIEW.replace(
    '"Error paths return rather than continuing on bad state"',
    '"No placeholder, stub or TODO shipped as a deliverable"');
  assert.deepEqual(lintYaml(ok, 'review'), []);
});

test('a procedure step that describes instead of instructing is refused', () => {
  const bad = GOOD_DOMAIN.replace(
    '"State reversibility before the recommendation, not after it"',
    '"The analysis should carry a sensitivity range across scenarios"');
  assert.match(lintYaml(bad, 'domain').join('\n'), /reads as description, not instruction/);
});

test('a refuses entry may be a noun phrase — it names a thing, not an action', () => {
  const ok = GOOD_DOMAIN.replace('"a single-point projection"', '"an unlabelled number in a model"');
  assert.deepEqual(lintYaml(ok, 'domain'), []);
});

test('a lens with fewer than three steps is not encoded expertise', () => {
  const bad = GOOD_DOMAIN.replace('      - "State reversibility before the recommendation, not after it"\n', '');
  assert.match(lintYaml(bad, 'domain').join('\n'), /that is not encoded expertise/);
});

test('a lens with no refuses is refused — the anti-patterns are where the expertise is', () => {
  const bad = GOOD_DOMAIN.replace(/    refuses:\n      - "a single-point projection"\n/, '');
  assert.match(lintYaml(bad, 'domain').join('\n'), /refuses is required/);
});

// ── Provenance ──────────────────────────────────────────────────────────────

test('a lens citing a source that does not exist is refused', () => {
  const bad = GOOD_DOMAIN.replace('"git:.claude/agents/cbo.md@cda6de9"', '".claude/agents/chief-vibes-officer.md"');
  assert.match(lintYaml(bad, 'domain').join('\n'), /does not exist/);
});

test('a lens citing a git revision that does not contain the file is refused', () => {
  // Provenance survives deletion by pointing into history — but only real history.
  const bad = GOOD_DOMAIN.replace('git:.claude/agents/cbo.md@cda6de9', 'git:.claude/agents/never-existed.md@cda6de9');
  assert.match(lintYaml(bad, 'domain').join('\n'), /does not resolve in git history/);
});

test('a lens citing a SHIM is refused — a shim holds no expertise', () => {
  // Fired on eight real lenses the moment Phase 4b turned their sources into shims.
  // A 24-line file that points at an engine is not where the procedure came from.
  const bad = GOOD_DOMAIN.replace('"git:.claude/agents/cbo.md@cda6de9"', '".claude/agents/ceo.md"');
  const issues = lintYaml(bad, 'domain');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /is a shim and holds no expertise/);
});

test('a lens with no sources at all is refused', () => {
  const bad = GOOD_DOMAIN.replace(/    sources: \["git:.claude\/agents\/cbo.md@cda6de9"\]\n/, '');
  assert.match(lintYaml(bad, 'domain').join('\n'), /sources is required/);
});

test('a lens aimed at an engine that does not exist is refused', () => {
  const bad = GOOD_DOMAIN.replace('applies_to: [sourcer]', 'applies_to: [chief-of-staff]');
  assert.match(lintYaml(bad, 'domain').join('\n'), /is not an engine/);
});

test('a lens requiring a claim kind that does not exist is refused', () => {
  const bad = GOOD_DOMAIN.replace('requires_claims: [external-fact]', 'requires_claims: [vibes]');
  assert.match(lintYaml(bad, 'domain').join('\n'), /is not a claim kind/);
});

// ── The independence rule, shared with risk:high claim panels ───────────────

test('an independent review lens with one model family FAILS the lint', () => {
  // Phase 4's stated gate criterion. Same predicate as risk:high judge panels —
  // independenceIssue() in scripts/lib/claims.js, deliberately not reimplemented.
  const bad = GOOD_REVIEW
    .replace('independent: false', 'independent: true')
    .replace('model_families: [anthropic]', 'model_families: [anthropic]');
  const issues = lintYaml(bad, 'review');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /independent:true requires >=2 distinct model families, got 1/);
  assert.match(issues[0], /one family agreeing with itself is one opinion/);
});

test('listing the same family twice does not make a panel independent', () => {
  const bad = GOOD_REVIEW
    .replace('independent: false', 'independent: true')
    .replace('model_families: [anthropic]', 'model_families: [anthropic, anthropic]');
  assert.match(lintYaml(bad, 'review').join('\n'), /got 1/);
});

test('two distinct families satisfy the independence rule', () => {
  const ok = GOOD_REVIEW
    .replace('independent: false', 'independent: true')
    .replace('model_families: [anthropic]', 'model_families: [anthropic, openai]');
  assert.deepEqual(lintYaml(ok, 'review'), []);
});

test('every shipped review lens marked independent actually is, by its declared mode', () => {
  // The rule did not weaken on 2026-08-15, it gained a second satisfiable mode. `vendor`
  // still means >=2 families. `provenance` means one family is fine BUT the judge must not
  // see the producer's case — which is only obtainable when the lens judges an artifact the
  // reviewer can read for itself. A lens claiming provenance over `whole-artifact` would be
  // reading the producer's own account of its work, which is the priming the mode prevents.
  const yaml = fs.readFileSync(path.join(REPO_ROOT, '.claude', 'review-lenses.yml'), 'utf8');
  const { parseYamlSubset } = require('./lib/claims.js');
  const doc = parseYamlSubset(yaml);
  const independent = doc.review_lenses.filter((l) => l.independent === true);
  assert.ok(independent.length >= 2, 'at least some lenses should claim independence');
  for (const l of independent) {
    assert.ok(['vendor', 'provenance'].includes(l.independence),
      `${l.id} claims independence without saying how (independence: vendor|provenance)`);
    if (l.independence === 'vendor') {
      assert.ok(new Set(l.model_families).size >= 2, `${l.id} claims vendor independence with one family`);
    } else {
      assert.notEqual(l.scope, 'whole-artifact',
        `${l.id} claims provenance independence over the whole artifact, which requires the producer's account of it`);
    }
  }
});

test('a lens claiming independence without saying how FAILS the lint', () => {
  // The default must not silently become the satisfiable mode. An unstated mode is checked
  // as `vendor`, so a one-family lens that forgets to declare `independence:` still fails.
  const issues = lintYaml(GOOD_REVIEW
    .replace('independent: false', 'independent: true'), 'review');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /requires >=2 distinct model families/);
});

test('provenance independence is refused over scope: whole-artifact', () => {
  const issues = lintYaml(GOOD_REVIEW
    .replace('independent: false', 'independent: true\n    independence: provenance')
    .replace('scope: diff-only', 'scope: whole-artifact'), 'review');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /incompatible with scope:whole-artifact/);
});

test('provenance independence with one family PASSES — the mode that made three lenses runnable', () => {
  const ok = GOOD_REVIEW
    .replace('independent: false', 'independent: true\n    independence: provenance');
  assert.deepEqual(lintYaml(ok, 'review'), []);
});

// ── Failing closed ──────────────────────────────────────────────────────────

test('an unparseable lens file is reported, never silently skipped', () => {
  const issues = lintYaml('lenses:\n\t- id: tabbed\n', 'domain');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /tab in indentation/);
});

test('a lens file with no lenses is a failure, not an empty pass', () => {
  assert.match(lintYaml('version: 1\nlenses: []\n', 'domain').join('\n'), /no non-empty "lenses:" list/);
});

test('a missing lens file is reported', () => {
  const issues = lintLensFile(path.join(os.tmpdir(), 'definitely-not-here.yml'), 'domain');
  assert.match(issues.issues.join('\n'), /missing/);
});
