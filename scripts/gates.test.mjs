// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml through `npm run test:playbooks`, which
// runs this file alongside scripts/playbooks.test.mjs. It rides that step rather than taking one
// of its own on purpose: `scripts/lib/check-suite.js` owns the step list and is `irreversible`
// tier, and the subject here — what a playbook's `gate:` and `triggers:` resolve to — is a
// playbook property. `npm run gates` is the same predicate as a human-readable entry point, the
// arrangement check-suite.js documents for `check:ci-chains`.
//
// scripts/gates.test.mjs — every rule tested by constructing the input that DEFEATS it.
//
// WHY EACH FAILURE IS BUILT RATHER THAN ASSUMED
// The defect this whole change closes is a reference that resolves to nothing while everything
// reports green: `gate: qa-verdict` was checked against a four-name array and executed by no one,
// and `triggers:` was read by nothing at all. Replacing one unchecked reference with another
// would be the same defect in a new spelling. So every finding below is produced by a fixture
// that would have passed before the rule existed, and the GOOD fixture is asserted clean first,
// so a failure below is the rule firing and not the fixture being broken.
//
// The fixtures are VALUES, not files. wiringFindings() is pure for this reason: writing a fixture
// into `.claude/playbooks/` to test a checker that reads `.claude/playbooks/` makes the test
// unrunnable in parallel and, under the armed sandbox, sometimes unrunnable at all.
//
// WHY `test:playbooks` CARRIES `--test-concurrency=1`, measured here on 2026-08-26.
// `scripts/playbooks.test.mjs` lints by WRITING `.claude/playbooks/fixture.yml` and unlinking it.
// Node runs `--test` files concurrently by default, so the first run of the two together threw
// `ENOENT ... .claude/playbooks/fixture.yml` out of loadPlaybooks() here — this file read the
// directory while the other file was mid-write. The hazard is that shared directory, not this
// test: any future reader of `.claude/playbooks/` in a concurrent file meets it again, and the
// durable fix is a fixture that does not live in the tree under test. Serialising the two files
// is the narrow fix; it is named here so the next person does not rediscover it as a flake.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  wiringFindings,
  resolveGate,
  realTree,
  EXIT_FOR_STATUS,
  KINDS,
  COMMAND_ONLY,
  HUMAN_ONLY,
  GATES_PATH,
  PLAYBOOK_DIR,
  COMMAND_DIR,
} from './check-gates.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── The fixture, and the control that proves it is clean ────────────────────

const GOOD = () => ({
  gates: [
    {
      id: 'qa-verdict',
      kind: 'command',
      summary: 'A verdict of PASS is committed and bound to the exact diff being merged.',
      run: 'node scripts/verdict.mjs check',
    },
    {
      id: 'human-stop',
      kind: 'human',
      summary: 'A person has looked at the thing and said yes, which no exit code can say.',
      decided_by: 'founder',
      recorded_in: 'the session file for the task',
    },
  ],
  playbooks: [
    {
      file: '.claude/playbooks/alpha.yml',
      id: 'alpha',
      doc: {
        triggers: ['/alpha'],
        stages: [
          { id: 'frame' },
          { id: 'review', gate: 'qa-verdict' },
          { id: 'ship', gate: 'human-stop' },
        ],
      },
    },
  ],
  commands: [
    { file: '.claude/commands/alpha.md', name: '/alpha', fm: { playbook: 'alpha' } },
    { file: '.claude/commands/color.md', name: '/color', fm: {} },
  ],
  lintGates: ['qa-verdict', 'human-stop'],
  exists: (p) => p === 'scripts/verdict.mjs',
});

/** Apply a mutation to a fresh copy of GOOD and return the findings it produces. */
function findings(mutate = () => {}) {
  const t = GOOD();
  mutate(t);
  return wiringFindings(t);
}

const joined = (mutate) => findings(mutate).join('\n');

test('the fixture is clean, so every failure below is the rule and not the fixture', () => {
  assert.deepEqual(findings(), []);
});

// ── THE SHIPPED TREE. The non-vacuity anchor for everything else ────────────

test('the repository itself has no gate or trigger finding', () => {
  assert.deepEqual(wiringFindings(realTree()), []);
});

test('every shipped playbook declares at least one trigger, and every trigger reaches a command that names it back', () => {
  // Stated as its own assertion because the check above would also pass if `triggers` were
  // optional. Measured 2026-08-26 at 244e8db: 1 of 6 playbooks carried the key, and the one that
  // did omitted `/ship` while .claude/commands/ship.md declared `playbook: ship-feature`.
  const { playbooks, commands } = realTree();
  const byName = new Map(commands.map((c) => [c.name, c]));
  assert.equal(playbooks.length, 6, 'the seed set');
  for (const p of playbooks) {
    assert.ok(Array.isArray(p.doc.triggers) && p.doc.triggers.length > 0, `${p.file} has no triggers`);
    for (const t of p.doc.triggers) {
      assert.ok(byName.has(t), `${p.file}: ${t} names no command file`);
      assert.equal(byName.get(t).fm.playbook, p.id, `${t} does not name ${p.id} back`);
    }
  }
});

test('framer has dispatch sites, and every dispatch engine is a real engine', () => {
  // framer had ZERO across all six playbooks while builder had 4, sourcer 4 and designer 2 — the
  // engine that turns fuzzy into structure was dispatched by nothing, in the stage every playbook
  // opens with.
  const { playbooks } = realTree();
  const byEngine = new Map();
  for (const p of playbooks) {
    for (const s of p.doc.stages) {
      for (const d of (s.dispatch || [])) {
        byEngine.set(d.engine, (byEngine.get(d.engine) || 0) + 1);
      }
    }
  }
  assert.ok((byEngine.get('framer') || 0) >= 3, `framer has ${byEngine.get('framer') || 0} dispatch sites`);
});

// ── "A playbook naming a gate must resolve to something" ────────────────────

test('a stage naming a gate that gates.yml does not declare is refused', () => {
  assert.match(
    joined((t) => { t.playbooks[0].doc.stages[1].gate = 'probably-fine'; }),
    /gate "probably-fine" is not declared in \.claude\/gates\.yml — it resolves to nothing/,
  );
});

test('a command gate whose run: names a script that does not exist is refused', () => {
  // The exact shape of the original defect, one level down: the NAME resolves, and the thing it
  // names does not exist. A spelling allowlist cannot see this.
  assert.match(
    joined((t) => { t.gates[0].run = 'node scripts/does-not-exist.mjs check'; }),
    /run names scripts\/does-not-exist\.mjs, which does not exist — the gate resolves to nothing/,
  );
});

test('a command gate with no run: at all is refused', () => {
  assert.match(joined((t) => { delete t.gates[0].run; }), /kind "command" needs "run"/);
});

test('a run: outside scripts\\/ is refused', () => {
  assert.match(joined((t) => { t.gates[0].run = 'node ../../elsewhere.mjs'; }), /run must name a script under scripts\//);
  assert.match(joined((t) => { t.gates[0].run = 'node scripts/../etc/x.mjs'; }), /run must name a script under scripts\//);
});

test('a run: that is not node is refused', () => {
  assert.match(joined((t) => { t.gates[0].run = 'bash scripts/verdict.mjs'; }), /run must start with "node"/);
});

test('a run: carrying a shell metacharacter is refused', () => {
  for (const bad of [
    'node scripts/verdict.mjs check ; echo pass',
    'node scripts/verdict.mjs check || true',
    'node scripts/verdict.mjs check > /dev/null',
    'node scripts/verdict.mjs $(whoami)',
    'node scripts/verdict.mjs `id`',
  ]) {
    assert.match(joined((t) => { t.gates[0].run = bad; }), /carries a shell metacharacter/, bad);
  }
});

// ── "A human stop is a first-class kind, not an unimplemented one" ──────────

test('a human gate carrying run: is refused — a human stop may not be faked into a script', () => {
  assert.match(
    joined((t) => { t.gates[1].run = 'node scripts/verdict.mjs check'; }),
    /kind "human" carries "run" — a human stop may not be faked into a script/,
  );
});

test('a command gate carrying a human-only field is refused', () => {
  assert.match(
    joined((t) => { t.gates[0].why_not_a_command = 'because'; }),
    /kind "command" carries "why_not_a_command", which describes a human decision/,
  );
});

test('a human gate carrying a command-only field is refused, for every one of them', () => {
  // Enumerated rather than sampled, and enumerated FROM THE SOURCE. This loop held a hardcoded
  // second copy of the field list, which did not make the guard wrong — a new field is refused
  // whether or not a case exists — but did make this test's coverage claim decay silently: add a
  // sixth field and the test stays green having never exercised it. Iterating the export means a
  // new field arrives with a case automatically, or not at all.
  assert.ok(COMMAND_ONLY.length >= 5, 'the field list is not empty, so the loop below is not vacuous');
  for (const k of COMMAND_ONLY) {
    assert.match(joined((t) => { t.gates[1][k] = 'x'; }), new RegExp(`kind "human" carries "${k}"`), k);
  }
  for (const k of HUMAN_ONLY) {
    assert.match(joined((t) => { t.gates[0][k] = 'x'; }), new RegExp(`kind "command" carries "${k}"`), k);
  }
  // Only `run` gets the "faked into a script" sentence — it is the only one of the five that
  // would actually make a process answer a question a person has to answer.
  assert.match(joined((t) => { t.gates[1].run = 'x'; }), /may not be faked into a script/);
  assert.doesNotMatch(joined((t) => { t.gates[1].how_to_run_it = 'x'; }), /may not be faked into a script/);
});

test('the qa-verdict gate carries the recording hazard, and it names the right cut', () => {
  // NOT enforcement of the hazard — nothing here can read qa.js output. This asserts only that
  // the warning is present and still names what to look at, so it cannot be quietly deleted or
  // reduced to "be careful". A refusal returns BLOCK: the entry-refusal path in qa.js ends in
  // `return gateBlock(...)`, verified in this tree 2026-08-26, so a reader who does not know what
  // to look for cannot tell a refusal from a real finding.
  //
  // THIS ASSERTION USED TO DEMAND A COUNT OF DISPATCHED AGENTS — /agents dispatched is 0|zero
  // agents/ — and the count is not a discriminator. There is more than one refusal class: an entry
  // refusal dispatches none, an oracle dropout can dispatch four and establish nothing, and a real
  // failing check can establish something with one. The cut is whether anything was ESTABLISHED
  // about the diff. The test is kept pointed at the durable phrasing qa.js emits rather than at a
  // number, because a number invites a reader to compute the wrong thing confidently.
  // ── ANCHOR ON THE SENTENCE, NEVER ON THE WORD ────────────────────────────────────────────
  //
  // Two assertions here could not fail, and the mutation that proves it is one line: delete the
  // distinguisher sentence and this test stayed GREEN. `/REFUSED/` had 2 occurrences in the field
  // and `/established/i` had 3, so each was satisfied by prose OTHER than the sentence it was
  // labelled for — including the field's own opening words. They pinned "this word appears
  // somewhere in a fifteen-line paragraph", which is not what their labels claimed.
  //
  // The consequence was precise and bad: the discriminator fix could delete the WRONG
  // discriminator and add the RIGHT one, and this test would be green before and after. A fix
  // confirmed by an assertion that cannot fail is the defect this entire PR exists to end,
  // arriving in the test that guards the prose about it.
  //
  // Every anchor below was checked for uniqueness in the field before being used (each matches
  // exactly once) and then mutated one at a time to watch it go red. A unique substring is also
  // deliberately brittle against rewording: rewriting the load-bearing instruction SHOULD require
  // touching this test and saying why.
  const qa = realTree().gates.find((g) => g.id === 'qa-verdict');
  assert.equal(qa.kind, 'command');
  const h = String(qa.recording_hazard);
  // EXACTLY ONE, not "at least one". Zero means the sentence was deleted; two or more means the
  // anchor has stopped pinning a sentence and started pinning a word that appears twice, which is
  // how these two assertions became unfalsifiable in the first place — by accretion, not by edit.
  const once = (re, label) => {
    const n = (h.match(new RegExp(re.source, 'g')) || []).length;
    assert.equal(n, 1, `${label}: expected exactly 1 occurrence of ${re}, found ${n}. Zero = the sentence is gone. Two or more = the anchor no longer identifies one sentence, so it has stopped being an anchor.`);
  };
  once(/Look for the literal word REFUSED in the summary/, 'the instruction to look for the refusal marker');
  once(/claim of nothing established/, 'the cut: was anything established about this diff');
  once(/DO NOT USE A COUNT OF DISPATCHED AGENTS/, 'the refuted discriminator, refuted in place');
  once(/DOCUMENTATION AND NOT ENFORCEMENT/, 'it must not read as a check');
  assert.match(String(qa.how_to_run_it), /run-gate\.mjs --json/, 'the one route that builds the args correctly');
});

test('the refusal path in qa.js still returns a BLOCK, so the hazard is still real', () => {
  // The hazard above is only worth carrying while a refusal is spellable as a block. PR #115 would
  // change that — it was OPEN and DRAFT, merged=null, on 2026-08-26, and neither this branch nor
  // origin/main carried it. When it lands this assertion fails, and the failure is the signal to
  // replace the reading in `recording_hazard` with the terminal value it can then simply name.
  // A hazard notice that outlives its hazard is how a file starts teaching the past.
  // ANCHORED ON THE FINDING ID, NOT ON A BYTE BUDGET. This read
  // `/qa\.js REFUSED to run[\s\S]{0,400}?return\s+(\w+)\(/` — a 400-character window over a gap
  // that had grown to 330, leaving 70 characters of margin. A benign edit lengthening the refusal
  // summary would have produced a red test asserting "the refusal path still returns something",
  // which would be FALSE about the input: the path returns fine, the regex could not reach it.
  // That is the class this repo has already shipped once and names explicitly — a rule that fires
  // on correct code with a wrong explanation is one someone deletes rather than obeys.
  //
  // `gate-subject-unestablished` is the id of the finding the refusal emits. Anchoring there
  // removes the byte budget rather than widening it, and widening it is how the margin got to 70.
  const qa = fs.readFileSync(path.join(REPO_ROOT, '.claude', 'workflows', 'qa.js'), 'utf8');
  assert.match(qa, /qa\.js REFUSED to run/, 'the refusal summary still exists');
  const refusalReturn = /return\s+(\w+)\(\s*summary\s*,\s*\[\{[\s\S]*?id:\s*'gate-subject-unestablished'/.exec(qa);
  assert.ok(refusalReturn, 'the refusal path no longer returns the gate-subject-unestablished finding — find where it went before changing this');
  assert.equal(refusalReturn[1], 'gateBlock', 'a refusal is still spelled as a block — if this changed, update recording_hazard');
});

test('a human gate with no named approver and no place it is recorded is refused', () => {
  assert.match(joined((t) => { delete t.gates[1].decided_by; }), /needs "decided_by"/);
  assert.match(joined((t) => { delete t.gates[1].recorded_in; }), /needs "recorded_in"/);
});

test('a kind that is neither command nor human is refused', () => {
  assert.match(joined((t) => { t.gates[1].kind = 'vibes'; }), /kind "vibes" is not one of \(command, human\)/);
  assert.match(joined((t) => { delete t.gates[1].kind; }), /is not one of \(command, human\)/);
  assert.deepEqual(KINDS, ['command', 'human']);
});

test('resolving a human gate returns unresolved and never pass — Rule 10', () => {
  const g = GOOD().gates[1];
  const r = resolveGate(g, { spawn: () => { throw new Error('a human gate must never spawn anything'); } });
  assert.equal(r.status, 'unresolved');
  assert.equal(r.reason, 'human-stop');
  assert.notEqual(r.status, 'pass');
  assert.notEqual(EXIT_FOR_STATUS.unresolved, EXIT_FOR_STATUS.pass);
});

test('every human gate in the shipped file resolves unresolved, with nothing spawned', () => {
  const spawn = () => { throw new Error('spawned a human gate'); };
  for (const g of realTree().gates.filter((x) => x.kind === 'human')) {
    assert.equal(resolveGate(g, { spawn }).status, 'unresolved', g.id);
  }
});

// ── "Unresolved is not fail, and neither is pass" ───────────────────────────

test('a command gate maps exit codes to pass, fail and unresolved distinctly', () => {
  const g = GOOD().gates[0];
  const withResult = (r) => resolveGate(g, { spawn: () => ({ stdout: '', stderr: '', ...r }) });
  assert.equal(withResult({ status: 0 }).status, 'pass');
  assert.equal(withResult({ status: 1 }).status, 'fail');
  assert.equal(withResult({ status: 2 }).status, 'unresolved');
  assert.equal(withResult({ status: 127 }).status, 'unresolved');
  assert.equal(withResult({ status: null, signal: 'SIGKILL' }).status, 'unresolved');
  assert.equal(withResult({ status: null, error: new Error('ENOENT') }).status, 'unresolved');
});

test('a spawn failure never reports pass, whatever else it reports', () => {
  const g = GOOD().gates[0];
  // A resolver that could not run the command has not checked anything. Exit 0 from a failed
  // spawn is the exact shape of the deferred Codex resolver's bug (#19945), which is why this is
  // asserted rather than assumed.
  const r = resolveGate(g, { spawn: () => ({ status: 0, error: new Error('ENOENT'), stdout: '', stderr: '' }) });
  assert.equal(r.status, 'unresolved');
});

// ── "A declared gate is used, or carries a reason someone can argue with" ───

test('a gate no playbook names, with no unused_reason, is refused', () => {
  assert.match(
    joined((t) => { t.playbooks[0].doc.stages[2].gate = 'qa-verdict'; }),
    /no playbook stage names this gate, and "unused_reason" is missing or shorter than 40/,
  );
});

test('a short unused_reason does not buy the exemption', () => {
  assert.match(
    joined((t) => {
      t.playbooks[0].doc.stages[2].gate = 'qa-verdict';
      t.gates[1].unused_reason = 'we might need it';
    }),
    /shorter than 40/,
  );
});

test('a substantive unused_reason does buy it', () => {
  assert.deepEqual(
    findings((t) => {
      t.playbooks[0].doc.stages[2].gate = 'qa-verdict';
      t.gates[1].unused_reason =
        'Kept because the tier map already floors migrations at irreversible, so the policy exists and only the stage naming it is missing.';
    }),
    [],
  );
});

test('an unused_reason on a gate that IS used is refused — a stale exemption reads as governance', () => {
  assert.match(
    joined((t) => { t.gates[0].unused_reason = 'x'.repeat(60); }),
    /carries "unused_reason" but 1 stage\(s\) name it/,
  );
});

test('duplicate gate ids are refused', () => {
  assert.match(joined((t) => { t.gates[1].id = 'qa-verdict'; }), /duplicate gate id "qa-verdict"/);
});

// ── The drift guard against schema-lint's allowlist ─────────────────────────

test('a gate in schema-lint GATES that gates.yml does not declare is refused', () => {
  assert.match(
    joined((t) => { t.lintGates.push('ghost-gate'); }),
    /schema-lint\.js GATES names "ghost-gate", which \.claude\/gates\.yml does not declare/,
  );
});

test('a gate gates.yml declares that schema-lint GATES does not allow is refused', () => {
  assert.match(
    joined((t) => { t.lintGates = t.lintGates.filter((g) => g !== 'human-stop'); }),
    /declares "human-stop", which \.claude\/hooks\/schema-lint\.js GATES does not allow/,
  );
});

test('the two lists agree in the shipped tree', () => {
  const { gates, lintGates } = realTree();
  assert.deepEqual([...gates.map((g) => g.id)].sort(), [...lintGates].sort());
});

// ── The shipped values, pinned ──────────────────────────────────────────────
//
// Everything above checks the SHAPE of the wiring. Shape is not enough, and a reviewer proved it:
// repoint `qa-verdict`'s `run:` at `node scripts/lib/claims.js` — a library that exits 0 — and every
// check in this file still passes, `npm run gates` prints "✓ gate and trigger wiring resolves", and
// `resolve qa-verdict` reports PASS having verified nothing. The string
// `node scripts/verdict.mjs check` appeared only in the GOOD() fixture above, which is a VALUE and
// not the shipped file, so nothing connected the two.
//
// That is this PR's own defect class arriving one layer down, in the file written to end it: a
// one-line edit to a `lite`-tier data file makes the gate report PASS while enforcing nothing.
//
// The blast radius is bounded and that is why the fix is a pin rather than a redesign:
// `.github/workflows/qa-lead-pass.yml` calls `verdict.mjs check --json` DIRECTLY and never reads
// `gates.yml`, so this cannot disarm CI. What it can do is mislead a person running `resolve` by
// hand, which `.claude/commands/review.md` tells them to do.
//
// Pinned as exact strings on purpose. Adding a flag to the command that resolves the binding gate
// is precisely the change that should require editing a test and explaining itself.
//
// ── WHAT THESE TWO CONSTANTS DO NOT CHECK, STATED SO IT IS A TRADE AND NOT AN IMPLIED CLOSURE ──
//
// NOTHING HERE CHECKS THAT THESE PAIRS ARE THE RIGHT PAIRS. They check that the shipped tree still
// says what this file says it says. Change both together, in one commit, and every check passes.
//
// Measured on this tree, both halves:
//
//   swap validate-a-market/judge from `founder-approval` to `qa-verdict` and update SHIPPED_GATES
//     -> npm run gates 0 · test:playbooks 0 · lint:agents 0
//        A founder sign-off has become an exit code, and nothing in the repository noticed.
//   repoint qa-verdict's `run:` at `node scripts/classify.mjs` and update SHIPPED_RUN
//     -> test:playbooks 0
//        The binding gate now resolves by running the tier classifier.
//
// SO THE PIN CONVERTS A ONE-LINE `lite` EDIT INTO A TWO-FILE EDIT, AND THAT IS ALL IT DOES. It is
// still the right trade, and the reason is that the alternative regresses one level up: a third
// declaration of the same fact — a floor entry, a second constant, a schema — can be changed in
// the same commit as the other two, so it moves the coincidence rather than removing it. Every
// authority that lives inside the repo has this property; only something outside it does not.
//
// What actually catches this is a human reading the diff, and the pin is what makes that possible:
// a gate change can no longer arrive as one plausible line in a data file. It arrives as a test
// edit that says, in the diff, that someone decided a founder no longer approves this. That is a
// weaker guarantee than the ones above it and it is deliberately not described as equivalent.

/** Every `kind: command` gate that ships, and the exact argv that resolves it. */
const SHIPPED_RUN = {
  'qa-verdict': 'node scripts/verdict.mjs check',
};

/** Every stage that ships a `gate:`, and which gate. */
const SHIPPED_GATES = {
  'design-pass/critique': 'qa-verdict',
  'launch-landing-page/ship': 'outbound-approval',
  'price-a-product/review': 'qa-verdict',
  'price-a-product/commit': 'founder-approval',
  'ship-feature/review': 'qa-verdict',
  'ship-feature/ship': 'founder-approval',
  'validate-a-market/judge': 'founder-approval',
};

test('every shipped command gate resolves to the exact command it is supposed to', () => {
  const commandGates = realTree().gates.filter((g) => g.kind === 'command');
  assert.deepEqual(
    Object.fromEntries(commandGates.map((g) => [g.id, g.run])),
    SHIPPED_RUN,
    'a command gate was added, removed, or repointed — if that was deliberate, say so here',
  );
});

// ── The `#` that eats a sentence, scoped to where our parser actually eats one ──────────────
//
// I INTRODUCED THIS DEFECT at 2ca2874, writing "PR #115" inside a folded scalar. Provenance: 0
// occurrences at d1040f7 and 7ea3908, 1 from 2ca2874 onward. What a reader received was
// "PENDING, AND NOT YET TRUE: PR BLOCK, which would replace the reading above…" — no visible
// truncation, the next line folding on to make a finished sentence about a thing called PR BLOCK.
//
// ── THE FIRST VERSION OF THIS SCAN REFUSED ANY UNQUOTED `#`, AND THAT WAS WRONG ─────────────
//
// It fired on inputs nothing eats. Executed against PyYAML — a real YAML implementation, not our
// reading of the spec — one row per shape, `parseYamlSubset` beside it:
//
//   PLAIN SCALARS — six for six, our parser IS spec-conformant:
//     k: alpha PR #115, bravo        both -> "alpha PR"                 a comment, correctly
//     k: alpha#beta gamma            both -> "alpha#beta gamma"         INTACT
//     k: C# and F# notes             both -> "C# and F# notes"          INTACT
//     k: https://x/doc#approval      both -> "https://x/doc#approval"   INTACT
//     k: done  # a real comment      both -> "done"                     a comment, correctly
//     k: "alpha PR #115, bravo"      both -> intact                     quoting works
//
//   BLOCK SCALARS — AND HERE THEY DISAGREE, which is the shape F12 actually had:
//     k: >  / alpha PR #115, bravo   PyYAML -> "alpha PR #115, bravo …"  content, per spec
//                                    ours   -> "alpha PR …"              EATEN
//     k: |  / alpha PR #115, bravo   PyYAML -> keeps it · ours -> eats it
//
// So the rule is NOT "any unquoted #", and it is not "the YAML rule" either — inside a block
// scalar our parser is not the YAML rule. The line that has zero false positives BY CONSTRUCTION
// is: a whitespace-preceded, unquoted `#` on a BLOCK SCALAR continuation line. Inside a block
// scalar YAML says there is no such thing as a comment, so anything our parser strips there is
// content the author wrote and lost. On a plain-scalar line, `key: value  # note` is a real
// comment that both parsers agree on, nothing is lost, and refusing it was a house-style rule
// wearing a correctness message — with an impossible remedy attached, since `kind: "command"  #
// note` was refused too and quoting is what the message told you to do.

/**
 * Lines where OUR parser silently eats content a YAML parser would keep.
 * Pure and exported to the test below so the table can drive it directly.
 */
function commentEatenLines(text) {
  const out = [];
  let blockIndent = null; // indentation of the block scalar body we are inside, or null
  text.split('\n').forEach((line, i) => {
    const indent = line.length - line.trimStart().length;
    if (blockIndent !== null && line.trim() !== '' && indent < blockIndent) blockIndent = null;
    const inBlock = blockIndent !== null && line.trim() !== '';

    if (inBlock) {
      let s = false;
      let d = false;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (d && ch === '\\') { c++; continue; }
        if (ch === "'" && !d) s = !s;
        else if (ch === '"' && !s) d = !d;
        // The YAML comment trigger, which our parser also implements: `#` at line start or
        // preceded by whitespace. `alpha#beta` is not one, in either parser.
        else if (ch === '#' && !s && !d && (c === 0 || /\s/.test(line[c - 1]))) {
          out.push({ line: i + 1, text: line.trim() });
          return;
        }
      }
      return;
    }
    // Does THIS line open a block scalar? Its body is whatever is more indented than the key.
    if (/:\s*[>|][-+]?\s*$/.test(line)) blockIndent = indent + 1;
  });
  return out;
}

test('commentEatenLines fires on exactly the shapes our parser eats, and no others', () => {
  // The positive control this test needs, run in-process rather than inferred from the shipped
  // tree: the predicate is exercised against inputs that MUST trip it and inputs that MUST NOT.
  // The previous version asserted only "the scan saw >20 comment lines", which gates.yml alone
  // satisfies 92 times over — it proved something was read, never that the predicate works.
  const eats = (body) => commentEatenLines(`k: >\n  ${body}\n  charlie\n`).length;
  const plain = (line) => commentEatenLines(`${line}\n`).length;

  assert.equal(eats('alpha PR #115, bravo'), 1, 'the F12 shape, in a block scalar');
  assert.equal(eats('alpha # note'), 1, 'any whitespace-preceded # in a block scalar is content loss');
  assert.equal(eats('alpha#beta gamma'), 0, 'no whitespace before # — nothing is eaten, in either parser');
  assert.equal(eats('C# and F# notes'), 0, 'language names survive');
  assert.equal(eats('see https://x/doc#approval'), 0, 'URL fragments survive');
  assert.equal(eats('alpha "PR #115" bravo'), 0, 'quoted inside the block survives our parser');

  assert.equal(plain('k: done  # a real comment'), 0, 'a trailing comment on a plain scalar is a COMMENT');
  assert.equal(plain('k: "command"  # a process decides'), 0, 'the case whose remedy was impossible');
  assert.equal(plain('k: C# notes'), 0);
  assert.equal(plain('  # a whole-line comment'), 0);
});

test('no # eats a sentence in any file this checker parses', () => {
  // THREE SOURCES, because loadCommands() runs command frontmatter through the same parser and
  // the previous version of this scan covered two while its comment claimed "the files this
  // checker parses". A class named and not swept, in the commit that named the class.
  const files = [
    GATES_PATH,
    ...fs.readdirSync(path.join(REPO_ROOT, PLAYBOOK_DIR)).filter((f) => f.endsWith('.yml')).map((f) => `${PLAYBOOK_DIR}/${f}`),
    ...fs.readdirSync(path.join(REPO_ROOT, COMMAND_DIR)).filter((f) => f.endsWith('.md')).map((f) => `${COMMAND_DIR}/${f}`),
  ];
  // Scope control: the count, not a proxy for it. `commentLines > 20` was satisfied by gates.yml
  // alone, so narrowing `files` to one entry left the check green while covering nothing.
  assert.equal(files.length, 1 + 6 + 16, 'the scan no longer covers every source this checker parses');
  const offenders = files.flatMap((rel) => {
    const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
    // Command files are markdown; only the frontmatter reaches the parser.
    const yamlPart = rel.endsWith('.md') ? (text.match(/^---\n([\s\S]*?)\n---/) || [null, ''])[1] : text;
    return commentEatenLines(yamlPart).map((o) => `${rel}:${o.line}  ${o.text.slice(0, 80)}`);
  });
  assert.deepEqual(offenders, [], 'remove the space before the #, or drop the # — quoting does not help inside a block scalar under real YAML');
});

test('no gated stage dispatches an engine — the figure gates.yml asserts', () => {
  // `.claude/gates.yml` says "all seven gated stages carry ZERO dispatch entries, so this holds in
  // the data today rather than by convention", and then adds that today is the only day that is
  // checked. This is the check, and it is the `check:figures` pattern rather than another prose
  // pin: both numbers are DERIVED in four lines, so nothing here depends on how the sentence is
  // worded and it cannot decay into matching a word somewhere in a paragraph.
  //
  // Why it matters: `Workflow` is a main-session tool, so a dispatched engine asked to run a gate
  // does not have it, and a missing tool is a silent no-op. A stage that gained a dispatch beside
  // its gate would report success having gated nothing.
  //
  // Deliberately NOT the lint rule "a stage with `gate:` may not carry `dispatch:`" — that refuses
  // the legitimate arrangement of dispatching a reviewer for findings and letting the session
  // resolve the gate on them, which is the shape playbooks.test.mjs's own GOOD fixture uses. A
  // figure pinned over the shipped tree catches the drift without outlawing the correct shape.
  const stages = realTree().playbooks.flatMap((p) => p.doc.stages);
  const gated = stages.filter((s) => s.gate !== undefined);
  const gatedWithDispatch = gated.filter((s) => Array.isArray(s.dispatch) && s.dispatch.length);
  assert.equal(gated.length, Object.keys(SHIPPED_GATES).length, 'the gated-stage count moved');
  assert.deepEqual(gatedWithDispatch.map((s) => s.id), [], 'a gated stage now dispatches an engine');
});

test('every stage that gates still gates, and with the same gate', () => {
  // The checker verifies `used -> declared` and `declared -> used`. It cannot verify
  // `required -> used`, because nothing declares which stages are required to gate — so a stage
  // can DROP its `gate:` and every check stays green. This is that missing direction, pinned as
  // data rather than inferred: removing a gate from a stage, or swapping which gate it names,
  // fails here. It is the path by which a live gate quietly stops being reached.
  const live = {};
  for (const p of realTree().playbooks) {
    for (const s of p.doc.stages) {
      if (s.gate !== undefined) live[`${p.id}/${s.id}`] = s.gate;
    }
  }
  assert.deepEqual(live, SHIPPED_GATES, 'a stage gained, lost or changed its gate');
});

// ── triggers ↔ commands, in both directions ────────────────────────────────

test('a playbook with no triggers is refused', () => {
  assert.match(joined((t) => { delete t.playbooks[0].doc.triggers; }), /no "triggers" — a playbook nothing invokes is a document/);
  assert.match(joined((t) => { t.playbooks[0].doc.triggers = []; }), /no "triggers"/);
});

test('a trigger that is not a slash command is refused', () => {
  for (const bad of ['alpha', '/Alpha', '/', '/alpha beta', 42]) {
    assert.match(joined((t) => { t.playbooks[0].doc.triggers = [bad]; }), /is not a slash command of the form/, String(bad));
  }
});

test('a trigger naming a command file that does not exist is refused', () => {
  assert.match(
    joined((t) => { t.playbooks[0].doc.triggers = ['/nowhere']; }),
    /trigger "\/nowhere" names \.claude\/commands\/nowhere\.md, which does not exist/,
  );
});

test('a command naming a playbook that does not exist is refused', () => {
  assert.match(
    joined((t) => { t.commands[0].fm.playbook = 'no-such-playbook'; }),
    /names playbook "no-such-playbook", which does not exist/,
  );
});

test('a command pointing at a DIFFERENT playbook than the one triggering it is refused', () => {
  // Both directions of one relation, disagreeing. This is the live defect the checker found on
  // its first run against the real tree, in the opposite direction: ship.md declared
  // `playbook: ship-feature` and ship-feature's triggers omitted `/ship`.
  assert.match(
    joined((t) => {
      t.playbooks.push({ file: '.claude/playbooks/beta.yml', id: 'beta', doc: { triggers: ['/beta'], stages: [{ id: 'x', gate: 'human-stop' }] } });
      t.commands.push({ file: '.claude/commands/beta.md', name: '/beta', fm: { playbook: 'alpha' } });
    }),
    /frontmatter says playbook "alpha", but \.claude\/playbooks\/beta\.yml lists "\/beta" as its trigger/,
  );
});

test('a command whose playbook omits it from triggers is refused', () => {
  assert.match(
    joined((t) => { t.playbooks[0].doc.triggers = ['/color']; t.commands[1].fm.playbook = 'alpha'; }),
    /triggers omit "\/alpha", but \.claude\/commands\/alpha\.md declares it runs this playbook/,
  );
});

test('a command with no playbook frontmatter is fine — /color and /name invoke nothing', () => {
  assert.deepEqual(findings((t) => { t.commands.push({ file: '.claude/commands/name.md', name: '/name', fm: {} }); }), []);
});

test('one trigger claimed by two playbooks is refused', () => {
  assert.match(
    joined((t) => {
      t.playbooks.push({ file: '.claude/playbooks/beta.yml', id: 'beta', doc: { triggers: ['/alpha'], stages: [{ id: 'x', gate: 'human-stop' }] } });
    }),
    /trigger "\/alpha" is also a trigger of alpha — one command runs one playbook/,
  );
});

test('enter_at and stop_after naming a stage that does not exist are refused', () => {
  for (const k of ['enter_at', 'stop_after']) {
    assert.match(
      joined((t) => { t.commands[0].fm[k] = 'nowhere'; }),
      new RegExp(`${k} "nowhere" is not a stage of \\.claude/playbooks/alpha\\.yml \\(frame, review, ship\\)`),
      k,
    );
  }
  assert.deepEqual(findings((t) => { t.commands[0].fm.enter_at = 'review'; t.commands[0].fm.stop_after = 'ship'; }), []);
});

test('stop_after before enter_at is refused — an empty range runs no stage', () => {
  assert.match(
    joined((t) => { t.commands[0].fm.enter_at = 'ship'; t.commands[0].fm.stop_after = 'frame'; }),
    /stop_after "frame" comes before enter_at "ship".*empty range/,
  );
  // The boundary case is legal: entering and stopping at the same stage runs exactly that stage,
  // which is what /review is.
  assert.deepEqual(findings((t) => { t.commands[0].fm.enter_at = 'review'; t.commands[0].fm.stop_after = 'review'; }), []);
});

test('/review and /ship are distinguishable in the data, not only in prose', () => {
  // They carried byte-identical frontmatter — playbook: ship-feature, enter_at: review — while
  // /review's prose claimed they differ in where they stop. The command that must not merge and
  // the command that does were the same record.
  const byName = new Map(realTree().commands.map((c) => [c.name, c]));
  const review = byName.get('/review');
  const ship = byName.get('/ship');
  assert.equal(review.fm.playbook, 'ship-feature');
  assert.equal(ship.fm.playbook, 'ship-feature');
  assert.equal(review.fm.enter_at, 'review');
  assert.equal(ship.fm.enter_at, 'review');
  assert.equal(review.fm.stop_after, 'review', '/review must stop before the ship stage');
  assert.notDeepEqual(review.fm, ship.fm, 'two commands with identical frontmatter are one command');
});

test('every command naming ship-feature declares where it enters', () => {
  // build.md had no enter_at while fix.md had `enter_at: frame` — two spellings of one entry
  // point, and the implicit one is the one nobody notices has changed.
  for (const c of realTree().commands.filter((x) => x.fm.playbook === 'ship-feature')) {
    assert.ok(c.fm.enter_at, `${c.file} does not say where it enters the playbook`);
  }
});

test('unparseable command frontmatter is reported, never silently skipped', () => {
  assert.match(joined((t) => { t.commands[0].fm = { __error: 'tab in indentation' }; }), /frontmatter does not parse — tab in indentation/);
});
