// server/collectors/probe-bounds.ts — the probe's bounds, and NOTHING ELSE.
//
// A leaf module with no imports at all, because both sides need the number and only one of
// them can load `node:child_process`. `empty.ts` enforces the bound; `ProjectView` tells a
// reader about it before the first response arrives, which is precisely when there is no
// payload to carry it. The view said "bounded at ten seconds" in prose while the collector's
// own reason string interpolated the constant, so changing the constant made the pending
// state lie — one quantity with two spellings, the defect this codebase keeps deleting.
//
// Importing this from the client is safe in a way importing `empty.ts` is not: Vite follows
// the import graph, and `empty.ts` reaches `node:fs`, `node:os` and `node:child_process`.

/**
 * How long the project stage probe may scan before it stops and says so.
 *
 * NOT A TUNING CONSTANT — it is the difference between a control plane and a hostage
 * situation. Measured on this machine 2026-08-14, the probe itself, timed independently of
 * Mission Control:
 *
 *   agentvibe (1.1 GB tree)      331 ms
 *   Beamix    (34 GB tree)   107,806 ms
 *
 * The brief carried 3,657 ms for Beamix; the real figure is thirty times that, and every
 * millisecond of it blocked Bun's single JS thread. `GET /api/project/Beamix` took 113,158 ms
 * end to end, 100% synchronous, which stalls the SSE tick for every connected client for
 * nearly two minutes.
 *
 * Async fixes the stall and does NOT fix the wait: an unbounded recursive grep over an
 * arbitrarily large tree has no upper bound at all, and this one is a PROBE — it answers a
 * yes/no question whose "no" is already the expected answer everywhere. So it is bounded, and
 * when the bound is hit the three-state says so: `readable: false` with a reason. That is the
 * same contract changedFilesFor uses for its own timeout, and the same principle empty.ts is
 * built on — never report absence when you mean "I could not look at everything". A probe
 * reporting `found: false` after 108 seconds and one reporting it after 10 seconds with "I
 * stopped early" are different claims, and only the second is true.
 */
export const PROJECT_PROBE_TIMEOUT_MS = 10_000;

/** The same bound as seconds, for prose. One place, so the two can never disagree. */
export const PROJECT_PROBE_TIMEOUT_SECONDS = PROJECT_PROBE_TIMEOUT_MS / 1000;
