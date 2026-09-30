// Blind judging. usage: node judge.mjs <run-name>   (runs: X-codex X-claude E-claude E-codex E-claude-rep E-codex-rep)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, launch } from './lib.mjs';

const RUNS = {
  'X-codex':      { worker: 'codex',  model: 'gpt-6-astra',     items: (l) => l.includes('_claude_'), seed: 11 },
  'X-claude':     { worker: 'claude', model: 'claude-opus-5',   items: (l) => l.includes('_codex_'),  seed: 12 },
  'E-claude':     { worker: 'claude', model: 'claude-sonnet-5', items: () => true, seed: 13 },
  'E-codex':      { worker: 'codex',  model: 'gpt-6-astra',     items: () => true, seed: 14 },
  'E-claude-rep': { worker: 'claude', model: 'claude-sonnet-5', items: () => true, seed: 23 },
  'E-codex-rep':  { worker: 'codex',  model: 'gpt-6-astra',     items: () => true, seed: 24 },
};

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Blinding: judges see COPY + TEST PLAN only; quote IDs and role titles are removed.
export function blind(md) {
  let t = md.split(/^##\s*RATIONALE/im)[0];
  t = t.replace(/\s*[\[(]\s*Q\d+(?:\s*[,/–-]\s*Q?\d+)*\s*[\])]/g, '')
       .replace(/\bQ\d+\b/g, '')
       .replace(/conversion (scientist|copywriter)/gi, '');
  return t.trim();
}

const name = process.argv[2];
const cfg = RUNS[name];
if (!cfg) { console.error('unknown run', name); process.exit(1); }
const r = rng(cfg.seed);
const tasks = JSON.parse(readFileSync(join(ROOT, 'tasks/tasks.json'), 'utf8'));
const labels = readdirSync(join(ROOT, 'outputs')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).filter(cfg.items);
const key = {};
let body = '';
for (const t of tasks) {
  const ls = shuffle(labels.filter((l) => l.startsWith(t.id + '_')), r);
  body += `\n\n# TASK ${t.id}\n\n**Brief given to every writer:** ${t.brief}\n`;
  for (const l of ls) {
    const id = 'I' + Math.floor(r() * 9000 + 1000);
    key[id] = l;
    body += `\n\n----- ITEM ${id} (task ${t.id}) -----\n\n${blind(readFileSync(join(ROOT, 'outputs', l + '.md'), 'utf8'))}\n`;
  }
}
writeFileSync(join(ROOT, 'judging', `key-${name}.json`), JSON.stringify(key, null, 2));

const prompt = `You are an expert, strict grader of conversion copy and A/B test plans. You are grading anonymous work
from several writers. You do not know who wrote which item; do not try to guess. Grade only what is on the page.

## The product and the customer corpus (all writers had exactly this)
${readFileSync(join(ROOT, 'corpus/customer-quotes.md'), 'utf8')}

## Rubric
${readFileSync(join(ROOT, 'judging/rubric.md'), 'utf8')}

## Statistical answer key (for D3)
${readFileSync(join(ROOT, 'judging/stats-reference.md'), 'utf8')}

## Items to grade (${Object.keys(key).length} items, grouped by task)
${body}

## Output
Return ONLY a JSON array, no prose, no code fence. One object per item, every item exactly once:
[{"id":"I1234","D1":7,"D2":6,"D3":8,"D4":6,"note":"<= 20 words: the main reason"}]
Use the full 1-10 range; differentiate items within a task.`;
writeFileSync(join(ROOT, 'judging', `prompt-${name}.md`), prompt);
const outFile = join(ROOT, 'judging', `scores-${name}.raw.txt`);
const res = await launch({ phase: 'judge', label: name, worker: cfg.worker, model: cfg.model, system: null, prompt, outFile });
const m = res.text.match(/\[[\s\S]*\]/);
const scores = m ? JSON.parse(m[0]) : [];
const missing = Object.keys(key).filter((id) => !scores.find((s) => s.id === id));
writeFileSync(join(ROOT, 'judging', `scores-${name}.json`), JSON.stringify(scores.map((s) => ({ ...s, label: key[s.id] })), null, 2));
console.log(`${name}: ${scores.length} scored, missing ${missing.length}`);
