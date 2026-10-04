// B1-26 done-test, round 3 (re-freeze r3 after the re-review of build/b1-26 @ 9096164, 2026-10-02).
// Userland half; kernel/internal/label/label_r3_donetest_test.go runs the SAME vectors from
// kernel/internal/label/testdata/label/r3_{deadlines,wire_text,order}.json. Hash-registered in
// build/done-tests/B1-26.yml. Wire text goes through nouns.decodeText, Userland's one text reader.
//
// "raw": true replaces each surrogate escape in the text with the UTF-16 code unit itself (a valid
// pair stays a pair), which is what a lone surrogate looks like inside a JavaScript string.
//
// Run: node --test userland/test/label.r3.donetest.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as label from '../src/label.ts';
import * as nouns from '../src/nouns.ts';

const FIXTURES = new URL('../../kernel/internal/label/testdata/label/', import.meta.url);
const load = (name: string) => JSON.parse(readFileSync(new URL(name, FIXTURES), 'utf8'));
const clone = (v: unknown) => JSON.parse(JSON.stringify(v));
const MIN = load('valid.json').cases.find((c: any) => c.name === 'label.min').value;

type Text = { name: string; want: string; raw?: boolean; text: string; cite: string };
const textOf = (c: Text) => (c.raw ? c.text.replace(/\\u([dD][89a-fA-F][0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) : c.text);

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

// sourceTree parses JSON keeping every number as its literal spelling, so a comparison sees "0.50"
// and "0.5" as different while key order and string escapes do not matter.
const sourceTree = (text: string) =>
  JSON.parse(text, (_k: string, v: unknown, ctx?: { source?: string }) => (typeof v === 'number' ? { number: ctx?.source } : v));

function canonical(v: any): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
}

test('B1-26 r3 Userland: deadline vectors for tie-break, leap second, century years, fraction zeros, era floor, month 00', async (t) => {
  const cases: { name: string; deadlines: (string | null)[]; want: string; cite: string }[] = load('r3_deadlines.json').cases;
  assert.ok(cases.length >= 10, `r3_deadlines.json holds ${cases.length} cases; the register froze 10`);
  for (const c of cases) {
    const inputs = c.deadlines.map((d, i) => {
      const l = clone(MIN);
      if (d !== null) l.retention.deadline = d;
      return { id: `rec_${'abc'[i]}`, label: label.LabelV1.decode(l), control: false };
    });
    for (const order of permutations(inputs)) {
      await t.test(`${c.name}/${order[0].id}`, () => {
        if (c.want === 'undecided') {
          assert.throws(() => label.join(clone(order[0].label.provenance), order),
            (e: any) => e instanceof label.LabelJoinError && e.code === 'undecided', c.cite);
          return;
        }
        assert.equal(label.join(clone(order[0].label.provenance), order).retention.deadline ?? '', c.want, c.cite);
      });
    }
  }
});

test('B1-26 r3 Userland: lone surrogates and non-canonical p are refused on the text path', async (t) => {
  const cases: Text[] = load('r3_wire_text.json').cases;
  assert.ok(cases.length >= 37, `r3_wire_text.json holds ${cases.length} cases; the register froze 37`);
  for (const c of cases) {
    for (const [which, schema] of [['nouns.Label', nouns.Label], ['label.LabelV1', label.LabelV1]] as const) {
      await t.test(`${c.name}/${which}`, () => {
        const text = textOf(c);
        if (c.want === 'valid') {
          assert.doesNotThrow(() => nouns.decodeText(schema as any, text), c.cite);
          return;
        }
        assert.equal(c.want, 'invalid', `fixture names unknown want ${c.want}`);
        let got: unknown;
        assert.throws(() => { got = nouns.decodeText(schema as any, text); }, `accepted ${JSON.stringify(got)} (${c.cite})`);
      });
    }
  }
});

test('B1-26 r3 Userland: whatever decode accepts, encode writes back with the same values and number spellings', async (t) => {
  const texts: Text[] = [
    ...(load('r3_wire_text.json').cases as Text[]).filter((c) => c.want === 'valid'),
    ...(load('r2_wire_text.json').cases as Text[]).filter((c) => c.want === 'valid'),
    ...load('valid.json').cases.map((c: any) => ({ name: `valid.json/${c.name}`, want: 'valid', text: JSON.stringify(c.value), cite: c.cite })),
  ];
  assert.ok(texts.length >= 70, `only ${texts.length} valid texts gathered`);
  for (const c of texts) {
    await t.test(c.name, () => {
      const text = textOf(c);
      const v = nouns.decodeText(label.LabelV1 as any, text);
      const out = JSON.stringify(label.LabelV1.encode(v));
      assert.equal(canonical(sourceTree(out)), canonical(sourceTree(text)), `encode(decode(text)) differs: ${out}`);
    });
  }
});

test('B1-26 r3 Userland: the join over p of zero is identical in every input order', async (t) => {
  const cases: { name: string; cite: string; own: any; inputs: { id: string; label: any; control?: boolean }[] }[] = load('r3_order.json').cases;
  for (const c of cases) {
    await t.test(c.name, () => {
      const decoded = c.inputs.map((i) => ({ id: i.id, label: label.LabelV1.decode(clone(i.label)), control: i.control ?? false }));
      let first: string | undefined;
      for (const order of permutations(decoded)) {
        const out = label.join(clone(c.own), order);
        assert.ok(!Object.is(out.confidence?.p, -0), `the join produced p -0 (${c.cite})`);
        const text = canonical(sourceTree(JSON.stringify(out)));
        if (first === undefined) first = text;
        else assert.equal(text, first, `the join depends on input order (${c.cite})`);
      }
    });
  }
});
