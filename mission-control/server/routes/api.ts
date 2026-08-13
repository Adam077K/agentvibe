// server/routes/api.ts — GET /api/{fleet,sessions,belief,conflicts,project/:id,inbox}.
//
// No UI in this PR (React/Vite are not added here) — these routes exist so the data
// layer is reachable and testable end to end. Every route re-discovers projects and
// refreshes the in-memory index on each call; on a local read-only dev tool reading a
// few dozen small directories, that cost is the incremental-refresh number this PR's
// perf test pins (target: under 250ms), not the cold-build one.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { discoverProjects, type Project } from '../projects.ts';
import { IndexStore } from '../index-store.ts';
import { buildFleet } from '../collectors/fleet.ts';
import { detectConflicts } from '../collectors/conflicts.ts';
import { collectBelief } from '../collectors/belief.ts';
import { collectSessions, collectProjectStats } from '../collectors/transcripts.ts';
import { summarizeEvents } from '../collectors/events.ts';
import { projectEmptyState, inboxEmptyState } from '../collectors/empty.ts';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const store = new IndexStore();
let storeBuilt = false;

/** Discovers the current fleet and keeps the session index in sync with it. */
function refreshed(): Project[] {
  const projects = discoverProjects();
  if (!storeBuilt) {
    store.buildCold(projects);
    storeBuilt = true;
  } else {
    store.refresh(projects);
  }
  return projects;
}

function findProject(projects: Project[], id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

const api = new Hono();

api.get('/fleet', (c) => {
  const projects = refreshed();
  return c.json(buildFleet(projects, store, REPO_ROOT));
});

api.get('/sessions', (c) => {
  const projects = refreshed();
  const projectId = c.req.query('project');
  if (projectId) {
    const project = findProject(projects, projectId);
    if (!project) return c.json({ error: `unknown project "${projectId}"` }, 404);
    return c.json({ project: projectId, sessions: collectSessions(project, store) });
  }
  return c.json({ sessions: store.allSessions() });
});

api.get('/belief', (c) => {
  const projects = refreshed();
  const projectId = c.req.query('project');
  const target = projectId
    ? findProject(projects, projectId)
    : (projects.find((p) => p.ledgerIndex.present) ?? projects[0]);
  if (!target) return c.json({ error: projectId ? `unknown project "${projectId}"` : 'no projects discovered' }, 404);
  return c.json(collectBelief(target));
});

api.get('/conflicts', (c) => {
  const projects = refreshed();
  const reports = projects.map((p) => detectConflicts(p));
  return c.json({ reports });
});

api.get('/project/:id', (c) => {
  const projects = refreshed();
  const project = findProject(projects, c.req.param('id'));
  if (!project) return c.json({ error: `unknown project "${c.req.param('id')}"` }, 404);
  return c.json({
    project: {
      id: project.id,
      root: project.root,
      agentActive: project.agentActive,
      stats: collectProjectStats(project, store),
      events: summarizeEvents(project.eventsPath, REPO_ROOT),
    },
    empty: projectEmptyState(project),
  });
});

api.get('/inbox', (c) => {
  const projects = refreshed();
  return c.json({ projects: projects.map((p) => ({ project: p.id, ...inboxEmptyState(p) })) });
});

export default api;
