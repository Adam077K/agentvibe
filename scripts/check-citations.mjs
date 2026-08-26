#!/usr/bin/env node
/**
 * check-citations.mjs — the citation-range checker.
 *
 * POSTURE: SPLIT, as of 2026-08-26 — the EXISTENCE class BLOCKS and the DRIFT class WARNS.
 * The ONE hard failure that exits 1 regardless of posture is the non-vacuity floor — see below.
 *
 *   `check:citations-exist`   node scripts/check-citations.mjs --no-anchors --strict
 *                             --external-prefix adamos
 *                             A STEP of `npm run check` and a step of ci.yml. Existence only.
 *   `check:citations`         the full run, drift included, WARN. Not a step; run it by hand.
 *
 * WHY THE SPLIT, AND WHY IT IS NOT "HALF-WIRED". This header used to read "deliberately NOT wired
 * into `npm run check` or into CI by the PR that introduced it: turning it blocking is a separate,
 * higher-tier decision, and it should be made after someone has looked at a full run." That run
 * happened (2 existence · 85 drift · 19 unchecked over 851 locators), and the decision made on it
 * was to promote ONE class. The two classes differ in kind, and the numbers below are the reason:
 * existence is deterministic with no false positives by construction — a pointer that does not
 * land is a hard fact — while drift is heuristic, covers about a quarter of the corpus, and rests
 * on a resolution that is ~85% by BASENAME, which this file's own blind-spot list says may be the
 * wrong file. Blocking on a heuristic with a named wrong-file hazard would teach contributors to
 * route around the checker, which costs more than the class is worth. DO NOT PROMOTE DRIFT
 * without first raising exact-path resolution; the flag to run it is `--strict` with anchors on.
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
 *     path-unresolved   the cited file resolves to no tracked file. Carries a did-you-mean when
 *                       exactly one tracked basename ends with the cited one — a rename such as
 *                       `ENFORCEMENT-DIAGNOSTIC.md` → `2026-08-11-ENFORCEMENT-DIAGNOSTIC.md`
 *                       reads as "deleted" without it, and a reader told "gone" stops looking
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
 * ── ON THE NUMBERS IN THIS HEADER ────────────────────────────────────────────────────────────
 *
 * THIS FILE DOES NOT QUOTE CORPUS COUNTS, AND THAT IS DELIBERATE. A header arguing that a number
 * in prose rots, while quoting numbers that rot, is the defect it was built to catch. Earlier
 * drafts carried "815 locators", "209 anchored" and both "76 reported" and "75 drift findings" —
 * two descriptions of one measurement, already disagreeing, and every one of them due to move the
 * next time this branch rebases or a cited file grows.
 *
 * THE AUTHORITATIVE FIGURES ARE PRINTED, NOT WRITTEN. `npm run check:citations` ends with a
 * coverage block — resolution split, drift coverage, unchecked count — on every path including
 * the passing one. Read that. What this header states instead are SHAPES, which survive a rebase:
 * "most locators are not exact paths", "drift coverage is a minority", "the existence class finds
 * almost nothing". Where a specific case is named it is a worked EXAMPLE, kept because it is
 * argued from, and each one names the file and symbol so a reader can re-derive it.
 *
 * THE HONEST LIMIT OF THE EXISTENCE CLASS: it finds almost nothing on this repo — a couple of dead
 * paths and NO bad line numbers at all. That is not a bug and it is not reassurance; it is the
 * shape of the problem. Every stale locator in the 2026-08-24 audit points at a line that EXISTS;
 * the file merely grew, or the content moved. An existence check cannot see that, and a run
 * reporting "0 existence findings" must not be read as "the citations are good."
 *
 * That measurement is the whole reason the DRIFT class exists. Without it this checker would be
 * a green light over a corpus of known-stale pointers.
 *
 * PRECISION OF THE DRIFT CLASS, stated as measured rather than as hoped. Figures on this repo.
 *   The naive form — pair every code span on the line with every locator on the line — reported
 *   1,457 of 1,806 anchors (80.7%) and is useless. Five constraints make it usable, and every one
 *   was added because a measurement or a review finding demanded it, not because it sounded
 *   principled:
 *     1. the anchor is the code span adjacent to the locator, on EITHER side;
 *     2. the gap between them is ≤ --anchor-gap chars and holds no sentence break or table wall;
 *     3. the anchor is not path-like and is not a top-level directory name;
 *     4. a FOLLOWING span reached across a conjunction or an additive separator is a sibling list
 *        item, not an anchor;
 *     5. token matching is word-bounded.
 *   The surviving population and report count are printed by the checker, not quoted here.
 *
 *   Constraints 1, 3 and 4 came from an independent review that reproduced four false positives,
 *   and each is pinned by a named test in check-citations.test.mjs:
 *     · reading only BACKWARDS anchored PRODUCERS.md:191 on `FleetView` while the symbol the
 *       sentence asserts, `windowUsage`, sat after the locator and is on the cited line;
 *     · `mission-control` at CONTROL-PLANE.md:395 is a directory — no slash, no extension — so it
 *       passed the path-like test and demanded a second exclusion;
 *     · `` `designer.md:7`, and `REQUIRED_FRONTMATTER` `` enumerates; it does not cite;
 *     · a BARE comma is NOT a list separator — `` (`collectors/fleet.ts:14`, `windowUsage`) `` is
 *       a parenthetical citation, and excluding every comma re-broke the first case. What marks a
 *       list is the conjunction.
 *
 *   THE CROSS-REFERENCE CLASS IS NARROWED BY FOUR SEPARATE RULES, NOT ONE, AND THERE IS NO GENERAL
 *   TEST FOR IT. "This span is a see-also, not a citation" is a judgement, and each rule below
 *   catches one SHAPE of it — path-like (`plan.js`), directory (`mission-control`), conjunction
 *   (`, and`), arrow (`→`). A cross-reference wearing none of those four shapes still reports.
 *   Do not read the list as coverage of the class; read it as four measured subclasses.
 *   Measured after all four: exactly ONE drift finding has its symbol absent from the target
 *   entirely — `.env.example` at 2026-08-13-rethink-board.md:48 — and that one is a TRUE positive
 *   (line 163 of pre-tool-use.sh is unrelated; the string appears nowhere in the file). An earlier
 *   draft excluded dotted filenames to suppress it, which would have deleted a real finding.
 *
 *   THREE KNOWN FALSE-POSITIVE MODES REMAIN. Each is one SHAPE, not a scatter of separate rots,
 *   and a reader who recognises the shape can dismiss the whole group at once:
 *
 *     1. Citing a range INSIDE a definition by its behaviour, with the symbol just ABOVE the
 *        range. `verifyFinding` at `qa.js:324-326` — the citation is correct, the name is five
 *        lines up. --anchor-slack 10 suppresses this direction.
 *     2. The MIRROR of 1, and NOT suppressed: citing the top of a COMMENT BLOCK that documents a
 *        symbol declared below it. `schema-lint.js:62` is the comment "Engines that must never be
 *        able to change what they look at."; `READ_ONLY_ENGINES` is declared at 75. Distance 13
 *        against a slack of 10, so it reports — twice, from ROSTER-SIZE.md:298 and
 *        DESIGNER.md:416. The citation is arguably the better one: it points at the reason rather
 *        than the constant. Do NOT widen the slack to chase this. It would trade a named blind
 *        spot for an unnamed loss of recall, and the rot worth finding is mostly 25-900 lines out
 *        — the 11-15 distance band holds 13 findings and this shape is only part of it.
 *     3. A parameter RENAMED at a function boundary. `check-dispatch-agenttype.mjs:267-268` is
 *        `function agentInfo(name)`; the prose calls the same value `agentType`. Three findings
 *        share this shape. A linter cannot follow a rename without resolving the call graph, so
 *        this one is structural rather than a tuning question.
 *
 * ── BLIND SPOTS, named here rather than discovered during an incident ────────────────────────
 *
 *   · MARKDOWN ONLY. Locators in .js/.mjs/.yml comment blocks are not scanned. The harvester is
 *     markdown-aware (frontmatter, fenced blocks) and applying it to source comments would be
 *     wrong rather than merely incomplete. Sized before deciding, and worth re-deriving rather
 *     than trusting: nearly every locator outside markdown is in THIS FILE and its test — prose
 *     ABOUT citations, not citations. Discount those and the real gap is a couple of locators in
 *     check-dispatch-agenttype.mjs. The raw count overstates the gap by more than an order of
 *     magnitude, which is the kind of number this checker exists to stop people repeating.
 *   · The whole inline-code span must BE the locator. `` `see qa.js:100 for why` `` is not
 *     harvested, and neither is a multi-locator span like `` `qa.js:38, 65` ``.
 *   · BASENAME RESOLUTION CAN OPEN THE WRONG FILE, AND THIS IS THE LARGEST HAZARD HERE. Only about
 *     one locator in seven is written as a path this checker can resolve exactly; the rest resolve
 *     by bare basename or by suffix. A unique basename is not proof the author meant that file,
 *     and the error runs BOTH ways:
 *       - a correct citation reported as out-of-range, because the line was checked against a
 *         same-named file the prose never meant;
 *       - worse, a genuinely DEAD pointer passing silently, because the cited line happens to
 *         exist in the same-named file that was opened instead.
 *     The second is the dangerous one: it is a false negative wearing a tick. Not hypothetical —
 *     GRANT-HOLDERS.md:266 cites `adamos/.claude/agents/archivist.md`, a file in a DIFFERENT
 *     PROJECT, and only its directory prefix keeps it from silently resolving here.
 *     Mitigation, not cure: every finding names the file it actually opened and says when that
 *     came from a basename or suffix match, and the coverage line prints the exact/inferred split
 *     on every run including the passing one. A reader can then check the inference. The checker
 *     cannot.
 *   · AMBIGUOUS BASENAMES ARE NOT CHECKED. When two or more tracked files carry the name
 *     (`_TEMPLATE.md`, `DECISIONS.md`), the locator is reported as `unchecked:ambiguous` with its
 *     candidates listed, and checked against none of them. Guessing which file was meant is how a
 *     checker invents a finding. The run prints how many are in this state.
 *   · A citation whose anchor sits in a DIFFERENT CLAUSE is not anchored, and this is the largest
 *     miss. Of the six known-stale locators the 2026-08-24 audit named, this checker reports two
 *     (`CONTROL-PLANE.md:985`, `MODEL-DIVERSITY.md:304`). Four are missed, each for a checked
 *     reason: a markdown table cell wall at `PROMPT-STANDARD.md:369`; a clause at
 *     `MODEL-DIVERSITY.md:306`; a 31-character gap at `:529`, one over the 30-char limit; and no
 *     adjacent code span at all in the handoff's own `qa.js:215-218`. Loosening constraint 2 to
 *     reach them re-admits the false positives it exists to exclude — that trade was measured, not
 *     assumed.
 *   · DRIFT COVERAGE IS A MINORITY OF THE CORPUS: roughly a quarter of locators have an anchor to
 *     check at all. The other 606 get existence checks only, which above is shown to find almost
 *     nothing. Do not read a run with few findings as a clean corpus; read the coverage line,
 *     which is printed on every path including the passing one for exactly this reason.
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
 *     --external-prefix P a path prefix belonging to another repository (repeatable). Locators
 *                         under it are reported as `unchecked:external` instead of dead. Empty by
 *                         default: nothing is excused unless someone names it, because guessing
 *                         that a prefix "looks foreign" would turn a typo into a silent pass.
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
/**
 * Path prefixes belonging to OTHER repositories, declared explicitly and repeatable. Empty by
 * default, so nothing is ever silenced by accident: a locator is excused from the dead-path check
 * only because someone named its prefix, never because the checker guessed it looked foreign.
 * Guessing here would turn a typo (`scriptz/foo.js:1`) into a silent pass.
 */
const EXTERNAL_PREFIXES = argv.reduce(
  (acc, a, i) => (a === '--external-prefix' && argv[i + 1] ? [...acc, argv[i + 1]] : acc), [],
);
const STRICT = argv.includes('--strict');
const JSON_OUT = argv.includes('--json');
const SHOW = argv.includes('--show');

const findings = [];  // citation problems — WARN unless --strict
const failures = [];  // non-vacuity / harness problems — always exit 1
const unchecked = []; // locators this checker looked at and could NOT decide — never a failure
const inventory = []; // every RESOLVED locator and what it resolved to — --json only, see R5
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

/**
 * The one tracked file a dead locator most plausibly meant, or null.
 *
 * Only a UNIQUE basename-suffix match counts — `ENFORCEMENT-DIAGNOSTIC.md` resolves to
 * `docs/06-codebase/2026-08-11-ENFORCEMENT-DIAGNOSTIC.md` because exactly one tracked basename
 * ends with it. Two candidates means no suggestion: a wrong "did you mean" is worse than none,
 * because it will be acted on.
 */
function suggestFor(cited) {
  const base = cited.slice(cited.lastIndexOf('/') + 1);
  if (base.length < 4) return null;
  const hits = tracked.filter((f) => {
    const b = path.basename(f);
    return b !== base && (b.endsWith(`-${base}`) || b.endsWith(`.${base}`) || b.endsWith(`_${base}`));
  });
  return hits.length === 1 ? hits[0] : null;
}

const lineCache = new Map();
/**
 * The lines of a file, with the trailing empty element dropped.
 *
 * `'a\nb\n'.split('\n')` is `['a', 'b', '']` — length 3 for a 2-line file. POSIX text files end
 * in a newline, so that was +1 for essentially every real file: a locator one line past the true
 * end passed silently, and every EOF number this checker printed was wrong by one. The fixture in
 * check-citations.test.mjs was built with `join('\n')`, which produces no trailing newline, so it
 * could not reproduce the shape of any file on disk and the guard test passed over the bug.
 * Only ONE element is dropped — a file genuinely ending in a blank line keeps it.
 */
function linesOf(rel) {
  if (!lineCache.has(rel)) {
    let text = '';
    try { text = fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { /* unreadable */ }
    const lines = text.split('\n');
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    lineCache.set(rel, lines);
  }
  return lineCache.get(rel);
}

const record = (kind, where, message, extra = {}) =>
  findings.push({ kind, where, message, ...extra });

/**
 * A sentence or clause boundary, or a markdown table cell wall.
 *
 * THE EMPHASIS RUN IS THE POINT. `**bold.**` is pervasive in this repo's prose, and there the `.`
 * is followed by `*`, not by whitespace — so a bare `/[.;:!?]\s/` saw no boundary and paired an
 * anchor from the PREVIOUS sentence with this sentence's locator. Reproduced at
 * 2026-08-13-rethink-board.md:94, gap `" is decorative.** "`.
 *
 * AN ARROW IS A FLOW CONNECTOR, NOT A CLAUSE. `` `newproject` → `init-from-template.sh:124` →
 * `install-war-room.sh` `` is a call chain: it says the first leads to the second, not that the
 * first is AT the second. `newproject` appears nowhere in that file, so it reported as drift.
 * TARGET-ARCHITECTURE.md:148.
 */
const CLAUSE_BREAK = /[.;:!?][*_`)\]]*\s|\||→|⇒|->/;

/** Two spans sit in one clause when the gap is short and holds no boundary. */
const sameClause = (gap) => gap.length <= ANCHOR_GAP && !CLAUSE_BREAK.test(gap);

/**
 * A span FOLLOWING the locator across a list separator is a sibling item, not an anchor.
 *
 * `` `designer.md:7`, and `REQUIRED_FRONTMATTER` `` enumerates two places maxTurns is declared; it
 * does not assert that REQUIRED_FRONTMATTER is at designer.md:7. Same for `` `resolvers.js:307` +
 * correct `model_families` ``, which is a work item, not a citation. Both were false positives in
 * a hand-checked sample of the newly-anchored population, and both are list continuations.
 *
 * A BARE COMMA IS NOT ONE, and the distinction is load-bearing: `` (`collectors/fleet.ts:14`,
 * `windowUsage`) `` is a parenthetical citation naming the file and then the symbol it is cited
 * for — the exact case the review raised as a false positive. Excluding every comma re-broke it.
 * What marks a list is a CONJUNCTION or an additive separator, not the comma itself. Appositives
 * — `` (`cmdVerify`) ``, `` validates only `task` `` — carry neither.
 */
const LIST_CONTINUATION = /^[\s)\]]*(?:[+/·&]|,\s*(?:and|or)\b|and\b|or\b)/i;

/**
 * Every top-level directory of the tree. A span naming one is a location, not a symbol: demanding
 * that `mission-control` appear inside scripts/lib/usage.js manufactures a finding, which is what
 * it did at CONTROL-PLANE.md:395. `mission-control` passes the path-like test — no slash, no
 * extension — so it needs this second exclusion rather than a wider first one.
 */
const topLevelDirs = new Set(
  tracked.filter((f) => f.includes('/')).map((f) => f.slice(0, f.indexOf('/'))),
);

// ── --external-prefix may not name a directory of THIS repository ────────────
//
// REFUSED, not warned. `--external-prefix scripts` turns `scripts/reeal.js:1` — a typo for a file
// that is right there — into `unchecked:external`, and the run ends on a tick. That is precisely
// the failure the empty default exists to prevent, handed to the operator as a flag: this header
// argues that guessing "looks foreign" would turn a typo into a silent pass, and then let a human
// do the guessing. A prefix that IS a tracked directory cannot be external by definition, so there
// is no legitimate use to preserve and nothing is lost by refusing it.
//
// It joins `failures`, so it exits 1 in WARN posture too. A misconfigured checker must not report.
for (const p of EXTERNAL_PREFIXES) {
  if (topLevelDirs.has(p)) {
    fail('external-prefix',
      `--external-prefix ${p} names a directory of this repository, so paths under it are not ` +
      `external and would be excused from the dead-path check. \`${p}/reeal.js:1\` would report ` +
      `clean with \`${p}/real.js\` sitting next to it. Drop the flag, or name the prefix of ` +
      'another repository.');
  }
}

/**
 * The symbols an anchor span asserts, or null when the span is not a symbol anchor at all.
 *
 * A FILENAME OR A DIRECTORY IS A CROSS-REFERENCE. `` `plan.js` at `coding.js:20` `` says "see
 * also"; it does not assert that `plan.js` appears inside coding.js.
 */
function anchorTokens(text) {
  if (text.includes('/') || /\.[A-Za-z][A-Za-z0-9]{0,4}$/.test(text)) return null;
  if (topLevelDirs.has(text)) return null;
  const tokens = [...new Set(text.match(/[A-Za-z_$][A-Za-z0-9_$]{3,}/g) || [])]
    .filter((t) => !topLevelDirs.has(t));
  return tokens.length ? tokens : null;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Distance in lines from [start,end] to the nearest mention of any token; 0 when inside the range,
 * Infinity when the symbol is absent from the file.
 *
 * MATCHING IS WORD-BOUNDED. A bare `String.includes` let `pass` be satisfied by `bypass` and
 * `password`, so a rotted pointer to a common short symbol resolved against an unrelated word and
 * never fired.
 */
function nearestDistance(lines, tokens, start, end) {
  const res = tokens.map((t) => new RegExp(`(^|[^A-Za-z0-9_$])${escapeRe(t)}([^A-Za-z0-9_$]|$)`));
  let best = Infinity;
  for (let n = 0; n < lines.length; n++) {
    if (!res.some((re) => re.test(lines[n]))) continue;
    const ln = n + 1;
    const d = ln < start ? start - ln : ln > end ? ln - end : 0;
    if (d < best) best = d;
    if (best === 0) break;
  }
  return best;
}

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
        // Named, not guessed — but recorded, so a reader can act on it. Counting them and then
        // withholding WHICH they are leaves nothing anyone can do.
        unchecked.push({
          where, locator, cited: citedPath, reason: 'ambiguous', candidates: res.candidates,
        });
        continue;
      }
      if (res.how === 'unresolved') {
        // `indexOf` returns -1 with no slash, and slice(0,-1) would silently chop the last
        // character — which is how `ENFORCEMENT-DIAGNOSTIC.md` first reported itself as living in
        // a directory called `ENFORCEMENT-DIAGNOSTIC.m/`.
        const slash = citedPath.indexOf('/');
        const prefix = slash > 0 ? citedPath.slice(0, slash) : '';
        if (prefix && EXTERNAL_PREFIXES.includes(prefix)) {
          unchecked.push({ where, locator, cited: citedPath, reason: 'external', candidates: [] });
          continue;
        }
        stats.unresolved++;
        // DID YOU MEAN. "Matches no tracked file" is literally true and reads as "deleted", which
        // is wrong twice as often as it is right here: `ENFORCEMENT-DIAGNOSTIC.md` is really
        // `docs/06-codebase/2026-08-11-ENFORCEMENT-DIAGNOSTIC.md`, a date-prefixed rename, and the
        // checker already holds the data to say so. A reader who is told "gone" stops looking.
        const near = suggestFor(citedPath);
        record('path-unresolved', where,
          `\`${locator}\` names \`${citedPath}\`, which matches no tracked file — not as a path, ` +
          'not as a unique basename, and not as a unique path suffix.' +
          (near ? ` Did you mean \`${near}\`?` : '') +
          (prefix && !topLevelDirs.has(prefix)
            ? ` \`${prefix}/\` is not a directory of this repository; if this points into another ` +
              'project, pass --external-prefix ' + prefix + ' to mark it rather than have it ' +
              'reported forever.'
            : ''),
          near ? { suggestion: near } : {});
        continue;
      }
      stats.resolved[res.how]++;

      const target = res.file;
      const lines = linesOf(target);
      const eof = lines.length;

      // EVERY FINDING NAMES THE FILE IT ACTUALLY READ, and says so when that file was inferred
      // rather than written. Most locators in this repo resolve by bare basename, so most findings
      // are about a file the prose never names — and the inference can be wrong in both
      // directions. Reporting `qa.js:100` without saying which qa.js was opened is unactionable.
      const via = res.how === 'exact' ? ''
        : ` (\`${citedPath}\` was matched to this file by unique ${res.how}; if that is the wrong ` +
          'file, the finding is about the wrong file)';
      const meta = { target, cited: citedPath, resolution: res.how };

      // R5: the full resolved inventory, --json only. This is what turns the basename hazard above
      // from DISCLOSED into AUDITABLE — a reader can diff every inference the checker made instead
      // of taking the coverage percentages on trust. It changes no verdict, and it is cheap
      // because the resolution was computed anyway. Kept out of stdout: it is one row per locator.
      inventory.push({ where, locator, cited: citedPath, target, resolution: res.how, start, end });

      if (start > eof) {
        record('line-beyond-eof', where,
          `\`${locator}\` names line ${start} of ${target}, which has ${eof} lines${via}.`,
          { ...meta, start: Math.min(start, eof), end: eof });
        continue;
      }
      if (end > eof) {
        record('range-beyond-eof', where,
          `\`${locator}\` ends at line ${end} of ${target}, which has ${eof} lines${via}.`,
          { ...meta, start, end: eof });
        continue;
      }

      // ── drift: the anchors sharing a clause with the locator ───────────────────────────────
      //
      // BOTH SIDES ARE CANDIDATES. This repo writes the citation both ways — `` `sym` at
      // `f.js:10` `` and `` `f.js:10`, which returns `sym` `` — and reading only backwards
      // anchored on whatever happened to precede. Measured: 11 of 47 findings had that shape,
      // including PRODUCERS.md:191, which anchored on `FleetView` while the symbol the sentence
      // actually asserts, `windowUsage`, sat immediately AFTER the locator and is on the cited
      // line. A finding is reported only when NEITHER side anchors, so the nearest match wins.
      if (!ANCHORS) continue;

      const candidates = [];
      const before = spans[k - 1];
      if (before && !LOCATOR_RE.test(before.text)
          && sameClause(raw.slice(before.end, spans[k].start))) candidates.push(before.text);
      const after = spans[k + 1];
      const afterGap = after ? raw.slice(spans[k].end, after.start) : null;
      if (after && !LOCATOR_RE.test(after.text)
          && sameClause(afterGap) && !LIST_CONTINUATION.test(afterGap)) candidates.push(after.text);

      const anchored = candidates
        .map((text) => ({ text, tokens: anchorTokens(text) }))
        .filter((c) => c.tokens);
      if (!anchored.length) continue;
      stats.anchors_checked++;

      let distance = Infinity;
      let anchorText = anchored[0].text;
      for (const c of anchored) {
        const d = nearestDistance(lines, c.tokens, start, end);
        if (d < distance) { distance = d; anchorText = c.text; }
      }
      const prev = { text: anchorText };

      if (distance > ANCHOR_SLACK) {
        const range = start === end ? `line ${start}` : `lines ${start}-${end}`;
        const dist = distance === Infinity
          ? `\`${prev.text}\` appears nowhere in ${target}`
          : `the nearest mention of \`${prev.text}\` in ${target} is ${distance} line(s) from ${range}`;
        record('anchor-drift', where,
          `\`${locator}\` is cited for \`${prev.text}\`, but ${dist}${via}. The pointer has ` +
          'probably rotted; read the range before relying on it.',
          { ...meta, start, end, distance: distance === Infinity ? null : distance, anchor: prev.text });
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
  // console.log + process.exitCode, and NEITHER half is optional.
  //
  // `process.exit()` does not flush a pending async write, and stdout to a PIPE is async — so
  // `check-citations --json | jq` silently truncated at the 64KB pipe buffer while the same
  // command redirected to a FILE was complete. Found when the R5 inventory pushed the payload
  // past 64KB; the bug predates it and would have corrupted any piped consumer the moment this
  // repo grew. A checker that reports partial JSON as whole JSON is the failure mode this file
  // exists to argue against.
  //
  // This block used to read `fs.writeSync(1, ...)`, and that was a CONDITIONAL fix — correct
  // only while nothing had written to stdout earlier in the process. Measured 2026-08-24: once
  // any console.log has initialised process.stdout on a pipe, the fd carries O_NONBLOCK, and
  // writeSync then returns a SHORT COUNT of 65536 for a 288,001-byte buffer WITHOUT THROWING.
  // The payload is cut exactly as before, and the return value nobody checks is the only signal.
  // So the old fix was one `console.log` above this line away from failing again.
  //
  // Setting exitCode and letting the process end naturally drains the queue first, and does not
  // care what touched stdout beforehand. Payload here today: 288,412 bytes, 4.4x the buffer.
  console.log(`${JSON.stringify({
    root: ROOT, posture: STRICT ? 'strict' : 'warn',
    anchor_slack: ANCHOR_SLACK, anchor_gap: ANCHOR_GAP,
    anchors_enabled: ANCHORS, min_locators: MIN_LOCATORS,
    stats, by_kind: byKind, findings, unchecked, inventory, failures,
  }, null, 2)}`);
  process.exitCode = failures.length || (STRICT && findings.length) ? 1 : 0;
} else {

  for (const f of existence) {
    console.log(`⚠ [${f.kind}] ${f.where}: ${f.message}`);
    if (SHOW) { const e = excerpt(f); if (e) console.log(e); }
  }
  for (const f of drift.sort((a, b) => (b.distance ?? Infinity) - (a.distance ?? Infinity))) {
    console.log(`⚠ [${f.kind}] ${f.where}: ${f.message}`);
    if (SHOW) { const e = excerpt(f); if (e) console.log(e); }
  }
  for (const u of unchecked) {
    const why = u.reason === 'external'
      ? `\`${u.cited}\` was declared to live in another repository (--external-prefix). Nothing ` +
        'here can confirm or deny it; it is reported so it stays visible rather than silently clean.'
      : `\`${u.cited}\` matches ${u.candidates.length} tracked files (${u.candidates.join(', ')}). ` +
        'Checked against none of them: guessing which was meant is how a checker invents a finding.';
    console.log(`· [unchecked:${u.reason}] ${u.where}: \`${u.locator}\` — ${why}`);
  }
  for (const f of failures) console.error(`✗ ${f}`);

  /**
   * COVERAGE IS PRINTED ON EVERY PATH, INCLUDING THE PASSING ONE.
   *
   * An unqualified "✓ citation check passed" over this corpus would be manufacturing confidence:
   * most locators get no drift check at all, and most of the ones that do were resolved by
   * inference rather than by an exact path. A reader who sees a bare tick has been told something
   * untrue by omission, which is the defect this checker exists to catch, committed by the checker.
   */
  const anchorPct = stats.locators ? Math.round((stats.anchors_checked / stats.locators) * 100) : 0;
  const exactPct = stats.locators ? Math.round((stats.resolved.exact / stats.locators) * 100) : 0;
  const scanned =
    `${stats.locators} locator(s) in ${stats.files_scanned} markdown file(s).\n` +
    `  RESOLUTION: ${stats.resolved.exact} exact (${exactPct}%) · ${stats.resolved.basename} by ` +
    `basename · ${stats.resolved.suffix} by suffix · ${stats.ambiguous} ambiguous (checked against ` +
    `nothing) · ${stats.unresolved} unresolved · ${stats.skipped} skipped as illustrative.\n` +
    `  A basename or suffix match may be the WRONG FILE — ${stats.locators - stats.resolved.exact} ` +
    'locator(s) here were not written as a path this checker could resolve exactly.\n' +
    `  DRIFT COVERAGE: ${stats.anchors_checked} of ${stats.locators} locator(s) (${anchorPct}%) had ` +
    `an anchor to check at all; the other ${stats.locators - stats.anchors_checked} got existence ` +
    'checks only.';

  if (failures.length) {
    console.error(`\n✗ citation check FAILED — ${failures.length} harness problem(s).\n  ${scanned}`);
    process.exitCode = 1;
  } else {

  const verdict = findings.length
    ? `⚠ citation check: ${existence.length} existence finding(s), ${drift.length} drift finding(s), ` +
      `${unchecked.length} unchecked, at --anchor-slack ${ANCHOR_SLACK}.`
    : `✓ citation check: no findings, and ${unchecked.length} locator(s) it could not check. ` +
      'This is NOT "the citations are good" — read the coverage below before believing it.';

  // POSTURE IS A PROPERTY OF THE INVOCATION, NOT OF THE RESULT. This read
  // `STRICT && findings.length ? 'STRICT — exiting 1' : 'WARN — does not block'`, so a CLEAN
  // `--strict` run announced "WARN — does not block" — a blocking check telling its reader it
  // cannot fail, which is the sentence this repo keeps finding under its own incidents. It went
  // live the moment `check:citations-exist` became a step: that step is `--strict` and passes, so
  // the false half is the half CI prints on every green run.
  const posture = STRICT
    ? `STRICT — a finding exits 1${findings.length ? ', and this run has one' : ''}`
    : 'WARN — does not block';
  console.log(
    `\n${verdict}\n  ${scanned}\n  Posture: ${posture}. ` +
    (ANCHORS
      ? 'Drift findings are heuristic; re-read before editing. '
      : 'Drift was NOT checked at all here (--no-anchors) — this run is the existence class only. ') +
    'This check cannot tell whether the prose ' +
    'is supported by the content it points at — only whether the pointer still lands.'
  );
  process.exitCode = STRICT && findings.length ? 1 : 0;

  }
}
