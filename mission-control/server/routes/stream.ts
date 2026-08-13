// server/routes/stream.ts — GET /events, the one live channel.
//
// SSE, not a WebSocket. Mission Control is read-only in this PR and the browser's own
// EventSource reconnects by itself, with backoff, with no client library and no reconnect
// code to get wrong. PR 8b adds POST actions over plain HTTP and keeps reading from this
// same stream; a bidirectional socket would buy a write path that HTTP already has.
//
// THE TICK PUSHES DIFFERENCES, NOT SNAPSHOTS. Every tick recomputes a slice and compares
// its content hash (server/state.ts, which strips the "when was this computed" fields) to
// the hash last sent on THIS connection. Equal means nothing is written to the wire at all,
// so an idle fleet costs an idle socket rather than a snapshot per second. On an idle
// machine the sessions tick is a stat() per transcript and no read.
//
// One honest exception, and it is not a bug: the fleet slice carries the account-wide
// rolling-5h token figure, which changes as turns age OUT of that window even when nothing
// at all is happening. So a genuinely idle fleet still emits an occasional `fleet` frame —
// the number really did change. The `sessions` slice has no such term and goes completely
// silent, which is what the idle-wire test pins.
//
// TWO CADENCES, because the two slices cost three orders of magnitude apart. Measured on
// the real fleet (19 projects, 2,036 transcripts):
//   sessions   16 ms  — IndexStore.refresh(), stat-only when nothing moved
//   fleet     430 ms  — one `node scripts/warroom-install.mjs fleet` spawn, one `git
//                       worktree list` spawn per project, and the account-wide rolling-5h
//                       token scan
// A 1 s fleet tick would hold ~45% of a core forever on a tool meant to sit open all day,
// so fleet polls every 10 s (~4% duty cycle). That is a polling interval, not a staleness
// guarantee, and the client labels the figure with the time it was computed.
//
// No heartbeat comment frames. Those exist to stop an intermediary proxy from reaping an
// idle connection; the only hop here is loopback (server/config.ts binds 127.0.0.1 as a
// literal), so there is nothing in the path to keep alive, and a heartbeat would put bytes
// on a wire this file's whole design keeps quiet.

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { LiveState, live, REPO_ROOT } from '../state.ts';

export const SESSIONS_TICK_MS = 1_000;
export const FLEET_TICK_MS = 10_000;

export interface StreamOptions {
  sessionsTickMs?: number;
  fleetTickMs?: number;
  /** Stop after this many ticks. Only a test sets it; a real connection runs until aborted. */
  maxTicks?: number;
}

type Sender = (message: { event: string; data: string; id?: string }) => Promise<void>;

/**
 * The tick loop itself, with the transport passed in. Extracted from the route so a test
 * can drive it against a recording sender and assert what does and does not reach the wire
 * — which is the actual contract here — without opening a socket or waiting on real time.
 */
export async function runTicks(
  state: LiveState,
  send: Sender,
  isOpen: () => boolean,
  sleep: (ms: number) => Promise<unknown>,
  opts: StreamOptions = {}
): Promise<void> {
  const sessionsTickMs = opts.sessionsTickMs ?? SESSIONS_TICK_MS;
  const fleetTickMs = opts.fleetTickMs ?? FLEET_TICK_MS;
  const maxTicks = opts.maxTicks ?? Infinity;

  let lastSessionsHash: string | null = null;
  let lastFleetHash: string | null = null;
  let lastFleetAt = 0;
  let ticks = 0;
  let eventId = 0;

  while (isOpen() && ticks < maxTicks) {
    const now = Date.now();

    const sessions = state.sessionsSlice(now);
    if (sessions.hash !== lastSessionsHash) {
      lastSessionsHash = sessions.hash;
      await send({ event: 'sessions', data: JSON.stringify(sessions.payload), id: String(++eventId) });
    }

    if (now - lastFleetAt >= fleetTickMs || lastFleetHash === null) {
      lastFleetAt = now;
      const fleet = state.fleetSlice(REPO_ROOT);
      if (fleet.hash !== lastFleetHash) {
        lastFleetHash = fleet.hash;
        await send({ event: 'fleet', data: JSON.stringify(fleet.payload), id: String(++eventId) });
      }
    }

    ticks++;
    if (ticks < maxTicks && isOpen()) await sleep(sessionsTickMs);
  }
}

export function createStream(state: LiveState = live, opts: StreamOptions = {}): Hono {
  const route = new Hono();

  route.get('/events', (c) =>
    streamSSE(c, async (stream) => {
      let open = true;
      stream.onAbort(() => {
        open = false;
      });
      await runTicks(
        state,
        (message) => stream.writeSSE(message),
        () => open && !stream.aborted && !stream.closed,
        (ms) => stream.sleep(ms),
        opts
      );
    })
  );

  return route;
}

export default createStream(live);
