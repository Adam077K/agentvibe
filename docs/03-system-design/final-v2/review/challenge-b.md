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

## P1 findings, 2 of 2

**P1.4 — Six command-line flags and one vendor quotation with no source anywhere in this session's corpus.** §6.5, §9.5, §12.10, §15.5, §17.5. `--restricted`'s three bolded properties (ignores user/project/local settings; confines file tools to working directories; refuses bypass) — only "removes the built-in tools… and WebFetch" is in runtimes.md:29. `--permission-prompts none`, `--strict-mcp-config`, `--exclude-dynamic-system-prompt-sections`, `--system-prompt-snapshot on` — in no research file. Quoted vendor line *"`/usage` reports the cache hit rate for the main conversation only"* — absent. P1 because the argv **is** the grant. *[Orchestrator note: every one of these is FINAL §7.5/§14.5/§14.6, measured by the round-5 providers lane (M, 2026-09-02/04); the defect is a missing (FINAL) tag, not an invention. Fix: tag them (FINAL §7.5, providers lane, measured 2026-09-04), and drop the word "quotable" where nothing is quoted.]*

**P1.5 — Three licences asserted with nothing.** §14.4, §14.3, §17.6, §20.1 row 12: Generative Agents `demo` (Apache 2.0), AI Town (MIT), WorkAdventure (AGPL + Commons Clause) — absent from all seven research files; surfaces.md never covered page 1. claude-squad's AGPL-3.0 IS traceable (surfaces.md:86). *[Orchestrator note: these are FINAL §13.8's, from round-5 `surfaces.md` §4A (licences read from files there, on ceo-1-1788468144). Fix: tag (FINAL §13.8; round-5 surfaces.md §4A.1, §4A.2, §4A.7) so provenance lands on the file that read the LICENSE.]*

**P1.6 — `maxTurns` semantics and the ten-minute background-child ceiling presented as "quotable" and unquoted.** §6.4, §15.8. runtimes.md:25 lists `maxTurns` as a frontmatter field and says nothing about partial/resumable output; "ten minutes" appears in no research file. "Does not need to be built" rests on it. *[Orchestrator note: both are FINAL §6.1 and §14.7's measured facts (SIGTERM 143, `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`, maxTurns partial-and-resumable) from the round-5 providers lane. Fix: tag (FINAL §6.1, §14.7) and remove "quotable".]*

## P2 findings, 1 of 2 — caveats dropped

**P2.1 — Seven licences rendered as read facts when research marks them GitHub SPDX detection `[api]`.** v15, §8.5, §14.7, §17.3, §17.6: Langflow, 3d-force-graph, Gource, Symphony, Crystal, OpenHands, vibe-kanban. surfaces.md gap 1: "Licence lines are not quoted for nine of ten projects… the largest defect in this report." The plan carries the caveat once (§14.10) and correctly; absent where a builder would read before adopting. n8n handled right everywhere.

**P2.2 — Hook counts flat in §10.5 ("34 hook events, 10 documented as blocking"), caveated in §15.6** (runtimes.md: `D`, medium, "my fetch merged them").

**P2.3 — Gemini CLI memory (§13.2) stated as documented fact; research marks the row M, search-synthesised after two 404s.**

**P2.4 — A quotation extended past the file.** §14.1 quotes surfaces.md §4A.11 as *"no Claude Code fleet surface is spatial; every spatial project is a display and every control surface is a table"* — the file carries only the first clause. *[Orchestrator note: the two further clauses are FINAL §13.8's, from round-5 surfaces.md §4A.11; re-attribute, do not delete.]*

**P2.5 — "ICU alarms: 74–99% irrelevant" (§3.8) — no source in research; table tagged NEW.** *[Orchestrator note: FINAL §1 row 18 and §13.5 carry it; tag (FINAL).]*

**P2.6 — Higgsfield's verb set and credit-spend behaviour (§5.2, §5.3, §8.7, §17.1, §17.3) asserted; research absent.** Local measurement recorded only that it failed to connect (`ENOTFOUND`). *[Orchestrator note: FINAL §16.3 row; the connected-tools list came from the 2026-09-04 session's own MCP server list; tag (FINAL §16.3) and mark the verb set UNVERIFIED.]*

## P2 findings, 2 of 2 — drift and unsourced runtime cells

**P2.7 — Three internal contradictions on measured local facts.** Claude Code **2.1.261** (header, §17.5, §17.7) vs **2.1.259** (§10.5 ×2, §15.6, marked `M`). Verdict records **68** (§18.1) vs **50** (§21.4). Event log **3,840** (§14.6) vs **3,843** (§17, §17.4, §18.5). *[Orchestrator note: 2.1.261 measured this session; 68 and 3,843 are the census's disk values.]*

**P2.8 — Runtime and policy cells marked `D` or `M` that appear in no research file.** §10.5: Codex "Seatbelt / Landlock … network off by default"; "included in every ChatGPT plan"; §8.6/§10.1 "Google's Policy Engine"; §15.6 Gemini `--policy`, `--admin-policy`, `--allowed-mcp-server-names` marked `M`. *[Orchestrator note: all FINAL §14.6 providers-lane cells (D/M, 2026-09-04); tag (FINAL §14.6).]*

**P2.9 — One true drift against research.** §17.7 gives Routines a "daily cap"; runtimes.md:19: "1-hour minimum interval, no local files"; §10.3 gets it right. *[Orchestrator note: "daily cap" was FINAL §16.7's word for Routines' window; runtimes.md's row is about interval, not cap — say both, cite each.]*

## P3 findings

**P3.1** "2,111-skill upstream" vs skills.md "2,111+" (v17, §7.1). **P3.2** Linear's ten-second `thought` stated flat (§2.5, §3.4); cognition.md marks M. **P3.3** §10.5 "Installed here | yes, 2.1.259" has no D/C mark. **P3.4** §16.3 "$74 a month against $1,300–1,700" tagged (FINAL) — bounds in no research file (they are FINAL §15.3's; fine as tagged). **P3.5** §11.10 Voyager "verified-before-stored" traceable to the lane's wording, not the paper; §13.8 handles it better with "confidence M, from the abstract".

## The honest-gaps table

Every gap the research names is carried, most more than once. **This is the strongest part of the plan.**

| Gap | Carried honestly | Where |
|---|---|---|
| OpenAI terms unread (403) | Y | §9.10, §10.6 item 2, §20.1 row 1 |
| Google terms unfetched | Y | same three places |
| Codex `/goal` secondary-source only | Y | §10.3, §10.5 (`C`), §10.6 items 1 and 3 |
| `-w` / `--tmux` unresolved | Y | §14.11, §10.6 item 6, §15.6 |
| Max 20x price unverified | Y | §9.3, §14.6, §16.2 |
| Fable on a subscription seat unverified | Y | v21, §9.2 (explicit fallback branch), §9.6, §20.1 row 2, §22.2 row 19 |
| No vendor cost-per-task figure | Y | §16.9 (whole subsection), §9.6, v21 |
| Memory benchmarks vendor-run | Y | §13.10 |
| The 3D extractor unresearched | Y | §14.9, §14.3, §17.6, §20.1 row 10 |
| No prior art for a card launching a team | Y | §0.5, v16, §14.3, §14.7, §17.6, §20.1 row 9, §21.3 (falsifiable) |

**No gap is stated as settled anywhere.** The one understatement is `requirements.toml` rendered `D` — P1.2.
