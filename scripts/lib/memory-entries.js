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

/**
 * A fenced code block delimiter: ``` or ~~~, optionally indented up to three spaces, with an
 * optional info string. A heading INSIDE one of these is content, not a heading.
 *
 * ── WHY THIS EXISTS: THE FILE DOCUMENTS THE ATTACK ON ITSELF ────────────────────────────────
 *
 * Without fence tracking, an entry runs from its heading to the next line matching
 * ENTRY_HEADING, wherever that line sits. A dated heading inside a fenced example therefore
 * TEARS THE ENTRY IN HALF: the parser reports two entries, the second one fabricated out of the
 * first one's body, and `apply` will archive that fabricated tail — while REFUSING its real
 * parent under rule 1 — leaving `DECISIONS.md` holding an unterminated fence and the reasoning
 * paragraph filed in the archive under a heading nobody wrote. It reported conservation and
 * exited 0 the whole time, because the bytes did balance; they were simply the wrong bytes.
 *
 * This is not a contrived input. `.claude/memory/DECISIONS.md`'s own `## Format` section shows
 * a fenced block containing `## YYYY-MM-DD — [Decision title]`, which is the construct every
 * agent is told to copy. It has been harmless only because the placeholder date is not digits.
 * An agent that filled the template in and left it fenced would split the file.
 */
const FENCE = /^ {0,3}(```|~~~)/;

/** The first line of an already-evicted entry: `*Archived to \`FILE\` (DATE). ...*` */
const STUB_MARKER = /^\*Archived to `([^`]+)`/;

/**
 * The reversibility values this tool will act on. Anything else is `unknown`, and `unknown`
 * REFUSES — see `readReversibility`.
 */
const REVERSIBILITY = ['irreversible', 'hard-to-reverse', 'fully reversible', 'reversible'];

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
  // CRLF is normalised for SCANNING only; every slice below is taken from the ORIGINAL text, so
  // an entry's bytes and its archived body keep the file's real line endings. Before this, a
  // CRLF file parsed as ZERO entries — `\r` defeated the `$` anchor — which made the 50-entry cap
  // fail open on a file the checker reported as empty.
  const lines = text.split('\n');
  const scan = lines.map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l));

  const starts = [];
  let fence = null; // the delimiter that opened the current block, or null
  scan.forEach((line, i) => {
    const f = line.match(FENCE);
    if (f) {
      if (fence === null) fence = f[1];
      else if (line.trim().startsWith(fence)) fence = null;
      return;
    }
    if (fence === null && ENTRY_HEADING.test(line)) starts.push(i);
  });

  // An unterminated fence means the rest of the file was swallowed and no heading after it was
  // seen. That is exactly the state a torn entry leaves behind, so it is reported rather than
  // guessed at: callers refuse to classify or evict anything from an ambiguous parse.
  const ambiguous = fence === null ? null
    : `unterminated \`${fence}\` code fence — every heading after it was swallowed, so the entry list is incomplete`;

  const entries = starts.map((start, k) => {
    const end = k + 1 < starts.length ? starts[k + 1] : lines.length;
    const body = lines.slice(start, end);
    const [, date, rawTitle] = scan[start].match(ENTRY_HEADING);
    const entryText = body.join('\n');
    const stub = (scan[start + 1] || '').match(STUB_MARKER);
    const rev = readReversibility(entryText);
    return {
      index: k,
      date,
      title: (rawTitle || '').trim(),
      heading: lines[start],
      startLine: start + 1, // 1-based, to match every other locator in this repo
      endLine: end,
      text: entryText,
      bytes: Buffer.byteLength(entryText, 'utf8'),
      reversibility: rev.value,
      reversibilityRaw: rev.raw,
      reversibilityNote: rev.note,
      affects: affectsTargets(entryText),
      isStub: Boolean(stub),
      archivedTo: stub ? stub[1] : null,
    };
  });
  entries.ambiguous = ambiguous;
  return entries;
}

/**
 * Read `Reversibility:` into one of the four known values, or `unknown`.
 *
 * ── THIS FIELD FAILED OPEN, AND THAT MADE RULE 1 OPTIONAL ───────────────────────────────────
 *
 * The previous form was `(entry.reversibility || '').startsWith('irreversible')`. Every way of
 * writing the field that the parser could not read therefore became `''`, `''` is not
 * `irreversible`, and the entry classified `eligible` — with the affirmative reason "reversible,
 * subject alive". Six inputs took that path: the field absent; `**Reversability:**` (one
 * transposed letter); `**Reversibility:** **irreversible**` (bolded value); `- **Reversibility:**`
 * (list item); an empty value; and `NOT reversible under any circumstances`, which is the most
 * alarming because it says the opposite of what it was read as.
 *
 * So the tool had no override flag and did not need one: a typo was the override. The fix is an
 * explicit `unknown` — the same shape `subjectStatus` already had — which classifies as REFUSED
 * and says "could not read the field" instead of asserting a value it never obtained. Rule 10:
 * never pass what you could not check.
 */
function readReversibility(entryText) {
  const raw = fieldValue(entryText, 'Reversibility');
  if (raw === null) {
    // A near-miss is worth naming: `Reversability` is a spelling most people get wrong once, and
    // "field absent" sends the reader looking for a field that is right there.
    const near = entryText.match(/^\s*[-*]?\s*\*{0,2}(Revers[a-z]*bility|Reversab[a-z]*)\s*:/im);
    const note = near && near[1] !== 'Reversibility'
      ? `no \`Reversibility:\` field — found \`${near[1]}:\`, which is probably a typo for it`
      : 'no `Reversibility:` field';
    return { value: 'unknown', raw: null, note };
  }
  // Strip markdown emphasis and backticks, then match a KNOWN value at the start. An allowlist,
  // not a negation test: `NOT reversible under any circumstances` must not read as `reversible`,
  // and no amount of substring matching gets that right in general.
  const flat = raw.replace(/[*`_]/g, '').trim().toLowerCase();
  const hit = REVERSIBILITY.find((v) => flat.startsWith(v));
  if (!hit) {
    return { value: 'unknown', raw, note: `\`Reversibility:\` reads ${JSON.stringify(raw.slice(0, 60))}, which is not one of ${REVERSIBILITY.join(' / ')}` };
  }
  return { value: hit === 'fully reversible' ? 'reversible' : hit, raw, note: null };
}

/**
 * The value of a `**Key:** value` field, joined across continuation lines.
 *
 * `Affects:` wraps onto a second line in at least one live entry, and a single-line read would
 * silently drop half its targets — which, for rule 2, means calling an entry orphaned because
 * the surviving path was on the line nobody read.
 */
function fieldValue(entryText, key) {
  const lines = entryText.split('\n').map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l));
  // Tolerates a leading list marker and optional emphasis: `**Key:**`, `- **Key:**`, `Key:`.
  // The live file uses the first; the second and third are what a hand-written entry looks like,
  // and reading them as "field absent" is how a real value goes unseen.
  const head = new RegExp(`^\\s*[-*]?\\s*\\*{0,2}${key}\\*{0,2}\\s*:\\s*\\*{0,2}`, 'i');
  const at = lines.findIndex((l) => head.test(l));
  if (at === -1) return null;
  const parts = [lines[at].replace(head, '').trim()];
  for (let i = at + 1; i < lines.length; i++) {
    const next = lines[i];
    if (!next.trim() || /^\s*[-*]?\s*\*\*/.test(next) || next.startsWith('## ')) break;
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
  const rev = entry.reversibility;
  const reasons = [];

  // The field could not be read. REFUSED, not eligible — an unreadable `Reversibility:` is the
  // one input from which rule 1 cannot be evaluated at all, so treating it as `reversible` made
  // a typo into the override flag this tool deliberately does not have.
  if (rev === 'unknown') {
    reasons.push(`RULE 1 (fail-closed): ${entry.reversibilityNote}. Rule 1 cannot be evaluated, so this is refused rather than assumed reversible`);
    return { disposition: 'refused', reasons, citations, subject };
  }

  if (rev === 'irreversible' && subject !== 'deleted') {
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

  if (rev === 'hard-to-reverse') {
    reasons.push('hard-to-reverse with a live subject — evictable only when named explicitly');
    return { disposition: 'guarded', reasons, citations, subject };
  }

  reasons.push(`Reversibility reads \`${rev}\`, subject ${subject}, no live claim cites it`);
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
