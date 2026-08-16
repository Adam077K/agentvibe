// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:claims`.
//
// scripts/claims.test.mjs — tests for the claim parser and schema.
//
// The tests that matter most are the FAIL-OPEN ones. A parser bug that rejects a good
// claim is loud and gets fixed in minutes. A parser bug that silently reports "no
// claims found" for a file full of unverified assertions is invisible, and it is the
// bug this repository has already shipped twice. Every "must throw" case below exists
// because the alternative is a green build over an unchecked file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const claims = require('./lib/claims.js');
const { parseYamlSubset, extractClaimBlocks, validateClaim, parseClaimsFromText } = claims;

const GOOD = `claims:
  - id: c-example
    assert: "The thing is true"
    kind: external-fact
    scope: project
    verified_by: source
    evidence: {url: "https://example.com/x", quote: "the thing", accessed: 2026-08-11}
    valid_until: 2026-11-09
    confidence: 0.9
    supports: [d-a, d-b]
`;

// ── Parser: the happy path ──────────────────────────────────────────────────

test('parses a claim list with an inline evidence map', () => {
  const doc = parseYamlSubset(GOOD);
  assert.equal(doc.claims.length, 1);
  const c = doc.claims[0];
  assert.equal(c.id, 'c-example');
  assert.equal(c.assert, 'The thing is true');
  assert.equal(c.evidence.url, 'https://example.com/x');
  assert.equal(c.evidence.accessed, '2026-08-11');
  assert.equal(c.confidence, 0.9);
  assert.deepEqual(c.supports, ['d-a', 'd-b']);
});

test('parses a block-mapping evidence with a nested list of inline maps', () => {
  const doc = parseYamlSubset(`claims:
  - id: c-judged
    assert: "Judged thing"
    kind: judgment
    scope: project
    verified_by: judge
    evidence:
      lenses: [correctness, security]
      risk: high
      judged_by:
        - {model_family: anthropic, model_id: claude-opus-4-7, verdict: pass, at: 2026-08-11}
        - {model_family: openai, model_id: gpt-5, verdict: pass, at: 2026-08-11}
    valid_until: 2026-09-09
    confidence: 0.8
`);
  const c = doc.claims[0];
  assert.deepEqual(c.evidence.lenses, ['correctness', 'security']);
  assert.equal(c.evidence.judged_by.length, 2);
  assert.equal(c.evidence.judged_by[1].model_family, 'openai');
});

test('parses a sequence indented at the same column as its key', () => {
  const doc = parseYamlSubset(`root:\n- a\n- b\n`);
  assert.deepEqual(doc.root, ['a', 'b']);
});

test('a "#" inside a quoted scalar is content, not a comment', () => {
  const doc = parseYamlSubset(`k: "a # b"\n`);
  assert.equal(doc.k, 'a # b');
});

// ── Escapes in quoted scalars ───────────────────────────────────────────────
// Regression. Without escape handling, `cmd: "node -e \"…\""` reached the shell with
// literal backslashes and died. Two TRUE global claims failed for that reason, and the
// same bug in a `quote:` field would have compared the wrong text against a fetched
// page and reported a clean pass — a fail-open, not a loud break.

test('double-quoted escapes are processed, not passed through', () => {
  const doc = parseYamlSubset(String.raw`k: "node -e \"x\" and a \\ backslash"` + '\n');
  assert.equal(doc.k, 'node -e "x" and a \\ backslash');
});

test('an escaped quote does not terminate the string', () => {
  const doc = parseYamlSubset(String.raw`k: "a \" b"` + '\n');
  assert.equal(doc.k, 'a " b');
});

test('escaped quotes survive inside a flow mapping', () => {
  const doc = parseYamlSubset(String.raw`e: {cmd: "echo \"hi\"", expect_exit: 0}` + '\n');
  assert.equal(doc.e.cmd, 'echo "hi"');
  assert.equal(doc.e.expect_exit, 0);
});

test('\\n and \\t are real characters', () => {
  const doc = parseYamlSubset(String.raw`k: "a\nb\tc"` + '\n');
  assert.equal(doc.k, 'a\nb\tc');
});

test('an unknown escape throws rather than being silently dropped', () => {
  assert.throws(() => parseYamlSubset(String.raw`k: "a \q b"` + '\n'), /unknown escape/);
});

test('a dangling backslash throws', () => {
  assert.throws(() => parseYamlSubset('k: "a \\\\\\"\n'), /unterminated quote|dangling backslash/);
});

test('single-quoted strings treat backslash literally and \'\' as one quote', () => {
  const doc = parseYamlSubset(`k: 'C:\\path and it''s fine'\n`);
  assert.equal(doc.k, "C:\\path and it's fine");
});

test('a trailing comment after a value is stripped', () => {
  const doc = parseYamlSubset(`k: value   # explanation\n`);
  assert.equal(doc.k, 'value');
});

// ── Parser: folded and literal scalars ──────────────────────────────────────
// This is the exact shape that made build-skills-manifest.mjs silently emit empty
// descriptions for 4 skills before Phase 1. It is handled, and it is tested.

test('folded (>) scalars join with spaces instead of vanishing', () => {
  const doc = parseYamlSubset(`k: >\n  line one\n  line two\n`);
  assert.equal(doc.k, 'line one line two');
});

test('literal (|) scalars keep their newlines', () => {
  const doc = parseYamlSubset(`k: |\n  line one\n  line two\n`);
  assert.equal(doc.k, 'line one\nline two');
});

test('an empty block scalar throws rather than yielding ""', () => {
  assert.throws(() => parseYamlSubset(`k: >\n`), /block scalar .* has no content/);
});

// ── Parser: everything that must REFUSE ─────────────────────────────────────

test('a tab in indentation throws', () => {
  assert.throws(() => parseYamlSubset(`claims:\n\t- id: c-x\n`), /tab in indentation/);
});

test('a duplicate key throws instead of last-one-wins', () => {
  assert.throws(() => parseYamlSubset(`a: 1\na: 2\n`), /duplicate key "a"/);
});

test('a duplicate key inside a flow mapping throws', () => {
  assert.throws(() => parseYamlSubset(`e: {a: 1, a: 2}\n`), /duplicate key "a" in flow mapping/);
});

test('an unterminated quote throws', () => {
  assert.throws(() => parseYamlSubset(`k: "unclosed\n`), /unterminated quote/);
});

test('an unclosed flow sequence throws', () => {
  assert.throws(() => parseYamlSubset(`k: [a, b\n`), /flow sequence not closed/);
});

test('a key with no value throws instead of becoming null', () => {
  assert.throws(() => parseYamlSubset(`a: 1\nb:\n`), /has no value/);
});

test('a bare line that is not "key: value" throws', () => {
  assert.throws(() => parseYamlSubset(`just some prose\n`), /expected "key: value"/);
});

test('inconsistent indentation throws', () => {
  assert.throws(() => parseYamlSubset(`a: 1\n  b: 2\n`), /unexpected indentation/);
});

test('a bare scalar with a stray apostrophe throws rather than being guessed at', () => {
  // Caught at the line scanner as an unterminated quote — earlier than the scalar
  // parser, but the property under test is the same: it refuses, it does not guess.
  assert.throws(() => parseYamlSubset(`k: it's fine\n`), /unterminated quote/);
});

test('a bare scalar with balanced quotes mid-value throws', () => {
  assert.throws(() => parseYamlSubset(`k: a"b"c\n`), /mixes quotes with bare text/);
});

// ── Block extraction ────────────────────────────────────────────────────────

test('extracts a fenced ```claims block', () => {
  const blocks = extractClaimBlocks('# Doc\n\n```claims\n' + GOOD + '```\n');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].form, 'fence');
  assert.match(blocks[0].yaml, /c-example/);
});

test('an unclosed ```claims fence throws instead of being ignored', () => {
  assert.throws(() => extractClaimBlocks('```claims\nclaims:\n  - id: c-x\n'), /never closed/);
});

test('a ```claims block shown as an EXAMPLE inside a ````markdown fence is not a claim', () => {
  // Regression. CLAIM-LEDGER.md documents the format this way. The first build compiled
  // the example into the live index, producing a claim whose evidence command was
  // `npm run check` — the check that was running it.
  const doc = [
    '# Docs',
    '',
    '````markdown',
    '```claims',
    'claims:',
    '  - id: c-example-only',
    '    assert: "illustrative"',
    '```',
    '````',
    '',
    '```claims',
    'claims:',
    '  - id: c-real',
    '    assert: "actually asserted"',
    '    kind: internal-fact',
    '    scope: task',
    '    verified_by: command',
    '    evidence: {cmd: "true"}',
    '    confidence: 1',
    '```',
  ].join('\n');
  const blocks = extractClaimBlocks(doc);
  assert.equal(blocks.length, 1, 'only the real block counts');
  assert.match(blocks[0].yaml, /c-real/);
  assert.doesNotMatch(blocks[0].yaml, /c-example-only/);

  const { claims: cs, issues } = parseClaimsFromText(doc, 'x.md');
  assert.deepEqual(issues, []);
  assert.deepEqual(cs.map((c) => c.id), ['c-real']);
});

test('a ```claims fence inside a non-claims fence of equal width still closes correctly', () => {
  const doc = '```text\nnot yaml at all: [\n```\n\n```claims\nclaims:\n  - id: c-after\n    assert: "a"\n    kind: internal-fact\n    scope: task\n    verified_by: command\n    evidence: {cmd: "true"}\n    confidence: 1\n```\n';
  const { claims: cs, issues } = parseClaimsFromText(doc, 'x.md');
  assert.deepEqual(issues, []);
  assert.deepEqual(cs.map((c) => c.id), ['c-after']);
});

test('extracts a claims key from frontmatter without choking on the rest', () => {
  const text = `---
name: something
description: |
  a folded description that the claim parser never sees
tools: [Read, Write]
claims:
  - id: c-fm
    assert: "from frontmatter"
    kind: internal-fact
    scope: task
    verified_by: command
    evidence: {cmd: "true", expect_exit: 0}
    confidence: 1
---

body text
`;
  const blocks = extractClaimBlocks(text);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].form, 'frontmatter');
  const { claims: cs, issues } = parseClaimsFromText(text, 'x.md');
  assert.deepEqual(issues, []);
  assert.equal(cs[0].id, 'c-fm');
});

test('a file with no claims yields no claims and no issues', () => {
  const { claims: cs, issues } = parseClaimsFromText('# Just a doc\n\nSome prose.\n', 'x.md');
  assert.deepEqual(cs, []);
  assert.deepEqual(issues, []);
});

test('a malformed claim block reports an issue — it never reads as "no claims"', () => {
  const { claims: cs, issues } = parseClaimsFromText('```claims\nclaims:\n\t- id: c-x\n```\n', 'x.md');
  assert.deepEqual(cs, []);
  assert.equal(issues.length, 1);
  assert.match(issues[0], /tab in indentation/);
});

// ── Schema ──────────────────────────────────────────────────────────────────

function base(over = {}) {
  return {
    id: 'c-x',
    assert: 'thing',
    kind: 'external-fact',
    scope: 'project',
    verified_by: 'command',
    evidence: { cmd: 'true', expect_exit: 0 },
    valid_until: '2026-11-09',
    confidence: 0.9,
    ...over,
  };
}

test('a well-formed claim validates clean', () => {
  assert.deepEqual(validateClaim(base(), 'w'), []);
});

test('a project claim without valid_until fails — this is the nested-spawn shape', () => {
  const issues = validateClaim(base({ valid_until: undefined }), 'w');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /valid_until .* is required for scope:project/);
});

test('a task claim may omit valid_until', () => {
  assert.deepEqual(validateClaim(base({ scope: 'task', valid_until: undefined }), 'w'), []);
});

test('a global claim without valid_until fails', () => {
  const issues = validateClaim(base({ scope: 'global', valid_until: undefined }), 'w');
  assert.match(issues[0], /required for scope:global/);
});

test('an impossible date is rejected', () => {
  const issues = validateClaim(base({ valid_until: '2026-02-30' }), 'w');
  assert.match(issues[0], /valid_until/);
});

test('an unknown field fails — the schema is closed', () => {
  const issues = validateClaim(base({ notes: 'hi' }), 'w');
  assert.match(issues[0], /unknown field "notes"/);
});

test('source evidence requires url, quote and accessed', () => {
  const issues = validateClaim(base({ verified_by: 'source', evidence: { url: 'https://x.test/' } }), 'w');
  assert.equal(issues.length, 2);
  assert.match(issues.join('\n'), /evidence\.quote is required/);
  assert.match(issues.join('\n'), /evidence\.accessed/);
});

test('an uncompilable expect_stdout regex is caught at lint time, not at run time', () => {
  const issues = validateClaim(base({ evidence: { cmd: 'true', expect_stdout: '([' } }), 'w');
  assert.match(issues[0], /not a valid regex/);
});

test('a risk:high judge panel from one model family fails the lint', () => {
  const issues = validateClaim(base({
    verified_by: 'judge',
    evidence: {
      lenses: ['correctness'],
      risk: 'high',
      judged_by: [
        { model_family: 'anthropic', model_id: 'claude-opus-4-7', verdict: 'pass', at: '2026-08-11' },
        { model_family: 'anthropic', model_id: 'claude-sonnet-4-6', verdict: 'pass', at: '2026-08-11' },
      ],
    },
  }), 'w');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /requires >=2 distinct model families, got 1/);
});

test('a risk:high judge panel from two model families passes', () => {
  const issues = validateClaim(base({
    verified_by: 'judge',
    evidence: {
      lenses: ['correctness'],
      risk: 'high',
      judged_by: [
        { model_family: 'anthropic', model_id: 'claude-opus-4-7', verdict: 'pass', at: '2026-08-11' },
        { model_family: 'openai', model_id: 'gpt-5', verdict: 'pass', at: '2026-08-11' },
      ],
    },
  }), 'w');
  assert.deepEqual(issues, []);
});

// ── Dispositions ────────────────────────────────────────────────────────────

test('a waive disposition validates when it carries a date and a reason', () => {
  // first_waived is required for scope:project waivers (issue #55) — the clock must start
  // somewhere so the 90-day cap in cmdLint can enforce it.
  assert.deepEqual(validateClaim(base({
    disposition: { action: 'waive', until: '2026-09-08', reason: 'shadow window still open' },
    first_waived: '2026-01-01',
  }), 'w'), []);
});

test('a waiver with no end date fails — that is the claim being switched off', () => {
  // first_waived is present so this test isolates the missing-until error.
  const issues = validateClaim(base({
    disposition: { action: 'waive', reason: 'later' },
    first_waived: '2026-01-01',
  }), 'w');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /requires "until".*switched off/);
});

test('a scope:project waiver without first_waived fails — the 90-day clock needs a start date', () => {
  // Issue #55: the cap cannot be enforced without first_waived. Global claims are excluded
  // because ~/.warroom/ledger/global.yml is machine state a PR cannot migrate.
  const issues = validateClaim(base({
    disposition: { action: 'waive', until: '2026-09-08', reason: 'x' },
    // no first_waived
  }), 'w');
  assert.equal(issues.length, 1, `expected exactly one issue, got: ${issues.join(', ')}`);
  assert.match(issues[0], /first_waived/);
});

test('first_waived is not required for a global-scope waiver', () => {
  // The global ledger is machine state — a PR cannot retroactively migrate a first_waived date
  // into it. Requiring it for global claims would break the real global ledger.
  const issues = validateClaim(base({
    scope: 'global',
    disposition: { action: 'waive', until: '2026-09-08', reason: 'x' },
    // no first_waived — allowed for global
  }), 'w');
  assert.deepEqual(issues, []);
});

test('every disposition needs a reason', () => {
  const issues = validateClaim(base({ disposition: { action: 'deprecate' } }), 'w');
  assert.match(issues[0], /disposition\.reason is required/);
});

test('an invented disposition action is rejected — only ADR-001s three exist', () => {
  const issues = validateClaim(base({ disposition: { action: 'ignore', reason: 'x' } }), 'w');
  assert.match(issues[0], /must be one of \(refresh\|deprecate\|waive\)/);
});

test('until on a non-waive disposition is rejected rather than quietly ignored', () => {
  const issues = validateClaim(base({ disposition: { action: 'refresh', until: '2026-09-08', reason: 'x' } }), 'w');
  assert.match(issues[0], /only applies to action:waive/);
});

test('the disposition sub-schema is closed too', () => {
  const issues = validateClaim(base({ disposition: { action: 'refresh', reason: 'x', notes: 'y' } }), 'w');
  assert.match(issues[0], /unknown disposition field "notes"/);
});

test('a judge claim with an empty panel is schema-valid but unjudged (the resolver blocks it)', () => {
  const issues = validateClaim(base({
    verified_by: 'judge',
    evidence: { lenses: ['correctness'], risk: 'low', judged_by: [] },
  }), 'w');
  assert.deepEqual(issues, []);
});
