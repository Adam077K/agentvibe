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
//     SourceRef, Event.data) is any JSON value, passed through uncopied (see Raw): required where
//     09a §3 requires it, and otherwise unchecked, as nouns.go says.
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

// isJsonValue reports whether v is a value JSON.parse could have produced: null, a boolean, a string,
// a finite number, an array of JSON values, or a plain object (prototype Object.prototype or null)
// whose own string keys hold JSON values. It reads and never copies, so it cannot lose a key.
function isJsonValue(v: unknown, path: Set<object> = new Set()): boolean {
  if (v === null || typeof v === 'boolean' || typeof v === 'string') return true;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v !== 'object') return false; // undefined, bigint, function, symbol
  if (path.has(v)) return false; // a cycle has no JSON text
  path.add(v);
  try {
    if (Array.isArray(v)) return v.every((x) => isJsonValue(x, path));
    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== null) return false; // Date, Map, class instances
    if (Object.getOwnPropertySymbols(v).length > 0) return false;
    // An own "__proto__" key (JSON.parse creates one) is a plain data property here: indexing reads
    // the own value, which shadows the Object.prototype accessor.
    return Object.keys(v).every((k) => isJsonValue((v as Record<string, unknown>)[k], path));
  } finally {
    path.delete(v);
  }
}

// A type the canon names but does not define: any JSON value, carried unchecked, and carried AS IS.
// Decode returns the very value it was given, not a rebuilt copy. A rebuilt copy is how a key is
// lost: z.json() reconstructs each object by assignment, and assigning "__proto__" sets a prototype
// rather than a key, so {"__proto__":{…}} decoded to {} where Go's json.RawMessage keeps the bytes.
// The JSON Schema of a required raw field is {}: any JSON value.
const Raw = z.unknown().refine((v) => isJsonValue(v), { message: 'not a JSON value' });

// An OPTIONAL raw field (Event.rationale) obeys the optional-field rule as well: absent when unset,
// never null or "". The refinement is invisible to z.toJSONSchema, so the same rule is stated for
// the emitted schema in .meta(), whose keys z.toJSONSchema merges into the field's schema; the unit
// test checks the two agree.
const OptionalRaw = z
  .unknown()
  .refine((v) => isJsonValue(v) && v !== null && v !== '', {
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

export const Label = z.strictObject({
  schema: z.literal('label/1'),
  origin: z.enum(['founder', 'system_of_record', 'internal', 'public_web', 'customer', 'counterparty', 'synthetic']),
  dclass: z.enum(['D0', 'D1', 'D2', 'D3', 'D4']),
  boundary: z.enum(['open', 'guarded', 'sealed']),
  venture: Id, // a VentureId or "portfolio"; both are non-empty strings
  retention: z.strictObject({
    class: z.enum(['journal_metadata', 'operational', 'personal', 'client', 'synthetic']),
    hold: z.enum(['none', 'obligation', 'legal', 'safety', 'pinned']),
    deadline: OptionalString,
  }),
  permission: z.enum(['none', 'informs', 'may_authorise']),
  exportable: z.boolean(),
  taint: z.enum(['clean', 'untrusted', 'quarantined']),
  provenance: z.array(Raw),
  consent_scope: Id.optional(),
  confidence: z.number().optional(),
  subjects: z.array(Id).min(1).optional(), // omitempty in Go: an empty list is written by omitting it
  revocation_epoch: Uint,
});

export const Event = z.strictObject({
  id: Id,
  stream: z.string(),
  seq: z.int().min(1),
  type: z.string(),
  ts: z.string(),
  actor: Raw,
  correlation_id: Id,
  causation_id: Id.optional(),
  label: Label,
  rationale: OptionalRaw,
  snapshot_ref: Id.optional(),
  schema: z.int().min(1),
  data: Raw,
  prev_hash: Hex,
  hash: Hex,
});

export const Job = z.strictObject({
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
  label: Label,
  budget: Raw,
  lease_ids: z.array(Id),
  state: z.string(), // JobState: named by 09a §3, not enumerated there
});

export const Lease = z.strictObject({
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

export const Effect = z.strictObject({
  id: Id,
  operation_id: Id,
  attempt: z.int(),
  contract_ref: Id,
  snapshot_ref: Id,
  effect_class: z.enum(['R0', 'R1', 'R2', 'R3', 'R4']),
  idem_class: z.enum(['native_key', 'check_before', 'natural', 'at_most_once']),
  authorising_label: Label,
  approvals: z.array(Id),
  fencing_tokens: Raw,
  gateway_epoch: Uint64String,
  state: z.string(), // EffectState: named by 09a §3, not enumerated there
});

export const Receipt = z.strictObject({
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

export const Operation = z.strictObject({
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

// toJSONSchema emits the JSON Schema (draft 2020-12) of the wire form: the codec's input side, so a
// bigint is the decimal-string pattern, not a bigint. A schema that cannot be represented throws
// rather than emitting a looser document.
export function toJSONSchema(schema: ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, { io: 'input', target: 'draft-2020-12', unrepresentable: 'throw' }) as Record<string, unknown>;
}
