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
 *   G1-06b Eight FURTHER record types under the stricter census: EvaluationCase, IndexSnapshot,
 *          ExperienceArtifact, BuildArtifact, Partnership, ContinuityArrangement, Constraint and
 *          AccessGraph. Same repair, same table, same two shapes — a justification is a
 *          justification whichever census found the record. They carry
 *          `repair_state: 'G1-06b repaired, …'` so that which pass justified which record stays
 *          readable; F1 and F2 do not distinguish them, and nothing in the check does.
 *
 *          Note what this repair does NOT do: it cannot move the O1 census count. O1 asks
 *          whether the corpus NAMES the record, a justification lives inside contracts/, and
 *          adding one to a record the 566 questions never mention leaves the corpus unchanged.
 *          The count that reaches zero is `orphans without a justification`, which is the
 *          answerable question; O1's own total stays where it is and should.
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

  // ── G1-06b: the eight the stricter census added. ────────────────────────────────────────
  EvaluationCase: {
    source_concern: 'F47-Q03',
    source_concern_text: 'How is a proposed change evaluated before it is accepted?',
    repair_state: 'G1-06b repaired, pending independent recheck',
    why:
      'A change cannot be evaluated against a judgement made after seeing it. EvaluationCase is the ' +
      'predeclared case with its expected outcome AND expected process, its label provenance adjudicated ' +
      'independently, and a `synthetic` flag that is a declaration rather than an inference — its own ' +
      'invariant is that synthetic fixtures cannot establish actual market benefit. Two discovered ' +
      'failures are what the record blocks: D08, a benchmark change that erases distinctions without ' +
      'changing a displayed success state, and D11, an improvement candidate that changes evidence ' +
      'capture while its hidden evaluator remains intact. Both need the cases to be admitted BEFORE the ' +
      'candidate, and a record with `draft → labeled → admitted` phases is what makes "before" checkable.',
  },
  IndexSnapshot: {
    source_concern: 'F44-Q09',
    source_concern_text:
      'How is a large body of material kept searchable as it grows, and who notices when search stops working?',
    repair_state: 'G1-06b repaired, pending independent recheck',
    why:
      'The second half of the question is the one that needs a record: noticing that search stopped ' +
      'working requires a snapshot that states its own source watermark, its indexed sources and its ' +
      'OMISSIONS, plus `complete` and `incomplete` as distinct phases. An index that cannot say what it ' +
      'failed to index answers a query with silence and reads exactly like an index that found nothing. ' +
      'The permission class and the ephemeral-generation rule carry the other half of F44-Q07, and D13 ' +
      '(a search result repeating a withdrawn provider policy) is the failure a stale watermark produces.',
  },
  ExperienceArtifact: {
    source_concern: 'F25-Q01',
    source_concern_text:
      'Deciding what to build and for whom · designing how it looks and feels · building it · testing it · ' +
      'running it once it exists · … does each of these need its own worker, or is it a way of working ' +
      'that any worker can adopt?',
    repair_state: 'G1-06b repaired, pending independent recheck',
    why:
      'F25-Q01 names "designing how it looks and feels" as work the company does, and the record exists ' +
      'to keep that work from collapsing into an opinion. It holds the journey steps the prototype must ' +
      'actually complete, the accessibility results, and — separately — `user_observations` and ' +
      '`taste_decision`. The separation is the point and it is VISION-09\'s: taste is nondelegable, so a ' +
      'taste decision may be recorded as one and may never be presented as an observation of a user. ' +
      'Its invariant refuses a prototype that cannot complete the specified journey, which is what stops ' +
      '`validated` from meaning "someone liked the mockup".',
  },
  BuildArtifact: {
    source_concern: 'F14-Q05',
    source_concern_text: 'What cannot ship without review, and what can?',
    repair_state: 'G1-06b repaired, pending independent recheck',
    why:
      'The question is only answerable if "reviewed" and "released" are distinct states of a thing, ' +
      'rather than adjectives someone applies. BuildArtifact carries `draft → reviewed → released → ' +
      'withdrawn` over an exact source revision and environment, with its test refs and its maintenance ' +
      'procedure attached, and its invariant makes release require an actual reconciled deployment ' +
      'operation — so a release is a reconciled effect and not a status someone set. Without the record, ' +
      '"this shipped" and "someone said this shipped" are the same assertion.',
  },
  Partnership: {
    source_concern: 'F51-Q01',
    source_concern_text:
      'What changes when a second person is involved — a partner, a contractor, someone hired?',
    repair_state: 'G1-06b repaired, pending independent recheck',
    why:
      'What changes is that outcomes stop being the owner\'s alone, and the record is where that is ' +
      'written down instead of assumed: distinct contributions both parties actually agreed to, explicit ' +
      'opportunity attribution, a named relationship owner, shared dependencies and — the load-bearing ' +
      'field — `exit_duties` with continuing ownership. A partnership that ends without a record of who ' +
      'owes what afterwards is precisely the case F51-Q01 asks about, and the ResponsibilityAssignment ' +
      'machinery cannot answer it, because it assigns duties INSIDE the company and both parties here ' +
      'are outside one another\'s.',
  },
  ContinuityArrangement: {
    source_concern: 'CONSEQUENCE-SECTOR-04',
    source_concern_text: 'owner illness, succession, sale, vendor portability and retirement',
    repair_state: 'G1-06b repaired, pending independent recheck',
    why:
      'Every item in that concern is one event: the person the company depends on stops being available. ' +
      'An arrangement that is only a named alternate is a promise, so the record demands the evidence ' +
      'separately — independent access, competence, funded reservations, a reachable channel and an ' +
      'EXERCISE judgment that the ability was actually demonstrated inside the duty window. It declares ' +
      '`unavailable` as a phase of its own and carries `joint_failure_roots`, because the case that ' +
      'defeats a naive arrangement is the owner and the provider failing for the same reason. Nothing ' +
      'else in the registry holds the alternate\'s readiness as a checked fact rather than a plan.',
  },
  Constraint: {
    source_concern: 'F01-Q16',
    source_concern_text: 'What is off-limits entirely, and who wrote that list?',
    directive_subject: 'Constraint (§8.11)',
    repair_state: 'G1-06b repaired, pending independent recheck',
    why:
      'Both halves of F01-Q16 need a record. "What is off-limits" is the `predicate` over an explicit ' +
      '`scope`; "who wrote that list" is the `issuer_mandate_ref` and the named `amendment_authority_ref`, ' +
      'and its invariant states the rule that matters — a constraint cannot be changed by whoever finds ' +
      'it inconvenient, and never "inferred from easier implementation". `effective_interval` keeps a ' +
      'withdrawn constraint from silently governing old work, and `superseded` is a phase rather than a ' +
      'deletion. Directive §8.11 names Constraint as a required schema subject, which says a schema must ' +
      'exist; F01-Q16 is what says what it must do.',
  },
  AccessGraph: {
    derived_control_machinery: true,
    derived_from_record: 'DeletionScope',
    obligation:
      'Continuing restriction must cover late derivatives, offline rejoin and physical copies, and ' +
      'unknown copies must remain EXPLICIT residuals rather than absent ones. That obligation cannot be ' +
      'discharged without an enumeration of the descendant surface at a witnessed source frontier, with ' +
      'what it failed to reach declared on its face.',
    repair_state: 'G1-06b repaired, pending independent recheck',
    why:
      'It is a derived-projection record, not a business fact: nothing is decided by creating one, and it ' +
      'is the same shape as DependencyClosure for the same reason. Its invariant — actual enumeration ' +
      'proves the declared descendant surface, and incomplete or unknown access paths stay explicit — is ' +
      'a property of the enumeration rather than of any duty a person holds, which is why no source ' +
      'concern names it directly. The nearest concerns it serves are F16-Q07, "how is access revoked ' +
      'quickly", and F02-Q11, "how is work stopped in the middle, and what is left behind": both are ' +
      'answerable only if the leftovers can be named, and `incomplete` is a phase precisely so that an ' +
      'unfinished enumeration cannot be read as an empty one.',
  },
};

/** What the registry actually carries: the justification plus its provenance. One definition,
 *  so that `verify` compares against exactly what `project --write` writes. */
const projected = (name) => {
  // `repair_state` is destructured OUT and re-appended last so that the eleven G1-06 entries,
  // which declare none, keep byte-identical key order against what is already committed. Put the
  // default first and spread over it and every one of them reads as divergent.
  const { repair_state, ...rest } = JUSTIFICATIONS[name];
  return {
    ...rest,
    recorded_by: 'scripts/vision-record-registry.mjs',
    repair_state: repair_state || 'G1-06 repaired, pending independent recheck',
  };
};

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
  console.log(
    `justifications required     ${Object.keys(JUSTIFICATIONS).length} ` +
      `(G1-06's eleven + G1-06b's eight)`,
  );
  const present = Object.keys(JUSTIFICATIONS).filter((k) => reg[k] && reg[k].justification).length;
  console.log(`justifications present      ${present}`);
  const orphans = orphanCensus(reg);
  const extra = orphans.filter((o) => !JUSTIFICATIONS[o]);
  console.log(`named nowhere outside contracts/ under this census: ${orphans.length}`);
  console.log(`  corpus: ${CENSUS_CORPUS}`);
  console.log(`  every justified record is in it: ${Object.keys(JUSTIFICATIONS).every((k) => orphans.includes(k))}`);
  console.log(`  of those, carrying NO justification (${extra.length}): ${extra.join(', ') || 'none'}`);
  // The census total does not move when a justification is added, and saying so here stops the
  // next reader treating a nonzero O1 as unfinished work. O1 asks whether the CORPUS names the
  // record; a justification is written inside contracts/, which the corpus does not include.
  console.log(
    `  note: adding a justification cannot reduce the census total — O1 measures whether the\n` +
      `        corpus names the record, and a justification lives in contracts/. The number that\n` +
      `        reaches 0 is the line above it.`,
  );
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
