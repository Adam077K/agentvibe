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
    out.push({ n, indent, content });
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

// ── Recursive descent over the scanned lines ────────────────────────────────
function parseNode(lines, i, indent) {
  if (i >= lines.length) throw new ClaimError('unexpected end of block');
  if (/^-(\s|$)/.test(lines[i].content)) return parseSeq(lines, i, indent);
  return parseMap(lines, i, indent);
}

function parseSeq(lines, i, indent) {
  const items = [];
  while (i < lines.length && lines[i].indent === indent && /^-(\s|$)/.test(lines[i].content)) {
    const { n, content } = lines[i];
    const rest = content.replace(/^-\s*/, '');
    const off = content.length - rest.length;

    if (rest === '') {
      // "-" alone: the item is a block on the following, more-indented lines.
      i++;
      if (i < lines.length && lines[i].indent > indent) {
        const r = parseNode(lines, i, lines[i].indent);
        items.push(r.value);
        i = r.next;
      } else {
        throw new ClaimError('sequence item "-" has no value', n);
      }
      continue;
    }

    if (splitTopLevelColon(rest) >= 0 && !rest.startsWith('{') && !rest.startsWith('[')) {
      // "- key: value" — a block mapping whose first key sits at column indent+off.
      const inner = [{ n, indent: indent + off, content: rest }];
      let j = i + 1;
      while (j < lines.length && lines[j].indent > indent) { inner.push(lines[j]); j++; }
      const r = parseNode(inner, 0, indent + off);
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

function parseMap(lines, i, indent) {
  const map = {};
  while (i < lines.length && lines[i].indent === indent) {
    const { n, content } = lines[i];
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
      const folded = rest[0] === '>';
      const collected = [];
      i++;
      while (i < lines.length && lines[i].indent > indent) { collected.push(lines[i].content); i++; }
      if (collected.length === 0) throw new ClaimError(`block scalar "${key}: ${rest}" has no content`, n);
      map[key] = folded ? collected.join(' ') : collected.join('\n');
      continue;
    }

    if (rest === '') {
      i++;
      if (i < lines.length && lines[i].indent > indent) {
        const r = parseNode(lines, i, lines[i].indent);
        map[key] = r.value;
        i = r.next;
      } else if (i < lines.length && lines[i].indent === indent && /^-(\s|$)/.test(lines[i].content)) {
        // A sequence at the SAME indent as its key — legal YAML, common in this repo.
        const r = parseSeq(lines, i, indent);
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
  const lines = scanLines(text);
  if (lines.length === 0) return null;
  const base = lines[0].indent;
  for (const l of lines) {
    if (l.indent < base) throw new ClaimError('block is not consistently indented', l.n);
  }
  const r = parseNode(lines, 0, base);
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
    if (ev.expect_stdout !== undefined) {
      if (typeof ev.expect_stdout !== 'string') {
        issues.push(`${where}: evidence.expect_stdout must be a string (regex)`);
      } else {
        try { new RegExp(ev.expect_stdout); }
        catch (e) { issues.push(`${where}: evidence.expect_stdout is not a valid regex (${e.message})`); }
      }
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
    // The independence rule. A "panel" of one model family is one opinion wearing
    // several hats; the lint refuses it rather than letting it read as agreement.
    if (ev.risk === 'high' && ev.judged_by.length > 0 && families.size < 2) {
      issues.push(
        `${where}: risk:high requires >=2 distinct model families, got ${families.size} ` +
        `(${[...families].join(', ') || 'none'}) — a single-family panel is not independent`
      );
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

  const known = new Set(['id', 'assert', 'kind', 'scope', 'verified_by', 'evidence',
    'valid_until', 'confidence', 'supports', 'disposition']);
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
};
