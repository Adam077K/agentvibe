#!/usr/bin/env node
// Verifies that a QA gate record exists for the current HEAD, the diff_hash in the record
// matches the PR's actual diff, and the verdict is PASS.
//
// Called by .github/workflows/qa-lead-pass.yml for full/irreversible tier PRs.
// Trivial and lite tiers skip this check (no adversarial panel, no record expected).
//
// THE VERIFICATION LOGIC, STATED PLAINLY:
//   1. Determine the risk tier from the actual diff via scripts/lib/classifier.js.
//   2. For full + irreversible only: look up .qa-gate/<head_sha>.json.
//   3. Verify the record's diff_hash matches sha256(git diff base_sha head_sha).
//   4. Verify the record's verdict is PASS.
//
// A hand-written record with a correct diff_hash still passes — this does not make
// the verdict unforgeable. What it catches:
//   · A session file with qa_verdict: PASS but no gate record at all (BLOCKED).
//   · A gate record from a previous commit (different head_sha, record not found, BLOCKED).
//   · A gate record from before new commits were pushed (diff changed, hash mismatch, BLOCKED).
//
// Exit codes:
//   0  — verified, or tier exempt
//   1  — blocked (missing record, stale hash, non-PASS verdict)
//   2  — usage error or environment problem (cannot decide)
//
// Usage:
//   node scripts/verify-gate-record.mjs
//   node scripts/verify-gate-record.mjs --tier full        # override tier (skips auto-detect)
//   node scripts/verify-gate-record.mjs --head-sha <sha>   # override HEAD SHA (for tests)
//   node scripts/verify-gate-record.mjs --base-sha <sha>   # override base SHA (for tests)
//   node scripts/verify-gate-record.mjs --record-dir <dir> # override .qa-gate/ dir (for tests)

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const DEFAULT_RECORD_DIR = path.join(REPO_ROOT, '.qa-gate');
const MAP = path.join(REPO_ROOT, '.claude', 'qa-tier-floor.yml');

// Tiers that require an adversarial gate record. Trivial and lite use different pipelines.
// Mirrors GATE_REQUIRED_TIERS in scripts/run-gate.mjs — kept in sync, not shared, because
// these are the two files that define the gate boundary.
const GATE_REQUIRED_TIERS = new Set(['full', 'irreversible']);

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : null;
}

function gitOut(...args) {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function computeDiffHash(baseSha, headSha) {
  const diffBuf = execFileSync('git', ['diff', baseSha, headSha], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return createHash('sha256').update(diffBuf).digest('hex');
}

function detectTier() {
  const { loadRules, classifyFiles } = require('./lib/classifier.js');
  let rules;
  try {
    rules = loadRules(MAP);
  } catch (e) {
    console.error(`verify-gate-record: could not load tier map at ${MAP}: ${e.message}`);
    process.exit(2);
  }

  let files;
  try {
    const out = execFileSync('git', ['diff', '--name-only', 'origin/main...HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    files = out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    console.error(`verify-gate-record: could not compute changed file list: ${e.message}`);
    process.exit(2);
  }

  if (!files.length) return 'trivial';
  return classifyFiles(files, rules).floor.tier;
}

function main() {
  const tierOverride = argValue('--tier');
  const headShaOverride = argValue('--head-sha');
  const baseShaOverride = argValue('--base-sha');
  const recordDir = argValue('--record-dir') || DEFAULT_RECORD_DIR;

  const tier = tierOverride || detectTier();
  console.log(`verify-gate-record: tier=${tier}`);

  if (!GATE_REQUIRED_TIERS.has(tier)) {
    console.log(`  Tier "${tier}" does not require a gate record — skipping.`);
    console.log('  (CI and the session-file check still apply at this tier.)');
    process.exit(0);
  }

  const headSha = headShaOverride || gitOut('rev-parse', 'HEAD');
  console.log(`  head_sha: ${headSha}`);

  const recordPath = path.join(recordDir, `${headSha}.json`);
  const relPath = path.relative(REPO_ROOT, recordPath);

  if (!existsSync(recordPath)) {
    console.log('');
    console.log('BLOCKED: No QA gate record found for this diff.');
    console.log(`  Expected: ${relPath}`);
    console.log('');
    console.log(`  The binding QA gate (qa.js) must run for "${tier}" tier changes.`);
    console.log('  Instructions:');
    console.log('    1. node scripts/run-gate.mjs   (prints the qa.js invocation)');
    console.log('    2. Run qa.js via the Workflow tool with the printed args');
    console.log('    3. qa.js writes .qa-gate/ automatically — commit it with your PR');
    console.log('');
    console.log('  A hand-written qa_verdict: PASS in a session file is no longer');
    console.log(`  sufficient for "${tier}" tier — that was the defect this step fixes.`);
    process.exit(1);
  }

  let record;
  try {
    record = JSON.parse(readFileSync(recordPath, 'utf8'));
  } catch (e) {
    console.log(`BLOCKED: Gate record at ${relPath} is not valid JSON: ${e.message}`);
    process.exit(1);
  }

  if (record.verdict !== 'PASS') {
    console.log('');
    console.log(`BLOCKED: Gate record shows verdict="${record.verdict}" (not PASS).`);
    console.log(`  Record: ${relPath}`);
    console.log(`  Summary: ${record.summary || '(no summary)'}`);
    console.log('  Re-run the gate and address all blockers before merging.');
    process.exit(1);
  }

  const baseSha = baseShaOverride || record.base_sha;
  if (!baseSha) {
    console.log(`BLOCKED: Gate record at ${relPath} is missing base_sha.`);
    console.log('  Re-run qa.js to produce a complete record.');
    process.exit(1);
  }
  if (!record.diff_hash) {
    console.log(`BLOCKED: Gate record at ${relPath} is missing diff_hash.`);
    console.log('  Re-run qa.js to produce a complete record.');
    process.exit(1);
  }

  let currentHash;
  try {
    currentHash = computeDiffHash(baseSha, headSha);
  } catch (e) {
    console.error(`verify-gate-record: could not compute current diff hash: ${e.message}`);
    process.exit(2);
  }

  if (currentHash !== record.diff_hash) {
    console.log('');
    console.log('BLOCKED: The gate record was produced for a different diff than the current PR.');
    console.log(`  Record diff_hash:  ${record.diff_hash}`);
    console.log(`  Current diff_hash: ${currentHash}`);
    console.log('');
    console.log('  This happens when:');
    console.log('    · Commits were added to the branch after the gate ran');
    console.log('    · The PR was rebased after the gate ran');
    console.log('  Fix: re-run qa.js against the current diff, then commit .qa-gate/');
    process.exit(1);
  }

  console.log('');
  console.log('Gate record verified:');
  console.log(`  verdict:   ${record.verdict}`);
  console.log(`  tier:      ${record.tier}`);
  console.log(`  diff_hash: ${currentHash} (matches)`);
  console.log(`  record:    ${relPath}`);
  if (record.dimensions_failed && record.dimensions_failed.length) {
    console.log(`  NOTE: ${record.dimensions_failed.length} dimension(s) failed to review: ${record.dimensions_failed.join(', ')}`);
  }
  process.exit(0);
}

main();
