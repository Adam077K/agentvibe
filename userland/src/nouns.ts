// Userland's mirror of the Kernel's six nouns and Operation (docs/vision-v3/09a-ENGINEERING.md §3;
// the label record is §12.0) as Zod schemas over the wire JSON that kernel/internal/nouns encodes,
// plus the JSON Schema export 09a §2 names for Userland ("Zod -> JSON Schema").
//
// Frozen by B1-02's done-test (build/done-tests/B1-02.yml) so the test exists before the job does
// (docs/vision-v3/14-BUILD-PLAN.md §6). This file is the contract the job implements and is NOT
// registered; userland/test/nouns.donetest.test.ts is. Every export throws NotImplementedError until
// B1-02 lands; nothing here holds logic.
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
import type { ZodType } from 'zod';

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`nouns: ${what} not implemented`);
    this.name = 'NotImplementedError';
  }
}

// stub stands in for a schema: touching it in any way throws, so a test reaching it is red, never
// vacuously green.
function stub(name: string): ZodType {
  return new Proxy({}, {
    get() {
      throw new NotImplementedError(name);
    },
  }) as ZodType;
}

export const Label: ZodType = stub('Label');
export const Event: ZodType = stub('Event');
export const Job: ZodType = stub('Job');
export const Lease: ZodType = stub('Lease');
export const Effect: ZodType = stub('Effect');
export const Receipt: ZodType = stub('Receipt');
export const Operation: ZodType = stub('Operation');

export function toJSONSchema(schema: ZodType): Record<string, unknown> {
  throw new NotImplementedError('toJSONSchema');
}
