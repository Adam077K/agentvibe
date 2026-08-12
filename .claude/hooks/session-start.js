#!/usr/bin/env node
// POSTURE: ADVISES — SessionStart cannot block, and this never tries to. It injects the
// lens and playbook data into the session, and warns when the ledger sweep has stopped.
//
// WHY THIS EXISTS (Phase 6, 2026-08-12)
//
// Two of the six mechanisms shipped in Phases 3–5 had no mechanical consumer: the lens
// files and the playbooks were linted on every PR and loaded by nothing. "An agent will
// read it" is the same promise 6,487 lines of agent prose made before it rotted, so the
// founder's call was to make the loading mechanical rather than discretionary.
//
// COST, MEASURED — not estimated from a ratio:
//   lenses.yml + review-lenses.yml + 6 playbooks = ~6,300 tokens.
//   Injected once into the stable prompt prefix, which is the best-cached position
//   available: created once at 1.25x, read thereafter at 0.1x. Over a 1,314-turn session
//   that is ~$4.14 against ~$280 — 1.5%. Injecting everything beats routing logic that
//   picks the wrong lens, at this price.
//
// THE STAMP. `ledger sweep` replaced the `reader` agent in Phase 6. A scheduled sweep in
// GitHub Actions writes its stamp on the runner, which never reaches this machine — so the
// sweep is also refreshed here, bounded by STALE_HOURS so it costs ~1s at most once every
// 12 hours. If the stamp goes older than WARN_HOURS the sweep itself has stopped, and that
// is reported loudly: a health check that quietly stops running reads exactly like a
// healthy system.
//
// UNVERIFIED, DELIBERATELY NAMED: whether Claude Code honours
// hookSpecificOutput.additionalContext on SessionStart the way it does on PostToolUse has
// not been confirmed by observation in this session — a new session is needed to see it.
// Recorded as c-sessionstart-injection-unverified with an expiry rather than assumed.
// Standing rule 4: never assert runtime behaviour you have not run.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const STALE_HOURS = 12; // refresh the sweep if the stamp is older than this
const WARN_HOURS = 72; // shout if it is older than this even after trying
const SWEEP_TIMEOUT_MS = 10000;

const REPO = path.resolve(__dirname, '..', '..');
const rd = (p) => {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
};

// ── where the stamp lives (mirrors ledger.mjs eventsPath) ───────────────────
function stampPath() {
  if (process.env.WARROOM_EVENTS) return path.join(path.dirname(process.env.WARROOM_EVENTS), 'reader-stamp.json');
  const cfg = rd(path.join(REPO, '.warroom.yml'));
  if (cfg) {
    const m = /^\s*session:\s*(\S+)/m.exec(cfg);
    const s = /^\s*state_dir:\s*(\S+)/m.exec(cfg);
    if (s) return path.join(s[1].replace(/^~/, os.homedir()), 'reader-stamp.json');
    if (m) return path.join(os.homedir(), `.${m[1]}`, 'reader-stamp.json');
  }
  return path.join(REPO, '.ledger-reader-stamp.json');
}

function hoursSince(iso) {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Infinity : (Date.now() - t) / 3600000;
}

function readStamp() {
  const raw = rd(stampPath());
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// AGENTVIBE_HOOK_NO_REFRESH exists so the stale and missing-stamp paths can be tested at
// all. Without a seam, a successful sweep always writes a fresh stamp and the warning
// branches are unreachable — untested by construction, which is how the Phase 2 install
// guards passed a manual review and still shipped a broken artifact.
function refreshSweep() {
  if (process.env.AGENTVIBE_HOOK_NO_REFRESH === '1') return;
  try {
    execFileSync('node', ['scripts/ledger.mjs', 'sweep', '--json'], {
      cwd: REPO,
      timeout: SWEEP_TIMEOUT_MS,
      stdio: 'ignore',
    });
  } catch {
    // sweep exits 1 when it has findings — that is data, not an error. Either way the
    // stamp was written before the exit, so the read below is what matters.
  }
}

// ── build the injected block ────────────────────────────────────────────────
const parts = [];

let stamp = readStamp();
if (!stamp || hoursSince(stamp.swept_at) > STALE_HOURS) {
  refreshSweep();
  stamp = readStamp();
}

if (!stamp) {
  parts.push(
    'LEDGER SWEEP: no stamp could be produced. `node scripts/ledger.mjs sweep` did not run ' +
      'or could not write. Claim expiry, lapsed waivers and dead resolvers are UNCHECKED this session — ' +
      'that is unknown state, not clean state.'
  );
} else {
  const age = hoursSince(stamp.swept_at);
  if (age > WARN_HOURS) {
    parts.push(
      `LEDGER SWEEP STALE: last swept ${Math.round(age)}h ago (threshold ${WARN_HOURS}h). The sweep has ` +
        'stopped running. A health check that silently stops looks exactly like a healthy system.'
    );
  }
  if (!stamp.canary_alive) {
    parts.push(
      'LEDGER CANARY SILENT: the claim built to fail on every run produced no events. The resolvers ' +
        'are not running. Nothing else the ledger reports can be trusted until that is explained.'
    );
  }
  if (stamp.findings > 0) {
    const bits = [];
    if (stamp.lapsed_waivers?.length) bits.push(`lapsed waivers: ${stamp.lapsed_waivers.join(', ')}`);
    if (stamp.expired?.length) bits.push(`expired: ${stamp.expired.join(', ')}`);
    if (stamp.silent_resolvers?.length) bits.push(`silent resolvers: ${stamp.silent_resolvers.join(', ')}`);
    parts.push(`LEDGER: ${stamp.findings} finding(s) need a disposition — ${bits.join(' · ')}. Run \`npm run ledger:sweep\`.`);
  }
  if (stamp.expiring_soon?.length) {
    parts.push(`LEDGER: expiring within 14 days — ${stamp.expiring_soon.join(', ')}.`);
  }
}

// ── lenses and playbooks: the mechanical consumer ───────────────────────────
const lensFiles = ['.claude/lenses.yml', '.claude/review-lenses.yml'];
const loaded = [];
const missing = [];
for (const rel of lensFiles) {
  const text = rd(path.join(REPO, rel));
  if (text) loaded.push(`### ${rel}\n\n${text.trim()}`);
  else missing.push(rel);
}

const pbDir = path.join(REPO, '.claude', 'playbooks');
let pbNames = [];
try {
  pbNames = fs.readdirSync(pbDir).filter((f) => f.endsWith('.yml')).sort();
} catch {
  missing.push('.claude/playbooks/');
}
for (const f of pbNames) {
  const text = rd(path.join(pbDir, f));
  if (text) loaded.push(`### .claude/playbooks/${f}\n\n${text.trim()}`);
}

if (missing.length) {
  parts.push(
    `LENSES/PLAYBOOKS: could not read ${missing.join(', ')}. The encoded expertise is NOT loaded ` +
      'this session — say so rather than working as though it were.'
  );
}

if (loaded.length) {
  parts.push(
    '## Lenses and playbooks (injected at session start)\n\n' +
      'Domain lenses are how work is produced; review lenses are how it is judged; playbooks declare the ' +
      'stages a category of work passes and the claims required to exit each — never the method. These are ' +
      'the canonical copies; do not restate them from memory.\n\n' +
      loaded.join('\n\n')
  );
}

const context = parts.join('\n\n');
if (!context) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  })
);
