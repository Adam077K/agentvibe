// test/index-cache.test.ts — does the fast start ever serve a STALE answer?
//
// Asked by trying to cause one, on a FROZEN fixture corpus where the only thing that moves is
// what this file moves. A measurement against the live corpus cannot answer it: an earlier run
// of exactly this comparison against ~/.claude/projects reported a difference, and the
// difference was this session's own transcript growing between the two builds. It proved
// nothing in either direction.
//
// THE ORACLE IS A FULL COLD BUILD OF THE SAME ON-DISK STATE. That is ground truth by
// construction — it reads every byte and reuses nothing — so any disagreement is the
// incremental path being wrong. Not a hand-computed expectation, which would only be a second
// chance to make the same mistake.
//
// FOUR OF THE NINE CASES BELOW ARE DEFECTS ON `main` TODAY. The persisted index did not create
// them: `refresh()` has always keyed on size+mtime, and every one follows from that key alone.
// What persistence changes is the window in which they can happen — from the ~1 s between SSE
// ticks to however long Mission Control was shut down. `boundaryVerified: false` is what the
// code did before this PR, executed here rather than described, so the fix is measured against
// the bug instead of asserted over it.
//
// AND THE BOUNDARY HASH FIXES TWO OF THE FOUR, NOT ALL FOUR. It samples the last 4 KB of a
// file, so an edit before that point is invisible to it — you cannot verify bytes you do not
// read. Those two cases are asserted STALE here, deliberately, because a suite that quietly
// chose mutations inside the window would report a mechanism as complete when it is a sample.
// The recovery for the uncovered class is the age ceiling (MAX_FULL_BUILD_AGE_MS), which
// bounds how long any undetected rewrite can persist. It is not detection and is not
// described as detection.

import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { discoverProjects, type Project } from '../server/projects.ts';
import { IndexStore, BOUNDARY_BYTES, type FileEntry, type SessionSummary } from '../server/index-store.ts';
import { LiveState } from '../server/state.ts';
import * as cache from '../server/index-cache.ts';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo } from './fixtures.ts';

const cleanupDirs: string[] = [];
afterAll(() => {
  for (const d of cleanupDirs) rmTmp(d);
});

const BASE = Date.parse('2026-08-01T00:00:00Z');
const SESSIONS = 5;
/**
 * 60 turns is ~10.6 KB per transcript, and the size is chosen rather than arbitrary: it must be
 * comfortably MORE than BOUNDARY_BYTES (4 KB) so that "near the start of the file" and "inside
 * the last 4 KB" are two genuinely different places. On a file smaller than the window every
 * rewrite would be caught, and the accepted limitation below would be untestable — which is
 * indistinguishable from it not existing.
 */
const TURNS = 60;

interface Fixture {
  projects: Project[];
  claudeRoot: string;
  projectsRoot: string;
  transcriptDir: string;
  cacheFile: string;
  reset: () => void;
}

/** A corpus nothing else writes to, rebuilt byte-identically before every case. */
function frozenFixture(tag: string): Fixture {
  const claudeRoot = mkTmpDir(`mc-cache-${tag}-claude-`);
  const projectsRoot = mkTmpDir(`mc-cache-${tag}-projects-`);
  const cacheDir = mkTmpDir(`mc-cache-${tag}-cache-`);
  cleanupDirs.push(claudeRoot, projectsRoot, cacheDir);

  const repo = path.join(projectsRoot, 'frozen');
  initGitRepo(repo);

  const reset = () => {
    for (let s = 0; s < SESSIONS; s++) {
      const turns = Array.from({ length: TURNS }, (_, i) => ({
        ts: new Date(BASE + s * 1e6 + i * 1000).toISOString(),
        output_tokens: 100 + i,
        model: 'claude-opus-5',
        isSidechain: i % 7 === 0,
      }));
      fixtureClaudeProjectsDir(claudeRoot, repo, `sess-${s}`, turns);
    }
    for (const extra of ['sess-new.jsonl']) {
      try {
        fs.rmSync(path.join(claudeRoot, fs.readdirSync(claudeRoot)[0]!, extra));
      } catch {
        /* absent, which is the reset state */
      }
    }
  };
  reset();

  const projects = discoverProjects({ roots: [projectsRoot], claudeProjectsRoot: claudeRoot });
  if (projects.length !== 1) throw new Error(`fixture broken: discovered ${projects.length} projects`);
  return {
    projects,
    claudeRoot,
    projectsRoot,
    transcriptDir: projects[0]!.transcriptDirs[0]!,
    cacheFile: path.join(cacheDir, 'index.json'),
    reset,
  };
}

function turnLine(tsMs: number, out: number): string {
  return JSON.stringify({
    type: 'assistant',
    timestamp: new Date(tsMs).toISOString(),
    isSidechain: false,
    message: { model: 'claude-opus-5', usage: { input_tokens: 1, output_tokens: out } },
  });
}

/** What a full read of the current disk says. The oracle. */
function groundTruth(f: Fixture): SessionSummary[] {
  const store = new IndexStore();
  store.buildCold(f.projects);
  return store.allSessions();
}

/**
 * Hydrate from a saved cache and refresh — the real fast-start path.
 *
 * `boundaryVerified: false` clears `needsVerify` on every restored entry, which is exactly the
 * behaviour before this PR: skip on size+mtime, append from the old offset, verify nothing.
 * It is how the two staleness cases are REPRODUCED rather than described. Reaching into the
 * private map is a cast, and it is the point — there is deliberately no production path that
 * produces an unverified-but-trusted entry.
 */
function fastStart(f: Fixture, opts: { boundaryVerified: boolean }): { sessions: SessionSummary[]; store: IndexStore } {
  const loaded = cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot });
  if (!loaded.ok) throw new Error(`fixture broken: cache would not load (${loaded.reason})`);
  const store = new IndexStore();
  store.hydrate(loaded.entries);
  if (!opts.boundaryVerified) {
    for (const e of (store as unknown as { files: Map<string, FileEntry> }).files.values()) e.needsVerify = false;
  }
  store.refresh(f.projects);
  return { sessions: store.allSessions(), store };
}

function saveCurrent(f: Fixture): void {
  const store = new IndexStore();
  store.buildCold(f.projects);
  const r = cache.save(store.entries(), Date.now(), { file: f.cacheFile, corpusRoot: f.claudeRoot });
  if (!r.ok) throw new Error(`fixture broken: cache would not save (${r.reason})`);
}

/**
 * Rewrite `find` -> `replace` in one transcript, preserving length, size and mtime exactly, and
 * assert where the edit landed relative to the boundary window. Returns nothing; it throws if
 * the fixture cannot support the case, so a case can never quietly test something else.
 *
 * `expectInsideWindow` is the whole reason this helper exists. The boundary hash samples the
 * last BOUNDARY_BYTES of a file, so WHERE an edit lands decides whether it can be seen at all.
 * A case that merely hoped to be inside or outside would silently drift the day the fixture
 * changed size, and the suite would keep passing while testing a different property.
 */
function rewriteInPlace(file: string, find: string, replace: string, expectInsideWindow: boolean): void {
  const st = fs.statSync(file);
  const text = fs.readFileSync(file, 'utf8');
  const at = text.indexOf(find);
  if (at === -1) throw new Error(`probe bug: ${find} not present`);
  if (find.length !== replace.length) throw new Error('probe bug: replacement changes the length');

  const windowStart = Math.max(0, st.size - BOUNDARY_BYTES);
  const inside = at >= windowStart;
  if (inside !== expectInsideWindow) {
    throw new Error(
      `probe bug: edit at ${at} is ${inside ? 'inside' : 'outside'} the boundary window ` +
        `[${windowStart}, ${st.size}) but the case requires ${expectInsideWindow ? 'inside' : 'outside'}`
    );
  }

  const rewritten = text.slice(0, at) + replace + text.slice(at + find.length);
  if (Buffer.byteLength(rewritten) !== st.size) throw new Error('probe bug: mutation changed the length');
  fs.writeFileSync(file, rewritten);
  fs.utimesSync(file, new Date(st.atimeMs), new Date(st.mtimeMs)); // put mtime back, exactly
}

// ── The mutations ─────────────────────────────────────────────────────────────────────────
interface Case {
  name: string;
  mutate: (f: Fixture) => void;
  /** Stale under size+mtime alone — i.e. what `main` does today. Executed, not assumed. */
  staleWithoutBoundaryHash: boolean;
  /**
   * Stale even WITH the boundary hash. True for exactly the cases that edit bytes the 4 KB
   * sample cannot reach — the accepted limitation, pinned here so it is a measured boundary
   * rather than a sentence in a comment.
   */
  staleWithBoundaryHash: boolean;
  why: string;
}

const CASES: Case[] = [
  {
    name: 'untouched',
    mutate: () => {},
    staleWithoutBoundaryHash: false,
    staleWithBoundaryHash: false,
    why: 'nothing changed, so every entry is trivially still correct',
  },
  {
    name: 'append',
    mutate: (f) => fs.appendFileSync(path.join(f.transcriptDir, 'sess-0.jsonl'), turnLine(BASE + 9e6, 777) + '\n'),
    staleWithoutBoundaryHash: false,
    staleWithBoundaryHash: false,
    why: 'size and mtime both move; only the appended bytes are parsed',
  },
  {
    name: 'truncate (size DOWN)',
    mutate: (f) => {
      const p = path.join(f.transcriptDir, 'sess-1.jsonl');
      fs.truncateSync(p, Math.floor(fs.statSync(p).size / 2));
    },
    staleWithoutBoundaryHash: false,
    staleWithBoundaryHash: false,
    why: 'size shrank, so the full-read branch is taken',
  },
  {
    name: 'new file',
    mutate: (f) => fs.writeFileSync(path.join(f.transcriptDir, 'sess-new.jsonl'), turnLine(BASE + 1e7, 555) + '\n'),
    staleWithoutBoundaryHash: false,
    staleWithBoundaryHash: false,
    why: 'no prior entry exists, so it is read in full',
  },
  {
    name: 'deleted file',
    mutate: (f) => fs.rmSync(path.join(f.transcriptDir, 'sess-4.jsonl')),
    staleWithoutBoundaryHash: false,
    staleWithBoundaryHash: false,
    why: 'absent from the scan, so it is dropped from the index',
  },
  {
    // DEFECT 1. size+mtime is blind to this: 0 files read, 0 bytes read, wrong answer served.
    name: 'in-place rewrite inside the boundary window (size AND mtime preserved)',
    // Turn 58 of 60 — near the end, so it falls inside the sampled last 4 KB.
    mutate: (f) => rewriteInPlace(path.join(f.transcriptDir, 'sess-2.jsonl'), '"output_tokens":158', '"output_tokens":911', true),
    staleWithoutBoundaryHash: true,
    staleWithBoundaryHash: false,
    why: 'size identical, mtime identical — the cheap key cannot see it, the boundary hash can',
  },
  {
    // THE ACCEPTED LIMITATION, EXECUTED. Same mutation, further from the end of the file.
    name: 'in-place rewrite BEFORE the boundary window (size AND mtime preserved)',
    // Turn 0 of 60 — offset ~0 in a ~10.6 KB file, so it is outside the sampled last 4 KB.
    mutate: (f) => rewriteInPlace(path.join(f.transcriptDir, 'sess-2.jsonl'), '"output_tokens":100', '"output_tokens":911', false),
    staleWithoutBoundaryHash: true,
    staleWithBoundaryHash: true,
    why: 'the sample cannot reach these bytes; recovery is the age ceiling, not detection',
  },
  {
    // DEFECT 2. readAppended reads from the old offset, assuming the prefix is unchanged.
    name: 'rewrite near the old end, plus an append (size grows)',
    mutate: (f) => {
      const p = path.join(f.transcriptDir, 'sess-3.jsonl');
      // Edit inside what WILL BE the old boundary window, then append. The append path re-reads
      // that window before trusting the offset, so this is the case it exists to catch.
      rewriteInPlace(p, '"output_tokens":158', '"output_tokens":424', true);
      const st = fs.statSync(p);
      fs.appendFileSync(p, turnLine(BASE + 9.5e6, 11) + '\n');
      if (fs.statSync(p).size <= st.size) throw new Error('probe bug: the file did not grow');
    },
    staleWithoutBoundaryHash: true,
    staleWithBoundaryHash: false,
    why: 'size grew, so only the tail is parsed — but the old boundary is checked first',
  },
  {
    // THE SAME ACCEPTED LIMITATION ON THE APPEND PATH.
    name: 'rewrite at the file start, plus an append (size grows)',
    mutate: (f) => {
      const p = path.join(f.transcriptDir, 'sess-3.jsonl');
      rewriteInPlace(p, '"output_tokens":100', '"output_tokens":424', false);
      fs.appendFileSync(p, turnLine(BASE + 9.5e6, 11) + '\n');
    },
    staleWithoutBoundaryHash: true,
    staleWithBoundaryHash: true,
    why: 'the changed prefix is outside the sampled window, so nothing sees it',
  },
];

describe('the fast start agrees with a full read, across every way a transcript can change', () => {
  const f = frozenFixture('cases');

  for (const c of CASES) {
    test(`${c.name} — ${c.why}`, () => {
      f.reset();
      saveCurrent(f);
      const beforeMutation = groundTruth(f);
      expect(beforeMutation.length).toBe(SESSIONS); // NON-VACUITY: the fixture really is a corpus

      c.mutate(f);

      const truth = groundTruth(f);
      const { sessions, store } = fastStart(f, { boundaryVerified: true });

      if (c.staleWithBoundaryHash) {
        // THE ACCEPTED LIMITATION, ASSERTED AS SUCH RATHER THAN AVOIDED. These edits change
        // bytes the 4 KB sample cannot reach, so the fast start does NOT match a full read —
        // and pretending otherwise would be this suite claiming coverage it does not have.
        // Pinned in this direction so that widening the window, or replacing the sample with
        // something stronger, turns this red and forces the claim to be restated.
        // The recovery for this class is MAX_FULL_BUILD_AGE_MS, not detection.
        expect(sessions).not.toEqual(truth);
      } else {
        // THE ASSERTION. Byte-identical to what reading every byte produces.
        expect(sessions).toEqual(truth);
      }

      // NON-VACUITY: for every case except 'untouched' the mutation must have MOVED the answer,
      // or this compares two identical things and would pass with the index disconnected.
      if (c.name === 'untouched') {
        expect(truth).toEqual(beforeMutation);
      } else {
        expect(truth).not.toEqual(beforeMutation);
      }

      // …and the fast start really was fast: it did not quietly re-read the whole corpus.
      const r = store.lastResult!;
      expect(r.filesScanned).toBe(r.filesRead + r.filesSkipped + r.filesUnread);
      expect(r.filesSkipped).toBeGreaterThan(0);
    });
  }
});

// ── THE MUTATION GATE, and it is the reason to believe any of the above ───────────────────
//
// Five of the seven cases pass with the boundary hash disabled. If all seven did, the check
// would be decorative and these tests would be green for a reason that has nothing to do with
// it. This runs the same seven cases with verification off and requires EXACTLY the two known
// defects to reappear — no more, no fewer.
describe('MUTATION GATE: with the boundary hash disabled, exactly the two known defects return', () => {
  const f = frozenFixture('gate');

  function staleCasesUnder(boundaryVerified: boolean): string[] {
    const stale: string[] = [];
    for (const c of CASES) {
      f.reset();
      saveCurrent(f);
      c.mutate(f);
      const truth = groundTruth(f);
      const { sessions } = fastStart(f, { boundaryVerified });
      if (JSON.stringify(sessions) !== JSON.stringify(truth)) stale.push(c.name);
    }
    return stale;
  }

  test('size+mtime alone is stale on four cases; the boundary hash removes exactly two', () => {
    const without = staleCasesUnder(false);
    const with_ = staleCasesUnder(true);

    // WHAT `main` DOES TODAY. All four rewrite shapes are invisible to size+mtime.
    expect(without).toEqual(CASES.filter((c) => c.staleWithoutBoundaryHash).map((c) => c.name));
    expect(without).toHaveLength(4);

    // WHAT THIS PR CHANGES, stated as a difference rather than as a total: the two edits that
    // land inside the sampled window are now caught. The two outside it are not, and that is
    // the accepted limitation — a claim of "fixes staleness" would be false.
    expect(with_).toEqual(CASES.filter((c) => c.staleWithBoundaryHash).map((c) => c.name));
    expect(with_).toHaveLength(2);
    expect(without.filter((n) => !with_.includes(n))).toEqual([
      'in-place rewrite inside the boundary window (size AND mtime preserved)',
      'rewrite near the old end, plus an append (size grows)',
    ]);

    // NON-VACUITY: the five benign cases are stale under NEITHER setting, so the difference
    // above is the boundary hash doing work rather than the harness reporting noise.
    expect(CASES).toHaveLength(9);
    expect(CASES.filter((c) => !c.staleWithoutBoundaryHash)).toHaveLength(5);
  });

  test('and it REPORTS catching them, rather than fixing them silently', () => {
    for (const c of CASES.filter((x) => x.staleWithoutBoundaryHash && !x.staleWithBoundaryHash)) {
      f.reset();
      saveCurrent(f);
      c.mutate(f);
      const { store } = fastStart(f, { boundaryVerified: true });
      const r = store.lastResult!;
      expect(r.filesVerified).toBeGreaterThan(0); // probes ran…
      expect(r.filesStale).toBe(1); // …and exactly one found the cheap key was wrong
      expect(r.verifyBytesRead).toBeGreaterThan(0);
      expect(r.filesRead).toBe(1); // the file it caught was then re-read, and only that one
      expect(r.filesScanned).toBe(r.filesRead + r.filesSkipped + r.filesUnread);
    }
  });

  test('a clean start reports zero stale files, so filesStale is not simply always non-zero', () => {
    f.reset();
    saveCurrent(f);
    const { store } = fastStart(f, { boundaryVerified: true });
    const r = store.lastResult!;
    expect(r.filesVerified).toBe(SESSIONS); // every entry was checked…
    expect(r.filesStale).toBe(0); // …and every one was genuinely fine
  });
});

// ── The fingerprint, watched changing ─────────────────────────────────────────────────────
describe('logicFingerprint invalidates a cache when a parser changes', () => {
  const f = frozenFixture('fingerprint');

  test('it is deterministic, and every input contributes to it', () => {
    const real = cache.logicFingerprint();
    expect(cache.logicFingerprint()).toBe(real); // same inputs, same answer

    const sources = { turns: 'function turnsFrom(t){/*real*/}', model: 'function latestModelFrom(t){/*real*/}' };
    const baseline = cache.logicFingerprint(sources);
    // BOTH operands matter. A fingerprint over only one of them would pass a test that varied
    // the other, and the Model column is exactly as capable of reinterpreting stored bytes as
    // the turn parser is.
    expect(cache.logicFingerprint({ ...sources, turns: sources.turns + ' // edited' })).not.toBe(baseline);
    expect(cache.logicFingerprint({ ...sources, model: sources.model + ' // edited' })).not.toBe(baseline);
    // …and the separator cannot be forged by moving text across the boundary.
    expect(cache.logicFingerprint({ turns: 'ab', model: 'c' })).not.toBe(cache.logicFingerprint({ turns: 'a', model: 'bc' }));
  });

  test('a cache written by a DIFFERENT parser is refused, and the start reads the whole corpus', () => {
    // Write a cache stamped with the fingerprint of an edited parser — the on-disk state a
    // release would leave behind if `turnsFrom` were changed and the cache were not cleared.
    const store = new IndexStore();
    store.buildCold(f.projects);
    const entries = [...store.entries()];
    expect(entries.length).toBe(SESSIONS); // non-vacuity: a real index was written

    cache.save(entries, Date.now(), { file: f.cacheFile, corpusRoot: f.claudeRoot });
    const raw = fs.readFileSync(f.cacheFile, 'utf8');
    const nl = raw.indexOf('\n');
    const meta = JSON.parse(raw.slice(0, nl)) as { fingerprint: string };
    expect(meta.fingerprint).toBe(cache.logicFingerprint()); // it was stamped with the real one
    const edited = cache.logicFingerprint({
      turns: 'function turnsFrom(text) { /* a later version */ }',
      model: 'function latestModelFrom(text) { /* a later version */ }',
    });
    expect(edited).not.toBe(meta.fingerprint);
    fs.writeFileSync(f.cacheFile, `${JSON.stringify({ ...meta, fingerprint: edited })}\n${raw.slice(nl + 1)}`);

    const loaded = cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot });
    expect(loaded.ok).toBe(false);
    expect(loaded.ok === false && loaded.reason).toBe('fingerprint-mismatch');

    // AND THE CONSEQUENCE, not merely the boolean: the start reads every file.
    const state = new LiveState({
      roots: [f.projectsRoot],
      claudeProjectsRoot: f.claudeRoot,
      indexCachePath: f.cacheFile,
    });
    state.refresh();
    expect(state.cacheDecline).toBe('fingerprint-mismatch');
    const r = state.index.lastResult!;
    expect(r.filesRead).toBe(r.filesScanned); // a full cold build, nothing skipped
    expect(r.filesSkipped).toBe(0);
  });
});

// ── Everything else that must make the loader refuse ──────────────────────────────────────
describe('the loader refuses anything it cannot justify, and names the reason', () => {
  const f = frozenFixture('refuse');

  test('absent and unreadable are different answers', () => {
    const missing = cache.load({ file: path.join(f.projectsRoot, 'no-such-cache.json'), corpusRoot: f.claudeRoot });
    expect(missing.ok === false && missing.reason).toBe('absent');

    // A directory where a file is expected: readFileSync fails with EISDIR, not ENOENT. The
    // point is that "I could not look" never renders as "there was nothing there".
    const dir = mkTmpDir('mc-cache-eisdir-');
    cleanupDirs.push(dir);
    const asDir = cache.load({ file: dir, corpusRoot: f.claudeRoot });
    expect(asDir.ok === false && asDir.reason).toBe('unreadable');
  });

  test('a truncated payload that is still valid JSON is caught by the payload hash', () => {
    f.reset();
    saveCurrent(f);
    const raw = fs.readFileSync(f.cacheFile, 'utf8');
    const nl = raw.indexOf('\n');
    const payload = JSON.parse(raw.slice(nl + 1)) as unknown[];
    expect(payload.length).toBe(SESSIONS);
    // Drop one entry. Perfectly valid JSON, perfectly wrong content — which is exactly what
    // JSON.parse succeeding cannot rule out, and why parse-only validation is not enough for a
    // file that survives a shutdown.
    const shortened = JSON.stringify(payload.slice(0, SESSIONS - 1));
    fs.writeFileSync(f.cacheFile, `${raw.slice(0, nl)}\n${shortened}`);
    expect(() => JSON.parse(shortened)).not.toThrow(); // non-vacuity: it really is valid JSON

    const loaded = cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot });
    expect(loaded.ok === false && loaded.reason).toBe('payload-hash-mismatch');
  });

  test('a cache from a different corpus root is refused rather than resolving to nothing', () => {
    f.reset();
    saveCurrent(f);
    const loaded = cache.load({ file: f.cacheFile, corpusRoot: '/some/other/machine/.claude/projects' });
    expect(loaded.ok === false && loaded.reason).toBe('corpus-root-mismatch');
    // …and with the right root it loads, so the check above discriminates rather than refusing
    // everything.
    expect(cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot }).ok).toBe(true);
  });

  test('a version bump refuses the old format', () => {
    f.reset();
    saveCurrent(f);
    const raw = fs.readFileSync(f.cacheFile, 'utf8');
    const nl = raw.indexOf('\n');
    const meta = JSON.parse(raw.slice(0, nl)) as { v: number };
    fs.writeFileSync(f.cacheFile, `${JSON.stringify({ ...meta, v: meta.v - 1 })}\n${raw.slice(nl + 1)}`);
    const loaded = cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot });
    expect(loaded.ok === false && loaded.reason).toBe('version-mismatch');
  });

  test('the age ceiling forces a full build however good everything else looks', () => {
    f.reset();
    const store = new IndexStore();
    store.buildCold(f.projects);
    const stale = Date.now() - cache.MAX_FULL_BUILD_AGE_MS - 60_000;
    cache.save(store.entries(), stale, { file: f.cacheFile, corpusRoot: f.claudeRoot });

    // Everything else about this cache is perfect: right version, right fingerprint, right
    // corpus, intact payload. Only the full build behind it is too old.
    const loaded = cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot });
    expect(loaded.ok === false && loaded.reason).toBe('full-build-too-old');

    // NON-VACUITY: the same cache one minute inside the ceiling is accepted, so the refusal is
    // the age and not some other property of this file.
    cache.save(store.entries(), Date.now() - cache.MAX_FULL_BUILD_AGE_MS + 60_000, {
      file: f.cacheFile,
      corpusRoot: f.claudeRoot,
    });
    expect(cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot }).ok).toBe(true);
  });

  // C3, FOUND IN REVIEW. The shape check stopped at "8-tuple whose first element is a string"
  // and then called `.map` on element 7, so a cache whose `turns` was a string, a number or
  // null THREW — out of load(), out of LiveState.refresh(), and into every route as a 500.
  // The pre-existing malformed test only covered whole-file garbage, which never reached the
  // decode loop. A cache that can take the whole server down is worse than no cache.
  test('a structurally valid cache with a corrupt entry is refused, never thrown', () => {
    f.reset();
    const corruptions: [string, (e: unknown[]) => void][] = [
      ['turns is a string', (e) => { e[7] = 'not an array'; }],
      ['turns is null', (e) => { e[7] = null; }],
      ['turns is a number', (e) => { e[7] = 42; }],
      ['a turn is not a triple', (e) => { e[7] = [[1, 2]]; }],
      ['a turn holds a string', (e) => { e[7] = [['a', 2, 0]]; }],
      ['size is a string', (e) => { e[1] = '100'; }],
      ['latestModel is an object', (e) => { e[6] = { model: 'x' }; }],
      ['boundaryHash is missing', (e) => { e[3] = undefined; }],
    ];

    for (const [name, corrupt] of corruptions) {
      saveCurrent(f);
      const raw = fs.readFileSync(f.cacheFile, 'utf8');
      const nl = raw.indexOf('\n');
      const meta = JSON.parse(raw.slice(0, nl)) as Record<string, unknown>;
      const payload = JSON.parse(raw.slice(nl + 1)) as unknown[][];
      corrupt(payload[0]!);
      const line = JSON.stringify(payload);
      // Re-stamp the payload hash, so this tests the DECODER and not the hash check that would
      // otherwise reject the file first — the two guards must each work alone.
      meta.payloadHash = createHash('sha256').update(line).digest('hex').slice(0, 32);
      fs.writeFileSync(f.cacheFile, `${JSON.stringify(meta)}\n${line}`);

      let result: cache.LoadResult | undefined;
      expect(() => {
        result = cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot });
      }).not.toThrow();
      expect(`${name}: ${result!.ok}`).toBe(`${name}: false`);
      expect(result!.ok === false && result!.reason).toBe('malformed');
    }
  });

  test('and the server still serves: a corrupt cache degrades to a full cold build', () => {
    f.reset();
    saveCurrent(f);
    const raw = fs.readFileSync(f.cacheFile, 'utf8');
    const nl = raw.indexOf('\n');
    const meta = JSON.parse(raw.slice(0, nl)) as Record<string, unknown>;
    const payload = JSON.parse(raw.slice(nl + 1)) as unknown[][];
    payload[0]![7] = 'not an array';
    const line = JSON.stringify(payload);
    meta.payloadHash = createHash('sha256').update(line).digest('hex').slice(0, 32);
    fs.writeFileSync(f.cacheFile, `${JSON.stringify(meta)}\n${line}`);

    // THROUGH THE ROUTE, because "load returns false" is not the property that matters — the
    // property is that a user gets their sessions instead of a 500.
    const state = new LiveState({
      roots: [f.projectsRoot],
      claudeProjectsRoot: f.claudeRoot,
      indexCachePath: f.cacheFile,
    });
    expect(() => state.refresh()).not.toThrow();
    expect(state.cacheDecline).toBe('malformed');
    const r = state.index.lastResult!;
    expect(r.filesRead).toBe(SESSIONS); // it read the corpus rather than trusting the cache
    expect(r.filesSkipped).toBe(0);
    expect(state.index.allSessions()).toEqual(groundTruth(f)); // …and the answer is correct
  });

  test('a malformed file is refused, not thrown', () => {
    f.reset();
    fs.writeFileSync(f.cacheFile, 'this is not a cache');
    expect(cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot }).ok).toBe(false);
    fs.writeFileSync(f.cacheFile, '{"v":2}\nnot json either');
    expect(cache.load({ file: f.cacheFile, corpusRoot: f.claudeRoot }).ok).toBe(false);
  });
});

// ── Does the persisted index carry anything past the trust boundary? ──────────────────────
//
// #44 gave Mission Control an allowlist: an untrusted project is reported but no program is run
// for it. This index survives a process restart, so the question is fair — and it was NOT part
// of the design that produced this file, because trust did not exist then. A cache built while
// a project was trusted, read back after it was untrusted, would be a channel carrying data
// past a boundary, and NONE of the nine staleness cases above would see it: the file does not
// change when a trust decision does.
//
// THE COMPARISON THAT ANSWERS IT IS COLD vs WARM, not "does warm contain the project". If a
// cold start — no cache in the picture at all — serves it too, then the session index does not
// gate on trust and the cache changed nothing. Asking only the warm half produces a finding
// with no denominator.
//
// THE ANSWER, EXECUTED: identical. Trust gates program EXECUTION — the conflicts sweep, the
// belief ledger spawn, the empty-state probe, all through partitionByTrust in routes/api.ts —
// and the session index is not one of those. It reads transcripts under ~/.claude/projects,
// which is the user's own Claude Code history rather than content from the untrusted
// repository, and reading it runs nothing. `trustStateFor`'s own reason string says as much:
// "Nothing below is a measurement of this project — it is what could be read without executing
// anything."
//
// SO THIS PINS A PROPERTY RATHER THAN FIXING A HOLE. If sessions are ever made trust-filtered,
// these assertions go red and say what to do: the trust list must join the cache's invalidation
// key, because a cache keyed on corpus bytes cannot see a policy change.
describe('the persisted index is not a channel past the trust boundary', () => {
  const f = frozenFixture('trust');
  const trustFile = path.join(f.projectsRoot, 'trusted-projects');
  const repo = path.join(f.projectsRoot, 'frozen');
  const cacheFile = path.join(f.projectsRoot, 'trust-cache.json');

  const setTrust = (roots: string[]) => fs.writeFileSync(trustFile, `# fixture\n${roots.join('\n')}\n`);
  const start = (mode: 'cold' | 'warm') => {
    const state = new LiveState({
      roots: [f.projectsRoot],
      claudeProjectsRoot: f.claudeRoot,
      trustFile,
      ...(mode === 'cold' ? { indexCache: false } : { indexCachePath: cacheFile }),
    });
    const projects = state.refresh();
    return { sessions: state.index.allSessions(), projects, result: state.index.lastResult! };
  };

  test('a cache built while the project was TRUSTED serves exactly what a cold start serves once it is untrusted', () => {
    f.reset();
    fs.rmSync(cacheFile, { force: true });

    setTrust([repo]);
    const built = start('warm'); // writes the cache while trusted
    expect(built.projects[0]!.trust.trusted).toBe(true);
    expect(built.sessions.length).toBe(SESSIONS);
    expect(fs.existsSync(cacheFile)).toBe(true);

    setTrust([]); // untrusted now — and not one byte of any transcript changed

    const cold = start('cold');
    const warm = start('warm');

    // NON-VACUITY, BOTH HALVES. The trust flag really flipped, and both starts really did
    // produce sessions — an equality between two empty lists would prove nothing.
    expect(cold.projects[0]!.trust.trusted).toBe(false);
    expect(warm.projects[0]!.trust.trusted).toBe(false);
    expect(cold.sessions.length).toBe(SESSIONS);
    expect(warm.sessions.length).toBe(SESSIONS);

    // …and the two really did take different paths to get there, or "identical" would only
    // mean both had read the corpus.
    expect(cold.result.filesRead).toBe(SESSIONS);
    expect(warm.result.filesRead).toBe(0);
    expect(warm.result.filesSkipped).toBe(SESSIONS);

    // THE ASSERTION. The cache adds nothing a full read does not already produce.
    expect(warm.sessions).toEqual(cold.sessions);
  });

  test('and a cache built while it was UNTRUSTED does not mask it once it is trusted', () => {
    f.reset();
    fs.rmSync(cacheFile, { force: true });

    setTrust([]);
    const built = start('warm');
    expect(built.projects[0]!.trust.trusted).toBe(false);

    setTrust([repo]);
    const cold = start('cold');
    const warm = start('warm');

    expect(warm.projects[0]!.trust.trusted).toBe(true);
    expect(cold.sessions.length).toBe(SESSIONS);
    expect(warm.sessions).toEqual(cold.sessions);
  });

  // THE STRUCTURAL REASON THE WHOLE CLASS IS SAFE, and it is worth more than the two tests
  // above because it does not depend on trust at all.
  //
  // `refresh()` ends with a removal pass: any entry whose path was not seen in THIS scan is
  // deleted from the index. So a restored entry can only survive if the current discovery still
  // reaches its file. A project that leaves the scan — untrusted, deleted, root reconfigured,
  // or for a reason nobody has thought of — takes its cached sessions with it.
  //
  // Found by mutating `LiveState.refresh()` to filter projects by trust and re-running the
  // probe: the warm start dropped the project too, cold and warm still agreed. That is the
  // answer to "would this leak if sessions ever became trust-filtered" — it would not, and the
  // reason is this pass rather than anything about trust. Pinned here so the removal pass
  // cannot be optimised away by someone who sees only that it costs a Set and a loop.
  test('a restored entry whose file is no longer in the scan is dropped, whatever put it out of scope', () => {
    f.reset();
    fs.rmSync(cacheFile, { force: true });
    setTrust([repo]);

    const built = start('warm');
    expect(built.sessions.length).toBe(SESSIONS); // non-vacuity: a real index was persisted
    expect(fs.existsSync(cacheFile)).toBe(true);

    // Same cache, but discovery now points somewhere the project is not. Nothing about the
    // transcripts changed; only what the scan can reach.
    const elsewhere = mkTmpDir('mc-cache-trust-elsewhere-');
    cleanupDirs.push(elsewhere);
    const state = new LiveState({
      roots: [elsewhere],
      claudeProjectsRoot: f.claudeRoot,
      trustFile,
      indexCachePath: cacheFile,
    });
    state.refresh();

    const r = state.index.lastResult!;
    expect(r.filesRemoved).toBe(SESSIONS); // every restored entry was dropped…
    expect(state.index.allSessions()).toEqual([]); // …and none of them is served
    expect(state.index.fileCount).toBe(0);
  });

  test('the invalidation key does not mention trust, and that is recorded rather than assumed', () => {
    f.reset();
    fs.rmSync(cacheFile, { force: true });
    setTrust([repo]);
    start('warm');

    const meta = JSON.parse(fs.readFileSync(cacheFile, 'utf8').split('\n')[0]!) as Record<string, unknown>;
    // KEYS, not a substring search of the whole envelope: the first version of this check
    // scanned `JSON.stringify(meta)` and reported a match because the fixture's temp path
    // contained the word "trust". A keyword hit inside a path is not a field.
    expect(Object.keys(meta).sort()).toEqual([
      'corpusRoot',
      'entries',
      'fingerprint',
      'fullBuildAt',
      'payloadHash',
      'savedAt',
      'v',
    ]);
    expect(Object.keys(meta).some((k) => k.toLowerCase().includes('trust'))).toBe(false);
    // Correct only as long as the two tests above hold: nothing the index serves depends on
    // trust, so keying on it would discard a valid cache for a change that alters no output.
    // The day those go red, this expectation is the first one to change.
  });
});

// ── What the index costs while the server is RUNNING, not just at startup ────────────────
//
// The design costed the write once, at launch. Frequency appeared nowhere in it — and
// routes/stream.ts ticks sessions at 1 s, so the first version of this feature rewrote the
// whole 4.38 MB index every second: 12-15 ms per save against a 12 ms refresh, ~378 GB/day.
// Optimising a 3 GB read at launch by adding a 4.38 MB write per second is not a trade anyone
// made deliberately. Found in review.
//
// THE ASSERTION IS THAT NO WRITE HAPPENS, not that a flag says so. `cacheSave` holds the LAST
// write's result and stays truthy across every tick that skipped one, so a count is the only
// thing that can express "this tick wrote nothing".
describe('the index is not rewritten on every tick', () => {
  const f = frozenFixture('ticks');
  const cacheFile = path.join(f.projectsRoot, 'tick-cache.json');

  const live = (saveMinIntervalMs: number) =>
    new LiveState({
      roots: [f.projectsRoot],
      claudeProjectsRoot: f.claudeRoot,
      indexCachePath: cacheFile,
      saveMinIntervalMs,
    });

  test('an unchanged tick performs NO write, however many ticks there are', () => {
    f.reset();
    fs.rmSync(cacheFile, { force: true });
    const state = live(0); // throttling OFF, so only the dirty check can prevent a write

    state.refresh();
    expect(state.cacheWrites).toBe(1); // the first build persists…
    expect(state.cacheSave?.ok).toBe(true);
    const bytesOnDisk = fs.statSync(cacheFile).size;
    expect(bytesOnDisk).toBeGreaterThan(0); // non-vacuity: a real index was written

    for (let i = 0; i < 20; i++) state.refresh();

    // …and twenty ticks over an unchanged corpus write nothing at all.
    expect(state.cacheWrites).toBe(1);
    expect(state.cacheSkip).toBe('unchanged');
    expect(fs.statSync(cacheFile).size).toBe(bytesOnDisk);
  });

  test('a changed tick DOES write, so the skip is a decision and not a broken save', () => {
    f.reset();
    fs.rmSync(cacheFile, { force: true });
    const state = live(0);
    state.refresh();
    expect(state.cacheWrites).toBe(1);

    state.refresh();
    expect(state.cacheWrites).toBe(1); // unchanged: still nothing

    fs.appendFileSync(path.join(f.transcriptDir, 'sess-0.jsonl'), turnLine(BASE + 9e6, 777) + '\n');
    state.refresh();
    expect(state.cacheWrites).toBe(2); // changed: written
    expect(state.cacheSkip).toBeNull();
  });

  test('a busy corpus is bounded by the write floor, which is what caps 378 GB/day', () => {
    f.reset();
    fs.rmSync(cacheFile, { force: true });
    const state = live(60_000); // a floor no test run can cross
    state.refresh();
    expect(state.cacheWrites).toBe(1);

    // Something changes on EVERY tick — the case the dirty check cannot help with, and the one
    // that produced the 378 GB/day figure.
    for (let i = 0; i < 10; i++) {
      fs.appendFileSync(path.join(f.transcriptDir, 'sess-1.jsonl'), turnLine(BASE + 2e6 + i * 1000, 5) + '\n');
      state.refresh();
      expect(state.index.lastResult!.filesChanged).toBeGreaterThan(0); // non-vacuity: really dirty
    }

    expect(state.cacheWrites).toBe(1); // ten dirty ticks, one write
    expect(state.cacheSkip).toBe('throttled');
  });

  test('the floor never suppresses the FIRST write, so a fresh install gets a cache at once', () => {
    f.reset();
    fs.rmSync(cacheFile, { force: true });
    const state = live(60 * 60_000); // an hour
    state.refresh();
    expect(state.cacheWrites).toBe(1);
    expect(fs.existsSync(cacheFile)).toBe(true);
  });
});

// ── The round trip, and what the fast start costs ─────────────────────────────────────────
describe('a saved index restores to the same answer, and the start does almost no reading', () => {
  const f = frozenFixture('roundtrip');

  test('hydrate + refresh equals a cold build, and skips instead of reading', () => {
    f.reset();
    const cold = new IndexStore();
    const coldResult = cold.buildCold(f.projects);
    cache.save(cold.entries(), Date.now(), { file: f.cacheFile, corpusRoot: f.claudeRoot });

    const { sessions, store } = fastStart(f, { boundaryVerified: true });
    expect(sessions).toEqual(cold.allSessions());

    const warm = store.lastResult!;
    expect(warm.filesScanned).toBe(coldResult.filesScanned); // the same corpus was walked…
    expect(warm.filesRead).toBe(0); // …and not one transcript was parsed
    expect(warm.bytesRead).toBe(0);
    expect(warm.filesSkipped).toBe(coldResult.filesScanned);
    expect(warm.filesVerified).toBe(coldResult.filesScanned); // every restored entry was checked
    expect(warm.filesStale).toBe(0);
    // The saving, stated as the ratio it is: transcript bytes read went to zero, and the only
    // reading left is the boundary windows.
    expect(warm.verifyBytesRead).toBeGreaterThan(0);
    expect(warm.verifyBytesRead).toBeLessThan(coldResult.bytesRead);
  });

  test('LiveState writes a cache on first start and uses it on the next', () => {
    f.reset();
    // ITS OWN CACHE PATH. The test above already wrote to f.cacheFile, and reusing it here
    // would make "there was nothing to load" false for a reason that has nothing to do with
    // this test — which is exactly how it failed the first time it was run.
    const cacheFile = path.join(path.dirname(f.cacheFile), 'first-start.json');
    const first = new LiveState({
      roots: [f.projectsRoot],
      claudeProjectsRoot: f.claudeRoot,
      indexCachePath: cacheFile,
    });
    first.refresh();
    expect(first.cacheDecline).toBe('absent'); // there was nothing to load, and it says so
    expect(first.index.lastResult!.filesRead).toBe(SESSIONS); // so it read everything
    expect(first.cacheSave?.ok).toBe(true);

    const second = new LiveState({
      roots: [f.projectsRoot],
      claudeProjectsRoot: f.claudeRoot,
      indexCachePath: cacheFile,
    });
    second.refresh();
    expect(second.cacheDecline).toBeNull(); // it accepted the cache…
    expect(second.index.lastResult!.filesRead).toBe(0); // …and read nothing
    expect(second.index.lastResult!.filesSkipped).toBe(SESSIONS);
    // Same answer, both ways.
    expect(second.index.allSessions()).toEqual(first.index.allSessions());
  });
});
