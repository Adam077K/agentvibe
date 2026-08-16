#!/usr/bin/env node
// POSTURE: ADVISES — SessionStart cannot block, and this never tries to. It EMITS the lens
// and playbook data for the session, and warns when the ledger sweep has stopped.
//
// READ THE CORRECTION AT THE BOTTOM OF THIS BLOCK BEFORE TRUSTING THE WORD "INJECTS".
// Emitting is not the same as arriving, and for most of this file's life the difference
// was invisible because nothing measured it.
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
// ─── CORRECTED 2026-08-12, BY OBSERVATION FROM A FRESH SESSION ──────────────────────
//
// The block above used to say the loading was "mechanical rather than discretionary", and
// this block used to say the runtime's handling of hookSpecificOutput.additionalContext was
// unconfirmed. Half of that is now settled and the other half is worse than unconfirmed —
// it is disproved.
//
// SETTLED: Claude Code DOES honour additionalContext at SessionStart. The hook fires and
// its output is delivered. That was the one thing a fresh session was needed to see.
//
// DISPROVED: delivery is not inlining. This file emitted 25,613 bytes; 24,490 of them were
// persisted to a file under the session's tool-results directory and roughly 2KB of preview
// was inlined alongside the path. So an agent starting a session receives a POINTER, and
// must CHOOSE to open it — which is the definition of discretionary, the exact property
// this hook was built to remove.
//
// WHY IT WENT UNNOTICED FOR A PHASE: c-lenses-and-playbooks-are-loaded was verified by
// `node --test scripts/session-start.test.mjs`, which tests WHAT THIS FILE EMITS. Nothing
// tested what the session receives. Standing rule 3 — test the artifact a guard produces,
// not just the guard. The claim now also gates on payload size and FAILS until the fix
// lands; see docs/03-system-design/CLAIM-LEDGER.md.
//
// THE FIX IS A ROUTER, NOT A BIGGER DUMP. Emit lens ids plus one-line summaries and the
// pointer to .claude/skills/routers/INDEX.md — roughly 1.5KB, under the threshold — the
// same cure Phase 7 found when reading MANIFEST.json whole cost ~15,000 tokens a lookup.
// Until that ships, treat the cost note above as measuring bytes emitted, not bytes read.

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

// ── lenses and playbooks: compact router ─────────────────────────────────────
// The original approach dumped the full YAML files (~27KB total). The runtime inlines
// only ~2KB and persists the rest as a file pointer — so the full files never reached
// agent context. Fix (issue #56): emit a compact router (ids + one-line summaries +
// paths) that stays well under the 4,096 byte inline threshold. Full files are read
// on demand. See the correction block at the top of this file.

function parseIdSummaryRows(yaml, extraField) {
  const rows = [];
  const blocks = yaml.split(/\n  - id:\s+/);
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const id = (b.match(/^(\S+)/) || [])[1];
    const summary = (b.match(/\n {4}summary:\s+"([^"]+)"/) || [])[1] || '';
    let extra = '';
    if (extraField) {
      const m = b.match(new RegExp(`\n {4}${extraField}:\\s+(.+?)(?:\\n|$)`));
      if (m) extra = m[1].replace(/^\[|\]$/g, '').trim();
    }
    if (id) rows.push({ id, summary, extra });
  }
  return rows;
}

const missing = [];
const lensesYml = rd(path.join(REPO, '.claude/lenses.yml'));
const reviewYml = rd(path.join(REPO, '.claude/review-lenses.yml'));

if (!lensesYml) missing.push('.claude/lenses.yml');
if (!reviewYml) missing.push('.claude/review-lenses.yml');

const pbDir = path.join(REPO, '.claude', 'playbooks');
let pbNames = [];
try {
  pbNames = fs.readdirSync(pbDir).filter((f) => f.endsWith('.yml')).sort();
} catch {
  missing.push('.claude/playbooks/');
}

if (missing.length) {
  parts.push(
    `LENSES/PLAYBOOKS: could not read ${missing.join(', ')}. The encoded expertise is NOT available ` +
      'this session — say so rather than working as though it were.'
  );
}

const domainRows = lensesYml ? parseIdSummaryRows(lensesYml, 'applies_to') : [];
const reviewRows = reviewYml ? parseIdSummaryRows(reviewYml, 'scope') : [];

const pbRows = [];
for (const f of pbNames) {
  const text = rd(path.join(pbDir, f));
  if (!text) continue;
  const id = (text.match(/^playbook:\s+(\S+)/m) || [])[1] || f.replace('.yml', '');
  const summary = (text.match(/^summary:\s+"([^"]+)"/m) || [])[1] || '';
  pbRows.push({ id, filePath: `.claude/playbooks/${f}`, summary });
}

if (domainRows.length || reviewRows.length || pbRows.length) {
  const fmtTable = (rows, cols) => {
    const header = cols.join(' | ');
    const sep = cols.map(() => '---').join(' | ');
    return [header, sep, ...rows].join('\n');
  };

  const domainTable = fmtTable(
    domainRows.map((r) => `${r.id} | ${r.summary} | ${r.extra}`),
    ['id', 'summary', 'applies_to']
  );
  const reviewTable = fmtTable(
    reviewRows.map((r) => `${r.id} | ${r.summary} | ${r.extra}`),
    ['id', 'summary', 'scope']
  );
  const pbTable = fmtTable(
    pbRows.map((r) => `${r.id} | ${r.filePath} | ${r.summary}`),
    ['id', 'path', 'summary']
  );

  parts.push(
    '## Lenses and playbooks (session-start index)\n\n' +
      'Read the full file for any lens or playbook that applies to the current task — not before.\n\n' +
      `### Domain lenses (.claude/lenses.yml) — how to produce work\n\n${domainTable}\n\n` +
      `### Review lenses (.claude/review-lenses.yml) — how to judge work\n\n${reviewTable}\n\n` +
      `### Playbooks — staged exit criteria\n\n${pbTable}`
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
