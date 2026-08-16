// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run check:dispatch` (the checker)
// and `node --test scripts/check-dispatch-agenttype.test.mjs` (this file).
//
// scripts/check-dispatch-agenttype.test.mjs — the mutation gate for the dispatch-identity checker.
//
// A detector nobody has seen fail is a detector nobody has seen. Every case below CONSTRUCTS the
// defect — a dispatch with no agentType, one naming a shim, one naming a file that does not
// exist, one letting its caller choose — and asserts the checker refuses it. The one case that
// asserts a pass runs against this repository as it actually stands, with no arguments, so it
// pins the real floor rather than a fixture's.
//
// Fixtures are written to a temp directory and the checker is pointed at them with --root. A test
// that read the working tree would pass or fail for reasons the test did not choose.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'check-dispatch-agenttype.mjs');

// Built rather than written, so this file's own source never contains the literal the containment
// rule searches for. A test that trips the checker it is testing is worthless.
const CRED = 'operator';

const AGENT_FILES = {
  'builder.md': ['---', 'name: builder', 'model: claude-sonnet-4-6', 'tools: [Read, Write, Edit, Bash, Glob, Grep]', 'maxTurns: 30', 'isolation: worktree', '---', '', '# builder'].join('\n'),
  'reviewer-readonly.md': ['---', 'name: reviewer-readonly', 'model: claude-sonnet-4-6', 'tools: [Read, Glob, Grep]', 'maxTurns: 30', 'isolation: none', '---', '', '# reviewer-readonly'].join('\n'),
  'researcher.md': ['---', 'name: researcher', 'kind: shim', '---', '', '# researcher — collapsed into sourcer'].join('\n'),
};

const roots = [];
/** Write a fixture repo: { workflows: {file: source}, files?: {relpath: source} } → its root. */
function fixture({ workflows = {}, files = {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-fixture-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(root, '.claude', 'workflows'), { recursive: true });
  for (const [name, body] of Object.entries(AGENT_FILES)) fs.writeFileSync(path.join(root, '.claude', 'agents', name), body);
  for (const [name, body] of Object.entries(workflows)) fs.writeFileSync(path.join(root, '.claude', 'workflows', name), body);
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  return root;
}

process.on('exit', () => {
  for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true }); } catch { /* best effort */ } }
});

function run(args) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out: stdout, err: '' };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '').toString(), err: (e.stderr || '').toString() };
  }
}

/** Run against a fixture root, at a floor low enough that the fixture's size is not the subject. */
function check(root, extra = []) {
  const r = run(['--root', root, '--json', '--min-sites', '1', ...extra]);
  return { code: r.code, ...JSON.parse(r.out) };
}

const flagged = (r, name) => r.failures.some((f) => f.startsWith(`[${name}]`));

// A dispatch that should pass every rule. The mutations below are edits to exactly this.
const CLEAN = [
  "export const meta = { name: 'fx' }",
  "phase('Go')",
  "const r = await agent('do the thing', { label: 'go', phase: 'Go', agentType: 'builder', model: 'sonnet' })",
].join('\n');

test('the clean fixture passes — otherwise every mutation below proves nothing', () => {
  const r = check(fixture({ workflows: { 'fx.js': CLEAN } }));
  assert.equal(r.code, 0, `expected a clean pass, got: ${JSON.stringify(r.failures)}`);
  assert.equal(r.sites.length, 1);
  assert.equal(r.sites[0].agentType, 'builder');
});

test('MUTATION: deleting agentType from that same dispatch is flagged', () => {
  const bad = CLEAN.replace(" agentType: 'builder',", '');
  assert.ok(!bad.includes('agentType'), 'the mutation must actually remove the field');
  const r = check(fixture({ workflows: { 'fx.js': bad } }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'missing-agenttype'), JSON.stringify(r.failures));
  assert.ok(r.failures[0].includes('general-purpose'), 'the message must name what the dispatch falls back to');
});

test('an agentType naming a shim is flagged — a shim grants no tools', () => {
  const r = check(fixture({ workflows: { 'fx.js': CLEAN.replace("'builder'", "'researcher'") } }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'shim-agenttype'), JSON.stringify(r.failures));
});

test('an agentType naming no file at all is flagged', () => {
  const r = check(fixture({ workflows: { 'fx.js': CLEAN.replace("'builder'", "'product-designer'") } }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'unknown-agenttype'), JSON.stringify(r.failures));
  assert.ok(r.failures[0].includes('.claude/agents/product-designer.md'), 'the message must name the path it looked for');
});

// ── rule 3 · caller-supplied agentType ─────────────────────────────────────

const CALLER_SUPPLIED = [
  'const SLICES = args.slices || []',
  "const r = await agent('build', { label: 'b', agentType: SLICES[0].agentType || 'builder', model: 'sonnet' })",
].join('\n');

test('a caller-supplied agentType with no frozen allowlist is dispatch-identity injection', () => {
  const r = check(fixture({ workflows: { 'fx.js': CALLER_SUPPLIED } }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'no-allowlist'), JSON.stringify(r.failures));
});

test('a caller-supplied agentType whose || fallback is not a literal is flagged', () => {
  const src = "const r = await agent('build', { label: 'b', agentType: args.a || args.b, model: 'sonnet' })";
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'unguarded-agenttype'), JSON.stringify(r.failures));
});

test('an allowlist the file never tests membership against is inert, and says so', () => {
  const src = ["const DISPATCHABLE = Object.freeze(['builder', 'reviewer-readonly'])", CALLER_SUPPLIED].join('\n');
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'inert-allowlist'), JSON.stringify(r.failures));
});

test('an allowlist naming a phantom engine fails on the member, not only on the dispatch', () => {
  const src = [
    "const DISPATCHABLE = Object.freeze(['builder', 'backend-engineer'])",
    'if (!DISPATCHABLE.includes(args.a)) return { error: 1 }',
    CALLER_SUPPLIED,
  ].join('\n');
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 1);
  assert.ok(r.failures.some((f) => f.startsWith('[unknown-agenttype]') && f.includes('backend-engineer')), JSON.stringify(r.failures));
});

test('a caller-supplied agentType with a checked frozen allowlist passes', () => {
  const src = [
    "const DISPATCHABLE = Object.freeze(['builder', 'reviewer-readonly'])",
    'if (!DISPATCHABLE.includes(args.a)) return { error: 1 }',
    CALLER_SUPPLIED,
  ].join('\n');
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 0, JSON.stringify(r.failures));
  assert.equal(r.sites[0].resolution, 'guarded');
});

// ── the parser, both directions ────────────────────────────────────────────
//
// qa.js:282 embeds a template literal carrying ${...} — including a `||` and a brace inside a
// string — in the prompt argument. A naive brace counter ends the argument list inside that
// string. Both halves matter: the trap must not produce a false positive, AND removing the
// agentType from the same site must still be caught. A parser that skips what it cannot read
// reports clean on exactly the sites most worth reading.

const TRAP = [
  "const seen = new Set(['a'])",
  "const d = { key: 'x' }",
  'const round = 1',
  "const r = await agent(`sweep round ${round}. known ids: ${[...seen].join(', ') || '(none yet)'} } ' \" {`,",
  "  { label: `sweep${round}:${d.key}`, phase: 'Sweep', agentType: 'builder', model: 'sonnet' })",
].join('\n');

test('a template literal carrying an interpolation in the prompt does not derail the scan', () => {
  const r = check(fixture({ workflows: { 'fx.js': TRAP } }));
  assert.equal(r.code, 0, JSON.stringify(r.failures));
  assert.equal(r.sites.length, 1);
  assert.equal(r.sites[0].agentType, 'builder');
});

test('MUTATION: the same template-literal site with agentType removed is still caught', () => {
  const r = check(fixture({ workflows: { 'fx.js': TRAP.replace(" agentType: 'builder',", '') } }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'missing-agenttype'), JSON.stringify(r.failures));
});

test('`agent(` written inside a comment or a prompt string is not a dispatch site', () => {
  const src = [
    '// all four agent() calls here omitted agentType until 2026-08-16',
    "const note = 'call agent(x, {}) to dispatch'",
    '/* agent(y, {}) */',
    CLEAN,
  ].join('\n');
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 0, JSON.stringify(r.failures));
  assert.equal(r.sites.length, 1, 'only the real dispatch should be counted');
});

test('a rationale comment above agentType does not hide the key', () => {
  const src = [
    "const r = await agent('go', {",
    "  label: 'g',",
    '  // `builder` is the only engine that produces an artifact in a worktree.',
    "  agentType: 'builder',",
    "  model: 'sonnet',",
    '})',
  ].join('\n');
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 0, JSON.stringify(r.failures));
  assert.equal(r.sites[0].agentType, 'builder');
});

test('a bare identifier resolves against a same-file const, as REVIEW_AGENT does in qa.js', () => {
  const src = ["const REVIEW_AGENT = 'builder'", "const r = await agent('go', { label: 'g', agentType: REVIEW_AGENT, model: 'sonnet' })"].join('\n');
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 0, JSON.stringify(r.failures));
  assert.equal(r.sites[0].agentType, 'builder');
  assert.equal(r.sites[0].resolution, 'const REVIEW_AGENT');
});

test('an identifier with no same-file literal fails rather than being assumed safe', () => {
  const src = "const r = await agent('go', { label: 'g', agentType: SOME_IMPORTED_NAME, model: 'sonnet' })";
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'unresolved-identifier'), JSON.stringify(r.failures));
});

test('a spread options object fails loudly rather than passing quietly', () => {
  const src = ["const base = { model: 'sonnet' }", "const r = await agent('go', { ...base, label: 'g', agentType: 'builder' })"].join('\n');
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'spread-options'), JSON.stringify(r.failures));
});

// ── rule 4 · containment ───────────────────────────────────────────────────

test('a credentialed agentType dispatched from outside .claude/workflows/ is refused', () => {
  const root = fixture({
    workflows: { 'fx.js': CLEAN },
    files: { 'scripts/side-channel.mjs': "await agent('go', { label: 'g', agentType: '" + CRED + "' })" },
  });
  const r = check(root);
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'containment'), JSON.stringify(r.failures));
  assert.ok(r.failures.some((f) => f.includes('scripts/side-channel.mjs')), 'the message must name the offending file');
});

test('the same credentialed agentType inside a workflow file is exempt from containment', () => {
  const root = fixture({
    workflows: { 'fx.js': CLEAN, 'ship.js': "await agent('deploy', { label: 'd', agentType: '" + CRED + "' })" },
  });
  const r = check(root);
  // It still fails rule 2, because no such agent file exists yet. Both answers are correct and
  // both are worth pinning: containment is about WHERE, rule 2 is about WHETHER.
  assert.ok(!flagged(r, 'containment'), JSON.stringify(r.failures));
  assert.ok(flagged(r, 'unknown-agenttype'), JSON.stringify(r.failures));
});

// ── rule 5 · isolation ─────────────────────────────────────────────────────

test('a dispatch-site isolation contradicting the agent file WARNS and does not block', () => {
  const src = "const r = await agent('go', { label: 'g', agentType: 'builder', isolation: 'none' })";
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 0, 'rule 5 is advisory by design');
  assert.equal(r.failures.length, 0);
  assert.ok(r.warnings.some((w) => w.startsWith('[isolation-mismatch]')), JSON.stringify(r.warnings));
});

test('an isolation the agent file agrees with produces no warning', () => {
  const src = "const r = await agent('go', { label: 'g', agentType: 'builder', isolation: 'worktree' })";
  const r = check(fixture({ workflows: { 'fx.js': src } }));
  assert.equal(r.code, 0);
  assert.deepEqual(r.warnings, []);
});

// ── rule 6 · non-vacuity ───────────────────────────────────────────────────

test('the default floor is 12, and a fixture below it fails on that alone', () => {
  const r = run(['--root', fixture({ workflows: { 'fx.js': CLEAN } }), '--json']); // no --min-sites
  const j = JSON.parse(r.out);
  assert.equal(r.code, 1);
  assert.ok(j.failures.some((f) => f.startsWith('[non-vacuity]') && f.includes('floor is 12')), JSON.stringify(j.failures));
});

test('a workflows directory with no .js at all fails rather than reporting clean', () => {
  const r = check(fixture({ workflows: {} }));
  assert.equal(r.code, 1);
  assert.ok(flagged(r, 'non-vacuity'), JSON.stringify(r.failures));
});

// ── the repository itself ──────────────────────────────────────────────────

test('this repository passes with no arguments — the real floor, the real files', () => {
  const r = run([]);
  assert.equal(r.code, 0, `${r.out}\n${r.err}`);
  const j = JSON.parse(run(['--json']).out);
  assert.ok(j.sites.length >= 12, `expected at least 12 dispatch sites, found ${j.sites.length}`);
  assert.ok(j.sites.every((s) => s.agentType), 'every site must resolve to a name');
});
