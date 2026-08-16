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

// ── build --check is coupled to what claims SAY, not to where they sit ──────
//
// `.claude/ledger/index.json` used to carry a `source_line` per claim. Inserting one
// sentence into the prose of mission-control/README.md moved four claims from 295 to 296
// and failed CI with every claim byte-identical — a build failure for an edit that changed
// no claim. The remedy on offer was "remember to rebuild", and it failed the first time it
// was relied on, hours after someone had warned about it.
//
// These tests run against a THROWAWAY git repo built in tmpdir, so a mutation is a real
// file edit through the real CLI and never touches this repository. Every mutation asserts
// that it landed before its verdict is believed: an edit whose anchor missed is
// indistinguishable from a guard that works, and the second reads as good news.

const FENCE = '`'.repeat(3);

function scratchClaim(over = {}) {
  const c = {
    id: 'c-scratch-one', assert: 'the first scratch claim', kind: 'behavior',
    scope: 'project', verified_by: 'command', evidence: '{cmd: "true", expect_exit: 0}',
    valid_until: '2027-01-01', confidence: '0.9', ...over,
  };
  return [
    `  - id: ${c.id}`,
    `    assert: "${c.assert}"`,
    `    kind: ${c.kind}`,
    `    scope: ${c.scope}`,
    `    verified_by: ${c.verified_by}`,
    `    evidence: ${c.evidence}`,
    `    valid_until: ${c.valid_until}`,
    `    confidence: ${c.confidence}`,
  ].join('\n');
}

function scratchDoc(claims = [scratchClaim()]) {
  return ['# Scratch artifact', '', 'Prose that sits above the claims.', '',
    `${FENCE}claims`, 'claims:', ...claims, FENCE, ''].join('\n');
}

/** A throwaway repo holding one artifact and a copy of the ledger. Caller removes it. */
function scratchRepo(doc = scratchDoc()) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-idx-'));
  fs.mkdirSync(path.join(dir, 'scripts', 'lib'), { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, 'scripts', 'ledger.mjs'), path.join(dir, 'scripts', 'ledger.mjs'));
  for (const f of ['claims.js', 'classifier.js', 'resolvers.js']) {
    fs.copyFileSync(path.join(REPO_ROOT, 'scripts', 'lib', f), path.join(dir, 'scripts', 'lib', f));
  }
  fs.writeFileSync(path.join(dir, 'doc.md'), doc);
  // The index is built from `git ls-files`, so there must be a repository for it to list.
  execFileSync('git', ['init', '-q'], { cwd: dir, stdio: 'pipe' });
  return dir;
}

function ledger(dir, ...args) {
  try {
    const out = execFileSync('node', [path.join(dir, 'scripts', 'ledger.mjs'), ...args],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { exit: 0, out };
  } catch (e) {
    return { exit: e.status, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

/** Edit a file and REFUSE to continue unless the edit changed it. */
function mustEdit(file, from, to) {
  const before = fs.readFileSync(file, 'utf8');
  assert.ok(before.includes(from), `mutation anchor not found — the test would prove nothing: ${from}`);
  const after = before.replace(from, to);
  assert.notEqual(after, before, 'mutation was a no-op — the test would prove nothing');
  fs.writeFileSync(file, after);
  assert.equal(fs.readFileSync(file, 'utf8'), after, 'mutation did not reach disk');
}

test('a prose edit above a claim does not fail the check — the index holds no positions', () => {
  const dir = scratchRepo();
  try {
    assert.equal(ledger(dir, 'build').exit, 0);
    const doc = path.join(dir, 'doc.md');
    const fenceLine = (t) => t.split('\n').findIndex((l) => l.trim() === `${FENCE}claims`) + 1;
    const was = fenceLine(fs.readFileSync(doc, 'utf8'));

    mustEdit(doc, 'Prose that sits above the claims.',
      'Prose that sits above the claims.\n\nA second paragraph, added later.\n\nAnd a third.');

    // Without this the test could pass while proving nothing: an edit BELOW the claims
    // would not shift them, and the check would be green for the wrong reason.
    const now = fenceLine(fs.readFileSync(doc, 'utf8'));
    assert.ok(now > was, `the edit must actually move the claims (${was} -> ${now})`);

    const r = ledger(dir, 'build', '--check');
    assert.equal(r.exit, 0, `a documentation edit must not fail the ledger:\n${r.out}`);
    assert.match(r.out, /index matches/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

for (const [field, from, to] of [
  ['assert', 'assert: "the first scratch claim"', 'assert: "the first scratch claim, reworded"'],
  ['valid_until', 'valid_until: 2027-01-01', 'valid_until: 2028-01-01'],
  ['evidence.cmd', 'cmd: "true"', 'cmd: "false"'],
  ['evidence.expect_exit', 'expect_exit: 0', 'expect_exit: 1'],
  ['kind', 'kind: behavior', 'kind: internal-fact'],
  ['scope', 'scope: project', 'scope: task'],
  ['confidence', 'confidence: 0.9', 'confidence: 0.4'],
]) {
  test(`changing a claim's ${field} fails the check, and the message names the claim and the field`, () => {
    const dir = scratchRepo();
    try {
      assert.equal(ledger(dir, 'build').exit, 0);
      mustEdit(path.join(dir, 'doc.md'), from, to);
      const r = ledger(dir, 'build', '--check');
      assert.equal(r.exit, 1, `mutating ${field} must fail the check:\n${r.out}`);
      assert.match(r.out, /c-scratch-one/, 'the message must name the claim');
      assert.match(r.out, new RegExp(field.replace('.', '\\.')), 'the message must name the field');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('an added claim and a removed claim are each named, and neither is confused for the other', () => {
  const dir = scratchRepo(scratchDoc([scratchClaim(), scratchClaim({ id: 'c-scratch-two' })]));
  try {
    assert.equal(ledger(dir, 'build').exit, 0);
    const doc = path.join(dir, 'doc.md');
    const both = fs.readFileSync(doc, 'utf8');

    mustEdit(doc, '  - id: c-scratch-two', '  - id: c-scratch-three');
    const swapped = ledger(dir, 'build', '--check');
    assert.equal(swapped.exit, 1);
    assert.match(swapped.out, /\+ c-scratch-three — in the artifacts, missing from the index/);
    assert.match(swapped.out, /- c-scratch-two — in the index, no longer in any artifact/);

    fs.writeFileSync(doc, both.replace(scratchClaim({ id: 'c-scratch-two' }), '').replace(/\n\n+/g, '\n'));
    const removed = ledger(dir, 'build', '--check');
    assert.equal(removed.exit, 1);
    assert.match(removed.out, /- c-scratch-two/);
    assert.doesNotMatch(removed.out, /\+ /, 'nothing was added; the message must not say otherwise');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the failure message never offers a byte count as evidence', () => {
  // The old message printed `on disk: 19749 bytes · regenerated: 19749 bytes` — the same
  // number twice, because a claim shifting one line rewrites 295 as 296 and that is the
  // same width. A diagnostic that cannot discriminate is worse than none: it occupies the
  // place a reader looks for evidence. sha256 is printed instead, and cannot be equal.
  const dir = scratchRepo();
  try {
    assert.equal(ledger(dir, 'build').exit, 0);
    mustEdit(path.join(dir, 'doc.md'), 'assert: "the first scratch claim"', 'assert: "changed"');
    const r = ledger(dir, 'build', '--check');
    assert.equal(r.exit, 1);
    assert.doesNotMatch(r.out, /\d+ bytes/, 'a byte count is equal on both sides for most edits');
    const shas = [...r.out.matchAll(/sha256 \w+:\s+([0-9a-f]{64})/g)].map((m) => m[1]);
    assert.equal(shas.length, 2, 'both sides must be anchored');
    assert.notEqual(shas[0], shas[1], 'two files that differ cannot share a sha256');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('an index that differs only in formatting says so, instead of blaming the claims', () => {
  const dir = scratchRepo();
  try {
    assert.equal(ledger(dir, 'build').exit, 0);
    const idx = path.join(dir, '.claude', 'ledger', 'index.json');
    mustEdit(idx, '"version": 1', '"version":  1');
    const r = ledger(dir, 'build', '--check');
    assert.equal(r.exit, 1);
    assert.match(r.out, /every claim is identical/);
    assert.match(r.out, /first difference at byte \d+/);
    assert.doesNotMatch(r.out, /c-scratch-one/, 'no claim changed, so no claim may be named');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a truncated index is reported as unparseable, not as a claim that changed', () => {
  const dir = scratchRepo();
  try {
    assert.equal(ledger(dir, 'build').exit, 0);
    const idx = path.join(dir, '.claude', 'ledger', 'index.json');
    fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8').slice(0, 120));
    const r = ledger(dir, 'build', '--check');
    assert.equal(r.exit, 1);
    assert.match(r.out, /not valid JSON/);
    assert.match(r.out, /hand-edited or truncated/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the committed index records no positions at all', () => {
  const raw = fs.readFileSync(path.join(REPO_ROOT, '.claude', 'ledger', 'index.json'), 'utf8');
  assert.doesNotMatch(raw, /source_line/, 'a position in the index re-couples the check to where claims sit');
  for (const c of JSON.parse(raw).claims) {
    assert.equal(c.source_line, undefined, `${c.id} carries a position`);
    assert.ok(c.source_file, `${c.id} must still say which artifact it lives in`);
  }
});

// ── locate, over BOTH scopes ────────────────────────────────────────────────
//
// The first version of this test asserted `/^docs\/06-codebase\/ledger-canary\.md:\d+$/`.
// The project path was baked into the regex, so no global claim could ever enter the
// sample — and `locate` was printing `~/.warroom/ledger/global.yml:0` for all four of
// them, a number nobody measured, inside the change whose whole argument is against
// exactly that. The assertion underneath it was the right one; it was aimed at the only
// ground where it already held.
//
// That is not the empty-sample defect. The sample was not empty — it was drawn entirely
// from the region where the property is true. Same family as the selector defect in
// views.test.tsx (rows picked by the content under test); different mechanism.
//
// So: the global ledger is INJECTED, via WARROOM_GLOBAL_LEDGER.
//
// THE REAL LEDGER CANNOT SERVE THIS TEST, in either direction. Its contents differ per
// machine, so there is no known line to expect — and on a runner with no
// ~/.warroom/ledger/global.yml there are no global claims at all. Measured:
// `HOME=<empty> ledger locate` lists 33 claims where this machine lists 37. A test that
// exercised globals against the real file would iterate an empty set in CI and pass. That
// is the empty-sample defect, and it would have landed inside the fix for the sampling
// defect — a fourth variant of the same family, in the same change.
//
// $HOME would also have worked, and is not what this uses: eventsPath() resolves through
// os.homedir() too, so moving HOME to reach the ledger silently moves the run log with it.
// One knob, one thing.

// Line numbers are asserted as EXACT VALUES against this literal, not as /\d+/. "Matches a
// number" is the assertion shape that let `:0` through for four claims — 0 is a number.
const G_LINE = { 'c-fixture-alpha': 4, 'c-fixture-beta': 13 };
const GLOBAL_FIXTURE = [
  '# a fixture global ledger',                                      // 1
  '',                                                               // 2
  'claims:',                                                        // 3
  '  - id: c-fixture-alpha',                                        // 4
  '    assert: "the first fixture claim"',                          // 5
  '    kind: runtime-capability',                                   // 6
  '    scope: global',                                              // 7
  '    verified_by: command',                                       // 8
  '    evidence: {cmd: "true", expect_exit: 0}',                    // 9
  '    valid_until: 2027-01-01',                                    // 10
  '    confidence: 1',                                              // 11
  '',                                                               // 12
  '  - id: c-fixture-beta',                                         // 13
  '    assert: "the second fixture claim"',                         // 14
  '    kind: runtime-capability',                                   // 15
  '    scope: global',                                              // 16
  '    verified_by: command',                                       // 17
  '    evidence: {cmd: "true", expect_exit: 0}',                    // 18
  '    valid_until: 2027-01-01',                                    // 19
  '    confidence: 1',                                              // 20
  '',                                                               // 21
].join('\n');

// The map above is a second statement of the same fact as the fixture, and two statements
// of one fact drift. This checks them against each other before any test uses either.
test('the global fixture really puts its claims where the expectation map says', () => {
  const lines = GLOBAL_FIXTURE.split('\n');
  for (const [id, n] of Object.entries(G_LINE)) {
    assert.equal(lines[n - 1], `  - id: ${id}`, `G_LINE says ${id} is at ${n}; the fixture disagrees`);
  }
});

function withGlobalLedger(body, yaml = GLOBAL_FIXTURE) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wr-global-'));
  const ledger = path.join(dir, 'global.yml');
  try {
    fs.writeFileSync(ledger, yaml);
    const run = (...args) => execFileSync('node', ['scripts/ledger.mjs', ...args],
      { cwd: REPO_ROOT, encoding: 'utf8', env: { ...process.env, WARROOM_GLOBAL_LEDGER: ledger } });
    return body(run, ledger);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('the injected ledger is the one being read — the seam is real, not assumed', () => {
  // A claim that exists in no other file on this machine. If it comes back, the override
  // took effect; without this, every global assertion below could be reading the real
  // ledger and nobody would know.
  withGlobalLedger((run, ledger) => {
    assert.equal(run('locate', 'c-fixture-alpha').trim(), `${ledger}:4`);
    // And the label is the real path, not the tilde form — an override rendered as
    // `~/.warroom/ledger/global.yml` would name a file it did not read.
    assert.doesNotMatch(run('locate'), /~\/\.warroom/);
  });
});

test('locate points at a real line for EVERY claim it prints, in both scopes', () => {
  withGlobalLedger((run, ledger) => {
    const out = run('locate');
    const rows = out.split('\n').filter((l) => /\s{2}c-/.test(l));

    let project = 0;
    const globalsSeen = [];
    for (const row of rows) {
      const [loc, id] = row.trim().split(/\s{2,}/);
      const m = loc.match(/^(.*):(\d+)$/);
      assert.ok(m, `${id}: printed no position — this test is for rows that claim one (${loc})`);
      const [, file, lineNo] = m;
      assert.notEqual(lineNo, '0', `${id}: ":0" is a placeholder, not a position`);

      if (file === ledger) {
        // Global: the EXACT line the fixture wrote, not merely some number. `/\d+/` would
        // have accepted `:0`, which is how four claims shipped a position nobody measured.
        assert.equal(Number(lineNo), G_LINE[id], `${id}: expected line ${G_LINE[id]}, got ${lineNo}`);
        assert.equal(GLOBAL_FIXTURE.split('\n')[Number(lineNo) - 1], `  - id: ${id}`);
        globalsSeen.push(id);
      } else {
        // Project: the head of the block the claim lives in. There is no known-good line to
        // hardcode across 33 claims in a moving repo, so the line is resolved back into the
        // artifact and must open a claim block — a stronger check than any fixed number.
        const src = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
        const line = src.split('\n')[Number(lineNo) - 1];
        assert.ok(line !== undefined, `${id}: line ${lineNo} is past the end of ${file}`);
        assert.equal(line.trim(), 'claims:', `${id}: project position must open a claim block`);
        project++;
      }
    }

    // Both halves non-empty, or this test is the defect it was written to catch.
    assert.ok(project > 0, 'no project claim was sampled');
    assert.deepEqual(globalsSeen.sort(), Object.keys(G_LINE).sort(),
      'every fixture global must be sampled — a hardcoded project path is how this went wrong');
  });
});

test('locate prints the file alone when a position cannot be measured — never a 0', () => {
  // Two entries share an id, so the position is ambiguous and globalClaimLine() refuses to
  // return the first of two guesses. The row must then carry no number at all: `:0`, `:?`
  // and `:-` are all a character standing in for a measurement.
  const ambiguous = GLOBAL_FIXTURE.replace('  - id: c-fixture-beta', '  - id: c-fixture-alpha');
  withGlobalLedger((run, ledger) => {
    const out = run('locate');
    const rows = out.split('\n').filter((l) => l.includes(ledger));
    // Asserting "no number" over an empty set would be the empty-sample defect wearing
    // this option's clothes, so the sample is proven non-empty first: two entries share
    // the id, and both must be listed.
    assert.equal(rows.length, 2, 'both ambiguous entries must be listed');
    for (const r of rows) {
      assert.doesNotMatch(r, /:\d+/, `an unmeasurable position must print no number: ${r.trim()}`);
      assert.match(r, /global\.yml\s{2,}c-fixture-alpha/, 'the file must still be named');
    }
    // And the single-id lookup takes the same path.
    assert.equal(run('locate', 'c-fixture-alpha').trim(), ledger);

    // THE FOOTER'S SECOND BRANCH, asserted here because this is the only state that
    // produces it. The other footer test runs over a fixture where everything is
    // measurable, so it only ever reached the first branch — the branch that exists
    // precisely to report unmeasured positions was read by no test at all, and corrupting
    // its arithmetic to `unlocated + 99` left the suite green over a footer whose own two
    // numbers did not add up.
    const all = out.split('\n').filter((l) => /\s{2}c-/.test(l));
    const withPos = all.filter((l) => /:\d+\s{2,}c-/.test(l)).length;
    const unmeasured = all.length - withPos;
    assert.equal(unmeasured, 2, 'the two ambiguous rows are the unmeasured ones');
    assert.match(out, new RegExp(`${all.length} claims · ${withPos} with a position resolved`));
    assert.match(out, new RegExp(`${unmeasured} whose position could not be measured`));
    assert.doesNotMatch(out, /none recorded, none guessed/, 'that line is only true when nothing is unmeasured');
    // The two counts must reconcile against the total they are printed under — the
    // corrupted arithmetic was self-contradictory on its face and nothing read it.
    const m = out.match(/(\d+) claims · (\d+) with a position resolved[^·]*· (\d+) whose position/);
    assert.ok(m, 'the footer must state all three numbers');
    assert.equal(Number(m[2]) + Number(m[3]), Number(m[1]), `${m[2]} + ${m[3]} ≠ ${m[1]}`);
  }, ambiguous);
});

test('the locate footer is true of every row it is printed over', () => {
  withGlobalLedger((run) => {
    const out = run('locate');
    const rows = out.split('\n').filter((l) => /\s{2}c-/.test(l));
    const withPos = rows.filter((l) => /:\d+\s{2,}c-/.test(l)).length;
    // The footer used to assert "positions are resolved from the artifacts on this run"
    // over four rows whose position was neither resolved nor recorded. Its counts must now
    // reconcile against the listing above it.
    assert.match(out, new RegExp(`${rows.length} claims · ${withPos} with a position resolved`));
    assert.equal(withPos, rows.length, 'every row here is measurable, so none may be reported otherwise');
    assert.match(out, /none recorded, none guessed/);
  });
});

test('locate refuses an unknown id rather than printing nothing and passing', () => {
  assert.throws(() => execFileSync('node', ['scripts/ledger.mjs', 'locate', 'c-no-such-claim'],
    { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe' }), /Command failed/);
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

// ── #57 · the blind spot the sweep did not declare ──────────────────────────
//
// `verify` reported an absent global ledger; `sweep` printed a bare total instead. Same
// repo, same commit, only HOME differing — 35 claims read as 31 and nothing said so. The
// silence was worse for the company it kept: the sweep spends a paragraph distinguishing
// "no log" from "no events", and a tool that declares some of its blind spots teaches you
// it declares all of them.
//
// Both directions are asserted. The message must appear when the ledger is absent, and it
// must NOT appear when it is there — an unconditional notice becomes noise and gets read
// past, which is how the run-log message would have failed if it were unconditional.

/** Run a command with both seams injected. Neither writes repo or ~/.agentvibe state. */
function runLedgerEnv(env, args) {
  try {
    return { code: 0, out: execFileSync('node', ['scripts/ledger.mjs', ...args],
      { cwd: REPO_ROOT, encoding: 'utf8', env: { ...process.env, ...env } }) };
  } catch (e) {
    return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

/** The sentence `verify` and `sweep` must both print, with the path left out. */
const ABSENCE_TAIL = 'not present on this machine — 0 global claims checked (this is reported, not skipped silently)';

test('sweep declares an absent global ledger in the same sentence verify already used', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-glob-'));
  try {
    const env = {
      WARROOM_EVENTS: path.join(tmp, 'events.jsonl'),
      WARROOM_GLOBAL_LEDGER: path.join(tmp, 'no-such-global.yml'),
    };
    const sweep = runLedgerEnv(env, ['sweep', '--since', '30d']);
    const verify = runLedgerEnv(env, ['verify', '--offline', '--no-exec']);

    // The point of the fix: the two must not diverge again, so the assertion is that they
    // print the SAME sentence rather than that each prints something about absence.
    assert.ok(sweep.out.includes(ABSENCE_TAIL), `sweep did not declare the absence:\n${sweep.out}`);
    assert.ok(verify.out.includes(ABSENCE_TAIL), 'verify must keep saying it — this is the wording being shared');

    // And the count is no longer bare. `31 claims` reads exactly like `35 claims`.
    assert.match(sweep.out, /\d+ claims \(\d+ project · 0 global\)/, 'the total must split by scope');
    assert.match(sweep.out, /global ledger ABSENT/);

    const r = JSON.parse(runLedgerEnv(env, ['sweep', '--json']).out.trim());
    assert.equal(r.global_ledger_present, false);
    assert.equal(r.global_claims_checked, 0);
    assert.equal(r.claims_checked, r.project_claims_checked, 'with no global ledger the total IS the project count');
    assert.equal(r.status, 'PARTIAL', 'a sweep that saw one scope of two is not COMPLETE');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('the absence notice does NOT appear when a global ledger is there — or it is noise', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-glob-'));
  try {
    const ledger = path.join(tmp, 'global.yml');
    fs.writeFileSync(ledger, GLOBAL_FIXTURE);
    const env = { WARROOM_EVENTS: path.join(tmp, 'events.jsonl'), WARROOM_GLOBAL_LEDGER: ledger };
    const out = runLedgerEnv(env, ['sweep', '--since', '30d']).out;

    assert.ok(!out.includes(ABSENCE_TAIL), `the notice fired over a ledger that exists:\n${out}`);
    assert.doesNotMatch(out, /global ledger ABSENT/);
    // Proven non-empty: the fixture's two claims must actually be in the count, or this
    // test would pass over a run that read no global ledger at all.
    assert.match(out, /claims \(\d+ project · 2 global\)/, 'the fixture globals must be counted');

    const r = JSON.parse(runLedgerEnv(env, ['sweep', '--json']).out.trim());
    assert.equal(r.global_ledger_present, true);
    assert.equal(r.global_claims_checked, 2);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('an absent global ledger is declared, never counted as a finding', () => {
  // Symmetric with the run log, for the same reason: on a fresh runner neither file exists,
  // so a finding would make the scheduled job red every single day, and a job that is
  // always red is a job nobody reads. Never pass what you could not check, never fail it.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-glob-'));
  try {
    const env = {
      WARROOM_EVENTS: path.join(tmp, 'events.jsonl'),
      WARROOM_GLOBAL_LEDGER: path.join(tmp, 'no-such-global.yml'),
    };
    const r = JSON.parse(runLedgerEnv(env, ['sweep', '--json']).out.trim());
    assert.equal(r.findings, 0, 'CI must not go red for a file it was never going to have');
    assert.equal(runLedgerEnv(env, ['sweep']).code, 0);
    // The tail must name BOTH things it could not see. Naming only the log is what read as
    // a complete account of the blind spots while a whole scope was missing from the total.
    const out = runLedgerEnv(env, ['sweep']).out;
    assert.match(out, /NOT checked: resolver liveness \(no run log\); global claims \(no /);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('a lapsed waiver on a GLOBAL claim is a finding — this is what the silence hid', () => {
  // The consequence issue #57 is actually about. Rule 9's automation is ledger-sweep.yml,
  // whose failure message says "a lapsed waiver fails harder than no disposition" — and
  // that held for project claims only, because the global ones were not in the set.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-glob-'));
  try {
    const lapsed = GLOBAL_FIXTURE.replace(
      '    confidence: 1\n\n  - id: c-fixture-beta',
      '    confidence: 1\n    disposition: {action: waive, until: 2026-01-01, reason: "meant to revisit"}\n\n  - id: c-fixture-beta',
    );
    assert.notEqual(lapsed, GLOBAL_FIXTURE, 'the fixture edit missed — the test would prove nothing');
    const ledger = path.join(tmp, 'global.yml');
    fs.writeFileSync(ledger, lapsed);
    const env = { WARROOM_EVENTS: path.join(tmp, 'events.jsonl'), WARROOM_GLOBAL_LEDGER: ledger };

    const seen = JSON.parse(runLedgerEnv(env, ['sweep', '--json']).out.trim());
    assert.ok(seen.lapsed_waivers.includes('c-fixture-alpha'),
      `a lapsed global waiver must be found when the ledger can be read: ${JSON.stringify(seen.lapsed_waivers)}`);

    // And with no global ledger the same claim is simply not in the set — which is exactly
    // why the absence has to be declared rather than printed as a smaller total.
    const blind = JSON.parse(runLedgerEnv(
      { ...env, WARROOM_GLOBAL_LEDGER: path.join(tmp, 'gone.yml') }, ['sweep', '--json']).out.trim());
    assert.deepEqual(blind.lapsed_waivers, [], 'nothing catches it — and the report now says so');
    assert.equal(blind.global_ledger_present, false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ── #58 · two claims at one address ─────────────────────────────────────────
//
// The project path refuses a duplicate id and names both files. The global path did not,
// because `validateClaim` is a CLOSED schema applied per entry, and a closed per-entry
// schema cannot see a collision BETWEEN entries. `globalClaimLine` had already MEASURED
// the duplicate and returned null — the information needed to report it was thrown away
// one line before it was needed.

test('the global ledger refuses a duplicate id, and names both lines', () => {
  const dup = GLOBAL_FIXTURE.replace('  - id: c-fixture-beta', '  - id: c-fixture-alpha');
  assert.notEqual(dup, GLOBAL_FIXTURE, 'the fixture edit missed — the test would prove nothing');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dup-'));
  try {
    const ledger = path.join(tmp, 'global.yml');
    fs.writeFileSync(ledger, dup);
    const r = runLedgerEnv({ WARROOM_GLOBAL_LEDGER: ledger }, ['lint']);
    assert.equal(r.code, 1, `lint must fail on a duplicate id:\n${r.out}`);
    assert.match(r.out, /duplicate claim id "c-fixture-alpha"/);
    // Both LINES, not "a duplicate exists" — the two entries are in one file, so a file
    // name would not tell anyone which entries to look at. G_LINE is the same literal the
    // locate tests check the fixture against, so these numbers cannot drift from it.
    assert.match(r.out, new RegExp(`entries at lines ${G_LINE['c-fixture-alpha']} and ${G_LINE['c-fixture-beta']}`));

    // The negative: the untouched fixture has no collision and must not be reported.
    fs.writeFileSync(ledger, GLOBAL_FIXTURE);
    assert.doesNotMatch(runLedgerEnv({ WARROOM_GLOBAL_LEDGER: ledger }, ['lint']).out, /duplicate claim id/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('a duplicate is reported even when one of the two also fails its schema', () => {
  // Counted over the RAW entries rather than the validated ones. Otherwise the louder
  // problem hides the quieter one — and the quieter one is the one nothing else catches.
  // Edited by line, with the anchors asserted, because a near-miss here produces a YAML
  // that fails to PARSE — and a parse error is a different failure that would have made
  // this test pass for the wrong reason.
  const lines = GLOBAL_FIXTURE.split('\n');
  const idIdx = G_LINE['c-fixture-beta'] - 1;
  const kindIdx = idIdx + 2;
  assert.equal(lines[idIdx], '  - id: c-fixture-beta');
  assert.equal(lines[kindIdx], '    kind: runtime-capability');
  lines[idIdx] = '  - id: c-fixture-alpha';   // the collision
  lines[kindIdx] = '    kind: not-a-kind';    // and a schema failure on the same entry
  const broken = lines.join('\n');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dup-'));
  try {
    const ledger = path.join(tmp, 'global.yml');
    fs.writeFileSync(ledger, broken);
    const r = runLedgerEnv({ WARROOM_GLOBAL_LEDGER: ledger }, ['lint']);
    assert.equal(r.code, 1, `expected a lint failure, not a crash:\n${r.out}`);
    assert.match(r.out, /kind must be one of/, 'the schema failure must still be reported');
    assert.match(r.out, /duplicate claim id "c-fixture-alpha"/, 'and it must not swallow the collision');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

