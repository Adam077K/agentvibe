// server/collectors/conflicts.ts — cross-worktree file-conflict map for one project.
//
// Per docs/03-system-design/AGENT-SYSTEM-REBUILD.md §3.9, Conflicts reads "git for
// worktrees and conflicts". First-pass signal, real and computable without a second
// source of truth: for every swept worktree, the files it has uncommitted changes to
// (`git status --porcelain`); a file touched by more than one worktree at once is a
// conflict-in-waiting — two agents are about to fight over it at merge time. This does
// not (yet) catch two worktrees that both committed non-overlapping-in-time changes to
// the same file with no uncommitted state left; that needs a merge-base diff and is next.
//
// THREE DEFECTS THIS FILE SHIPPED WITH, all fixed here, all the same shape as the nine in
// PHASE-8A-HANDOFF.md §0 — a mechanism reporting success about something it did not measure.
//
// 1. THE SWEEP WAS SYNCHRONOUS. `execFileSync` per worktree, on Bun's single JS thread.
//    Measured on this machine 2026-08-13, through the real route: 21,079 ms cold / 17,007 ms
//    warm across 285 worktrees. For every one of those seconds the event loop was blocked,
//    so the SSE tick stopped for EVERY connected client — a control plane freezing itself
//    while reporting on other people's work. Now async, and the per-worktree calls run
//    concurrently within a project.
//
// 2. `catch { return [] }` REPORTED "NO CHANGED FILES" WHEN IT MEANT "I COULD NOT LOOK."
//    A pruned, vanished or unreadable worktree rendered as CLEAN — indistinguishable from a
//    worktree genuinely holding no edits, and the clean answer is the one nobody
//    investigates. Now three-state, modelled exactly on server/collectors/empty.ts's
//    handling of grep's exit 2: success → files; failure → whatever files were recoverable
//    from the partial stdout, PLUS `readable: false` and a `reason`. The view renders
//    could-not-look differently from clean.
//
// 3. THE SWEEP WAS UNSCOPED. It took every non-main worktree on the machine — 285 of them,
//    across 19 projects, of which only 30 were ever started by an agent (evalove alone
//    carries 105 hand-made ones). Now scoped to worktrees the project's own
//    `.worktrees/.registry` knows about, skipping prunable ones. NARROWING IS VISIBLE, NEVER
//    SILENT: `excluded` carries the count and the reason, the view renders it under the
//    header, and both numbers come from ONE pass over ONE array — the §0 corollary the Fleet
//    headline violated when it rendered "2 of 11" for an answer of 4.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Project } from '../projects.ts';
import { listWorktreesAsync, type Enumeration, type WorktreeEntry } from './worktrees.ts';

// The promisified callback form. NO SHELL: the binary is a literal and every argument is a
// separate array element, exactly as the sync form this replaced. `promisify` is applied
// once, at module scope, rather than wrapping each call in a new Promise — a hand-rolled
// wrapper is where the error's own `stdout` gets dropped, and that stdout is the partial
// result defect 2 exists to preserve.
const execFileAsync = promisify(execFile);

/**
 * Per-worktree ceiling. `git status --porcelain` in a worktree with a large untracked tree
 * can exceed Node's 1 MB default, and a hung filesystem can hang the call forever — either
 * one would take out the route. Both are handled as failures with a reason rather than as an
 * empty answer, so an overflow reports the files it did recover AND `readable: false`.
 */
const STATUS_MAX_BUFFER = 8 * 1024 * 1024;
const STATUS_TIMEOUT_MS = 10_000;

/**
 * The exact argv of the sweep's `git status`, EXPORTED so the tests assert against the same
 * array the collector runs rather than a copy of it that agrees today.
 */
export const STATUS_ARGV = ['--no-optional-locks', 'status', '--porcelain'] as const;

/**
 * `core.quotePath=true` forced onto git THROUGH THE ENVIRONMENT, and the spelling is not a
 * preference.
 *
 * The obvious form passes the config as a command-line override before the subcommand, and
 * that is what the review asked for. It cannot be used here. `test/crosscheck.test.ts` greps
 * `server/**` for a quoted run-this-string flag in any spawn, because a synchronous spawn of
 * `bash` with exactly that flag, over a string built from a directory name, was a REAL
 * command-injection RCE in this codebase — found live 2026-08-13 in collectors/empty.ts. A text
 * grep cannot tell git's config override from a shell's, and the right response is not to teach
 * a security guard an exception so this file can use the prettier spelling.
 *
 * `GIT_CONFIG_COUNT` TRIPS NO SUCH PATTERN, AND ITS PRECEDENCE IS NOT IDENTICAL. An earlier
 * version of this comment said it was — git's own wording is "the same as using the override on
 * the command line" — and that is true against every config a *user edits* and false against the
 * one that arrives by INHERITANCE. Measured, on a repo whose local config turns quoting off:
 *
 *   COUNT pairs alone                        -> "\302\240nbsp-lead.ts"   override wins
 *   COUNT pairs + GIT_CONFIG_PARAMETERS      ->  \302\240 raw            OVERRIDE LOSES
 *   command-line form + PARAMETERS           -> "\302\240nbsp-lead.ts"   wins
 *   PARAMETERS with ours APPENDED            -> "\302\240nbsp-lead.ts"   wins
 *
 * Git reads `GIT_CONFIG_PARAMETERS` AFTER the COUNT pairs, and it EXPORTS that variable into
 * every child of a command-line override — and into aliases, hooks, `rebase -x`, `bisect run`
 * and `submodule foreach`. Since the sweep spreads `...process.env`, Mission Control run from
 * inside a hook would silently lose its own override. Not exotic; inherited.
 *
 * So the setting is APPENDED to whatever `GIT_CONFIG_PARAMETERS` already holds, which puts it
 * last in the list git reads last. A FUNCTION rather than a constant because it has to read the
 * ambient value at call time: a module-level object would freeze whatever was set at import,
 * which is the same divergence in a slower form.
 *
 * VERIFIED to beat a repo-local `core.quotePath=false`, a hostile `GIT_CONFIG_GLOBAL`,
 * `GIT_CONFIG_SYSTEM`, and an inherited hostile `GIT_CONFIG_PARAMETERS`.
 */
export function statusConfigEnv(ambient: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const ours = ["'core.quotePath=true'", "'status.showUntrackedFiles=normal'"].join(' ');
  const existing = ambient.GIT_CONFIG_PARAMETERS;
  return {
    // Kept as well as the append: these lose to PARAMETERS but beat everything else, so on a
    // git too old to read PARAMETERS the override still binds. Belt AND braces, cheaply.
    GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0: 'core.quotePath',
    GIT_CONFIG_VALUE_0: 'true',
    // `status.showUntrackedFiles=no` SURVIVED THE QUOTING OVERRIDE and produced a SILENT MISS:
    // the untracked file vanished from the sweep with `readable: undefined` — a clean read
    // reported over a population git had been told not to look at. That is worse than the
    // fabrication this file was opened to fix, because absence is the answer nobody
    // investigates. Executed: 0 records with it set, 1 with this forced.
    GIT_CONFIG_KEY_1: 'status.showUntrackedFiles',
    GIT_CONFIG_VALUE_1: 'normal',
    GIT_CONFIG_PARAMETERS: existing ? `${existing} ${ours}` : ours,
  };
}

export interface WorktreeChanges {
  path: string;
  branch: string | null;
  changedFiles: string[];
  /**
   * Present and `false` only when git could not be run or read there — never omit this to
   * let an empty `changedFiles` stand in for "I could not look" as though it meant "I looked
   * and found nothing". Absent (undefined) means the sweep ran to completion and
   * `changedFiles` is the real answer. Same contract, same wording, as EmptyState.readable.
   */
  readable?: boolean;
  /** Set alongside `readable: false` — why the sweep could not check. */
  reason?: string;
}

export interface FileConflict {
  file: string;
  worktrees: { path: string; branch: string | null }[];
}

/** What the sweep deliberately did not look at, and why. Rendered, never silent. */
export interface ExcludedWorktrees {
  count: number;
  reason: string;
}

export interface ConflictReport {
  project: string;
  worktrees: WorktreeChanges[];
  conflicts: FileConflict[];
  excluded: ExcludedWorktrees;
  /**
   * Whether `git worktree list` could enumerate this project at all.
   *
   * WITHOUT THIS, THE NARROWING MECHANISM ITSELF LIES. listWorktrees returned `[]` on a real
   * git failure, so an orphaned worktree pointing at a deleted gitdir produced
   * `{worktrees: [], excluded: {count: 0}}` — and the view rendered a measured all-clear over
   * a population git had refused to enumerate, with "0 of 0 not swept" underneath it. The
   * guarantee that narrowing is never silent was itself silent about the one case where the
   * whole list is unknown. §0's single-point-fix pattern, live: the three-state was correct
   * about the hole it was shown and left one a level up.
   */
  enumerated: Enumeration;
}

/**
 * Decodes one C-quoted path exactly as git writes it (`quote.c:quote_c_style`).
 *
 * OCTAL ESCAPES ARE BYTES, NOT CHARACTERS, and that is why this accumulates a byte array and
 * decodes once at the end rather than appending per escape. `é` reaches us as `\303\251` —
 * two escapes for the two bytes of one UTF-8 code point — so decoding each in isolation
 * yields `Ã©`, which names a file that does not exist. That is the same defect one level down.
 *
 * ITERATED BY CODE POINT, NOT BY CODE UNIT, AND THAT IS LOAD-BEARING WHENEVER A RAW NON-ASCII
 * CHARACTER ARRIVES. `core.quotePath=false` — a config any user can set globally or per repo —
 * makes git emit non-ASCII RAW while still quoting for spaces, quotes, backslashes and control
 * characters, so a quoted body can contain a literal astral character. Indexing a JS string
 * hands back one UTF-16 code unit, which for `🔥` is a LONE SURROGATE, and encoding a lone
 * surrogate yields `EF BF BD` — U+FFFD. Measured through `changedFilesFor`, `readable ===
 * undefined`, nothing truncated: `"fire 🔥 space.ts"` came back as `"fire �� space.ts"` and 3 of
 * 6 paths did not exist. That is this file's own fabrication defect, one level further down.
 *
 * `Array.from` splits on code points, so an astral character is ONE element and survives. Every
 * escape git emits is ASCII, so index arithmetic over that array is still exact.
 *
 * THE CALLER ALSO FORCES `core.quotePath=true` (see statusConfigEnv — through the environment,
 * not the command line), and the redundancy is deliberate rather than
 * belt-and-braces theatre: the forced config decides what the parser RECEIVES, this decides what the
 * parser DOES with what arrives. They fail for different reasons — the flag to a future edit of
 * the argv, this to a future edit of the loop — so neither one alone is the guarantee.
 *
 * A path that is not valid UTF-8 is the documented limit here, not an oversight: it decodes
 * with U+FFFD and will not match on disk. Node's string-based `fs` API cannot address such a
 * file at all without Buffer paths, so there is no string this could return that would be
 * more correct. WORTH KNOWING, because the consequence is larger than a missing file: two
 * DISTINCT invalid names both decode to U+FFFD, and `byFile` below keys on the decoded string
 * with no dedupe, so they merge into a single rendered conflict — which can show one worktree
 * conflicting with ITSELF. Unreachable on APFS, which rejects invalid UTF-8 filenames with
 * EILSEQ (executed); reachable on Linux, where the kernel takes any byte sequence. Not fixed
 * here: dedupe would hide the collision rather than report it, and the honest repair is a
 * Buffer-keyed path type, which is a larger change than this file.
 */
function unquoteCStyle(token: string): string {
  const body = token.length >= 2 && token.endsWith('"') ? token.slice(1, -1) : token.slice(1);
  const bytes: number[] = [];
  const encoder = new TextEncoder();
  const pushLiteral = (s: string) => {
    for (const b of encoder.encode(s)) bytes.push(b);
  };
  const SIMPLE = new Map<string, number>([
    ['a', 0x07],
    ['b', 0x08],
    ['t', 0x09],
    ['n', 0x0a],
    ['v', 0x0b],
    ['f', 0x0c],
    ['r', 0x0d],
    ['"', 0x22],
    ['\\', 0x5c],
  ]);

  const chars = Array.from(body); // code points — an astral character is one element, not two
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (ch !== '\\') {
      pushLiteral(ch);
      continue;
    }
    const next = chars[++i];
    if (next === undefined) {
      bytes.push(0x5c); // a trailing backslash git never emits — kept, never dropped
      break;
    }
    const simple = SIMPLE.get(next);
    if (simple !== undefined) {
      bytes.push(simple);
      continue;
    }
    if (next >= '0' && next <= '7') {
      let oct = next;
      while (oct.length < 3) {
        const peek = chars[i + 1];
        if (peek === undefined || peek < '0' || peek > '7') break;
        oct += peek;
        i++;
      }
      bytes.push(parseInt(oct, 8) & 0xff);
      continue;
    }
    pushLiteral(next); // unknown escape: keep the character rather than invent or drop one
  }
  // `ignoreBOM: true` IS NOT ABOUT IGNORING A BOM — the flag is named backwards. False, the
  // default, makes the decoder STRIP a leading U+FEFF; true makes it keep it as a character.
  // A filename may legitimately begin with U+FEFF, and stripping it renames the file:
  // `"\357\273\277bom-lead.ts"` decoded to `bom-lead.ts`, which does not exist. Measured
  // through changedFilesFor with the forced config active: 4 parsed, 2 MISSING. A BOM in the
  // MIDDLE always survived, which is exactly what makes it easy to miss.
  return new TextDecoder('utf-8', { ignoreBOM: true }).decode(new Uint8Array(bytes));
}

/**
 * Reads ONE path field starting at `i` — quoted or bare — decoded, with the index past it.
 *
 * THE ARROW CANNOT BE FOUND BY SEARCHING FOR IT, which is exactly what the old parser did.
 * A file named `arrow -> looking.ts` is quoted by git precisely because it contains spaces,
 * so `indexOf(' -> ')` finds the arrow INSIDE the name and yields `looking.ts"`. Scanning the
 * quoted span first — respecting backslash escapes, so an escaped `\"` does not end it —
 * makes the arrow findable only where it is a separator. A bare field needs no such care: a
 * path git left unquoted contains no space, so the first ` -> ` after it is the separator.
 */
function readPathField(rest: string, i: number): { path: string; next: number } {
  if (rest[i] === '"') {
    let j = i + 1;
    while (j < rest.length) {
      if (rest[j] === '\\') {
        j += 2;
        continue;
      }
      if (rest[j] === '"') break;
      j++;
    }
    return { path: unquoteCStyle(rest.slice(i, Math.min(j + 1, rest.length))), next: j + 1 };
  }
  const arrow = rest.indexOf(' -> ', i);
  const end = arrow === -1 ? rest.length : arrow;
  return { path: rest.slice(i, end), next: end };
}

/**
 * Parses `git status --porcelain` short-format lines into plain file paths.
 *
 * UN-C-QUOTING IS NOT COSMETIC, AND ITS ABSENCE WAS A SECOND FABRICATION — same class as the
 * truncation defect below, reached with no truncation at all. Git quotes any path holding a
 * space, a quote, a backslash, a control character or a non-ASCII byte, which is most real
 * names the moment one has a space in it. This parser handed the quotes and octal escapes
 * straight through, so `"with space.ts"` and `"nonascii-caf\303\251.ts"` reached the conflict
 * map verbatim and the view rendered conflicts on files nobody has. Measured on a
 * four-file fixture with no truncation: 3 of 4 rendered paths did not exist.
 *
 * For a rename (`R  <orig> -> <new>`) this returns the NEW path: it is the one on disk, and
 * the one another worktree can collide with. Note git's own inconsistency — `-z` emits that
 * pair in the OPPOSITE order — which is one reason this parses the v1 text form only.
 *
 * Every line reaching here is COMPLETE: on the success path git wrote all of it, and on the
 * recovery path `wholeLinesOf` has already dropped any partial tail. So a quoted field always
 * carries its closing quote and this never has to guess at half an escape.
 */
export function parseStatusPorcelain(text: string): string[] {
  const files: string[] = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    // FIXED WIDTH, NOT `trimStart()`. Porcelain v1 is `XY<space>PATH` — two status characters
    // and exactly one separator — so the path starts at index 3 and the width is known. The
    // previous `slice(2).trimStart()` ate the first character of any name beginning with
    // Unicode whitespace, because JS `trimStart` strips the whole WhiteSpace class: U+00A0,
    // U+2003, U+2028, U+3000, U+FEFF. Under `core.quotePath=false` git emits such names RAW and
    // unquoted, so they arrive here intact and leave renamed. Measured on the raw form: 6
    // parsed, 5 MISSING. Slicing a known width cannot do that.
    //
    // AND IT CLOSED A HOLE THE PREVIOUS COMMENT SAID WAS STILL OPEN: a name consisting only of
    // Unicode whitespace used to be dropped, because trimming reduced it to '' and the empty
    // guard below discarded it. Slicing a fixed width keeps it. Executed: NBSP, plain space,
    // ideographic space and the quoted forms `" "` and `"\040"` all survive.
    const rest = line.slice(3);
    if (!rest) continue;
    const first = readPathField(rest, 0);
    const file = rest.startsWith(' -> ', first.next) ? readPathField(rest, first.next + 4).path : first.path;
    if (file) files.push(file);
  }
  return files;
}

/**
 * Which worktrees this project's sweep covers, and which it skips.
 *
 * Exported and PURE so a test can hand it a synthetic worktree list and assert the split
 * without needing a real 285-worktree machine — and so the count the view renders and the
 * list the sweep walks are provably the same partition of the same array. `swept.length +
 * excluded.count === entries.length` is an invariant a test pins directly.
 *
 * The rule: a worktree is swept when the project's own `.worktrees/.registry` names it
 * (`registryMatch !== null`, matched on the exact `name-token` basename by
 * parseWorktreePorcelain) and git does not report it prunable. The main checkout is never
 * swept — it is the merge target, not a party to the conflict.
 */
export function scopeSweep(entries: WorktreeEntry[]): { swept: WorktreeEntry[]; excluded: WorktreeEntry[] } {
  const candidates = entries.filter((w) => !w.isMain);
  const swept: WorktreeEntry[] = [];
  const excluded: WorktreeEntry[] = [];
  for (const w of candidates) {
    if (w.registryMatch !== null && !w.prunable) swept.push(w);
    else excluded.push(w);
  }
  return { swept, excluded };
}

/**
 * THE sentence explaining an exclusion, and the only place it is written.
 *
 * It carries no count and no timing figure, deliberately. The count belongs to
 * `excluded.count`, which the view sums itself. The first version of this string ended
 * "…sweeping every worktree on the machine cost 17 seconds per request" — a hardcoded
 * measurement of the SYNCHRONOUS implementation this PR deleted, rendered beside a computed
 * worktree count so it read as though the 17 s had been measured for that number. It had
 * not been, and on a larger fleet it asserted a figure nobody ever took. A constant is a
 * fact about the rule; a duration is a measurement, and a measurement nobody can recompute
 * does not belong in a string.
 *
 * The view RENDERS this rather than restating it, so there is one wording instead of two
 * that drift. test/collectors.test.ts pins that every non-zero exclusion carries exactly
 * this text, so "one wording" is checked rather than merely intended.
 */
export const EXCLUDED_REASON =
  "these worktrees are not named by their project's .worktrees/.registry — so no agent session started them — " +
  'or git reports them prunable. They are real worktrees and may hold uncommitted work; they are simply outside ' +
  'what an agent-conflict view can speak for.';

/**
 * `git status --porcelain` in one worktree. Never throws; returns the three-state shape.
 *
 * `--no-optional-locks` is not decoration: plain `git status` opportunistically rewrites
 * `.git/index` to refresh its stat cache, which is a real mutation inside somebody else's
 * repository performed by a component whose entire posture is read-only. The flag tells git
 * to skip that. Output is byte-identical either way (checked against the same worktree with
 * and without it).
 *
 * statusConfigEnv MAKES THE INPUT DETERMINISTIC RATHER THAN A PROPERTY OF WHOEVER OWNS THE
 * REPO. `core.quotePath` is git's default-on, but it is a config — settable globally, per repo,
 * or through `GIT_CONFIG_GLOBAL` — and with it off git emits non-ASCII RAW while still quoting
 * for spaces, quotes, backslashes and control characters. That produced a quoted body holding
 * a literal astral character, which the parser then destroyed: `"fire 🔥 space.ts"` came back
 * as `"fire �� space.ts"`, 3 of 6 paths naming files that do not exist, with `readable ===
 * undefined` and nothing truncated. Forcing it means the parser sees one format on every
 * machine. It does NOT make the collector immune to git config in general — that claim was
 * made here and is false. `status.showUntrackedFiles=no` survived the quoting override and
 * made untracked files VANISH with `readable: undefined`, a silent miss dressed as a clean
 * read; it is forced too now. Any future `status.*` setting that changes WHICH paths git
 * reports is the same hole, and the honest statement is that each channel is closed as it
 * is found rather than that the class is sealed. See
 * statusConfigEnv for why it is set through the environment rather than as a command-line
 * override.
 *
 * The path reaches git as ONE argv element via `cwd`, never as text in a command line, and
 * no shell is involved — see the injection regression test in test/collectors.test.ts, which
 * sweeps a real worktree named with shell metacharacters and asserts nothing executed.
 */
/**
 * Only the part of a buffer that is definitely COMPLETE: everything up to and including the
 * last newline, and nothing after it.
 *
 * A recovered buffer is a PREFIX of what git was writing, and a prefix cuts wherever the pipe
 * happened to stop — which is mid-path far more often than not. Measured on a real busy
 * worktree: 30,000 modified files, 2.4 MB of status output, 1,048,576 bytes recovered,
 * parsing to 13,108 entries of which the last was `dir_with_a_re` — a path that does not
 * exist, invented by the cut. It entered `changedFiles`, and from there the `byFile` map that
 * computes conflicts, so Mission Control could render a conflict on a file nobody has.
 * Fabricated data reaching a displayed figure is the worst thing this collector can do.
 *
 * `--porcelain` v1 C-quotes any path containing a newline, so a literal `\n` in the byte
 * stream is always a record separator and never part of a name. That is what makes this sound
 * rather than a heuristic.
 *
 * DELIBERATELY NOT APPLIED ON THE SUCCESS PATH, and deliberately not moved inside
 * `parseStatusPorcelain`. Only the caller knows whether a buffer is a prefix or the whole
 * thing; a parser that always dropped an unterminated final line would silently discard a
 * real entry if git ever emitted one. What is being encoded here is "this buffer is partial",
 * and it belongs where that is known.
 */
export function wholeLinesOf(buffer: string): string {
  const lastBreak = buffer.lastIndexOf('\n');
  return lastBreak === -1 ? '' : buffer.slice(0, lastBreak + 1);
}

/**
 * `maxBuffer` is the CALLER's to lower and never to raise — the same shape, and the same
 * reason, as the project probe's bound: the constant protects the machine from an unbounded
 * read, so a larger number cannot weaken it. It is injectable because the truncation branch
 * is otherwise reachable only by producing megabytes of real `git status` output, and a
 * branch that expensive to reach is a branch nothing tests — which is how this defect lived.
 * A non-finite argument falls back to the default rather than reaching Node as `NaN`.
 */
export async function changedFilesFor(
  worktreePath: string,
  opts: { maxBuffer?: number } = {}
): Promise<Omit<WorktreeChanges, 'path' | 'branch'>> {
  const requested = opts.maxBuffer;
  const usable =
    typeof requested === 'number' && Number.isFinite(requested) ? Math.floor(requested) : STATUS_MAX_BUFFER;
  const maxBuffer = Math.max(1, Math.min(usable, STATUS_MAX_BUFFER));

  try {
    const { stdout } = await execFileAsync('git', STATUS_ARGV, {
      cwd: worktreePath,
      encoding: 'utf8',
      maxBuffer,
      timeout: STATUS_TIMEOUT_MS,
      // Spread, not replaced: git still needs PATH to be found at all, and the parent's
      // GIT_CONFIG_GLOBAL / GIT_CONFIG_SYSTEM stay visible so this overrides them rather than
      // pretending they are absent — which is the same answer either way, and one fewer thing
      // that behaves differently under a test harness than in production.
      env: { ...process.env, ...statusConfigEnv() },
    });
    return { changedFiles: parseStatusPorcelain(stdout) };
  } catch (e) {
    // Same reasoning as empty.ts's grep branch, and the reason this is not `return []`:
    // git writes whatever it had produced to stdout before failing, and the promisified
    // form attaches it to the rejection rather than returning it. Discarding it would
    // report absence when the truth is "I found something AND I also could not see
    // everything" — both are reported here.
    //
    // BUT ONLY THE WHOLE LINES OF IT. See wholeLinesOf: the tail of a recovered buffer is a
    // path cut wherever the pipe stopped, and parsing it invents a filename.
    //
    // AND `readable: false` RIDES ALONG UNCONDITIONALLY, not only when the tail was ragged.
    // A buffer that happens to end exactly on a newline is byte-identical to a complete one,
    // so nothing IN the bytes can tell you it is whole — the only evidence that this is a
    // prefix is that the process rejected. Deciding from the buffer would flip the failure
    // from a conflict fabricated to a conflict silently MISSED, which is quieter and worse.
    // The signal for "this is partial" is the rejection, never the buffer.
    const err = e as { stdout?: string; stderr?: string; code?: number | string; killed?: boolean; message?: string };
    const stdout = (err.stdout ?? '').toString();
    const recovered = wholeLinesOf(stdout);
    // BYTES, TAKEN RATHER THAN ASSUMED. `String.length` is UTF-16 code units, and while git's
    // C-quoting makes porcelain v1 pure ASCII — so the two agree today — "bytes" is a
    // measurement claim and this is the line that has to actually take it. `core.quotePath`
    // is configurable, and the day it is off the old number would have been quietly wrong.
    const recoveredBytes = Buffer.byteLength(recovered, 'utf8');
    const discardedBytes = Buffer.byteLength(stdout, 'utf8') - recoveredBytes;
    const stderrTail = (err.stderr ?? '').toString().trim().slice(0, 300);
    const how = err.killed ? `timed out after ${STATUS_TIMEOUT_MS}ms` : `exited ${err.code ?? 'unknown'}`;
    return {
      changedFiles: parseStatusPorcelain(recovered),
      readable: false,
      reason:
        `git status --porcelain ${how} in ${worktreePath} (${stderrTail || err.message || 'no stderr'}) — ` +
        // KNOWN AND NOT FIXED: this accounting is exact only for the ESCAPED stream, where
        // `recovered + discarded === maxBuffer`. On a raw non-ASCII stream Node slices the
        // DECODED string by a BYTE budget, so the recovered figure can exceed the budget —
        // measured, 1226 against a 1000 budget. The number is still a true count of what was recovered;
        // it is the relationship to `maxBuffer` that does not hold. Logged rather than fixed
        // because the sweep forces the escaped form, so the live path is the exact one.
        `${recoveredBytes} bytes recovered as whole lines` +
        (discardedBytes > 0 ? `, ${discardedBytes} trailing bytes discarded as a partial path` : '') +
        // ONLY WHEN SOMETHING WAS ACTUALLY READ. On ENOENT or a not-a-repo path git writes no
        // stdout at all, and appending "what was read is a PREFIX" there claims a prefix of a
        // read that never happened — a smaller version of the same "reporting on something it
        // did not measure" this whole file exists to remove.
        (recoveredBytes > 0
          ? ". What was read is a PREFIX of this worktree's changes, never all of them."
          : '. Nothing was read, so this worktree\'s changes are UNKNOWN rather than empty.'),
    };
  }
}

/**
 * The conflict map for one project. Async because the sweep is: see defect 1 above.
 *
 * The per-worktree calls run concurrently — the sweep is one `git status` per worktree with
 * no ordering between them, and after scoping the fan-out is bounded by how many worktrees a
 * project's registry names (30 across the whole machine, measured), not by how many exist.
 *
 * `opts` FORWARDS TO changedFilesFor, AND THE REASON IS THAT ITS ABSENCE MADE A TEST VACUOUS.
 * The consumer barrier — "no rendered conflict names a file that does not exist" — exists to
 * catch the producer being free underneath it. With no seam here it swept at the full 8 MiB
 * ceiling against a fixture producing 8,600 bytes, 0.10% of the bound, so the recovery branch
 * never ran and the barrier passed with the truncation defect FULLY RESTORED. A barrier that
 * cannot reach the branch it guards is the same shape as the defect it guards against.
 *
 * Lowering only, never raising: changedFilesFor clamps to STATUS_MAX_BUFFER itself, so this
 * forwards a request and cannot widen the machine's protection.
 */
export async function detectConflicts(
  project: Project,
  opts: { maxBuffer?: number } = {}
): Promise<ConflictReport> {
  // AWAITED, and that is the whole of C3. Every call in this function is now async, so the
  // synchronous prefix of the request is the argument marshalling and nothing else. When this
  // was `listWorktrees` (execFileSync), /api/conflicts spent 603 ms of a 606 ms request
  // blocking the event loop across 19 projects — the collector was async and the request was
  // not, because ONE sync call before the first await keeps the whole thing synchronous.
  const { entries, enumerated } = await listWorktreesAsync(project);
  const { swept, excluded } = scopeSweep(entries);

  const worktrees: WorktreeChanges[] = await Promise.all(
    swept.map(async (w) => ({ path: w.path, branch: w.branch, ...(await changedFilesFor(w.path, opts)) }))
  );

  const byFile = new Map<string, { path: string; branch: string | null }[]>();
  for (const w of worktrees) {
    for (const file of w.changedFiles) {
      const list = byFile.get(file) ?? [];
      list.push({ path: w.path, branch: w.branch });
      byFile.set(file, list);
    }
  }

  const conflicts: FileConflict[] = [];
  for (const [file, list] of byFile) {
    if (list.length > 1) conflicts.push({ file, worktrees: list });
  }
  conflicts.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

  return {
    project: project.id,
    worktrees,
    conflicts,
    // ONE POPULATION, ONE FIGURE. Both numbers come from the single partition above, so the
    // count rendered under the header is by construction the count the sweep skipped; there
    // is no second traversal that could drift from it.
    excluded: { count: excluded.length, reason: EXCLUDED_REASON },
    enumerated,
  };
}
