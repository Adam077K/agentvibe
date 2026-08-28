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

// ── THE THIRD BUCKET: what the scan saw and did not classify ──────────────────────────────────
//
// The guard this joins fires only when a file drops to ZERO sites while its raw text holds
// `agent(`. A PARTIAL loss passed it in silence, and that is the state the repo was in: measured
// across `.claude/workflows/*.js`, 19 occurrences in the unmasked source became 13 sites. Six
// vanished, no file hit zero, and nothing said so. Most were comments — correct to exclude, and
// indistinguishable from a real miss in the output, which is the part that matters.

test('an occurrence excluded by masking is REPORTED, not discarded', () => {
  const r = check(fixture({ workflows: { 'fx.js': `// a note mentioning agent( in prose\n${CLEAN}` } }));
  assert.equal(r.code, 0, 'a comment must not fail the check');
  assert.equal(r.unclassified.length, 1, JSON.stringify(r.unclassified));
  assert.equal(r.unclassified[0].reason, 'masked');
  assert.ok(r.unclassified[0].line > 0, 'an unclassified item with no line is not actionable');
});

test('a clean fixture reports an EMPTY bucket — "nothing ambiguous", not "nothing checked"', () => {
  // The control. Without it, every assertion above would hold for a checker that put everything in
  // the bucket, and the bucket would mean nothing.
  const r = check(fixture({ workflows: { 'fx.js': CLEAN } }));
  assert.equal(r.code, 0);
  assert.deepEqual(r.unclassified, []);
  assert.equal(r.sites.length, 1);
});

test('THE COVERAGE IDENTITY: universe === sites + unclassified, and it is checked', () => {
  // A coverage line whose parts do not add up is worse than none, so the arithmetic is asserted by
  // the checker rather than by eye. This pins that the checker asserts it.
  for (const body of [CLEAN, `// agent( in a comment\n${CLEAN}`, `${CLEAN}\n// and agent( again`]) {
    const r = check(fixture({ workflows: { 'fx.js': body } }));
    // NAMED FIELDS, NOT A FALLBACK CHAIN. The first version of this assertion read
    // `r.raw_agent_occurrences ?? r.universe ?? (r.sites.length + r.unclassified.length)` — whose
    // last arm is the very quantity being compared, so an ABSENT field made it compare a value to
    // itself and pass. That is the defect this file is about, written into its own test.
    assert.equal(typeof r.universe_agent_occurrences, 'number', 'the JSON path does not report the universe');
    assert.equal(typeof r.sites_in_js, 'number', 'the JSON path does not report the .js site count');
    assert.equal(r.universe_agent_occurrences, r.sites_in_js + r.unclassified.length,
      'the reported universe does not equal its two buckets');
    assert.ok(!flagged(r, 'coverage-identity'), 'the identity check fired on a consistent fixture');
  }
});

test('THE FIXTURE BUILT TO DEFEAT IT: live code the mask covers is VISIBLE, not silent', () => {
  // The tokenizer's known derail case — a regex literal holding a lone quote is read as
  // division-then-string, blanking the rest of the file. A REAL dispatch after one is still not
  // seen as a site. What changed is that it now appears in the bucket with a file:line instead of
  // vanishing: 1 site + 1 unclassified rather than 1 site and no mention of the second.
  //
  // This test asserts VISIBILITY, deliberately, and not correct classification — the item is
  // labelled `masked`, which is true of the mask and false of the intent. Telling a correct mask
  // from a derailed one needs parsing rather than masking, which this checker does not do and
  // whose blind-spot list already says so. If that is ever fixed, this test should FAIL and be
  // replaced by one asserting a `parser-gap` failure.
  const derailed = `${CLEAN}\nconst re = /"/; const s = await agent('q', { label: 'y', agentType: 'builder' })`;
  const r = check(fixture({ workflows: { 'fx.js': derailed } }));
  assert.equal(r.sites.length, 1, 'the second dispatch became visible to the site scan — good, update this test');
  assert.equal(r.unclassified.length, 1, 'the swallowed dispatch is not in any bucket — it is silent again');
  assert.match(r.unclassified[0].detail, /excluded by design/);
});

test('THE .md UNIVERSE: a prose mention of agentType is REPORTED as excluded, not skipped', () => {
  // The .md half is scanned by a SHAPE predicate — `agentType` followed by a quoted literal —
  // which is narrower than the token itself. Before the cross-count covered .md, every mention
  // that did not match the shape was dropped in silence: not a site, not a failure, not in any
  // bucket. Three exist in this repository right now, all prose (a shape table in workflows/
  // README.md, a sentence and a column header in design-screen.md), and nothing said so.
  const md = [
    '# fx',
    "A dispatch: `agent(q, { agentType: 'builder' })`.",
    'The `agentType` key is what selects the engine.',   // prose mention — no literal follows
  ].join('\n');
  const r = check(fixture({ workflows: { 'fx.md': md, 'fx.js': CLEAN } }));
  assert.equal(r.code, 0, JSON.stringify(r.failures));
  const prose = r.unclassified.filter((u) => u.reason === 'md-prose-mention');
  assert.equal(prose.length, 1, `expected the prose mention in the bucket, got ${JSON.stringify(r.unclassified)}`);
  assert.equal(prose[0].line, 3, 'the bucket must carry the line, or a reader cannot act on it');
  assert.match(prose[0].detail, /excluded by design/);
  // And it is NOT counted as a dispatch — visibility must not become a false positive.
  assert.ok(!r.sites.some((s) => s.file.endsWith('fx.md') && s.line === 3), 'a prose mention became a site');
});

test('a prose mention does NOT fail the run — markdown is prose, unlike the .js parser gap', () => {
  // The asymmetry is deliberate and is the reason the two universes are counted separately: an
  // unmatched occurrence in LIVE .js is a parser gap and FAILS; the same in markdown is the
  // expected case and is merely listed. Collapsing them would either spam failures or hide gaps.
  const r = check(fixture({ workflows: { 'fx.md': 'Prose about `agentType` alone.', 'fx.js': CLEAN } }));
  assert.equal(r.code, 0, JSON.stringify(r.failures));
  assert.ok(!flagged(r, 'parser-gap'), 'a markdown prose mention was treated as a parser gap');
  assert.equal(r.unclassified.filter((u) => u.reason === 'md-prose-mention').length, 1);
});

test('THE TWO-UNIVERSE IDENTITY holds on THIS REPOSITORY, and names both halves', () => {
  // Against the real tree, not a fixture: the first cut of this cross-count covered only .js and
  // so left 4 of 17 real sites with no universe at all — a coverage line that reports coverage it
  // does not have, which is the defect one level up from the one this bucket exists to end.
  const r = JSON.parse(run(["--json"]).out);
  for (const f of ['universe_agent_occurrences', 'sites_in_js', 'md_agenttype_mentions', 'sites_in_md', 'universe_total']) {
    assert.equal(typeof r[f], 'number', `the JSON path does not report ${f}`);
  }
  assert.equal(r.universe_total, r.universe_agent_occurrences + r.md_agenttype_mentions,
    'the reported total is not the sum of the two universes');
  assert.equal(r.universe_total, r.sites_in_js + r.sites_in_md + r.unclassified.length,
    'the two universes do not equal sites + unclassified');
  assert.equal(r.sites.length, r.sites_in_js + r.sites_in_md,
    'the site list and the per-half counts disagree — one of them is not counting what it says');
  assert.ok(r.md_agenttype_mentions > 0 && r.sites_in_md > 0,
    'the .md half is empty, so this test would pass without cross-counting anything');
});
