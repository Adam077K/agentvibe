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
 * them) sit late so they do not delay the signal from everything else. `check:mc` used to sit at
 * position 22 here; see EXCLUDED.
 *
 * NO STEP DEPENDS ON AN EARLIER ONE HAVING PASSED — and that is a statement about EXECUTION, not
 * about VALIDITY. Every step runs whatever the ones before it did, which is the whole point of the
 * runner. But several steps are the mutation gate for a later one, and a green checker beside its
 * own red gate is worth less than the tally suggests: `test:dispatch` is the mutation gate for
 * `check:dispatch-agenttype`, `test:dispatch-prompt` for `check:dispatch-prompt-size`, `test:memory`
 * for `check:memory-budget`, and `test:claims`/`test:classifier`/`test:ledger` guard the libraries
 * the three `check:ledger-*` steps run on. That trade is deliberate — sequencing them would restore
 * the skipping this file exists to end — so READ THE FAILURE LIST, not just the tally: a failed gate
 * next to a passed checker means the checker's parser is unproven, not that the checker is fine.
 * *This paragraph replaces "Ordering is a readability choice only", which was true of execution and
 * read as true of both (2026-08-26).*
 *
 * EVERY ENTRY IS ONE COMMAND, AND ONE COMMAND MEANS ONE EXIT CODE. Five entries used to be one step
 * each — `check:dispatch`, `check:dispatch-prompt`, `check:memory`, `check:warroom` and
 * `check:ledger` — and each of those was itself an `&&` chain inside package.json, 18 links behind 5
 * names. That is the same defect this file exists to fix, one level down: the runner reported a
 * single failed step while the links after the failing one had not run. auditSuite() now REFUSES a
 * step whose RESOLVED command carries a shell control operator, so the chain cannot come back
 * through package.json — nor through a wrapper script — after being taken out of here.
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
 * `build:manifest`, `check:ledger-verify` for `ledger:verify`, and so on — that second pairing read
 * `check:ledger` until 2026-08-26, which is no longer a step at all but an EXCLUDED alias, so the
 * example named nothing the suite runs). Governing a generator would
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
 * A command whose ENTIRE body is one `npm run <name>` — a wrapper, and nothing else.
 *
 * ONE PATTERN, TWO CALLERS, and that is deliberate rather than tidy. aliasLinks() asks it of each
 * `&&`-separated part and resolveChain() asks it of a whole body, but both are asking the same
 * question — "is this nothing but a delegation to a name I can go and check?" — and both docs below
 * describe the narrowness in the same words. Written twice, a narrowing meant for one of them
 * silently left the other behind; written once, the coupling is real and
 * `both callers of DELEGATION agree on what a bare delegation is` in scripts/check-suite.test.mjs
 * fails when they stop agreeing.
 */
const DELEGATION = /^npm\s+run\s+([\w:-]+)$/;

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
    const m = DELEGATION.exec(part);
    if (!m) return null;
    links.push(m[1]);
  }
  return links;
}

/**
 * A shell control operator inside a command string breaks "one step, one exit code".
 *
 * The runner spawns `npm run <step>` and reads ONE exit code; it cannot see inside a step. So every
 * operator below hides a link, and the two failure modes are not equally loud:
 *
 *     &&   stops at the first non-zero exit — the later links never run, and the step at least
 *          goes red, which is how the original 30-link chain was eventually noticed
 *     ;    STRICTLY WORSE, and it is the reason this check is not about `&&`. `bash -c 'false ;
 *     |    true'` exits 0, `bash -c 'false | true'` exits 0, `bash -c 'false & true'` exits 0 — the
 *     &    step's exit code becomes the LAST command's and the failure vanishes with no red step
 *          anywhere. All three were accepted by the `&&`-only check that preceded this one,
 *          measured 2026-08-26: `;`, `||` and `|` each returned zero findings against auditSuite().
 *     ||   masks it the other way — the step passes whenever the FALLBACK passes
 *     \n   a newline in a JSON script body is a sequence, with `;` semantics
 *
 * Quote-aware on purpose, and this is not hypothetical: package.json's `usage` script is a
 * `node -e "…;…"` one-liner whose semicolons are inside a double-quoted argument and separate
 * nothing. A substring scan would refuse that shape the day someone made it a step, and a guard
 * that fires on correct code gets weakened rather than obeyed.
 *
 * QUOTE-AWARE IS NOT THE SAME AS "DOUBLE QUOTES ARE OPAQUE", and reading them as opaque was a hole
 * that survived until 2026-08-26. `$(…)` and backticks RE-ENTER COMMAND CONTEXT inside double
 * quotes, so every operator above works in there. Measured in bash, which is the only authority
 * that settles it:
 *
 *     echo "$(exit 7; exit 0)"        exits 0 — the 7 is GONE, and no step goes red
 *     echo "`exit 7; exit 0`"         exits 0 — same, in the backtick spelling
 *     echo '$(exit 7; exit 0)'        prints the text, runs nothing — single quotes DO suppress it
 *
 * The first two returned [] from this function, so a STEPS entry shaped that way was accepted with
 * zero findings while dropping a failure silently — which is the exact threat model in the header,
 * arriving through the one construct the scanner had decided not to look inside. The third is
 * correct and is pinned: single quotes stay opaque, backslash and all.
 *
 * So the scanner tracks a STACK of command contexts rather than one quote flag. Each frame carries
 * its own quote state, because a substitution re-arms quoting one level in: in
 * `"$(echo 'a;b')"` bash prints `a;b` — that semicolon is single-quoted INSIDE the substitution and
 * separates nothing, and a depth counter alone would report it.
 *
 * `$((…))` is a fourth kind of frame and NOT a command context: its operators are arithmetic, so
 * they are not reported. It is ENTERED rather than skipped, and that distinction was measured, not
 * reasoned — the first cut of this fix skipped the whole expansion and
 * `x="$(( $(exit 7; echo 1) + 1 ))"` then returned [], while bash runs the inner commands and drops
 * the 7 exactly as it does anywhere else.
 *
 * Returns the operators found, in a stable order, or [] for a single command.
 */
const SHELL_OPERATORS = ['&&', '||', ';', '|', '&', '\\n'];

/**
 * Does a `$((` at `open - 1` balance? Returns the index of the closing `)`, or -1.
 *
 * USED ONLY TO DECIDE WHETHER THIS IS ARITHMETIC AT ALL — the expansion is then walked like any
 * other frame, not jumped over. `$((…))` is not a command context: measured, `$((6|1))` is 7,
 * `$((6&1))` is 0, `$((1&&1))` is 1 and `$((0||1))` is 1, so reporting a pipe there would fire this
 * rule on correct code with a message — "the step's exit code becomes the last command's" — that is
 * simply false of it. That is the same mistake the `2>&1` case documents.
 *
 * -1 rather than "to the end of the string" is the load-bearing half. An unbalanced `$((` is not
 * arithmetic bash would run, so treating it as opaque would turn a typo into the one place a chain
 * could still hide. Unbalanced falls through and is read as `$(` opening a substitution whose first
 * character is a subshell `(` — which reports, as it should.
 */
function arithmeticEnd(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '(') depth += 1;
    else if (src[i] === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function shellOperators(command) {
  const src = String(command);
  const found = new Set();

  // One frame per COMMAND CONTEXT, innermost last. `base` is the command line itself; `$(` pushes
  // a `paren` frame and a backtick a `tick` frame. `parens` counts subshells nested inside a `$(`
  // so that `$( (a; b) )` closes on the right `)` rather than the first one.
  const stack = [{ kind: 'base', quote: null, parens: 0 }];

  for (let i = 0; i < src.length; i += 1) {
    const frame = stack[stack.length - 1];
    const c = src[i];

    // SINGLE QUOTES ARE OPAQUE, backslash and all — `echo '$(exit 7; exit 0)'` prints the text and
    // runs nothing. This branch is first because it must win over every branch below it.
    if (frame.quote === "'") {
      if (c === "'") frame.quote = null;
      continue;
    }

    // A backslash escapes the next character, quoted or not — `echo a \; b` prints `a ; b`, one
    // command. Inside double quotes it is also what stops an ESCAPED substitution from opening a
    // frame: `"\$(exit 7; exit 0)"` and "\`exit 7; exit 0\`" both print literally and run nothing.
    if (c === '\\') { i += 1; continue; }

    // ARITHMETIC — checked before `$(` so the longer token wins, and inside double quotes too,
    // where `"$((6|1))"` is just as much a number. Only when it BALANCES: an unbalanced `$((` is
    // not arithmetic, so it falls through and is read as a substitution rather than becoming the
    // one place a chain can still hide.
    if (c === '$' && src[i + 1] === '(' && src[i + 2] === '(' && arithmeticEnd(src, i + 1) !== -1) {
      stack.push({ kind: 'arith', quote: null, parens: 2 });
      i += 2;
      continue;
    }

    // COMMAND SUBSTITUTION — the hole. Both spellings open a frame from ANY non-single-quoted
    // context, INCLUDING from inside arithmetic, which is where the first cut of this fix leaked.
    if (c === '$' && src[i + 1] === '(') {
      stack.push({ kind: 'paren', quote: null, parens: 1 });
      i += 1;
      continue;
    }
    if (c === '`') {
      // Backticks do not nest — the same character opens and closes — so this pops or pushes.
      if (frame.kind === 'tick') stack.pop();
      else stack.push({ kind: 'tick', quote: null, parens: 0 });
      continue;
    }

    // Inside double quotes and outside any substitution, nothing below separates commands. This is
    // the `usage` script's case and it must keep returning [].
    if (frame.quote === '"') {
      if (c === '"') frame.quote = null;
      continue;
    }

    if (c === '"' || c === "'") { frame.quote = c; continue; }

    // `parens` counts every paren still open in this frame — both of `$((`, the one of `$(` — so a
    // subshell inside a substitution closes on the right `)`: `$( (a; b) )` ends at the second.
    if (frame.kind === 'paren' || frame.kind === 'arith') {
      if (c === '(') { frame.parens += 1; continue; }
      if (c === ')') {
        frame.parens -= 1;
        if (frame.parens === 0) stack.pop();
        continue;
      }
    }

    // ARITHMETIC IS NOT A COMMAND CONTEXT. Reached only after the branch above, so a `$(` nested
    // inside arithmetic has already opened a command frame and is reported from there.
    if (frame.kind === 'arith') continue;

    if (c === '&' && src[i + 1] === '&') { found.add('&&'); i += 1; continue; }
    if (c === '|' && src[i + 1] === '|') { found.add('||'); i += 1; continue; }
    if (c === '|') { found.add('|'); continue; }
    if (c === ';') { found.add(';'); continue; }
    // A `&` ADJACENT TO `>` IS A REDIRECT, NOT BACKGROUNDING — `2>&1`, `>&2`, `&>log`. It does not
    // hide a command and it does not touch the exit code: `bash -c 'false 2>&1'` exits 1. Reporting
    // it would attach this rule's message — "the step's exit code becomes the last command's" — to a
    // case where that sentence is simply false, and a rule that fires on correct code with a wrong
    // explanation is one someone deletes rather than obeys. Latent when fixed 2026-08-26: no script
    // in the tree used the shape. A pipe alongside a redirect is still reported, on the pipe.
    if (c === '&' && (src[i - 1] === '>' || src[i + 1] === '>')) continue;
    if (c === '&') { found.add('&'); continue; }
    if (c === '\n' || c === '\r') { found.add('\\n'); continue; }
  }

  return SHELL_OPERATORS.filter((op) => found.has(op));
}

/**
 * The commands a step really runs: its own body, then the body of anything it delegates to.
 *
 * ONE HOP WAS ENOUGH TO DEFEAT THE OPERATOR CHECK, and it was measured that way (2026-08-26):
 * with `test:sandbox` set to `npm run check:inner` and `check:inner` set to an `&&` chain,
 * auditSuite() returned zero findings. The wrapper changes nothing the runner can see — it still
 * spawns one command and reads one exit code — so the walk follows the whole delegation chain
 * rather than a fixed number of hops, and a cycle terminates it.
 *
 * Its narrowness is the same narrowness as aliasLinks(): only a BARE `npm run <name>` is followed.
 * `npm run x --silent`, `npx`, npm-run-all, `sh -c "npm run a && npm run b"` (the chain is inside
 * quotes, so the scanner correctly does not see it) and a script that shells out on its own are
 * invisible here and will be walked past. That is the safe direction — this check under-reports
 * rather than refusing a command it did not understand — and it is the same limitation the header
 * records for reachable().
 *
 * THREE OF THOSE SHAPES ARE PINNED BY A TEST, and that is not the same as covering them.
 * `the three DISCLOSED holes in resolveChain are pinned` in scripts/check-suite.test.mjs asserts
 * that `--silent`, `npx` and a quoted chain currently produce NO finding. Without it, a future
 * narrowing of the regex would be indistinguishable from the hole documented here — both look like
 * "this case does not fire" — so the test exists to make the difference visible in a diff. If one
 * of these shapes ever appears in package.json, widen this function and turn that case positive.
 *
 * Returns [{ name, command }] starting with `name` itself. An unknown name returns [].
 */
function resolveChain(scripts, name) {
  const chain = [];
  const seen = new Set();
  let current = name;

  while (current && Object.prototype.hasOwnProperty.call(scripts, current) && !seen.has(current)) {
    seen.add(current);
    const command = String(scripts[current]);
    chain.push({ name: current, command });
    const m = DELEGATION.exec(command.trim());
    current = m ? m[1] : null;
  }

  return chain;
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

  // A STEP that is itself a shell chain is this file's own defect, one level down. `check:ledger`
  // was six links behind one name: `&&` stopped at the first failure, the runner reported one
  // failed step, and `ledger lint`, `ledger build --check` and `ledger verify` had not run. The
  // runner cannot see inside a step — it spawns `npm run <step>` and reads one exit code — so the
  // only place this is catchable is here, on the command string.
  //
  // THE CHECK IS ON THE RESOLVED COMMAND, NOT THE STEP'S OWN STRING, and it covers every operator
  // rather than `&&`. Until 2026-08-26 it was `String(scripts[step]).includes('&&')`, which three
  // one-line mutations walked straight past — `;`, `||` and `|` each returned zero findings — and
  // which one wrapper script defeated outright. `;` is the dangerous one: `&&` at least reddens
  // the step, while a `;` chain hands back the LAST command's exit code and the failure is gone.
  for (const step of steps) {
    if (!has(step)) continue;
    for (const link of resolveChain(scripts, step)) {
      const ops = shellOperators(link.command);
      if (!ops.length) continue;

      const list = ops.map((op) => `\`${op}\``).join(', ');
      const where =
        link.name === step
          ? `whose command carries ${ops.length > 1 ? 'shell operators' : 'the shell operator'} ${list}`
          : `which delegates to "${link.name}", whose command carries ` +
            `${ops.length > 1 ? 'shell operators' : 'the shell operator'} ${list}`;

      failures.push(
        `STEPS names "${step}", ${where}: ${link.command}. A step is ONE command and the runner reads ONE ` +
          `exit code from it — a wrapper does not change that. \`&&\` stops at the first non-zero exit so the ` +
          `later links never run; \`;\`, \`|\` and \`&\` are worse, because the step's exit code becomes the ` +
          `last command's and the failure disappears entirely (\`bash -c 'false ; true'\` exits 0); \`||\` ` +
          `passes the step whenever the fallback passes. Give each link its own script and its own entry in ` +
          `STEPS, and keep "${step}" — if a doc cites it — as an alias in EXCLUDED.`
      );
    }
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

module.exports = {
  STEPS,
  EXCLUDED,
  GOVERNED,
  RUNNER,
  SHELL_OPERATORS,
  scriptGraph,
  reachable,
  aliasLinks,
  shellOperators,
  resolveChain,
  auditSuite,
};
