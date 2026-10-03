// build/lint-jobs.test.mjs — mutation-style tests for build/lint-jobs.mjs.
// Each rule gets one fixture that must fail it, plus the real register must pass whole.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseJobsFile, lintJobs, parseCapabilitiesFile, lintCapabilities } from './lint-jobs.mjs';
import { spawnSync } from 'node:child_process';

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
    builder: { family: 'claude', model: 'claude-opus-5-5' },
    referee: { family: 'codex', model: 'gpt-6-astra' },
    turns_est: 10,
    window_hours_est: 1.3,
    status: 'not_started',
    acceptance,
    acceptance_hash: sha256(acceptance),
    ...overrides,
  };
}

// A minimal, valid job block in build/jobs.yml's own written form, for the real-parser tests.
function jobYaml(id, extraLines = []) {
  return [
    `- id: ${id}`,
    `  title: "t"`,
    `  phase: P0`,
    `  lane: K`,
    `  protected_base: false`,
    `  critical: false`,
    `  depends_on: [${extraLines.depends || ''}]`,
    `  founder_deps: []`,
    `  gate_deps: []`,
    `  builder: {family: ${extraLines.builderFamily || 'claude'}, model: "claude-opus-5-5"}`,
    `  referee: {family: codex, model: "gpt-6-astra"}`,
    `  turns_est: 10`,
    `  window_hours_est: 1.3`,
    `  status: not_started`,
    `  acceptance: "a"`,
    `  acceptance_hash: "${sha256('a')}"`,
    '',
  ].join('\n');
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

test('refuses a same-family referee (normalised comparison), never flags "both"/"either", and refuses a family value outside claude|codex|either|both', () => {
  const sameFamily = lintJobs([job({
    id: 'X-05',
    builder: { family: 'claude', model: 'claude-opus-5-5' },
    referee: { family: 'claude', model: 'claude-opus-5-5' },
  })]);
  assert.ok(sameFamily.errors.some(e => e.includes('X-05') && e.includes('same-family referee')));

  const crossFamilyForms = lintJobs([
    job({ id: 'X-06', builder: { family: 'both', models: ['claude-opus-5-5', 'gpt-6-astra'] }, referee: { family: 'claude', model: 'claude-opus-5-5' } }),
    job({ id: 'X-07', builder: { family: 'either', models: ['claude-opus-5-5', 'gpt-6-astra'] }, referee: { family: 'either', models: ['claude-opus-5-5', 'gpt-6-astra'] } }),
  ]);
  assert.deepEqual(crossFamilyForms.errors, []);

  // Real parser, fixture file: a wrong-case family value ("Claude") must be refused at parse
  // time, not silently accepted as a fifth family the same-family check has never heard of.
  const badFamilyYaml = jobYaml('X-BAD-FAMILY', { builderFamily: 'Claude' });
  const { parseErrors } = parseJobsFile(badFamilyYaml);
  assert.ok(parseErrors.some(e => e.includes('X-BAD-FAMILY') && e.includes('not one of claude|codex|either|both')));
});

test('refuses a missing acceptance test', () => {
  const { errors } = lintJobs([job({ id: 'X-08', acceptance: '', acceptance_hash: '' })]);
  assert.ok(errors.some(e => e.includes('X-08') && e.includes('missing acceptance test')));
});

test('refuses an acceptance_hash that does not match the acceptance text', () => {
  const { errors } = lintJobs([job({ id: 'X-09', acceptance_hash: 'sha256:deadbeef' })]);
  assert.ok(errors.some(e => e.includes('X-09') && e.includes('acceptance_hash does not match')));
});

test('refuses a dangling depends_on, including 14-BUILD-PLAN.md §6\'s own unquoted written form run through the real parser', () => {
  const { errors } = lintJobs([job({ id: 'X-10', depends_on: ['X-does-not-exist'] })]);
  assert.ok(errors.some(e => e.includes('X-10') && e.includes('dangling depends_on')));

  // §6's own example writes depends_on: [B1-01, B1-02] — unquoted. A parser that only
  // recognises quoted entries silently drops a bare id, and the dangling check never sees it.
  const bareTokenYaml = jobYaml('X-BARE', { depends: 'B9-99' });
  const { jobs: parsedJobs } = parseJobsFile(bareTokenYaml);
  assert.deepEqual(parsedJobs[0].depends_on, ['B9-99']);
  const bareResult = lintJobs(parsedJobs);
  assert.ok(bareResult.errors.some(e => e.includes('X-BARE') && e.includes('dangling depends_on "B9-99"')));

  // A trailing comment, a YAML block list, and a multi-line array all used to parse as a
  // silent [] — the dangling check never saw the dependency at all. Each must now name the
  // exact offending line instead.
  for (const badLine of ['  depends_on: [B0-01] # comment', '  depends_on:', '  depends_on: [B0-01,']) {
    const bad = jobYaml('X-BADLINE').replace('  depends_on: []', badLine);
    const { parseErrors: badErrors } = parseJobsFile(bad);
    assert.ok(badErrors.some(e => e.includes('X-BADLINE') && e.includes('not the one accepted form') && e.includes(badLine)), badLine);
  }
});

test('refuses a protected_base job admitted without founder_present: true', () => {
  const { errors } = lintJobs([job({ id: 'X-11', protected_base: true, status: 'admitted', founder_present: false })]);
  assert.ok(errors.some(e => e.includes('X-11') && e.includes('founder_present')));

  const ok = lintJobs([job({ id: 'X-12', protected_base: true, status: 'admitted', founder_present: true })]);
  assert.deepEqual(ok.errors, []);
});

test('refuses a duplicate id and a dependency cycle', () => {
  const dup = lintJobs([job({ id: 'X-13' }), job({ id: 'X-13' })]);
  assert.ok(dup.errors.some(e => e.includes('duplicate id: X-13')));

  const a = job({ id: 'X-14', depends_on: ['X-15'] });
  const b = job({ id: 'X-15', depends_on: ['X-14'] });
  const cycle = lintJobs([a, b]);
  assert.ok(cycle.errors.some(e => e.includes('dependency cycle')));
});

test('refuses a capability with no delivering job (unless trigger: true) or a dangling delivering_jobs entry, via the real capabilities parser', () => {
  const jobs = [job({ id: 'B0-01' })];

  const emptyCapYaml = [
    '- id: "07"',
    '  file: "07-SKILLS-TOOLS-MCP.md"',
    '  lanes: [C]',
    '  trigger: false',
    '  delivering_jobs: []',
    '',
  ].join('\n');
  const { capabilities: emptyCap } = parseCapabilitiesFile(emptyCapYaml);
  const emptyResult = lintCapabilities(jobs, emptyCap);
  assert.ok(emptyResult.errors.some(e => e.includes('capability 07') && e.includes('no delivering job')));

  const danglingCapYaml = [
    '- id: "08"',
    '  file: "08-SURFACES.md"',
    '  lanes: [S]',
    '  trigger: false',
    '  delivering_jobs: [B9-99]',
    '',
  ].join('\n');
  const { capabilities: danglingCap } = parseCapabilitiesFile(danglingCapYaml);
  const danglingResult = lintCapabilities(jobs, danglingCap);
  assert.ok(danglingResult.errors.some(e => e.includes('capability 08') && e.includes('unknown job "B9-99"')));

  // A trigger: true capability is allowed to deliver nothing yet — that is 14-BUILD-PLAN.md's
  // own "already a row in the register, marked trigger: instead of a week", not a gap.
  const triggerCapYaml = [
    '- id: "trigger-example"',
    '  description: "d"',
    '  trigger: true',
    '  delivering_jobs: []',
    '',
  ].join('\n');
  const { capabilities: triggerCap } = parseCapabilitiesFile(triggerCapYaml);
  assert.deepEqual(lintCapabilities(jobs, triggerCap).errors, []);

  // A missing build/capabilities.yml is an error (exit 1), not a skipped-with-a-warning check —
  // run the real CLI end to end against a real jobs.yml and a deliberately absent path.
  const result = spawnSync('node', ['lint-jobs.mjs', 'jobs.yml', '/does/not/exist/capabilities.yml'], { cwd: __dirname, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no capabilities file at .*cannot be checked/);
});

test('the real build/jobs.yml register and build/capabilities.yml both parse and pass with 0 errors, and row/capability counts match the plan', () => {
  const content = fs.readFileSync(path.join(__dirname, 'jobs.yml'), 'utf8');
  const { jobs, parseErrors } = parseJobsFile(content);
  assert.deepEqual(parseErrors, []);

  const { errors } = lintJobs(jobs);
  assert.deepEqual(errors, []);

  const perPhase = {};
  for (const j of jobs) perPhase[j.phase] = (perPhase[j.phase] || 0) + 1;
  assert.deepEqual(perPhase, { P0: 22, P1: 32, P2: 31, P3: 24, P4: 19, P5: 15 });
  assert.equal(jobs.length, 143);

  const capContent = fs.readFileSync(path.join(__dirname, 'capabilities.yml'), 'utf8');
  const { capabilities, parseErrors: capParseErrors } = parseCapabilitiesFile(capContent);
  assert.deepEqual(capParseErrors, []);
  // The ten destination files 14-BUILD-PLAN.md:67 names (03-09b, 16, 17) plus the six
  // "After Year 1 (triggered, never dropped)" rows from :436-444.
  assert.equal(capabilities.filter(c => !c.trigger).length, 10);
  assert.equal(capabilities.filter(c => c.trigger).length, 6);
  assert.deepEqual(lintCapabilities(jobs, capabilities).errors, []);
});
