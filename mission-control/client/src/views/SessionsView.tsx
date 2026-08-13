// client/src/views/SessionsView.tsx — every indexed session, live and historical, across
// every discovered project.
//
// "Live" is a defined predicate, not a vibe: a session whose most recent recorded turn is
// inside LIVE_WINDOW_MS (format.ts). The footnote states the rule on screen, because a
// green dot whose meaning is only in the source is a green dot nobody can act on.
//
// SessionsTable is pure and stateless for the same reason FleetTable is — test/views.test.tsx
// renders it against a real /api/sessions payload and reverses every displayed figure.

import { useMemo, useState, type ReactNode } from 'react';
import type { SessionSummary, SessionsSlice } from '../api.ts';
import { formatAbsolute, formatCount, formatRelative, formatShare, isLive, shortId } from '../format.ts';
import { EmptyState, Footnote, LoadingRows, StatusDot, Td, Th, Unavailable } from '../ui.tsx';

const COLUMNS = 8;
const PAGE = 200;

// WHY THERE IS NO COST COLUMN. The first build had one, rendering "no rate table" in every
// row. Against the real corpus that was two hundred identical cells saying the same three
// words — a placeholder wearing an explanation's clothes, and worse than no column at all.
// The absence is stated ONCE, below the table, where it can carry the whole reason.
const NO_COST_REASON =
  'The transcript index records token counts, not prices: scripts/lib/usage.js counts output tokens, which is what the budget guard caps. This repository holds no per-model price table, and a hardcoded one would be a guess that goes stale silently the next time rates move. A checked-in, versioned USD rate table keyed by model id is what would fill this.';

/**
 * `<synthetic>` is a real value Claude Code writes into `message.model`, and rendering it
 * raw put literal angle brackets in a column of model ids — it read as a broken tag next to
 * `claude-opus-5`, which is exactly the impression a control plane must not give about its
 * own data. The `unrecorded` case beside it was already handled properly; this is the same
 * treatment for a value that IS recorded but is not a model.
 */
export function modelLabel(model: string): ReactNode {
  if (model.startsWith('<') && model.endsWith('>')) {
    return (
      <Unavailable
        short={model.slice(1, -1)}
        why={`Claude Code recorded the literal value "${model}" as this session's model. It marks a turn the client generated itself rather than one a model produced, so there is no model id to show.`}
      />
    );
  }
  return model;
}

/**
 * WHAT THE COLUMN ACTUALLY SAYS, instead of a number said twice. A raw "Subagent tokens"
 * column sat next to "Output tokens" and repeated it exactly: measured across the whole real
 * corpus, 1,918 of 2,037 sessions are entirely subagent output and 66 entirely main, with
 * ZERO mixed. Two adjacent identical eight-digit numbers to encode one bit.
 *
 * "Zero mixed today" is an observation, not a guarantee, so the mixed branch is real and
 * tested: when a transcript does carry both, the share is shown rather than a label that
 * would be false. Exact figures stay in the title on every branch.
 */
export function KindCell({ session }: { session: SessionSummary }) {
  const { outputTokens, subagentOutputTokens } = session;
  const exact = `${formatCount(subagentOutputTokens)} of ${formatCount(outputTokens)} output tokens are subagent (isSidechain) turns`;

  if (outputTokens === 0) {
    return (
      <Unavailable
        short="no output"
        why="This transcript records no output tokens at all, so there is no split between main and subagent turns to report."
      />
    );
  }
  if (subagentOutputTokens === 0) return <span title={exact}>main</span>;
  if (subagentOutputTokens === outputTokens) return <span title={exact}>subagent</span>;
  return <span title={exact}>{formatShare(subagentOutputTokens, outputTokens)} subagent</span>;
}

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
          {/* Capped, not sized by its longest value. Session ids run from 8 characters to
              40; letting the outlier set the column gave Session and Model half the table
              between them while every numeric column was squeezed. The full id stays in the
              title, and CSS truncation is visual only — the text in the DOM is complete. */}
          <Th width="21ch">Session</Th>
          <Th width="12ch">Project</Th>
          <Th width="20ch" title="message.model on this session's most recent recorded turn">
            Model · latest turn
          </Th>
          <Th align="right" title="Turns carrying a usage record">
            Turns
          </Th>
          <Th align="right" title="Output tokens across this session's turns">
            Output tokens
          </Th>
          <Th align="right" title="Whether this transcript's output came from subagent (isSidechain) turns">
            Kind
          </Th>
          <Th align="right">Last turn</Th>
        </tr>
      </thead>
      <tbody>
        {slice === null && <LoadingRows columns={COLUMNS} />}
        {shown.map((s, i) => {
          const live = isLive(s.lastTurnAt, now);
          return (
            <tr
              key={s.file}
              className={`transition-colors hover:bg-raised ${i % 2 === 1 ? 'bg-row-alt' : ''}`}
            >
              <Td className="pr-0 pl-4">
                <StatusDot
                  tone={live ? 'live' : 'idle'}
                  breathing={live}
                  title={live ? 'Live — a turn within the last 5 minutes' : 'Historical — no turn in the last 5 minutes'}
                />
              </Td>
              <Td mono className={live ? 'text-text' : 'text-muted'} title={`${s.sessionId}\n${s.file}`}>
                <span className="block max-w-[21ch] truncate">{shortId(s.sessionId)}</span>
              </Td>
              {/* Every capped column carries its full value in a title. The rule existed and
                  was applied to Session alone; Model and Project truncated into an ellipsis
                  with no way back — `claude-haiku-4-5-20251001` was unrecoverable on 7 of
                  200 rows. (CSS truncation never removes text from the accessibility tree,
                  so this is specifically a pointer-user fix.) */}
              <Td className="fig" title={s.projectId}>
                <span className="block max-w-[12ch] truncate">{s.projectId}</span>
              </Td>
              <Td mono className="text-muted" title={s.latestModel ?? undefined}>
                <span className="block max-w-[20ch] truncate">
                  {s.latestModel === null ? (
                    <Unavailable
                      short="unrecorded"
                      why="No turn in this transcript carries a message.model field — typically a session with no assistant turn yet, or one written by a tool that does not record the model."
                    />
                  ) : (
                    modelLabel(s.latestModel)
                  )}
                </span>
              </Td>
              <Td align="right" mono className={s.turnCount > 0 ? '' : 'text-dim'}>
                {formatCount(s.turnCount)}
              </Td>
              <Td align="right" mono className={s.outputTokens > 0 ? '' : 'text-dim'}>
                {formatCount(s.outputTokens)}
              </Td>
              <Td align="right" className="text-muted">
                <KindCell session={s} />
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
            className="control"
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
            // `.control` is shared with the select beside it — see styles.css. They are two
            // sibling controls and must read as the same kind of thing.
            className="control min-w-0 flex-1"
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
        that switched models mid-run shows only its latest. <span className="text-muted">Kind</span> reads{' '}
        <span className="text-muted">subagent</span> for a transcript written under a parent session&rsquo;s
        <code>subagents/</code> directory and <span className="text-muted">main</span> for the parent itself; a
        transcript carrying both shows the subagent share instead. Hover it for the exact token counts.{' '}
        <span className="text-muted">There is no cost column</span>, and this is why: {NO_COST_REASON}
      </Footnote>
    </section>
  );
}
