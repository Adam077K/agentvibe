// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:provenance`.
//
// scripts/provenance-portability.test.mjs — the lens linter, run against a repository that
// has none of this repository's git objects.
//
// THE BUG THIS PINS. Every `sources:` entry in the two lens files is shaped
// `git:<path>@<rev>` and points at a blob that exists only in THIS object store.
// `~/bin/newproject` generates a project by rsyncing the tree while excluding `.git` and
// then running `git init`, so the generated project has an empty object store and all 26
// citations resolved to nothing: schema-lint exited 1 on a brand-new project before anyone
// had touched it. `fetch-depth: 0` was the standing remedy and could never have worked —
// there is no history to fetch when the objects were never in the repository you cloned.
//
// HOW THIS TESTS IT WITHOUT A SECOND REPO OF ITS OWN. schema-lint.js derives REPO_ROOT by
// walking up from `process.cwd()` looking for `.claude/agents`. Point a child process at a
// scratch directory that has one, and the linter treats the scratch as the repository: same
// code, real transplant conditions. The linter itself is required by ABSOLUTE path from the
// real tree, never copied, because it requires `../../scripts/lib/claims.js` relative to its
// own location.
//
// CASE A ALONE WOULD PASS VACUOUSLY if the check had simply stopped checking — a linter that
// verifies nothing also fails nothing. B, C and D are what make A mean something: the check
// still refuses an unrecorded citation, still refuses a byte that moved when the object IS
// reachable, and still refuses a record that only looks like one.
//
// THIS FILE SHIPS INSIDE EVERY GENERATED PROJECT, and so does the CI step that runs it, so
// it must pass in a repository that has none of the objects. Two cases genuinely need them
// and SKIP with a stated reason where they are absent; the rest run everywhere. The first
// version guarded neither, which moved a new project's red build from step 1 to step 17
// instead of removing it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_LINT = path.join(REPO_ROOT, '.claude', 'hooks', 'schema-lint.js');
const MANIFEST_REL = path.join('.claude', 'provenance', 'sources.json');

// Where the real objects live. A worktree's `.git` is a file, so ask git rather than
// assuming `<root>/.git/objects`.
function realObjectsDir() {
  let common = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  if (!path.isAbsolute(common)) common = path.resolve(REPO_ROOT, common);
  return path.join(common, 'objects');
}

/**
 * A repository that looks like a freshly generated project: the lens files and the vendored
 * manifest, an empty git object store, and nothing else.
 */
function makeScratch() {
  // NEVER inside the repo. schema-lint walks UP from cwd looking for `.claude/agents`, so a
  // scratch nested under the real tree would find its own first — but a scratch that failed
  // to create `.claude/agents` would silently escape to the real root and the test would
  // measure the wrong repository.
  const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'provenance-portability-')));
  assert.ok(!scratch.startsWith(REPO_ROOT), `scratch must live outside the repo, got ${scratch}`);

  fs.mkdirSync(path.join(scratch, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(scratch, '.claude', 'provenance'), { recursive: true });
  for (const rel of ['.claude/lenses.yml', '.claude/review-lenses.yml', MANIFEST_REL]) {
    fs.copyFileSync(path.join(REPO_ROOT, rel), path.join(scratch, rel));
  }

  execFileSync('git', ['init', '-q'], { cwd: scratch });
  execFileSync('git', [
    '-c', 'user.email=test@agentvibe.invalid', '-c', 'user.name=provenance-test',
    'commit', '-q', '--allow-empty', '-m', 'generated project, empty object store',
  ], { cwd: scratch });

  return scratch;
}

/** Does THIS checkout hold the cited objects? Answered by asking, not by assuming. */
function objectIsAbsent(repo, commit) {
  try {
    execFileSync('git', ['cat-file', '-e', commit], { cwd: repo, stdio: 'ignore' });
    return false;
  } catch {
    return true;
  }
}

// TWO OF THE CASES BELOW REQUIRE THIS REPOSITORY'S OBJECT STORE, and this file ships inside
// every generated project along with the CI step that runs it. The first version did not
// guard them, so a brand-new project's `npm run check` was still red out of the box — the
// failure had moved from step 1 to step 17 rather than gone, which is not what P0.5 is for.
//
// So the precondition is detected and the two cases SKIP with a stated reason. A silent skip
// would be worse than the bug it papers over: it would leave the impression that case C ran.
// Everything that proves the transplant fix — A, B, B2, D, D2 — runs everywhere.
const A_COMMIT = (() => {
  const m = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, MANIFEST_REL), 'utf8'));
  const first = Object.keys(m).sort()[0];
  return first ? m[first].commit : null;
})();
const OBJECTS_PRESENT = A_COMMIT !== null && !objectIsAbsent(REPO_ROOT, A_COMMIT);
const NEEDS_OBJECTS = OBJECTS_PRESENT ? false
  : `this checkout does not contain the cited git objects (${String(A_COMMIT).slice(0, 7)} is absent), which is ` +
    `the normal state of a generated project. Vendored provenance is what travels; byte-level ` +
    `corroboration only exists in a full clone of the repo the lenses were mined in`;

const PROBE = `
  const path = require('path');
  const lint = require(process.env.SCHEMA_LINT);
  process.stdout.write(JSON.stringify({
    domain: lint.lintLensFile(path.join(process.cwd(), '.claude', 'lenses.yml'), 'domain'),
    review: lint.lintLensFile(path.join(process.cwd(), '.claude', 'review-lenses.yml'), 'review'),
    manifest: lint.lintProvenanceManifest(),
  }));
`;

/** Run the REAL linter with the scratch as its repo root. `alternates` enables case C. */
function lintIn(scratch, { alternates } = {}) {
  const env = { ...process.env, SCHEMA_LINT };
  delete env.GIT_ALTERNATE_OBJECT_DIRECTORIES;
  if (alternates) env.GIT_ALTERNATE_OBJECT_DIRECTORIES = alternates;

  const out = execFileSync(process.execPath, ['-e', PROBE], {
    cwd: scratch, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  const parsed = JSON.parse(out);
  // The walk-up landed on the scratch, not on the real repo. Without this the whole suite
  // could be linting the developer's own checkout and reporting green.
  assert.equal(parsed.domain.rel, '.claude/lenses.yml', 'REPO_ROOT escaped the scratch directory');
  return parsed;
}

function readManifest(scratch) {
  return JSON.parse(fs.readFileSync(path.join(scratch, MANIFEST_REL), 'utf8'));
}
function writeManifest(scratch, doc) {
  fs.writeFileSync(path.join(scratch, MANIFEST_REL), JSON.stringify(doc, null, 2) + '\n');
}
function issuesOf(r) {
  return [...r.domain.issues, ...r.review.issues, ...r.manifest.issues];
}
function withScratch(fn) {
  const scratch = makeScratch();
  try { return fn(scratch); } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
}

// ── A — the regression test ─────────────────────────────────────────────────

test('A: the lenses lint clean in a repository with an empty git object store', () => {
  withScratch((scratch) => {
    const manifest = readManifest(scratch);
    const keys = Object.keys(manifest);
    assert.ok(keys.length > 0, 'the manifest must record something for this test to mean anything');

    // The premise, checked rather than assumed.
    for (const commit of new Set(keys.map((k) => manifest[k].commit))) {
      assert.ok(objectIsAbsent(scratch, commit),
        `${commit} is reachable from the scratch store — this is not a transplanted repo`);
    }

    const r = lintIn(scratch);
    assert.deepEqual(r.domain.issues, []);
    assert.deepEqual(r.review.issues, []);
    assert.deepEqual(r.manifest.issues, []);

    // Passing is correct here; passing SILENTLY is not. Rule 10 — a resolver never passes
    // what it could not check — is satisfied by reporting how much was taken on the record
    // alone, so a transplant is visibly a weaker check rather than an identical green.
    assert.equal(r.manifest.verified, 0, 'nothing can be byte-verified without the objects');
    assert.equal(r.manifest.shapeOnly, keys.length);
    assert.match(r.manifest.label, /0 byte-verified · \d+ shape-only/);
  });
});

// ── B — the manifest is load-bearing, not decorative ────────────────────────

test('B: with the manifest deleted, every git-form citation is refused', () => {
  withScratch((scratch) => {
    fs.rmSync(path.join(scratch, MANIFEST_REL));
    const r = lintIn(scratch);

    assert.ok(r.domain.issues.length > 0, 'a repo with no provenance manifest must not lint clean');
    assert.ok(r.review.issues.length > 0);
    assert.match(issuesOf(r).join('\n'), /not recorded in \.claude\/provenance/);
    assert.match(r.manifest.issues.join('\n'), /missing/);
    assert.match(issuesOf(r).join('\n'), /vendor-provenance\.mjs/, 'the message must name the remedy');
    // The message must not send anyone back to the remedy that never worked.
    assert.doesNotMatch(issuesOf(r).join('\n'), /fetch-depth/);
  });
});

test('B2: an unrecorded citation is refused even though the manifest exists', () => {
  withScratch((scratch) => {
    const manifest = readManifest(scratch);
    const victim = Object.keys(manifest).sort()[0];
    delete manifest[victim];
    writeManifest(scratch, manifest);

    const r = lintIn(scratch);
    assert.match(issuesOf(r).join('\n'), /not recorded in \.claude\/provenance/);
    assert.match(issuesOf(r).join('\n'), new RegExp(victim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});

// ── C — bytes still matter where the bytes are reachable ────────────────────
//
// Approach: GIT_ALTERNATE_OBJECT_DIRECTORIES pointed at the real object store. A full commit
// SHA is a direct object lookup, so no refs are needed in the scratch repo. Probed before
// relying on it; the fallback (running against the real repo with a tampered manifest) was
// not needed.
//
// SKIPPED where the objects are absent, and only there. Where they are present this must
// still fail loudly — it is the case that stops A passing vacuously, so weakening it to make
// it portable would hollow out the whole file.

test('C: a citation whose bytes moved is refused where the object IS reachable', { skip: NEEDS_OBJECTS }, () => {
  withScratch((scratch) => {
    const alternates = realObjectsDir();
    assert.ok(fs.existsSync(alternates), `real object store not found at ${alternates}`);

    // Step one: with the objects reachable and the manifest pristine, everything passes.
    // Without this the tamper below could "fail correctly" for the wrong reason — or pass
    // silently because the objects were never reachable at all.
    assert.deepEqual(issuesOf(lintIn(scratch, { alternates })), [],
      'the pristine manifest must agree with the real objects');

    const manifest = readManifest(scratch);
    const victim = Object.keys(manifest).sort()[0];
    manifest[victim].sha256 = 'f'.repeat(64);
    writeManifest(scratch, manifest);

    const r = lintIn(scratch, { alternates });
    const all = issuesOf(r).join('\n');
    assert.match(all, /does not match/);
    assert.match(all, /ffffffffffff/, 'the message must show what the manifest claimed');

    // And the same tamper is invisible without the objects — which is the deliberate
    // trade: a transplanted repo is checked on shape, this repo is checked on bytes.
    assert.deepEqual(issuesOf(lintIn(scratch)), []);
  });
});

// ── D — a record that only looks like one ───────────────────────────────────

test('D: a malformed record is refused rather than trusted', () => {
  withScratch((scratch) => {
    const manifest = readManifest(scratch);
    const victim = Object.keys(manifest).sort()[0];
    delete manifest[victim].sha256;
    writeManifest(scratch, manifest);

    const r = lintIn(scratch);
    assert.match(issuesOf(r).join('\n'), /malformed record/);
    assert.match(r.manifest.issues.join('\n'), /has no sha256/);
  });
});

test('D2: a record no lens cites is refused as dead surface', () => {
  withScratch((scratch) => {
    const manifest = readManifest(scratch);
    const donor = manifest[Object.keys(manifest).sort()[0]];
    manifest['.claude/agents/nobody-cites-this.md@cda6de9'] = { ...donor, path: '.claude/agents/nobody-cites-this.md' };
    writeManifest(scratch, manifest);

    const r = lintIn(scratch);
    assert.match(r.manifest.issues.join('\n'), /recorded but no lens cites it/);
  });
});

// ── The generator and the linter agree ──────────────────────────────────────

test('the committed manifest is exactly what the generator would write', { skip: NEEDS_OBJECTS }, () => {
  // Folded in here rather than given its own npm step: the manifest being current is the
  // precondition for every case above, and a separate step is one more thing to forget.
  //
  // SKIPPED where the objects are absent. The generator READS the blobs to hash them, so
  // outside a full clone it exits 2 by design — asking it there would only prove the tree
  // was copied, which is not a defect in the tree.
  const r = execFileSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'vendor-provenance.mjs'), '--check'], {
    cwd: REPO_ROOT, encoding: 'utf8',
  });
  assert.match(r, /matches/);
});

test('the skip guard reflects the object store rather than a hardcoded answer', () => {
  // The guard decides whether two cases run at all, so it gets checked itself. If this
  // repo has the objects, NEEDS_OBJECTS must be false and C must have really executed.
  assert.ok(A_COMMIT !== null, 'the manifest recorded no commit to probe');
  assert.equal(OBJECTS_PRESENT, !objectIsAbsent(REPO_ROOT, A_COMMIT));
  assert.equal(NEEDS_OBJECTS === false, OBJECTS_PRESENT);
  if (NEEDS_OBJECTS) assert.match(NEEDS_OBJECTS, /does not contain the cited git objects/);
});
