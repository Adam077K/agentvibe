// server/index.ts — Mission Control's server rail.
//
// PR1 shipped a health check. PR2 added the data layer under /api/{fleet,sessions,belief,
// conflicts,project/:id,inbox}. PR3 adds GET /events — the SSE tick the Fleet and Sessions
// views read from (see routes/stream.ts). The browser client is served separately by Vite
// on 4301 in development and proxies both prefixes back here; see client/vite.config.ts.
//
// The app itself is assembled in server/app.ts, so the cross-site guard is part of the thing
// a test can construct.

import { readTrustList, trustFilePath } from './trust.ts';
import { HOST, PORT } from './config.ts';
import { createApp } from './app.ts';

/**
 * SAYS SO, AND DOES NOT FIX IT ITSELF. Starting with no trusted-projects list is a real and
 * ordinary state — every fresh machine has it — and it means no project gets a program run
 * for it until the user says which ones. Every panel already renders that with its own reason,
 * so nothing here is hidden; this line exists so the person who just typed `bun run server`
 * reads it in the terminal rather than discovering it panel by panel.
 *
 * THE SEED IS NOT DONE HERE, AND THAT IS DELIBERATE ON TWO COUNTS. Mission Control's server
 * mutates no disk — test/crosscheck.test.ts fails on a write call site anywhere under
 * server/**, and a feature does not get to erode an invariant by moving its write somewhere
 * the grep cannot see. And seeding trusts whatever is already on disk without checking any of
 * it, which is a decision that belongs to a user running a command, not to a process starting
 * up. `bun run trust seed` is that command; it writes the 19 paths so nobody types them.
 */
function reportTrustList(): void {
  const list = readTrustList(trustFilePath());
  if (list.present) {
    console.log(`[mission-control] ${list.roots.length} trusted project(s) from ${list.path}`);
    for (const issue of list.issues) console.log(`[mission-control] REFUSED ${issue}`);
    return;
  }
  console.log(
    [
      '',
      `[mission-control] NO TRUSTED-PROJECTS LIST at ${list.path}.`,
      '[mission-control] Every project is still discovered and still shown — with the reason it was',
      '[mission-control] excluded — but no program runs for any of them, so Conflicts, Belief verdicts',
      '[mission-control] and the Project probe have nothing to report yet.',
      '[mission-control]',
      '[mission-control]   bun run trust seed     writes the list from what is discovered right now',
      '[mission-control]   bun run trust list     shows what is trusted and what is not',
      '',
    ].join('\n')
  );
}

reportTrustList();

export default {
  port: PORT,
  hostname: HOST, // loopback only — never 0.0.0.0. See config.ts.
  // Bun's idle reaper stays ON here, at its default, for every route. `/events` — and only
  // `/events` — opts out per request via server.timeout(req, 0); see routes/stream.ts for
  // the defect that made that necessary, and for why disabling it server-wide (which is what
  // this line used to do) was a much broader change than the defect required.
  fetch: createApp().fetch,
};
