// Generation phase: identity × model × task (+ replicates on T1, T4).
// usage: node generate.mjs [label-filter-regex]
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, launch, pool } from './lib.mjs';

const tasks = JSON.parse(readFileSync(join(ROOT, 'tasks/tasks.json'), 'utf8'));
const corpus = readFileSync(join(ROOT, 'corpus/customer-quotes.md'), 'utf8');
const ids = ['classic', 'hybrid'].map((k) => JSON.parse(readFileSync(join(ROOT, `identities/${k}.json`), 'utf8')));
const models = [{ worker: 'claude', model: 'claude-sonnet-5' }, { worker: 'codex', model: 'gpt-6-astra' }];
const REPLICATE = new Set(['T1', 'T4']);
const filter = process.argv[2] ? new RegExp(process.argv[2]) : null;

const FORMAT = `Return your answer in exactly this Markdown structure and nothing else:

## COPY
(the requested copy elements, each labelled)

## TEST PLAN
(the requested test plan)

## RATIONALE
(optional, max 150 words)

Do not mention your own job title or role anywhere. Do not ask questions; make reasonable assumptions and state them.`;

function userPrompt(task) {
  return `You are working for the venture described below. Everything you need is here.\n\n${corpus}\n\n---\n\n# Task ${task.id}\n\n${task.brief}\n\n---\n\n${FORMAT}\n`;
}

const jobs = [];
for (const t of tasks) for (const id of ids) for (const m of models) for (const rep of REPLICATE.has(t.id) ? [1, 2] : [1]) {
  const label = `${t.id}_${id.kind}_${m.worker}_r${rep}`;
  if (filter && !filter.test(label)) continue;
  const outFile = join(ROOT, 'outputs', `${label}.md`);
  if (existsSync(outFile)) continue; // never relaunch a completed arm
  jobs.push(() => launch({ phase: 'gen', label, ...m, system: id.system_prompt, prompt: userPrompt(t), outFile }));
}
console.log(`launching ${jobs.length} generation jobs`);
await pool(jobs, 6);
