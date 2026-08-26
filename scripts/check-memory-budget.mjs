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

/**
 * ── `existsSync` ANSWERS "IS SOMETHING THERE", NOT "CAN I READ IT" ──────────────────────────
 *
 * Every memory file below was guarded by `existsSync` and then handed to `readFileSync`. That
 * pair is safe for a regular file and for a symlink to one, and it is safe for a DANGLING symlink
 * — `existsSync` follows links, so a broken one reads as absent and the existing `missing-file`
 * refusal already covers it. It is not safe for anything else. Measured 2026-08-26 against
 * constructed trees, one bad entry per tree, at `.claude/memory/DECISIONS.md`:
 *
 *   a DIRECTORY at that path  → EISDIR, unhandled, raw stack trace, exit 1
 *   a FIFO at that path       → NEVER RETURNS. Killed by an 8s cap at 8,016 ms, exit 142.
 *
 * The FIFO is why this exists. `check:memory` is a BLOCKING CI step, and there a crash names
 * itself while a hang is indistinguishable from a slow build.
 *
 * ONE QUESTION IS ASKED HERE, SO ONE PREDICATE ANSWERS IT. This file asks only "does this hold
 * content I must measure?" — it creates nothing, holding no writeFileSync, appendFileSync,
 * mkdirSync, renameSync, rmSync, unlinkSync or openSync. The sibling `scripts/evict-memory.mjs`
 * needs a second, non-resolving predicate because it also asks "is this path free to CREATE?";
 * that question is never asked here, so that predicate is not wanted here. The question this file
 * does ask MUST resolve — a memory file reached through a symlink is content that must still be
 * measured — which is why this is `statSync` and not `lstatSync`, and why a control test pins it.
 */
function fileKind(abs) {
  let st;
  try {
    st = fs.statSync(abs); // RESOLVES symlinks. lstatSync would stop measuring a symlinked file.
  } catch (e) {
    return { ok: false, kind: `unreadable (${(e && e.code) || (e && e.message) || e})` };
  }
  if (st.isFile()) return { ok: true, kind: 'file' };
  if (st.isDirectory()) return { ok: false, kind: 'a directory' };
  if (st.isFIFO()) return { ok: false, kind: 'a FIFO — reading it would never return' };
  if (st.isSocket()) return { ok: false, kind: 'a socket' };
  if (st.isBlockDevice()) return { ok: false, kind: 'a block device' };
  if (st.isCharacterDevice()) return { ok: false, kind: 'a character device' };
  return { ok: false, kind: 'not a regular file' };
}

/**
 * Load one memory file, or record exactly why it could not be loaded. A bad entry FAILS by name;
 * it is not skipped. Skipping would put a capped file beyond its cap according to what kind of
 * thing somebody left at its path, and report success while doing it.
 *
 * @param {string} abs
 * @param {{required: boolean}} o `required` files fail when absent; the archive is optional.
 * @returns {string|null} contents, or null when there is nothing to measure
 */
const fileProblems = Object.create(null); // abs path -> why it could not be read
function loadMemoryFile(abs, { required }) {
  if (!fs.existsSync(abs)) {
    // Follows symlinks, so a dangling link lands here rather than below — deliberately unchanged.
    if (required) {
      fail('missing-file', `${abs} does not exist. Create it or point --root at the repo root.`);
    }
    // Deliberately NOT recorded as a `problem`: absent is a normal state for the optional archive,
    // and for a required file the `missing-file` failure above already says so. `problem` means
    // "present, and nothing could be read from it" — the one thing that had no way to be reported.
    return null;
  }
  const k = fileKind(abs);
  if (!k.ok) {
    fail(
      'memory-file-not-a-file',
      `${abs} exists but is ${k.kind}. A memory file must be a regular file (a symlink to one is ` +
        `fine — it is resolved). Nothing can be measured here: replace it with the real file, or ` +
        `move whatever is at that path out of the way.`
    );
    fileProblems[abs] = k.kind;
    return null;
  }
  return fs.readFileSync(abs, 'utf8');
}

// ── check DECISIONS.md ───────────────────────────────────────────────────────
const decisionsPath = path.join(ROOT, '.claude', 'memory', 'DECISIONS.md');

const decisionsText = loadMemoryFile(decisionsPath, { required: true });

if (decisionsText !== null) {
  const text = decisionsText;
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

const longTermText = loadMemoryFile(longTermPath, { required: true });

if (longTermText !== null) {
  const text = longTermText;
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

// Not required to exist; only checked when present.
const archiveText = loadMemoryFile(decisionsArchivePath, { required: false });

if (archiveText !== null) {
  const text = archiveText;
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
// process.exitCode, NOT process.exit(). Stdout to a PIPE is asynchronous, so `process.exit()`
// after a console.log tears the process down with the write still queued — the payload is cut at
// exactly 65536 bytes and the exit status still reads 0. This payload is small today; the pattern
// is the defect, and `failures` is unbounded. See check-dispatch-agenttype.mjs for the
// measurement and for why fs.writeSync is not the fix.
if (JSON_OUT) {
  // Reuse what the checks above already loaded. This block used to re-read all three paths with
  // the same unguarded `existsSync ? readFileSync : ''` pair — a second copy of the defect, on the
  // SAME paths, reached whenever --json was passed. `null` (nothing readable) is reported as a
  // `problem` string rather than collapsed to '': a file nothing could read is not a file of zero
  // bytes, and a consumer seeing 0 would report plenty of headroom.
  const dText = decisionsText ?? '';
  const ltText = longTermText ?? '';
  const arText = archiveText ?? '';
  const problemOf = (abs) => fileProblems[abs] ?? null;
  console.log(
    JSON.stringify({
      root: ROOT,
      decisions: {
        entries: countDecisionEntries(dText),
        bytes: Buffer.byteLength(dText, 'utf8'),
        entry_cap: DECISIONS_ENTRY_CAP,
        byte_cap: DECISIONS_BYTE_CAP,
        problem: problemOf(decisionsPath),
      },
      decisions_archive: {
        bytes: Buffer.byteLength(arText, 'utf8'),
        byte_cap: DECISIONS_ARCHIVE_BYTE_CAP,
        problem: problemOf(decisionsArchivePath),
      },
      long_term: {
        lines: ltText.split('\n').length,
        line_cap: LONG_TERM_LINE_CAP,
        problem: problemOf(longTermPath),
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
