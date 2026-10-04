// B1-26 done-test, round 4 (re-freeze r4 after the re-review of build/b1-26 @ 8daed9d, 2026-10-02).
// Userland half; kernel/internal/label/label_r4_donetest_test.go runs the SAME vectors from
// kernel/internal/label/testdata/label/r4_{line_separators,wire_text}.json. Hash-registered in
// build/done-tests/B1-26.yml. The object-path tests are Userland's alone: Go has no object path.
//
// Run: node --test userland/test/label.r4.donetest.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as label from '../src/label.ts';
import * as nouns from '../src/nouns.ts';

const FIXTURES = new URL('../../kernel/internal/label/testdata/label/', import.meta.url);
const load = (name: string) => JSON.parse(readFileSync(new URL(name, FIXTURES), 'utf8'));
const clone = (v: unknown) => JSON.parse(JSON.stringify(v));
const NOUNS = new URL('../../kernel/internal/nouns/testdata/nouns/', import.meta.url);
const ORCH = 'orchestrator ruling 2026-10-02, B1-26 re-review r4';

type Text = { name: string; want: string; raw?: boolean; text: string; cite: string };
const textOf = (c: Text) => (c.raw ? c.text.replace(/\\u([dD][89a-fA-F][0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) : c.text);

test('B1-26 r4 Userland: U+2028 and U+2029 re-encode as the raw character, byte for byte', async (t) => {
  const cases: { name: string; in: string; out: string; cite: string }[] = load('r4_line_separators.json').cases;
  assert.ok(cases.length >= 7, `r4_line_separators.json holds ${cases.length} cases; the register froze 7`);
  for (const c of cases) {
    for (const [which, schema] of [['label.LabelV1', label.LabelV1], ['nouns.Label', nouns.Label]] as const) {
      await t.test(`${c.name}/${which}`, () => {
        const out = JSON.stringify((schema as any).encode(nouns.decodeText(schema as any, c.in)));
        assert.equal(out, c.out, c.cite);
      });
    }
  }
});

test('B1-26 r4 Userland: a high surrogate pairs only with DC00-DFFF', async (t) => {
  const cases: Text[] = load('r4_wire_text.json').cases;
  assert.ok(cases.length >= 8, `r4_wire_text.json holds ${cases.length} cases; the register froze 8`);
  for (const c of cases) {
    for (const [which, schema] of [['nouns.Label', nouns.Label], ['label.LabelV1', label.LabelV1]] as const) {
      await t.test(`${c.name}/${which}`, () => {
        if (c.want === 'valid') {
          assert.doesNotThrow(() => nouns.decodeText(schema as any, textOf(c)), c.cite);
          return;
        }
        assert.throws(() => nouns.decodeText(schema as any, textOf(c)), c.cite);
      });
    }
  }
});

// The object path (a value handed to decode or encode, not text): what the text path refuses, it
// refuses too, since a caller holding a JavaScript object can build what no JSON text spells.
test('B1-26 r4 Userland: the object path refuses p -0 and lone surrogates in values and keys', async (t) => {
  const MIN = load('valid.json').cases.find((c: any) => c.name === 'label.min').value;
  const withP = (p: number) => ({ ...clone(MIN), confidence: { rung: 'E2', p } });
  const withVenture = (v: string) => ({ ...clone(MIN), venture: v });
  // Controls: the same paths accept the ordinary value, so a refusal below is about the value.
  assert.doesNotThrow(() => label.LabelV1.decode(withP(0)), 'control: p 0');
  assert.doesNotThrow(() => label.LabelV1.encode(withP(0)), 'control: encode p 0');
  for (const [which, schema] of [['label.LabelV1', label.LabelV1], ['nouns.Label', nouns.Label]] as const) {
    await t.test(`p -0 decode/${which}`, () => assert.throws(() => (schema as any).decode(withP(-0)),
      `${ORCH}: p is never -0; JSON.stringify writes it 0, so it cannot round-trip (Go's wire.Number)`));
    await t.test(`p -0 encode/${which}`, () => assert.throws(() => (schema as any).encode(withP(-0)), `${ORCH}: encode refuses what decode refuses`));
    for (const s of ['\ud800', 'v\udc00', '\udbff']) {
      await t.test(`lone surrogate venture ${JSON.stringify(s)} decode/${which}`, () =>
        assert.throws(() => (schema as any).decode(withVenture(s)), `${ORCH}: a lone surrogate has no UTF-8 form; Go cannot hold the same string`));
      await t.test(`lone surrogate venture ${JSON.stringify(s)} encode/${which}`, () =>
        assert.throws(() => (schema as any).encode(withVenture(s)), `${ORCH}: encode refuses it too`));
    }
  }
  // A key: in a label every key is known, so a lone-surrogate key reaches the plain-copy check only
  // inside a raw field. Event.data is one; a label's surrogate rule must hold wherever the label sits.
  const event = JSON.parse(readFileSync(new URL('valid.json', NOUNS), 'utf8')).cases.find((c: any) => c.name === 'event.full').value;
  assert.doesNotThrow(() => nouns.Event.decode(clone(event)), 'control: event.full decodes');
  await t.test('lone surrogate key in Event.data', () => {
    const e = clone(event);
    e.data = { ['k\ud800']: 1 };
    assert.throws(() => nouns.Event.decode(e), `${ORCH}: a key holding a lone surrogate is not wire text`);
  });
});
