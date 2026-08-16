#!/usr/bin/env node
// POSTURE: BLOCKS. `ledger build --check` exits 1 when the committed index does not
// match what the artifacts say, and `ledger verify` exits 1 when a claim on an
// `enforcement: block` path fails or cannot be resolved. Both run in
// .github/workflows/ci.yml. Everything else is shadow: computed, logged, non-blocking.
//
// scripts/ledger.mjs — the claim ledger.
//
//   node scripts/ledger.mjs build            regenerate .claude/ledger/index.json
//   node scripts/ledger.mjs build --check    exit 1 if the committed index has drifted
//   node scripts/ledger.mjs rebuild          same as build — the name ADR-001 uses
//   node scripts/ledger.mjs lint             parse + schema only (no resolvers)
//   node scripts/ledger.mjs verify           run every resolver, log, block where required
//   node scripts/ledger.mjs verify --offline skip network; report unresolved, never pass
//   node scripts/ledger.mjs judge <claim-id> print the lens pack for a judged claim
//   node scripts/ledger.mjs locate [id]      resolve claim positions from the artifacts now
//   node scripts/ledger.mjs views            render the generated views over the ledger
//
// THE INDEX IS NEVER HAND-EDITED. It is compiled from claims that live inside the
// artifacts they support, so a claim cannot drift away from the thing it is about.
// `--check` is what makes that true rather than aspirational: edit the index by hand and
// CI fails, exactly as it does for .claude/skills/MANIFEST.json.
//
// IT RECORDS WHAT A CLAIM SAYS, NEVER WHERE IT SITS. The index held a `source_line` per
// claim until this was fixed, and a line number moves whenever text above it moves — so a
// prose edit in a file's introduction failed the build with every claim byte-identical.
// The check must be coupled to content, or it fails for reasons the author cannot act on
// and teaches everyone to rebuild-and-commit reflexively, which is how a gate stops being
// read. Positions are still available; `locate` computes them on demand. See KEY_ORDER.
//
// BYTE-IDENTICAL FROM A CLEAN CLONE is a design constraint, not a nice-to-have. The
// index therefore contains NO timestamp, no absolute path, no hostname and no machine
// state — only content derived from tracked files, in `git ls-files` order. ADR-001:
// "the DB has no write path of its own... if they disagree, git wins and you rebuild —
// there is no reconciliation path to get wrong."
//
// THREE SCOPES
//   global   ~/.warroom/ledger/global.yml — reaches every project on this machine
//   project  claims in this repository's tracked files → .claude/ledger/index.json
//   task     claims on a branch; they die with the branch because the files do

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseClaimsFromText, parseYamlSubset, validateClaim } = require('./lib/claims.js');
const { loadRules, classifyFile } = require('./lib/classifier.js');
const resolvers = require('./lib/resolvers.js');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const TIER_MAP = path.join(REPO_ROOT, '.claude', 'qa-tier-floor.yml');
const INDEX_PATH = path.join(REPO_ROOT, '.claude', 'ledger', 'index.json');
// The global ledger, and an explicit seam for pointing at a different one.
//
// This was `path.join(os.homedir(), ...)` with no override, which made the producer the
// only uninjectable side of the system: `belief.ts` already takes `readGlobalLedger(
// ledgerPath = globalLedgerPath())` and an `opts.globalLedgerPath`. The consumer could be
// aimed at a fixture and the producer could not.
//
// A test could still move it by setting $HOME on the child, and that works — but $HOME is
// a blunt knob. `eventsPath()` also resolves through `os.homedir()`, so moving HOME to
// reach the ledger silently moves the run log too. One control that moves two things is
// how a test ends up asserting against a file it did not mean to write. This names the one
// thing, following the `WARROOM_EVENTS` precedent eight lines below.
//
// WHY THIS IS NOT OPTIONAL. On a machine with no `~/.warroom/ledger/global.yml` — every CI
// runner — there are zero global claims. Measured: `HOME=<empty> ledger locate` lists 33
// claims where this machine lists 37. So a test that exercises global behaviour by reading
// the REAL ledger iterates an empty set in CI and passes. Green locally for the right
// reason, green in CI for the wrong one, and CI's is the green nobody inspects.
const GLOBAL_LEDGER = process.env.WARROOM_GLOBAL_LEDGER
  || path.join(os.homedir(), '.warroom', 'ledger', 'global.yml');

// What to CALL it. `~/.warroom/ledger/global.yml` is the form people recognise, and it is
// only true when the path really is the default under this machine's home. An override
// displayed under the tilde name would be a label asserting something it did not check —
// which is the defect class this file has spent three commits removing.
const GLOBAL_LABEL = process.env.WARROOM_GLOBAL_LEDGER
  ? GLOBAL_LEDGER
  : '~/.warroom/ledger/global.yml';
const INDEX_VERSION = 1;

// ── Where events go ─────────────────────────────────────────────────────────
// The run log the launcher already writes. Resolution order is explicit and the chosen
// path is always printed, because "which log did it write to" is the first question
// asked when a would_block cannot be found.
function eventsPath() {
  if (process.env.WARROOM_EVENTS) return process.env.WARROOM_EVENTS;
  const cfgPath = path.join(REPO_ROOT, '.warroom.yml');
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = parseYamlSubset(fs.readFileSync(cfgPath, 'utf8')) || {};
      const stateDir = cfg.state_dir
        ? String(cfg.state_dir).replace(/^~/, os.homedir())
        : (cfg.session ? path.join(os.homedir(), `.${cfg.session}`) : null);
      if (stateDir) return path.join(stateDir, 'events.jsonl');
    } catch { /* fall through to the in-repo log */ }
  }
  return path.join(REPO_ROOT, '.ledger-events.jsonl');
}

function logEvent(obj) {
  const p = eventsPath();
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, JSON.stringify(obj) + '\n');
    return p;
  } catch (e) {
    process.stderr.write(`ledger: could not write ${p}: ${e.message}\n`);
    return null;
  }
}

// ── Collecting claims ───────────────────────────────────────────────────────

// Files the index is built from: tracked, PLUS untracked-and-not-ignored.
//
// Tracked-only would have been simpler and is wrong. A new doc's claims would then be
// invisible to `ledger lint` until someone remembered to `git add` — a silent skip on
// exactly the question the author is asking ("are my claims checked?"). Untracked files
// are included and *named*, so the one place this can differ from a clean clone is
// reported rather than discovered. On a CI runner there are no untracked files, so the
// two sets coincide and the index reproduces byte-identically.
function candidateMarkdown() {
  let out;
  try {
    out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (e) {
    // Refuse rather than fall back to a directory walk: a walk would sweep in ignored
    // paths and build directories, and the index would stop reproducing from a clone.
    throw new Error(`git ls-files failed (${e.message}) — the index must be built from git's file list so it reproduces from a clean clone`);
  }
  const files = out.split('\0').filter((f) => f && /\.(md|markdown)$/i.test(f));
  files.sort(); // git already sorts, but --others is appended after --cached
  return files;
}

function untrackedAmong(files) {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--others', '--exclude-standard'],
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const untracked = new Set(out.split('\0').filter(Boolean));
    return files.filter((f) => untracked.has(f));
  } catch {
    return [];
  }
}

function collectProjectClaims() {
  const claims = [];
  const issues = [];
  const notes = [];
  const candidates = candidateMarkdown();
  const untracked = untrackedAmong(candidates);
  for (const rel of candidates) {
    const abs = path.join(REPO_ROOT, rel);
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); }
    catch (e) { issues.push(`${rel}: unreadable (${e.message})`); continue; }
    if (!text.includes('claims:')) continue; // cheap pre-filter; the parser decides
    const r = parseClaimsFromText(text, rel);
    claims.push(...r.claims);
    issues.push(...r.issues);
  }
  const seen = new Map();
  for (const c of claims) {
    if (seen.has(c.id)) {
      issues.push(`duplicate claim id "${c.id}" in ${c.source_file} — already defined in ${seen.get(c.id)}`);
    } else {
      seen.set(c.id, c.source_file);
    }
  }
  issues.push(...checkSupports(claims, seen));

  const claimBearingUntracked = untracked.filter((f) => claims.some((c) => c.source_file === f));
  if (claimBearingUntracked.length > 0) {
    notes.push(
      `${claimBearingUntracked.length} untracked file(s) contributed claims — a clean clone would not have them, ` +
      `so this index will not match CI until they are committed: ${claimBearingUntracked.join(', ')}`
    );
  }
  return { claims, issues, notes };
}

// `supports:` is the blast-radius field: when a claim fails or expires, the system is
// supposed to already know which decisions just became questionable. That only works if
// the targets resolve, so they are checked here rather than trusted.
function checkSupports(claims, byId) {
  const issues = [];
  let adrs = [];
  const adrDir = path.join(REPO_ROOT, 'docs', '03-system-design', 'adr');
  if (fs.existsSync(adrDir)) adrs = fs.readdirSync(adrDir);
  for (const c of claims) {
    for (const target of c.supports || []) {
      if (target.startsWith('d-')) {
        const num = target.slice(2);
        if (!adrs.some((f) => f.startsWith(`${num}-`) && f.endsWith('.md'))) {
          issues.push(`${c.source_file}: claim "${c.id}" supports "${target}", but no docs/03-system-design/adr/${num}-*.md exists`);
        }
      } else if (!byId.has(target)) {
        issues.push(`${c.source_file}: claim "${c.id}" supports "${target}", which is not a claim in the ledger`);
      }
    }
  }
  return issues;
}

// Every `- id:` line in the global ledger, as id → [line, …], measured from the file.
//
// This replaces a stamped `source_line: 0`. Zero was not a line, it was a placeholder that
// `locate` then printed as `~/.warroom/ledger/global.yml:0` for all four global claims —
// c-runtime-nested-spawn really lives at line 36. Shipping a number nobody measured is the
// exact defect this whole change exists to remove, so it went out on the CLI in the same
// series that deleted it from the Mission Control tooltip.
//
// IT RETURNS EVERY HIT, and that is issue #58. The previous shape took one id, collected
// exactly these hits, and returned `null` whenever there was more than one — right for the
// caller that wanted a position, and it discarded the only evidence in the program that two
// entries shared an address. So the global ledger accepted a duplicate id in silence while
// the project path had failed on it since Phase 3: one concept, two loaders, one of them
// checking. The measurement is made once, here, and both consumers read it — the collision
// is reported, and a position is taken only when there is exactly one hit.
//
// A POSITION STAYS ABSENT WHEN IT IS AMBIGUOUS. Callers print the file alone — never a `0`,
// a `?` or a dash, because a character standing in for a measurement is the thing this
// removes. Reporting the duplicate does not change that: the first of two guesses is still
// a guess, and now the reason it cannot be guessed is on the console instead of nowhere.
function globalClaimLines(text) {
  const byId = new Map();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*-\s*id:\s*["']?([^"'\s]+)["']?\s*$/.exec(lines[i]);
    if (!m) continue;
    if (!byId.has(m[1])) byId.set(m[1], []);
    byId.get(m[1]).push(i + 1);
  }
  return byId;
}

function collectGlobalClaims() {
  if (!fs.existsSync(GLOBAL_LEDGER)) {
    return { claims: [], issues: [], present: false };
  }
  const text = fs.readFileSync(GLOBAL_LEDGER, 'utf8');
  // Issue #68. `parseYamlSubset` is strict by design — a tab in indentation, a duplicate
  // key, or an unterminated quote each throw a ClaimError. Without this catch, that throw
  // propagates all the way to main(), and every subcommand dies with a raw stack trace
  // naming files in scripts/ rather than the line in the global ledger that is actually wrong.
  //
  // WHY WE RE-THROW rather than returning {claims:[], issues:[...]}:
  //   A corrupt file rendered as zero global claims is indistinguishable from an absent one
  //   (issue #57's shape, one level down). The throw keeps "corrupt" and "empty" structurally
  //   distinct. The only defect the current code has is the quality of the message, not the
  //   posture. Wrapping the message names the file and the line — both of which the
  //   ClaimError already carries in its message — so the output is actionable.
  //
  // VERIFICATION (three states, three renderings):
  //   absent  → {present: false} → callers print "not present on this machine"
  //   corrupt → throws            → main() prints "ledger: [file]: line N: [problem]"
  //   valid   → {present: true}  → callers proceed normally
  let doc;
  try {
    doc = parseYamlSubset(text);
  } catch (e) {
    // Replace the stack with a one-line message naming the file. The parser error already
    // names the line; e.message is the only field the main() handler needs.
    const err = new Error(`${GLOBAL_LABEL} is malformed and cannot be parsed — ${e.message}`);
    err.stack = err.message;
    throw err;
  }
  const issues = [];
  const claims = [];
  if (!doc || !Array.isArray(doc.claims)) {
    return { claims: [], issues: [`${GLOBAL_LEDGER}: no "claims:" list`], present: true };
  }
  const lineMap = globalClaimLines(text);
  // Which occurrence of this id the current entry is. The parser returns entries in file
  // order, so the nth entry carrying an id sits on the nth line declaring it — and an entry
  // with no id at all cannot desynchronise the rest, because the counter is per id.
  const nth = new Map();
  doc.claims.forEach((c, i) => {
    const where = `${GLOBAL_LABEL} claims[${i}]`;
    const problems = validateClaim(c, where);
    issues.push(...problems);
    if (problems.length > 0) return;
    const hits = lineMap.get(c.id) || [];
    const seenBefore = nth.get(c.id) || 0;
    nth.set(c.id, seenBefore + 1);
    // Reported once, on the second entry, naming BOTH lines — the shape the project path
    // already uses, where it names both files. Reporting it on every colliding entry would
    // render one collision as N-1 findings.
    if (seenBefore > 0) {
      const at = (n) => (n === undefined ? '' : `:${n}`);
      issues.push(
        `duplicate claim id "${c.id}" in ${GLOBAL_LABEL}${at(hits[seenBefore])} — already defined at `
        + `${GLOBAL_LABEL}${at(hits[0])}. An id is the address of a claim: \`supports:\` targets resolve by it, `
        + 'the index is keyed on it, and `locate` refuses to guess between two — so one of these is a claim '
        + 'nothing ever checks while the count reconciles perfectly over the other.'
      );
    }
    if (c.scope !== 'global') {
      issues.push(`${where}: the global ledger may only hold scope:global claims`);
      return;
    }
    const line = hits.length === 1 ? hits[0] : null;
    claims.push({
      ...c,
      source_file: GLOBAL_LABEL,
      // Absent rather than zero when unmeasurable. `undefined` survives into `locate`,
      // which prints the file alone; a `0` would have printed as a position.
      ...(line === null ? {} : { source_line: line }),
      form: 'global',
    });
  });
  return { claims, issues, present: true };
}

// ONE sentence, two callers — and issue #57 is what it cost to have had two.
//
// `verify` printed this and `sweep` printed nothing. Same repo, same commit, only $HOME
// differs — which is the CI condition, where `~/.warroom/ledger/global.yml` does not exist.
// `verify` said so. `sweep` dropped four claims from its working set and printed a bare
// total as though it had checked them, while spending a whole paragraph declaring its OTHER
// blind spot, the missing run log. A tool that declares some of its blind spots teaches you
// it declares all of them, and the care taken over the first absence is exactly what made
// the silence about the second misleading.
//
// The wording is verify's, unchanged — it was already right. The fix is that there is now
// one copy of it, so the two cannot drift apart again.
function globalAbsenceNotice() {
  return `  global scope: ${GLOBAL_LABEL} not present on this machine`
    + ' — 0 global claims checked (this is reported, not skipped silently)\n';
}

// ── prose → claim citations ─────────────────────────────────────────────────
//
// Issue #59. `check-registration.mjs` checks every PATH a governing doc names; `checkSupports`
// above checks every claim→claim `supports:` target. A `c-…` id written in PROSE was checked
// by nothing, so citing `c-tpyo` in a handoff was silent.
//
// WHY THE PATTERN IS WORTH PROTECTING. Prose that cites a claim id instead of restating what
// the claim asserts has two properties a vocabulary search cannot give you: correcting the
// claim corrects every reader at once, and finding every reference is `git grep c-x` — exact,
// with a completion criterion. PR #52 deleted a behaviour and a false warning about it
// survived two independently-authored searches (~25 phrasings, then ~20 disjoint terms)
// because the surviving sentence said "line numbers" where the searches said `source_line`.
// A token search catches tokens; a belief survives paraphrase. But the moment the repo leans
// on citations, they can rot in a new way — which is what makes this check the price of
// recommending them.
//
// DETERMINISTIC, NEVER A MODEL SWEEP. Under Rule 10 a resolver never passes what it could not
// check, and a semantic sweep can honestly report `unresolved` and never `pass`. This is a
// scan: it either resolved the id or it did not.
//
// WHAT COUNTS AS A CITATION — three rules, each load-bearing:
//
//   1. Must be an INLINE CODE SPAN (backtick-wrapped, not fenced). Every citation this repo
//      writes already uses backticks; requiring them costs nothing and eliminates the
//      English-word collision entirely — "c-suite" is never a citation, even in repos that
//      use that word heavily, because it appears bare.
//   2. The span must hold ONLY the id. `node scripts/ledger.mjs locate c-scratch-one` is a
//      shell example, not a citation of c-scratch-one. The span content must satisfy
//      CITED_ID_RE, which is the same grammar claims.js uses for id validation.
//   3. The span must be OUTSIDE a fenced block and outside YAML frontmatter. Inside a fence
//      an id is a definition or example; `claims` blocks define claims, and the agent files
//      carry JSON return-contract samples full of invented ids like `c-rate-limit-enforced`.
//      Nesting is honoured (a ````markdown fence wrapping a ```claims one closes only on the
//      longer fence), or the inner fence would close the outer and every following line reads
//      as prose. CLAIM-LEDGER.md documents the claim format by wrapping a ```claims block
//      inside a ````markdown block, and a scanner that ignores the outer fence has already
//      caused this exact mistake once, to the parser.
//
// WHAT IS DECLARED RATHER THAN RESOLVED — see UNRESOLVABLE_CITATIONS below.
//
// Issue #69. The previous approach (any `c-[a-z]+(-[a-z]+)+` token in prose) reported ids
// only when the global ledger was present, making lint always-clean on CI where
// ~/.warroom/ledger/global.yml does not exist. The current approach:
//   - commits the known global claim ids (NOT their content) into UNRESOLVABLE_CITATIONS, so
//     a runner can distinguish "known global claim" from "dead reference"
//   - requires backtick wrapping, eliminating the English-word false positives
//   - fails on any cited id not in the project ledger and not in UNRESOLVABLE_CITATIONS,
//     regardless of whether the global ledger is present
//   - verifies UNRESOLVABLE_CITATIONS entries against the real global ledger when it IS
//     present, so the declared list cannot outlive its subjects

// A claim id, exactly as ID_RE in scripts/lib/claims.js defines it. That file owns the
// grammar and does not export it, so this is a second statement of one fact — the test
// in ledger.test.mjs asserts they match, which is what stops them drifting apart in silence.
const CITED_ID_RE = /^c-[a-z0-9][a-z0-9-]*$/;

/**
 * Every inline-code span in a markdown file that is outside a fenced block or frontmatter,
 * with the line it sits on.
 */
function proseCodeSpans(text) {
  const src = String(text);
  const lines = src.split('\n');
  const out = [];

  // Frontmatter, delimited the same way extractClaimBlocks() delimits it.
  const fm = src.match(/^---\n[\s\S]*?\n---/);
  let i = fm ? fm[0].split('\n').length : 0;

  for (; i < lines.length; i++) {
    // Fence detection: a fence opens on N backticks (or tildes) and closes only on the same
    // character at >= N length with no info string. An unclosed fence makes the rest opaque.
    const open = lines[i].trim().match(/^(`{3,})\s*([^`]*?)\s*$/);
    if (open) {
      const ticks = open[1].length;
      let close = -1;
      for (let j = i + 1; j < lines.length; j++) {
        const m = lines[j].trim().match(/^(`{3,})\s*$/);
        if (m && m[1].length >= ticks) { close = j; break; }
      }
      if (close < 0) break; // unclosed fence — the rest reads as inside the fence
      i = close;
      continue;
    }
    // Each `...` span on the line.
    for (const m of lines[i].matchAll(/`([^`\n]+)`/g)) {
      out.push({ line: i + 1, code: m[1].trim() });
    }
  }
  return out;
}

// ── The ids this repo cites that the project ledger cannot resolve ──────────
//
// Every entry is debt, declared. Two honest reasons, not blurred:
//
//   scope: 'global'  The claim is real and lives in ~/.warroom/ledger/global.yml — machine
//                    state that no CI runner has. On any machine that HAS the global ledger
//                    the declaration is checked against it: an entry whose id the real
//                    global ledger does not have fails lint ("the exemption has outlived its
//                    subject"). On a machine without the global ledger the check is skipped
//                    and reported. So the check is fully enforcing wherever it CAN be, and
//                    honest about the remaining gap (issue #69).
//
//   scope: 'none'    No claim exists anywhere. The prose names an id that was planned, or
//                    illustrates the id FORMAT. Real rot of the mild kind, grandfathered with
//                    a reason so the check can go in blocking today rather than after a
//                    documentation sweep that would not itself be checked.
//
// THIS LIST IS A RATCHET, NOT A RUG. Lint fails when:
//   1. An entry is no longer cited anywhere → delete it; there is nothing under it.
//   2. An entry's id has since become a real project claim → delete it; the citation resolves.
//   3. An entry marked scope:global that the real global ledger does not have → the exemption
//      has outlived its subject (check 3 is skipped, and reported, when no global ledger is
//      present, or when WARROOM_GLOBAL_LEDGER is set to a fixture — a fixture-based answer
//      about a real global claim is an answer about the fixture).
//
// The list can only shrink, and cannot outlive its subjects.
const UNRESOLVABLE_CITATIONS = {
  'c-runtime-nested-spawn': {
    scope: 'global',
    why: 'the nested-spawn capability claim — global scope, lives in ~/.warroom/ledger/global.yml',
  },
  'c-rolling-five-hour-window': {
    scope: 'global',
    why: 'the usage-window assumption the budget ceiling rests on — global scope, currently waived',
  },
  'c-zsh-no-word-split-on-expansion': {
    scope: 'global',
    why: 'a shell behaviour that reaches every project on the machine — global scope',
  },
  'c-kebab-case': {
    scope: 'none',
    why: 'CLAIM-LEDGER.md\'s field table uses it to illustrate the FORMAT of an id, not as a real claim',
  },
  'c-venture-task-complete': {
    scope: 'none',
    why: 'the Z1 debrief gate in IMPLEMENTATION-PLAN.md, which is superseded — the claim was never written',
  },
  'c-no-second-family-runtime': {
    scope: 'none',
    why: 'MODEL-DIVERSITY.md §11, "claims to record when the index is next regenerated" — not yet recorded',
  },
  'c-qa-panel-single-family': {
    scope: 'none',
    why: 'MODEL-DIVERSITY.md §11, "claims to record when the index is next regenerated" — not yet recorded',
  },
  'c-lens-independence-unbacked': {
    scope: 'none',
    why: 'MODEL-DIVERSITY.md §11, "claims to record when the index is next regenerated" — not yet recorded',
  },
};

/**
 * Resolve every claim id cited in the repo's markdown prose.
 *
 * `globalIds` is null when the global scope could not be consulted — different from an empty
 * set — and is reported rather than treated as "no global claim exists."
 * `unknownWhy` says which of the two reasons it was.
 */
function checkCitations(projectIds, globalIds, unknownWhy) {
  const issues = [];
  const notes = [];
  const cited = new Map(); // id → ["file:line", …]

  for (const rel of candidateMarkdown()) {
    let text;
    try { text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'); }
    catch { continue; } // unreadability is already reported by collectProjectClaims
    if (!text.includes('`c-')) continue; // cheap pre-filter; proseCodeSpans decides
    for (const s of proseCodeSpans(text)) {
      if (!CITED_ID_RE.test(s.code)) continue;
      if (!cited.has(s.code)) cited.set(s.code, []);
      cited.get(s.code).push(`${rel}:${s.line}`);
    }
  }

  for (const [id, where] of [...cited].sort()) {
    if (projectIds.has(id)) continue;
    if (Object.prototype.hasOwnProperty.call(UNRESOLVABLE_CITATIONS, id)) continue;
    issues.push(
      `${where[0]}: prose cites claim "${id}", which is not in the ledger`
      + (where.length > 1 ? ` (and at ${where.slice(1).join(', ')})` : '')
      + '. Register it, fix the id, or declare it in UNRESOLVABLE_CITATIONS with a reason.'
    );
  }

  // The ratchet, in both directions. Entries that no longer apply fail lint — so the list
  // cannot outlive its subjects and cannot quietly become a permanent blanket permission.
  let uncheckedGlobals = 0;
  for (const [id, entry] of Object.entries(UNRESOLVABLE_CITATIONS)) {
    if (!cited.has(id)) {
      issues.push(
        `UNRESOLVABLE_CITATIONS declares "${id}", which no prose cites any more — `
        + 'delete the entry rather than leaving an exemption with nothing under it.'
      );
      continue;
    }
    if (projectIds.has(id)) {
      issues.push(
        `UNRESOLVABLE_CITATIONS declares "${id}", but it is a real project claim now — `
        + 'delete the entry; the citation resolves.'
      );
      continue;
    }
    if (entry.scope !== 'global') continue;
    if (globalIds === null) { uncheckedGlobals++; continue; }
    if (!globalIds.has(id)) {
      issues.push(
        `UNRESOLVABLE_CITATIONS says "${id}" is a global claim, `
        + `and the real global ledger does not have it — the exemption has outlived its subject.`
      );
    }
  }
  if (uncheckedGlobals > 0) {
    notes.push(
      `${uncheckedGlobals} UNRESOLVABLE_CITATIONS scope:global entries were not checked against `
      + `the global ledger — ${unknownWhy}. Reported, not assumed correct.`
    );
  }

  const total = [...cited.values()].reduce((n, w) => n + w.length, 0);
  return { issues, notes, total, distinct: cited.size };
}

// ── The index ───────────────────────────────────────────────────────────────

// NO `source_line`. The parser still computes one and it stays useful in memory — issue
// messages point at it — but a line number is a POSITION, and positions move when text
// above them moves. Committing one coupled this check to where claims sit rather than to
// what they say: inserting a single sentence into the prose of `mission-control/README.md`
// shifted four claims from 295 to 296 and failed `build --check` with every claim
// byte-identical. That is a build failure for an edit that changed no claim, and the only
// remedy on offer was "remember to rebuild" — which the rules table in CLAUDE.md classifies
// as a wish rather than a rule, and which duly failed the first time it was relied on.
//
// It HAD three consumers, and the first version of this comment said it had none. That
// claim came from `grep -rn source_line --include=*.mjs --include=*.js --include=*.json
// --include=*.md --include=*.yml` — five extensions, no `.ts`, no `.tsx` — so the search
// never covered `mission-control/`, where BeliefView.tsx interpolated the field into a
// tooltip, projects.ts typed it, and collectors/belief.ts stamped it. A search reporting
// completeness about ground it never covered is the same defect this change exists to fix,
// committed in the verification of the fix. `git grep source_line` with no filter is what
// should have been run, and is what found them. All three are updated in this commit.
//
// 319 mission-control tests passed over the break, because the fixtures in views.test.tsx
// and collectors.test.ts hand-supplied `source_line: 12` and `source_line: 1`. A fixture
// that supplies what the producer omits is testing a world that does not exist, and no
// amount of green says otherwise. Those fixtures now carry what production carries.
//
// What the field cost a HUMAN was jumping from the index to a claim, and `ledger locate`
// replaces that by resolving the position when asked. Resolved-on-demand beats committed:
// a committed line number is right only until the next edit, then points confidently at
// the wrong line.
// `first_waived` is included so that the FIRST time a claim is waived is visible in index
// diffs — a reviewer can see when the clock started. The full `disposition` is intentionally
// absent: a reason edit must not produce an index diff, or the index stops being read.
// See issue #55.
const KEY_ORDER = ['id', 'assert', 'kind', 'scope', 'verified_by', 'evidence',
  'valid_until', 'confidence', 'supports', 'first_waived', 'source_file'];

function canonical(claim) {
  const out = {};
  for (const k of KEY_ORDER) {
    if (claim[k] !== undefined) out[k] = claim[k];
  }
  return out;
}

function renderIndex(claims) {
  const sorted = [...claims].sort((a, b) => {
    if (a.scope !== b.scope) return a.scope < b.scope ? -1 : 1;
    if (a.id !== b.id) return a.id < b.id ? -1 : 1;
    return a.source_file < b.source_file ? -1 : 1;
  });
  const body = {
    version: INDEX_VERSION,
    note: 'GENERATED by scripts/ledger.mjs — never hand-edit. Claims live inside the artifacts they support; this is a compiled view. Contains no timestamp so it reproduces byte-identically from a clean clone.',
    total: sorted.length,
    claims: sorted.map(canonical),
  };
  return JSON.stringify(body, null, 2) + '\n';
}

// ── What actually differs ───────────────────────────────────────────────────
//
// The old failure message had two defects and the second is the worse one.
//
// It said "the committed index does not match the claims in the artifacts", which named
// the wrong cause every time only a position had moved — the claims matched exactly. And
// it offered as evidence `on disk: 19749 bytes · regenerated: 19749 bytes`: the same
// number twice. That is not a near-miss. A one-line shift rewrites 295 as 296, which is
// the same width, so for the whole class of failure this message existed to explain, the
// byte count was guaranteed to be equal. A diagnostic that cannot discriminate is worse
// than no diagnostic, because it occupies the place a reader looks for evidence and
// answers with a number that means nothing.
//
// So: compute the difference and name it — which claim, which field, both values. sha256
// replaces the byte count, because two files with different contents cannot share one.

const MAX_VALUE = 100;

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function show(v) {
  if (v === undefined) return '(absent)';
  const s = JSON.stringify(v);
  return s.length > MAX_VALUE ? `${s.slice(0, MAX_VALUE)}…` : s;
}

// Field paths, so a changed command is reported as `evidence.cmd` rather than as the
// whole `evidence` mapping printed twice for the reader to diff by eye.
function fieldDiffs(a, b, prefix = '') {
  const out = [];
  const keys = [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])].sort();
  for (const k of keys) {
    const va = a ? a[k] : undefined;
    const vb = b ? b[k] : undefined;
    if (JSON.stringify(va) === JSON.stringify(vb)) continue;
    const field = prefix ? `${prefix}.${k}` : k;
    const bothMappings = va && vb && typeof va === 'object' && typeof vb === 'object'
      && !Array.isArray(va) && !Array.isArray(vb);
    if (bothMappings) { out.push(...fieldDiffs(va, vb, field)); continue; }
    out.push({ field, disk: va, rebuilt: vb });
  }
  return out;
}

// Structurally equal but textually different — whitespace, key order, a missing trailing
// newline. Rare, and always a hand-edit. Reported as itself rather than as a claim change,
// with the offset, because "the claims are identical" and "the file is identical" are
// different statements and rendering them the same way is how the old message went wrong.
function firstTextDifference(a, b) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  const window = (s) => JSON.stringify(s.slice(Math.max(0, i - 30), i + 30));
  return [
    `every claim is identical — the difference is in how the file is written, not what it says`,
    `first difference at byte ${i}:`,
    `    index:     ${window(a)}`,
    `    artifacts: ${window(b)}`,
  ];
}

/**
 * Explain how the committed index differs from a freshly rendered one.
 * Returns a list of lines, each naming something specific. Never returns an empty list:
 * the caller only calls it when the two texts differ, so "no difference found" would be a
 * bug in this function and is reported as one rather than printed as silence.
 */
function diffIndex(onDiskText, rebuiltText) {
  let disk;
  try {
    disk = JSON.parse(onDiskText);
  } catch (e) {
    return [`the committed index is not valid JSON (${e.message}) — it has been hand-edited or truncated`];
  }
  const built = JSON.parse(rebuiltText);
  const byId = (v) => new Map((Array.isArray(v) ? v : []).map((c) => [c.id, c]));
  const D = byId(disk.claims);
  const B = byId(built.claims);
  const lines = [];

  for (const id of [...B.keys()].filter((k) => !D.has(k)).sort()) {
    lines.push(`+ ${id} — in the artifacts, missing from the index (${B.get(id).source_file})`);
  }
  for (const id of [...D.keys()].filter((k) => !B.has(k)).sort()) {
    lines.push(`- ${id} — in the index, no longer in any artifact (was ${D.get(id).source_file})`);
  }
  for (const id of [...B.keys()].filter((k) => D.has(k)).sort()) {
    for (const f of fieldDiffs(D.get(id), B.get(id))) {
      lines.push(`~ ${id} — ${f.field} changed`);
      lines.push(`    index:     ${show(f.disk)}`);
      lines.push(`    artifacts: ${show(f.rebuilt)}`);
    }
  }
  const claimLevel = lines.length > 0;

  for (const k of ['version', 'note']) {
    if (JSON.stringify(disk[k]) !== JSON.stringify(built[k])) {
      lines.push(`~ index header — ${k}: ${show(disk[k])} → ${show(built[k])}`);
    }
  }
  // `total` is derived from the claim list. When claims were added or removed the +/-
  // lines above already say so, and repeating it as a second finding reads as two problems.
  if (!claimLevel && disk.total !== built.total) {
    lines.push(`~ index header — total: ${show(disk.total)} → ${show(built.total)}`);
  }

  if (lines.length === 0) return firstTextDifference(onDiskText, rebuiltText);
  return lines;
}

// ── Commands ────────────────────────────────────────────────────────────────

function cmdBuild(argv) {
  const check = argv.includes('--check');
  const { claims, issues, notes } = collectProjectClaims();

  for (const n of notes || []) process.stdout.write(`ledger: note — ${n}\n`);
  if (issues.length > 0) {
    process.stderr.write(`ledger: ${issues.length} claim problem${issues.length === 1 ? '' : 's'} — the index is not written while any claim is malformed:\n`);
    for (const i of issues) process.stderr.write(`  - ${i}\n`);
    return 1;
  }

  const text = renderIndex(claims);
  if (check) {
    if (!fs.existsSync(INDEX_PATH)) {
      process.stderr.write(`ledger: ${path.relative(REPO_ROOT, INDEX_PATH)} is missing — run \`node scripts/ledger.mjs build\`\n`);
      return 1;
    }
    const onDisk = fs.readFileSync(INDEX_PATH, 'utf8');
    if (onDisk !== text) {
      const rel = path.relative(REPO_ROOT, INDEX_PATH);
      process.stderr.write(`ledger: ${rel} disagrees with the artifacts.\n`);
      for (const l of diffIndex(onDisk, text)) process.stderr.write(`  ${l}\n`);
      process.stderr.write(`  sha256 index:     ${sha256(onDisk)}\n`);
      process.stderr.write(`  sha256 artifacts: ${sha256(text)}\n`);
      process.stderr.write('  The index is generated. Run `node scripts/ledger.mjs build` and commit the result.\n');
      return 1;
    }
    process.stdout.write(`ledger: index matches — ${claims.length} claims\n`);
    return 0;
  }

  fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
  fs.writeFileSync(INDEX_PATH, text);
  process.stdout.write(`ledger: wrote ${path.relative(REPO_ROOT, INDEX_PATH)} — ${claims.length} claims\n`);
  const byScope = claims.reduce((m, c) => ({ ...m, [c.scope]: (m[c.scope] || 0) + 1 }), {});
  for (const [s, n] of Object.entries(byScope).sort()) process.stdout.write(`  ${s}: ${n}\n`);
  return 0;
}

// Issue #55. A waiver deadline can be pushed out indefinitely with no CI signal: `disposition`
// is intentionally absent from KEY_ORDER (a reason edit must not produce an index diff), but
// that means `build --check` never sees a changed `until`. The fix: a 90-day cap from
// `first_waived`, which IS in the index — the first time a claim is waived, `first_waived`
// enters the index diff and stays there. Extending `until` without changing `first_waived`
// is visible only when the 90-day cap is exceeded, at which point lint fails, and that is
// the only signal a CI gate can produce for something it cannot see between changes.
const WAIVER_CAP_DAYS = 90;
const MS_PER_DAY = 86400000;

function waiverCapIssues(claims, now) {
  const issues = [];
  for (const c of claims) {
    if (!c.first_waived) continue;
    const start = Date.parse(`${c.first_waived}T00:00:00Z`);
    if (Number.isNaN(start)) continue; // schema already reports a bad date
    const days = Math.ceil((now - start) / MS_PER_DAY);
    if (days > WAIVER_CAP_DAYS) {
      issues.push(
        `${c.source_file}: claim "${c.id}" has been waived for ${days} days from `
        + `first_waived ${c.first_waived} — the ${WAIVER_CAP_DAYS}-day cap is exceeded. `
        + 'Refresh the claim, Deprecate it, or Waive again with a new first_waived date that '
        + 'restarts the clock only after the underlying condition has genuinely changed.'
      );
    }
  }
  return issues;
}

function cmdLint() {
  const proj = collectProjectClaims();
  const glob = collectGlobalClaims();
  // Issue #69: scope:global exemptions are judged against the REAL global ledger, not a
  // fixture. An injected WARROOM_GLOBAL_LEDGER points at a fixture — asking a fixture whether
  // a real global claim still exists gets an answer about the fixture. So globalIsReal is
  // false whenever the variable is set, even if the file exists.
  const globalIsReal = !process.env.WARROOM_GLOBAL_LEDGER && glob.present;
  const cites = checkCitations(
    new Set(proj.claims.map((c) => c.id)),
    globalIsReal ? new Set(glob.claims.map((c) => c.id)) : null,
    glob.present
      ? `WARROOM_GLOBAL_LEDGER points at ${GLOBAL_LABEL}, which is a fixture rather than the real global ledger`
      : `~/.warroom/ledger/global.yml is not present on this machine`,
  );
  const capIssues = waiverCapIssues([...proj.claims, ...glob.claims], Date.now());
  const issues = [...proj.issues, ...glob.issues, ...cites.issues, ...capIssues];
  for (const n of [...(proj.notes || []), ...cites.notes]) process.stdout.write(`ledger lint: note — ${n}\n`);
  process.stdout.write(`ledger lint: ${proj.claims.length} project claims · ${glob.claims.length} global claims`);
  process.stdout.write(glob.present ? `\n` : ` (no ${GLOBAL_LABEL} on this machine)\n`);
  process.stdout.write(`ledger lint: ${cites.total} prose citation(s) of ${cites.distinct} distinct claim id(s)\n`);
  if (issues.length === 0) {
    process.stdout.write('ledger lint: clean\n');
    return 0;
  }
  for (const i of issues) process.stderr.write(`  ✗ ${i}\n`);
  process.stderr.write(`\nledger lint: ${issues.length} problem${issues.length === 1 ? '' : 's'}\n`);
  return 1;
}

async function cmdVerify(argv) {
  const offline = argv.includes('--offline');
  const skipCommands = argv.includes('--no-exec');
  const scopeArg = (argv.find((a) => a.startsWith('--scope=')) || '').split('=')[1] || null;

  const rules = loadRules(TIER_MAP);
  const proj = collectProjectClaims();
  const glob = collectGlobalClaims();
  const all = [...proj.claims, ...glob.claims].filter((c) => !scopeArg || c.scope === scopeArg);
  const schemaIssues = [...proj.issues, ...glob.issues];

  const evPath = eventsPath();
  process.stdout.write(`ledger verify: ${all.length} claims`);
  if (offline) process.stdout.write(' · offline (network resolvers report unresolved, never pass)');
  process.stdout.write(`\n  events → ${evPath}\n`);
  if (!glob.present) process.stdout.write(globalAbsenceNotice());
  process.stdout.write('\n');

  let blocked = 0;
  let wouldBlock = 0;
  let passed = 0;

  for (const claim of all) {
    const cls = claim.scope === 'global'
      ? { enforcement: 'shadow', resolvers: [], tier: 'global' }
      : classifyFile(claim.source_file, rules);
    const names = resolvers.resolversFor(claim, cls.resolvers);

    for (const name of names) {
      let res;
      try {
        res = await resolvers.run(name, claim, { offline, skipCommands, cwd: REPO_ROOT });
      } catch (e) {
        res = { resolver: name, claim_id: claim.id, status: 'unresolved', reason: `resolver error: ${e.message}` };
      }
      const enforcing = cls.enforcement === 'block';
      if (res.status === 'pass') {
        passed++;
        process.stdout.write(`  ✓ ${claim.id} [${name}] ${res.reason}\n`);
        continue;
      }
      const verdict = enforcing ? 'claim.block' : 'claim.would_block';
      if (enforcing) blocked++; else wouldBlock++;
      logEvent({
        ts: Math.floor(Date.now() / 1000),
        event: verdict,
        claim: claim.id,
        resolver: name,
        status: res.status,
        scope: claim.scope,
        artifact: claim.source_file,
        tier: cls.tier,
        enforcement: cls.enforcement,
        reason: res.reason,
        ...(res.detail ? { detail: res.detail } : {}),
      });
      const mark = enforcing ? '✗ BLOCK  ' : '⚠ would_block';
      process.stdout.write(`  ${mark} ${claim.id} [${name}] ${res.status}: ${res.reason}\n`);
    }
  }

  process.stdout.write(`\nledger verify: ${passed} pass · ${wouldBlock} would_block (shadow) · ${blocked} block\n`);
  if (schemaIssues.length > 0) {
    process.stderr.write(`ledger verify: ${schemaIssues.length} schema problem(s) — run \`node scripts/ledger.mjs lint\`\n`);
    return 1;
  }
  if (blocked > 0) {
    process.stderr.write(`ledger verify: ${blocked} claim(s) failed on a path the tier map marks enforcement:block.\n`);
    process.stderr.write('  These are the ADR-001 carve-outs — migration, deploy, harness self-edit — which block from day one.\n');
    return 1;
  }
  return 0;
}

// ── locate — the position, resolved when asked ──────────────────────────────
//
// This is what replaces `source_line` in the index. The old field answered "where is this
// claim?" with a number recorded at build time, which is correct until the next edit above
// it and silently wrong afterwards — and keeping it correct meant rebuilding the index
// after every prose edit, which is what made a documentation change fail the build.
//
// Here the same question is answered by parsing the artifacts now. It cannot be stale,
// and the output is `file:line`, which every editor and terminal will jump to.
//
// WHAT THE LINE MEANS, per scope, because the two differ and a reader must not have to
// discover that:
//   project — the head of the claim BLOCK (the `claims:` line inside the fence). Claims
//             sharing a block share it, which is what the parser records.
//   global  — the claim's own `- id:` line, measured by globalClaimLine().
//
// AND WHEN THERE IS NO LINE, THERE IS NO NUMBER. A claim whose position could not be
// measured prints its file and stops. It used to print `:0` for every global claim, which
// is the placeholder this change exists to abolish, so both output sites below go through
// `where()` rather than interpolating `source_line` and hoping it is set.
function where(c) {
  return c.source_line === undefined ? c.source_file : `${c.source_file}:${c.source_line}`;
}

function cmdLocate(argv) {
  const id = argv.find((a) => !a.startsWith('--'));
  const { claims } = collectProjectClaims();
  const glob = collectGlobalClaims();
  const all = [...claims, ...glob.claims];

  if (!id) {
    for (const c of all.sort((a, b) => (a.id < b.id ? -1 : 1))) {
      process.stdout.write(`${where(c)}  ${c.id}\n`);
    }
    // The footer says what is true of the rows above it. It previously read "Positions are
    // resolved from the artifacts on this run, not recorded" while four rows carried a
    // position that was neither — a summary asserting a property of a set that part of the
    // set does not have. Both counts are printed, so the claim is checkable against the
    // listing rather than taken on trust.
    const located = all.filter((c) => c.source_line !== undefined).length;
    const unlocated = all.length - located;
    process.stdout.write(`\n${all.length} claims · ${located} with a position resolved from the artifacts on this run`);
    process.stdout.write(unlocated === 0
      ? ' (none recorded, none guessed).\n'
      : ` · ${unlocated} whose position could not be measured, printed as the file alone.\n`);
    return 0;
  }

  const claim = all.find((c) => c.id === id);
  if (!claim) {
    process.stderr.write(`ledger locate: no claim "${id}"\n`);
    // A near-miss list, because the usual reason for a miss is a typo or a renamed claim,
    // and "no such claim" alone sends the reader back to grep for what this already knows.
    const near = all.map((c) => c.id).filter((k) => k.includes(id) || id.includes(k));
    if (near.length) process.stderr.write(`  did you mean: ${near.slice(0, 5).join(', ')}\n`);
    return 1;
  }
  // See where(): a project claim's line is the head of its BLOCK and is shared by the
  // claims in it, a global claim's line is its own `- id:` entry, and a claim whose
  // position could not be measured prints its file with no line at all.
  process.stdout.write(`${where(claim)}\n`);
  return 0;
}

function cmdJudge(argv) {
  const id = argv.find((a) => !a.startsWith('--'));
  if (!id) { process.stderr.write('ledger judge: pass a claim id\n'); return 2; }
  const { claims } = collectProjectClaims();
  const glob = collectGlobalClaims();
  const claim = [...claims, ...glob.claims].find((c) => c.id === id);
  if (!claim) { process.stderr.write(`ledger judge: no claim "${id}"\n`); return 1; }
  if (claim.verified_by !== 'judge') {
    process.stderr.write(`ledger judge: "${id}" is verified_by:${claim.verified_by} — nothing to judge\n`);
    return 1;
  }
  const ev = claim.evidence || {};
  const need = ev.risk === 'high' ? 2 : 1;
  process.stdout.write(`Claim ${claim.id}  (${claim.source_file})\n`);
  process.stdout.write(`  assert: ${claim.assert}\n`);
  process.stdout.write(`  risk:   ${ev.risk} → needs ${need} distinct model famil${need === 1 ? 'y' : 'ies'}\n\n`);
  process.stdout.write('Run each lens independently, then paste the result back into the claim block:\n\n');
  for (const lens of ev.lenses || []) {
    process.stdout.write(`  [${lens}] Judge this assertion through the ${lens} lens. Return pass | fail | unresolved with one sentence of reasoning.\n`);
    process.stdout.write(`      "${claim.assert}"\n\n`);
  }
  process.stdout.write('    judged_by:\n');
  for (let i = 0; i < need; i++) {
    process.stdout.write(`      - {model_family: <family>, model_id: <id>, verdict: <pass|fail|unresolved>, at: <YYYY-MM-DD>}\n`);
  }
  process.stdout.write('\nThis command does not call a model. A resolver that invents a verdict is worse\n');
  process.stdout.write('than one that admits it has none, so an unjudged claim stays `unresolved`.\n');
  return 0;
}

// ── ledger events — the reader ──────────────────────────────────────────────
// Stop condition 2 is "the run log exists four weeks with no reader." Phase 3 shipped a
// log and nothing that reads it, which is that condition starting its clock. This is the
// minimum thing that makes the shadow window reviewable: which claims fired, how often,
// through which resolver, and how recently.
//
// It reports what it SKIPPED as well as what it read. events.jsonl is shared with the
// launcher, so a reader that silently ignores non-claim lines would make the log look
// smaller than it is.

function parseSince(spec, now) {
  if (!spec) return null;
  const rel = String(spec).match(/^(\d+)([dhw])$/);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = { h: 3600, d: 86400, w: 604800 }[rel[2]];
    return Math.floor(now / 1000) - n * unit;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(spec)) {
    const [y, m, d] = spec.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 1000);
  }
  throw new Error(`--since "${spec}" must be like 30d, 12h, 2w or 2026-08-01`);
}

function cmdEvents(argv) {
  const sinceSpec = (argv.find((a) => a.startsWith('--since')) || '').split('=')[1]
    || (argv.includes('--since') ? argv[argv.indexOf('--since') + 1] : null);
  const now = Date.now();
  const since = parseSince(sinceSpec, now);
  const p = eventsPath();

  process.stdout.write(`ledger events: ${p}\n`);
  if (!fs.existsSync(p)) {
    // Not an error, and not silence either: "no log" and "no events" are different
    // states and the reader must not render them the same way.
    process.stdout.write('  the log does not exist yet — nothing has run, or WARROOM_EVENTS points elsewhere\n');
    return 0;
  }

  const lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
  let malformed = 0;
  let nonClaim = 0;
  let outsideWindow = 0;
  const rows = [];
  for (const l of lines) {
    let e;
    try { e = JSON.parse(l); } catch { malformed++; continue; }
    if (!e.event || !String(e.event).startsWith('claim.')) { nonClaim++; continue; }
    if (since !== null && Number(e.ts) < since) { outsideWindow++; continue; }
    rows.push(e);
  }

  const windowLabel = since === null
    ? 'all time'
    : `since ${new Date(since * 1000).toISOString().slice(0, 10)}`;
  process.stdout.write(`  window: ${windowLabel} · ${rows.length} claim events`);
  if (outsideWindow) process.stdout.write(` · ${outsideWindow} older`);
  if (nonClaim) process.stdout.write(` · ${nonClaim} non-claim (launcher)`);
  if (malformed) process.stdout.write(` · ${malformed} unparseable`);
  process.stdout.write('\n\n');

  if (rows.length === 0) {
    process.stdout.write('  no claim events in this window.\n');
    process.stdout.write('  For the resolvers, that is the promotion signal. For the canary, it is an alarm:\n');
    process.stdout.write('  docs/06-codebase/ledger-canary.md is supposed to fire on every single run.\n');
    return 0;
  }

  const byClaim = new Map();
  const byResolver = new Map();
  for (const e of rows) {
    const k = `${e.claim}\u0000${e.resolver}`;
    const c = byClaim.get(k) || { claim: e.claim, resolver: e.resolver, n: 0, blocked: 0, last: 0, reason: '' };
    c.n++;
    if (e.event === 'claim.block') c.blocked++;
    if (Number(e.ts) >= c.last) { c.last = Number(e.ts); c.reason = e.reason || ''; }
    byClaim.set(k, c);

    const r = byResolver.get(e.resolver) || { would: 0, block: 0, claims: new Set() };
    if (e.event === 'claim.block') r.block++; else r.would++;
    r.claims.add(e.claim);
    byResolver.set(e.resolver, r);
  }

  process.stdout.write('BY CLAIM\n');
  const sorted = [...byClaim.values()].sort((a, b) => b.n - a.n || (a.claim < b.claim ? -1 : 1));
  for (const c of sorted) {
    const when = new Date(c.last * 1000).toISOString().slice(0, 10);
    process.stdout.write(`  ${String(c.n).padStart(4)}×  ${c.claim} [${c.resolver}]${c.blocked ? `  (${c.blocked} BLOCKING)` : ''}\n`);
    process.stdout.write(`        last ${when} — ${c.reason.slice(0, 110)}\n`);
  }

  process.stdout.write('\nBY RESOLVER\n');
  for (const [name, r] of [...byResolver.entries()].sort()) {
    process.stdout.write(`  ${name.padEnd(18)} ${String(r.would).padStart(4)} would_block · ${String(r.block).padStart(3)} block · ${r.claims.size} distinct claim(s)\n`);
  }

  process.stdout.write('\nWHAT TO DO WITH THIS\n');
  process.stdout.write('  A resolver whose only would_blocks come from the canary has fired correctly and cost\n');
  process.stdout.write('  nothing all window — that is the evidence that promotes it to blocking.\n');
  process.stdout.write('  A resolver with zero events, canary included, is not quiet: it is not running.\n');
  return 0;
}

function cmdViews() {
  const { claims } = collectProjectClaims();
  const glob = collectGlobalClaims();
  const all = [...claims, ...glob.claims];
  const now = Date.now();

  process.stdout.write('# Ledger views (generated — do not edit)\n\n');
  for (const scope of ['global', 'project', 'task']) {
    const rows = all.filter((c) => c.scope === scope);
    process.stdout.write(`## ${scope} — ${rows.length}\n\n`);
    for (const c of rows.sort((a, b) => (a.id < b.id ? -1 : 1))) {
      const f = resolvers.freshness(c, { now });
      const flag = f.status === 'pass' ? ' ' : '!';
      process.stdout.write(`${flag} ${c.id}  (${c.kind}, ${c.verified_by}, conf ${c.confidence})\n`);
      process.stdout.write(`    ${c.assert}\n`);
      process.stdout.write(`    ${f.reason}  ·  ${c.source_file}\n`);
      if (c.supports && c.supports.length) process.stdout.write(`    supports: ${c.supports.join(', ')}\n`);
      process.stdout.write('\n');
    }
  }
  process.stdout.write('Blast radius: a claim that fails or expires makes everything in its `supports:`\n');
  process.stdout.write('list questionable. That is what the field is for.\n');
  return 0;
}

// ── sweep ───────────────────────────────────────────────────────────────────
//
// The periodic read. Phase 6 replaced `.claude/agents/reader.md` with this
// subcommand: every field of that agent's return contract was a deterministic
// query, and its own anti-patterns forbade the single judgement in scope —
// "DO NOT record a disposition; that is a decision, and decisions have owners".
// An engine that never judges anything is a script that has not been written yet.
//
// Findings come from CURRENT resolver state, never from the event log. `events`
// reports the last event per claim, and that includes failures fixed weeks ago:
// c-one-risk-classifier still shows "exit 1, expected 0" there while the claim
// passes today. A sweep built on the log reports resolved problems as live ones,
// and a report full of false alarms is how a reader becomes the next mechanism
// nobody consumes.
//
// The log is used for the one question it is authoritative about: which resolvers
// produced no events at all. Even that is qualified — only failures are logged, so
// "no events" means "all passing" OR "not running", and only a resolver the canary
// exercises can tell those apart. The rest are reported as unverifiable rather than
// as healthy. Rule 10 applied to the sweep itself: never report what you could not check.

const CANARY_ID = 'c-canary-unresolvable';
const EXPIRING_SOON_DAYS = 14;
const DAY = 86400000;

function stampPath() {
  return path.join(path.dirname(eventsPath()), 'reader-stamp.json');
}

function dayMs(spec) {
  const t = Date.parse(`${spec}T00:00:00Z`);
  return Number.isNaN(t) ? NaN : t;
}

function cmdSweep(argv) {
  const asJson = argv.includes('--json');
  const sinceSpec = (argv.find((a) => a.startsWith('--since=')) || '').split('=')[1]
    || (argv.includes('--since') ? argv[argv.indexOf('--since') + 1] : null)
    || '7d';
  const now = Date.now();
  const since = parseSince(sinceSpec, now);

  const proj = collectProjectClaims();
  const glob = collectGlobalClaims();
  const all = [...proj.claims, ...glob.claims];

  const expired = [];
  const expiringSoon = [];
  const lapsedWaivers = [];

  for (const c of all) {
    const d = c.disposition;
    if (d && d.action === 'waive') {
      // resolvers.waiverState is the ONE implementation of this date rule; the sweep
      // asks it rather than recomputing, for the same reason there is one classifier.
      const w = resolvers.waiverState(c, now);
      if (w.lapsed) {
        // A lapsed waiver IS the finding. Do not also count it as expired — one
        // problem reported twice reads as two problems and dilutes both.
        lapsedWaivers.push({
          id: c.id,
          until: d.until,
          days_over: w.days,
          reason: d.reason || '',
          source_file: c.source_file,
        });
        continue;
      }
    }
    // The canary is BUILT to fail; its expiry is not a finding, its absence is.
    if (c.id === CANARY_ID) continue;

    const f = resolvers.freshness(c, { now });
    if (f.status !== 'pass') {
      expired.push({ id: c.id, valid_until: c.valid_until || null, reason: f.reason, source_file: c.source_file });
      continue;
    }
    if (c.valid_until) {
      const vu = dayMs(c.valid_until);
      if (!Number.isNaN(vu)) {
        const daysLeft = Math.ceil((vu + DAY - now) / DAY);
        if (daysLeft <= EXPIRING_SOON_DAYS) {
          expiringSoon.push({ id: c.id, valid_until: c.valid_until, days_left: daysLeft, source_file: c.source_file });
        }
      }
    }
  }

  // ── the log: resolver liveness only ──
  const evPath = eventsPath();
  const logPresent = fs.existsSync(evPath);
  const seen = new Map();
  let canaryEvents = 0;
  let malformed = 0;
  if (logPresent) {
    for (const l of fs.readFileSync(evPath, 'utf8').split('\n').filter(Boolean)) {
      let e;
      try { e = JSON.parse(l); } catch { malformed++; continue; }
      if (!e.event || !String(e.event).startsWith('claim.')) continue;
      if (since !== null && Number(e.ts) < since) continue;
      seen.set(e.resolver, (seen.get(e.resolver) || 0) + 1);
      if (e.claim === CANARY_ID) canaryEvents++;
    }
  }

  const canaryClaim = all.find((c) => c.id === CANARY_ID);
  const canaryCovers = canaryClaim ? resolvers.resolversFor(canaryClaim, resolvers.RESOLVER_NAMES) : [];
  const silent = [];
  const silenceUnverifiable = [];
  for (const name of resolvers.RESOLVER_NAMES) {
    if (seen.has(name)) continue;
    // NO LOG is not the same as AN EMPTY LOG. Without the file there is nothing to be
    // silent in, so every resolver is unknown rather than dead. Found by running the CI
    // path before shipping it: a fresh runner has no log, so this branch would have filed
    // two findings and failed the scheduled job every single day. A job that is always red
    // is a job nobody reads — the same alarm fatigue that makes an unread report worthless.
    // The invariant is symmetric: never pass what you could not check, and never fail it.
    if (logPresent && canaryCovers.includes(name)) silent.push(name);
    else silenceUnverifiable.push(name);
  }

  const canaryDead = logPresent && canaryEvents === 0;
  // TWO absences, one status. The run log was already accounted for here; the global ledger
  // was not, and on a runner it is always missing — so the sweep reported COMPLETE over 31 of
  // 35 claims. Issue #57. Neither absence is a FINDING: nothing can be wrong in a file that
  // is not there, and a job that is red every day is a job nobody reads. Both are declared.
  const status = logPresent && glob.present ? 'COMPLETE' : 'PARTIAL';
  const findings = expired.length + lapsedWaivers.length + silent.length + (canaryDead ? 1 : 0);

  const report = {
    status,
    window: sinceSpec,
    swept_at: new Date(now).toISOString(),
    claims_checked: all.length,
    project_claims: proj.claims.length,
    global_claims: glob.claims.length,
    global_present: glob.present,
    expired: expired.map((e) => e.id),
    expiring_soon: expiringSoon.map((e) => e.id),
    lapsed_waivers: lapsedWaivers.map((e) => e.id),
    silent_resolvers: silent,
    silence_unverifiable: silenceUnverifiable,
    canary_events: canaryEvents,
    canary_alive: !canaryDead,
    log_present: logPresent,
    findings,
  };

  // The stamp is what SessionStart reads to know the sweep is still running.
  // Written on every path, including findings — a stamp records recency, not health.
  try {
    fs.mkdirSync(path.dirname(stampPath()), { recursive: true });
    fs.writeFileSync(stampPath(), `${JSON.stringify(report, null, 2)}\n`);
  } catch (e) {
    process.stderr.write(`ledger sweep: could not write stamp ${stampPath()}: ${e.message}\n`);
  }

  if (asJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return findings > 0 ? 1 : 0;
  }

  const w = (s) => process.stdout.write(s);
  // The count is SPLIT. A bare "31 claims" was the whole of issue #57: it is the number the
  // sweep checked, printed in the place a reader looks for the number of claims there are.
  const split = glob.present
    ? `${proj.claims.length} project · ${glob.claims.length} global`
    : `${proj.claims.length} project · global ledger ABSENT`;
  w(`ledger sweep: ${all.length} claims (${split}) · window ${sinceSpec} · log ${logPresent ? evPath : 'ABSENT'}\n\n`);

  if (!glob.present) {
    w(globalAbsenceNotice());
    w('  Rule 9 therefore holds here for project claims only: a lapsed waiver on a global claim\n');
    w('  is caught by nothing on this machine. c-runtime-nested-spawn is exactly that shape.\n\n');
  }
  if (!logPresent) {
    w('PARTIAL — the run log does not exist, so resolver liveness could not be checked.\n');
    w('  "no log" and "no events" are different states and this sweep will not render them the same.\n\n');
  }
  if (canaryDead) {
    w('!! CANARY SILENT — zero events from the canary claim in this window.\n');
    w('   The canary is designed to fail on every single run. Zero events does not mean\n');
    w('   everything passed; it means the resolvers are not running. Nothing else in this\n');
    w('   report can be trusted until that is explained.\n\n');
  }
  if (lapsedWaivers.length) {
    w(`LAPSED WAIVERS (${lapsedWaivers.length}) — someone promised to come back and did not\n`);
    for (const l of lapsedWaivers) w(`  ${l.id}  ${l.days_over}d over (until ${l.until}) — ${l.reason}\n     ${l.source_file}\n`);
    w('\n');
  }
  if (expired.length) {
    w(`EXPIRED (${expired.length}) — each needs one disposition: Refresh, Deprecate, or Waive with a date\n`);
    for (const e of expired) w(`  ${e.id}  ${e.reason}\n     ${e.source_file}\n`);
    w('\n');
  }
  if (expiringSoon.length) {
    w(`EXPIRING WITHIN ${EXPIRING_SOON_DAYS}d (${expiringSoon.length}) — flagged early so it is a decision, not a scramble\n`);
    for (const e of expiringSoon) w(`  ${e.id}  ${e.days_left}d left (${e.valid_until})\n`);
    w('\n');
  }
  if (silent.length) {
    w(`SILENT RESOLVERS (${silent.length}) — the canary exercises these and they produced nothing\n`);
    for (const s of silent) w(`  ${s}\n`);
    w('\n');
  }
  if (silenceUnverifiable.length) {
    w(`NO EVENTS, UNVERIFIABLE (${silenceUnverifiable.length}) — ${silenceUnverifiable.join(', ')}\n`);
    // Two different reasons produce this list, and reporting the wrong one is its own small
    // fabrication: with no log there is nothing to be silent in, which is not the same as
    // having a log that no canary exercises.
    w(logPresent
      ? '  Only failures are logged, and no canary exercises these resolvers, so "all passing"\n  and "not running" are indistinguishable here. Reported as unknown, not as healthy.\n\n'
      : '  There is no log on this machine, so liveness is unknowable here rather than bad.\n  Reported as unknown, not as healthy — and not counted as a finding.\n\n');
  }
  if (malformed) w(`  (${malformed} unparseable log line(s) skipped)\n\n`);

  // Never render a partial run as a clean one, and name EVERY gap rather than the first one.
  // The closing line previously attributed the whole of PARTIAL to the missing log, so a
  // reader who had one concluded the sweep was complete while four claims sat outside it.
  const gaps = [];
  if (!logPresent) gaps.push('resolver liveness (no run log)');
  if (!glob.present) gaps.push(`global claims (no ${GLOBAL_LABEL})`);

  if (findings > 0) {
    w(`${findings} finding(s) need a decision. This sweep reports; it does not fix.\n`);
  } else if (gaps.length === 0) {
    w(`CLEAN — ${all.length} claims checked over ${sinceSpec}; canary fired ${canaryEvents}×.\n`);
  } else {
    w(`PARTIAL — ${all.length} claims checked over ${sinceSpec}, none failing. NOT checked: ${gaps.join(' · ')}.\n`);
  }
  return findings > 0 ? 1 : 0;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const [cmd, ...argv] = process.argv.slice(2);
  switch (cmd) {
    case 'build':
    case 'rebuild':
      return cmdBuild(argv);
    case 'lint':
      return cmdLint();
    case 'verify':
      return cmdVerify(argv);
    case 'judge':
      return cmdJudge(argv);
    case 'locate':
      return cmdLocate(argv);
    case 'events':
      return cmdEvents(argv);
    case 'views':
      return cmdViews();
    case 'sweep':
      return cmdSweep(argv);
    default:
      process.stderr.write('usage: ledger.mjs <build [--check] | rebuild | lint | verify [--offline] [--no-exec] [--scope=X] | judge <id> | locate [id] | events [--since 30d] | views | sweep [--since 7d] [--json]>\n');
      return 2;
  }
}

main().then((code) => process.exit(code)).catch((err) => {
  process.stderr.write(`ledger: ${err.stack || err.message}\n`);
  process.exit(2);
});
