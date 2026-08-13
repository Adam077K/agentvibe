// server/lib/usage.ts — typed façade over ../../../scripts/lib/usage.js.
//
// scripts/lib/usage.js is read-only ground truth for this PR (constraint 1 in the PR2
// brief: "never reimplement a figure the repo already computes"). This file adds types,
// nothing else — every collector imports the pure functions from here rather than
// reaching into scripts/lib directly, so there is exactly one relative path to get right.
//
// recentTurns() is deliberately NOT re-exported: it calls saveCache() (usage.js line
// ~153), and the cache file that writes to (~/.agentvibe/usage-cache.json by default)
// belongs to the budget-guard hook. windowUsage() calls recentTurns() internally, so the
// wrapper below forces { noCache: true } on every call regardless of what the caller
// passes — that is what keeps the shared cache file byte- and mtime-identical no matter
// what Mission Control does, without relying on every call site to remember the flag.
// Slower than the hook's own incremental read, but correctness on a file this project
// does not own beats the speed win.

// @ts-expect-error — plain CommonJS, no .d.ts; allowJs is off project-wide by design.
import * as usageLib from '../../../scripts/lib/usage.js';

export interface Turn {
  t: number;
  out: number;
  /** 1 when the turn is a subagent (isSidechain) turn, 0 otherwise. */
  side: number;
}

export interface WindowUsage {
  output_tokens: number;
  subagent_output_tokens: number;
  window_hours: number;
  now: number;
  filesScanned: number;
  bytesRead: number;
}

export interface WindowUsageOpts {
  now?: number;
  windowHours?: number;
  projectsDir?: string;
}

const lib = usageLib as {
  listTranscripts(root: string): string[];
  turnsFrom(text: string): Turn[];
  projectsDir(): string;
  windowUsage(opts: WindowUsageOpts & { noCache?: boolean }): WindowUsage;
};

export const listTranscripts: (root: string) => string[] = lib.listTranscripts;
export const turnsFrom: (text: string) => Turn[] = lib.turnsFrom;
export const projectsDir: () => string = lib.projectsDir;

/**
 * windowUsage() — ALWAYS called with `noCache: true`, unconditionally. See the file
 * header: this is the one thing standing between Mission Control and a mutated shared
 * cache file. It is intentionally not an option on this wrapper's own signature.
 */
export function windowUsage(opts: WindowUsageOpts = {}): WindowUsage {
  return lib.windowUsage({ ...opts, noCache: true });
}
