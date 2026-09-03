# The whole-system design round · 2026-09-02

**Four complete designs of one system, from four angles, then one synthesis.** This is the founder's original
instruction — *"run 3–5 agents… all should plan the whole agentic system. No limits, think big."* — done as
asked. The board meeting that preceded it settled the floor (15 decisions) and did not design the company.
This round designs the company.

## What you are designing

A one-founder company that runs 24/7 on Claude Code, on one Mac first — missions that outlive a session,
workers with real hands, a loop that walks until a goal is met, a balcony the founder watches and steers from
(goal-sized rows, 2–4 a day), and breadth beyond code: design, video, content, social, marketing, customer,
data, testing, CI. The founder's core complaint about what exists: **it lost creativity to playbooks, and
everything built is a stopping mechanism.** The founder's core instruction: *give them the tools, the way and
the understanding on how to learn — push back on super-specified packs.*

## Read, by reference, in this order

1. `docs/02-competitive/expansion/00-TERRITORY.md` — the fourteen territories, the twelve gaps, the measured state
2. `docs/03-system-design/STARTUP-OS.md` — §2 the nine founder decisions (binding), §3–§7 the current draft shape
3. `docs/08-agents_work/board-meetings/2026-09-01-startup-os-r01.md` — **the fifteen board decisions D1–D15
   are constraints on your design.** Read "Round 3 — the decisions" in full. You may argue against ONE of them,
   in your §17, with evidence; the rest bind. Also read "What the CEO got wrong" — those are facts now.
4. The catalogue, as needed: `docs/02-competitive/expansion/open-source.md` §1 · `hands.md` §6, §8 ·
   `concepts.md` §17, §1 (creativity), §15 (refuse). Every mechanism you use should cite where it came from —
   a repo, a catalogue id like `C2` / `P7` / `X1`, or `INVENTED`.

## Binding facts you may not design around

- Goal-sized balcony rows. Continuous cadence, no phase numbers. Built for this Mac. Global facts, project taste.
- The claim ledger, classifier, verdict binding and check suite survive (Decision 1). Packs are a grant and a
  stop, never a procedure (Decision 3). The agent proposes its done-test; the founder approves once (§4).
- D1 task id on every row · D2 no outbound money without an enforced rate · D3 reach on the grant, one classifier
  · D7 no self-scored done-test, no summed scores · D9 inbound last · D11 no worker trust · D12 a ceiling on
  governed artifacts, none on the goal tree · D15 harness:venture measured monthly.
- The runtime as measured: Claude Code exposes 10 hook events; a Workflow is main-session only; `claude -p
  --allowedTools/--disallowedTools` exists; launchd exists; `CronCreate` is session-only; the grant is a
  property of the dispatch path; `pre-tool-use.sh` allows MCP calls it does not name.
- Every rule you write names the mechanism that enforces it, or is labelled `WISH`.

## The fixed shape — every design uses exactly these sections, so they can be compared and merged

```
0.  THESIS — what this system IS, one paragraph. What is the center, and what serves it.
1.  Missions & drive      the mission format · the goal tree · what "done" is · priority · abandonment · blocked/stalled · the loop's cycle
2.  Workers & roster      engines · packs (the first four) · how many at once · fresh context · how a worker learns a field it lacks
3.  Hands                 which MCPs/CLIs/hands, granted to whom, narrowed how · the five servers to build · what is refused
4.  Knowledge             skills · mental models · fields · exemplars · taste · how a worker finds what it needs
5.  Memory                the stores, one rule each · retrieval · conflict · forgetting · what transcripts are for
6.  Communication         orchestrator↔worker · worker↔worker (or not) · the baton/board · collisions · help
7.  Context & cost        what is injected into whom · caching · batch · compaction · the task id · cost per mission
8.  Quality & truth       oracles · done-tests · the second family · the council (if any) · the world's verdict · taste vs correctness
9.  Control & safety      the policy seam · grants · gates · reach · the kill switch · what runs at 3am and what never does
10. Surfaces              terminal · balcony · phone · voice · redirect · briefing · walkthrough · when it may interrupt
11. Runtime               where the loop lives · supervision · recovery · models per job · what runs with the lid shut
12. Self-improvement      corrections → mechanism · post-mortems · promotion · retirement · measuring "better"
13. Economics             budgets · the rate ceiling · cost vs worth · model tiering as spend · the company's P&L
14. The company itself    venture intake · several at once · a second human · wind-down · the first mission
15. THE FIRST 30 DAYS     the build order, forced by dependency, with what each step unlocks. Position 1 must be justified against the Adversary's dissent: "position 1 must be an artifact, not a mechanism."
16. WHAT THIS DESIGN REFUSES   with the reason each refusal protects something
17. WHERE THIS DESIGN IS WEAKEST   your own strongest counter, stated fairly · and the ONE board decision you would overturn, if any, with evidence
```

Each numbered section: **what it IS in this design** (concrete — file names, formats, the actual mechanism),
**what it is built from** (catalogue citation), **which board decisions bind it**, and **what enforces it**.
Concrete beats comprehensive: a section that names one file format and one check is worth more than one
that names six ideas. Write it so a builder could start from it tomorrow. Length is yours; 800–1,500 lines
is the expected range.

## Output

Write to `docs/03-system-design/designs/2026-09-02-<angle>.md`. Return to the CEO **≤300 words**: your
thesis, the three design choices that most distinguish yours from what a generic design would do, and your
own strongest counter.
