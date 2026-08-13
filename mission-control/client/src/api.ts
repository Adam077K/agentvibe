// client/src/api.ts — the client's only network code.
//
// One EventSource against /events, and nothing else. No polling loop, no fetch on mount, no
// reconnect logic: EventSource already reconnects with backoff and replays Last-Event-ID,
// and hand-rolled reconnection is the part of a live dashboard that breaks silently at 3am.
// The server pushes a slice on connect and thereafter only when its content hash moved (see
// server/routes/stream.ts), so this subscription is also the initial load.
//
// The wire types are IMPORTED FROM THE SERVER, not restated here. `import type` is erased at
// build time, so this costs nothing at runtime and buys the thing a hand-copied interface
// can never have: adding a field to FleetRow and forgetting the view is a type error, not a
// column that silently renders `undefined`.

import { useEffect, useRef, useState } from 'react';
import type { FleetSummary } from '../../server/collectors/fleet.ts';
import type { SessionsSlice } from '../../server/state.ts';

export type { FleetSummary, SessionsSlice };
export type { FleetRow, LauncherInfo, ModalGeneration } from '../../server/collectors/fleet.ts';
export type { SessionSummary } from '../../server/index-store.ts';

/**
 * `connecting` — no frame has arrived yet on this connection.
 * `live`       — at least one slice has arrived and the socket is open.
 * `retrying`   — the socket dropped; the browser is backing off and will retry itself.
 * `failed`     — EventSource gave up (readyState CLOSED). Only a reload recovers.
 */
export type ConnectionState = 'connecting' | 'live' | 'retrying' | 'failed';

export interface StreamState {
  fleet: FleetSummary | null;
  sessions: SessionsSlice | null;
  connection: ConnectionState;
  /** When this client last received any slice — how stale the screen is, measured. */
  lastEventAt: number | null;
}

const INITIAL: StreamState = { fleet: null, sessions: null, connection: 'connecting', lastEventAt: null };

/**
 * Subscribes to /events for the lifetime of the component. Returns whatever has arrived so
 * far; every field is null until its first frame, and the views render a real loading state
 * for that window rather than a zero that looks like an answer.
 */
export function useMissionControlStream(url = '/events'): StreamState {
  const [state, setState] = useState<StreamState>(INITIAL);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const source = new EventSource(url);
    sourceRef.current = source;

    const onSlice = <K extends 'fleet' | 'sessions'>(key: K) => (event: MessageEvent<string>) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return; // a truncated frame is dropped; the next tick carries the same slice again
      }
      setState((prev) => ({
        ...prev,
        [key]: parsed,
        connection: 'live',
        lastEventAt: Date.now(),
      }));
    };

    const onFleet = onSlice('fleet');
    const onSessions = onSlice('sessions');
    const onError = () => {
      setState((prev) => ({
        ...prev,
        connection: source.readyState === EventSource.CLOSED ? 'failed' : 'retrying',
      }));
    };
    const onOpen = () => {
      setState((prev) => (prev.connection === 'live' ? prev : { ...prev, connection: 'connecting' }));
    };

    source.addEventListener('fleet', onFleet as EventListener);
    source.addEventListener('sessions', onSessions as EventListener);
    source.addEventListener('error', onError);
    source.addEventListener('open', onOpen);

    return () => {
      source.removeEventListener('fleet', onFleet as EventListener);
      source.removeEventListener('sessions', onSessions as EventListener);
      source.removeEventListener('error', onError);
      source.removeEventListener('open', onOpen);
      source.close();
      sourceRef.current = null;
    };
  }, [url]);

  return state;
}

/**
 * A clock that ticks on its own, so "4m ago" becomes "5m ago" without a slice arriving.
 * Relative times are the one thing on screen that goes stale while nothing changes.
 */
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
