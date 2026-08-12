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

// ── Dispositions ────────────────────────────────────────────────────────────
// ADR-001: "On expiry, exactly one disposition is recorded — Refresh · Deprecate ·
// Waive(new deadline)." The test that matters is the LAPSED waiver: a disposition that
// silently stops mattering is worse than none, because it consumed the one decision the
// expiry mechanism was built to force.

const expired = (over = {}) => claim({ valid_until: '2026-06-01', ...over });

test('a live waiver postpones an expired claim and shows the deadline', () => {
  const r = R.freshness(expired({ disposition: { action: 'waive', until: '2026-09-08', reason: 'shadow window still open' } }), { now: NOW });
  assert.equal(r.status, 'pass');
  assert.match(r.reason, /waived for 29 more days \(until 2026-09-08\)/);
  assert.match(r.reason, /shadow window still open/);
});

test('a LAPSED waiver fails, and says it is worse than no disposition', () => {
  const r = R.freshness(expired({ disposition: { action: 'waive', until: '2026-07-01', reason: 'meant to revisit' } }), { now: NOW });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /WAIVER LAPSED 40 days ago/); // 2026-07-02 deadline → 2026-08-11
  assert.match(r.reason, /worse than no disposition/);
});

test('deprecate retires a claim instead of leaving it failing forever', () => {
  const r = R.freshness(expired({ disposition: { action: 'deprecate', reason: 'the API it described was removed' } }), { now: NOW });
  assert.equal(r.status, 'pass');
  assert.match(r.reason, /deprecated — no longer claimed/);
});

test('refresh does NOT short-circuit the resolver — saying you renewed it is not it passing', () => {
  const r = R.freshness(expired({ disposition: { action: 'refresh', reason: 're-checked the source' } }), { now: NOW });
  assert.equal(r.status, 'fail', 'refresh must not mask a still-expired valid_until');
  assert.match(r.reason, /expired/);
});

test('a waiver covers an unjudged claim', () => {
  const c = claim({
    verified_by: 'judge',
    evidence: { lenses: ['x'], risk: 'high', judged_by: [] },
    disposition: { action: 'waive', until: '2026-09-08', reason: 'cannot spawn judges in this process' },
  });
  assert.equal(R.judge(c, { now: NOW }).status, 'pass');
});

test('a waiver does NOT cover a panel that judged and dissented', () => {
  // You do not get to waive an answer.
  const c = claim({
    verified_by: 'judge',
    evidence: {
      lenses: ['x'],
      risk: 'low',
      judged_by: [{ model_family: 'anthropic', model_id: 'a', verdict: 'fail', at: '2026-08-11' }],
    },
    disposition: { action: 'waive', until: '2026-12-01', reason: 'not now' },
  });
  const r = R.judge(c, { now: NOW });
  assert.equal(r.status, 'fail');
  assert.match(r.reason, /judges returned fail/);
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

test('tier-map resolvers are added to the claim\'s own — when the evidence supports them', () => {
  // A claim carrying BOTH a cmd and a url legitimately gets both resolvers.
  assert.deepEqual(
    R.resolversFor(claim({ verified_by: 'command', evidence: { cmd: 'true', url: 'https://x.test/' } }), ['claim-source']),
    ['claim-command', 'claim-freshness', 'claim-source']
  );
});

test('a tier-map resolver is skipped when the claim carries no evidence for it', () => {
  // Regression. A `verified_by: judge` claim under docs/03-system-design/** — whose rule
  // lists claim-command — had the command resolver run against an absent cmd. It executed
  // nothing and reported "exit 127, expected 0", which reads as a real command failing.
  const judgeClaim = claim({
    verified_by: 'judge',
    evidence: { lenses: ['x'], risk: 'low', judged_by: [] },
  });
  assert.deepEqual(R.resolversFor(judgeClaim, ['claim-command', 'claim-freshness']),
    ['claim-freshness', 'claim-judge'], 'claim-command must not attach to a claim with no cmd');

  const sourceClaimNoUrl = claim({ verified_by: 'command', evidence: { cmd: 'true' } });
  assert.deepEqual(R.resolversFor(sourceClaimNoUrl, ['claim-source']),
    ['claim-command', 'claim-freshness'], 'claim-source must not attach to a claim with no url');
});

test('the command resolver refuses to shell out to nothing', () => {
  const r = R.command(claim({ verified_by: 'judge', evidence: { lenses: ['x'] } }), { cwd: REPO_ROOT });
  assert.equal(r.status, 'unresolved');
  assert.match(r.reason, /carries no evidence.cmd/);
  assert.notEqual(r.status, 'fail', 'an inapplicable resolver must not look like a failed command');
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

// ── ledger events — the reader ──────────────────────────────────────────────

function runEvents(file, extra = []) {
  return execFileSync('node', ['scripts/ledger.mjs', 'events', ...extra], {
    cwd: REPO_ROOT, encoding: 'utf8', env: { ...process.env, WARROOM_EVENTS: file },
  });
}

test('a missing log reads differently from an empty one', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-'));
  try {
    const missing = runEvents(path.join(tmp, 'nope.jsonl'));
    assert.match(missing, /the log does not exist yet/);

    const empty = path.join(tmp, 'empty.jsonl');
    fs.writeFileSync(empty, '');
    assert.match(runEvents(empty), /no claim events in this window/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('non-claim and unparseable lines are counted, not silently dropped', () => {
  // events.jsonl is shared with the launcher. A reader that quietly ignores what it does
  // not understand makes the log look smaller than it is.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-'));
  const f = path.join(tmp, 'events.jsonl');
  try {
    fs.writeFileSync(f, [
      JSON.stringify({ ts: 1786474674, event: 'war_room_kill', details: 'x' }),
      '{not json',
      JSON.stringify({ ts: 1786474674, event: 'claim.would_block', claim: 'c-a', resolver: 'claim-source', status: 'fail', reason: 'r' }),
    ].join('\n') + '\n');
    const out = runEvents(f);
    assert.match(out, /1 non-claim \(launcher\)/);
    assert.match(out, /1 unparseable/);
    assert.match(out, /1 claim events/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('--since excludes older events and reports how many it excluded', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-'));
  const f = path.join(tmp, 'events.jsonl');
  const nowS = Math.floor(Date.now() / 1000);
  try {
    fs.writeFileSync(f, [
      JSON.stringify({ ts: nowS - 60 * 86400, event: 'claim.would_block', claim: 'c-old', resolver: 'claim-source', status: 'fail', reason: 'old' }),
      JSON.stringify({ ts: nowS - 3600, event: 'claim.block', claim: 'c-new', resolver: 'claim-command', status: 'fail', reason: 'new' }),
    ].join('\n') + '\n');
    const out = runEvents(f, ['--since', '7d']);
    assert.match(out, /1 claim events/);
    assert.match(out, /1 older/);
    assert.match(out, /c-new/);
    assert.doesNotMatch(out, /c-old/);
    assert.match(out, /1 BLOCKING/, 'a blocking event must be distinguishable from a shadow one');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('a bad --since is refused rather than silently meaning "all time"', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-'));
  const f = path.join(tmp, 'events.jsonl');
  try {
    fs.writeFileSync(f, '');
    assert.throws(() => runEvents(f, ['--since', 'yesterday']), /must be like 30d/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

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

// ── sweep ───────────────────────────────────────────────────────────────────
//
// Phase 6 replaced `.claude/agents/reader.md` with `ledger sweep`. These tests pin the
// two properties that make it worth running: it reports CURRENT state rather than log
// history, and it never renders "no events" as health.

function runSweep(file, extra = []) {
  const res = { out: '', code: 0 };
  try {
    res.out = execFileSync('node', ['scripts/ledger.mjs', 'sweep', ...extra], {
      cwd: REPO_ROOT, encoding: 'utf8', env: { ...process.env, WARROOM_EVENTS: file },
    });
  } catch (e) {
    res.out = (e.stdout || '') + (e.stderr || '');
    res.code = e.status;
  }
  return res;
}

const sweepJson = (file, extra = []) => JSON.parse(runSweep(file, ['--json', ...extra]).out.trim());

const CANARY = 'c-canary-unresolvable';

test('sweep does NOT report a claim whose last event was a failure but which passes today', () => {
  // The regression that motivated the subcommand. `ledger events` shows the last event per
  // claim, so c-one-risk-classifier still reads "exit 1, expected 0" there long after the
  // claim was fixed. A sweep that inherited that would file resolved problems as live ones,
  // and a report of false alarms is how a reader becomes the mechanism nobody consumes.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-'));
  const f = path.join(tmp, 'events.jsonl');
  try {
    const nowS = Math.floor(Date.now() / 1000);
    fs.writeFileSync(f, [
      // a real, currently-passing repo claim with a stale FAILURE in the log
      JSON.stringify({ ts: nowS - 3600, event: 'claim.would_block', claim: 'c-one-risk-classifier', resolver: 'claim-command', status: 'fail', reason: 'exit 1, expected 0' }),
      JSON.stringify({ ts: nowS - 3600, event: 'claim.would_block', claim: CANARY, resolver: 'claim-freshness', status: 'fail', reason: 'expired' }),
      JSON.stringify({ ts: nowS - 3600, event: 'claim.would_block', claim: CANARY, resolver: 'claim-source', status: 'unresolved', reason: 'dns' }),
    ].join('\n') + '\n');
    const r = sweepJson(f);
    assert.ok(!r.expired.includes('c-one-risk-classifier'),
      'a claim that passes now must not be reported because the log remembers an old failure');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('sweep never files the canary as expired — it is built to fail', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-'));
  const f = path.join(tmp, 'events.jsonl');
  try {
    const nowS = Math.floor(Date.now() / 1000);
    fs.writeFileSync(f, JSON.stringify({ ts: nowS, event: 'claim.would_block', claim: CANARY, resolver: 'claim-freshness', status: 'fail', reason: 'expired' }) + '\n');
    const r = sweepJson(f);
    assert.ok(!r.expired.includes(CANARY), 'the canary expiring is the design, not a finding');
    assert.equal(r.canary_alive, true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('a canary that produced no events is the loudest finding, not a clean run', () => {
  // Only failures are logged, so an empty log LOOKS like everything passed. The canary is
  // the one claim guaranteed to fail every run; its silence means the resolvers are dead.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-'));
  const f = path.join(tmp, 'events.jsonl');
  try {
    fs.writeFileSync(f, '');
    const r = sweepJson(f);
    assert.equal(r.canary_alive, false, 'zero canary events must never read as healthy');
    assert.ok(r.findings > 0);
    const human = runSweep(f);
    assert.match(human.out, /CANARY SILENT/);
    assert.equal(human.code, 1, 'findings must exit non-zero so a scheduled run goes red');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('silence is only a finding for resolvers the canary exercises; the rest are unknown', () => {
  // Rule 10 applied to the sweep. claim-command and claim-judge have no canary, so
  // "no events" cannot distinguish all-passing from not-running. Reporting them as
  // healthy would be the resolver fail-open shape, one layer up.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-'));
  const f = path.join(tmp, 'events.jsonl');
  try {
    const nowS = Math.floor(Date.now() / 1000);
    fs.writeFileSync(f, [
      JSON.stringify({ ts: nowS, event: 'claim.would_block', claim: CANARY, resolver: 'claim-freshness', status: 'fail', reason: 'x' }),
      JSON.stringify({ ts: nowS, event: 'claim.would_block', claim: CANARY, resolver: 'claim-source', status: 'unresolved', reason: 'x' }),
    ].join('\n') + '\n');
    const r = sweepJson(f);
    assert.deepEqual(r.silent_resolvers, [], 'both canary-covered resolvers fired');
    assert.ok(r.silence_unverifiable.includes('claim-command'), 'no canary covers claim-command');
    assert.ok(r.silence_unverifiable.includes('claim-judge'), 'no canary covers claim-judge');
    assert.match(runSweep(f).out, /UNVERIFIABLE/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('a missing log makes the sweep PARTIAL — it does not report zero findings', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-'));
  try {
    const r = sweepJson(path.join(tmp, 'nope.jsonl'));
    assert.equal(r.status, 'PARTIAL');
    assert.equal(r.log_present, false);
    assert.match(runSweep(path.join(tmp, 'nope.jsonl')).out, /run log does not exist/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('sweep writes a stamp on every run, including runs with findings', () => {
  // The stamp records recency, not health. SessionStart warns when it goes stale, so a
  // sweep that skipped the stamp whenever it found something would silence the staleness
  // warning at exactly the moment the ledger needed attention.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-'));
  const f = path.join(tmp, 'events.jsonl');
  try {
    fs.writeFileSync(f, '');
    runSweep(f);
    const stamp = path.join(tmp, 'reader-stamp.json');
    assert.ok(fs.existsSync(stamp), 'stamp must be written next to the log');
    const s = JSON.parse(fs.readFileSync(stamp, 'utf8'));
    assert.ok(s.findings > 0, 'this run had findings');
    assert.ok(s.swept_at, 'stamp carries the time the sweep ran');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('waiverState is the one implementation of the lapse rule, and sweep uses it', () => {
  // The sweep computed this date maths independently for exactly one commit. Two
  // implementations of one rule agree until a leap year and then disagree during the
  // incident they exist to prevent — the argument that gave the repo one risk classifier.
  const live = { disposition: { action: 'waive', until: '2026-09-08', reason: 'r' } };
  const dead = { disposition: { action: 'waive', until: '2026-07-01', reason: 'r' } };
  const bad = { disposition: { action: 'waive', until: 'soon', reason: 'r' } };

  assert.equal(R.waiverState(live, NOW).lapsed, false);
  assert.equal(R.waiverState(live, NOW).days, 29, 'inclusive of the until-date itself');
  assert.equal(R.waiverState(dead, NOW).lapsed, true);
  assert.equal(R.waiverState(dead, NOW).days, 40);
  assert.equal(R.waiverState(bad, NOW).invalid, true, 'an unparseable date is never silently in-force');

  // and the resolver renders that same state
  const f = R.freshness({ ...claim(), ...dead }, { now: NOW });
  assert.equal(f.status, 'fail');
  assert.match(f.reason, /WAIVER LAPSED 40 days ago/);
});

test('an ABSENT log is unknowable, an EMPTY log is a dead resolver — and only one is a finding', () => {
  // Found by running the scheduled-CI path before shipping it. A fresh runner has no log,
  // so the first version filed both canary-covered resolvers as silent and failed the job
  // every single day. A job that is always red is a job nobody reads — the same alarm
  // fatigue that makes an unread report worthless, arriving via the mechanism built to
  // prevent it. The invariant is symmetric: never pass what you could not check, and
  // never fail it either.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-'));
  try {
    const absent = sweepJson(path.join(tmp, 'no-such-log.jsonl'));
    assert.equal(absent.log_present, false);
    assert.equal(absent.status, 'PARTIAL');
    assert.deepEqual(absent.silent_resolvers, [], 'nothing can be silent in a log that does not exist');
    assert.equal(absent.findings, 0, 'CI must not go red for something it could not check');
    assert.equal(runSweep(path.join(tmp, 'no-such-log.jsonl')).code, 0);

    const emptyPath = path.join(tmp, 'events.jsonl');
    fs.writeFileSync(emptyPath, '');
    const empty = sweepJson(emptyPath);
    assert.equal(empty.log_present, true);
    assert.ok(empty.silent_resolvers.length > 0, 'a log that exists and is empty means the resolvers died');
    assert.ok(empty.findings > 0);
    assert.equal(runSweep(emptyPath).code, 1);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
