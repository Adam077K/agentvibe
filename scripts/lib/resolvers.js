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

const { execFileSync } = require('child_process');

const DAY_MS = 86400000;
const FETCH_TIMEOUT_MS = 8000;
const COMMAND_TIMEOUT_MS = 60000;
const ACCESSED_MAX_AGE_DAYS = 180;

/** Resolver names accepted in `.claude/qa-tier-floor.yml`. Anything else throws. */
const RESOLVER_NAMES = ['claim-source', 'claim-freshness', 'claim-command', 'claim-judge'];

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
    const until = dateMs(d.until);
    if (Number.isNaN(until)) {
      return result(resolverName, claim, 'fail', `disposition.until "${d.until}" is not a date`);
    }
    const deadline = until + DAY_MS;
    if (now < deadline) {
      const left = daysBetween(deadline, now);
      return result(resolverName, claim, 'pass', `waived for ${left} more day${left === 1 ? '' : 's'} (until ${d.until}) — ${d.reason}`);
    }
    const over = daysBetween(now, deadline);
    return result(resolverName, claim, 'fail',
      `WAIVER LAPSED ${over} day${over === 1 ? '' : 's'} ago (until ${d.until}) — "${d.reason}". ` +
      `A lapsed waiver is worse than no disposition: somebody promised to come back to this and did not. ` +
      `Refresh it, deprecate it, or waive it again with a new date and a reason that has changed.`);
  }
  return null;
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
  return result('claim-command', claim, 'pass', `\`${ev.cmd}\` exited ${code} as expected`);
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

// ── Dispatch ────────────────────────────────────────────────────────────────

const IMPL = {
  'claim-freshness': (claim, opts) => Promise.resolve(freshness(claim, opts)),
  'claim-source': (claim, opts) => source(claim, opts),
  'claim-command': (claim, opts) => Promise.resolve(command(claim, opts)),
  'claim-judge': (claim, opts) => Promise.resolve(judge(claim, opts)),
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
  resolversFor,
  run,
  normaliseText,
};
