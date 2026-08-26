// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:playbooks`.
//
// scripts/playbooks.test.mjs — the playbook linter, tested by constructing its failures.
//
// §3.5 defines a playbook in one sentence: it "declares the STAGES a category of work
// passes and the CLAIMS + CRITERIA required to exit each. It never declares method — the
// agent picks its own path inside every stage."
//
// That last clause is the design. Without a rule enforcing it, a playbook drifts back
// into the fifty lines of pipeline prose it replaced, and then there are two descriptions
// of one pipeline again. So `steps:`, `how:`, `method:` and friends are refused, and the
// test below builds that failure rather than assuming the rule fires.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { lintPlaybook, knownReviewLenses, knownDomainLenses } = require('../.claude/hooks/schema-lint.js');

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAYBOOK_DIR = path.join(REPO_ROOT, '.claude', 'playbooks');
const LENSES = knownReviewLenses();
const DOMAIN = knownDomainLenses();

const GOOD = `playbook: fixture
summary: "A playbook that exists purely to be well-formed"
stages:
  - id: frame
    goal: "Turn the request into an unambiguous outcome"
    lenses: [product]
    exit:
      - "claim(kind=user-language, verified_by=source)"
      - "criterion(success-is-measurable)"
  - id: review
    goal: "Judge the result independently of whoever produced it"
    exit:
      - "review(lens=correctness)"
    gate: qa-verdict
    dispatch:
      - task: "Independent review of the diff"
        engine: reviewer
`;

function lint(yaml, name = 'fixture') {
  const tmp = path.join(PLAYBOOK_DIR, `${name}.yml`);
  fs.writeFileSync(tmp, yaml);
  try {
    return lintPlaybook(tmp, LENSES, DOMAIN).issues;
  } finally {
    fs.unlinkSync(tmp);
  }
}

// ── The shipped playbooks ───────────────────────────────────────────────────

test('all six seed playbooks lint clean', () => {
  const files = fs.readdirSync(PLAYBOOK_DIR).filter((f) => f.endsWith('.yml')).sort();
  assert.deepEqual(files, [
    'design-pass.yml', 'launch-landing-page.yml', 'price-a-product.yml',
    'research-question.yml', 'ship-feature.yml', 'validate-a-market.yml',
  ], 'the seed set named in AGENT-SYSTEM-REBUILD.md §3.5');
  for (const f of files) {
    assert.deepEqual(lintPlaybook(path.join(PLAYBOOK_DIR, f), LENSES, DOMAIN).issues, [], f);
  }
});

test('the fixture is valid, so the failures below are the rule and not the fixture', () => {
  assert.deepEqual(lint(GOOD), []);
});

// ── "It never declares method" ──────────────────────────────────────────────

test('a stage carrying steps: is refused — a playbook declares exits, not method', () => {
  const bad = GOOD.replace('    lenses: [product]\n', '    lenses: [product]\n    steps: ["do the thing", "then the other thing"]\n');
  const issues = lint(bad);
  assert.equal(issues.length, 1);
  assert.match(issues[0], /carries "steps" — a playbook declares stages and exit criteria, never method/);
});

test('how:, method: and implementation: are refused the same way', () => {
  for (const key of ['how', 'method', 'implementation', 'procedure', 'tasks']) {
    const bad = GOOD.replace('    lenses: [product]\n', `    lenses: [product]\n    ${key}: ["something"]\n`);
    assert.match(lint(bad).join('\n'), new RegExp(`carries "${key}"`), key);
  }
});

// ── References must resolve ─────────────────────────────────────────────────

test('a playbook naming a review lens that does not exist is refused', () => {
  const bad = GOOD.replace('review(lens=correctness)', 'review(lens=vibes)');
  assert.match(lint(bad).join('\n'), /review lens "vibes" is not in .claude\/review-lenses.yml/);
});

test('a playbook naming a domain lens that does not exist is refused', () => {
  const bad = GOOD.replace('lenses: [product]', 'lenses: [astrology]');
  assert.match(lint(bad).join('\n'), /lens "astrology" is not in .claude\/lenses.yml/);
});

test('a claim exit with an invented kind is refused', () => {
  const bad = GOOD.replace('kind=user-language', 'kind=hunch');
  assert.match(lint(bad).join('\n'), /claim kind "hunch" is not a claim kind/);
});

test('a claim exit with an invented resolver is refused', () => {
  const bad = GOOD.replace('verified_by=source', 'verified_by=vibes');
  assert.match(lint(bad).join('\n'), /verified_by "vibes" is not a resolver/);
});

test('an exit condition that is not one of the three forms is refused', () => {
  const bad = GOOD.replace('"criterion(success-is-measurable)"', '"make sure it is good"');
  assert.match(lint(bad).join('\n'), /is not claim\(\.\.\.\), review\(\.\.\.\) or criterion\(\.\.\.\)/);
});

test('a dispatch naming an engine that does not exist is refused', () => {
  const bad = GOOD.replace('engine: reviewer', 'engine: chief-of-staff');
  assert.match(lint(bad).join('\n'), /is not an engine/);
});

test('an unknown gate is refused', () => {
  const bad = GOOD.replace('gate: qa-verdict', 'gate: probably-fine');
  assert.match(lint(bad).join('\n'), /gate "probably-fine" is not one of/);
});

// ── Structure ───────────────────────────────────────────────────────────────

test('a stage with no exit is refused — a stage nobody can leave is not a stage', () => {
  const bad = GOOD.replace(/    exit:\n      - "review\(lens=correctness\)"\n/, '');
  assert.match(lint(bad).join('\n'), /exit is required/);
});

test('a one-stage playbook is refused', () => {
  const bad = `playbook: fixture
summary: "Only one stage, which is not a sequence"
stages:
  - id: only
    goal: "Do the whole thing in one go"
    exit: ["criterion(done)"]
`;
  assert.match(lint(bad).join('\n'), /at least 2 — one stage is not a sequence/);
});

test('a playbook whose id does not match its filename is refused', () => {
  assert.match(lint(GOOD.replace('playbook: fixture', 'playbook: something-else')).join('\n'), /does not match filename/);
});

test('duplicate stage ids are refused', () => {
  assert.match(lint(GOOD.replace('id: review', 'id: frame')).join('\n'), /duplicate stage id "frame"/);
});

test('an unparseable playbook is reported, never silently skipped', () => {
  assert.match(lint('playbook: fixture\n\tstages: []\n').join('\n'), /tab in indentation/);
});

// ── The dispatch content 4b depends on ──────────────────────────────────────

test('the seed playbooks actually rehouse the dispatch tables', () => {
  // This is the reason Phase 5 runs before 4b. The lenses carry procedure and
  // deliberately carry no routing; 8 of 26 agents held worker-dispatch tables, and
  // deleting those agents with nothing holding the hand-offs was the gap.
  const { parseYamlSubset } = require('./lib/claims.js');
  let dispatches = 0;
  const withDispatch = new Set();
  for (const f of fs.readdirSync(PLAYBOOK_DIR).filter((x) => x.endsWith('.yml'))) {
    const doc = parseYamlSubset(fs.readFileSync(path.join(PLAYBOOK_DIR, f), 'utf8'));
    for (const s of doc.stages) {
      if (Array.isArray(s.dispatch) && s.dispatch.length) {
        dispatches += s.dispatch.length;
        withDispatch.add(f);
      }
    }
  }
  assert.ok(dispatches >= 8, `expected the dispatch tables to be rehoused, found ${dispatches} entries`);
  assert.ok(withDispatch.size >= 4, `expected several playbooks to carry dispatch, got ${withDispatch.size}`);
});

// ── The step this file shares, and why the assertion lives HERE ─────────────

test('test:playbooks still runs scripts/gates.test.mjs, serially', () => {
  // TWO COMMANDS REMOVE THE ENTIRE GATE-WIRING GUARD AND LEAVE `npm run check` AT 46 OF 46:
  // drop `scripts/gates.test.mjs` from this step in package.json, then `npm run build:map`, which
  // `check:map` would demand anyway. Nothing pinned the membership. A reviewer measured it by
  // doing it — 46 of 46 over a tree with three live findings in it.
  //
  // THIS ASSERTION IS IN playbooks.test.mjs AND NOT IN gates.test.mjs, and that placement is the
  // whole point: a file cannot assert its own membership in the step that runs it. Removed from
  // the step, it does not run, so its assertion does not run either, and the check reports green
  // by not existing. This file is the sibling in the same step, so it still runs and still fails.
  //
  // The step NAME lives in scripts/lib/check-suite.js, which is `irreversible` and deliberately
  // untouched here. Which FILES the step runs lives in package.json, which is `lite` — so the
  // cheap edit is the unguarded one, and this is the guard.
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  const step = pkg.scripts['test:playbooks'];
  assert.ok(step, 'package.json has no test:playbooks step');
  assert.match(step, /scripts\/gates\.test\.mjs/, 'the gate-wiring assertions must run in this step');
  assert.match(step, /scripts\/playbooks\.test\.mjs/, 'and so must this file, or nothing enforces the line above');
  // Not cosmetic: playbooks.test.mjs writes .claude/playbooks/fixture.yml into the live tree, and
  // gates.test.mjs reads that directory. Concurrent, it threw ENOENT in 5 of 10 runs; serial, 0 of 10.
  assert.match(step, /--test-concurrency=1/, 'removing this reintroduces a measured 50% flake');
});

test('every playbook ends in a stage that gates or reviews', () => {
  // Work that has no last check is work that ships unreviewed.
  const { parseYamlSubset } = require('./lib/claims.js');
  for (const f of fs.readdirSync(PLAYBOOK_DIR).filter((x) => x.endsWith('.yml'))) {
    const doc = parseYamlSubset(fs.readFileSync(path.join(PLAYBOOK_DIR, f), 'utf8'));
    const last = doc.stages[doc.stages.length - 1];
    const gated = last.gate !== undefined || last.exit.some((e) => e.startsWith('review('));
    assert.ok(gated, `${f}: final stage "${last.id}" neither gates nor reviews`);
  }
});
