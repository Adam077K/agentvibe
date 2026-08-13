// client/src/App.tsx — the shell: one subscription, one nav, two views.
//
// Project and Inbox are PR5 and are deliberately absent rather than stubbed. A greyed-out
// tab that opens a "coming soon" panel is a promise the UI cannot keep, and this codebase
// has already paid for one guard whose name outran its reach.

import { useState } from 'react';
import { useMissionControlStream, useNow, type ConnectionState } from './api.ts';
import { formatRelative } from './format.ts';
import { FleetView } from './views/FleetView.tsx';
import { SessionsView } from './views/SessionsView.tsx';

type Tab = 'fleet' | 'sessions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'fleet', label: 'Fleet' },
  { id: 'sessions', label: 'Sessions' },
];

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

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur-sm">
        <div className="flex items-center gap-6 px-6 py-2.5">
          <div className="label text-text">Mission Control</div>
          <nav className="flex items-center gap-1" aria-label="Views">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`relative px-2.5 py-1 text-[12.5px] transition-colors ${
                  tab === t.id ? 'text-text' : 'text-dim hover:text-muted'
                }`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-2.5 -bottom-[11px] h-px bg-live" />}
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

      <main>
        {tab === 'fleet' ? (
          <FleetView fleet={stream.fleet} now={now} />
        ) : (
          <SessionsView slice={stream.sessions} now={now} />
        )}
      </main>
    </div>
  );
}
