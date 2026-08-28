#!/usr/bin/env node
// POSTURE: BLOCKS. `check` exits non-zero unless a committed verdict is bound to the exact diff
// being merged. `bin/warroom`'s cmd_merge refuses on that non-zero. Exit 2 means the subject
// could not be determined, which is also a refusal — this script has no exit path that lets an
// unreviewed diff through.
//
// scripts/verdict.mjs — bind a QA verdict to a diff, so the record cannot go stale.
//
// WHY THIS EXISTS
// `warroom merge` merged into LOCAL main and never pushed. CI never ran, branch protection was
// never consulted, and the only "review" in the path was a `qa_verdict: PASS` string the change's
// own author wrote in their own session file. The remote could not reach this route at all.
//
// A gate needs something to check that the author cannot trivially restate. The thing that works
// is a verdict keyed to the CONTENT of the change:
//
//   subject = sha256( git diff <merge-base origin/main REF>..REF -- . ':(exclude,glob).qa/verdicts/*.json' )
//
// THE ANCHOR, AND WHY THIS ONE
// PR #77 keyed a verdict to a HEAD SHA. That anchor stops existing the instant the verdict is
// committed — recording the record moves HEAD, so the verdict is stale on arrival. The primitive
// was right; the anchor was wrong.
//
// A content subject that EXCLUDES the verdict RECORDS is stable across recording the verdict itself
// and changes the moment any reviewed byte changes. That is the property the whole design rests
// on, and `scripts/merge-gate.test.mjs` executes it rather than asserting it.
//
// WHAT THIS DOES NOT CLAIM
// This is not a cryptographic signature. Anyone who can write the repo can write a verdict file.
// What the subject buys is that a verdict cannot be MOVED to a different diff and cannot SURVIVE
// an edit to the diff it approved — and, because `check` reads the verdict out of the committed
// tree, every verdict has a git author and a revert. Real unforgeability needs a signing key and
// a decision about who holds it. That decision has not been made, so it is not claimed here.
//
// USAGE
//   node scripts/verdict.mjs subject [--repo P] [--ref R] [--json]   # print the subject
//   node scripts/verdict.mjs record  [--repo P] [--ref R] [--json] --verdict PASS --by who
//                                    [--evidence t] [--run-id id] [--dry-run]
//   node scripts/verdict.mjs check   [--repo P] [--ref R] [--json]
//
// `record` writes the file; you then COMMIT it. `check` reads it back out of the ref's tree, so an
// uncommitted verdict does not count. `--dry-run` builds the same record and does not write it.
//
// AN UNKNOWN FLAG IS REFUSED, exit 2, nothing written. It used to be DROPPED: `arg()` searches argv
// for the names it is asked for and never looks at the rest, so a misspelling or a flag borrowed
// from another tool changed nothing and said nothing. Measured on `main` at 47dbbd6,
// `record --verdict PASS --by probe --dry-run` exited 0 and wrote a real record for the empty-diff
// subject — the operator typed a flag whose whole purpose was to prevent that. See FLAGS below.
//
// THESE THREE LINES ARE NO LONGER THE ONLY DESCRIPTION OF THE FLAG SURFACE, and that is why the
// list above is now complete: `--run-id` and `--evidence` were readable and undocumented here, so
// this block said five flags where the code read seven. usage() is generated from FLAGS.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_ROOT = path.resolve(HERE, '..');
const { loadRules, classifyFiles } = require('./lib/classifier.js');

// The tier map is harness POLICY, not repo content, so it is read from where this script lives
// even when --repo points elsewhere. Two copies of the tier map is the defect classify.mjs's own
// header warns about.
const TIER_MAP = path.join(HARNESS_ROOT, '.claude', 'qa-tier-floor.yml');

export const VERDICT_DIR = path.join('.qa', 'verdicts');

// Excluding the verdict RECORDS is what makes the subject survive recording the verdict.
// Changing this pathspec breaks the stability property; merge-gate.test.mjs will say so.
//
// It excluded the whole directory — `:(exclude).qa/verdicts/**` — and that was wider than the
// property needs. Anything under the prefix became invisible to BOTH the subject hash and
// changedFiles(), so it could neither be seen by a verdict nor raise the tier: an executable
// dropped at .qa/verdicts/payload.sh rode onto main with the subject byte-identical. Records are
// only ever written as direct children, `${VERDICT_DIR}/<subject>.json` (see verdictPath below),
// so excluding exactly those filenames preserves stability and hides nothing else.
//
// `glob` is load-bearing, not decoration. Git's default pathspec wildcards match `/` as well, so a
// bare `*.json` would still hide .qa/verdicts/nested/deep.json — the same hole one directory down.
// Measured with `git ls-files` across all three candidates before choosing this one.
const DIFF_PATHSPEC = ['--', '.', `:(exclude,glob)${VERDICT_DIR}/*.json`];

class Refusal extends Error {
  constructor(message, code = 2) {
    super(message);
    this.code = code;
  }
}

function git(repo, args) {
  try {
    return execFileSync('git', args, {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    const detail = (e.stderr || e.message || '').toString().trim().split('\n')[0];
    throw new Refusal(`git ${args.slice(0, 2).join(' ')} failed: ${detail}`);
  }
}

/**
 * The fork point this change is measured against. Refuses when `origin/main` does not resolve:
 * without a base there is no diff, and without a diff there is nothing a verdict could be about.
 * Guessing a base here would be the fail-open this file exists to remove.
 */
export function mergeBase(repo, ref, base = 'origin/main') {
  try {
    git(repo, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`]);
  } catch {
    throw new Refusal(
      `cannot resolve "${base}" in ${repo}. Fetch it first (git fetch origin main). ` +
        'Refusing rather than inventing a base to diff against.'
    );
  }
  const out = git(repo, ['merge-base', base, ref]).trim();
  if (!/^[0-9a-f]{40}$/.test(out)) throw new Refusal(`merge-base ${base} ${ref} returned no commit`);
  return out;
}

/** The content subject. See the header for why this anchor and not a commit SHA. */
export function computeSubject(repo, ref = 'HEAD') {
  const base = mergeBase(repo, ref);
  const diff = git(repo, ['diff', `${base}..${ref}`, ...DIFF_PATHSPEC]);
  return {
    subject: crypto.createHash('sha256').update(diff).digest('hex'),
    base,
    bytes: Buffer.byteLength(diff),
  };
}

export function changedFiles(repo, ref = 'HEAD') {
  const base = mergeBase(repo, ref);
  return git(repo, ['diff', '--name-only', `${base}..${ref}`, ...DIFF_PATHSPEC])
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The real risk tier, from the one classifier. Never a merge strategy wearing a tier's name. */
export function tierFor(repo, ref = 'HEAD') {
  const files = changedFiles(repo, ref);
  if (!files.length) return { tier: 'trivial', files: [], driver: null };
  const result = classifyFiles(files, loadRules(TIER_MAP));
  return { tier: result.floor.tier, files, driver: result.floor.file ?? null };
}

export function verdictPath(subject) {
  return path.join(VERDICT_DIR, `${subject}.json`);
}

/** Read the verdict out of the REF'S TREE. An uncommitted verdict is not a verdict. */
function readCommitted(repo, ref, subject) {
  try {
    return git(repo, ['show', `${ref}:${verdictPath(subject)}`]);
  } catch {
    return null;
  }
}

/**
 * Every refusal reason is distinct, because "the merge was refused" without a reason trains people
 * to route around the gate rather than satisfy it.
 */
export function check(repo, ref = 'HEAD') {
  const { subject, base } = computeSubject(repo, ref);
  const { tier, driver } = tierFor(repo, ref);
  const rel = verdictPath(subject);
  const raw = readCommitted(repo, ref, subject);

  if (raw === null) {
    return { ok: false, reason: 'absent', subject, base, tier, driver, path: rel };
  }

  let record;
  try {
    record = JSON.parse(raw);
  } catch (e) {
    return { ok: false, reason: 'unparseable', subject, base, tier, driver, path: rel, detail: e.message };
  }

  // Defence in depth: the filename already encodes the subject, so a mismatch here means the file
  // was renamed onto a diff it never reviewed.
  if (record.subject !== subject) {
    return {
      ok: false,
      reason: 'subject-mismatch',
      subject,
      base,
      tier,
      driver,
      path: rel,
      detail: `record claims subject ${String(record.subject).slice(0, 16)}…`,
    };
  }

  if (record.verdict !== 'PASS') {
    return { ok: false, reason: 'not-pass', subject, base, tier, driver, path: rel, detail: `verdict=${record.verdict}` };
  }

  // The diff cannot have changed (the subject would differ), so a tier mismatch means the tier MAP
  // moved under a recorded verdict. Policy drift is the one staleness axis the content subject does
  // not cover, so it is checked separately.
  if (record.tier !== tier) {
    return {
      ok: false,
      reason: 'tier-drift',
      subject,
      base,
      tier,
      driver,
      path: rel,
      detail: `recorded at "${record.tier}", the tier map now floors this diff at "${tier}"`,
    };
  }

  return { ok: true, reason: 'match', subject, base, tier, driver, path: rel, record };
}

export function record(repo, ref, { verdict, by, evidence = null, runId = null, dryRun = false }) {
  if (verdict !== 'PASS' && verdict !== 'FAIL') {
    throw new Refusal(`--verdict must be PASS or FAIL, got "${verdict}"`);
  }
  if (!by) throw new Refusal('--by is required: a verdict with no author cannot be audited');

  const { subject, base } = computeSubject(repo, ref);
  const { tier, driver } = tierFor(repo, ref);
  const rel = verdictPath(subject);
  const abs = path.join(repo, rel);

  const body = {
    subject,
    base,
    tier,
    tier_driver: driver,
    verdict,
    by,
    run_id: runId,
    evidence,
    recorded_at: new Date().toISOString(),
  };
  // THE ONLY DIFFERENCE A DRY RUN MAKES IS THESE TWO LINES, AND THAT IS THE POINT. `body` is built
  // by the code above either way — the subject, the tier and the tier driver are all computed from
  // the real tree — so a preview cannot describe a record different from the one a real run writes.
  // A --dry-run that builds its own body is worse than none: it reports a plan the tool would not
  // execute, and nothing would notice. `dry_run_preview_matches_record` in
  // scripts/merge-gate.test.mjs asserts the two are byte-identical apart from the timestamp.
  if (!dryRun) {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `${JSON.stringify(body, null, 2)}\n`);
  }
  return { path: rel, dry_run: dryRun, ...body };
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────

/**
 * Does this token supply a VALUE to the flag before it?
 *
 * ONE DEFINITION, TWO CALLERS — `arg()` below and `unknownFlag()` — and they must not be written
 * twice. `arg()` treats a `--`-prefixed token as "no value given" and falls back; if the validator
 * disagreed and swallowed such a token as a value, `--evidence --dry-run` would set evidence to
 * null AND hide the unknown flag, which is the silent accept this change exists to end wearing a
 * second face.
 */
const isValue = (tok) => tok !== undefined && !tok.startsWith('--');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  const v = i !== -1 ? process.argv[i + 1] : undefined;
  return isValue(v) ? v : fallback;
}

/**
 * Every flag this program reads, by command — the ONE list, used to validate and to print usage.
 *
 * WHY THIS EXISTS. `arg()` searches argv for a name and ignores everything it was not asked for, so
 * an unrecognised flag did not fail, did not warn, and did not change the outcome — it was DROPPED.
 * Measured on `main` at 47dbbd6: `verdict.mjs record --verdict PASS --by probe --dry-run` exited 0
 * and WROTE `.qa/verdicts/e3b0c442….json`, the empty-diff subject, into a governed directory. The
 * operator's reason for typing `--dry-run` was that it should not write. Failing to have that guard
 * rail looked exactly like having it.
 *
 * `true` means the flag takes a value, `false` means it is a bare switch. That distinction is what
 * lets the walker skip `--by ceo` without reading `ceo` as a stray token, and it is why the table
 * cannot be a plain array of names.
 *
 * KEPT NEXT TO THE USAGE STRING ON PURPOSE. The old usage line named five flags and the code read
 * seven — `--run-id` and `--evidence` were readable and undocumented — so a reader who trusted it
 * would have thought `--run-id` was unknown. usage() is generated from this table now, so the two
 * cannot disagree again.
 */
const GLOBAL_FLAGS = { '--repo': true, '--ref': true, '--json': false };
const FLAGS = {
  subject: { ...GLOBAL_FLAGS },
  check: { ...GLOBAL_FLAGS },
  record: {
    ...GLOBAL_FLAGS,
    '--verdict': true,
    '--by': true,
    '--evidence': true,
    '--run-id': true,
    '--dry-run': false,
  },
};

/**
 * The first flag `cmd` does not accept, or null.
 *
 * FLAGS ONLY, AND THE BOUNDARY IS DELIBERATE. A stray POSITIONAL — `record PASS` — is still
 * ignored, and that is a second silent-accept this change does not close. It is left open rather
 * than closed quietly because the two are not one class: every live call site passes flags and
 * values only (swept, and pinned in scripts/merge-gate.test.mjs), so refusing flags breaks nothing,
 * while refusing positionals would require modelling which tokens are values — the same modelling
 * this repo has twice concluded is the wrong shape of fix. Named here so the next reader finds it
 * written down rather than by making the mistake.
 */
function unknownFlag(cmd, argv) {
  const allowed = FLAGS[cmd];
  if (!allowed) return null; // an unknown COMMAND is already refused, with usage, below
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i];
    if (!tok.startsWith('--')) continue;
    if (!Object.prototype.hasOwnProperty.call(allowed, tok)) return tok;
    if (allowed[tok] && isValue(argv[i + 1])) i += 1; // skip the value, so it is never read as a flag
  }
  return null;
}

const usage = () =>
  `usage: verdict.mjs <subject|record|check> [flags]\n${
    Object.entries(FLAGS)
      .map(([cmd, flags]) => `  ${cmd.padEnd(8)}${Object.keys(flags).join(' ')}\n`)
      .join('')}`;

function explain(r) {
  const lines = [];
  lines.push('');
  lines.push('  REFUSED — no QA verdict is bound to this diff.');
  lines.push('');
  lines.push(`    subject : ${r.subject}`);
  lines.push(`    base    : ${r.base}`);
  lines.push(`    tier    : ${r.tier}${r.driver ? `  (set by ${r.driver})` : ''}`);
  lines.push(`    looked for: ${r.path}  (committed on the branch)`);
  lines.push('');
  const why = {
    absent: 'No verdict record exists for this subject.',
    unparseable: `The verdict file is not valid JSON. ${r.detail ?? ''}`,
    'subject-mismatch': `The verdict file names a different subject. ${r.detail ?? ''}`,
    'not-pass': `The recorded verdict is not PASS. ${r.detail ?? ''}`,
    'tier-drift': `The tier map changed under this verdict. ${r.detail ?? ''}`,
  };
  lines.push(`    why: ${why[r.reason] ?? r.reason}`);
  lines.push('');
  lines.push('  What produces a matching verdict:');
  lines.push('');
  lines.push(`    1. Run the binding gate for tier "${r.tier}":`);
  lines.push(`         node scripts/run-gate.mjs --json        # emits the qa.js invocation`);
  lines.push(`       qa.js is a Workflow script; a plain node process cannot run it.`);
  lines.push('    2. Record its verdict against THIS diff, then commit the record:');
  lines.push(`         node scripts/verdict.mjs record --verdict PASS --by <reviewer> \\`);
  lines.push(`           --evidence "<what the panel returned>"`);
  lines.push(`         git add ${VERDICT_DIR} && git commit -m "qa(verdict): PASS for ${r.subject.slice(0, 12)}"`);
  lines.push('');
  lines.push('  The subject is computed over the diff EXCLUDING the verdict directory, so');
  lines.push('  committing the record does not change the subject it approves.');
  lines.push('');
  return lines.join('\n');
}

function main() {
  const cmd = process.argv[2];

  // BEFORE ANYTHING ELSE, AND BEFORE ANYTHING CAN WRITE. Validation sits above `computeSubject`,
  // above `tierFor` and above `record`, so a refused invocation cannot have touched the verdict
  // directory — the test asserts the directory listing is unchanged, not merely that the exit code
  // moved, because "it failed" and "it failed without writing" are different claims.
  const bad = unknownFlag(cmd, process.argv.slice(3));
  if (bad) {
    process.stderr.write(
      `verdict: unknown flag "${bad}" for "${cmd}" — refusing rather than ignoring it.\n` +
        `  Nothing was written. A flag this program does not read is dropped in silence otherwise, ` +
        `and a flag you typed to PREVENT an action is the one you are most likely to type.\n` +
        `  ${cmd} accepts: ${Object.keys(FLAGS[cmd]).join(' ')}\n` +
        (cmd === 'record' ? '  To see the record WITHOUT writing it: add --dry-run.\n' : '')
    );
    return 2;
  }

  const repo = path.resolve(arg('--repo', process.cwd()));
  const ref = arg('--ref', 'HEAD');

  // `--ref` NAMES ONE REVISION. This program derives its own range — merge-base(origin/main, ref)
  // — and a range handed in here reaches git as `merge-base origin/main "origin/main...<sha>"`,
  // which answers `fatal: Not a valid object name`. That already exits 2, so it already fails safe;
  // what it does not do is say which of the two shapes was wrong, and the caller pays a round trip
  // to find out. `scripts/run-gate.mjs --json` is where such a string comes from: its `ref` is a
  // RANGE for a human to read, and its `tip` is the single revision meant for this flag.
  //
  // THIS REFUSES; IT DOES NOT CONVERT. Accepting `A...B` here would be a second implementation of
  // the range, and the property being protected is that a subject is reproducible from one ref —
  // which is what lets a recorded verdict survive a move of the base under it. PR 77 was closed
  // rather than merged over exactly that, and `scripts/classify.mjs`'s header already wrote the
  // ending for two implementations of one concept.
  //
  // Safe to key on `..`: git-check-ref-format forbids `..` anywhere in a refname, so this shape is
  // a range or a malformed ref and is never a legitimate name being turned away.
  if (ref.includes('..')) {
    throw new Refusal(
      `--ref takes a single revision, not a range, and got "${ref}". This program computes its own ` +
        'range as merge-base(origin/main, ref)..ref, so a range here would be a second implementation ' +
        'of it. If this came from `node scripts/run-gate.mjs --json`, that object names both halves: ' +
        'pass its `tip` field, not its `ref` field.'
    );
  }

  const asJson = process.argv.includes('--json');

  if (cmd === 'subject') {
    const r = computeSubject(repo, ref);
    process.stdout.write(asJson ? `${JSON.stringify(r, null, 2)}\n` : `${r.subject}\n`);
    return 0;
  }

  if (cmd === 'record') {
    const dryRun = process.argv.includes('--dry-run');
    const r = record(repo, ref, {
      verdict: arg('--verdict'),
      by: arg('--by'),
      evidence: arg('--evidence'),
      runId: arg('--run-id'),
      dryRun,
    });
    if (asJson) process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
    else if (dryRun) {
      // NAMES THE PATH IT DID NOT WRITE. "Would write" and "wrote" must not read alike at a glance,
      // which is why the verb changes and the follow-up line is the command to do it for real
      // rather than the commit recipe — a preview that ends in "commit it:" invites committing a
      // file that does not exist.
      process.stdout.write(`DRY RUN — would record ${r.verdict} · tier=${r.tier} · ${r.path}\n`);
      process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
      process.stdout.write('nothing was written. Re-run without --dry-run to record it.\n');
    } else {
      process.stdout.write(`recorded ${r.verdict} · tier=${r.tier} · ${r.path}\n`);
      process.stdout.write(`commit it: git add ${VERDICT_DIR} && git commit -m "qa(verdict): ${r.verdict}"\n`);
    }
    return 0;
  }

  if (cmd === 'check') {
    const r = check(repo, ref);
    if (asJson) process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
    else if (r.ok) {
      process.stdout.write(`verdict PASS bound to ${r.subject.slice(0, 12)}… · tier=${r.tier} · by ${r.record.by}\n`);
    } else {
      process.stderr.write(explain(r));
    }
    return r.ok ? 0 : 1;
  }

  process.stderr.write(usage());
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    process.exit(main());
  } catch (err) {
    process.stderr.write(`verdict: ${err.message}\n`);
    // Any failure to DETERMINE the answer is a refusal, never a pass.
    process.exit(err instanceof Refusal ? err.code : 2);
  }
}
