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

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FleetSummary } from '../../server/collectors/fleet.ts';
import type { SessionsSlice } from '../../server/state.ts';

export type { FleetSummary, SessionsSlice };
export type { FleetRow, LauncherInfo, ModalGeneration } from '../../server/collectors/fleet.ts';
export type { SessionSummary } from '../../server/index-store.ts';
export type {
  BeliefSummary,
  ScopeBand,
  ClaimsSummary,
  VerdictCounts,
  Waiver,
  Absent,
} from '../../server/collectors/belief.ts';
export type { ConflictReport, FileConflict, WorktreeChanges } from '../../server/collectors/conflicts.ts';
export type { LedgerClaim } from '../../server/projects.ts';

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
 * One fetch of one route, for the views that are NOT on the stream.
 *
 * WHY BELIEF AND CONFLICTS ARE NOT ON THE SSE TICK, in measured numbers rather than taste.
 * The stream pushes a slice whenever its content hash moves, and the tick recomputes every
 * subscribed slice. Measured on this machine 2026-08-13, through the real routes:
 *
 *   sessions      16 ms      on the tick
 *   fleet        430 ms      on the tick, which is why it polls at 10 s and not 1 s
 *   conflicts  1,034 ms      NOT on the tick   (17,007 ms before PR4 fixed the sweep)
 *   belief    18,781 ms      NOT on the tick   (10.4 s of it is `ledger.mjs verify` itself)
 *
 * Putting an 18-second collector on a 1-second tick does not produce a fresher screen; it
 * produces a permanently saturated server that recomputes an answer nobody is looking at,
 * for every connected client, forever. Belief in particular re-runs the whole claim ledger —
 * which shells out to real test suites — so ticking it would turn a passive dashboard into a
 * load generator. These two are read when their tab is opened, and refreshed when a human
 * asks. That is the honest cadence for a figure that changes when somebody edits a claim.
 *
 * Fetches on mount, so opening a tab is the trigger. Every field is null until the first
 * response, and `loading` is true only while a request is genuinely in flight — the views
 * render a real pending state for that window (an 18-second one, in Belief's case, which is
 * long enough that saying nothing would read as a hung page).
 */
export interface Endpoint<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** When `data` arrived — how stale what you are reading is, measured, not assumed. */
  loadedAt: number | null;
  refetch: () => void;
}

export function useEndpoint<T>(url: string): Endpoint<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);

  // A tab switch away mid-request unmounts this hook while an 18-second fetch is still in
  // flight. Without the abort the response lands on a dead component, and without the
  // `cancelled` flag a slow first request can overwrite a fast second one — the classic
  // out-of-order-response bug, which on this screen would show yesterday's ledger.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return (await res.json()) as T;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setLoadedAt(Date.now());
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return;
        // The message states the route, because "Failed to fetch" alone does not tell a
        // reader which of four views is the one that could not load.
        setError(e instanceof Error ? `GET ${url} failed: ${e.message}` : `GET ${url} failed`);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, error, loading, loadedAt, refetch };
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
