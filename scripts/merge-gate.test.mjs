// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:merge-gate`.
//
// scripts/merge-gate.test.mjs — the gate on `warroom merge`, executed rather than described.
//
// WHAT FAILED HERE
// `warroom merge` merged a branch into LOCAL main and never pushed. CI never ran on that route,
// and branch protection — which is on, with required contexts — cannot see a merge that never
// reaches the remote. The PR route was gated. This route was gated by nothing at all.
//
// WHY THESE TESTS DRIVE THE REAL PROGRAM
// Every case below runs `bin/warroom merge` for real, against a throwaway repository under
// os.tmpdir(), and then asserts on where `main` actually points. Asserting that the source
// contains the string "refuse" would pass just as happily against a fix comment. In this repo a
// fix comment and a live bug are indistinguishable to grep; twelve false findings were produced
// that way. So: run it, then look at the refs.
//
// THE PROPERTY THE WHOLE DESIGN RESTS ON
// The verdict is keyed to sha256 of the diff, EXCLUDING `.qa/verdicts/**`. That exclusion is what
// lets the verdict be committed without invalidating itself. PR #77 keyed a verdict to a HEAD SHA,
// which stops existing the moment the record is committed. `subject survives committing the
// verdict` below is that difference, executed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WARROOM = path.join(REPO, 'bin', 'warroom');
const VERDICT = path.join(REPO, 'scripts', 'verdict.mjs');
const BRANCH = 'ceo-1-1700000000';

const tmpRoots = [];
process.on('exit', () => {
  for (const d of tmpRoots) fs.rmSync(d, { recursive: true, force: true });
});

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function run(cmd, args, cwd = REPO) {
  try {
    return { code: 0, stdout: execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), stderr: '' };
  } catch (e) {
    return { code: e.status ?? 1, stdout: (e.stdout || '').toString(), stderr: (e.stderr || '').toString() };
  }
}

const verdict = (args) => run('node', [VERDICT, ...args]);
const merge = (cfg) => run('bash', [WARROOM, '--config', cfg, 'merge', '1']);

/**
 * A throwaway upstream + clone, with one commit of real work on a ceo-* branch.
 *
 * The `.warroom.yml` is written OUTSIDE the repository on purpose. Committing it would put the
 * config into the very diff under test, and then checking out `main` would delete the config the
 * launcher is being run with. Both happened while writing these tests.
 */
function fixture({ workFile = 'scripts/thing.mjs', workBody = 'export const x = 1;\n' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-'));
  tmpRoots.push(root);
  const up = path.join(root, 'up');
  const proj = path.join(root, 'proj');

  fs.mkdirSync(up);
  git(up, ['init', '-q', '-b', 'main']);
  git(up, ['config', 'user.email', 'fixture@example.test']);
  git(up, ['config', 'user.name', 'fixture']);
  fs.writeFileSync(path.join(up, 'f.txt'), 'base\n');
  git(up, ['add', '-A']);
  git(up, ['commit', '-qm', 'base']);

  git(root, ['clone', '-q', up, proj]);
  git(proj, ['config', 'user.email', 'fixture@example.test']);
  git(proj, ['config', 'user.name', 'fixture']);
  git(proj, ['switch', '-qc', BRANCH]);
  const wf = path.join(proj, workFile);
  fs.mkdirSync(path.dirname(wf), { recursive: true });
  fs.writeFileSync(wf, workBody);
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'work']);
  git(proj, ['switch', '-q', 'main']);

  const cfg = path.join(root, 'warroom.yml');
  fs.writeFileSync(cfg, `session: fixture\nproject_dir: ${proj}\nstate_dir: ${path.join(root, 'state')}\n`);
  return { root, up, proj, cfg };
}

/** Record a verdict on the branch and commit ONLY the verdict directory. */
function recordAndCommit(proj, { verdictValue = 'PASS' } = {}) {
  git(proj, ['switch', '-q', BRANCH]);
  const r = verdict(['record', '--repo', proj, '--ref', BRANCH, '--verdict', verdictValue, '--by', 'fixture-reviewer', '--json']);
  assert.equal(r.code, 0, `record failed: ${r.stderr}`);
  git(proj, ['add', '.qa']);
  git(proj, ['commit', '-qm', `qa(verdict): ${verdictValue}`]);
  git(proj, ['switch', '-q', 'main']);
  return JSON.parse(r.stdout);
}

const mainSubject = (proj) => git(proj, ['log', '--format=%s', '-1', 'main']).trim();
const branchExists = (proj) => git(proj, ['branch', '--list', 'ceo-1-*']).trim().length > 0;

// ── The anchor ───────────────────────────────────────────────────────────────────────────────

test('the subject survives committing the verdict — the property PR #77 got wrong', () => {
  const { proj } = fixture();
  git(proj, ['switch', '-q', BRANCH]);
  const before = verdict(['subject', '--repo', proj, '--ref', BRANCH]).stdout.trim();
  assert.match(before, /^[0-9a-f]{64}$/);

  git(proj, ['switch', '-q', 'main']);
  recordAndCommit(proj);

  git(proj, ['switch', '-q', BRANCH]);
  const after = verdict(['subject', '--repo', proj, '--ref', BRANCH]).stdout.trim();
  assert.equal(after, before, 'recording the verdict changed the subject the verdict is about');
});

test('the subject changes when a reviewed byte changes', () => {
  const { proj } = fixture();
  git(proj, ['switch', '-q', BRANCH]);
  const before = verdict(['subject', '--repo', proj, '--ref', BRANCH]).stdout.trim();
  fs.appendFileSync(path.join(proj, 'scripts', 'thing.mjs'), 'export const smuggled = 2;\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'sneak']);
  const after = verdict(['subject', '--repo', proj, '--ref', BRANCH]).stdout.trim();
  assert.notEqual(after, before, 'the subject did not move when the diff did — the binding is not a binding');
});

test('the tier on a verdict comes from the classifier, not from a merge strategy', () => {
  const { proj } = fixture();
  const rec = recordAndCommit(proj);
  // scripts/** floors at full in .claude/qa-tier-floor.yml. What matters here is that the value is
  // a tier the classifier can actually produce — `fast-forward` was never one.
  assert.ok(['lite', 'full', 'irreversible'].includes(rec.tier), `not a classifier tier: ${rec.tier}`);
  const floor = run('node', [path.join(REPO, 'scripts', 'classify.mjs'), '--floor', 'scripts/thing.mjs']);
  assert.match(floor.stdout, new RegExp(`floor=${rec.tier}`), 'verdict tier disagrees with scripts/classify.mjs');
});

// ── check: every refusal reason ──────────────────────────────────────────────────────────────

test('an uncommitted verdict does not count', () => {
  const { proj } = fixture();
  git(proj, ['switch', '-q', BRANCH]);
  assert.equal(verdict(['record', '--repo', proj, '--ref', BRANCH, '--verdict', 'PASS', '--by', 'x']).code, 0);
  const r = verdict(['check', '--repo', proj, '--ref', BRANCH]);
  assert.equal(r.code, 1, 'a verdict sitting in the working tree was accepted');
  assert.match(r.stderr, /REFUSED/);
});

test('a FAIL verdict is refused, and says so', () => {
  const { proj } = fixture();
  recordAndCommit(proj, { verdictValue: 'FAIL' });
  const r = verdict(['check', '--repo', proj, '--ref', BRANCH]);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /verdict=FAIL/);
});

test('a verdict renamed onto another subject is refused', () => {
  const { proj } = fixture();
  const rec = recordAndCommit(proj);
  git(proj, ['switch', '-q', BRANCH]);
  // Move a real, signed-off record onto the filename of a different subject.
  const forged = 'a'.repeat(64);
  fs.renameSync(path.join(proj, rec.path), path.join(proj, '.qa', 'verdicts', `${forged}.json`));
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'rename']);
  const r = verdict(['check', '--repo', proj, '--ref', BRANCH]);
  assert.equal(r.code, 1, 'a renamed verdict was accepted for a diff it never reviewed');
});

test('check refuses — not passes — when origin/main cannot be resolved', () => {
  // Fail-closed on an indeterminate answer. `run-gate --require` does the opposite on its default
  // ref: an unreadable diff becomes "Nothing to gate", exit 0. That is the shape being avoided.
  const { proj } = fixture();
  git(proj, ['remote', 'remove', 'origin']);
  git(proj, ['update-ref', '-d', 'refs/remotes/origin/main']);
  const r = verdict(['check', '--repo', proj, '--ref', BRANCH]);
  assert.equal(r.code, 2, 'an undeterminable base must refuse, never pass');
  assert.match(r.stderr, /cannot resolve "origin\/main"/);
});

// ── warroom merge, driven for real ───────────────────────────────────────────────────────────

test('merge is REFUSED when no verdict is bound, and main does not move', () => {
  const { proj, cfg } = fixture();
  const before = git(proj, ['rev-parse', 'main']).trim();

  const r = merge(cfg);
  assert.notEqual(r.code, 0, 'warroom merge exited 0 with no verdict');
  assert.match(r.stdout + r.stderr, /REFUSED/);

  assert.equal(git(proj, ['rev-parse', 'main']).trim(), before, 'main moved despite the refusal');
  assert.ok(branchExists(proj), 'the branch was deleted by a merge that did not happen');
});

test('the refusal names the subject it computed and the command that satisfies it', () => {
  // A gate that refuses without saying what would satisfy it trains people to route around it.
  const { proj, cfg } = fixture();
  const expected = verdict(['subject', '--repo', proj, '--ref', BRANCH]).stdout.trim();
  const out = merge(cfg);
  const text = out.stdout + out.stderr;
  assert.ok(text.includes(expected), 'the refusal did not print the subject it computed');
  assert.match(text, /verdict\.mjs record --verdict PASS/);
});

test('merge is ALLOWED when a committed verdict matches the subject', () => {
  const { proj, cfg } = fixture();
  recordAndCommit(proj);

  const r = merge(cfg);
  assert.equal(r.code, 0, `merge refused a validly gated branch:\n${r.stdout}\n${r.stderr}`);
  assert.equal(mainSubject(proj), 'qa(verdict): PASS', 'main did not advance to the branch tip');
  assert.ok(
    git(proj, ['log', '--format=%s', 'main']).includes('work'),
    'the reviewed work is not on main'
  );
});

test('a verdict recorded, then out-run by a later commit, is REFUSED', () => {
  // The attack the content subject exists to stop: get a PASS, then push one more commit.
  const { proj, cfg } = fixture();
  recordAndCommit(proj);

  git(proj, ['switch', '-q', BRANCH]);
  fs.appendFileSync(path.join(proj, 'scripts', 'thing.mjs'), 'export const smuggled = 2;\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'smuggled']);
  git(proj, ['switch', '-q', 'main']);

  const before = git(proj, ['rev-parse', 'main']).trim();
  const r = merge(cfg);
  assert.notEqual(r.code, 0, 'a stale verdict was accepted for a diff it never saw');
  assert.equal(git(proj, ['rev-parse', 'main']).trim(), before, 'main moved on a stale verdict');
});

test('the merge logs the classifier tier and the strategy in separate fields', () => {
  const { proj, cfg, root } = fixture();
  recordAndCommit(proj);
  assert.equal(merge(cfg).code, 0);

  const events = fs.readFileSync(path.join(root, 'state', 'events.jsonl'), 'utf8');
  const done = events.trim().split('\n').map((l) => JSON.parse(l)).filter((e) => e.event === 'merge_complete');
  assert.equal(done.length, 1);
  assert.match(done[0].details, /tier=(lite|full|irreversible)/, 'tier= must hold a classifier tier');
  assert.match(done[0].details, /strategy=fast-forward/, 'the merge strategy needs its own field');
  assert.doesNotMatch(done[0].details, /tier=(fast-forward|auto-merge|ai-assisted)/, 'a merge strategy is back in the tier field');
});

test('a refusal is recorded as an event, so a blocked merge is visible afterwards', () => {
  const { proj, cfg, root } = fixture();
  assert.notEqual(merge(cfg).code, 0);
  const events = fs.readFileSync(path.join(root, 'state', 'events.jsonl'), 'utf8');
  assert.match(events, /"event":"merge_refused"/);
  assert.match(events, /reason=no-matching-verdict/);
});

// ── the conflict route ───────────────────────────────────────────────────────────────────────

test('a conflicting merge is REFUSED even with a valid verdict, and main does not move', () => {
  // The second unreviewed route into main. The verdict is bound to the BRANCH DIFF; a conflict
  // resolution is content that diff does not contain. Tier 3 used to write a model's stdout over
  // the conflicted file, commit it to main, and log `merge_complete` at the verdict's own tier —
  // so events.jsonl asserted a review of bytes no reviewer ever saw.
  const { proj, cfg, root } = fixture();

  // The branch edits a line that main will also edit.
  git(proj, ['switch', '-q', BRANCH]);
  fs.writeFileSync(path.join(proj, 'f.txt'), 'branch side\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'branch edits f.txt']);
  git(proj, ['switch', '-q', 'main']);

  // The verdict covers the branch as it stands, that edit included.
  recordAndCommit(proj);

  // LOCAL main edits the same line. origin/main is untouched, so the subject stays exactly what
  // the verdict approved — the verdict is still valid, and the merge still cannot apply cleanly.
  // That combination is the whole point: refusal here is not the gate refusing, it is the ladder.
  fs.writeFileSync(path.join(proj, 'f.txt'), 'main side\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'main edits f.txt']);

  assert.equal(
    verdict(['check', '--repo', proj, '--ref', BRANCH]).code, 0,
    'the fixture verdict does not validate — a refusal here would prove nothing about tier 3'
  );

  const before = git(proj, ['rev-parse', 'main']).trim();
  const r = merge(cfg);

  assert.notEqual(r.code, 0, 'a conflicted merge exited 0');
  assert.equal(git(proj, ['rev-parse', 'main']).trim(), before, 'main moved onto content no verdict covered');
  assert.equal(
    fs.readFileSync(path.join(proj, 'f.txt'), 'utf8'), 'main side\n',
    'main carries a conflict resolution that nothing reviewed'
  );
  assert.equal(
    run('git', ['rev-parse', '-q', '--verify', 'MERGE_HEAD'], proj).code, 1,
    'the repository was left mid-merge; a refusal must leave it as it was found'
  );
  assert.ok(branchExists(proj), 'the branch was deleted by a merge that did not happen');
});

test('the conflict refusal is logged as a refusal, never as a merge_complete', () => {
  // The audit half of the defect. Even a tier 3 that resolved "well" logged `merge_complete` with
  // the verdict's tier, which is the record claiming coverage the verdict did not have.
  const { proj, cfg, root } = fixture();

  git(proj, ['switch', '-q', BRANCH]);
  fs.writeFileSync(path.join(proj, 'f.txt'), 'branch side\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'branch edits f.txt']);
  git(proj, ['switch', '-q', 'main']);
  recordAndCommit(proj);
  fs.writeFileSync(path.join(proj, 'f.txt'), 'main side\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'main edits f.txt']);

  assert.notEqual(merge(cfg).code, 0);

  const events = fs.readFileSync(path.join(root, 'state', 'events.jsonl'), 'utf8');
  assert.match(events, /"event":"merge_refused"/, 'the refusal is invisible in the audit trail');
  assert.match(events, /reason=conflict-outside-verdict/, 'the refusal does not name why it refused');
  assert.doesNotMatch(events, /"event":"merge_complete"/, 'a merge that did not happen was logged as complete');
});

test('the conflict refusal says how to make the resolution reviewable', () => {
  // A gate that refuses without naming the remedy trains people to route around it — the same
  // reason `the refusal names the subject it computed` exists for the no-verdict path.
  const { proj, cfg } = fixture();

  git(proj, ['switch', '-q', BRANCH]);
  fs.writeFileSync(path.join(proj, 'f.txt'), 'branch side\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'branch edits f.txt']);
  git(proj, ['switch', '-q', 'main']);
  recordAndCommit(proj);
  fs.writeFileSync(path.join(proj, 'f.txt'), 'main side\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'main edits f.txt']);

  const text = (() => { const o = merge(cfg); return o.stdout + o.stderr; })();
  assert.match(text, /Refusing to merge/);
  assert.match(text, /f\.txt/, 'the refusal did not name the conflicted file');
  assert.match(text, new RegExp(`git switch ${BRANCH}`), 'the refusal did not say to resolve on the branch');
  assert.match(text, /verdict\.mjs record --verdict PASS/, 'the refusal did not say to re-record a verdict');
});

// ── branch deletion ──────────────────────────────────────────────────────────────────────────

test('the merge exits delete with -d, never -D', () => {
  // The one source-level assertion here, and it earns its place: `-D` succeeding on an unmerged
  // branch is silent and unrecoverable, so there is no post-hoc state to observe. Scoped to
  // cmd_merge — `done` (guarded by a successful push) and the interactive `prune` legitimately
  // force, and are out of scope.
  const src = fs.readFileSync(WARROOM, 'utf8');
  const body = src.slice(src.indexOf('\ncmd_merge() {'), src.indexOf('\ncmd_files() {'));
  assert.ok(body.length > 0, 'could not locate cmd_merge — update this test, not the assertion');
  assert.doesNotMatch(body, /branch -D/, 'cmd_merge force-deletes a branch again');
  assert.equal((body.match(/_delete_merged_branch /g) || []).length, 3, 'all three merge exits must route through the -d helper');
  assert.match(src, /git -C "\$PROJECT_DIR" branch -d "\$branch"/, '_delete_merged_branch must use -d');
});

test('an unmerged branch is KEPT and reported, not force-deleted', () => {
  const { proj } = fixture();
  // The helper is driven directly. Reaching it through cmd_merge would need a merge that both
  // reports success and fails to incorporate the branch — which is the bug it guards against, so
  // it cannot be staged from outside. Sourcing the whole launcher would run its config discovery,
  // so only the function under test is extracted, with the two variables it reads.
  const src = fs.readFileSync(WARROOM, 'utf8');
  const fn = src.slice(src.indexOf('_delete_merged_branch() {'), src.indexOf('\n# Say plainly'));
  assert.ok(fn.includes('branch -d'), 'could not extract _delete_merged_branch');

  const r = run('bash', ['-c', `set -u\nPROJECT_DIR=${JSON.stringify(proj)}\nC_PEACH=''\nRESET=''\n${fn}\n_delete_merged_branch ${BRANCH}`]);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /kept/, 'an unmerged branch was not reported as kept');
  assert.ok(branchExists(proj), 'the unmerged branch was deleted anyway');
});
