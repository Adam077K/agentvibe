// Userland's shared wire helpers: the plain-JSON-tree check, the plain-copy codec every wire record
// sits behind, and the JSON Schema export. Moved from nouns.ts by B1-26 so the label schema
// (label.ts) and the nouns (nouns.ts) run one implementation; label.ts owns LabelV1 and nouns.ts
// reads labels through it (DR-LABEL-RECONCILE:61, one reader).
import { types } from 'node:util';
import { z } from 'zod';
import type { ZodType } from 'zod';

// THE SAFE-INTEGER WIRE RULE (orchestrator decision, review round 2; I-JSON, RFC 7493 §2.2): a JSON
// number whose value is an integer outside ±(2^53-1) is refused EVERYWHERE on the wire, including
// inside raw fields. JSON.parse rounds such a number silently (9007199254740993 reads as
// 9007199254740992), so accepting it would re-encode different bytes from those the Kernel hashed.
// Every finite double of magnitude >= 2^53 is an integer, so on a parsed value the rule reduces to
// |v| <= 2^53-1 for integers. A non-finite value (1e400 parses to Infinity) has no JSON text and is
// refused as well.
export function isSafeWireNumber(v: number): boolean {
  return Number.isFinite(v) && (!Number.isInteger(v) || Number.isSafeInteger(v));
}

type PlainResult = { ok: true; value: unknown } | { ok: false; path: PropertyKey[]; message: string };

// plainCopy checks that v is a PLAIN JSON tree, the shape JSON.parse builds, and returns a fresh copy
// of it. Plain means: null, a boolean, a string, a number within the safe-integer rule, a dense
// Array whose only own keys are its indices and "length", or an object with prototype
// Object.prototype or null whose own keys are all enumerable data properties holding plain values.
// Refused, without running any of their code: a Proxy (its traps could answer differently on every
// read), a getter or setter, a sparse array (JSON.stringify writes its holes as null), a symbol key,
// a non-enumerable key (JSON.stringify skips it), a cycle, and anything else (undefined, bigint,
// function, Date, Map, class instances).
// The copy is built with defineProperty, never assignment, so an own "__proto__" key stays a key.
// Assignment is how z.json() lost it: assigning "__proto__" sets a prototype, not a key.
export function plainCopy(v: unknown, at: PropertyKey[] = [], open: Set<object> = new Set()): PlainResult {
  const fail = (message: string): PlainResult => ({ ok: false, path: at, message });
  if (v === null || typeof v === 'boolean' || typeof v === 'string') return { ok: true, value: v };
  if (typeof v === 'number') {
    return isSafeWireNumber(v) ? { ok: true, value: v } : fail('a number outside ±(2^53-1) is refused on the wire');
  }
  if (typeof v !== 'object') return fail(`a ${typeof v} is not JSON`);
  if (types.isProxy(v)) return fail('a Proxy is not a plain JSON value');
  if (open.has(v)) return fail('a cycle has no JSON text');
  const keys = Reflect.ownKeys(v);
  if (keys.some((k) => typeof k === 'symbol')) return fail('a symbol key is not JSON');
  open.add(v);
  try {
    const isArray = Array.isArray(v);
    const proto = Object.getPrototypeOf(v);
    if (isArray ? proto !== Array.prototype : proto !== Object.prototype && proto !== null) {
      return fail('not a plain object or array');
    }
    const out: Record<string, unknown> | unknown[] = isArray ? [] : {};
    if (isArray) {
      const n = (v as unknown[]).length;
      if (keys.length !== n + 1) return fail('an array holds a hole or a named property');
      for (let i = 0; i < n; i++) {
        if (!Object.hasOwn(v, i)) return fail(`an array has a hole at ${i}`);
      }
    }
    for (const k of keys as string[]) {
      if (isArray && k === 'length') continue;
      const d = Object.getOwnPropertyDescriptor(v, k)!;
      if (!('value' in d)) return fail(`key ${JSON.stringify(k)} is a getter or setter`);
      if (!d.enumerable) return fail(`key ${JSON.stringify(k)} is not enumerable`);
      const r = plainCopy(d.value, [...at, isArray ? Number(k) : k], open);
      if (!r.ok) return r;
      Object.defineProperty(out, k, { value: r.value, writable: true, enumerable: true, configurable: true });
    }
    return { ok: true, value: out };
  } finally {
    open.delete(v);
  }
}

export function plainIssue(v: unknown, ctx: z.core.$RefinementCtx<unknown>) {
  const r = plainCopy(v);
  if (!r.ok) ctx.addIssue({ code: 'custom', message: r.message, path: r.path, input: v });
}

// Each exported noun is its shape behind a plain-copy codec. Decode first refuses a value that is not
// a plain JSON tree (plainCopy), then validates a FRESH copy: the result shares no object with the
// caller's input, so a later mutation of either cannot reach the other, and a getter or Proxy cannot
// answer one way to the check and another way to the read. Encode validates the typed value, then
// copies the wire form the same way and checks it again.
// The object path cannot see a number's original text: prefer decodeText, which reads it.
const shapes = new WeakMap<ZodType, ZodType>();

export function wire<S extends ZodType>(shape: S) {
  const copy = (v: unknown) => {
    const r = plainCopy(v);
    return r.ok ? r.value : v; // a refused value never gets here on decode; on encode, the input check refuses it
  };
  const noun = z.codec(z.unknown().superRefine(plainIssue), shape as any, { decode: copy, encode: copy });
  shapes.set(noun, shape);
  return noun as unknown as z.ZodCodec<z.ZodUnknown, S>;
}

// toJSONSchema emits the JSON Schema (draft 2020-12) of the wire form: for an exported noun, its
// shape (the plain-copy step has no JSON Schema of its own; every JSON document is a plain tree), and
// within it each codec's input side, so a bigint is the decimal-string pattern, not a bigint. A
// schema that cannot be represented throws rather than emitting a looser document.
export function wireJSONSchema(schema: ZodType): Record<string, unknown> {
  const target = shapes.get(schema) ?? schema;
  return z.toJSONSchema(target, { io: 'input', target: 'draft-2020-12', unrepresentable: 'throw' }) as Record<string, unknown>;
}
