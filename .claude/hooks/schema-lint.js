#!/usr/bin/env node
// POSTURE: BLOCKS in CI, ADVISES in session — exit 1 on any failing agent. .github/workflows/ci.yml treats that as a build
// failure; the Stop-hook registration only surfaces it, since Stop cannot block.
// .claude/hooks/schema-lint.js — Agentvibe agent file schema lint
//
// Validates .claude/agents/*.md. (Phase 6 deleted war-room/, which used
// the bespoke Routine schema acceptable per 07b §4) against the canonical
// spec at docs/03-system-design/agents/PROMPT-STANDARD.md.
//
// THAT CITATION USED TO READ `07b-AGENT-TEMPLATE.md`, WHICH DOES NOT EXIST AND NEVER DID —
// not in this tree, not in git history. This file spent its whole life claiming to enforce a
// document nobody could open, which is the same dead-path defect check-registration.mjs was
// written to catch in governing docs and does not check here.
//
// The PS-* rules below are §6.1 of PROMPT-STANDARD.md, id for id. That document lands from
// branch `docs/prompt-standard` in the same session as this change; if it is not merged, this
// header cites a file that does not exist and the fix is to merge it, not to re-point this line.
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
const ENGINES = ['orchestrator', 'framer', 'sourcer', 'builder', 'designer', 'reviewer', 'reviewer-readonly'];

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
// Engines that must never be able to change what they look at. `reviewer-readonly` is the
// no-shell variant the binding QA gate dispatches into: `tools:` is not known to bind Bash, so
// the gate's judge — whose verdict cannot be overridden — must not declare it at all.
const READ_ONLY_ENGINES = ['reviewer', 'reviewer-readonly'];

// ── 07b template checks ────────────────────────────────────────────────────

const REQUIRED_FRONTMATTER = [
  'name',
  'description',
  'model',
  'effort',
  'tools',
  'maxTurns',
  'color',
  'isolation',
  'skills',
  'risk_tier_default',
];

// `effort` — REQUIRED as of the prompt standard, and the honesty note is the point of this block.
//
// WHAT IS VERIFIED: the VALUE binds where it is set. `low|medium|high|xhigh|max` are real, and
// `max` is real at 95 recorded turns (model×effort census, TOKEN-EFFICIENCY.md). It is settable on
// the workflow surface — `agent(prompt, opts?: {label, phase, schema, model, effort, isolation,
// agentType})`, from `strings -a` on binary 2.1.232 (GRANT-HOLDERS.md §3.1, CONTROL-PLANE.md §2.1).
//
// WHAT IS NOT VERIFIED: whether the FRONTMATTER FIELD is read at all. Zero agent files declared it
// before this change, so that channel has never been exercised, and documented support for `effort:`
// in subagent frontmatter could not be confirmed. The census measured effort as it ARRIVED at the
// runtime, not as an agent file DECLARED it.
//
// So this field is required, enum-checked, and MUST NOT be described anywhere as a grant. This repo
// shipped `mcpServers` as decoration across 52 files on exactly that mistake — a field that looks
// like a boundary and enforces nothing. Tracked as claim `c-effort-frontmatter-binding-unverified`
// in docs/03-system-design/CLAIM-LEDGER.md, modelled on `c-read-only-binding-unverified`.
// `mcpServers` was required here and is no longer. Every one of the 52 agent files
// declared it while `settings.json` had no `mcpServers` key and no `.mcp.json` existed
// anywhere, so the field granted nothing to anybody. §3.7: "a capability field
// auto-granted whatever it requests is worse than no field — it degrades to false
// confidence, not to zero." The declarations are deleted, and the check below makes the
// field fail the build unless real MCP config exists, so it cannot return as decoration.

/**
 * The MCP servers this repo actually configures, by name.
 *
 * THIS USED TO BE A BOOLEAN, AND THE BOOLEAN WAS A TRAP. `mcpConfigured()` answered "does any
 * MCP config exist anywhere", so the moment a single `.mcp.json` appeared, EVERY agent could
 * declare ANY server name and pass the lint — one file flipping the check permissive for the
 * whole roster at once. The specs flagged this as a sequencing hazard before it could fire:
 * the per-agent allowlist had to land in the same change as the config, or the grant would be
 * silently universal. It did, and this is it.
 *
 * Returns a Set. An empty Set means no MCP is configured, which is a different thing from
 * "configured with nothing" only in theory — both correctly refuse every declaration.
 */
function configuredMcpServers() {
  const names = new Set();
  try {
    const j = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.mcp.json'), 'utf8'));
    for (const k of Object.keys(j.mcpServers || {})) names.add(k);
  } catch { /* absent or unreadable — contributes nothing, never throws */ }
  try {
    const s = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude', 'settings.json'), 'utf8'));
    for (const k of Object.keys(s.mcpServers || {})) names.add(k);
  } catch { /* same */ }
  return names;
}
// escalates_to + escalates_when are required for non-personas
// return_contract + pre_flight_reads are required for everyone

// PS-MODEL-ENUM. The set this fleet actually runs, per TOKEN-EFFICIENCY.md §6 "Model split" —
// the only VERIFIED inventory of the corpus by model. `claude-opus-4-7` and `claude-sonnet-4-6`
// are superseded and are refused, because a superseded pin is not inert: it SILENTLY CLAMPS
// `effort`, the one quality dial that binds (GRANT-HOLDERS.md §3.1; CONTROL-PLANE.md §3.1 — 269
// of 269 reviewer runs executed sonnet-4-6 at `high` inside sessions defaulting to opus-5).
const VALID_MODELS = ['claude-opus-5', 'claude-sonnet-5', 'claude-fable-5', 'claude-haiku-4-5'];
// PS-EFFORT-ENUM. Enum only — see the REQUIRED_FRONTMATTER note on what this field does not prove.
const VALID_EFFORT = ['low', 'medium', 'high', 'xhigh', 'max'];
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
          } else if (sv === '') {
            // A nested BLOCK LIST — `return_contract:` → `required_fields:` → `- status`.
            // Without this branch those `- item` lines fell through the sub-key regex and were
            // silently dropped, so `return_contract.required_fields` parsed to the empty string
            // and PS-STATUS-FIELD / PS-RETURN-EXAMPLE-MATCHES would have had nothing to read —
            // and would have passed on every file, which is the vacuous-rule failure §6.4 forbids.
            const items = [];
            let j = i + 1;
            while (j < lines.length && /^\s+-\s+/.test(lines[j])) {
              items.push(lines[j].replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, ''));
              j++;
            }
            if (items.length > 0) { sv = items; i = j - 1; }
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

// Return the raw `allowed-tools` value of a skill, or null when it declares none.
// Reads the SKILL.md directly rather than the manifest: the manifest is a generated index and
// does not carry the field, and a rule that depends on a generated file inherits its staleness.
const SKILL_CLAMP_CACHE = new Map();
function skillToolClamp(name) {
  if (SKILL_CLAMP_CACHE.has(name)) return SKILL_CLAMP_CACHE.get(name);
  let clamp = null;
  // Two independent guards, because the caller's manifest check is a different function that a
  // later edit could reorder away — and did, in this function's first cut.
  //   1. Shape: a skill name is a lowercase slug. `..`, `/`, `\` and absolute paths cannot match.
  //   2. Containment: resolve and assert the result is genuinely under .claude/skills/, so a
  //      future loosening of the pattern cannot silently re-open a traversal.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    SKILL_CLAMP_CACHE.set(name, null);
    return null;
  }
  try {
    const skillsRoot = path.resolve(REPO_ROOT, '.claude', 'skills');
    const p = path.resolve(skillsRoot, name, 'SKILL.md');
    // Lexical containment first — cheap, and correct for the `../` string case.
    if (!p.startsWith(skillsRoot + path.sep)) {
      SKILL_CLAMP_CACHE.set(name, null);
      return null;
    }
    // Then containment ON THE FILESYSTEM. path.resolve is pure string arithmetic: it never
    // touches disk and cannot see a symlink, so `.claude/skills/<validname>` pointing at
    // /etc satisfies the lexical check while readFileSync follows the link straight out of the
    // tree. The binding gate found this on the SECOND pass — the `../` fix was real, and it
    // did not close the symlink route to the same disclosure. Reproduced before fixing:
    // lexical check true, realpath /private/tmp/evil-target/SKILL.md, canary readable.
    // realpathSync dereferences every component; lstat additionally refuses a symlinked skill
    // directory outright rather than following it anywhere.
    if (fs.lstatSync(path.join(skillsRoot, name)).isSymbolicLink()) {
      SKILL_CLAMP_CACHE.set(name, null);
      return null;
    }
    const realRoot = fs.realpathSync(skillsRoot);
    const realP = fs.realpathSync(p);
    if (!realP.startsWith(realRoot + path.sep)) {
      SKILL_CLAMP_CACHE.set(name, null);
      return null;
    }
    const text = fs.readFileSync(realP, 'utf8');
    const fmEnd = text.indexOf('\n---', 3);
    const head = fmEnd === -1 ? text : text.slice(0, fmEnd);
    const m = head.match(/^allowed-tools:[ \t]*(.*)$/m);
    if (m) {
      // Inline form (`allowed-tools: Read, Write`) or block list on following lines.
      const inline = m[1].trim();
      if (inline) {
        clamp = inline;
      } else {
        const after = head.slice(head.indexOf(m[0]) + m[0].length);
        const items = [];
        for (const line of after.split('\n')) {
          const li = line.match(/^[ \t]*-[ \t]+(.*)$/);
          if (li) items.push(li[1].trim());
          else if (line.trim()) break;
        }
        clamp = items.length ? items.join(', ') : null;
      }
    }
  } catch { clamp = null; }
  SKILL_CLAMP_CACHE.set(name, clamp);
  return clamp;
}

// ── Body section scan ──────────────────────────────────────────────────────
function scanSections(text) {
  return text.split('\n').filter((l) => /^## [^#]/.test(l)).map((l) => l.trim());
}

// ── The prompt standard — PS-* ─────────────────────────────────────────────
//
// docs/03-system-design/agents/PROMPT-STANDARD.md §6.1 (FAIL) and §6.2 (WARN), id for id.
// The rules that already existed before that document are cited there with line numbers and are
// NOT reimplemented here; this block is only the ones it marks **new**.
//
// THE CALIBRATION RULE GOVERNS EVERY ADDITION BELOW (§0). Before a rule may FAIL it is run against
// all seven live engine files and narrowed until it hits ZERO, and it must then fire on a
// constructed violation or it is vacuous and is deleted. Both numbers are pinned in
// scripts/prompt-standard.test.mjs. The split between FAIL and WARN is NOT by severity — it is by
// whether a false positive is possible:
//
//   FAIL over closed sets   — an enum, the tool universe, a literal phrase list, a key-set compare
//   WARN over open prose    — any pattern over English is eventually wrong about a sentence nobody
//                             anticipated, and a linter that is wrong blocks good work
//
// The sharpest instance: §0 measured `VAGUE` (defined below for lens steps, where it is correct)
// failing 6 of the 7 files it is meant to certify, including `### Step 4 — Render and look` in the
// one engine whose reason to exist is that it looks at rendered output. It is PS-BODY-VAGUE, a
// warning, and it may never block.

// PS-FM-KEY-ALLOWLIST — the keys the schema knows. An unknown key is decoration by definition:
// nothing reads it, and it will be mistaken for a grant. That is the `mcpServers` failure exactly,
// which 52 files carried. 15 keys — the 14 of §5.1 plus `effort`, which this change adds.
const KNOWN_FM_KEYS = [
  'name', 'description', 'model', 'effort', 'tools', 'maxTurns', 'color', 'isolation',
  'skills', 'mcpServers', 'risk_tier_default', 'escalates_to', 'escalates_when',
  'return_contract', 'pre_flight_reads',
];

// PS-TOOL-EXISTS — the runtime tool universe. A `tools:` entry outside it grants nothing and
// reads as a boundary, which is the whole never-appear list (§5.2). `mcp__*` entries are passed
// through deliberately: PS-MCP-BACKED already checks those against configured servers per server,
// and duplicating that here would give two implementations of one question.
const TOOL_UNIVERSE = [
  'Read', 'Write', 'Edit', 'NotebookEdit', 'Bash', 'BashOutput', 'KillShell',
  'Glob', 'Grep', 'Task', 'Agent', 'WebSearch', 'WebFetch', 'TodoWrite',
  'Skill', 'SlashCommand', 'ExitPlanMode', 'StructuredOutput', 'ToolSearch',
];

// Tools that appear in `.claude/agents/*.md` prose as code spans, for PS-BODY-TOOL-AFFIRM.
const TOOL_MENTION_RE = /`(Read|Write|Edit|NotebookEdit|Bash|Glob|Grep|Task|WebSearch|WebFetch)`/g;
// An affirmative DIRECTION to use it. Narrowed to verbs of use: `declares`, `removed`, `holding`
// and `left` all appear beside out-of-grant tool names in reviewer-readonly.md's own explanation
// of why it exists, and every one of those is correct prose that must survive (§5.2).
const TOOL_DIRECTIVE_RE = /\b(use|uses|using|run|runs|running|call|calls|calling|invoke|invokes|invoking|execute|executes|executing|shell out|spawn|spawns|spawning|launch|launches|launching)\b/i;
// A negation anywhere in the PARAGRAPH clears it. A LINE is not a sentence in a file that hard-wraps
// at ~110 characters: line-scoped, this rule fires on 2 correct negations in reviewer-readonly.md
// because the "no" lands on the neighbouring line. Paragraph-scoped it measures 0 on all seven.
const TOOL_NEGATION_RE = /\b(no|not|never|cannot|can't|without|lacks?|absent|removed|omits?|omitted|denied|refuses?|refused|strips?|stripped|nothing)\b/i;

// PS-DISPOSITION — a mood in place of a mechanism (§4). "Be critical" names a disposition and
// supplies no test the agent can fail. Where a file needs adversarial behaviour it must instead name
// the artifact it judges against and the condition under which it returns BLOCKED, which is
// PS-JUDGE-BLOCK-CONDITION. This is NOT a ban on strong language: reviewer.md:37 says "an agent that
// can edit what it reviews will review what it can edit" and that sentence explains a mechanism.
const DISPOSITION = [
  /\b(be|stay|remain|act) (critical|thorough|skeptical|sceptical|rigorous|honest|careful|objective|harsh|brutal|diligent|meticulous|paranoid|adversarial|ruthless|vigilant|aggressive)\b/i,
  /\b(think|dig|look) (deeply|hard|carefully)\b/i,
  /\byou are (a |an )?(world-class|senior|expert|seasoned|elite|10x)\b/i,
  /\bact as (a|an)\b/i,
  /\bdon'?t be (afraid|shy|gentle)\b/i,
  /\btake your time\b/i,
  /\b(make|be) sure to\b/i,
  /\bdo your best\b/i,
  /\bcarefully (review|consider|examine|check|read)\b/i,
  /\bpay (close )?attention\b/i,
  /\bhigh-quality\b/i,
  /\bworld-class\b/i,
];

// PS-PRIOR-BELIEF — the sharpest number in this repository (§3.1). Telling a reviewer the code is
// believed correct collapsed vulnerability detection from 97.2% to 3.6% on GPT-4o-mini and 68.4% to
// 8.5% on Claude 3.5 Haiku across 250 CVE patch pairs; redacting the framing recovered it to 94-100%
// (arXiv:2603.18740, accessed 2026-08-15, via MODEL-DIVERSITY.md:34-44). A 60-to-94-point swing from
// one clause. Until 2026-08-15 two of three adversarial verifiers in qa.js carried exactly this, and
// the gate's record at that point was 34 PASS and 0 BLOCK.
//
// Provenance is NOT prior belief: "this diff touches auth", "this is the third attempt" describe the
// artifact rather than its verdict, and stay.
const PRIOR_BELIEF = [
  /\b(is|was|are|were) (believed|assumed|presumed|known|thought) to be\b/i,
  /\bassume (the |this |it |that )?(finding|code|change|diff|work|patch|it|this) (is|was|to be)\b/i,
  /\b(likely|probably) (correct|fine|safe|valid|a false positive)\b/i,
  /\bknown-good\b/i,
  /\balready (been )?(reviewed|approved|vetted|verified|audited)\b/i,
  /\bhas (already )?passed (review|QA|the gate)\b/i,
  /\bthe (code|change|diff|work|patch) is (correct|fine|safe|secure|valid)\b/i,
  /\bdefault to is_real=false\b/i,
];

// PS-FALSE-CONSTRAINT — statements this repo has MEASURED false (§5.3). A false constraint is worse
// than a missing one: it is obeyed. Every entry carries the measurement that refuted it; an entry
// with no citation is someone's opinion wearing a rule's clothes. Adding to this list is part of
// retiring a claim — when a resolver refutes something the repo believed, the refuted sentence lands
// here in the same PR, and that is what stops the belief coming back.
const FALSE_CONSTRAINT = [
  // REFUTED BY: the nested-spawn fabrication. Subagents CAN spawn subagents; an entry prompt asserted
  // they cannot, and CLAUDE.md rule 9 exists because of it.
  /\bsubagents? can ?not spawn\b/i,
  /\bcan ?not spawn (a |an )?subagents?\b/i,
  /\bnested spawn(ing)? is (not|impossible|unsupported)\b/i,
  /\bthere is no way to spawn\b/i,
  /\bspawning is disabled\b/i,
  // REFUTED BY: qa.js naming `agentType` at all four dispatch sites. maxTurns BINDS when a dispatch
  // names an agentType and not otherwise; AGENT-ARCHITECTURE.md:56 still records the stale `NO`,
  // measured over a corpus in which no dispatch named an agent file (PROMPT-STANDARD.md §1.5).
  /\bmaxTurns (is|are) (not enforced|advisory|inert|ignored|not binding)\b/i,
  /\bmaxTurns does not bind\b/i,
  // REFUTED BY: the tool census. `tools:` SUBTRACTS but is not known to bind Bash — which is why
  // reviewer-readonly exists at all. The hedged, true sentence "tools: is not known to bind Bash"
  // (reviewer-readonly.md:46) must survive this list, and does: the pattern needs "binds" directly.
  /\btools:? binds Bash\b/i,
];

// The canonical order of the five leading sections. PS-SECTION-ORDER is a WARNING because it fires
// on 1 of 7 today: reviewer-readonly puts `## Pre-flight reads` before `## Workflow position` and
// inserts two sections explaining why the file exists at all. That is a better file, not a worse one.
// PS-SECTION-BOOKENDS is the part of the same idea that reaches zero, and it FAILS.
const CANONICAL_ORDER = [
  '## Identity & mission',
  '## Workflow position',
  '## Key distinctions',
  '## Pre-flight reads',
  '## Operating procedure',
];

// PS-PIPELINE-RESTATE needs the real stage ids, read from the playbooks rather than hard-coded —
// a second list of stage names would disagree with the first one silently.
let PLAYBOOK_STAGES = null;
function playbookStages() {
  if (PLAYBOOK_STAGES) return PLAYBOOK_STAGES;
  PLAYBOOK_STAGES = [];
  const dir = path.join(REPO_ROOT, '.claude', 'playbooks');
  try {
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.yml')).sort()) {
      const doc = parseYamlSubset(fs.readFileSync(path.join(dir, f), 'utf8'));
      const ids = (doc.stages || []).map((s) => s && s.id).filter((s) => typeof s === 'string');
      if (ids.length) PLAYBOOK_STAGES.push({ playbook: path.basename(f, '.yml'), ids: new Set(ids) });
    }
  } catch { /* no playbooks readable — the rule then finds nothing, and lintAllPlaybooks reports it */ }
  return PLAYBOOK_STAGES;
}

/** The markdown body — everything after the frontmatter block. */
function bodyOf(text) {
  const m = text.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? text.slice(m[0].length) : text;
}

/**
 * Normalise prose before a literal phrase list reads it.
 *
 * Two transforms, each earning its place: code-span and emphasis markers are dropped so
 * "`tools:` binds `Bash`" is reachable by a rule written in plain English, and newlines collapse to
 * spaces because these files hard-wrap at ~110 characters and a banned phrase straddles the wrap.
 */
function normaliseProse(s) {
  return s.replace(/[`*_]/g, '').replace(/\s+/g, ' ');
}

/**
 * The PS-* rules that PROMPT-STANDARD.md §6.1/§6.2 marks **new**.
 *
 * Called from lintFile AFTER the shim early-return (a shim holds no procedure and must never see
 * these) and AFTER `sections` is computed. Pushes blocking problems onto `issues`; returns the
 * number of warnings it added, having pushed their text onto `checks`.
 */
function lintPromptStandard(filePath, text, fm, sections, issues, checks) {
  let warnings = 0;
  const body = bodyOf(text);
  const bodyLines = body.split('\n');
  const paragraphs = body.split(/\n[ \t]*\n/);
  // §3.1 scopes every phrase rule to MODEL-REACHING TEXT: the frontmatter `description` and the
  // body. Never comments, and never this file — a rule about prior belief is not a prior belief,
  // exactly as the lens linter learned that a rule about TODOs is not a TODO.
  const modelReaching = normaliseProse(`${typeof fm.description === 'string' ? fm.description : ''}\n${body}`);

  // ── PS-FM-KEY-ALLOWLIST ──────────────────────────────────────────────────
  for (const k of Object.keys(fm)) {
    if (!KNOWN_FM_KEYS.includes(k)) {
      issues.push(
        `PS-FM-KEY-ALLOWLIST: frontmatter key "${k}" is not one the schema knows ` +
        `(${KNOWN_FM_KEYS.join(', ')}) — nothing reads it, so it grants nothing and will be read as a boundary`
      );
    }
  }

  // ── PS-TOOL-EXISTS ───────────────────────────────────────────────────────
  if (Array.isArray(fm.tools)) {
    for (const t of fm.tools) {
      if (String(t).startsWith('mcp__')) continue;
      if (!TOOL_UNIVERSE.includes(t)) {
        issues.push(`PS-TOOL-EXISTS: tools entry "${t}" is not a runtime tool (${TOOL_UNIVERSE.join(', ')})`);
      }
    }
  }

  // ── PS-SECTION-BOOKENDS ──────────────────────────────────────────────────
  if (sections.length > 0) {
    if (!sections[0].startsWith('## Identity & mission')) {
      issues.push(`PS-SECTION-BOOKENDS: first section is "${sections[0]}" — it must be "## Identity & mission"`);
    }
    const last = sections[sections.length - 1];
    if (!last.startsWith('## Anti-patterns')) {
      issues.push(`PS-SECTION-BOOKENDS: last section is "${last}" — it must be "## Anti-patterns"`);
    }
  }

  // ── PS-STEP-SHAPE ────────────────────────────────────────────────────────
  // §3.2: for agent files the enforceable residue of "instruction, not description" is structural
  // rather than grammatical. An `## Operating procedure` is `### Step N` headings.
  const stepHeadings = bodyLines.filter((l) => /^### Step \d+\b/.test(l));
  if (sections.some((s) => s.startsWith('## Operating procedure')) && stepHeadings.length === 0) {
    issues.push('PS-STEP-SHAPE: "## Operating procedure" contains no "### Step N" heading');
  }
  // NOT_AN_INSTRUCTION, scoped to the step heading TEXT only — never to body prose, which
  // legitimately opens paragraphs with "The tool list above is the mission" (reviewer.md:37).
  for (const h of stepHeadings) {
    const label = h.replace(/^### Step \d+\s*[—–-]?\s*/, '').trim();
    if (label && NOT_AN_INSTRUCTION.test(label)) {
      issues.push(`PS-STEP-SHAPE: step heading reads as description, not instruction — ${JSON.stringify(label)}`);
    }
    if (label && PLACEHOLDER.test(label)) {
      issues.push(`PS-STEP-SHAPE: step heading is a placeholder — ${JSON.stringify(label)}`);
    }
  }

  // ── PS-ANTIPATTERN-SHAPE ─────────────────────────────────────────────────
  const antiStart = bodyLines.findIndex((l) => /^## Anti-patterns\b/.test(l));
  const antiBullets = [];
  if (antiStart !== -1) {
    for (let i = antiStart + 1; i < bodyLines.length; i++) {
      if (/^## [^#]/.test(bodyLines[i])) break;
      // Top-level bullets only. A bullet that wraps continues on an indented line, and reviewer.md
      // has two of those; a rule that read continuation lines would fail correct files.
      if (/^- /.test(bodyLines[i])) antiBullets.push(bodyLines[i]);
    }
    for (const b of antiBullets) {
      if (!b.startsWith('- **DO NOT ')) {
        issues.push(`PS-ANTIPATTERN-SHAPE: bullet under "## Anti-patterns" must open "- **DO NOT " — ${JSON.stringify(b.slice(0, 60))}`);
      }
      if (PLACEHOLDER.test(b.replace(/^- \*\*DO NOT /, ''))) {
        issues.push(`PS-ANTIPATTERN-SHAPE: anti-pattern is a placeholder — ${JSON.stringify(b.slice(0, 60))}`);
      }
      if (NOT_AN_INSTRUCTION.test(b.replace(/^- \*\*DO NOT /, ''))) {
        issues.push(`PS-ANTIPATTERN-SHAPE: anti-pattern reads as description, not instruction — ${JSON.stringify(b.slice(0, 60))}`);
      }
    }
  }

  // ── PS-STATUS-FIELD · PS-RETURN-EXAMPLE-MATCHES ──────────────────────────
  // §1.5: `return_contract` does not bind. Nothing validates a return against it, and this is the
  // one guarantee a linter can give — that the file agrees with itself.
  const required = fm.return_contract && Array.isArray(fm.return_contract.required_fields)
    ? fm.return_contract.required_fields
    : null;
  if (fm.return_contract !== undefined) {
    if (!required) {
      issues.push('PS-STATUS-FIELD: return_contract must carry a required_fields list');
    } else if (!required.includes('status')) {
      issues.push(`PS-STATUS-FIELD: return_contract.required_fields does not include "status" (has: ${required.join(', ')})`);
    }
  }
  const rcIdx = bodyLines.findIndex((l) => /^## Return contract\b/.test(l));
  if (rcIdx !== -1 && required) {
    const rest = bodyLines.slice(rcIdx + 1);
    const end = rest.findIndex((l) => /^## [^#]/.test(l));
    const block = (end === -1 ? rest : rest.slice(0, end)).join('\n');
    const fence = block.match(/```json\n([\s\S]*?)```/);
    if (!fence) {
      issues.push('PS-RETURN-EXAMPLE-MATCHES: "## Return contract" carries no ```json example to check against required_fields');
    } else {
      let parsed = null;
      try { parsed = JSON.parse(fence[1]); } catch (e) {
        issues.push(`PS-RETURN-EXAMPLE-MATCHES: the json example under "## Return contract" does not parse — ${e.message}`);
      }
      if (parsed && (typeof parsed !== 'object' || Array.isArray(parsed))) {
        issues.push('PS-RETURN-EXAMPLE-MATCHES: the json example under "## Return contract" must be an object');
      } else if (parsed) {
        const have = Object.keys(parsed);
        const missing = required.filter((k) => !have.includes(k));
        const extra = have.filter((k) => !required.includes(k));
        if (missing.length || extra.length) {
          issues.push(
            `PS-RETURN-EXAMPLE-MATCHES: the json example does not carry exactly required_fields — ` +
            `${missing.length ? `missing [${missing.join(', ')}]` : ''}${missing.length && extra.length ? '; ' : ''}` +
            `${extra.length ? `extra [${extra.join(', ')}]` : ''}`
          );
        }
      }
    }
  }

  // ── PS-JUDGE-BLOCK-CONDITION ─────────────────────────────────────────────
  // §4: a file that needs adversarial behaviour may not ask for a mood. It must name the artifact it
  // judges against and the condition under which it returns BLOCKED. Checked on the read-only
  // engines, which is where a verdict binds a merge.
  if (READ_ONLY_ENGINES.includes(path.basename(filePath, '.md'))) {
    if (!/\bBLOCKED\b/.test(body) && !/per-lens verdict/i.test(body)) {
      issues.push(
        'PS-JUDGE-BLOCK-CONDITION: a read-only engine must name the condition under which it returns ' +
        'BLOCKED, or the per-lens verdict it returns instead. "Be critical" is not a mechanism'
      );
    }
  }

  // ── PS-DISPOSITION · PS-PRIOR-BELIEF · PS-FALSE-CONSTRAINT ───────────────
  const phraseRules = [
    ['PS-DISPOSITION', DISPOSITION, 'a disposition instruction — name the artifact judged against and the BLOCKED condition instead'],
    ['PS-PRIOR-BELIEF', PRIOR_BELIEF, 'a stated prior belief about the artifact under judgement — this is the 97.2% to 3.6% class (MODEL-DIVERSITY.md)'],
    ['PS-FALSE-CONSTRAINT', FALSE_CONSTRAINT, 'a statement this repo has MEASURED false — a false constraint is worse than a missing one, because it is obeyed'],
  ];
  for (const [id, patterns, why] of phraseRules) {
    for (const re of patterns) {
      const hit = modelReaching.match(re);
      if (hit) {
        const at = modelReaching.indexOf(hit[0]);
        issues.push(`${id}: ${why} — ${JSON.stringify(modelReaching.slice(Math.max(0, at - 30), at + hit[0].length + 30).trim())}`);
      }
    }
  }

  // ── PS-BODY-TOOL-AFFIRM ──────────────────────────────────────────────────
  const granted = new Set(Array.isArray(fm.tools) ? fm.tools : []);
  for (const para of paragraphs) {
    const flat = normaliseProse(para);
    if (TOOL_NEGATION_RE.test(flat)) continue;
    for (const sentence of flat.split(/(?<=[.!?])\s+/)) {
      if (!TOOL_DIRECTIVE_RE.test(sentence)) continue;
      // Re-read the ORIGINAL paragraph for code spans: normaliseProse strips the backticks that
      // distinguish a tool name from the ordinary English word "read".
      for (const m of para.matchAll(TOOL_MENTION_RE)) {
        const tool = m[1];
        if (granted.has(tool)) continue;
        if (!normaliseProse(para).includes(tool)) continue;
        if (!sentence.includes(tool)) continue;
        issues.push(
          `PS-BODY-TOOL-AFFIRM: the body directs use of \`${tool}\`, which frontmatter does not grant ` +
          `(tools: ${[...granted].join(', ') || 'none'}) — ${JSON.stringify(sentence.slice(0, 80))}`
        );
      }
    }
  }

  // ── PS-PIPELINE-RESTATE ──────────────────────────────────────────────────
  // §5.4: two descriptions of one thing disagree silently. Scoped tightly on purpose — the stage ids
  // are ordinary English (build, review, ship, frame, plan, design, model, judge, evidence, copy)
  // and any looser rule would fire on every file in the repo.
  bodyLines.forEach((line, n) => {
    const tokens = line.split(/→|->|,| then /).map((t) => {
      const clean = t.trim().replace(/^[`"'*[\](){}:]+|[`"'*[\](){}:.]+$/g, '').toLowerCase();
      // The token itself, or its LAST word: a chain's first element carries the lead-in prose
      // ("Your pipeline is frame"), and requiring whole-token equality would let a three-id chain
      // through on that alone. The last word is still an exact match against a stage id, so this
      // widens what counts as a link in the chain without loosening what counts as a stage.
      return clean.includes(' ') ? clean.slice(clean.lastIndexOf(' ') + 1) : clean;
    });
    for (const { playbook, ids } of playbookStages()) {
      const hits = tokens.filter((t) => ids.has(t));
      if (new Set(hits).size >= 3) {
        issues.push(
          `PS-PIPELINE-RESTATE: line ${n + 1} chains ${new Set(hits).size} stage ids of the "${playbook}" playbook ` +
          `(${[...new Set(hits)].join(', ')}) — point at the playbook, do not restate it`
        );
      }
    }
  });

  // ── Warnings (§6.2) — over open prose or an unavoidable judgement call ───
  //
  // PS-LENGTH-BAND. Descriptive, from the corpus: 113-149 observed across the seven. reviewer-readonly
  // is the longest BECAUSE it justifies its own existence, which is the right reason to be long — a
  // cap would delete the justification. `wc -l` convention: split('\n').length counts the trailing
  // newline as a line, so it reports one more than `wc -l` and the band is stated in `wc -l` terms.
  const wcLines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
  if (wcLines < 100 || wcLines > 175) {
    warnings++;
    checks.push(`PS-LENGTH-BAND: ${wcLines} lines, outside the observed band 100-175 (corpus: 113-149) — a signal to look, not a defect`);
  }
  if (stepHeadings.length && (stepHeadings.length < 4 || stepHeadings.length > 8)) {
    warnings++;
    checks.push(`PS-STEP-COUNT: ${stepHeadings.length} "### Step N" headings, outside 4-8 (corpus: 5-7)`);
  }
  if (antiBullets.length && (antiBullets.length < 4 || antiBullets.length > 8)) {
    warnings++;
    checks.push(`PS-ANTIPATTERN-COUNT: ${antiBullets.length} anti-patterns, outside 4-8 (corpus: 5-7)`);
  }
  // PS-SECTION-ORDER — WARN, and it fires on reviewer-readonly today, correctly and harmlessly.
  const seen = sections.filter((s) => CANONICAL_ORDER.some((c) => s.startsWith(c)))
    .map((s) => CANONICAL_ORDER.findIndex((c) => s.startsWith(c)));
  for (let i = 1; i < seen.length; i++) {
    if (seen[i] < seen[i - 1]) {
      warnings++;
      checks.push(`PS-SECTION-ORDER: "${CANONICAL_ORDER[seen[i]]}" appears after "${CANONICAL_ORDER[seen[i - 1]]}" — canonical order is ${CANONICAL_ORDER.join(' → ')}`);
      break;
    }
  }
  // PS-BODY-VAGUE — WARN, and it may never be anything else. §0 measured it at 6 of 7 files and 10
  // sites, every one of them correct prose. One warning per file listing the sites, because ten
  // separate warnings on one file is noise that trains people to skip the whole column.
  const vagueSites = [];
  bodyLines.forEach((l, n) => {
    if (VAGUE.test(l) && !ANCHOR.test(l)) vagueSites.push(n + 1);
  });
  if (vagueSites.length) {
    warnings++;
    checks.push(`PS-BODY-VAGUE: judgement words with no measurable anchor at line(s) ${vagueSites.join(', ')} — advisory only; this rule cannot tell a perception loop from a hand-wave`);
  }

  return warnings;
}

/**
 * checkEngineRoster — ENGINES against disk, in both directions.
 *
 * ENGINES is hand-maintained (and must be: the lens files are authored BEFORE the engine files
 * exist). A hand-maintained list drifts from disk silently, and this repository has the instance:
 * `framer` was cut in ROSTER-SIZE.md §7.6 and stayed an engine in this constant, so the linter and
 * the spec disagreed about what the roster is, with nothing to notice. The founder's decision of
 * 2026-08-16 keeps `framer`; this check is what makes any future disagreement fail a build rather
 * than sit there.
 *
 * `instrument` and `operator` are specified but do not exist yet. They join ENGINES in the PR that
 * creates their files — not before, or this check would demand files nobody wrote.
 *
 * The parameters exist so scripts/prompt-standard.test.mjs can construct drift in BOTH directions
 * against a temporary directory. Constructing the "ENGINES names a file that is absent" half by
 * deleting a real engine file from the repo tree is not a test, it is a hazard.
 */
function checkEngineRoster(agentsDir = AGENTS_DIR, engines = ENGINES) {
  const issues = [];
  let onDisk;
  try {
    onDisk = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  } catch (e) {
    return { rel: path.relative(REPO_ROOT, agentsDir), issues: [`${agentsDir}: unreadable — ${e.message}`], count: 0 };
  }
  const nonShim = onDisk.filter((f) => {
    try { return !/^\s*kind:\s*shim\s*$/m.test(fs.readFileSync(path.join(agentsDir, f), 'utf8')); } catch { return true; }
  }).map((f) => path.basename(f, '.md')).sort();

  for (const e of engines) {
    if (!nonShim.includes(e)) {
      issues.push(`ENGINES lists "${e}" but ${e}.md is absent from ${path.relative(REPO_ROOT, agentsDir) || agentsDir} or is a shim — the linter and disk disagree about the roster`);
    }
  }
  for (const f of nonShim) {
    if (!engines.includes(f)) {
      issues.push(`${f}.md is a non-shim agent that ENGINES does not list — add it to ENGINES or make it a shim`);
    }
  }
  return { rel: '.claude/agents (roster)', issues, count: nonShim.length, label: `${nonShim.length} engines, ENGINES matches disk` };
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
    for (const banned of ['tools', 'model', 'effort', 'maxTurns', 'skills']) {
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

  // PS-EFFORT-ENUM. Guarded for type before value, for the same reason maxTurns is below: a
  // field that arrives as an unexpected type must FAIL, never fall through the check.
  if (fm.effort !== undefined && fm.effort !== null) {
    if (typeof fm.effort !== 'string') {
      issues.push(`frontmatter: effort=${JSON.stringify(fm.effort)} is not a string — expected one of (${VALID_EFFORT.join('|')})`);
    } else if (!VALID_EFFORT.includes(fm.effort)) {
      issues.push(`frontmatter: effort="${fm.effort}" not in (${VALID_EFFORT.join('|')})`);
    }
  }

  // PS-MAXTURNS-RANGE.
  //
  // THE TYPE GUARD IS THE BUG FIX. This read `typeof fm.maxTurns === 'number' && (…)`, and
  // parseFrontmatter coerces to a number ONLY when the raw value matches /^-?\d+$/. So
  // `maxTurns: "30"` and `maxTurns: 30 # note` both arrive as STRINGS and skipped the range check
  // entirely — the guard meant to bound an error silently disabled it. A non-numeric value now
  // fails; it cannot be range-checked and must not be waved through.
  //
  // THE CEILING IS 120, RAISED FROM 30. At 30 the cap was setting the value rather than bounding
  // an error: every engine sat at or near the ceiling (30/30/30/30/30/25/25) while a measured
  // reviewer run needed 68 tool calls and 196 of 269 runs exceeded `maxTurns: 20`
  // (CONTROL-PLANE.md §3.1). The floor stays at 5. This changes no file's behaviour on its own —
  // engines keep declaring what they declare until a later PR tunes them.
  if (fm.maxTurns !== undefined && fm.maxTurns !== null) {
    if (typeof fm.maxTurns !== 'number') {
      issues.push(
        `frontmatter: maxTurns=${JSON.stringify(fm.maxTurns)} is not a number — quote it or trail it with a ` +
        `comment and it parses as a string, which used to skip the range check silently. Write a bare integer.`
      );
    } else if (fm.maxTurns < 5 || fm.maxTurns > 120) {
      issues.push(`frontmatter: maxTurns=${fm.maxTurns} outside range [5, 120]`);
    }
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
    } else if (fm.mcpServers.length > 0) {
      const configured = configuredMcpServers();
      if (configured.size === 0) {
        issues.push(
          `frontmatter: declares mcpServers [${fm.mcpServers.join(', ')}] but this repo has no MCP config ` +
          `(no .mcp.json, no mcpServers key in .claude/settings.json) — the declaration grants nothing. ` +
          `Configure MCP or delete the field.`
        );
      } else {
        // Per-SERVER, not merely per-repo. A declaration naming a server nobody configured is
        // the same decorative-capability failure the old boolean allowed back in wholesale.
        for (const want of fm.mcpServers) {
          if (!configured.has(want)) {
            issues.push(
              `frontmatter: declares mcpServer "${want}", which is not configured in .mcp.json or ` +
              `.claude/settings.json (configured: ${[...configured].sort().join(', ') || 'none'}) — ` +
              `the declaration grants nothing. Configure it or remove it.`
            );
          }
        }
      }
    }
  }

  // skills must be a list — verify each name resolves
  if (fm.skills !== undefined) {
    if (!Array.isArray(fm.skills)) {
      issues.push(`frontmatter: skills must be a YAML list`);
    } else {
      const live = loadSkills();
      if (!live) {
        warnings++;
      } else {
        for (const s of fm.skills) {
          if (!live.has(s)) issues.push(`frontmatter: skill "${s}" not in MANIFEST.json`);
        }
      // A skill carrying `allowed-tools` SUBTRACTS from the agent that loads it.
      //
      // The binary calls this "capability frontmatter" and describes it as "Tools available to
      // the model while this file is active" — a ceiling, not a grant. Attaching such a skill
      // therefore clamps the agent to that list for as long as the skill is active. Two of the
      // eight skills that declare it clamp to a single Bash pattern: `impeccable` to
      // `Bash(npx impeccable *)`, `pitch-deck-visuals` to `Bash(belt *)` — no Read, no Write,
      // no MCP. `impeccable` is the skill the roster spec assigns to `designer`, whose whole
      // purpose is a browser perception loop it would no longer be able to reach.
      //
      // No agent declares one today, so this rule costs nothing now and fires exactly when the
      // roster migration attaches them. Strip the field from the skill first; it does something.
      //
      // SCOPED TO KNOWN SKILL NAMES ON PURPOSE. The first cut of this loop ran over every
      // declared name before any of them had been checked against the manifest, so a name like
      // `../..` reached path.join + readFileSync — arbitrary file read, with the matched line
      // echoed back into the issue text and therefore into CI logs, in a linter CI runs on
      // every pull_request including forks. The binding QA gate caught it; it is pinned in
      // scripts/skill-clamp.test.mjs. An unknown name already emits its own "not in
      // MANIFEST.json" issue above and must never reach a disk read.
      for (const s of fm.skills) {
        if (!live.has(s)) continue;
        const clamp = skillToolClamp(s);
        if (clamp) {
          issues.push(
            `frontmatter: skill "${s}" declares allowed-tools (${clamp}), which SUBTRACTS from this agent's tools while active — ` +
            `strip the field from .claude/skills/${s}/SKILL.md before attaching it, or attach a different skill`
          );
        }
        }
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

  // The prompt standard. Placed here deliberately: after the shim early-return above, which shims
  // must never reach, and after `sections` exists, which three of the rules read.
  warnings += lintPromptStandard(filePath, text, fm, sections, issues, checks);

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
    checkEngineRoster(),
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
        process.stdout.write(`✓ ${r.rel} — ${r.label || (r.count !== undefined ? r.count + ' lenses' : r.stages + ' stages')}\n`);
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
module.exports = {
  lintLensFile, lintPlaybook, lintFile, knownReviewLenses, knownDomainLenses, ENGINES, GATES,
  // Exported for scripts/prompt-standard.test.mjs, which constructs a violation of every new PS-*
  // rule directly rather than round-tripping a whole fixture agent file through lintFile.
  lintPromptStandard, checkEngineRoster, parseFrontmatter, scanSections,
  VALID_MODELS, VALID_EFFORT, KNOWN_FM_KEYS, TOOL_UNIVERSE,
};

if (require.main === module) {
  try { main(); } catch (err) {
    process.stderr.write(`schema-lint: script error: ${err.message}\n`);
    process.exit(2);
  }
}
