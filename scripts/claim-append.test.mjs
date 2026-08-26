// POSTURE: BLOCKS. Reached from `npm run test:ledger` — scripts/ledger.test.mjs imports
// this file, so `node --test` registers both. It is deliberately NOT a new npm step:
// package.json and scripts/lib/check-suite.js are owned elsewhere, and a test that has to
// wait for a step to be added is a test that does not run.
//
// scripts/claim-append.test.mjs — the gate in scripts/lib/claim-append.js.
//
// ── WHAT MAKES THESE TESTS NON-VACUOUS ──────────────────────────────────────────────
// Twenty-odd assertions here say "this is REFUSED". Every one of them would also pass if
// `appendClaim` threw unconditionally, or if the fixture repo were malformed, or if the
// injected fetch never fired. So the first test in the file is a CONTROL that must APPEND,
// and it asserts the claim is really in the file and really parses — and several refusal
// tests are written as a mutation OF that control: one field changed, everything else the
// same. If the control breaks, the whole file goes red rather than going quietly green.
//
// The house rule this file is built on: "a fixture built from the fix cannot fail —
// construct the input that defeats YOUR fix, and confirm the fixture ADMITS it." So the
// injection tests do not merely assert a refusal; INJECTION_ADMITTED below proves the
// payload really is an injection by feeding it to the same parser through a hand-written
// block, and watching that block produce a second claim.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { appendClaim, Refusal, TARGET_REL, MAX_VALID_DAYS, addressIsPublic, ipToBytes, seedFile, _emitSection } =
  require('./lib/claim-append.js');
const { parseClaimsFromText } = require('./lib/claims.js');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REAL_REPO = path.resolve(HERE, '..');

const NOW = Date.parse('2026-08-26T12:00:00Z');
const DAY = 86400000;
const day = (offset) => new Date(NOW + offset * DAY).toISOString().slice(0, 10);

// ── The fixture repo ────────────────────────────────────────────────────────────────
// A real git repo, because `existingClaims()` reads `git ls-files`. Under $TMPDIR only:
// scripts/protected-write-tripwire.cjs fails the run if a test writes into the paths the
// armed sandbox protects, and that tripwire exists because two tests already did.
function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'claim-append-'));
  fs.mkdirSync(path.join(root, 'docs', '03-system-design', 'adr'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', '03-system-design', 'adr', '001-a-real-adr.md'), '# ADR 001\n');
  fs.writeFileSync(path.join(root, 'docs', '03-system-design', TARGET_REL.split('/').pop()), seedFile());
  fs.writeFileSync(path.join(root, '.warroom.yml'), 'session: claim-append-test\n');
  const git = (...a) => execFileSync('git', a, { cwd: root, stdio: 'pipe' });
  git('init', '-q');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 'test');
  git('add', '-A');
  git('commit', '-qm', 'fixture');
  return root;
}

// Every append in this file logs an event. Send it to the fixture, never to the real run
// log — a test that pollutes ~/.agentvibe/events.jsonl makes `ledger verify`'s own output
// untrustworthy for whoever reads it next.
function withEvents(root, fn) {
  const prev = process.env.WARROOM_EVENTS;
  process.env.WARROOM_EVENTS = path.join(root, 'events.jsonl');
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (prev === undefined) delete process.env.WARROOM_EVENTS;
      else process.env.WARROOM_EVENTS = prev;
    });
}

const PAGE = 'Anthropic ships Claude. The quote we are checking for is right here in the body.';
const QUOTE = 'the quote we are checking for is right here';

function fakeFetch(body = PAGE, init = {}) {
  const calls = [];
  const impl = async (url) => {
    calls.push(String(url));
    if (init.redirectTo && calls.length === 1) {
      return { ok: false, status: 302, headers: { get: (h) => (h.toLowerCase() === 'location' ? init.redirectTo : null) }, text: async () => '' };
    }
    if (init.status && init.status !== 200) {
      return { ok: false, status: init.status, headers: { get: () => null }, text: async () => body };
    }
    return { ok: true, status: 200, headers: { get: () => null }, text: async () => body };
  };
  impl.calls = calls;
  return impl;
}

const publicLookup = async () => [{ address: '93.184.216.34', family: 4 }];

function goodClaim(over = {}) {
  return {
    id: 'c-fixture-sourced-fact',
    assert: 'The cited page contains the quote this claim records',
    kind: 'external-fact',
    scope: 'project',
    verified_by: 'source',
    evidence: { url: 'https://example.com/a', quote: QUOTE, accessed: day(0) },
    valid_until: day(30),
    confidence: 0.9,
    ...over,
  };
}

async function run(root, claim, over = {}) {
  return withEvents(root, () => appendClaim(claim, {
    root,
    now: NOW,
    by: 'test',
    fetchImpl: fakeFetch(),
    lookupImpl: publicLookup,
    ...over,
  }));
}

async function refusal(root, claim, over = {}) {
  try {
    await run(root, claim, over);
  } catch (e) {
    if (!(e instanceof Refusal)) throw e;
    return e;
  }
  throw new assert.AssertionError({ message: 'expected a Refusal, and the append SUCCEEDED' });
}

const targetOf = (root) => path.join(root, TARGET_REL);
const readTarget = (root) => fs.readFileSync(targetOf(root), 'utf8');

// ════════════════════════════════════════════════════════════════════════════════════
// THE CONTROL. If this stops appending, every refusal below is vacuous.
// ════════════════════════════════════════════════════════════════════════════════════

test('claim-append CONTROL — a well-formed sourced claim IS appended and IS parseable', async () => {
  const root = makeRepo();
  const before = readTarget(root);
  const out = await run(root, goodClaim());

  assert.equal(out.status, 'APPENDED');
  assert.equal(out.id, 'c-fixture-sourced-fact');
  assert.equal(out.file, TARGET_REL);
  assert.match(out.body_sha256, /^[0-9a-f]{64}$/);

  const after = readTarget(root);
  assert.notEqual(after, before, 'the file must actually have changed');
  assert.ok(after.startsWith(before.replace(/\s*$/, '')), 'the append must not disturb what was already there');

  const parsed = parseClaimsFromText(after, TARGET_REL);
  assert.deepEqual(parsed.issues, [], 'the written file must parse with zero issues');
  assert.equal(parsed.claims.length, 1);
  assert.equal(parsed.claims[0].id, 'c-fixture-sourced-fact');
  assert.equal(parsed.claims[0].evidence.quote, QUOTE);
  assert.equal(parsed.claims[0].verified_by, 'source');
  assert.equal(parsed.claims[0].confidence, 0.9);

  // Both resolvers ran, and both passed. Not "a check like them" — them.
  const names = out.resolvers.map((r) => r.resolver).sort();
  assert.deepEqual(names, ['claim-freshness', 'claim-source']);
  assert.ok(out.resolvers.every((r) => r.status === 'pass'), JSON.stringify(out.resolvers));

  const ev = fs.readFileSync(path.join(root, 'events.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(ev.at(-1).event, 'claim.append');
  assert.equal(ev.at(-1).host, 'example.com');
});

test('claim-append CONTROL — two appends accumulate, and the first is untouched', async () => {
  const root = makeRepo();
  await run(root, goodClaim());
  await run(root, goodClaim({ id: 'c-fixture-second', assert: 'A second sourced fact' }));
  const parsed = parseClaimsFromText(readTarget(root), TARGET_REL);
  assert.deepEqual(parsed.issues, []);
  assert.deepEqual(parsed.claims.map((c) => c.id), ['c-fixture-sourced-fact', 'c-fixture-second']);
});

test('claim-append CONTROL — --dry-run verifies everything and writes nothing', async () => {
  const root = makeRepo();
  const before = readTarget(root);
  const out = await run(root, goodClaim(), { dryRun: true });
  assert.equal(out.status, 'APPENDED');
  assert.equal(out.dry_run, true);
  assert.equal(readTarget(root), before);
});

// ════════════════════════════════════════════════════════════════════════════════════
// THE EVIDENCE MUST BE REAL AT WRITE TIME — adversary #1 and #2
// ════════════════════════════════════════════════════════════════════════════════════

test('claim-append — a quote that is NOT at the URL is refused, and nothing is written', async () => {
  const root = makeRepo();
  const before = readTarget(root);
  const e = await refusal(root, goodClaim({ evidence: { url: 'https://example.com/a', quote: 'a sentence that is not on that page', accessed: day(0) } }));
  assert.equal(e.code, 'RESOLVER_FAIL');
  assert.match(e.message, /recorded quote is not present/);
  assert.equal(readTarget(root), before, 'a refusal must leave the file byte-identical');
});

test('claim-append — an HTTP error at the cited URL is refused', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim(), { fetchImpl: fakeFetch(PAGE, { status: 404 }) });
  assert.equal(e.code, 'RESOLVER_FAIL');
  assert.match(e.message, /HTTP 404/);
});

test('claim-append — FAILS CLOSED with no fetch available: unresolved is not pass (rule 10)', async () => {
  const root = makeRepo();
  const before = readTarget(root);
  const e = await refusal(root, goodClaim(), { fetchImpl: null, offline: true });
  // The record is refused, not queued, not written-and-flagged.
  assert.ok(['NO_FETCH', 'RESOLVER_UNRESOLVED'].includes(e.code), `unexpected code ${e.code}`);
  assert.equal(readTarget(root), before);
});

test('claim-append — offline mode is refused even when a fetch impl exists', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim(), { offline: true });
  assert.equal(e.code, 'RESOLVER_UNRESOLVED');
  assert.match(e.message, /offline/);
});

test('claim-append — a fetch that throws is refused, not swallowed', async () => {
  const root = makeRepo();
  const boom = async () => { throw Object.assign(new Error('fetch failed'), { cause: new Error('ENOTFOUND') }); };
  const e = await refusal(root, goodClaim(), { fetchImpl: boom });
  assert.equal(e.code, 'RESOLVER_FAIL');
});

// ════════════════════════════════════════════════════════════════════════════════════
// THE NARROWING — adversary #4 and #5
// ════════════════════════════════════════════════════════════════════════════════════

for (const [verifier, evidence] of [
  ['command', { cmd: 'rm -rf /' }],
  ['judge', { lenses: ['x'], risk: 'low', judged_by: [] }],
]) {
  test(`claim-append — verified_by:${verifier} is refused (no command to execute, no permanent unresolved)`, async () => {
    const root = makeRepo();
    const e = await refusal(root, goodClaim({ verified_by: verifier, evidence }));
    assert.equal(e.code, 'VERIFIER_NOT_SOURCE');
  });
}

for (const scope of ['global', 'task']) {
  test(`claim-append — scope:${scope} is refused`, async () => {
    const root = makeRepo();
    const e = await refusal(root, goodClaim({ scope }));
    assert.equal(e.code, 'SCOPE_NOT_PROJECT');
  });
}

test('claim-append — a global-scoped claim never touches the global ledger file', async () => {
  const root = makeRepo();
  const globalLedger = path.join(root, 'global.yml');
  await refusal(root, goodClaim({ scope: 'global' }));
  assert.equal(fs.existsSync(globalLedger), false);
});

// ════════════════════════════════════════════════════════════════════════════════════
// EXPIRY — rule 9, adversary #3
// ════════════════════════════════════════════════════════════════════════════════════

test('claim-append — no valid_until is refused by the ledger\'s own schema', async () => {
  const root = makeRepo();
  const c = goodClaim();
  delete c.valid_until;
  const e = await refusal(root, c);
  assert.ok(['SCHEMA', 'FIELD_NOT_STRING'].includes(e.code), `unexpected ${e.code}`);
});

test('claim-append — an ALREADY-EXPIRED valid_until is refused by claim-freshness', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ valid_until: day(-1) }));
  assert.equal(e.code, 'RESOLVER_FAIL');
  assert.match(e.message, /expired/);
});

test('claim-append — an expiry beyond the horizon is refused: far enough out IS no expiry', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ valid_until: day(MAX_VALID_DAYS + 1) }));
  assert.equal(e.code, 'EXPIRY_TOO_FAR');
});

test('claim-append — the boundary is inclusive, so the horizon itself is accepted', async () => {
  const root = makeRepo();
  const out = await run(root, goodClaim({ valid_until: day(MAX_VALID_DAYS) }));
  assert.equal(out.status, 'APPENDED');
});

test('claim-append — a future accessed date is refused', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ evidence: { url: 'https://example.com/a', quote: QUOTE, accessed: day(5) } }));
  assert.equal(e.code, 'RESOLVER_FAIL');
  assert.match(e.message, /future/);
});

// ════════════════════════════════════════════════════════════════════════════════════
// SHAPE — adversary #7 and #9
// ════════════════════════════════════════════════════════════════════════════════════

test('claim-append — a claim cannot arrive pre-waived', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ disposition: { action: 'waive', until: day(60), reason: 'later' } }));
  assert.equal(e.code, 'FIELD_NOT_ACCEPTED');
  assert.match(e.message, /cannot arrive pre-waived/);
});

test('claim-append — an unknown field is refused; the shape is closed', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ source_file: '../../etc/passwd' }));
  assert.equal(e.code, 'FIELD_NOT_ACCEPTED');
});

test('claim-append — an unknown evidence field is refused', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ evidence: { url: 'https://example.com/a', quote: QUOTE, accessed: day(0), cmd: 'id' } }));
  assert.equal(e.code, 'EVIDENCE_FIELD_NOT_ACCEPTED');
});

test('claim-append — a duplicate id is refused rather than shadowing the original', async () => {
  const root = makeRepo();
  await run(root, goodClaim());
  const e = await refusal(root, goodClaim({ assert: 'A different and contradictory assertion' }));
  assert.equal(e.code, 'DUPLICATE_ID');
  const parsed = parseClaimsFromText(readTarget(root), TARGET_REL);
  assert.equal(parsed.claims.length, 1, 'the original must survive intact');
  assert.equal(parsed.claims[0].assert, 'The cited page contains the quote this claim records');
});

test('claim-append — a bad id shape is refused by the ledger schema', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ id: 'Not-A-Claim-Id' }));
  assert.equal(e.code, 'SCHEMA');
});

// ════════════════════════════════════════════════════════════════════════════════════
// supports: — adversary #8, and the deprecated-citation gap
// ════════════════════════════════════════════════════════════════════════════════════

test('claim-append CONTROL — supports: a real ADR is accepted', async () => {
  const root = makeRepo();
  const out = await run(root, goodClaim({ supports: ['d-001'] }));
  assert.equal(out.status, 'APPENDED');
  const parsed = parseClaimsFromText(readTarget(root), TARGET_REL);
  assert.deepEqual(parsed.claims[0].supports, ['d-001']);
});

test('claim-append — supports: a nonexistent ADR is refused', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ supports: ['d-999'] }));
  assert.equal(e.code, 'SUPPORTS_DANGLING');
});

test('claim-append — supports: an unknown claim id is refused', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ supports: ['c-does-not-exist'] }));
  assert.equal(e.code, 'SUPPORTS_DANGLING');
});

test('claim-append — supports: a DEPRECATED claim is refused (lint accepts this; this path does not)', async () => {
  const root = makeRepo();
  fs.writeFileSync(path.join(root, 'docs', 'retired.md'), [
    '# Retired',
    '',
    '```claims',
    'claims:',
    '  - id: c-retired-finding',
    '    assert: "A finding that was withdrawn"',
    '    kind: behavior',
    '    scope: project',
    '    verified_by: command',
    '    evidence: {cmd: "true", expect_exit: 0}',
    `    valid_until: ${day(90)}`,
    '    confidence: 1',
    '    disposition: {action: deprecate, reason: "superseded by a later measurement"}',
    '```',
    '',
  ].join('\n'));
  const e = await refusal(root, goodClaim({ supports: ['c-retired-finding'] }));
  assert.equal(e.code, 'SUPPORTS_DEPRECATED');

  // CONTROL for this test: the same fixture, cited by a claim that is NOT deprecated,
  // must be accepted. Without it, SUPPORTS_DEPRECATED could be firing because the fixture
  // file is unparseable rather than because the claim is retired.
  fs.writeFileSync(path.join(root, 'docs', 'live.md'), [
    '```claims', 'claims:',
    '  - id: c-live-finding',
    '    assert: "A finding that stands"',
    '    kind: behavior', '    scope: project', '    verified_by: command',
    '    evidence: {cmd: "true", expect_exit: 0}',
    `    valid_until: ${day(90)}`, '    confidence: 1', '```', '',
  ].join('\n'));
  const out = await run(root, goodClaim({ supports: ['c-live-finding'] }));
  assert.equal(out.status, 'APPENDED');
});

// ════════════════════════════════════════════════════════════════════════════════════
// YAML INJECTION — adversary #6. The payloads are proved to BE payloads.
// ════════════════════════════════════════════════════════════════════════════════════

// Proof that the injection strings really do inject: written into a claim block by hand,
// with no escaping, this payload makes the repo's own parser produce a SECOND claim.
// Without this the refusal tests below would pass against a payload that was never
// dangerous — a fixture built from the fix, which cannot fail and proves nothing.
test('claim-append FIXTURE ADMITS THE ATTACK — the raw payload really does forge a claim', () => {
  const naive = [
    '```claims',
    'claims:',
    '  - id: c-benign',
    '    assert: "harmless"',
    '    kind: behavior',
    '    scope: project',
    '    verified_by: command',
    '    evidence: {cmd: "true", expect_exit: 0}',
    `    valid_until: ${day(90)}`,
    '    confidence: 1',
    '  - id: c-forged',                       // ← exactly what the newline payload becomes
    '    assert: "injected"',
    '    kind: behavior',
    '    scope: project',
    '    verified_by: command',
    '    evidence: {cmd: "true", expect_exit: 0}',
    `    valid_until: ${day(90)}`,
    '    confidence: 1',
    '```',
  ].join('\n');
  const parsed = parseClaimsFromText(naive, 'fixture.md');
  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.claims.length, 2, 'the attack shape must be genuinely dangerous to this parser');
  assert.equal(parsed.claims[1].id, 'c-forged');
});

test('claim-append — a newline in assert is REFUSED, not escaped', async () => {
  const root = makeRepo();
  const payload = 'harmless"\n  - id: c-forged\n    assert: "injected';
  const e = await refusal(root, goodClaim({ assert: payload }));
  assert.equal(e.code, 'FIELD_CONTROL_CHARACTER');
  const parsed = parseClaimsFromText(readTarget(root), TARGET_REL);
  assert.equal(parsed.claims.length, 0);
});

test('claim-append — control characters are refused in every text field', async () => {
  const root = makeRepo();
  const cases = [
    ['assert / NUL', { assert: `a${String.fromCharCode(0)}b` }],
    ['assert / CR', { assert: `a${String.fromCharCode(13)}b` }],
    ['assert / DEL', { assert: `a${String.fromCharCode(127)}b` }],
    ['quote / TAB', { evidence: { url: 'https://example.com/a', quote: `a${String.fromCharCode(9)}b`, accessed: day(0) } }],
    ['url / NUL', { evidence: { url: `https://example.com/${String.fromCharCode(0)}x`, quote: QUOTE, accessed: day(0) } }],
  ];
  for (const [what, over] of cases) {
    const e = await refusal(root, goodClaim(over));
    assert.equal(e.code, 'FIELD_CONTROL_CHARACTER', `${what} should have been refused for a control character`);
  }
});

test('claim-append — quotes, backslashes and hashes survive the round trip EXACTLY', async () => {
  const root = makeRepo();
  const nasty = 'They said "42" \\ and # not a comment: {a: b} [c] — all literal';
  const out = await run(root, goodClaim({ assert: nasty }));
  assert.equal(out.status, 'APPENDED');
  const parsed = parseClaimsFromText(readTarget(root), TARGET_REL);
  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.claims.length, 1, 'the payload must not have produced a second claim');
  assert.equal(parsed.claims[0].assert, nasty, 'the value must come back byte-identical');
});

test('claim-append — an over-long field is refused', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim({ assert: 'x'.repeat(1000) }));
  assert.equal(e.code, 'FIELD_TOO_LONG');
});

test('claim-append — a target file that no longer parses stops the append', async () => {
  const root = makeRepo();
  fs.appendFileSync(targetOf(root), '\n```claims\nclaims:\n  - id: broken\n```\n');
  const e = await refusal(root, goodClaim());
  assert.equal(e.code, 'TARGET_ALREADY_INVALID');
});

// ════════════════════════════════════════════════════════════════════════════════════
// SSRF — adversary #10
// ════════════════════════════════════════════════════════════════════════════════════

// ── EVERY ADDRESS CASE TAKES ITS INPUT FROM `new URL(...).hostname` ─────────────────
//
// This is not a style preference, it is the fix for a defect these tests HAD. The old
// version asserted `addressIsPublic('::ffff:169.254.169.254') === false` and passed —
// against a dotted literal **the production path can never deliver**. `assertPublicUrl`
// reads `new URL(u).hostname`, and the WHATWG serialiser compresses that host to
// `::ffff:a9fe:a9fe` long before the guard sees it:
//
//     addressIsPublic('::ffff:169.254.169.254')   false   ← what the TEST fed
//     addressIsPublic('::ffff:a9fe:a9fe')         true    ← what PRODUCTION fed
//
// One green assertion, one live bypass, and the green one was the reason nobody looked.
// A fixture built from the fix cannot fail. `hostOf` is the only way in here now.
const hostOf = (url) => new URL(url).hostname.replace(/^\[|\]$/g, '');

test('claim-append — addressIsPublic decides on the VALUE, through the parser production uses', () => {
  // CONTROL FIRST: if everything were refused, every assertion below would be vacuous.
  for (const url of [
    'http://93.184.216.34/', 'http://8.8.8.8/', 'http://1.1.1.1/',
    'http://[2606:4700:4700::1111]/', 'http://[2001:4860:4860::8888]/',
    // A REAL NAT64 translation of a public address must still be admitted. The narrowing
    // must not cost `sourcer` the ability to source anything — it is the one engine that
    // can, and a guard that refuses the open web has replaced one defect with a worse one.
    'http://[64:ff9b::8.8.8.8]/',
  ]) {
    assert.equal(addressIsPublic(hostOf(url)), true, `${url} is on the public internet and must classify as one`);
  }

  const mustRefuse = [
    // IPv4, plain
    ['http://127.0.0.1/', 'loopback'],
    ['http://169.254.169.254/latest/meta-data/', 'link-local — the metadata endpoint'],
    ['http://10.0.0.1/', 'RFC1918'],
    ['http://172.16.0.1/', 'RFC1918 low edge'],
    ['http://172.31.255.255/', 'RFC1918 high edge'],
    ['http://192.168.1.1/', 'RFC1918'],
    ['http://0.0.0.0/', 'unspecified'],
    ['http://100.64.0.1/', 'CGNAT'],
    ['http://224.0.0.1/', 'multicast'],
    ['http://255.255.255.255/', 'broadcast'],
    // IPv6, plain
    ['http://[::1]/', 'loopback'],
    ['http://[::]/', 'unspecified'],
    ['http://[fd00::1]/', 'unique-local'],
    ['http://[fe80::1]/', 'link-local'],
    ['http://[ff02::1]/', 'multicast'],
    // ── THE BYPASS THAT SHIPPED. Every one of these was `true` before the fix, and the
    //    first was taken end to end against a real loopback server by a reviewer.
    ['http://[::ffff:169.254.169.254]/', 'IPv4-mapped — hostname becomes ::ffff:a9fe:a9fe'],
    ['http://[::ffff:127.0.0.1]/', 'IPv4-mapped loopback — ::ffff:7f00:1'],
    ['http://[::ffff:10.0.0.1]/', 'IPv4-mapped RFC1918 — ::ffff:a00:1'],
    ['http://[::127.0.0.1]/', 'IPv4-compatible ::/96 — ::7f00:1'],
    ['http://[64:ff9b::127.0.0.1]/', 'NAT64 well-known prefix'],
    ['http://[64:ff9b:1::7f00:1]/', 'RFC 8215 LOCAL-USE NAT64 — refused whole, not decoded'],
    ['http://[64:ff9b:1:ffff::1]/', 'anywhere else in that same /48'],
    ['http://[2002:7f00:1::]/', '6to4 — the embedded IPv4 is 127.0.0.1'],
    // And the already-compressed spellings, which is what the guard actually receives.
    ['http://[::ffff:a9fe:a9fe]/', 'the compressed form, written directly'],
    ['http://[::7f00:1]/', 'the compressed IPv4-compatible form'],
  ];
  for (const [url, why] of mustRefuse) {
    assert.equal(addressIsPublic(hostOf(url)), false, `${url} (${why}) — hostname was ${hostOf(url)}`);
  }

  // A name is not an address. The caller resolves it and classifies what DNS returns.
  assert.equal(addressIsPublic(hostOf('https://example.com/')), false);
  assert.equal(addressIsPublic('not-an-address'), false);
});

test('claim-append — ipToBytes collapses every spelling of one address to one value', () => {
  const bytes = (u) => ipToBytes(hostOf(u)).join('.');
  // The whole point of the fix: these are four spellings, one value.
  const loopback4 = bytes('http://[::ffff:127.0.0.1]/');
  assert.equal(loopback4, bytes('http://[::ffff:7f00:1]/'));
  assert.equal(loopback4.endsWith('127.0.0.1'), true, `expected the embedded octets, got ${loopback4}`);
  assert.equal(bytes('http://[::ffff:169.254.169.254]/'), bytes('http://[::ffff:a9fe:a9fe]/'));
  // CONTROL: distinct addresses must NOT collapse together.
  assert.notEqual(bytes('http://127.0.0.1/'), bytes('http://8.8.8.8/'));
  assert.equal(ipToBytes('example.com'), null, 'a name has no bytes');
});

// THE REGRESSION TEST FOR THE BYPASS, END TO END AGAINST A REAL SOCKET.
//
// The unit table above would have caught F1 once `hostOf` was in place. This exists
// anyway, because the bypass was proved by a reviewer running an actual loopback server
// and watching the claim land in the tracked file — and a guard whose failure was only
// ever constructed is a guard whose failure was never built. `fetchImpl` is NOT injected
// here: the real `fetch` must be the thing that does not get called.
//
// IT SKIPS UNDER THE ARMED SANDBOX, AND THE SKIP IS LOUD. `listen()` on loopback returns
// EPERM there — the same denial that took `mission-control`'s `stream.test.ts` out of
// `npm run check` and is documented at length in CLAUDE.md. CI runners are unsandboxed,
// so this binds and runs for real on every PR, which is the environment that matters for
// a regression test. The binding check in a sandboxed session is the unit table above,
// which needs no socket. What this must never become is a test that quietly passes
// without opening one.
test('claim-append — the IPv4-mapped bypass cannot reach a real loopback server', async (t) => {
  const http = await import('node:http');
  const root = makeRepo();
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(req.url);
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(PAGE);
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  } catch (e) {
    if (e.code === 'EPERM' || e.code === 'EACCES') {
      return t.skip(`loopback listen() denied (${e.code}) — the armed sandbox, not a result. `
        + 'This test binds a real socket on CI, which is unsandboxed. The sandbox-safe half of '
        + 'this guard is the addressIsPublic table above, which runs everywhere.');
    }
    throw e;
  }
  const port = server.address().port;
  try {
    // CONTROL: the server really is up and really would serve the quote, so a refusal
    // below cannot be "there was nothing there anyway".
    const probe = await fetch(`http://127.0.0.1:${port}/probe`);
    assert.equal((await probe.text()).includes('quote we are checking for'), true);
    assert.equal(hits.length, 1, 'the control request must have reached the server');

    for (const host of [`[::ffff:127.0.0.1]`, `[::127.0.0.1]`, `127.0.0.1`, `[::1]`]) {
      const e = await refusal(root, goodClaim({
        id: 'c-fixture-ssrf-probe',
        evidence: { url: `http://${host}:${port}/secret`, quote: QUOTE, accessed: day(0) },
      }), { fetchImpl: undefined, lookupImpl: undefined });
      assert.equal(e.code, 'URL_NOT_PUBLIC', `${host} must be refused by the guard`);
    }
    assert.equal(hits.length, 1, 'no guarded URL may have reached the server — still only the control probe');
    assert.equal(parseClaimsFromText(readTarget(root), TARGET_REL).claims.length, 0, 'nothing may have been appended');
  } finally {
    await new Promise((r) => server.close(r));
  }
});

test('claim-append — a literal link-local URL is refused BEFORE any fetch', async () => {
  const root = makeRepo();
  const f = fakeFetch();
  const e = await refusal(root, goodClaim({ evidence: { url: 'http://169.254.169.254/latest/meta-data/', quote: QUOTE, accessed: day(0) } }), { fetchImpl: f });
  assert.equal(e.code, 'URL_NOT_PUBLIC');
  assert.equal(f.calls.length, 0, 'the guard must refuse before a socket is opened');
});

test('claim-append — a HOSTNAME that resolves to a private address is refused (the guard in the hook cannot do this)', async () => {
  const root = makeRepo();
  const f = fakeFetch();
  const e = await refusal(root, goodClaim({ evidence: { url: 'https://totally-normal.example/x', quote: QUOTE, accessed: day(0) } }), {
    fetchImpl: f,
    lookupImpl: async () => [{ address: '169.254.169.254', family: 4 }],
  });
  assert.equal(e.code, 'URL_NOT_PUBLIC');
  assert.equal(f.calls.length, 0);
});

test('claim-append — EVERY resolved address is checked, not just the first', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim(), {
    lookupImpl: async () => [{ address: '93.184.216.34', family: 4 }, { address: '127.0.0.1', family: 4 }],
  });
  assert.equal(e.code, 'URL_NOT_PUBLIC');
  assert.match(e.message, /127\.0\.0\.1/);
});

test('claim-append — a redirect INTO the local network is refused at the hop', async () => {
  const root = makeRepo();
  let n = 0;
  const lookupImpl = async () => (++n === 1 ? [{ address: '93.184.216.34' }] : [{ address: '10.0.0.5' }]);
  const e = await refusal(root, goodClaim(), {
    fetchImpl: fakeFetch(PAGE, { redirectTo: 'https://internal.example/admin' }),
    lookupImpl,
  });
  assert.equal(e.code, 'URL_NOT_PUBLIC');
});

test('claim-append CONTROL — a redirect to a public address is followed and succeeds', async () => {
  const root = makeRepo();
  const out = await run(root, goodClaim(), { fetchImpl: fakeFetch(PAGE, { redirectTo: 'https://example.org/moved' }) });
  assert.equal(out.status, 'APPENDED');
});

test('claim-append — a non-http scheme is refused', async () => {
  const root = makeRepo();
  // The ledger schema catches this first, which is fine — what matters is that it never
  // reaches a fetch. Either refusal code is correct; silence would not be.
  const e = await refusal(root, goodClaim({ evidence: { url: 'file:///etc/passwd', quote: QUOTE, accessed: day(0) } }));
  assert.ok(['SCHEMA', 'URL_SCHEME'].includes(e.code), `unexpected ${e.code}`);
});

test('claim-append — an unresolvable host is refused', async () => {
  const root = makeRepo();
  const e = await refusal(root, goodClaim(), {
    lookupImpl: async () => { throw new Error('ENOTFOUND'); },
  });
  assert.equal(e.code, 'URL_UNRESOLVABLE');
});

// ════════════════════════════════════════════════════════════════════════════════════
// THE COMPILED INDEX — a successful append used to red a blocking CI step
// ════════════════════════════════════════════════════════════════════════════════════
//
// Measured before the fix, on the real repo: `ledger build --check` exit 0 → one append →
// "The index is generated. Run `node scripts/ledger.mjs build`". `ledger lint` stayed exit
// 0 throughout, so nothing warned until CI. And `sourcer` has neither `Bash` nor `Write`,
// so the agent this path exists for could not have repaired it.

test('claim-append — a successful append rebuilds the compiled index', async () => {
  const root = makeRepo();
  const calls = [];
  const out = await run(root, goodClaim(), {
    rebuildIndex: (r) => { calls.push(r); return { rebuilt: true, why: null }; },
  });
  assert.equal(out.status, 'APPENDED');
  assert.deepEqual(calls, [root], 'the rebuild must run, and against the repo that was written');
  assert.equal(out.index_rebuilt, true);
  assert.equal(out.remedy, undefined, 'nothing to remedy when the index was rebuilt');
});

test('claim-append — when the index CANNOT be rebuilt the return names the command', async () => {
  const root = makeRepo();   // a fixture repo has no scripts/ledger.mjs
  const out = await run(root, goodClaim());
  assert.equal(out.status, 'APPENDED');
  assert.equal(out.index_rebuilt, false);
  assert.match(out.remedy, /node scripts\/ledger\.mjs build/);
});

// ── THE ROLLBACK PROMISES A CLEAN TREE. THESE TEST THE PROMISE, NOT THE INTENTION ────
//
// `INDEX_REBUILD_FAILED` says the tree is exactly as it was before the call. That
// sentence was false in three reachable ways, all measured, and the fix was to make it
// true rather than to hedge it.

const indexPathOf = (root) => path.join(root, '.claude', 'ledger', 'index.json');

test('claim-append — a failing rebuild ROLLS THE CLAIM BACK, leaving the tree untouched', async () => {
  const root = makeRepo();
  const before = readTarget(root);
  const e = await refusal(root, goodClaim(), {
    rebuildIndex: () => { throw Object.assign(new Error('boom'), { stderr: 'ledger: parse error' }); },
  });
  assert.equal(e.code, 'INDEX_REBUILD_FAILED');
  assert.match(e.message, /parse error/);
  assert.equal(readTarget(root), before, 'a claim written then un-written must leave zero trace');
  assert.equal(parseClaimsFromText(readTarget(root), TARGET_REL).claims.length, 0);
});

test('claim-append — N1: a build that WRITES THE INDEX and then dies is rolled back too', async () => {
  // Reachable today with no code change: `ledger build` writes index.json and then
  // returns, so any signal in between — Ctrl-C, the OOM killer — lands here. Restoring
  // only the markdown left `build --check` failing in the OPPOSITE direction, "in the
  // index, missing from the artifacts", which nobody would trace to a clean rollback.
  const root = makeRepo();
  fs.mkdirSync(path.dirname(indexPathOf(root)), { recursive: true });
  fs.writeFileSync(indexPathOf(root), JSON.stringify({ version: 1, claims: [] }));
  const indexBefore = fs.readFileSync(indexPathOf(root), 'utf8');
  const targetBefore = readTarget(root);

  const e = await refusal(root, goodClaim(), {
    rebuildIndex: (r) => {
      fs.writeFileSync(indexPathOf(r), JSON.stringify({ version: 1, claims: ['REWRITTEN'] }));
      throw new Error('killed after the write');
    },
  });
  assert.equal(e.code, 'INDEX_REBUILD_FAILED');
  assert.equal(fs.readFileSync(indexPathOf(root), 'utf8'), indexBefore, 'the index must be restored too');
  assert.equal(readTarget(root), targetBefore);
});

test('claim-append — N2: rolling back must not CREATE a file that never existed', async () => {
  // `current` falls back to `seedFile()`, a string that was never on disk. Writing it
  // back turned "absent" into "present" while the refusal said the tree was untouched.
  const root = makeRepo();
  fs.unlinkSync(targetOf(root));
  assert.equal(fs.existsSync(targetOf(root)), false, 'CONTROL: the target really is absent to begin with');

  const e = await refusal(root, goodClaim(), { rebuildIndex: () => { throw new Error('boom'); } });
  assert.equal(e.code, 'INDEX_REBUILD_FAILED');
  assert.equal(fs.existsSync(targetOf(root)), false, 'absent before, absent after — that is what "untouched" means');

  // CONTROL: the same repo DOES accept an append, so the absence above is the rollback
  // and not the path being broken without its target.
  assert.equal((await run(root, goodClaim())).status, 'APPENDED');
  assert.equal(fs.existsSync(targetOf(root)), true);
});

test('claim-append — N3: the rollback is atomic, so it cannot leave a truncated file', async () => {
  const root = makeRepo();
  await run(root, goodClaim({ id: 'c-first' }));
  const before = readTarget(root);
  await refusal(root, goodClaim({ id: 'c-second' }), { rebuildIndex: () => { throw new Error('boom'); } });
  assert.equal(readTarget(root), before);
  // No staging file may survive — a stray .tmp beside the target is how the next reader
  // finds bytes nobody meant to keep.
  const strays = fs.readdirSync(path.dirname(targetOf(root))).filter((f) => f.endsWith('.tmp'));
  assert.deepEqual(strays, [], `stray staging files: ${strays.join(', ')}`);
});

test('claim-append — N3: a truncation the PARSER accepts is refused, not baked in', async () => {
  // The silent half. Cut the file at a claim-block boundary and it parses perfectly with
  // fewer claims, so TARGET_ALREADY_INVALID never fires. Measured before the fix: the
  // append SUCCEEDED, the index was rebuilt from the truncated file, `build --check`
  // stayed green, and only `git diff` showed the loss.
  const root = makeRepo();
  await run(root, goodClaim({ id: 'c-first' }));
  await run(root, goodClaim({ id: 'c-second' }));
  const present = parseClaimsFromText(readTarget(root), TARGET_REL).claims;
  assert.equal(present.length, 2, 'CONTROL: two claims are really there before the damage');
  fs.mkdirSync(path.dirname(indexPathOf(root)), { recursive: true });
  fs.writeFileSync(indexPathOf(root), JSON.stringify({
    version: 1, claims: present.map((c) => ({ id: c.id, source_file: TARGET_REL })),
  }));

  const full = readTarget(root);
  fs.writeFileSync(targetOf(root), full.slice(0, full.indexOf('## c-second')));
  assert.deepEqual(parseClaimsFromText(readTarget(root), TARGET_REL).issues, [],
    'CONTROL: the truncated file still PARSES — that is why this was silent');

  const e = await refusal(root, goodClaim({ id: 'c-third' }));
  assert.equal(e.code, 'TARGET_TRUNCATED');
  assert.match(e.message, /c-second/);
  assert.equal(parseClaimsFromText(readTarget(root), TARGET_REL).claims.map((c) => c.id).includes('c-third'), false,
    'the loss must not be baked in behind a new claim');
});

test('claim-append — a rollback that ITSELF fails says the tree is inconsistent', async () => {
  // The last branch of the promise. If the restore cannot be done, the refusal must not
  // go on claiming a clean tree — it must name what was left.
  const root = makeRepo();
  const e = await refusal(root, goodClaim(), {
    rebuildIndex: (r) => {
      // Make the restore impossible: replace the target's directory entry with a
      // directory of the same name, so writeFileSync and unlink both fail.
      fs.unlinkSync(path.join(r, TARGET_REL));
      fs.mkdirSync(path.join(r, TARGET_REL));
      throw new Error('boom');
    },
  });
  assert.equal(e.code, 'ROLLBACK_FAILED');
  assert.match(e.message, /THE TREE IS INCONSISTENT/);
  assert.match(e.message, /SOURCED-CLAIMS\.md/);
});

test('claim-append — the DEFAULT rebuild really runs ledger build, against the real repo', async () => {
  // The three tests above inject the rebuild, so they prove the wiring and prove nothing
  // about `defaultRebuildIndex`. This one runs the real thing against a throwaway copy of
  // the real repo's ledger machinery, then asserts the index file was actually rewritten.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'claim-append-real-'));
  for (const d of ['scripts/lib', 'scripts/mcp', '.claude/ledger', 'docs/03-system-design/adr']) {
    fs.mkdirSync(path.join(root, d), { recursive: true });
  }
  for (const f of ['ledger.mjs', 'classify.mjs']) {
    fs.copyFileSync(path.join(REAL_REPO, 'scripts', f), path.join(root, 'scripts', f));
  }
  for (const f of fs.readdirSync(path.join(REAL_REPO, 'scripts', 'lib'))) {
    fs.copyFileSync(path.join(REAL_REPO, 'scripts', 'lib', f), path.join(root, 'scripts', 'lib', f));
  }
  fs.copyFileSync(path.join(REAL_REPO, '.claude', 'qa-tier-floor.yml'), path.join(root, '.claude', 'qa-tier-floor.yml'));
  fs.writeFileSync(path.join(root, 'docs', '03-system-design', TARGET_REL.split('/').pop()), seedFile());
  fs.writeFileSync(path.join(root, '.warroom.yml'), 'session: claim-append-test\n');
  const git = (...a) => execFileSync('git', a, { cwd: root, stdio: 'pipe' });
  git('init', '-q'); git('config', 'user.email', 't@e.com'); git('config', 'user.name', 't');
  git('add', '-A'); git('commit', '-qm', 'fixture');

  const indexPath = path.join(root, '.claude', 'ledger', 'index.json');
  execFileSync(process.execPath, [path.join(root, 'scripts', 'ledger.mjs'), 'build'], { cwd: root, stdio: 'pipe' });
  const idxBefore = fs.readFileSync(indexPath, 'utf8');

  // CONTROL: with the index freshly built, --check must be happy.
  execFileSync(process.execPath, [path.join(root, 'scripts', 'ledger.mjs'), 'build', '--check'], { cwd: root, stdio: 'pipe' });

  const out = await run(root, goodClaim());
  assert.equal(out.index_rebuilt, true, 'the real rebuild must have run');
  assert.notEqual(fs.readFileSync(indexPath, 'utf8'), idxBefore, 'the index must have changed');
  assert.match(fs.readFileSync(indexPath, 'utf8'), /c-fixture-sourced-fact/);

  // THE POINT OF THE WHOLE FIX: the blocking step is still green after an append.
  execFileSync(process.execPath, [path.join(root, 'scripts', 'ledger.mjs'), 'build', '--check'], { cwd: root, stdio: 'pipe' });
});

// ════════════════════════════════════════════════════════════════════════════════════
// THE TWO RACES. Both were untested and both are reachable.
// ════════════════════════════════════════════════════════════════════════════════════

test('claim-append — an existing lock refuses rather than interleaving', async () => {
  const root = makeRepo();
  const lock = path.join(root, 'docs', '03-system-design', '.SOURCED-CLAIMS.lock');
  fs.writeFileSync(lock, '99999');
  const e = await refusal(root, goodClaim());
  assert.equal(e.code, 'LOCKED');
  assert.equal(parseClaimsFromText(readTarget(root), TARGET_REL).claims.length, 0);

  // CONTROL: with the lock gone the same call succeeds, so LOCKED was the lock.
  fs.unlinkSync(lock);
  assert.equal((await run(root, goodClaim())).status, 'APPENDED');
  assert.equal(fs.existsSync(lock), false, 'the lock must be released on the way out');
});

test('claim-append — a concurrent writer between validation and write is caught', async () => {
  // The target is read for validation BEFORE the fetch and re-read INSIDE the lock after
  // it. A fetch that mutates the file in between is exactly the interleaving a second
  // appender would produce, and it is the only window the O_EXCL lock cannot cover.
  const root = makeRepo();
  const racing = async (url, init) => {
    fs.appendFileSync(targetOf(root), '\nA line written by somebody else.\n');
    return fakeFetch()(url, init);
  };
  const e = await refusal(root, goodClaim(), { fetchImpl: racing });
  assert.equal(e.code, 'TARGET_CHANGED');
  assert.equal(readTarget(root).includes('written by somebody else'), true, "the other writer's bytes must survive");
  assert.equal(parseClaimsFromText(readTarget(root), TARGET_REL).claims.length, 0, 'and ours must not have landed');
});

// ── The round trip is DEFENCE IN DEPTH, and this test says so honestly ──────────────
// A reviewer deleted both `roundTrip` calls and the suite stayed 48 pass · 0 fail: with
// `checkText` refusing control characters and `validateClaim` closing every unquoted
// field (`ID_RE`, `KINDS`, `SUPPORTS_RE`, numeric `confidence`), no submission reachable
// through `appendClaim` can currently defeat the emitter. The header used to call this
// "STOPPED TWICE … proved on every single call", which was stronger than the evidence.
// It is now described as what it is, and the predicate is exercised directly here so the
// second line of defence is at least a tested one rather than an assumed one.
test('claim-append — the round-trip predicate catches an emitter that breaks out', () => {
  const claim = {
    id: 'c-hypothetical', kind: 'behavior', scope: 'project', verified_by: 'source',
    evidence: { url: 'https://example.com/a', quote: 'q', accessed: '2026-08-26' },
    valid_until: '2026-09-26', confidence: 1,
  };
  const clean = _emitSection({ ...claim, assert: 'an ordinary sentence' }, { appended: '2026-08-26', by: 't', digest: 'x' });
  const cleanParse = parseClaimsFromText(clean, 'f.md');
  assert.deepEqual(cleanParse.issues, []);
  assert.equal(cleanParse.claims.length, 1, 'CONTROL: a normal value emits exactly one claim');

  // Now the state `checkText` currently makes unreachable: a raw newline reaching the
  // emitter. If a future edit relaxes that refusal, THIS is what still catches it.
  const broken = _emitSection(
    { ...claim, assert: 'harmless"\n  - id: c-forged\n    assert: "injected' },
    { appended: '2026-08-26', by: 't', digest: 'x' },
  );
  const brokenParse = parseClaimsFromText(broken, 'f.md');
  const escaped = brokenParse.issues.length > 0 || brokenParse.claims.length !== 1
    || brokenParse.claims[0].assert !== 'harmless"\n  - id: c-forged\n    assert: "injected';
  assert.equal(escaped, true,
    'a raw newline must either break the parse or fail the field comparison — either way roundTrip refuses');
});

// ════════════════════════════════════════════════════════════════════════════════════
// REFUSALS ARE RECORDED, so the friction is measured rather than guessed
// ════════════════════════════════════════════════════════════════════════════════════

test('claim-append — every refusal writes a named event', async () => {
  const root = makeRepo();
  await refusal(root, goodClaim({ scope: 'global' }));
  const ev = fs.readFileSync(path.join(root, 'events.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(ev.length, 1);
  assert.equal(ev[0].event, 'claim.append_refused');
  assert.equal(ev[0].code, 'SCOPE_NOT_PROJECT');
  assert.equal(ev[0].id, 'c-fixture-sourced-fact');
});

// ════════════════════════════════════════════════════════════════════════════════════
// THE REAL REPO'S OWN WIRING — these assert configuration, and say so
// ════════════════════════════════════════════════════════════════════════════════════

test('claim-append wiring — sourcer holds the grant and STILL holds no write tool', () => {
  const src = fs.readFileSync(path.join(REAL_REPO, '.claude', 'agents', 'sourcer.md'), 'utf8');
  const tools = src.match(/^tools:\s*\[(.*)\]$/m);
  assert.ok(tools, 'sourcer must declare a tools list');
  const list = tools[1].split(',').map((s) => s.trim());
  for (const forbidden of ['Write', 'Edit', 'Bash', 'NotebookEdit', 'MultiEdit']) {
    assert.ok(!list.includes(forbidden),
      `sourcer must not hold ${forbidden} — the point of the MCP grant is that the network-capable engine still cannot edit the repo`);
  }
  assert.match(src, /^mcpServers:\s*\[claim-append\]$/m);
});

test('claim-append wiring — the grant is backed by real configuration', () => {
  const mcp = JSON.parse(fs.readFileSync(path.join(REAL_REPO, '.mcp.json'), 'utf8'));
  assert.ok(mcp.mcpServers['claim-append'], '.mcp.json must configure the server the agent declares');
  const rel = mcp.mcpServers['claim-append'].args[0];
  assert.ok(fs.existsSync(path.join(REAL_REPO, rel)), `${rel} must exist`);

  const policy = JSON.parse(fs.readFileSync(path.join(REAL_REPO, '.claude', 'mcp-policy.json'), 'utf8'));
  assert.deepEqual(policy.servers['claim-append'].allow, ['append_claim'],
    'exactly one tool is allowed; anything else on this server is unlisted, which the hook treats as denied');
  assert.equal(policy.servers['claim-append'].credentialed, false);
});

// ════════════════════════════════════════════════════════════════════════════════════
// THE TRANSPORT — executed, not described
// ════════════════════════════════════════════════════════════════════════════════════

// `lines` may hold objects (serialised) or raw strings (written verbatim, so a malformed
// frame can actually be sent).
function rpc(lines) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join(REAL_REPO, 'scripts', 'mcp', 'claim-append-server.mjs')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, WARROOM_EVENTS: path.join(os.tmpdir(), 'claim-append-rpc-events.jsonl') },
    });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', reject);
    p.on('close', (code) => resolve({ code, out, err, msgs: out.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) }));
    for (const l of lines) p.stdin.write(`${typeof l === 'string' ? l : JSON.stringify(l)}\n`);
    p.stdin.end();
  });
}

test('claim-append server — initialize, tools/list and an unknown tool, over real stdio', async () => {
  const { msgs } = await rpc([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {} } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'write_file', arguments: {} } },
  ]);
  const byId = new Map(msgs.map((m) => [m.id, m]));
  assert.equal(byId.get(1).result.serverInfo.name, 'claim-append');
  assert.ok(byId.get(1).result.capabilities.tools);

  const tools = byId.get(2).result.tools;
  assert.equal(tools.length, 1, 'the server exposes exactly one tool');
  assert.equal(tools[0].name, 'append_claim');
  assert.equal(tools[0].inputSchema.properties.scope.enum[0], 'project');
  assert.deepEqual(tools[0].inputSchema.properties.verified_by.enum, ['source']);

  assert.equal(byId.get(3).result.isError, true);
  assert.match(byId.get(3).result.content[0].text, /REFUSED\[UNKNOWN_TOOL\]/);
});

test('claim-append server — a refused append comes back as a readable tool error, not a protocol error', async () => {
  const { msgs } = await rpc([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'append_claim',
        arguments: { ...goodClaim({ scope: 'global' }) },
      },
    },
  ]);
  const call = msgs.find((m) => m.id === 2);
  assert.equal(call.error, undefined, 'the model has to be able to READ why it was refused');
  assert.equal(call.result.isError, true);
  assert.match(call.result.content[0].text, /REFUSED\[SCOPE_NOT_PROJECT\]/);
});

test('claim-append server — a malformed frame is dropped and the server keeps serving', async () => {
  const { code, msgs, err } = await rpc([
    '{ this is not json',
    '',
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  ]);
  assert.match(err, /unparseable/, 'the drop must be reported, not silent');
  assert.equal(code, 0);
  // The requests AFTER the malformed frame are answered — a transport that dies on bad
  // input is a transport whose refusals nobody ever sees.
  assert.deepEqual(msgs.map((m) => m.id), [1, 2]);
  assert.equal(msgs[1].result.tools.length, 1);
});

// ════════════════════════════════════════════════════════════════════════════════════
// THE CLI — the same gate, executed as a process
// ════════════════════════════════════════════════════════════════════════════════════

test('claim-append CLI — exits 1 with a named code on refusal and 0 on a dry run', () => {
  const root = makeRepo();
  const recFile = path.join(root, 'rec.json');

  fs.writeFileSync(recFile, JSON.stringify(goodClaim({ scope: 'task' })));
  let code = 0;
  let stderr = '';
  try {
    execFileSync(process.execPath, [path.join(REAL_REPO, 'scripts', 'claim-append.mjs'), '--file', recFile],
      { cwd: REAL_REPO, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, WARROOM_EVENTS: path.join(root, 'events.jsonl') } });
  } catch (e) {
    code = e.status;
    stderr = e.stderr;
  }
  assert.equal(code, 1);
  assert.match(stderr, /REFUSED\[SCOPE_NOT_PROJECT\]/);

  // And a malformed record is a refusal too, not a stack trace.
  fs.writeFileSync(recFile, 'not json at all');
  let code2 = 0;
  let stderr2 = '';
  try {
    execFileSync(process.execPath, [path.join(REAL_REPO, 'scripts', 'claim-append.mjs'), '--file', recFile],
      { cwd: REAL_REPO, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    code2 = e.status;
    stderr2 = e.stderr;
  }
  assert.equal(code2, 1);
  assert.match(stderr2, /REFUSED\[INPUT_NOT_JSON\]/);
});
