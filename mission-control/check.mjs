#!/usr/bin/env node
// check.mjs — the entry point npm run check:mc calls from the repo root.
//
// Plain Node ESM on purpose: this is the one file in mission-control/ that has to run
// BEFORE we know bun is even installed, so it cannot itself depend on bun.
//
//   --probe   just answer "can this environment run Mission Control at all" — used by
//             the negative-path acceptance test and by CI before it commits to running
//             anything heavier.
//   (none)    probe, then TYPECHECK, then `bun test`, each with inherited stdio, exiting
//             on the first failure with that step's status.
//
// Both probe failure paths print ONE line to stderr naming what's missing and exit 1.
// Neither lets a stack trace escape — a Node ESM crash trace is not an actionable message
// for someone who just doesn't have bun on PATH yet.
//
// WHY TYPECHECK IS IN THE GATE (added with PR3, and it should have been here from PR1).
// `bun test` runs TypeScript by STRIPPING types, never by checking them, so for two PRs
// nothing anywhere in `npm run check` or CI ever ran `tsc`. That was survivable while this
// was a few hundred lines of server code with heavy runtime tests. It stopped being
// survivable the moment the client landed: the client imports its wire types straight from
// the server specifically so that adding a field to FleetRow and forgetting the view is a
// compile error — a guarantee whose entire enforcement was a comment saying it existed.
// A rule enforced only by a sentence is a wish.

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

/** Runs one step with inherited stdio. Returns its exit status, never null. */
function run(label, command, args) {
  process.stdout.write(`mission-control: ${label}\n`);
  const res = spawnSync(command, args, { cwd: HERE, stdio: 'inherit' });
  return res.status === null ? 1 : res.status;
}

function main() {
  const probeOnly = process.argv.includes('--probe');

  if (!probe()) {
    process.exit(1);
  }
  if (probeOnly) {
    process.exit(0);
  }

  // Typecheck FIRST: it is the faster of the two and a type error makes the test run's
  // output harder to read, not easier.
  const typecheck = run('typecheck (tsc --noEmit)', 'bunx', ['tsc', '--noEmit']);
  if (typecheck !== 0) {
    process.stderr.write('mission-control: typecheck failed — see the errors above\n');
    process.exit(typecheck);
  }

  process.exit(run('tests (bun test)', 'bun', ['test']));
}

try {
  main();
} catch (err) {
  // Defensive only — probe()/main() are not expected to throw. Still no stack trace.
  process.stderr.write(`mission-control: ${err.message}\n`);
  process.exit(1);
}
