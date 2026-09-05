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
