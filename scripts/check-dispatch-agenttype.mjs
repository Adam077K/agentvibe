#!/usr/bin/env node
/**
 * check-dispatch-agenttype.mjs — the dispatch-identity checker.
 *
 * Reporting standard: docs/03-system-design/SWEEP-REPORTING.md — a sweep must report what it could
 * not classify, separately from what it found clean, and cross-check its universe against a counter
 * it did not write. Both halves are implemented here and asserted, not assumed.
 *
 * POSTURE: BLOCKS. Run by `.github/workflows/ci.yml` on every PR via `npm run check:dispatch`.
 * Specified at docs/03-system-design/agents/CONTROL-PLANE.md §3.16, and it is Step 3 of §3.17 —
 * the step whose entire job is to stop Step 1 being reverted by accident.
 *
 * WHAT IT DEFENDS. `agentType` in an `agent()` dispatch is the whole of the container: the tool
 * grant, the model, the isolation. Omit it and the runtime dispatches its own default —
 * `general-purpose`, which holds `Write`, `Edit` and `Bash`. Name a file carrying `kind: shim`
 * and you get the same outcome by a different route: a shim declares no `tools:`, so it grants
 * nothing and the dispatch falls back to that same all-tools default. Name a file that does not
 * exist at all and you get it a third way.
 *
 * All three failures are silent. Nothing throws, the workflow runs, and the only symptom is a
 * reviewer that could have edited what it was reviewing. Measured on this repo 2026-08-16:
 * eight of twelve dispatch sites were in one of those three states.
 *
 * Checks (failures block; warnings are reported and do not block):
 *   1. Every `agent()` call site in .claude/workflows/*.js carries an `agentType`.
 *   2. Every `agentType` resolves to a .claude/agents/<name>.md that exists and is not a shim.
 *   3. A non-literal `agentType` has a literal `||` fallback AND its file declares a frozen
 *      allowlist — every member a real non-shim engine, the fallback among them, and the file
 *      actually tests membership against it. A workflow that accepts an arbitrary agent name
 *      from its caller is dispatch-identity injection.
 *   4. Containment: a credentialed agentType (`operator`, `instrument`) appears nowhere outside
 *      .claude/workflows/. Vacuous today — neither agent exists — which is exactly when a
 *      containment rule is cheap to add.
 *   5. WARN: a dispatch-site `isolation` that contradicts the agent file's own.
 *   6. Non-vacuity: at least --min-sites call sites were found at all.
 *
 * HOW IT PARSES, AND WHAT IT CANNOT SEE.
 *
 * Textual scan, not evaluation, and the reason is not laziness. These files are not importable:
 * they are ESM fragments with top-level `await` and free globals (`agent`, `phase`, `parallel`,
 * `pipeline`, `workflow`, `log`, `args`, `budget`) injected by the Workflow runtime, so
 * `import()` throws on the undefined globals and `vm.Script` rejects the `export` on line 1.
 * So the scan brace-matches the options object itself, tracking single quotes, double quotes,
 * template literals, `${}` interpolation and comments. That is not gold-plating: `qa.js:283`
 * puts a template literal carrying `${[...seen].join(', ') || '(none yet)'}` inside the prompt
 * argument, and a naive brace counter ends the argument list in the middle of a string.
 * Bare identifiers are resolved against a `const NAME = '<literal>'` scan of the same file —
 * that is how `REVIEW_AGENT` / `JUDGE_AGENT` at `qa.js:102-103` resolve.
 *
 * Blind spots, named here rather than discovered during an incident:
 *   · An aliased or indirect call — `const a = agent; a(...)`, `(0, agent)(...)` — is not
 *     textually a call to `agent(` and is not seen.
 *   · A spread options object — `agent(p, { ...base, label })` — is seen, but an `agentType`
 *     arriving through the spread is not resolved. Such a site FAILS rather than passing.
 *   · A computed agentType of any shape other than `x || 'literal'` fails rather than resolving.
 *   · Identifier resolution reads `const NAME = '<literal>'` in the same file only. A name
 *     assigned from a call, an object property, or another module is not resolved.
 *   · Regex literals are treated as division. A regex holding an unbalanced brace or a lone
 *     quote would derail the scan from that point in the file. None exist in these files today.
 *   · Only `.claude/workflows/*.js` is parsed. `design-screen.md` in the same directory
 *     documents dispatches in prose and is checked by nothing.
 *   · Rule 4 enumerates files with `git ls-files`, so an UNTRACKED file violating containment is
 *     invisible until it is staged. That is the right source — it inherits .gitignore rather
 *     than growing a second exclude list — and CI only ever sees tracked files, so the gap is
 *     local-only. It is stated because it was found the honest way: this file's own rationale
 *     comment tripped the rule the moment the file became tracked, and not one moment earlier.
 *
 * The non-vacuity floor is the guard for every one of those: a parser that quietly stops finding
 * call sites must fail, not report clean. This repo has been bitten more than once by a check
 * that passed because it was looking somewhere the answer was always yes.
 *
 * Usage: node scripts/check-dispatch-agenttype.mjs [--root DIR] [--min-sites N] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const optOf = (name, dflt) => {
  const i = argv.indexOf(name);
  return i === -1 || i + 1 >= argv.length ? dflt : argv[i + 1];
};
const ROOT = path.resolve(optOf('--root', REPO));
const MIN_SITES = Number(optOf('--min-sites', '12'));
const JSON_OUT = argv.includes('--json');

// Credentialed containers, per docs/03-system-design/agents/GRANT-HOLDERS.md. Neither exists
// yet; the rule is written now because a containment rule added after the credential ships is
// a rule written during the incident.
const CREDENTIALED = ['operator', 'instrument'];

const failures = [];
const warnings = [];
// THE THIRD BUCKET. Items this scan SAW and deliberately did not classify, each with the reason.
// Kept separate from `failures` (something is wrong) and from silence (nothing was there), because
// collapsing "I did not classify this" into "I found nothing" is how a sweep reports a clean run
// over a set it never examined.
const unclassified = [];
// THE UNIVERSE COUNT this scan is cross-checked against: `agent(` occurrences in the UNMASKED
// source of the .js workflow files, found with the same regex the site scan uses. It is the
// denominator of the coverage line, and the identity that must hold is
// `universeTotal + mdMentions === sitesInJs + sitesInMd + unclassified.length` — asserted below
// rather than hoped for, because a coverage line whose parts do not add up is worse than none.
//
// THE .md HALF NEEDS ITS OWN UNIVERSE, because it is scanned by a different predicate. Counting
// only the .js universe left 4 of the 17 sites with no cross-count at all — a cross-count covering
// part of a corpus reports coverage it does not have, which is the defect this bucket exists to
// end, one level up.
let universeTotal = 0;
let sitesInJs = 0;
let mdMentions = 0;
let sitesInMd = 0;
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);
const warn = (check, msg) => warnings.push(`[${check}] ${msg}`);

// ── the tokenizer ──────────────────────────────────────────────────────────
// One state machine, four consumers. `stack` holds bracket characters plus '`' for a template
// literal body; a '${' pushes '{' so interpolated code is walked as code and its braces match.

/**
 * Consume whatever literal or comment starts at `i`, returning the next index — or null when
 * the character is structural (a bracket, a separator) and the caller must handle it.
 */
function skipToken(src, i, stack) {
  const c = src[i];
  const d = src[i + 1];
  if (stack[stack.length - 1] === '`') {
    if (c === '\\') return i + 2;
    if (c === '`') { stack.pop(); return i + 1; }
    if (c === '$' && d === '{') { stack.push('{'); return i + 2; }
    return i + 1;
  }
  if (c === '/' && d === '/') { const nl = src.indexOf('\n', i); return nl === -1 ? src.length : nl; }
  if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); return e === -1 ? src.length : e + 2; }
  if (c === "'" || c === '"') {
    let j = i + 1;
    while (j < src.length) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === c) return j + 1;
      if (src[j] === '\n') return j; // unterminated — stop rather than swallow the rest of the file
      j++;
    }
    return src.length;
  }
  if (c === '`') { stack.push('`'); return i + 1; }
  return null;
}

/** Index of the bracket closing the one at `open`, or -1 if unbalanced. */
function matchBracket(src, open) {
  const stack = [src[open]];
  let i = open + 1;
  while (i < src.length) {
    const next = skipToken(src, i, stack);
    if (next !== null) { i = next; continue; }
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') { stack.push(c); i++; continue; }
    if (c === ')' || c === ']' || c === '}') {
      stack.pop();
      if (!stack.length) return i;
      i++;
      continue;
    }
    i++;
  }
  return -1;
}

/** Call `cb(index, char)` for every character of `text` at bracket depth 0 and outside literals. */
function walkTop(text, cb) {
  const stack = [];
  let i = 0;
  while (i < text.length) {
    const next = skipToken(text, i, stack);
    if (next !== null) { i = next; continue; }
    const c = text[i];
    if (c === '(' || c === '[' || c === '{') { stack.push(c); i++; continue; }
    if (c === ')' || c === ']' || c === '}') { stack.pop(); i++; continue; }
    if (!stack.length) cb(i, c);
    i++;
  }
}

function splitTop(text, sep) {
  const parts = [];
  let start = 0;
  walkTop(text, (i, c) => {
    if (c === sep) { parts.push(text.slice(start, i)); start = i + 1; }
  });
  parts.push(text.slice(start));
  return parts;
}

/** Split on top-level `||`. walkTop reports both pipes of a pair; only the first opens a cut. */
function splitTopOr(text) {
  const cuts = [];
  walkTop(text, (i, c) => {
    if (c === '|' && text[i + 1] === '|' && cuts[cuts.length - 1] !== i - 1) cuts.push(i);
  });
  const parts = [];
  let start = 0;
  for (const i of cuts) { parts.push(text.slice(start, i)); start = i + 2; }
  parts.push(text.slice(start));
  return parts;
}

function indexOfTop(text, ch) {
  let found = -1;
  walkTop(text, (i, c) => { if (found === -1 && c === ch) found = i; });
  return found;
}

/**
 * Replace comment spans with a single space, leaving literals untouched. Required, not cosmetic:
 * these call sites carry a rationale comment ABOVE the options object and above `agentType:`
 * itself, so without this the second argument does not begin with `{` and the property key reads
 * as the comment plus the key. The first draft of this file reported both as real defects.
 */
function stripComments(text) {
  let out = '';
  const stack = [];
  let i = 0;
  while (i < text.length) {
    const inTemplate = stack[stack.length - 1] === '`';
    const start = i;
    const next = skipToken(text, i, stack);
    if (next !== null) {
      const isComment = !inTemplate && text[start] === '/' && (text[start + 1] === '/' || text[start + 1] === '*');
      out += isComment ? ' ' : text.slice(start, next);
      i = next;
      continue;
    }
    // Brackets must be tracked even though nothing is stripped from them: `${` pushes '{' inside
    // skipToken, and without the matching pop here the walker never leaves the interpolation and
    // reads the template's closing backtick as an OPENING one. That is not hypothetical — it is
    // what `label: \`build:${s.id}\`` in coding.js did to the first draft.
    const c = text[i];
    if (c === '(' || c === '[' || c === '{') stack.push(c);
    else if (c === ')' || c === ']' || c === '}') stack.pop();
    out += c;
    i++;
  }
  return out;
}

/**
 * Blank the bodies of comments and string/template literals, preserving every index and every
 * newline, so a call-site search cannot match `agent(` written inside a comment or inside a
 * prompt. Code inside `${ }` is preserved — it is code, and a dispatch can live there.
 */
function maskCode(src) {
  const out = src.split('');
  const blank = (from, to) => {
    for (let k = from; k < to && k < out.length; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  const stack = [];
  let i = 0;
  while (i < src.length) {
    const inTemplate = stack[stack.length - 1] === '`';
    const start = i;
    const next = skipToken(src, i, stack);
    if (next !== null) {
      const c = src[start];
      if (inTemplate) {
        if (!(c === '$' && src[start + 1] === '{')) blank(start, next);
      } else if (c === '/' || c === "'" || c === '"') {
        blank(start, next); // a comment body, or a quoted string including its quotes
      }
      i = next;
      continue;
    }
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') { stack.push(c); i++; continue; }
    if (c === ')' || c === ']' || c === '}') { stack.pop(); i++; continue; }
    i++;
  }
  return out.join('');
}

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

// ── agent files ────────────────────────────────────────────────────────────
const agentCache = new Map();
function agentInfo(name) {
  if (agentCache.has(name)) return agentCache.get(name);
  const rel = `.claude/agents/${name}.md`;
  const file = path.join(ROOT, rel);
  let info = { rel, exists: false, shim: false, isolation: null };
  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8');
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
    const front = fm ? fm[1] : '';
    const field = (k) => {
      const m = new RegExp(`^${k}:\\s*(.+)$`, 'm').exec(front);
      return m ? m[1].trim() : null;
    };
    info = { rel, exists: true, shim: field('kind') === 'shim', isolation: field('isolation') };
  }
  agentCache.set(name, info);
  return info;
}

/** Rule 2, applied wherever a concrete name is produced. */
function checkAgentName(name, where, how) {
  const info = agentInfo(name);
  if (!info.exists) {
    fail(
      'unknown-agenttype',
      `${where} names ${how} '${name}', but ${info.rel} does not exist. ` +
        'A dispatch naming no file gets the runtime default (general-purpose — tools `*`, which holds Write, Edit and Bash). ' +
        'Fix: name an engine in .claude/agents/ that is not a shim.'
    );
    return false;
  }
  if (info.shim) {
    fail(
      'shim-agenttype',
      `${where} names ${how} '${name}', which is \`kind: shim\` in ${info.rel}. ` +
        'A shim declares no `tools:`, so it grants nothing and the dispatch falls back to the all-tools ' +
        'default — the same hole as omitting agentType. Fix: name the engine the shim was collapsed ' +
        'into (its own file says which).'
    );
    return false;
  }
  return true;
}

// ── parse the workflow dispatch sites ──────────────────────────────────────
const WORKFLOW_DIR = '.claude/workflows';
const wfAbs = path.join(ROOT, WORKFLOW_DIR);
const workflowFiles = fs.existsSync(wfAbs)
  ? fs.readdirSync(wfAbs).filter((f) => f.endsWith('.js') || f.endsWith('.md')).sort()
  : [];

if (!workflowFiles.length) {
  fail('non-vacuity', `${WORKFLOW_DIR}/ under ${ROOT} holds no .js or .md files — this check would pass by looking at nothing.`);
}

const sites = [];

for (const file of workflowFiles) {
  const rel = `${WORKFLOW_DIR}/${file}`;
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');

  // .md workflow files: use a shape predicate — agentType immediately followed by a quoted literal.
  // The JS tokenizer was designed for .js; markdown code fences are not executed and there is no
  // reliable way to tell a real dispatch from a prose example inside a code block. The shape predicate
  // is the same predicate check-dispatch already relies on — it is just applied line-by-line rather
  // than through the full argument-extraction path.
  if (file.endsWith('.md')) {
    const mdLines = src.split('\n');
    for (let i = 0; i < mdLines.length; i++) {
      const lineRe = /agentType\s*:\s*(['"'])([^'"]+)\1/g;
      let m;
      let matchedHere = 0;
      while ((m = lineRe.exec(mdLines[i])) !== null) {
        const name = m[2];
        const where = `${rel}:${i + 1}`;
        const site = { file: rel, line: i + 1, agentType: name, resolution: 'md-literal' };
        sites.push(site);
        sitesInMd++;
        matchedHere++;
        checkAgentName(name, where, 'agentType');
      }
      // THE .md UNIVERSE IS THE BARE TOKEN, DELIBERATELY WIDER THAN THE SHAPE PREDICATE.
      // `\bagentType\b` matches every mention; the shape predicate takes only those followed by a
      // quoted literal. The delta is every mention the file MENTIONS but does not treat as a
      // dispatch — and unlike the .js side it does NOT fail, because markdown is prose and a prose
      // mention of the key is the expected case, not a parser gap. Measured on this tree the delta
      // is 3, all three prose: a shape table in README.md, a sentence in design-screen.md, and a
      // column header in the same file. Listed rather than dropped, so a reader sees the exclusion
      // instead of inferring it from a number that happens to add up.
      const mentionsHere = (mdLines[i].match(/\bagentType\b/g) || []).length;
      mdMentions += mentionsHere;
      for (let k = 0; k < mentionsHere - matchedHere; k++) {
        unclassified.push({
          file: rel, line: i + 1, reason: 'md-prose-mention',
          detail: 'a mention of `agentType` in markdown not followed by a quoted literal — prose about dispatch rather than a dispatch, excluded by design and listed so the exclusion is visible rather than assumed',
        });
      }
    }
    continue;
  }

  const masked = maskCode(src);

  const rawHits = (src.match(/\bagent\s*\(/g) || []).length;
  const siteRe = /(^|[^\w$.])agent\s*\(/g;
  const found = [];
  let m;
  while ((m = siteRe.exec(masked)) !== null) found.push(m.index + m[0].length - 1);
  if (rawHits > 0 && !found.length) {
    fail('parser', `${rel}: the raw text holds ${rawHits} \`agent(\` occurrence(s) and the masked scan found none — the tokenizer is broken, not the file.`);
  }

  // ── THE DELTA BETWEEN raw AND found IS REPORTED, NOT DISCARDED ────────────────────────────────
  //
  // The guard directly above fires only when a file drops to ZERO. A PARTIAL loss — raw 10, found
  // 5 — passes it in silence, and that is the state this repo is actually in: measured across
  // `.claude/workflows/*.js`, 19 raw occurrences become 13 sites. Six vanish, no file hits zero,
  // and nothing said so.
  //
  // Most of those six are correct: `agent(` inside a comment or a prompt string is not a dispatch,
  // and masking them is the whole point of maskCode(). But "correct" and "unexamined" were
  // indistinguishable in the output, and a checker that cannot tell them apart is one refactor away
  // from reporting a real miss as a clean run. So each dropped occurrence is CLASSIFIED against the
  // mask rather than counted:
  //
  //   masked      the byte is blanked in maskCode() -> it lived in a comment or a literal. Benign,
  //               and listed so a reader can confirm that rather than assume it.
  //   UNMASKED    the byte is live code, and the site scanner still did not take it. That is a
  //               parser gap, not a benign exclusion, and it FAILS.
  //
  // This is the enumeration form of the rule the ledger already applies to resolvers: a sweep must
  // report what it could not classify, separately from what it found clean. `unclassified` empty
  // must mean "nothing was ambiguous", never "nothing was looked at".
  // THE UNIVERSE USES THE SAME REGEX AS THE SITE SCAN, differing ONLY in masked vs unmasked source.
  // That is not tidiness: the first cut counted the universe with `/\bagent\s*\(/`, which is a
  // WIDER predicate than `siteRe`'s `(^|[^\w$.])agent\s*\(` — `\b` matches after a dot. So
  // `this.agent(p)` and `obj.agent(p)` — ordinary method calls, not the injected global — landed in
  // the universe, never matched a site, and would have raised a BLOCKING `parser-gap` failure on
  // correct code. Zero such calls exist in these files today, so it passed; it was a false positive
  // waiting for the first contributor to write one. Constructed and confirmed before it shipped.
  //
  // Aligned, the delta is EXACTLY what masking removed, which is the only thing this classification
  // is entitled to talk about.
  const universeRe = /(^|[^\w$.])agent\s*\(/g;
  universeTotal += (src.match(universeRe) || []).length;
  sitesInJs += found.length;
  universeRe.lastIndex = 0;
  let um;
  while ((um = universeRe.exec(src)) !== null) {
    const paren = um.index + um[0].length - 1;
    if (found.includes(paren)) continue;
    // maskCode preserves every index and blanks only literal/comment BODIES, so the byte at the
    // same offset is what separates "masked away" from "missed".
    const at = paren - 'agent'.length;
    const isMasked = masked.slice(Math.max(0, at), paren) !== src.slice(Math.max(0, at), paren);
    if (isMasked) {
      unclassified.push({
        file: rel, line: lineOf(src, paren), reason: 'masked',
        detail: 'an `agent(` occurrence inside a comment or a string/template literal — excluded by design, listed so the exclusion is visible rather than assumed',
      });
    } else {
      // STATED LIMIT — `masked` MEANS "THE MASK COVERED IT", NOT "THE MASK WAS RIGHT TO".
      //
      // The tokenizer's known derail cases put LIVE CODE behind the mask: a regex literal holding a
      // lone quote (`const re = /"/;`) is read as division-then-string, and everything after it in
      // that file is blanked. A real dispatch downstream of one is then reported here as
      // `unclassified:masked` — visible, with a file:line, but labelled benign when it is not.
      //
      // Constructed and confirmed before shipping: a two-line fixture with a real second dispatch
      // after such a regex reports 1 site + 1 unclassified and PASSES. That is still strictly
      // better than what it replaced, where the same dispatch was dropped in silence and the run
      // said `1 site` with no mention of the second — but it is an improvement in VISIBILITY, not
      // in classification, and reading `masked` as "safe" would re-create the defect one word over.
      //
      // Telling a correct mask from a derailed one needs a different method — parsing rather than
      // masking — which is the boundary this file's blind-spot list already names. Not attempted
      // here; recorded so the next reader does not mistake the bucket for a guarantee.
      fail(
        'parser-gap',
        `${rel}:${lineOf(src, paren)}: an \`agent(\` occurrence is in LIVE CODE — the mask did not blank it — and the site scanner did not take it. ` +
        'That is a dispatch this check cannot see, which is the one thing it must never do silently. ' +
        'Fix the tokenizer; do not delete the occurrence.'
      );
    }
  }

  // Frozen allowlists declared in this file, for rule 3.
  const allowlists = [];
  const alRe = /(?:^|\n)\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*Object\.freeze\(\s*\[([\s\S]*?)\]\s*\)/g;
  let a;
  while ((a = alRe.exec(src)) !== null) {
    const members = [...a[2].matchAll(/'([^']*)'|"([^"]*)"/g)].map((x) => x[1] ?? x[2]);
    allowlists.push({ name: a[1], members });
  }

  for (const open of found) {
    const line = lineOf(src, open);
    const where = `${rel}:${line}`;
    const close = matchBracket(src, open);
    if (close === -1) {
      fail('parser', `${where}: could not brace-match the agent() argument list. Either the file has an unbalanced literal or this scan is wrong — do not silence it by deleting the site.`);
      continue;
    }
    const args = splitTop(src.slice(open + 1, close), ',');
    const site = { file: rel, line, agentType: null, resolution: null };
    sites.push(site);

    const secondArg = args.length > 1 ? stripComments(args[1]).trim() : '';
    if (!secondArg.startsWith('{')) {
      fail(
        'missing-options',
        `${where}: agent() has no literal options object as its second argument, so no agentType can be read. ` +
          'A variable or a computed object is not resolvable by this scan and is refused rather than assumed safe. ' +
          'Fix: pass the options inline, including agentType.'
      );
      continue;
    }

    const objText = secondArg;
    const objClose = matchBracket(objText, objText.indexOf('{'));
    const entries = splitTop(objText.slice(objText.indexOf('{') + 1, objClose === -1 ? objText.length : objClose), ',');
    if (entries.some((e) => e.trim().startsWith('...'))) {
      fail('spread-options', `${where}: the options object spreads another object. An agentType arriving through a spread is not resolvable by this scan. Fix: name agentType inline at the call site.`);
      continue;
    }
    const opts = new Map();
    for (const e of entries) {
      if (!e.trim()) continue;
      const colon = indexOfTop(e, ':');
      if (colon === -1) { opts.set(e.trim(), e.trim()); continue; } // shorthand `{ schema }`
      opts.set(e.slice(0, colon).trim(), e.slice(colon + 1).trim());
    }

    if (!opts.has('agentType')) {
      fail(
        'missing-agenttype',
        `${where}: agent() dispatch carries no \`agentType\`, so the runtime dispatches its own default — ` +
          '`general-purpose`, tools `*`, which holds Write, Edit and Bash. ' +
          "Fix: add `agentType: '<engine>'` naming a non-shim file in .claude/agents/."
      );
      continue;
    }

    const raw = opts.get('agentType').trim();
    const lit = /^'([^']*)'$/.exec(raw) || /^"([^"]*)"$/.exec(raw);
    const orParts = splitTopOr(raw);

    let name = null;
    if (lit) {
      name = lit[1];
      site.resolution = 'literal';
    } else if (orParts.length > 1) {
      // Rule 3 — a caller-supplied value. The fallback must be literal AND the file must
      // constrain what the caller is allowed to supply.
      site.resolution = 'guarded';
      const tail = orParts[orParts.length - 1].trim();
      const tailLit = /^'([^']*)'$/.exec(tail) || /^"([^"]*)"$/.exec(tail);
      if (!tailLit) {
        fail('unguarded-agenttype', `${where}: agentType is computed (\`${raw}\`) and its \`||\` fallback is not a string literal, so there is no name to check. Fix: end the expression with a literal engine name.`);
        continue;
      }
      name = tailLit[1];

      const guard = allowlists.find((l) => l.members.includes(name));
      if (!guard) {
        fail(
          'no-allowlist',
          `${where}: agentType is caller-supplied (\`${raw}\`) and ${rel} declares no frozen allowlist containing '${name}'. ` +
            'A workflow that accepts an arbitrary agent name from its caller is dispatch-identity injection — the caller picks the tool grant. ' +
            `Fix: add \`const DISPATCHABLE = Object.freeze(['${name}', ...])\` to ${rel}, refuse anything outside it before dispatching, and keep the \`|| '${name}'\` fallback.`
        );
        continue;
      }
      if (!new RegExp(`\\b${guard.name}\\.includes\\s*\\(`).test(src)) {
        fail(
          'inert-allowlist',
          `${where}: ${rel} declares \`${guard.name}\` but never calls \`${guard.name}.includes(\`. ` +
            'An allowlist nothing tests against is documentation, not a guard. Fix: refuse anything outside it before the dispatch.'
        );
      }
      for (const member of guard.members) {
        checkAgentName(member, `${rel} allowlist \`${guard.name}\``, 'member');
      }
    } else if (/^[A-Za-z_$][\w$]*$/.test(raw)) {
      const cm = new RegExp(`(?:^|\\n)\\s*(?:const|let|var)\\s+${raw}\\s*=\\s*(['"])([^'"]*)\\1`).exec(src);
      if (!cm) {
        fail('unresolved-identifier', `${where}: agentType is the identifier \`${raw}\`, and no \`const ${raw} = '<literal>'\` exists in ${rel}. Fix: assign it a string literal in this file, or inline the name at the call site.`);
        continue;
      }
      name = cm[2];
      site.resolution = `const ${raw}`;
    } else {
      fail('computed-agenttype', `${where}: agentType is the expression \`${raw}\`, which this scan cannot resolve to a name. Only a string literal, a same-file \`const NAME = '...'\`, or \`expr || 'literal'\` are accepted.`);
      continue;
    }

    site.agentType = name;
    if (!checkAgentName(name, where, 'agentType')) continue;

    // Rule 5 — WARN only. Absent at the call site means "inherit the file's", not a contradiction.
    const isoRaw = opts.get('isolation');
    const isoLit = isoRaw && (/^'([^']*)'$/.exec(isoRaw.trim()) || /^"([^"]*)"$/.exec(isoRaw.trim()));
    const declared = agentInfo(name).isolation;
    if (isoLit && declared && isoLit[1] !== declared) {
      warn('isolation-mismatch', `${where}: the dispatch says isolation '${isoLit[1]}' while ${agentInfo(name).rel} declares '${declared}'. One of the two is wrong; the call site wins at runtime.`);
    }
  }
}

// ── 6b · the coverage identity ─────────────────────────────────────────────
// Every occurrence in the universe is either a classified site or an item in the unclassified
// bucket. If that stops holding, occurrences are going somewhere neither bucket reports — which is
// the exact failure this bucket was added to end, so it fails rather than printing a line whose
// parts do not add up.
const universeAll = universeTotal + mdMentions;
const classifiedAll = sitesInJs + sitesInMd + unclassified.length;
if (universeAll !== classifiedAll) {
  fail('coverage-identity',
    `${universeAll} occurrence(s) across both universes (${universeTotal} \`agent(\` in unmasked .js source + ` +
    `${mdMentions} \`agentType\` mention(s) in .md), but ${sitesInJs} .js site(s) + ${sitesInMd} .md site(s) + ` +
    `${unclassified.length} unclassified = ${classifiedAll}. Occurrences are being dropped into neither ` +
    'bucket, which is precisely what the unclassified bucket exists to make impossible.');
}

// ── 6 · non-vacuity ────────────────────────────────────────────────────────
if (sites.length < MIN_SITES) {
  fail(
    'non-vacuity',
    `found ${sites.length} agent() dispatch site(s), floor is ${MIN_SITES}. Either dispatches were deleted ` +
      '(then lower the floor deliberately, in the same PR) or the scan stopped seeing them. A checker that ' +
      'finds nothing must fail, not report clean.'
  );
}

// ── 4 · containment: credentialed agentTypes stay inside .claude/workflows/ ─
//
// docs/ is excluded on purpose: GRANT-HOLDERS.md §4 and §6 quote the dispatch shape for both
// credentialed names while specifying them, and prose about a dispatch is not a dispatch. What
// is scanned is everything executable, plus everything under .claude/ that an agent reads as
// instruction.
//
// The rule is not vacuous even before those agents exist, and this file proved it: the first
// version of THIS comment quoted the pattern literally, and the check flagged its own source the
// moment the file was tracked. Do not write the shape out in a scanned file — name it instead.
function scannableFiles() {
  let list = [];
  try {
    // stderr is ignored deliberately: when ROOT is not a checkout (a --root fixture) git prints
    // "fatal: not a git repository" to the parent's stderr, which reads like a failure of this
    // check rather than a fallback it handles.
    list = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter(Boolean);
  } catch { /* not a git checkout (a test fixture, say) — fall through to a walk */ }
  if (!list.length) {
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
    list = walk('');
  }
  return list.filter(
    (p) => !p.startsWith('docs/') && (p.startsWith('.claude/') || /\.(js|mjs|cjs|ts|tsx|jsx)$/.test(p))
  );
}

const credRe = new RegExp(`agentType\\s*:\\s*['"](${CREDENTIALED.join('|')})['"]`, 'g');
let credScanned = 0;
for (const rel of scannableFiles()) {
  let text;
  try { text = fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch { continue; }
  credScanned++;
  if (rel.startsWith(`${WORKFLOW_DIR}/`)) continue;
  for (const hit of text.matchAll(credRe)) {
    fail(
      'containment',
      `${rel}:${lineOf(text, hit.index)} dispatches agentType '${hit[1]}', a credentialed container, from outside ${WORKFLOW_DIR}/. ` +
        'A credentialed dispatch is allowed only from a workflow file, where the call site is reviewed as workflow source. ' +
        'Fix: move the dispatch into a workflow, or drop the credentialed agentType.'
    );
  }
}

// ── report ─────────────────────────────────────────────────────────────────
// process.exitCode, NOT process.exit(). When stdout is a PIPE — how CI runs this, and how every
// `| jq` invocation runs it — console.log is ASYNCHRONOUS: Node fills the 64KB pipe buffer,
// queues the remainder, and `process.exit()` then tears the process down before that queue
// drains. The payload is cut at exactly 65536 bytes AND the exit status still reads 0, so the
// consumer receives truncated JSON reported as a clean run. Measured 2026-08-24: a 200,011-byte
// payload arrived as 65,536 through a pipe and complete through a file redirect — which is
// precisely why a file-redirected spot-check does not see it. Setting exitCode and letting the
// process end naturally drains the queue first.
//
// `fs.writeSync(1, ...)` is NOT the fix, though it looks like one: once anything has touched
// process.stdout the fd carries O_NONBLOCK, and writeSync then returns a SHORT COUNT of 65536
// without throwing, which truncates just as silently.
//
// scripts/check-dispatch-flush.test.mjs drives >64KB through this path and fails if it returns.
if (JSON_OUT) {
  console.log(JSON.stringify({ root: ROOT, sites, failures, warnings, unclassified, universe_agent_occurrences: universeTotal, sites_in_js: sitesInJs, md_agenttype_mentions: mdMentions, sites_in_md: sitesInMd, universe_total: universeAll, files_scanned: workflowFiles.length, cred_files_scanned: credScanned }, null, 2));
  process.exitCode = failures.length ? 1 : 0;
} else {
  for (const w of warnings) console.log(`⚠ ${w}`);
  for (const u of unclassified) console.log(`· [unclassified:${u.reason}] ${u.file}:${u.line} — ${u.detail}`);
  for (const f of failures) console.error(`✗ ${f}`);

  if (failures.length) {
    console.error(`\n✗ dispatch-agentType check failed — ${failures.length} problem(s), ${warnings.length} warning(s), across ${sites.length} dispatch site(s) in ${workflowFiles.length} workflow file(s).`);
    process.exitCode = 1;
  } else {
    console.log(
      `\n✓ dispatch-agentType check passed — ${sites.length} dispatch site(s) in ${workflowFiles.length} workflow file(s), ` +
        `every agentType resolved to a non-shim engine; ${credScanned} file(s) scanned for credentialed containment, ${warnings.length} warning(s), ` +
        `${unclassified.length} unclassified.`
    );
    // PRINTED ON THE PASSING PATH TOO. A third bucket a reader only meets on failure is a third
    // bucket nobody reads, and the passing run is exactly where an unexamined item hides.
    console.log(
      `  COVERAGE: ${universeAll} occurrence(s) across both universes — ${universeTotal} \`agent(\` in the ` +
      `unmasked .js workflow source and ${mdMentions} \`agentType\` mention(s) in .md — of which ` +
      `${sitesInJs} + ${sitesInMd} = ${sitesInJs + sitesInMd} were classified as dispatch site(s) and ` +
      `${unclassified.length} excluded and listed below. ` +
      'An empty unclassified list means nothing was ambiguous — never that nothing was checked.'
    );
  }
}
