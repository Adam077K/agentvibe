#!/usr/bin/env node
/**
 * check-citations.mjs — the citation-range checker.
 *
 * POSTURE: WARN. Exits 0 with findings reported. `--strict` exits 1. It is deliberately NOT wired
 * into `npm run check` or into CI by the PR that introduced it: turning it blocking is a separate,
 * higher-tier decision, and it should be made after someone has looked at a full run.
 * The ONE hard failure that exits 1 regardless of posture is the non-vacuity floor — see below.
 *
 * WHY IT EXISTS.
 * `scripts/ledger.mjs` at `lint` verifies that a cited claim ID *exists*. Nothing verifies that a
 * cited LINE RANGE supports the sentence citing it. Five of eight review findings over two days
 * were locators pointing at real content that did not say what was claimed. A line number in prose
 * rots the next time anyone edits the file above it — and nothing in this repo noticed, because
 * every one of those locators still resolved to a line that existed.
 * See docs/08-agents_work/handoffs/2026-08-23-after-p0.md, "the checker this repo keeps
 * recommending to itself". It has been recommended twice and built zero times.
 *
 * ── WHAT THIS CHECKS, AND WHAT IT CANNOT ─────────────────────────────────────────────────────
 *
 * READ THIS BEFORE TRUSTING A CLEAN RUN. Overclaiming here would recreate the exact defect the
 * checker is built to catch, so the boundary is stated up front rather than left to be discovered.
 *
 * It checks two things, and they are reported separately because their strengths differ:
 *
 *   EXISTENCE (deterministic, no false positives by construction)
 *     path-unresolved   the cited file resolves to no tracked file
 *     line-zero         `foo.js:0` — there is no line 0
 *     range-reversed    `foo.js:40-20`
 *     line-beyond-eof   `foo.js:9000` in a 500-line file
 *     range-beyond-eof  `foo.js:490-9000` in a 500-line file
 *
 *   DRIFT (heuristic, clause-anchored — see the precision note below)
 *     anchor-drift      the same clause names a symbol in an inline code span just before the
 *                       locator, and the nearest occurrence of that symbol in the cited file is
 *                       more than --anchor-slack lines away from the cited range.
 *
 * IT CANNOT JUDGE WHETHER THE PROSE IS SUPPORTED BY THE CONTENT. That requires reading both and
 * deciding, which is a reviewer's job and not a linter's. `--show` prints what is actually at each
 * cited range so a human can adjudicate; the checker itself never forms that opinion.
 *
 * THE HONEST LIMIT OF THE EXISTENCE CLASS, measured on this repo at 695800e: it found ZERO
 * violations across 817 locators. That is not a bug and it is not reassurance — it is the shape of
 * the problem. Every stale locator in the 2026-08-24 audit points at a line that EXISTS; the file
 * merely grew, or the content moved. An existence check cannot see that, and a run reporting
 * "0 existence findings" must not be read as "the citations are good."
 *
 * That measurement is the whole reason the DRIFT class exists. Without it this checker would be
 * a green light over a corpus of known-stale pointers.
 *
 * PRECISION OF THE DRIFT CLASS, stated as measured rather than as hoped. All figures at 695800e.
 *   The naive form — pair every code span on the line with every locator on the line — reported
 *   1,457 of 1,806 anchors (80.7%) and is useless. Three constraints make it usable, and each one
 *   was added because the measurement demanded it, not because it sounded principled:
 *     1. the anchor is the code span IMMEDIATELY PRECEDING the locator;
 *     2. the gap between them is ≤ --anchor-gap chars and holds no sentence break or table wall,
 *        so the two sit in one clause;
 *     3. the anchor is not itself path-like.
 *   Population 110 anchored citations, 46 reported at --anchor-slack 10.
 *
 *   Constraint 3 is the one worth explaining. `` `plan.js` at `coding.js:20` `` is a see-also, not
 *   an assertion that `plan.js` appears inside coding.js. Excluding path-like anchors removed 4 of
 *   8 `ABSENT` reports, every one a false positive of that shape.
 *
 *   Hand-checked sample, stated as a sample and not generalised into a precision rate: six of the
 *   findings under an earlier, stricter form of the rule. Five were genuine rot (`GATES` cited 890
 *   lines from its definition, `independenceIssue` 542, `VALID_MODELS` 51, `mcpConfigured` 25,
 *   `parallel()` 26). The sixth, `verifyFinding` at `qa.js:324-326`, was a FALSE POSITIVE — the
 *   citation is correct and points inside the function body, five lines below the name.
 *
 *   So the false-positive mode is known and named: citing a range INSIDE a definition by its
 *   behaviour, where the symbol itself sits just above the range. The default --anchor-slack 10
 *   suppresses it. Widen the slack to suppress more, at the cost of missing near-miss rot.
 *
 * ── BLIND SPOTS, named here rather than discovered during an incident ────────────────────────
 *
 *   · MARKDOWN ONLY. Locators in .js/.mjs/.yml comment blocks are not scanned. The harvester is
 *     markdown-aware (frontmatter, fenced blocks) and applying it to source comments would be
 *     wrong rather than merely incomplete. Sized before deciding: 2 locators of 819 tracked live
 *     outside markdown, both in .mjs. The gap is 0.2%.
 *   · The whole inline-code span must BE the locator. `` `see qa.js:100 for why` `` is not
 *     harvested, and neither is a multi-locator span like `` `qa.js:38, 65` ``.
 *   · AMBIGUOUS BASENAMES ARE NOT CHECKED. This repo cites by basename overwhelmingly — 653 of
 *     817 locators name `qa.js` or `schema-lint.js` rather than a repo-relative path. Those are
 *     resolved against `git ls-files` when exactly one tracked file carries that basename. When
 *     two or more do (`_TEMPLATE.md`, `api.ts`), the locator is counted `ambiguous` and checked
 *     against nothing. Guessing which file was meant is how a checker invents a finding.
 *   · The anchor must PRECEDE the locator. `` `qa.js:100` — `JSON.stringify` `` is not anchored.
 *   · A citation whose anchor sits in a DIFFERENT CLAUSE is not anchored, and this is the largest
 *     miss. Of the six known-stale locators the 2026-08-24 audit named, this checker reports two.
 *     Four are missed: three because a clause separates the symbol from the locator (a markdown
 *     table cell wall in `PROMPT-STANDARD.md:369`, prose in `MODEL-DIVERSITY.md:306` and `:529`)
 *     and one because no code span precedes the locator at all (the handoff's own `qa.js:215-218`).
 *     Loosening constraint 2 to reach them re-admits the false positives it exists to exclude.
 *   · A locator inside a fenced code block is invisible, by design: `proseCodeSpans` skips fences,
 *     because an example in a fence is an example and not a citation.
 *   · Resolution uses `git ls-files`, so an UNTRACKED file is invisible. That is the right source
 *     — it inherits .gitignore rather than growing a second exclude list — and CI only ever sees
 *     tracked files, so the gap is local-only.
 *
 * NON-VACUITY. `--min-locators` is a hard floor and it FAILS (exit 1) even in WARN posture. A
 * checker that silently finds nothing reads as "everything is fine", which is this repo's
 * documented failure mode; see the pre-history in check-dispatch-agenttype.mjs. The default floor
 * is 400 against 817 harvested at 695800e — headroom for real doc deletion, not for a broken
 * harvester.
 *
 * REUSE. The harvester is `proseCodeSpans`, imported from scripts/ledger.mjs rather than copied.
 * Two implementations of "what counts as prose here" would disagree on the first unclosed fence.
 * The skip filter follows the shape of the dead-path check in scripts/check-registration.mjs.
 *
 * Usage:
 *   node scripts/check-citations.mjs [--root DIR] [--strict] [--json] [--show]
 *     --min-locators N    non-vacuity floor (default 400)
 *     --anchor-slack N    lines of tolerance for the drift class (default 10)
 *     --anchor-gap N      max chars between anchor and locator for them to count as one clause
 *                         (default 30)
 *     --no-anchors        existence class only
 *     --show              print the content at each flagged range
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { proseCodeSpans } from './ledger.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const optOf = (name, dflt) => {
  const i = argv.indexOf(name);
  return i === -1 || i + 1 >= argv.length ? dflt : argv[i + 1];
};
const ROOT = path.resolve(optOf('--root', REPO));
const MIN_LOCATORS = Number(optOf('--min-locators', '400'));
const ANCHOR_SLACK = Number(optOf('--anchor-slack', '10'));
const ANCHOR_GAP = Number(optOf('--anchor-gap', '30'));
const ANCHORS = !argv.includes('--no-anchors');
const STRICT = argv.includes('--strict');
const JSON_OUT = argv.includes('--json');
const SHOW = argv.includes('--show');

const findings = [];  // citation problems — WARN unless --strict
const failures = [];  // non-vacuity / harness problems — always exit 1
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);

/**
 * A locator: the whole code span is `<path>:<n>` or `<path>:<n>-<m>`.
 *
 * The extension must START WITH A LETTER. That single constraint is what keeps `127.0.0.1:3000`
 * and version-like `1.438:2` out of the population — both otherwise match, because a trailing
 * `.1` reads as an extension. Found by running the first draft over this repo.
 */
const LOCATOR_RE = /^([A-Za-z0-9._][A-Za-z0-9._/-]*\.[A-Za-z][A-Za-z0-9]{0,4}):(\d+)(?:-(\d+))?$/;

/**
 * Templates and plainly illustrative paths, following the shape of the dead-path filter in
 * check-registration.mjs so the two do not drift into different answers to "is this a real path".
 *
 * IT IS DELIBERATELY NARROWER THAN THAT ONE, and the reason matters: check-registration.mjs
 * filters arbitrary backticked strings, so it must exclude `[`, `]`, `{`, `}`, `*`, `<`, `>`, `$`
 * and `|` itself. Here LOCATOR_RE has already done that — none of those characters is in its path
 * character class, so a glob like `.claude/hooks/*.js:12` is never a locator candidate in the
 * first place and never reaches this function. Restating those exclusions here would be code that
 * cannot run, which reads as protection and provides none. What remains is what LOCATOR_RE lets
 * through and a human would still call illustrative.
 */
const skip = (p) =>
  // A filename template: `docs/08-agents_work/sessions/YYYY-MM-DD-role-slug.md:5`.
  /YYYY|\.\.\./.test(p) ||
  // `exact/path/to/existing.py` and friends: a documented placeholder, not a citation.
  /(^|\/)(path\/to|your|example|foo|bar)(\/|$)/i.test(p);

/** Tracked files, or a filesystem walk when ROOT is not a checkout (a --root fixture). */
function trackedFiles() {
  let list = [];
  try {
    // stderr is dropped: when ROOT is not a checkout git prints "fatal: not a git repository"
    // to the parent's stderr, which reads like a failure of this check rather than a fallback.
    list = execFileSync('git', ['ls-files'], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).split('\n').filter(Boolean);
  } catch { /* fall through to the walk */ }
  if (list.length) return list;

  const walk = (relDir) => {
    const acc = [];
    const absDir = path.join(ROOT, relDir);
    if (!fs.existsSync(absDir)) return acc;
    for (const e of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (['node_modules', '.git', '.worktrees'].includes(e.name)) continue;
      const rel = relDir ? `${relDir}/${e.name}` : e.name;
      if (e.isDirectory()) acc.push(...walk(rel));
      else acc.push(rel);
    }
    return acc;
  };
  return walk('');
}

const tracked = trackedFiles();
const trackedSet = new Set(tracked);

/** basename -> [tracked paths], for the basename idiom this repo actually writes in. */
const byBasename = new Map();
for (const f of tracked) {
  const b = path.basename(f);
  if (!byBasename.has(b)) byBasename.set(b, []);
  byBasename.get(b).push(f);
}

/**
 * Resolve a cited path to a tracked file. Three rungs, each requiring a UNIQUE answer:
 * exact tracked path, unique basename, unique path suffix. Anything else is `ambiguous`
 * (candidates exist but we cannot know which) or `unresolved` (none do).
 */
function resolvePath(cited) {
  if (trackedSet.has(cited)) return { how: 'exact', file: cited };

  if (!cited.includes('/')) {
    const hits = byBasename.get(cited) || [];
    if (hits.length === 1) return { how: 'basename', file: hits[0] };
    if (hits.length > 1) return { how: 'ambiguous', candidates: hits };
    return { how: 'unresolved' };
  }

  const suffix = tracked.filter((f) => f.endsWith(`/${cited}`));
  if (suffix.length === 1) return { how: 'suffix', file: suffix[0] };
  if (suffix.length > 1) return { how: 'ambiguous', candidates: suffix };
  return { how: 'unresolved' };
}

const lineCache = new Map();
function linesOf(rel) {
  if (!lineCache.has(rel)) {
    let text = '';
    try { text = fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { /* unreadable */ }
    lineCache.set(rel, text.split('\n'));
  }
  return lineCache.get(rel);
}

const record = (kind, where, message, extra = {}) =>
  findings.push({ kind, where, message, ...extra });

// ── harvest ───────────────────────────────────────────────────────────────────────────────────

const proseFiles = tracked.filter((f) => f.endsWith('.md'));
if (!proseFiles.length) {
  fail('non-vacuity', `no tracked .md files under ${ROOT} — this check would pass by looking at nothing.`);
}

const stats = {
  files_scanned: proseFiles.length,
  locators: 0, skipped: 0,
  resolved: { exact: 0, basename: 0, suffix: 0 },
  ambiguous: 0, unresolved: 0,
  anchors_checked: 0,
};

for (const doc of proseFiles) {
  let text;
  try { text = fs.readFileSync(path.join(ROOT, doc), 'utf8'); } catch { continue; }
  if (!text.includes(':')) continue; // cheap pre-filter; no locator can exist without one

  const rawLines = text.split('\n');

  // Group the harvested spans by line, so a locator can find the anchor that precedes it. The
  // harvest itself — which lines are prose at all — stays with proseCodeSpans.
  const proseLines = new Map();
  for (const s of proseCodeSpans(text)) {
    if (!proseLines.has(s.line)) proseLines.set(s.line, []);
    proseLines.get(s.line).push(s.code);
  }

  for (const [lineNo, codes] of proseLines) {
    if (!codes.some((c) => LOCATOR_RE.test(c))) continue;

    // Recover column offsets by re-matching the raw line. Safe because proseCodeSpans has already
    // ruled this line prose: we are re-reading a line it approved, not re-deciding which lines.
    const raw = rawLines[lineNo - 1] ?? '';
    const spans = [...raw.matchAll(/`([^`\n]+)`/g)].map((m) => ({
      text: m[1].trim(), start: m.index, end: m.index + m[0].length,
    }));

    for (let k = 0; k < spans.length; k++) {
      const m = LOCATOR_RE.exec(spans[k].text);
      if (!m) continue;

      const [, citedPath, startStr, endStr] = m;
      const where = `${doc}:${lineNo}`;
      const locator = spans[k].text;

      if (skip(citedPath)) { stats.skipped++; continue; }
      stats.locators++;

      const start = Number(startStr);
      const end = endStr === undefined ? start : Number(endStr);

      if (start === 0 || end === 0) {
        record('line-zero', where, `\`${locator}\` names line 0. Files start at line 1.`);
        continue;
      }
      if (endStr !== undefined && end < start) {
        record('range-reversed', where,
          `\`${locator}\` runs backwards — the range ends at ${end} and starts at ${start}.`);
        continue;
      }

      const res = resolvePath(citedPath);
      if (res.how === 'ambiguous') {
        stats.ambiguous++;
        continue; // named, not guessed — see the blind-spot list in the header
      }
      if (res.how === 'unresolved') {
        stats.unresolved++;
        record('path-unresolved', where,
          `\`${locator}\` names \`${citedPath}\`, which matches no tracked file — not as a path, ` +
          'not as a unique basename, and not as a unique path suffix.');
        continue;
      }
      stats.resolved[res.how]++;

      const target = res.file;
      const lines = linesOf(target);
      const eof = lines.length;

      if (start > eof) {
        record('line-beyond-eof', where,
          `\`${locator}\` names line ${start} of ${target}, which has ${eof} lines.`,
          { target, start: Math.min(start, eof), end: eof });
        continue;
      }
      if (end > eof) {
        record('range-beyond-eof', where,
          `\`${locator}\` ends at line ${end} of ${target}, which has ${eof} lines.`,
          { target, start, end: eof });
        continue;
      }

      // ── drift: the anchor immediately preceding the locator ────────────────────────────────
      if (!ANCHORS || k === 0) continue;
      const prev = spans[k - 1];
      if (LOCATOR_RE.test(prev.text)) continue; // two locators in a row anchor nothing

      // The anchor and the locator must sit in the SAME CLAUSE. Two constraints do that: a short
      // gap, and no sentence break inside it. Pairing every span on the line instead is how the
      // naive version reached an 80.7% report rate and became unusable.
      const between = raw.slice(prev.end, spans[k].start);
      if (between.length > ANCHOR_GAP) continue;
      if (/[.;:!?]\s|\|/.test(between)) continue; // clause boundary, or a markdown table cell wall

      // A FILENAME IS A CROSS-REFERENCE, NOT A SYMBOL ANCHOR. `` `plan.js` at `coding.js:20` ``
      // says "see also", and demanding that `plan.js` appear inside coding.js manufactures a
      // finding. Excluding path-like anchors removed 4 of the 8 `ABSENT` reports on this repo,
      // every one of them a false positive of exactly that shape.
      if (prev.text.includes('/') || /\.[A-Za-z][A-Za-z0-9]{0,4}$/.test(prev.text)) continue;

      const tokens = [...new Set(prev.text.match(/[A-Za-z_$][A-Za-z0-9_$]{3,}/g) || [])];
      if (!tokens.length) continue;
      stats.anchors_checked++;

      // Distance from the cited range to the nearest line mentioning any token. 0 means the
      // symbol is inside the range.
      let distance = Infinity;
      for (let n = 0; n < eof; n++) {
        if (!tokens.some((t) => lines[n].includes(t))) continue;
        const ln = n + 1;
        const d = ln < start ? start - ln : ln > end ? ln - end : 0;
        if (d < distance) distance = d;
        if (distance === 0) break;
      }

      if (distance > ANCHOR_SLACK) {
        const range = start === end ? `line ${start}` : `lines ${start}-${end}`;
        const dist = distance === Infinity
          ? `\`${prev.text}\` appears nowhere in ${target}`
          : `the nearest mention of \`${prev.text}\` in ${target} is ${distance} line(s) from ${range}`;
        record('anchor-drift', where,
          `\`${locator}\` is cited for \`${prev.text}\`, but ${dist}. The pointer has probably ` +
          'rotted; read the range before relying on it.',
          { target, start, end, distance: distance === Infinity ? null : distance, anchor: prev.text });
      }
    }
  }
}

// ── non-vacuity ───────────────────────────────────────────────────────────────────────────────
if (stats.locators < MIN_LOCATORS) {
  fail('non-vacuity',
    `harvested ${stats.locators} locator(s), floor is ${MIN_LOCATORS}. Either the docs really lost ` +
    'that many citations (then lower the floor deliberately, in the same PR) or the harvester ' +
    'stopped seeing them. A checker that finds nothing must fail, not report clean.');
}

// ── report ────────────────────────────────────────────────────────────────────────────────────

const byKind = {};
for (const f of findings) byKind[f.kind] = (byKind[f.kind] || 0) + 1;
const existence = findings.filter((f) => f.kind !== 'anchor-drift');
const drift = findings.filter((f) => f.kind === 'anchor-drift');

/** The content at a flagged range, so a human can adjudicate what the checker will not. */
function excerpt(f) {
  if (!f.target || !f.start) return null;
  return linesOf(f.target)
    .slice(f.start - 1, f.end)
    .map((l, i) => `      ${f.start + i} | ${l}`)
    .join('\n');
}

if (JSON_OUT) {
  console.log(JSON.stringify({
    root: ROOT, posture: STRICT ? 'strict' : 'warn',
    anchor_slack: ANCHOR_SLACK, anchors_enabled: ANCHORS, min_locators: MIN_LOCATORS,
    stats, by_kind: byKind, findings, failures,
  }, null, 2));
  process.exit(failures.length || (STRICT && findings.length) ? 1 : 0);
}

for (const f of existence) {
  console.log(`⚠ [${f.kind}] ${f.where}: ${f.message}`);
  if (SHOW) { const e = excerpt(f); if (e) console.log(e); }
}
for (const f of drift.sort((a, b) => (b.distance ?? Infinity) - (a.distance ?? Infinity))) {
  console.log(`⚠ [${f.kind}] ${f.where}: ${f.message}`);
  if (SHOW) { const e = excerpt(f); if (e) console.log(e); }
}
for (const f of failures) console.error(`✗ ${f}`);

const scanned =
  `${stats.locators} locator(s) in ${stats.files_scanned} markdown file(s) — ` +
  `${stats.resolved.exact} exact · ${stats.resolved.basename} by basename · ` +
  `${stats.resolved.suffix} by suffix · ${stats.ambiguous} ambiguous (not checked) · ` +
  `${stats.skipped} skipped as illustrative`;

if (failures.length) {
  console.error(`\n✗ citation check FAILED — ${failures.length} harness problem(s). ${scanned}`);
  process.exit(1);
}

if (findings.length) {
  console.log(
    `\n⚠ citation check: ${existence.length} existence finding(s), ${drift.length} drift finding(s) ` +
    `over ${stats.anchors_checked} anchored citation(s) at --anchor-slack ${ANCHOR_SLACK}.\n` +
    `  ${scanned}\n` +
    `  Posture: ${STRICT ? 'STRICT — exiting 1' : 'WARN — does not block'}. ` +
    'Drift findings are heuristic; re-read before editing. This check cannot tell whether the ' +
    'prose is supported by the content it points at — only whether the pointer still lands.'
  );
  process.exit(STRICT ? 1 : 0);
}

console.log(
  `\n✓ citation check passed — no existence or drift findings. ${scanned}\n` +
  '  NOTE: this verifies that pointers LAND, not that the prose they support is true.'
);
