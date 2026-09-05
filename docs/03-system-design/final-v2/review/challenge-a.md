# Challenge A · holes, contradictions, rules with no mechanism · sealed lane (plan + handoff only) · 2026-09-05

**Severity:** P1 5 · P2 16 · P3 11 · opinions 4. Thirty-two findings plus four opinions.

**Dimension:** A rules with no mechanism 4 · B contradictions 22 · D method in stages 2 · E holes 4. Dimension C is the roll-up below.

## C · The founder's direction, A to H

| | Verdict | The gap |
|---|---|---|
| **A** mission control, seven pages, terminals on the Mac | honoured | one P1 hole: nothing decides whether the Operator is a session lead or a subagent, and page 2's substrate needs a lead. Page 5's taps open a gate's resolutions, not a terminal |
| **B** ten to fifteen named agents plus an operator | honoured as fourteen plus one, each with file, model, tools, MCPs, skills, anchor and routing | the operator's runtime position, above |
| **C** skills learned from the biggest systems, a skill creator, models per agent | honoured in name; models per agent honoured in full | the acquisition of the corpus is blocked on one unread licence file and marked a founder act, so the library the founder asked for is a plan for a library. The skill creator is a program that dispatches four agents, which collides with "only the Operator dispatches" |
| **D** no ceiling on tools and MCPs | honoured | none |
| **E** Codex and Claude Code from day one, using each one's loops and goals | half honoured | Claude Code's goal loop is placed on the run. Codex is admitted to one foreground checker slot, and Codex's own goal feature is declined for want of a primary citation. The founder asked for the loop and goal features "each has" |
| **F** the purpose paragraph | honoured, verbatim at §0.1, with five clauses each traced to a section | none |
| **G** close every hole | partial | the plan names many of its own holes honestly. Thirty-two remain, five of them blocking |
| **H** everything else stands unless research overturns it | honoured | none |

Verbatim paragraphs: the purpose paragraph, the roster instruction, the skills instruction, the tools instruction and the Codex instruction all appear as quoted text with a FOUNDER mark. Honoured.

## What the P1 list is about

Four of the five are one family: **the plan decides a thing twice in two sections and never reconciles them.** The agent files have two paths, the obligations store has two writers, the brief has ten fields in one section and eleven in two others, and the grant is argv in every safety rule while two of the three dispatch mechanisms have no argv at all.

The mechanism that would have caught all four is the same one and it does not exist: **a census that reads every table in the document and fails when two rows name a different path, writer, field count or tool set for one subject.** The plan already argues for exactly this at §23, where it refuses to restate the coverage table because "a coverage table in two places is two tables that disagree." It then puts the roster in five places.

## P1 · Five findings

**P1-1 · The fifteen agent files have two homes, and one of them is not read by the runtime.** Dimension B.
§3.1 names `.claude/agents/operator.md`. §5.2, §17.1 and §13a.4 all use `.claude/agents/<name>.md`. §17.8's file tree and §19.1 and §19.2 use `keel/agents/<name>.md`, with the argv files beside them at `keel/agents/<agent>.<provider>.argv`. Quoted, §17.1: "`.claude/agents/builder.md` — ABSENT as v2's file". Quoted, §19.2: "`keel/agents/operator.md` and the fourteen agent files". A builder cannot start. Claude Code reads `.claude/agents/`, so the tree's location would produce fifteen files nothing loads, and the `PS-*` lint the plan relies on globs the other path.
**Mechanism that would have caught it:** the path census of §19.2, which claims completeness over every ABSENT path and would have found the same artifact under two names.

**P1-2 · The grant is argv, and two of the three dispatch mechanisms have no argv.** Dimension E.
v34, §5.1 rule 1, §6.2, §8.8, §12.10 and §21.2 all rest on one sentence: "the grant is the exact argv, emitted by one no-model launcher," asserted nightly by `bin/probe`. §6.1's flowchart composes argv **before** choosing the mechanism, then branches to agent teams, subagents, or `claude -p`. Only the third has argv. A teammate and a subagent are spawned in-process; their grant comes from frontmatter plus the parent session's settings, and the plan itself records that a subagent's `permissionMode` is ignored by the runtime. So the tester's blindness by `--add-dir`, the builder's exclusion from the architect's paths at v7, the trifecta refusal at §8.8 and the nightly probe are unbuildable on the two paths the founder actually watches.
**Mechanism:** a per-mechanism grant matrix, one row per dispatch mechanism against each narrowing the plan claims, refusing a claim that no mechanism can carry.

**P1-3 · The obligations store has two writers.** Dimension B.
§17.4: "Obligation | `keel/ventures/<v>/obligations.yml` | **the Watch**". §2.3: "`steward` is the agent the Operator routes to when something is owed"; §5.2 grants steward "Write (obligations and operations paths)"; §12.7: "`steward` writes obligations from `scout`'s handover"; §19.3: "`steward` writes its obligations from those rows". The store table's own heading is "one writer each". Steward's entire job and its anchor rest on the write the store table gives to a different program.
**Mechanism:** the store check the plan already names, `bin/check-stores`, extended to refuse a store whose declared writer is not the only grant carrying `Write` on that path.

**P1-4 · The brief is ten fields in one section and eleven in two others, and a refusal is keyed on the eleventh.** Dimension B.
v37 and §6.2 fix it: "Ten fields: FINAL's nine, below, plus `agent:`", and the nine listed carry no anchor. §3.6's flowchart: "THE OPERATOR emits a BRIEF: intent id, done-test verbatim, out-of-scope, ceiling, the named agent, **the anchor**". §11.11: "the anchor is a required field on every brief and every handover; `bin/run` refuses a brief whose done-test names no anchor". A launcher built to §6.2 refuses nothing; one built to §11.11 refuses every brief §6.2 describes.
**Mechanism:** a schema file as the single source, with the prose tables generated from it, which is what the plan does for skills at §7.1 and not for its own schemas.

**P1-5 · The Operator's runtime position is never decided, and page 2 needs it.** Dimension E.
§3.1 makes the Operator an agent file, the same object as the fourteen it dispatches. §3.5 requires it to dispatch agent teams for "the fleet the founder watches on page 2". The plan's own sourced constraints at v13 and §14.5 are that teams need an interactive session, that there are no nested teams, and that `-p` never forms a team. An Operator that is a dispatched agent file cannot form the team page 2 draws; an Operator that is the main interactive session is not the object §17.1 inventories. The founder's direction A depends on this page: the orchestrator and its subagents as child flows, who is working, who is sleeping, and a click that pops that agent's terminal on the Mac.

Both readings break something. If the Operator is a dispatched agent file, as §3.1 and §17.1 inventory it, it cannot form a team, because the plan's own sourced constraints at v13 and §14.5 are that spawning teammates needs an interactive session, that there are no nested teams, and that `-p` never forms a team. Page 2 then has one level of nothing to draw, and the tmux pane ids the page joins on are never written to `~/.claude/teams/<team>/config.json`.

If instead the Operator is the main interactive session, then it is not the object §17.1 inventories with a model, a tools line, `maxTurns: 30` and `isolation: none`, and §17.1 row 0 is describing a file that governs nothing. It also loses the guarantee §3.1 spends most of its length on, that the Operator carries no `Write`, no `Edit` and no `Bash`, because a main session's tools come from settings and the founder's own permission mode, not from an agent file's frontmatter.

The plan never states which it is. §3.4's table contrasts the Operator with the Watch on six axes, including "Always on?" answered "No. It exists inside a session, for the duration of that session," which is compatible with either reading and settles neither.

**Mechanism that would have caught it:** the reachability probe this repository already ships for `Workflow`, `scripts/probe-workflow-reach.mjs`, pointed at team formation instead: assert that the thing declared to form a team is recorded as a session lead and not as a sidechain, and fail when a declaration is made by something the runtime would silently no-op.

## P2 · Findings 6 to 13 of 16

**P2-6 · The twenty-two INFRA skills have two opposite fates.** §7.7 says v18 admits INFRA as a "reference" body; §17.2 restates "never loaded into a run as a skill". **Mechanism:** one fate table, cited not copied.

**P2-7 · `check:manifest` and `check:curation` both retire and both survive.** §7.7 re-points them (drift between one Markdown source and two generated directories); §18.3 retires them. §7.1's no-drift rule depends on the re-pointed check. **Mechanism:** a fate census keyed on artifact name.

**P2-8 · "Eight of the fourteen carry no shell" contradicts the table.** §5.2 gives `Bash` to builder, tester, designer, analyst → ten carry no shell, not eight; §12.7 repeats eight. **Mechanism:** a count derived from the table.

**P2-9 · The four agents that carry `Bash` are named as two different sets.** §8.7 and §17.3: "builder · architect · tester · analyst"; §5.2 and §17.1: architect has no Bash, designer has. **Mechanism:** the same table-derived census.

**P2-10 · Five agents run in a band called "Build in a worktree" with no worktree.** §3.2, §6.5, §12.3 put nine agents in the band whose argv includes `--add-dir <worktree>`; v41 gives product, writer, growth, steward, curator `isolation: none`. **Mechanism:** a lint pairing `isolation` against band.

**P2-11 · Band one is `plan` in three tables and `dontAsk` in §12.5's flowchart**, and v9's "cannot ask" holds for `dontAsk`, unsourced for `plan`. **Mechanism:** one band table referenced by every diagram.

**P2-12 · The nightly reconciliation has a model in it and has no model in it.** §11.7 flowchart: "No model in the loop"; same section: "It is `analyst`'s work" (sonnet-5); §17.5 lists `bin/reconcile` among the no-model programs. [tail truncated in transit — Part 3b]
The reconciliation is the anchor that makes every other number rung one rather than rung four, so which of the two runs it decides its own rung. §11.7 says "on no model" and hands the work to an agent with a model; §8.3 admits read-only instruments first because `analyst`'s anchor is the reconciliation. The plan needs both — a no-model `bin/reconcile` that cannot be talked out of its answer, and an `analyst` that interprets a mismatch for the Decide item — and names neither as owner of which half. **Mechanism:** a lint failing when one job appears both in §5.1 rule 4's no-model list and in an agent's routing line.

**P2-13 · The generated skill directories sit at the repository root and inside each venture.** §7.1/§17.2: `.claude/skills/` and `.agents/skills/` at the repository root, Markdown source; §17.8's tree places both under `ventures/<name>/` generated from `keel/shared/skills/`. Under the tree the house's fifteen agents have no skills directory; under §7.1 a venture has no local skills; §7.6's namespace table assumes skills are not per venture. **Mechanism:** the §7.1 drift check, which cannot be written until one pair of paths is chosen.

## P2 · Findings 14 to 21, concluding P2

**P2-14 · A program dispatches agents, and only the Operator dispatches.** §0.3 "Only the Operator dispatches"; §7.5 `bin/skill` sequences four agents; §17.5 defends it. Nothing says whether `bin/skill` calls `bin/run` (a second caller of the launcher) or the Operator dispatches on its behalf (a routing rule, not a program). **Mechanism:** the ledger refusal of §6.6 extended to record which caller minted the run id.

**P2-15 · The handover is seven fixed fields, and two sections add more.** §6.3 seven fields; §11.2 adds the rung; §11.3 adds `findings`/no score; §11.11 requires the anchor; §14.6 and §16.8 read a rung §6.3 does not carry. **Mechanism:** one schema file under `shared/schemas/` (§6.4).

**P2-16 · "The two agents that declare `mcpServers`" is a fact about today's repository presented as a roster fact.** §3.1 argues from designer + sourcer; §5.2 grants servers to five (scout, designer, analyst, writer, growth). **Mechanism:** the grep-against-`.mcp.json` derivation run on the roster table.

**P2-17 · `claim-append` is granted to the curator and refused to it.** §8.6/§8.7: curator uses `Write`, needs no server; §17.3 grants curator the server; §5.2 curator MCPs none. **Mechanism:** the schema lint that fails an `mcpServers` declaration no config backs, run against the roster.

**P2-18 · The office page's seven prohibitions (§14.4) name no mechanism and are not marked WISH.** **Mechanism:** §21.3's fact-or-tap rule extended to a refusal list the renderer is checked against.

**P2-19 · ABSENT and WISH are used for the same state**, and the difference decides how much of the plan reads as enforced. §12.4, §11.11, §13a.4 mark WISH; §2.1, §2.2, §2.4, §6.2, §8.8, §13.5 mark ABSENT alone for the identical situation. …each stating a refusal in the present tense with an unbuilt refuser (§2.1 charter "does not load", `bin/check-stores` ABSENT; §2.4 "A card with no intent id does not launch anything", `bin/run` ABSENT). §8.8 uses both marks in adjacent rows for states a reader cannot tell apart. A defensible distinction exists — ABSENT designed-but-unbuilt, WISH no mechanism proposed — but the plan does not state it and three sections contradict it. §12.10's "Six of those mechanisms do not exist yet… WISHes wearing rule clothing" is true of far more of the document. **Mechanism:** a lint over the document's own marks, failing any rule whose only named mechanism is ABSENT and which carries no WISH.

**P2-20 · The curator's five fixed questions are a second admitted step list.** v18/§7.2 admit a step list in exactly one place (the Sender's checklist); §13.6 and §13a.3 give the curator five fixed questions per failed handover. Strong evidence (0 of 121 free reflections) — an argument for admitting a second place, not a reason it is not one. **Mechanism:** the schema lint refusing `steps:`/`how:`/`method:` pointed at any prescribed sequence a section hands an agent.

**P2-21 · Card creation has no writer.** §17.4.1 gives `cards/<id>.yml` one writer, `keel/bin/run`, but a card exists before anyone drags it; §14.7 makes the read-back page 4's new-card form; §17.4 gives the intent write to the founder's door; nothing writes the card. **Mechanism:** `bin/check-stores` failing a store whose declared writer never writes it.

## P3 · Eleven findings

**P3-22 · Verdict records counted twice, differently** — §18.1 68 · §21.4 50. **P3-23 · Decide sits on page 4 (v38, §14.2, §14.7) and on page 5 (§17.6 row 5).** **P3-24 · The office substrate is chosen (§14.3, §17.6 name Generative Agents) and open (§14.4, §20.1 row 12).** **P3-25 · `analyst` has no branch in §10.1's provider flowchart.** **P3-26 · §12.1's worked `may-alone` example ends "read my calendar and mail" — grants what v36 forbids to any agent with a pen.** **P3-27 · The pinned model set is quoted with `claude-sonnet-4-6` (§9.9) and without it (§5.8, §15.6, §17.1).** **P3-28 · `open.md` has two writers (curator; the Watch) under "one writer each".** **P3-29 · The skill creator (§7.5) states method in four numbered moves.** **P3-30 · "`config.json` is a read source and never a write target" (§14.5, §17.4.1) names no checker** — mechanism: the page's writable paths asserted by `bin/probe`. **P3-31 · "Credentials are never in a file" (§13.2) has no named scanner.** §15.4 and §15.3 rest the backup guarantee on it ("excludes secrets by construction because they were never in it"); nothing checks it; §13.8 already names "verifying secret scans" as a free deterministic check. **Mechanism:** a secret scan as a rung-one anchor on the house repository, run on every push (ABSENT).

**P3-32 · A duration appears in a rule, under a no-durations rule.** §12.2's door test: "Can the system itself undo this **within an hour**…" — load-bearing for `may-alone`, while the same section sizes the recall window "to the blast radius" with no number. **Mechanism:** the duration lint applied to decision predicates as well as prose.

## The opinions list (no mechanism would have caught them)

**O-1 · "And a lot more cool and important things" has no door.** The tools section builds a door (§8.1, "material, not a ceiling"); the surfaces section builds none for an eighth page. **O-2 · Page 2 shows one level of named teammates; below it, subagents** — the honest best against the documented runtime, and less than the founder asked for. **O-3 · The office page is the one the plan predicts will fail, and it keeps it** — the founder overruled the refusal; the plan built it properly. **O-4 · `growth` and `steward` stand on no outside evidence and the plan says so four times** — the pair to watch first when §21.2's routing counts arrive.

## What was read

Both files whole: the handoff (1–295) and the plan (1–6,253) in eleven contiguous ranges, no gaps. Nothing else opened. Roughly a third of the plan's citations point at SPINE and the seven lanes; those were checked for internal consistency only. Single model family. No fixes proposed.
