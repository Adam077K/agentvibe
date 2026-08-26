// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml and to `npm run check` as `test:figures`.
//
// scripts/check-figures.test.mjs — the drift guard for scripts/lib/figures.js.
//
// A check that only ever runs against a tree where it passes has proved nothing about whether it
// CAN fail. So every case below drives `figureFindings()` against inputs it constructs, and the two
// that matter push from opposite sides:
//
//   • DOCUMENT SIDE — change a number in the prose, watch the finding name the file, the line, the
//     stated value and the derived one.
//   • CODE SIDE — leave the prose alone and move what the code derives (a step added to the
//     workflow text, a shorter STEPS list), watch the same figures go red.
//
// Only the second one proves the check is bound to the CODE rather than to a copy of the number,
// and it is the direction a document-only test can never reach. Both, or it is not a check.
//
// Everything here is pure: `figureFindings` takes text and numbers, `derive` takes text and the
// suite module. Nothing is read from disk except the real corpus for the two regression pins, and
// nothing from the corpus is ever executed — see the library header for why that is the design.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = require(path.join(REPO, 'scripts', 'lib', 'check-suite.js'));
const figures = require(path.join(REPO, 'scripts', 'lib', 'figures.js'));
const { FIGURES, derive, figureFindings, parseStated, stripBlockquotes } = figures;

const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const CI = read('.github/workflows/ci.yml');
const PKG = JSON.parse(read('package.json'));
const realDerived = () => derive({ ci: CI, pkg: PKG, suite });
const realFiles = () => Object.fromEntries([...new Set(FIGURES.map((f) => f.file))].map((rel) => [rel, read(rel)]));

const byId = (findings, id) => findings.filter((f) => f.id === id);

// ── the regression pins ──────────────────────────────────────────────────────────────────────

test('every documented figure agrees with the value the suite derives', () => {
  const findings = figureFindings({ files: realFiles(), derived: realDerived() });
  assert.deepEqual(findings, [], findings.map((f) => `[${f.kind}] ${f.message}`).join('\n'));
});

test('the registry is not empty, and coverage is a number rather than an impression', () => {
  assert.ok(FIGURES.length >= 20, `only ${FIGURES.length} figures wired; this check is worth what it covers`);
  const ids = FIGURES.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length, 'two registry entries share an id, so a finding cannot say which one fired');
});

test('every registry entry can actually assert — a capture group and a derivable value', () => {
  const derived = realDerived();
  for (const fig of FIGURES) {
    assert.ok(new RegExp(fig.locator.source).source.includes('('), `${fig.id}: locator has no group`);
    assert.ok(Number.isFinite(derived[fig.derive]), `${fig.id}: \`${fig.derive}\` is ${derived[fig.derive]}, not a number`);
    assert.ok(fig.what && fig.what.length > 10, `${fig.id}: no usable description, so a finding cannot explain itself`);
  }
});

// ── non-vacuity, direction 1: the DOCUMENT moves ─────────────────────────────────────────────

/**
 * Rewrite the figure an entry points at, using that entry's OWN locator.
 *
 * Never `.replace('44', '41')`: a mutation spelled with today's number stops applying the day the
 * number moves, and a mutation that does not apply is a test that asserts nothing. That happened
 * here within the hour — wiring this check took the figure from 44 to 46 and the literal mutation
 * silently matched nothing. The `notEqual` guard below is what caught it, so it stays.
 */
const rewrite = (text, fig, value) => {
  const out = text.replace(new RegExp(fig.locator.source, fig.locator.flags), (m, ...g) => {
    const groups = g.slice(0, g.length - 2).filter((x) => typeof x === 'string');
    return groups.reduce((acc, found) => acc.replace(found, String(value)), m);
  });
  assert.notEqual(out, text, `the mutation for ${fig.id} did not apply, so anything it proves is imaginary`);
  return out;
};

test('a figure edited in a document goes red, naming file, line, stated and derived', () => {
  const files = realFiles();
  const fig = FIGURES.find((f) => f.id === 'status-ci-run-steps');
  const derived = realDerived();
  const wrong = derived.ciRunSteps - 3;
  files['docs/STATUS.md'] = rewrite(files['docs/STATUS.md'], fig, wrong);

  const findings = figureFindings({ files, derived });
  const [hit] = byId(findings, 'status-ci-run-steps');
  assert.ok(hit, `the edited figure produced no finding: ${JSON.stringify(findings)}`);
  assert.equal(hit.kind, 'mismatch');
  assert.equal(hit.file, 'docs/STATUS.md');
  assert.equal(hit.stated, wrong);
  assert.equal(hit.expected, derived.ciRunSteps);
  assert.ok(hit.line > 0, 'the finding carries no line number');
  assert.match(hit.message, new RegExp(`docs/STATUS\\.md:\\d+ — status-ci-run-steps states ${wrong}, derived ${derived.ciRunSteps}`));
});

test('a figure spelled as a WORD is read and compared like any other', () => {
  const files = realFiles();
  const fig = FIGURES.find((f) => f.id === 'status-setup-steps');
  const derived = realDerived();
  assert.notEqual(derived.ciSetupStepsWithoutIf, 7, 'pick a different wrong word: this one is now the right answer');
  files['docs/STATUS.md'] = rewrite(files['docs/STATUS.md'], fig, 'Seven');

  const [hit] = byId(figureFindings({ files, derived }), 'status-setup-steps');
  assert.ok(hit, 'a word-spelled figure was not compared');
  assert.equal(hit.stated, 7);
  assert.equal(hit.expected, derived.ciSetupStepsWithoutIf);
});

// ── non-vacuity, direction 2: the CODE moves ─────────────────────────────────────────────────

test('a step added to the workflow moves the derived figure, and the untouched prose goes red', () => {
  // The prose is the real file, byte for byte. Only the code's input changed.
  const mutatedCi = `${CI}\n      - name: Injected by a test\n        if: ${'${{ !cancelled() }}'}\n        run: echo injected\n`;
  const derived = derive({ ci: mutatedCi, pkg: PKG, suite });
  assert.equal(derived.ciRunSteps, realDerived().ciRunSteps + 1, 'the mutation did not change what the code derives, so it proves nothing');

  const findings = figureFindings({ files: realFiles(), derived });
  for (const id of ['status-ci-run-steps', 'status-recipe-run-count', 'ci-sequential-checks', 'ci-guards-count']) {
    const [hit] = byId(findings, id);
    assert.ok(hit && hit.kind === 'mismatch', `${id} did not go red when the workflow gained a step`);
  }
});

test('a shorter STEPS list takes the floor figures down with it', () => {
  const shortSuite = { ...suite, STEPS: suite.STEPS.slice(0, -1) };
  const derived = derive({ ci: CI, pkg: PKG, suite: shortSuite });
  assert.equal(derived.suiteSteps, suite.STEPS.length - 1);

  const findings = figureFindings({ files: realFiles(), derived });
  for (const id of ['status-floor-tally', 'status-figure-is', 'status-steps-length-derivation', 'ci-steps-behind-one-exit']) {
    const [hit] = byId(findings, id);
    assert.ok(hit && hit.kind === 'mismatch', `${id} is not bound to STEPS.length`);
    assert.equal(hit.stated, suite.STEPS.length);
    assert.equal(hit.expected, suite.STEPS.length - 1);
  }
});

test('an alias that loses a link takes ci.yml`s per-alias figure with it', () => {
  const pkg = { ...PKG, scripts: { ...PKG.scripts, 'check:ledger': 'npm run test:claims && npm run test:ledger' } };
  const derived = derive({ ci: CI, pkg, suite });
  assert.equal(derived.ledgerAliasLinks, 2);
  const [hit] = byId(figureFindings({ files: realFiles(), derived }), 'ci-ledger-alias-links');
  assert.ok(hit && hit.kind === 'mismatch', 'the per-alias figure is not bound to aliasLinks()');
  assert.equal(hit.stated, realDerived().ledgerAliasLinks, 'the prose and the unmutated derivation disagree, which the regression pin should already have caught');
});

// ── failing closed ───────────────────────────────────────────────────────────────────────────

test('a locator that matches NOTHING is a finding, never a silent pass', () => {
  const findings = figureFindings({
    files: { 'x.md': 'nothing of interest here' },
    derived: { n: 1 },
    figures: [{ id: 'gone', file: 'x.md', derive: 'n', what: 'a figure that moved away', locator: /answer: (\d+)/ }],
  });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'unmatched');
  assert.match(findings[0].message, /now UNCHECKED/);
});

test('a locator that matches TWICE is a finding — two candidates is not an assertion', () => {
  const findings = figureFindings({
    files: { 'x.md': 'answer: 1\nanswer: 1\n' },
    derived: { n: 1 },
    figures: [{ id: 'twice', file: 'x.md', derive: 'n', what: 'a figure stated in two places', locator: /answer: (\d+)/ }],
  });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'ambiguous');
  assert.deepEqual(findings[0].lines, [1, 2]);
});

test('a derivation that is not a number is a finding, never a skip', () => {
  for (const value of [undefined, NaN, null, '44']) {
    const findings = figureFindings({
      files: { 'x.md': 'answer: 44' },
      derived: { n: value },
      figures: [{ id: 'nan', file: 'x.md', derive: 'n', what: 'a figure whose derivation broke', locator: /answer: (\d+)/ }],
    });
    assert.equal(findings.length, 1, `derived=${String(value)} produced no finding`);
    assert.equal(findings[0].kind, 'underivable');
  }
});

test('a file the registry names but nobody supplied is a finding', () => {
  const findings = figureFindings({ files: {}, derived: { n: 1 }, figures: [{ id: 'nofile', file: 'gone.md', derive: 'n', what: 'a figure in a file that moved', locator: /(\d+)/ }] });
  assert.equal(findings[0].kind, 'missing-file');
});

test('an empty registry is a finding — a green run must never mean "nothing was checked"', () => {
  const findings = figureFindings({ files: {}, derived: {}, figures: [] });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'empty-registry');
});

test('a captured value that is not a number is a finding, not a pass', () => {
  const findings = figureFindings({
    files: { 'x.md': 'answer: many' },
    derived: { n: 1 },
    figures: [{ id: 'words', file: 'x.md', derive: 'n', what: 'a figure stated vaguely', locator: /answer: (\w+)/ }],
  });
  assert.equal(findings[0].kind, 'unparseable');
});

// ── history is excluded, and the exclusion is load-bearing ───────────────────────────────────

test('history is stripped — and WITHOUT stripping the live figure becomes ambiguous, which is the proof it matters', () => {
  const raw = read('docs/STATUS.md');
  const locator = /\*\*`(\d+) of (\d+) · 0 failed` is the figure\./g;
  const rawHits = [...raw.matchAll(locator)];
  const strippedHits = [...stripBlockquotes(raw).matchAll(new RegExp(locator.source, 'g'))];

  assert.ok(rawHits.length >= 2, `docs/STATUS.md no longer states this figure twice (raw hits: ${rawHits.length}); the stripping is now untested rather than unnecessary — re-aim this control at another superseded figure`);
  assert.equal(strippedHits.length, 1, 'stripping blockquotes did not reduce the live figure to one occurrence');
  // The two must be DIFFERENT numbers, or stripping could be doing nothing and this would not show
  // it: a historical figure that happens to equal the live one proves nothing either way.
  assert.ok(
    new Set(rawHits.map((m) => m[1])).size >= 2,
    `every occurrence states the same number (${rawHits.map((m) => m[1]).join(', ')}), so this control cannot tell a stripped history from an unstripped one`
  );
  assert.equal(strippedHits[0][1], String(realDerived().suiteSteps), 'the surviving occurrence is not the live figure');
});

test('stripping preserves line numbers, so a finding still points at the real file', () => {
  const text = 'a\n> superseded\nb\n';
  assert.equal(stripBlockquotes(text).split('\n').length, text.split('\n').length);
  assert.equal(stripBlockquotes(text).split('\n')[2], 'b');
});

// ── the small parts ──────────────────────────────────────────────────────────────────────────

test('parseStated reads digits and words, and refuses everything else', () => {
  assert.equal(parseStated('44'), 44);
  assert.equal(parseStated('Three'), 3);
  assert.equal(parseStated(' fourteen '), 14);
  assert.equal(parseStated('many'), null);
  assert.equal(parseStated('4.4'), null);
  assert.equal(parseStated(''), null);
});

test('the checker executes nothing — the property the rejected recipe-runner got wrong', () => {
  // Textual, and stated as textual: it pins the design decision at the only place it can be seen
  // from, which is the absence of an execution API. A recipe runner destroyed an 834-file fixture
  // by executing a command lifted out of a documentation table; nothing here can, because nothing
  // here can execute at all.
  for (const rel of ['scripts/lib/figures.js', 'scripts/check-figures.mjs']) {
    const src = read(rel);
    assert.doesNotMatch(src, /child_process|execSync|execFileSync|spawnSync|\bspawn\(/, `${rel} reached for an execution API; this check must never run what it reads`);
  }
});
