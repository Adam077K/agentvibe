#!/usr/bin/env node
// POSTURE: PRODUCES. This is the step that makes a verdict EXIST. It runs the panel in a session
// that is not the one being reviewed, then reads the ARTIFACT to decide what happened. It does
// not merge, does not block, and never reports a verdict it did not read out of `.qa/verdicts/`.
//
// scripts/produce-verdict.mjs — the missing half of the QA gate.
//
// WHY THIS EXISTS
// `.claude/gates.yml`'s `qa-verdict` is `kind: command`, running `node scripts/verdict.mjs check`.
// That VERIFIES a recorded verdict exists and binds to this diff — a file lookup and a hash
// compare, no model in the loop, which is exactly why it is safe behind an exit code and exactly
// why it cannot be the thing that reviews. `scripts/run-gate.mjs` decides whether the gate is
// required and emits the invocation that would run it, and says of itself that a router nobody
// calls is the defect it was written to fix.
//
// So the chain read:  router emits an invocation  →  ???  →  gate checks a record that binds.
// The `???` was a human pasting a `Workflow({...})` call into a session. This file is the `???`.
//
//   session runs the panel  →  session records the verdict  →  anyone checks the binding
//   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^      ^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   THIS FILE                                                   gates.yml already had this
//
// ── THE PANEL RUNS IN A SEPARATE, UNGOVERNED SESSION. THAT IS THE DESIGN, NOT A SHORTCUT. ────
//
// `Workflow` is a main-session tool. Measured 2026-08-26: 0 of 55 recorded calls came from a
// sidechain, against 57,590 subagent `Bash` calls in the same scan; and #122 measured
// `claude --agent orchestrator` advertising 5 tools with no `Workflow` among them, the same
// session answering "NO_WORKFLOW_TOOL" with zero tool_uses when asked to use it. A bare
// `claude --print <goal>` DOES get the tool, executes the script, and waits.
//
// `PS-WORKFLOW-CONTAINMENT` in `.claude/hooks/schema-lint.js` keeps `Workflow` off every agent
// definition, for the same reason `reviewer` carries no `Write`: THE GATE MAY NOT BE INVOCABLE BY
// THE THING IT GATES. This file satisfies that REASON rather than arguing with it — the governed
// session does the work and never holds the tool; a separate bare session, launched afterwards by
// this script, runs the gate. **No agent definition is edited and no `mcpServers` or tool grant is
// added.** A design that needed one would be a finding, not a build.
//
// ── HAZARD 1 · THE `tool_result` IS A LAUNCH RECEIPT, NOT A VERDICT ──────────────────────────
//
// `Workflow` is asynchronous. The probe captured the receipt verbatim: "Workflow launched in
// background. Task ID: wl7tw6ebs". The outcome arrives later, in a task output file. A session
// handed that receipt can report "PASS" having observed nothing — the class #110 exists to close,
// arriving on a new path.
//
// SO THIS SCRIPT NEVER READS THE GATE SESSION'S STDOUT AS A RESULT. The launcher's exit code and
// output are recorded as DIAGNOSTICS and are not consulted by the decision. Every terminal state
// below is computed from `verdict.mjs check` against the diff — the artifact, in the committed
// tree. `scripts/produce-verdict.test.mjs` pins this with a launcher that prints "VERDICT: PASS"
// on stdout, exits 0, and writes nothing: the outcome is REFUSED.
//
// ── HAZARD 2 · WORKFLOW DISCOVERY IS cwd-BASED, SO cwd DECIDES WHICH JUDGE JUDGES ────────────
//
// `run-gate.mjs` emits `scriptPath: '.claude/workflows/qa.js'` — RELATIVE, and it says in capitals
// that it cannot make it otherwise, because an absolute path resolved in the PR tree still points
// at the PR tree. Observed 2026-08-24: a launch loaded the PR's own modified `qa.js` and reviewed
// the change with the copy the change edited. run-gate leaves that to "a human, by launching from
// a `main` checkout."
//
// THIS SCRIPT IS THAT HUMAN, MECHANISED. It materialises `.claude/workflows/**` from `origin/main`
// into a scratch directory OUTSIDE the work tree, verifies every extracted blob hash against
// `origin/main`'s, and launches the gate session with that directory as cwd. `args.tree` — which
// run-gate already resolved and verified — carries the work tree, so the oracle still measures the
// PR. Two knobs, pointed at two trees, deliberately.
//
// The scratch directory MUST NOT live inside the work tree, and this is not tidiness: the verdict
// subject is a hash of the work tree's diff, so writing into it would change the subject the panel
// is reviewing, mid-review.
//
// ── HAZARD 3 · A REFUSAL IS ITS OWN TERMINAL VALUE ───────────────────────────────────────────
//
// Rule 10: a resolver never passes what it could not check. #115 made `REFUSED` a real value
// distinct from `BLOCK`, because before it a gate that reviewed nothing was byte-indistinguishable
// from one that ran every reviewer and found defects. `gates.yml`'s `recording_hazard` says
// DO NOT FOLD REFUSED BACK INTO BLOCK — folding moves the lie from the gate to the caller.
//
// Four terminal states, four exit codes, no collapse:
//
//   PRODUCED      0   a verdict record exists, binds this exact diff, and reads PASS
//   BLOCKED       1   a record binds this exact diff and reads BLOCK — the panel ran and said no
//   REFUSED       2   nothing was established about this diff, for any reason
//   NOT_REQUIRED  3   the router decided this diff does not need the gate at all
//
// NOT_REQUIRED is 3 and not 0 ON PURPOSE. "The gate passed" and "the gate did not apply" are
// different sentences and a shell caller branching on `if ok` would say them with one word. A
// caller that treats every code other than 0 as "do not merge" is safe; one that treats 3 as pass
// has to say so explicitly, which is the point.
//
// `established` is `outcome !== REFUSED`, derived on the same line that sets the outcome — the
// shape `gates.yml` asks for, so a consumer asking only "did this run tell me anything" never has
// to enumerate outcome values and cannot be caught out by a fifth one.
//
// ── WHAT IT READS FROM THE ROUTER, AND WHAT IT REFUSES TO READ ───────────────────────────────
//
// `invocation.args`, passed through UNMODIFIED, and the router's EXIT CODE. Nothing else.
//
// A review of #124 measured the reason: the router's top-level `tip` is SYMBOLIC where
// `invocation.args.ref` is SHA-PINNED, and the two disagree on any explicit symbolic `--ref`
// (`fix/gate-ref-shape` vs `e4630009f5…`; they agree on the default path, which is what makes the
// divergence survive casual testing). run-gate says of itself "THE EMITTED TIP IS ALWAYS THE
// RESOLVED SHA, AND THE GATE NOW REQUIRES THAT", because qa.js refuses a symbolic tip outright.
// A consumer that read the top-level field would produce a verdict FOLLOWING A MOVING BRANCH
// instead of refusing when the reviewed bytes change — demonstrated end to end as a PASS covering
// a file the gate never saw.
//
// ONE REFINEMENT, and it is why the discriminator is the exit code rather than a field. The
// obvious rule — "`invocation === null` means the gate is not required" — is WRONG on one shape:
// `run-gate`'s `refuseTree()` also emits `invocation: null`, together with `gateRequired: true`
// and `error: 'tree-unverified'`, at EXIT 2. Keying on nullness alone would turn a router refusal
// into "no gate needed", which is a fail-OPEN on the one path the router built to fail closed.
// run-gate exits 0 whenever it decided and 2 whenever it could not, so the exit code separates
// them without reading a single top-level field. Both halves are pinned in the tests.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const HARNESS_ROOT = path.resolve(HERE, '..');

/** The four terminal states. There is no fifth, and a fifth must not be spelled as one of these. */
export const OUTCOME = {
  PRODUCED: 'PRODUCED',
  BLOCKED: 'BLOCKED',
  REFUSED: 'REFUSED',
  NOT_REQUIRED: 'NOT_REQUIRED',
};

export const EXIT = {
  [OUTCOME.PRODUCED]: 0,
  [OUTCOME.BLOCKED]: 1,
  [OUTCOME.REFUSED]: 2,
  [OUTCOME.NOT_REQUIRED]: 3,
};

/** The subtree that decides which judge judges. Extracted whole — see extractJudgeTree(). */
export const WORKFLOW_DIR = '.claude/workflows';

/** Every result is built here, so `established` cannot drift away from `outcome`. */
function result(outcome, reason, extra = {}) {
  return {
    outcome,
    established: outcome !== OUTCOME.REFUSED,
    reason,
    ...extra,
  };
}

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

// ── The router ───────────────────────────────────────────────────────────────────────────────

/**
 * Run `run-gate.mjs --json` and return `{ status, decision, raw }`.
 *
 * `status` is one of 'decided' | 'refused' | 'unreadable', taken from the EXIT CODE and from
 * whether stdout parsed — never from a field in the payload. See the header.
 */
export function routeGate({ repo, harnessRoot = HARNESS_ROOT, runner = null }) {
  const argv = [path.join(harnessRoot, 'scripts', 'run-gate.mjs'), '--json'];
  const r = (runner ?? ((a) => spawnSync(process.execPath, a, { cwd: repo, encoding: 'utf8' })))(argv);

  if (r.error) return { status: 'unreadable', decision: null, raw: String(r.error.message ?? r.error) };

  let decision = null;
  try {
    decision = JSON.parse(r.stdout ?? '');
  } catch {
    decision = null;
  }

  // Exit 2 is the router saying it could not decide. It emits a JSON body on that path too, which
  // is precisely why the body is not the discriminator.
  if (r.status === 2) return { status: 'refused', decision, raw: (r.stdout || '') + (r.stderr || '') };
  if (r.status !== 0) return { status: 'unreadable', decision, raw: `run-gate exited ${r.status}` };
  if (decision === null) return { status: 'unreadable', decision: null, raw: (r.stdout || '').slice(0, 400) };
  return { status: 'decided', decision, raw: null };
}

const SHA40 = /^[0-9a-f]{40}$/;

/** The tip of a `base...tip` / `base..tip` range, or the whole ref when it is not a range. */
export function refTip(ref) {
  const d3 = ref.lastIndexOf('...');
  if (d3 !== -1) return ref.slice(d3 + 3).trim();
  const d2 = ref.lastIndexOf('..');
  if (d2 !== -1) return ref.slice(d2 + 2).trim();
  return ref.trim();
}

/**
 * Refuse an `invocation.args` this script cannot use. Everything here is a shape qa.js itself
 * refuses one layer down; refusing early makes the failure loud and cheap instead of arriving
 * 40 minutes and 3M tokens later.
 */
export function validateArgs(args) {
  if (!args || typeof args !== 'object') return 'the invocation carries no `args` object';
  const { ref, tree } = args;
  if (typeof ref !== 'string' || !ref) return '`args.ref` is missing';
  if (typeof tree !== 'string' || !tree) return '`args.tree` is missing';
  if (!path.isAbsolute(tree)) return `\`args.tree\` must be absolute, got "${tree}"`;
  if (!SHA40.test(refTip(ref))) {
    return `\`args.ref\` must be sha-tipped, got tip "${refTip(ref)}" — qa.js refuses a symbolic tip, ` +
      'and a verdict bound to a moving branch covers bytes the gate never saw';
  }
  let st;
  try {
    st = fs.statSync(tree);
  } catch {
    return `\`args.tree\` does not exist: ${tree}`;
  }
  if (!st.isDirectory()) return `\`args.tree\` is not a directory: ${tree}`;
  return null;
}

// ── The judging tree ─────────────────────────────────────────────────────────────────────────

function realpath(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

function isInside(child, parent) {
  const c = realpath(child);
  const p = realpath(parent);
  return c === p || c.startsWith(p.endsWith(path.sep) ? p : p + path.sep);
}

/**
 * Materialise `.claude/workflows/**` from `gitRef` into `dest`, and VERIFY IT BY READING THE
 * SUBJECT BACK — every extracted file's blob hash is compared with the hash `gitRef` records for
 * that path. A denied write plus a green check is byte-identical to a mutation that did not fire,
 * and an `applied` flag reports that the write was attempted, not that it was made.
 *
 * Returns `{ ok: true, files, dir }` or `{ ok: false, reason }`.
 */
export function extractJudgeTree({ repo, dest, gitRef = 'origin/main', workTree = null }) {
  if (workTree && isInside(dest, workTree)) {
    return {
      ok: false,
      reason:
        `the judging tree ${dest} is inside the work tree ${workTree}. The verdict subject is a hash of ` +
        'that tree\'s diff, so writing here would change the subject the panel is reviewing, mid-review.',
    };
  }

  let listed;
  try {
    listed = git(repo, ['ls-tree', '-r', '--name-only', gitRef, `${WORKFLOW_DIR}/`]);
  } catch (e) {
    return { ok: false, reason: `cannot list ${WORKFLOW_DIR} at ${gitRef}: ${firstLine(e)}` };
  }
  const paths = listed.split('\n').map((s) => s.trim()).filter(Boolean);

  // POSITIVE CONTROL ON THE INPUT ARM. An empty or truncated listing is what a denied/ misaimed
  // `git ls-tree` looks like, and it would produce an empty judging tree that then fails for a
  // reason naming the wrong thing. qa.js CANNOT be absent from a real listing.
  if (!paths.includes(`${WORKFLOW_DIR}/qa.js`)) {
    return {
      ok: false,
      reason: `${gitRef} lists ${paths.length} file(s) under ${WORKFLOW_DIR}/ and qa.js is not among them — ` +
        'the listing is not of a real workflows directory.',
    };
  }

  for (const rel of paths) {
    let blob;
    try {
      blob = execFileSync('git', ['show', `${gitRef}:${rel}`], {
        cwd: repo,
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      return { ok: false, reason: `cannot read ${gitRef}:${rel}: ${firstLine(e)}` };
    }
    const out = path.join(dest, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, blob);
  }

  // READ THE SUBJECT BACK. Not the write's return value, not a flag we set ourselves — the bytes
  // that are now on disk, hashed the same way git hashed the source.
  for (const rel of paths) {
    const out = path.join(dest, rel);
    let want;
    let got;
    try {
      want = git(repo, ['rev-parse', `${gitRef}:${rel}`]).trim();
      got = git(repo, ['hash-object', out]).trim();
    } catch (e) {
      return { ok: false, reason: `cannot verify ${rel} after extraction: ${firstLine(e)}` };
    }
    if (want !== got) {
      return {
        ok: false,
        reason: `${rel} does not match ${gitRef} after extraction (${gitRef} ${want.slice(0, 12)}… vs on disk ${got.slice(0, 12)}…)`,
      };
    }
  }

  return { ok: true, files: paths, dir: dest };
}

function firstLine(e) {
  return String(e.stderr || e.message || e).trim().split('\n')[0];
}

// ── The artifact, which is the only thing that decides ───────────────────────────────────────

/**
 * `verdict.mjs check` against the work tree, mapped onto the terminal states.
 *
 * The mapping is deliberately unbalanced. `ok` is the ONLY route to PRODUCED. BLOCKED requires a
 * record that binds this exact subject AND spells `BLOCK`. Everything else — absent, unparseable,
 * subject-mismatch, tier-drift, an unreadable payload, an unrecognised verdict string — is
 * REFUSED, because none of them establishes anything about this diff. An unknown value must never
 * drift into "the panel found defects" any more than into "the panel passed".
 */
export function readVerdictArtifact({ tree, ref, harnessRoot = HARNESS_ROOT, runner = null }) {
  const argv = [
    path.join(harnessRoot, 'scripts', 'verdict.mjs'),
    'check',
    '--repo', tree,
    '--ref', ref,
    '--json',
  ];
  const r = (runner ?? ((a) => spawnSync(process.execPath, a, { cwd: tree, encoding: 'utf8' })))(argv);

  if (r.error) {
    return result(OUTCOME.REFUSED, `could not run verdict.mjs: ${String(r.error.message ?? r.error)}`);
  }

  let payload = null;
  try {
    payload = JSON.parse(r.stdout ?? '');
  } catch {
    payload = null;
  }
  if (payload === null || typeof payload.ok !== 'boolean') {
    return result(OUTCOME.REFUSED, `verdict.mjs check produced no readable JSON (exit ${r.status})`, {
      verdict_check: { exit: r.status, stdout: (r.stdout || '').slice(0, 400) },
    });
  }

  const common = { subject: payload.subject ?? null, tier: payload.tier ?? null, verdict_reason: payload.reason };

  if (payload.ok) {
    return result(OUTCOME.PRODUCED, 'a verdict record is committed, binds this exact diff, and reads PASS', common);
  }

  if (payload.reason === 'not-pass') {
    const m = /^verdict=(\S+)$/.exec(String(payload.detail ?? '').trim());
    const recorded = m ? m[1] : null;
    if (recorded === 'BLOCK') {
      return result(OUTCOME.BLOCKED, 'the panel ran and its verdict, bound to this exact diff, is BLOCK', common);
    }
    return result(
      OUTCOME.REFUSED,
      `a record binds this diff but reads "${recorded ?? 'an unreadable value'}", which establishes nothing`,
      common,
    );
  }

  return result(OUTCOME.REFUSED, `no verdict binds this diff (${payload.reason})`, common);
}

// ── The gate session ─────────────────────────────────────────────────────────────────────────

/**
 * What the bare session is told. It carries the args VERBATIM, tells the session to WAIT (the
 * tool_result is a launch receipt), and tells it to record into the work tree — which is not the
 * directory it is standing in.
 */
export function buildGoal({ scriptPath, args, harnessRoot }) {
  const tip = refTip(args.ref);
  return [
    'Run the binding QA gate and record its verdict. Do exactly this and nothing else.',
    '',
    `1. Call the Workflow tool: Workflow({ scriptPath: ${JSON.stringify(scriptPath)}, args: ${JSON.stringify(args)} })`,
    '   Pass those args through UNMODIFIED. Do not rewrite the ref, the tier or the tree.',
    '',
    '2. WAIT for it to finish. The tool result is a LAUNCH RECEIPT ("Workflow launched in',
    '   background. Task ID: ..."), not a verdict. Poll the task output until the run is complete.',
    '   Do not report anything before you have read the workflow\'s own final verdict.',
    '',
    '3. Record that verdict into the tree under review:',
    `     node ${path.join(harnessRoot, 'scripts', 'verdict.mjs')} record \\`,
    `       --repo ${args.tree} --ref ${tip} \\`,
    '       --verdict <PASS|BLOCK|REFUSED> --by produce-verdict --evidence "<the workflow summary>"',
    `   then commit it in ${args.tree}:  git add .qa/verdicts && git commit -m "qa(verdict): <verdict>"`,
    '',
    'Record what the workflow actually returned. REFUSED is a real verdict and means nothing was',
    'established; do not spell it as BLOCK and never as PASS. If the workflow did not complete,',
    'record nothing at all — an absent record is read as a refusal, which is the truth.',
  ].join('\n');
}

// ── The pipeline ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} o
 * @param {string} o.repo            the tree to route from (the PR tree)
 * @param {boolean} o.dryRun         prepare and print, never launch
 * @param {string|null} o.judgeDir   where to materialise main's gate; a temp dir by default
 * @param {string[]} o.launcher      argv prefix for the gate session; default ['claude']
 * @param {number} o.timeoutMs
 * @param {object} o.deps            injection seam for the tests
 */
export function produceVerdict(o = {}) {
  const {
    repo = process.cwd(),
    harnessRoot = HARNESS_ROOT,
    dryRun = false,
    judgeDir = null,
    launcher = ['claude'],
    timeoutMs = 60 * 60 * 1000,
    gitRef = 'origin/main',
    deps = {},
  } = o;

  const route = (deps.routeGate ?? routeGate)({ repo, harnessRoot, runner: deps.runGateRunner ?? null });

  if (route.status === 'refused') {
    return result(OUTCOME.REFUSED, 'the router refused to emit an invocation it could not verify', {
      router: (route.raw || '').slice(0, 500),
    });
  }
  if (route.status === 'unreadable') {
    return result(OUTCOME.REFUSED, 'the router produced nothing this script could read', {
      router: (route.raw || '').slice(0, 500),
    });
  }

  // ONLY `invocation` and, below it, `invocation.args`. No top-level field is read. See the header
  // for the measurement that makes this a hard constraint rather than a preference.
  const invocation = route.decision.invocation;
  if (invocation === null || invocation === undefined) {
    return result(OUTCOME.NOT_REQUIRED, 'the router emitted no invocation, so this diff does not need the gate');
  }

  const args = invocation.args;
  const bad = validateArgs(args);
  if (bad) return result(OUTCOME.REFUSED, `the invocation is unusable: ${bad}`);

  const tip = refTip(args.ref);

  // ── COST. A full panel run has measured 2.5–3.8M tokens and 40–50 minutes. The subject is a hash
  // of the reviewed bytes, so a verdict that already binds is a verdict for THIS diff and re-running
  // the panel would buy nothing at that price. Check the artifact BEFORE launching, and skip.
  const pre = (deps.readVerdictArtifact ?? readVerdictArtifact)({
    tree: args.tree, ref: tip, harnessRoot, runner: deps.verdictRunner ?? null,
  });
  if (pre.outcome === OUTCOME.PRODUCED || pre.outcome === OUTCOME.BLOCKED) {
    return { ...pre, launched: false, preexisting: true, args };
  }

  const dir = judgeDir ?? fs.mkdtempSync(path.join(realpath(os.tmpdir()), 'qa-judge-'));
  const extracted = (deps.extractJudgeTree ?? extractJudgeTree)({
    repo, dest: dir, gitRef, workTree: args.tree,
  });
  if (!extracted.ok) {
    return result(OUTCOME.REFUSED, `could not materialise the gate from ${gitRef}: ${extracted.reason}`, {
      judgeDir: dir, launched: false, args,
    });
  }

  const goal = buildGoal({ scriptPath: invocation.scriptPath ?? `${WORKFLOW_DIR}/qa.js`, args, harnessRoot });
  const argv = [...launcher, '--print', goal];

  if (dryRun) {
    return result(OUTCOME.REFUSED, 'dry run — the gate was prepared and deliberately not launched, so nothing is established', {
      judgeDir: dir, judgeFiles: extracted.files, launched: false, argv, goal, args,
    });
  }

  const spawner = deps.launch ?? ((a, opts) => spawnSync(a[0], a.slice(1), opts));
  const run = spawner(argv, { cwd: dir, encoding: 'utf8', timeout: timeoutMs });

  if (run.error) {
    return result(OUTCOME.REFUSED, `the gate session could not be launched: ${String(run.error.message ?? run.error)}`, {
      judgeDir: dir, launched: false, args,
    });
  }

  // THE LAUNCHER'S OUTPUT IS A DIAGNOSTIC AND IS NEVER THE DECISION. A session that prints "PASS"
  // is evidence about a message. Read the artifact.
  const post = (deps.readVerdictArtifact ?? readVerdictArtifact)({
    tree: args.tree, ref: tip, harnessRoot, runner: deps.verdictRunner ?? null,
  });

  return {
    ...post,
    launched: true,
    preexisting: false,
    judgeDir: dir,
    judgeFiles: extracted.files,
    args,
    session: { exit: run.status ?? null, signal: run.signal ?? null, stdout_bytes: (run.stdout || '').length },
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────

function flag(name) {
  return process.argv.includes(name);
}
function opt(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
}

const KNOWN = new Set(['--json', '--dry-run', '--repo', '--judge-dir', '--launcher', '--timeout', '--git-ref', '--help']);

function main() {
  // AN UNKNOWN FLAG IS REFUSED, never dropped. `verdict.mjs` was measured performing the non-dry
  // action on a mistyped `--dry-run` (#116); this is the same mistake in the same direction and
  // here it costs 3M tokens rather than a file.
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--') && !KNOWN.has(a)) {
      process.stderr.write(`produce-verdict: unknown flag "${a}". Known: ${[...KNOWN].join(' ')}\n`);
      return EXIT[OUTCOME.REFUSED];
    }
  }
  if (flag('--help')) {
    process.stdout.write(
      'usage: produce-verdict.mjs [--repo P] [--dry-run] [--json] [--judge-dir D] [--launcher BIN] [--timeout MS]\n' +
      '  PRODUCED 0 · BLOCKED 1 · REFUSED 2 · NOT_REQUIRED 3\n',
    );
    return 0;
  }

  const timeout = Number(opt('--timeout', String(60 * 60 * 1000)));
  const r = produceVerdict({
    repo: opt('--repo', process.cwd()),
    dryRun: flag('--dry-run'),
    judgeDir: opt('--judge-dir'),
    launcher: [opt('--launcher', 'claude')],
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 60 * 60 * 1000,
    gitRef: opt('--git-ref', 'origin/main'),
  });

  if (flag('--json')) {
    process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
  } else {
    process.stdout.write(`${r.outcome}  (established=${r.established})\n  ${r.reason}\n`);
    if (r.judgeDir) process.stdout.write(`  judge tree: ${r.judgeDir}\n`);
    if (r.subject) process.stdout.write(`  subject:    ${String(r.subject).slice(0, 16)}…\n`);
  }
  return EXIT[r.outcome];
}

if (process.argv[1] && realpath(process.argv[1]) === realpath(fileURLToPath(import.meta.url))) {
  process.exitCode = main();
}
