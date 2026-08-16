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
export type {
  ProjectDetail,
  InboxPayload,
  InboxProject,
  ConflictsPayload,
  UntrustedProject,
  DispatchEntry,
  DispatchRequest,
  DispatchResult,
  DispatchError,
  DispatchPayload,
} from '../../server/routes/api.ts';
export type { TrustState } from '../../server/trust.ts';
export type { EmptyState } from '../../server/collectors/empty.ts';
export type { EventsSummary } from '../../server/collectors/events.ts';
export type { ProjectTranscriptStats } from '../../server/collectors/transcripts.ts';

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
  /**
   * When the last FAILED attempt ended. Distinct from `loadedAt` on purpose: a request that
   * errored has an end time but produced no data, and collapsing the two let the app bar say
   * "fetched" over a panel reporting an error (#39).
   */
  failedAt: number | null;
  refetch: () => void;
}

/** Everything `useEndpoint` knows, as data — so the transitions between them are testable. */
export interface EndpointState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  loadedAt: number | null;
  failedAt: number | null;
}

/** How one request ended, independent of how it was performed. */
export type Settled<T> = { ok: true; payload: T } | { ok: false; message: string };

export function initialEndpointState<T>(): EndpointState<T> {
  return { data: null, error: null, loading: true, loadedAt: null, failedAt: null };
}

/**
 * A request has STARTED. Data and stamps survive it, because a refetch shows the figures you
 * already had while the new ones are in flight — that is the badge's "refreshing" state, and
 * clearing them here would blank the screen on every refresh.
 */
export function requestBegan<T>(prev: EndpointState<T>): EndpointState<T> {
  return { ...prev, loading: true, error: null };
}

/**
 * THE STAMPING DECISION, and the whole reason it is a function rather than four setState
 * calls inside an effect.
 *
 * `useEndpoint`'s fetch effect was uncovered — every line of it — so the producer of the
 * freshness the app bar renders was reachable by no test, while the consumer was pinned
 * seven ways. Three mutations restored #39 with the full suite green, including the exact
 * original: stamping a failure as `loadedAt`, which renders "fetched · 3s ago" above a panel
 * saying the ledger could not be read. A barrier at the pixel with the producer invertible
 * underneath it is the third instance of this shape in three PRs, and this is the fix that
 * worked the last two times: make the decision a pure function of what came in.
 *
 * The rules, each of which a mutation can now break:
 *   · a success stamps `loadedAt` and CLEARS `failedAt` — otherwise "could not fetch" hangs
 *     over data that arrived after it
 *   · a failure stamps `failedAt` and LEAVES `loadedAt` — the figures on screen really did
 *     arrive when they say they did; it is the refresh that failed
 *   · a failure keeps `data`, because the panel below is still showing it
 */
export function requestSettled<T>(prev: EndpointState<T>, settled: Settled<T>, at: number): EndpointState<T> {
  if (settled.ok) {
    return { data: settled.payload, error: null, loading: false, loadedAt: at, failedAt: null };
  }
  return { data: prev.data, error: settled.message, loading: false, loadedAt: prev.loadedAt, failedAt: at };
}

/**
 * The message states the route, because "Failed to fetch" alone does not tell a reader which
 * of five views is the one that could not load.
 */
export function failureMessage(url: string, e: unknown): string {
  return e instanceof Error ? `GET ${url} failed: ${e.message}` : `GET ${url} failed`;
}

export function useEndpoint<T>(url: string): Endpoint<T> {
  const [state, setState] = useState<EndpointState<T>>(initialEndpointState<T>);
  const [nonce, setNonce] = useState(0);

  // A tab switch away mid-request unmounts this hook while an 18-second fetch is still in
  // flight. Without the abort the response lands on a dead component, and without the
  // `cancelled` flag a slow first request can overwrite a fast second one — the classic
  // out-of-order-response bug, which on this screen would show yesterday's ledger.
  //
  // WHAT IS STILL UNCOVERED HERE, stated rather than left to be discovered: this effect body
  // (api.ts 218-238) needs a DOM and a live React tree, so no test runs it. Every DECISION it
  // used to make has moved above — `requestBegan`, `requestSettled`, `failureMessage` — and
  // all three are pinned. What remains is plumbing: which branch a settled fetch lands in,
  // the abort/cancel guards, and the cleanup. Those are the lines to read carefully in review,
  // because nothing else will.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState(requestBegan);

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return (await res.json()) as T;
      })
      .then((payload) => {
        if (cancelled) return;
        setState((prev) => requestSettled(prev, { ok: true, payload }, Date.now()));
      })
      .catch((e: unknown) => {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return;
        setState((prev) => requestSettled(prev, { ok: false, message: failureMessage(url, e) }, Date.now()));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, refetch };
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
