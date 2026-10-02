// B1-26 done-test (docs/vision-v3/14-BUILD-PLAN.md:315): "Classification, boundary, retention class,
// retention deadline, permission, taint and origin round-trip as distinct fields; human provenance is a
// provenance field; every 06 label name maps to one wire name (DR-68)". This file is the Userland half
// (Zod -> JSON Schema, 09a-ENGINEERING.md:57). It reads the SAME bytes as the Go half,
// kernel/internal/label/testdata/label/*.json, each case citing the canon line it enforces. It is
// hash-registered in build/done-tests/B1-26.yml; editing it changes the job's acceptance, which is a
// register change, not a fix.
//
// Duplicate keys are the Go half's alone (TestB126RefusesDuplicateKeys): JSON.parse keeps the last
// value, so no Userland check can see one. Every other refusal is pinned in both languages.
//
// Run: node --test userland/test/label.donetest.test.ts   (Node 24 strips the types; no runner dep)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import * as label from '../src/label.ts';
import * as nouns from '../src/nouns.ts';

const FIXTURES = new URL('../../kernel/internal/label/testdata/label/', import.meta.url);
const load = (name: string) => JSON.parse(readFileSync(new URL(name, FIXTURES), 'utf8'));

const valid: { name: string; cite: string; value: any }[] = load('valid.json').cases;
const invalid: { name: string; error: string; why: string; cite: string; value: any }[] = load('invalid.json').cases;
const rows: { field: string; value: unknown; wire?: Record<string, unknown>; error?: string; cite: string }[] = load('mapping.json').rows;
const origins: { name: string; author: label.Contributor; origin: string; cite: string }[] = load('origin.json').cases;
const joins: { name: string; cite: string; own: any; inputs: { id: string; label: any; control?: boolean }[]; expect: any }[] =
  load('join.json').cases;

const MIN = valid.find((c) => c.name === 'label.min')!.value;
const clone = (v: unknown) => JSON.parse(JSON.stringify(v));

function setPath(obj: any, path: string, value: unknown) {
  const ks = path.split('.');
  let cur = obj;
  for (const k of ks.slice(0, -1)) cur = cur[k];
  cur[ks.at(-1)!] = clone(value);
}

function schemaIssue(r: any, c: { why: string }) {
  const paths = r.error.issues.map((i: { path: PropertyKey[] }) => i.path.map(String).join('.'));
  assert.ok(paths.includes('schema'), `refused, but no issue names the schema (${c.why}); issues at ${JSON.stringify(paths)}`);
}

test('B1-26 Userland: every valid LabelV1 decodes field for field and round-trips (09a:592-621)', async (t) => {
  assert.ok(valid.length >= 60, `valid.json holds ${valid.length} cases; the register froze 60`);
  for (const c of valid) {
    await t.test(c.name, () => {
      const v = label.LabelV1.decode(clone(c.value));
      assert.deepEqual(v, c.value, `decoded value differs from the wire (${c.cite})`);
      const text = JSON.stringify(label.LabelV1.encode(v));
      assert.deepEqual(JSON.parse(text), c.value, `encode(decode(fixture)) differs (${c.cite})`);
    });
  }
});

test('B1-26 Userland: unknown versions, values, keys, wrong types, nulls, empties and removed 06 names are refused (09a:588,594,644-663)', async (t) => {
  assert.ok(invalid.length >= 104, `invalid.json holds ${invalid.length} cases; the register froze 104`);
  assert.ok(invalid.filter((c) => c.name.startsWith('label.legacy-')).length >= 20, 'fewer than 20 removed-06-name cases');
  for (const c of invalid) {
    await t.test(c.name, () => {
      const r = label.LabelV1.safeDecode(clone(c.value));
      assert.equal(r.success, false, `accepted, but ${c.why} (${c.cite})`);
      if (c.error === 'unknown_schema') schemaIssue(r, c);
      else assert.equal(c.error, 'invalid', `fixture names unknown error ${JSON.stringify(c.error)}`);
    });
  }
});

test('B1-26 Userland: encode refuses every invalid label, as decode does (09a:588,594)', async (t) => {
  // Control first: an encode that throws on everything (a stub) must not pass as a refusal.
  assert.deepEqual(JSON.parse(JSON.stringify(label.LabelV1.encode(label.LabelV1.decode(clone(MIN))))), MIN, 'control: encode of a valid label');
  for (const c of invalid) {
    await t.test(c.name, () => {
      assert.throws(() => label.LabelV1.encode(clone(c.value)), (e: any) => !(e instanceof label.NotImplementedError),
        `encode wrote a label no reader accepts: ${c.why} (${c.cite})`);
    });
  }
});

test('B1-26 Userland: one reader, nouns.Label accepts and refuses exactly what LabelV1 does (DR-LABEL-RECONCILE:61; 09a:588)', async (t) => {
  // Control first: a nouns.Label that refuses everything must not pass the refusal half.
  assert.equal(nouns.Label.safeDecode(clone(MIN)).success, true, 'control: nouns.Label refuses a valid LabelV1');
  for (const c of valid) {
    await t.test(`accepts ${c.name}`, () => {
      const v = nouns.Label.decode(clone(c.value));
      assert.deepEqual(v, label.LabelV1.decode(clone(c.value)), `nouns.Label reads a LabelV1 differently (${c.cite})`);
      assert.deepEqual(JSON.parse(JSON.stringify(nouns.Label.encode(v))), c.value, 'nouns.Label does not round-trip a LabelV1');
    });
  }
  for (const c of invalid) {
    await t.test(`refuses ${c.name}`, () => {
      const r = nouns.Label.safeDecode(clone(c.value));
      assert.equal(r.success, false, `nouns.Label accepts it, but ${c.why} (${c.cite})`);
      if (c.error === 'unknown_schema') schemaIssue(r, c);
    });
  }
});

test('B1-26 Userland: the emitted JSON Schema accepts every valid and refuses every invalid label (09a:57)', async (t) => {
  // z.fromJSONSchema is Zod's own reader, the only validator in the repository (as in B1-02); it
  // reads the emitted document and nothing else, so an emitted {} or a dropped constraint fails.
  let validator: any;
  const v = () => {
    if (!validator) {
      const js = label.toJSONSchema(label.LabelV1);
      assert.deepEqual(JSON.parse(JSON.stringify(js)), js, 'the JSON Schema is not plain JSON');
      validator = z.fromJSONSchema(js as any);
    }
    return validator;
  };
  for (const c of valid) {
    await t.test(`accepts ${c.name}`, () => assert.equal(v().safeParse(clone(c.value)).success, true, c.cite));
  }
  for (const c of invalid) {
    await t.test(`refuses ${c.name}`, () => assert.equal(v().safeParse(clone(c.value)).success, false, `${c.why} (${c.cite})`));
  }
});

test('B1-26 Userland: every 06 name maps to exactly one wire value (09a:628-663, table test)', async (t) => {
  assert.ok(rows.length >= 54, `mapping.json holds ${rows.length} rows; the register froze 54`);
  for (const r of rows) {
    await t.test(`${r.field}=${JSON.stringify(r.value)}`, () => {
      if (r.error) {
        assert.throws(() => label.mapLegacy(r.field, clone(r.value)),
          (e: any) => e instanceof label.LabelMappingError && e.code === r.error, `want exactly ${r.error} (${r.cite})`);
        return;
      }
      const got = label.mapLegacy(r.field, clone(r.value));
      assert.deepEqual(JSON.parse(JSON.stringify(got)), r.wire, `exactly ${JSON.stringify(r.wire)} (${r.cite})`);
      assert.deepEqual(JSON.parse(JSON.stringify(label.mapLegacy(r.field, clone(r.value)))), r.wire, 'not deterministic');
      const m = clone(MIN);
      for (const [p, x] of Object.entries(got)) setPath(m, p, x);
      const ok = label.LabelV1.safeDecode(m);
      assert.equal(ok.success, true, `the mapped wire values do not form a LabelV1: ${JSON.stringify(m)}`);
    });
  }
});

test('B1-26 Userland: origin follows the author on every channel (09a:634; DR-LABEL-RECONCILE decisions 1,3,A,B,C,E,H,I,K,P)', async (t) => {
  assert.ok(origins.length >= 31, `origin.json holds ${origins.length} cases; the register froze 31`);
  for (const c of origins) {
    await t.test(c.name, () => assert.equal(label.originFor({ ...c.author }), c.origin, c.cite));
  }
});

const RANK: Record<string, number> = { none: 0, informs: 1, may_authorise: 2 };

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

function checkJoin(c: (typeof joins)[number], inputs: { id: string; label: any; control: boolean }[]) {
  if (c.expect.error) {
    // Decision M (DR-LABEL-RECONCILE:136): different ventures do not join; decision S (:156): different consent refs do not.
    assert.throws(() => label.join(clone(c.own), inputs), (e: any) => e instanceof label.LabelJoinError && e.code === c.expect.error, c.cite);
    return;
  }
  const o = JSON.parse(JSON.stringify(label.join(clone(c.own), inputs)));
  assert.equal(label.LabelV1.safeDecode(clone(o)).success, true, `the join is not a valid LabelV1: ${JSON.stringify(o)}`);
  const p = o.provenance;
  assert.deepEqual(p.author, c.own.author, "author is the output's own (09a:668)");
  assert.deepEqual(p.human_principal, c.own.human_principal, "human_principal is the output's own (09a:668-669)");
  assert.deepEqual(p.sources, c.own.sources, "sources are the output's own: provenance is not joined (09a:668)");
  const ids = new Set([...inputs.map((i) => i.id), ...c.own.derived_from]);
  for (const id of ids) assert.ok(p.derived_from.includes(id), `${id} not reachable through derived_from (09a:669)`);
  for (const i of inputs) {
    for (const anc of i.label.provenance.derived_from) {
      assert.ok(ids.has(anc) || !p.derived_from.includes(anc), `input ${i.id}'s ancestor ${anc} merged into derived_from (09a:668-670)`);
    }
  }
  const e = c.expect;
  if (e.identity_except_provenance) {
    const { provenance: _a, ...got } = o;
    const { provenance: _b, ...want } = inputs[0].label;
    assert.deepEqual(got, want, `the join of one label is not that label (${c.cite})`);
  }
  if (e.taint) assert.equal(o.taint, e.taint, c.cite);
  if (e.taint_not) assert.notEqual(o.taint, e.taint_not, c.cite);
  if (e.confidence_rung) assert.equal(o.confidence?.rung, e.confidence_rung, c.cite);
  if (e.boundary) assert.equal(o.boundary, e.boundary, c.cite);
  if (e.dclass) assert.equal(o.dclass, e.dclass, c.cite);
  if (e.exportable !== undefined) assert.equal(o.exportable, e.exportable, c.cite);
  if (e.retention_class) assert.equal(o.retention.class, e.retention_class, c.cite);
  if (e.retention_hold) assert.equal(o.retention.hold, e.retention_hold, c.cite);
  if (e.retention_deadline) assert.equal(o.retention.deadline, e.retention_deadline, c.cite);
  if (e.consent_scope) assert.equal(o.consent_scope, e.consent_scope, c.cite);
  if (e.origin) assert.equal(o.origin, e.origin, c.cite);
  if (e.venture) assert.equal(o.venture, e.venture, c.cite);
  if (e.subjects) assert.deepEqual([...(o.subjects ?? [])].sort(), [...e.subjects].sort(), `subjects are the union (${c.cite})`);
  if (e.revocation_epoch !== undefined) assert.equal(o.revocation_epoch, e.revocation_epoch, `the newer epoch (${c.cite})`);
  if (e.permission_at_most) {
    assert.ok(o.permission in RANK && RANK[o.permission] <= RANK[e.permission_at_most],
      `permission ${o.permission} widens past ${e.permission_at_most} (${c.cite})`);
  }
}

test('B1-26 Userland: the join, over every order of its inputs (09a:665-670; 06:180 L1, 06:187 L8; 09a:602; decisions F, J, M-O, Q-T)', async (t) => {
  assert.ok(joins.length >= 50, `join.json holds ${joins.length} cases; the register froze 50`);
  for (const c of joins) {
    const decoded = c.inputs.map((i) => ({ id: i.id, label: label.LabelV1.decode(clone(i.label)), control: i.control ?? false }));
    for (const order of permutations(decoded)) {
      await t.test(`${c.name}/${order.map((i) => i.id).join(',')}`, () => checkJoin(c, order));
    }
  }
});

test("B1-26 Userland: venture 'founder' is a wire value (09a:598; DR-LABEL-RECONCILE:107, decision G)", () => {
  const m = { ...clone(MIN), venture: 'founder' };
  const v = label.LabelV1.decode(m);
  assert.equal(v.venture, 'founder');
  assert.equal(JSON.parse(JSON.stringify(label.LabelV1.encode(v))).venture, 'founder');
  const j = label.join(clone(m.provenance), [{ id: 'rec_founder_note', label: v }]);
  assert.equal(j.venture, 'founder', 'a join over founder memory keeps venture founder (06:180)');
});
