'use strict';
// POSTURE: BLOCKS, and it is the ONLY thing blocking here. Every refusal below is a
// write that does not happen. Nothing downstream re-checks these — `ledger lint` runs
// after the bytes are already in a file, which is one merge too late for a claim whose
// whole purpose is to be believed.
//
// scripts/lib/claim-append.js — the narrow write path for `sourcer`.
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────────────
// `sourcer` is the only engine with network reach and it holds no write tool at all:
// `tools: [Read, Glob, Grep, WebSearch, WebFetch]`. So the claim ledger — the enforcement
// spine of this repo — has had no producer for its domain-general half, and `claim-source`
// runs in shadow with almost nothing to resolve. This file is the missing producer, and it
// is deliberately the smallest one that could work: ONE record shape, ONE target file,
// ONE verifier, appended, never edited.
//
// `sourcer`'s `tools:` line is UNCHANGED by this work. The capability arrives as an MCP
// grant (`mcpServers: [claim-append]`), which is the mechanism this repo already measured
// as binding and narrowing across an Agent dispatch — `c-mcp-grant-binds-through-agent-
// dispatch`. If a future edit adds `Write` to that agent to "simplify" this, the point of
// the whole file is gone.
//
// ── THE ADVERSARY, WRITTEN DOWN BEFORE THE CODE ─────────────────────────────────────
// This repo's defining failure is an assertion accepted where evidence was required, and
// a write path for the one engine that talks to the internet is the most attractive place
// in the tree for that defect to land. So: what can a hostile `sourcer` put in the ledger
// through here, and what stops it?
//
//  1. A QUOTE THAT IS NOT AT THE URL — the pure fabrication.
//     STOPPED, and stopped by the strongest available means: this path does not implement
//     a check "like" the resolver's, it CALLS `resolvers.run('claim-source', …)`. The
//     predicate that admits the claim today is byte-identically the predicate that will
//     re-judge it on every future `ledger verify`. Two implementations of one predicate
//     agree until the day they matter; there is only one here.
//
//  2. A CLAIM THAT CANNOT BE RESOLVED AT ALL — offline, timeout, no fetch impl.
//     STOPPED, FAILING CLOSED. `unresolved` is not `pass` (rule 10, pinned by
//     scripts/ledger.test.mjs) and this path admits ONLY `pass`. An append attempted with
//     no egress is REFUSED, not deferred and not queued. That is the whole difference
//     between a gate and a formality.
//
//  3. AN EXPIRY THAT DEFEATS EXPIRY — absent, already past, or fifty years out.
//     STOPPED. `claim-freshness` is run for real (absent/past), and MAX_VALID_DAYS caps
//     the far end, which no existing check covers because the schema only asks that the
//     date be real. Rule 9 says a durable claim carries `valid_until` or it is not a
//     claim; a `valid_until` of 2099 satisfies the letter of that and nothing else.
//
//  4. ARBITRARY CODE EXECUTION VIA `verified_by: command`.
//     STOPPED BY CONSTRUCTION. Only `source` is accepted. A `command` claim would mean
//     the network-capable engine choosing a string that `claim-command` later executes on
//     a runner, which is a remote-code-execution primitive wearing a schema field. A
//     `judge` claim with an empty panel resolves `unresolved` forever and is the shape of
//     three claims this repo is already carrying; it is refused for reason 2.
//
//  5. SCOPE ESCALATION to `global` — machine state at ~/.warroom/ledger/global.yml,
//     reaching every project on the machine, invisible to this repo's diff and to CI.
//     STOPPED. `project` only: the one scope compiled into the committed index, so the
//     one scope a reviewer sees in the diff and `ledger build --check` re-derives.
//     `task` is refused too — it dies with the branch, so an append path emitting it
//     would produce output that nothing durably checks.
//
//  6. YAML INJECTION — an `assert` carrying a newline and a forged second claim, or a
//     `#` that turns the rest of a line into a comment, or a quote that closes early.
//     STOPPED BY `checkText`, which refuses control characters outright rather than
//     escaping them — so the emitter's escape surface is two characters, not nine.
//     The round trip below is a SECOND line, and this is stated narrowly because the
//     first version of this note was not: it said "STOPPED TWICE … proved on every single
//     call", and a reviewer then deleted both `roundTrip` calls and watched the suite stay
//     green. That is the correct reading — with `checkText` refusing control characters
//     and `validateClaim` closing every unquoted field (`ID_RE`, `KINDS`, `SUPPORTS_RE`,
//     numeric `confidence`), no submission reachable through `appendClaim` can currently
//     defeat the emitter, so the round trip catches nothing TODAY. It is here for the edit
//     that relaxes one of those validators, and `claim-append.test.mjs` exercises the
//     predicate directly so the second line is tested rather than assumed.
//
//  7. ID COLLISION — appending `c-mcp-grant-binds-through-agent-dispatch` with a different
//     assertion, shadowing a real claim rather than adding one.
//     STOPPED. The id must be absent from every project claim in the tree.
//
//  8. LAUNDERING A CITATION THROUGH `supports:` — pointing at a deprecated claim.
//     STOPPED HERE, AND ONLY HERE. `ledger lint` still accepts it: `checkCitations`
//     decides by set membership, `projectIds.has(id)`, and never opens the record. That
//     is NOT fixed by this work — the fix was implemented, run, and backed out, because
//     three of its four live hits are correct prose naming a retired id in order to say
//     it was retired. The reasoning is in `checkCitations`'s own preamble. `isDeprecated()`
//     in claims.js therefore has exactly ONE caller today, which is this file.
//     Refusing here is still right and is not the same question: a claim being minted
//     right now cannot be superseding anything and has no history to record.
//
//  9. A CLAIM ARRIVING PRE-WAIVED — `disposition: {action: waive, …}` on a brand-new
//     record, i.e. a claim switched off at birth.
//     STOPPED. `disposition` and `first_waived` are refused on append. A disposition is a
//     record that somebody DECIDED something about a claim that already existed.
//
// 10. SSRF — `http://169.254.169.254/…`, or a hostname that resolves there.
//     STOPPED, by resolving the host and classifying every address it yields, before any
//     socket is opened, on the original URL and on every redirect hop.
//     THIS IS NOT A SECOND COPY OF THE GUARD IN pre-tool-use.sh, and the difference is
//     load-bearing. That guard answers "what will CHROMIUM do with this string" — its
//     subject matter is Chromium's URL quirks (backslash-as-path-delimiter, NFKC
//     fullwidth digits, multi-`@` userinfo) and it classifies only LITERAL addresses,
//     allowing every hostname. This one answers "where will NODE'S fetch actually
//     connect", so it does not parse the string at all — `new URL()`, the very parser
//     `fetch` uses, and then DNS. Sharing an implementation between those two would make
//     one of them wrong. The repo's own conclusion from the Bash-vs-Write divergence
//     applies: when two guards disagree about a path, decide which is right FOR THAT PATH.
//
// ── WHAT IS *NOT* STOPPED, STATED PLAINLY ───────────────────────────────────────────
// A. A URL THE AGENT CONTROLS. `sourcer` can publish text and then cite it. The ledger's
//    model of a source is "a URL that contains this string"; it has no model of authority
//    and this path cannot invent one. A host denylist (gist, pastebin, …) would be
//    enumeration, which is exactly what the SSRF guard in pre-tool-use.sh was rewritten to
//    STOP relying on after an independent reviewer walked past five spellings of one
//    address. So the mitigation here is not mechanical: the record lands in a TRACKED file,
//    inside the PR diff, under the QA gate, with its host and its fetched-body digest in
//    the run log. **Source authority is a review question. This path does not decide it and
//    does not pretend to.**
// B. CONFIDENCE. `confidence: 1` on a shaky finding is not mechanically detectable. It is
//    in the diff.
// C. VOLUME. Nothing here caps appends per branch. The diff does.
// D. DNS REBINDING — a TOCTOU, and it is REAL, not theoretical. `assertPublicUrl` resolves
//    the host with `dns.lookup`, and then `fetch` resolves it AGAIN, independently. An
//    authoritative server that answers public once and private the second time is not
//    caught by anything here. Closing it means pinning the resolved address into the
//    connection — a custom `dispatcher`/`lookup` handed to `fetch` — which is a real
//    change, not a line. It is recorded rather than half-done, and it is a strictly
//    smaller hole than F1 was: this one needs an attacker to run authoritative DNS, where
//    F1 needed a URL string.
// E. UNICODE DIRECTION AND ZERO-WIDTH. `checkText` refuses < 0x20 and 0x7f, so U+202E
//    (right-to-left override) and U+200D (zero-width joiner) pass. Rendered text can
//    therefore differ from stored text inside the enforcement spine. Low severity — the
//    resolver compares NORMALISED bytes, so a quote cannot be smuggled past `claim-source`
//    this way; what it can do is mislead a human reading the diff.
//
// ── ORDER OF CHECKS IS PART OF THE DESIGN ───────────────────────────────────────────
// Everything free and local runs BEFORE the network: shape, narrowing, collisions,
// round-trip. The fetch is last. A malformed submission must not cause an outbound
// request, or the refusal path itself becomes the SSRF primitive.

const fs = require('node:fs');
const path = require('node:path');
const dns = require('node:dns').promises;
const net = require('node:net');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');

const { parseClaimsFromText, validateClaim, isRealDate, isDeprecated } = require('./claims.js');
const resolvers = require('./resolvers.js');
const { logEvent } = require('./events.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// THE TARGET IS FIXED AND IS NOT A PARAMETER. A caller-chosen path is a path-traversal
// bug with extra steps, and this caller is the least trusted engine in the roster.
const TARGET_REL = 'docs/03-system-design/SOURCED-CLAIMS.md';
const LOCK_REL = 'docs/03-system-design/.SOURCED-CLAIMS.lock';

const MAX_VALID_DAYS = 365;   // see adversary #3
const MAX_ASSERT = 500;
const MAX_QUOTE = 500;
const MAX_URL = 2000;
const MAX_REDIRECTS = 5;
const DAY_MS = 86400000;

// The submitted record's shape. CLOSED, and narrower than the ledger's own schema on
// purpose: every field the ledger allows but this path does not is a field listed in the
// adversary table above.
const ACCEPTED_KEYS = new Set(['id', 'assert', 'kind', 'scope', 'verified_by', 'evidence', 'valid_until', 'confidence', 'supports']);
const ACCEPTED_EVIDENCE_KEYS = new Set(['url', 'quote', 'accessed']);

class Refusal extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = 'Refusal';
    this.code = code;          // a NAMED refusal — see the adversary table
    this.detail = detail || null;
  }
}
const refuse = (code, message, detail) => { throw new Refusal(code, message, detail); };

// ── Field hygiene ───────────────────────────────────────────────────────────────────
// Control characters are REFUSED, not escaped. Escaping them would work — the parser
// understands \n and \t — but it would mean the emitter has to be right about nine escape
// sequences instead of two, and an `assert` containing a raw newline is a smell whatever
// the emitter does with it. Refusing is smaller and easier to defend.
function checkText(value, field, max) {
  if (typeof value !== 'string') refuse('FIELD_NOT_STRING', `${field} must be a string`);
  if (value.trim() === '') refuse('FIELD_EMPTY', `${field} must not be empty`);
  if (value.length > max) refuse('FIELD_TOO_LONG', `${field} is ${value.length} characters, over the ${max} limit`);
  const bad = [...value].findIndex((ch) => {
    const c = ch.codePointAt(0);
    return c < 0x20 || c === 0x7f;
  });
  if (bad >= 0) {
    refuse('FIELD_CONTROL_CHARACTER',
      `${field} contains a control character at index ${bad} (U+${value.codePointAt(bad).toString(16).padStart(4, '0').toUpperCase()}) — ` +
      'newlines and control characters are refused rather than escaped, so a value cannot break out of the block it is written into');
  }
  if (/[\uD800-\uDFFF]/.test(value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ''))) {
    refuse('FIELD_LONE_SURROGATE', `${field} contains an unpaired surrogate`);
  }
  return value;
}

// ── The emitter ─────────────────────────────────────────────────────────────────────
// Double-quoted scalars only, and after checkText the escape surface is exactly two
// characters. The round-trip check below is what actually proves this right; this function
// is the part that is allowed to be simple BECAUSE something re-reads it.
function dq(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function emitClaimBlock(rec) {
  const L = [];
  L.push('```claims');
  L.push('claims:');
  L.push(`  - id: ${rec.id}`);
  L.push(`    assert: ${dq(rec.assert)}`);
  L.push(`    kind: ${rec.kind}`);
  L.push(`    scope: ${rec.scope}`);
  L.push('    verified_by: source');
  L.push('    evidence:');
  L.push(`      url: ${dq(rec.evidence.url)}`);
  L.push(`      quote: ${dq(rec.evidence.quote)}`);
  L.push(`      accessed: ${dq(rec.evidence.accessed)}`);
  L.push(`    valid_until: ${dq(rec.valid_until)}`);
  L.push(`    confidence: ${rec.confidence}`);
  if (rec.supports && rec.supports.length) {
    L.push(`    supports: [${rec.supports.join(', ')}]`);
  }
  L.push('```');
  return L.join('\n');
}

function emitSection(rec, meta) {
  return [
    '',
    `## ${rec.id}`,
    '',
    `> ${rec.assert}`,
    '',
    `Source: <${rec.evidence.url}> · accessed ${rec.evidence.accessed} · appended ${meta.appended} by \`${meta.by}\`.`,
    `Verified at append time by \`claim-source\` and \`claim-freshness\`; body digest \`sha256:${meta.digest}\`.`,
    '',
    emitClaimBlock(rec),
    '',
  ].join('\n');
}

// ── SSRF: classify where fetch will actually connect ────────────────────────────────
// See adversary #10 for why this is not the guard in pre-tool-use.sh.
// ── DECIDE ON THE VALUE, NEVER ON THE SPELLING ──────────────────────────────────────
//
// THIS FUNCTION WAS BYPASSABLE AND THE BYPASS WAS REACHED WITH NOTHING BUT A URL STRING.
// It looked for a DOTTED IPv4 tail — `/(\d{1,3}\.){3}\d{1,3}$/` — to spot an IPv4 address
// embedded in an IPv6 one. But its caller takes the host from `new URL(u).hostname`, and
// the WHATWG serialiser has already compressed the dotted form to hex by then. Measured
// here, no network needed:
//
//   http://[::ffff:169.254.169.254]/  → hostname `::ffff:a9fe:a9fe`   → PASSED as public
//   http://[::ffff:127.0.0.1]/        → hostname `::ffff:7f00:1`      → PASSED as public
//   http://[::127.0.0.1]/             → hostname `::7f00:1`           → PASSED as public
//   http://[64:ff9b::127.0.0.1]/      → hostname `64:ff9b::7f00:1`    → PASSED as public
//   http://[2002:7f00:1::]/           → hostname `2002:7f00:1::`      → PASSED as public
//   http://127.0.0.1/                 → hostname `127.0.0.1`          → refused (control)
//
// A reviewer took the first of those end to end against a real server bound to loopback:
// the append SUCCEEDED and the claim landed in the tracked file. Since `evidence.quote` is
// a substring test against the fetched body and the caller can tell `APPENDED` from
// `REFUSED[RESOLVER_FAIL]`, that was a content oracle over anything the runner can reach
// on loopback, link-local or RFC1918 — including the metadata endpoint that is adversary
// #10 in this file's own header.
//
// WHAT IS ACTUALLY INSTRUCTIVE ABOUT IT. `.claude/hooks/pre-tool-use.sh` carries a comment
// saying its first browser guard "was bypassable five ways and an independent reviewer
// found all of them… It pattern-matched ONE SPELLING of each address." This reproduced
// that exact class one layer down — and the header's argument for `new URL()`, *"the very
// parser fetch uses"*, is precisely what strips the spelling the old check depended on.
// The right instinct produced the bypass.
//
// So: parse to the 128-bit (or 32-bit) VALUE, then classify ranges of that value. Every
// spelling of one address now collapses to one byte array before any decision is taken,
// which is what makes this a closed rule rather than a list of forms somebody remembered.
// The four IPv4-embedding prefixes below are the standardised ones (`::ffff:0:0/96`,
// `::/96`, `64:ff9b::/96`, `2002::/16`); each is a range of the value, not a text pattern,
// and each hands the embedded 32 bits to the IPv4 classifier rather than judging it twice.

function v4ToBytes(s) {
  const parts = String(s).split('.');
  if (parts.length !== 4) return null;
  const out = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    out.push(n);
  }
  return out;
}

function v6ToBytes(str) {
  let s = String(str).split('%')[0].toLowerCase();   // drop any zone id
  // A trailing dotted quad occupies the last two groups. Park a placeholder so the group
  // arithmetic below stays uniform, then splice the real octets in at the end.
  let tail = null;
  const lastColon = s.lastIndexOf(':');
  if (lastColon >= 0 && s.slice(lastColon + 1).includes('.')) {
    tail = v4ToBytes(s.slice(lastColon + 1));
    if (!tail) return null;
    s = `${s.slice(0, lastColon + 1)}0:0`;
  }
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const groupsOf = (t) => (t === '' ? [] : t.split(':').map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN)));
  const left = groupsOf(halves[0]);
  const right = halves.length === 2 ? groupsOf(halves[1]) : [];
  if ([...left, ...right].some((g) => Number.isNaN(g))) return null;
  let groups;
  if (halves.length === 2) {
    const fill = 8 - left.length - right.length;
    if (fill < 0) return null;
    groups = [...left, ...new Array(fill).fill(0), ...right];
  } else {
    if (left.length !== 8) return null;
    groups = left;
  }
  const bytes = [];
  for (const g of groups) bytes.push((g >> 8) & 0xff, g & 0xff);
  if (tail) for (let i = 0; i < 4; i++) bytes[12 + i] = tail[i];
  return bytes;
}

/** One textual address → its raw bytes (4 or 16), or null. `net.isIP` validates first. */
function ipToBytes(addr) {
  const v = net.isIP(String(addr).split('%')[0]);
  if (v === 4) return v4ToBytes(addr);
  if (v === 6) return v6ToBytes(addr);
  return null;
}

function v4IsPublic(b) {
  if (b[0] === 0) return false;                                     // 0.0.0.0/8
  if (b[0] === 10) return false;                                    // RFC1918
  if (b[0] === 127) return false;                                   // loopback
  if (b[0] === 169 && b[1] === 254) return false;                   // link-local, incl. IMDS
  if (b[0] === 172 && b[1] >= 16 && b[1] <= 31) return false;       // RFC1918
  if (b[0] === 192 && b[1] === 168) return false;                   // RFC1918
  if (b[0] === 192 && b[1] === 0 && (b[2] === 0 || b[2] === 2)) return false;
  if (b[0] === 100 && b[1] >= 64 && b[1] <= 127) return false;      // CGNAT
  if (b[0] === 198 && (b[1] === 18 || b[1] === 19)) return false;   // benchmarking
  if (b[0] === 198 && b[1] === 51 && b[2] === 100) return false;    // TEST-NET-2
  if (b[0] === 203 && b[1] === 0 && b[2] === 113) return false;     // TEST-NET-3
  if (b[0] >= 224) return false;                                    // multicast · reserved · broadcast
  return true;
}

function v6IsPublic(b) {
  const zeroThrough = (n) => b.slice(0, n).every((x) => x === 0);
  if (b.every((x) => x === 0)) return false;                        // ::
  if (zeroThrough(15) && b[15] === 1) return false;                 // ::1

  // The IPv4-embedding ranges. Decide on the embedded 32 bits, whatever the outer spelling.
  if (zeroThrough(10) && b[10] === 0xff && b[11] === 0xff) return v4IsPublic(b.slice(12));  // ::ffff:0:0/96
  if (zeroThrough(12)) return v4IsPublic(b.slice(12));                                      // ::/96
  if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b
      && b.slice(4, 12).every((x) => x === 0)) return v4IsPublic(b.slice(12));              // 64:ff9b::/96
  // RFC 8215's LOCAL-USE NAT64 prefix, 64:ff9b:1::/48. Refused outright rather than
  // decoded: within it the translation prefix may itself be /48…/96 (RFC 6052), so the
  // embedded IPv4 sits at a different offset depending on a length this function cannot
  // see. The whole /48 is reserved for local translation and nothing in it is ever a
  // public evidence source, so the fail-closed answer is also the correct one. Flagged by
  // a reviewer as an inconsistency inside a rule otherwise applied completely — it was.
  if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b
      && b[4] === 0x00 && b[5] === 0x01) return false;                                      // 64:ff9b:1::/48
  if (b[0] === 0x20 && b[1] === 0x02) return v4IsPublic(b.slice(2, 6));                     // 2002::/16 6to4

  if (b[0] === 0xfe && (b[1] & 0xc0) === 0x80) return false;        // fe80::/10 link-local
  if ((b[0] & 0xfe) === 0xfc) return false;                         // fc00::/7  unique-local
  if (b[0] === 0xff) return false;                                  // ff00::/8  multicast
  if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8) return false; // 2001:db8::/32
  return true;
}

function addressIsPublic(addr) {
  const b = ipToBytes(addr);
  if (!b) return false;              // not an address at all — the caller resolves names
  return b.length === 4 ? v4IsPublic(b) : v6IsPublic(b);
}

async function assertPublicUrl(rawUrl, opts) {
  let u;
  try { u = new URL(rawUrl); } catch { refuse('URL_UNPARSEABLE', `evidence.url is not a URL: ${rawUrl}`); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    refuse('URL_SCHEME', `evidence.url must be http or https, got "${u.protocol}"`);
  }
  const host = u.hostname.replace(/^\[|\]$/g, '');
  // A literal address needs no lookup and must not get one — a DNS query for "127.0.0.1"
  // is a request that leaks the attempt.
  if (net.isIP(host)) {
    if (!addressIsPublic(host)) {
      refuse('URL_NOT_PUBLIC', `evidence.url points at ${host}, which is not on the public internet`);
    }
    return u;
  }
  const lookup = opts.lookupImpl || ((h) => dns.lookup(h, { all: true, verbatim: true }));
  let addrs;
  try {
    addrs = await lookup(host);
  } catch (e) {
    refuse('URL_UNRESOLVABLE', `evidence.url host "${host}" does not resolve (${e.message}) — a source that cannot be reached is not a source`);
  }
  if (!Array.isArray(addrs) || addrs.length === 0) {
    refuse('URL_UNRESOLVABLE', `evidence.url host "${host}" resolved to no addresses`);
  }
  // EVERY address, not the first. A name with one public and one private A record is the
  // textbook DNS-rebinding shape, and "the first one was fine" is how it gets through.
  for (const a of addrs) {
    const ip = typeof a === 'string' ? a : a.address;
    if (!addressIsPublic(ip)) {
      refuse('URL_NOT_PUBLIC', `evidence.url host "${host}" resolves to ${ip}, which is not on the public internet`);
    }
  }
  return u;
}

// A fetch that re-guards every redirect hop. `redirect: 'follow'` would hand the guard's
// decision to whatever the first server says next.
// `holder` exists because `source()` in resolvers.js wraps its fetch in try/catch and
// converts ANY throw into `status: 'fail'`. That is correct for the resolver — a dead DNS
// entry is a finding about the source, not a crash — but it means a redirect-hop refusal
// raised in here comes back to the caller as a generic RESOLVER_FAIL with the real reason
// buried in a message. The holder carries the named refusal back out past that catch.
function guardedFetch(opts, holder) {
  const inner = opts.fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!inner) return null;
  return async function guarded(url, init) {
    let current = String(url);
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      try {
        await assertPublicUrl(current, opts);
      } catch (e) {
        if (e instanceof Refusal) holder.refusal = e;
        throw e;
      }
      const res = await inner(current, { ...init, redirect: 'manual' });
      const status = res.status;
      if (status >= 300 && status < 400) {
        const loc = typeof res.headers?.get === 'function' ? res.headers.get('location') : null;
        if (!loc) return res;
        current = new URL(loc, current).toString();
        continue;
      }
      return res;
    }
    refuse('URL_REDIRECT_LOOP', `evidence.url exceeded ${MAX_REDIRECTS} redirects`);
  };
}

// ── Existing claims, for the collision and supports checks ──────────────────────────
function trackedMarkdown(root) {
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return out.split('\0').filter((f) => f && /\.(md|markdown)$/i.test(f)).sort();
}

function existingClaims(root) {
  const byId = new Map();
  for (const rel of trackedMarkdown(root)) {
    let text;
    try { text = fs.readFileSync(path.join(root, rel), 'utf8'); } catch { continue; }
    if (!text.includes('claims:')) continue;
    const { claims } = parseClaimsFromText(text, rel);
    for (const c of claims) byId.set(c.id, c);
  }
  return byId;
}

/** Ids the committed index attributes to the target file that the file no longer holds. */
function claimsLostSinceIndex(root, present) {
  const indexAbs = path.join(root, '.claude', 'ledger', 'index.json');
  let idx;
  try {
    idx = JSON.parse(fs.readFileSync(indexAbs, 'utf8'));
  } catch {
    return [];   // no index, or an unreadable one — no baseline, so nothing to say
  }
  const have = new Set(present.map((c) => c.id));
  return (idx.claims || [])
    .filter((c) => c && c.source_file === TARGET_REL && !have.has(c.id))
    .map((c) => c.id);
}

function adrExists(root, id) {
  const n = id.slice(2);
  const dir = path.join(root, 'docs', '03-system-design', 'adr');
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).some((f) => f.startsWith(`${n}-`) && f.endsWith('.md'));
}

// ── The gate ────────────────────────────────────────────────────────────────────────

/**
 * Validate a submitted claim and append it. Returns a result object; throws Refusal.
 *
 * @param {object} submitted  the claim record, exactly as the caller supplies it
 * @param {object} opts       { root, now, by, fetchImpl, lookupImpl, dryRun }
 */
async function appendClaim(submitted, opts = {}) {
  const root = opts.root || REPO_ROOT;
  const now = opts.now === undefined ? Date.now() : opts.now;
  const by = opts.by || 'unknown';

  try {
    const rec = await gate(submitted, { ...opts, root, now, by });
    const rebuildIndex = opts.rebuildIndex || defaultRebuildIndex;
    const written = opts.dryRun ? null : commit(rec, root, now, by, rebuildIndex);
    logEvent({
      event: 'claim.append',
      at: new Date(now).toISOString(),
      id: rec.claim.id,
      by,
      url: rec.claim.evidence.url,
      host: new URL(rec.claim.evidence.url).host,
      body_sha256: rec.digest,
      dry_run: Boolean(opts.dryRun),
      file: TARGET_REL,
    }, root);
    const out = {
      status: 'APPENDED',
      id: rec.claim.id,
      file: TARGET_REL,
      body_sha256: rec.digest,
      resolvers: rec.verdicts,
      bytes_added: written === null ? 0 : written.bytes,
      dry_run: Boolean(opts.dryRun),
      index_rebuilt: written === null ? false : written.index.rebuilt,
    };
    // If the index could NOT be rebuilt, say so and name the command — the caller may
    // have no shell, but whoever reads its return does. Silence here is what turned one
    // append into a red CI step nobody was warned about.
    if (written !== null && !written.index.rebuilt) {
      out.remedy = `the compiled ledger index was NOT rebuilt (${written.index.why}). ` +
        'Run `node scripts/ledger.mjs build` and commit the result, or `ledger build --check` will fail.';
    }
    if (written === null) out.remedy = 'dry run — nothing was written and no index was rebuilt.';
    return out;
  } catch (e) {
    if (e instanceof Refusal) {
      logEvent({
        event: 'claim.append_refused',
        at: new Date(now).toISOString(),
        code: e.code,
        reason: e.message,
        by,
        id: (submitted && typeof submitted === 'object' ? submitted.id : null) || null,
      }, root);
    }
    throw e;
  }
}

async function gate(submitted, opts) {
  const { root, now } = opts;

  // ── 1. Shape, and the narrowing. Local, free, and first: a malformed submission must
  //       never reach the network, or the refusal path is itself an SSRF primitive.
  if (submitted === null || typeof submitted !== 'object' || Array.isArray(submitted)) {
    refuse('NOT_A_RECORD', 'the submitted claim must be a mapping');
  }
  for (const k of Object.keys(submitted)) {
    if (!ACCEPTED_KEYS.has(k)) {
      refuse('FIELD_NOT_ACCEPTED',
        `field "${k}" is not accepted by this path — it accepts ${[...ACCEPTED_KEYS].join(', ')} and nothing else` +
        (k === 'disposition' || k === 'first_waived'
          ? '. A disposition records that somebody decided something about a claim that already existed; a new claim cannot arrive pre-waived.'
          : ''));
    }
  }
  if (submitted.verified_by !== 'source') {
    refuse('VERIFIER_NOT_SOURCE',
      `verified_by must be "source", got ${JSON.stringify(submitted.verified_by)} — ` +
      'a "command" claim would let the network-capable engine choose a string that a runner later executes, and a "judge" claim with no panel resolves unresolved forever');
  }
  if (submitted.scope !== 'project') {
    refuse('SCOPE_NOT_PROJECT',
      `scope must be "project", got ${JSON.stringify(submitted.scope)} — ` +
      '"global" is machine state outside this repo\'s diff and CI; "task" dies with the branch, so nothing durably checks it');
  }
  if (!submitted.evidence || typeof submitted.evidence !== 'object' || Array.isArray(submitted.evidence)) {
    refuse('EVIDENCE_NOT_A_MAPPING', 'evidence must be a mapping with url, quote and accessed');
  }
  for (const k of Object.keys(submitted.evidence)) {
    if (!ACCEPTED_EVIDENCE_KEYS.has(k)) {
      refuse('EVIDENCE_FIELD_NOT_ACCEPTED', `evidence field "${k}" is not accepted — this path writes url, quote and accessed`);
    }
  }

  checkText(submitted.assert, 'assert', MAX_ASSERT);
  checkText(submitted.evidence.url, 'evidence.url', MAX_URL);
  checkText(submitted.evidence.quote, 'evidence.quote', MAX_QUOTE);
  checkText(submitted.evidence.accessed, 'evidence.accessed', 32);
  checkText(submitted.valid_until, 'valid_until', 32);
  checkText(submitted.id, 'id', 120);
  checkText(submitted.kind, 'kind', 40);

  // ── 2. The ledger's own schema. Not a paraphrase of it.
  const claim = {
    id: submitted.id,
    assert: submitted.assert,
    kind: submitted.kind,
    scope: 'project',
    verified_by: 'source',
    evidence: {
      url: submitted.evidence.url,
      quote: submitted.evidence.quote,
      accessed: submitted.evidence.accessed,
    },
    valid_until: submitted.valid_until,
    confidence: submitted.confidence,
  };
  if (submitted.supports !== undefined && submitted.supports !== null) {
    if (!Array.isArray(submitted.supports)) refuse('SUPPORTS_NOT_A_LIST', 'supports must be a list of ids');
    claim.supports = submitted.supports.map((s) => checkText(s, 'supports entry', 120));
  }
  const schemaIssues = validateClaim(claim, 'submitted');
  if (schemaIssues.length) {
    refuse('SCHEMA', `the record does not satisfy the ledger's own schema:\n  - ${schemaIssues.join('\n  - ')}`, schemaIssues);
  }

  // ── 3. Expiry, at the far end. `validateClaim` asks that the date be real and
  //       `claim-freshness` asks that it be in the future; neither caps it, so a
  //       `valid_until` of 2099 satisfies rule 9's letter and defeats its purpose.
  if (!isRealDate(submitted.valid_until)) refuse('EXPIRY_NOT_A_DATE', `valid_until "${submitted.valid_until}" is not a real YYYY-MM-DD date`);
  const until = Date.parse(`${submitted.valid_until}T00:00:00Z`);
  const horizon = now + MAX_VALID_DAYS * DAY_MS;
  if (until > horizon) {
    const days = Math.round((until - now) / DAY_MS);
    refuse('EXPIRY_TOO_FAR',
      `valid_until ${submitted.valid_until} is ${days} days away, over the ${MAX_VALID_DAYS}-day limit — ` +
      'an expiry far enough out is the same as no expiry, which is the shape rule 9 exists to refuse');
  }

  // ── 4. Collisions and citations, against the whole tree.
  const known = existingClaims(root);
  if (known.has(claim.id)) {
    const prior = known.get(claim.id);
    refuse('DUPLICATE_ID',
      `claim id "${claim.id}" already exists at ${prior.source_file} — this path appends, it never shadows or replaces`);
  }
  for (const s of (claim.supports || [])) {
    if (/^d-\d{3}$/.test(s)) {
      if (!adrExists(root, s)) refuse('SUPPORTS_DANGLING', `supports names "${s}", and no ADR with that number exists`);
      continue;
    }
    const target = known.get(s);
    if (!target) refuse('SUPPORTS_DANGLING', `supports names claim "${s}", which is not in the ledger`);
    if (isDeprecated(target)) {
      refuse('SUPPORTS_DEPRECATED',
        `supports names claim "${s}", which is deprecated (${(target.disposition || {}).reason || 'no reason recorded'}) — ` +
        'citing a retired claim is how a withdrawn finding keeps supporting live work');
    }
  }

  // ── 5. Round trip. Emit, re-parse with the parser that will read this file for real,
  //       and compare. Adversary #6: an emitter that is merely careful is an emitter
  //       nobody proved.
  const targetAbs = path.join(root, TARGET_REL);
  const before = fs.existsSync(targetAbs) ? fs.readFileSync(targetAbs, 'utf8') : seedFile();
  const beforeParsed = parseClaimsFromText(before, TARGET_REL);
  if (beforeParsed.issues.length) {
    refuse('TARGET_ALREADY_INVALID',
      `${TARGET_REL} does not parse cleanly before the append, so this path will not add to it:\n  - ${beforeParsed.issues.join('\n  - ')}`);
  }
  // A PARSE ERROR IS NOT THE ONLY WAY THIS FILE CAN BE DAMAGED, and the other way is
  // silent. Truncate it at a claim-block boundary and it parses perfectly with fewer
  // claims: measured, an append then SUCCEEDED, the index was rebuilt from the truncated
  // file, `build --check` stayed green and only `git diff` showed the loss. Nothing above
  // could see it, because `before` is the only baseline this function has and `before` is
  // the damaged file.
  //
  // The committed index is an independent record of what this file used to hold, so it
  // supplies the baseline. Only LOSS is reported — ids the index attributes to this file
  // and the file no longer has. Extra claims in the file are just an unbuilt index, which
  // is the normal state mid-append and not a defect.
  const lost = claimsLostSinceIndex(root, beforeParsed.claims);
  if (lost.length) {
    refuse('TARGET_TRUNCATED',
      `${TARGET_REL} parses cleanly but is MISSING ${lost.length} claim(s) the committed index records ` +
      `for it: ${lost.join(', ')}. That is content loss, not drift — appending would bake it in and ` +
      'rebuild the index over the top of it. Restore the file from git before adding anything.');
  }
  // A digest is 64 hex characters and is not known until after the fetch, so the
  // pre-flight round trip uses a placeholder OF THE SAME SHAPE and the whole check is run
  // AGAIN on the real bytes below. Validating one string and writing a different one is
  // how a check ends up guarding a file nobody wrote.
  const meta = { appended: new Date(now).toISOString().slice(0, 10), by: opts.by || 'unknown' };
  const roundTrip = (digest) => {
    const candidate = `${before.replace(/\s*$/, '')}\n${emitSection(claim, { ...meta, digest })}`;
    const after = parseClaimsFromText(candidate, TARGET_REL);
    if (after.issues.length) {
      refuse('ROUND_TRIP_ISSUES', `the emitted block does not re-parse cleanly:\n  - ${after.issues.join('\n  - ')}`);
    }
    if (after.claims.length !== beforeParsed.claims.length + 1) {
      refuse('ROUND_TRIP_COUNT',
        `re-parsing produced ${after.claims.length} claims where ${beforeParsed.claims.length + 1} were expected — ` +
        'a submitted value changed the structure of the file, which is exactly the injection this check exists to catch');
    }
    const drift = compareClaim(claim, after.claims[after.claims.length - 1]);
    if (drift) refuse('ROUND_TRIP_DRIFT', `the re-parsed claim differs from what was submitted: ${drift}`);
    for (let i = 0; i < beforeParsed.claims.length; i++) {
      const d = compareClaim(beforeParsed.claims[i], after.claims[i]);
      if (d || beforeParsed.claims[i].id !== after.claims[i].id) {
        refuse('ROUND_TRIP_CLOBBER', `appending changed an existing claim (${beforeParsed.claims[i].id}): ${d || 'position moved'}`);
      }
    }
  };
  roundTrip('0'.repeat(64));

  // ── 6. WHERE THE FETCH WILL LAND, before it is made. Run here, explicitly, and not
  //       only inside the fetch wrapper: `source()` turns any throw from its fetch into a
  //       generic `fail`, so a guard that only fires in there loses its name. The wrapper
  //       still runs it per redirect hop, which is the case this cannot cover.
  const holder = {};
  await assertPublicUrl(claim.evidence.url, opts);

  // ── 7. THE NETWORK, LAST. Not a check like the resolver's — the resolver.
  const doFetch = guardedFetch(opts, holder);
  if (!doFetch) {
    // UNREACHABLE ON EVERY SUPPORTED RUNTIME, and kept deliberately. `fetch` has been a
    // global since Node 18, so this fires only if a caller injects `fetchImpl: null`
    // explicitly. Deleting it survives the suite; it is a fail-closed default for a
    // runtime that does not exist yet, not a check anybody has seen fire. The path that
    // DOES fire when there is no egress is `RESOLVER_UNRESOLVED`, and that one is tested.
    refuse('NO_FETCH',
      'no fetch implementation is available in this runtime, so the source cannot be checked — ' +
      'a claim that could not be verified is refused, not queued (rule 10)');
  }
  let digest = null;
  const recordingFetch = async (url, init) => {
    const res = await doFetch(url, init);
    // Digest the body once, and hand both the resolver and the log a stable copy. The
    // digest is what lets a reviewer ask later whether the page still says this.
    const body = await res.text();
    digest = createHash('sha256').update(body).digest('hex');
    return { ok: res.ok, status: res.status, text: async () => body };
  };

  const names = resolvers.resolversFor(claim, []);
  const verdicts = [];
  for (const name of names) {
    // THE FIELD IS `status`, NOT `verdict`. Reading `r.verdict` here gave `undefined`,
    // which compares unequal to 'pass', so every append refused — and refused with a
    // TypeError rather than a refusal. It was caught by running the tests, not by reading
    // them: a gate that refuses everything looks exactly like a gate that works.
    const r = await resolvers.run(name, claim, { now, offline: opts.offline, fetchImpl: recordingFetch });
    verdicts.push({ resolver: name, status: r.status, reason: r.reason });
    if (r.status !== 'pass') {
      if (holder.refusal) throw holder.refusal;   // the named guard beats the generic fail
      refuse(`RESOLVER_${String(r.status).toUpperCase()}`,
        `${name} returned ${r.status}: ${r.reason} — this path appends only what the ledger's own resolvers pass RIGHT NOW`,
        verdicts);
    }
  }
  if (!names.includes('claim-source') || !names.includes('claim-freshness')) {
    // A TRIPWIRE ON ANOTHER FILE, and unreachable while that file is correct. Given
    // `verified_by: source` and `scope: project` — both forced above — `resolversFor`
    // always returns exactly these two, so deleting this survives the suite. It fires
    // only if a future edit to resolvers.js stops attaching one of them, and its whole
    // purpose is that this path should then STOP WORKING rather than quietly start
    // admitting records checked by less than it believes.
    refuse('RESOLVER_SET',
      `expected claim-source and claim-freshness to apply, got [${names.join(', ')}] — refusing rather than appending something less checked than intended`);
  }

  // The same check, on the bytes that will actually be written.
  roundTrip(digest);

  return { claim, digest, verdicts, before, section: emitSection(claim, { ...meta, digest }) };
}

function compareClaim(a, b) {
  const fields = ['id', 'assert', 'kind', 'scope', 'verified_by', 'valid_until', 'confidence'];
  for (const f of fields) {
    if (String(a[f]) !== String(b[f])) return `${f}: submitted ${JSON.stringify(a[f])}, re-parsed ${JSON.stringify(b[f])}`;
  }
  for (const f of ['url', 'quote', 'accessed']) {
    const av = (a.evidence || {})[f];
    const bv = (b.evidence || {})[f];
    if (String(av) !== String(bv)) return `evidence.${f}: submitted ${JSON.stringify(av)}, re-parsed ${JSON.stringify(bv)}`;
  }
  const as = (a.supports || []).join(',');
  const bs = (b.supports || []).join(',');
  if (as !== bs) return `supports: submitted [${as}], re-parsed [${bs}]`;
  return null;
}

function seedFile() {
  return [
    '# Sourced claims',
    '',
    'Append-only. Every claim below was written by `scripts/lib/claim-append.js`, which',
    'refused to write it until `claim-source` and `claim-freshness` — the ledger\'s own',
    'resolvers, not a copy of them — returned `pass` against it at that moment.',
    '',
    '**Do not hand-edit this file.** Nothing stops you, and nothing has to: an edit that',
    'breaks the parse makes the next append refuse with `TARGET_ALREADY_INVALID`, and an',
    'edit that changes a quote is caught by `ledger verify` on the next PR. Hand-editing',
    'just moves the failure to somebody who did not make it.',
    '',
  ].join('\n');
}

// ── The compiled index has to move with the artifact ────────────────────────────────
//
// `.claude/ledger/index.json` is COMPILED from the claims inside markdown files, and
// `ledger build --check` — step 36 of `npm run check`, and a step of ci.yml — fails when
// the two disagree. So one successful append used to red the build:
//
//   before an append   ledger build --check → exit 0
//   after ONE append   ledger build --check → "the index is generated. Run … build"
//   and `ledger lint`  → exit 0, so NOTHING warned until CI
//
// The agent this path exists for cannot repair that. `sourcer` has no `Bash` and no
// `Write`; its designed happy path would have produced a broken tree it was structurally
// unable to clear. A gate whose success state requires a privilege the caller does not
// have is not a gate, it is a trap.
//
// So the append rebuilds the index itself, inside the same lock, and ROLLS THE CLAIM BACK
// if the rebuild fails — a written claim beside a stale index is the exact state this is
// preventing, and leaving it behind on the error path would just move the trap.
//
// It shells out rather than importing: `ledger.mjs` is an ESM script whose whole contract
// is its CLI, and it derives its own repo root from its own file location — so invoking
// `<root>/scripts/ledger.mjs` targets `<root>` by construction, with no second notion of
// "which repo am I". The argv is fixed. Nothing the caller submits reaches it.
function defaultRebuildIndex(root) {
  const ledger = path.join(root, 'scripts', 'ledger.mjs');
  if (!fs.existsSync(ledger)) return { rebuilt: false, why: `${root} has no scripts/ledger.mjs — nothing to compile` };
  execFileSync(process.execPath, [ledger, 'build'], { cwd: root, stdio: 'pipe', encoding: 'utf8' });
  return { rebuilt: true, why: null };
}

// The write itself: read-modify-atomic-rename, behind an O_EXCL lock. Two sourcers
// appending at once is a lost update otherwise, and the loser's claim would vanish with
// no error at all.
// EVERY write in this file goes through here, including the rollback. The rollback used
// to be a bare `writeFileSync` while the forward path did tmp-and-rename — the one
// non-atomic write in the file, and the worst possible one to leave that way: a crash
// mid-rollback leaves a TRUNCATED target, and a truncation at a claim-block boundary
// parses cleanly with fewer claims. Measured: prior claims silently lost, the index then
// rebuilt FROM the truncated file, `build --check` green, CI sees nothing, and only
// `git diff` shows it. `TARGET_ALREADY_INVALID` does not catch it because there is no
// parse error to catch.
function atomicWrite(abs, data) {
  const tmp = `${abs}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, abs);
}

// Put both files back exactly as they were, INCLUDING not existing. Returns the list of
// things it could not restore — empty means the tree really is untouched, and the caller
// says one thing when it is empty and a different thing when it is not.
function rollback({ targetAbs, targetExisted, current, indexAbs, indexExisted, indexBefore }) {
  const failed = [];
  try {
    if (targetExisted) atomicWrite(targetAbs, current);
    else if (fs.existsSync(targetAbs)) fs.unlinkSync(targetAbs);
  } catch (e) {
    failed.push(`${TARGET_REL} (${e.message})`);
  }
  try {
    if (indexExisted) atomicWrite(indexAbs, indexBefore);
    else if (fs.existsSync(indexAbs)) fs.unlinkSync(indexAbs);
  } catch (e) {
    failed.push(`.claude/ledger/index.json (${e.message})`);
  }
  for (const p of [targetAbs, indexAbs]) {
    try { fs.unlinkSync(`${p}.${process.pid}.tmp`); } catch { /* never created, or already gone */ }
  }
  return failed;
}

function commit(rec, root, now, by, rebuildIndex) {
  const targetAbs = path.join(root, TARGET_REL);
  const lockAbs = path.join(root, LOCK_REL);
  const indexAbs = path.join(root, '.claude', 'ledger', 'index.json');
  fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
  let fd;
  try {
    fd = fs.openSync(lockAbs, 'wx');
  } catch (e) {
    if (e.code === 'EEXIST') {
      refuse('LOCKED', `${LOCK_REL} exists — another append is in flight, or a previous one died. Retry, or remove the lock if you are certain nothing is running.`);
    }
    throw e;
  }
  try {
    fs.writeSync(fd, String(process.pid));
    // Re-read INSIDE the lock. The content the round-trip check validated was read
    // before it, so validating one file and writing to another is the exact race this
    // lock exists to close.
    //
    // `targetExisted` is tracked, not inferred. `seedFile()` is a string that was never
    // on disk, so a rollback that writes `current` back into a repo which had NO
    // SOURCED-CLAIMS.md CREATES the file — measured: absent before, present after, while
    // the refusal said the tree was untouched.
    const targetExisted = fs.existsSync(targetAbs);
    const current = targetExisted ? fs.readFileSync(targetAbs, 'utf8') : seedFile();
    if (current !== rec.before) {
      refuse('TARGET_CHANGED', `${TARGET_REL} changed between validation and write — nothing was written. Retry.`);
    }

    // The index is captured BEFORE the rebuild, because the rebuild is not atomic from
    // out here: `ledger build` writes index.json and then returns, and anything that
    // interrupts it between those two — a signal, the OOM killer, Ctrl-C — leaves the
    // index rewritten and the call failed. Measured across five build outcomes; the two
    // that left the tree inconsistent were "writes then throws" and "writes then is
    // killed", and the second needs no code change to reach. Restoring only the markdown
    // made `build --check` fail in the OPPOSITE direction — "in the index, missing from
    // the artifacts" — which nobody would trace back to an append that reported success.
    const indexExisted = fs.existsSync(indexAbs);
    const indexBefore = indexExisted ? fs.readFileSync(indexAbs) : null;

    const next = `${current.replace(/\s*$/, '')}\n${rec.section}`;
    atomicWrite(targetAbs, next);

    let index;
    try {
      index = rebuildIndex(root);
    } catch (e) {
      // Roll BOTH files back. A written claim beside a stale index is precisely the state
      // the rebuild exists to prevent, so failing without undoing would leave the caller
      // holding the defect AND a success message.
      const detail = [e.stdout, e.stderr, e.message].filter(Boolean).join(' ').trim().slice(0, 400);
      const failed = rollback({ targetAbs, targetExisted, current, indexAbs, indexExisted, indexBefore });
      if (failed.length) {
        // The rollback itself failed. Say so — the alternative is a refusal that promises
        // a clean tree it did not deliver, which is the sentence this whole change exists
        // to make true rather than smaller.
        refuse('ROLLBACK_FAILED',
          `\`ledger build\` failed (${detail}) AND the tree could not be restored. ` +
          `THE TREE IS INCONSISTENT. Unrestored: ${failed.join('; ')}. ` +
          `Check \`git status\` and run \`node scripts/ledger.mjs build\`.`);
      }
      refuse('INDEX_REBUILD_FAILED',
        `the claim was written and then REMOVED again because \`ledger build\` failed: ${detail}. ` +
        `${TARGET_REL} and .claude/ledger/index.json were both restored to what they were before this call.`);
    }
    return { bytes: next.length - current.length, index };
  } finally {
    fs.closeSync(fd);
    try { fs.unlinkSync(lockAbs); } catch { /* already gone */ }
  }
}

module.exports = {
  appendClaim,
  Refusal,
  TARGET_REL,
  MAX_VALID_DAYS,
  addressIsPublic,
  ipToBytes,
  seedFile,
  // exported for the tests, which must be able to construct the input that defeats the fix
  _emitSection: emitSection,
  _checkText: checkText,
};
