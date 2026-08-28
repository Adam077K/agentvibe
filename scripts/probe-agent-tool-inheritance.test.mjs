// POSTURE: REPORTS. Hermetic, and NOT a step of `npm run check` — nothing on a runner runs it.
//
// scripts/probe-agent-tool-inheritance.test.mjs — the controls behind "a launched agent session
// gets its DECLARED tools".
//
// It launches a FAKE cli, never the real one, so it spends no model turn and needs no network.
// The reason it is out of the suite is written out in
// EXCLUDED['test:probe-agent-tool-inheritance'] in scripts/lib/check-suite.js; run it by hand with
// `npm run test:probe-agent-tool-inheritance`.
//
// WHY THIS FILE EXISTS
// The probe's headline result is an ABSENCE: no `Workflow` in the tool set a `claude --agent
// orchestrator` session advertises. An absence is the easiest result in this repo to get wrong,
// because "no Workflow" is byte-identical whether the session is contained, the `--agent` flag was
// ignored, the CLI never started, the init line changed shape, or the parser broke. The probe
// answers that with four controls it requires to fire before reporting anything. This file is what
// stops those controls from quietly becoming decorative — and every UNRESOLVED case below presents
// the probe with a subject bucket IDENTICAL to the CONTAINED case, which is the whole point.
//
// Every session here is fabricated. A test that launches the real `claude` passes or fails for
// reasons the test did not choose, costs a model turn per arm, and cannot produce the INHERITS
// case at all — the answer the repo most needs the probe to be capable of returning.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'probe-agent-tool-inheritance.mjs');
const FIXTURE_AGENT = 'probeagenttoolinheritance';

// The shape the real runtime returns, measured 2026-08-28 against claude 2.1.246 in this repo.
// Trimmed to its structure: the counts are what the arms actually came back with (41 / 5 / 2 / 3),
// the membership is exact for the tools the probe reads.
const REAL = {
  __baseline: ['Task', 'Bash', 'Edit', 'Read', 'Skill', 'WebFetch', 'WebSearch', 'Workflow', 'Write'],
  orchestrator: ['Read', 'Write', 'Edit', 'Bash', 'Task'],
  [FIXTURE_AGENT]: ['Read', 'Workflow'],
  'reviewer-readonly': ['Read', 'Glob', 'Grep'],
};

/**
 * A stand-in for the `claude` binary. It answers each arm from a scenario map keyed by the
 * `--agent` value (or `__baseline` when the flag is absent), and it emits the noise a real session
 * emits — hook lines and a non-JSON line — before the init line, so the parser is exercised on the
 * stream it will actually meet.
 *
 * Directives, in place of a tool array: __noinit (start, say nothing useful, exit 0) ·
 * __hang (never emit) · __exit (die with a message on stderr) · __notools (an init line whose
 * `tools` key is gone, i.e. the output shape changed under us).
 */
const FAKE_CLI = `
const args = process.argv.slice(2);
const i = args.indexOf('--agent');
const key = i === -1 ? '__baseline' : args[i + 1];
const scenario = JSON.parse(process.env.PROBE_FAKE)[key];
if (process.env.PROBE_ARGV_LOG) {
  require('fs').appendFileSync(process.env.PROBE_ARGV_LOG, JSON.stringify({ key, args }) + '\\n');
}
if (scenario === '__hang') { setInterval(() => {}, 1000); }
else if (scenario === '__exit') { process.stderr.write('fake cli refused to start'); process.exit(3); }
else {
  process.stdout.write(JSON.stringify({ type: 'system', subtype: 'hook_started', hook_name: 'SessionStart' }) + '\\n');
  process.stdout.write('not json at all\\n');
  if (scenario === '__noinit') { process.exit(0); }
  const init = { type: 'system', subtype: 'init', session_id: 'fake-' + key };
  if (scenario !== '__notools') { init.tools = scenario; }
  process.stdout.write(JSON.stringify(init) + '\\n');
  process.stdout.write(JSON.stringify({ type: 'result', subtype: 'success' }) + '\\n');
  setInterval(() => {}, 1000);
}
`;

// Each probe() run gets its own fake tree; they are removed together at exit rather than in a
// finally, because the probe SIGKILLs its children and a rm racing that can hit a live cwd.
const TEMPS = [];
process.on('exit', () => { for (const d of TEMPS) fs.rmSync(d, { recursive: true, force: true }); });

function makeFake() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-agent-tools-'));
  TEMPS.push(dir);
  const js = path.join(dir, 'fake-cli.cjs');
  const sh = path.join(dir, 'claude');
  fs.writeFileSync(js, FAKE_CLI);
  fs.writeFileSync(sh, `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(js)} "$@"\n`);
  fs.chmodSync(sh, 0o755);
  return { dir, cli: sh };
}

/** Returns the exit code alongside the report — the code is half of what this probe promises. */
function probe(scenarios, { cli, extraEnv = {}, argv = [] } = {}) {
  const fake = cli === null ? { dir: null, cli: path.join(os.tmpdir(), 'no-such-cli-' + process.pid) } : makeFake();
  const env = {
    ...process.env,
    AGENTVIBE_PROBE_CLI: fake.cli,
    AGENTVIBE_PROBE_TIMEOUT_MS: '4000',
    PROBE_FAKE: JSON.stringify(scenarios),
    ...extraEnv,
  };
  try {
    const stdout = execFileSync('node', [SCRIPT, '--json', ...argv], {
      cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env,
    });
    return { code: 0, report: JSON.parse(stdout), dir: fake.dir };
  } catch (e) {
    let report = null;
    try { report = JSON.parse((e.stdout || '').toString()); } catch { /* refusal before any report */ }
    return { code: e.status, report, stdout: (e.stdout || '').toString(), dir: fake.dir };
  }
}

/** `scenarios` overlaid on the measured real shape, so each test states only what it changes. */
const run = (overrides = {}, opts) => probe({ ...REAL, ...overrides }, opts);

test('CONTAINED requires all four controls to fire AND an empty subject bucket', () => {
  const { code, report } = run();
  assert.equal(code, 0);
  assert.equal(report.verdict, 'CONTAINED');
  assert.deepEqual(report.controls, {
    instrument_fired: true,
    subject_present_in_main_session: true,
    subject_observable_in_agent_session: true,
    agent_flag_honoured: true,
  });
  assert.equal(report.arms.subject.tools.includes('Workflow'), false);
  assert.match(report.note, /buys the lens and the playbook and NOT the gate/);
});

test('INHERITS is reachable — the fixture that defeats the conclusion, at its own exit code', () => {
  // If the probe cannot return this, its CONTAINED is worthless. A launched agent session that
  // carries Workflow settles the design question the other way, and exit 1 is that answer, not
  // a failure.
  const { code, report } = run({ orchestrator: ['Read', 'Write', 'Edit', 'Bash', 'Task', 'Workflow'] });
  assert.equal(code, 1);
  assert.equal(report.verdict, 'INHERITS');
  assert.equal(report.arms.subject.count, 6);
  assert.match(report.note, /buys the gate/);
});

test('an empty subject bucket the probe COULD NOT HAVE FILLED is UNRESOLVED, never CONTAINED', () => {
  // The heart of it. The subject arm here is byte-identical to the CONTAINED case; what differs is
  // that the fixture agent DECLARED Workflow and did not get it, so this runtime cannot show the
  // probe a Workflow in an agent session at all. Concluding containment from that is concluding
  // from an instrument that never moved.
  const { code, report } = run({ [FIXTURE_AGENT]: ['Read'] });
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.equal(report.arms.subject.tools.includes('Workflow'), false, 'identical to CONTAINED — that is the point');
  assert.equal(report.controls.subject_observable_in_agent_session, false);
  assert.match(report.note, /fixture control did not fire/);
});

test('a subject arm with no Read is UNRESOLVED — a zero beside a zero is not evidence', () => {
  const { code, report } = run({ orchestrator: ['Bash', 'Task'] });
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.equal(report.controls.instrument_fired, false);
  assert.match(report.note, /instrument did not fire/);
});

test('a subject arm advertising ZERO tools is UNRESOLVED, and the denominator says so', () => {
  const { code, report } = run({ orchestrator: [] });
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.equal(report.arms.subject.count, 0);
  assert.match(report.note, /advertised 0 tool\(s\)/);
});

test('a main session without Workflow is UNRESOLVED — the premise failed, not the measurement', () => {
  // "Does the agent session inherit Workflow" has no subject if the main session has none either.
  const { code, report } = run({ __baseline: ['Read', 'Bash', 'Write'] });
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.equal(report.controls.subject_present_in_main_session, false);
  assert.match(report.note, /has no subject/);
});

test('two agents with different declarations coming back identical is UNRESOLVED', () => {
  // The failure mode where --agent is silently ignored and every arm reports one fallback set.
  // Without this control that reads as a clean CONTAINED.
  const { code, report } = run({ 'reviewer-readonly': ['Read', 'Write', 'Edit', 'Bash', 'Task'] });
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.equal(report.controls.agent_flag_honoured, false);
  assert.match(report.note, /not being read/);
});

test('the arms are order-independent controls: a dead arm is UNRESOLVED whichever one it is', () => {
  for (const [key, arm] of Object.entries({
    __baseline: 'baseline', orchestrator: 'subject', [FIXTURE_AGENT]: 'fixture', 'reviewer-readonly': 'differential',
  })) {
    const { code, report } = run({ [key]: '__exit' });
    assert.equal(code, 2, `${arm} died and the probe did not report UNRESOLVED`);
    assert.equal(report.verdict, 'UNRESOLVED');
    assert.match(report.note, new RegExp(`arm "${arm}"`));
    assert.match(report.note, /exited 3 before emitting an init line/);
    assert.match(report.note, /fake cli refused to start/, 'the stderr tail is what makes it diagnosable');
  }
});

test('a CLI that cannot be launched at all is UNRESOLVED, not an absence of Workflow', () => {
  const { code, report } = probe(REAL, { cli: null });
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.match(report.note, /spawn-failed: ENOENT/);
  assert.match(report.note, /this is not an absence of Workflow/);
});

test('a session that starts and never says anything is UNRESOLVED — by timeout, with the bound named', () => {
  const started = Date.now();
  const { code, report } = run({ orchestrator: '__hang' });
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.match(report.note, /timeout after 4000ms with no init line/);
  assert.ok(Date.now() - started < 30_000, 'the timeout must bound the run, not decorate it');
});

test('a session that exits 0 having emitted no init line is UNRESOLVED', () => {
  const { code, report } = run({ orchestrator: '__noinit' });
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.match(report.note, /exited 0 before emitting an init line/);
});

test('an init line whose tools key is gone is UNRESOLVED — a shape change is not a containment', () => {
  const { code, report } = run({ orchestrator: '__notools' });
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.match(report.note, /no `tools` array/);
});

test('hook lines and non-JSON noise are skipped without derailing the read', () => {
  // Every fake arm emits a hook line and a bare non-JSON line before the init line, exactly as a
  // real session does. A throw there would turn stream noise into a verdict.
  const { code, report } = run();
  assert.equal(code, 0);
  assert.equal(report.arms.baseline.count, REAL.__baseline.length);
});

test('every arm reports its denominator, so a conclusion from 1 tool is visible as one', () => {
  const { report } = run();
  for (const [key, arm] of Object.entries(report.arms)) {
    assert.equal(typeof arm.count, 'number', `${key} reported no count`);
    assert.equal(arm.count, arm.tools.length);
    assert.equal(typeof arm.elapsed_ms, 'number');
  }
  assert.equal(report.arms.subject.count, 5);
  assert.equal(report.arms.baseline.count, REAL.__baseline.length);
});

test('the invocation is a real launched session, and the fixture arm really declares Workflow', () => {
  // "Only an actually-launched session counts" is a property of the ARGUMENTS, and nothing else in
  // this file would notice if the probe started reading the agent file instead.
  const log = path.join(os.tmpdir(), `probe-argv-${process.pid}-${Date.now()}.jsonl`);
  try {
    run({}, { extraEnv: { PROBE_ARGV_LOG: log } });
    const seen = fs.readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    assert.equal(seen.length, 4, 'four arms, four launches');
    for (const { args } of seen) {
      assert.ok(args.includes('--print'), 'a probe that does not launch is reading documentation');
      assert.deepEqual(args.slice(args.indexOf('--output-format'), args.indexOf('--output-format') + 2),
        ['--output-format', 'stream-json']);
      assert.ok(args.includes('--max-turns'), 'unbounded is not a shippable probe');
    }
    assert.equal(seen.filter((s) => s.key === '__baseline').length, 1, 'the baseline arm must pass no --agent');
    const fixture = seen.find((s) => s.key === FIXTURE_AGENT);
    const declared = JSON.parse(fixture.args[fixture.args.indexOf('--agents') + 1]);
    assert.deepEqual(declared[FIXTURE_AGENT].tools, ['Read', 'Workflow'],
      'the control arm must DECLARE the subject tool, or it controls for nothing');
  } finally {
    fs.rmSync(log, { force: true });
  }
});

test('--agent= and --differential= choose the arms, and the report names what it measured', () => {
  const { code, report } = run(
    { builder: ['Read', 'Write', 'Edit', 'Bash'], sourcer: ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch'] },
    { argv: ['--agent=builder', '--differential=sourcer'] },
  );
  assert.equal(code, 0);
  assert.equal(report.subject_agent, 'builder');
  assert.equal(report.differential_agent, 'sourcer');
  assert.equal(report.arms.subject.count, 4);
});

test('the three verdicts hold three distinct exit codes — UNRESOLVED is terminal, not an error', () => {
  const seen = new Map([
    ['CONTAINED', run().code],
    ['INHERITS', run({ orchestrator: ['Read', 'Workflow'] }).code],
    ['UNRESOLVED', run({ orchestrator: '__exit' }).code],
  ]);
  assert.deepEqual([...seen.entries()], [['CONTAINED', 0], ['INHERITS', 1], ['UNRESOLVED', 2]]);
  assert.equal(new Set(seen.values()).size, 3, 'two verdicts sharing an exit code is the collapse this probe refuses');
});
