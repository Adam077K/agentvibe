#!/usr/bin/env node
// POSTURE: TOOL. `plan` is read-only and always exits 0 unless it cannot read the tree.
// `apply` writes, and REFUSES — exit 1, nothing written — when a named entry is pinned by
// rule 1 or rule 3. It is not wired into `npm run check`: a tool that mutates memory files
// must be run deliberately, by a human or by an agent that meant to. What IS wired into the
// suite is `scripts/evict-memory.test.mjs`, which pins every refusal by mutation.
//
// scripts/evict-memory.mjs — typed, dependency-linked eviction for .claude/memory/DECISIONS.md.
//
//   node scripts/evict-memory.mjs plan                    classify every entry, write nothing
//   node scripts/evict-memory.mjs plan --json             the same, machine-readable
//   node scripts/evict-memory.mjs apply --only <sel>...   evict the named entries
//   node scripts/evict-memory.mjs apply --only <sel> --dry-run   compute the write, skip it
//
// A selector is `YYYY-MM-DD` when that date is unique in the file, or `YYYY-MM-DD::<substring
// of the title>` when it is not. Six live entries share 2026-08-11, so the second form is the
// normal one. A selector matching zero or more than one entry is an error, never a guess:
// `apply` picking "the first 2026-08-11" would delete a body the caller did not look at.
//
// `--reason` may be given once for the whole batch, or once per `--only` in the same order.
//
// ── READ THE `net` COLUMN OF `plan` BEFORE CHOOSING WHAT TO EVICT ───────────────────────────
//
// Eviction does not free an entry's size; it frees the entry MINUS the stub that replaces it,
// and the stub grows with the number of citations it must name. So the number worth acting on is
// not size and not age: a small, heavily-cited entry is load-bearing, and the residue rule says
// so in bytes before you commit. On the live file there is an entry whose stub very nearly
// outweighs its body, and it was left in place for that reason.
//
// NO WORKED EXAMPLE IS QUOTED HERE, AND THAT IS THE SECOND VERSION OF THIS COMMENT. The first
// said the entry "is 1,035 bytes, cited in 23 places, so its stub came to 1,004 and evicting it
// freed 31 bytes." Every figure was a true measurement and the sentence was still wrong, because
// `net` is not a property of an entry — it is a function of (entry, stub format, `--reason`).
// A reviewer re-running it measured 123 and was equally right: they used the DEFAULT reason where
// the original run used a 187-byte one, and the stub format had since gained a line. Three
// numbers, one entry, no contradiction, and a header that read as though the entry had a fixed
// answer. Ask `plan`, which computes it against the real volume, the real default reason and the
// real trailing bytes — and states in `net_basis` what it assumed.
//
// ── THE RULES ARE IN scripts/lib/memory-entries.js, NOT HERE ────────────────────────────────
//
// This file is the CLI and the writer. Classification — rules 1 through 3, subject existence,
// the citation scan — lives in the library, so `check-memory-budget.mjs` and this tool cannot
// drift into two answers about what an entry is. Read the library header first; it explains why
// eviction is typed rather than by recency, and what the scan cannot see.
//
// ── WHERE THE EVICTED BYTES GO, AND WHY THAT IS THE HARD PART ───────────────────────────────
//
// The archive carries the SAME 40,000-byte cap as DECISIONS.md and, measured on this branch
// before the first rotation, already held 34,472 of it. So moving entries out of DECISIONS.md
// relocates the pressure instead of relieving it — a fact TARGET-ARCHITECTURE.md §7 predicted
// in as many words ("otherwise the pressure simply relocates"), and the only outcome a single
// capped archive can reach is the one nobody wants: a cap that can only be met by deleting
// history will be met by deleting history.
//
// SO THE ARCHIVE ROTATES INTO INDEPENDENTLY CAPPED VOLUMES.
//
//   volume 1  .claude/memory/DECISIONS_ARCHIVE.md      (the legacy name, kept)
//   volume 2  .claude/memory/DECISIONS_ARCHIVE_002.md
//   volume N  .claude/memory/DECISIONS_ARCHIVE_00N.md
//
// Every volume is capped at 40,000 by `check-memory-budget.mjs`, which globs the set rather
// than naming one file. What that bounds is the thing worth bounding: what any single reader
// must load. It does NOT bound the lifetime total, and it is not pretending to — the lifetime
// total of an append-only decision log SHOULD grow, and a mechanism that caps it is a mechanism
// for losing decisions.
//
// THE BRIEF PROPOSED KEYING VOLUMES BY PERIOD (`DECISIONS_ARCHIVE_<period>.md`) AND THIS KEYS
// THEM BY SEQUENCE. Same design, different key, and the reason is that a period key needs a
// second rule the moment one period overflows: nothing stops a single month's eviction from
// exceeding 40,000 bytes, and then `DECISIONS_ARCHIVE_2026-08.md` needs a suffix, which is a
// sequence number wearing a date's clothes. A sequence key needs one rule and cannot breach.
// The period is not lost — each volume header records the span it covers, and every entry
// inside carries its own date, which is where a date cannot drift from its content.
//
// THE WRITER STOPS AT 90% OF THE CAP, NOT AT THE CAP. `check-memory-budget.mjs` is the hard
// wall; this tool must not park a volume against it. A volume filled to 39,980 bytes is a file
// that fails CI the next time anyone corrects a typo in it — the failure would be real, blocking,
// and about nothing. The 10% reserve is expressed against the cap rather than as a byte count so
// that changing the cap moves it too.
//
// ── ONE EVICTION EVENT WRITES TO ONE VOLUME ─────────────────────────────────────────────────
//
// The batch goes to the highest-numbered volume that can hold ALL of it under the fill ceiling,
// or to a new volume. It is never split across two. Splitting would put records created by one
// decision in two files for no reason a later reader could reconstruct, and it would make the
// "did every byte survive?" arithmetic a two-file sum — which is the check most likely to be
// skipped when it is inconvenient.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  parseDecisionEntries,
  classifyEntry,
  loadClaims,
} = require('./lib/memory-entries.js');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

/**
 * Volume byte cap. Deliberately the same constant `check-memory-budget.mjs` enforces — the two
 * are asserted equal by scripts/evict-memory.test.mjs, so this cannot silently become the more
 * generous of two numbers.
 */
const VOLUME_BYTE_CAP = 40_000;

/** The writer's ceiling: 90% of the cap. See the reserve note in this file's header. */
const VOLUME_FILL_CEILING = Math.floor(VOLUME_BYTE_CAP * 0.9);

/**
 * The reason written into a stub when `--reason` is not given.
 *
 * Module scope, because `plan` prices its projection with it and `apply` writes it. Two copies
 * would drift, and the drift would land in `net` — the one number the operator acts on.
 */
const DEFAULT_REASON = 'Superseded or complete; the body is preserved verbatim in the volume named above.';

const MEMORY_DIR = ['.claude', 'memory'];
const DECISIONS_REL = '.claude/memory/DECISIONS.md';
// `\d{3,}` and not `\d{3}`: at volume 1000 `padStart(3)` emits four digits, and a three-digit
// pattern would stop recognising the tool's own output — so `targetVolume` would compute
// "volume 1" and `apply` would open a file that already held history. The existsSync guard in
// `cmdApply` is the belt to this braces; both are needed, because the guard also covers a
// case-insensitive filesystem collision that no regex can see.
const VOLUME_RE = /^DECISIONS_ARCHIVE(?:_(\d{3,}))?\.md$/;

// ── argv ────────────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const cmd = argv[0];
const flagValue = (name) => {
  const i = argv.indexOf(name);
  return i === -1 || i + 1 >= argv.length ? null : argv[i + 1];
};
const flagValues = (name) => {
  const out = [];
  for (let i = 0; i < argv.length; i++) if (argv[i] === name && argv[i + 1]) out.push(argv[i + 1]);
  return out;
};
const has = (name) => argv.includes(name);

const ROOT = path.resolve(flagValue('--root') || REPO);
const JSON_OUT = has('--json');
const DRY_RUN = has('--dry-run');
// LOCAL date, not `toISOString()`. The stub date is read by a human against their own clock, and
// at UTC+0300 `toISOString()` stamps yesterday for three hours every evening — a date that is
// wrong in the direction of looking older than it is, in a file whose whole job is provenance.
const TODAY = flagValue('--date') || (() => {
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
})();

// ── tree access ─────────────────────────────────────────────────────────────────────────────

/**
 * The tracked+untracked file list, from git, for the citation scan.
 *
 * Returns null rather than falling back to a directory walk. A walk would sweep node_modules
 * and build output into the scan, so an entry could look "cited" by a vendored copy of itself —
 * and, worse, the answer would differ between a working tree and a clean clone. When this
 * returns null the caller reports the scan as UNPERFORMED. Rule 10: a resolver never passes
 * what it could not check.
 */
function listFiles(root) {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    return out.split('\0').filter(Boolean);
  } catch {
    return null;
  }
}

function decisionsPath(root) { return path.join(root, ...MEMORY_DIR, 'DECISIONS.md'); }

/** Every archive volume on disk, lowest number first. Volume 1 is the un-suffixed legacy name. */
function volumes(root) {
  const dir = path.join(root, ...MEMORY_DIR);
  let names;
  try { names = fs.readdirSync(dir); } catch { return []; }
  return names
    .map((name) => ({ name, m: name.match(VOLUME_RE) }))
    .filter((v) => v.m)
    .map((v) => ({
      number: v.m[1] ? Number(v.m[1]) : 1,
      name: v.name,
      abs: path.join(dir, v.name),
      bytes: Buffer.byteLength(fs.readFileSync(path.join(dir, v.name), 'utf8'), 'utf8'),
    }))
    .sort((a, b) => a.number - b.number);
}

function volumeName(number) {
  return number === 1 ? 'DECISIONS_ARCHIVE.md' : `DECISIONS_ARCHIVE_${String(number).padStart(3, '0')}.md`;
}

/**
 * Which volume takes this batch: the highest-numbered one that can hold all of it under the
 * fill ceiling, else the next number up.
 *
 * "Highest-numbered" and not "any with room" on purpose. Backfilling a gap in an older volume
 * would interleave eviction events across the archive, so reading the history in order would
 * mean reading every volume. Monotonic append keeps volume order and chronological order the
 * same fact.
 */
function targetVolume(root, batchBytes) {
  const vols = volumes(root);
  const newest = vols.length ? vols[vols.length - 1] : null;
  if (newest && newest.bytes + batchBytes <= VOLUME_FILL_CEILING) {
    return { ...newest, fresh: false };
  }
  const number = newest ? newest.number + 1 : 1;
  const name = volumeName(number);
  return {
    number, name, abs: path.join(root, ...MEMORY_DIR, name), bytes: 0, fresh: true,
  };
}

// ── residue ─────────────────────────────────────────────────────────────────────────────────

/**
 * The stub that survives an eviction — RULE 4. Without it, archival is deletion with extra steps.
 *
 * Shape follows the stubs already in the file: the original `## DATE — Title` heading, unchanged
 * so every by-date and by-title citation still resolves, then one italic line naming the volume,
 * the eviction date, the reason, and WHO CITES IT.
 *
 * The citation sentence never says "no citations". It says which scans ran and what they found,
 * because the 2026-08-22 eviction wrote "no citations" into four stubs while by-date and
 * by-paraphrase citations existed, and a stub that overstates its own diligence is worse than one
 * that states none — the next reader deletes the body on its authority.
 */
function stubFor(entry, cls, volume, reason) {
  const head = [`*Archived to \`${volume.name}\` (${TODAY}). ${reason}*`];
  const cited = cls.citations?.prose || [];
  const scans = [];
  if (cited.length) {
    const shown = cited.slice(0, 6).map((c) => `\`${c.where}\` (${c.how})`).join(', ');
    const more = cited.length > 6 ? `, and ${cited.length - 6} more` : '';
    scans.push(`***Cited in prose by ${cited.length} location(s)**, which the heading above keeps resolvable: ${shown}${more}.*`);
  } else {
    scans.push('*The date scan and the title-phrase scan over every git-tracked file found no citer.*');
  }
  scans.push(
    `*Not checked: ${(cls.citations?.unchecked || ['paraphrase']).join(', ')} — a citation that names neither the date ` +
    'nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*'
  );
  return [entry.heading, ...head, ...scans].join('\n');
}

/** A fresh volume's header — what it is, what caps it, and what may not be done to it. */
function volumeHeader(number) {
  return [
    `# Architecture & Strategy Decisions — Archive, volume ${number}`,
    '',
    `*Opened ${TODAY} by \`node scripts/evict-memory.mjs apply\`. This is an archive VOLUME: it is`,
    `capped at ${VOLUME_BYTE_CAP.toLocaleString()} bytes by \`scripts/check-memory-budget.mjs\`, which globs every`,
    '`DECISIONS_ARCHIVE*.md` rather than naming one file. When this volume fills, the eviction tool opens the',
    'next one — the cap bounds what a reader must load, never the lifetime total, because a cap on the lifetime',
    'total of an append-only decision log is a mechanism for losing decisions.*',
    '',
    '*Every entry below was moved here by the typed eviction in `scripts/lib/memory-entries.js`, leaving a stub',
    'in `DECISIONS.md` under the same heading. Before deleting anything from this file: grep the entry\'s **date**',
    'and its distinctive **body** phrases, not only its title. The 2026-08-22 eviction ran a title grep alone and',
    'four of its seven stubs claimed "no citations" while citations by date and by paraphrase existed.*',
    '',
    '---',
    '',
  ].join('\n');
}

// ── commands ────────────────────────────────────────────────────────────────────────────────

function readState(root) {
  const abs = decisionsPath(root);
  if (!fs.existsSync(abs)) {
    process.stderr.write(`evict-memory: ${abs} does not exist\n`);
    process.exitCode = 1;
    return null;
  }
  const text = fs.readFileSync(abs, 'utf8');
  const entries = parseDecisionEntries(text);
  const corpus = loadClaims(root, listFiles);
  const ctx = { root, claims: corpus.claims, files: corpus.files, decisionsRel: DECISIONS_REL };
  const classified = entries.map((e) => ({ entry: e, cls: classifyEntry(e, ctx) }));
  return { abs, text, entries, corpus, classified, ambiguous: entries.ambiguous };
}

/**
 * An ambiguous parse is not a warning — every entry boundary after the ambiguity is a guess.
 *
 * `plan` reports it and carries on classifying, because seeing the damage is how you fix it.
 * `apply` REFUSES: evicting a "body" whose end the parser guessed is how a real entry's reasoning
 * paragraph ends up in the archive under a fabricated heading, with the byte arithmetic balancing
 * perfectly over the wrong bytes.
 */
function ambiguityNotice(s) {
  return `DECISIONS.md cannot be parsed unambiguously: ${s.ambiguous}.\n` +
    '  Every entry boundary after that point is a guess. Fix the file first — the usual cause is a\n' +
    '  fenced example containing a `## YYYY-MM-DD` heading, which the parser must not read as an entry.\n';
}

function cmdPlan() {
  const s = readState(ROOT);
  if (!s) return;
  const bytes = Buffer.byteLength(s.text, 'utf8');
  // ── `net` MUST BE WHAT `apply` WOULD ACTUALLY DO ──────────────────────────────────────────
  //
  // This projection was optimistic by 62% and it errs toward evicting, which is the worst
  // direction for the one number this tool tells the operator to act on. Three separate causes,
  // all fixed here:
  //   1. it hardcoded `DECISIONS_ARCHIVE.md` as the volume name, while a rotated run writes a
  //      LONGER name (`DECISIONS_ARCHIVE_002.md`) into every stub;
  //   2. it built the stub with the literal reason `'Projected.'` — 10 bytes against a real
  //      reason's hundred or more, and the reason is written into the stub verbatim;
  //   3. it omitted the `trailing` separator bytes that `apply` counts as residue.
  // It is now computed with the real target volume, the real DEFAULT reason, and the trailing
  // bytes. A longer `--reason` makes the true gain SMALLER than this, so the number is now an
  // upper bound that the report states as such rather than a figure that quietly overshoots.
  const previewVolume = targetVolume(ROOT, 0);
  const rows = s.classified.map(({ entry, cls }) => {
    const trailing = entry.text.slice(entry.text.replace(/\s+$/, '').length);
    const stubBytes = cls.citations
      ? Buffer.byteLength(stubFor(entry, cls, previewVolume, DEFAULT_REASON) + trailing, 'utf8')
      : null;
    return {
      date: entry.date,
      title: entry.title,
      bytes: entry.bytes,
      reversibility: entry.reversibility,
      subject: cls.subject,
      disposition: cls.disposition,
      reasons: cls.reasons,
      prose_citations: cls.citations ? cls.citations.prose.length : null,
      claim_citations: cls.citations ? cls.citations.claims.map((c) => c.id) : null,
      projected_stub_bytes: stubBytes,
      projected_net_gain: stubBytes === null ? null : entry.bytes - stubBytes,
    };
  });

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({
      root: ROOT,
      decisions: { bytes, cap: VOLUME_BYTE_CAP, headroom: VOLUME_BYTE_CAP - bytes, entries: s.entries.length },
      volumes: volumes(ROOT).map((v) => ({ number: v.number, name: v.name, bytes: v.bytes, cap: VOLUME_BYTE_CAP })),
      parse: { ambiguous: s.ambiguous, usable: !s.ambiguous },
      claim_scan: s.corpus.available
        ? {
            performed: true,
            claims: s.corpus.claims.length,
            // Declared here as well as in every stub. `plan` is where an operator decides what to
            // evict, so the exclusion has to be visible at the point of decision, not only in the
            // residue left after acting.
            not_scanned: ['global-scope-claims (~/.warroom/ledger/global.yml — machine state, absent on CI)', 'paraphrase citations'],
          }
        : { performed: false, why: 'git ls-files unavailable — the citation scan did NOT run' },
      net_basis: `projected_net_gain assumes the DEFAULT --reason and volume ${previewVolume.name}; a longer --reason yields LESS`,
      entries: rows,
    }, null, 2) + '\n');
    return;
  }

  process.stdout.write(
    `DECISIONS.md — ${bytes.toLocaleString()} / ${VOLUME_BYTE_CAP.toLocaleString()} bytes ` +
    `(${(VOLUME_BYTE_CAP - bytes).toLocaleString()} free) · ${s.entries.length} entries\n`
  );
  for (const v of volumes(ROOT)) {
    process.stdout.write(`  volume ${v.number}: ${v.name} — ${v.bytes.toLocaleString()} / ${VOLUME_BYTE_CAP.toLocaleString()} bytes\n`);
  }
  process.stdout.write(
    s.corpus.available
      ? `  claim scan: ${s.corpus.claims.length} live claims over ${s.corpus.files.length} tracked files\n\n`
      : '  claim scan: NOT PERFORMED (git ls-files unavailable) — no entry below may be evicted on this run\n\n'
  );

  if (s.ambiguous) process.stdout.write(`  !! ${ambiguityNotice(s).trim()}\n\n`);

  const order = ['orphaned', 'eligible', 'guarded', 'refused', 'archived'];
  for (const group of order) {
    const inGroup = rows.filter((r) => r.disposition === group);
    if (!inGroup.length) continue;
    const total = inGroup.reduce((a, r) => a + r.bytes, 0);
    process.stdout.write(`${group.toUpperCase()} — ${inGroup.length} entr${inGroup.length === 1 ? 'y' : 'ies'}, ${total.toLocaleString()} bytes\n`);
    for (const r of inGroup) {
      const net = r.projected_net_gain === null ? '    —' : `${String(r.projected_net_gain).padStart(5)}`;
      process.stdout.write(`  ${r.date}  ${String(r.bytes).padStart(5)}B  net ${net}B  ${r.title.slice(0, 56)}\n`);
      for (const why of r.reasons) process.stdout.write(`         ${why}\n`);
      if (r.prose_citations) process.stdout.write(`         prose citations found: ${r.prose_citations}\n`);
    }
    process.stdout.write('\n');
  }
}

/** Resolve one `YYYY-MM-DD` or `YYYY-MM-DD::substring` selector to exactly one entry. */
function resolveSelector(sel, classified) {
  const [date, needle] = sel.split('::');
  let hits = classified.filter((c) => c.entry.date === date);
  if (needle) {
    const n = needle.toLowerCase();
    hits = hits.filter((c) => c.entry.title.toLowerCase().includes(n));
  }
  if (hits.length === 1) return { ok: true, hit: hits[0] };
  if (hits.length === 0) return { ok: false, why: `selector "${sel}" matches no entry` };
  return {
    ok: false,
    why: `selector "${sel}" matches ${hits.length} entries — add ::<title substring>:\n` +
      hits.map((h) => `      ${h.entry.date}::${h.entry.title.slice(0, 50)}`).join('\n'),
  };
}

/**
 * Write both files, then RE-READ THEM FROM DISK and re-verify.
 *
 * ── WHY EVERY WORD OF THAT SENTENCE IS LOAD-BEARING ─────────────────────────────────────────
 *
 * The conservation gate above runs on in-memory strings, before the write. That checks the
 * tool's arithmetic, and a tool that checks its own arithmetic rather than the result is
 * checking nothing: it cannot see a short write, a full disk, a file that was not the file it
 * thought, or a second process. The verdict must be taken from the artifact, so it is taken
 * again here, from the bytes that are actually on disk.
 *
 * ── ORDER AND ATOMICITY ─────────────────────────────────────────────────────────────────────
 *
 * Each file is written to a sibling temp and `rename`d over the target. `rename` within a
 * directory is atomic on POSIX, so no reader — and no crash — ever observes a truncated volume,
 * which a bare `writeFileSync` (O_TRUNC then write) exposes for the whole duration of the write.
 *
 * The VOLUME lands first, and that is deliberate rather than accidental. Renames are two steps
 * and a crash between them leaves one of two states:
 *   volume first  → the bodies are in BOTH files. Ugly, recoverable, nothing lost.
 *   decisions first → the bodies are in NEITHER. Unrecoverable.
 * So the surviving-duplicate state is chosen on purpose, and the duplicate-body guard in
 * `cmdApply` is what makes the obvious recovery — re-run the same command — safe instead of
 * silently appending a second copy.
 */
/**
 * Every way this eviction could be losing something, as a list of sentences.
 *
 * ── PURE, EXPORTED, AND CALLED ONCE — SO EACH CONDITION CAN BE PINNED ON ITS OWN ────────────
 *
 * This lived inline, and a delta review measured what that cost: deleting any ONE of its
 * non-growth conditions individually cost ZERO failing tests. The defects they catch were caught
 * — by direct file assertions elsewhere in the suite — so the GATE was thinner than the mutation
 * table implied. A condition no test can reach on its own is a condition nobody can tell is
 * still working.
 *
 * Extracting it does not make the gate stronger by itself; it makes each condition addressable,
 * which is what lets the test file mutate them one at a time.
 *
 * THE FIVE, and why each is not implied by the others:
 *   bytes-do-not-close   the splice ate or duplicated something. Arithmetic only.
 *   body-not-in-volume   the right NUMBER of bytes moved, and they were the wrong bytes.
 *   heading-not-in-decisions  rule 4's residue never landed; archival became deletion.
 *   destination-overwritten   the append rewrote the volume instead of extending it.
 *   would-not-shrink     every other number balances and the file got BIGGER.
 */
function conservationIssues({ removed, movedBodies, residue, chosen, newVolume, newDecisions, volExisting, volName }) {
  const issues = [];
  if (removed !== movedBodies - residue) {
    issues.push(
      `byte arithmetic does not close: DECISIONS.md lost ${removed} bytes, but bodies moved ` +
      `(${movedBodies}) minus residue left behind (${residue}) is ${movedBodies - residue}`
    );
  }
  for (const { entry } of chosen) {
    if (!newVolume.includes(entry.text.replace(/\s+$/, ''))) {
      issues.push(`body of "${entry.heading}" is not present verbatim in ${volName}`);
    }
    if (!newDecisions.includes(entry.heading)) {
      issues.push(`heading "${entry.heading}" did not survive in DECISIONS.md — rule 4 residue missing`);
    }
  }
  // THE DESTINATION WAS IN THE REPORT AND IN NO ASSERTION. Dropping the volume's prior content
  // entirely left every other check satisfied and printed "conservation closes to zero". The
  // append is a pure suffix, so this is exact rather than heuristic.
  if (!newVolume.startsWith(volExisting.replace(/\s*$/, ''))) {
    issues.push(
      `${volName}'s existing ${Buffer.byteLength(volExisting, 'utf8')} bytes are not a prefix of what would be written — ` +
      'an append may only add to a volume, never rewrite it'
    );
  }
  // A non-positive reduction means the "eviction" grew the file it was asked to shrink, which
  // happens whenever a stub outweighs the body it replaces and is invisible in a report whose
  // other numbers all balance. Refused, not warned about; the remedy needs no flag.
  if (removed <= 0) {
    issues.push(
      `this eviction would ${removed === 0 ? 'not shrink' : 'GROW'} DECISIONS.md (reduction ${removed} bytes): ` +
      `the stubs (${residue} bytes) weigh ${removed === 0 ? 'exactly as much as' : 'more than'} the bodies removed (${movedBodies}). ` +
      'Shorten --reason, or run `plan` and choose an entry with a positive net'
    );
  }
  return issues;
}

function commitWrite({ vol, volumeText, decisionsPath: decPath, decisionsText, chosen, io = fs }) {
  // `io` is injected so the FAILURE path is reachable from a test. Without it, this function's
  // refusal could only fire on a real short write or a real disk fault, so deleting the whole
  // check cost zero failing tests — a gate nothing pins is a gate nobody notices going away.
  // Production always passes the real `fs`; the seam adds no branch and no environment variable.
  const atomic = (target, text) => {
    const tmp = `${target}.evict-tmp-${process.pid}`;
    io.writeFileSync(tmp, text);
    io.renameSync(tmp, target);
  };
  atomic(vol.abs, volumeText);
  atomic(decPath, decisionsText);

  const problems = [];
  const volOnDisk = io.readFileSync(vol.abs, 'utf8');
  const decOnDisk = io.readFileSync(decPath, 'utf8');
  if (volOnDisk !== volumeText) {
    problems.push(`${vol.name} on disk is ${Buffer.byteLength(volOnDisk, 'utf8')} bytes; ${Buffer.byteLength(volumeText, 'utf8')} were computed`);
  }
  if (decOnDisk !== decisionsText) {
    problems.push(`DECISIONS.md on disk is ${Buffer.byteLength(decOnDisk, 'utf8')} bytes; ${Buffer.byteLength(decisionsText, 'utf8')} were computed`);
  }
  // Re-assert the invariants against the artifact, not against the plan that produced it.
  for (const { entry } of chosen) {
    if (!volOnDisk.includes(entry.text.replace(/\s+$/, ''))) {
      problems.push(`body of "${entry.heading}" is NOT in ${vol.name} on disk`);
    }
    if (!decOnDisk.includes(entry.heading)) {
      problems.push(`heading "${entry.heading}" is NOT in DECISIONS.md on disk — the rule 4 residue did not land`);
    }
  }
  // THROWS rather than returning a flag, and that is a deliberate structural choice.
  //
  // Returning `problems` put the whole verdict behind an `if (problems.length)` at the call site,
  // and a mutation test showed that deleting those two lines cost ZERO failing tests: the tool
  // computed the failure, discarded it, and exited 0. A gate whose call site is optional is
  // optional. There is no branch to delete now — the only way past this line is for it not to
  // throw, and the only way it does not throw is for the artifact on disk to be correct.
  if (problems.length) {
    const e = new Error(`post-write verification failed:\n  ${problems.join('\n  ')}`);
    e.name = 'EvictionVerificationError';
    e.problems = problems;
    throw e;
  }
  return problems;
}

function cmdApply() {
  const s = readState(ROOT);
  if (!s) return;

  if (s.ambiguous) {
    process.stderr.write(`evict-memory apply: REFUSED — ${ambiguityNotice(s)}  Nothing written.\n`);
    process.exitCode = 1;
    return;
  }

  const selectors = flagValues('--only');
  if (!selectors.length) {
    process.stderr.write('evict-memory apply: --only <selector> is required. Run `plan` first.\n');
    process.exitCode = 1;
    return;
  }

  // The citation scan is a precondition, not a nicety. Rule 3 pins entries cited by a live
  // claim; if the corpus could not be loaded, every entry looks uncited and the pin silently
  // does nothing. Refuse rather than evict against a scan that did not run.
  if (!s.corpus.available) {
    process.stderr.write(
      'evict-memory apply: REFUSED — the live-claim scan did not run (git ls-files failed).\n' +
      '  Rule 3 pins entries cited by a live claim. Against an unloaded corpus every entry looks\n' +
      '  uncited, so applying now would evict a pinned entry and report success.\n'
    );
    process.exitCode = 1;
    return;
  }

  const chosen = [];
  const problems = [];
  for (const sel of selectors) {
    const r = resolveSelector(sel, s.classified);
    if (!r.ok) { problems.push(r.why); continue; }
    if (chosen.some((c) => c.entry.startLine === r.hit.entry.startLine)) continue;
    chosen.push(r.hit);
  }
  if (problems.length) {
    for (const p of problems) process.stderr.write(`evict-memory apply: ${p}\n`);
    process.exitCode = 1;
    return;
  }

  // RULES 1 and 3 refuse here, and there is no override flag. An `--i-know-what-im-doing`
  // would turn both rules into suggestions, and a suggestion is what DECISIONS.md already had.
  const refused = chosen.filter(({ cls }) => cls.disposition === 'refused');
  if (refused.length) {
    process.stderr.write(`evict-memory apply: REFUSED — ${refused.length} of ${chosen.length} selected entries are pinned. Nothing written.\n`);
    for (const { entry, cls } of refused) {
      process.stderr.write(`  ${entry.date} — ${entry.title}\n`);
      for (const why of cls.reasons) process.stderr.write(`      ${why}\n`);
    }
    process.exitCode = 1;
    return;
  }
  const alreadyGone = chosen.filter(({ cls }) => cls.disposition === 'archived');
  if (alreadyGone.length) {
    process.stderr.write(`evict-memory apply: ${alreadyGone.length} selected entr${alreadyGone.length === 1 ? 'y is' : 'ies are'} already a stub. Nothing written.\n`);
    process.exitCode = 1;
    return;
  }

  // ── reasons: one for the batch, or one per entry ──────────────────────────────────────────
  //
  // Positional pairing, because the alternative is worse in both directions. A single shared
  // reason across eight entries writes the same sentence into eight stubs, which tells a later
  // reader nothing about the specific record they are holding. Running eight one-entry batches to
  // get eight reasons breaks the one-event-one-volume rule — measured: it put entry 1 into volume
  // 1 and entries 2-8 into volume 2, leaving volume 1 parked 492 bytes under the writer ceiling.
  const reasons = flagValues('--reason');
  if (reasons.length > 1 && reasons.length !== chosen.length) {
    process.stderr.write(
      `evict-memory apply: ${reasons.length} --reason values for ${chosen.length} entries. Give one reason for\n` +
      '  the whole batch, or exactly one per --only in the same order. Nothing written.\n'
    );
    process.exitCode = 1;
    return;
  }
  const reasonFor = (i) => (reasons.length === 0 ? DEFAULT_REASON : reasons.length === 1 ? reasons[0] : reasons[i]);

  // ── the write, computed before anything is touched ────────────────────────────────────────
  const bodies = chosen.map(({ entry }) => entry.text.replace(/\s+$/, ''));
  const batchBytes = Buffer.byteLength(bodies.join('\n\n') + '\n\n', 'utf8');
  const vol = targetVolume(ROOT, batchBytes);

  if (vol.fresh && batchBytes + Buffer.byteLength(volumeHeader(vol.number), 'utf8') > VOLUME_FILL_CEILING) {
    process.stderr.write(
      `evict-memory apply: REFUSED — this batch is ${batchBytes.toLocaleString()} bytes and would fill a fresh volume\n` +
      `  past the ${VOLUME_FILL_CEILING.toLocaleString()}-byte writer ceiling. Split it into two runs.\n`
    );
    process.exitCode = 1;
    return;
  }

  let newDecisions = s.text;
  const stubs = [];
  // Replace from the bottom up so the earlier entries' offsets stay valid. The reason index is
  // taken from the SELECTION order, not this reversed one, so `--reason` pairs with `--only` as
  // the caller wrote them.
  const ordered = chosen
    .map((c, i) => ({ ...c, reason: reasonFor(i) }))
    .sort((a, b) => b.entry.startLine - a.entry.startLine);
  for (const { entry, cls, reason } of ordered) {
    const stub = stubFor(entry, cls, vol, reason);
    const trimmed = entry.text.replace(/\s+$/, '');
    // The blank line(s) after an entry are the file's separator, not the entry's content, so
    // they stay behind with the stub. Counting them as residue is what makes the conservation
    // arithmetic below close to zero instead of to "8, which is one newline per entry, probably".
    const trailing = entry.text.slice(trimmed.length);
    const at = newDecisions.indexOf(entry.text);
    if (at === -1) {
      process.stderr.write(`evict-memory apply: could not locate "${entry.heading}" for replacement. Nothing written.\n`);
      process.exitCode = 1;
      return;
    }
    stubs.push({
      date: entry.date,
      bytes: Buffer.byteLength(stub + trailing, 'utf8'),
      from: entry.bytes,
    });
    newDecisions = newDecisions.slice(0, at) + stub + trailing + newDecisions.slice(at + entry.text.length);
  }

  // ── A "FRESH" VOLUME MUST NOT ALREADY EXIST ───────────────────────────────────────────────
  //
  // `vol.fresh` means "targetVolume computed a name no volume occupies", and the previous code
  // trusted that and never looked at the disk. Everything downstream then works on a header-only
  // string, so `writeFileSync` O_TRUNCs whatever is actually at that path — and the conservation
  // check passes, because it compares in-memory strings that never knew the file was there. It
  // printed "conservation closes to zero" and exited 0 over destroyed history.
  //
  // Two ways `targetVolume` is wrong about a name being free, and neither is exotic:
  //   • a CASE-INSENSITIVE filesystem (macOS default) where `decisions_archive_002.md` exists —
  //     `VOLUME_RE` is case-sensitive and does not see it, `writeFileSync` opens the same inode;
  //   • any archive file whose name the pattern does not match, including one produced by
  //     following `check-memory-budget.mjs`'s own advice to "split this volume by hand".
  //
  // The cure is not a smarter regex — a regex cannot see a case-folding filesystem. It is asking
  // the filesystem, which is the only thing that knows.
  if (vol.fresh && fs.existsSync(vol.abs)) {
    process.stderr.write(
      `evict-memory apply: REFUSED — ${vol.name} was computed as a NEW volume but a file already exists at\n` +
      `  ${vol.abs}\n` +
      '  Writing would truncate it. This means the volume set on disk does not match what the naming\n' +
      '  pattern recognises — most often a case-insensitive filesystem, or an archive renamed by hand.\n' +
      '  Rename it to the canonical DECISIONS_ARCHIVE_NNN.md form, or move it aside. Nothing written.\n'
    );
    process.exitCode = 1;
    return;
  }

  const volExisting = vol.fresh ? volumeHeader(vol.number) : fs.readFileSync(vol.abs, 'utf8');
  const newVolume = volExisting.replace(/\s*$/, '\n\n') + bodies.join('\n\n') + '\n';

  // ── AN ALREADY-ARCHIVED BODY MUST NOT BE APPENDED TWICE ───────────────────────────────────
  //
  // If a previous run wrote the volume and then failed before rewriting DECISIONS.md, the body
  // is in both files and re-running the identical command is the obvious recovery. That appended
  // a second copy and reported conservation closing to zero, because the arithmetic is about this
  // run's bytes and knows nothing about the last one's.
  // ACROSS EVERY VOLUME, not just the one this batch picked. Checking only `volExisting` missed
  // the exact case the guard exists for: if the interrupted append pushed the volume past the
  // fill ceiling, the re-run ROTATES, sees a bare header, finds no duplicate, and files a second
  // copy in the next volume. The recovery this tool's own message recommends — run it again —
  // was the thing that produced the duplicate.
  const archived = volumes(ROOT).map((v) => ({ name: v.name, text: fs.readFileSync(v.abs, 'utf8') }));
  const duplicated = chosen
    .map(({ entry }) => {
      const body = entry.text.replace(/\s+$/, '');
      const where = archived.find((v) => v.text.includes(body));
      return where ? { entry, where: where.name } : null;
    })
    .filter(Boolean);
  if (duplicated.length) {
    process.stderr.write(
      `evict-memory apply: REFUSED — ${duplicated.length} selected bod${duplicated.length === 1 ? 'y is' : 'ies are'} ALREADY present in the archive.\n` +
      duplicated.map(({ entry, where }) => `      ${entry.heading}  (already in ${where})\n`).join('') +
      '  This is the signature of an interrupted earlier run: the volume was written and DECISIONS.md\n' +
      '  was not. Appending again would duplicate history. Replace the entry in DECISIONS.md with its\n' +
      '  stub by hand, or remove the copy from the volume. Nothing written.\n'
    );
    process.exitCode = 1;
    return;
  }

  const before = { decisions: Buffer.byteLength(s.text, 'utf8'), volume: vol.bytes };
  const after = { decisions: Buffer.byteLength(newDecisions, 'utf8'), volume: Buffer.byteLength(newVolume, 'utf8') };
  const movedBodies = chosen.reduce((a, c) => a + c.entry.bytes, 0);
  const residue = stubs.reduce((a, s2) => a + s2.bytes, 0);

  const conservation = conservationIssues({
    removed: before.decisions - after.decisions,
    movedBodies, residue, chosen, newVolume, newDecisions, volExisting, volName: vol.name,
  });
  const removed = before.decisions - after.decisions;
  if (conservation.length) {
    process.stderr.write('evict-memory apply: REFUSED — conservation check failed. Nothing written.\n');
    for (const c of conservation) process.stderr.write(`  ${c}\n`);
    process.exitCode = 1;
    return;
  }

  const report = {
    root: ROOT,
    dry_run: DRY_RUN,
    volume: { number: vol.number, name: vol.name, fresh: vol.fresh },
    evicted: chosen.map(({ entry, cls }) => ({
      date: entry.date,
      title: entry.title,
      bytes: entry.bytes,
      disposition: cls.disposition,
      prose_citations: cls.citations.prose.length,
    })),
    bytes: {
      decisions_before: before.decisions,
      decisions_after: after.decisions,
      decisions_headroom_after: VOLUME_BYTE_CAP - after.decisions,
      volume_before: before.volume,
      volume_after: after.volume,
      volume_headroom_after: VOLUME_BYTE_CAP - after.volume,
      bodies_moved: movedBodies,
      residue_left_behind: residue,
      decisions_reduction: removed,
      conservation_closes: true,
    },
  };

  if (!DRY_RUN) {
    // No `if` here on purpose — see commitWrite. It throws, and the catch only makes the message
    // readable; delete the catch and the throw still ends the process non-zero. There is no
    // arrangement of this call that reports success over a bad write.
    try {
      commitWrite({ vol, volumeText: newVolume, decisionsPath: s.abs, decisionsText: newDecisions, chosen });
    } catch (e) {
      if (e.name !== 'EvictionVerificationError') throw e;
      process.stderr.write('evict-memory apply: POST-WRITE VERIFICATION FAILED — the files on disk are not what was computed.\n');
      for (const c of e.problems) process.stderr.write(`  ${c}\n`);
      process.stderr.write('  Inspect both files before running again; `apply` refuses to append a body a volume already holds.\n');
      process.exitCode = 1;
      return;
    }
  }

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return;
  }
  process.stdout.write(
    `${DRY_RUN ? 'DRY RUN — nothing written' : 'Evicted'} ${chosen.length} entr${chosen.length === 1 ? 'y' : 'ies'} → ${vol.name}${vol.fresh ? ' (new volume)' : ''}\n`
  );
  for (const e of report.evicted) {
    process.stdout.write(`  ${e.date}  ${String(e.bytes).padStart(5)}B  ${e.disposition}  ${e.prose_citations} prose citation(s)  ${e.title.slice(0, 52)}\n`);
  }
  process.stdout.write(
    `\nDECISIONS.md  ${before.decisions.toLocaleString()} → ${after.decisions.toLocaleString()} bytes ` +
    `(${(VOLUME_BYTE_CAP - after.decisions).toLocaleString()} free)\n` +
    `${vol.name}  ${before.volume.toLocaleString()} → ${after.volume.toLocaleString()} bytes ` +
    `(${(VOLUME_BYTE_CAP - after.volume).toLocaleString()} free)\n` +
    `bodies moved ${movedBodies.toLocaleString()}B · residue left behind ${residue.toLocaleString()}B · ` +
    `reduction ${removed.toLocaleString()}B — conservation closes to zero\n`
  );
}

// process.exitCode, NOT process.exit(). Stdout to a PIPE is asynchronous, so `process.exit()`
// after a console write tears the process down with the write still queued — the payload is cut
// at exactly 65536 bytes and the exit status still reads 0. Six scripts carried that shape and
// were fixed on 2026-08-24; see scripts/check-dispatch-agenttype.mjs for the measurement and for
// why fs.writeSync is not the fix. `plan --json` over a full DECISIONS.md is the payload here
// most likely to grow past the buffer, which is exactly why this file does not use exit().
// GUARDED, so this file can be imported by its test without running a command — the same shape
// `scripts/ledger.mjs` uses for the same reason. Unguarded, importing it hits the usage branch
// below, writes to stderr and sets a non-zero exit code, which fails the run that imported it.
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

export { commitWrite, conservationIssues, VOLUME_BYTE_CAP, VOLUME_FILL_CEILING, DEFAULT_REASON };

if (!invokedDirectly) {
  // imported for its exports; no command to run
} else if (cmd === 'plan') {
  cmdPlan();
} else if (cmd === 'apply') {
  cmdApply();
} else {
  process.stderr.write(
    'usage: node scripts/evict-memory.mjs plan [--json] [--root DIR]\n' +
    '       node scripts/evict-memory.mjs apply --only <YYYY-MM-DD[::title substring]> [--only ...]\n' +
    '                                           [--reason "..."] [--dry-run] [--json] [--root DIR]\n'
  );
  process.exitCode = 1;
}
