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
