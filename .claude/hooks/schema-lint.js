#!/usr/bin/env node
// POSTURE: BLOCKS in CI, ADVISES in session — exit 1 on any failing agent. .github/workflows/ci.yml treats that as a build
// failure; the Stop-hook registration only surfaces it, since Stop cannot block.
// .claude/hooks/schema-lint.js — Agentvibe agent file schema lint
//
// Validates .claude/agents/*.md (top-level only — NOT war-room/ which uses
// the bespoke Routine schema acceptable per 07b §4) against the canonical
// 07b-AGENT-TEMPLATE.md spec.
//
// Usage:
//   node .claude/hooks/schema-lint.js                          # lint all top-level agents
//   node .claude/hooks/schema-lint.js .claude/agents/cto.md    # lint one file
//   node .claude/hooks/schema-lint.js --json                   # JSON output for CI
//
// Exit codes:
//   0 = all files pass
//   1 = any file fails (CI-blocking)
//   2 = script error
//
// Authored 2026-05-16 as Phase 1-followup of the agent rethink.

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = (() => {
  // Walk up from cwd until we find .claude/agents
  let p = process.cwd();
  while (p && p !== '/') {
    if (fs.existsSync(path.join(p, '.claude', 'agents'))) return p;
    p = path.dirname(p);
  }
  return process.cwd();
})();

const AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'agents');
const MANIFEST_PATH = path.join(REPO_ROOT, '.claude', 'skills', 'MANIFEST.json');
const LENSES_PATH = path.join(REPO_ROOT, '.claude', 'lenses.yml');
const REVIEW_LENSES_PATH = path.join(REPO_ROOT, '.claude', 'review-lenses.yml');

// One parser. `parseYamlSubset` already reads every claim block and the tier map; the lens
// files use it too rather than gaining a fourth hand-rolled YAML reader.
const { parseYamlSubset, KINDS, independenceIssue } = require('../../scripts/lib/claims.js');

// The seven engines of the Phase 4 roster. Held here as a constant rather than read from
// disk because the lens files are authored BEFORE the engine files exist — 4a proves the
// expertise survives, and only then does 4b delete what it replaced.
const ENGINES = ['orchestrator', 'framer', 'sourcer', 'builder', 'designer', 'reviewer', 'reader'];

// ── 07b template checks ────────────────────────────────────────────────────

const REQUIRED_FRONTMATTER = [
  'name',
  'description',
  'model',
  'tools',
  'maxTurns',
  'color',
  'isolation',
  'skills',
  'risk_tier_default',
];
// `mcpServers` was required here and is no longer. Every one of the 52 agent files
// declared it while `settings.json` had no `mcpServers` key and no `.mcp.json` existed
// anywhere, so the field granted nothing to anybody. §3.7: "a capability field
// auto-granted whatever it requests is worse than no field — it degrades to false
// confidence, not to zero." The declarations are deleted, and the check below makes the
// field fail the build unless real MCP config exists, so it cannot return as decoration.

/** Is there any MCP configuration in this repo at all? */
function mcpConfigured() {
  if (fs.existsSync(path.join(REPO_ROOT, '.mcp.json'))) return true;
  try {
    const s = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude', 'settings.json'), 'utf8'));
    return Object.prototype.hasOwnProperty.call(s, 'mcpServers');
  } catch {
    return false;
  }
}
// escalates_to + escalates_when are required for non-personas
// return_contract + pre_flight_reads are required for everyone

const VALID_MODELS = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'];
const VALID_ISOLATION = ['worktree', 'none'];
const VALID_TIERS = ['trivial', 'lite', 'full', 'irreversible'];

// 8 mandatory body sections (## level-2 headers)
const MANDATORY_SECTIONS = [
  '## Identity & mission',
  '## Workflow position',
  '## Key distinctions',
  '## Pre-flight reads',
  '## Operating procedure',
  // Section 6: one of three (QA gate hand-off / Output evidence / Output format)
  '## Return contract',
  '## Anti-patterns',
];
const SECTION_6_OPTIONS = [
  '## QA gate hand-off',
  '## Output evidence',
  '## Output format',
];

// ── Minimal YAML frontmatter parser (no deps) ──────────────────────────────
// Handles simple `key: value`, `key: [...]`, `key:\n  - item`, multi-line `key: >`/`|`
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const lines = match[1].split('\n');
  const fm = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line || line.startsWith('#')) { i++; continue; }
    const kv = line.match(/^([a-z_][a-z0-9_]*)\s*:\s*(.*)$/i);
    if (!kv) { i++; continue; }
    const key = kv[1];
    let val = kv[2].trim();
    // Inline array: [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      fm[key] = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      i++;
      continue;
    }
    // Multi-line string: > or |
    if (val === '>' || val === '|' || val === '|-' || val === '>-') {
      const lines2 = [];
      i++;
      while (i < lines.length && /^\s+/.test(lines[i])) { lines2.push(lines[i].trim()); i++; }
      fm[key] = lines2.join(' ');
      continue;
    }
    // Block list:   key:\n    - item\n    - item
    if (val === '') {
      const items = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, ''));
        i++;
      }
      // Could also be nested object — for our schema we only need the list form
      if (items.length > 0) { fm[key] = items; continue; }
      // Otherwise nested object — consume sub-lines (simple)
      const sub = {};
      while (i < lines.length && /^\s+\S/.test(lines[i])) {
        const sk = lines[i].match(/^\s+([a-z_][a-z0-9_]*)\s*:\s*(.*)$/i);
        if (sk) {
          let sv = sk[2].trim();
          if (sv.startsWith('[') && sv.endsWith(']')) {
            sv = sv.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
          }
          sub[sk[1]] = sv;
        }
        i++;
      }
      fm[key] = sub;
      continue;
    }
    // Inline scalar
    const num = Number(val);
    fm[key] = Number.isFinite(num) && /^-?\d+$/.test(val) ? num : val.replace(/^["']|["']$/g, '');
    i++;
  }
  return fm;
}

// ── Load skill manifest ────────────────────────────────────────────────────
let LIVE_SKILLS = null;
function loadSkills() {
  if (LIVE_SKILLS) return LIVE_SKILLS;
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    LIVE_SKILLS = new Set((m.skills || []).map((s) => s.name));
  } catch (err) {
    LIVE_SKILLS = null;
  }
  return LIVE_SKILLS;
}

// ── Body section scan ──────────────────────────────────────────────────────
function scanSections(text) {
  return text.split('\n').filter((l) => /^## [^#]/.test(l)).map((l) => l.trim());
}

// ── Lint one file ──────────────────────────────────────────────────────────
function lintFile(filePath) {
  const checks = [];
  const issues = [];
  let warnings = 0;

  if (!fs.existsSync(filePath)) {
    return { path: filePath, status: 'fail', issues: [`file not found`], checks: [], warnings: 0, lines: 0, sections: 0 };
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n').length;
  const fm = parseFrontmatter(text);

  if (!fm) {
    return { path: filePath, status: 'fail', issues: ['no YAML frontmatter found'], checks: [], warnings: 0, lines, sections: 0 };
  }

  // Frontmatter required fields
  for (const f of REQUIRED_FRONTMATTER) {
    if (fm[f] === undefined || fm[f] === null) {
      issues.push(`frontmatter: missing required field "${f}"`);
    }
  }

  // Filename ↔ name match
  const baseName = path.basename(filePath, '.md');
  if (fm.name && fm.name !== baseName) {
    issues.push(`frontmatter: name="${fm.name}" doesn't match filename "${baseName}"`);
  }

  // Model
  if (fm.model && !VALID_MODELS.includes(fm.model)) {
    issues.push(`frontmatter: model="${fm.model}" not in valid set (${VALID_MODELS.join('|')})`);
  }

  // Tools must be an array
  if (fm.tools !== undefined && !Array.isArray(fm.tools)) {
    issues.push(`frontmatter: tools must be a YAML list, got ${typeof fm.tools}`);
  }

  // maxTurns
  if (typeof fm.maxTurns === 'number' && (fm.maxTurns < 5 || fm.maxTurns > 30)) {
    issues.push(`frontmatter: maxTurns=${fm.maxTurns} outside range [5, 30]`);
  }

  // isolation
  if (fm.isolation && !VALID_ISOLATION.includes(fm.isolation)) {
    issues.push(`frontmatter: isolation="${fm.isolation}" not in (${VALID_ISOLATION.join('|')})`);
  }

  // A declared capability must be a real one. Declaring `mcpServers` with no MCP config
  // anywhere is not a harmless hint — it reads as a granted boundary that does not exist.
  if (fm.mcpServers !== undefined) {
    if (!Array.isArray(fm.mcpServers)) {
      issues.push(`frontmatter: mcpServers must be a YAML list`);
    } else if (fm.mcpServers.length > 0 && !mcpConfigured()) {
      issues.push(
        `frontmatter: declares mcpServers [${fm.mcpServers.join(', ')}] but this repo has no MCP config ` +
        `(no .mcp.json, no mcpServers key in .claude/settings.json) — the declaration grants nothing. ` +
        `Configure MCP or delete the field.`
      );
    }
  }

  // skills must be a list — verify each name resolves
  if (fm.skills !== undefined) {
    if (!Array.isArray(fm.skills)) {
      issues.push(`frontmatter: skills must be a YAML list`);
    } else {
      const live = loadSkills();
      if (live) {
        for (const s of fm.skills) {
          if (!live.has(s)) issues.push(`frontmatter: skill "${s}" not in MANIFEST.json`);
        }
      } else {
        warnings++;
      }
    }
  }

  // risk_tier_default
  if (fm.risk_tier_default && !VALID_TIERS.includes(fm.risk_tier_default)) {
    issues.push(`frontmatter: risk_tier_default="${fm.risk_tier_default}" not in (${VALID_TIERS.join('|')})`);
  }

  // Layer auto-classification (model + tools)
  const isPersona = filePath.includes('/_personas/') || /persona-/.test(baseName);
  const hasTask = Array.isArray(fm.tools) && fm.tools.includes('Task');
  const isCEO = baseName === 'ceo';
  const isCSuite = !isCEO && hasTask;
  const isWorker = !isPersona && !hasTask;

  // Non-personas: escalates_to + escalates_when required
  if (!isPersona) {
    if (!fm.escalates_to) issues.push('frontmatter: missing escalates_to');
    if (!fm.escalates_when) issues.push('frontmatter: missing escalates_when');
  }
  // Everyone: return_contract + pre_flight_reads required
  if (!fm.return_contract) issues.push('frontmatter: missing return_contract');
  if (!fm.pre_flight_reads) issues.push('frontmatter: missing pre_flight_reads');

  // Body sections
  const sections = scanSections(text);
  for (const required of MANDATORY_SECTIONS) {
    if (!sections.some((s) => s.startsWith(required))) {
      issues.push(`body: missing mandatory section "${required}"`);
    }
  }
  // Section 6: one of three
  if (!sections.some((s) => SECTION_6_OPTIONS.some((opt) => s.startsWith(opt)))) {
    issues.push(`body: missing section 6 (one of: ${SECTION_6_OPTIONS.join(' | ')})`);
  }

  // Worker-specific
  if (isWorker) {
    if (hasTask) issues.push('worker: must NOT have Task tool (anti-bureaucracy)');
    // isolation: workers default to worktree, but read-only workers (researcher,
    // code-reviewer, design-critic, technical-writer) may declare isolation:none.
    // Treat isolation:none as acceptable on workers when they don't write app code.
    const writesAppCode = Array.isArray(fm.tools) && fm.tools.some((t) => ['Write', 'Edit'].includes(t));
    if (fm.isolation !== 'worktree' && fm.isolation !== 'none') {
      issues.push(`worker: isolation must be "worktree" or "none" (got "${fm.isolation}")`);
    }
    if (fm.isolation === 'none' && writesAppCode) {
      // Warning: this worker writes but isn't isolated — risk of cross-worker collision
      warnings++;
      checks.push('worker: isolation=none but worker writes/edits — collision risk if spawned in parallel');
    }
    // Worktree pattern: warn (not fail) when worker declares isolation:worktree
    // but body doesn't show the creation block. Some workers (review/audit/specialist)
    // legitimately work in-place even though isolation:worktree is declared as default.
    if (writesAppCode && fm.isolation === 'worktree' && !/MAIN_REPO=\$\(git worktree list/.test(text)) {
      warnings++;
      checks.push('worker: isolation=worktree but body lacks MAIN_REPO worktree-creation block — either include it or set isolation:none');
    }
    // Deviation Rules language — required for code-writing workers; warning for review/audit workers.
    // Accept any clear escalation/scope-boundary language as evidence the worker knows when to halt.
    const hasDeviationLanguage = /Deviation Rules|auto-fix|BLOCKED on architectural|return BLOCKED|return PARTIAL|architectural decision|DO NOT escalate|escalation criteria|halt and|out of scope/i.test(text);
    if (!hasDeviationLanguage) {
      if (writesAppCode) {
        issues.push('worker: body should mention Deviation Rules (auto-fix vs BLOCK on architectural decisions)');
      } else {
        warnings++;
        checks.push('worker: body should describe when to return BLOCKED vs PARTIAL (review-style equivalent of Deviation Rules)');
      }
    }
  }

  // C-suite-specific (warning, not fail)
  if (isCSuite) {
    if (typeof fm.maxTurns === 'number' && fm.maxTurns < 20) {
      warnings++;
      checks.push(`c-suite: maxTurns=${fm.maxTurns} low — consider 25-30`);
    }
  }

  // Length cap (warning)
  if (isWorker && lines > 350) { warnings++; checks.push(`worker: ${lines} lines (target 200-300)`); }
  if (isCSuite && lines > 500) { warnings++; checks.push(`c-suite: ${lines} lines (target 300-450)`); }
  if (isCEO && lines > 600) { warnings++; checks.push(`ceo: ${lines} lines (target 400-550)`); }

  const status = issues.length === 0 ? 'pass' : 'fail';
  return { path: filePath, status, issues, checks, warnings, lines, sections: sections.length };
}

// ── Lens files ─────────────────────────────────────────────────────────────
//
// AGENT-SYSTEM-REBUILD.md §7 names the risk directly: "Lens files are prose in YAML.
// They rot exactly as agent definitions did unless the linter checks their content, not
// only their shape." A shape-only linter here would reproduce the exact failure the lens
// files were introduced to fix, so these rules read the words.

// A placeholder is content that IS a stub, not prose that mentions one. The first version
// of this rule failed a review check reading "No placeholder, stub or TODO shipped as a
// deliverable" — a rule about TODOs is not a TODO. Anchored, and it now needs the marker
// to lead the entry or carry a colon.
const PLACEHOLDER = /^(TODO|TBD|FIXME|XXX|WIP)\b|\b(TODO|TBD|FIXME):|\?\?\?|\.\.\.\s*$/i;

// A step beginning with an article or a bare pronoun is a description, not an instruction.
// "The analysis should be sensitivity-tested" tells nobody to do anything. This applies to
// `procedure` ONLY — `refuses` entries are noun phrases by design ("a single-point
// projection") and `checks` are predicates ("Authorisation checked at the boundary").
// Applying one grammar rule to three different kinds of statement was my error, and the
// linter caught it on its first run.
const NOT_AN_INSTRUCTION = /^(the|a|an|this|that|these|it|there|we|you should|it is)\b/i;

// The vagueness this whole file exists to prevent. Straight from the design-critic
// anti-pattern: "'The spacing looks off' is not a finding." A judgement word with no
// measurable anchor is unfalsifiable, which makes it unenforceable.
const VAGUE = /\b(looks?|feels?|seems?|appropriate|reasonable|properly|adequately|good|nice|clean|sensible|as needed|where appropriate)\b/i;
const ANCHOR = /\b(match(es|ing)?|equals?|exceeds?|at least|no more than|within|per|against the|stated|written|measured|number|date|source|list(ed)?)\b/i;

function lintStep(text, where, issues, { min = 20, max = 200, mode = 'procedure' } = {}) {
  if (typeof text !== 'string' || text.trim() === '') {
    issues.push(`${where}: empty entry`);
    return;
  }
  const s = text.trim();
  if (PLACEHOLDER.test(s)) issues.push(`${where}: is a placeholder — ${JSON.stringify(s.slice(0, 60))}`);
  if (s.length < min) issues.push(`${where}: too short to carry procedure (${s.length} chars) — ${JSON.stringify(s)}`);
  if (s.length > max) issues.push(`${where}: ${s.length} chars — an entry this long is a document, split it`);
  if (mode === 'procedure' && NOT_AN_INSTRUCTION.test(s)) {
    issues.push(`${where}: reads as description, not instruction — ${JSON.stringify(s.slice(0, 60))}`);
  }
  if (mode !== 'refuses' && VAGUE.test(s) && !ANCHOR.test(s)) {
    issues.push(`${where}: vague and unfalsifiable — ${JSON.stringify(s.slice(0, 60))}. Name what it is measured against`);
  }
}

function lintLensFile(filePath, kind) {
  const issues = [];
  const rel = path.relative(REPO_ROOT, filePath);
  if (!fs.existsSync(filePath)) return { rel, issues: [`${rel}: missing`], count: 0 };

  let doc;
  try {
    doc = parseYamlSubset(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    // Refuse loudly. The historic failure in this file is `catch { LIVE_SKILLS = null }`,
    // which turns an unreadable input into a silently skipped check.
    return { rel, issues: [`${rel}: ${e.message}`], count: 0 };
  }

  const key = kind === 'domain' ? 'lenses' : 'review_lenses';
  const list = doc && doc[key];
  if (!Array.isArray(list) || list.length === 0) {
    return { rel, issues: [`${rel}: no non-empty "${key}:" list`], count: 0 };
  }

  const seen = new Set();
  list.forEach((l, i) => {
    const where = `${rel} ${key}[${i}]`;
    if (!l || typeof l !== 'object') { issues.push(`${where}: not a mapping`); return; }
    const id = l.id;
    if (typeof id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(id)) {
      issues.push(`${where}: id must be kebab-case, got ${JSON.stringify(id)}`);
    } else if (seen.has(id)) {
      issues.push(`${where}: duplicate lens id "${id}"`);
    } else {
      seen.add(id);
    }
    const at = `${rel} ${id || i}`;

    if (typeof l.summary !== 'string' || l.summary.trim().length < 15) {
      issues.push(`${at}: summary must say what the lens is for`);
    }

    // Provenance is dead-path checked. A lens may not claim to come from a file that
    // does not exist — the same rule check-registration.mjs applies to governing docs.
    if (!Array.isArray(l.sources) || l.sources.length === 0) {
      issues.push(`${at}: sources is required — a lens must record which file its expertise came from`);
    } else {
      for (const s of l.sources) {
        if (!fs.existsSync(path.join(REPO_ROOT, String(s)))) {
          issues.push(`${at}: sources entry "${s}" does not exist`);
        }
      }
    }

    if (kind === 'domain') {
      if (!Array.isArray(l.procedure)) {
        issues.push(`${at}: procedure must be a list`);
      } else {
        if (l.procedure.length < 3) issues.push(`${at}: ${l.procedure.length} step(s) — that is not encoded expertise`);
        if (l.procedure.length > 12) issues.push(`${at}: ${l.procedure.length} steps — a lens this long is a document`);
        l.procedure.forEach((s, k) => lintStep(s, `${at} procedure[${k}]`, issues, { mode: 'procedure' }));
        if (l.procedure.some((s) => typeof s === 'string' && s.trim().toLowerCase() === String(id))) {
          issues.push(`${at}: a step that merely restates the lens id says nothing`);
        }
      }
      // The anti-patterns are where this system's expertise actually concentrates —
      // every source agent's sharpest knowledge is in its DO NOT list.
      if (!Array.isArray(l.refuses) || l.refuses.length === 0) {
        issues.push(`${at}: refuses is required — what this lens will not accept`);
      } else {
        l.refuses.forEach((s, k) => lintStep(s, `${at} refuses[${k}]`, issues, { min: 10, mode: 'refuses' }));
      }
      if (!Array.isArray(l.applies_to) || l.applies_to.length === 0) {
        issues.push(`${at}: applies_to must name at least one engine`);
      } else {
        for (const e of l.applies_to) {
          if (!ENGINES.includes(e)) issues.push(`${at}: applies_to "${e}" is not an engine (${ENGINES.join(', ')})`);
        }
      }
      for (const k of (l.requires_claims || [])) {
        if (!KINDS.includes(k)) issues.push(`${at}: requires_claims "${k}" is not a claim kind`);
      }
    } else {
      if (!Array.isArray(l.checks) || l.checks.length < 2) {
        issues.push(`${at}: checks must list at least 2 things this lens looks at`);
      } else {
        l.checks.forEach((s, k) => lintStep(s, `${at} checks[${k}]`, issues, { mode: 'checks' }));
      }
      if (!Array.isArray(l.blocking_severities) || l.blocking_severities.length === 0) {
        issues.push(`${at}: blocking_severities is required — a lens that blocks nothing is advisory, say so explicitly with an empty list`);
      }
      if (typeof l.independent !== 'boolean') {
        issues.push(`${at}: independent must be true or false`);
      }
      const families = Array.isArray(l.model_families) ? l.model_families : [];
      if (families.length === 0) issues.push(`${at}: model_families is required`);
      if (l.independent === true) {
        // Shared with risk:high claim panels — see independenceIssue() in claims.js.
        const problem = independenceIssue(families, 2, `${at}: independent:true`);
        if (problem) issues.push(problem);
      }
    }
  });

  return { rel, issues, count: list.length };
}

// ── Main ───────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const targets = args.filter((a) => !a.startsWith('--'));

  let files;
  if (targets.length > 0) {
    files = targets;
  } else {
    files = fs.readdirSync(AGENTS_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => path.join(AGENTS_DIR, f));
  }

  const results = files.map(lintFile);
  const passCount = results.filter((r) => r.status === 'pass').length;
  let failCount = results.filter((r) => r.status === 'fail').length;
  const warnCount = results.reduce((s, r) => s + (r.warnings || 0), 0);

  // Lens files are linted whenever the whole roster is linted — never when a single
  // agent file was named, so `schema-lint <one-file>` stays a targeted query.
  const lensResults = targets.length > 0 ? [] : [
    lintLensFile(LENSES_PATH, 'domain'),
    lintLensFile(REVIEW_LENSES_PATH, 'review'),
  ];
  for (const r of lensResults) failCount += r.issues.length > 0 ? 1 : 0;

  if (jsonMode) {
    process.stdout.write(JSON.stringify({
      version: '1.0',
      summary: { pass: passCount, fail: failCount, warnings: warnCount, total: results.length },
      files: results,
      lenses: lensResults,
    }, null, 2) + '\n');
  } else {
    for (const r of results) {
      const relPath = path.relative(REPO_ROOT, r.path);
      if (r.status === 'pass') {
        const warn = r.warnings > 0 ? ` (${r.warnings} warning${r.warnings === 1 ? '' : 's'})` : '';
        process.stdout.write(`✓ ${relPath} — ${r.lines} lines, ${r.sections} sections${warn}\n`);
        for (const c of (r.checks || [])) process.stdout.write(`    ${c}\n`);
      } else {
        process.stdout.write(`✗ ${relPath} — FAIL\n`);
        for (const issue of r.issues) process.stdout.write(`    - ${issue}\n`);
      }
    }
    for (const r of lensResults) {
      if (r.issues.length === 0) {
        process.stdout.write(`✓ ${r.rel} — ${r.count} lenses\n`);
      } else {
        process.stdout.write(`✗ ${r.rel} — FAIL\n`);
        for (const i of r.issues) process.stdout.write(`    - ${i}\n`);
      }
    }
    process.stdout.write(`\nSummary: ${passCount} pass · ${failCount} fail · ${warnCount} warnings\n`);
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Exported for scripts/lenses.test.mjs, which points lintLensFile at fixture files so the
// rules are tested by constructing the failures rather than by trusting that they fire.
// Phase 2's lesson: six install guards all passed a manual pass and one still shipped
// broken, because the mismatch the bug needed was never built.
module.exports = { lintLensFile, lintFile, ENGINES };

if (require.main === module) {
  try { main(); } catch (err) {
    process.stderr.write(`schema-lint: script error: ${err.message}\n`);
    process.exit(2);
  }
}
