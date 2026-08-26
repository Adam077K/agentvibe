#!/usr/bin/env node
// POSTURE: BLOCKS — every refusal is a write that does not happen. It is the same gate as
// the MCP tool, because it is the same function: both are thin shells over
// scripts/lib/claim-append.js, which is where all the checking lives. If the two ever
// disagree, one of them grew logic it should not have.
//
// scripts/claim-append.mjs — append one sourced claim to the ledger, from a shell.
//
//   node scripts/claim-append.mjs --file claim.json
//   node scripts/claim-append.mjs --stdin            (reads the record as JSON)
//   node scripts/claim-append.mjs --file c.json --dry-run
//
// Exit 0 on append, 1 on refusal, 2 on usage error. The refusal CODE is printed on the
// first line of stderr so a caller can branch on it without parsing prose.
//
// WHY A CLI EXISTS AT ALL WHEN THE POINT IS THE MCP GRANT. Two reasons, neither of them
// "for completeness". First, the gate is testable in a shell without an MCP client, which
// is the difference between a mechanism this repo can run in CI and one it can only
// describe. Second, the runtime grant is the one part of this work that cannot be verified
// from inside a session — this path can, so a refusal reported by the MCP tool can always
// be reproduced.

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { appendClaim, Refusal } = require('./lib/claim-append.js');

function usage(msg) {
  process.stderr.write(`${msg}\n\nusage: node scripts/claim-append.mjs (--file <path> | --stdin) [--dry-run] [--by <name>]\n`);
  process.exit(2);
}

const argv = process.argv.slice(2);
let file = null;
let useStdin = false;
let dryRun = false;
let by = 'cli';
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--file') { file = argv[++i]; if (!file) usage('--file needs a path'); }
  else if (a === '--stdin') useStdin = true;
  else if (a === '--dry-run') dryRun = true;
  else if (a === '--by') { by = argv[++i]; if (!by) usage('--by needs a name'); }
  else usage(`unknown argument "${a}"`);
}
if (file && useStdin) usage('--file and --stdin are mutually exclusive');
if (!file && !useStdin) usage('one of --file or --stdin is required');

function readAll(fd) {
  const chunks = [];
  const buf = Buffer.alloc(65536);
  for (;;) {
    let n;
    try { n = fs.readSync(fd, buf, 0, buf.length, null); }
    catch (e) { if (e.code === 'EAGAIN') continue; if (e.code === 'EOF') break; throw e; }
    if (n === 0) break;
    chunks.push(Buffer.from(buf.slice(0, n)));
  }
  return Buffer.concat(chunks).toString('utf8');
}

let raw;
try {
  raw = useStdin ? readAll(0) : fs.readFileSync(file, 'utf8');
} catch (e) {
  usage(`could not read the record: ${e.message}`);
}

let submitted;
try {
  submitted = JSON.parse(raw);
} catch (e) {
  // A malformed record is a refusal, not a crash: the caller needs the same shape of
  // answer whether the JSON was bad or the claim was.
  process.stderr.write(`REFUSED[INPUT_NOT_JSON] the record is not valid JSON: ${e.message}\n`);
  process.exit(1);
}

try {
  const out = await appendClaim(submitted, { by, dryRun });
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  process.exit(0);
} catch (e) {
  if (e instanceof Refusal) {
    process.stderr.write(`REFUSED[${e.code}] ${e.message}\n`);
    process.exit(1);
  }
  process.stderr.write(`REFUSED[INTERNAL] ${e.stack || e.message}\n`);
  process.exit(1);
}
