#!/usr/bin/env node
/**
 * vision-coverage-registers.mjs — the answer-node access and the §8.24 status of the three
 * coverage registers (questions 566 · supplemental 62 · discovered 15), computed in one place.
 *
 * POSTURE: reports. Nothing in CI runs it yet — say so rather than implying a gate.
 *
 * Two findings of G-01 live here:
 *
 *   G1-02  Two incompatible answer-node schemas sat behind one `answer_location` column:
 *          384 rows expose the substantive text as `answer`, 182 (every row pointing into
 *          integrations-capacity-build.json or components-authority.json) as `decision` with
 *          no `answer` key, so a consumer reading `.answer` got null for 32% of the matrix.
 *          Repair: every row DECLARES `answer_field`, and A2 below follows it and asserts the
 *          text is really there. The source keys are not renamed — `decision` is the authored
 *          key of those two question-record shapes, and renaming a key 182 places to spare one
 *          consumer a lookup moves the breakage rather than removing it.
 *
 *   G1-03  All 566 rows carried one status, so the register structurally could not surface a
 *          deliberate refusal or a genuinely open item. Repair: STATUS_RULES below, applied in
 *          order, first match wins, recorded per row in `status_rule`.
 *
 * What the rule may and may not conclude. "Answered" is the acceptance protocol's sense —
 * *"'Answered' means specified at this gate; 'implemented' requires later implementation
 * evidence"* (planning/reviews/G-acceptance-protocol.md) — and it is reached only through a
 * POSITIVE structural test (R9): a substantive answer text at a pointer that resolves, plus a
 * planned verification. It is never a default for text the rules could not read: a row that
 * fails R9 falls to "Requires further evidence" (R10), which is where this register started.
 * No rule can produce "Intentionally refused", "Not applicable" or "Unresolved but
 * non-blocking" — those are authored judgements, and a classifier inventing one would be
 * inventing acceptance.
 *
 * Why the rules read `uncertainty` and not only the answer text: G-01 suggested grepping the
 * answer for "founder" and "professional". Measured on this corpus that is 16 and 29 hits and
 * nearly all of them are false — F01-Q05's answer says *"Founder taste, professional
 * conclusions and routine implementation rights are distinct"*, which is a specified answer
 * about a founder, not a deferral to one. The row's own `uncertainty` is where this package
 * states what remains open (196 distinct strings across 566 rows), so that is what the
 * deferral rules read, and each rule names the phrases it fires on.
 *
 * Two commands, mirroring scripts/vision-wk-bindings.mjs:
 *
 *   verify            Recomputes answer_field, the status and the distribution; exits 1 on any
 *                     divergence, unresolvable pointer, empty answer text, disallowed status or
 *                     changed denominator.
 *   project [--write] Writes answer_field / status / status_rule into the three registers, and
 *                     the same status into the `coverage_status` of the scope-lifecycle records
 *                     that supplemental and discovered point at — one status for one row, in
 *                     two files that a reader can compare.
 *
 * Invariants checked by `verify`:
 *   N1  the denominators are exactly 566 / 62 / 15
 *   A1  every answer_location resolves
 *   A2  answer_field names a key on the answer node holding non-empty substantive text
 *   A3  answer_field is one of the declared field names
 *   S1  status equals the rule's output, and status_rule names the rule that produced it
 *   S2  every status is allowed by directive §8.24, parsed from DIRECTIVE.md itself
 *   S3  supplemental/discovered rows agree with their source record's coverage_status
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VS = 'docs/vision-system/';
const DIRECTIVE = VS + 'inputs/DIRECTIVE.md';
const RULE_DOC = VS + 'coverage/status-rule.json';

const REGISTERS = [
  { key: 'questions', file: VS + 'coverage/questions.json', n: 566, uncertainty: 'uncertainty' },
  { key: 'supplemental', file: VS + 'coverage/supplemental.json', n: 62, uncertainty: 'uncertainty' },
  { key: 'discovered', file: VS + 'coverage/discovered.json', n: 15, uncertainty: 'remaining_uncertainty' },
];

const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const write = (rel, obj) =>
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Answer-node keys that may carry the substantive text, in the order they are looked for. */
const ANSWER_FIELDS = ['answer', 'decision'];
const MIN_ANSWER_CHARS = 80; // shortest real answer in this corpus is 137

/** Keys that carry a planned verification, whatever the answer-node shape. */
const VERIFICATION_KEYS = ['verification_refs', 'planned_test', 'falsifying_test', 'test'];

// ── the rules ────────────────────────────────────────────────────────────────────────────
// Ordered. First match wins. `on` says which text the rule reads. Each `when` is a phrase the
// package actually uses; a rule that fires on a bare topic word instead of a phrase would
// classify F01-Q05 as a founder deferral, which is the mistake this file documents above.

/**
 * The gate that stands in front of the WHOLE package: every contract here is unimplemented and
 * every answer awaits the complete-plan review. A row that says only this is not thereby an open
 * question — it is a specified answer inside an unbuilt package, which is what this gate is for.
 * These phrases are removed before R4 looks for a row-specific open prerequisite; without the
 * removal R4 fires on all 566 and the register goes back to carrying one value.
 */
const GATE_PHRASES = [
  /\b(remains?|is|are) unimplemented\b/gi,
  /\bcontract unimplemented\b/gi,
  /\brequires? the (stated|specified) (tests|evidence)\b/gi,
  /\bneed their declared evidence\b/gi,
  /\bpending independent (complete-plan )?review\b/gi,
  /\bindependent complete-plan review\b/gi,
  /\bno [^.;]{0,80} is inferred\b/gi,
  /\bremain scoped and contestable\b/gi,
];

/**
 * A row-specific open prerequisite: something this project must still do or obtain. Each entry is
 * a phrase the corpus uses, not a topic word — "actual" appears in 300 uncertainties and means
 * nothing on its own.
 */
const OPEN_MARKER =
  /\b(are|is|remains?) pending\b|\b(are|is|remains?) prerequisites?\b|\bprerequisites?\b|\bnot supplied\b|\bnot yet (tested|available|admitted|installed)\b|\bremains? (required|unverified|to be)\b|\bto be (produced|completed|built|admitted)\b|\bmust be (tested|built|measured|marked|checked|established|produced|admitted)\b|\bneeds? (measurement|evaluation|assessment|consolidation|admission|inventory|qualification|review capacity|specialist|competent|domain assessment|domain-specific|reference workload|empirical|exact|qualified|accepted|actual|scope-specific|independent review)\b|\brequires? (actual|adversarial|representative|reviewed|catalog|domain-specific|qualified|operating|scope-specific|competent|measurement|longer|direct|fresh|profile|user|operational|deployment|baseline)\b|\b(are|is|remain) future (inputs|evidence)\b|\bnot (currently )?installed\b|\b(are|is|remain) unobserved\b|\bare not supplied\b|\bmay be unavailable\b|\bremain unavailable\b|\bmust be (built|run)\b|\bevidence remains to be produced\b|\bno [^.;]{0,60}(rehearsal|test) was (run|executed)\b|\b(exists|established) yet\b/i;

const PROFESSIONAL_ACTOR =
  /(professional|licensed|lawyer|accountant|auditor|insurer|notary)[^.;]{0,60}\b(engagement|quote|quotes|result|results|access|availability|capacity|standing|fees|service|competence|predicates|assessors|advice|opinion|review|signatory)\b/i;

/**
 * Statuses no rule may compute, because each is a judgement a person made about one row.
 * R0 preserves them where they are already authored; nothing else may write one.
 */
const AUTHORED_STATUSES = [
  'Intentionally refused',
  'Not applicable',
  'Unresolved but non-blocking',
  'Superseded by a better framing',
];

const STATUS_RULES = [
  {
    id: 'R0-authored-judgement-preserved',
    status: null, // carries through whatever was authored
    on: 'authored',
    why:
      'The row already carries an authored §8.24 judgement that no classifier may produce — the ' +
      '35 supplemental rows superseded at 12-scope-lifecycle-traceability.md#scope-decision are ' +
      'the live case. Running the rules over them would have relabelled all 35 from a deliberate ' +
      'supersession to a computed status, which is the classifier overwriting a decision.',
  },
  {
    id: 'R1-external-professional',
    status: 'Requires external professional',
    on: 'uncertainty',
    test: (t) =>
      PROFESSIONAL_ACTOR.test(t) ||
      /\b(require|requires|need|needs)\s+unavailable\s+(actual\s+)?(competent|qualified)/i.test(t) ||
      /\b(qualified|competent)\s+(rights\s+)?determination\b/i.test(t),
    why:
      'The row states that a qualified external human — professional, licensed practitioner, ' +
      'assessor, insurer — and their engagement, result, standing or fee is what remains open. ' +
      'The phrase must join the actor to the act; a mention of "professional/admin/owner labor" ' +
      'inside a cost list does not fire it.',
  },
  {
    id: 'R2-founder-or-owner-input',
    status: 'Requires founder decision',
    on: 'uncertainty',
    test: (t) =>
      /\b(are|remain|remains) operating inputs\b/i.test(t) ||
      /\b(are|remain|remains) setup inputs\b/i.test(t) ||
      /owner-endorsed inputs/i.test(t) ||
      /\bunconfigured\b/i.test(t) ||
      /\bare prerequisites\b/i.test(t) ||
      /\bmust be (established|accepted|checked)\b/i.test(t) ||
      /\b(is|are|remains?) not established\b/i.test(t) ||
      /\bnot established by this plan\b/i.test(t) ||
      /\bno current endorsement\b/i.test(t) ||
      /\bhas not endorsed\b/i.test(t) ||
      /\b(need|needs|require|requires) (actual )?(admission|setup evidence|operating evidence|accepted setup evidence)\b/i.test(t) ||
      /\bremains? an admission test\b/i.test(t) ||
      /\bis admitted yet\b/i.test(t) ||
      /\b(remain|remains) operating facts\b/i.test(t),
    why:
      'The row states that an input only the owner can supply — endorsement, purpose, cap, ' +
      'mandate, account admission, real organisational standing — is not established. It is a ' +
      'decision, not a measurement: no test run by this system can produce it.',
  },
  {
    id: 'R3-future-empirical-result',
    status: 'Requires further evidence',
    on: 'uncertainty',
    test: (t) =>
      /\b(unmeasured|untested|unexecuted|unqualified)\b/i.test(t) ||
      /\b(is|are|remains?) unknown\b/i.test(t) ||
      /\bneither [^.;]{0,90}\bare known\b/i.test(t) ||
      /\bremain (observed, estimated or unknown|unknown|empirical|hypotheses)\b/i.test(t) ||
      /\bmust be measured\b/i.test(t) ||
      /\b(until|before) measured\b/i.test(t) ||
      /\bcannot be fully measured\b/i.test(t) ||
      /\b(require|requires|need|needs) (actual |measured |operational |direct |domain-specific |baseline |profile |user |Linux |workload )*(tests|testing|trials|baseline trials|deployment tests|validators|assessment|qualification)\b/i.test(t) ||
      /\bare intended targets\b/i.test(t) ||
      /\bstochastic\b/i.test(t) ||
      /\bremain hypotheses\b/i.test(t) ||
      /\bwill remain hypotheses\b/i.test(t),
    why:
      'The row states that a quantity inside its own answer is not yet measured — a latency, a ' +
      'rate, a cost, an effect size — so the answer cannot be closed by specification alone. ' +
      'This is NOT the same as the implementation evidence every unimplemented contract owes: ' +
      'phrases of the form "require the stated tests" or "remains unimplemented" are deliberately ' +
      'not in this list, because they describe the gate ahead of the whole package rather than an ' +
      'unmeasured quantity in this answer.',
  },
  {
    id: 'R4-open-prerequisite',
    status: 'Requires further evidence',
    on: 'residual',
    test: (t) => OPEN_MARKER.test(t),
    why:
      'After the package-wide gate phrases are removed (GATE_PHRASES — "remains unimplemented", ' +
      '"require the stated tests", "pending independent complete-plan review" and the rest), the ' +
      'uncertainty still names something this project must do or obtain before the answer can be ' +
      'relied on: a test to run, a catalog to build, an input not supplied. The answer is written; ' +
      'it is not yet good for use. This rule is why "Answered" is not what every row falls into: ' +
      'it is checked BEFORE R9, so R9 keeps only the rows whose sole open item is the gate that ' +
      'stands in front of the whole package.',
  },
  {
    id: 'R9-specified-with-planned-verification',
    status: 'Answered',
    on: 'structure',
    why:
      'Positive test, not a default: the answer pointer resolves, the declared answer_field ' +
      'holds substantive text, and the answer node names a planned verification. "Answered" is ' +
      'the acceptance protocol\'s sense — specified at this gate. The row keeps its own ' +
      'implementation_status ("planned-not-existing") and answer_status ("independent review ' +
      'pending"), which is where the fact that nothing is built or accepted is carried.',
  },
  {
    id: 'R10-unclassified',
    status: 'Requires further evidence',
    on: 'structure',
    why:
      'The row does not pass R9 and no rule read its text. It keeps the status the whole ' +
      'register carried before this repair. Nothing is guessed.',
  },
];

// ── mechanics ────────────────────────────────────────────────────────────────────────────

const cache = new Map();
function load(rel) {
  if (!cache.has(rel)) cache.set(rel, read(VS + rel));
  return cache.get(rel);
}
function resolvePointer(doc, ptr) {
  return ptr
    .split('/')
    .slice(1)
    .reduce((cur, seg) => (cur == null ? undefined : cur[seg.replace(/~1/g, '/').replace(/~0/g, '~')]), doc);
}
/** The answer node a register row points at, or undefined. */
function answerNode(row) {
  const [file, ptr] = row.answer_location.split('#');
  try {
    return resolvePointer(load(file), ptr);
  } catch {
    return undefined;
  }
}
const answerFieldOf = (node) =>
  node && ANSWER_FIELDS.find((f) => typeof node[f] === 'string' && node[f].trim().length >= MIN_ANSWER_CHARS);
const hasPlannedVerification = (node) =>
  !!node &&
  VERIFICATION_KEYS.some((k) => {
    const v = node[k];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null;
  });

/** Statuses directive §8.24 allows, parsed from the directive rather than copied from it. */
function allowedStatuses() {
  const md = fs.readFileSync(path.join(ROOT, DIRECTIVE), 'utf8');
  const start = md.indexOf('Allowed statuses are:');
  if (start < 0) throw new Error('DIRECTIVE.md §8.24: "Allowed statuses are:" not found');
  const block = md.slice(start, md.indexOf('Silence is not an allowed status', start));
  const out = [...block.matchAll(/^\s*-\s+(.+?)\.?\s*$/gm)].map((m) =>
    m[1].replace(/,\s*with explanation$/i, '').replace(/\.$/, '').trim()
  );
  if (out.length < 8) throw new Error(`DIRECTIVE.md §8.24: parsed ${out.length} statuses, expected 8`);
  return out;
}

/** Classify one row. Returns {status, status_rule}. */
function classify(row, reg) {
  const node = answerNode(row);
  const field = answerFieldOf(node);
  const text = String(row[reg.uncertainty] || node?.uncertainty || '');
  const authored = [node?.coverage_status, row.status].find((s) => AUTHORED_STATUSES.includes(s));
  if (authored) return { status: authored, status_rule: 'R0-authored-judgement-preserved' };
  const residual = GATE_PHRASES.reduce((acc, re) => acc.replace(re, ' '), text);
  for (const rule of STATUS_RULES) {
    if (rule.on === 'uncertainty' && text && rule.test(text)) return { status: rule.status, status_rule: rule.id };
    if (rule.on === 'residual' && residual.trim() && rule.test(residual)) return { status: rule.status, status_rule: rule.id };
  }
  const structural = field && hasPlannedVerification(node) ? 'R9-specified-with-planned-verification' : 'R10-unclassified';
  const rule = STATUS_RULES.find((r) => r.id === structural);
  return { status: rule.status, status_rule: rule.id };
}

function rowsOf(reg) {
  return read(reg.file);
}

function computeAll() {
  const per = {};
  for (const reg of REGISTERS) {
    const rows = rowsOf(reg);
    per[reg.key] = rows.map((row) => {
      const node = answerNode(row);
      return { row, node, answer_field: answerFieldOf(node), ...classify(row, reg) };
    });
  }
  return per;
}

const distribution = (items) => {
  const d = {};
  for (const it of items) d[it.status] = (d[it.status] || 0) + 1;
  return Object.fromEntries(Object.entries(d).sort((a, b) => b[1] - a[1]));
};
const ruleDistribution = (items) => {
  const d = {};
  for (const it of items) d[it.status_rule] = (d[it.status_rule] || 0) + 1;
  return Object.fromEntries(Object.entries(d).sort((a, b) => b[1] - a[1]));
};

function checkAll(per, { strict }) {
  const fail = [];
  const allowed = allowedStatuses();
  for (const reg of REGISTERS) {
    const items = per[reg.key];
    if (items.length !== reg.n) fail.push(`N1 ${reg.key}: ${items.length} rows, expected ${reg.n}`);
    for (const it of items) {
      const { row, node } = it;
      if (node === undefined) {
        fail.push(`A1 ${row.id}: answer_location ${row.answer_location} does not resolve`);
        continue;
      }
      if (!it.answer_field)
        fail.push(`A2 ${row.id}: no field of [${ANSWER_FIELDS.join(', ')}] holds ≥${MIN_ANSWER_CHARS} chars of answer text`);
      if (!allowed.includes(it.status)) fail.push(`S2 ${row.id}: status ${JSON.stringify(it.status)} is not allowed by §8.24`);
      if (!strict) continue;
      if (row.answer_field !== it.answer_field)
        fail.push(`A3 ${row.id}: answer_field ${JSON.stringify(row.answer_field)} should be ${JSON.stringify(it.answer_field)}`);
      if (row.status !== it.status) fail.push(`S1 ${row.id}: status ${JSON.stringify(row.status)} should be ${JSON.stringify(it.status)}`);
      if (row.status_rule !== it.status_rule)
        fail.push(`S1 ${row.id}: status_rule ${JSON.stringify(row.status_rule)} should be ${JSON.stringify(it.status_rule)}`);
      if (reg.key !== 'questions' && node.coverage_status !== it.status)
        fail.push(`S3 ${row.id}: source coverage_status ${JSON.stringify(node.coverage_status)} should be ${JSON.stringify(it.status)}`);
    }
  }
  return fail;
}

function report(per) {
  for (const reg of REGISTERS) {
    const items = per[reg.key];
    console.log(`\n${reg.key} (${items.length})`);
    console.log('  answer_field   ' + JSON.stringify(distributionOf(items, 'answer_field')));
    console.log('  status         ' + JSON.stringify(distribution(items)));
    console.log('  status_rule    ' + JSON.stringify(ruleDistribution(items)));
  }
}
const distributionOf = (items, key) => {
  const d = {};
  for (const it of items) d[it[key]] = (d[it[key]] || 0) + 1;
  return d;
};

function ruleDoc(per) {
  return {
    schema_version: 1,
    kind: 'The rule that assigns every coverage-register status. Not a status itself.',
    applies_to: REGISTERS.map((r) => r.file.replace(VS, '')),
    computed_by: 'scripts/vision-coverage-registers.mjs',
    hand_edit: 'refused — run `node scripts/vision-coverage-registers.mjs project --write`; `verify` fails on drift',
    allowed_statuses_source: 'inputs/DIRECTIVE.md §8.24, parsed at run time',
    answered_means:
      "planning/reviews/G-acceptance-protocol.md: \"'Answered' means specified at this gate; 'implemented' requires later implementation evidence.\"",
    answer_field:
      'Each row declares which key of its answer node carries the substantive text. The two ' +
      'source shapes are not unified by renaming: `decision` is the authored key of the ' +
      'integrations-capacity-build.json and components-authority.json question records.',
    rules: STATUS_RULES.map((r) => ({ id: r.id, status: r.status ?? '(the authored status, preserved)', reads: r.on, why: r.why })),
    order: 'first match wins, in the order listed',
    cannot_produce: AUTHORED_STATUSES,
    cannot_produce_why:
      'Each is an authored judgement about a specific row. A classifier that emitted one would be ' +
      'inventing a refusal or an acceptance nobody made. They remain available to a human author, ' +
      'and a row carrying one would have to leave this rule set explicitly.',
    distribution: Object.fromEntries(REGISTERS.map((r) => [r.key, distribution(per[r.key])])),
    by_rule: Object.fromEntries(REGISTERS.map((r) => [r.key, ruleDistribution(per[r.key])])),
    repair_state: 'G1-02 and G1-03 repaired, pending independent recheck',
  };
}

function verify() {
  const per = computeAll();
  report(per);
  const fail = checkAll(per, { strict: true });
  const doc = fs.existsSync(path.join(ROOT, RULE_DOC)) ? read(RULE_DOC) : null;
  if (!doc) fail.push(`S1 ${RULE_DOC} does not exist`);
  else if (!eq(doc.distribution, ruleDoc(per).distribution))
    fail.push(`S1 ${RULE_DOC}: recorded distribution differs from the computed one`);
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
    console.error('\nrun: node scripts/vision-coverage-registers.mjs project --write');
    process.exit(1);
  }
  console.log('\nOK — answer access and status are what the rule computes.');
}

function project(doWrite) {
  const per = computeAll();
  const fail = checkAll(per, { strict: false });
  if (fail.length) {
    console.error(`${fail.length} structural failure(s); not writing:`);
    for (const f of fail.slice(0, 20)) console.error('  ' + f);
    process.exit(1);
  }
  let changed = 0;
  const touchedSources = new Set();
  for (const reg of REGISTERS) {
    const rows = rowsOf(reg);
    rows.forEach((row, i) => {
      const it = per[reg.key][i];
      for (const [k, v] of [
        ['answer_field', it.answer_field],
        ['status', it.status],
        ['status_rule', it.status_rule],
      ]) {
        if (row[k] !== v) {
          changed++;
          if (doWrite) row[k] = v;
        }
      }
      if (reg.key !== 'questions') {
        const [file] = row.answer_location.split('#');
        if (it.node.coverage_status !== it.status) {
          changed++;
          if (doWrite) {
            it.node.coverage_status = it.status;
            touchedSources.add(file);
          }
        }
      }
    });
    if (doWrite) write(reg.file, rows);
  }
  report(per);
  console.log(`\n${doWrite ? 'updated' : 'divergent'} field(s): ${changed}`);
  if (doWrite) {
    for (const file of touchedSources) {
      write(VS + file, load(file));
      console.log(`wrote ${VS + file} (coverage_status kept equal to the register)`);
    }
    write(RULE_DOC, ruleDoc(per));
    console.log(`wrote ${RULE_DOC}`);
    for (const reg of REGISTERS) console.log(`wrote ${reg.file}`);
  } else if (changed) {
    process.exit(1);
  }
}

function explain(id) {
  const per = computeAll();
  for (const reg of REGISTERS) {
    const it = per[reg.key].find((x) => x.row.id === id);
    if (!it) continue;
    const rule = STATUS_RULES.find((r) => r.id === it.status_rule);
    console.log(`${id} · ${reg.key}`);
    console.log(`  status       ${it.status}`);
    console.log(`  rule         ${it.status_rule} (reads ${rule.on})`);
    console.log(`  answer_field ${it.answer_field}`);
    console.log(`  uncertainty  ${it.row[reg.uncertainty]}`);
    console.log(`  answer       ${String(it.node[it.answer_field]).slice(0, 200)}…`);
    return;
  }
  console.error(`no row with id ${id}`);
  process.exit(1);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'verify') verify();
else if (cmd === 'project') project(rest.includes('--write'));
else if (cmd === 'explain' && rest[0]) explain(rest[0]);
else {
  console.error('usage: node scripts/vision-coverage-registers.mjs verify | project [--write] | explain <row-id>');
  process.exit(2);
}
