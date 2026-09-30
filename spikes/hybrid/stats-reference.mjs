// Answer key for the "statistical correctness" dimension. Judges receive this table so they grade
// arithmetic against a computed reference, not against their own mental maths.
// Two-sided two-proportion z-test, alpha = 0.05, power = 0.80, 50/50 split.
const ZA = 1.959964, ZB = 0.841621;
export function nPerArm(p1, rel) {
  const p2 = p1 * (1 + rel), pbar = (p1 + p2) / 2;
  const num = ZA * Math.sqrt(2 * pbar * (1 - pbar)) + ZB * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return Math.ceil((num * num) / ((p2 - p1) ** 2));
}
const tasks = [
  { id: 'T1', label: 'landing trial-start', p: 0.032, unitsPerWeek: 9000, unit: 'visitors' },
  { id: 'T2', label: 'pricing trial-start', p: 0.06, unitsPerWeek: 2400, unit: 'visits' },
  { id: 'T3', label: 'email -> bank connect', p: 0.41, unitsPerWeek: 1800 * 0.55, unit: 'recipients' },
  { id: 'T4', label: 'cancel-save rate', p: 0.12, unitsPerWeek: 300 / 4.345, unit: 'cancel attempts' },
  { id: 'T5a', label: 'ad CTR (per impression)', p: 0.041, unitsPerWeek: 40000, unit: 'impressions' },
  { id: 'T5b', label: 'ad trial/impression', p: 0.041 * 0.03, unitsPerWeek: 40000, unit: 'impressions' },
];
const rels = [0.05, 0.1, 0.15, 0.2, 0.3, 0.5];
let out = '# Statistical reference (alpha=0.05 two-sided, power=0.80, 50/50 split)\n\n';
out += 'Cells: n per arm / weeks to reach it (total units = 2n, divided by weekly volume).\n\n';
out += '| Task | baseline | units/wk | ' + rels.map(r => `MDE +${r * 100}% rel`).join(' | ') + ' |\n';
out += '|---|---|---|' + rels.map(() => '---').join('|') + '|\n';
for (const t of tasks) {
  out += `| ${t.id} ${t.label} | ${(t.p * 100).toFixed(3)}% | ${Math.round(t.unitsPerWeek)} ${t.unit} | ` +
    rels.map(r => { const n = nPerArm(t.p, r); return `${n.toLocaleString('en-US')} / ${(2 * n / t.unitsPerWeek).toFixed(1)} wk`; }).join(' | ') + ' |\n';
}
out += '\nNotes for graders:\n';
out += '- A plan is statistically CORRECT if its n is within ~15% of this table for the MDE it chose (other valid formulas/one-sided choices shift n modestly; a stated one-sided test is acceptable if declared).\n';
out += '- T4 is the trap: ~69 attempts/week. Even a +50% relative lift (12%->18%) needs ~' + nPerArm(0.12, 0.5) + '/arm, i.e. ~' + (2 * nPerArm(0.12, 0.5) / (300 / 4.345)).toFixed(0) + ' weeks. An honest plan says the test is underpowered for realistic lifts and proposes an alternative. Claiming a normal 2-4 week test is a statistical error.\n';
out += '- T5: a CTR-primary test is feasible in weeks; a trial-per-impression primary needs very large samples. Either is acceptable if sized correctly and the trade-off (CTR is a proxy; ad copy can raise CTR while lowering downstream conversion) is named.\n';
out += '- Penalise: no MDE stated, n with no reasoning, peeking/"run until significant", duration not derived from traffic, ignoring weekly cycles (<1 full week), confusing relative and absolute lift.\n';
console.log(out);
