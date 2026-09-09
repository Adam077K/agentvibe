// POSTURE: a test, not a gate. It is NOT a step of `npm run check` — bin/fleet-install.mjs is a
// tool the fleet rollout runs by hand, and adding a step means editing scripts/lib/check-suite.js,
// which is irreversible tier and out of scope for this build. Run it with
// `node --test scripts/fleet-install.test.mjs`. That is a real gap, named rather than left for a
// reader to discover: nothing fails a build if this file starts failing, and wiring it belongs in
// the PR that also wires an npm script into STEPS.
//
// *Corrected 2026-08-31. This line read "Run it with `npm run fleet:test`", and there is no such
// script — package.json has `fleet:install` (the tool itself) and `warroom:fleet` (a different
// tool entirely), and NO script runs this file. The one instruction in this header for running it
// did not work. Verify rather than trust:
// `node -e "console.log(Object.keys(require('./package.json').scripts).filter(s=>/fleet/.test(s)))"`
// — the answer is the two names above, and neither of them is this test.
// The script is deliberately NOT added here: package.json is outside this change's stated scope,
// and a `check:`-prefixed or suite-bound name is an irreversible-tier edit either way.*
//
// scripts/fleet-install.test.mjs — every property tested by constructing the input that DEFEATS it.
//
// ── WHY THE FIXTURES LIVE AT THE REPO ROOT AND NOT IN os.tmpdir() ────────────────────────────
// The ambient temp directory is denied under the armed sandbox, which is why this repo scores
// differently in different cells for the same commit. A test that passes in one shell and EPERMs
// in the gate is worse than no test, because the gate is the only place the result matters. Every
// fixture here is `<repo>/.fleet-fixture-<pid>-<tag>/`, removed in after(). The repo root is
// writable in both cells — scripts/protected-write-tripwire.cjs denies .claude/agents,
// .claude/commands, .claude/hooks, .claude/skills, .claude/workflows and .claude/settings.json,
// and a fixture path under `.fleet-fixture-*` is a prefix match for none of them.
//
// ── WHY THE CLI IS SPAWNED RATHER THAN CALLED ───────────────────────────────────────────────
// Half of what is under test IS the exit code, and main() returns a number while the process
// carries the promise. Calling it in-process would also write the tool output into the test
// output, through fs.writeSync(1), where no reporter can capture it. The unit-level cases below
// import the module directly, because a parser and an argv walker have no exit code to check.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { loadManifest, parseWaves, badToken, EXIT, PROVENANCE_FILE } from '../bin/fleet-install.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(REPO, 'bin', 'fleet-install.mjs');
const HARNESS = { FLEET_INSTALL_TEST_HARNESS: '1' };

// Wave 6 is the subject of every end-to-end case: nine small copied files plus one author entry,
// so a full install is fast and the author path is exercised without a special fixture.
const WAVE = '6';

const fixtures = [];

function fixtureDir(tag) {
  const abs = path.join(REPO, `.fleet-fixture-${process.pid}-${tag}`);
  fs.rmSync(abs, { recursive: true, force: true });
  fs.mkdirSync(abs, { recursive: true });
  fixtures.push(abs);
  return abs;
}

after(() => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
});

function run(args, env = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd: REPO,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}

/** relative path -> sha256 of content, for the whole tree. The proof that nothing was written. */
function snapshot(root) {
  const out = {};
  const stack = [''];
  while (stack.length) {
    const rel = stack.pop();
    for (const ent of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const child = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) stack.push(child);
      else if (ent.isFile()) {
        out[child] = fs.readFileSync(path.join(root, child)).toString('base64');
      }
    }
  }
  return out;
}

const provenance = (root) => JSON.parse(fs.readFileSync(path.join(root, PROVENANCE_FILE), 'utf8'));

const ROUTER = '.claude/skills/routers/INDEX.md';
const TOOL = 'scripts/build-skills-manifest.mjs';
const AUTHORED = '.claude/skills/MANIFEST.json';

// ── argv: refusing is the default, not a fallback ────────────────────────────

test('an unknown flag is refused at exit 2, and the target is untouched', () => {
  const t = fixtureDir('unknown-flag');
  const before = snapshot(t);

  const r = run(['--target', t, '--wave', WAVE, '--aply']);

  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /REFUSED/);
  assert.match(r.out, /"--aply"/);
  assert.doesNotMatch(r.out, /DRY RUN|APPLIED|Plan:/);
  assert.deepEqual(snapshot(t), before);
});

test('a stray positional is refused — the --target DIR N shape that means --wave N', () => {
  const t = fixtureDir('stray-positional');
  const r = run(['--target', t, WAVE]);
  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /REFUSED/);
  assert.match(r.out, /"6"/);
});

test('--manifest is refused without the harness variable', () => {
  const t = fixtureDir('manifest-gate');
  const r = run(['--target', t, '--wave', WAVE, '--manifest', 'fleet/MANIFEST.yml']);
  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /test-only/);
});

test('--wave is required to install and is not defaulted to all', () => {
  const t = fixtureDir('wave-required');
  const r = run(['--target', t]);
  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /--wave is required/);
  assert.deepEqual(snapshot(t), {});
});

test('--verify and --apply together are refused', () => {
  const t = fixtureDir('both-modes');
  const r = run(['--target', t, '--verify', '--apply', '--wave', WAVE]);
  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /--verify and --apply together/);
});

test('an undeclared wave number is refused, naming the ones that exist', () => {
  const t = fixtureDir('bad-wave');
  const r = run(['--target', t, '--wave', '99']);
  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /wave 99 is not declared/);
});

// ── dry run is the default ───────────────────────────────────────────────────

test('the dry run is the default and it writes nothing at all', () => {
  const t = fixtureDir('dry-run');

  const r = run(['--target', t, '--wave', WAVE]);

  assert.equal(r.code, EXIT.OK);
  assert.match(r.out, /DRY RUN, nothing will be written/);
  assert.match(r.out, /CREATE/);
  assert.deepEqual(snapshot(t), {}, 'the dry run left a file behind');
  assert.equal(fs.existsSync(path.join(t, PROVENANCE_FILE)), false);
});

// ── apply ────────────────────────────────────────────────────────────────────

test('--apply writes every copy entry, refuses every author entry, and records both', () => {
  const t = fixtureDir('apply');

  const r = run(['--target', t, '--wave', WAVE, '--apply']);

  assert.equal(r.code, EXIT.OK);
  assert.match(r.out, /APPLIED/);

  assert.equal(
    fs.readFileSync(path.join(t, ROUTER), 'utf8'),
    fs.readFileSync(path.join(REPO, ROUTER), 'utf8'),
  );
  assert.equal(fs.existsSync(path.join(t, TOOL)), true);
  assert.equal(fs.existsSync(path.join(t, AUTHORED)), false, 'an author entry was copied');
  assert.match(r.out, /AUTHOR-REQUIRED/);

  const p = provenance(t);
  assert.equal(p.schema, 1);
  assert.deepEqual(p.waves, [6]);
  assert.equal(typeof p.manifest_sha256, 'string');
  assert.equal(p.files[ROUTER].wave, 6);
  assert.equal(Object.prototype.hasOwnProperty.call(p.files, AUTHORED), false);
  assert.ok(Object.keys(p.files).length >= 9, 'the routers and the tool should all be recorded');
});

test('re-running --apply changes not one byte', () => {
  const t = fixtureDir('idempotent');
  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);
  const before = snapshot(t);

  const r = run(['--target', t, '--wave', WAVE, '--apply']);

  assert.equal(r.code, EXIT.OK);
  assert.match(r.out, /NO-OP/);
  // Including .harness-version: a re-write that differed only in its timestamp would still be a
  // modified file in the target repo, and a tool that dirties a tree it did not change teaches
  // its operator to ignore the diff.
  assert.deepEqual(snapshot(t), before);
});

// ── the three-way check ──────────────────────────────────────────────────────

test('a locally edited file is a CONFLICT, is not overwritten, and blocks the whole apply', () => {
  const t = fixtureDir('conflict');
  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);

  const LOCAL = '# beeond edited this line by hand\n';
  fs.writeFileSync(path.join(t, ROUTER), LOCAL);
  // And a second file that the installer WOULD have to write, so this also tests that one
  // conflict refuses the whole run rather than doing the parts it could.
  fs.rmSync(path.join(t, TOOL));
  const before = snapshot(t);

  const r = run(['--target', t, '--wave', WAVE, '--apply']);

  assert.equal(r.code, EXIT.DRIFT);
  assert.match(r.out, /CONFLICT/);
  assert.match(r.out, /NOTHING WAS WRITTEN/);
  assert.equal(fs.readFileSync(path.join(t, ROUTER), 'utf8'), LOCAL, 'the local edit was destroyed');
  assert.equal(fs.existsSync(path.join(t, TOOL)), false, 're-create ran despite a conflict');
  assert.deepEqual(snapshot(t), before);
});

test('a file that differs from the source but MATCHES the record is an update, not a conflict', () => {
  const t = fixtureDir('update');
  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);

  // Simulate "the target never touched it and the source moved on" by moving the RECORD to the
  // target content, which is the same three-way position and the only one reachable without a
  // second source tree.
  const moved = '# a newer upstream version\n';
  fs.writeFileSync(path.join(t, ROUTER), moved);
  const p = provenance(t);
  p.files[ROUTER].sha256 = spawnSync(process.execPath, ['-e', `const c=require('crypto');process.stdout.write(c.createHash('sha256').update(Buffer.from(${JSON.stringify(moved)})).digest('hex'))`], { encoding: 'utf8' }).stdout;
  fs.writeFileSync(path.join(t, PROVENANCE_FILE), `${JSON.stringify(p, null, 2)}\n`);

  const plan = run(['--target', t, '--wave', WAVE]);
  assert.equal(plan.code, EXIT.OK);
  assert.match(plan.out, /UPDATE — untouched in the target, newer in the source/);
  assert.doesNotMatch(plan.out, /CONFLICT —/);

  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);
  assert.equal(
    fs.readFileSync(path.join(t, ROUTER), 'utf8'),
    fs.readFileSync(path.join(REPO, ROUTER), 'utf8'),
  );
});

test('a differing file with NO record is a conflict — this is the beeond case', () => {
  const t = fixtureDir('no-record');
  fs.mkdirSync(path.join(t, path.dirname(ROUTER)), { recursive: true });
  fs.writeFileSync(path.join(t, ROUTER), '# copied by hand months ago, then edited\n');

  const r = run(['--target', t, '--wave', WAVE, '--apply']);

  assert.equal(r.code, EXIT.DRIFT);
  assert.match(r.out, /nothing is recorded for it/);
  assert.equal(fs.existsSync(path.join(t, TOOL)), false);
});

// ── verify: three outcomes, and 2 dominates 1 dominates 0 ────────────────────

test('--verify is 0 when every declared file matches', () => {
  const t = fixtureDir('verify-clean');
  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);

  const r = run(['--target', t, '--verify']);

  assert.equal(r.code, EXIT.OK);
  assert.match(r.out, /IN SYNC — exit 0/);
  assert.match(r.out, /AUTHOR-REQUIRED — excluded from the verdict by design/);
});

test('--verify is 1 when a declared file was edited in the target', () => {
  const t = fixtureDir('verify-edited');
  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);
  fs.appendFileSync(path.join(t, ROUTER), '\nlocal addition\n');

  const r = run(['--target', t, '--verify']);

  assert.equal(r.code, EXIT.DRIFT);
  assert.match(r.out, /DRIFTED — exit 1/);
  assert.match(r.out, /routers\/INDEX\.md/);
});

test('--verify is 1 when a declared file was deleted from the target', () => {
  const t = fixtureDir('verify-deleted');
  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);
  fs.rmSync(path.join(t, TOOL));

  const r = run(['--target', t, '--verify']);

  assert.equal(r.code, EXIT.DRIFT);
  assert.match(r.out, /DRIFTED — exit 1/);
  assert.match(r.out, /no longer present in the target/);
});

test('--verify is 2 with no .harness-version, and says so rather than comparing anyway', () => {
  const t = fixtureDir('verify-unrecorded');
  // Every declared file present and byte-identical: a two-way check would answer 0 here, which is
  // exactly the wrong answer and exactly what this case exists to pin.
  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);
  fs.rmSync(path.join(t, PROVENANCE_FILE));

  const r = run(['--target', t, '--verify']);

  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /COULD NOT CHECK — exit 2/);
  assert.match(r.out, /no \.harness-version in the target/);
  assert.doesNotMatch(r.out, /IN SYNC — exit 0/);
});

test('--verify is 2 when the target cannot be read at all', () => {
  const t = path.join(REPO, `.fleet-fixture-${process.pid}-absent`);
  const r = run(['--target', t, '--verify']);
  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /REFUSED/);
});

test('--verify is 2 when .harness-version is present but unusable', () => {
  const t = fixtureDir('verify-corrupt');
  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);
  fs.writeFileSync(path.join(t, PROVENANCE_FILE), '{ this is not json');

  const r = run(['--target', t, '--verify']);

  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /COULD NOT CHECK — exit 2/);
  assert.match(r.out, /not valid JSON/);
});

test('--verify --wave says SUBSET and refuses to stand for the whole install', () => {
  const t = fixtureDir('verify-subset');
  assert.equal(run(['--target', t, '--wave', WAVE, '--apply']).code, EXIT.OK);

  const r = run(['--target', t, '--verify', '--wave', WAVE]);

  assert.equal(r.code, EXIT.OK);
  assert.match(r.out, /SUBSET/);
  assert.doesNotMatch(r.out, /IN SYNC — exit 0/);
});

// ── a source file the manifest declares and the source does not have ─────────

const manifestFixture = (dir, name, extra) => {
  const file = path.join(dir, name);
  fs.writeFileSync(
    file,
    [
      'schema: 1',
      'source_repo: fixture',
      'waves:',
      '  - wave: 9',
      '    id: fixture-wave',
      '    entries:',
      '      - path: fleet/MANIFEST.yml',
      '        kind: copy',
      ...(extra || []),
      '',
    ].join('\n'),
  );
  return file;
};

test('a declared source file that does not exist REFUSES the install before writing anything', () => {
  const t = fixtureDir('source-missing-install');
  const m = manifestFixture(t, 'manifest.yml', [
    '      - path: fleet/there-is-no-such-file.txt',
    '        kind: copy',
  ]);
  const before = snapshot(t);

  const r = run(['--target', t, '--wave', '9', '--apply', '--manifest', m], HARNESS);

  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /could not be read/);
  assert.deepEqual(snapshot(t), before);
});

test('a declared source file that vanishes later makes --verify could-not-check, not drift', () => {
  const t = fixtureDir('source-missing-verify');
  const good = manifestFixture(t, 'good.yml');
  const gone = manifestFixture(t, 'gone.yml', [
    '      - path: fleet/there-is-no-such-file.txt',
    '        kind: copy',
  ]);

  assert.equal(run(['--target', t, '--wave', '9', '--apply', '--manifest', good], HARNESS).code, EXIT.OK);
  assert.equal(run(['--target', t, '--verify', '--manifest', good], HARNESS).code, EXIT.OK);

  const r = run(['--target', t, '--verify', '--manifest', gone], HARNESS);

  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /COULD NOT CHECK — exit 2/);
  assert.match(r.out, /there-is-no-such-file\.txt/);
});

// ── manifest validation, each rule defeated by its own fixture ───────────────

const badManifest = (dir, name, lines) => {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
  return file;
};

test('the manifest is refused when a rule that protects the target is broken', () => {
  const d = fixtureDir('manifest-rules');

  const head = ['schema: 1', 'waves:', '  - wave: 1', '    id: x', '    entries:'];
  const cases = [
    [['      - path: a/b.txt', '        kind: author'], /no "why"/],
    [['      - path: a/b', '        kind: copy-tree'], /does not end in/],
    [['      - path: ../outside.txt', '        kind: copy'], /climbs out of the target/],
    [['      - path: /etc/passwd', '        kind: copy'], /absolute or climbs out/],
    [['      - path: a/b.txt', '        kind: symlink'], /known kinds are/],
  ];

  cases.forEach(([tail, expected], i) => {
    const f = badManifest(d, `bad-${i}.yml`, [...head, ...tail]);
    assert.throws(() => loadManifest(f), expected, `case ${i} was accepted`);
  });

  // The control: the same shape, valid, must load — so a failure above is the rule and not the
  // fixture being broken in some other way.
  const ok = badManifest(d, 'ok.yml', [...head, '      - path: a/b.txt', '        kind: copy']);
  assert.equal(loadManifest(ok).doc.waves[0].entries[0].path, 'a/b.txt');
});

test('the shipped manifest loads, and every author entry carries a reason', () => {
  const m = loadManifest(path.join(REPO, 'fleet', 'MANIFEST.yml'));
  assert.equal(m.doc.schema, 1);
  assert.ok(m.doc.waves.length >= 5);
  const authors = m.doc.waves.flatMap((wv) => wv.entries.filter((e) => e.kind === 'author'));
  assert.ok(authors.length >= 3, 'the three author entries named in the plan should be there');
  for (const a of authors) assert.ok(a.why.length > 40, `${a.path} has a stub reason`);
  const paths = m.doc.waves.flatMap((wv) => wv.entries.map((e) => e.path));
  for (const p of ['.claude/qa-tier-floor.yml', 'scripts/lib/check-suite.js', '.github/workflows/ci.yml']) {
    assert.ok(paths.includes(p), `${p} is not declared`);
  }
});

// ── copy-localized: the target is allowed to adapt, and only in one direction ────────────────
//
// Every case below drives the SAME fixture into a different corner of the three-hash table at
// classifyEntry, using the same two levers: rewrite the target file (moves T), rewrite the
// recorded hash (moves R relative to S). There is no second source tree to move S with, so
// "the source moved on" is reached by moving R away from S — the identical three-hash position,
// and the only one reachable from one checkout. That substitution is the whole reason these cases
// can exist at all, and it is why R is written by hand rather than by a second install.

/** A manifest over ONE real source file, at the kind under test. Wave 9, no author entries. */
function localizedManifest(dir, name, kind, why) {
  const file = path.join(dir, name);
  fs.writeFileSync(
    file,
    [
      'schema: 1',
      'source_repo: fixture',
      'waves:',
      '  - wave: 9',
      '    id: localized-fixture',
      '    entries:',
      `      - path: ${TOOL}`,
      `        kind: ${kind}`,
      ...(why ? [`        why: ${why}`] : []),
      '',
    ].join('\n'),
  );
  return file;
}

const WHY = 'The POSTURE header names the step that runs it, and that is a fact about the target.';

/** Install one file, then move the target, the record, or both. Returns the fixture root. */
function localizedFixture(tag, { target, record }) {
  const t = fixtureDir(tag);
  const m = localizedManifest(t, 'manifest.yml', 'copy-localized', WHY);
  assert.equal(run(['--target', t, '--wave', '9', '--apply', '--manifest', m], HARNESS).code, EXIT.OK);

  if (target !== undefined) fs.writeFileSync(path.join(t, TOOL), target);
  if (record !== undefined) {
    const p = provenance(t);
    p.files[TOOL].sha256 = sha256(record);
    fs.writeFileSync(path.join(t, PROVENANCE_FILE), `${JSON.stringify(p, null, 2)}\n`);
  }
  return { t, m };
}

const sha256 = (text) =>
  spawnSync(
    process.execPath,
    ['-e', `const c=require('crypto');process.stdout.write(c.createHash('sha256').update(Buffer.from(${JSON.stringify(text)})).digest('hex'))`],
    { encoding: 'utf8' },
  ).stdout;

test('the manifest refuses a copy-localized entry with no why, and a tree that claims the kind', () => {
  const d = fixtureDir('localized-rules');
  const head = ['schema: 1', 'waves:', '  - wave: 1', '    id: x', '    entries:'];

  const noWhy = badManifest(d, 'no-why.yml', [...head, '      - path: a/b.txt', '        kind: copy-localized']);
  assert.throws(() => loadManifest(noWhy), /copy-localized with no "why"/);

  const tree = badManifest(d, 'tree.yml', [
    ...head, '      - path: a/**', '        kind: copy-localized', '        why: because',
  ]);
  assert.throws(() => loadManifest(tree), /names a tree/);

  // The control: the same shape with a why, on a file, must load.
  const ok = badManifest(d, 'ok.yml', [
    ...head, '      - path: a/b.txt', '        kind: copy-localized', '        why: because',
  ]);
  assert.equal(loadManifest(ok).doc.waves[0].entries[0].kind, 'copy-localized');
});

test('TARGET CHANGED ONLY on a copy-localized file is NOT a failure, and is named in the output', () => {
  const { t, m } = localizedFixture('localized-target', { target: '# beeond corrected the POSTURE header\n' });

  const r = run(['--target', t, '--verify', '--manifest', m], HARNESS);

  assert.equal(r.code, EXIT.OK, 'an adapted localized file failed the verify');
  assert.match(r.out, /IN SYNC — exit 0/);
  assert.match(r.out, /LOCALIZED — adapted by the target, and the source has not moved \(1\)/);
  // Absorbing a file silently is the failure mode this whole kind risks, so the verdict has to
  // carry the count and the file has to be named with the reason it was allowed to differ.
  assert.match(r.out, /1 of them are copy-localized and were counted as adapted rather than drifted/);
  assert.match(r.out, /build-skills-manifest\.mjs/);
  assert.match(r.out, /expected to differ: The POSTURE header names the step/);
  assert.doesNotMatch(r.out, /DRIFTED — exit 1/);
});

test('the SAME divergence on a plain copy entry is still drift — the default did not move', () => {
  const t = fixtureDir('localized-control');
  const plain = localizedManifest(t, 'plain.yml', 'copy', null);
  assert.equal(run(['--target', t, '--wave', '9', '--apply', '--manifest', plain], HARNESS).code, EXIT.OK);
  fs.writeFileSync(path.join(t, TOOL), '# beeond corrected the POSTURE header\n');

  const r = run(['--target', t, '--verify', '--manifest', plain], HARNESS);

  assert.equal(r.code, EXIT.DRIFT);
  assert.match(r.out, /DRIFTED — exit 1/);
  assert.match(r.out, /the target edited it/);
  assert.doesNotMatch(r.out, /LOCALIZED —/);
});

test('SOURCE MOVED ON for a copy-localized file IS a failure, and says it needs re-porting', () => {
  // T == R and both differ from S: the target has not adapted this file yet AND the source has been
  // revised since it was taken. Moving T and R together is what puts them there — moving R alone
  // leaves T == S, which is in-sync no matter what the record says, and that is correct.
  const OLD = '# the version this target was installed from\n';
  const { t, m } = localizedFixture('localized-behind', { target: OLD, record: OLD });

  const r = run(['--target', t, '--verify', '--manifest', m], HARNESS);

  assert.equal(r.code, EXIT.DRIFT, 'being behind the source was absorbed');
  assert.match(r.out, /DRIFTED — exit 1/);
  assert.match(r.out, /LOCALIZED AND BEHIND THE SOURCE — needs re-porting \(1\)/);
  assert.match(r.out, /build-skills-manifest\.mjs/);
  assert.match(r.out, /unchanged since install; the source has moved on/);
  assert.match(r.out, /re-port each, keeping the adaptation/);
  assert.doesNotMatch(r.out, /IN SYNC — exit 0/);
});

test('a record that is stale while target and source AGREE is in sync, and stays exit 0', () => {
  // The control for the case above, and the reason it has to move T and R together. Here only R
  // is stale: the two trees hold the same bytes, so there is nothing to port and nothing to
  // reconcile. A tool that failed this would fail every target that had been re-ported by hand.
  const { t, m } = localizedFixture('localized-stale-record', { record: '# a hash from an older install\n' });

  const r = run(['--target', t, '--verify', '--manifest', m], HARNESS);

  assert.equal(r.code, EXIT.OK);
  assert.match(r.out, /IN SYNC — exit 0/);
  assert.doesNotMatch(r.out, /LOCALIZED/);
});

test('BOTH CHANGED is a conflict a person must reconcile, at exit 1, never absorbed', () => {
  const { t, m } = localizedFixture('localized-both', {
    target: '# beeond corrected the POSTURE header\n',
    record: '# what the source used to be\n',
  });

  const v = run(['--target', t, '--verify', '--manifest', m], HARNESS);
  assert.equal(v.code, EXIT.DRIFT);
  assert.match(v.out, /LOCALIZED AND BEHIND THE SOURCE/);
  assert.match(v.out, /revised in the source since/);
  assert.doesNotMatch(v.out, /IN SYNC — exit 0/);

  // And --apply still refuses it, without writing a byte.
  const before = snapshot(t);
  const a = run(['--target', t, '--wave', '9', '--apply', '--manifest', m], HARNESS);
  assert.equal(a.code, EXIT.DRIFT);
  assert.match(a.out, /CONFLICT/);
  assert.match(a.out, /NOTHING WAS WRITTEN/);
  assert.match(a.out, /Re-port it, keeping the adaptation/);
  assert.deepEqual(snapshot(t), before);
});

test('a copy-localized file with NO record is AMBIGUOUS at exit 2, not absorbed and not drift', () => {
  const t = fixtureDir('localized-unrecorded');
  const m = localizedManifest(t, 'manifest.yml', 'copy-localized', WHY);
  assert.equal(run(['--target', t, '--wave', '9', '--apply', '--manifest', m], HARNESS).code, EXIT.OK);
  fs.writeFileSync(path.join(t, TOOL), '# hand-placed, or added to the manifest after the install\n');
  const p = provenance(t);
  delete p.files[TOOL];
  fs.writeFileSync(path.join(t, PROVENANCE_FILE), `${JSON.stringify(p, null, 2)}\n`);

  const r = run(['--target', t, '--verify', '--manifest', m], HARNESS);

  // Rule 10. "Allowed to differ" plus "no evidence of which side moved" is not a pass and is not
  // a drift; picking the comfortable one of those two is the thing being refused here.
  assert.equal(r.code, EXIT.REFUSED);
  assert.match(r.out, /COULD NOT CHECK — exit 2/);
  assert.match(r.out, /no way to tell the two apart/);
  assert.doesNotMatch(r.out, /IN SYNC — exit 0/);
  assert.doesNotMatch(r.out, /DRIFTED — exit 1/);
});

test('--apply leaves an adapted copy-localized file alone and rewrites nothing', () => {
  const LOCAL = '# beeond corrected the POSTURE header\n';
  const { t, m } = localizedFixture('localized-apply', { target: LOCAL });
  const before = snapshot(t);

  const r = run(['--target', t, '--wave', '9', '--apply', '--manifest', m], HARNESS);

  assert.equal(r.code, EXIT.OK);
  assert.match(r.out, /LOCALIZED — adapted by the target, LEFT ALONE \(1\)/);
  assert.equal(fs.readFileSync(path.join(t, TOOL), 'utf8'), LOCAL, 'the adaptation was overwritten');
  // Not one byte, .harness-version included: the record still points at the source content this
  // copy was taken from, which is the only leg that can later say which side moved.
  assert.deepEqual(snapshot(t), before);
});

test('a copy-localized file the target DELETED is still drift, not an absorbed adaptation', () => {
  const { t, m } = localizedFixture('localized-deleted', {});
  fs.rmSync(path.join(t, TOOL));

  const r = run(['--target', t, '--verify', '--manifest', m], HARNESS);

  assert.equal(r.code, EXIT.DRIFT);
  assert.match(r.out, /no longer present in the target/);
  assert.doesNotMatch(r.out, /LOCALIZED —/);
});

test('the shipped manifest declares copy-localized entries, each with a real reason', () => {
  const m = loadManifest(path.join(REPO, 'fleet', 'MANIFEST.yml'));
  const localized = m.doc.waves.flatMap((wv) => wv.entries.filter((e) => e.kind === 'copy-localized'));
  assert.ok(localized.length > 0, 'nothing is declared localizable');
  for (const e of localized) {
    assert.ok(e.why.length > 80, `${e.path} has a stub reason`);
    assert.ok(!e.path.endsWith('/**'), `${e.path} is a tree`);
  }

  // The set is bounded by measurement, not by convenience: a manifest where most of the harness is
  // exempt from the target-changed check is one that has stopped checking. Half is the line.
  const copyable = m.doc.waves.flatMap((wv) => wv.entries.filter((e) => e.kind !== 'author' && e.kind !== 'copy-tree'));
  assert.ok(
    localized.length * 2 < copyable.length,
    `${localized.length} of ${copyable.length} copy entries are localizable — over half is not an exemption, it is the default`,
  );
});

// ── unit: the two pure argv helpers ──────────────────────────────────────────

test('badToken finds the first thing the program does not read, and nothing else', () => {
  assert.equal(badToken(['--target', 'x', '--wave', '2', '--apply']), null);
  assert.equal(badToken(['--target', 'x', '--verify']), null);
  assert.equal(badToken(['--target', 'x', '--nope']), '--nope');
  assert.equal(badToken(['--target', 'x', 'stray']), 'stray');
  // A flag value is skipped, so a value that looks like a word is never read as a token.
  assert.equal(badToken(['--wave', 'all']), null);
  // A flag given with no value does not swallow the next flag.
  assert.equal(badToken(['--target', '--nope']), '--nope');
});

test('parseWaves accepts all, a list, and refuses everything else', () => {
  assert.deepEqual(parseWaves('all', [4, 1, 2]), [1, 2, 4]);
  assert.deepEqual(parseWaves('2', [1, 2]), [2]);
  assert.deepEqual(parseWaves('2,1,2', [1, 2]), [1, 2]);
  assert.throws(() => parseWaves('', [1]), /names no wave/);
  assert.throws(() => parseWaves('two', [1]), /not a wave number/);
  assert.throws(() => parseWaves('7', [1, 2]), /not declared in the manifest/);
});
