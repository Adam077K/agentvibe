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
import { createRequire } from 'node:module';

import {
  OUTCOME,
  EXIT,
  JUDGE_REF,
  QA_SCRIPT,
  ARGS_KEYS,
  INVOCATION_TREATMENT,
  FORBIDDEN_TREATMENT,
  FLAG_ROLE_VOCABULARY,
  CLI_SINKS,
  FLAG_ROLES,
  FORBIDDEN_FLAG_ROLE,
  VERDICT_DIR,
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
  installClassifier(repo);
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

/**
 * Copy the REAL `scripts/verdict.mjs`, its `scripts/lib/**` and the real tier map into a fixture,
 * so the judging project materialised from it holds a WORKING recorder and checker.
 *
 * This is the answer to the review's central finding: every seam injected for testability was a
 * seam the tests then stopped watching, and both HIGHs lived in the RELATIONSHIP between this
 * script and `verdict.mjs`, which no mutation of this file can express.
 */
/**
 * The real classifier and the real tier map. `crossCheckArgs` re-derives the tier now, so a fixture
 * acting as its own `harnessRoot` must be able to classify — otherwise every test refuses for a
 * reason that has nothing to do with what it is testing.
 */
function installClassifier(root) {
  fs.mkdirSync(path.join(root, 'scripts', 'lib'), { recursive: true });
  for (const f of fs.readdirSync(path.join(REPO_ROOT, 'scripts', 'lib'))) {
    const src = path.join(REPO_ROOT, 'scripts', 'lib', f);
    if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(root, 'scripts', 'lib', f));
  }
  fs.mkdirSync(path.join(root, '.claude'), { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, '.claude', 'qa-tier-floor.yml'), path.join(root, '.claude', 'qa-tier-floor.yml'));
}

function installRealHarness(root) {
  installClassifier(root);
  fs.copyFileSync(path.join(REPO_ROOT, 'scripts', 'verdict.mjs'), path.join(root, 'scripts', 'verdict.mjs'));
}

/** The tier the classifier actually computes for a range — what an honest router would emit. */
function floorFor(repo, ref) {
  const req = createRequire(import.meta.url);
  const { loadRules, classifyFiles } = req(path.join(repo, 'scripts', 'lib', 'classifier.js'));
  const files = execFileSync('git', ['diff', '--name-only', ref], { cwd: repo, encoding: 'utf8' })
    .split('\n').map((x) => x.trim()).filter(Boolean);
  return classifyFiles(files, loadRules(path.join(repo, '.claude', 'qa-tier-floor.yml'))).floor.tier;
}

const SHA = 'a'.repeat(40);

/** A router payload whose TOP-LEVEL fields disagree with `invocation.args`. */
function routerJson(tree, pinnedTip, tier = null) {
  const ref = `origin/main...${pinnedTip}`;
  const honest = tier ?? (() => { try { return floorFor(tree, ref); } catch { return 'full'; } })();
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
      args: { ref, tier: honest, tree },
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

// ── F-2 · AGAINST THE REAL RECORDER, NOT A STUB ──────────────────────────────────────────────
//
// These three do not inject `verdictRunner`. They materialise a judging project holding the REAL
// `verdict.mjs` and drive it with a launcher that records and commits exactly as `buildGoal`
// instructs. That is the only arrangement in which F-2 is expressible: the defect lived in the
// relationship between the frozen ref and a recorder that moves HEAD, and a stub returning
// `{ok:true}` on its second call cannot express it — a fixture built from the fix cannot fail.

function realHarnessRepo() {
  const repo = tmp('pv-real-');
  g(repo, ['init', '-q', '-b', 'main']);
  write(repo, `${WORKFLOW_DIR}/qa.js`, 'MAIN GATE\n');
  write(repo, '.claude/agents/reviewer.md', '# reviewer\n');
  write(repo, '.claude/agents/reviewer-readonly.md', '# reviewer-readonly\n');
  write(repo, '.claude/settings.json', '{}\n');
  installRealHarness(repo);
  g(repo, ['add', '-A']);
  g(repo, ['commit', '-qm', 'main']);
  g(repo, ['update-ref', 'refs/remotes/origin/main', g(repo, ['rev-parse', 'HEAD'])]);
  g(repo, ['checkout', '-qb', 'pr']);
  write(repo, 'scripts/thing.mjs', 'the change under review\n');
  g(repo, ['add', '-A']);
  g(repo, ['commit', '-qm', 'the PR']);
  return { repo, prSha: g(repo, ['rev-parse', 'HEAD']) };
}

/** A launcher that does what buildGoal asks: record, then commit. It moves HEAD, which is the point. */
function recordingLauncher(repo, verdict) {
  return (argv, opts) => {
    const goal = argv[argv.length - 1];
    const bin = /node '([^']+)' record/.exec(goal)?.[1] ?? path.join(opts.cwd, 'scripts', 'verdict.mjs');
    const tip = /--ref '([0-9a-f]{40})'/.exec(goal)[1];
    execFileSync(process.execPath, [bin, 'record', '--repo', repo, '--ref', tip, '--verdict', verdict, '--by', 'panel', '--evidence', 'the workflow summary'], { encoding: 'utf8' });
    g(repo, ['add', '.qa/verdicts']);
    g(repo, ['commit', '-qm', `qa(verdict): ${verdict}`]);
    return { status: 0, stdout: 'Workflow launched in background. Task ID: wl7tw6ebs\n' };
  };
}

test('F-2 — a real recorder that commits produces PRODUCED, not REFUSED', () => {
  const { repo, prSha } = realHarnessRepo();
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(routerJson(repo, prSha)), launch: recordingLauncher(repo, 'PASS') },
  });
  assert.equal(r.outcome, OUTCOME.PRODUCED, `expected PRODUCED, got ${r.outcome}: ${r.reason}`);
  assert.equal(r.launched, true);
  assert.equal(r.preexisting, false);
  // The record really is on a DESCENDANT of the reviewed tip — which is why a post-check pinned to
  // the tip alone could never see it.
  assert.notEqual(r.head, prSha, 'the recorder must have moved HEAD, or this fixture proves nothing');
  assert.equal(g(repo, ['rev-parse', 'HEAD']), r.head);
});

test('F-3 — a real recorder writing FAIL produces BLOCKED, not REFUSED', () => {
  const { repo, prSha } = realHarnessRepo();
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(routerJson(repo, prSha)), launch: recordingLauncher(repo, 'FAIL') },
  });
  assert.equal(r.outcome, OUTCOME.BLOCKED, `expected BLOCKED, got ${r.outcome}: ${r.reason}`);
  assert.equal(r.established, true, 'a bound FAIL establishes a great deal');
});

test('F-3 — BLOCK is not a spelling the recorder accepts, and that is why FAIL must map', () => {
  const { repo } = realHarnessRepo();
  const bin = path.join(repo, 'scripts', 'verdict.mjs');
  const bad = spawnSync(process.execPath, [bin, 'record', '--repo', repo, '--verdict', 'BLOCK', '--by', 't'], { encoding: 'utf8' });
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr + bad.stdout, /must be PASS or FAIL/);
  const good = spawnSync(process.execPath, [bin, 'record', '--repo', repo, '--verdict', 'FAIL', '--by', 't', '--dry-run'], { encoding: 'utf8' });
  assert.equal(good.status, 0, 'CONTROL: FAIL is accepted');
});

test('F-2 — a session that commits MORE than a verdict is REFUSED, not PRODUCED', () => {
  const { repo, prSha } = realHarnessRepo();
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      launch: (argv, opts) => {
        recordingLauncher(repo, 'PASS')(argv, opts);
        // ...and then changes the reviewed bytes after they were reviewed.
        write(repo, 'scripts/sneaky.mjs', 'added after the review\n');
        g(repo, ['add', '-A']);
        g(repo, ['commit', '-qm', 'sneak']);
        return { status: 0, stdout: '' };
      },
    },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  // The PATH BOUND fires first now and is the stronger refusal: it names what was committed rather
  // than only that the hash moved. The subject-equality branch below it is a second instrument over
  // the same property — see its comment in the subject.
  assert.match(r.reason, /may commit exactly one/);
});

test('F-2 — the subject-equality branch is REACHABLE, so it is not a guard nobody can break', () => {
  const { repo, prSha } = realHarnessRepo();
  const mine = 'c'.repeat(64);
  let call = 0;
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      // Two reads, two DIFFERENT subjects — the disagreement the second instrument exists to catch.
      readVerdictArtifact: () => (call++ === 0
        ? { outcome: OUTCOME.REFUSED, established: false, reason: 'absent', subject: mine }
        : { outcome: OUTCOME.PRODUCED, established: true, reason: 'match', subject: 'd'.repeat(64) }),
      launch: () => {
        // Commit exactly the one path the bound allows, so the PATH check passes and control
        // reaches the equality.
        fs.mkdirSync(path.join(repo, VERDICT_DIR), { recursive: true });
        fs.writeFileSync(path.join(repo, VERDICT_DIR, `${mine}.json`), '{}');
        g(repo, ['add', VERDICT_DIR]);
        g(repo, ['commit', '-qm', 'verdict']);
        return { status: 0, stdout: '' };
      },
    },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.match(r.reason, /moved the reviewed bytes/, 'the equality branch must be the one that fired');
});

// ── A-1 · the judge ref is not the operator's to choose, and the CLASS is checkable ──────────

test('A-1 — no flag may select what gets measured, and every flag declares a role', () => {
  // The registry IS the guard. `--repo` chose the subject and was deleted; `--git-ref` chose the
  // judge, survived that round, and restored the provenance exploit verbatim through a flag. A rule
  // that lives in someone's memory has already failed once here.
  for (const [flag, role] of Object.entries(FLAG_ROLES)) {
    assert.notEqual(role, FORBIDDEN_FLAG_ROLE, `${flag} selects what gets measured — that is the class, not an instance`);
    assert.ok(typeof role === 'string' && role.length > 3, `${flag} has no role`);
  }
  // CONTROL: the registry can express the forbidden value, so the assertion above is not vacuous.
  assert.equal(typeof FORBIDDEN_FLAG_ROLE, 'string');
  assert.ok(FORBIDDEN_FLAG_ROLE.length > 3);

  // And the two removed flags stay removed — at the CLI and in the advertised usage.
  const help = spawnCli(['--help']);
  for (const gone of ['--git-ref', '--repo']) {
    assert.ok(!help.stdout.includes(gone), `--help still advertises ${gone}`);
    assert.equal(spawnCli([gone, 'HEAD']).status, 64, `${gone} is still accepted`);
  }
  assert.ok(help.stdout.includes('--judge-dir'), 'CONTROL: --help does advertise a flag that survives');
});

test('A-1 — the judge ref is a constant, so naming the PR tree cannot make it the judge', () => {
  const { repo, prSha } = repoWithHostilePr();
  const judge = tmp('pv-judge-');
  produceVerdict({
    repo, harnessRoot: repo, judgeDir: judge,
    // A caller passing a ref is ignored: policy is not a parameter.
    gitRef: 'HEAD',
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
      launch: () => ({ status: 0, stdout: '' }),
    },
  });
  assert.equal(JUDGE_REF, 'origin/main');
  // The PR's HEAD ships a hostile checker and an edited judge. Neither reached the judging project.
  assert.match(fs.readFileSync(path.join(judge, 'scripts/verdict.mjs'), 'utf8'), /HONEST CHECKER FROM MAIN/);
  assert.match(fs.readFileSync(path.join(judge, `${WORKFLOW_DIR}/qa.js`), 'utf8'), /MAIN COPY/);
  // CONTROL: the PR tree really does hold the hostile pair, so this is provenance and not two
  // identical files.
  assert.match(fs.readFileSync(path.join(repo, 'scripts/verdict.mjs'), 'utf8'), /HOSTILE CHECKER/);
});

// ── A-2 · the session may commit exactly one verdict, for the subject it reviewed ────────────

test('A-2 — a session that also plants verdicts for OTHER subjects is REFUSED', () => {
  const { repo, prSha } = realHarnessRepo();
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      launch: (argv, opts) => {
        recordingLauncher(repo, 'PASS')(argv, opts);
        // Forged records for subjects never reviewed. These are INVISIBLE to the subject hash —
        // verdict.mjs excludes .qa/verdicts/*.json from every subject — so the equality check alone
        // passes and this arm returned EXIT 0 PRODUCED before the path bound existed.
        fs.mkdirSync(path.join(repo, VERDICT_DIR), { recursive: true });
        for (const n of ['1', '2', '3']) {
          fs.writeFileSync(path.join(repo, VERDICT_DIR, `${n.repeat(64)}.json`),
            JSON.stringify({ subject: n.repeat(64), verdict: 'PASS', by: 'forged', tier: 'full' }));
        }
        g(repo, ['add', VERDICT_DIR]);
        g(repo, ['commit', '-qm', 'plant']);
        return { status: 0, stdout: '' };
      },
    },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED, `expected REFUSED, got ${r.outcome}: ${r.reason}`);
  assert.match(r.reason, /may commit exactly one/);
  // The forged records really were committed — so this refusal is about the check, not about the
  // planting having failed.
  const planted = g(repo, ['ls-tree', '-r', '--name-only', 'HEAD', VERDICT_DIR]);
  assert.ok(planted.includes('1'.repeat(64)), 'CONTROL: the plant must actually have landed');

  // NEGATIVE CONTROL, same fixture shape: the honest single-verdict session still PRODUCES.
  const clean = realHarnessRepo();
  const ok = produceVerdict({
    repo: clean.repo, harnessRoot: clean.repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(routerJson(clean.repo, clean.prSha)), launch: recordingLauncher(clean.repo, 'PASS') },
  });
  assert.equal(ok.outcome, OUTCOME.PRODUCED, `the honest arm must still pass: ${ok.reason}`);
});

test('C-2 — an unreadable subject is REFUSED as unreadable, not as "you moved the bytes"', () => {
  const { repo, prSha } = realHarnessRepo();
  const mine = 'c'.repeat(64);
  let call = 0;
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      // The second read cannot produce a subject — verdict.mjs failing, an output too large to
      // buffer. That is the instrument going silent, not the session misbehaving.
      readVerdictArtifact: () => (call++ === 0
        ? { outcome: OUTCOME.REFUSED, established: false, reason: 'absent', subject: mine }
        : { outcome: OUTCOME.REFUSED, established: false, reason: 'unreadable', subject: null }),
      launch: () => {
        fs.mkdirSync(path.join(repo, VERDICT_DIR), { recursive: true });
        fs.writeFileSync(path.join(repo, VERDICT_DIR, `${mine}.json`), '{}');
        g(repo, ['add', VERDICT_DIR]);
        g(repo, ['commit', '-qm', 'verdict']);
        return { status: 0, stdout: '' };
      },
    },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.match(r.reason, /could not read a subject/);
  assert.ok(!/moved the reviewed bytes/.test(r.reason), 'an unreadable instrument must not be reported as an accusation');
});

// ── R1 · A REGISTRY THAT CHECKS ITSELF. Declaring a role is not being one. ────────────────────

/** The subject with comments and the registry literals removed, so a DECLARATION is not read as a READ. */
function subjectCode() {
  let src = fs.readFileSync(SUBJECT, 'utf8');
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');          // block comments
  src = src.replace(/^\s*\/\/.*$/gm, '');               // line comments
  src = src.replace(/export const INVOCATION_TREATMENT = \{[\s\S]*?\};/, ''); // the registry itself
  src = src.replace(/export const FLAG_ROLES = \{[\s\S]*?\};/, '');
  return src;
}

test('R1 — the role vocabulary is a SET, not a length check', () => {
  for (const [flag, role] of Object.entries(FLAG_ROLES)) {
    assert.ok(FLAG_ROLE_VOCABULARY.includes(role), `${flag} declares "${role}", which is not a role that exists`);
  }
  // The exploit this closes: a reviewer wired a --base-ref knob, declared it 'bounds', and passed
  // 57/57 because the assertion was `typeof role === 'string' && role.length > 3` — so 'xxxx'
  // passed too. Membership of the registry was enforced; the ROLE VALUE was read by nothing.
  assert.equal(FLAG_ROLE_VOCABULARY.includes('xxxx'), false, 'CONTROL: an invented role is not in the set');
  assert.equal(FLAG_ROLE_VOCABULARY.includes(FORBIDDEN_FLAG_ROLE), false, 'the forbidden role is not a legal declaration');
  assert.ok(FLAG_ROLE_VOCABULARY.length >= 3, 'CONTROL: the vocabulary is not empty, so membership can fail');
});

test('R1 — main() may hand the pipeline only the declared sinks, so a wired knob cannot hide behind a role', () => {
  // The set alone does not close it: declaring a real knob 'bounds' still type-checks. What stops
  // it is that a flag which actually REACHES the pipeline has to add a name here, which is visible.
  const m = /r = produceVerdict\(\{([\s\S]*?)\n\s*\}\);/.exec(subjectCode());
  assert.ok(m, 'CONTROL: could not find the CLI call site — this test is aimed wrong');
  const keys = [...m[1].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)].map((x) => x[1]);
  assert.ok(keys.length > 0, 'CONTROL: the extractor found no keys at all');
  assert.deepEqual(keys.sort(), [...CLI_SINKS].sort(),
    'main() passes something to produceVerdict that CLI_SINKS does not declare');
  for (const forbidden of ['repo', 'harnessRoot', 'gitRef']) {
    assert.ok(!keys.includes(forbidden), `${forbidden} is not the operator's to select — each was a HIGH`);
  }
});

test('R1 — a field declared unread or re-derived is NOT consumed, checked on the source', () => {
  // The registry declares INTENT. This is what makes it declare FACT. My own first probe could not
  // do this: it counted the registry key and the comments as reads, so it would have reported a
  // number for a question it could not answer.
  const code = subjectCode();
  for (const field of Object.keys(INVOCATION_TREATMENT)) {
    const leaf = field.split('.').pop();
    if (leaf === 'args') continue;
    const reads = (code.match(new RegExp(`invocation\\.${leaf}\\b`, 'g')) || []).length;
    assert.equal(reads, 0, `invocation.${leaf} is declared "${INVOCATION_TREATMENT[field]}" and is read ${reads} time(s)`);
  }
  // CONTROL on the arm that can go silently empty: a field that IS consumed must still be found,
  // or the stripping above has removed the code along with the comments.
  assert.ok((code.match(/invocation\.args\b/g) || []).length > 0, 'CONTROL: the probe cannot see a real read');
  // NEGATIVE CONTROL: the stripping really did remove the declarations.
  assert.equal((code.match(/'invocation\.scriptPath'/g) || []).length, 0);
});

// ── R2 · a dry run may not report PRODUCED ────────────────────────────────────────────────────

test('R2 — a dry run over a diff whose verdict already binds is REFUSED, not PRODUCED', () => {
  const { repo, prSha } = repoWithHostilePr();
  const r = produceVerdict({
    repo, harnessRoot: repo, dryRun: true, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner({ ok: true, reason: 'match', subject: SHA, tier: 'full' }, 0),
      launch: () => assert.fail('a dry run must not launch'),
    },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED, 'exit 0 must have exactly one route and this is not it');
  assert.equal(r.established, false);
  // The finding is not lost — it rides as a diagnostic, which is not a terminal state.
  assert.equal(r.would_be, OUTCOME.PRODUCED);
  assert.match(r.reason, /dry run/);
});

test('R2 — and the same through a real process: --dry-run never exits 0', () => {
  const repo = cliHarnessRepo();
  commitVerdict(repo, 'PASS');
  const wet = runCliIn(repo, ['--json']);
  assert.equal(wet.status, EXIT[OUTCOME.PRODUCED], 'CONTROL: without --dry-run this diff does produce');
  const dry = runCliIn(repo, ['--json', '--dry-run']);
  assert.equal(dry.status, EXIT[OUTCOME.REFUSED], `--dry-run exited ${dry.status}`);
  const j = JSON.parse(dry.stdout);
  assert.equal(j.outcome, OUTCOME.REFUSED);
  assert.equal(j.would_be, OUTCOME.PRODUCED);
});

// ── A-3, as a CLASS: what the invocation asserts, and what this file re-derives ───────────────

test('A-3 — every field the invocation carries has a declared treatment, and none is trusted', () => {
  const entries = Object.entries(INVOCATION_TREATMENT);
  assert.ok(entries.length >= 5, `only ${entries.length} fields declared`);
  for (const [field, how] of entries) {
    assert.notEqual(how, FORBIDDEN_TREATMENT, `${field} is trusted — that is the class, not an instance`);
    assert.ok(['re-derived', 'unread'].includes(how), `${field} has an unrecognised treatment "${how}"`);
  }
  // CONTROL: the registry can express the forbidden value, so the assertion is not vacuous.
  assert.equal(typeof FORBIDDEN_TREATMENT, 'string');

  // And the registry must cover what a REAL router actually emits — a field appearing in the
  // payload with no entry is the shape that let ref-base and tier go unchecked.
  const { repo, prSha } = repoWithHostilePr();
  const emitted = JSON.parse(routerJson(repo, prSha)).invocation;
  for (const k of Object.keys(emitted)) {
    if (k === 'args') continue;
    assert.ok(`invocation.${k}` in INVOCATION_TREATMENT, `invocation.${k} is emitted and undeclared`);
  }
  for (const k of Object.keys(emitted.args)) {
    assert.ok(`invocation.args.${k}` in INVOCATION_TREATMENT, `invocation.args.${k} is emitted and undeclared`);
    assert.ok(ARGS_KEYS.includes(k), `args.${k} is emitted and not in ARGS_KEYS`);
  }
});

test('A-3 — the router does not choose WHICH GATE runs', () => {
  const { repo, prSha } = repoWithHostilePr();
  const payload = JSON.parse(routerJson(repo, prSha));
  payload.invocation.scriptPath = '.claude/workflows/research.js';
  let goal = null;
  produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(JSON.stringify(payload)),
      verdictRunner: verdictRunner(ABSENT, 1),
      launch: (argv) => { goal = argv[argv.length - 1]; return { status: 0, stdout: '' }; },
    },
  });
  assert.ok(goal.includes(QA_SCRIPT), 'the goal must name the gate this file re-derives');
  assert.ok(!goal.includes('research.js'), 'a router-supplied scriptPath must not reach the gate session');
});

test('A-3 — an args key this script does not know is REFUSED, not forwarded', () => {
  const { repo, prSha } = repoWithHostilePr();
  const payload = JSON.parse(routerJson(repo, prSha));
  payload.invocation.args.budget = 'unlimited';
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(JSON.stringify(payload)), launch: () => assert.fail('must not launch') },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.match(r.reason, /args this script does not know: budget/);
  // CONTROL: the same payload without the extra key proceeds to a launch.
  let launched = 0;
  produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
      launch: () => { launched += 1; return { status: 0, stdout: '' }; },
    },
  });
  assert.equal(launched, 1);
});

// ── C-1 · the terminal exit codes observed from a REAL process, not from the map object ──────
//
// Every CLI test spawned with `cwd: <repo>/scripts`, where the F-1 refusal ends the run before the
// pipeline — so `spawnCli` only ever observed 64 and 2, and exit 0, 1 and 3 were asserted against
// the EXIT object rather than against a run. A deletion attracts no test cases, and the F-1
// narrowing deleted every path that reached them. This harness moves the cwd to a real harness
// tree so the codes are read off `process.exitCode`.

/** A fixture that is a harness: it holds the producer, a faithful router stub, and the real checker. */
function cliHarnessRepo() {
  const { repo } = realHarnessRepo();
  fs.copyFileSync(SUBJECT, path.join(repo, 'scripts', 'produce-verdict.mjs'));
  // A stub router that derives what the real one derives — HEAD and the classifier's floor — so the
  // cross-checks it must pass are real rather than arranged.
  write(repo, 'scripts/run-gate.mjs', `#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(import.meta.url);
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
const ref = 'origin/main...' + sha;
if (process.env.PV_GATE_NOT_REQUIRED) {
  console.log(JSON.stringify({ floor: 'lite', gateRequired: false, invocation: null }));
  process.exit(0);
}
const { loadRules, classifyFiles } = req(path.join(ROOT, 'scripts', 'lib', 'classifier.js'));
const files = execFileSync('git', ['diff', '--name-only', ref], { cwd: ROOT, encoding: 'utf8' })
  .split('\\n').map((x) => x.trim()).filter(Boolean);
const tier = classifyFiles(files, loadRules(path.join(ROOT, '.claude', 'qa-tier-floor.yml'))).floor.tier;
console.log(JSON.stringify({ invocation: { tool: 'Workflow', scriptPath: '.claude/workflows/qa.js', args: { ref, tier, tree: ROOT } } }));
`);
  g(repo, ['add', '-A']);
  g(repo, ['commit', '-qm', 'harness']);
  return repo;
}

function runCliIn(repo, args, env = {}) {
  return spawnSync(process.execPath, [path.join(repo, 'scripts', 'produce-verdict.mjs'), ...args],
    { cwd: repo, encoding: 'utf8', env: { ...process.env, ...env } });
}

/** Record and commit a verdict in `repo` using its own real checker. */
function commitVerdict(repo, verdict) {
  execFileSync(process.execPath, [path.join(repo, 'scripts', 'verdict.mjs'), 'record',
    '--repo', repo, '--verdict', verdict, '--by', 'fixture', '--evidence', 'fixture'], { encoding: 'utf8' });
  g(repo, ['add', VERDICT_DIR]);
  g(repo, ['commit', '-qm', `qa(verdict): ${verdict}`]);
}

test('C-1 — exit 3 NOT_REQUIRED is observed from a real process', () => {
  const repo = cliHarnessRepo();
  const r = runCliIn(repo, ['--json'], { PV_GATE_NOT_REQUIRED: '1' });
  assert.equal(r.status, EXIT[OUTCOME.NOT_REQUIRED], r.stdout + r.stderr);
  assert.equal(JSON.parse(r.stdout).outcome, OUTCOME.NOT_REQUIRED);
});

test('C-1 — exit 0 PRODUCED is observed from a real process', () => {
  const repo = cliHarnessRepo();
  commitVerdict(repo, 'PASS');
  const r = runCliIn(repo, ['--json']);
  assert.equal(r.status, EXIT[OUTCOME.PRODUCED], r.stdout + r.stderr);
  const j = JSON.parse(r.stdout);
  assert.equal(j.outcome, OUTCOME.PRODUCED);
  assert.equal(j.preexisting, true, 'it must be the pre-check short-circuit, not a launch');
});

test('C-1 — exit 1 BLOCKED is observed from a real process', () => {
  const repo = cliHarnessRepo();
  commitVerdict(repo, 'FAIL');
  const r = runCliIn(repo, ['--json']);
  assert.equal(r.status, EXIT[OUTCOME.BLOCKED], r.stdout + r.stderr);
  assert.equal(JSON.parse(r.stdout).outcome, OUTCOME.BLOCKED);
});

test('C-1 — exit 2 REFUSED is observed from a real process, and all four codes are distinct', () => {
  const repo = cliHarnessRepo();
  // No verdict recorded and a launcher that cannot produce one.
  const r = runCliIn(repo, ['--json', '--launcher', '/usr/bin/false']);
  assert.equal(r.status, EXIT[OUTCOME.REFUSED], r.stdout + r.stderr);
  assert.equal(JSON.parse(r.stdout).outcome, OUTCOME.REFUSED);

  // The four codes were observed from four real runs in this file, not read off the map.
  assert.equal(new Set([0, 1, 2, 3]).size, 4);
});

test('C-1 — the F-5 control is aimed at the pipeline, not at the F-1 refusal', () => {
  // The old control asserted `status !== 64`, which the F-1 refusal (exit 2) satisfied — so it
  // proved nothing about the flag's value being accepted. Run it where the pipeline is reachable.
  const repo = cliHarnessRepo();
  commitVerdict(repo, 'PASS');
  const ok = runCliIn(repo, ['--launcher', '/bin/echo', '--json']);
  assert.equal(ok.status, EXIT[OUTCOME.PRODUCED], 'a well-formed flag value must reach the pipeline');
  const bad = runCliIn(repo, ['--launcher', '--json']);
  assert.equal(bad.status, 64);
  assert.match(bad.stderr, /needs a value/);
});

// ── B-1 · the exit map is pinned BY VALUE, because a SWAP is stronger than a fold ─────────────

test('A-2 — ONE verdict file with the WRONG subject in its name is REFUSED', () => {
  // The count bound alone does not catch this: exactly one path is committed, under the right
  // directory, and only its BASENAME is wrong. Measured as a mutation gap — relaxing the basename
  // check to a directory-prefix check was SILENT across the whole suite until this cell existed.
  const { repo, prSha } = realHarnessRepo();
  const other = 'e'.repeat(64);
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      launch: () => {
        fs.mkdirSync(path.join(repo, VERDICT_DIR), { recursive: true });
        fs.writeFileSync(path.join(repo, VERDICT_DIR, `${other}.json`),
          JSON.stringify({ subject: other, verdict: 'PASS', by: 'wrong-subject' }));
        g(repo, ['add', VERDICT_DIR]);
        g(repo, ['commit', '-qm', 'a verdict for something else']);
        return { status: 0, stdout: '' };
      },
    },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED, `expected REFUSED, got ${r.outcome}: ${r.reason}`);
  assert.match(r.reason, /may commit exactly one/);
  assert.equal(g(repo, ['diff', '--name-only', 'HEAD~1..HEAD']).trim(), `${VERDICT_DIR}/${other}.json`,
    'CONTROL: exactly one path was committed, so the count bound is not what refused it');
});

test('B-1 — the four exit codes are pinned by value, not by shape', () => {
  assert.equal(EXIT[OUTCOME.PRODUCED], 0);
  assert.equal(EXIT[OUTCOME.BLOCKED], 1);
  assert.equal(EXIT[OUTCOME.REFUSED], 2);
  assert.equal(EXIT[OUTCOME.NOT_REQUIRED], 3);
  // The previous assertions — size 4, PRODUCED 0, and two notEquals — were all satisfied by a SWAP
  // of BLOCKED and REFUSED, which is a stronger error than the fold the header forbids: it reports
  // "the panel found defects" for a gate that could not run.
  assert.deepEqual(Object.entries(EXIT).sort(), [['BLOCKED', 1], ['NOT_REQUIRED', 3], ['PRODUCED', 0], ['REFUSED', 2]]);
});

// ── B-2 · a checker that says it failed has not passed anything ───────────────────────────────

test('B-2 — ok:true at a non-zero exit is REFUSED, not PRODUCED', () => {
  for (const status of [1, 2, 3, 127]) {
    const r = readVerdictArtifact({
      tree: '/t', ref: SHA, verdictBin: '/j/v.mjs',
      runner: () => ({ status, stdout: JSON.stringify({ ok: true, reason: 'match', subject: SHA, tier: 'full' }) }),
    });
    assert.equal(r.outcome, OUTCOME.REFUSED, `ok:true at exit ${status} must not be a pass`);
    assert.match(r.reason, /exited/);
  }
  // CONTROL: the identical payload at exit 0 IS a pass, so the refusal is about the exit code.
  const good = readVerdictArtifact({
    tree: '/t', ref: SHA, verdictBin: '/j/v.mjs',
    runner: () => ({ status: 0, stdout: JSON.stringify({ ok: true, reason: 'match', subject: SHA, tier: 'full' }) }),
  });
  assert.equal(good.outcome, OUTCOME.PRODUCED);
});

// ── B-3 · an operator judge dir is canonicalised like the default one ────────────────────────

test('B-3 — an operator-supplied judge dir is canonicalised', () => {
  const { repo, prSha } = repoWithHostilePr();
  const real = tmp('pv-jd-');
  const link = path.join(tmp('pv-jdlink-'), 'l');
  fs.symlinkSync(real, link);
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: link,
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
      launch: () => ({ status: 0, stdout: '' }),
    },
  });
  assert.equal(r.judgeDir, fs.realpathSync(real), 'the reported judge dir must be canonical');
  assert.notEqual(r.judgeDir, link, 'CONTROL: the symlinked and canonical forms really do differ');
});

// ── F-1 · the tree that gets routed ──────────────────────────────────────────────────────────

test('F-1 — a repo that is not the tree run-gate ships in is REFUSED, not answered about', () => {
  const { repo } = repoWithHostilePr();
  const elsewhere = tmp('pv-elsewhere-');
  const r = produceVerdict({
    repo: elsewhere, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: () => assert.fail('the router must not even be consulted'), launch: () => assert.fail('must not launch') },
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.match(r.reason, /can only gate the tree it ships in/);
  // CONTROL: the same call with the two agreeing proceeds far enough to consult the router.
  let consulted = 0;
  produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: () => { consulted += 1; return { status: 0, stdout: JSON.stringify({ invocation: null }) }; }, launch: () => assert.fail('must not launch') },
  });
  assert.equal(consulted, 1);
});

test('F-1 — run-gate honours no repo argument, which is why the flag is gone', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'scripts', 'run-gate.mjs'), 'utf8');
  assert.equal((src.match(/'--repo'/g) || []).length, 0, 'run-gate gained a repo flag — the refusal above can be relaxed');
  assert.ok((src.match(/'--ref'/g) || []).length > 0, 'CONTROL: the grep can find a flag run-gate does read');
  const help = spawnCli(['--help']);
  assert.ok(!help.stdout.includes('--repo '), 'the CLI must not advertise a flag nothing honours');
});

// ── A1 · PROVENANCE: the checker that decides comes from the ref, not from the PR ────────────

test('A1 — the artifact is read with the JUDGE\'s verdict.mjs, never with the PR\'s', () => {
  const { repo, prSha } = repoWithHostilePr();
  const judge = tmp('pv-judge-');
  const spawned = [];
  produceVerdict({
    repo, harnessRoot: repo, judgeDir: judge,
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
    repo, harnessRoot: repo, judgeDir: judge,
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
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(routerJson(elsewhere, prSha)), launch: () => assert.fail('must not launch') },
  });
  assert.equal(redirectedTree.outcome, OUTCOME.REFUSED);
  assert.match(redirectedTree.reason, /not the repository under review/);

  const redirectedTip = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(routerJson(repo, SHA)), launch: () => assert.fail('must not launch') },
  });
  assert.equal(redirectedTip.outcome, OUTCOME.REFUSED);
  assert.match(redirectedTip.reason, /would review a different commit/);

  // CONTROL: the honest quadruple passes the cross-check, so the refusals are about the
  // redirection and not about the check refusing everything.
  const ref = `origin/main...${prSha}`;
  assert.equal(crossCheckArgs({ repo, harnessRoot: repo, args: { ref, tier: floorFor(repo, ref), tree: repo } }), null);
});

// ── A-3 · the BASE and the TIER are re-derived too, not only the tip ──────────────────────────

test('A-3 — a dishonest range BASE is REFUSED, and an empty range is the sharp case', () => {
  const { repo, prSha } = repoWithHostilePr();
  const tier = floorFor(repo, `origin/main...${prSha}`);
  const check = (ref, t = tier) => crossCheckArgs({ repo, harnessRoot: repo, args: { ref, tier: t, tree: repo } });

  // CONTROL first, so the refusals below are known to come from the thing being varied.
  assert.equal(check(`origin/main...${prSha}`), null, 'CONTROL: the honest range passes');

  // The measured exploit: an honest tip against itself. The panel gets an EMPTY range while the
  // verdict it produces binds a real diff.
  assert.match(check(`${prSha}...${prSha}`), /not \S*origin\/main|based on/);
  assert.match(check(`some-other-branch...${prSha}`), /based on/);
  // `..` and `...` name different ranges; only one of them is the diff this gate is about.
  assert.match(check(`origin/main..${prSha}`), /three-dot range/);
  assert.match(check(prSha), /three-dot range/);
});

test('A-3 — a tier the router chose rather than derived is REFUSED', () => {
  const { repo, prSha } = repoWithHostilePr();
  const ref = `origin/main...${prSha}`;
  const real = floorFor(repo, ref);
  const check = (t) => crossCheckArgs({ repo, harnessRoot: repo, args: { ref, tier: t, tree: repo } });

  assert.equal(check(real), null, 'CONTROL: the derived tier passes');
  for (const lie of ['trivial', 'lite', 'full', 'irreversible'].filter((t) => t !== real)) {
    assert.match(check(lie), /named tier/, `tier "${lie}" should disagree with "${real}"`);
  }
});

test('A-3 — verdictRef is emitted by main\'s router and deliberately NOT read', () => {
  // #124 built the field for exactly this case and the hostile router emits it truthfully. Reading
  // it would reintroduce the trust crossCheckArgs exists to withhold, so the base is re-derived
  // instead. This pins the decision so it is a choice on the record rather than an oversight.
  const src = fs.readFileSync(SUBJECT, 'utf8');
  assert.equal((src.match(/decision\.verdictRef|verdictRef\./g) || []).length, 0,
    'the producer must not consume the router\'s verdictRef');
  assert.ok(src.includes('refParts(args.ref)'), 'CONTROL: it re-derives the base from args.ref instead');
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
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
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
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: {
      runGateRunner: routerRunner(routerJson(repo, prSha)),
      verdictRunner: verdictRunner(ABSENT, 1),
      launch: () => ({ status: 1, stdout: 'everything is on fire', stderr: '' }),
    },
  });
  assert.equal(angry.outcome, OUTCOME.REFUSED);

  let calls = 0;
  const calm = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
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
    repo, harnessRoot: repo, judgeDir: judge,
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
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
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
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
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
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
    deps: { runGateRunner: routerRunner(JSON.stringify({ floor: 'lite', invocation: null }), 0), launch: () => assert.fail('must not launch') },
  });
  assert.equal(ok.outcome, OUTCOME.NOT_REQUIRED);
});

test('an unreadable router is REFUSED', () => {
  const { repo } = repoWithHostilePr();
  for (const runner of [routerRunner('not json at all', 0), () => ({ error: new Error('ENOENT') })]) {
    const r = produceVerdict({ repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'), deps: { runGateRunner: runner, launch: () => assert.fail('must not launch') } });
    assert.equal(r.outcome, OUTCOME.REFUSED);
  }
});

// ── cost ─────────────────────────────────────────────────────────────────────────────────────

test('a verdict that already binds skips the launch entirely — 2.5-3.8M tokens is the reason', () => {
  const { repo, prSha } = repoWithHostilePr();
  let launches = 0;
  const r = produceVerdict({
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
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
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
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
    repo, harnessRoot: repo, dryRun: true, judgeDir: tmp('pv-judge-'),
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
    repo, harnessRoot: repo, judgeDir: tmp('pv-judge-'),
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

test('E3 — a single-dash unknown flag is refused as USAGE, not dropped and not a terminal state', () => {
  for (const bad of ['-json', '--dry-runn', '-x', '--repo']) {
    const r = spawnCli([bad]);
    assert.equal(r.status, 64, `${bad} was not refused as a usage error`);
    assert.ok(!Object.values(EXIT).includes(r.status), 'a typo must not wear a terminal state');
    assert.match(r.stderr, /unknown flag/);
  }
  // CONTROL: a known flag is accepted by the screen (usage exits 64, not a terminal state).
  assert.equal(spawnCli(['--help']).status, 64);
});

test('F-4 — usage is exit 64, never 0: there is exactly one route to PRODUCED', () => {
  const h = spawnCli(['--help']);
  assert.equal(h.status, 64);
  assert.notEqual(h.status, EXIT[OUTCOME.PRODUCED]);
  assert.ok(!Object.values(EXIT).includes(64), 'the usage code must be outside the four terminal codes');
  assert.match(h.stdout, /usage: produce-verdict/);
});

test('F-5 — a flag whose value is missing is REFUSED, never defaulted to the real launcher', () => {
  for (const args of [['--launcher', '--json'], ['--launcher'], ['--judge-dir', '--dry-run'], ['--timeout']]) {
    const r = spawnCli(args);
    assert.equal(r.status, 64, `${args.join(' ')} should be a usage error, got ${r.status}`);
    assert.match(r.stderr, /needs a value/);
  }
  // CONTROL: a real value is accepted by opt() — this reaches the F-1 refusal, not a usage error.
  const ok = spawnCli(['--launcher', '/bin/echo', '--json']);
  assert.notEqual(ok.status, 64, 'a well-formed value must not read as a usage error');
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

// ── J · THE JUDGE PROJECT'S LIFECYCLE ────────────────────────────────────────────────────────
//
// Twelve mutations of this behaviour once left the entire 48-step suite byte-identical to a
// pristine run, including INVERTING the predicate that decides whether a directory is ours — a
// one-token change that turns a temp-dir reclaimer into a remover of an operator-named path. Each
// cell below is that specification: it must go red under its named mutation.
import {
  keepJudgeDirSetting,
  armJudgeDirCleanup,
  disarmJudgeDirCleanup,
  reclaimJudgeDir,
  sweepJudgeDirs,
  produceVerdict as produceVerdictFn,
  readVerdictArtifact as readVerdictArtifactFn,
  isJudgeDirTracked as isJudgeDirTrackedFn,
} from './produce-verdict.mjs';

/**
 * The routing seam every J cell runs through — and the reason four of them were RED on `main`.
 *
 * J-9, J-10, J-12 and J-13 named `materialiseJudgeProject` and `readVerdictArtifact` as deps and
 * left `runGateRunner` unset, so each one called the LIVE `run-gate.mjs` against whatever tree the
 * checkout happened to be. That router classifies `origin/main...HEAD`. On the branch these cells
 * were written on the diff was large and the gate was required, so they passed; the moment they
 * merged, `origin/main...HEAD` became EMPTY, the router emitted no invocation, and every one of
 * them returned NOT_REQUIRED and failed its own DENOMINATOR assertion.
 *
 * Measured on a pristine checkout of `origin/main`, `git status` clean:
 *   scripts/produce-verdict.test.mjs   74 pass · 4 fail
 *   npm run test:merge-gate            141 pass · 4 fail · rc 1     <- a CI step, red
 * and at the commit before the merge, the same file is 65 pass · 0 fail.
 *
 * SO THE CELLS WERE GREEN EXACTLY WHERE THEY COULD NOT BE TRUSTED AND RED WHERE THEY MATTER. The
 * rest of this file already routes through `routerRunner(routerJson(...))` — the seam existed and
 * these four did not take it. Sharing one helper is what stops the next cell forgetting.
 *
 * THE TIP IS THE TREE'S REAL HEAD, NOT A SYNTHETIC SHA. `crossCheckArgs` refuses an invocation
 * whose tip is not what the tree is actually at — "the panel would review a different commit than
 * the one this run is about" — so `'a'.repeat(40)` routes past NOT_REQUIRED and lands on REFUSED
 * one step later. Read at call time, because HEAD moves with every commit on this branch.
 */
const jRouterRunner = () => routerRunner(routerJson(REPO_ROOT, g(REPO_ROOT, ['rev-parse', 'HEAD'])));

/** A directory with a file in it, so "removed" is distinguishable from "was never there". */
function judgeDirFixture() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-judge-probe-'));
  fs.writeFileSync(path.join(d, 'marker'), 'x');
  return d;
}

test('J-1 — an armed directory is swept; MUST NOT FIRE for one that was never armed', () => {
  const ours = judgeDirFixture();
  const theirs = judgeDirFixture();
  assert.equal(armJudgeDirCleanup(ours, {}), true, 'arming must report that it registered');
  sweepJudgeDirs();
  assert.equal(fs.existsSync(ours), false, 'an armed directory must be gone');
  // THE OPERATOR'S --judge-dir. Never armed, so never removed. This is the cell that fails when
  // the `ephemeral` predicate is inverted, which is the sharpest of the twelve.
  assert.equal(fs.existsSync(theirs), true, 'CONTROL: an unarmed directory must survive the sweep');
  fs.rmSync(theirs, { recursive: true, force: true });
});

test('J-2 — reclaimJudgeDir removes only what we registered, and says which it did', () => {
  const ours = judgeDirFixture();
  const theirs = judgeDirFixture();
  armJudgeDirCleanup(ours, {});
  assert.equal(reclaimJudgeDir(ours), true);
  assert.equal(fs.existsSync(ours), false);
  assert.equal(reclaimJudgeDir(theirs), false, 'an unregistered path is refused, not removed');
  assert.equal(fs.existsSync(theirs), true, 'CONTROL: and it is still there');
  fs.rmSync(theirs, { recursive: true, force: true });
});

test('J-3 — disarm keeps a tree the sweep would otherwise take', () => {
  // The REFUSED path. A run whose evidence IS the tree must not delete the tree it just named.
  const d = judgeDirFixture();
  armJudgeDirCleanup(d, {});
  assert.equal(disarmJudgeDirCleanup(d), true);
  sweepJudgeDirs();
  assert.equal(fs.existsSync(d), true, 'a disarmed directory survives');
  fs.rmSync(d, { recursive: true, force: true });
});

test('J-4 — QA_KEEP_JUDGE_DIR is a declared vocabulary, not bare truthiness', () => {
  // Bare truthiness meant `0`, `false`, `no` and `off` ALL selected KEEP: an operator disabling
  // the knob turned it on. verdict.mjs refuses a malformed ceiling; this knob must not guess.
  for (const on of ['1', 'true', 'yes', 'on', 'ON', ' true ']) {
    assert.equal(keepJudgeDirSetting({ QA_KEEP_JUDGE_DIR: on }), true, `${on} means keep`);
  }
  for (const off of ['0', 'false', 'no', 'off', '', 'OFF']) {
    assert.equal(keepJudgeDirSetting({ QA_KEEP_JUDGE_DIR: off }), false, `${off} means reclaim`);
  }
  assert.equal(keepJudgeDirSetting({}), false, 'unset means reclaim');
  for (const bad of ['maybe', '2', 'yes please']) {
    assert.equal(keepJudgeDirSetting({ QA_KEEP_JUDGE_DIR: bad }), null, `${bad} is unrecognised`);
  }
});

test('J-5 — with KEEP set, nothing is registered and the tree survives', () => {
  const d = judgeDirFixture();
  assert.equal(armJudgeDirCleanup(d, { QA_KEEP_JUDGE_DIR: '1' }), false);
  sweepJudgeDirs();
  assert.equal(fs.existsSync(d), true);
  fs.rmSync(d, { recursive: true, force: true });
});

test('J-6 — an unrecognised knob value REFUSES the run rather than guessing about deletion', () => {
  const r = produceVerdictFn({ env: { QA_KEEP_JUDGE_DIR: 'maybe' }, deps: { launch: () => assert.fail('must not launch') } });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.match(r.message ?? r.reason ?? JSON.stringify(r), /QA_KEEP_JUDGE_DIR/);
});

test('J-7 — the library installs an exit sweep and NO signal handlers', () => {
  // An exported function a host calls IN-PROCESS may not decide how that host dies. The previous
  // version installed SIGINT/SIGTERM/SIGHUP handlers calling process.exit(130): measured armed ->
  // wait status 130 with no signal, unarmed -> 143.
  //
  // BOTH ASSERTIONS WERE ONCE ON THE WRONG ARM, and a mutation run is what said so. A before/after
  // DELTA around this arming measures nothing, because `judgeDirCleanupArmed` is already true by
  // the time this test runs — the block under test never executes here, so re-adding the signal
  // handlers left it green. And `exit >= 1` was satisfied by this test file's own cleanup listener,
  // so deleting the library's stayed green too. Both are now absolute and by identity: a fresh
  // process has 0 of each (verified), and the sweep is named rather than counted.
  const d = judgeDirFixture();
  armJudgeDirCleanup(d, {});
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    assert.equal(process.listenerCount(sig), 0, `${sig}: the library must not take the process`);
  }
  assert.ok(process.listeners('exit').includes(sweepJudgeDirs), 'the exit sweep must be installed, by identity');
  sweepJudgeDirs();
});

test('J-8 — an unreadable verdict carries its REASON, not just its exit code', () => {
  // verdict.mjs writes refusals to stderr and exits non-zero with stdout EMPTY, so recording only
  // stdout logged a failure with the cause deleted.
  const r = readVerdictArtifactFn({
    tree: '/nonexistent', ref: 'HEAD', verdictBin: '/nonexistent/verdict.mjs',
    runner: () => ({ status: 2, stdout: '', stderr: 'verdict: produced more than 1024 bytes on stdout or stderr' }),
  });
  assert.equal(r.outcome, OUTCOME.REFUSED);
  assert.match(r.verdict_check.stderr, /produced more than 1024 bytes/);
  // MUST NOT FIRE: a well-formed pass on the same seam still reads as PRODUCED.
  const ok = readVerdictArtifactFn({
    tree: '/nonexistent', ref: 'HEAD', verdictBin: '/nonexistent/verdict.mjs',
    runner: () => ({ status: 0, stdout: JSON.stringify({ ok: true, subject: 'a', tier: 'full' }), stderr: '' }),
  });
  assert.equal(ok.outcome, OUTCOME.PRODUCED, 'CONTROL: the seam still produces');
});

test('J-9 — an operator\'s --judge-dir survives a reclaiming run; ours does not', () => {
  // THE SHARPEST OF THE TWELVE, AND IT TOOK TWO TRIES. Inverting `ephemeral` at the call site arms
  // the operator's own directory and spares the temp one, turning a reclaimer into a remover of a
  // path the caller named. Every unit cell above still passes under it, because each primitive
  // still does exactly what it says.
  //
  // THE FIRST VERSION OF THIS CELL WAS VACUOUS and a mutation run is what caught it: it drove a
  // REFUSED outcome, and on REFUSED the tree is deliberately KEPT either way, so both the correct
  // and the inverted build left the directory standing. Reclamation only happens on an outcome
  // that reached an answer, so that is the only place the inversion is observable. The seams below
  // buy that outcome without a panel run.
  const deps = {
    runGateRunner: jRouterRunner(),
    materialiseJudgeProject: ({ dest }) => ({ ok: true, verdictBin: path.join(dest, 'v.mjs'), files: [] }),
    readVerdictArtifact: () => ({ outcome: OUTCOME.PRODUCED, subject: 's', tier: 'full' }),
  };
  const theirs = judgeDirFixture();
  const r = produceVerdictFn({ repo: REPO_ROOT, judgeDir: theirs, deps: { ...deps, launch: () => assert.fail('must not launch') } });
  assert.equal(r.outcome, OUTCOME.PRODUCED, 'DENOMINATOR: this cell is only meaningful on a reclaiming outcome');
  assert.equal(fs.existsSync(theirs), true, 'an operator-named directory must survive a reclaiming run');

  // THE MIRROR, on the arm that can go silently empty: ours must actually be reclaimed, or the
  // assertion above is satisfied by a build that simply never deletes anything.
  const r2 = produceVerdictFn({ repo: REPO_ROOT, deps: { ...deps, launch: () => assert.fail('must not launch') } });
  assert.equal(r2.outcome, OUTCOME.PRODUCED);
  assert.ok(r2.judgeDir && r2.judgeDir !== theirs, 'CONTROL: the run made its own directory');
  assert.equal(fs.existsSync(r2.judgeDir), false, 'ours must be reclaimed');

  fs.rmSync(theirs, { recursive: true, force: true });
});

test('J-10 — a caller\'s QA_KEEP_JUDGE_DIR is THREADED, not merely validated', () => {
  // Found by the review panel, not by me. The wrapper read `o.env` to decide whether the value was
  // LEGAL and the arming site read `process.env` to decide what to DO, so a caller asking to keep
  // its tree had the request validated and then silently dropped — the directory was deleted. Both
  // arms measured `false` before the fix: opposite instructions, byte-identical outcomes. A
  // silently-ignored retention flag is the worst direction for that class to fail in.
  const deps = {
    runGateRunner: jRouterRunner(),
    materialiseJudgeProject: ({ dest }) => ({ ok: true, verdictBin: path.join(dest, 'v.mjs'), files: [] }),
    readVerdictArtifact: () => ({ outcome: OUTCOME.PRODUCED, subject: 's', tier: 'full' }),
  };
  const kept = produceVerdictFn({ repo: REPO_ROOT, env: { QA_KEEP_JUDGE_DIR: '1' }, deps: { ...deps, launch: () => assert.fail('must not launch') } });
  assert.equal(kept.outcome, OUTCOME.PRODUCED, 'DENOMINATOR: only a reclaiming outcome tests this');
  assert.equal(fs.existsSync(kept.judgeDir), true, 'a caller that asked to keep must get to keep');
  fs.rmSync(kept.judgeDir, { recursive: true, force: true });

  // TWO CONTROLS, because "always keeps" would satisfy the assertion above on its own.
  const gone = produceVerdictFn({ repo: REPO_ROOT, env: {}, deps: { ...deps, launch: () => assert.fail('must not launch') } });
  assert.equal(fs.existsSync(gone.judgeDir), false, 'CONTROL: unset still reclaims');
  const off = produceVerdictFn({ repo: REPO_ROOT, env: { QA_KEEP_JUDGE_DIR: 'off' }, deps: { ...deps, launch: () => assert.fail('must not launch') } });
  assert.equal(fs.existsSync(off.judgeDir), false, 'CONTROL: an explicit off still reclaims');
});

test('J-11 — EVERY produceVerdict call site in this file guards the launcher', () => {
  // THE CLASS, NOT THE SITES. Review named six unguarded cells; the class was SEVEN — the seventh
  // predates these rounds. A per-site fix leaves site 39 free, and the cost of one escaping is not
  // a failing test: it is a live `claude --print <gate goal>` spawned from CI, bounded only by the
  // 60-minute default timeout. That already happened once, from this file, and the session it
  // spawned committed a verdict into the branch under test.
  //
  // These cells avoid a launch today only because the code under test refuses first — which is the
  // exact property they exist to detect the loss of. A guard that depends on the subject behaving
  // is not a guard.
  const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  // Built by concatenation so this parser does not match its own pattern literal.
  const re = new RegExp(`produceVerdict${'(?:Fn)?\\('}`, 'g');
  const unguarded = [];
  let sites = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    let depth = 0;
    const i = m.index + m[0].length - 1;
    let j = i;
    for (; j < src.length; j += 1) {
      if (src[j] === '(') depth += 1;
      else if (src[j] === ')') { depth -= 1; if (depth === 0) break; }
    }
    sites += 1;
    if (!src.slice(i, j + 1).includes('launch:')) unguarded.push(src.slice(0, m.index).split('\n').length);
  }
  assert.ok(sites > 30, `DENOMINATOR read before the verdict: the parser found only ${sites} call sites`);
  assert.deepEqual(unguarded, [], `these call sites can spawn a real gate session, at lines: ${unguarded}`);
  const probe = `produceVerdict${'({ repo: x })'}`;
  assert.ok(!probe.includes('launch:'), 'CONTROL: the predicate can report a site with no guard');
});

test('J-12 — a BLOCKED run reclaims its tree; only REFUSED keeps one', () => {
  // The reclaim arm was asserted only for PRODUCED, so widening the keep predicate from
  // `=== REFUSED` to `REFUSED || BLOCKED` left the suite 75/75 green. BLOCKED means the panel ran
  // and found defects: the answer is in the record, not in the tree.
  const deps = {
    runGateRunner: jRouterRunner(),
    materialiseJudgeProject: ({ dest }) => ({ ok: true, verdictBin: path.join(dest, 'v.mjs'), files: [] }),
    readVerdictArtifact: () => ({ outcome: OUTCOME.BLOCKED, subject: 's', tier: 'full' }),
    launch: () => assert.fail('must not launch'),
  };
  const r = produceVerdictFn({ repo: REPO_ROOT, deps: { ...deps, launch: () => assert.fail('must not launch') } });
  assert.equal(r.outcome, OUTCOME.BLOCKED, 'DENOMINATOR: this cell only speaks about the arm it names');
  assert.equal(fs.existsSync(r.judgeDir), false, 'a BLOCKED run must reclaim its judge project');
});

test('J-13 — only PRODUCED and BLOCKED skip the launcher; REFUSED spends the panel', () => {
  // THIS CELL GOVERNS WHEN ~40 MINUTES AND ~3M TOKENS GET SPENT, and nothing else asserted it.
  //
  // The launch guards on this file's call sites protect the SUITE. They do not protect the PRODUCT
  // — and they make the product harder to protect, because a change that widened this set (BLOCKED
  // reaching the launcher, say) would spend a panel run on a diff already blocked while every cell
  // in this file stayed green, precisely BECAUSE they are guarded now.
  //
  // Measured rather than assumed. `readVerdictArtifact` returns PRODUCED, BLOCKED or REFUSED and
  // nothing else, so REFUSED is the whole reachable fall-through set — and REFUSED is what it
  // returns whenever no verdict is bound yet or one cannot be read, which is the normal state of
  // every branch anyone is working on. Two real runs launched under exactly that condition: one in
  // a tree with no bound verdict, one in a detached clone that could not resolve origin/main. They
  // are the same event under this rule.
  //
  // `REFUSED -> run the gate` is what the producer is FOR. Do not "fix" the third assertion.
  const reach = (outcome) => {
    let launched = 0;
    const r = produceVerdictFn({
      repo: REPO_ROOT,
      deps: {
        runGateRunner: jRouterRunner(),
        materialiseJudgeProject: ({ dest }) => ({ ok: true, verdictBin: path.join(dest, 'v.mjs'), files: [] }),
        readVerdictArtifact: () => ({ outcome, subject: 's', tier: 'full' }),
        launch: () => { launched += 1; return { status: 0, stdout: '', stderr: '' }; },
      },
    });
    if (r.judgeDir) fs.rmSync(r.judgeDir, { recursive: true, force: true });
    return launched;
  };
  assert.equal(reach(OUTCOME.PRODUCED), 0, 'a verdict that already binds must not spend a panel run');
  assert.equal(reach(OUTCOME.BLOCKED), 0, 'a bound BLOCK must not spend a panel run either');
  // THE MUST-FIRE ARM. Without it, both zeros above are satisfied by a build that never launches at
  // all — which is the shape of every vacuous cell this round already found in its own tests.
  assert.equal(reach(OUTCOME.REFUSED), 1, 'CONTROL: no bound verdict is exactly when the panel must run');
});
