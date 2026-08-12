// server/index.ts — Mission Control's server rail.
//
// This PR ships exactly one route: a health check. No views, no collectors — those
// land in a later PR. The point of this file is that `bun run server/index.ts` binds
// loopback-only and answers, and that CI can prove it.

import { Hono } from 'hono';
import { HOST, PORT } from './config.ts';

const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true, port: PORT, host: HOST }));

export default {
  port: PORT,
  hostname: HOST, // loopback only — never 0.0.0.0. See config.ts.
  fetch: app.fetch,
};
