#!/usr/bin/env node
// check.mjs — the entry point npm run check:mc calls from the repo root.
//
// Plain Node ESM on purpose: this is the one file in mission-control/ that has to run
// BEFORE we know bun is even installed, so it cannot itself depend on bun.
//
//   --probe   just answer "can this environment run Mission Control at all" — used by
//             the negative-path acceptance test and by CI before it commits to `bun test`.
//   (none)    probe first, then hand off to `bun test` with inherited stdio, and exit
//             with whatever `bun test` exits with.
//
// Both failure paths print ONE line to stderr naming what's missing and exit 1. Neither
// path lets a stack trace escape — a Node ESM crash trace is not an actionable message
// for someone who just doesn't have bun on PATH yet.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const NODE_MODULES = path.join(HERE, 'node_modules');

const BUN_NOT_FOUND =
  'mission-control: bun not found — install from https://bun.sh, or see mission-control/README.md';
const DEPS_MISSING =
  'mission-control: dependencies missing — run `bun install` in mission-control/';

/** Spawn `bun --version`. Returns the version string, or null if bun cannot be run. */
function bunVersion() {
  const res = spawnSync('bun', ['--version'], { encoding: 'utf8' });
  if (res.error || res.status !== 0 || !res.stdout) return null;
  return res.stdout.trim();
}

/** The --probe logic. Prints its own success/failure line. Returns true/false. */
function probe() {
  const version = bunVersion();
  if (!version) {
    process.stderr.write(BUN_NOT_FOUND + '\n');
    return false;
  }
  if (!fs.existsSync(NODE_MODULES)) {
    process.stderr.write(DEPS_MISSING + '\n');
    return false;
  }
  process.stdout.write(`mission-control: bun ${version} ok\n`);
  return true;
}

function main() {
  const probeOnly = process.argv.includes('--probe');

  if (!probe()) {
    process.exit(1);
  }
  if (probeOnly) {
    process.exit(0);
  }

  const res = spawnSync('bun', ['test'], { cwd: HERE, stdio: 'inherit' });
  process.exit(res.status === null ? 1 : res.status);
}

try {
  main();
} catch (err) {
  // Defensive only — probe()/main() are not expected to throw. Still no stack trace.
  process.stderr.write(`mission-control: ${err.message}\n`);
  process.exit(1);
}
