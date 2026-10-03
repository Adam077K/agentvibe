// client/src/views/DecisionsView.tsx — v3 thin slice: questions agents are waiting on you for.
//
// A Builder that cannot continue without a choice ends its reply with a DECISION line; the runner
// writes it to ~/.agentvibe/decisions.jsonl and waits. This view lists what is pending as buttons,
// one per option. Pressing one POSTs the choice; the server appends one line and the runner, which
// is polling that file, resumes the mission. Nothing here launches anything.
//
// Polled, like Missions (1.5s): the file is small and folded server-side. Answering refetches at
// once so the card leaves Pending on the press, not on the next tick — and a 409 (answered
// elsewhere, or the runner gave up waiting) is shown as the reason rather than swallowed.

import { useEffect, useState } from 'react';
import type { DecisionRow, DecisionsPayload } from '../api.ts';
import { formatRelative } from '../format.ts';
import { EmptyState, HeadlineBar } from '../ui.tsx';
import type { Freshness } from '../App.tsx';
import { usePoll } from './MissionsView.tsx';

function PendingCard({ d, now, onAnswer, busy }: { d: DecisionRow; now: number; onAnswer: (id: string, choice: string) => void; busy: boolean }) {
  return (
    <div className="rounded border border-warn/60 bg-raised px-4 py-3" data-testid={`decision-${d.id}`}>
      <div className="flex items-baseline justify-between gap-3 text-[11px] text-dim">
        <span>{d.missionTitle ?? `mission ${d.missionId.slice(0, 8)}`}</span>
        <span>{formatRelative(d.createdAt, now)}</span>
      </div>
      <p className="mt-1 text-[14px] text-text">{d.question}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {d.options.map((o) => (
          <button
            key={o}
            type="button"
            disabled={busy}
            onClick={() => onAnswer(d.id, o)}
            className="rounded border border-line-strong px-3 py-1 text-[13px] text-text transition-colors hover:border-live disabled:cursor-wait disabled:opacity-50"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DecisionHistory({ rows, now }: { rows: DecisionRow[]; now: number }) {
  return (
    <ul className="space-y-1" data-testid="decision-history">
      {rows.map((d) => (
        <li key={d.id} className="text-[12px] text-muted">
          <span className="fig text-dim">{formatRelative(d.answeredAt ?? d.createdAt, now)}</span>{' '}
          <span className="text-text">{d.question}</span>{' '}
          {d.status === 'answered' ? (
            <span className="text-live">→ {d.choice}</span>
          ) : (
            <span className="text-bad" title="The runner stopped waiting before this was answered, so the mission went back to Waiting.">
              expired
            </span>
          )}
          {d.missionTitle && <span className="text-dim"> · {d.missionTitle}</span>}
        </li>
      ))}
    </ul>
  );
}

export function DecisionsView({ now, onFreshness }: { now: number; onFreshness?: (f: Freshness) => void }) {
  const feed = usePoll<DecisionsPayload>('/api/decisions', 1500);
  useEffect(() => onFreshness?.({ loadedAt: feed.loadedAt, failedAt: feed.failedAt, loading: feed.loadedAt === null && feed.failedAt === null }), [feed.loadedAt, feed.failedAt, onFreshness]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const answer = async (id: string, choice: string) => {
    setErr(null);
    setBusyId(id);
    try {
      const r = await fetch(`/api/decisions/${id}/answer`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ choice }) });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? `HTTP ${r.status}`);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusyId(null);
      feed.refetch();
    }
  };

  const pending = feed.data?.pending ?? [];
  const history = feed.data?.answered ?? [];

  return (
    <div>
      <HeadlineBar>
        <span className="text-text">Decisions</span>
        <span className="text-dim">
          {' '}
          · {feed.data ? `${pending.length} waiting on you` : 'loading'} — a Builder that needs a choice stops and asks here
        </span>
      </HeadlineBar>
      <div className="px-6 py-4">
        {(err || feed.error) && <p className="mb-3 text-[12px] text-bad">{err ?? feed.error}</p>}
        {feed.data && pending.length === 0 && (
          <EmptyState
            headline="Nothing is waiting on you."
            body={
              <>
                A running mission asks here when its Builder ends a reply with a <code className="fig">DECISION:</code> line. The question appears with
                one button per option; the mission continues the moment you press one.
              </>
            }
          />
        )}
        <div className="space-y-3">
          {pending.map((d) => (
            <PendingCard key={d.id} d={d} now={now} onAnswer={(id, choice) => void answer(id, choice)} busy={busyId === d.id} />
          ))}
        </div>
        {history.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-[12px] uppercase tracking-wide text-dim">Recently answered</h2>
            <DecisionHistory rows={history} now={now} />
          </section>
        )}
      </div>
    </div>
  );
}
