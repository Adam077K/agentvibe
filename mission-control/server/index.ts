// server/index.ts — Mission Control's server rail.
//
// PR1 shipped exactly one route: a health check. This PR (PR2) adds the data layer —
// discovery, collectors, and the read routes under /api/{fleet,sessions,belief,
// conflicts,project/:id,inbox} — but still no UI. React and Vite are not added here.

import { Hono } from 'hono';
import { HOST, PORT } from './config.ts';
import api from './routes/api.ts';

const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true, port: PORT, host: HOST }));
app.route('/api', api);

export default {
  port: PORT,
  hostname: HOST, // loopback only — never 0.0.0.0. See config.ts.
  fetch: app.fetch,
};
