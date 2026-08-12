// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:hooks`.
//
// scripts/session-start.test.mjs — the SessionStart hook.
//
// WHAT THIS PINS — AND, JUST AS IMPORTANTLY, WHAT IT DOES NOT.
//
// The hook does two jobs from Phase 6: it EMITS the lens and playbook content, and it
// reports when the ledger sweep has stopped running. This file used to say the first job
// made loading "mechanically loaded rather than discretionary". It does not, and this file
// could never have caught that, because **every assertion here is about the hook's stdout,
// never about what a session receives.** Measured 2026-08-12: 25,613 bytes emitted, ~2KB
// inlined, the remainder handed over as a file path — so loading stayed discretionary while
// this suite stayed green. Standing rule 3, and this is the file it was written about.
//
// The payload-size half now lives in c-lenses-and-playbooks-are-loaded, whose evidence runs
// this suite AND checks the emitted size, so it fails until the router fix lands. Do not
// re-add a claim of mechanical loading here; this vantage point cannot see it.
//
// The second job is the one worth testing hardest. A health reporter that silently degrades
// reads exactly like a healthy system — the failure mode this whole phase exists to catch.
// So every branch below is a case where saying nothing would have been indistinguishable
// from saying "all clear", and the hook must say something instead.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOK = path.join(REPO_ROOT, '.claude', 'hooks', 'session-start.js');

// Run the hook with a controlled stamp location. Returns the injected context string
// ('' when the hook emitted nothing at all).
function runHook({ stamp, noRefresh = true } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-'));
  const events = path.join(tmp, 'events.jsonl');
  if (stamp !== undefined) {
    fs.writeFileSync(path.join(tmp, 'reader-stamp.json'), JSON.stringify(stamp));
  }
  const env = { ...process.env, WARROOM_EVENTS: events };
  if (noRefresh) env.AGENTVIBE_HOOK_NO_REFRESH = '1';
  else delete env.AGENTVIBE_HOOK_NO_REFRESH;

  let out = '';
  let code = 0;
  try {
    out = execFileSync('node', [HOOK], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env,
      input: JSON.stringify({ session_id: 'test', hook_event_name: 'SessionStart' }),
    });
  } catch (e) {
    out = e.stdout || '';
    code = e.status;
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  const ctx = out.trim() ? JSON.parse(out).hookSpecificOutput.additionalContext : '';
  return { ctx, code, raw: out };
}

const fresh = (over = {}) => ({
  status: 'COMPLETE',
  swept_at: new Date().toISOString(),
  findings: 0,
  expired: [],
  expiring_soon: [],
  lapsed_waivers: [],
  silent_resolvers: [],
  canary_alive: true,
  ...over,
});

test('the hook emits a SessionStart-shaped payload and never exits non-zero', () => {
  // SessionStart cannot block, so a non-zero exit buys nothing and risks noise on every
  // single session. The hook advises; it does not posture as a gate.
  const { ctx, code } = runHook({ stamp: fresh() });
  assert.equal(code, 0);
  assert.ok(ctx.length > 0);
  const parsed = JSON.parse(runHook({ stamp: fresh() }).raw);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.ok('additionalContext' in parsed.hookSpecificOutput);
});

test('both lens files and every playbook are injected — the mechanical consumer', () => {
  // Phase 6 §0: lenses and playbooks were linted on every PR and loaded by nothing.
  // This test is what makes "loaded" true rather than intended.
  const { ctx } = runHook({ stamp: fresh() });
  assert.match(ctx, /\.claude\/lenses\.yml/);
  assert.match(ctx, /\.claude\/review-lenses\.yml/);

  const playbooks = fs
    .readdirSync(path.join(REPO_ROOT, '.claude', 'playbooks'))
    .filter((f) => f.endsWith('.yml'));
  assert.ok(playbooks.length >= 6, 'expected the six seed playbooks at least');
  for (const p of playbooks) {
    assert.ok(ctx.includes(`.claude/playbooks/${p}`), `${p} must be injected, not assumed`);
  }
});

test('a missing stamp is reported as UNKNOWN state, never as clean', () => {
  const { ctx } = runHook({ stamp: undefined });
  assert.match(ctx, /no stamp could be produced/);
  assert.match(ctx, /UNCHECKED/);
  assert.match(ctx, /unknown state, not clean state/);
});

test('a stamp older than the warn threshold says the sweep has stopped', () => {
  const old = new Date(Date.now() - 100 * 3600 * 1000).toISOString(); // 100h > 72h
  const { ctx } = runHook({ stamp: fresh({ swept_at: old }) });
  assert.match(ctx, /LEDGER SWEEP STALE/);
  assert.match(ctx, /stopped running/);
});

test('a dead canary is surfaced above everything else it would invalidate', () => {
  const { ctx } = runHook({ stamp: fresh({ canary_alive: false }) });
  assert.match(ctx, /CANARY SILENT/);
  assert.match(ctx, /resolvers are not running/);
});

test('findings name the claim ids rather than reporting a count', () => {
  // "3 findings" sends nobody anywhere. The ids are what a disposition is recorded against.
  const { ctx } = runHook({
    stamp: fresh({ findings: 2, lapsed_waivers: ['c-alpha'], expired: ['c-beta'] }),
  });
  assert.match(ctx, /c-alpha/);
  assert.match(ctx, /c-beta/);
  assert.match(ctx, /lapsed waivers/);
});

test('claims expiring soon are surfaced before they expire, not after', () => {
  const { ctx } = runHook({ stamp: fresh({ expiring_soon: ['c-shadow-window-open'] }) });
  assert.match(ctx, /expiring within 14 days/i);
  assert.match(ctx, /c-shadow-window-open/);
});

test('a clean fresh stamp still injects the lenses and adds no alarm', () => {
  const { ctx } = runHook({ stamp: fresh() });
  assert.doesNotMatch(ctx, /STALE|CANARY SILENT|need a disposition/);
  assert.match(ctx, /Lenses and playbooks/);
});
