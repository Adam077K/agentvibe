#!/usr/bin/env node
// POSTURE: BLOCKS — exit 2 denies the tool call. Second mechanism in this repo that can
// stop an action, after pre-tool-use.sh.
//
// IT FAILS OPEN ON ERROR, DELIBERATELY AND LOUDLY. If the measurement itself breaks, the
// call proceeds and the reason goes to stderr. A budget that bricks a session when its own
// arithmetic throws costs more than the overspend it prevents. That is a real fail-open and
// it is named here rather than discovered later — the shape this repo has been burned by
// (`catch { LIVE_SKILLS = null }`) is a silent one, not an announced one.
//
// WHAT IT GUARDS, AND WHY NOT "DISPATCH"
//
// The Phase 6 gate said the ceiling must fire "before dispatch". Measured: 0 of a 414M-token
// session's usage passed through `Task` — 1,314 turns, not one subagent. A dispatch-gated
// budget would never have fired once. It guards every tool call instead; the amendment and
// its measurement are in DECISIONS.md rather than applied quietly.
//
// TWO CEILINGS, BOTH IN OUTPUT TOKENS
//
//   1. WINDOW — the rolling 5-hour usage window, account-wide across every project, because
//      that is the real subscription constraint. Measured baseline across 99 transcripts and
//      16,900 turns: peak 1,961,285 output tokens in any rolling 5h window, which is a
//      normal heavy day. Warn at 2M, block at 3M (1.5x observed peak).
//
//   2. STALL — output tokens since the last durable artifact: a commit, a claim event, or a
//      session file. Stop condition 3 is "a run burns >200k tokens and returns no structured
//      output, after the stall envelope ships". This is that envelope. Warn at 200k, block at
//      400k. Artifacts are read from disk, never from the agent's own report that it is done.
//
// THE SAFELIST IS LOAD-BEARING. A blanket exit 2 would block `git commit`, so a session that
// hit the ceiling could not save its work, could not write its session file, and would fail
// the documentation gate for a reason the work did not cause. The budget would then create
// exactly the loss it exists to prevent. Landing work is always allowed.
//
// THE OVERRIDE IS THE DISPOSITION PATTERN, APPLIED TO SPEND. AGENTVIBE_BUDGET_OVERRIDE must
// carry a reason; it is appended to events.jsonl with the numbers at the moment it was used.
// You may waive, but the waiver is dated and attributable, and overriding silently is
// impossible.

const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');

const WINDOW_WARN = Number(process.env.AGENTVIBE_WINDOW_WARN || 2_000_000);
const WINDOW_BLOCK = Number(process.env.AGENTVIBE_WINDOW_BLOCK || 3_000_000);
const STALL_WARN = Number(process.env.AGENTVIBE_STALL_WARN || 200_000);
const STALL_BLOCK = Number(process.env.AGENTVIBE_STALL_BLOCK || 400_000);
const DEBOUNCE_CALLS = 5;

const out = (s) => process.stderr.write(s + '\n');
const fmt = (n) => n.toLocaleString();

// ── event log (same resolution rule as ledger.mjs) ──────────────────────────
function eventsPath() {
  if (process.env.WARROOM_EVENTS) return process.env.WARROOM_EVENTS;
  try {
    const cfg = fs.readFileSync(path.join(REPO, '.warroom.yml'), 'utf8');
    const s = /^\s*state_dir:\s*(\S+)/m.exec(cfg);
    if (s) return path.join(s[1].replace(/^~/, os.homedir()), 'events.jsonl');
    const m = /^\s*session:\s*(\S+)/m.exec(cfg);
    if (m) return path.join(os.homedir(), `.${m[1]}`, 'events.jsonl');
  } catch { /* fall through */ }
  return path.join(REPO, '.ledger-events.jsonl');
}

function logEvent(obj) {
  try {
    const p = eventsPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, JSON.stringify({ ts: Math.floor(Date.now() / 1000), ...obj }) + '\n');
  } catch { /* never let logging break the call */ }
}

// ── the safelist: whatever is needed to LAND work ───────────────────────────
//
// Deliberately narrow. Read-only git and the commit/push path, the session file the
// documentation gate requires, and the verification command that gates a push. Everything
// else is new work and is what the ceiling is for.
function isSafelisted(toolName, input) {
  if (toolName === 'Bash') {
    const cmd = String((input && input.command) || '');
    if (/^\s*git\s+(add|commit|push|status|log|diff|branch|rev-parse|show|stash)\b/.test(cmd)) return 'git';
    if (/^\s*npm\s+run\s+(check|test)/.test(cmd)) return 'verification';
    if (/^\s*(gh\s+pr\s+(create|view|checks)|node\s+scripts\/ledger\.mjs)\b/.test(cmd)) return 'landing';
  }
  if (toolName === 'Write' || toolName === 'Edit' || toolName === 'NotebookEdit') {
    const f = String((input && input.file_path) || '');
    if (f.includes('docs/08-agents_work/sessions/')) return 'session-file';
    if (f.endsWith('DECISIONS.md')) return 'decision-record';
  }
  return null;
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

// ── debounce, so a warning does not repeat on every call ────────────────────
function shouldWarn(sessionId, level) {
  const p = path.join(os.tmpdir(), `agentvibe-budget-${sessionId || 'nosession'}.json`);
  let st = { n: 0, level: null };
  try { st = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { /* first call */ }
  st.n = (st.n || 0) + 1;
  const escalated = st.level !== level;
  const fire = escalated || st.n >= DEBOUNCE_CALLS;
  if (fire) { st.n = 0; st.level = level; }
  try { fs.writeFileSync(p, JSON.stringify(st)); } catch { /* ignore */ }
  return fire;
}

function main() {
  let payload = {};
  try { payload = JSON.parse(readStdin() || '{}'); } catch { payload = {}; }
  const toolName = payload.tool_name || '';
  const input = payload.tool_input || {};
  const sessionId = payload.session_id || '';

  const usage = require(path.join(REPO, 'scripts', 'lib', 'usage.js'));
  const win = usage.windowUsage({});
  const stall = usage.sinceLastArtifact({ repoRoot: REPO, eventsPath: eventsPath() });

  const windowOver = win.output_tokens >= WINDOW_BLOCK;
  const stallOver = stall && stall.output_tokens >= STALL_BLOCK;

  if (!windowOver && !stallOver) {
    const windowWarn = win.output_tokens >= WINDOW_WARN;
    const stallWarn = stall && stall.output_tokens >= STALL_WARN;
    if (windowWarn || stallWarn) {
      const level = windowWarn ? 'window' : 'stall';
      if (shouldWarn(sessionId, level)) {
        if (windowWarn) {
          out(
            `BUDGET WARNING: ${fmt(win.output_tokens)} output tokens in the rolling ${win.window_hours}h window ` +
              `(warn ${fmt(WINDOW_WARN)}, block ${fmt(WINDOW_BLOCK)}). Land what you have.`
          );
        }
        if (stallWarn) {
          const mins = Math.round((Date.now() - stall.since) / 60000);
          out(
            `STALL WARNING: ${fmt(stall.output_tokens)} output tokens since the last ${stall.kind} ` +
              `(${mins}m ago; warn ${fmt(STALL_WARN)}, block ${fmt(STALL_BLOCK)}). Produce something durable — ` +
              'a commit, a claim, or a session file — rather than continuing to loop.'
          );
        }
      }
    }
    process.exit(0);
  }

  // ── at a ceiling ──
  const reason = windowOver
    ? `rolling ${win.window_hours}h window at ${fmt(win.output_tokens)} output tokens (ceiling ${fmt(WINDOW_BLOCK)})`
    : `${fmt(stall.output_tokens)} output tokens since the last ${stall.kind} (ceiling ${fmt(STALL_BLOCK)})`;

  const safe = isSafelisted(toolName, input);
  if (safe) {
    logEvent({ event: 'budget.allowed_safelisted', kind: windowOver ? 'window' : 'stall', safelist: safe, tool: toolName, window_output: win.output_tokens, stall_output: stall ? stall.output_tokens : null });
    out(`BUDGET: at the ceiling (${reason}) — allowing this ${safe} call so work can be landed. New work is blocked.`);
    process.exit(0);
  }

  const override = process.env.AGENTVIBE_BUDGET_OVERRIDE;
  if (override) {
    logEvent({ event: 'budget.override', kind: windowOver ? 'window' : 'stall', reason_given: String(override), tool: toolName, window_output: win.output_tokens, stall_output: stall ? stall.output_tokens : null });
    out(`BUDGET OVERRIDE in force — "${override}". Recorded to the event log with the numbers at this moment.`);
    process.exit(0);
  }

  logEvent({ event: 'budget.block', kind: windowOver ? 'window' : 'stall', tool: toolName, window_output: win.output_tokens, stall_output: stall ? stall.output_tokens : null, reason });

  out('');
  out(`BUDGET CEILING REACHED — ${reason}.`);
  out('');
  if (windowOver) {
    out('  The rolling 5-hour window is the real subscription constraint. Measured peak for a');
    out('  normal heavy day is ~1.96M output tokens; this ceiling is 1.5x that.');
  } else {
    out('  This is stop condition 3: a run burning tokens and returning no structured output.');
    out('  Escalating instead of continuing to loop.');
  }
  out('');
  out('  STILL ALLOWED, so nothing is lost: git add/commit/push, npm run check, writing a');
  out('  session file or DECISIONS.md, gh pr create. Land the work.');
  out('');
  out('  To continue anyway, set a reason — it is recorded, not silent:');
  out('    AGENTVIBE_BUDGET_OVERRIDE="why this is worth continuing"');
  out('');
  process.exit(2);
}

try {
  main();
} catch (e) {
  // Announced fail-open. See the POSTURE note at the top: a broken budget must not brick a
  // session, but it must never be quiet about having stopped guarding.
  out(`BUDGET GUARD FAILED OPEN: ${e && e.message}. The call proceeded UNGUARDED — spend is not being checked.`);
  process.exit(0);
}
