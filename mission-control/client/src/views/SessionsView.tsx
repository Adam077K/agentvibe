// client/src/views/SessionsView.tsx — every indexed session, live and historical, across
// every discovered project.
//
// "Live" is a defined predicate, not a vibe: a session whose most recent recorded turn is
// inside LIVE_WINDOW_MS (format.ts). The footnote states the rule on screen, because a
// green dot whose meaning is only in the source is a green dot nobody can act on.
//
// SessionsTable is pure and stateless for the same reason FleetTable is — test/views.test.tsx
// renders it against a real /api/sessions payload and reverses every displayed figure.

import { useMemo, useState } from 'react';
import type { SessionSummary, SessionsSlice } from '../api.ts';
import { formatAbsolute, formatCount, formatRelative, isLive, shortId } from '../format.ts';
import { EmptyState, Footnote, LoadingRows, StatusDot, Td, Th, Unavailable } from '../ui.tsx';

const COLUMNS = 8;
const PAGE = 200;

// WHY THERE IS NO COST COLUMN. The first build had one, rendering "no rate table" in every
// row. Against the real corpus that was two hundred identical cells saying the same three
// words — a placeholder wearing an explanation's clothes, and worse than no column at all.
// The absence is stated ONCE, below the table, where it can carry the whole reason.
const NO_COST_REASON =
  'The transcript index records token counts, not prices: scripts/lib/usage.js counts output tokens, which is what the budget guard caps. This repository holds no per-model price table, and a hardcoded one would be a guess that goes stale silently the next time rates move. A checked-in, versioned USD rate table keyed by model id is what would fill this.';

export function filterSessions(sessions: SessionSummary[], projectId: string, query: string): SessionSummary[] {
  const q = query.trim().toLowerCase();
  return sessions.filter((s) => {
    if (projectId !== 'all' && s.projectId !== projectId) return false;
    if (!q) return true;
    return (
      s.sessionId.toLowerCase().includes(q) ||
      s.projectId.toLowerCase().includes(q) ||
      (s.latestModel ?? '').toLowerCase().includes(q)
    );
  });
}

export function SessionsTable({
  slice,
  now,
  limit = PAGE,
  projectId = 'all',
  query = '',
}: {
  slice: SessionsSlice | null;
  now: number;
  limit?: number;
  projectId?: string;
  query?: string;
}) {
  const filtered = useMemo(
    () => (slice ? filterSessions(slice.sessions, projectId, query) : []),
    [slice, projectId, query]
  );
  const shown = filtered.slice(0, limit);

  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr>
          <Th width="26px" title="Filled when the most recent turn is within the live window">
            <span className="sr-only">Live</span>
          </Th>
          <Th>Session</Th>
          <Th>Project</Th>
          <Th title="message.model on this session's most recent recorded turn">Model · latest turn</Th>
          <Th align="right" title="Turns carrying a usage record">
            Turns
          </Th>
          <Th align="right">Output tokens</Th>
          <Th align="right" title="Output tokens on this session's subagent (isSidechain) turns">
            Subagent
          </Th>
          <Th align="right">Last turn</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line/70">
        {slice === null && <LoadingRows columns={COLUMNS} />}
        {shown.map((s) => {
          const live = isLive(s.lastTurnAt, now);
          return (
            <tr key={s.file} className="transition-colors hover:bg-raised">
              <Td className="pr-0 pl-4">
                <StatusDot
                  tone={live ? 'live' : 'idle'}
                  breathing={live}
                  title={live ? 'Live — a turn within the last 5 minutes' : 'Historical — no turn in the last 5 minutes'}
                />
              </Td>
              <Td mono className={live ? 'text-text' : 'text-muted'} title={`${s.sessionId}\n${s.file}`}>
                {shortId(s.sessionId)}
              </Td>
              <Td className="fig">{s.projectId}</Td>
              <Td mono className="text-muted">
                {s.latestModel ?? (
                  <Unavailable
                    short="unrecorded"
                    why="No turn in this transcript carries a message.model field — typically a session with no assistant turn yet, or one written by a tool that does not record the model."
                  />
                )}
              </Td>
              <Td align="right" mono className={s.turnCount > 0 ? '' : 'text-dim'}>
                {formatCount(s.turnCount)}
              </Td>
              <Td align="right" mono className={s.outputTokens > 0 ? '' : 'text-dim'}>
                {formatCount(s.outputTokens)}
              </Td>
              <Td align="right" mono className="text-muted">
                {formatCount(s.subagentOutputTokens)}
              </Td>
              <Td align="right" className="text-muted" title={`first turn ${formatAbsolute(s.firstTurnAt)}\nlast turn ${formatAbsolute(s.lastTurnAt)}`}>
                {formatRelative(s.lastTurnAt, now)}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function SessionsView({ slice, now }: { slice: SessionsSlice | null; now: number }) {
  const [projectId, setProjectId] = useState('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const projects = useMemo(() => {
    if (!slice) return [];
    return [...new Set(slice.sessions.map((s) => s.projectId))].sort((a, b) => a.localeCompare(b));
  }, [slice]);

  const filtered = useMemo(
    () => (slice ? filterSessions(slice.sessions, projectId, query) : []),
    [slice, projectId, query]
  );
  const liveCount = useMemo(() => filtered.filter((s) => isLive(s.lastTurnAt, now)).length, [filtered, now]);

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-2.5">
        <label className="flex items-center gap-2">
          <span className="label">Project</span>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setLimit(PAGE);
            }}
            className="fig rounded-[3px] border border-line bg-raised px-2 py-1 text-[12px] text-text"
          >
            <option value="all">all</option>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="label">Filter</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="session id, project or model"
            className="fig min-w-0 flex-1 rounded-[3px] border border-line bg-raised px-2 py-1 text-[12px] text-text placeholder:text-dim"
          />
        </label>
        <div className="fig text-[11.5px] text-dim">
          {slice === null ? (
            <span className="skeleton inline-block h-[10px] w-40 align-middle" />
          ) : (
            <>
              {formatCount(Math.min(limit, filtered.length))} of {formatCount(filtered.length)} shown
              {filtered.length !== (slice.sessions.length ?? 0) && <> · {formatCount(slice.sessions.length)} indexed</>}
              {' · '}
              <span className={liveCount > 0 ? 'text-live' : ''}>{formatCount(liveCount)} live</span>
            </>
          )}
        </div>
      </div>

      {slice !== null && filtered.length === 0 ? (
        <EmptyState
          headline={
            slice.sessions.length === 0
              ? 'No transcripts indexed yet.'
              : 'No session matches this filter.'
          }
          body={
            slice.sessions.length === 0 ? (
              <>
                Sessions are read from <code>~/.claude/projects</code>, one directory per working directory Claude Code
                has run in, matched to a project by that encoded path. An index with nothing in it means either no
                session has run in any discovered project, or the transcript root is somewhere else —{' '}
                <code>AGENTVIBE_PROJECTS_DIR</code> overrides it.
              </>
            ) : (
              <>
                {formatCount(slice.sessions.length)} sessions are indexed; none of them match{' '}
                {projectId === 'all' ? '' : <code>{projectId}</code>}
                {projectId === 'all' || !query ? '' : ' and '}
                {query ? <code>{query}</code> : ''}. Clear the filter to see all of them.
              </>
            )
          }
        />
      ) : (
        <>
          <SessionsTable slice={slice} now={now} limit={limit} projectId={projectId} query={query} />
          {slice !== null && filtered.length > limit && (
            <div className="border-t border-line px-6 py-3">
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE)}
                className="rounded-[3px] border border-line-strong px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-live hover:text-text active:translate-y-[1px]"
              >
                Show {formatCount(Math.min(PAGE, filtered.length - limit))} more
              </button>
            </div>
          )}
        </>
      )}

      <Footnote>
        A session is <span className="text-live">live</span> when its most recent recorded turn is within 5 minutes;
        everything else is historical, and both are listed here. Model is the one on that most recent turn — a session
        that switched models mid-run shows only its latest. A row whose subagent total equals its output total is a
        subagent transcript, written under its parent session&rsquo;s directory.{' '}
        <span className="text-muted">There is no cost column</span>, and this is why: {NO_COST_REASON}
      </Footnote>
    </section>
  );
}
