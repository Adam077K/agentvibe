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
 * THE FILE HAS TWO HALVES, AND THE SPLIT IS THE POINT. The first half runs
 * `warroom engine` — the inspection command, which starts nothing: no tmux, no
 * worktree, no write into the project — plus three source-level guards that
 * read bin/warroom without running it. The second half, under THE REAL LAUNCH
 * PATH at the bottom of this file, runs `cmd_start` for real against a fake
 * tmux and a throwaway git repo. It exists because a binding QA review found
 * that the inspection path was the ONLY one this suite exercised, and named the
 * consequence exactly: reverting the multi-pane `check_deps` fix would have
 * kept every test in the first half green.
 *
 * Each test names, in its own body, the mutation that was applied to
 * bin/warroom to watch it fail; the mutations are recorded rather than the fact
 * of having run them, because a claim that a test was verified is only useful
 * if the next person can repeat it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
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
/**
 * Locates the preamble path inside a rendered codex launch line, and pins the two
 * properties that path has to have. Group 1 is the path.
 *
 * Both are load-bearing and both were bugs:
 *   - the path is QUOTED — unquoted, a state_dir containing a space made `cat a b`
 *     read two files and silently hand codex the tail of one, dropping the whole brief;
 *   - it is read through `${WARROOM_CEO_PREAMBLE:-…}` — the launcher also exports the
 *     path out of band with `tmux setenv`, and the literal is the fallback for a pane
 *     whose shell forked before that export and would otherwise read the variable empty.
 *
 * Kept as one constant because two tests match it and a locator duplicated is a locator
 * that gets half-updated.
 */
const CODEX_PREAMBLE_IN_LINE = /\$\(cat "\$\{WARROOM_CEO_PREAMBLE:-(.*ceo\.codex\.md)\}"\)/;

function project(
  t,
  { configExtra = '', preamble = 'SENTINEL_BODY_ALPHA the shared CEO identity.', homePrefix = 'warroom-engine-' } = {}
) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), homePrefix));
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
  assert.match(got[1].cmd, CODEX_PREAMBLE_IN_LINE);
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

  const m = pane.cmd.match(CODEX_PREAMBLE_IN_LINE);
  assert.ok(m, `launch line should read the preamble from a file: ${pane.cmd}`);
  assert.doesNotMatch(pane.cmd, /PROSE_MUST_NOT_APPEAR_ON_THE_COMMAND_LINE/);

  // The file it names must exist and hold the rendering.
  const rendered = fs.readFileSync(m[1], 'utf8');
  assert.match(rendered, /PROSE_MUST_NOT_APPEAR_ON_THE_COMMAND_LINE/);
  assert.match(rendered, /ENGINE NOTE — you are Codex/);
});

test('a state_dir containing a space still delivers the WHOLE preamble', (t) => {
  // The defect that changed this launch line's shape, asserted as the property rather
  // than as the syntax that currently fixes it. Unquoted, the path expanded to two words
  // and `cat a b` read two files: codex was handed the tail of one and the CEO brief was
  // silently gone. Nothing errored — which is why a shape assertion alone would not have
  // caught it and a delivery assertion does.
  //
  // MUTATION: drop the inner quotes in engine_launch_cmd's codex arm, i.e. emit
  // `$(cat ${WARROOM_CEO_PREAMBLE:-%s})` → the locator no longer matches and this goes
  // red on the first assertion. Confirmed.
  const p = project(t, {
    homePrefix: 'warroom engine spaced ',
    preamble: 'SPACED_PATH_SENTINEL the whole brief must survive.',
  });
  assert.ok(/\s/.test(p.home), `fixture must actually contain a space: ${p.home}`);

  const r = warroom(p, ['engine', '1', '--engine', 'codex']);
  assert.equal(r.code, 0, r.err);
  const cmd = panes(r)[0].cmd;

  // DELIVERY FIRST, and deliberately NOT via the locator — the locator is a shape check,
  // and a shape check standing in front of a delivery check means the delivery check never
  // runs on the failure it exists for. The value expression is expanded by a real bash, the
  // same expansion the pane performs, and compared against the file on disk.
  // WARROOM_CEO_PREAMBLE is stripped so the `:-` fallback is the branch under test.
  const rendered = path.join(p.home, '.proj', 'entry', 'ceo.codex.md');
  assert.ok(/\s/.test(rendered), 'the path under test must contain a space');
  const valueExpr = cmd.slice(cmd.indexOf('developer_instructions=') + 'developer_instructions='.length);
  const env = { ...process.env };
  delete env.WARROOM_CEO_PREAMBLE;
  let delivered;
  try {
    delivered = execFileSync('bash', ['-c', `printf '%s' ${valueExpr}`], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    delivered = `<the shell failed: ${e.stderr ?? e.message}>`;
  }
  assert.equal(
    delivered,
    fs.readFileSync(rendered, 'utf8'),
    'the shell handed codex something other than the whole file — this is the space bug'
  );
  assert.match(delivered, /^ENGINE NOTE — you are Codex/, 'the head of the brief was lost');
  assert.match(delivered, /SPACED_PATH_SENTINEL the whole brief must survive\./, 'the body was lost');

  // Only now the shape, so a future reader knows which mechanism delivered it.
  const m = cmd.match(CODEX_PREAMBLE_IN_LINE);
  assert.ok(m, `path with a space must stay one quoted word: ${cmd}`);
  assert.equal(m[1], rendered);
});

test('the codex line consults the out-of-band path, and keeps the literal as its fallback', (t) => {
  // Two mechanisms, and the test has to see both or it cannot tell them apart. The
  // launcher exports the path with `tmux setenv -g WARROOM_CEO_PREAMBLE` in
  // engine_prepare, BEFORE any pane exists; the literal stays as the `:-` default because
  // a pane whose shell forked before that export reads the variable EMPTY, and a Codex
  // pane that comes up with no brief and no error is the failure this repo refuses.
  //
  // MUTATION: emit only the variable, `$(cat "$WARROOM_CEO_PREAMBLE")` → the fallback
  // assertion goes red. Emit only the literal → the variable assertion goes red.
  const p = project(t);
  const [pane] = panes(warroom(p, ['engine', '1', '--engine', 'codex']));
  assert.match(pane.cmd, /\$\{WARROOM_CEO_PREAMBLE:-/, 'the out-of-band path is not consulted');
  const m = pane.cmd.match(CODEX_PREAMBLE_IN_LINE);
  assert.ok(m && fs.existsSync(m[1]), 'the fallback literal must be a real path a pane could read');
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

// ── HELP MUST DOCUMENT EVERY COMMAND THE ROUTER ACCEPTS ─────────────────────
//
// `prune-branches` had a dispatch entry and a cmd_ function and appeared
// nowhere in `help` — discoverable only by reading the source or by being told.
// The engine commands were added to help by hand, which is exactly how the next
// one gets forgotten.
//
// This derives BOTH lists from the file and compares them, so the check keeps
// working for commands that do not exist yet. A hand-maintained list of
// expected commands would need editing by the same person who forgot to edit
// help, which is no check at all.
test('help documents every command the router dispatches', () => {
  const src = fs.readFileSync(WARROOM, 'utf8');

  // The router: `  <name>)  cmd_...` inside the final case statement.
  const dispatched = new Set();
  for (const m of src.matchAll(/^ {2}([a-z][a-z0-9|_-]*)\)\s*(?:cmd_|$)/gm)) {
    for (const alt of m[1].split('|')) {
      if (['help', '-h', '--help', '*'].includes(alt)) continue;
      dispatched.add(alt);
    }
  }
  assert.ok(dispatched.size > 15, `expected a real dispatch table, found ${dispatched.size}`);

  // The help block: every `echo "    ${SESSION} <word>` line.
  const documented = new Set();
  for (const m of src.matchAll(/echo "\s+\$\{SESSION\}\s+([a-z][a-z0-9_-]*)/g)) documented.add(m[1]);

  const undocumented = [...dispatched].filter((c) => !documented.has(c)).sort();
  assert.deepEqual(undocumented, [],
    `these commands dispatch but are absent from help: ${undocumented.join(', ')}`);
});

// Alignment is not cosmetics here: the help block is the only interface most
// people ever read, and a column that wanders reads as an afterthought. The
// engine lines shipped one column short and two of them had a single space.
test('every help line starts its description at the same column', (t) => {
  const p = project(t);
  const r = warroom(p, ['help']);
  assert.equal(r.code, 0, `help exited ${r.code}: ${r.err}`);

  const cols = new Map();
  for (const raw of r.out.split('\n')) {
    const line = raw.replace(/\u001b\[[0-9;]*m/g, '');       // strip colour, count characters
    const m = line.match(/^ {4}proj ((?:\S+ ?){1,3}?) {2,}(\S)/);
    if (!m) continue;
    // `send`/`inbox`/`clap`/`events`/`brief` are a deliberately wider block.
    if (/^(send|inbox|clap|events|brief)\b/.test(m[1])) continue;
    cols.set(line.indexOf(m[2]), line.trim());
  }
  assert.ok(cols.size > 0, 'matched no help lines — the regex, not the help, is wrong');
  assert.equal(cols.size, 1,
    `help descriptions start at ${cols.size} columns:\n` +
    [...cols].map(([c, l]) => `  col ${c}: ${l}`).join('\n'));
});

// ═══════════════════════════════════════════════════════════════════════════
//  THE REAL LAUNCH PATH
// ═══════════════════════════════════════════════════════════════════════════
//
// Every test above this line runs `warroom engine`. A binding QA review found
// that this was the whole of the coverage and said what it cost:
//
//   "the new suite exercises only cmd_engine, the one path where the refusal
//    genuinely propagates — the real launch path (cmd_start → check_deps →
//    send_launch_engine → pane_number_of) has no test at all, so reverting the
//    multi-pane fix would keep the suite green."
//
// The suite HAD been mutation-tested, and four tests went red. That was real
// evidence and it was evidence of the wrong thing: a mutation that turns a test
// red answers "is this test vacuous", never "is this test pointed at the code
// that ships". Both questions have to be asked, and only the first one was.
//
// The launch path talks to tmux, which is why it went untested. So these tests
// put a FAKE tmux on PATH that records its argv to a file and answers the three
// queries the path asks. What a pane is actually told to run stops being
// observable only by starting a war room and looking, and becomes a string:
// `send-keys ␟ -t ␟ proj:CEO-2 ␟ codex -c developer_instructions="$(cat …)" ␟
// Enter`. Asserting on that recorded argv is the entire difference between this
// half of the file and the half above it.

/** Fake-tmux argv separators: unit between arguments, record between calls. */
const US = '\x1f';
const RS = '\x1e';

const FAKE_TMUX = [
  '#!/bin/sh',
  '# Fake tmux — records argv, then answers only what the launch path asks:',
  '#   has-session  → 1, so cmd_start builds a session instead of prompting',
  '#   capture-pane → a ready prompt, so both ready-waits return immediately',
  '#   list-windows → the CEO windows cmd_start greps for before it injects',
  '# Everything else is a no-op success, which is what tmux looks like to this',
  '# program: it never reads tmux back except through those three.',
  '{ for a in "$@"; do printf \'%s\\037\' "$a"; done; printf \'\\036\'; } >> "@LOG@"',
  'case "$1" in',
  '  has-session)  exit 1 ;;',
  '  capture-pane) printf \'❯ \\n\' ;;',
  '  list-windows) i=1; while [ "$i" -le 8 ]; do echo "CEO-$i"; i=$((i+1)); done ;;',
  'esac',
  'exit 0',
  '',
].join('\n');

// create_worktree captures git's stderr into `$(mktemp)`, and macOS's mktemp
// with no template ignores TMPDIR entirely: it reaches for the per-user Darwin
// temp directory, which this repo's armed Bash sandbox denies. The launcher
// then loses the whole worktree step to `mkstemp failed: Operation not
// permitted`. GNU mktemp on a CI runner honours TMPDIR and needs none of this;
// the shim exists so the launch path is runnable on the machine it is developed
// on. With a template argument it defers to the real program.
const FAKE_MKTEMP = [
  '#!/bin/sh',
  '[ "$#" -gt 0 ] && exec /usr/bin/mktemp "$@"',
  'f="${TMPDIR:-/tmp}/wr-mktemp.$$.$(date +%s)"',
  ': > "$f" || exit 1',
  'printf \'%s\\n\' "$f"',
  '',
].join('\n');

/**
 * A PATH holding a recording `tmux`, a real `python3`, and a stub for each
 * engine named in `engines`. An engine left out of that list is genuinely
 * ABSENT — which is what makes the missing-binary tests real rather than mocked.
 *
 * python3 is symlinked in one binary at a time rather than by adding its
 * directory to PATH: on this machine python3 lives in /usr/local/bin, and
 * putting a whole directory on PATH risks it also holding a real `claude` or
 * `codex` and silently defeating the guard under test.
 */
function shim(t, { engines = ['claude', 'codex'] } = {}) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'warroom-shim-'));
  const log = path.join(bin, 'tmux-argv.log');
  fs.writeFileSync(path.join(bin, 'tmux'), FAKE_TMUX.replace('@LOG@', log));
  fs.chmodSync(path.join(bin, 'tmux'), 0o755);
  fs.writeFileSync(path.join(bin, 'mktemp'), FAKE_MKTEMP);
  fs.chmodSync(path.join(bin, 'mktemp'), 0o755);
  for (const e of engines) {
    fs.writeFileSync(path.join(bin, e), '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(bin, e), 0o755);
  }
  const py = execFileSync('sh', ['-c', 'command -v python3'], { encoding: 'utf8' }).trim();
  assert.ok(py, 'these tests need a real python3: check_deps requires one');
  fs.symlinkSync(py, path.join(bin, 'python3'));
  t.after(() => fs.rmSync(bin, { recursive: true, force: true }));
  return { dir: bin, log, path: `${bin}:/usr/bin:/bin` };
}

/** Every fake-tmux invocation, as an array of argv arrays, in order. */
function tmuxCalls(sh) {
  if (!fs.existsSync(sh.log)) return [];
  return fs
    .readFileSync(sh.log, 'utf8')
    .split(RS)
    .filter((r) => r !== '')
    .map((r) => r.split(US).slice(0, -1));
}

/**
 * `tmux send-keys -t <target> <line> Enter` — the shell line a pane was told to
 * RUN, keyed by target. The HQ window is excluded: it runs a status script, not
 * an engine.
 */
function launchLines(calls) {
  const out = new Map();
  for (const c of calls) {
    if (c[0] !== 'send-keys' || c[1] !== '-t' || c.length !== 5 || c[4] !== 'Enter') continue;
    if (!/(CEO-\d+|GRID\.\d+)/.test(c[2])) continue;
    out.set(c[2], c[3]);
  }
  return out;
}

/**
 * The tmux subcommands that only READ. Declared as an allowlist and everything
 * else treated as a mutation, rather than the other way round: a deny-list of
 * state-changing subcommands is a list someone has to remember to extend, and
 * the one they forget is the one that leaks out of a run that was refused.
 */
const TMUX_READS = new Set([
  'has-session',
  'list-sessions',
  'list-windows',
  'list-panes',
  'display-message',
  'capture-pane',
  'show-environment',
  'showenv',
]);

/** Every tmux call that changed something: created, typed, set or killed. */
function mutatingTmuxCalls(calls) {
  return calls.filter((c) => !TMUX_READS.has(c[0]));
}

/** `tmux send-keys -t <target> -l <text>` — what was PASTED into a pane. */
function pastes(calls) {
  const out = new Map();
  for (const c of calls) {
    if (c[0] === 'send-keys' && c[1] === '-t' && c[3] === '-l') out.set(c[2], c[4]);
  }
  return out;
}

/**
 * A project cmd_start can actually launch into. `project()` above fakes .git
 * with an empty directory, which is enough for check_deps and nothing else;
 * create_worktree runs `git worktree add … main`, so the repo and the branch
 * both have to be real.
 */
function launchableProject(t, opts = {}) {
  const p = project(t, opts);
  fs.rmSync(path.join(p.dir, '.git'), { recursive: true, force: true });
  const git = (...a) =>
    execFileSync('git', ['-C', p.dir, '-c', 'commit.gpgsign=false', ...a], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      // The founder's own git config must not reach a test fixture: a global
      // hooksPath or signing key would make this pass or fail per machine.
      env: { ...process.env, HOME: p.home, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' },
    });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'warroom-test@example.invalid');
  git('config', 'user.name', 'warroom test');
  git('commit', '-q', '--allow-empty', '-m', 'init');
  return p;
}

let runSeq = 0;

/**
 * Run bin/warroom on the REAL launch path, returning what it printed and every
 * tmux call it made.
 *
 * Output goes to a FILE rather than a pipe on purpose. cmd_start leaves
 * capture_session_id polling in the background for up to ten seconds; a
 * background child holding the write end of a pipe keeps that pipe open, and
 * every launch test would wait out the full ten seconds for a process that had
 * already exited.
 */
function launch(p, args, sh) {
  const outFile = path.join(p.home, `run-${runSeq++}.out`);
  const fd = fs.openSync(outFile, 'w');
  const r = spawnSync('bash', [WARROOM, '--config', p.config, ...args], {
    env: { ...process.env, HOME: p.home, PATH: sh.path, TMPDIR: p.home },
    stdio: ['ignore', fd, fd],
    timeout: 90_000,
  });
  fs.closeSync(fd);
  return { code: r.status, out: fs.readFileSync(outFile, 'utf8'), calls: tmuxCalls(sh) };
}

// ── cmd_start, mixed engines ─────────────────────────────────

test('cmd_start launches pane 2 on codex and panes 1 and 3 on claude, read from the tmux argv', (t) => {
  // The inspection test above asserts the same three engines from `engine 3`
  // output. This one asserts them from what tmux was told to type, which is the
  // only place a founder's pane gets its program from.
  // MUTATION: in launch_claude_in_window, `$(engine_for_pane "$n")` →
  // `$(engine_for_pane 1)` → CEO-2's recorded line becomes `claude`. Red.
  // MUTATION: drop the WARROOM_ENGINE_OVERRIDES loop from engine_for_pane → same.
  const p = launchableProject(t);
  const sh = shim(t);
  const r = launch(p, ['3', '--engine', '2:codex'], sh);
  assert.equal(r.code, 0, r.out);

  const lines = launchLines(r.calls);
  assert.deepEqual([...lines.keys()].sort(), ['proj:CEO-1', 'proj:CEO-2', 'proj:CEO-3']);
  assert.equal(lines.get('proj:CEO-1'), 'claude');
  assert.equal(lines.get('proj:CEO-3'), 'claude');
  // WHICH ENGINE, and that it was given a preamble — deliberately not the exact
  // spelling of the codex line. That is pinned once, by the inspection tests
  // above; pinning it twice would mean two files to edit the next time the line
  // legitimately changes, and there is a live proposal to change it.
  assert.match(lines.get('proj:CEO-2'), /^codex\b/, 'pane 2 must be told to run codex');
  assert.notEqual(lines.get('proj:CEO-2'), 'codex', 'and a non-bare codex pane is given the CEO preamble');
});

test('a codex pane is NOT also pasted into, and pane_number_of is what decides that', (t) => {
  // cmd_start calls `inject_ceo_prompt "$SESSION:CEO-$i.1"` with no engine
  // argument, so the only thing that tells it pane 2 is Codex is
  // pane_number_of parsing "proj:CEO-2.1". A Codex pane already carries the
  // preamble on its launch line; pasting again delivers it twice.
  // MUTATION: make pane_number_of `printf 1` unconditionally → CEO-2.1 resolves
  // claude and is pasted. Red on the first assertion.
  const p = launchableProject(t);
  const sh = shim(t);
  const r = launch(p, ['3', '--engine', '2:codex'], sh);
  assert.equal(r.code, 0, r.out);

  const pasted = pastes(r.calls);
  assert.deepEqual(
    [...pasted.keys()].sort(),
    ['proj:CEO-1.1', 'proj:CEO-3.1'],
    'exactly the claude panes are pasted into'
  );
  assert.match(pasted.get('proj:CEO-1.1'), /^@"ceo \(agent\)" /);
  assert.match(pasted.get('proj:CEO-1.1'), /SENTINEL_BODY_ALPHA/);
});

// ── check_deps, with more than one pane ──────────────────────

test('a binary missing for pane 3 refuses the run before tmux is touched', (t) => {
  // THE ANTI-REVERT TEST, and the gap the review named: both existing
  // missing-binary cases are count=1, where `check_deps "$count"` and the old
  // pane-1-only check are indistinguishable.
  // MUTATION: `check_deps "$count"` → `check_deps` in cmd_start (its state
  // before the multi-pane fix) → count defaults to 1, only pane 1's claude is
  // checked, it is present, and the whole session gets built. Red on all four.
  const p = launchableProject(t);
  const sh = shim(t, { engines: ['claude'] }); // codex is genuinely not installed
  const r = launch(p, ['3', '--engine', '3:codex'], sh);

  assert.equal(r.code, 1, `must refuse the run: ${r.out}`);
  assert.match(r.out, /codex not found/, 'must name the binary pane 3 would have needed');
  assert.doesNotMatch(r.out, /claude not found/, 'claude is present — naming it is the old pane-1 bug');
  assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, 'no worktree may be created');
  // A refused run must leave the tmux server as it found it. Reads are fine;
  // anything that sets, creates or types is not, because a run that never
  // started has no business having changed the machine.
  assert.deepEqual(
    mutatingTmuxCalls(r.calls),
    [],
    'a run refused for a missing binary must change nothing in tmux'
  );
});

test('the same run is allowed once the missing binary is present', (t) => {
  // The control for the test above. Without it, "refused" could be an artefact
  // of the fixture — a 3-pane mixed run that never launches for some unrelated
  // reason would satisfy every assertion up there.
  // MUTATION: none needed; this is the negative half of the pair.
  const p = launchableProject(t);
  const sh = shim(t, { engines: ['claude', 'codex'] });
  const r = launch(p, ['3', '--engine', '3:codex'], sh);
  assert.equal(r.code, 0, r.out);
  assert.match(launchLines(r.calls).get('proj:CEO-3'), /^codex\b/);
});

// ── pane_number_of on the path that depends on it ────────────

test('grid mode resolves every pane engine through pane_number_of, from the target alone', (t) => {
  // cmd_grid_start calls `send_launch_claude "$SESSION:GRID.$i"` with NO engine
  // argument — unlike normal mode, which passes one. So the string
  // "proj:GRID.3" is the ONLY carrier of the fact that pane 3 is Codex, and
  // pane_number_of is the only thing that reads it. This is the real dependency
  // the review said had zero coverage.
  // MUTATION: delete the `*:GRID.*)` arm of pane_number_of → GRID.3 launches
  // `claude`. Red.
  // MUTATION: `printf '%s' "$n"` → `printf 1` → same.
  const p = launchableProject(t);
  const sh = shim(t);
  const r = launch(p, ['3', '--grid', '--engine', '3:codex'], sh);
  assert.equal(r.code, 0, r.out);

  const lines = launchLines(r.calls);
  assert.deepEqual([...lines.keys()].sort(), ['proj:GRID.1', 'proj:GRID.2', 'proj:GRID.3']);
  assert.equal(lines.get('proj:GRID.1'), 'claude');
  assert.equal(lines.get('proj:GRID.2'), 'claude');
  assert.match(lines.get('proj:GRID.3'), /^codex\b/);
  assert.notEqual(lines.get('proj:GRID.3'), 'codex', 'and it is given the preamble, as a non-bare pane');
});

/** Shell-quote a value for a `bash -c` string. */
const sq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/**
 * Call one of bin/warroom's own functions directly.
 *
 * Sourcing the launcher with `help` runs the router's help arm and stops,
 * leaving every function defined — so this exercises the real definition rather
 * than a transcription of it into the test. Used only for inputs cmd_start
 * cannot produce: it caps at 8 panes, so no launch will ever hand
 * pane_number_of a two-digit window.
 */
function warroomEval(p, script, { args = [], path: PATH_ = process.env.PATH } = {}) {
  const src =
    `. ${sq(WARROOM)} --config ${sq(p.config)} ${args.map(sq).join(' ')} help >/dev/null 2>&1\n` + script;
  const r = spawnSync('bash', ['-c', src], {
    encoding: 'utf8',
    env: { ...process.env, HOME: p.home, PATH: PATH_, TMPDIR: p.home },
    timeout: 30_000,
  });
  return { code: r.status, out: (r.stdout ?? '').trim(), err: r.stderr ?? '' };
}

test('pane_number_of reads the targets the launcher builds, and REFUSES one it cannot', (t) => {
  // Two-digit panes and session names that themselves contain the markers are
  // shapes no launch can reach — cmd_start caps at 8 — so they are called
  // directly. That the function is LOAD-BEARING is established by the grid and
  // paste tests above, not here.
  // MUTATION: `n="${n%%.*}"` → `n="${n:0:1}"` → CEO-12 answers 1. Red.
  // MUTATION: drop the `*:CEO-*)` arm → CEO-3.1 is refused. Red.
  // MUTATION: drop the `*:GRID.*)` arm → GRID.3 is refused. Red.
  // MUTATION: put the silent `n=1` fallback back in place of the refusal arm →
  // red on all three unreadable targets at once.
  const p = project(t);
  const of = (target) => warroomEval(p, `pane_number_of ${sq(target)}`);

  for (const [target, n] of [
    ['proj:CEO-1', '1'],
    ['proj:CEO-3.1', '3'],
    ['proj:CEO-12.1', '12'], // a pane number is not one character wide
    ['proj:GRID.3', '3'],
    ['proj:GRID.12', '12'],
    // A session whose own NAME carries the markers. The parse has to key off
    // the window, not off the first occurrence anywhere in the string.
    ['ceo-grid:CEO-2.1', '2'],
    ['my-ceo:GRID.4', '4'],
  ]) {
    const r = of(target);
    assert.equal(r.code, 0, `${target} should parse: ${r.err}`);
    assert.equal(r.out, n, target);
  }

  // And every way into the refusal. Pane 1 is a plausible answer and a wrong
  // one: a pane on an engine nobody asked for is indistinguishable from a
  // working pane until someone reads a whole session.
  //
  // Nothing this program BUILDS reaches these — every target it constructs is
  // `…:CEO-N.x` or `…:GRID.N`. What reaches them is a target built from DATA:
  // cmd_restore takes the pane number out of a snapshot file, so a corrupt
  // snapshot is the live case, and it is exactly where guessing is worst.
  for (const target of ['proj:HQ', 'proj:CEO-.1', 'proj:CEO-x.1']) {
    const r = of(target);
    assert.notEqual(r.code, 0, `${target} must be refused, not guessed at`);
    assert.equal(r.out, '', `${target} must print no pane number at all`);
    assert.ok(r.err.includes(`'${target}'`), `the refusal must name the target it could not read: ${r.err}`);
  }
});

test('a target pane_number_of cannot read stops the launch instead of guessing an engine', (t) => {
  // A refusal is only worth something if it reaches the caller, and this one
  // comes back through a command substitution — where `local eng="$(…)"` makes
  // the assignment the command whose status bash reports, and the refusal is
  // discarded before anyone can test it. So this asserts on the SEAM rather
  // than on the parser: nothing may be typed into a pane that could not be
  // identified.
  //
  // Note what the two halves rule out together. The first says an unreadable
  // target types nothing; on its own that is also satisfied by a
  // send_launch_engine that types nothing ever. The second is the control that
  // closes it.
  // MUTATION: drop the `|| exit 1` from send_launch_engine's
  // `n="$(pane_number_of "$target")"` → the launch carries on with an empty
  // pane number. Red.
  // MUTATION: restore the silent `n=1` fallback in pane_number_of → the
  // unreadable target is launched on pane 1's engine. Red.
  const p = project(t);
  const sh = shim(t);

  const refused = warroomEval(p, 'send_launch_engine "proj:HQ"', {
    args: ['--engine', '1:codex'],
    path: sh.path,
  });
  assert.notEqual(refused.code, 0, `an unreadable target must stop the launch: ${refused.out}`);
  assert.deepEqual(
    tmuxCalls(sh).filter((c) => c[0] === 'send-keys'),
    [],
    'and nothing may be typed into any pane'
  );

  // The control: the same call, the same shim, a target it CAN read.
  const ok = warroomEval(p, 'send_launch_engine "proj:CEO-1"', {
    args: ['--engine', '1:codex'],
    path: sh.path,
  });
  assert.equal(ok.code, 0, ok.err);
  assert.match(launchLines(tmuxCalls(sh)).get('proj:CEO-1'), /^codex\b/);
});

// ── --bare, on the copy of the rule that ships ───────────────

test('--bare on the real launch path: no preamble on the codex line, no paste for claude', (t) => {
  // BARE_MODE → with_preamble is computed twice — once in send_launch_engine,
  // once in cmd_engine — and only cmd_engine's copy had a test. This runs the
  // other one, which is the copy a founder's pane actually obeys.
  // MUTATION: delete `[ "${BARE_MODE:-0}" -eq 1 ] && with_preamble=0` from
  // send_launch_engine → CEO-2's line grows -c developer_instructions. Red.
  // MUTATION: `if [ "$bare_mode" -eq 0 ]` → `-ge 0` in cmd_start → a paste
  // appears in bare mode. Red on the third assertion.
  const p = launchableProject(t);
  const sh = shim(t);
  const bare = launch(p, ['2', '--bare', '--engine', '2:codex'], sh);
  assert.equal(bare.code, 0, bare.out);

  const bareLines = launchLines(bare.calls);
  assert.equal(bareLines.get('proj:CEO-1'), 'claude', 'claude launches bare either way');
  assert.equal(bareLines.get('proj:CEO-2'), 'codex', 'bare codex carries NO developer_instructions');
  assert.deepEqual([...pastes(bare.calls).keys()], [], '--bare pastes into nothing');

  // The control: the same two panes without --bare. Two runs differing in one
  // flag is what makes the assertions above about the flag rather than about
  // the fixture.
  const p2 = launchableProject(t);
  const sh2 = shim(t);
  const dressed = launch(p2, ['2', '--engine', '2:codex'], sh2);
  assert.equal(dressed.code, 0, dressed.out);
  assert.notEqual(
    launchLines(dressed.calls).get('proj:CEO-2'),
    'codex',
    'without --bare the same pane IS given a preamble — otherwise the assertion above says nothing'
  );
  assert.deepEqual([...pastes(dressed.calls).keys()], ['proj:CEO-1.1']);
});

// ── Parse-time refusal, measured against what launched ───────

test('a well-formed override naming an unknown engine is refused at parse time, launching nothing', (t) => {
  // MUTATION: `engine_require_known "${_tok#*:}"` → `"${_tok%%:*}"` in the
  // router's validation loop — it then validates the PANE NUMBER instead of the
  // engine name, still exits 1, and passes every other test in this file. Red
  // here, on the assertion that the message names 'codek'.
  // MUTATION: delete the engine_require_known call from the `[0-9]*:*)` arm →
  // exit 0, three worktrees, a full tmux log. Red on the other three.
  const p = launchableProject(t);
  const sh = shim(t);
  const r = launch(p, ['3', '--engine', '2:codek'], sh);

  assert.equal(r.code, 1, 'must exit non-zero');
  assert.match(r.out, /unknown engine 'codek'/, 'the refusal must name the ENGINE, not the pane number');
  assert.match(r.out, /--engine 2:codek/, 'and must name the token it came from');
  assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, 'no worktree may be created');
  // Parse time is before the program does anything, so today this is literally
  // zero tmux calls. Asserted as "changed nothing" rather than "called nothing"
  // so that adding a read-only probe to the router is not a test failure.
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'nothing may reach tmux after a parse-time refusal');

  // AT PARSE TIME, and that word is the whole finding. Launch commands also
  // resolve and validate every pane before they build anything, so deleting the
  // router's check changes nothing observable about a launch — the refusal just
  // arrives from somewhere else and looks identical. A command that resolves no
  // pane at all is what tells the two apart: `help` prints and exits 0 if the
  // flag was never validated where it was PARSED.
  const viaHelp = launch(p, ['help', '--engine', '2:codek'], sh);
  assert.equal(viaHelp.code, 1, 'the flag is refused whatever command follows it');
  assert.match(viaHelp.out, /unknown engine 'codek'/);
  assert.doesNotMatch(viaHelp.out, /Usage:/, 'and the refusal comes before the command runs');
});
