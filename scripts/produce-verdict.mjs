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
// calls is the defect it was written to fix. `mission-control/scripts/consume-dispatch.ts` prints
// the gap in its own output: "NO VERDICT WAS PRODUCED; the invocation that would produce one is
// recorded on this entry."
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
// `PS-WORKFLOW-CONTAINMENT` keeps `Workflow` off every agent definition for the same reason
// `reviewer` carries no `Write`: THE GATE MAY NOT BE INVOCABLE BY THE THING IT GATES. This file
// satisfies that REASON rather than arguing with it. **No agent definition is edited and no
// `mcpServers` or tool grant is added.**
//
// ═════════════════════════════════════════════════════════════════════════════════════════════
// PROVENANCE — WHAT COMES FROM `main`, WHAT COMES FROM THE PR, AND WHY THE LINE IS THERE
// ═════════════════════════════════════════════════════════════════════════════════════════════
//
// STATE THE BOUNDARY EXACTLY. An earlier version of this header said "THIS SCRIPT IS THAT HUMAN,
// MECHANISED", which reads as *the judge comes from main*. It materialised `.claude/workflows/**`
// and nothing else, while invoking `run-gate.mjs` and `verdict.mjs` from its OWN directory — which
// is the PR tree, because this script ships in the PR. An adversarial review demonstrated the
// consequence end to end, both arms producing both outcomes:
//
//   a PR shipping a one-line hostile scripts/verdict.mjs whose `check --json` prints {"ok":true}
//     -> EXIT 0 · PRODUCED · launched=FALSE · no judge dir · NO VERDICT RECORD ANYWHERE
//   the same tree with an honest verdict.mjs
//     -> EXIT 2 · REFUSED · launched=TRUE
//
// That is not an instance of the declared "hash-bound, not signed" forgeability — that one needs a
// record. This needed NONE, and the pre-check short-circuit turned it from *bypassing a check* into
// *suppressing the panel run that could have contradicted it*.
//
// WHAT IS FIXED: the judging project is now the WHOLE TREE at `origin/main`, not one directory of
// it. `qa.js`, every agent definition it dispatches, `settings.json`, the tier map, `verdict.mjs`
// and `scripts/lib/**` all come from the ref. The artifact is read with the JUDGE's `verdict.mjs`
// (`judge.verdictBin`), never with this script's neighbour. `verdict.mjs` is built for exactly
// this: it takes `--repo` and reads its tier map from where IT lives, so a main copy judging a PR
// tree is its designed contract, not a trick played on it.
//
// WHAT IS NOT FIXED, AND CANNOT BE FROM HERE: **the router is PR-provenance.** `run-gate.mjs`
// derives its `REPO_ROOT` from its own location and `resolveTree()` refuses when that tree's HEAD
// is not the tip under review — so main's copy CANNOT classify a PR tree, and the reviewer checked
// this rather than assuming it. Editing `run-gate.mjs` is out of scope. What is done instead is to
// distrust its output: `crossCheckArgs()` re-derives `tree` and the ref tip with this process's own
// `git` calls and refuses when they disagree with what the router said. A hostile router can still
// decline to emit an invocation — that is NOT_REQUIRED, exit 3, which is not a pass and never
// becomes one.
//
// SO THE HONEST SENTENCE IS: the JUDGE and everything it loads come from `main`; the ROUTER comes
// from the PR and is cross-checked against an independent instrument. Anyone widening this file
// should keep that sentence true or change it deliberately.
//
// ── HAZARD 1 · THE `tool_result` IS A LAUNCH RECEIPT, NOT A VERDICT ──────────────────────────
//
// `Workflow` is asynchronous. The probe captured the receipt verbatim: "Workflow launched in
// background. Task ID: wl7tw6ebs". A session handed that receipt can report "PASS" having observed
// nothing — the class #110 exists to close, arriving on a new path.
//
// SO THIS SCRIPT NEVER READS THE GATE SESSION'S STDOUT AS A RESULT. The launcher's exit code and
// output are DIAGNOSTICS. Every terminal state is computed from the judge's `verdict.mjs check`.
//
// ── HAZARD 2 · WORKFLOW DISCOVERY IS cwd-BASED, SO cwd DECIDES WHICH JUDGE JUDGES ────────────
//
// `run-gate.mjs` emits a RELATIVE `scriptPath` and says in capitals that it cannot make it
// otherwise. Observed 2026-08-24: a launch loaded the PR's own modified `qa.js`. run-gate leaves
// that to "a human, by launching from a `main` checkout". This script is that human, mechanised —
// and the whole-tree materialisation above is what makes the scratch directory a project a judge
// can actually run in, rather than a directory containing one file it cannot dispatch out of.
//
// The judging tree must NOT live inside the work tree. Be exact about why, because the first
// version of this comment overclaimed: the subject is `sha256(git diff …)`, so UNTRACKED files do
// not move it. What a judge tree inside the work tree actually costs is (a) it pollutes the tree
// under review and moves the subject the moment anyone `git add`s it, and (b) it puts main's copy
// of everything inside the PR's own directory, which is the provenance confusion this section
// exists to prevent.
//
// ── HAZARD 3 · A REFUSAL IS ITS OWN TERMINAL VALUE ───────────────────────────────────────────
//
// Rule 10. #115 made `REFUSED` a real value distinct from `BLOCK`; `gates.yml` says DO NOT FOLD
// REFUSED BACK INTO BLOCK. Four terminal states, four exit codes, no collapse:
//
//   PRODUCED      0   a verdict record exists, binds this exact diff, and reads PASS
//   BLOCKED       1   a record binds this exact diff and reads BLOCK — the panel ran and said no
//   REFUSED       2   nothing was established about this diff, for any reason
//   NOT_REQUIRED  3   the router decided this diff does not need the gate at all
//
// NOT_REQUIRED is 3 and not 0 ON PURPOSE. "The gate passed" and "the gate did not apply" are
// different sentences and `if ok` says them with one word.
//
// `established` is `outcome !== REFUSED`, derived on the same line that sets the outcome, so a
// consumer asking "did this run tell me anything" cannot be caught out by a fifth value.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const HARNESS_ROOT = path.resolve(HERE, '..');

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

export const WORKFLOW_DIR = '.claude/workflows';

/**
 * The agents `qa.js` dispatches. A judging project missing these is not a judging project: the
 * dispatch either errors, or the binary defaults `agentType` to `general-purpose` with tools `*`
 * — and `qa.js` records in its own header what that cost last time, when "every dimension
 * reviewer, every adversarial verifier, and the ONE judge whose verdict binds held `Write` and
 * `Edit` on the diff they were judging."
 *
 * Pinned against `qa.js`'s own constants by a drift test, so adding a third dispatched agent there
 * fails here rather than silently launching a panel that cannot resolve it.
 */
export const REQUIRED_AGENTS = ['reviewer', 'reviewer-readonly'];

/**
 * Read back by CONTENT HASH after materialisation. The whole-tree copy is checked for COMPLETENESS
 * (every blob in the ref exists on disk); these few are additionally checked for IDENTITY, because
 * they are what decides the verdict and a silently different one is the whole of A1.
 */
export const CRITICAL_PATHS = [
  `${WORKFLOW_DIR}/qa.js`,
  ...REQUIRED_AGENTS.map((a) => `.claude/agents/${a}.md`),
  '.claude/settings.json',
  '.claude/qa-tier-floor.yml',
  'scripts/verdict.mjs',
  'scripts/lib/classifier.js',
];

function result(outcome, reason, extra = {}) {
  return { outcome, established: outcome !== OUTCOME.REFUSED, reason, ...extra };
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function firstLine(e) {
  return String(e.stderr || e.message || e).trim().split('\n')[0];
}

// ── paths ────────────────────────────────────────────────────────────────────────────────────

/**
 * Canonicalise a path THAT MAY NOT EXIST YET.
 *
 * `fs.realpathSync` throws ENOENT on a path whose leaf is absent, and the obvious catch — fall
 * back to `path.resolve` — DOES NOT RESOLVE SYMLINKS. That made `isInside()` fail OPEN in the one
 * arrangement that matters: `workTree` always exists so it was canonicalised, `dest` normally does
 * not so it kept its symlinked prefix, and the prefix compare then said "outside" about a
 * directory that was inside. Measured: files landed under `<worktree>/judge3/.claude/workflows/`.
 *
 * The cure is to canonicalise the nearest EXISTING ancestor and re-append the rest, so both sides
 * of the comparison are in the same namespace whether or not the leaf exists yet.
 */
export function canonical(p) {
  let cur = path.resolve(p);
  const tail = [];
  for (;;) {
    try {
      return path.join(fs.realpathSync(cur), ...tail.reverse());
    } catch {
      const parent = path.dirname(cur);
      if (parent === cur) return path.resolve(p); // reached the root and nothing resolved
      tail.push(path.basename(cur));
      cur = parent;
    }
  }
}

export function isInside(child, parent) {
  const c = canonical(child);
  const p = canonical(parent);
  return c === p || c.startsWith(p.endsWith(path.sep) ? p : p + path.sep);
}

// ── the router ───────────────────────────────────────────────────────────────────────────────

/**
 * Run `run-gate.mjs --json`. `status` is 'decided' | 'refused' | 'unreadable', taken from the EXIT
 * CODE and from whether stdout parsed — never from a field in the payload.
 *
 * Keying "not required" on `invocation === null` alone is FAIL-OPEN: run-gate's `refuseTree()`
 * emits `invocation: null` together with `gateRequired: true` at exit 2, so nullness alone turns
 * the router's one deliberate fail-closed path into "no gate needed".
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

  if (r.status === 2) return { status: 'refused', decision, raw: (r.stdout || '') + (r.stderr || '') };
  if (r.status !== 0) return { status: 'unreadable', decision, raw: `run-gate exited ${r.status}` };
  if (decision === null) return { status: 'unreadable', decision: null, raw: (r.stdout || '').slice(0, 400) };
  return { status: 'decided', decision, raw: null };
}

const SHA40 = /^[0-9a-f]{40}$/;

/**
 * A path safe to interpolate into a shell command line without quoting tricks. `buildGoal` writes
 * `args.tree` into commands a human or an agent will run; `validateArgs` previously required only
 * "absolute and exists", which is not the property the interpolation needs. Refuse the shape, then
 * quote anyway — belt and braces, because the goal is prose an agent may rewrite.
 */
const SHELL_SAFE = /^[\w@%+=:,./-]+$/;

export function refTip(ref) {
  const d3 = ref.lastIndexOf('...');
  if (d3 !== -1) return ref.slice(d3 + 3).trim();
  const d2 = ref.lastIndexOf('..');
  if (d2 !== -1) return ref.slice(d2 + 2).trim();
  return ref.trim();
}

/** Shape-only checks on `invocation.args`. Everything here is refused by qa.js one layer down. */
export function validateArgs(args) {
  if (!args || typeof args !== 'object') return 'the invocation carries no `args` object';
  const { ref, tree } = args;
  if (typeof ref !== 'string' || !ref) return '`args.ref` is missing';
  if (typeof tree !== 'string' || !tree) return '`args.tree` is missing';
  if (!path.isAbsolute(tree)) return `\`args.tree\` must be absolute, got "${tree}"`;
  if (!SHELL_SAFE.test(tree)) {
    return `\`args.tree\` contains characters this script will not interpolate into a command line: "${tree}"`;
  }
  if (!SHA40.test(refTip(ref))) {
    return `\`args.ref\` must be sha-tipped with a full 40-hex sha, got tip "${refTip(ref)}" — qa.js ` +
      'refuses a symbolic tip, an abbreviated one is ambiguous, and a verdict bound to a moving ' +
      'branch covers bytes the gate never saw';
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

/**
 * DISTRUST THE ROUTER. It ships in the PR (see PROVENANCE above) and this script cannot make it
 * otherwise, so its two load-bearing outputs are re-derived here with this process's own `git`
 * calls: the tree it named must BE the repo under review, and the ref tip it named must BE that
 * repo's HEAD. A router that redirects either one would have the panel review a different subject
 * and record a verdict that binds somewhere else.
 */
export function crossCheckArgs({ repo, args }) {
  if (canonical(args.tree) !== canonical(repo)) {
    return `the router named tree ${args.tree}, which is not the repository under review (${repo}).`;
  }
  let head;
  try {
    head = git(repo, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
  } catch (e) {
    return `could not read HEAD in ${repo} to check the router's ref: ${firstLine(e)}`;
  }
  const tip = refTip(args.ref);
  if (tip !== head) {
    return `the router named tip ${tip}, but ${repo} is at HEAD ${head}. The panel would review a different commit than the one this run is about.`;
  }
  return null;
}

// ── the judging project ──────────────────────────────────────────────────────────────────────

/** `git archive` into `dest`. No shell: `-o` writes the tar, `tar -xf` reads it back. */
function defaultExtract({ repo, gitRef, dest }) {
  const tar = path.join(dest, `.judge-${process.pid}.tar`);
  git(repo, ['archive', '--format=tar', '-o', tar, gitRef]);
  execFileSync('tar', ['-xf', tar, '-C', dest], { stdio: ['ignore', 'pipe', 'pipe'] });
  fs.rmSync(tar, { force: true });
}

/**
 * Materialise the WHOLE tree at `gitRef` as the project the gate session runs in, then verify it
 * by reading the bytes back.
 *
 * WHY THE WHOLE TREE AND NOT `.claude/workflows/**`. That was the first design and it produced two
 * HIGH findings at once. `qa.js` dispatches `reviewer` and `reviewer-readonly`; neither resolves at
 * project scope in a directory holding only workflows, and neither exists at user scope either
 * (measured: 30+ files in `~/.claude/agents/`, neither among them). So the panel either errors or
 * falls back to `general-purpose` with tools `*` — and the second branch hands `Write` and `Edit`
 * to the judge whose verdict binds. A curated path list has the same failure waiting behind the
 * next thing `qa.js` reaches for; the tree does not.
 *
 * `extract` is a seam and exists ONLY so a test can express the failure this verification is for:
 * a materialisation that reports success and does not land, or lands the wrong bytes. Without it
 * the read-back is unfalsifiable, and a guard nothing can break is a guard someone deletes.
 *
 * Returns `{ ok: true, dir, verdictBin, files }` or `{ ok: false, reason }`.
 */
export function materialiseJudgeProject({
  repo,
  dest,
  gitRef = 'origin/main',
  workTree = null,
  extract = defaultExtract,
}) {
  if (workTree && isInside(dest, workTree)) {
    return {
      ok: false,
      reason:
        `the judging project ${dest} is inside the work tree ${workTree}. That pollutes the tree under ` +
        'review, moves the subject the moment anyone stages it, and puts main\'s copy of everything ' +
        'inside the PR\'s own directory — the provenance confusion this whole design exists to prevent.',
    };
  }

  let listed;
  try {
    listed = git(repo, ['ls-tree', '-r', '--name-only', gitRef]);
  } catch (e) {
    return { ok: false, reason: `cannot list the tree at ${gitRef}: ${firstLine(e)}` };
  }
  const expected = listed.split('\n').map((s) => s.trim()).filter(Boolean);

  // POSITIVE CONTROL ON THE INPUT ARM. An empty or truncated listing is what a denied or misaimed
  // `git ls-tree` looks like, and it would produce an empty judging project that then fails for a
  // reason naming the wrong thing. None of these can be absent from a real listing of this repo.
  const missingFromListing = CRITICAL_PATHS.filter((p) => !expected.includes(p));
  if (missingFromListing.length) {
    return {
      ok: false,
      reason: `${gitRef} lists ${expected.length} path(s) and does not contain ${missingFromListing.join(', ')} — that is not a listing of a harness tree.`,
    };
  }

  try {
    extract({ repo, gitRef, dest });
  } catch (e) {
    return { ok: false, reason: `could not materialise ${gitRef} into ${dest}: ${firstLine(e)}` };
  }

  // COMPLETENESS. Every blob the ref declares must be on disk. This is what makes the project
  // viable rather than merely present, and it is the check that would have caught the missing
  // agent definitions.
  const absent = expected.filter((rel) => !fs.existsSync(path.join(dest, rel)));
  if (absent.length) {
    return {
      ok: false,
      reason: `${absent.length} of ${expected.length} path(s) from ${gitRef} are missing after materialisation, including ${absent.slice(0, 3).join(', ')}`,
    };
  }

  // IDENTITY, on the files that decide the verdict. Read the bytes back and hash them the way git
  // hashed the source — not the extractor's exit code, not a flag we set ourselves.
  for (const rel of CRITICAL_PATHS) {
    let want;
    let got;
    try {
      want = git(repo, ['rev-parse', `${gitRef}:${rel}`]).trim();
      got = git(repo, ['hash-object', path.join(dest, rel)]).trim();
    } catch (e) {
      return { ok: false, reason: `cannot verify ${rel} after materialisation: ${firstLine(e)}` };
    }
    if (want !== got) {
      return {
        ok: false,
        reason: `${rel} does not match ${gitRef} after materialisation (${gitRef} ${want.slice(0, 12)}… vs on disk ${got.slice(0, 12)}…)`,
      };
    }
  }

  return {
    ok: true,
    dir: dest,
    // The artifact is read with the JUDGE's checker, never with this script's neighbour. This one
    // field is the fix for A1's demonstrated exploit.
    verdictBin: path.join(dest, 'scripts', 'verdict.mjs'),
    files: expected.length,
  };
}

// ── the artifact, which is the only thing that decides ───────────────────────────────────────

/**
 * `verdict.mjs check` against the work tree, mapped onto the terminal states.
 *
 * `verdictBin` is REQUIRED and is expected to be the judge's copy. `verdict.mjs` takes `--repo` and
 * reads its tier map from where it lives, so a main-provenance copy judging a PR tree is its
 * designed contract.
 *
 * The mapping is deliberately unbalanced. `ok` is the ONLY route to PRODUCED. BLOCKED requires a
 * record that binds this exact subject AND spells `BLOCK`. Everything else — absent, unparseable,
 * subject-mismatch, tier-drift, an unreadable payload, an unrecognised verdict string — is REFUSED.
 * An unknown value must never drift into "the panel found defects" any more than into "it passed".
 */
export function readVerdictArtifact({ tree, ref, verdictBin, runner = null }) {
  const argv = [verdictBin, 'check', '--repo', tree, '--ref', ref, '--json'];
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

// ── the gate session ─────────────────────────────────────────────────────────────────────────

/** POSIX single-quoting. The goal is prose that an agent will paste into a shell. */
export function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

export function buildGoal({ scriptPath, args, verdictBin }) {
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
    '3. Record that verdict into the tree under review, using THIS checker and no other:',
    `     node ${shellQuote(verdictBin)} record \\`,
    `       --repo ${shellQuote(args.tree)} --ref ${shellQuote(tip)} \\`,
    '       --verdict <PASS|BLOCK|REFUSED> --by produce-verdict --evidence "<the workflow summary>"',
    `   then commit it in ${shellQuote(args.tree)}:`,
    '     git add .qa/verdicts && git commit -m "qa(verdict): <verdict>"',
    '',
    'Record what the workflow actually returned. REFUSED is a real verdict and means nothing was',
    'established; do not spell it as BLOCK and never as PASS. If the workflow did not complete,',
    'record nothing at all — an absent record is read as a refusal, which is the truth.',
  ].join('\n');
}

// ── the pipeline ─────────────────────────────────────────────────────────────────────────────

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

  // ONLY `invocation`, and below it `invocation.args`. No top-level field is read — the router's
  // top-level `tip` is symbolic where `invocation.args.ref` is sha-pinned, and the two disagree on
  // any explicit symbolic `--ref`.
  const invocation = route.decision.invocation;
  if (invocation === null || invocation === undefined) {
    return result(OUTCOME.NOT_REQUIRED, 'the router emitted no invocation, so this diff does not need the gate');
  }

  const args = invocation.args;
  const bad = validateArgs(args);
  if (bad) return result(OUTCOME.REFUSED, `the invocation is unusable: ${bad}`);

  const disagrees = (deps.crossCheckArgs ?? crossCheckArgs)({ repo, args });
  if (disagrees) return result(OUTCOME.REFUSED, `the router's invocation does not describe this run: ${disagrees}`);

  const tip = refTip(args.ref);

  // MATERIALISE BEFORE THE PRE-CHECK. The pre-check is what decides whether to skip a 40-minute
  // panel run, so it must be made with the judge's checker like every other read — doing it with
  // this script's neighbour is precisely the A1 exploit, where a hostile in-tree `verdict.mjs`
  // reported `{"ok":true}` and SUPPRESSED the run that could have contradicted it.
  const dir = judgeDir ?? fs.mkdtempSync(path.join(canonical(os.tmpdir()), 'qa-judge-'));
  const judge = (deps.materialiseJudgeProject ?? materialiseJudgeProject)({
    repo, dest: dir, gitRef, workTree: args.tree,
  });
  if (!judge.ok) {
    return result(OUTCOME.REFUSED, `could not materialise the judging project from ${gitRef}: ${judge.reason}`, {
      judgeDir: dir, launched: false, args,
    });
  }

  const read = () => (deps.readVerdictArtifact ?? readVerdictArtifact)({
    tree: args.tree, ref: tip, verdictBin: judge.verdictBin, runner: deps.verdictRunner ?? null,
  });

  // COST. A full panel run has measured 2.5–3.8M tokens and 40–50 minutes. The subject is a hash of
  // the reviewed bytes, so a verdict that already binds is a verdict for THIS diff and re-running
  // buys nothing at that price.
  const pre = read();
  if (pre.outcome === OUTCOME.PRODUCED || pre.outcome === OUTCOME.BLOCKED) {
    return { ...pre, launched: false, preexisting: true, judgeDir: dir, args };
  }

  const goal = buildGoal({
    scriptPath: invocation.scriptPath ?? `${WORKFLOW_DIR}/qa.js`,
    args,
    verdictBin: judge.verdictBin,
  });
  const argv = [...launcher, '--print', goal];

  if (dryRun) {
    return result(OUTCOME.REFUSED, 'dry run — the gate was prepared and deliberately not launched, so nothing is established', {
      judgeDir: dir, judgeFiles: judge.files, launched: false, argv, goal, args,
    });
  }

  const spawner = deps.launch ?? ((a, opts) => spawnSync(a[0], a.slice(1), opts));
  const run = spawner(argv, { cwd: dir, encoding: 'utf8', timeout: timeoutMs });

  if (run.error) {
    return result(OUTCOME.REFUSED, `the gate session could not be launched: ${String(run.error.message ?? run.error)}`, {
      judgeDir: dir, launched: false, args,
    });
  }

  // THE LAUNCHER'S OUTPUT IS A DIAGNOSTIC AND IS NEVER THE DECISION.
  const post = read();

  return {
    ...post,
    launched: true,
    preexisting: false,
    judgeDir: dir,
    judgeFiles: judge.files,
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
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('-') ? process.argv[i + 1] : fallback;
}

const KNOWN = new Set(['--json', '--dry-run', '--repo', '--judge-dir', '--launcher', '--timeout', '--git-ref', '--help']);
const TAKES_VALUE = new Set(['--repo', '--judge-dir', '--launcher', '--timeout', '--git-ref']);

function main() {
  // AN UNKNOWN FLAG IS REFUSED, never dropped — and the test is a leading `-`, not a leading `--`.
  // Screening on `--` let `-json` through in silence, which is the same direction #116 closed on
  // `verdict.mjs`: the operator typed something whose whole purpose was to change behaviour, and
  // nothing changed and nothing said so.
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('-')) continue;
    if (!KNOWN.has(a)) {
      process.stderr.write(`produce-verdict: unknown flag "${a}". Known: ${[...KNOWN].join(' ')}\n`);
      return EXIT[OUTCOME.REFUSED];
    }
    if (TAKES_VALUE.has(a)) i += 1; // its value is not a flag, whatever it looks like
  }
  if (flag('--help')) {
    process.stdout.write(
      'usage: produce-verdict.mjs [--repo P] [--dry-run] [--json] [--judge-dir D] [--launcher BIN] [--timeout MS] [--git-ref R]\n' +
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
    if (r.judgeDir) process.stdout.write(`  judge project: ${r.judgeDir}\n`);
    if (r.subject) process.stdout.write(`  subject:       ${String(r.subject).slice(0, 16)}…\n`);
  }
  return EXIT[r.outcome];
}

if (process.argv[1] && canonical(process.argv[1]) === canonical(fileURLToPath(import.meta.url))) {
  process.exitCode = main();
}
