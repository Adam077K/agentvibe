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
import { createRequire } from 'node:module';

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
function fixture({ entries, files = {}, archives = {}, git = true, header = true }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evict-memory-fixture-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, '.claude', 'memory'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.claude', 'memory', 'DECISIONS.md'),
    header ? `# Architecture & Strategy Decisions\n\n---\n\n<!-- Entries below this line. -->\n\n${entries}` : entries
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

/**
 * `body` defaults to roughly a real entry's size on purpose.
 *
 * The live file's real entries run to about 1,800 bytes; a 200-byte synthetic one is smaller
 * than the stub that replaces it, so every eviction of it GROWS the file — which the tool now
 * refuses, correctly. A fixture that could only exercise the refusal would test the guard and
 * nothing behind it.
 */
const REALISTIC_BODY = ('Why this came up, at about the length a real entry runs to, so that an ' +
  'eviction of it actually shrinks the file rather than tripping the growth guard. ').repeat(6);

function entry({ date, title, reversibility = 'reversible', affects = 'nothing in particular', body = REALISTIC_BODY }) {
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
    entries: entry({ date: '2026-08-08', title: 'A decision recorded in unmistakable words', body: `UNMISTAKABLE-BODY-SENTINEL ${REALISTIC_BODY}` }),
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


// ══════════════════════════════════════════════════════════════════════════════════════════════
// HARDENING — every case below reproduces an adversarial review finding of 2026-08-26.
//
// The eviction that had already run was verified clean by an independent parser. Every defect
// pinned here lived in a path that run did not take, which is exactly the kind that survives:
// nothing exercised it, so nothing contradicted it.
// ══════════════════════════════════════════════════════════════════════════════════════════════

// ── P1-1 · a dated heading inside a code fence ──────────────────────────────────────────────

// THE REAL FIELDS COME AFTER THE FENCE, DELIBERATELY. The first version of this fixture put them
// before it, and the fenced block carried no `Reversibility:` line — so it could not have caught
// a fenced field shadowing a real one, which is exactly the regression the delta review found.
// A fixture ordered the safe way is a fixture that cannot fail.
const FENCED = [
  '## 2026-03-01 — An irreversible decision that shows the entry format',
  '',
  '```markdown',
  '## 2026-03-02 — [Decision title]',
  'Reversibility: reversible',
  '**Affects:** docs/does-not-exist.md',
  'FENCED-EXAMPLE-SENTINEL',
  '```',
  '',
  '**Decision:** Applied.',
  '**Reversibility:** irreversible',
  '**Affects:** `db/schema.sql`',
  '',
  '**Consequence:** THE-REASONING-NOBODY-WANTS-TO-LOSE.',
  '',
].join('\n');

test('P1-1: a dated heading inside a fence is CONTENT, not an entry', () => {
  const root = fixture({ entries: FENCED, files: { 'db/schema.sql': 'x\n' } });
  const p = plan(root);
  assert.equal(p.entries.length, 1, `the fenced heading must not become an entry: ${JSON.stringify(p.entries.map((e) => e.date))}`);
  assert.equal(p.entries[0].date, '2026-03-01');
  assert.equal(p.entries[0].disposition, 'refused', 'the real entry is irreversible with a live subject');
});

test('P1-1: the fenced tail can no longer be evicted out from under its refused parent', () => {
  const root = fixture({ entries: FENCED, files: { 'db/schema.sql': 'x\n' } });
  const before = readDecisions(root);
  const r = apply(root, ['--only', '2026-03-02']);
  assert.equal(r.code, 1, 'there is no such entry to select');
  assert.match(r.err, /matches no entry/);
  assert.equal(readDecisions(root), before);
  assert.ok(readDecisions(root).includes('THE-REASONING-NOBODY-WANTS-TO-LOSE'),
    'the reasoning paragraph must still be in DECISIONS.md');
});

test("P1-1: the live file's own ## Format example is the attack, and it parses as zero entries", () => {
  // .claude/memory/DECISIONS.md documents a ```markdown fence containing `## YYYY-MM-DD — …`.
  // It has been harmless only because the placeholder date is not digits. Fill it in and the
  // old parser split the file; this asserts the construct itself is now inert.
  const root = fixture({
    entries: ['```markdown', '## 2026-04-01 — [Decision title]', '**Reversibility:** reversible', '```', ''].join('\n'),
  });
  assert.equal(plan(root).entries.length, 0);
});

test('P1-1: an UNTERMINATED fence is refused, not guessed', () => {
  const root = fixture({
    entries: [
      '## 2026-05-01 — A decision whose fence is never closed anywhere',
      '**Reversibility:** reversible',
      '**Affects:** nothing',
      '',
      '```',
      '## 2026-05-02 — swallowed',
      '',
    ].join('\n'),
  });
  const p = plan(root);
  assert.equal(p.parse.usable, false);
  assert.match(p.parse.ambiguous, /unterminated/);
  const before = readDecisions(root);
  const r = apply(root, ['--only', '2026-05-01']);
  assert.equal(r.code, 1);
  assert.match(r.err, /cannot be parsed unambiguously/);
  assert.equal(readDecisions(root), before, 'an ambiguous parse must write nothing');
});

// ── P1-2 · a "fresh" volume that already exists ─────────────────────────────────────────────

/**
 * Does this directory's filesystem fold case? PROBED at runtime — written and read back — never
 * assumed, and deliberately NOT inferred from `process.platform`.
 *
 * ── WHY NOT `process.platform` ──────────────────────────────────────────────────────────────
 *
 * Because that is the same error one level up. A case-SENSITIVE APFS volume on macOS and a
 * case-INSENSITIVE mount on Linux both exist; this file was fixed against the first of those,
 * mounted locally, which is how the CI arm was executed rather than reasoned about. The question
 * is about the filesystem holding the fixture, so ask that filesystem.
 *
 * Only the BASENAME is case-varied: uppercasing the whole path would also vary the temp
 * directory's own name, and a probe that fails for the wrong reason reads as an answer.
 */
function foldsCase(dir) {
  const base = `.case-probe-${process.pid}-${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(path.join(dir, base), 'probe');
  try {
    return fs.existsSync(path.join(dir, base.toUpperCase()));
  } finally {
    fs.rmSync(path.join(dir, base), { force: true });
  }
}

test('P1-2: a CASE-FOLDED name occupying the computed volume path is refused', (t) => {
  // ── THIS ASSERTION IS FILESYSTEM-DEPENDENT, AND SAYS SO ────────────────────────────────────
  //
  // `DECISIONS_ARCHIVE_002.MD` and `DECISIONS_ARCHIVE_002.md` are ONE file where case folds and
  // TWO where it does not. Where they are two, nothing occupies the contended path, the tool
  // correctly creates the volume, and this fixture's premise is simply false — so the case is
  // SKIPPED rather than weakened. The universal companion below covers the same refusal
  // everywhere; this one covers the route that exists on the filesystem this repo is developed
  // on, which is precisely the route CI cannot reach.
  const root = fixture({
    entries: entry({ date: '2026-06-01', title: 'An ordinary decision about ordinary things' }),
    archives: {
      'DECISIONS_ARCHIVE.md': `# Archive\n\n${'x'.repeat(35_000)}\n`,
      // Occupies the exact path targetVolume will compute, under a name VOLUME_RE misses.
      'DECISIONS_ARCHIVE_002.MD': 'IRREPLACEABLE-HISTORY-SENTINEL\n',
    },
  });
  const dir = path.join(root, '.claude', 'memory');
  if (!foldsCase(dir)) {
    t.skip('this filesystem is case-SENSITIVE, so `DECISIONS_ARCHIVE_002.MD` and `...md` are two '
      + 'files and nothing occupies the contended path — the premise of this fixture, not the '
      + 'behaviour it checks. The universal directory and symlink cases below cover the same '
      + 'refusal on every filesystem.');
    return;
  }

  // ── THE PRECONDITION, CASE-SENSITIVELY ────────────────────────────────────────────────────
  //
  // This guard used to be `readdirSync(dir).filter(n => /^DECISIONS_ARCHIVE_002\.md$/i.test(n))`
  // — a case-INSENSITIVE regex asserting a case-SENSITIVE property. It found the `.MD` file on a
  // case-sensitive filesystem, so it passed while the fixture had NOT placed a file at the
  // contended path, and the real assertion below failed instead. A guard that cannot express its
  // own failure is the pattern this branch spent four rounds on; here it was in the test proving
  // the fix. Both checks below are exact-string.
  const contended = path.join(dir, 'DECISIONS_ARCHIVE_002.md');
  assert.ok(fs.existsSync(contended),
    'fixture must place a file at the EXACT path targetVolume computes — that is the premise');
  assert.ok(!fs.readdirSync(dir).includes('DECISIONS_ARCHIVE_002.md'),
    'and it must be there under a name VOLUME_RE misses, or the collision is not the one under test');

  // Invisible to the volume scan — confirmed through the tool's own report, not assumed.
  assert.deepEqual(plan(root).volumes.map((v) => v.name), ['DECISIONS_ARCHIVE.md'],
    'the .MD file must not be counted as a volume, or targetVolume would never call 002 free');

  const r = apply(root, ['--only', '2026-06-01']);
  assert.equal(r.code, 1, `expected refusal, got ${r.code}: ${r.out}`);
  assert.match(r.err, /DECISIONS_ARCHIVE_002\.md was computed as a NEW volume but a file already exists/);
  assert.ok(fs.readFileSync(path.join(dir, 'DECISIONS_ARCHIVE_002.MD'), 'utf8').includes('IRREPLACEABLE-HISTORY-SENTINEL'),
    'the prior volume must survive untouched');
});

// ── P1-2(b) · the same refusal, on every filesystem ─────────────────────────────────────────
//
// The property is "refuse when ANYTHING already occupies the computed volume path". Case folding
// is one way to reach it and exists on one kind of filesystem. These two reach it on all of them,
// because `volumes()` counts only REGULAR FILES: a directory and a symlink are invisible to the
// scan by design, so `targetVolume` calls the path free and the occupancy guard is what stops it.
//
// Volume 1 is sized to 35,900 bytes rather than 35,000 so that ANY batch rotates. At 35,000 a
// small entry still fits under the 36,000-byte fill ceiling, no rotation happens, 002 is never
// computed, and the test would pass while checking nothing — measured while writing this.

/** A fixture whose next eviction is forced to rotate into volume 002. */
function rotatingFixture(date) {
  const root = fixture({
    entries: entry({ date, title: 'An ordinary decision about ordinary things' }),
    archives: { 'DECISIONS_ARCHIVE.md': `# Archive\n\n${'x'.repeat(35_900)}\n` },
  });
  return { root, dir: path.join(root, '.claude', 'memory') };
}

/** `plan --json`, asserting first that it exited 0 — it is read-only and must not crash. */
function planStrict(root) {
  const raw = run(EVICT, ['plan', '--root', root, '--json']);
  assert.equal(raw.code, 0,
    `plan is read-only and must exit 0 on a tree it can read: ${raw.err.split('\n').slice(0, 3).join(' ')}`);
  return JSON.parse(raw.out);
}

/**
 * The occupant shapes that are NOT volumes: each must be invisible to the scan, and therefore
 * refused BY THE GUARD rather than crashing it. `place` builds the occupant at the contended
 * path; `named` is what the refusal must call it.
 *
 * Table-driven because the list is the point. The first version of this section tested a
 * directory and a dangling link, which are the two shapes the fix was WRITTEN against — and a
 * fixture built from the fix cannot fail. The shapes that matter are the ones the predicate
 * change stopped admitting, enumerated deliberately rather than remembered.
 */
const NON_VOLUME_OCCUPANTS = [
  ['a directory', (p) => {
    fs.mkdirSync(p);
    fs.writeFileSync(path.join(p, 'IRREPLACEABLE.md'), 'HISTORY-SENTINEL\n');
  }, 'directory'],
  ['a dangling symlink', (p, dir) => fs.symlinkSync(path.join(dir, 'nowhere-at-all.md'), p), 'symlink'],
  ['a symlink to a DIRECTORY', (p, dir) => {
    fs.mkdirSync(path.join(dir, 'a-real-directory'));
    fs.writeFileSync(path.join(dir, 'a-real-directory', 'IRREPLACEABLE.md'), 'HISTORY-SENTINEL\n');
    fs.symlinkSync(path.join(dir, 'a-real-directory'), p);
  }, 'symlink'],
];

for (const [label, place, named] of NON_VOLUME_OCCUPANTS) {
  test(`P1-2(b): ${label} at the computed volume path is refused, on every filesystem`, () => {
    // Measured before the scan filtered by type: `VOLUME_RE` matched the NAME, `readFileSync` was
    // handed something that is not a readable file, and an unhandled EISDIR/ENOENT killed BOTH
    // commands — including `plan`, which this tool's header promises is read-only and exits 0
    // unless it cannot read the tree. Nothing was written, so the safety property held; the
    // operator got a stack trace instead of the refusal.
    const { root, dir } = rotatingFixture('2026-06-03');
    const contended = path.join(dir, 'DECISIONS_ARCHIVE_002.md');
    place(contended, dir);

    const p = planStrict(root);
    assert.deepEqual(p.volumes.map((v) => v.name), ['DECISIONS_ARCHIVE.md'],
      `${label} is not a volume — confirmed through the report, not assumed`);

    const r = apply(root, ['--only', '2026-06-03']);
    assert.equal(r.code, 1, `expected refusal, got ${r.code}: ${r.out}`);
    assert.match(r.err, new RegExp(`DECISIONS_ARCHIVE_002\\.md was computed as a NEW volume but a ${named} already exists`));
    assert.equal(fs.lstatSync(contended).isSymbolicLink(), named === 'symlink',
      'the occupant must be exactly what the fixture placed — unreplaced');
  });
}

test('P1-2(b): a SPECIAL FILE at the computed volume path is refused too', (t) => {
  // A FIFO resolves to something that is not a regular file, so it is not a volume — and
  // `statSync` on it does not block, only opening would. `mkfifo` is a capability, so it is
  // probed rather than assumed, the same way case folding is.
  const { root, dir } = rotatingFixture('2026-06-06');
  const contended = path.join(dir, 'DECISIONS_ARCHIVE_002.md');
  try {
    execFileSync('mkfifo', [contended], { stdio: 'ignore' });
  } catch {
    t.skip('mkfifo is unavailable here, so a special file cannot be placed at the contended path');
    return;
  }
  assert.deepEqual(planStrict(root).volumes.map((v) => v.name), ['DECISIONS_ARCHIVE.md']);
  const r = apply(root, ['--only', '2026-06-06']);
  assert.equal(r.code, 1, `expected refusal, got ${r.code}: ${r.out}`);
  assert.match(r.err, /DECISIONS_ARCHIVE_002\.md was computed as a NEW volume but a special file already exists/);
});

// ── P1-2(c) · THE SHAPE THE NARROWING DROPPED · a symlink that RESOLVES to a real volume ────
//
// Two P1s lived here for one commit, and neither was caught by the section above, because every
// occupant it plants is one the fix was written to reject. The predicate that rejects them —
// `lstat`, "is this a regular file" — also rejects a symlink pointing AT a regular file, which
// holds real history and which two callers need.
//
// A deletion does not attract test cases. Adding a guard makes you ask what gets through;
// narrowing a scan should make you ask WHAT NO LONGER ARRIVES, and there is no new code to point
// a test at. These three are that question, answered.

/** Volume 1 with ROOM, and volume 2 a symlink to a real file holding real history. */
function symlinkedVolumeFixture(date, volumeTwoBody) {
  const root = fixture({
    entries: entry({ date, title: 'An ordinary decision about ordinary things' }),
    archives: {
      'DECISIONS_ARCHIVE.md': '# Archive volume 1\n\nVOL1-CONTENT\n',
      'real-volume-two.md': volumeTwoBody,
    },
  });
  const dir = path.join(root, '.claude', 'memory');
  fs.symlinkSync(path.join(dir, 'real-volume-two.md'), path.join(dir, 'DECISIONS_ARCHIVE_002.md'));
  return { root, dir };
}

test('P1-2(c): a symlink resolving to a real volume is SEEN by the scan', () => {
  const { root } = symlinkedVolumeFixture('2026-06-07', '# Archive volume 2\n\nVOL2-HISTORY-SENTINEL\n');
  assert.deepEqual(planStrict(root).volumes.map((v) => v.name),
    ['DECISIONS_ARCHIVE.md', 'DECISIONS_ARCHIVE_002.md'],
    'a symlink to a regular file holds volume content and must not be skipped');
});

test('P1-2(c): …and is appended to IN ORDER — monotonic append survives a symlinked volume', () => {
  // Measured with the `lstat` filter in place: volume 002 vanished from the scan, `targetVolume`
  // appended to 001 — the OLDER volume — with `vol.fresh` false, so the occupancy guard never
  // ran and nothing warned. exit 0. This is the harm `volumes`'s own comment names.
  const { root, dir } = symlinkedVolumeFixture('2026-06-08', '# Archive volume 2\n\nVOL2-HISTORY-SENTINEL\n');
  const r = apply(root, ['--only', '2026-06-08']);
  assert.equal(r.code, 0, r.err);
  const atTwo = fs.readFileSync(path.join(dir, 'DECISIONS_ARCHIVE_002.md'), 'utf8');
  const atOne = fs.readFileSync(path.join(dir, 'DECISIONS_ARCHIVE.md'), 'utf8');
  assert.ok(atTwo.includes('## 2026-06-08 —'), 'the newest volume takes the batch');
  assert.ok(!atOne.includes('## 2026-06-08 —'), 'the OLDER volume must not — that is monotonic append');
  assert.ok(atTwo.includes('VOL2-HISTORY-SENTINEL'), 'and volume 2’s prior history must survive the append');
});

test('P1-2(c): …and is SEEN by the cross-volume duplicate guard', () => {
  // Round 3 made the duplicate-body guard span every volume; it reads the same scan, so a
  // symlinked volume was invisible to it too. Measured with the `lstat` filter: exit 0 and TWO
  // copies of the body in the archive set — re-opening exactly what that guard exists for, since
  // re-running is the recovery this tool's own message recommends.
  const body = entry({ date: '2026-06-09', title: 'An ordinary decision about ordinary things' }).replace(/\s+$/, '');
  const { root, dir } = symlinkedVolumeFixture('2026-06-09', `# Archive volume 2\n\n${body}\n`);
  const r = apply(root, ['--only', '2026-06-09']);
  assert.equal(r.code, 1, `a body already in a symlinked volume must be refused, got ${r.code}: ${r.out}`);
  assert.match(r.err, /ALREADY present in the archive/);
  const archived = ['DECISIONS_ARCHIVE.md', 'real-volume-two.md']
    .map((n) => fs.readFileSync(path.join(dir, n), 'utf8')).join('\n');
  assert.equal(archived.split(body).length - 1, 1, 'exactly one copy of the body may exist in the archive set');
});

test('P1-2(b): a real volume file is still SEEN — the scan narrowed, it did not go blind', () => {
  // Without this the refusals above would be satisfied by a `volumes()` that returns nothing.
  const { root, dir } = rotatingFixture('2026-06-05');
  assert.deepEqual(planStrict(root).volumes.map((v) => v.name), ['DECISIONS_ARCHIVE.md']);
  assert.equal(apply(root, ['--only', '2026-06-05']).code, 0, 'and the rotation must still work');
  assert.ok(fs.existsSync(path.join(dir, 'DECISIONS_ARCHIVE_002.md')), 'volume 002 opens when nothing occupies it');
});

test('P1-2: volume 1000 keeps being recognised — padStart(3) emits four digits', () => {
  const root = fixture({
    entries: entry({ date: '2026-06-02', title: 'An ordinary decision about ordinary things' }),
    archives: { 'DECISIONS_ARCHIVE_1000.md': `# Archive volume 1000\n\n${'x'.repeat(35_000)}\n` },
  });
  const r = apply(root, ['--only', '2026-06-02']);
  assert.equal(r.code, 0, r.err);
  assert.ok(fs.existsSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE_1001.md')),
    'the next volume after 1000 is 1001, not a re-used low number');
});

// ── P2-1 · conservation must cover the DESTINATION, and be re-checked from disk ─────────────

test('P2-1: the destination volume is an ASSERTION, not just a report line', () => {
  // Deleting the destination's prior content used to leave every conservation check satisfied.
  // The invariant is exact: an append may only add a suffix.
  const root = fixture({
    entries: [
      entry({ date: '2026-07-01', title: 'First decision about the shape of the queue' }),
      entry({ date: '2026-07-02', title: 'Second decision about the shape of the cache' }),
    ].join('\n'),
    archives: { 'DECISIONS_ARCHIVE.md': '# Archive\n\nPRIOR-VOLUME-CONTENT-SENTINEL\n' },
  });
  assert.equal(apply(root, ['--only', '2026-07-01']).code, 0);
  const vol = fs.readFileSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE.md'), 'utf8');
  assert.ok(vol.includes('PRIOR-VOLUME-CONTENT-SENTINEL'), 'prior volume content must survive an append');
  assert.ok(vol.startsWith('# Archive\n\nPRIOR-VOLUME-CONTENT-SENTINEL'),
    'the append must be a pure suffix — the prior bytes are a prefix of the result');
});

test('P2-1: the post-write verification reads the ARTIFACT, not the plan', () => {
  // Whatever apply reports, the bytes on disk must carry the body and the residue. This asserts
  // the artifact directly, which is the check the tool now performs on itself before exiting 0.
  const root = fixture({
    entries: entry({ date: '2026-07-03', title: 'A decision recorded in unmistakable words', body: `DISK-SENTINEL ${REALISTIC_BODY}` }),
  });
  assert.equal(apply(root, ['--only', '2026-07-03']).code, 0);
  const dir = path.join(root, '.claude', 'memory');
  assert.ok(fs.readFileSync(path.join(dir, 'DECISIONS_ARCHIVE.md'), 'utf8').includes('DISK-SENTINEL'));
  assert.ok(fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf8').includes('## 2026-07-03 —'));
  assert.ok(!fs.existsSync(path.join(dir, `DECISIONS_ARCHIVE.md.evict-tmp-${process.pid}`)),
    'no temp file may be left behind');
});

test('P2-1: an eviction that would GROW the file is refused', () => {
  // Every fixture run in the review grew the file and still exited 0. A stub can outweigh the
  // body it replaces, and the arithmetic still balances — which is exactly why it needs its own
  // assertion rather than trust in the other numbers.
  const root = fixture({ entries: entry({ date: '2026-07-04', title: 'A tiny decision about one thing', body: 'x' }) });
  const before = readDecisions(root);
  const r = apply(root, ['--only', '2026-07-04', '--reason', 'y'.repeat(2_000)]);
  assert.equal(r.code, 1);
  assert.match(r.err, /would GROW DECISIONS\.md/);
  assert.equal(readDecisions(root), before);
});

test('P2-4: re-running after an interrupted write refuses instead of duplicating', () => {
  const root = fixture({ entries: entry({ date: '2026-07-05', title: 'A decision that must not be archived twice over' }) });
  assert.equal(apply(root, ['--only', '2026-07-05']).code, 0);
  const dir = path.join(root, '.claude', 'memory');
  // Simulate the interrupted state: the volume was written, DECISIONS.md was not.
  fs.writeFileSync(path.join(dir, 'DECISIONS.md'), fs.readFileSync(path.join(dir, 'DECISIONS.md'), 'utf8'));
  const volBefore = fs.readFileSync(path.join(dir, 'DECISIONS_ARCHIVE.md'), 'utf8');
  const restored = fixture({
    entries: entry({ date: '2026-07-05', title: 'A decision that must not be archived twice over' }),
    archives: { 'DECISIONS_ARCHIVE.md': volBefore },
  });
  const r = apply(restored, ['--only', '2026-07-05']);
  assert.equal(r.code, 1, 'a body already in the volume must not be appended again');
  assert.match(r.err, /ALREADY present in/);
});

// ── P2-2 · Reversibility must fail CLOSED ───────────────────────────────────────────────────

const UNREADABLE = [
  ['field absent', ''],
  ['transposed letter', '**Reversability:** reversible'],
  ['empty value', '**Reversibility:**'],
  ['negated prose', '**Reversibility:** NOT reversible under any circumstances'],
  // The last two used to be READ, and reading them is what re-opened rule 1 twice. A field
  // behind a list marker or an indent is a field this tool will not read, and refusing is the
  // whole point: the same two shapes are how a WRONG value shadows a real one (see P1-C).
  ['list-item field', '- **Reversibility:** reversible'],
  ['four-space indent', '    **Reversibility:** reversible'],
];

for (const [label, line] of UNREADABLE) {
  test(`P2-2: Reversibility unreadable (${label}) ⇒ REFUSED, never "reversible"`, () => {
    const root = fixture({
      entries: [
        '## 2026-09-01 — A decision whose reversibility cannot be read at all',
        '**Decision:** Something.',
        line,
        '**Affects:** nothing',
        '',
      ].filter(Boolean).join('\n'),
    });
    const p = plan(root);
    assert.equal(p.entries[0].disposition, 'refused', `${label} must refuse, got ${p.entries[0].disposition}`);
    assert.ok(!p.entries[0].reasons.join(' ').match(/^Reversibility reads/),
      'the tool must not assert a value it could not read');
    const before = readDecisions(root);
    const r = apply(root, ['--only', '2026-09-01']);
    assert.equal(r.code, 1);
    assert.equal(readDecisions(root), before);
  });
}

test('P2-2: a LIST-ITEM Reversibility is NOT read, and the refusal says why', () => {
  // ── THIS TEST WAS REVERSED ON 2026-08-26, DELIBERATELY ──────────────────────────────────
  //
  // It used to assert the opposite: that `- **Reversibility:** irreversible` is READ. That
  // tolerance is what made a list item able to SHADOW a real field (P1-C below), and it was
  // measured to buy nothing — across 575 tracked `.md` files there are zero non-canonical
  // `Reversibility:`/`Affects:` lines. The entry is still refused; it is refused fail-closed,
  // and the note names the shape rather than claiming the field is absent.
  const root = fixture({
    entries: ['## 2026-09-02 — A decision written with list-item fields',
      '- **Reversibility:** irreversible',
      '- **Affects:** `db/schema.sql`', ''].join('\n'),
    files: { 'db/schema.sql': 'x\n' },
  });
  const p = plan(root);
  assert.equal(p.entries[0].disposition, 'refused');
  assert.equal(p.entries[0].reversibility, 'unknown', 'a non-canonical field is never read');
  assert.match(p.entries[0].reasons.join(' '), /NOT written as `\*\*Reversibility:\*\* value`/,
    'the refusal must name the shape, or the author is sent hunting for a field that is right there');
  assert.ok(!p.entries[0].reasons.join(' ').includes('no `Reversibility:` field'),
    '"absent" is the wrong diagnosis for a field that is present and mis-shaped');
});

test('P2-2: the typo gets a did-you-mean, so "field absent" does not send a reader hunting', () => {
  const root = fixture({
    entries: ['## 2026-09-03 — A decision with one transposed letter in a field name',
      '**Reversability:** reversible', '**Affects:** nothing', ''].join('\n'),
  });
  assert.match(plan(root).entries[0].reasons.join(' '), /probably a typo/);
});

// ── P3 · declarations, CRLF, dates ──────────────────────────────────────────────────────────

test('P3: plan DECLARES the global-scope exclusion it puts in every stub', () => {
  const root = fixture({ entries: entry({ date: '2026-09-04', title: 'An ordinary decision about ordinary things' }) });
  const p = plan(root);
  assert.ok(p.claim_scan.not_scanned.some((n) => n.includes('global-scope-claims')),
    'the exclusion must be visible where the operator decides, not only in the residue');
  assert.match(p.net_basis, /DEFAULT --reason/,
    'net is an upper bound and the report must say what it assumed');
});

test('P3: a CRLF file parses its entries — it used to report ZERO', () => {
  // Zero entries means the 50-entry cap fails OPEN on a file the checker calls empty.
  const body = [
    entry({ date: '2026-09-05', title: 'First decision about the shape of the queue' }),
    entry({ date: '2026-09-06', title: 'Second decision about the shape of the cache' }),
  ].join('\n').replace(/\n/g, '\r\n');
  const root = fixture({ entries: body, header: false });
  const p = plan(root);
  assert.equal(p.entries.length, 2, 'CRLF must not hide entries');
  assert.equal(p.entries[0].reversibility, 'reversible', 'fields must parse through CRLF too');
});

test('P3: the stub date is the LOCAL date, not UTC', () => {
  const root = fixture({ entries: entry({ date: '2026-09-07', title: 'A decision archived without an explicit date flag' }) });
  const r = run(EVICT, ['apply', '--root', root, '--only', '2026-09-07']); // no --date
  assert.equal(r.code, 0, r.err);
  const d = new Date();
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  assert.match(readDecisions(root), new RegExp(`\\(${local}\\)`),
    `the stub must carry the local date ${local}`);
});

// ── P2-1 · the post-write verification must REFUSE, and that refusal must be pinned ─────────
//
// The conservation gate before the write checks the tool's own arithmetic. This one checks the
// RESULT, and it is the only check that can see a short write, a full disk, or a file that was
// not the file the tool thought. Its failure path is unreachable through the CLI on a healthy
// filesystem, so it is driven directly with an injected `io` — otherwise deleting it costs zero
// failing tests, which is exactly the state the review found it in.

const { commitWrite, VOLUME_BYTE_CAP: EVICT_CAP } = await import('./evict-memory.mjs');

/** Run `fn`, return the error it threw, and fail loudly if it did not throw at all. */
function caught(fn) {
  try { fn(); } catch (e) { return e; }
  assert.fail('expected a throw — a verification that returns instead of throwing is a gate with a deletable call site');
}

/** A filesystem that writes fewer bytes than it was given — the classic short write. */
function truncatingIo(realFs, victim) {
  return {
    writeFileSync: (p, t) => realFs.writeFileSync(p, p.includes(victim) ? t.slice(0, Math.floor(t.length / 2)) : t),
    renameSync: (a, b) => realFs.renameSync(a, b),
    readFileSync: (p, e) => realFs.readFileSync(p, e),
  };
}

function commitFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evict-commit-'));
  roots.push(root);
  const volAbs = path.join(root, 'DECISIONS_ARCHIVE.md');
  const decAbs = path.join(root, 'DECISIONS.md');
  fs.writeFileSync(volAbs, '# Archive\n');
  fs.writeFileSync(decAbs, '# Decisions\n');
  return {
    vol: { abs: volAbs, name: 'DECISIONS_ARCHIVE.md' },
    decisionsPath: decAbs,
    volumeText: `# Archive\n\n## 2026-10-01 — A body\n\nBODY-SENTINEL and more text to make the halves differ.\n`,
    decisionsText: `# Decisions\n\n## 2026-10-01 — A body\n*Archived to \`DECISIONS_ARCHIVE.md\` (2026-10-02). Done.*\n`,
    chosen: [{ entry: { heading: '## 2026-10-01 — A body', text: '## 2026-10-01 — A body\n\nBODY-SENTINEL and more text to make the halves differ.\n' } }],
  };
}

test('P2-1: a healthy write passes post-write verification', () => {
  // The control. Without it the two mutations below would prove only that the function can fail.
  assert.deepEqual(commitWrite({ ...commitFixture(), io: fs }), []);
});

test('P2-1: a short write to the VOLUME is caught by re-reading from disk', () => {
  // It THROWS. A returned flag left the verdict behind a deletable `if` at the call site, and
  // deleting those two lines cost zero failing tests — the tool computed the failure and exited 0.
  const e = caught(() => commitWrite({ ...commitFixture(), io: truncatingIo(fs, 'DECISIONS_ARCHIVE.md') }));
  assert.equal(e.name, 'EvictionVerificationError');
  const problems = e.problems;
  assert.ok(problems.length > 0, 'a truncated volume must be reported, not exited 0 over');
  assert.ok(problems.some((p) => p.includes('DECISIONS_ARCHIVE.md') && p.includes('on disk')),
    `the volume must be named: ${JSON.stringify(problems)}`);
  assert.ok(problems.some((p) => p.includes('is NOT in DECISIONS_ARCHIVE.md on disk')),
    'the missing body must be named, not just the byte count');
});

test('P2-1: a short write to DECISIONS.md is caught too — the residue is an artifact claim', () => {
  const e = caught(() => commitWrite({ ...commitFixture(), io: truncatingIo(fs, 'DECISIONS.md') }));
  const problems = e.problems;
  assert.ok(problems.some((p) => p.includes('DECISIONS.md on disk')),
    `expected a DECISIONS.md finding: ${JSON.stringify(problems)}`);
});

test('P2-1: the volume lands BEFORE DECISIONS.md — the survivable crash state is chosen', () => {
  // A crash between the two renames leaves the bodies in both files (recoverable) rather than in
  // neither (not). The duplicate-body guard is what makes re-running the safe recovery.
  const order = [];
  const f = commitFixture();
  commitWrite({
    ...f,
    io: {
      writeFileSync: (p, t) => fs.writeFileSync(p, t),
      renameSync: (a, b) => { order.push(path.basename(b)); fs.renameSync(a, b); },
      readFileSync: (p, e) => fs.readFileSync(p, e),
    },
  });
  assert.deepEqual(order, ['DECISIONS_ARCHIVE.md', 'DECISIONS.md']);
});

test('the exported cap is the one the CLI enforces', () => {
  assert.equal(EVICT_CAP, 40_000);
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// DELTA HARDENING — the 2026-08-26 delta review. Two P1s, one of them a REGRESSION introduced by
// the previous round's own P2-2 fix. That is the shape worth remembering: widening a selector to
// read more forms of a field also widened what could shadow it.
// ══════════════════════════════════════════════════════════════════════════════════════════════

const { conservationIssues, volumeHeader } = await import('./evict-memory.mjs');

// ── P1-B · a fenced template must not shadow an entry's real fields ─────────────────────────

test('P1-B: a fenced `Reversibility:` does NOT shadow the real one below it', () => {
  // The regression: `startsWith('**Key:**')` could not be satisfied by a bare `Key: value`
  // inside a fence; the tolerant selector that made list-item and bare fields readable could.
  // Rule 1 was then bypassed by a readable WRONG value rather than an unreadable one.
  const root = fixture({ entries: FENCED, files: { 'db/schema.sql': 'x\n' } });
  const e = plan(root).entries[0];
  assert.equal(e.reversibility, 'irreversible', 'the real field wins, not the fenced template');
  assert.equal(e.disposition, 'refused');
  assert.match(e.reasons.join(' '), /RULE 1: Reversibility is irreversible/);
});

test('P1-B: a fenced `Affects:` does NOT make a live entry look orphaned', () => {
  // The worse half: rule 2 releases an entry whose Affects: targets are all gone, and a fenced
  // `**Affects:** docs/does-not-exist.md` satisfied that release condition with a path the entry
  // never named — turning an irreversible entry into "archivable on sight".
  const root = fixture({ entries: FENCED, files: { 'db/schema.sql': 'x\n' } });
  const e = plan(root).entries[0];
  assert.equal(e.subject, 'alive', 'the real Affects: target exists');
  assert.notEqual(e.disposition, 'orphaned');
  const before = readDecisions(root);
  assert.equal(apply(root, ['--only', '2026-03-01']).code, 1);
  assert.equal(readDecisions(root), before);
});

test('P1-B: a fenced typo does not invent a did-you-mean about a field that is really there', () => {
  const root = fixture({
    entries: ['## 2026-03-05 — An entry quoting a misspelling inside a fence', '',
      '```', '**Reversability:** reversible', '```', '',
      '**Reversibility:** reversible', '**Affects:** nothing', ''].join('\n'),
  });
  const e = plan(root).entries[0];
  assert.equal(e.reversibility, 'reversible');
  assert.ok(!e.reasons.join(' ').includes('typo'), 'the real field was found; no near-miss to report');
});

// ── P1-A · nested fences of differing run length ────────────────────────────────────────────

const NESTED_FENCE = [
  '## 2026-04-01 — An entry showing how to write a code fence',
  '',
  '**Reversibility:** reversible',
  '**Affects:** nothing',
  '',
  '````markdown',
  '```',
  '## 2026-04-02 — [Decision title]',
  '```',
  '````',
  '',
  'PART-TWO-AFTER-THE-FENCE — THE LOAD-BEARING REASONING.',
  '',
  '## 2026-04-03 — A second real entry',
  '',
  // Realistic size, or the growth guard refuses this eviction before the fence question is reached.
  `**Context:** ${REALISTIC_BODY}`,
  '**Reversibility:** reversible',
  '**Affects:** nothing',
  '',
].join('\n');

test('P1-A: a 4-backtick fence wrapping a 3-backtick example does not tear the entry', () => {
  // A closer must be the same character AND at least as long as the opener (CommonMark). The
  // first tracker captured exactly three, so the inner ``` closed the ```` block and the file
  // parsed as 3 entries — one of them fabricated out of the first one's body, with `ambiguous`
  // still null because the fence count came out even. Wrapping a 3-backtick example in a
  // 4-backtick fence is the standard way to show a code fence in markdown.
  const root = fixture({ entries: NESTED_FENCE });
  const p = plan(root);
  assert.equal(p.entries.length, 2, `expected 2 entries, got ${p.entries.map((e) => e.date).join(', ')}`);
  assert.deepEqual(p.entries.map((e) => e.date), ['2026-04-01', '2026-04-03']);
});

test('P1-A: the load-bearing reasoning stays with its own entry', () => {
  const root = fixture({ entries: NESTED_FENCE });
  assert.equal(apply(root, ['--only', '2026-04-03']).code, 0);
  const after = readDecisions(root);
  assert.ok(after.includes('PART-TWO-AFTER-THE-FENCE'),
    'the first entry keeps its tail when a LATER entry is evicted');
  assert.ok(after.includes('````markdown'), 'the fence survives intact');
});

test('P1-A: a ~~~ fence is tracked, and a ``` inside it does not close it', () => {
  const root = fixture({
    entries: ['## 2026-04-05 — An entry using tilde fences', '',
      '**Reversibility:** reversible', '**Affects:** nothing', '',
      '~~~', '```', '## 2026-04-06 — [Decision title]', '```', '~~~', ''].join('\n'),
  });
  assert.equal(plan(root).entries.length, 1);
});

test('P1-A: a closer SHORTER than its opener does not close — it stays ambiguous', () => {
  const root = fixture({
    entries: ['## 2026-04-07 — An entry whose fence is closed by too short a run', '',
      '**Reversibility:** reversible', '````', '```', ''].join('\n'),
  });
  assert.equal(plan(root).parse.usable, false, 'three backticks cannot close a four-backtick fence');
});

test('P1-A: a closer carrying an info string does not close — CommonMark', () => {
  const root = fixture({
    entries: ['## 2026-04-08 — An entry whose closing fence carries an info string', '',
      '**Reversibility:** reversible', '```', '```js', ''].join('\n'),
  });
  assert.equal(plan(root).parse.usable, false);
});

// ── P2-A · the duplicate guard must span volumes ────────────────────────────────────────────

test('P2-A: a body already in ANOTHER volume is refused, not filed twice', () => {
  // If the interrupted append pushed the volume past the fill ceiling, the re-run ROTATES, sees
  // a bare header, and finds no duplicate in it. The recovery the tool recommends produced the
  // duplicate.
  const body = entry({ date: '2026-05-10', title: 'A decision that must exist in exactly one volume' });
  const root = fixture({
    entries: body,
    archives: {
      // Volume 1 already holds the body AND is over the writer ceiling, so the retry rotates.
      'DECISIONS_ARCHIVE.md': `# Archive\n\n${body.trim()}\n\n${'x'.repeat(35_000)}\n`,
    },
  });
  const r = apply(root, ['--only', '2026-05-10']);
  assert.equal(r.code, 1, 'the rotation must not hide the existing copy');
  assert.match(r.err, /ALREADY present in the archive/);
  assert.match(r.err, /already in DECISIONS_ARCHIVE\.md/, 'the message must name WHICH volume holds it');
  assert.ok(!fs.existsSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE_002.md')),
    'no second volume may be opened to hold a duplicate');
});

// ── P3 · each conservation condition, pinned on its own ─────────────────────────────────────
//
// Deleting any ONE non-growth condition previously cost zero failing tests: the defects were
// caught by direct file assertions elsewhere, so the GATE was thinner than the mutation table
// implied. These reach each condition individually.

/**
 * The destination is a REAL FILE now, because the gate reads it rather than being handed its
 * content. That change is the P2-1 fix: as a `volExisting` parameter it could be blanked at the
 * call site for zero failing tests, and `newVolume.startsWith('')` is true for every input.
 */
const conservationBase = (over = {}) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'evict-conservation-'));
  roots.push(dir);
  const abs = path.join(dir, 'DECISIONS_ARCHIVE.md');
  fs.writeFileSync(abs, '# Archive\n');
  return {
    removed: 100,
    movedBodies: 150,
    residue: 50,
    chosen: [{ entry: { heading: '## 2026-01-01 — H', text: '## 2026-01-01 — H\nBODY\n' } }],
    newVolume: '# Archive\n\n## 2026-01-01 — H\nBODY',
    newDecisions: '# Decisions\n\n## 2026-01-01 — H\n*stub*\n',
    vol: { abs, name: 'DECISIONS_ARCHIVE.md', number: 1, fresh: false },
    ...over,
  };
};

test('conservation: the clean case reports nothing — otherwise the five below prove nothing', () => {
  assert.deepEqual(conservationIssues(conservationBase()), []);
});

test('conservation condition: byte arithmetic that does not close', () => {
  const issues = conservationIssues({ ...conservationBase(), removed: 99 });
  assert.ok(issues.some((i) => i.includes('byte arithmetic does not close')), JSON.stringify(issues));
});

test('conservation condition: the body is not in the volume', () => {
  const issues = conservationIssues({ ...conservationBase(), newVolume: '# Archive\n\nsomething else' });
  assert.ok(issues.some((i) => i.includes('not present verbatim')), JSON.stringify(issues));
});

test('conservation condition: the heading did not survive in DECISIONS.md', () => {
  const issues = conservationIssues({ ...conservationBase(), newDecisions: '# Decisions\n' });
  assert.ok(issues.some((i) => i.includes('rule 4 residue missing')), JSON.stringify(issues));
});

test('conservation condition: the destination was rewritten rather than appended to', () => {
  // The prior content is put on DISK, not passed in — that is the only way this condition can
  // still be wrong about the destination without the call site being able to make it vacuous.
  const base = conservationBase();
  fs.writeFileSync(base.vol.abs, '# Archive\nPRIOR-THAT-MUST-SURVIVE\n');
  const issues = conservationIssues(base);
  assert.ok(issues.some((i) => i.includes('an append may only add to a volume')), JSON.stringify(issues));
});

test("conservation condition: a BLANK destination refuses — startsWith('') is not a check", () => {
  // This is the exact hole the call-site mutation `volExisting: ''` drove through, and it cost
  // ZERO failing tests. An empty prior makes the prefix test vacuously true for every input, so
  // an empty prior is now a REFUSAL rather than a pass. Rule 10, applied to the gate itself.
  const issues = conservationIssues(conservationBase({ io: { readFileSync: () => '' } }));
  assert.ok(issues.some((i) => i.includes('prior content could not be established')), JSON.stringify(issues));
  assert.ok(issues.some((i) => i.includes('the file on disk is empty')), JSON.stringify(issues));
});

test('conservation condition: an UNREADABLE destination refuses rather than passing', () => {
  const issues = conservationIssues(conservationBase({
    vol: { abs: path.join(os.tmpdir(), 'no-such-volume-anywhere.md'), name: 'DECISIONS_ARCHIVE.md', number: 1, fresh: false },
  }));
  assert.ok(issues.some((i) => i.includes('prior content could not be established')), JSON.stringify(issues));
});

test('conservation condition: a FRESH volume takes its prior from the header, not from disk', () => {
  // Otherwise the refusal above would fire on every first eviction into a new volume, and the
  // condition would have to be softened back to something vacuous to get a green suite.
  const header = conservationIssues(conservationBase({
    vol: { abs: path.join(os.tmpdir(), 'no-such-volume-anywhere.md'), name: 'DECISIONS_ARCHIVE_002.md', number: 2, fresh: true },
    newVolume: `${volumeHeader(2).replace(/\s*$/, '\n\n')}## 2026-01-01 — H\nBODY`,
  }));
  assert.deepEqual(header, [], JSON.stringify(header));
});

test('conservation condition: a reduction of exactly ZERO is refused, not only a negative one', () => {
  // `removed === 0` was unreachable in the suite — "not shrink" appeared zero times in this file.
  const issues = conservationIssues({ ...conservationBase(), removed: 0, movedBodies: 50, residue: 50 });
  assert.ok(issues.some((i) => i.includes('would not shrink DECISIONS.md')), JSON.stringify(issues));
  assert.ok(issues.some((i) => i.includes('exactly as much as')), JSON.stringify(issues));
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// ROUND-4 HARDENING — the 2026-08-26 delta review, which bisected three rounds and found ONE
// widening opening a NEW hole each round. Round 2 widened `fieldValue` to read more field forms;
// that widened what can SHADOW a field in three places — inside a fence, behind a list marker,
// behind an indent. Round 3 closed the fenced one and the FENCED fixture, by construction, could
// not see the other two: every shadow line it plants is inside a fence.
//
// So these fixtures plant their shadows OUTSIDE any fence, and the fix is a narrowing.
// ══════════════════════════════════════════════════════════════════════════════════════════════

// ── P1-C · a real field shadowed from OUTSIDE a fence ───────────────────────────────────────

/**
 * Ordinary prose. No code block anywhere in this document — which is the point: `fenceMask`
 * tracks ``` and ~~~ and has never had anything to say about a list item or a four-space indent.
 *
 * @param {string} shadow  the two shadow lines, list-marked or indented
 */
const shadowed = (shadow) => [
  '## 2026-06-01 — Drop the legacy column from the production schema',
  `**Context:** ${REALISTIC_BODY}`,
  'We weighed two framings before deciding:',
  '',
  ...shadow,
  '',
  '**Decision:** We dropped the column. It is gone.',
  '**Reversibility:** irreversible',
  '**Affects:** `db/schema.sql`',
  '',
].join('\n');

const OUTSIDE_FENCE_SHADOWS = [
  ['list item', ['- Reversibility: reversible — if we only ADD a column, a revert costs nothing',
    '- Affects: docs/does-not-exist.md — the doc we never wrote']],
  ['four-space indent', ['    Reversibility: reversible — if we only ADD a column, a revert costs nothing',
    '    Affects: docs/does-not-exist.md — the doc we never wrote']],
  ['bold list item', ['- **Reversibility:** reversible — the framing we rejected',
    '- **Affects:** docs/does-not-exist.md — the doc we never wrote']],
];

for (const [label, shadow] of OUTSIDE_FENCE_SHADOWS) {
  test(`P1-C: a ${label} does not shadow the real fields below it`, () => {
    // At the round-3 HEAD this read `reversibility=reversible, subject=deleted,
    // disposition=orphaned` — rule 2 calls orphaned "archivable on sight" — and
    // `apply --only 2026-06-01` exited 0 over a PINNED IRREVERSIBLE entry.
    const root = fixture({ entries: shadowed(shadow), files: { 'db/schema.sql': 'x\n' } });
    const e = plan(root).entries[0];
    assert.equal(e.reversibility, 'irreversible', 'the canonical field wins; the shadow is not read');
    assert.equal(e.subject, 'alive', 'the shadow must not contribute a dead path the entry never named');
    assert.equal(e.disposition, 'refused');
    assert.match(e.reasons.join(' '), /RULE 1: Reversibility is irreversible/);

    const before = readDecisions(root);
    const r = apply(root, ['--only', '2026-06-01']);
    assert.equal(r.code, 1, 'a pinned irreversible entry must not be evictable');
    assert.equal(readDecisions(root), before, 'nothing may be written');
    assert.ok(readDecisions(root).includes('We dropped the column. It is gone.'));
  });
}

test('P1-C: the shadow is not absorbed as the TAIL of the field above it either', () => {
  // Narrowing the head alone leaves the same wrong value readable one line lower: a continuation
  // line has no `**`, so `- Affects: docs/does-not-exist.md` would have joined the value above.
  // Here the real Affects: names no path at all, so an absorbed dead path is the difference
  // between `unknown` (read as alive, refused) and `deleted` (orphaned, archivable on sight).
  const root = fixture({
    entries: [
      '## 2026-06-02 — A decision whose fields are followed immediately by a list',
      `**Context:** ${REALISTIC_BODY}`,
      '**Reversibility:** irreversible',
      '**Affects:** every agent that merges a PR',
      '- Affects: docs/does-not-exist.md',
      '    Affects: docs/also-gone.md',
      '',
    ].join('\n'),
  });
  const e = plan(root).entries[0];
  assert.equal(e.subject, 'unknown', 'the entry named no path; the list must not supply one');
  assert.equal(e.disposition, 'refused');
});

test('P1-C: a WRAPPED Affects: value is still joined — the narrowing did not take that away', () => {
  // The live file wraps at least one Affects: line, and this is the behaviour the round-2
  // widening was originally protecting. It survives, because the wrap is neither a list item
  // nor an indent — which is what makes the narrowing safe rather than merely strict.
  const root = fixture({
    entries: [
      '## 2026-06-03 — A decision whose affects list wraps across two prose lines',
      '',
      '**Decision:** Something.',
      '**Reversibility:** reversible',
      '**Affects:** `gone/one.ts`,',
      '`still/here.ts`',
      '',
    ].join('\n'),
    files: { 'still/here.ts': 'export const y = 2;\n' },
  });
  assert.equal(dispositionOf(plan(root), 'affects list wraps'), 'eligible');
});

// ── P1-C(b) · the class, not the door — two canonical candidates cannot be chosen between ───
//
// These were found by probing the narrowing rather than by waiting for a review. Narrowing the
// selector to the canonical form only moves the shadow to whatever hides a CANONICAL line next,
// and markdown has more than one such construct. So `fieldRead` refuses to choose.

test('P1-C(b): a canonical field inside an HTML COMMENT does not shadow the real one', () => {
  // The fence mask tracks ``` and ~~~ and knows nothing about `<!-- -->`. Measured against the
  // narrowed selector before this refusal existed: reversibility=reversible, affects=[docs/gone.md],
  // subject=deleted, disposition=ORPHANED — rule 2's "archivable on sight", on an irreversible
  // entry with a live subject. The fourth door onto the same P1.
  const root = fixture({
    entries: [
      '## 2026-06-11 — A decision whose earlier draft is commented out above it',
      `**Context:** ${REALISTIC_BODY}`,
      '<!--',
      '**Reversibility:** reversible',
      '**Affects:** docs/does-not-exist.md',
      '-->',
      '**Reversibility:** irreversible',
      '**Affects:** `db/schema.sql`',
      '',
    ].join('\n'),
    files: { 'db/schema.sql': 'x\n' },
  });
  const e = plan(root).entries[0];
  assert.equal(e.reversibility, 'unknown', 'two canonical candidates must not be chosen between');
  assert.notEqual(e.subject, 'deleted', 'and the commented-out path must not release rule 2');
  assert.equal(e.disposition, 'refused');
  assert.match(e.reasons.join(' '), /cannot be decided/);
  const before = readDecisions(root);
  assert.equal(apply(root, ['--only', '2026-06-11']).code, 1);
  assert.equal(readDecisions(root), before);
});

test('P1-C(b): a case-varied duplicate is a duplicate — the selector matches case-insensitively', () => {
  const root = fixture({
    entries: [
      '## 2026-06-12 — A decision whose key is written twice in two cases',
      `**Context:** ${REALISTIC_BODY}`,
      '**reversibility:** reversible',
      '**Reversibility:** irreversible',
      '**Affects:** `db/schema.sql`',
      '',
    ].join('\n'),
    files: { 'db/schema.sql': 'x\n' },
  });
  assert.equal(plan(root).entries[0].reversibility, 'unknown');
  assert.equal(plan(root).entries[0].disposition, 'refused');
});

test('P1-C(b): a duplicated Affects: alone still refuses, through rule 1 rather than rule 2', () => {
  // Only `Affects:` is doubled here, so `Reversibility:` reads normally. An undecidable Affects:
  // yields NO targets, no targets is `unknown`, and `unknown` is read as ALIVE — so rule 1 holds
  // the entry. Fail-closed by the same route `subjectStatus` already used.
  const root = fixture({
    entries: [
      '## 2026-06-13 — A decision whose affects line appears twice',
      `**Context:** ${REALISTIC_BODY}`,
      '<!--',
      '**Affects:** docs/does-not-exist.md',
      '-->',
      '**Reversibility:** irreversible',
      '**Affects:** `db/schema.sql`',
      '',
    ].join('\n'),
    files: { 'db/schema.sql': 'x\n' },
  });
  const e = plan(root).entries[0];
  assert.equal(e.reversibility, 'irreversible');
  assert.equal(e.subject, 'unknown', 'an undecidable Affects: names no path, and no path is not "deleted"');
  assert.equal(e.disposition, 'refused');
});

test('P1-C(b): the ONE canonical line inside a fence is still masked, not counted as a duplicate', () => {
  // Otherwise the live file's own `## Format` block, and every entry that quotes the template,
  // would refuse — the narrowing would have made the tool useless rather than safe.
  const root = fixture({ entries: FENCED, files: { 'db/schema.sql': 'x\n' } });
  const e = plan(root).entries[0];
  assert.equal(e.reversibility, 'irreversible', 'the fenced template is masked, so there is only one candidate');
  assert.equal(e.subject, 'alive');
});

test('P1-C(b): a blockquoted field is not read and is not a candidate either', () => {
  const root = fixture({
    entries: [
      '## 2026-06-14 — A decision quoting an earlier one in a blockquote',
      `**Context:** ${REALISTIC_BODY}`,
      '> **Reversibility:** reversible',
      '> **Affects:** docs/does-not-exist.md',
      '**Reversibility:** irreversible',
      '**Affects:** `db/schema.sql`',
      '',
    ].join('\n'),
    files: { 'db/schema.sql': 'x\n' },
  });
  const e = plan(root).entries[0];
  assert.equal(e.reversibility, 'irreversible', 'a `> ` prefix is not the canonical form');
  assert.equal(e.subject, 'alive');
});

test('P1-C(b): an INDENTED wrapped path still counts — the narrowing must not evict more', () => {
  // The first version of the continuation rule broke on any indented line, which would have
  // DROPPED this path and flipped the entry from alive to deleted — the same rule-2 escalation
  // reached from the opposite side. A narrowing that widens eviction is not a narrowing.
  const root = fixture({
    entries: [
      '## 2026-06-15 — A decision whose affects list wraps onto an indented line',
      '',
      '**Reversibility:** reversible',
      '**Affects:** `gone/one.ts`,',
      '    `still/here.ts`',
      '',
    ].join('\n'),
    files: { 'still/here.ts': 'export const y = 2;\n' },
  });
  const e = plan(root).entries[0];
  assert.equal(e.subject, 'alive', 'the indented continuation carries the only surviving path');
  assert.notEqual(e.disposition, 'orphaned');
});

// ── P1-D · CommonMark's OPENING rule, not only its closing rules ────────────────────────────

const OPENER_ATTACK = [
  '## 2026-07-11 — An entry about the delimiters we use in prose',
  `**Context:** ${REALISTIC_BODY}`,
  '**Decision:** Kept.',
  '**Reversibility:** reversible',
  '**Affects:** `docs/conventions.md`',
  '',
  '``` and ``` are the delimiters we use for code blocks.',
  '',
  '## 2026-07-12 — An irreversible decision that must never be evicted',
  '**Decision:** Dropped the column.',
  '**Reversibility:** irreversible',
  '**Affects:** `db/schema.sql`',
  'THE-IRREVERSIBLE-REASONING.',
  '',
  '```sh',
  'echo hello',
  '```',
  '',
].join('\n');

test('P1-D: a backtick fence whose info string contains a backtick is not a fence at all', () => {
  // CommonMark forbids it, and `FENCE`'s `(.*)$` accepted it. The prose line above opened a
  // block that ran to the next bare ``` and swallowed the entry between — two entries parsed as
  // one, with `ambiguous` still null because the fence count came out even.
  const root = fixture({ entries: OPENER_ATTACK, files: { 'db/schema.sql': 'x\n', 'docs/conventions.md': 'x\n' } });
  const p = plan(root);
  assert.equal(p.entries.length, 2, `expected 2 entries, got ${JSON.stringify(p.entries.map((e) => e.date))}`);
  assert.deepEqual(p.entries.map((e) => e.date), ['2026-07-11', '2026-07-12']);
  assert.equal(p.parse.ambiguous, null, 'the real ```sh block still opens and closes normally');
  assert.equal(dispositionOf(p, 'irreversible decision that must never'), 'refused');
});

test('P1-D: the swallowed entry is no longer archived as part of its predecessor', () => {
  const root = fixture({ entries: OPENER_ATTACK, files: { 'db/schema.sql': 'x\n', 'docs/conventions.md': 'x\n' } });
  assert.equal(apply(root, ['--only', '2026-07-11']).code, 0, 'the first entry is genuinely evictable');
  const after = readDecisions(root);
  assert.ok(after.includes('THE-IRREVERSIBLE-REASONING.'),
    'the irreversible entry must still be in DECISIONS.md, not filed under its predecessor');
  assert.ok(after.includes('## 2026-07-12 — An irreversible decision that must never be evicted'));
  const vol = fs.readFileSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE.md'), 'utf8');
  assert.ok(!vol.includes('THE-IRREVERSIBLE-REASONING.'), 'and it must NOT be in the archive');
});

test('P1-D: a TILDE fence may carry backticks in its info string — the rule is backtick-only', () => {
  // The narrowing must not become "any fence line with a backtick is prose". CommonMark puts the
  // restriction on backtick fences alone, and a ~~~ opener with backticks still opens.
  const root = fixture({
    entries: ['## 2026-07-13 — An entry opening a tilde fence with a backticked info string', '',
      '**Reversibility:** reversible', '**Affects:** nothing', '',
      '~~~`markdown`', '## 2026-07-14 — [Decision title]', '~~~', ''].join('\n'),
  });
  const p = plan(root);
  assert.equal(p.entries.length, 1, 'the tilde fence must still hide the dated heading inside it');
  assert.equal(p.parse.ambiguous, null);
});

test('P1-D: an ordinary ```js opener is unaffected', () => {
  const root = fixture({
    entries: ['## 2026-07-15 — An entry with a perfectly ordinary code block', '',
      '**Reversibility:** reversible', '**Affects:** nothing', '',
      '```js', '// ## 2026-07-16 — [Decision title]', '```', ''].join('\n'),
  });
  assert.equal(plan(root).entries.length, 1);
  assert.equal(plan(root).parse.ambiguous, null);
});

// ── P1-E · the splice must land on the entry, not on a verbatim quote of it ─────────────────

const B_BODY = [
  '## 2026-07-22 — Second decision, quoted verbatim by the first one above it',
  `**Context:** ${REALISTIC_BODY}`,
  '**Decision:** Something was chosen.',
  '**Reversibility:** reversible',
  '**Affects:** `docs/b.md`',
];

/**
 * One entry quoting another VERBATIM inside a fence. This became reachable only because the
 * round-3 fence mask made such a quote legal — before it, the quoted heading tore the file in
 * half and the parse was ambiguous, so `apply` refused before reaching the splice.
 */
const QUOTING = [
  '## 2026-07-21 — First decision, which quotes the second one verbatim',
  `**Context:** ${REALISTIC_BODY}`,
  '**Decision:** Something was chosen.',
  '**Reversibility:** reversible',
  '**Affects:** `docs/a.md`',
  '',
  'For reference, the entry we are reacting to reads exactly:',
  '',
  '```markdown',
  ...B_BODY,
  '```',
  '',
  ...B_BODY,
  '',
].join('\n');

const QUOTED_MARKER = '**Decision:** Something was chosen.\n**Reversibility:** reversible\n**Affects:** `docs/b.md`';

test('P1-E: an entry quoted verbatim elsewhere is evicted from its OWN position', () => {
  // `newDecisions.indexOf(entry.text)` is a document-wide search and takes the FIRST match. At
  // the round-3 HEAD the stub was spliced into the quoting entry's fenced example: the evicted
  // entry survived intact in DECISIONS.md, its body was ALSO appended to the archive, a trailing
  // blank line was eaten — and all five conservation conditions passed, because the spliced
  // region is the same length wherever it lands. The report said "conservation closes to zero".
  const root = fixture({ entries: QUOTING, files: { 'docs/a.md': 'x\n', 'docs/b.md': 'x\n' } });
  const r = apply(root, ['--only', '2026-07-22']);
  assert.equal(r.code, 0, r.err);
  const after = readDecisions(root);

  const tail = after.slice(after.lastIndexOf('## 2026-07-22'));
  assert.match(tail, /^## 2026-07-22 [^\n]*\n\*Archived to `DECISIONS_ARCHIVE\.md`/,
    'the real entry, at its own offset, must be the one replaced by the stub');
  assert.equal(after.split(QUOTED_MARKER).length - 1, 1,
    'exactly one copy of the body may remain, and it is the quote inside the OTHER entry');
  assert.match(after, /```markdown\n## 2026-07-22 [^\n]*\n\*\*Context:\*\*/,
    "the quoting entry's fenced example must be untouched — a stub inside it is the defect");
});

test('P1-E: the quoting entry is not disturbed, and the archive holds exactly one body', () => {
  const root = fixture({ entries: QUOTING, files: { 'docs/a.md': 'x\n', 'docs/b.md': 'x\n' } });
  assert.equal(apply(root, ['--only', '2026-07-22']).code, 0);
  const after = readDecisions(root);
  const vol = fs.readFileSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE.md'), 'utf8');
  assert.ok(after.includes('## 2026-07-21 — First decision, which quotes the second one verbatim'));
  assert.equal(vol.split(QUOTED_MARKER).length - 1, 1, 'the archive must hold one copy, not zero and not two');
  assert.equal(plan(root).entries.length, 2, 'the file must still parse as two entries afterwards');
});

test('P1-E: the recorded offsets are exact, for LF and for CRLF', () => {
  // The splice is only as good as the offsets. `text.slice(startOffset, endOffset)` must BE the
  // entry text, or the guard that replaced `indexOf` refuses every apply.
  const { parseDecisionEntries } = createRequire(import.meta.url)('./lib/memory-entries.js');
  for (const eol of ['\n', '\r\n']) {
    const doc = ['# Decisions', '', '## 2026-07-23 — One', '**Reversibility:** reversible', '**Affects:** a/b.ts', '',
      '## 2026-07-24 — Two', '**Reversibility:** reversible', '**Affects:** c/d.ts', ''].join(eol);
    const entries = parseDecisionEntries(doc);
    assert.equal(entries.length, 2, JSON.stringify(eol));
    for (const e of entries) {
      assert.equal(doc.slice(e.startOffset, e.endOffset), e.text,
        `offsets must be exact for ${JSON.stringify(eol)} at ${e.date}`);
    }
  }
});

test('P1-E: a TWO-entry batch splices both at their own offsets', () => {
  // Offsets are only valid while nothing below them has moved, which is why `ordered` splices
  // bottom-up. One batch, two entries, and the first must not be replaced using an offset the
  // second one's replacement invalidated.
  const root = fixture({
    entries: [
      entry({ date: '2026-07-25', title: 'First decision about the shape of the queue' }),
      entry({ date: '2026-07-26', title: 'Second decision about the shape of the cache' }),
      entry({ date: '2026-07-27', title: 'Third decision about the shape of the log' }),
    ].join('\n'),
  });
  const r = apply(root, ['--only', '2026-07-25', '--only', '2026-07-27']);
  assert.equal(r.code, 0, r.err);
  const after = readDecisions(root);
  for (const d of ['2026-07-25', '2026-07-27']) {
    const tail = after.slice(after.indexOf(`## ${d}`));
    assert.match(tail, new RegExp(`^## ${d} [^\\n]*\\n\\*Archived to`), `${d} must be replaced at its own offset`);
  }
  assert.ok(after.includes('**Decision:** Something was chosen.'), 'the untouched middle entry keeps its body');
  assert.equal(plan(root).entries.length, 3);
  const vol = fs.readFileSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE.md'), 'utf8');
  assert.ok(vol.includes('## 2026-07-25 —') && vol.includes('## 2026-07-27 —'));
  assert.ok(!vol.includes('## 2026-07-26 —'), 'the entry nobody selected must not be archived');
});

// ── P2-1 · THE CALL SITE, not only the conditions ───────────────────────────────────────────
//
// Each condition was killed by its own unit test and by nothing else. Two mutations at the CALL
// SITE were measured on 2026-08-26: discarding the whole gate cost ONE failing test, and passing
// `volExisting: ''` cost ZERO — the destination check, the one this branch's own commit message
// calls out as previously "in the report and in no assertion", was switchable off in production
// code with a green suite. The second mutation is now unwritable: there is no destination-content
// parameter to blank. These drive `cmdApply` itself, over a copy, and fail when it is neutered.

/** The dependency closure of the CLI: the tool, the parser, and the parser's one import. */
const CLI_FILES = [['scripts', 'evict-memory.mjs'], ['scripts', 'lib', 'memory-entries.js'], ['scripts', 'lib', 'claims.js']];

/**
 * A throwaway copy of the CLI with one edit applied to `evict-memory.mjs`.
 *
 * `realpathSync` is not decoration: the tool guards its command dispatch on
 * `resolve(process.argv[1]) === resolve(import.meta.url)`, and on macOS `os.tmpdir()` is
 * `/var` → `/private/var`. Invoked through the unresolved path the copy runs NO command, exits
 * 0 and prints nothing — which would satisfy a "the mutant stopped refusing" assertion for
 * entirely the wrong reason.
 */
function cliCopy(edits = []) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'evict-callsite-')));
  roots.push(dir);
  fs.mkdirSync(path.join(dir, 'scripts', 'lib'), { recursive: true });
  for (const rel of CLI_FILES) fs.copyFileSync(path.join(REPO, ...rel), path.join(dir, ...rel));
  const target = path.join(dir, 'scripts', 'evict-memory.mjs');
  for (const [from, to] of edits) {
    const before = fs.readFileSync(target, 'utf8');
    const hits = before.split(from).length - 1;
    // EXACTLY once. The first version of this helper anchored on the argument list alone, which
    // appears in `conservationIssues`'s own signature FIRST — so the mutation landed on the
    // function instead of on the call site, produced a syntax error, and the test failed for a
    // reason that had nothing to do with the gate. An ambiguous anchor proves nothing either way.
    assert.equal(hits, 1, `mutation anchor must match exactly once, matched ${hits}: ${from}`);
    const after = before.replace(from, to);
    assert.notEqual(after, before, 'mutation was a no-op — the test would prove nothing');
    fs.writeFileSync(target, after);
  }
  return path.join(dir, 'scripts', 'evict-memory.mjs');
}

const CALL_SITE = 'const conservation = conservationIssues({';

/** A fixture whose only obstacle is the conservation gate: the stub outweighs the body. */
const growthFixture = () => fixture({ entries: entry({ date: '2026-07-31', title: 'A tiny decision about one thing', body: 'x' }) });
const GROWTH_ARGS = ['--only', '2026-07-31', '--reason', 'y'.repeat(2_000)];

test('P2-1 CALL SITE: the copied CLI behaves exactly like the real one — the control', () => {
  // Without this the two mutations below could pass because the copy does nothing at all.
  const root = growthFixture();
  const clean = run(cliCopy(), ['apply', '--root', root, '--date', '2026-08-26', ...GROWTH_ARGS]);
  assert.equal(clean.code, 1, `the unmutated copy must refuse: ${clean.out}${clean.err}`);
  assert.match(clean.err, /conservation check failed/);
});

test('P2-1 CALL SITE: discarding the gate is caught — the refusal disappears', () => {
  const mutant = cliCopy([[CALL_SITE, 'const conservation = []; const discarded = ((_) => [])({']]);
  const root = growthFixture();
  const before = readDecisions(root);
  const r = run(mutant, ['apply', '--root', root, '--date', '2026-08-26', ...GROWTH_ARGS]);
  assert.equal(r.code, 0,
    'with the gate discarded the tool must sail through — if it still refuses, the refusal is coming '
    + 'from somewhere else and this call site is not what the growth test is pinning');
  assert.notEqual(readDecisions(root), before, 'and it must have written the growth it was asked to refuse');
});

test('P2-1 CALL SITE: corrupting `vol` there is caught — the gate really does read the destination', () => {
  // The successor to `volExisting: ''`. The content is no longer a parameter, so the only way to
  // lie to the destination check from the call site is to lie about WHICH volume — and `vol` is
  // what the write itself opens, so this cannot be done quietly.
  const root = fixture({
    entries: entry({ date: '2026-07-30', title: 'An ordinary decision with an ordinary body' }),
    archives: { 'DECISIONS_ARCHIVE.md': '# Archive\n\nPRIOR-VOLUME-CONTENT-SENTINEL\n' },
  });
  const args = ['apply', '--root', root, '--date', '2026-08-26', '--only', '2026-07-30'];

  const clean = run(cliCopy(), args);
  assert.equal(clean.code, 0, `the unmutated copy must succeed here: ${clean.err}`);

  const mutant = cliCopy([[
    'removed: before.decisions - after.decisions,\n    movedBodies, residue, chosen, newVolume, newDecisions, vol,',
    'removed: before.decisions - after.decisions,\n    movedBodies, residue, chosen, newVolume, newDecisions,\n'
      + "    vol: { name: vol.name, number: vol.number, abs: '/nonexistent/volume.md', fresh: false },",
  ]]);
  const fresh = fixture({
    entries: entry({ date: '2026-07-30', title: 'An ordinary decision with an ordinary body' }),
    archives: { 'DECISIONS_ARCHIVE.md': '# Archive\n\nPRIOR-VOLUME-CONTENT-SENTINEL\n' },
  });
  const r = run(mutant, ['apply', '--root', fresh, '--date', '2026-08-26', '--only', '2026-07-30']);
  assert.equal(r.code, 1, 'a destination the gate cannot read must refuse, not pass');
  assert.match(r.err, /prior content could not be established/);
});

// ── P3 · the fence mask must survive CRLF in the near-miss path too ─────────────────────────

test('P3: a CRLF entry does not get a spurious did-you-mean out of a FENCED misspelling', () => {
  // `readReversibility`'s near-miss scan split on `\n` without stripping `\r`, unlike the two
  // other readers. On CRLF that gave `fenceMask` a `\r`-suffixed line array, `FENCE`'s `$` never
  // anchored, the mask came back all-false, and a misspelling quoted INSIDE a fence was reported
  // as this entry's own near-miss. It failed closed either way, which is why it is a P3 — but the
  // message sent the reader to the wrong line.
  const crlf = ['## 2026-08-01 — An entry quoting a misspelling inside a fence, in CRLF',
    '', '```', '**Reversability:** reversible', '```', '', '**Decision:** Something.', '**Affects:** nothing', '',
  ].join('\r\n');
  const root = fixture({ entries: crlf, header: false });
  const e = plan(root).entries[0];
  assert.equal(e.disposition, 'refused');
  assert.match(e.reasons.join(' '), /no `Reversibility:` field/);
  assert.ok(!e.reasons.join(' ').includes('typo'),
    'the misspelling is inside a fence; on CRLF the mask must still see that');
});

// ── P3 · the claim about the REAL file must be made against the real file ───────────────────

test('the real DECISIONS.md parses unambiguously and its ## Format fence is inert', () => {
  // The earlier test built its own fixture, so it established a property of the fixture. This
  // reads the committed bytes.
  const real = fs.readFileSync(path.join(REPO, '.claude', 'memory', 'DECISIONS.md'), 'utf8');
  const { parseDecisionEntries } = createRequire(import.meta.url)('./lib/memory-entries.js');
  const entries = parseDecisionEntries(real);
  assert.equal(entries.ambiguous, null, `the live file must parse cleanly: ${entries.ambiguous}`);
  assert.ok(real.includes('## YYYY-MM-DD — [Decision title]'),
    'the ## Format section still demonstrates the construct — if this fails the test below is vacuous');
  assert.ok(!entries.some((e) => e.title.includes('[Decision title]')),
    'the fenced template must not be an entry');

  // And with the placeholder date filled in — the state one careless edit away.
  const armed = real.replace('## YYYY-MM-DD — [Decision title]', '## 2026-12-31 — [Decision title]');
  const armedEntries = parseDecisionEntries(armed);
  assert.equal(armedEntries.ambiguous, null);
  assert.ok(!armedEntries.some((e) => e.date === '2026-12-31'),
    'filling in the template date must still not create an entry');
});
