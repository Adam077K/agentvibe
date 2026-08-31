#!/usr/bin/env node
/**
 * bin/fleet-install.mjs — install the agentvibe harness into another project, and answer later
 * whether that project still has it.
 *
 * POSTURE: a tool, not a gate. Nothing in `npm run check` depends on it, and it blocks no build.
 * What it does block is itself: it refuses to overwrite a file the target has edited, and it
 * refuses to report a verdict about a file it could not read.
 *
 * ── WHY A TOOL AND NOT A COPY SCRIPT ─────────────────────────────────────────────────────────
 * Wave 1 of the fleet rollout was a hand-copy into ../beeond. That copy cannot answer the only
 * question that matters a month later — "does the target still have the harness, and is it the
 * same harness?" — because nothing recorded what was copied. So `--verify` against beeond today
 * must answer COULD NOT CHECK, and it does. See the exit codes below; that answer is the point of
 * this file, not a shortcoming of it.
 *
 * ── THE FOUR PROPERTIES, EACH EARNED BY A REAL DEFECT ────────────────────────────────────────
 *
 * 1. DRY RUN IS THE DEFAULT AND `--apply` IS OPT-IN, and an unknown flag is REFUSED.
 *    scripts/verdict.mjs shipped the opposite polarity (#116): `arg()` searched argv for names it
 *    knew and dropped everything else, so a mistyped `--dry-run` was ignored and the real write
 *    happened. The operator's whole reason for typing the flag was that it should not write.
 *    Here the polarity is inverted — you must ASK to write — and an argument this program does not
 *    understand ends the run at exit 2 before anything is read, so a typo cannot silently become
 *    consent.
 *
 *    STRAY POSITIONALS ARE REFUSED TOO, which is where this deliberately parts company with
 *    verdict.mjs. That file leaves them alone because it has commands, so a bare token is
 *    sometimes meaningful. This program has no commands: every input is a flag, so a bare token is
 *    always a mistake — and the specific mistake, `--target ../beeond 2` for `--wave 2`, would
 *    otherwise install nothing and say so in a way that reads like success.
 *
 * 2. THREE-WAY CONFLICT DETECTION. Two-way (source vs target) cannot tell "the target edited this"
 *    from "we shipped a new version" — it sees one difference and has to guess, and the guess that
 *    keeps the tool moving is the one that destroys the local edit. The third leg is the content
 *    hash recorded in the target at the last install:
 *
 *      target absent, no record          create
 *      target absent, record present     deleted upstream of us; re-created by --apply
 *      target == source                  in sync
 *      target != source, target == record   update  (target untouched since install, source moved)
 *      target != source, target != record   CONFLICT — refused, never overwritten
 *      no record at all, target != source   CONFLICT — because "no record" is not "unmodified"
 *
 *    The last row is the one that protects beeond. Its wave-1 files were copied by hand, and
 *    measured 2026-08-31 across the 24 files wave 1 declares: 20 byte-identical, 4 diverged, 0
 *    absent — all four of the four being .test.mjs files, which is what a project adapting a test
 *    suite to itself looks like. With no record there is no basis for calling that divergence
 *    ours, so the tool declines rather than deciding.
 *
 *    AN APPLY IS ALL-OR-NOTHING. One conflict refuses the whole run. A partial install that
 *    reports which parts it managed is the same defect class as a partial check suite reporting a
 *    tally — see scripts/run-checks.mjs, whose refusal discipline this file mirrors throughout.
 *
 * 3. PROVENANCE LIVES IN THE TARGET, at `.harness-version`. It records the source sha, whether
 *    that source tree was dirty when the copy was taken, the hash of the manifest that drove it,
 *    which waves are installed, the date, and a per-file content hash. The per-file hash is the
 *    third leg of the check above; the rest is what lets a reader of the TARGET say where its
 *    harness came from without having the source repo to hand.
 *
 * 4. `--verify` HAS THREE OUTCOMES AND NEVER COLLAPSES THEM.
 *
 *      exit 0  IN SYNC          every declared, copyable file matches the source
 *      exit 1  DRIFTED          at least one differs, and every file was successfully read
 *      exit 2  COULD NOT CHECK  no .harness-version, unreadable target, missing source, or a
 *                               recorded wave the manifest no longer declares
 *
 *    2 DOMINATES 1 DOMINATES 0. A run that found drift AND could not read three files reports 2,
 *    with the drift listed above the verdict — because "drifted" is a complete statement about the
 *    tree and that run did not make one. This is Rule 10 of CLAUDE.md, and scripts/lib/resolvers.js
 *    is the reference implementation: `unresolved` is a third value, never a pass.
 *
 * ── WHAT `author` MEANS, AND WHY IT IS EXCLUDED FROM THE VERDICT ─────────────────────────────
 * Three manifest entries — `.claude/qa-tier-floor.yml`, `scripts/lib/check-suite.js` (the STEPS
 * list) and `.github/workflows/ci.yml`, plus `.claude/skills/MANIFEST.json`, which is generated
 * rather than written — are marked `kind: author`. Each states something about the project it sits
 * in, so a copy of it into another project is a false statement wearing a green check. The
 * installer never writes them and prints the manifest reason instead.
 *
 * `--verify` counts them in their own bucket and they change no verdict. That is NOT the Rule 10
 * fudge it can look like: "could not check" means the tool tried to establish sync and failed,
 * whereas for an `author` entry sync is UNDEFINED — there is no source content it is supposed to
 * equal. Letting them force exit 2 would make every verify return 2 forever, which is the other
 * way to make a verdict meaningless. The summary states the count and the exclusion on every run,
 * so a reader is never handed a bare 0.
 *
 * ── KNOWN LIMITS, STATED RATHER THAN DISCOVERED ──────────────────────────────────────────────
 *   · The recorded hash is over CONTENT ONLY. A mode change in the target — chmod -x on a copied
 *     script — is invisible to `--verify`. Modes are copied on install and not verified after.
 *   · Deletions in the SOURCE are reported as "no longer declared", never as drift, and never
 *     remove anything from the target. This tool adds and updates; it does not prune.
 *   · `--verify` compares the target against the source tree as it is RIGHT NOW, not against the
 *     sha in `.harness-version`. Drift therefore covers both "the target changed" and "agentvibe
 *     moved on", and the per-file detail says which.
 *
 * ── OUTPUT ───────────────────────────────────────────────────────────────────────────────────
 * Every line goes out through `fs.writeSync(1, ...)`. Six scripts in this repo have printed a
 * large payload and exited, cutting stdout at exactly 65536 bytes with status 0; a plan over the
 * whole manifest is well inside that today and would not be after a few more waves. Synchronous
 * writes have handed every byte to the OS by the time they return, EAGAIN retries included.
 *
 * Usage:
 *   node bin/fleet-install.mjs --target DIR --wave 2            plan it, write nothing
 *   node bin/fleet-install.mjs --target DIR --wave 2 --apply    perform it
 *   node bin/fleet-install.mjs --target DIR --wave all --apply  every declared wave
 *   node bin/fleet-install.mjs --target DIR --verify            check what is recorded there
 *   node bin/fleet-install.mjs --target DIR --verify --wave 1   SUBSET; says so in the verdict
 *
 *   FLEET_INSTALL_TEST_HARNESS=1 node bin/fleet-install.mjs --manifest FILE ...
 *     Test-only, and gated on that variable rather than merely documented as test-only, for the
 *     reason scripts/run-checks.mjs gives about `--steps`: an argument that decides WHICH files
 *     constitute the harness decides what the verify verdict is a statement about.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseYamlSubset } = require('../scripts/lib/claims.js');

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_MANIFEST = path.join(REPO, 'fleet', 'MANIFEST.yml');
export const PROVENANCE_FILE = '.harness-version';
export const EXIT = { OK: 0, DRIFT: 1, REFUSED: 2 };

const RULE = '═'.repeat(78);

// ── synchronous output, for the reason in the header ─────────────────────────────────────────
const nap = () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1);

function writeOut(text) {
  const buf = Buffer.from(text, 'utf8');
  let off = 0;
  while (off < buf.length) {
    try {
      off += fs.writeSync(1, buf, off, buf.length - off);
    } catch (err) {
      if (err.code === 'EAGAIN') { nap(); continue; }
      if (err.code === 'EPIPE') return;
      throw err;
    }
  }
}

const w = (line = '') => writeOut(`${line}\n`);

/**
 * Stop before anything has been read or written, loudly and at exit 2.
 *
 * Carries no plan, no tally and no verdict — a refusal that looks like a summary is the defect
 * this file exists to avoid, and the reader of this output may be an agent skimming for a shape.
 */
function refuse(lines) {
  w(RULE);
  w('REFUSED — nothing was read, planned or written. This is NOT a clean target and NOT a');
  w('drifted one; it is a tool that declined to start, and it establishes nothing either way.');
  w('');
  for (const line of lines) w(line);
  w(RULE);
  return EXIT.REFUSED;
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// ── argv ─────────────────────────────────────────────────────────────────────────────────────

/** Every flag this program reads. `true` takes a value, `false` is a bare switch. */
export const FLAGS = {
  '--target': true,
  '--wave': true,
  '--manifest': true,
  '--apply': false,
  '--verify': false,
  '--help': false,
};

const isValue = (tok) => tok !== undefined && !tok.startsWith('--');

/**
 * The first token this program does not accept, or null. Flags AND positionals — see the header
 * for why this is stricter than scripts/verdict.mjs, which has commands and this does not.
 */
export function badToken(argv, flags = FLAGS) {
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i];
    if (!tok.startsWith('--')) return tok;
    if (!Object.prototype.hasOwnProperty.call(flags, tok)) return tok;
    if (flags[tok] && isValue(argv[i + 1])) i += 1;
  }
  return null;
}

/** undefined when absent, null when present with nothing usable after it, else the value. */
function argOf(argv, flag) {
  const i = argv.indexOf(flag);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  return isValue(v) ? v : null;
}

/** `all`, or a comma list of positive integers. Anything else throws its own message. */
export function parseWaves(raw, declared) {
  if (raw === 'all') return [...declared].sort((a, b) => a - b);
  const parts = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) throw new Error(`--wave ${JSON.stringify(raw)} names no wave at all`);
  const out = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) throw new Error(`--wave part ${JSON.stringify(p)} is not a wave number or the word "all"`);
    const n = Number(p);
    if (!declared.includes(n)) {
      throw new Error(`wave ${n} is not declared in the manifest, which declares ${declared.join(', ')}`);
    }
    if (!out.includes(n)) out.push(n);
  }
  return out.sort((a, b) => a - b);
}

const usage = () => [
  'usage: fleet-install.mjs --target DIR (--wave LIST [--apply] | --verify [--wave LIST])',
  '',
  '  --target DIR   the project to install into or check. Must already exist.',
  '  --wave LIST    comma list of wave numbers, or the word "all". Required to install.',
  '  --apply        perform the plan. WITHOUT IT NOTHING IS WRITTEN — dry run is the default.',
  '  --verify       report whether the target still matches, and exit 0 / 1 / 2.',
  '  --manifest F   test-only; needs FLEET_INSTALL_TEST_HARNESS=1.',
];

// ── the manifest ─────────────────────────────────────────────────────────────────────────────

export const KINDS = ['copy', 'copy-tree', 'author'];

/**
 * Read and validate the manifest. Throws with a message naming the file and the problem.
 *
 * VALIDATION IS NOT DECORATION HERE. An entry path that is absolute or climbs with `..` writes
 * outside the target the operator named, so those are refused at load time rather than at write
 * time — before any decision has been taken about whether to write at all.
 */
export function loadManifest(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new Error(`manifest ${file} could not be read: ${err.message}`);
  }

  let doc;
  try {
    doc = parseYamlSubset(text);
  } catch (err) {
    throw new Error(`manifest ${file} is not parseable by parseYamlSubset: ${err.message}`);
  }

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error(`manifest ${file} is not a mapping`);
  }
  if (doc.schema !== 1) {
    throw new Error(`manifest ${file} declares schema ${JSON.stringify(doc.schema)}; this tool reads schema 1`);
  }
  if (!Array.isArray(doc.waves) || doc.waves.length === 0) {
    throw new Error(`manifest ${file} declares no waves`);
  }

  const seen = new Set();
  for (const wave of doc.waves) {
    if (!Number.isInteger(wave.wave)) {
      throw new Error(`manifest ${file}: a wave has no integer "wave" number`);
    }
    if (seen.has(wave.wave)) throw new Error(`manifest ${file}: wave ${wave.wave} is declared twice`);
    seen.add(wave.wave);
    if (!Array.isArray(wave.entries) || wave.entries.length === 0) {
      throw new Error(`manifest ${file}: wave ${wave.wave} declares no entries`);
    }
    for (const e of wave.entries) {
      if (typeof e.path !== 'string' || e.path === '') {
        throw new Error(`manifest ${file}: wave ${wave.wave} has an entry with no path`);
      }
      if (!KINDS.includes(e.kind)) {
        throw new Error(`manifest ${file}: ${e.path} declares kind ${JSON.stringify(e.kind)}; known kinds are ${KINDS.join(', ')}`);
      }
      if (path.isAbsolute(e.path) || e.path.split('/').includes('..')) {
        throw new Error(`manifest ${file}: ${e.path} is absolute or climbs out of the target`);
      }
      if (e.kind === 'copy-tree' && !e.path.endsWith('/**')) {
        throw new Error(`manifest ${file}: ${e.path} is kind copy-tree but does not end in /**`);
      }
      if (e.kind === 'author' && (typeof e.why !== 'string' || e.why.trim() === '')) {
        throw new Error(`manifest ${file}: ${e.path} is kind author with no "why". An entry the installer refuses to copy must say why, or the refusal is unactionable.`);
      }
    }
  }

  return { doc, text, sha: sha256(text), file };
}

/** Every file under `dir`, repo-relative, sorted. Returns null when dir is not a directory. */
function walk(root, rel) {
  const abs = path.join(root, rel);
  let st;
  try {
    st = fs.statSync(abs);
  } catch {
    return null;
  }
  if (!st.isDirectory()) return null;

  const out = [];
  const stack = [rel];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(path.join(root, cur), { withFileTypes: true })) {
      const child = `${cur}/${ent.name}`;
      if (ent.isDirectory()) stack.push(child);
      else if (ent.isFile()) out.push(child);
    }
  }
  return out.sort();
}

/**
 * Manifest entries for the named waves, with copy-tree expanded against the source tree.
 *
 * A copy-tree that resolves to no directory, or to a directory with no files in it, becomes ONE
 * entry with status `source-missing` rather than vanishing. A declaration that expands to nothing
 * and reports nothing is indistinguishable from a declaration that was satisfied.
 */
export function expand(manifest, waves, sourceRoot) {
  const out = [];
  for (const wave of manifest.doc.waves) {
    if (!waves.includes(wave.wave)) continue;
    for (const e of wave.entries) {
      const common = { wave: wave.wave, waveId: wave.id, kind: e.kind, why: e.why, declared: e.path };
      if (e.kind !== 'copy-tree') {
        out.push({ ...common, path: e.path });
        continue;
      }
      const base = e.path.slice(0, -3);
      const files = walk(sourceRoot, base);
      if (files === null || files.length === 0) {
        out.push({ ...common, path: e.path, treeEmpty: true });
        continue;
      }
      for (const f of files) out.push({ ...common, kind: 'copy', path: f });
    }
  }
  return out;
}

// ── provenance ───────────────────────────────────────────────────────────────────────────────

export function readProvenance(targetRoot) {
  const abs = path.join(targetRoot, PROVENANCE_FILE);
  let text;
  try {
    text = fs.readFileSync(abs, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { status: 'absent', reason: `no ${PROVENANCE_FILE} in the target` };
    return { status: 'unreadable', reason: `${PROVENANCE_FILE}: ${err.message}` };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    return { status: 'unreadable', reason: `${PROVENANCE_FILE} is not valid JSON: ${err.message}` };
  }
  if (!data || typeof data !== 'object' || !data.files || typeof data.files !== 'object') {
    return { status: 'unreadable', reason: `${PROVENANCE_FILE} has no "files" map, so no per-file hash is recorded` };
  }
  return { status: 'ok', data };
}

function sourceProvenance() {
  const git = (args) => {
    try {
      return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      return null;
    }
  };
  const sha = git(['rev-parse', 'HEAD']);
  const status = git(['status', '--porcelain']);
  return {
    // null, never a placeholder: a fabricated sha in a provenance file is worse than an absent one.
    source_sha: sha ? sha.trim() : null,
    source_dirty: status === null ? null : status.trim() !== '',
  };
}

// ── the three-way check ──────────────────────────────────────────────────────────────────────

export function classifyEntry(entry, sourceRoot, targetRoot, records) {
  if (entry.kind === 'author') {
    return { ...entry, status: 'author', detail: entry.why };
  }
  if (entry.treeEmpty) {
    return { ...entry, status: 'source-missing', detail: `${entry.declared} names a directory that does not exist in the source, or one holding no files` };
  }

  let src;
  try {
    src = fs.readFileSync(path.join(sourceRoot, entry.path));
  } catch (err) {
    return { ...entry, status: 'source-missing', detail: `source unreadable: ${err.message}` };
  }
  const srcHash = sha256(src);

  let tgt = null;
  try {
    tgt = fs.readFileSync(path.join(targetRoot, entry.path));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      return { ...entry, status: 'target-unreadable', detail: err.message, srcHash };
    }
  }

  const recorded = records[entry.path] ? records[entry.path].sha256 : null;

  if (tgt === null) {
    return recorded
      ? { ...entry, status: 'deleted', srcHash, recorded, detail: 'installed once and no longer present in the target' }
      : { ...entry, status: 'create', srcHash, recorded, detail: 'not present in the target' };
  }

  const tgtHash = sha256(tgt);
  if (tgtHash === srcHash) {
    return { ...entry, status: 'in-sync', srcHash, tgtHash, recorded };
  }
  if (recorded && tgtHash === recorded) {
    return { ...entry, status: 'update', srcHash, tgtHash, recorded, detail: 'unchanged since install; the source has moved on' };
  }
  return {
    ...entry,
    status: 'conflict',
    srcHash,
    tgtHash,
    recorded,
    detail: recorded
      ? 'differs from the source AND from the content recorded at install — the target edited it'
      : `differs from the source and nothing is recorded for it, so there is no basis for calling the difference ours`,
  };
}

const BLOCKING = new Set(['source-missing', 'target-unreadable']);

// ── shared preamble ──────────────────────────────────────────────────────────────────────────

function resolveTarget(raw) {
  const abs = path.resolve(process.cwd(), raw);
  let st;
  try {
    st = fs.statSync(abs);
  } catch (err) {
    return { error: `--target ${raw} could not be read: ${err.message}`, abs };
  }
  if (!st.isDirectory()) return { error: `--target ${raw} is not a directory`, abs };
  return { abs };
}

function group(plan, status) {
  return plan.filter((p) => p.status === status);
}

function listFiles(label, rows, withDetail = false) {
  if (rows.length === 0) return;
  w('');
  w(`${label} (${rows.length})`);
  for (const r of rows) {
    w(`  ${r.path}`);
    if (withDetail && r.detail) w(`      ${r.detail}`);
  }
}

// ── install ──────────────────────────────────────────────────────────────────────────────────

function install({ manifest, waves, targetRoot, targetRaw, apply }) {
  const entries = expand(manifest, waves, REPO);
  const prov = readProvenance(targetRoot);

  if (prov.status === 'unreadable') {
    return refuse([
      `The target already has a ${PROVENANCE_FILE} and it cannot be used: ${prov.reason}`,
      'Without it the three-way check has no third leg, so every differing file would be a',
      'conflict and every matching one would be recorded from nothing. Fix or delete the file.',
    ]);
  }
  const records = prov.status === 'ok' ? prov.data.files : {};

  const plan = entries.map((e) => classifyEntry(e, REPO, targetRoot, records));

  w(RULE);
  w(`fleet install — ${apply ? 'APPLY' : 'DRY RUN, nothing will be written'}`);
  w(RULE);
  w(`  source    ${REPO}`);
  const sp = sourceProvenance();
  w(`            sha ${sp.source_sha || 'UNKNOWN — git could not be read'}${sp.source_dirty ? ' (working tree DIRTY)' : ''}`);
  w(`  manifest  ${path.relative(REPO, manifest.file) || manifest.file}  sha256 ${manifest.sha.slice(0, 16)}`);
  w(`  target    ${targetRoot}`);
  w(`  waves     ${waves.join(', ')}  of ${manifest.doc.waves.map((x) => x.wave).join(', ')} declared`);
  w(`  recorded  ${prov.status === 'ok' ? `${Object.keys(records).length} file(s), waves ${(prov.data.waves || []).join(', ') || 'none'}` : `none — ${prov.reason}`}`);

  const blocked = plan.filter((p) => BLOCKING.has(p.status));
  if (blocked.length) {
    w('');
    w(RULE);
    w(`REFUSED — ${blocked.length} declared file(s) could not be read, so this plan is incomplete.`);
    w('Nothing was written. A plan that silently omits what it could not see is the one thing');
    w('worse than no plan, because the summary under it would be true of a smaller job.');
    for (const b of blocked) w(`  ? ${b.path} — ${b.detail}`);
    w(RULE);
    return EXIT.REFUSED;
  }

  const creates = group(plan, 'create');
  const deleted = group(plan, 'deleted');
  const updates = group(plan, 'update');
  const inSync = group(plan, 'in-sync');
  const conflicts = group(plan, 'conflict');
  const authors = group(plan, 'author');

  listFiles('CREATE — not present in the target', creates);
  listFiles('RE-CREATE — recorded as installed, missing now', deleted);
  listFiles('UPDATE — untouched in the target, newer in the source', updates);
  listFiles('IN SYNC — already byte-identical', inSync);
  listFiles('CONFLICT — differs from BOTH source and record; NOT overwritten', conflicts, true);

  if (authors.length) {
    w('');
    w(`AUTHOR-REQUIRED — NOT copied, by declaration (${authors.length})`);
    for (const a of authors) {
      w(`  ${a.path}`);
      w(`      ${a.why}`);
    }
  }

  w('');
  w(RULE);
  w(`Plan: ${creates.length} create · ${deleted.length} re-create · ${updates.length} update · ${inSync.length} in sync · ${conflicts.length} conflict · ${authors.length} author-required`);

  if (conflicts.length) {
    w('');
    w(`REFUSED — ${conflicts.length} file(s) carry edits this tool did not make.`);
    w('NOTHING WAS WRITTEN. An apply here is all-or-nothing: a partial install that reports which');
    w('parts it managed is a partial run wearing a complete verdict. Reconcile each file above by');
    w('hand, or move it aside, then run again.');
    w(RULE);
    return EXIT.DRIFT;
  }

  const toWrite = [...creates, ...deleted, ...updates];

  if (!apply) {
    w('');
    w(`DRY RUN — nothing was written. ${toWrite.length} file(s) would be written, ${authors.length} would not.`);
    w('Re-run with --apply to perform it.');
    w(RULE);
    return EXIT.OK;
  }

  // ── from here on, the tree is being changed ──────────────────────────────────────────────
  const body = buildProvenance({ manifest, waves, plan, prov, sp });
  const noop = toWrite.length === 0 && provenanceUnchanged(prov, body);

  if (noop) {
    w('');
    w(`NO-OP — every declared file was already in sync and ${PROVENANCE_FILE} already says so.`);
    w('Not one byte was written. Re-running an apply is meant to be free, and this is that.');
    w(RULE);
    return EXIT.OK;
  }

  const written = [];
  for (const p of toWrite) {
    const from = path.join(REPO, p.path);
    const to = path.join(targetRoot, p.path);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, fs.readFileSync(from));
    fs.chmodSync(to, fs.statSync(from).mode & 0o777);
    written.push(p.path);
  }
  fs.writeFileSync(path.join(targetRoot, PROVENANCE_FILE), `${JSON.stringify(body, null, 2)}\n`);

  w('');
  w(`APPLIED — wrote ${written.length} file(s) and ${PROVENANCE_FILE}.`);
  if (authors.length) {
    w(`${authors.length} author-required entr${authors.length === 1 ? 'y was' : 'ies were'} NOT written; each is listed above with its reason.`);
    w('The target is not finished until they exist there, written for that project.');
  }
  w(`Check it later with: node bin/fleet-install.mjs --target ${targetRaw} --verify`);
  w(RULE);
  return EXIT.OK;
}

/**
 * The record this run leaves behind. Merges with what is already there: a wave installed by an
 * earlier run keeps its file hashes, because forgetting them would turn every one of its files
 * into a conflict on the next run.
 */
function buildProvenance({ manifest, waves, plan, prov, sp }) {
  const prior = prov.status === 'ok' ? prov.data : {};
  const files = { ...(prior.files || {}) };
  for (const p of plan) {
    if (p.kind === 'author' || !p.srcHash) continue;
    files[p.path] = { wave: p.wave, sha256: p.srcHash };
  }
  const allWaves = [...new Set([...(Array.isArray(prior.waves) ? prior.waves : []), ...waves])].sort((a, b) => a - b);
  return {
    schema: 1,
    source_repo: manifest.doc.source_repo || 'agentvibe',
    source_sha: sp.source_sha,
    source_dirty: sp.source_dirty,
    manifest_path: path.relative(REPO, manifest.file) || manifest.file,
    manifest_sha256: manifest.sha,
    waves: allWaves,
    installed_at: new Date().toISOString(),
    installed_by: 'bin/fleet-install.mjs',
    files: Object.fromEntries(Object.keys(files).sort().map((k) => [k, files[k]])),
  };
}

/** True when the only difference from what is on disk is the timestamp. */
function provenanceUnchanged(prov, body) {
  if (prov.status !== 'ok') return false;
  const a = JSON.stringify({ ...prov.data, installed_at: null });
  const b = JSON.stringify({ ...body, installed_at: null });
  return a === b;
}

// ── verify ───────────────────────────────────────────────────────────────────────────────────

function verify({ manifest, waveArg, targetRoot, subset }) {
  const prov = readProvenance(targetRoot);

  w(RULE);
  w('fleet verify');
  w(RULE);
  w(`  target    ${targetRoot}`);
  w(`  source    ${REPO}`);
  w(`  manifest  ${path.relative(REPO, manifest.file) || manifest.file}  sha256 ${manifest.sha.slice(0, 16)}`);

  if (prov.status !== 'ok') {
    w('');
    w(RULE);
    w('COULD NOT CHECK — exit 2. This is NOT "in sync" and NOT "drifted".');
    w('');
    w(`  ${prov.reason}`);
    w('');
    w('The three-way check needs a per-file hash recorded in the target, and there is none here.');
    w('Comparing the two trees anyway would answer a different question — whether the files happen');
    w('to match today — and reporting that as a harness check is how a tool starts lying. If this');
    w('target was populated by hand, adopt it: run --apply for the waves it holds. Files that');
    w('already match are recorded as-is; files that differ are refused as conflicts, one by one,');
    w('for a person to reconcile.');
    w(RULE);
    return EXIT.REFUSED;
  }

  const declared = manifest.doc.waves.map((x) => x.wave);
  const recordedWaves = Array.isArray(prov.data.waves) ? prov.data.waves : [];
  const missingWaves = recordedWaves.filter((x) => !declared.includes(x));
  const waves = waveArg ? waveArg : recordedWaves.filter((x) => declared.includes(x));

  w(`  recorded  sha ${prov.data.source_sha || 'unknown'}${prov.data.source_dirty ? ' (source was DIRTY)' : ''}, installed ${prov.data.installed_at || 'at an unrecorded time'}`);
  w(`  waves     ${waves.length ? waves.join(', ') : 'none'}${subset ? '  — SUBSET, named on the command line, not the whole recorded install' : '  (from the record)'}`);

  const entries = expand(manifest, waves, REPO);
  const plan = entries.map((e) => classifyEntry(e, REPO, targetRoot, prov.data.files));

  const declaredPaths = new Set(plan.map((p) => p.path));
  const orphans = Object.keys(prov.data.files)
    .filter((p) => !declaredPaths.has(p))
    .filter((p) => waves.includes(prov.data.files[p].wave))
    .sort();

  const drifted = [...group(plan, 'update'), ...group(plan, 'conflict'), ...group(plan, 'deleted')];
  const unchecked = plan.filter((p) => BLOCKING.has(p.status));
  const inSync = group(plan, 'in-sync');
  const creates = group(plan, 'create');
  const authors = group(plan, 'author');

  // A declared file absent from the target is drift, not "create": verify is not planning an
  // install, it is answering whether the harness is there, and a file that is gone is not there.
  drifted.push(...creates);

  if (missingWaves.length) {
    w('');
    w(`RECORDED WAVE NOT DECLARED (${missingWaves.length})`);
    for (const m of missingWaves) w(`  wave ${m} — installed here, and the manifest no longer describes it`);
  }

  listFiles('DRIFTED', drifted, true);
  listFiles('COULD NOT CHECK', unchecked, true);
  listFiles('IN SYNC', inSync);

  if (orphans.length) {
    w('');
    w(`NO LONGER DECLARED — informational, and part of no verdict (${orphans.length})`);
    w('  Installed once; the manifest does not name them now. This tool never prunes.');
    for (const o of orphans) w(`  ${o}`);
  }

  if (authors.length) {
    w('');
    w(`AUTHOR-REQUIRED — excluded from the verdict by design (${authors.length})`);
    w('  Each is written per-project, so there is no source content it is supposed to equal and');
    w('  "in sync" is undefined for it. Excluded rather than counted as could-not-check, which');
    w('  would make every verify return 2 forever.');
    for (const a of authors) w(`  ${a.path}`);
  }

  const checkable = plan.filter((p) => p.kind !== 'author').length;

  w('');
  w(RULE);
  w(`Tally: ${inSync.length} in sync · ${drifted.length} drifted · ${unchecked.length} could not be checked · ${authors.length} author-required, excluded`);

  if (unchecked.length || missingWaves.length || waves.length === 0) {
    w('');
    w('COULD NOT CHECK — exit 2. It says nothing about the files it did read, including the');
    w(`${drifted.length} listed as drifted above, because a partial answer is not this verdict.`);
    if (waves.length === 0) w('  No wave was checked at all: the record names none this manifest declares.');
    w(RULE);
    return EXIT.REFUSED;
  }

  if (drifted.length) {
    w('');
    w(`DRIFTED — exit 1. ${drifted.length} of ${checkable} checkable file(s) do not match the source.`);
    w('Each line above says whether the target changed, the source moved on, or both.');
    w(RULE);
    return EXIT.DRIFT;
  }

  w('');
  if (subset) {
    w(`IN SYNC for the ${waves.length} wave(s) NAMED — exit 0. This is a SUBSET: it says nothing`);
    w(`about the other recorded wave(s), and is not a statement that the target holds the harness.`);
  } else {
    w(`IN SYNC — exit 0. All ${checkable} checkable file(s) of wave(s) ${waves.join(', ')} match the source.`);
  }
  if (authors.length) w(`${authors.length} author-required entr${authors.length === 1 ? 'y is' : 'ies are'} outside this verdict; see above.`);
  w(RULE);
  return EXIT.OK;
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────

export function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.length === 0) {
    for (const line of usage()) w(line);
    return argv.length === 0 ? EXIT.REFUSED : EXIT.OK;
  }

  const bad = badToken(argv);
  if (bad !== null) {
    return refuse([
      `${JSON.stringify(bad)} is not something this program reads.`,
      'Refused rather than ignored. A tool that drops an argument it does not know has a caller who',
      'believes it took effect, and the argument most often mistyped here is the one that decides',
      'whether anything is written at all.',
      '',
      ...usage(),
    ]);
  }

  const manifestArg = argOf(argv, '--manifest');
  if (manifestArg !== undefined && process.env.FLEET_INSTALL_TEST_HARNESS !== '1') {
    return refuse([
      '--manifest — test-only, and this process was not started by the test harness.',
      'The manifest decides WHICH files constitute the harness, so it decides what a verify verdict',
      'is a statement about. An exit 0 driven by an operator-supplied file list is not the promise',
      'this tool makes.',
    ]);
  }
  if (manifestArg === null) {
    return refuse(['--manifest was given with no value after it.']);
  }

  const targetArg = argOf(argv, '--target');
  if (targetArg === undefined) return refuse(['--target is required.', '', ...usage()]);
  if (targetArg === null) return refuse(['--target was given with no value after it.']);

  const doVerify = argv.includes('--verify');
  const doApply = argv.includes('--apply');
  if (doVerify && doApply) {
    return refuse([
      '--verify and --apply together. One reports and the other writes; run them separately so it',
      'is never ambiguous which of the two an exit code came from.',
    ]);
  }

  let manifest;
  try {
    manifest = loadManifest(manifestArg || DEFAULT_MANIFEST);
  } catch (err) {
    return refuse([err.message]);
  }

  const declaredWaves = manifest.doc.waves.map((x) => x.wave);
  const waveRaw = argOf(argv, '--wave');
  if (waveRaw === null) return refuse(['--wave was given with no value after it.']);
  if (waveRaw === undefined && !doVerify) {
    return refuse([
      '--wave is required to install. It is not defaulted to "all" on purpose: installing every',
      'wave of a harness into a project is a decision, and a default is not one.',
      `Declared waves: ${declaredWaves.join(', ')}.  Use --wave all to mean all of them.`,
    ]);
  }
  let waves = null;
  if (waveRaw !== undefined) {
    try {
      waves = parseWaves(waveRaw, declaredWaves);
    } catch (err) {
      return refuse([err.message]);
    }
  }

  const target = resolveTarget(targetArg);
  if (target.error) {
    return refuse([
      target.error,
      'The target must already exist. Creating a project directory is not the job of this tool — it',
      'ports a harness into a project that is already there.',
    ]);
  }

  return doVerify
    ? verify({ manifest, waveArg: waves, targetRoot: target.abs, subset: waves !== null })
    : install({ manifest, waves, targetRoot: target.abs, targetRaw: targetArg, apply: doApply });
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  // process.exitCode, not process.exit: the discipline scripts/run-checks.mjs states. Every byte
  // here already went out through fs.writeSync so nothing could be truncated either way, and the
  // rule is kept rather than reasoned around each time.
  process.exitCode = main();
}
