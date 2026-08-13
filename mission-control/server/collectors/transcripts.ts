// server/collectors/transcripts.ts — per-project session rollups, read from the
// in-memory index (server/index-store.ts). No file I/O of its own: every number here
// traces back to scripts/lib/usage.js's turnsFrom() by way of the index store.

import type { IndexStore, SessionSummary } from '../index-store.ts';
import type { Project } from '../projects.ts';

export interface ProjectTranscriptStats {
  projectId: string;
  sessionCount: number;
  totalOutputTokens: number;
  totalSubagentOutputTokens: number;
  lastActivityAt: number | null;
}

export function collectSessions(project: Project, store: IndexStore): SessionSummary[] {
  return store.sessionsFor(project.id);
}

export function collectProjectStats(project: Project, store: IndexStore): ProjectTranscriptStats {
  const sessions = store.sessionsFor(project.id);
  let totalOutputTokens = 0;
  let totalSubagentOutputTokens = 0;
  let lastActivityAt: number | null = null;
  for (const s of sessions) {
    totalOutputTokens += s.outputTokens;
    totalSubagentOutputTokens += s.subagentOutputTokens;
    if (s.lastTurnAt !== null && (lastActivityAt === null || s.lastTurnAt > lastActivityAt)) {
      lastActivityAt = s.lastTurnAt;
    }
  }
  return {
    projectId: project.id,
    sessionCount: sessions.length,
    totalOutputTokens,
    totalSubagentOutputTokens,
    lastActivityAt,
  };
}
