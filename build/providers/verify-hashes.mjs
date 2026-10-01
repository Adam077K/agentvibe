#!/usr/bin/env node
// Self-check for build/providers/registry.yml.
//
// Recomputes sha256 for every quote's "text" field, straight from the COMMITTED FILE, and
// fails if a stored sha256 does not match. This is the only thing this script trusts: it does
// not re-fetch pages and does not know what the text SHOULD say, only whether the hash on disk
// still matches the text on disk. A hand-edit of either half without re-running this script (or
// `--fix`) is what this catches.
//
// No external dependencies (this repo declares none; see scripts/lib/claims.js's own note on
// why a hard `require('js-yaml')` cannot be load-bearing here). Extraction relies on one
// deliberate authoring rule enforced by build/providers' generator: every quote's `text:` is a
// SINGLE PHYSICAL LINE, double-quoted, JSON-compatible YAML scalar -- so it can be recovered
// exactly with JSON.parse, with no YAML folding/joining logic (and its attendant bugs) involved
// at all. A `text:` written any other way (block scalar, multi-line) is a schema violation this
// script refuses rather than guesses at.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, 'registry.yml');
const fix = process.argv.includes('--fix');

const raw = readFileSync(FILE, 'utf8');
const lines = raw.split('\n');

const URL_RE = /^(\s*)- url:\s*(\S+)\s*$/;
const SHA_RE = /^(\s*)sha256:\s*(\S*)\s*$/;
const TEXT_RE = /^(\s*)text:\s*(".*")\s*$/;

const records = [];

for (let i = 0; i < lines.length; i++) {
  const urlMatch = lines[i].match(URL_RE);
  if (!urlMatch) continue;
  const urlLine = i + 1;
  const url = urlMatch[2];

  const shaLineIdx = i + 1;
  const shaMatch = lines[shaLineIdx] && lines[shaLineIdx].match(SHA_RE);
  if (!shaMatch) {
    throw new Error(`line ${urlLine}: "- url: ${url}" not followed by a "sha256:" line (schema violation)`);
  }

  const textLineIdx = i + 2;
  const textMatch = lines[textLineIdx] && lines[textLineIdx].match(TEXT_RE);
  if (!textMatch) {
    throw new Error(
      `line ${urlLine}: "sha256:" not followed by a single-line double-quoted "text:" ` +
        `(got: ${JSON.stringify(lines[textLineIdx])}) -- this script only supports the ` +
        `single-line JSON-string form; see the header comment`,
    );
  }

  let text;
  try {
    text = JSON.parse(textMatch[2]);
  } catch (e) {
    throw new Error(`line ${textLineIdx + 1}: "text:" value is not valid JSON-string syntax: ${e.message}`);
  }

  records.push({ url, urlLine, shaLineIdx, storedHash: shaMatch[2], text });
}

if (records.length === 0) {
  throw new Error('found zero quote records -- refusing to report a vacuous PASS (schema drift?)');
}

let mismatches = 0;
for (const r of records) {
  const computed = createHash('sha256').update(r.text, 'utf8').digest('hex');
  const ok = computed === r.storedHash;
  if (!ok) mismatches++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.url}`);
  if (!ok) {
    console.log(`      stored:   ${r.storedHash}`);
    console.log(`      computed: ${computed}`);
  }
  if (fix) {
    const shaIndent = lines[r.shaLineIdx].match(SHA_RE)[1];
    lines[r.shaLineIdx] = `${shaIndent}sha256: ${computed}`;
  }
}

console.log(`\n${records.length - mismatches}/${records.length} quote hashes verified` + (fix ? ' (--fix applied)' : ''));

if (fix) {
  writeFileSync(FILE, lines.join('\n'));
  console.log('registry.yml updated with recomputed hashes.');
} else if (mismatches > 0) {
  process.exit(1);
}
