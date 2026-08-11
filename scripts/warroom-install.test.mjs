/**
 * warroom-install.test.mjs — the guard rails, as tests.
 *
 * POSTURE: BLOCKS. Run by `.github/workflows/ci.yml` on every PR.
 *
 * Every case here was originally checked by hand in a scratch directory. All of
 * them passed, and a bug shipped anyway: backups were stored without the
 * executable bit, so a restored launcher could not run. The manual pass missed
 * it because the seeded file happened to already be 0755 — the mismatch the bug
 * needed was never constructed.
 *
 * So these run against a temporary HOME on every PR, and the mode cases assert
 * the property that actually matters: not "a backup was taken" but "the thing
 * restored from it works".
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'warroom-install.mjs');

/** Run the installer with an isolated HOME. Never touches the real one. */
function run(home, args) {
  try {
    return {
      code: 0,
      out: execFileSync('node', [SCRIPT, ...args], { env: { ...process.env, HOME: home }, encoding: 'utf8' }),
    };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

/** A throwaway HOME with a launcher at ~/bin/<session> and a config. */
function sandbox(t, { mode = 0o755 } = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'warroom-test-'));
  fs.mkdirSync(path.join(home, 'bin'), { recursive: true });
  const launcher = path.join(home, 'bin', 'proj');
  fs.writeFileSync(launcher, '#!/bin/bash\necho ORIGINAL\n');
  fs.chmodSync(launcher, mode);
  const projectDir = path.join(home, 'project');
  fs.mkdirSync(projectDir, { recursive: true });
  const config = path.join(projectDir, '.warroom.yml');
  fs.writeFileSync(config, `session: proj\nproject_dir: ${projectDir}\n`);
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return { home, launcher, config, projectDir };
}

const modeOf = (p) => fs.statSync(p).mode & 0o777;

test('install refuses an unmanaged file, and writes nothing', (t) => {
  const s = sandbox(t);
  const before = fs.readFileSync(s.launcher, 'utf8');
  const r = run(s.home, ['install', '--config', s.config]);
  assert.equal(r.code, 1);
  assert.match(r.out, /was not installed by warroom/);
  assert.match(r.out, /Nothing was written/);
  assert.equal(fs.readFileSync(s.launcher, 'utf8'), before, 'launcher must be untouched');
  assert.equal(fs.existsSync(path.join(s.home, '.warroom', 'manifest.json')), false);
});

test('install --force adopts it, taking a backup first', (t) => {
  const s = sandbox(t);
  const r = run(s.home, ['install', '--config', s.config, '--force']);
  assert.equal(r.code, 0, r.out);
  assert.match(fs.readFileSync(s.launcher, 'utf8'), /^exec /m, 'launcher is now a shim');
  const m = JSON.parse(fs.readFileSync(path.join(s.home, '.warroom', 'manifest.json'), 'utf8'));
  assert.equal(m.installs.proj.backups.length, 1);
  assert.match(fs.readFileSync(m.installs.proj.backups[0].stored, 'utf8'), /ORIGINAL/);
});

test('backup preserves the executable bit', (t) => {
  const s = sandbox(t);
  run(s.home, ['install', '--config', s.config, '--force']);
  const m = JSON.parse(fs.readFileSync(path.join(s.home, '.warroom', 'manifest.json'), 'utf8'));
  const b = m.installs.proj.backups.find((x) => x.origin === s.launcher);
  assert.equal(b.mode & 0o111 ? true : false, true, 'mode must be recorded with +x');
  assert.equal(modeOf(b.stored) & 0o111 ? true : false, true, 'stored backup must be executable');
});

test('rollback restores content AND mode, and the result runs', (t) => {
  const s = sandbox(t);
  run(s.home, ['install', '--config', s.config, '--force']);
  const r = run(s.home, ['rollback', '--session', 'proj']);
  assert.equal(r.code, 0, r.out);
  assert.match(fs.readFileSync(s.launcher, 'utf8'), /ORIGINAL/);
  assert.equal(modeOf(s.launcher), 0o755);
  assert.match(execFileSync(s.launcher, { encoding: 'utf8' }), /ORIGINAL/, 'restored launcher must be runnable');
});

// The regression. A backup taken from an already-broken origin records 0644;
// restoring it faithfully hands back a launcher the shell refuses to run. This
// is the exact sequence that bit the first real install.
test('rollback self-heals a non-executable script backup', (t) => {
  const s = sandbox(t, { mode: 0o644 });
  run(s.home, ['install', '--config', s.config, '--force']);
  const m = JSON.parse(fs.readFileSync(path.join(s.home, '.warroom', 'manifest.json'), 'utf8'));
  const b = m.installs.proj.backups.find((x) => x.origin === s.launcher);
  assert.equal(b.mode & 0o111, 0, 'precondition: the backup captured a non-executable origin');

  const r = run(s.home, ['rollback', '--session', 'proj']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /not executable. Restored with \+x/);
  assert.notEqual(modeOf(s.launcher) & 0o111, 0, 'restored launcher must be executable');
  assert.match(execFileSync(s.launcher, { encoding: 'utf8' }), /ORIGINAL/);
});

test('rollback fails loudly on a missing backup and restores nothing', (t) => {
  const s = sandbox(t);
  run(s.home, ['install', '--config', s.config, '--force']);
  const m = JSON.parse(fs.readFileSync(path.join(s.home, '.warroom', 'manifest.json'), 'utf8'));
  fs.rmSync(path.dirname(m.installs.proj.backups[0].stored), { recursive: true, force: true });
  const shimBefore = fs.readFileSync(s.launcher, 'utf8');
  const r = run(s.home, ['rollback', '--session', 'proj']);
  assert.equal(r.code, 1);
  assert.match(r.out, /backup missing/);
  assert.match(r.out, /Nothing was written/);
  assert.equal(fs.readFileSync(s.launcher, 'utf8'), shimBefore);
});

test('rollback refuses a corrupted backup', (t) => {
  const s = sandbox(t);
  run(s.home, ['install', '--config', s.config, '--force']);
  const m = JSON.parse(fs.readFileSync(path.join(s.home, '.warroom', 'manifest.json'), 'utf8'));
  fs.writeFileSync(m.installs.proj.backups[0].stored, '#!/bin/bash\necho TAMPERED\n');
  const r = run(s.home, ['rollback', '--session', 'proj']);
  assert.equal(r.code, 1);
  assert.match(r.out, /backup corrupt/);
});

test('install refuses a hard-linked target even with --force', (t) => {
  const s = sandbox(t);
  fs.linkSync(s.launcher, path.join(s.home, 'bin', 'proj-hardlink'));
  const before = fs.readFileSync(s.launcher, 'utf8');
  const r = run(s.home, ['install', '--config', s.config, '--force']);
  assert.equal(r.code, 1);
  assert.match(r.out, /hard links/);
  assert.equal(fs.readFileSync(s.launcher, 'utf8'), before);
});

test('install preserves a symlink and writes through to its target', (t) => {
  const s = sandbox(t);
  const real = path.join(s.home, 'bin', 'real');
  fs.renameSync(s.launcher, real);
  fs.symlinkSync(real, s.launcher);
  const r = run(s.home, ['install', '--config', s.config, '--force']);
  assert.equal(r.code, 0, r.out);
  assert.equal(fs.lstatSync(s.launcher).isSymbolicLink(), true, 'symlink must survive');
  assert.match(fs.readFileSync(real, 'utf8'), /^exec /m, 'target receives the shim');
});

test('install refuses after a local edit, naming both hashes', (t) => {
  const s = sandbox(t);
  run(s.home, ['install', '--config', s.config, '--force']);
  fs.appendFileSync(s.launcher, '# hand-edited\n');
  const edited = fs.readFileSync(s.launcher, 'utf8');
  const r = run(s.home, ['install', '--config', s.config]);
  assert.equal(r.code, 1);
  assert.match(r.out, /was modified since install/);
  assert.equal(fs.readFileSync(s.launcher, 'utf8'), edited, 'the local edit must survive a refusal');
});

test('check is read-only', (t) => {
  const s = sandbox(t);
  const before = fs.readFileSync(s.launcher, 'utf8');
  const r = run(s.home, ['check', '--config', s.config]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /No files were written/);
  assert.equal(fs.readFileSync(s.launcher, 'utf8'), before);
  assert.equal(fs.existsSync(path.join(s.home, '.warroom', 'manifest.json')), false);
});
