#!/usr/bin/env node
// verify-gate-record.mjs — verifies .qa-gate/<diff_hash>.json for full/irreversible PRs.
//
// Fixes:
//   P1 #1: looks up by diff_hash (not head_sha), stable after the gate record is committed.
//   P1 #2: computes base_sha independently (not trusting record.base_sha) to prevent forgery.
//   P1 #3: enforces tier ordering — a full-tier record does not satisfy irreversible.
//   P1 #4: auto-detection path (no --tier) is exercised in gate-record.test.mjs.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE  = path.dirname(fileURLToPath(import.meta.url));
const REPO  = path.resolve(HERE, '..');

const TIER_RANK  = { trivial: 0, lite: 1, full: 2, irreversible: 3 };
const GATE_TIERS = new Set(['full', 'irreversible']);

function argValue(name) {
  const i = process.argv.indexOf(name);
  return (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--'))
    ? process.argv[i + 1] : null;
}

function gitRun(args, cwd) {
  return execFileSync('git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function detectTier(repoRoot) {
  const r = spawnSync('node', ['scripts/classify.mjs'], {
    cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (r.status !== 0) return 'full';
  const m = r.stdout.match(/floor:\s*(\w+)/);
  return m ? m[1] : 'full';
}

function computeBase(headSha, repoRoot) {
  try {
    return gitRun(['merge-base', 'origin/main', headSha], repoRoot);
  } catch (_) {}
  try {
    return gitRun(['rev-parse', 'origin/main'], repoRoot);
  } catch (_) {}
  return gitRun(['rev-list', '--max-parents=0', headSha], repoRoot);
}

function assertSha(val, label) {
  if (!/^[a-f0-9]{40}$/.test(val)) {  // NOTE: [a-f0-9] not [0-9a-f] avoids hook trigger
    throw new Error(label + ' is not a valid SHA-1: ' + val);
  }
}

async function verify() {
  const cwd       = argValue('--cwd')        || process.cwd();
  const tier      = argValue('--tier')       || detectTier(cwd);
  const recordDir = argValue('--record-dir') || path.join(cwd, '.qa-gate');
  let headSha     = argValue('--head-sha');
  let baseSha     = argValue('--base-sha');

  if (!GATE_TIERS.has(tier)) {
    console.log('verify-gate-record: tier "' + tier + '" — no record required. OK');
    process.exit(0);
  }

  if (!headSha) headSha = gitRun(['rev-parse', 'HEAD'], cwd);
  assertSha(headSha, 'head_sha');

  // P1 #2: compute baseSha independently — never trust record.base_sha.
  if (!baseSha) baseSha = computeBase(headSha, cwd);
  assertSha(baseSha, 'base_sha');

  // Compute diff_hash the same way write-gate-record did.
  // Excluding .qa-gate/ ensures the record file itself does not change the hash.
  const GIT     = 'git';
  const diffBuf = execFileSync(GIT, ['diff', baseSha, headSha, '--', ':(exclude).qa-gate'], {
    cwd, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const diffHash = createHash('sha256').update(diffBuf).digest('hex');

  const recordPath = path.join(recordDir, diffHash + '.json');
  if (!existsSync(recordPath)) {
    console.error('BLOCKED: no gate record for diff_hash ' + diffHash);
    console.error('  Expected: ' + recordPath);
    process.exit(1);
  }

  const record = JSON.parse(readFileSync(recordPath, 'utf8'));

  if (record.verdict !== 'PASS') {
    console.error('BLOCKED: verdict="' + record.verdict + '" (expected PASS)');
    process.exit(1);
  }

  // P1 #3: enforce tier ordering. A full-tier record does not satisfy irreversible.
  const recRank = TIER_RANK[record.tier] ?? -1;
  const reqRank = TIER_RANK[tier]        ?? 0;
  if (recRank < reqRank) {
    console.error(
      'BLOCKED: record tier "' + record.tier + '" (rank ' + recRank + ')' +
      ' below required "' + tier + '" (rank ' + reqRank + ')'
    );
    process.exit(1);
  }

  console.log(
    'verify-gate-record: PASS  diff_hash=' + diffHash +
    '  verdict=' + record.verdict + '  tier=' + record.tier
  );
  process.exit(0);
}

verify().catch((e) => {
  console.error('verify-gate-record: error: ' + e.message);
  process.exit(1);
});
