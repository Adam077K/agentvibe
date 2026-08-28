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
// ═════════════════════════════════════════════════════════════════════════════════════════════
// WHAT THIS CLAIMS, STATED BEFORE THE MECHANISM RATHER THAN INFERRED FROM IT
// ═════════════════════════════════════════════════════════════════════════════════════════════
//
// A run of this script gates THE TREE IT SHIPS IN, at that tree's HEAD, and reports one of four
// terminal states computed from a verdict record read with `main`'s checker. It claims nothing
// about any other tree, and it refuses rather than answering about one.
//
// THE STATEMENT THIS FILE COULD HONESTLY HAVE MADE BEFORE, AND WHY IT IS NOT THE ONE HERE. A
// review with a real recorder measured that every launch-path outcome was REFUSED: `tip` was
// frozen pre-launch, the session recorded and committed, and the post-check looked at the pinned
// tip where the record could not be. PRODUCED closed only on a SECOND invocation, through the
// pre-check. So the true sentence was *"this produces a verdict only on a second invocation"* —
// and nobody had written it, which made the second run luck rather than design. Writing it down is
// what showed the pinned-tip post-check to be INCIDENTAL rather than load-bearing: the binding
// lives in the SUBJECT, not in the ref, so reading at the post-launch HEAD and requiring the
// subject to match gives the same guarantee and closes the loop in one invocation. The pin is kept
// for the pre-check, where it is exactly right.
//
// STILL NOT CLAIMED, and neither is fixed by anything below:
//   · the record is HASH-BOUND, NOT SIGNED. Anyone with repo-write can author one. This script
//     narrows *which* record counts; it cannot make one unforgeable.
//   · the end-to-end panel has never been driven through this mechanism. Whether the runtime
//     accepts a materialised tree as a project is UNMEASURED.
//   · nothing in CI or `npm run check` invokes this script. Only its unit tests run. It is a tool
//     a human or `consume-dispatch.ts` calls, and no caller is wired yet.
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
import { createRequire } from 'node:module';
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

export const VERDICT_DIR = '.qa/verdicts';

export const WORKFLOW_DIR = '.claude/workflows';

/**
 * THE REF THE JUDGE COMES FROM. A CONSTANT, AND THE OPERATOR CANNOT CHOOSE IT.
 *
 * `--git-ref` used to select this, unvalidated. That restored the original provenance exploit
 * verbatim through a flag: every guard in `materialiseJudgeProject` — completeness AND identity —
 * is measured *against the ref you name*, so naming the PR's own HEAD makes all of them pass
 * tautologically and the judge becomes the tree under review. Measured: `--git-ref HEAD` against a
 * fixture whose HEAD ships a one-line `verdict.mjs` printing `{"ok":true}` → EXIT 0, PRODUCED,
 * launched=false, asserting a record that does not exist.
 *
 * The instance before this one was `--repo`, removed for the WEAKER version of the same problem —
 * it chose the subject; this chose the judge. Deleting one and leaving the other is why this is a
 * constant now rather than a validated flag: a validated flag is another instance, and the class is
 * "an operator-supplied value that selects what gets MEASURED rather than what gets REPORTED."
 * `FLAG_ROLES` below makes that class checkable instead of remembered.
 *
 * `materialiseJudgeProject` keeps a `gitRef` parameter because it is the MECHANISM and its own
 * tests need to point it at fixture refs. This constant is the POLICY, and policy is not a knob.
 */
/**
 * NAMED RESIDUAL, not fixed here. `origin/main` is symbolic, and git resolves `refs/heads/origin/main`
 * ahead of `refs/remotes/origin/main`, so someone able to WRITE A REF in the repo under review could
 * shadow it and choose the judge that way. It needs ref-write in the tree being reviewed, which is
 * outside this file's threat model — the same place "hash-bound, not signed" already sits — and it
 * predates these rounds in the materialisation path. Recorded so the next reader meets it as a
 * decision rather than as an oversight.
 */
export const JUDGE_REF = 'origin/main';

/** The gate. Re-derived, never taken from the invocation — see INVOCATION_TREATMENT. */
export const QA_SCRIPT = '.claude/workflows/qa.js';

/** The only keys the invocation may carry in `args`. Anything else is refused, not forwarded. */
export const ARGS_KEYS = ['ref', 'tier', 'tree'];

/**
 * ── WHAT THE INVOCATION ASSERTS, AND WHAT THIS FILE DOES ABOUT EACH ─────────────────────────
 *
 * `crossCheckArgs` said "DISTRUST THE ROUTER — its two load-bearing outputs are re-derived here."
 * The invocation carried FOUR and it re-derived TWO; the ref's base and the tier went unchecked, and
 * a router emitting an honest tip with a dishonest base handed the panel an empty range while the
 * verdict bound a real diff. The count was in an object literal three lines from that sentence.
 *
 * So the count is not a sentence any more. Every field the invocation carries is declared here with
 * what happens to it, `trusted` is forbidden, and `produce-verdict.test.mjs` fails on a field with
 * no entry. This is `FLAG_ROLES` pointed at the other input: the flags were what the OPERATOR
 * supplies, these are what the ROUTER asserts, and both were closed one instance at a time until a
 * registry made the class checkable.
 *
 * WRITING THIS DOWN FOUND TWO MORE, which is the argument for registries over fixes:
 *   · `scriptPath` was taken from the invocation. It selects WHICH WORKFLOW the judge session runs
 *     — a different gate, or none. The judging project holds only main's files so it could not
 *     select hostile CODE, but "which gate runs" is not the router's to choose any more than "which
 *     tree is judged" was. Re-derived from QA_SCRIPT.
 *   · `args` was forwarded whole, so keys beyond the three declared ones reached qa.js verbatim
 *     through the goal. `.claude/gates.yml` asks for `invocation.args` UNMODIFIED and that is
 *     honoured — unmodified means the VALUES are not rewritten, not that unknown keys are accepted.
 *     A fourth argument arriving is a deliberate act now, and it fails loudly rather than passing
 *     through unread.
 */
export const INVOCATION_TREATMENT = {
  'invocation.tool': 'unread',
  'invocation.scriptPath': 're-derived',
  'invocation.args.ref': 're-derived',
  'invocation.args.tier': 're-derived',
  'invocation.args.tree': 're-derived',
};
export const FORBIDDEN_TREATMENT = 'trusted';

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

/**
 * A range split into the three things that decide what gets reviewed. `refTip` used to be the only
 * one of these this file could see, which is how a dishonest BASE walked past a guard that calls
 * itself distrustful — see crossCheckArgs().
 */
export function refParts(ref) {
  const d3 = ref.lastIndexOf('...');
  if (d3 !== -1) return { base: ref.slice(0, d3), sep: '...', tip: ref.slice(d3 + 3).trim() };
  const d2 = ref.lastIndexOf('..');
  if (d2 !== -1) return { base: ref.slice(0, d2), sep: '..', tip: ref.slice(d2 + 2).trim() };
  return { base: null, sep: null, tip: ref.trim() };
}

export function refTip(ref) {
  return refParts(ref).tip;
}

/** Shape-only checks on `invocation.args`. Everything here is refused by qa.js one layer down. */
export function validateArgs(args) {
  if (!args || typeof args !== 'object') return 'the invocation carries no `args` object';
  // DECLARE WHAT IS READ AND REFUSE THE REST, at the KEY rather than at the value. An unknown key
  // was forwarded verbatim into the goal and thence to qa.js, unread by anything here.
  const extra = Object.keys(args).filter((k) => !ARGS_KEYS.includes(k));
  if (extra.length) {
    return `the invocation carries args this script does not know: ${extra.join(', ')}. It forwards ` +
      `exactly ${ARGS_KEYS.join(', ')}, and a fourth argument is a deliberate change rather than a pass-through.`;
  }
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
export function crossCheckArgs({ repo, args, harnessRoot = HARNESS_ROOT }) {
  // ── THE INVOCATION CARRIES FOUR LOAD-BEARING THINGS AND THIS USED TO RE-DERIVE TWO ──────────
  //
  // The comment above said "its two load-bearing outputs are re-derived here", and it was accurate
  // about what the code did and wrong about what the invocation carries. `tree` and the ref's TIP
  // were checked; the ref's BASE and `tier` were not. A router shipping in the PR — the exact
  // adversary this function names — emits an honest tip and a dishonest base (`<S2>...<S2>`), and
  // the panel is then handed an EMPTY RANGE while the verdict it produces binds a real diff.
  // Measured: EXIT 0, PRODUCED. Redirecting the TIP instead is correctly refused, so the tip arm
  // worked and the base arm was simply unguarded.
  //
  // #124's `verdictRef` field exists for exactly this and the hostile router emits it TRUTHFULLY.
  // It is deliberately not read: consuming a field the router computes is the trust this function
  // exists to withhold, and the field is only safe when the router is. The base is re-derived here
  // instead, from the same `args.ref` the tip comes from, which is the treatment the tip already got.
  //
  // The base must be `JUDGE_REF` and the separator must be `...`. Those are not arbitrary: the
  // diff under review is defined against the same ref the judge is materialised from, so a base
  // that is anything else reviews a range nobody agreed to, and `..` silently means a different
  // range than `...` does.
  const { base, sep } = refParts(args.ref);
  if (sep !== '...') {
    return `the router's ref "${args.ref}" is not a three-dot range. ".." and "..." name different ranges and only one of them is the diff this gate is about.`;
  }
  if (base !== JUDGE_REF) {
    return `the router's ref is based on "${base}", not ${JUDGE_REF}. The reviewed range must be defined against the same ref the judge comes from, or the panel reviews a range nobody agreed to — an empty one, if the base equals the tip.`;
  }

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

  // ── AND THE TIER, which decides how deep the panel goes ─────────────────────────────────────
  //
  // Re-derived from the same classifier the router used, over the range this function has just
  // established. BE EXACT ABOUT WHAT THIS BUYS: the classifier and the tier map both ship in the
  // PR, so this catches a router that disagrees with its own tree — an inconsistent adversary —
  // and not one that corrupts both consistently. The tier that BINDS is not this one: `verdict.mjs`
  // computes it at record time and again at check time from the JUDGE's tier map, which is main's.
  // This guard is about the panel's depth, not about the binding.
  try {
    const { loadRules, classifyFiles } = createRequire(import.meta.url)(path.join(harnessRoot, 'scripts', 'lib', 'classifier.js'));
    const files = git(repo, ['diff', '--name-only', args.ref]).split('\n').map((x) => x.trim()).filter(Boolean);
    const floor = classifyFiles(files, loadRules(path.join(harnessRoot, '.claude', 'qa-tier-floor.yml'))).floor.tier;
    if (args.tier !== floor) {
      return `the router named tier "${args.tier}" for a diff this tree classifies as "${floor}". A tier the router chose rather than derived decides how deep the panel goes.`;
    }
  } catch (e) {
    return `could not re-derive the tier for ${args.ref}: ${firstLine(e)}`;
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
// EVERY RUN MATERIALISED A FULL TREE AND NOTHING EVER REMOVED IT. Twenty-five complete copies
// accumulated in one reviewer's $TMPDIR in a single session, each a whole checkout of the judging
// project. This removes the ones WE created, at process exit.
//
// WHAT THIS DOES NOT COVER, STATED RATHER THAN DISCOVERED. `process.on('exit')` and the signal
// handlers below run for a normal return, a thrown exception, and an operator's Ctrl-C. They do
// NOT run for SIGKILL, for a harness that kills this process group on a timeout, or for a power
// loss — and a gate session is exactly the long-running thing a timeout reaches first. So this
// bounds the leak, it does not eliminate it: the honest claim is "one directory per hard-killed
// run" instead of "one per run". A `finally` would have been weaker still, because it does not
// survive a signal at all.
//
// AN OPERATOR'S --judge-dir IS NEVER REMOVED. Naming a directory is how someone asks to keep the
// tree, and deleting a path the caller chose would destroy evidence they asked for. Only the
// mkdtemp path is ours to reclaim. `QA_KEEP_JUDGE_DIR=1` keeps ours too, for diagnosing a REFUSED
// run whose whole explanation is in the materialised tree.
const EPHEMERAL_JUDGE_DIRS = new Set();
let judgeDirCleanupArmed = false;

// DECLARE WHAT IS UNDERSTOOD AND REFUSE THE REST — the same posture `verdict.mjs` takes on its
// ceiling, and this knob had the opposite one. Bare truthiness meant `0`, `false`, `no` and `off`
// ALL SELECTED KEEP: an operator disabling the knob turned it on. Two knobs, one change, opposite
// postures, with the argument for the right one written down beside the wrong one.
const KEEP_TRUE = new Set(['1', 'true', 'yes', 'on']);
const KEEP_FALSE = new Set(['', '0', 'false', 'no', 'off']);

/** true=keep · false=reclaim · null=unrecognised, which the caller must refuse rather than guess. */
export function keepJudgeDirSetting(env = process.env) {
  const raw = env.QA_KEEP_JUDGE_DIR;
  if (raw === undefined) return false;
  const v = String(raw).trim().toLowerCase();
  if (KEEP_TRUE.has(v)) return true;
  if (KEEP_FALSE.has(v)) return false;
  return null;
}

/** Remove every judge project this process created. Safe to call twice; never throws. */
export function sweepJudgeDirs() {
  for (const d of EPHEMERAL_JUDGE_DIRS) {
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {
      // A directory we cannot remove is not a reason to fail a run that already has its answer.
    }
  }
  EPHEMERAL_JUDGE_DIRS.clear();
}

/** Register `dir` for removal at exit, unless the operator asked to keep it. */
export function armJudgeDirCleanup(dir, env = process.env) {
  if (keepJudgeDirSetting(env) !== false) return false;
  EPHEMERAL_JUDGE_DIRS.add(dir);
  if (!judgeDirCleanupArmed) {
    judgeDirCleanupArmed = true;
    // `exit` ONLY. This is an exported function a host calls IN-PROCESS — produce-verdict.test.mjs
    // already does — and the previous version installed process-global SIGINT/SIGTERM/SIGHUP
    // handlers that called process.exit(130). Measured with a must-not-fire control: armed -> wait
    // status 130 and NO signal, unarmed -> 143. So TERM and HUP came back as SIGINT's code, an
    // ordinary exit where there had been a signal, and 130 is outside this file's own vocabulary
    // (0·1·2·3·64). A library that reclaims a temp directory may not decide how its host dies.
    // Signal handling belongs to the process owner; see the CLI entry point at the foot of this file.
    process.on('exit', sweepJudgeDirs);
  }
  return true;
}

/**
 * Is `dir` one this process registered for removal?
 *
 * Exported so a test can assert the COMPOSITION and not merely the primitives. Asserting that
 * `armJudgeDirCleanup` and `sweepJudgeDirs` behave leaves the sharpest mutation uncaught: inverting
 * the `ephemeral` predicate at the CALL SITE arms an operator's own `--judge-dir` and spares the
 * temp directory, and every unit cell still passes because each unit still does exactly what it
 * says. That is the misdirected-assertion class — an assertion that runs, passes, and is satisfied
 * by a different occurrence than the one it names.
 */
export function isJudgeDirTracked(dir) {
  return EPHEMERAL_JUDGE_DIRS.has(dir);
}

/** Stop tracking `dir`, so the exit sweep leaves it alone. Used where the tree IS the evidence. */
export function disarmJudgeDirCleanup(dir) {
  return EPHEMERAL_JUDGE_DIRS.delete(dir);
}

/** Remove `dir` now, but only if it is one we created. Never touches an operator's --judge-dir. */
export function reclaimJudgeDir(dir) {
  if (!EPHEMERAL_JUDGE_DIRS.delete(dir)) return false;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Not a reason to fail a run that already has its answer.
  }
  return true;
}

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
    // STDERR IS WHERE THE REASON IS, AND IT WAS DISCARDED. `verdict.mjs` writes its refusals to
    // stderr and exits non-zero with stdout EMPTY, so this evidence read {exit: 2, stdout: ""} —
    // a record of a failure with the cause deleted. Measured against a 1.5 MB diff: the cause was
    // an unreadable subject and nothing downstream could say so.
    return result(OUTCOME.REFUSED, `verdict.mjs check produced no readable JSON (exit ${r.status})`, {
      verdict_check: {
        exit: r.status,
        stdout: (r.stdout || '').slice(0, 400),
        stderr: (r.stderr || '').slice(0, 400),
      },
    });
  }

  const common = { subject: payload.subject ?? null, tier: payload.tier ?? null, verdict_reason: payload.reason };

  if (payload.ok) {
    // RULE 10, AND THE CHECKER GETS THE LAST WORD ON ITSELF. `ok:true` was honoured at any exit
    // code, so a checker printing a pass and then exiting 2 was read as a pass — a resolver
    // reporting that it checked when it said it could not. It is also what made the provenance
    // exploit need only ANY hostile checker rather than a well-formed one.
    if (r.status !== 0) {
      return result(
        OUTCOME.REFUSED,
        `verdict.mjs printed ok:true and then exited ${r.status}. A checker that reports failure has ` +
        'not passed anything, whatever its stdout says.',
        { ...common, verdict_check: { exit: r.status } },
      );
    }
    return result(OUTCOME.PRODUCED, 'a verdict record is committed, binds this exact diff, and reads PASS', common);
  }

  if (payload.reason === 'not-pass') {
    const m = /^verdict=(\S+)$/.exec(String(payload.detail ?? '').trim());
    const recorded = m ? m[1] : null;
    // `FAIL` AND `BLOCK` BOTH MEAN BLOCKED, and `FAIL` is the only one that can actually arrive.
    // `verdict.mjs record` refuses anything but PASS or FAIL (`--verdict must be PASS or FAIL`),
    // so a run that matched only the literal 'BLOCK' had an unreachable BLOCKED branch: a
    // correctly-bound FAIL — the panel ran and found defects — read as "establishes nothing". That
    // is this file's own argument against #115, mirrored. `BLOCK` is kept because a hand-written
    // record can carry it and because qa.js's own vocabulary uses it.
    if (recorded === 'BLOCK' || recorded === 'FAIL') {
      return result(OUTCOME.BLOCKED, `the panel ran and its verdict, bound to this exact diff, is ${recorded}`, common);
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
    '       --verdict <PASS|FAIL> --by produce-verdict --evidence "<the workflow summary>"',
    `   then commit it in ${shellQuote(args.tree)}:`,
    '     git add .qa/verdicts && git commit -m "qa(verdict): <verdict>"',
    '',
    'PASS only if the workflow passed. FAIL if it BLOCKed — that is the recorder\'s spelling of a',
    'block, and `record` refuses any other word.',
    '',
    'If the workflow REFUSED, or did not complete, RECORD NOTHING AT ALL. There is no third value',
    'to write: an absent record is read as a refusal, which is the truth. Never record PASS for a',
    'run that established nothing.',
  ].join('\n');
}

// ── the pipeline ─────────────────────────────────────────────────────────────────────────────

/**
 * A REFUSED RUN KEEPS ITS TREE; EVERY OTHER OUTCOME RECLAIMS IT.
 *
 * `--dry-run`'s entire product IS the prepared tree, and it printed `judge project: <path>` for a
 * directory already deleted — the named cure had to be set before you knew you needed it. The
 * materialise-failure and launch-failure branches pointed at nothing for the same reason. All three
 * return REFUSED, so ONE predicate covers them, and it lives at a single exit point rather than at
 * six return sites: a REFUSED branch added later inherits the right behaviour instead of silently
 * deleting the evidence it just named. A deletion attracts no test cases; a structural rule does
 * not need them at every site.
 *
 * WHAT THIS STILL DOES NOT DO, and it is the honest half: a session that REFUSES many times keeps
 * many trees. That is deliberate — on a refusal the tree is the only account of what happened — but
 * it means the 25-copy symptom is fully cured only for runs that reach an answer. `QA_KEEP_JUDGE_DIR`
 * governs the rest, and an operator's own `--judge-dir` is never touched by any path here.
 */
export function produceVerdict(o = {}) {
  const keep = keepJudgeDirSetting(o.env ?? process.env);
  if (keep === null) {
    return result(OUTCOME.REFUSED, `QA_KEEP_JUDGE_DIR="${(o.env ?? process.env).QA_KEEP_JUDGE_DIR}" is not a recognised on/off value. Refusing rather than guessing whether to delete a tree.`);
  }
  const r = runProduceVerdict(o);
  if (r && r.judgeDir) {
    if (r.outcome === OUTCOME.REFUSED) disarmJudgeDirCleanup(r.judgeDir);
    else reclaimJudgeDir(r.judgeDir);
  }
  return r;
}

function runProduceVerdict(o = {}) {
  const {
    repo = process.cwd(),
    harnessRoot = HARNESS_ROOT,
    dryRun = false,
    judgeDir = null,
    launcher = ['claude'],
    timeoutMs = 60 * 60 * 1000,
    deps = {},
  } = o;
  // Not a parameter. See JUDGE_REF.
  const gitRef = JUDGE_REF;

  // ── F-1 · THE TREE THAT GETS ROUTED IS THE ONE `run-gate.mjs` LIVES IN, AND NOTHING ELSE ───
  //
  // `run-gate.mjs` sets `REPO_ROOT = path.resolve(HERE, '..')` and uses it as the cwd of every git
  // call it makes. It reads NO repo flag — grepped: 0 hits, against 4 and 5 for the two flags it
  // does read, as controls — and the `cwd` this script passes to the spawn is therefore inert. So
  // `repo` selected the object store the judging project was materialised from, and never the tree
  // that was routed, validated or gated. A review measured the consequence from a working tree
  // sitting at `origin/main`, the posture this file's own header recommends: naming a tier-full
  // tree returned exit 3 NOT_REQUIRED, an answer about the empty diff of a DIFFERENT tree.
  //
  // The CLI flag is gone rather than fixed, because fixing it means teaching `run-gate.mjs` to
  // honour a repo argument and that file is not this lane's. Programmatic callers are refused
  // loudly instead of being quietly answered about the wrong tree.
  if (canonical(repo) !== canonical(harnessRoot)) {
    return result(
      OUTCOME.REFUSED,
      `this script can only gate the tree it ships in. It was asked about ${repo}, but run-gate.mjs ` +
      `resolves its own location (${harnessRoot}) and reads no repo argument, so the routing decision ` +
      'would describe a different tree than the one you named.',
    );
  }

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

  const disagrees = (deps.crossCheckArgs ?? crossCheckArgs)({ repo, args, harnessRoot });
  if (disagrees) return result(OUTCOME.REFUSED, `the router's invocation does not describe this run: ${disagrees}`);

  const tip = refTip(args.ref);

  // MATERIALISE BEFORE THE PRE-CHECK. The pre-check is what decides whether to skip a 40-minute
  // panel run, so it must be made with the judge's checker like every other read — doing it with
  // this script's neighbour is precisely the A1 exploit, where a hostile in-tree `verdict.mjs`
  // reported `{"ok":true}` and SUPPRESSED the run that could have contradicted it.
  // CANONICALISE EITHER WAY. The default path already went through canonical(); an operator's did
  // not, so `/tmp/x` vs `/private/tmp/x` made `verdict.mjs`'s self-invocation guard compare unequal
  // — the judge's checker then defines everything and returns without running main(), which is
  // fail-closed but permanently unable to produce while reporting it as a checker defect.
  // Ours to reclaim only when we made it; see armJudgeDirCleanup for what exit-time removal misses.
  const ephemeral = judgeDir === null || judgeDir === undefined;
  const dir = canonical(judgeDir ?? fs.mkdtempSync(path.join(canonical(os.tmpdir()), 'qa-judge-')));
  if (ephemeral) armJudgeDirCleanup(dir);
  const judge = (deps.materialiseJudgeProject ?? materialiseJudgeProject)({
    repo, dest: dir, gitRef, workTree: args.tree,
  });
  if (!judge.ok) {
    return result(OUTCOME.REFUSED, `could not materialise the judging project from ${gitRef}: ${judge.reason}`, {
      judgeDir: dir, launched: false, args,
    });
  }

  const read = (ref) => (deps.readVerdictArtifact ?? readVerdictArtifact)({
    tree: args.tree, ref, verdictBin: judge.verdictBin, runner: deps.verdictRunner ?? null,
  });

  // COST. A full panel run has measured 2.5–3.8M tokens and 40–50 minutes. The subject is a hash of
  // the reviewed bytes, so a verdict that already binds is a verdict for THIS diff and re-running
  // buys nothing at that price.
  const pre = read(tip);
  // A DRY RUN MAY NOT REPORT PRODUCED, AND THIS IS THE FILE'S OWN ARGUMENT TURNED ON ITSELF.
  // The cost short-circuit returned `{...pre}` before the dry-run branch was reached, so
  // `--dry-run` against a diff whose verdict already binds exited 0 as PRODUCED — a SECOND route
  // to the code this file spends a paragraph establishing as the single route to "a verdict exists
  // and binds", and a direct contradiction of the dry-run branch's own message that nothing was
  // established. The finding it would have reported is not lost: it rides on `would_be`.
  if (!dryRun && (pre.outcome === OUTCOME.PRODUCED || pre.outcome === OUTCOME.BLOCKED)) {
    return { ...pre, launched: false, preexisting: true, judgeDir: dir, args };
  }

  const goal = buildGoal({
    // NOT `invocation.scriptPath`. Which gate runs is not the router's to choose.
    scriptPath: QA_SCRIPT,
    args,
    verdictBin: judge.verdictBin,
  });
  const argv = [...launcher, '--print', goal];

  if (dryRun) {
    return result(OUTCOME.REFUSED, 'dry run — the gate was prepared and deliberately not launched, so nothing is established', {
      judgeDir: dir, judgeFiles: judge.files, launched: false, argv, goal, args,
      // What a real run would have reported. A diagnostic, never a terminal state: reading this as
      // the outcome is the mistake the outcome field exists to prevent.
      would_be: pre.outcome,
    });
  }

  const spawner = deps.launch ?? ((a, opts) => spawnSync(a[0], a.slice(1), opts));
  const run = spawner(argv, { cwd: dir, encoding: 'utf8', timeout: timeoutMs });

  if (run.error) {
    return result(OUTCOME.REFUSED, `the gate session could not be launched: ${String(run.error.message ?? run.error)}`, {
      judgeDir: dir, launched: false, args,
    });
  }

  // ── THE POST-CHECK MUST LOOK WHERE THE RECORD CAN BE, NOT ONLY WHERE THE DIFF WAS ──────────
  //
  // `tip` is frozen from the router BEFORE the launch, and the session is told to `record` and then
  // `git commit`. That puts the record on a DESCENDANT of `tip`, where `git show <tip>:.qa/...`
  // cannot see it — so a post-check at `tip` alone is structurally identical to the pre-check:
  // same {tree, ref}, and recording cannot change either input. Measured by a review with a real
  // recorder: the record IS committed, `check` at the pinned tip says `absent`, `check` at the new
  // HEAD says `match`, and the run returned REFUSED. **PRODUCED was unreachable through a launch.**
  // It closed only on a SECOND invocation, via the pre-check — a mitigation nobody had written down,
  // which makes it luck rather than design.
  //
  // So read at the post-launch HEAD as well, and REQUIRE THE SUBJECT TO BE THE ONE REVIEWED. The
  // subject excludes `.qa/verdicts/*.json`, so committing the record cannot move it — which means
  // an equal subject proves the session added a verdict and nothing else, and an unequal one proves
  // it changed the reviewed bytes after they were reviewed. That second case is REFUSED, not
  // BLOCKED: a verdict about different bytes establishes nothing about these.
  //
  // THE LAUNCHER'S OUTPUT IS A DIAGNOSTIC AND IS NEVER THE DECISION.
  let newHead = null;
  try {
    newHead = git(args.tree, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
  } catch (e) {
    return result(OUTCOME.REFUSED, `could not read HEAD in ${args.tree} after the launch: ${firstLine(e)}`, {
      judgeDir: dir, launched: true, args,
    });
  }

  let post;
  if (newHead === tip) {
    // The session committed nothing. Reading at the tip is then the whole truth.
    post = read(tip);
  } else {
    // ── THE SUBJECT EQUALITY PROVES LESS THAN IT LOOKS, AND THE GAP IS THE FILE CLASS THAT
    // ── CARRIES MERGE AUTHORITY.
    //
    // This used to say an equal subject "proves the session added a verdict AND NOTHING ELSE".
    // False: `verdict.mjs`'s DIFF_PATHSPEC excludes `.qa/verdicts/*.json` from every subject, so a
    // session that records the verdict it was asked for AND ALSO commits forged PASS records for
    // subjects it never reviewed leaves the subject byte-identical. Measured: EXIT 0 PRODUCED with
    // three planted records committed; the negative control, a non-verdict commit, correctly
    // REFUSED. The guard fired; its SCOPE was the defect. A planted record is invisible to the tier
    // as well — `classify.mjs` floors `.qa/verdicts/<64hex>.json` at `lite` by default.
    //
    // So bound WHAT was committed, not only whether the subject moved: the session may add exactly
    // one path, and its basename must be the subject that was reviewed. Anything else is REFUSED.
    //
    // What this does NOT close, deliberately: an author who controls a future diff can plant a
    // record for it in some other commit. That is the already-recorded "the gate is not enforcement
    // against a determined author" — hash-bound, not signed — and it is not this check's job.
    const changed = git(args.tree, ['diff', '--name-only', `${tip}..${newHead}`])
      .split('\n').map((x) => x.trim()).filter(Boolean);
    const allowed = pre.subject ? [`${VERDICT_DIR}/${pre.subject}.json`] : [];
    if (changed.length !== 1 || changed[0] !== allowed[0]) {
      return result(
        OUTCOME.REFUSED,
        `the gate session committed ${changed.length} path(s) and may commit exactly one — ` +
        `${allowed[0] ?? '<no subject to bind to>'}. It changed: ${changed.slice(0, 5).join(', ') || '(nothing)'}. ` +
        'A session that writes anything beyond the verdict for the diff it reviewed has done ' +
        'something this run cannot vouch for.',
        { judgeDir: dir, launched: true, args, head: newHead, committed: changed.slice(0, 20) },
      );
    }

    // A SECOND INSTRUMENT OVER THE SAME PROPERTY, AND THAT IS THE POINT.
    //
    // Given the path bound above, this can no longer fail on real inputs: the only path the session
    // may add is excluded from the subject by construction, so the subject cannot have moved. Kept
    // anyway, and kept honestly — it is computed by a DIFFERENT instrument (verdict.mjs's own hash
    // over the diff) than the one above (`git diff --name-only`). Two instruments over one property
    // that are expected never to disagree is redundancy worth having only because a disagreement is
    // then a finding about one of the two, not about the session. If this ever fires on real input,
    // do not relax it — find out which instrument is wrong.
    //
    // It is reachable in test through the `readVerdictArtifact` seam, which is why it is not dead
    // code by this repo's own standard: an untestable guard is one someone deletes.
    const atHead = read(newHead);
    // TWO DIFFERENT FAILURES, AND ONLY ONE OF THEM IS AN ACCUSATION. A missing subject means this
    // run could not read one — `verdict.mjs` failing, an output too large to buffer — and reporting
    // that as "the gate session moved the reviewed bytes" blames the session for the instrument's
    // silence. Same rule as REFUSED-is-not-BLOCK, one level down.
    if (!pre.subject || !atHead.subject) {
      return result(
        OUTCOME.REFUSED,
        `could not read a subject to compare (before: ${pre.subject ? 'read' : 'unreadable'}, after: ` +
        `${atHead.subject ? 'read' : 'unreadable'}). Nothing is established, and this is not a claim ` +
        'about what the gate session did.',
        { judgeDir: dir, launched: true, args, head: newHead },
      );
    }
    if (atHead.subject !== pre.subject) {
      return result(
        OUTCOME.REFUSED,
        `the gate session moved the reviewed bytes: the subject at HEAD ${newHead.slice(0, 12)} is ` +
        `${String(atHead.subject ?? 'unreadable').slice(0, 12)}, and the subject reviewed at ` +
        `${tip.slice(0, 12)} was ${String(pre.subject ?? 'unreadable').slice(0, 12)}. A verdict about ` +
        'different bytes establishes nothing about these.',
        { judgeDir: dir, launched: true, args, head: newHead },
      );
    }
    post = atHead;
  }

  return {
    ...post,
    launched: true,
    preexisting: false,
    judgeDir: dir,
    judgeFiles: judge.files,
    args,
    head: newHead,
    session: { exit: run.status ?? null, signal: run.signal ?? null, stdout_bytes: (run.stdout || '').length },
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────

function flag(name) {
  return process.argv.includes(name);
}
class UsageError extends Error {}

/**
 * A flag's value, or a REFUSAL. It used to fall back silently when the next token began with `-`,
 * so `--launcher --json` spawned the real `claude` while reporting nothing — a review fired one by
 * accident that way. A missing value is a mistake, and the direction to fail in is loud.
 */
function opt(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (v === undefined || v.startsWith('-')) {
    throw new UsageError(`${name} needs a value; got ${v === undefined ? 'nothing' : `"${v}"`}.`);
  }
  return v;
}

// ── EVERY FLAG DECLARES WHAT IT SELECTS, AND ONE ROLE IS FORBIDDEN ──────────────────────────
//
// Two flags have now been removed for one reason. `--repo` chose the SUBJECT — the tree that gets
// gated. `--git-ref` chose the JUDGE — the tree that does the gating, which is strictly worse, and
// it survived the round that deleted `--repo` because that round fixed the instance and this list
// did not exist. The class is: **an operator-supplied value that selects what gets MEASURED rather
// than what gets REPORTED.** A guard against it that lives in someone's memory has already failed
// once, so it lives here, and `produce-verdict.test.mjs` fails on any flag with no role and on any
// flag declaring the forbidden one.
//
//   selects-what-is-measured   FORBIDDEN. The subject and the judge are not the operator's to pick.
//   selects-where             a location, not a content. Must still be canonicalised and contained.
//   selects-what-runs         the launcher. It can stop the panel running; it CANNOT fabricate a
//                             verdict, because the decision is read from the artifact and the
//                             session is now bounded to committing exactly one verdict path.
//   bounds                    a limit on time or size.
//   reporting                 changes the output, never the measurement.
/**
 * THE ROLES THAT EXIST. A reviewer wired a `--base-ref` knob, declared it `'bounds'`, and passed
 * 57/57 — because the test asserted only that the role was a string longer than three characters,
 * so `'xxxx'` passed too. MEMBERSHIP of the registry was enforced and fails closed; the ROLE VALUE
 * was read by nothing. A registry whose vocabulary is prose is a registry that documents rather
 * than decides.
 *
 * The set alone does not close it — declaring a real knob `'bounds'` still type-checks — which is
 * why `CLI_SINKS` below is the other half: the roles say what a flag is FOR, the sinks say what
 * `main()` is allowed to hand the pipeline, and a wired knob has to get past both.
 */
export const FLAG_ROLE_VOCABULARY = ['reporting', 'bounds', 'selects-where', 'selects-what-runs'];

/**
 * The ONLY parameters `main()` may pass to `produceVerdict`. A new flag that actually reaches the
 * pipeline must add a name here, which is a visible act; declaring it `'bounds'` is not enough.
 * `repo`, `harnessRoot` and `gitRef` are deliberately absent — the subject, the router and the
 * judge are not the operator's to select, and each of those was a HIGH before it was a rule.
 */
export const CLI_SINKS = ['dryRun', 'judgeDir', 'launcher', 'timeoutMs'];

export const FLAG_ROLES = {
  '--json': 'reporting',
  '--help': 'reporting',
  '--dry-run': 'bounds',
  '--timeout': 'bounds',
  '--judge-dir': 'selects-where',
  '--launcher': 'selects-what-runs',
};
export const FORBIDDEN_FLAG_ROLE = 'selects-what-is-measured';

const KNOWN = new Set(Object.keys(FLAG_ROLES));
const TAKES_VALUE = new Set(['--judge-dir', '--launcher', '--timeout']);

// USAGE IS NOT A TERMINAL STATE. `--help` exited 0, which is the code documented as the ONE route
// to "a verdict exists and binds" — a second way for a caller to read success out of a run that
// gated nothing. 64 is EX_USAGE and is outside the four, so it can never be mistaken for one.
const EXIT_USAGE = 64;

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
      // USAGE, not REFUSED — the same argument as `--help` below. REFUSED is a terminal state
      // meaning "the gate ran and established nothing"; a mistyped flag is not a gate run at all,
      // and spelling it as one puts a typo into the same bucket as a panel that could not reach a
      // reviewer. Both are non-zero, so nothing was unsafe; they were simply not the same event.
      return EXIT_USAGE;
    }
    if (TAKES_VALUE.has(a)) i += 1; // its value is not a flag, whatever it looks like
  }
  if (flag('--help')) {
    process.stdout.write(
      'usage: produce-verdict.mjs [--dry-run] [--json] [--judge-dir D] [--launcher BIN] [--timeout MS]\n' +
      '  PRODUCED 0 · BLOCKED 1 · REFUSED 2 · NOT_REQUIRED 3 · usage 64\n' +
      `  It gates the tree it ships in and judges from ${JUDGE_REF}. Neither is selectable: an\n` +
      '  operator who picks the subject or the judge is picking the answer.\n',
    );
    return EXIT_USAGE;
  }

  let timeout;
  let r;
  try {
    timeout = Number(opt('--timeout', String(60 * 60 * 1000)));
    r = produceVerdict({
    dryRun: flag('--dry-run'),
    judgeDir: opt('--judge-dir'),
    launcher: [opt('--launcher', 'claude')],
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 60 * 60 * 1000,
    });
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`produce-verdict: ${e.message}\n`);
      return EXIT_USAGE;
    }
    throw e;
  }

  if (flag('--json')) {
    process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
  } else {
    process.stdout.write(`${r.outcome}  (established=${r.established})\n  ${r.reason}\n`);
    // PRINT THE TREE. The human path named neither the tree it gated nor the ref, so a run that
    // answered about the wrong one looked exactly like a run that answered about yours. Only
    // `--json` carried it, and a person reading a terminal is the case that matters here.
    if (r.args) process.stdout.write(`  tree:          ${r.args.tree}\n  ref:           ${r.args.ref}\n`);
    if (r.head) process.stdout.write(`  head after:    ${r.head}\n`);
    if (r.judgeDir) process.stdout.write(`  judge project: ${r.judgeDir}\n`);
    if (r.subject) process.stdout.write(`  subject:       ${String(r.subject).slice(0, 16)}…\n`);
  }
  return EXIT[r.outcome];
}

if (process.argv[1] && canonical(process.argv[1]) === canonical(fileURLToPath(import.meta.url))) {
  // THE PROCESS OWNER DECIDES HOW THE PROCESS DIES. Ctrl-C should still reclaim what we made, and
  // 128+signo is the shell's own convention, so an interrupted run looks interrupted. This is
  // deliberately NOT done by armJudgeDirCleanup: that function runs inside a host that has its own
  // shutdown, and hijacking it there is the defect this block exists to keep out of the library.
  for (const [sig, signo] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) {
    process.on(sig, () => {
      sweepJudgeDirs();
      process.exit(128 + signo);
    });
  }
  process.exitCode = main();
}
