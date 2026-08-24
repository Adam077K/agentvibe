// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run check:prompt-standard`.
//
// scripts/prompt-standard.test.mjs — the PS-* rules of
// docs/03-system-design/agents/PROMPT-STANDARD.md, tested by constructing their failures.
//
// The standard binds itself to a method (§0, §6.4) and this file is where that method is kept:
//
//   1. Every blocking rule is run against ALL SEVEN live engine files and must hit ZERO.
//   2. Every blocking rule must then FIRE on a constructed violation.
//   3. Added 2026-08-24 — every rule over OPEN PROSE is also run against a NEGATIVE CONTROL: one
//      paraphrase that means the same thing as the violation in step 2. If the paraphrase walks
//      past, the rule may not block.
//
// Step 2 is not ceremony. A rule that fires on nothing is not a rule — it is a sentence that reads
// as enforcement, which is the exact defect this repository has now shipped three times: eight
// CLAUDE.md rules with no mechanism, `mcpServers` declared on 52 files with no MCP config, and a
// `maxTurns` range check that a quoted value walked straight past.
//
// Step 3 is why five rules are `WARN` below and were `FAIL` before. Steps 1 and 2 alone certify a
// rule that has simply been narrowed until it stops firing, and "zero on the corpus" then reads as
// clean while meaning toothless. Four of the five had passed 1 and 2. All five failed 3.
//
// All three numbers are asserted below, per rule, so no half can rot without failing the build.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  lintFile, lintPromptStandard, checkEngineRoster, parseFrontmatter, scanSections,
  VALID_MODELS, VALID_EFFORT, ENGINES,
} = require('../.claude/hooks/schema-lint.js');

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AGENTS = path.join(REPO_ROOT, '.claude', 'agents');

/** The seven live engines, by path. These are the corpus every FAIL rule is calibrated against. */
const LIVE = ENGINES.map((e) => path.join(AGENTS, `${e}.md`));

/** Run only the PS-* block, the way the standard's §6 table is written: rule in, hits out. */
function ps(text, basename = 'builder') {
  const issues = [];
  const checks = [];
  const warnings = lintPromptStandard(
    path.join(AGENTS, `${basename}.md`), text, parseFrontmatter(text), scanSections(text), issues, checks,
  );
  return { issues, checks, warnings };
}

/**
 * The five rules demoted to WARN on 2026-08-24. Their controls below assert they still FIRE —
 * into `checks`, never `issues`. `absent` is the other half: after a demotion, an
 * `assert.deepEqual(r.issues, [])` on one of these is vacuously true and pins nothing, so every
 * "does not fire" case asserts the id is missing from `checks` instead. That is a STRONGER
 * assertion than the one it replaces, not a weaker one.
 */
const DEMOTED = [
  'PS-JUDGE-BLOCK-CONDITION', 'PS-DISPOSITION', 'PS-PRIOR-BELIEF',
  'PS-FALSE-CONSTRAINT', 'PS-BODY-TOOL-AFFIRM',
];
const absent = (r, id) => assert.ok(
  !r.checks.some((c) => c.startsWith(id)) && !r.issues.some((i) => i.startsWith(id)),
  `${id} fired: ${[...r.issues, ...r.checks].filter((x) => x.startsWith(id)).join(' | ')}`,
);

/** Write a whole agent file somewhere harmless and run the FULL lint over it. */
function lintText(text, basename = 'builder') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ps-fixture-'));
  const p = path.join(dir, `${basename}.md`);
  fs.writeFileSync(p, text);
  try {
    return lintFile(p);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// A complete, well-formed engine file. Every mutation below changes exactly one thing, so a
// failure is the rule and never the fixture — the discipline scripts/lenses.test.mjs already uses.
const GOOD = `---
name: builder
description: |
  Engine. A fixture that exists to be well-formed, so that each constructed failure below is the rule under test and nothing else.
model: claude-opus-5
effort: high
tools: [Read, Write, Edit, Glob, Grep]
maxTurns: 25
color: green
isolation: none
skills:
  - brainstorming
risk_tier_default: lite
escalates_to: orchestrator
escalates_when: |
  - The task needs a decision the brief did not make
return_contract:
  required_fields:
    - status
    - artifact_path
pre_flight_reads:
  - the lens named in the brief
---

# fixture — one artifact, returned

## Identity & mission

You take one task, produce one artifact, and return what actually landed.

## Workflow position

| Position | Value |
|----------|-------|
| **After** | A playbook stage dispatches you with a stated outcome |

## Key distinctions

- **vs reviewer:** it judges what you produced and cannot be you.

## Pre-flight reads

The lens in your brief and the files it names. Glob and Grep to locate; Read only what you change.

## Operating procedure

### Step 1 — Name the outcome

One sentence, or ask once.

### Step 2 — Produce the artifact

One logical change per commit.

### Step 3 — Verify by running

Run the thing. A build that compiles is not a build that works.

### Step 4 — Return what landed

The path, and how you verified it.

**Deviation Rules.** Auto-fix typos in files you already change. Return BLOCKED naming any
architectural decision the brief did not make.

## Output evidence

The artifact exists at the stated path, and the verification field states the command and its exit.

## Return contract

\`\`\`json
{
  "status": "COMPLETE",
  "artifact_path": "docs/04-features/specs/rate-limit.md"
}
\`\`\`

## Anti-patterns

- **DO NOT touch files outside your scope.** Note and return.
- **DO NOT make architectural decisions.** Return BLOCKED with the decision named.
- **DO NOT claim verification you did not run.**
- **DO NOT ship a placeholder, stub or TODO** as a deliverable.
`;

// ── 0 · The fixture, and the live corpus ───────────────────────────────────

test('the fixture itself is clean, so every failure below is the rule', () => {
  assert.deepEqual(ps(GOOD).issues, []);
});

test('the seven live engines pass the full lint', () => {
  for (const p of LIVE) {
    const r = lintFile(p);
    assert.deepEqual(r.issues, [], `${path.basename(p)}: ${r.issues.join(' | ')}`);
  }
});

test('EVERY PS-* blocking rule hits ZERO on the seven live engines — the §0 calibration rule', () => {
  // The half of §6.4 that is easy to skip. A rule narrowed until it fires on nothing real is only
  // half done; the other half is every `fires on a constructed violation` test below it.
  for (const p of LIVE) {
    const text = fs.readFileSync(p, 'utf8');
    const { issues } = ps(text, path.basename(p, '.md'));
    assert.deepEqual(issues, [], `${path.basename(p)} — PS-* fired: ${issues.join(' | ')}`);
  }
});

test('the roster constant agrees with disk in both directions', () => {
  assert.deepEqual(checkEngineRoster().issues, []);
});

// ── 1 · Frontmatter enums (PS-MODEL-ENUM · PS-EFFORT-ENUM · PS-MAXTURNS-RANGE) ──

test('PS-MODEL-ENUM: the target model set is the Claude-5 line plus Haiku 4.5', () => {
  // TOKEN-EFFICIENCY.md §6 is the only VERIFIED inventory of what this fleet runs.
  assert.deepEqual(VALID_MODELS, ['claude-opus-5', 'claude-sonnet-5', 'claude-fable-5', 'claude-haiku-4-5']);
});

test('PS-MODEL-ENUM fires: a superseded pin is refused, because it silently clamps effort', () => {
  const r = lintText(GOOD.replace('model: claude-opus-5', 'model: claude-sonnet-4-6'));
  assert.match(r.issues.join('\n'), /model="claude-sonnet-4-6" not in valid set/);
});

test('every live engine declares a model in the target set', () => {
  for (const p of LIVE) {
    const fm = parseFrontmatter(fs.readFileSync(p, 'utf8'));
    assert.ok(VALID_MODELS.includes(fm.model), `${path.basename(p)} pins ${fm.model}`);
  }
});

test('PS-EFFORT-ENUM: effort is REQUIRED and every live engine declares one', () => {
  for (const p of LIVE) {
    const fm = parseFrontmatter(fs.readFileSync(p, 'utf8'));
    assert.ok(VALID_EFFORT.includes(fm.effort), `${path.basename(p)} declares effort=${JSON.stringify(fm.effort)}`);
  }
  const missing = lintText(GOOD.replace('effort: high\n', ''));
  assert.match(missing.issues.join('\n'), /missing required field "effort"/);
});

test('PS-EFFORT-ENUM fires on a value outside the enum', () => {
  const r = lintText(GOOD.replace('effort: high', 'effort: maximum'));
  assert.match(r.issues.join('\n'), /effort="maximum" not in \(low\|medium\|high\|xhigh\|max\)/);
});

test('PS-EFFORT-ENUM fires on a NON-STRING effort rather than skipping the check', () => {
  // The same hole the maxTurns guard below closes: an unexpected type must fail, never fall through.
  const r = lintText(GOOD.replace('effort: high', 'effort: 3'));
  assert.match(r.issues.join('\n'), /effort=3 is not a string/);
});

// ── 2 · The maxTurns type guard — a real bug, and the ceiling ───────────────

test('PS-MAXTURNS-RANGE fires on a QUOTED value instead of silently skipping', () => {
  // THE BUG. `typeof fm.maxTurns === 'number' && (…)` — and parseFrontmatter coerces only when the
  // raw value matches /^-?\d+$/. `maxTurns: "30"` therefore arrived as a string and skipped the
  // range check entirely, so the guard meant to bound an error silently disabled it.
  const r = lintText(GOOD.replace('maxTurns: 25', 'maxTurns: "999"'));
  assert.match(r.issues.join('\n'), /maxTurns="999" is not a number/);
});

test('PS-MAXTURNS-RANGE fires on a value with a trailing comment — the second shape of the same bug', () => {
  const r = lintText(GOOD.replace('maxTurns: 25', 'maxTurns: 25 # tuned 2026-08-16'));
  assert.match(r.issues.join('\n'), /is not a number/);
});

test('PS-MAXTURNS-RANGE: the ceiling is 120, and the floor is still 5', () => {
  // At 30 the cap was setting the value rather than bounding an error: every engine sat at or near
  // it while a measured reviewer run needed 68 tool calls (CONTROL-PLANE.md §3.1).
  assert.deepEqual(lintText(GOOD.replace('maxTurns: 25', 'maxTurns: 68')).issues, []);
  assert.deepEqual(lintText(GOOD.replace('maxTurns: 25', 'maxTurns: 120')).issues, []);
  assert.match(lintText(GOOD.replace('maxTurns: 25', 'maxTurns: 121')).issues.join('\n'), /outside range \[5, 120\]/);
  assert.match(lintText(GOOD.replace('maxTurns: 25', 'maxTurns: 4')).issues.join('\n'), /outside range \[5, 120\]/);
});

test('raising the ceiling changed no live engine — they declare what they declared', () => {
  const declared = LIVE.map((p) => parseFrontmatter(fs.readFileSync(p, 'utf8')).maxTurns);
  for (const v of declared) {
    assert.equal(typeof v, 'number');
    assert.ok(v >= 5 && v <= 120, `maxTurns=${v}`);
  }
});

// ── 3 · PS-FM-KEY-ALLOWLIST ────────────────────────────────────────────────

test('PS-FM-KEY-ALLOWLIST fires on a key the schema does not know', () => {
  // The `mcpServers` failure, generalised: an unknown key is decoration by definition. Nothing
  // reads it, and it will be mistaken for a grant.
  const r = ps(GOOD.replace('color: green', 'color: green\nsandbox: strict'));
  assert.equal(r.issues.length, 1);
  assert.match(r.issues[0], /PS-FM-KEY-ALLOWLIST: frontmatter key "sandbox"/);
});

test('PS-FM-KEY-ALLOWLIST accepts mcpServers, which is real and configured', () => {
  assert.deepEqual(ps(GOOD.replace('color: green', 'mcpServers: [playwright]\ncolor: green')).issues, []);
});

// ── 4 · PS-TOOL-EXISTS ─────────────────────────────────────────────────────

test('PS-TOOL-EXISTS fires on a tool that does not exist', () => {
  const r = ps(GOOD.replace('tools: [Read, Write, Edit, Glob, Grep]', 'tools: [Read, Write, Browser]'));
  assert.equal(r.issues.length, 1);
  assert.match(r.issues[0], /PS-TOOL-EXISTS: tools entry "Browser" is not a runtime tool/);
});

// The four tests below replace one that read "PS-TOOL-EXISTS lets an mcp__ entry through —
// PS-MCP-BACKED owns that question". SUPERSEDED 2026-08-24: PS-MCP-BACKED never owned it. It
// reads `fm.mcpServers`, a different frontmatter field, so nothing checked an `mcp__` entry in
// `tools:` and the old test pinned that hole open by asserting the pass.

test('PS-TOOL-EXISTS accepts an mcp__ entry whose server IS configured', () => {
  // .mcp.json configures `playwright`, and `designer` is the one engine granted it.
  assert.deepEqual(
    ps(GOOD.replace('tools: [Read, Write, Edit, Glob, Grep]', 'tools: [Read, mcp__playwright__navigate]')).issues,
    [],
  );
});

test('PS-TOOL-EXISTS fires on an mcp__ entry naming a server nobody configured', () => {
  // The constructed violation from TARGET-ARCHITECTURE.md. It passed HEAD's linter clean.
  const r = ps(GOOD.replace('tools: [Read, Write, Edit, Glob, Grep]', 'tools: [Read, mcp__nonexistent__doAnything]'));
  assert.equal(r.issues.length, 1);
  assert.match(r.issues[0], /PS-TOOL-EXISTS: tools entry "mcp__nonexistent__doAnything" names MCP server "nonexistent"/);
});

test('PS-TOOL-EXISTS fires on a malformed mcp__ id — it is refused, never ignored', () => {
  // Ignoring these would leave `mcp__` and `mcp__playwright` as unchecked pass-throughs, which
  // is the same hole one string shorter. Both halves must be present and non-empty.
  for (const bad of ['mcp__', 'mcp__playwright', 'mcp____navigate']) {
    const r = ps(GOOD.replace('tools: [Read, Write, Edit, Glob, Grep]', `tools: [Read, ${bad}]`));
    assert.match(r.issues.join('\n'), /PS-TOOL-EXISTS: .*is not a well-formed MCP tool id/, `did not fire on: ${bad}`);
  }
});

test('PS-TOOL-EXISTS splits on the FIRST two separators — an mcp tool name may contain __', () => {
  // `mcp__playwright__browser__navigate` is server `playwright`, tool `browser__navigate`. A
  // strict three-part split would reject a real tool id; the server half is what is checkable.
  assert.deepEqual(
    ps(GOOD.replace('tools: [Read, Write, Edit, Glob, Grep]', 'tools: [Read, mcp__playwright__browser__navigate]')).issues,
    [],
  );
});

// ── 5 · PS-SECTION-BOOKENDS · PS-STEP-SHAPE · PS-ANTIPATTERN-SHAPE ─────────

test('PS-SECTION-BOOKENDS fires when the first section is not Identity & mission', () => {
  const r = ps(GOOD.replace('## Identity & mission', '## Overview'));
  assert.match(r.issues.join('\n'), /PS-SECTION-BOOKENDS: first section is "## Overview"/);
});

test('PS-SECTION-BOOKENDS fires when Anti-patterns is not last', () => {
  const r = ps(`${GOOD}\n## Notes\n\nSomething trailing.\n`);
  assert.match(r.issues.join('\n'), /PS-SECTION-BOOKENDS: last section is "## Notes"/);
});

test('PS-STEP-SHAPE fires when Operating procedure has no Step heading', () => {
  const r = ps(GOOD.replace(/### Step \d+ — /g, '#### '));
  assert.match(r.issues.join('\n'), /PS-STEP-SHAPE: "## Operating procedure" contains no "### Step N" heading/);
});

test('PS-STEP-SHAPE fires on a step heading that describes instead of instructing', () => {
  // NOT_AN_INSTRUCTION, scoped to the HEADING TEXT. It stays off body prose, which legitimately
  // opens paragraphs with "The tool list above is the mission" (reviewer.md:37).
  const r = ps(GOOD.replace('### Step 1 — Name the outcome', '### Step 1 — The outcome should be named'));
  assert.match(r.issues.join('\n'), /PS-STEP-SHAPE: step heading reads as description/);
});

test('PS-STEP-SHAPE does NOT fire on designer\'s "Render and look" — §0, the rule this standard was calibrated against', () => {
  const r = ps(GOOD.replace('### Step 3 — Verify by running', '### Step 3 — Render and look'));
  assert.deepEqual(r.issues, []);
});

test('PS-ANTIPATTERN-SHAPE fires on a bullet that is not a DO NOT', () => {
  const r = ps(GOOD.replace('- **DO NOT claim verification you did not run.**', '- **Prefer** small commits.'));
  assert.match(r.issues.join('\n'), /PS-ANTIPATTERN-SHAPE: bullet under "## Anti-patterns" must open/);
});

test('PS-ANTIPATTERN-SHAPE tolerates a wrapped bullet — a continuation line is not a bullet', () => {
  // reviewer.md has two of these. A line-naive rule would fail a correct file.
  const r = ps(GOOD.replace(
    '- **DO NOT claim verification you did not run.**',
    '- **DO NOT claim verification you did not run.** If you want to, that is the signal that the\n  work belongs somewhere else.',
  ));
  assert.deepEqual(r.issues, []);
});

// ── 6 · PS-STATUS-FIELD · PS-RETURN-EXAMPLE-MATCHES ────────────────────────

test('PS-STATUS-FIELD fires when required_fields omits status', () => {
  const r = ps(GOOD.replace('    - status\n', ''));
  assert.match(r.issues.join('\n'), /PS-STATUS-FIELD: return_contract.required_fields does not include "status"/);
});

test('PS-RETURN-EXAMPLE-MATCHES fires when the example is missing a required field', () => {
  // §1.5: nothing validates a return against `return_contract`. This is the one guarantee a linter
  // can give — that the file agrees with itself.
  const r = ps(GOOD.replace(
    '  "status": "COMPLETE",\n  "artifact_path": "docs/04-features/specs/rate-limit.md"\n',
    '  "status": "COMPLETE"\n'));
  assert.match(r.issues.join('\n'), /PS-RETURN-EXAMPLE-MATCHES: .*missing \[artifact_path\]/);
});

test('PS-RETURN-EXAMPLE-MATCHES fires on an extra key the contract does not declare', () => {
  const r = ps(GOOD.replace('"status": "COMPLETE",', '"status": "COMPLETE",\n  "notes": "…",'));
  assert.match(r.issues.join('\n'), /PS-RETURN-EXAMPLE-MATCHES: .*extra \[notes\]/);
});

test('PS-RETURN-EXAMPLE-MATCHES fires when the example is not parseable JSON', () => {
  const r = ps(GOOD.replace('"status": "COMPLETE",', '"status": COMPLETE,'));
  assert.match(r.issues.join('\n'), /does not parse/);
});

test('the nested required_fields list actually parses — without it both rules above are vacuous', () => {
  // Regression on the parser, not on the rules. `return_contract.required_fields` used to come back
  // as the empty string because the sub-key branch dropped `- item` lines, and a rule reading an
  // empty list passes on everything.
  for (const p of LIVE) {
    const fm = parseFrontmatter(fs.readFileSync(p, 'utf8'));
    assert.ok(Array.isArray(fm.return_contract?.required_fields), `${path.basename(p)}`);
    assert.ok(fm.return_contract.required_fields.includes('status'), `${path.basename(p)}`);
  }
});

// ── 7 · PS-JUDGE-BLOCK-CONDITION ───────────────────────────────────────────

test('PS-JUDGE-BLOCK-CONDITION fires on a read-only engine that names no BLOCKED condition', () => {
  // §4: a file that needs adversarial behaviour may not ask for a mood. It names the artifact it
  // judges against and the condition under which it refuses.
  const stripped = GOOD.replace(/BLOCKED/g, 'a note');
  const r = ps(stripped, 'reviewer');
  assert.deepEqual(r.issues, [], 'demoted 2026-08-24 — it may never reach the blocking list');
  assert.match(r.checks.join('\n'), /PS-JUDGE-BLOCK-CONDITION/);
});

test('PS-JUDGE-BLOCK-CONDITION does not apply to producing engines', () => {
  absent(ps(GOOD.replace(/BLOCKED/g, 'a note'), 'builder'), 'PS-JUDGE-BLOCK-CONDITION');
});

test('both read-only engines name the condition today', () => {
  for (const name of ['reviewer', 'reviewer-readonly']) {
    const text = fs.readFileSync(path.join(AGENTS, `${name}.md`), 'utf8');
    const r = ps(text, name);
    assert.deepEqual(r.issues, [], name);
    absent(r, 'PS-JUDGE-BLOCK-CONDITION');
  }
});

// ── 8 · PS-DISPOSITION — the ban on a mood in place of a mechanism ─────────

const DISPOSITION_CONTROLS = [
  'Be critical when you read the diff.',
  'You are a world-class security engineer.',
  'Carefully review every changed line before returning.',
  'Take your time and do your best.',
];

test('PS-DISPOSITION fires on all four constructed violations', () => {
  for (const line of DISPOSITION_CONTROLS) {
    const r = ps(GOOD.replace('One sentence, or ask once.', line));
    assert.deepEqual(r.issues, [], `demoted — must not block: ${line}`);
    assert.match(r.checks.join('\n'), /PS-DISPOSITION/, `did not fire on: ${line}`);
  }
});

test('PS-DISPOSITION does not ban strong language that names a mechanism', () => {
  // reviewer.md:37 — "an agent that can edit what it reviews will review what it can edit" — is a
  // mechanism, and it stays. The ban is on asking for a mood INSTEAD of one.
  const r = ps(GOOD.replace(
    'One sentence, or ask once.',
    'An agent that can edit what it reviews will review what it can edit, so this one holds no Write.',
  ));
  absent(r, 'PS-DISPOSITION');
});

test('PS-DISPOSITION reads the frontmatter description too — it reaches the model', () => {
  const r = ps(GOOD.replace('Engine. A fixture', 'Engine. Be thorough. A fixture'));
  assert.deepEqual(r.issues, [], 'demoted — must not block');
  assert.match(r.checks.join('\n'), /PS-DISPOSITION/);
});

// ── 9 · PS-PRIOR-BELIEF — the 97.2% → 3.6% class ──────────────────────────

const PRIOR_BELIEF_CONTROLS = [
  'The diff is believed to be correct, so look for style problems.',
  'Assume the finding is a false positive unless proven otherwise.',
  'This change has already been reviewed by the author.',
  'The code is correct; confirm it.',
];

test('PS-PRIOR-BELIEF fires on all four constructed violations', () => {
  // Framing alone collapsed vulnerability detection from 97.2% to 3.6% on GPT-4o-mini and 68.4% to
  // 8.5% on Claude 3.5 Haiku across 250 CVE patch pairs; redaction recovered it to 94-100%
  // (arXiv:2603.18740 via MODEL-DIVERSITY.md:34-44). Nothing else in the standard has that
  // magnitude, and it is a word-choice finding — same model, same pairs, one clause removed.
  for (const line of PRIOR_BELIEF_CONTROLS) {
    const r = ps(GOOD.replace('One sentence, or ask once.', line));
    assert.deepEqual(r.issues, [], `demoted — must not block: ${line}`);
    assert.match(r.checks.join('\n'), /PS-PRIOR-BELIEF/, `did not fire on: ${line}`);
  }
});

test('PS-PRIOR-BELIEF leaves PROVENANCE alone — it describes the artifact, not its verdict', () => {
  const r = ps(GOOD.replace(
    'One sentence, or ask once.',
    'State whether this diff touches auth and whether it is the third attempt at the same failure.',
  ));
  absent(r, 'PS-PRIOR-BELIEF');
});

// ── 10 · PS-FALSE-CONSTRAINT — statements this repo has measured false ────

const FALSE_CONSTRAINT_CONTROLS = [
  'Subagents cannot spawn subagents, so do the work yourself.',
  'maxTurns is advisory and does not bind, so ignore it.',
  'Remember that tools: binds Bash at the runtime.',
];

test('PS-FALSE-CONSTRAINT fires on all three constructed violations', () => {
  // A false constraint is worse than a missing one, because it is obeyed. This is the class that
  // produced the nested-spawn fabrication, and CLAUDE.md rule 9 exists because of it.
  for (const line of FALSE_CONSTRAINT_CONTROLS) {
    const r = ps(GOOD.replace('One sentence, or ask once.', line));
    assert.deepEqual(r.issues, [], `demoted — must not block: ${line}`);
    assert.match(r.checks.join('\n'), /PS-FALSE-CONSTRAINT/, `did not fire on: ${line}`);
  }
});

test('PS-FALSE-CONSTRAINT leaves the HEDGED, TRUE sentence alone', () => {
  // reviewer-readonly.md:46 reads "`tools:` is not known to bind `Bash`". That is true, load-bearing
  // — it is why reviewer-readonly exists — and the list is written to leave it alone.
  const r = ps(GOOD.replace(
    'One sentence, or ask once.',
    'The field `tools:` is not known to bind `Bash`, which is why the judge gets a container with no shell.',
  ));
  absent(r, 'PS-FALSE-CONSTRAINT');
});

// ── 11 · PS-BODY-TOOL-AFFIRM — paragraph-scoped, and that is the point ────

test('PS-BODY-TOOL-AFFIRM fires on a direction to use a tool the frontmatter does not grant', () => {
  const r = ps(GOOD.replace('Run the thing. A build that compiles is not a build that works.',
    'Run the suite with `Bash` before returning a verdict.'));
  assert.deepEqual(r.issues, [], 'demoted — must not block');
  assert.match(r.checks.join('\n'), /PS-BODY-TOOL-AFFIRM: the body directs use of `Bash`/);
});

test('PS-BODY-TOOL-AFFIRM leaves a NEGATION alone — all seven out-of-grant mentions today are negations', () => {
  const r = ps(GOOD.replace('One sentence, or ask once.',
    'You have no `Bash`. You cannot run the test suite or shell out to git.'));
  absent(r, 'PS-BODY-TOOL-AFFIRM');
});

test('PS-BODY-TOOL-AFFIRM is PARAGRAPH-scoped: a negation that wraps to the next line still clears it', () => {
  // §5.2: a LINE is not a sentence in a file that hard-wraps at ~110 characters. Line-scoped, this
  // rule fires on 2 correct negations in reviewer-readonly.md. Paragraph-scoped it measures 0.
  const r = ps(GOOD.replace('One sentence, or ask once.',
    'This engine was given `general-purpose` with tools `*` — holding `Bash` on the diff under\njudgement. That grant is not one it should have; use the container that removed it.'));
  absent(r, 'PS-BODY-TOOL-AFFIRM');
});

test('PS-BODY-TOOL-AFFIRM does not fire on a granted tool', () => {
  const r = ps(GOOD.replace('One sentence, or ask once.', 'Use `Grep` to locate the call sites first.'));
  absent(r, 'PS-BODY-TOOL-AFFIRM');
});

// ── 12 · PS-PIPELINE-RESTATE ───────────────────────────────────────────────

test('PS-PIPELINE-RESTATE fires on a chain of three or more stage ids of one playbook', () => {
  // Two descriptions of one pipeline disagree silently. `/build` alone once restated it in 50 lines
  // while the playbook also declared it.
  const r = ps(GOOD.replace('One sentence, or ask once.', 'Your pipeline is frame → plan → build → review → ship.'));
  assert.match(r.issues.join('\n'), /PS-PIPELINE-RESTATE: .*ship-feature/);
});

test('PS-PIPELINE-RESTATE fires on comma and arrow forms alike', () => {
  for (const chain of ['frame, plan, build', 'frame -> plan -> build', 'frame then plan then build']) {
    const r = ps(GOOD.replace('One sentence, or ask once.', `The stages are ${chain}.`));
    assert.match(r.issues.join('\n'), /PS-PIPELINE-RESTATE/, `did not fire on: ${chain}`);
  }
});

test('PS-PIPELINE-RESTATE does NOT fire on two stage ids, or on ids drawn from different playbooks', () => {
  // Scoped this tightly on purpose: the stage ids are ordinary English words, and any looser rule
  // would fire on every file in the repository.
  assert.deepEqual(ps(GOOD.replace('One sentence, or ask once.', 'Move from frame to build.')).issues, []);
  assert.deepEqual(ps(GOOD.replace('One sentence, or ask once.', 'Compare critique, positioning, synthesise.')).issues, []);
});

test('PS-PIPELINE-RESTATE does not fire on the return-contract JSON of any live engine', () => {
  // orchestrator.md's example carries `"engines_dispatched": ["builder", "reviewer"]`, which is a
  // comma-separated list next door to two stage ids. It must stay clean, and it does.
  for (const p of LIVE) {
    const { issues } = ps(fs.readFileSync(p, 'utf8'), path.basename(p, '.md'));
    assert.ok(!issues.some((i) => i.startsWith('PS-PIPELINE-RESTATE')), path.basename(p));
  }
});

// ── 12b · The five demoted to WARN, 2026-08-24 ────────────────────────────

test('the five demoted rules can NEVER reach the blocking list, on any input', () => {
  // One assertion per rule, each on the input that used to fail the build. If a later change
  // pushes any of these back onto `issues`, this goes red before it can refuse anyone's merge.
  const cases = [
    ['PS-JUDGE-BLOCK-CONDITION', GOOD.replace(/BLOCKED/g, 'a note'), 'reviewer'],
    ['PS-DISPOSITION', GOOD.replace('One sentence, or ask once.', 'Be critical when you read the diff.'), 'builder'],
    ['PS-PRIOR-BELIEF', GOOD.replace('One sentence, or ask once.', 'The code is correct; confirm it.'), 'builder'],
    ['PS-FALSE-CONSTRAINT', GOOD.replace('One sentence, or ask once.', 'Subagents cannot spawn subagents, so do the work yourself.'), 'builder'],
    ['PS-BODY-TOOL-AFFIRM', GOOD.replace('Run the thing. A build that compiles is not a build that works.', 'Run the suite with `Bash` before returning a verdict.'), 'builder'],
  ];
  assert.deepEqual(cases.map((c) => c[0]), DEMOTED, 'a rule was demoted or restored without updating this list');
  for (const [id, text, basename] of cases) {
    const r = ps(text, basename);
    assert.deepEqual(r.issues, [], `${id} reached the blocking list`);
    assert.match(r.checks.join('\n'), new RegExp(id), `${id} stopped firing entirely — a demotion is not a deletion`);
  }
});

test('each demoted rule is defeated by a paraphrase — the negative control that demoted them', () => {
  // The missing test of §0's method, built in TARGET-ARCHITECTURE.md: zero-on-corpus plus
  // fires-on-one-control is NOT sufficient, because narrowing a predicate until it stops firing
  // is indistinguishable from fixing it. Each line below means the same thing as a control the
  // rule DOES catch, and every one of them walks past. This is the evidence for WARN, and it is
  // pinned so that "we could sharpen these back into FAIL" stays an argument someone has to win
  // with a rule that survives its own paraphrase.
  const paraphrases = [
    ['PS-DISPOSITION', 'Be extremely critical.'],
    ['PS-PRIOR-BELIEF', 'Two senior engineers shipped this. Findings here are usually noise.'],
    ['PS-FALSE-CONSTRAINT', 'A subagent has no way to start another subagent, so do it yourself.'],
  ];
  for (const [id, line] of paraphrases) {
    absent(ps(GOOD.replace('One sentence, or ask once.', line)), id);
  }
  // PS-BODY-TOOL-AFFIRM: the same directive it catches, plus one negation word in the paragraph.
  absent(ps(GOOD.replace('Run the thing. A build that compiles is not a build that works.',
    'Run the suite with `Bash` before returning a verdict. Do not skip it.')), 'PS-BODY-TOOL-AFFIRM');
  // PS-JUDGE-BLOCK-CONDITION: it cannot tell a named condition from the word appearing anywhere.
  absent(ps(GOOD.replace(/BLOCKED/g, 'a note').replace('One sentence, or ask once.',
    'Nobody enjoys being BLOCKED by a review.'), 'reviewer'), 'PS-JUDGE-BLOCK-CONDITION');
});

test('none of the five fires on any live engine — demoted, not merely quieted', () => {
  // They measured zero as FAIL rules and they still measure zero. `npm run lint:agents` reports
  // 18 pass, 0 fail, 0 warnings, and this is the half of that number these rules own.
  for (const p of LIVE) {
    const r = ps(fs.readFileSync(p, 'utf8'), path.basename(p, '.md'));
    for (const id of DEMOTED) absent(r, id);
  }
});

// ── 13 · The warnings, and why they may never block ───────────────────────

test('PS-BODY-VAGUE is a WARNING and can never fail a build', () => {
  // §0: reused over agent prose, `VAGUE` fails 6 of the 7 files this standard exists to certify —
  // including `### Step 4 — Render and look` in the one engine whose reason to exist is that it
  // looks at rendered output. It surfaces real vagueness; it cannot tell those apart.
  const r = ps(GOOD.replace('Run the thing. A build that compiles is not a build that works.',
    'Check that the output looks reasonable.'));
  assert.deepEqual(r.issues, [], 'PS-BODY-VAGUE must never reach the blocking list');
  assert.match(r.checks.join('\n'), /PS-BODY-VAGUE/);
});

test('PS-BODY-VAGUE fires 0 of 7 live files — §0 update: looks?/feels? removed from BODY_VAGUE', () => {
  // 2026-08-16: BODY_VAGUE excludes `looks?` and `feels?` from the agent-body check.
  // All 10 formerly-flagged sites were confirmed correct prose (see PROMPT-STANDARD.md §0).
  // The rule still fires on constructed vagueness (below) via "reasonable" and other words.
  let files = 0;
  let sites = 0;
  for (const p of LIVE) {
    const { checks } = ps(fs.readFileSync(p, 'utf8'), path.basename(p, '.md'));
    const hit = checks.find((c) => c.startsWith('PS-BODY-VAGUE'));
    if (hit) { files++; sites += hit.match(/\d+/g).length; }
  }
  assert.equal(files, 0, 'BODY_VAGUE §0 update: fires on 0 of 7 live files');
  assert.equal(sites, 0, 'BODY_VAGUE §0 update: 0 false-positive sites');
});

test('PS-BODY-VAGUE non-vacuity: fires on exactly 3 genuine hand-waves with no anchor', () => {
  // Non-vacuity proof: replacing `/(?!)/` for BODY_VAGUE would make this go red.
  // Three distinct vague phrases, each on its own line, each without an ANCHOR word:
  //   "The output looks good."        → caught by "good"
  //   "Handle errors appropriately."  → caught by "appropriate" (not "appropriately" — word boundary)
  //   "Refactor the code as needed."  → caught by "as needed"
  // Inserted at the Step 3 body of the GOOD fixture, which contains no other BODY_VAGUE matches.
  const vague = GOOD.replace(
    'Run the thing. A build that compiles is not a build that works.',
    'The output looks good.\nHandle errors in an appropriate way.\nRefactor the code as needed.'
  );
  const r = ps(vague);
  assert.deepEqual(r.issues, [], 'PS-BODY-VAGUE must never reach the blocking list');
  const hit = r.checks.find((c) => c.startsWith('PS-BODY-VAGUE'));
  assert.ok(hit, 'PS-BODY-VAGUE must fire on the three injected hand-wave lines');
  const flaggedCount = (hit.match(/\d+/g) || []).length;
  assert.equal(flaggedCount, 3,
    `expected exactly 3 flagged body lines, got ${flaggedCount} — rule: ${hit}`);
});

test('PS-SECTION-ORDER is silent on reviewer-readonly after section order fix (2026-08-16)', () => {
  // Before: reviewer-readonly had Pre-flight reads before Workflow position.
  // That was intentional structure (the file explains its own existence first) but produced
  // a lint noise that obscured the two real warnings. Reordered to canonical order in the
  // same PR that fixed those warnings. The rule itself stays — it still catches violations
  // in constructed fixtures; it just no longer fires on correct files.
  const { issues, checks } = ps(
    fs.readFileSync(path.join(AGENTS, 'reviewer-readonly.md'), 'utf8'), 'reviewer-readonly');
  assert.deepEqual(issues, []);
  assert.ok(!checks.some((c) => c.startsWith('PS-SECTION-ORDER')),
    'PS-SECTION-ORDER should not fire on correctly ordered reviewer-readonly.md');
});

test('PS-LENGTH-BAND · PS-STEP-COUNT · PS-ANTIPATTERN-COUNT are silent on all seven', () => {
  for (const p of LIVE) {
    const { checks } = ps(fs.readFileSync(p, 'utf8'), path.basename(p, '.md'));
    for (const id of ['PS-LENGTH-BAND', 'PS-STEP-COUNT', 'PS-ANTIPATTERN-COUNT']) {
      assert.ok(!checks.some((c) => c.startsWith(id)), `${id} fired on ${path.basename(p)}`);
    }
  }
});

test('PS-LENGTH-BAND and the count bands do fire outside the observed range', () => {
  // The fixture is ~80 lines and therefore under the band already — the short direction is proved
  // by the fixture itself, and the long direction by padding it well past 175.
  assert.match(ps(GOOD).checks.join('\n'), /PS-LENGTH-BAND/);
  const long = ps(`${GOOD}\n${'\nfiller line, deliberately outside the band.'.repeat(200)}`);
  assert.match(long.checks.join('\n'), /PS-LENGTH-BAND/);
  const fewSteps = ps(GOOD.replace(/### Step [34] — [^\n]*\n\n[^\n]*\n/g, ''));
  assert.match(fewSteps.checks.join('\n'), /PS-STEP-COUNT/);
  const fewAnti = ps(GOOD.replace('- **DO NOT ship a placeholder, stub or TODO** as a deliverable.\n', ''));
  assert.match(fewAnti.checks.join('\n'), /PS-ANTIPATTERN-COUNT/);
});

// ── 14 · checkEngineRoster — drift, in both directions ────────────────────

function rosterDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ps-roster-'));
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
  return dir;
}

test('checkEngineRoster fires when disk holds a non-shim agent ENGINES does not list', () => {
  // This is how `framer` came to be an engine in the linter and a cut container in the spec: the
  // constant is hand-maintained, and nothing compared it to disk.
  const dir = rosterDir({ 'builder.md': '---\nname: builder\n---\n', 'ghost.md': '---\nname: ghost\n---\n' });
  try {
    const r = checkEngineRoster(dir, ['builder']);
    assert.equal(r.issues.length, 1);
    assert.match(r.issues[0], /ghost\.md is a non-shim agent that ENGINES does not list/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('checkEngineRoster fires when ENGINES names a file that is absent', () => {
  const dir = rosterDir({ 'builder.md': '---\nname: builder\n---\n' });
  try {
    const r = checkEngineRoster(dir, ['builder', 'instrument']);
    assert.equal(r.issues.length, 1);
    assert.match(r.issues[0], /ENGINES lists "instrument" but instrument\.md is absent/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('checkEngineRoster ignores shims — a name kept occupied is not an engine', () => {
  const dir = rosterDir({
    'builder.md': '---\nname: builder\n---\n',
    'ceo.md': '---\nname: ceo\nkind: shim\nengine: orchestrator\n---\n',
  });
  try {
    assert.deepEqual(checkEngineRoster(dir, ['builder']).issues, []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the live roster is the eight-engine decision minus the two files nobody has written', () => {
  // Founder decision 2026-08-16: `framer` is KEPT. `instrument` and `operator` are specified and do
  // not exist; they join ENGINES in the PR that creates their files, not before.
  assert.deepEqual([...ENGINES].sort(), [
    'builder', 'designer', 'framer', 'orchestrator', 'reviewer', 'reviewer-readonly', 'sourcer',
  ]);
  for (const e of ['instrument', 'operator']) {
    assert.ok(!fs.existsSync(path.join(AGENTS, `${e}.md`)), `${e}.md exists — add it to ENGINES`);
  }
});

// ── 15 · Shims must never see these rules ─────────────────────────────────

test('a shim is not held to the prompt standard', () => {
  // A shim is 24 lines pointing at an engine. Requiring it to carry seven body sections, a return
  // contract and a Step 1 would just invite filler, which is what the standard is against.
  const r = lintFile(path.join(AGENTS, 'ceo.md'));
  assert.equal(r.status, 'pass');
  assert.ok(r.shim);
  assert.deepEqual(r.issues, []);
});

test('a shim may not declare effort either — it routes, it does not run', () => {
  const shim = fs.readFileSync(path.join(AGENTS, 'ceo.md'), 'utf8').replace('kind: shim', 'kind: shim\neffort: max');
  const r = lintText(shim, 'ceo');
  assert.match(r.issues.join('\n'), /shim: must not declare "effort"/);
});
