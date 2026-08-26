#!/usr/bin/env node
// POSTURE: LIBRARY + ENTRY POINT. The blocking assertion is in `scripts/gates.test.mjs`, which
// runs as `npm run test:playbooks` — a STEP of `npm run check` with its own step in
// `.github/workflows/ci.yml`. This file is where the predicate lives so it has an
// implementation rather than living only inside a test, and it is runnable by hand
// (`npm run gates`) so a contributor can see the findings without running the suite. That is the
// same arrangement `scripts/lib/check-suite.js` documents for `check:ci-chains`, and it is
// deliberate: ONE place computes the answer, one step fails the build on it.
//
// scripts/check-gates.mjs — make a playbook's `gate:` resolve to something, and make its
// triggers reach a command that exists.
//
// ── THE TWO DEFECTS THIS CLOSES, both measured at 244e8db on 2026-08-26 ──────────────────────
//
// 1. `gate:` WAS A SPELLING ALLOWLIST. `.claude/hooks/schema-lint.js` refused any `gate:` value
//    outside a four-name array and that was the whole mechanism. The three names in use appear
//    seven times across the six playbooks; grepping them under `scripts/` and
//    `.claude/workflows/` returns the array and two test fixtures. Nothing executed. A stage
//    could declare `gate: qa-verdict`, exit having run nothing, and every check stayed green.
//
// 2. `triggers:` WAS DECORATION. One playbook of six carried the key — `ship-feature`, as
//    `["/build", "/fix"]` — and `grep -rn triggers scripts .claude` found no reader anywhere.
//    It also disagreed with the tree it described: `.claude/commands/ship.md` declares
//    `playbook: ship-feature` in its frontmatter and `/ship` was not in that list. Two
//    statements about one relation, disagreeing, with nothing to notice.
//
// The remedy for both is the same and it is not "add a key": a reference is worth having only
// when something fails on it. Every finding below fails `npm run check`.
//
// ── WHY THE GATE KINDS ARE DATA ──────────────────────────────────────────────────────────────
// `founder-approval` and `outbound-approval` are human stops. They are not scripts and must not
// be faked into one — a process that reports PASS for "a human approved" has invented the
// approval. But "a human must approve" and "nothing implements this" were the same string in the
// same array, so the two were indistinguishable to any reader and to every checker. `kind:` in
// `.claude/gates.yml` makes them different values, and this file refuses a `human` gate that
// carries a `run:`.
//
// Resolving a human gate returns `unresolved`, never `pass`. That is Rule 10 in CLAUDE.md — a
// resolver never passes what it could not check — and `scripts/gates.test.mjs` pins it.
//
// ── USAGE ────────────────────────────────────────────────────────────────────────────────────
//   node scripts/check-gates.mjs                       # every finding; exit 1 if any
//   node scripts/check-gates.mjs check --json
//   node scripts/check-gates.mjs resolve qa-verdict    # actually run the gate
//   node scripts/check-gates.mjs resolve qa-verdict -- --ref origin/main...HEAD
//
// `resolve` exit codes, which are NOT the exit codes of the command it ran:
//   0  pass         the gate's command exited 0
//   1  fail         the gate's command exited 1
//   3  unresolved   a human stop, a spawn failure, a signal, or any other exit code
//
// Three is a distinct code on purpose. Folding `unresolved` into `fail` would be safe and folding
// it into `pass` would not, but a caller that cannot tell them apart cannot report which happened,
// and "the gate said no" and "the gate could not be asked" take different remedies.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const { parseYamlSubset } = require('./lib/claims.js');
const { REASON_MIN_LENGTH, hasSubstantiveReason } = require('./lib/check-suite.js');

export const GATES_PATH = path.join('.claude', 'gates.yml');
export const PLAYBOOK_DIR = path.join('.claude', 'playbooks');
export const COMMAND_DIR = path.join('.claude', 'commands');

export const KINDS = ['command', 'human'];

/** Fields only a `command` gate may carry, and fields only a `human` gate may carry. */
const COMMAND_ONLY = ['run', 'pass_when', 'fail_when', 'recording_hazard', 'how_to_run_it'];
const HUMAN_ONLY = ['decided_by', 'recorded_in', 'why_not_a_command'];

/**
 * A `run:` reaches spawnSync as argv with no shell, so there is no shell to inject into. This
 * refuses the characters anyway, because the value comes from a repository data file that a
 * future reader will assume is a shell command — someone will eventually route it through one,
 * and a value that never had a metacharacter in it survives that day.
 */
const SHELL_METACHARACTERS = /[;|&`$()<>\\'"\n\r*?[\]{}~#]/;

const TRIGGER_RE = /^\/[a-z][a-z0-9-]*$/;

// ── Loading ──────────────────────────────────────────────────────────────────────────────────

export function loadGates(repoRoot = REPO_ROOT) {
  const abs = path.join(repoRoot, GATES_PATH);
  const doc = parseYamlSubset(fs.readFileSync(abs, 'utf8'));
  if (!doc || !Array.isArray(doc.gates)) {
    throw new Error(`${GATES_PATH}: expected a top-level "gates:" list`);
  }
  return doc.gates;
}

export function loadPlaybooks(repoRoot = REPO_ROOT) {
  const dir = path.join(repoRoot, PLAYBOOK_DIR);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.yml')).sort().map((f) => ({
    file: `${PLAYBOOK_DIR}/${f}`,
    id: path.basename(f, '.yml'),
    doc: parseYamlSubset(fs.readFileSync(path.join(dir, f), 'utf8')),
  }));
}

/**
 * Frontmatter only, and only the keys this checker uses. A command file is markdown; parsing its
 * body would make an unrelated code fence able to fail the build.
 */
export function loadCommands(repoRoot = REPO_ROOT) {
  const dir = path.join(repoRoot, COMMAND_DIR);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = text.match(/^---\n([\s\S]*?)\n---/);
    let fm = {};
    if (m) {
      try {
        fm = parseYamlSubset(m[1]) || {};
      } catch (e) {
        fm = { __error: e.message };
      }
    }
    return { file: `${COMMAND_DIR}/${f}`, name: `/${path.basename(f, '.md')}`, fm };
  });
}

// ── The predicate ────────────────────────────────────────────────────────────────────────────

/**
 * Every finding, computed from values rather than from the filesystem.
 *
 * Pure on purpose: `scripts/gates.test.mjs` constructs the inputs that DEFEAT each rule and
 * asserts the rule fires, without writing a fixture into `.claude/`. A fixture built by writing
 * into the tree the checker reads is a fixture that cannot run in parallel and, under the armed
 * sandbox, sometimes cannot run at all.
 *
 * @param {object[]} gates       parsed `.claude/gates.yml` entries
 * @param {object[]} playbooks   [{ file, id, doc }]
 * @param {object[]} commands    [{ file, name, fm }]
 * @param {string[]} lintGates   the GATES array exported by .claude/hooks/schema-lint.js
 * @param {(p: string) => boolean} exists  resolves a repo-relative path
 */
export function wiringFindings({ gates, playbooks, commands, lintGates, exists }) {
  const findings = [];
  const F = (s) => findings.push(s);

  // ── gates.yml is well formed ──────────────────────────────────────────────
  const byId = new Map();
  for (const [i, g] of gates.entries()) {
    const at = `${GATES_PATH} gates[${i}]`;
    if (!g || typeof g !== 'object') { F(`${at}: not a mapping`); continue; }
    if (typeof g.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(g.id)) {
      F(`${at}: id must be kebab-case, got ${JSON.stringify(g.id)}`);
      continue;
    }
    if (byId.has(g.id)) { F(`${at}: duplicate gate id "${g.id}"`); continue; }
    byId.set(g.id, g);

    const where = `${GATES_PATH} ${g.id}`;
    if (!KINDS.includes(g.kind)) {
      F(`${where}: kind ${JSON.stringify(g.kind)} is not one of (${KINDS.join(', ')}) — a gate is either something a process runs or something a person decides, and a gate that is neither is the defect this file exists to end`);
      continue;
    }
    if (typeof g.summary !== 'string' || g.summary.trim().length < 20) {
      F(`${where}: summary must state what passing this gate asserts`);
    }

    const forbidden = g.kind === 'human' ? COMMAND_ONLY : HUMAN_ONLY;
    for (const k of forbidden) {
      if (g[k] !== undefined) {
        // `run` gets its own sentence. The others describe a command gate too, but only `run`
        // would actually make a process answer a question a person has to answer, and a message
        // that overstates what a key does is a message the next reader stops believing.
        F(g.kind === 'human'
          ? (k === 'run'
            ? `${where}: kind "human" carries "run" — a human stop may not be faked into a script. Change the kind, or delete the key`
            : `${where}: kind "human" carries "${k}", which describes how a COMMAND gate is run and recorded. A human gate has no exit code to describe`)
          : `${where}: kind "command" carries "${k}", which describes a human decision. A command gate is resolved by its exit code`);
      }
    }

    if (g.kind === 'command') {
      findings.push(...runFindings(where, g.run, exists));
    } else {
      for (const k of ['decided_by', 'recorded_in']) {
        if (typeof g[k] !== 'string' || g[k].trim().length < 4) {
          F(`${where}: kind "human" needs "${k}" — an approval with no named approver and no place it is written down is not checkable by anyone, including a human`);
        }
      }
    }
  }

  // ── every gate a playbook names is declared, and every declared gate is used ──
  const used = new Map(); // gate id -> ["file stage", ...]
  for (const { file, doc } of playbooks) {
    for (const s of (doc?.stages || [])) {
      if (s?.gate === undefined) continue;
      const at = `${file} ${s.id}`;
      if (!byId.has(s.gate)) {
        F(`${at}: gate "${s.gate}" is not declared in ${GATES_PATH} — it resolves to nothing`);
        continue;
      }
      if (!used.has(s.gate)) used.set(s.gate, []);
      used.get(s.gate).push(at);
    }
  }
  for (const [id, g] of byId) {
    if (used.has(id)) {
      if (g.unused_reason !== undefined) {
        F(`${GATES_PATH} ${id}: carries "unused_reason" but ${used.get(id).length} stage(s) name it (${used.get(id)[0]}). Delete the reason — an exemption that has stopped being true reads as governance and is not`);
      }
      continue;
    }
    if (!hasSubstantiveReason(g.unused_reason)) {
      F(`${GATES_PATH} ${id}: no playbook stage names this gate, and "unused_reason" is missing or shorter than ${REASON_MIN_LENGTH} characters. Name it from a stage, delete it, or write the reason it survives unused`);
    }
  }

  // ── the schema-lint allowlist and this file agree ──────────────────────────
  //
  // `.claude/hooks/schema-lint.js` is irreversible tier and is deliberately not edited to read
  // this file. That leaves two lists of one thing, which this repository has repeatedly found
  // disagree silently — so the disagreement is made loud instead, in both directions. Same
  // treatment `package.json` gets from `scripts/lib/check-suite.js`.
  const declared = new Set(byId.keys());
  for (const id of lintGates) {
    if (!declared.has(id)) {
      F(`.claude/hooks/schema-lint.js GATES names "${id}", which ${GATES_PATH} does not declare. A stage may spell it and nothing will resolve it`);
    }
  }
  for (const id of declared) {
    if (!lintGates.includes(id)) {
      F(`${GATES_PATH} declares "${id}", which .claude/hooks/schema-lint.js GATES does not allow. A stage naming it fails lint:agents before this checker is ever reached`);
    }
  }

  // ── triggers ↔ commands, in both directions ───────────────────────────────
  const commandByName = new Map(commands.map((c) => [c.name, c]));
  const playbookById = new Map(playbooks.map((p) => [p.id, p]));
  const claimedBy = new Map(); // trigger -> playbook id

  for (const { file, id, doc } of playbooks) {
    const triggers = doc?.triggers;
    if (!Array.isArray(triggers) || triggers.length === 0) {
      F(`${file}: no "triggers" — a playbook nothing invokes is a document. List the slash commands that run it`);
      continue;
    }
    for (const t of triggers) {
      if (typeof t !== 'string' || !TRIGGER_RE.test(t)) {
        F(`${file}: trigger ${JSON.stringify(t)} is not a slash command of the form "/name"`);
        continue;
      }
      if (claimedBy.has(t)) {
        F(`${file}: trigger "${t}" is also a trigger of ${claimedBy.get(t)} — one command runs one playbook, or the command is ambiguous at the moment somebody types it`);
        continue;
      }
      claimedBy.set(t, id);
      const cmd = commandByName.get(t);
      if (!cmd) {
        F(`${file}: trigger "${t}" names ${COMMAND_DIR}/${t.slice(1)}.md, which does not exist`);
        continue;
      }
      if (cmd.fm.playbook !== id) {
        F(`${cmd.file}: frontmatter says playbook ${JSON.stringify(cmd.fm.playbook ?? null)}, but ${file} lists "${t}" as its trigger. The two directions of one relation disagree`);
      }
    }
  }

  for (const c of commands) {
    if (c.fm.__error) {
      F(`${c.file}: frontmatter does not parse — ${c.fm.__error}`);
      continue;
    }
    if (c.fm.playbook === undefined) continue; // /color, /name, /daily … invoke no playbook
    const pb = playbookById.get(c.fm.playbook);
    if (!pb) {
      F(`${c.file}: names playbook "${c.fm.playbook}", which does not exist in ${PLAYBOOK_DIR}/`);
      continue;
    }
    if (!(pb.doc?.triggers || []).includes(c.name)) {
      F(`${pb.file}: triggers omit "${c.name}", but ${c.file} declares it runs this playbook`);
    }
    // ── enter_at / stop_after ────────────────────────────────────────────────
    //
    // `stop_after` exists because `/review` and `/ship` carried BYTE-IDENTICAL frontmatter
    // (`playbook: ship-feature`, `enter_at: review`) while `/review`'s prose said the two differ in
    // where they STOP. The schema had a key for where a command enters and none for where it
    // leaves, so the whole distinction between "judge this diff" and "judge it and then merge it"
    // lived in a sentence nothing checked. Two commands that read as one command is how somebody
    // ships by typing the one that was supposed to only look.
    const stages = (pb.doc?.stages || []).map((s) => s.id);
    for (const k of ['enter_at', 'stop_after']) {
      if (c.fm[k] !== undefined && !stages.includes(c.fm[k])) {
        F(`${c.file}: ${k} "${c.fm[k]}" is not a stage of ${pb.file} (${stages.join(', ')})`);
      }
    }
    if (c.fm.enter_at !== undefined && c.fm.stop_after !== undefined) {
      const from = stages.indexOf(c.fm.enter_at);
      const to = stages.indexOf(c.fm.stop_after);
      if (from >= 0 && to >= 0 && to < from) {
        F(`${c.file}: stop_after "${c.fm.stop_after}" comes before enter_at "${c.fm.enter_at}" in ${pb.file} — that is an empty range, and a command that runs no stage is not a command`);
      }
    }
  }

  return findings;
}

/** The `run:` of a command gate: present, shell-free, and pointing at a file that exists. */
function runFindings(where, run, exists) {
  const out = [];
  if (typeof run !== 'string' || run.trim() === '') {
    return [`${where}: kind "command" needs "run" — the command whose exit code IS the gate`];
  }
  if (SHELL_METACHARACTERS.test(run)) {
    return [`${where}: run ${JSON.stringify(run)} carries a shell metacharacter. This is spawned as argv with no shell, so a pipeline or a redirect would be passed to node as a literal argument and the gate would resolve on the wrong thing`];
  }
  const argv = run.trim().split(/\s+/);
  if (argv[0] !== 'node') {
    out.push(`${where}: run must start with "node" — a gate resolved by an arbitrary interpreter is a gate whose behaviour depends on what is installed`);
  }
  const script = argv[1];
  if (!script || !script.startsWith('scripts/') || script.includes('..')) {
    out.push(`${where}: run must name a script under scripts/, got ${JSON.stringify(script ?? null)}`);
  } else if (!exists(script)) {
    out.push(`${where}: run names ${script}, which does not exist — the gate resolves to nothing`);
  }
  return out;
}

// ── Resolution ───────────────────────────────────────────────────────────────────────────────

/**
 * Run one gate and say what happened.
 *
 * `human` is `unresolved` and never `pass`. That is not a limitation being worked around: it is
 * the answer. The caller learns that a person has to act, which is a different fact from "the
 * check failed" and from "the check passed".
 */
export function resolveGate(gate, { repoRoot = REPO_ROOT, extraArgs = [], spawn = spawnSync } = {}) {
  if (!gate) return { status: 'unresolved', reason: 'no-such-gate' };
  if (gate.kind === 'human') {
    return {
      id: gate.id,
      kind: 'human',
      status: 'unresolved',
      reason: 'human-stop',
      decided_by: gate.decided_by ?? null,
      recorded_in: gate.recorded_in ?? null,
    };
  }
  if (gate.kind !== 'command') {
    return { id: gate.id, kind: gate.kind ?? null, status: 'unresolved', reason: 'unknown-kind' };
  }

  const argv = String(gate.run).trim().split(/\s+/);
  const r = spawn(argv[0], [...argv.slice(1), ...extraArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const base = {
    id: gate.id,
    kind: 'command',
    command: [...argv, ...extraArgs].join(' '),
    exit: r.status,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim(),
  };
  if (r.error) return { ...base, status: 'unresolved', reason: `spawn-failed: ${r.error.message}` };
  if (r.signal) return { ...base, status: 'unresolved', reason: `killed by ${r.signal}` };
  if (r.status === 0) return { ...base, status: 'pass', reason: 'exit-0' };
  if (r.status === 1) return { ...base, status: 'fail', reason: 'exit-1' };
  return { ...base, status: 'unresolved', reason: `exit-${r.status}` };
}

export const EXIT_FOR_STATUS = { pass: 0, fail: 1, unresolved: 3 };

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────

export function realTree(repoRoot = REPO_ROOT) {
  return {
    gates: loadGates(repoRoot),
    playbooks: loadPlaybooks(repoRoot),
    commands: loadCommands(repoRoot),
    lintGates: require(path.join(repoRoot, '.claude', 'hooks', 'schema-lint.js')).GATES,
    exists: (p) => fs.existsSync(path.join(repoRoot, p)),
  };
}

function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const cmd = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'check';

  if (cmd === 'resolve') {
    const id = argv[1];
    if (!id || id.startsWith('--')) {
      process.stderr.write('usage: check-gates.mjs resolve <gate-id> [--json] [-- extra args…]\n');
      return 2;
    }
    const dd = argv.indexOf('--');
    const extraArgs = dd === -1 ? [] : argv.slice(dd + 1);
    const gate = loadGates().find((g) => g.id === id);
    if (!gate) {
      process.stderr.write(`check-gates: no gate "${id}" in ${GATES_PATH}\n`);
      return 2;
    }
    const r = resolveGate(gate, { extraArgs });
    if (asJson) {
      process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
    } else if (r.status === 'pass') {
      process.stdout.write(`PASS   ${id} — ${r.command}\n`);
    } else if (r.status === 'fail') {
      process.stdout.write(`FAIL   ${id} — ${r.command} exited 1\n`);
      if (r.stderr) process.stdout.write(`${r.stderr}\n`);
    } else if (r.reason === 'human-stop') {
      process.stdout.write(`HUMAN  ${id} — unresolved, and it stays unresolved.\n`);
      process.stdout.write(`       ${r.decided_by} decides. Recorded in: ${String(r.recorded_in).trim()}\n`);
      process.stdout.write('       No exit code means yes here. That is the design, not a gap.\n');
    } else {
      process.stdout.write(`UNRESOLVED  ${id} — ${r.reason}\n`);
      if (r.stderr) process.stdout.write(`${r.stderr}\n`);
    }
    return EXIT_FOR_STATUS[r.status];
  }

  if (cmd !== 'check') {
    process.stderr.write('usage: check-gates.mjs [check|resolve <id>] [--json]\n');
    return 2;
  }

  const tree = realTree();
  const findings = wiringFindings(tree);
  if (asJson) {
    process.stdout.write(`${JSON.stringify({ findings, gates: tree.gates.length, playbooks: tree.playbooks.length }, null, 2)}\n`);
    return findings.length ? 1 : 0;
  }
  if (!findings.length) {
    const kinds = tree.gates.map((g) => `${g.id} (${g.kind})`).join(' · ');
    process.stdout.write(`✓ gate and trigger wiring resolves — ${tree.gates.length} gates: ${kinds}\n`);
    process.stdout.write(`  ${tree.playbooks.length} playbooks, every trigger reaching a command that names it back.\n`);
    return 0;
  }
  process.stdout.write(`✗ ${findings.length} finding${findings.length === 1 ? '' : 's'}\n`);
  for (const f of findings) process.stdout.write(`    - ${f}\n`);
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    process.exitCode = main();
  } catch (err) {
    process.stderr.write(`check-gates: ${err.message}\n`);
    // Failing to DETERMINE the answer is never a pass. 2 is distinct from both 1 (findings) and
    // 3 (a gate resolved unresolved), so a caller can tell "this checker broke" from "the wiring
    // is wrong" from "a human has to act".
    process.exitCode = 2;
  }
}
