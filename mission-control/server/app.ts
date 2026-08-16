// server/app.ts — the assembled Hono app: guard, then routes.
//
// EXTRACTED FROM index.ts SO THE GUARD IS TESTABLE AS SHIPPED. A test that builds its own
// `new Hono()` and mounts createApi() is testing the routes, not the app — and the cross-site
// guard is registered above the router, so a test constructed that way would exercise a
// server that does not exist. createApp() is the one the process serves.
//
// ORDER IS THE POINT: `app.use('*', crossSiteGuard())` runs before every handler, including
// ones added later. The findings doc counted six side-effecting GETs; registering a guard per
// route means the seventh is protected by somebody remembering, which is not a mechanism.

import { Hono } from 'hono';
import { HOST, PORT } from './config.ts';
import { LiveState, live } from './state.ts';
import { createApi } from './routes/api.ts';
import { createStream } from './routes/stream.ts';
import { crossSiteGuard } from './routes/guard.ts';

export function createApp(state: LiveState = live): Hono {
  const app = new Hono();

  // Blocks CROSS-SITE BROWSER REQUESTS. Not "drive-by" — same-site is allowed, so any other
  // service on this loopback still reaches everything, and a non-browser client sends no such
  // header at all. See routes/guard.ts for the measured header table behind that wording.
  app.use('*', crossSiteGuard());

  app.get('/api/health', (c) => c.json({ ok: true, port: PORT, host: HOST }));
  app.route('/api', createApi(state));
  app.route('/', createStream(state));

  return app;
}
