#!/usr/bin/env node
// write-gate-record.mjs — writes .qa-gate/<diff_hash>.json
//
// Fixes PR #77 P1 #1: keying by head_sha means committing the record changes HEAD,
// breaking the filename. Keying by diff_hash (SHA-256 of the diff excluding .qa-gate/)
// is stable across commits: .qa-gate/ is excluded so the commit does not change the hash.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_VERSION = 1;

function argValue(name) {
  const i = process.argv.indexOf(name);
  return (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--'))
    ? process.argv[i + 1] : null;
}

function gitRun(args, cwd) {
  return execFileSync('git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}function assertValidSha(val, label) {
  if (!/^[a-f0-9]{40}$/.test(val)) {
    console.error('write-gate-record: ' + label + ' is not a valid SHA-1 (40 hex chars), got: ' + JSON.stringify(val));
    process.exit(1);
  }
}

async function readAll() {
  if (process.stdin.isTTY) return '';
  const buf = [];
  for await (const chunk of process.stdin) buf.push(chunk);
  return Buffer.concat(buf).toString('utf8');
}

async function execute() {
  const dryRun    = process.argv.includes('--dry-run');
  const jsonFile  = argValue('--json-file');
  const cwdArg    = argValue('--cwd')      || path.resolve(HERE, '..');
  const outDirArg = argValue('--out-dir');
  const headArg   = argValue('--head-sha');
  const baseArg   = argValue('--base-sha');

  const REPO   = cwdArg;
  const outDir = outDirArg || path.join(REPO, '.qa-gate');

  let raw = jsonFile ? readFileSync(jsonFile, 'utf8') : await readAll();
  raw = (raw || '').trim();
  if (!raw) {
    console.error('write-gate-record: no input JSON — pipe the gate result or use --json-file');
    process.exit(1);
  }

  let inp;
  try { inp = JSON.parse(raw); }
  catch (e) { console.error('write-gate-record: invalid JSON input: ' + e.message); process.exit(1); }

  for (const f of ['verdict', 'tier', 'ref']) {
    if (inp[f] == null) {
      console.error('write-gate-record: missing required field "' + f + '" in input JSON');
      process.exit(1);
    }
  }

  const verdict   = String(inp.verdict);
  const tier      = String(inp.tier);
  const ref       = String(inp.ref);
  const dimsRun   = Array.isArray(inp.dimensions_run)    ? inp.dimensions_run    : [];
  const dimsFail  = Array.isArray(inp.dimensions_failed) ? inp.dimensions_failed : [];
  const confirmed = Number(inp.confirmed     ?? 0);
  const advisory  = Number(inp.advisory_count ?? 0);

  if (ref.startsWith('-')) {
    console.error('write-gate-record: refusing ref starting with "-" (git would read it as an option)');
    process.exit(1);
  }  let headSha = headArg || (inp.head_sha ? String(inp.head_sha) : null);
  let baseSha = baseArg || (inp.base_sha ? String(inp.base_sha) : null);
  if (headSha) { assertValidSha(headSha, 'head_sha'); }
  else { headSha = gitRun(['rev-parse', 'HEAD'], REPO); assertValidSha(headSha, 'computed head_sha'); }
  if (baseSha) { assertValidSha(baseSha, 'base_sha'); }
  else {
    try { baseSha = gitRun(['merge-base', 'origin/main', headSha], REPO); }
    catch { try { baseSha = gitRun(['rev-parse', 'origin/main'], REPO); }
            catch { baseSha = gitRun(['rev-list', '--max-parents=0', headSha], REPO); } }
    assertValidSha(baseSha, 'computed base_sha');
  }
  const GIT = 'git';
  const diffBuf = execFileSync(GIT, ['diff', baseSha, headSha, '--', ':(exclude).qa-gate'], {
    cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const diffHash = createHash('sha256').update(diffBuf).digest('hex');
  const record = {
    schema: SCHEMA_VERSION, verdict, tier, ref, diff_hash: diffHash,
    base_sha: baseSha, head_sha: headSha,
    dimensions_run: dimsRun, dimensions_failed: dimsFail,
    confirmed, advisory_count: advisory, timestamp: new Date().toISOString(),
  };
  const json = JSON.stringify(record, null, 2) + '\n';
  if (dryRun) {
    console.log('[dry-run] gate record (not written):');
    process.stdout.write(json); process.exit(0);
  }
  const outPath = path.join(outDir, diffHash + '.json');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, json);
  console.log('gate-record: wrote ' + path.relative(REPO, outPath));
  console.log('  verdict:   ' + verdict);
  console.log('  tier:      ' + tier);
  console.log('  diff_hash: ' + diffHash);
  console.log('  base_sha:  ' + baseSha);
  console.log('  head_sha:  ' + headSha);
}
execute().catch((e) => {
  console.error('write-gate-record: unexpected error: ' + e.message);
  process.exit(1);
});