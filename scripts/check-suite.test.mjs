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
const { STEPS, EXCLUDED, auditSuite, reachable, aliasLinks, shellOperators } = require('./lib/check-suite.js');

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
  'check:memory': ['test:memory', 'check:memory-budget'],
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

/** The guard, spelled once. `!cancelled()` and not `always()`: a cancelled run must actually stop. */
const CI_GUARD = '${{ !cancelled() }}';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The steps of ci.yml's one job, read off the indentation.
 *
 * Zero dependencies in this repo means no YAML parser, so this is a line scanner — and it derives
 * both indents from the file rather than hardcoding 6 and 8, so a reindent does not turn it
 * vacuous. It handles a `run: |` block scalar, which nothing in the file uses today; that is the
 * shape a future multi-command step would arrive in, and a scanner that skipped it would report
 * such a step as having no `run:` at all.
 *
 * Returns [{ line, name, run, uses, if }] — `null` for a key the step does not carry.
 */
function parseCiSteps(workflow) {
  const lines = workflow.split('\n');
  const steps = [];
  let stepsIndent = null;
  let itemIndent = null;
  let current = null;
  let block = null; // { key, indent, parts[] } while inside a `key: |` scalar

  const indentOf = (line) => /^ */.exec(line)[0].length;

  const record = (step, text) => {
    const m = /^([\w-]+):\s*(.*)$/.exec(text);
    if (!m) return;
    const [, key, rawValue] = m;
    if (!(key in step)) return; // `with:`, `env:` and friends are not what this asserts on
    if (/^[|>][-+\d]*$/.test(rawValue)) {
      block = { key, indent: null, parts: [] };
      step[key] = '';
      return;
    }
    step[key] = rawValue.trim();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (block) {
      if (!line.trim()) { block.parts.push(''); continue; }
      const indent = indentOf(line);
      if (block.indent === null) block.indent = indent;
      if (indent >= block.indent) {
        block.parts.push(line.slice(block.indent));
        current[block.key] = block.parts.join('\n').trim();
        continue;
      }
      block = null;
    }

    if (!line.trim() || /^\s*#/.test(line)) continue;

    if (stepsIndent === null) {
      const m = /^( *)steps:\s*$/.exec(line);
      if (m) stepsIndent = m[1].length;
      continue;
    }

    const indent = indentOf(line);
    if (indent <= stepsIndent) break; // out of the steps block

    if (/^ *- /.test(line) && (itemIndent === null || indent === itemIndent)) {
      itemIndent = indent;
      current = { line: i + 1, name: null, run: null, uses: null, if: null };
      steps.push(current);
      record(current, line.slice(indent + 2));
      continue;
    }

    if (current && indent === itemIndent + 2) record(current, line.trim());
  }

  return steps;
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
  // rejected: if checkout fails, `!cancelled()` is still true, so all 44 checks would run against an
  // empty workspace and produce ~45 red steps instead of one. That is a diagnosability cost, not a
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
  //   B · THE AGGREGATE SUITE RUNNER. `run: npm run check` in ci.yml would nest all 43 steps behind
  //       one step's exit code — the precise opacity the 44 `if:` guards exist to remove, arriving
  //       from the other direction. Nothing in that comment covers this; it is asserted because it
  //       is real, not because the comment claims it.
  //
  // The comment also says it "does not spell the string it searches for" — a workaround for a grep
  // that would otherwise match its own comment. That workaround is now unnecessary: this reads
  // `run:` values, so a comment cannot satisfy it and cannot break it either. It is the same
  // narrowing that fixed the check:mc P1, and it is why the strings below can be spelled plainly.
  const commands = ciRunCommands(CI);

  /** `node … --test …`. `(?![\w-])` so `--test-reporter=tap` alone is not a hit. */
  const DIRECT_TEST_RUNNER = /\bnode\b[^&|;]*--test(?![\w-])/;
  /** `npm run check` exactly, or the runner by path. Right-anchored: `check:curation` is not a hit. */
  const AGGREGATE_RUNNER = /npm run check(?![\w:-])|run-checks\.mjs/;

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
