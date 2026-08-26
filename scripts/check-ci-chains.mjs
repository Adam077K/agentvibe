#!/usr/bin/env node
// POSTURE: entry point. The BLOCKING assertion is in `scripts/check-suite.test.mjs`, which is a step
// of `npm run check`; this script is the same property runnable on its own.
//
// scripts/check-ci-chains.mjs — report `run:` values in .github/workflows/ci.yml that put more than
// one command behind one exit code.
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────────────────────────────
// The suite's operator check only ever saw package.json script bodies, reached through
// resolveChain(scripts, step). The workflow's raw `run:` text was never fed to it, so
// `run: npm run a && npm run b` written straight into the workflow bypassed package.json and STEPS
// entirely — `&&` skips the rest on the first failure, and `;`, `|` and `&` hand back the LAST
// command's status so the failure disappears with no red step at all.
//
// The predicate and the allowlist live in scripts/lib/check-suite.js, next to the STEPS rules they
// mirror, and ciChainFindings() is pure over both of its inputs so the tests can drive it against
// mutated workflow text. This file is only the file read and the exit code.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ciChainFindings, CI_CHAINS_ALLOWED } = require('./lib/check-suite.js');

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CI_PATH = path.join(REPO, '.github', 'workflows', 'ci.yml');

if (!fs.existsSync(CI_PATH)) {
  // Absent is UNRESOLVED, not clean: a check that cannot read its subject has not checked it.
  console.error(`check:ci-chains UNRESOLVED — ${CI_PATH} does not exist, so nothing was checked.`);
  process.exit(1);
}

const findings = ciChainFindings(fs.readFileSync(CI_PATH, 'utf8'));

if (findings.length) {
  console.error(`check:ci-chains: ${findings.length} finding${findings.length > 1 ? 's' : ''}\n`);
  for (const f of findings) console.error(`  ${f}`);
  console.error(
    '\nA step is ONE command and the workflow reads ONE exit code from it. Split it into two steps, or ' +
      'add the exact run string to CI_CHAINS_ALLOWED in scripts/lib/check-suite.js with the reason written ' +
      'down — an entry there fails if it stops matching a live step, so an exemption cannot rot.'
  );
  process.exit(1);
}

const n = Object.keys(CI_CHAINS_ALLOWED).length;
console.log(`check:ci-chains: no unexempted chained \`run:\` values (${n} allowlisted).`);
