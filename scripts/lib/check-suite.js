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
  'check:ci-chains':
    'AN ENTRY POINT, NOT A SECOND PLACE THE CHECK RUNS. The blocking assertion is the chain case in ' +
    'scripts/check-suite.test.mjs, which is `test:check-suite` — a STEP of this suite, with a step of its ' +
    'own on a runner. This script calls the same pure ciChainFindings() so a contributor can see the ' +
    'findings without running the whole test file, and so the predicate has a library behind it rather ' +
    'than living only inside a test. It is OUT of the suite because putting it in would assert one ' +
    'property twice under two names, and the second name is the one that goes stale unnoticed. ' +
    'PROMOTING IT TO A STEP would need a matching workflow step, which this change deliberately did not ' +
    'add: the workflow directory was out of scope for the brief that produced it. FALSIFY THIS: break ' +
    'the predicate and confirm `npm run test:check-suite` goes red without this entry point being run ' +
    'at all — if it does not, the coverage claim above is wrong and this entry must not survive.',
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
 * Split what shellOperators() returned into the two kinds of finding it can produce.
 *
 * `operators` mean "this is more than one command". `unmodelled` means "this checker cannot tell",
 * which is not the same statement and does not take the same remedy — so the two call sites that
 * report them, auditSuite() here and ciChainFindings() below, must not each re-derive the split.
 * Written out twice, two lists of one thing disagree silently; that is the defect that put `$1` in
 * the `$`-vocabulary and not in ARITH_OPERAND.
 */
function splitFindings(findings) {
  return {
    operators: findings.filter((t) => SHELL_OPERATORS.includes(t)),
    unmodelled: findings.filter((t) => !SHELL_OPERATORS.includes(t)),
  };
}

/**
 * The bar a written exemption has to clear, spelled once.
 *
 * EXCLUDED entries and CI_CHAINS_ALLOWED entries are the same governance mechanism pointed at two
 * files: an exemption a reader can disagree with instead of guessing at. They each carried their
 * own `40`, so raising the bar in one would have raised it in one.
 */
const REASON_MIN_LENGTH = 40;
const hasSubstantiveReason = (reason) =>
  typeof reason === 'string' && reason.trim().length >= REASON_MIN_LENGTH;

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
 *     <(   PROCESS SUBSTITUTION, and it is the worst of them: the inner command's exit status does
 *     >(   not reach the outer exit code AT ALL. Measured 2026-08-26 —
 *          `cat <(false; echo INNER_RAN); echo exit=$?` prints INNER_RAN then `exit=0`, and
 *          `true <(exit 7); echo exit=$?` prints `exit=0`. Where `;` at least hands back the LAST
 *          command's status, this hands back a status the inner command never touched. Added
 *          2026-08-26: until then `npm run good <(npm run bad)` returned [] — a complete bypass.
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
const SHELL_OPERATORS = ['&&', '||', ';', '|', '&', '<(', '>(', '\\n'];

/**
 * Where a `$((` at `open` really ends, IF it ends as `))`. Returns that index, or -1.
 *
 * `$((` DOES NOT MEAN ARITHMETIC. It means arithmetic only when the region closes with `))`;
 * otherwise bash reads it as command substitution wrapping a subshell — `$( (cmd); rest )` — and
 * runs every command in it. Measured 2026-08-26, and this is the whole rule:
 *
 *     echo "$((echo RAN); echo RAN2)"    RAN / RAN2, exit 0    BOTH RAN — no `))` anywhere
 *     echo "$((exit 7); echo RAN2)"      exit 0                the 7 is LAUNDERED
 *     echo "$((a|b); echo RAN2)"         a, b run as commands through a PIPE, then RAN2
 *     echo "$((echo RAN))"               exit 1                arithmetic syntax error, nothing ran
 *     echo "$(( (echo RAN) ))"           exit 1                "missing `)'" — still arithmetic
 *
 * So the previous predicate — "the parens balance" — granted non-command status to the exact case
 * that IS a command context, and one step shaped `echo "$((npm run a); npm run b)"` returned zero
 * findings from this function, from auditSuite() and from the ci.yml check at once. THE SPECIAL
 * CASE ADDED TO AVOID FIRING ON `$((6|1))` WAS ITSELF THE BYPASS; that is the general shape, and it
 * is why granting the exemption now takes two independent checks that must both agree.
 *
 * This is the STRUCTURAL one: the `(` at `open + 1` must be closed by the `)` immediately before
 * the one that closes `open`. `$((6|1))` satisfies it; `$((echo RAN); echo RAN2)` closes its inner
 * paren early and does not. isArithmeticBody() is the second, on the text between them.
 *
 * -1 is also what an unbalanced `$((` gets, for the same reason as before: treating a typo as
 * opaque would make it the one place a chain could still hide.
 */
function arithmeticEnd(src, open) {
  let depth = 0;
  let innerClose = -1;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '(') depth += 1;
    else if (src[i] === ')') {
      depth -= 1;
      if (depth === 1 && innerClose === -1) innerClose = i;
      if (depth === 0) return i === innerClose + 1 ? i : -1;
    }
  }
  return -1;
}

/**
 * Characters that never appear in a bash arithmetic expression, each of which can start or separate
 * a command.
 *
 * `#` IS FORBIDDEN ONLY WHEN IT IS NOT `$#`. It begins a comment in command context, which is why
 * it is here at all — but `$#` is an ordinary arithmetic operand, and bash prints 3 for
 * `set -- a b c; echo "$(($#|1))"`. Banning it outright made this rule refuse correct code. The
 * lookbehind-free form `(?:^|[^$])#` keeps base-N notation refused, because the `#` in `16#ff` is
 * preceded by a digit — pinned, since that refusal is a deliberate over-report with its own case.
 */
const ARITH_FORBIDDEN = /[;`'"\\\n\r]|(?:^|[^$])#/;
/**
 * A number, an identifier, `$name`, or `${name}`.
 *
 * The numeric branch carried `[\w#]` for base-N notation until 2026-08-26. THAT `#` WAS
 * UNREACHABLE: ARITH_FORBIDDEN rejects the whole body before this pattern ever runs, because `#`
 * begins a comment in command context. Removing it changes nothing and puts the base-N refusal in
 * one place — `$((16#ff&1))` is refused by ARITH_FORBIDDEN, and the case asserting that says so.
 */
/**
 * The special parameters, spelled ONCE and consumed by both places that need them.
 *
 * isModelledDollar() enumerates them as the `$`-vocabulary; ARITH_OPERAND needs the same set,
 * because `$?` and `$1` are ordinary operands inside `$((…))`. Written out twice, the two lists
 * disagree silently — which is this file's own recurring defect, and it is exactly how
 * `echo "$(($1|1))"` came to be reported as a pipe while bash printed 7.
 */
const SPECIAL_PARAMETERS = '@*?-$!#';

/** The same set as a character class. Built from the string so the two cannot drift apart. */
const SPECIAL_PARAMETER_CLASS = `[${SPECIAL_PARAMETERS.replace(/[-\]\\^]/g, '\\$&')}]`;

// `$1` and `$@` come BEFORE the `$?name` alternative so that `$name` and `${name}` match exactly as
// they did — the new branch cannot reach a name, because a digit run and a special parameter are
// disjoint from `[A-Za-z_]`.
const ARITH_OPERAND = new RegExp(
  `^(?:\\$?\\{\\s*[A-Za-z_]\\w*\\s*\\}|\\$(?:\\d+|${SPECIAL_PARAMETER_CLASS})|\\$?[A-Za-z_]\\w*|\\d\\w*)`
);
/** Unary, where an operand is expected. */
const ARITH_PREFIX = /^(?:\+\+|--|[-+!~])/;
/**
 * Binary, where an operator is expected. `?` and `:` are handled separately so they must pair.
 *
 * ORDERED LONGEST-FIRST, and that ordering is load-bearing rather than tidy: alternation takes the
 * FIRST match, so the two-pipe alternative has to precede the compound-assignment class or `||`
 * would be read as `|` followed by junk, and `<<=` has to precede `<<`. Verified by execution on
 * the inputs that discriminate — `||` matches `||` and not `|`, `|=` matches `|=`, `&=` matches
 * `&=`, `<<=` matches `<<=`. (The class is not spelled in this comment because it contains the
 * two characters that end a block comment.)
 *
 * Compound assignment was missing until 2026-08-26, so `$((x|=2))` — which bash evaluates to 3 —
 * was reported as a pipe.
 */
const ARITH_INFIX = /^(?:\*\*=|<<=|>>=|\*\*|<<|>>|<=|>=|==|!=|&&|\|\||[-+*/%&|^]=|[-+*/%&|^<>=,])/;

/**
 * Does the text between `$((` and `))` read as arithmetic bash would evaluate?
 *
 * THE SECOND, INDEPENDENT CHECK, and it exists because the structural one above is a rule about
 * parentheses and this file has now been bitten twice by a rule about parentheses. Measurement says
 * a region closing in `))` is arithmetic — bash errors rather than falling back, on every shape
 * probed — so structurally this is belt and braces. It is written anyway because the asymmetry is
 * total: a false positive costs one command rewritten without `$((`, a false negative is a complete
 * bypass of both guards at once, and the last two rounds were both lost on that trade.
 *
 * A CONSERVATIVE ALLOWLIST, and everything outside it FAILS CLOSED to command substitution — where
 * the interior is scanned under normal command rules, so `;`, `&&`, `||` and `|` are reported. What
 * that rejects, deliberately:
 *
 *   `;`, a newline, a backtick, a quote, a backslash, `#`   never arithmetic; each starts or
 *                                                           separates a command
 *   `$(`                                                    a nested command substitution. It is
 *                                                           legal INSIDE arithmetic, but its
 *                                                           interior is command text, so scanning
 *                                                           it costs nothing and reading it as
 *                                                           arithmetic would cost everything
 *   two bare words — `npm run a`                            two operands with only space between
 *                                                           them is not an expression, and this is
 *                                                           the one a character allowlist misses
 *   `:` with no `?`                                         `a:b|c` is an arithmetic syntax error
 *                                                           in bash, measured
 *
 * It also rejects some VALID arithmetic — postfix `x++`, an empty body — and that costs nothing:
 * the fallback scans the body as command text, and a body bash accepts as arithmetic contains no
 * `;` or newline, so the only operators there are `&`/`|` forms, which is exactly what the
 * allowlist below is precise about. Confirm before widening it: a shape whose classification does
 * not change the returned operators does not need to be here.
 */
function isArithmeticBody(body) {
  if (ARITH_FORBIDDEN.test(body) || body.includes('$(')) return false;

  let i = 0;
  let expect = 'operand';
  let depth = 0;
  let ternaries = 0;

  while (i < body.length) {
    const rest = body.slice(i);

    const ws = /^\s+/.exec(rest);
    if (ws) { i += ws[0].length; continue; }

    if (rest[0] === '(') {
      if (expect !== 'operand') return false;
      depth += 1; i += 1; continue;
    }
    if (rest[0] === ')') {
      if (expect !== 'operator' || depth === 0) return false;
      depth -= 1; i += 1; continue;
    }

    if (expect === 'operand') {
      const prefix = ARITH_PREFIX.exec(rest);
      if (prefix) { i += prefix[0].length; continue; }
      const operand = ARITH_OPERAND.exec(rest);
      if (!operand) return false;
      i += operand[0].length;
      expect = 'operator';
      continue;
    }

    if (rest[0] === '?') { ternaries += 1; i += 1; expect = 'operand'; continue; }
    if (rest[0] === ':') {
      if (ternaries === 0) return false;
      ternaries -= 1; i += 1; expect = 'operand'; continue;
    }
    const infix = ARITH_INFIX.exec(rest);
    if (!infix) return false;
    i += infix[0].length;
    expect = 'operand';
  }

  return depth === 0 && ternaries === 0 && expect === 'operator';
}

/**
 * Is the `$` at `i` one of the forms this scanner MODELS?
 *
 * `$(` and `$((` never reach here — they are handled earlier and consume themselves. What is left
 * is the rest of bash's expansion surface, enumerated:
 *
 *     $        at end of string, or before whitespace — a literal dollar
 *     ${…}     parameter expansion. Scanned through: its contents are text, and a `$(` inside one
 *              still opens a command frame, so `${x:-$(a;b)}` reports the `;`
 *     $name    a named or positional parameter — no command context
 *     $@ $* $? $- $$ $! $#   the special parameters — likewise
 *     $'…'     ANSI-C quoting — handled at the call site, which is why it is not listed here
 *     $"…"     locale translation — likewise
 *
 * ANYTHING ELSE IS NOT MODELLED, and the caller reports it rather than scanning past it. That is
 * the inversion this function needed: the vocabulary is finite and written down, so an expansion
 * form nobody thought of is a FINDING instead of a silent `[]`.
 */
function isModelledDollar(src, i, inDoubleQuote) {
  const next = src[i + 1];
  if (next === undefined || /\s/.test(next)) return true;
  if (next === '{') return true;
  if (/[A-Za-z0-9_]/.test(next)) return true;
  if (SPECIAL_PARAMETERS.includes(next)) return true;

  // THE ONLY TWO FORMS DOUBLE QUOTES SUPPRESS, and the narrowness is the whole point. Outside
  // quotes these never reach here — the branches at the call site consume them. Inside, they are
  // literal and there is nothing to model. Measured 2026-08-26, every form in one line:
  //
  //     "$[1+2]" -> 3    "${x}" -> 9    "$x" -> 9    "$(echo S)" -> S    "$((1+1))" -> 2
  //     "$'a'"   -> $'a'      "$"  -> $ (the quote ends the string)
  //
  // Everything except those last two EXPANDS inside double quotes, so a gate that skipped the
  // whole class in there certified `echo "result is $[1+2]"` as one clean command — which it is
  // not, and which contradicted this file's own stated guarantee.
  return Boolean(inDoubleQuote) && (next === "'" || next === '"');
}

function shellOperators(command) {
  const src = String(command);
  const found = new Set();
  const unmodelled = new Set();

  // INDICES THE SCAN CONSUMED AS AN ESCAPED CHARACTER. The redirect guard below needs to tell a
  // redirect OPERATOR from a literal `<` or `>` sitting inside a word, and this scan is the only
  // thing that knows the difference — it is what consumed the backslash. Testing the byte instead
  // was a laundering bypass: see the guard.
  const escaped = new Set();

  /** Is `src[j]` one of `chars`, as an OPERATOR this scan recognised rather than an escaped literal? */
  const redirectOperatorAt = (j, chars) => chars.includes(src[j]) && !escaped.has(j);

  // One frame per COMMAND CONTEXT, innermost last. `base` is the command line itself; `$(` pushes
  // a `paren` frame and a backtick a `tick` frame. `parens` counts subshells nested inside a `$(`
  // so that `$( (a; b) )` closes on the right `)` rather than the first one.
  const stack = [{ kind: 'base', quote: null, parens: 0 }];

  // IS THE SCAN AT THE START OF A WORD? Only the `#` branch asks, and it is tracked FORWARD — from
  // what this scan consumed — rather than read backwards off `src[i - 1]`, because the two disagree
  // on exactly the case that decides a comment. Measured 2026-08-26: `echo $(echo x)#y` prints
  // `x#y` (that `)` closed a SUBSTITUTION, so the word continues and `#y` is literal) while
  // `(echo a)#y` prints `a` (that `)` closed a SUBSHELL, so `#y` IS a comment). Both strings end
  // the construct in `)`; only the frame stack tells them apart, and a backwards byte test cannot.
  let atWordStart = true;

  for (let i = 0; i < src.length; i += 1) {
    const frame = stack[stack.length - 1];
    const c = src[i];

    // Every branch below leaves the scan MID-WORD unless it says otherwise. The exceptions say so
    // at their own branch — the control operators, the openers that begin a fresh command — and the
    // metacharacter rule at the BOTTOM of this loop catches whitespace and the characters that have
    // no operator branch at all.
    const wordStart = atWordStart;
    atWordStart = false;

    // SINGLE QUOTES ARE OPAQUE, backslash and all — `echo '$(exit 7; exit 0)'` prints the text and
    // runs nothing. This branch is first because it must win over every branch below it.
    if (frame.quote === "'") {
      if (c === "'") frame.quote = null;
      continue;
    }

    // A backslash escapes the next character, quoted or not — `echo a \; b` prints `a ; b`, one
    // command. Inside double quotes it is also what stops an ESCAPED substitution from opening a
    // frame: `"\$(exit 7; exit 0)"` and "\`exit 7; exit 0\`" both print literally and run nothing.
    if (c === '\\') { escaped.add(i + 1); i += 1; continue; }

    // ARITHMETIC — checked before `$(` so the longer token wins, and inside double quotes too,
    // where `"$((6|1))"` is just as much a number. TWO INDEPENDENT CHECKS MUST BOTH AGREE before
    // the exemption is granted: the region has to close as `))`, and the text between has to read
    // as arithmetic. Either one failing falls through to `$(` below, where the interior is scanned
    // as commands — the safe direction, and the one the balance-only predicate got wrong.
    if (c === '$' && src[i + 1] === '(' && src[i + 2] === '(') {
      const end = arithmeticEnd(src, i + 1);
      if (end !== -1 && isArithmeticBody(src.slice(i + 3, end - 1))) {
        stack.push({ kind: 'arith', quote: null, parens: 2 });
        i += 2;
        continue;
      }
    }

    // COMMAND SUBSTITUTION — the hole. Both spellings open a frame from ANY non-single-quoted
    // context, INCLUDING from inside arithmetic, which is where the first cut of this fix leaked.
    if (c === '$' && src[i + 1] === '(') {
      stack.push({ kind: 'paren', quote: null, parens: 1 });
      i += 1;
      atWordStart = true; // a fresh command starts inside, so a `#` immediately after it is a comment
      continue;
    }
    if (c === '`') {
      // Backticks do not nest — the same character opens and closes — so this pops or pushes.
      // OPENING one starts a command; CLOSING one does not, because the substitution's result is
      // part of the surrounding word — measured, \`echo \`echo x\`#y\` prints `x#y`, not `x`.
      if (frame.kind === 'tick') stack.pop();
      else { stack.push({ kind: 'tick', quote: null, parens: 0 }); atWordStart = true; }
      continue;
    }

    // ── THE VOCABULARY GATE, and it is the reason this function stopped being a sequence of ──────
    // patches. Everything above models a construct by name. `$` introduces the rest of bash's
    // expansion surface, and that surface is the ONE place this scanner can UNDER-report: inside
    // a form whose quoting rules it does not know, its quote parity desyncs from the shell's and a
    // real chain comes back as `[]`. Measured 2026-08-26, and this is the third instance of that
    // exact shape:
    //
    //     bash -c "echo $'a\'b'; echo SECOND_RAN"     a'b / SECOND_RAN, exit 0 — TWO COMMANDS
    //     shellOperators("echo $'a\'b'; npm run x")   []  — the `;` was swallowed
    //
    // Inside `$'…'` a `\'` is an ESCAPED QUOTE that does not close the string; a scanner that
    // toggles on every bare `'` closes early, and every character after it is read in the wrong
    // state. Modelling ANSI-C quoting would fix that one case and leave the surface open, so the
    // rule is inverted instead: what is modelled is enumerated, and everything else is reported.
    //
    // IT RUNS INSIDE DOUBLE QUOTES TOO, and getting that wrong was a whole round. This block sat
    // BELOW the double-quote early exit, justified by one true measurement — `echo "$'a'"` prints
    // `$'a'` literally, so flagging it there would fire on correct code. That fact is about `$'`
    // and `$"`. It is NOT about `$`: measured, `echo "$[1+2]"` prints 3. Skipping the whole class
    // inside quotes certified `echo "result is $[1+2]"` as one clean command. A rule established by
    // one construct was applied to its entire class; the suppression is now exactly two forms wide
    // and lives in isModelledDollar(), where it is stated rather than implied by placement.
    //
    // Scanning STOPS at the first unmodelled form. Past it the frame stack describes a string this
    // function does not understand, and operators read out of a desynced state would be guesses
    // presented as findings. What was found BEFORE it is kept and returned alongside.
    //
    // THE TWO FORMS THAT PROMPTED THE GATE ARE ALSO MODELLED, and both together is the point: the
    // gate is what makes the guarantee stateable, and modelling these two is what keeps the gate
    // from firing on the shapes it was written for. Each was measured rather than looked up.
    //
    //     $'…'   Literal text with backslash escapes and NO expansions — `echo $'a$(echo X)b'`
    //            prints `a$(echo X)b`. It ends at the first UNESCAPED `'`: `echo $'a\'b'` prints
    //            `a'b`, and `echo $'a\\'` prints `a\`, so an escaped backslash does let the next
    //            quote close. Skipped whole, which is exact, because nothing in it runs.
    //     $"…"   A double-quoted string that is also translated. Same quoting and the SAME
    //            expansions — `echo $"a$(echo X)b"` prints `aXb`, `$"a\"b"` prints `a"b`, and a
    //            `;` inside is literal. So it is the double-quote frame with one extra character.
    const inDoubleQuote = frame.quote === '"';

    if (c === '$' && !inDoubleQuote && src[i + 1] === "'") {
      let j = i + 2;
      while (j < src.length && src[j] !== "'") { if (src[j] === '\\') j += 1; j += 1; }
      i = j; // the closing quote, or the end of an unterminated one — which bash refuses to run
      continue;
    }
    if (c === '$' && !inDoubleQuote && src[i + 1] === '"') { frame.quote = '"'; i += 1; continue; }

    if (c === '$' && !isModelledDollar(src, i, inDoubleQuote)) {
      unmodelled.add(`$${src[i + 1]}`);
      break;
    }
    // `$$` IS ONE FORM, so its second `$` must not be re-read as the start of another. Without this
    // the scan reached `$|` in `$(($$|1))` and reported an unmodelled construct for a body bash
    // evaluates to a process id — the gate firing on correct code, which is how a gate gets
    // deleted. It is the only vocabulary member that is itself a `$`.
    if (c === '$' && src[i + 1] === '$') { i += 1; continue; }

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
      if (c === '(') { frame.parens += 1; atWordStart = true; continue; }
      if (c === ')') {
        frame.parens -= 1;
        if (frame.parens === 0) stack.pop();
        continue;
      }
    }

    // ARITHMETIC IS NOT A COMMAND CONTEXT. Reached only after the branch above, so a `$(` nested
    // inside arithmetic has already opened a command frame and is reported from there.
    if (frame.kind === 'arith') continue;

    // ── `#`, A COMMENT — MODELLED, NOT REFUSED, and that choice was re-derived for this construct
    // rather than inherited from the `$`-vocabulary gate above. Failing closed on `#` would report a
    // finding for every ordinary script carrying a comment, which is the trade this file already
    // refuses ("a rule that fires on correct code gets weakened rather than obeyed") — and it would
    // not even fix the defect, because the defect is not the `#`. It is that an APOSTROPHE inside a
    // comment opened a real single-quote frame and swallowed everything after it. Measured
    // 2026-08-26 against the code this replaces:
    //
    //     bash -c "npm run test:foo # don't forget this<NL>npm run bad ; npm run worse"
    //                                                    runs ALL THREE commands
    //     shellOperators(that string)                    []       — the `;` and the \n both gone
    //     shellOperators(it, with the apostrophe removed)  [';', '\n']
    //
    // Modelling it costs nothing measurable HERE AND NOW: zero of the 114 governed commands — 70
    // package.json scripts plus 44 ci.yml `run:` values — contains a `#` at any position, so this
    // changes no live verdict. It is the future comment that this is written for.
    //
    // IT BEGINS A COMMENT ONLY AT THE START OF A WORD. `echo a#b` prints `a#b`, and `wordStart` is
    // the only thing that knows the difference — WHICH IS ALSO THE WHOLE OF THE PROTECTION, stated
    // that way because the first draft of this comment claimed otherwise. It said quoting and
    // arithmetic were handled "by the branches above", and two mutations refuted it: moving this
    // branch above the `arith` continue killed no test, and neither did moving it above the
    // double-quote early exit. Neither placement matters, because nothing inside a quote and no
    // operand of an arithmetic body ever leaves the scan AT a word start — `echo $((2#101))` prints
    // 5 and that `#` follows a digit; `echo "x"#y` prints `x#y` and that one follows a quote. The
    // placement is where a reader expects it; `wordStart` is what makes it correct.
    //
    // The PROCESS SUBSTITUTION branch below is the opposite case, and the contrast is why both are
    // written down: its position under the `arith` continue IS load-bearing, and the mutation that
    // moves it up turns `echo $((1<(2)))` — which prints 1 — into a finding.
    //
    // The scan resumes ON the newline, not past it, so the branch below still records `\n`. A
    // comment ends a line; it does not merge two.
    if (c === '#' && wordStart) {
      const rest = src.slice(i).search(/[\n\r]/);
      if (rest === -1) break; // the comment runs to the end of the string — nothing follows it
      i += rest - 1;
      continue;
    }

    // ── PROCESS SUBSTITUTION — MODELLED **AND** REPORTED. That is two decisions, and each was made
    // for this construct on its own measurement.
    //
    // MODELLED rather than added to the unmodelled set, because unlike `$'…'` the interior genuinely
    // IS a command list — `cat <(echo A; echo B)` prints A and B — so entering it keeps quote parity
    // in sync with the shell's and reports an inner chain as well as the construct.
    //
    // REPORTED rather than merely entered, and this half is easy to leave out: pushing a frame and
    // saying nothing would still return [] for `npm run good <(npm run bad)`, which is the exact
    // verdict being fixed. The construct hides a whole command by itself, even when what is inside
    // it is a single one, so it belongs in SHELL_OPERATORS — see the measurement in that list's
    // header for why it is the worst member of it rather than a peer of `;`.
    //
    // NO `!escaped.has(i)` GUARD HERE, and its absence is the considered half. The redirect guard
    // below needs one because it asks about a NEIGHBOUR index; this branch asks about the current
    // one, and `escaped` only ever holds indices the loop SKIPS — the backslash branch does
    // `escaped.add(i + 1); i += 1`, so an escaped character never gets its own iteration and
    // `escaped.has(i)` is unconditionally false here. It was written with the guard first; the
    // mutation that deleted it killed no test, because there is no input that reaches it. An
    // always-true condition that reads as a safety check is worse than none.
    //
    // The behaviour it was meant to produce holds anyway and is pinned: `echo \<(x)` returns [],
    // through the backslash branch. bash refuses that string outright — it is a SYNTAX ERROR — so
    // there is no command behind the empty verdict. `<\(` is a different string and correctly not
    // matched here: it is a redirect from a file named `(x)`, which is one command.
    //
    // Reached only after the `arith` continue above, which is load-bearing rather than incidental:
    // `echo $((1<(2)))` prints 1, so inside arithmetic `<(` is a comparison against a parenthesised
    // operand and not a substitution at all.
    if ((c === '<' || c === '>') && src[i + 1] === '(') {
      found.add(`${c}(`);
      stack.push({ kind: 'paren', quote: null, parens: 1 });
      i += 1;
      atWordStart = true;
      continue;
    }

    if (c === '&' && src[i + 1] === '&') { found.add('&&'); i += 1; atWordStart = true; continue; }
    if (c === '|' && src[i + 1] === '|') { found.add('||'); i += 1; atWordStart = true; continue; }
    if (c === '|') { found.add('|'); atWordStart = true; continue; }
    if (c === ';') { found.add(';'); atWordStart = true; continue; }
    // A `&` ADJACENT TO `>` IS A REDIRECT, NOT BACKGROUNDING — `2>&1`, `>&2`, `&>log`. It does not
    // hide a command and it does not touch the exit code: `bash -c 'false 2>&1'` exits 1. Reporting
    // it would attach this rule's message — "the step's exit code becomes the last command's" — to a
    // case where that sentence is simply false, and a rule that fires on correct code with a wrong
    // explanation is one someone deletes rather than obeys. Latent when fixed 2026-08-26: no script
    // in the tree used the shape. A pipe alongside a redirect is still reported, on the pipe.
    // `<&` IS THE INPUT SIDE OF THE SAME THING — `0<&3`, `3<&-`, `exec 3<&0` duplicate or close an
    // input descriptor and run one command, and each exits 0. Only on the left for `<`, never
    // `src[i + 1] === '<'`: `&<` is not a bash construct, so exempting it would widen this for
    // nothing. Adjacency with NO whitespace tolerance is what keeps `npm run a < file & npm run b`
    // reported on its real trailing `&`.
    //
    // IT ASKS WHETHER THAT CHARACTER WAS A REDIRECT OPERATOR, NOT WHETHER IT WAS THAT BYTE, and
    // the difference was a laundering bypass. A backslash-escaped `<` is a LITERAL `<` inside a
    // word — the escape branch above consumes the backslash and leaves the `<` at `src[i - 1]` —
    // so the `&` after it is a real control operator. Measured with a marker oracle, where a
    // laundered chain is both markers present AND exit 0:
    //
    //     LEFT \<& RIGHT      exit 0, both ran   LEFT's exit 7 is GONE
    //     LEFT \<\<& RIGHT    exit 0, both ran
    //     LEFT \>& RIGHT      exit 0, both ran   the `>` arm, wrong the same way since it was written
    //
    // The `<` arm was introduced here and made the scan strictly worse than before it; the `>` arm
    // had the defect from the start. One predicate covers both, because fixing half a class is
    // how the other half gets forgotten.
    if (c === '&' && (redirectOperatorAt(i - 1, '<>') || redirectOperatorAt(i + 1, '>'))) continue;
    if (c === '&') { found.add('&'); atWordStart = true; continue; }
    if (c === '\n' || c === '\r') { found.add('\\n'); atWordStart = true; continue; }

    // WHAT REACHES HERE: ordinary word characters, whitespace, and the metacharacters that have no
    // operator branch of their own — `(` and `)` at the base frame, and `<`/`>` used as redirects.
    // Bash starts a word after every one of them, so a `#` next is a comment. One probe per
    // character, 2026-08-26, and each is the shape that discriminates:
    //
    //     echo a #b     -> a                 whitespace
    //     echo a;#b     -> a                 `;`
    //     echo a&#b     -> a                 `&`
    //     echo a|#b     -> SYNTAX ERROR      the pipe lost its right side to the comment
    //     echo a>#f     -> SYNTAX ERROR      same, the redirect lost its target
    //     (echo a)#y    -> a                 `)` closing a subshell
    //
    // Against which `echo a#b` -> `a#b`, `echo a=#b` -> `a=#b` and `echo -#b` -> `-#b` are NOT
    // comments and must stay mid-word — they reach here on their own first character and fail this
    // test, which is why the rule is a character CLASS and not "anything that is not a letter".
    if (/[\s|&;()<>]/.test(c)) atWordStart = true;
  }

  // Operators first in their canonical order, then the unmodelled constructs. Both are reasons the
  // command is not certifiably one command; `SHELL_OPERATORS.includes(t)` tells a caller which kind
  // it is holding, and the two carry different remedies so they carry different messages.
  return [...SHELL_OPERATORS.filter((op) => found.has(op)), ...[...unmodelled].sort()];
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
 * SUPERSEDED 2026-08-26, and it had inverted. This paragraph read: "`check:ledger` runs
 * test:claims/test:classifier/test:ledger, `check:dispatch` runs test:dispatch, `check:warroom`
 * runs test:warroom, `check:memory` runs test:memory, `check:dispatch-prompt` runs
 * test:dispatch-prompt — those five are reached and must NOT be duplicated into STEPS to satisfy
 * the guard." Measured against the tree it describes, all five are reached = FALSE. They were split
 * into their links, which are steps of their own — six for check:ledger, six of six in STEPS — and
 * the five parents became EXCLUDED aliases precisely BECAUSE nothing reaches them. auditSuite()
 * now fails an EXCLUDED entry the suite does reach, so a reader following the old text would have
 * concluded those five entries were the defect.
 *
 * WHY THE WALK STILL MATTERS, which is what the paragraph was for: the alias check depends on it.
 * An alias is excused from the suite because its links are in it, and that is only checkable by
 * walking. Every STEP is a single command today, so reach over the real tree returns the steps
 * themselves and the property would pass vacuously against it — `transitive reach still counts` in
 * scripts/check-suite.test.mjs proves the mechanism against a constructed graph instead.
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
      const findings = shellOperators(link.command);
      if (!findings.length) continue;

      const { operators: ops, unmodelled } = splitFindings(findings);

      // A CONSTRUCT THE SCANNER DOES NOT MODEL IS NOT A PASS, and it is not an operator either —
      // different cause, different remedy, so it does not borrow the operator message. There is no
      // per-step exemption for it on purpose: EXCLUDED governs reachability, not chains, and a step
      // that needs an exotic quoting form can be given its own script instead.
      if (unmodelled.length) {
        const list = unmodelled.map((u) => `\`${u}\``).join(', ');
        const via = link.name === step ? '' : ` (through "${link.name}")`;
        failures.push(
          `STEPS names "${step}"${via}, whose command contains ${unmodelled.length > 1 ? 'constructs' : 'a construct'} ` +
            `this checker does not model: ${list} — ${link.command}. It CANNOT be certified as one command. Inside a ` +
            `form whose quoting rules the scanner does not know, its quote parity desyncs from the shell's and a real ` +
            `chain comes back with NO findings at all: measured, \`echo $'a\\'b'; echo SECOND\` runs both commands ` +
            `because the \`\\'\` does not close the string. Rewrite the command without it, or give the exotic part its ` +
            `own script and its own entry in STEPS.`
        );
      }

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
          `passes the step whenever the fallback passes; \`<(\` and \`>(\` are worse than all of them, because ` +
          `the substituted command's status is not merged, masked or last — it is DISCARDED, and ` +
          `\`bash -c 'true <(exit 7); echo exit=$?'\` prints exit=0. Give each link its own script and its own entry in ` +
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

    if (!hasSubstantiveReason(reason)) {
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


// ── ci.yml, the OTHER file that runs these checks ────────────────────────────────────────────────
//
// MOVED HERE 2026-08-26 from scripts/check-suite.test.mjs, where all of it lived. That broke the
// lib/test separation this very file enforces on the package.json side: the parser, the allowlist
// and the chain predicate were assertions with no library behind them and no way to run them except
// by running 48 tests. `npm run check:ci-chains` is the entry point; ciChainFindings() stays PURE
// over both of its inputs so a test can drive it against MUTATED workflow text and watch it fail.
//
// The functions below take the workflow as a STRING and never read the filesystem — that is what
// makes the mutation proofs possible, and it is why CI_PATH and the file read stayed in the test.

/** The guard, spelled once. `!cancelled()` and not `always()`: a cancelled run must actually stop. */
const CI_GUARD = '${{ !cancelled() }}';

/**
 * The marker that says a finding is a REFUSAL rather than a chain, spelled once and exported.
 *
 * scripts/check-ci-chains.mjs prints a different remedy for each kind, and until 2026-08-26 it
 * chose by testing whether the message contained the words "cannot decode" — dispatching on a
 * substring of a generated English sentence, so rewording the message would have silently switched
 * every reader onto the wrong instruction. A constant both sides import cannot drift that way.
 */
const UNPARSED_PREFIX = 'UNPARSED:';


/**
 * The four keys a step is read for, spelled once — and the two whose VALUE is safety-bearing.
 *
 * `key in step` was the test until 2026-08-26, and it meant every field the PARSER hangs on a step
 * — `line`, and now `unparsed` — was also a YAML key a workflow could write into.
 *
 * NOT A DE-DUPLICATION, and the JSDoc here claimed to be one until 2026-08-26. The object literal
 * in the loop below still spells `name`, `run`, `uses`, `if` because it also carries `line` and
 * `unparsed`, which are not YAML keys and must not be recordable; building it from this list would
 * have to add them back one at a time. One list, two spellings, and this line is the reason they
 * are allowed to differ rather than a claim that they do not.
 *
 * SAFETY_KEYS is the narrower list, and the narrowness was derived rather than assumed. A wrong
 * `run:` hides a shell chain; a wrong `if:` hides a step with no `!cancelled()` guard — both are
 * compared BY VALUE (`step.if !== CI_GUARD`). `name:` and `uses:` are only ever tested for
 * identity or non-null, so misreading one cannot hide a command. That matters because the refusal
 * below is a CI failure: scoping it to all four would fail a workflow over `name: "Build: step 1"`,
 * which is ordinary, correct, harmless YAML.
 */
const STEP_KEYS = ['name', 'run', 'uses', 'if'];
const SAFETY_KEYS = ['run', 'if'];

/**
 * A `run:`/`if:` value this parser REFUSES to read, because reading it means implementing YAML.
 *
 * ROUND 9, AND THE POINT IS THE DELETION. Round 8 modelled these shapes: quoted flow scalars were
 * unquoted through a 17-entry escape table, and plain multi-line scalars were folded. Both were
 * exact against PyYAML on 42 probes. Both are gone, and this predicate replaces them, because the
 * gate then found a P1 IN THE MODELLING — and the shape of that P1 is the argument:
 *
 *     run: "npm run good <\        real YAML: an escaped line break collapses to NOTHING, so the
 *       (npm run bad)"             value is `npm run good <(npm run bad)` — a process substitution
 *
 *     the fold joined the continuation with a SPACE, then the decode read the leftover `\`+space
 *     as the ordinary escaped-space escape, and the value came out `npm run good < (npm run bad)`
 *     — a phantom space, `<(` never adjacent, ciChainFindings -> []. A SILENT CLEAN on exactly the
 *     construct round 8 added detection for.
 *
 * That is the ninth bypass in this function and the third in the YAML layer. The rule from round 3
 * applies: when a fix is the third of its kind, the defect is the approach. So the approach is
 * inverted the same way the `$`-vocabulary gate inverted it one layer down — DECLARE WHAT IS READ,
 * REFUSE THE REST — and the read set is the census of what the file actually contains: a plain
 * single-line scalar, or a block scalar. Measured 2026-08-26 across all 44 `run:` values in
 * .github/workflows/ci.yml: 44 plain single-line, 0 quoted, 0 multi-line, 0 starting with any
 * indicator below. The refusal changes ZERO live verdicts.
 *
 * THE CHARACTER CLASS IS WIDER THAN "A QUOTE", and that width came from a bypass the quote-only
 * version would have left open. `run: *c`, with `&c npm run a && npm run b` anchored anywhere
 * earlier in the file, is a YAML ALIAS: PyYAML 6.0.3 resolves it to the chain, and this parser read
 * the four characters `*c` and returned []. That was true before round 8 as well as after, so it is
 * a hole this refusal closes rather than one it was written for. `!!str npm run a && npm run b`
 * is the same class through a tag. Both are indicators, so both are refused now.
 *
 * `|` and `>` are NOT here: they reach the block-scalar branch above this check and never get to
 * it. That is deliberate and it is what makes the refusal cost nothing — a block scalar has no
 * escapes and no quoting rules, so ANY command that cannot be a plain scalar can be written as
 * one. Measured: `run: |-` carries `node -e "a: 1" && npm run b`, `npm run a # literal`,
 * `{echo a; echo b;}` and `*glob npm run a` through PyYAML byte for byte, and every one of those
 * is either invalid or differently-parsed as a plain scalar.
 *
 * THE HATCH IS TOTAL; THE READING OF IT IS NOT, and the first version of this passage said only the
 * first half. It read "The escape hatch is total", which is a claim about what is ENFORCED made by
 * a sentence — the defect this repo exists to refuse — and P1-1 of round 9's review proved the
 * gap: a block header carrying an explicit indentation indicator was read WRONG, silently, on
 * `main` as well as here. That shape is refused now, so the two halves agree again; the sentence
 * is left in two parts so the next reader can see which half is the claim and which is the check.
 */
const NON_PLAIN_SCALAR = /^["'&*!%@`{}[\],]/;


/**
 * The steps of ci.yml's one job, read off the indentation.
 *
 * Zero dependencies in this repo means no YAML parser, so this is a line scanner — and it derives
 * both indents from the file rather than hardcoding 6 and 8, so a reindent does not turn it
 * vacuous. It handles a `run: |` block scalar, which nothing in the file uses today; that is the
 * shape a future multi-command step would arrive in, and a scanner that skipped it would report
 * such a step as having no `run:` at all.
 *
 * IT READS EXACTLY TWO SHAPES, and refuses every other one. A `run:`/`if:` value is either a plain
 * single-line scalar — taken verbatim, which is what all 44 of ci.yml's `run:` values are — or a
 * block scalar, joined literally. Anything else is an UNPARSED finding: a value continued onto a
 * following line, and a value beginning with a YAML indicator (see NON_PLAIN_SCALAR).
 *
 * ROUND 8 MODELLED THOSE TWO SHAPES INSTEAD, AND THAT IS WHAT THIS DELETES. It folded plain
 * continuations and unquoted flow scalars through a 17-entry escape table, exact against PyYAML on
 * 42 probes — and the gate found a P1 inside the modelling anyway: a double-quoted value wrapped
 * across an ESCAPED LINE BREAK folded with a space, the leftover `\`+space decoded as the
 * escaped-space escape, and `<(` came out as `< (`. Silent clean, on the construct round 8 existed
 * to detect. Nine bypasses in this file, the last three in this layer; the round-3 rule says the
 * third fix of a kind means the approach is the defect, so the approach is inverted rather than
 * patched again. Refusing cannot under-report: there is no decoding left to get wrong.
 *
 * WHAT REFUSING COSTS, enumerated rather than waved past. A chain inside a quoted scalar was
 * SILENTLY CLEAN before round 8, decoded during it, and is a LOUD finding now. A plain multi-line
 * continuation was SILENTLY DROPPED before, folded during, and is a LOUD finding now. Both are
 * strictly safer than the state this file shipped in for the whole of its life before round 8; what
 * is lost is only the precision of the MESSAGE — "this cannot be read" rather than "this carries
 * `&&`" — and the remedy is actionable either way. Measured cost today: ZERO, across 44 `run:`
 * values, 0 quoted, 0 multi-line, 0 indicator-initial.
 *
 * Returns [{ line, name, run, uses, if, unparsed }] — `null` for a key the step does not carry, and
 * `unparsed` listing the refusals, which ciChainFindings() reports as their own kind.
 */
function parseCiSteps(workflow) {
  const lines = workflow.split('\n');
  const steps = [];
  let stepsIndent = null;
  let itemIndent = null;
  let current = null;
  let block = null; // { key, indent, parts[] } while inside a `key: |` scalar
  let open = null; // { key, keyIndent } while a plain scalar could still be CONTINUED on a later line

  const indentOf = (line) => /^ */.exec(line)[0].length;

  /**
   * Record a refusal against a step, ONCE per key.
   *
   * ONE ENTRY PER KEY, not per offending line: a value split over four lines is one value this
   * parser could not read, and four identical findings would read as four defects. Scoped to
   * SAFETY_KEYS, because this refusal FAILS A BUILD and `name: "Build: step 1"` is correct YAML.
   */
  const refuse = (step, key, why) => {
    if (!SAFETY_KEYS.includes(key)) return;
    if (step.unparsed.some((u) => u.key === key)) return;
    step.unparsed.push({ key, why, value: step[key] });
  };

  const record = (step, text, keyIndent) => {
    // NO `open = null` HERE, and its absence is measured rather than assumed. The first draft reset
    // the watch at the top of this function AND in the loop below, on the reasoning that a key line
    // ends the previous key's. Both are true and they are REDUNDANT: mutating either one alone
    // killed no test, and mutating both together failed with `a with: body was folded into the
    // uses: above it`. Two guards for one rule means neither can be shown to work, so the general
    // one — the loop's, which also covers lines this function never sees — is the one that stayed.
    const m = /^([\w-]+):\s*(.*)$/.exec(text);
    if (!m) return;
    const [, key, rawValue] = m;
    // `with:`, `env:` and friends are not what this asserts on. Returning BEFORE the watch is armed
    // is tidiness rather than correctness, and it is labelled that way because a mutation proved
    // it: arming it here too writes into `step.with` / `step.env`, which nothing reads, and changed
    // nothing on the public surface across 45 inputs. What DOES keep a `with:` body out of the
    // `uses:` above it is the watch reset in the loop, and that one fails a test when removed.
    if (!STEP_KEYS.includes(key)) return;
    // AN EXPLICIT INDENTATION INDICATOR IS REFUSED, and this is round 10's whole change. The header
    // regex accepted `|2`, and then the body's baseline was taken from the FIRST CONTENT LINE
    // instead of from the indicator — so a first line indented DEEPER than the indicator sets a
    // baseline every later line falls short of, and every later line then closes the block.
    // Measured 2026-08-26 on `main` (7f7bddd) and on round 9 (bff6bbe), IDENTICALLY on both, so
    // this is older than Wave 1 and not something this branch introduced:
    //
    //     run: |2            PyYAML -> "    npm run test:gate\n  && npm run some:unreviewed:step\n"
    //       npm run test:gate          (14 spaces)
    //     && npm run some:unreviewed:step   (12 spaces)
    //
    //     this parser -> "npm run test:gate"      ciChainFindings -> []      SILENT CLEAN
    //
    // `>2`, `|2+` and `|-2` do the same; `|9` is invalid YAML outright. REFUSED RATHER THAN
    // HONOURED, which is one more deletion and not one more model — the same trade round 9 made,
    // and the reason it is safe is the same: nothing in ci.yml uses one (0 of 44), and a block
    // scalar without an indicator expresses everything one with an indicator can.
    //
    // CHOMPING STAYS READ, and that was verified here rather than inherited. `|-` and `|+` change
    // only the TRAILING newline — measured, `|-` gives `npm run a\n&& npm run b` and `|+` gives the
    // same plus a trailing `\n` — and a trailing newline is not a second command. Both produce the
    // identical finding on both trees.
    // A BLOCK INDICATOR MAY CARRY A TRAILING YAML COMMENT — `run: | # note` is valid, and PyYAML
    // reads it as a block scalar. Without the comment arm this pattern missed it and the value was
    // read as the plain scalar `| # note`, which `main` still does today: it reports a phantom
    // `` `|` `` operator on a one-command step. The block branch is FIRST, which is what keeps `|`
    // and `>` out of NON_PLAIN_SCALAR: they are the two indicators this parser does read, and they
    // are the escape hatch that makes refusing the others cost nothing.
    //
    // ONE PATTERN, AND THE HEADER IS CAPTURED — both halves fix a live defect. Round 10 wrote this
    // as TWO regexes, one spanning the header AND its comment for the refusal test and a narrower
    // one for the read, then applied `/\d/` to the WHOLE value. A digit anywhere in the COMMENT
    // therefore satisfied it, and `run: | # step 2 of 3` was refused with a message stating it
    // carried an indentation indicator — which it does not. That is a regression against round 9,
    // which read all four of these correctly, and it is live rather than theoretical: this repo's
    // own ci.yml comments are dense with numbers. Measured 2026-08-26 before the fix —
    //
    //     | # note                  clean          | # step 2 of 3        REFUSED, falsely
    //     | # 44 sequential checks  REFUSED        |- # bun 1.3.10       REFUSED, falsely
    //     | # see #106              REFUSED        |2 # step 2 of 3      REFUSED, correctly
    //
    // — and the last row is why the test below pins BOTH directions: a case asserting only the
    // refusal passes under the bug that produced it.
    //
    // Capturing also means there is now ONE place that decides whether a value is a block header.
    // Two patterns for one question is how they come to disagree, which is what happened here.
    const header = /^([|>][-+\d]*)(?:\s+#.*)?$/.exec(rawValue);

    // AN EXPLICIT INDENTATION INDICATOR IS REFUSED, tested against the HEADER and not the comment.
    if (header && /\d/.test(header[1])) {
      step[key] = rawValue.trim();
      refuse(step, key, 'its block header carries an explicit indentation indicator, which this parser does not honour');
      return;
    }
    if (header) {
      // `keyIndent` is the column of the KEY, and the block ends at the first non-blank line that
      // is not indented past it. Anchoring to the first CONTENT line instead was a defect: see the
      // loop below.
      block = { key, keyIndent, indent: null, parts: [] };
      step[key] = '';
      return;
    }
    step[key] = rawValue.trim();
    // REFUSED BUT STILL STORED. The raw text stays on the step so `run !== null` keeps meaning
    // "this step runs something" for every other check here; what the refusal buys is that
    // ciChainFindings() reports it and does NOT then scan it, which is the contradiction round 8
    // shipped — a message saying the value was not scanned, printed beside a finding from scanning
    // it.
    if (NON_PLAIN_SCALAR.test(step[key])) {
      refuse(step, key, 'it begins with a YAML indicator, so it is not a plain scalar and this parser does not decode it');
      return;
    }
    open = { key, keyIndent };
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (block) {
      // A BLANK LINE IS CONTENT AND MUST NEVER SET THE BASELINE. It did, and that was the defect:
      // a `run: |` beginning with a blank line took its indent from the NEXT non-blank line, which
      // for a block that has no content at all is the `- name:` of the FOLLOWING step. Reproduced
      // 2026-08-26 on `run: |` / blank / `- name: After`: the parser returned TWO steps where three
      // exist, and After's `name`, `if` and `run` were swallowed into the block's `run` value. Every
      // check here that iterates steps then passes it in silence — including the `!cancelled()`
      // guard, so a genuinely unguarded step becomes undetectable. Dormant only because ci.yml has
      // no block scalar today, which is a property of the input and not of this parser.
      if (!line.trim()) { block.parts.push(''); continue; }
      const indent = indentOf(line);
      if (indent > block.keyIndent) {
        if (block.indent === null) block.indent = indent;
        if (indent >= block.indent) {
          block.parts.push(line.slice(block.indent));
          current[block.key] = block.parts.join('\n').trim();
          continue;
        }
      }
      // Out of the block. NOT consumed — execution falls through to the step parsing below, so a
      // `- name:` on this line opens the next step instead of vanishing into the previous one.
      block = null;
    }

    // A BLANK LINE DOES NOT END A PLAIN SCALAR — measured with PyYAML, `run: npm run a` / blank /
    // `  ; npm run b` is the ONE string `npm run a\n; npm run b`. So the continuation watch has to
    // survive a blank line, or a value split across one is refused on the wrong grounds and, worse,
    // is not refused at all when the continuation then reads as an unrelated line.
    if (!line.trim()) continue;
    // A YAML comment TERMINATES a plain scalar — measured, a continuation line after one is a
    // parse error, not a continuation — so it closes the watch rather than being caught by it.
    if (/^\s*#/.test(line)) { open = null; continue; }

    if (stepsIndent === null) {
      const m = /^( *)steps:\s*$/.exec(line);
      if (m) stepsIndent = m[1].length;
      continue;
    }

    const indent = indentOf(line);
    if (indent <= stepsIndent) break; // out of the steps block

    // ── A CONTINUATION LINE: the value carries on past the line its key is on, so this parser has
    // not seen the whole of it. REFUSED, not folded — folding is what round 8 did and what the P1
    // came out of.
    //
    // THE `continue` IS INERT, and it is labelled that way rather than defended. The first draft of
    // this comment claimed the line must be consumed "or it falls through and is read as something
    // else"; a mutation deleting the `continue` killed no test, and a differential over 58 inputs
    // found none that tells the two apart. It cannot: a line reaching here is deeper than
    // itemIndent + 2, so falling through it would be dropped by the key dispatch anyway. It stays
    // because a line this parser has declared unread should not travel on to code written for key
    // lines — a structural preference, not a correctness claim, and the difference is the point.
    //
    // Armed only by a key record() stored a plain scalar into, so a nested mapping under `with:`
    // still falls through and is dropped as it always was. The guard is `indent > open.keyIndent`
    // and not `>=`: measured, a continuation at the SAME column as its key is a YAML ERROR, so a
    // workflow shaped that way does not run at all. An item line cannot reach here either — `- `
    // sits at itemIndent and every key is at itemIndent + 2 or deeper.
    if (current && open && indent > open.keyIndent) {
      refuse(current, open.key, 'its value continues onto the line(s) below it, so this parser has not read all of it');
      continue;
    }
    // ANY line that is not a continuation ENDS the watch — a key at the step's own indent, the `- `
    // of the next item, or a nested mapping's first line. `with:` is the case that matters and it
    // is in the real ci.yml three times: its body is more indented than the `uses:` above it, and
    // treating that as a continuation would refuse three correct steps. This is the ONLY place the
    // watch is closed; see record() for why there is not a second one.
    open = null;

    if (/^ *- /.test(line) && (itemIndent === null || indent === itemIndent)) {
      itemIndent = indent;
      current = { line: i + 1, name: null, run: null, uses: null, if: null, unparsed: [] };
      steps.push(current);
      record(current, line.slice(indent + 2), indent + 2);
      continue;
    }

    if (current && indent === itemIndent + 2) record(current, line.trim(), indent);
  }

  return steps;
}

/**
 * The `run:` steps that do NOT carry the `!cancelled()` guard, by line number.
 *
 * SPELLED HERE BECAUSE IT WAS SPELLED TWICE. Two copies of this filter lived in
 * scripts/check-suite.test.mjs — one in the block-scalar case, one in the guard case — and the fix
 * below had to land in both or the two would disagree about the same workflow. That is the defect
 * this file names in three other places; it is not allowed a fourth.
 *
 * A STEP WHOSE `if:` COULD NOT BE READ IS NOT REPORTED UNGUARDED, and that exclusion is the fix.
 * `if: "${{ !cancelled() }}"` is a correctly guarded step written with quotes: parseCiSteps refuses
 * the quoted scalar (deliberately — see NON_PLAIN_SCALAR) and leaves the raw text on the step, so a
 * plain `s.if !== CI_GUARD` test then ALSO reported it as carrying no guard. One true finding and
 * one false one about the same line, and the false one says the opposite of what is there.
 *
 * PROVENANCE, because it decides how this reads: `main` (7f7bddd) reports that same step unguarded
 * too — measured — so this is NOT a defect the round-9 deletion introduced. Round 8 masked it as a
 * side effect of unquoting every scalar, and deleting the decode took the mask away. The reasoning
 * that keeps `name:` and `uses:` out of SAFETY_KEYS applies here word for word and was not carried
 * through at the time.
 *
 * NOT FAIL-OPEN, which is the question to ask of any exclusion: a refused `if:` is itself a
 * BLOCKING finding from ciChainFindings(), so `if: "${{ always() }}"` — quoted AND weakened — still
 * fails the build. What changes is that it fails once, with a true message.
 */
function unguardedSteps(workflow, guard = CI_GUARD) {
  return parseCiSteps(workflow)
    .filter((s) => s.run !== null && !s.unparsed.some((u) => u.key === 'if') && s.if !== guard)
    .map((s) => s.line);
}

/**
 * The commands ci.yml actually RUNS — the only text any claim about coverage may be read against.
 *
 * Every check in this section goes through here rather than through the raw file, because ci.yml's
 * comments name the very commands its steps run. On 2026-08-26 a comment naming
 * `npm run check:mc` was enough to satisfy the guard protecting the Mission Control step, and the
 * step could then be deleted in silence.
 */
const ciRunCommands = (workflow) => parseCiSteps(workflow).filter((s) => s.run !== null).map((s) => s.run);

/**
 * ci.yml `run:` values that MAY carry a shell chain, keyed by the EXACT run string.
 *
 * EVERYTHING THE OPERATOR CHECK PROTECTED REACHED IT THROUGH package.json. shellOperators(),
 * resolveChain(), aliasLinks() and auditSuite() only ever saw script bodies found by
 * `resolveChain(scripts, step)`; ci.yml's `run:` text was never fed to any of them. So
 * `run: npm run a && npm run b` written straight into the workflow bypassed package.json and STEPS
 * entirely and reintroduced the silent skip this file exists to close — undetected. Measured
 * 2026-08-26 before this check existed: a chained step appended to ci.yml produced ZERO findings
 * anywhere in the repo, and `;`, `|` and `&` written there would not even have left a red step.
 *
 * KEYED BY THE RUN STRING, NOT THE STEP NAME, and the difference is the point: the command is what
 * is exempted, so editing it re-opens the decision, while renaming a step does not silently move an
 * exemption onto different code.
 *
 * Same three properties EXCLUDED carries in scripts/lib/check-suite.js, for the same reasons — a
 * substantive written reason; no entry exempting a command that carries no chain; and, the one that
 * matters, NO ENTRY THAT MATCHES NO LIVE STEP. An exemption that outlives its step reads as a
 * considered decision and is not one.
 */
const CI_CHAINS_ALLOWED = {
  'bun install --frozen-lockfile --cwd mission-control && npm run check:mc':
    'THE ONE REAL EXCEPTION, and it is setup-then-run rather than a suite hiding behind one exit code. ' +
    '`bun install` is a PREREQUISITE of check:mc, not a check of its own: if it fails, check:mc can ' +
    'only fail differently and less legibly, so `&&` short-circuiting here hides nothing a reader ' +
    'needs — the step still goes red and names the install. Splitting it into two steps would be ' +
    'worse, because every `run:` step in this workflow carries `if: ${{ !cancelled() }}`, so a failed ' +
    'install would NOT stop check:mc running against absent dependencies. This is also the only place ' +
    'check:mc runs at all: EXCLUDED["check:mc"] in scripts/lib/check-suite.js carries the measurement ' +
    '— armed sandbox 344 pass / 1 fail on a loopback bind, unsandboxed 345 pass / 0 fail — and states ' +
    'that ci.yml "is the only place it runs green, so it is the only place it is checked".',
};

/**
 * Findings against ci.yml's `run:` values: an unexempted chain, or an exemption that has rotted.
 *
 * Pure over BOTH inputs, so the test can mutate the workflow or the allowlist and watch it bite. A
 * guard only ever run against a tree where it passes is not evidence, which is this file's whole
 * method.
 */
function ciChainFindings(workflow, allowed = CI_CHAINS_ALLOWED) {
  const findings = [];
  const parsed = parseCiSteps(workflow);

  // A VALUE THE PARSER REFUSED IS ITS OWN KIND OF FINDING, and it carries UNPARSED_PREFIX so a
  // caller can tell the kinds apart without matching a substring of an English sentence — which is
  // what scripts/check-ci-chains.mjs did until 2026-08-26, meaning a reworded message silently
  // changed which remedy it printed. It is not an operator and not an unmodelled shell construct:
  // it is the layer below both saying it could not read the value. There is no allowlist entry for
  // it on purpose — CI_CHAINS_ALLOWED is keyed by the EXACT run string, and a string this parser
  // cannot read is one it cannot key on either.
  const refused = new Set();
  for (const step of parsed) {
    for (const u of step.unparsed) {
      if (u.key === 'run') refused.add(step);
      findings.push(
        `${UNPARSED_PREFIX} ci.yml:${step.line} \`${u.key}:\` was NOT read — ${u.why}. It is not scanned for ` +
          `shell operators, so it cannot be certified as one command: ${u.value}`
      );
    }
  }

  const steps = parsed.filter((s) => s.run !== null);
  const exempt = (run) => Object.prototype.hasOwnProperty.call(allowed, run);

  for (const step of steps) {
    // A REFUSED `run:` IS NOT THEN SCANNED, and this line is the whole of round 8's second P2. The
    // refusal message says the value was not scanned for shell operators; round 8 printed that
    // message and then scanned the raw text anyway, so a single step produced two findings that
    // contradicted each other — and the test asserting on it used `.some()`, which cannot see a
    // second entry. The tests for this branch assert the exact findings ARRAY.
    if (refused.has(step)) continue;
    const found = shellOperators(step.run);
    if (!found.length || exempt(step.run)) continue;
    const { operators: ops, unmodelled } = splitFindings(found);
    // An unmodelled construct is reported as ITS OWN KIND, not as an operator: the scanner cannot
    // certify the step, which is a different statement from "the step chains commands". The
    // allowlist covers both, because a step that genuinely needs one is exempted the same way.
    if (unmodelled.length) {
      findings.push(
        `ci.yml:${step.line} contains ${unmodelled.map((u) => `\`${u}\``).join(', ')}, which this checker does not ` +
          `model, so it cannot be certified as one command — ${step.run}`
      );
    }
    if (ops.length) {
      findings.push(`ci.yml:${step.line} carries ${ops.map((op) => `\`${op}\``).join(', ')} — ${step.run}`);
    }
  }

  const live = new Set(steps.map((s) => s.run));
  for (const [run, reason] of Object.entries(allowed)) {
    if (!live.has(run)) {
      findings.push(`CI_CHAINS_ALLOWED exempts a command no step in ci.yml runs — ${run}`);
      continue;
    }
    if (!shellOperators(run).length) {
      findings.push(`CI_CHAINS_ALLOWED exempts a single command, which needs no exemption — ${run}`);
    }
    if (!hasSubstantiveReason(reason)) {
      findings.push(`CI_CHAINS_ALLOWED has no substantive reason for — ${run}`);
    }
  }

  return findings;
}

/**
 * The two shapes no ci.yml step may run, spelled once.
 *
 * DIRECT_TEST_RUNNER: `node … --test …` runs the same tests WITHOUT
 * `--require ./scripts/protected-write-tripwire.cjs`, which every npm test script carries, so that
 * one step would be unguarded while every other one is and a green run looks identical.
 * `(?![\\w-])` so `--test-reporter=tap` alone is not a hit.
 *
 * AGGREGATE_RUNNER: `npm run check` in ci.yml would nest every step behind ONE exit code — the
 * precise opacity the per-step `if:` guards exist to remove, arriving from the other direction.
 * Right-anchored: `check:curation` and `check:ledger-verify` are not hits.
 */
const DIRECT_TEST_RUNNER = /\bnode\b[^&|;]*--test(?![\w-])/;
const AGGREGATE_RUNNER = /npm run check(?![\w:-])|run-checks\.mjs/;


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
  splitFindings,
  REASON_MIN_LENGTH,
  hasSubstantiveReason,
  CI_GUARD,
  CI_CHAINS_ALLOWED,
  STEP_KEYS,
  SAFETY_KEYS,
  NON_PLAIN_SCALAR,
  UNPARSED_PREFIX,
  parseCiSteps,
  unguardedSteps,
  ciRunCommands,
  ciChainFindings,
  DIRECT_TEST_RUNNER,
  AGGREGATE_RUNNER,
};
