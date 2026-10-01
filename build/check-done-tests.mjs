#!/usr/bin/env node
// build/check-done-tests.mjs — verifies the done-test register (14-BUILD-PLAN.md §6, B0-17:
// "Every test exists, fails red against an empty implementation, and has its hash in the
// register"). This checks the third clause for every build/done-tests/*.yml: each registered file
// exists and its sha256 matches. The red-against-empty clause is checked by running the tests
// (`go -C kernel test -tags donetest ./...`), not here.
//
// Register format, one line per key, nothing else accepted (a line this parser does not consume
// is refused rather than ignored — the lint-jobs.mjs convention). Prose belongs in `#` comments:
//
//   register: B0-17a
//   jobs:
//     - id: B1-01a
//       files:
//         - path: kernel/internal/journal/core_donetest_test.go
//           sha256: <64 lowercase hex>
//
// Exit 0: every registered file matches.
//      1: a finding — a hash mismatch, an unrecognised line, a malformed or escaping entry.
//      2: could not check — no registers, an unreadable register, a registered file that is
//         missing or unreadable. Never a pass: an unchecked file is not a matching file.
// When both kinds occur, 1 wins: a proven mismatch is the stronger statement, and every
// could-not-check line is still printed.
//
// Usage: node build/check-done-tests.mjs [--root DIR] [register.yml ...]
//        (default: every build/done-tests/*.yml, paths resolved against the repository root)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIR = path.join(__dirname, 'done-tests');

export const EXIT = { OK: 0, FINDING: 1, UNCHECKED: 2 };

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
      if (pending) findings.push(`${name}:${pending.line}: ${pending.file} has no sha256`);
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

// Returns { entries, findings, unchecked }: findings exit 1, unchecked exit 2.
export function checkRegister(file, root = REPO_ROOT) {
  const name = path.relative(root, file) || file;
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (e) {
    return { entries: [], findings: [], unchecked: [`${name}: cannot read register: ${e.code || e.message}`] };
  }
  const { entries, findings } = parseRegister(content, name);
  const unchecked = [];
  for (const e of entries) {
    const abs = path.resolve(root, e.file);
    if (path.isAbsolute(e.file) || path.relative(root, abs).startsWith('..')) {
      findings.push(`${name}:${e.line}: ${e.job}: ${e.file} escapes the repository`);
      continue;
    }
    let got;
    try {
      got = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
    } catch (err) {
      const why = err.code === 'ENOENT' ? 'does not exist' : `cannot be read (${err.code || err.message})`;
      unchecked.push(`${name}:${e.line}: ${e.job}: ${e.file} ${why}`);
      continue;
    }
    if (got !== e.sha256) findings.push(`${name}:${e.line}: ${e.job}: ${e.file} sha256 ${got}, registered ${e.sha256}`);
  }
  return { entries, findings, unchecked };
}

export function run(argv, log = console.log, err = console.error) {
  let root = REPO_ROOT;
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') {
      if (argv[i + 1] === undefined) { err('check-done-tests: --root needs a directory'); return EXIT.UNCHECKED; }
      root = path.resolve(argv[++i]);
    } else if (argv[i].startsWith('-')) {
      err(`check-done-tests: unknown flag ${argv[i]}`);
      return EXIT.UNCHECKED;
    } else files.push(path.resolve(argv[i]));
  }
  if (files.length === 0) {
    let names;
    try {
      names = fs.readdirSync(DEFAULT_DIR);
    } catch (e) {
      err(`check-done-tests: cannot read ${path.relative(REPO_ROOT, DEFAULT_DIR)}: ${e.code || e.message}`);
      return EXIT.UNCHECKED;
    }
    files.push(...names.filter((f) => f.endsWith('.yml')).sort().map((f) => path.join(DEFAULT_DIR, f)));
  }
  if (files.length === 0) {
    err('check-done-tests: no registers to check; refusing to report a pass over nothing');
    return EXIT.UNCHECKED;
  }
  let total = 0;
  const findings = [];
  const unchecked = [];
  for (const f of files) {
    const r = checkRegister(f, root);
    total += r.entries.length;
    findings.push(...r.findings);
    unchecked.push(...r.unchecked);
  }
  for (const f of findings) err(`FAIL ${f}`);
  for (const u of unchecked) err(`UNCHECKED ${u}`);
  if (findings.length) return EXIT.FINDING;
  if (unchecked.length) return EXIT.UNCHECKED;
  log(`check-done-tests: ${total} file hash(es) across ${files.length} register(s) match`);
  return EXIT.OK;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(run(process.argv.slice(2)));
}
