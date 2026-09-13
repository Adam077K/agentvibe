#!/usr/bin/env node
/**
 * vision-capability-requirements.mjs — projects docs/vision-system/coverage/capability-requirements.json
 * from planning/specification/capabilities.json, which is the only place the 46 contracts live.
 *
 * POSTURE: reports. Nothing in CI runs it yet — say so rather than implying a gate.
 *
 * Why a script and not an edit: G-01 finding G1-01 is that the register reported
 * contract_location / implementation_location / evaluation_evidence as null on all 46
 * capabilities while every contract existed — so a reviewer navigating directive §8.4
 * through the register concluded that zero capabilities had contracts. Hand-filling 46 rows
 * fixes today's reading and drifts again on the next contract edit; a projector cannot.
 *
 * Two commands, mirroring scripts/vision-wk-bindings.mjs:
 *
 *   verify            Recomputes the register from the source and fails on any divergence,
 *                     plus the §8.4 field checks below. Exit 1 on drift.
 *   project [--write] Rewrites the register. Without --write it reports and exits 1 if the
 *                     file would change.
 *
 * Invariants checked by `verify`:
 *   K1  the register names exactly the source capability ids, in source order
 *   K2  every projected field equals its recomputed value (this is the G1-01 check)
 *   K3  every one of the eleven directive-§8.4 required fields resolves in the contract to a
 *       non-empty value, and the register's pointer to it resolves to that same value
 *   K4  the implementation stage is derived, not written: exactly one stage of
 *       planning/implementation-graph.json names the company CAP procedures
 *   K5  register-only fields (invariants, required_capability_fields) survive projection
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VS = 'docs/vision-system/';
const SRC = VS + 'planning/specification/capabilities.json';
const GRAPH = VS + 'planning/implementation-graph.json';
const REG = VS + 'coverage/capability-requirements.json';
const SRC_REL = 'planning/specification/capabilities.json'; // as cited from inside coverage/
const REVIEW_REL = 'planning/reviews/G-01-completeness-vision-coverage.md';

const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const write = (rel, obj) =>
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The eleven fields directive §8.4 requires of a capability, mapped to the key that carries
 * each in capabilities.json. The register already declares the eleven names in
 * `required_capability_fields`; this is the other half of that declaration — where each one
 * actually is — and K3 checks the two agree, so the names cannot drift away from the keys.
 */
const REQUIRED_FIELD_KEYS = {
  purpose: ['purpose'],
  inputs: ['inputs'],
  outputs: ['outputs'],
  dependencies: ['dependencies'],
  authority: ['authority'],
  'consequence class': ['consequence_classes'],
  'evidence produced': ['evidence_produced'],
  'evaluation method': ['evaluation', 'method'],
  'implementation mode': ['implementation_mode'],
  'failure behavior': ['failure_behavior'],
  'removal or replacement criteria': ['replacement_removal'],
};

/** Fields the register derives from the source. A field here is never hand-edited. */
const PROJECTED_FIELDS = [
  'concern',
  'source_fields',
  'required_outcome',
  'contract_location',
  'implementation_location',
  'planned_owner_component',
  'planned_procedure_id',
  'evaluation_evidence',
  'required_field_locations',
  'completion_claim',
];

const pointer = (segs) => segs.map((s) => String(s).replace(/~/g, '~0').replace(/\//g, '~1')).join('/');
const at = (obj, segs) => segs.reduce((cur, s) => (cur == null ? undefined : cur[s]), obj);

const isEmpty = (v) =>
  v === undefined ||
  v === null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0);

/**
 * Fields where an empty list is an answer rather than a silence: "this capability depends on
 * nothing" is a claim, and two of the 46 make it. A missing key is still a failure — the
 * distinction the check has to keep is between "declared none" and "never written".
 */
const MAY_BE_EMPTY_LIST = new Set(['dependencies']);

/**
 * Which construction stage builds the 46 capability procedures. Derived from the graph's own
 * text rather than written down here, because a stage id in a comment is a pin that rots:
 * B04 reads "All company CAP procedures … All 46 capabilities remain connected."
 */
const CAP_STAGE_PREDICATE = /all company cap procedures/i;

function capStage(graph) {
  const hits = graph.stages.filter((s) => CAP_STAGE_PREDICATE.test(s.components_and_contracts));
  return { hits, id: hits.length === 1 ? hits[0].id : null };
}

function projectedFor(cap, i, stageId) {
  const required_field_locations = {};
  for (const [name, segs] of Object.entries(REQUIRED_FIELD_KEYS)) {
    required_field_locations[name] = `${SRC_REL}#/${pointer(['capabilities', i, ...segs])}`;
  }
  return {
    concern: cap.concern,
    source_fields: [...cap.source_fields],
    required_outcome: cap.required_outcome,
    contract_location: `${SRC_REL}#/${pointer(['capabilities', i])}`,
    implementation_location: `planned-not-existing: ${stageId}`,
    planned_owner_component: cap.owner_component,
    planned_procedure_id: cap.procedure_id,
    evaluation_evidence: `${SRC_REL}#/${pointer(['capabilities', i, 'evaluation', 'method'])}`,
    required_field_locations,
    completion_claim: cap.completion_claim,
  };
}

const STATUS =
  'Contract authored for every capability in ' +
  SRC_REL +
  '; implementation not started (no module exists); independent review: see ' +
  REVIEW_REL +
  '. Contract authored is not accepted and is not implemented.';

const generationRule = (graph, stageId) => ({
  generated_by: 'scripts/vision-capability-requirements.mjs',
  generated_from: SRC_REL,
  hand_edit: 'refused — run `node scripts/vision-capability-requirements.mjs project --write`; `verify` fails on drift',
  contract_location_rule: 'JSON pointer to the capability contract in ' + SRC_REL,
  evaluation_evidence_rule: "JSON pointer to that contract's evaluation.method",
  implementation_location_rule:
    'No module exists for any of the 46. The value names the construction stage that builds them, ' +
    'derived as the unique stage of planning/implementation-graph.json whose components_and_contracts ' +
    'matches /all company CAP procedures/i — currently ' +
    stageId +
    ': "' +
    graph.stages.find((s) => s.id === stageId).components_and_contracts +
    '"',
  required_field_locations_rule:
    'One pointer per directive §8.4 required field, into the same contract. A reviewer navigating ' +
    '§8.4 through this register reaches the contract text, which was the G1-01 counterexample.',
  repair_state: 'G1-01 repaired, pending independent recheck',
});

function build(src, graph, prev, stageId) {
  const out = {
    schema_version: prev.schema_version,
    kind: prev.kind,
    source: prev.source,
    reason: prev.reason,
    status: STATUS,
    generation: generationRule(graph, stageId),
    capabilities: src.capabilities.map((cap, i) => ({
      id: cap.id,
      ...projectedFor(cap, i, stageId),
    })),
    invariants: prev.invariants,
    required_capability_fields: prev.required_capability_fields,
  };
  return out;
}

function checks(src, graph, reg) {
  const fail = [];
  const { hits, id: stageId } = capStage(graph);
  if (!stageId)
    fail.push(
      `K4 implementation stage: ${hits.length} stages match /all company CAP procedures/i (need exactly 1)` +
        (hits.length ? ': ' + hits.map((s) => s.id).join(', ') : '')
    );

  // K1 — id set and order.
  const srcIds = src.capabilities.map((c) => c.id);
  const regIds = (reg.capabilities || []).map((c) => c.id);
  if (!eq(srcIds, regIds)) fail.push(`K1 register ids differ from source ids (${regIds.length} vs ${srcIds.length})`);

  // K3 — the eleven §8.4 fields resolve to non-empty values, and the declared names agree.
  const declared = reg.required_capability_fields || [];
  const known = Object.keys(REQUIRED_FIELD_KEYS);
  if (!eq([...declared].sort(), [...known].sort()))
    fail.push(`K3 required_capability_fields ${JSON.stringify(declared)} != the mapped names ${JSON.stringify(known)}`);
  src.capabilities.forEach((cap, i) => {
    for (const [name, segs] of Object.entries(REQUIRED_FIELD_KEYS)) {
      const v = at(cap, segs);
      const emptyListIsAnAnswer = MAY_BE_EMPTY_LIST.has(name) && Array.isArray(v);
      if (v === undefined) fail.push(`K3 ${cap.id}: §8.4 field "${name}" (${segs.join('.')}) is absent from the contract`);
      else if (isEmpty(v) && !emptyListIsAnAnswer)
        fail.push(`K3 ${cap.id}: §8.4 field "${name}" (${segs.join('.')}) is empty in the contract`);
    }
    const row = (reg.capabilities || [])[i];
    if (!row) return;
    for (const [name, segs] of Object.entries(REQUIRED_FIELD_KEYS)) {
      const want = `${SRC_REL}#/${pointer(['capabilities', i, ...segs])}`;
      if ((row.required_field_locations || {})[name] !== want)
        fail.push(`K3 ${cap.id}: pointer for "${name}" is ${JSON.stringify((row.required_field_locations || {})[name])}, should be ${want}`);
    }
  });

  // K2 — every projected field equals its recomputed value.
  if (stageId) {
    src.capabilities.forEach((cap, i) => {
      const row = (reg.capabilities || [])[i];
      if (!row || row.id !== cap.id) return;
      const want = projectedFor(cap, i, stageId);
      for (const f of PROJECTED_FIELDS) {
        if (f === 'required_field_locations') continue; // covered by K3, with a per-field message
        if (!eq(row[f], want[f])) fail.push(`K2 ${cap.id}.${f}: ${JSON.stringify(row[f])} should be ${JSON.stringify(want[f])}`);
      }
    });
  }

  // K5 — register-only fields survive.
  for (const f of ['invariants', 'required_capability_fields', 'schema_version', 'kind', 'source', 'reason']) {
    if (isEmpty(reg[f])) fail.push(`K5 register-only field ${f} is missing or empty`);
  }
  if (reg.status !== STATUS) fail.push('K5 status is not the projected status string');
  if (!reg.generation || reg.generation.generated_by !== 'scripts/vision-capability-requirements.mjs')
    fail.push('K5 generation block missing — the register does not say it is derived');

  return { fail, stageId };
}

function report(src, reg, stageId) {
  const nulls = ['contract_location', 'implementation_location', 'evaluation_evidence'].map((f) => {
    const n = (reg.capabilities || []).filter((c) => c[f] === null || c[f] === undefined).length;
    return `${f} null on ${n} of ${(reg.capabilities || []).length}`;
  });
  console.log(`capabilities in source      ${src.capabilities.length}`);
  console.log(`capabilities in register    ${(reg.capabilities || []).length}`);
  console.log(`implementation stage        ${stageId || '(underived)'}`);
  console.log(`§8.4 fields checked         ${Object.keys(REQUIRED_FIELD_KEYS).length} per capability`);
  for (const n of nulls) console.log(`${n}`);
}

function verify() {
  const src = read(SRC);
  const graph = read(GRAPH);
  const reg = read(REG);
  const { fail, stageId } = checks(src, graph, reg);
  report(src, reg, stageId);
  if (fail.length) {
    const byClass = new Map();
    for (const f of fail) {
      const k = f.slice(0, 2);
      if (!byClass.has(k)) byClass.set(k, []);
      byClass.get(k).push(f);
    }
    console.error(`\n${fail.length} failure(s) in ${byClass.size} class(es):`);
    for (const [k, fs_] of byClass) {
      console.error(`  ${k} — ${fs_.length}`);
      for (const f of fs_.slice(0, 8)) console.error('    ' + f);
      if (fs_.length > 8) console.error(`    … ${fs_.length - 8} more ${k}`);
    }
    console.error('\nrun: node scripts/vision-capability-requirements.mjs project --write');
    process.exit(1);
  }
  console.log('\nOK — the register is the projection of the 46 contracts.');
}

function project(doWrite) {
  const src = read(SRC);
  const graph = read(GRAPH);
  const prev = read(REG);
  const { hits, id: stageId } = capStage(graph);
  if (!stageId) {
    console.error(
      `cannot derive the implementation stage: ${hits.length} stages match /all company CAP procedures/i`
    );
    process.exit(1);
  }
  const next = build(src, graph, prev, stageId);
  const changed = !eq(prev, next);
  report(src, next, stageId);
  console.log(`register ${changed ? 'differs from' : 'equals'} the projection`);
  if (doWrite) {
    write(REG, next);
    console.log(`wrote ${REG}`);
  } else if (changed) {
    process.exit(1);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'verify') verify();
else if (cmd === 'project') project(rest.includes('--write'));
else {
  console.error('usage: node scripts/vision-capability-requirements.mjs verify | project [--write]');
  process.exit(2);
}
