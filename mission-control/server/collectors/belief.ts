// server/collectors/belief.ts — "what we believe, confidence, expiry, supports: graph"
// (docs/03-system-design/AGENT-SYSTEM-REBUILD.md §3.9).
//
// Verdict counts (pass / would_block / block) come from shelling out to
// `node scripts/ledger.mjs verify`, per constraint 1: that count is already computed by
// the ledger itself and re-deriving it from the raw claim files would be a second
// implementation of the same classification that can silently disagree with the first.
// The claim catalog itself (kind/scope/expiry breakdown) is read from the committed
// `.claude/ledger/index.json`, which is also generated (never hand-edited) by
// scripts/ledger.mjs build.

import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import type { Project, LedgerClaim } from '../projects.ts';

export interface LedgerVerifySummary {
  totalClaims: number;
  pass: number;
  wouldBlock: number;
  block: number;
  raw: string;
}

export type LedgerVerifyResult = LedgerVerifySummary | { present: false; reason: string };

const SUMMARY_RE = /ledger verify: (\d+) pass · (\d+) would_block \(shadow\) · (\d+) block/;
const HEADER_RE = /^ledger verify: (\d+) claims/m;

/** Parses `node scripts/ledger.mjs verify` stdout. Exported so tests can pin the format. */
export function parseLedgerVerifyOutput(text: string): LedgerVerifySummary {
  const summary = SUMMARY_RE.exec(text);
  if (!summary) {
    throw new Error(`could not find the "ledger verify: N pass · M would_block (shadow) · K block" line in:\n${text}`);
  }
  const header = HEADER_RE.exec(text);
  const pass = Number(summary[1]);
  const wouldBlock = Number(summary[2]);
  const block = Number(summary[3]);
  return {
    totalClaims: header ? Number(header[1]) : pass + wouldBlock + block,
    pass,
    wouldBlock,
    block,
    raw: text,
  };
}

/**
 * Builds the argv passed to `node`. Exported so a test can assert the '--' sentinel
 * shape directly, without mocking execFileSync.
 *
 * The leading '--' guards `ledgerScript` — a path derived from projectRoot
 * (project.root, read straight off disk by discoverProjects()) — passed to `node` as a
 * bare positional. Inert today for the same reason server/collectors/empty.ts's grep
 * sentinel was inert before it was added — project.root is always absolute under the
 * shipped default — but the reasoning is identical: it closes the class
 * unconditionally regardless of how project.root is ever constructed later, for one
 * array element. `node -- <path> <args...>` still passes everything after <path>
 * through to the script's own argv (verified directly: `node -- scripts/ledger.mjs
 * verify --offline` behaves exactly like `node scripts/ledger.mjs verify --offline`).
 */
export function ledgerVerifyArgs(ledgerScript: string, offline: boolean): string[] {
  const args = ['--', ledgerScript, 'verify'];
  if (offline) args.push('--offline');
  return args;
}

/**
 * Runs `node scripts/ledger.mjs verify` for a project, if it has one.
 *
 * `offline` defaults to true here (fast, deterministic for a live route — the only
 * network-dependent claim in this repo is the intentionally-unresolvable canary). Pass
 * `{ offline: false }` to run the literal command with no flags, e.g. for a cross-check
 * against the real `node scripts/ledger.mjs verify` invocation.
 */
export function runLedgerVerify(projectRoot: string, opts: { offline?: boolean } = {}): LedgerVerifyResult {
  const offline = opts.offline ?? true;
  const ledgerScript = path.join(projectRoot, 'scripts', 'ledger.mjs');
  if (!fs.existsSync(ledgerScript)) {
    return { present: false, reason: `no scripts/ledger.mjs in ${projectRoot} — this project has no claim ledger` };
  }
  const args = ledgerVerifyArgs(ledgerScript, offline);
  let out: string;
  try {
    out = execFileSync('node', args, { cwd: projectRoot, encoding: 'utf8' });
  } catch (e) {
    const err = e as { stdout?: string; message?: string };
    if (!err.stdout) {
      return { present: false, reason: `scripts/ledger.mjs verify failed to run: ${err.message ?? 'unknown error'}` };
    }
    out = err.stdout;
  }
  return parseLedgerVerifyOutput(out);
}

export interface ClaimsSummary {
  total: number;
  byKind: Record<string, number>;
  byScope: Record<string, number>;
  expiringWithin30Days: LedgerClaim[];
}

export function summarizeClaims(claims: LedgerClaim[], now = Date.now()): ClaimsSummary {
  const byKind: Record<string, number> = {};
  const byScope: Record<string, number> = {};
  const expiringWithin30Days: LedgerClaim[] = [];
  const THIRTY_DAYS_MS = 30 * 24 * 3600 * 1000;

  for (const c of claims) {
    byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
    byScope[c.scope] = (byScope[c.scope] ?? 0) + 1;
    if (c.valid_until) {
      const t = Date.parse(c.valid_until);
      if (!Number.isNaN(t) && t - now < THIRTY_DAYS_MS) expiringWithin30Days.push(c);
    }
  }
  expiringWithin30Days.sort((a, b) => (a.valid_until ?? '').localeCompare(b.valid_until ?? ''));

  return { total: claims.length, byKind, byScope, expiringWithin30Days };
}

export interface BeliefSummary {
  project: string;
  ledger: LedgerVerifyResult;
  claims: ClaimsSummary | { present: false; reason: string };
}

export function collectBelief(project: Project, opts: { offline?: boolean } = {}): BeliefSummary {
  return {
    project: project.id,
    ledger: runLedgerVerify(project.root, opts),
    claims: project.ledgerIndex.present
      ? summarizeClaims(project.ledgerIndex.claims)
      : { present: false, reason: project.ledgerIndex.reason ?? 'no ledger index for this project' },
  };
}
