// client/src/App.tsx — the shell: one subscription, one nav, ONE VIEW REGISTRY.
//
// PR3 hardcoded the view list in three places — a `type Tab` union, a `TABS` array, and a
// two-branch ternary in <main>. Two views made that survivable; four does not, and the shape
// of the bug it produces is a tab that renders the wrong panel because one of the three lists
// was updated and another was not. THE REGISTRY IS THE ONLY LIST. `Tab` is derived from it,
// the nav maps it, and <main> looks up the active entry — so adding a view is adding one
// entry, and forgetting a place is a compile error rather than a blank screen.
//
// EACH VIEW OWNS ITS OWN DATA, and they do not all get it the same way. Fleet and Sessions
// read the SSE stream (see api.ts for the measured reason belief and conflicts do not).
// Belief and Conflicts fetch when their tab is opened. A view is MOUNTED only while it is
// active, so opening a tab is what triggers its fetch — and switching away and back refetches
// rather than showing a cached figure from ten minutes ago. On a control plane, a stale
// number that looks live is the more expensive of the two failures.

import { useState, type ReactNode } from 'react';
import {
  useEndpoint,
  useMissionControlStream,
  useNow,
  type BeliefSummary,
  type ConflictReport,
  type ConnectionState,
  type StreamState,
} from './api.ts';
import { formatRelative } from './format.ts';
import { FleetView } from './views/FleetView.tsx';
import { SessionsView } from './views/SessionsView.tsx';
import { BeliefView } from './views/BeliefView.tsx';
import { ConflictsView } from './views/ConflictsView.tsx';

interface ViewContext {
  stream: StreamState;
  now: number;
}

interface ViewDef {
  id: string;
  label: string;
  render: (ctx: ViewContext) => ReactNode;
}

/**
 * Belief and Conflicts are wrapped in components rather than called inline because they own
 * hooks. A hook cannot live in a `render` arm that only runs for the active tab — but it can
 * live inside a component that is only mounted for the active tab, which is the same thing
 * expressed where React can see it.
 */
function BeliefPanel({ now }: { now: number }) {
  const { data, loading, error, refetch } = useEndpoint<BeliefSummary>('/api/belief');
  return <BeliefView belief={data} loading={loading} error={error} now={now} onRefresh={refetch} />;
}

function ConflictsPanel() {
  const { data, loading, error, refetch } = useEndpoint<{ reports: ConflictReport[] }>('/api/conflicts');
  return <ConflictsView reports={data?.reports ?? null} loading={loading} error={error} onRefresh={refetch} />;
}

// THE ONE LIST. Order here is the order in the nav.
const VIEWS = [
  { id: 'fleet', label: 'Fleet', render: ({ stream, now }) => <FleetView fleet={stream.fleet} now={now} /> },
  { id: 'sessions', label: 'Sessions', render: ({ stream, now }) => <SessionsView slice={stream.sessions} now={now} /> },
  { id: 'belief', label: 'Belief', render: ({ now }) => <BeliefPanel now={now} /> },
  { id: 'conflicts', label: 'Conflicts', render: () => <ConflictsPanel /> },
] as const satisfies readonly ViewDef[];

/** Derived from the registry — there is no second list of view ids to keep in step. */
export type Tab = (typeof VIEWS)[number]['id'];

const CONNECTION_COPY: Record<ConnectionState, { text: string; tone: string; title: string }> = {
  connecting: {
    text: 'connecting',
    tone: 'text-muted',
    title: 'The stream is open but no slice has arrived yet. The first one waits on a cold index build — a few seconds across a large transcript corpus.',
  },
  live: {
    text: 'live',
    tone: 'text-live',
    title: 'Subscribed to /events. The server pushes a slice only when its contents change, so a quiet wire means a quiet fleet, not a stalled feed.',
  },
  retrying: {
    text: 'reconnecting',
    tone: 'text-warn',
    title: 'The stream dropped. EventSource is backing off and will reconnect on its own; the figures below are the last ones received.',
  },
  failed: {
    text: 'disconnected',
    tone: 'text-bad',
    title: 'EventSource gave up. Check that the server is running (bun run server, port 4300) and reload this page.',
  },
};

function ConnectionBadge({ state, lastEventAt, now }: { state: ConnectionState; lastEventAt: number | null; now: number }) {
  const copy = CONNECTION_COPY[state];
  return (
    <div className="flex items-center gap-2 text-[11.5px]" title={copy.title}>
      <span
        className={`inline-block h-[7px] w-[7px] rounded-full ${
          state === 'live' ? 'bg-live breathe' : state === 'failed' ? 'bg-bad' : state === 'retrying' ? 'bg-warn' : 'bg-line-strong'
        }`}
      />
      <span className={copy.tone}>{copy.text}</span>
      {lastEventAt !== null && <span className="fig text-dim">· updated {formatRelative(lastEventAt, now)}</span>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('fleet');
  const stream = useMissionControlStream();
  const now = useNow();

  const active = VIEWS.find((v) => v.id === tab) ?? VIEWS[0];

  return (
    <div className="min-h-[100dvh]">
      {/* Fixed height, read from the same --mc-header-h the sticky column headers offset by.
          If the bar's height and that offset are ever derived separately they will disagree,
          and the symptom is a table's column labels painted underneath this element. */}
      <header
        className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur-sm"
        style={{ height: 'var(--mc-header-h)' }}
      >
        <div className="flex h-full items-center gap-6 px-6">
          <div className="label text-text">Mission Control</div>
          <nav className="flex h-full items-center gap-1" aria-label="Views">
            {VIEWS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`relative flex h-full items-center px-2.5 text-[12.5px] transition-colors ${
                  tab === t.id ? 'text-text' : 'text-dim hover:text-muted'
                }`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-2.5 bottom-0 h-px bg-live" />}
              </button>
            ))}
          </nav>
          <div className="ml-auto">
            <ConnectionBadge state={stream.connection} lastEventAt={stream.lastEventAt} now={now} />
          </div>
        </div>
      </header>

      {/* The first slice waits on a full cold index build — several seconds on a large
          transcript corpus. Without saying so, that window looks like a hung page. */}
      {stream.fleet === null && stream.sessions === null && stream.connection !== 'failed' && (
        <div className="border-b border-line px-6 py-2 text-[12px] text-muted">
          Building the session index — one full read of every transcript under{' '}
          <code className="fig">~/.claude/projects</code>, a few seconds on a large corpus. Every refresh after this one
          reads only the bytes that were appended.
        </div>
      )}

      {stream.connection === 'failed' && (
        <div className="border-b border-bad/40 bg-bad/10 px-6 py-2 text-[12px] text-bad">
          The live stream is closed and will not retry. Start the server with{' '}
          <code className="fig">bun run server</code> in <code className="fig">mission-control/</code>, then reload.
          Everything below is the last state received, not the current one.
        </div>
      )}

      <main>{active.render({ stream, now })}</main>
    </div>
  );
}
