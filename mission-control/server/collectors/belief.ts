// server/collectors/belief.ts — "what we believe, confidence, expiry, supports: graph"
// (docs/03-system-design/AGENT-SYSTEM-REBUILD.md §3.9).
//
// Verdict counts (pass / would_block / block) come from shelling out to
// `node scripts/ledger.mjs verify`, per constraint 1: that count is already computed by
// the ledger itself and re-deriving it from the raw claim files would be a second
// implementation of the same classification that can silently disagree with the first.
// The project claim catalog (kind/scope/expiry breakdown) is read from the committed
// `.claude/ledger/index.json`, which is also generated (never hand-edited) by
// scripts/ledger.mjs build.
//
// TWO THINGS THIS FILE SHIPPED WITH, both fixed here.
//
// 1. IT READ ONLY THE PROJECT'S OWN LEDGER. Nothing anywhere in server/ opened
//    `~/.warroom/ledger/global.yml`, which holds the scope:global claims — including BOTH
//    live waivers on this machine (c-runtime-nested-spawn and c-rolling-five-hour-window,
//    each waived until 2026-09-08). A view called Belief that cannot show the waivers
//    currently holding claims open is not showing what we believe. It is now read, with the
//    repo's OWN parser (see server/lib/claims.ts for why a second YAML reader would be a
//    regression, not a convenience), and rendered as its own band.
//
// 2. IT WAS SYNCHRONOUS, AND IT IS NOT CHEAP. `execFileSync` on Bun's single JS thread.
//    Measured through the real route on this machine 2026-08-13: 21,814 ms cold / 18,781 ms
//    warm — the verify itself is 10,385 ms and the index refresh is the rest. The brief
//    called this route 25 ms; that figure came from timing a MODULE_NOT_FOUND crash, which
//    is the §0 defect class exactly (a measurement reporting success about something it did
//    not measure — nobody checked the exit code or that any output was produced). So this is
//    a SECOND ten-second event-loop stall, and it is now async for the same reason
//    conflicts.ts is.
//
// AND IT ONLY RUNS FOR A TRUSTED PROJECT, as of the allowlist. `node <project>/scripts/
// ledger.mjs` executes a file the project supplies — findings F2 and F3 — so collectBelief
// checks project.trust before spawning and otherwise returns the same `{present: false,
// reason}` shape every other failure here uses. See server/trust.ts. The rest of this
// collector reads files and still runs, so Belief degrades to "no verdicts, and here is why"
// rather than to a blank panel.
//
// EXACTLY ONE VERIFY INVOCATION, deliberately. `ledger.mjs verify` calls logEvent() for
// every non-pass, appending to ~/.agentvibe/events.jsonl — so this route already mutates
// disk transitively, through merged code, by a path the server/** write guard cannot see
// (it greps this tree's source text, and the write is in another program). That is logged as
// a finding and is not PR4's to fix; what PR4 will not do is make it worse. Per-scope
// verdicts are therefore attributed by parsing the per-claim lines the ONE run already
// prints, never by running verify a second time with --scope=.

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Project, LedgerClaim, TrustState } from '../projects.ts';
import { parseYamlSubset, validateClaim, waiverState, type ClaimDisposition } from '../lib/claims.ts';

const execFileAsync = promisify(execFile);

/** `ledger.mjs verify` runs real test suites through claim-command; 10.4 s measured, so 60 s. */
const VERIFY_TIMEOUT_MS = 60_000;
const VERIFY_MAX_BUFFER = 8 * 1024 * 1024;

export interface LedgerVerifySummary {
  totalClaims: number;
  pass: number;
  wouldBlock: number;
  block: number;
  raw: string;
}

export type Absent = { present: false; reason: string };
export type LedgerVerifyResult = LedgerVerifySummary | Absent;

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

export type Verdict = 'pass' | 'would_block' | 'block';

export interface VerdictLine {
  claimId: string;
  resolver: string;
  verdict: Verdict;
}

// The three shapes ledger.mjs cmdVerify writes per resolver run:
//   "  ✓ c-id [resolver] reason"
//   "  ⚠ would_block c-id [resolver] status: reason"
//   "  ✗ BLOCK   c-id [resolver] status: reason"
// Anchored at line start so a claim id quoted inside somebody's reason text cannot be
// mistaken for a verdict of its own.
const VERDICT_LINE_RE = /^\s*(✓|⚠ would_block|✗ BLOCK)\s+(c-[a-z0-9-]+)\s+\[([a-z-]+)\]/;

/**
 * One entry per RESOLVER RUN, not per claim — a claim with two resolvers produces two lines,
 * and the summary counts runs too (measured: 70 runs across 35 claims). Exported so a test
 * can pin the format against real stdout.
 */
export function parseLedgerVerifyLines(text: string): VerdictLine[] {
  const lines: VerdictLine[] = [];
  for (const line of text.split('\n')) {
    const m = VERDICT_LINE_RE.exec(line);
    if (!m) continue;
    lines.push({
      claimId: m[2] as string,
      resolver: m[3] as string,
      verdict: m[1] === '✓' ? 'pass' : m[1] === '⚠ would_block' ? 'would_block' : 'block',
    });
  }
  return lines;
}

export interface VerdictCounts {
  pass: number;
  wouldBlock: number;
  block: number;
}

export interface AttributedVerdicts {
  byScope: Record<'project' | 'global', VerdictCounts>;
  /** Runs whose claim id was in neither scope's claim set. Must be 0 for the split to hold. */
  unattributed: number;
  /**
   * False when the attributed runs do not add up to the summary the same run printed. THE
   * SECOND BARRIER: the line regex and the summary regex are independent readings of one
   * command's output, so if the line parse ever misses a shape (a new verdict marker, a
   * reworded prefix) the totals disagree and every band renders "not attributed" WITH the
   * reason — instead of quietly showing counts that are too low. §0: two cheap independent
   * checks beat one careful one.
   */
  consistent: boolean;
  reason: string | null;
}

function emptyCounts(): VerdictCounts {
  return { pass: 0, wouldBlock: 0, block: 0 };
}

function add(counts: VerdictCounts, verdict: Verdict): void {
  if (verdict === 'pass') counts.pass++;
  else if (verdict === 'would_block') counts.wouldBlock++;
  else counts.block++;
}

/**
 * Splits one verify run's per-claim verdicts by the scope each claim belongs to, and checks
 * the split against that same run's own summary line.
 *
 * `scopeOf` is built from the two claim sets already loaded — the project index and the
 * global ledger — so a claim id appearing in neither is counted as unattributed rather than
 * silently dropped into a bucket.
 */
export function attributeVerdicts(
  summary: LedgerVerifySummary,
  scopeOf: Map<string, 'project' | 'global'>
): AttributedVerdicts {
  const lines = parseLedgerVerifyLines(summary.raw);
  const byScope: Record<'project' | 'global', VerdictCounts> = { project: emptyCounts(), global: emptyCounts() };
  let unattributed = 0;

  for (const line of lines) {
    const scope = scopeOf.get(line.claimId);
    if (!scope) {
      unattributed++;
      continue;
    }
    add(byScope[scope], line.verdict);
  }

  const totals = {
    pass: byScope.project.pass + byScope.global.pass,
    wouldBlock: byScope.project.wouldBlock + byScope.global.wouldBlock,
    block: byScope.project.block + byScope.global.block,
  };
  const agrees =
    unattributed === 0 &&
    totals.pass === summary.pass &&
    totals.wouldBlock === summary.wouldBlock &&
    totals.block === summary.block;

  return {
    byScope,
    unattributed,
    consistent: agrees,
    reason: agrees
      ? null
      : `the per-claim lines in this verify run attribute ${totals.pass}/${totals.wouldBlock}/${totals.block} ` +
        `(pass/would_block/block) with ${unattributed} unattributed, but the run's own summary line says ` +
        `${summary.pass}/${summary.wouldBlock}/${summary.block}. Two independent reads of one command's output ` +
        'disagree, so no per-scope count is shown rather than a wrong one.',
  };
}

/**
 * Builds the argv passed to `node`. Exported so a test can assert the '--' sentinel
 * shape directly, without mocking the child-process call.
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
 * Runs `node scripts/ledger.mjs verify` for a project, if it has one. ASYNC — see the file
 * header; this call is ~10 s and used to block the event loop for every connected client.
 *
 * `offline` defaults to true here (fast, deterministic for a live route — the only
 * network-dependent claim in this repo is the intentionally-unresolvable canary). Pass
 * `{ offline: false }` to run the literal command with no flags, e.g. for a cross-check
 * against the real `node scripts/ledger.mjs verify` invocation.
 */
export async function runLedgerVerify(
  projectRoot: string,
  opts: { offline?: boolean } = {}
): Promise<LedgerVerifyResult> {
  const offline = opts.offline ?? true;
  const ledgerScript = path.join(projectRoot, 'scripts', 'ledger.mjs');
  if (!fs.existsSync(ledgerScript)) {
    return { present: false, reason: `no scripts/ledger.mjs in ${projectRoot} — this project has no claim ledger` };
  }
  const args = ledgerVerifyArgs(ledgerScript, offline);
  let out: string;
  try {
    const result = await execFileAsync('node', args, {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: VERIFY_TIMEOUT_MS,
      maxBuffer: VERIFY_MAX_BUFFER,
    });
    out = result.stdout;
  } catch (e) {
    // verify exits non-zero whenever any claim blocks, and that is a RESULT, not a failure
    // to run — its stdout still carries the full report. Only a run that produced no stdout
    // at all could not be read. (This is also the shape that produced the 25 ms figure in
    // the brief: a crash with empty stdout, timed and reported as a successful measurement.)
    const err = e as { stdout?: string; message?: string; killed?: boolean };
    const stdout = (err.stdout ?? '').toString();
    if (!stdout) {
      const how = err.killed
        ? `timed out after ${VERIFY_TIMEOUT_MS}ms and produced no output`
        : `failed to run: ${err.message ?? 'unknown error'}`;
      return { present: false, reason: `scripts/ledger.mjs verify ${how}` };
    }
    out = stdout;
  }
  // PARSING IS PART OF THE FAILURE PATH, not something after it. parseLedgerVerifyOutput
  // THROWS when the summary line is absent, and the branch above deliberately keeps PARTIAL
  // stdout — so a verify that printed some claims and then died, including via the very
  // timeout this file defines for that case, threw straight out of the collector, past the
  // route, and reached the browser as HTTP 500 "Internal Server Error". This function's own
  // return type promises `{present: false, reason}` for exactly this situation and was not
  // honouring it. A type that says "I report my failures" while the implementation throws is
  // worse than no type at all, because every caller was written against the promise.
  try {
    return parseLedgerVerifyOutput(out);
  } catch (e) {
    const err = e as { message?: string };
    return {
      present: false,
      reason:
        `scripts/ledger.mjs verify produced ${out.length} bytes that do not contain its own summary line, so no ` +
        `verdict could be read from them (${err.message?.split('\n')[0] ?? 'unparseable'}). That is a partial or ` +
        'interrupted run — typically the 60s timeout — and not a ledger with nothing in it.',
    };
  }
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

// ── the global ledger ────────────────────────────────────────────────────────────────

/** A claim as it appears in ~/.warroom/ledger/global.yml, where dispositions survive. */
export interface GlobalClaim extends LedgerClaim {
  disposition?: ClaimDisposition;
}

export interface GlobalLedgerPresent {
  present: true;
  path: string;
  claims: GlobalClaim[];
  /** Entries the schema refused. Reported, never silently dropped. */
  rejected: number;
  issues: string[];
}

export type GlobalLedgerResult = GlobalLedgerPresent | (Absent & { path: string });

/** Where scripts/ledger.mjs looks — the same literal, resolved the same way. */
export function globalLedgerPath(homeDir: string = os.homedir()): string {
  return path.join(homeDir, '.warroom', 'ledger', 'global.yml');
}

/**
 * Reads the global claim ledger, mirroring scripts/ledger.mjs's collectGlobalClaims(): parse
 * with the repo's own strict parser, validate every entry against the repo's own schema, keep
 * only scope:global.
 *
 * ABSENT AND EMPTY MUST NOT RENDER IDENTICALLY, so every failure path returns
 * `{present: false, reason}` and never an empty claim list. The file is not in any git
 * repository — it is not in CI and no push backs it up — so "this machine has none" is a
 * completely ordinary state that a reader must be able to tell apart from "this machine has
 * one and it holds nothing".
 */
export function readGlobalLedger(ledgerPath: string = globalLedgerPath()): GlobalLedgerResult {
  let text: string;
  try {
    text = fs.readFileSync(ledgerPath, 'utf8');
  } catch (e) {
    const err = e as { code?: string };
    return {
      present: false,
      path: ledgerPath,
      reason:
        err.code === 'ENOENT'
          ? `${ledgerPath} does not exist on this machine, so no claim reaches every project here. It is not in any git repository and no push backs it up — a fresh machine has none until one is written. Writing that file would fill this.`
          : `${ledgerPath} could not be read (${err.code ?? 'unknown error'}) — this is "could not look", not "nothing here".`,
    };
  }

  let doc: unknown;
  try {
    doc = parseYamlSubset(text);
  } catch (e) {
    const err = e as { message?: string };
    return {
      present: false,
      path: ledgerPath,
      reason: `${ledgerPath} exists but the ledger's own parser refused it: ${err.message ?? 'unparseable'}. The parser is strict on purpose — it never guesses at a claim block — so this is a real problem with the file, not a display limitation.`,
    };
  }

  const claimsList = (doc as { claims?: unknown } | null)?.claims;
  if (!Array.isArray(claimsList)) {
    return {
      present: false,
      path: ledgerPath,
      reason: `${ledgerPath} exists and parsed, but carries no "claims:" list. An empty band here would say "no global claims", which is a different statement from "this file is not shaped like a ledger".`,
    };
  }

  const claims: GlobalClaim[] = [];
  const issues: string[] = [];
  claimsList.forEach((c, i) => {
    const where = `${ledgerPath} claims[${i}]`;
    const problems = validateClaim(c, where);
    if (problems.length > 0) {
      issues.push(...problems);
      return;
    }
    const claim = c as GlobalClaim;
    if (claim.scope !== 'global') {
      issues.push(`${where}: the global ledger may only hold scope:global claims`);
      return;
    }
    // source_file/source_line are what ledger.mjs stamps onto these same claims, so a row in
    // the view can name where a claim lives exactly as the ledger would.
    claims.push({ ...claim, source_file: '~/.warroom/ledger/global.yml', source_line: 0 });
  });

  return { present: true, path: ledgerPath, claims, rejected: issues.length, issues };
}

// ── waivers ──────────────────────────────────────────────────────────────────────────

export interface Waiver {
  claimId: string;
  until: string | null;
  reason: string;
  /**
   * True when the deadline has passed. A LAPSED WAIVER IS THE FINDING — rule 9's whole
   * point is that somebody promised to come back and did not, and resolvers.js says a lapsed
   * waiver fails harder than no disposition at all. The view must not render the two alike.
   */
  lapsed: boolean;
  /** Days past the deadline when lapsed, days remaining when not, null when `until` is not a date. */
  days: number | null;
}

/**
 * Every waiver among these claims, with lapsed computed by scripts/lib/resolvers.js's own
 * waiverState — not by a date comparison written here. See server/lib/claims.ts.
 */
export function collectWaivers(claims: GlobalClaim[], now = Date.now()): Waiver[] {
  const waivers: Waiver[] = [];
  for (const c of claims) {
    const d = c.disposition;
    if (!d || d.action !== 'waive') continue;
    const state = waiverState(c, now);
    waivers.push({
      claimId: c.id,
      until: d.until ?? null,
      reason: d.reason ?? '',
      lapsed: state.invalid ? true : state.lapsed,
      days: state.invalid ? null : state.days,
    });
  }
  // Lapsed first, then soonest deadline — the order somebody triaging them would want.
  waivers.sort((a, b) => {
    if (a.lapsed !== b.lapsed) return a.lapsed ? -1 : 1;
    return (a.until ?? '').localeCompare(b.until ?? '');
  });
  return waivers;
}

// ── the assembled view ───────────────────────────────────────────────────────────────

export interface ScopeBand {
  scope: 'project' | 'global';
  /** Where these claims were read from, as a display string. */
  source: string;
  claims: ClaimsSummary | Absent;
  verdicts: VerdictCounts | Absent;
  waivers: Waiver[] | Absent;
}

export interface BeliefSummary {
  project: string;
  /**
   * Whether a program was allowed to run for this project. CARRIED AS ITS OWN FIELD rather
   * than left to be inferred from `ledger.present === false`: "the verify failed" and "the
   * verify was never permitted to start" are different facts, and the view states the second
   * one at the top of the panel instead of in a tooltip on a band halfway down.
   */
  trust: TrustState;
  /**
   * COMPUTED, never configured: how many projects discovery walked off disk, and how many of
   * them carry a built claim ledger index. One is one population counted twice, so the
   * header's "N of M" cannot drift the way the Fleet headline's did.
   */
  fleet: { projectsDiscovered: number; projectsWithLedgerIndex: number };
  /** The whole-ledger verify — both scopes, one invocation. */
  ledger: LedgerVerifyResult;
  bands: ScopeBand[];
}

// The built index is a projection, and scripts/ledger.mjs's canonical() KEY_ORDER does not
// include `disposition` — so a project-scope waiver exists in the source artifact and is
// absent from .claude/ledger/index.json. Saying "no waivers" here would be a claim about
// something never read.
const PROJECT_WAIVERS_UNAVAILABLE =
  'Project-scope waivers are not in the built index: .claude/ledger/index.json is generated by scripts/ledger.mjs, whose canonical() key order omits `disposition`, so a waived project claim reaches this view with its disposition stripped. This is "not recorded here", not "none exist" — `node scripts/ledger.mjs sweep` reads the source artifacts and does report them. Adding `disposition` to that key order and rebuilding the index would fill this.';

export async function collectBelief(
  project: Project,
  projects: Project[],
  opts: { offline?: boolean; now?: number; globalLedgerPath?: string } = {}
): Promise<BeliefSummary> {
  const now = opts.now ?? Date.now();
  const global = readGlobalLedger(opts.globalLedgerPath ?? globalLedgerPath());

  // THE GATE FOR F2 AND F3, AND IT IS HERE RATHER THAN IN THE ROUTE BECAUSE THIS IS WHERE THE
  // SPAWN IS. runLedgerVerify runs `node <project>/scripts/ledger.mjs` — the project's own
  // file, as the user — and that script reaches `/bin/sh -c <string>` for any claim carrying
  // an `evidence.cmd`, which is read from the project's own markdown. Both were re-executed
  // through the real /api/belief route on 2026-08-15 before this line existed; the markers
  // held `ran as 501` and `uid=501(adamks)`.
  //
  // `!== true` rather than `=== false`: a Project assembled without a trust decision at all
  // (a hand-built object in a future caller) is UNTRUSTED, not trusted. Fail-closed is the
  // only direction that survives somebody forgetting.
  const trusted = project.trust?.trusted === true;
  const ledger: LedgerVerifyResult = trusted
    ? await runLedgerVerify(project.root, opts)
    : {
        present: false,
        reason:
          project.trust?.reason ??
          `${project.root} carries no trust decision, so no program was run for it. See server/trust.ts.`,
      };

  const projectClaims = project.ledgerIndex.present ? project.ledgerIndex.claims : [];
  const globalClaims = global.present ? global.claims : [];

  // One id → scope map, built from the two sets actually loaded above.
  const scopeOf = new Map<string, 'project' | 'global'>();
  for (const c of projectClaims) scopeOf.set(c.id, 'project');
  for (const c of globalClaims) scopeOf.set(c.id, 'global');

  const attributed = 'pass' in ledger ? attributeVerdicts(ledger, scopeOf) : null;
  const verdictsFor = (scope: 'project' | 'global'): VerdictCounts | Absent => {
    if (attributed === null) {
      return { present: false, reason: `no verify run to attribute: ${(ledger as Absent).reason}` };
    }
    if (!attributed.consistent) return { present: false, reason: attributed.reason as string };
    return attributed.byScope[scope];
  };

  const bands: ScopeBand[] = [
    {
      scope: 'project',
      source: project.ledgerIndex.path,
      claims: project.ledgerIndex.present
        ? summarizeClaims(projectClaims, now)
        : { present: false, reason: project.ledgerIndex.reason ?? 'no ledger index for this project' },
      verdicts: verdictsFor('project'),
      waivers: { present: false, reason: PROJECT_WAIVERS_UNAVAILABLE },
    },
    {
      scope: 'global',
      source: global.present ? global.path : (global as Absent & { path: string }).path,
      claims: global.present
        ? summarizeClaims(globalClaims, now)
        : { present: false, reason: global.reason },
      verdicts: global.present ? verdictsFor('global') : { present: false, reason: global.reason },
      waivers: global.present ? collectWaivers(globalClaims, now) : { present: false, reason: global.reason },
    },
  ];

  return {
    project: project.id,
    trust: project.trust ?? {
      trusted: false,
      source: 'unknown',
      reason: 'this Project carries no trust decision at all, so nothing was run for it',
    },
    fleet: {
      projectsDiscovered: projects.length,
      projectsWithLedgerIndex: projects.filter((p) => p.ledgerIndex.present).length,
    },
    ledger,
    bands,
  };
}
