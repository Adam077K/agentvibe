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
const fileProblems = Object.create(null); // abs path -> why it could not be read
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

/**
 * The parse is ambiguous — an unterminated code fence swallowed the rest of the file.
 *
 * ── THIS IS A BLOCKING FAILURE, NOT A NOTE, AND THE REASON IS THE ENTRY CAP ─────────────────
 *
 * `parseDecisionEntries` reports the condition and this file used to drop it on the floor.
 * Measured: 60 entries plus one unterminated fence gave `exit 0 · entries: 2 · failures: []`,
 * with no mention of ambiguity anywhere in the output. So the 50-entry cap failed OPEN on a file
 * this checker called small — the same shape as the CRLF hole, whose fix comment in
 * scripts/lib/memory-entries.js says exactly that.
 *
 * Worse than failing open: `evict-memory` REFUSES this input while the BLOCKING CI checker
 * passes it. Two consumers of one parser, disagreeing about whether the document is readable, is
 * the defect the library's own "ONE PARSER, NOT TWO" header exists to prevent — sharing the
 * parser is not enough if the consumers disagree about what its output means.
 */
function ambiguityOf(text) {
  return parseDecisionEntries(text).ambiguous || null;
}

// ── check DECISIONS.md ───────────────────────────────────────────────────────
const decisionsPath = path.join(ROOT, '.claude', 'memory', 'DECISIONS.md');

const decisionsText = loadMemoryFile(decisionsPath, { required: true });

if (decisionsText !== null) {
  const text = decisionsText;
  const bytes = Buffer.byteLength(text, 'utf8');
  const entries = countDecisionEntries(text);
  const ambiguous = ambiguityOf(text);

  if (ambiguous) {
    fail(
      'decisions-parse-ambiguous',
      `DECISIONS.md cannot be parsed unambiguously: ${ambiguous}. ` +
        `The entry count below (${entries}) is therefore a LOWER BOUND, not a measurement, and the ` +
        `${DECISIONS_ENTRY_CAP}-entry cap cannot be enforced against it. Close the fence. ` +
        `The usual cause is a fenced example containing a \`## YYYY-MM-DD\` heading.`
    );
  }

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

// ── check every archive volume ─────────────────────────────────────────────────
//
// Discovered by pattern, never by a hard-coded list of names. Naming the volumes here would mean
// that opening volume 4 governs it only if somebody also remembered to edit this file — and an
// unchecked archive volume is exactly the state the single archive was in before it was capped:
// 18,538 bytes, checked by nothing.
const memoryDir = path.join(ROOT, '.claude', 'memory');

/**
 * ── A NAME IS NOT A FILE, AND THE WRONG KIND OF ENTRY DOES NOT ALWAYS CRASH ─────────────────
 *
 * `ARCHIVE_VOLUME_RE` matches a NAME. Every matching name went straight to `readFileSync`.
 * Measured 2026-08-26 against constructed trees, one bad entry per tree:
 *
 *   a DIRECTORY named like a volume  → EISDIR, unhandled, raw stack trace, exit 1
 *   a DANGLING SYMLINK               → ENOENT, likewise
 *   a FIFO                           → NEVER RETURNS. Killed by an 8s alarm at 8,011 ms having
 *                                      printed nothing at all about the volume (exit 142).
 *
 * The FIFO is the one that matters. This script is a BLOCKING CI step, and there a crash names
 * itself while a hang is indistinguishable from a slow build.
 *
 * ONE QUESTION IS ASKED HERE, SO ONE PREDICATE ANSWERS IT — a claim about THIS file, established
 * by reading it, NOT inherited from scripts/evict-memory.mjs, which genuinely needs two. That
 * tool also asks "is this path free to CREATE?", which must NOT resolve symlinks or it will write
 * through one onto an inode that already exists. This file creates nothing: it contains no
 * writeFileSync, appendFileSync, mkdirSync, renameSync, rmSync, unlinkSync or openSync. Its only
 * question is "does this hold volume content I must cap?" — and that one MUST resolve, because a
 * volume reached through a symlink is content the cap has to bound. `lstatSync` here would stop
 * capping it, which is why `statSync` is not a detail. Pinned by a control case, not by comment.
 *
 * A matching entry that is not a regular file FAILS; it is not skipped. Skipping would place an
 * archive volume beyond the cap according to how somebody named a directory — the unchecked-volume
 * state this whole section exists to end.
 */
function entryKind(abs) {
  let st;
  try {
    st = fs.statSync(abs); // RESOLVES symlinks — see above; lstatSync would be wrong here
  } catch (e) {
    return { ok: false, kind: `unresolvable (${(e && e.code) || (e && e.message) || e})` };
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
 * ── THE KIND GUARD IS NOT A READABILITY GUARD, AND `stat` CANNOT TELL YOU THE DIFFERENCE ──────
 *
 * `entryKind` asks the KIND question and answers it correctly. It cannot answer the ACCESS
 * question, because `stat(2)` needs no read permission on its subject: a regular file at mode
 * 0000 satisfies `st.isFile()` and then throws `EACCES` out of `readFileSync` one line later.
 * Measured 2026-09-01 on `origin/main` at e8c8ae5, one bad entry per constructed tree, as uid 501:
 *
 *   DECISIONS.md at mode 0000          → EACCES, unhandled, raw stack trace, exit 1
 *   DECISIONS_ARCHIVE.md at mode 0000  → EACCES, unhandled, raw stack trace, exit 1
 *
 * Both sites promise the opposite. `loadMemoryFile` reserves `problem` for "present, and nothing
 * could be read from it", and the volume loop's own comment says "a named refusal, not a stack
 * trace" — which was true for EISDIR, ENOENT and a FIFO and false for the one case where the
 * file really is a regular file. So this is the third member of a class the guard above closed
 * two members of, and it is the member `stat` was always going to miss.
 *
 * EACCES IS NOT THE ONLY MEMBER, WHICH IS WHY THIS CATCHES RATHER THAN PRE-CHECKS. `EPERM`,
 * `EIO`, `ELOOP` and `ERR_STRING_TOO_LONG` all reach the same place, and an `access(2)` pre-check
 * would answer only the first of them while adding a TOCTOU window. The read is the test.
 *
 * @param {string} abs
 * @returns {{ok: true, text: string} | {ok: false, why: string}}
 */
function readGuarded(abs) {
  try {
    return { ok: true, text: fs.readFileSync(abs, 'utf8') };
  } catch (e) {
    // The errno belongs IN the message — it is the diagnosis, not the delivery. Same reasoning as
    // the dangling-symlink refusal, which carries its ENOENT for exactly this reason.
    return { ok: false, why: `unreadable (${(e && e.code) || (e && e.message) || e})` };
  }
}

/**
 * ── THE SAME DEFECT AT THE FIXED PATHS, WHICH THE VOLUME SCAN DOES NOT REACH ────────────────
 *
 * `archiveVolumes()` above guards the entries it DISCOVERS. `DECISIONS.md` and `LONG-TERM.md` are
 * not discovered — they are read from a known path, and each was guarded by `existsSync` and then
 * handed to `readFileSync`. That pair is safe for a regular file, safe for a symlink to one, and
 * safe for a DANGLING symlink: `existsSync` follows links, so a broken one reads as absent and the
 * `missing-file` refusal already covers it. It is not safe for anything else. Measured 2026-08-26
 * at `.claude/memory/DECISIONS.md`, one bad entry per constructed tree:
 *
 *   a DIRECTORY at that path → EISDIR, unhandled, raw stack trace, exit 1
 *   a FIFO at that path      → NEVER RETURNS. Killed by an 8s cap at 8,016 ms, exit 142.
 *
 * Same class as the scan, different site, and neither guard reaches the other's paths.
 *
 * @param {string} abs
 * @param {{required: boolean}} o `required` files fail when absent.
 * @returns {string|null} contents, or null when there is nothing to measure
 */
function loadMemoryFile(abs, { required }) {
  if (!fs.existsSync(abs)) {
    // Follows symlinks, so a dangling link lands here rather than below — deliberately unchanged.
    if (required) {
      fail('missing-file', `${abs} does not exist. Create it or point --root at the repo root.`);
    }
    // Absent is deliberately NOT recorded as a `problem`: for a required file the failure above
    // already says so, and `problem` means "present, and nothing could be read from it".
    return null;
  }
  const k = entryKind(abs);
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
  const r = readGuarded(abs);
  if (!r.ok) {
    fail(
      'memory-file-unreadable',
      `${abs} is a regular file that could not be read — ${r.why}. This is the state ` +
        `\`problem\` is reserved for: present, and nothing could be read from it. Nothing can be ` +
        `measured here: restore read permission, or move whatever is at that path out of the way.`
    );
    fileProblems[abs] = r.why;
    return null;
  }
  return r.text;
}

/** @returns {Array<{name: string, bytes: number|null, problem: string|null, unreadable: boolean}>} in name order. */
function archiveVolumes() {
  let names;
  try { names = fs.readdirSync(memoryDir); } catch { return []; }
  return names
    .filter((n) => ARCHIVE_VOLUME_RE.test(n))
    .sort()
    .map((n) => {
      const abs = path.join(memoryDir, n);
      const k = entryKind(abs);
      if (!k.ok) return { name: n, bytes: null, problem: k.kind, unreadable: false };
      const r = readGuarded(abs);
      // `bytes: null` and NOT 0, exactly as for a bad kind: a volume nothing could read is not a
      // volume of zero bytes, and a consumer that saw 0 would report plenty of room.
      if (!r.ok) return { name: n, bytes: null, problem: r.why, unreadable: true };
      return {
        name: n,
        bytes: Buffer.byteLength(r.text, 'utf8'),
        problem: null,
        unreadable: false,
      };
    });
}

const volumes = archiveVolumes(); // none is fine — the archive is not required to exist
for (const vol of volumes) {
  // A named refusal, not a stack trace. `readFileSync` reported these as EISDIR/ENOENT from deep
  // inside node with no mention of which entry caused it — and reported the FIFO not at all.
  if (vol.problem !== null) {
    // TWO CODES, NOT ONE, BECAUSE THE REMEDIES ARE OPPOSITE. A volume of the wrong KIND is fixed
    // by moving something out of the way; a volume that is the right kind and cannot be READ is
    // fixed by restoring permission. Reporting the second as `archive-volume-not-a-file` would
    // also be a false statement about it — it IS a file.
    if (vol.unreadable) {
      fail(
        'archive-volume-unreadable',
        `${vol.name} is a regular file that could not be read — ${vol.problem}. ` +
          `Nothing can be capped here: restore read permission on it, or rename this entry so it ` +
          `no longer matches ${ARCHIVE_VOLUME_RE}.`
      );
      continue;
    }
    fail(
      'archive-volume-not-a-file',
      `${vol.name} matches the archive-volume pattern but is ${vol.problem}. ` +
        `An archive volume must be a regular file (a symlink to one is fine — it is resolved). ` +
        `Nothing can be capped here: either give the name to a real volume, or rename this entry ` +
        `so it no longer matches ${ARCHIVE_VOLUME_RE}.`
    );
    continue;
  }
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
  // Reuse what the checks above already loaded. This block used to re-read both paths with the
  // same unguarded `existsSync ? readFileSync : ''` pair — a second copy of the defect, on the
  // SAME paths, reached whenever --json was passed. The archive is not re-read here either: it is
  // discovered by `archiveVolumes()` and reported from `volumes` below.
  const dText = decisionsText ?? '';
  const ltText = longTermText ?? '';
  const problemOf = (abs) => fileProblems[abs] ?? null;
  console.log(
    JSON.stringify({
      root: ROOT,
      decisions: {
        entries: countDecisionEntries(dText),
        parse_ambiguous: ambiguityOf(dText),
        bytes: Buffer.byteLength(dText, 'utf8'),
        entry_cap: DECISIONS_ENTRY_CAP,
        byte_cap: DECISIONS_BYTE_CAP,
        problem: problemOf(decisionsPath),
      },
      // Every volume, each with its own cap. `decisions_archive` remains as the volume-1 view so
      // an existing consumer of this JSON keeps working; it is the first element of the list, not
      // a second measurement of it.
      decisions_archive: volumes.length
        ? { bytes: volumes[0].bytes, byte_cap: DECISIONS_ARCHIVE_BYTE_CAP, problem: volumes[0].problem }
        : { bytes: 0, byte_cap: DECISIONS_ARCHIVE_BYTE_CAP },
      // `bytes: null` with a `problem` string, never `bytes: 0` — a volume nothing could read is
      // not a volume of zero bytes, and a machine consumer that saw 0 would report plenty of room.
      decisions_archive_volumes: volumes.map((v) => ({
        name: v.name, bytes: v.bytes, byte_cap: DECISIONS_ARCHIVE_BYTE_CAP, problem: v.problem,
      })),
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
