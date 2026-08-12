#!/usr/bin/env node
// POSTURE: BLOCKS. `ledger build --check` exits 1 when the committed index does not
// match what the artifacts say, and `ledger verify` exits 1 when a claim on an
// `enforcement: block` path fails or cannot be resolved. Both run in
// .github/workflows/ci.yml. Everything else is shadow: computed, logged, non-blocking.
//
// scripts/ledger.mjs — the claim ledger.
//
//   node scripts/ledger.mjs build            regenerate .claude/ledger/index.json
//   node scripts/ledger.mjs build --check    exit 1 if the committed index has drifted
//   node scripts/ledger.mjs rebuild          same as build — the name ADR-001 uses
//   node scripts/ledger.mjs lint             parse + schema only (no resolvers)
//   node scripts/ledger.mjs verify           run every resolver, log, block where required
//   node scripts/ledger.mjs verify --offline skip network; report unresolved, never pass
//   node scripts/ledger.mjs judge <claim-id> print the lens pack for a judged claim
//   node scripts/ledger.mjs views            render the generated views over the ledger
//
// THE INDEX IS NEVER HAND-EDITED. It is compiled from claims that live inside the
// artifacts they support, so a claim cannot drift away from the thing it is about.
// `--check` is what makes that true rather than aspirational: edit the index by hand and
// CI fails, exactly as it does for .claude/skills/MANIFEST.json.
//
// BYTE-IDENTICAL FROM A CLEAN CLONE is a design constraint, not a nice-to-have. The
// index therefore contains NO timestamp, no absolute path, no hostname and no machine
// state — only content derived from tracked files, in `git ls-files` order. ADR-001:
// "the DB has no write path of its own... if they disagree, git wins and you rebuild —
// there is no reconciliation path to get wrong."
//
// THREE SCOPES
//   global   ~/.warroom/ledger/global.yml — reaches every project on this machine
//   project  claims in this repository's tracked files → .claude/ledger/index.json
//   task     claims on a branch; they die with the branch because the files do

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseClaimsFromText, parseYamlSubset, validateClaim } = require('./lib/claims.js');
const { loadRules, classifyFile } = require('./lib/classifier.js');
const resolvers = require('./lib/resolvers.js');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const TIER_MAP = path.join(REPO_ROOT, '.claude', 'qa-tier-floor.yml');
const INDEX_PATH = path.join(REPO_ROOT, '.claude', 'ledger', 'index.json');
const GLOBAL_LEDGER = path.join(os.homedir(), '.warroom', 'ledger', 'global.yml');
const INDEX_VERSION = 1;

// ── Where events go ─────────────────────────────────────────────────────────
// The run log the launcher already writes. Resolution order is explicit and the chosen
// path is always printed, because "which log did it write to" is the first question
// asked when a would_block cannot be found.
function eventsPath() {
  if (process.env.WARROOM_EVENTS) return process.env.WARROOM_EVENTS;
  const cfgPath = path.join(REPO_ROOT, '.warroom.yml');
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = parseYamlSubset(fs.readFileSync(cfgPath, 'utf8')) || {};
      const stateDir = cfg.state_dir
        ? String(cfg.state_dir).replace(/^~/, os.homedir())
        : (cfg.session ? path.join(os.homedir(), `.${cfg.session}`) : null);
      if (stateDir) return path.join(stateDir, 'events.jsonl');
    } catch { /* fall through to the in-repo log */ }
  }
  return path.join(REPO_ROOT, '.ledger-events.jsonl');
}

function logEvent(obj) {
  const p = eventsPath();
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, JSON.stringify(obj) + '\n');
    return p;
  } catch (e) {
    process.stderr.write(`ledger: could not write ${p}: ${e.message}\n`);
    return null;
  }
}

// ── Collecting claims ───────────────────────────────────────────────────────

// Files the index is built from: tracked, PLUS untracked-and-not-ignored.
//
// Tracked-only would have been simpler and is wrong. A new doc's claims would then be
// invisible to `ledger lint` until someone remembered to `git add` — a silent skip on
// exactly the question the author is asking ("are my claims checked?"). Untracked files
// are included and *named*, so the one place this can differ from a clean clone is
// reported rather than discovered. On a CI runner there are no untracked files, so the
// two sets coincide and the index reproduces byte-identically.
function candidateMarkdown() {
  let out;
  try {
    out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (e) {
    // Refuse rather than fall back to a directory walk: a walk would sweep in ignored
    // paths and build directories, and the index would stop reproducing from a clone.
    throw new Error(`git ls-files failed (${e.message}) — the index must be built from git's file list so it reproduces from a clean clone`);
  }
  const files = out.split('\0').filter((f) => f && /\.(md|markdown)$/i.test(f));
  files.sort(); // git already sorts, but --others is appended after --cached
  return files;
}

function untrackedAmong(files) {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--others', '--exclude-standard'],
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const untracked = new Set(out.split('\0').filter(Boolean));
    return files.filter((f) => untracked.has(f));
  } catch {
    return [];
  }
}

function collectProjectClaims() {
  const claims = [];
  const issues = [];
  const notes = [];
  const candidates = candidateMarkdown();
  const untracked = untrackedAmong(candidates);
  for (const rel of candidates) {
    const abs = path.join(REPO_ROOT, rel);
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); }
    catch (e) { issues.push(`${rel}: unreadable (${e.message})`); continue; }
    if (!text.includes('claims:')) continue; // cheap pre-filter; the parser decides
    const r = parseClaimsFromText(text, rel);
    claims.push(...r.claims);
    issues.push(...r.issues);
  }
  const seen = new Map();
  for (const c of claims) {
    if (seen.has(c.id)) {
      issues.push(`duplicate claim id "${c.id}" in ${c.source_file} — already defined in ${seen.get(c.id)}`);
    } else {
      seen.set(c.id, c.source_file);
    }
  }
  issues.push(...checkSupports(claims, seen));

  const claimBearingUntracked = untracked.filter((f) => claims.some((c) => c.source_file === f));
  if (claimBearingUntracked.length > 0) {
    notes.push(
      `${claimBearingUntracked.length} untracked file(s) contributed claims — a clean clone would not have them, ` +
      `so this index will not match CI until they are committed: ${claimBearingUntracked.join(', ')}`
    );
  }
  return { claims, issues, notes };
}

// `supports:` is the blast-radius field: when a claim fails or expires, the system is
// supposed to already know which decisions just became questionable. That only works if
// the targets resolve, so they are checked here rather than trusted.
function checkSupports(claims, byId) {
  const issues = [];
  let adrs = [];
  const adrDir = path.join(REPO_ROOT, 'docs', '03-system-design', 'adr');
  if (fs.existsSync(adrDir)) adrs = fs.readdirSync(adrDir);
  for (const c of claims) {
    for (const target of c.supports || []) {
      if (target.startsWith('d-')) {
        const num = target.slice(2);
        if (!adrs.some((f) => f.startsWith(`${num}-`) && f.endsWith('.md'))) {
          issues.push(`${c.source_file}: claim "${c.id}" supports "${target}", but no docs/03-system-design/adr/${num}-*.md exists`);
        }
      } else if (!byId.has(target)) {
        issues.push(`${c.source_file}: claim "${c.id}" supports "${target}", which is not a claim in the ledger`);
      }
    }
  }
  return issues;
}

function collectGlobalClaims() {
  if (!fs.existsSync(GLOBAL_LEDGER)) {
    return { claims: [], issues: [], present: false };
  }
  const text = fs.readFileSync(GLOBAL_LEDGER, 'utf8');
  const doc = parseYamlSubset(text);
  const issues = [];
  const claims = [];
  if (!doc || !Array.isArray(doc.claims)) {
    return { claims: [], issues: [`${GLOBAL_LEDGER}: no "claims:" list`], present: true };
  }
  doc.claims.forEach((c, i) => {
    const where = `~/.warroom/ledger/global.yml claims[${i}]`;
    const problems = validateClaim(c, where);
    issues.push(...problems);
    if (problems.length === 0) {
      if (c.scope !== 'global') issues.push(`${where}: the global ledger may only hold scope:global claims`);
      else claims.push({ ...c, source_file: '~/.warroom/ledger/global.yml', source_line: 0, form: 'global' });
    }
  });
  return { claims, issues, present: true };
}

// ── The index ───────────────────────────────────────────────────────────────

const KEY_ORDER = ['id', 'assert', 'kind', 'scope', 'verified_by', 'evidence',
  'valid_until', 'confidence', 'supports', 'source_file', 'source_line'];

function canonical(claim) {
  const out = {};
  for (const k of KEY_ORDER) {
    if (claim[k] !== undefined) out[k] = claim[k];
  }
  return out;
}

function renderIndex(claims) {
  const sorted = [...claims].sort((a, b) => {
    if (a.scope !== b.scope) return a.scope < b.scope ? -1 : 1;
    if (a.id !== b.id) return a.id < b.id ? -1 : 1;
    return a.source_file < b.source_file ? -1 : 1;
  });
  const body = {
    version: INDEX_VERSION,
    note: 'GENERATED by scripts/ledger.mjs — never hand-edit. Claims live inside the artifacts they support; this is a compiled view. Contains no timestamp so it reproduces byte-identically from a clean clone.',
    total: sorted.length,
    claims: sorted.map(canonical),
  };
  return JSON.stringify(body, null, 2) + '\n';
}

// ── Commands ────────────────────────────────────────────────────────────────

function cmdBuild(argv) {
  const check = argv.includes('--check');
  const { claims, issues, notes } = collectProjectClaims();

  for (const n of notes || []) process.stdout.write(`ledger: note — ${n}\n`);
  if (issues.length > 0) {
    process.stderr.write(`ledger: ${issues.length} claim problem${issues.length === 1 ? '' : 's'} — the index is not written while any claim is malformed:\n`);
    for (const i of issues) process.stderr.write(`  - ${i}\n`);
    return 1;
  }

  const text = renderIndex(claims);
  if (check) {
    if (!fs.existsSync(INDEX_PATH)) {
      process.stderr.write(`ledger: ${path.relative(REPO_ROOT, INDEX_PATH)} is missing — run \`node scripts/ledger.mjs build\`\n`);
      return 1;
    }
    const onDisk = fs.readFileSync(INDEX_PATH, 'utf8');
    if (onDisk !== text) {
      process.stderr.write('ledger: the committed index does not match the claims in the artifacts.\n');
      process.stderr.write('  The index is generated. Run `node scripts/ledger.mjs build` and commit the result.\n');
      process.stderr.write(`  on disk: ${onDisk.length} bytes · regenerated: ${text.length} bytes\n`);
      return 1;
    }
    process.stdout.write(`ledger: index matches — ${claims.length} claims\n`);
    return 0;
  }

  fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
  fs.writeFileSync(INDEX_PATH, text);
  process.stdout.write(`ledger: wrote ${path.relative(REPO_ROOT, INDEX_PATH)} — ${claims.length} claims\n`);
  const byScope = claims.reduce((m, c) => ({ ...m, [c.scope]: (m[c.scope] || 0) + 1 }), {});
  for (const [s, n] of Object.entries(byScope).sort()) process.stdout.write(`  ${s}: ${n}\n`);
  return 0;
}

function cmdLint() {
  const proj = collectProjectClaims();
  const glob = collectGlobalClaims();
  const issues = [...proj.issues, ...glob.issues];
  for (const n of proj.notes || []) process.stdout.write(`ledger lint: note — ${n}\n`);
  process.stdout.write(`ledger lint: ${proj.claims.length} project claims · ${glob.claims.length} global claims`);
  process.stdout.write(glob.present ? '\n' : ' (no ~/.warroom/ledger/global.yml on this machine)\n');
  if (issues.length === 0) {
    process.stdout.write('ledger lint: clean\n');
    return 0;
  }
  for (const i of issues) process.stderr.write(`  ✗ ${i}\n`);
  process.stderr.write(`\nledger lint: ${issues.length} problem${issues.length === 1 ? '' : 's'}\n`);
  return 1;
}

async function cmdVerify(argv) {
  const offline = argv.includes('--offline');
  const skipCommands = argv.includes('--no-exec');
  const scopeArg = (argv.find((a) => a.startsWith('--scope=')) || '').split('=')[1] || null;

  const rules = loadRules(TIER_MAP);
  const proj = collectProjectClaims();
  const glob = collectGlobalClaims();
  const all = [...proj.claims, ...glob.claims].filter((c) => !scopeArg || c.scope === scopeArg);
  const schemaIssues = [...proj.issues, ...glob.issues];

  const evPath = eventsPath();
  process.stdout.write(`ledger verify: ${all.length} claims`);
  if (offline) process.stdout.write(' · offline (network resolvers report unresolved, never pass)');
  process.stdout.write(`\n  events → ${evPath}\n`);
  if (!glob.present) {
    process.stdout.write('  global scope: ~/.warroom/ledger/global.yml not present on this machine — 0 global claims checked (this is reported, not skipped silently)\n');
  }
  process.stdout.write('\n');

  let blocked = 0;
  let wouldBlock = 0;
  let passed = 0;

  for (const claim of all) {
    const cls = claim.scope === 'global'
      ? { enforcement: 'shadow', resolvers: [], tier: 'global' }
      : classifyFile(claim.source_file, rules);
    const names = resolvers.resolversFor(claim, cls.resolvers);

    for (const name of names) {
      let res;
      try {
        res = await resolvers.run(name, claim, { offline, skipCommands, cwd: REPO_ROOT });
      } catch (e) {
        res = { resolver: name, claim_id: claim.id, status: 'unresolved', reason: `resolver error: ${e.message}` };
      }
      const enforcing = cls.enforcement === 'block';
      if (res.status === 'pass') {
        passed++;
        process.stdout.write(`  ✓ ${claim.id} [${name}] ${res.reason}\n`);
        continue;
      }
      const verdict = enforcing ? 'claim.block' : 'claim.would_block';
      if (enforcing) blocked++; else wouldBlock++;
      logEvent({
        ts: Math.floor(Date.now() / 1000),
        event: verdict,
        claim: claim.id,
        resolver: name,
        status: res.status,
        scope: claim.scope,
        artifact: claim.source_file,
        tier: cls.tier,
        enforcement: cls.enforcement,
        reason: res.reason,
        ...(res.detail ? { detail: res.detail } : {}),
      });
      const mark = enforcing ? '✗ BLOCK  ' : '⚠ would_block';
      process.stdout.write(`  ${mark} ${claim.id} [${name}] ${res.status}: ${res.reason}\n`);
    }
  }

  process.stdout.write(`\nledger verify: ${passed} pass · ${wouldBlock} would_block (shadow) · ${blocked} block\n`);
  if (schemaIssues.length > 0) {
    process.stderr.write(`ledger verify: ${schemaIssues.length} schema problem(s) — run \`node scripts/ledger.mjs lint\`\n`);
    return 1;
  }
  if (blocked > 0) {
    process.stderr.write(`ledger verify: ${blocked} claim(s) failed on a path the tier map marks enforcement:block.\n`);
    process.stderr.write('  These are the ADR-001 carve-outs — migration, deploy, harness self-edit — which block from day one.\n');
    return 1;
  }
  return 0;
}

function cmdJudge(argv) {
  const id = argv.find((a) => !a.startsWith('--'));
  if (!id) { process.stderr.write('ledger judge: pass a claim id\n'); return 2; }
  const { claims } = collectProjectClaims();
  const glob = collectGlobalClaims();
  const claim = [...claims, ...glob.claims].find((c) => c.id === id);
  if (!claim) { process.stderr.write(`ledger judge: no claim "${id}"\n`); return 1; }
  if (claim.verified_by !== 'judge') {
    process.stderr.write(`ledger judge: "${id}" is verified_by:${claim.verified_by} — nothing to judge\n`);
    return 1;
  }
  const ev = claim.evidence || {};
  const need = ev.risk === 'high' ? 2 : 1;
  process.stdout.write(`Claim ${claim.id}  (${claim.source_file})\n`);
  process.stdout.write(`  assert: ${claim.assert}\n`);
  process.stdout.write(`  risk:   ${ev.risk} → needs ${need} distinct model famil${need === 1 ? 'y' : 'ies'}\n\n`);
  process.stdout.write('Run each lens independently, then paste the result back into the claim block:\n\n');
  for (const lens of ev.lenses || []) {
    process.stdout.write(`  [${lens}] Judge this assertion through the ${lens} lens. Return pass | fail | unresolved with one sentence of reasoning.\n`);
    process.stdout.write(`      "${claim.assert}"\n\n`);
  }
  process.stdout.write('    judged_by:\n');
  for (let i = 0; i < need; i++) {
    process.stdout.write(`      - {model_family: <family>, model_id: <id>, verdict: <pass|fail|unresolved>, at: <YYYY-MM-DD>}\n`);
  }
  process.stdout.write('\nThis command does not call a model. A resolver that invents a verdict is worse\n');
  process.stdout.write('than one that admits it has none, so an unjudged claim stays `unresolved`.\n');
  return 0;
}

// ── ledger events — the reader ──────────────────────────────────────────────
// Stop condition 2 is "the run log exists four weeks with no reader." Phase 3 shipped a
// log and nothing that reads it, which is that condition starting its clock. This is the
// minimum thing that makes the shadow window reviewable: which claims fired, how often,
// through which resolver, and how recently.
//
// It reports what it SKIPPED as well as what it read. events.jsonl is shared with the
// launcher, so a reader that silently ignores non-claim lines would make the log look
// smaller than it is.

function parseSince(spec, now) {
  if (!spec) return null;
  const rel = String(spec).match(/^(\d+)([dhw])$/);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = { h: 3600, d: 86400, w: 604800 }[rel[2]];
    return Math.floor(now / 1000) - n * unit;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(spec)) {
    const [y, m, d] = spec.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 1000);
  }
  throw new Error(`--since "${spec}" must be like 30d, 12h, 2w or 2026-08-01`);
}

function cmdEvents(argv) {
  const sinceSpec = (argv.find((a) => a.startsWith('--since')) || '').split('=')[1]
    || (argv.includes('--since') ? argv[argv.indexOf('--since') + 1] : null);
  const now = Date.now();
  const since = parseSince(sinceSpec, now);
  const p = eventsPath();

  process.stdout.write(`ledger events: ${p}\n`);
  if (!fs.existsSync(p)) {
    // Not an error, and not silence either: "no log" and "no events" are different
    // states and the reader must not render them the same way.
    process.stdout.write('  the log does not exist yet — nothing has run, or WARROOM_EVENTS points elsewhere\n');
    return 0;
  }

  const lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
  let malformed = 0;
  let nonClaim = 0;
  let outsideWindow = 0;
  const rows = [];
  for (const l of lines) {
    let e;
    try { e = JSON.parse(l); } catch { malformed++; continue; }
    if (!e.event || !String(e.event).startsWith('claim.')) { nonClaim++; continue; }
    if (since !== null && Number(e.ts) < since) { outsideWindow++; continue; }
    rows.push(e);
  }

  const windowLabel = since === null
    ? 'all time'
    : `since ${new Date(since * 1000).toISOString().slice(0, 10)}`;
  process.stdout.write(`  window: ${windowLabel} · ${rows.length} claim events`);
  if (outsideWindow) process.stdout.write(` · ${outsideWindow} older`);
  if (nonClaim) process.stdout.write(` · ${nonClaim} non-claim (launcher)`);
  if (malformed) process.stdout.write(` · ${malformed} unparseable`);
  process.stdout.write('\n\n');

  if (rows.length === 0) {
    process.stdout.write('  no claim events in this window.\n');
    process.stdout.write('  For the resolvers, that is the promotion signal. For the canary, it is an alarm:\n');
    process.stdout.write('  docs/06-codebase/ledger-canary.md is supposed to fire on every single run.\n');
    return 0;
  }

  const byClaim = new Map();
  const byResolver = new Map();
  for (const e of rows) {
    const k = `${e.claim}\u0000${e.resolver}`;
    const c = byClaim.get(k) || { claim: e.claim, resolver: e.resolver, n: 0, blocked: 0, last: 0, reason: '' };
    c.n++;
    if (e.event === 'claim.block') c.blocked++;
    if (Number(e.ts) >= c.last) { c.last = Number(e.ts); c.reason = e.reason || ''; }
    byClaim.set(k, c);

    const r = byResolver.get(e.resolver) || { would: 0, block: 0, claims: new Set() };
    if (e.event === 'claim.block') r.block++; else r.would++;
    r.claims.add(e.claim);
    byResolver.set(e.resolver, r);
  }

  process.stdout.write('BY CLAIM\n');
  const sorted = [...byClaim.values()].sort((a, b) => b.n - a.n || (a.claim < b.claim ? -1 : 1));
  for (const c of sorted) {
    const when = new Date(c.last * 1000).toISOString().slice(0, 10);
    process.stdout.write(`  ${String(c.n).padStart(4)}×  ${c.claim} [${c.resolver}]${c.blocked ? `  (${c.blocked} BLOCKING)` : ''}\n`);
    process.stdout.write(`        last ${when} — ${c.reason.slice(0, 110)}\n`);
  }

  process.stdout.write('\nBY RESOLVER\n');
  for (const [name, r] of [...byResolver.entries()].sort()) {
    process.stdout.write(`  ${name.padEnd(18)} ${String(r.would).padStart(4)} would_block · ${String(r.block).padStart(3)} block · ${r.claims.size} distinct claim(s)\n`);
  }

  process.stdout.write('\nWHAT TO DO WITH THIS\n');
  process.stdout.write('  A resolver whose only would_blocks come from the canary has fired correctly and cost\n');
  process.stdout.write('  nothing all window — that is the evidence that promotes it to blocking.\n');
  process.stdout.write('  A resolver with zero events, canary included, is not quiet: it is not running.\n');
  return 0;
}

function cmdViews() {
  const { claims } = collectProjectClaims();
  const glob = collectGlobalClaims();
  const all = [...claims, ...glob.claims];
  const now = Date.now();

  process.stdout.write('# Ledger views (generated — do not edit)\n\n');
  for (const scope of ['global', 'project', 'task']) {
    const rows = all.filter((c) => c.scope === scope);
    process.stdout.write(`## ${scope} — ${rows.length}\n\n`);
    for (const c of rows.sort((a, b) => (a.id < b.id ? -1 : 1))) {
      const f = resolvers.freshness(c, { now });
      const flag = f.status === 'pass' ? ' ' : '!';
      process.stdout.write(`${flag} ${c.id}  (${c.kind}, ${c.verified_by}, conf ${c.confidence})\n`);
      process.stdout.write(`    ${c.assert}\n`);
      process.stdout.write(`    ${f.reason}  ·  ${c.source_file}\n`);
      if (c.supports && c.supports.length) process.stdout.write(`    supports: ${c.supports.join(', ')}\n`);
      process.stdout.write('\n');
    }
  }
  process.stdout.write('Blast radius: a claim that fails or expires makes everything in its `supports:`\n');
  process.stdout.write('list questionable. That is what the field is for.\n');
  return 0;
}

// ── sweep ───────────────────────────────────────────────────────────────────
//
// The periodic read. Phase 6 replaced `.claude/agents/reader.md` with this
// subcommand: every field of that agent's return contract was a deterministic
// query, and its own anti-patterns forbade the single judgement in scope —
// "DO NOT record a disposition; that is a decision, and decisions have owners".
// An engine that never judges anything is a script that has not been written yet.
//
// Findings come from CURRENT resolver state, never from the event log. `events`
// reports the last event per claim, and that includes failures fixed weeks ago:
// c-one-risk-classifier still shows "exit 1, expected 0" there while the claim
// passes today. A sweep built on the log reports resolved problems as live ones,
// and a report full of false alarms is how a reader becomes the next mechanism
// nobody consumes.
//
// The log is used for the one question it is authoritative about: which resolvers
// produced no events at all. Even that is qualified — only failures are logged, so
// "no events" means "all passing" OR "not running", and only a resolver the canary
// exercises can tell those apart. The rest are reported as unverifiable rather than
// as healthy. Rule 10 applied to the sweep itself: never report what you could not check.

const CANARY_ID = 'c-canary-unresolvable';
const EXPIRING_SOON_DAYS = 14;
const DAY = 86400000;

function stampPath() {
  return path.join(path.dirname(eventsPath()), 'reader-stamp.json');
}

function dayMs(spec) {
  const t = Date.parse(`${spec}T00:00:00Z`);
  return Number.isNaN(t) ? NaN : t;
}

function cmdSweep(argv) {
  const asJson = argv.includes('--json');
  const sinceSpec = (argv.find((a) => a.startsWith('--since=')) || '').split('=')[1]
    || (argv.includes('--since') ? argv[argv.indexOf('--since') + 1] : null)
    || '7d';
  const now = Date.now();
  const since = parseSince(sinceSpec, now);

  const proj = collectProjectClaims();
  const glob = collectGlobalClaims();
  const all = [...proj.claims, ...glob.claims];

  const expired = [];
  const expiringSoon = [];
  const lapsedWaivers = [];

  for (const c of all) {
    const d = c.disposition;
    if (d && d.action === 'waive') {
      // resolvers.waiverState is the ONE implementation of this date rule; the sweep
      // asks it rather than recomputing, for the same reason there is one classifier.
      const w = resolvers.waiverState(c, now);
      if (w.lapsed) {
        // A lapsed waiver IS the finding. Do not also count it as expired — one
        // problem reported twice reads as two problems and dilutes both.
        lapsedWaivers.push({
          id: c.id,
          until: d.until,
          days_over: w.days,
          reason: d.reason || '',
          source_file: c.source_file,
        });
        continue;
      }
    }
    // The canary is BUILT to fail; its expiry is not a finding, its absence is.
    if (c.id === CANARY_ID) continue;

    const f = resolvers.freshness(c, { now });
    if (f.status !== 'pass') {
      expired.push({ id: c.id, valid_until: c.valid_until || null, reason: f.reason, source_file: c.source_file });
      continue;
    }
    if (c.valid_until) {
      const vu = dayMs(c.valid_until);
      if (!Number.isNaN(vu)) {
        const daysLeft = Math.ceil((vu + DAY - now) / DAY);
        if (daysLeft <= EXPIRING_SOON_DAYS) {
          expiringSoon.push({ id: c.id, valid_until: c.valid_until, days_left: daysLeft, source_file: c.source_file });
        }
      }
    }
  }

  // ── the log: resolver liveness only ──
  const evPath = eventsPath();
  const logPresent = fs.existsSync(evPath);
  const seen = new Map();
  let canaryEvents = 0;
  let malformed = 0;
  if (logPresent) {
    for (const l of fs.readFileSync(evPath, 'utf8').split('\n').filter(Boolean)) {
      let e;
      try { e = JSON.parse(l); } catch { malformed++; continue; }
      if (!e.event || !String(e.event).startsWith('claim.')) continue;
      if (since !== null && Number(e.ts) < since) continue;
      seen.set(e.resolver, (seen.get(e.resolver) || 0) + 1);
      if (e.claim === CANARY_ID) canaryEvents++;
    }
  }

  const canaryClaim = all.find((c) => c.id === CANARY_ID);
  const canaryCovers = canaryClaim ? resolvers.resolversFor(canaryClaim, resolvers.RESOLVER_NAMES) : [];
  const silent = [];
  const silenceUnverifiable = [];
  for (const name of resolvers.RESOLVER_NAMES) {
    if (seen.has(name)) continue;
    // NO LOG is not the same as AN EMPTY LOG. Without the file there is nothing to be
    // silent in, so every resolver is unknown rather than dead. Found by running the CI
    // path before shipping it: a fresh runner has no log, so this branch would have filed
    // two findings and failed the scheduled job every single day. A job that is always red
    // is a job nobody reads — the same alarm fatigue that makes an unread report worthless.
    // The invariant is symmetric: never pass what you could not check, and never fail it.
    if (logPresent && canaryCovers.includes(name)) silent.push(name);
    else silenceUnverifiable.push(name);
  }

  const canaryDead = logPresent && canaryEvents === 0;
  const status = logPresent ? 'COMPLETE' : 'PARTIAL';
  const findings = expired.length + lapsedWaivers.length + silent.length + (canaryDead ? 1 : 0);

  const report = {
    status,
    window: sinceSpec,
    swept_at: new Date(now).toISOString(),
    claims_checked: all.length,
    expired: expired.map((e) => e.id),
    expiring_soon: expiringSoon.map((e) => e.id),
    lapsed_waivers: lapsedWaivers.map((e) => e.id),
    silent_resolvers: silent,
    silence_unverifiable: silenceUnverifiable,
    canary_events: canaryEvents,
    canary_alive: !canaryDead,
    log_present: logPresent,
    findings,
  };

  // The stamp is what SessionStart reads to know the sweep is still running.
  // Written on every path, including findings — a stamp records recency, not health.
  try {
    fs.mkdirSync(path.dirname(stampPath()), { recursive: true });
    fs.writeFileSync(stampPath(), `${JSON.stringify(report, null, 2)}\n`);
  } catch (e) {
    process.stderr.write(`ledger sweep: could not write stamp ${stampPath()}: ${e.message}\n`);
  }

  if (asJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return findings > 0 ? 1 : 0;
  }

  const w = (s) => process.stdout.write(s);
  w(`ledger sweep: ${all.length} claims · window ${sinceSpec} · log ${logPresent ? evPath : 'ABSENT'}\n\n`);

  if (!logPresent) {
    w('PARTIAL — the run log does not exist, so resolver liveness could not be checked.\n');
    w('  "no log" and "no events" are different states and this sweep will not render them the same.\n\n');
  }
  if (canaryDead) {
    w('!! CANARY SILENT — zero events from the canary claim in this window.\n');
    w('   The canary is designed to fail on every single run. Zero events does not mean\n');
    w('   everything passed; it means the resolvers are not running. Nothing else in this\n');
    w('   report can be trusted until that is explained.\n\n');
  }
  if (lapsedWaivers.length) {
    w(`LAPSED WAIVERS (${lapsedWaivers.length}) — someone promised to come back and did not\n`);
    for (const l of lapsedWaivers) w(`  ${l.id}  ${l.days_over}d over (until ${l.until}) — ${l.reason}\n     ${l.source_file}\n`);
    w('\n');
  }
  if (expired.length) {
    w(`EXPIRED (${expired.length}) — each needs one disposition: Refresh, Deprecate, or Waive with a date\n`);
    for (const e of expired) w(`  ${e.id}  ${e.reason}\n     ${e.source_file}\n`);
    w('\n');
  }
  if (expiringSoon.length) {
    w(`EXPIRING WITHIN ${EXPIRING_SOON_DAYS}d (${expiringSoon.length}) — flagged early so it is a decision, not a scramble\n`);
    for (const e of expiringSoon) w(`  ${e.id}  ${e.days_left}d left (${e.valid_until})\n`);
    w('\n');
  }
  if (silent.length) {
    w(`SILENT RESOLVERS (${silent.length}) — the canary exercises these and they produced nothing\n`);
    for (const s of silent) w(`  ${s}\n`);
    w('\n');
  }
  if (silenceUnverifiable.length) {
    w(`NO EVENTS, UNVERIFIABLE (${silenceUnverifiable.length}) — ${silenceUnverifiable.join(', ')}\n`);
    // Two different reasons produce this list, and reporting the wrong one is its own small
    // fabrication: with no log there is nothing to be silent in, which is not the same as
    // having a log that no canary exercises.
    w(logPresent
      ? '  Only failures are logged, and no canary exercises these resolvers, so "all passing"\n  and "not running" are indistinguishable here. Reported as unknown, not as healthy.\n\n'
      : '  There is no log on this machine, so liveness is unknowable here rather than bad.\n  Reported as unknown, not as healthy — and not counted as a finding.\n\n');
  }
  if (malformed) w(`  (${malformed} unparseable log line(s) skipped)\n\n`);

  if (findings > 0) {
    w(`${findings} finding(s) need a decision. This sweep reports; it does not fix.\n`);
  } else if (logPresent) {
    w(`CLEAN — ${all.length} claims checked over ${sinceSpec}; canary fired ${canaryEvents}×.\n`);
  } else {
    // Never render a partial run as a clean one. The claims were checked; liveness was not.
    w(`PARTIAL — ${all.length} claims checked over ${sinceSpec}, none failing. Resolver liveness NOT checked (no log).\n`);
  }
  return findings > 0 ? 1 : 0;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const [cmd, ...argv] = process.argv.slice(2);
  switch (cmd) {
    case 'build':
    case 'rebuild':
      return cmdBuild(argv);
    case 'lint':
      return cmdLint();
    case 'verify':
      return cmdVerify(argv);
    case 'judge':
      return cmdJudge(argv);
    case 'events':
      return cmdEvents(argv);
    case 'views':
      return cmdViews();
    case 'sweep':
      return cmdSweep(argv);
    default:
      process.stderr.write('usage: ledger.mjs <build [--check] | rebuild | lint | verify [--offline] [--no-exec] [--scope=X] | judge <id> | events [--since 30d] | views | sweep [--since 7d] [--json]>\n');
      return 2;
  }
}

main().then((code) => process.exit(code)).catch((err) => {
  process.stderr.write(`ledger: ${err.stack || err.message}\n`);
  process.exit(2);
});
