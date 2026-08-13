// server/collectors/events.ts — per-project events.jsonl summary, with budget.block
// events bucketed real vs synthetic.
//
// Constraint 2 (PR2 brief): synthetic budget events must not be reported as real.
// .claude/hooks/budget-guard.js embeds the ceiling it fired at directly in the reason
// string ("... (ceiling N)"). Its real ceilings are read from that file's own source
// (not hardcoded here) so a future change to the defaults cannot silently make this
// collector's "real" bucket wrong. A `budget.block` event is "real" only when its
// ceiling equals the currently configured one for its kind (window/stall); anything
// else is either a forced proof-run (ceiling 1 or 100 in the data measured for this PR)
// or, if the reason string doesn't even parse, unknown. The bucket is always labeled,
// never guessed into "real" by default.

import fs from 'node:fs';
import path from 'node:path';

export interface ConfiguredCeilings {
  window: number;
  stall: number;
}

const WINDOW_BLOCK_RE = /AGENTVIBE_WINDOW_BLOCK\s*\|\|\s*([\d_]+)/;
const STALL_BLOCK_RE = /AGENTVIBE_STALL_BLOCK\s*\|\|\s*([\d_]+)/;

/** Reads the real ceilings out of .claude/hooks/budget-guard.js's own source. Read-only. */
export function readConfiguredCeilings(repoRoot: string): ConfiguredCeilings | null {
  const hookPath = path.join(repoRoot, '.claude', 'hooks', 'budget-guard.js');
  let text: string;
  try {
    text = fs.readFileSync(hookPath, 'utf8');
  } catch {
    return null;
  }
  const w = WINDOW_BLOCK_RE.exec(text);
  const s = STALL_BLOCK_RE.exec(text);
  if (!w || !s) return null;
  return { window: Number((w[1] as string).replace(/_/g, '')), stall: Number((s[1] as string).replace(/_/g, '')) };
}

const CEILING_RE = /\(ceiling ([\d,]+)\)/;

export type BudgetBlockBucket = 'real' | 'synthetic' | 'unknown';

/** Buckets a single budget.block event. Exported so the bucketing rule is independently testable. */
export function bucketBudgetBlock(
  reason: string | undefined,
  kind: string | undefined,
  ceilings: ConfiguredCeilings | null
): BudgetBlockBucket {
  if (!reason) return 'unknown';
  const m = CEILING_RE.exec(reason);
  if (!m) return 'unknown';
  const observed = Number((m[1] as string).replace(/,/g, ''));
  if (!ceilings) return 'unknown';
  const configured = kind === 'window' ? ceilings.window : kind === 'stall' ? ceilings.stall : null;
  if (configured === null) return 'unknown';
  return observed === configured ? 'real' : 'synthetic';
}

interface RawEvent {
  event?: string;
  kind?: string;
  reason?: string;
  [k: string]: unknown;
}

export interface EventsSummary {
  found: boolean;
  path: string;
  totalLines: number;
  unparseableLines: number;
  byEvent: Record<string, number>;
  budgetBlock: Record<BudgetBlockBucket, number>;
  configuredCeilings: ConfiguredCeilings | null;
}

export function summarizeEvents(eventsPath: string, repoRoot: string): EventsSummary {
  const ceilings = readConfiguredCeilings(repoRoot);
  const empty: EventsSummary = {
    found: false,
    path: eventsPath,
    totalLines: 0,
    unparseableLines: 0,
    byEvent: {},
    budgetBlock: { real: 0, synthetic: 0, unknown: 0 },
    configuredCeilings: ceilings,
  };

  let text: string;
  try {
    text = fs.readFileSync(eventsPath, 'utf8');
  } catch {
    return empty;
  }

  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const byEvent: Record<string, number> = {};
  const budgetBlock: Record<BudgetBlockBucket, number> = { real: 0, synthetic: 0, unknown: 0 };
  let unparseable = 0;

  for (const line of lines) {
    let obj: RawEvent;
    try {
      obj = JSON.parse(line) as RawEvent;
    } catch {
      unparseable++;
      continue;
    }
    const name = obj.event ?? '(no event field)';
    byEvent[name] = (byEvent[name] ?? 0) + 1;
    if (obj.event === 'budget.block') {
      budgetBlock[bucketBudgetBlock(obj.reason, obj.kind, ceilings)]++;
    }
  }

  return {
    found: true,
    path: eventsPath,
    totalLines: lines.length,
    unparseableLines: unparseable,
    byEvent,
    budgetBlock,
    configuredCeilings: ceilings,
  };
}
