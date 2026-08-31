// POSTURE: a test, not a gate. It is NOT a step of `npm run check` — bin/fleet-install.mjs is a
// tool the fleet rollout runs by hand, and adding a step means editing scripts/lib/check-suite.js,
// which is irreversible tier and out of scope for this build. Run it with `npm run fleet:test`.
// That is a real gap, named rather than left for a reader to discover: nothing fails a build if
// this file starts failing, and wiring it belongs in the PR that also wires the npm script into
// STEPS.
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
