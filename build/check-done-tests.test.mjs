// build/check-done-tests.test.mjs — tests for build/check-done-tests.mjs, through the CLI so the
// exit code is what is asserted: 0 clean · 1 finding · 2 could not check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CHECKER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-done-tests.mjs');
const BODY = 'package x\n';
const SHA = crypto.createHash('sha256').update(BODY).digest('hex');

function fixture({ sha = SHA, writeFile = true, extra = '' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'donetests-'));
  if (writeFile) {
    fs.mkdirSync(path.join(root, 'k'), { recursive: true });
    fs.writeFileSync(path.join(root, 'k', 'x_test.go'), BODY);
  }
  const reg = path.join(root, 'R.yml');
  fs.writeFileSync(
    reg,
    `# comment\nregister: R\njobs:\n  - id: J-01\n${extra}    files:\n      - path: k/x_test.go\n        sha256: ${sha}\n`,
  );
  return { root, reg };
}

function check({ root, reg }) {
  return spawnSync(process.execPath, [CHECKER, '--root', root, reg], { encoding: 'utf8' });
}

test('clean register exits 0', () => {
  const r = check(fixture());
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1 file hash\(es\) across 1 register\(s\) match/);
});

test('hash mismatch exits 1', () => {
  const r = check(fixture({ sha: '0'.repeat(64) }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /FAIL .*k\/x_test\.go sha256 [0-9a-f]{64}, registered 0{64}/);
});

test('missing registered test file exits 2, not 0 and not 1', () => {
  const r = check(fixture({ writeFile: false }));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /UNCHECKED .*k\/x_test\.go does not exist/);
});

test('an unrecognised line exits 1 even when every hash matches', () => {
  const r = check(fixture({ extra: '    done_test: "prose the parser does not read"\n' }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unrecognised line/);
});

test('no register at the given path exits 2', () => {
  const { root } = fixture();
  const r = spawnSync(process.execPath, [CHECKER, '--root', root, path.join(root, 'absent.yml')], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /cannot read register/);
});

test('the real registers pass whole', () => {
  const r = spawnSync(process.execPath, [CHECKER], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});
