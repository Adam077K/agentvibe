// Userland's LabelV1 (docs/vision-v3/09a-ENGINEERING.md §12.0, DR-68): the Zod schema of the one label
// wire schema, the mapping 09a §12 publishes from 06's semantic names, the origin-by-author rule and
// the join. The Go twin is kernel/internal/label; both read kernel/internal/label/testdata/label/*.json.
//
// B1-26 (docs/vision-v3/14-BUILD-PLAN.md §6). The done-test is userland/test/label.donetest.test.ts,
// registered in build/done-tests/B1-26.yml; this file is the interface it tests and is NOT registered.
//
// CONTRACT (the wire rules are kernel/internal/label/label.go's)
//   - LabelV1.decode(wire) returns the label or throws; LabelV1.safeDecode(wire) returns {success};
//     LabelV1.encode(value) returns wire JSON. decode(fixture) deep-equals the fixture, and
//     JSON.stringify(encode(decode(fixture))) is the same JSON. A refusal for an unknown schema version
//     carries an issue whose path is `schema`.
//   - toJSONSchema(LabelV1) is the JSON Schema of the wire form, as plain JSON, such that a validator
//     built from it (z.fromJSONSchema) accepts every valid fixture and refuses every invalid one.
//   - mapLegacy(field, value) is 09a §12's mapping for one 06 name: an object of dotted LabelV1 paths to
//     wire values. A refusal throws LabelMappingError with code 'not_an_origin' or 'unknown_name'.
//   - originFor({kind, channel, task?}) returns the wire origin by author (09a §12, "a person's
//     contribution"); kind and channel take the values kernel/internal/label.Contributor documents.
//   - join(own, inputs) returns the wire label of a job's output: the join of every input
//     ({id, label, control?}), with own as its provenance and every input id in derived_from.
import type { ZodType } from 'zod';

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`label: ${what} not implemented`);
    this.name = 'NotImplementedError';
  }
}

export class LabelMappingError extends Error {
  code: 'not_an_origin' | 'unknown_name';
  constructor(code: 'not_an_origin' | 'unknown_name', message: string) {
    super(message);
    this.name = 'LabelMappingError';
    this.code = code;
  }
}

// stub stands in for the schema: touching it in any way throws, so a test reaching it is red, never
// vacuously green.
function stub(name: string): ZodType {
  return new Proxy({}, {
    get() {
      throw new NotImplementedError(name);
    },
  }) as ZodType;
}

export const LabelV1: ZodType = stub('LabelV1');

export function toJSONSchema(schema: ZodType): Record<string, unknown> {
  throw new NotImplementedError('toJSONSchema');
}

export function mapLegacy(field: string, value: unknown): Record<string, unknown> {
  throw new NotImplementedError('mapLegacy');
}

export type Contributor = { kind: string; channel: string; task?: string };

export function originFor(c: Contributor): string {
  throw new NotImplementedError('originFor');
}

export type JoinInput = { id: string; label: unknown; control?: boolean };

export function join(own: unknown, inputs: JoinInput[]): Record<string, any> {
  throw new NotImplementedError('join');
}
