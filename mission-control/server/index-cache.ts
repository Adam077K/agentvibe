// server/index-cache.ts — the persisted session index, and the only file under server/ that
// writes to disk.
//
// WHY IT EXISTS. IndexStore.buildCold() reads every transcript in full: measured 2026-08-16,
// 2,538 files / 3.04 GB / 4,659 ms, and the corpus grew 1.01 -> 3.04 GB in 21 days, so the
// figure gets worse forever. IndexStore.refresh() has always been the cheap path — it skips
// untouched files and reads only appended bytes — and it was simply unreachable on the first
// call, because the store starts empty. This file is what survives the shutdown so that the
// first call can be a refresh. Measured through the real store: 4,659 ms -> ~96 ms including
// verification, 3,039.8 MB -> 10.4 MB, filesRead 2,538 -> 3.
//
// WHY IT IS SAFE TO SKIP THE CORPUS, stated plainly because "cache" and "correct" are usually
// in tension: the entries restored here are NOT trusted. Every one comes back marked
// `needsVerify`, and the next refresh() checks each against the disk — size, mtime, and a
// 4 KB boundary hash — before it is used. Restoring makes a cheap check possible; it does not
// assert freshness. See IndexStore.boundaryHash for what that check does and does not cover.
//
// A CACHE THAT CANNOT BE READ COSTS SPEED, NEVER CORRECTNESS. Every load failure falls back to
// a full cold build. That is scripts/lib/usage.js's rule (see its saveCache) and it holds here
// — with one difference: usage.js rebuilds its cache every few hundred milliseconds, so parse
// failure alone is adequate there. This one survives a shutdown, so it carries a payload hash
// as well; a truncated write can still be valid JSON of the wrong content.
//
// EVERY DECLINE NAMES ITS REASON. `load()` never returns a bare null. "I could not look" and
// "there was nothing there" are different answers, and reporting the second when the first is
// true is the defect class this phase keeps finding.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { turnsFrom } from './lib/usage.ts';
import { latestModelFrom, type FileEntry } from './index-store.ts';

/**
 * Bumped by hand when an entry's MEANING changes. Deliberately paired with
 * {@link logicFingerprint}, which needs no one to remember anything — a version constant that
 * a human must think to increment is a wish, and this one has a mechanism beside it.
 */
export const FORMAT_VERSION = 2;

/**
 * How long a full cold build's results may be reused before one is forced, regardless of what
 * every other check says.
 *
 * THIS IS THE RECOVERY PATH FOR WHAT THE BOUNDARY HASH CANNOT SEE. That hash samples the last
 * 4 KB; a rewrite touching only earlier bytes is invisible to it, and no cheap check can fix
 * that — you cannot verify bytes you do not read. So undetected staleness is bounded by TIME
 * instead: at most 24 hours, then the whole corpus is re-read whatever anything claims.
 *
 * 24 h, from the measured churn rather than from taste: over a 24 h gap only 16 of 2,538 files
 * (0.6%) and 56.1 MB of 3.04 GB (1.85%) had been touched at all, so a daily full rebuild costs
 * one 4.6 s build against ~1,800 cheap starts, while bounding the lifetime of any missed
 * rewrite to a day.
 *
 * MEASURED FROM THE LAST FULL BUILD, NOT THE LAST SAVE — the distinction is the whole point.
 * The index is saved on every refresh, so an age taken from the save time would be reset
 * continuously by a long-running server and this ceiling would never once fire.
 */
export const MAX_FULL_BUILD_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * The shortest gap between two writes of the index.
 *
 * WHY A FLOOR EXISTS AT ALL, and this is the defect that made it necessary. The index was saved
 * on EVERY refresh, and routes/stream.ts ticks sessions at 1 s — so a running Mission Control
 * wrote the whole 4.38 MB index once a second: measured 12-15 ms per save, roughly DOUBLING a
 * 12 ms tick, and **378 GB/day** to disk. The design costed the write once, at startup;
 * frequency appears nowhere in it. Optimising a 3 GB read at launch while adding a 4.38 MB
 * write every second is not a trade anyone made deliberately.
 *
 * THE COST OF A FLOOR IS BOUNDED AND SMALL, which is why five minutes rather than five seconds.
 * Whatever is not yet saved is simply re-read on the next start, and the append rate is
 * measured: 1.64 MB across 24.9 minutes on this corpus with ~17 agents active, so a five-minute
 * window is ~0.33 MB of extra reading on a start that already costs ~95 ms. Against that, the
 * write rate falls from 378 GB/day to at most 1.26 GB/day — and to ZERO while nothing changes,
 * because the dirty check comes first and no floor can substitute for it.
 *
 * Not a constant in state.ts: it belongs with the file whose size makes it necessary.
 */
export const SAVE_MIN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * `~/.agentvibe/mission-control/index.json`, overridable in full by MC_INDEX_CACHE.
 *
 * Beside `~/.agentvibe/usage-cache.json`, which is the precedent this repo already set. NOT in
 * the repo: mission-control/ sits inside a git worktree and a multi-megabyte file churning
 * there would appear in `git status`, in the conflicts collector and in every diff. NOT under
 * ~/.claude/projects: that is the corpus being indexed. And never usage-cache.json itself,
 * which belongs to the budget guard — server/lib/usage.ts exists precisely to keep Mission
 * Control off it.
 *
 * The env override is not a test-only seam. It is what lets the freshness tests run against a
 * cache they own, which is the same reasoning usage.js records for AGENTVIBE_PROJECTS_DIR: a
 * test that depends on this machine's real state passes or fails for reasons it did not choose.
 */
export function cachePath(): string {
  return process.env.MC_INDEX_CACHE || path.join(os.homedir(), '.agentvibe', 'mission-control', 'index.json');
}

/**
 * sha256 over the SOURCE TEXT of the two functions that decide what an entry means.
 *
 * THE MECHANISM BEHIND THE VERSION CONSTANT. `turnsFrom` decides which lines are turns and what
 * each contributes; `latestModelFrom` decides the Model column. Edit either and every persisted
 * entry it produced describes an older interpretation of the same bytes — while size, mtime and
 * boundary hash all still match perfectly, because the FILE did not change. Nothing else in the
 * design can see that. This can, and it requires no one to remember: the fingerprint moves when
 * the code moves, and a mismatch discards the cache.
 *
 * Honest limits: it sees these two functions, not everything they call, so a behavioural change
 * inside scripts/lib/usage.js reached some other way is invisible. And a whitespace-only edit
 * forces a needless full rebuild — the safe direction, costing one 4.6 s build.
 */
export function logicFingerprint(sources?: { turns: string; model: string }): string {
  // THE PARAMETER EXISTS SO THE PROPERTY CAN BE PROVEN RATHER THAN ASSERTED. A fingerprint
  // nobody has watched change is a hash in a comment. The test needs to write a cache as though
  // a parser had been edited and then load it with the real parsers -- and an ESM binding
  // cannot be reassigned from outside, so `turnsFrom` cannot be mutated in place. Production
  // passes nothing, so the default path is the only one that ever runs for real.
  //
  // The separator is a NEWLINE and not a space, and that is deliberate: it cannot occur inside
  // either operand's first line, so no pair of different function bodies can be concatenated
  // into the same input. (It was briefly a NUL byte, written into the source by accident --
  // valid TypeScript, invisible to tsc, and it made the file read as binary to grep.)
  const turns = sources?.turns ?? turnsFrom.toString();
  const model = sources?.model ?? latestModelFrom.toString();
  return createHash('sha256').update(turns).update('\n').update(model).digest('hex').slice(0, 32);
}

interface CacheMeta {
  v: number;
  fingerprint: string;
  corpusRoot: string;
  /** When the index was last built by reading the whole corpus. See MAX_FULL_BUILD_AGE_MS. */
  fullBuildAt: number;
  /** When this file was last written. Diagnostic; never the basis of the age check. */
  savedAt: number;
  /** sha256 of the payload line exactly as written. */
  payloadHash: string;
  entries: number;
}

/** Turns are stored as [t, out, side] tuples: measured 4.35 MB vs 6.9 MB for named keys. */
type StoredEntry = [
  file: string,
  size: number,
  mtimeMs: number,
  boundaryHash: string,
  projectId: string,
  sessionId: string,
  latestModel: string | null,
  turns: [number, number, number][],
];

export type LoadFailure =
  | 'absent'
  | 'unreadable'
  | 'malformed'
  | 'version-mismatch'
  | 'fingerprint-mismatch'
  | 'corpus-root-mismatch'
  | 'payload-hash-mismatch'
  | 'full-build-too-old';

export type LoadResult =
  | { ok: true; entries: FileEntry[]; fullBuildAt: number }
  | { ok: false; reason: LoadFailure; detail?: string };

export interface CacheOptions {
  file?: string;
  corpusRoot: string;
  now?: number;
  maxFullBuildAgeMs?: number;
}

/**
 * Reads the persisted index, or says exactly why it would not.
 *
 * Every guard below is a reason to do MORE work, never less: each one falls back to reading the
 * whole corpus. There is no path through this function that returns entries it could not
 * justify.
 */
export function load(opts: CacheOptions): LoadResult {
  const file = opts.file ?? cachePath();
  const now = opts.now ?? Date.now();
  const maxAge = opts.maxFullBuildAgeMs ?? MAX_FULL_BUILD_AGE_MS;

  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    // ABSENT AND UNREADABLE ARE DIFFERENT ANSWERS. A permissions error is not "no cache yet";
    // it is "I could not look", and collapsing the two is how a guard ends up reporting a
    // clean result it never established. Both fall back to a full build; only the reason
    // printed differs, and that reason is the whole value.
    const code = (err as NodeJS.ErrnoException).code;
    return { ok: false, reason: code === 'ENOENT' ? 'absent' : 'unreadable', detail: code };
  }

  // Two lines: meta, then payload. The payload hash covers the payload line AS WRITTEN, so
  // nothing depends on re-serialising a parsed object byte-identically.
  const nl = raw.indexOf('\n');
  if (nl === -1) return { ok: false, reason: 'malformed', detail: 'no payload line' };
  const metaLine = raw.slice(0, nl);
  const payloadLine = raw.slice(nl + 1);

  let meta: CacheMeta;
  try {
    meta = JSON.parse(metaLine) as CacheMeta;
  } catch {
    return { ok: false, reason: 'malformed', detail: 'meta line is not JSON' };
  }
  if (meta.v !== FORMAT_VERSION) return { ok: false, reason: 'version-mismatch', detail: `${meta.v} != ${FORMAT_VERSION}` };
  if (meta.fingerprint !== logicFingerprint()) return { ok: false, reason: 'fingerprint-mismatch' };
  // A cache built against a different corpus root describes a different machine's transcripts.
  // The paths inside it would resolve to nothing and every entry would be dropped as vanished —
  // silently producing an empty index rather than an obviously wrong one.
  if (meta.corpusRoot !== opts.corpusRoot) return { ok: false, reason: 'corpus-root-mismatch' };

  // AFTER the cheap checks and BEFORE parsing: a hash over 4 MB costs a few ms and a parse
  // costs more. Catches a truncated write that is still valid JSON, and bit rot — neither of
  // which JSON.parse succeeding rules out.
  const actual = createHash('sha256').update(payloadLine).digest('hex').slice(0, 32);
  if (actual !== meta.payloadHash) return { ok: false, reason: 'payload-hash-mismatch' };

  if (!Number.isFinite(meta.fullBuildAt) || now - meta.fullBuildAt > maxAge) {
    return { ok: false, reason: 'full-build-too-old', detail: `${Math.round((now - meta.fullBuildAt) / 3600_000)}h` };
  }

  let stored: StoredEntry[];
  try {
    stored = JSON.parse(payloadLine) as StoredEntry[];
    if (!Array.isArray(stored)) throw new Error('payload is not an array');
  } catch {
    return { ok: false, reason: 'malformed', detail: 'payload line is not an entry array' };
  }

  // EVERY FIELD CHECKED, AND THE WHOLE LOOP WRAPPED. The shape check used to stop at "is an
  // 8-tuple whose first element is a string" and then called `.map` on element 7 — so a cache
  // whose `turns` was a string, a number or null THREW. That throw escaped `load`, escaped
  // `LiveState.refresh()`, and turned every route into a 500: a cache that could take the whole
  // server down, in a function whose stated contract is that any failure falls back to a full
  // cold build. Found in review; the existing malformed test only covered whole-file garbage.
  //
  // The per-field checks are the specific fix. The try/catch is the general one, and it is here
  // deliberately rather than instead: the checks can only reject the malformations someone
  // thought of, and this file parses input it did not write.
  const entries: FileEntry[] = [];
  try {
    for (const e of stored) {
      if (!Array.isArray(e) || e.length !== 8) {
        return { ok: false, reason: 'malformed', detail: 'entry is not an 8-tuple' };
      }
      const [file, size, mtimeMs, boundaryHash, projectId, sessionId, latestModel, turns] = e;
      if (
        typeof file !== 'string' ||
        typeof size !== 'number' ||
        !Number.isFinite(size) ||
        typeof mtimeMs !== 'number' ||
        !Number.isFinite(mtimeMs) ||
        typeof boundaryHash !== 'string' ||
        typeof projectId !== 'string' ||
        typeof sessionId !== 'string' ||
        (latestModel !== null && typeof latestModel !== 'string') ||
        !Array.isArray(turns)
      ) {
        return { ok: false, reason: 'malformed', detail: `entry field types (${String(file)})` };
      }
      const parsedTurns = [];
      for (const t of turns) {
        if (!Array.isArray(t) || t.length !== 3 || t.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
          return { ok: false, reason: 'malformed', detail: `turn tuple (${file})` };
        }
        parsedTurns.push({ t: t[0] as number, out: t[1] as number, side: t[2] as number });
      }
      entries.push({
        file,
        size,
        mtimeMs,
        boundaryHash,
        projectId,
        sessionId,
        latestModel,
        turns: parsedTurns,
        needsVerify: true, // hydrate() sets this too; stated here so the shape is honest at birth
      });
    }
  } catch (err) {
    return { ok: false, reason: 'malformed', detail: `threw while decoding: ${String(err)}` };
  }
  return { ok: true, entries, fullBuildAt: meta.fullBuildAt };
}

export type SaveResult = { ok: true; bytes: number; entries: number } | { ok: false; reason: string };

/**
 * Writes the index, atomically.
 *
 * TEMP FILE IN THE SAME DIRECTORY, THEN RENAME. rename(2) within one filesystem is atomic, so a
 * reader sees the whole old file or the whole new one and never a prefix — which matters
 * because this file is read exactly once, at startup, by a process that has no other copy.
 * A temp file elsewhere (/tmp) would make the rename a cross-device copy and lose that.
 *
 * Failure is returned, never thrown. A cache that cannot be written costs the next start 4.6 s;
 * it must not take the running server down with it.
 */
export function save(entries: Iterable<FileEntry>, fullBuildAt: number, opts: CacheOptions): SaveResult {
  const file = opts.file ?? cachePath();
  const stored: StoredEntry[] = [];
  for (const e of entries) {
    stored.push([
      e.file,
      e.size,
      e.mtimeMs,
      e.boundaryHash,
      e.projectId,
      e.sessionId,
      e.latestModel,
      e.turns.map((t) => [t.t, t.out, t.side] as [number, number, number]),
    ]);
  }
  const payloadLine = JSON.stringify(stored);
  const meta: CacheMeta = {
    v: FORMAT_VERSION,
    fingerprint: logicFingerprint(),
    corpusRoot: opts.corpusRoot,
    fullBuildAt,
    savedAt: opts.now ?? Date.now(),
    payloadHash: createHash('sha256').update(payloadLine).digest('hex').slice(0, 32),
    entries: stored.length,
  };
  const body = `${JSON.stringify(meta)}\n${payloadLine}`;
  const tmp = `${file}.tmp-${process.pid}`;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(tmp, body);
    fs.renameSync(tmp, file);
    return { ok: true, bytes: Buffer.byteLength(body), entries: stored.length };
  } catch (err) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* nothing to clean up */
    }
    return { ok: false, reason: String((err as NodeJS.ErrnoException).code ?? err) };
  }
}

// ── Dispatch queue ────────────────────────────────────────────────────────────────────────
//
// The only other path the server is allowed to write, in the only file the cross-check
// test permits to contain write APIs. The queue and the index cache share a directory
// (~/.agentvibe/) for the same reason: NOT in the repo (churns git status and the
// conflicts collector), NOT under ~/.claude/projects (the transcript corpus).
//
// APPEND-ONLY BY DESIGN. Each line is one complete JSON entry terminated by a newline,
// so a crash mid-write leaves a corrupt line that readDispatch() skips rather than
// partially parses. Lines are never removed here — the consumer owns the queue file's
// lifecycle. Concurrent writers on the same POSIX filesystem get line-level atomicity
// from O_APPEND writes, which is the strongest guarantee available without a lock file.

/**
 * `~/.agentvibe/dispatch-queue.jsonl`, overridable by MC_DISPATCH_QUEUE.
 *
 * The env override is the same escape hatch as MC_INDEX_CACHE: a test that writes to the
 * machine's real queue passes or fails for reasons it did not choose.
 */
export function dispatchQueuePath(): string {
  return process.env.MC_DISPATCH_QUEUE ?? path.join(os.homedir(), '.agentvibe', 'dispatch-queue.jsonl');
}

/**
 * The states a dispatch can be in, and the reason there are five rather than two.
 *
 * THIS UNION USED TO BE `'pending' | 'consumed'`, AND THAT MADE FAILURE UNREPRESENTABLE.
 * consume-dispatch.ts had to write `status: ok ? 'consumed' : 'consumed'` — a real line, not a
 * caricature — so a launch that exited non-zero produced a durable record BYTE-IDENTICAL to one
 * that succeeded. Measured 2026-08-26 against a fake `claude` exiting 3: both runs appended
 * `"status":"consumed"`, differing in nothing. The failure was mentioned once on a console
 * nobody reads and was absent from the only record that persists.
 *
 * That is this repo's recurring shape — `findings: []` read as *clean*, `0 matches` read as
 * *absence* — an assertion accepted where evidence was required. The cure is not a better
 * string at the write site; it is a type in which the lie cannot be spelled.
 *
 *   pending    enqueued by the server, not yet acted on
 *   running    a launch STARTED and has not yet reported back. Durable and written BEFORE the
 *              launch, so a consumer that dies mid-flight leaves evidence instead of silence.
 *   consumed   the launch ran to completion and exited 0
 *   failed     the launch ran and exited non-zero — `exitCode` carries which
 *   no-result  it started and never returned an outcome: killed by a signal, or found still
 *              `running` by a later run
 *
 * `no-result` IS NOT AN EDGE CASE, and sizing it as one is why it was missing. Roughly half of
 * subagent runs end mid-tool (n=2,581, 95% interval [48.4%, 52.2%]), so "no outcome" is the
 * single most likely terminal state of a dispatch — and it was the one state the old union
 * could not express. A queue that reports the most probable outcome as success is not a queue.
 */
export type DispatchStatus = 'pending' | 'running' | 'consumed' | 'failed' | 'no-result';

/** The states in which no further work is owed. `running` and `pending` are NOT terminal. */
export const TERMINAL_DISPATCH_STATUSES: readonly DispatchStatus[] = ['consumed', 'failed', 'no-result'];

/**
 * One entry in the dispatch queue.
 *
 * `status` is always `'pending'` when written by the server; the consume-dispatch script
 * appends later lines carrying the same `id` as the dispatch progresses. Every line is
 * preserved on read — the queue is append-only — so the CURRENT state of a dispatch is the
 * LAST line bearing its id, which is what `resolveDispatchStates()` computes. Do not filter
 * raw `readDispatch()` output by status: see that function for the re-dispatch bug it fixes.
 */
export interface DispatchEntry {
  /** Stable identifier for this request — a UUID, assigned by the server at enqueue time. */
  id: string;
  /** Project ID — matches discoverProjects() output, validated against the live fleet. */
  project: string;
  /** Absolute path to the project root — copied from the discovered project at enqueue time. */
  root: string;
  /** The goal the agent is asked to pursue. 1–2000 characters, trimmed. */
  goal: string;
  /** Unix timestamp in ms when this entry was appended. */
  enqueuedAt: number;
  /** Where this dispatch has got to. See DispatchStatus for why there are five. */
  status: DispatchStatus;
  /** Unix ms when the launch was started. Set on the `running` line and carried forward. */
  startedAt?: number;
  /** Unix ms when a terminal state was recorded. */
  finishedAt?: number;
  /**
   * The launch's exit code when one was returned.
   *
   * ABSENT IS NOT ZERO. A dispatch killed by a signal has no exit code at all, and writing `0`
   * there would recreate the defect this type exists to remove, one field along.
   */
  exitCode?: number;
  /** The signal that killed the launch, when one did — mutually exclusive with `exitCode`. */
  signal?: string;
  /** Operator-facing detail for a non-terminal-success state. Never the only record of it. */
  error?: string;
}

/**
 * Appends one entry to the queue file, creating the directory if needed.
 *
 * FAILURE IS NOT SWALLOWED. The caller (routes/api.ts) converts this throw into a 500
 * response so the client knows the entry was not queued — a silent failure in a write queue
 * is worse than an explicit error.
 */
export function appendDispatch(entry: DispatchEntry, file?: string): void {
  const p = file ?? dispatchQueuePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, JSON.stringify(entry) + '\n', 'utf8');
}

/**
 * Reads the entire queue file and returns all structurally valid entries.
 *
 * Invalid or corrupt lines (partial writes, schema mismatches) are skipped with no error:
 * a queue reader must be resilient to partial writes and forward-compatible with new fields.
 * ENOENT (no queue yet) is not an error — it is returned as an empty array.
 */
export function readDispatch(file?: string): DispatchEntry[] {
  const p = file ?? dispatchQueuePath();
  let text: string;
  try {
    text = fs.readFileSync(p, 'utf8');
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  const entries: DispatchEntry[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue; // corrupt line — skip
    }
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof (parsed as Record<string, unknown>).id === 'string' &&
      typeof (parsed as Record<string, unknown>).project === 'string' &&
      typeof (parsed as Record<string, unknown>).root === 'string' &&
      typeof (parsed as Record<string, unknown>).goal === 'string' &&
      typeof (parsed as Record<string, unknown>).enqueuedAt === 'number'
    ) {
      entries.push(parsed as DispatchEntry);
    }
  }
  return entries;
}

/**
 * The CURRENT state of each dispatch: the last line bearing each id, in first-seen order.
 *
 * WHY THIS EXISTS — A RE-DISPATCH BUG, MEASURED, NOT ANTICIPATED. The queue is append-only, so
 * acting on an entry appends a new line rather than editing the old one. consume-dispatch.ts
 * selected work with `readDispatch().filter(e => e.status === 'pending')`, which reads EVERY
 * line — including the original `pending` line, which no later append ever removes. So a goal
 * that had already been launched was launched again on every subsequent run.
 *
 * Measured 2026-08-26 on unmodified code: one entry, consumed once, then the consumer re-run on
 * the same queue relaunched it and appended a third line. Nothing in the queue said it had been
 * done, because the line that said so was not the line being read.
 *
 * The script's own comment absorbed this as safe — "`claude --print` is idempotent in the worst
 * case". Launching an agent against the same goal repeatedly is not idempotent in any sense that
 * survives contact with a goal that writes files, and the assumption was doing load-bearing work
 * for a bug rather than describing a property anyone had checked.
 *
 * Order is FIRST-SEEN, deliberately: the queue is a work list and its natural order is the order
 * goals were enqueued, not the order they last changed state. A UI showing newest-first reverses
 * this itself.
 */
export function resolveDispatchStates(entries: DispatchEntry[]): DispatchEntry[] {
  const latest = new Map<string, DispatchEntry>();
  for (const e of entries) latest.set(e.id, e);
  return [...latest.values()];
}

/**
 * Dispatches with work still owed: never launched, or launched by a run that never came back.
 *
 * A `running` entry reaching this function is NOT owed a launch — it is owed a verdict, and the
 * caller records `no-result` for it rather than starting it again. Returning it here and letting
 * the caller decide is what keeps "we do not know what happened" from being silently retried
 * into "it succeeded".
 */
export function unfinishedDispatches(entries: DispatchEntry[]): DispatchEntry[] {
  return resolveDispatchStates(entries).filter((e) => !TERMINAL_DISPATCH_STATUSES.includes(e.status));
}
