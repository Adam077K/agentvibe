// POSTURE: WARN. Not wired to CI by the PR that introduced it — see check-citations.mjs's header.
// This test itself is ordinary and blocking: `npm run check:citations` runs it.
//
// scripts/check-citations.test.mjs — mutation gate for the citation-range checker.
//
// EVERY CASE CONSTRUCTS ITS DEFECT. Nothing here asserts against a live repo file: those change
// under you, and a test pinned to `schema-lint.js:597` becomes exactly the rotted locator this
// checker exists to find. The fixtures are temp dirs with two or three files, so each assertion
// names one behaviour and one only.
//
// The method is the one prompt-standard.test.mjs binds itself to, applied to a checker rather
// than a linter:
//   1. every finding kind must FIRE on a constructed violation;
//   2. every finding kind must be SILENT on the constructed clean case;
//   3. the postures (WARN exits 0, --strict exits 1, non-vacuity exits 1 either way) are asserted,
//      because a checker whose exit code is wrong is a checker nothing acts on.
//
// Case 2 is not ceremony. The naive form of the drift rule reported 80.7% of everything it looked
// at; a rule that fires on almost every input is not a rule, and only a clean-case assertion
// catches that.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'check-citations.mjs');

const roots = [];

/**
 * A fixture repo. `files` is a flat map of relative path -> contents. ROOT is not a git checkout,
 * so the checker's `git ls-files` call fails and it falls back to the filesystem walk — which is
 * the fallback path being exercised here, deliberately.
 */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'citations-fixture-'));
  roots.push(root);
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
  return root;
}

process.on('exit', () => {
  for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true }); } catch { /* best effort */ } }
});

function run(args) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out: stdout };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '').toString(), err: (e.stderr || '').toString() };
  }
}

/** Run over a fixture with the non-vacuity floor lowered out of the way unless a case wants it. */
function check(root, extra = []) {
  const r = run(['--root', root, '--json', '--min-locators', '0', ...extra]);
  return { code: r.code, ...JSON.parse(r.out) };
}

const kinds = (res) => res.findings.map((f) => f.kind).sort();

/** A 20-line target file whose only symbol, `theSymbol`, sits on line 3. */
const TARGET = [
  '// line 1',
  '// line 2',
  'function theSymbol() {',
  '  return 1;',
  '}',
  ...Array.from({ length: 15 }, (_, i) => `// filler ${i + 6}`),
].join('\n');

// ── existence: path-unresolved ────────────────────────────────────────────────

test('path-unresolved fires when the cited file matches no tracked file', () => {
  const root = fixture({
    'docs/a.md': 'See `nosuchfile.js:12` for why.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['path-unresolved']);
  assert.equal(res.stats.unresolved, 1);
});

test('path-unresolved is silent when the file resolves by bare basename', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:12` for why.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.resolved.basename, 1);
});

test('a basename carried by two files is ambiguous and is checked against neither', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:9999` for why.\n', // beyond EOF in both, and still not reported
    'src/target.js': TARGET,
    'lib/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), [], 'guessing which file was meant would manufacture a finding');
  assert.equal(res.stats.ambiguous, 1);
});

test('a unique path suffix resolves', () => {
  const root = fixture({
    'docs/a.md': 'See `src/target.js:12` here.\n',
    'deep/nested/src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.resolved.suffix, 1);
});

// ── existence: the line-number classes ────────────────────────────────────────

test('line-beyond-eof fires on a single line past the end', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:900` here.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['line-beyond-eof']);
  assert.match(res.findings[0].message, /which has 20 lines/);
});

test('range-beyond-eof fires when only the end is past EOF', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:18-900` here.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['range-beyond-eof']);
});

test('range-reversed fires when the range runs backwards', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:18-4` here.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['range-reversed']);
});

test('line-zero fires — files start at line 1', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:0` here.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['line-zero']);
});

test('a range that lands entirely inside the file is silent', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:3-5` here.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
});

test('the last line of the file is in range, not past it', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:20` here.\n', // TARGET is exactly 20 lines
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), [], 'an off-by-one here would fire on every citation of a last line');
});

// ── the harvester: what is and is not a locator ───────────────────────────────

test('a locator inside a fenced code block is not harvested', () => {
  const root = fixture({
    'docs/a.md': ['Prose.', '', '```', 'See `target.js:900` in the example.', '```', ''].join('\n'),
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), [], 'an example in a fence is an example, not a citation');
  assert.equal(res.stats.locators, 0);
});

test('a host:port is not a locator', () => {
  const root = fixture({
    'docs/a.md': 'The server listens on `127.0.0.1:3000` locally.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.equal(res.stats.locators, 0, 'a trailing .1 reads as an extension unless the rule forbids it');
  assert.deepEqual(kinds(res), []);
});

test('a span that merely contains a locator is not harvested', () => {
  const root = fixture({
    'docs/a.md': 'See `run target.js:900 now` for why.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.equal(res.stats.locators, 0);
});

test('an illustrative placeholder path is skipped, not reported', () => {
  const root = fixture({
    'docs/a.md': 'Cite it as `exact/path/to/existing.py:123-145` in the plan.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.skipped, 1);
});

test('a filename template is skipped, not reported as a dead path', () => {
  const root = fixture({
    'docs/a.md': 'Write it to `docs/sessions/YYYY-MM-DD-role-slug.md:5` at close.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.skipped, 1);
});

test('a glob never becomes a locator candidate at all', () => {
  // Not a skip() case: LOCATOR_RE's path character class excludes `*`, so the span is not a
  // locator. Asserted here so nobody "fixes" skip() by re-adding an unreachable glob branch.
  const root = fixture({
    'docs/a.md': 'Everything under `.claude/hooks/*.js:12` matches.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.locators, 0);
  assert.equal(res.stats.skipped, 0);
});

// ── drift: the anchor rule ────────────────────────────────────────────────────

test('anchor-drift fires when the named symbol is far from the cited range', () => {
  const root = fixture({
    // theSymbol is on line 3; the citation points at line 19, 16 lines away — past the slack of 10.
    'docs/a.md': 'The guard `theSymbol` at `target.js:19` refuses it.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['anchor-drift']);
  assert.equal(res.findings[0].distance, 16);
  assert.equal(res.findings[0].anchor, 'theSymbol');
});

test('anchor-drift is silent when the symbol is inside the cited range', () => {
  const root = fixture({
    'docs/a.md': 'The guard `theSymbol` at `target.js:3` refuses it.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.anchors_checked, 1, 'silent because it passed, not because it was skipped');
});

test('anchor-drift is silent inside the slack — the cite-the-body idiom', () => {
  const root = fixture({
    // Citing line 5 (the closing brace) for a function named on line 3 is a correct citation.
    'docs/a.md': 'The guard `theSymbol` at `target.js:5` refuses it.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), [], 'this is the known false-positive mode the slack exists to suppress');
});

test('--anchor-slack 0 unsuppresses the cite-the-body idiom', () => {
  const root = fixture({
    'docs/a.md': 'The guard `theSymbol` at `target.js:5` refuses it.\n',
    'src/target.js': TARGET,
  });
  assert.deepEqual(kinds(check(root, ['--anchor-slack', '0'])), ['anchor-drift']);
});

test('a symbol absent from the file entirely reports a null distance', () => {
  const root = fixture({
    'docs/a.md': 'The guard `absentSymbol` at `target.js:3` refuses it.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['anchor-drift']);
  assert.equal(res.findings[0].distance, null);
  assert.match(res.findings[0].message, /appears nowhere in/);
});

test('a clause between the anchor and the locator breaks the pairing', () => {
  const root = fixture({
    'docs/a.md':
      'The guard `theSymbol` is the whole point here, and separately `target.js:19` is worth reading.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), [], 'pairing across a clause is what took the naive rule to 80.7%');
  assert.equal(res.stats.anchors_checked, 0);
});

test('a markdown table cell wall breaks the pairing', () => {
  const root = fixture({
    'docs/a.md': '| rule | `theSymbol` | `target.js:19` |\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.anchors_checked, 0);
});

test('a path-like anchor is a cross-reference and is not checked', () => {
  const root = fixture({
    // `other.js` will never appear inside target.js; demanding it manufactures a finding.
    'docs/a.md': 'See `other.js` at `target.js:19` too.\n',
    'src/target.js': TARGET,
    'src/other.js': '// unrelated\n',
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.anchors_checked, 0);
});

test('--no-anchors drops the drift class and keeps the existence class', () => {
  const root = fixture({
    'docs/a.md': 'The guard `theSymbol` at `target.js:19` refuses it.\nAlso `target.js:900` here.\n',
    'src/target.js': TARGET,
  });
  assert.deepEqual(kinds(check(root)), ['anchor-drift', 'line-beyond-eof']);
  assert.deepEqual(kinds(check(root, ['--no-anchors'])), ['line-beyond-eof']);
});

// ── posture ───────────────────────────────────────────────────────────────────

test('WARN is the default posture: findings do not exit 1', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:900` here.\n',
    'src/target.js': TARGET,
  });
  const res = run(['--root', root, '--min-locators', '0']);
  assert.equal(res.code, 0);
  assert.match(res.out, /line-beyond-eof/);
  assert.match(res.out, /does not block/);
});

test('--strict exits 1 on the same findings', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:900` here.\n',
    'src/target.js': TARGET,
  });
  assert.equal(run(['--root', root, '--min-locators', '0', '--strict']).code, 1);
});

test('a clean tree exits 0 under --strict', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:3` here.\n',
    'src/target.js': TARGET,
  });
  assert.equal(run(['--root', root, '--min-locators', '0', '--strict']).code, 0);
});

test('the non-vacuity floor FAILS even in WARN posture', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:3` here.\n',
    'src/target.js': TARGET,
  });
  const res = run(['--root', root, '--min-locators', '50']);
  assert.equal(res.code, 1, 'a checker that finds nothing must fail, not report clean');
  assert.match(res.err, /non-vacuity/);
  assert.match(res.err, /harvested 1 locator/);
});

test('a tree with no markdown at all fails as vacuous rather than passing', () => {
  const root = fixture({ 'src/target.js': TARGET });
  const res = run(['--root', root, '--min-locators', '0']);
  assert.equal(res.code, 1);
  assert.match(res.err, /no tracked \.md files/);
});

// ── the harvester is the ledger's, not a second copy ──────────────────────────

test('the harvester is imported from ledger.mjs rather than reimplemented', () => {
  const src = fs.readFileSync(SCRIPT, 'utf8');
  assert.match(
    src,
    /import\s*\{\s*proseCodeSpans\s*\}\s*from\s*'\.\/ledger\.mjs'/,
    'two implementations of "what counts as prose here" disagree on the first unclosed fence',
  );
  assert.doesNotMatch(src, /function\s+proseCodeSpans/, 'that is the copy, not the import');
});

test('importing ledger.mjs does not run its CLI', () => {
  // The entry guard added for this import is load-bearing: without it, `import` fires main(),
  // which prints usage and exits 2 before the checker does anything.
  const probe = 'import("./scripts/ledger.mjs").then(m => console.log(typeof m.proseCodeSpans))';
  const out = execFileSync('node', ['-e', probe], { cwd: REPO, encoding: 'utf8' });
  assert.equal(out.trim(), 'function');
});
