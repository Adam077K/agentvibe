#!/usr/bin/env node
// build/lint-jobs.mjs — lints build/jobs.yml, the Build Register (14-BUILD-PLAN.md §6).
//
// Not under scripts/: the register lint is itself a protected-base path once the harness
// self-builds (14-BUILD-PLAN.md §7: "this plan adds ... the register lint and build.yml
// themselves"), so it does not belong beside the harness's own irreversible-tier scripts.
//
// Refuses (exit 1, one line per finding):
//   - turns_est > 30 (hard cap, §6's own legend: "≤30 agent turns per job")
//   - a job with status: admitted and turns_est >= 26 (split trigger; warns only otherwise)
//   - a same-family referee (builder.family === referee.family, for single families only —
//     "both"/"either"/"other" are the legal cross-family forms named in §6's legend)
//   - a missing acceptance test, or an acceptance_hash that does not match the acceptance text
//   - a depends_on entry that does not resolve to a job id in this file (dangling dependency)
//   - a protected_base job with status: admitted and no founder_present: true
//   - a duplicate id
//   - a dependency cycle in depends_on
//
// Usage: node build/lint-jobs.mjs [path-to-jobs.yml]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = path.join(__dirname, 'jobs.yml');

const SINGLE_FAMILIES = new Set(['claude', 'codex']);
// The only family values §6's legend defines: Cl/Cx/s5/h resolve to claude or codex; "both"
// (both families build/referee jointly) and "either" (cast by prior accuracy post-Handover,
// paired with "other" in the plan's own "Either→other" row) are the named cross-family forms.
// Exact case only — a value outside this set, in any case, is refused rather than silently
// falling through the same-family check.
const ALLOWED_FAMILIES = new Set(['claude', 'codex', 'either', 'both']);

function jsonScalar(raw, fieldName, blockId) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${blockId || '(unknown)'}: could not parse ${fieldName} value ${raw}: ${e.message}`);
  }
}

/**
 * Parses a flow-array's inner content into entries. Handles BOTH the generator's quoted-JSON
 * form ("B1-01") and 14-BUILD-PLAN.md §6's own written form, which is unquoted
 * (depends_on: [B1-01, B1-02]) — a parser that only recognises quotes silently drops bare
 * tokens, which is how a dangling id like B9-99 written unquoted passed the dangling-dependency
 * check with zero errors: the check never saw it. Every comma-separated entry is captured,
 * quoted or bare, so nothing is silently dropped.
 */
function parseArrayEntries(inner) {
  const raw = inner.trim();
  if (!raw) return [];
  const parts = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"' && raw[i - 1] !== '\\') inQuotes = !inQuotes;
    if (c === ',' && !inQuotes) {
      parts.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim() !== '') parts.push(cur);
  return parts.map(part => {
    const t = part.trim();
    if (t.startsWith('"')) return JSON.parse(t);
    return t; // bare token, e.g. B1-01 — still captured, still checked against idSet
  });
}

function parseFamilyBlock(raw, blockId, roleName) {
  // raw is the inner content of {...}, e.g.:
  //   title: "Kernel Engineer", family: codex, model: "gpt-6-astra"
  //   family: both, models: ["gpt-6-astra", "claude-opus-5"]
  const result = {};
  const titleMatch = raw.match(/title: (".*?")/);
  if (titleMatch) result.title = jsonScalar(titleMatch[1], `${roleName}.title`, blockId);
  const familyMatch = raw.match(/family: (\w+)/);
  if (!familyMatch) throw new Error(`${blockId}: ${roleName} has no family`);
  const rawFamily = familyMatch[1];
  if (!ALLOWED_FAMILIES.has(rawFamily)) {
    throw new Error(`${blockId}: ${roleName}.family "${rawFamily}" is not one of claude|codex|either|both (exact case)`);
  }
  result.family = rawFamily;
  const modelMatch = raw.match(/model: (".*?")/);
  if (modelMatch) result.model = jsonScalar(modelMatch[1], `${roleName}.model`, blockId);
  const modelsMatch = raw.match(/models: \[(.*?)\]/);
  if (modelsMatch) result.models = parseArrayEntries(modelsMatch[1]);
  if (!result.model && !result.models) {
    throw new Error(`${blockId}: ${roleName} has neither model nor models`);
  }
  return result;
}

/**
 * Parses build/jobs.yml's specific flat-list shape. Not a general YAML parser —
 * this file is generator-produced (see the header comment in jobs.yml) with one
 * controlled shape per field, and a general parser is not needed for it.
 */
export function parseJobsFile(content) {
  const jobs = [];
  const parseErrors = [];

  const lines = content.split('\n');
  const blockStarts = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^- id: /.test(lines[i])) blockStarts.push(i);
  }

  for (let bi = 0; bi < blockStarts.length; bi++) {
    const start = blockStarts[bi];
    const end = bi + 1 < blockStarts.length ? blockStarts[bi + 1] : lines.length;
    const block = lines.slice(start, end).join('\n');
    const idMatch = block.match(/^- id: (\S+)/);
    const id = idMatch ? idMatch[1] : `(row ${bi + 1}, no id)`;

    try {
      const job = { id };

      const titleMatch = block.match(/^ {2}title: (".*")$/m);
      job.title = titleMatch ? jsonScalar(titleMatch[1], 'title', id) : undefined;

      const phaseMatch = block.match(/^ {2}phase: (\S+)/m);
      job.phase = phaseMatch ? phaseMatch[1] : undefined;

      const laneMatch = block.match(/^ {2}lane: (\S+)/m);
      job.lane = laneMatch ? laneMatch[1] : undefined;

      const pbMatch = block.match(/^ {2}protected_base: (true|false)/m);
      job.protected_base = pbMatch ? pbMatch[1] === 'true' : false;

      const critMatch = block.match(/^ {2}critical: (true|false)/m);
      job.critical = critMatch ? critMatch[1] === 'true' : false;

      const dependsMatch = block.match(/^ {2}depends_on: \[(.*)\]$/m);
      job.depends_on = dependsMatch ? parseArrayEntries(dependsMatch[1]) : [];

      const founderMatch = block.match(/^ {2}founder_deps: \[(.*)\]$/m);
      job.founder_deps = founderMatch ? parseArrayEntries(founderMatch[1]) : [];

      const gateMatch = block.match(/^ {2}gate_deps: \[(.*)\]$/m);
      job.gate_deps = gateMatch ? parseArrayEntries(gateMatch[1]) : [];

      const builderMatch = block.match(/^ {2}builder: \{(.*)\}$/m);
      if (!builderMatch) throw new Error(`${id}: missing builder`);
      job.builder = parseFamilyBlock(builderMatch[1], id, 'builder');

      const refereeMatch = block.match(/^ {2}referee: \{(.*)\}$/m);
      if (!refereeMatch) throw new Error(`${id}: missing referee`);
      job.referee = parseFamilyBlock(refereeMatch[1], id, 'referee');

      const turnsMatch = block.match(/^ {2}turns_est: (\d+)/m);
      job.turns_est = turnsMatch ? Number(turnsMatch[1]) : undefined;

      const whMatch = block.match(/^ {2}window_hours_est: ([\d.]+)/m);
      job.window_hours_est = whMatch ? Number(whMatch[1]) : undefined;

      const statusMatch = block.match(/^ {2}status: (\S+)/m);
      job.status = statusMatch ? statusMatch[1] : undefined;

      const fpMatch = block.match(/^ {2}founder_present: (true|false)/m);
      job.founder_present = fpMatch ? fpMatch[1] === 'true' : undefined;

      const acceptanceMatch = block.match(/^ {2}acceptance: (".*")$/m);
      job.acceptance = acceptanceMatch ? jsonScalar(acceptanceMatch[1], 'acceptance', id) : undefined;

      const hashMatch = block.match(/^ {2}acceptance_hash: (".*")$/m);
      job.acceptance_hash = hashMatch ? jsonScalar(hashMatch[1], 'acceptance_hash', id) : undefined;

      jobs.push(job);
    } catch (e) {
      parseErrors.push(e.message);
    }
  }

  return { jobs, parseErrors };
}

function sha256(s) {
  return 'sha256:' + crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

/**
 * Lints already-parsed jobs. Returns { errors: string[], warnings: string[] }.
 * Pure function — no filesystem or process access — so tests can exercise every rule
 * against a small fixture array without writing a file.
 */
export function lintJobs(jobs) {
  const errors = [];
  const warnings = [];

  const seen = new Map();
  for (const j of jobs) {
    seen.set(j.id, (seen.get(j.id) || 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) errors.push(`duplicate id: ${id} appears ${count} times`);
  }

  const idSet = new Set(jobs.map(j => j.id));

  for (const j of jobs) {
    if (typeof j.turns_est !== 'number' || Number.isNaN(j.turns_est)) {
      errors.push(`${j.id}: missing or invalid turns_est`);
    } else if (j.turns_est > 30) {
      errors.push(`${j.id}: turns_est ${j.turns_est} exceeds the 30-turn cap`);
    } else if (j.turns_est >= 26) {
      if (j.status === 'admitted') {
        errors.push(`${j.id}: turns_est ${j.turns_est} >= 26 on an admitted job — split before admission`);
      } else {
        warnings.push(`${j.id}: turns_est ${j.turns_est} >= 26 (split trigger once admitted; currently ${j.status || 'not_started'})`);
      }
    }

    // Compared normalised (trim + lowercase) so a family value that is already invalid on its
    // own terms (caught above, at parse time) can never ALSO slip past this check on a case
    // technicality — the two checks are independent defences, not one relying on the other.
    const bFamily = (j.builder && j.builder.family || '').trim().toLowerCase();
    const rFamily = (j.referee && j.referee.family || '').trim().toLowerCase();
    if (SINGLE_FAMILIES.has(bFamily) && bFamily === rFamily) {
      errors.push(`${j.id}: same-family referee (builder ${bFamily}, referee ${rFamily})`);
    }

    if (!j.acceptance || !j.acceptance.trim()) {
      errors.push(`${j.id}: missing acceptance test`);
    } else {
      const expectedHash = sha256(j.acceptance);
      if (j.acceptance_hash !== expectedHash) {
        errors.push(`${j.id}: acceptance_hash does not match acceptance text (expected ${expectedHash}, got ${j.acceptance_hash || '(none)'})`);
      }
    }

    for (const dep of j.depends_on || []) {
      if (!idSet.has(dep)) {
        errors.push(`${j.id}: dangling depends_on "${dep}" (no such job)`);
      }
    }

    if (j.protected_base && j.status === 'admitted' && j.founder_present !== true) {
      errors.push(`${j.id}: protected_base job admitted without founder_present: true`);
    }
  }

  const graph = new Map();
  for (const j of jobs) graph.set(j.id, (j.depends_on || []).filter(d => idSet.has(d)));
  const GRAY = 1, BLACK = 2;
  const color = new Map();
  const cyclesReported = new Set();

  function dfs(node, stack) {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of graph.get(node) || []) {
      if (color.get(next) === GRAY) {
        const cycleStart = stack.indexOf(next);
        const cycle = [...stack.slice(cycleStart), next].join(' -> ');
        if (!cyclesReported.has(cycle)) {
          cyclesReported.add(cycle);
          errors.push(`dependency cycle: ${cycle}`);
        }
      } else if (color.get(next) !== BLACK) {
        dfs(next, stack);
      }
    }
    stack.pop();
    color.set(node, BLACK);
  }

  for (const j of jobs) {
    if (color.get(j.id) === undefined) dfs(j.id, []);
  }

  return { errors, warnings };
}

function main() {
  const filePath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_PATH;
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: no such file: ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const { jobs, parseErrors } = parseJobsFile(content);

  for (const e of parseErrors) console.error(`ERROR: ${e}`);

  const { errors, warnings } = lintJobs(jobs);

  for (const w of warnings) console.warn(`WARN: ${w}`);
  for (const e of errors) console.error(`ERROR: ${e}`);

  const perPhase = {};
  for (const j of jobs) perPhase[j.phase] = (perPhase[j.phase] || 0) + 1;
  console.log(`build/jobs.yml: ${jobs.length} jobs, per phase: ${JSON.stringify(perPhase)}`);
  console.log(`${errors.length + parseErrors.length} errors, ${warnings.length} warnings`);

  if (parseErrors.length > 0 || errors.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
