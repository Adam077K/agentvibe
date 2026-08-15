// server/trust.ts — which project directories Mission Control may run a program for.
//
// THE PREMISE THIS FILE EXISTS TO DELETE: *discovery implies trust*. Mission Control found
// 19 git repositories by walking ~/VibeCoding and then executed programs, and honoured
// configuration, from every one of them. Three RCEs on 2026-08-14 were all that premise
// (docs/03-system-design/SECURITY-FINDINGS-2026-08-14.md, all three re-executed through the
// real routes before this file was written):
//
//   F1  `git status` with cwd inside a discovered worktree honours that repository's own
//       .git/config, and `core.fsmonitor` there names a program git runs. `id` landed in a
//       marker file, and the same request rendered that worktree as clean.
//   F2  `node <discovered-project>/scripts/ledger.mjs` executes the project's own file.
//   F3  a claim's `evidence.cmd`, read from the project's markdown, reaches
//       `/bin/sh -c <string>` in scripts/lib/resolvers.js — reached through F2.
//
// None of the three is a sanitisation problem. You cannot sanitise "run this file". What
// this file changes is WHICH DIRECTORIES ARE ELIGIBLE, so the answer to "may I run a program
// with this repository's config in force" stops being "yes, I found it on disk".
//
// WHAT THIS DOES NOT DO, said here rather than discovered later: an allowlisted project that
// later becomes hostile — a dependency you pulled, a clone you forgot writing — is still full
// RCE. This converts "trust what you find" into "trust what you named". That is a real
// reduction and it is not a fix.
//
// ── WHERE THE LIST LIVES, AND WHY ────────────────────────────────────────────────────────
//
// `~/.warroom/trusted-projects`. Three candidates were considered:
//
//   A file in this repository. REJECTED, and not on taste. mission-control lives INSIDE
//   ~/VibeCoding/agentvibe, which is one of the directories the list governs — so the trust
//   decision would sit inside the trust boundary it defines, writable by anything that
//   already has write access to the tree it is meant to protect. It is also machine-specific
//   absolute paths: committing it makes one developer's fleet another developer's trust
//   decision, and every new project becomes a commit.
//
//   An environment variable. REJECTED as the home of the list. It carries no comments, no
//   record of when or why a project was trusted, and it is invisible the moment you close the
//   shell that set it — so "why is this project excluded" has no file to read. MC_TRUSTED_FILE
//   exists, but it points at a different FILE (tests, a second instance); it does not carry
//   the list.
//
//   ~/.warroom/trusted-projects. CHOSEN. Machine-local, outside every discovered root, and
//   the directory this codebase already uses for machine-scope state that is deliberately not
//   in any git repository — `~/.warroom/ledger/global.yml`, read by collectors/belief.ts.
//
// FORMAT: one absolute path per line, `#` starts a comment, blank lines ignored — the shape
// of .gitignore and known_hosts, because the thing a user does most often is add one line by
// hand. `bun run trust add <path>` does it for them; `bun run trust list` shows the state.
//
// MATCHING IS EXACT PATH EQUALITY AFTER CANONICALISATION. No globs and no prefixes: a prefix
// rule spells "everything under ~/VibeCoding is trusted", which is the premise at the top of
// this file wearing a config file as a disguise.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const TRUST_FILE_ENV = 'MC_TRUSTED_FILE';

/**
 * Where the list is read from. MC_TRUSTED_FILE overrides it — same seam as MC_PROJECT_ROOTS
 * in projects.ts, and with the same threat model: anything that can set this process's
 * environment already runs as the user and does not need to.
 */
export function trustFilePath(homeDir: string = os.homedir()): string {
  const override = process.env[TRUST_FILE_ENV];
  if (override) return override;
  return path.join(homeDir, '.warroom', 'trusted-projects');
}

/**
 * One canonical spelling for a directory, applied to BOTH sides of every comparison.
 *
 * macOS is the reason this is not `path.resolve` alone: `/tmp` is a symlink to `/private/tmp`,
 * and `os.tmpdir()` hands back `/var/folders/...` which resolves to `/private/var/folders/...`.
 * A list written by one and read by the other would silently never match — a security control
 * that fails closed on every project, which reads exactly like the tool being broken.
 *
 * A path that cannot be resolved (it does not exist) falls back to `path.resolve`, so a listed
 * project that is currently unmounted stays comparable rather than becoming un-listable.
 */
export function canonicalRoot(p: string): string {
  const expanded = p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
  const resolved = path.resolve(expanded);
  try {
    return fs.realpathSync(resolved);
  } catch {
    return resolved;
  }
}

export interface TrustList {
  /** The file this was read from — shown to the user so they know what to edit. */
  path: string;
  present: boolean;
  /** Canonical absolute paths. Empty whenever `present` is false. */
  roots: string[];
  /** Set exactly when `present` is false — why, never a bare absence. */
  reason?: string;
  /** Lines the parser refused, each with its line number and the reason. Never silently dropped. */
  issues: string[];
}

export interface ParsedTrustList {
  roots: string[];
  issues: string[];
}

/**
 * One line, minus its comment. THE ONE PLACE that decides where a path ends, so the reader and
 * `removeTrustedRoot` cannot disagree about which line names which directory.
 *
 * `#` STARTS A COMMENT ONLY AT THE START OF A LINE OR AFTER WHITESPACE. The obvious rule —
 * split on the first `#` anywhere — truncates a directory legitimately named `my#project` to
 * `my`, which then canonicalises to a path that does not exist. That fails closed (the project
 * stays untrusted), so it would never look like a security hole; it would look like the trust
 * file not working, with nothing anywhere saying why. Same convention as `.gitignore` and
 * `known_hosts`.
 *
 * The documented limit: a directory whose name contains a space followed by `#` cannot be
 * written on one of these lines. No such directory exists on this machine and the alternative
 * is an escaping syntax in a file whose whole virtue is that it is obvious.
 */
export function stripComment(raw: string): string {
  const match = /(^|\s)#/.exec(raw);
  return (match === null ? raw : raw.slice(0, match.index)).trim();
}

/**
 * Parses the file. Exported so a test can pin the format without touching disk.
 *
 * A RELATIVE PATH IS REFUSED RATHER THAN RESOLVED. `path.resolve('foo')` would resolve it
 * against whatever directory the server happened to be started from, so the same file would
 * grant different trust depending on the caller's cwd. Refused, with the line number, and the
 * refusal is reported — a line silently reinterpreted is worse than a line rejected.
 */
export function parseTrustList(text: string): ParsedTrustList {
  const roots: string[] = [];
  const issues: string[] = [];
  const seen = new Set<string>();

  text.split('\n').forEach((raw, i) => {
    const line = stripComment(raw);
    if (!line) return;
    const lineNo = i + 1;
    if (!line.startsWith('/') && !line.startsWith('~')) {
      issues.push(
        `line ${lineNo}: "${line}" is not an absolute path and was NOT trusted. A relative path would resolve against whatever directory the server was started from, so the same file would grant different trust to different callers. Write the full path, or ~/…`
      );
      return;
    }
    const canonical = canonicalRoot(line);
    if (seen.has(canonical)) return; // a repeat is harmless, not an error
    seen.add(canonical);
    roots.push(canonical);
  });

  return { roots, issues };
}

/**
 * Reads the list. FAILS CLOSED IN EVERY BRANCH: an absent, unreadable or malformed file
 * trusts nothing, and says which of those it was. An empty `roots` with `present: true` and
 * an empty `roots` with `present: false` are different statements and the reason keeps them
 * apart, exactly as LedgerIndexInfo.reason does in projects.ts.
 */
export function readTrustList(file: string = trustFilePath()): TrustList {
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    const err = e as { code?: string };
    return {
      path: file,
      present: false,
      roots: [],
      issues: [],
      reason:
        err.code === 'ENOENT'
          ? `${file} does not exist, so no project is trusted to have programs run for it. This is "nothing was allowed to run", NOT "nothing was found" — every project below was still discovered. \`bun run trust seed\` writes the list from the projects discovered right now; \`bun run trust add <path>\` adds one.`
          : `${file} could not be read (${err.code ?? 'unknown error'}), so no project is trusted. This is "I could not look at the trust list", not "the list is empty".`,
    };
  }
  const { roots, issues } = parseTrustList(text);
  return { path: file, present: true, roots, issues };
}

/**
 * Whether Mission Control may run a program for this project, and — when it may not — the
 * sentence the view renders in place of the figures it did not measure.
 *
 * `source` names the file either way, so a user reading "excluded" has the path to edit
 * without going looking for it.
 */
export interface TrustState {
  trusted: boolean;
  /** The trust list this decision came from. */
  source: string;
  /** Set exactly when `trusted` is false. Always states what to do about it. */
  reason?: string;
}

export function trustStateFor(root: string, list: TrustList): TrustState {
  const canonical = canonicalRoot(root);
  if (list.roots.includes(canonical)) return { trusted: true, source: list.path };
  return {
    trusted: false,
    source: list.path,
    reason: list.present
      ? `${root} is not listed in ${list.path}, so Mission Control ran no program for it. Nothing below is a measurement of this project — it is what could be read without executing anything. Running a program here means git honouring this repository's .git/config and node running its scripts/, so the list is a statement that you wrote or audited this code. Add it with \`bun run trust add ${root}\`.`
      : `${list.reason as string} (${root})`,
  };
}
