#!/usr/bin/env node
// POSTURE: ADVISES on its own — it answers a question and exits 0. Its CALLERS block:
// .github/workflows/qa-lead-pass.yml turns `floor=irreversible` without the matching
// label into a failed check, and scripts/ledger.mjs turns `enforcement=block` into
// exit 1. Exit 2 means the classifier itself could not run, which is always a failure.
//
// scripts/classify.mjs — CLI over THE classifier.
//
//   node scripts/classify.mjs docs/a.md .claude/agents/ceo.md   # classify paths
//   node scripts/classify.mjs --stdin                           # paths on stdin
//   node scripts/classify.mjs --json --stdin                    # machine-readable
//   node scripts/classify.mjs --floor --stdin                   # just: floor=<tier>
//
// This replaced 25 lines of inline bash in qa-lead-pass.yml that reimplemented the
// same matching. Two implementations of risk classification will disagree, and you
// find out during the incident.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadRules, classifyFiles } = require('./lib/classifier.js');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const MAP = path.join(REPO_ROOT, '.claude', 'qa-tier-floor.yml');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const floorOnly = argv.includes('--floor');
  const useStdin = argv.includes('--stdin');
  let files = argv.filter((a) => !a.startsWith('--'));

  if (useStdin) {
    files = files.concat(readStdin().split('\n').map((s) => s.trim()).filter(Boolean));
  }
  if (files.length === 0) {
    process.stderr.write('classify: no paths given (pass paths as arguments or use --stdin)\n');
    process.exit(2);
  }

  const rules = loadRules(MAP);
  const result = classifyFiles(files, rules);

  if (json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }
  if (floorOnly) {
    process.stdout.write(`floor=${result.floor.tier}\n`);
    process.stdout.write(`file=${result.floor.file ?? ''}\n`);
    process.stdout.write(`pattern=${result.floor.pattern ?? ''}\n`);
    process.stdout.write(`reason=${result.floor.reason ?? ''}\n`);
    return;
  }

  for (const f of result.files) {
    const bits = [`tier=${f.tier}`, `enforcement=${f.enforcement}`];
    if (f.resolvers.length) bits.push(`resolvers=${f.resolvers.join(',')}`);
    if (f.required_claim_kinds.length) bits.push(`claim_kinds=${f.required_claim_kinds.join(',')}`);
    process.stdout.write(`${f.file}\n    ${bits.join(' · ')}\n    matched: ${f.matched_patterns.join(' | ') || '(none — default)'}\n`);
  }
  process.stdout.write(`\nfloor=${result.floor.tier}`);
  if (result.floor.file) process.stdout.write(`  (${result.floor.file} → ${result.floor.pattern})`);
  process.stdout.write('\n');
}

try {
  main();
} catch (err) {
  process.stderr.write(`classify: ${err.message}\n`);
  process.exit(2);
}
