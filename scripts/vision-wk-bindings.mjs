#!/usr/bin/env node
/**
 * vision-wk-bindings.mjs — computes the joins that the XSR-02 / XSR-R findings are about,
 * and refreshes the root question projection from the source of truth.
 *
 * POSTURE: reports. Nothing in CI runs it yet — say so rather than implying a gate.
 *
 * Two commands:
 *
 *   verify            Recomputes every number an XSR finding names and prints it.
 *                     Exit 1 if any invariant fails. This is the only place those
 *                     numbers are computed; do not quote them from prose.
 *
 *   project [--write] Rebuilds the 268 work/knowledge rows of
 *                     docs/vision-system/coverage/questions.json from
 *                     work-knowledge-contracts.json. Without --write it reports
 *                     divergences and exits 1 if there are any. The projection is
 *                     derived, never hand-edited: 268 rows is more than a person
 *                     can keep in step by hand, which is how they drifted before.
 *
 * Invariants checked by `verify`:
 *   B1  every binding names an existing assertion whose parent is the named subcase
 *   B2  every binding `location` equals the recomputed JSON pointer for that assertion
 *   B3  no answer has zero bindings
 *   B4  `verification_refs` equals the distinct subcase ids of the answer's bindings
 *   F1  (XSR-R-01) `verification_family_refs` equals the distinct families of the
 *       subcases actually bound — the declared planned test module must be the one
 *       that exercises the answer, not a portfolio label
 *   C1  (XSR-R-02) `positive_control` and `execution_boundary` are distinct per subcase
 *   C2  (XSR-R-02) any field that DOES share one string across subcases must be
 *       declared in `shared_control_groups` with a reason, and must cover every
 *       subcase it is shared across
 *   A1  (XSR-R-04) reports assertions no answer binds — informational, does not fail
 *   R1  (XSR-R-03) for every fulfillment route, `selected_route_ids` and
 *       `candidate_route_ids` are disjoint, and any profile id named in a
 *       `selected_contracts.version` string is exactly the selected set
 *   P1  the root projection carries no divergence from the source
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'docs/vision-system/planning/specification/work-knowledge-contracts.json';
const PROJ = 'docs/vision-system/coverage/questions.json';
const CAPS = 'docs/vision-system/planning/specification/capabilities.json';
const PROJ_PREFIX = 'planning/specification/';
const SRC_BASENAME = 'work-knowledge-contracts.json';

const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const write = (rel, obj) =>
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');

// Fields the projection derives from the source. Named here rather than spread through
// the code, because a field that is copied by one command and checked by another is the
// two-implementations defect this repo keeps finding.
const PROJECTED_FIELDS = ['verification_refs', 'verification_family_refs', 'verification_bindings'];

/** Recompute every binding's location pointer from the file itself. */
function locationIndex(src) {
  const byAssertion = new Map();
  src.verification_subcases.forEach((s, i) => {
    s.assertions.forEach((a, j) => {
      byAssertion.set(a.id, { subcase_id: s.id, family_ref: s.family_ref, i, j });
    });
  });
  return byAssertion;
}

const srcLocation = (i, j) => `${SRC_BASENAME}#/verification_subcases/${i}/assertions/${j}`;

/** The projected row fields for one source answer. */
function projectedFor(q, idx) {
  const bindings = (q.verification_bindings || []).map((b) => {
    const at = idx.get(b.assertion_id);
    return {
      subcase_id: b.subcase_id,
      assertion_id: b.assertion_id,
      location: PROJ_PREFIX + srcLocation(at.i, at.j),
    };
  });
  return {
    verification_refs: [...q.verification_refs],
    verification_family_refs: [...q.verification_family_refs],
    verification_bindings: bindings,
  };
}

const uniq = (xs) => [...new Set(xs)];
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function verify() {
  const src = read(SRC);
  const proj = read(PROJ);
  const caps = read(CAPS);
  const idx = locationIndex(src);
  const fail = [];
  const note = [];

  const answers = src.question_answers;
  let bindings = 0;
  // The reviewer's own metric: bindings whose subcase family is ABSENT from the answer's
  // declared list. F1 below is stricter (set equality), so both are reported — quoting the
  // stricter number against the finding's "88" would look like a different measurement.
  let bindingsOutsideDeclared = 0;
  const boundAssertions = new Set();

  for (const q of answers) {
    const bs = q.verification_bindings || [];
    if (bs.length === 0) fail.push(`B3 ${q.question_id}: no verification binding`);
    for (const b of bs) {
      bindings++;
      const at = idx.get(b.assertion_id);
      if (!at) {
        fail.push(`B1 ${q.question_id}: assertion ${b.assertion_id} does not exist`);
        continue;
      }
      if (at.subcase_id !== b.subcase_id)
        fail.push(`B1 ${q.question_id}: ${b.assertion_id} belongs to ${at.subcase_id}, not ${b.subcase_id}`);
      const want = srcLocation(at.i, at.j);
      if (b.location !== want) fail.push(`B2 ${q.question_id}: location ${b.location} should be ${want}`);
      if (!(q.verification_family_refs || []).includes(at.family_ref)) bindingsOutsideDeclared++;
      boundAssertions.add(b.assertion_id);
    }
    const refs = uniq(bs.map((b) => b.subcase_id));
    if (!eq([...(q.verification_refs || [])].sort(), [...refs].sort()))
      fail.push(`B4 ${q.question_id}: verification_refs ${JSON.stringify(q.verification_refs)} != bound subcases ${JSON.stringify(refs)}`);
    const fams = uniq(bs.map((b) => idx.get(b.assertion_id)?.family_ref).filter(Boolean)).sort();
    if (!eq([...(q.verification_family_refs || [])].sort(), fams))
      fail.push(`F1 ${q.question_id}: declares ${JSON.stringify(q.verification_family_refs)} but binds families ${JSON.stringify(fams)}`);
  }

  // C1/C2 — controls must discriminate, or their sharing must be declared.
  const groups = src.shared_control_groups || [];
  const groupByField = new Map(groups.map((g) => [g.field, g]));
  for (const field of ['procedure', 'positive_control', 'execution_boundary']) {
    const seen = new Map();
    for (const s of src.verification_subcases) {
      const v = s[field];
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push(s.id);
    }
    const shared = [...seen.values()].filter((ids) => ids.length > 1);
    const g = groupByField.get(field);
    if (shared.length === 0) continue;
    if (!g) {
      fail.push(`C1 ${field}: one string shared by ${shared.map((i) => i.length).join('+')} subcases and no shared_control_groups entry declares it`);
      continue;
    }
    if (!g.reason || g.reason.length < 40)
      fail.push(`C2 ${field}: shared_control_groups entry ${g.id} carries no substantive reason`);
    for (const ids of shared) {
      const missing = ids.filter((id) => !g.applies_to.includes(id));
      if (missing.length) fail.push(`C2 ${field}: group ${g.id} does not cover ${missing.join(', ')}`);
    }
    // Every subcase in the group must point back at it, so a reader of one subcase
    // learns the control is shared without reading the whole file.
    for (const id of g.applies_to) {
      const s = src.verification_subcases.find((x) => x.id === id);
      if (!s) fail.push(`C2 group ${g.id} names unknown subcase ${id}`);
      else if (s.shared_control_group !== g.id)
        fail.push(`C2 ${id} is in group ${g.id} but does not declare shared_control_group`);
    }
  }

  // D1 — (XSR / G1-04) verification dilution. Informational: how many DISTINCT (subcase,
  // assertion) pairs the answers actually rest on, and which pair carries the most answers.
  // Reuse is not automatically a defect — several answers can legitimately turn on one
  // observation — but the figure is the one G1-04 quotes, so it is computed here rather than
  // written into prose that cannot be re-run.
  const pairAnswers = new Map();
  for (const q of answers)
    for (const b of q.verification_bindings || []) {
      const k = `${b.subcase_id}|${b.assertion_id}`;
      if (!pairAnswers.has(k)) pairAnswers.set(k, []);
      pairAnswers.get(k).push(q.question_id);
    }
  const pairSizes = [...pairAnswers.entries()].sort((a, b) => b[1].length - a[1].length);
  const soleBinding = answers.filter((q) => (q.verification_bindings || []).length === 1).length;

  // A1 — unbound assertions (informational).
  const allAssertions = [...idx.keys()];
  const unbound = allAssertions.filter((a) => !boundAssertions.has(a));

  // R1 — two views of one selection must derive the same set.
  const PROFILE = /\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*\/v\d+\b/g;
  for (const [rid, route] of Object.entries(caps.fulfillment_routes)) {
    if (!Array.isArray(route.candidate_route_ids))
      fail.push(`R1 ${rid}: no candidate_route_ids field (use [] when there are none)`);
    const sel = route.selected_route_ids || [];
    const cand = route.candidate_route_ids || [];
    const overlap = sel.filter((x) => cand.includes(x));
    if (overlap.length) fail.push(`R1 ${rid}: ${overlap.join(', ')} is both selected and candidate`);
    const named = uniq(
      (route.selected_contracts || []).flatMap((c) => String(c.version || '').match(PROFILE) || [])
    );
    if (named.length && !eq([...named].sort(), [...sel].sort()))
      fail.push(`R1 ${rid}: version string names ${JSON.stringify(named)} but selected_route_ids is ${JSON.stringify(sel)}`);
  }

  // P1 — root projection.
  const byId = new Map(proj.map((r) => [r.id, r]));
  let divergences = 0;
  for (const q of answers) {
    const row = byId.get(q.question_id);
    if (!row) {
      divergences++;
      fail.push(`P1 ${q.question_id}: no root projection row`);
      continue;
    }
    const want = projectedFor(q, idx);
    for (const f of PROJECTED_FIELDS) {
      if (!eq(row[f], want[f])) {
        divergences++;
        fail.push(`P1 ${q.question_id}.${f} diverges from source`);
      }
    }
    if (row.question !== q.question) {
      divergences++;
      fail.push(`P1 ${q.question_id}: question text differs from source`);
    }
  }

  note.push(`answers                    ${answers.length}`);
  note.push(`subcases                   ${src.verification_subcases.length}`);
  note.push(`assertions                 ${allAssertions.length}`);
  note.push(`bindings                   ${bindings}`);
  note.push(`answers with no binding    ${answers.filter((q) => !(q.verification_bindings || []).length).length}`);
  note.push(`family mismatches (R-01)   ${fail.filter((f) => f.startsWith('F1 ')).length} answers · ${bindingsOutsideDeclared} bindings`);
  note.push(`distinct positive_control  ${uniq(src.verification_subcases.map((s) => s.positive_control)).length}`);
  note.push(`distinct execution_boundary ${uniq(src.verification_subcases.map((s) => s.execution_boundary)).length}`);
  note.push(`declared shared groups     ${groups.length} (${groups.map((g) => g.field).join(', ') || 'none'})`);
  note.push(`distinct (subcase,assertion) pairs ${pairAnswers.size} for ${answers.length} answers`);
  note.push(
    `most-reused pair (G1-04)   ${pairSizes[0][0].replace('|', ' / ')} serves ${pairSizes[0][1].length}: ${pairSizes[0][1].join(', ')}`
  );
  note.push(`answers resting on ONE binding ${soleBinding} of ${answers.length}`);
  note.push(`unbound assertions (R-04)  ${unbound.length}${unbound.length ? ': ' + unbound.join(', ') : ''}`);
  note.push(`root projection divergences ${divergences}`);

  console.log(note.join('\n'));
  if (fail.length) {
    // Grouped by class, with a cap per class. A flat truncated list hides whole classes
    // behind whichever one happens to be largest — which is how a 268-line family report
    // buried three control findings on the first run of this script.
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
    process.exit(1);
  }
  console.log('\nOK — every invariant holds.');
}

function project(doWrite) {
  const src = read(SRC);
  const proj = read(PROJ);
  const idx = locationIndex(src);
  const byId = new Map(proj.map((r) => [r.id, r]));
  let changed = 0;
  const missing = [];

  for (const q of src.question_answers) {
    const row = byId.get(q.question_id);
    if (!row) {
      missing.push(q.question_id);
      continue;
    }
    const want = projectedFor(q, idx);
    for (const f of PROJECTED_FIELDS) {
      if (!eq(row[f], want[f])) {
        changed++;
        if (doWrite) row[f] = want[f];
      }
    }
  }

  console.log(`rows in projection ${proj.length} · source answers ${src.question_answers.length}`);
  console.log(`${doWrite ? 'updated' : 'divergent'} field(s): ${changed}`);
  if (missing.length) {
    console.error(`no projection row for: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (doWrite) {
    write(PROJ, proj);
    console.log(`wrote ${PROJ}`);
  } else if (changed) {
    process.exit(1);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'verify') verify();
else if (cmd === 'project') project(rest.includes('--write'));
else {
  console.error('usage: node scripts/vision-wk-bindings.mjs verify | project [--write]');
  process.exit(2);
}
