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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { projectsDir as claudeProjectsDir } from './lib/usage.ts';

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
  source_file: string;
  source_line: number;
}

export interface LedgerIndexInfo {
  present: boolean;
  path: string;
  /** Always set when present is false — "why", never a bare absence. */
  reason?: string;
  claims: LedgerClaim[];
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
}

export interface DiscoverOptions {
  /** Overrides MC_PROJECT_ROOTS / the ~/VibeCoding default. */
  roots?: string[];
  /** Overrides where ~/.claude/projects is read from (usage.js's own override too). */
  claudeProjectsRoot?: string;
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

function readLedgerIndex(root: string): LedgerIndexInfo {
  const ledgerScript = path.join(root, 'scripts', 'ledger.mjs');
  const indexPath = path.join(root, '.claude', 'ledger', 'index.json');
  if (!fs.existsSync(ledgerScript)) {
    return { present: false, path: indexPath, reason: 'no scripts/ledger.mjs in this project — the claim ledger has not been installed here', claims: [] };
  }
  let raw: string;
  try {
    raw = fs.readFileSync(indexPath, 'utf8');
  } catch {
    return { present: false, path: indexPath, reason: 'scripts/ledger.mjs exists but .claude/ledger/index.json has not been built yet (run `node scripts/ledger.mjs build`)', claims: [] };
  }
  try {
    const parsed = JSON.parse(raw) as { claims?: LedgerClaim[] };
    return { present: true, path: indexPath, claims: parsed.claims ?? [] };
  } catch {
    return { present: false, path: indexPath, reason: '.claude/ledger/index.json exists but did not parse as JSON', claims: [] };
  }
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

function buildProject(root: string, claudeRoot: string): Project {
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
  };
}

/** Discover every git repo directly under the configured roots. Read-only. */
export function discoverProjects(opts: DiscoverOptions = {}): Project[] {
  const roots = opts.roots ?? defaultRoots();
  const claudeRoot = opts.claudeProjectsRoot ?? claudeProjectsDir();
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
      const project = buildProject(dir, claudeRoot);
      if (seenIds.has(project.id)) continue; // first root wins on an id collision
      seenIds.add(project.id);
      projects.push(project);
    }
  }

  return projects.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
