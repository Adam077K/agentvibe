#!/usr/bin/env node
/**
 * build-skill-routers.mjs — the two-tier discovery layer.
 *
 * POSTURE: BLOCKS with --check. Run by `.github/workflows/ci.yml`.
 *
 * THE PROBLEM, MEASURED (Phase 7, 2026-08-12)
 *
 * `MANIFEST.json` was 54,001 bytes / ~15,000 tokens across 147 entries, and CLAUDE.md
 * instructs every agent to read it whole before loading a skill. That is more than double
 * the entire lens+playbook injection, paid on every lookup, and it grew linearly with the
 * library — so adding a good skill made every unrelated task more expensive. §3.10: "add ~6
 * namespace router skills so the discovery tier stops growing linearly."
 *
 * THE SHAPE
 *   tier 1  routers/INDEX.md      six namespaces, one line each      ~250 tokens
 *   tier 2  routers/<namespace>.md  the skills in that namespace     ~800-1,200 tokens
 *   tier 3  the SKILL.md itself
 *
 * A typical lookup goes from ~8,500 tokens (post-curation manifest) to ~1,200.
 *
 * WHY THESE LIVE OUTSIDE THE SKILL DIRECTORIES. A router implemented AS a skill would carry
 * its own SKILL.md, land in MANIFEST.json, and inflate the exact file it exists to avoid
 * reading — six more entries on every lookup, forever. `.claude/skills/routers/` holds plain
 * markdown, so `build-skills-manifest.mjs` (which requires a SKILL.md) ignores it and
 * check-registration's skill count is unaffected.
 *
 * MANIFEST.json IS NOT DELETED. It stays as the exhaustive index and is what
 * `check:manifest` verifies against disk. The routers are a cheaper path to the same place,
 * not a second source of truth — both are generated from the same directory, and both are
 * --check'd, so they cannot disagree without CI saying so.
 *
 * Usage: node scripts/build-skill-routers.mjs [--check]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseYamlSubset } = require('./lib/claims.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = path.join(ROOT, '.claude', 'skills');
const ROUTERS = path.join(SKILLS, 'routers');

const HEADLINE = {
  engineering: 'Backend, data modelling, refactoring, debugging — how the thing is built',
  'frontend-design': 'UI, visual design, component systems, accessibility — what the user sees',
  'quality-security': 'Testing, review, auth, secrets, compliance — what stops it shipping broken',
  'ai-agents': 'LLM applications, agents, retrieval, prompts, tools — the AI layer itself',
  'ops-delivery': 'Deploy, CI, jobs, payments, email, analytics — running it in production',
  'business-growth': 'Pricing, metrics, market, positioning, conversion — why anyone pays',
};

const doc = parseYamlSubset(fs.readFileSync(path.join(SKILLS, 'CURATION.yml'), 'utf8')) || {};
const namespaces = doc.namespaces || {};

const manifest = JSON.parse(fs.readFileSync(path.join(SKILLS, 'MANIFEST.json'), 'utf8'));
const describe = Object.fromEntries(manifest.skills.map((s) => [s.name, s.description || '']));

const onDisk = fs
  .readdirSync(SKILLS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(SKILLS, d.name, 'SKILL.md')))
  .map((d) => d.name);

// ── refuse an incoherent mapping ──
// A skill in no namespace is unreachable through the routers; a skill in two makes the
// routers disagree about where it lives. Both are silent failures at read time, so they are
// loud failures at build time instead.
const assigned = [];
for (const list of Object.values(namespaces)) assigned.push(...list);
const dupes = assigned.filter((x, i) => assigned.indexOf(x) !== i);
const orphans = onDisk.filter((x) => !assigned.includes(x));
const ghosts = assigned.filter((x) => !onDisk.includes(x));
const problems = [];
if (dupes.length) problems.push(`in more than one namespace: ${[...new Set(dupes)].join(', ')}`);
if (orphans.length) problems.push(`in NO namespace, so unreachable via routers: ${orphans.join(', ')}`);
if (ghosts.length) problems.push(`assigned to a namespace but not on disk: ${ghosts.join(', ')}`);
if (problems.length) {
  for (const p of problems) process.stderr.write(`✗ ${p}\n`);
  process.stderr.write('  Fix the `namespaces:` block in .claude/skills/CURATION.yml.\n');
  process.exit(1);
}

// Descriptions arrive from mixed corpora and several carry a leftover YAML block-scalar
// marker or a stray quote at the front. Trimmed here rather than in 84 files.
const clean = (s) =>
  String(s)
    // Undecoded \uXXXX escapes reach here as literal text from corpora whose frontmatter was
    // written as a JSON string. Rendering "—" to a reader is a small lie about what the
    // description says, and it is six characters of noise on every lookup.
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\n/g, ' ')
    .replace(/^[|>"'\s]+/, '')
    .replace(/["'\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

const first = (s, n) => {
  const t = clean(s);
  return t.length <= n ? t : `${t.slice(0, n - 1).replace(/[,;:\s]\S*$/, '')}…`;
};

function indexFile() {
  const L = [];
  L.push('# Skill routers — read this first, not MANIFEST.json');
  L.push('');
  L.push('**Generated by `node scripts/build-skill-routers.mjs` — do not edit.**');
  L.push('');
  L.push('Discovery is two-tier on purpose. Reading the full manifest cost ~15,000 tokens across 147');
  L.push('entries and grew with every skill added, so a good new skill made every unrelated task more');
  L.push('expensive. Read the six lines below, open the ONE namespace that matches, then load the skill.');
  L.push('');
  L.push('| Namespace | Covers | Skills |');
  L.push('|---|---|---|');
  for (const ns of Object.keys(namespaces)) {
    L.push(`| [\`${ns}\`](${ns}.md) | ${HEADLINE[ns] || ''} | ${namespaces[ns].length} |`);
  }
  L.push('');
  L.push(`${onDisk.length} skills total. \`MANIFEST.json\` remains the exhaustive index and is what`);
  L.push('`npm run check:manifest` verifies; it is not the place to start a lookup.');
  L.push('');
  return L.join('\n');
}

function namespaceFile(ns) {
  const L = [];
  L.push(`# ${ns}`);
  L.push('');
  L.push('**Generated — do not edit.** Load with `READ .claude/skills/<name>/SKILL.md`.');
  L.push('');
  L.push(`${HEADLINE[ns] || ''}`);
  L.push('');
  L.push('| Skill | What it carries |');
  L.push('|---|---|');
  for (const name of [...namespaces[ns]].sort()) {
    L.push(`| \`${name}\` | ${first(describe[name] || '—', 150).replace(/\|/g, '\\|')} |`);
  }
  L.push('');
  L.push('[← all namespaces](INDEX.md)');
  L.push('');
  return L.join('\n');
}

const want = new Map([['INDEX.md', indexFile()]]);
for (const ns of Object.keys(namespaces)) want.set(`${ns}.md`, namespaceFile(ns));

if (process.argv.includes('--check')) {
  const stale = [];
  for (const [f, body] of want) {
    let cur = '';
    try { cur = fs.readFileSync(path.join(ROUTERS, f), 'utf8'); } catch { /* missing = stale */ }
    if (cur !== body) stale.push(f);
  }
  const extra = (fs.existsSync(ROUTERS) ? fs.readdirSync(ROUTERS) : []).filter((f) => !want.has(f));
  if (stale.length || extra.length) {
    if (stale.length) process.stderr.write(`✗ stale router file(s): ${stale.join(', ')}\n`);
    if (extra.length) process.stderr.write(`✗ router file(s) with no namespace: ${extra.join(', ')}\n`);
    process.stderr.write('  Run `npm run build:routers`.\n');
    process.exit(1);
  }
  const tokens = Math.round([...want.values()].reduce((a, b) => a + b.length, 0) / 3.6);
  process.stdout.write(`✓ routers match CURATION.yml — ${want.size} files, ~${tokens} tokens total.\n`);
  process.exit(0);
}

fs.mkdirSync(ROUTERS, { recursive: true });
for (const f of fs.existsSync(ROUTERS) ? fs.readdirSync(ROUTERS) : []) {
  if (!want.has(f)) fs.rmSync(path.join(ROUTERS, f));
}
for (const [f, body] of want) fs.writeFileSync(path.join(ROUTERS, f), body);

const idxTokens = Math.round(want.get('INDEX.md').length / 3.6);
const nsTokens = Math.round(
  [...want.entries()].filter(([f]) => f !== 'INDEX.md').reduce((a, [, b]) => a + b.length, 0) / 3.6 / Object.keys(namespaces).length
);
process.stdout.write(
  `✓ wrote ${want.size} router files — index ~${idxTokens} tokens, average namespace ~${nsTokens} tokens.\n` +
    `  A typical lookup is index + one namespace ≈ ${idxTokens + nsTokens} tokens.\n`
);
