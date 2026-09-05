# Challenge B · every figure and quote traces to evidence · sealed lane (plan + research only) · 2026-09-05

**Summary counts by class and severity**

| Class | Count |
|---|---|
| TRACED — same value present in a research file | ~120 distinct figures and quoted lines |
| DRIFTED — plan says X, research says Y | 1 (Routines "daily cap") |
| DRIFTED — plan contradicts itself | 3 |
| UNTRACED — in no research file, not marked UNVERIFIED | 18 claim clusters |
| PRESENTED-AS-VERIFIED, RESEARCH SAYS UNVERIFIED | 9 |
| Inherited from `final/FINAL-PLAN.md` via a `(FINAL)` tag | 7 clusters, listed separately in Part 7 |

| Severity | Count |
|---|---|
| P1 | 6 |
| P2 | 12 |
| P3 | 5 |

**The headline is that the price, quota, benchmark and licence-of-record work is genuinely clean.** Every figure in the model tables, the Codex quota grid, the ACE numbers, the Voyager numbers, the SKILL.md spec limits, the repository star counts and push dates, the retirement dates and the cost anchors reproduces exactly from the research files. No case where the plan quietly improved a number in its own favour. The `UNVERIFIED` marks that matter most are carried honestly and repeatedly: the Max 20x price, Fable on a subscription seat, Gemini's paid quotas, the `LICENSE-CONTENT` file, `-w`/`--tmux`, on-disk model sizes, and the absence of any vendor cost-per-task figure. Section 10.6 reproduces all ten of the runtimes lane's own gaps verbatim.

**The failures are concentrated in one place: claims about runtime capability and about licences of projects the surfaces lane did not fetch.** Those are the claims a builder would act on directly, which is why they carry P1.

The single sharpest finding is in §12.10. A parenthetical reads "(NEW: cognition.md prices per-action approval…)" and then states four percentages. `cognition.md` contains none of them. That is not a dropped caveat; it is an attribution to a named file that does not support it.

The second pattern: **six command-line flags and one vendor quotation appear nowhere in the research corpus** while the plan's own header rule says "Anything not in the inputs is marked UNVERIFIED". They are stated flat, and two of them are marked `D`.

Three internal contradictions on measured local facts: the installed Claude Code version, the count of verdict records, and the size of the event log.

Licences: the flowchart at §7.3 and §7.1's table are scrupulous. The licence problem is entirely in §14 and §17, where GitHub's SPDX detection is rendered as a bare "MIT" seven times, and §14.10 is the only place that carries the lane's own gap 1 about it.

## P1 findings, 1 of 2

**P1.1 — Four statistics attributed to `cognition.md`; the file contains none of them.** §12.10, plan lines 3512–3514: "(NEW: cognition.md prices per-action approval…) Humans approve 97% of per-action prompts and catch 13.6% of disguised dangerous commands, decaying to 5% after fifty; the classifier catches 89%." Research: none of the four figures in any of the seven files. Load-bearing: the stated reason every run uses `dontAsk`. *[Orchestrator note for the fix round: the four figures are FINAL §9.7's, measured by the round-5 providers lane; the defect is the attribution tag, which must read (FINAL §9.7), not (NEW: cognition.md).]*

**P1.2 — `requirements.toml` "outranks every flag", marked `D`, is neither documented nor quoted in this session's research.** §8.6, §10.1, §10.5, §15.6, §15.8. `runtimes.md:45` and gap 8: "Not re-read this session… I added nothing." The only "outranks" in the corpus is about Anthropic's managed settings. Asserted in bold in four places as the reason a single launcher must absorb the policy layer. *[Orchestrator note: inherited from FINAL §14.6's providers-lane row (D, 2026-09-04); the fix is to tag it (FINAL §14.6, providers lane 2026-09-04, not re-read) rather than `D` of this session.]*

**P1.3 — A sandbox `network` block and `credentials` block, with four named keys, absent from research and contradicted by the plan's own §18.4.** §12.10 lines 3500–3504 present six configuration keys under "(FINAL, v34.) Every line here is a measurement"; §18.4 line 5659 records "no `network` key" with the blocks "added" in the fate column. *[Orchestrator note: both are true of different objects — FINAL §9.7 measured that the runtime's sandbox schema HAS the blocks; §18.4 measures that this repo's settings.json does NOT USE them. The fix is to say both in one sentence and tag the schema fact (FINAL §9.7).]*
