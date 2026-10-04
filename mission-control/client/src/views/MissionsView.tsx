// client/src/views/MissionsView.tsx — v3 thin slice: the Missions board and the live team.
//
// Waiting / Working / Done. Create a card; drag it from Waiting to Working (or press Launch) and
// the server appends `queued` to the board file — nothing more. The founder-run runner
// (scripts/run-missions.ts) does the launching. This view polls the folded board and, for the
// selected mission, the folded team (each agent by title + model, status, latest events).
//
// Polling, not SSE: see server/routes/missions.ts for why.

import { useCallback, useEffect, useState, type DragEvent, type FormEvent } from 'react';
import type { Mission, MissionsPayload, TeamView } from '../api.ts';
import { formatRelative } from '../format.ts';
import { HeadlineBar } from '../ui.tsx';
import type { Freshness } from '../App.tsx';

const COLUMNS = ['Waiting', 'Working', 'Done'] as const;
type Column = (typeof COLUMNS)[number];

function columnOf(m: Mission): Column {
  if (m.status === 'waiting') return 'Waiting';
  if (m.status === 'queued' || m.status === 'working') return 'Working';
  return 'Done';
}

function usePoll<T>(url: string | null, ms: number): { data: T | null; error: string | null; loadedAt: number | null; failedAt: number | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [failedAt, setFailedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) {
      setData(null);
      return;
    }
    let live = true;
    const load = async () => {
      try {
        const r = await fetch(url);
        const j = await r.json();
        if (!live) return;
        if (!r.ok) {
          setError(j.error ?? `HTTP ${r.status}`);
          setFailedAt(Date.now());
        } else {
          setData(j as T);
          setError(null);
          setLoadedAt(Date.now());
        }
      } catch (e) {
        if (live) {
          setError(String(e));
          setFailedAt(Date.now());
        }
      }
    };
    void load();
    const t = setInterval(load, ms);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [url, ms, tick]);
  return { data, error, loadedAt, failedAt, refetch: useCallback(() => setTick((n) => n + 1), []) };
}

function StatusPill({ m }: { m: Mission }) {
  if (m.status === 'done' && m.verdict) {
    const pass = m.verdict === 'PASS';
    return <span className={`fig text-[11px] ${pass ? 'text-live' : 'text-bad'}`}>Referee {m.verdict}</span>;
  }
  const tone = m.status === 'failed' ? 'text-bad' : m.status === 'waiting' ? 'text-dim' : 'text-warn';
  return <span className={`fig text-[11px] ${tone}`}>{m.status}</span>;
}

function Card({ m, now, selected, onSelect, onLaunch }: { m: Mission; now: number; selected: boolean; onSelect: () => void; onLaunch: () => void }) {
  const onDragStart = (e: DragEvent) => e.dataTransfer.setData('text/mission-id', m.id);
  return (
    <div
      draggable={m.status === 'waiting'}
      onDragStart={onDragStart}
      onClick={onSelect}
      data-testid={`card-${m.id}`}
      className={`cursor-pointer rounded border px-3 py-2 ${selected ? 'border-live' : 'border-line'} bg-raised`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-text">{m.title}</span>
        <StatusPill m={m} />
      </div>
      <p className="mt-1 line-clamp-3 text-[12px] text-muted" title={m.goal}>
        {m.goal}
      </p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-dim">
        <span>{formatRelative(m.updatedAt, now)}</span>
        {typeof m.costUsd === 'number' && <span className="fig">${m.costUsd.toFixed(3)}</span>}
        {m.status === 'waiting' && (
          <button
            type="button"
            className="rounded border border-line-strong px-2 py-0.5 text-text hover:border-live"
            onClick={(e) => {
              e.stopPropagation();
              onLaunch();
            }}
          >
            Launch
          </button>
        )}
      </div>
      {m.verdictReasons && m.verdictReasons.length > 0 && (
        <ul className="mt-2 list-disc pl-4 text-[11px] text-muted">
          {m.verdictReasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {m.error && <p className="mt-1 text-[11px] text-bad">{m.error}</p>}
    </div>
  );
}

function TeamPanel({ mission, now }: { mission: Mission; now: number }) {
  const active = mission.status === 'queued' || mission.status === 'working';
  const { data, error } = usePoll<TeamView>(`/api/missions/${mission.id}/team`, active ? 1000 : 5000);
  return (
    <section className="mt-6" data-testid="team-panel">
      <h2 className="mb-2 text-[13px] text-text">
        Team — {mission.title} <span className="text-dim">({mission.status})</span>
      </h2>
      {error && <p className="text-[12px] text-bad">{error}</p>}
      {data && data.agents.length === 0 && (
        <p className="text-[12px] text-dim">
          No team events yet. {mission.status === 'queued' ? 'Queued — waiting for the runner (bun run missions).' : ''}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {data?.agents.map((a) => (
          <div key={a.agent} className="rounded border border-line bg-row-alt p-3" data-testid={`agent-${a.agent}`}>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-text">
                {a.title} <span className="fig text-muted">· {a.model}</span> <span className="text-dim">({a.family})</span>
              </span>
              <span className={`fig text-[11px] ${a.status === 'failed' ? 'text-bad' : a.status === 'finished' ? 'text-live' : 'text-warn'}`}>
                {a.status}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-dim">
              {a.eventCount} events{typeof a.costUsd === 'number' ? ` · $${a.costUsd.toFixed(4)}` : ''}
            </div>
            <ol className="mt-2 space-y-1">
              {a.latest.map((e, i) => (
                <li key={i} className="text-[11px] text-muted">
                  <span className="fig text-dim">{formatRelative(e.ts, now)}</span> <span className="text-text">{e.kind}</span> {e.text}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      {data && data.receipts.length > 0 && (
        <div className="mt-3">
          <h3 className="text-[12px] text-text">Receipts</h3>
          <ul className="mt-1 space-y-0.5">
            {data.receipts.map((r, i) => (
              <li key={i} className="fig text-[11px] text-muted">
                {r.text}
                {typeof r.data?.sha256 === 'string' ? ` sha256:${r.data.sha256.slice(0, 12)}…` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function MissionsView({ now, onFreshness }: { now: number; onFreshness?: (f: Freshness) => void }) {
  const board = usePoll<MissionsPayload>('/api/missions', 1500);
  useEffect(() => onFreshness?.({ loadedAt: board.loadedAt, failedAt: board.failedAt, loading: board.loadedAt === null && board.failedAt === null }), [board.loadedAt, board.failedAt, onFreshness]);
  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const missions = board.data?.missions ?? [];
  const sel = missions.find((m) => m.id === selected) ?? null;

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const r = await fetch('/api/missions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, goal }) });
    const j = await r.json();
    if (!r.ok) return setErr(j.error);
    setTitle('');
    setGoal('');
    setSelected(j.mission.id);
    board.refetch();
  };

  const launch = async (id: string) => {
    setErr(null);
    const r = await fetch(`/api/missions/${id}/launch`, { method: 'POST' });
    const j = await r.json();
    if (!r.ok) setErr(j.error);
    setSelected(id);
    board.refetch();
  };

  const onDrop = (col: Column) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/mission-id');
    if (id && col === 'Working') void launch(id);
  };

  return (
    <div>
      <HeadlineBar>
        <span className="text-text">Missions</span>
        <span className="text-dim"> · drag Waiting → Working to launch a Builder (Claude) + Referee (Codex) team</span>
      </HeadlineBar>
      <form onSubmit={create} className="my-4 flex flex-wrap items-end gap-2">
        <input className="w-56 rounded border border-line-strong bg-raised px-2 py-1 text-[13px]" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Mission title" />
        <input className="min-w-[24rem] flex-1 rounded border border-line-strong bg-raised px-2 py-1 text-[13px]" placeholder="Goal" value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Mission goal" />
        <button type="submit" className="rounded border border-line-strong px-3 py-1 text-[13px] text-text hover:border-live">
          Create card
        </button>
      </form>
      {(err || board.error) && <p className="mb-2 text-[12px] text-bad">{err ?? board.error}</p>}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col} onDragOver={(e) => e.preventDefault()} onDrop={onDrop(col)} className="min-h-40 rounded border border-line p-2" data-testid={`col-${col}`}>
            <h2 className="mb-2 text-[12px] uppercase tracking-wide text-dim">
              {col} <span className="fig">{missions.filter((m) => columnOf(m) === col).length}</span>
            </h2>
            <div className="space-y-2">
              {missions
                .filter((m) => columnOf(m) === col)
                .map((m) => (
                  <Card key={m.id} m={m} now={now} selected={m.id === selected} onSelect={() => setSelected(m.id)} onLaunch={() => void launch(m.id)} />
                ))}
            </div>
          </div>
        ))}
      </div>
      {sel && <TeamPanel mission={sel} now={now} />}
    </div>
  );
}
