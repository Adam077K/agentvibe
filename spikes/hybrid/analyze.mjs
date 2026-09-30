// Analysis exactly as pre-registered in PREREG.md. Writes results.json and prints a summary.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = new URL('.', import.meta.url).pathname;
const load = (n) => JSON.parse(readFileSync(join(ROOT, 'judging', `scores-${n}.json`), 'utf8'));
const DIMS = ['D1', 'D2', 'D3', 'D4'];
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const comp = (s) => mean(DIMS.map((d) => s[d]));

const PRIMARY = ['X-codex', 'X-claude', 'E-claude', 'E-codex'];
const byLabel = {}; // label -> [{run, D1..D4, comp}]
for (const run of PRIMARY) for (const s of load(run)) (byLabel[s.label] ||= []).push({ run, ...s, comp: comp(s) });
const itemScore = (l, f = 'comp') => mean(byLabel[l].map((s) => s[f]));

// Primary pairs
const pairs = [];
for (const t of ['T1', 'T2', 'T3', 'T4', 'T5']) for (const m of ['claude', 'codex']) {
  const h = `${t}_hybrid_${m}_r1`, c = `${t}_classic_${m}_r1`;
  const row = { task: t, model: m, hybrid: itemScore(h), classic: itemScore(c), diff: itemScore(h) - itemScore(c) };
  for (const d of DIMS) row['d' + d] = itemScore(h, d) - itemScore(c, d);
  pairs.push(row);
}
const diffs = pairs.map((p) => p.diff);
const delta = mean(diffs);
// bootstrap
let s = 42; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const boots = [];
for (let i = 0; i < 10000; i++) boots.push(mean(diffs.map(() => diffs[Math.floor(r() * diffs.length)])));
boots.sort((a, b) => a - b);
const ci = [boots[249], boots[9749]];
const dz = delta / sd(diffs);
// replicate noise
const reps = [];
for (const t of ['T1', 'T4']) for (const k of ['classic', 'hybrid']) for (const m of ['claude', 'codex']) {
  const a = itemScore(`${t}_${k}_${m}_r1`), b = itemScore(`${t}_${k}_${m}_r2`);
  reps.push({ arm: `${t}_${k}_${m}`, r1: a, r2: b, absdiff: Math.abs(a - b) });
}
const N = mean(reps.map((x) => x.absdiff));
// replicate-inclusive Δ (secondary): average r1/r2 where available
const repDelta = mean(['T1', 'T4'].flatMap((t) => ['claude', 'codex'].map((m) =>
  mean([1, 2].map((k) => itemScore(`${t}_hybrid_${m}_r${k}`))) - mean([1, 2].map((k) => itemScore(`${t}_classic_${m}_r${k}`))))));
// per family, per dim
const fam = Object.fromEntries(['claude', 'codex'].map((m) => [m, mean(pairs.filter((p) => p.model === m).map((p) => p.diff))]));
const dim = Object.fromEntries(DIMS.map((d) => [d, mean(pairs.map((p) => p['d' + d]))]));
const wins = diffs.filter((d) => d > 0).length;
// per-judge Δ
const perJudge = {};
for (const run of PRIMARY) {
  const sc = Object.fromEntries(load(run).map((x) => [x.label, comp(x)]));
  const ds = pairs.map((p) => { const h = sc[`${p.task}_hybrid_${p.model}_r1`], c = sc[`${p.task}_classic_${p.model}_r1`]; return h != null && c != null ? h - c : null; }).filter((x) => x != null);
  perJudge[run] = { n: ds.length, delta: mean(ds) };
}
// judge noise: same judge, re-shuffled
const judgeNoise = {};
for (const [a, b] of [['E-claude', 'E-claude-rep'], ['E-codex', 'E-codex-rep']]) {
  const A = Object.fromEntries(load(a).map((x) => [x.label, comp(x)])), B = Object.fromEntries(load(b).map((x) => [x.label, comp(x)]));
  const ls = Object.keys(A);
  judgeNoise[a] = { meanAbsItemDiff: mean(ls.map((l) => Math.abs(A[l] - B[l]))),
    deltaRep: mean(pairs.map((p) => B[`${p.task}_hybrid_${p.model}_r1`] - B[`${p.task}_classic_${p.model}_r1`])) };
}
// self-preference: extra judges' mean score by generating family
const selfPref = {};
for (const run of ['E-claude', 'E-codex']) {
  const L = load(run); selfPref[run] = Object.fromEntries(['claude', 'codex'].map((m) => [m, mean(L.filter((x) => x.label.includes(`_${m}_`)).map(comp))]));
}
// cross-family judge agreement: Claude-family extra vs Codex-family extra, Pearson on composite
const A = Object.fromEntries(load('E-claude').map((x) => [x.label, comp(x)])), B = Object.fromEntries(load('E-codex').map((x) => [x.label, comp(x)]));
const ls = Object.keys(A); const xa = ls.map((l) => A[l]), xb = ls.map((l) => B[l]);
const ma = mean(xa), mb = mean(xb);
const pearson = xa.reduce((s2, x, i) => s2 + (x - ma) * (xb[i] - mb), 0) / Math.sqrt(xa.reduce((s2, x) => s2 + (x - ma) ** 2, 0) * xb.reduce((s2, x) => s2 + (x - mb) ** 2, 0));

const crit = {
  'delta>=1.0': delta >= 1.0, 'ci_low>0': ci[0] > 0, 'delta>N': delta > N,
  'both_families>0': fam.claude > 0 && fam.codex > 0, 'D4>=0.5': dim.D4 >= 0.5,
};
let verdict;
if (ci[0] <= 0 || delta < 0.5 || delta <= N) verdict = 'FAIL';
else if (Object.values(crit).every(Boolean)) verdict = 'PASS';
else verdict = 'PARTIAL';
const out = { pairs, delta, ci, dz, N, reps, repDelta, fam, dim, wins, perJudge, judgeNoise, selfPref, pearson, crit, verdict };
writeFileSync(join(ROOT, 'results.json'), JSON.stringify(out, null, 2));
const f = (x) => (typeof x === 'number' ? x.toFixed(2) : x);
console.table(pairs.map((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, f(v)]))));
console.table(reps.map((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, f(v)]))));
console.log({ delta: f(delta), ci: ci.map(f), dz: f(dz), N: f(N), repDelta: f(repDelta), wins, fam, dim, perJudge, judgeNoise, selfPref, pearson: f(pearson), crit, verdict });
