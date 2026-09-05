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
§3.1 makes the Operator an agent file, the same object as the fourteen it dispatches. §3.5 requires it to dispatch agent teams for "the fleet the founder watches on page 2". The plan's own sourced constraints at v13 and §14.5 are that teams need an interactive session, that there are no nested teams, and that `-p` never forms a team. An Operator that is a dispatched agent file cannot form the team page 2 draws; an Operator that is the main interactive session is not the object §17.1 inventories. [truncated in transit — remainder in Part 2b]
