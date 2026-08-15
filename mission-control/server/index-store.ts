// server/index-store.ts — in-memory session index across every discovered project.
//
// Writes nothing to disk. Cold build reads every transcript in full; refresh() applies
// the same mtime-skip technique scripts/lib/usage.js's recentTurns() uses (see its
// comment at usage.js:119-124: "a file untouched since last read contributes exactly
// what it contributed then") but keeps the cache in a private in-memory Map rather than
// scripts/lib/usage.js's on-disk one — recentTurns() itself is never called (see
// server/lib/usage.ts's header for why), so this file re-implements only the read-side
// of that technique against the two pure functions usage.js exports.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { listTranscripts, turnsFrom, type Turn } from './lib/usage.ts';
import type { Project } from './projects.ts';

/**
 * How many bytes at the end of a file the boundary hash covers.
 *
 * 4 KB, measured rather than picked. Across the real corpus (2,538 files, 3.04 GB,
 * 2026-08-16) a stat-only pass costs 4–6 ms and hashing a trailing window costs 40–55 ms at
 * 4 KB, 63 ms at 16 KB, 118 ms at 64 KB — against the 4,659 ms full build this whole
 * mechanism exists to avoid. 4 KB buys the detection at ~1% of what it replaces; the larger
 * windows buy no additional CLASS of detection, only a wider sample of the same one.
 */
export const BOUNDARY_BYTES = 4096;

export interface FileEntry {
  size: number;
  mtimeMs: number;
  turns: Turn[];
  latestModel: string | null;
  projectId: string;
  sessionId: string;
  file: string;
  /**
   * sha256 of the last {@link BOUNDARY_BYTES} bytes as of this entry's `size` — that is, of
   * `bytes[max(0, size - 4096) … size)`.
   *
   * WHAT IT IS FOR. `size + mtimeMs` is the key this store has always used, and it misses two
   * things. Both were REPRODUCED on a frozen fixture before this field existed, and both are
   * defects on `main` today rather than anything persistence introduced:
   *
   *   1. A file rewritten in place with size AND mtime preserved. The key sees nothing at all:
   *      0 files read, 0 bytes read, stale answer served.
   *   2. A file whose prefix is rewritten while it also grows. `readAppended` reads from the
   *      old offset on the assumption that `bytes[0, prev.size)` are unchanged — an assumption
   *      nothing checked until this field. The changed prefix is never re-read.
   *
   * Persistence creates neither; it widens the window in which they can happen from the ~1 s
   * between SSE ticks to however long Mission Control was shut down. That is why the check is
   * spent on entries restored from disk (see `needsVerify`) rather than on every tick.
   *
   * WHAT IT DOES NOT CATCH, at full strength, because the limit is structural: a rewrite that
   * changes only bytes before `size - 4096` and leaves the final 4 KB byte-identical is
   * invisible to it. YOU CANNOT VERIFY BYTES YOU DO NOT READ, and reading them all is the cost
   * being avoided. This is a sample, not a proof. What a sample misses is recovered by a full
   * rebuild, not by this field.
   */
  boundaryHash: string;
  /**
   * True only for an entry restored from a persisted index and not yet checked against the
   * disk. Set by `hydrate`, cleared the first time `refresh` either verifies the boundary or
   * re-reads the file.
   *
   * WHY NOT SIMPLY "ALWAYS VERIFY". In-process entries were produced by this process and
   * re-stat'd every ~1 s by the SSE tick; entries off disk describe a window nobody watched,
   * of unbounded length. Different trust situations, and the cheap check is spent on the one
   * that needs it. Always-verifying would add the measured 40–55 ms to every 1 s tick — 4x the
   * cost of a 16 ms refresh — to re-answer a question answered a second ago.
   */
  needsVerify: boolean;
}

/** sha256 of the trailing {@link BOUNDARY_BYTES} of `buf`, truncated to 32 hex chars. */
export function boundaryHashOf(buf: Buffer): string {
  return createHash('sha256')
    .update(buf.subarray(Math.max(0, buf.length - BOUNDARY_BYTES)))
    .digest('hex')
    .slice(0, 32);
}

export interface SessionSummary {
  sessionId: string;
  projectId: string;
  file: string;
  turnCount: number;
  outputTokens: number;
  subagentOutputTokens: number;
  firstTurnAt: number | null;
  lastTurnAt: number | null;
  /**
   * `message.model` on the session's most recent usage-bearing turn — the LATEST model,
   * not every model the session used. Null when no turn in the file carries one.
   * The Sessions view labels the column accordingly; see latestModelFrom() below for why
   * the cheap-and-exact answer is preferred over the complete-and-expensive one.
   */
  latestModel: string | null;
}

export interface RefreshResult {
  filesScanned: number;
  filesChanged: number;
  filesRemoved: number;
  /**
   * How many times a transcript was actually opened and read during this build, and how many
   * bytes came back — COUNTED AT THE READ ITSELF, not inferred from the scan.
   *
   * PROVENANCE FIRST, ASSERTION SECOND. `filesScanned` and `bytesRead` are already what this
   * codebase reports about a scan: `WindowUsage` carries both (server/lib/usage.ts:32) and
   * `hashableFleet` deliberately keeps them in the fleet payload as "provenance behind the
   * burn figure" while excluding them from the change hash (server/state.ts:55-61). These are
   * the same two figures for the session index — the component whose entire performance
   * problem is that a cold build reads the whole corpus, and which until now reported how many
   * files it *looked at* and never how much it *read*.
   *
   * AND THEY MAKE A DETERMINISTIC INVARIANT AVAILABLE, which is why they exist in this shape.
   * A cold build must open each scanned transcript EXACTLY ONCE, which is the PAIR
   * `filesScanned === filesRead === distinctFilesRead` — see `distinctFilesRead` for why the
   * first equality alone is not enough. That is a property of the algorithm rather than of the
   * machine: a re-read, a retry loop or a lost early exit breaks it immediately and identically
   * on every machine, where the clock cannot tell a 2x regression from a busy afternoon. See
   * test/live.test.ts for why that distinction is the whole point.
   *
   * Counted at the read site so the two cannot drift: nothing outside `readFull`/`readAppended`
   * may increment them.
   */
  filesRead: number;
  bytesRead: number;
  /**
   * How many DISTINCT paths were read. `filesRead === distinctFilesRead` is the half of "exactly
   * once" that a plain count cannot express, and leaving it out made the invariant weaker than
   * the sentence describing it:
   *
   *   · a transcript read twice inside one `readFull` moves `filesRead` twice and this once;
   *   · a directory listed twice in `transcriptDirs` moves `filesScanned` AND `filesRead`
   *     together, so `filesRead === filesScanned` stays true while the corpus is read twice.
   *
   * Both are exactly the re-read regression the counter exists to catch, and both are invisible
   * without this field.
   */
  distinctFilesRead: number;
  /**
   * Scanned, determined unchanged, and NOT opened. A skipped file is not a read file, and
   * keeping them in separate counters is what lets `filesRead` keep meaning what it says once
   * a build can skip most of the corpus.
   */
  filesSkipped: number;
  /**
   * Scanned, but no transcript bytes were read and it was not skipped either. Three ways in,
   * and the third is not an error:
   *
   *   · `statSync` threw — nothing could be learned about the path at all;
   *   · the read itself threw;
   *   · **the file's mtime moved while its size did not**, so the append is zero bytes long.
   *     This is not hypothetical: measured on the real corpus 2026-08-16, five transcripts
   *     across two unrelated projects had their mtimes rewritten to the same millisecond (four
   *     by exactly 3600.0 s) with byte-identical content — a bulk metadata touch by something
   *     that wrote nothing. The cheap key says "changed", the disk says otherwise, and calling
   *     that a read would be the counter agreeing with the key instead of with the disk.
   *
   * Exists so the invariant below CLOSES rather than quietly not adding up.
   *
   * THE COLD-PATH INVARIANT, and it is deterministic on every machine:
   *
   *     filesScanned === filesRead + filesSkipped + filesUnread
   *
   * A file is scanned exactly once and lands in exactly one bucket. Without this third bucket
   * the sum would silently fall short on any corpus holding an unreadable transcript, and a
   * reader would reasonably conclude the skip logic had a bug. Compare the pre-existing
   * `filesScanned === filesRead === distinctFilesRead`, which still holds EXACTLY as before
   * for a true cold build (no prior index: nothing is skipped, so `filesSkipped` is 0).
   */
  filesUnread: number;
  /**
   * How many boundary-hash probes were performed — a 4 KB read at a recorded offset, to answer
   * "is this file still the file this entry describes".
   *
   * KEPT SEPARATE FROM `filesRead` DELIBERATELY. A 4 KB probe is not a transcript read: it
   * parses nothing and contributes no turns. Counting it in `filesRead` would make that
   * counter mean two different things at once, which is the exact defect this codebase keeps
   * finding. Its bytes DO land in `bytesRead`, because they were genuinely read off the disk —
   * and a true cold build performs zero probes, so `bytesRead` there is unpolluted and still
   * cross-checks against an independent corpus walk (test/live.test.ts).
   */
  filesVerified: number;
  /**
   * Of those probes, how many found the file had changed underneath an unchanged `size` +
   * `mtimeMs`, or an altered prefix beneath an append — i.e. how many times the cheap key was
   * WRONG and the boundary hash caught it. Zero is the expected value; a non-zero value is the
   * mechanism reporting that it earned its cost.
   */
  filesStale: number;
  /**
   * Bytes read for boundary hashing — probes, plus the anchor window re-read after an append.
   *
   * SEPARATE FROM `bytesRead` FOR THE SAME REASON `filesVerified` IS SEPARATE FROM `filesRead`.
   * `bytesRead` is a DECODED-TEXT count of transcript content, and test/units.test.ts pins it
   * to exactly the appended slice on the tail-read path — an assertion that would stop meaning
   * anything if a fixed 4 KB of anchor bytes were folded in. These bytes are real disk reads
   * and are reported; they are simply not the same quantity.
   */
  verifyBytesRead: number;
}

/**
 * The model on the last usage-bearing turn in a transcript, read by locating that one line
 * and JSON.parsing only it — so the answer is `message.model` exactly, never a `"model"`
 * key that happened to appear in some tool call's arguments.
 *
 * WHY THE LATEST TURN AND NOT EVERY MODEL THE SESSION USED. Measured on the real corpus
 * (2,036 files, 2.83 GB): collecting the distinct set costs a full second pass — 2.6 s
 * line-scoped, 2.2 s as one whole-text regex — on top of a 4.1 s cold build against a
 * 10 s budget (c-mission-control-cold-start). This costs **52 ms** for all 2,036 files.
 * The whole-text variant was also wrong on its own terms: it returned `nano_banana_pro`,
 * `kling3_0_turbo` and other MCP tool parameters as though they were session models.
 * A session that switched models mid-run shows only its latest here, and the view says so
 * rather than implying the column is exhaustive.
 */
export function latestModelFrom(text: string): string | null {
  const idx = text.lastIndexOf('"output_tokens"');
  if (idx === -1) return null;
  const start = text.lastIndexOf('\n', idx) + 1;
  const nl = text.indexOf('\n', idx);
  const end = nl === -1 ? text.length : nl;
  try {
    const parsed = JSON.parse(text.slice(start, end)) as { message?: { model?: unknown } };
    const model = parsed.message?.model;
    return typeof model === 'string' ? model : null;
  } catch {
    return null; // a partial trailing line, same as turnsFrom treats it
  }
}

function summarize(entry: FileEntry): SessionSummary {
  let output = 0;
  let subagent = 0;
  let first: number | null = null;
  let last: number | null = null;
  for (const t of entry.turns) {
    output += t.out;
    if (t.side) subagent += t.out;
    if (first === null || t.t < first) first = t.t;
    if (last === null || t.t > last) last = t.t;
  }
  return {
    sessionId: entry.sessionId,
    projectId: entry.projectId,
    file: entry.file,
    turnCount: entry.turns.length,
    outputTokens: output,
    subagentOutputTokens: subagent,
    firstTurnAt: first,
    lastTurnAt: last,
    latestModel: entry.latestModel,
  };
}

export class IndexStore {
  private files = new Map<string, FileEntry>();
  private builtAt = 0;
  /** Incremented ONLY by readFull/readAppended; zeroed per build by `startCounting`. */
  private reads = 0;
  private bytes = 0;
  private readPaths = new Set<string>();
  private skips = 0;
  private unread = 0;
  private verifies = 0;
  private stales = 0;
  private verifyBytes = 0;

  /**
   * What the last build actually did — the same object it returned.
   *
   * Kept so a caller that did not invoke the build directly can still see its provenance:
   * `/api/sessions` goes through `LiveState.sessionsSlice`, which calls `refresh()` and keeps
   * the payload, so without this the figures would be produced and immediately discarded.
   * Null until the first build.
   */
  private last: RefreshResult | null = null;

  get lastBuiltAt(): number {
    return this.builtAt;
  }

  get fileCount(): number {
    return this.files.size;
  }

  get lastResult(): RefreshResult | null {
    return this.last;
  }

  /** Zeroes the per-build counters. Called at the top of every build, never elsewhere. */
  private startCounting(): void {
    this.reads = 0;
    this.bytes = 0;
    this.readPaths.clear();
    this.skips = 0;
    this.unread = 0;
    this.verifies = 0;
    this.stales = 0;
    this.verifyBytes = 0;
  }

  /**
   * Restores entries from a persisted index, replacing whatever this store held.
   *
   * Every restored entry is marked `needsVerify`, so the NEXT `refresh` checks each one
   * against the disk before trusting it. Hydrating does not itself make the index usable: it
   * makes a cheap `refresh` possible, and `refresh` is what establishes freshness. Callers go
   * hydrate → refresh, never hydrate alone; `LiveState` is the only such caller.
   */
  hydrate(entries: Iterable<FileEntry>): number {
    this.files.clear();
    for (const e of entries) this.files.set(e.file, { ...e, needsVerify: true });
    return this.files.size;
  }

  /** Full read of every transcript in every project. No prior state is reused. */
  buildCold(projects: Project[]): RefreshResult {
    this.files.clear();
    this.startCounting();
    let scanned = 0;
    for (const project of projects) {
      for (const dir of project.transcriptDirs) {
        for (const file of listTranscripts(dir)) {
          scanned++;
          this.readFull(file, project.id);
        }
      }
    }
    this.builtAt = Date.now();
    this.last = {
      filesScanned: scanned,
      filesChanged: scanned,
      filesRemoved: 0,
      filesRead: this.reads,
      bytesRead: this.bytes,
      distinctFilesRead: this.readPaths.size,
      // Nothing is skipped when there is no prior state, so `filesScanned === filesRead`
      // survives here exactly as it did before the skip counters existed. `filesUnread` picks
      // up any read that threw — previously those made the equality quietly false.
      filesSkipped: 0,
      filesUnread: scanned - this.reads,
      filesVerified: 0,
      filesStale: 0,
      verifyBytesRead: 0,
    };
    return this.last;
  }

  /**
   * Re-stats every transcript. Unchanged files are skipped entirely (no read). Appended
   * files are read from the previous byte offset only. Anything else (new file,
   * truncated/rotated file) is read in full. Files that no longer exist are dropped from
   * the index.
   */
  refresh(projects: Project[]): RefreshResult {
    this.startCounting();
    let scanned = 0;
    let changed = 0;
    const seen = new Set<string>();

    for (const project of projects) {
      for (const dir of project.transcriptDirs) {
        for (const file of listTranscripts(dir)) {
          scanned++;
          seen.add(file);

          let st: fs.Stats;
          try {
            st = fs.statSync(file);
          } catch {
            this.unread++; // scanned, but nothing could be learned about it
            continue;
          }

          const prev = this.files.get(file);
          if (prev && prev.mtimeMs === st.mtimeMs && prev.size === st.size) {
            // Untouched by the cheap key. For an entry this process produced, that settles it.
            // For one restored from disk it does not: the key is blind to a rewrite that
            // preserves both fields, so the boundary is checked once before the entry is
            // trusted, and a file that fails it is re-read in full.
            if (!prev.needsVerify || this.boundaryStillMatches(file, prev)) {
              prev.needsVerify = false;
              this.skips++;
              continue;
            }
            this.stales++;
            changed++;
            this.readFull(file, project.id, st);
            continue;
          }
          changed++;

          // The append path reads from `prev.size` on the assumption that everything before it
          // is unchanged. For a restored entry that assumption spans a shutdown of unbounded
          // length, so it is TESTED rather than assumed — and a failure means the prefix moved,
          // which only a full read can resolve.
          if (prev && st.size >= prev.size) {
            if (!prev.needsVerify || this.boundaryStillMatches(file, prev)) {
              this.readAppended(file, project.id, prev, st);
            } else {
              this.stales++;
              this.readFull(file, project.id, st);
            }
          } else {
            this.readFull(file, project.id, st);
          }
        }
      }
    }

    let removed = 0;
    for (const file of [...this.files.keys()]) {
      if (!seen.has(file)) {
        this.files.delete(file);
        removed++;
      }
    }

    this.builtAt = Date.now();
    // A REFRESH IS NOT A COLD BUILD, and `filesRead === filesScanned` deliberately does NOT
    // hold here: the whole point of refresh() is that an untouched file is skipped without
    // being read. `filesRead === filesChanged` is the corresponding property, and it is
    // asserted in test/units.test.ts rather than here.
    this.last = {
      filesScanned: scanned,
      filesChanged: changed,
      filesRemoved: removed,
      filesRead: this.reads,
      bytesRead: this.bytes,
      distinctFilesRead: this.readPaths.size,
      filesSkipped: this.skips,
      // Derived, not counted separately, so it cannot drift from the other three: every
      // scanned path either was read, was skipped, or is this. See RefreshResult.filesUnread.
      filesUnread: scanned - this.reads - this.skips,
      filesVerified: this.verifies,
      filesStale: this.stales,
      verifyBytesRead: this.verifyBytes,
    };
    return this.last;
  }

  /**
   * Re-reads the {@link BOUNDARY_BYTES} ending at `prev.size` and compares them against the
   * hash recorded when that entry was built. True means the file still looks like the file the
   * entry describes; false means it demonstrably does not.
   *
   * A PROBE THAT COULD NOT RUN RETURNS FALSE, NEVER TRUE. An unreadable file, a short read, a
   * file that shrank below the recorded offset — none of those are evidence the entry is
   * still good, and returning true on them would make this a mechanism reporting success about
   * something it did not measure. False costs a full re-read, which is correct by construction.
   */
  private boundaryStillMatches(file: string, prev: FileEntry): boolean {
    const off = Math.max(0, prev.size - BOUNDARY_BYTES);
    const len = prev.size - off;
    if (len <= 0) return false; // a zero-length recorded entry anchors nothing
    let fd: number | null = null;
    try {
      fd = fs.openSync(file, 'r');
      const buf = Buffer.alloc(len);
      const got = fs.readSync(fd, buf, 0, len, off);
      if (got !== len) return false; // the file no longer reaches the offset it was hashed at
      this.verifies++;
      this.verifyBytes += got;
      return boundaryHashOf(buf) === prev.boundaryHash;
    } catch {
      return false;
    } finally {
      if (fd !== null) {
        try {
          fs.closeSync(fd);
        } catch {
          /* already gone */
        }
      }
    }
  }

  private readFull(file: string, projectId: string, stKnown?: fs.Stats) {
    let text: string;
    let buf: Buffer;
    let st: fs.Stats;
    try {
      st = stKnown ?? fs.statSync(file);
      // READ AS A BUFFER, DECODED AFTER. Same syscall, same bytes, one extra reason: the
      // boundary hash must cover the bytes that are ON DISK. Hashing `Buffer.from(text)`
      // instead would hash a RE-ENCODING — and for any transcript holding invalid UTF-8 the
      // round trip is lossy (each bad byte becomes a 3-byte replacement character), so the
      // stored hash would not match what a later probe reads back, and the file would be
      // re-read in full forever without anything saying why.
      buf = fs.readFileSync(file);
      text = buf.toString('utf8');
      // COUNTED IMMEDIATELY AFTER THE READ ITSELF, not once per call to this method, and the
      // difference is the whole point: a second `readFileSync` added inside this try block
      // moves `reads` twice while `readPaths` stays at one, so the re-read shows up. Counting
      // per call would have missed it.
      //
      // STILL `Buffer.byteLength(text)` AND NOT `buf.length`, THOUGH THE BUFFER IS RIGHT HERE.
      // Changing it to the buffer's length was tried and reverted: `bytesRead` is deliberately
      // a DECODED-TEXT count, because test/live.test.ts brackets it against a stat-side walk of
      // the corpus and that comparison is only an independent oracle while the two counts have
      // independent sources. `buf.length` would make it stat-vs-stat — a number compared with
      // itself. See test/units.test.ts, "bytesRead counts DECODED bytes", which pins exactly
      // this with a deliberately invalid-UTF-8 fixture.
      this.reads++;
      this.bytes += Buffer.byteLength(text, 'utf8');
      this.readPaths.add(file);
    } catch {
      return; // NOT counted: a read that threw is not a read, and counting it would make
      // `filesRead === filesScanned` true on a corpus half of which could not be opened.
    }
    this.files.set(file, {
      size: st.size,
      mtimeMs: st.mtimeMs,
      turns: turnsFrom(text),
      latestModel: latestModelFrom(text),
      projectId,
      sessionId: path.basename(file, '.jsonl'),
      file,
      boundaryHash: boundaryHashOf(buf),
      needsVerify: false, // just read in full: this entry IS the disk
    });
  }

  private readAppended(file: string, projectId: string, prev: FileEntry, st: fs.Stats) {
    const len = st.size - prev.size;
    let chunk = '';
    // The new boundary window ends at the NEW size, and when the appended chunk is shorter
    // than BOUNDARY_BYTES it reaches back into bytes this call never read. Read the window
    // explicitly rather than deriving it from the chunk: a hash computed over "the chunk,
    // padded with whatever we happen to have" would not match what a later probe reads at the
    // same offset, and the mismatch would look like corruption.
    let boundary = prev.boundaryHash;
    let fd: number | null = null;
    try {
      fd = fs.openSync(file, 'r');
      if (len > 0) {
        const buf = Buffer.alloc(len);
        const got = fs.readSync(fd, buf, 0, len, prev.size);
        chunk = buf.subarray(0, got).toString('utf8');
        this.reads++;
        this.bytes += Buffer.byteLength(chunk, 'utf8'); // decoded, as in readFull
        this.readPaths.add(file);
      }
      const off = Math.max(0, st.size - BOUNDARY_BYTES);
      const wlen = st.size - off;
      if (wlen > 0) {
        const wbuf = Buffer.alloc(wlen);
        const wgot = fs.readSync(fd, wbuf, 0, wlen, off);
        // A short read leaves the recorded hash unable to describe the recorded size, so the
        // entry must not claim one. Zeroing it forces the next refresh down the full-read
        // path — the safe direction, and never a silent pass.
        boundary = wgot === wlen ? boundaryHashOf(wbuf.subarray(0, wgot)) : '';
        this.verifyBytes += wgot; // anchor bytes, NOT transcript bytes — see verifyBytesRead
      } else {
        boundary = '';
      }
    } catch {
      chunk = ''; // as in readFull: a failed read is not counted
      boundary = '';
    } finally {
      if (fd !== null) {
        try {
          fs.closeSync(fd);
        } catch {
          /* already gone */
        }
      }
    }
    this.files.set(file, {
      size: st.size,
      mtimeMs: st.mtimeMs,
      turns: [...prev.turns, ...turnsFrom(chunk)],
      // The appended bytes are the newest turns, so a model found in them IS the latest.
      // When the chunk carries no usage-bearing turn, the previous answer still stands —
      // it is not superseded by an absence.
      latestModel: latestModelFrom(chunk) ?? prev.latestModel,
      projectId,
      sessionId: prev.sessionId,
      file,
      boundaryHash: boundary,
      needsVerify: false, // either verified above or re-read; either way, checked against disk
    });
  }

  /**
   * The entries as they stand, for a caller that persists them. Returns the live objects
   * rather than copies — the only caller serialises them immediately and a defensive copy of
   * 166,374 turns would cost more than the write does.
   */
  entries(): IterableIterator<FileEntry> {
    return this.files.values();
  }

  sessionsFor(projectId: string): SessionSummary[] {
    const out: SessionSummary[] = [];
    for (const entry of this.files.values()) {
      if (entry.projectId === projectId) out.push(summarize(entry));
    }
    return out.sort((a, b) => (b.lastTurnAt ?? 0) - (a.lastTurnAt ?? 0));
  }

  allSessions(): SessionSummary[] {
    return [...this.files.values()]
      .map(summarize)
      .sort((a, b) => (b.lastTurnAt ?? 0) - (a.lastTurnAt ?? 0));
  }
}
