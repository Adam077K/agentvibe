// scripts/produce-verdict.test.mjs — the blocking assertions for the verdict PRODUCER.
//
// THE SUBJECT IS IMPORTED AT THE TOP, ON PURPOSE. A subject reached indirectly — spawned, or
// required inside a try/catch — lets the harness turn its ABSENCE into a RESULT: a coherent tally
// that reads like a behavioural defect. A top-level import cannot go silent; it throws
// `Cannot find module` and takes the whole file down. Every spawn below is of `verdict.mjs` or a
// fake launcher, never of the subject.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  OUTCOME,
  EXIT,
  WORKFLOW_DIR,
  refTip,
  validateArgs,
  extractJudgeTree,
  readVerdictArtifact,
  buildGoal,
  produceVerdict,
} from './produce-verdict.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SUBJECT = path.join(HERE, 'produce-verdict.mjs');

// A missing SUBJECT is not a missing FILE to the runner. Assert it exists at the path the test
// computes before asserting anything about behaviour.
test('the subject exists at the path this test computes', () => {
  assert.ok(fs.existsSync(SUBJECT), `subject absent at ${SUBJECT}`);
  assert.ok(fs.readFileSync(SUBJECT, 'utf8').includes('export function produceVerdict'));
});

// ── fixtures ─────────────────────────────────────────────────────────────────────────────────

const tmpdirs = [];
function tmp(prefix) {
  const d = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), prefix));
  tmpdirs.push(d);
  return d;
}
process.on('exit', () => {
  for (const d of tmpdirs) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

function g(cwd, args) {
  return execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/**
 * A repo whose `main` holds `qa.js` = MAIN_BODY and whose checked-out branch holds a DIFFERENT
 * `qa.js`. This is the shape of hazard 2: the PR edits the judge.
 */
function repoWithEditedGate() {
  const repo = tmp('pv-repo-');
  g(repo, ['init', '-q', '-b', 'main']);
  fs.mkdirSync(path.join(repo, WORKFLOW_DIR, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(repo, WORKFLOW_DIR, 'qa.js'), 'MAIN COPY OF THE GATE\n');
  fs.writeFileSync(path.join(repo, WORKFLOW_DIR, 'lib', 'gate-logic.mjs'), 'MAIN SIBLING\n');
  g(repo, ['add', '-A']);
  g(repo, ['commit', '-qm', 'main gate']);
  const mainSha = g(repo, ['rev-parse', 'HEAD']);
  g(repo, ['update-ref', 'refs/remotes/origin/main', mainSha]);

  g(repo, ['checkout', '-qb', 'pr']);
  fs.writeFileSync(path.join(repo, WORKFLOW_DIR, 'qa.js'), 'PR COPY — THE JUDGE THIS DIFF EDITS\n');
  g(repo, ['add', '-A']);
  g(repo, ['commit', '-qm', 'pr edits the gate']);
  return { repo, mainSha, prSha: g(repo, ['rev-parse', 'HEAD']) };
}

const SHA = 'a'.repeat(40);

/** A router payload whose TOP-LEVEL fields disagree with `invocation.args`. */
function poisonedRouterJson(tree, pinned = SHA) {
  return JSON.stringify({
    ref: 'origin/main...some-moving-branch',
    tip: 'some-moving-branch',
    base: 'not-the-base',
    files: 3,
    floor: 'full',
    gateRequired: true,
    drivers: ['scripts/x.mjs'],
    gateSelfReview: null,
    invocation: {
      tool: 'Workflow',
      scriptPath: `${WORKFLOW_DIR}/qa.js`,
      args: { ref: `origin/main...${pinned}`, tier: 'full', tree },
    },
  });
}

const routerRunner = (stdout, status = 0) => () => ({ status, stdout, stderr: '' });
const verdictRunner = (payload, status) => () => ({ status, stdout: JSON.stringify(payload), stderr: '' });

// ── the four terminal states are distinct, and so are their exit codes ───────────────────────

test('four terminal states, four distinct exit codes, and NOT_REQUIRED is not 0', () => {
  const codes = Object.values(EXIT);
  assert.equal(new Set(codes).size, 4, 'two states share an exit code');
  assert.equal(EXIT[OUTCOME.PRODUCED], 0);
  assert.notEqual(EXIT[OUTCOME.NOT_REQUIRED], EXIT[OUTCOME.PRODUCED]);
  assert.notEqual(EXIT[OUTCOME.REFUSED], EXIT[OUTCOME.BLOCKED]);
});

test('established is false for REFUSED alone — the shape gates.yml asks for', () => {
  const tree = tmp('pv-tree-');
  const seen = {};
  for (const [reason, payload, status] of [
    ['pass', { ok: true, reason: 'match', subject: SHA, tier: 'full' }, 0],
    ['block', { ok: false, reason: 'not-pass', detail: 'verdict=BLOCK', subject: SHA, tier: 'full' }, 1],
    ['absent', { ok: false, reason: 'absent', subject: SHA, tier: 'full' }, 1],
  ]) {
    const r = readVerdictArtifact({ tree, ref: SHA, runner: verdictRunner(payload, status) });
    seen[reason] = r;
  }
  assert.equal(seen.pass.outcome, OUTCOME.PRODUCED);
  assert.equal(seen.block.outcome, OUTCOME.BLOCKED);
  assert.equal(seen.absent.outcome, OUTCOME.REFUSED);
  assert.equal(seen.pass.established, true);
  assert.equal(seen.block.established, true);
  assert.equal(seen.absent.established, false);
});

test('an unrecognised recorded verdict is REFUSED, never BLOCKED and never PRODUCED', () => {
  const tree = tmp('pv-tree-');
  for (const detail of ['verdict=REFUSED', 'verdict=SOMETHING_NEW', '', 'blocked']) {
    const r = readVerdictArtifact({
      tree, ref: SHA,
      runner: verdictRunner({ ok: false, reason: 'not-pass', detail, subject: SHA, tier: 'full' }, 1),
    });
    assert.equal(r.outcome, OUTCOME.REFUSED, `detail ${JSON.stringify(detail)} must not establish anything`);
  }
});

test('tier-drift and subject-mismatch are REFUSED — a stale or foreign record establishes nothing', () => {
  const tree = tmp('pv-tree-');
  for (const reason of ['tier-drift', 'subject-mismatch', 'unparseable', 'absent']) {
    const r = readVerdictArtifact({
      tree, ref: SHA, runner: verdictRunner({ ok: false, reason, subject: SHA, tier: 'full' }, 1),
    });
    assert.equal(r.outcome, OUTCOME.REFUSED);
  }
});

test('verdict.mjs exiting 2 with no JSON is REFUSED, not read as a pass', () => {
  const tree = tmp('pv-tree-');
  const r = readVerdictArtifact({ tree, ref: SHA, runner: () => ({ status: 2, stdout: '', stderr: 'boom' }) });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.equal(r.established, false);
});

// ── HAZARD 1 · the tool_result is a launch receipt ───────────────────────────────────────────

test('a session that PRINTS "PASS" and writes nothing produces REFUSED', () => {
  const { repo } = repoWithEditedGate();
  const judge = tmp('pv-judge-');
  let launched = 0;
  const r = produceVerdict({
    repo,
    gitRef: 'origin/main',
    judgeDir: judge,
    deps: {
      runGateRunner: routerRunner(poisonedRouterJson(repo)),
      // The artifact says nothing exists — which is the truth — while the session shouts PASS.
      verdictRunner: verdictRunner({ ok: false, reason: 'absent', subject: SHA, tier: 'full' }, 1),
      launch: () => {
        launched += 1;
        return { status: 0, stdout: 'Workflow launched in background. Task ID: wl7tw6ebs\nVERDICT: PASS\n', stderr: '' };
      },
    },
  });
  assert.equal(launched, 1, 'the gate session must actually have been launched');
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.equal(r.established, false);
  assert.match(r.reason, /no verdict binds this diff/);
});

test('the session exit code cannot make a verdict either way', () => {
  const { repo } = repoWithEditedGate();
  const bound = { ok: true, reason: 'match', subject: SHA, tier: 'full' };
  // Session exits 1 and screams; the artifact binds and reads PASS. The artifact wins.
  const angry = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(poisonedRouterJson(repo)),
      verdictRunner: verdictRunner({ ok: false, reason: 'absent' }, 1),
      launch: () => ({ status: 1, stdout: 'everything is on fire', stderr: '' }),
    },
  });
  assert.equal(angry.outcome, OUTCOME.REFUSED);

  let calls = 0;
  const calm = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(poisonedRouterJson(repo)),
      // absent on the pre-check, bound on the post-check
      verdictRunner: () => ({ status: calls++ === 0 ? 1 : 0, stdout: JSON.stringify(calls === 1 ? { ok: false, reason: 'absent' } : bound) }),
      launch: () => ({ status: 1, stdout: 'exited badly', stderr: '' }),
    },
  });
  assert.equal(calm.outcome, OUTCOME.PRODUCED, 'a non-zero session exit must not veto an artifact that binds');
});

// ── HAZARD 2 · cwd decides which judge judges ────────────────────────────────────────────────

test('the judging tree is materialised from origin/main, not from the tree under review', () => {
  const { repo } = repoWithEditedGate();
  const dest = tmp('pv-judge-');
  const r = extractJudgeTree({ repo, dest, gitRef: 'origin/main', workTree: repo });
  assert.equal(r.ok, true, r.reason);

  const extracted = fs.readFileSync(path.join(dest, WORKFLOW_DIR, 'qa.js'), 'utf8');
  const inWorkTree = fs.readFileSync(path.join(repo, WORKFLOW_DIR, 'qa.js'), 'utf8');
  assert.match(extracted, /MAIN COPY/, 'the judging copy must come from main');
  assert.match(inWorkTree, /PR COPY/, 'CONTROL: the work tree really does hold a different judge');
  assert.notEqual(extracted, inWorkTree);

  // The interdependent sibling comes too — extracting one file of a pair produces a well-formed
  // wrong answer rather than an error.
  assert.ok(fs.existsSync(path.join(dest, WORKFLOW_DIR, 'lib', 'gate-logic.mjs')));
  assert.equal(r.files.length, 2);
});

test('the gate session is launched in the judging tree and never in the work tree', () => {
  const { repo } = repoWithEditedGate();
  const judge = tmp('pv-judge-');
  const cwds = [];
  produceVerdict({
    repo, judgeDir: judge,
    deps: {
      runGateRunner: routerRunner(poisonedRouterJson(repo)),
      verdictRunner: verdictRunner({ ok: false, reason: 'absent' }, 1),
      launch: (argv, opts) => { cwds.push(opts.cwd); return { status: 0, stdout: '', stderr: '' }; },
    },
  });
  assert.deepEqual(cwds, [judge]);
  assert.notEqual(fs.realpathSync(cwds[0]), fs.realpathSync(repo));
  assert.match(fs.readFileSync(path.join(judge, WORKFLOW_DIR, 'qa.js'), 'utf8'), /MAIN COPY/);
});

test('a judging tree inside the work tree is refused — it would move the subject mid-review', () => {
  const { repo } = repoWithEditedGate();
  const inside = path.join(repo, 'nested', 'judge');
  fs.mkdirSync(inside, { recursive: true });
  const r = extractJudgeTree({ repo, dest: inside, gitRef: 'origin/main', workTree: repo });
  assert.equal(r.ok, false);
  assert.match(r.reason, /inside the work tree/);
  assert.ok(!fs.existsSync(path.join(inside, WORKFLOW_DIR, 'qa.js')), 'and it wrote nothing');
});

test('extraction is verified by reading the bytes back, and a listing without qa.js is refused', () => {
  const bare = tmp('pv-bare-');
  g(bare, ['init', '-q', '-b', 'main']);
  fs.mkdirSync(path.join(bare, WORKFLOW_DIR), { recursive: true });
  fs.writeFileSync(path.join(bare, WORKFLOW_DIR, 'README.md'), 'no gate here\n');
  g(bare, ['add', '-A']);
  g(bare, ['commit', '-qm', 'no qa.js']);
  g(bare, ['update-ref', 'refs/remotes/origin/main', g(bare, ['rev-parse', 'HEAD'])]);

  const r = extractJudgeTree({ repo: bare, dest: tmp('pv-judge-'), gitRef: 'origin/main', workTree: null });
  assert.equal(r.ok, false, 'a listing with no qa.js is not a real workflows directory');
  assert.match(r.reason, /qa\.js is not among them/);

  // CONTROL, on the arm that can go silently empty: the same instrument DOES succeed on a real one.
  const { repo } = repoWithEditedGate();
  assert.equal(extractJudgeTree({ repo, dest: tmp('pv-judge-'), gitRef: 'origin/main' }).ok, true);
});

// ── the hard constraint: invocation.args, and nothing else from the router ───────────────────

test('no top-level router field is read — the sha-pinned invocation.args wins over a symbolic tip', () => {
  const { repo } = repoWithEditedGate();
  const pinned = 'b'.repeat(40);
  let seenGoal = null;
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(poisonedRouterJson(repo, pinned)),
      verdictRunner: verdictRunner({ ok: false, reason: 'absent' }, 1),
      launch: (argv) => { seenGoal = argv[argv.length - 1]; return { status: 0, stdout: '', stderr: '' }; },
    },
  });
  assert.equal(r.args.ref, `origin/main...${pinned}`);
  assert.ok(seenGoal.includes(pinned), 'the goal must carry the pinned sha');
  assert.ok(!seenGoal.includes('some-moving-branch'), 'the symbolic top-level tip must never reach the gate');
  assert.ok(!seenGoal.includes('not-the-base'));
});

test('the invocation args reach the goal UNMODIFIED', () => {
  const args = { ref: `origin/main...${SHA}`, tier: 'irreversible', tree: '/abs/work/tree' };
  const goal = buildGoal({ scriptPath: `${WORKFLOW_DIR}/qa.js`, args, harnessRoot: '/h' });
  assert.ok(goal.includes(JSON.stringify(args)), 'args must appear verbatim in the goal');
  assert.match(goal, /LAUNCH RECEIPT/);
  assert.match(goal, /WAIT for it to finish/);
});

test('a router refusal (exit 2, invocation null) is REFUSED — NOT "the gate is not required"', () => {
  const { repo } = repoWithEditedGate();
  const body = JSON.stringify({ error: 'tree-unverified', reason: 'HEAD disagrees', gateRequired: true, invocation: null });
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(body, 2), launch: () => assert.fail('must not launch') },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.equal(r.established, false);

  // CONTROL on the other arm: the SAME null invocation at exit 0 IS "not required". The exit code
  // is the discriminator, and this pair is what proves it separates the two.
  const ok = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(JSON.stringify({ floor: 'lite', invocation: null }), 0), launch: () => assert.fail('must not launch') },
  });
  assert.equal(ok.outcome, OUTCOME.NOT_REQUIRED);
});

test('an unreadable router is REFUSED', () => {
  const { repo } = repoWithEditedGate();
  for (const runner of [routerRunner('not json at all', 0), () => ({ error: new Error('ENOENT') })]) {
    const r = produceVerdict({ repo, judgeDir: tmp('pv-judge-'), deps: { runGateRunner: runner, launch: () => assert.fail('must not launch') } });
    assert.equal(r.outcome, OUTCOME.REFUSED);
  }
});

// ── arg validation, which refuses early what qa.js would refuse late and expensively ─────────

test('validateArgs refuses a symbolic tip, a relative tree and a missing tree', () => {
  const tree = tmp('pv-tree-');
  assert.equal(validateArgs({ ref: `origin/main...${SHA}`, tier: 'full', tree }), null, 'CONTROL: a good shape passes');
  assert.match(validateArgs({ ref: 'origin/main...a-branch', tier: 'full', tree }), /sha-tipped/);
  assert.match(validateArgs({ ref: `origin/main...${SHA}`, tier: 'full', tree: '.' }), /must be absolute/);
  assert.match(validateArgs({ ref: `origin/main...${SHA}`, tier: 'full' }), /`args\.tree` is missing/);
  assert.match(validateArgs({ tree }), /`args\.ref` is missing/);
  assert.match(validateArgs(null), /no `args` object/);
  assert.match(validateArgs({ ref: `origin/main...${SHA}`, tree: path.join(tree, 'nope') }), /does not exist/);
});

test('refTip reads both range forms and a bare sha', () => {
  assert.equal(refTip(`origin/main...${SHA}`), SHA);
  assert.equal(refTip(`origin/main..${SHA}`), SHA);
  assert.equal(refTip(SHA), SHA);
});

// ── cost: an existing binding verdict is not re-run ──────────────────────────────────────────

test('a verdict that already binds skips the launch entirely — 2.5-3.8M tokens is the reason', () => {
  const { repo } = repoWithEditedGate();
  let launches = 0;
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(poisonedRouterJson(repo)),
      verdictRunner: verdictRunner({ ok: true, reason: 'match', subject: SHA, tier: 'full' }, 0),
      launch: () => { launches += 1; return { status: 0, stdout: '' }; },
    },
  });
  assert.equal(r.outcome, OUTCOME.PRODUCED);
  assert.equal(r.preexisting, true);
  assert.equal(r.launched, false);
  assert.equal(launches, 0, 'the panel must not be re-run for a diff whose verdict already binds');
});

test('a pre-existing BLOCK also skips the launch, and stays BLOCKED', () => {
  const { repo } = repoWithEditedGate();
  let launches = 0;
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(poisonedRouterJson(repo)),
      verdictRunner: verdictRunner({ ok: false, reason: 'not-pass', detail: 'verdict=BLOCK', subject: SHA }, 1),
      launch: () => { launches += 1; return { status: 0, stdout: '' }; },
    },
  });
  assert.equal(r.outcome, OUTCOME.BLOCKED);
  assert.equal(launches, 0);
});

// ── dry run establishes nothing, and says so ─────────────────────────────────────────────────

test('a dry run is REFUSED, not a pass, and launches nothing', () => {
  const { repo } = repoWithEditedGate();
  const r = produceVerdict({
    repo, dryRun: true, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(poisonedRouterJson(repo)),
      verdictRunner: verdictRunner({ ok: false, reason: 'absent' }, 1),
      launch: () => assert.fail('a dry run must not launch'),
    },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.equal(r.established, false);
  assert.equal(r.launched, false);
  assert.match(r.reason, /dry run/);
  assert.ok(r.argv.includes('--print'));
});

test('a launcher that cannot be spawned is REFUSED', () => {
  const { repo } = repoWithEditedGate();
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(poisonedRouterJson(repo)),
      verdictRunner: verdictRunner({ ok: false, reason: 'absent' }, 1),
      launch: () => ({ error: new Error('spawn claude ENOENT') }),
    },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.match(r.reason, /could not be launched/);
});

// ── the CLI ──────────────────────────────────────────────────────────────────────────────────

test('an unknown flag is refused with exit 2, and nothing is launched', () => {
  const r = spawnCli(['--dry-runn']);
  assert.equal(r.status, EXIT[OUTCOME.REFUSED]);
  assert.match(r.stderr, /unknown flag/);
  // CONTROL: the known spelling is accepted by the flag screen (it then fails on the repo, which
  // is a different refusal, and proves the screen is not refusing everything).
  const ok = spawnCli(['--help']);
  assert.equal(ok.status, 0);
});

function spawnCli(args) {
  return spawnSync(process.execPath, [SUBJECT, ...args], { encoding: 'utf8', cwd: HERE });
}
