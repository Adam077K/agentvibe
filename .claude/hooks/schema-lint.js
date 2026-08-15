#!/usr/bin/env node
// POSTURE: BLOCKS in CI, ADVISES in session — exit 1 on any failing agent. .github/workflows/ci.yml treats that as a build
// failure; the Stop-hook registration only surfaces it, since Stop cannot block.
// .claude/hooks/schema-lint.js — Agentvibe agent file schema lint
//
// Validates .claude/agents/*.md. (Phase 6 deleted war-room/, which used
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
const { execFileSync } = require('child_process');

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
const { parseYamlSubset, KINDS, VERIFIERS, independenceIssue } = require('../../scripts/lib/claims.js');

// The seven engines of the Phase 4 roster. Held here as a constant rather than read from
// disk because the lens files are authored BEFORE the engine files exist — 4a proves the
// expertise survives, and only then does 4b delete what it replaced.
const ENGINES = ['orchestrator', 'framer', 'sourcer', 'builder', 'designer', 'reviewer'];

// Engines that must never be able to change what they look at.
//
// STATED LIMIT: this checks the DECLARATION, not the binding. It proves the file does not
// ask for write tools; it does not prove the runtime refuses them if it did. Verifying the
// binding means spawning an engine with a restricted tool list and watching a write fail,
// which needs subagent spawning — disabled in these sessions by founder instruction. The
// probe is written up in the Phase 4b session file and has to be run by hand.
//
// Treating this lint as the gate criterion would be exactly the decorative-capability
// failure §3.7 names: a field that looks like a boundary and enforces nothing.
const READ_ONLY_ENGINES = ['reviewer'];

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

  // ── Shims ────────────────────────────────────────────────────────────────
  // A shim is a name kept occupied on purpose. Deleting a repo agent whose name also
  // exists in ~/.claude/agents/ does not remove it — it UN-SHADOWS the global copy, and
  // the name keeps working while quietly meaning an older, drifted definition. For
  // `ceo` that would have swapped a 226-line Opus definition for a 313-line Sonnet one
  // routing to four agents this repo retired. A failure that keeps working is worse than
  // one that stops.
  //
  // Shims carry their own schema: they hold no procedure, so requiring the eight body
  // sections of a real agent would just invite filler. They are checked for what they
  // actually assert — that they point at a real engine and real lenses, and that they
  // name the phase that removes them.
  if (fm.kind === 'shim') {
    const shimRequired = ['name', 'description', 'kind', 'engine', 'lenses', 'retired', 'retires_at'];
    for (const f of shimRequired) {
      if (fm[f] === undefined || fm[f] === null) issues.push(`shim: missing required field "${f}"`);
    }
    const baseName2 = path.basename(filePath, '.md');
    if (fm.name && fm.name !== baseName2) issues.push(`shim: name="${fm.name}" doesn't match filename "${baseName2}"`);
    if (fm.engine && !ENGINES.includes(fm.engine)) {
      issues.push(`shim: engine "${fm.engine}" is not an engine (${ENGINES.join(', ')})`);
    }
    if (fm.lenses !== undefined) {
      if (!Array.isArray(fm.lenses)) issues.push('shim: lenses must be a YAML list');
      else {
        const domain = knownDomainLenses();
        for (const l of fm.lenses) {
          if (!domain.has(l)) issues.push(`shim: lens "${l}" is not in .claude/lenses.yml`);
        }
      }
    }
    // A shim with no removal phase is a permanent second roster. Naming the phase is what
    // keeps this a migration step rather than the new shape of the system.
    if (fm.retires_at !== undefined && !/^phase-\d+$/.test(String(fm.retires_at))) {
      issues.push(`shim: retires_at must name the phase that removes it, e.g. phase-9 (got ${JSON.stringify(fm.retires_at)})`);
    }
    for (const banned of ['tools', 'model', 'maxTurns', 'skills']) {
      if (fm[banned] !== undefined) {
        issues.push(`shim: must not declare "${banned}" — a shim routes, it does not run. Put it on the engine`);
      }
    }
    if (lines > 40) issues.push(`shim: ${lines} lines — a shim points somewhere, it does not explain itself at length`);
    return { path: filePath, status: issues.length ? 'fail' : 'pass', issues, checks, warnings, lines, sections: 0, shim: true };
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

  // Read-only engines may not ask for write tools.
  if (READ_ONLY_ENGINES.includes(path.basename(filePath, '.md')) && Array.isArray(fm.tools)) {
    const writes = fm.tools.filter((t) => ['Write', 'Edit', 'NotebookEdit'].includes(t));
    if (writes.length) {
      issues.push(
        `frontmatter: "${path.basename(filePath, '.md')}" is a read-only engine but declares ${writes.join(', ')}. ` +
        'An agent that can edit what it reviews will review what it can edit.'
      );
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

// Provenance that survives deletion.
//
// Phase 4b deleted the fifteen agent files the lenses were mined from, and the existence
// check below promptly failed — correctly. The expertise really did come from
// `.claude/agents/cbo.md`; that file really is gone.
//
// The wrong fixes were tempting and both dishonest: re-point `sources` at the engine that
// replaced it (the expertise did not come from there), or archive 6,487 lines of
// superseded prose into `docs/` purely to keep a path resolving — which is the "keep it
// just in case" dead surface Phase 1 deleted 1,459 files to remove.
//
// So a source may name a path in git history: `git:<path>@<rev>`, verified with
// `git cat-file -e`. The claim "this came from that file" stays true and stays checkable
// after the file is gone. CI must fetch history for this — see fetch-depth in ci.yml.
function provenanceProblem(s) {
  // A shim holds no expertise — it is 24 lines pointing at an engine. A lens claiming to
  // have been mined from one is claiming provenance from a file that never had any. This
  // fired on eight lenses after 4b, when the files they cited became shims in place.
  const live = path.join(REPO_ROOT, s);
  if (!s.startsWith('git:') && fs.existsSync(live)) {
    try {
      if (/^\s*kind:\s*shim\s*$/m.test(fs.readFileSync(live, 'utf8'))) {
        return 'is a shim and holds no expertise — cite the pre-collapse file as git:<path>@<rev>';
      }
    } catch { /* fall through to the existence check */ }
  }

  const gitForm = /^git:(.+)@([0-9a-f]{7,40})$/.exec(s);
  if (gitForm) {
    const [, p, rev] = gitForm;
    try {
      execFileSync('git', ['cat-file', '-e', `${rev}:${p}`], { cwd: REPO_ROOT, stdio: 'ignore' });
      return null;
    } catch {
      return `does not resolve in git history (git cat-file -e ${rev}:${p} failed — a shallow clone will do this; CI needs fetch-depth: 0)`;
    }
  }
  return fs.existsSync(path.join(REPO_ROOT, s)) ? null : 'does not exist';
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
        const problem = provenanceProblem(String(s));
        if (problem) issues.push(`${at}: sources entry "${s}" ${problem}`);
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
        // A lens claiming independence must say HOW, because the two modes are checked
        // differently and an unstated mode defaults to the one that cannot be satisfied here.
        // See the header of review-lenses.yml for why `provenance` exists.
        if (l.independence === 'vendor' || l.independence === undefined) {
          // Shared with risk:high claim panels — see independenceIssue() in claims.js.
          const problem = independenceIssue(families, 2, `${at}: independent:true`);
          if (problem) issues.push(problem);
        } else if (l.independence === 'provenance') {
          // One family is fine; what must hold is that the judge never saw the producer's
          // case. That is a property of the DISPATCH, not of this file, so the lint's job
          // is to refuse a lens that claims provenance independence while also declaring a
          // scope the reviewer cannot obtain without the producer handing it over.
          if (l.scope === 'whole-artifact') {
            issues.push(`${at}: independence:provenance is incompatible with scope:whole-artifact — ` +
              `judging the whole artifact requires the producer's own account of it, which is the ` +
              `priming this mode exists to prevent. Use scope:diff-only or independence:vendor`);
          }
        } else {
          issues.push(`${at}: independence must be 'vendor' or 'provenance', got '${l.independence}'`);
        }
      } else if (l.independence !== undefined) {
        issues.push(`${at}: independence is declared but independent is not true`);
      }
    }
  });

  return { rel, issues, count: list.length };
}

// ── Playbooks ──────────────────────────────────────────────────────────────
//
// §3.5: "A playbook declares the STAGES a category of work passes and the CLAIMS +
// CRITERIA required to exit each. It never declares method — the agent picks its own
// path inside every stage."
//
// That last sentence is the whole design, so it is a lint rule rather than a hope: a
// stage carrying `steps`, `how`, `method` or `implementation` is refused. Without it a
// playbook slowly becomes the 50 lines of pipeline prose it replaced.
//
// Exit conditions are a tiny DSL, and every reference in them is resolved:
//   claim(kind=K, verified_by=V)      K must be a real claim kind, V a real resolver
//   review(lens=L)                    L must exist in review-lenses.yml
//   criterion(name[, verified_by=V])  named check; V optional but validated if present
// A playbook naming a lens that does not exist is the same defect as a doc naming a file
// that does not exist, and it fails the same way.

const GATES = ['qa-verdict', 'founder-approval', 'outbound-approval', 'migration-approval'];
const METHOD_KEYS = ['steps', 'how', 'method', 'implementation', 'tasks', 'procedure'];
const EXIT_RE = /^(claim|review|criterion)\(([^)]*)\)$/;

function parseArgs(raw) {
  const out = {};
  const positional = [];
  for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
    const eq = part.indexOf('=');
    if (eq < 0) positional.push(part);
    else out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return { out, positional };
}

function lintExit(entry, where, issues, knownLenses) {
  if (typeof entry !== 'string') { issues.push(`${where}: exit entry must be a string`); return; }
  const m = EXIT_RE.exec(entry.trim());
  if (!m) {
    issues.push(`${where}: ${JSON.stringify(entry)} is not claim(...), review(...) or criterion(...)`);
    return;
  }
  const [, fn, rawArgs] = m;
  const { out: args, positional } = parseArgs(rawArgs);

  if (fn === 'claim') {
    if (!KINDS.includes(args.kind)) issues.push(`${where}: claim kind ${JSON.stringify(args.kind)} is not a claim kind`);
    if (args.verified_by && !VERIFIERS.includes(args.verified_by)) {
      issues.push(`${where}: claim verified_by ${JSON.stringify(args.verified_by)} is not a resolver`);
    }
  } else if (fn === 'review') {
    if (!args.lens) issues.push(`${where}: review(...) needs lens=`);
    else if (!knownLenses.has(args.lens)) {
      issues.push(`${where}: review lens "${args.lens}" is not in .claude/review-lenses.yml — a playbook may not name a lens that does not exist`);
    }
  } else {
    if (positional.length !== 1) issues.push(`${where}: criterion(...) needs exactly one name, got ${positional.length}`);
    if (args.verified_by && !VERIFIERS.includes(args.verified_by)) {
      issues.push(`${where}: criterion verified_by ${JSON.stringify(args.verified_by)} is not a resolver`);
    }
  }
}

function knownReviewLenses() {
  try {
    const doc = parseYamlSubset(fs.readFileSync(REVIEW_LENSES_PATH, 'utf8'));
    return new Set((doc.review_lenses || []).map((l) => l.id));
  } catch {
    // Fail closed. If the lens file cannot be read, every review() reference is
    // unverifiable — returning an empty set makes them all fail loudly, which is the
    // opposite of the LIVE_SKILLS=null pattern above it.
    return new Set();
  }
}

function knownDomainLenses() {
  try {
    const doc = parseYamlSubset(fs.readFileSync(LENSES_PATH, 'utf8'));
    return new Set((doc.lenses || []).map((l) => l.id));
  } catch {
    return new Set();
  }
}

function lintPlaybook(filePath, knownLenses, knownDomain) {
  const issues = [];
  const rel = path.relative(REPO_ROOT, filePath);
  let doc;
  try {
    doc = parseYamlSubset(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return { rel, issues: [`${rel}: ${e.message}`], stages: 0 };
  }
  if (!doc || typeof doc !== 'object') return { rel, issues: [`${rel}: empty`], stages: 0 };

  const base = path.basename(filePath, '.yml');
  if (doc.playbook !== base) {
    issues.push(`${rel}: playbook "${doc.playbook}" does not match filename "${base}"`);
  }
  if (typeof doc.summary !== 'string' || doc.summary.trim().length < 15) {
    issues.push(`${rel}: summary must say what category of work this covers`);
  }
  if (!Array.isArray(doc.stages) || doc.stages.length < 2) {
    issues.push(`${rel}: stages must be a list of at least 2 — one stage is not a sequence`);
    return { rel, issues, stages: 0 };
  }

  const seen = new Set();
  doc.stages.forEach((s, i) => {
    const where = `${rel} stages[${i}]`;
    if (!s || typeof s !== 'object') { issues.push(`${where}: not a mapping`); return; }
    if (typeof s.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(s.id)) {
      issues.push(`${where}: id must be kebab-case, got ${JSON.stringify(s.id)}`);
    } else if (seen.has(s.id)) {
      issues.push(`${where}: duplicate stage id "${s.id}"`);
    } else seen.add(s.id);

    const at = `${rel} ${s.id || i}`;
    if (typeof s.goal !== 'string' || s.goal.trim().length < 15) {
      issues.push(`${at}: goal must state the outcome of the stage`);
    }

    // The design rule, enforced.
    for (const k of METHOD_KEYS) {
      if (s[k] !== undefined) {
        issues.push(`${at}: carries "${k}" — a playbook declares stages and exit criteria, never method. The engine picks its own path inside the stage`);
      }
    }

    if (!Array.isArray(s.exit) || s.exit.length === 0) {
      issues.push(`${at}: exit is required — a stage nobody can leave is not a stage`);
    } else {
      s.exit.forEach((e, k) => lintExit(e, `${at} exit[${k}]`, issues, knownLenses));
    }

    for (const l of (s.lenses || [])) {
      if (!knownDomain.has(l)) issues.push(`${at}: lens "${l}" is not in .claude/lenses.yml`);
    }
    if (s.gate !== undefined && !GATES.includes(s.gate)) {
      issues.push(`${at}: gate "${s.gate}" is not one of (${GATES.join(', ')})`);
    }
    for (const d of (s.dispatch || [])) {
      if (!d || typeof d !== 'object') { issues.push(`${at}: dispatch entry must be a mapping`); continue; }
      if (typeof d.task !== 'string' || d.task.trim().length < 10) issues.push(`${at}: dispatch task must describe the work`);
      if (!ENGINES.includes(d.engine)) issues.push(`${at}: dispatch engine "${d.engine}" is not an engine (${ENGINES.join(', ')})`);
    }
  });

  return { rel, issues, stages: doc.stages.length };
}

function lintAllPlaybooks() {
  const dir = path.join(REPO_ROOT, '.claude', 'playbooks');
  if (!fs.existsSync(dir)) return [{ rel: '.claude/playbooks', issues: ['.claude/playbooks: missing'], stages: 0 }];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.yml')).sort();
  if (files.length === 0) return [{ rel: '.claude/playbooks', issues: ['.claude/playbooks: no playbooks'], stages: 0 }];
  const lenses = knownReviewLenses();
  const domain = knownDomainLenses();
  return files.map((f) => lintPlaybook(path.join(dir, f), lenses, domain));
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
    ...lintAllPlaybooks(),
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
        process.stdout.write(`✓ ${r.rel} — ${r.count !== undefined ? r.count + ' lenses' : r.stages + ' stages'}\n`);
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
module.exports = { lintLensFile, lintPlaybook, lintFile, knownReviewLenses, knownDomainLenses, ENGINES, GATES };

if (require.main === module) {
  try { main(); } catch (err) {
    process.stderr.write(`schema-lint: script error: ${err.message}\n`);
    process.exit(2);
  }
}
