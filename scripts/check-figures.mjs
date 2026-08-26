#!/usr/bin/env node
// POSTURE: BLOCKS. Step `check:figures` of `npm run check`, and its own step in
// .github/workflows/ci.yml. Exits 1 on any finding.
//
// scripts/check-figures.mjs — the entry point for scripts/lib/figures.js.
//
// This file does the two impure things the library refuses to do: it reads the corpus off disk and
// it prints. Everything that decides anything lives in the library and is pure over its inputs, so
// the tests can drive it against MUTATED text without touching the tree.
//
// It runs nothing from the documents it reads. See the library header for why that is the whole
// design and not an implementation detail.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const suite = require(path.join(REPO, 'scripts', 'lib', 'check-suite.js'));
const { FIGURES, derive, figureFindings } = require(path.join(REPO, 'scripts', 'lib', 'figures.js'));

const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');

const ci = read('.github/workflows/ci.yml');
const pkg = JSON.parse(read('package.json'));
const derived = derive({ ci, pkg, suite });

// Only the files the registry actually names, so a registry entry pointing at a file nobody reads
// becomes a `missing-file` finding rather than a silent pass.
const files = {};
for (const rel of new Set(FIGURES.map((f) => f.file))) {
  try { files[rel] = read(rel); } catch { /* left absent on purpose — the library reports it */ }
}

const findings = figureFindings({ files, derived });
const json = process.argv.includes('--json');

if (json) {
  console.log(JSON.stringify({ ok: findings.length === 0, checked: FIGURES.length, derived, findings }, null, 2));
} else {
  const fileCount = new Set(FIGURES.map((f) => f.file)).size;
  if (findings.length === 0) {
    console.log(`✓ documented figures: ${FIGURES.length} checked across ${fileCount} file(s), all agree with the values the suite derives.`);
    console.log(`  Derived: ${Object.entries(derived).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
    console.log('  This is coverage of the WIRED figures only. A figure with no registry entry in');
    console.log('  scripts/lib/figures.js is not checked here and never will be until someone adds one.');
  } else {
    console.error(`✗ documented figures: ${findings.length} finding(s) across ${FIGURES.length} checked.\n`);
    for (const f of findings) console.error(`  [${f.kind}] ${f.message}`);
    console.error('\n  A figure is either derived or it is unchecked. If the prose moved, re-aim the');
    console.error('  locator in scripts/lib/figures.js; deleting the entry deletes the assertion.');
  }
}

process.exit(findings.length === 0 ? 0 : 1);
