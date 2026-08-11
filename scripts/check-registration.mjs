#!/usr/bin/env node
/**
 * check-registration.mjs — the fabrication catcher.
 *
 * POSTURE: BLOCKS. Run by `.github/workflows/ci.yml` on every PR.
 *
 * A "fabrication" here means documentation that names a mechanism which does not
 * do what is claimed: a hook registered to a file that does not exist, a doc
 * linking a path that was deleted, a count that drifted from the thing counted.
 * An audit of this repo found sixteen such claims. Fifteen of them were of a
 * shape a script can check, so this script checks them on every PR instead.
 *
 * Checks (failures block; warnings are reported and do not block):
 *   1. Every hook/statusLine command in settings.json resolves to a file.
 *   2. Every repo-relative path named in a governing document exists.
 *   3. Every count in README's "What's inside" table matches what is on disk.
 *   4. Every skill declared by an agent — including war-room, which schema-lint
 *      does not walk — exists in MANIFEST.json.
 *   5. WARN: capability-bearing files that nothing registers.
 *   6. WARN: agents declaring mcpServers while no MCP config exists.
 *   7. WARN: agent names that also exist in ~/.claude/agents (machine state CI cannot see).
 *
 * Usage: node scripts/check-registration.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);
const warn = (check, msg) => warnings.push(`[${check}] ${msg}`);

const abs = (p) => path.join(ROOT, p);
const exists = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const listMd = (dir) =>
  exists(dir) ? fs.readdirSync(abs(dir)).filter((f) => f.endsWith('.md')) : [];

// ── 1 · settings.json registrations resolve ────────────────────────────────
const settings = JSON.parse(read('.claude/settings.json'));
const registered = new Set();

const commandFile = (cmd) => {
  const m = /(\.claude\/hooks\/[\w.-]+)/.exec(cmd);
  return m ? m[1] : null;
};
for (const [event, blocks] of Object.entries(settings.hooks || {})) {
  for (const block of blocks) {
    for (const h of block.hooks || []) {
      const file = commandFile(h.command || '');
      if (!file) continue;
      registered.add(file);
      if (!exists(file)) fail('registration', `${event} hook -> missing file ${file}`);
    }
  }
}
if (settings.statusLine?.command) {
  const file = commandFile(settings.statusLine.command);
  if (file) {
    registered.add(file);
    if (!exists(file)) fail('registration', `statusLine -> missing file ${file}`);
  }
}

// ── 2 · governing docs name only paths that exist ──────────────────────────
// These documents are what agents read to learn how the system works. A dead
// path here is a lie the whole fleet acts on.
const GOVERNING = [
  'CLAUDE.md',
  'AGENTS.md',
  'README.md',
  'TEMPLATE-USAGE.md',
  ...listMd('.claude/commands').map((f) => `.claude/commands/${f}`),
];

const PREFIXES = ['.claude/', '.github/', 'docs/', 'scripts/', 'bin/', 'war-room/', 'guides/', '.agent/'];
// Skip templates, globs, home-relative paths, and anything that is plainly illustrative.
const skip = (p) =>
  /[[\]{}*<>]|YYYY|\.\.\.|^~|^https?:|^#/.test(p) || p.includes('$') || p.includes('|');

for (const doc of GOVERNING) {
  if (!exists(doc)) {
    fail('governing-doc', `${doc} is referenced by this check but does not exist`);
    continue;
  }
  const text = read(doc);
  const found = new Set();
  // markdown links: [label](path)
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) found.add(m[1].split('#')[0]);
  // backticked paths
  for (const m of text.matchAll(/`([^`\n]+)`/g)) found.add(m[1]);

  for (const raw of found) {
    const p = raw.trim().replace(/^\.\//, '');
    if (!p || skip(p)) continue;
    if (!PREFIXES.some((pre) => p.startsWith(pre))) continue;
    if (!exists(p)) fail('dead-path', `${doc} references ${p}, which does not exist`);
  }
}

// ── 3 · README counts match disk ───────────────────────────────────────────
const countOnDisk = {
  agents: listMd('.claude/agents').length + listMd('.claude/agents/war-room').filter((f) => f !== 'INDEX.md').length,
  skills: fs
    .readdirSync(abs('.claude/skills'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && exists(`.claude/skills/${d.name}/SKILL.md`)).length,
  hooks: exists('.claude/hooks') ? fs.readdirSync(abs('.claude/hooks')).length : 0,
  commands: listMd('.claude/commands').length,
  workflows: exists('.github/workflows') ? fs.readdirSync(abs('.github/workflows')).length : 0,
};

const readme = read('README.md');
const rowCount = (label) => {
  const re = new RegExp(`^\\|[^|]*${label}[^|]*\\|[^|]*\\|\\s*(\\d+)`, 'im');
  const m = re.exec(readme);
  return m ? Number(m[1]) : null;
};
for (const [label, key] of [
  ['Agents', 'agents'],
  ['Skills', 'skills'],
  ['Hooks', 'hooks'],
  ['Slash commands', 'commands'],
  ['CI workflows', 'workflows'],
]) {
  const claimed = rowCount(label);
  if (claimed === null) {
    warn('readme-count', `no "${label}" row found in README's table`);
  } else if (claimed !== countOnDisk[key]) {
    fail('readme-count', `README claims ${claimed} ${label}, disk has ${countOnDisk[key]}`);
  }
}

// ── 4 · declared skills exist in MANIFEST (incl. war-room) ─────────────────
let manifestNames = null;
try {
  const m = JSON.parse(read('.claude/skills/MANIFEST.json'));
  manifestNames = new Set(m.skills.map((s) => s.name));
} catch {
  fail('manifest', 'MANIFEST.json is missing or unparseable — schema-lint silently skips its skill check when this happens');
}

const agentFiles = [
  ...listMd('.claude/agents').map((f) => `.claude/agents/${f}`),
  ...listMd('.claude/agents/war-room').map((f) => `.claude/agents/war-room/${f}`),
];
let mcpDeclared = 0;
const mcpConfigured = exists('.mcp.json') || 'mcpServers' in settings;

for (const file of agentFiles) {
  const text = read(file);
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!fm) continue;
  const block = (key) => {
    const re = new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s+.*\\n?)+)`, 'm');
    const m = re.exec(fm[1]);
    return m ? [...m[1].matchAll(/^\s+-\s+(\S+)/gm)].map((x) => x[1]) : [];
  };
  if (manifestNames) {
    for (const s of block('skills')) {
      if (!manifestNames.has(s)) fail('skill-ref', `${file} declares skill "${s}", absent from MANIFEST.json`);
    }
  }
  if (block('mcpServers').length) mcpDeclared++;
}
if (mcpDeclared && !mcpConfigured) {
  warn(
    'capability',
    `${mcpDeclared} agents declare mcpServers, but no MCP config exists (no mcpServers key in settings.json, no .mcp.json). ` +
      'These declarations grant nothing — Phase 4 removes or enforces them.'
  );
}

// ── 7 · agent definitions that also exist in ~/.claude/agents ──────────────
//
// WARNS, never blocks. `~/.claude/agents/` is machine state: it is not in the repository,
// CI runners have none of it, and blocking on it would fail every build for a reason the
// PR did not cause.
//
// It still has to be visible, because it is the `_seeds/` failure wearing a different
// hat. Phase 1 deleted `.claude/agents/_seeds/` as "9 orphans, zero references" — a
// repo-scoped search said so, and 8 of 12 launchers were reading it at startup. The
// mechanism lived outside the directory the search covered. So does this.
//
// Measured 2026-08-11: 44 agents live in ~/.claude/agents/. Eleven collide by name with a
// repo agent and all eleven have drifted substantially. Project definitions shadow global
// ones — verified by comparing a live session's loaded agent descriptions against both
// copies — so the colliding ones are inert HERE and are the only copy in every other
// project on the machine. Reconciling them changes ~14 projects at once, which is Phase 9's
// job. This check exists so Phase 9 inherits a measured list instead of a surprise.
const globalAgentsDir = path.join(process.env.HOME || '', '.claude', 'agents');
if (fs.existsSync(globalAgentsDir)) {
  const globalNames = fs.readdirSync(globalAgentsDir).filter((f) => f.endsWith('.md'));
  const repoNames = new Set(listMd('.claude/agents'));
  const collisions = [];
  for (const name of globalNames) {
    if (!repoNames.has(name)) continue;
    const a = read(`.claude/agents/${name}`);
    const b = fs.readFileSync(path.join(globalAgentsDir, name), 'utf8');
    collisions.push({ name, drifted: a !== b });
  }
  const drifted = collisions.filter((c) => c.drifted);
  if (collisions.length) {
    warn(
      'shadowed-agent',
      `${collisions.length} agent name(s) exist in BOTH .claude/agents/ and ~/.claude/agents/, ` +
        `${drifted.length} of them with different content: ${drifted.map((c) => c.name.replace(/\.md$/, '')).join(', ')}. ` +
        'The repo copy wins here, so these are inert in this project — but they are the only copy in every ' +
        'other project on this machine. Editing the repo file does not change what those projects run. ' +
        'Reconciliation is Phase 9 (fleet rollout); this warning exists so it is a measured list, not a surprise.'
    );
  }
  const globalOnly = globalNames.filter((n) => !repoNames.has(n)).length;
  if (globalOnly) {
    warn(
      'shadowed-agent',
      `${globalOnly} further agent(s) exist ONLY in ~/.claude/agents/ and are absent from a fresh clone of this repo. ` +
        'They are out of scope until Phase 9 — named here so nobody assumes the repo is the whole roster.'
    );
  }
}

// ── 5 · capability-bearing files nothing registers ─────────────────────────
for (const f of exists('.claude/hooks') ? fs.readdirSync(abs('.claude/hooks')) : []) {
  const rel = `.claude/hooks/${f}`;
  if (registered.has(rel)) continue;
  const usedInCi =
    exists('.github/workflows') &&
    fs.readdirSync(abs('.github/workflows')).some((w) => read(`.github/workflows/${w}`).includes(f));
  const usedInPkg = read('package.json').includes(f);
  if (!usedInCi && !usedInPkg) {
    warn('unregistered', `${rel} is registered in no hook, no workflow, and no npm script`);
  }
}

// ── report ─────────────────────────────────────────────────────────────────
for (const w of warnings) console.log(`⚠ ${w}`);
for (const f of failures) console.error(`✗ ${f}`);

if (failures.length) {
  console.error(`\n✗ registration check failed — ${failures.length} problem(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(
  `\n✓ registration check passed — ${agentFiles.length} agents, ${countOnDisk.skills} skills, ` +
    `${registered.size} registered hooks, ${warnings.length} warning(s).`
);
