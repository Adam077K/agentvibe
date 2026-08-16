// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:classifier`.
//
// scripts/classifier.test.mjs — the tier map, tested BY EXECUTION against a path list.
//
// AGENT-SYSTEM-REBUILD.md §3.2: "Test it by execution against a path list, never by
// reading it." Reading a glob and believing you know what it matches is how
// `**/*.md` came to be documented as matching README.md while the shell `case` that
// actually evaluated it required a slash.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadRules, classifyFile, classifyFiles, globToRegex, DEFAULT_TIER } = require('./lib/classifier.js');

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES = loadRules(path.join(REPO_ROOT, '.claude', 'qa-tier-floor.yml'));

const tierOf = (f) => classifyFile(f, RULES).tier;

// ── The live tier map, against real paths ───────────────────────────────────

test('harness self-edits classify irreversible', () => {
  for (const f of [
    '.claude/agents/ceo.md',
    '.claude/hooks/pre-tool-use.sh',
    '.claude/settings.json',
    '.claude/qa-tier-floor.yml',
    '.github/workflows/ci.yml',
    '.github/workflows/qa-lead-pass.yml',
    'scripts/lib/claims.js',
    'apps/web/supabase/migrations/0001_init.sql',
  ]) {
    assert.equal(tierOf(f), 'irreversible', `${f} must be irreversible`);
  }
});

test('the harness self-edit set blocks from day one; everything else is shadow', () => {
  assert.equal(classifyFile('.claude/agents/ceo.md', RULES).enforcement, 'block');
  assert.equal(classifyFile('.github/workflows/ci.yml', RULES).enforcement, 'block');
  assert.equal(classifyFile('scripts/lib/classifier.js', RULES).enforcement, 'block');
  assert.equal(classifyFile('docs/02-competitive/x.md', RULES).enforcement, 'shadow');
  assert.equal(classifyFile('docs/09-metrics/x.md', RULES).enforcement, 'shadow');
});

test('api and harness machinery classify full', () => {
  assert.equal(tierOf('apps/web/src/app/api/scan/route.ts'), 'full');
  assert.equal(tierOf('src/lib/auth/session.ts'), 'full');
  assert.equal(tierOf('scripts/ledger.mjs'), 'full');
  assert.equal(tierOf('bin/warroom'), 'full');
  assert.equal(tierOf('docs/09-metrics/2026-08-mrr.md'), 'full');
});

test('app source and claim-bearing docs classify lite', () => {
  assert.equal(tierOf('src/components/Button.tsx'), 'lite');
  assert.equal(tierOf('apps/web/src/page.tsx'), 'lite');
  assert.equal(tierOf('docs/02-competitive/competitors/acme.md'), 'lite');
  assert.equal(tierOf('docs/03-system-design/AGENT-SYSTEM-REBUILD.md'), 'lite');
  assert.equal(tierOf('.claude/memory/DECISIONS.md'), 'lite');
});

test('plain docs classify trivial', () => {
  assert.equal(tierOf('docs/08-agents_work/sessions/2026-08-11-ceo-x.md'), 'trivial');
  assert.equal(tierOf('README.md'), 'trivial');
  assert.equal(tierOf('CHANGELOG.md'), 'trivial');
});

// ── mission-control ─────────────────────────────────────────────────────────
// Before these rules existed, every tracked path under mission-control/ matched nothing and
// classified `lite` by default — the collectors that shell out to git inside repositories
// they merely found on disk, the routes handling the requests that trigger them, and (once
// PR #44 landed) the allowlist deciding whose code may be executed at all. Four PRs got
// their tier from a human remembering.
//
// Reproduce the whole picture with:
//   git ls-files mission-control | node scripts/classify.mjs --json --stdin

test('the mission-control server classifies full — routes, discovery, and the collectors that shell out', () => {
  for (const f of [
    'mission-control/server/index.ts',
    'mission-control/server/app.ts',
    'mission-control/server/state.ts',
    'mission-control/server/projects.ts',
    'mission-control/server/routes/api.ts',
    'mission-control/server/routes/stream.ts',
    'mission-control/server/lib/claims.ts',
    'mission-control/server/collectors/conflicts.ts',
    'mission-control/server/collectors/worktrees.ts',
    // `full`, NOT irreversible, and the distinction is the point: guard.ts's own header
    // says it is "not a second, independent answer to the three RCEs; it is the other half
    // of one". Weakening it does not by itself grant execution — trust.ts still gates that.
    'mission-control/server/routes/guard.ts',
    'mission-control/scripts/trust.ts',
    'mission-control/scripts/trust-store.ts',
    'mission-control/check.mjs',
  ]) {
    assert.equal(tierOf(f), 'full', `${f} must be full`);
  }
});

test('the trust allowlist classifies irreversible — the file this whole rule set exists for', () => {
  const c = classifyFile('mission-control/server/trust.ts', RULES);
  assert.equal(c.tier, 'irreversible');
  assert.ok(c.matched_patterns.includes('mission-control/server/**'), 'the full rule also matches; strictest must win');
  assert.equal(c.enforcement, 'shadow');
  // The three paths in this tree that can demand the risk:irreversible label, and therefore
  // arm the F13 step of qa-lead-pass.yml. Pinned at three so a fourth is a deliberate act.
  // Both loopback bindings are in the set: the server's, and the dev proxy's — which reaches
  // the same API one hop out through `changeOrigin: false`.
  const irreversible = [
    'mission-control/server/trust.ts',
    'mission-control/server/config.ts',
    'mission-control/client/vite.config.ts',
  ];
  const sweep = [
    'mission-control/server/routes/guard.ts', 'mission-control/server/app.ts',
    'mission-control/server/projects.ts', 'mission-control/server/state.ts',
    'mission-control/server/index.ts', 'mission-control/server/index-store.ts',
    'mission-control/scripts/trust.ts', 'mission-control/scripts/trust-store.ts',
    'mission-control/check.mjs', 'mission-control/client/src/App.tsx',
    'mission-control/test/gate.ts', 'mission-control/test/trust.test.ts',
    'mission-control/README.md',
  ];
  for (const f of sweep) assert.notEqual(tierOf(f), 'irreversible', `${f} must not demand the label`);
  for (const f of irreversible) assert.equal(tierOf(f), 'irreversible', f);
});

test('the two files a directory-shaped reason was silently covering', () => {
  // Both found by review rather than by the sweep, because each sat under a rule whose
  // `reason:` described something else. A blanket reason over a directory is the cheapest
  // way for a tier map to be confidently wrong, so both are now pinned by name.
  //
  // vite.config.ts pins host 127.0.0.1 "for the same reason server/config.ts pins it", and
  // proxies /api and /events to 4300 with changeOrigin:false — same surface, one hop out.
  // It was covered by "Browser render only — no filesystem access, no process spawn".
  assert.equal(tierOf('mission-control/client/vite.config.ts'), 'irreversible');
  assert.equal(classifyFile('mission-control/client/vite.config.ts', RULES).pattern,
    'mission-control/client/vite.config.ts');
  // gate.ts is not a `.test.` file; it is the shared implementation the tests gate on, and a
  // defect in it makes assertions SKIP while the suite reports success. `full`, not
  // irreversible: unlike scripts/lib/**, a git revert fully undoes it — nothing executed.
  // It was covered by a reason that read, in full, "Tests."
  assert.equal(tierOf('mission-control/test/gate.ts'), 'full');
  assert.equal(classifyFile('mission-control/test/gate.ts', RULES).pattern, 'mission-control/test/gate.ts');
  assert.equal(tierOf('mission-control/test/live.test.ts'), 'lite', 'the cases themselves stay lite');
});

test('the repo-root scripts/** rule does not reach mission-control/scripts/**', () => {
  // `scripts/**` is anchored at the root, so mission-control/scripts/ needs its own rule.
  // Without it the trust-list editor would have classified lite.
  assert.ok(!globToRegex('scripts/**').test('mission-control/scripts/trust.ts'));
  assert.equal(classifyFile('mission-control/scripts/trust.ts', RULES).pattern, 'mission-control/scripts/**');
});

test('the mission-control network binding classifies irreversible', () => {
  const c = classifyFile('mission-control/server/config.ts', RULES);
  assert.equal(c.tier, 'irreversible');
  assert.ok(c.matched_patterns.includes('mission-control/server/**'), 'the full rule also matches; strictest must win');
  // Shadow, not block, unlike every other irreversible entry: enforcement governs claim
  // resolution and the ledger reads claims from markdown only, so `block` on a .ts path
  // would be a mechanism that fires on nothing.
  assert.equal(c.enforcement, 'shadow');
});

test('the mission-control client and tests stay lite, and its README stays trivial', () => {
  // Mutation-tested and it still passes when the client/test rules are deleted — said here
  // because that is the point, not a gap. Those two rules are documentary (lite is already
  // the default). What this test guards is the opposite direction: someone widening the
  // tree to `mission-control/**: full` later, which would make a CSS edit a security review
  // and would raise README.md — a claim-bearing file — above trivial. It fails then.
  for (const f of [
    'mission-control/client/src/App.tsx',
    'mission-control/client/src/views/FleetView.tsx',
    'mission-control/client/src/styles.css',
    'mission-control/test/units.test.ts',
    'mission-control/test/views.test.tsx',
  ]) {
    assert.equal(tierOf(f), 'lite', `${f} must stay lite — a CSS edit is not a security review`);
  }
  // Docs inside mission-control must NOT be swept up by the tree rules. README.md carries
  // two project claims; raising it would change which claims the ledger enforces.
  assert.equal(tierOf('mission-control/README.md'), 'trivial');
  assert.equal(classifyFile('mission-control/README.md', RULES).enforcement, 'shadow');
});

test('a mission-control change set floors at full without demanding the irreversible label', () => {
  // The shape of PR #30/#32/#41/#44: client + collectors + tests. `full` is advisory in
  // qa-lead-pass.yml; only `irreversible` demands a label that CI cannot add itself.
  const r = classifyFiles([
    'docs/08-agents_work/sessions/2026-08-14-ceo-mc-belief-conflicts.md',
    'mission-control/client/src/App.tsx',
    'mission-control/server/collectors/belief.ts',
    'mission-control/test/collectors.test.ts',
  ], RULES);
  assert.equal(r.floor.tier, 'full');
  assert.equal(r.floor.file, 'mission-control/server/collectors/belief.ts');
});

test('an unmatched path defaults to lite, not trivial', () => {
  // The bash this replaced started its accumulator at trivial, so package.json —
  // which nothing matches — classified as a typo-grade change.
  assert.equal(classifyFile('package.json', RULES).pattern, null);
  assert.equal(tierOf('package.json'), DEFAULT_TIER);
  assert.equal(DEFAULT_TIER, 'lite');
});

test('the strictest matching rule wins, not the first', () => {
  // .claude/agents/ceo.md matches BOTH ".claude/agents/**" (irreversible) and
  // "**/*.md" (trivial). Order in the file must not decide the answer.
  const c = classifyFile('.claude/agents/ceo.md', RULES);
  assert.ok(c.matched_patterns.includes('**/*.md'), 'should also match the markdown rule');
  assert.equal(c.tier, 'irreversible');
});

test('resolvers and required_claim_kinds take the union of every matching rule', () => {
  const c = classifyFile('docs/02-competitive/competitors/acme.md', RULES);
  assert.deepEqual(c.resolvers, ['claim-freshness', 'claim-source']);
  assert.deepEqual(c.required_claim_kinds, ['external-fact']);
  const d = classifyFile('.claude/agents/ceo.md', RULES);
  assert.ok(d.resolvers.includes('claim-command'));
});

test('a rule naming an unimplemented resolver makes the classifier throw', () => {
  // The registry is closed, so `claim-arithmetic` — which AGENT-SYSTEM-REBUILD.md §3.2
  // shows in an example and which nothing implements — cannot enter the tier map as a
  // mechanism that never runs.
  const tmp = path.join(os.tmpdir(), `tierfloor-${process.pid}.yml`);
  fs.writeFileSync(tmp, 'version: 1\nrules:\n  - pattern: "x/**"\n    tier: lite\n    resolvers: [claim-arithmetic]\n');
  try {
    assert.throws(() => loadRules(tmp), /claim-arithmetic" is not implemented/);
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('a rule naming an unknown claim kind makes the classifier throw', () => {
  const tmp = path.join(os.tmpdir(), `tierfloor-kind-${process.pid}.yml`);
  fs.writeFileSync(tmp, 'version: 1\nrules:\n  - pattern: "x/**"\n    tier: lite\n    required_claim_kinds: [vibes]\n');
  try {
    assert.throws(() => loadRules(tmp), /"vibes" is not implemented/);
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('the floor across a change set is the strictest file in it', () => {
  const r = classifyFiles(['README.md', 'docs/x.md', '.github/workflows/ci.yml'], RULES);
  assert.equal(r.floor.tier, 'irreversible');
  assert.equal(r.floor.file, '.github/workflows/ci.yml');
});

test('a docs-only change set floors at trivial', () => {
  const r = classifyFiles(['docs/a.md', 'docs/b.md'], RULES);
  assert.equal(r.floor.tier, 'trivial');
});

// ── Glob semantics ──────────────────────────────────────────────────────────

test('** spans zero or more segments; * never crosses a slash', () => {
  const re = globToRegex('**/api/**');
  assert.ok(re.test('api/x.ts'), 'zero leading segments');
  assert.ok(re.test('apps/web/src/api/x.ts'), 'several leading segments');
  assert.ok(!re.test('apps/notapi/x.ts'), 'must match the segment exactly');

  const mid = globToRegex('apps/**/src/**');
  assert.ok(mid.test('apps/web/src/a.ts'));
  assert.ok(mid.test('apps/src/a.ts'), 'zero segments between');

  const seg = globToRegex('**/lib/credit*/**');
  assert.ok(seg.test('src/lib/credits/x.ts'));
  assert.ok(seg.test('src/lib/credit/nested/deep/x.ts'), 'a trailing ** is recursive');
  assert.ok(!seg.test('src/lib/billing/x.ts'));

  const md = globToRegex('**/*.md');
  assert.ok(md.test('README.md'), 'a root-level .md is still markdown');
  assert.ok(md.test('docs/a/b.md'));
  assert.ok(!md.test('docs/a/b.mdx'));
});

test('a trailing /** matches the directory itself and everything under it', () => {
  const re = globToRegex('.github/workflows/**');
  assert.ok(re.test('.github/workflows'));
  assert.ok(re.test('.github/workflows/ci.yml'));
  assert.ok(re.test('.github/workflows/a/b/c.yml'));
  assert.ok(!re.test('.github/workflowsX/ci.yml'));
});

test('dots in a pattern are literal, not regex wildcards', () => {
  const re = globToRegex('.claude/settings.json');
  assert.ok(re.test('.claude/settings.json'));
  assert.ok(!re.test('Xclaude/settingsXjson'));
});

// ── The map must be loadable, and refuse when it is not ─────────────────────

test('a missing tier map throws instead of classifying everything as trivial', () => {
  assert.throws(() => loadRules('/nonexistent/qa-tier-floor.yml'), /refusing to classify with no rules/);
});

test('every rule in the live map has a valid tier and enforcement', () => {
  assert.ok(RULES.length >= 26, `expected the full rule set, got ${RULES.length}`);
  for (const r of RULES) {
    assert.ok(['trivial', 'lite', 'full', 'irreversible'].includes(r.tier), r.pattern);
    assert.ok(['shadow', 'block'].includes(r.enforcement), r.pattern);
  }
});
