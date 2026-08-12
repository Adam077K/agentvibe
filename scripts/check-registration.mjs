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
 *   4. Every skill declared by an agent exists in MANIFEST.json.
 *   5. WARN: capability-bearing files that nothing registers.
 *   6. WARN: agents declaring mcpServers while no MCP config exists.
 *   7. WARN: agent names that also exist in ~/.claude/agents (machine state CI cannot see).
 *   8. Slash commands may not name a retired persona that is not an agent here.
 *   9. No tracked text file contains a NUL byte — a file grep cannot read is a
 *      file every grep-based check silently passes.
 *
 * Usage: node scripts/check-registration.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

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

// Tracked files, from git rather than a directory walk: node_modules and .worktrees are
// then excluded by the same rule the repo already uses, not by a second exclude list that
// would drift from .gitignore.
const tracked = () => {
  try {
    return execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
};

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
  agents: listMd('.claude/agents').length,
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

// ── 4 · declared skills exist in MANIFEST ─────────────────────────────────
let manifestNames = null;
try {
  const m = JSON.parse(read('.claude/skills/MANIFEST.json'));
  manifestNames = new Set(m.skills.map((s) => s.name));
} catch {
  fail('manifest', 'MANIFEST.json is missing or unparseable — schema-lint silently skips its skill check when this happens');
}

const agentFiles = [
  ...listMd('.claude/agents').map((f) => `.claude/agents/${f}`),
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

// ── 8 · slash commands may not name an agent that does not exist ───────────
//
// BLOCKS. Phase 1 declared "fabrications = 0" and this class survived it: `/ship`
// assigned its steps to Scout, Atlas, Guardian and Nexus, `/daily` to Iris, and `/debug`
// to Atlas — 23 references to five agents that have never existed in this repository.
// They are persona names from a different system that came in with the template.
//
// The reason the audit missed them is worth keeping: check 2 above verifies that every
// *path* named in a governing doc exists, and nobody had written the equivalent for
// *names*. A checker's coverage is not the same as its subject.
//
// LIMIT, stated rather than implied: this is a denylist of names known to have been
// retired, not general detection. Deciding whether an arbitrary capitalised word is meant
// to be an agent is not tractable, so this catches the recurrence — someone pasting
// template-era prose back in — and not a newly invented name. Occurrences inside a `>`
// blockquote are allowed, so a doc can discuss the repair without tripping it.
const RETIRED_PERSONAS = ['Scout', 'Atlas', 'Iris', 'Rex', 'Nova', 'Morgan', 'Axiom', 'Lyra', 'Nexus', 'Spark', 'Sage', 'Guardian'];
const retiredRe = new RegExp(`\\b(${RETIRED_PERSONAS.join('|')})\\b`, 'g');

for (const cmd of listMd('.claude/commands')) {
  const rel = `.claude/commands/${cmd}`;
  for (const [n, line] of read(rel).split('\n').entries()) {
    if (/^\s*>/.test(line)) continue; // commentary about the repair, not an instruction
    const hits = [...new Set([...line.matchAll(retiredRe)].map((m) => m[1]))];
    if (hits.length) {
      fail('phantom-agent', `${rel}:${n + 1} names ${hits.join(', ')} — no such agent exists in .claude/agents/`);
    }
  }
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
// copies.
//
// CORRECTION, 2026-08-11. An earlier version of this comment said the colliding copies are
// "the only copy in every other project on this machine". That was inferred, not checked,
// and it is false: 14 of 16 projects under ~/VibeCoding carry their own .claude/agents/
// and shadow the globals exactly as this repo does. The globals are live in TWO projects,
// obsidian-claude-code-mcp and overstory, neither of which has a ceo or qa-lead of its own.
// A wrong claim inside the fabrication catcher is worth correcting loudly.
//
// The hazard that matters is local: deleting a repo agent UN-SHADOWS its global twin, so
// the name keeps working and quietly means the older definition. That is why Phase 4b left
// shim files behind for these eleven names instead of deleting them outright.
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
        'The repo copy wins here, so these are inert in this project. Measured 2026-08-11: 14 of 16 projects ' +
        'under ~/VibeCoding carry their own .claude/agents/ and shadow the globals the same way, so the ' +
        'globals are live in TWO projects (obsidian-claude-code-mcp, overstory). The local hazard is the real ' +
        'one: DELETING a repo agent un-shadows its global twin, so the name keeps working and quietly means ' +
        'the older definition. Reconciliation is Phase 9; this warning exists so it is a measured list.'
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

// ── 10 · skills that also exist in ~/.claude/skills ────────────────────────
//
// WARN, never block: `~/.claude` is machine state and a CI runner has none of it, so failing
// here would fail every run for a reason the PR did not cause.
//
// Phase 7 found this the way Phase 4b found it for agents — by the runtime continuing to
// offer five skills after they were deleted. Deleting a repo skill does not remove the name;
// it un-shadows the global copy. Seven of 63 cuts landed here and five of those globals are
// drifted, so the name now resolves to different text than the file that was removed.
//
// statSync, NOT withFileTypes: 32 of the 42 globals are symlinks, and isDirectory() reports
// false for a symlink. The first measurement used withFileTypes and confidently reported
// zero collisions where there are seven.
const globalSkillsDir = path.join(process.env.HOME || '', '.claude', 'skills');
if (fs.existsSync(globalSkillsDir)) {
  const globalNames = [];
  for (const n of fs.readdirSync(globalSkillsDir)) {
    try {
      if (fs.statSync(path.join(globalSkillsDir, n)).isDirectory()) globalNames.push(n);
    } catch { /* dangling symlink — not a usable skill either way */ }
  }
  const repoSkills = new Set(
    fs.existsSync(abs('.claude/skills'))
      ? fs.readdirSync(abs('.claude/skills'), { withFileTypes: true })
          .filter((d) => d.isDirectory() && exists(`.claude/skills/${d.name}/SKILL.md`))
          .map((d) => d.name)
      : []
  );
  const shadowing = globalNames.filter((n) => repoSkills.has(n));
  const globalOnly = globalNames.filter((n) => !repoSkills.has(n));
  if (globalOnly.length) {
    warn(
      'shadowed-skill',
      `${globalOnly.length} skill name(s) resolve to ~/.claude/skills and are absent from this repo: ` +
        `${globalOnly.slice(0, 12).join(', ')}${globalOnly.length > 12 ? ', …' : ''}. ` +
        'A skill deleted here is not gone if the name exists there — it now means whatever the global copy says. ' +
        'Reconciliation is Phase 9; this warning keeps the list measured rather than rediscovered.'
    );
  }
  if (shadowing.length) {
    warn('shadowed-skill', `${shadowing.length} skill name(s) exist in both; the repo copy wins here.`);
  }
}

// ── 9 · no text source file may contain a NUL byte ─────────────────────────
//
// Phase 6, found by accident. `scripts/ledger.mjs` carried a literal 0x00 written as a
// map-key separator instead of the \u0000 escape. Node read it fine, every test passed,
// and the code was correct. What broke was invisible: `file` classified it as binary, so
// grep SUPPRESSED ALL MATCHES AND EXITED 1 — indistinguishable from "no matches found".
// Several greps against that file returned nothing during this session and were read as
// evidence of absence.
//
// No shipped checker was fooled (check-registration reads directories, schema-lint
// requires modules, CI greps only markdown). The next grep-based check would have been,
// and it would have reported clean. A file our own tools cannot read is a hole shaped
// exactly like the ones this script exists to catch, so it is checked here.
const NUL_EXEMPT = /\.(png|jpe?g|gif|ico|webp|pdf|zip|woff2?|ttf|otf|mp4|wasm)$/i;
let nulScanned = 0;
for (const rel of tracked()) {
  if (NUL_EXEMPT.test(rel)) continue;
  let buf;
  try { buf = fs.readFileSync(abs(rel)); } catch { continue; }
  nulScanned++;
  const at = buf.indexOf(0);
  if (at !== -1) {
    fail(
      'binary-source',
      `${rel} contains a NUL byte at offset ${at}, so file(1) calls it binary and grep ` +
        `silently returns nothing and exits 1 on it. Write the escape (\\u0000), not the byte.`
    );
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
