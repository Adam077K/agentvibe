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
 * Keys that carry "when was this computed", not "what does it say". Both move on every
 * single tick by construction — `generatedAt` on the slice, `now` inside the budget figure
 * windowUsage() returns — so hashing them would mark every slice changed and defeat the
 * whole point of the tick: an idle fleet must produce an idle wire. Nothing else is
 * stripped; a token count that shifts because turns aged out of the rolling 5h window is a
 * real change and must be pushed.
 */
const VOLATILE_KEYS = new Set(['generatedAt', 'now']);

/** Stable content hash over a slice, ignoring VOLATILE_KEYS. */
export function sliceHash(payload: unknown): string {
  const stripped = JSON.stringify(payload, (key, value) => (VOLATILE_KEYS.has(key) ? undefined : value));
  return createHash('sha1').update(stripped ?? '').digest('hex');
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
    return { hash: sliceHash(payload), payload };
  }

  fleetSlice(repoRoot: string = REPO_ROOT): Hashed<FleetSummary> {
    const projects = this.refresh();
    // The account-wide budget figure must read the same transcript root discovery did, or a
    // fixtured state would report the real machine's usage next to fixture projects.
    const payload = buildFleet(projects, this.store, repoRoot, {
      claudeProjectsRoot: this.discoverOpts.claudeProjectsRoot,
    });
    return { hash: sliceHash(payload), payload };
  }
}

export const live = new LiveState();
