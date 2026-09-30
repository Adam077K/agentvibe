#!/usr/bin/env node
// Verifies every frozen done-test against its registered hash (B0-17).
// Reads every build/done-tests/*.yml; each `path:` line must be followed by a `sha256:` line.
// Exit 0: every file matches · 1: a mismatch or a missing file · 2: could not check.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'build', 'done-tests');
let registers;
try {
  registers = readdirSync(dir).filter((f) => f.endsWith('.yml')).sort();
} catch (e) {
  console.error(`check-done-tests: cannot read ${dir}: ${e.message}`);
  process.exit(2);
}
if (registers.length === 0) {
  console.error('check-done-tests: no registers found; refusing to report a pass over nothing');
  process.exit(2);
}

let checked = 0;
const findings = [];
for (const reg of registers) {
  const lines = readFileSync(join(dir, reg), 'utf8').split('\n');
  let pending = null;
  for (const [i, line] of lines.entries()) {
    const p = line.match(/^\s*-?\s*path:\s*(\S+)\s*$/);
    const h = line.match(/^\s*sha256:\s*([0-9a-f]{64})\s*$/);
    if (p) {
      if (pending) findings.push(`${reg}:${pending.line}: ${pending.path} has no sha256`);
      pending = { path: p[1], line: i + 1 };
    } else if (h) {
      if (!pending) { findings.push(`${reg}:${i + 1}: sha256 with no path`); continue; }
      const abs = join(root, pending.path);
      if (!existsSync(abs)) {
        findings.push(`${reg}: ${pending.path} is missing`);
      } else {
        const got = createHash('sha256').update(readFileSync(abs)).digest('hex');
        if (got !== h[1]) findings.push(`${reg}: ${pending.path} sha256 ${got} != registered ${h[1]}`);
      }
      checked++;
      pending = null;
    }
  }
  if (pending) findings.push(`${reg}:${pending.line}: ${pending.path} has no sha256`);
}

if (checked === 0) {
  console.error('check-done-tests: registers hold no path/sha256 pairs; refusing to pass');
  process.exit(2);
}
for (const f of findings) console.error(`FAIL ${f}`);
console.log(`check-done-tests: ${checked - findings.length} of ${checked} frozen files match (${registers.length} registers)`);
process.exit(findings.length ? 1 : 0);
