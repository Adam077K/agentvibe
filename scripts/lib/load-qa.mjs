// POSTURE: TEST HARNESS. Not a check. It compiles the gate so tests can OBSERVE it rather than
// read it, and it belongs to no single test file.
//
// scripts/lib/load-qa.mjs — the one way to execute `.claude/workflows/qa.js` outside the runtime.
//
// EXTRACTED 2026-08-26 from scripts/run-gate.test.mjs, which is where it was written and where it
// was the only copy.
//
// **IT HAS EXACTLY ONE IMPORTER TODAY — `scripts/run-gate.test.mjs`.** The extraction is a
// PRECAUTION, stated as intent rather than as a fact about a second caller that does not exist:
// the refusal tests that prompted it were ultimately merged into that same file rather than given
// one of their own, so the second importer was never landed and is not in the tree. An earlier
// version of this comment said "a second test file needed it … and both import it", which was
// true of the plan and false of the commit — the defect class this whole branch is about.
//
// WHY EXTRACT IT ANYWAY: this repository has twice paid for two implementations of one contract.
// The verdict arithmetic lived in both `lib/gate-logic.mjs` and inline in qa.js, drifted, and
// `npm run test:gate` stayed green while certifying a fail-open. A harness is the same shape of
// hazard one level down — two harnesses that compile the gate slightly differently disagree about
// what the gate does, and neither test file can see the other's version. Whoever writes the second
// consumer imports this instead of copying it, which is the whole point.
//
// WHY COMPILATION IS NEEDED AT ALL. qa.js `export`s its `meta` and then `return`s from the top
// level, which is neither valid ESM nor valid CJS — `import()` and `vm.Script` both refuse it.
// Every other checker in this repo therefore reads it as TEXT (scripts/check-dispatch-agenttype.mjs
// says so in its own header). Text is enough to see that a string changed. It is not enough to see
// that a REFUSAL happens before any agent is dispatched, which is precisely the property that
// distinguishes a gate that refused from a gate that reviewed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Compile `.claude/workflows/qa.js` into a callable, the way the Workflow runtime does.
 *
 * Stripping the one `export` keyword and wrapping the rest in an AsyncFunction gives the same
 * closure the runtime gives it, with the injected globals as named parameters.
 */
export function loadQa(repo = REPO) {
  const src = fs.readFileSync(path.join(repo, '.claude', 'workflows', 'qa.js'), 'utf8');
  const body = src.replace(/^export\s+const\s+meta\s*=/m, 'const meta =');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  return new AsyncFunction('agent', 'parallel', 'phase', 'log', 'args', 'budget', body);
}

/**
 * Run qa.js against a stubbed panel. Returns the verdict object, every dispatch label in order,
 * and the oracle's prompt and schema — so "no agent ran" is OBSERVED rather than asserted.
 *
 * `dispatched` is the load-bearing return value for the refusal tests: a gate that refused its
 * arguments dispatches nothing, and a gate that reviewed the diff dispatches a panel. That
 * difference is a fact about control flow, not a string in a summary.
 */
export async function runQa(qaArgs, oracleReply, reviewFindings, repo = REPO) {
  const dispatched = [];
  let oraclePrompt = null;
  let oracleSchema = null;
  const agent = async (prompt, opts) => {
    dispatched.push(opts.label);
    const label = String(opts.label);
    if (label.startsWith('oracle')) { oraclePrompt = prompt; oracleSchema = opts.schema; return oracleReply; }
    if (label.startsWith('review') || label.startsWith('sweep')) return { findings: reviewFindings || [] };
    if (label.startsWith('judge')) return { verdict: 'PASS', summary: 'clean', blockers: [] };
    return null;
  };
  const logs = [];
  const out = await loadQa(repo)(
    agent,
    (fns) => Promise.all(fns.map((f) => f())),
    () => {},
    (m) => logs.push(m),
    qaArgs,
    undefined,
  );
  return { out, dispatched, oraclePrompt, oracleSchema, logs };
}
