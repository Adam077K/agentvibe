#!/usr/bin/env node
// build/check-done-tests.mjs — verifies the done-test register (14-BUILD-PLAN.md §6, B0-17:
// "Every test exists, fails red against an empty implementation, and has its hash in the
// register"). This checks the third clause for every build/done-tests/*.yml: each registered file
// exists and its sha256 matches. The red-against-empty clause is checked by running the tests
// (`go -C kernel test -tags donetest ./...`), not here.
//
// Register format, one line per key, nothing else accepted (a line this parser does not consume
// is refused rather than ignored — the lint-jobs.mjs convention):
//
//   register: B0-17a
//   jobs:
//     - id: B1-01a
//       files:
//         - path: kernel/internal/journal/core_donetest_test.go
//           sha256: <64 lowercase hex>
//
// Exit 0 clean · 1 finding(s), one line each.
//
// Usage: node build/check-done-tests.mjs [register.yml ...]   (default: build/done-tests/*.yml)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIR = path.join(__dirname, 'done-tests');

const LINE = [
  ['register', /^register: ([A-Za-z0-9-]+)$/],
  ['jobs', /^jobs:$/],
  ['job', /^  - id: ([A-Za-z0-9-]+)$/],
  ['files', /^    files:$/],
  ['path', /^      - path: ([A-Za-z0-9_./-]+)$/],
  ['sha', /^        sha256: ([0-9a-f]{64})$/],
];

export function parseRegister(content, name) {
  const findings = [];
  const entries = [];
  let register = null;
  let job = null;
  let pending = null;
  content.split('\n').forEach((raw, i) => {
    const line = raw.replace(/\s+$/, '');
    if (line === '' || /^\s*#/.test(line)) return;
    const hit = LINE.map(([k, re]) => [k, line.match(re)]).find(([, m]) => m);
    if (!hit) {
      findings.push(`${name}:${i + 1}: unrecognised line: ${JSON.stringify(raw)}`);
      return;
    }
    const [kind, m] = hit;
    if (kind === 'register') register = m[1];
    else if (kind === 'job') job = m[1];
    else if (kind === 'path') {
      if (!job) findings.push(`${name}:${i + 1}: path outside a job`);
      if (pending) findings.push(`${name}:${i + 1}: ${pending.file} has no sha256`);
      pending = { job, file: m[1], line: i + 1 };
    } else if (kind === 'sha') {
      if (!pending) findings.push(`${name}:${i + 1}: sha256 without a path`);
      else entries.push({ ...pending, sha256: m[1] });
      pending = null;
    }
  });
  if (pending) findings.push(`${name}:${pending.line}: ${pending.file} has no sha256`);
  if (!register) findings.push(`${name}: no register: line`);
  if (entries.length === 0) findings.push(`${name}: registers no files`);
  return { register, entries, findings };
}

export function checkRegister(file, root = REPO_ROOT) {
  const name = path.relative(root, file);
  const { entries, findings } = parseRegister(fs.readFileSync(file, 'utf8'), name);
  for (const e of entries) {
    const abs = path.resolve(root, e.file);
    if (path.relative(root, abs).startsWith('..') || path.isAbsolute(e.file)) {
      findings.push(`${name}:${e.line}: ${e.job}: ${e.file} escapes the repository`);
      continue;
    }
    let got;
    try {
      got = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
    } catch {
      findings.push(`${name}:${e.line}: ${e.job}: ${e.file} does not exist`);
      continue;
    }
    if (got !== e.sha256) findings.push(`${name}:${e.line}: ${e.job}: ${e.file} sha256 ${got}, registered ${e.sha256}`);
  }
  return { entries, findings };
}

function main() {
  let files = process.argv.slice(2);
  if (files.length === 0) {
    if (!fs.existsSync(DEFAULT_DIR)) {
      console.error(`check-done-tests: ${path.relative(REPO_ROOT, DEFAULT_DIR)} does not exist`);
      process.exit(1);
    }
    files = fs.readdirSync(DEFAULT_DIR).filter((f) => f.endsWith('.yml')).sort().map((f) => path.join(DEFAULT_DIR, f));
  }
  if (files.length === 0) {
    console.error('check-done-tests: no registers to check');
    process.exit(1);
  }
  let total = 0;
  const all = [];
  for (const f of files) {
    const { entries, findings } = checkRegister(path.resolve(f));
    total += entries.length;
    all.push(...findings);
  }
  for (const f of all) console.error(f);
  if (all.length) process.exit(1);
  console.log(`check-done-tests: ${total} file hash(es) across ${files.length} register(s) match`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
