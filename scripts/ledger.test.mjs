// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:ledger`.
//
// scripts/ledger.test.mjs — the resolvers, and the invariant that holds the ledger up.
//
// THE INVARIANT UNDER TEST: no resolver returns `pass` when it could not check.
//
// Every "returns unresolved" case below is a case where a fail-open resolver would have
// returned pass and the build would have gone green over an unverified claim. That is not
// hypothetical here: `.claude/hooks/schema-lint.js` still contains `catch { LIVE_SKILLS =
// null }`, which silently disables its own skill check whenever the manifest will not
// parse, and fabrications survived eight weeks of green builds behind exactly that shape.
//
// The network is never touched. `fetchImpl` is injected, so a dead DNS entry, a 404, a
// moved quote and a timeout are all constructed rather than hoped for — the Phase 2
// lesson: a guard verified only on the happy path is a guard whose failure was never built.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const R = require('./lib/resolvers.js');

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOW = Date.UTC(2026, 7, 11); // 2026-08-11, fixed so nothing depends on the wall clock

const claim = (over = {}) => ({
  id: 'c-t',
  assert: 'a thing',
  kind: 'external-fact',
  scope: 'project',
  verified_by: 'source',
  evidence: {},
  valid_until: '2026-11-09',
  confidence: 1,
  ...over,
});

const ok = (body) => ({ ok: true, status: 200, text: async () => body });

// ── claim-freshness ─────────────────────────────────────────────────────────

test('freshness passes while the claim is inside its window', () => {
  const r = R.freshness(claim({ valid_until: '2026-11-09' }), { now: NOW });
  assert.equal(r.status, 'pass');
  // 2026-08-11 → 2026-11-09 is 90 days, plus the valid_until day itself, which the
  // claim is live through.
  assert.match(r.reason, /91 days remaining/);
});

test('freshness fails the day after valid_until, and says how late it is', () => {
  const r = R.freshness(claim({ valid_until: '2026-08-10' }), { now: NOW });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /expired 0 days ago/);
  assert.match(r.reason, /Refresh, Deprecate, or Waive/);
});

test('freshness is inclusive of the valid_until day itself', () => {
  assert.equal(R.freshness(claim({ valid_until: '2026-08-11' }), { now: NOW }).status, 'pass');
});

test('a durable claim with no valid_until fails — the nested-spawn shape', () => {
  const r = R.freshness(claim({ valid_until: undefined }), { now: NOW });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /no valid_until/);
});

test('a task-scoped claim needs no expiry — it dies with the branch', () => {
  const r = R.freshness(claim({ scope: 'task', valid_until: undefined }), { now: NOW });
  assert.equal(r.status, 'pass');
});

// ── claim-source ────────────────────────────────────────────────────────────

const sourceClaim = (ev = {}) => claim({
  verified_by: 'source',
  evidence: { url: 'https://x.test/a', quote: 'the recorded quote', accessed: '2026-08-01', ...ev },
});

test('source passes when the URL is live and the quote is present', async () => {
  const r = await R.source(sourceClaim(), { now: NOW, fetchImpl: async () => ok('<p>Here is The Recorded   Quote today</p>') });
  assert.equal(r.status, 'pass');
});

test('source matches through HTML tags, entities and collapsed whitespace', async () => {
  const r = await R.source(sourceClaim({ quote: 'price is $20 & up' }), {
    now: NOW,
    fetchImpl: async () => ok('<div><b>price</b>\n  is $20 &amp;\tup</div>'),
  });
  assert.equal(r.status, 'pass');
});

test('source FAILS when the URL cannot be reached — a dead citation is a finding', async () => {
  const r = await R.source(sourceClaim(), {
    now: NOW,
    fetchImpl: async () => { const e = new Error('getaddrinfo ENOTFOUND x.invalid'); throw e; },
  });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /fetch failed/);
});

test('source fails on a timeout rather than hanging or passing', async () => {
  const r = await R.source(sourceClaim(), {
    now: NOW,
    fetchImpl: async () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e; },
  });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /timed out/);
});

test('source fails on a non-2xx response', async () => {
  const r = await R.source(sourceClaim(), { now: NOW, fetchImpl: async () => ({ ok: false, status: 404, text: async () => '' }) });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /HTTP 404/);
});

test('source fails when the page is live but the quote has moved', async () => {
  const r = await R.source(sourceClaim(), { now: NOW, fetchImpl: async () => ok('<p>completely different content now</p>') });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /the source moved or the quote was never there/);
});

test('source is UNRESOLVED offline — never pass', async () => {
  const r = await R.source(sourceClaim(), { now: NOW, offline: true, fetchImpl: async () => ok('the recorded quote') });
  assert.equal(r.status, 'unresolved');
  assert.notEqual(r.status, 'pass');
});

test('source fails on an accessed date in the future', async () => {
  const r = await R.source(sourceClaim({ accessed: '2027-01-01' }), { now: NOW, fetchImpl: async () => ok('the recorded quote') });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /in the future/);
});

test('source still passes on a stale accessed date but says so', async () => {
  const r = await R.source(sourceClaim({ accessed: '2025-01-01' }), { now: NOW, fetchImpl: async () => ok('the recorded quote') });
  assert.equal(r.status, 'pass');
  assert.match(r.reason, /is \d+ days old/);
});

// ── claim-command ───────────────────────────────────────────────────────────

const cmdClaim = (ev) => claim({ verified_by: 'command', evidence: ev });

test('command passes when the exit code matches', () => {
  assert.equal(R.command(cmdClaim({ cmd: 'true', expect_exit: 0 }), { cwd: REPO_ROOT }).status, 'pass');
});

test('command fails on the wrong exit code and reports what it got', () => {
  const r = R.command(cmdClaim({ cmd: 'exit 3', expect_exit: 0 }), { cwd: REPO_ROOT });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /exit 3, expected 0/);
});

test('command honours a non-zero expect_exit', () => {
  assert.equal(R.command(cmdClaim({ cmd: 'false', expect_exit: 1 }), { cwd: REPO_ROOT }).status, 'pass');
});

test('command fails when stdout does not match expect_stdout', () => {
  const r = R.command(cmdClaim({ cmd: 'echo hello', expect_stdout: 'goodbye' }), { cwd: REPO_ROOT });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /stdout does not match/);
});

test('command passes when both exit code and stdout match', () => {
  assert.equal(R.command(cmdClaim({ cmd: 'echo hello world', expect_stdout: '^hello' }), { cwd: REPO_ROOT }).status, 'pass');
});

test('a missing command is a failure, not a skip', () => {
  const r = R.command(cmdClaim({ cmd: './scripts/definitely-not-here.sh' }), { cwd: REPO_ROOT });
  assert.equal(r.status, 'fail');
});

test('a command that times out is UNRESOLVED, not pass', () => {
  const r = R.command(cmdClaim({ cmd: 'sleep 5' }), { cwd: REPO_ROOT, timeoutMs: 150 });
  assert.equal(r.status, 'unresolved');
  assert.notEqual(r.status, 'pass');
});

test('command execution can be disabled, and then reports unresolved rather than pass', () => {
  const r = R.command(cmdClaim({ cmd: 'true' }), { cwd: REPO_ROOT, skipCommands: true });
  assert.equal(r.status, 'unresolved');
});

// ── claim-judge ─────────────────────────────────────────────────────────────

const judged = (risk, panel) => claim({
  verified_by: 'judge',
  kind: 'judgment',
  evidence: { lenses: ['correctness'], risk, judged_by: panel },
});
const J = (family, verdict = 'pass') => ({ model_family: family, model_id: `${family}-1`, verdict, at: '2026-08-11' });

test('an unjudged claim is UNRESOLVED forever — it cannot pass by never being judged', () => {
  const r = R.judge(judged('low', []));
  assert.equal(r.status, 'unresolved');
  assert.match(r.reason, /ledger\.mjs judge c-t/);
});

test('a dissenting judge fails the claim', () => {
  const r = R.judge(judged('high', [J('anthropic'), J('openai', 'fail')]));
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /1 of 2 judges returned fail/);
});

test('an undecided judge leaves the claim unresolved', () => {
  const r = R.judge(judged('low', [J('anthropic', 'unresolved')]));
  assert.equal(r.status, 'unresolved');
});

test('risk:high fails with a single-family panel, however many members it has', () => {
  const r = R.judge(judged('high', [J('anthropic'), J('anthropic'), J('anthropic')]));
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /one family agreeing with itself is one opinion/);
});

test('risk:high passes with two families in agreement', () => {
  assert.equal(R.judge(judged('high', [J('anthropic'), J('openai')])).status, 'pass');
});

test('risk:low accepts a single judge', () => {
  assert.equal(R.judge(judged('low', [J('anthropic')])).status, 'pass');
});

// ── Dispatch ────────────────────────────────────────────────────────────────

test('freshness is applied to every durable claim even when the tier map asks for nothing', () => {
  assert.deepEqual(R.resolversFor(claim({ verified_by: 'command' }), []), ['claim-command', 'claim-freshness']);
  assert.deepEqual(R.resolversFor(claim({ verified_by: 'source' }), []), ['claim-freshness', 'claim-source']);
});

test('a task-scoped claim gets no freshness resolver', () => {
  assert.deepEqual(R.resolversFor(claim({ scope: 'task', verified_by: 'command' }), []), ['claim-command']);
});

test('tier-map resolvers are added to the claim\'s own', () => {
  assert.deepEqual(
    R.resolversFor(claim({ verified_by: 'command' }), ['claim-source']),
    ['claim-command', 'claim-freshness', 'claim-source']
  );
});

test('an unknown resolver name throws — the registry is closed', async () => {
  await assert.rejects(() => R.run('claim-arithmetic', claim()), /unknown resolver "claim-arithmetic"/);
});

// ── The canary, and the index ───────────────────────────────────────────────

test('the committed index reproduces exactly from the artifacts', () => {
  // Same property `ledger build --check` enforces in CI, asserted here so a local run
  // catches it before the push.
  const out = execFileSync('node', ['scripts/ledger.mjs', 'build', '--check'], { cwd: REPO_ROOT, encoding: 'utf8' });
  assert.match(out, /index matches/);
});

test('the canary claim is present and still shaped to fail both resolvers', async () => {
  const index = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude', 'ledger', 'index.json'), 'utf8'));
  const canary = index.claims.find((c) => c.id === 'c-canary-unresolvable');
  assert.ok(canary, 'docs/06-codebase/ledger-canary.md must keep its claim — it is the live proof the resolvers still fire');
  assert.match(canary.evidence.url, /\.invalid\//, 'the URL must stay unreachable');

  assert.equal(R.freshness(canary, { now: NOW }).status, 'fail', 'the canary must stay expired');
  const s = await R.source(canary, {
    now: NOW,
    fetchImpl: async () => { throw new Error('getaddrinfo ENOTFOUND example.invalid'); },
  });
  assert.equal(s.status, 'fail', 'the canary must stay unfetchable');
});

// ── events.jsonl ────────────────────────────────────────────────────────────

test('verify writes a would_block line per failing resolver, and exits 0 in shadow', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-events-'));
  const evFile = path.join(tmp, 'events.jsonl');
  try {
    execFileSync('node', ['scripts/ledger.mjs', 'verify', '--offline', '--no-exec'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { ...process.env, WARROOM_EVENTS: evFile },
    });
    const lines = fs.readFileSync(evFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const canary = lines.filter((l) => l.claim === 'c-canary-unresolvable');
    assert.ok(canary.length >= 2, `the canary must produce at least two events, got ${canary.length}`);
    assert.ok(canary.every((l) => l.event === 'claim.would_block'), 'the canary sits on a shadow path');
    assert.ok(canary.some((l) => l.resolver === 'claim-freshness' && l.status === 'fail'));
    assert.ok(canary.some((l) => l.resolver === 'claim-source'));
    for (const l of lines) {
      assert.ok(l.ts && l.claim && l.resolver && l.status && l.reason, `event missing fields: ${JSON.stringify(l)}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
