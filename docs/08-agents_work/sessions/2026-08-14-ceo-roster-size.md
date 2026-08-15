---
date: 2026-08-14
role: ceo
task: roster-size
tier: lite
qa_verdict: PENDING
---

Founder rejected the first board's roster of five as too few for a system meant to autonomously operate real
businesses, and asked for external frameworks to be studied. Second board convened: 8 framework studies
(BMAD, YC QM, Spec Kit, Agent OS + GSD, superpowers + anthropics/skills, Cloudflare, the multi-agent
specialisation literature, production verification layers), 5 requirements-first derivations, 2 adjudicators
steelmanning opposite positions, 1 synthesis. **16/16 returned, zero empty.**
Output: [ROSTER-SIZE.md](../../03-system-design/ROSTER-SIZE.md), 725 lines.

**The founder's disagreement was excluded as evidence in every prompt, in writing**, and so was the first
board's conclusion — the point of a second board is not to ratify a pushback. The expansionist case was
required to name only containers passing the container test; the minimalist case was required to argue that
the founder's intuition was mistaken. Both adjudicators named their own weaknesses at length; neither was
discounted. **The "complex work needs many voices" argument lost.** All 26 agents proposed by the first
board's specialists stay cut, and `framer` is cut by both boards independently.

**Answer: seven** — `orchestrator · builder · designer · reviewer · sourcer · instrument · operator`. The
founder was right about the number and wrong about the reason, which is a mechanism rather than a preference:
**this runtime prices denials and grants differently.** A capability *denial* is settable per dispatch
(`disallowedTools`, MCP-aware and fail-closed; `bashCommandClamp` refuses a spawn it can bind nothing for). A
capability *grant* exists in exactly one place in the whole system — agent-file frontmatter. There is no
additive `allowedTools` and no `mcpServers` option on `agent()`, on the `Agent` tool, in `SKILL.md`
frontmatter or in a lens. **I verified this independently of the board against the `Agent` tool schema
itself:** it accepts `subagent_type`, `model`, `effort`, `isolation`, `prompt` — and no way to hand an agent
a capability.

So the roster floor is the number of capability grant-classes that must not co-reside. A business needs four
— read the public web, see a rendered surface, read its own systems of record, act irreversibly on the world.
**This repo holds one.** Hence `operator` (act-on-the-world) and `instrument` (private-systems read, proposed
by no agent in either board). `designer`'s browser condition is discharged **yes**.

**Where the first board failed, specifically:** it counted denials and never once counted a grant, because
the corpus it measured had made exactly one. `operator` was cut on a premise its own §0 enforcement table
disproves two hundred lines earlier. Clause (b) of the container test — isolation — is **struck as circular**;
applied honestly it scores `reviewer` and `orchestrator` at zero, reproduced. Everything else of the first
board stands, including every collapse.

**Two consequences the founder must decide.** The **OS sandbox (E7) is now a hard precondition, not an
option** — `operator` and `instrument` hold payment keys and deploy tokens, and `tools:` does not bind
`Bash`; those containers must not exist before it is configured. And **checkups/scheduled work is the one
layer with no owner at all**: 0 clocks, 0 escalation channels, 0 of 4 gates with consumers.

**What neither board could do, and both name as the settling experiment:** run one real venture task — price
→ landing page → promote → test a payment → read the result back — and count what was missing, with a
clamped-`builder` control arm. No venture work has ever run through this harness; all 39 session files are
infrastructure.
