// gate-record.test.mjs — integration tests for write-gate-record + verify-gate-record.
//
// CRITICAL: Tests create real git repos and commit. This catches P1 #1 (head_sha vs
// diff_hash): a test that never commits cannot reveal that committing a gate record
// changes HEAD, breaking any scheme keyed by head_sha.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE  = path.dirname(fileURLToPath(import.meta.url));
const WRITE = path.join(HERE, 'write-gate-record.mjs');
const VFIY  = path.join(HERE, 'verify-gate-record.mjs');

function gx(args, cwd) {
  return execFileSync('git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function makeRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'gate-test-'));
  gx(['init'], dir);
  gx(['config', 'user.email', 'test@local'], dir);
  gx(['config', 'user.name', 'Tester'], dir);
  writeFileSync(path.join(dir, 'README.md'), 'base\n');
  gx(['add', '.'], dir);
  gx(['commit', '-m', 'initial'], dir);
  const baseSha = gx(['rev-parse', 'HEAD'], dir);

  writeFileSync(path.join(dir, 'feature.ts'), 'export const x = 1;\n');
  gx(['add', '.'], dir);
  gx(['commit', '-m', 'feat: add feature'], dir);
  const headSha = gx(['rev-parse', 'HEAD'], dir);

  return { dir, baseSha, headSha };
}

const VALID_STDIN = (tier = 'full') => JSON.stringify({
  verdict: 'PASS', tier,
  ref: 'origin/main...HEAD',
  dimensions_run: ['correctness', 'security'],
  dimensions_failed: [],
  confirmed: 0, advisory_count: 0,
});

function runWrite(args, stdin = '') {
  const r = spawnSync(process.execPath, [WRITE, ...args], {
    input: stdin, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
  });
  return { code: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function runVerify(args) {
  const r = spawnSync(process.execPath, [VFIY, ...args], {
    encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
  });
  return { code: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

describe('write-gate-record', () => {
  test('writes a .json record keyed by diff_hash', () => {
    const { dir, baseSha, headSha } = makeRepo();
    const gateDir = path.join(dir, '.qa-gate');
    const out = runWrite(
      ['--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha, '--out-dir', gateDir],
      VALID_STDIN()
    );
    assert.equal(out.code, 0, 'exit 0\n' + out.stderr);
    const files = readdirSync(gateDir).filter(f => f.endsWith('.json'));
    assert.equal(files.length, 1, 'one record written');
    assert.match(files[0], /^[a-f0-9]{64}\.json$/, 'filename is sha256 hex');
  });

  test('dry-run writes nothing', () => {
    const { dir, baseSha, headSha } = makeRepo();
    const out = runWrite(
      ['--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha, '--dry-run'],
      VALID_STDIN()
    );
    assert.equal(out.code, 0, out.stderr);
    assert.ok(!existsSync(path.join(dir, '.qa-gate')), 'no .qa-gate dir in dry-run');
  });

  test('rejects non-PASS verdict', () => {
    const { dir, baseSha, headSha } = makeRepo();
    const out = runWrite(
      ['--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha],
      JSON.stringify({
        verdict: 'FAIL', tier: 'full', ref: 'x',
        dimensions_run: [], dimensions_failed: ['correctness'],
        confirmed: 0, advisory_count: 0,
      })
    );
    assert.notEqual(out.code, 0, 'should fail for FAIL verdict');
  });

  test('rejects malformed SHA', () => {
    const out = runWrite(
      ['--cwd', '/tmp', '--base-sha', 'not-a-sha', '--head-sha', 'also-not'],
      VALID_STDIN()
    );
    assert.notEqual(out.code, 0, 'should fail for bad SHA');
  });
});

describe('verify-gate-record', () => {
  test('PASS: record present and tier matches', () => {
    const { dir, baseSha, headSha } = makeRepo();
    const gateDir = path.join(dir, '.qa-gate');
    runWrite(
      ['--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha, '--out-dir', gateDir],
      VALID_STDIN()
    );
    const out = runVerify([
      '--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha,
      '--tier', 'full', '--record-dir', gateDir,
    ]);
    assert.equal(out.code, 0, 'should verify OK\n' + out.stderr);
    assert.ok(out.stdout.includes('PASS'), 'stdout contains PASS');
  });

  test('CRITICAL (P1 #1): verify still works AFTER committing the gate record', () => {
    // PR #77 keyed by head_sha. Committing .qa-gate/<sha>.json changes HEAD,
    // so the filename based on head_sha can never be found afterwards.
    // Keying by diff_hash is stable: the diff excluding .qa-gate does not change.
    const { dir, baseSha, headSha } = makeRepo();
    const gateDir = path.join(dir, '.qa-gate');

    runWrite(
      ['--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha, '--out-dir', gateDir],
      VALID_STDIN()
    );

    // Commit the gate record — this is what qa-lead-pass.yml does before verifying.
    gx(['add', '.qa-gate'], dir);
    gx(['commit', '-m', 'qa: gate record'], dir);
    const afterCommit = gx(['rev-parse', 'HEAD'], dir);

    // Verify using the new HEAD sha — diff excluding .qa-gate is unchanged.
    const out = runVerify([
      '--cwd', dir, '--base-sha', baseSha, '--head-sha', afterCommit,
      '--tier', 'full', '--record-dir', gateDir,
    ]);
    assert.equal(out.code, 0, 'verify must pass AFTER committing gate record\n' + out.stderr);
  });

  test('BLOCKED when no gate record exists', () => {
    const { dir, baseSha, headSha } = makeRepo();
    const out = runVerify([
      '--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha,
      '--tier', 'full', '--record-dir', path.join(dir, '.qa-gate'),
    ]);
    assert.notEqual(out.code, 0, 'should block');
    assert.ok(out.stderr.includes('BLOCKED'), 'stderr says BLOCKED');
  });

  test('P1 #3: full-tier record does NOT satisfy irreversible requirement', () => {
    const { dir, baseSha, headSha } = makeRepo();
    const gateDir = path.join(dir, '.qa-gate');
    runWrite(
      ['--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha, '--out-dir', gateDir],
      VALID_STDIN('full')
    );
    const out = runVerify([
      '--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha,
      '--tier', 'irreversible', '--record-dir', gateDir,
    ]);
    assert.notEqual(out.code, 0, 'full record must not satisfy irreversible');
    assert.ok(out.stderr.includes('BLOCKED'), 'stderr says BLOCKED');
  });

  test('trivial tier skips without error', () => {
    const out = runVerify(['--tier', 'trivial', '--cwd', '/tmp']);
    assert.equal(out.code, 0, 'trivial should skip');
    assert.ok(out.stdout.includes('no record required'), 'skip message');
  });

  test('irreversible-tier record satisfies full requirement', () => {
    const { dir, baseSha, headSha } = makeRepo();
    const gateDir = path.join(dir, '.qa-gate');
    runWrite(
      ['--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha, '--out-dir', gateDir],
      VALID_STDIN('irreversible')
    );
    const out = runVerify([
      '--cwd', dir, '--base-sha', baseSha, '--head-sha', headSha,
      '--tier', 'full', '--record-dir', gateDir,
    ]);
    assert.equal(out.code, 0, 'irreversible record should satisfy full\n' + out.stderr);
  });
});
