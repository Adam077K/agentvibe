'use strict';
// POSTURE: library — it never exits. Its callers block: `scripts/ledger.mjs` and
// `.claude/hooks/schema-lint.js` both turn a non-empty issue list into exit 1.
//
// scripts/lib/claims.js — the claim schema, and a STRICT parser for claim blocks.
//
// WHY STRICT IS THE WHOLE POINT
// Two parsers in this repository have already failed by returning empty instead of
// failing. `build-skills-manifest.mjs` had a line-wise reader that silently produced
// an empty description for the 4 skills using folded YAML, and `schema-lint.js` still
// sets LIVE_SKILLS = null in a catch block, disabling its own skill check whenever the
// manifest will not parse. A claim parser with that shape would report "0 claims, all
// good" for a file full of unverifiable assertions — the exact failure the ledger
// exists to prevent.
//
// So every function here REFUSES what it cannot classify. There is no path that
// swallows a malformed block and returns []. Unparseable input throws ClaimError with
// a line number; unrecognized structure throws; a tab in indentation throws; a
// duplicate key throws. `null` and `[]` mean "there were genuinely no claims here",
// and nothing else can produce them.
//
// A claim lives INSIDE the artifact it supports, in one of two forms:
//
//   1. A fenced block in any markdown file:
//        ```claims
//        claims:
//          - id: c-example
//            ...
//        ```
//   2. A `claims:` key in YAML frontmatter (for files that already carry frontmatter).
//
// Code carries claims through form 2 on its test file, or through a `verified_by:
// command` claim whose `cmd` runs the binding test. There is no third parser.

const KINDS = [
  'external-fact',
  'internal-fact',
  'behavior',
  'user-language',
  'judgment',
  'runtime-capability',
  'preference',
];
const SCOPES = ['global', 'project', 'task'];
const VERIFIERS = ['source', 'command', 'judge'];
const RISKS = ['low', 'high'];
const VERDICTS = ['pass', 'fail', 'unresolved'];

// ADR-001 and §3.1: "On expiry, exactly one disposition is recorded — Refresh · Deprecate ·
// Waive(new deadline)." Phase 3 shipped `valid_until` without this, which leaves an expired
// claim producing the same warning forever — and a warning that repeats unchanged is a
// warning nobody reads. A disposition is the record that somebody decided.
const DISPOSITIONS = ['refresh', 'deprecate', 'waive'];

const ID_RE = /^c-[a-z0-9][a-z0-9-]*$/;
// `supports:` entries must be resolvable, not decorative. Exactly two forms:
//   d-NNN   an ADR — must exist at docs/03-system-design/adr/NNN-*.md
//   c-...   another claim — must exist in the ledger
// scripts/ledger.mjs resolves both and fails the lint on a dangling target, so blast
// radius is a real query rather than a field nobody reads.
const SUPPORTS_RE = /^(d-\d{3}|c-[a-z0-9][a-z0-9-]*)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

class ClaimError extends Error {
  constructor(msg, line) {
    super(line ? `line ${line}: ${msg}` : msg);
    this.name = 'ClaimError';
    this.line = line || null;
  }
}

// ── Comment stripping that respects quotes ──────────────────────────────────
// A `#` inside "..." or '...' is content, not a comment. An unterminated quote is
// an error, not something to guess at — we do not support multi-line plain quoted
// scalars, so a dangling quote always means the line is malformed.
function stripComment(s, lineNo) {
  let inS = false;
  let inD = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    // Inside a double-quoted scalar a backslash escapes the next character, so `\"`
    // must not be read as the closing quote.
    if (inD && c === '\\') { i++; continue; }
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    else if (c === '#' && !inS && !inD && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
  }
  if (inS || inD) throw new ClaimError('unterminated quote', lineNo);
  return s;
}

// YAML double-quoted escapes. Strict: an escape this does not know is an error rather
// than a character silently passed through.
//
// Without this, `cmd: "node -e \"...\""` reached the shell with literal backslashes and
// the command died with a syntax error — which is at least loud, but the same bug in a
// `quote:` field would have compared the wrong text against a fetched page and reported
// a clean pass. Found by running three global claims, two of which were true and failed.
const DQ_ESCAPES = { '\\': '\\', '"': '"', '/': '/', n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', 0: '\0', ' ': ' ' };

function unescapeDouble(body, lineNo) {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c !== '\\') { out += c; continue; }
    const next = body[++i];
    if (next === undefined) throw new ClaimError('string ends with a dangling backslash', lineNo);
    if (next === 'u' || next === 'x') {
      const width = next === 'u' ? 4 : 2;
      const hex = body.slice(i + 1, i + 1 + width);
      if (!new RegExp(`^[0-9a-fA-F]{${width}}$`).test(hex)) {
        throw new ClaimError(`bad \\${next} escape`, lineNo);
      }
      out += String.fromCharCode(parseInt(hex, 16));
      i += width;
      continue;
    }
    if (!(next in DQ_ESCAPES)) throw new ClaimError(`unknown escape "\\${next}"`, lineNo);
    out += DQ_ESCAPES[next];
  }
  return out;
}

// ── Line scan ───────────────────────────────────────────────────────────────
function scanLines(text) {
  const out = [];
  const raw = String(text).split('\n');
  for (let idx = 0; idx < raw.length; idx++) {
    const line = raw[idx];
    const n = idx + 1;
    if (/^\s*$/.test(line)) continue;
    const indent = line.match(/^ */)[0].length;
    if (/\t/.test(line.slice(0, line.length - line.trimStart().length))) {
      throw new ClaimError('tab in indentation — YAML indentation must be spaces', n);
    }
    const body = line.slice(indent);
    if (body.startsWith('#')) continue;
    const content = stripComment(body, n).replace(/\s+$/, '');
    if (content === '') continue;
    // `raw` is the 0-based index of this line in the UNMODIFIED source. Everything else on
    // this record has been normalised — comment-stripped, right-trimmed, de-indented — and a
    // block scalar needs the bytes back. It is the only handle that survives that.
    out.push({ n, indent, content, raw: idx });
  }
  return out;
}

// ── Flow (inline) collections: [a, b] and {k: v, k2: v2} ────────────────────
function splitFlow(s, lineNo) {
  const parts = [];
  let depth = 0;
  let inS = false;
  let inD = false;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inD && c === '\\') { cur += c + (s[++i] ?? ''); continue; }
    if (c === "'" && !inD) { inS = !inS; cur += c; continue; }
    if (c === '"' && !inS) { inD = !inD; cur += c; continue; }
    if (!inS && !inD) {
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') depth--;
      else if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
    }
    cur += c;
  }
  if (inS || inD) throw new ClaimError('unterminated quote in flow collection', lineNo);
  if (depth !== 0) throw new ClaimError('unbalanced brackets in flow collection', lineNo);
  if (cur.trim() !== '' || parts.length > 0) parts.push(cur);
  return parts.map((p) => p.trim()).filter((p, i, a) => !(p === '' && i === a.length - 1 && a.length > 1) && p !== '');
}

function parseScalar(raw, lineNo) {
  const s = raw.trim();
  if (s === '') return null;
  if (s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;

  if (s.startsWith('[')) {
    if (!s.endsWith(']')) throw new ClaimError('flow sequence not closed with "]"', lineNo);
    return splitFlow(s.slice(1, -1), lineNo).map((p) => parseScalar(p, lineNo));
  }
  if (s.startsWith('{')) {
    if (!s.endsWith('}')) throw new ClaimError('flow mapping not closed with "}"', lineNo);
    const map = {};
    for (const pair of splitFlow(s.slice(1, -1), lineNo)) {
      const at = splitTopLevelColon(pair);
      if (at < 0) throw new ClaimError(`flow mapping entry "${pair}" has no ":"`, lineNo);
      const k = pair.slice(0, at).trim().replace(/^["']|["']$/g, '');
      if (k === '') throw new ClaimError('flow mapping entry has an empty key', lineNo);
      if (Object.prototype.hasOwnProperty.call(map, k)) {
        throw new ClaimError(`duplicate key "${k}" in flow mapping`, lineNo);
      }
      map[k] = parseScalar(pair.slice(at + 1), lineNo);
    }
    return map;
  }
  if (s.startsWith('"') && s.endsWith('"') && s.length > 1) {
    return unescapeDouble(s.slice(1, -1), lineNo);
  }
  if (s.startsWith("'") && s.endsWith("'") && s.length > 1) {
    // Single-quoted YAML: backslash is literal; '' is the only escape.
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (s.includes('"') || s.includes("'")) {
    // A quote in the middle of a bare scalar is ambiguous. Refuse rather than guess.
    throw new ClaimError(`scalar ${JSON.stringify(s)} mixes quotes with bare text — quote the whole value`, lineNo);
  }
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d*\.\d+$/.test(s)) return parseFloat(s);
  return s;
}

// Index of the `:` that separates key from value, ignoring quoted regions.
function splitTopLevelColon(s) {
  let inS = false;
  let inD = false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inD && c === '\\') { i++; continue; }
    if (c === "'" && !inD) inS = !inS;
    else if (c === '"' && !inS) inD = !inD;
    else if (!inS && !inD) {
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') depth--;
      else if (c === ':' && depth === 0) return i;
    }
  }
  return -1;
}

// ── Block scalars ───────────────────────────────────────────────────────────
//
// Read from the RAW source, never from the scanned array. `scanLines` is a whole-document
// pre-pass: before any structure is known it drops blank lines, drops `#`-first lines, strips
// trailing comments, strips trailing whitespace and strips leading indentation. All five are
// right for a plain scalar and all five destroy a block-scalar body — and two of them (a
// dropped blank line, a dropped `#`-first line) remove the line from `lines[]` ENTIRELY, so
// the body is not reconstructible from what the scan returned. Measured against PyYAML 6.0.3
// and js-yaml 4.1.1 before this function existed: a `#` after a space truncated the value, a
// `#`-first line vanished, a blank line vanished (destroying the fold boundary in `>`),
// relative indentation flattened to column 0, and trailing whitespace was stripped. One live
// value was corrupt because of it — `.claude/skills/CURATION.yml` added[9].why.
//
// CHOMPING IS `strip`, DELIBERATELY, FOR ALL FOUR ACCEPTED INDICATORS. YAML's default is
// `clip`, which keeps one trailing newline. This parser has always applied `strip`, so `|`
// agrees with `|-` and `>` with `>-`; the differential probe records `|-` and `>-` as already
// matching both reference implementations byte for byte. Adopting `clip` would change all 15
// block-scalar values in `.claude/gates.yml` — an `irreversible`-tier surface — to recover
// ZERO content, and would split `|` from `|-` where they agree today.
//
// FOUR DIVERGENCES FROM A CONFORMING PARSER REMAIN. Each has a row in the cross-check list in
// `scripts/claims.test.mjs`; NONE is a sentence without a test behind it.
//
//   1. Chomping is `strip`, not `clip` — `|`/`>` drop a trailing newline the references keep.
//   2. `|+`, `>+` and `|2` are not implemented, and are NOT reliably refused. With a
//      more-indented body they throw `unexpected indentation`. With NO body, or a body of only
//      blank or `#`-first lines — which `scanLines` deletes before this code runs — the value
//      silently becomes the literal indicator string: `a: |+\nb: 2` yields `{a: "|+"}` where
//      the references yield `{a: ""}`. That string also clears `validateEvidence`'s
//      `.trim() !== ''` floor, which `""` would not. Pre-existing; named, not fixed here.
//   3. An empty block scalar THROWS where the references return `""`. Deliberate: a silently
//      empty value is the failure this parser exists to refuse.
//   4. THE SIXTH LOSS, NOT FIXED BY THIS CHANGE and not fixable from here: `scanLines` runs
//      `stripComment` over every line of the document, block-scalar bodies included, so an odd
//      apostrophe in a body throws `unterminated quote` and takes the WHOLE DOCUMENT with it.
//      `k: |-\n  the judge's verdict` is unparseable; both references read it. The raw-source
//      read below cannot rescue it because the throw happens first, in the pre-pass. Live
//      instance: `.claude/agents/reviewer-readonly.md` frontmatter, which `schema-lint` reads
//      with its own `parseFrontmatter` and so does not hit. This fix makes the block-scalar
//      VALUE content; the ADMISSION decision is still made by the line scanner.
function readBlockScalar(src, headerRaw, parentIndent, indicator, lineNo, key) {
  const isBlank = (l) => /^[ ]*$/.test(l);
  const indentOf = (l) => l.match(/^ */)[0].length;

  // Content indentation is set by the first NON-EMPTY line of the body, per YAML.
  let contentIndent = -1;
  for (let k = headerRaw + 1; k < src.length; k++) {
    if (isBlank(src[k])) continue;
    const ind = indentOf(src[k]);
    if (ind <= parentIndent) break;
    contentIndent = ind;
    break;
  }
  if (contentIndent < 0) {
    throw new ClaimError(`block scalar "${key}: ${indicator}" has no content`, lineNo);
  }

  // The block ends at the first NON-EMPTY line indented below the content indent. A blank
  // line has indent 0 and is a CONTINUATION, not a terminator: read it as a terminator and
  // the scalar truncates at the first paragraph break; ignore the non-empty rule and it
  // swallows the rest of the document. A line indented between the parent and the content
  // indent also ends the block, and the caller then raises `unexpected indentation` on it,
  // which is the honest answer to malformed input.
  const body = [];
  let endRaw = headerRaw + 1;
  for (let k = headerRaw + 1; k < src.length; k++) {
    // A whitespace-only line never TERMINATES the block, but it is not always empty either:
    // real YAML keeps whatever sits at or past the content indent. Pushing '' unconditionally
    // dropped those bytes — measured `"a\n\nb"` where both references give `"a\n   \nb"`.
    if (isBlank(src[k])) {
      body.push(src[k].length > contentIndent ? src[k].slice(contentIndent) : '');
      endRaw = k + 1;
      continue;
    }
    if (indentOf(src[k]) < contentIndent) break;
    body.push(src[k].slice(contentIndent));
    endRaw = k + 1;
  }
  while (body.length && body[body.length - 1] === '') body.pop();  // strip chomping

  return { value: indicator[0] === '>' ? foldLines(body) : body.join('\n'), endRaw };
}

/**
 * YAML folding for `>`: one break between two ordinary lines becomes a space; n+1 consecutive
 * breaks become n newlines; and any break touching a MORE-INDENTED line stays literal, as do
 * that line's own leading spaces. Written over BREAKS rather than over lines because the two
 * disagree exactly where it matters — a single blank line between two content lines is two
 * breaks and folds to ONE newline, not two.
 */
function foldLines(body) {
  if (body.length === 0) return '';
  let out = body[0];
  let i = 1;
  while (i < body.length) {
    let blanks = 0;
    while (i + blanks < body.length && body[i + blanks] === '') blanks++;
    const at = i + blanks;
    if (at >= body.length) break;  // trailing blanks: already strip-chomped away
    const prev = body[i - 1];
    const next = body[at];
    const literal = /^[ \t]/.test(next) || (prev !== '' && /^[ \t]/.test(prev));
    if (prev === '' || literal) out += '\n'.repeat(blanks + 1);
    else if (blanks === 0) out += ' ';
    else out += '\n'.repeat(blanks);
    out += next;
    i = at + 1;
  }
  return out;
}

// ── Recursive descent over the scanned lines ────────────────────────────────
function parseNode(lines, i, indent, src) {
  if (i >= lines.length) throw new ClaimError('unexpected end of block');
  if (/^-(\s|$)/.test(lines[i].content)) return parseSeq(lines, i, indent, src);
  return parseMap(lines, i, indent, src);
}

function parseSeq(lines, i, indent, src) {
  const items = [];
  while (i < lines.length && lines[i].indent === indent && /^-(\s|$)/.test(lines[i].content)) {
    const { n, content } = lines[i];
    const rest = content.replace(/^-\s*/, '');
    const off = content.length - rest.length;

    if (rest === '') {
      // "-" alone: the item is a block on the following, more-indented lines.
      i++;
      if (i < lines.length && lines[i].indent > indent) {
        const r = parseNode(lines, i, lines[i].indent, src);
        items.push(r.value);
        i = r.next;
      } else {
        throw new ClaimError('sequence item "-" has no value', n);
      }
      continue;
    }

    if (splitTopLevelColon(rest) >= 0 && !rest.startsWith('{') && !rest.startsWith('[')) {
      // "- key: value" — a block mapping whose first key sits at column indent+off.
      const inner = [{ n, indent: indent + off, content: rest, raw: lines[i].raw }];
      let j = i + 1;
      while (j < lines.length && lines[j].indent > indent) { inner.push(lines[j]); j++; }
      const r = parseNode(inner, 0, indent + off, src);
      if (r.next !== inner.length) {
        throw new ClaimError('unexpected indentation inside sequence item', inner[r.next].n);
      }
      items.push(r.value);
      i = j;
      continue;
    }

    // "- scalar" / "- {inline}" / "- [inline]"
    items.push(parseScalar(rest, n));
    i++;
  }
  return { value: items, next: i };
}

function parseMap(lines, i, indent, src) {
  const map = {};
  while (i < lines.length && lines[i].indent === indent) {
    const { n, content, raw: headerRaw } = lines[i];
    if (/^-(\s|$)/.test(content)) {
      throw new ClaimError('sequence item where a mapping key was expected', n);
    }
    const at = splitTopLevelColon(content);
    if (at < 0) throw new ClaimError(`expected "key: value", got ${JSON.stringify(content)}`, n);
    const key = content.slice(0, at).trim().replace(/^["']|["']$/g, '');
    if (key === '') throw new ClaimError('empty mapping key', n);
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(key)) {
      throw new ClaimError(`mapping key ${JSON.stringify(key)} is not a plain identifier`, n);
    }
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throw new ClaimError(`duplicate key "${key}"`, n);
    }
    const rest = content.slice(at + 1).trim();

    if (rest === '>' || rest === '|' || rest === '>-' || rest === '|-') {
      // Block scalar. This is the exact shape that silently produced empty strings in
      // build-skills-manifest.mjs before Phase 1 — it is handled explicitly here.
      // UNREACHABLE FROM ANY DOCUMENT, and deliberately kept: every scanned line carries
      // `raw`, and `parseSeq`'s one synthetic line copies it. It guards a FUTURE caller that
      // builds a line and forgets — without it, `lines[i].raw < endRaw` is false immediately
      // and the body is silently re-parsed as structure. A mutation run confirms no test kills
      // its removal, because no input can reach it; that is a property of the guard, not a gap
      // in the tests, and it is written here so nobody claims coverage it does not have.
      if (typeof headerRaw !== 'number') {
        throw new ClaimError(`internal: scanned line for "${key}" carries no raw source index`, n);
      }
      const { value, endRaw } = readBlockScalar(src, headerRaw, indent, rest, n, key);
      map[key] = value;
      // Advance past every SCANNED line the body consumed, indexed by RAW source line. That
      // index is what makes this correct: the body's blank and `#`-first lines are absent
      // from `lines[]` altogether, so an indent-based advance cannot see what was just read.
      i++;
      while (i < lines.length && lines[i].raw < endRaw) i++;
      continue;
    }

    if (rest === '') {
      i++;
      if (i < lines.length && lines[i].indent > indent) {
        const r = parseNode(lines, i, lines[i].indent, src);
        map[key] = r.value;
        i = r.next;
      } else if (i < lines.length && lines[i].indent === indent && /^-(\s|$)/.test(lines[i].content)) {
        // A sequence at the SAME indent as its key — legal YAML, common in this repo.
        const r = parseSeq(lines, i, indent, src);
        map[key] = r.value;
        i = r.next;
      } else {
        throw new ClaimError(`key "${key}" has no value — write "${key}: null" if that is intended`, n);
      }
      continue;
    }

    map[key] = parseScalar(rest, n);
    i++;
  }
  if (i < lines.length && lines[i].indent > indent) {
    throw new ClaimError('unexpected indentation', lines[i].n);
  }
  return { value: map, next: i };
}

/** Parse a YAML subset. Throws ClaimError on anything it does not fully understand. */
function parseYamlSubset(text) {
  // NORMALISE LINE ENDINGS ONCE, HERE, BEFORE ANYTHING SPLITS THE TEXT. `\r\n?` and not
  // `\r\n`: the lone-CR case is the dangerous one. `scanLines` splits on `\n` only, so a
  // CR-terminated file was ONE line, and `k: |-\r  a\r  b` parsed to the value "|-\r  a\r  b"
  // — the block indicator itself became the content, silently. CRLF was milder and equally
  // silent: every value kept an interior `\r`, and a CRLF blank line inside a block threw
  // `unexpected indentation`. Measured against js-yaml 4.1.1: `\r\n?` fixes all three, `\r\n`
  // alone fixes only the middle one, and widening the blankness predicate instead would leave
  // TWO predicates over one source to disagree later. Normalising removes the condition.
  const normalised = String(text).replace(/\r\n?/g, '\n');
  const src = normalised.split('\n');
  const lines = scanLines(normalised);
  if (lines.length === 0) return null;
  const base = lines[0].indent;
  for (const l of lines) {
    if (l.indent < base) throw new ClaimError('block is not consistently indented', l.n);
  }
  const r = parseNode(lines, 0, base, src);
  if (r.next !== lines.length) throw new ClaimError('unexpected trailing content', lines[r.next].n);
  return r.value;
}

// ── Extracting claim blocks from an artifact ────────────────────────────────

/**
 * Find every claim block in a file's text.
 * Returns [{ yaml, startLine, form }]. Never guesses: a fence opened and not closed
 * throws rather than being ignored.
 */
function extractClaimBlocks(text) {
  const blocks = [];
  const lines = String(text).split('\n');

  // Form 1 — ```claims fenced blocks.
  //
  // Fence nesting is honoured, and it is not pedantry: CLAIM-LEDGER.md documents the
  // claim format by showing a ```claims block wrapped in a ````markdown block. A scanner
  // that ignores the outer fence compiles that EXAMPLE into a live claim — which is
  // exactly what happened on the first run, producing a claim whose evidence command was
  // `npm run check`, i.e. the very check that was running it. Per CommonMark, a fence
  // opened with N backticks is closed only by a run of at least N, and everything
  // between is opaque.
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].trim().match(/^(`{3,})\s*([^`]*?)\s*$/);
    if (!open) continue;
    const ticks = open[1].length;
    const info = open[2];

    let close = -1;
    for (let j = i + 1; j < lines.length; j++) {
      const m = lines[j].trim().match(/^(`{3,})\s*$/);
      if (m && m[1].length >= ticks) { close = j; break; }
    }
    if (info === 'claims') {
      if (close < 0) throw new ClaimError('```claims fence opened but never closed', i + 1);
      blocks.push({ yaml: lines.slice(i + 1, close).join('\n'), startLine: i + 2, form: 'fence' });
    }
    // Whether it was a claims fence or any other fence, skip past its body: content
    // inside a fence is never scanned for further fences.
    if (close < 0) break;
    i = close;
  }

  // Form 2 — a `claims:` key in YAML frontmatter. Only the claims key is extracted,
  // so unrelated frontmatter (agent schemas, session headers) cannot make this throw.
  const fm = String(text).match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    const fmLines = fm[1].split('\n');
    const start = fmLines.findIndex((l) => /^claims\s*:\s*$/.test(l));
    if (start >= 0) {
      const collected = [fmLines[start]];
      for (let i = start + 1; i < fmLines.length; i++) {
        if (/^\S/.test(fmLines[i]) && !/^\s*-/.test(fmLines[i])) break;
        collected.push(fmLines[i]);
      }
      blocks.push({ yaml: collected.join('\n'), startLine: start + 2, form: 'frontmatter' });
    }
  }

  return blocks;
}

// ── Schema validation ───────────────────────────────────────────────────────

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * The independence rule, in one place.
 *
 * A panel of one model family is one opinion wearing several hats. It is used twice —
 * for `risk: high` judge claims here, and for `independent: true` review lenses in
 * `.claude/hooks/schema-lint.js` — so it lives in one function rather than being
 * reimplemented, for the same reason there is exactly one risk classifier.
 *
 * Returns null when the panel is independent, or an explanatory string when it is not.
 */
function independenceIssue(families, minimum, label) {
  const distinct = [...new Set((families || []).filter(Boolean))];
  if (distinct.length >= minimum) return null;
  return `${label} requires >=${minimum} distinct model families, got ${distinct.length} ` +
    `(${distinct.join(', ') || 'none'}) — one family agreeing with itself is one opinion`;
}

function isRealDate(s) {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function validateEvidence(c, issues, where) {
  const ev = c.evidence;
  if (!isPlainObject(ev)) {
    issues.push(`${where}: evidence must be a mapping`);
    return;
  }
  if (c.verified_by === 'source') {
    if (typeof ev.url !== 'string' || !/^https?:\/\/\S+$/.test(ev.url)) {
      issues.push(`${where}: evidence.url must be an http(s) URL`);
    }
    if (typeof ev.quote !== 'string' || ev.quote.trim() === '') {
      issues.push(`${where}: evidence.quote is required — the resolver asserts this text is present at the URL`);
    }
    if (typeof ev.accessed !== 'string' || !isRealDate(ev.accessed)) {
      issues.push(`${where}: evidence.accessed must be a real YYYY-MM-DD date`);
    }
  } else if (c.verified_by === 'command') {
    if (typeof ev.cmd !== 'string' || ev.cmd.trim() === '') {
      issues.push(`${where}: evidence.cmd is required`);
    }
    if (ev.expect_exit !== undefined && !Number.isInteger(ev.expect_exit)) {
      issues.push(`${where}: evidence.expect_exit must be an integer`);
    }
    // unchecked_exit is an opt-in field that maps one exit code to `unresolved` rather than
    // `fail`. It must differ from expect_exit: an exit code that is simultaneously "the claim
    // holds" and "I could not check" has no coherent meaning.
    if (ev.unchecked_exit !== undefined) {
      if (!Number.isInteger(ev.unchecked_exit)) {
        issues.push(`${where}: evidence.unchecked_exit must be an integer`);
      }
      const effective_expect = ev.expect_exit === undefined ? 0 : ev.expect_exit;
      if (Number.isInteger(ev.unchecked_exit) && ev.unchecked_exit === effective_expect) {
        issues.push(`${where}: evidence.unchecked_exit (${ev.unchecked_exit}) must not equal expect_exit — a code cannot mean both "checked, held" and "could not check"`);
      }
    }
    if (ev.expect_stdout !== undefined) {
      if (typeof ev.expect_stdout !== 'string') {
        issues.push(`${where}: evidence.expect_stdout must be a string (regex)`);
      } else {
        try { new RegExp(ev.expect_stdout); }
        catch (e) { issues.push(`${where}: evidence.expect_stdout is not a valid regex (${e.message})`); }
      }
    }
    // configuration_only is an opt-in boolean that marks a command claim as checking only
    // the configuration its measurement was taken against, not live behaviour. When the
    // command passes, the resolver annotates the reason so `verify` output distinguishes
    // a configuration-only pass from a claim that actually re-measured behaviour.
    // The sibling of evidence.unchecked_exit (issue #81): both are about the ledger
    // representing "I did not actually check the thing I asserted." See issue #90.
    if (ev.configuration_only !== undefined && ev.configuration_only !== true) {
      issues.push(`${where}: evidence.configuration_only must be true (or omitted) — it is a flag, not a value`);
    }
  } else if (c.verified_by === 'judge') {
    if (!Array.isArray(ev.lenses) || ev.lenses.length === 0) {
      issues.push(`${where}: evidence.lenses must be a non-empty list`);
    }
    if (!RISKS.includes(ev.risk)) {
      issues.push(`${where}: evidence.risk must be one of (${RISKS.join('|')})`);
    }
    if (!Array.isArray(ev.judged_by)) {
      issues.push(`${where}: evidence.judged_by must be a list of judgments (empty list = not yet judged)`);
      return;
    }
    const families = new Set();
    ev.judged_by.forEach((j, k) => {
      if (!isPlainObject(j)) { issues.push(`${where}: judged_by[${k}] must be a mapping`); return; }
      for (const f of ['model_family', 'model_id', 'verdict', 'at']) {
        if (typeof j[f] !== 'string' || j[f].trim() === '') {
          issues.push(`${where}: judged_by[${k}].${f} is required`);
        }
      }
      if (j.verdict !== undefined && !VERDICTS.includes(j.verdict)) {
        issues.push(`${where}: judged_by[${k}].verdict must be one of (${VERDICTS.join('|')})`);
      }
      if (typeof j.at === 'string' && !isRealDate(j.at)) {
        issues.push(`${where}: judged_by[${k}].at must be a real YYYY-MM-DD date`);
      }
      if (typeof j.model_family === 'string') families.add(j.model_family);
    });
    // The independence rule — shared with review-lens linting, see independenceIssue().
    if (ev.risk === 'high' && ev.judged_by.length > 0) {
      const problem = independenceIssue([...families], 2, `${where}: risk:high`);
      if (problem) issues.push(problem);
    }
  }
}

// A disposition is a dated promise, not an excuse. `waive` therefore REQUIRES a date —
// a waiver with no end is just the claim being switched off, which is the thing the
// expiry mechanism exists to prevent. `refresh` and `deprecate` require a reason,
// because both are assertions about the world that someone should be able to check.
function validateDisposition(c, issues, where) {
  const d = c.disposition;
  if (!isPlainObject(d)) {
    issues.push(`${where}: disposition must be a mapping — {action, until, reason}`);
    return;
  }
  if (!DISPOSITIONS.includes(d.action)) {
    issues.push(`${where}: disposition.action must be one of (${DISPOSITIONS.join('|')}), got ${JSON.stringify(d.action)}`);
  }
  if (d.action === 'waive') {
    if (typeof d.until !== 'string' || !isRealDate(d.until)) {
      issues.push(`${where}: disposition.action:waive requires "until" (YYYY-MM-DD) — a waiver with no end date is the claim being switched off`);
    }
  } else if (d.until !== undefined && d.until !== null) {
    issues.push(`${where}: disposition.until only applies to action:waive`);
  }
  if (typeof d.reason !== 'string' || d.reason.trim() === '') {
    issues.push(`${where}: disposition.reason is required — record why, so the next reader can check it`);
  }
  const known = new Set(['action', 'until', 'reason']);
  for (const k of Object.keys(d)) {
    if (!known.has(k)) issues.push(`${where}: unknown disposition field "${k}"`);
  }
}

/**
 * Is this claim retired?
 *
 * ONE CALLER TODAY — `scripts/lib/claim-append.js`, and nothing else. Stated plainly
 * because the first version of this comment said "ONE PREDICATE, TWO CALLERS, ON PURPOSE"
 * and named `checkCitations` as the second. That was false when it was written: the
 * `checkCitations` change was implemented, run, and BACKED OUT in the same branch, and
 * two comments went on asserting the state the code no longer had — inside the mechanism
 * whose entire purpose is to stop assertions being accepted where evidence was required.
 *
 * `scripts/ledger.mjs` still decides which prose citations resolve by SET MEMBERSHIP,
 * `projectIds.has(id)`, and never opens the record, so a deprecated id passes `lint`
 * exactly as a live one does. That gap is real and is documented where it lives, in
 * `checkCitations`'s preamble, together with the measurement showing why the obvious
 * predicate is wrong: supersession and historical record are legitimate reasons for
 * prose to name a retired claim, and a set lookup cannot tell them from an assertion.
 * This function is here so that when someone closes that properly — most likely with a
 * `supersedes:` field — there is one place to change, not two.
 *
 * `waive` is deliberately NOT deprecation. A waiver is a dated promise to come back;
 * `claim-freshness` already fails a lapsed one harder than none, and treating a waived
 * claim as retired would hide it from the mechanism that chases it.
 */
function isDeprecated(c) {
  return Boolean(c && c.disposition && c.disposition.action === 'deprecate');
}

/** Validate one claim object. Returns a list of human-readable issue strings. */
function validateClaim(c, where) {
  const issues = [];
  if (!isPlainObject(c)) return [`${where}: claim must be a mapping`];

  if (typeof c.id !== 'string' || !ID_RE.test(c.id)) {
    issues.push(`${where}: id must match ${ID_RE} (got ${JSON.stringify(c.id)})`);
  }
  if (typeof c.assert !== 'string' || c.assert.trim() === '') {
    issues.push(`${where}: assert must be a non-empty string`);
  }
  if (!KINDS.includes(c.kind)) {
    issues.push(`${where}: kind must be one of (${KINDS.join('|')}), got ${JSON.stringify(c.kind)}`);
  }
  if (!SCOPES.includes(c.scope)) {
    issues.push(`${where}: scope must be one of (${SCOPES.join('|')}), got ${JSON.stringify(c.scope)}`);
  }
  if (!VERIFIERS.includes(c.verified_by)) {
    issues.push(`${where}: verified_by must be one of (${VERIFIERS.join('|')}), got ${JSON.stringify(c.verified_by)}`);
  }
  if (typeof c.confidence !== 'number' || !(c.confidence >= 0 && c.confidence <= 1)) {
    issues.push(`${where}: confidence must be a number in [0, 1]`);
  }

  // valid_until is mandatory for anything that outlives a branch. A global or project
  // claim with no expiry is precisely the shape of the nested-spawn fabrication:
  // true once, carried no expiry, rotted silently while the system obeyed it.
  if (c.scope === 'global' || c.scope === 'project') {
    if (typeof c.valid_until !== 'string' || !isRealDate(c.valid_until)) {
      issues.push(`${where}: valid_until (YYYY-MM-DD) is required for scope:${c.scope} — a durable claim with no expiry cannot go stale, so it never gets rechecked`);
    }
  } else if (c.valid_until !== undefined && c.valid_until !== null) {
    if (typeof c.valid_until !== 'string' || !isRealDate(c.valid_until)) {
      issues.push(`${where}: valid_until must be a real YYYY-MM-DD date`);
    }
  }

  if (c.supports !== undefined && c.supports !== null) {
    if (!Array.isArray(c.supports)) {
      issues.push(`${where}: supports must be a list of ids`);
    } else {
      for (const s of c.supports) {
        if (typeof s !== 'string' || !SUPPORTS_RE.test(s)) {
          issues.push(`${where}: supports entry ${JSON.stringify(s)} is not a valid id`);
        }
      }
    }
  }

  if (VERIFIERS.includes(c.verified_by)) validateEvidence(c, issues, where);
  if (c.disposition !== undefined && c.disposition !== null) validateDisposition(c, issues, where);

  // Issue #55. `first_waived` records the date a claim was first waived and is used to enforce
  // the 90-day cap in `scripts/ledger.mjs`. It is set ONCE on the first waiver and left alone
  // when `disposition.until` is extended — so the index sees it only at waiver-start, keeping
  // reason edits out of diffs.
  //
  // WHY ONLY scope:project. Global claims live in ~/.warroom/ledger/global.yml — machine state
  // that this repo cannot own or migrate in a PR. Requiring first_waived there would break lint
  // for every developer until they manually update their local global ledger, and a lint that
  // is red for reasons outside the PR is a lint nobody reads. The cap is enforced where the
  // index lives: project claims, which are the only ones compiled into .claude/ledger/index.json.
  if (c.disposition && c.disposition.action === 'waive' && c.scope === 'project') {
    if (typeof c.first_waived !== 'string' || !isRealDate(c.first_waived)) {
      issues.push(`${where}: first_waived (YYYY-MM-DD) is required when disposition.action is "waive" — set it to the date the claim was first waived and do not change it when extending "until"`);
    }
  } else if (c.first_waived !== undefined && c.first_waived !== null) {
    if (typeof c.first_waived !== 'string' || !isRealDate(c.first_waived)) {
      issues.push(`${where}: first_waived must be a real YYYY-MM-DD date`);
    }
  }

  const known = new Set(['id', 'assert', 'kind', 'scope', 'verified_by', 'evidence',
    'valid_until', 'confidence', 'supports', 'disposition', 'first_waived']);
  for (const k of Object.keys(c)) {
    if (!known.has(k)) issues.push(`${where}: unknown field "${k}" — the schema is closed`);
  }

  return issues;
}

/**
 * Parse and validate every claim in one artifact.
 * Returns { claims, issues }. A parse failure becomes an issue AND yields zero claims
 * for that block — but the issue is always reported, so a malformed block can never
 * read as "no claims here".
 */
function parseClaimsFromText(text, relPath) {
  const claims = [];
  const issues = [];
  let blocks;
  try {
    blocks = extractClaimBlocks(text);
  } catch (e) {
    return { claims: [], issues: [`${relPath}: ${e.message}`] };
  }

  for (const b of blocks) {
    let doc;
    try {
      doc = parseYamlSubset(b.yaml);
    } catch (e) {
      issues.push(`${relPath}:${b.startLine} (${b.form}): ${e.message}`);
      continue;
    }
    if (doc === null) {
      issues.push(`${relPath}:${b.startLine} (${b.form}): claim block is empty`);
      continue;
    }
    if (!isPlainObject(doc) || !Object.prototype.hasOwnProperty.call(doc, 'claims')) {
      issues.push(`${relPath}:${b.startLine} (${b.form}): block must contain a top-level "claims:" list`);
      continue;
    }
    const list = doc.claims;
    if (!Array.isArray(list)) {
      issues.push(`${relPath}:${b.startLine} (${b.form}): "claims:" must be a list`);
      continue;
    }
    if (Object.keys(doc).length !== 1) {
      issues.push(`${relPath}:${b.startLine} (${b.form}): block may contain only "claims:"`);
    }
    list.forEach((c, i) => {
      const where = `${relPath}:${b.startLine} claims[${i}]`;
      const problems = validateClaim(c, where);
      issues.push(...problems);
      if (problems.length === 0) {
        claims.push({ ...c, source_file: relPath, source_line: b.startLine, form: b.form });
      }
    });
  }

  return { claims, issues };
}

module.exports = {
  ClaimError,
  KINDS,
  SCOPES,
  VERIFIERS,
  RISKS,
  VERDICTS,
  DISPOSITIONS,
  parseYamlSubset,
  extractClaimBlocks,
  validateClaim,
  parseClaimsFromText,
  isRealDate,
  isDeprecated,
  independenceIssue,
};
