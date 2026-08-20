// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:gate-record`.
//
// scripts/gate-record.test.mjs — tests for the QA gate verdict record pipeline.
//
// CONSTRUCT THE FAILURE FIRST.
// These tests exist specifically to prove that the failure cases fail.
// A test that only checks the happy path proves that the happy path is wired up;
// it says nothing about whether the detection actually detects.
//
// The three failures this system was built to catch:
//   A. qa_verdict: PASS in a session file but no gate record → BLOCKED (verified below)
//   B. Gate record from an earlier run / different HEAD → BLOCKED (verified below)
//   C. Gate ran, new commits pushed after it → diff hash mismatch → BLOCKED (verified below)
//
// The honest limit: an author who runs qa.js, records BLOCK, then hand-writes a PASS record
// with the correct diff_hash passes this check. The check is an improvement over the
// previous state (no check at all), not a cryptographic guarantee.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = path.join(REPO, 'scripts', 'write-gate-record.mjs');
const VERIFY = path.join(REPO, 'scripts', 'verify-gate-record.mjs');

function run(script, args = [], { stdin = '' } = {}) {
  try {
    const stdout = execFileSync('node', [script, ...args], {
      cwd: REPO,
      encoding: 'utf8',
      input: stdin,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return {
      code: e.status ?? 1,
      stdout: (e.stdout || '').toString(),
      stderr: (e.stderr || '').toString(),
    };
  }
}

function gitOut(...args) {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function headSha() {
  return gitOut('rev-parse', 'HEAD');
}

function baseSha() {
  try {
    return gitOut('merge-base', 'origin/main', 'HEAD');
  } catch {
    return gitOut('rev-parse', 'origin/main');
  }
}

const VALID_INPUT = () => JSON.stringify({
  verdict: 'PASS',
  tier: 'full',
  ref: 'origin/main...HEAD',
  dimensions_run: ['correctness', 'security', 'patterns', 'tests', 'perf'],
  dimensions_failed: [],
  confirmed: 0,
  advisory_count: 2,
});

// ── write-gate-record tests ─────────────────────────────────────────────────────────────────────

test('dry-run prints record without writing it', () => {
  const r = run(WRITE, ['--dry-run'], { stdin: VALID_INPUT() });
  assert.equal(r.code, 0, r.stderr);
  // Header line is [dry-run], JSON starts at line 2
  const jsonLine = r.stdout.split('\n').slice(1).join('\n').trim();
  const rec = JSON.parse(jsonLine);
  assert.equal(rec.verdict, 'PASS');
  assert.equal(rec.tier, 'full');
  assert.equal(rec.schema, 1, 'schema version must be present for forward compat');
  assert.ok(rec.diff_hash, 'diff_hash must be present');
  assert.ok(rec.head_sha, 'head_sha must be present');
  assert.ok(rec.base_sha, 'base_sha must be present');
  assert.ok(rec.timestamp, 'timestamp must be present');
});

test('BLOCK verdict is written as BLOCK — not silently flipped to PASS', () => {
  const input = JSON.stringify({ ...JSON.parse(VALID_INPUT()), verdict: 'BLOCK' });
  const r = run(WRITE, ['--dry-run'], { stdin: input });
  assert.equal(r.code, 0, r.stderr);
  const rec = JSON.parse(r.stdout.split('\n').slice(1).join('\n').trim());
  assert.equal(rec.verdict, 'BLOCK', 'A BLOCK gate must not silently become PASS in the record');
});

test('writes record to --out-dir keyed by HEAD SHA', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'qa-gate-write-'));
  const r = run(WRITE, ['--out-dir', tmpDir], { stdin: VALID_INPUT() });
  assert.equal(r.code, 0, r.stderr);
  const sha = headSha();
  const recordPath = path.join(tmpDir, `${sha}.json`);
  assert.ok(existsSync(recordPath), `record not written at ${recordPath}\nstdout: ${r.stdout}`);
  const rec = JSON.parse(readFileSync(recordPath, 'utf8'));
  assert.equal(rec.head_sha, sha, 'record head_sha must match HEAD');
  assert.equal(rec.verdict, 'PASS');
  assert.match(rec.diff_hash, /^[0-9a-f]{64}$/, 'diff_hash must be 64-char hex SHA-256');
});

test('diff_hash is stable — same diff, same hash on repeated calls', () => {
  const r1 = run(WRITE, ['--dry-run'], { stdin: VALID_INPUT() });
  const r2 = run(WRITE, ['--dry-run'], { stdin: VALID_INPUT() });
  assert.equal(r1.code, 0, r1.stderr);
  assert.equal(r2.code, 0, r2.stderr);
  const h1 = JSON.parse(r1.stdout.split('\n').slice(1).join('\n').trim()).diff_hash;
  const h2 = JSON.parse(r2.stdout.split('\n').slice(1).join('\n').trim()).diff_hash;
  assert.equal(h1, h2, 'diff_hash must be deterministic');
});

test('missing required field "verdict" exits 1 with a clear error', () => {
  const input = JSON.stringify({ tier: 'full', ref: 'origin/main...HEAD' });
  const r = run(WRITE, ['--dry-run'], { stdin: input });
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /missing required field.*verdict/i);
});

test('missing required field "tier" exits 1', () => {
  const input = JSON.stringify({ verdict: 'PASS', ref: 'origin/main...HEAD' });
  const r = run(WRITE, ['--dry-run'], { stdin: input });
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /missing required field.*tier/i);
});

test('missing required field "ref" exits 1', () => {
  const input = JSON.stringify({ verdict: 'PASS', tier: 'full' });
  const r = run(WRITE, ['--dry-run'], { stdin: input });
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /missing required field.*ref/i);
});

test('invalid JSON input exits 1', () => {
  const r = run(WRITE, ['--dry-run'], { stdin: 'not json at all' });
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /invalid JSON/i);
});

test('a ref beginning with "-" is refused — git reads it as an option', () => {
  const input = JSON.stringify({ verdict: 'PASS', tier: 'full', ref: '-Osome-git-option' });
  const r = run(WRITE, ['--dry-run'], { stdin: input });
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /refusing ref/i);
});

test('empty stdin exits 1 — a gate that produced nothing must not silently pass', () => {
  const r = run(WRITE, ['--dry-run'], { stdin: '' });
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /no input JSON/i);
});

// ── verify-gate-record tests — construct the failures ──────────────────────────────────────────

test('FAILURE A: full tier with no gate record exits 1 — the hand-written-verdict case', () => {
  // This is the defect: qa_verdict: PASS in a session file with no gate record.
  // Before this fix, that was the only check. Now it is not enough.
  const emptyDir = mkdtempSync(path.join(tmpdir(), 'qa-gate-empty-'));
  const r = run(VERIFY, ['--tier', 'full', '--head-sha', 'deadbeefcafe1234', '--record-dir', emptyDir]);
  assert.equal(r.code, 1, `expected exit 1 (BLOCKED), got ${r.code}\n${r.stdout}`);
  assert.match(r.stdout, /BLOCKED/);
  assert.match(r.stdout, /No QA gate record/);
});

test('FAILURE A: irreversible tier with no gate record also exits 1', () => {
  const emptyDir = mkdtempSync(path.join(tmpdir(), 'qa-gate-empty-'));
  const r = run(VERIFY, ['--tier', 'irreversible', '--head-sha', 'deadbeefcafe1234', '--record-dir', emptyDir]);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /BLOCKED/);
});

test('FAILURE B: inheriting a gate record from a different HEAD SHA exits 1 — stale record case', () => {
  // Record was written for commit A. PR is now at commit B. Record not found → BLOCKED.
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'qa-gate-stale-'));
  const differentSha = '0'.repeat(40);
  // Write a PASS record at the "old" SHA
  const record = {
    schema: 1, verdict: 'PASS', tier: 'full', ref: 'origin/main...HEAD',
    diff_hash: 'a'.repeat(64), base_sha: 'b'.repeat(40), head_sha: differentSha,
    dimensions_run: [], dimensions_failed: [], confirmed: 0, advisory_count: 0,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(path.join(tmpDir, `${differentSha}.json`), JSON.stringify(record));
  // Verify using the REAL HEAD — which has no record in tmpDir
  const realSha = headSha();
  const r = run(VERIFY, ['--tier', 'full', '--head-sha', realSha, '--record-dir', tmpDir]);
  assert.equal(r.code, 1, `expected exit 1 (BLOCKED), got ${r.code}\n${r.stdout}`);
  assert.match(r.stdout, /No QA gate record/, 'must say the record is missing, not just fail');
});

test('FAILURE C: gate record with a stale diff_hash exits 1 — commits pushed after gate ran', () => {
  // Gate ran at commit A, produced hash H. Commit B is pushed. New hash H2 ≠ H → BLOCKED.
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'qa-gate-stalehash-'));
  const sha = headSha();
  const bs = baseSha();
  const record = {
    schema: 1, verdict: 'PASS', tier: 'full', ref: 'origin/main...HEAD',
    diff_hash: '0'.repeat(64),  // deliberately wrong hash
    base_sha: bs, head_sha: sha,
    dimensions_run: ['correctness', 'security'], dimensions_failed: [], confirmed: 0, advisory_count: 0,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(path.join(tmpDir, `${sha}.json`), JSON.stringify(record));
  const r = run(VERIFY, ['--tier', 'full', '--head-sha', sha, '--record-dir', tmpDir]);
  assert.equal(r.code, 1, `expected exit 1 (diff hash mismatch), got ${r.code}\n${r.stdout}`);
  assert.match(r.stdout, /BLOCKED/);
  assert.match(r.stdout, /different diff/);
});

test('FAILURE: gate record with BLOCK verdict exits 1', () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'qa-gate-block-'));
  const sha = headSha();
  const bs = baseSha();
  // We need the real diff hash so the hash check passes and only the verdict check fires.
  const diffBuf = execFileSync('git', ['diff', bs, sha], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
  const realHash = createHash('sha256').update(diffBuf).digest('hex');
  const record = {
    schema: 1, verdict: 'BLOCK', tier: 'full', ref: 'origin/main...HEAD',
    diff_hash: realHash, base_sha: bs, head_sha: sha,
    dimensions_run: [], dimensions_failed: [], confirmed: 1, advisory_count: 0,
    timestamp: new Date().toISOString(),
  };
  writeFileSync(path.join(tmpDir, `${sha}.json`), JSON.stringify(record));
  const r = run(VERIFY, ['--tier', 'full', '--head-sha', sha, '--record-dir', tmpDir]);
  assert.equal(r.code, 1, `expected exit 1 (BLOCK verdict), got ${r.code}\n${r.stdout}`);
  assert.match(r.stdout, /verdict="BLOCK"/);
});

test('trivial tier skips gate record check and exits 0', () => {
  const r = run(VERIFY, ['--tier', 'trivial']);
  assert.equal(r.code, 0, r.stdout);
  assert.match(r.stdout, /does not require/);
});

test('lite tier skips gate record check and exits 0', () => {
  const r = run(VERIFY, ['--tier', 'lite']);
  assert.equal(r.code, 0, r.stdout);
  assert.match(r.stdout, /does not require/);
});

test('PASS: full tier with a real record and matching diff_hash passes', () => {
  // The happy path: write a genuine record, then verify it.
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'qa-gate-pass-'));
  const writeR = run(WRITE, ['--out-dir', tmpDir], { stdin: VALID_INPUT() });
  assert.equal(writeR.code, 0, writeR.stderr);
  const sha = headSha();
  const r = run(VERIFY, ['--tier', 'full', '--head-sha', sha, '--record-dir', tmpDir]);
  assert.equal(r.code, 0, `expected exit 0 (verified), got ${r.code}\n${r.stdout}`);
  assert.match(r.stdout, /Gate record verified/);
  assert.match(r.stdout, /verdict:\s+PASS/);
  assert.match(r.stdout, /\(matches\)/);
});

test('both GATE_REQUIRED_TIERS require a record; trivial and lite do not', () => {
  // Closes the set: all four tiers are exercised, nothing slips through unexamined.
  const emptyDir = mkdtempSync(path.join(tmpdir(), 'qa-gate-set-'));
  const fakeSha = 'f'.repeat(40);
  // full → blocked
  assert.equal(run(VERIFY, ['--tier', 'full', '--head-sha', fakeSha, '--record-dir', emptyDir]).code, 1);
  // irreversible → blocked
  assert.equal(run(VERIFY, ['--tier', 'irreversible', '--head-sha', fakeSha, '--record-dir', emptyDir]).code, 1);
  // trivial → exempt
  assert.equal(run(VERIFY, ['--tier', 'trivial']).code, 0);
  // lite → exempt
  assert.equal(run(VERIFY, ['--tier', 'lite']).code, 0);
});
