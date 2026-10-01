// Unit tests for userland/src/nouns.ts beyond the frozen B1-02 done-test (nouns.donetest.test.ts).
// Each block pins a review-round-1 finding (2026-10-01) and fails on the pre-fix code, ddbcefa.
// Every check runs twice: against the Zod schema (decode) and against the emitted JSON Schema, so
// the two cannot drift apart on these rules.
//
// Run: node --test userland/test/nouns.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import * as nouns from '../src/nouns.ts';

const FIXTURES = new URL('../../kernel/internal/nouns/testdata/nouns/', import.meta.url);
const valid: { name: string; value: any }[] =
  JSON.parse(readFileSync(new URL('valid.json', FIXTURES), 'utf8')).cases;

// A fresh deep copy of a valid fixture, so a mutation never leaks between tests.
function fixture(name: string): any {
  const c = valid.find((v) => v.name === name);
  if (!c) throw new Error(`no valid fixture ${name}`);
  return JSON.parse(JSON.stringify(c.value));
}

function jsonSchemaValidator(schema: any) {
  return z.fromJSONSchema(nouns.toJSONSchema(schema) as any);
}

function refuses(schema: any, value: unknown, why: string) {
  assert.equal(schema.safeDecode(value).success, false, `decode accepts it, but ${why}`);
  assert.equal(jsonSchemaValidator(schema).safeParse(value).success, false, `the JSON Schema accepts it, but ${why}`);
}

function accepts(schema: any, value: unknown, what: string) {
  const r = schema.safeDecode(value);
  assert.equal(r.success, true, `decode refuses ${what}: ${r.error?.message}`);
  const j = jsonSchemaValidator(schema).safeParse(value);
  assert.equal(j.success, true, `the JSON Schema refuses ${what}: ${j.error?.message}`);
}

// Finding p1: nouns.go's wire rule is "an optional field is ABSENT when unset, never null or ''".
// Every optional field of every noun, audited against nouns.go's `omitempty` tags.
const optionalFields: { kind: string; base: string; path: string[] }[] = [
  { kind: 'Label', base: 'label.full', path: ['retention', 'deadline'] },
  { kind: 'Label', base: 'label.full', path: ['consent_scope'] },
  { kind: 'Event', base: 'event.full', path: ['causation_id'] },
  { kind: 'Event', base: 'event.full', path: ['rationale'] },
  { kind: 'Event', base: 'event.full', path: ['snapshot_ref'] },
  { kind: 'Job', base: 'job.full', path: ['parent_job'] },
  { kind: 'Lease', base: 'lease.full', path: ['responsibility_ref'] },
  { kind: 'Operation', base: 'operation.full', path: ['reservation'] },
  { kind: 'Receipt', base: 'receipt.full', path: ['provider_ref'] },
  { kind: 'Receipt', base: 'receipt.full', path: ['provider_response_digest'] },
];

function setPath(obj: any, path: string[], value: unknown) {
  let o = obj;
  for (const k of path.slice(0, -1)) o = o[k];
  o[path[path.length - 1]] = value;
}

test('p1: an optional field is absent, never null or the empty string', async (t) => {
  for (const f of optionalFields) {
    const schema = (nouns as any)[f.kind];
    for (const bad of [null, '']) {
      await t.test(`${f.kind}.${f.path.join('.')} = ${JSON.stringify(bad)}`, () => {
        const v = fixture(f.base);
        setPath(v, f.path, bad);
        refuses(schema, v, `${f.path.join('.')} is optional, so it is absent, never ${JSON.stringify(bad)}`);
      });
    }
  }
});

test('p1: the nested label carries the same rule', () => {
  const v = fixture('event.full');
  v.label.retention.deadline = '';
  refuses(nouns.Event, v, 'a nested label is validated, and deadline is never ""');
});

test('p1 control: a non-empty value in each optional field is still accepted', () => {
  // The fixtures' own values; the refusals above must be about null and "", not the field.
  for (const f of optionalFields) accepts((nouns as any)[f.kind], fixture(f.base), `${f.base}`);
  const v = fixture('event.full');
  v.rationale = 'a string rationale';
  accepts(nouns.Event, v, 'a non-empty string rationale');
});

// Finding p2: Label.subjects is `omitempty` in Go, so an empty list is the absent form, not a value.
test('p2: Label.subjects is absent or non-empty, never []', () => {
  const v = fixture('label.full');
  v.subjects = [];
  refuses(nouns.Label, v, 'an empty subjects list is written by omitting it');
  const e = fixture('event.full');
  e.label.subjects = [];
  refuses(nouns.Event, e, 'a nested label is validated');
});

// Finding high: a raw JSON field must keep its bytes. JSON.parse creates an OWN property named
// "__proto__"; copying that object key by key through assignment sets a prototype instead, and the
// key vanishes. Go's json.RawMessage keeps it.
const rawFields: { kind: string; base: string; path: string[] }[] = [
  { kind: 'Event', base: 'event.full', path: ['data'] },
  { kind: 'Event', base: 'event.full', path: ['actor'] },
  { kind: 'Event', base: 'event.full', path: ['rationale'] },
  { kind: 'Job', base: 'job.full', path: ['budget'] },
  { kind: 'Effect', base: 'effect.full', path: ['fencing_tokens'] },
  { kind: 'Operation', base: 'operation.full', path: ['target'] },
];

test('high: a __proto__ key inside a raw JSON field is kept, not dropped', async (t) => {
  const payload = '{"__proto__":{"polluted":1},"deep":[{"__proto__":2}]}';
  for (const f of rawFields) {
    await t.test(`${f.kind}.${f.path.join('.')}`, () => {
      const v = fixture(f.base);
      setPath(v, f.path, JSON.parse(payload));
      const wire = JSON.stringify(v);
      const schema = (nouns as any)[f.kind];
      const decoded = schema.decode(JSON.parse(wire));
      assert.equal(JSON.stringify(schema.encode(decoded)), wire, 'round trip lost bytes');
      let raw = decoded;
      for (const k of f.path) raw = raw[k];
      assert.ok(Object.hasOwn(raw, '__proto__'), '__proto__ is no longer an own key');
      assert.equal(({} as any).polluted, undefined, 'Object.prototype was polluted');
    });
  }
  await t.test('Label.provenance[0]', () => {
    const v = fixture('label.full');
    v.provenance = [JSON.parse(payload)];
    const wire = JSON.stringify(v);
    const out = JSON.stringify(nouns.Label.encode(nouns.Label.decode(JSON.parse(wire))));
    assert.equal(out, wire, 'round trip lost bytes');
  });
});

test('raw JSON fields are still required where required, and still JSON', () => {
  const v = fixture('event.min');
  delete v.data;
  refuses(nouns.Event, v, 'data is required');
  const ok = nouns.Event.decode(fixture('event.min'));
  assert.equal(nouns.Event.safeEncode({ ...ok, data: 1n }).success, false, 'a bigint is not JSON');
  assert.equal(nouns.Event.safeEncode({ ...ok, data: { f: () => 1 } }).success, false, 'a function is not JSON');
  assert.equal(nouns.Event.safeEncode({ ...ok, data: new Date(0) }).success, false, 'a Date is not plain JSON');
});

// Review round 2, finding p1: an integer outside ±(2^53-1) is refused everywhere on the wire,
// including inside raw fields (orchestrator decision; I-JSON). JSON.parse would round it, and the
// re-encoded bytes would differ from those the Kernel hashed.

// withLiteral returns the fixture's wire TEXT with the JSON literal `lit` written at `path`.
function withLiteral(base: string, path: string[], lit: string): string {
  const v = fixture(base);
  setPath(v, path, '__LITERAL__');
  return JSON.stringify(v).replace('"__LITERAL__"', lit);
}

const unsafeSpots: { kind: string; base: string; path: string[] }[] = [
  { kind: 'Event', base: 'event.full', path: ['data'] },
  { kind: 'Event', base: 'event.full', path: ['rationale'] },
  { kind: 'Job', base: 'job.full', path: ['budget'] },
  { kind: 'Effect', base: 'effect.full', path: ['fencing_tokens'] },
  { kind: 'Operation', base: 'operation.full', path: ['target'] },
  { kind: 'Label', base: 'label.full', path: ['confidence'] },
];

const unsafeLiterals = [
  '{"n":9007199254740993}',
  '{"n":-9007199254740993}',
  '[1,[9007199254740992]]',
  '{"n":1e16}',
  '{"n":1e400}',
];

test('p1 r2: decodeText refuses an unsafe integer inside a raw field, before rounding', async (t) => {
  for (const s of unsafeSpots) {
    const lits = s.path[0] === 'confidence' ? ['9007199254740993', '1e16', '-1e16'] : unsafeLiterals;
    for (const lit of lits) {
      await t.test(`${s.kind}.${s.path.join('.')} = ${lit}`, () => {
        const text = withLiteral(s.base, s.path, lit);
        assert.throws(() => (nouns as any).decodeText((nouns as any)[s.kind], text),
          (e: Error) => e.name === 'WireError', 'want a WireError naming the number as written');
      });
    }
  }
});

test('p1 r2: the object path refuses the rounded value too', async (t) => {
  for (const s of unsafeSpots) {
    await t.test(`${s.kind}.${s.path.join('.')}`, () => {
      const lit = s.path[0] === 'confidence' ? '9007199254740993' : '{"n":9007199254740993}';
      const value = JSON.parse(withLiteral(s.base, s.path, lit));
      assert.equal((nouns as any)[s.kind].safeDecode(value).success, false,
        'a rounded integer was accepted, and would re-encode as different bytes');
    });
  }
});

test('p1 r2 control: the safe boundary is accepted and round-trips byte for byte', () => {
  for (const lit of ['{"n":9007199254740991}', '{"n":-9007199254740991}', '{"x":0.1,"y":-2.5e-7}']) {
    const text = withLiteral('event.full', ['data'], lit);
    const decoded = (nouns as any).decodeText(nouns.Event, text);
    assert.equal(JSON.stringify(nouns.Event.encode(decoded)), text, `${lit} did not round-trip`);
  }
  const text = withLiteral('label.full', ['confidence'], '9007199254740991');
  assert.equal(JSON.stringify(nouns.Label.encode((nouns as any).decodeText(nouns.Label, text))), text);
});

test('p1 r2: decodeText reads every valid fixture as text and round-trips it exactly', () => {
  const kinds: Record<string, any> = {
    event: nouns.Event, job: nouns.Job, lease: nouns.Lease, effect: nouns.Effect,
    receipt: nouns.Receipt, label: nouns.Label, operation: nouns.Operation,
  };
  const cases: { name: string; kind: string; value: unknown }[] =
    JSON.parse(readFileSync(new URL('valid.json', FIXTURES), 'utf8')).cases;
  for (const c of cases) {
    const text = JSON.stringify(c.value);
    const s = kinds[c.kind];
    assert.equal(JSON.stringify(s.encode((nouns as any).decodeText(s, text))), text, c.name);
  }
});

test('p1 r2: parseWire keeps an own __proto__ key and refuses text that is not JSON', () => {
  const v: any = (nouns as any).parseWire('{"__proto__":{"polluted":1}}');
  assert.ok(Object.hasOwn(v, '__proto__'));
  assert.equal(({} as any).polluted, undefined);
  assert.throws(() => (nouns as any).parseWire('{"a":'), SyntaxError);
});
