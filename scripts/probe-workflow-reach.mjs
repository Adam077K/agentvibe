#!/usr/bin/env node
// POSTURE: REPORTS, and REFUSES rather than passing what it could not check. Read-only.
// Not wired to `npm run check` — the corpus it reads does not exist on a CI runner, and a step
// that is structurally unresolvable there would be a step that always reports the same thing.
//
// scripts/probe-workflow-reach.mjs — who can actually reach the binding QA gate.
//
// THE QUESTION THIS EXISTS TO ANSWER
// `.claude/workflows/qa.js` is the gate whose verdict binds. It runs under the `Workflow` tool.
// The repo has twice reasoned about who may invoke it and twice reached a conclusion by argument:
//
//   · `docs/08-agents_work/2026-08-13-rethink-board.md:46` — "zero engines declare `Workflow`",
//     remedy "Add `Workflow` to orchestrator tools". That remedy cannot work, and §1.1 of
//     CONTROL-PLANE.md says why: the orchestrator is not dispatched, it IS the session, so no
//     field in its frontmatter is read on the path it runs on.
//   · `CONTROL-PLANE.md §6 P2` — "Is `Workflow` available to subagents, or only to main
//     sessions?" left OPEN, with the probe named and never run.
//
// This runs the observational half of that probe. It is not the dispatch experiment P2 describes;
// it is the corpus evidence, which is available now and which the answer has to survive anyway.
//
// WHAT IT MEASURES
// Every `Workflow` tool_use in the transcript corpus, bucketed by `isSidechain` — true for a
// subagent turn, false for a main session. Containment holds when the subagent bucket is empty.
//
// WHY THE CONTROL IS NOT OPTIONAL, AND WHY AN ABSENCE ALONE IS REFUSED
// "Zero subagent Workflow calls" is byte-identical whether the tool is unreachable from a
// subagent, or the corpus holds no subagent turns, or the parser is broken, or the path was
// wrong. So the same scan counts CONTROL_TOOLS in the same bucket. If those are also zero the
// instrument did not fire and the run reports UNRESOLVED — never PASS. That is CLAUDE.md rule 10
// ("a resolver never passes what it could not check") applied to a measurement rather than to a
// resolver, and it is the failure mode this repo has been bitten by more than once: a check that
// passed because it was looking somewhere the answer was always yes.
//
// EXIT CODES
//   0  CONTAINED   — control fired, and no subagent reached `Workflow`.
//   1  BREACHED    — a subagent reached `Workflow`. That refutes the containment claim and
//                    settles P2 in the other direction; do not "fix" it by editing this script.
//   2  UNRESOLVED  — no corpus, or the control did not fire. Nothing is concluded.
//
// USAGE
//   node scripts/probe-workflow-reach.mjs
//   node scripts/probe-workflow-reach.mjs --json
//   AGENTVIBE_PROJECTS_DIR=/some/dir node scripts/probe-workflow-reach.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const U = require(path.join(path.dirname(fileURLToPath(import.meta.url)), 'lib', 'usage.js'));

const asJson = process.argv.includes('--json');
const SUBJECT = 'Workflow';

// The control must be a tool a subagent uses constantly, so that a zero in this bucket means the
// scan is broken rather than that subagents are idle. `Agent` is included deliberately: a
// subagent DISPATCHING is the closest neighbour to a subagent INVOKING, so if `Agent` appears in
// the sidechain bucket and `Workflow` does not, the difference is about the tool and not about
// what subagents are permitted to do in general.
const CONTROL_TOOLS = ['Bash', 'Read', 'Agent'];

const root = U.projectsDir();
const out = {
  subject: SUBJECT,
  corpus: root,
  files: 0,
  subject_main: 0,
  subject_subagent: 0,
  control: Object.fromEntries(CONTROL_TOOLS.map((t) => [t, { main: 0, subagent: 0 }])),
  control_fired: false,
  breaches: [],
  verdict: null,
};

function finish(verdict, code, note) {
  out.verdict = verdict;
  if (note) out.note = note;
  if (asJson) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`corpus: ${out.corpus}`);
    console.log(`files:  ${out.files}`);
    console.log('');
    console.log('tool'.padEnd(12) + 'subagent'.padEnd(12) + 'main session');
    console.log(`${SUBJECT}`.padEnd(12) + String(out.subject_subagent).padEnd(12) + out.subject_main);
    for (const t of CONTROL_TOOLS) {
      console.log(`${t} (ctrl)`.padEnd(12) + String(out.control[t].subagent).padEnd(12) + out.control[t].main);
    }
    console.log('');
    for (const b of out.breaches) console.log(`BREACH ${b.file}`);
    console.log(`${verdict}${note ? ` — ${note}` : ''}`);
  }
  process.exit(code);
}

if (!fs.existsSync(root)) {
  finish('UNRESOLVED', 2, `no transcript directory at ${root} — set AGENTVIBE_PROJECTS_DIR. Nothing is concluded.`);
}

const files = U.listTranscripts(root);
out.files = files.length;

for (const file of files) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  // Cheap prefilter: most transcripts hold none of these. Correctness does not depend on it —
  // every surviving line is still parsed as JSON below.
  if (!text.includes('"tool_use"')) continue;
  for (const line of text.split('\n')) {
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const content = o?.message?.content;
    if (!Array.isArray(content)) continue;
    const side = o.isSidechain === true;
    for (const block of content) {
      if (block?.type !== 'tool_use') continue;
      if (block.name === SUBJECT) {
        if (side) {
          out.subject_subagent++;
          out.breaches.push({ file, agentType: o.agentType ?? null, spawnDepth: o.spawnDepth ?? null });
        } else {
          out.subject_main++;
        }
      } else if (CONTROL_TOOLS.includes(block.name)) {
        out.control[block.name][side ? 'subagent' : 'main']++;
      }
    }
  }
}

out.control_fired = CONTROL_TOOLS.some((t) => out.control[t].subagent > 0);

if (!out.control_fired) {
  finish(
    'UNRESOLVED', 2,
    `the control did not fire: 0 subagent calls of ${CONTROL_TOOLS.join('/')} across ${out.files} file(s). ` +
    'A zero in the subject bucket therefore means nothing. Nothing is concluded.',
  );
}

if (out.subject_subagent > 0) {
  finish(
    'BREACHED', 1,
    `${out.subject_subagent} subagent ${SUBJECT} call(s) found — a subagent CAN reach the gate. ` +
    'This refutes c-workflow-invocation-contained and settles CONTROL-PLANE.md §6 P2 the other way.',
  );
}

finish(
  'CONTAINED', 0,
  `0 subagent ${SUBJECT} calls against ${out.subject_main} from main sessions, with the control firing. ` +
  'Only a main session — which is what the orchestrator is — has been observed reaching the gate.',
);
