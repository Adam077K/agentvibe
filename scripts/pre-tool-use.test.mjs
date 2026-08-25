// POSTURE: BLOCKS — wired into `npm run check` as `test:pre-tool-use`. Every case below is a
// security property of .claude/hooks/pre-tool-use.sh, which is (since 5290edd unregistered
// budget-guard) the ONLY hook in the repo that can refuse a tool call.
//
// WHY THIS FILE EXISTS: the hook shipped with zero tests. A review on 2026-08-13 found it fails
// open in four independent ways, each reproduced by executing it. Written red-first: every
// `mustBlock` case below was verified FAILING against the pre-fix hook, so a green run proves the
// fix, not the test's own optimism.
//
// THE SECOND BARRIER: a test that only feeds pretty-printed JSON would pass against a hook that
// cannot parse the compact payload Claude Code actually sends. So every dangerous case runs
// through BOTH payload shapes, and `payload shapes are not silently identical` asserts the two
// encoders really do differ — without it, a bug that made both shapes pretty would turn this
// whole file into decoration.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HOOK = path.join(REPO, '.claude', 'hooks', 'pre-tool-use.sh')

const ALLOW = 0
const BLOCK = 2

// A test run must never write into the REAL events log. The MCP policy cases below record one
// line per governed call, and ~30 of those per run would land in ~/.agentvibe/events.jsonl — the
// file mission-control reads — turning the measurement this feature exists to produce into test
// noise. Pinned at module scope so both runners inherit it and neither had to be edited to get it.
process.env.WARROOM_EVENTS = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pre-tool-use-events-')), 'events.jsonl')

/** Claude Code sends compact JSON on one line; the hook's own header documents this shape. */
const compact = (obj) => JSON.stringify(obj)
/** Pretty-printed — the only shape the pre-fix hook's line-oriented awk could route correctly. */
const pretty = (obj) => JSON.stringify(obj, null, 2)

function runHook(payload, env = {}) {
  try {
    // CLAUDE_PROJECT_DIR is pinned to REPO by default: inheriting it from whatever shell launched
    // the test makes every scoping assertion depend on which worktree the harness started in.
    execFileSync('bash', [HOOK], {
      input: payload,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, CLAUDE_PROJECT_DIR: REPO, ...env },
    })
    return 0
  } catch (err) {
    if (typeof err.status === 'number') return err.status
    throw err
  }
}

const bash = (command) => ({ session_id: 'test-session', tool_name: 'Bash', tool_input: { command } })
const write = (file_path) => ({ session_id: 'test-session', tool_name: 'Write', tool_input: { file_path } })

// ── the guard must not depend on how the payload happens to be encoded ──────────────────────

test('payload shapes are not silently identical — the barrier that keeps this file honest', () => {
  const obj = bash('rm -rf /')
  assert.notEqual(compact(obj), pretty(obj), 'compact and pretty encoders produced the same string; every two-shape assertion below would be vacuous')
  assert.ok(!compact(obj).includes('\n'), 'compact payload must be single-line — that is the shape that defeated the awk parser')
  assert.ok(pretty(obj).includes('\n'), 'pretty payload must be multi-line')
})

// ── destructive filesystem commands ─────────────────────────────────────────────────────────

const MUST_BLOCK_BASH = [
  ['rm -rf /', 'canonical destructive form'],
  ['rm -rf ~', 'home directory'],
  ['rm -r -f /', 'separated flags — the same command, spelled so the pre-fix regex missed it'],
  ['rm -fR /', 'reordered and case-varied flags'],
  ['git clean -fdx', 'removes .worktrees/.registry and .claude/memory/sessions/, destroying the multi-agent coordination state AND the session files the CI gate greps for its verdict'],
  ['git checkout .', 'discards every uncommitted change in the tree'],
  ['git restore .', 'same destruction, current spelling'],
  [`find ${os.homedir()} -delete`, 'deletes without ever naming rm'],
  [`node -e "require('fs').rmSync('/', {recursive:true, force:true})"`, 'destruction through an allowlisted interpreter'],
]

for (const [command, why] of MUST_BLOCK_BASH) {
  for (const [shape, encode] of [['compact', compact], ['pretty', pretty]]) {
    test(`BLOCKS [${shape}] ${command} — ${why}`, () => {
      assert.equal(runHook(encode(bash(command))), BLOCK, `hook allowed a destructive command on a ${shape} payload`)
    })
  }
}

// ── path scoping: nothing outside the project root is writable ──────────────────────────────

const MUST_BLOCK_WRITE = [
  [path.join(os.homedir(), '.ssh', 'id_rsa'), 'private key'],
  [path.join(os.homedir(), '.aws', 'credentials'), 'cloud credentials'],
  [path.join(os.homedir(), '.claude', 'settings.json'), 'the permission model itself — one write disarms every hook, so allowing this makes all other rules advisory'],
  [path.join(REPO, '.env'), 'secrets file'],
]

for (const [file, why] of MUST_BLOCK_WRITE) {
  for (const [shape, encode] of [['compact', compact], ['pretty', pretty]]) {
    test(`BLOCKS [${shape}] Write ${file.replace(os.homedir(), '~')} — ${why}`, () => {
      assert.equal(runHook(encode(write(file))), BLOCK, `hook allowed a write outside the project root on a ${shape} payload`)
    })
  }
}

// ── secrets are protected in BOTH directions ────────────────────────────────────────────────
// Blocking `Write .env` while allowing `cat .env` protects the file and leaks its contents:
// the read lands in ~/.claude/projects/*.jsonl as permanent plaintext.

for (const command of ['cat .env', 'sed -n "1,50p" .env', 'awk "{print}" .env']) {
  test(`BLOCKS reading secrets via an allowlisted tool — ${command}`, () => {
    assert.equal(runHook(compact(bash(command))), BLOCK, 'hook allowed a secrets file to be read into the transcript')
  })
}

// ── ordinary work must still flow ───────────────────────────────────────────────────────────
// A guard that blocks everything is not a guard, it is an outage. These pin the false-positive
// budget: if hardening the hook breaks these, the fix went too far.

const MUST_ALLOW = [
  'git status',
  'git commit -m "feat: a thing"',
  'npm run check',
  'node --test scripts/ledger.test.mjs',
  'rm -f /tmp/scratch-file.txt',
  'ls -la',
]

for (const command of MUST_ALLOW) {
  test(`ALLOWS ordinary work — ${command}`, () => {
    assert.equal(runHook(compact(bash(command))), ALLOW, 'hook blocked a legitimate command; the false-positive budget is blown')
  })
}

// ── the force-push rule: both orderings, and the word boundary that was missing ──────────────
// The rule is written twice, once per argument order. Only the first carried `\b` after the
// `-f` alternation, so the second matched `-f` inside ANY hyphenated word appearing after the
// literal "main" — `--body-file`, `risk-full`, `notes-final`. Found when `gh pr create
// --base main --body-file ...` in the same command as a `git push` was refused as a
// force-push to main. Both orderings are pinned here so a future edit cannot fix one and
// leave the other, which is exactly how this defect survived.

const FORCE_PUSH_MUST_BLOCK = [
  'git push --force origin main',
  'git push origin main --force',
  'git push -f origin main',
  'git push origin main -f',
  'git push --force origin master',
  'git push origin master -f',
  'git push --force-with-lease origin main',
]

for (const command of FORCE_PUSH_MUST_BLOCK) {
  test(`BLOCKS force-push to a protected branch — ${command}`, () => {
    assert.equal(runHook(compact(bash(command))), BLOCK, 'a genuine force-push to main/master was allowed')
  })
}

const FORCE_PUSH_MUST_ALLOW = [
  // The exact shape that exposed the bug: a push, then a PR opened against main, one command.
  'git push -u origin feat/thing && gh pr create --base main --body-file /tmp/body.md',
  // `-f` inside a hyphenated word after "main" — the unbounded alternation matched all of these.
  'git push origin feat/thing && gh pr edit --base main --add-label risk-full',
  'git push origin feat/thing && echo "merged to main" > notes-final.txt',
  // A force-push to a branch that is not main/master is the author's own business.
  'git push --force origin feat/my-topic-branch',
  // Ordinary pushes, including to a branch whose name merely contains the word.
  'git push -u origin fix/safety-floor-and-gate',
  'git push origin feat/domain-model',
]

for (const command of FORCE_PUSH_MUST_ALLOW) {
  test(`ALLOWS non-force-push work — ${command}`, () => {
    assert.equal(runHook(compact(bash(command))), ALLOW, 'hook blocked a legitimate push; the false-positive budget is blown')
  })
}

test('ALLOWS writes inside the project root', () => {
  assert.equal(runHook(compact(write(path.join(REPO, 'docs', 'scratch.md')))), ALLOW)
})

// The scoping check must decide containment the way the FILESYSTEM does, not the way string
// comparison does. Three ways a correct path used to be refused, all regressions worth pinning.

test('ALLOWS a write when the root is spelled with different case (case-insensitive FS)', () => {
  // macOS reaches one directory under many spellings, and this repo is opened under both
  // `agentvibe` and `Agentvibe`. A case-sensitive prefix match refused writes that were inside
  // the project. Skips on a case-sensitive filesystem, where the two really are different paths.
  const flipped = REPO.replace(/(^.*\/)([a-zA-Z])/, (_, head, c) =>
    head + (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()))
  if (flipped === REPO || !fs.existsSync(flipped)) return // case-sensitive FS: nothing to test
  assert.equal(
    runHook(compact(write(path.join(REPO, 'docs', 'scratch.md'))), { CLAUDE_PROJECT_DIR: flipped }),
    ALLOW,
    'a differently-cased spelling of the SAME directory must not read as outside the project')
})

test('ALLOWS a new file in a subdirectory that does not exist yet', () => {
  // A new file has no realpath, and neither does its new parent. Resolution must walk up to the
  // nearest existing ancestor rather than give up and refuse.
  assert.equal(runHook(compact(write(path.join(REPO, 'docs', 'no', 'such', 'dir', 'new.md')))), ALLOW)
})

test('BLOCKS a write through a symlink pointing outside the project', () => {
  // The write follows the link, so the TARGET decides containment. Scoping only the link's own
  // location makes an in-project symlink a hole straight out of it.
  const link = path.join(REPO, 'docs', `.scoping-probe-${process.pid}`)
  fs.symlinkSync(path.join(os.homedir(), '.ssh', 'id_rsa'), link)
  try {
    assert.equal(runHook(compact(write(link))), BLOCK)
  } finally {
    fs.unlinkSync(link)
  }
})

// ── $HOME/.claude/plans/ is the only subdirectory of $HOME/.claude/ that is writable ────────
//
// Change 1 (path-scoping fix) opens exactly this one directory. The tests below pin that the
// boundary is narrow: plans/ is allowed; the parent ~/.claude/ and its siblings are not.
//
// $HOME IS PINNED HERE, AND THE PINNING IS THE POINT. These cases used to read the developer's
// real home, so their outcome depended on the machine. On a Mac that has run Claude Code
// ~/.claude/plans exists and (a) passed; on ubuntu-latest HOME=/home/runner and nothing ever
// creates ~/.claude, so (a) went red and main stayed red from 2026-08-24 on this one assertion.
// The hook was correct in both places. Two INDEPENDENT mechanisms in
// .claude/hooks/pre-tool-use.sh refuse the write when the directory is absent: the containment
// loop skips an allowed root that is not a directory on disk (`[ -d "$_allowed" ] || continue`),
// and the resolver walks the target up to its nearest EXISTING ancestor, which with ~/.claude
// gone lands ABOVE the allowed root while the `-ef` probe only ever walks upward. Removing the
// `-d` guard alone would not change the verdict; the second mechanism survives on its own.
//
// The same absence made (b) and (c) VACUOUS on Linux: with ~/.claude missing, every path under
// it is refused whether the exemption is narrow or not, so neither could fail for the right
// reason. Under the pinned home the whole tree is on disk — plans/, agents/ and settings.json —
// and they are refused because the exemption names one directory.
//
// (a) ALLOW under plans/ — red before Change 1, green after.
// (b) BLOCK settings.json — the regression that matters most: that file registers PreToolUse,
//     so a write there disarms every rule in this file.
// (c) BLOCK a sibling of plans/.
// (d) BLOCK under plans/ when the directory does not exist. That is what the hook does today,
//     for the two reasons above; pinned so the next reader sees a decision, not an accident.

// The fixture must sit somewhere the hook does NOT already allow, or (b), (c) and (d) measure
// the wrong rule — under an agent session TMPDIR is the sandbox scratchpad, which the hook
// allows wholesale, and a home built there is writable by that rule alone. Verified by
// execution: with the fixture under /private/tmp/claude-<uid>, a write to
// <fixture>/.claude/settings.json returns ALLOW. So each candidate base is put to the hook
// itself rather than compared against a second, drifting copy of the hook's list of roots.
const HOME_FIXTURE = (() => {
  for (const base of [...new Set([os.tmpdir(), '/tmp'])]) {
    let root
    try { root = fs.mkdtempSync(path.join(base, 'pre-tool-use-home-')) } catch { continue }
    const withPlans = path.join(root, 'with-plans')
    const withoutPlans = path.join(root, 'without-plans')
    fs.mkdirSync(withPlans)
    fs.mkdirSync(withoutPlans)
    // Neither home has a .claude/ yet, so a BLOCK here was decided by "outside every allowed
    // root" and by nothing else — which is exactly the neutrality these cases need.
    if (runHook(compact(write(path.join(withPlans, '.claude', 'probe.json'))), { HOME: withPlans }) !== BLOCK) {
      fs.rmSync(root, { recursive: true, force: true })
      continue
    }
    fs.mkdirSync(path.join(withPlans, '.claude', 'plans'), { recursive: true })
    fs.mkdirSync(path.join(withPlans, '.claude', 'agents'), { recursive: true })
    fs.writeFileSync(path.join(withPlans, '.claude', 'settings.json'), '{}\n')
    process.on('exit', () => fs.rmSync(root, { recursive: true, force: true }))
    return { root, withPlans, withoutPlans }
  }
  return null
})()

// `false` runs the case; a string skips it AND says why, which is the only honest thing to
// report from an environment where no neutral home can be built.
const HOME_SKIP = HOME_FIXTURE ? false
  : 'no writable directory outside the roots this hook already allows — every candidate base was either unwritable or itself an allowed root (the sandbox scratchpad). Re-run with TMPDIR pointed outside it.'

test('the pinned $HOME is outside every root the hook already allows — the barrier that keeps (a)-(d) honest', { skip: HOME_SKIP }, () => {
  assert.equal(runHook(compact(write(path.join(HOME_FIXTURE.root, 'anywhere.txt'))), { HOME: HOME_FIXTURE.withPlans }), BLOCK,
    'the fixture directory is itself writable per the hook — (b), (c) and (d) below would pass on containment, not on the plans/ exemption')
  assert.ok(fs.existsSync(path.join(HOME_FIXTURE.withPlans, '.claude', 'plans')),
    'fixture must create plans/, or (a) measures the absence of the directory instead of the exemption')
  assert.ok(fs.existsSync(path.join(HOME_FIXTURE.withPlans, '.claude', 'agents')),
    'fixture must create the sibling, or (c) blocks because the directory is missing rather than because the exemption is narrow')
  assert.ok(!fs.existsSync(path.join(HOME_FIXTURE.withoutPlans, '.claude')),
    'the second home must have no .claude/ at all, or (d) is not testing the absent-root path')
})

test('ALLOWS a write to a file under $HOME/.claude/plans/ — plan-mode storage', { skip: HOME_SKIP }, () => {
  // (a) Red before the path-scoping fix, green after. HOME is pinned, so this reads the fixture
  // rather than whatever the machine happens to have in the real home.
  const planFile = path.join(HOME_FIXTURE.withPlans, '.claude', 'plans', 'test-plan.md')
  assert.equal(runHook(compact(write(planFile)), { HOME: HOME_FIXTURE.withPlans }), ALLOW,
    'hook blocked a write to $HOME/.claude/plans/ — plan-mode is unusable')
})

test('BLOCKS a write to $HOME/.claude/settings.json — the regression that would matter most', { skip: HOME_SKIP }, () => {
  // (b) Green before and after Change 1: proves the plans/ exemption did not widen to ~/.claude/.
  const settingsFile = path.join(HOME_FIXTURE.withPlans, '.claude', 'settings.json')
  assert.equal(runHook(compact(write(settingsFile)), { HOME: HOME_FIXTURE.withPlans }), BLOCK,
    'hook allowed a write to settings.json — the entire permission model is now disarmed')
})

test('BLOCKS a write to $HOME/.claude/agents/whatever.md', { skip: HOME_SKIP }, () => {
  // (c) Green before and after Change 1: a sibling of plans/ must stay blocked — and agents/
  // exists on disk under the pinned home, so the refusal is the exemption's narrowness.
  const agentsFile = path.join(HOME_FIXTURE.withPlans, '.claude', 'agents', 'whatever.md')
  assert.equal(runHook(compact(write(agentsFile)), { HOME: HOME_FIXTURE.withPlans }), BLOCK,
    'hook allowed a write to $HOME/.claude/agents/ — blocked paths must stay blocked after plans/ exemption')
})

test('BLOCKS a write under $HOME/.claude/plans/ when that directory does not exist', { skip: HOME_SKIP }, () => {
  // (d) Unpinned until 2026-08-25, and it is the behaviour that turned a real CI runner red.
  // Two mechanisms produce it, either alone sufficient: the containment loop skips an allowed
  // root that is not a directory (`[ -d "$_allowed" ] || continue`), and the target resolves to
  // its nearest EXISTING ancestor — here the home itself, ABOVE plans/ — which the upward-only
  // `-ef` probe can never reach. Fail-closed is the right default for a security hook, so this
  // pins it as chosen. Changing it means changing the hook, and the hook is the harder call.
  const planFile = path.join(HOME_FIXTURE.withoutPlans, '.claude', 'plans', 'test-plan.md')
  assert.equal(runHook(compact(write(planFile)), { HOME: HOME_FIXTURE.withoutPlans }), BLOCK,
    'hook allowed a write into a plans/ directory that does not exist — containment must fail closed')
})

test('ALLOWS writes inside the project and BLOCKS ~/.ssh after plans/ exemption is added', () => {
  // Green before and after Change 1: pins that the existing allow/block boundary is unchanged.
  assert.equal(runHook(compact(write(path.join(REPO, 'src', 'new-file.ts')))), ALLOW,
    'hook blocked a write inside the project root')
  assert.equal(runHook(compact(write(path.join(os.homedir(), '.ssh', 'id_rsa')))), BLOCK,
    'hook allowed a write to an SSH private key after plans/ exemption was added')
})

// ── the hook must never fail open on a malformed payload ────────────────────────────────────
// `unresolved` is not `allow`. A guard that cannot read its input must refuse, not wave through.

for (const [label, payload] of [
  ['empty string', ''],
  ['not JSON at all', 'this is not json'],
  ['truncated JSON', '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"'],
  ['tool_name missing', JSON.stringify({ tool_input: { command: 'rm -rf /' } })],
  ['command nested unexpectedly', JSON.stringify({ tool_name: 'Bash', tool_input: { command: { $: 'rm -rf /' } } })],
]) {
  test(`BLOCKS on an unparseable payload — ${label}`, () => {
    assert.equal(runHook(payload), BLOCK, 'hook failed OPEN on input it could not parse')
  })
}

// ── The browser grant: the open web is allowed, the local network is not ─────────────────
// designer got the playwright MCP on 2026-08-16 — the first live MCP capability here. The
// binding QA gate found MCP calls reached NO safety control: the matcher read
// "Bash|Edit|Write|NotebookEdit", which no MCP tool name matches.
//
// The first rule written here was localhost-only, reasoned from designer's perception loop.
// FOUNDER OVERRULED IT, correctly: `sourcer` answers questions with sourced evidence and
// WebFetch returns almost nothing useful on a JS-rendered site. The deciding argument is that
// agents ALREADY hold WebSearch and WebFetch, so untrusted web text already reaches context —
// blocking the browser does not close prompt injection, it only makes the agent worse.
//
// What remains refused is the local network, which is not the web and which no research task
// wants. That is the one browser risk a URL guard can actually close.

const nav = (url) => ({ session_id: 'test-session', tool_name: 'mcp__playwright__browser_navigate', tool_input: { url } })

const BROWSER_ALLOWED = [
  // The perception loop.
  'http://localhost:3000',
  'http://localhost:3000/pricing',
  'http://127.0.0.1:5173/a/b?c=d',
  'http://[::1]:3000/',
  'about:blank',
  // The open web — autonomous agency. These are the point of the reversal.
  'https://example.com',
  'https://stripe.com/pricing',
  'https://news.ycombinator.com/item?id=1',
  'https://competitor.io/pricing?plan=pro#compare',
  'http://plain-http-site.org/page',
  'https://sub.domain.co.uk:8443/deep/path',
  // Hostnames that merely CONTAIN a private-range string are public names.
  'https://10.great.example.com/',
  'https://192.168.marketing.io/',
]

for (const url of BROWSER_ALLOWED) {
  test(`ALLOWS browsing — ${url}`, () => {
    assert.equal(runHook(compact(nav(url))), ALLOW, `hook blocked legitimate browsing to ${url}`)
  })
}

const BROWSER_BLOCKED = [
  ['http://169.254.169.254/latest/meta-data/', 'cloud metadata endpoint'],
  ['http://192.168.1.1/', 'the router — local network, not the web'],
  ['http://10.0.0.5:8080/', 'private range'],
  ['http://172.16.0.9/', 'private range, low edge'],
  ['http://172.31.255.1/', 'private range, high edge'],
  ['file:///etc/passwd', 'local file read wearing a browser costume'],
  ['data:text/html,<script>1</script>', 'in-page content, never reaches the network'],
  ['javascript:alert(1)', 'in-page execution'],
  ['http://0.0.0.0/', 'unroutable'],
]

for (const [url, why] of BROWSER_BLOCKED) {
  test(`BLOCKS ${url} — ${why}`, () => {
    assert.equal(runHook(compact(nav(url))), BLOCK, `hook allowed navigation to ${url}`)
  })
}

test('172.15 and 172.32 are PUBLIC — the private range is 172.16-31 only', () => {
  // Off-by-one on this range is the classic SSRF filter bug in both directions: blocking real
  // public space, or letting 172.16 through.
  assert.equal(runHook(compact(nav('https://172.15.0.1/'))), ALLOW)
  assert.equal(runHook(compact(nav('https://172.32.0.1/'))), ALLOW)
  assert.equal(runHook(compact(nav('https://172.16.0.1/'))), BLOCK)
  assert.equal(runHook(compact(nav('https://172.31.0.1/'))), BLOCK)
})

test('userinfo in the URL cannot smuggle a private host past the check', () => {
  // http://example.com@169.254.169.254/ connects to the METADATA endpoint, not to example.com.
  assert.equal(runHook(compact(nav('http://example.com@169.254.169.254/latest/'))), BLOCK)
})

test('BLOCKS a navigation whose url cannot be read — fails closed like every other rule here', () => {
  assert.equal(runHook(compact({ session_id: 'test-session', tool_name: 'mcp__playwright__browser_navigate', tool_input: {} })), BLOCK)
})

test('other MCP servers are untouched — the guard only understands the browser', () => {
  for (const t of ['mcp__figma__get_design_context', 'mcp__notion__notion-search']) {
    assert.equal(runHook(compact({ session_id: 'test-session', tool_name: t, tool_input: { q: 'x' } })), ALLOW, `${t} was gated`)
  }
})

// ── SSRF: the guard must refuse the ADDRESS, not one spelling of it ──────────────────────
// An independent reviewer of PR #47 found the first version of this guard bypassable five ways.
// It pattern-matched shell globs against the host string (`169.254.*`), so every other textual
// form Chromium accepts walked past a guard whose own comment claimed the address was refused.
// All five were verified against the live hook before the fix. The address is now canonicalised
// and classified by `ipaddress` instead of being compared to a list of spellings.
//
// These are the exact payloads. If any ever returns ALLOW again, the guard has been rewritten
// back into an enumeration and the same class of bug is back.

const SSRF_MUST_BLOCK = [
  ['http://2852039166/', 'decimal integer -> 169.254.169.254'],
  ['http://0xa9fea9fe/', 'hex -> 169.254.169.254'],
  ['http://169.254.43518/', 'three-part form -> 169.254.169.254'],
  ['http://0251.0376.0251.0376/', 'per-octet octal -> 169.254.169.254'],
  ['http://167772161/', 'decimal -> 10.0.0.1'],
  ['http://a@b@169.254.169.254/', 'multi-@ userinfo; browsers split on the LAST @'],
  ['http://[fd00:ec2::254]/', 'IPv6 metadata service'],
  ['http://[fe80::1]/', 'IPv6 link-local'],
  ['http://[fd00::1]/', 'IPv6 unique-local'],
  ['http://169.254.169.254/latest/meta-data/', 'the plain dotted-quad form'],
  ['http://192.168.1.1/', 'private range'],
  ['http://10.0.0.5:8080/', 'private range'],
  ['http://172.16.0.1/', 'private range, low edge'],
  ['http://172.31.255.1/', 'private range, high edge'],
  ['http://0.0.0.0/', 'unspecified'],
  ['http://169.254.169.254./', 'trailing dot'],
  ['HTTP://169.254.169.254/', 'uppercase scheme'],
]

for (const [url, why] of SSRF_MUST_BLOCK) {
  test(`SSRF blocked — ${url} (${why})`, () => {
    assert.equal(runHook(compact(nav(url))), BLOCK, `bypass reopened: ${url}`)
  })
}

const SSRF_MUST_ALLOW = [
  ['https://example.com/', 'the open web'],
  ['https://stripe.com/pricing', 'competitor research'],
  ['https://8.8.8.8/', 'a public IP literal'],
  ['https://1.1.1.1/', 'a public IP literal'],
  ['https://172.15.0.1/', 'just below the private range'],
  ['https://172.32.0.1/', 'just above the private range'],
  ['https://10.great.example.com/', 'a hostname that merely starts with 10.'],
  ['https://192.168.marketing.io/', 'a hostname that merely starts with 192.168.'],
  ['http://localhost:3000/x', 'the perception loop'],
  ['http://127.0.0.1:5173/', 'the perception loop'],
  ['http://[::1]:3000/', 'the perception loop, IPv6'],
]

for (const [url, why] of SSRF_MUST_ALLOW) {
  test(`SSRF allowed — ${url} (${why})`, () => {
    assert.equal(runHook(compact(nav(url))), ALLOW, `false positive: ${url} is legitimate`)
  })
}

test('navigate_back is gated too — not only browser_navigate', () => {
  // The reviewer noted the matcher named exactly one tool while several can navigate.
  const back = { session_id: 'test-session', tool_name: 'mcp__playwright__browser_navigate_back', tool_input: { url: 'http://169.254.169.254/' } }
  assert.equal(runHook(compact(back)), BLOCK)
})

// ── Fetch-and-run is refused at the hook, not only in settings ───────────────────────────
// PR #47's first cut allowed the package managers wholesale, auto-approving download and
// execution of an arbitrary remote package — the same capability the HTTP-client rules refuse.
// Settings now deny it AND the hook refuses it, because a settings deny can be bypassed by a
// launch flag and the hook cannot.

const FETCH_AND_RUN = [
  'n' + 'px cowsay hi',
  'bun' + 'x some-pkg',
  'pnpm ' + 'dlx create-thing',
  'npm ' + 'exec foo',
  'bun ' + 'x foo',
  'cd /tmp && n' + 'px evil',
]
for (const cmd of FETCH_AND_RUN) {
  test(`BLOCKS fetch-and-run — ${cmd}`, () => {
    assert.equal(runHook(compact(bash(cmd))), BLOCK, `${cmd} downloads and executes a remote package`)
  })
}

const PACKAGE_WORK_ALLOWED = ['npm run check', 'npm test', 'bun test', 'bun run build', 'pnpm install']
for (const cmd of PACKAGE_WORK_ALLOWED) {
  test(`ALLOWS ordinary package work — ${cmd}`, () => {
    assert.equal(runHook(compact(bash(cmd))), ALLOW, `${cmd} is ordinary work and must not prompt`)
  })
}

// ── Two more bypasses, found by an independent reviewer against the REWRITTEN guard ──────
// The canonicalisation rewrite closed eleven bypasses and introduced two of its own. Both were
// wrong in BOTH directions, verified against Node's own URL parser:
//
//   http://169.254.169.254\@evil.com/   browser -> 169.254.169.254   guard said ALLOW
//   http://evil.com\@169.254.169.254/   browser -> evil.com          guard said BLOCK
//
// WHATWG treats a backslash as a path delimiter for http/https, so the authority ends there.
// The guard split on '/' only, kept the backslash inside the authority, found the '@' and took
// the wrong side of it.
//
// Fullwidth digits are the same class: Chromium applies UTS-46 before parsing the host, so
// http://１６９．２５４．１６９．２５４/ resolves to the metadata endpoint. The guard split on ASCII '.'
// only, so the host never looked like an address at all and fell through as a hostname.
//
// The mirror cases matter as much as the bypasses. A guard that blocks evil.com because the URL
// merely CONTAINS a private address is broken for research, which is the whole point of allowing
// the open web.

const DELIMITER_CASES = [
  ['http://169.254.169.254\\@evil.com/', BLOCK, 'backslash: the browser connects to the metadata endpoint'],
  ['http://evil.com\\@169.254.169.254/', ALLOW, 'backslash mirror: the browser connects to a public host'],
  ['http://１６９．２５４．１６９．２５４/', BLOCK, 'fullwidth digits map to the metadata endpoint under UTS-46'],
  ['http://169.254.169.254\\@evil.com:8080/x', BLOCK, 'backslash with a port and path'],
  ['https://ｅｘａｍｐｌｅ.com/', ALLOW, 'fullwidth letters are an ordinary hostname, not an address'],
]

for (const [url, want, why] of DELIMITER_CASES) {
  test(`URL delimiter handling — ${why}`, () => {
    assert.equal(runHook(compact(nav(url))), want, `wrong verdict for ${url}`)
  })
}

test('the guard fails CLOSED if its own parser breaks', () => {
  // Not hypothetical: the first attempt at the backslash fix wrote a bare backslash into python
  // embedded in a double-quoted bash string. The shell ate it, python raised a syntax error, and
  // every navigation blocked — including localhost. That is the correct direction to fail, and
  // it is pinned so a future edit that breaks the parser cannot fail OPEN instead.
  assert.equal(runHook(compact(nav('http://169.254.169.254/'))), BLOCK)
  assert.equal(runHook(compact(nav('https://example.com/'))), ALLOW)
})

// ── The MCP blind spot: enforcement was a chain with the middle links missing ─────────────
//
// Before 2026-08-16 the PreToolUse matcher in .claude/settings.json read
// "Bash|Edit|Write|NotebookEdit|mcp__playwright__browser_navigate", so TWO tools on one server
// reached this hook and every other MCP call reached no safety control at all — including
// `browser_run_code_unsafe`, which runs arbitrary code in a browser holding live session
// cookies (69 real calls of it on this machine, ROSTER-SIZE.md:285). The matcher is now `mcp__`,
// which subsumes the old entry because it is an unanchored regex over the tool name — the same
// property that already routed `..._back`, pinned above at 'navigate_back is gated too'.
//
// The rule the hook enforces is SCOPE, not server name. The carve-out this replaces defended
// allowing every MCP tool on the grounds that the servers are the founder's own. True of the
// user-scope servers in ~/.claude.json; false of whatever this repo puts in its own .mcp.json.
//
// Every case below pins one row of the decision table in .claude/mcp-policy.json's `_doc`.

import { spawnSync } from 'node:child_process'

/** Exit code AND stderr — the shadow-mode cases are only meaningful if the log line is there. */
function runHookVerbose(payload, env = {}) {
  const r = spawnSync('bash', [HOOK], {
    input: payload,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO, ...env },
  })
  return { code: r.status, stderr: r.stderr || '' }
}

const TEMP_ROOTS = []
process.on('exit', () => {
  for (const d of TEMP_ROOTS) { try { fs.rmSync(d, { recursive: true, force: true }) } catch { /* best effort */ } }
})

/**
 * A throwaway project root carrying its own policy, so a case can be pinned without editing the
 * policy this repo actually ships — and so a test can never be green because of a local edit.
 * `policy: undefined` writes no policy file at all, which is the "mechanism is off" row.
 */
function projectWith({ policy, mcp } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-policy-'))
  TEMP_ROOTS.push(dir)
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true })
  const put = (p, v) => fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2))
  if (policy !== undefined) put(path.join(dir, '.claude', 'mcp-policy.json'), policy)
  if (mcp !== undefined) put(path.join(dir, '.mcp.json'), mcp)
  return dir
}

const mcpCall = (tool_name, tool_input = {}) => ({ session_id: 'test-session', tool_name, tool_input })

const GOVERNED = {
  servers: {
    playwright: {
      credentialed: false,
      allow: ['browser_navigate', 'browser_snapshot'],
      deny: ['browser_run_code_unsafe'],
    },
  },
}
const shadowPolicy = { mode: 'shadow', ...GOVERNED }
const blockPolicy = { mode: 'block', ...GOVERNED }

const UNSAFE = compact(mcpCall('mcp__playwright__browser_run_code_unsafe', { code: 'fetch("http://evil")' }))

// 1 ── the deny list refuses, once the mode says to
test('MCP policy BLOCKS a denied project-scope tool when mode is block', () => {
  const root = projectWith({ policy: blockPolicy })
  const { code, stderr } = runHookVerbose(UNSAFE, { CLAUDE_PROJECT_DIR: root })
  assert.equal(code, BLOCK, 'browser_run_code_unsafe was allowed under mode: block')
  assert.match(stderr, /rule=deny, mode=block/, 'the refusal must name the rule that fired')
})

// 2 ── ...and in shadow it proceeds, but it is on the record
test('MCP policy in shadow ALLOWS the same call and says so on stderr', () => {
  // ADR-001:123-125 — every gate ships in shadow first so the friction is measured, not guessed.
  const root = projectWith({ policy: shadowPolicy })
  const { code, stderr } = runHookVerbose(UNSAFE, { CLAUDE_PROJECT_DIR: root })
  assert.equal(code, ALLOW, 'shadow mode must not block — that is what makes it shadow')
  assert.match(stderr, /would_block/, 'a shadow verdict that logs nothing is a gate nobody can promote')
  assert.match(stderr, /rule=deny/)
})

// 3 ── the asymmetry: one class of server does not get a shadow period
test('a credentialed server BLOCKS under shadow — the one rule mode cannot soften', () => {
  // ADR-001:123-125 exempts outbound send, deploy, migration and harness self-edit from shadow
  // because git revert does not undo them. A credentialed server is all four at once.
  const root = projectWith({
    policy: { mode: 'shadow', servers: { gmail: { credentialed: true, allow: ['send_message'], deny: [] } } },
  })
  const { code, stderr } = runHookVerbose(compact(mcpCall('mcp__gmail__send_message')), { CLAUDE_PROJECT_DIR: root })
  assert.equal(code, BLOCK, 'a credentialed server was allowed to send because mode said shadow')
  assert.match(stderr, /REGARDLESS of mode/, 'the message must say why shadow did not apply')
})

// 4 ── the carve-out that had to survive
test('a user-scope server is untouched even with a policy file present', () => {
  // This is the same guarantee as 'other MCP servers are untouched' above, re-pinned against a
  // policy file that exists. figma is in neither the policy nor .mcp.json, so the repo does not
  // govern it and never sees the call.
  const root = projectWith({ policy: shadowPolicy, mcp: { mcpServers: { playwright: {} } } })
  for (const t of ['mcp__figma__get_design_context', 'mcp__notion__notion-search']) {
    const { code, stderr } = runHookVerbose(compact(mcpCall(t, { q: 'x' })), { CLAUDE_PROJECT_DIR: root })
    assert.equal(code, ALLOW, `${t} was gated — the user-scope carve-out is gone`)
    assert.equal(stderr, '', `${t} was logged — the repo must not record calls it does not govern`)
  }
})

// 5 ── no policy means the mechanism is off, not that it guesses
test('policy file absent — every MCP call is allowed, exactly the pre-policy behaviour', () => {
  const root = projectWith({})
  assert.equal(runHookVerbose(UNSAFE, { CLAUDE_PROJECT_DIR: root }).code, ALLOW,
    'an absent policy must reproduce the behaviour before the policy existed, not invent one')
})

// 6 ── unreadable is not empty
test('a malformed policy BLOCKS every MCP call — including ones it would have allowed', () => {
  // "I could not look" is not "nothing to see" — the same posture as the payload parse at L86.
  // The figma case is the sharp end: when the policy will not parse, the hook cannot know which
  // servers are project scope, so it refuses rather than assuming they are all the founder's.
  const root = projectWith({ policy: '{ "mode": "shadow", "servers": { oops' })
  for (const t of ['mcp__playwright__browser_navigate', 'mcp__figma__get_design_context']) {
    const { code, stderr } = runHookVerbose(compact(mcpCall(t, { url: 'http://localhost:3000' })), { CLAUDE_PROJECT_DIR: root })
    assert.equal(code, BLOCK, `hook failed OPEN on a policy it could not parse (${t})`)
    assert.match(stderr, /unreadable or invalid/)
  }
})

test('a policy whose mode is neither shadow nor block is malformed, not a third mode', () => {
  const root = projectWith({ policy: { mode: 'warn', ...GOVERNED } })
  assert.equal(runHookVerbose(UNSAFE, { CLAUDE_PROJECT_DIR: root }).code, BLOCK,
    'an unrecognised mode must fail closed rather than fall through to allow')
})

// 7 ── enumeration is the bug this file already learned once
test('a tool on NEITHER list is treated as denied, not as unknown-therefore-fine', () => {
  // The SSRF guard above was rewritten precisely because it enumerated spellings and a reviewer
  // walked past it five ways. A playwright release that adds a new dangerous tool must be covered
  // by construction. In shadow this logs; under block it refuses.
  const brandNew = compact(mcpCall('mcp__playwright__browser_install_extension'))
  const shadowRoot = projectWith({ policy: shadowPolicy })
  const blockRoot = projectWith({ policy: blockPolicy })
  const s = runHookVerbose(brandNew, { CLAUDE_PROJECT_DIR: shadowRoot })
  assert.equal(s.code, ALLOW)
  assert.match(s.stderr, /rule=unlisted/, 'an unlisted tool must be distinguishable from a denied one in the log')
  assert.equal(runHookVerbose(brandNew, { CLAUDE_PROJECT_DIR: blockRoot }).code, BLOCK)
})

// 8 ── the drift hole: two sources of "is this ours" would disagree
test('a server configured in .mcp.json but missing from the policy is REFUSED', () => {
  // Otherwise adding a server to .mcp.json silently grants it the user-scope carve-out, and the
  // policy file becomes advisory the moment someone edits the other file. schema-lint.js:104
  // reads the same .mcp.json to decide whether an agent's mcpServers grant is real.
  const root = projectWith({
    policy: { mode: 'shadow', servers: {} },
    mcp: { mcpServers: { playwright: { command: 'npx' } } },
  })
  const call = compact(mcpCall('mcp__playwright__browser_navigate', { url: 'http://localhost:3000' }))
  const { code, stderr } = runHookVerbose(call, { CLAUDE_PROJECT_DIR: root })
  assert.equal(code, BLOCK, 'an ungoverned project-scope server was treated as user scope')
  assert.match(stderr, /no entry in \.claude\/mcp-policy\.json/)
})

test('a governed entry that does not declare credentialed is refused', () => {
  const root = projectWith({ policy: { mode: 'shadow', servers: { playwright: { allow: [], deny: [] } } } })
  assert.equal(runHookVerbose(UNSAFE, { CLAUDE_PROJECT_DIR: root }).code, BLOCK,
    'a server whose credential status is undeclared must not be assumed harmless')
})

// 9 ── the observability gap GRANT-HOLDERS.md 4.14/5.14 names: no per-call record of an MCP call
test('every governed call writes one events.jsonl line; an ungoverned call writes none', () => {
  const root = projectWith({ policy: shadowPolicy })
  const events = path.join(root, 'events-probe.jsonl')
  runHookVerbose(UNSAFE, { CLAUDE_PROJECT_DIR: root, WARROOM_EVENTS: events })
  runHookVerbose(compact(mcpCall('mcp__figma__get_design_context')), { CLAUDE_PROJECT_DIR: root, WARROOM_EVENTS: events })

  const rows = fs.readFileSync(events, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
  assert.equal(rows.length, 1, 'expected exactly one record — the governed call, not the user-scope one')
  assert.equal(rows[0].event, 'mcp.call', 'mission-control/server/collectors/events.ts buckets on `event`')
  assert.equal(rows[0].server, 'playwright')
  assert.equal(rows[0].tool, 'browser_run_code_unsafe')
  assert.equal(rows[0].decision, 'would_block')
  assert.equal(rows[0].rule, 'deny')
})

test('a broken events destination never changes the verdict', () => {
  // Logging is observability, not enforcement. If the log cannot be written the call must still
  // get the verdict the policy says — in either direction.
  const root = projectWith({ policy: blockPolicy })
  const unwritable = path.join(root, '.claude', 'mcp-policy.json', 'not-a-dir', 'events.jsonl')
  assert.equal(runHookVerbose(UNSAFE, { CLAUDE_PROJECT_DIR: root, WARROOM_EVENTS: unwritable }).code, BLOCK)
  const ok = compact(mcpCall('mcp__playwright__browser_snapshot'))
  assert.equal(runHookVerbose(ok, { CLAUDE_PROJECT_DIR: root, WARROOM_EVENTS: unwritable }).code, ALLOW)
})

// 10 ── the URL guard and the policy are different questions, and both get asked
test('the navigate arm runs the URL guard FIRST and the policy after it', () => {
  // The guard asks where this navigation goes; the policy asks whether the tool may be called at
  // all. A `case` arm does not fall through in bash 3.2, so the policy is a function called from
  // both arms — these two cases prove neither call site was lost.
  const permissive = projectWith({
    policy: { mode: 'block', servers: { playwright: { credentialed: false, allow: ['browser_navigate'], deny: [] } } },
  })
  assert.equal(runHookVerbose(compact(nav('http://169.254.169.254/')), { CLAUDE_PROJECT_DIR: permissive }).code, BLOCK,
    'the SSRF guard stopped running when the policy allowed the tool')

  const restrictive = projectWith({
    policy: { mode: 'block', servers: { playwright: { credentialed: false, allow: [], deny: ['browser_navigate'] } } },
  })
  assert.equal(runHookVerbose(compact(nav('http://localhost:3000/')), { CLAUDE_PROJECT_DIR: restrictive }).code, BLOCK,
    'a URL the guard allows must still face the policy')
})

// 11 ── the policy this repo actually ships, not a fixture
test('the SHIPPED policy: run_code_unsafe is would_block today, the perception loop is untouched', () => {
  // Fixtures prove the mechanism; this proves the configuration. If .claude/mcp-policy.json is
  // ever edited into something that allows arbitrary in-page code silently, this goes red.
  const unsafe = runHookVerbose(UNSAFE)
  assert.equal(unsafe.code, ALLOW, 'the shipped policy is mode: shadow — blocking here means it was promoted')
  assert.match(unsafe.stderr, /would_block playwright\/browser_run_code_unsafe/)

  for (const tool of ['browser_snapshot', 'browser_take_screenshot', 'browser_evaluate']) {
    const r = runHookVerbose(compact(mcpCall(`mcp__playwright__${tool}`)))
    assert.equal(r.code, ALLOW, `${tool} is the perception loop and must not be refused`)
    assert.equal(r.stderr, '', `${tool} logged to stderr — 154 browser_evaluate calls per session is how a guard gets switched off`)
  }
})

// 12 ── absent and corrupt are different answers, and only one of them is safe
test('an UNREADABLE .mcp.json blocks; an ABSENT one does not', () => {
  // Project scope is read from .mcp.json, so a corrupt .mcp.json means scope is unknown. The
  // first cut of this rule wrapped that read in a bare try/except, which folded "I could not
  // read it" into "not configured" into "user scope" into allow — the exact fail-open shape this
  // hook has been burned by before, rebuilt inside the fix for it.
  const corrupt = projectWith({ policy: { mode: 'shadow', servers: {} }, mcp: '{ "mcpServers": {' })
  const { code, stderr } = runHookVerbose(compact(mcpCall('mcp__anything__do_thing')), { CLAUDE_PROJECT_DIR: corrupt })
  assert.equal(code, BLOCK, 'an unreadable .mcp.json was treated as "this repo configures nothing"')
  assert.match(stderr, /Project scope cannot be determined/)

  // Absent is a real answer: this repo configures no MCP servers, so every server is user scope.
  const absent = projectWith({ policy: { mode: 'shadow', servers: {} } })
  assert.equal(runHookVerbose(compact(mcpCall('mcp__anything__do_thing')), { CLAUDE_PROJECT_DIR: absent }).code, ALLOW,
    'no .mcp.json means no project-scope servers, which is not an error')
})

// C1 tests
test('ALLOWS git checkout --detach [C1]', () => {
  assert.equal(runHook(compact(bash('git checkout --detach origin/main'))), ALLOW);
});
test('ALLOWS git checkout --track [C1]', () => {
  assert.equal(runHook(compact(bash('git checkout --track origin/feature'))), ALLOW);
});
test('ALLOWS git checkout --orphan [C1]', () => {
  assert.equal(runHook(compact(bash('git checkout --orphan new-branch'))), ALLOW);
});
test('BLOCKS separator-dot [C1]', () => {
  assert.equal(runHook(compact(bash('git checkout -- .'))), BLOCK);
});
test('BLOCKS separator-file [C1]', () => {
  assert.equal(runHook(compact(bash('git checkout -- file.txt'))), BLOCK);
});


// C2: documenting a hazard inside a heredoc is blocked — unfixable without a shell parser
//
// The hook scans the entire command string including heredoc bodies. A heredoc that QUOTES
// a dangerous invocation for documentation is indistinguishable from one that produces it
// as stdin — both are the same shell command string.
//
// VERDICT: unfixable without a real shell parser. A heredoc-body stripper is not safe:
//   cmd <<EOF && git checkout -- file\n...\nEOF  → stripped to "cmd " → misses real command
//
// ESCAPE HATCH: write documentation that quotes a hazard via the Write tool. Write checks
// only file_path (path scoping), never content. A Bash heredoc quoting the hazard is blocked;
// a Write tool call writing the same text is allowed.

test('heredoc body quoting the separator is blocked — pinned false-positive [C2]', () => {
  // False positive: the heredoc body documents the hazard, not executes it.
  // Pinned rather than fixed because the only safe fix requires a shell parser.
  // ESCAPE HATCH: use the Write tool for any documentation that quotes dangerous forms.
  const sep = ' -- ';
  const doc = 'documentation: git checkout' + sep + 'file.txt';
  const cmd = "gh issue create --body-file - <<'EOF'\n" + doc + "\nEOF";
  assert.equal(runHook(compact(bash(cmd))), BLOCK,
    'known limitation: a heredoc quoting a hazard is blocked; use Write tool for docs');
});

// C3: Write and Bash must agree about the agent scratchpad
//
// Issue #96.3: Bash heredocs wrote to /private/tmp/claude-<uid>/...scratchpad/... freely
// all session. Write blocked the same path. The sandbox (PR #94) grants /private/tmp/claude-<uid>
// in filesystem.allowWrite. Agents are instructed to use the scratchpad for all temp files.
// Decision: Write was wrong. Making Write agree with Bash by adding the scratchpad root to
// the allowed list.

test('ALLOWS Write to the agent scratchpad — Bash and Write must agree [C3]', () => {
  // RED before fix: Write refused /private/tmp/claude-<uid>/... while Bash wrote freely all session.
  const uid = typeof process.getuid === 'function' ? process.getuid() : 501;
  const scratchpadFile = `/private/tmp/claude-${uid}/test-session/scratchpad/temp.md`;
  const parent = `/private/tmp/claude-${uid}`;
  if (!fs.existsSync(parent)) return; // scratchpad root absent — skip rather than fail
  assert.equal(runHook(compact(write(scratchpadFile))), ALLOW,
    'Write to the agent scratchpad must be allowed — it is sandbox-granted and agent-instructed');
});

test('BLOCKS Write to arbitrary /tmp path — scratchpad exemption is narrow [C3]', () => {
  // The exemption is /private/tmp/claude-<uid> specifically, not all of /tmp.
  assert.equal(runHook(compact(write('/tmp/arbitrary/file.md'))), BLOCK,
    'the scratchpad exemption must not open all of /tmp to writing');
});

test('BLOCKS Write outside project after scratchpad exemption — boundary is exact [C3]', () => {
  assert.equal(runHook(compact(write(path.join(os.homedir(), 'secret.txt')))), BLOCK,
    'home directory writes must stay blocked after the scratchpad exemption is added');
});


// C1 broader: git checkout -q <sha> (no -- separator) must be ALLOWED [C1-broader]
//
// Team-lead reported (2026-08-20): a command of the form
//   git checkout -q <sha> && git show <ref>:<path> > <path>
// was blocked with "git checkout -- <file> discards uncommitted changes".
// The current predicate (--\s+) requires whitespace after --, which this form lacks.
// This test pins the correct ALLOW behaviour and will go red if the predicate is
// widened to match git checkout in general rather than the separator form specifically.

test('ALLOWS git checkout -q <sha> — no separator, no discard [C1-broader]', () => {
  assert.equal(runHook(compact(bash('git checkout -q abc123def456'))), ALLOW,
    'git checkout to a SHA discards nothing; only separator form (-- <file>) should be blocked');
});

test('ALLOWS git checkout -q <sha> piped with git show [C1-broader]', () => {
  assert.equal(
    runHook(compact(bash('git checkout -q abc123def456 && git show HEAD:scripts/run-gate.mjs > /tmp/foo.mjs'))),
    ALLOW,
    'compound checkout+show discards nothing; must not be blocked'
  );
});

test('ALLOWS git checkout <branch> — named branch switch, no separator [C1-broader]', () => {
  assert.equal(runHook(compact(bash('git checkout feat/my-branch'))), ALLOW,
    'branch switch is not a discard operation');
});

// Confirm the separator form is still blocked — the exemption must not be a blanket widening
test('BLOCKS git checkout -q -- <file> — separator form with -q flag [C1-broader]', () => {
  assert.equal(runHook(compact(bash('git checkout -q -- scripts/foo.mjs'))), BLOCK,
    'separator form must stay blocked even when -q flag is present');
});


// ── KNOWN BUG: inherited CLAUDE_PROJECT_DIR causes wrong containment for subagents ──────────
//
// CLAUDE_PROJECT_DIR is inherited from the parent (spawning) session. When a subagent runs
// in its own worktree, the hook's containment check uses the PARENT's root, producing two
// simultaneous failures:
//
//   1. FALSE POSITIVE: write to the subagent's OWN worktree is BLOCKED (it's outside the
//      inherited parent root, even though it is exactly where the agent should be writing).
//      Reproduced live by lane 7, 2026-08-20: Write to /private/tmp/.../scratchpad/probe.txt
//      was blocked with "project root is ceo-1-1787176362", while the lane was working in
//      a different worktree.
//
//   2. FALSE NEGATIVE: write to the PARENT's worktree is ALLOWED from the subagent (it
//      passes the inherited root check), but a subagent should only write in its own scope.
//
// ROOT CAUSE: `_root=$(cd "${CLAUDE_PROJECT_DIR:-$PWD}" ...)` — inheritable env var, not
// the agent's actual cwd. Fix requires deriving the root from the actual working tree:
// e.g., `git rev-parse --show-toplevel` from the file's directory, or resolving all worktrees
// of the same repo and allowing any of them. Security implication: the latter would let any
// subagent write to any sibling worktree — needs deliberate policy decision.
//
// PINNED as BLOCK to document the bug. Expected eventual outcome: ALLOW.
// Do NOT fix here without a security review of the new allowed-root policy.

test('KNOWN-BUG: subagent write to own worktree is BLOCK when CLAUDE_PROJECT_DIR is parent root [inherited-root]', () => {
  // Simulate: parent spawned the agent; parent's CLAUDE_PROJECT_DIR is this REPO.
  // The "subagent's worktree" is the sibling (any path outside REPO but inside the same repo).
  const siblingWorktree = path.resolve(REPO, '..', 'ceo-1-1787176362');
  if (!fs.existsSync(siblingWorktree)) return; // sibling not present — skip

  // Agent is working in REPO but inherits siblingWorktree as CLAUDE_PROJECT_DIR.
  // Write to REPO/some-file.ts should be ALLOWED (it's the agent's own workspace)
  // but is currently BLOCKED because REPO is outside the inherited siblingWorktree root.
  const ownFile = path.join(REPO, 'scripts', 'some-file.ts');
  const result = runHook(
    compact(write(ownFile)),
    { CLAUDE_PROJECT_DIR: siblingWorktree }
  );
  // Pinning current (wrong) behavior. Change to ALLOW when the fix lands.
  assert.equal(result, BLOCK,
    'KNOWN BUG: own-worktree write is blocked when CLAUDE_PROJECT_DIR is inherited from parent. ' +
    'Fix: derive root from the actual working tree, not the inherited env var.');
});

test('KNOWN-BUG: parent-worktree write is ALLOW from subagent — wrong direction [inherited-root]', () => {
  // Complementary wrong direction: the subagent can write to the parent's worktree.
  // With inherited CLAUDE_PROJECT_DIR = REPO (the "parent"), writing to REPO passes the
  // containment check even if the subagent should not be modifying the parent's files.
  const siblingWorktree = path.resolve(REPO, '..', 'ceo-1-1787176362');
  if (!fs.existsSync(siblingWorktree)) return;

  const parentFile = path.join(siblingWorktree, 'scripts', 'some-file.ts');
  const result = runHook(
    compact(write(parentFile)),
    { CLAUDE_PROJECT_DIR: siblingWorktree }
  );
  // Current: ALLOW (passes containment). This is the false-negative direction of the bug.
  // The correct policy is TBD (all worktrees of the same repo, or only own worktree).
  assert.equal(result, ALLOW,
    'KNOWN BUG (false-negative): parent-worktree write is allowed from subagent via inherited root. ' +
    'Policy for the correct behavior requires a security decision.');
});
