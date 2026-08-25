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
 * early in the streamed output, and the slow ones (the six `check:ledger` links, ~45s between
 * them) sit late so they do not delay the signal from everything else. Ordering is a readability
 * choice only — no step depends on an earlier one having passed. `check:mc` used to sit at
 * position 22 here; see EXCLUDED.
 *
 * EVERY ENTRY IS ONE COMMAND. Five of them used to be one step each — `check:dispatch`,
 * `check:dispatch-prompt`, `check:memory`, `check:warroom` and `check:ledger` — and each of those
 * was itself an `&&` chain inside package.json, 18 links behind 5 names. That is the same defect
 * this file exists to fix, one level down: the runner reported a single failed step while the
 * links after the failing one had not run. auditSuite() now REFUSES a step whose command carries
 * `&&`, so the chain cannot come back through package.json after being taken out of here.
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
  // check:dispatch, as its three links
  'test:dispatch',
  'test:dispatch-flush',
  'check:dispatch-agenttype',
  // check:dispatch-prompt, as its two links
  'test:dispatch-prompt',
  'check:dispatch-prompt-size',
  // check:memory, as its two links
  'test:memory',
  'check:memory-budget',
  'check:map',
  // check:warroom, as its five links
  'check:warroom-launcher',
  'check:warroom-template',
  'check:warroom-installer',
  'check:warroom-parity',
  'test:warroom',
  'test:hooks',
  'test:budget',
  'test:lenses',
  'test:provenance',
  'test:playbooks',
  // check:ledger, as its six links. A test:claims failure used to skip `ledger lint`,
  // `ledger build --check` and `ledger verify` — the ledger's whole enforcement — and the
  // suite reported one failed step.
  'test:claims',
  'test:classifier',
  'test:ledger',
  'check:ledger-lint',
  'check:ledger-build',
  'check:ledger-verify',
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
    'CANNOT PASS LOCALLY AT ALL WHILE THE SANDBOX IS ARMED — not nested, not standalone — so this is a ' +
    'containment fact, not a verdict on the check. Measured 2026-08-25, foreground, top level: ' +
    '`npm run check:mc` exits 1 at 344 pass / 1 fail, matching the armed cell in ' +
    'docs/03-system-design/SANDBOX.md; the failure is mission-control/test/stream.test.ts, on a loopback ' +
    'bind(). THE CAUSE is the sandbox denying that bind(), and errno 0 is the tell — a genuine macOS ' +
    'EADDRINUSE is errno 48, mission-control has exactly one Bun.serve, it is stopped in a finally, and ' +
    'port 0 asks the kernel for an ephemeral port, so it cannot collide. The isolated control, thirty ' +
    'seconds apart on that one file: `bun test test/stream.test.ts` is 9 pass / 1 fail with the sandbox ' +
    'armed and 10 pass / 0 fail without it. THE VARIABLE IS THE SANDBOX. ' +
    'THERE IS NO LOCAL WORKAROUND, and this entry used to prescribe one. It read "CANNOT PASS INSIDE THE ' +
    'SUITE, and passes outside it — RUN IT AS ITS OWN TOP-LEVEL COMMAND, which that settings key now ' +
    'permits", citing 345 pass / 0 fail standalone against 344 pass / 1 fail nested and concluding that ' +
    'nesting was the variable. NESTING WAS NOT THE VARIABLE. That pair was taken while ' +
    '.claude/settings.json carried a `sandbox.excludedCommands` entry naming "npm run check:mc": it ' +
    'matched the INVOKED command string, so it exempted the standalone cell and not the nested one, and ' +
    'the exemption produced the whole difference. The QA gate then raised that key as three P1 security ' +
    'defects and ab46d40 reverted it. The file is now byte-identical to origin/main with no ' +
    'excludedCommands at all, the prescribed command fails like every other spelling, and DO NOT PUT THE ' +
    'KEY BACK to make this paragraph true again. ' +
    'WHY IT IS OUT OF THE SUITE: in it, it turns `npm run check` permanently red on every sandboxed ' +
    'machine for a reason that is not about the code under test, and a suite that is always red is a ' +
    'suite nobody reads. It is NOT excluded for being broken or slow — 345 of 345 green in 195s once the ' +
    'bind is permitted. WHERE THE COVERAGE WENT, and this is the load-bearing half: ' +
    '.github/workflows/ci.yml runs it as its own step, `bun install --frozen-lockfile --cwd ' +
    'mission-control && npm run check:mc`, on a runner with no OS sandbox. That is the only place it runs ' +
    'green, so it is the only place it is checked, and scripts/check-suite.test.mjs now reads ci.yml and ' +
    'fails if that step is deleted. NOTHING SCHEDULES ITS RETURN, and calling it temporary would be a ' +
    'promise nobody has made: it returns when a loopback bind can be permitted, and the sandbox exposes ' +
    'no inbound or loopback setting to grant one. FALSIFY THIS: delete this entry, put check:mc back in ' +
    'STEPS, and run `npm run check` with the sandbox armed. If it goes green, the sandbox behaviour ' +
    'changed and this exclusion should not survive.',
  // The five delegating parents. Each is now an alias whose links are steps of their own, kept
  // only because docs, session files and CLAUDE.md cite these spellings as the command to run.
  // The alias body is still an `&&` chain — that is what `npm run a && npm run b` is — which is
  // exactly why neither the suite nor ci.yml goes through it. auditSuite() checks that every link
  // an alias names is reached by the suite, so none of these entries can outlive its links.
  'check:ledger':
    'AN ALIAS for six steps, not a check. Its links — test:claims, test:classifier, test:ledger, ' +
    'check:ledger-lint, check:ledger-build and check:ledger-verify — are six STEPS above and six ' +
    'steps in .github/workflows/ci.yml. Split because as one `&&` chain a test:claims failure ' +
    "skipped `ledger lint`, `ledger build --check` and `ledger verify` — the ledger's entire " +
    'enforcement — and the suite reported one failed step. Run the alias by hand and it still ' +
    'short-circuits; that is what an `&&` chain does, and it is why nothing automated uses it.',
  'check:warroom':
    'AN ALIAS for five steps, not a check. Its links — check:warroom-launcher, ' +
    'check:warroom-template, check:warroom-installer, check:warroom-parity and test:warroom — are ' +
    'five STEPS above and five steps in .github/workflows/ci.yml. As one `&&` chain, a syntax ' +
    'error in bin/warroom skipped the other four, including the 13 installer guard-rail tests, ' +
    'and reported one failure. The spelling is kept because ORCHESTRATION.md and CONTROL-PLANE.md ' +
    'both name `npm run check:warroom` as the verification command for planned work.',
  'check:dispatch':
    'AN ALIAS for three steps, not a check. Its links — test:dispatch, test:dispatch-flush and ' +
    'check:dispatch-agenttype — are three STEPS above and three steps in ' +
    '.github/workflows/ci.yml. The mutation gate ran first in the chain, so a failure in it ' +
    'skipped the checker whose parser it exists to guard, which is the wrong way round.',
  'check:dispatch-prompt':
    'AN ALIAS for two steps, not a check. Its links — test:dispatch-prompt and ' +
    'check:dispatch-prompt-size — are two STEPS above and two steps in ' +
    '.github/workflows/ci.yml, so a failing test no longer hides whether the size check itself ran.',
  'check:memory':
    'AN ALIAS for two steps, not a check. Its links — test:memory and check:memory-budget — are ' +
    'two STEPS above and two steps in .github/workflows/ci.yml. The budget check is the one that ' +
    'fails a real DECISIONS.md overflow, and it sat behind its own unit tests in the chain.',
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

/**
 * A script name whose wiring this guard is responsible for.
 *
 * These are the prefixes that mean "this script ASSERTS something", and being governed is what
 * makes removal from STEPS loud: an unreached governed script fails; an unreached ungoverned one
 * is invisible. `lint:` is here because it was missing and that was a hole, not a decision —
 * `lint:agents` is the agent schema linter, sat at step 3, and could be deleted from STEPS with
 * the guard staying green. `verify:` and `audit:` name nothing today and are here so the next
 * assertive script does not arrive through the same gap.
 *
 * The other prefixes in package.json are deliberately out: `build:`, `curate:`, `measure:`,
 * `vendor:`, `probe:`, `warroom:` and `ledger:` are generators and operational commands, and
 * their assertive halves already appear as `check:`/`test:` steps (`check:manifest` for
 * `build:manifest`, `check:ledger` for `ledger:verify`, and so on). Governing a generator would
 * demand an EXCLUDED entry for every tool in the repo, which is how a guard becomes noise.
 *
 * A prefix list can only ever be a list, so it is not the whole defence: auditSuite() separately
 * fails any STEP that this pattern does not match, which catches the next prefix without anyone
 * having predicted it.
 */
const GOVERNED = /^(?:check|test|lint|verify|audit):/;

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
 * The links of an ALIAS: a script whose entire body is `npm run` calls joined by `&&`, kept so a
 * documented command spelling keeps working after its links became steps of their own.
 *
 * Returns null for anything else — a single command, or a chain with a non-`npm run` link. That
 * narrowness is deliberate: only a pure delegation can be excused from the suite on the grounds
 * that its links are in it, because only then is every link a name this file can go and check.
 */
function aliasLinks(command) {
  const parts = String(command).split('&&').map((part) => part.trim());
  if (parts.length < 2) return null;
  const links = [];
  for (const part of parts) {
    const m = /^npm\s+run\s+([\w:-]+)$/.exec(part);
    if (!m) return null;
    links.push(m[1]);
  }
  return links;
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

  // A STEP that is itself an `&&` chain is this file's own defect, one level down. `check:ledger`
  // was six links behind one name: `&&` stopped at the first failure, the runner reported one
  // failed step, and `ledger lint`, `ledger build --check` and `ledger verify` had not run. The
  // runner cannot see inside a step — it spawns `npm run <step>` and reads one exit code — so the
  // only place this is catchable is here, on the command string.
  for (const step of steps) {
    if (!has(step)) continue;
    if (!String(scripts[step]).includes('&&')) continue;
    failures.push(
      `STEPS names "${step}", whose command is an \`&&\` chain: ${scripts[step]}. \`&&\` stops at the first ` +
        `non-zero exit, so the links after a failing one never run while the suite reports a single failed ` +
        `step. Give each link its own script and its own entry in STEPS, and keep "${step}" — if a doc cites ` +
        `it — as an alias in EXCLUDED.`
    );
  }

  // A step this guard does not govern can be deleted from STEPS in silence: nothing then reports
  // it as unreached, because only GOVERNED names are checked for reachability. `lint:agents` was
  // exactly that for as long as GOVERNED read /^(?:check|test):/ — a step of the suite that the
  // drift guard was not guarding. Checked here rather than only widening the pattern, because a
  // pattern is a list of the prefixes someone thought of.
  for (const step of steps) {
    if (GOVERNED.test(step)) continue;
    failures.push(
      `STEPS names "${step}", whose prefix is outside GOVERNED in scripts/lib/check-suite.js. A step that ` +
        `is not governed can be REMOVED from the suite without this guard noticing, which is the whole ` +
        `defect it exists to catch. Add the prefix to GOVERNED, or rename the script under one already ` +
        `there.`
    );
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
    // An alias is excused from the suite BECAUSE its links are in it. That is a checkable claim,
    // so it is checked: exempting `check:ledger` while `check:ledger-verify` is in no step list
    // would read as a considered split and be a check running nowhere.
    const links = aliasLinks(scripts[name]);
    if (links) {
      const orphans = links.filter((link) => !reached.has(link));
      if (orphans.length) {
        failures.push(
          `EXCLUDED names "${name}", an alias for ${links.join(', ')} — but ${orphans.join(', ')} is reached ` +
            `by nothing in the suite either. An alias is out of the suite because its links are in it; with a ` +
            `link missing, this entry exempts a check that then runs nowhere.`
        );
      }
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

module.exports = { STEPS, EXCLUDED, GOVERNED, RUNNER, scriptGraph, reachable, aliasLinks, auditSuite };
