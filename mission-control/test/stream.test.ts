// test/stream.test.ts — the SSE tick pushes differences, not snapshots.
//
// The contract worth pinning is not "the route returns 200" — it is what does and does not
// reach the wire. runTicks() takes its transport as an argument for exactly that reason, so
// these tests drive real slice computation over a real fixture fleet against a recording
// sender, with no socket and no wall-clock sleep.

import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { LiveState } from '../server/state.ts';
import { runTicks, createStream } from '../server/routes/stream.ts';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo } from './fixtures.ts';

const cleanupDirs: string[] = [];
afterAll(() => {
  for (const d of cleanupDirs) rmTmp(d);
});

interface Sent {
  event: string;
  data: string;
  id?: string;
}

function fixtureFleet(prefix: string) {
  const claudeRoot = mkTmpDir(`mc-sse-claude-${prefix}-`);
  const projectsRoot = mkTmpDir(`mc-sse-projects-${prefix}-`);
  cleanupDirs.push(claudeRoot, projectsRoot);
  const proj = path.join(projectsRoot, 'streamproj');
  initGitRepo(proj);
  const file = fixtureClaudeProjectsDir(claudeRoot, proj, 'sess-1', [
    { ts: new Date().toISOString(), output_tokens: 500 },
  ]);
  const state = new LiveState({ roots: [projectsRoot], claudeProjectsRoot: claudeRoot });
  return { state, file };
}

/** Runs n ticks with no real sleep and no real socket, recording every frame written. */
async function drive(state: LiveState, ticks: number, fleetTickMs: number): Promise<Sent[]> {
  const sent: Sent[] = [];
  await runTicks(
    state,
    async (message) => {
      sent.push(message);
    },
    () => true,
    async () => undefined,
    { maxTicks: ticks, sessionsTickMs: 0, fleetTickMs }
  );
  return sent;
}

describe('GET /events tick', () => {
  test('pushes each slice once, then nothing while the fleet is idle', async () => {
    const { state } = fixtureFleet('idle');

    // fleetTickMs 0 means the fleet slice is RECOMPUTED on every tick — so anything absent
    // from the wire is absent because the hash matched, not because it was never computed.
    const sent = await drive(state, 5, 0);

    const events = sent.map((s) => s.event);
    expect(events.filter((e) => e === 'sessions')).toHaveLength(1);
    expect(events.filter((e) => e === 'fleet')).toHaveLength(1);
    expect(sent).toHaveLength(2); // five ticks, two frames — the other four wrote nothing
  });

  test('pushes the sessions slice again once a transcript actually changes', async () => {
    const { state, file } = fixtureFleet('append');

    const before = await drive(state, 2, 0);
    expect(before.filter((s) => s.event === 'sessions')).toHaveLength(1);
    const firstPayload = JSON.parse(before.find((s) => s.event === 'sessions')!.data) as {
      sessions: { outputTokens: number }[];
    };
    expect(firstPayload.sessions[0]!.outputTokens).toBe(500);

    fs.appendFileSync(
      file,
      JSON.stringify({
        type: 'assistant',
        timestamp: new Date().toISOString(),
        isSidechain: false,
        message: { model: 'claude-opus-5', usage: { output_tokens: 77 } },
      }) + '\n'
    );
    fs.utimesSync(file, new Date(), new Date());

    const after = await drive(state, 2, 0);
    const sessions = after.filter((s) => s.event === 'sessions');
    expect(sessions).toHaveLength(1); // pushed once for the change, not once per tick
    const payload = JSON.parse(sessions[0]!.data) as {
      sessions: { outputTokens: number; latestModel: string | null }[];
    };
    expect(payload.sessions[0]!.outputTokens).toBe(577);
    expect(payload.sessions[0]!.latestModel).toBe('claude-opus-5');
  });

  test('a slower fleet cadence computes the fleet slice once, not once per tick', async () => {
    const { state } = fixtureFleet('cadence');
    // 10 minutes: the first tick computes it (there is no previous hash), and no later tick
    // in this run reaches the interval.
    const sent = await drive(state, 4, 600_000);
    expect(sent.filter((s) => s.event === 'fleet')).toHaveLength(1);
  });

  test('frames on one connection carry strictly increasing ids', async () => {
    const { state, file } = fixtureFleet('ids');
    const sent: Sent[] = [];
    let appended = false;

    // The transcript changes DURING the run, between tick 1 and tick 2, by hooking the
    // sleep the loop already awaits. One connection, three frames, real ids.
    await runTicks(
      state,
      async (message) => {
        sent.push(message);
      },
      () => true,
      async () => {
        if (appended) return;
        appended = true;
        fs.appendFileSync(
          file,
          JSON.stringify({
            type: 'assistant',
            timestamp: new Date().toISOString(),
            isSidechain: true,
            message: { model: 'claude-haiku-4-5', usage: { output_tokens: 3 } },
          }) + '\n'
        );
        fs.utimesSync(file, new Date(), new Date());
      },
      { maxTicks: 3, sessionsTickMs: 0, fleetTickMs: 600_000 }
    );

    expect(sent.map((s) => s.event)).toEqual(['sessions', 'fleet', 'sessions']);
    expect(sent.map((s) => Number(s.id))).toEqual([1, 2, 3]);
    const last = JSON.parse(sent[2]!.data) as { sessions: { outputTokens: number }[] };
    expect(last.sessions[0]!.outputTokens).toBe(503);
  });

  test('the route itself answers with a text/event-stream response', async () => {
    const { state } = fixtureFleet('route');
    const app = createStream(state, { maxTicks: 1, sessionsTickMs: 0, fleetTickMs: 600_000 });
    const res = await app.fetch(new Request('http://127.0.0.1/events'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const body = await res.text();
    expect(body).toContain('event: sessions');
    expect(body).toContain('event: fleet');
    expect(body).toContain('"id":"streamproj"'); // the fixture project actually reached the wire
  });
});

// ── the idle connection survives longer than the server's own reaper ─────────────────
describe('an idle SSE connection over a real socket', () => {
  // FOUND BY RUNNING IT, 2026-08-13. Bun.serve's default idleTimeout is 10 seconds, and a
  // quiet wire is exactly what this stream produces — so every real connection died with
  // `[Bun.serve]: request timed out after 10 seconds` as soon as the fleet went quiet.
  // EventSource reconnects on its own, which is why nothing LOOKED broken: it just
  // reconnected every ten seconds forever, re-pushing both slices and re-spawning the fleet
  // collector's subprocesses each time.
  //
  // This test asserts the behaviour, not the config value. Asserting `idleTimeout === 0`
  // would only prove the number is written down; it would not notice if Bun changed what
  // that number means. So it binds a real socket, holds a genuinely silent stream open past
  // the reaper's window, and reads afterwards.
  test(
    'stays open with no bytes written for longer than the default 10s idle timeout',
    async () => {
      const { state } = fixtureFleet('idle-socket');
      // Two ticks 13 seconds apart: tick 1 writes both slices, then the loop sits in its
      // sleep writing NOTHING for 13s — a genuinely silent socket, past the 10s window —
      // and tick 2 finds both hashes unchanged and also writes nothing before ending.
      const app = createStream(state, { maxTicks: 2, sessionsTickMs: 13_000, fleetTickMs: 600_000 });

      const server = Bun.serve({
        port: 0, // ephemeral — never collides with a developer's running instance
        hostname: '127.0.0.1',
        idleTimeout: 0, // the setting under test; server/index.ts sets the same one
        fetch: app.fetch,
      });

      try {
        const res = await fetch(`http://127.0.0.1:${server.port}/events`);
        expect(res.status).toBe(200);
        const reader = res.body!.getReader();

        const first = await reader.read();
        expect(new TextDecoder().decode(first.value)).toContain('event: sessions');

        // Under the 10s default this read rejects with ECONNRESET part-way through the
        // silence. Surviving it, and then ending cleanly when the loop finishes, is the
        // whole assertion.
        let reaped: string | null = null;
        let done = false;
        try {
          done = (await reader.read()).done;
        } catch (e) {
          reaped = (e as Error).message;
        }
        expect(reaped).toBeNull();
        expect(done).toBe(true);
        await reader.cancel();
      } finally {
        server.stop(true);
      }
    },
    40_000
  );
});
