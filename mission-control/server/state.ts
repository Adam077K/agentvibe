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
// WRITES EXACTLY ONE PATH, AND THIS COMMENT USED TO SAY "WRITES NOTHING". That was true until
// the session index started being persisted, and leaving the old sentence in place would have
// made this header a claim the code no longer honours. The one path is the index cache — see
// server/index-cache.ts for where and why. Everything else here still only reads.

import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverFleet, type DiscoverOptions, type Project, type TrustList } from './projects.ts';
import { projectsDir } from './lib/usage.ts';
import * as indexCache from './index-cache.ts';
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

/**
 * `indexCache: false` turns persistence off entirely, and it is not a convenience.
 *
 * test/live.test.ts measures a genuine full read of the real corpus and cross-checks
 * `bytesRead` against an independently walked snapshot of it. With a cache present that build
 * would read three files, the oracle would compare against nothing, and the assertion would go
 * green having measured a start that skipped the corpus. That test needs a real cold build, so
 * it says so. `path` exists for the same reason AGENTVIBE_PROJECTS_DIR does in usage.js: a test
 * that writes to the machine's real cache passes or fails for reasons it did not choose.
 */
export interface StateOptions extends DiscoverOptions {
  indexCache?: boolean;
  indexCachePath?: string;
  maxFullBuildAgeMs?: number;
  /** Overrides SAVE_MIN_INTERVAL_MS. 0 disables throttling; the dirty check still applies. */
  saveMinIntervalMs?: number;
}

export class LiveState {
  private store = new IndexStore();
  private built = false;
  /**
   * The trust list of the LAST refresh — the very same read that decided every project's
   * `trust`, kept rather than re-read, so a route can name the file and its refused lines
   * without a second read of that file that could disagree with the first.
   */
  private lastTrustList: TrustList | null = null;
  /** When the index was last built by reading the whole corpus. See MAX_FULL_BUILD_AGE_MS. */
  private fullBuildAt = 0;
  private lastCacheDecline: indexCache.LoadFailure | null = null;
  private lastSave: indexCache.SaveResult | null = null;
  private lastSaveAt = 0;
  private lastSkip: 'unchanged' | 'throttled' | null = null;
  /** How many times the index has actually been WRITTEN. Monotonic; never reset. */
  private writes = 0;

  /**
   * `discoverOpts` is forwarded verbatim to discoverProjects() — the same roots/claude-root
   * overrides that function already takes, not a test-only seam. The live singleton passes
   * nothing and gets the real fleet; a test points one at a fixture tree and gets a
   * complete, deterministic state including its own budget figure.
   */
  constructor(private readonly opts: StateOptions = {}) {}

  private get discoverOpts(): DiscoverOptions {
    return this.opts;
  }

  private get cacheEnabled(): boolean {
    return this.opts.indexCache !== false;
  }

  get index(): IndexStore {
    return this.store;
  }

  get isBuilt(): boolean {
    return this.built;
  }

  /**
   * The trust list behind the projects the last refresh() returned, or null before the first
   * one. Never re-reads the file: a route that calls refresh() and then asks for this is
   * describing that refresh, not a newer one.
   */
  get trustList(): TrustList | null {
    return this.lastTrustList;
  }

  /** Why the last start declined the persisted index, or null if it used one (or none exists). */
  get cacheDecline(): indexCache.LoadFailure | null {
    return this.lastCacheDecline;
  }

  /** What the last write of the persisted index did. Null when persistence is off. */
  get cacheSave(): indexCache.SaveResult | null {
    return this.lastSave;
  }

  /**
   * How many times the index has actually been written to disk. Monotonic.
   *
   * A COUNT RATHER THAN A FLAG, because the property worth asserting is "this tick performed no
   * write", and only a number that fails to move can express that. `cacheSave` cannot: it holds
   * the LAST write's result and stays truthy across every tick that skipped one.
   */
  get cacheWrites(): number {
    return this.writes;
  }

  /** Why the last refresh did not write, or null if it did. */
  get cacheSkip(): 'unchanged' | 'throttled' | null {
    return this.lastSkip;
  }

  /**
   * Discovers the current fleet and keeps the session index in sync with it.
   *
   * THE FIRST CALL IS THE EXPENSIVE ONE, AND THIS IS WHERE THAT STOPS BEING TRUE. Restoring a
   * persisted index turns the cold start into a refresh. Measured 2026-08-16 against the real
   * corpus (2,582 files, 3.05 GB) through this exact path:
   *
   *   cold                     2,405-4,675 ms  (the spread is #50's memory-reclaim band)
   *   warm, steady             65-158 ms       (typically 75-110; see the sets below)
   *   warm, first of a session 254-386 ms      (page-cache-cold boundary windows)
   *   transcript bytes read    3,058 MB -> 0-0.02 MB
   *
   * EVERY FIGURE ABOVE IS FROM CODE THAT HAS THE PER-TICK SAVE FIX, and that qualification is
   * the correction rather than a footnote. An earlier version of this range folded in a reading
   * taken on 824bf69 — BEFORE that fix — when a warm start still paid a ~13 ms save of the whole
   * index. It attributed to machine load part of a spread this code's own defect had caused, and
   * it missed both the post-fix minimum and the high-load maximum. Post-fix sets only, each with
   * the commit it was taken on:
   *
   *   dbe2e70   65-94   median 73   (independent, load 2.20-3.08)
   *   dbe2e70   78-90               (load 2.70, n=8)
   *   afd23d6   72-130  median 93   (independent; first-of-session 335)
   *   14d5f47   93-109  median 98   (load 3.67-3.78, n=8)
   *   14d5f47   75-79               (load 3.17, n=5) and a 115-158 burst minutes earlier
   *
   * NO SINGLE MEDIAN SURVIVES THAT SPREAD, and the two readings 20 minutes apart on the SAME
   * commit at nearly the same load average — 98 and 77, with a 158 in between — are the clearest
   * statement of why. The figure tracks machine state, exactly as #50 established. A reading
   * that does real work is legitimately slower: the 106 ms above read 2 changed files and wrote
   * the index.
   *
   * AN AFTER-A-REBOOT FIGURE IS NOT QUOTED. An earlier version of this comment carried
   * "158-255 ms, first after boot" as though it had been measured. It had not: verifying it
   * needs a reboot, which nobody performed. The 254 ms above is the first run of a SESSION,
   * which is a different and checkable thing.
   *
   * The restored entries are NOT trusted. Every one arrives marked `needsVerify`, and the
   * refresh below checks each against the disk before it is used. `hydrate` on its own would be
   * an index nobody had validated, which is why the two always happen together and why `built`
   * is only set once the refresh has run.
   */
  refresh(): Project[] {
    const { projects, trustList } = discoverFleet(this.discoverOpts);
    this.lastTrustList = trustList;
    if (!this.built) {
      this.firstBuild(projects);
      this.built = true;
    } else {
      this.store.refresh(projects);
      this.persist();
    }
    return projects;
  }

  private firstBuild(projects: Project[]): void {
    if (!this.cacheEnabled) {
      this.store.buildCold(projects);
      this.fullBuildAt = Date.now();
      return;
    }
    // THE SECOND BARRIER, AND IT IS NOT REDUNDANT WITH load()'s OWN CHECKS. `load` validates
    // every field it knows about and wraps its decode — but it parses a file it did not write,
    // and the checks can only reject malformations someone thought of. A throw from here used
    // to escape refresh() and turn EVERY ROUTE into a 500: a cache able to take the server down
    // is worse than no cache. Whatever gets past load(), the answer is still a full cold build.
    let loaded: indexCache.LoadResult;
    try {
      loaded = indexCache.load({
        file: this.opts.indexCachePath,
        corpusRoot: this.corpusRoot(),
        maxFullBuildAgeMs: this.opts.maxFullBuildAgeMs,
      });
    } catch {
      loaded = { ok: false, reason: 'malformed', detail: 'load() threw' };
    }
    if (loaded.ok) {
      this.store.hydrate(loaded.entries);
      this.fullBuildAt = loaded.fullBuildAt;
      this.store.refresh(projects);
    } else {
      // The decline always names itself. "There was no cache" and "I could not read the cache"
      // are different facts that end in the same full build, so this is the only place the
      // difference can survive.
      this.lastCacheDecline = loaded.reason;
      this.store.buildCold(projects);
      this.fullBuildAt = Date.now();
    }
    this.persist();
  }

  /**
   * Writes the index — WHEN THERE IS SOMETHING TO WRITE, AND NOT MORE THAN ONCE PER INTERVAL.
   *
   * This used to run on every refresh. routes/stream.ts ticks sessions at 1 s, so a running
   * Mission Control rewrote the whole 4.38 MB index once a second — 12-15 ms per save, roughly
   * doubling a 12 ms tick, 378 GB/day. Found in review. The design costed the write once, at
   * startup; frequency appeared nowhere in it.
   *
   * TWO CONDITIONS, AND THE ORDER MATTERS. The dirty check is the one that makes an idle
   * Mission Control write NOTHING AT ALL, which no interval can achieve on its own — a floor
   * alone would still rewrite an unchanged 4.38 MB every five minutes forever. The interval
   * then bounds the busy case, where something changes on every tick and the dirty check is
   * always true.
   *
   * `filesChanged` and `filesRemoved` are the whole of "dirty" because they are the whole of
   * what a save would record: a refresh that reads nothing and removes nothing leaves every
   * entry exactly as the file on disk already describes it.
   */
  private persist(): void {
    if (!this.cacheEnabled) return;
    const r = this.store.lastResult;
    if (r && r.filesChanged === 0 && r.filesRemoved === 0) {
      this.lastSkip = 'unchanged';
      return;
    }
    const now = Date.now();
    const interval = this.opts.saveMinIntervalMs ?? indexCache.SAVE_MIN_INTERVAL_MS;
    if (this.lastSaveAt !== 0 && now - this.lastSaveAt < interval) {
      this.lastSkip = 'throttled';
      return;
    }
    this.lastSkip = null;
    this.lastSave = indexCache.save(this.store.entries(), this.fullBuildAt, {
      file: this.opts.indexCachePath,
      corpusRoot: this.corpusRoot(),
    });
    if (this.lastSave.ok) {
      this.lastSaveAt = now;
      this.writes++;
    }
  }

  /**
   * The transcript root this index describes. A cache built against a different one belongs to
   * a different corpus, and `load` refuses it rather than resolving every stored path to
   * nothing and calling the resulting empty index a fast start.
   */
  private corpusRoot(): string {
    return this.opts.claudeProjectsRoot ?? projectsDir();
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
