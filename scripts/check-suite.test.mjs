// POSTURE: BLOCKS. Wired into `npm run check` as `test:check-suite`, second in the suite —
// right after the tripwire, because this is the check that says whether the other checks are
// in the suite at all.
//
// scripts/check-suite.test.mjs — the drift guard for `npm run check`, and the mutation gate for
// the runner that replaced its `&&` chain.
//
// WHY THIS FILE EXISTS: the suite was thirty steps joined by `&&`. Step 21, `check:mc`, fails on
// any machine that has not run `bun install` in mission-control/, and `&&` stops there — so nine
// steps never ran, including every safety-hook test and `test:sandbox`, while the output reported
// one failure. The runner fixes the instance. This file fixes the class, in two halves:
//
//   THE DRIFT GUARD — a check:/test: script that exists in package.json but is reachable from
//   nothing in the suite fails here. A future script cannot be added and silently left out.
//
//   THE RUNNER'S BEHAVIOUR — that it keeps going after a failure, tallies honestly, exits
//   non-zero, and does not truncate. Every case CONSTRUCTS the condition in a fixture repo and
//   reads what came back, rather than asserting against the working tree, which would pass or
//   fail for reasons the test did not choose.
//
// WHAT IT ASSERTS, AND WHAT IT LEAVES OPEN:
//   ✓ the guard REFUSES a real package.json with a step removed from STEPS — proved by mutation,
//     not by a green run against a tree where nothing is wrong
//   ✓ the five delegating parents are EXCLUDED aliases and every link they hid is a STEP — this
//     line said the opposite until 2026-08-25 ("transitive reach counts, so check:ledger's three
//     tests are not duplicated into STEPS"), and reaching a script is not running it separately:
//     the parents were `&&` chains, so 18 links reported as 5 steps and the links after a failing
//     one never ran. Transitive reach is still proved, against a constructed graph
//   ✓ a STEP whose RESOLVED command carries any shell control operator is REFUSED — `&&`, `||`,
//     `;`, `|`, `&` and a newline — so the chain cannot return through package.json after being
//     taken out of STEPS, nor through a wrapper script one or more `npm run` hops away, and an
//     alias exemption is refused the moment one of its links leaves the suite.
//     *Superseded 2026-08-26: this line read "a STEP whose command carries `&&`", which is what the
//     guard checked. Four mutations walked past it — `;`, `||`, `|` and a one-hop wrapper, each
//     measured at ZERO findings — and `;` is the worst of them, because `bash -c 'false ; true'`
//     exits 0 and the failure leaves no red step at all.*
//   ✓ ci.yml is PARSED, and the three guarantees of the 2026-08-25 change are asserted against it:
//     every STEPS entry has a step there, every `run:` step carries `if: ${{ !cancelled() }}`, and
//     `continue-on-error` appears as a word in one comment and as a KEY nowhere. Each is proved by
//     mutation, and the parser is cross-checked against raw line counts so it cannot under-read the
//     file into vacuous green
//   ✓ the runner runs a step after an earlier one failed, and says so in the tally
//   ✓ ~200KB of step output survives to the caller through a pipe — the process.exit() defect
//   ✓ a ZERO-step run is refused, and --steps/--root are refused outright without the harness
//     variable. Both are new, and both are here because the runner shipped printing
//     "✓ check suite passed — every step ran." at exit 0 for `node scripts/run-checks.mjs
//     --steps ,` — a green floor from a process that ran nothing, reachable from `npm run check`
//     by appending arguments, in the one place a prompt-injected diff is modelled as steering
//     what the oracle reads
//   ✓ a passing SUBSET says it is a subset and does not print the whole-suite verdict
//   ✓ a real Ctrl+C — SIGINT to the process GROUP, not to the child alone — reaches the
//     INCOMPLETE verdict. It did not before: the parent took Node's default kill while spawnSync
//     had the event loop blocked, so the path the header promises was unreachable for the one
//     case that happens
//   ✓ deleting `lint:agents` from STEPS now fails. GOVERNED matched only check:/test:, so the
//     agent schema linter could leave the suite in silence — and every STEP is now checked for
//     being governed at all, which covers the next prefix rather than the three we thought of
//   ✗ nothing here can check that the pass/fail figures written into EXCLUDED['check:mc'] are
//     TRUE. A regex over the reason string used to pin them, kept passing after they stopped
//     reproducing, and so reported green on exactly the defect it sat next to. The citations are
//     checked instead — ci.yml, .claude/settings.json — because those resolve.
//   ✗ nothing here checks that a step ASSERTS anything. Wiring is not value: a step that exits 0
//     unconditionally passes this file and always will.
//   ✗ nothing here runs the real steps for real. The full-suite verdict IS covered, against a
//     fixture that stubs every STEPS name green — which proves the wording and the count, not the
//     checks. Running them for real is `npm run check` itself, and it takes minutes.
//     *Superseded 2026-08-25: this line said "the real 31 steps". STEPS held 31 only between
//     `test:check-suite` being added and `check:mc` being excluded; derive it, never recall it —
//     `node -e "console.log(require('./scripts/lib/check-suite.js').STEPS.length)"`.*
//     *Superseded 2026-08-26: the count was then written in as 30, twice, and went stale the same
//     way when collapsing the five `&&` aliases took STEPS to 43. It is not written here at all
//     now — the assertions derive it from STEPS, which is the only spelling that cannot rot.*

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  STEPS, EXCLUDED, SHELL_OPERATORS, auditSuite, reachable, aliasLinks, shellOperators, resolveChain,
  CI_GUARD, CI_CHAINS_ALLOWED, parseCiSteps, ciRunCommands, ciChainFindings,
  DIRECT_TEST_RUNNER, AGGREGATE_RUNNER,
} = require('./lib/check-suite.js');

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNNER = path.join(REPO, 'scripts', 'run-checks.mjs');
const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
const scripts = pkg.scripts;

// ── The drift guard, against the real package.json ───────────────────────────────────────────

test('every check:/test: script in package.json is reached by the suite, or excluded with a reason', () => {
  const { failures } = auditSuite({ scripts });
  assert.deepEqual(failures, [], `\n${failures.join('\n')}\n`);
});

test('the guard REFUSES a suite with a step removed — a guard that cannot fail is not evidence', () => {
  const without = STEPS.filter((s) => s !== 'test:sandbox');
  const { failures } = auditSuite({ scripts, steps: without });

  assert.equal(failures.length, 1, `expected exactly one finding, got:\n${failures.join('\n')}`);
  assert.match(failures[0], /"test:sandbox" is a check:\/test: script/);
  assert.match(failures[0], /never run under `npm run check`/);
});

test('the guard REFUSES a package.json that adds an unwired check: script', () => {
  const mutated = { ...scripts, 'check:brand-new': 'node scripts/does-not-matter.mjs' };
  const { failures } = auditSuite({ scripts: mutated });

  assert.equal(failures.length, 1, `expected exactly one finding, got:\n${failures.join('\n')}`);
  assert.match(failures[0], /"check:brand-new"/);
});

test('the guard REFUSES re-inlining the && chain into package.json', () => {
  const mutated = { ...scripts, check: 'npm run lint:agents && npm run test:sandbox' };
  const { failures } = auditSuite({ scripts: mutated, steps: [] });

  assert.ok(
    failures.some((f) => f.includes('no longer runs scripts/run-checks.mjs')),
    `expected a runner finding, got:\n${failures.join('\n')}`
  );
});

test('the guard REFUSES a stale or unreasoned exclusion', () => {
  const gone = auditSuite({ scripts, excluded: { ...EXCLUDED, 'test:deleted-long-ago': 'x'.repeat(60) } });
  assert.ok(
    gone.failures.some((f) => f.includes('no longer a script in package.json')),
    `expected a stale-exclusion finding, got:\n${gone.failures.join('\n')}`
  );

  // Every entry, not a representative one: an exclusion mechanism that accepts an empty reason for
  // the entry someone actually cares about is worse than no exclusion mechanism.
  for (const name of Object.keys(EXCLUDED)) {
    const thin = auditSuite({ scripts, excluded: { ...EXCLUDED, [name]: 'later' } });
    assert.ok(
      thin.failures.some((f) => f.includes(`EXCLUDED["${name}"] has no substantive reason`)),
      `stripping the reason from ${name} did not bite:\n${thin.failures.join('\n')}`
    );
  }

  const live = auditSuite({ scripts, excluded: { ...EXCLUDED, 'test:sandbox': 'y'.repeat(60) } });
  assert.ok(
    live.failures.some((f) => f.includes('but the suite does reach it')),
    `expected a live-exclusion finding, got:\n${live.failures.join('\n')}`
  );
});

test('the guard REFUSES a step naming a script that does not exist, and a duplicated step', () => {
  const ghost = auditSuite({ scripts, steps: [...STEPS, 'test:imaginary'] });
  assert.ok(
    ghost.failures.some((f) => f.includes('which is not a script in package.json')),
    `expected a ghost-step finding, got:\n${ghost.failures.join('\n')}`
  );

  const twice = auditSuite({ scripts, steps: [...STEPS, 'test:sandbox'] });
  assert.ok(
    twice.failures.some((f) => f.includes('more than once')),
    `expected a duplicate-step finding, got:\n${twice.failures.join('\n')}`
  );
});

test('the guard REFUSES deleting lint:agents from STEPS — the prefix that was not governed', () => {
  // GOVERNED read /^(?:check|test):/, so `lint:agents` — the agent schema linter, step 3 of the
  // suite — could be removed from STEPS and this guard stayed GREEN. Reproduced before the fix:
  // auditSuite() returned zero failures. It is the same silent-omission defect as check:mc leaving
  // without an EXCLUDED entry, arriving through the name instead of the list.
  const without = STEPS.filter((s) => s !== 'lint:agents');
  const { failures } = auditSuite({ scripts, steps: without });

  assert.ok(
    failures.some((f) => f.includes('"lint:agents"') && f.includes('never run under `npm run check`')),
    `deleting lint:agents from STEPS did not bite:\n${failures.join('\n') || '(no failures at all)'}`
  );
});

test('every STEP is GOVERNED — an ungoverned step could leave the suite in silence', () => {
  // The class fix behind the case above. Widening a prefix list only covers the prefixes someone
  // thought of; this covers the next one. Asserted against the real STEPS, and then by mutation.
  const { failures } = auditSuite({ scripts });
  assert.deepEqual(failures, [], `\n${failures.join('\n')}\n`);

  const smuggled = auditSuite({
    scripts: { ...scripts, 'build:something': 'node scripts/does-not-matter.mjs' },
    steps: [...STEPS, 'build:something'],
  });
  assert.ok(
    smuggled.failures.some((f) => f.includes('outside GOVERNED')),
    `an ungoverned step was accepted into the suite:\n${smuggled.failures.join('\n')}`
  );
});

/**
 * The five delegating parents, and what each one used to hide behind a single name.
 *
 * Written out rather than derived from package.json, because a list derived from the thing it
 * checks agrees with it by construction. The parity between this literal and the real script
 * bodies is asserted below.
 */
const ALIASES = {
  'check:ledger': [
    'test:claims', 'test:classifier', 'test:ledger',
    'check:ledger-lint', 'check:ledger-build', 'check:ledger-verify',
  ],
  'check:warroom': [
    'check:warroom-launcher', 'check:warroom-template', 'check:warroom-installer',
    'check:warroom-parity', 'test:warroom',
  ],
  'check:dispatch': ['test:dispatch', 'test:dispatch-flush', 'check:dispatch-agenttype'],
  'check:dispatch-prompt': ['test:dispatch-prompt', 'check:dispatch-prompt-size'],
  'check:memory': ['test:memory', 'test:eviction', 'check:memory-budget'],
};

test('the five delegating parents are EXCLUDED aliases, and every link is a STEP of its own', () => {
  // SUPERSEDED 2026-08-25, and this is a retraction. This test used to assert the OPPOSITE: that
  // test:claims, test:classifier, test:ledger, test:dispatch, test:warroom, test:memory and
  // test:dispatch-prompt must NOT appear in STEPS, because their parents reached them
  // transitively. Transitive reach IS real — the mechanism is still proved, in the test below —
  // but reaching a script is not running it separately. The parents were `&&` chains, 18 links
  // behind 5 names, so `check:ledger` reported as ONE step and a test:claims failure skipped
  // `ledger lint`, `ledger build --check` and `ledger verify` while the tally said one step
  // failed. The suite is the links now; the parents survive only as aliases, because docs,
  // session files and CLAUDE.md cite those spellings.
  for (const [parent, links] of Object.entries(ALIASES)) {
    assert.deepEqual(
      aliasLinks(scripts[parent]),
      links,
      `${parent} in package.json no longer delegates to exactly the links this test pins`
    );
    assert.ok(!STEPS.includes(parent), `${parent} is back in STEPS as one step, hiding ${links.length} links`);
    assert.ok(
      Object.prototype.hasOwnProperty.call(EXCLUDED, parent),
      `${parent} left STEPS with no EXCLUDED entry — the silent omission this guard exists to catch`
    );
    for (const link of links) {
      assert.ok(STEPS.includes(link), `${link} is not a STEP, so the suite no longer runs it at all`);
    }
  }
});

test('the guard REFUSES an EXCLUDED alias whose links are not all in the suite', () => {
  // The mechanism the entries above lean on: an alias is exempt BECAUSE its links are steps. Drop
  // one link and the exemption starts hiding a check that runs nowhere, which is what the
  // check:mc entry was written to prevent, arriving through a different door.
  const { failures } = auditSuite({ scripts, steps: STEPS.filter((s) => s !== 'check:ledger-verify') });

  assert.ok(
    failures.some((f) => f.includes('EXCLUDED names "check:ledger"') && f.includes('check:ledger-verify')),
    `dropping a link from the suite did not fail the alias exemption:\n${failures.join('\n')}`
  );
});

test('the guard REFUSES a STEP whose resolved command carries ANY shell operator', () => {
  // `npm run check` spawns each step and reads one exit code; it cannot see inside a step. So a
  // chain reintroduced in package.json would restore the exact failure this runner replaced, and
  // the only place it is catchable is on the command string.
  //
  // SUPERSEDED 2026-08-26. This case tested `&&` alone, and the guard it tested read
  // `String(scripts[step]).includes('&&')`. Four one-line mutations walked past it, each measured
  // returning ZERO findings: `;`, `||`, `|`, and a wrapper script — `test:sandbox` set to
  // `npm run check:inner` with the chain one hop away. `;` is the one that matters most, and it is
  // the one an `&&`-shaped rule is least likely to reach for: `bash -c 'false ; true'` exits 0, so
  // a `;` chain does not even leave a red step behind, where `&&` at least does.
  const cases = {
    '&&': 'npm run test:hooks && npm run test:budget',
    '||': 'npm run test:hooks || npm run test:budget',
    ';': 'npm run test:hooks ; npm run test:budget',
    '|': 'npm run test:hooks | npm run test:budget',
    '&': 'npm run test:hooks & npm run test:budget',
    '\\n': 'npm run test:hooks\n npm run test:budget',
  };

  for (const [op, command] of Object.entries(cases)) {
    const { failures } = auditSuite({ scripts: { ...scripts, 'test:sandbox': command } });
    assert.ok(
      failures.some((f) => f.includes('STEPS names "test:sandbox"') && f.includes(`\`${op}\``)),
      `a step chained with \`${op}\` was accepted:\n${failures.join('\n') || '(no failures at all)'}`
    );
  }
});

test('the guard follows a wrapper — one `npm run` hop used to defeat it entirely', () => {
  // Measured before the fix: `test:sandbox` → `npm run check:inner` → an `&&` chain returned ZERO
  // findings. The wrapper changes nothing the runner can see; it still spawns one command and
  // reads one exit code. The walk follows the whole chain, so two hops do not restore the hole.
  const oneHop = auditSuite({
    scripts: { ...scripts, 'test:sandbox': 'npm run check:inner', 'check:inner': 'npm run test:hooks && npm run test:budget' },
  });
  assert.ok(
    oneHop.failures.some((f) => f.includes('delegates to "check:inner"') && f.includes('`&&`')),
    `a one-hop wrapper hid a chain:\n${oneHop.failures.join('\n') || '(no failures at all)'}`
  );

  const twoHops = auditSuite({
    scripts: {
      ...scripts,
      'test:sandbox': 'npm run check:w1',
      'check:w1': 'npm run check:w2',
      'check:w2': 'npm run test:hooks ; npm run test:budget',
    },
  });
  assert.ok(
    twoHops.failures.some((f) => f.includes('delegates to "check:w2"') && f.includes('`;`')),
    `a two-hop wrapper hid a chain:\n${twoHops.failures.join('\n') || '(no failures at all)'}`
  );

  // And a cycle must terminate rather than hang — a wrapper pointing at itself is malformed, not
  // a reason for the drift guard to spin.
  const cyclic = auditSuite({
    scripts: { ...scripts, 'test:sandbox': 'npm run check:loop', 'check:loop': 'npm run test:sandbox' },
  });
  assert.ok(Array.isArray(cyclic.failures), 'a delegation cycle did not return');
});

test('the operator check is quote-aware — a rule that fires on correct code gets weakened', () => {
  // package.json's `usage` script is `node -e "…;…"`: its semicolons are inside a quoted argument
  // and separate nothing. A substring scan would refuse that shape the day it became a step.
  assert.deepEqual(shellOperators(`node -e "const a=1;console.log(a)"`), []);
  assert.deepEqual(shellOperators(`node -e 'a && b'`), []);
  assert.deepEqual(shellOperators('node scripts/x.mjs --flag'), []);

  // …and still sees the real thing outside quotes, including alongside a quoted decoy.
  assert.deepEqual(shellOperators(`node -e "a;b" && node -e "c"`), ['&&']);
  assert.deepEqual(shellOperators('a && b ; c'), ['&&', ';']);

  const legit = auditSuite({ scripts: { ...scripts, 'test:sandbox': `node -e "const a=1;console.log(a)"` } });
  assert.deepEqual(legit.failures, [], `a quoted semicolon was refused:\n${legit.failures.join('\n')}`);
});

test('a `&` adjacent to `>` is a redirect, not backgrounding — and redirects keep the exit code', () => {
  // `bash -c 'false 2>&1'` exits 1. Reporting `&` here would attach this rule's message — "the
  // step's exit code becomes the last command's" — to a case where that sentence is FALSE, and a
  // rule that fires on correct code with a wrong explanation gets deleted rather than obeyed. Latent
  // when fixed: no script in the tree used the shape, so this is a negative control, not a bug fix.
  assert.deepEqual(shellOperators('node x.mjs 2>&1'), []);
  assert.deepEqual(shellOperators('node x.mjs >&2'), []);
  assert.deepEqual(shellOperators('node x.mjs &>log'), []);

  // Backgrounding still bites, and a redirect does not launder a pipe sitting beside it.
  assert.deepEqual(shellOperators('npm run a & npm run b'), ['&']);
  assert.deepEqual(shellOperators('node x.mjs 2>&1 | tee log'), ['|']);

  const redirecting = auditSuite({ scripts: { ...scripts, 'test:sandbox': 'node scripts/x.mjs 2>&1' } });
  assert.deepEqual(redirecting.failures, [], `a redirect was refused as a chain:\n${redirecting.failures.join('\n')}`);
});

test('command substitution RE-ENTERS command context — double quotes are not opaque', () => {
  // MEASURED IN BASH 2026-08-26, which is the only authority that settles what a shell does:
  //
  //     echo "$(exit 7; exit 0)"     exits 0   the 7 is GONE, and no step goes red
  //     echo "`exit 7; exit 0`"      exits 0   the same, in the backtick spelling
  //     echo '$(exit 7; exit 0)'     exits 0   prints the TEXT — nothing ran, so nothing to report
  //
  // The first two returned [] from shellOperators() until this change, because the scanner tracked
  // ONE quote flag and read double-quoted text as opaque. `$(…)` and backticks re-enter command
  // context in there, so a STEPS entry shaped that way was accepted with ZERO findings while
  // dropping a non-zero exit — the header's own threat model, arriving through the single construct
  // the scanner had decided not to look inside. The third line is why the fix is a stack of frames
  // and not "look inside quotes too": single quotes really do suppress it, and a rule that fires on
  // correct code gets weakened rather than obeyed.
  assert.deepEqual(shellOperators('npm run a && npm run b'), ['&&'], 'the control stopped working');
  assert.deepEqual(shellOperators('npm run a && echo "$(npm run b; npm run c)"'), ['&&', ';']);
  assert.deepEqual(shellOperators('echo "$(npm run b; npm run c)"'), [';']);
  assert.deepEqual(shellOperators('echo "`npm run b; npm run c`"'), [';']);
  assert.deepEqual(shellOperators('echo $(npm run b; npm run c)'), [';'], 'the unquoted spelling');

  // THE CASE THAT MUST NOT CHANGE.
  assert.deepEqual(shellOperators("echo '$(npm run b; npm run c)'"), []);
  assert.deepEqual(shellOperators("echo '`npm run b; npm run c`'"), []);

  // Every operator, not only `;`. A substitution is a command context, so all of them work in it —
  // and `;`, `|` and `&` are the ones that leave no red step at all.
  assert.deepEqual(shellOperators('echo "$(a && b)"'), ['&&']);
  assert.deepEqual(shellOperators('echo "$(a || b)"'), ['||']);
  assert.deepEqual(shellOperators('echo "$(a | b)"'), ['|']);
  assert.deepEqual(shellOperators('echo "$(a & b)"'), ['&']);
  assert.deepEqual(shellOperators('echo "$(a\nb)"'), ['\\n'], 'a newline inside a substitution separates');

  // Each frame carries its OWN quote state, so quoting is re-armed one level in: bash prints `a;b`
  // for the first line — that semicolon is single-quoted INSIDE the substitution and separates
  // nothing. A depth counter without per-frame quotes would report it and be wrong.
  assert.deepEqual(shellOperators(`echo "$(echo 'a;b')"`), []);
  assert.deepEqual(shellOperators('echo "$(echo "$(npm run a; npm run b)")"'), [';'], 'nesting');
  assert.deepEqual(shellOperators('echo "$( (npm run a; npm run b) )"'), [';'], 'a subshell inside');
  assert.deepEqual(shellOperators('echo "$( (a) ; (b) )"'), [';'], 'the substitution closed on the wrong `)`');

  // An ESCAPED substitution runs nothing — `echo "\$(exit 7; exit 0)"` prints the text — so the
  // backslash branch is what stops the frame opening, and it must not be reported.
  assert.deepEqual(shellOperators('echo "\\$(npm run a; npm run b)"'), []);
  assert.deepEqual(shellOperators('echo "\\`npm run a; npm run b\\`"'), []);

  // END TO END, not just the predicate: a STEP shaped this way must fail the guard itself.
  for (const body of [
    'echo "$(npm run test:hooks; npm run test:budget)"',
    'echo "`npm run test:hooks; npm run test:budget`"',
    'npm run test:hooks && echo "$(npm run test:budget | tee log)"',
  ]) {
    const { failures } = auditSuite({ scripts: { ...scripts, 'test:sandbox': body } });
    assert.ok(
      failures.some((f) => f.includes('STEPS names "test:sandbox"') && /`;`|`\|`/.test(f)),
      `a chain hidden in a substitution was accepted:\n${failures.join('\n') || '(no failures at all)'}`
    );
  }

  // And a legitimate substitution — one command inside it — is still not a finding.
  const legit = auditSuite({ scripts: { ...scripts, 'test:sandbox': 'node -e "console.log(1)" --tag "$(git rev-parse HEAD)"' } });
  assert.deepEqual(legit.failures, [], `a single-command substitution was refused:\n${legit.failures.join('\n')}`);
});

test('`$((` DOES NOT MEAN ARITHMETIC — it means arithmetic only when it closes as `))`', () => {
  // THE BYPASS THIS CASE EXISTS FOR, and it was in the fix for the previous bypass. `$((` is read
  // as arithmetic by bash only when the region closes `))`; otherwise it is command substitution
  // wrapping a subshell, `$( (cmd); rest )`, and every command in it runs. Measured in bash:
  //
  //     echo "$((echo RAN); echo RAN2)"        RAN / RAN2, exit 0    BOTH RAN
  //     echo "$((exit 7); echo RAN2)"          exit 0                the 7 is LAUNDERED
  //     echo "$((a|b); echo RAN2)"             a and b run, through a PIPE, then RAN2
  //     echo "$((echo RAN))"                   exit 1                arithmetic syntax error
  //     echo "$(( (echo RAN) ))"               exit 1                "missing `)'" — arithmetic
  //
  // The predicate granted non-command status on paren BALANCE, which `$((cmd); cmd)` satisfies. So
  // `echo "$((npm run a); npm run b)"` returned [] and one crafted step defeated shellOperators(),
  // auditSuite() and the ci.yml check at once. THE SPECIAL CASE ADDED TO STOP FALSE POSITIVES ON
  // `$((6|1))` WAS THE BYPASS — which is the general shape, and why the exemption now needs two
  // independent checks to agree: the structural `))`, and the body reading as arithmetic.
  assert.deepEqual(shellOperators('echo "$((npm run test:hooks); npm run test:budget)"'), [';']);
  assert.deepEqual(shellOperators('echo "$((exit 7); echo SECOND)"'), [';']);
  assert.deepEqual(shellOperators('echo "$((npm run a) && npm run b)"'), ['&&']);
  assert.deepEqual(shellOperators('echo "$((npm run a); npm run b | npm run c)"'), [';', '|']);
  assert.deepEqual(shellOperators('echo $((npm run a); npm run b)'), [';'], 'the unquoted spelling');

  // BOTH GUARDS, on the same string. They share shellOperators(), so a hole in it is a hole in two
  // places at once — which is exactly what made this a P1 rather than a P2, and is why it is
  // asserted through both entry points rather than only through the predicate.
  const step = auditSuite({ scripts: { ...scripts, 'test:sandbox': 'echo "$((npm run test:hooks); npm run test:budget)"' } });
  assert.ok(
    step.failures.some((f) => f.includes('STEPS names "test:sandbox"') && f.includes('`;`')),
    `auditSuite accepted the crafted step:\n${step.failures.join('\n') || '(no failures at all)'}`
  );
  const run = `${CI.trimEnd()}\n\n      - name: A new check\n        if: \${{ !cancelled() }}\n        run: echo "$((npm run test:hooks); npm run test:budget)"\n`;
  assert.equal(ciChainFindings(run).length, 1, 'the ci.yml check accepted the crafted `run:` value');

  // AGAINST OVER-CORRECTION. These are the false positives the special case exists to prevent, and
  // failing closed must not reach them: measured, `$((6|1))` is 7, `$((6&1))` is 0, `$((1&&1))` is
  // 1, `$((0||1))` is 1, `$(( (1+2) * 3 ))` is 9. A rule that fires on these gets deleted, not obeyed.
  assert.deepEqual(shellOperators('echo "$((6|1))"'), []);
  assert.deepEqual(shellOperators('echo "$((a<<2))"'), []);
  assert.deepEqual(shellOperators('echo "$((x?y:z))"'), []);
  assert.deepEqual(shellOperators('echo "$((6&1))"'), []);
  assert.deepEqual(shellOperators('echo "$((1&&1)) $((0||1))"'), []);
  assert.deepEqual(shellOperators('echo "$(( (1+2) * 3 ))"'), [], 'a nested paren closed the expansion early');
  assert.deepEqual(shellOperators('echo "$(( ${X} | $Y ))"'), [], 'a variable reference is an arithmetic operand');
  const clean = auditSuite({ scripts: { ...scripts, 'test:sandbox': 'node -e "console.log($((6|1)))"' } });
  assert.deepEqual(clean.failures, [], `arithmetic was refused as a chain:\n${clean.failures.join('\n')}`);

  // THE HOLE THE PREVIOUS ROUND OPENED, still closed: arithmetic is walked, not jumped over, because
  // a substitution nested inside it runs commands. Measured: `x="$(( $(exit 7; echo 1) + 1 ))"` sets
  // x=1 and `$?` to 7.
  assert.deepEqual(shellOperators('x="$(( $(exit 7; echo 1) + 1 ))"'), [';']);
  assert.deepEqual(shellOperators('x="$(( $(npm run a | npm run b) ))"'), ['|']);

  // An UNBALANCED `$((` is not arithmetic bash would run, so it must not be treated as opaque.
  assert.deepEqual(shellOperators('echo "$((npm run a; npm run b"'), [';']);

  // SUPERSEDED 2026-08-26, deliberately and in one line: this asserted [] for `$((npm run a; npm
  // run b))`, on the ground that bash refuses it — `arithmetic syntax error … (error token is
  // "; npm run b")`, exit 1, nothing runs — and it said "pinned so that a future widening is a
  // visible decision rather than an accident". This IS that widening, and it is visible here. The
  // body carries a `;`, the content check refuses it, and the fallback reports it. Reporting a
  // command bash would refuse to run costs one rewritten command; the balance-only predicate that
  // let this stay [] cost a total bypass of two guards.
  assert.deepEqual(shellOperators('echo "$((npm run a; npm run b))"'), [';']);

  // THE OVER-REPORTS THE CONSERVATIVE ALLOWLIST BUYS, measured rather than guessed. All three are
  // valid arithmetic — bash returns 2, 1 and 1 for them, exit 0, running nothing — and this rule
  // reports an operator anyway, because each uses a token the allowlist does not carry: an array
  // subscript, a POSTFIX `++`, and base-N notation, whose `#` is refused because `#` starts a
  // comment in command context.
  //
  // KEPT, and this is the trade the last two rounds settled the hard way. Widening the allowlist to
  // admit exotic shapes nobody writes in a build script is precisely how both previous bypasses
  // arrived — a special case added to stop a false positive became the hole. The cost here is one
  // command rewritten without `$((`; the cost of the other direction was a total bypass of two
  // guards. Zero scripts in package.json and zero `run:` values in ci.yml use any of these shapes.
  // If one ever does, widen ARITH_OPERAND deliberately and turn these into `[]` — do not read a
  // green run of this block as a claim that they are chains.
  assert.deepEqual(shellOperators('echo "$((a[1]|2))"'), ['|'], 'array subscript — bash says 2');
  assert.deepEqual(shellOperators('echo "$((a++|1))"'), ['|'], 'postfix ++ — bash says 1');
  assert.deepEqual(shellOperators('echo "$((16#ff&1))"'), ['&'], 'base-N notation — bash says 1');

  // And the controls that keep the block above from reading as "the allowlist is arbitrary": the
  // same shapes without the unsupported token are accepted, so it is the token and not the operator.
  assert.deepEqual(shellOperators('echo "$((a|2))"'), []);
  assert.deepEqual(shellOperators('echo "$((0x1f|1))"'), [], 'hex is an ordinary numeric operand');
  assert.deepEqual(shellOperators('echo "$((x=1,y=2))"'), [], 'assignment and comma are arithmetic');

  // UNARY PREFIXES, one of the two branches that GRANT the exemption, and it had zero coverage:
  // deleting the whole ARITH_PREFIX branch left all 44 cases green. An unpinned exemption branch on
  // this function's history is a standing regression surface. Bash values measured:
  //
  //     $((-1|2))  -1      $((+1|2))  3      $((!1|2))  2
  //     $((~1|2))  -2      $((++x|1)) 1      $((--x|1)) -1
  //
  // Each carries a `|`, so a branch that stopped recognising the prefix would drop the exemption
  // and the `|` would be reported — which is what makes these cases able to fail.
  assert.deepEqual(shellOperators('echo "$((-1|2))"'), [], 'unary minus');
  assert.deepEqual(shellOperators('echo "$((+1|2))"'), [], 'unary plus');
  assert.deepEqual(shellOperators('echo "$((!1|2))"'), [], 'logical not');
  assert.deepEqual(shellOperators('echo "$((~1|2))"'), [], 'bitwise not');
  assert.deepEqual(shellOperators('echo "$((++x|1))"'), [], 'pre-increment');
  assert.deepEqual(shellOperators('echo "$((--x|1))"'), [], 'pre-decrement');

  // THE NEGATIVE that keeps the six above from being satisfied by "a prefix character anywhere is
  // fine": in OPERATOR position a prefix does not grant the exemption, and the `|` is reported.
  // Bash agrees both are errors — `$((1|+))` is "operand expected".
  assert.deepEqual(shellOperators('echo "$((1|+))"'), ['|'], 'a trailing prefix granted the exemption');
  assert.deepEqual(shellOperators('echo "$((2 ~ 3|4))"'), ['|'], 'a prefix in operator position granted the exemption');

  // THE RATIONALE EXAMPLE, asserted rather than only written down. This is the string the fix's
  // comment cites as proof that a non-`))` region runs commands, and until now nothing pinned it:
  // measured, `echo "$((a|b); echo RAN2)"` reports `a: command not found`, `b: command not found`
  // and then RAN2 — a and b really are run, through a pipe, and RAN2 after.
  assert.deepEqual(shellOperators('echo "$((a|b); echo RAN2)"'), [';', '|']);

  // THE EMPTY BODY, named in isArithmeticBody()'s comment as deliberately rejected and unpinned
  // until now. Rejection and acceptance are INDISTINGUISHABLE here — a body with no operators
  // returns [] down either path — and that is precisely why rejecting it costs nothing. Pinned as
  // the observable, with the reason it cannot be pinned any harder.
  assert.deepEqual(shellOperators('echo "$(())"'), []);
  assert.deepEqual(shellOperators('echo "$(( ))"'), []);

  // BASE-N IS REFUSED IN ONE PLACE, and after 2026-08-26 only one. ARITH_OPERAND carried `[\w#]`
  // for it, which was UNREACHABLE: ARITH_FORBIDDEN rejects the whole body first, because `#` begins
  // a comment in command context. Removing the dead `#` must not change either result below.
  assert.deepEqual(shellOperators('echo "$((16#ff&1))"'), ['&'], 'base-N is refused by ARITH_FORBIDDEN');
  assert.deepEqual(shellOperators('echo "$((0x1f|1))"'), [], 'hex needs no `#` and is an ordinary operand');
});

test('the scanner declares its vocabulary — an unmodelled construct is a FINDING, never a clean []', () => {
  // THE INVERSION, and it is what ends a sequence rather than extending it. Three rounds produced
  // three total bypasses, each an unmodelled construct in one code path: command substitution in
  // double quotes, `$((` that is not arithmetic, and `$'…'`. Every fix was correct. Bash's
  // expansion surface is larger than any hand-rolled scanner will finish enumerating, and each gap
  // was a SILENT CLEAN RESULT on the one control that catches laundered exit codes.
  //
  // So `$` — the introducer for that whole surface — now has a declared vocabulary, and anything
  // outside it is reported as its own kind of finding. The surface is closed: there is no next
  // bypass through a `$` form because there is no open side.
  //
  // Measured 2026-08-26, the case that prompted it:
  //     bash -c "echo $'a\'b'; echo SECOND_RAN"   ->  a'b / SECOND_RAN, exit 0 — TWO COMMANDS RAN
  //
  // Cost, measured before building: **0** of 69 package.json scripts and **0** of 44 ci.yml `run:`
  // values contain a `$` at all, so nothing existing is newly flagged.

  // The vocabulary. None of these is a finding, and a rule that fired on them would be routed
  // around rather than obeyed.
  assert.deepEqual(shellOperators('echo ${HOME}'), [], '${…} parameter expansion');
  assert.deepEqual(shellOperators('echo $HOME $1'), [], '$name and positional');
  assert.deepEqual(shellOperators('echo $@ $* $? $- $$ $! $#'), [], 'the special parameters');
  assert.deepEqual(shellOperators('echo costs 100$'), [], 'a bare $ is a literal dollar');
  assert.deepEqual(shellOperators('echo $(npm run a)'), [], '$( is modelled — one command inside');
  assert.deepEqual(shellOperators('echo "$((6|1))"'), [], '$(( is modelled');

  // OUTSIDE IT: reported, by name, so the message says what to rewrite.
  assert.deepEqual(shellOperators('echo $[1+2]; npm run b'), ['$['], 'the deprecated $[…] form');
  assert.ok(shellOperators('echo $^weird').length > 0, 'an unknown $-form returned clean');

  // IT RUNS INSIDE DOUBLE QUOTES TOO. This block used to sit below the double-quote early exit,
  // justified by one true measurement — `echo "$'a'"` prints `$'a'` literally, so flagging it there
  // would fire on correct code. That fact is about `$'` and `$"` and about nothing else: measured,
  // `echo "$[1+2]"` prints 3, and `${x}`, `$x`, `$@`, `$(…)` and `$((…))` all expand in there as
  // well. Skipping the whole class inside quotes certified `echo "result is $[1+2]"` as one clean
  // command, contradicting the guarantee three lines up. A rule established by ONE construct had
  // been applied to its entire class. The suppression is now exactly two forms wide.
  assert.deepEqual(shellOperators('echo "$[1+2]"'), ['$['], 'a quoted unmodelled form was certified clean');
  assert.deepEqual(shellOperators(`echo "$'a'"`), [], "$' is literal inside double quotes — the one real exception");
  assert.deepEqual(shellOperators('echo "100$"'), [], 'a `"` after `$` ends the string; there is nothing to model');
  assert.deepEqual(shellOperators('echo "${HOME}" "$HOME" "$@" "$((6|1))"'), [], 'the vocabulary holds inside quotes too');

  // End to end, because the guarantee is about what the GUARDS certify, not about the predicate.
  const quoted = auditSuite({ scripts: { ...scripts, 'test:sandbox': 'echo "result is $[1+2]"' } });
  assert.ok(
    quoted.failures.some((f) => f.includes('STEPS names "test:sandbox"') && f.includes('does not model')),
    `auditSuite certified a quoted unmodelled construct as clean:\n${quoted.failures.join('\n') || '(no failures at all)'}`
  );

  // What was found BEFORE the unmodelled form is kept; scanning stops there because past it the
  // frame stack describes a string this function does not understand.
  assert.deepEqual(shellOperators('npm run a && echo $[1]'), ['&&', '$['], 'the earlier operator was dropped');

  // BOTH CONSUMERS report it, with a message of its own kind rather than the operator one — they
  // share shellOperators(), so a construct it cannot certify must not read as "no chain" in either.
  const step = auditSuite({ scripts: { ...scripts, 'test:sandbox': 'echo $[1+2]; npm run test:budget' } });
  assert.ok(
    step.failures.some((f) => f.includes('does not model') && f.includes('`$[`')),
    `auditSuite certified a command it cannot parse:\n${step.failures.join('\n') || '(no failures at all)'}`
  );
  const wf = `${CI.trimEnd()}\n\n      - name: X\n        if: \${{ !cancelled() }}\n        run: echo $[1+2]\n`;
  const ciFound = ciChainFindings(wf);
  assert.equal(ciFound.length, 1, `the ci.yml check certified a command it cannot parse:\n${ciFound.join('\n')}`);
  assert.ok(ciFound[0].includes('does not model'), ciFound[0]);

  // And the escape hatch is the allowlist already built — same >=40-char reason, same rot check —
  // so a step that genuinely needs an exotic form is exempted deliberately rather than silently.
  const exempted = ciChainFindings(wf, { ...CI_CHAINS_ALLOWED, 'echo $[1+2]': 'x'.repeat(45) });
  assert.deepEqual(exempted, [], `an allowlisted unmodelled command was still reported:\n${exempted.join('\n')}`);
});

test('ANSI-C and locale quoting are MODELLED, so the gate does not fire on them', () => {
  // Both were measured rather than looked up, and both are exact:
  //
  //   $'…'   echo $'a\'b'          -> a'b       a `\'` does NOT close the string
  //          echo $'a\\'           -> a\        an escaped BACKSLASH lets the next quote close
  //          echo $'a$(echo X)b'   -> a$(echo X)b   no expansions inside — nothing in it runs
  //   $"…"   echo $"a$(echo X)b"   -> aXb       expansions DO happen: it is a double-quoted string
  //          echo $"a\"b"          -> a"b
  //          echo $"a;b"           -> a;b       a `;` inside is literal
  //
  // Modelling them is what keeps the two controls below reading `;` instead of "unsupported" —
  // naming the actual defect beats refusing to look at it, where the semantics are this cheap.
  assert.deepEqual(shellOperators(String.raw`echo $'a\'b'; npm run malicious`), [';'], 'THE BYPASS');
  assert.deepEqual(shellOperators(`echo 'plain'; npm run b`), [';'], 'control 1');
  assert.deepEqual(shellOperators(`echo $'abc'; npm run b`), [';'], 'control 2');
  assert.deepEqual(shellOperators(String.raw`echo $'a\\'; npm run b`), [';'], 'an escaped backslash closes it');
  assert.deepEqual(shellOperators('echo $"abc"; npm run b'), [';'], 'the locale form');

  // …and neither invents a chain out of quoted text, which is the other half of being modelled.
  assert.deepEqual(shellOperators(String.raw`echo $'a;b'`), [], 'a `;` inside $\'…\' separates nothing');
  assert.deepEqual(shellOperators('echo $"a;b"'), [], 'a `;` inside $"…" separates nothing');
  assert.deepEqual(shellOperators(String.raw`echo $'a$(npm run b; npm run c)d'`), [], 'no expansion inside ANSI-C');
});

test('`${…}` and `$"…"` are scanned THROUGH — a nested `$(` still opens a command frame', () => {
  // TWO RE-ENTRY CLAIMS THAT NOTHING HELD. isModelledDollar()'s doc says `${…}` is scanned through
  // so `${x:-$(a;b)}` reports the `;`, and the `$"…"` case pins its negatives without its positive.
  // Both were true and both were unasserted — which is the exact shape that produced three shipped
  // bypasses: a behavioural claim in a comment with no case behind it. A future narrowing that
  // made either opaque would have been invisible in a green run.
  //
  // Measured, because "scanned through" is a claim about what bash RUNS:
  //     echo "${x:-$(echo RAN; echo RAN2)}"   ->  RAN / RAN2      the substitution runs
  //     echo $"a$(echo RAN; echo RAN2)d"      ->  aRAN / RAN2d    likewise, inside the translated
  //                                                               string — it expands like `"…"`
  assert.deepEqual(shellOperators('echo "${x:-$(npm run a; npm run b)}"'), [';'], 'a chain in a parameter default');
  assert.deepEqual(shellOperators('echo "${x:-$(npm run a && npm run b)}"'), ['&&'], 'the `&&` sibling');
  assert.deepEqual(shellOperators('echo $"a$(npm run b; npm run c)d"'), [';'], 'a chain inside $"…"');
  assert.deepEqual(shellOperators('echo $"a$(npm run b && npm run c)d"'), ['&&'], 'the `&&` sibling');

  // The literal-only negatives, so neither case is satisfied by a rule that fires on `${` or `$"`
  // themselves rather than on the substitution inside them.
  assert.deepEqual(shellOperators('echo "${x:-plain}"'), [], 'a parameter default with no substitution');
  assert.deepEqual(shellOperators('echo $"a$(npm run b)d"'), [], 'one command inside $"…" is not a chain');
  assert.deepEqual(shellOperators('echo "${HOME}${PATH}"'), [], 'adjacent expansions are not a chain');

  // And end to end, since the guarantee is about what the guards certify.
  const step = auditSuite({ scripts: { ...scripts, 'test:sandbox': 'echo "${x:-$(npm run test:hooks; npm run test:budget)}"' } });
  assert.ok(
    step.failures.some((f) => f.includes('STEPS names "test:sandbox"') && f.includes('`;`')),
    `a chain inside a parameter default was accepted:\n${step.failures.join('\n') || '(no failures at all)'}`
  );
});

test('every OTHER unmodelled construct in the scanner path OVER-reports — the closure claim', () => {
  // The gate closes the `$` surface. This is the claim about everything else, and it is asserted
  // rather than promised: the remaining constructs this scanner does not model all add operators
  // rather than hiding them, so none of them can produce a silent clean result. Over-reporting
  // costs one command rewritten; under-reporting is what the last three rounds were.
  assert.ok(shellOperators('echo @(a|b)').length > 0, 'extglob — `|` is pattern alternation, reported anyway');
  assert.ok(shellOperators('if [[ a && b ]]; then npm run x; fi').length > 0, '[[ ]] conditional operators');
  assert.ok(shellOperators('case x in a) npm run y;; esac').length > 0, 'case terminators');
  assert.ok(shellOperators('bash <<EOF\nnpm run a\nEOF').length > 0, 'here-document body');
  assert.ok(shellOperators('npm run a # note ; npm run b').length > 0, 'text after a `#` comment');

  // THE ONE REMAINING UNDER-REPORT, disclosed rather than hidden: an unterminated quote swallows
  // the rest of the string. It is not a bypass, because bash refuses to run the command at all —
  // `bash -c 'echo "a; npm run b'` is an unexpected-EOF syntax error. Pinned so that if it ever
  // stops being true, the change is visible here.
  assert.deepEqual(shellOperators('echo "a; npm run b'), [], 'an unterminated quote started reporting — re-check the claim above');

  // AND ONE MORE OVER-REPORT, worth naming because isModelledDollar()'s "scanned through" invites
  // the opposite expectation: an UNQUOTED parameter default whose word contains a literal `;` is
  // reported, though bash prints `a;b` and runs one command. Quoted it is not — measured both ways.
  // Scanning through is what makes a nested `$(` visible; the price is that the word's own text is
  // read as command context. Over-reporting, so it is the safe side, and it is pinned rather than
  // left for the next reader to rediscover.
  assert.deepEqual(shellOperators('echo ${x:-a;b}'), [';'], 'unquoted — reported, though bash runs one command');
  assert.deepEqual(shellOperators('echo "${x:-a;b}"'), [], 'quoted — the double quotes make it literal to both');
});

test('three shapes bash runs as ONE command, which this rule used to refuse', () => {
  // THESE RUN THE OPPOSITE DIRECTION FROM EVERY EARLIER ROUND. Rounds 1-3 were under-reports: a real
  // chain returning []. These are OVER-reports: bash executes each as a single command, exit 0, and
  // the rule reported a chain operator — so the guards would have refused correct code, with a
  // message ("the step's exit code becomes the last command's") that is false of it. A rule that
  // fires on correct code gets weakened rather than obeyed, which is how the surface reopens.
  //
  // Measured in bash: `echo "$(($1|1))"` prints 7 with `set -- 6 7`; `echo "$((x|=2))"` prints 3;
  // `node x.mjs 0<&3` exits 0. None of the 114 governed commands is affected — none contains a `$`
  // at any position — so these bite the first person to write `$((x|=2))` in a build script.
  assert.deepEqual(shellOperators('echo "$(($1|1))"'), [], 'a positional parameter is an arithmetic operand');
  assert.deepEqual(shellOperators('echo "$((x|=2))"'), [], 'compound assignment');
  assert.deepEqual(shellOperators('node x.mjs 0<&3'), [], 'input descriptor duplication');

  // The rest of the special parameters, because the fix is that ONE list serves both
  // isModelledDollar() and ARITH_OPERAND — written twice they drift, which is what produced the
  // first of these three. Two of them needed more than the shared list, and both were found by
  // running these cases rather than by reading:
  //
  //   $#   `#` was in ARITH_FORBIDDEN outright, because it begins a comment in command context. But
  //        `set -- a b c; echo "$(($#|1))"` prints 3. It is now forbidden only when NOT preceded by
  //        `$`, which keeps base-N refused — the `#` in `16#ff` follows a digit — and that refusal
  //        has its own case below.
  //   $$   the scan re-read its second `$` as the start of another form and reported an unmodelled
  //        `$|`. It is the one vocabulary member that is itself a `$`, so it is consumed as a unit.
  //
  // WHAT THIS CASE ASSERTS IS SYNTAX, not evaluation. `$@` and `$*` are valid operands only when
  // they expand to a single number — with `set -- 6 7` bash errors on `$((6 7|1))` — and `$!` with
  // no background job expands to nothing. That is a runtime failure that exits 1 and runs no
  // command, the same class as `$((1abc|2))`, so treating them as operands is correct here.
  for (const param of ['$#', '$?', '$$', '$!', '$@', '$*', '$-', '$1', '$12']) {
    assert.deepEqual(shellOperators(`echo "$((${param}|1))"`), [], `${param} is not an arithmetic operand`);
  }
  for (const op of ['|=', '&=', '^=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '**=']) {
    assert.deepEqual(shellOperators(`echo "$((x${op}2))"`), [], `${op} is not modelled as compound assignment`);
  }
  for (const redirect of ['0<&3', '3<&-', 'exec 3<&0']) {
    assert.deepEqual(shellOperators(`node x.mjs ${redirect}`), [], `${redirect} is not a redirect`);
  }

  // THE CONTROLS, in the same case, because each fix WIDENS an exemption and a widened exemption is
  // how a bypass gets in. Every one of these must keep reporting.
  assert.deepEqual(shellOperators('node x.mjs 2>&1'), [], 'the output-side redirect still is not a chain');
  assert.deepEqual(shellOperators('npm run a | npm run b'), ['|'], 'a genuine pipe');
  assert.deepEqual(shellOperators('npm run a & npm run b'), ['&'], 'genuine backgrounding');
  assert.deepEqual(shellOperators('npm run a && npm run b'), ['&&']);
  assert.deepEqual(shellOperators('npm run a || npm run b'), ['||']);
  assert.deepEqual(shellOperators('echo $1; npm run b'), [';'], 'a positional parameter OUTSIDE arithmetic');

  // …and the constructed abuse of each widening, which is the half that makes the widening safe
  // rather than merely convenient.
  assert.deepEqual(shellOperators('echo "$(($1; npm run b))"'), [';'], 'ARITH_OPERAND: a chain in the body');
  assert.deepEqual(shellOperators('echo "$(($1); npm run b)"'), [';'], 'ARITH_OPERAND: no closing `))`');
  assert.deepEqual(shellOperators('echo "$(($(npm run a; npm run b)|1))"'), [';', '|'], 'ARITH_OPERAND: nested substitution');
  assert.deepEqual(shellOperators('echo $((a|=b)); npm run x'), [';'], 'ARITH_INFIX: a real separator after it');
  assert.deepEqual(shellOperators('npm run a |= npm run b'), ['|'], 'ARITH_INFIX: `|=` outside arithmetic is a pipe');
  assert.deepEqual(shellOperators('npm run a &= npm run b'), ['&'], 'ARITH_INFIX: `&=` outside arithmetic backgrounds');
  assert.deepEqual(shellOperators('npm run a < file & npm run b'), ['&'], 'redirect guard: a space before `&` is not adjacency');
  assert.deepEqual(shellOperators('npm run a <&3 & npm run b'), ['&'], 'redirect guard: the real trailing `&` after a dup');
  assert.deepEqual(shellOperators('npm run a &< npm run b'), ['&'], 'redirect guard: `&<` is NOT a bash construct and must not be exempt');
  assert.deepEqual(shellOperators('npm run a <&3 ; npm run b'), [';'], 'redirect guard: a `;` after a dup');
});

test('the two lists of `$` special parameters are ONE list', () => {
  // Finding 1 in miniature, and this session's recurring defect: isModelledDollar()'s vocabulary and
  // ARITH_OPERAND both need the special parameters, they were written out separately, and they
  // disagreed — `$1` was in the vocabulary and not in the operand pattern, so `echo "$(($1|1))"`
  // was reported as a pipe while bash printed 7. They are built from one constant now; this case is
  // what makes splitting them again visible.
  for (const param of ['@', '*', '?', '-', '$', '!', '#']) {
    assert.deepEqual(shellOperators(`echo $${param}`), [], `$${param} is not in the $-vocabulary`);
    assert.deepEqual(shellOperators(`echo "$(($${param}|1))"`), [], `$${param} is in the vocabulary but not an arithmetic operand`);
  }
  // A `$` form in NEITHER list is still reported — the lists agreeing must not mean they are empty.
  assert.deepEqual(shellOperators('echo $[1+2]'), ['$['], 'the vocabulary stopped excluding anything');
  assert.deepEqual(shellOperators('echo $|x'), ['$|'], 'a `$` before a pipe is not a parameter');

  // `$$` is consumed as ONE form in both places, or its second `$` is read as a new one.
  assert.deepEqual(shellOperators('echo $$'), [], 'a bare $$');
  assert.deepEqual(shellOperators('echo $$; npm run b'), [';'], 'a real separator after $$ still reports');

  // And the base-N refusal survives the narrowing of the `#` ban — it is a deliberate over-report
  // with its own case, and the fix for `$#` must not have quietly turned it off.
  assert.deepEqual(shellOperators('echo "$((16#ff&1))"'), ['&'], 'base-N stopped being refused');
  assert.deepEqual(shellOperators('npm run a # x ; npm run b'), [';'], 'a `#` comment still over-reports');
});

test('an unquoted backslash escapes the operator after it — the branch that had no coverage', () => {
  // Measured: `echo a \; b` prints `a ; b` and `echo a \&\& b` prints `a && b`. Both are ONE
  // command, so reporting an operator would be firing on correct code. This branch existed from the
  // first version of shellOperators() and nothing exercised it, so a deletion of it — or of the
  // `i += 1` that consumes the escaped character — looked identical to a green run.
  assert.deepEqual(shellOperators('echo a \\; b'), []);
  assert.deepEqual(shellOperators('echo a \\&\\& b'), []);
  assert.deepEqual(shellOperators('echo a \\| b'), []);
  assert.deepEqual(shellOperators('echo a \\& b'), []);

  // The discriminations that keep those four from being satisfied by a scanner that ignores `\`
  // and everything after it: the escape covers exactly ONE character.
  assert.deepEqual(shellOperators('echo a \\; b ; npm run c'), [';'], 'the escape swallowed the real operator');
  assert.deepEqual(shellOperators('echo a \\&& npm run b'), ['&'], 'the second `&` of an escaped pair still runs the job in background');

  // And a backslash inside SINGLE quotes is a literal backslash, not an escape — so it must not
  // consume the quote that ends the string. `echo 'a\' ; npm run b` really is two commands.
  assert.deepEqual(shellOperators("echo 'a\\' ; npm run b"), [';']);
});

test('an ESCAPED `<` or `>` is a literal — the `&` after it is a real operator', () => {
  // PINNED BY AN ORACLE, NOT BY BELIEF. Every other case in this file asserts what its author
  // measured once; this one asks bash on each run and derives the expectation from the answer,
  // because the defect it guards was introduced BY a measurement that looked right. `0<&3` really
  // is one command, so the guard was widened to exempt a `<` before an `&` — and a
  // backslash-escaped `<` is a LITERAL `<` inside a word, so `npm run a \<& npm run b` was exempted
  // too. The detector went from ["&"] to [] on that input: strictly worse than before the fix.
  //
  // The `>` arm had the identical defect from the day it was written, and `\>&` was [] on both
  // sides. One predicate covers both — fixing half a class is how the other half gets forgotten.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redirect-oracle-'));
  fixtures.push(dir);
  const L = path.join(dir, 'L');
  const R = path.join(dir, 'R');

  /** Run `body` with a LEFT that exits `code` and a RIGHT that leaves a marker. */
  const probe = (body, code) => {
    for (const f of [L, R]) if (fs.existsSync(f)) fs.unlinkSync(f);
    const prelude = `exec 3</dev/null; LEFT() { : > ${L}; return ${code}; }; RIGHT() { : > ${R}; };`;
    const run = spawnSync('bash', ['-c', `${prelude} ${body}`], { encoding: 'utf8' });
    return { exit: run.status, left: fs.existsSync(L), right: fs.existsSync(R) };
  };

  /**
   * TWO probes, because one cannot tell a conditional chain from a single command.
   *
   *   launders    a FAILING left, both commands ran, and the exit code is 0 — the failure is gone
   *               with no red step, which is this whole file's threat model
   *   oneCommand  not laundering, AND with a SUCCEEDING left nothing but LEFT ran
   *
   * A single probe misclassifies both `&&` and `||`: with a failing left `LEFT && RIGHT` runs only
   * LEFT and looks single, and with a succeeding left `LEFT || RIGHT` runs only LEFT and looks
   * single too. Together the two probes put `&&` in neither class and `||` in `launders`, which is
   * correct — so neither is asserted through this oracle, and both keep their own cases elsewhere.
   */
  const classify = (body) => {
    const failing = probe(body, 7);
    const succeeding = probe(body, 0);
    const launders = failing.left && failing.right && failing.exit === 0;
    return { launders, oneCommand: !launders && succeeding.left && !succeeding.right };
  };

  // THE ORACLE CHECKS ITSELF FIRST. An oracle that cannot see a chain it is pointed at would make
  // every assertion below vacuous, and it would look exactly like a green run.
  assert.equal(classify('LEFT & RIGHT').launders, true, 'the oracle cannot see plain backgrounding');
  assert.equal(classify('LEFT; RIGHT').launders, true, 'the oracle cannot see a plain `;` chain');
  assert.equal(classify('LEFT 2>&1').oneCommand, true, 'the oracle calls a plain redirect a chain');
  assert.ok(fs.existsSync(dir), 'the oracle fixture vanished');

  // LAUNDERING — bash says so, so the scanner must report something. The four escaped forms are the
  // bypass; the three plain ones are the controls that keep the set from being all-escaped.
  for (const body of [
    'LEFT \\<& RIGHT', 'LEFT \\<\\<& RIGHT', 'LEFT \\>& RIGHT', 'LEFT \\>\\>& RIGHT',
    'LEFT & RIGHT', 'LEFT; RIGHT', 'LEFT | RIGHT',
  ]) {
    assert.equal(classify(body).launders, true, `bash stopped laundering \`${body}\` — re-derive this case`);
    assert.ok(
      shellOperators(body).length > 0,
      `bash LAUNDERS \`${body}\` — both commands run and the exit code is 0 — and the scanner reported nothing`
    );
  }

  // ONE COMMAND — bash says so, so the scanner must stay silent. These are the shapes the guard
  // exists for, and the reason it cannot simply be deleted.
  for (const body of ['LEFT 0<&3', 'LEFT 3<&-', 'LEFT 2>&1', 'LEFT >&2', `LEFT &>${path.join(dir, 'log')}`]) {
    assert.equal(classify(body).oneCommand, true, `bash stopped running \`${body}\` as one command — re-derive this case`);
    assert.deepEqual(
      shellOperators(body), [],
      `bash runs \`${body}\` as ONE command and the scanner called it a chain — a rule that fires on correct code gets weakened`
    );
  }

  // And the shape the guard must NOT exempt, kept as an equality assertion because bash refuses it
  // rather than running it: `&<` is not a bash construct, so there is nothing for an oracle to see.
  assert.deepEqual(shellOperators('npm run a &< npm run b'), ['&'], '`&<` was exempted');
});

test('the three DISCLOSED holes in resolveChain are pinned, so a narrowing is not mistaken for one', () => {
  // resolveChain() follows only a BARE `npm run <name>`. Its doc comment discloses three shapes it
  // walks past, and under-reporting is the safe direction — this check refuses what it understands
  // and never guesses. But with nothing asserting them, a future narrowing of the regex is
  // INDISTINGUISHABLE from the intended hole: both look like "this case does not fire". These cases
  // pin the current behaviour so the difference is visible in a diff.
  //
  // THEY ARE NOT A CLAIM THAT THE SHAPES ARE SAFE. Each hides a chain from the guard. If one ever
  // appears in package.json, widen resolveChain and turn the matching case here positive — do not
  // read a green run of this test as coverage of these shapes.
  const cases = {
    'npm run x --silent': { 'test:sandbox': 'npm run check:inner --silent', 'check:inner': 'npm run a && npm run b' },
    'npx': { 'test:sandbox': 'npx some-runner', 'check:inner': 'npm run a && npm run b' },
    'chain inside quotes': { 'test:sandbox': `sh -c "npm run a && npm run b"` },
  };

  for (const [shape, overlay] of Object.entries(cases)) {
    const { failures } = auditSuite({ scripts: { ...scripts, ...overlay } });
    const operatorFindings = failures.filter((f) => f.includes('shell operator'));
    assert.deepEqual(
      operatorFindings, [],
      `resolveChain now REPORTS the "${shape}" shape. That is an improvement, not a regression — but ` +
        `this case documented it as a known hole, so update the doc comment in scripts/lib/check-suite.js ` +
        `and move this shape to a positive assertion. Do not delete the case.`
    );
  }

  // The control that keeps the three above meaningful: the shape resolveChain DOES follow still bites.
  const followed = auditSuite({
    scripts: { ...scripts, 'test:sandbox': 'npm run check:inner', 'check:inner': 'npm run a && npm run b' },
  });
  assert.ok(
    followed.failures.some((f) => f.includes('shell operator')),
    'the bare `npm run <name>` delegation stopped being followed — the holes above are now the whole rule'
  );
});

test('both callers of DELEGATION agree on what a bare delegation is', () => {
  // aliasLinks() asks the pattern of each `&&`-separated part; resolveChain() asks it of a whole
  // body. Same question — "is this nothing but a delegation to a name I can go and check?" — and it
  // was written out twice until 2026-08-26, so a narrowing meant for one would have left the other
  // behind with nothing saying so. It is one `const` now; this case is what makes un-sharing it
  // visible, because two copies pass here right up until they diverge.
  const followed = (body) => resolveChain({ wrapper: body, target: 'node -e ""' }, 'wrapper').length > 1;
  const linked = (body) => aliasLinks(`${body} && npm run target`) !== null;

  // Spellings without `&&` in them, because aliasLinks() splits on `&&` before it applies the
  // pattern and a body containing one is not asking these two the same thing.
  const spellings = {
    'npm run target': true,
    'npm  run   target': true,
    ' npm run target ': true,
    'npm run target --silent': false,
    'npm run target extra': false,
    'npx target': false,
    'node scripts/x.mjs': false,
    'FOO=1 npm run target': false,
  };

  for (const [body, expected] of Object.entries(spellings)) {
    assert.equal(followed(body), expected, `resolveChain disagrees about "${body}"`);
    assert.equal(linked(body), expected, `aliasLinks disagrees about "${body}"`);
  }
});

test('transitive reach still counts — the mechanism, proved where the tree no longer exercises it', () => {
  // Every STEP is a single command now, so reachable() over the real tree returns the steps
  // themselves and this property would pass vacuously against it. The alias check in auditSuite()
  // depends on the walk, so it is proved against a constructed graph instead.
  const graph = {
    'check:parent': 'npm run test:child && npm run check:grandparent',
    'check:grandparent': 'npm run test:grandchild',
    'test:child': 'node -e ""',
    'test:grandchild': 'node -e ""',
    'test:elsewhere': 'node -e ""',
  };
  const reached = reachable(graph, ['check:parent']);

  assert.ok(reached.has('test:child'), 'a direct `npm run` link was not reached');
  assert.ok(reached.has('test:grandchild'), 'reach stopped at one hop — it must be transitive');
  assert.ok(!reached.has('test:elsewhere'), 'an unlinked script was reported as reached');
});

test('the nine steps the && chain used to skip are all in the suite', () => {
  const skipped = [
    'test:probe-readonly', 'test:pre-tool-use', 'test:run-gate', 'test:tier-gate',
    'test:merge-gate', 'test:skill-clamp', 'test:probe-stop-reason',
    'test:launcher-permissions', 'test:sandbox',
  ];
  for (const s of skipped) {
    assert.ok(STEPS.includes(s), `${s} is not in the suite — it is the reason this file exists`);
  }
});

test('check:mc is EXCLUDED, not merely absent — and the reason carries its measurement', () => {
  // Absent-with-no-entry is the silent omission this guard exists to catch, and it would look
  // identical to a considered decision from the outside. Only the EXCLUDED entry tells them apart.
  assert.ok(!STEPS.includes('check:mc'), 'check:mc is back in STEPS; it fails under the armed sandbox');
  assert.ok(
    Object.prototype.hasOwnProperty.call(EXCLUDED, 'check:mc'),
    'check:mc left STEPS with no EXCLUDED entry — that is the silent omission, wearing the fix as a hat'
  );

  // NO PIN ON THE PASS/FAIL FIGURES, deliberately, and this is a retraction.
  //
  // This test used to assert /345 pass \/ 0 fail/ and /344 pass \/ 1 fail/ over the reason string.
  // Both kept passing for weeks after the measurement they quoted stopped reproducing: the pair was
  // taken while .claude/settings.json carried a `sandbox.excludedCommands` entry, ab46d40 reverted
  // the key, and a regex over prose cannot tell that the world moved. It reported green on the exact
  // defect it was positioned to catch, which is worse than not existing — it made the entry look
  // pinned. A number appearing in a comment is not evidence the number is true, and nothing here can
  // make it evidence without running check:mc, which takes 3.5 minutes and needs bun deps.
  //
  // So the figures are checked by a human re-measuring, and this file checks the CITATIONS instead,
  // in the test below: they are the parts of the reason that live in this repo and can be resolved.
});

// ── ci.yml: the suite reaches the runner, and the runner reaches every step ───────────────────
//
// The three assertions below are the ones the 2026-08-25 change to ci.yml GUARANTEED and did not
// CHECK. Each is proved by mutation, because a green run against the current file proves only that
// the current file is currently fine:
//
//   STEPS ⊆ ci.yml       `test:check-suite` itself "ran NOWHERE on a runner until 2026-08-25" —
//                        ci.yml says so in its own comment. It was step 2 of the suite with no CI
//                        step, and nothing reported it, because only EXCLUDED entries were ever
//                        checked against this file and no test iterated STEPS.
//   the `if:` guard      `if: ${{ !cancelled() }}` on every `run:` step IS the change. One step
//                        added without it, or one tidy-up that lifts the repetition into
//                        something clever, silently restores fail-fast for everything after it.
//   continue-on-error    ci.yml states "it appears nowhere in this file" as the reason a failure
//                        is still a failure. That sentence is the load-bearing half of the change
//                        and nothing checked it.
//
// The whole ci.yml is parsed rather than grepped, and the parser is cross-checked against a raw
// line count below: a parser that silently reads six steps out of forty-four turns all three of
// these green while asserting nothing, which is this file's own recurring defect.

const CI_PATH = path.join(REPO, '.github', 'workflows', 'ci.yml');
const CI = fs.readFileSync(CI_PATH, 'utf8');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('an exclusion that says CI still covers it is checked against ci.yml, not trusted', () => {
  // auditSuite() can only measure that a reason is 40-odd characters long. It cannot tell a true
  // reason from a false one, and one went false without a sound: the check:mc entry justified
  // itself by a `sandbox.excludedCommands` key in .claude/settings.json that ab46d40 had already
  // reverted. Citations to files in this repo CAN be checked, so these are.
  //
  // MATCHED AGAINST `run:` LINES, NEVER THE RAW FILE TEXT, and that distinction is a P1 this very
  // change introduced and a reviewer caught. `invokes()` used to regex the whole workflow, comments
  // included. The `&&` rationale paragraph added to ci.yml's header on 2026-08-26 contains the
  // string "`bun install ... && npm run check:mc`" — so occurrences went 1 → 2, and the COMMENT
  // alone satisfied the guard. Measured in scratch copies with the Mission Control step deleted and
  // the comment left: this file went 33 pass · 0 fail, i.e. silent, where origin/main's version bit.
  // The check:mc exemption states in writing that ci.yml "is the only place it runs green, so it is
  // the only place it is checked" — a prose sentence about coverage, certified by a check that had
  // started reading prose.

  /**
   * Does ci.yml RUN this script?
   *
   * Anchored on the right with a lookahead rather than a bare substring test, because
   * `npm run check:dispatch-agenttype` CONTAINS `npm run check:dispatch` — so a plain
   * `includes()` would report the alias covered by a step that runs one of its links.
   */
  const invokes = (workflow, name) => {
    const pattern = new RegExp(`npm run ${escapeRe(name)}(?![\\w:-])`);
    return ciRunCommands(workflow).some((cmd) => pattern.test(cmd));
  };

  /** Covered by ci.yml — by name, or, for an alias, through every one of its links. */
  const runsInCi = (workflow, name) => {
    if (invokes(workflow, name)) return true;
    const links = aliasLinks(scripts[name]);
    return Boolean(links) && links.every((link) => invokes(workflow, link));
  };

  /** Names whose reason claims ci.yml covers them, where ci.yml does not run them. */
  const uncovered = (excluded, workflow) =>
    Object.entries(excluded)
      .filter(([name, reason]) => /ci\.yml/.test(reason) && !runsInCi(workflow, name))
      .map(([name]) => name);

  assert.deepEqual(
    uncovered(EXCLUDED, CI),
    [],
    'an exclusion tells the reader ci.yml still runs it, and ci.yml does not. Either the CI step was ' +
      'deleted — in which case that exclusion now hides a check running NOWHERE — or the reason cites ' +
      'coverage that never existed.'
  );

  // Proved by mutation — and the MUTATION is the half that was wrong. It used to be
  // `ci.replace(/npm run check:mc/g, …)`, which scrubbed the comment as well as the step, so it
  // proved the guard bites when you delete BOTH. Deleting the step is the thing that happens; the
  // comment is what makes it invisible. So the step alone is removed here, and the comment is
  // asserted to survive, or this is once again a self-proof that proves the wrong deletion.
  const withoutStep = CI.replace(/^( *run: .*)npm run check:mc$/m, '$1npm run something-else');
  assert.notEqual(withoutStep, CI, 'the Mission Control mutation matched nothing, so its proof is vacuous');
  assert.deepEqual(
    uncovered(EXCLUDED, withoutStep),
    ['check:mc'],
    'removing the Mission Control STEP from ci.yml did not fail this check, so it is not evidence.'
  );

  // The decoy is CONSTRUCTED, not borrowed from the file. Asserting that ci.yml happens to mention
  // the command in prose would pin someone else's comment: the first cut of this case did exactly
  // that and went red the moment the comment was reworded — a test failing on the correct fix for
  // the defect it guards. The property is "a comment never counts", so the comment is built here.
  const commentDecoy = `${withoutStep}\n# see the Mission Control step: npm run check:mc\n`;
  assert.deepEqual(
    uncovered(EXCLUDED, commentDecoy),
    ['check:mc'],
    'a `npm run` mention inside a ci.yml COMMENT satisfied a claim about what ci.yml RUNS. That is how ' +
      'the Mission Control step became deletable in silence while the exemption still certified coverage.'
  );
  assert.equal(invokes(commentDecoy, 'check:mc'), false, 'invokes() read a comment as a step that runs');

  // And the alias path, which is the load-bearing half now that five entries lean on it: an alias
  // is covered by ci.yml only while EVERY link has a step there. Delete one and it must bite. Same
  // step-only mutation, for the same reason — `check:ledger-verify` happens to appear in no comment
  // today, and a proof that depends on that staying true is a proof with a hidden premise.
  const withoutLink = CI.replace(/^( *run: )npm run check:ledger-verify$/m, '$1npm run something-else');
  assert.notEqual(withoutLink, CI, 'the ledger-verify mutation matched nothing, so its proof is vacuous');
  assert.deepEqual(
    uncovered(EXCLUDED, withoutLink),
    ['check:ledger'],
    'deleting the `ledger verify` step from ci.yml left the check:ledger exemption looking covered'
  );

  // And the fact the check:mc entry's account of its own history depends on. If someone reinstates
  // a sandbox.excludedCommands key, that entry has to be re-measured, not re-read.
  const settings = JSON.parse(fs.readFileSync(path.join(REPO, '.claude', 'settings.json'), 'utf8'));
  assert.ok(
    !(settings.sandbox && 'excludedCommands' in settings.sandbox),
    'sandbox.excludedCommands is back in .claude/settings.json. The check:mc exclusion states that both ' +
      'its cells fail BECAUSE that key is absent; with it present, standalone check:mc may pass again and ' +
      'the entry needs re-measuring rather than a re-read.'
  );
});

test('the ci.yml step parser reads the whole file — a scanner that under-reads asserts nothing', () => {
  const steps = parseCiSteps(CI);

  // Cross-checked against raw line counts, which are wrong in a different way than the parser is.
  const rawItems = CI.split('\n').filter((l) => /^ {6}- /.test(l)).length;
  const rawRuns = CI.split('\n').filter((l) => /^ {8}run: /.test(l)).length;
  const rawUses = CI.split('\n').filter((l) => /^ {6}- uses: /.test(l)).length;

  assert.equal(steps.length, rawItems, 'the parser and a raw item count disagree about how many steps exist');
  assert.equal(steps.filter((s) => s.run !== null).length, rawRuns, 'the parser lost or invented a `run:` step');
  assert.equal(steps.filter((s) => s.uses !== null).length, rawUses, 'the parser lost or invented a `uses:` step');
  assert.ok(rawRuns >= 40, `only ${rawRuns} run-steps found — the parser is not reaching the job`);
  assert.ok(steps.every((s) => s.run !== null || s.uses !== null), 'a parsed step carries neither run: nor uses:');
});

test('parseCiSteps reads a `run: |` block scalar — the shape a multi-command step arrives in', () => {
  // NOTHING IN ci.yml USES ONE TODAY, so this branch had zero coverage — and it is the branch that
  // decides whether such a step is seen at all. A block scalar read as "no `run:`" is invisible to
  // every check in this section that iterates `run:` values: the `!cancelled()` guard, the runner
  // ban, and the chain check. It is also the shape a multi-command step arrives in, which makes it
  // precisely the shape that must not be missed.
  const wf = [
    'name: t',
    'jobs:',
    '  one:',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - name: Single',
    '        if: ${{ !cancelled() }}',
    '        run: npm run test:a',
    '      - name: Block',
    '        if: ${{ !cancelled() }}',
    '        run: |',
    '          npm run test:b',
    '          npm run test:c',
    '      - name: After',
    '        run: npm run test:d',
    '',
  ].join('\n');

  const steps = parseCiSteps(wf);
  assert.equal(steps.length, 4, 'the block scalar swallowed the step after it, or lost one before it');
  assert.deepEqual(steps.map((s) => s.name), [null, 'Single', 'Block', 'After']);
  assert.equal(steps[2].run, 'npm run test:b\nnpm run test:c', 'the block body was not read as written');
  assert.equal(steps[2].if, '${{ !cancelled() }}', 'the `if:` above a block scalar was lost');
  assert.equal(steps[3].run, 'npm run test:d', 'the parser never left the block scalar');
  assert.equal(steps.filter((s) => s.run !== null).length, 3, 'a `run:` step was lost or invented');

  // And the chain check READS it, which is the half that matters: two commands in one `run:` put
  // both behind one exit code, and the step is one thing the workflow reports. An explicit
  // allowlist is passed because the real one names a command this fixture does not contain — its
  // rot check would otherwise fire and this case would count the wrong finding.
  const found = ciChainFindings(wf, {});
  assert.equal(found.length, 1, `a two-command block scalar was not reported as a chain:\n${found.join('\n')}`);
  assert.ok(found[0].includes('`\\n`'), `the finding did not name the newline operator: ${found[0]}`);

  // A ONE-command block scalar is not a chain, so the rule does not fire on the shape itself.
  const single = wf.replace('          npm run test:c\n', '');
  assert.deepEqual(ciChainFindings(single, {}), [], 'a single-command block scalar was reported as a chain');
});

test('a `run: |` that starts with a BLANK line does not swallow the step after it', () => {
  // REPRODUCED 2026-08-26 before the fix: this exact workflow parsed as TWO steps, and After's
  // `name`, `if` and `run` were inside Block's `run` value as text. The block took its indent from
  // the first NON-BLANK line, and for a block with no content of its own that line is the next
  // step's `- name:`. Every check that iterates steps then passes it in silence — including the
  // `!cancelled()` guard, so an unguarded step becomes undetectable, which is the one thing this
  // section exists to make impossible. Dormant only because ci.yml has no block scalar today; that
  // is a property of the input, not of the parser.
  const leadingBlank = [
    'name: t', 'jobs:', '  one:', '    steps:',
    '      - name: Block',
    '        if: ${{ !cancelled() }}',
    '        run: |',
    '',
    '      - name: After',
    '        if: ${{ !cancelled() }}',
    '        run: npm run test:d',
    '',
  ].join('\n');

  const steps = parseCiSteps(leadingBlank);
  assert.equal(steps.length, 2, 'the step after a leading-blank block scalar was swallowed');
  assert.equal(steps[1].name, 'After', 'the following step lost its name');
  assert.equal(steps[1].if, CI_GUARD, 'the following step lost its `if:` guard');
  assert.equal(steps[1].run, 'npm run test:d', 'the following step lost its `run:`');
  assert.ok(!String(steps[0].run).includes('After'), `the block absorbed the next step: ${JSON.stringify(steps[0].run)}`);

  // THE MIRROR IMAGE, and it is the half that makes the above load-bearing rather than cosmetic: a
  // step that is GENUINELY missing the guard must still be reported when it follows such a block.
  // Without it, "two steps parsed" could be satisfied by a parser that recovers the step and drops
  // its keys, which reads identically in the count and is silent in exactly the same way.
  const unguarded = (workflow) =>
    parseCiSteps(workflow).filter((s) => s.run !== null && s.if !== CI_GUARD).map((s) => s.line);

  assert.deepEqual(unguarded(leadingBlank), [], 'a guarded workflow was reported as unguarded');

  const missingGuard = leadingBlank.replace('        if: ${{ !cancelled() }}\n        run: npm run test:d', '        run: npm run test:d');
  assert.notEqual(missingGuard, leadingBlank, 'the guard-removal mutation matched nothing, so its proof is vacuous');
  // Derived, not a literal: removing a line shifts every number below it, and a pinned integer here
  // would fail on the next edit to the fixture for a reason that has nothing to do with the rule.
  const afterLine = parseCiSteps(missingGuard).find((step) => step.name === 'After').line;
  assert.deepEqual(unguarded(missingGuard), [afterLine], 'a step with no `!cancelled()` guard, sitting after a leading-blank block, was not reported');

  // A block whose content is separated from the key by a blank line is still read, and the blank
  // survives inside the body — blank lines are content, they simply may not set the baseline.
  const blankThenContent = leadingBlank.replace('        run: |\n\n', '        run: |\n\n          npm run test:b\n');
  const withContent = parseCiSteps(blankThenContent);
  assert.equal(withContent.length, 2, 'a blank line before real block content broke the parse');
  assert.equal(withContent[0].run, 'npm run test:b', 'the block content after a leading blank was lost');
});

test('`run: >` is accepted by the parser and joined literally — an over-report, on purpose', () => {
  // parseCiSteps accepts a FOLDED scalar (`>`) and implements LITERAL (`|`) join semantics: it
  // joins with newlines where YAML folding joins with spaces. Nothing in ci.yml uses one, and this
  // branch had no coverage at all, so neither the acceptance nor the mismatch was visible.
  //
  // NOT "FIXED" BY IMPLEMENTING FOLDING, deliberately. Real folding is a second YAML feature to
  // write (blank lines fold to newlines, more-indented lines stay literal) and it would make this
  // check report LESS. Joining literally means a two-line folded body is reported as a `\n` chain
  // when the shell would have seen one line — an over-report, which costs one `run:` rewritten,
  // against a class of miss that costs the control. Pinned so the behaviour is a decision.
  const folded = [
    'name: t', 'jobs:', '  one:', '    steps:',
    '      - name: Folded',
    '        if: ${{ !cancelled() }}',
    '        run: >',
    '          npm run test:b',
    '          npm run test:c',
    '',
  ].join('\n');

  const steps = parseCiSteps(folded);
  assert.equal(steps.length, 1, 'a folded scalar step was lost');
  assert.equal(steps[0].run, 'npm run test:b\nnpm run test:c', 'the folded body is joined literally — see above');
  assert.equal(steps[0].if, CI_GUARD, 'the `if:` above a folded scalar was lost');

  const found = ciChainFindings(folded, {});
  assert.equal(found.length, 1, `a two-line folded scalar was not reported:\n${found.join('\n')}`);
  assert.ok(found[0].includes('`\\n`'), found[0]);

  // A one-line folded scalar is one command, and is not a finding — so the rule is about the
  // number of commands, not about the `>` character.
  const one = folded.replace('          npm run test:c\n', '');
  assert.deepEqual(ciChainFindings(one, {}), [], 'a single-command folded scalar was reported as a chain');
});

test('every STEP of the suite has a counterpart step in ci.yml', () => {
  // `test:check-suite` — this very file — sat second in STEPS and ran NOWHERE on a runner until
  // 2026-08-25, because nothing ever iterated STEPS against ci.yml. Only EXCLUDED entries were
  // checked, and an omission from the suite's own list is invisible to a check on the exemptions.
  /**
   * ci.yml runs a step by NAME (`npm run x`) or by its resolved BODY.
   *
   * Three steps are spelled as the body — `lint:agents`, `check:manifest` and `check:registration`
   * are `node …` lines in this file — so a name-only match would report three false gaps. The name
   * match is right-anchored: `npm run check:dispatch-agenttype` CONTAINS `npm run check:dispatch`.
   */
  const missing = (workflow) => {
    const commands = ciRunCommands(workflow);
    return STEPS.filter((step) => {
      const byName = new RegExp(`npm run ${escapeRe(step)}(?![\\w:-])`);
      const body = String(scripts[step]).trim();
      return !commands.some((cmd) => byName.test(cmd) || cmd.includes(body));
    });
  };

  assert.deepEqual(
    missing(CI), [],
    'a step of `npm run check` has no step in ci.yml, so it is checked only on machines that run the ' +
      'suite by hand. Add the step to .github/workflows/ci.yml, or take it out of STEPS deliberately.'
  );

  // Proved by mutation, on both spellings — the by-name path and the by-body path.
  const byName = CI.replace(/npm run test:sandbox\b/g, 'npm run something-else');
  assert.notEqual(byName, CI, 'the by-name mutation matched nothing, so its proof is vacuous');
  assert.deepEqual(missing(byName), ['test:sandbox'], 'deleting the Sandbox step from ci.yml did not bite');

  const byBody = CI.replace(/node scripts\/check-registration\.mjs/g, 'node scripts/something-else.mjs');
  assert.notEqual(byBody, CI, 'the by-body mutation matched nothing, so its proof is vacuous');
  assert.deepEqual(missing(byBody), ['check:registration'], 'deleting the Registration step did not bite');
});

test('every `run:` step in ci.yml carries the `!cancelled()` guard, and the three setup steps do not', () => {
  // THIS GUARD IS THE ENTIRE 2026-08-25 CHANGE. Without it the first failing step aborts the job:
  // on `main` before that change the build failed at step 18 of 30 and the twelve after it never
  // ran — the ledger's enforcement, both gates, and the check that makes "the sandbox is armed" a
  // fact. A step added without the guard reinstates exactly that, for everything below it.
  const unguarded = (workflow) =>
    parseCiSteps(workflow).filter((s) => s.run !== null && s.if !== CI_GUARD).map((s) => s.line);

  assert.deepEqual(
    unguarded(CI), [],
    `a \`run:\` step in ci.yml is missing \`if: ${CI_GUARD}\` (line numbers above). Without it, every step ` +
      'after the first failure is SKIPPED and the build reports one failure while hiding the rest.'
  );

  // The three `uses:` setup steps carry NO `if:`, deliberately. Guarding them was considered and
  // rejected: if checkout fails, `!cancelled()` is still true, so all 45 checks would run against an
  // empty workspace and produce ~46 red steps instead of one. That is a diagnosability cost, not a
  // fail-open one — the job still fails and nothing ships. Pinned so it reads as a decision.
  const setup = parseCiSteps(CI).filter((s) => s.uses !== null);
  assert.equal(setup.length, 3, 'the setup steps changed — re-decide whether they should carry the guard');
  assert.deepEqual(setup.map((s) => s.if), [null, null, null], 'a setup step grew an `if:`; see the note above');

  // Mutation 1: the guard deleted from one step, which is how a careless tidy-up arrives.
  const dropped = CI.replace(
    new RegExp(`^ *if: ${escapeRe(CI_GUARD)}\\n(?= *run: npm run test:sandbox$)`, 'm'),
    ''
  );
  assert.notEqual(dropped, CI, 'the guard-deletion mutation matched nothing, so its proof is vacuous');
  assert.equal(unguarded(dropped).length, 1, 'deleting the guard from a step did not bite');

  // Mutation 2: the guard WEAKENED rather than removed. `always()` runs a step the operator
  // cancelled, which is why ci.yml chose `!cancelled()`; a check for "some if:" would miss this.
  const weakened = CI.replace(
    new RegExp(`if: ${escapeRe(CI_GUARD)}\\n(?= *run: npm run test:sandbox$)`, 'm'),
    'if: ${{ always() }}\n'
  );
  assert.notEqual(weakened, CI, 'the weakening mutation matched nothing, so its proof is vacuous');
  assert.equal(unguarded(weakened).length, 1, 'swapping !cancelled() for always() did not bite');

  // Mutation 3: a NEW step appended with no guard — the recurrence this test exists to catch.
  const appended = `${CI.trimEnd()}\n\n      - name: A new check\n        run: npm run test:something-new\n`;
  assert.equal(unguarded(appended).length, 1, 'a newly appended unguarded step did not bite');
});

test('no ci.yml step invokes a runner directly — the tripwire preload, and the aggregate suite', () => {
  // ci.yml states this rule about itself and, until 2026-08-26, NOTHING CHECKED IT: "No step in this
  // file may invoke the runner itself; that is greppable, and the grep is the check, so this comment
  // does not spell the string it searches for." There was no grep. `check-suite.test.mjs` named
  // `run-checks.mjs` twice — as its own RUNNER const, and in a message about package.json — and
  // asserted nothing about ci.yml. The rule held by luck. That is the same class as the two defects
  // this file fixed the same day: a claim of enforcement with no mechanism, forty lines away from
  // them, and leaving it would teach the next reader that these comments are decorative.
  //
  // TWO DISTINCT PROPERTIES, and only the first is the one that comment means:
  //
  //   A · THE NODE TEST RUNNER. Read the paragraph it sits in — "The direct form ran the same file
  //       WITHOUT `--require ./scripts/protected-write-tripwire.cjs`, so this one step of the
  //       workflow was unguarded while every other one was, and the difference is invisible in a
  //       green run." The npm script carries the preload; `node --test <file>` does not. So a step
  //       spelled the direct way runs the same tests with the tripwire off.
  //   B · THE AGGREGATE SUITE RUNNER. `run: npm run check` in ci.yml would nest all 44 steps behind
  //       one step's exit code — the precise opacity the 45 `if:` guards exist to remove, arriving
  //       from the other direction. Nothing in that comment covers this; it is asserted because it
  //       is real, not because the comment claims it.
  //
  // The comment also says it "does not spell the string it searches for" — a workaround for a grep
  // that would otherwise match its own comment. That workaround is now unnecessary: this reads
  // `run:` values, so a comment cannot satisfy it and cannot break it either. It is the same
  // narrowing that fixed the check:mc P1, and it is why the strings below can be spelled plainly.
  const commands = ciRunCommands(CI);

  assert.deepEqual(
    commands.filter((c) => DIRECT_TEST_RUNNER.test(c)), [],
    'a ci.yml step invokes the Node test runner directly. It then runs WITHOUT ' +
      '`--require ./scripts/protected-write-tripwire.cjs`, which every npm test script carries — so that ' +
      'one step is unguarded while every other one is, and a green run looks identical. Call the npm script.'
  );

  assert.deepEqual(
    commands.filter((c) => AGGREGATE_RUNNER.test(c)), [],
    'a ci.yml step runs the whole suite through `npm run check`. That puts every step behind ONE exit ' +
      'code again, which is the opacity the per-step `if:` guards exist to remove. ci.yml runs each check ' +
      'as its own step on purpose.'
  );

  // Proved by mutation — both, and both spellings of A, since the tripwire hole arrives through the
  // `--test` flag whether or not a reporter is pinned beside it.
  const asDirect = CI.replace(/^( *run: )npm run test:gate$/m, '$1node --test .claude/workflows/lib/gate-logic.test.mjs');
  assert.notEqual(asDirect, CI, 'the direct-runner mutation matched nothing, so its proof is vacuous');
  assert.equal(ciRunCommands(asDirect).filter((c) => DIRECT_TEST_RUNNER.test(c)).length, 1);

  const withReporter = CI.replace(/^( *run: )npm run test:gate$/m, '$1node --test-reporter=tap --test x.mjs');
  assert.equal(ciRunCommands(withReporter).filter((c) => DIRECT_TEST_RUNNER.test(c)).length, 1,
    'a direct invocation with a reporter pinned beside it was missed');

  const asAggregate = CI.replace(/^( *run: )npm run test:gate$/m, '$1npm run check');
  assert.equal(ciRunCommands(asAggregate).filter((c) => AGGREGATE_RUNNER.test(c)).length, 1);

  // And the discriminations, so neither predicate is a substring scan wearing a regex. These are the
  // shapes ci.yml legitimately contains today; a rule that fires on them would be deleted, not obeyed.
  assert.equal(DIRECT_TEST_RUNNER.test('npm run test:gate'), false);
  assert.equal(DIRECT_TEST_RUNNER.test('node --test-reporter=tap x.mjs'), false, '--test-reporter is not --test');
  assert.equal(AGGREGATE_RUNNER.test('npm run check:curation'), false, 'a check: step is not the aggregate runner');
  assert.equal(AGGREGATE_RUNNER.test('npm run check:ledger-verify'), false);

  // A comment can neither satisfy nor break either rule — the property the check:mc P1 was about.
  const decoy = `${asAggregate}\n# never write: npm run check — and never node --test either\n`;
  assert.equal(ciRunCommands(decoy).filter((c) => AGGREGATE_RUNNER.test(c)).length, 1, 'a comment changed the count');

  // THE DISCLOSED HOLE, pinned the way resolveChain's three are — and it is NOT the one it looks
  // like. Both predicates read the `run:` TEXT, so the obvious guess is that wrapping evades them.
  // Measured, it does not: `bash -c "node --test x.mjs"` still matches DIRECT_TEST_RUNNER and
  // `sh -c "npm run check"` still matches AGGREGATE_RUNNER, because both patterns match anywhere in
  // the string rather than anchoring on the first word. What DOES walk past is INDIRECTION THROUGH
  // A VARIABLE — the binary or the command spelled as `$RUNNER`, where the text no longer contains
  // the token at all.
  //
  // Under-reporting is the safe direction here; this rule refuses what it understands and never
  // guesses. But with nothing asserting the hole, a future NARROWING of either regex would be
  // indistinguishable from the intended one — the same argument that put the resolveChain cases in
  // this file. If either shape appears in the workflow, widen the predicate and turn the matching
  // line positive. Do NOT read a green run of this block as coverage of them.
  assert.equal(DIRECT_TEST_RUNNER.test('$RUNNER --test x.mjs'), false, 'now REPORTS the runner named by a variable — widen the doc and make this positive');
  assert.equal(AGGREGATE_RUNNER.test('npm run $TARGET'), false, 'now REPORTS the target named by a variable — widen the doc and make this positive');

  // The controls, which are the half that corrects the guess above: wrapping is NOT an evasion.
  assert.equal(DIRECT_TEST_RUNNER.test('node --test x.mjs'), true);
  assert.equal(DIRECT_TEST_RUNNER.test('bash -c "node --test x.mjs"'), true, 'a wrapped direct runner stopped being caught');
  assert.equal(AGGREGATE_RUNNER.test('npm run check'), true);
  assert.equal(AGGREGATE_RUNNER.test('sh -c "npm run check"'), true, 'a wrapped aggregate runner stopped being caught');
});

test('the ci.yml chain check has a LIBRARY and an entry point, not only a test', () => {
  // ALL OF IT LIVED IN THIS FILE until 2026-08-26 — parseCiSteps, CI_CHAINS_ALLOWED,
  // ciChainFindings, ciRunCommands and the two runner predicates. That broke the lib/test
  // separation this same file enforces on the package.json side: assertions with no library behind
  // them, and no way to run them except by running the whole test file. The move is what these
  // cases hold; without them, moving it back reads exactly like a green run.
  const lib = require('./lib/check-suite.js');
  for (const name of [
    'CI_GUARD', 'CI_CHAINS_ALLOWED', 'parseCiSteps', 'ciRunCommands', 'ciChainFindings',
    'DIRECT_TEST_RUNNER', 'AGGREGATE_RUNNER',
  ]) {
    assert.ok(name in lib, `${name} is not exported from scripts/lib/check-suite.js — it moved back into a test`);
  }

  // PURE OVER BOTH INPUTS, which is the property the mutation proofs depend on: the same workflow
  // TEXT must give the same answer with no filesystem involved, so a test can hand it a workflow
  // that does not exist on disk. Proved with content that is nowhere in the repo.
  const invented = [
    'name: nowhere', 'jobs:', '  j:', '    steps:',
    '      - name: Chained', '        if: ${{ !cancelled() }}', '        run: npm run a && npm run b', '',
  ].join('\n');
  assert.equal(lib.ciChainFindings(invented, {}).length, 1, 'ciChainFindings could not judge text that is not on disk');
  assert.deepEqual(lib.ciChainFindings(invented, {}), lib.ciChainFindings(invented, {}), 'ciChainFindings is not pure');

  // THE ENTRY POINT EXISTS AND IS WIRED. `check:` is a GOVERNED prefix, so auditSuite() already
  // fails if it is neither a STEP nor EXCLUDED with a reason — that is the drift guard, not this
  // case. What this pins is that the script package.json names is really there and really runs.
  assert.equal(scripts['check:ci-chains'], 'node scripts/check-ci-chains.mjs', 'the entry point was renamed or removed');
  const entry = path.join(REPO, 'scripts', 'check-ci-chains.mjs');
  assert.ok(fs.existsSync(entry), `${entry} does not exist, but package.json points at it`);

  const run = spawnSync(process.execPath, [entry], { encoding: 'utf8' });
  assert.equal(run.status, 0, `the entry point fails on the current tree:\n${run.stderr}${run.stdout}`);
  assert.match(run.stdout, /no unexempted chained/, run.stdout || run.stderr);

  // ITS FAILURE BRANCHES, RUN. A script whose failure path has never executed reports success by
  // construction — the same rule this file applies to every guard it owns, applied to itself.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-chains-'));
  fixtures.push(dir);
  const chained = path.join(dir, 'chained.yml');
  fs.writeFileSync(chained, [
    'name: t', 'jobs:', '  j:', '    steps:',
    '      - name: Chained', '        if: ${{ !cancelled() }}', '        run: npm run a && npm run b', '',
  ].join('\n'));

  const bad = spawnSync(process.execPath, [entry, chained], { encoding: 'utf8' });
  assert.equal(bad.status, 1, `a chained workflow did not fail the entry point:\n${bad.stdout}${bad.stderr}`);
  assert.match(bad.stderr, /carries `&&`/, bad.stderr);
  assert.match(bad.stderr, /CI_CHAINS_ALLOWED/, 'the failure does not name the remedy');
  // TWO findings, not one, and that is the rot check doing its job rather than noise: a foreign
  // workflow does not run the allowlisted mission-control command, so the exemption really has
  // stopped matching a live step. It is asserted rather than filtered out, because the argument is
  // a diagnostic affordance and this is what it honestly reports against any file but the real one.
  assert.match(bad.stderr, /2 findings/, bad.stderr);
  assert.match(bad.stderr, /exempts a command no step in ci\.yml runs/, bad.stderr);

  const missing = spawnSync(process.execPath, [entry, path.join(dir, 'nope.yml')], { encoding: 'utf8' });
  assert.equal(missing.status, 1, 'a missing workflow reported success — absent is UNRESOLVED, not clean');
  assert.match(missing.stderr, /UNRESOLVED/, missing.stderr);

  // The control: a clean workflow through the same argument path still exits 0, so the two failures
  // above are the findings and not the argument.
  const ok = path.join(dir, 'ok.yml');
  fs.writeFileSync(ok, [
    'name: t', 'jobs:', '  j:', '    steps:',
    '      - name: Single', '        if: ${{ !cancelled() }}', '        run: npm run a',
    '      - name: Mission Control', '        if: ${{ !cancelled() }}',
    `        run: ${Object.keys(CI_CHAINS_ALLOWED)[0]}`, '',
  ].join('\n'));
  // …so the clean control keeps the allowlisted step, or it would fail on the rot finding alone and
  // prove nothing about chains.
  const good = spawnSync(process.execPath, [entry, ok], { encoding: 'utf8' });
  assert.equal(good.status, 0, `a single-command workflow failed through the argument path:\n${good.stderr}`);

  // And it is EXCLUDED rather than a STEP, deliberately — asserting one property twice under two
  // names leaves a second name to go stale. The reason is checked for substance by auditSuite().
  assert.ok(!STEPS.includes('check:ci-chains'), 'the entry point became a STEP without a workflow step to match it');
  assert.ok(Object.prototype.hasOwnProperty.call(EXCLUDED, 'check:ci-chains'), 'the entry point is neither a STEP nor EXCLUDED');
});

test('no ci.yml step runs a shell chain, except one allowlisted command whose reason is checked', () => {
  // THE SAME PREDICATE THE SUITE APPLIES TO package.json, applied to the file that bypasses it.
  // `npm run check` reads one exit code per step and ci.yml reads one per step too, so a chain is
  // the same defect in both places — but only one of them was ever checked.
  assert.deepEqual(
    ciChainFindings(CI), [],
    'a `run:` step in ci.yml chains commands with no allowlist entry, or an entry has gone stale. A ' +
      'chain behind one `run:` puts several commands behind one exit code: `&&` skips the rest on the ' +
      'first failure, and `;`, `|` and `&` hand back the LAST command\'s status so the failure vanishes ' +
      'with no red step at all.'
  );

  // The control: the exception is real and is exempted, so this is not a check that passes because
  // ci.yml happens to contain no chains.
  const seeded = Object.keys(CI_CHAINS_ALLOWED);
  assert.equal(seeded.length, 1, 'the allowlist grew or shrank — re-read every entry before changing this');
  assert.ok(
    ciRunCommands(CI).includes(seeded[0]),
    'the seeded allowlist entry does not match any `run:` value in ci.yml, so this test proves nothing'
  );
  assert.ok(shellOperators(seeded[0]).length > 0, 'the seeded entry exempts a command that carries no chain');

  // ── Mutation 1: a chained step added to ci.yml, which is exactly how the defect arrives ────────
  for (const [op, run] of Object.entries({
    '&&': 'npm run test:hooks && npm run test:budget',
    ';': 'npm run test:hooks ; npm run test:budget',
    '|': 'npm run test:hooks | npm run test:budget',
    '&': 'npm run test:hooks & npm run test:budget',
  })) {
    const added = `${CI.trimEnd()}\n\n      - name: A new check\n        if: \${{ !cancelled() }}\n        run: ${run}\n`;
    const found = ciChainFindings(added);
    assert.equal(found.length, 1, `a \`${op}\` chain written straight into ci.yml was accepted:\n${found.join('\n')}`);
    assert.ok(found[0].includes(`\`${op}\``), `the finding did not name the operator: ${found[0]}`);
  }

  // ── Mutation 2: the DEFEATER — a chain hidden in a command substitution inside double quotes ───
  // This is where the two halves meet. Until shellOperators() learned that `$(…)` re-enters command
  // context, this exact `run:` line passed BOTH the package.json check and this one, and the `;`
  // dropped a non-zero exit with no red step. Measured in bash: `echo "$(exit 7; exit 0)"` exits 0.
  const hidden = `${CI.trimEnd()}\n\n      - name: A new check\n        if: \${{ !cancelled() }}\n        run: echo "$(npm run test:hooks; npm run test:budget)"\n`;
  assert.equal(ciChainFindings(hidden).length, 1, 'a chain hidden in a substitution walked past the ci.yml check');

  // ── Mutation 3: the allowlisted command EDITED — the entry must go stale, not follow it ────────
  const edited = CI.replace(
    /^( *run: )bun install --frozen-lockfile --cwd mission-control && npm run check:mc$/m,
    '$1bun install --cwd mission-control && npm run check:mc && npm run check:something'
  );
  assert.notEqual(edited, CI, 'the edit mutation matched nothing, so its proof is vacuous');
  const afterEdit = ciChainFindings(edited);
  assert.equal(afterEdit.length, 2, `editing the exempted command did not bite twice:\n${afterEdit.join('\n')}`);
  assert.ok(afterEdit.some((f) => /^ci\.yml:\d+ carries/.test(f)), 'the edited command was not reported as an unexempted chain');
  assert.ok(afterEdit.some((f) => f.includes('no step in ci.yml runs')), 'the entry for the old command did not go stale');

  // ── Mutation 4: the step DELETED — the exemption must not outlive it ──────────────────────────
  const deleted = CI.replace(/^ *run: bun install --frozen-lockfile --cwd mission-control && npm run check:mc\n/m, '');
  assert.notEqual(deleted, CI, 'the deletion mutation matched nothing, so its proof is vacuous');
  assert.deepEqual(
    ciChainFindings(deleted).filter((f) => f.includes('no step in ci.yml runs')).length, 1,
    'the Mission Control step was deleted and its chain exemption still read as a considered decision'
  );

  // ── Mutation 5: the allowlist itself — a thin reason, and an entry that exempts nothing ────────
  const thin = ciChainFindings(CI, { [seeded[0]]: 'legacy' });
  assert.equal(thin.length, 1, `a one-word reason was accepted:\n${thin.join('\n')}`);
  assert.ok(thin[0].includes('no substantive reason'), thin[0]);

  const pointless = ciChainFindings(CI, { ...CI_CHAINS_ALLOWED, 'npm run test:sandbox': 'a'.repeat(60) });
  assert.equal(pointless.length, 1, `an entry exempting a single command was accepted:\n${pointless.join('\n')}`);
  assert.ok(pointless[0].includes('needs no exemption'), pointless[0]);

  // ── The negative control: a COMMENT is not a step, in either direction ─────────────────────────
  // The same property the check:mc P1 turned on. This reads `run:` values, so a chain written in a
  // comment can neither trip the check nor satisfy an exemption.
  const commented = `${CI.trimEnd()}\n# do not do this: npm run a && npm run b ; npm run c\n`;
  assert.deepEqual(ciChainFindings(commented), [], 'a chain inside a ci.yml COMMENT was reported as a step');
});

test('`continue-on-error` appears in ci.yml as a word and never as a key', () => {
  // ci.yml's own rationale rests on this: "`if:` decides whether a step RUNS. Only
  // `continue-on-error: true` stops a failed step from failing the job, and it appears nowhere in
  // this file." That sentence is what keeps `!cancelled()` from being a way to make failures
  // survivable, and nothing checked it.
  const asKey = (workflow) =>
    workflow.split('\n')
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => /^\s*(?:-\s+)?continue-on-error\s*:/.test(line))
      .map(({ n }) => n);

  assert.deepEqual(
    asKey(CI), [],
    '`continue-on-error` is set in ci.yml. A step carrying it goes red and the JOB stays green, so the ' +
      'workflow reports success on a failed check — the opposite of what the `!cancelled()` guard is for.'
  );

  // The control that says this is not a substring scan: the WORD is in the file, in the comment
  // that explains why the key is absent, and that comment must not have to be deleted to stay green.
  assert.ok(CI.includes('continue-on-error'), 'the rationale comment naming continue-on-error is gone');

  // Proved by mutation, in both places it could be written: as a step key, and on the dash line.
  const asStepKey = CI.replace(
    /^( *)run: npm run test:sandbox$/m,
    '$1continue-on-error: true\n$1run: npm run test:sandbox'
  );
  assert.notEqual(asStepKey, CI, 'the step-key mutation matched nothing, so its proof is vacuous');
  assert.equal(asKey(asStepKey).length, 1, 'continue-on-error added as a step key did not bite');

  const onDashLine = `${CI.trimEnd()}\n\n      - continue-on-error: true\n        run: npm run test:x\n`;
  assert.equal(asKey(onDashLine).length, 1, 'continue-on-error added on the dash line did not bite');
});

// ── The runner's behaviour, against fixture repos ────────────────────────────────────────────

const fixtures = [];
process.on('exit', () => {
  for (const d of fixtures) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best effort */ } }
});

/** A throwaway npm project whose scripts do exactly what a case needs and nothing else. */
function fixture(fixtureScripts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-suite-fixture-'));
  fixtures.push(dir);
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'fixture', version: '0.0.0', private: true, scripts: fixtureScripts }, null, 2)
  );
  return dir;
}

/**
 * Drive the runner over a fixture repo.
 *
 * `--steps`/`--root` are gated on CHECK_SUITE_TEST_HARNESS, so every case here sets it. `harness:
 * false` is how the gate itself gets tested — the same spawn an ordinary caller would make.
 * `steps: null` omits `--steps` entirely, which is what makes a run the FULL suite.
 */
function runRunner(dir, steps, { harness = true } = {}) {
  const args = [RUNNER, '--root', dir];
  if (steps !== null) args.push('--steps', Array.isArray(steps) ? steps.join(',') : steps);

  const env = { ...process.env };
  if (harness) env.CHECK_SUITE_TEST_HARNESS = '1';
  else delete env.CHECK_SUITE_TEST_HARNESS;

  const r = spawnSync('node', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
}

const OK = (marker) => `node -e "console.log('${marker}')"`;
const BAD = (marker) => `node -e "console.log('${marker}'); process.exitCode = 1"`;

test('a failing step does not stop the ones after it — the whole point', () => {
  const dir = fixture({
    'test:alpha': OK('ALPHA-RAN'),
    'test:beta': BAD('BETA-RAN'),
    'test:gamma': OK('GAMMA-RAN'),
  });
  const { code, out } = runRunner(dir, ['test:alpha', 'test:beta', 'test:gamma']);

  assert.ok(out.includes('GAMMA-RAN'), `the step after the failure did not run:\n${out}`);
  assert.ok(out.includes('ALPHA-RAN') && out.includes('BETA-RAN'), `earlier steps missing:\n${out}`);
  assert.equal(code, 1, 'a suite with a failing step must exit non-zero');
});

test('the summary tallies honestly and names every failing step', () => {
  const dir = fixture({
    'test:alpha': OK('a'),
    'test:beta': BAD('b'),
    'test:gamma': OK('g'),
    'test:delta': BAD('d'),
  });
  const { code, out } = runRunner(dir, ['test:alpha', 'test:beta', 'test:gamma', 'test:delta']);

  assert.match(out, /Tally: 2 of 4 passed · 2 failed/, `tally wrong or missing:\n${out}`);
  assert.match(out, /FAILED — 2 of 4 step\(s\) run did not pass/);
  assert.match(out, /✗\s+2\. test:beta — exit 1/);
  assert.match(out, /✗\s+4\. test:delta — exit 1/);
  assert.match(out, /reproduce: npm run test:beta/);
  assert.equal(code, 1);
});

test('nothing reassuring is printed above the failure list', () => {
  const dir = fixture({ 'test:alpha': OK('a'), 'test:beta': BAD('b') });
  const { out } = runRunner(dir, ['test:alpha', 'test:beta']);

  const verdict = out.indexOf('FAILED — ');
  assert.ok(verdict > 0, `no FAILED verdict in:\n${out}`);
  assert.ok(
    !out.slice(0, verdict).includes('✓'),
    'a ✓ appears above the failure list — an agent skimming the tail would read a partial run as clean'
  );
  assert.ok(!out.includes('check suite passed'), 'a failing run claimed the suite passed');
});

test('an all-passing SUBSET exits 0, says it is a subset, and does not claim the suite passed', () => {
  const dir = fixture({ 'test:alpha': OK('a'), 'test:beta': OK('b'), 'test:gamma': OK('g') });
  const { code, out } = runRunner(dir, ['test:alpha', 'test:beta', 'test:gamma']);

  assert.equal(code, 0, `expected exit 0, got ${code}:\n${out}`);
  assert.match(out, /Tally: 3 of 3 passed · 0 failed/);
  assert.match(out, /SUBSET RUN/, `a three-step run did not announce itself as a subset:\n${out}`);
  assert.match(out, /✓ 3 of 3 SELECTED step\(s\) passed/);
  // The reserved wording. An agent matching the whole-suite verdict must not be handed a green
  // three-step run wearing it — that phrase is the one `npm run check` earns and nothing else does.
  assert.ok(
    !out.includes('check suite passed — every step ran'),
    `a subset run printed the whole-suite verdict:\n${out}`
  );
  assert.ok(!out.includes('FAILED'), `a clean run mentioned FAILED:\n${out}`);
});

test('a run of the FULL declared suite earns the whole-suite verdict', () => {
  // Every real step name, stubbed green. This exercises STEPS itself and the no---steps path, so
  // the reserved wording above is pinned by a passing case as well as by the negative one; it
  // proves the phrasing and the count, not that any check asserts anything.
  const dir = fixture(Object.fromEntries(STEPS.map((s) => [s, OK(`RAN-${s}`)])));
  const { code, out } = runRunner(dir, null);

  assert.equal(code, 0, `expected exit 0, got ${code}:\n${out.slice(-800)}`);
  assert.match(out, new RegExp(`check suite — ${STEPS.length} steps, all of them`));
  assert.match(out, new RegExp(`Tally: ${STEPS.length} of ${STEPS.length} passed · 0 failed`));
  assert.match(out, /✓ check suite passed — every step ran\./);
  assert.ok(!out.includes('SUBSET RUN'), `the full suite called itself a subset:\n${out}`);
});

// ── The refusals: a run that established nothing must not read as a run that established a floor ──

test('a ZERO-step run is REFUSED — it is the maximal partial run, not a pass', () => {
  const dir = fixture({ 'test:alpha': OK('a') });

  for (const empty of [',', '', '   ', ',,,', ' , , ']) {
    const { code, out } = runRunner(dir, empty);

    assert.equal(code, 1, `--steps ${JSON.stringify(empty)} did not exit 1:\n${out}`);
    assert.match(out, /REFUSED — no check ran/, `no refusal for ${JSON.stringify(empty)}:\n${out}`);
    assert.ok(
      !out.includes('✓'),
      `a ✓ appears in a run that executed nothing (--steps ${JSON.stringify(empty)}):\n${out}`
    );
    assert.ok(!out.includes('check suite passed'), `a zero-step run claimed the suite passed:\n${out}`);
    assert.ok(!/Tally:/.test(out), `a zero-step run printed a tally, which reads as coverage:\n${out}`);
  }
});

test('--steps and --root are REFUSED without the harness variable — the injection path', () => {
  // `npm run check -- --steps ,` forwards straight to the runner. This is the guard that stops an
  // argument string from deciding how much of the oracle's floor runs; the zero-step guard above
  // is deliberately independent of it, so neither is the only thing standing there.
  const dir = fixture({ 'test:alpha': OK('a') });

  const empty = runRunner(dir, ',', { harness: false });
  assert.equal(empty.code, 1, `unharnessed --steps , did not exit 1:\n${empty.out}`);
  assert.match(empty.out, /REFUSED — no check ran/);
  assert.match(empty.out, /--steps and --root — test-only/);
  assert.ok(!empty.out.includes('✓'), `a ✓ appears in a refusal:\n${empty.out}`);

  // Not just the empty case: a NON-empty subset is refused too, so the gate is the flags
  // themselves and not a second spelling of the zero-step check.
  const nonEmpty = runRunner(dir, ['test:alpha'], { harness: false });
  assert.equal(nonEmpty.code, 1, `unharnessed --steps test:alpha did not exit 1:\n${nonEmpty.out}`);
  assert.ok(!nonEmpty.out.includes('ALPHA'), 'a refused invocation still ran a step');

  // And the refusal survives a pipe intact — it is the one path that may call process.exit().
  assert.match(empty.out, /the whole suite\s+npm run check/, `refusal truncated:\n${empty.out}`);
  assert.match(empty.out, /═{78}\n$/, `refusal did not reach its closing rule:\n${empty.out.slice(-200)}`);
});

test('a subset flag with no value is REFUSED, not ignored', () => {
  // `--steps ""` used to fall through to the FULL suite — an empty string is falsy — while the
  // banner announced a subset. Present-with-no-value is malformed; dropping it on the floor
  // leaves a caller believing a flag took effect that decided what ran.
  const dir = fixture({ 'test:alpha': OK('ALPHA-RAN') });

  const r = spawnSync('node', [RUNNER, '--root', dir, '--steps'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CHECK_SUITE_TEST_HARNESS: '1' },
  });

  assert.equal(r.status, 1, `a valueless --steps exited ${r.status}:\n${r.stdout}`);
  assert.match(r.stdout, /--steps was given with no value after it/);
  assert.ok(!r.stdout.includes('✓'), `a ✓ appears in a refusal:\n${r.stdout}`);
});

test('a step set of only unknown names cannot report clean — unresolvable is failure, not zero', () => {
  // The other half of "an empty or unresolvable step set is never a pass": names that resolve to
  // no script must be counted and named as failures, not quietly dropped to produce a short green
  // run. `npm run <missing>` exits non-zero, and the runner must carry that through.
  const dir = fixture({ 'test:alpha': OK('a') });
  const { code, out } = runRunner(dir, ['test:ghost-one', 'test:ghost-two']);

  assert.equal(code, 1, `a suite of nothing-but-unknown steps exited ${code}:\n${out}`);
  assert.match(out, /Tally: 0 of 2 passed · 2 failed/, `unknown steps were not counted as failed:\n${out}`);
  assert.match(out, /✗\s+1\. test:ghost-one/);
  assert.match(out, /✗\s+2\. test:ghost-two/);
  assert.ok(!out.includes('check suite passed'), `an all-unknown run claimed the suite passed:\n${out}`);
});

test('a step that cannot start is a failure, not a skip', () => {
  const dir = fixture({ 'test:alpha': OK('a') });
  const { code, out } = runRunner(dir, ['test:alpha', 'test:no-such-script']);

  assert.match(out, /Tally: 1 of 2 passed · 1 failed/, `a missing script was not counted as failed:\n${out}`);
  assert.equal(code, 1);
});

test('a real Ctrl+C prints INCOMPLETE and names what never started', async () => {
  // The header promises this path and, for the case that actually happens, it could not run. A
  // terminal signals the whole process GROUP; with no listener the parent took Node's default kill
  // while spawnSync had the event loop blocked, so it died without ever reading r.signal. The path
  // was reachable only when something killed the child alone, which is not what Ctrl+C does.
  const dir = fixture({
    'test:slow': `node -e "console.log('SLOW-STARTED'); setTimeout(() => {}, 30000)"`,
    'test:never': OK('NEVER-SHOULD-RUN'),
  });

  const child = spawn('node', [RUNNER, '--root', dir, '--steps', 'test:slow,test:never'], {
    detached: true,                       // its own group, so a negative pid signals it like a tty does
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CHECK_SUITE_TEST_HARNESS: '1' },
  });

  let out = '';
  child.stdout.on('data', (d) => { out += d; });

  const deadline = (ms, what) =>
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${what}\n${out}`)), ms).unref());

  try {
    // Interrupt only once the step is genuinely running. Signalling before spawnSync has started
    // the child would exercise a different path and then hang here for the full 30s.
    await Promise.race([
      new Promise((resolve) => {
        const poll = setInterval(() => {
          if (out.includes('SLOW-STARTED')) { clearInterval(poll); resolve(); }
        }, 25);
      }),
      deadline(20_000, 'the slow step never started'),
    ]);

    process.kill(-child.pid, 'SIGINT');

    const code = await Promise.race([
      new Promise((resolve) => child.on('exit', resolve)),
      deadline(20_000, 'the runner did not exit after SIGINT to its process group'),
    ]);

    assert.match(out, /INCOMPLETE — interrupted during "test:slow"/, `no INCOMPLETE verdict:\n${out}`);
    assert.match(out, /Never started:[\s\S]*\?\s+test:never/, `the step that never ran was not named:\n${out}`);
    assert.ok(!out.includes('NEVER-SHOULD-RUN'), 'the runner kept going after the interrupt');
    assert.ok(!out.includes('✓'), `a ✓ appears in an interrupted run:\n${out}`);
    assert.equal(code, 1, 'an interrupted run must not exit 0');
  } finally {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
  }
});

test('~200KB of step output reaches the caller through a pipe — no 64KB truncation', () => {
  // process.exit() does not flush an async pipe write; the payload is cut at exactly 65536 bytes
  // and the status stays 0. The runner sets process.exitCode instead. This is the proof.
  const PAYLOAD = 200_000;
  const dir = fixture({
    'test:loud': `node -e "process.stdout.write('x'.repeat(${PAYLOAD}) + '\\n')"`,
    'test:after': OK('AFTER-THE-FLOOD'),
  });
  const { code, out } = runRunner(dir, ['test:loud', 'test:after']);

  const run = /x{1000,}/.exec(out);
  assert.ok(run, `the payload did not arrive at all:\n${out.slice(0, 500)}`);
  assert.equal(run[0].length, PAYLOAD, `payload truncated at ${run[0].length} bytes (64KB is 65536)`);
  assert.ok(out.includes('AFTER-THE-FLOOD'), 'the step after the large write did not run');
  assert.match(out, /Tally: 2 of 2 passed/, `the summary was lost after a large write:\n${out.slice(-400)}`);
  assert.equal(code, 0);
});
