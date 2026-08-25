// POSTURE: BLOCKS (a step of `npm run check`, via `test:eviction`).
//
// scripts/evict-memory.test.mjs — mutation gate for the typed memory eviction.
//
// ── WHY EVERY CASE CONSTRUCTS ITS DEFECT ────────────────────────────────────────────────────
//
// Rules 1 and 3 have NO live instance in this repo, measured 2026-08-25: no entry in
// DECISIONS.md declares `Reversibility: irreversible`, and no claim in the ledger cites any
// individual entry. So a test that asserted "the real file classifies cleanly" would pass
// against a tool whose two hard refusals were never wired up at all — the shape of green check
// over an untested capability this repo has caught twice before. Each case below therefore
// BUILDS an entry the rule must refuse and asserts the refusal, then mutates the one property
// the rule turns on and asserts the refusal lifts. A rule that refuses everything is not a rule.
//
// ── FIXTURES ARE REAL GIT REPOS, AND THAT IS LOAD-BEARING ───────────────────────────────────
//
// The citation scan reads `git ls-files`, and refuses to fall back to a directory walk — so a
// fixture that is not a repo exercises the REFUSAL path, not the scan. `git init` is therefore
// part of building a fixture, and one case deliberately omits it to pin that refusal.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVICT = path.join(REPO, 'scripts', 'evict-memory.mjs');
const BUDGET = path.join(REPO, 'scripts', 'check-memory-budget.mjs');

const roots = [];
process.on('exit', () => {
  for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true }); } catch { /* best effort */ } }
});

/**
 * A DECISIONS.md fixture in a fresh git repo.
 *
 * @param {object} o
 * @param {string} o.entries       markdown for the dated entries
 * @param {object} [o.files]       extra files to create, path → contents (used for Affects: targets and claim blocks)
 * @param {object} [o.archives]    archive volumes, filename → contents
 * @param {boolean} [o.git=true]   run `git init` — false exercises the unavailable-scan refusal
 */
function fixture({ entries, files = {}, archives = {}, git = true }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evict-memory-fixture-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, '.claude', 'memory'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.claude', 'memory', 'DECISIONS.md'),
    `# Architecture & Strategy Decisions\n\n---\n\n<!-- Entries below this line. -->\n\n${entries}`
  );
  fs.writeFileSync(path.join(root, '.claude', 'memory', 'LONG-TERM.md'), 'a\nb\nc\n');
  for (const [name, body] of Object.entries(archives)) {
    fs.writeFileSync(path.join(root, '.claude', 'memory', name), body);
  }
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  if (git) execFileSync('git', ['init', '-q'], { cwd: root, stdio: 'ignore' });
  return root;
}

function run(script, args) {
  try {
    return { code: 0, out: execFileSync('node', [script, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), err: '' };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '').toString(), err: (e.stderr || '').toString() };
  }
}

const plan = (root) => {
  const r = run(EVICT, ['plan', '--root', root, '--json']);
  return { code: r.code, ...JSON.parse(r.out) };
};
const apply = (root, args) => run(EVICT, ['apply', '--root', root, '--date', '2026-08-25', ...args]);
const readDecisions = (root) => fs.readFileSync(path.join(root, '.claude', 'memory', 'DECISIONS.md'), 'utf8');
const dispositionOf = (p, title) => p.entries.find((e) => e.title.includes(title))?.disposition;

// ── entry builders ──────────────────────────────────────────────────────────────────────────

function entry({ date, title, reversibility = 'reversible', affects = 'nothing in particular', body = 'Context and rationale.' }) {
  return [
    `## ${date} — ${title}`,
    '',
    `**Context:** ${body}`,
    '**Decision:** Something was chosen.',
    `**Reversibility:** ${reversibility}`,
    '**Owner:** test',
    `**Affects:** ${affects}`,
    '',
  ].join('\n');
}

/** A minimal valid claim block, for the files that must carry one. */
function claimBlock(id, assertText) {
  return [
    '```claims',
    'claims:',
    `  - id: ${id}`,
    `    assert: "${assertText}"`,
    '    kind: behavior',
    '    scope: project',
    '    verified_by: command',
    '    evidence:',
    '      cmd: "true"',
    '      expect_exit: 0',
    '    valid_until: "2099-01-01"',
    '    confidence: 1.0',
    '```',
  ].join('\n');
}

// ── RULE 1 — irreversible with a live subject is never archived ─────────────────────────────

test('RULE 1: an irreversible entry whose subject EXISTS is refused, and nothing is written', () => {
  const root = fixture({
    entries: entry({
      date: '2026-08-01',
      title: 'The migration that cannot be undone was applied to production',
      reversibility: 'irreversible',
      affects: '`db/schema.sql`',
    }),
    files: { 'db/schema.sql': 'CREATE TABLE t (id int);\n' },
  });

  const p = plan(root);
  assert.equal(dispositionOf(p, 'migration that cannot'), 'refused');

  const before = readDecisions(root);
  const r = apply(root, ['--only', '2026-08-01']);
  assert.equal(r.code, 1, `expected refusal, got exit ${r.code}: ${r.out}${r.err}`);
  assert.match(r.err, /RULE 1/);
  assert.match(r.err, /Nothing written/);
  assert.equal(readDecisions(root), before, 'DECISIONS.md must be byte-identical after a refusal');
});

test('RULE 1 lifts when the subject is gone — otherwise the rule refuses everything and proves nothing', () => {
  // Identical to the case above except that db/schema.sql does not exist.
  const root = fixture({
    entries: entry({
      date: '2026-08-01',
      title: 'The migration that cannot be undone was applied to production',
      reversibility: 'irreversible',
      affects: '`db/schema.sql`',
    }),
  });
  assert.equal(dispositionOf(plan(root), 'migration that cannot'), 'orphaned');
  const r = apply(root, ['--only', '2026-08-01']);
  assert.equal(r.code, 0, `expected the eviction to proceed: ${r.err}`);
});

test('RULE 1: an irreversible entry naming NO path is refused — unknown existence reads as alive', () => {
  // Rule 10 applied to this tool: an entry whose subject could not be checked must not be
  // released by rule 2. Most real Affects: lines are prose, so this is the common shape.
  const root = fixture({
    entries: entry({
      date: '2026-08-02',
      title: 'Something irreversible happened somewhere unnamed',
      reversibility: 'irreversible',
      affects: 'every agent that reads a verdict',
    }),
  });
  const p = plan(root);
  assert.equal(dispositionOf(p, 'irreversible happened'), 'refused');
  assert.match(apply(root, ['--only', '2026-08-02']).err, /existence is unknown and read as alive/);
});

// ── RULE 2 — an entry whose Affects: targets are all deleted ────────────────────────────────

test('RULE 2: every Affects: target deleted ⇒ orphaned; one surviving target ⇒ not orphaned', () => {
  const affects = '`gone/one.ts`, `gone/two.ts`';
  const orphan = fixture({ entries: entry({ date: '2026-08-03', title: 'A decision about two files that are gone', affects }) });
  assert.equal(dispositionOf(plan(orphan), 'two files that are gone'), 'orphaned');

  const partial = fixture({
    entries: entry({ date: '2026-08-03', title: 'A decision about two files that are gone', affects }),
    files: { 'gone/two.ts': 'export const x = 1;\n' },
  });
  assert.equal(dispositionOf(plan(partial), 'two files that are gone'), 'eligible',
    'one surviving target means the subject is alive, not orphaned');
});

test('RULE 2: an Affects: target on a WRAPPED second line still counts', () => {
  // The real file wraps at least one Affects: line. Reading only the first line would report a
  // live subject as deleted — rule 2 firing on an entry whose surviving path nobody read.
  const root = fixture({
    entries: [
      '## 2026-08-04 — A decision whose affects list wraps across two lines',
      '',
      '**Decision:** Something.',
      '**Reversibility:** reversible',
      '**Affects:** `gone/one.ts`,',
      '`still/here.ts`',
      '',
    ].join('\n'),
    files: { 'still/here.ts': 'export const y = 2;\n' },
  });
  assert.equal(dispositionOf(plan(root), 'affects list wraps'), 'eligible',
    'the path on the continuation line must be seen');
});

// ── RULE 3 — pin anything cited by a live claim ─────────────────────────────────────────────

test('RULE 3: a claim block living INSIDE the entry pins it', () => {
  const root = fixture({
    entries: [
      '## 2026-08-05 — A decision that carries its own claim about caching',
      '',
      '**Decision:** Something.',
      '**Reversibility:** reversible',
      '**Affects:** nothing',
      '',
      claimBlock('c-fixture-inside', 'the claim lives inside the entry'),
      '',
    ].join('\n'),
  });
  const p = plan(root);
  assert.equal(dispositionOf(p, 'carries its own claim'), 'refused');
  const r = apply(root, ['--only', '2026-08-05']);
  assert.equal(r.code, 1);
  assert.match(r.err, /RULE 3/);
  assert.match(r.err, /c-fixture-inside/);
});

test('RULE 3: a claim in ANOTHER file that names the entry by title phrase pins it', () => {
  const title = 'Rotate the signing keys every ninety days';
  const cited = fixture({
    entries: entry({ date: '2026-08-06', title }),
    files: { 'docs/policy.md': `# Policy\n\n${claimBlock('c-fixture-elsewhere', `we ${title.toLowerCase()} without exception`)}\n` },
  });
  const r = apply(cited, ['--only', '2026-08-06']);
  assert.equal(r.code, 1, 'a claim citing the entry by title phrase must pin it');
  assert.match(r.err, /c-fixture-elsewhere/);

  // Same entry, same claim file, one word changed so the phrase no longer matches: the pin lifts.
  const uncited = fixture({
    entries: entry({ date: '2026-08-06', title }),
    files: { 'docs/policy.md': `# Policy\n\n${claimBlock('c-fixture-elsewhere', 'we rotate the tyres every ninety days without exception')}\n` },
  });
  assert.equal(apply(uncited, ['--only', '2026-08-06']).code, 0,
    'the pin must turn on the citation, not on the presence of any claim at all');
});

test('RULE 3: apply REFUSES outright when the claim scan could not run', () => {
  // Rule 10. Against an unloaded corpus every entry looks uncited, so the pin would silently
  // do nothing and the tool would report success — the worst of the three possible behaviours.
  const root = fixture({ entries: entry({ date: '2026-08-07', title: 'An ordinary reversible decision about things' }), git: false });
  const r = apply(root, ['--only', '2026-08-07']);
  assert.equal(r.code, 1);
  assert.match(r.err, /the live-claim scan did not run/);
  assert.match(r.err, /would evict a pinned entry and report success/);
});

// ── RULE 4 — archival leaves a residue ──────────────────────────────────────────────────────

test('RULE 4: the heading survives, the stub names the volume, and the body is verbatim in it', () => {
  const root = fixture({
    entries: entry({ date: '2026-08-08', title: 'A decision recorded in unmistakable words', body: 'UNMISTAKABLE-BODY-SENTINEL rationale.' }),
  });
  const r = apply(root, ['--only', '2026-08-08']);
  assert.equal(r.code, 0, r.err);

  const after = readDecisions(root);
  assert.match(after, /^## 2026-08-08 — A decision recorded in unmistakable words$/m,
    'the heading must survive so every by-date and by-title citation still resolves');
  assert.match(after, /\*Archived to `DECISIONS_ARCHIVE\.md` \(2026-08-25\)\./,
    'the stub must name the volume the body went to');
  assert.ok(!after.includes('UNMISTAKABLE-BODY-SENTINEL'), 'the body must have left DECISIONS.md');

  const vol = fs.readFileSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE.md'), 'utf8');
  assert.ok(vol.includes('UNMISTAKABLE-BODY-SENTINEL'), 'the body must be in the volume, verbatim');
  assert.ok(vol.includes('**Reversibility:** reversible'), 'the type keys travel with the body');
});

test('RULE 4: the stub never claims "no citations" — it names the scans and what they missed', () => {
  // The 2026-08-22 eviction wrote "no citations" into four stubs while by-date and by-paraphrase
  // citations existed. A stub that overstates its own diligence is worse than one that states
  // none: the next reader deletes the body on its authority.
  const root = fixture({ entries: entry({ date: '2026-08-09', title: 'An entry that genuinely nothing else mentions anywhere' }) });
  assert.equal(apply(root, ['--only', '2026-08-09']).code, 0);
  const after = readDecisions(root);
  assert.match(after, /Not checked: paraphrase/);
  assert.match(after, /two scans found nothing/);
  assert.ok(!/no citations\b/i.test(after), 'the stub must not assert an absence it cannot establish');
});

test('RULE 4: a stub is not evicted twice', () => {
  const root = fixture({ entries: entry({ date: '2026-08-10', title: 'A decision that will be archived exactly once' }) });
  assert.equal(apply(root, ['--only', '2026-08-10']).code, 0);
  const r = apply(root, ['--only', '2026-08-10']);
  assert.equal(r.code, 1);
  assert.match(r.err, /already a stub/);
});

// ── conservation ────────────────────────────────────────────────────────────────────────────

test('conservation: bytes removed equal bodies moved minus residue, exactly', () => {
  const root = fixture({
    entries: [
      entry({ date: '2026-08-11', title: 'First decision of a batch about caching layers' }),
      entry({ date: '2026-08-12', title: 'Second decision of a batch about queue depth' }),
    ].join('\n'),
  });
  const r = run(EVICT, ['apply', '--root', root, '--date', '2026-08-25', '--json',
    '--only', '2026-08-11', '--only', '2026-08-12']);
  assert.equal(r.code, 0, r.err);
  const rep = JSON.parse(r.out);
  assert.equal(
    rep.bytes.decisions_reduction,
    rep.bytes.bodies_moved - rep.bytes.residue_left_behind,
    'the eviction arithmetic must close to zero, not to "about right"'
  );
  assert.equal(rep.bytes.conservation_closes, true);
});

test('--dry-run computes the whole write and touches nothing', () => {
  const root = fixture({ entries: entry({ date: '2026-08-13', title: 'A decision that must survive a dry run intact' }) });
  const before = readDecisions(root);
  const r = run(EVICT, ['apply', '--root', root, '--date', '2026-08-25', '--dry-run', '--only', '2026-08-13']);
  assert.equal(r.code, 0, r.err);
  assert.equal(readDecisions(root), before);
  assert.ok(!fs.existsSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE.md')),
    'a dry run must not open a volume');
});

// ── selectors ───────────────────────────────────────────────────────────────────────────────

test('an ambiguous selector is refused, never guessed', () => {
  // Six live entries share 2026-08-11. Picking "the first one" would archive a body the caller
  // never looked at, and would do it silently.
  const root = fixture({
    entries: [
      entry({ date: '2026-08-14', title: 'One decision about the shape of the queue' }),
      entry({ date: '2026-08-14', title: 'Another decision about the shape of the cache' }),
    ].join('\n'),
  });
  const before = readDecisions(root);
  const r = apply(root, ['--only', '2026-08-14']);
  assert.equal(r.code, 1);
  assert.match(r.err, /matches 2 entries/);
  assert.equal(readDecisions(root), before);

  assert.equal(apply(root, ['--only', '2026-08-14::shape of the cache']).code, 0,
    'the disambiguating form must work');
});

test('a selector matching nothing is refused', () => {
  const root = fixture({ entries: entry({ date: '2026-08-15', title: 'A decision about something specific' }) });
  const r = apply(root, ['--only', '2026-01-01']);
  assert.equal(r.code, 1);
  assert.match(r.err, /matches no entry/);
});

// ── archive rotation ────────────────────────────────────────────────────────────────────────

test('ROTATION: a nearly-full volume is not topped up — the next volume opens', () => {
  // This is the whole point of the design. With a single capped archive, this eviction would
  // have had to breach the cap or delete history.
  const nearlyFull = `# Archive\n\n${'x'.repeat(35_000)}\n`;
  const root = fixture({
    entries: entry({ date: '2026-08-16', title: 'A decision that must land in a fresh volume', body: 'y'.repeat(2_000) }),
    archives: { 'DECISIONS_ARCHIVE.md': nearlyFull },
  });
  const r = apply(root, ['--only', '2026-08-16']);
  assert.equal(r.code, 0, r.err);

  const dir = path.join(root, '.claude', 'memory');
  assert.ok(fs.existsSync(path.join(dir, 'DECISIONS_ARCHIVE_002.md')), 'volume 2 must have been opened');
  assert.equal(fs.readFileSync(path.join(dir, 'DECISIONS_ARCHIVE.md'), 'utf8'), nearlyFull,
    'volume 1 must be untouched — rotation appends forward, it does not backfill');
  assert.match(readDecisions(root), /Archived to `DECISIONS_ARCHIVE_002\.md`/,
    'the stub must point at the volume the body actually went to');
});

// The budget checker's own volume-capping mutations live in scripts/check-memory-budget.test.mjs,
// which is where a reader looking for "what does the blocking check enforce" will go. What stays
// here is the one property that spans both tools and belongs to neither.

test('the evictor and the budget checker agree on the cap — one number, not two', () => {
  // Both report their own constant, so this compares behaviour rather than source text.
  const root = fixture({ entries: entry({ date: '2026-08-19', title: 'An ordinary decision about ordinary things' }) });
  const evictorCap = plan(root).decisions.cap;
  const checkerCap = JSON.parse(run(BUDGET, ['--root', root, '--json']).out).decisions.byte_cap;
  assert.equal(evictorCap, checkerCap,
    'a drifted cap would let the evictor leave a file the checker rejects, or the reverse');
});

// ── the real repo ───────────────────────────────────────────────────────────────────────────

test('the real DECISIONS.md parses, and every entry lands in exactly one class', () => {
  const r = run(EVICT, ['plan', '--json']);
  assert.equal(r.code, 0, r.err);
  const p = JSON.parse(r.out);
  assert.ok(p.entries.length > 0, 'the real file must parse into entries');
  assert.equal(p.claim_scan.performed, true, 'the claim scan must actually run against the repo');
  const known = new Set(['archived', 'refused', 'orphaned', 'guarded', 'eligible']);
  for (const e of p.entries) {
    assert.ok(known.has(e.disposition), `unknown disposition ${e.disposition} for ${e.date}`);
  }
  assert.ok(p.decisions.headroom > 0, `the real file is over its cap: ${JSON.stringify(p.decisions)}`);
});
