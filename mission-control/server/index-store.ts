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
}

export interface RefreshResult {
  filesScanned: number;
  filesChanged: number;
  filesRemoved: number;
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
  };
}

export class IndexStore {
  private files = new Map<string, FileEntry>();
  private builtAt = 0;

  get lastBuiltAt(): number {
    return this.builtAt;
  }

  get fileCount(): number {
    return this.files.size;
  }

  /** Full read of every transcript in every project. No prior state is reused. */
  buildCold(projects: Project[]): RefreshResult {
    this.files.clear();
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
    return { filesScanned: scanned, filesChanged: scanned, filesRemoved: 0 };
  }

  /**
   * Re-stats every transcript. Unchanged files are skipped entirely (no read). Appended
   * files are read from the previous byte offset only. Anything else (new file,
   * truncated/rotated file) is read in full. Files that no longer exist are dropped from
   * the index.
   */
  refresh(projects: Project[]): RefreshResult {
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
    return { filesScanned: scanned, filesChanged: changed, filesRemoved: removed };
  }

  private readFull(file: string, projectId: string, stKnown?: fs.Stats) {
    let text: string;
    let st: fs.Stats;
    try {
      st = stKnown ?? fs.statSync(file);
      text = fs.readFileSync(file, 'utf8');
    } catch {
      return;
    }
    this.files.set(file, {
      size: st.size,
      mtimeMs: st.mtimeMs,
      turns: turnsFrom(text),
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
    } catch {
      chunk = '';
    }
    this.files.set(file, {
      size: st.size,
      mtimeMs: st.mtimeMs,
      turns: [...prev.turns, ...turnsFrom(chunk)],
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
