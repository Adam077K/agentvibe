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
 * DECISIONS_ARCHIVE.md byte ceiling.
 *
 * 40,000 bytes — the same ceiling as the active DECISIONS.md. Treating both files as
 * having equal budgets keeps the combined pair ≤ 80 kB and forces a review after roughly
 * six to eight more entries land in the archive (at ~1.4 kB/entry average). The archive
 * grows only during deliberate eviction events, not continuously. When this cap fires:
 * compress or delete records that are fully obsolete (e.g., Phase 2 launcher measurement
 * entries once the fleet rollout in Phase 9 completes and nothing references them any
 * longer). Pre-PR archive was 18,538 bytes; post-eviction it is ~30 kB.
 */
const DECISIONS_ARCHIVE_BYTE_CAP = 40_000;

// ── helpers ─────────────────────────────────────────────────────────────────
const failures = [];
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);

/**
 * Count dated decision entries in DECISIONS.md.
 * An entry heading looks like `## YYYY-MM-DD — ...` at the start of a line.
 * The format-section heading `## Format` is excluded by the date-anchored pattern.
 */
function countDecisionEntries(text) {
  return (text.match(/^## \d{4}-\d{2}-\d{2}/gm) || []).length;
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

// ── check DECISIONS_ARCHIVE.md ─────────────────────────────────────────────────
const decisionsArchivePath = path.join(ROOT, '.claude', 'memory', 'DECISIONS_ARCHIVE.md');

if (!fs.existsSync(decisionsArchivePath)) {
  // Not required to exist; only checked when present.
} else {
  const text = fs.readFileSync(decisionsArchivePath, 'utf8');
  const bytes = Buffer.byteLength(text, 'utf8');

  if (bytes > DECISIONS_ARCHIVE_BYTE_CAP) {
    fail(
      'decisions-archive-byte-overflow',
      `DECISIONS_ARCHIVE.md is ${bytes.toLocaleString()} bytes; cap is ${DECISIONS_ARCHIVE_BYTE_CAP.toLocaleString()} bytes. ` +
        `Compress or delete fully superseded entries (e.g., phase-specific records after that phase ships). ` +
        `Do not delete anything still referenced; do not touch DECISIONS.md entries.`
    );
  } else if (!JSON_OUT) {
    console.log(
      `✓ DECISIONS_ARCHIVE.md — ${bytes.toLocaleString()} bytes (cap ${DECISIONS_ARCHIVE_BYTE_CAP.toLocaleString()})`
    );
  }
}

// ── report ───────────────────────────────────────────────────────────────────
if (JSON_OUT) {
  const decisionsText = fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, 'utf8') : '';
  const longTermText = fs.existsSync(longTermPath) ? fs.readFileSync(longTermPath, 'utf8') : '';
  const archiveText = fs.existsSync(decisionsArchivePath) ? fs.readFileSync(decisionsArchivePath, 'utf8') : '';
  console.log(
    JSON.stringify({
      root: ROOT,
      decisions: {
        entries: countDecisionEntries(decisionsText),
        bytes: Buffer.byteLength(decisionsText, 'utf8'),
        entry_cap: DECISIONS_ENTRY_CAP,
        byte_cap: DECISIONS_BYTE_CAP,
      },
      decisions_archive: {
        bytes: Buffer.byteLength(archiveText, 'utf8'),
        byte_cap: DECISIONS_ARCHIVE_BYTE_CAP,
      },
      long_term: {
        lines: longTermText.split('\n').length,
        line_cap: LONG_TERM_LINE_CAP,
      },
      failures,
    }, null, 2)
  );
  process.exit(failures.length ? 1 : 0);
}

if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}`);
  console.error(`\n✗ memory-budget check failed — ${failures.length} problem(s).`);
  process.exit(1);
}
console.log('\n✓ memory-budget check passed.');
