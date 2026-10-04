// B1-26 done-test, round 2 (re-freeze r2 after the implementation review of build/b1-26 @ 4a5094e,
// 2026-10-02). Userland half; kernel/internal/label/label_r2_donetest_test.go runs the SAME vectors from
// kernel/internal/label/testdata/label/r2_{deadlines,wire_text,order}.json, so the two languages cannot
// pick different answers. Hash-registered in build/done-tests/B1-26.yml.
//
// Wire text is read through nouns.decodeText, "THE way to read wire JSON text in Userland" (nouns.ts),
// for both nouns.Label and label.LabelV1: a JSON.parse'd object has already lost a duplicate key and
// the spelling of -0 or 1.0, so only the text path can refuse them.
//
// Run: node --test userland/test/label.r2.donetest.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as label from '../src/label.ts';
import * as nouns from '../src/nouns.ts';

const FIXTURES = new URL('../../kernel/internal/label/testdata/label/', import.meta.url);
const load = (name: string) => JSON.parse(readFileSync(new URL(name, FIXTURES), 'utf8'));
const clone = (v: unknown) => JSON.parse(JSON.stringify(v));
const MIN = load('valid.json').cases.find((c: any) => c.name === 'label.min').value;

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

// canonical sorts object keys only; array order is kept, because array order is what is under test.
function canonical(v: any): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
}

test('B1-26 r2 Userland: one deadline grammar orders a join; anything else is undecided (orchestrator ruling 2026-10-02)', async (t) => {
  const cases: { name: string; deadlines: (string | null)[]; want: string; cite: string }[] = load('r2_deadlines.json').cases;
  assert.ok(cases.length >= 31, `r2_deadlines.json holds ${cases.length} cases; the register froze 31`);
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
        const out = label.join(clone(order[0].label.provenance), order);
        assert.equal(out.retention.deadline ?? '', c.want, c.cite);
      });
    }
  }
});

test('B1-26 r2 Userland: non-canonical integers, duplicate and case-variant keys are refused on the text path', async (t) => {
  const cases: { name: string; want: string; text: string; cite: string }[] = load('r2_wire_text.json').cases;
  assert.ok(cases.length >= 17, `r2_wire_text.json holds ${cases.length} cases; the register froze 17`);
  for (const c of cases) {
    for (const [which, schema] of [['nouns.Label', nouns.Label], ['label.LabelV1', label.LabelV1]] as const) {
      await t.test(`${c.name}/${which}`, () => {
        if (c.want === 'valid') {
          assert.deepEqual(clone(nouns.decodeText(schema as any, c.text)), JSON.parse(c.text), `control refused (${c.cite})`);
          return;
        }
        assert.equal(c.want, 'invalid', `fixture names unknown want ${c.want}`);
        let got: unknown;
        assert.throws(() => { got = nouns.decodeText(schema as any, c.text); }, `accepted ${JSON.stringify(got)} (${c.cite})`);
      });
    }
  }
});

test('B1-26 r2 Userland: the encoded join is byte-identical over every input order (09a:665; 06:180 L1)', async (t) => {
  const cases: { name: string; cite: string; own: any; inputs: { id: string; label: any; control?: boolean }[] }[] = load('r2_order.json').cases;
  assert.ok(cases.length >= 3, `r2_order.json holds ${cases.length} cases; the register froze 3`);
  for (const c of cases) {
    await t.test(c.name, () => {
      const decoded = c.inputs.map((i) => ({ id: i.id, label: label.LabelV1.decode(clone(i.label)), control: i.control ?? false }));
      const ps = new Set(decoded.map((i) => i.label.confidence?.p).filter((p) => p !== undefined));
      let first: string | undefined;
      let firstOrder = '';
      for (const order of permutations(decoded)) {
        const out = clone(label.join(clone(c.own), order));
        if (out.confidence?.p !== undefined) assert.ok(ps.has(out.confidence.p), `confidence.p ${out.confidence.p} is no input's p (${c.cite})`);
        const text = canonical(out);
        const ids = order.map((i) => i.id).join(',');
        if (first === undefined) { first = text; firstOrder = ids; continue; }
        assert.equal(text, first, `the join depends on input order: ${firstOrder} vs ${ids} (${c.cite})`);
      }
    });
  }
});
