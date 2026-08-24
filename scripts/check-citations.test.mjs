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

/**
 * A 20-line target file whose only symbol, `theSymbol`, sits on line 3.
 *
 * THE TRAILING NEWLINE IS LOAD-BEARING. POSIX text files end in one, and `split('\n')` on such a
 * file yields a final empty element. Built with a bare `join('\n')` this fixture had no trailing
 * newline, could not reproduce the shape of any file on disk, and so passed over an off-by-one
 * that made every real file read as one line longer than it is.
 */
const TARGET = [
  '// line 1',
  '// line 2',
  'function theSymbol() {',
  '  return 1;',
  '}',
  ...Array.from({ length: 15 }, (_, i) => `// filler ${i + 6}`),
].join('\n') + '\n';

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

test('the line after the last is past EOF — the trailing newline is not a line', () => {
  // The counterpart to the test above, and the one that actually catches the off-by-one:
  // `split('\n')` on a newline-terminated file yields a final empty element, so line 21 of a
  // 20-line file passed silently until that element was dropped.
  const root = fixture({
    'docs/a.md': 'See `target.js:21` here.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['line-beyond-eof']);
  assert.match(res.findings[0].message, /which has 20 lines/);
});

test('a file ending in a genuine blank line keeps it', () => {
  // Only ONE trailing element is dropped. `a\n\n` is two lines, the second of them empty.
  const root = fixture({
    'docs/a.md': 'See `blank.txt:2` and `blank.txt:3` here.\n',
    'src/blank.txt': 'first\n\n',
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['line-beyond-eof'], 'line 2 exists and is blank; line 3 does not');
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

// ── drift: the four false positives the review reproduced ────────────────────
//
// Each of these fired on real prose in this repo and each is pinned here, because a heuristic
// that was tuned once and never tested drifts straight back to where it was.

test('a sentence boundary hidden by markdown emphasis still breaks the pairing', () => {
  // `**bold.**` puts `*` between the `.` and the space, so a bare /[.;:!?]\s/ saw no boundary and
  // anchored on the PREVIOUS sentence's symbol. Reproduced at 2026-08-13-rethink-board.md:94.
  const root = fixture({
    'docs/a.md': '**The `otherThing` is decorative.** `target.js:19` iterates over everything.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.anchors_checked, 0, 'the anchor belongs to the previous sentence');
});

test('a symbol AFTER the locator anchors it — reading only backwards anchored the wrong symbol', () => {
  // Reproduced at PRODUCERS.md:191: anchored on `FleetView` while `windowUsage`, the symbol the
  // sentence actually asserts and which IS on the cited line, sat after the locator.
  const root = fixture({
    'docs/a.md': 'Which `Unrelated` already displays (`target.js:3`, `theSymbol`).\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), [], 'the trailing anchor is correct, so nothing is reported');
  assert.equal(res.stats.anchors_checked, 1);
});

test('a top-level directory name is a location, not a symbol', () => {
  // Reproduced at CONTROL-PLANE.md:395, anchored on `mission-control` — no slash and no
  // extension, so the path-like test passes it and a second exclusion is required.
  const root = fixture({
    'docs/a.md': 'The `src` collector at `target.js:19` reads it.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.anchors_checked, 0);
});

test('a following span across a conjunction is a sibling item, not an anchor', () => {
  // Reproduced at PRODUCERS.md:1243: `` `designer.md:7`, and `REQUIRED_FRONTMATTER` `` enumerates
  // two places a field is declared. It does not assert the second is at the first.
  const root = fixture({
    'docs/a.md': 'Declared in `target.js:19`, and `theSymbol` / range check elsewhere.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.anchors_checked, 0);
});

test('a following span across an additive separator is a sibling item', () => {
  // Reproduced at CONTROL-PLANE.md:1075: `` (`resolvers.js:307`) + correct `model_families` `` is
  // a work item, not a citation. The gap opens with `)` before the `+`.
  const root = fixture({
    'docs/a.md': 'Row 5 needs (`target.js:19`) + correct `theSymbol` here.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.anchors_checked, 0);
});

test('a BARE comma is not a list — the parenthetical citation still anchors', () => {
  // The counterweight to the two tests above. Excluding every comma re-broke PRODUCERS.md:191.
  // What marks a list is the conjunction, not the comma.
  const root = fixture({
    'docs/a.md': 'Displayed already (`target.js:19`, `theSymbol`).\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['anchor-drift'], 'anchored, and it genuinely has drifted');
  assert.equal(res.stats.anchors_checked, 1);
});

test('token matching is word-bounded — `pass` is not satisfied by `bypass`', () => {
  const root = fixture({
    'docs/a.md': 'The `pass` result at `res.js:1` is returned.\n',
    'src/res.js': 'const bypass = 1;\nconst password = 2;\n',
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['anchor-drift']);
  assert.equal(res.findings[0].distance, null, '`pass` appears nowhere as a whole token');
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

test('an arrow is a flow connector, not a clause — the call-chain shape', () => {
  // F9. `` `newproject` → `init-from-template.sh:124` → `install-war-room.sh` `` says the first
  // LEADS TO the second, not that the first is AT the second. TARGET-ARCHITECTURE.md:148.
  const root = fixture({
    'docs/a.md': '`someCommand` → `target.js:19` → `elsewhere`.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.deepEqual(kinds(res), []);
  assert.equal(res.stats.anchors_checked, 0);
});

// ── path-unresolved: "gone" is usually wrong ─────────────────────────────────

test('a renamed file gets a did-you-mean, not a bare "no such file"', () => {
  // F11. `ENFORCEMENT-DIAGNOSTIC.md` is really docs/06-codebase/2026-08-11-ENFORCEMENT-DIAGNOSTIC.md.
  const root = fixture({
    'docs/a.md': 'See `NOTES.md:1` for why.\n',
    'docs/2026-08-11-NOTES.md': 'a\n',
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['path-unresolved']);
  assert.equal(res.findings[0].suggestion, 'docs/2026-08-11-NOTES.md');
  assert.match(res.findings[0].message, /Did you mean `docs\/2026-08-11-NOTES\.md`\?/);
});

test('an ambiguous did-you-mean is withheld — a wrong suggestion gets acted on', () => {
  const root = fixture({
    'docs/a.md': 'See `NOTES.md:1` for why.\n',
    'docs/2026-08-11-NOTES.md': 'a\n',
    'docs/2026-08-12-NOTES.md': 'a\n',
  });
  const res = check(root);
  assert.deepEqual(kinds(res), ['path-unresolved']);
  assert.equal(res.findings[0].suggestion, undefined);
  assert.doesNotMatch(res.findings[0].message, /Did you mean/);
});

test('a bare basename does not report a phantom directory prefix', () => {
  // `indexOf('/')` is -1 without a slash, and slice(0,-1) chopped the last character: the first
  // draft told the reader `ENFORCEMENT-DIAGNOSTIC.m/` was not a directory of this repository.
  const root = fixture({
    'docs/a.md': 'See `nosuchfile.js:1` for why.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.doesNotMatch(res.findings[0].message, /is not a directory of this repository/);
});

test('--external-prefix marks a cross-repo pointer as unchecked, not dead', () => {
  const root = fixture({
    'docs/a.md': 'See `otherproj/.claude/agents/x.md:6-10` there.\n',
    'src/target.js': TARGET,
  });
  assert.deepEqual(kinds(check(root)), ['path-unresolved'], 'unmarked, it is a finding');

  const marked = check(root, ['--external-prefix', 'otherproj']);
  assert.deepEqual(kinds(marked), [], 'marked, it is not');
  assert.equal(marked.unchecked[0].reason, 'external');
  // Still visible: excused from the finding, never dropped from the report.
  assert.equal(marked.unchecked.length, 1);
});

test('--external-prefix silences only the prefix it names', () => {
  const root = fixture({
    'docs/a.md': 'See `otherproj/x.md:1` and `thirdproj/y.md:1`.\n',
    'src/target.js': TARGET,
  });
  const res = check(root, ['--external-prefix', 'otherproj']);
  assert.deepEqual(kinds(res), ['path-unresolved']);
  assert.match(res.findings[0].message, /thirdproj/);
});

// ── reporting: coverage is never omitted, resolution is never hidden ─────────

test('an ambiguous locator is identifiable, not merely counted', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:9999` for why.\n',
    'src/target.js': TARGET,
    'lib/target.js': TARGET,
  });
  const res = check(root);
  assert.equal(res.unchecked.length, 1);
  assert.deepEqual(res.unchecked[0].candidates.sort(), ['lib/target.js', 'src/target.js']);
  assert.equal(res.unchecked[0].reason, 'ambiguous');
  // and it is NOT a finding, so it cannot fail a --strict run
  assert.deepEqual(kinds(res), []);
  assert.equal(run(['--root', root, '--min-locators', '0', '--strict']).code, 0);
});

test('a finding names the file it opened and flags an inferred match', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:900` here.\n',
    'deep/src/target.js': TARGET,
  });
  const res = check(root);
  assert.equal(res.findings[0].target, 'deep/src/target.js');
  assert.equal(res.findings[0].resolution, 'basename');
  assert.equal(res.findings[0].cited, 'target.js');
  assert.match(res.findings[0].message, /deep\/src\/target\.js/);
  assert.match(res.findings[0].message, /matched to this file by unique basename/);
});

test('an exact match is not labelled as inferred', () => {
  const root = fixture({
    'docs/a.md': 'See `src/target.js:900` here.\n',
    'src/target.js': TARGET,
  });
  const res = check(root);
  assert.equal(res.findings[0].resolution, 'exact');
  assert.doesNotMatch(res.findings[0].message, /matched to this file by unique/);
});

test('the PASSING path still states coverage — no unqualified tick', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:3` here.\n',
    'src/target.js': TARGET,
  });
  const r = run(['--root', root, '--min-locators', '0']);
  assert.equal(r.code, 0);
  assert.doesNotMatch(r.out, /✓ citation check passed/, 'a bare pass manufactures confidence');
  assert.match(r.out, /NOT "the citations are good"/);
  assert.match(r.out, /RESOLUTION:/);
  // The locator has no anchor, so drift coverage is 0 of 1 — and a passing run must SAY so
  // rather than let the tick imply the drift check ran.
  assert.match(r.out, /DRIFT COVERAGE: 0 of 1 locator/);
  assert.match(r.out, /got existence\s+checks only/);
});

test('the WARN path states the same coverage as the passing path', () => {
  const root = fixture({
    'docs/a.md': 'See `target.js:900` here.\n',
    'src/target.js': TARGET,
  });
  const r = run(['--root', root, '--min-locators', '0']);
  assert.match(r.out, /RESOLUTION:/);
  assert.match(r.out, /DRIFT COVERAGE:/);
});

// ── the resolution source ─────────────────────────────────────────────────────

test('a real git checkout resolves through git ls-files, and ignores untracked files', () => {
  // F8: every real run takes this path, and every fixture above takes the walk fallback instead.
  // An untracked file is invisible to `git ls-files`, so a locator naming one must NOT resolve --
  // which is also the cheapest available proof that the git path, not the walk, was used.
  const root = fixture({
    'docs/a.md': 'See `tracked.js:900` and `untracked.js:1` here.\n',
    'tracked.js': TARGET,
    'untracked.js': TARGET,
  });
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', 'docs/a.md', 'tracked.js'], { cwd: root });

  const res = check(root);
  assert.deepEqual(kinds(res).sort(), ['line-beyond-eof', 'path-unresolved']);
  const beyond = res.findings.find((f) => f.kind === 'line-beyond-eof');
  assert.equal(beyond.target, 'tracked.js');
  const dead = res.findings.find((f) => f.kind === 'path-unresolved');
  assert.match(dead.message, /untracked\.js/);
});

// ── the harvester is the ledger's, not a second copy ──────────────────────────

test("the checker's notion of prose AGREES with ledger.mjs's, on the input that separates them", async () => {
  // This replaced a test that regex-matched the import statement in the source. Per
  // .claude/skills/writing-good-tests/SKILL.md — "Asserting that a script, skill, or config
  // contains an exact line proves only that the source is the source... 'The source text changed'
  // → run the artifact and assert its effects" — that was a change detector, and it would have
  // failed on `import * as ledger` while the constraint still held.
  //
  // The constraint worth testing is not "is it an import" but "do the two agree". A copy that
  // never drifts is harmless; a copy that drifts is the whole risk. So: an UNCLOSED FENCE, the
  // input where any reimplementation diverges first, with the expected value derived from
  // ledger.mjs rather than from the code under test.
  const doc = [
    '---', 'title: fm', 'x: `frontmatter.js:900`', '---', '',
    'Prose cites `target.js:900` here.', '',
    '```', '`fenced.js:900` is an example, not a citation.', '',
    'and the fence is never closed, so `after.js:900` stays opaque too.', '',
  ].join('\n');

  const { proseCodeSpans } = await import('./ledger.mjs');
  const expected = proseCodeSpans(doc)
    .map((s) => s.code)
    .filter((c) => /^[A-Za-z0-9._][A-Za-z0-9._/-]*\.[A-Za-z][A-Za-z0-9]{0,4}:\d+(-\d+)?$/.test(c));
  assert.deepEqual(expected, ['target.js:900'], 'ledger sees exactly one locator in this document');

  const root = fixture({
    'docs/a.md': doc,
    'src/target.js': TARGET, 'src/fenced.js': TARGET,
    'src/after.js': TARGET, 'src/frontmatter.js': TARGET,
  });
  const res = check(root);
  assert.equal(res.stats.locators, expected.length, 'the checker must harvest what ledger harvests');
  assert.deepEqual(kinds(res), ['line-beyond-eof']);
  assert.equal(res.findings[0].target, 'src/target.js', 'and it must be the one ledger named');
});

test('importing ledger.mjs does not run its CLI', () => {
  // The entry guard added for this import is load-bearing: without it, `import` fires main(),
  // which prints usage and exits 2 before the checker does anything.
  const probe = 'import("./scripts/ledger.mjs").then(m => console.log(typeof m.proseCodeSpans))';
  const out = execFileSync('node', ['-e', probe], { cwd: REPO, encoding: 'utf8' });
  assert.equal(out.trim(), 'function');
});
