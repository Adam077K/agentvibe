#!/usr/bin/env node
/**
 * check-dispatch-prompt-size.mjs — dispatch-by-reference convention checker.
 *
 * POSTURE: BLOCKS. Run by `.github/workflows/ci.yml` on every PR via
 * `npm run check:dispatch-prompt`.
 *
 * WHY THIS EXISTS.
 * TOKEN-EFFICIENCY.md §2.4 (VERIFIED, 2026-08-15, 2,412 measured dispatches):
 *   p99 prompt size = 212,282 chars. The mechanism is verbatim peer-output paste, not history
 *   replay. The fix is a convention: above ~8,000 chars, pass a file path rather than pasting
 *   the body inline. Below 8,000, inlining is fine and avoids the cost of an extra file read.
 *
 * WHAT THIS CHECKS.
 * The SOURCE TEXT of the first argument to every `agent()` call in `.claude/workflows/*.js`.
 * If the inline source text of a prompt literal exceeds PROMPT_CHAR_THRESHOLD, the dispatch
 * should instead write the content to a file and pass its path — this check fails it.
 *
 * WHAT THIS CANNOT CHECK.
 * Runtime prompt size. A template literal that is 500 chars in source can expand to 500,000
 * chars at runtime if the interpolated variables are large (e.g., pasting in full agent outputs).
 * That failure mode is out of reach for a static linter. This check is honest about it: it catches
 * the case where someone writes a massive inline prompt in source; it does not catch the case where
 * a small template grows large at runtime. Say so in the PR body rather than implying full coverage.
 *
 * HOW IT PARSES.
 * Uses the same tokenizer as check-dispatch-agenttype.mjs — brace-matched, comment-stripped,
 * string-literal-aware. It is a textual scan, not evaluation, because these files are not
 * importable (top-level `await`, free globals `agent`/`phase`/`parallel`/etc.).
 *
 * BLIND SPOTS (stated here so they become discoveries, not incidents).
 *   · A prompt assembled at runtime from function calls (e.g., `buildPrompt(s)`) — the function
 *     body is NOT resolved; only the call-site source length is checked.
 *   · A prompt built by string concatenation across many lines is measured at total source length,
 *     but only if the checker can see it as the first argument; a very complex expression may not
 *     be fully extracted.
 *   · Template interpolations (`${someVariable}`) can expand arbitrarily at runtime; their
 *     runtime size is out of reach. The static check sees the template source only.
 *   · Only `.claude/workflows/*.js` is parsed. A dispatch composed entirely at runtime by an
 *     orchestrator (e.g., passed as a JS string from `warroom`) is invisible to this check.
 *
 * NON-VACUITY.
 * The check asserts it found at least --min-sites dispatch sites. A checker that scans nothing
 * and reports clean is the exact failure mode this repo keeps catching — see the pre-history of
 * check-dispatch-agenttype.mjs.
 *
 * Usage: node scripts/check-dispatch-prompt-size.mjs [--root DIR] [--min-sites N] [--json]
 *   --threshold N   override the 8,000-char default (for testing)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const optOf = (name, dflt) => {
  const i = argv.indexOf(name);
  return i === -1 || i + 1 >= argv.length ? dflt : argv[i + 1];
};
const ROOT = path.resolve(optOf('--root', REPO));
const MIN_SITES = Number(optOf('--min-sites', '12'));
const PROMPT_CHAR_THRESHOLD = Number(optOf('--threshold', '8000'));
const JSON_OUT = argv.includes('--json');

const failures = [];
const warnings = [];
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);
const warn = (check, msg) => warnings.push(`[${check}] ${msg}`);

// ── tokenizer (same design as check-dispatch-agenttype.mjs) ──────────────────

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
      if (src[j] === '\n') return j;
      j++;
    }
    return src.length;
  }
  if (c === '`') { stack.push('`'); return i + 1; }
  return null;
}

function matchBracket(src, open) {
  const openCh = src[open];
  const closeCh = openCh === '(' ? ')' : openCh === '[' ? ']' : '}';
  const stack = [openCh];
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

/**
 * Blank comment spans (not string/template bodies) so a search for `agent(` does not match
 * the word inside a comment or a prompt string.
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
        blank(start, next);
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

// ── scan workflow files ───────────────────────────────────────────────────────

const WORKFLOW_DIR = '.claude/workflows';
const wfAbs = path.join(ROOT, WORKFLOW_DIR);
const workflowFiles = fs.existsSync(wfAbs)
  ? fs.readdirSync(wfAbs).filter((f) => f.endsWith('.js')).sort()
  : [];

if (!workflowFiles.length) {
  fail('non-vacuity', `${WORKFLOW_DIR}/ under ${ROOT} holds no .js files — this check would pass by looking at nothing.`);
}

const sites = [];

for (const file of workflowFiles) {
  const rel = `${WORKFLOW_DIR}/${file}`;
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const masked = maskCode(src);

  const rawHits = (src.match(/\bagent\s*\(/g) || []).length;
  const siteRe = /(^|[^\w$.])agent\s*\(/g;
  const found = [];
  let m;
  while ((m = siteRe.exec(masked)) !== null) found.push(m.index + m[0].length - 1);

  if (rawHits > 0 && !found.length) {
    fail('parser', `${rel}: raw text has ${rawHits} \`agent(\` occurrence(s) but the masked scan found none — tokenizer broken.`);
  }

  for (const open of found) {
    const line = lineOf(src, open);
    const where = `${rel}:${line}`;
    const close = matchBracket(src, open);
    if (close === -1) {
      fail('parser', `${where}: could not brace-match agent() argument list.`);
      continue;
    }

    const args = splitTop(src.slice(open + 1, close), ',');
    const promptArg = args.length > 0 ? args[0].trim() : '';
    const promptChars = promptArg.length;

    const site = { file: rel, line, prompt_chars: promptChars, prompt_is_inline_literal: false };
    sites.push(site);

    // Is the first argument an inline string or template literal (starts with ' " or `)?
    // Function calls, identifiers, and complex expressions are left as-is — we cannot know
    // their runtime size.
    const firstChar = promptArg[0];
    const isInlineLiteral = firstChar === "'" || firstChar === '"' || firstChar === '`';
    site.prompt_is_inline_literal = isInlineLiteral;

    if (isInlineLiteral && promptChars > PROMPT_CHAR_THRESHOLD) {
      fail(
        'oversized-inline-prompt',
        `${where}: the prompt argument is an inline ${firstChar === '`' ? 'template literal' : 'string'} ` +
          `of ${promptChars.toLocaleString()} chars in source (threshold: ${PROMPT_CHAR_THRESHOLD.toLocaleString()}). ` +
          `Above ${PROMPT_CHAR_THRESHOLD.toLocaleString()} chars, write the content to a file and pass its path ` +
          `— the agent reads the file on turn 1, which costs one tool call, not ${Math.round(promptChars / 3.7).toLocaleString()} extra tokens ` +
          `on every one of its turns. See TOKEN-EFFICIENCY.md §7.3.`
      );
    }
  }
}

// ── non-vacuity floor ─────────────────────────────────────────────────────────
if (sites.length < MIN_SITES) {
  fail(
    'non-vacuity',
    `found ${sites.length} agent() dispatch site(s); floor is ${MIN_SITES}. ` +
      'Either dispatches were deleted (then lower the floor deliberately, in the same PR) ' +
      'or the scan stopped seeing them. A checker that finds nothing must fail, not report clean.'
  );
}

// ── report ────────────────────────────────────────────────────────────────────
if (JSON_OUT) {
  console.log(JSON.stringify({
    root: ROOT,
    threshold: PROMPT_CHAR_THRESHOLD,
    sites,
    failures,
    warnings,
    files_scanned: workflowFiles.length,
  }, null, 2));
  process.exit(failures.length ? 1 : 0);
}

for (const w of warnings) console.log(`⚠ ${w}`);
for (const f of failures) console.error(`✗ ${f}`);

if (failures.length) {
  console.error(
    `\n✗ dispatch-prompt-size check failed — ${failures.length} problem(s) across ${sites.length} dispatch site(s) in ${workflowFiles.length} workflow file(s).`
  );
  process.exit(1);
}
console.log(
  `\n✓ dispatch-prompt-size check passed — ${sites.length} dispatch site(s) in ${workflowFiles.length} workflow file(s), ` +
    `all inline prompt literals ≤ ${PROMPT_CHAR_THRESHOLD.toLocaleString()} chars in source.`
);
