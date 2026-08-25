#!/usr/bin/env node
/**
 * check-memory-budget.mjs — memory-file budget enforcer.
 *
 * POSTURE: BLOCKS. Run by `.github/workflows/ci.yml` on every PR via `npm run check:memory`.
 *
 * WHY THIS EXISTS.
 * DECISIONS.md is declared "≤ 50 entries, archive when full" in CLAUDE.md. TOKEN-EFFICIENCY.md
 * §3.2 measured it at 46,655 bytes and marked it VERIFIED — exceeds its own byte budget. By
 * 2026-08-16 it had grown to 58,166 bytes (25% more) with 38 entries (under the entry cap).
 * That is the repo's signature defect: a rule enforced only by a sentence is a wish, not a rule.
 *
 * This script enforces both halves:
 *   DECISIONS.md — entry count (entries with a date heading) ≤ ENTRY_CAP,
 *                  file size in bytes ≤ BYTE_CAP.
 *   LONG-TERM.md — line count ≤ LINE_CAP.
 *
 * The byte cap for DECISIONS.md is derived from the entry cap: 50 entries × 800 bytes/entry =
 * 40,000 bytes. The actual average at 26 entries (post-trim 2026-08-16) is ~1,400 bytes/entry,
 * so 40k bytes is intentionally tighter than entry × average — it penalises bloated entries, not
 * just count. An entry that runs to 3,000 words is a session file, not a decision record.
 *
 * WHAT IT CANNOT ENFORCE.
 * It cannot check whether entry content is non-redundant, well-summarised, or up-to-date.
 * It cannot detect entries split across multiple headings to dodge the count. Both are
 * stated here so they are choices to catch later, not blind spots.
 *
 * Usage:
 *   node scripts/check-memory-budget.mjs [--root DIR] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// ONE definition of "a decision entry", shared with scripts/evict-memory.mjs. This file used to
// carry its own heading regex; the eviction tool would then have carried a second, and the two
// would have disagreed about what they were counting — the checker passing a file the evictor
// could not parse, or the reverse, with no way to tell which was right.
const { parseDecisionEntries } = require('./lib/memory-entries.js');

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const optOf = (name, dflt) => {
  const i = argv.indexOf(name);
  return i === -1 || i + 1 >= argv.length ? dflt : argv[i + 1];
};
const ROOT = path.resolve(optOf('--root', REPO));
const JSON_OUT = argv.includes('--json');

// ── budget constants ────────────────────────────────────────────────────────
// Changing these numbers deliberately changes what DECISIONS.md and LONG-TERM.md are allowed
// to contain. Edit here, not in a dozen scattered places.

/** How many dated decision entries DECISIONS.md may hold before archival is required. */
const DECISIONS_ENTRY_CAP = 50;

/**
 * DECISIONS.md byte ceiling. At DECISIONS_ENTRY_CAP entries the average entry must stay
 * under 800 bytes for the file to fit. An entry longer than ~800 bytes is a session note,
 * not a decision record — the format header says "one-line trade-offs."
 */
const DECISIONS_BYTE_CAP = 40_000;

/** LONG-TERM.md line ceiling, as declared in CLAUDE.md. */
const LONG_TERM_LINE_CAP = 100;

/**
 * Byte ceiling for EACH archive volume — the same 40,000 as the active DECISIONS.md.
 *
 * ── THE ARCHIVE ROTATES, AND THIS COMMENT USED TO SAY THE OPPOSITE ─────────────────────────
 *
 * It read: "When this cap fires: compress or DELETE records that are fully obsolete." That was
 * an instruction to lose decisions, written into the one check that is supposed to prevent it,
 * and it was reachable — the single archive stood at 34,472 of 40,000 while DECISIONS.md had
 * 325 bytes of headroom, so the very next eviction would have breached it and the advice above
 * would have been followed. A cap that can only be met by deleting history WILL be met by
 * deleting history.
 *
 * The archive is now a SET of volumes — `DECISIONS_ARCHIVE.md` (volume 1, the legacy name) plus
 * `DECISIONS_ARCHIVE_002.md`, `_003.md`, … — and this cap applies to each of them independently,
 * discovered by pattern rather than by name so a new volume is governed the moment it exists.
 * `scripts/evict-memory.mjs` opens the next volume when the current one passes 90% of this cap.
 *
 * WHAT THIS BOUNDS, STATED NARROWLY: the size of any single file a reader must load. It does NOT
 * bound the lifetime total of the archive, and it is not pretending to. The lifetime total of an
 * append-only decision log should grow; a mechanism that caps it is a mechanism for losing
 * decisions, which is the sentence this comment replaced.
 */
const DECISIONS_ARCHIVE_BYTE_CAP = 40_000;

/**
 * What counts as an archive file FOR CAPPING — deliberately wider than what the eviction tool
 * will WRITE.
 *
 * Two patterns, two jobs, and conflating them is a hole:
 *   WRITE  `scripts/evict-memory.mjs` only ever creates `DECISIONS_ARCHIVE.md` or
 *          `DECISIONS_ARCHIVE_NNN.md`. Narrow on purpose — a writer that accepts any name
 *          cannot tell a volume from a note.
 *   CAP    anything named like an archive, case-insensitively, including
 *          `DECISIONS_ARCHIVE_2026-08.md` (the period-keyed form this design did not adopt),
 *          `decisions_archive_002.md` (a case-insensitive filesystem's version of a volume) and
 *          `DECISIONS_ARCHIVE_NOTES.md`.
 *
 * An earlier version of this file used the narrow pattern for BOTH, and a test asserted that
 * `DECISIONS_ARCHIVE_NOTES.md` was correctly ignored. That test pinned the hole: a file holding
 * archived decisions was governed by nothing because of how somebody had named it. Whether the
 * eviction tool would produce that name is beside the point — the cap exists to bound what a
 * reader must load, and a reader loads it by what it holds, not by whether a regex approves.
 */
const ARCHIVE_VOLUME_RE = /^DECISIONS_ARCHIVE(?:[_-].*)?\.md$/i;

// ── helpers ─────────────────────────────────────────────────────────────────
const failures = [];
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);

/**
 * Count dated decision entries in DECISIONS.md.
 *
 * Delegates to `scripts/lib/memory-entries.js`, which owns the definition. An entry heading looks
 * like `## YYYY-MM-DD — ...` at the start of a line; the format-section heading `## Format` is
 * excluded by the date anchor. Archive STUBS still count as entries, deliberately — a stub costs
 * bytes and occupies a heading, and hiding it from the count would make the file look emptier
 * than it reads.
 */
function countDecisionEntries(text) {
  return parseDecisionEntries(text).length;
}

// ── check DECISIONS.md ───────────────────────────────────────────────────────
const decisionsPath = path.join(ROOT, '.claude', 'memory', 'DECISIONS.md');

if (!fs.existsSync(decisionsPath)) {
  fail('missing-file', `${decisionsPath} does not exist. Create it or point --root at the repo root.`);
} else {
  const text = fs.readFileSync(decisionsPath, 'utf8');
  const bytes = Buffer.byteLength(text, 'utf8');
  const entries = countDecisionEntries(text);

  if (entries > DECISIONS_ENTRY_CAP) {
    fail(
      'decisions-entry-overflow',
      `DECISIONS.md holds ${entries} dated entries; cap is ${DECISIONS_ENTRY_CAP}. ` +
        `Archive the oldest entries to DECISIONS_ARCHIVE.md — the history is load-bearing; ` +
        `delete nothing, move them.`
    );
  }

  if (bytes > DECISIONS_BYTE_CAP) {
    fail(
      'decisions-byte-overflow',
      `DECISIONS.md is ${bytes.toLocaleString()} bytes; cap is ${DECISIONS_BYTE_CAP.toLocaleString()} bytes. ` +
        `Each entry should be ≤ ${Math.floor(DECISIONS_BYTE_CAP / DECISIONS_ENTRY_CAP)} bytes. ` +
        `Archive completed or superseded entries to DECISIONS_ARCHIVE.md.`
    );
  }

  if (!failures.length) {
    if (JSON_OUT) {
      /* reported below */
    } else {
      console.log(
        `✓ DECISIONS.md — ${entries} entr${entries === 1 ? 'y' : 'ies'} (cap ${DECISIONS_ENTRY_CAP}) · ${bytes.toLocaleString()} bytes (cap ${DECISIONS_BYTE_CAP.toLocaleString()})`
      );
    }
  }
}

// ── check LONG-TERM.md ───────────────────────────────────────────────────────
const longTermPath = path.join(ROOT, '.claude', 'memory', 'LONG-TERM.md');

if (!fs.existsSync(longTermPath)) {
  fail('missing-file', `${longTermPath} does not exist. Create it or point --root at the repo root.`);
} else {
  const text = fs.readFileSync(longTermPath, 'utf8');
  const lines = text.split('\n').length;

  if (lines > LONG_TERM_LINE_CAP) {
    fail(
      'long-term-line-overflow',
      `LONG-TERM.md is ${lines} lines; cap is ${LONG_TERM_LINE_CAP}. ` +
        `Compress quarterly — remove entries that are already captured in CLAUDE.md or the claim ledger.`
    );
  } else if (!JSON_OUT) {
    console.log(
      `✓ LONG-TERM.md — ${lines} line${lines === 1 ? '' : 's'} (cap ${LONG_TERM_LINE_CAP})`
    );
  }
}

// ── check every archive volume ─────────────────────────────────────────────────
//
// Discovered by pattern, never by a hard-coded list of names. Naming the volumes here would mean
// that opening volume 4 governs it only if somebody also remembered to edit this file — and an
// unchecked archive volume is exactly the state the single archive was in before it was capped:
// 18,538 bytes, checked by nothing.
const memoryDir = path.join(ROOT, '.claude', 'memory');

/** @returns {Array<{name: string, bytes: number}>} volumes on disk, in name order. */
function archiveVolumes() {
  let names;
  try { names = fs.readdirSync(memoryDir); } catch { return []; }
  return names
    .filter((n) => ARCHIVE_VOLUME_RE.test(n))
    .sort()
    .map((n) => ({
      name: n,
      bytes: Buffer.byteLength(fs.readFileSync(path.join(memoryDir, n), 'utf8'), 'utf8'),
    }));
}

const volumes = archiveVolumes(); // none is fine — the archive is not required to exist
for (const vol of volumes) {
  if (vol.bytes > DECISIONS_ARCHIVE_BYTE_CAP) {
    fail(
      'decisions-archive-byte-overflow',
      `${vol.name} is ${vol.bytes.toLocaleString()} bytes; the per-volume cap is ${DECISIONS_ARCHIVE_BYTE_CAP.toLocaleString()} bytes. ` +
        `Do NOT resolve this by deleting records. The archive rotates: move the overflow into the next volume with ` +
        `\`node scripts/evict-memory.mjs\`, or split this volume by hand keeping every entry. ` +
        `The cap bounds what one reader must load, not how much history may exist.`
    );
  } else if (!JSON_OUT) {
    console.log(
      `✓ ${vol.name} — ${vol.bytes.toLocaleString()} bytes (cap ${DECISIONS_ARCHIVE_BYTE_CAP.toLocaleString()})`
    );
  }
}

// ── report ───────────────────────────────────────────────────────────────────
// process.exitCode, NOT process.exit(). Stdout to a PIPE is asynchronous, so `process.exit()`
// after a console.log tears the process down with the write still queued — the payload is cut at
// exactly 65536 bytes and the exit status still reads 0. This payload is small today; the pattern
// is the defect, and `failures` is unbounded. See check-dispatch-agenttype.mjs for the
// measurement and for why fs.writeSync is not the fix.
if (JSON_OUT) {
  const decisionsText = fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, 'utf8') : '';
  const longTermText = fs.existsSync(longTermPath) ? fs.readFileSync(longTermPath, 'utf8') : '';
  console.log(
    JSON.stringify({
      root: ROOT,
      decisions: {
        entries: countDecisionEntries(decisionsText),
        bytes: Buffer.byteLength(decisionsText, 'utf8'),
        entry_cap: DECISIONS_ENTRY_CAP,
        byte_cap: DECISIONS_BYTE_CAP,
      },
      // Every volume, each with its own cap. `decisions_archive` remains as the volume-1 view so
      // an existing consumer of this JSON keeps working; it is the first element of the list, not
      // a second measurement of it.
      decisions_archive: volumes.length
        ? { bytes: volumes[0].bytes, byte_cap: DECISIONS_ARCHIVE_BYTE_CAP }
        : { bytes: 0, byte_cap: DECISIONS_ARCHIVE_BYTE_CAP },
      decisions_archive_volumes: volumes.map((v) => ({
        name: v.name, bytes: v.bytes, byte_cap: DECISIONS_ARCHIVE_BYTE_CAP,
      })),
      long_term: {
        lines: longTermText.split('\n').length,
        line_cap: LONG_TERM_LINE_CAP,
      },
      failures,
    }, null, 2)
  );
  process.exitCode = failures.length ? 1 : 0;
} else if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}`);
  console.error(`\n✗ memory-budget check failed — ${failures.length} problem(s).`);
  process.exitCode = 1;
} else {
  console.log('\n✓ memory-budget check passed.');
}
