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
 *   pending      enqueued by the server, not yet acted on
 *   running      a launch STARTED and has not yet reported back. Durable and written BEFORE the
 *                launch, so a consumer that dies mid-flight leaves evidence instead of silence.
 *   exited-clean the launch exited 0. That is the whole observation: the session's output is
 *                inherited rather than captured, so whether it FINISHED is not known here.
 *   consumed     LEGACY, never written by this build. It meant "ran to completion and exited 0" —
 *                a completion nobody observed. Kept so records written before `exited-clean`
 *                still resolve as settled instead of becoming `unrecognised`.
 *   failed       the launch ran and exited non-zero — `exitCode` carries which
 *   no-result    it started and never returned an outcome: killed by a signal, or found still
 *                `running` by a later run
 *   not-started  the launch never happened — no `claude` on PATH, or the spawn itself failed
 *
 * `no-result` IS NOT AN EDGE CASE, and sizing it as one is why it was missing: a subagent run
 * ending mid-tool is an ordinary event, not a rare one, so "no outcome" is a likely terminal
 * state of a dispatch — and it was the one state the old union could not express. A queue that
 * reports a probable outcome as success is not a queue.
 * *This paragraph carried "roughly half … (n=2,581, 95% interval [48.4%, 52.2%])" until
 * 2026-08-26. The figure came from an orchestrator brief and NOTHING IN THIS REPO SOURCES IT —
 * a statistic in a code comment with no file and no access date is exactly the shape this repo
 * refuses, and it is worse in a comment than in prose because no reviewer reads it twice. The
 * design reason does not need the number; the number needed a citation it never had.*
 *
 * `exited-clean` IS NOT `consumed`, AND THIS FILE USED TO HAVE ONLY THE SECOND. F7. `consumed`
 * names a COMPLETION, and the only thing ever observed is an EXIT CODE OF ZERO. Those differ for
 * every session that stops early and tidies up on the way out: one that hits a turn cap, one that
 * handles an error and returns, one that decides it is done when it is not. The launch runs with
 * `stdio: 'inherit'`, so nothing about the session's content is captured and no field could have
 * carried the distinction — the status was asserting something the consumer never saw.
 *
 * This is `GateOutcome`'s argument one field over. That union has no `passed` member because
 * "I could not check" must not be spellable as "it passed"; `consumed` was spellable as
 * "it finished" when the truth is "it stopped". `exited-clean` says only what was observed.
 *
 * THE TURN CAP IS RECORDED AS CONTEXT, NOT AS THE DIAGNOSIS. Routing through `--agent` makes the
 * agent file's `maxTurns` bind where a bare `claude` read no such field, so a capped truncation is
 * newly reachable — but the consumer cannot tell a capped session from a finished one, and a status
 * naming the cap would assert a second thing it did not observe. `declaredMaxTurns` on the entry
 * says what limit was in force and leaves the inference to a reader who can see the transcript.
 *
 * `consumed` IS KEPT AND IS NEVER WRITTEN BY THIS BUILD. Real queues hold entries carrying it, and
 * dropping it from the union would make every one of them `unrecognised` — reported and then left
 * alone forever. It stays `settled` so those records keep resolving.
 *
 * `not-started` IS NOT `no-result`, and collapsing them misreports a config error as an agent
 * dying. `no-result` says a launch began and told us nothing. `not-started` says it never began,
 * which is a different fact with a different remedy: fix PATH and re-enqueue, with the guarantee
 * that nothing ran the first time. A systematic PATH misconfiguration under the old mapping read
 * in the UI as "the agents keep dying mid-run".
 */
export type DispatchStatus =
  | 'pending'
  | 'running'
  | 'exited-clean'
  | 'consumed'
  | 'failed'
  | 'no-result'
  | 'not-started';

/**
 * What a consumer may do with each status — ONE table, from which every other list is derived.
 *
 * THREE HAND-MAINTAINED LISTS WERE TWO TOO MANY. This replaced a `TERMINAL_DISPATCH_STATUSES`
 * array, a `KNOWN_DISPATCH_STATUSES` array and a chain of `if`s in classifyDispatches() — three
 * places that had to agree, typed as `readonly DispatchStatus[]`, which type-checks a SUBSET and
 * so stayed green if a member was dropped from any of them.
 *
 * `satisfies Record<DispatchStatus, …>` makes that impossible: add a member to DispatchStatus
 * without giving it a kind here and this file does not compile. The exhaustiveness is the point,
 * not the tidiness.
 *
 * AND THE DELETED NAME WAS ITSELF A HAZARD. `TERMINAL_DISPATCH_STATUSES` was dead in production
 * — its only non-comment line was its own declaration — while its name invited exactly the
 * `!TERMINAL.includes(x)` deny-list that was this change's p1. A name that suggests the wrong
 * predicate is worse than no name, and an exported one nobody uses is a trap with a docstring.
 */
const DISPATCH_STATUS_KIND = {
  pending: 'launchable',
  running: 'reconcilable',
  'exited-clean': 'settled',
  consumed: 'settled',
  failed: 'settled',
  'no-result': 'settled',
  'not-started': 'settled',
} satisfies Record<DispatchStatus, 'launchable' | 'reconcilable' | 'settled'>;

/**
 * Every status THIS BUILD understands — the allow-list, and the reason it is an allow-list.
 *
 * A DENY-LIST HERE IS FAIL-OPEN, AND THAT IS NOT THEORETICAL — it shipped in the first cut of
 * this change and a review caught it. Selection was `!TERMINAL_DISPATCH_STATUSES.includes(status)`,
 * so every value this build did not recognise fell through to "work to do": a `"timed-out"` written
 * by a future consumer, a line with no `status` at all, `7`, `null`. Measured 2026-08-26 on that
 * build, with a `claude` that logged its own argv: all four were LAUNCHED, and the record was then
 * OVERWRITTEN with `consumed` — destroying what the previous status said and asserting success for
 * a goal whose real outcome nobody knows.
 *
 * `readDispatch()` type-checks `id`, `project`, `root`, `goal` and `enqueuedAt` and DOES NOT
 * VALIDATE `status` — deliberately, so a queue stays forward-compatible with a newer writer. That
 * forward-compatibility is precisely why the consumer must decide by what it KNOWS rather than by
 * what it can rule out.
 */
export const KNOWN_DISPATCH_STATUSES = Object.keys(DISPATCH_STATUS_KIND) as readonly DispatchStatus[];
/**
 * The invocation `scripts/run-gate.mjs` emits — the thing that WOULD run the gate.
 *
 * EMITTED, NEVER EXECUTED, and the distinction is the whole point. `qa.js` is a Workflow script
 * that closes over globals (`agent()`, `parallel()`, `phase()`, `budget`) which no plain node
 * process provides, so the router cannot run it and neither can this consumer. What it can do is
 * produce the exact arguments, so that "no verdict" arrives with the means to obtain one instead
 * of as a shrug.
 */
export interface GateInvocation {
  tool: string;
  scriptPath: string;
  args: Record<string, unknown>;
}

/**
 * What `scripts/run-gate.mjs` decided about the DIFF IN THE PROJECT ROOT when the dispatch finished.
 *
 * F4. THIS SAID "the work a dispatch produced" AND THAT IS NOT WHAT IS MEASURED. The router
 * classifies `origin/main...HEAD` in the project root, whatever put it there — measured at 185
 * files in a tree where no dispatch had run. It is attribution the consumer cannot make: it
 * launches an out-of-process session and cannot tell that session's commits from anyone else's.
 * The failure is loud rather than silent — `ref` and `files` are on the record precisely so a
 * reader can see what was classified — but a sentence claiming causation the data does not carry
 * is the same defect this whole type exists to refuse, one level up in the prose.
 *
 * THIS IS THE OTHER HALF OF THE GATE STORY, AND IT IS THE HALF THAT NEEDS NO GRANT. `GateRecord`
 * answers "could the session it launched have run the gate" — a fact about tool declarations.
 * This answers "is the gate required for the diff now standing in that root, and what would run
 * it" — a fact about a diff, NOT a claim about who produced it, decided by the repo's own router, which exists precisely because nothing called it:
 * `run-gate.mjs`'s own header says "a router that is never called is exactly the defect it was
 * written to fix."
 *
 * AGAIN THERE IS NO MEMBER MEANING "PASSED", and here the omission is sharper than in GateRecord:
 * this type carries `required: true` beside an invocation nobody ran, which is the honest shape of
 * "this dispatch produced no verdict and here is the invocation that would." A `verdict` field
 * would immediately attract a value that no panel produced.
 */
export type GateRouting =
  | {
      decided: true;
      /** Is the binding gate required for this diff? Decided by the router, not by this consumer. */
      required: boolean;
      /** The tier floor the router computed. */
      floor: string;
      /** How many files the router classified — the DENOMINATOR behind `required`. */
      files: number;
      /**
       * The ref the router was ASKED about, verbatim — which CAN BE SYMBOLIC, and that is why the
       * field below exists rather than this one being trusted alone.
       *
       * MEASURED, both arms producing both outcomes, `scripts/run-gate.mjs` at `d559dbe`:
       *   --ref origin/main...feat/w3-caller  ->  ref "origin/main...feat/w3-caller"   SYMBOLIC
       *                                           invocation.args.ref "origin/main...d559dbe…"
       *   no --ref (the default path)         ->  ref "origin/main...d559dbe…"          they agree
       *
       * `run-gate.mjs` states in capitals that THE EMITTED TIP IS ALWAYS THE RESOLVED SHA — true of
       * `invocation.args.ref`, which it pins, and NOT of this top-level field. A branch name is a
       * moving target: the record says "gated at feat/x" and feat/x is somewhere else tomorrow.
       */
      ref: string;
      /**
       * The resolved 40-hex tip the router pinned. **NEVER NULL** — a routing that could not pin a
       * tip is `decided: false`, carrying the router's own reason.
       *
       * THE VALUE A READER SHOULD QUOTE, and the only one. This was `string | null` beside a
       * `refTipReason` explaining the null, which put a third state into a type whose whole job is
       * to make the tip unambiguous — and the dedupe key built on it then collapsed every
       * unpinnable entry to ONE key per root, failing toward SKIPPING a panel. Measured on the
       * shipped router: 5 of 5 null-tip returns carry a reason, so refusing loses no diagnosis.
       *
       * WHAT THE OLD FORM ADMITTED AND THIS ONE DOES NOT: a decided routing with no pinned tip.
       * What needed it: nothing that can succeed — a tip `verdict.mjs` cannot resolve cannot carry
       * a binding verdict either, so a panel launched under it buys a record that binds to nothing.
       * What reached it: only a foreign or older router, the same population that motivates
       * requiring the field at all.
       */
      refTip: string;
      /** What would run the gate. Present when one is required. */
      invocation: GateInvocation | null;
    }
  | { decided: false; why: string };

/**
 * What happened when this consumer asked `scripts/produce-verdict.mjs` to produce a verdict.
 *
 * THE RECEIPT IS NOT THE OUTCOME, AND THIS TYPE EXISTS BECAUSE THEY LOOK ALIKE. The producer
 * launches a gate session and then reads `.qa/verdicts/` with the JUDGE's `verdict.mjs`; its exit
 * code is a summary of that reading, but a summary is not the reading. A consumer that mapped an
 * exit code straight to a state would report `produced` for any process that happened to exit 0 —
 * a launcher that no-oped, a stub on PATH, a producer killed after it had already printed. So the
 * state is taken from the producer's own `--json` payload and the exit code is required to AGREE
 * with it; disagreement, an unparseable payload, a signal, or a timeout is `unresolved`.
 *
 * THERE IS NO `passed` MEMBER, FOR THE SAME REASON `GateOutcome` HAS NONE AND `consumed` WAS
 * REPLACED BY `exited-clean`. "I could not check" must not be spellable as "it passed". `produced`
 * is not a synonym for it either: it says a record was read that binds this exact diff and reads
 * PASS — a fact about an ARTIFACT, which is why it is the only state that can only come from one.
 *
 * `not-asked` IS A THIRD THING, NEVER FOLDED INTO `unresolved`. "The gate was not required, so
 * nothing was spent" and "the gate ran and established nothing" take opposite remedies, and a
 * total that mixes them tells an operator neither. Absence of the field entirely is a FOURTH fact —
 * a record written by a build that had no producer wired — and is likewise never any of these.
 */
export type VerdictProduction =
  | {
      /** Taken from the producer's payload, cross-checked against its exit code. */
      state: 'produced' | 'blocked' | 'not-required';
      /** The producer's own reason string, carried verbatim. */
      reason: string;
      /** The exit code that agreed with `state`. Present because agreement is the check. */
      exitCode: number;
      /** The subject the producer reported, when it reported one — evidence, not decoration. */
      subject?: string;
      /** The HEAD the producer read after the launch, when it reported one. */
      head?: string;
    }
  | {
      /** Nothing was established: the producer refused, was killed, or could not be read. */
      state: 'unresolved';
      reason: string;
      exitCode?: number;
      signal?: string;
    }
  | {
      /** This consumer never asked. `why` says which of the several reasons applied. */
      state: 'not-asked';
      why: string;
    }
  | {
      /**
       * A panel for THIS EXACT SUBJECT was already launched earlier in the same consumer run.
       *
       * ITS OWN STATE, NOT `not-asked`. Measured: 5 pending entries against one root and one diff
       * produced 5 observed producer invocations, because all three cost filters are PER ENTRY
       * while the thing being paid for is PER DIFF — and a panel ending REFUSED writes no binding
       * record, so the producer's own short-circuit (PRODUCED or BLOCKED only) does not catch the
       * second entry. That is precisely the case where the money was already spent.
       *
       * `not-asked` would have been wrong twice over: it already means "the gate did not require
       * this", and it would hide that a panel DID run for these bytes, one entry earlier.
       */
      state: 'already-launched';
      /**
       * The subject shared with the earlier entry, or `null` when no subject could be computed and
       * the run deduped by resolved tip instead.
       *
       * IT WAS TYPED `string` AND DOCUMENTED AS "the subject shared with the entry that did pay",
       * while the fallback path put a KEY in it — `<root>\0tip:<sha>`, which is not a subject and
       * never was. A field whose documentation is true on one branch is a field a reader is
       * entitled to misread on the other.
       */
      subject: string | null;
      /** The id of the entry that made the earlier attempt. Never this entry's own id. */
      firstEntryId: string;
      /**
       * What that earlier attempt established, so this record does not have to promise it.
       *
       * THE `why` USED TO ASSERT THREE THINGS IT COULD NOT KNOW — that a panel was launched, that
       * it produced an outcome, and that the earlier record carries one. With a producer that
       * throws on its first line, all three were false and the record said them anyway. Recording
       * the earlier STATE means the reader is told what happened instead of promised it.
       */
      firstState: VerdictProduction['state'];
      why: string;
    };

/**
 * Every state, from ONE table, for the same reason `DISPATCH_STATUS_KIND` is one table.
 *
 * `spend` says whether reaching this state can have cost a panel run (2.5–3.8M tokens, 40–50
 * minutes), and `satisfies` means a new state cannot be added without answering it.
 *
 * NOTHING READS THIS PROGRAMMATICALLY, AND THE SENTENCE HERE USED TO IMPLY OTHERWISE. It said the
 * marking "makes a run's total spend readable off the queue" — true only of a person opening the
 * file, because zero readers exist for the field in `server/` or anywhere else. It is a
 * documented invariant a future reader could total by hand, not a feature.
 */
const VERDICT_PRODUCTION_SPEND = {
  produced: 'maybe',
  blocked: 'maybe',
  'not-required': 'no',
  unresolved: 'maybe',
  'not-asked': 'no',
  // THIS ENTRY DID NOT PAY. An earlier entry in the same run did, and its record carries the
  // outcome. Marking it `'no'` is what makes a run's total spend readable off the queue.
  'already-launched': 'no',
} satisfies Record<VerdictProduction['state'], 'maybe' | 'no'>;

/** Every state this build knows, derived from the table above so a reader cannot drift from it. */
export const VERDICT_PRODUCTION_STATES = Object.keys(VERDICT_PRODUCTION_SPEND) as
  readonly VerdictProduction['state'][];

/**
 * The producer's four documented exit codes, and the state each one may confirm.
 *
 * AN ALLOW-LIST, NOT A SWITCH WITH A DEFAULT. `produce-verdict.mjs` documents
 * `PRODUCED 0 · BLOCKED 1 · REFUSED 2 · NOT_REQUIRED 3`, plus `64` for usage — and 64 is
 * deliberately outside the four so it can never be read as one. Anything not listed here (a spawn
 * failure, a signal, a future fifth code, `64`) is `unresolved`: this build does not know what it
 * means, and guessing in the direction of a pass is the one direction that must be impossible.
 */
const PRODUCER_EXIT_STATE = {
  0: 'produced',
  1: 'blocked',
  2: 'unresolved',
  3: 'not-required',
} as const satisfies Record<number, VerdictProduction['state']>;

/**
 * The producer's own name for each terminal state, which is what its payload carries.
 *
 * Two vocabularies, mapped in one place. The producer says `PRODUCED`/`BLOCKED`/`REFUSED`/
 * `NOT_REQUIRED`; the queue says `produced`/`blocked`/`unresolved`/`not-required`. `REFUSED` maps
 * to `unresolved` because that is what it means — "the gate ran and established nothing" — and
 * keeping the queue's word for it means a reader of a dispatch record never has to learn two.
 */
const PRODUCER_OUTCOME_STATE = {
  PRODUCED: 'produced',
  BLOCKED: 'blocked',
  REFUSED: 'unresolved',
  NOT_REQUIRED: 'not-required',
} as const satisfies Record<string, VerdictProduction['state']>;

/**
 * The bounds the producer's spawn is given — DECLARED HERE SO A DELETION GOES RED.
 *
 * Both were removable from the spawn call with the suite green at 126/0, which makes them
 * decoration rather than controls. They are values now, in a module a test imports, so removing
 * either from the call site breaks the reference and removing them from here fails an assertion.
 *
 * `timeoutMs` is DELIBERATELY LOOSER than the producer's own `--timeout` default of one hour: one
 * authority for the panel budget, and it is the producer's, so its bounded refusal — which carries
 * a reason — wins whenever it can. This is the outer backstop for a hang before that timer applies.
 *
 * `maxBufferBytes` is raised from Node's 1MB default because the payload carries the producer's
 * reason strings, which are long by design; an ENOBUFS there is safe (`unresolved`) but throws
 * away a panel run that had already been paid for.
 */
export const PRODUCER_SPAWN_LIMITS = {
  timeoutMs: 70 * 60 * 1000,
  maxBufferBytes: 16 * 1024 * 1024,
  /**
   * The bound for `verdict.mjs subject`, which is a hash of a diff and not a panel.
   *
   * ITS OWN NUMBER, because 70 minutes is the wrong bound for a 70-millisecond command — measured
   * at 74/71/67ms. A round that extracted these limits and added a test asserting the producer
   * spawn declares both then introduced a SECOND spawn with neither, which is the shape of every
   * control this repo has lost: the rule was written and the next call site did not get it.
   */
  subjectTimeoutMs: 60 * 1000,
} as const;

/** The completed spawn of the producer, normalised — the only input the classification reads. */
export interface ProducerRun {
  /** The exit code, or `null` when the process did not exit normally. */
  status: number | null;
  /** The signal that killed it, or `null`. Mutually exclusive with a meaningful `status`. */
  signal: string | null;
  /** A spawn-family error code (`ENOENT`, `ETIMEDOUT`, …), or `null` when the spawn itself worked. */
  spawnCode: string | null;
  /** Whatever the producer printed on stdout, however malformed. */
  stdout: string;
  /** The error message, when the spawn threw. */
  message?: string;
}

/**
 * Turn a completed producer run into a state — the whole of the caller's judgement, in one pure
 * function so that the consumer's shell code cannot quietly acquire a second opinion.
 *
 * THE ORDER OF THE CHECKS IS THE DESIGN. A signal or a spawn error is settled BEFORE stdout is
 * read, because a producer killed at 49 minutes may have already printed a payload describing a
 * state it had not yet reached, and a timeout that inherited that payload would report a spend as
 * a result. Then the payload is required, then the payload's outcome is required to be one of the
 * four, then the exit code is required to AGREE. Only a run that passes all four gets a state that
 * is not `unresolved`.
 */
export function classifyVerdictProduction(run: ProducerRun): VerdictProduction {
  if (run.signal) {
    // THE TIMEOUT LANDS HERE, NOT IN THE SPAWN-ERROR BRANCH BELOW. Node reports an `execFileSync`
    // timeout as a SIGTERM kill carrying `code: 'ETIMEDOUT'`, and testing `signal` first is what
    // makes "it was taken away" beat "it never started" — the right precedence, because a killed
    // producer may have printed a payload for a state it had not yet reached.
    const timedOut = run.spawnCode === 'ETIMEDOUT';
    return {
      state: 'unresolved',
      signal: run.signal,
      reason: timedOut
        ? `the producer exceeded its time budget and was killed by ${run.signal}; whatever it had printed describes a run that did not finish`
        : `the producer was killed by ${run.signal}; whatever it had printed describes a run that did not finish`,
    };
  }
  if (run.spawnCode) {
    // A TIMEOUT DOES **NOT** ARRIVE HERE, and this comment used to say it did. `execFileSync`'s
    // `timeout` kills the child, so Node sets BOTH `signal: 'SIGTERM'` and `code: 'ETIMEDOUT'` —
    // and `signal` is tested above, so a real timeout is settled there and never reaches this
    // branch. The old text described a shape Node does not produce, and the fixture that
    // "covered" it modelled the same impossible shape, so the pair agreed with each other and
    // with nothing else. What DOES arrive here is a spawn that never ran the program: ENOENT,
    // EACCES, ENOEXEC, E2BIG. Kept as a complement rather than an enumeration, for the reason
    // consume-dispatch.ts gives at its own spawn-error branch.
    return {
      state: 'unresolved',
      reason: `the producer could not be run to completion (${run.spawnCode}): ${run.message ?? 'no detail'}`,
      ...(typeof run.status === 'number' ? { exitCode: run.status } : {}),
    };
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(run.stdout) as Record<string, unknown>;
  } catch {
    return {
      state: 'unresolved',
      reason: `the producer printed no readable JSON, so its exit code is the only thing left and an exit code is not a verdict: ${run.stdout.slice(0, 200)}`,
      ...(typeof run.status === 'number' ? { exitCode: run.status } : {}),
    };
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      state: 'unresolved',
      reason: 'the producer printed JSON that is not an object, so no outcome could be read from it',
      ...(typeof run.status === 'number' ? { exitCode: run.status } : {}),
    };
  }
  const declared = payload.outcome;
  // LOOKED UP WITHOUT WIDENING, AND `tsc` IS WHAT SAID SO. Written first as
  // `(TABLE as Record<string, VerdictProduction['state']>)[declared]`, which types the result as
  // EVERY state including `not-asked` — a value this branch can never produce and the return type
  // below rightly refuses. `bun test` does not typecheck and would have shipped it; the cure is to
  // read the table through its own key type so the union stays as narrow as the table is.
  // OWN PROPERTY, NEVER `in`. `in` walks the prototype chain, so `{"outcome":"toString"}` found a
  // FUNCTION and skipped the "declares no outcome this build knows" branch — then failed the exit
  // cross-check instead, reporting a DISAGREEMENT where the truth is an unknown word. No bypass
  // (all 16 combinations still land `unresolved`) but the wrong diagnosis, which is what an
  // operator acts on. Same reading for the exit table below.
  const mapped = typeof declared === 'string'
    && Object.prototype.hasOwnProperty.call(PRODUCER_OUTCOME_STATE, declared)
    ? PRODUCER_OUTCOME_STATE[declared as keyof typeof PRODUCER_OUTCOME_STATE]
    : undefined;
  if (mapped === undefined) {
    return {
      state: 'unresolved',
      reason: `the producer's payload declares no outcome this build knows (${JSON.stringify(declared)}); known: ${Object.keys(PRODUCER_OUTCOME_STATE).join(', ')}`,
      ...(typeof run.status === 'number' ? { exitCode: run.status } : {}),
    };
  }
  // KEPT, AND INERT TODAY — stated rather than implied. Reverting this half to `in` is provably
  // equivalent while the keys are the numbers 0–3: no prototype member coerces to "0".."3", so
  // there is no input that separates them and no test can fail for it. It is symmetry with the
  // outcome table above, where the same change IS falsifiable and its test fires, kept so the two
  // lookups cannot drift if this table ever gains a string key. It prevents nothing right now.
  const expected = typeof run.status === 'number'
    && Object.prototype.hasOwnProperty.call(PRODUCER_EXIT_STATE, run.status)
    ? PRODUCER_EXIT_STATE[run.status as keyof typeof PRODUCER_EXIT_STATE]
    : undefined;
  if (expected === undefined || expected !== mapped) {
    // THE CROSS-CHECK, AND IT IS THE POINT OF THE WHOLE FUNCTION. Two independent statements about
    // one run — a payload and an exit code — must agree, or this build knows less than either of
    // them claims. A payload saying PRODUCED behind an exit code that does not mean PRODUCED is
    // the exact shape a stub, a truncated write or a wrapper script produces.
    return {
      state: 'unresolved',
      reason: `the producer's payload says ${String(declared)} and its exit code ${String(run.status)} says ${expected ?? 'nothing this build knows'} — two statements about one run, disagreeing`,
      ...(typeof run.status === 'number' ? { exitCode: run.status } : {}),
    };
  }
  const reason = typeof payload.reason === 'string' ? payload.reason : 'the producer gave no reason';
  if (mapped === 'unresolved') {
    return { state: 'unresolved', reason, exitCode: run.status as number };
  }
  const subject = typeof payload.subject === 'string' ? payload.subject : undefined;
  const head = typeof payload.head === 'string' ? payload.head : undefined;
  return {
    state: mapped,
    reason,
    exitCode: run.status as number,
    ...(subject === undefined ? {} : { subject }),
    ...(head === undefined ? {} : { head }),
  };
}

/**
 * How a dispatch was launched — the routing decision, recorded rather than inferred.
 *
 * `bare-print` is what every dispatch before 2026-08-28 used: `claude --print <goal>`, a model
 * session in a project directory that reached no orchestrator, no playbook and no lens. It is kept
 * as a NAMED value rather than deleted, because entries written by that build exist in real queues
 * and a reader must be able to tell them apart from a routed one. It is not a value this build
 * writes.
 */
export type DispatchRoute = 'orchestrator-playbook' | 'bare-print';

/**
 * What is known about the QA gate for one dispatch — AND WHAT THIS UNION DELIBERATELY CANNOT SAY.
 *
 * THERE IS NO `passed` MEMBER, AND ITS ABSENCE IS THE MECHANISM. The failure this closes is
 * "looks gated, wasn't", which is strictly worse than "not gated" because the second is visible.
 * A record that could express a pass would eventually carry one written by a build that had not
 * checked; a union with no such member cannot, in any code path, present or future, without a
 * type change that a reviewer sees.
 *
 *   `unreachable`  — derived, not assumed: the agent this dispatch launched does not declare the
 *                    tool through which `qa.js` is invoked, so no session under it could have run
 *                    the gate. Positive knowledge that the gate did not run.
 *   `unverified`   — the agent COULD reach the gate, and this consumer did not observe a verdict.
 *                    The launch is out of process; the consumer sees an exit code and nothing else.
 *                    Ignorance, stated as ignorance.
 *   `underivable`  — the derivation itself failed (no agent file, no `tools:` line). Distinct from
 *                    `unreachable` on purpose: "I checked and it cannot" is not "I could not check",
 *                    and a resolver never passes what it could not check.
 *
 * WHY `unverified` IS NOT REDUNDANT, WHICH IS THE ONE THING A READER WILL DOUBT. It looks like the
 * state that never happens: if an agent declares the gate tool, surely it has it. It does not
 * follow. A DECLARED `tools:` LIST IS AN UPPER BOUND ON THE DELIVERED SET, NOT THE SET.
 *
 * That asymmetry is what makes each member sound in its own direction:
 *
 *   · `unreachable` is sound because the bound holds downward — a tool ABSENT from the declaration
 *     cannot be delivered, so "no `Workflow` declared" really is "the gate could not have run".
 *   · `unverified` is sound because the bound does NOT hold upward — a tool PRESENT in the
 *     declaration may still not arrive, so "the gate is reachable" was never something this
 *     consumer could assert. It reports that it observed no verdict, which is all it knows.
 *
 * MEASURED, AND NOT BY THIS LANE — 2026-08-28, `claude 2.1.246`, recorded in
 * `docs/08-agents_work/sessions/2026-08-28-builder-probe-agent-tool-inheritance.md` with the probe
 * at `scripts/probe-agent-tool-inheritance.mjs`. F8: this read "the #122 reviewer" with no path,
 * and an attribution is not a citation — `check-citations.mjs` blocks on existence, and a name
 * cannot be resolved by it. Declared →
 * advertised at init: orchestrator 7 → 5, builder 6 → 4, reviewer 4 → 2, sourcer 5 → 5. `Glob` and
 * `Grep` are dropped exactly when `Bash` is declared beside them, and sourcer is the control: it
 * declares no `Bash` and loses nothing. The declared column is re-derived from the agent files in
 * this repo; the advertised column is that reviewer's measurement and is NOT re-derived here.
 *
 * DO NOT READ THAT AS PESSIMISM ABOUT `Workflow` SPECIFICALLY — it is not in the dropped class.
 * The same probe ran the arm (`scripts/probe-agent-tool-inheritance.mjs`):
 * `[Read, Bash, Workflow]` → `[Read, Bash, Workflow]`, kept, against
 * `[Read, Glob]` + `Bash` → `[Read, Bash]`. Same declared change, opposite outcomes.
 *
 * AND YET `unverified` STILL STANDS, for a reason worth stating precisely: that observation is
 * INLINE — a tool set supplied directly — and no agent FILE declaring `Workflow` has been observed
 * at all, because none exists to observe (0 of 7 declare it; control, 7 of 7 declare `Read`). The
 * path this function reads is the file path. So "a declaration would be delivered" is established
 * for the inline case and OPEN for the one that would actually flip this value, which is exactly
 * the shape of knowledge `unverified` exists to carry.
 *
 * F6 — AND `unverified` IS NOT MERELY UNOBSERVED THROUGH THAT PATH. IT IS REFUSED. A blocking lint
 * rule, `PS-WORKFLOW-CONTAINMENT` in `.claude/hooks/schema-lint.js`, fails any agent file declaring
 * `Workflow`. Measured by mutation on this tree: granting it to `orchestrator.md` takes the linter
 * from `18 pass · 0 fail · 0 warnings, exit 0` to `17 pass · 1 fail · 0 warnings, exit 1`. So the
 * comment elsewhere in this repo calling the grant "the one edit that would close this" understates
 * it: today that edit does not merely await a founder decision, it fails a green blocking check.
 *
 * AND THAT RULE'S STATED REASON IS DENTED BY THE VERY CHANGE THIS FILE IS PART OF — dented in one
 * named place, which is all its premise can survive. It refuses the declaration because "the
 * orchestrator is not dispatched — it IS the session, so NO FIELD in this frontmatter is read on
 * the path it runs on." A universal negative needs one counterexample, and `tools:` is one:
 * measured at `claude 2.1.246` by `scripts/probe-agent-tool-inheritance.mjs`, recorded in
 * `docs/08-agents_work/sessions/2026-08-28-builder-probe-agent-tool-inheritance.md`, a session
 * launched as `--agent orchestrator` advertises 5 tools at init where a bare session advertises 41,
 * with a differential arm on `reviewer-readonly` showing neither figure is a fallback.
 *
 * SAY `tools:`, NOT "the frontmatter". THE BROADER SENTENCE IS NOT MEASURED AND THIS FILE HEDGES IT
 * TWICE ELSEWHERE — the agent-FILE path is called OPEN above, and `maxTurns` on the CLI `--agent`
 * path is called UNMEASURED at `readDeclaredMaxTurns`. "Every field binds" would contradict both,
 * from the same file, about the same path. The narrow claim is the one that survives, and it is
 * enough: Nothing here touches `schema-lint.js`, so nothing goes red — THE RULE KEEPS PASSING WHILE
 * THE PREMISE UNDER IT HAS A MEASURED COUNTEREXAMPLE.
 * Which of the two files is wrong is a founder decision, not this consumer's — recorded so that a
 * reader of the promise above learns the obstacle is a live check and not only an unmade decision.
 */
export type GateOutcome = 'unreachable' | 'unverified' | 'underivable';

/** Every gate outcome this build knows, derived from one place so a reader cannot drift from it. */
export const GATE_OUTCOMES = ['unreachable', 'unverified', 'underivable'] as const satisfies readonly GateOutcome[];

/** What was derived about the gate, with the evidence that produced it. */
export interface GateRecord {
  outcome: GateOutcome;
  /** Why this outcome, in the operator's terms — never the only record of it. */
  why: string;
  /** The agent whose declaration was read. Absent only when no agent was selected. */
  agent?: string;
  /** The tools that agent declares, as parsed. Present when the `tools:` line was readable. */
  tools?: string[];
}

/**
 * The tool through which `qa.js` — the binding QA gate — is invoked.
 *
 * Named once, here, because the derivation below and every comment that explains it must agree.
 */
export const GATE_TOOL = 'Workflow';

/**
 * The `tools:` list out of an agent file's frontmatter — BOTH legal YAML spellings, or `null`.
 *
 * F2. THIS READ ONE OF TWO BLESSED SPELLINGS AND SILENTLY DOWNGRADED THE OTHER. The original
 * accepted only the flow form, `tools: [Read, Bash]`. YAML's block sequence is exactly equivalent
 * and `schema-lint` accepts it — it asserts only `Array.isArray(fm.tools)`, and a block sequence
 * parses to an array. Measured on one file with `tools:` rewritten as a block sequence:
 * `schema-lint` 18 pass · 0 fail · 0 warnings, and this function returned `underivable`. **A
 * stylistic reformat, valid and lint-clean, degraded the derivation** — and through the prompt it
 * would then have told the session something false about the gate.
 *
 * IT IS NOT A THIS-REPO PROBLEM. `deriveGateReachability` takes a `root`, so a Phase-9 target that
 * writes its frontmatter the other legal way lands here on its first dispatch.
 *
 * WHY THE FIXTURE COULD NOT HAVE CAUGHT IT: `installHarness` writes `tools: ${tools}` and every
 * table entry was flow-form, so the parser and the fixture shared one assumption. The tests now
 * drive both spellings through the same table.
 *
 * ANCHORED TO THE FRONTMATTER, NOT THE FILE. The old regex scanned the whole document with `/m`, so
 * a line beginning `tools:` anywhere in the body would have been read as the declaration. This
 * reads only between the opening `---` and the closing one.
 *
 * DECLARE WHAT IS READ AND REFUSE THE REST. Two spellings are understood; anything else returns
 * `null`, which the caller reports as `underivable` — "I could not check" — rather than as an
 * empty grant list, which would read as "declares nothing" and produce a confident wrong answer.
 */
export function parseToolsDeclaration(text: string): string[] | null {
  // EVERY CAPTURE IS CHECKED FOR `undefined`, and that is not ceremony under this tsconfig:
  // `noUncheckedIndexedAccess` types `m[1]` as `string | undefined`, and `bun test` does not
  // typecheck — only `tsc --noEmit` does. Five errors of exactly this shape reached CI green-looking
  // locally because the suite passed. An unchecked capture would also be a REAL bug the day a regex
  // is edited to make the group optional.
  const fm = /^---\r?\n([\s\S]*?)\r?\n---\s*$/m.exec(text);
  const body = fm?.[1];
  if (body === undefined) return null;

  // Spelling 1 — flow sequence on one line: `tools: [Read, Bash]`
  const flow = /^tools:[ \t]*\[([^\]]*)\][ \t]*$/m.exec(body)?.[1];
  if (flow !== undefined) return splitItems(flow.split(','));

  // Spelling 2 — block sequence: `tools:` then `  - Read` lines. The key must carry NOTHING after
  // the colon; `tools: Read` is a scalar, not a list, and is refused rather than read as one item.
  const block = /^tools:[ \t]*(?:#[^\n]*)?\r?\n((?:[ \t]+-[^\n]*\r?\n?)+)/m.exec(body)?.[1];
  if (block !== undefined) {
    const items = block.split(/\r?\n/).filter((l) => /\S/.test(l)).map((l) => l.replace(/^[ \t]+-[ \t]*/, ''));
    return splitItems(items);
  }
  return null;
}

/** Trim, strip one layer of matching quotes, drop empties. Shared so both spellings normalise identically. */
function splitItems(raw: string[]): string[] {
  return raw
    .map((t) => t.trim().replace(/^(["'])([\s\S]*)\1$/, '$2').trim())
    .filter(Boolean);
}

/**
 * The `maxTurns` an agent file declares, or `null` if it declares none this parser can read.
 *
 * WHY IT IS RECORDED AT ALL. Routing a dispatch through `--agent <name>` makes the agent file's
 * frontmatter bind, and `bin/warroom`'s bare `claude` reads none of it — so a turn cap that was
 * inert on the old path is live on the new one. A reader looking at an `exited-clean` entry and
 * asking "did this stop because it was done, or because it ran out?" cannot answer from the exit
 * code, and this at least tells them what limit was in force.
 *
 * IT IS NOT EVIDENCE THAT THE CAP FIRED, and must never be presented as such. Whether the CLI
 * `--agent` flag enforces `maxTurns` the way an `Agent`-tool dispatch does is UNMEASURED — the
 * ledger's claim for the sibling behaviour records the same bound, that it measured the Agent tool
 * path only. The CLI path is a third path and neither measured it.
 */
export function parseMaxTurns(text: string): number | null {
  const body = /^---\r?\n([\s\S]*?)\r?\n---\s*$/m.exec(text)?.[1];
  if (body === undefined) return null;
  const digits = /^maxTurns:[ \t]*(\d+)[ \t]*$/m.exec(body)?.[1];
  return digits === undefined ? null : Number(digits);
}

/** The declared `maxTurns` for an agent in a project, or `null` when unreadable or undeclared. */
export function readDeclaredMaxTurns(root: string, agent: string): number | null {
  try {
    return parseMaxTurns(fs.readFileSync(path.join(root, '.claude', 'agents', `${agent}.md`), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Does the agent this dispatch will launch declare the gate tool? Read it; do not assume it.
 *
 * WHY DERIVED AND NOT A CONSTANT. A constant saying "the orchestrator cannot reach the gate" is
 * true today and becomes a lie the day someone adds `Workflow` to that file — silently, in the
 * direction that manufactures a false negative. Reading the declaration means the recorded value
 * changes by itself when the grant changes, and the record stays true without anyone maintaining it.
 *
 * THE PARSE IS THE `tools:` LINE, NOT THE FILE. Measured 2026-08-28 in this repo: the word
 * `Workflow` appears in the BODY of all 7 of 7 engine files and in the `tools:` declaration of
 * ZERO of them. A `grep -l Workflow .claude/agents/` therefore reports every engine as gate-capable
 * — the exact false negative this function exists to avoid — so matching is on whole tokens split
 * out of the frontmatter list, never on a substring of the file.
 *
 * FAILURE IS A NAMED STATE, NOT A DEFAULT. Every path that could not complete the derivation
 * returns `underivable` carrying the reason, so an unreadable agent file can never be mistaken for
 * a checked one.
 */
/**
 * THIS FUNCTION HANDLES NO REF, AND THE NOTE IS HERE BECAUSE TWO BRIEFS SAID IT DID.
 *
 * A routed item twice attributed to `deriveGateReachability` the defect *"records the router's
 * top-level `ref`, which can carry a symbolic tip."* The defect is REAL. It is not here, and it
 * could not be: this reads `<root>/.claude/agents/<agent>.md`, parses one `tools:` line, and
 * returns a `GateRecord` — which has no ref field. Both call sites pass `(entry.root, agent)`.
 * Measured on the whole body: zero `ref`, `git` or `rev-parse` tokens, against 18 `ref` hits
 * elsewhere in this file as the control that the search works.
 *
 * THE REAL SITE IS `routeGate` IN `mission-control/scripts/consume-dispatch.ts`, which reads the
 * router's JSON. Fixed there — see `GateRouting.refTip`. Measured, both arms:
 * `--ref origin/main...feat/x` emits a SYMBOLIC top-level `ref` beside a RESOLVED
 * `invocation.args.ref`; the default path emits both resolved, which is why reading the top-level
 * field alone looked correct.
 *
 * A probe selecting on THIS symbol therefore returns ~zero whether or not the defect is fixed — it
 * finds only the import line as diff context. Select on `refTip` or `verdictRef` instead.
 */
export function deriveGateReachability(root: string, agent: string): GateRecord {
  const file = path.join(root, '.claude', 'agents', `${agent}.md`);
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    return { outcome: 'underivable', agent, why: `could not read ${file}: ${(err as Error).message}` };
  }
  const tools = parseToolsDeclaration(text);
  if (tools === null) {
    return { outcome: 'underivable', agent, why: `${file} declares no frontmatter \`tools:\` list this parser can read, so its grants cannot be determined` };
  }
  if (tools.includes(GATE_TOOL)) {
    return {
      outcome: 'unverified',
      agent,
      tools,
      why: `${agent} declares ${GATE_TOOL}, so the gate is REACHABLE — but this consumer launches out of process and observed no verdict, so it does not claim one ran`,
    };
  }
  return {
    outcome: 'unreachable',
    agent,
    tools,
    why: `${agent} declares [${tools.join(', ')}] and not ${GATE_TOOL}, through which qa.js is invoked — no session under it could have run the gate`,
  };
}

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
  /**
   * The pid of the consumer that wrote the `running` line.
   *
   * Present so a SECOND consumer can tell "the launcher died" from "the launcher is still going",
   * instead of stamping `no-result` on a dispatch that is running fine. Absent on entries written
   * before this field existed, and absence is treated as "no longer running" — the same reading
   * those entries already got.
   */
  consumerPid?: number;
  /**
   * How this dispatch was launched. ABSENT MEANS `bare-print`, and that reading is deliberate:
   * every entry written before routing existed was launched that way, so absence is a known fact
   * about those entries rather than a gap.
   */
  route?: DispatchRoute;
  /**
   * What is known about the QA gate for this dispatch. ABSENT MEANS UNKNOWN — never "passed", and
   * the type on the other side of this field cannot say "passed" either. A reader that finds no
   * `gate` is looking at a record written by a build that did not derive one, which is a different
   * fact from any of the three outcomes and must not be folded into them.
   */
  gate?: GateRecord;
  /**
   * The playbooks the consumer offered the orchestrator to choose from, as filenames.
   *
   * WHAT THIS IS AND IS NOT EVIDENCE OF. It records what was OFFERED, which the consumer knows.
   * Which one was SELECTED happens inside the launched session and is not observable from here, so
   * it is not recorded — writing a selected playbook the consumer never saw would be the same
   * class of defect as writing a gate verdict it never saw.
   */
  playbooksOffered?: string[];
  /**
   * What the repo's own gate router decided about the work this dispatch produced.
   *
   * ABSENT MEANS THE ROUTER WAS NEVER ASKED — a different fact from `{decided: false}`, which means
   * it was asked and could not answer. Neither is ever a pass.
   */
  gateRouting?: GateRouting;
  /**
   * The `maxTurns` the launched agent's file declares, or `null` when it declares none.
   *
   * CONTEXT FOR AN `exited-clean`, NOT A DIAGNOSIS OF ONE. Absent means this build did not read it.
   */
  declaredMaxTurns?: number | null;
  /**
   * What came back when this consumer asked the repo's producer to produce a verdict.
   *
   * ABSENT MEANS NO PRODUCER WAS WIRED when this line was written — a fact about the BUILD, not
   * about the dispatch, and different from every state the field can hold. `{state: 'not-asked'}`
   * means this build had a producer and decided not to spend it, and says which reason applied.
   * Neither is ever a pass, and neither may be read as one.
   *
   * THAT SENTENCE WAS BRIEFLY FALSE AND IS TRUE AGAIN. Writing the terminal record before the
   * verdict step left a durable line with this field absent, so absence also meant "a panel may
   * have run and its outcome was lost" — two facts in one representation, introduced by the fix
   * that reordered the writes. Every line this build emits after a launch now carries the field,
   * starting with an explicit `unresolved` written before the producer returns, so absence is once
   * more a statement about the build alone.
   */
  verdictProduction?: VerdictProduction;
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

/** What a consumer may do with each dispatch, decided by ALLOW-LIST. */
export interface DispatchWork {
  /** `pending` — never launched. The ONLY class a consumer may launch. */
  launchable: DispatchEntry[];
  /** `running` — launched by a run that has not reported back. Owed a verdict, never a relaunch. */
  reconcilable: DispatchEntry[];
  /** Terminal. Nothing is owed. */
  settled: DispatchEntry[];
  /**
   * A status THIS BUILD DOES NOT KNOW. Not launched, not reconciled, NOT OVERWRITTEN — reported,
   * and left exactly as found.
   */
  unrecognised: DispatchEntry[];
}

/**
 * Sort dispatches into what may be done with them, by naming what is allowed.
 *
 * THE PREDICATE IS AN ALLOW-LIST AND THE DIRECTION IS THE WHOLE POINT. This replaced
 * `unfinishedDispatches()`, which asked `!TERMINAL.includes(status)` — a deny-list, so an
 * unrecognised status meant "launch it". See KNOWN_DISPATCH_STATUSES for the measured table.
 *
 * AN UNRECOGNISED ENTRY IS LEFT ALONE, WHICH IS THE CONSERVATIVE CHOICE IN BOTH DIRECTIONS. It is
 * not launched, because this build cannot know whether the goal already ran. It is not rewritten,
 * because whatever wrote that status knew something this build does not, and overwriting it would
 * destroy the only record of it. Reporting is the only safe action, so it is the only one taken.
 */
export function classifyDispatches(entries: DispatchEntry[]): DispatchWork {
  const work: DispatchWork = { launchable: [], reconcilable: [], settled: [], unrecognised: [] };
  for (const e of resolveDispatchStates(entries)) {
    // A LOOKUP, NOT A CHAIN ENDING IN `else`. The previous version fell through to `settled`,
    // which is a second unnamed deny-list: a status added to the union and to the known list but
    // given no branch would have been silently stranded as "nothing owed" — fail-closed, so safe,
    // but silent, and it would have got none of the loud reporting `unrecognised` gets. Here an
    // unmapped status is `undefined` and lands in `unrecognised`, where it is reported.
    const kind = (DISPATCH_STATUS_KIND as Record<string, string | undefined>)[e.status as string];
    if (kind === 'launchable') work.launchable.push(e);
    else if (kind === 'reconcilable') work.reconcilable.push(e);
    else if (kind === 'settled') work.settled.push(e);
    else work.unrecognised.push(e);
  }
  return work;
}
