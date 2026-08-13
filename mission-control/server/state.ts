// server/state.ts — the one discovery + index pair the whole server shares, and the slice
// hashing the SSE stream pushes against.
//
// Before this file, routes/api.ts owned a module-private IndexStore and a refreshed()
// helper. The SSE stream needs the same index on a ~1s tick, and a second store would mean
// a second 4s cold build and two answers to "how many sessions does this project have" that
// can disagree. So the store moved here, unchanged, and api.ts imports it.
//
// LiveState is a class rather than more module-private state so a test can construct a
// genuinely cold one (test/perf.test.ts measures a cold /api/sessions and needs the route
// handler itself, not a re-implementation of it) without a reset() hook that exists only
// for tests.
//
// Writes nothing. The only thing this file adds to PR2's behaviour is a content hash per
// slice, so the stream can tell "recomputed" from "changed".

import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverProjects, type DiscoverOptions, type Project } from './projects.ts';
import { IndexStore, type SessionSummary } from './index-store.ts';
import { buildFleet, type FleetSummary } from './collectors/fleet.ts';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export interface SessionsSlice {
  generatedAt: number;
  sessions: SessionSummary[];
}

/** A slice plus the hash of its own payload, minus the fields that change every tick. */
export interface Hashed<T> {
  hash: string;
  payload: T;
}

/**
 * Stable content hash. Takes the already-projected object — see hashableFleet /
 * hashableSessions below for what each slice excludes, and why.
 */
export function sliceHash(hashable: unknown): string {
  return createHash('sha1').update(JSON.stringify(hashable) ?? '').digest('hex');
}

/**
 * What a fleet slice's hash covers, written as an EXPLICIT PROJECTION rather than a set of
 * key names stripped at any depth. Two reasons, both found in review:
 *
 * 1. A name-based stripper removes every `now` anywhere in the tree. The only one today is
 *    the budget's, but the next collector to add a field called `now` would have it silently
 *    excluded from change detection, and nothing would say so. Spreading instead means a new
 *    field is INCLUDED by default — the fail-safe direction, since an over-eager push costs
 *    bytes and a missed one costs correctness.
 *
 * 2. `filesScanned` and `bytesRead` are diagnostics of the scan, not the figure it produced.
 *    They move whenever any byte is appended to any transcript — including a turn with no
 *    usage record at all — so leaving them in the hash pushed a full 19-project payload on
 *    writes that changed no displayed number. Traced in review: a non-usage append moved
 *    only `bytesRead` (140 → 320) and pushed the whole slice. They stay in the PAYLOAD, as
 *    provenance behind the burn figure; they are simply not what "changed" means.
 *
 * `output_tokens` and `subagent_output_tokens` are NOT stripped: those shift as turns age
 * out of the rolling 5h window, which is a real change to a number on screen.
 */
export function hashableFleet(payload: FleetSummary): unknown {
  const { generatedAt: _generatedAt, budget, ...rest } = payload;
  const { now: _now, filesScanned: _filesScanned, bytesRead: _bytesRead, ...budgetFigures } = budget;
  return { ...rest, budget: budgetFigures };
}

/** Everything a sessions slice says, minus when it was said. */
export function hashableSessions(payload: SessionsSlice): unknown {
  const { generatedAt: _generatedAt, ...rest } = payload;
  return rest;
}

export class LiveState {
  private store = new IndexStore();
  private built = false;

  /**
   * `discoverOpts` is forwarded verbatim to discoverProjects() — the same roots/claude-root
   * overrides that function already takes, not a test-only seam. The live singleton passes
   * nothing and gets the real fleet; a test points one at a fixture tree and gets a
   * complete, deterministic state including its own budget figure.
   */
  constructor(private readonly discoverOpts: DiscoverOptions = {}) {}

  get index(): IndexStore {
    return this.store;
  }

  get isBuilt(): boolean {
    return this.built;
  }

  /** Discovers the current fleet and keeps the session index in sync with it. */
  refresh(): Project[] {
    const projects = discoverProjects(this.discoverOpts);
    if (!this.built) {
      this.store.buildCold(projects);
      this.built = true;
    } else {
      this.store.refresh(projects);
    }
    return projects;
  }

  sessionsSlice(now: number = Date.now()): Hashed<SessionsSlice> {
    this.refresh();
    const payload: SessionsSlice = { generatedAt: now, sessions: this.store.allSessions() };
    return { hash: sliceHash(hashableSessions(payload)), payload };
  }

  fleetSlice(repoRoot: string = REPO_ROOT): Hashed<FleetSummary> {
    const projects = this.refresh();
    // The account-wide budget figure must read the same transcript root discovery did, or a
    // fixtured state would report the real machine's usage next to fixture projects.
    const payload = buildFleet(projects, this.store, repoRoot, {
      claudeProjectsRoot: this.discoverOpts.claudeProjectsRoot,
    });
    return { hash: sliceHash(hashableFleet(payload)), payload };
  }
}

export const live = new LiveState();
