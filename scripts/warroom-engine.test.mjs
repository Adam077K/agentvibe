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

/**
 * What lets a pane launch on Codex, and WHERE it lives. Every fixture below
 * carries it unless a test says `ack: false`, because launching Codex REQUIRES
 * it and most of this suite is about what an acknowledged Codex pane then does.
 * The gate itself — refuse without it, refuse anything but the exact value
 * `true`, refuse the retired config key — is tested under THE CODEX
 * ACKNOWLEDGMENT GATE, on fixtures that leave it out.
 *
 * It is a file under the fixture's OWN $HOME, not a line in .warroom.yml. That
 * is the change of 2026-09-10 and it is the reason these fixtures can be
 * trusted at all: an ack in the git-tracked config is flippable by a pull
 * request and changes when you change branch. `project()` writes it under the
 * throwaway home that `warroom()` and `launch()` both pass as HOME, so no test
 * in this suite ever reads or writes the founder's real ~/.warroom/codex_ack.
 */
const CODEX_ACK_REL = path.join('.warroom', 'codex_ack');

/** Write an out-of-band ack of `value` into a fixture home. */
function writeAck(home, value = 'true\n') {
  const f = path.join(home, CODEX_ACK_REL);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, value);
  return f;
}

/**
 * The flag that keeps a Codex pane off the blocking update chooser, and the
 * bare command it decorates.
 *
 * Measured 2026-09-10 against codex-cli 0.153.4: launched with the line the
 * launcher emitted, a pane rendered `✨ Update available! … › 1. Update now
 * (runs npm install -g @openai/codex)` and waited there — no composer, and the
 * cursor on the install. `-c check_for_update_on_startup=false` advanced past
 * it. It is on every codex form, so the exact-equality assertions in this file
 * spell the whole line through here rather than each writing the flag out: a
 * literal duplicated across a dozen assertions is one that gets half-updated,
 * and half-updated here means an assertion that stops constraining anything.
 */
const CODEX_NO_UPDATE_NAG = '-c check_for_update_on_startup=false';
const CODEX_BARE = `codex ${CODEX_NO_UPDATE_NAG}`;

function project(
  t,
  {
    configExtra = '',
    preamble = 'SENTINEL_BODY_ALPHA the shared CEO identity.',
    homePrefix = 'warroom-engine-',
    ack = true,
  } = {}
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
  if (ack) writeAck(home);
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return { home, dir, config, entry };
}

/**
 * Run bin/warroom against a throwaway project. Never exits the test runner.
 *
 * stderr is kept on exit 0 as well as on failure: the launcher warns the
 * founder out of band — a skipped agent file, an engine a snapshot did not
 * record — and a run that succeeded while warning is exactly the run whose
 * stderr a test needs to read. The first shape of this helper threw stderr
 * away on success, and an assertion on a warning matched '' every time.
 */
function warroom(p, args, { path: PATH_ = process.env.PATH, env = {} } = {}) {
  const r = spawnSync(BASH, [WARROOM, '--config', p.config, ...args], {
    encoding: 'utf8',
    // HOME is the fixture's throwaway home in EVERY run, which is what keeps
    // the out-of-band Codex ack ($HOME/.warroom/codex_ack) inside the fixture.
    // WARROOM_CODEX_ACK is pinned OFF unless a caller asks for it: it leaks in
    // from a founder who acknowledged in their own shell and ran `npm test`
    // there, and inheriting it would make the gate tests pass by where they ran.
    env: { ...process.env, HOME: p.home, PATH: PATH_, WARROOM_CODEX_ACK: '', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { code: r.status ?? 1, out: r.stdout ?? '', err: r.stderr ?? '' };
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
  assert.match(codex.out, new RegExp(`resume form: ${CODEX_BARE} resume SESSION_ID`));
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

// ── A codex pane comes up on a COMPOSER, not on the update chooser ───────
//
// Measured 2026-09-10, codex-cli 0.153.4, `tmux capture-pane` on a pane
// launched with the exact line this launcher emits:
//
//     ✨ Update available! 0.153.4 -> 0.154.0
//   › 1. Update now (runs `npm install -g @openai/codex`)
//     2. Skip     3. Skip until next version
//     Press enter to continue
//
// So the pane was not on a composer, and the cursor sat on OPTION 1: the
// founder's first Enter — the keystroke a war room is FOR — ran a global npm
// install. `-c check_for_update_on_startup=false` advanced the identical probe
// past that screen.
//
// The assertion is on ARGV as the codex process receives it, not on the string
// the launcher printed. Between the two sits a pane's shell, and the flag is
// worth nothing if the quoting around the preamble expression eats it — which
// is the failure mode a string-level check would call green.

/**
 * Replace an engine stub in `sh` with one that records the argv it was called
 * with, in the same US/RS framing the fake tmux uses. Returns a reader.
 *
 * Only usable with `executePaneLines: true`: with the pane's shell inert
 * nothing ever execs the engine and every read comes back empty, which is a
 * vacuous pass. The reader asserts the stub ran at all for that reason.
 */
function recordingEngine(sh, name) {
  const log = path.join(sh.dir, `${name}-argv.log`);
  fs.writeFileSync(
    path.join(sh.dir, name),
    ['#!/bin/sh', `{ for a in "$@"; do printf '%s\\037' "$a"; done; printf '\\036'; } >> '${log}'`, 'exit 0', ''].join(
      '\n'
    )
  );
  fs.chmodSync(path.join(sh.dir, name), 0o755);
  return () => {
    assert.ok(fs.existsSync(log), `the ${name} stub never ran — the pane line was not executed`);
    return fs
      .readFileSync(log, 'utf8')
      .split(RS)
      .filter((r) => r !== '')
      .map((r) => r.split(US).slice(0, -1));
  };
}

/** The `-c k=v` pairs in an argv, as `k=v` strings. */
function configOverrides(argv) {
  return argv.filter((a, i) => argv[i - 1] === '-c');
}

test('every codex form suppresses the update chooser, measured on the argv codex receives', (t) => {
  // MUTATION: drop `%s ` / "$nonag" from the FRESH arm of engine_launch_cmd's
  // codex case → red on the fresh assertions, green on the resume ones.
  // Confirmed both ways; the resume arm was mutated separately, see below.
  const p = launchableProject(t);
  const sh = shim(t, { executePaneLines: true });
  const codexArgv = recordingEngine(sh, 'codex');

  const r = launch(p, ['2', '--engine', '2:codex'], sh);
  assert.equal(r.code, 0, r.out);

  const [argv, ...extra] = codexArgv();
  assert.deepEqual(extra, [], 'exactly one codex pane was launched, so exactly one argv');

  const overrides = configOverrides(argv);
  assert.ok(
    overrides.includes('check_for_update_on_startup=false'),
    `the fresh codex pane must suppress the update chooser: ${JSON.stringify(argv)}`
  );
  // And the flag did not arrive at the cost of the preamble: both overrides
  // survive the pane's shell, each as ONE argv item. A `-c` whose value split
  // on a space is how the earlier state_dir bug delivered half a brief.
  assert.equal(overrides.length, 2, `expected exactly two -c overrides: ${JSON.stringify(argv)}`);
  const brief = overrides.find((o) => o.startsWith('developer_instructions='));
  assert.ok(brief, `the preamble override must still be there: ${JSON.stringify(argv)}`);
  assert.match(brief, /SENTINEL_BODY_ALPHA/, 'and must still carry the rendered brief, not a path or an empty string');
});

test('the codex RESUME form suppresses the chooser too, and the flag precedes the subcommand', (t) => {
  // The resume arm is a separate printf in engine_launch_cmd and fails
  // separately: the fix landed on the fresh arm first and a resumed pane still
  // sat on the chooser.
  // MUTATION: drop `%s ` / "$nonag" from the RESUME arm → red here, green on
  // the fresh test above. Confirmed.
  //
  // Position is asserted because it is the half that a string search would
  // miss: `-c` is a GLOBAL option and belongs before the subcommand. Verified
  // against the shipped binary — `codex -c check_for_update_on_startup=false
  // resume --help` exits 0 — and a flag parked after the session id would be
  // read as codex resume's optional PROMPT argument, which is silent.
  const p = restorableProject(t, [{ n: 1, branch: 'ceo-1', session_id: 'thread_019abc.DEF-xyz' }]);
  const sh = shim(t, { executePaneLines: true });
  const codexArgv = recordingEngine(sh, 'codex');

  const r = launch(p, ['restore', 'latest', '--engine', '1:codex'], sh);
  assert.equal(r.code, 0, r.out);

  const [argv, ...extra] = codexArgv();
  assert.deepEqual(extra, [], 'one resumed codex pane, one argv');
  assert.deepEqual(
    argv,
    ['-c', 'check_for_update_on_startup=false', 'resume', 'thread_019abc.DEF-xyz'],
    'the resume line is exactly this, in this order'
  );
});

test('the flag is a fixed literal, so it adds no interpolation to a line a live pane parses', (t) => {
  // The launcher has survived six security-gate rounds on exactly one class:
  // a value reaching a pane's shell uninterpolated. A new flag is a new place
  // for that to happen, so this pins that the flag as PRINTED expands nothing
  // — asserted on the string before any shell has touched it, which is where
  // an expansion would still be visible.
  // MUTATION: build the flag from a config value, e.g.
  // `-c check_for_update_on_startup=$(_cfg codex_update_check)` → red.
  const p = launchableProject(t);
  const sh = shim(t);
  const r = launch(p, ['1', '--engine', 'codex'], sh);
  assert.equal(r.code, 0, r.out);

  const line = launchLines(r.calls).get('proj:CEO-1');
  assert.ok(line.startsWith(`${CODEX_BARE} `), `the flag must be on the line as a literal: ${line}`);
  const flagPart = line.slice(0, CODEX_BARE.length);
  assert.doesNotMatch(flagPart, /[$`\\]/, `the flag must expand nothing: ${flagPart}`);
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
  assert.equal(panes(r)[0].cmd, CODEX_BARE, 'bare codex launches with no injected instructions');
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
 * `entries` is `[{ n, branch, session_id?, engine?, wt_path? }]`, and every
 * field is deliberately free-form: a snapshot is DATA read back off disk, not
 * argv, which is the whole reason cmd_restore has to guard it. `wt_path`
 * defaults to where the launcher itself would have recorded it; a test about
 * a snapshot that names somewhere else passes its own.
 *
 * `gridMode` writes the snapshot a grid-layout war room saves, which
 * cmd_restore rebuilds through a different branch — one GRID window, one pane
 * per CEO, targets `GRID.N` — and that branch had no test until it took a
 * parameter here.
 */
function restorableProject(t, entries, { gridMode = false } = {}) {
  const p = launchableProject(t);
  for (const b of new Set(entries.map((e) => e.branch))) gitIn(p, 'branch', b, 'main');
  const ceos = entries.map(({ n, branch, session_id = '', engine, wt_path }) => ({
    n,
    branch,
    wt_path: (typeof wt_path === 'function' ? wt_path(p) : wt_path) ?? path.join(p.dir, '.worktrees', branch),
    task: '',
    start_ts: 0,
    session_id,
    ...(engine === undefined ? {} : { engine }),
  }));
  const snaps = path.join(p.home, '.proj', 'snapshots');
  fs.mkdirSync(snaps, { recursive: true });
  fs.writeFileSync(
    path.join(snaps, '2026-01-01-000000.json'),
    JSON.stringify({ saved_at: 1767225600, project_dir: p.dir, grid_mode: gridMode, ceos }, null, 2)
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
 *
 * The Codex acknowledgment is NOT among the keys here and cannot be: it is a
 * file under the fixture's home, which launchableProject already wrote, and
 * rewriting the config does not disturb it.
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
      // An override of `undefined` REMOVES a default rather than writing the
      // word `undefined` into the config.
      .filter(([, v]) => v !== undefined)
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
    // WARROOM_CODEX_ACK is pinned OFF for the same reason TMUX is: it leaks in
    // from a founder who acknowledged in the shell they ran the suite from, and
    // the whole acknowledgment gate below would then pass by accident there and
    // fail on a runner. A test that wants it passes it in `env`.
    env: {
      ...process.env,
      HOME: p.home,
      PATH: sh.path,
      TMPDIR: p.home,
      TMUX: '',
      WARROOM_CODEX_ACK: '',
      ...env,
    },
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

test('a grid whose pane 3 needs a missing binary refuses before tmux is touched', (t) => {
  // THE ANTI-REVERT TEST FOR cmd_grid_start, and it had none. Every `--grid`
  // run in this suite used the default shim, where both binaries are
  // installed, and asserted exit 0 — so restoring the line this replaced,
  //
  //   check_deps 2>/dev/null || true
  //
  // kept the whole file green. That line discarded exactly the error the
  // rewrite exists to surface: a grid asking for `--engine 3:codex` on a
  // machine with no codex built all three worktrees and the whole tmux grid,
  // and then failed inside a pane, where a founder finds it by reading the
  // pane.
  //
  // Mirrors the normal-mode test above rather than inventing a shape, because
  // the two paths are the same promise made twice: `--grid` and no flag reach
  // check_deps through different callers, and a fix applied to one of them is
  // the reason this test exists.
  //
  // WHICH LINE THIS TEST ACTUALLY CONSTRAINS, measured rather than assumed,
  // because the obvious answer is wrong. `--grid` does NOT enter
  // cmd_grid_start from the router: it goes through cmd_start, which resolves
  // and checks every pane itself before dispatching. So this test is killed by
  // mutating CMD_START:
  // MUTATION: `engines_setup all $(seq 1 "$count")` → `check_deps 2>/dev/null
  // || true` in cmd_start → red here, and red on the normal-mode sibling
  // above, which is the pair behaving as one guard because it is one.
  // MEASURED GREEN, and recorded because it is the mutation this test looks
  // like it kills and does not: the same revert applied to CMD_GRID_START
  // leaves this test passing, since cmd_start has already refused upstream.
  // cmd_grid_start has its own check and its own test, directly below.
  const p = launchableProject(t);
  const sh = shim(t, { engines: ['claude'] }); // codex is genuinely not installed
  const r = launch(p, ['3', '--grid', '--engine', '3:codex'], sh);

  assert.notEqual(r.code, 0, `a grid with an uninstallable engine must refuse: ${r.out}`);
  // On STDOUT, like every other check_deps refusal in this program — asserted
  // where the message actually is rather than where it ought to be. Moving it
  // to stderr is a change to the launcher's output contract and belongs in its
  // own diff; `r.out` here is stdout+stderr, so this assertion survives that
  // move and does not pin the wrong stream.
  assert.match(r.out, /codex not found/, 'and name the binary pane 3 would have needed');
  assert.doesNotMatch(r.out, /claude not found/, 'claude is present — naming it would be the pane-1 bug');

  // NOTHING BUILT. A grid that refuses after laying out the panes is the
  // failure being fixed, not a tidier version of it.
  assert.deepEqual(launchLines(r.calls), new Map(), 'no pane may be launched');
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'and no window, pane or layout may be created');
  assert.equal(
    fs.existsSync(path.join(p.dir, '.worktrees')),
    false,
    'nor may a single worktree be checked out'
  );
});

test('cmd_grid_start checks the engine binaries itself, and names the one it wants', (t) => {
  // The test for bin/warroom's own line, which the run above cannot reach.
  // cmd_grid_start is only ever called by cmd_start, and cmd_start resolves
  // first — so the grid function could lose its check entirely and every
  // `--grid` test in this file would stay green. That is the shape of a
  // second implementation of one guard: right now the two agree, and the day
  // a caller reaches cmd_grid_start without going through cmd_start, only
  // this test says which of them is load-bearing.
  //
  // Called directly, like pane_number_of above and for the same reason: this
  // is an input the router cannot produce.
  //
  // MUTATION: `engines_setup all $(seq 1 "$count")` → `check_deps 2>/dev/null
  // || true` in cmd_grid_start, verbatim what stood there before. The run
  // still exits 1 — but for an unrelated reason and in SILENCE: check_deps
  // falls back to resolving pane 1 alone, the `3:codex` override then names a
  // pane nobody resolved, and that refusal goes to stderr, which the
  // `2>/dev/null` throws away. Measured: exit 1, empty output, no tmux calls.
  // So the exit status and the tmux assertions pass under the mutation and
  // the MESSAGE is what kills it — which is the whole complaint against the
  // old line. A founder does not debug an exit 1 with no text.
  const p = launchableProject(t);
  const sh = shim(t, { engines: ['claude'] }); // codex is genuinely not installed
  const r = warroomEval(p, 'cmd_grid_start 3', { args: ['--engine', '3:codex'], path: sh.path });

  assert.notEqual(r.code, 0, `the grid must refuse: ${r.out}`);
  assert.match(r.out, /codex not found/, 'and say WHICH binary, or the refusal is undebuggable');
  assert.doesNotMatch(r.out, /claude not found/, 'claude is present');
  assert.deepEqual(tmuxCalls(sh), [], 'and it must refuse before it has asked tmux anything at all');
  assert.equal(
    fs.existsSync(path.join(p.dir, '.worktrees')),
    false,
    'nor may it have checked a worktree out first'
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
  assert.equal(bareLines.get('proj:CEO-2'), CODEX_BARE, 'bare codex carries NO developer_instructions');
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
    CODEX_BARE,
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

/**
 * Overwrite the snapshot `restorableProject` wrote with RAW bytes.
 *
 * Every other restore fixture in this file goes through JSON.stringify, so the
 * file on disk is always valid JSON with the shape cmd_restore expects. That
 * is precisely the input class that cannot exercise the reader's failure path:
 * a snapshot is a file on disk in a directory a founder can edit, restore from
 * a backup, or truncate by running out of space, and none of those produce
 * valid JSON. The fixture has to be able to write something that is not.
 */
function writeRawSnapshot(p, raw) {
  const f = path.join(p.home, '.proj', 'snapshots', '2026-01-01-000000.json');
  fs.writeFileSync(f, raw);
  return f;
}

test('a snapshot that is not JSON at all refuses the restore, and the war room survives', (t) => {
  // THE DESTROY-THEN-REFUSE BUG, reproduced by hand on 2026-09-11 and closed
  // here. The three snapshot reads were bare `$(python3 -c … 2>/dev/null)`.
  // On an unparseable file json.load raised, the traceback went to /dev/null,
  // and every one of them evaluated to the EMPTY STRING — which is also what a
  // clean snapshot produces. `[ -n "$snapshot_bad" ]` was therefore false, the
  // refusal never fired, and control reached the kill-session: the founder's
  // running war room was destroyed and the restore failed afterwards, which is
  // strictly worse than either failure alone. The validation was in the right
  // PLACE the whole time; it had no way to say "I could not look".
  //
  // `sessionExists: true` is what makes this a test rather than a tautology.
  // With no session running, cmd_restore skips its kill unconditionally and a
  // launcher with the bug records no kill either.
  //
  // MUTATION: `if [ "$_snap_rc" -ne 0 ]` → `if [ "$_snap_rc" -eq 99 ]` in
  // cmd_restore — the exact behaviour of the old code, which had no status to
  // consult at all. Red on the exit status AND on destroys-nothing: a
  // kill-session is recorded and the restore then dies further down.
  // MUTATION: delete the `try`/`except` around json.load in the reader → the
  // exception propagates, the status is still non-zero so the restore is still
  // refused, and the founder is handed a Python traceback where a sentence
  // should be. Red on the no-traceback assertion, and on nothing else — which
  // is why that assertion is here rather than assumed.
  // NOT COVERED BY A MUTATION, deliberately: `2>&1` on the reader exists for
  // the case where python3 itself never runs its program — a missing
  // interpreter, a SyntaxError in the `-c` text — and swapping it for
  // `2>/dev/null` was MEASURED GREEN here, because the diagnostics this
  // fixture triggers are printed on stdout by the reader's own handlers. It is
  // recorded as reasoning, not claimed as a tested property.
  const p = restorableProject(t, [{ n: 1, branch: 'ceo-1' }]);
  writeRawSnapshot(p, 'not valid json at all {{{\n');
  const sh = shim(t, { sessionExists: true });
  const r = launch(p, ['restore', 'latest'], sh);

  assert.notEqual(r.code, 0, `an unreadable snapshot must refuse the restore: ${r.out}`);

  // DESTROYS NOTHING. Asserted on the recorded tmux calls rather than on
  // stdout: the launcher printed "Refusing…" in the buggy version too, one
  // line after it had already killed the session.
  assert.deepEqual(
    r.calls.filter((c) => c[0] === 'kill-session'),
    [],
    'a snapshot that cannot be read must not cost the founder the session they still had'
  );
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'and nothing else in tmux may move either');
  assert.equal(
    fs.existsSync(path.join(p.dir, '.worktrees')),
    false,
    'nor may it build anything on disk'
  );

  assert.match(r.err, /refus/i, 'it must say that it is refusing');
  assert.match(r.err, /JSON/i, 'and name the reason it could not read the file');
  assert.doesNotMatch(r.err, /Traceback/, 'in a sentence, not as a Python traceback');
});

test('a snapshot whose top level is a list refuses the restore, naming the shape', (t) => {
  // The second half of the same hole, and the half that survives a try/except
  // alone: this file IS valid JSON. `d.get('ceos')` on a list raises
  // AttributeError, which the old `2>/dev/null` swallowed into the same empty
  // string — so a snapshot shaped like nothing this program writes read as a
  // snapshot with zero CEOs and nothing wrong. A reader that only guards
  // json.load would still pass it through.
  //
  // MUTATION: delete the `isinstance(d, dict)` refusal from the reader → the
  // AttributeError propagates, the status is still non-zero so the restore is
  // still refused, but the founder is shown a Python traceback instead of
  // which part of their file is the wrong shape. Red on the stderr match and
  // only on that one, which is why the message is asserted here and the
  // destroys-nothing pair is asserted above.
  // MUTATION: `if [ "$_snap_rc" -ne 0 ]` → `if [ "$_snap_rc" -eq 99 ]` → red on
  // the status and on destroys-nothing, as in the test above.
  const p = restorableProject(t, [{ n: 1, branch: 'ceo-1' }]);
  writeRawSnapshot(p, JSON.stringify([{ n: 1, branch: 'ceo-1' }]));
  const sh = shim(t, { sessionExists: true });
  const r = launch(p, ['restore', 'latest'], sh);

  assert.notEqual(r.code, 0, `a wrongly-shaped snapshot must refuse the restore: ${r.out}`);
  assert.deepEqual(
    r.calls.filter((c) => c[0] === 'kill-session'),
    [],
    'a snapshot of the wrong shape must not kill the running session either'
  );
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'and nothing else in tmux may move');
  assert.match(r.err, /top level/i, 'it must name the shape it refused');
  assert.doesNotMatch(r.err, /Traceback/, 'and must not answer a founder with a Python traceback');
});

// ── A snapshot that is VALID and yields ZERO CEOs ──────────────────────────
//
// The last member of the destroy-then-refuse class, and the one that survived
// the fix for the rest of it. Every refusal above is driven by a POSITIVE
// signal — a non-zero reader status, a BAD line, a bad wt_path — and a
// snapshot holding `{}` produces none of them. It is readable JSON, its top
// level is an object, its `ceos` is a list (an absent one defaults to `[]`),
// and no entry is malformed because there are no entries. `snapshot_ns` came
// back empty, which is ALSO what a clean one-CEO snapshot looks like before
// the NS line is read, so nothing refused: control walked down to the
// kill-session, destroyed the founder's running war room, rebuilt nothing,
// and printed `✗ No CEOs could be restored.` afterwards.
//
// Measured on 2026-09-11 before the fix: one kill-session recorded, exit 1,
// stderr empty. The MESSAGE was right and it came one step too late — which
// is the same shape as the unreadable-JSON bug and why the fix goes in the
// refusal cluster above the kill rather than at the point of the complaint.
//
// The three inputs are separated because the founder's next move differs.
// `{}` and a snapshot with no `ceos` key are files this program never wrote,
// so the answer is "this is not a snapshot, pick another"; `{"ceos": []}` is
// a file it WOULD write, from a war room that had no CEOs, so the answer is
// "there is nothing in here to restore". Telling them apart from the message
// alone is the point — a founder should not have to open the file.
//
// `names` and `notNames` are a PAIR on purpose. A single positive match does
// not prove the message distinguishes anything — "records no CEOs" is true of
// all three inputs, so three tests asserting it would pass over a launcher
// that had merged the arms back into one sentence. Each row therefore also
// names the other arm's wording and requires its ABSENCE.
for (const [label, raw, names, notNames] of [
  ['an empty object', '{}\n', /no 'ceos' field/, /empty/i],
  ['no ceos key at all', JSON.stringify({ saved_at: 1767225600 }), /no 'ceos' field/, /empty/i],
  ['an empty ceos list', JSON.stringify({ saved_at: 1767225600, ceos: [] }), /is empty/i, /no 'ceos' field/],
]) {
  test(`a snapshot with ${label} refuses BEFORE the kill, and the war room survives`, (t) => {
    // MUTATION: delete the `if [ -z "$snapshot_ns" ]` refusal block from
    // cmd_restore → all three go red on the KILL-SESSION assertion, which is
    // the load-bearing one: the launcher still exits 1 and still prints a
    // complaint, so a test asserting only on status or on stderr stays GREEN
    // over the bug. Measured 2026-09-11.
    // MUTATION: move that block BELOW the kill-session → red on kill-session
    // alone, as for every other member of this class.
    // MUTATION: collapse its three message arms into one → red on the
    // doesNotMatch assertion for whichever arm's wording survived, which is
    // what that assertion exists for.
    // MUTATION: drop the `print('CEOS …')` line from the reader → the tag never
    // arrives, `$snapshot_ceos` is empty, and the guard still REFUSES (it is
    // keyed on `$snapshot_ns`, not on the tag) but falls into the third arm and
    // describes all three inputs as "records  CEOs". Green on kill-session, red
    // on the naming assertions — which is the split the two conditions exist
    // for, and the reason the guard is not keyed on the count.
    const p = restorableProject(t, [{ n: 1, branch: 'ceo-1' }]);
    writeRawSnapshot(p, raw);
    const sh = shim(t, { sessionExists: true });
    const r = launch(p, ['restore', 'latest'], sh);

    assert.notEqual(r.code, 0, `${label}: a snapshot with no CEOs must refuse: ${r.out}`);

    // THE LOAD-BEARING ASSERTION. Asserted on the recorded tmux calls and not
    // on stdout: the buggy launcher printed a correct refusal too, one line
    // after it had already killed the session the founder still had.
    assert.deepEqual(
      r.calls.filter((c) => c[0] === 'kill-session'),
      [],
      `${label}: a snapshot with nothing to restore must not destroy the running war room`
    );
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${label}: and nothing else in tmux may move`);
    assert.equal(
      fs.existsSync(path.join(p.dir, '.worktrees')),
      false,
      `${label}: nor may it build anything on disk`
    );

    // It said WHICH of the two mistakes this is, and which file to look at.
    assert.match(r.err, names, `${label}: the refusal must name the specific condition`);
    assert.doesNotMatch(r.err, notNames, `${label}: and must not describe it as the other mistake`);
    assert.match(r.err, /refus/i, `${label}: and must say that it is refusing`);
    assert.match(r.err, /2026-01-01-000000\.json/, `${label}: and name the file it read`);
    assert.doesNotMatch(r.err, /Traceback/, `${label}: in a sentence, not a Python traceback`);
  });
}

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
  assert.equal(lines.get('proj:CEO-2.1'), `${CODEX_BARE} resume thread_019abc.DEF-xyz`);
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
  //
  // display_name is in the loop because the comment above calls its `|| exit 1`
  // load-bearing and, until this row, nothing tested the key at all: a
  // metacharacter in it reaches the HQ and status lines the same way
  // `session` does. MUTATION: `SESSION_UPPER="$(_cfg_checked display_name
  // path)"` → `SESSION_UPPER="$(_cfg display_name)"` → this row exits 0. Red.
  const p = configuredProject(t, {});
  for (const [key, kind] of [
    ['session', 'name'],
    ['state_dir', 'path'],
    ['entry_ceo', 'path'],
    ['display_name', 'path'],
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
  // display_name carries the same allowed set, space included, and is the
  // other half of its row in the refusal loop above: a launcher that refused
  // every display_name would pass that row too.
  const p = configuredProject(t, {});
  // Under $HOME/.warroom, which is an allowed base, AND made of the characters
  // the rule deliberately allows — space, +, ., -, _. The base narrowing (see
  // the two state_dir tests below) is orthogonal to the charset this asserts,
  // so the dir has to satisfy both or it stops testing the charset at all.
  const dir = path.join(p.home, '.warroom', 'a dir+with-allowed.chars');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    p.config,
    `session: proj\nproject_dir: ${p.dir}\nstate_dir: ${dir}\ndisplay_name: Proj Display+1.0_x\n`
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
  // lexical rule is what CHOOSES the base the physical check on state_dir is
  // made against (see the class tests at the end of this file), and is
  // belt-and-braces here.
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

test('state_dir under the session dir, $HOME/.warroom, the project, or relative to it is accepted', (t) => {
  // The control for the refusal below, on every accepted shape. The session is
  // `proj`, so the session default is $HOME/.proj; $HOME/.warroom/<name> is the
  // shared base; and both a project subdir and a relative value land under the
  // project. What is NOT here — a bare $HOME subdir like $HOME/.elsewhere — is
  // the case the refusal below owns, and used to be accepted here.
  // MUTATION: none needed.
  for (const value of [
    (p) => path.join(p.home, '.proj'),
    (p) => path.join(p.home, '.warroom', 'proj-state'),
    (p) => path.join(p.dir, '.wr'),
    () => '.wr',
  ]) {
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

test('state_dir cannot be a bare $HOME subdir like ~/.ssh: narrowed to the session dir and $HOME/.warroom', (t) => {
  // FINDING 1. The confinement used to pass ALL of $HOME as a valid base, so a
  // git-tracked .warroom.yml could set `state_dir: ~/.ssh` (or ~/.aws, or
  // ~/.config/gh) and every `mkdir -p` and every `>` this program does would
  // land there. The base is now a single named directory under home — the
  // session dir and $HOME/.warroom — not the home itself.
  //
  // The escape targets are shaped like the real credential directories and sit
  // directly under this fixture's HOME, which is exactly what the old rule
  // accepted and the new one refuses. Their non-existence after the run is the
  // assertion: a launcher on the old base would have created state_dir in
  // check_deps before doing anything else.
  //
  // MUTATION: restore the old base — replace the state_dir resolution with
  // `_STATE_BASE="$HOME"` / `_cfg_checked state_dir under "$PROJECT_DIR" "$HOME"`
  // → each target is created and three worktrees follow, exit 0. Red on every
  // row: the refusal, the non-creation, and the empty-tmux assertion.
  for (const sub of ['.ssh', '.aws', path.join('.config', 'gh')]) {
    const p = launchableProject(t);
    const target = path.join(p.home, sub, 'wr-state');
    t.after(() => fs.rmSync(path.join(p.home, sub.split(path.sep)[0]), { recursive: true, force: true }));
    fs.writeFileSync(p.config, `session: proj\nproject_dir: ${p.dir}\nstate_dir: ${target}\n`);
    const sh = shim(t);
    const r = launch(p, ['1'], sh);
    assert.notEqual(r.code, 0, `${sub}: a bare $HOME subdir must be refused: ${r.out}`);
    assert.ok(r.err.includes("'state_dir'"), `${sub}: the refusal must name the key: ${r.err}`);
    assert.equal(fs.existsSync(target), false, `${sub}: nothing may be created where it points`);
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${sub}: a refused config must build nothing`);
    assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, `${sub}: and create no worktree`);
  }

  // The control on the other side, so the refusal above is not satisfied by a
  // launcher that refuses every state_dir: $HOME/.warroom/<name> is accepted.
  const ok = launchableProject(t);
  fs.writeFileSync(ok.config, `session: proj\nproject_dir: ${ok.dir}\nstate_dir: ${path.join(ok.home, '.warroom', 'proj-state')}\n`);
  const okr = warroom(ok, ['engine', '1']);
  assert.equal(okr.code, 0, `$HOME/.warroom/<name> must be accepted: ${okr.err}`);
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

// ── A Codex pane is TRUSTED, not sandboxed, and the founder is told so at launch ──

test('launching a codex pane warns the FOUNDER, out of band, that tool scoping is unenforced there', (t) => {
  // The Codex preamble says this to the model, and a sentence addressed to a
  // model is a request rather than a boundary. This is the other half: the
  // program tells the person who chose the engine, on stderr, at the moment
  // the pane launches — and never types it into the pane.
  // MUTATION: delete the echoes in engine_launch_warning's codex arm → red on
  // the first assertion. Print them without `>&2` → red on the stderr one.
  // Type them into the pane instead → red on the out-of-band one.
  const p = launchableProject(t);
  const sh = shim(t);
  const r = launch(p, ['3', '--engine', '2:codex'], sh);
  assert.equal(r.code, 0, r.out);

  const warned = r.err.split('\n').filter((l) => /tool scoping is NOT enforced/.test(l));
  assert.equal(warned.length, 1, `exactly the one codex pane must be warned about: ${r.err}`);
  assert.match(warned[0], /CEO-2/, 'and the warning must name the pane');
  assert.match(r.err, /trusted, not sandboxed/, 'and say what the founder should conclude');
  assert.doesNotMatch(
    r.calls.flat().join('\n'),
    /tool scoping is NOT enforced/,
    'the warning is for the founder — it must reach no pane and no tmux argument'
  );

  // The control: an all-Claude war room is warned about nothing.
  const p2 = launchableProject(t);
  const quiet = launch(p2, ['2'], shim(t));
  assert.equal(quiet.code, 0, quiet.out);
  assert.doesNotMatch(quiet.err, /tool scoping/, 'no codex pane, no warning');
});

// ── THE CODEX ACKNOWLEDGMENT GATE ────────────────────────────────────────
//
// The warning above is a notice AFTER the choice. This is the gate BEFORE it:
// a pane cannot launch on codex until THIS MACHINE has acknowledged, and only
// the exact value `true` counts. The refusal sits in
// engine_require_acknowledged, called from engines_resolve — the same
// main-shell resolution every launching command runs before check_deps and
// before tmux — so start, add, grid, restore and `engine` all refuse alike.
//
// THE ACKNOWLEDGMENT IS OUT OF BAND, and the tests below are shaped by why.
// Until 2026-09-10 it was `codex_unsandboxed_ack: true` in the project's
// git-tracked .warroom.yml, which the binding QA gate flagged P1: a pull
// request can flip the control that gates an unsandboxed pane. The same day it
// failed operationally from the other side — the key existed on one branch and
// not on `main` (`grep -c codex_unsandboxed_ack …/.warroom.yml` → 0 there), so
// `git checkout` silently changed the machine's security posture.
//
// Two sources now, both outside the repository: $WARROOM_CODEX_ACK=true, and
// $HOME/.warroom/codex_ack whose first line trims to `true`. The config key is
// NOT a third source, and `a config key still refuses` below is the regression
// test for that — it must go red the moment anyone re-adds it.

/** What every refusal must say: the risk, that scoping is unenforced, and BOTH remedies. */
function assertAckRefusal(r, label) {
  assert.notEqual(r.code, 0, `${label}: must refuse: ${r.out}`);
  assert.match(r.err, /NOT sandboxed/, `${label}: the refusal must name the risk plainly: ${r.err}`);
  assert.match(r.err, /tool scoping is NOT enforced/, `${label}: and that per-engine scoping does not hold`);
  // The remedy has to be actionable, and there are two of them. A refusal that
  // says only "not acknowledged" sends the founder to the source to find out
  // how — which is how the config key got used for this in the first place.
  assert.match(r.err, /WARROOM_CODEX_ACK=true/, `${label}: name the environment form: ${r.err}`);
  assert.match(r.err, /\.warroom\/codex_ack/, `${label}: and the file form: ${r.err}`);
}

test('an unacknowledged codex pane is REFUSED on the real launch path, and nothing is built', (t) => {
  // MUTATION: delete the `engine_require_acknowledged` call in engines_resolve
  // → the run exits 0, pane 2 is typed `codex …`, a worktree is created. Red
  // on the exit code, the tmux assertion and the worktree assertion.
  for (const [label, opts, args] of [
    ['--engine 2:codex', {}, ['2', '--engine', '2:codex']],
    ['--engine codex as the run default', {}, ['1', '--engine', 'codex']],
    ['engine: codex in .warroom.yml', { configExtra: 'engine: codex\n' }, ['1']],
  ]) {
    const p = launchableProject(t, { ack: false, ...opts });
    const sh = shim(t);
    const r = launch(p, args, sh);
    assertAckRefusal(r, label);
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${label}: a refused launch must build nothing`);
    assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, `${label}: and create no worktree`);
    assert.doesNotMatch(r.err, /runs on Codex/, `${label}: the launch-time warning is for a pane that launched`);
  }
});

test('the inspection command refuses an unacknowledged codex pane the same way, so it cannot imply a launch', (t) => {
  // `warroom engine` resolves through the same engines_resolve, so the refusal
  // is the same call in the same shell. Without this, inspection would print
  // a launch line for a pane that `start` would then refuse.
  // MUTATION: same deletion as above → exit 0 and a `CEO-1 codex …` row. Red.
  const p = project(t, { ack: false });
  const r = warroom(p, ['engine', '1', '--engine', 'codex']);
  assertAckRefusal(r, 'engine 1 --engine codex');
  assert.deepEqual(panes(r), [], 'no launch line may be shown for a pane that would refuse');

  const fromConfig = warroom(project(t, { ack: false, configExtra: 'engine: codex\n' }), ['engine', '2']);
  assertAckRefusal(fromConfig, 'engine: codex in config');
});

// ── The two accepted sources ─────────────────────────────────────────────

test('WARROOM_CODEX_ACK=true in the environment launches codex, with no file on disk', (t) => {
  // MUTATION: delete `[ "${WARROOM_CODEX_ACK-}" = "true" ] && return 0` → this
  // refuses. Red on the exit code and the launch line.
  const p = launchableProject(t, { ack: false });
  assert.equal(
    fs.existsSync(path.join(p.home, CODEX_ACK_REL)),
    false,
    'the fixture must carry no ack file, or this would pass on the other source'
  );
  const sh = shim(t);
  const r = launch(p, ['2', '--engine', '2:codex'], sh, { env: { WARROOM_CODEX_ACK: 'true' } });
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(launchLines(r.calls).get('proj:CEO-2') ?? '', /^codex\b/, 'pane 2 launches on codex');

  // …and only the exact value. `1`, `yes` and `TRUE` are what a founder types
  // when they mean yes and have not read what they are agreeing to.
  for (const value of ['1', 'yes', 'TRUE', 'True', 'false', 'true ', ' true', 'truex']) {
    const q = launchableProject(t, { ack: false });
    const r2 = launch(q, ['1', '--engine', 'codex'], shim(t), { env: { WARROOM_CODEX_ACK: value } });
    assertAckRefusal(r2, `WARROOM_CODEX_ACK=${JSON.stringify(value)}`);
  }
});

test('~/.warroom/codex_ack containing `true` launches codex, with nothing in the environment', (t) => {
  // This is the standing form — one machine, once — and it is what every other
  // codex test in this file rides on, since project() writes it.
  // MUTATION: delete the `codex_ack_file_says_true && return 0` line → this
  // refuses, and so does most of the codex half of this suite. Red.
  const p = launchableProject(t, { ack: false });
  writeAck(p.home, 'true\n');
  const sh = shim(t);
  const r = launch(p, ['2', '--engine', '2:codex'], sh);
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(launchLines(r.calls).get('proj:CEO-2') ?? '', /^codex\b/, 'pane 2 launches on codex');

  // Trailing whitespace and a missing final newline are what `echo`, an editor
  // and `printf` respectively leave behind. All three mean yes.
  for (const body of ['true', 'true\n', 'true  \n', '  true\n', 'true\r\n', '\ttrue\t\n']) {
    const q = launchableProject(t, { ack: false });
    writeAck(q.home, body);
    const r2 = launch(q, ['1', '--engine', 'codex'], shim(t));
    assert.equal(r2.code, 0, `${JSON.stringify(body)} must acknowledge: ${r2.out}${r2.err}`);
  }
});

test('a junk ack file refuses, and never crashes the launcher', (t) => {
  // The file is normally ABSENT, so every one of these is a shape the gate
  // meets in the wild.
  // MUTATION: `[ "$val" = "true" ]` → `[ -e "$WARROOM_CODEX_ACK_FILE" ]` →
  // every row here acknowledges. Red.
  // MUTATION: trim with `tr -d '[:space:]'` instead of the two anchored seds →
  // `t r u e` acknowledges. Red on that row (measured: 1 failing test).
  //
  // MUTATION THAT DOES *NOT* GO RED, recorded because a reader will reach for
  // it: `[ -f … ]` → `[ -e … ]`, which lets the directory row reach `sed`.
  // Green on macOS — measured 2026-09-10 with BSD sed, where `sed -n 1p` on a
  // directory prints nothing and exits 0, so the value is empty either way. It
  // is NOT green everywhere (GNU sed reports a read error), and the `-f` test
  // is kept for that plus the clean-stderr assertion below — but on this
  // platform it is redundancy, not the control. The control every row here
  // actually proves is the exact-value compare, mutated above.
  const cases = [
    ['empty', ''],
    ['a newline only', '\n'],
    ['whitespace only', '   \n'],
    ['false', 'false\n'],
    ['TRUE', 'TRUE\n'],
    ['True', 'True\n'],
    ['yes', 'yes\n'],
    ['1', '1\n'],
    ['true on line 2', '\ntrue\n'],
    ['a comment then true', '# yes\ntrue\n'],
    ['inner spaces', 't r u e\n'],
    ['true with a suffix', 'truex\n'],
    ['a sentence', 'I acknowledge this is true\n'],
  ];
  for (const [label, body] of cases) {
    const p = launchableProject(t, { ack: false });
    writeAck(p.home, body);
    const r = launch(p, ['1', '--engine', 'codex'], shim(t));
    assertAckRefusal(r, `ack file ${label}`);
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${label}: must build nothing`);
  }

  // A DIRECTORY at the ack path: refuse, and print no interpreter error.
  const p = launchableProject(t, { ack: false });
  fs.mkdirSync(path.join(p.home, CODEX_ACK_REL), { recursive: true });
  const r = launch(p, ['1', '--engine', 'codex'], shim(t));
  assertAckRefusal(r, 'a directory at the ack path');
  assert.doesNotMatch(r.err, /sed:|Is a directory/, 'the launcher must not leak an interpreter error');
});

test('the ack value is COMPARED, never evaluated: a command substitution in the file is inert', (t) => {
  // This file has survived six security-gate rounds on exactly this class, and
  // the ack file is a NEW read of attacker-shaped bytes. The canary is the
  // assertion; the refusal is secondary.
  // MUTATION: `[ "$val" = "true" ]` → `eval "[ $val = true ]"` → the canary
  // appears. Red on the first assertion.
  const p = launchableProject(t, { ack: false });
  const canary = path.join(p.home, 'ACK-FILE-FIRED');
  writeAck(p.home, `true$(touch ${canary})\n`);
  const r = launch(p, ['1', '--engine', 'codex'], shim(t));
  assert.equal(fs.existsSync(canary), false, 'the ack file must never reach a shell');
  assertAckRefusal(r, 'a command substitution in the ack file');

  // Same for the environment form, which is the easier one to get wrong.
  const q = launchableProject(t, { ack: false });
  const canary2 = path.join(q.home, 'ACK-ENV-FIRED');
  const r2 = launch(q, ['1', '--engine', 'codex'], shim(t), {
    env: { WARROOM_CODEX_ACK: `true$(touch ${canary2})` },
  });
  assert.equal(fs.existsSync(canary2), false, 'WARROOM_CODEX_ACK must never reach a shell');
  assertAckRefusal(r2, 'a command substitution in WARROOM_CODEX_ACK');
});

// ── The retired source ───────────────────────────────────────────────────

test('the config key is NOT a source: codex_unsandboxed_ack: true in .warroom.yml still REFUSES', (t) => {
  // THIS IS THE REGRESSION TEST FOR THE P1. The finding was that a pull request
  // can flip a git-tracked ack, so the fix is worth exactly as much as this
  // assertion: if someone re-adds the config source — as an "alternative", as a
  // migration convenience, as a fallback — the P1 is reopened and this goes red.
  // MUTATION: restore `[ "$(_cfg codex_unsandboxed_ack)" = "true" ] && return 0`
  // → the first row launches. Red on the exit code and the tmux assertion.
  for (const value of ['true', 'yes', '1', 'True', 'TRUE', 'false', 'on', '']) {
    const p = launchableProject(t, { ack: false, configExtra: `codex_unsandboxed_ack: ${value}\n` });
    const sh = shim(t);
    const r = launch(p, ['1', '--engine', 'codex'], sh);
    assertAckRefusal(r, `codex_unsandboxed_ack: ${JSON.stringify(value)}`);
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${JSON.stringify(value)}: must build nothing`);
  }
});

test('a stale codex_unsandboxed_ack is called out on stderr, so a config cannot quietly mislead', (t) => {
  // A founder who reads their own .warroom.yml, sees `codex_unsandboxed_ack:
  // true` and concludes they are acknowledged is exactly who this line is for.
  // It fires whether or not the real acknowledgment is present, because being
  // acked for the wrong reason is the worse of the two.
  // MUTATION: delete the `if [ -n "$(_cfg codex_unsandboxed_ack)" ]` block →
  // both halves go red.
  const refused = launchableProject(t, { ack: false, configExtra: 'codex_unsandboxed_ack: true\n' });
  const r = launch(refused, ['1', '--engine', 'codex'], shim(t));
  assert.match(r.err, /ignoring codex_unsandboxed_ack/, `the stale key must be named: ${r.err}`);
  assert.match(r.err, /WARROOM_CODEX_ACK=true/, 'and the notice must point at the mechanism that works');

  const acked = launchableProject(t, { configExtra: 'codex_unsandboxed_ack: true\n' });
  const r2 = launch(acked, ['2', '--engine', '2:codex'], shim(t));
  assert.equal(r2.code, 0, r2.out + r2.err);
  assert.match(r2.err, /ignoring codex_unsandboxed_ack/, 'a stale key is called out on an ALLOWED launch too');
});

test('with the acknowledgment, codex launches — and the out-of-band warning still fires', (t) => {
  // Belt and suspenders: the gate does not retire the notice. The control on
  // the other side is every codex launch test in this file, all of which run
  // on acknowledged fixtures.
  // MUTATION: `[ "$val" = "true" ]` → `[ "$val" = "yes" ]` → this refuses. Red.
  const p = launchableProject(t);
  const sh = shim(t);
  const r = launch(p, ['2', '--engine', '2:codex'], sh);
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(launchLines(r.calls).get('proj:CEO-2') ?? '', /^codex\b/, 'pane 2 launches on codex');
  assert.match(r.err, /tool scoping is NOT enforced/, 'the acknowledged launch is still warned about');
  assert.doesNotMatch(r.err, /WARROOM_CODEX_ACK=true/, 'and the refusal text does not appear on a launch that was allowed');
});

test('the acknowledgment is about codex only: an all-claude war room needs none', (t) => {
  // MUTATION: drop the `[ "$eng" = "codex" ] || return 0` guard → this
  // refuses. Red.
  const p = launchableProject(t, { ack: false });
  const sh = shim(t);
  const r = launch(p, ['2'], sh);
  assert.equal(r.code, 0, r.out + r.err);
  assert.equal(launchLines(r.calls).get('proj:CEO-1'), 'claude');
  assert.doesNotMatch(r.err, /WARROOM_CODEX_ACK/);

  const inspect = warroom(project(t, { ack: false, configExtra: 'engine: claude\n' }), ['engine', '2']);
  assert.equal(inspect.code, 0, inspect.err);
  assert.deepEqual(panes(inspect).map((x) => x.engine), ['claude', 'claude']);
});

// ── The engine map across add, kill and done ─────────────────
//
// Each of these mutates $PROJECT_STATE_DIR/engines, the file that carries a
// pane's engine from one invocation to the next. None was tested: reverting
// any of the four lines below would have kept the suite green while a later
// `grid` or `restore` put a pane on the wrong engine.

/** A launchable project whose engine map says a war room is live with `ceos`. */
function liveMap(t, ceos) {
  const p = launchableProject(t);
  const stateDir = path.join(p.home, '.proj');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'engines'), ceos.map((c) => `${c.n}\t${c.engine}`).join('\n') + '\n');
  return p;
}

const readMap = (p) => {
  const f = path.join(p.home, '.proj', 'engines');
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).sort();
};

test('add records the new pane\'s engine and leaves the others alone', (t) => {
  // MUTATION: delete `engines_persist_pane "$n"` from cmd_add → the map
  // still reads 1 and 2 only. Red.
  // MUTATION: `engines_persist_pane "$n"` → `engines_persist "$n"` — the
  // whole-rewrite helper — → the map reads 3 alone. Red on the same line,
  // which is why all three entries are asserted and not just the new one.
  const p = liveMap(t, [{ n: 1, engine: 'claude' }, { n: 2, engine: 'codex' }]);
  const sh = shim(t, { sessionExists: true, windows: ['CEO-1', 'CEO-2'] });
  const r = launch(p, ['add', '--engine', '3:codex'], sh);
  assert.equal(r.code, 0, r.out);
  assert.match(launchLines(r.calls).get('proj:CEO-3') ?? '', /^codex\b/, 'the new pane must launch on codex');
  assert.deepEqual(readMap(p), ['1\tclaude', '2\tcodex', '3\tcodex']);
});

test('kill forgets the engine map — with a session running, and with none', (t) => {
  // Two branches of cmd_kill, one forget each. The no-session branch is the
  // one that clears a map left behind by `tmux kill-session`, a crash or a
  // reboot; without it, that map outranks `engine:` in .warroom.yml on the
  // next start.
  // MUTATION: delete the `engines_forget` after remove_worktrees → the live
  // case keeps its map. Red on the first assertion.
  // MUTATION: delete the `engines_forget` in the no-session branch → the
  // second case keeps its map. Red on the second.
  const live = liveMap(t, [{ n: 1, engine: 'codex' }]);
  const r1 = launch(live, ['kill'], shim(t, { sessionExists: true, windows: ['CEO-1'] }));
  assert.equal(r1.code, 0, r1.out);
  assert.equal(readMap(live), null, 'a killed war room must leave no engine map');

  const stale = liveMap(t, [{ n: 1, engine: 'codex' }]);
  const r2 = launch(stale, ['kill'], shim(t));
  assert.equal(r2.code, 0, r2.out);
  assert.match(r2.out, /No war room running/);
  assert.equal(readMap(stale), null, 'a kill with no session must still clear a stale map');
});

test('done forgets ONLY the closed pane\'s engine', (t) => {
  // `add` reuses the lowest free number, so a leftover entry would hand a
  // brand-new CEO the closed one's engine.
  // MUTATION: delete `engines_forget_pane "$n"` from cmd_done → the map
  // still reads 2. Red.
  // MUTATION: `engines_forget_pane "$n"` → `engines_forget` → the map is
  // gone entirely and CEO-1 loses its engine. Red on the same line.
  const p = liveMap(t, [{ n: 1, engine: 'claude' }, { n: 2, engine: 'codex' }]);
  const r = launch(p, ['done', '2'], shim(t, { sessionExists: true, windows: ['CEO-1', 'CEO-2'] }));
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(readMap(p), ['1\tclaude']);
});

// ── cost, read from the snapshot, under the shebang's bash ───────────────

test('cost with no live session reads the CEOs out of the snapshot', (t) => {
  // The branch that held the second `mapfile`. Under /bin/bash 3.2.57 that
  // builtin does not exist, the array stayed empty, and `cost` reported "No
  // active CEOs found" against a perfectly good snapshot. The harness runs
  // the launcher under /bin/bash (see BASH above), so on the founder's machine
  // this is the interpreter that counts.
  // MUTATION: replace the `while read` loop over the snapshot with
  // `mapfile -t ceo_nums < <(python3 …)` → under 3.2.57 "No active CEOs
  // found". Red there; green on a bash-5 CI runner, where the builtin
  // exists — which is why BASH is pinned rather than assumed.
  const p = launchableProject(t);
  const stateDir = path.join(p.home, '.proj');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, 'last.json'),
    JSON.stringify({
      version: 1,
      saved_at: 1767225600,
      project_dir: p.dir,
      grid_mode: false,
      ceos: [
        { n: 1, branch: 'ceo-1-1', wt_path: '', task: '', start_ts: 1, session_id: '' },
        { n: 2, branch: 'ceo-2-2', wt_path: '', task: '', start_ts: 2, session_id: '' },
      ],
    })
  );
  const r = launch(p, ['cost'], shim(t));
  assert.equal(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /No active CEOs found/, 'the snapshot names two CEOs and they must be read');
  const plain = r.out.replace(/\[[0-9;]*m/g, '');
  assert.match(plain, /CEO-1\s+\(no session ID\)/);
  assert.match(plain, /CEO-2\s+\(no session ID\)/);
  assert.match(plain, /Total session cost/);
});

test('cost from a LIVE session validates each window name as a pane number, skipping and naming what is not', (t) => {
  // FINDING 3. With a running session, cmd_cost read window names from tmux,
  // stripped `CEO-`, and fed the raw remainder into `cat ceo-<n>.session`,
  // `grep "^ceo-<n>:"` and _compute_ceo_cost — no validation, while its snapshot
  // sibling had checked pane_number_ok since the snapshot was first treated as
  // data. A window name is data: any process on the tmux socket can rename a
  // window. Both branches use the one predicate now.
  //
  // CEO-2 is a real pane number; `CEO-abc` is not. The fix skips `abc`, names it
  // on stderr, and never turns it into a `CEO-abc` cost row.
  // MUTATION: drop the `pane_number_ok "$_cn"` gate in the tmux branch (feed the
  // raw value like the pre-fix code) → `abc` reaches _compute_ceo_cost and prints
  // `CEO-abc  (no session ID)` on stdout. Red on both stdout assertions.
  const p = launchableProject(t);
  const sh = shim(t, { sessionExists: true, windows: ['CEO-2', 'CEO-abc'] });
  const r = launch(p, ['cost'], sh);
  assert.equal(r.code, 0, r.out + r.err);
  const plain = r.out.replace(/\[[0-9;]*m/g, '');
  assert.match(plain, /CEO-2\s+\(no session ID\)/, 'the valid pane is still costed');
  assert.doesNotMatch(
    plain,
    /CEO-abc\s+\(no session ID\)/,
    'the non-numeric window must not become a CEO cost row'
  );
  assert.match(r.err, /skipping window 'CEO-abc'/, 'and it must be named on stderr, not dropped in silence');
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

test('a hostile snapshot FILENAME is data, not python: the injection in the name never runs', (t) => {
  // FINDING 2. cmd_restore read the chosen snapshot through
  // `python3 -c "...open('${chosen_snapshot}')..."`, splicing the PATH straight
  // into single-quoted Python source. A file under the snapshots directory whose
  // NAME closes that quote runs whatever follows — and a checkout with a
  // state_dir inside the project carries snapshot files as easily as it carries
  // a config, so the name is attacker-controlled. Every `python3 -c` that touched
  // a shell value was converted to pass it via argv (`open(sys.argv[1])`), which
  // is the whole class; this pins the restore sink that motivated it.
  //
  // The snapshot is the ONLY one present and is selected with `restore latest`,
  // so the hostile name is what reaches the interpreter. Its name closes the
  // open('') and calls os.system to drop a canary.
  // MUTATION: put any restore site back to `open('${chosen_snapshot}')` (start
  // with snapshot_ns) → the canary is created and the run proceeds. Red on the
  // canary assertion.
  const p = launchableProject(t);
  const canary = path.join(p.home, `PWNED-${process.pid}`);
  const snaps = path.join(p.home, '.proj', 'snapshots');
  fs.mkdirSync(snaps, { recursive: true });
  gitIn(p, 'branch', 'ceo-1', 'main');
  // A real, valid snapshot BODY — one CEO — under the hostile NAME, so the
  // defence has to be the name being treated as a path, not the body being
  // unreadable: the argv-passed launcher opens this file and restores it.
  const body = JSON.stringify({
    saved_at: 1767225600, project_dir: p.dir, grid_mode: false,
    ceos: [{ n: 1, branch: 'ceo-1', wt_path: path.join(p.dir, '.worktrees', 'ceo-1'), task: '', start_ts: 0, session_id: '' }],
  });
  // The name closes the string and the open()/json.load() parens, then creates
  // the canary via os.environ (so the NAME carries no '/', which would make it a
  // nonexistent subdir on disk), then `#.json` comments the tail and keeps the
  // file matching the `*.json` glob restore selects on. When spliced into
  // `json.load(open('DIR/x'));import os;...`, the leading `open('DIR/x')` must
  // SUCCEED or the injected code never runs and the test would pass on the
  // vulnerable code by accident — so a real `x` holding `{}` is seeded in DIR
  // (no `.json`, so it is never itself a snapshot candidate) for that open to
  // resolve to.
  fs.writeFileSync(path.join(snaps, 'x'), '{}');
  const hostile = `x'));import os;open(os.environ['CANARY'],'w')#.json`;
  fs.writeFileSync(path.join(snaps, hostile), body);
  const sh = shim(t, { sessionExists: false });
  const r = launch(p, ['restore', 'latest'], sh, { env: { CANARY: canary } });
  // The one assertion that matters: the name did not execute.
  assert.equal(fs.existsSync(canary), false, `the snapshot name must not run as code: ${r.out}`);
  // And with the name treated as a literal path, python reads the file it names
  // and the restore proceeds normally — a valid one-CEO snapshot restores.
  assert.equal(r.code, 0, `a hostile NAME with a valid BODY still restores: ${r.out}${r.err}`);
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

// ═══════════════════════════════════════════════════════════════════════════
//  THE WHOLE CLASS, NOT THE NAMED MEMBER
// ═══════════════════════════════════════════════════════════════════════════
//
// The entry_ceo fix above closed the one read a review had named, and the
// state_dir fix closed the one write. A later review found that each was one
// member of a class with more members: every other file this program reads and
// ships (the seed fallback, the agent files whose names go into the Codex
// preamble) and every path it writes under (a symlinked state_dir passes the
// lexical rule; so does a symlink inside it; so does a symlinked .worktrees; so
// does a snapshot's wt_path, which was never judged at all). Each test below is
// one member, and each was watched going red under the mutation it names.

// ── Class A: the seed fallback is a read like any other ──────────────────

/**
 * A project with NO entry file, so the launcher falls through to the seed
 * convention `.claude/agents/_seeds/ceo.md` — which here is a symlink to a
 * secret outside the project.
 */
function projectWithSeedSecret(t, { launchable = false } = {}) {
  const p = launchable ? launchableProject(t) : project(t);
  fs.rmSync(p.entry);
  fs.writeFileSync(path.join(p.home, 'SECRET'), SECRET);
  const seeds = path.join(p.dir, '.claude', 'agents', '_seeds');
  fs.mkdirSync(seeds, { recursive: true });
  fs.symlinkSync(path.join(p.home, 'SECRET'), path.join(seeds, 'ceo.md'));
  return p;
}

test('the seed fallback cannot point outside the project either: a symlinked _seeds/ceo.md is never read into a preamble', (t) => {
  // The entry_ceo fix confined the configured key and left the fallback two
  // lines below it with no check at all — same `cat`, same sink, no guard.
  // MUTATION: delete the `_require_inside ".claude/agents/_seeds/ceo.md" …`
  // line → both renderings print the secret and exit 0. Red on the content
  // assertion first, for both engines.
  const p = projectWithSeedSecret(t);
  for (const eng of ['claude', 'codex']) {
    const r = warroom(p, ['engine', 'render', eng]);
    assert.doesNotMatch(r.out, /SECRET_SENTINEL_9f1c/, `${eng}: the secret must not be rendered`);
    assert.notEqual(r.code, 0, `${eng}: and the launcher must refuse`);
    assert.ok(r.err.includes('_seeds/ceo.md'), `the refusal must name the file: ${r.err}`);
  }
});

test('a symlinked seed on the real launch path reaches no pane, no preamble file and no tmux argv', (t) => {
  // Same three sinks as the entry_ceo launch test: the paste for a Claude pane,
  // the codex preamble file, and every argument tmux was ever given.
  // MUTATION: as above → the paste for CEO-1 and the preamble file for CEO-2
  // both carry the secret. Red.
  const p = projectWithSeedSecret(t, { launchable: true });
  const sh = shim(t);
  const r = launch(p, ['2', '--engine', '2:codex'], sh);

  assert.notEqual(r.code, 0, `must refuse: ${r.out}`);
  const everyArg = r.calls.flat().join('\n');
  assert.doesNotMatch(everyArg, /SECRET_SENTINEL_9f1c/, 'the secret must reach no tmux argument');
  const rendered = path.join(p.home, '.proj', 'entry', 'ceo.codex.md');
  if (fs.existsSync(rendered)) {
    assert.doesNotMatch(fs.readFileSync(rendered, 'utf8'), /SECRET_SENTINEL_9f1c/, 'nor the codex preamble file');
  }
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'a refused seed must build nothing');
  assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, 'and create no worktree');
});

test('a real seed file inside the project is still the fallback when there is no entry file', (t) => {
  // The control: 8 of 12 fleet launchers used this convention, and a check
  // that refused every seed would put them all on the minimal built-in with
  // one warning nobody reads.
  // MUTATION: none needed; this is the negative half of the pair.
  const p = project(t);
  fs.rmSync(p.entry);
  const seeds = path.join(p.dir, '.claude', 'agents', '_seeds');
  fs.mkdirSync(seeds, { recursive: true });
  fs.writeFileSync(path.join(seeds, 'ceo.md'), 'SEED_BODY_OK from the seed convention');
  for (const eng of ['claude', 'codex']) {
    const r = warroom(p, ['engine', 'render', eng]);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /SEED_BODY_OK/, `${eng}: the seed must be the preamble`);
  }
});

// ── Class A: the agent files whose NAMES go into the codex preamble ─────

test('the codex preamble lists the tool-scoped engines, derived from the agent files and only those inside the project', (t) => {
  // engine_toolscoped_names had no test: the list is derived from
  // `.claude/agents/*.md`, and the rule — every file whose `tools:` line names
  // neither Write nor Edit — was asserted by a comment.
  // MUTATION: delete `*Write*|*Edit*) continue ;;` → writer-beta and
  // editor-gamma are listed. Red.
  // MUTATION: delete `[ -n "$tools" ] || continue` → notools-delta is listed. Red.
  // MUTATION: delete the per-file `_inside_phys` skip → outside-epsilon is
  // listed and nothing is said. Red on both assertions about it.
  // MUTATION: put the single-line `grep -m1 '^tools:'` back in place of the
  // awk → block-writer-theta's `tools:` line is bare, carries no Write, and
  // the writer is listed as tool-scoped. Red on `must not be listed`. That is
  // the direction the list must never be wrong in: a Codex pane reads it as
  // permission to act as the engine.
  const p = project(t);
  const agents = path.join(p.dir, '.claude', 'agents');
  const write = (name, body) => fs.writeFileSync(path.join(agents, `${name}.md`), body);
  write('scoped-alpha', '---\nname: scoped-alpha\ntools: [Read, Grep, Glob]\n---\n# read-only\n');
  write('scoped-zeta', '---\ntools: [Read]\n---\n');
  write('writer-beta', '---\ntools: [Read, Write]\n---\n');
  write('editor-gamma', '---\ntools: [Edit, Read]\n---\n');
  write('notools-delta', '---\nname: notools-delta\n---\n');
  // YAML block style: `tools:` alone on its line, the items under it. A
  // read-only one is listed like its flow-style twin; a writer is not.
  write('block-eta', '---\nname: block-eta\ntools:\n  - Read\n  - Grep\nmodel: claude-opus-5\n---\n');
  write('block-writer-theta', '---\ntools:\n  - Read\n  - Write\n---\n');
  fs.writeFileSync(path.join(p.home, 'outside-epsilon.md'), '---\ntools: [Read]\n---\n');
  fs.symlinkSync(path.join(p.home, 'outside-epsilon.md'), path.join(agents, 'outside-epsilon.md'));

  const r = warroom(p, ['engine', 'render', 'codex']);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /the tool-scoped engines are: block-eta scoped-alpha scoped-zeta\./, `the list must be exactly the read-only engines: ${r.out}`);
  for (const name of ['writer-beta', 'editor-gamma', 'notools-delta', 'outside-epsilon', 'block-writer-theta']) {
    assert.doesNotMatch(r.out, new RegExp(name), `${name} must not be listed`);
  }
  assert.match(r.err, /outside-epsilon\.md resolves outside the project/, 'and the founder is told which file was skipped');
  assert.match(r.out, /SENTINEL_BODY_ALPHA/, 'the shared body still follows the adapter');

  // The sentence is the codex adapter's. Claude is scoped structurally and
  // gets the body alone.
  const c = warroom(p, ['engine', 'render', 'claude']);
  assert.equal(c.code, 0, c.err);
  assert.doesNotMatch(c.out, /tool-scoped engines are/);

  // A project with nothing scoped renders no sentence, not an empty list.
  const q = project(t);
  const e = warroom(q, ['engine', 'render', 'codex']);
  assert.equal(e.code, 0, e.err);
  assert.doesNotMatch(e.out, /tool-scoped engines are/);
  assert.match(e.out, /SENTINEL_BODY_ALPHA/);
});

test('a symlinked .claude/agents directory is not read: the founder\'s file names reach no preamble', (t) => {
  // What leaves through this read is each file's NAME. `.claude/agents ->
  // ~/notes` would have listed the founder's note titles — every one with a
  // `tools:` line lacking Write and Edit — to a model provider.
  // MUTATION: delete the directory-level `_inside_phys` check → the name is
  // listed. Red.
  const p = project(t);
  const agents = path.join(p.dir, '.claude', 'agents');
  const outside = path.join(p.home, 'notes');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'ceo.md'), '# ceo\n');
  fs.writeFileSync(path.join(outside, 'founders-private-title.md'), '---\ntools: [Read]\n---\n');
  fs.rmSync(agents, { recursive: true, force: true });
  fs.symlinkSync(outside, agents);

  const r = warroom(p, ['engine', 'render', 'codex']);
  assert.equal(r.code, 0, r.err);
  assert.doesNotMatch(r.out, /founders-private-title/, 'a name from outside the project must not be rendered');
  assert.doesNotMatch(r.out, /tool-scoped engines are/);
  assert.match(r.err, /resolves outside the project; no engine is read from it/);
});

// ── Class B: the directories this program WRITES under ───────────────────

test('a symlinked state_dir inside the project is refused physically: nothing is written where it points', (t) => {
  // `.claude/state` is lexically under the project and _path_under passes it.
  // The link sends it under $HOME — which the lexical rule ALSO accepts as a
  // base — so the physical check has to be against the base the lexical half
  // chose, or a git-tracked link picks any directory under the founder's home
  // for every write this program makes.
  // MUTATION: delete the `_require_inside state_dir …` call → row 1 creates
  // `entry/` in the target and row 2 writes `engines` there; both exit 0. Red.
  // MUTATION: `_STATE_BASE="$HOME"` unconditionally (check against "either
  // base") → the target is under $HOME, passes, red the same way.
  const rows = [
    ['the inspection path writes the codex preamble', ['engine', '1', '--engine', 'codex'], true],
    ['the launch path writes the engine map', ['1'], true],
    // A DANGLING link is refused rather than resolved past: `mkdir -p` would
    // have created the target through it.
    ['a dangling link', ['1'], false],
  ];
  for (const [label, args, targetExists] of rows) {
    const p = launchableProject(t);
    const target = path.join(p.home, 'elsewhere');
    if (targetExists) fs.mkdirSync(target);
    fs.writeFileSync(p.config, `session: proj\nproject_dir: ${p.dir}\nstate_dir: .claude/state\n`);
    fs.symlinkSync(target, path.join(p.dir, '.claude', 'state'));
    const sh = shim(t);
    const r = launch(p, args, sh);
    assert.notEqual(r.code, 0, `${label}: must refuse: ${r.out}`);
    assert.ok(r.err.includes("'state_dir'"), `${label}: the refusal must name the key: ${r.err}`);
    if (targetExists) {
      assert.deepEqual(fs.readdirSync(target), [], `${label}: nothing may be written where the link points`);
    } else {
      assert.equal(fs.existsSync(target), false, `${label}: the link's target must not be created`);
    }
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${label}: a refused config must build nothing`);
    assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, `${label}: and create no worktree`);
  }
});

test('a symlink INSIDE state_dir is refused before any write: the file it points at is never touched', (t) => {
  // The base check bounds the directory and says nothing about a link one
  // level down. `entry/ceo.codex.md -> ~/VICTIM` is followed by
  // `render_ceo_preamble > "$f"`, and `engines -> ~/VICTIM` by `: >`. Both
  // OVERWRITE. The content assertion comes first because it is the effect.
  // MUTATION: delete the `find "$PROJECT_STATE_DIR" -type l` sweep → row 1
  // overwrites VICTIM with the codex preamble and row 2 truncates it to the
  // engine map; both exit 0. Red on the content assertion.
  for (const [label, link, args] of [
    ['the rendered preamble', path.join('entry', 'ceo.codex.md'), ['engine', '1', '--engine', 'codex']],
    ['the engine map', 'engines', ['1']],
  ]) {
    const p = launchableProject(t);
    const victim = path.join(p.home, 'VICTIM');
    fs.writeFileSync(victim, 'VICTIM_BODY_intact');
    const state = path.join(p.dir, '.claude', 'state');
    fs.mkdirSync(path.dirname(path.join(state, link)), { recursive: true });
    fs.symlinkSync(victim, path.join(state, link));
    fs.writeFileSync(p.config, `session: proj\nproject_dir: ${p.dir}\nstate_dir: .claude/state\n`);
    const sh = shim(t);
    const r = launch(p, args, sh);
    assert.equal(fs.readFileSync(victim, 'utf8'), 'VICTIM_BODY_intact', `${label}: the link's target must be untouched`);
    assert.notEqual(r.code, 0, `${label}: and the launcher must refuse: ${r.out}`);
    assert.match(r.err, /state_dir holds a symlink/, `${label}: ${r.err}`);
    assert.ok(r.err.includes(path.join(state, link)), `${label}: the refusal must name the link: ${r.err}`);
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${label}: a refused config must build nothing`);
  }
});

test('a symlinked .worktrees is refused: no CEO tree is created where it points', (t) => {
  // Derived from project_dir, not chosen by a key, and the same class: a
  // checkout carrying `.worktrees -> ~/somewhere` chose where every
  // `git worktree add` lands, and .registry, .task and .session with it.
  // MUTATION: delete the `_require_inside worktrees …` call → `ceo-1-<ts>` is
  // created under the target and the run exits 0. Red.
  const p = launchableProject(t);
  const target = path.join(p.home, 'trees-elsewhere');
  fs.mkdirSync(target);
  fs.symlinkSync(target, path.join(p.dir, '.worktrees'));
  const r = launch(p, ['1'], shim(t));
  assert.notEqual(r.code, 0, `must refuse: ${r.out}`);
  assert.ok(r.err.includes("'worktrees'"), `the refusal must say what was refused: ${r.err}`);
  assert.deepEqual(fs.readdirSync(target), [], 'nothing may be created where the link points');
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'and tmux must build nothing');
});

test('a snapshot naming a worktree outside .worktrees refuses the whole restore, before the kill', (t) => {
  // wt_path was the one snapshot field never judged: it went straight to
  // `git worktree add "$wt_path"` and to a pane's `-c`. This program only
  // ever records `$WORKTREES_DIR/ceo-N-TS`, so anything else is corruption
  // and takes the corruption arm — refuse everything, destroy nothing.
  // MUTATION: delete the wt_path loop in cmd_restore → row 1 runs
  // `git worktree add $HOME/escape-wt ceo-1`, which succeeds, and the session
  // is killed and rebuilt. Red on the kill, on the directory, and on the exit.
  const rows = [
    ['an absolute path outside', (p) => path.join(p.home, 'escape-wt')],
    ['a `..` walking out of .worktrees', (p) => path.join(p.dir, '.worktrees', '..', 'escape-wt')],
    ['a shell metacharacter', (p) => `${path.join(p.dir, '.worktrees', 'ceo-1')}$(touch ${path.join(p.home, 'escape-wt')})`],
  ];
  for (const [label, wtPath] of rows) {
    const p = restorableProject(t, [{ n: 1, branch: 'ceo-1', wt_path: wtPath }]);
    const r = launch(p, ['restore', 'latest'], shim(t, { sessionExists: true }));
    assert.notEqual(r.code, 0, `${label}: must refuse: ${r.out}`);
    assert.match(r.err, /names a worktree outside/, `${label}: ${r.err}`);
    assert.equal(fs.existsSync(path.join(p.home, 'escape-wt')), false, `${label}: nothing may be created outside`);
    assert.deepEqual(r.calls.filter((c) => c[0] === 'kill-session'), [], `${label}: the running session must survive`);
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], `${label}: and nothing may be built`);
  }
});

// ── The branches the earlier coverage did not reach ──────────────────────

test('a grid-mode snapshot restores into ONE GRID window, one pane per CEO, each on its own engine', (t) => {
  // cmd_restore has two layouts and restorableProject hardcoded the other.
  // MUTATION: `print(str(d.get('grid_mode', False)).lower())` → `print('false')`
  // → CEO-N windows and CEO-N.1 targets. Red on the target keys.
  // MUTATION: in the grid branch, `send_launch_claude "$pane_target"` →
  // `send_launch_claude "$pane_target" "" claude` → GRID.2 comes up claude.
  // Red — pane_number_of on the GRID target is what finds CEO-2's engine.
  const p = restorableProject(
    t,
    [
      { n: 1, branch: 'ceo-1' },
      { n: 2, branch: 'ceo-2', engine: 'codex' },
    ],
    { gridMode: true }
  );
  const r = launch(p, ['restore', 'latest'], shim(t));
  assert.equal(r.code, 0, r.out);
  const created = r.calls.find((c) => c[0] === 'new-session');
  assert.ok(created, 'a session must be created');
  assert.equal(created[created.indexOf('-n') + 1], 'GRID', 'and its one window is GRID');
  assert.equal(r.calls.filter((c) => c[0] === 'split-window').length, 1, 'the second CEO is a pane, not a window');
  // HQ is still its own window in grid mode; what must not exist is a CEO-N one.
  assert.deepEqual(
    r.calls.filter((c) => c[0] === 'new-window' && /^CEO-/.test(c[c.indexOf('-n') + 1] ?? '')),
    [],
    'no CEO-N window in grid mode'
  );
  const lines = launchLines(r.calls);
  assert.deepEqual([...lines.keys()].sort(), ['proj:GRID.1', 'proj:GRID.2']);
  assert.equal(lines.get('proj:GRID.1'), 'claude');
  assert.match(lines.get('proj:GRID.2'), /^codex\b/, 'CEO-2 must come back on the engine the snapshot recorded');
  assert.match(r.out, /CEO-2 \(GRID\.2\)/, 'and the restore must say which pane holds it');
});

test('add checks the binary of the pane it is about to create, before tmux builds anything', (t) => {
  // The ordering fix in cmd_add — resolve the NEW pane, then check_deps — was
  // covered only by the inspection path. Here `codex` is genuinely absent and
  // the session is live.
  // MUTATION: in engines_setup, move `engines_resolve "$@"` below the deps
  // check → check_deps' fallback resolves pane 1 (claude, present) and
  // passes; the window is built and `codex …` typed into it; exit 0. Red on
  // the exit code and on the mutating calls. (The sequence lived in cmd_add
  // itself once; the swap was of those two lines.)
  const p = liveMap(t, [{ n: 1, engine: 'claude' }]);
  const sh = shim(t, { sessionExists: true, windows: ['CEO-1'], engines: ['claude'] });
  const r = launch(p, ['add', '--engine', '2:codex'], sh);
  assert.notEqual(r.code, 0, `must refuse: ${r.out}`);
  assert.match(r.out, /codex not found/, 'and name the binary the new pane needs');
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'a refused add must build nothing');
  assert.deepEqual(readMap(p), ['1\tclaude'], 'and must not record a pane that was never made');
});

test('save_session_snapshot drops an unreadable session id and an unknown engine at WRITE time, and says so', (t) => {
  // cmd_restore's read-time refusal rests on "this program never records one
  // outside the charset". That premise lives in _snapshot_one_ceo and had no
  // test: a `.session` file or an engine map this program did not write is
  // judged there, dropped, and warned about — the drop is what keeps a bad
  // snapshot corruption rather than routine.
  // MUTATION: delete `session_id=""` in the `! session_id_ok` arm → last.json
  // carries the payload. Red.
  // MUTATION: delete `engine=""` in the `! engine_is_known` arm → last.json
  // carries `nope`, and the next restore refuses a snapshot this program
  // wrote. Red.
  const p = launchableProject(t);
  const started = launch(p, ['1'], shim(t));
  assert.equal(started.code, 0, started.out);
  fs.writeFileSync(path.join(p.dir, '.worktrees', 'ceo-1.session'), 'abc; touch PAYLOAD\n');
  fs.writeFileSync(path.join(p.home, '.proj', 'engines'), '1\tnope\n');

  const killed = launch(p, ['kill'], shim(t, { sessionExists: true, windows: ['CEO-1'] }));
  assert.equal(killed.code, 0, killed.out);
  const snap = JSON.parse(fs.readFileSync(path.join(p.home, '.proj', 'last.json'), 'utf8'));
  assert.equal(snap.ceos.length, 1, JSON.stringify(snap));
  assert.equal(snap.ceos[0].session_id, '', 'the unreadable id must be dropped, not recorded');
  assert.equal(snap.ceos[0].engine, '', 'the unknown engine must be dropped, not recorded');
  assert.match(killed.err, /CEO-1: ignoring an unreadable session id/);
  assert.match(killed.err, /CEO-1: ignoring an unknown engine \(nope\)/);
});

// ── _phys_path: the symlink-depth bound ──────────────────────
//
// Every path this program confines — entry_ceo, the seed, state_dir, the
// worktrees dir, each agent file — is resolved by _phys_path, and the file
// branch of it walks a link chain by hand with a 16-hop bound. The bound had
// no test: it could have been 1, or 1000, or absent, and nothing here moved.

/**
 * A chain of `hops` file symlinks under `dir` ending at `dir/real`; returns
 * the entry link. The links are RELATIVE (`l2 -> l1`) on purpose: an absolute
 * target under os.tmpdir() — `/var/…` on macOS, itself a link to
 * `/private/var` — costs the kernel two hops per link, so sixteen absolute
 * links reach SYMLOOP_MAX (32) and `[ -e ]` refuses the chain before the
 * hand-walk ever sees it. Relative links cost one hop each, which keeps every
 * row below the kernel's own limit and makes _phys_path's bound the only thing
 * deciding it. Measured: the absolute form failed the 16-hop row here.
 */
function symlinkChain(dir, hops) {
  fs.mkdirSync(dir);
  const real = path.join(dir, 'real');
  fs.writeFileSync(real, 'the file at the end of the chain');
  let prev = 'real';
  for (let i = 1; i <= hops; i++) {
    fs.symlinkSync(prev, path.join(dir, `l${i}`));
    prev = `l${i}`;
  }
  return { entry: path.join(dir, prev), physReal: fs.realpathSync(real) };
}

/** `_phys_path <target>` through the real definition: [rc, printed path]. */
function physPath(p, target) {
  const r = warroomEval(p, `out="$(_phys_path ${sq(target)})"; rc=$?; printf '%s\n%s' "$rc" "$out"`);
  assert.equal(r.code, 0, `the shell must finish — a hang here is the loop that never terminated: ${r.err}`);
  const [rc, out = ''] = r.out.split('\n');
  return [rc, out];
}

test('_phys_path follows a file symlink chain of 16 hops and refuses one of 17', (t) => {
  // 16 is the bound in the source (`[ "$hops" -lt 16 ]`): sixteen links
  // resolve to the file, the seventeenth is still a link when the loop stops
  // and is refused. Both sides of the line are asserted so an off-by-one in
  // either direction is red. The 17-hop chain is one the KERNEL still
  // resolves (SYMLOOP_MAX is 32 on macOS, 40 on Linux), so `[ -e ]` passes
  // it and the hand-walk is the only thing that stops it.
  // MUTATION: `-lt 16` → `-lt 15` → the 16-hop row is refused. Red.
  // MUTATION: `-lt 16` → `-lt 17`, or delete the `&& [ "$hops" -lt 16 ]`
  // clause → the 17-hop row resolves to the file. Red.
  const p = project(t);
  for (const [hops, resolves] of [
    [1, true],
    [15, true],
    [16, true],
    [17, false],
  ]) {
    const { entry, physReal } = symlinkChain(path.join(p.home, `chain-${hops}`), hops);
    // Load-bearing: if the kernel refused the chain, `[ ! -e ]` would take the
    // walk-up branch and refuse it there, and the 17-hop row would be green
    // with the hand-walk's bound deleted.
    assert.ok(fs.existsSync(entry), `${hops} hops: the kernel itself must still resolve this chain`);
    const [rc, out] = physPath(p, entry);
    if (resolves) {
      assert.equal(rc, '0', `${hops} hops must resolve`);
      assert.equal(out, physReal, `${hops} hops must resolve to the real file`);
    } else {
      assert.equal(rc, '1', `${hops} hops must be refused`);
      assert.equal(out, '', `${hops} hops: a refusal prints no path — a partial one would be trusted`);
    }
  }
});

test('_phys_path meets a symlink cycle, terminates, and refuses it — with no path printed', (t) => {
  // a → b → a. The kernel reports ELOOP for it, so `[ -e ]` fails and the
  // walk-up loop meets a link that "does not exist": that is the `[ -L "$p" ]
  // && return 1` line, which refuses rather than resolving PAST the link by
  // treating it as a not-yet-created tail under its parent. Both entry points
  // are tried — the link itself, and a state_dir-shaped path beneath it —
  // because the second is the shape a first-run `mkdir -p` would have walked.
  //
  // The hand-walk's own bound is what the 17-hop test above pins; a cycle
  // never reaches that loop, because stat refuses it first. Named here so
  // nobody reads this test as covering the bound.
  //
  // MUTATION: delete `[ -L "$p" ] && return 1` from the walk-up loop → `a` is
  // appended as a tail under its parent and `<home>/a` is printed, rc 0 — a
  // path this program would then `mkdir -p` and write through. Red on both
  // rows, on rc and on the printed path.
  // MUTATION: `return 1` → `return 0` on that line → red on rc.
  const p = project(t);
  const a = path.join(p.home, 'a');
  const b = path.join(p.home, 'b');
  fs.symlinkSync(b, a);
  fs.symlinkSync(a, b);
  assert.equal(fs.existsSync(a), false, 'a cycle is ELOOP to the kernel: the fixture is a real cycle');
  for (const [label, target] of [
    ['the cycle itself', a],
    ['a path not yet created under it', path.join(a, 'state')],
  ]) {
    const [rc, out] = physPath(p, target);
    assert.equal(rc, '1', `${label} must be refused`);
    assert.equal(out, '', `${label}: nothing may be printed — a resolved-past path would be written through`);
  }
});

// ── The state_dir symlink sweep: who is swept and who is not ───────────
//
// The sweep runs at dispatch for every command not on the router's allowlist
// of readers. The allowlist had no test: a writer added to it stopped being
// swept, a reader dropped from it started paying for a `find` over months of
// history, and nothing here moved either way.

/** A project whose state_dir holds one symlink, pointing at a file that must survive. */
function projectWithLinkInState(t) {
  const p = launchableProject(t);
  const state = path.join(p.home, '.proj');
  const victim = path.join(p.home, 'VICTIM');
  fs.mkdirSync(state, { recursive: true });
  fs.writeFileSync(victim, 'VICTIM_BODY_intact');
  fs.symlinkSync(victim, path.join(state, 'events.jsonl'));
  return { ...p, victim, link: path.join(state, 'events.jsonl') };
}

test('the read-only commands skip the state_dir symlink sweep, and every other command runs it', (t) => {
  // Readers: the ones the brief names, run against a state_dir holding a link.
  // Each exits 0 and says nothing about symlinks — the sweep did not run. With
  // no session live they take their "nothing running" branch, which is the
  // cheapest proof that dispatch reached the command at all.
  // MUTATION: drop `ls` (or any of these) from the allowlist → that row is
  // refused with `state_dir holds a symlink`. Red on the exit code.
  // MUTATION: add `send` (or `add`, `done`, `kill`) to the allowlist → that
  // writer row exits without the refusal. Red on its stderr assertion.
  // MUTATION: delete the `events)` arm → bare `events` falls to `*)`, is
  // swept, and is refused. Red on the events reader row.
  // MUTATION: `events) : ;;` (never sweep events) → `events clear` runs, and
  // `rm -f` follows the link's NAME rather than its target so the victim
  // survives anyway — which is why the writer rows assert the REFUSAL, not
  // only the victim. Red on `events clear`'s stderr assertion.
  const sh = shim(t);
  const readers = [
    ['ls', ['ls']],
    ['history', ['history']],
    ['inbox', ['inbox']],
    ['files', ['files']],
    ['log', ['log']],
    ['events', ['events']],
  ];
  for (const [label, args] of readers) {
    const p = projectWithLinkInState(t);
    const r = warroom(p, args, { path: sh.path });
    assert.equal(r.code, 0, `${label} reads only and must not be swept: ${r.out}${r.err}`);
    assert.doesNotMatch(r.err, /state_dir holds a symlink/, `${label}: the sweep must not have run`);
    assert.equal(fs.readFileSync(p.victim, 'utf8'), 'VICTIM_BODY_intact', `${label} must not touch the link's target`);
  }
  const writers = [
    ['events clear', ['events', 'clear']],
    ['a start', ['1']],
    ['add', ['add']],
    ['done', ['done', '1']],
    ['kill', ['kill']],
    ['send', ['send', '1', 'hello']],
  ];
  for (const [label, args] of writers) {
    const p = projectWithLinkInState(t);
    const r = warroom(p, args, { path: sh.path });
    assert.notEqual(r.code, 0, `${label} writes under state_dir and must be swept: ${r.out}`);
    assert.match(r.err, /state_dir holds a symlink/, `${label}: the sweep must be what refused it: ${r.err}`);
    assert.ok(r.err.includes(p.link), `${label}: the refusal names the link: ${r.err}`);
    assert.equal(fs.readFileSync(p.victim, 'utf8'), 'VICTIM_BODY_intact', `${label} must not touch the link's target`);
  }
});

// ── An --engine override that names no resolved pane ─────────────────
//
// `3 --engine 5:codex` parsed clean — 5 is a pane number, codex is known — and
// then matched nothing for panes 1..3. The override was dropped in silence and
// the founder got three Claude panes where they had asked for a Codex one.
// engine_require_known refuses a bad VALUE for exactly this reason; this is
// the same rule for a bad TARGET.

test('an --engine override naming a pane this command never resolves is refused loudly, on every path', (t) => {
  // MUTATION: delete the `engine_overrides_require_resolved "$@"` call from
  // engines_resolve → every row exits 0 with the override dropped: the start
  // builds three claude panes, add builds CEO-2 on claude, restore rebuilds
  // both panes, the inspection lists three claude panes. Red on every row.
  // MUTATION: `exit 1` → `return 1` in engine_overrides_require_resolved →
  // engines_resolve ignores the status and the run continues. Red the same way.
  // MUTATION: `[ "$hit" -eq 1 ] && continue` → `[ "$hit" -eq 0 ] && continue`
  // → the in-range control row is refused and the out-of-range ones pass. Red.
  const refused = (r, label, pane, resolved) => {
    assert.notEqual(r.code, 0, `${label}: must refuse: ${r.out ?? ''}${r.err}`);
    assert.match(r.err, new RegExp(`--engine ${pane}:codex names CEO-${pane}`), `${label}: names the override: ${r.err}`);
    assert.match(r.err, new RegExp(`resolves only: ${resolved}\\.`), `${label}: names what it did resolve: ${r.err}`);
  };

  // A start of three panes, override on the fifth.
  {
    const p = launchableProject(t);
    const sh = shim(t);
    const r = launch(p, ['3', '--engine', '5:codex'], sh);
    refused(r, 'start', 5, 'CEO-1 CEO-2 CEO-3');
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'a refused start builds nothing');
    assert.equal(fs.existsSync(path.join(p.dir, '.worktrees')), false, 'and creates no worktree');
    assert.equal(readMap(p), null, 'and records no engine map');
  }

  // An add whose next slot is 2, override on 4.
  {
    const p = liveMap(t, [{ n: 1, engine: 'claude' }]);
    const sh = shim(t, { sessionExists: true, windows: ['CEO-1'] });
    const r = launch(p, ['add', '--engine', '4:codex'], sh);
    refused(r, 'add', 4, 'CEO-2');
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'a refused add builds nothing');
    assert.deepEqual(readMap(p), ['1\tclaude'], 'and the map is untouched');
  }

  // A restore of panes 1 and 3, override on 2, with a session LIVE — so a
  // check placed below the kill would show up as a kill-session here.
  {
    const p = restorableProject(t, [
      { n: 1, branch: 'ceo-1' },
      { n: 3, branch: 'ceo-3' },
    ]);
    const sh = shim(t, { sessionExists: true });
    const r = launch(p, ['restore', 'latest', '--engine', '2:codex'], sh);
    refused(r, 'restore', 2, 'CEO-1 CEO-3');
    assert.deepEqual(
      r.calls.filter((c) => c[0] === 'kill-session'),
      [],
      'a refused restore destroys nothing: the live session is kept'
    );
    assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'and builds nothing');
  }

  // The inspection command resolves the same way and refuses the same way,
  // so it cannot show three claude panes for a run that would have refused.
  {
    const p = project(t);
    const r = warroom(p, ['engine', '3', '--engine', '5:codex']);
    refused(r, 'engine', 5, 'CEO-1 CEO-2 CEO-3');
    assert.equal(panes(r).length, 0, 'no pane table is printed for a refused override');
  }

  // Control: the same override on a pane the command DOES resolve is honoured.
  {
    const p = project(t);
    const r = warroom(p, ['engine', '3', '--engine', '3:codex']);
    assert.equal(r.code, 0, r.err);
    assert.deepEqual(
      panes(r).map((x) => `${x.n}:${x.engine}`),
      ['1:claude', '2:claude', '3:codex']
    );
  }
});

// ── Two flag-parse holes ──────────────────────────────────────

test('a trailing --engine with no value is refused, not swallowed', (t) => {
  // `--engine` as the last word set ENGINE_NEXT and nothing consumed it; the
  // run went on with whatever the config said — the silent default every
  // other --engine failure is refused for.
  // MUTATION: delete the `if [ "$ENGINE_NEXT" -eq 1 ]` block after the parse
  // loop → `engine 3 --engine` lists three claude panes, exit 0, and the
  // launch row builds three panes. Red on both.
  const p = project(t);
  const r = warroom(p, ['engine', '3', '--engine']);
  assert.notEqual(r.code, 0, `must refuse: ${r.out}`);
  assert.match(r.err, /--engine needs a value/, r.err);
  assert.equal(panes(r).length, 0, 'and lists no pane');

  const lp = launchableProject(t);
  const sh = shim(t);
  const lr = launch(lp, ['3', '--engine'], sh);
  assert.notEqual(lr.code, 0, `the launch path must refuse: ${lr.out}`);
  assert.match(lr.err, /--engine needs a value/);
  assert.deepEqual(mutatingTmuxCalls(lr.calls), [], 'a refused parse builds nothing');
});

test('engine render with no engine name is refused, and renders nothing', (t) => {
  // The error branch of `engine render` was untested: a change that defaulted
  // the missing name would have printed a whole preamble for a question that
  // was never asked.
  // MUTATION: `render_ceo_preamble "$2"` → `render_ceo_preamble "${2:-claude}"`
  // and drop the empty-name guard → the claude preamble prints, exit 0. Red
  // on the exit code and on stdout being empty.
  const p = project(t);
  const r = warroom(p, ['engine', 'render']);
  assert.notEqual(r.code, 0, `must refuse: ${r.out}`);
  assert.match(r.err, /engine render needs an engine name/, r.err);
  assert.match(r.err, /claude codex/, 'and says which names it would take');
  assert.equal(r.out, '', 'nothing is rendered to stdout');
  assert.doesNotMatch(r.err, /SENTINEL_BODY_ALPHA/, 'and no preamble body leaks to stderr either');
});

// ── A renamed tmux window reaches four more commands ─────────
//
// `pane_number_ok` was applied to the launch path, to `done`, to the grid and
// to the snapshot, and FOUR commands were left reading the same tmux
// `list-windows` output through a bare `sed 's/CEO-//'`: ls, broadcast, inbox
// and files. A window name is data — `tmux rename-window` is available to
// anyone holding the socket, and a pane whose engine crashed can be renamed by
// what it printed — and from those four sites the value becomes an arithmetic
// context, a grep REGEX, a filesystem PATH and an argv to python3.
//
// Measured on /bin/bash 3.2.57 before choosing the guards, because the obvious
// story is wrong here: `$(…)` held in a variable and used inside `$(( ))` is
// NOT executed, it is a syntax error. What these sites actually suffer is a
// FATAL arithmetic abort mid-command (`ceo_files[$n]="x"` exits the shell
// outright, measured) and a regex and a path built from a stranger's string.
//
// Three of the four SKIP the window and say so; broadcast REFUSES. The split
// is by what the command is for, and each site carries its reasoning. What is
// asserted below is the property that makes a skip acceptable at all: the
// window is NAMED on stderr. A silent skip would print two CEOs where there
// are three, which is the failure this program spends most of its length
// refusing to commit.

/**
 * Just the STDOUT of a run. `launch` returns `out` as stdout+stderr, which is
 * right for "did it say this anywhere" and wrong for every assertion below:
 * the whole point of a skip-and-say-so is that the skip is on stderr and the
 * listing on stdout, and an assertion against the concatenation cannot tell
 * them apart — it reads the warning and calls the window listed.
 */
const stdoutOnly = (r) => r.out.slice(0, r.out.length - r.err.length);

/**
 * A live session holding one ordinary CEO and one window nobody can place.
 *
 * `windows` is a parameter and not a constant because ORDER is the whole
 * content of one of the tests below: with the unplaceable window first, a
 * per-iteration check and an up-front sweep are indistinguishable, because
 * neither has reached a good window yet when it refuses.
 */
function sessionWithARenamedWindow(t, { windows = ['CEO-08', 'CEO-1'] } = {}) {
  const p = runningSession(t, [{ n: 1, engine: 'claude' }], { engine: 'claude' });
  // `CEO-08` rather than `CEO-x`: it is the value `^[0-9]+$` accepted and
  // pane_number_ok does not, it is a fatal "value too great for base" in every
  // arithmetic context downstream, and it is octal 8 in the ones that survive
  // — so a guard that was loosened back to `[0-9]+` fails these too.
  // It is FIRST in the list so that a launcher without the guard meets it
  // before it has printed anything about the CEO that is fine.
  const sh = shim(t, { sessionExists: true, windows });
  return { p, sh };
}

test('ls leaves out a window that is not a CEO pane number, and says which', (t) => {
  // MUTATION: delete the `pane_number_ok`/continue guard at the top of cmd_ls's
  // window loop → `CEO-08` is listed as a CEO, with a broken colour and a
  // registry lookup done through it as a regex, and the footer counts 2 CEOs
  // where 1 is running. Red on the stdout assertions and on the stderr one.
  const { p, sh } = sessionWithARenamedWindow(t);
  const r = launch(p, ['ls'], sh);

  assert.equal(r.code, 0, `a listing must survive one renamed window: ${r.out}`);
  assert.doesNotMatch(stdoutOnly(r), /CEO-08/, 'the window it cannot place must not be listed as a CEO');
  assert.match(stdoutOnly(r), /CEO-1\b/, 'and the CEO that is fine must still be');
  assert.match(r.err, /CEO-08/, 'the skip must name the window');
  assert.match(r.err, /not a CEO pane number/, 'and say why it was left out');
});

test('broadcast refuses a window it cannot place, before it types into any pane', (t) => {
  // The one that refuses. The number is a PATH (`ceo-N.jsonl`) and an ARGV
  // (`int(sys.argv[2])`), and the argv is read AFTER tmux has been told: a
  // window named `CEO-x` gets the message typed into it and then loses the
  // record of it, while `sent` counts it, so the summary claims a delivery no
  // inbox will ever show.
  //
  // MUTATION: delete the up-front `pane_number_require` sweep and read the
  // name inside the send loop as before → `CEO-08` is typed into, an inbox
  // file `ceo-08.jsonl` is written (int('08') is 8, so it is even plausible),
  // and the run reports success. Red on the tmux assertion and on the
  // no-inbox-file one.
  // MUTATION: keep the sweep but move it INSIDE the send loop → CEO-08 is
  // FIRST in this fixture, so nothing is typed and this test still passes. It
  // cannot see that mutation and is not asked to; the test below is ordered
  // the other way and exists for exactly that, which is why the up-front sweep
  // is the fix rather than a per-iteration check.
  const { p, sh } = sessionWithARenamedWindow(t);
  const r = launch(p, ['broadcast', 'ship it'], sh);

  assert.notEqual(r.code, 0, `a broadcast with an unplaceable destination must refuse: ${r.out}`);
  assert.deepEqual(
    mutatingTmuxCalls(r.calls),
    [],
    'a refused broadcast must not have typed into any pane, including the ones it could place'
  );
  assert.match(r.err, /'08' is not a pane number/, 'and must name the value it refused');

  const msgDir = path.join(p.home, '.proj', 'messages');
  assert.deepEqual(
    fs.existsSync(msgDir) ? fs.readdirSync(msgDir) : [],
    [],
    'and must have recorded no message either'
  );
});

test('broadcast refuses up front: a GOOD window before the bad one still receives nothing', (t) => {
  // THE HEADLINE PROPERTY OF THE TEST ABOVE, WHICH THAT TEST DOES NOT CONSTRAIN.
  // It is named "before it types into any pane" and up-front-ness is what the
  // production comment claims about cmd_broadcast, but its fixture puts
  // `CEO-08` FIRST — so the refusal precedes every send whether the check is
  // an up-front sweep or a per-iteration one, and the assertion passes either
  // way. Measured 2026-09-11 by rewriting the sweep as a per-iteration
  // `pane_number_require` inside the send loop: `npm run check:warroom` stayed
  // at 118 of 118, exit 0. An untested headline property.
  //
  // Order is the entire difference. With a good window first, the two forms
  // separate: the sweep validates every window before typing into any, so
  // nothing is sent; the per-iteration form sends to CEO-1 and only then
  // refuses at CEO-08, leaving a PARTIAL broadcast — some CEOs told, some not,
  // and a non-zero exit that does not say which. That is mutate-then-refuse,
  // the same class as the zero-CEO restore bug closed in this commit's
  // neighbour, in the same file whose comment declares the class dead.
  //
  // MUTATION: move `pane_number_require` from the up-front loop into the send
  // loop → RED here on the send-keys assertion and on the inbox one, while the
  // test above stays GREEN. That contrast is the finding; a mutation that
  // reddens both would not have needed this test.
  const { p, sh } = sessionWithARenamedWindow(t, { windows: ['CEO-1', 'CEO-08'] });
  const r = launch(p, ['broadcast', 'ship it'], sh);

  assert.notEqual(r.code, 0, `a broadcast with an unplaceable destination must refuse: ${r.out}`);

  // ZERO sends, not "no send to the bad one". A broadcast is the one command
  // where a partial success is worst: the founder reads a failure and cannot
  // tell which CEOs already have the message.
  assert.deepEqual(
    r.calls.filter((c) => c[0] === 'send-keys'),
    [],
    'the CEO that comes BEFORE the unplaceable window must not have been typed into'
  );
  assert.deepEqual(mutatingTmuxCalls(r.calls), [], 'and nothing else in tmux may move either');

  const msgDir = path.join(p.home, '.proj', 'messages');
  assert.deepEqual(
    fs.existsSync(msgDir) ? fs.readdirSync(msgDir) : [],
    [],
    'and no inbox may have been written for the CEO it reached first'
  );

  assert.match(r.err, /'08' is not a pane number/, 'and it must still name the value it refused');
});

test('inbox skips a window it cannot place, and shows the CEO it can', (t) => {
  // The number becomes `$inbox_dir/ceo-${n}.jsonl` — a path — and a heading.
  // This site cannot refuse even if refusing were right: the loop is the
  // right-hand side of a pipe, so it is a subshell and an `exit` there ends
  // the subshell while the outer loop carries on against a truncated list.
  // That is the reasoning the guard carries, and this test pins the outcome.
  //
  // MUTATION: delete the guard → `_print_inbox 08` runs, prints the heading
  // `INBOX — CEO-08` and `(no messages)`, and the founder is shown an inbox
  // for a CEO that does not exist. Red on the stdout assertion.
  const { p, sh } = sessionWithARenamedWindow(t);
  const r = launch(p, ['inbox'], sh);

  assert.doesNotMatch(stdoutOnly(r), /CEO-08/, 'no inbox may be shown for a window that is not a CEO');
  assert.match(stdoutOnly(r), /INBOX/, 'and the CEO that is fine must still get one');
  assert.match(r.err, /CEO-08/, 'the skip must name the window it left out');
});

test('files skips a window it cannot place, and says which', (t) => {
  // The weakest of the four assertions, and the comment says so rather than
  // dressing it up: cmd_files is ALREADY broken on /bin/bash 3.2.57 by its
  // `declare -A` (measured: `declare: -A: invalid option`, after which
  // `file_owners[$file]="1"` is a fatal arithmetic error that exits the
  // shell). Fixing that is out of scope here, so this test asserts only what
  // holds on both sides of it — the window is named and skipped BEFORE any of
  // that is reached — and deliberately asserts nothing about the exit status
  // or about the report body.
  //
  // MUTATION: delete the guard → `CEO-08` falls through to the registry lookup
  // with no warning printed at all, and on a session where the registry does
  // resolve it the run dies at `${CEO_ANSI_COLORS[$(( (n - 1) % 6 ))]}`
  // mid-report. Red on the stderr assertion.
  const { p, sh } = sessionWithARenamedWindow(t);
  const r = launch(p, ['files'], sh);

  assert.match(r.err, /CEO-08/, 'the skip must name the window');
  assert.match(r.err, /its files are not shown/, 'and say what was left out');
});
