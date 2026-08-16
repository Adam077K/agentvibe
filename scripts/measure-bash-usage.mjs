#!/usr/bin/env node
// POSTURE: REPORTS. Read-only measurement. Gates nothing.
//
// scripts/measure-bash-usage.mjs — which commands agents actually run, and which would prompt.
//
// WHY THIS EXISTS
// The decision to remove `--dangerously-skip-permissions` from `bin/warroom` rested on a
// measurement — "11,342 Bash calls across 400 recent transcripts, 8,603 already matched the
// allow list" — and that number was quoted in five files while **nothing could reproduce it**.
// An independent auditor of PR #47 flagged it as unverifiable, and was right: an unfalsifiable
// figure justifying a permission change is the same failure mode as an unenforced rule. It
// looks like evidence and cannot be checked.
//
// This is the script. Re-run it and the number moves with the corpus, which is the point.
//
// METHOD, STATED BECAUSE IT CHANGES THE ANSWER
// A first pass tokenised every `&&`-separated segment and reported "47% would prompt". It was
// counting heredoc bodies and quoted code — `const`, `console.log`, `import` all appeared as
// "commands". That number was discarded, not published. This resolves the FIRST token of each
// command, after stripping leading `VAR=value` assignments and `cd X &&` wrappers, and reports
// what it could not resolve rather than dropping it.
//
// The allow list is read from `.claude/settings.json`, so the comparison tracks the real
// permission model instead of a copy that can drift from it.
//
// USAGE
//   node scripts/measure-bash-usage.mjs             # summary
//   node scripts/measure-bash-usage.mjs --json
//   node scripts/measure-bash-usage.mjs --limit 400 # newest N transcripts (default 400)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const asJson = process.argv.includes('--json');
const li = process.argv.indexOf('--limit');
const LIMIT = li !== -1 && process.argv[li + 1] ? parseInt(process.argv[li + 1], 10) : 400;
const ROOT = process.env.AGENTVIBE_PROJECTS_DIR || path.join(os.homedir(), '.claude', 'projects');

if (!fs.existsSync(ROOT)) {
  console.error(`No transcript directory at ${ROOT}. Set AGENTVIBE_PROJECTS_DIR.`);
  process.exit(1);
}

// The allow list, from the real settings file.
const settings = JSON.parse(fs.readFileSync(path.join(REPO, '.claude', 'settings.json'), 'utf8'));
const allowPrefixes = settings.permissions.allow
  .map((a) => (a.match(/^Bash\((.+?)(?: \*)?\)$/) || [])[1])
  .filter(Boolean);

const walk = (d, out = []) => {
  let ents;
  try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.jsonl')) out.push(p);
  }
  return out;
};

const files = walk(ROOT)
  .map((f) => { try { return { f, m: fs.statSync(f).mtimeMs }; } catch { return null; } })
  .filter(Boolean)
  .sort((a, b) => b.m - a.m)
  .slice(0, LIMIT)
  .map((x) => x.f);

// Resolve the command that actually runs: strip `VAR=v` assignments, `cd X &&` wrappers and
// subshell parens, then take the first token.
function headCommand(cmd) {
  let s = cmd.trim();
  for (let i = 0; i < 6; i++) {
    s = s.trim();
    let m = s.match(/^cd\s+\S+\s*(?:&&|;)\s*/);
    if (m) { s = s.slice(m[0].length); continue; }
    m = s.match(/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/);
    if (m) { s = s.slice(m[0].length); continue; }
    m = s.match(/^\(\s*/);
    if (m) { s = s.slice(m[0].length); continue; }
    break;
  }
  const m = s.match(/([A-Za-z0-9_./-]+)/);
  return m ? m[1].split('/').pop() : null;
}

const KEYWORDS = new Set(['for', 'do', 'done', 'if', 'then', 'fi', 'while', 'case', 'esac',
  'export', 'set', 'source', 'trap', 'read', 'local', 'function', 'cd', 'echo']);

const counts = Object.create(null);
let calls = 0, unresolved = 0;

for (const f of files) {
  let text;
  try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  for (const line of text.split('\n')) {
    if (line.indexOf('"Bash"') === -1) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    for (const c of (o.message && o.message.content) || []) {
      if (!c || c.type !== 'tool_use' || c.name !== 'Bash') continue;
      const cmd = (c.input && c.input.command) || '';
      if (!cmd.trim()) continue;
      calls++;
      const h = headCommand(cmd);
      if (!h) { unresolved++; continue; }
      counts[h] = (counts[h] || 0) + 1;
    }
  }
}

const allowed = (t) => allowPrefixes.some((p) => t === p || p.startsWith(t + ' ') || t === p.split(' ')[0]);

let covered = 0, keyword = 0;
const wouldPrompt = [];
for (const [t, n] of Object.entries(counts)) {
  if (allowed(t)) covered += n;
  else if (KEYWORDS.has(t)) keyword += n;
  else wouldPrompt.push([t, n]);
}
wouldPrompt.sort((a, b) => b[1] - a[1]);

const report = {
  corpus: { root: ROOT, transcripts: files.length, limit: LIMIT },
  bashCalls: calls,
  unresolved,
  coveredByAllowList: covered,
  keywordLed: keyword,
  wouldPrompt: Object.fromEntries(wouldPrompt.slice(0, 25)),
  wouldPromptTotal: wouldPrompt.reduce((a, [, n]) => a + n, 0),
};

if (asJson) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

console.log(`Corpus: ${files.length} newest transcripts under ${ROOT}`);
console.log(`Bash calls: ${calls}   (${unresolved} unresolved — counted, not dropped)`);
console.log(`Covered by the settings.json allow list: ${covered}`);
console.log(`Control-flow led (inner command not resolvable by this method): ${keyword}`);
console.log(`\nWould prompt today:`);
for (const [t, n] of wouldPrompt.slice(0, 20)) console.log(`  ${t.padEnd(16)} ${String(n).padStart(6)}`);
console.log(`\nTotal that would prompt: ${report.wouldPromptTotal}`);
console.log('\nNumbers move with the corpus. That is the point — a permission decision should');
console.log('rest on something re-runnable, not on a figure quoted from a session that ended.');
