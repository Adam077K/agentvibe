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
//
// ── THE TRUST BOUNDARY IS HERE, AND IT IS VISIBLE ────────────────────────────────────────
//
// Two of the handlers below reach a collector that spawns a subprocess against a directory
// discovery found on disk, which is the premise behind all three RCEs of 2026-08-14 (see
// server/trust.ts). They now run those collectors only for projects the user listed.
//
// NARROWING IS NEVER SILENT. An untrusted project is not filtered out of the answer — it is
// reported, with its own reason and the file to edit, exactly as conflicts.ts's
// EXCLUDED_REASON does for unregistered worktrees. Dropping it would render as "you have no
// such project", and a reported absence that means "I was not allowed to look" is the defect
// class this codebase is named after; a security control that hides data silently is a new
// instance of it, not a fix for one.

import { Hono } from 'hono';
import type { Project, TrustState } from '../projects.ts';
import { LiveState, live, REPO_ROOT } from '../state.ts';
import { detectConflicts, type ConflictReport } from '../collectors/conflicts.ts';
import { collectBelief } from '../collectors/belief.ts';
import { collectSessions, collectProjectStats, type ProjectTranscriptStats } from '../collectors/transcripts.ts';
import { summarizeEvents, type EventsSummary } from '../collectors/events.ts';
import { projectEmptyState, projectEmptyStateProbe, inboxEmptyState, type EmptyState } from '../collectors/empty.ts';

function findProject(projects: Project[], id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

/**
 * A project that was discovered, is shown, and had no program run for it.
 *
 * `reason` is the collector-side sentence, carried rather than restated — the view renders
 * the server's own words, so there is one wording of this and not two that drift.
 */
export interface UntrustedProject {
  project: string;
  root: string;
  reason: string;
  /** The trusted-projects file the decision came from — what the user edits. */
  source: string;
}

export function untrustedEntry(p: Project): UntrustedProject {
  return {
    project: p.id,
    root: p.root,
    reason: p.trust.reason ?? 'not listed in the trusted-projects file',
    source: p.trust.source,
  };
}

/**
 * One pass, both halves. `trusted.length + untrusted.length === projects.length` is an
 * invariant a test pins directly — the Fleet headline shipped "2 of 11" for an answer of 4 by
 * counting a numerator and a denominator over two populations, and this is that shape.
 */
export function partitionByTrust(projects: Project[]): { trusted: Project[]; untrusted: UntrustedProject[] } {
  const trusted: Project[] = [];
  const untrusted: UntrustedProject[] = [];
  for (const p of projects) {
    if (p.trust.trusted) trusted.push(p);
    else untrusted.push(untrustedEntry(p));
  }
  return { trusted, untrusted };
}

export interface ConflictsPayload {
  reports: ConflictReport[];
  /**
   * Discovered projects the sweep was not allowed to run in. NEVER an empty stand-in for
   * "there were none" — the view sums this into its own denominator so "N of M projects"
   * counts the whole fleet, not the trusted part of it.
   */
  untrusted: UntrustedProject[];
  /** The trusted-projects file behind both arrays, and the lines its parser refused. */
  trust: { source: string; issues: string[] };
}

/**
 * The wire shapes for the two routes PR5 gives a view to. Declared here, where the handler
 * builds them, and imported by the client through client/src/api.ts — so adding a field and
 * forgetting the view is a compile error rather than a cell rendering `undefined`. Same
 * reasoning as FleetSummary; these two were the last routes still shaped only by inference.
 */
export interface ProjectDetail {
  project: {
    id: string;
    root: string;
    agentActive: boolean;
    stats: ProjectTranscriptStats;
    events: EventsSummary;
    /**
     * Whether a program may be run for this project. Carried into the payload rather than
     * inferred from `empty.readable` by the view: the probe having been skipped and the
     * project being untrusted are two different facts, and the view says the second one.
     */
    trust: TrustState;
  };
  empty: EmptyState;
}

export interface InboxProject extends EmptyState {
  project: string;
}

export interface InboxPayload {
  projects: InboxProject[];
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
  // TRUST-GATED ONE LEVEL DOWN, in collectBelief, which is where the spawn is. The gate is
  // NOT in this handler on purpose: `node <project>/scripts/ledger.mjs` is the thing being
  // stopped, and a guard next to the spawn survives a second caller of collectBelief in a way
  // a guard in the route does not. Everything else Belief shows — the project's built
  // index.json, the global ledger — is a file read and still runs for an untrusted project,
  // so the view degrades to "no verdicts, and here is why" rather than going blank.
  //
  // THE DEFAULT TARGET STILL PREFERS A LEDGER IT MAY NOT VERIFY, and that is correct: an
  // untrusted project with a ledger is exactly the one a reader needs to be told about.
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

  // TRUST-GATED. detectConflicts runs `git status` with cwd inside each worktree, and git
  // there honours that repository's own .git/config — where `core.fsmonitor` names a program
  // git executes. Re-executed through this exact route on 2026-08-15 before the gate: the
  // payload landed a marker holding `uid=501(adamks)` and reported the worktree as clean in
  // the same response.
  api.get('/conflicts', async (c) => {
    const projects = state.refresh();
    const { trusted, untrusted } = partitionByTrust(projects);
    const reports = await Promise.all(trusted.map((p) => detectConflicts(p)));
    const list = state.trustList;
    const payload: ConflictsPayload = {
      reports,
      untrusted,
      trust: {
        source: list?.path ?? untrusted[0]?.source ?? 'unknown',
        issues: list?.issues ?? [],
      },
    };
    return c.json(payload);
  });

  // ASYNC for the same reason /api/conflicts and /api/belief are: projectEmptyState shells
  // out to a recursive grep and was synchronous. Measured 2026-08-14 through this route:
  // agentvibe 343 ms, Beamix 113,158 ms — 100% of it blocking Bun's single JS thread, so the
  // SSE tick stopped for every connected client for nearly two minutes.
  // TRUST-GATED, AND FOR A NARROWER REASON THAN THE OTHER TWO — say it accurately. The probe
  // is `grep -rl … -- <root>`: it READS the project and executes nothing from it, so it is not
  // one of the three RCEs and gating it closes no confirmed vector. It is gated for the two
  // reasons that do apply: the allowlist means one rule ("no subprocess against a directory
  // you did not name"), not one rule with an exception a reader has to hold; and the probe is
  // a 10-second, 8 MB recursive scan of a tree the user never asked to be walked.
  //
  // The skip uses EmptyState's own three-state shape — `readable: false` plus a reason — so an
  // untrusted project renders as "could not look, here is why", never as "found nothing".
  // `probe` still carries the exact command that WOULD have run, because "what was skipped" is
  // part of the answer.
  api.get('/project/:id', async (c) => {
    const projects = state.refresh();
    const project = findProject(projects, c.req.param('id'));
    if (!project) return c.json({ error: `unknown project "${c.req.param('id')}"` }, 404);
    const empty: EmptyState = project.trust.trusted
      ? await projectEmptyState(project)
      : {
          probe: `${projectEmptyStateProbe(project).cmd} ${projectEmptyStateProbe(project).args.join(' ')}`,
          found: false,
          would_fill: `Adding ${project.root} to ${project.trust.source} runs this probe and fills this panel.`,
          readable: false,
          reason: project.trust.reason as string,
        };
    const payload: ProjectDetail = {
      project: {
        id: project.id,
        root: project.root,
        agentActive: project.agentActive,
        stats: collectProjectStats(project, state.index),
        events: summarizeEvents(project.eventsPath, REPO_ROOT),
        trust: project.trust,
      },
      empty,
    };
    return c.json(payload);
  });

  // DELIBERATELY STILL SYNCHRONOUS. inboxEmptyState is one readdirSync of one directory per
  // project — measured ~0 ms across all 19, because on this machine every one of those
  // directories is absent and the call fails immediately. Converting it would add a promise
  // per project and change nothing observable; the rule this codebase holds is "do not block
  // the loop", not "never call a sync API". If a project ever holds thousands of messages,
  // the readdir is what to convert, and this comment is where to start.
  api.get('/inbox', (c) => {
    const projects = state.refresh();
    const payload: InboxPayload = { projects: projects.map((p) => ({ project: p.id, ...inboxEmptyState(p) })) };
    return c.json(payload);
  });

  return api;
}

export default createApi(live);
