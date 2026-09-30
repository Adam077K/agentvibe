// Worker launch + logging. Every launch appends one CSV row to logs/launches.csv.
import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = dirname(fileURLToPath(import.meta.url));
export const LOG = join(ROOT, 'logs', 'launches.csv');
export const EMPTY = process.env.SPIKE_EMPTY_DIR || join(ROOT, '.empty');
mkdirSync(EMPTY, { recursive: true });
if (!existsSync(LOG)) writeFileSync(LOG, 'ts,phase,label,worker,model,seconds,cost_usd,exit,out_bytes\n');

function run(cmd, args, { input, cwd }) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, out, err }));
    p.on('error', (e) => resolve({ code: -1, out, err: String(e) }));
    if (input) p.stdin.write(input);
    p.stdin.end();
  });
}

export async function launch({ phase, label, worker, model, system, prompt, outFile }) {
  const t0 = Date.now();
  let text = '', cost = '', code;
  if (worker === 'claude') {
    const args = ['-p', '--model', model, '--tools', '', '--no-session-persistence', '--output-format', 'json'];
    if (system) args.push('--system-prompt', system);
    const r = await run('claude', args, { input: prompt, cwd: EMPTY });
    code = r.code;
    try { const j = JSON.parse(r.out); text = j.result || ''; cost = j.total_cost_usd ?? ''; if (j.is_error) code = code || 1; }
    catch { text = ''; code = code || 2; writeFileSync(outFile + '.err', r.out + '\n' + r.err); }
  } else {
    const full = system ? `# Your identity (act as this throughout)\n\n${system}\n\n---\n\n${prompt}` : prompt;
    const r = await run('codex', ['exec', '--skip-git-repo-check', '-s', 'read-only', '-m', model, '-C', EMPTY, '-o', outFile, full], { cwd: EMPTY });
    code = r.code;
    text = existsSync(outFile) ? readFileSync(outFile, 'utf8') : '';
    if (code !== 0) writeFileSync(outFile + '.err', r.err.slice(-4000));
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (text) writeFileSync(outFile, text);
  appendFileSync(LOG, `${new Date().toISOString()},${phase},${label},${worker},${model},${secs},${cost},${code},${text.length}\n`);
  console.log(`[${phase}] ${label} ${worker}/${model} ${secs}s cost=${cost} exit=${code} bytes=${text.length}`);
  return { code, text, cost };
}

export async function pool(jobs, n) {
  const res = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < jobs.length) { const k = i++; res[k] = await jobs[k](); } }));
  return res;
}
