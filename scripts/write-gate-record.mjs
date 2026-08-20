#!/usr/bin/env node
// Produces a machine-readable QA gate verdict record and writes it to .qa-gate/<head_sha>.json.
//
// Called by .claude/workflows/qa.js at the end of a successful gate run, via a reviewer agent
// with Bash access. The caller commits .qa-gate/ alongside the PR diff.
//
// THE RECORD IS VERIFIABLE, NOT UNFORGEABLE.
// An author can hand-write a record — they could hand-write qa_verdict: PASS before this too,
// and that was the defect. The improvement is:
//   · The honest path (run qa.js, it writes the record) is now automatic.
//   · A stale or inherited record is detectable: the diff_hash must match the PR's real diff,
//     and the record is keyed by HEAD SHA so a pushed commit invalidates it.
// That is stated plainly so no one oversells what this does.
//
// Usage:
//   echo '<gate-result-json>' | node scripts/write-gate-record.mjs
//   node scripts/write-gate-record.mjs --json-file /path/to/result.json
//   node scripts/write-gate-record.mjs --dry-run            # print the record, do not write
//   node scripts/write-gate-record.mjs --out-dir /tmp/test  # override output dir (for tests)
//
// Input JSON fields:
//   verdict          (required) "PASS" | "BLOCK"
//   tier             (required) "full" | "irreversible"
//   ref              (required) git range that was reviewed, e.g. "origin/main...HEAD"
//   dimensions_run   string[]   (optional, defaults to [])
//   dimensions_failed string[]  (optional, defaults to [])
//   confirmed        number     (optional, defaults to 0) — confirmed block-eligible findings
//   advisory_count   number     (optional, defaults to 0)
//
// Output JSON written to .qa-gate/<head_sha>.json:
//   schema           1  (version field for future compat)
//   verdict          from input — BLOCK is preserved, never silently flipped
//   tier             from input
//   ref              from input
//   diff_hash        SHA-256 of `git diff <base_sha> <head_sha>` — stale record → hash mismatch
//   base_sha         git merge-base origin/main HEAD at run time
//   head_sha         git rev-parse HEAD at run time — record is keyed on this
//   dimensions_run   from input
//   dimensions_failed from input
//   confirmed        from input
//   advisory_count   from input
//   timestamp        ISO-8601

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const DEFAULT_RECORD_DIR = path.join(REPO_ROOT, '.qa-gate');
const SCHEMA_VERSION = 1;

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

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const rl = createInterface({ input: process.stdin, terminal: false });
  const lines = [];
  for await (const line of rl) lines.push(line);
  return lines.join('\n');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const jsonFile = argValue('--json-file');
  const outDir = argValue('--out-dir') || DEFAULT_RECORD_DIR;

  // Read the gate result JSON
  let raw;
  if (jsonFile) {
    raw = readFileSync(jsonFile, 'utf8');
  } else {
    raw = await readStdin();
  }
  raw = (raw || '').trim();
  if (!raw) {
    console.error('write-gate-record: no input JSON — pipe the gate result JSON or use --json-file');
    process.exit(1);
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch (e) {
    console.error(`write-gate-record: invalid JSON input: ${e.message}`);
    process.exit(1);
  }

  // Validate required fields
  for (const f of ['verdict', 'tier', 'ref']) {
    if (input[f] == null) {
      console.error(`write-gate-record: missing required field "${f}" in input JSON`);
      process.exit(1);
    }
  }

  const verdict = String(input.verdict);
  const tier = String(input.tier);
  const ref = String(input.ref);
  const dimensionsRun = Array.isArray(input.dimensions_run) ? input.dimensions_run : [];
  const dimensionsFailed = Array.isArray(input.dimensions_failed) ? input.dimensions_failed : [];
  const confirmed = Number(input.confirmed ?? 0);
  const advisoryCount = Number(input.advisory_count ?? 0);

  // Refuse a ref that begins with "-" — git reads it as an option flag.
  if (ref.startsWith('-')) {
    console.error(`write-gate-record: refusing ref "${ref}" — begins with "-" (git would read it as an option)`);
    process.exit(1);
  }

  // Compute git facts. These are measured at write time so they reflect what the gate reviewed.
  const headSha = gitOut('rev-parse', 'HEAD');

  let baseSha;
  try {
    baseSha = gitOut('merge-base', 'origin/main', 'HEAD');
  } catch {
    try {
      baseSha = gitOut('rev-parse', 'origin/main');
    } catch {
      // Last resort: root commit. If origin/main isn't fetchable the diff hash will be of the
      // full tree — still deterministic, still detects a changed diff.
      baseSha = gitOut('rev-list', '--max-parents=0', 'HEAD');
    }
  }

  // The diff hash is SHA-256 of the binary diff output.
  // Two positional args (no .. or ...) to avoid ambiguity between two-dot and three-dot diff
  // semantics. Because baseSha is the merge-base, `git diff baseSha headSha` and
  // `git diff baseSha...headSha` give identical output.
  // execFileSync with no shell means no injection path here.
  const diffBuf = execFileSync('git', ['diff', baseSha, headSha], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const diffHash = createHash('sha256').update(diffBuf).digest('hex');

  const record = {
    schema: SCHEMA_VERSION,
    verdict,
    tier,
    ref,
    diff_hash: diffHash,
    base_sha: baseSha,
    head_sha: headSha,
    dimensions_run: dimensionsRun,
    dimensions_failed: dimensionsFailed,
    confirmed,
    advisory_count: advisoryCount,
    timestamp: new Date().toISOString(),
  };

  const json = JSON.stringify(record, null, 2) + '\n';

  if (dryRun) {
    // Print with a header line so callers can split on it; the JSON starts at line 2.
    console.log('[dry-run] gate record (not written):');
    console.log(json);
    process.exit(0);
  }

  const outPath = path.join(outDir, `${headSha}.json`);
  const relPath = path.relative(REPO_ROOT, outPath);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, json);

  console.log(`gate-record: wrote ${relPath}`);
  console.log(`  verdict:   ${verdict}`);
  console.log(`  tier:      ${tier}`);
  console.log(`  diff_hash: ${diffHash}`);
  console.log(`  base_sha:  ${baseSha}`);
  console.log(`  head_sha:  ${headSha}`);
}

main().catch((e) => {
  console.error(`write-gate-record: unexpected error: ${e.message}`);
  process.exit(1);
});
