// Userland's mirror of the Kernel's six nouns and Operation (docs/vision-v3/09a-ENGINEERING.md §3;
// the label record is §12.0) as Zod schemas over the wire JSON that kernel/internal/nouns encodes,
// plus the JSON Schema export 09a §2 names for Userland ("Zod -> JSON Schema").
//
// B1-02 (docs/vision-v3/14-BUILD-PLAN.md §6). The done-test is userland/test/nouns.donetest.test.ts,
// registered in build/done-tests/B1-02.yml; this file is the interface it tests and is NOT registered.
//
// CONTRACT
//   - Each schema validates ONE noun's wire JSON under the wire rules in kernel/internal/nouns/nouns.go
//     (the same rules, the same fixtures: kernel/internal/nouns/testdata/nouns/*.json). In short:
//     09a §3's snake_case keys; an unknown key is refused, not dropped; an optional key is absent,
//     never null; closed enums are closed; bigints (Lease.fencing_token, Lease.epoch,
//     Effect.gateway_epoch) are decimal strings on the wire, and a JSON number there is refused;
//     Hex is 64 lowercase hex characters; a Label whose schema is not "label/1" is refused, wherever
//     it sits; Event.seq and Event.schema are >= 1; every *Id and *Ref is a non-empty string.
//   - decodeText(schema, text) reads wire JSON TEXT and is the preferred entry point; see parseWire.
//   - schema.decode(wire) returns the typed value or throws; schema.encode(value) returns wire JSON.
//     encode(decode(wire)), serialised with JSON.stringify, is the same JSON as wire. Whether a
//     bigint decodes to a bigint or stays a decimal string is the job's choice; its value is exact.
//   - toJSONSchema(schema) returns the JSON Schema of the WIRE form of that schema (what decode
//     accepts), as plain JSON, such that a validator built from it (z.fromJSONSchema) accepts every
//     valid fixture and refuses every invalid one.
//
// CHOICES THIS FILE MAKES (each one the contract leaves open)
//   - A bigint decodes to a JavaScript bigint and encodes back to its decimal string (a z.codec).
//   - The decimal string is canonical: no sign, no leading zero, no exponent. "007" is refused because
//     encode(decode("007")) would be "7", breaking the round-trip identity above. Its value is bounded
//     by 2^64-1, the range of the Go field it mirrors (uint64); the bound is written into the regex,
//     not a refinement, so the emitted JSON Schema refuses exactly what decode refuses.
//   - Every other integer is a JSON number held to the JavaScript safe range (z.int()). A uint64 in Go
//     (Event.seq, Label.revocation_epoch) is >= 0 here; nothing else gets a bound nouns.go does not state.
//     An integer above 2^53-1 is refused here by decision (orchestrator, review round 1); Go aligns.
//     ACCEPTED MISMATCH: the integer texts 1.0, 1e0 and -0 are value-equal to 1, 1 and 0 once
//     JSON.parse has read them, so Userland cannot see the spelling and accepts them where Go's int
//     decoding may refuse; encode writes the canonical form (1, 1, 0). No code addresses this.
//   - A type the canon names but does not define (Actor, Rationale, Target, Budget, TokenSet,
//     SourceRef, Event.data) is any JSON value, copied key for key (see plainCopy): required where
//     09a §3 requires it, and otherwise unchecked, as nouns.go says.
//   - Decode accepts only a plain JSON tree and returns a fresh value (see wire). It refuses a Proxy,
//     a getter, a sparse array, and the rest that plainCopy lists.
//   - A ULID (Event.id, Event.causation_id) is held to the *Id rule, non-empty, and no further: the
//     wire rules state no ULID syntax check.
import { z } from 'zod';
import type { ZodType } from 'zod';

// Retained from the frozen stub's export surface. Nothing in this file throws it now that B1-02 has
// landed; it stays exported because the contract fixed the module's exports.
export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`nouns: ${what} not implemented`);
    this.name = 'NotImplementedError';
  }
}

// decimalAtMost returns a regex source matching the canonical decimal form (no sign, no leading
// zero) of every integer in [0, max], and nothing else. Computed from max's digits, so the bound is
// stated once.
function decimalAtMost(max: bigint): string {
  const d = max.toString();
  const n = d.length;
  const alts = ['0'];
  if (n >= 2) alts.push(n === 2 ? '[1-9][0-9]?' : `[1-9][0-9]{0,${n - 2}}`);
  // n digits: share max's first i digits, then go below max's digit at i, then anything.
  for (let i = 0; i < n; i++) {
    const di = Number(d[i]);
    const lo = i === 0 ? 1 : 0;
    if (di - 1 < lo) continue;
    const range = di - 1 === lo ? String(lo) : `[${lo}-${di - 1}]`;
    const rest = n - i - 1;
    alts.push(d.slice(0, i) + range + (rest === 0 ? '' : rest === 1 ? '[0-9]' : `[0-9]{${rest}}`));
  }
  if (max > 0n) alts.push(d);
  return `^(?:${alts.join('|')})$`;
}

const UINT64_MAX = 18446744073709551615n;

// A Go uint64 tagged `,string`: a canonical decimal string on the wire, a bigint in Userland.
const Uint64String = z.codec(
  z.string().regex(new RegExp(decimalAtMost(UINT64_MAX))),
  z.bigint().min(0n).max(UINT64_MAX),
  {
    decode: (s) => BigInt(s),
    encode: (b) => b.toString(),
  },
);

// Hex is a SHA-256: 64 lowercase hex characters.
const Hex = z.string().regex(/^[0-9a-f]{64}$/);

// Every *Id and *Ref type is a non-empty string.
const Id = z.string().min(1);

// Every OPTIONAL string field is absent when unset, never null or "" (nouns.go wire rules). Audited
// against every `omitempty` tag in nouns.go: the Id/Hex-typed ones (consent_scope, causation_id,
// snapshot_ref, parent_job, responsibility_ref, reservation, provider_response_digest) already refuse
// "" by their type; the two plain strings, Label.retention.deadline and Receipt.provider_ref, use this.
const OptionalString = z.string().min(1).optional();


// The plain-JSON helpers are wire.ts's, shared with label.ts; the label is label.ts's LabelV1 itself
// (DR-LABEL-RECONCILE:61: one label/1 reader), not a second copy of its schema.
import { isSafeWireNumber, plainIssue, wire, wireJSONSchema } from './wire.ts';
import { LabelShape, LabelV1 } from './label.ts';

const NUMBER_TEXT = /^-?(0|[1-9][0-9]*)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/;

const MAX_SAFE_DIGITS = String(Number.MAX_SAFE_INTEGER); // "9007199254740991", 16 digits

// isUnsafeIntegerLiteral decides from a JSON number's SOURCE TEXT, by exact value and not notation,
// whether it is an integer of magnitude > 2^53-1. It never materialises the value: the literal is
// normalised to core digits (no leading or trailing zero) x 10^exp, which is an integer exactly when
// exp >= 0, and then compared with 9007199254740991 by digit count and, at equal count, as digit
// strings. Only safe Numbers and strings no longer than 16 digits are built, so
// 1e99999999999999999999 costs what 1e9 costs (a BigInt of mantissa x 10^exp would not).
// Unsafe integers: 9007199254740993.0, 9.007199254740993e15, 9007199254740992e0, 1e300.
// Not: 1.5, 1.5e-3, 9007199254740991.0, 90071992547409910e-1, 1e-99999999999999999999.
function isUnsafeIntegerLiteral(source: string): boolean {
  const m = NUMBER_TEXT.exec(source);
  if (m === null) return true; // not a JSON number literal: JSON.parse never hands us one
  const frac = m[2] ?? '';
  const digits = (m[1] + frac).replace(/^0+/, '');
  if (digits === '') return false; // zero, in any spelling
  const core = digits.replace(/0+$/, '');
  // exp = written exponent - fraction length + trailing zeros. The last two are bounded by the source
  // length; the written exponent is not, so read it as text first.
  const written = m[3] ?? '0';
  const negative = written.startsWith('-');
  const magnitude = written.replace(/^[+-]/, '').replace(/^0+/, '') || '0';
  const shift = digits.length - core.length - frac.length; // |shift| <= source length
  if (magnitude.length > 15) {
    // |written exponent| >= 10^15 dwarfs any shift a real source can carry: the sign decides.
    return !negative; // hugely positive: an integer with far more than 16 digits; negative: a fraction
  }
  const exp = (negative ? -Number(magnitude) : Number(magnitude)) + shift; // a safe integer
  if (exp < 0) return false; // a last digit that is not 0 sits after the point: not an integer
  const count = core.length + exp; // the integer's digit count
  if (count !== MAX_SAFE_DIGITS.length) return count > MAX_SAFE_DIGITS.length;
  return core + '0'.repeat(exp) > MAX_SAFE_DIGITS; // equal length: digit strings compare as values
}

// WireError: the JSON text breaks a wire rule that JSON.parse's result could no longer show.
export class WireError extends Error {
  constructor(message: string) {
    super(`nouns: ${message}`);
    this.name = 'WireError';
  }
}

// parseWire is THE way to read wire JSON text in Userland. It is JSON.parse with a reviver that reads
// each number's source text (context.source, Node >= 21) and refuses an integer outside ±(2^53-1)
// BEFORE JSON.parse's rounding can hide it, so the refusal names the number as written. It throws
// SyntaxError for text that is not JSON and WireError for an unsafe number. The value it returns is
// freshly built by JSON.parse: plain objects and arrays, nobody else's references, and an own
// "__proto__" key kept as a key.
export function parseWire(text: string): unknown {
  return JSON.parse(text, (key: string, value: unknown, context?: { source?: string }) => {
    if (typeof value !== 'number') return value;
    const source = context?.source;
    if (source === undefined) {
      // Without the source text the rounding is invisible; refuse to pretend otherwise.
      throw new WireError('JSON.parse reviver context.source is unavailable in this runtime (Node >= 21)');
    }
    if (isUnsafeIntegerLiteral(source)) {
      throw new WireError(`${source} at key ${JSON.stringify(key)} is an integer outside ±(2^53-1)`);
    }
    // A NON-integer literal can still parse to a double past 2^53-1 (9007199254740993.5 reads as
    // 9007199254740994; every double that large is an integer), and its re-encoded text would then
    // differ from the bytes read. The value rule (isSafeWireNumber) refuses it here, as the object
    // path would. This is stricter than "refuse unsafe integers" alone; see the session file.
    if (!isSafeWireNumber(value)) {
      throw new WireError(`${source} at key ${JSON.stringify(key)} reads as ${value}, outside ±(2^53-1)`);
    }
    return value;
  });
}

// decodeText(schema, text) = schema.decode(parseWire(text)). PREFER IT over schema.decode(object):
// an object that came from a plain JSON.parse has already been rounded. The object path still refuses
// every unsafe integer it can see (the rounded value is itself unsafe), but it cannot tell the
// number's original spelling, and it trusts its caller to have parsed the right bytes.
export function decodeText<S extends ZodType>(schema: S, text: string): z.output<S> {
  return schema.decode(parseWire(text)) as z.output<S>;
}

// A type the canon names but does not define: any JSON value, carried unchecked. Inside a noun, the
// value is already a fresh copy (see wire below); the field's own check is what refuses a non-JSON
// value handed to encode. The JSON Schema of a required raw field is {}: any JSON value.
const Raw = z.unknown().superRefine(plainIssue);

// An OPTIONAL raw field (Event.rationale) obeys the optional-field rule as well: absent when unset,
// never null or "". The refinement is invisible to z.toJSONSchema, so the same rule is stated for
// the emitted schema in .meta(), whose keys z.toJSONSchema merges into the field's schema; the unit
// test checks the two agree.
const OptionalRaw = z
  .unknown()
  .superRefine(plainIssue)
  .refine((v) => v !== null && v !== '', {
    message: 'an optional field is absent when unset, never null or ""',
  })
  .meta({
    anyOf: [
      { type: 'string', minLength: 1 },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array' },
      { type: 'object' },
    ],
  })
  .optional();

const Uint = z.int().min(0);

const EventShape = z.strictObject({
  id: Id,
  stream: z.string(),
  seq: z.int().min(1),
  type: z.string(),
  ts: z.string(),
  actor: Raw,
  correlation_id: Id,
  causation_id: Id.optional(),
  label: LabelShape,
  rationale: OptionalRaw,
  snapshot_ref: Id.optional(),
  schema: z.int().min(1),
  data: Raw,
  prev_hash: Hex,
  hash: Hex,
});

const JobShape = z.strictObject({
  id: Id,
  venture: Id,
  record_ref: Id,
  model_id: z.string(),
  family: z.string(), // open: 'claude'|'codex'|string
  headless: z.boolean(),
  parent_job: Id.optional(),
  provider_mode: z.enum(['sub', 'api']),
  isolation: z.enum(['I1', 'I2', 'I3', 'I4']),
  context_profile: Id,
  tool_lease: z.strictObject({
    allowed: z.array(z.string()),
    forbidden: z.array(z.string()),
  }),
  label: LabelShape,
  budget: Raw,
  lease_ids: z.array(Id),
  state: z.string(), // JobState: named by 09a §3, not enumerated there
});

const LeaseShape = z.strictObject({
  id: Id,
  resource: z.string(),
  holder: Id,
  responsibility_ref: Id.optional(),
  fencing_token: Uint64String,
  epoch: Uint64String,
  mode: z.enum(['excl', 'shared']),
  kind: z.enum(['optimistic', 'pessimistic']),
  expires_at: z.string(),
});

const EffectShape = z.strictObject({
  id: Id,
  operation_id: Id,
  attempt: z.int(),
  contract_ref: Id,
  snapshot_ref: Id,
  effect_class: z.enum(['R0', 'R1', 'R2', 'R3', 'R4']),
  idem_class: z.enum(['native_key', 'check_before', 'natural', 'at_most_once']),
  authorising_label: LabelShape,
  approvals: z.array(Id),
  fencing_tokens: Raw,
  gateway_epoch: Uint64String,
  state: z.string(), // EffectState: named by 09a §3, not enumerated there
});

const ReceiptShape = z.strictObject({
  effect_id: Id,
  operation_id: Id,
  attempt: z.int(),
  request_digest: Hex,
  provider_ref: OptionalString,
  provider_response_digest: Hex.optional(),
  observed_at: z.string(),
  issuer: z.enum(['gateway', 'treasury', 'runner', 'merge_queue']),
  sig: z.string(),
  chain_prev: Hex,
});

const OperationShape = z.strictObject({
  id: Id,
  venture: Id,
  verb: z.string(),
  target: Raw,
  business_key: z.string(),
  payload_digest: Hex,
  amendments: z.array(Id),
  reservation: Id.optional(),
  state: z.enum(['open', 'settled', 'failed', 'compensated', 'human']),
});


// Label is LabelV1 (label.ts), the same object: it accepts and refuses exactly what LabelV1 does.
export const Label = LabelV1;
export const Event = wire(EventShape);
export const Job = wire(JobShape);
export const Lease = wire(LeaseShape);
export const Effect = wire(EffectShape);
export const Receipt = wire(ReceiptShape);
export const Operation = wire(OperationShape);

// toJSONSchema emits the JSON Schema (draft 2020-12) of the wire form: for an exported noun, its
// shape (the plain-copy step has no JSON Schema of its own; every JSON document is a plain tree), and
// within it each codec's input side, so a bigint is the decimal-string pattern, not a bigint. A
// schema that cannot be represented throws rather than emitting a looser document.
export function toJSONSchema(schema: ZodType): Record<string, unknown> {
  return wireJSONSchema(schema);
}
