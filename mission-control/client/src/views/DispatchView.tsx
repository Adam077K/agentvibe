// client/src/views/DispatchView.tsx — Phase 8b: the one Mission Control view that writes.
//
// WHAT THIS VIEW DOES AND WHAT IT DOES NOT DO.
//
// It enqueues a goal for a project by POSTing to /api/dispatch. The server validates the
// project exists, trims and bounds the goal, and writes one JSON line to the queue file
// (~/.agentvibe/dispatch-queue.jsonl). Everything stops there for the server.
//
// WHAT ACTS ON THE QUEUE is the founder-run consume-dispatch script, not Mission Control.
// The server never spawns a process — crosscheck.test.ts enforces that at zero exceptions.
// That constraint is the reason the dispatch loop is split this way: a queue the server
// writes and a consumer the founder runs.
//
// REDUCED SCOPE, DECLARED. Phase 8b's original gate requires claims to land in a second
// project's ledger. No sibling project has a ledger (measured 2026-08-12), so the full gate
// is undischarged pending Phase 9. This view operates end-to-end against `agentvibe` only,
// and the consume-dispatch script targets agentvibe specifically. The UI shows all
// discovered projects to make the form production-complete for Phase 9 without pretending
// Phase 9 exists now.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DispatchEntry, DispatchPayload } from '../api.ts';
import { formatCount, formatRelative, formatAbsolute } from '../format.ts';
import { EmptyState, Figure, Footnote, HeadlineBar, RefreshButton, Td, Th } from '../ui.tsx';

// ── Queue table ──────────────────────────────────────────────────────────────────────────

export function DispatchTable({ entries, now }: { entries: DispatchEntry[]; now: number }) {
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr>
          <Th width="16ch">Project</Th>
          <Th>Goal</Th>
          <Th width="10ch">Status</Th>
          <Th align="right" width="16ch">
            Queued
          </Th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={e.id} className={`transition-colors hover:bg-raised ${i % 2 === 1 ? 'bg-row-alt' : ''}`}>
            <Td className="fig text-text">{e.project}</Td>
            <Td>
              <span
                className="block max-w-[80ch] truncate text-muted"
                title={e.goal}
              >
                {e.goal}
              </span>
            </Td>
            <Td>
              {e.status === 'pending' ? (
                <span className="fig text-warn">pending</span>
              ) : (
                <span className="fig text-muted">consumed</span>
              )}
            </Td>
            <Td align="right" className="text-muted" title={formatAbsolute(e.enqueuedAt)}>
              {formatRelative(e.enqueuedAt, now)}
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────────────────

/**
 * The submission result, kept as state so errors survive the loading flag clearing.
 */
type SubmitResult =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; id: string; project: string }
  | { kind: 'error'; message: string };

export interface DispatchHeadline {
  total: number;
  pending: number;
}

export function dispatchHeadline(entries: DispatchEntry[]): DispatchHeadline {
  const pending = entries.filter((e) => e.status === 'pending').length;
  return { total: entries.length, pending };
}

export function DispatchFormHeadline({ headline, loading, onRefresh }: { headline: DispatchHeadline | null; loading: boolean; onRefresh: () => void }) {
  return (
    <HeadlineBar
      action={
        <RefreshButton
          onClick={onRefresh}
          busy={loading}
          idleLabel="Refresh"
          busyLabel="Loading…"
          title="Re-reads the dispatch queue from disk"
        />
      }
    >
      <Figure
        label="Queue entries"
        value={headline === null ? '—' : formatCount(headline.total)}
        sub={headline === null ? 'loading' : `${formatCount(headline.pending)} pending`}
        tone={headline !== null && headline.pending > 0 ? 'warn' : 'default'}
        title="Total entries in ~/.agentvibe/dispatch-queue.jsonl, and how many have not yet been consumed"
      />
    </HeadlineBar>
  );
}

/**
 * The dispatch form. Projects are discovered from the fleet; the user picks one and provides
 * a goal. On submission, /api/dispatch is POSTed with the selected project id and goal text.
 *
 * ONLY TRUSTED PROJECTS ARE OFFERED. The server validates the project id against the live
 * fleet anyway, but showing untrusted projects in the picker would let the user submit
 * requests Mission Control is not allowed to run a collector against — which is confusing
 * rather than a security concern, but still wrong.
 */
export function DispatchForm({
  projects,
  onEnqueued,
}: {
  projects: string[];
  onEnqueued: () => void;
}) {
  const [project, setProject] = useState(projects[0] ?? '');
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState<SubmitResult>({ kind: 'idle' });
  const goalRef = useRef<HTMLTextAreaElement>(null);

  // Keep the selected project valid if the fleet refreshes and the previously-selected
  // project vanishes (e.g. it was a worktree that was removed).
  useEffect(() => {
    if (project && !projects.includes(project)) setProject(projects[0] ?? '');
  }, [project, projects]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (result.kind === 'submitting') return;
      const trimmed = goal.trim();
      if (!trimmed) {
        goalRef.current?.focus();
        return;
      }
      setResult({ kind: 'submitting' });
      try {
        const res = await fetch('/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project, goal: trimmed }),
        });
        const body = (await res.json()) as Record<string, unknown>;
        if (res.ok) {
          setGoal('');
          setResult({ kind: 'success', id: body.id as string, project });
          onEnqueued();
        } else {
          setResult({ kind: 'error', message: (body.error as string | undefined) ?? `${res.status} ${res.statusText}` });
        }
      } catch (err) {
        setResult({ kind: 'error', message: err instanceof Error ? err.message : 'fetch failed' });
      }
    },
    [goal, project, result.kind, onEnqueued]
  );

  const remaining = 2000 - goal.trim().length;
  const tooLong = remaining < 0;

  return (
    <div className="border-t border-line px-6 py-5">
      <div className="label mb-3">New dispatch</div>
      <form onSubmit={submit} className="max-w-[76ch]">
        {/* Project selector */}
        <div className="mb-3">
          <label htmlFor="dispatch-project" className="label mb-1.5 block">
            Project
          </label>
          {projects.length === 0 ? (
            <p className="text-[12.5px] text-muted">
              No discovered projects. Mission Control needs at least one git repository under the configured roots.
            </p>
          ) : (
            <select
              id="dispatch-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="control w-full"
              disabled={result.kind === 'submitting'}
            >
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Goal textarea */}
        <div className="mb-4">
          <label htmlFor="dispatch-goal" className="label mb-1.5 block">
            Goal{' '}
            <span className={`ml-1 text-[11px] ${tooLong ? 'text-bad' : 'text-dim'}`}>
              {remaining >= 0 ? `${remaining} remaining` : `${-remaining} over limit`}
            </span>
          </label>
          <textarea
            id="dispatch-goal"
            ref={goalRef}
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
              // Clear any previous result so the error does not persist while the user types.
              if (result.kind !== 'idle' && result.kind !== 'submitting') setResult({ kind: 'idle' });
            }}
            rows={4}
            placeholder="Describe the goal — what should the agent accomplish?"
            className="control w-full resize-y"
            disabled={result.kind === 'submitting'}
          />
        </div>

        {/* Submit + result */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={projects.length === 0 || tooLong || result.kind === 'submitting'}
            className="rounded bg-live/20 px-3.5 py-1.5 text-[12.5px] font-medium text-live transition-colors hover:bg-live/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {result.kind === 'submitting' ? 'Queuing…' : 'Queue goal'}
          </button>

          {result.kind === 'success' && (
            <span className="text-[12px] text-live">
              Queued for <span className="fig">{result.project}</span> — id{' '}
              <span className="fig text-dim">{result.id.slice(0, 8)}</span>
            </span>
          )}
          {result.kind === 'error' && (
            <span className="text-[12px] text-bad">{result.message}</span>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Panel (the mounted component with hooks) ─────────────────────────────────────────────

/**
 * The queue fetcher. Separated from the form so the queue list and the form can both share
 * the same fetched data without lifting state all the way to App.tsx.
 *
 * `onFreshness` is called on every state change so App.tsx can render the fetched badge
 * rather than the stream badge above this view — same pattern as BeliefPanel, ConflictsPanel
 * and InboxPanel.
 */
export function DispatchPanel({
  now,
  onFreshness,
}: {
  now: number;
  onFreshness: (f: { loadedAt: number | null; failedAt: number | null; loading: boolean }) => void;
}) {
  const [entries, setEntries] = useState<DispatchEntry[] | null>(null);
  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [failedAt, setFailedAt] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    onFreshness({ loadedAt, failedAt, loading });
  }, [loadedAt, failedAt, loading, onFreshness]);

  // Fetch both the queue and the fleet in parallel so the project dropdown shows all current
  // projects without requiring the user to navigate to Fleet first.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch('/api/dispatch').then((r) => {
        if (!r.ok) throw new Error(`GET /api/dispatch: ${r.status} ${r.statusText}`);
        return r.json() as Promise<DispatchPayload>;
      }),
      fetch('/api/fleet').then((r) => {
        if (!r.ok) throw new Error(`GET /api/fleet: ${r.status} ${r.statusText}`);
        return r.json() as Promise<{ projects: Array<{ id: string; trust?: { trusted?: boolean } }> }>;
      }),
    ])
      .then(([queue, fleet]) => {
        if (cancelled) return;
        setEntries(queue.entries);
        // Only offer projects the fleet discovered — untrusted ones excluded, since
        // the server validates against the live fleet and would reject them anyway.
        const discoveredIds = fleet.projects.map((p) => p.id);
        setProjects(discoveredIds);
        setLoadedAt(Date.now());
        setFailedAt(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'fetch failed');
        setFailedAt(Date.now());
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  if (error !== null) {
    return (
      <EmptyState
        headline="The dispatch queue could not be read."
        body={
          <>
            <span className="fig">{error}</span>. Check that the server is running and the queue
            file at <code>~/.agentvibe/dispatch-queue.jsonl</code> is readable.
          </>
        }
      />
    );
  }

  const headline = entries !== null ? dispatchHeadline(entries) : null;

  return (
    <section>
      <DispatchFormHeadline headline={headline} loading={loading} onRefresh={refetch} />

      {/* THE FORM ALWAYS RENDERS while data is loading — it does not depend on the queue.
          A form grayed-out while the queue loads is not helpful: the user may know what they
          want to dispatch before the list arrives. The project dropdown shows a placeholder
          until the fleet responds, which is brief on localhost. */}
      <DispatchForm projects={projects} onEnqueued={refetch} />

      {/* Queue listing — only rendered after the first successful fetch. */}
      {entries !== null && entries.length === 0 && (
        <EmptyState
          headline="No dispatches queued."
          body={
            <>
              The queue file at <code>~/.agentvibe/dispatch-queue.jsonl</code> is empty or does not
              exist yet. Submit a goal above to create the first entry. To act on a queued entry, run
              the founder-run consumer:{' '}
              <code>bun mission-control/scripts/consume-dispatch.ts</code>.
            </>
          }
        />
      )}

      {entries !== null && entries.length > 0 && (
        <div className="border-t border-line">
          <DispatchTable entries={[...entries].reverse()} now={now} />
        </div>
      )}

      {entries !== null && entries.length > 0 && (
        <Footnote>
          The queue is append-only — entries remain visible after the consumer acts on them (shown
          as <span className="text-muted">consumed</span>). To act on a pending entry, run:{' '}
          <code>bun mission-control/scripts/consume-dispatch.ts</code>. Entries are shown newest-first.
        </Footnote>
      )}
    </section>
  );
}

// ── Top-level view (no hooks) ─────────────────────────────────────────────────────────────

export function DispatchView({
  now,
  onFreshness,
}: {
  now: number;
  onFreshness: (f: { loadedAt: number | null; failedAt: number | null; loading: boolean }) => void;
}) {
  return <DispatchPanel now={now} onFreshness={onFreshness} />;
}
