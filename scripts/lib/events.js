'use strict';
// POSTURE: library — it never exits and it never throws. A run log that can abort the
// thing it is logging is worse than no run log.
//
// scripts/lib/events.js — where `claim.*` events go, and the one implementation of it.
//
// WHY THIS FILE EXISTS. `scripts/ledger.mjs` owned `eventsPath()` and `logEvent()`
// privately. `scripts/lib/claim-append.js` needs the same two functions for the same
// reason — a refusal that is not logged is friction nobody can measure — and copying
// them would have produced two answers to "which log did it write to", which is the
// first question anybody asks when a `would_block` cannot be found. This repo already
// paid for that lesson twice: one risk classifier instead of two, one waiver-date rule
// instead of two. So the functions moved here and both callers require them.
//
// RESOLUTION ORDER IS EXPLICIT AND THE CHOSEN PATH IS ALWAYS RETURNED, for the same
// reason ledger.mjs stated it: the caller prints it.
//
//   1. $WARROOM_EVENTS          — a named seam, so a test can aim this at a fixture
//                                 WITHOUT moving $HOME (which would silently move the
//                                 global ledger too — see GLOBAL_LEDGER in ledger.mjs)
//   2. .warroom.yml state_dir   — the launcher's own state directory
//   3. .warroom.yml session     — ~/.<session>/events.jsonl
//   4. <repo>/.ledger-events.jsonl

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { parseYamlSubset } = require('./claims.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** Absolute path of the run log this process should append to. Never throws. */
function eventsPath(repoRoot = REPO_ROOT) {
  if (process.env.WARROOM_EVENTS) return process.env.WARROOM_EVENTS;
  const cfgPath = path.join(repoRoot, '.warroom.yml');
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = parseYamlSubset(fs.readFileSync(cfgPath, 'utf8')) || {};
      const stateDir = cfg.state_dir
        ? String(cfg.state_dir).replace(/^~/, os.homedir())
        : (cfg.session ? path.join(os.homedir(), `.${cfg.session}`) : null);
      if (stateDir) return path.join(stateDir, 'events.jsonl');
    } catch { /* fall through to the in-repo log */ }
  }
  return path.join(repoRoot, '.ledger-events.jsonl');
}

/**
 * Append one JSON line. Returns the path written, or null when the write failed —
 * the caller decides whether that matters. It never throws, because every caller is
 * doing something more important than logging and a full disk must not turn a correct
 * refusal into a crash.
 */
function logEvent(obj, repoRoot = REPO_ROOT) {
  const p = eventsPath(repoRoot);
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, JSON.stringify(obj) + '\n');
    return p;
  } catch (e) {
    process.stderr.write(`events: could not write ${p}: ${e.message}\n`);
    return null;
  }
}

module.exports = { eventsPath, logEvent, REPO_ROOT };
