// scripts/lib/usage.js — what has actually been spent, measured rather than guessed.
//
// WHY THIS EXISTS (Phase 6, 2026-08-12)
//
// The Phase 6 gate asked for "a ceiling that fires before dispatch". Measured first:
// 0 of one 414M-token session's usage passed through `Task` — 1,314 assistant turns and
// not one subagent. A dispatch-gated budget would never have fired. So the ceiling guards
// every tool call, and the founder's amendment is recorded in DECISIONS.md.
//
// WHAT IS COUNTED, AND WHY IT IS OUTPUT TOKENS
//
// Claude Code's own bridge file (`/tmp/claude-ctx-<session>.json`) carries only
// `remaining_percentage` — a WINDOW figure that RESETS ON COMPACTION. A budget built on it
// would zero its own counter at exactly the moment a run got long. The session transcripts
// under ~/.claude/projects carry per-turn `usage`, which is cumulative and survives
// compaction, so that is the source.
//
// Output tokens specifically: cache reads were 73% of a measured session's cost but they
// measure how much context is being re-read, not how much work is being produced. A loop
// produces output. That is the thing to cap.
//
// THE WINDOW IS ACCOUNT-WIDE. On a subscription the real constraint is the rolling 5-hour
// usage window, not a per-session total, so this sums across EVERY project's transcripts.
// Measured baseline across 99 transcripts / 16,900 turns: peak 1,961,285 output tokens in
// any rolling 5h window. That is a normal heavy day, and it is what the defaults key off.
//
// SPEED IS A CORRECTNESS PROPERTY HERE. `pre-tool-use.sh` documents a <200ms budget because
// it runs on every single tool call. Re-reading ~9MB × 99 files per call would make the
// session unusable, so this reads incrementally: the cache holds each file's size and the
// turns still inside the window, and only bytes APPENDED since the last read are parsed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HOUR = 3600 * 1000;
const WINDOW_HOURS = 5;
// Keep slightly more than the window so a cache entry stays valid as the window slides.
const RETAIN_HOURS = 6;

// Both are env-overridable so the guard can be tested against a constructed transcript set
// rather than against whatever this machine happens to have done today. A test that depends
// on real usage passes or fails for reasons the test did not choose.
const projectsDir = () => process.env.AGENTVIBE_PROJECTS_DIR || path.join(os.homedir(), '.claude', 'projects');
const cachePath = () => process.env.AGENTVIBE_USAGE_CACHE || path.join(os.homedir(), '.agentvibe', 'usage-cache.json');

function listTranscripts(root) {
  const out = [];
  const walk = (d) => {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.jsonl')) out.push(p);
    }
  };
  walk(root);
  return out;
}

// Parse only the lines that carry usage. A string test before JSON.parse is what keeps this
// fast on multi-megabyte transcripts; parsing every line would dominate the time budget.
function turnsFrom(text) {
  const turns = [];
  for (const line of text.split('\n')) {
    if (!line || line.indexOf('"output_tokens"') === -1) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const u = o.message && o.message.usage;
    if (!u || !o.timestamp) continue;
    const t = Date.parse(o.timestamp);
    if (Number.isNaN(t)) continue;
    turns.push({ t, out: u.output_tokens || 0, side: o.isSidechain ? 1 : 0 });
  }
  return turns;
}

function loadCache(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return { files: {} }; }
}

function saveCache(p, cache) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(cache));
  } catch { /* a cache that cannot be written costs speed, never correctness */ }
}

// Every turn inside the retention horizon, across every project.
//
// Returns { turns, filesScanned, bytesRead } — bytesRead is reported so the "is this fast
// enough" question is answerable with a number rather than an impression.
function recentTurns(opts = {}) {
  const now = opts.now || Date.now();
  const root = opts.projectsDir || projectsDir();
  const cacheFile = opts.cachePath || cachePath();
  const horizon = now - RETAIN_HOURS * HOUR;

  const cache = opts.noCache ? { files: {} } : loadCache(cacheFile);
  const nextFiles = {};
  const turns = [];
  let bytesRead = 0;
  const files = listTranscripts(root);

  for (const f of files) {
    let st;
    try { st = fs.statSync(f); } catch { continue; }

    // THE OPTIMISATION THAT MAKES THIS USABLE AT ALL, and it rests on one property:
    // transcripts are APPEND-ONLY, so a file not modified inside the horizon cannot hold a
    // turn inside the horizon. Stat it, skip it, never open it.
    //
    // Measured before this branch existed: 2,005 transcripts, 2.8GB, ~9 SECONDS per call —
    // against the <200ms that pre-tool-use.sh documents for a hook firing on every tool
    // call. The first version cached only files with recent turns, so the ~2,000 dormant
    // ones were re-read in full every single time and the cache bought nothing (8.3s warm).
    if (st.mtimeMs < horizon) continue;

    const prev = cache.files[f];

    // A file untouched since the last read contributes exactly what it contributed then.
    // Truncation or rotation (size went DOWN) invalidates the offset, so re-read in full.
    let entry;
    if (prev && prev.size <= st.size && prev.mtimeMs === st.mtimeMs) {
      entry = { size: prev.size, mtimeMs: prev.mtimeMs, turns: prev.turns };
    } else if (prev && prev.size <= st.size) {
      // Appended: parse only the new bytes. A partial trailing line is simply skipped by
      // turnsFrom (JSON.parse fails) and will be re-read next time, when it is complete.
      let chunk = '';
      try {
        const fd = fs.openSync(f, 'r');
        const len = st.size - prev.size;
        const buf = Buffer.alloc(len);
        fs.readSync(fd, buf, 0, len, prev.size);
        fs.closeSync(fd);
        chunk = buf.toString('utf8');
        bytesRead += len;
      } catch { chunk = ''; }
      entry = { size: st.size, mtimeMs: st.mtimeMs, turns: [...prev.turns, ...turnsFrom(chunk)] };
    } else {
      let text = '';
      try { text = fs.readFileSync(f, 'utf8'); bytesRead += st.size; } catch { text = ''; }
      entry = { size: st.size, mtimeMs: st.mtimeMs, turns: turnsFrom(text) };
    }

    entry.turns = entry.turns.filter((x) => x.t >= horizon);
    if (entry.turns.length || st.mtimeMs >= horizon) nextFiles[f] = entry;
    turns.push(...entry.turns);
  }

  if (!opts.noCache) saveCache(cacheFile, { files: nextFiles, computed_at: now });
  turns.sort((a, b) => a.t - b.t);
  return { turns, filesScanned: files.length, bytesRead };
}

// Output tokens inside the rolling window ending now.
function windowUsage(opts = {}) {
  const now = opts.now || Date.now();
  const hours = opts.windowHours || WINDOW_HOURS;
  const { turns, filesScanned, bytesRead } = recentTurns(opts);
  const from = now - hours * HOUR;
  let output = 0;
  let subagent = 0;
  for (const t of turns) {
    if (t.t < from) continue;
    output += t.out;
    if (t.side) subagent += t.out;
  }
  return { output_tokens: output, subagent_output_tokens: subagent, window_hours: hours, now, filesScanned, bytesRead };
}

// The most recent durable artifact: something that survives the session.
//
// A commit, a claim event, or a session file. NOT "the agent said it was done" — the whole
// point is that this is checkable from disk without trusting a self-report.
function lastArtifactAt(opts = {}) {
  const repo = opts.repoRoot || process.cwd();
  const candidates = [];

  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI'], { cwd: repo, encoding: 'utf8', timeout: 3000 }).trim();
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) candidates.push({ t, kind: 'commit' });
  } catch { /* not a repo, or no commits yet */ }

  // The event log, read for CLAIM events specifically — never for its mtime.
  //
  // Using mtime here was a self-referential bug found by testing the stall path: the budget
  // guard APPENDS to this same file, so every budget log line — including a mere warning —
  // looked like a freshly produced artifact and reset the stall clock. The guard would have
  // zeroed the counter it exists to measure, and the stall ceiling could never fire once
  // logging began. A budget event is not a durable artifact; a claim is.
  const ev = opts.eventsPath;
  if (ev && fs.existsSync(ev)) {
    try {
      // Only the tail is needed and the file grows without bound, so read at most 256KB.
      const st = fs.statSync(ev);
      const start = Math.max(0, st.size - 256 * 1024);
      const fd = fs.openSync(ev, 'r');
      const buf = Buffer.alloc(st.size - start);
      fs.readSync(fd, buf, 0, buf.length, start);
      fs.closeSync(fd);
      const lines = buf.toString('utf8').split('\n').filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        let o;
        try { o = JSON.parse(lines[i]); } catch { continue; }
        if (!o.event || !String(o.event).startsWith('claim.')) continue;
        const t = Number(o.ts) * 1000;
        if (!Number.isNaN(t) && t > 0) { candidates.push({ t, kind: 'claim-event' }); }
        break;
      }
    } catch { /* unreadable log is not an artifact */ }
  }

  const sessDir = path.join(repo, 'docs', '08-agents_work', 'sessions');
  try {
    let newest = 0;
    for (const f of fs.readdirSync(sessDir)) {
      if (!f.endsWith('.md')) continue;
      const m = fs.statSync(path.join(sessDir, f)).mtimeMs;
      if (m > newest) newest = m;
    }
    if (newest) candidates.push({ t: newest, kind: 'session-file' });
  } catch { /* directory may not exist */ }

  if (!candidates.length) return null;
  return candidates.reduce((a, b) => (b.t > a.t ? b : a));
}

// Output tokens produced since the last durable artifact.
//
// Returns { output_tokens, since, kind } or null when no artifact reference exists at all —
// null is "unknown", and the caller must not render it as zero.
function sinceLastArtifact(opts = {}) {
  const artifact = lastArtifactAt(opts);
  if (!artifact) return null;
  const { turns } = recentTurns(opts);
  let output = 0;
  for (const t of turns) if (t.t >= artifact.t) output += t.out;
  return { output_tokens: output, since: artifact.t, kind: artifact.kind };
}

module.exports = {
  WINDOW_HOURS,
  RETAIN_HOURS,
  projectsDir,
  cachePath,
  listTranscripts,
  turnsFrom,
  recentTurns,
  windowUsage,
  lastArtifactAt,
  sinceLastArtifact,
};
