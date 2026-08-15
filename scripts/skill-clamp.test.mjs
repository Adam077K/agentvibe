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
