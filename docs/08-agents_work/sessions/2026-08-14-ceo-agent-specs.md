---
date: 2026-08-14
role: ceo
task: agent-specs
tier: lite
qa_verdict: PASS
---

Three planners (Opus) specified the seven-agent roster across 17 dimensions each — the ten the founder named
(permissions · sandbox/worktree · skills · MCPs · processes · helpers · QA · models · prompts · special
handling) plus seven a spec is useless without: **effort**, return contract, stop/exhaustion behaviour,
autonomy and escalation, credentials and network boundary, observability, and QA of the agent definition
itself. Output: [CONTROL-PLANE.md](../../03-system-design/agents/CONTROL-PLANE.md) (1,555),
[PRODUCERS.md](../../03-system-design/agents/PRODUCERS.md) (1,344),
[GRANT-HOLDERS.md](../../03-system-design/agents/GRANT-HOLDERS.md) (1,542). All three studied external
conventions (BMAD, QM, Spec Kit, Agent OS, GSD, superpowers, Cloudflare, anthropics/skills) and recorded what
they inherited and rejected, with access dates.

**A finding that may invalidate the roster number, and it is the most important thing here.** ROSTER-SIZE's
seven rests on *"a capability grant exists in exactly one place — agent-file frontmatter."* `spec-control`
found `SKILL.md` carries `allowed-tools`, which the binary calls **capability frontmatter** (alongside
`hooks`, `model`, `shell`) and documents as ignored **only** for shared-memory skills — implying it is active
otherwise. Verified independently: **8 of our skills declare it; 5 include `Write`/`Edit`; 1 includes
`Bash`.** The binary's authoring guidance reads *"`allowed-tools`: Minimum permissions needed (use patterns
like `Bash(gh *)` not `Bash`)"* — least-privilege phrasing, which is how grants are described, not filters.
**If skills grant, there is a second channel and the roster floor argument weakens toward five.** Not proven;
`allowed-tools` may be an upper bound as in slash-command frontmatter. **Probe:** load a `Write`-declaring
skill into an agent whose `tools:` excludes Write, attempt a write. Independent of the roster question this
is a live security issue — `reviewer` must never edit what it reviews.

**Two corrections to claims I gave the founder.** (1) `Workflow` fires **42×** in the corpus (qa 8, coding 5,
research 2) — `qa.js` **is** reachable and has run. I reported the good gate as decorative; wrong on count,
right on routing: nothing routes to it, so the merge gate still greps a self-written string. (2) All four
`qa.js` dispatch sites omit `agentType`, so the binary defaults to `general-purpose` with tools `*` — **the
reviewer container does not exist where verdicts are made.**

**Answers to the founder's two direct questions.** Worktrees: **one per dispatch, not per agent** — the unit
is the work slice, which already has an `id` in the job object `coding.js:22` refuses to run without.
`EnterWorktree`/`ExitWorktree` are live in 2.1.232 and `ExitWorktree` refuses to remove a worktree with
uncommitted or unmerged work absent `discard_changes: true` — runtime enforcement where we have prose.
Scheduled work: **a script plus a real clock (launchd), no agent owner** — `instrument` is a callee, never
the owner (365 unattended credentialed runs a year for work a script does deterministically is the largest
avoidable credential exposure in the design); a timer is not an approver, so not `operator`; and the
orchestrator's defining property is ending a turn on a human, which a scheduled run has none of.
`ledger-sweep.yml` stays as an independent second clock — two clocks failing for different reasons is the
point.

**Convergent deletions across all three:** `maxTurns` everywhere (does not bind — 196/269 exceeded it);
`Task` from orchestrator (0 of 84,029 calls); `qa-lead-pass.yml:87-91` + `:313-317`; the duplicated
`DIMENSIONS` at `qa.js:72-78`; `--dangerously-skip-permissions` from `bin/warroom:235,237` — named exactly:
**the autonomy dial welded to maximum**, which is the founder's variable-autonomy requirement pinned at none.

**Sequencing hazard worth its own line:** adding `.mcp.json` for designer's browser does not grant one server
to one agent — `mcpConfigured()` (`schema-lint.js:85-93`) tests only that config exists, so it flips the lint
permissive for **every** agent at once. The per-agent allowlist must land in the same change.

**Open, unresolved, and named by all three:** what actually stops a run. Probe: add `message.stop_reason` to
`turnsFrom()` (`usage.js:65-78`), re-index the ~2,519-transcript corpus, cross-tabulate against runs that
returned nothing. Half a day; converts the repo's oldest defect from mystery to measurement. Two of my own
subagents hit that defect during this session — going idle reporting "available" while incomplete.
