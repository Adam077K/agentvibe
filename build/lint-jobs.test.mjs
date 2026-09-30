// build/lint-jobs.test.mjs — mutation-style tests for build/lint-jobs.mjs.
// Each rule gets one fixture that must fail it, plus the real register must pass whole.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseJobsFile, lintJobs } from './lint-jobs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function sha256(s) {
  return 'sha256:' + crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function job(overrides = {}) {
  const acceptance = overrides.acceptance !== undefined ? overrides.acceptance : 'Some acceptance test text';
  return {
    id: 'X-01',
    title: 'A job',
    phase: 'P0',
    lane: 'K',
    protected_base: false,
    critical: false,
    depends_on: [],
    founder_deps: [],
    gate_deps: [],
    builder: { family: 'claude', model: 'claude-opus-5' },
    referee: { family: 'codex', model: 'gpt-6-astra' },
    turns_est: 10,
    window_hours_est: 1.3,
    status: 'not_started',
    acceptance,
    acceptance_hash: sha256(acceptance),
    ...overrides,
  };
}

test('refuses turns_est > 30', () => {
  const { errors } = lintJobs([job({ id: 'X-02', turns_est: 31 })]);
  assert.ok(errors.some(e => e.includes('X-02') && e.includes('exceeds the 30-turn cap')));
});

test('refuses an admitted job with turns_est >= 26 (split trigger), warns only otherwise', () => {
  const admitted = lintJobs([job({ id: 'X-03', turns_est: 26, status: 'admitted' })]);
  assert.ok(admitted.errors.some(e => e.includes('X-03') && e.includes('admitted')));

  const notAdmitted = lintJobs([job({ id: 'X-04', turns_est: 26, status: 'not_started' })]);
  assert.deepEqual(notAdmitted.errors, []);
  assert.ok(notAdmitted.warnings.some(w => w.includes('X-04')));
});

test('refuses a same-family referee, but never flags the "both"/"either"/"other" cross-family forms', () => {
  const sameFamily = lintJobs([job({
    id: 'X-05',
    builder: { family: 'claude', model: 'claude-opus-5' },
    referee: { family: 'claude', model: 'claude-opus-5' },
  })]);
  assert.ok(sameFamily.errors.some(e => e.includes('X-05') && e.includes('same-family referee')));

  const crossFamilyForms = lintJobs([
    job({ id: 'X-06', builder: { family: 'both', models: ['claude-opus-5', 'gpt-6-astra'] }, referee: { family: 'claude', model: 'claude-opus-5' } }),
    job({ id: 'X-07', builder: { family: 'either', models: ['claude-opus-5', 'gpt-6-astra'] }, referee: { family: 'other', models: ['claude-opus-5', 'gpt-6-astra'] } }),
  ]);
  assert.deepEqual(crossFamilyForms.errors, []);
});

test('refuses a missing acceptance test', () => {
  const { errors } = lintJobs([job({ id: 'X-08', acceptance: '', acceptance_hash: '' })]);
  assert.ok(errors.some(e => e.includes('X-08') && e.includes('missing acceptance test')));
});

test('refuses an acceptance_hash that does not match the acceptance text', () => {
  const { errors } = lintJobs([job({ id: 'X-09', acceptance_hash: 'sha256:deadbeef' })]);
  assert.ok(errors.some(e => e.includes('X-09') && e.includes('acceptance_hash does not match')));
});

test('refuses a dangling depends_on', () => {
  const { errors } = lintJobs([job({ id: 'X-10', depends_on: ['X-does-not-exist'] })]);
  assert.ok(errors.some(e => e.includes('X-10') && e.includes('dangling depends_on')));
});

test('refuses a protected_base job admitted without founder_present: true', () => {
  const { errors } = lintJobs([job({ id: 'X-11', protected_base: true, status: 'admitted', founder_present: false })]);
  assert.ok(errors.some(e => e.includes('X-11') && e.includes('founder_present')));

  const ok = lintJobs([job({ id: 'X-12', protected_base: true, status: 'admitted', founder_present: true })]);
  assert.deepEqual(ok.errors, []);
});

test('refuses a duplicate id', () => {
  const { errors } = lintJobs([job({ id: 'X-13' }), job({ id: 'X-13' })]);
  assert.ok(errors.some(e => e.includes('duplicate id: X-13')));
});

test('refuses a dependency cycle', () => {
  const a = job({ id: 'X-14', depends_on: ['X-15'] });
  const b = job({ id: 'X-15', depends_on: ['X-14'] });
  const { errors } = lintJobs([a, b]);
  assert.ok(errors.some(e => e.includes('dependency cycle')));
});

test('the real build/jobs.yml register parses and passes with 0 errors, and row count matches the plan', () => {
  const content = fs.readFileSync(path.join(__dirname, 'jobs.yml'), 'utf8');
  const { jobs, parseErrors } = parseJobsFile(content);
  assert.deepEqual(parseErrors, []);

  const { errors } = lintJobs(jobs);
  assert.deepEqual(errors, []);

  const perPhase = {};
  for (const j of jobs) perPhase[j.phase] = (perPhase[j.phase] || 0) + 1;
  assert.deepEqual(perPhase, { P0: 22, P1: 32, P2: 31, P3: 24, P4: 19, P5: 15 });
  assert.equal(jobs.length, 143);
});
