// server/lib/claims.ts — typed façade over ../../../scripts/lib/claims.js and the one
// date rule in ../../../scripts/lib/resolvers.js.
//
// Same posture as server/lib/usage.ts: this file adds types and nothing else, so there is
// exactly one relative path to get right and exactly one place a signature is written down.
//
// WHY THE FAÇADE EXISTS AT ALL, rather than a YAML reader in belief.ts.
// `~/.warroom/ledger/global.yml` is read by scripts/ledger.mjs's collectGlobalClaims() with
// parseYamlSubset, which REFUSES what it cannot classify (a tab in indentation, a duplicate
// key, an unterminated quote) instead of returning an empty list. A second parser written
// here would disagree with the ledger's own the first time a claim block used a shape it did
// not cover — and it would disagree by reporting FEWER claims, which is precisely the
// failure the ledger exists to prevent. Never recompute a figure the repo already computes.
//
// waiverState is imported for the same reason. Whether a waiver has lapsed is a date rule
// with an off-by-one in it (a waiver is in force through the END of its `until` day), and
// scripts/lib/resolvers.js already carries the comment recording that `ledger sweep`
// recomputed it independently for exactly one commit. Rule 9 turns on this predicate and the
// Belief view renders a lapsed waiver differently from a live one, so it has to be the same
// answer `ledger sweep` would give — not a second one that agrees until a leap year.

// @ts-expect-error — plain CommonJS, no .d.ts; allowJs is off project-wide by design.
import * as claimsLib from '../../../scripts/lib/claims.js';
// @ts-expect-error — same module system, same reason.
import * as resolversLib from '../../../scripts/lib/resolvers.js';

/** One disposition on a claim whose expiry came due — ADR-001 §3.1. */
export interface ClaimDisposition {
  action: 'refresh' | 'deprecate' | 'waive';
  /** Required by the schema for `waive`; absent on the other two. */
  until?: string;
  reason?: string;
}

/**
 * Whether a waiver is still in force. `invalid` means `until` did not parse as a date, which
 * is a THIRD state and must not collapse into either "live" or "lapsed".
 */
export type WaiverState = { invalid: true } | { invalid: false; lapsed: boolean; days: number };

const claims = claimsLib as {
  parseYamlSubset(text: string): unknown;
  validateClaim(claim: unknown, where: string): string[];
};

const resolvers = resolversLib as {
  waiverState(claim: unknown, now: number): WaiverState;
};

/**
 * Parses the YAML subset the ledger accepts. THROWS on anything it does not fully
 * understand — that is the point of it, and a caller that swallows the throw to return an
 * empty list has reinvented the bug this parser was written to kill.
 */
export const parseYamlSubset: (text: string) => unknown = claims.parseYamlSubset;

/** The schema problems with one claim. An empty array means it is well-formed. */
export const validateClaim: (claim: unknown, where: string) => string[] = claims.validateClaim;

/** The one implementation of "is this waiver still in force". */
export const waiverState: (claim: unknown, now: number) => WaiverState = resolvers.waiverState;
