#!/usr/bin/env node
// POSTURE: TOOL. `plan` is read-only and always exits 0 unless it cannot read the tree.
// `apply` writes, and REFUSES — exit 1, nothing written — when a named entry is pinned by
// rule 1 or rule 3. It is not wired into `npm run check`: a tool that mutates memory files
// must be run deliberately, by a human or by an agent that meant to. What IS wired into the
// suite is `scripts/evict-memory.test.mjs`, which pins every refusal by mutation.
//
// scripts/evict-memory.mjs — typed, dependency-linked eviction for .claude/memory/DECISIONS.md.
//
//   node scripts/evict-memory.mjs plan                    classify every entry, write nothing
//   node scripts/evict-memory.mjs plan --json             the same, machine-readable
//   node scripts/evict-memory.mjs apply --only <sel>...   evict the named entries
//   node scripts/evict-memory.mjs apply --only <sel> --dry-run   compute the write, skip it
//
// A selector is `YYYY-MM-DD` when that date is unique in the file, or `YYYY-MM-DD::<substring
// of the title>` when it is not. Six live entries share 2026-08-11, so the second form is the
// normal one. A selector matching zero or more than one entry is an error, never a guess:
// `apply` picking "the first 2026-08-11" would delete a body the caller did not look at.
//
// `--reason` may be given once for the whole batch, or once per `--only` in the same order.
//
// ── READ THE `net` COLUMN OF `plan` BEFORE CHOOSING WHAT TO EVICT ───────────────────────────
//
// Eviction does not free an entry's size; it frees the entry MINUS the stub that replaces it,
// and the stub grows with the number of citations it must name. Measured on the live file: the
// `"Subagents cannot spawn subagents" is false` entry is 1,035 bytes and is cited in 23 places,
// so its stub came to 1,004 bytes and evicting it freed **31 bytes**. The entry was left in place
// for that reason. This is the number worth acting on, and it is not size and not age — a small
// heavily-cited entry is load-bearing, and the residue rule says so in bytes before you commit.
//
// ── THE RULES ARE IN scripts/lib/memory-entries.js, NOT HERE ────────────────────────────────
//
// This file is the CLI and the writer. Classification — rules 1 through 3, subject existence,
// the citation scan — lives in the library, so `check-memory-budget.mjs` and this tool cannot
// drift into two answers about what an entry is. Read the library header first; it explains why
// eviction is typed rather than by recency, and what the scan cannot see.
//
// ── WHERE THE EVICTED BYTES GO, AND WHY THAT IS THE HARD PART ───────────────────────────────
//
// The archive carries the SAME 40,000-byte cap as DECISIONS.md and, measured on this branch
// before the first rotation, already held 34,472 of it. So moving entries out of DECISIONS.md
// relocates the pressure instead of relieving it — a fact TARGET-ARCHITECTURE.md §7 predicted
// in as many words ("otherwise the pressure simply relocates"), and the only outcome a single
// capped archive can reach is the one nobody wants: a cap that can only be met by deleting
// history will be met by deleting history.
//
// SO THE ARCHIVE ROTATES INTO INDEPENDENTLY CAPPED VOLUMES.
//
//   volume 1  .claude/memory/DECISIONS_ARCHIVE.md      (the legacy name, kept)
//   volume 2  .claude/memory/DECISIONS_ARCHIVE_002.md
//   volume N  .claude/memory/DECISIONS_ARCHIVE_00N.md
//
// Every volume is capped at 40,000 by `check-memory-budget.mjs`, which globs the set rather
// than naming one file. What that bounds is the thing worth bounding: what any single reader
// must load. It does NOT bound the lifetime total, and it is not pretending to — the lifetime
// total of an append-only decision log SHOULD grow, and a mechanism that caps it is a mechanism
// for losing decisions.
//
// THE BRIEF PROPOSED KEYING VOLUMES BY PERIOD (`DECISIONS_ARCHIVE_<period>.md`) AND THIS KEYS
// THEM BY SEQUENCE. Same design, different key, and the reason is that a period key needs a
// second rule the moment one period overflows: nothing stops a single month's eviction from
// exceeding 40,000 bytes, and then `DECISIONS_ARCHIVE_2026-08.md` needs a suffix, which is a
// sequence number wearing a date's clothes. A sequence key needs one rule and cannot breach.
// The period is not lost — each volume header records the span it covers, and every entry
// inside carries its own date, which is where a date cannot drift from its content.
//
// THE WRITER STOPS AT 90% OF THE CAP, NOT AT THE CAP. `check-memory-budget.mjs` is the hard
// wall; this tool must not park a volume against it. A volume filled to 39,980 bytes is a file
// that fails CI the next time anyone corrects a typo in it — the failure would be real, blocking,
// and about nothing. The 10% reserve is expressed against the cap rather than as a byte count so
// that changing the cap moves it too.
//
// ── ONE EVICTION EVENT WRITES TO ONE VOLUME ─────────────────────────────────────────────────
//
// The batch goes to the highest-numbered volume that can hold ALL of it under the fill ceiling,
// or to a new volume. It is never split across two. Splitting would put records created by one
// decision in two files for no reason a later reader could reconstruct, and it would make the
// "did every byte survive?" arithmetic a two-file sum — which is the check most likely to be
// skipped when it is inconvenient.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  parseDecisionEntries,
  classifyEntry,
  loadClaims,
} = require('./lib/memory-entries.js');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

/**
 * Volume byte cap. Deliberately the same constant `check-memory-budget.mjs` enforces — the two
 * are asserted equal by scripts/evict-memory.test.mjs, so this cannot silently become the more
 * generous of two numbers.
 */
const VOLUME_BYTE_CAP = 40_000;

/** The writer's ceiling: 90% of the cap. See the reserve note in this file's header. */
const VOLUME_FILL_CEILING = Math.floor(VOLUME_BYTE_CAP * 0.9);

const MEMORY_DIR = ['.claude', 'memory'];
const DECISIONS_REL = '.claude/memory/DECISIONS.md';
const VOLUME_RE = /^DECISIONS_ARCHIVE(?:_(\d{3}))?\.md$/;

// ── argv ────────────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const cmd = argv[0];
const flagValue = (name) => {
  const i = argv.indexOf(name);
  return i === -1 || i + 1 >= argv.length ? null : argv[i + 1];
};
const flagValues = (name) => {
  const out = [];
  for (let i = 0; i < argv.length; i++) if (argv[i] === name && argv[i + 1]) out.push(argv[i + 1]);
  return out;
};
const has = (name) => argv.includes(name);

const ROOT = path.resolve(flagValue('--root') || REPO);
const JSON_OUT = has('--json');
const DRY_RUN = has('--dry-run');
const TODAY = flagValue('--date') || new Date().toISOString().slice(0, 10);

// ── tree access ─────────────────────────────────────────────────────────────────────────────

/**
 * The tracked+untracked file list, from git, for the citation scan.
 *
 * Returns null rather than falling back to a directory walk. A walk would sweep node_modules
 * and build output into the scan, so an entry could look "cited" by a vendored copy of itself —
 * and, worse, the answer would differ between a working tree and a clean clone. When this
 * returns null the caller reports the scan as UNPERFORMED. Rule 10: a resolver never passes
 * what it could not check.
 */
function listFiles(root) {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    return out.split('\0').filter(Boolean);
  } catch {
    return null;
  }
}

function decisionsPath(root) { return path.join(root, ...MEMORY_DIR, 'DECISIONS.md'); }

/** Every archive volume on disk, lowest number first. Volume 1 is the un-suffixed legacy name. */
function volumes(root) {
  const dir = path.join(root, ...MEMORY_DIR);
  let names;
  try { names = fs.readdirSync(dir); } catch { return []; }
  return names
    .map((name) => ({ name, m: name.match(VOLUME_RE) }))
    .filter((v) => v.m)
    .map((v) => ({
      number: v.m[1] ? Number(v.m[1]) : 1,
      name: v.name,
      abs: path.join(dir, v.name),
      bytes: Buffer.byteLength(fs.readFileSync(path.join(dir, v.name), 'utf8'), 'utf8'),
    }))
    .sort((a, b) => a.number - b.number);
}

function volumeName(number) {
  return number === 1 ? 'DECISIONS_ARCHIVE.md' : `DECISIONS_ARCHIVE_${String(number).padStart(3, '0')}.md`;
}

/**
 * Which volume takes this batch: the highest-numbered one that can hold all of it under the
 * fill ceiling, else the next number up.
 *
 * "Highest-numbered" and not "any with room" on purpose. Backfilling a gap in an older volume
 * would interleave eviction events across the archive, so reading the history in order would
 * mean reading every volume. Monotonic append keeps volume order and chronological order the
 * same fact.
 */
function targetVolume(root, batchBytes) {
  const vols = volumes(root);
  const newest = vols.length ? vols[vols.length - 1] : null;
  if (newest && newest.bytes + batchBytes <= VOLUME_FILL_CEILING) {
    return { ...newest, fresh: false };
  }
  const number = newest ? newest.number + 1 : 1;
  const name = volumeName(number);
  return {
    number, name, abs: path.join(root, ...MEMORY_DIR, name), bytes: 0, fresh: true,
  };
}

// ── residue ─────────────────────────────────────────────────────────────────────────────────

/**
 * The stub that survives an eviction — RULE 4. Without it, archival is deletion with extra steps.
 *
 * Shape follows the stubs already in the file: the original `## DATE — Title` heading, unchanged
 * so every by-date and by-title citation still resolves, then one italic line naming the volume,
 * the eviction date, the reason, and WHO CITES IT.
 *
 * The citation sentence never says "no citations". It says which scans ran and what they found,
 * because the 2026-08-22 eviction wrote "no citations" into four stubs while by-date and
 * by-paraphrase citations existed, and a stub that overstates its own diligence is worse than one
 * that states none — the next reader deletes the body on its authority.
 */
function stubFor(entry, cls, volume, reason) {
  const head = [`*Archived to \`${volume.name}\` (${TODAY}). ${reason}*`];
  const cited = cls.citations?.prose || [];
  const scans = [];
  if (cited.length) {
    const shown = cited.slice(0, 6).map((c) => `\`${c.where}\` (${c.how})`).join(', ');
    const more = cited.length > 6 ? `, and ${cited.length - 6} more` : '';
    scans.push(`***Cited in prose by ${cited.length} location(s)**, which the heading above keeps resolvable: ${shown}${more}.*`);
  } else {
    scans.push('*The date scan and the title-phrase scan over every git-tracked file found no citer.*');
  }
  scans.push(
    `*Not checked: ${(cls.citations?.unchecked || ['paraphrase']).join(', ')} — a citation that names neither the date ` +
    'nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*'
  );
  return [entry.heading, ...head, ...scans].join('\n');
}

/** A fresh volume's header — what it is, what caps it, and what may not be done to it. */
function volumeHeader(number) {
  return [
    `# Architecture & Strategy Decisions — Archive, volume ${number}`,
    '',
    `*Opened ${TODAY} by \`node scripts/evict-memory.mjs apply\`. This is an archive VOLUME: it is`,
    `capped at ${VOLUME_BYTE_CAP.toLocaleString()} bytes by \`scripts/check-memory-budget.mjs\`, which globs every`,
    '`DECISIONS_ARCHIVE*.md` rather than naming one file. When this volume fills, the eviction tool opens the',
    'next one — the cap bounds what a reader must load, never the lifetime total, because a cap on the lifetime',
    'total of an append-only decision log is a mechanism for losing decisions.*',
    '',
    '*Every entry below was moved here by the typed eviction in `scripts/lib/memory-entries.js`, leaving a stub',
    'in `DECISIONS.md` under the same heading. Before deleting anything from this file: grep the entry\'s **date**',
    'and its distinctive **body** phrases, not only its title. The 2026-08-22 eviction ran a title grep alone and',
    'four of its seven stubs claimed "no citations" while citations by date and by paraphrase existed.*',
    '',
    '---',
    '',
  ].join('\n');
}

// ── commands ────────────────────────────────────────────────────────────────────────────────

function readState(root) {
  const abs = decisionsPath(root);
  if (!fs.existsSync(abs)) {
    process.stderr.write(`evict-memory: ${abs} does not exist\n`);
    process.exitCode = 1;
    return null;
  }
  const text = fs.readFileSync(abs, 'utf8');
  const entries = parseDecisionEntries(text);
  const corpus = loadClaims(root, listFiles);
  const ctx = { root, claims: corpus.claims, files: corpus.files, decisionsRel: DECISIONS_REL };
  const classified = entries.map((e) => ({ entry: e, cls: classifyEntry(e, ctx) }));
  return { abs, text, entries, corpus, classified };
}

function cmdPlan() {
  const s = readState(ROOT);
  if (!s) return;
  const bytes = Buffer.byteLength(s.text, 'utf8');
  // The projected stub is built with the SAME function `apply` uses, so `net` is the gain the
  // eviction would actually produce rather than an estimate of it. A separate estimator here
  // would be a second implementation of the residue, and it would be the optimistic one.
  const previewVolume = { name: 'DECISIONS_ARCHIVE.md' };
  const rows = s.classified.map(({ entry, cls }) => {
    const stubBytes = cls.citations
      ? Buffer.byteLength(stubFor(entry, cls, previewVolume, 'Projected.'), 'utf8')
      : null;
    return {
      date: entry.date,
      title: entry.title,
      bytes: entry.bytes,
      reversibility: entry.reversibility,
      subject: cls.subject,
      disposition: cls.disposition,
      reasons: cls.reasons,
      prose_citations: cls.citations ? cls.citations.prose.length : null,
      claim_citations: cls.citations ? cls.citations.claims.map((c) => c.id) : null,
      projected_stub_bytes: stubBytes,
      projected_net_gain: stubBytes === null ? null : entry.bytes - stubBytes,
    };
  });

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({
      root: ROOT,
      decisions: { bytes, cap: VOLUME_BYTE_CAP, headroom: VOLUME_BYTE_CAP - bytes, entries: s.entries.length },
      volumes: volumes(ROOT).map((v) => ({ number: v.number, name: v.name, bytes: v.bytes, cap: VOLUME_BYTE_CAP })),
      claim_scan: s.corpus.available
        ? { performed: true, claims: s.corpus.claims.length }
        : { performed: false, why: 'git ls-files unavailable — the citation scan did NOT run' },
      entries: rows,
    }, null, 2) + '\n');
    return;
  }

  process.stdout.write(
    `DECISIONS.md — ${bytes.toLocaleString()} / ${VOLUME_BYTE_CAP.toLocaleString()} bytes ` +
    `(${(VOLUME_BYTE_CAP - bytes).toLocaleString()} free) · ${s.entries.length} entries\n`
  );
  for (const v of volumes(ROOT)) {
    process.stdout.write(`  volume ${v.number}: ${v.name} — ${v.bytes.toLocaleString()} / ${VOLUME_BYTE_CAP.toLocaleString()} bytes\n`);
  }
  process.stdout.write(
    s.corpus.available
      ? `  claim scan: ${s.corpus.claims.length} live claims over ${s.corpus.files.length} tracked files\n\n`
      : '  claim scan: NOT PERFORMED (git ls-files unavailable) — no entry below may be evicted on this run\n\n'
  );

  const order = ['orphaned', 'eligible', 'guarded', 'refused', 'archived'];
  for (const group of order) {
    const inGroup = rows.filter((r) => r.disposition === group);
    if (!inGroup.length) continue;
    const total = inGroup.reduce((a, r) => a + r.bytes, 0);
    process.stdout.write(`${group.toUpperCase()} — ${inGroup.length} entr${inGroup.length === 1 ? 'y' : 'ies'}, ${total.toLocaleString()} bytes\n`);
    for (const r of inGroup) {
      const net = r.projected_net_gain === null ? '    —' : `${String(r.projected_net_gain).padStart(5)}`;
      process.stdout.write(`  ${r.date}  ${String(r.bytes).padStart(5)}B  net ${net}B  ${r.title.slice(0, 56)}\n`);
      for (const why of r.reasons) process.stdout.write(`         ${why}\n`);
      if (r.prose_citations) process.stdout.write(`         prose citations found: ${r.prose_citations}\n`);
    }
    process.stdout.write('\n');
  }
}

/** Resolve one `YYYY-MM-DD` or `YYYY-MM-DD::substring` selector to exactly one entry. */
function resolveSelector(sel, classified) {
  const [date, needle] = sel.split('::');
  let hits = classified.filter((c) => c.entry.date === date);
  if (needle) {
    const n = needle.toLowerCase();
    hits = hits.filter((c) => c.entry.title.toLowerCase().includes(n));
  }
  if (hits.length === 1) return { ok: true, hit: hits[0] };
  if (hits.length === 0) return { ok: false, why: `selector "${sel}" matches no entry` };
  return {
    ok: false,
    why: `selector "${sel}" matches ${hits.length} entries — add ::<title substring>:\n` +
      hits.map((h) => `      ${h.entry.date}::${h.entry.title.slice(0, 50)}`).join('\n'),
  };
}

function cmdApply() {
  const s = readState(ROOT);
  if (!s) return;

  const selectors = flagValues('--only');
  if (!selectors.length) {
    process.stderr.write('evict-memory apply: --only <selector> is required. Run `plan` first.\n');
    process.exitCode = 1;
    return;
  }

  // The citation scan is a precondition, not a nicety. Rule 3 pins entries cited by a live
  // claim; if the corpus could not be loaded, every entry looks uncited and the pin silently
  // does nothing. Refuse rather than evict against a scan that did not run.
  if (!s.corpus.available) {
    process.stderr.write(
      'evict-memory apply: REFUSED — the live-claim scan did not run (git ls-files failed).\n' +
      '  Rule 3 pins entries cited by a live claim. Against an unloaded corpus every entry looks\n' +
      '  uncited, so applying now would evict a pinned entry and report success.\n'
    );
    process.exitCode = 1;
    return;
  }

  const chosen = [];
  const problems = [];
  for (const sel of selectors) {
    const r = resolveSelector(sel, s.classified);
    if (!r.ok) { problems.push(r.why); continue; }
    if (chosen.some((c) => c.entry.startLine === r.hit.entry.startLine)) continue;
    chosen.push(r.hit);
  }
  if (problems.length) {
    for (const p of problems) process.stderr.write(`evict-memory apply: ${p}\n`);
    process.exitCode = 1;
    return;
  }

  // RULES 1 and 3 refuse here, and there is no override flag. An `--i-know-what-im-doing`
  // would turn both rules into suggestions, and a suggestion is what DECISIONS.md already had.
  const refused = chosen.filter(({ cls }) => cls.disposition === 'refused');
  if (refused.length) {
    process.stderr.write(`evict-memory apply: REFUSED — ${refused.length} of ${chosen.length} selected entries are pinned. Nothing written.\n`);
    for (const { entry, cls } of refused) {
      process.stderr.write(`  ${entry.date} — ${entry.title}\n`);
      for (const why of cls.reasons) process.stderr.write(`      ${why}\n`);
    }
    process.exitCode = 1;
    return;
  }
  const alreadyGone = chosen.filter(({ cls }) => cls.disposition === 'archived');
  if (alreadyGone.length) {
    process.stderr.write(`evict-memory apply: ${alreadyGone.length} selected entr${alreadyGone.length === 1 ? 'y is' : 'ies are'} already a stub. Nothing written.\n`);
    process.exitCode = 1;
    return;
  }

  // ── reasons: one for the batch, or one per entry ──────────────────────────────────────────
  //
  // Positional pairing, because the alternative is worse in both directions. A single shared
  // reason across eight entries writes the same sentence into eight stubs, which tells a later
  // reader nothing about the specific record they are holding. Running eight one-entry batches to
  // get eight reasons breaks the one-event-one-volume rule — measured: it put entry 1 into volume
  // 1 and entries 2-8 into volume 2, leaving volume 1 parked 492 bytes under the writer ceiling.
  const reasons = flagValues('--reason');
  const DEFAULT_REASON = 'Superseded or complete; the body is preserved verbatim in the volume named above.';
  if (reasons.length > 1 && reasons.length !== chosen.length) {
    process.stderr.write(
      `evict-memory apply: ${reasons.length} --reason values for ${chosen.length} entries. Give one reason for\n` +
      '  the whole batch, or exactly one per --only in the same order. Nothing written.\n'
    );
    process.exitCode = 1;
    return;
  }
  const reasonFor = (i) => (reasons.length === 0 ? DEFAULT_REASON : reasons.length === 1 ? reasons[0] : reasons[i]);

  // ── the write, computed before anything is touched ────────────────────────────────────────
  const bodies = chosen.map(({ entry }) => entry.text.replace(/\s+$/, ''));
  const batchBytes = Buffer.byteLength(bodies.join('\n\n') + '\n\n', 'utf8');
  const vol = targetVolume(ROOT, batchBytes);

  if (vol.fresh && batchBytes + Buffer.byteLength(volumeHeader(vol.number), 'utf8') > VOLUME_FILL_CEILING) {
    process.stderr.write(
      `evict-memory apply: REFUSED — this batch is ${batchBytes.toLocaleString()} bytes and would fill a fresh volume\n` +
      `  past the ${VOLUME_FILL_CEILING.toLocaleString()}-byte writer ceiling. Split it into two runs.\n`
    );
    process.exitCode = 1;
    return;
  }

  let newDecisions = s.text;
  const stubs = [];
  // Replace from the bottom up so the earlier entries' offsets stay valid. The reason index is
  // taken from the SELECTION order, not this reversed one, so `--reason` pairs with `--only` as
  // the caller wrote them.
  const ordered = chosen
    .map((c, i) => ({ ...c, reason: reasonFor(i) }))
    .sort((a, b) => b.entry.startLine - a.entry.startLine);
  for (const { entry, cls, reason } of ordered) {
    const stub = stubFor(entry, cls, vol, reason);
    const trimmed = entry.text.replace(/\s+$/, '');
    // The blank line(s) after an entry are the file's separator, not the entry's content, so
    // they stay behind with the stub. Counting them as residue is what makes the conservation
    // arithmetic below close to zero instead of to "8, which is one newline per entry, probably".
    const trailing = entry.text.slice(trimmed.length);
    const at = newDecisions.indexOf(entry.text);
    if (at === -1) {
      process.stderr.write(`evict-memory apply: could not locate "${entry.heading}" for replacement. Nothing written.\n`);
      process.exitCode = 1;
      return;
    }
    stubs.push({
      date: entry.date,
      bytes: Buffer.byteLength(stub + trailing, 'utf8'),
      from: entry.bytes,
    });
    newDecisions = newDecisions.slice(0, at) + stub + trailing + newDecisions.slice(at + entry.text.length);
  }

  const volExisting = vol.fresh ? volumeHeader(vol.number) : fs.readFileSync(vol.abs, 'utf8');
  const newVolume = volExisting.replace(/\s*$/, '\n\n') + bodies.join('\n\n') + '\n';

  const before = { decisions: Buffer.byteLength(s.text, 'utf8'), volume: vol.bytes };
  const after = { decisions: Buffer.byteLength(newDecisions, 'utf8'), volume: Buffer.byteLength(newVolume, 'utf8') };
  const movedBodies = chosen.reduce((a, c) => a + c.entry.bytes, 0);
  const residue = stubs.reduce((a, s2) => a + s2.bytes, 0);

  // ── CONSERVATION, CHECKED RATHER THAN ASSERTED ────────────────────────────────────────────
  //
  // "Nothing was lost" is the one claim an eviction tool must not make on its author's word, so
  // it is a precondition of the write rather than a line in the report. Two independent checks,
  // because they fail differently:
  //
  //   BYTES   every byte that left DECISIONS.md is either a stub byte still there or a body byte
  //           now in the volume. An off-by-anything means the splice ate something.
  //   CONTENT the trimmed body of each evicted entry appears VERBATIM in the new volume, and its
  //           heading still appears in the new DECISIONS.md. Byte arithmetic alone would be
  //           satisfied by moving the right NUMBER of the wrong bytes.
  const conservation = [];
  const removed = before.decisions - after.decisions;
  if (removed !== movedBodies - residue) {
    conservation.push(
      `byte arithmetic does not close: DECISIONS.md lost ${removed} bytes, but bodies moved ` +
      `(${movedBodies}) minus residue left behind (${residue}) is ${movedBodies - residue}`
    );
  }
  for (const { entry } of chosen) {
    if (!newVolume.includes(entry.text.replace(/\s+$/, ''))) {
      conservation.push(`body of "${entry.heading}" is not present verbatim in ${vol.name}`);
    }
    if (!newDecisions.includes(entry.heading)) {
      conservation.push(`heading "${entry.heading}" did not survive in DECISIONS.md — rule 4 residue missing`);
    }
  }
  if (conservation.length) {
    process.stderr.write('evict-memory apply: REFUSED — conservation check failed. Nothing written.\n');
    for (const c of conservation) process.stderr.write(`  ${c}\n`);
    process.exitCode = 1;
    return;
  }

  const report = {
    root: ROOT,
    dry_run: DRY_RUN,
    volume: { number: vol.number, name: vol.name, fresh: vol.fresh },
    evicted: chosen.map(({ entry, cls }) => ({
      date: entry.date,
      title: entry.title,
      bytes: entry.bytes,
      disposition: cls.disposition,
      prose_citations: cls.citations.prose.length,
    })),
    bytes: {
      decisions_before: before.decisions,
      decisions_after: after.decisions,
      decisions_headroom_after: VOLUME_BYTE_CAP - after.decisions,
      volume_before: before.volume,
      volume_after: after.volume,
      volume_headroom_after: VOLUME_BYTE_CAP - after.volume,
      bodies_moved: movedBodies,
      residue_left_behind: residue,
      decisions_reduction: removed,
      conservation_closes: true,
    },
  };

  if (!DRY_RUN) {
    fs.writeFileSync(vol.abs, newVolume);
    fs.writeFileSync(s.abs, newDecisions);
  }

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return;
  }
  process.stdout.write(
    `${DRY_RUN ? 'DRY RUN — nothing written' : 'Evicted'} ${chosen.length} entr${chosen.length === 1 ? 'y' : 'ies'} → ${vol.name}${vol.fresh ? ' (new volume)' : ''}\n`
  );
  for (const e of report.evicted) {
    process.stdout.write(`  ${e.date}  ${String(e.bytes).padStart(5)}B  ${e.disposition}  ${e.prose_citations} prose citation(s)  ${e.title.slice(0, 52)}\n`);
  }
  process.stdout.write(
    `\nDECISIONS.md  ${before.decisions.toLocaleString()} → ${after.decisions.toLocaleString()} bytes ` +
    `(${(VOLUME_BYTE_CAP - after.decisions).toLocaleString()} free)\n` +
    `${vol.name}  ${before.volume.toLocaleString()} → ${after.volume.toLocaleString()} bytes ` +
    `(${(VOLUME_BYTE_CAP - after.volume).toLocaleString()} free)\n` +
    `bodies moved ${movedBodies.toLocaleString()}B · residue left behind ${residue.toLocaleString()}B · ` +
    `reduction ${removed.toLocaleString()}B — conservation closes to zero\n`
  );
}

// process.exitCode, NOT process.exit(). Stdout to a PIPE is asynchronous, so `process.exit()`
// after a console write tears the process down with the write still queued — the payload is cut
// at exactly 65536 bytes and the exit status still reads 0. Six scripts carried that shape and
// were fixed on 2026-08-24; see scripts/check-dispatch-agenttype.mjs for the measurement and for
// why fs.writeSync is not the fix. `plan --json` over a full DECISIONS.md is the payload here
// most likely to grow past the buffer, which is exactly why this file does not use exit().
if (cmd === 'plan') {
  cmdPlan();
} else if (cmd === 'apply') {
  cmdApply();
} else {
  process.stderr.write(
    'usage: node scripts/evict-memory.mjs plan [--json] [--root DIR]\n' +
    '       node scripts/evict-memory.mjs apply --only <YYYY-MM-DD[::title substring]> [--only ...]\n' +
    '                                           [--reason "..."] [--dry-run] [--json] [--root DIR]\n'
  );
  process.exitCode = 1;
}
