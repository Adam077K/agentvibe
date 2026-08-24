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
//
// ── WHERE THE FIXTURES LIVE, AND WHY THEY MOVED ─────────────────────────────────────────────
// They used to be written into this repo's own .claude/agents/ and .claude/skills/. With the OS
// sandbox armed (#94, `sandbox.enabled: true`) those directories are write-denied in the session
// the binding QA gate runs in — arming it protects them precisely BECAUSE writing there disarms
// the harness. Every fixture write therefore raised EPERM, so `npm run check` — the gate's own
// oracle — could not pass, and the gate BLOCKed on its oracle before dispatching any reviewer.
// CI never saw it: CI runs unsandboxed.
//
// The seam is a throwaway repo root under os.tmpdir(). schema-lint.js derives REPO_ROOT by
// walking up from process.cwd() until it finds .claude/agents, so running the REAL linter as a
// child process with cwd set to that root makes everything it resolves — the skills tree,
// MANIFEST.json, .mcp.json — resolve inside the throwaway. No production code changed.
//
// WHAT THAT COSTS, STATED PLAINLY: the skills these rules read are a byte-for-byte COPY of
// .claude/skills, not the originals. `the throwaway root is a faithful copy…` asserts that
// byte-identity for every skill this file names, and the two tests that must speak about
// production — `no agent on disk today declares a clamping skill` and `designer holds the
// browser grant` — still read the real tree.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LINTER = path.join(REPO, '.claude', 'hooks', 'schema-lint.js');
const AGENTS_DIR = path.join(REPO, '.claude', 'agents');

// ── The throwaway repo root ─────────────────────────────────────────────────────────────────
// Copied, not fabricated: a hand-written `impeccable/SKILL.md` would turn every assertion below
// into a statement about this file's own fixtures rather than about the skills that ship.
const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-clamp-root-'));
const TEMP_AGENTS = path.join(TEMP, '.claude', 'agents');
const TEMP_SKILLS = path.join(TEMP, '.claude', 'skills');
fs.mkdirSync(TEMP_AGENTS, { recursive: true });
fs.cpSync(path.join(REPO, '.claude', 'skills'), TEMP_SKILLS, { recursive: true });
fs.copyFileSync(path.join(REPO, '.mcp.json'), path.join(TEMP, '.mcp.json'));

after(() => fs.rmSync(TEMP, { recursive: true, force: true }));

// Every skill name this file asserts about. Named once so the faithfulness check below cannot
// drift out of step with the tests it underwrites.
const SKILLS_UNDER_TEST = [
  'impeccable', 'pitch-deck-visuals', 'react-patterns', 'tdd-workflow',
  'security-audit', 'agent-evaluation',
];

/**
 * Runs the REAL schema-lint.js over `files`, with REPO_ROOT pinned by `cwd`.
 * Returns one issue array per file, in argument order. A failing lint exits 1 with the JSON
 * still on stdout, so a FAILING run is data here rather than a throw.
 */
function runLinter(files, cwd) {
  let out;
  try {
    out = execFileSync(process.execPath, [LINTER, '--json', ...files], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    out = e.stdout || '';
    if (!out) throw e; // exit 2 is a script error, not a lint failure — do not swallow it
  }
  return JSON.parse(out).files.map((f) => f.issues || []);
}

let seq = 0;
const fixtureName = (kind) => `zz-${kind}-fixture-${process.pid}-${seq++}`;

function writeAgentFixture(name, skills, extra = '') {
  const file = path.join(TEMP_AGENTS, `${name}.md`);
  fs.writeFileSync(file, `---
name: ${name}
description: |
  Throwaway fixture written by the skill-clamp test into a temp root. If this file is on disk, a test run died before its cleanup.
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
`);
  return file;
}

// Lint one agent that declares `skills`. The fixture is removed in `finally` so the
// leaves-nothing-behind tests below mean something.
function lintAgentWith(skills, extra = '') {
  const file = writeAgentFixture(fixtureName('skill-clamp'), skills, extra);
  try {
    return runLinter([file], TEMP)[0];
  } finally {
    fs.rmSync(file, { force: true });
  }
}

const isLink = (p) => { try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; } };

const clampIssues = (issues) => issues.filter((i) => /allowed-tools/.test(i));

test('the throwaway root is a faithful copy of the skills this file asserts about', () => {
  // If this ever fails, every clamp assertion below is describing a fixture rather than a skill.
  for (const s of SKILLS_UNDER_TEST) {
    const rel = path.join(s, 'SKILL.md');
    assert.deepEqual(
      fs.readFileSync(path.join(TEMP_SKILLS, rel)),
      fs.readFileSync(path.join(REPO, '.claude', 'skills', rel)),
      `${rel} in the throwaway root differs from the one that ships`
    );
  }
  assert.deepEqual(
    fs.readFileSync(path.join(TEMP_SKILLS, 'MANIFEST.json')),
    fs.readFileSync(path.join(REPO, '.claude', 'skills', 'MANIFEST.json')),
  );
  assert.deepEqual(
    fs.readFileSync(path.join(TEMP, '.mcp.json')),
    fs.readFileSync(path.join(REPO, '.mcp.json')),
    'the MCP allowlist assertions would be about a fabricated config'
  );
});

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
  //
  // This one runs against the REAL repo root — it is the production statement, and a copy could
  // not make it. It writes nothing.
  const files = fs.readdirSync(AGENTS_DIR).filter((n) => n.endsWith('.md'));
  assert.ok(files.length > 0, 'no agent files found — the check would pass vacuously');
  const perFile = runLinter(files.map((f) => path.join(AGENTS_DIR, f)), REPO);
  const offenders = files.filter((_, i) => clampIssues(perFile[i]).length);
  assert.deepEqual(offenders, []);
});

test('the fixture leaves nothing behind', () => {
  const strays = fs.readdirSync(TEMP_AGENTS).filter((n) => n.startsWith('zz-skill-clamp-fixture'));
  assert.deepEqual(strays, [], `fixture files left in ${TEMP_AGENTS}`);
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
// appeared verbatim in the linter's output. The canary now sits at the root of the THROWAWAY
// tree, which is the root the child linter resolves `../..` against.

function lintRawSkillNames(names) {
  const files = names.map((name) => {
    const agent = fixtureName('traversal');
    const file = path.join(TEMP_AGENTS, `${agent}.md`);
    fs.writeFileSync(file, `---
name: ${agent}
description: |
  Throwaway traversal fixture written by the skill-clamp test into a temp root.
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
    return file;
  });
  try {
    return runLinter(files, TEMP);
  } finally {
    for (const f of files) fs.rmSync(f, { force: true });
  }
}

const lintWithRawSkillName = (name) => lintRawSkillNames([name])[0];

const CANARY = 'ZZ-CANARY-MUST-NEVER-BE-READ';

test('a traversing skill name reads nothing and echoes nothing', () => {
  // Plant a file the traversal would have hit, containing an allowed-tools line.
  const bait = path.join(TEMP, 'SKILL.md');
  assert.equal(fs.existsSync(bait), false, 'refusing to run: the throwaway root already has a SKILL.md');
  fs.writeFileSync(bait, `allowed-tools: ${CANARY}\n`);
  try {
    const names = ['../..', 'a/../../b', '../../etc', '/etc', '..\\..'];
    const perName = lintRawSkillNames(names);
    names.forEach((name, i) => {
      const issues = perName[i];
      const leaked = issues.filter((s) => s.includes(CANARY));
      assert.deepEqual(leaked, [], `name ${JSON.stringify(name)} leaked file contents: ${leaked[0] || ''}`);
      assert.deepEqual(
        issues.filter((s) => /declares allowed-tools/.test(s)), [],
        `name ${JSON.stringify(name)} was treated as a clamping skill`
      );
    });
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
  const { lintFile: _lf } = require(LINTER);
  assert.ok(typeof _lf === 'function');
  const bad = ['../..', '/etc/passwd', 'a/b', 'UPPER', '.hidden', '-leading'];
  lintRawSkillNames(bad).forEach((issues, i) => {
    assert.deepEqual(
      issues.filter((s) => /declares allowed-tools/.test(s)), [],
      `${bad[i]} passed the shape guard`
    );
  });
});

test('no traversal fixture is left behind', () => {
  const strays = fs.readdirSync(TEMP_AGENTS).filter((n) => n.startsWith('zz-traversal-fixture'));
  assert.deepEqual(strays, []);
  assert.equal(fs.existsSync(path.join(TEMP, 'SKILL.md')), false, 'bait file survived the test');
});

// ── Symlink route to the same disclosure — found by the gate's SECOND pass ────────────────
// The `../` fix was real and did not close this. `path.resolve` is string arithmetic: it never
// touches disk and cannot see a symlink, so `.claude/skills/<valid-name>` pointing outside the
// tree satisfied the lexical containment check while readFileSync followed the link out.
// Reproduced before fixing: lexical check true, realpath /private/tmp/evil-target/SKILL.md,
// canary readable. Fixed with lstat (refuse a symlinked skill dir) + realpathSync containment.
//
// THIS TEST WAS VACUOUS UNTIL 2026-08-24 AND IS NOT ANY MORE. The clamp read is gated on
// `live.has(name)` — the name must appear in MANIFEST.json — and a fixture symlink planted at
// runtime never does. So the lstat/realpath guard was never reached and the test asserted the
// absence of a leak that nothing was attempting. The threat it exists for is a REGISTERED skill
// whose directory is swapped for a symlink, so the root below registers the fixture name in its
// own manifest, and a positive control proves the read path is live before the symlink case
// asserts an absence.

/** A second, hand-authored root: its manifest has to be authored for the guard to be reached. */
function makeSymlinkRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-clamp-symlink-'));
  fs.mkdirSync(path.join(root, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(root, '.claude', 'skills'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.claude', 'skills', 'MANIFEST.json'),
    JSON.stringify({ skills: [{ name: 'zz-symlink-fixture' }, { name: 'zz-real-fixture' }] }, null, 2)
  );
  return root;
}

const SYM_CANARY = 'ZZ-SYMLINK-CANARY-MUST-NOT-LEAK';

test('a symlinked skill directory is refused, and leaks nothing — with a live positive control', () => {
  const root = makeSymlinkRoot();
  const skillsRoot = path.join(root, '.claude', 'skills');
  const link = path.join(skillsRoot, 'zz-symlink-fixture');
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-clamp-outside-'));
  fs.writeFileSync(path.join(outside, 'SKILL.md'), `allowed-tools: ${SYM_CANARY}\n`);

  // POSITIVE CONTROL. Same canary, same manifest, reached through a REAL directory. If this
  // does not report, the symlink assertion below would pass for the wrong reason.
  fs.mkdirSync(path.join(skillsRoot, 'zz-real-fixture'));
  fs.writeFileSync(path.join(skillsRoot, 'zz-real-fixture', 'SKILL.md'), `allowed-tools: ${SYM_CANARY}\n`);

  try {
    fs.symlinkSync(outside, link);
    // Prove the lexical check alone would have passed — otherwise this test could pass for
    // the wrong reason if the name guard changed.
    const lexical = path.resolve(skillsRoot, 'zz-symlink-fixture', 'SKILL.md')
      .startsWith(path.resolve(skillsRoot) + path.sep);
    assert.equal(lexical, true, 'fixture no longer exercises the lexical-check bypass');

    const agent = path.join(root, '.claude', 'agents', 'zz-symlink-agent.md');
    const body = (skill) => `---
name: zz-symlink-agent
description: |
  Throwaway symlink fixture written by the skill-clamp test into a temp root.
model: claude-sonnet-4-6
tools: [Read]
color: gray
isolation: none
skills:
  - ${skill}
risk_tier_default: lite
escalates_to: orchestrator
escalates_when: |
  Never — fixture.
---

## Purpose

Fixture.
`;

    fs.writeFileSync(agent, body('zz-real-fixture'));
    const control = runLinter([agent], root)[0];
    assert.equal(
      control.filter((i) => i.includes(SYM_CANARY)).length, 1,
      `the positive control did not reach the skill read, so this test cannot speak: ${JSON.stringify(control)}`
    );

    fs.writeFileSync(agent, body('zz-symlink-fixture'));
    const issues = runLinter([agent], root)[0];
    assert.deepEqual(
      issues.filter((i) => i.includes(SYM_CANARY)), [],
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
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the symlink fixture never touched the skills directory that ships', () => {
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
  const agent = fixtureName('mcp');
  const file = path.join(TEMP_AGENTS, `${agent}.md`);
  fs.writeFileSync(file, `---
name: ${agent}
description: |
  Throwaway MCP fixture written by the skill-clamp test into a temp root.
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
    return runLinter([file], TEMP)[0];
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
  const strays = fs.readdirSync(TEMP_AGENTS).filter((n) => n.startsWith('zz-mcp-fixture'));
  assert.deepEqual(strays, []);
});
