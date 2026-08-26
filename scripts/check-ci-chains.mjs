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

// An optional path argument, so THIS SCRIPT'S OWN BRANCHES CAN BE RUN. Without it the file it reads
// is fixed at its own location, both failure branches below are unreachable from a test, and a
// script whose failure path has never executed is a script that reports success by construction.
// It changes no verdict that matters: `npm run check:ci-chains` passes no argument, and the BLOCKING
// assertion is the chain case in scripts/check-suite.test.mjs, which reads the real file directly.
const CI_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(REPO, '.github', 'workflows', 'ci.yml');

if (!fs.existsSync(CI_PATH)) {
  // Absent is UNRESOLVED, not clean: a check that cannot read its subject has not checked it.
  console.error(`check:ci-chains UNRESOLVED — ${CI_PATH} does not exist, so nothing was checked.`);
  process.exit(1);
}

const findings = ciChainFindings(fs.readFileSync(CI_PATH, 'utf8'));

if (findings.length) {
  console.error(`check:ci-chains: ${findings.length} finding${findings.length > 1 ? 's' : ''}\n`);
  for (const f of findings) console.error(`  ${f}`);
  // TWO KINDS OF FINDING, TWO REMEDIES, and printing only the first one attaches a false
  // instruction to the second. A chain is exemptible; an undecodable scalar is not, because
  // CI_CHAINS_ALLOWED is keyed by the exact run string and a string this parser cannot read is one
  // it cannot key on either. Split so a reader is told what to do rather than what usually applies.
  if (findings.some((f) => f.includes('cannot decode'))) {
    console.error(
      '\nA `cannot decode` finding is the YAML layer, not the shell one: the value was quoted in a form this ' +
        'parser does not model, so it was never scanned for shell operators at all. It has no allowlist entry ' +
        'by design. Rewrite the scalar — unquote it, or use an escape from YAML_DQ_ESCAPES in ' +
        'scripts/lib/check-suite.js — so what the runner executes is what this reads.'
    );
  }
  console.error(
    '\nA step is ONE command and the workflow reads ONE exit code from it. Split it into two steps, or ' +
      'add the exact run string to CI_CHAINS_ALLOWED in scripts/lib/check-suite.js with the reason written ' +
      'down — an entry there fails if it stops matching a live step, so an exemption cannot rot.'
  );
  process.exit(1);
}

const n = Object.keys(CI_CHAINS_ALLOWED).length;
console.log(`check:ci-chains: no unexempted chained \`run:\` values (${n} allowlisted).`);
