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
//   - ONE READER (DR-LABEL-RECONCILE:61): nouns.Label accepts and refuses exactly what LabelV1 does.
//     An optional field is absent when unset, never null, "" or []; integers stay within ±(2^53-1).
//   - LabelV1.encode refuses whatever decode refuses.
//   - toJSONSchema(LabelV1) is the JSON Schema of the wire form, as plain JSON, such that a validator
//     built from it (z.fromJSONSchema) accepts every valid fixture and refuses every invalid one.
//   - mapLegacy(field, value) is 09a §12's mapping for one 06 name: an object of dotted LabelV1 paths to
//     wire values. A refusal throws LabelMappingError with code 'not_an_origin' or 'unknown_name'.
//   - originFor({kind, channel, task?}) returns the wire origin by author (09a §12, "a person's
//     contribution"); kind and channel take the values kernel/internal/label.Contributor documents.
//   - join(own, inputs) returns the wire label of a job's output: the join of every input
//     ({id, label, control?}), whatever their order, with own as its provenance and every input id in
//     derived_from; strictest wins for dclass, retention, exportable and consent_scope.
//
// CHOICES THIS FILE MAKES (the same as label.go's, so the two languages agree)
//   - Every *Id/*Ref string is non-empty; author.title is any string; the optional strings are absent
//     rather than ""; confidence.p is any number within the safe-integer rule.
//   - The OPEN items of DR-LABEL-RECONCILE are refused, never guessed: originFor throws
//     LabelUndecidedError, join throws LabelJoinError with code 'undecided' (or 'cross_venture' with
//     undecided = true for founder + portfolio with no venture input). See label.go's Join for the list.
import { z } from 'zod';
import type { ZodType } from 'zod';
import { wire, wireJSONSchema } from './wire.ts';

// Retained from the frozen stub's export surface. Nothing in this file throws it now that B1-26 has
// landed; it stays exported because the contract fixed the module's exports.
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

// LabelUndecidedError: the case is OPEN in DR-LABEL-RECONCILE-2026-10-01; refused, not guessed.
export class LabelUndecidedError extends Error {
  constructor(message: string) {
    super(`label: the canon leaves this case OPEN (DR-LABEL-RECONCILE); refused, not guessed: ${message}`);
    this.name = 'LabelUndecidedError';
  }
}

const ORIGINS = ['founder', 'system_of_record', 'internal', 'public_web', 'customer', 'counterparty', 'synthetic'] as const;
const DCLASSES = ['D0', 'D1', 'D2', 'D3', 'D4'] as const; // higher is stricter
const BOUNDARIES = ['open', 'guarded', 'sealed'] as const; // higher is stricter (06 L8)
const CLASSES = ['journal_metadata', 'operational', 'personal', 'client', 'synthetic'] as const;
const HOLDS = ['none', 'obligation', 'legal', 'safety', 'pinned'] as const;
const PERMISSIONS = ['none', 'informs', 'may_authorise'] as const; // lower is narrower
const TAINTS = ['clean', 'untrusted', 'quarantined'] as const; // higher is less trusted
const FAMILIES = ['claude', 'codex', 'founder', 'human', 'system'] as const;
const ROLES = ['founder', 'collaborator', 'contractor', 'customer'] as const;
const RUNGS = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5'] as const; // lower is weaker
// Decision Q, most trusted first; public_web and synthetic have no place in it (OPEN).
const ORIGIN_TRUST = ['founder', 'system_of_record', 'internal', 'customer', 'counterparty'];
// Decision R, strictest last; where journal_metadata sits is OPEN.
const CLASS_STRICT = ['synthetic', 'operational', 'client', 'personal'];

const Id = z.string().min(1);
const OptionalString = z.string().min(1).optional();

const SourceRef = z.strictObject({ ref: Id, quote: OptionalString, accessed: OptionalString, system_of_record: OptionalString });
const PrincipalRef = z.strictObject({ id: Id, role: z.enum(ROLES) });
const Provenance = z.strictObject({
  sources: z.array(SourceRef),
  derived_from: z.array(Id),
  author: z.strictObject({ title: z.string(), family: z.enum(FAMILIES), mission: OptionalString }),
  human_principal: PrincipalRef.optional(),
});
// The safe-integer wire rule as bounds: past ±(2^53-1) every double is an integer.
const Confidence = z.strictObject({
  rung: z.enum(RUNGS),
  p: z.number().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER).optional(),
});

// LabelShape is LabelV1's wire shape; nouns.ts nests it in Event, Job and Effect.
export const LabelShape = z.strictObject({
  schema: z.literal('label/1'),
  origin: z.enum(ORIGINS),
  dclass: z.enum(DCLASSES),
  boundary: z.enum(BOUNDARIES),
  venture: Id, // a VentureId, "portfolio" or "founder"
  retention: z.strictObject({ class: z.enum(CLASSES), hold: z.enum(HOLDS), deadline: OptionalString }),
  permission: z.enum(PERMISSIONS),
  exportable: z.boolean(),
  taint: z.enum(TAINTS),
  provenance: Provenance,
  consent_scope: Id.optional(),
  confidence: Confidence.optional(),
  subjects: z.array(Id).min(1).optional(), // omitempty in Go: an empty list is written by omitting it
  revocation_epoch: z.int().min(0),
});

export const LabelV1 = wire(LabelShape);

export function toJSONSchema(schema: ZodType): Record<string, unknown> {
  return wireJSONSchema(schema);
}

const unknownName = (field: string, value: unknown) =>
  new LabelMappingError('unknown_name', `label: no wire name for 06 ${field} ${JSON.stringify(value)}`);

function mapRecord(path: string, schema: ZodType, field: string, value: unknown): Record<string, unknown> {
  const r = schema.safeParse(value);
  if (!r.success) throw unknownName(field, value);
  return { [path]: JSON.parse(JSON.stringify(r.data)) };
}

// mapLegacy: only the rows 09a §12 publishes map; anything else is unknown_name, never a best guess.
export function mapLegacy(field: string, value: unknown): Record<string, unknown> {
  const s = typeof value === 'string' ? value : undefined;
  const has = (xs: readonly string[]) => s !== undefined && xs.includes(s);
  switch (field) {
    case 'data_class': {
      const d: Record<string, Record<string, unknown>> = {
        public: { dclass: 'D0' }, internal: { dclass: 'D1' }, personal: { dclass: 'D2' },
        confidential: { dclass: 'D3' }, sealed: { dclass: 'D3', boundary: 'sealed' },
      };
      if (s !== undefined && Object.hasOwn(d, s)) return { ...d[s] };
      break;
    }
    case 'origin': {
      if (has(ORIGINS)) return { origin: s };
      const legacy: Record<string, string> = {
        system: 'system_of_record', web: 'public_web', worker: 'internal', participant: 'counterparty', external: 'counterparty',
      };
      if (s !== undefined && Object.hasOwn(legacy, s)) return { origin: legacy[s] };
      if (s === 'collaborator') {
        throw new LabelMappingError('not_an_origin',
          'label: origin collaborator is the channel origin plus provenance.human_principal (09a §12); use originFor');
      }
      break;
    }
    case 'consent_scope':
    case 'venture':
    case 'retention_deadline':
      if (s) return { [field === 'retention_deadline' ? 'retention.deadline' : field]: s };
      break;
    case 'taint':
      if (has(TAINTS)) return { taint: s };
      break;
    case 'authority':
      if (has(PERMISSIONS)) return { permission: s };
      break;
    case 'exportable':
      if (typeof value === 'boolean') return { exportable: value };
      break;
    case 'tainted':
      if (typeof value === 'boolean') return { taint: value ? 'untrusted' : 'clean' };
      break;
    case 'retention':
      if (s === 'ordinary') return { 'retention.hold': 'none' };
      if (s === 'synthetic') return { 'retention.class': 'synthetic', 'retention.hold': 'none', exportable: false };
      if (s !== 'none' && has(HOLDS)) return { 'retention.hold': s };
      break;
    case 'permission':
      if (s === 'data_only') return { permission: 'informs' };
      if (s === 'non_exportable') return { exportable: false };
      break;
    case 'subjects':
      if (Array.isArray(value) && value.length > 0 && value.every((x) => typeof x === 'string' && x !== '')) {
        return { subjects: [...value] };
      }
      break;
    case 'envelope.confidence':
      return mapRecord('confidence', Confidence, field, value);
    case 'envelope.provenance':
      return mapRecord('provenance', Provenance, field, value);
    case 'provenance.human_principal':
      return mapRecord('provenance.human_principal', PrincipalRef, field, value);
  }
  throw unknownName(field, value);
}

export type Contributor = { kind: string; channel: string; task?: string };

// 16-EXTERNAL-WORLD-HUMANS.md:556's HumanTask.kind.
const HUMAN_TASK_KINDS = ['signature', 'notarization', 'physical', 'human_only_call', 'licensed_review',
  'taste_panel', 'kyc', 'local_presence', 'contribution', 'participant'];

// originFor mirrors label.go's OriginFor, refusal for refusal: an unknown kind, channel or task is
// unknown_name; a panel task on a customer's behalf is OPEN (decision P vs decision B).
export function originFor(c: Contributor): string {
  const task = c.task ?? '';
  if (c.channel === 'human_task') {
    if (!HUMAN_TASK_KINDS.includes(task)) throw new LabelMappingError('unknown_name', `label: HumanTask kind ${JSON.stringify(task)} (16:556)`);
  } else if (['email', 'form', 'room'].includes(c.channel)) {
    if (task !== '') throw new LabelMappingError('unknown_name', `label: a task ${JSON.stringify(task)} on channel ${c.channel}`);
  } else {
    throw new LabelMappingError('unknown_name', `label: channel ${JSON.stringify(c.channel)}`);
  }
  const panel = c.channel === 'human_task' && (task === 'participant' || task === 'taste_panel');
  switch (c.kind) {
    case 'founder':
      return 'founder';
    case 'agent':
      if (c.channel === 'human_task') throw new LabelMappingError('unknown_name', 'label: an agent on a HumanTask; a HumanTask is a person\'s');
      return 'internal';
    case 'collaborator':
      return 'internal';
    case 'contractor':
    case 'outsider':
      return 'counterparty';
    case 'customer':
      return panel ? 'counterparty' : 'customer'; // decisions B and K: a panel is counterparty
    case 'customer_proxy':
      if (panel) throw new LabelUndecidedError(`a ${task} task on a customer's behalf (decision P vs decision B)`);
      return 'customer';
  }
  throw new LabelMappingError('unknown_name', `label: contributor kind ${JSON.stringify(c.kind)}`);
}

export type JoinInput = { id: string; label: unknown; control?: boolean };

// LabelJoinError: join refused. code 'cross_venture': inputs from different ventures (decision M);
// 'consent_conflict': two different consent refs (decision S); 'undecided': a case the canon leaves
// OPEN. `undecided` is also true on the cross_venture refusal of founder + portfolio with no venture.
export class LabelJoinError extends Error {
  code: 'cross_venture' | 'consent_conflict' | 'undecided';
  undecided: boolean;
  constructor(code: 'cross_venture' | 'consent_conflict' | 'undecided', message: string, undecided = code === 'undecided') {
    super(message);
    this.name = 'LabelJoinError';
    this.code = code;
    this.undecided = undecided;
  }
}

const highest = (order: readonly string[], vals: string[]) => order[Math.max(...vals.map((v) => order.indexOf(v)))];
const lowest = (order: readonly string[], vals: string[]) => order[Math.min(...vals.map((v) => order.indexOf(v)))];
const distinct = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => x !== undefined && x !== ''))].sort();

// join mirrors label.go's Join field for field; see its comment for every rule and every OPEN refusal.
export function join(own: unknown, inputs: JoinInput[]): Record<string, any> {
  if (inputs.length === 0) throw new Error('label: a join of no inputs');
  const ls = inputs.map((i) => {
    if (typeof i.id !== 'string' || i.id === '') throw new Error('label: an input with no record id');
    return LabelV1.decode(i.label) as any;
  });
  const set = (get: (l: any) => string | undefined) => distinct(ls.map(get));
  const out: Record<string, any> = { schema: 'label/1' };

  // Venture (decisions M, T).
  const vs = set((l) => l.venture);
  const ventures = vs.filter((v) => v !== 'founder' && v !== 'portfolio');
  if (ventures.length > 1) throw new LabelJoinError('cross_venture', `label: join across ventures ${ventures.join(', ')}`);
  if (ventures.length === 1) out.venture = ventures[0];
  else if (vs.includes('founder') && vs.includes('portfolio')) {
    throw new LabelJoinError('cross_venture', 'label: founder and portfolio inputs with no venture input (OPEN)', true);
  } else out.venture = vs[0];

  // Consent (decision S): identical refs only; an input with none does not narrow it.
  const cs = set((l) => l.consent_scope);
  if (cs.length > 1) throw new LabelJoinError('consent_conflict', `label: join across consent scopes ${cs.join(', ')}`);
  if (cs.length === 1) out.consent_scope = cs[0];

  // Origin (decisions N, Q).
  const os = set((l) => l.origin);
  if (os.length === 1) out.origin = os[0];
  else if (os.some((o) => !ORIGIN_TRUST.includes(o))) throw new LabelJoinError('undecided', `label: origins ${os.join(', ')} are not in the trust order (OPEN)`);
  else out.origin = highest(ORIGIN_TRUST, os);

  out.dclass = highest(DCLASSES, set((l) => l.dclass));
  out.boundary = highest(BOUNDARIES, set((l) => l.boundary));

  // Retention (decisions J, O, R).
  const cl = set((l) => l.retention.class);
  let cls: string;
  if (cl.length === 1) cls = cl[0];
  else if (cl.includes('journal_metadata')) throw new LabelJoinError('undecided', `label: retention classes ${cl.join(', ')}; journal_metadata is unordered (OPEN)`);
  else cls = highest(CLASS_STRICT, cl);
  let hs = set((l) => l.retention.hold);
  let hold: string;
  if (hs.includes('legal')) hold = 'legal';
  else {
    hs = hs.filter((h) => h !== 'none');
    if (hs.length > 1) throw new LabelJoinError('undecided', `label: holds ${hs.join(', ')} carry no duration on the wire (OPEN)`);
    hold = hs[0] ?? 'none';
  }
  out.retention = { class: cls, hold };
  const deadlines = ls.map((l) => l.retention.deadline).filter((d): d is string => d !== undefined);
  if (deadlines.length !== 0) {
    if (deadlines.length !== ls.length) throw new LabelJoinError('undecided', 'label: a retention.deadline against an absent one is unordered (OPEN)');
    let best = '';
    let bestT = -Infinity;
    for (const d of deadlines) {
      const t = rfc3339(d);
      if (t === undefined) throw new LabelJoinError('undecided', `label: retention.deadline ${JSON.stringify(d)} is not RFC 3339 (OPEN)`);
      if (t > bestT || (t === bestT && d > best)) [best, bestT] = [d, t];
    }
    out.retention.deadline = best;
  }

  out.permission = lowest(PERMISSIONS, set((l) => l.permission));
  out.exportable = ls.every((l) => l.exportable === true);
  out.taint = highest(TAINTS, set((l) => l.taint));

  out.provenance = provenanceOf(own, inputs);

  // Confidence (decision F): lowest rung and lowest p; absent if any input has none.
  if (ls.every((l) => l.confidence !== undefined)) {
    const conf: Record<string, unknown> = { rung: lowest(RUNGS, ls.map((l) => l.confidence.rung)) };
    if (ls.every((l) => l.confidence.p !== undefined)) conf.p = Math.min(...ls.map((l) => l.confidence.p));
    out.confidence = conf;
  }

  const subjects = distinct(ls.flatMap((l) => l.subjects ?? []));
  if (subjects.length > 0) out.subjects = subjects;
  out.revocation_epoch = Math.max(...ls.map((l) => l.revocation_epoch));

  // Field order does not matter on the wire; encode validates the result as decode would.
  return LabelV1.encode(LabelV1.decode(out)) as Record<string, any>;
}

// provenanceOf: provenance is not joined (09a §12). The output's own record, with every own
// derived_from id (deduplicated, in order) and then every input id not already there, sorted.
function provenanceOf(own: unknown, inputs: JoinInput[]): Record<string, unknown> {
  const p = JSON.parse(JSON.stringify(own ?? {}));
  if (p.sources === undefined) p.sources = [];
  const derived: string[] = [...new Set<string>(Array.isArray(p.derived_from) ? p.derived_from : [])];
  const ids = [...new Set(inputs.map((i) => i.id))].filter((id) => !derived.includes(id)).sort();
  p.derived_from = [...derived, ...ids];
  return p;
}

const RFC3339 = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$/;

function rfc3339(s: string): number | undefined {
  if (!RFC3339.test(s)) return undefined;
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : t;
}
