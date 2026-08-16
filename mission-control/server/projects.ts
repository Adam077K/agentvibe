// server/projects.ts — fleet discovery.
//
// Fleet scope decision (already made, see .claude/memory/DECISIONS.md 2026-08-12): every
// git repo under the roots is a project. Repos carrying a live `.worktrees/.registry` are
// flagged agent-active. Discovered by walking disk, never configured — an earlier
// hand-typed list of "projects with a registry" omitted `finfun`, which is exactly the
// failure mode a hardcoded list produces.
//
// Roots default to ~/VibeCoding, overridable (colon-separated, like PATH) via
// MC_PROJECT_ROOTS so this is testable against a fixture tree without touching the real
// one.
//
// DISCOVERY IS NOT TRUST, as of the allowlist. Every project found is still returned — a
// project that vanishes from this list because it is untrusted would be a silent narrowing,
// and "you have no such project" is the answer nobody investigates. What each project now
// carries is `trust`: whether Mission Control may run a program for it, and when it may not,
// the reason and the file to edit. Nothing in this file executes anything; the callers that
// do are the ones that read `trust`. See server/trust.ts for the three RCEs behind it.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { projectsDir as claudeProjectsDir } from './lib/usage.ts';
import { isMapping, validateIndexClaim } from './lib/claim-shape.ts';
import { readTrustList, trustFilePath, trustStateFor, type TrustList, type TrustState } from './trust.ts';

export interface RegistryEntry {
  /** e.g. "ceo-1" in the line "ceo-1:1786445435". */
  name: string;
  /** e.g. "1786445435" — a pid or a launch timestamp; opaque to Mission Control. */
  token: string;
}

export interface RegistryInfo {
  present: boolean;
  path: string;
  entries: RegistryEntry[];
}

export interface LedgerClaim {
  id: string;
  assert: string;
  kind: string;
  scope: string;
  verified_by: string;
  evidence?: unknown;
  valid_until?: string;
  confidence?: number;
  supports?: string[];
  first_waived?: string;
  source_file: string;
  // No `source_line`. The index records what a claim says, never where it sits — a
  // committed line number moves whenever text above it does. `scripts/ledger.mjs locate`
  // resolves a position from the artifacts on demand.
}

export interface LedgerIndexInfo {
  present: boolean;
  path: string;
  /** Always set when present is false — "why", never a bare absence. */
  reason?: string;
  claims: LedgerClaim[];
  /**
   * Entries the index projection refused. REPORTED, never silently dropped — the same posture
   * as readGlobalLedger's, and the reason a validator was added at all: a producer that stops
   * emitting a field must show up as a number somebody can assert on, not as `undefined` in a
   * tooltip. Counts ENTRIES, not problems; one entry can be wrong in several ways at once.
   */
  rejected: number;
  /** One human-readable line per problem found, in entry order. */
  issues: string[];
}

export interface Project {
  /** Basename of root. Assumed unique across the configured roots. */
  id: string;
  root: string;
  transcriptDirs: string[];
  registry: RegistryInfo;
  /** True exactly when registry.present — a project with a live .worktrees/.registry. */
  agentActive: boolean;
  ledgerIndex: LedgerIndexInfo;
  eventsPath: string;
  eventsPathSource: 'warroom.yml' | 'default';
  /**
   * Whether Mission Control may run a program for this project, and why not when it may not.
   * Read from the trusted-projects list; see server/trust.ts. A collector or route that
   * spawns a subprocess against `root` checks this first — the field exists so the answer is
   * carried WITH the project rather than recomputed at each call site.
   */
  trust: TrustState;
}

export interface DiscoverOptions {
  /** Overrides MC_PROJECT_ROOTS / the ~/VibeCoding default. */
  roots?: string[];
  /** Overrides where ~/.claude/projects is read from (usage.js's own override too). */
  claudeProjectsRoot?: string;
  /**
   * Overrides the trusted-projects file. An in-process seam for tests and for the CLI, so a
   * fixture tree can be trusted without writing to the real ~/.warroom/trusted-projects.
   */
  trustFile?: string;
}

/**
 * Claude Code's own cwd → transcript-directory-name encoding: every character outside
 * [A-Za-z0-9] becomes '-'. Confirmed empirically against real directories under
 * ~/.claude/projects — e.g. ".worktrees" inside a path becomes "-worktrees" (the dot
 * *and* the preceding slash both fold to '-', producing the double dash seen in
 * "agentvibe--worktrees-ceo-1-...").
 *
 * war-room/dashboard/server/collectors/cost.ts's encodePath() only replaces '/', which
 * is why it is reference-only here rather than imported: that function undercounts on
 * any path containing '.' or '_' (both common in worktree slugs and session dirs), and
 * this project must not carry that bug into fleet-wide discovery.
 */
export function encodeProjectDir(absPath: string): string {
  return absPath.replace(/[^A-Za-z0-9]/g, '-');
}

function defaultRoots(): string[] {
  const env = process.env.MC_PROJECT_ROOTS;
  if (env) return env.split(path.delimiter).filter(Boolean);
  return [path.join(os.homedir(), 'VibeCoding')];
}

function isGitRepo(dir: string): boolean {
  return fs.existsSync(path.join(dir, '.git'));
}

function readRegistry(root: string): RegistryInfo {
  const regPath = path.join(root, '.worktrees', '.registry');
  let text: string;
  try {
    text = fs.readFileSync(regPath, 'utf8');
  } catch {
    return { present: false, path: regPath, entries: [] };
  }
  const entries: RegistryEntry[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;
    entries.push({ name: trimmed.slice(0, idx), token: trimmed.slice(idx + 1) });
  }
  return { present: true, path: regPath, entries };
}

/**
 * Load `.claude/ledger/index.json`, CHECKING each entry rather than asserting it.
 *
 * This used to read `JSON.parse(raw) as { claims?: LedgerClaim[] }`, and the cast is the whole
 * of issue #53: it satisfies tsc while checking nothing at runtime, so a producer dropping a
 * field from scripts/ledger.mjs's KEY_ORDER cost nothing at compile time and arrived at the UI
 * as `undefined`. That already happened once, to `source_line`, past tsc and 319 green tests.
 * See server/lib/claim-shape.ts for the projection and why validateClaim alone cannot do this.
 *
 * A REFUSED ENTRY IS DROPPED AND COUNTED, mirroring readGlobalLedger — partial data is still
 * worth showing and the count is what makes the loss assertable. But TOTAL refusal is not
 * "this project has no claims": an index holding entries where none matched the projection is
 * a file this reader cannot read, which belongs with the JSON-parse failure below it rather
 * than with an empty band. Absent and empty must not render identically, and neither must
 * "empty" and "unreadable".
 */
export function readLedgerIndex(root: string): LedgerIndexInfo {
  const ledgerScript = path.join(root, 'scripts', 'ledger.mjs');
  const indexPath = path.join(root, '.claude', 'ledger', 'index.json');
  const absent = (reason: string): LedgerIndexInfo => ({ present: false, path: indexPath, reason, claims: [], rejected: 0, issues: [] });
  if (!fs.existsSync(ledgerScript)) {
    return absent('no scripts/ledger.mjs in this project — the claim ledger has not been installed here');
  }
  let raw: string;
  try {
    raw = fs.readFileSync(indexPath, 'utf8');
  } catch {
    return absent('scripts/ledger.mjs exists but .claude/ledger/index.json has not been built yet (run `node scripts/ledger.mjs build`)');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return absent('.claude/ledger/index.json exists but did not parse as JSON');
  }
  const list = isMapping(parsed) ? parsed.claims : undefined;
  if (!Array.isArray(list)) {
    return absent('.claude/ledger/index.json parsed as JSON but carries no "claims" list — that is a different statement from "this project has no claims"');
  }

  const claims: LedgerClaim[] = [];
  const issues: string[] = [];
  let rejected = 0;
  list.forEach((entry, i) => {
    const result = validateIndexClaim(entry, `${indexPath} claims[${i}]`);
    if (result.ok) claims.push(result.claim);
    else {
      rejected += 1;
      issues.push(...result.problems);
    }
  });

  if (claims.length === 0 && rejected > 0) {
    return {
      present: false,
      path: indexPath,
      reason: `.claude/ledger/index.json holds ${rejected} entr${rejected === 1 ? 'y' : 'ies'} and none matched the shape this reader understands — the producer and Mission Control disagree about what an indexed claim is. First problem: ${issues[0] ?? 'unknown'}`,
      claims: [],
      rejected,
      issues,
    };
  }
  return { present: true, path: indexPath, claims, rejected, issues };
}

/**
 * Same resolution rule as scripts/ledger.mjs's eventsPath() and .claude/hooks/budget-
 * guard.js's eventsPath() (see their comments) — read here per-project, since Mission
 * Control looks at every project's own .warroom.yml rather than the current process's.
 * The WARROOM_EVENTS env-var branch those two have is deliberately not replicated: that
 * variable scopes a single hook invocation's own event log, not a fleet-wide read.
 */
function resolveEventsPath(root: string, id: string): { path: string; source: 'warroom.yml' | 'default' } {
  const cfgPath = path.join(root, '.warroom.yml');
  let text: string | null = null;
  try {
    text = fs.readFileSync(cfgPath, 'utf8');
  } catch {
    text = null;
  }
  if (text) {
    // Capture groups are read through a local binding rather than `m[1]` inline: under
    // `noUncheckedIndexedAccess` the indexed access is `string | undefined`, and the
    // `.replace()` below was an unguarded call on it. Never fired — the group is not
    // optional in either pattern — but tsc was right that nothing proved that, and this
    // was one of three type errors nothing in CI was running tsc to catch.
    const stateDir = /^\s*state_dir\s*:\s*(\S+)/m.exec(text)?.[1];
    if (stateDir !== undefined) {
      const dir = stateDir.replace(/^~/, os.homedir());
      return { path: path.join(dir, 'events.jsonl'), source: 'warroom.yml' };
    }
    const session = /^\s*session\s*:\s*(\S+)/m.exec(text)?.[1];
    if (session !== undefined) {
      return { path: path.join(os.homedir(), `.${session}`, 'events.jsonl'), source: 'warroom.yml' };
    }
  }
  return { path: path.join(os.homedir(), `.${id}`, 'events.jsonl'), source: 'default' };
}

// KNOWN LIMITATION: two sibling project directories related by a literal hyphen — e.g.
// "widget" and "widget-other" — encode to prefixes where one is a hyphen-prefix of the
// other ("-widget" vs "-widget-other"), which is exactly the shape a nested worktree
// path produces. This is a property of the encoding itself (Claude Code's, not this
// file's) and is not resolvable from the encoded name alone; it is not a distinction
// this collector can safely make. Two projects colliding this way is a naming choice a
// human can avoid; the ambiguity is documented here rather than silently mishandled.
function transcriptDirsFor(root: string, claudeRoot: string): string[] {
  const prefix = encodeProjectDir(root);
  let entries: string[];
  try {
    entries = fs.readdirSync(claudeRoot);
  } catch {
    return [];
  }
  return entries
    .filter((name) => name === prefix || name.startsWith(`${prefix}-`))
    .map((name) => path.join(claudeRoot, name))
    .filter((dir) => {
      try {
        return fs.statSync(dir).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

function buildProject(root: string, claudeRoot: string, trustList: TrustList): Project {
  const id = path.basename(root);
  const registry = readRegistry(root);
  const events = resolveEventsPath(root, id);
  return {
    id,
    root,
    transcriptDirs: transcriptDirsFor(root, claudeRoot),
    registry,
    agentActive: registry.present,
    ledgerIndex: readLedgerIndex(root),
    eventsPath: events.path,
    eventsPathSource: events.source,
    trust: trustStateFor(root, trustList),
  };
}

export interface Fleet {
  projects: Project[];
  /**
   * The trust list every project above was judged against — RETURNED rather than re-read by
   * the caller, so a route reporting "these 3 were excluded, here is the file and the lines it
   * refused" cannot be describing a different read of that file than the one that excluded
   * them. Two reads of one file disagree eventually; this codebase has that defect written up
   * nine times.
   */
  trustList: TrustList;
}

/**
 * Discover every git repo directly under the configured roots, with the trust decision for
 * each. Read-only — this function executes nothing, and writes nothing, including the trust
 * file (seeding is explicit; see server/app.ts and scripts/trust.ts).
 *
 * The trust list is read ONCE per call and handed to every project, not re-read per project:
 * one discovery pass must not be able to answer with two different trust lists, and a file
 * edited mid-walk would do exactly that.
 */
export function discoverFleet(opts: DiscoverOptions = {}): Fleet {
  const roots = opts.roots ?? defaultRoots();
  const claudeRoot = opts.claudeProjectsRoot ?? claudeProjectsDir();
  const trustList = readTrustList(opts.trustFile ?? trustFilePath());
  const projects: Project[] = [];
  const seenIds = new Set<string>();

  for (const root of roots) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue; // a configured root that doesn't exist yields zero projects, not an error
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(root, entry.name);
      if (!isGitRepo(dir)) continue;
      const project = buildProject(dir, claudeRoot, trustList);
      if (seenIds.has(project.id)) continue; // first root wins on an id collision
      seenIds.add(project.id);
      projects.push(project);
    }
  }

  projects.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { projects, trustList };
}

/** Every discovered project, trust stamped on each. The list itself is on discoverFleet(). */
export function discoverProjects(opts: DiscoverOptions = {}): Project[] {
  return discoverFleet(opts).projects;
}

export type { TrustList, TrustState };
