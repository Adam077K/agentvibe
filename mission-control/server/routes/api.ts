// server/routes/api.ts — GET /api/{fleet,sessions,belief,conflicts,project/:id,inbox}.
//
// Every route re-discovers projects and refreshes the in-memory index on each call; on a
// local read-only dev tool reading a few dozen small directories, that cost is the
// incremental-refresh number PR2's perf test pins (target: under 250ms), not the
// cold-build one.
//
// The store and the refresh helper moved to server/state.ts in PR3 — the SSE stream ticks
// against the same index, and two stores would mean two cold builds and two answers to the
// same question. createApi() takes the state explicitly so a test can hand it a genuinely
// cold LiveState and measure this handler, rather than a re-implementation of it.

import { Hono } from 'hono';
import type { Project } from '../projects.ts';
import { LiveState, live, REPO_ROOT } from '../state.ts';
import { detectConflicts } from '../collectors/conflicts.ts';
import { collectBelief } from '../collectors/belief.ts';
import { collectSessions, collectProjectStats } from '../collectors/transcripts.ts';
import { summarizeEvents } from '../collectors/events.ts';
import { projectEmptyState, inboxEmptyState } from '../collectors/empty.ts';

function findProject(projects: Project[], id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function createApi(state: LiveState = live): Hono {
  const api = new Hono();

  api.get('/fleet', (c) => c.json(state.fleetSlice(REPO_ROOT).payload));

  api.get('/sessions', (c) => {
    const projectId = c.req.query('project');
    if (!projectId) return c.json(state.sessionsSlice().payload);
    const projects = state.refresh();
    const project = findProject(projects, projectId);
    if (!project) return c.json({ error: `unknown project "${projectId}"` }, 404);
    return c.json({ project: projectId, sessions: collectSessions(project, state.index) });
  });

  // ASYNC, and it matters. Both handlers below shell out, and both were synchronous: they
  // blocked Bun's single JS thread for 18.8 s (belief) and 17.0 s (conflicts) per call,
  // measured through this route on 2026-08-13. While either ran, the SSE tick in
  // routes/stream.ts stopped for every connected client — a control plane freezing the
  // screens it exists to keep live. The collectors do the awaiting; these handlers just
  // stopped pretending the work was instant.
  api.get('/belief', async (c) => {
    const projects = state.refresh();
    const projectId = c.req.query('project');
    const target = projectId
      ? findProject(projects, projectId)
      : (projects.find((p) => p.ledgerIndex.present) ?? projects[0]);
    if (!target) return c.json({ error: projectId ? `unknown project "${projectId}"` : 'no projects discovered' }, 404);
    // `projects` is passed in whole so the "N of M projects carry a claim ledger" figure is
    // counted from the same array this request discovered, never recomputed by the view.
    return c.json(await collectBelief(target, projects));
  });

  api.get('/conflicts', async (c) => {
    const projects = state.refresh();
    const reports = await Promise.all(projects.map((p) => detectConflicts(p)));
    return c.json({ reports });
  });

  // ASYNC for the same reason /api/conflicts and /api/belief are: projectEmptyState shells
  // out to a recursive grep and was synchronous. Measured 2026-08-14 through this route:
  // agentvibe 343 ms, Beamix 113,158 ms — 100% of it blocking Bun's single JS thread, so the
  // SSE tick stopped for every connected client for nearly two minutes.
  api.get('/project/:id', async (c) => {
    const projects = state.refresh();
    const project = findProject(projects, c.req.param('id'));
    if (!project) return c.json({ error: `unknown project "${c.req.param('id')}"` }, 404);
    return c.json({
      project: {
        id: project.id,
        root: project.root,
        agentActive: project.agentActive,
        stats: collectProjectStats(project, state.index),
        events: summarizeEvents(project.eventsPath, REPO_ROOT),
      },
      empty: await projectEmptyState(project),
    });
  });

  // DELIBERATELY STILL SYNCHRONOUS. inboxEmptyState is one readdirSync of one directory per
  // project — measured ~0 ms across all 19, because on this machine every one of those
  // directories is absent and the call fails immediately. Converting it would add a promise
  // per project and change nothing observable; the rule this codebase holds is "do not block
  // the loop", not "never call a sync API". If a project ever holds thousands of messages,
  // the readdir is what to convert, and this comment is where to start.
  api.get('/inbox', (c) => {
    const projects = state.refresh();
    return c.json({ projects: projects.map((p) => ({ project: p.id, ...inboxEmptyState(p) })) });
  });

  return api;
}

export default createApi(live);
