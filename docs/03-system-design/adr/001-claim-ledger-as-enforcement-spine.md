# ADR-001: Use a claim ledger as the enforcement spine, not a diff gate

## Header

| Field | Value |
|-------|-------|
| **ADR Number** | 001 |
| **Title** | Use a claim ledger as the enforcement spine, not a diff gate |
| **Date** | 2026-08-11 |
| **Status** | Accepted |
| **Deciders** | Adam (founder), ceo |

---

## Context

The agent system must serve **any** venture work — startups, products, pricing, GTM, design, content,
research — not only code. A measured diagnostic
([2026-08-11-ENFORCEMENT-DIAGNOSTIC.md](../../06-codebase/2026-08-11-ENFORCEMENT-DIAGNOSTIC.md)) found
~1,736 stated imperative rules against **1** mechanism that can block, and **16** verified fabrications —
claims in the documentation naming mechanisms that do not do what is claimed. The enforcement ratio is ~2%.

The obvious fix, and the one proposed by the source specification this rebuild started from, is a merge gate:
a signed verdict bound to a commit SHA, branch protection, and CI that executes code against the diff. That
design is sound and it is what the reference system prescribes.

It does not fit. A pricing model, a market-sizing number, a positioning statement and a GTM sequence have no
diff to gate, no compiler to run, and no test to fail. Three of the four available enforcement mechanisms
(hook, CI job, resolver, data file) assume a repository of compilable artifacts. Adopting a diff gate would
have produced strong enforcement over the *recoverable* class of work (code, revertible) and none at all over
the *unrecoverable* class (a wrong pricing decision, an invented market number acted upon).

A second constraint sharpened the problem. Fabrication #16 was the statement *"subagents cannot spawn
subagents,"* embedded in the system's own operating instructions and shaping its entire topology. Probed
live, it is false. It was **a claim about the world that was true once, carried no expiry, and silently
rotted while the whole system kept obeying it.** No diff gate would ever have caught that, because nothing
about it was a diff.

---

## Decision

Make the **claim** the durable unit the system verifies and remembers, and make a claim ledger — not a diff
gate — the single enforcement spine that both code and business work pass through.

---

## Rationale

**Why we chose this:**

1. **It is domain-general by construction.** Code, pricing, research and copy all ultimately *assert things*.
   A harness that gates diffs is code-specific; a harness that verifies claims covers every category of work
   with one mechanism, one classifier, and one set of consumers.
2. **It catches the failure class that actually hurt us.** Fifteen of sixteen fabrications were claims that a
   mechanism existed. A resolver that asks "this record claims X and names a file — does that file exist and
   do that?" would have caught all of them without blocking a single write.
3. **It makes staleness computable.** `valid_until` plus the Refresh / Deprecate / Waive disposition converts
   "nobody noticed for eight weeks" into a scheduled, forced decision. This is the mechanism that would have
   caught fabrication #16.
4. **It absorbs the memory problem rather than adding to it.** `DECISIONS.md`, `LONG-TERM.md`,
   `USER-INSIGHTS.md` and `CODEBASE-MAP.md` are claim collections that go stale invisibly. They become
   generated views over one ledger.
5. **`supports:` gives blast radius for free.** When a claim expires or is refuted, the system already knows
   which decisions just became questionable.
6. **Cost scales with consequence.** A typo carries zero claims and pays nothing. A pricing decision carries
   twelve and pays for all twelve.

**What we are giving up, stated plainly:**

- **The enforcement half is genuinely unbuilt prior art.** Across 24 studied systems, none implements a
  per-task claim envelope that is both checked against actual behaviour *and* on by default. Partial prior art
  exists — one system ships `valid_until` with Refresh/Deprecate/Waive; another ships
  `dispositionForUnverifiableTruth()` plus an auditor that checks a state file's claims against the repo; a
  third splits its validator into 13 deterministic and 13 judged rules. Nobody has assembled the whole thing.
  **We are not porting a known design; we are building one.**
- **The claim-decomposition tax is unmeasured.** Requiring agents to decompose output into claims is real
  overhead on every task and we cannot price it in advance.
- **`judge` resolvers inherit model-tier reliability.** One studied system documents that its cheapest tier
  *"degrades toward confident false-pass"* on exactly this task.

---

## Alternatives Considered

**A · Diff gate only (the source spec's design).** Signed verdict bound to commit SHA, branch protection, CI
executing compilers. *Rejected:* gates the recoverable class of work and leaves the unrecoverable class —
strategy, pricing, market claims — entirely ungated. It is the right answer for a coding harness and the
wrong one for a venture harness.

**B · Two gates, two homes.** Git gate for code; a separate claim-gate against Linear/Notion where business
artifacts live. *Rejected:* two places computing risk will disagree, and you find out during the incident.
The single-classifier rule is worth more than the convenience of leaving artifacts where they are.

**C · The decision as the durable unit (ADR-style, coarser).** Each decision carries evidence, reversibility
and an expiry. *Rejected as primary, retained as a view:* far fewer records and lower overhead, but you lose
per-claim blast radius — you learn the decision is questionable without learning which fact broke. Decisions
become a derived view over claims instead.

**D · Artifact + per-task acceptance criteria.** Criteria written at dispatch, checked at the gate.
*Rejected:* criteria die with the task. Nothing outlives the run, so nothing can go stale, so there is no
learning loop and no expiry — leaving the exact failure that produced fabrication #16 unaddressed.

**E · Nothing durable — re-verify on read.** *Rejected:* zero staleness by construction, but you pay full
research cost every time and can never answer "what do we believe and why," which for a venture-building
system is most of the value.

---

## Consequences

**Positive**

- One enforcement mechanism spans code and business work; one classifier feeds the merge gate, the pre-tool
  hook, the outbound gate and the escalation trigger.
- CLAUDE.md Rule 3 — *"no agent invents data"* — becomes a build failure instead of a sentence.
- Memory staleness becomes computable rather than noticed.
- The four memory markdown files collapse into generated views, removing four hand-maintained surfaces.

**Negative, and accepted**

- **Real friction on every substantive task.** Claim decomposition is work. Mitigated by shipping every gate
  in **shadow mode** first — computing `would_block` and logging it, blocking nothing — so the friction is
  *measured* rather than guessed. Only rules that fire correctly and rarely are promoted to blocking.
  Unrecoverable actions (outbound send, deploy, migration, harness self-edit) block from day one.
- **Business thinking must live in the repo.** Artifacts that stay only in Linear or Notion are outside the
  spine. This is a real cost and the price of having one spine instead of three.
- **A derived database can disagree with git.** Mitigated structurally: the DB has no write path of its own.
  One command, `ledger rebuild`, regenerates it from git. If they disagree, git wins and you rebuild — there
  is no reconciliation path to get wrong.
- **We may discover the tax is too high.** Stop condition #7 (a mechanism nothing invokes within two weeks)
  and the shadow-mode promotion review are the checks that would surface this.

**Neutral**

- The 4-tier QA classification survives in modified form — extended from `path → tier` to
  `path → {tier, resolvers[], required_claim_kinds[]}` — rather than being replaced.

---

## References

- Evidence: [2026-08-11-ENFORCEMENT-DIAGNOSTIC.md](../../06-codebase/2026-08-11-ENFORCEMENT-DIAGNOSTIC.md)
- Full design and phasing: [AGENT-SYSTEM-REBUILD.md](../AGENT-SYSTEM-REBUILD.md)
- Decision log: [.claude/memory/DECISIONS.md](../../../.claude/memory/DECISIONS.md)
- Source specification: `~/Downloads/beamix-agent-harness-2026-08-11/2026-08-11-AGENT-HARNESS-SPEC.md` and its
  5-file comparative study of 24 external systems. **Treat its numbers as hypotheses** — at least six
  overstatements were confirmed against its own underlying worker files.
