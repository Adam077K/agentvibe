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
import { listTranscripts, turnsFrom, type Turn } from './lib/usage.ts';
import type { Project } from './projects.ts';

interface FileEntry {
  size: number;
  mtimeMs: number;
  turns: Turn[];
  latestModel: string | null;
  projectId: string;
  sessionId: string;
  file: string;
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
            continue;
          }

          const prev = this.files.get(file);
          if (prev && prev.mtimeMs === st.mtimeMs && prev.size === st.size) {
            continue; // untouched since last read — contributes exactly what it did then
          }
          changed++;

          if (prev && st.size >= prev.size) {
            this.readAppended(file, project.id, prev, st);
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
    };
    return this.last;
  }

  private readFull(file: string, projectId: string, stKnown?: fs.Stats) {
    let text: string;
    let st: fs.Stats;
    try {
      st = stKnown ?? fs.statSync(file);
      text = fs.readFileSync(file, 'utf8');
      // COUNTED IMMEDIATELY AFTER THE READ ITSELF, not once per call to this method, and the
      // difference is the whole point: a second `readFileSync` added inside this try block
      // moves `reads` twice while `readPaths` stays at one, so the re-read shows up. Counting
      // per call would have missed it. Bytes are taken with Buffer.byteLength rather than
      // `text.length`, which is UTF-16 code units — the two agree only for ASCII, and
      // transcripts are not.
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
    });
  }

  private readAppended(file: string, projectId: string, prev: FileEntry, st: fs.Stats) {
    const len = st.size - prev.size;
    let chunk = '';
    try {
      const fd = fs.openSync(file, 'r');
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, prev.size);
      fs.closeSync(fd);
      chunk = buf.toString('utf8');
      this.reads++;
      this.bytes += Buffer.byteLength(chunk, 'utf8');
      this.readPaths.add(file);
    } catch {
      chunk = ''; // as in readFull: a failed read is not counted
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
    });
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
