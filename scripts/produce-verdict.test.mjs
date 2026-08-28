// scripts/produce-verdict.test.mjs — the blocking assertions for the verdict PRODUCER.
//
// THE SUBJECT IS IMPORTED AT THE TOP, ON PURPOSE. A subject reached indirectly — spawned, or
// required inside a try/catch — lets the harness turn its ABSENCE into a RESULT: a coherent tally
// that reads like a behavioural defect. A top-level import cannot go silent.
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
  REQUIRED_AGENTS,
  CRITICAL_PATHS,
  canonical,
  isInside,
  refTip,
  shellQuote,
  validateArgs,
  crossCheckArgs,
  materialiseJudgeProject,
  readVerdictArtifact,
  buildGoal,
  produceVerdict,
} from './produce-verdict.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SUBJECT = path.join(HERE, 'produce-verdict.mjs');
const REPO_ROOT = path.resolve(HERE, '..');

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

function write(root, rel, body) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
}

/**
 * A harness-shaped repo whose `main` is honest and whose checked-out branch has EDITED THE JUDGE
 * and SHIPPED A HOSTILE CHECKER. Both halves matter: the first is hazard 2, the second is the A1
 * exploit an adversarial review demonstrated end to end.
 */
function repoWithHostilePr() {
  const repo = tmp('pv-repo-');
  g(repo, ['init', '-q', '-b', 'main']);
  write(repo, `${WORKFLOW_DIR}/qa.js`, 'MAIN COPY OF THE GATE\n');
  write(repo, `${WORKFLOW_DIR}/lib/gate-logic.mjs`, 'MAIN SIBLING\n');
  write(repo, '.claude/agents/reviewer.md', '# reviewer (main)\n');
  write(repo, '.claude/agents/reviewer-readonly.md', '# reviewer-readonly (main)\n');
  write(repo, '.claude/settings.json', '{"sandbox":{"enabled":true}}\n');
  write(repo, '.claude/qa-tier-floor.yml', 'rules: []\n');
  write(repo, 'scripts/verdict.mjs', 'HONEST CHECKER FROM MAIN\n');
  write(repo, 'scripts/lib/classifier.js', 'MAIN CLASSIFIER\n');
  g(repo, ['add', '-A']);
  g(repo, ['commit', '-qm', 'main']);
  const mainSha = g(repo, ['rev-parse', 'HEAD']);
  g(repo, ['update-ref', 'refs/remotes/origin/main', mainSha]);

  g(repo, ['checkout', '-qb', 'pr']);
  write(repo, `${WORKFLOW_DIR}/qa.js`, 'PR COPY — THE JUDGE THIS DIFF EDITS\n');
  write(repo, 'scripts/verdict.mjs', 'HOSTILE CHECKER: always prints {"ok":true}\n');
  write(repo, '.claude/agents/reviewer-readonly.md', '# reviewer-readonly (PR: tools: *)\n');
  g(repo, ['add', '-A']);
  g(repo, ['commit', '-qm', 'pr edits the judge and the checker']);
  return { repo, mainSha, prSha: g(repo, ['rev-parse', 'HEAD']) };
}

const SHA = 'a'.repeat(40);

/** A router payload whose TOP-LEVEL fields disagree with `invocation.args`. */
function routerJson(tree, pinnedTip) {
  return JSON.stringify({
    ref: 'origin/main...some-moving-branch',
    tip: 'some-moving-branch',
    base: 'not-the-base',
    files: 3,
    floor: 'full',
    gateRequired: true,
    invocation: {
      tool: 'Workflow',
      scriptPath: `${WORKFLOW_DIR}/qa.js`,
      args: { ref: `origin/main...${pinnedTip}`, tier: 'full', tree },
    },
  });
}

const routerRunner = (stdout, status = 0) => () => ({ status, stdout, stderr: '' });
const verdictRunner = (payload, status) => () => ({ status, stdout: JSON.stringify(payload), stderr: '' });
const ABSENT = { ok: false, reason: 'absent', subject: SHA, tier: 'full' };

// ── the four terminal states ─────────────────────────────────────────────────────────────────

test('four terminal states, four distinct exit codes, and NOT_REQUIRED is not 0', () => {
  assert.equal(new Set(Object.values(EXIT)).size, 4, 'two states share an exit code');
  assert.equal(EXIT[OUTCOME.PRODUCED], 0);
  assert.notEqual(EXIT[OUTCOME.NOT_REQUIRED], EXIT[OUTCOME.PRODUCED]);
  assert.notEqual(EXIT[OUTCOME.REFUSED], EXIT[OUTCOME.BLOCKED]);
});

test('established is false for REFUSED alone — the shape gates.yml asks for', () => {
  const bin = '/judge/scripts/verdict.mjs';
  const pass = readVerdictArtifact({ tree: '/t', ref: SHA, verdictBin: bin, runner: verdictRunner({ ok: true, reason: 'match', subject: SHA, tier: 'full' }, 0) });
  const block = readVerdictArtifact({ tree: '/t', ref: SHA, verdictBin: bin, runner: verdictRunner({ ok: false, reason: 'not-pass', detail: 'verdict=BLOCK', subject: SHA }, 1) });
  const absent = readVerdictArtifact({ tree: '/t', ref: SHA, verdictBin: bin, runner: verdictRunner(ABSENT, 1) });
  assert.equal(pass.outcome, OUTCOME.PRODUCED);
  assert.equal(block.outcome, OUTCOME.BLOCKED);
  assert.equal(absent.outcome, OUTCOME.REFUSED);
  assert.deepEqual([pass.established, block.established, absent.established], [true, true, false]);
});

test('an unrecognised recorded verdict is REFUSED, never BLOCKED and never PRODUCED', () => {
  for (const detail of ['verdict=REFUSED', 'verdict=SOMETHING_NEW', '', 'blocked']) {
    const r = readVerdictArtifact({
      tree: '/t', ref: SHA, verdictBin: '/j/v.mjs',
      runner: verdictRunner({ ok: false, reason: 'not-pass', detail, subject: SHA }, 1),
    });
    assert.equal(r.outcome, OUTCOME.REFUSED, `detail ${JSON.stringify(detail)} must not establish anything`);
  }
});

test('tier-drift, subject-mismatch and an unreadable payload are all REFUSED', () => {
  for (const reason of ['tier-drift', 'subject-mismatch', 'unparseable', 'absent']) {
    const r = readVerdictArtifact({ tree: '/t', ref: SHA, verdictBin: '/j/v.mjs', runner: verdictRunner({ ok: false, reason, subject: SHA }, 1) });
    assert.equal(r.outcome, OUTCOME.REFUSED);
  }
  const dead = readVerdictArtifact({ tree: '/t', ref: SHA, verdictBin: '/j/v.mjs', runner: () => ({ status: 2, stdout: '', stderr: 'boom' }) });
  assert.equal(dead.outcome, OUTCOME.REFUSED);
  assert.equal(dead.established, false);
});

// ── A1 · PROVENANCE: the checker that decides comes from the ref, not from the PR ────────────

test('A1 — the artifact is read with the JUDGE\'s verdict.mjs, never with the PR\'s', () => {
  const { repo, prSha } = repoWithHostilePr();
  const judge = tmp('pv-judge-');
  const spawned = [];
  produceVerdict({
    repo, judgeDir: judge,
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: (argv) => { spawned.push(argv[0]); return { status: 1, stdout: JSON.stringify(ABSENT) }; },
      launch: () => ({ status: 0, stdout: '', stderr: '' }),
    },
  });
  assert.ok(spawned.length >= 1, 'the checker must actually be invoked');
  for (const bin of spawned) {
    assert.equal(bin, path.join(judge, 'scripts', 'verdict.mjs'), 'the checker must come from the judging project');
    assert.notEqual(bin, path.join(repo, 'scripts', 'verdict.mjs'), 'the PR\'s checker must never be executed');
  }
  // CONTROL on the bytes, not only the path: the judge's copy is main's, and the PR's really does
  // differ — so the assertion above is about provenance and not about two identical files.
  assert.match(fs.readFileSync(path.join(judge, 'scripts', 'verdict.mjs'), 'utf8'), /HONEST CHECKER FROM MAIN/);
  assert.match(fs.readFileSync(path.join(repo, 'scripts', 'verdict.mjs'), 'utf8'), /HOSTILE CHECKER/);
});

test('A1 — the PRE-check is made with the judge\'s checker too, so a forgery cannot suppress the run', () => {
  const { repo, prSha } = repoWithHostilePr();
  const judge = tmp('pv-judge-');
  const bins = [];
  const r = produceVerdict({
    repo, judgeDir: judge,
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: (argv) => { bins.push(argv[0]); return { status: 1, stdout: JSON.stringify(ABSENT) }; },
      launch: () => ({ status: 0, stdout: '', stderr: '' }),
    },
  });
  // Two reads: the cost short-circuit and the post-launch read. BOTH under the judge.
  assert.equal(bins.length, 2);
  assert.ok(bins.every((b) => b.startsWith(judge)), `a read escaped the judging project: ${bins.join(', ')}`);
  assert.equal(r.launched, true, 'with no binding verdict the panel must actually be launched');
});

test('A1 — the router is distrusted: a redirected tree or tip is REFUSED', () => {
  const { repo, prSha } = repoWithHostilePr();
  const elsewhere = tmp('pv-other-');

  const redirectedTree = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(routerJson(elsewhere, prSha)), launch: () => assert.fail('must not launch') },
  });
  assert.equal(redirectedTree.outcome, OUTCOME.REFUSED);
  assert.match(redirectedTree.reason, /not the repository under review/);

  const redirectedTip = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(routerJson(repo, SHA)), launch: () => assert.fail('must not launch') },
  });
  assert.equal(redirectedTip.outcome, OUTCOME.REFUSED);
  assert.match(redirectedTip.reason, /would review a different commit/);

  // CONTROL: the honest pair passes the cross-check, so the two refusals are about the redirection
  // and not about the check refusing everything.
  assert.equal(crossCheckArgs({ repo, args: { ref: `origin/main...${prSha}`, tree: repo } }), null);
});

// ── A2 · the judging project must be one the judge can dispatch out of ───────────────────────

test('A2 — the agents qa.js dispatches are materialised, from the ref', () => {
  const { repo } = repoWithHostilePr();
  const dest = tmp('pv-judge-');
  const r = materialiseJudgeProject({ repo, dest, gitRef: 'origin/main', workTree: repo });
  assert.equal(r.ok, true, r.reason);
  for (const a of REQUIRED_AGENTS) {
    const p = path.join(dest, '.claude/agents', `${a}.md`);
    assert.ok(fs.existsSync(p), `${a} is not dispatchable from the judging project`);
  }
  // ...and from MAIN, not from the PR — the PR rewrote reviewer-readonly.md.
  assert.match(fs.readFileSync(path.join(dest, '.claude/agents/reviewer-readonly.md'), 'utf8'), /\(main\)/);
  assert.match(fs.readFileSync(path.join(repo, '.claude/agents/reviewer-readonly.md'), 'utf8'), /tools: \*/);
  assert.ok(fs.existsSync(path.join(dest, '.claude/settings.json')), 'the session would launch with no sandbox configuration');
});

test('A2 — REQUIRED_AGENTS does not drift from what qa.js actually dispatches', () => {
  const qa = fs.readFileSync(path.join(REPO_ROOT, WORKFLOW_DIR, 'qa.js'), 'utf8');
  const found = [...qa.matchAll(/^const (?:REVIEW_AGENT|JUDGE_AGENT)\s*=\s*'([^']+)'/gm)].map((m) => m[1]);
  assert.ok(found.length > 0, 'CONTROL: the grep found no agent constants at all — it is aimed wrong');
  assert.deepEqual([...new Set(found)].sort(), [...REQUIRED_AGENTS].sort());
});

test('A2 — an incomplete materialisation is REFUSED, not launched into', () => {
  const { repo } = repoWithHostilePr();
  const dest = tmp('pv-judge-');
  const r = materialiseJudgeProject({
    repo, dest, gitRef: 'origin/main',
    // The shape of the failure: the extractor returns normally, having left an agent behind.
    extract: (o) => {
      const tar = path.join(o.dest, 'x.tar');
      execFileSync('git', ['archive', '--format=tar', '-o', tar, o.gitRef], { cwd: o.repo });
      execFileSync('tar', ['-xf', tar, '-C', o.dest]);
      fs.rmSync(tar, { force: true });
      fs.rmSync(path.join(o.dest, '.claude/agents/reviewer-readonly.md'), { force: true });
    },
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /missing after materialisation/);
});

test('a materialisation that lands the WRONG BYTES is caught by reading them back', () => {
  const { repo } = repoWithHostilePr();
  const r = materialiseJudgeProject({
    repo, dest: tmp('pv-judge-'), gitRef: 'origin/main',
    extract: (o) => {
      const tar = path.join(o.dest, 'x.tar');
      execFileSync('git', ['archive', '--format=tar', '-o', tar, o.gitRef], { cwd: o.repo });
      execFileSync('tar', ['-xf', tar, '-C', o.dest]);
      fs.rmSync(tar, { force: true });
      fs.writeFileSync(path.join(o.dest, WORKFLOW_DIR, 'qa.js'), 'NOT WHAT WAS ASKED FOR\n');
    },
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /does not match origin\/main after materialisation/);

  // ...and the same for an AGENT DEFINITION, not only for qa.js. Without this cell, dropping an
  // agent from CRITICAL_PATHS is a silent deletion: the completeness check would still pass,
  // because the file exists — it is only its CONTENT that stops being verified.
  const agentSwap = materialiseJudgeProject({
    repo, dest: tmp('pv-judge-'), gitRef: 'origin/main',
    extract: (o) => {
      const tar = path.join(o.dest, 'x.tar');
      execFileSync('git', ['archive', '--format=tar', '-o', tar, o.gitRef], { cwd: o.repo });
      execFileSync('tar', ['-xf', tar, '-C', o.dest]);
      fs.rmSync(tar, { force: true });
      fs.writeFileSync(path.join(o.dest, '.claude/agents/reviewer-readonly.md'), '# tools: *\n');
    },
  });
  assert.equal(agentSwap.ok, false, 'a swapped judge definition must be caught by content, not by presence');
  assert.match(agentSwap.reason, /reviewer-readonly\.md does not match/);

  // CONTROL: the identical call with an honest extractor succeeds.
  assert.equal(materialiseJudgeProject({ repo, dest: tmp('pv-judge-'), gitRef: 'origin/main' }).ok, true);
});

test('a listing without the critical paths is refused as not-a-harness-tree', () => {
  const bare = tmp('pv-bare-');
  g(bare, ['init', '-q', '-b', 'main']);
  write(bare, 'README.md', 'nothing here\n');
  g(bare, ['add', '-A']);
  g(bare, ['commit', '-qm', 'empty']);
  g(bare, ['update-ref', 'refs/remotes/origin/main', g(bare, ['rev-parse', 'HEAD'])]);
  const r = materialiseJudgeProject({ repo: bare, dest: tmp('pv-judge-'), gitRef: 'origin/main' });
  assert.equal(r.ok, false);
  assert.match(r.reason, /not a listing of a harness tree/);
});

// ── A3 · the containment refusal must not fail open on a symlinked path ──────────────────────

test('A3 — a judging project reached through a SYMLINK into the work tree is refused', () => {
  const { repo } = repoWithHostilePr();
  const link = path.join(tmp('pv-link-'), 'to-worktree');
  fs.symlinkSync(repo, link);
  const dest = path.join(link, 'judge'); // does not exist yet — the arm that used to fail open
  assert.equal(fs.existsSync(dest), false, 'CONTROL: the destination must not exist, or the bug is not exercised');

  assert.equal(isInside(dest, repo), true, 'the symlinked, not-yet-existing path is inside the work tree');
  const r = materialiseJudgeProject({ repo, dest, gitRef: 'origin/main', workTree: repo });
  assert.equal(r.ok, false);
  assert.match(r.reason, /inside the work tree/);
  assert.equal(fs.existsSync(path.join(dest, WORKFLOW_DIR, 'qa.js')), false, 'and it wrote nothing');

  // NEGATIVE CONTROL: a genuinely outside path is still allowed, so the guard is not refusing all.
  assert.equal(isInside(tmp('pv-outside-'), repo), false);
});

test('canonical() resolves a symlink through a path whose leaf does not exist', () => {
  const real = tmp('pv-real-');
  const link = path.join(tmp('pv-link2-'), 'l');
  fs.symlinkSync(real, link);
  assert.equal(canonical(path.join(link, 'nope', 'deeper')), path.join(fs.realpathSync(real), 'nope', 'deeper'));
});

// ── A5 · what is interpolated into a command line ────────────────────────────────────────────

test('A5 — a tree this script would not safely interpolate is refused, and the goal quotes anyway', () => {
  const evil = tmp('pv-evil-');
  const nasty = path.join(evil, 'a; touch PWNED #');
  fs.mkdirSync(nasty, { recursive: true });
  assert.match(validateArgs({ ref: `origin/main...${SHA}`, tier: 'full', tree: nasty }), /will not interpolate/);
  // CONTROL: an ordinary absolute path passes, so the rule is about the metacharacters.
  assert.equal(validateArgs({ ref: `origin/main...${SHA}`, tier: 'full', tree: evil }), null);

  const goal = buildGoal({ scriptPath: 'x.js', args: { ref: `origin/main...${SHA}`, tier: 'full', tree: '/a b/c' }, verdictBin: '/j/v.mjs' });
  assert.ok(goal.includes(shellQuote('/a b/c')), 'the tree must reach the command line quoted');
  assert.equal(shellQuote("it's"), `'it'\\''s'`);
});

test('the invocation args reach the goal UNMODIFIED, and the goal names the judge\'s checker', () => {
  const args = { ref: `origin/main...${SHA}`, tier: 'irreversible', tree: '/abs/work/tree' };
  const goal = buildGoal({ scriptPath: `${WORKFLOW_DIR}/qa.js`, args, verdictBin: '/judge/scripts/verdict.mjs' });
  assert.ok(goal.includes(JSON.stringify(args)), 'args must appear verbatim in the goal');
  assert.ok(goal.includes('/judge/scripts/verdict.mjs'));
  assert.match(goal, /LAUNCH RECEIPT/);
  assert.match(goal, /WAIT for it to finish/);
});

// ── E4 · the sha width is pinned ─────────────────────────────────────────────────────────────

test('E4 — the ref tip must be a FULL 40-hex sha; symbolic and abbreviated are both refused', () => {
  const tree = tmp('pv-tree-');
  assert.equal(validateArgs({ ref: `origin/main...${SHA}`, tier: 'full', tree }), null, 'CONTROL: 40 hex passes');
  assert.match(validateArgs({ ref: 'origin/main...a-branch', tier: 'full', tree }), /sha-tipped/);
  assert.match(validateArgs({ ref: `origin/main...${'a'.repeat(7)}`, tier: 'full', tree }), /sha-tipped/);
  assert.match(validateArgs({ ref: `origin/main...${'a'.repeat(39)}`, tier: 'full', tree }), /sha-tipped/);
  assert.match(validateArgs({ ref: `origin/main...${'a'.repeat(41)}`, tier: 'full', tree }), /sha-tipped/);
  assert.match(validateArgs({ ref: `origin/main...${'g'.repeat(40)}`, tier: 'full', tree }), /sha-tipped/);
});

test('validateArgs refuses a relative tree, a missing tree and a missing ref', () => {
  const tree = tmp('pv-tree-');
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

// ── HAZARD 1 · the tool_result is a launch receipt ───────────────────────────────────────────

test('a session that PRINTS "PASS" and writes nothing produces REFUSED', () => {
  const { repo, prSha } = repoWithHostilePr();
  let launched = 0;
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
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
  const { repo, prSha } = repoWithHostilePr();
  const angry = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
      launch: () => ({ status: 1, stdout: 'everything is on fire', stderr: '' }),
    },
  });
  assert.equal(angry.outcome, OUTCOME.REFUSED);

  let calls = 0;
  const calm = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: () => {
        calls += 1;
        return calls === 1
          ? { status: 1, stdout: JSON.stringify(ABSENT) }
          : { status: 0, stdout: JSON.stringify({ ok: true, reason: 'match', subject: SHA, tier: 'full' }) };
      },
      launch: () => ({ status: 1, stdout: 'exited badly', stderr: '' }),
    },
  });
  assert.equal(calm.outcome, OUTCOME.PRODUCED, 'a non-zero session exit must not veto an artifact that binds');
});

// ── HAZARD 2 · cwd decides which judge judges ────────────────────────────────────────────────

test('the judging project holds main\'s qa.js, and the session is launched in it', () => {
  const { repo, prSha } = repoWithHostilePr();
  const judge = tmp('pv-judge-');
  const cwds = [];
  produceVerdict({
    repo, judgeDir: judge,
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
      launch: (argv, opts) => { cwds.push(opts.cwd); return { status: 0, stdout: '', stderr: '' }; },
    },
  });
  assert.deepEqual(cwds, [judge]);
  assert.notEqual(fs.realpathSync(cwds[0]), fs.realpathSync(repo));
  assert.match(fs.readFileSync(path.join(judge, WORKFLOW_DIR, 'qa.js'), 'utf8'), /MAIN COPY/);
  assert.match(fs.readFileSync(path.join(repo, WORKFLOW_DIR, 'qa.js'), 'utf8'), /PR COPY/);
});

// ── the router contract ──────────────────────────────────────────────────────────────────────

test('no top-level router field is read — the sha-pinned invocation.args wins', () => {
  const { repo, prSha } = repoWithHostilePr();
  let seenGoal = null;
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
      launch: (argv) => { seenGoal = argv[argv.length - 1]; return { status: 0, stdout: '', stderr: '' }; },
    },
  });
  assert.equal(r.args.ref, `origin/main...${prSha}`);
  assert.ok(seenGoal.includes(prSha), 'the goal must carry the pinned sha');
  assert.ok(!seenGoal.includes('some-moving-branch'), 'the symbolic top-level tip must never reach the gate');
  assert.ok(!seenGoal.includes('not-the-base'));
});

test('a router refusal (exit 2, invocation null) is REFUSED — NOT "the gate is not required"', () => {
  const { repo } = repoWithHostilePr();
  const body = JSON.stringify({ error: 'tree-unverified', reason: 'HEAD disagrees', gateRequired: true, invocation: null });
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(body, 2), launch: () => assert.fail('must not launch') },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.equal(r.established, false);
  // AND IT MUST SAY WHICH REFUSAL. Asserting only the outcome does not pin the discriminator: exit
  // 2 falls through to the `unreadable` branch and yields REFUSED there too, so a mutation deleting
  // the exit-2 check was SILENT until this line existed. Measured, not argued.
  assert.match(r.reason, /the router refused to emit an invocation/);

  // CONTROL on the other arm: the SAME null invocation at exit 0 IS "not required".
  const ok = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(JSON.stringify({ floor: 'lite', invocation: null }), 0), launch: () => assert.fail('must not launch') },
  });
  assert.equal(ok.outcome, OUTCOME.NOT_REQUIRED);
});

test('an unreadable router is REFUSED', () => {
  const { repo } = repoWithHostilePr();
  for (const runner of [routerRunner('not json at all', 0), () => ({ error: new Error('ENOENT') })]) {
    const r = produceVerdict({ repo, judgeDir: tmp('pv-judge-'), deps: { runGateRunner: runner, launch: () => assert.fail('must not launch') } });
    assert.equal(r.outcome, OUTCOME.REFUSED);
  }
});

// ── cost ─────────────────────────────────────────────────────────────────────────────────────

test('a verdict that already binds skips the launch entirely — 2.5-3.8M tokens is the reason', () => {
  const { repo, prSha } = repoWithHostilePr();
  let launches = 0;
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
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
  const { repo, prSha } = repoWithHostilePr();
  let launches = 0;
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner({ ok: false, reason: 'not-pass', detail: 'verdict=BLOCK', subject: SHA }, 1),
      launch: () => { launches += 1; return { status: 0, stdout: '' }; },
    },
  });
  assert.equal(r.outcome, OUTCOME.BLOCKED);
  assert.equal(launches, 0);
});

test('a dry run is REFUSED, not a pass, and launches nothing', () => {
  const { repo, prSha } = repoWithHostilePr();
  const r = produceVerdict({
    repo, dryRun: true, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
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
  const { repo, prSha } = repoWithHostilePr();
  const r = produceVerdict({
    repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
      launch: () => ({ error: new Error('spawn claude ENOENT') }),
    },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.match(r.reason, /could not be launched/);
});

// ── E3 · the CLI flag screen ─────────────────────────────────────────────────────────────────

test('E3 — a single-dash unknown flag is REFUSED, not dropped in silence', () => {
  for (const bad of ['-json', '--dry-runn', '-x']) {
    const r = spawnCli([bad]);
    assert.equal(r.status, EXIT[OUTCOME.REFUSED], `${bad} was not refused`);
    assert.match(r.stderr, /unknown flag/);
  }
  // CONTROL: a known flag is accepted by the screen.
  assert.equal(spawnCli(['--help']).status, 0);
  // ...and a flag's VALUE is not mistaken for a flag, even when it looks like one.
  const v = spawnCli(['--launcher', '--not-a-flag', '--help']);
  assert.equal(v.status, 0, 'a value consumed by --launcher must not trip the screen');
});

function spawnCli(args) {
  return spawnSync(process.execPath, [SUBJECT, ...args], { encoding: 'utf8', cwd: HERE });
}

test('CRITICAL_PATHS names the files that decide, and they all exist in this repo', () => {
  for (const rel of CRITICAL_PATHS) {
    assert.ok(fs.existsSync(path.join(REPO_ROOT, rel)), `${rel} is named critical and is not in the tree`);
  }
  assert.ok(!fs.existsSync(path.join(REPO_ROOT, '.claude/agents/no-such-agent.md')), 'CONTROL: the probe can report absence');
});
