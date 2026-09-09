/**
 * warroom-engine.test.mjs — the CEO engine is a per-pane choice, and it behaves.
 *
 * POSTURE: BLOCKS. Wired into `test:warroom`, which `.github/workflows/ci.yml`
 * runs on every PR through `check:warroom`.
 *
 * WHY THESE ARE SHAPED THE WAY THEY ARE. The obvious test for "the default
 * engine is claude" is `assert.equal(WARROOM_ENGINE_FALLBACK, 'claude')`, and
 * it is worth nothing: it passes just as happily when engine_for_pane ignores
 * the fallback entirely, when the launch line is built from a different string,
 * and when the guard checks a program no pane will start. This repository keeps
 * finding that defect in its own controls and says so in CLAUDE.md, so every
 * case below runs `bin/warroom` as a subprocess and asserts on what it DID.
 *
 * Nothing here starts tmux, creates a worktree, or writes into the project.
 * `warroom engine` exists precisely so the resolution is observable without
 * them — see the comment above cmd_engine.
 *
 * Each test names, in its own body, the mutation that was applied to
 * bin/warroom to watch it fail. All eight were confirmed red before being
 * committed green; the mutations are recorded rather than the fact of having
 * run them, because a claim that a test was verified is only useful if the next
 * person can repeat it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WARROOM = path.join(REPO, 'bin', 'warroom');
const SRC = fs.readFileSync(WARROOM, 'utf8');

/**
 * A throwaway project: its own HOME, its own state_dir, its own entry preamble.
 * The real ~/.agentvibe is never touched — the rendered Codex preamble lands
 * under this project's state_dir, so a test run cannot overwrite what a live
 * war room is using.
 */
function project(t, { configExtra = '', preamble = 'SENTINEL_BODY_ALPHA the shared CEO identity.' } = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'warroom-engine-'));
  const dir = path.join(home, 'proj');
  fs.mkdirSync(path.join(dir, '.claude', 'entry'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'agents', 'ceo.md'), '# ceo\n');
  const entry = path.join(dir, '.claude', 'entry', 'ceo.md');
  fs.writeFileSync(entry, preamble);
  const config = path.join(dir, '.warroom.yml');
  fs.writeFileSync(
    config,
    `session: proj\nproject_dir: ${dir}\nstate_dir: ${path.join(home, '.proj')}\n${configExtra}`
  );
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return { home, dir, config, entry };
}

/** Run bin/warroom against a throwaway project. Never exits the test runner. */
function warroom(p, args, { path: PATH_ = process.env.PATH } = {}) {
  try {
    const out = execFileSync('bash', [WARROOM, '--config', p.config, ...args], {
      encoding: 'utf8',
      env: { ...process.env, HOME: p.home, PATH: PATH_ },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out, err: '' };
  } catch (e) {
    return { code: e.status ?? 1, out: e.stdout ?? '', err: e.stderr ?? '' };
  }
}

/** The engine and launch line the launcher resolved for each pane. */
function panes(result) {
  return result.out
    .split('\n')
    .map((l) => l.match(/^\s*CEO-(\d+)\s+(\S+)\s+(.*?)\s*$/))
    .filter(Boolean)
    .map((m) => ({ n: Number(m[1]), engine: m[2], cmd: m[3] }));
}

/**
 * A PATH holding only a `tmux` stub plus the system directories. Neither
 * `claude` nor `codex` lives in /usr/bin or /bin, so both are absent here and
 * the missing-binary guard is genuinely exercised rather than mocked.
 */
function pathWithoutEngines(t) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'warroom-nobin-'));
  fs.writeFileSync(path.join(bin, 'tmux'), '#!/bin/sh\nexit 1\n');
  fs.chmodSync(path.join(bin, 'tmux'), 0o755);
  t.after(() => fs.rmSync(bin, { recursive: true, force: true }));
  return `${bin}:/usr/bin:/bin`;
}

// ── The default ──────────────────────────────────────────────

test('a founder who changes nothing gets claude, and the launch line is bare `claude`', (t) => {
  // MUTATION: WARROOM_ENGINE_FALLBACK="codex" → all three panes report codex
  // and the launch lines carry -c developer_instructions. Red on all four
  // assertions.
  const p = project(t);
  const r = warroom(p, ['engine', '3']);
  assert.equal(r.code, 0, r.err);
  const got = panes(r);
  assert.equal(got.length, 3, `expected 3 panes, got ${r.out}`);
  for (const pane of got) {
    assert.equal(pane.engine, 'claude', `CEO-${pane.n} should default to claude`);
    // Exactly `claude` — not merely containing it. A launch line that had
    // grown a flag would still contain the word.
    assert.equal(pane.cmd, 'claude', `CEO-${pane.n} launch line`);
  }
});

test('the resume form for the default engine is a FLAG, and for codex a SUBCOMMAND', (t) => {
  // The shape difference is why a launch line cannot be built by appending to
  // the binary name, so it is asserted rather than trusted.
  // MUTATION: make the codex branch print `codex --resume %s` → red on the
  // second assertion.
  const p = project(t);
  const claude = warroom(p, ['engine', '1']);
  assert.match(claude.out, /resume form: claude --resume SESSION_ID/);

  const codex = warroom(p, ['engine', '1', '--engine', 'codex']);
  assert.match(codex.out, /resume form: codex resume SESSION_ID/);
  assert.doesNotMatch(codex.out, /codex --resume/, 'codex resume is a subcommand, not a flag');
});

// ── Refusal ──────────────────────────────────────────────────

test('an unknown engine is REFUSED, not quietly defaulted', (t) => {
  // The failure this rejects: `--engine codek` starting a perfectly healthy
  // Claude war room, indistinguishable from a working Codex one until someone
  // reads a whole session's output.
  // MUTATION: engine_require_known returns instead of exiting → exit becomes 0
  // and a claude pane is printed. Red on all three assertions.
  const p = project(t);
  const r = warroom(p, ['engine', '2', '--engine', 'codek']);
  assert.equal(r.code, 1, 'must exit non-zero');
  assert.match(r.err, /unknown engine 'codek'/);
  assert.match(r.err, /Valid engines: claude codex/, 'the refusal must name the valid set');
  assert.equal(panes(r).length, 0, 'must not resolve any pane after refusing');
});

test('an unknown engine in .warroom.yml is refused the same way', (t) => {
  // Config is the other door into the same decision. It was worth its own case:
  // the flag is validated at parse time and the config value is not, so a
  // single validation site could easily have covered only one of them.
  // MUTATION: drop the engine_require_known call in engine_for_pane's config
  // branch → exit 0 with engine reported as "nope". Red.
  const p = project(t, { configExtra: 'engine: nope\n' });
  const r = warroom(p, ['engine', '1']);
  assert.equal(r.code, 1);
  assert.match(r.err, /unknown engine 'nope'/);
  assert.match(r.err, /\.warroom\.yml/, 'the refusal must say WHERE the bad value came from');
});

test('a malformed per-pane override is refused', (t) => {
  // MUTATION: delete the `*)` arm of the override validation loop → exit 0. Red.
  const p = project(t);
  const r = warroom(p, ['engine', '2', '--engine', ':codex']);
  assert.equal(r.code, 1);
  assert.match(r.err, /malformed --engine override/);
});

// ── The missing-binary guard ─────────────────────────────────

test('the missing-binary guard names the engine that will actually launch', (t) => {
  // Both binaries are absent from PATH in both runs. The ONLY difference is
  // which engine was asked for, so a guard that still hardcoded `claude` would
  // give the same message twice — which is exactly the bug: a Codex-only war
  // room refused for the absence of a program it was never going to start.
  // MUTATION: restore `if ! command -v claude` → the codex run reports "claude
  // not found" and both assertions on the second run go red.
  const p = project(t);
  const PATH_ = pathWithoutEngines(t);

  const asClaude = warroom(p, ['1'], { path: PATH_ });
  assert.equal(asClaude.code, 1);
  assert.match(asClaude.out + asClaude.err, /claude not found/);

  const asCodex = warroom(p, ['1', '--engine', 'codex'], { path: PATH_ });
  assert.equal(asCodex.code, 1);
  assert.match(asCodex.out + asCodex.err, /codex not found/, 'must name codex, not claude');
  assert.doesNotMatch(
    asCodex.out + asCodex.err,
    /claude not found/,
    'must not demand a program this run will never start'
  );
});

// ── One source for the CEO's identity ────────────────────────

test('both engines render the SAME body, and it comes from the one source file', (t) => {
  // This is the case that catches a second copy. It does not check that the
  // renderings look similar — it EDITS the source and requires both to move.
  // A hardcoded duplicate of the body inside the codex branch would keep
  // rendering the old text and fail here.
  // MUTATION: paste the preamble text literally into the codex arm of
  // render_ceo_preamble instead of substituting $CEO_PREAMBLE → red on the
  // second half.
  const p = project(t, { preamble: 'SENTINEL_BODY_ALPHA identity text.' });

  const c1 = warroom(p, ['engine', 'render', 'claude']);
  const x1 = warroom(p, ['engine', 'render', 'codex']);
  assert.equal(c1.code, 0, c1.err);
  assert.equal(x1.code, 0, x1.err);
  assert.match(c1.out, /SENTINEL_BODY_ALPHA identity text\./);
  assert.match(x1.out, /SENTINEL_BODY_ALPHA identity text\./);

  // Now change the single source and require BOTH renderings to follow it.
  fs.writeFileSync(p.entry, 'SENTINEL_BODY_BETA replaced identity text.');
  const c2 = warroom(p, ['engine', 'render', 'claude']);
  const x2 = warroom(p, ['engine', 'render', 'codex']);
  assert.match(c2.out, /SENTINEL_BODY_BETA replaced identity text\./, 'claude rendering must follow the source');
  assert.match(x2.out, /SENTINEL_BODY_BETA replaced identity text\./, 'codex rendering must follow the source');
  assert.doesNotMatch(c2.out, /SENTINEL_BODY_ALPHA/);
  assert.doesNotMatch(x2.out, /SENTINEL_BODY_ALPHA/, 'a stale codex rendering means a second copy exists');
});

test('each rendering carries its own engine affordances, and the no-CEO-subagent constraint survives both', (t) => {
  // The load-bearing constraint. It must reach a Codex pane too, and Codex has
  // no @-mention syntax, so the Claude prefix must NOT leak into it.
  // MUTATION: drop the "Do NOT spawn a CEO sub-agent" line from
  // CEO_CODEX_ADAPTER → red. Emit the claude prefix from the codex arm → red.
  const p = project(t, { preamble: 'body. never spawn a CEO subagent.' });
  const claude = warroom(p, ['engine', 'render', 'claude']).out;
  const codex = warroom(p, ['engine', 'render', 'codex']).out;

  assert.match(claude, /^@"ceo \(agent\)" /, 'claude keeps its agent mention');
  assert.doesNotMatch(codex, /@"ceo \(agent\)"/, 'codex has no @-mention syntax');
  assert.match(codex, /ENGINE NOTE — you are Codex/);
  // Codex gets it twice over: carried in the shared body, and restated by the
  // adapter in Codex's own vocabulary ("sub-agent"), because Codex's default
  // prompt reasons about sub-agents under that spelling.
  assert.match(codex, /never spawn a CEO subagent/i, 'via the shared body');
  assert.match(codex, /Do NOT spawn a CEO sub-agent/, 'restated by the adapter');
  assert.match(claude, /never spawn a CEO subagent/i);
});

test("the repo's real CEO entry file still carries the constraint both renderings depend on", () => {
  // The tests above prove the MECHANISM carries whatever the source says. This
  // one guards the source itself: delete the constraint from
  // .claude/entry/ceo.md and every Claude pane silently loses it, because the
  // Claude rendering has no adapter to restate it.
  // MUTATION: remove "never spawn a CEO subagent" from .claude/entry/ceo.md → red.
  const entry = fs.readFileSync(path.join(REPO, '.claude', 'entry', 'ceo.md'), 'utf8');
  assert.match(
    entry,
    /never spawn a CEO subagent/i,
    'the one source of the CEO identity must state the constraint; a Claude pane gets it from ' +
      'here and nowhere else'
  );
});

// ── Mixed panes, which is the founder's "in addition to" ─────

test('mixed-engine panes resolve independently in one session', (t) => {
  // MUTATION: make engine_for_pane ignore WARROOM_ENGINE_OVERRIDES → CEO-2
  // comes back claude. Red.
  const p = project(t);
  const r = warroom(p, ['engine', '3', '--engine', '2:codex']);
  assert.equal(r.code, 0, r.err);
  const got = panes(r);
  assert.deepEqual(
    got.map((x) => `${x.n}:${x.engine}`),
    ['1:claude', '2:codex', '3:claude'],
    'one Claude CEO and one Codex CEO in the same session is the point of the feature'
  );
  // And the launch lines differ in kind, not just in name.
  assert.equal(got[0].cmd, 'claude');
  assert.match(got[1].cmd, /^codex -c developer_instructions="\$\(cat .*ceo\.codex\.md\)"$/);
});

test('a per-pane override beats a run default, which beats config, which beats claude', (t) => {
  // The whole precedence chain in one run: config says codex, the run default
  // says claude, and pane 2 overrides back to codex.
  // MUTATION: swap the order of the override and default branches in
  // engine_for_pane → CEO-2 comes back claude. Red.
  const p = project(t, { configExtra: 'engine: codex\n' });

  const fromConfig = warroom(p, ['engine', '1']);
  assert.equal(panes(fromConfig)[0].engine, 'codex', 'config beats the built-in default');

  const r = warroom(p, ['engine', '3', '--engine', 'claude', '--engine', '2:codex']);
  assert.deepEqual(
    panes(r).map((x) => `${x.n}:${x.engine}`),
    ['1:claude', '2:codex', '3:claude']
  );
});

// ── The Codex launch line is the measured one ────────────────

test('the codex launch line passes the preamble by PATH, never as inline prose', (t) => {
  // Measured 2026-09-09: `-c key=value` parses the value as TOML and falls back
  // to a literal string. A ~3KB markdown body with backticks and double quotes
  // on a shell command line is where that goes wrong, so the launcher puts the
  // FILE PATH on the line and reads it back with "$(cat …)". This asserts the
  // preamble prose never appears on the command line at all.
  // MUTATION: interpolate $CEO_PREAMBLE into the line instead of the path →
  // red on the last two assertions.
  const p = project(t, { preamble: 'PROSE_MUST_NOT_APPEAR_ON_THE_COMMAND_LINE `x` "y"' });
  const r = warroom(p, ['engine', '1', '--engine', 'codex']);
  assert.equal(r.code, 0, r.err);
  const [pane] = panes(r);

  const m = pane.cmd.match(/\$\(cat (.*ceo\.codex\.md)\)/);
  assert.ok(m, `launch line should read the preamble from a file: ${pane.cmd}`);
  assert.doesNotMatch(pane.cmd, /PROSE_MUST_NOT_APPEAR_ON_THE_COMMAND_LINE/);

  // The file it names must exist and hold the rendering.
  const rendered = fs.readFileSync(m[1], 'utf8');
  assert.match(rendered, /PROSE_MUST_NOT_APPEAR_ON_THE_COMMAND_LINE/);
  assert.match(rendered, /ENGINE NOTE — you are Codex/);
});

test('bare mode gives codex no preamble, and still launches it', (t) => {
  // --bare means "no CEO agent/preamble". For Claude that is inject_ceo_prompt
  // being skipped; for Codex the preamble is on the launch line, so bare has to
  // reach further back or the flag would silently do nothing.
  // MUTATION: ignore BARE_MODE in send_launch_engine/cmd_engine → the launch
  // line keeps -c developer_instructions. Red.
  const p = project(t);
  const r = warroom(p, ['engine', '1', '--engine', 'codex', '--bare']);
  assert.equal(r.code, 0, r.err);
  assert.equal(panes(r)[0].cmd, 'codex', 'bare codex launches with no injected instructions');
});

// ── The seam stayed a seam ───────────────────────────────────

test('send_launch_engine names no engine binary, and the old name still resolves', (t) => {
  // Six call sites depend on send_launch_claude. Renaming without an alias
  // would break them, and `bash -n` would not notice — an undefined function in
  // bash is a runtime error, not a syntax error.
  // MUTATION: delete the alias line → red on the first assertion. Put a literal
  // `tmux send-keys … "claude" Enter` back into send_launch_engine → red on the
  // third.
  assert.match(SRC, /^send_launch_claude\(\) \{ send_launch_engine "\$@"; \}$/m, 'the alias must survive');

  const body = SRC.split(/^send_launch_engine\(\) \{$/m)[1].split(/^\}$/m)[0];
  const code = body
    .split('\n')
    .filter((l) => !l.trim().startsWith('#'))
    .join('\n');
  for (const name of ['claude', 'codex']) {
    assert.doesNotMatch(
      code,
      new RegExp(`["'\\s]${name}["'\\s]`),
      `send_launch_engine must not name ${name}; adding an engine is a row in ` +
        'engine_launch_cmd, not a branch at the seam'
    );
  }

  // And every historical call site still points at a defined function.
  const sites = (SRC.match(/^\s*send_launch_claude "/gm) || []).length;
  assert.ok(sites >= 6, `expected the 6 historical call sites to survive, found ${sites}`);
});

// ── FLEET: THE LAUNCHER MUST NOT NAME ONE PROJECT ───────────────────────────
//
// `bin/warroom` is "one program, many projects". Two literals survived the
// extraction from agentvibe's standalone copy — the restore banner and the
// help title both said "Agentvibe" — and on a single-project machine that is
// invisible. Measured 2026-09-09 against ~/bin/ghostb: its own launcher printed
// "ghostb — Ghostb CEO War Room" and bin/warroom printed
// "ghostb — Agentvibe CEO War Room". Thirteen of fourteen fleet projects would
// have been renamed by their own launcher.
//
// This asserts the PROPERTY (no project name is baked in), not the two lines
// that happened to break it — a fix for a specific literal that lets the next
// one through is the vacuity this repo keeps finding in its own controls.
test('the launcher hardcodes no project name — it is one program for many projects', () => {
  const src = fs.readFileSync(WARROOM, 'utf8');
  // Every session that has ever had a standalone launcher in ~/bin. A new
  // literal for any of them is the same defect wearing a different name.
  const names = ['Agentvibe', 'AGENTVIBE', 'Beamix', 'BEAMIX', 'Ghostb', 'GHOSTB',
                 'Beeond', 'BEEOND', 'Aiclub', 'Etsyc', 'Evalove', 'Finfun'];
  const offenders = [];
  for (const [i, line] of src.split('\n').entries()) {
    if (line.trimStart().startsWith('#')) continue;      // comments may name projects
    for (const n of names) if (line.includes(n)) offenders.push(`${i + 1}: ${line.trim()}`);
  }
  assert.deepEqual(offenders, [],
    `bin/warroom names a project in executable code:\n${offenders.join('\n')}\n` +
    'Use ${SESSION} or ${SESSION_UPPER}, which resolve from the per-project config.');
});
