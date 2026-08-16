// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:budget`.
//
// scripts/usage.test.mjs — the spend measurement and the ceiling that acts on it.
//
// Every transcript below is constructed. A test that reads this machine's real usage passes
// or fails for reasons the test did not choose, and would behave differently in CI, where
// ~/.claude/projects does not exist at all.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const U = require('./lib/usage.js');

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GUARD = path.join(REPO_ROOT, '.claude', 'hooks', 'budget-guard.js');
const HOUR = 3600 * 1000;

// Build a projects dir holding one transcript of turns at given (hoursAgo, outputTokens).
function makeProjects(turns, now = Date.now()) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'usage-'));
  const proj = path.join(dir, 'projects', 'someproject');
  fs.mkdirSync(proj, { recursive: true });
  const lines = turns.map(([hoursAgo, out]) =>
    JSON.stringify({
      type: 'assistant',
      timestamp: new Date(now - hoursAgo * HOUR).toISOString(),
      message: { usage: { input_tokens: 1, output_tokens: out, cache_read_input_tokens: 999 } },
    })
  );
  fs.writeFileSync(path.join(proj, 'a.jsonl'), lines.join('\n') + '\n');
  return { dir, projects: path.join(dir, 'projects'), cache: path.join(dir, 'cache.json') };
}

test('the window counts output tokens inside it and ignores everything older', () => {
  const now = Date.now();
  const { dir, projects, cache } = makeProjects([[1, 100], [4, 200], [6, 5000], [30, 9999]], now);
  try {
    const r = U.windowUsage({ now, projectsDir: projects, cachePath: cache, windowHours: 5 });
    assert.equal(r.output_tokens, 300, 'only the 1h and 4h turns are inside a 5h window');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cache reads and cold reads agree — the incremental path is not a different answer', () => {
  // The optimisation that made this usable (skip files whose mtime predates the horizon)
  // is only safe because transcripts are append-only. If that assumption ever breaks, this
  // is the test that catches it: a fast wrong number is worse than a slow right one.
  const now = Date.now();
  const { dir, projects, cache } = makeProjects([[1, 100], [2, 250]], now);
  try {
    const cold = U.windowUsage({ now, projectsDir: projects, cachePath: cache, noCache: true });
    U.windowUsage({ now, projectsDir: projects, cachePath: cache });
    const warm = U.windowUsage({ now, projectsDir: projects, cachePath: cache });
    assert.equal(warm.output_tokens, cold.output_tokens);
    assert.equal(warm.bytesRead, 0, 'an unchanged file must not be re-read at all');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('turns appended after a cached read are picked up', () => {
  const now = Date.now();
  const { dir, projects, cache } = makeProjects([[1, 100]], now);
  try {
    const first = U.windowUsage({ now, projectsDir: projects, cachePath: cache });
    assert.equal(first.output_tokens, 100);
    fs.appendFileSync(
      path.join(projects, 'someproject', 'a.jsonl'),
      JSON.stringify({
        timestamp: new Date(now).toISOString(),
        message: { usage: { output_tokens: 400 } },
      }) + '\n'
    );
    const second = U.windowUsage({ now, projectsDir: projects, cachePath: cache });
    assert.equal(second.output_tokens, 500, 'appended usage must be counted, not cached away');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a budget event does NOT count as a durable artifact', () => {
  // The self-referential bug this pins: lastArtifactAt originally used the event log's
  // MTIME, and the budget guard appends to that same log. Every budget line — including a
  // warning — then looked like a fresh artifact and reset the stall clock, so the guard
  // zeroed the counter it exists to measure and the stall ceiling could never fire.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-'));
  const ev = path.join(dir, 'events.jsonl');
  try {
    const oldClaim = Math.floor(Date.now() / 1000) - 7200;
    fs.writeFileSync(ev, JSON.stringify({ ts: oldClaim, event: 'claim.would_block', claim: 'c-x' }) + '\n');
    const before = U.lastArtifactAt({ repoRoot: dir, eventsPath: ev });
    assert.equal(before.kind, 'claim-event');

    fs.appendFileSync(ev, JSON.stringify({ ts: Math.floor(Date.now() / 1000), event: 'budget.block' }) + '\n');
    const after = U.lastArtifactAt({ repoRoot: dir, eventsPath: ev });
    assert.equal(after.kind, 'claim-event');
    assert.equal(after.t, before.t, 'a budget event must not move the artifact clock forward');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── the guard ───────────────────────────────────────────────────────────────

function runGuard(payload, env = {}, projects) {
  const res = { code: 0, err: '' };
  try {
    execFileSync('node', [GUARD], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      input: JSON.stringify(payload),
      env: { ...process.env, AGENTVIBE_PROJECTS_DIR: projects, ...env },
    });
  } catch (e) {
    res.code = e.status;
    res.err = e.stderr || '';
  }
  return res;
}

test('under every ceiling the guard is silent and allows the call', () => {
  const { dir, projects } = makeProjects([[1, 100]]);
  try {
    const r = runGuard({ tool_name: 'Write', tool_input: { file_path: 'src/a.ts' }, session_id: 's' }, {}, projects);
    assert.equal(r.code, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('over the window ceiling a non-safelisted call is BLOCKED with a named reason', () => {
  const { dir, projects } = makeProjects([[1, 5000]]);
  try {
    const r = runGuard(
      { tool_name: 'Write', tool_input: { file_path: 'src/a.ts' }, session_id: 's' },
      { AGENTVIBE_WINDOW_BLOCK: '100' },
      projects
    );
    assert.equal(r.code, 2, 'exit 2 is what actually denies the call');
    assert.match(r.err, /BUDGET CEILING REACHED/);
    assert.match(r.err, /rolling 5h window/, 'the reason must name which ceiling and the number');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('at the ceiling, work can still be LANDED — git and the session file are allowed', () => {
  // Without this, a session at the ceiling cannot commit, cannot write its session file, and
  // fails the documentation gate for a reason the work did not cause. The budget would create
  // exactly the loss it exists to prevent.
  const { dir, projects } = makeProjects([[1, 5000]]);
  const env = { AGENTVIBE_WINDOW_BLOCK: '100' };
  try {
    assert.equal(runGuard({ tool_name: 'Bash', tool_input: { command: 'git commit -m x' } }, env, projects).code, 0);
    assert.equal(runGuard({ tool_name: 'Bash', tool_input: { command: 'git push' } }, env, projects).code, 0);
    assert.equal(runGuard({ tool_name: 'Bash', tool_input: { command: 'npm run check' } }, env, projects).code, 0);
    assert.equal(
      runGuard({ tool_name: 'Write', tool_input: { file_path: 'docs/08-agents_work/sessions/x.md' } }, env, projects).code,
      0
    );
    // and the thing it must still stop
    assert.equal(runGuard({ tool_name: 'Bash', tool_input: { command: 'rm -rf build' } }, env, projects).code, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('an override requires a reason and is recorded, never silent', () => {
  const { dir, projects } = makeProjects([[1, 5000]]);
  const ev = path.join(dir, 'events.jsonl');
  try {
    const r = runGuard(
      { tool_name: 'Write', tool_input: { file_path: 'src/a.ts' } },
      { AGENTVIBE_WINDOW_BLOCK: '100', AGENTVIBE_BUDGET_OVERRIDE: 'finishing the migration', WARROOM_EVENTS: ev },
      projects
    );
    assert.equal(r.code, 0, 'an override allows the call');
    const lines = fs.readFileSync(ev, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const o = lines.find((x) => x.event === 'budget.override');
    assert.ok(o, 'the override must be written to the event log');
    assert.equal(o.reason_given, 'finishing the migration');
    assert.ok(o.window_output > 0, 'the numbers at the moment of override are recorded with it');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a block is recorded with the numbers that caused it', () => {
  const { dir, projects } = makeProjects([[1, 5000]]);
  const ev = path.join(dir, 'events.jsonl');
  try {
    runGuard(
      { tool_name: 'Write', tool_input: { file_path: 'src/a.ts' } },
      { AGENTVIBE_WINDOW_BLOCK: '100', WARROOM_EVENTS: ev },
      projects
    );
    const lines = fs.readFileSync(ev, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const b = lines.find((x) => x.event === 'budget.block');
    assert.ok(b);
    assert.equal(b.kind, 'window');
    assert.ok(b.window_output >= 5000);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the guard fails OPEN on internal error, and says so rather than dying quietly', () => {
  // A budget that bricks a session when its own arithmetic throws costs more than the
  // overspend it prevents. But an announced fail-open and a silent one are different things,
  // and this repo has been burned by the silent kind.
  const r = runGuard(
    { tool_name: 'Write', tool_input: { file_path: 'src/a.ts' } },
    { AGENTVIBE_WINDOW_BLOCK: 'not-a-number', AGENTVIBE_PROJECTS_DIR: '/nonexistent-path-xyz' },
    '/nonexistent-path-xyz'
  );
  assert.equal(r.code, 0, 'a broken guard must not block the session');
});

// ── stop_reason: the field that answers what actually ends a run ──────────────────────────
// `maxTurns` was measured not to bind (196 of 269 reviewer runs exceeded a cap of 20, max 68),
// and nothing else on disk records why a turn stopped. Without this, a subagent that quit early
// is indistinguishable from one that finished — which is why "reports available while
// incomplete" could only ever be caught by reading its output.

test('turnsFrom carries stop_reason through, and distinguishes absent from unread', () => {
  const line = (extra) => JSON.stringify({
    type: 'assistant',
    timestamp: new Date().toISOString(),
    message: { usage: { output_tokens: 10 }, ...extra },
  });
  const text = [
    line({ stop_reason: 'end_turn' }),
    line({ stop_reason: 'max_tokens' }),
    line({ stop_reason: 'tool_use' }),
    line({}), // no stop_reason on the line at all
  ].join('\n');

  const turns = U.turnsFrom(text);
  assert.equal(turns.length, 4, 'every usage-bearing line must still be parsed');
  assert.deepEqual(turns.map((t) => t.stop), ['end_turn', 'max_tokens', 'tool_use', null]);
});

test('adding stop_reason did not disturb the fields the budget guard reads', () => {
  const text = JSON.stringify({
    type: 'assistant',
    timestamp: new Date(0).toISOString(),
    isSidechain: true,
    message: { usage: { output_tokens: 4321 }, stop_reason: 'end_turn' },
  });
  const [t] = U.turnsFrom(text);
  assert.equal(t.out, 4321, 'output_tokens must survive');
  assert.equal(t.side, 1, 'sidechain flag must survive');
  assert.equal(t.t, 0, 'timestamp must survive');
});
