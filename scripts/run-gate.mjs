#!/usr/bin/env node
// POSTURE: ROUTES. Decides whether the binding QA gate is required for a diff and emits the
// exact invocation that runs it. Exits 2 if it cannot decide. It does not itself pass or fail
// a merge — `.github/workflows/qa-lead-pass.yml` does that.
//
// scripts/run-gate.mjs — route the merge decision to the gate that actually reviews.
//
// WHY THIS EXISTS
// `.claude/workflows/qa.js` is the real gate: five dimension reviewers, three adversarial
// verifiers per block-eligible finding, an Opus judge whose verdict binds, and a deterministic
// coverage-gap override. It works, and it has run. **Nothing routes to it.** The merge gate
// instead greps `qa_verdict: PASS` out of a session file — a string the author of the change
// writes about their own change. That is why the gate's record was 34 PASS and 0 refusals.
//
// The missing piece was never the reviewer. It was the router: no step anywhere decided
// "this diff is `full`, therefore qa.js must run, with these arguments." This is that step.
//
// WHAT IT HONESTLY DOES NOT DO
// It cannot execute `qa.js`. That file is a Workflow script — it runs inside the Workflow
// runtime and closes over injected globals (`agent()`, `parallel()`, `phase()`, `log()`,
// `args`, `budget`) that no plain node process provides. So this emits the invocation; the
// orchestrator or CI runs it. Anyone wiring this up should read that sentence twice: a router
// that is never called is exactly the defect it was written to fix.
//
// USAGE
//   node scripts/run-gate.mjs                        # classify HEAD vs origin/main
//   node scripts/run-gate.mjs --ref origin/main...HEAD
//   node scripts/run-gate.mjs --json                 # machine-readable routing decision
//   node scripts/run-gate.mjs --files a.ts b.ts      # classify an explicit list
//   node scripts/run-gate.mjs --require              # exit 1 when the gate IS required
//
// `--require` is for callers that want a non-zero signal to branch on. Without it, a required
// gate still exits 0 — deciding is not the same as blocking, and this script only decides.

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const { loadRules, classifyFiles } = require('./lib/classifier.js');
const MAP = path.join(REPO_ROOT, '.claude', 'qa-tier-floor.yml');
const QA_SCRIPT = '.claude/workflows/qa.js';

// ── When the diff under review EDITS the gate ────────────────────────────────────────────────
//
// `QA_SCRIPT` is a relative path and is emitted verbatim, so it resolves against whatever cwd the
// invocation is pasted into. When the diff changes `.claude/workflows/`, the default behaviour is
// therefore to review the PR using the PR's own modified gate. Observed 2026-08-24: a launch
// loaded `.worktrees/.../pr3-linter-gate/.claude/workflows/qa.js` — a copy whose diff altered
// verifier fan-out — instead of the `origin/main` copy; confirmed by hash, and caught only because
// a human read the launch output. That branch changes `qa.js` by +118/-28 lines.
//
// AN ABSOLUTE PATH DOES NOT FIX THIS, and neither does `Workflow({name:"qa"})`. A path resolved at
// emit time points at the emitting tree, which IS the PR tree — the bad copy. The deeper problem is
// that two requirements pull one knob in opposite directions:
//
//   · the reviewing copy of qa.js must come from `main`   → resolve the script somewhere else
//   · the oracle must run `npm run check` in the PR tree  → resolve the shell HERE
//
// qa.js has no shell of its own (see its own header): the oracle is an agent told to run the checks
// "from the repo root", so it follows cwd. The script follows cwd too. Measured the same day:
// re-running the gate from a worktree that held an unmodified copy made the oracle run `npm run
// check` in THAT tree, so it tested `main` instead of the PR and returned a BLOCK on an unrelated
// environment failure. Running the gate from a foreign worktree is not a workaround — it trades a
// wrong reviewer for a wrong subject.
//
// So this router does the only honest thing available to it, which is also the only thing its
// posture permits (`POSTURE: ROUTES`, top of file): it REPORTS the conflict, loudly, in both
// output channels, and names the human decision. It does not pick a copy, does not rewrite the
// invocation, and does not change its exit code — a hazard that is announced is no longer silent,
// and silence was the defect.
const GATE_OWN_PATH = /^\.claude\/workflows\//;

// Every path under `.claude/workflows/**` floors at `full` and qa.js itself at `irreversible`
// (`.claude/qa-tier-floor.yml`), so this condition never occurs on a diff the gate would skip.
function gateSelfReview(files, ref) {
  const touched = files.map((f) => f.replace(/^\.\//, '')).filter((f) => GATE_OWN_PATH.test(f));
  if (!touched.length) return null;
  return {
    detected: true,
    files: touched,
    qaScriptChanged: touched.includes(QA_SCRIPT),
    conflict:
      'The reviewing copy of the gate must come from `main`, and the oracle must run `npm run ' +
      'check` in the PR tree. Both resolve against one cwd, so no invocation this router can emit ' +
      'satisfies both.',
    humanDecisionRequired: true,
    inspect: [
      `git diff ${ref} -- .claude/workflows/`,
      `git diff --quiet origin/main -- ${QA_SCRIPT}   # exit 0 = this tree's gate matches main`,
    ],
  };
}

// The tiers whose review pipeline includes the adversarial panel. Lite is code-reviewer +
// qa-engineer + semgrep; trivial is CI only. Both are defined in CLAUDE.md's tier table, and
// this must not become a second place that decides tiers — it reads the floor, it never invents
// one.
const GATE_REQUIRED_TIERS = new Set(['full', 'irreversible']);

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : fallback;
}

function changedFiles(ref) {
  // `ref` reaches git as a positional argument. execFileSync uses no shell, so there is no shell
  // injection here — but git itself reads a leading `-` as an OPTION, and options like
  // `--output=<path>` write files. Today the only caller is a human on a terminal; the router is
  // meant to be wired into CI, where the ref could come from a branch name. Refuse the shape now,
  // while the blast radius is zero. Raised as P3 by the binding gate on this router's own PR.
  if (ref.startsWith('-')) {
    console.error(`run-gate: refusing a ref that begins with "-" (${ref}) — git would read it as an option.`);
    process.exit(2);
  }
  try {
    const out = execFileSync('git', ['diff', '--name-only', ref], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    console.error(`run-gate: could not read the diff for "${ref}".`);
    console.error(`  ${(e.stderr || e.message || '').toString().trim().split('\n')[0]}`);
    process.exit(2);
  }
}

// Resolve HEAD to a cwd-independent ref. A bare "HEAD" in the emitted invocation resolves in
// the WORKFLOW's working directory, not the caller's — if pasted into a different session it
// reviews whatever branch that session happens to be on. A resolved SHA is immutable and always
// refers to the same commit, from any directory.
function resolvedRef() {
  try {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    if (!sha || sha.length < 7) return null;
    return `origin/main...${sha}`;
  } catch {
    return null;
  }
}

function main() {
  const asJson = process.argv.includes('--json');
  const requireMode = process.argv.includes('--require');
  // HEAD validation: a bare HEAD in --ref is cwd-dependent (it resolves in the workflow's cwd,
  // not the caller's). Refuse it explicitly so the mistake is loud, not silent.
  const rawRef = arg('--ref');
  if (rawRef !== null && rawRef.includes('HEAD')) {
    console.error(
      `run-gate: refusing a ref containing bare "HEAD" (${rawRef}) — HEAD resolves in the workflow's ` +
      'working directory, not the caller\'s. Use a resolved SHA or origin/<branch> instead.'
    );
    process.exit(2);
  }
  const ref = rawRef ?? resolvedRef();
  if (ref === null) {
    console.error('run-gate: could not resolve a cwd-independent ref from HEAD. Pass --ref <sha or origin/branch> explicitly.');
    process.exit(2);
  }

  const explicit = [];
  const fi = process.argv.indexOf('--files');
  if (fi !== -1) {
    for (let i = fi + 1; i < process.argv.length && !process.argv[i].startsWith('--'); i++) {
      explicit.push(process.argv[i]);
    }
  }

  const files = explicit.length ? explicit : changedFiles(ref);

  if (!files.length) {
    const empty = { ref, files: 0, floor: 'trivial', gateRequired: false, reason: 'empty diff' };
    console.log(asJson ? JSON.stringify(empty, null, 2) : `No changed files for ${ref}. Nothing to gate.`);
    process.exit(0);
  }

  let rules;
  try {
    rules = loadRules(MAP);
  } catch (e) {
    console.error(`run-gate: could not load the tier map at ${MAP}: ${e.message}`);
    process.exit(2);
  }

  const classified = classifyFiles(files, rules);
  const floor = classified.floor.tier;
  const gateRequired = GATE_REQUIRED_TIERS.has(floor);

  // The paths that set the floor — a routing decision nobody can audit is a routing decision
  // nobody will trust.
  const drivers = classified.files.filter((r) => r.tier === floor).map((r) => r.file);

  const invocation = gateRequired
    ? { tool: 'Workflow', scriptPath: QA_SCRIPT, args: { ref, tier: floor } }
    : null;

  // Null when the diff leaves the gate alone — same shape as `invocation`, so a consumer can
  // always read the key rather than probe for it.
  const selfReview = gateSelfReview(files, ref);

  if (asJson) {
    console.log(JSON.stringify(
      { ref, files: files.length, floor, gateRequired, drivers, gateSelfReview: selfReview, invocation },
      null,
      2,
    ));
  } else {
    console.log(`ref:   ${ref}`);
    console.log(`files: ${files.length}`);
    console.log(`floor: ${floor}`);
    if (drivers.length) {
      console.log(`set by: ${drivers.slice(0, 5).join(', ')}${drivers.length > 5 ? ` (+${drivers.length - 5} more)` : ''}`);
    }
    console.log('');
    if (selfReview) {
      console.log('!! THIS DIFF EDITS THE GATE — DO NOT RUN THE INVOCATION BELOW UNREAD !!');
      console.log('');
      console.log(`  changed under .claude/workflows/: ${selfReview.files.join(', ')}`);
      console.log(`  qa.js itself changed:             ${selfReview.qaScriptChanged ? 'YES' : 'no'}`);
      console.log('');
      console.log('  The scriptPath below is RELATIVE, so it loads whichever copy of the gate lives');
      console.log('  in the tree you paste it into — here, the copy this diff modifies. The gate would');
      console.log('  review its own change using its own changed self.');
      console.log('');
      console.log('  Two requirements, one cwd, and they conflict:');
      console.log('    · the reviewing copy of qa.js must come from `main`');
      console.log('    · the oracle must run `npm run check` in THIS PR\'s tree');
      console.log('  Running from a worktree that holds an unmodified gate satisfies the first and');
      console.log('  breaks the second — measured 2026-08-24: the oracle then checked `main`, not the');
      console.log('  PR, and BLOCKed on an unrelated environment failure. It is not a workaround.');
      console.log('');
      console.log('  This router cannot resolve that. A HUMAN DECIDES. Read the gate\'s own diff first:');
      for (const cmd of selfReview.inspect) console.log(`    ${cmd}`);
      console.log('');
    }
    if (gateRequired) {
      console.log(`The binding QA gate IS required at tier "${floor}". Run it:`);
      console.log('');
      console.log(`  Workflow({ scriptPath: "${QA_SCRIPT}", args: ${JSON.stringify({ ref, tier: floor })} })`);
      console.log('');
      console.log('A `qa_verdict: PASS` recorded without that run is the author reviewing their own');
      console.log('change. That is what this router exists to stop.');
    } else {
      console.log(`The binding QA gate is NOT required at tier "${floor}".`);
      console.log('CI (schema-lint, gate tests, manifest, registration, launcher, ledger) still applies.');
    }
  }

  process.exit(requireMode && gateRequired ? 1 : 0);
}

main();
