#!/usr/bin/env node
// POSTURE: REPORTS, and REFUSES rather than passing what it could not check. Read-only.
//
// scripts/probe-agent-tool-inheritance.mjs — does `claude --agent <name>` inherit the main
// session's tools, or only the ones the agent file declares?
//
// THE QUESTION THIS EXISTS TO ANSWER
// `mission-control/scripts/consume-dispatch.ts` launches a dispatched goal with
// `execFileSync('claude', ['--print', goal])`. That session reaches no orchestrator, no playbook,
// no lens and no gate. Routing it through `--agent orchestrator` is available today and would buy
// the lens and the playbook. Whether it also buys the GATE depends on one runtime property that
// this repo had never measured: `.claude/workflows/qa.js` runs under the `Workflow` tool, the
// orchestrator's frontmatter declares `tools: [Read, Write, Edit, Bash, Glob, Grep, Task]`, and a
// main session's tool set DOES include `Workflow`. So:
//
//   INHERITS   — a `--agent` session carries the main-session set, `Workflow` among it.
//                Routing through the orchestrator buys the gate.
//   CONTAINED  — it carries only the declared set. Routing buys lens and playbook and NOT the
//                gate, WHILE LOOKING FROM THE OUTSIDE AS THOUGH IT HAD. That is the dangerous
//                answer, and it is the one this probe measures.
//   UNRESOLVED — could not be determined. A terminal value with its own exit code, never a
//                default and never an error dressed as an answer.
//
// This is the dispatch experiment CONTROL-PLANE.md section 6 P2 named and nobody ran, and the one
// PR #111 registered as unmeasured — "a dispatch probe, not a lint". It complements
// scripts/probe-workflow-reach.mjs, which reads the transcript corpus for who HAS reached the
// gate; this one launches sessions and reads what they are OFFERED.
//
// WHAT IT OBSERVES, STATED NARROWLY
// The `tools` array of the `{"type":"system","subtype":"init"}` line that a session emits under
// `--output-format stream-json --verbose`. That is the runtime's own declaration of the tool set
// the session is offered — not a model's self-report, not `--help`, not the agent file, and not
// documentation. A tool absent from that array cannot be called by that session.
//
// WHAT IT DOES NOT OBSERVE, NAMED RATHER THAN GLOSSED: a successful `Workflow` INVOCATION. The
// probe kills each child as soon as the init line arrives, so it never spends a model turn. An
// advertised tool that failed on use would read as INHERITS here. Closing that gap costs a full
// gated session per arm, which is not a thing to run on a runner; the seam is the fixture arm
// below, which already proves the advertised list responds to what the agent declares.
//
// THE FOUR ARMS, AND WHY THREE OF THEM ARE CONTROLS
//   subject       `--agent <orchestrator>`   the arm the answer comes from.
//   baseline      no `--agent` at all        the main-session set. If `Workflow` is not here, the
//                                            question's premise is false and nothing is concluded.
//   fixture       `--agents '{...}'` naming a throwaway agent that declares [Read, Workflow].
//                                            THE CONTROL THAT MATTERS. "No Workflow in the subject
//                                            arm" is byte-identical whether a `--agent` session
//                                            cannot carry `Workflow` at all, or the parser broke,
//                                            or the flag was ignored. This arm makes the
//                                            instrument produce the non-zero it would need to.
//   differential  `--agent <reviewer-readonly>`  a DIFFERENT declared set. If the subject and
//                                            differential arms come back identical, `--agent` is
//                                            not being read and both numbers are one fallback.
//
// Every control must fire before any verdict is reported. That is CLAUDE.md rule 10 — a resolver
// never passes what it could not check — applied to a measurement rather than to a resolver.
//
// EXIT CODES
//   0  CONTAINED   — controls fired; the subject arm has no `Workflow`.
//   1  INHERITS    — the subject arm HAS `Workflow`. Not an error: it is the other answer, and it
//                    would mean routing dispatch through `--agent orchestrator` reaches the gate.
//   2  UNRESOLVED  — an arm could not be launched, or a control did not fire. Nothing concluded.
//
// USAGE
//   node scripts/probe-agent-tool-inheritance.mjs
//   node scripts/probe-agent-tool-inheritance.mjs --json
//   node scripts/probe-agent-tool-inheritance.mjs --agent=builder --differential=sourcer
//   AGENTVIBE_PROBE_CLI=/path/to/claude AGENTVIBE_PROBE_TIMEOUT_MS=30000 node scripts/...

import { spawn } from 'node:child_process';

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const flag = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const SUBJECT_TOOL = 'Workflow';
// The tool that proves the instrument moved. Every engine in this repo declares `Read`, and a
// session advertising zero tools is the shape a broken parse takes.
const CONTROL_TOOL = 'Read';

const SUBJECT_AGENT = flag('agent', 'orchestrator');
const DIFFERENTIAL_AGENT = flag('differential', 'reviewer-readonly');
const CLI = process.env.AGENTVIBE_PROBE_CLI || 'claude';
const TIMEOUT_MS = Number(process.env.AGENTVIBE_PROBE_TIMEOUT_MS || 120000);
// Named so that a stray one in a transcript is recognisable as this probe's, not a real agent.
const FIXTURE_AGENT = 'probeagenttoolinheritance';
const FIXTURE_DEFINITION = {
  [FIXTURE_AGENT]: {
    description: 'throwaway control agent for scripts/probe-agent-tool-inheritance.mjs',
    prompt: 'You are a probe fixture. Do nothing.',
    tools: [CONTROL_TOOL, SUBJECT_TOOL],
  },
};

// The prompt is never answered — the child is killed at the init line, before a turn is spent.
const PROMPT = 'probe: no reply needed';
const COMMON = ['--print', '--output-format', 'stream-json', '--verbose', '--max-turns', '1'];

const ARMS = [
  { key: 'baseline', args: [...COMMON, PROMPT], what: 'no --agent — the main-session tool set' },
  { key: 'subject', args: ['--agent', SUBJECT_AGENT, ...COMMON, PROMPT], what: `--agent ${SUBJECT_AGENT}` },
  {
    key: 'fixture',
    args: ['--agents', JSON.stringify(FIXTURE_DEFINITION), '--agent', FIXTURE_AGENT, ...COMMON, PROMPT],
    what: `--agent ${FIXTURE_AGENT}, declaring [${CONTROL_TOOL}, ${SUBJECT_TOOL}]`,
  },
  {
    key: 'differential',
    args: ['--agent', DIFFERENTIAL_AGENT, ...COMMON, PROMPT],
    what: `--agent ${DIFFERENTIAL_AGENT}`,
  },
];

/**
 * Launch one arm and return the tool set the runtime advertises at init.
 *
 * Resolves — it never rejects. Every failure mode carries a distinct `reason` string, because
 * "could not launch", "launched and said nothing" and "launched and offered no Workflow" are
 * three different facts, and collapsing them is how a probe comes to conclude from silence.
 */
function runArm(arm) {
  return new Promise((resolve) => {
    const started = Date.now();
    let child;
    try {
      child = spawn(CLI, arm.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      resolve({ ...arm, ok: false, reason: `spawn-failed: ${e.code || e.message}` });
      return;
    }

    let buf = '';
    let stderr = '';
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { child.kill('SIGKILL'); } catch { /* already gone */ }
      resolve({ ...arm, elapsed_ms: Date.now() - started, ...result });
    };

    const timer = setTimeout(
      () => done({ ok: false, reason: `timeout after ${TIMEOUT_MS}ms with no init line` }),
      TIMEOUT_MS,
    );

    child.stdout.on('data', (d) => {
      buf += d;
      let nl;
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (!line.trim()) continue;
        let o;
        // Hook lines, partial writes and non-JSON noise all land here. A throw would turn a
        // malformed line into a conclusion about the runtime.
        try { o = JSON.parse(line); } catch { continue; }
        if (o?.type !== 'system' || o?.subtype !== 'init') continue;
        if (!Array.isArray(o.tools)) {
          done({ ok: false, reason: 'init line carried no `tools` array — the shape changed' });
          return;
        }
        done({ ok: true, tools: o.tools, count: o.tools.length, session_id: o.session_id ?? null });
        return;
      }
    });

    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (e) => done({ ok: false, reason: `spawn-failed: ${e.code || e.message}` }));
    child.on('close', (code) =>
      done({
        ok: false,
        reason:
          `exited ${code} before emitting an init line` +
          (stderr.trim() ? ` — stderr: ${stderr.trim().slice(0, 200)}` : ''),
      }));
  });
}

const sameSet = (a, b) => a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ');

const out = {
  subject_tool: SUBJECT_TOOL,
  control_tool: CONTROL_TOOL,
  cli: CLI,
  subject_agent: SUBJECT_AGENT,
  differential_agent: DIFFERENTIAL_AGENT,
  arms: {},
  controls: {},
  verdict: null,
};

function finish(verdict, code, note) {
  out.verdict = verdict;
  out.note = note;
  if (asJson) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`cli: ${out.cli}`);
    console.log('');
    console.log(
      'arm'.padEnd(14) + 'tools'.padEnd(8) + CONTROL_TOOL.padEnd(7) + SUBJECT_TOOL.padEnd(10) + 'invocation',
    );
    for (const arm of ARMS) {
      const a = out.arms[arm.key];
      if (!a) { console.log(arm.key.padEnd(14) + '(not run)'); continue; }
      const has = (t) => (a.tools.includes(t) ? 'yes' : 'no');
      const cells = a.ok
        ? String(a.count).padEnd(8) + has(CONTROL_TOOL).padEnd(7) + has(SUBJECT_TOOL).padEnd(10)
        : '?'.padEnd(8) + '?'.padEnd(7) + '?'.padEnd(10);
      console.log(arm.key.padEnd(14) + cells + arm.what + (a.ok ? '' : ` [${a.reason}]`));
    }
    const s = out.arms.subject;
    if (s?.ok) {
      console.log('');
      console.log(`${SUBJECT_AGENT} observed: ${s.tools.join(' ')}`);
    }
    console.log('');
    console.log(`${verdict} — ${note}`);
  }
  process.exit(code);
}

for (const arm of ARMS) {
  const r = await runArm(arm);
  const { args, ...rest } = r;
  out.arms[arm.key] = rest;
  // Every arm is load-bearing: three of the four ARE the controls, so a dead arm makes the run
  // unresolvable rather than partial.
  if (!r.ok) {
    finish(
      'UNRESOLVED', 2,
      `arm "${arm.key}" (${arm.what}) could not be measured: ${r.reason}. ` +
      `Nothing is concluded — this is not an absence of ${SUBJECT_TOOL}.`,
    );
  }
}

const A = out.arms;
out.controls = {
  instrument_fired: A.subject.count > 0 && A.subject.tools.includes(CONTROL_TOOL),
  subject_present_in_main_session: A.baseline.tools.includes(SUBJECT_TOOL),
  subject_observable_in_agent_session: A.fixture.tools.includes(SUBJECT_TOOL),
  agent_flag_honoured: !sameSet(A.subject.tools, A.differential.tools),
};

if (!out.controls.instrument_fired) {
  finish(
    'UNRESOLVED', 2,
    `the instrument did not fire: the subject arm advertised ${A.subject.count} tool(s) and ` +
    `${CONTROL_TOOL} was not among them. A missing ${SUBJECT_TOOL} in a session where a ` +
    'certainly-present tool is also missing is not evidence of anything.',
  );
}

if (!out.controls.subject_present_in_main_session) {
  finish(
    'UNRESOLVED', 2,
    `${SUBJECT_TOOL} is absent from the main session's own ${A.baseline.count}-tool set, so the question ` +
    '"does an agent session inherit it" has no subject. The premise failed, not the measurement.',
  );
}

if (!out.controls.subject_observable_in_agent_session) {
  finish(
    'UNRESOLVED', 2,
    `the fixture control did not fire: an agent declaring [${CONTROL_TOOL}, ${SUBJECT_TOOL}] came back ` +
    `with ${A.fixture.count} tool(s) and no ${SUBJECT_TOOL}. This probe therefore cannot observe ` +
    `${SUBJECT_TOOL} in a --agent session at all, and the subject arm's empty bucket means nothing.`,
  );
}

if (!out.controls.agent_flag_honoured) {
  finish(
    'UNRESOLVED', 2,
    `the subject arm (--agent ${SUBJECT_AGENT}) and the differential arm (--agent ${DIFFERENTIAL_AGENT}) ` +
    `advertised the SAME ${A.subject.count} tools. Two agents with different declared sets cannot both ` +
    'be right, so --agent is not being read and both readings are one fallback.',
  );
}

if (A.subject.tools.includes(SUBJECT_TOOL)) {
  finish(
    'INHERITS', 1,
    `--agent ${SUBJECT_AGENT} advertised ${SUBJECT_TOOL} among its ${A.subject.count} tools. A launched ` +
    'agent session reaches the gate, so routing dispatch through the orchestrator buys the gate as well ' +
    'as the lens and the playbook.',
  );
}

finish(
  'CONTAINED', 0,
  `--agent ${SUBJECT_AGENT} advertised ${A.subject.count} tools and ${SUBJECT_TOOL} was not among them, ` +
  `against ${A.baseline.count} in the main session — with the fixture control proving a --agent session ` +
  `CAN carry ${SUBJECT_TOOL} when it declares it (${A.fixture.count} tools), and the differential arm ` +
  'proving the flag is read. A launched agent session gets its DECLARED tools. Routing dispatch through ' +
  '--agent orchestrator buys the lens and the playbook and NOT the gate.',
);
