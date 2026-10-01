// B1-02 done-test (docs/vision-v3/14-BUILD-PLAN.md §6): "Round-trip fixtures in both languages; an
// upcaster cannot change a past decision's meaning (replay test)". This file is the Userland half
// (Zod -> JSON Schema, 09a §2). It reads the SAME bytes as the Go half,
// kernel/internal/nouns/testdata/nouns/{valid,invalid}.json, so a fixture edit changes both
// languages' acceptance at once. It is hash-registered in build/done-tests/B1-02.yml; editing it
// changes the job's acceptance, which is a register change, not a fix. The replay half is Go-only:
// upcasters are Kernel code (09a §4.1).
//
// Run: node --test userland/test/nouns.donetest.test.ts   (Node 24 strips the types; no runner dep)
//
// JSON.parse note: invalid.json's lease.fencing-token-number holds 9007199254740993, which
// JavaScript reads as 9007199254740992. It is refused for being a number at all, so the rounding
// cannot turn it valid. valid.json holds no number beyond 2^53; every bigint there is a string.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import * as nouns from '../src/nouns.ts';

const FIXTURES = new URL('../../kernel/internal/nouns/testdata/nouns/', import.meta.url);

function load(name: string) {
  return JSON.parse(readFileSync(new URL(name, FIXTURES), 'utf8'));
}

const kinds = ['event', 'job', 'lease', 'effect', 'receipt', 'label', 'operation'];

// Resolved lazily: the stub throws on touch, and that must fail a test, not the file's load.
function schemaOf(kind: string): any {
  switch (kind) {
    case 'event': return nouns.Event;
    case 'job': return nouns.Job;
    case 'lease': return nouns.Lease;
    case 'effect': return nouns.Effect;
    case 'receipt': return nouns.Receipt;
    case 'label': return nouns.Label;
    case 'operation': return nouns.Operation;
  }
  throw new Error(`fixture names unknown kind ${JSON.stringify(kind)}`);
}

const valid: { name: string; kind: string; value: unknown }[] = load('valid.json').cases;
const invalid: { name: string; kind: string; error: string; why: string; value: unknown }[] =
  load('invalid.json').cases;

// pins check decoded values directly, so a decode that loses a value and an encode that happens to
// restore its text cannot pass. Bigints are compared exactly, whichever type decode chose.
const pins: Record<string, (v: any) => void> = {
  'lease.full': (v) => {
    assert.equal(BigInt(v.fencing_token), 9007199254740993n, 'fencing_token');
    assert.equal(BigInt(v.epoch), 18446744073709551615n, 'epoch');
  },
  'effect.full': (v) => {
    assert.equal(BigInt(v.gateway_epoch), 9007199254740995n, 'gateway_epoch');
    assert.equal(v.authorising_label.permission, 'may_authorise');
  },
  'label.full': (v) => {
    assert.equal(v.confidence, 0, 'confidence 0 is a value, not an absence');
    assert.equal(v.exportable, true);
  },
  'label.min': (v) => {
    assert.equal(v.exportable, false);
    assert.deepEqual(v.provenance, []);
  },
};

function countKinds(cases: { kind: string }[]) {
  const seen: Record<string, number> = {};
  for (const c of cases) seen[c.kind] = (seen[c.kind] ?? 0) + 1;
  return seen;
}

test('B1-02 Userland: every valid fixture decodes and round-trips to identical JSON', async (t) => {
  const seen = countKinds(valid);
  for (const k of kinds) {
    assert.ok((seen[k] ?? 0) >= 2, `valid.json holds ${seen[k] ?? 0} ${k} fixture(s); want a full and a minimal one`);
  }
  for (const c of valid) {
    await t.test(c.name, () => {
      const s = schemaOf(c.kind);
      const v = s.decode(c.value);
      const wire = s.encode(v);
      const text = JSON.stringify(wire); // throws on a bigint left in the wire form
      assert.deepEqual(JSON.parse(text), c.value, 'JSON.stringify(encode(decode(fixture))) differs from the fixture');
      pins[c.name]?.(v);
    });
  }
});

test('B1-02 Userland: every invalid fixture is refused', async (t) => {
  const seen = countKinds(invalid);
  for (const k of kinds) assert.ok((seen[k] ?? 0) >= 1, `invalid.json holds no ${k} fixture`);
  for (const c of invalid) {
    await t.test(c.name, () => {
      const r = schemaOf(c.kind).safeDecode(c.value);
      assert.equal(r.success, false, `accepted, but ${c.why}`);
      if (c.error === 'unknown_schema') {
        // The refusal must be about the label's version, not incidental to some other key.
        const paths = r.error.issues.map((i: { path: PropertyKey[] }) => i.path.map(String).join('.'));
        assert.ok(paths.some((p: string) => p === 'schema' || p.endsWith('.schema')),
          `refused, but no issue names the label schema (${c.why}); issues at ${JSON.stringify(paths)}`);
      } else {
        assert.equal(c.error, 'invalid', `fixture names unknown error ${JSON.stringify(c.error)}`);
      }
    });
  }
});

test('B1-02 Userland: the emitted JSON Schema accepts every valid and refuses every invalid fixture', async (t) => {
  // The validator is Zod's own z.fromJSONSchema: the repository holds no other JSON Schema
  // validator and this freeze adds no dependency beyond zod. It is not independent of Zod, but it
  // does read the emitted document and nothing else, so an emitted {} or a dropped constraint fails.
  const validators = new Map<string, any>();
  const validatorFor = (kind: string) => {
    if (!validators.has(kind)) {
      const js = nouns.toJSONSchema(schemaOf(kind));
      assert.deepEqual(JSON.parse(JSON.stringify(js)), js, `${kind}: the JSON Schema is not plain JSON`);
      validators.set(kind, z.fromJSONSchema(js as any));
    }
    return validators.get(kind);
  };
  for (const c of valid) {
    await t.test(`accepts ${c.name}`, () => {
      const r = validatorFor(c.kind).safeParse(c.value);
      assert.equal(r.success, true, `the ${c.kind} JSON Schema refuses a valid fixture: ${r.error?.message}`);
    });
  }
  for (const c of invalid) {
    await t.test(`refuses ${c.name}`, () => {
      const r = validatorFor(c.kind).safeParse(c.value);
      assert.equal(r.success, false, `the ${c.kind} JSON Schema accepts it, but ${c.why}`);
    });
  }
});
