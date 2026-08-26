'use strict';
// POSTURE: library. Called only by `claim-judge-external` in scripts/lib/resolvers.js.
//
// scripts/lib/judges.js — the external judge binaries, as data.
//
// THE INVARIANT THIS FILE MUST NOT BREAK: a profile can only make the resolver report
// LESS than it checked, never more. If a profile's envelope is wrong for the binary it
// names, no completion marker is found and `claim-judge-external` returns `unresolved`.
// A wrong profile cannot manufacture a verdict.
//
// That property is not decoration — it is the only thing that makes shipping the `codex`
// profile honest, because ONE of the two profiles below has been read off its binary and
// the other has not:
//
//   gemini  VERIFIED-BY-SOURCE, 0.38.2, read 2026-08-26 out of the installed bundle
//           (`packages/core/src/output/types.ts` and `gemini.js`'s emitEvent call sites).
//           NOT verified against a live run: this machine's gemini refuses to
//           authenticate — `IneligibleTierError`, exit 1, 0 bytes of stdout.
//   codex   UNVERIFIED AGAINST THE BINARY. `codex` is not installed here. The envelope
//           comes from docs/03-system-design/TARGET-ARCHITECTURE.md, which sourced it
//           from `openai/codex` `codex-rs/exec/src/lib.rs` on 2026-08-20.
//
// TWO TRAPS FOUND BY READING THE GEMINI SOURCE, both of which a plausible parser walks into:
//
//   1. `result` IS ALSO EMITTED ON FAILURE. Every fatal path in gemini.js emits
//      `{type:'result', status:'error', error:{…}, stats:{…}}`. A predicate of
//      "a result event exists" therefore reports a completed turn for a crash. The
//      completion marker is `status === 'success'`, not the event type alone.
//   2. THE BINARY ECHOES THE PROMPT. gemini emits `{type:'message', role:'user',
//      content:<the prompt>}` before the model answers. Scanning raw stdout for the
//      verdict token would read our own instructions back as the judge's answer — a
//      resolver grading its own homework. Two independent defences below: text is taken
//      only from non-user messages, and the token is nonced with the placeholder written
//      so that an echo cannot satisfy the extractor.

const VERDICT_PREFIX = 'WARROOM-VERDICT';

/** The binary used when nothing overrides it. Named in TARGET-ARCHITECTURE.md §1 decision 5. */
const DEFAULT_JUDGE = 'codex';

/**
 * A profile is: how to invoke the binary, how to recognise that its turn COMPLETED, and
 * where the model's own words are. It never decides pass/fail — that is the resolver's,
 * and it is driven by the verdict token alone.
 *
 * `argv` never carries the prompt. The prompt goes on stdin in both profiles, so
 * LLM-authored text stays out of `argv`, out of `ps`, and out of any shell.
 */
const PROFILES = {
  // `codex exec - --json`: subcommand not flag, trailing `-` mandatory (without it codex
  // APPENDS stdin to the argv prompt rather than ignoring it), and `-p` is `--profile`,
  // not prompt. Emits JSON Lines: thread.started · turn.started · item.* · turn.completed
  // · turn.failed · error.
  codex: {
    bin: 'codex',
    argv: ['exec', '-', '--json'],
    verified_against_binary: false,
    // `turn.completed` carries codex's own `usage` object. Field name is accepted as
    // either `type` or `event` because the source was read as prose rather than as a
    // schema; the VALUE is matched exactly, and `turn.completed` is distinctive enough
    // that it cannot appear as an unrelated field's value.
    completion(events) {
      const kind = (e) => (typeof e.type === 'string' ? e.type : typeof e.event === 'string' ? e.event : '');
      if (events.some((e) => kind(e) === 'turn.completed')) return { completed: true };
      if (events.some((e) => kind(e) === 'turn.failed')) {
        return { completed: false, why: 'the judge emitted turn.failed — its turn ran and did not finish' };
      }
      return { completed: false, why: `no turn.completed event in ${events.length} event(s)` };
    },
    // Every item.* event, serialised. codex's item shape is not verified here, so nothing
    // is assumed about WHERE the text sits — only the nonced token has to survive, and a
    // prompt echo cannot produce one. See trap 2 in the header.
    text(events) {
      const kind = (e) => (typeof e.type === 'string' ? e.type : typeof e.event === 'string' ? e.event : '');
      return events.filter((e) => kind(e).startsWith('item.')).map((e) => JSON.stringify(e)).join('\n');
    },
  },

  // `gemini -o stream-json` with the prompt on stdin and an EMPTY `-p`. `--help` states
  // -p is "Appended to input on stdin (if any)", so `-p ''` keeps the prompt on stdin and
  // appends nothing. Emits JSON Lines typed init · message · tool_use · tool_result ·
  // error · result.
  gemini: {
    bin: 'gemini',
    argv: ['-p', '', '-o', 'stream-json'],
    verified_against_binary: false,
    completion(events) {
      const results = events.filter((e) => e.type === 'result');
      if (results.some((e) => e.status === 'success')) return { completed: true };
      const errored = results.find((e) => e.status === 'error');
      if (errored) {
        const msg = (errored.error && errored.error.message) || 'no message';
        return { completed: false, why: `the judge emitted result status:error — ${String(msg).slice(0, 200)}` };
      }
      if (results.length > 0) {
        return { completed: false, why: `result event carried status ${JSON.stringify(results[0].status)}, not "success"` };
      }
      return { completed: false, why: `no result event with status:success in ${events.length} event(s)` };
    },
    // role:'user' is the echo of our own prompt — see trap 2. Excluded by role rather
    // than by content, so it stays excluded if the prompt wording changes.
    text(events) {
      return events
        .filter((e) => e.type === 'message' && e.role !== 'user')
        .map((e) => (typeof e.content === 'string' ? e.content : JSON.stringify(e.content)))
        .join('\n');
    },
  },
};

/**
 * The profile for a configured name. The table is CLOSED: an unknown name yields null
 * rather than a guess. Running an unrecognised binary with another binary's argv is how
 * you get a wrong answer wearing the shape of a right one.
 */
function selectProfile(name) {
  return Object.prototype.hasOwnProperty.call(PROFILES, name) ? PROFILES[name] : null;
}

/**
 * The exact bytes sent to the judge. Deterministic given (claim, nonce) so
 * `prompt_sha256` in the attestation names something reproducible.
 *
 * The verdict template is written `<pass|fail>` ON PURPOSE. The extractor requires the
 * bare word `pass` or `fail` after the colon, so this line — the one line guaranteed to
 * be echoed by any binary that replays its input — cannot itself satisfy it.
 */
function buildPrompt(claim, nonce) {
  const ev = claim.evidence || {};
  const lenses = Array.isArray(ev.lenses) && ev.lenses.length ? ev.lenses.join(', ') : '(none recorded)';
  return [
    'You are an independent second-opinion judge for a claim ledger. You are being asked',
    'about one assertion, by a different model family from the one that wrote it.',
    '',
    `CLAIM ID: ${claim.id}`,
    'ASSERTION:',
    String(claim.assert),
    '',
    `REVIEW LENSES: ${lenses}`,
    '',
    'Decide whether the assertion holds exactly as stated. Look for the reading under',
    'which it does NOT hold before you accept it. If you cannot tell, say fail rather',
    'than guessing — a wrong pass is the failure this ledger exists to prevent.',
    '',
    'Finish with exactly one line in this form and nothing else on it:',
    `${VERDICT_PREFIX}-${nonce}: <pass|fail>`,
    'Replace the placeholder with the single word pass or the single word fail.',
  ].join('\n');
}

/**
 * The verdicts a judge actually stated, in its own words. Returns the DISTINCT set, so
 * "pass" said three times is one verdict and "pass" plus "fail" is a contradiction the
 * caller must refuse rather than average.
 */
function extractVerdicts(text, nonce) {
  const re = new RegExp(`${VERDICT_PREFIX}-${nonce}:\\s*(pass|fail)\\b`, 'gi');
  const found = new Set();
  for (const m of String(text).matchAll(re)) found.add(m[1].toLowerCase());
  return [...found];
}

/**
 * Parse a judge's stdout under one profile.
 *
 * Returns { events, completed, why, verdicts } — never a status. Deciding pass/fail/
 * unresolved is the resolver's job and stays in one place.
 */
function parseOutput(profile, stdout, nonce) {
  const events = [];
  let unparseable = 0;
  for (const line of String(stdout).split('\n')) {
    const t = line.trim();
    if (!t) continue;
    let e;
    try { e = JSON.parse(t); } catch { unparseable++; continue; }
    // A JSON Lines event is an object. A bare string or number on its own line is a
    // banner, not an event, and must not be counted as one.
    if (e && typeof e === 'object' && !Array.isArray(e)) events.push(e);
    else unparseable++;
  }
  if (events.length === 0) {
    return {
      events, unparseable, completed: false, verdicts: [],
      why: `stdout carried no parseable JSON events (${unparseable} non-event line(s))`,
    };
  }
  const c = profile.completion(events);
  if (!c.completed) return { events, unparseable, completed: false, verdicts: [], why: c.why };
  return { events, unparseable, completed: true, verdicts: extractVerdicts(profile.text(events), nonce) };
}

module.exports = {
  PROFILES,
  DEFAULT_JUDGE,
  VERDICT_PREFIX,
  selectProfile,
  buildPrompt,
  parseOutput,
  extractVerdicts,
};
