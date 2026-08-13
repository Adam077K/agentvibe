// server/index.ts — Mission Control's server rail.
//
// PR1 shipped a health check. PR2 added the data layer under /api/{fleet,sessions,belief,
// conflicts,project/:id,inbox}. PR3 adds GET /events — the SSE tick the Fleet and Sessions
// views read from (see routes/stream.ts). The browser client is served separately by Vite
// on 4301 in development and proxies both prefixes back here; see client/vite.config.ts.

import { Hono } from 'hono';
import { HOST, PORT } from './config.ts';
import api from './routes/api.ts';
import stream from './routes/stream.ts';

const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true, port: PORT, host: HOST }));
app.route('/api', api);
app.route('/', stream);

export default {
  port: PORT,
  hostname: HOST, // loopback only — never 0.0.0.0. See config.ts.
  // Bun reaps a connection after 10 idle seconds by default, and an idle wire is precisely
  // what routes/stream.ts is built to produce — so the default killed every real SSE
  // connection the moment the fleet went quiet, with `[Bun.serve]: request timed out after
  // 10 seconds` in the log. EventSource then reconnected, so nothing looked broken: it just
  // silently reconnected every ten seconds forever, re-pushing both slices and re-spawning
  // the fleet collector's subprocesses each time — the exact cost the hash comparison
  // exists to avoid. 0 disables the reaper. Safe here and only here: this socket is
  // loopback-only by construction, so "hold connections open indefinitely" is not reachable
  // from off this machine. The alternative — heartbeat comment frames under 10s apart —
  // would keep the timeout but put bytes on a wire whose whole design is to stay silent.
  idleTimeout: 0,
  fetch: app.fetch,
};
