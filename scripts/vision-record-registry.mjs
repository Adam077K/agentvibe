#!/usr/bin/env node
/**
 * vision-record-registry.mjs — why each record type exists, and whether its source_contract
 * actually resolves.
 *
 * POSTURE: reports. Nothing in CI runs it yet — say so rather than implying a gate.
 *
 * Two findings of G-01 live here:
 *
 *   G1-06  Eleven of the 173 canonical record types are named nowhere outside contracts/. Each
 *          carried a source_contract, so each was justified by a CONTRACT and by no source
 *          concern — the review's "direction 2" (mechanism → the requirement that justifies it)
 *          failing. Repair: JUSTIFICATIONS below gives each one either the source concern whose
 *          meaning requires it, or an explicit statement that it is control machinery derived
 *          from another record's obligation. "It exists" is not a justification and F1 refuses
 *          a justification that does not resolve.
 *
 *   G1-07  ScopeRegistry's source_contract anchor did not resolve: it carried a doubled hyphen
 *          where the heading's em dash sits, and GitHub's slug collapses the run of whitespace
 *          around it to one. 1 of 173 failed; the other 172 resolved. Repair: the anchor is
 *          corrected in the registry, and H1 below now checks all 173 rather than trusting that
 *          one fix.
 *
 * Two commands, mirroring scripts/vision-wk-bindings.mjs:
 *
 *   verify            Checks every source_contract and every justification. Exit 1 on failure.
 *   project [--write] Writes the justifications into the registry.
 *
 * Invariants checked by `verify`:
 *   H1  every record's source_contract resolves — markdown anchors against the file's actual
 *       headings, JSON pointers against the file, bare paths against the filesystem
 *   F1  every record named by G1-06 carries a justification that resolves: a source_concern that
 *       is a real row of the coverage registers, or a derived_from_record that is a real record
 *   F2  no justification is vacuous (no "it exists", and every `why` is substantive)
 *   O1  reports which record types are named nowhere outside contracts/ under the corpus stated
 *       here — informational, because the corpus is a choice and a different one gives a
 *       different number. G1-06's eleven are a subset and they are what F1 requires.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VS = 'docs/vision-system/';
const SPEC = VS + 'planning/specification/';
const REG = SPEC + 'contracts/record-registry.json';
const DIRECTIVE_REF = 'inputs/DIRECTIVE.md#811-schemas-and-contracts';

const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const write = (rel, obj) =>
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The eleven record types G1-06 named. Each entry is either
 *   { source_concern, why }                                        — a concern requires it, or
 *   { derived_control_machinery, derived_from_record, obligation }  — another record's duty does.
 * `directive_subject` is added where directive §8.11 names the subject outright; it is a second
 * reason, never the only one, because §8.11 says a schema must exist and not what it must do.
 */
const JUSTIFICATIONS = {
  ExternalAttempt: {
    source_concern: 'F17-Q07',
    source_concern_text: 'What does a silent success look like, and how is it distinguished from a real one?',
    why:
      'The question cannot be answered without a record that separates one attempt\'s transport, the ' +
      'provider response and the observed effect, and keeps its fencing evidence and deadline. Collapse ' +
      'those into one "sent" flag and a send with no observed effect is byte-identical to a completed ' +
      'one, which is the silent success the question asks about. The same record is what discovered ' +
      'concern D01 (a run resumes after the service forgot its idempotency key) needs to reconcile ' +
      'rather than blindly resend.',
  },
  GenerationSeal: {
    source_concern: 'D02',
    source_concern_text:
      'A restored backup predates revocation, deletion or completion and resurrects authority or effects.',
    why:
      'D02 is exactly the failure this record prevents: an independent witness seals the old ' +
      "generation's complete frontier and every issued transport window, so a restore cannot silently " +
      'reinstate old authority. Without the seal the restored system has no way to state which effects ' +
      'were already issued and which are unknown, and the answer to D02 would be a promise rather than ' +
      'a checkable fact. The name is about outbox GENERATIONS, not about generated content.',
  },
  RollbackPlan: {
    source_concern: 'F41-Q06',
    source_concern_text: 'How is it undone?',
    directive_subject: 'Rollback (§8.11)',
    why:
      'Answering "how is it undone" honestly requires separating reverting software from reverting ' +
      'business history: the record carries the compensating operations, the preserved epochs, the ' +
      'retained holds and the remaining obligations, so that "rolled back" names a reconciled state ' +
      'rather than a label. It is also what makes F41-Q07 and F28-Q04 ("which changes cannot be ' +
      'undone") answerable, because what cannot be compensated is visible in the same place.',
  },
  DecisionChallenge: {
    source_concern: 'F46-Q05',
    source_concern_text: 'Is there a difference between approving and merely not objecting?',
    directive_subject: null,
    naming_hazard:
      'The name reads like directive §8.11\'s "Disagreement" and it is NOT that. This is a one-use ' +
      'authentication challenge bound to a DecisionPacket, an action digest and expected revisions, ' +
      'with an expiry. Filing it under Disagreement would leave §8.11\'s dissent subject looking ' +
      'covered while nothing implements it.',
    why:
      'The difference the question asks about is exactly what this record makes checkable: an approval ' +
      'is a positive, authenticated act on the exact packet and action digest, before expiry, replayable ' +
      'only to the original result. Silence produces no challenge response, and a stale approval cannot ' +
      'be replayed onto a changed subject — so "merely not objecting" cannot be recorded as approval.',
  },
  Principle: {
    source_concern: 'VISION-09',
    source_concern_text: 'nondelegable wanting and promises, relationships and taste',
    directive_subject: 'Principle (§8.11)',
    why:
      'VISION-09 holds that wanting, promising and taste are not delegable to the system. A Principle ' +
      'record is how that survives contact with software: an owner-endorsed statement with concrete ' +
      'hard-decision examples, a named amendment authority and a review date, so the system may expose ' +
      'a contradiction with a principle and may never rewrite the principle. Directive §8.11 names ' +
      'Principle as a required schema subject; this is what it is FOR.',
  },
  AccessPolicy: {
    source_concern: 'F26-Q09',
    source_concern_text: 'Who can see what, and is that logged?',
    directive_subject: 'Permission (§8.11)',
    why:
      'The question demands an answer per reader, purpose, field and destination, bound to live epochs ' +
      'rather than to a role name — and its load-bearing half is the invariant that an empty scope does ' +
      'not authorise a universal read. Every record in the registry carries access_policy_ref for this ' +
      'reason: without the record the answer to F26-Q09 would be a convention, not a check.',
  },
  RetentionPolicy: {
    source_concern: 'F26-Q03',
    source_concern_text: 'How long is it kept, and what causes it to be deleted?',
    why:
      'Answering it requires a per-field, per-copy-class purpose, deadline and competent determination ' +
      '— "no universal sector period invented" is the record\'s own binding. A single retention number ' +
      'on the company would answer the question falsely, because the copy classes (wal, replica, index, ' +
      'backup, export, provider copy) do not expire together.',
  },
  DeletionReceipt: {
    source_concern: 'F26-Q04',
    source_concern_text: 'Is deletion real?',
    why:
      'This record is the answer\'s evidence: an actual observer verifies one scope, copy class and ' +
      'method at a stated time and preserves the limits of what was checked, and residual or unknown ' +
      'copies keep residual status. Without it "deleted" is a tombstone label, which is the exact ' +
      'reading F26-Q04 exists to refuse.',
  },
  DependencyClosure: {
    derived_control_machinery: true,
    derived_from_record: 'AccountReconstruction',
    obligation:
      'An unfamiliar authorized reader must be able to reconstruct the consequential result and the ' +
      'next duty from the account — which requires enumerating the typed transitive edges at a witnessed ' +
      'frontier, with omissions declared rather than absent. DeletionScope carries the same obligation ' +
      'in the other direction: inheritance to known and late derivatives cannot be asserted without the ' +
      'closure that names them.',
    why:
      'It is a derived-projection record, not a business fact: nothing is decided by creating one. Its ' +
      'invariant — proof/source cycles and absent roots cannot supply their own evidence — is a property ' +
      'of the enumeration, which is why it is machinery and why no source concern names it directly. ' +
      'The nearest concern it serves is F35-Q09, "how is a connection removed, and how do you know ' +
      'nothing still depends on it".',
  },
  ConfigurationVersion: {
    source_concern: 'F41-Q08',
    source_concern_text:
      "How is the system's own configuration versioned, and can you reproduce a past result?",
    directive_subject: 'Configuration Version (§8.11)',
    why:
      'Reproducing a past result requires the exact closed configuration variant, its schema digest and ' +
      'meaning version, and the protected change that admitted it — the record\'s invariant that a ' +
      'protected change "cannot enter as a plain file edit" is what makes the reproduction claim ' +
      'survivable. A configuration that is only a file on disk answers the first half of the question ' +
      'and silently fails the second.',
  },
  ConsequenceClassDefinition: {
    source_concern: 'F15-Q01',
    source_concern_text: 'What is the worst thing that could plausibly happen here?',
    directive_subject: 'Consequence Class (§8.11)',
    why:
      'Consequence classes are the vocabulary every capability contract\'s consequence_classes field ' +
      'uses, so the question of what can plausibly go worst is answered by which class an action falls ' +
      'in. Defining a NEW class therefore cannot be a text edit: it needs an admitted classification ' +
      'predicate and the gates that class requires, "without a universal risk score or invented founder ' +
      'tolerance". F16-Q01 (on what basis permission is granted — person, task, risk, reversibility) ' +
      'rests on the same definitions.',
  },
};

/** What the registry actually carries: the justification plus its provenance. One definition,
 *  so that `verify` compares against exactly what `project --write` writes. */
const projected = (name) => ({
  ...JUSTIFICATIONS[name],
  recorded_by: 'scripts/vision-record-registry.mjs',
  repair_state: 'G1-06 repaired, pending independent recheck',
});

/** Phrases that would make a justification vacuous. F2 refuses them. */
const VACUOUS = [/\bit exists\b/i, /\bbecause it is in the registry\b/i, /\bfor completeness\b/i, /\bTODO\b/];

// ── source_contract resolution ───────────────────────────────────────────────────────────
const headingCache = new Map();
function headings(rel) {
  if (!headingCache.has(rel)) {
    const p = path.join(ROOT, SPEC, rel);
    if (!fs.existsSync(p)) headingCache.set(rel, null);
    else
      headingCache.set(
        rel,
        fs
          .readFileSync(p, 'utf8')
          .split('\n')
          .filter((l) => /^#{1,6}\s/.test(l))
          .map((l) => l.replace(/^#{1,6}\s+/, '').trim())
      );
  }
  return headingCache.get(rel);
}
/**
 * GitHub's heading slug: lowercase, drop everything that is not word/space/hyphen, collapse each
 * run of whitespace to ONE hyphen. The collapse is the whole of G1-07: an em dash surrounded by
 * spaces leaves two spaces, which collapse to one hyphen and not two.
 */
const slug = (h) => h.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

function resolveSourceContract(ref) {
  const i = ref.indexOf('#');
  const file = i < 0 ? ref : ref.slice(0, i);
  const frag = i < 0 ? null : ref.slice(i + 1);
  const p = path.join(ROOT, SPEC, file);
  if (!fs.existsSync(p)) return `file ${file} does not exist`;
  if (frag === null) return null; // a bare path is a file-level citation
  if (frag.startsWith('/')) {
    const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
    const val = frag
      .split('/')
      .slice(1)
      .reduce((cur, seg) => (cur == null ? undefined : cur[seg.replace(/~1/g, '/').replace(/~0/g, '~')]), doc);
    return val === undefined ? `JSON pointer ${frag} does not resolve in ${file}` : null;
  }
  const hs = headings(file);
  if (hs === null) return `${file} is not readable as markdown`;
  if (hs.map(slug).includes(frag)) return null;
  const near = hs.map(slug).find((s) => s.replace(/-+/g, '-') === frag.replace(/-+/g, '-'));
  return `anchor #${frag} matches no heading in ${file}` + (near ? ` (nearest: #${near})` : '');
}

// ── the orphan census (informational) ────────────────────────────────────────────────────
function orphanCensus(reg) {
  let corpus = '';
  const rows = read(VS + 'coverage/questions.json');
  const cache = new Map();
  for (const row of rows) {
    const [file, ptr] = row.answer_location.split('#');
    if (!cache.has(file)) cache.set(file, read(VS + file));
    const doc = cache.get(file);
    const node = ptr
      .split('/')
      .slice(1)
      .reduce((cur, seg) => (cur == null ? undefined : cur[seg]), doc);
    corpus += JSON.stringify(node) + ' ' + row.question + ' ';
  }
  for (const f of ['coverage/supplemental.json', 'coverage/discovered.json'])
    corpus += fs.readFileSync(path.join(ROOT, VS + f), 'utf8');
  for (const f of fs.readdirSync(path.join(ROOT, SPEC)).filter((x) => x.endsWith('.md')))
    corpus += fs.readFileSync(path.join(ROOT, SPEC, f), 'utf8');
  return Object.keys(reg).filter((k) => !new RegExp(`\\b${k}\\b`).test(corpus));
}

const CENSUS_CORPUS =
  'the 566 answer nodes reached through answer_location, the 566 question texts, ' +
  'coverage/supplemental.json, coverage/discovered.json and the twelve planning/specification/*.md documents';

// ── checks ───────────────────────────────────────────────────────────────────────────────
function concernIds() {
  const ids = new Set();
  for (const f of ['coverage/questions.json', 'coverage/supplemental.json', 'coverage/discovered.json'])
    for (const row of read(VS + f)) ids.add(row.id);
  return ids;
}

function checks(reg, { strict }) {
  const fail = [];
  const ids = concernIds();

  for (const [name, rec] of Object.entries(reg)) {
    const ref = rec.source_contract;
    if (!ref) {
      fail.push(`H1 ${name}: no source_contract`);
      continue;
    }
    const problem = resolveSourceContract(ref);
    if (problem) fail.push(`H1 ${name}: ${problem}`);
  }

  for (const name of Object.keys(JUSTIFICATIONS)) {
    const want = projected(name);
    if (!reg[name]) {
      fail.push(`F1 ${name}: G1-06 names it but the registry has no such record`);
      continue;
    }
    const j = strict ? reg[name].justification : want;
    if (!j) {
      fail.push(`F1 ${name}: no justification`);
      continue;
    }
    if (strict && !eq(j, want)) fail.push(`F1 ${name}: justification differs from the projected one`);
    if (j.source_concern !== undefined) {
      if (!ids.has(j.source_concern))
        fail.push(`F1 ${name}: source_concern ${j.source_concern} is not a row of any coverage register`);
    } else if (j.derived_control_machinery === true) {
      if (!reg[j.derived_from_record])
        fail.push(`F1 ${name}: derived_from_record ${j.derived_from_record} is not a record type`);
      if (!j.obligation || j.obligation.length < 60)
        fail.push(`F1 ${name}: derived justification carries no substantive obligation`);
    } else {
      fail.push(`F1 ${name}: justification is neither a source_concern nor derived_control_machinery`);
    }
    if (!j.why || j.why.length < 80) fail.push(`F2 ${name}: why is missing or too short to be a reason`);
    for (const re of VACUOUS) if (re.test(j.why || '')) fail.push(`F2 ${name}: why is vacuous (${re})`);
  }
  return fail;
}

function report(reg) {
  const anchors = Object.values(reg).filter((r) => (r.source_contract || '').includes('#')).length;
  const bare = Object.keys(reg).length - anchors;
  console.log(`record types                ${Object.keys(reg).length}`);
  console.log(`source_contract with anchor ${anchors} · bare file citation ${bare}`);
  console.log(`justifications required     ${Object.keys(JUSTIFICATIONS).length} (the records G1-06 named)`);
  const present = Object.keys(JUSTIFICATIONS).filter((k) => reg[k] && reg[k].justification).length;
  console.log(`justifications present      ${present}`);
  const orphans = orphanCensus(reg);
  const extra = orphans.filter((o) => !JUSTIFICATIONS[o]);
  console.log(`named nowhere outside contracts/ under this census: ${orphans.length}`);
  console.log(`  corpus: ${CENSUS_CORPUS}`);
  console.log(`  G1-06's eleven are all in it: ${Object.keys(JUSTIFICATIONS).every((k) => orphans.includes(k))}`);
  console.log(`  additional candidates, NOT repaired here (${extra.length}): ${extra.join(', ') || 'none'}`);
}

function verify() {
  const reg = read(REG);
  report(reg);
  const fail = checks(reg, { strict: true });
  if (fail.length) {
    console.error(`\n${fail.length} failure(s):`);
    for (const f of fail.slice(0, 20)) console.error('  ' + f);
    if (fail.length > 20) console.error(`  … ${fail.length - 20} more`);
    console.error('\nrun: node scripts/vision-record-registry.mjs project --write');
    process.exit(1);
  }
  console.log('\nOK — every source_contract resolves and every named record says why it exists.');
}

function project(doWrite) {
  const reg = read(REG);
  const fail = checks(reg, { strict: false });
  if (fail.length) {
    console.error(`${fail.length} failure(s); not writing:`);
    for (const f of fail.slice(0, 20)) console.error('  ' + f);
    process.exit(1);
  }
  let changed = 0;
  for (const name of Object.keys(JUSTIFICATIONS)) {
    const want = projected(name);
    if (eq(reg[name].justification, want)) continue;
    changed++;
    if (doWrite) reg[name].justification = want;
  }
  report(reg);
  console.log(`\n${doWrite ? 'updated' : 'divergent'} justification(s): ${changed}`);
  if (doWrite) {
    write(REG, reg);
    console.log(`wrote ${REG}`);
  } else if (changed) process.exit(1);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'verify') verify();
else if (cmd === 'project') project(rest.includes('--write'));
else {
  console.error('usage: node scripts/vision-record-registry.mjs verify | project [--write]');
  process.exit(2);
}
