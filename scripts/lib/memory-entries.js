'use strict';
// POSTURE: library. Two CLIs sit on it — `scripts/check-memory-budget.mjs` (BLOCKS in CI) and
// `scripts/evict-memory.mjs` (writes, and is the only sanctioned writer of an archive volume).
//
// scripts/lib/memory-entries.js — THE parser and THE classifier for DECISIONS.md entries.
//
// ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────────────────────
//
// `check-memory-budget.mjs` is a blocking CI step and CLAUDE.md rule 4 tells every agent to append
// a breadcrumb to DECISIONS.md when a choice affects others. Measured on this branch before the
// first eviction: 39,675 bytes against a 40,000 cap — 325 bytes of headroom, against a real-entry
// mean far above that. At that headroom rule 4 is unfollowable: an honest entry turns CI red.
//
// This exact condition occurred once before, at 91 bytes of headroom (recorded in
// docs/03-system-design/TARGET-ARCHITECTURE.md §7). It was relieved by a one-off manual eviction
// and the mechanism that would stop it recurring was never built, so it recurred. This file is
// that mechanism.
//
// ── EVICTION IS TYPED AND DEPENDENCY-LINKED, NEVER BY RECENCY ───────────────────────────────
//
// Recency is the wrong key and the file itself proves it: the oldest surviving entries are the
// ones the ledger and two test files still reason from, while several recent ones are already
// spent. The type keys needed to do better are already in every entry — `Reversibility:` and
// `Affects:`. TARGET-ARCHITECTURE.md §7 states the rules; this file implements them:
//
//   RULE 1  An `irreversible` entry is NEVER archived while its subject exists. Hard refusal,
//           no override flag. An override would make it a suggestion.
//   RULE 2  An entry whose `Affects:` targets have ALL been deleted is archivable on sight —
//           it documents a decision about files that are gone.
//   RULE 3  Pin anything cited by a live claim. A claim is the repo's durable unit; archiving
//           the record a claim reasons from breaks the claim quietly.
//   RULE 4  Archival must leave a residue — a surviving stub carrying where the body went and
//           who cites it — or it is deletion with extra steps.
//
// ── RULE 10 APPLIES TO THIS FILE TOO: NEVER PASS WHAT YOU COULD NOT CHECK ───────────────────
//
// Two places where the honest answer is "unknown", both reported as unknown rather than rounded
// to the convenient side:
//
//   SUBJECT EXISTENCE. Most `Affects:` lines are prose ("every agent that merges a PR"), not
//   paths. When an entry names no path, its subject status is `unknown`, and `unknown` is
//   treated as ALIVE — so rule 2 never fires on an entry it could not actually check, and
//   rule 1 never releases one.
//
//   PARAPHRASE CITATIONS. `citationsFor()` finds a citation made by DATE and one made by TITLE
//   PHRASE. It cannot find one made by paraphrase, and that is not a hypothetical: the
//   2026-08-22 eviction ran a title-phrase grep only, and four of its seven stubs asserted "no
//   citations" while citations by date (`mission-control/server/projects.ts` → "DECISIONS.md
//   2026-08-12") and by paraphrase (`mission-control/test/views.test.tsx` → "the entry already
//   in DECISIONS.md") existed. The date scan below closes the first of those two holes. The
//   second stays open, so every report carries `unchecked: 'paraphrase'` and no caller may read
//   an empty citation list as "nothing cites this".
//
//   GLOBAL-SCOPE CLAIMS. The scan reads this repository's claims only. `~/.warroom/ledger/global.yml`
//   is machine state — structurally absent on a CI runner, present on a developer's machine — so
//   including it would make the same commit classify two ways. Excluded deliberately, declared on
//   every entry as `unchecked: 'global-scope-claims'`.
//
// ── ONE PARSER, NOT TWO ─────────────────────────────────────────────────────────────────────
//
// Claims are read through `scripts/lib/claims.js` — the repo's only claim parser — and never
// re-parsed here. `check-memory-budget.mjs` counts entries by calling `parseDecisionEntries()`
// rather than by carrying its own heading regex, so the definition of "an entry" has one
// implementation. Two implementations of a rule disagree, and you find out during the incident.

const fs = require('node:fs');
const path = require('node:path');
const { parseClaimsFromText } = require('./claims.js');

/**
 * An entry heading: `## YYYY-MM-DD — Title`.
 *
 * Date-anchored, so the `## Format` section of DECISIONS.md is not an entry. This is the same
 * predicate `check-memory-budget.mjs` used to carry inline; it lives here now so the byte
 * checker and the eviction tool cannot come to disagree about what they are counting.
 */
const ENTRY_HEADING = /^## (\d{4}-\d{2}-\d{2})(?:\s*[—–-]\s*(.*))?$/;

/** The first line of an already-evicted entry: `*Archived to \`FILE\` (DATE). ...*` */
const STUB_MARKER = /^\*Archived to `([^`]+)`/;

/**
 * A repo path inside an `Affects:` line. Two forms, because the file uses both:
 *   backticked   `scripts/lib/*`, `.claude/settings.json`
 *   bare         mission-control/test/perf.test.ts
 * A token must contain `/` or start with `.claude` to count — otherwise every prose word in
 * "every agent that merges" would be probed as a path and every entry would look orphaned.
 */
const BACKTICKED = /`([^`]+)`/g;
const PATHLIKE = /^[A-Za-z0-9._][A-Za-z0-9._/*-]*$/;

/**
 * Split DECISIONS.md into its dated entries.
 *
 * Returns entries in FILE ORDER. Note that file order is not date order in the real file —
 * its header says "most-recent first" while entries have in practice been appended
 * most-recent-LAST. That inconsistency is real and is out of this file's scope; nothing here
 * depends on either ordering, which is why it can be left alone safely.
 *
 * @param {string} text  full contents of DECISIONS.md
 * @returns {Array<object>} one record per entry
 */
function parseDecisionEntries(text) {
  const lines = text.split('\n');
  const starts = [];
  lines.forEach((line, i) => {
    if (ENTRY_HEADING.test(line)) starts.push(i);
  });

  return starts.map((start, k) => {
    const end = k + 1 < starts.length ? starts[k + 1] : lines.length;
    const body = lines.slice(start, end);
    const [, date, rawTitle] = lines[start].match(ENTRY_HEADING);
    const entryText = body.join('\n');
    const stub = (body[1] || '').match(STUB_MARKER);
    return {
      index: k,
      date,
      title: (rawTitle || '').trim(),
      heading: lines[start],
      startLine: start + 1, // 1-based, to match every other locator in this repo
      endLine: end,
      text: entryText,
      bytes: Buffer.byteLength(entryText, 'utf8'),
      reversibility: fieldValue(entryText, 'Reversibility'),
      affects: affectsTargets(entryText),
      isStub: Boolean(stub),
      archivedTo: stub ? stub[1] : null,
    };
  });
}

/**
 * The value of a `**Key:** value` field, joined across continuation lines.
 *
 * `Affects:` wraps onto a second line in at least one live entry, and a single-line read would
 * silently drop half its targets — which, for rule 2, means calling an entry orphaned because
 * the surviving path was on the line nobody read.
 */
function fieldValue(entryText, key) {
  const lines = entryText.split('\n');
  const at = lines.findIndex((l) => l.startsWith(`**${key}:**`));
  if (at === -1) return null;
  const parts = [lines[at].slice(`**${key}:**`.length).trim()];
  for (let i = at + 1; i < lines.length; i++) {
    const next = lines[i];
    if (!next.trim() || next.startsWith('**') || next.startsWith('## ')) break;
    parts.push(next.trim());
  }
  return parts.join(' ').trim();
}

/** Repo-path targets named by an entry's `Affects:` field, deduplicated, in order. */
function affectsTargets(entryText) {
  const raw = fieldValue(entryText, 'Affects');
  if (!raw) return [];
  const found = new Set();
  for (const m of raw.matchAll(BACKTICKED)) {
    const tok = m[1].trim();
    if (looksLikePath(tok)) found.add(tok);
  }
  // Bare tokens too — `Affects:` lines mix the two forms freely.
  for (const tok of raw.replace(BACKTICKED, ' ').split(/[\s,;]+/)) {
    const clean = tok.replace(/[.,;:)]+$/, '').trim();
    if (looksLikePath(clean)) found.add(clean);
  }
  return [...found];
}

function looksLikePath(tok) {
  if (!tok || !PATHLIKE.test(tok)) return false;
  return tok.includes('/') || tok.startsWith('.claude');
}

/**
 * Does the thing this entry decided about still exist on disk?
 *
 *   'alive'    at least one named path resolves
 *   'deleted'  every named path is gone — rule 2's trigger
 *   'unknown'  the entry names no path at all
 *
 * `unknown` is the common case and it is deliberately NOT folded into either answer. Callers
 * treat it as alive: rule 2 must not fire on an entry whose subject was never checked, and
 * rule 1 must not release one. See the Rule 10 note in this file's header.
 */
function subjectStatus(entry, root) {
  if (!entry.affects.length) return 'unknown';
  const alive = entry.affects.filter((p) => pathPresent(root, p));
  return alive.length ? 'alive' : 'deleted';
}

/** Existence for a plain path or a single-level glob (`scripts/lib/*`, `.claude/commands/*`). */
function pathPresent(root, rel) {
  const clean = rel.replace(/^\.\//, '');
  if (clean.includes('*')) {
    const dir = path.join(root, path.dirname(clean));
    try {
      return fs.statSync(dir).isDirectory() && fs.readdirSync(dir).length > 0;
    } catch {
      return false;
    }
  }
  return fs.existsSync(path.join(root, clean));
}

// ── citations ───────────────────────────────────────────────────────────────────────────────

/** Stop words dropped before a title becomes a search phrase. */
const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'it', 'that',
  'for', 'on', 'by', 'as', 'not', 'but', 'with', 'from', 'this', 'was', 'are', 'be']);

/**
 * The distinctive phrases of a title: EVERY run of three or more consecutive non-stop words,
 * lowercased and stripped of markup.
 *
 * Runs rather than a bag of words, because a bag matches any document that happens to share the
 * vocabulary — which is how a citation scan produces a page of findings nobody reads. A run of
 * three or more content words is specific enough to act on.
 *
 * ALL the runs, not the longest one, and that correction was made against a measurement rather
 * than a preference. `## 2026-08-16 — \`maxTurns\` does bind, and the belief that it did not cost
 * three gate runs` has its longest run at "cost three gate runs" and its identifying run at
 * "maxturns does bind". A longest-run rule searched for the anecdote and not for the subject, so
 * it missed the entry's own claim id. A pin that misses is worse than no pin: it reports a clean
 * scan over a check that did not look in the right place.
 *
 * A title yielding no run of three (a short title, or one that is mostly stop words) returns an
 * empty list, and the caller records `unchecked: 'title-too-generic'` rather than reporting a
 * clean scan it never performed.
 */
function titlePhrases(title) {
  const words = title
    .toLowerCase()
    .replace(/[`"'*]/g, '')
    .split(/[^a-z0-9-]+/)
    .filter(Boolean);
  const runs = [];
  let run = [];
  const flush = () => { if (run.length >= 3) runs.push(run.join(' ')); run = []; };
  for (const w of words) {
    if (STOP.has(w)) flush(); else run.push(w);
  }
  flush();
  return runs;
}

/** Normalise a haystack the same way `titlePhrases` normalises its needles. */
function normalise(text) {
  return text.toLowerCase().replace(/[`"'*]/g, '').replace(/[^a-z0-9-]+/g, ' ');
}

/**
 * Every citation of one entry that a deterministic scan can find.
 *
 * Two classes, kept apart because what they authorise differs:
 *
 *   claims[]  a live claim cites this entry — RULE 3, a hard pin. Either the claim block sits
 *             inside the entry (archiving it would move a claim's `source_file` and break index
 *             reproducibility) or the claim's own text names the entry.
 *   prose[]   a tracked file cites it in prose. This does NOT refuse the eviction — the residue
 *             stub is what keeps a by-date citation such as "DECISIONS.md 2026-08-12" resolving.
 *             It obliges the stub to NAME the citers, which is rule 4 doing its work.
 *
 * `unchecked` is always populated. A caller that reads `prose.length === 0` as "nothing cites
 * this" is making exactly the claim the 2026-08-22 eviction made and got wrong four times.
 */
function citationsFor(entry, { root, claims, files, decisionsRel }) {
  const phrases = titlePhrases(entry.title);
  // `global-scope-claims` is declared on EVERY entry, not conditionally, because the global
  // ledger (`~/.warroom/ledger/global.yml`) is machine state: it is structurally absent on a CI
  // runner and present on a developer's machine, so a scan that included it would give two
  // different answers for the same commit. It is excluded deliberately and named here so no stub
  // can imply it was searched. This is not hypothetical — `c-runtime-nested-spawn` is a global
  // claim, and the DECISIONS.md entry recording its refresh disposition classifies as `eligible`
  // for exactly this reason. Check global citations by hand before evicting an entry that names
  // a claim id in its title or body.
  const unchecked = ['paraphrase', 'global-scope-claims'];
  if (!phrases.length) unchecked.push('title-too-generic');
  const anyPhrase = (flat) => phrases.some((p) => flat.includes(p));

  const claimHits = [];
  for (const c of claims) {
    // A claim block living inside this entry's line range. Archiving it would move a claim's
    // `source_file`, and the ledger index is byte-compared against a clean clone — so this
    // eviction would fail `ledger build --check` for a reason the author could not read off
    // the diff. Nothing in the file today is in this state; the test constructs one.
    if (c.source_file === decisionsRel && c.source_line >= entry.startLine && c.source_line < entry.endLine) {
      claimHits.push({ id: c.id, where: c.source_file, how: 'inside-entry' });
      continue;
    }
    const text = normalise(JSON.stringify(c));
    if (anyPhrase(text)) {
      claimHits.push({ id: c.id, where: c.source_file, how: 'title-phrase' });
    } else if (text.includes(entry.date) && text.includes('decisions')) {
      claimHits.push({ id: c.id, where: c.source_file, how: 'date' });
    }
  }

  const prose = [];
  for (const rel of files) {
    if (rel === decisionsRel || /DECISIONS_ARCHIVE/.test(rel)) continue;
    let text;
    try { text = fs.readFileSync(path.join(root, rel), 'utf8'); } catch { continue; }
    if (!text.includes(entry.date) && !anyPhrase(normalise(text))) continue;
    text.split('\n').forEach((line, i) => {
      const flat = normalise(line);
      if (line.includes(entry.date) && /decisions/i.test(line)) {
        prose.push({ where: `${rel}:${i + 1}`, how: 'date' });
      } else if (anyPhrase(flat)) {
        prose.push({ where: `${rel}:${i + 1}`, how: 'title-phrase' });
      }
    });
  }

  return { claims: claimHits, prose, unchecked, phrases };
}

// ── classification ──────────────────────────────────────────────────────────────────────────

/**
 * The disposition of one entry. Exactly one of:
 *
 *   'archived'   already a stub — nothing to do
 *   'refused'    rule 1 or rule 3 forbids eviction. `reasons` says which
 *   'orphaned'   rule 2 — every `Affects:` target is gone; archivable on sight
 *   'guarded'    `hard-to-reverse` with a live subject. NOT auto-selected, but evictable when
 *                named explicitly. TARGET-ARCHITECTURE.md §7 legislates `irreversible` and
 *                `reversible` and is silent on the middle rung, so the middle rung is given the
 *                weakest treatment that is still a speed bump: a human has to type its date.
 *                Inventing a stronger rule here would be legislating past the brief; treating
 *                it as plain `reversible` would quietly erase a distinction the entries carry.
 *   'eligible'   reversible, subject alive, uncited by any claim
 */
function classifyEntry(entry, ctx) {
  if (entry.isStub) return { disposition: 'archived', reasons: ['already archived'], citations: null, subject: null };

  const subject = subjectStatus(entry, ctx.root);
  const citations = citationsFor(entry, ctx);
  const rev = (entry.reversibility || '').toLowerCase();
  const reasons = [];

  if (rev.startsWith('irreversible') && subject !== 'deleted') {
    reasons.push(
      `RULE 1: Reversibility is irreversible and its subject is ${subject} ` +
      `(${entry.affects.length ? entry.affects.join(', ') : 'no path named, so existence is unknown and read as alive'})`
    );
    return { disposition: 'refused', reasons, citations, subject };
  }

  if (citations.claims.length) {
    reasons.push(
      `RULE 3: cited by ${citations.claims.length} live claim(s) — ` +
      citations.claims.map((c) => `${c.id} (${c.how}, ${c.where})`).join('; ')
    );
    return { disposition: 'refused', reasons, citations, subject };
  }

  if (subject === 'deleted') {
    reasons.push(`RULE 2: every Affects: target is gone (${entry.affects.join(', ')})`);
    return { disposition: 'orphaned', reasons, citations, subject };
  }

  if (rev.startsWith('hard-to-reverse')) {
    reasons.push('hard-to-reverse with a live subject — evictable only when named explicitly');
    return { disposition: 'guarded', reasons, citations, subject };
  }

  reasons.push(`reversible, subject ${subject}, no live claim cites it`);
  return { disposition: 'eligible', reasons, citations, subject };
}

/**
 * Load the live claim corpus through the repo's ONE claim parser.
 *
 * `scripts/ledger.mjs` builds its index from `git ls-files`, and this uses the same list for
 * the same reason: a directory walk sweeps in ignored paths and build output, so the answer
 * would differ between a working tree and a clean clone. When git is unavailable the caller
 * gets `{ available: false }` and must report the scan as unperformed — not as clean.
 */
function loadClaims(root, listFiles) {
  const files = listFiles(root);
  if (!files) return { available: false, claims: [], files: [] };
  const claims = [];
  for (const rel of files) {
    if (!/\.(md|markdown)$/i.test(rel)) continue;
    let text;
    try { text = fs.readFileSync(path.join(root, rel), 'utf8'); } catch { continue; }
    if (!text.includes('claims:')) continue; // cheap pre-filter; the parser decides
    const r = parseClaimsFromText(text, rel);
    for (const c of r.claims) claims.push({ ...c, source_line: c.source_line || 0 });
  }
  return { available: true, claims, files };
}

module.exports = {
  ENTRY_HEADING,
  STUB_MARKER,
  parseDecisionEntries,
  fieldValue,
  affectsTargets,
  subjectStatus,
  pathPresent,
  titlePhrases,
  citationsFor,
  classifyEntry,
  loadClaims,
};
