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
 * The interpreter bin/warroom's shebang names. On macOS that is 3.2.57 — the
 * founder's shell — and `bash` on PATH is very often Homebrew's 5.x, so a
 * harness that spawned `bash` was testing an interpreter the launcher never
 * runs under: `mapfile` and every other bash-4 builtin passed here and failed
 * on the machine. Pinned to the shebang's path wherever it exists; a Linux CI
 * runner has /bin/bash too, and there it is simply the bash there is.
 */
const BASH = fs.existsSync('/bin/bash') ? '/bin/bash' : 'bash';

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
 *   - it is a LITERAL and consults no environment variable. It used to be read through
 *     `${WARROOM_CEO_PREAMBLE:-…}`, with the launcher exporting the path server-wide via
 *     `tmux setenv -g`; two war rooms on one tmux server then handed a Codex pane the
 *     OTHER project's brief, and any inherited value outranked the literal. See the
 *     test on concurrent war rooms below.
 *
 * Kept as one constant because several tests match it and a locator duplicated is a
 * locator that gets half-updated.
 */
const CODEX_PREAMBLE_IN_LINE = /\$\(cat "([^"$]*ceo\.codex\.md)"\)/;

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
    const out = execFileSync(BASH, [WARROOM, '--config', p.config, ...args], {
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
  // `$(cat %s)` → the delivery assertion goes red first, then the locator. Confirmed.
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
  const rendered = path.join(p.home, '.proj', 'entry', 'ceo.codex.md');
  assert.ok(/\s/.test(rendered), 'the path under test must contain a space');
  const valueExpr = cmd.slice(cmd.indexOf('developer_instructions=') + 'developer_instructions='.length);
  const env = { ...process.env };
  delete env.WARROOM_CEO_PREAMBLE;
  let delivered;
  try {
    delivered = execFileSync(BASH, ['-c', `printf '%s' ${valueExpr}`], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] });
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

test('the codex line names the preamble path literally and consults NO environment variable', (t) => {
  // ONE mechanism, on purpose. The line used to read the path through
  // `${WARROOM_CEO_PREAMBLE:-<literal>}`, and engine_prepare exported it with
  // `tmux setenv -g` — server-global, so with two war rooms on one tmux server
  // the last one to prepare won and a Codex pane in project A read project
  // B's brief. The `:-` fallback was the same race from the pane's side: any
  // inherited value outranked the literal. The literal is per-invocation and
  // per-project, so there is nothing to share and nothing to race.
  //
  // MUTATION: restore `${WARROOM_CEO_PREAMBLE:-%s}` in engine_launch_cmd's
  // codex arm → red on the first assertion. Restore the `tmux setenv -g` in
  // engine_prepare → red on the last one.
  const p = launchableProject(t);
  const sh = shim(t);
  const r = launch(p, ['1', '--engine', 'codex'], sh);
  assert.equal(r.code, 0, r.out);
  const line = launchLines(r.calls).get('proj:CEO-1');
  assert.doesNotMatch(line, /\$[A-Za-z_{]/, `the launch line must expand no variable: ${line}`);
  const m = line.match(CODEX_PREAMBLE_IN_LINE);
  assert.ok(m && fs.existsSync(m[1]), `the literal must be a real path a pane could read: ${line}`);
  assert.deepEqual(
    r.calls.filter((c) => /^set-?env/.test(c[0])),
    [],
    'nothing may be exported into the tmux server — that is the shared state two war rooms race on'
  );
});

test('two war rooms on one tmux server: a codex pane gets ITS project\'s brief, whatever the server holds', (t) => {
  // Models the race directly. Project B has already prepared: the tmux
  // server's environment carries WARROOM_CEO_PREAMBLE pointing at B's brief,
  // and every pane A forks inherits it. A's launch line is then expanded by a
  // real bash under exactly that environment, and what it delivers must be
  // A's brief.
  //
  // MUTATION: restore `${WARROOM_CEO_PREAMBLE:-%s}` in engine_launch_cmd →
  // B's brief is delivered to A's pane, with nothing printed. Red.
  const other = project(t, { preamble: 'PROJECT_B_BRIEF must never reach project A' });
  const otherBrief = path.join(other.home, 'b-ceo.codex.md');
  fs.writeFileSync(otherBrief, 'PROJECT_B_BRIEF must never reach project A');

  const p = launchableProject(t, { preamble: 'PROJECT_A_BRIEF is the one this pane must read.' });
  const sh = shim(t);
  const r = launch(p, ['1', '--engine', 'codex'], sh, { env: { WARROOM_CEO_PREAMBLE: otherBrief } });
  assert.equal(r.code, 0, r.out);
  const line = launchLines(r.calls).get('proj:CEO-1');
  const valueExpr = line.slice(line.indexOf('developer_instructions=') + 'developer_instructions='.length);
  const delivered = execFileSync(BASH, ['-c', `printf '%s' ${valueExpr}`], {
    encoding: 'utf8',
    env: { ...process.env, WARROOM_CEO_PREAMBLE: otherBrief },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.match(delivered, /PROJECT_A_BRIEF is the one this pane must read\./, 'A must get its own brief');
  assert.doesNotMatch(delivered, /PROJECT_B_BRIEF/, "B's brief reached A's pane — this is the setenv race");
});

// ── engine_prepare fails OUT LOUD, and the run stops ─────────────────────

test('a codex preamble that cannot be written refuses the launch before tmux builds anything', (t) => {
  // engine_prepare used to `return 1` with no message on the codex write path
  // and on the unknown-engine arm, and engines_prepare swallowed it with
  // `|| true`. The pane then typed `codex -c developer_instructions="$(cat
  // <missing>)"`: Codex came up with no CEO brief and no error, which is the
  // one failure this file says it refuses.
  //
  // The write is made to fail by putting a regular FILE where the `entry`
  // directory must go, so `mkdir -p` fails whoever runs it.
  //
  // MUTATION: `engines_prepare || exit 1` → `engines_prepare || true` in
  // cmd_start, AND drop the `[ ! -s "$f" ]` backstop in engine_launch_cmd →
  // the session is built and the cat-of-a-missing-file line is typed. Red on
  // builds-nothing and on the typed-line assertion.
  // MUTATION: only the `|| true` in cmd_start → the backstop refuses pane 2's
  // line, but by then the worktrees and the session exist and pane 1's
  // `claude` has been typed. Red on the typed-line assertion first, then
  // builds-nothing. Measured; a backstop at the seam is not a refusal up front.
  // MUTATION: `engine_prepare … || failed=1` → `|| true` in engines_prepare →
  // same as the previous one.
  const p = launchableProject(t);
  const stateDir = path.join(p.home, '.proj');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'entry'), 'not a directory');
  const sh = shim(t);
  const r = launch(p, ['2', '--engine', '2:codex'], sh);

  assert.notEqual(r.code, 0, `must refuse: ${r.out}`);
  assert.match(r.err, /✗/, 'the refusal must be a diagnostic, not a silent exit');
  assert.match(r.err, /preamble/i, 'and say what could not be written');
  assert.deepEqual(r.calls.filter((c) => c[0] === 'send-keys'), [], 'no line may be typed into any pane');
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'a run that cannot brief its panes must build nothing');
  assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, 'and create no worktree');

  // The control: the same broken state_dir with no Codex pane launches fine —
  // Claude has no preamble file, so the refusal above is about the write and
  // not about the fixture.
  const sh2 = shim(t);
  const ok = launch(p, ['2'], sh2);
  assert.equal(ok.code, 0, `an all-claude run must not be refused for a codex-only failure: ${ok.out}`);
  assert.equal(launchLines(ok.calls).get('proj:CEO-2'), 'claude');
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
  '#   has-session  → @HAS_SESSION@ (1 = no session running, 0 = one is)',
  '#   capture-pane → a ready prompt, so both ready-waits return immediately',
  '#   list-windows → the CEO windows cmd_start greps for before it injects',
  '# Everything else is a no-op success, which is what tmux looks like to this',
  '# program: it never reads tmux back except through those three.',
  '{ for a in "$@"; do printf \'%s\\037\' "$a"; done; printf \'\\036\'; } >> "@LOG@"',
  '@PANE_EXEC@',
  'case "$1" in',
  '  has-session)  exit @HAS_SESSION@ ;;',
  '  capture-pane) printf \'❯ \\n\' ;;',
  '  list-windows) @WINDOWS@ ;;',
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
/**
 * What a pane's shell does with the line tmux typed into it. Off by default,
 * because most tests want to READ the line rather than run it.
 *
 * This is the SECOND PARSE the config charset rule exists to protect, and
 * modelling it is what turns "the launcher exited non-zero" into "and here is
 * what would have happened if it had not". Measured: with `_cfg_checked`
 * neutered, a `$(…)` in `session` or in `state_dir` fires here and nowhere
 * else in this harness.
 */
const PANE_EXEC = 'case "$1$5" in "send-keysEnter") ( eval "$4" ) >/dev/null 2>&1 ;; esac';

function shim(
  t,
  { engines = ['claude', 'codex'], sessionExists = false, executePaneLines = false, windows = null } = {}
) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'warroom-shim-'));
  const log = path.join(bin, 'tmux-argv.log');
  // `windows` names the CEO windows a running session holds. The default 1..8 is
  // what cmd_start greps its own freshly-made windows out of; a test about a
  // session with a GAP in its CEO numbers has to say so.
  const windowsCase = windows
    ? `printf '%s\\n' ${windows.map((w) => `'${w}'`).join(' ')}`
    : 'i=1; while [ "$i" -le 8 ]; do echo "CEO-$i"; i=$((i+1)); done';
  // `sessionExists` is what makes "a refused restore destroys nothing" a real
  // assertion. With no session running, cmd_restore skips its kill-session
  // unconditionally, so a validation placed BELOW that kill would still record
  // no kill and the test would pass on the code it exists to reject.
  fs.writeFileSync(
    path.join(bin, 'tmux'),
    FAKE_TMUX.replace('@LOG@', log)
      .replace(/@HAS_SESSION@/g, sessionExists ? '0' : '1')
      .replace('@PANE_EXEC@', executePaneLines ? PANE_EXEC : ':')
      .replace('@WINDOWS@', windowsCase)
  );
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
const gitIn = (p, ...a) =>
  execFileSync('git', ['-C', p.dir, '-c', 'commit.gpgsign=false', ...a], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    // The founder's own git config must not reach a test fixture: a global
    // hooksPath or signing key would make this pass or fail per machine.
    env: { ...process.env, HOME: p.home, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' },
  });

function launchableProject(t, opts = {}) {
  const p = project(t, opts);
  fs.rmSync(path.join(p.dir, '.git'), { recursive: true, force: true });
  gitIn(p, 'init', '-q', '-b', 'main');
  gitIn(p, 'config', 'user.email', 'warroom-test@example.invalid');
  gitIn(p, 'config', 'user.name', 'warroom test');
  gitIn(p, 'commit', '-q', '--allow-empty', '-m', 'init');
  return p;
}

/**
 * A launchable project plus a session snapshot for cmd_restore to read, and a
 * real `ceo-*` branch for every entry that names one.
 *
 * The branches matter: cmd_restore skips an entry whose branch does not exist,
 * with its own message. A fixture without them would see the corrupt entry
 * skipped for the wrong reason, and the test would pass having proved nothing
 * about the pane-number guard it is aimed at.
 *
 * `entries` is `[{ n, branch, session_id?, engine? }]`, and every field is
 * deliberately free-form: a snapshot is DATA read back off disk, not argv,
 * which is the whole reason cmd_restore has to guard it.
 */
function restorableProject(t, entries) {
  const p = launchableProject(t);
  for (const b of new Set(entries.map((e) => e.branch))) gitIn(p, 'branch', b, 'main');
  const ceos = entries.map(({ n, branch, session_id = '', engine }) => ({
    n,
    branch,
    wt_path: path.join(p.dir, '.worktrees', branch),
    task: '',
    start_ts: 0,
    session_id,
    ...(engine === undefined ? {} : { engine }),
  }));
  const snaps = path.join(p.home, '.proj', 'snapshots');
  fs.mkdirSync(snaps, { recursive: true });
  fs.writeFileSync(
    path.join(snaps, '2026-01-01-000000.json'),
    JSON.stringify({ saved_at: 1767225600, project_dir: p.dir, grid_mode: false, ceos }, null, 2)
  );
  return p;
}

/**
 * A launchable project whose .warroom.yml is rewritten with `overrides` merged
 * over the defaults, so ONE value can be made hostile.
 *
 * project()'s `configExtra` cannot do this: `_cfg` takes the FIRST matching
 * line, so an appended `session:` never wins and the test would silently be
 * exercising the safe value.
 */
function configuredProject(t, overrides) {
  const p = launchableProject(t);
  const cfg = {
    session: 'proj',
    project_dir: p.dir,
    state_dir: path.join(p.home, '.proj'),
    ...overrides,
  };
  fs.writeFileSync(
    p.config,
    Object.entries(cfg)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n') + '\n'
  );
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
function launch(p, args, sh, { env = {} } = {}) {
  const seq = runSeq++;
  const outFile = path.join(p.home, `run-${seq}.out`);
  const errFile = path.join(p.home, `run-${seq}.err`);
  const outFd = fs.openSync(outFile, 'w');
  const errFd = fs.openSync(errFile, 'w');
  // TMUX is pinned OFF unless a caller asks otherwise. It leaks in from
  // whoever ran the suite — a founder running `npm test` inside their own war
  // room has it set, a CI runner does not — and bin/warroom branches on it.
  // Inheriting it would make these tests pass or fail by where they were run.
  const r = spawnSync(BASH, [WARROOM, '--config', p.config, ...args], {
    env: { ...process.env, HOME: p.home, PATH: sh.path, TMPDIR: p.home, TMUX: '', ...env },
    stdio: ['ignore', outFd, errFd],
    timeout: 90_000,
  });
  fs.closeSync(outFd);
  fs.closeSync(errFd);
  const stdout = fs.readFileSync(outFile, 'utf8');
  const stderr = fs.readFileSync(errFile, 'utf8');
  // `out` stays the two streams together, because most assertions here do not
  // care which one a message came out of. `err` is separate for the ones that
  // do: a refusal printed to stdout is invisible to a caller that redirects it,
  // and this launcher is run from shims and scripts.
  return { code: r.status, out: stdout + stderr, err: stderr, calls: tmuxCalls(sh) };
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
  const r = spawnSync(BASH, ['-c', src], {
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
  // `CEO-08` is the row that `^[0-9]+$` let through: the number is a bash
  // subscript downstream, where `08` is a fatal arithmetic error.
  for (const target of ['proj:HQ', 'proj:CEO-.1', 'proj:CEO-x.1', 'proj:CEO-08.1', 'proj:GRID.010']) {
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

  // The control: the same call, the same shim, a target it CAN read. Prepared
  // first, as every launching command does — a Codex line refuses to name a
  // preamble file that was never written.
  const ok = warroomEval(p, 'engines_resolve 1 && engines_prepare && send_launch_engine "proj:CEO-1"', {
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

// ── Restore: refuse the whole thing, and destroy nothing ─────

test('a corrupt snapshot entry refuses the WHOLE restore, building nothing and destroying nothing', (t) => {
  // A snapshot is DATA read back off disk, so cmd_restore validates every pane
  // number it names BEFORE it builds or destroys anything, and one bad entry
  // refuses the whole restore. Skip-and-continue was considered and rejected: a
  // war room that is running and silently missing a CEO is the same
  // indistinguishable-from-working failure the engine refusal exists to
  // prevent, one level up. Nobody re-reads a restored session to count panes.
  //
  // DESTROYS NOTHING is the half that is easy to get wrong, and it is why
  // `sessionExists: true` is set below. cmd_restore kills a running session
  // before it rebuilds. Validation placed after that kill would destroy the
  // founder's live war room and THEN refuse to build the replacement — strictly
  // worse than either failure alone, because the corrupt snapshot costs them
  // the session they still had. With no session running the kill is skipped
  // anyway, so a test without this flag would pass on exactly that code.
  //
  // MUTATION: move the `if [ -n "$snapshot_bad" ]` refusal block from above the
  // kill-session to below it → a kill-session is recorded before the refusal.
  // Red on the destroys-nothing assertion and ONLY on that one, which is why it
  // is separate from builds-nothing rather than folded into one check.
  // MUTATION: delete the refusal block → the restore proceeds, the corrupt
  // entry reaches send_launch_engine, and it exits there instead. Red on
  // builds-nothing and on destroys-nothing.
  // MUTATION: `exit 1` → `exit 0` in the refusal → red on the status.
  // MUTATION: drop the line that prints `$snapshot_bad` → the refusal still
  // refuses but stops naming WHICH entry it could not place. Red on 'x'.
  // MUTATION: drop the `>&2` from the refusal's echoes → red on the stderr
  // assertions alone. A refusal on stdout is invisible to a caller that
  // redirects it, and this launcher is run from shims and scripts.
  const p = restorableProject(t, [
    { n: 1, branch: 'ceo-1' },
    // The branch for this one EXISTS, so the pane number is the only thing
    // wrong with it and the only thing that can cause the refusal.
    { n: 'x', branch: 'ceo-x' },
    { n: 3, branch: 'ceo-3' },
  ]);
  const sh = shim(t, { sessionExists: true });
  const r = launch(p, ['restore', 'latest', '--engine', '3:codex'], sh);

  assert.equal(r.code, 1, `a corrupt snapshot must refuse the restore: ${r.out}`);

  // BUILDS NOTHING — not "the corrupt pane was skipped", but no pane at all, so
  // there is no half-built session to clean up and no partial war room to
  // mistake for a whole one.
  assert.deepEqual(
    r.calls.filter((c) => c[0] === 'send-keys').map((c) => c[2]),
    [],
    'a refused restore must launch nothing, not even the entries it could read'
  );

  // DESTROYS NOTHING — the session the founder still has must survive a
  // snapshot that cannot be read.
  assert.deepEqual(
    r.calls.filter((c) => c[0] === 'kill-session'),
    [],
    'a refused restore must not kill the running session it declined to replace'
  );

  // And nothing else moved either: no window, no setenv, no layout.
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'a refused restore must change nothing in tmux');

  // Nor on disk. cmd_restore recreates missing worktrees as it goes, so
  // "builds nothing" has to mean the filesystem too — a refused restore that
  // still left three checkouts behind would be building something.
  assert.equal(
    fs.existsSync(path.join(p.dir, '.worktrees')),
    false,
    'a refused restore must not recreate worktrees either'
  );

  // It named what it could not place, on STDERR. Asserted as properties rather
  // than as a sentence: this message's wording has already changed twice during
  // review, and a test that pins prose makes the next improvement to it look
  // like a regression.
  assert.match(r.err, /'x'/, 'the refusal must name the identifier it could not place');
  assert.match(r.err, /refus/i, 'and must say that it is refusing');
  assert.match(r.err, /restore/i, 'and what it is refusing');
});

// ── A pane number is a bash SUBSCRIPT, and a subscript is an arithmetic context ──
//
// `WARROOM_PANE_ENGINES[$n]` evaluates `$n`. Under /bin/bash 3.2.57 a `$(…)`
// there is a fatal syntax error and `08` is a fatal "value too great for
// base" — both abort the program mid-command; `010` is octal 8 and quietly
// puts an engine on pane 8. `^[0-9]+$` accepted the last two. The pane
// numbers that arrive as DATA — a tmux window name, a snapshot entry, an
// --engine token — are read through one predicate before they are anything
// else, and these tests feed each door the shapes that predicate exists for.

test('the grid subcommand refuses a window whose name is not a CEO number, before any subscript sees it', (t) => {
  // MUTATION: delete the `pane_number_require "${_wname#CEO-}" …` line in
  // cmd_grid_view → the value travels unquoted in `$grid_ns` to
  // engines_resolve, whose own gate refuses it — but by then it has been
  // word-split, and the refusal names `'$(touch'` rather than the window.
  // Red on the naming assertion. Measured, and recorded because it is a
  // different failure from the one first written here (a bash abort): the
  // second gate is what makes the first one's absence a wrong MESSAGE rather
  // than an evaluated subscript.
  for (const [label, name] of [
    ['command substitution', (c) => `CEO-$(touch ${c})`],
    ['a leading zero', () => 'CEO-08'],
  ]) {
    const p = runningSession(t, [{ n: 1, engine: 'claude' }], { engine: 'claude' });
    const canary = path.join(p.home, `FIRED-grid-${label.replace(/\W+/g, '-')}`);
    const hostile = name(canary);
    const sh = shim(t, { sessionExists: true, windows: ['CEO-1', hostile] });
    const r = launch(p, ['grid'], sh);

    assert.equal(fs.existsSync(canary), false, `${label}: nothing may be evaluated`);
    assert.notEqual(r.code, 0, `${label}: must refuse: ${r.out}`);
    assert.ok(r.err.includes(`'${hostile}'`), `${label}: the refusal must name the window: ${r.err}`);
    assert.match(r.err, /not a pane number/, `${label}: and say why`);
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${label}: a refused grid must build nothing`);
  }
});

test('--engine N:E refuses a leading zero, at parse time, whatever the command', (t) => {
  // `[ "$_pane" -lt 1 ]` is false for `08` and `010`, so the old check passed
  // them to a loop where `08:codex` matched no pane and was dropped in silence
  // — the founder asked for Codex on pane 8 and got Claude, with nothing
  // printed. Same failure class as `2x:codex`, which the router already
  // refuses.
  // MUTATION: `if ! pane_number_ok "$_pane"` → `if [ "$_pane" -lt 1 ]` → both
  // rows exit 0 and print three claude panes. Red.
  const p = project(t);
  for (const tok of ['08:codex', '010:codex']) {
    const r = warroom(p, ['engine', '3', '--engine', tok]);
    assert.equal(r.code, 1, `${tok}: must be refused: ${r.out}`);
    assert.match(r.err, /leading zero/, `${tok}: and say why: ${r.err}`);
    assert.equal(panes(r).length, 0, `${tok}: must not resolve any pane after refusing`);
  }
});

test('--engine 0:codex is refused with the message that panes are numbered from 1', (t) => {
  // MUTATION: `if ! pane_number_ok "$_pane"` → `if false` → `0:codex` is
  // accepted, matches no pane, and three claude panes print with exit 0. Red.
  const p = project(t);
  const r = warroom(p, ['engine', '3', '--engine', '0:codex']);
  assert.equal(r.code, 1, `must be refused: ${r.out}`);
  assert.match(r.err, /panes are numbered from 1/);
  assert.equal(panes(r).length, 0, 'must not resolve any pane after refusing');
});

test('a snapshot pane number with a leading zero refuses the whole restore, and names the entry', (t) => {
  // The python gate is pane_number_ok in another language, and two predicates
  // for one question disagree exactly once. This is the row they used to
  // disagree on: `re.fullmatch(r'[0-9]+', '08')` matched, bash then aborted.
  // MUTATION: `[1-9][0-9]*` → `[0-9]+` in both python calls of cmd_restore →
  // `08` reaches engines_resolve, whose own gate refuses it with "from the
  // panes named to engines_resolve": still non-zero, still nothing built,
  // still before the kill — but the founder is told about an internal call
  // and not which snapshot entry to fix. Red on the `entry #` assertion, and
  // on that one only, which is why it is asserted.
  for (const bad of ['08', '010']) {
    const p = restorableProject(t, [
      { n: 1, branch: 'ceo-1' },
      { n: bad, branch: `ceo-${bad}` },
    ]);
    const sh = shim(t, { sessionExists: true });
    const r = launch(p, ['restore', 'latest'], sh);
    assert.notEqual(r.code, 0, `${bad}: must refuse: ${r.out}`);
    assert.ok(r.err.includes(`'${bad}'`), `${bad}: the refusal must name the value: ${r.err}`);
    assert.match(r.err, /entry #1/, `${bad}: and point at the snapshot entry, not at an internal call: ${r.err}`);
    assert.match(r.err, /not a pane number/);
    assert.deepEqual(r.calls.filter((c) => c[0] === 'kill-session'), [], 'the running session must survive');
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'and nothing may be built');
  }
});

// ── A snapshot's session_id reaches a pane's shell, so it is judged first ──
//
// cmd_restore splices session_id into `claude --resume <id>` / `codex resume
// <id>` and types the result into a live pane. The pane number had a gate; the
// id, read off the same file three lines later, had none. The fake tmux here
// EVALS what it is told to type, so the assertion is on the effect and not on
// the exit code: a launcher that refused AFTER typing would exit non-zero
// having already run the payload.

const HOSTILE_SESSION_IDS = [
  ['a semicolon', (c) => `abc; touch ${c}`],
  ['command substitution', (c) => `$(touch ${c})`],
  ['backticks', (c) => `\`touch ${c}\``],
];

for (const [label, make] of HOSTILE_SESSION_IDS) {
  test(`a snapshot session_id carrying ${label} is refused before anything is built, destroyed or typed`, (t) => {
    // MUTATION: delete the `sid` lines from the up-front python check AND the
    // in-loop `session_id_ok` backstop AND the one in engine_launch_cmd → the
    // restore proceeds, `claude --resume abc; touch …` is typed, the fake tmux
    // evals it, and the canary appears. Red on the effect assertion first.
    // MUTATION: delete only the up-front python lines → the in-loop backstop
    // fires instead, but by then the running session has been killed: red on
    // the destroys-nothing assertion and on nothing else. That is the reason
    // the check is up front and not merely present.
    const p = restorableProject(t, [{ n: 1, branch: 'ceo-1' }]);
    const canary = path.join(p.home, `FIRED-${label.replace(/\W+/g, '-')}`);
    const snap = path.join(p.home, '.proj', 'snapshots', '2026-01-01-000000.json');
    const d = JSON.parse(fs.readFileSync(snap, 'utf8'));
    d.ceos[0].session_id = make(canary);
    fs.writeFileSync(snap, JSON.stringify(d));

    const sh = shim(t, { sessionExists: true, executePaneLines: true });
    const r = launch(p, ['restore', 'latest'], sh);

    assert.equal(fs.existsSync(canary), false, `${label}: the payload must never reach a shell`);
    assert.notEqual(r.code, 0, `${label}: and the restore must refuse: ${r.out}`);
    assert.deepEqual(r.calls.filter((c) => c[0] === 'send-keys'), [], 'nothing may be typed into any pane');
    assert.deepEqual(r.calls.filter((c) => c[0] === 'kill-session'), [], 'the running session must survive');
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'a refused restore must change nothing in tmux');
    assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, 'and recreate no worktree');
    assert.match(r.err, /session_id/, 'the refusal must say which field it could not use');
    assert.match(r.err, /refus/i);
  });
}

test('a well-formed session_id is resumed, on both engines', (t) => {
  // The control: the id charset that Claude and Codex actually produce
  // (UUIDs, and Codex thread ids with the same alphabet) must still resume.
  // MUTATION: none needed; this is the negative half of the pair.
  const p = restorableProject(t, [
    { n: 1, branch: 'ceo-1', session_id: '0d3a9e2c-4b1f-4a6e-9c1d-2f7e8a9b0c1d' },
    { n: 2, branch: 'ceo-2', session_id: 'thread_019abc.DEF-xyz' },
  ]);
  const sh = shim(t);
  const r = launch(p, ['restore', 'latest', '--engine', '2:codex'], sh);
  assert.equal(r.code, 0, r.out);
  const lines = launchLines(r.calls);
  assert.equal(lines.get('proj:CEO-1.1'), 'claude --resume 0d3a9e2c-4b1f-4a6e-9c1d-2f7e8a9b0c1d');
  assert.equal(lines.get('proj:CEO-2.1'), 'codex resume thread_019abc.DEF-xyz');
});

// ── .warroom.yml is INPUT, and the charset rule is the control ───────────
//
// The injection fix has two halves and only one of them had a test. The
// QUOTING half is covered above, by the state_dir-with-a-space case. The
// CHARSET half — `_cfg_checked` refusing a shell metacharacter at parse time,
// before any path derived from a value is built — was asserted by a comment and
// by nothing else. Replacing its body with a plain `_cfg` reintroduced
// arbitrary code execution while the whole suite stayed green, which is this
// repo's named failure class: a security control that can be deleted without
// anything going red.

/** Each metacharacter, and a payload that would create `@C@` if it ever ran. */
const SHELL_PAYLOADS = [
  ['command substitution', '$(touch @C@)'],
  ['backticks', '`touch @C@`'],
  ['a semicolon', '; touch @C@'],
];

test('a shell metacharacter in a config value is refused at parse time, whatever the command', (t) => {
  // Every key that `_cfg_checked` guards, against every metacharacter. `help`
  // is the command precisely because it is the most harmless one there is: the
  // config is parsed before the router dispatches, so the refusal must not
  // depend on what was asked for.
  // MUTATION: replace _cfg_checked's body with `_cfg "$1"` → every one of these
  // exits 0. Red.
  // MUTATION: drop the `|| exit 1` from
  // `PROJECT_STATE_DIR="$(_cfg_checked state_dir path)"` → _cfg_checked's own
  // `exit 1` ends only the command substitution, the status is discarded, the
  // variable is empty, and the `[ -z … ] && <default>` line below silently
  // supplies a default. The run continues and exits 0. Red.
  //
  // MEASURED AND SURVIVING, recorded because it corrects a comment in
  // bin/warroom: the same mutation applied to the SESSION assignment changes
  // nothing observable. `session` and `project_dir` are followed by an
  // emptiness check that exits 1 on its own, and _cfg_checked's message has
  // already reached stderr from inside the substitution. So `|| exit 1` is
  // load-bearing on state_dir, display_name and entry_ceo, and inert on the
  // two the comment above it calls out by example. Not a hole in this test —
  // there is no behaviour there to assert.
  const p = configuredProject(t, {});
  for (const [key, kind] of [
    ['session', 'name'],
    ['state_dir', 'path'],
    ['entry_ceo', 'path'],
  ]) {
    for (const [label, payload] of SHELL_PAYLOADS) {
      const canary = path.join(p.home, `CANARY-${key}-${label.replace(/\W+/g, '-')}`);
      fs.writeFileSync(
        p.config,
        Object.entries({
          session: 'proj',
          project_dir: p.dir,
          state_dir: path.join(p.home, '.proj'),
          [key]: `${key === 'session' ? 'proj' : path.join(p.home, 'x')}${payload.replace('@C@', canary)}`,
        })
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n') + '\n'
      );
      const r = warroom(p, ['help']);
      assert.notEqual(r.code, 0, `${key} (${kind}) with ${label} must be refused: ${r.out}`);
      assert.equal(fs.existsSync(canary), false, `${key} with ${label}: nothing may run`);
      assert.ok(r.err.includes(`'${key}'`), `the refusal must name the key: ${r.err}`);
      assert.match(r.err, /refused, not quoted/, 'and say why it is refused rather than escaped');
    }
  }
});

test('an ordinary config passes, including the characters the rule deliberately allows', (t) => {
  // The control, and it guards the rule from the other side. Without it every
  // assertion above is equally satisfied by a launcher that refuses every
  // config it is given — and a charset tightened until it is "safe" would break
  // a founder whose $HOME has a space in it, which the rule allows on purpose.
  // MUTATION: drop the space from the `path` character class, i.e.
  // `*[!A-Za-z0-9._/~+-]*` → this refuses and goes red, while every refusal
  // assertion above still passes.
  const p = configuredProject(t, {});
  const dir = path.join(p.home, 'a dir+with-allowed.chars');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    p.config,
    `session: proj\nproject_dir: ${p.dir}\nstate_dir: ${dir}\n`
  );

  const r = warroom(p, ['engine', '2']);
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(
    panes(r).map((x) => x.engine),
    ['claude', 'claude']
  );
});

test('the charset rule is what stops the injection: the payload never runs', (t) => {
  // The assertion the exit code cannot make. A non-zero exit says the launcher
  // stopped; it does not say the payload had not already fired on the way.
  //
  // The canary is real here and MEASURED, not assumed. With _cfg_checked's body
  // replaced by `_cfg "$1"`, and the fake tmux executing what it was told to
  // type: `state_dir` fires through the codex launch line's quoted `$(cat
  // "<path>")`, and `session` fires through the HQ line,
  // which splices ${SESSION} into a string a pane's shell parses. Both were
  // watched firing before this test was written.
  //
  // `entry_ceo` is deliberately NOT canaried: it is only ever read with a
  // quoted `cat`, reaches no pane line, and its canary did not fire under the
  // mutant. Asserting it here would look like coverage and be worth nothing —
  // which is the exact defect this test exists to close. Its refusal is
  // covered above.
  //
  // MUTATION: replace _cfg_checked's body with `_cfg "$1"` → the canary FIRES
  // and the run exits 0. Red on the first assertion, which is the effect one.
  for (const [key, args, prefix] of [
    ['state_dir', ['1', '--engine', 'codex'], 'st'],
    ['session', ['1'], 'proj'],
  ]) {
    const p = launchableProject(t);
    const canary = path.join(p.home, `FIRED-${key}`);
    const base = key === 'session' ? prefix : path.join(p.home, prefix);
    fs.writeFileSync(
      p.config,
      Object.entries({
        session: 'proj',
        project_dir: p.dir,
        state_dir: path.join(p.home, '.proj'),
        [key]: `${base}$(touch ${canary})`,
      })
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n') + '\n'
    );

    const sh = shim(t, { executePaneLines: true });
    const r = launch(p, args, sh);

    // EFFECT FIRST. If the payload ran, nothing else about this run matters.
    assert.equal(fs.existsSync(canary), false, `${key}: the payload must never reach a shell`);
    assert.notEqual(r.code, 0, `${key}: and the launcher must refuse`);
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${key}: a refused config must build nothing`);
    assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, `${key}: and create no worktree`);
  }
});

// ── The charset bounds the SHELL; confinement bounds the TARGET ───────────
//
// `~/.ssh/id_rsa` is made entirely of characters the path charset allows, and
// entry_ceo is `cat`'d into the CEO preamble, which is pasted into a Claude
// pane and put on a Codex command line — both shipped to a model provider. So
// a git-tracked .warroom.yml could read any file the founder can. The charset
// rule was the complete defence against a metacharacter and no defence at all
// against this, and the two are asserted separately so neither can stand in
// for the other.
//
// THE SINK IS EXERCISED, not assumed. `engine render` prints exactly what a
// pane is pasted; the launch path writes the same rendering to the Codex
// preamble file and types a line that reads it. The assertion is that the
// secret's CONTENT reaches none of them — a non-zero exit alone would also be
// satisfied by a launcher that read the file and then fell over.

const SECRET = 'SECRET_SENTINEL_9f1c the contents of a file outside the project';

/** A project whose HOME holds a secret file the config is about to point at. */
function projectWithSecret(t, entryCeo, { symlink = null } = {}) {
  const p = project(t);
  fs.writeFileSync(path.join(p.home, 'SECRET'), SECRET);
  if (symlink) fs.symlinkSync(symlink.target(p), path.join(p.dir, '.claude', 'entry', symlink.name));
  fs.appendFileSync(p.config, `entry_ceo: ${entryCeo(p)}\n`);
  return p;
}

const HOSTILE_ENTRY_CEO = [
  ['a `..` component', (p) => '../SECRET'],
  ['an absolute path outside the project', (p) => path.join(p.home, 'SECRET')],
  ['a `~` path', () => '~/SECRET'],
  [
    'a symlinked FILE inside the project pointing out of it',
    () => '.claude/entry/link.md',
    { name: 'link.md', target: (p) => path.join(p.home, 'SECRET') },
  ],
  [
    'a symlinked DIRECTORY inside the project pointing out of it',
    () => '.claude/entry/dirlink/SECRET',
    { name: 'dirlink', target: (p) => p.home },
  ],
];

test('entry_ceo cannot point outside the project: the file is never read into a preamble', (t) => {
  // Two layers guard this key and they OVERLAP on purpose, so the mutations
  // are recorded as measured rather than as hoped:
  // MUTATION: delete the `_require_inside entry_ceo …` line → the two symlink
  // rows print the secret while the lexical three stay refused. Red.
  // MUTATION: `_cfg_checked entry_ceo under "$PROJECT_DIR"` → `_cfg_checked
  // entry_ceo path` plus the old `case … /*) : ;;` passthrough, ALONE → still
  // GREEN: the physical check resolves `..`, `~` and an absolute path outside
  // the project just as it resolves a symlink, and refuses them all. The
  // lexical rule is load-bearing on state_dir, which has no physical check
  // (see below), and is belt-and-braces here.
  // MUTATION: both of the above together → every row prints the secret and
  // exits 0. Red on all five, on the content assertion first.
  for (const [label, value, symlink] of HOSTILE_ENTRY_CEO) {
    const p = projectWithSecret(t, value, { symlink });
    for (const eng of ['claude', 'codex']) {
      const r = warroom(p, ['engine', 'render', eng]);
      assert.doesNotMatch(r.out, /SECRET_SENTINEL_9f1c/, `${label} (${eng}): the secret must not be rendered`);
      assert.notEqual(r.code, 0, `${label} (${eng}): and the launcher must refuse`);
      assert.ok(r.err.includes("'entry_ceo'"), `${label}: the refusal must name the key: ${r.err}`);
    }
  }
});

test('a hostile entry_ceo on the real launch path reaches no pane, no preamble file and no tmux argv', (t) => {
  // The other two sinks. A Claude pane is pasted the preamble with
  // `send-keys -l`; a Codex pane gets it written to $state_dir/entry/ceo.codex.md
  // and a launch line that cats it. Both are recorded by the fake tmux, so the
  // secret is searched for in EVERY argument tmux was ever given, and in the
  // file the codex line would have read.
  // MUTATION: as above → the paste for CEO-1 and the preamble file for CEO-2
  // both carry the secret. Red.
  const p = launchableProject(t);
  fs.writeFileSync(path.join(p.home, 'SECRET'), SECRET);
  fs.appendFileSync(p.config, 'entry_ceo: ../SECRET\n');
  const sh = shim(t);
  const r = launch(p, ['2', '--engine', '2:codex'], sh);

  assert.notEqual(r.code, 0, `must refuse: ${r.out}`);
  const everyArg = r.calls.flat().join('\n');
  assert.doesNotMatch(everyArg, /SECRET_SENTINEL_9f1c/, 'the secret must reach no tmux argument');
  const rendered = path.join(p.home, '.proj', 'entry', 'ceo.codex.md');
  if (fs.existsSync(rendered)) {
    assert.doesNotMatch(fs.readFileSync(rendered, 'utf8'), /SECRET_SENTINEL_9f1c/, 'nor the codex preamble file');
  }
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'a refused config must build nothing');
  assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, 'and create no worktree');
});

test('entry_ceo inside the project still works, relative or absolute', (t) => {
  // The control. Every refusal above is equally satisfied by a launcher that
  // refuses every entry_ceo it is given — including the default, which would
  // put every fleet project on the minimal built-in preamble with one warning
  // nobody reads.
  // MUTATION: none needed; this is the negative half of the pair.
  for (const value of [(p) => '.claude/entry/ceo.md', (p) => './.claude/entry/ceo.md', (p) => p.entry]) {
    const p = project(t, { preamble: 'INSIDE_THE_PROJECT_OK' });
    fs.appendFileSync(p.config, `entry_ceo: ${value(p)}\n`);
    const r = warroom(p, ['engine', 'render', 'claude']);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /INSIDE_THE_PROJECT_OK/);
  }
});

test('state_dir cannot be redirected outside $HOME or the project: nothing is created there', (t) => {
  // state_dir is where the launcher does `mkdir -p` and writes snapshots, the
  // engine map, the rendered preamble and the event log. The same charset gap
  // let a config point all of that anywhere the founder can write.
  //
  // The escape target is under os.tmpdir(), which is OUTSIDE this fixture's
  // HOME (a subdirectory of it) and outside the project. Its non-existence
  // after the run is the assertion: a launcher that accepted the value would
  // have created it in check_deps before doing anything else.
  // MUTATION: `_cfg_checked state_dir under …` → `_cfg_checked state_dir path`
  // → the directory is created, three worktrees follow, and the run exits 0.
  // Red on all three.
  const escapes = [
    (p) => path.join(os.tmpdir(), `wr-escape-${process.pid}-${Date.now()}`),
    (p) => path.join(p.home, '..', `wr-escape-dotdot-${process.pid}`),
  ];
  for (const escape of escapes) {
    const p = launchableProject(t);
    const target = escape(p);
    t.after(() => fs.rmSync(path.resolve(target), { recursive: true, force: true }));
    fs.writeFileSync(p.config, `session: proj\nproject_dir: ${p.dir}\nstate_dir: ${target}\n`);
    const sh = shim(t);
    const r = launch(p, ['1'], sh);
    assert.notEqual(r.code, 0, `${target}: must be refused: ${r.out}`);
    assert.ok(r.err.includes("'state_dir'"), `the refusal must name the key: ${r.err}`);
    assert.equal(fs.existsSync(path.resolve(target)), false, `${target}: must not be created`);
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'a refused config must build nothing');
    assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, 'and create no worktree');
  }
});

test('state_dir under $HOME, under the project, or relative to it is accepted', (t) => {
  // The control for the refusal above, on all three accepted shapes.
  // MUTATION: none needed.
  for (const value of [(p) => path.join(p.home, '.elsewhere'), (p) => path.join(p.dir, '.wr'), () => '.wr']) {
    const p = project(t);
    fs.writeFileSync(p.config, `session: proj\nproject_dir: ${p.dir}\nstate_dir: ${value(p)}\n`);
    const r = warroom(p, ['engine', '1', '--engine', 'codex']);
    assert.equal(r.code, 0, r.err);
    const m = panes(r)[0].cmd.match(CODEX_PREAMBLE_IN_LINE);
    assert.ok(m, `the launch line must name a preamble path: ${panes(r)[0].cmd}`);
    const expected = path.join(value(p).startsWith('/') ? value(p) : path.join(p.dir, value(p)), 'entry', 'ceo.codex.md');
    assert.equal(m[1], expected, 'and it must be the resolved state_dir, not the raw value');
  }
});

// ── `grid` the SUBCOMMAND, which is not `--grid` the flag ────────────────
//
// The suite drove `--grid` (cmd_grid_start) and drove `grid` (cmd_grid_view)
// zero times. Those are different functions, and the difference is exactly
// where a defect can hide: cmd_grid_start creates panes 1..N for CEOs 1..N, so
// grid POSITION and CEO NUMBER are equal and resolving by the wrong one is
// invisible. cmd_grid_view builds a grid from windows that ALREADY EXIST, and
// after a `done` those numbers have a gap in them.
//
// That is the same shape as the miss that shipped last time: exercise the path
// where the defect cannot appear, and the suite stays green through it.

/** `send-keys -t <target> <line> Enter`, keyed by target, from the raw calls. */
function typedLines(calls) {
  return new Map(
    calls.filter((c) => c[0] === 'send-keys' && c.length === 5 && c[4] === 'Enter').map((c) => [c[2], c[3]])
  );
}

/**
 * A session whose live CEOs are `ceos` — `{ n, engine }` — recorded the way a
 * real war room records them, in $PROJECT_STATE_DIR/engines. Writing the file
 * rather than calling a helper is deliberate: that file IS the interface
 * between one invocation and the next, and a second invocation is the whole
 * subject here.
 */
function runningSession(t, ceos, configExtra = {}) {
  const p = configuredProject(t, configExtra);
  const stateDir = path.join(p.home, '.proj');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'engines'), ceos.map((c) => `${c.n}\t${c.engine}`).join('\n') + '\n');
  return p;
}

for (const [label, ceos] of [
  ['both on codex', [{ n: 2, engine: 'codex' }, { n: 5, engine: 'codex' }]],
  // The discriminating case. With both panes on the same engine, a run that
  // resolved by position would still be right by accident.
  ['one of each', [{ n: 2, engine: 'codex' }, { n: 5, engine: 'claude' }]],
]) {
  test(`the grid subcommand gives each pane ITS CEO's engine, not its position's — ${label}`, (t) => {
    // CEO-2 and CEO-5 are live and CEO-1, 3 and 4 are gone: a session after a
    // couple of `done`s, which is the ordinary state of a war room that has
    // been running for an afternoon. Grid pane 1 holds CEO-2 and grid pane 2
    // holds CEO-5, so position and number disagree for both of them.
    //
    // `engine: claude` is in the config on purpose: it is what a run that fails
    // to find the recorded engine falls back to, so a wrong answer is a
    // PLAUSIBLE answer rather than an empty one.
    //
    // MUTATION: drop the explicit engine argument from pane 1's
    // `send_launch_claude "$SESSION:GRID.1" "" "$(engine_for_pane "$first_n")"`
    // → it resolves through pane_number_of("…:GRID.1") → pane 1, which is not a
    // live CEO here. Red on BOTH cases.
    // MUTATION: drop it from the split-pane call instead → red on `one of each`
    // and GREEN on `both on codex`. That is the whole reason the inverted case
    // exists: with both panes on the same engine, resolving by position is
    // right by accident.
    // MUTATION: put `mapfile` back in place of the read loop → `mapfile:
    // command not found` on the bash this script's shebang selects (3.2.57),
    // no CEO windows are found at all, and the command refuses. Red on both.
    const p = runningSession(t, ceos, { engine: 'claude' });
    const sh = shim(t, { sessionExists: true, windows: ['CEO-2', 'CEO-5'] });
    const r = launch(p, ['grid'], sh);

    assert.equal(r.code, 0, `grid must build: ${r.out}`);
    const lines = typedLines(r.calls);
    assert.deepEqual(
      [...lines.keys()].sort(),
      ['proj:GRID.1', 'proj:GRID.2'],
      `expected one launch per live CEO: ${r.out}`
    );

    // Grid panes are numbered 1..N in the order the CEO windows sorted.
    const expected = ceos.map((c) => c.engine);
    assert.match(
      lines.get('proj:GRID.1'),
      new RegExp(`^${expected[0]}\\b`),
      `grid pane 1 holds CEO-${ceos[0].n}, which is on ${expected[0]}`
    );
    assert.match(
      lines.get('proj:GRID.2'),
      new RegExp(`^${expected[1]}\\b`),
      `grid pane 2 holds CEO-${ceos[1].n}, which is on ${expected[1]}`
    );
  });
}

test('the grid subcommand checks the binaries the LIVE CEOs need, not positions 1..N', (t) => {
  // The other half of resolving by CEO number, and the half the two tests above
  // cannot see. They pass whether `engines_resolve` is given the real numbers
  // or the positions, because each pane is handed its engine explicitly and
  // engine_for_pane falls back to reading the map anyway. What the pre-
  // resolution actually decides is which binaries check_engine_deps looks for.
  //
  // CEO-3 and CEO-5 are live, so positions 1..2 name NEITHER of them: resolving
  // by position finds nothing in the map, answers claude twice, checks only
  // claude, and builds a grid with a Codex pane that has no codex to run.
  //
  // MUTATION: `engines_resolve $grid_ns` → `engines_resolve $(seq 1 "$count")`
  // → the missing binary is not noticed and the grid is built. Red.
  const p = runningSession(t, [{ n: 3, engine: 'codex' }, { n: 5, engine: 'claude' }], { engine: 'claude' });
  const sh = shim(t, { sessionExists: true, windows: ['CEO-3', 'CEO-5'], engines: ['claude'] });
  const r = launch(p, ['grid'], sh);

  assert.notEqual(r.code, 0, `a grid with an uninstallable engine must refuse: ${r.out}`);
  assert.match(r.out, /codex not found/, 'and name the binary CEO-3 would have needed');
  assert.deepEqual(
    r.calls.filter((c) => c[0] === 'send-keys'),
    [],
    'refusing after building the grid would be too late'
  );
});

test('the grid subcommand does not report failure when it succeeded from inside tmux', (t) => {
  // Found by the test above rather than looked for. cmd_grid_view ends with
  //
  //   [ -z "$TMUX" ] && tmux attach -t "$SESSION"
  //
  // and that is the LAST command in the function. Run from inside tmux the test
  // is false, the `&&` short-circuits, and the function — and so the script —
  // exits 1 having done its job correctly. Inside tmux is not an edge case
  // here: it is where you switch a war room you are already looking at.
  //
  // The same shape as the rest of this branch, pointed the other way. Elsewhere
  // a failure reported success; here a success reports failure, and a caller
  // that checks the status cannot tell it from a grid that could not be built.
  // It was invisible from either side: from inside tmux it always failed, and
  // from outside `attach` masked it.
  //
  // MUTATION: restore `[ -z "$TMUX" ] && tmux attach -t "$SESSION"` as the last
  // command of the function, in place of the `if` and the explicit `return 0`.
  // Red on the second assertion and on nothing else.
  const p = runningSession(t, [{ n: 2, engine: 'codex' }], { engine: 'claude' });
  const sh = shim(t, { sessionExists: true, windows: ['CEO-2'] });

  const outside = launch(p, ['grid'], sh, { env: { TMUX: '' } });
  assert.equal(outside.code, 0, `from outside tmux it already exits 0: ${outside.out}`);

  const inside = launch(p, ['grid'], sh, { env: { TMUX: '/tmp/tmux-501/default,1,0' } });
  assert.equal(
    inside.code,
    0,
    'a grid switch that did everything asked of it must not report failure ' +
      'just because the caller was already attached'
  );
});

// ── The choice outlives the process that parsed it ───────────

test('a per-pane engine chosen at start is still pane 2\'s engine in the NEXT invocation', (t) => {
  // `--engine 2:codex` used to exist only in the process that parsed it, so
  // every later command — `proj engine`, `proj grid`, `proj restore` — silently
  // put pane 2 back on the default. The founder had no way to see it except by
  // reading the pane. That is the same indistinguishable-from-working failure
  // the rest of this file is about, spread across invocations instead of panes.
  //
  // Two runs, and the SECOND one passes no --engine at all. That is the whole
  // test: a run that says nothing about engines must still find the choice the
  // first run recorded.
  // MUTATION: delete the `engines_persist $(seq 1 "$count")` call from cmd_start
  // → the second invocation answers claude for pane 2. Red.
  // MUTATION: delete the `engine_persisted_for_pane` rung from
  // engine_candidate_for_pane → the file is written and never read. Red.
  const p = launchableProject(t);
  const sh = shim(t);

  const started = launch(p, ['3', '--engine', '2:codex'], sh);
  assert.equal(started.code, 0, started.out);
  assert.match(launchLines(started.calls).get('proj:CEO-2'), /^codex\b/, 'the first run must actually place it');

  // A separate process, no flags, same project.
  const later = warroom(p, ['engine', '3']);
  assert.equal(later.code, 0, later.err);
  assert.deepEqual(
    panes(later).map((x) => `${x.n}:${x.engine}`),
    ['1:claude', '2:codex', '3:claude'],
    'the second invocation must find pane 2 on codex without being told again'
  );

  // And it is a RECORD of this session, not a new default: a run that says
  // something different still wins, or the persistence would have become an
  // unremovable config setting.
  assert.deepEqual(
    panes(warroom(p, ['engine', '3', '--engine', '2:claude'])).map((x) => `${x.n}:${x.engine}`),
    ['1:claude', '2:claude', '3:claude'],
    'an explicit override must still beat the persisted map'
  );
});

test('a snapshot with no corrupt entry restores clean and exits zero', (t) => {
  // The control for the test above. Without it, "exits 1" and "two panes" are
  // equally satisfied by a restore that is simply broken — and the INCOMPLETE
  // warning would be indistinguishable from a restore that always warns.
  // MUTATION: none needed; this is the negative half of the pair.
  const p = restorableProject(t, [
    { n: 1, branch: 'ceo-1' },
    { n: 3, branch: 'ceo-3' },
  ]);
  const sh = shim(t);
  const r = launch(p, ['restore', 'latest', '--engine', '3:codex'], sh);

  assert.equal(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /INCOMPLETE/, 'a complete restore must not warn that it is partial');
  const lines = launchLines(r.calls);
  assert.deepEqual([...lines.keys()].sort(), ['proj:CEO-1.1', 'proj:CEO-3.1']);
  assert.equal(lines.get('proj:CEO-1.1'), 'claude');
  assert.match(lines.get('proj:CEO-3.1'), /^codex\b/);
});

// ── A mixed war room comes back mixed ────────────────────────
//
// `kill` saves the snapshot and then forgets the engine map, so by the time
// `restore` runs the map is gone. The snapshot did not carry the engine, so
// every CEO came back on the default — a Codex CEO silently became a Claude
// one across a kill+restore, with nothing printed. The snapshot is now the
// record, and a snapshot that predates the field says so per pane.

/** A war room started for real, then killed for real, leaving only its snapshot. */
function killedWarRoom(t, startArgs, windows) {
  const p = launchableProject(t);
  const started = launch(p, startArgs, shim(t));
  assert.equal(started.code, 0, `the war room must start: ${started.out}`);
  const killed = launch(p, ['kill'], shim(t, { sessionExists: true, windows }));
  assert.equal(killed.code, 0, `the war room must kill cleanly: ${killed.out}`);
  assert.match(killed.out, /Snapshot saved/, 'kill must have saved a snapshot for restore to read');
  assert.equal(fs.existsSync(path.join(p.home, '.proj', 'engines')), false, 'kill must forget the engine map');
  return p;
}

test('a per-pane engine survives kill + restore, read back from the snapshot', (t) => {
  // Three real invocations of the launcher — start, kill, restore — and the
  // third passes no --engine at all. The engine map is gone after kill (the
  // helper asserts it), so the snapshot is the only place the answer can
  // come from.
  // MUTATION: drop `,\"engine\":\"$engine\"` from _snapshot_one_ceo's JSON
  // line → CEO-2 comes back `claude`. Red.
  // MUTATION: drop the WARROOM_SNAPSHOT_ENGINES rung from
  // engine_candidate_for_pane → the field is written and never read. Red.
  const p = killedWarRoom(t, ['2', '--engine', '2:codex'], ['CEO-1', 'CEO-2']);
  const snap = JSON.parse(fs.readFileSync(path.join(p.home, '.proj', 'last.json'), 'utf8'));
  assert.deepEqual(
    snap.ceos.map((c) => `${c.n}:${c.engine}`),
    ['1:claude', '2:codex'],
    'the snapshot must record each pane\'s engine'
  );

  const r = launch(p, ['restore', 'latest'], shim(t));
  assert.equal(r.code, 0, r.out);
  const lines = launchLines(r.calls);
  assert.equal(lines.get('proj:CEO-1.1'), 'claude');
  assert.match(lines.get('proj:CEO-2.1'), /^codex\b/, 'CEO-2 must come back on codex without being told again');
  assert.doesNotMatch(r.err, /does not record its engine/, 'a snapshot that records engines must not warn about them');
});

test('a snapshot that predates the engine field warns per pane, naming the engine each comes up on', (t) => {
  // restorableProject writes no `engine` unless asked, which is exactly what
  // an older launcher's snapshot looks like. The restore must still work, and
  // must SAY what it decided rather than decide it quietly.
  // MUTATION: delete the warning loop after engines_prepare in cmd_restore →
  // the restore is identical and silent. Red on the warning assertions.
  const p = restorableProject(t, [
    { n: 1, branch: 'ceo-1' },
    { n: 2, branch: 'ceo-2' },
  ]);
  const r = launch(p, ['restore', 'latest'], shim(t));
  assert.equal(r.code, 0, r.out);
  for (const n of [1, 2]) {
    const line = r.err.split('\n').find((l) => l.includes(`CEO-${n}:`) && /does not record its engine/.test(l));
    assert.ok(line, `CEO-${n} must be warned about: ${r.err}`);
    assert.match(line, /comes up on claude/, 'and the warning must name the engine it will get');
    assert.match(line, /built-in default|engine: in/, 'and where that answer came from');
  }
});

test('a snapshot naming an engine this program does not know is refused before the kill', (t) => {
  // Same shape as the corrupt pane number: the file is provably not one this
  // program wrote, so the whole restore is refused and the founder's running
  // session is left alone.
  // MUTATION: drop `engine_require_known` from engines_resolve → 'nope'
  // matches no case arm, engine_launch_cmd refuses at the seam, and by then
  // the session is gone. Red on destroys-nothing.
  const p = restorableProject(t, [{ n: 1, branch: 'ceo-1', engine: 'nope' }]);
  const r = launch(p, ['restore', 'latest'], shim(t, { sessionExists: true }));
  assert.notEqual(r.code, 0, `must refuse: ${r.out}`);
  assert.match(r.err, /unknown engine 'nope'/);
  assert.match(r.err, /recorded for CEO-1/, 'and say the value came from the snapshot');
  assert.deepEqual(r.calls.filter((c) => c[0] === 'kill-session'), [], 'the running session must survive');
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'and nothing may be built');
});

test('an all-codex snapshot restores on a machine with no claude at all', (t) => {
  // The premature dependency check. cmd_restore ran a bare `check_deps` at its
  // top, before it had read the snapshot; that resolved pane 1 to the default,
  // demanded `claude`, and refused a war room that would never start it.
  // `claude` is genuinely absent from the shim here, and the config says
  // nothing about engines, so the snapshot's own record is the only reason
  // this can succeed.
  // MUTATION: `check_base_deps` → `check_deps` at the top of cmd_restore →
  // "claude not found", exit 1. Red.
  const p = restorableProject(t, [
    { n: 1, branch: 'ceo-1', engine: 'codex' },
    { n: 2, branch: 'ceo-2', engine: 'codex' },
  ]);
  const r = launch(p, ['restore', 'latest'], shim(t, { engines: ['codex'] }));
  assert.equal(r.code, 0, `an all-codex restore must not demand claude: ${r.out}`);
  assert.doesNotMatch(r.out, /claude not found/);
  const lines = launchLines(r.calls);
  assert.match(lines.get('proj:CEO-1.1'), /^codex\b/);
  assert.match(lines.get('proj:CEO-2.1'), /^codex\b/);
});
