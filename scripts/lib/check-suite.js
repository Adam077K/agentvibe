'use strict';
// POSTURE: library. `scripts/run-checks.mjs` is its runner and IS `npm run check`;
// `scripts/check-suite.test.mjs` is its drift guard. Both fail the build.
//
// scripts/lib/check-suite.js — THE step list for `npm run check`, and the reachability
// rule that keeps package.json from drifting away from it.
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────────────────────────
// The suite used to be a thirty-link `&&` chain inside package.json's `check` string. `&&` stops
// at the first non-zero exit, so a failing step 21 — `check:mc`, which fails on any machine that
// has not run `bun install` in mission-control/ — silently skipped steps 22 through 30:
//
//     test:probe-readonly  test:pre-tool-use  test:run-gate  test:tier-gate  test:merge-gate
//     test:skill-clamp     test:probe-stop-reason  test:launcher-permissions  test:sandbox
//
// That is every safety-hook test, the gate's own tests, and `test:sandbox` — the check that makes
// "the sandbox is armed" a fact rather than a comment. Measured 2026-08-24: a full run reached
// `check:mc`, exited 1, and printed one failure. Nine checks had not run and nothing said so.
//
// CI never saw it, because ci.yml invokes each script as its own step. `.claude/workflows/qa.js`
// DID see it: its ORACLE runs `npm run check` as a single command and treats the exit code as the
// deterministic floor before any review agent is dispatched. So the floor was skipping the nine
// highest-value checks in the repo — including the tests for the gate itself — and reporting one
// failure, in the one environment where it decides whether a diff proceeds.
//
// Two things live in this one file so that neither can drift from the other:
//
//     STEPS     the ordered suite. The ONE list. package.json's `check` is now just the runner.
//     EXCLUDED  scripts deliberately outside the suite, each carrying the reason in writing.
//
// ── WHAT THE REACHABILITY RULE CANNOT DO ─────────────────────────────────────────────────────
// `reachable()` finds `npm run <name>` inside script command strings, transitively. A script
// invoked by any other spelling — npm-run-all, a shell loop, or a `node scripts/x.mjs` that
// shells out on its own — is invisible to it and will be reported UNREACHABLE even though
// something runs it. That is the safe direction to be wrong in: the fix is an EXCLUDED entry
// with a reason a human wrote, not a pass granted to something nobody runs.
//
// It also cannot tell you a step is worth running, that its ordering is right, or that it
// asserts anything. It checks wiring, not value.

/**
 * The suite, in execution order. `npm run check` runs every one of these and reports every
 * failure; it does not stop at the first.
 *
 * Ordering intent: the structural and cheap checks come first so a broken tree fails loudly and
 * early in the streamed output, and the slow ones (`check:ledger`, ~45s) sit late so they do not
 * delay the signal from everything else. Ordering is a readability choice only — no step depends
 * on an earlier one having passed. `check:mc` used to sit at position 22 here; see EXCLUDED.
 */
const STEPS = [
  'test:protected-write',
  'test:check-suite',
  'lint:agents',
  'check:prompt-standard',
  'test:gate',
  'check:manifest',
  'check:curation',
  'check:routers',
  'check:registration',
  'test:registration',
  'check:dispatch',
  'check:dispatch-prompt',
  'check:memory',
  'check:map',
  'check:warroom',
  'test:hooks',
  'test:budget',
  'test:lenses',
  'test:provenance',
  'test:playbooks',
  'check:ledger',
  'test:probe-readonly',
  'test:pre-tool-use',
  'test:run-gate',
  'test:tier-gate',
  'test:merge-gate',
  'test:skill-clamp',
  'test:probe-stop-reason',
  'test:launcher-permissions',
  'test:sandbox',
];

/**
 * Scripts matching a GOVERNED prefix that are deliberately NOT in the suite.
 *
 * Every key needs a reason someone can argue with, and the drift guard fails an entry naming a
 * script that no longer exists — so this list cannot rot into a list of names nobody recognises.
 * Excluding a parent does NOT excuse its children: each unreachable script is named here on its
 * own line, because a subtree silently exempted by one entry is the defect this guard exists to
 * catch, wearing a different hat.
 */
const EXCLUDED = {
  'check:mc':
    'FAILS UNDER THE ARMED SANDBOX WHEREVER IT RUNS, and passes with the sandbox off — so this is a ' +
    'containment fact, not a verdict on the check. THE VARIABLE IS THE SANDBOX. Re-measured 2026-08-25 in ' +
    'this worktree, five minutes apart, same commit, same deps, both a foreground top-level ' +
    '`npm run check:mc` and nothing else differing: sandboxed exits 1 at 343 pass / 2 fail; with the ' +
    'sandbox disabled it exits 0 at 345 pass / 0 fail. The isolated control is sharper — ' +
    '`bun test test/stream.test.ts` alone, thirty seconds apart, 9 pass / 1 fail sandboxed against ' +
    '10 pass / 0 fail unsandboxed. THE CAUSE is the sandbox denying a loopback bind(): the failure surfaces ' +
    'as EADDRINUSE carrying errno 0, where a genuine macOS EADDRINUSE is errno 48, and mission-control has ' +
    'exactly one Bun.serve, stopped in a finally, asking the kernel for an ephemeral port. The second ' +
    'sandboxed failure is crosscheck.test.ts timing out at its 120s limit; it too passes with the sandbox ' +
    'off, so it is sandbox-correlated, but no control here isolates its mechanism. ' +
    'SUPERSEDED 2026-08-25, and this is exactly why measurements get written down. This entry used to read ' +
    '"CANNOT PASS INSIDE THE SUITE, and passes outside it", citing `npm run check:mc` alone at 345 pass / 0 ' +
    'fail against 344 pass / 1 fail nested, and concluding "nesting is the variable". NESTING WAS NOT THE ' +
    'VARIABLE. That pair was taken while .claude/settings.json carried a `sandbox.excludedCommands` entry ' +
    'naming "npm run check:mc", which matched the INVOKED command string and so exempted the standalone ' +
    'cell while leaving the nested one sandboxed — the exemption produced the difference the entry then ' +
    'attributed to nesting. Commit ab46d40 reverted that key. The file is now byte-identical to ' +
    'origin/main and has no excludedCommands at all, and with it gone BOTH cells fail. So the old ' +
    'instruction "run it as its own top-level command" no longer works on a sandboxed machine, and this ' +
    'entry is the only place that said otherwise. ' +
    'WHY IT IS STILL OUT OF THE SUITE: in it, it turns `npm run check` permanently red on every sandboxed ' +
    'machine for a reason that is not about the code under test, and a suite that is always red is a suite ' +
    'nobody reads. It is NOT excluded for being broken or slow — with the sandbox off it is 345 of 345 ' +
    'green in 195s. IT STILL BLOCKS, and this is the load-bearing half: .github/workflows/ci.yml runs it ' +
    'as its own step, `bun install --frozen-lockfile --cwd mission-control && npm run check:mc`, on a ' +
    'runner with no OS sandbox — so coverage moved rather than disappearing, and scripts/check-suite.test' +
    '.mjs now reads ci.yml and fails if that step is deleted. NOTHING SCHEDULES ITS RETURN, and calling it ' +
    'temporary would be a promise no one has made: it comes back when a loopback bind is permitted, and ' +
    'the sandbox exposes no inbound or loopback setting to grant one. Locally, run it with the sandbox ' +
    'off. FALSIFY THIS: delete this entry, put check:mc back in STEPS, and run `npm run check` sandboxed. ' +
    'If it goes green, the sandbox behaviour changed and this exclusion should not survive.',
  'check:citations':
    'POSTURE: WARN by design. scripts/check-citations.mjs says so in its own header — "deliberately ' +
    'NOT wired into `npm run check` or into CI by the PR that introduced it: turning it blocking is a ' +
    'separate, higher-tier decision, and it should be made after someone has looked at a full run." It ' +
    'exits 0 with findings reported; only --strict exits 1, so wiring it in as-is would add runtime and ' +
    'assert nothing. Run it by hand: npm run check:citations.',
  'test:citations':
    'The mutation gate for check:citations, reached only from it. Excluded because its only parent is ' +
    'excluded — not because of anything about this test. If check:citations is ever promoted to blocking, ' +
    'both entries come out together.',
};

/** A script name whose wiring this guard is responsible for. */
const GOVERNED = /^(?:check|test):/;

/** The entry point. Named here because the guard asserts package.json still points `check` at it. */
const RUNNER = 'scripts/run-checks.mjs';

/** Build name -> [names it invokes via `npm run`], for scripts that exist. */
function scriptGraph(scripts) {
  const edges = new Map();
  for (const name of Object.keys(scripts)) {
    const kids = new Set();
    for (const m of String(scripts[name]).matchAll(/\bnpm\s+run\s+([\w:-]+)/g)) {
      if (Object.prototype.hasOwnProperty.call(scripts, m[1])) kids.add(m[1]);
    }
    edges.set(name, [...kids]);
  }
  return edges;
}

/**
 * Every script reachable from `steps`, transitively through `npm run` references.
 *
 * Transitive reach counts. `check:ledger` runs test:claims/test:classifier/test:ledger,
 * `check:dispatch` runs test:dispatch, `check:warroom` runs test:warroom, `check:memory` runs
 * test:memory, `check:dispatch-prompt` runs test:dispatch-prompt — those five are reached and
 * must NOT be duplicated into STEPS to satisfy the guard.
 */
function reachable(scripts, steps = STEPS) {
  const edges = scriptGraph(scripts);
  const seen = new Set();
  const queue = steps.filter((s) => Object.prototype.hasOwnProperty.call(scripts, s));
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    seen.add(name);
    for (const kid of edges.get(name) || []) if (!seen.has(kid)) queue.push(kid);
  }
  return seen;
}

/**
 * The drift guard, as a pure function so the test can run it against a MUTATED package.json and
 * watch it fail. A guard only ever exercised on a tree where it passes is not evidence.
 *
 * Returns { failures: string[] } — empty means the wiring is intact.
 */
function auditSuite({ scripts, steps = STEPS, excluded = EXCLUDED, runner = RUNNER } = {}) {
  const failures = [];
  const has = (n) => Object.prototype.hasOwnProperty.call(scripts, n);

  for (const step of steps) {
    if (!has(step)) {
      failures.push(
        `STEPS names "${step}", which is not a script in package.json. Add the script, or remove the step ` +
          `from STEPS in scripts/lib/check-suite.js.`
      );
    }
  }

  const dupes = steps.filter((s, i) => steps.indexOf(s) !== i);
  for (const d of new Set(dupes)) {
    failures.push(`STEPS lists "${d}" more than once — running it twice hides which run failed.`);
  }

  const reached = reachable(scripts, steps);

  for (const name of Object.keys(scripts)) {
    if (!GOVERNED.test(name)) continue;
    if (reached.has(name)) continue;
    if (Object.prototype.hasOwnProperty.call(excluded, name)) continue;
    failures.push(
      `"${name}" is a check:/test: script in package.json that nothing in the suite reaches, directly or ` +
        `through an \`npm run\` reference. It would never run under \`npm run check\`. Either add it to STEPS ` +
        `in scripts/lib/check-suite.js, or add it to EXCLUDED there with the reason written down.`
    );
  }

  for (const [name, reason] of Object.entries(excluded)) {
    if (!has(name)) {
      failures.push(
        `EXCLUDED names "${name}", which is no longer a script in package.json. Delete the entry — a stale ` +
          `exemption reads as a considered decision and is not one.`
      );
      continue;
    }
    if (reached.has(name)) {
      failures.push(
        `EXCLUDED names "${name}", but the suite does reach it. Delete the entry; an exemption that exempts ` +
          `nothing will be trusted the next time it does.`
      );
    }
    if (typeof reason !== 'string' || reason.trim().length < 40) {
      failures.push(
        `EXCLUDED["${name}"] has no substantive reason. Write why it is out of the suite, so the next reader ` +
          `can disagree with the decision instead of guessing at it.`
      );
    }
  }

  if (!String(scripts.check || '').includes(runner)) {
    failures.push(
      `package.json's "check" script no longer runs ${runner} — it is "${scripts.check}". The suite is a ` +
        `single runner on purpose: an \`&&\` chain stops at the first failure and silently skips the rest, ` +
        `which is the defect this file exists to prevent.`
    );
  }

  return { failures };
}

module.exports = { STEPS, EXCLUDED, GOVERNED, RUNNER, scriptGraph, reachable, auditSuite };
