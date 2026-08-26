'use strict';
// POSTURE: library. `scripts/ledger.mjs` turns a `fail`/`unresolved` on a
// `enforcement: block` path into exit 1, and logs everything else to events.jsonl.
//
// scripts/lib/resolvers.js — the four claim resolvers, and the registry of their names.
//
// THE ONE INVARIANT: no resolver returns `pass` when it could not check.
//
// A resolver has exactly three outcomes:
//   pass        it checked, and the claim holds
//   fail        it checked, and the claim does not hold
//   unresolved  it could not check — no network, nothing judged it yet, command absent
//
// `unresolved` is treated as a would_block, never as a pass. This is the whole
// difference between a gate and a decoration. `schema-lint.js` still contains the
// opposite pattern — `catch { LIVE_SKILLS = null }`, which turns an unreadable manifest
// into a silently skipped check — and that shape is why fabrications survived eight
// weeks of green builds.
//
// WHY NETWORK RESOLVERS NEVER GUARD A BLOCKING PATH
// `claim-source` needs the internet, so an outage makes it `unresolved`, which on a
// blocking path would fail the build for a reason unrelated to the change. The tier map
// resolves this by construction rather than by weakening the invariant: every path
// carrying `enforcement: block` uses `claim-command` only. Network-dependent claims live
// on shadow paths, where an outage produces an honest log line and a green build.

const { execFileSync, spawnSync } = require('child_process');
const crypto = require('crypto');
const judges = require('./judges.js');

const DAY_MS = 86400000;
const FETCH_TIMEOUT_MS = 8000;
const COMMAND_TIMEOUT_MS = 60000;
const ACCESSED_MAX_AGE_DAYS = 180;
const JUDGE_TIMEOUT_MS = 120000;
const JUDGE_MAX_OUTPUT = 8 * 1024 * 1024;

/** Resolver names accepted in `.claude/qa-tier-floor.yml`. Anything else throws. */
const RESOLVER_NAMES = ['claim-source', 'claim-freshness', 'claim-command', 'claim-judge', 'claim-judge-external'];

/** Which resolver a claim's own `verified_by` implies. */
const VERIFIED_BY_RESOLVER = {
  source: 'claim-source',
  command: 'claim-command',
  judge: 'claim-judge',
};

function result(resolver, claim, status, reason, detail) {
  const r = { resolver, claim_id: claim.id, status, reason };
  if (detail !== undefined) r.detail = detail;
  return r;
}

function daysBetween(aMs, bMs) {
  return Math.floor((aMs - bMs) / DAY_MS);
}

function dateMs(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

// ── claim-freshness ─────────────────────────────────────────────────────────
// The resolver that would have caught fabrication #16. "Subagents cannot spawn
// subagents" was true when written, carried no expiry, and the entire topology obeyed
// it for months after it stopped being true. Freshness converts "nobody noticed" into a
// dated, forced decision: Refresh, Deprecate, or Waive with a new deadline.

// ── Dispositions ────────────────────────────────────────────────────────────
// A disposition is what somebody decided when a claim came due. It changes the outcome
// of a resolver, so it is evaluated first — and it is deliberately not a mute button:
//
//   deprecate  the claim is retired. It resolves `pass` and says so. Nothing is checked
//              because nothing is claimed any more.
//   waive      checking is postponed until a date. Live → `pass` with the deadline shown.
//              EXPIRED → `fail`, and worse than having no disposition at all, because
//              somebody promised to come back to it and did not. A waiver that quietly
//              lapses is how "we'll look at it next sprint" became eight weeks of green
//              builds over a false claim.
//   refresh    the evidence was renewed. It does NOT short-circuit anything — the
//              resolver still runs. Saying you refreshed it is not the same as it
//              passing, and only one of those is checkable.
function dispositionOutcome(claim, now, resolverName) {
  const d = claim.disposition;
  if (!d || !d.action) return null;
  if (d.action === 'refresh') return null;
  if (d.action === 'deprecate') {
    return result(resolverName, claim, 'pass', `deprecated — no longer claimed (${d.reason})`);
  }
  if (d.action === 'waive') {
    const w = waiverState(claim, now);
    if (w.invalid) {
      return result(resolverName, claim, 'fail', `disposition.until "${d.until}" is not a date`);
    }
    if (!w.lapsed) {
      return result(resolverName, claim, 'pass', `waived for ${w.days} more day${w.days === 1 ? '' : 's'} (until ${d.until}) — ${d.reason}`);
    }
    return result(resolverName, claim, 'fail',
      `WAIVER LAPSED ${w.days} day${w.days === 1 ? '' : 's'} ago (until ${d.until}) — "${d.reason}". ` +
      `A lapsed waiver is worse than no disposition: somebody promised to come back to this and did not. ` +
      `Refresh it, deprecate it, or waive it again with a new date and a reason that has changed.`);
  }
  return null;
}

// Whether a waiver is still in force, as data rather than as a rendered sentence.
//
// `ledger sweep` needs the same answer this resolver needs, and computed it independently
// for exactly one commit. Two implementations of one date rule agree until a leap year or
// a timezone, and then disagree during the incident they were built to prevent — the same
// argument that gave the repo one risk classifier instead of two.
//
// Returns { invalid } | { lapsed: false, days } | { lapsed: true, days }.
function waiverState(claim, now) {
  const d = (claim && claim.disposition) || {};
  const until = dateMs(d.until);
  if (Number.isNaN(until)) return { invalid: true };
  const deadline = until + DAY_MS;
  return now < deadline
    ? { invalid: false, lapsed: false, days: daysBetween(deadline, now) }
    : { invalid: false, lapsed: true, days: daysBetween(now, deadline) };
}

function freshness(claim, opts = {}) {
  const now = opts.now === undefined ? Date.now() : opts.now;
  const disp = dispositionOutcome(claim, now, 'claim-freshness');
  if (disp) return disp;
  if (claim.valid_until === undefined || claim.valid_until === null) {
    if (claim.scope === 'task') {
      return result('claim-freshness', claim, 'pass', 'task-scoped claim — expires with the branch');
    }
    return result('claim-freshness', claim, 'fail', `scope:${claim.scope} claim has no valid_until`);
  }
  const expires = dateMs(claim.valid_until);
  if (Number.isNaN(expires)) {
    return result('claim-freshness', claim, 'fail', `valid_until "${claim.valid_until}" is not a date`);
  }
  // A claim is live through the END of its valid_until day.
  const deadline = expires + DAY_MS;
  if (now >= deadline) {
    const over = daysBetween(now, deadline);
    return result('claim-freshness', claim, 'fail',
      `expired ${over} day${over === 1 ? '' : 's'} ago (valid_until ${claim.valid_until}) — record a disposition: Refresh, Deprecate, or Waive with a new deadline`);
  }
  const left = daysBetween(deadline, now);
  return result('claim-freshness', claim, 'pass', `${left} day${left === 1 ? '' : 's'} remaining (valid_until ${claim.valid_until})`);
}

// ── claim-source ────────────────────────────────────────────────────────────
// URL returns 2xx · the recorded quote is present in the fetched text · `accessed` is a
// real, non-future date within the access window.

function normaliseText(s) {
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function source(claim, opts = {}) {
  const now = opts.now === undefined ? Date.now() : opts.now;
  // Issue: dispositionOutcome was only called by freshness and judge, not source. A
  // deprecated source-claim kept fetching its URL and failing after the source was retired.
  // `refresh` still does not short-circuit — see the comment at line 76.
  const disp = dispositionOutcome(claim, now, 'claim-source');
  if (disp) return disp;
  const doFetch = opts.fetchImpl || (typeof fetch === 'function' ? fetch : null);
  const ev = claim.evidence || {};

  const accessedMs = dateMs(ev.accessed);
  if (Number.isNaN(accessedMs)) {
    return result('claim-source', claim, 'fail', `evidence.accessed "${ev.accessed}" is not a date`);
  }
  if (accessedMs > now + DAY_MS) {
    return result('claim-source', claim, 'fail', `evidence.accessed ${ev.accessed} is in the future`);
  }

  if (opts.offline) {
    return result('claim-source', claim, 'unresolved', 'offline mode — the URL was not fetched, so this claim is unverified');
  }
  if (!doFetch) {
    return result('claim-source', claim, 'unresolved', 'no fetch implementation available in this runtime');
  }

  let res;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs || FETCH_TIMEOUT_MS);
  try {
    res = await doFetch(ev.url, { signal: ac.signal, redirect: 'follow', headers: { 'user-agent': 'warroom-ledger/1' } });
  } catch (e) {
    clearTimeout(timer);
    // A DNS failure or a refused connection is a genuine finding about a cited source,
    // not an infrastructure hiccup to shrug off — it is reported as fail, and the
    // difference from a true outage is that an outage fails every source claim at once.
    // Node's own fetch error message is the bare string "fetch failed"; the reason
    // (ENOTFOUND, ECONNREFUSED, certificate error) is only on `cause`. Logging the
    // outer message alone produces "fetch failed: fetch failed", which tells a reader
    // nothing about whether the domain is dead or the runner has no egress.
    const why = e.name === 'AbortError'
      ? 'timed out'
      : [e.message, e.cause && e.cause.message].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' — ');
    return result('claim-source', claim, 'fail', `fetch failed: ${why}`, { url: ev.url });
  }
  clearTimeout(timer);

  if (!res.ok) {
    return result('claim-source', claim, 'fail', `HTTP ${res.status} from ${ev.url}`, { status: res.status, url: ev.url });
  }

  let body;
  try {
    body = await res.text();
  } catch (e) {
    return result('claim-source', claim, 'unresolved', `response body unreadable: ${e.message}`);
  }

  const haystack = normaliseText(body);
  const needle = normaliseText(ev.quote);
  if (!needle) {
    return result('claim-source', claim, 'fail', 'evidence.quote is empty after normalisation');
  }
  if (!haystack.includes(needle)) {
    return result('claim-source', claim, 'fail',
      `the URL is live but the recorded quote is not present in it — the source moved or the quote was never there`,
      { url: ev.url, quote: ev.quote.slice(0, 120) });
  }

  const age = daysBetween(now, accessedMs);
  const maxAge = opts.accessedMaxAgeDays || ACCESSED_MAX_AGE_DAYS;
  const note = age > maxAge
    ? `quote verified live, but evidence.accessed is ${age} days old (>${maxAge}) — refresh the date`
    : `quote verified live at ${ev.url}`;
  return result('claim-source', claim, 'pass', note);
}

// ── claim-command ───────────────────────────────────────────────────────────
// Runs the command and asserts its exit code and, optionally, its stdout.
//
// A `command` claim executes code from a repository file. That is why every path
// carrying `enforcement: block` is also `tier: irreversible` or `full` in the tier map:
// adding one is a reviewed change, not a doc edit.

function command(claim, opts = {}) {
  const now = opts.now === undefined ? Date.now() : opts.now;
  // Issue: dispositionOutcome was only called by freshness and judge, not command. A
  // deprecated command-claim kept running its command and failing after being retired —
  // making `deprecate` unusable for command-claims, which are the ones most likely to go
  // stale when the code they pin moves. `refresh` still does not short-circuit.
  const disp = dispositionOutcome(claim, now, 'claim-command');
  if (disp) return disp;
  const ev = claim.evidence || {};
  const expectExit = ev.expect_exit === undefined ? 0 : ev.expect_exit;
  const cwd = opts.cwd || process.cwd();

  if (opts.skipCommands) {
    return result('claim-command', claim, 'unresolved', 'command execution disabled — this claim is unverified');
  }
  // Belt and braces with resolversFor(): never shell out to nothing and call the result a
  // failed command.
  if (typeof ev.cmd !== 'string' || ev.cmd.trim() === '') {
    return result('claim-command', claim, 'unresolved', 'this claim carries no evidence.cmd — the command resolver does not apply to it');
  }

  let stdout = '';
  let stderr = '';
  let code = 0;
  try {
    stdout = execFileSync('/bin/sh', ['-c', ev.cmd], {
      cwd,
      timeout: opts.timeoutMs || COMMAND_TIMEOUT_MS,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, WARROOM_LEDGER: '1' },
    });
  } catch (e) {
    if (e.killed || e.signal) {
      return result('claim-command', claim, 'unresolved', `command timed out or was killed (${e.signal || 'timeout'})`, { cmd: ev.cmd });
    }
    code = typeof e.status === 'number' ? e.status : 127;
    stdout = e.stdout ? String(e.stdout) : '';
    stderr = e.stderr ? String(e.stderr) : '';
  }

  // Opt-in unchecked exit: a command can declare that one exit code means "I could not
  // measure this" rather than "the claim is broken". The field is intentionally opt-in:
  // reserving exit 2 globally would silently reinterpret any existing claim that legitimately
  // expects it — a magic number, which is the same class of defect this feature fixes.
  //
  // This implements the corollary of Rule 10: a resolver should not FAIL what it could not
  // check either. `unresolved` already exists for exactly this case (disabled, timeout,
  // offline) and was unreachable from inside a running command.
  if (ev.unchecked_exit !== undefined && code === ev.unchecked_exit) {
    return result('claim-command', claim, 'unresolved',
      `command exited ${code} (declared unchecked_exit) — the check reported it could not measure this`,
      { cmd: ev.cmd, stderr: stderr.trim().split('\n').slice(-5).join('\n').slice(0, 500) });
  }
  if (code !== expectExit) {
    return result('claim-command', claim, 'fail',
      `exit ${code}, expected ${expectExit}`,
      { cmd: ev.cmd, stderr: stderr.trim().split('\n').slice(-5).join('\n').slice(0, 500) });
  }
  if (ev.expect_stdout !== undefined) {
    let re;
    try { re = new RegExp(ev.expect_stdout); }
    catch (e) { return result('claim-command', claim, 'fail', `expect_stdout is not a valid regex: ${e.message}`); }
    if (!re.test(stdout)) {
      return result('claim-command', claim, 'fail',
        `exit code matched but stdout does not match /${ev.expect_stdout}/`,
        { cmd: ev.cmd, stdout_head: stdout.slice(0, 300) });
    }
  }
  // configuration_only is an opt-in flag that marks a command claim as checking
  // only the configuration its measurement was taken against, not live behaviour.
  // The status is still `pass` — the configuration check did pass — but the reason
  // is annotated so `verify` output distinguishes it from a claim that re-measured
  // the asserted behaviour. Sibling of unchecked_exit (issue #81). See issue #90.
  const passReason = ev.configuration_only === true
    ? `\`${ev.cmd}\` exited ${code} as expected (configuration-only: verified configuration, not live behaviour)`
    : `\`${ev.cmd}\` exited ${code} as expected`;
  return result('claim-command', claim, 'pass', passReason);
}

// ── claim-judge ─────────────────────────────────────────────────────────────
// Judgment cannot be executed, so this resolver checks the SHAPE and INDEPENDENCE of
// the recorded judgment rather than performing it.
//
// STATED LIMIT, not papered over: this resolver does not call a model. It verifies that
// a judgment was recorded, that a risk:high panel spans at least two model families, and
// that no judge dissented. An unjudged claim is `unresolved`, never `pass` — so a claim
// cannot slip through by never being judged. `node scripts/ledger.mjs judge <id>` prints
// the lens pack to run and the exact block to paste back; wiring an automatic dispatch
// to a model API is deliberately not done here, because a resolver that fabricates a
// verdict is worse than one that admits it has none.

function judge(claim, opts = {}) {
  const ev = claim.evidence || {};
  const panel = Array.isArray(ev.judged_by) ? ev.judged_by : [];
  const now = opts.now === undefined ? Date.now() : opts.now;

  // A waiver covers "we cannot judge this yet" — the case that actually occurs, since
  // judging needs models this process may not be able to call. It never covers a panel
  // that judged and DISSENTED: that is an answer, and you do not get to waive an answer.
  if (!panel.some((j) => j && j.verdict === 'fail')) {
    const disp = dispositionOutcome(claim, now, 'claim-judge');
    if (disp) return disp;
  }

  if (panel.length === 0) {
    return result('claim-judge', claim, 'unresolved',
      `no judgment recorded — run \`node scripts/ledger.mjs judge ${claim.id}\``);
  }
  const dissent = panel.filter((j) => j.verdict === 'fail');
  if (dissent.length > 0) {
    return result('claim-judge', claim, 'fail',
      `${dissent.length} of ${panel.length} judges returned fail`,
      { dissenting: dissent.map((j) => `${j.model_family}/${j.model_id}`) });
  }
  const unresolvedVotes = panel.filter((j) => j.verdict === 'unresolved');
  if (unresolvedVotes.length > 0) {
    return result('claim-judge', claim, 'unresolved',
      `${unresolvedVotes.length} of ${panel.length} judges could not decide`);
  }
  const families = new Set(panel.map((j) => j.model_family));
  if (ev.risk === 'high' && families.size < 2) {
    return result('claim-judge', claim, 'fail',
      `risk:high needs >=2 model families, got ${families.size} (${[...families].join(', ')}) — one family agreeing with itself is one opinion`);
  }
  return result('claim-judge', claim, 'pass',
    `${panel.length} judge${panel.length === 1 ? '' : 's'} across ${families.size} famil${families.size === 1 ? 'y' : 'ies'} returned pass`);
}

// ── claim-judge-external ────────────────────────────────────────────────────
// The sibling `claim-judge` checks the SHAPE of a judgment somebody else recorded. This
// one CALLS a judge — a second model family, out of process — and is the only route this
// repo has to the `risk: high` requirement of >=2 distinct model families, because there
// is no non-Anthropic model inside Claude Code.
//
// THE TRAP THAT DEFERRED THIS FOR WEEKS, AND THE RULE THAT COMES OUT OF IT
// Codex bug #19945: `codex exec` returns EXIT 0 WITH 0-BYTE STDOUT when stdio is detached
// from a TTY — which is precisely how a resolver runs it (bug #4721 does the same for
// SIGINT, returning 0 rather than 130). A resolver that read exit 0 as a pass would
// manufacture judgments that were never made, on the highest-risk claims in the ledger.
//
// So: THIS RESOLVER NEVER READS THE EXIT CODE. Not as a pass, not as a fail. It gates on
// a positively identified turn-completion marker in the binary's own event stream, plus a
// verdict the judge stated in its own words. Absent either, the answer is `unresolved`
// with a reason naming WHICH precondition failed — absent binary, no turn completion,
// no verdict, contradictory verdicts, timeout — because an `unresolved` that does not say
// why sends the next person to re-derive it.
//
// Every one of those is indistinguishable from "judged, no objection" if you squint, and
// that is the whole point: a negative result is evidence only next to a control that
// fires. The control lives in the tests — a stub emitting a real, conformant verdict must
// resolve pass/fail, or the five negative cases prove only that the resolver is inert.
//
// ASYMMETRY (MODEL-DIVERSITY.md): a second-family judge may turn PASS into BLOCK, never
// BLOCK into PASS. Implemented below by refusing to call the binary at all when the
// recorded panel already dissents — a flaky or absent judge degrades to "no second
// opinion", never to a false pass.
//
// WHAT IT COSTS TO RUN, stated because it is not obvious: this spawns a process and that
// process talks to a vendor API, sending the claim's assertion text off this machine. It
// is therefore BOTH a command resolver and a network resolver, and honours `--no-exec`
// and `--offline` alike. Nothing in `.claude/qa-tier-floor.yml` names it, so it does not
// run unless a rule is added — and per this file's header, a network-dependent resolver
// must never guard an `enforcement: block` path.

function judgeExternal(claim, opts = {}) {
  const ev = claim.evidence || {};
  const now = opts.now === undefined ? Date.now() : opts.now;
  const panel = Array.isArray(ev.judged_by) ? ev.judged_by : [];
  const R = (status, reason, detail) => result('claim-judge-external', claim, status, reason, detail);

  // Same rule as `claim-judge`: a waiver covers "we cannot judge this yet", never a panel
  // that judged and dissented.
  if (!panel.some((j) => j && j.verdict === 'fail')) {
    const disp = dispositionOutcome(claim, now, 'claim-judge-external');
    if (disp) return disp;
  } else {
    // The asymmetry, enforced before any spawn: nothing this binary says can lift a
    // recorded dissent, so there is no reason to ask it and no way for its answer to leak
    // into a pass.
    return R('fail', `the recorded panel already dissents (${panel.filter((j) => j.verdict === 'fail').length} of ${panel.length}) — a second family may turn PASS into BLOCK, never BLOCK into PASS`);
  }

  if (!Array.isArray(ev.judged_by)) {
    return R('unresolved', 'this claim carries no evidence.judged_by — the external judge resolver does not apply to it');
  }
  if (opts.skipCommands) {
    return R('unresolved', 'external judge execution disabled (--no-exec) — this claim is unverified');
  }
  if (opts.offline) {
    return R('unresolved', 'offline mode — the external judge was not called, so this claim is unverified');
  }

  const binName = opts.bin || process.env.WARROOM_JUDGE_BIN || judges.DEFAULT_JUDGE;
  const profile = judges.selectProfile(binName);
  if (!profile) {
    // A closed table. Guessing another binary's argv is how you get a wrong answer wearing
    // the shape of a right one — the same defect class as `-p` meaning `--profile`.
    return R('unresolved', `no judge profile for "${binName}" — configured profiles: ${Object.keys(judges.PROFILES).join(', ')}`);
  }
  // The BINARY IS NEVER CLAIM-CONTROLLED. `claim-command` runs a string out of a document
  // because its tier rules gate which documents may carry one; a judge claim has no such
  // gate, so letting `evidence` name the executable would hand any writable doc an
  // arbitrary spawn. Configuration comes from the process, not from the data.
  const binPath = opts.binPath || process.env.WARROOM_JUDGE_PATH || profile.bin;
  const nonce = opts.nonce || crypto.randomBytes(6).toString('hex');
  const prompt = judges.buildPrompt(claim, nonce);
  const argv = profile.argv.slice();
  const timeoutMs = opts.timeoutMs || JUDGE_TIMEOUT_MS;

  const sha = (s) => crypto.createHash('sha256').update(s === null ? '' : String(s)).digest('hex');
  // The attestation is what makes a recorded second-family judgment checkable rather than
  // lexical: `claims.js` counts distinct `model_family` STRINGS, so anyone can type
  // `model_family: openai` into YAML and satisfy the independence predicate. These hashes
  // name the invocation that actually happened.
  const attest = (stdout) => ({
    bin: binName,
    bin_path: binPath,
    argv_sha256: sha(JSON.stringify([binPath, ...argv])),
    prompt_sha256: sha(prompt),
    stdout_sha256: stdout === null ? null : sha(stdout),
    subject: sha(String(claim.assert)),
  });

  const r = spawnSync(binPath, argv, {
    input: prompt,
    encoding: 'utf8',
    timeout: timeoutMs,
    killSignal: 'SIGKILL',
    maxBuffer: opts.maxBuffer || JUDGE_MAX_OUTPUT,
    cwd: opts.cwd || process.cwd(),
    env: { ...process.env, WARROOM_LEDGER: '1' },
  });

  // Measured 2026-08-26 on node in this repo: ENOENT for an absent binary (bare name or
  // absolute path), ETIMEDOUT + signal SIGKILL on timeout, ENOBUFS + signal SIGTERM on
  // overflow. ENOBUFS leaves PARTIAL stdout populated, so it is refused before parsing —
  // a truncated stream can carry a completion marker it never earned.
  if (r.error) {
    const code = r.error.code;
    if (code === 'ENOENT') {
      return R('unresolved', `judge binary "${binPath}" is not installed — no second family was consulted`, { attestation: attest(null) });
    }
    if (code === 'ETIMEDOUT') {
      return R('unresolved', `the judge did not finish within ${timeoutMs}ms — killed, so nothing it may have been about to say counts`, { attestation: attest(null) });
    }
    if (code === 'ENOBUFS') {
      return R('unresolved', `the judge wrote more than ${opts.maxBuffer || JUDGE_MAX_OUTPUT} bytes — the captured stream is truncated and will not be parsed`, { attestation: attest(null) });
    }
    return R('unresolved', `the judge could not be run: ${code || r.error.message}`, { attestation: attest(null) });
  }

  const stdout = r.stdout === undefined || r.stdout === null ? '' : String(r.stdout);
  const stderr = r.stderr ? String(r.stderr) : '';
  // The FIRST lines, where `claim-command` keeps the last five. Deliberate, and measured:
  // a compiler puts its summary at the end, a CLI that cannot start puts its message at the
  // beginning. Taking the tail of gemini's real failure here returned a stack frame from
  // inside its bundle and threw away the line that says `IneligibleTierError`.
  const head = stderr.trim().split('\n').filter(Boolean).slice(0, 3).join('\n').slice(0, 400);

  // r.status IS DELIBERATELY NOT CONSULTED, here or anywhere below. It is reported in the
  // detail for a human reading the log and is never an input to the verdict. Bug #19945 is
  // exactly a 0 that means nothing; measured on this machine 2026-08-26, gemini 0.38.2
  // does the mirror image — exit 1 with 0 bytes of stdout on IneligibleTierError — and
  // neither number tells you whether a judgment happened.
  if (stdout.trim() === '') {
    return R('unresolved',
      `the judge produced 0 bytes on stdout — no turn completed, so there is no judgment. Exit ${r.status} is not consulted in either direction: codex #19945 exits 0 having done nothing, and a completed turn with a non-zero exit is still a judgment`,
      { exit: r.status, stderr: head, attestation: attest(stdout) });
  }

  const parsed = judges.parseOutput(profile, stdout, nonce);
  if (!parsed.completed) {
    return R('unresolved', `no turn completion from "${binName}": ${parsed.why}`,
      { exit: r.status, stderr: head, attestation: attest(stdout) });
  }
  if (parsed.verdicts.length === 0) {
    return R('unresolved',
      `"${binName}" completed its turn but stated no verdict — expected a line \`${judges.VERDICT_PREFIX}-<nonce>: pass|fail\` in its own output`,
      { exit: r.status, events: parsed.events.length, attestation: attest(stdout) });
  }
  if (parsed.verdicts.length > 1) {
    return R('unresolved',
      `"${binName}" stated ${parsed.verdicts.length} contradictory verdicts (${parsed.verdicts.join(', ')}) — a contradiction is not a judgment and is not averaged`,
      { exit: r.status, attestation: attest(stdout) });
  }

  const verdict = parsed.verdicts[0];
  const detail = { exit: r.status, events: parsed.events.length, attestation: attest(stdout) };
  if (verdict === 'fail') {
    return R('fail', `second-family judge "${binName}" completed its turn and returned fail`, detail);
  }
  return R('pass', `second-family judge "${binName}" completed its turn and returned pass`, detail);
}

// ── Dispatch ────────────────────────────────────────────────────────────────

const IMPL = {
  'claim-freshness': (claim, opts) => Promise.resolve(freshness(claim, opts)),
  'claim-source': (claim, opts) => source(claim, opts),
  'claim-command': (claim, opts) => Promise.resolve(command(claim, opts)),
  'claim-judge': (claim, opts) => Promise.resolve(judge(claim, opts)),
  'claim-judge-external': (claim, opts) => Promise.resolve(judgeExternal(claim, opts)),
};

/**
 * Which resolvers apply to one claim: the one its `verified_by` implies, plus every
 * resolver the classifier attaches to the file it lives in. Freshness applies to every
 * durable claim whether or not the tier map asks for it — an expiry nobody checks is
 * the same as no expiry.
 */
function resolversFor(claim, fileResolvers = []) {
  const set = new Set();
  const own = VERIFIED_BY_RESOLVER[claim.verified_by];
  if (own) set.add(own);
  if (claim.scope === 'global' || claim.scope === 'project') set.add('claim-freshness');

  // A resolver from the tier map is added only when the claim carries the evidence it
  // needs. Without this, a `verified_by: judge` claim living under a path whose rule lists
  // `claim-command` had the command resolver run against an absent `cmd` — it executed
  // nothing and reported `exit 127, expected 0`, which reads as a real failure of a real
  // command. A resolver that cannot apply must not produce a verdict that looks like it did.
  const ev = claim.evidence || {};
  const applicable = {
    'claim-freshness': true,
    'claim-command': typeof ev.cmd === 'string',
    'claim-source': typeof ev.url === 'string',
    'claim-judge': Array.isArray(ev.judged_by),
    // Same evidence as `claim-judge` — a judge claim is what it applies to. It is NOT
    // added by `verified_by` (see VERIFIED_BY_RESOLVER, which is untouched), so it runs
    // only where a tier rule names it. Today no rule does, and calling a vendor API on
    // every `ledger verify` is not a default anybody chose.
    'claim-judge-external': Array.isArray(ev.judged_by),
  };
  for (const r of fileResolvers) {
    if (RESOLVER_NAMES.includes(r) && applicable[r]) set.add(r);
  }
  return [...set].sort();
}

/** Run one named resolver. Throws on an unknown name — the registry is closed. */
async function run(name, claim, opts = {}) {
  const impl = IMPL[name];
  if (!impl) throw new Error(`unknown resolver "${name}" — implemented: ${RESOLVER_NAMES.join(', ')}`);
  return impl(claim, opts);
}

module.exports = {
  RESOLVER_NAMES,
  VERIFIED_BY_RESOLVER,
  freshness,
  source,
  command,
  judge,
  judgeExternal,
  resolversFor,
  run,
  normaliseText,
  waiverState,
};
