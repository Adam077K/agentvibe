#!/usr/bin/env node
// POSTURE: BLOCKS. `vendor-provenance.mjs --check` exits 1 when the committed manifest does
// not match what the lens files cite, and it runs in .github/workflows/ci.yml via
// `npm run test:provenance`.
//
// scripts/vendor-provenance.mjs — vendor the provenance the lenses cite.
//
//   node scripts/vendor-provenance.mjs           regenerate .claude/provenance/sources.json
//   node scripts/vendor-provenance.mjs --check   exit 1 if the committed manifest has drifted
//
// WHY THIS EXISTS. Every `sources:` entry in .claude/lenses.yml and .claude/review-lenses.yml
// is shaped `git:<repo-relative-path>@<short-rev>` and pointed at a blob that lives ONLY in
// this repository's object store. `~/bin/newproject` generates a project by rsyncing the tree
// while excluding `.git`, then `git init`s a fresh, empty object store — so in every generated
// project all 26 citations resolved to nothing and schema-lint exited 1 before anyone had
// touched the checkout. `fetch-depth: 0` cannot help: you cannot fetch an object that was
// never in the repository you cloned.
//
// So the provenance travels as data. This script records, per cited blob, the full commit,
// a sha256 of the exact bytes, its size, its line count, and its headings. schema-lint then
// checks the manifest FIRST and the git object only when the object is actually reachable:
// a transplanted repo passes on the recorded shape, and this repo — where the objects do
// exist — still fails on a byte that changed. Recording it is what makes "this lens came
// from that file" survive both deletion of the file and transplant of the tree.
//
// THE MANIFEST IS NEVER HAND-EDITED, for the same reason .claude/ledger/index.json is not:
// a record you can edit by hand is a record that proves whatever its editor wanted. `--check`
// is the mechanism. Precedent: `ledger.mjs build --check`.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// One parser. The lens files are already read by `parseYamlSubset` in schema-lint.js; this
// script reads the same files and does not gain a fourth hand-rolled YAML reader.
const { parseYamlSubset } = require('./lib/claims.js');

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(REPO_ROOT, '.claude', 'provenance', 'sources.json');

const LENS_FILES = [
  { file: path.join(REPO_ROOT, '.claude', 'lenses.yml'), key: 'lenses' },
  { file: path.join(REPO_ROOT, '.claude', 'review-lenses.yml'), key: 'review_lenses' },
];

const GIT_SOURCE = /^git:(.+)@([0-9a-f]{7,40})$/;

/** Every distinct `git:<path>@<rev>` cited by either lens file, as `<path>@<rev>` keys. */
export function citedSources(lensFiles = LENS_FILES) {
  const out = new Map();
  for (const { file, key } of lensFiles) {
    const doc = parseYamlSubset(fs.readFileSync(file, 'utf8'));
    const list = (doc && doc[key]) || [];
    if (!Array.isArray(list)) throw new Error(`${file}: no "${key}:" list`);
    for (const lens of list) {
      for (const s of (lens && lens.sources) || []) {
        const m = GIT_SOURCE.exec(String(s));
        if (!m) continue; // a live path needs no vendoring — it is in the tree.
        const [, p, rev] = m;
        out.set(`${p}@${rev}`, { path: p, rev });
      }
    }
  }
  return out;
}

/** The blob bytes at `<rev>:<path>`, or null when the object is not in this store. */
function gitBlob(rev, p) {
  try {
    return execFileSync('git', ['cat-file', 'blob', `${rev}:${p}`], {
      cwd: REPO_ROOT,
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

function gitFullCommit(rev) {
  try {
    return execFileSync('git', ['rev-parse', rev], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Build the manifest from the object store. Requires the objects to be present — this is
 * the authoring side, and it is the only side that needs them.
 */
export function buildManifest() {
  const cited = citedSources();
  const out = {};
  const missing = [];
  for (const key of [...cited.keys()].sort()) {
    const { path: p, rev } = cited.get(key);
    const buf = gitBlob(rev, p);
    const commit = gitFullCommit(rev);
    if (buf === null || commit === null || !/^[0-9a-f]{40}$/.test(commit)) {
      missing.push(key);
      continue;
    }
    const text = buf.toString('utf8');
    out[key] = {
      path: p,
      rev,
      commit,
      sha256: crypto.createHash('sha256').update(buf).digest('hex'),
      bytes: buf.length,
      lines: text.split('\n').length,
      // Headings are what a reader would use to confirm this is the file the lens claims,
      // without vendoring 187KB of superseded prose into the tree to do it.
      headings: text.split('\n').filter((l) => /^#{1,6} /.test(l)).map((l) => l.trim()),
    };
  }
  if (missing.length > 0) {
    throw new Error(
      `cannot vendor provenance for ${missing.length} citation(s) — the git objects are not in ` +
      `this store:\n  ${missing.join('\n  ')}\n` +
      `Run this from a full clone of the repository the lenses were mined in.`
    );
  }
  return out;
}

/** Deterministic on-disk form: sorted keys, 2-space JSON, trailing newline. */
export function serialise(manifest) {
  return JSON.stringify(manifest, null, 2) + '\n';
}

function main() {
  const check = process.argv.includes('--check');
  const fresh = serialise(buildManifest());

  if (!check) {
    fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
    fs.writeFileSync(MANIFEST_PATH, fresh);
    const n = Object.keys(JSON.parse(fresh)).length;
    process.stdout.write(`vendor-provenance: wrote ${path.relative(REPO_ROOT, MANIFEST_PATH)} — ${n} sources\n`);
    return 0;
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    process.stderr.write(
      `vendor-provenance: ${path.relative(REPO_ROOT, MANIFEST_PATH)} is missing. ` +
      `Run: node scripts/vendor-provenance.mjs\n`
    );
    return 1;
  }
  const onDisk = fs.readFileSync(MANIFEST_PATH, 'utf8');
  if (onDisk === fresh) {
    const n = Object.keys(JSON.parse(fresh)).length;
    process.stdout.write(`vendor-provenance: ${path.relative(REPO_ROOT, MANIFEST_PATH)} matches — ${n} sources\n`);
    return 0;
  }

  // Name what drifted. "The file differs" sends the author to a diff of a generated file;
  // naming the keys sends them to the citation that changed.
  let diskDoc = {};
  try { diskDoc = JSON.parse(onDisk); } catch { diskDoc = null; }
  const freshDoc = JSON.parse(fresh);
  if (diskDoc === null) {
    process.stderr.write(`vendor-provenance: ${path.relative(REPO_ROOT, MANIFEST_PATH)} is not valid JSON. Run: node scripts/vendor-provenance.mjs\n`);
    return 1;
  }
  const keys = new Set([...Object.keys(diskDoc), ...Object.keys(freshDoc)]);
  const drifted = [...keys].sort().filter(
    (k) => JSON.stringify(diskDoc[k]) !== JSON.stringify(freshDoc[k])
  );
  process.stderr.write(
    `vendor-provenance: ${path.relative(REPO_ROOT, MANIFEST_PATH)} has drifted from the lens files.\n` +
    drifted.map((k) => {
      if (!(k in diskDoc)) return `  + ${k} — cited but not recorded`;
      if (!(k in freshDoc)) return `  - ${k} — recorded but no lens cites it`;
      return `  ~ ${k} — recorded record does not match the object`;
    }).join('\n') +
    (drifted.length === 0 ? '  (formatting only)' : '') +
    `\nRun: node scripts/vendor-provenance.mjs\n`
  );
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exit(main());
  } catch (err) {
    process.stderr.write(`vendor-provenance: ${err.message}\n`);
    process.exit(2);
  }
}
