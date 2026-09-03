#!/usr/bin/env node
// Inter-persona distinctness — the test /board-meeting's own spec proposes (fail the roster below 40%).
// Mechanical: trigram Jaccard over each persona's position text. Measures the DESCRIPTIONS, not the ideas,
// and says so. Usage: node distinctness.mjs r1   (or r2)
import { readFileSync, readdirSync } from 'node:fs';
const round = process.argv[2] || 'r1';
const files = readdirSync('.').filter(f => f.startsWith(round + '-') && f.endsWith('.json'));
if (files.length < 2) { console.log(`REFUSED: ${files.length} ${round} json files — need ≥2`); process.exit(2); }
const text = f => { const j = JSON.parse(readFileSync(f, 'utf8'));
  return [j.thesis, ...(j.positions||j.updated_positions||[]).map(p => `${p.claim} ${p.reasoning}`)].join(' ')
    .toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' '); };
const grams = s => { const g = new Set(); for (let i=0;i+3<=s.length;i++) g.add(s.slice(i,i+3)); return g; };
const J = (a,b) => { let i=0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); };
const P = files.map(f => ({ name: f.replace(`${round}-`,'').replace('.json',''), g: grams(text(f)) }));
let rows = [], total = 0, n = 0;
for (let a=0;a<P.length;a++) for (let b=a+1;b<P.length;b++) {
  const sim = J(P[a].g, P[b].g); const dist = 1 - sim; total += dist; n++;
  rows.push(`${P[a].name.padEnd(14)} × ${P[b].name.padEnd(14)} distinct ${(dist*100).toFixed(1)}%`);
}
console.log(rows.join('\n'));
const mean = total / n;
console.log(`\nmean pairwise distinctness: ${(mean*100).toFixed(1)}%  (threshold 40% · ${P.length} personas · ${n} pairs)`);
console.log(mean >= 0.40 ? 'ROSTER PASSES' : 'ROSTER FAILS — below the spec threshold; revisit before Round 2');
console.log('\ncaveat: trigram Jaccard measures wording, not ideas. Two personas saying one thing in different words pass; agreement in different vocabulary is invisible to this test.');
