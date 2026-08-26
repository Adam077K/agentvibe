// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:merge-gate`.
//
// scripts/merge-gate.test.mjs — the gate on `warroom merge`, executed rather than described.
//
// WHAT FAILED HERE
// `warroom merge` merged a branch into LOCAL main and never pushed. CI never ran on that route,
// and branch protection cannot see a merge that never reaches the remote. The PR route was gated.
// This route was gated by nothing at all.
//
// AND THEN: THE ROUTE ITSELF WAS THE DEFECT (2026-08-26)
// A gated dead end is still a dead end. `merge` had no route to origin at all, defended by a
// comment claiming a push "would not help — main is protected with required contexts, so a direct
// push is rejected." main carries `enforce_admins: false`, so the direct push is NOT rejected; 48
// commits reached main that way in one session. The premise was false, so the reason-not-to-act
// was not a reason. `merge` now opens a pull request by default and `--local` is the opt-in dead
// end — which also makes it safe to turn `enforce_admins` on, because qa-lead-pass.yml is a
// REQUIRED check that triggers on `pull_request` only and a pushed commit can never satisfy it.
//
// The tests below therefore assert TWO destinations, and the difference between them is the whole
// point: the PR route must reach the upstream and must NOT move local main; --local must move
// local main and must NOT reach the upstream. `onUpstream()` asks the upstream repository, never
// the push command's own output.
//
// AND THEN: THE FIXTURE COULD NOT BUILD THE CONDITION IT TESTED (2026-08-26)
// `gh ABSENT is a refusal` removed gh by listing a PATH that left gh's directory out —
// "/opt/homebrew/bin here", said the comment. gh is /usr/bin/gh on ubuntu-latest, which that PATH
// includes, so the fixture built "gh is absent" on the author's machine and "gh is present" on the
// runner. It failed there (run 32943665467) and had never proved anything here. The environment is
// constructed now, by mirroring PATH minus every executable named `gh` — a name is removable on
// every machine, a location is not — and stubGh asserts both halves of its own premise before any
// test asserts behaviour. Third time in this repo that one machine's layout was baked into a test:
// $HOME/.claude/plans existing, a case-folding filesystem (#102), and gh's install path.
//
// WHY THESE TESTS DRIVE THE REAL PROGRAM
// Every case below runs `bin/warroom merge` for real, against a throwaway repository under
// os.tmpdir(), and then asserts on where `main` actually points. Asserting that the source
// contains the string "refuse" would pass just as happily against a fix comment. In this repo a
// fix comment and a live bug are indistinguishable to grep; twelve false findings were produced
// that way. So: run it, then look at the refs.
//
// THE PROPERTY THE WHOLE DESIGN RESTS ON
// The verdict is keyed to sha256 of the diff, EXCLUDING the verdict records —
// `:(exclude,glob).qa/verdicts/*.json`. That exclusion is what
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

function run(cmd, args, cwd = REPO, env = undefined, input = undefined) {
  const opts = { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
  if (env) opts.env = env;
  if (input !== undefined) { opts.input = input; opts.stdio = ['pipe', 'pipe', 'pipe']; }
  try {
    return { code: 0, stdout: execFileSync(cmd, args, opts), stderr: '' };
  } catch (e) {
    return { code: e.status ?? 1, stdout: (e.stdout || '').toString(), stderr: (e.stderr || '').toString() };
  }
}

const verdict = (args) => run('node', [VERDICT, ...args]);

/** The default route: push and open a pull request. `env` supplies the stub gh (see stubGh). */
const merge = (cfg, env) => run('bash', [WARROOM, '--config', cfg, 'merge', '1'], REPO, env);
/** The opt-in route: merge into LOCAL main, which never reaches origin. */
const mergeLocal = (cfg) => run('bash', [WARROOM, '--config', cfg, 'merge', '1', '--local'], REPO);

const NODE_DIR = path.dirname(process.execPath);

/** Does an executable of this name resolve on this PATH? Used to prove the no-gh fixture is one. */
function resolvesOnPath(name, PATH) {
  for (const dir of PATH.split(':')) {
    if (!dir) continue;
    try { fs.accessSync(path.join(dir, name), fs.constants.X_OK); return path.join(dir, name); }
    catch { /* not here */ }
  }
  return null;
}

/**
 * Mirror `sources` into `dir` as symlinks, leaving out every executable named `gh`.
 *
 * This is how "gh is not installed" is constructed. Enumerating a PATH that happens to exclude
 * gh's directory is not a construction, it is a guess about the machine — and the guess was
 * wrong on the only machine whose verdict blocks a merge. Removing the NAME from a directory we
 * built ourselves is true on every machine, because it does not ask where gh lives.
 *
 * Earlier entries win, which is how PATH itself resolves, so the mirror preserves the ambient
 * precedence order rather than inverting it.
 *
 * Exported through `ghFreeBin()` for the fixture and tested directly by the self-test below —
 * the removal is proved against a directory that provably HAS a gh, so the proof does not depend
 * on this machine owning one.
 */
function mirrorWithoutGh(dir, sources) {
  fs.mkdirSync(dir, { recursive: true });
  const seen = new Set();
  for (const src of sources) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    let entries;
    try { entries = fs.readdirSync(src); } catch { continue; }
    for (const name of entries) {
      if (name === 'gh') continue;
      try { fs.symlinkSync(path.join(src, name), path.join(dir, name)); }
      catch { /* EEXIST — an earlier source already won this name, as PATH would have */ }
    }
  }
  return dir;
}

/**
 * The ambient PATH, minus gh. Built once per process because it is read-only and identical.
 *
 * `/usr/bin:/bin:/usr/sbin:/sbin` are appended as sources, not as PATH entries: they were
 * hard-coded into the old PATH, and a mirror that omitted them could lose `git` on a machine
 * with an unusual environment — which would make the refusal below be about something other
 * than gh, silently.
 */
let ghFreeBinDir = null;
function ghFreeBin() {
  if (ghFreeBinDir) return ghFreeBinDir;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-nogh-'));
  tmpRoots.push(root);
  ghFreeBinDir = mirrorWithoutGh(path.join(root, 'bin'), [
    ...(process.env.PATH || '').split(':'), NODE_DIR, '/usr/bin', '/bin', '/usr/sbin', '/sbin',
  ]);
  return ghFreeBinDir;
}

/**
 * A fake `gh` at the front of a PATH that contains no real one, and the PATH that reaches it.
 *
 * The real gh is never invoked by these tests. Opening a pull request is outward-facing and not
 * undoable by re-running the suite; a test that opened one would file a PR in a live repository
 * every time CI ran. So the dependency is stubbed and the ARGUMENTS it received are asserted —
 * which is the part that has to be right.
 *
 * WHAT WAS WRONG HERE, AND WHY THE PREMISE IS NOW ASSERTED IN BOTH DIRECTIONS
 * PATH used to be `${dir}:${NODE_DIR}:/usr/bin:/bin` with a comment saying it "deliberately
 * excludes the directory the real gh lives in (/opt/homebrew/bin here)". "here" was the whole
 * defect: gh is /opt/homebrew/bin/gh on this Mac and /usr/bin/gh on ubuntu-latest, so the list
 * excluded gh on the author's machine and INCLUDED it on the runner. The `absent` case was
 * therefore unbuildable on CI — it failed loudly there (run 32943665467) and, worse, had never
 * been anything but luck here.
 *
 * So the environment is now constructed rather than enumerated, and both halves of the premise
 * are asserted before any behaviour is:
 *   - gh resolves to exactly the stub, or to nothing at all — never to a real gh;
 *   - git / node / bash still resolve, so a refusal cannot be about a PATH we broke.
 * A one-sided guard is what #102 shipped: it asserted a case-sensitive property with a
 * case-INsensitive regex and passed while its own premise was false.
 */
function stubGh(root, { present = true, authExit = 0, prList = '', prCreate = 'https://github.com/o/r/pull/7', createExit = 0 } = {}) {
  const dir = fs.mkdtempSync(path.join(root, 'ghbin-'));
  const argsLog = path.join(dir, 'gh-args.log');
  if (present) {
    const gh = path.join(dir, 'gh');
    fs.writeFileSync(gh, `#!/bin/bash
printf '%s\\n' "$*" >> ${JSON.stringify(argsLog)}
case "$1 $2" in
  "auth status")
    [ ${authExit} -ne 0 ] && echo "You are not logged into any GitHub hosts." >&2
    exit ${authExit} ;;
  "pr list") printf '%s' ${JSON.stringify(prList)}; exit 0 ;;
  "pr create")
    [ ${createExit} -ne 0 ] && echo "GraphQL: something went wrong (createPullRequest)" >&2
    [ ${createExit} -eq 0 ] && printf '%s\\n' ${JSON.stringify(prCreate)}
    exit ${createExit} ;;
esac
echo "stub gh: unhandled invocation: $*" >&2
exit 1
`);
    fs.chmodSync(gh, 0o755);
  }
  const PATH = `${dir}:${ghFreeBin()}`;

  const found = resolvesOnPath('gh', PATH);
  assert.equal(
    found, present ? path.join(dir, 'gh') : null,
    present
      ? `'gh' on this fixture's PATH is ${found}, not the stub — these tests would drive the REAL gh`
      : `this fixture's PATH still resolves a real gh at ${found}, so 'absent' is not absent and every assertion after it is vacuous`
  );
  for (const tool of ['git', 'node', 'bash']) {
    assert.ok(
      resolvesOnPath(tool, PATH),
      `the gh-free PATH lost ${tool}, so anything that fails under it fails for the wrong reason`
    );
  }

  return { dir, argsLog, PATH, env: { ...process.env, PATH }, ghArgs: () => (fs.existsSync(argsLog) ? fs.readFileSync(argsLog, 'utf8') : '') };
}

/** Did the branch actually reach the upstream? Asked of the upstream, never of the push output. */
const onUpstream = (up) => run('git', ['rev-parse', '--verify', BRANCH], up).code === 0;
const eventsOf = (root) => {
  const f = path.join(root, 'state', 'events.jsonl');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
};

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

test('--local merge is ALLOWED when a committed verdict matches the subject', () => {
  const { proj, cfg } = fixture();
  recordAndCommit(proj);

  const r = mergeLocal(cfg);
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
  assert.equal(mergeLocal(cfg).code, 0);

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
  const r = mergeLocal(cfg);

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

  assert.notEqual(mergeLocal(cfg).code, 0);

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

  const text = (() => { const o = mergeLocal(cfg); return o.stdout + o.stderr; })();
  assert.match(text, /Refusing to merge/);
  assert.match(text, /f\.txt/, 'the refusal did not name the conflicted file');
  assert.match(text, new RegExp(`git switch ${BRANCH}`), 'the refusal did not say to resolve on the branch');
  assert.match(text, /verdict\.mjs record --verdict PASS/, 'the refusal did not say to re-record a verdict');
});

// ── who supplies the checker ───────────────────────────────────────────────────────

test('a checker shipped by the project being merged is NOT used', () => {
  // `_verdict_tool` fell back to $PROJECT_DIR/scripts/verdict.mjs, which let the repository being
  // merged supply the program that decides whether it may be merged. The launcher is installed as
  // a `~/bin/<project>` shim with the harness elsewhere, so "no harness copy beside the launcher"
  // is the deployed shape, not a contrived one.
  const { proj, cfg, root } = fixture();

  const bin = path.join(root, 'harness', 'bin');
  fs.mkdirSync(bin, { recursive: true });
  const launcher = path.join(bin, 'warroom');
  fs.copyFileSync(WARROOM, launcher);
  assert.equal(
    fs.existsSync(path.join(root, 'harness', 'scripts', 'verdict.mjs')), false,
    'the fixture accidentally put a harness checker beside the launcher'
  );

  // The project ships a "QA verdict checker" that approves everything.
  fs.mkdirSync(path.join(proj, 'scripts'), { recursive: true });
  fs.writeFileSync(
    path.join(proj, 'scripts', 'verdict.mjs'),
    'console.log(JSON.stringify({ ok: true, tier: "rubber-stamp", subject: "n/a" }));\nprocess.exit(0);\n'
  );
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'project ships its own verdict checker']);

  const before = git(proj, ['rev-parse', 'main']).trim();
  const r = run('bash', [launcher, '--config', cfg, 'merge', '1']);
  const text = r.stdout + r.stderr;

  assert.notEqual(r.code, 0, 'the merged repository supplied its own judge, and the merge proceeded');
  assert.doesNotMatch(text, /rubber-stamp/, 'the project-supplied checker was executed');
  assert.match(text, /verdict\.mjs not found/, 'the refusal did not name the missing harness checker');
  assert.equal(git(proj, ['rev-parse', 'main']).trim(), before, 'main moved on a rubber-stamped verdict');
  assert.ok(branchExists(proj), 'the branch was deleted by a merge that did not happen');

  const events = fs.readFileSync(path.join(root, 'state', 'events.jsonl'), 'utf8');
  assert.match(events, /reason=no-checker/, 'the refusal is invisible in the audit trail');
  assert.doesNotMatch(events, /tier=rubber-stamp/, 'a tier no classifier can produce reached events.jsonl');
});

// ── what the verdict pathspec hides ────────────────────────────────────────────────

test('a non-record file under the verdict directory CHANGES the subject', () => {
  // The exclusion existed so that committing a verdict would not move the subject it approves. It
  // excluded the whole directory, which is wider than that property needs: anything under the
  // prefix was invisible to the hash AND to changedFiles(), so it could not be seen and could not
  // raise the tier. An executable dropped here rode onto main with the subject byte-identical.
  const { proj } = fixture();
  git(proj, ['switch', '-q', BRANCH]);
  const before = verdict(['subject', '--repo', proj, '--ref', BRANCH]).stdout.trim();

  fs.mkdirSync(path.join(proj, '.qa', 'verdicts'), { recursive: true });
  fs.writeFileSync(path.join(proj, '.qa', 'verdicts', 'payload.sh'), '#!/bin/sh\necho pwned\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'inject']);

  const after = verdict(['subject', '--repo', proj, '--ref', BRANCH]).stdout.trim();
  assert.notEqual(after, before, 'a file smuggled under .qa/verdicts/ is invisible to the subject');
});

test('a NESTED .json under the verdict directory changes the subject too', () => {
  // This one pins the `glob` in the pathspec, and fails without it. Git's default pathspec
  // wildcards match `/`, so a bare `*.json` still hides .qa/verdicts/nested/deep.json — the same
  // hole one directory down. Records are only ever direct children (verdict.mjs verdictPath), so
  // nothing legitimate lives at that depth.
  const { proj } = fixture();
  git(proj, ['switch', '-q', BRANCH]);
  const before = verdict(['subject', '--repo', proj, '--ref', BRANCH]).stdout.trim();

  fs.mkdirSync(path.join(proj, '.qa', 'verdicts', 'nested'), { recursive: true });
  fs.writeFileSync(path.join(proj, '.qa', 'verdicts', 'nested', 'deep.json'), '{"nested":true}\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'inject nested']);

  const after = verdict(['subject', '--repo', proj, '--ref', BRANCH]).stdout.trim();
  assert.notEqual(after, before, 'a nested .json under .qa/verdicts/ is invisible to the subject');
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

// ── the route to origin ──────────────────────────────────────────────────────────────────────
//
// Every test here asks the UPSTREAM whether the branch arrived (`onUpstream`), never the push
// command's own output. "It printed success" is the class of evidence this file exists to reject.
//
// The real `gh` is never invoked. Opening a pull request is outward-facing and is not undone by
// re-running the suite, so the dependency is stubbed and what is asserted is the arguments it was
// handed and the state left behind on failure.

// The fixture is a program, so it gets a test of its own before anything relies on it.
//
// `stubGh({ present: false })` asserts that gh does not resolve. That assertion is only worth
// something if the construction it checks would REMOVE a gh that was there — and on a machine
// with no gh at all it would pass while doing nothing, which is how the old fixture survived
// here for as long as it did. So the control below plants a gh, proves it is findable, and only
// then proves the mirror drops it. Nothing about it depends on this machine.
test('the gh-free PATH removes a gh that IS there — the fixture, driven', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-fixture-'));
  tmpRoots.push(root);
  const src = path.join(root, 'src');
  fs.mkdirSync(src);
  for (const name of ['gh', 'git', 'node']) {
    const p = path.join(src, name);
    fs.writeFileSync(p, '#!/bin/sh\nexit 0\n');
    fs.chmodSync(p, 0o755);
  }
  assert.equal(
    resolvesOnPath('gh', src), path.join(src, 'gh'),
    'the control directory has no gh in it, so removing gh from it proves nothing'
  );

  const mirror = mirrorWithoutGh(path.join(root, 'bin'), [src]);
  assert.equal(resolvesOnPath('gh', mirror), null, 'the mirror kept a gh it was asked to drop');
  assert.ok(resolvesOnPath('git', mirror), 'the mirror dropped git as well as gh — it removes a name, not a directory');
  assert.ok(resolvesOnPath('node', mirror), 'the mirror dropped node as well as gh');
});

// And the same property, asserted of the PATH the tests below actually run under: whatever this
// machine is, gh is not reachable from it. On ubuntu-latest that means /usr/bin/gh; on this Mac
// it means /opt/homebrew/bin/gh. Both locations appear in the comments above, which explain the
// defect — neither is READ by any code here, which is the difference that makes this portable.
test('the absent-gh fixture is absent on THIS machine, wherever gh lives here', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-gate-fixture-'));
  tmpRoots.push(root);
  const real = resolvesOnPath('gh', process.env.PATH || '');
  const gh = stubGh(root, { present: false });
  assert.equal(resolvesOnPath('gh', gh.PATH), null, `gh is still reachable at ${resolvesOnPath('gh', gh.PATH)}`);
  assert.equal(
    run('bash', ['-c', 'command -v gh || echo NONE'], REPO, gh.env).stdout.trim(), 'NONE',
    `bash resolved a gh the fixture believed it had removed (this machine's gh: ${real ?? 'none'})`
  );
  assert.ok(
    run('bash', ['-c', 'git --version'], REPO, gh.env).stdout.startsWith('git version'),
    'git stopped working under the gh-free PATH, so a refusal under it would not be about gh'
  );
});

test('the DEFAULT route pushes the branch to origin and opens a pull request', () => {
  const { proj, up, cfg, root } = fixture();
  recordAndCommit(proj);
  const gh = stubGh(root);
  const before = git(proj, ['rev-parse', 'main']).trim();

  const r = merge(cfg, gh.env);
  const text = r.stdout + r.stderr;
  assert.equal(r.code, 0, `the PR route refused a validly gated branch:\n${text}`);

  assert.ok(onUpstream(up), 'the branch never reached origin, which is the entire point of this route');
  assert.equal(git(proj, ['rev-parse', 'main']).trim(), before, 'the PR route moved LOCAL main');
  assert.ok(branchExists(proj), 'the PR route deleted the branch its own pull request is made of');
  assert.match(text, /https:\/\/github\.com\/o\/r\/pull\/7/, 'the pull request URL was not reported');

  const args = gh.ghArgs();
  assert.match(args, /pr create --base main --head ceo-1-1700000000/, `gh was called wrong:\n${args}`);

  assert.match(eventsOf(root), /"event":"merge_pr_opened"/, 'the pull request is invisible in the audit trail');
  assert.doesNotMatch(eventsOf(root), /"event":"merge_complete"/, 'opening a PR was logged as a completed merge');
});

test('gh ABSENT is a refusal, and nothing is pushed and nothing is merged', () => {
  const { proj, up, cfg, root } = fixture();
  recordAndCommit(proj);
  const gh = stubGh(root, { present: false });
  assert.equal(
    resolvesOnPath('gh', gh.PATH), null,
    'the no-gh fixture found a real gh on this PATH, so it proves nothing — fix the fixture'
  );

  const before = git(proj, ['rev-parse', 'main']).trim();
  const r = merge(cfg, gh.env);
  const text = r.stdout + r.stderr;

  assert.notEqual(r.code, 0, 'a merge with no route to origin exited 0');
  assert.match(text, /reason=no-gh/, 'the refusal did not name its reason');
  assert.equal(onUpstream(up), false, 'a route that refused pushed something anyway');
  assert.equal(
    git(proj, ['rev-parse', 'main']).trim(), before,
    'a missing gh silently fell back to a local merge — the defect class this repo repeats most'
  );
  assert.ok(branchExists(proj));
  assert.match(eventsOf(root), /reason=no-gh/, 'the refusal is invisible in the audit trail');
});

test('gh present but UNUSABLE is a refusal, and nothing is pushed', () => {
  const { proj, up, cfg, root } = fixture();
  recordAndCommit(proj);
  const gh = stubGh(root, { authExit: 1 });

  const before = git(proj, ['rev-parse', 'main']).trim();
  const r = merge(cfg, gh.env);
  const text = r.stdout + r.stderr;

  assert.notEqual(r.code, 0, 'an unauthenticated gh exited 0');
  assert.match(text, /reason=gh-unusable/);
  assert.match(text, /not logged into any GitHub hosts/, "the refusal hid gh's own explanation");
  assert.equal(onUpstream(up), false, 'the branch was pushed before gh was known to work');
  assert.equal(git(proj, ['rev-parse', 'main']).trim(), before, 'an unusable gh became a local merge');
  assert.match(eventsOf(root), /reason=gh-unusable/);
});

test('gh pr create FAILING is a refusal that names the state it left behind', () => {
  // The one path where a refusal cannot leave everything untouched: the push already succeeded.
  // Then say so. Reporting "refused" while a branch sits on origin is the same lie one size down.
  const { proj, up, cfg, root } = fixture();
  recordAndCommit(proj);
  const gh = stubGh(root, { createExit: 1 });

  const before = git(proj, ['rev-parse', 'main']).trim();
  const r = merge(cfg, gh.env);
  const text = r.stdout + r.stderr;

  assert.notEqual(r.code, 0, 'a failed gh pr create exited 0');
  assert.match(text, /reason=pr-create-failed/);
  assert.ok(onUpstream(up), 'the fixture did not reach the state under test — the push should have run');
  assert.match(text, /IS now on origin/, 'the refusal did not say the branch had already been pushed');
  assert.match(text, /gh pr create --base main --head ceo-1-1700000000/, 'the refusal did not name the remedy');
  assert.equal(
    git(proj, ['rev-parse', 'main']).trim(), before,
    'a failed pull request quietly became a local merge'
  );
  assert.match(eventsOf(root), /reason=pr-create-failed pushed=yes/);
  assert.doesNotMatch(eventsOf(root), /"event":"merge_pr_opened"/, 'a PR that was never opened was logged as opened');
});

test('an already-open pull request is reported, not treated as a failure', () => {
  // Re-running after another commit is the ordinary case: the push updates the head and the open
  // PR is the answer. gh refuses to create a second one, and reporting that as failure would be a
  // false negative on the most common path.
  const { proj, up, cfg, root } = fixture();
  recordAndCommit(proj);
  const gh = stubGh(root, { prList: 'https://github.com/o/r/pull/3' });

  const r = merge(cfg, gh.env);
  const text = r.stdout + r.stderr;
  assert.equal(r.code, 0, `an existing pull request was treated as an error:\n${text}`);
  assert.match(text, /already open: https:\/\/github\.com\/o\/r\/pull\/3/);
  assert.ok(onUpstream(up), 'the head was not updated');
  assert.doesNotMatch(gh.ghArgs(), /pr create/, 'a second pull request was attempted');
  assert.match(eventsOf(root), /state=existing/);
});

test('no origin remote is a refusal naming that reason', () => {
  const { proj, cfg, root } = fixture();
  recordAndCommit(proj);
  // `git remote remove` deletes refs/remotes/origin/* along with the config, and then the VERDICT
  // refuses first ("cannot resolve origin/main") — an earlier failure than the one under test, and
  // a test that passed on it would be asserting the wrong guard. Dropping only the config section
  // leaves the tracking ref in place, which is the real-world shape of this state: someone edited
  // .git/config. Verified by watching the first version fail on the verdict message instead.
  git(proj, ['config', '--remove-section', 'remote.origin']);
  const gh = stubGh(root);

  const r = merge(cfg, gh.env);
  assert.notEqual(r.code, 0);
  assert.match(r.stdout + r.stderr, /reason=no-origin-remote/);
  assert.doesNotMatch(gh.ghArgs(), /pr create/, 'a pull request was attempted with nowhere to push');
  assert.match(eventsOf(root), /reason=no-origin-remote/);
});

test('the verdict gate refuses the PR route too, BEFORE gh is invoked or anything is pushed', () => {
  // Ordering, executed. ci.yml and qa-lead-pass.yml would run on the PR anyway, but an ungated
  // branch should not reach origin or consume a reviewer, and the refusal belongs where the
  // operator is still standing.
  const { up, cfg, root } = fixture();
  const gh = stubGh(root);

  const r = merge(cfg, gh.env);
  assert.notEqual(r.code, 0, 'an ungated branch opened a pull request');
  assert.equal(onUpstream(up), false, 'an ungated branch was pushed to origin');
  assert.equal(gh.ghArgs(), '', 'gh ran before the verdict was confirmed');
});

test('the two routes have DIFFERENT destinations, and that is the whole change', () => {
  // --local moves local main and never reaches origin. The default reaches origin and never moves
  // local main. Asserting both halves in one place is what stops the two drifting back together.
  const { proj, up, cfg } = fixture();
  recordAndCommit(proj);

  const before = git(proj, ['rev-parse', 'main']).trim();
  const r = mergeLocal(cfg);
  assert.equal(r.code, 0, `--local refused a validly gated branch:\n${r.stdout}${r.stderr}`);

  assert.notEqual(git(proj, ['rev-parse', 'main']).trim(), before, '--local did not move local main');
  assert.equal(onUpstream(up), false, '--local pushed to origin; it is defined by not doing that');
  assert.match(r.stdout, /This merge is LOCAL/, '--local did not say it went nowhere');
  assert.match(r.stdout, /origin\/main is reached only by opening a PR/);
});

test('an unknown option to merge is refused, never silently ignored', () => {
  // `merge 1 --loca` must not quietly do the other thing: the two routes have different
  // destinations, so a swallowed typo is a wrong destination.
  const { proj, cfg } = fixture();
  recordAndCommit(proj);
  const before = git(proj, ['rev-parse', 'main']).trim();

  const r = run('bash', [WARROOM, '--config', cfg, 'merge', '1', '--loca']);
  assert.notEqual(r.code, 0, "a misspelled '--local' was accepted");
  assert.match(r.stdout + r.stderr, /Unknown option for merge: '--loca'/);
  assert.equal(git(proj, ['rev-parse', 'main']).trim(), before, 'a typo merged something');
});

// ── prune-branches: force is right here, the report was not ──────────────────────────────────
//
// `cmd_prune_branches` keeps `branch -D`, and that is a judgement, not an oversight: a human has
// been shown every branch and typed y, and `-d` would refuse on exactly the unmerged leftovers the
// command exists to remove. What was wrong was the REPORT — `-D ... 2>/dev/null && echo deleted`
// printed nothing for a branch it failed to delete and then printed "✓ Branches deleted." anyway.

test('prune deletes the ceo-* branches it says it deleted, and counts them', () => {
  const { proj, cfg } = fixture();
  git(proj, ['branch', 'ceo-2-1700000000', BRANCH]);

  const r = run('bash', [WARROOM, '--config', cfg, 'prune-branches'], REPO, undefined, 'y\n');
  const text = r.stdout + r.stderr;
  assert.match(text, /✓ deleted ceo-1-1700000000/);
  assert.match(text, /✓ 2 branch\(es\) deleted\./, 'the tally does not name what it counted');
  assert.equal(git(proj, ['branch', '--list', 'ceo-*']).trim(), '', 'branches survived a reported deletion');
});

test('prune REPORTS a branch it could not delete, instead of claiming it did', () => {
  // A branch checked out in a worktree cannot be deleted even with -D. Before this change that
  // failure printed nothing at all, and the run still ended "✓ Branches deleted."
  const { proj, cfg } = fixture();
  git(proj, ['switch', '-q', BRANCH]);

  const r = run('bash', [WARROOM, '--config', cfg, 'prune-branches'], REPO, undefined, 'y\n');
  const text = r.stdout + r.stderr;
  assert.match(text, /✗ kept ceo-1-1700000000/, 'a branch that survived was not reported');
  assert.match(text, /cannot delete branch/, "git's own reason was swallowed");
  assert.doesNotMatch(text, /✓ \d+ branch\(es\) deleted\./, 'a partial prune wore the clean verdict');
  assert.match(text, /0 deleted, 1 kept/);
  assert.ok(branchExists(proj), 'the fixture did not reach the state under test');
});

test('prune answered with anything but y deletes nothing', () => {
  const { proj, cfg } = fixture();
  const r = run('bash', [WARROOM, '--config', cfg, 'prune-branches'], REPO, undefined, 'n\n');
  assert.match(r.stdout + r.stderr, /Cancelled/);
  assert.ok(branchExists(proj), 'a declined prune deleted a branch');
});

// ── the destination, not just the gate ───────────────────────────────────────────────────────
//
// `$n` was interpolated UNQUOTED into the ERE that selects the branch, so a `|` in it opened a
// top-level alternative the caller controlled and `merge 'x$|main$|y'` selected `main`. The PR
// route then ran `git push origin main`. The gate was never bypassed — a verdict bound to main's
// own diff still had to exist — so this is a wrong-DESTINATION defect, and it was live exactly
// during the window this change exists to close: with enforce_admins false an admin push to main
// succeeds and qa-lead-pass.yml never runs on it.

/** The upstream's view of a ref, so "was main pushed" is asked of the upstream. */
const upstreamRev = (up, ref) => run('git', ['rev-parse', '--verify', ref], up).stdout.trim();

test('a regex-injecting CEO number is REFUSED, and main is never pushed', () => {
  const { proj, up, cfg, root } = fixture();
  const gh = stubGh(root);

  // Put local main ahead of the upstream, so a push of main would be visible as a moved ref
  // rather than as a no-op that proves nothing.
  fs.writeFileSync(path.join(proj, 'local-only.txt'), 'not on the upstream\n');
  git(proj, ['add', '-A']);
  git(proj, ['commit', '-qm', 'local main moves ahead']);
  const upstreamMainBefore = upstreamRev(up, 'main');
  assert.notEqual(git(proj, ['rev-parse', 'main']).trim(), upstreamMainBefore, 'the fixture did not diverge');

  const r = run('bash', [WARROOM, '--config', cfg, 'merge', 'x$|main$|y'], REPO, gh.env);
  const text = r.stdout + r.stderr;

  assert.notEqual(r.code, 0, 'a regex-injecting CEO number was accepted');
  assert.match(text, /CEO number must be digits/, 'the refusal did not name what was wrong');
  assert.equal(upstreamRev(up, 'main'), upstreamMainBefore, 'main was pushed to the upstream');
  assert.equal(gh.ghArgs(), '', 'gh ran for a branch the program should never have selected');
  assert.doesNotMatch(text, /Pushing main/, 'the program announced a push of main');
});

test('a non-numeric CEO number is refused before any branch is selected', () => {
  const { cfg, root } = fixture();
  const gh = stubGh(root);
  const r = run('bash', [WARROOM, '--config', cfg, 'merge', 'main'], REPO, gh.env);
  assert.notEqual(r.code, 0);
  assert.match(r.stdout + r.stderr, /CEO number must be digits/);
  assert.equal(gh.ghArgs(), '');
});

test('the push refuses a ref that is not a ceo branch, independently of how it was selected', () => {
  // The second of the two guards, driven directly. The first (numeric `$n`) now makes it
  // unreachable through cmd_merge, which is the point: it is there so a route added later cannot
  // push an arbitrary ref to origin by reaching this helper another way. Extracting it is the only
  // way to exercise a guard whose job is to catch a caller that does not exist yet.
  const { proj, up, cfg, root } = fixture();
  const src = fs.readFileSync(WARROOM, 'utf8');
  const fn = src.slice(src.indexOf('_open_pull_request() {'), src.indexOf('\n# Feature F5'));
  assert.ok(fn.includes('not-a-ceo-branch'), 'could not extract _open_pull_request');

  const before = upstreamRev(up, 'main');
  const r = run('bash', ['-c', [
    'set -u',
    `PROJECT_DIR=${JSON.stringify(proj)}`,
    `PROJECT_STATE_DIR=${JSON.stringify(path.join(root, 'state2'))}`,
    "C_RED='' C_GREEN='' C_OVERLAY='' RESET='' BOLD='' SESSION=fixture WORKTREES_DIR=/nonexistent",
    '_log_event() { :; }',
    fn,
    '_open_pull_request main full 1',
  ].join('\n')]);

  assert.notEqual(r.code, 0, 'the helper agreed to push main');
  assert.match(r.stdout + r.stderr, /reason=not-a-ceo-branch/);
  assert.equal(upstreamRev(up, 'main'), before, 'main was pushed by the guard that refuses to push main');
});

// ── what gh said, versus what was concluded from it ──────────────────────────────────────────

test('a JSON null from gh pr list is NOT an open pull request', () => {
  // `--jq '.[0].url'` emits `null` when there is no open PR. Unvalidated, that became
  // "✓ Pull request already open: null", exit 0, logged merge_pr_opened, with pr create never
  // called — a success reported from output that says the opposite.
  const { up, cfg, root } = fixture();
  const { proj } = { proj: path.join(root, 'proj') };
  recordAndCommit(proj);
  const gh = stubGh(root, { prList: 'null' });

  const r = merge(cfg, gh.env);
  const text = r.stdout + r.stderr;
  assert.equal(r.code, 0, `a null from pr list broke the run:\n${text}`);
  assert.doesNotMatch(text, /already open: null/, 'a JSON null was reported as a pull request');
  assert.match(gh.ghArgs(), /pr create/, 'pr create was skipped because of a null');
  assert.match(text, /Pull request opened: https:\/\/github\.com\/o\/r\/pull\/7/);
  assert.ok(onUpstream(up));
});

test('gh create exiting 0 with no URL records url=unknown, not chatter', () => {
  // Refusing would claim a failure over a PR that very likely exists. Inventing a URL from the
  // last line of output puts a location nobody can visit into the audit trail. Neither: succeed,
  // and say the URL is unknown.
  const { cfg, root } = fixture();
  recordAndCommit(path.join(root, 'proj'));
  const gh = stubGh(root, { prCreate: 'Warning: 3 uncommitted changes' });

  const r = merge(cfg, gh.env);
  const text = r.stdout + r.stderr;
  assert.equal(r.code, 0, `a URL-less success was turned into a failure:\n${text}`);
  assert.match(text, /printed no pull request URL/);
  assert.match(eventsOf(root), /state=created url=unknown/, 'the audit trail did not record the URL as unknown');
  assert.doesNotMatch(eventsOf(root), /url=Warning/, "gh's chatter was recorded as a pull request URL");
});

test('prune on a detached HEAD does not count the pseudo-line as a kept branch', () => {
  // `git branch` emits `(HEAD detached at ceo-1-...)`, which an unanchored `grep ceo-` matched.
  // Once failures were counted, that line arrived as a branch that could not be deleted, so a run
  // that deleted everything reported a failure — a false alarm inside the counter added to make
  // the signal trustworthy.
  const { proj, cfg } = fixture();
  git(proj, ['checkout', '-q', '--detach', BRANCH]);

  const r = run('bash', [WARROOM, '--config', cfg, 'prune-branches'], REPO, undefined, 'y\n');
  const text = r.stdout + r.stderr;
  assert.doesNotMatch(text, /HEAD detached/, 'the detached-HEAD pseudo-line was treated as a branch');
  assert.match(text, /✓ 1 branch\(es\) deleted\./, 'a clean prune did not report a clean prune');
  assert.doesNotMatch(text, /kept/, 'a failure was reported that did not happen');
});

// ── The PR route's own bash, executed ────────────────────────────────────────────────────────
//
// WHY THIS EXISTS. `.github/workflows/qa-lead-pass.yml` carried a subject-binding predicate that
// nothing under scripts/ could see: no test parsed the workflow, so deleting the binding tomorrow
// would have failed nothing. An argument with no test is an argument.
//
// These drive the SHIPPED bytes of the two `run:` blocks under `/usr/bin/bash -e {0}` — the shell
// the runner actually reports in its step header — with node, jq and gh stubbed. Asserting the
// file CONTAINS a regex would pass against a comment describing the regex; this repo has produced
// twelve false findings that way, and the header of this file already says so.
//
// NO YAML PARSER. package.json declares zero dependencies. `js-yaml` resolves on a developer
// machine from $HOME/node_modules and is absent on the runner, so a test importing it would pass
// here and fail there — the same one-machine-layout defect this file records three times already.
// The extractor below is text-directed and dependency-free.

const WORKFLOW = path.join(REPO, '.github', 'workflows', 'qa-lead-pass.yml');

// The runner's step header reports `/usr/bin/bash -e {0}`. That PATH IS THE RUNNER'S, not every
// machine's — macOS ships bash at /bin/bash and has no /usr/bin/bash, so the first version of this
// helper hardcoded `/usr/bin/bash` and every case below died with ENOENT: status null, signal null,
// no output, which reads exactly like a script that produced nothing. Fourth instance in this file
// of one machine's layout baked into a test. The FLAG is what models the runner; the path is not.
const BASH = ['/bin/bash', '/usr/bin/bash'].find((p) => fs.existsSync(p));
assert.ok(BASH, 'no bash found at /bin/bash or /usr/bin/bash — the cases below cannot run');

/** The `run:` block of the step whose name starts with `prefix`, dedented. Shipped bytes only. */
function runBlock(prefix) {
  const lines = fs.readFileSync(WORKFLOW, 'utf8').split('\n');
  const start = lines.findIndex((l) => l.trimStart().startsWith(`- name: ${prefix}`));
  assert.notEqual(start, -1, `no step named ${prefix} — the extractor is aimed at nothing`);
  const runAt = lines.findIndex((l, i) => i > start && /^\s*run: \|/.test(l));
  assert.notEqual(runAt, -1, `step ${prefix} has no "run: |" block`);
  const indent = lines[runAt].match(/^\s*/)[0].length + 2;
  const body = [];
  for (let i = runAt + 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() !== '' && l.match(/^\s*/)[0].length < indent) break;
    body.push(l.slice(indent));
  }
  assert.ok(body.length > 5, `extracted ${body.length} lines for ${prefix} — extractor is broken`);
  return body.join('\n');
}

/**
 * Run a step's shipped script the way the runner does. `nodeOut`/`nodeExit` stand in for
 * verdict.mjs; `jqOut` lets a test model a jq that exits 0 having printed nothing, which is the
 * degeneration an in-PR $GITHUB_PATH shim produces and which no exit code reveals.
 */
function runStep(script, { env = {}, nodeOut = '', nodeExit = 0, jqOut = null } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qagate-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'node'), `#!/bin/bash\ncat <<'PAYLOAD'\n${nodeOut}\nPAYLOAD\nexit ${nodeExit}\n`);
  fs.writeFileSync(path.join(bin, 'gh'), '#!/bin/bash\nexit 0\n');
  if (jqOut !== null) fs.writeFileSync(path.join(bin, 'jq'), `#!/bin/bash\nprintf '%s' ${JSON.stringify(jqOut)}\nexit 0\n`);
  for (const f of fs.readdirSync(bin)) fs.chmodSync(path.join(bin, f), 0o755);

  const script_path = path.join(dir, 'step.sh');
  fs.writeFileSync(script_path, script);
  const r = run(BASH, ['-e', script_path], dir, {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    RUNNER_TEMP: dir,
    GITHUB_OUTPUT: path.join(dir, 'out.txt'),
    GH_TOKEN: 'x',
    REPO: 'o/r',
    HEAD_SHA: 'deadbeef',
    PR_NUMBER: '1',
    ...env,
  });
  return { ...r, text: r.stdout + r.stderr };
}

const SUBJ = 'a'.repeat(64);
const OTHER = 'b'.repeat(64);
const okJson = (ok, subject = SUBJ) =>
  JSON.stringify({ ok, subject, tier: 'irreversible', reason: ok ? 'match' : 'absent' });

test('PR route: a verdict bound to this diff passes', () => {
  const r = runStep(runBlock('Verdict diff-binding'), { nodeOut: okJson(true), nodeExit: 0 });
  assert.equal(r.code, 0, `a genuine PASS was refused:\n${r.text}`);
  assert.match(r.text, /QA GATE PASSED/);
});

test('PR route: no verdict and no bypass is refused', () => {
  const r = runStep(runBlock('Verdict diff-binding'), {
    nodeOut: okJson(false), nodeExit: 1, env: { BYPASS_APPROVED: 'false', BYPASS_SUBJECT: '' },
  });
  assert.equal(r.code, 1, `a missing verdict did not refuse:\n${r.text}`);
  assert.match(r.text, /QA GATE FAILED/);
});

// B1. The -z guard catches silence. This is the case it does NOT catch: output that is present
// and unparseable, so every jq extraction yields "". An empty subject used as a substring needle
// matches any comment, and the gate grants a bypass while printing "names this exact subject ()".
test('PR route: a non-empty but unparseable verdict is REFUSED, not read as empty', () => {
  const r = runStep(runBlock('Verdict diff-binding'), {
    nodeOut: 'verdict: something went sideways', nodeExit: 1, jqOut: '',
    env: { BYPASS_APPROVED: 'true', BYPASS_SUBJECT: SUBJ },
  });
  assert.equal(r.code, 1, `garbage output was not refused:\n${r.text}`);
  assert.doesNotMatch(r.text, /QA GATE BYPASSED/, 'an empty subject granted a bypass');
  assert.match(r.text, /could not read a boolean \.ok|not 64 hex digits/);
});

test('PR route: an empty subject never reaches the bypass comparison', () => {
  const r = runStep(runBlock('Verdict diff-binding'), {
    nodeOut: okJson(false), nodeExit: 1, jqOut: '',
    env: { BYPASS_APPROVED: 'true', BYPASS_SUBJECT: '' },
  });
  assert.equal(r.code, 1);
  assert.doesNotMatch(r.text, /QA GATE BYPASSED/, 'empty subject matched empty subject');
});

// B2. The decision crosses on an immutable step output. A bypass approved against a DIFFERENT
// subject must not authorise this diff, however it got here.
test('PR route: a bypass approved for another diff is REFUSED', () => {
  const r = runStep(runBlock('Verdict diff-binding'), {
    nodeOut: okJson(false), nodeExit: 1,
    env: { BYPASS_APPROVED: 'true', BYPASS_SUBJECT: OTHER },
  });
  assert.equal(r.code, 1, `a bypass for another diff was honoured:\n${r.text}`);
  assert.match(r.text, /BYPASS REFUSED/);
});

// THIS CONTROL IS WHAT KEEPS THE FOUR REFUSAL CASES ABOVE FROM GOING VACUOUS, and it is not
// decoration. Every refusal case asserts exit 1, and `bash -e` also exits 1 when the step dies at
// VERDICT_JSON=$(...) — the shell aborting and the gate refusing are indistinguishable by exit
// code. The verdict step clears -e deliberately (`set +e`); delete that line and this case, which
// demands exit 0 on the same nodeExit=1 input, is the one that goes red.
//
// Confirmed by mutation rather than argued: driving these same cases against the two earlier
// versions of the step reproduces the defects each fix removed — origin/main BYPASSES a bypass
// approved for another diff AND an unparseable verdict; commit 76a5603 refuses the first and
// still BYPASSES the second, which is the review's B1, found again from the other end.
test('PR route: a bypass approved for THIS diff is honoured — the control', () => {
  const r = runStep(runBlock('Verdict diff-binding'), {
    nodeOut: okJson(false), nodeExit: 1,
    env: { BYPASS_APPROVED: 'true', BYPASS_SUBJECT: SUBJ },
  });
  assert.equal(r.code, 0, `a correctly named bypass was refused — the instrument cannot pass:\n${r.text}`);
  assert.match(r.text, /QA GATE BYPASSED/);
});

// The evidence must not travel on a channel that PR-authored code can rewrite between steps.
// scripts/classify.mjs and scripts/ledger.mjs run in between, and the remedy this workflow
// recommends protects .github/** while leaving scripts/** writable.
/**
 * Comment lines stripped. An absence assertion over a shell block must read CODE: both blocks
 * document the mutable-file design they replaced, and the first version of the test below failed
 * on that prose — matching a comment describing the defect as if it were the defect. That is the
 * same confusion this file's header names, arriving from the other direction.
 */
const codeOnly = (s) => s.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');

test('PR route: the bypass decision does not travel through a file under RUNNER_TEMP', () => {
  const verdict = codeOnly(runBlock('Verdict diff-binding'));
  const bypass = codeOnly(runBlock('Check for QA gate bypass'));

  // Control: the stripper must leave the code it is meant to search.
  assert.match(bypass, /GITHUB_OUTPUT/, 'codeOnly() removed the code — the assertion below is vacuous');

  assert.doesNotMatch(verdict, /RUNNER_TEMP/, 'bypass evidence read from a mutable file');
  assert.doesNotMatch(bypass, /bypass-comments\.txt/, 'bypass evidence written to a mutable file');
  assert.match(bypass, /bypass_approved=/, 'the decision is not emitted to $GITHUB_OUTPUT');
});
