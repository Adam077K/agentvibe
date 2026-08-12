#!/usr/bin/env node
/**
 * curate-skills.mjs — apply .claude/skills/CURATION.yml, and prove the two agree.
 *
 * POSTURE: BLOCKS with --check. Run by `.github/workflows/ci.yml`.
 *
 * WHY A SCRIPT RATHER THAN `rm` (Phase 7, 2026-08-12)
 *
 * Deleting half a skills library by taste is unauditable. Running it through a data file
 * makes three things true that a shell loop does not:
 *
 *   · every cut names the test it failed, so the judgement can be argued with
 *   · --check proves the directory still matches the decision, so a skill cannot creep back
 *     in (or a survivor quietly vanish) without CI noticing
 *   · the same parser the rest of the repo uses reads it — parseYamlSubset, not a fourth
 *     hand-rolled YAML reader
 *
 * IT REFUSES TO CUT A SKILL SOMETHING STILL DECLARES. Six engines and two lens files name
 * skills in frontmatter, and `check-registration.mjs` fails when a declared skill is absent
 * from the manifest. Cutting one would turn a curation into a broken build, so this checks
 * first and refuses by name rather than discovering it two commits later.
 *
 * Usage: node scripts/curate-skills.mjs [--check]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseYamlSubset } = require('./lib/claims.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = path.join(ROOT, '.claude', 'skills');
const CURATION = path.join(SKILLS, 'CURATION.yml');
const TESTS = ['role_duplicate', 'near_duplicate', 'reconstructible', 'dead_subject'];

const onDisk = () =>
  fs
    .readdirSync(SKILLS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(SKILLS, d.name, 'SKILL.md')))
    .map((d) => d.name)
    .sort();

// Everything that names a skill: engine frontmatter and the two lens files. If any of these
// declares a skill, cutting it breaks check-registration on the next run.
function declaredSkills() {
  const out = new Map(); // skill -> who declares it
  const agentsDir = path.join(ROOT, '.claude', 'agents');
  for (const f of fs.existsSync(agentsDir) ? fs.readdirSync(agentsDir).filter((x) => x.endsWith('.md')) : []) {
    const text = fs.readFileSync(path.join(agentsDir, f), 'utf8');
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
    if (!fm) continue;
    const m = /^skills:\s*\n((?:\s+-\s+.*\n?)+)/m.exec(fm[1]);
    if (!m) continue;
    for (const x of m[1].matchAll(/^\s+-\s+(\S+)/gm)) {
      if (!out.has(x[1])) out.set(x[1], []);
      out.get(x[1]).push(`.claude/agents/${f}`);
    }
  }
  for (const rel of ['.claude/lenses.yml', '.claude/review-lenses.yml']) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const m of text.matchAll(/skills?:\s*\[([^\]]+)\]/g)) {
      for (const s of m[1].split(',').map((x) => x.trim()).filter(Boolean)) {
        if (!out.has(s)) out.set(s, []);
        out.get(s).push(rel);
      }
    }
  }
  return out;
}

const doc = parseYamlSubset(fs.readFileSync(CURATION, 'utf8')) || {};
const cuts = [];
const seen = new Set();
for (const t of TESTS) {
  for (const name of doc[t] || []) {
    if (seen.has(name)) {
      process.stderr.write(`✗ ${name} is listed under more than one test — one cut, one reason.\n`);
      process.exit(1);
    }
    seen.add(name);
    cuts.push({ name, test: t });
  }
}

const present = onDisk();
const presentSet = new Set(present);
const declared = declaredSkills();
const checkOnly = process.argv.includes('--check');

// ── refuse an incoherent curation before touching anything ──
//
// CHECK 2 (added after the fact, because it fired six times when written): a near_duplicate
// cut names its survivor in a trailing `# → name` comment. That survivor must still be on
// disk. Six cuts folded into a skill that was ITSELF cut — documentation → documentation-
// templates → also cut; api-documentation → api-documentation-generator → also cut. The
// content did not move anywhere, it vanished, and the whole documentation category emptied
// through a chain where every link was removed.
//
// "Kept the one carrying the most procedure" is only true if the one kept was kept. Nothing
// checked that, so nothing caught it.
const survivorOf = new Map();
{
  const sec = (fs.readFileSync(CURATION, 'utf8').split('near_duplicate:')[1] || '').split('\n# ──')[0];
  for (const m of sec.matchAll(/^\s*-\s+(\S+)\s*#\s*→\s*(.+)$/gm)) {
    survivorOf.set(m[1], m[2].trim().split(/\s*\+\s*/)[0].trim().split(/\s+/)[0]);
  }
}

const problems = [];
for (const c of cuts) {
  if (declared.has(c.name)) {
    problems.push(`${c.name} is CUT but declared by ${declared.get(c.name).join(', ')} — that would break the build`);
  }
  const surv = survivorOf.get(c.name);
  if (surv && !presentSetLazy().has(surv)) {
    problems.push(
      `${c.name} was folded into "${surv}", which is NOT on disk — the content did not move, it vanished. ` +
        `Either restore ${c.name}, or point it at a survivor that exists.`
    );
  }
}
function presentSetLazy() {
  if (!presentSetLazy._c) presentSetLazy._c = new Set(onDisk());
  return presentSetLazy._c;
}
if (problems.length) {
  for (const p of problems) process.stderr.write(`✗ ${p}\n`);
  process.exit(1);
}

// ── tests 3 and 4, as a mechanism rather than a paragraph ───────────────────
//
// TEST 4 — lint only what is universal. `name` and `description` are the only near-universal
// frontmatter fields across the 803-file candidate pool; requiring `tags`, `model`, `version`
// or anything else fails on contact with the first corpus we did not author, which is the
// whole point of curating from other people's libraries. Only 16 of the original 147 carried
// tags, so a tag requirement would have failed 89% of our own corpus.
//
// TEST 3 — size discipline. Reported, not blocking: the fix for an 848-line skill is
// restructuring it into bundled references, which is authoring work, not a build failure.
// Blocking on it would mean either a red build for weeks or a rushed bad split. It is
// counted on every run so it cannot be quietly forgotten.
function skillIssues(name) {
  const file = path.join(SKILLS, name, 'SKILL.md');
  const issues = [];
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch { return [`${name}: SKILL.md unreadable`]; }

  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!fm) {
    issues.push(`${name}: no YAML frontmatter — \`name\` and \`description\` are the two required fields`);
    return issues;
  }
  for (const field of ['name', 'description']) {
    const re = new RegExp(`^${field}:\\s*(\\S.*)?$`, 'm');
    const m = re.exec(fm[1]);
    // A folded block scalar (`description: >`) has its value on following lines, so an empty
    // capture is only a failure when nothing indented follows either.
    const folded = new RegExp(`^${field}:\\s*[|>][-+]?\\s*\\n\\s+\\S`, 'm').test(fm[1]);
    if (!m || (!(m[1] || '').trim() && !folded)) issues.push(`${name}: frontmatter \`${field}\` missing or empty`);
  }
  return issues;
}

function sizeReport() {
  const over500 = [];
  const over300NoToc = [];
  for (const name of onDisk()) {
    let text = '';
    try { text = fs.readFileSync(path.join(SKILLS, name, 'SKILL.md'), 'utf8'); } catch { continue; }
    const lines = text.split('\n').length;
    if (lines > 500) over500.push([name, lines]);
    else if (lines > 300 && !/^\s*(##\s*(table of contents|contents)|<!--\s*toc)/im.test(text)) {
      over300NoToc.push([name, lines]);
    }
  }
  return { over500, over300NoToc };
}

if (checkOnly) {
  const stillThere = cuts.filter((c) => presentSet.has(c.name));
  const expected = present.length;

  const frontmatterIssues = present.flatMap(skillIssues);
  if (frontmatterIssues.length) {
    for (const i of frontmatterIssues) process.stderr.write(`✗ ${i}\n`);
    process.stderr.write(
      `  Only \`name\` and \`description\` are required — they are the two fields that survive contact\n` +
        '  with a corpus we did not author. Nothing else is linted, deliberately.\n'
    );
    process.exit(1);
  }

  if (stillThere.length) {
    process.stderr.write(
      `✗ ${stillThere.length} skill(s) marked cut in CURATION.yml are still on disk: ` +
        `${stillThere.map((c) => c.name).join(', ')}\n  Run \`npm run curate:skills\`.\n`
    );
    process.exit(1);
  }
  const { over500, over300NoToc } = sizeReport();
  process.stdout.write(
    `✓ skills match CURATION.yml — ${expected} on disk, ${cuts.length} cut, ` +
      `${expected} with name+description.\n`
  );
  if (over500.length || over300NoToc.length) {
    process.stdout.write(
      `  size discipline (§3.10 test 3, reported not blocking): ${over500.length} over 500 lines, ` +
        `${over300NoToc.length} over 300 with no ToC.\n`
    );
    for (const [n, l] of over500.sort((a, b) => b[1] - a[1])) {
      process.stdout.write(`    ${String(l).padStart(4)} ${n}\n`);
    }
  }
  process.exit(0);
}

// ── apply ──
let removed = 0;
const missing = [];
for (const c of cuts) {
  const dir = path.join(SKILLS, c.name);
  if (!fs.existsSync(dir)) {
    missing.push(c.name);
    continue;
  }
  fs.rmSync(dir, { recursive: true, force: true });
  removed++;
}
const after = onDisk().length;
process.stdout.write(`✓ curation applied — removed ${removed}, ${after} skills remain.\n`);
if (missing.length) {
  // Named, not swallowed: a cut naming a skill that was never there means CURATION.yml and
  // the corpus disagree, and silently ignoring that is how a decision file rots.
  process.stdout.write(`  note: ${missing.length} entry(ies) named a skill not on disk — ${missing.join(', ')}\n`);
}
for (const t of TESTS) {
  const n = (doc[t] || []).length;
  if (n) process.stdout.write(`    ${t.padEnd(16)} ${n}\n`);
}
