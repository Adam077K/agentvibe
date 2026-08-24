#!/usr/bin/env node
/**
 * check-dispatch-prompt-size.mjs — implements PS-DISPATCH-BRIEF-SIZE from
 * docs/03-system-design/agents/PROMPT-STANDARD.md §6.2.
 *
 * POSTURE: WARN (exits 0 even when warnings fire). The spec states this explicitly:
 *   "the payload is composed at runtime from free text, so a static check sees the template and
 *    not the brief. p95 is 28,855 chars and legitimate large briefs exist. Blocking on a byte
 *    count over free text is exactly the false positive §0 forbids."
 *
 * So this script WARNS — it does not block the build — but it does EXIT 1 on the one hard failure:
 * the non-vacuity floor (finding zero dispatch sites means the scanner is broken, not the files).
 *
 * WHY IT LIVES HERE AND NOT IN schema-lint.js.
 * `schema-lint.js` lints `.claude/agents/*.md`. This rule scans `.claude/workflows/*.js`, which is
 * a different surface. Implementing it in a separate script keeps the two surfaces separate and
 * keeps schema-lint.js's scope narrow. The PS-* rule id is the same in both places; the script
 * file is not.
 *
 * WHAT IT CHECKS (per PROMPT-STANDARD.md §6.2 table row `PS-DISPATCH-BRIEF-SIZE`):
 *   1. A dispatch brief in `.claude/workflows/*.js` over ~30,000 chars in SOURCE TEXT.
 *   2. A dispatch brief containing a fenced code block (``` ... ```) over 200 lines.
 *
 * THRESHOLD: ~30,000 chars (the spec value). p95 of measured dispatch prompts is 28,855 chars.
 *   The team-lead brief mentioned ~8,000 chars; the spec wins. Reported in the return JSON.
 *
 * WHAT IT CANNOT CHECK (stated, not hidden).
 *   Runtime prompt size. A template literal that is 400 chars in source can expand to 400,000 chars
 *   at runtime if the interpolated variables carry full agent outputs. That failure mode is out of
 *   reach for a static linter. The spec's own table row names this: "the payload is composed at
 *   runtime from free text." This check catches the case where someone writes a brief that is already
 *   large in source, which is a sufficient (though not necessary) condition for the problem.
 *
 * NON-VACUITY.
 * The check asserts it found at least --min-sites dispatch sites. A scanner that finds nothing and
 * reports clean is this repo's documented failure mode; see check-dispatch-agenttype.mjs pre-history.
 *
 * Usage:
 *   node scripts/check-dispatch-prompt-size.mjs [--root DIR] [--min-sites N] [--json]
 *   --threshold N      override the 30,000-char default (for testing only)
 *   --fenced-lines N   override the 200-line fenced-block limit (for testing only)
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
const BRIEF_CHAR_THRESHOLD = Number(optOf('--threshold', '30000'));
const FENCED_LINE_LIMIT = Number(optOf('--fenced-lines', '200'));
const JSON_OUT = argv.includes('--json');

const failures = [];  // non-vacuity failures only — these exit 1
const warnings = [];  // PS-DISPATCH-BRIEF-SIZE fires — these exit 0
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);
const warn = (check, msg) => warnings.push(`[${check}] ${msg}`);

// ── tokenizer (same design as check-dispatch-agenttype.mjs) ──────────────────
// Textual scan, not evaluation: these workflow files use top-level `await` and
// free globals (`agent`, `phase`, `parallel`, etc.) that make them not importable.

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
 * Blank comment spans so a search for `agent(` in masked source does not match
 * the string inside a comment or a prompt body.
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

/**
 * Count the maximum consecutive-line run inside any fenced block (``` ... ```)
 * in `text`. Returns the max run length, or 0 if no fenced blocks exist.
 */
function maxFencedBlockLines(text) {
  let max = 0;
  const re = /^```[^\n]*\n([\s\S]*?)^```/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const lines = m[1].split('\n').length;
    if (lines > max) max = lines;
  }
  return max;
}

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

    const site = {
      file: rel,
      line,
      prompt_source_chars: promptChars,
      prompt_is_inline_literal: false,
      fenced_max_lines: 0,
    };
    sites.push(site);

    // Determine whether the first argument is an inline literal (starts with ' " or `).
    // Function calls and variable references are not checked for size — runtime size is
    // out of reach for a static linter, and that is the whole reason this rule is WARN.
    const firstChar = promptArg[0];
    const isInlineLiteral = firstChar === "'" || firstChar === '"' || firstChar === '`';
    site.prompt_is_inline_literal = isInlineLiteral;

    if (isInlineLiteral) {
      if (promptChars > BRIEF_CHAR_THRESHOLD) {
        warn(
          'PS-DISPATCH-BRIEF-SIZE',
          `${where}: the prompt argument is an inline ${firstChar === '`' ? 'template literal' : 'string'} ` +
            `of ${promptChars.toLocaleString()} chars in source (threshold ~${BRIEF_CHAR_THRESHOLD.toLocaleString()}). ` +
            `A dispatch brief should pass file paths, branch names and identifiers — not paste an artifact ` +
            `or peer-agent output by value. See PROMPT-STANDARD.md §2.3 and §6.2.`
        );
      }

      const fencedMax = maxFencedBlockLines(promptArg);
      site.fenced_max_lines = fencedMax;
      if (fencedMax > FENCED_LINE_LIMIT) {
        warn(
          'PS-DISPATCH-BRIEF-SIZE',
          `${where}: the inline prompt contains a fenced block of ${fencedMax} lines ` +
            `(limit: ${FENCED_LINE_LIMIT}). A fenced block that long is almost certainly a pasted ` +
            `artifact — pass a file path instead. See PROMPT-STANDARD.md §2.3 and §6.2.`
        );
      }
    }
  }
}

// ── non-vacuity floor (FAILS, not WARNS) ─────────────────────────────────────
if (sites.length < MIN_SITES) {
  fail(
    'non-vacuity',
    `found ${sites.length} agent() dispatch site(s); floor is ${MIN_SITES}. ` +
      'Either dispatches were deleted (then lower the floor deliberately, in the same PR) ' +
      'or the scan stopped seeing them. A checker that finds nothing must fail, not report clean.'
  );
}

// ── report ────────────────────────────────────────────────────────────────────
// process.exitCode, NOT process.exit(). Stdout to a PIPE is asynchronous, so `process.exit()`
// after a large console.log tears the process down with the write still queued: the payload is
// cut at exactly 65536 bytes and the exit status still reads 0. See the long note in
// check-dispatch-agenttype.mjs for the measurement, and why `fs.writeSync(1, ...)` is not the
// fix. scripts/check-dispatch-flush.test.mjs drives >64KB through this path.
if (JSON_OUT) {
  console.log(JSON.stringify({
    root: ROOT,
    threshold: BRIEF_CHAR_THRESHOLD,
    fenced_line_limit: FENCED_LINE_LIMIT,
    sites,
    failures,
    warnings,
    files_scanned: workflowFiles.length,
  }, null, 2));
  // WARN = exit 0; hard FAIL (non-vacuity, parser) = exit 1.
  process.exitCode = failures.length ? 1 : 0;
} else {
  for (const w of warnings) console.log(`⚠ [PS-DISPATCH-BRIEF-SIZE] ${w}`);
  for (const f of failures) console.error(`✗ ${f}`);

  if (failures.length) {
    console.error(
      `\n✗ dispatch-prompt-size check failed — ${failures.length} hard problem(s) across ${sites.length} dispatch site(s) in ${workflowFiles.length} workflow file(s).`
    );
    process.exitCode = 1;
  } else if (warnings.length) {
    console.log(
      `\n⚠ dispatch-prompt-size (PS-DISPATCH-BRIEF-SIZE): ${warnings.length} warning(s) across ${sites.length} site(s) in ${workflowFiles.length} file(s). Posture: WARN — does not block.`
    );
  } else {
    console.log(
      `\n✓ dispatch-prompt-size (PS-DISPATCH-BRIEF-SIZE) passed — ${sites.length} dispatch site(s) in ${workflowFiles.length} workflow file(s), ` +
        `no inline literals >${BRIEF_CHAR_THRESHOLD.toLocaleString()} chars or fenced blocks >${FENCED_LINE_LIMIT} lines.`
    );
  }
}
