// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:skill-clamp`.
//
// scripts/skill-clamp.test.mjs — a skill that subtracts must not be attached silently.
//
// `allowed-tools` in a SKILL.md is capability frontmatter: the binary documents it as "Tools
// available to the model while this file is active." It is a CEILING, not a grant. An agent
// that loads such a skill is clamped to that list for as long as the skill is active.
//
// Eight skills in this repo declare it. Six clamp to a plausible-looking developer set and
// quietly remove Bash and every MCP tool. Two clamp to a SINGLE Bash pattern:
//
//   impeccable          → Bash(npx impeccable *), Bash(node .claude/skills/impeccable/scripts/*)
//   pitch-deck-visuals  → Bash(belt *)
//
// An agent holding either would lose Read, Write, Edit and every MCP server. `impeccable` is
// the skill the roster specification assigns to `designer` — an engine whose entire reason to
// exist is a browser perception loop it would then be unable to reach, to run a CLI that is not
// installed on this machine.
//
// No agent declares one today, which is exactly why this rule is cheap to add now and would be
// expensive to discover during the migration.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { lintFile } = require(path.join(REPO, '.claude', 'hooks', 'schema-lint.js'));

const AGENTS_DIR = path.join(REPO, '.claude', 'agents');

// Write a throwaway agent file INSIDE .claude/agents/ so relative resolution matches production,
// lint it, then remove it. The name is unlikely to collide and is cleaned up in `finally`.
function lintAgentWith(skills, extra = '') {
  const name = `zz-skill-clamp-fixture-${process.pid}`;
  const file = path.join(AGENTS_DIR, `${name}.md`);
  const body = `---
name: ${name}
description: |
  Throwaway fixture written by scripts/skill-clamp.test.mjs. If this file is on disk, a test run died before its cleanup.
model: claude-sonnet-4-6
tools: [Read, Glob, Grep]
color: gray
isolation: none
skills:
${skills.map((s) => `  - ${s}`).join('\n')}
risk_tier_default: lite
escalates_to: orchestrator
escalates_when: |
  Never — this is a test fixture.
${extra}---

## Purpose

Fixture.
`;
  try {
    fs.writeFileSync(file, body);
    return (lintFile(file) || {}).issues || [];
  } finally {
    fs.rmSync(file, { force: true });
  }
}

const isLink = (p) => { try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; } };

const clampIssues = (issues) => issues.filter((i) => /allowed-tools/.test(i));

test('attaching a skill that clamps to one Bash pattern is refused, and the message names the clamp', () => {
  const issues = lintAgentWith(['impeccable']);
  const found = clampIssues(issues);
  assert.equal(found.length, 1, `expected exactly one clamp issue, got: ${JSON.stringify(issues)}`);
  assert.match(found[0], /impeccable/);
  assert.match(found[0], /SUBTRACTS/, 'the message must say which direction the field acts');
  assert.match(found[0], /npx impeccable/, 'the message must quote the actual clamp, not just its existence');
});

test('pitch-deck-visuals is caught too — the inline single-value form parses', () => {
  const found = clampIssues(lintAgentWith(['pitch-deck-visuals']));
  assert.equal(found.length, 1);
  assert.match(found[0], /belt/);
});

test('the comma-separated inline form is caught, not only the block-list form', () => {
  // react-patterns declares `allowed-tools: Read, Write, Edit, Glob, Grep` on one line. It looks
  // harmless and is not: it removes Bash and every MCP tool from whatever loads it.
  const found = clampIssues(lintAgentWith(['react-patterns']));
  assert.equal(found.length, 1);
  assert.match(found[0], /Read, Write, Edit/);
});

test('every clamping skill in a multi-skill list is reported, not just the first', () => {
  const found = clampIssues(lintAgentWith(['impeccable', 'react-patterns', 'tdd-workflow']));
  assert.equal(found.length, 3, 'a partial report would let the second clamp through unnoticed');
});

test('skills that do not declare allowed-tools attach cleanly', () => {
  const found = clampIssues(lintAgentWith(['security-audit', 'agent-evaluation']));
  assert.deepEqual(found, [], 'a false positive here would block every legitimate skill attachment');
});

test('no agent on disk today declares a clamping skill', () => {
  // The rule is cheap now precisely because it is currently vacuous. If this ever fails, the
  // migration attached one and the agent it landed on is quietly missing most of its tools.
  const offenders = [];
  for (const f of fs.readdirSync(AGENTS_DIR).filter((n) => n.endsWith('.md'))) {
    const issues = (lintFile(path.join(AGENTS_DIR, f)) || {}).issues || [];
    if (clampIssues(issues).length) offenders.push(f);
  }
  assert.deepEqual(offenders, []);
});

test('the fixture leaves nothing behind', () => {
  const strays = fs.readdirSync(AGENTS_DIR).filter((n) => n.startsWith('zz-skill-clamp-fixture'));
  assert.deepEqual(strays, [], `fixture files left in ${AGENTS_DIR}`);
});

test('a skill directory that does not exist is not reported as a clamp', () => {
  // Missing-skill is a different failure with a different message. Conflating "absent" with
  // "clamps" would send the reader to fix the wrong file.
  const found = clampIssues(lintAgentWith(['definitely-not-a-real-skill-xyz']));
  assert.deepEqual(found, []);
  assert.ok(os.tmpdir(), 'os import kept meaningful');
});

// ── Path traversal: found by the binding QA gate on this file's own PR ────────────────────
// The first cut ran the clamp loop over every declared skill name BEFORE any had been checked
// against the manifest. `skills: ["../.."]` therefore reached path.join + readFileSync, read a
// file outside .claude/skills/, and echoed the matched line into the issue text — which lands
// in CI logs, in a linter that runs on every pull_request including from forks. CWE-22.
//
// Reproduced first-hand before fixing: a canary file at the repo root was read and its contents
// appeared verbatim in the linter's output.

function lintWithRawSkillName(name) {
  const agent = `zz-traversal-fixture-${process.pid}`;
  const file = path.join(AGENTS_DIR, `${agent}.md`);
  fs.writeFileSync(file, `---
name: ${agent}
description: |
  Throwaway traversal fixture written by scripts/skill-clamp.test.mjs.
model: claude-sonnet-4-6
tools: [Read]
color: gray
isolation: none
skills:
  - ${JSON.stringify(name)}
risk_tier_default: lite
escalates_to: orchestrator
escalates_when: |
  Never — fixture.
---

## Purpose

Fixture.
`);
  try {
    return (lintFile(file) || {}).issues || [];
  } finally {
    fs.rmSync(file, { force: true });
  }
}

const CANARY = 'ZZ-CANARY-MUST-NEVER-BE-READ';

test('a traversing skill name reads nothing and echoes nothing', () => {
  // Plant a file the traversal would have hit, containing an allowed-tools line.
  const bait = path.join(REPO, 'SKILL.md');
  const preexisting = fs.existsSync(bait);
  assert.equal(preexisting, false, 'refusing to run: a real SKILL.md exists at the repo root');
  fs.writeFileSync(bait, `allowed-tools: ${CANARY}\n`);
  try {
    for (const name of ['../..', 'a/../../b', '../../etc', '/etc', '..\\..']) {
      const issues = lintWithRawSkillName(name);
      const leaked = issues.filter((i) => i.includes(CANARY));
      assert.deepEqual(leaked, [], `name ${JSON.stringify(name)} leaked file contents: ${leaked[0] || ''}`);
      assert.deepEqual(
        issues.filter((i) => /declares allowed-tools/.test(i)), [],
        `name ${JSON.stringify(name)} was treated as a clamping skill`
      );
    }
  } finally {
    fs.rmSync(bait, { force: true });
  }
});

test('a traversing name still gets its ordinary "not in MANIFEST.json" complaint', () => {
  // Silently ignoring a bad name would trade one defect for another: the reader must still be
  // told the skill does not resolve.
  const issues = lintWithRawSkillName('../..');
  assert.ok(
    issues.some((i) => /not in MANIFEST\.json/.test(i)),
    `expected an unresolved-skill issue, got: ${JSON.stringify(issues)}`
  );
});

test('the name-shape guard holds independently of the manifest check', () => {
  // Direct unit test of the guard, so reordering the caller cannot quietly disarm it.
  const { lintFile: _lf } = require(path.join(REPO, '.claude', 'hooks', 'schema-lint.js'));
  assert.ok(typeof _lf === 'function');
  for (const bad of ['../..', '/etc/passwd', 'a/b', 'UPPER', '.hidden', '-leading']) {
    const issues = lintWithRawSkillName(bad).filter((i) => /declares allowed-tools/.test(i));
    assert.deepEqual(issues, [], `${bad} passed the shape guard`);
  }
});

test('no traversal fixture is left behind', () => {
  const strays = fs.readdirSync(AGENTS_DIR).filter((n) => n.startsWith('zz-traversal-fixture'));
  assert.deepEqual(strays, []);
  assert.equal(fs.existsSync(path.join(REPO, 'SKILL.md')), false, 'bait file survived the test');
});

// ── Symlink route to the same disclosure — found by the gate's SECOND pass ────────────────
// The `../` fix was real and did not close this. `path.resolve` is string arithmetic: it never
// touches disk and cannot see a symlink, so `.claude/skills/<valid-name>` pointing outside the
// tree satisfied the lexical containment check while readFileSync followed the link out.
// Reproduced before fixing: lexical check true, realpath /private/tmp/evil-target/SKILL.md,
// canary readable. Fixed with lstat (refuse a symlinked skill dir) + realpathSync containment.

test('a symlinked skill directory is refused, and leaks nothing', () => {
  const SYM = 'zz-symlink-fixture';
  const skillsRoot = path.join(REPO, '.claude', 'skills');
  const link = path.join(skillsRoot, SYM);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-clamp-outside-'));
  const CANARY = 'ZZ-SYMLINK-CANARY-MUST-NOT-LEAK';
  fs.writeFileSync(path.join(outside, 'SKILL.md'), `allowed-tools: ${CANARY}\n`);
  // Self-heal a fixture left by a crashed prior run, but NEVER clobber a real directory:
  // a leftover symlink is ours; anything else is not, and the test refuses rather than delete it.
  if (fs.existsSync(link) || isLink(link)) {
    assert.equal(isLink(link), true, `refusing to run: ${link} exists and is not a symlink`);
    fs.unlinkSync(link);
  }
  try {
    fs.symlinkSync(outside, link);
    // Prove the lexical check alone would have passed — otherwise this test could pass for
    // the wrong reason if the name guard changed.
    const lexical = path.resolve(skillsRoot, SYM, 'SKILL.md').startsWith(path.resolve(skillsRoot) + path.sep);
    assert.equal(lexical, true, 'fixture no longer exercises the lexical-check bypass');

    const issues = lintAgentWith([SYM]);
    assert.deepEqual(
      issues.filter((i) => i.includes(CANARY)), [],
      'symlinked skill leaked file contents into issue text'
    );
    assert.deepEqual(
      issues.filter((i) => /declares allowed-tools/.test(i)), [],
      'symlinked skill was treated as a clamping skill'
    );
  } finally {
    // unlinkSync, not rmSync: rmSync does not remove a symlink pointing at a directory, which
    // is how the first run of this very test leaked a fixture into .claude/skills/ and got it
    // advertised as a loadable skill.
    if (isLink(link)) fs.unlinkSync(link);
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test('the symlink fixture is gone — including from the skills directory', () => {
  const strays = fs.readdirSync(path.join(REPO, '.claude', 'skills')).filter((n) => n.startsWith('zz-'));
  assert.deepEqual(strays, [], 'a fixture symlink survived and is now an advertised skill');
});

test('a real (non-symlinked) skill directory still resolves — the fix is not a blanket refusal', () => {
  // Guarding against the lazy fix: refusing everything would pass the test above and destroy
  // the rule's actual purpose.
  const found = clampIssues(lintAgentWith(['impeccable']));
  assert.equal(found.length, 1, 'the symlink guard must not break ordinary skill resolution');
});

// ── MCP grants are per-SERVER, not per-repo ──────────────────────────────────────────────
// `mcpConfigured()` was a boolean: "does any MCP config exist anywhere". So the moment a single
// .mcp.json appeared, EVERY agent could declare ANY server name and pass — one file flipping
// the check permissive for the whole roster at once. The specs flagged this as a sequencing
// hazard before it could fire: the per-agent allowlist had to land in the same change as the
// config. These pin that it did.

function lintAgentWithMcp(servers) {
  const agent = `zz-mcp-fixture-${process.pid}`;
  const file = path.join(AGENTS_DIR, `${agent}.md`);
  fs.writeFileSync(file, `---
name: ${agent}
description: |
  Throwaway MCP fixture written by scripts/skill-clamp.test.mjs.
model: claude-sonnet-4-6
tools: [Read, Glob, Grep]
mcpServers: [${servers.join(', ')}]
maxTurns: 20
color: gray
isolation: none
skills:
  - security-audit
risk_tier_default: lite
escalates_to: orchestrator
escalates_when: |
  Never — fixture.
return_contract:
  required_fields:
    - status
pre_flight_reads:
  - nothing
---

## Identity & mission

Fixture.

## Workflow position

Fixture.

## Key distinctions

Fixture.

## Pre-flight reads

Fixture.

## Operating procedure

Fixture.

## Output evidence

Fixture.

## Return contract

Fixture.

## Anti-patterns

Fixture.
`);
  try {
    return (lintFile(file) || {}).issues || [];
  } finally {
    fs.rmSync(file, { force: true });
  }
}

const mcpIssues = (issues) => issues.filter((i) => /mcpServer/.test(i));

test('a configured MCP server may be declared', () => {
  assert.deepEqual(mcpIssues(lintAgentWithMcp(['playwright'])), []);
});

test('an unconfigured MCP server is refused, and the message names what IS configured', () => {
  const found = mcpIssues(lintAgentWithMcp(['notaserver']));
  assert.equal(found.length, 1, `expected one issue, got ${JSON.stringify(found)}`);
  assert.match(found[0], /notaserver/);
  assert.match(found[0], /playwright/, 'the message must tell the reader what is available');
});

test('one valid server does not launder an invalid one alongside it', () => {
  // The failure the old boolean allowed: any declaration passing because SOMETHING was configured.
  const found = mcpIssues(lintAgentWithMcp(['playwright', 'notaserver']));
  assert.equal(found.length, 1);
  assert.match(found[0], /notaserver/);
});

test('designer holds the browser grant its own description depends on', () => {
  // designer is described as "the only producing engine with a perception loop — render, look at
  // what rendered, iterate". It held no browser at all until 2026-08-16, so the loop could not close.
  const src = fs.readFileSync(path.join(AGENTS_DIR, 'designer.md'), 'utf8');
  assert.match(src, /^mcpServers: \[.*playwright.*\]$/m, 'designer lost its browser grant');
});

test('the MCP fixture leaves nothing behind', () => {
  const strays = fs.readdirSync(AGENTS_DIR).filter((n) => n.startsWith('zz-mcp-fixture'));
  assert.deepEqual(strays, []);
});
