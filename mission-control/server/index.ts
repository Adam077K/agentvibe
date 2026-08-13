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
  fetch: app.fetch,
};
