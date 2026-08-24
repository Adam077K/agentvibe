# Where we stand — 24 August 2026

Living status. Replaces nothing; read it before starting, and correct it when it goes stale.

---

## The short version

The enforcement layer works now. Three sessions ago it did not — the safety hook blocked nothing, the QA gate
had never refused anything, and the permission model was inert. All three are fixed and each one is pinned by
a test that fails if it regresses.

**P0 is closed and merged.** On 2026-08-23 `main` moved `5b8e127` -> `f5c62ba` — nine branches in one
train, the first time it had moved since before 2026-08-20. The gate now binds a verdict to the diff it
reviewed, the author-written PASS grep is gone, the deterministic suite runs before any review agent is
dispatched, and the launcher template no longer seeds an unreviewed merge into generated projects. Only
P0 item 6 remains (the Codex second-family resolver, correctly deferred).

**The system still has not done any venture work.** Every one of the **105** session files is
infrastructure. That remains the largest open item and no amount of further specification shortens it —
the count has more than doubled since this line first said 44.

**Open, and being examined before more is built:** whether the ecosystem is over-restricted. Two agents
were commissioned 2026-08-24 to weigh what the gates, checks, tiers and review rounds cost against what
they have actually caught. See `docs/08-agents_work/handoffs/2026-08-24-continue-the-build.md` §4.

---

## Shipped to `main`

| PR | What landed |
|---|---|
| **#42** | The safety floor rebuilt; three hooks unregistered; three QA-gate fixes |
| **#43** | Eleven specification documents — the roster is **seven** |
| **#47** | Gate routing, the `stop_reason` probe, capability containment, the permission model |

### The three defects that mattered

**The safety hook blocked nothing.** `pre-tool-use.sh` parsed JSON with a line-oriented `awk` field split; on
the real compact payload every rule was skipped. A payload carrying `rm -rf /` exited 0. Replaced with a
structural parse that fails closed — 134 tests, every dangerous case through both payload encodings.

**The QA gate had returned 34 PASS and 0 refusals.** Three causes, all removed: it could inherit a verdict
written for other work; two of its three adversarial verifiers were told to assume findings were false; and
three review lenses declared an unsatisfiable independence predicate so they could never run.

**The permission model was inert.** `.claude/settings.json` carried its allow/deny rules — **39** today, 29
allow and 10 deny; the figure read 26 here until it was counted on 2026-08-16 — and `bin/warroom`
launched every session with `--dangerously-skip-permissions`. Removed, with the allow list narrowed to verbs
that were measured rather than guessed — reproduce with `npm run measure:bash`.

### Capability containment

- The QA gate's reviewers, verifiers **and its binding judge** ran as `general-purpose` with tools `*` — they
  held `Write` and `Edit` on the diff they were judging. Evidence-gatherers now run as `reviewer`; the judge
  runs as `reviewer-readonly`, which has no shell at all.
- A `SKILL.md` carrying `allowed-tools` **subtracts** from the agent that loads it. Two shipped skills clamp
  to a single Bash pattern; one of them is the skill the spec assigns to `designer`. `schema-lint.js` now
  refuses the attachment.
- `designer` was described as *"the only producing engine with a perception loop"* and had no browser. Granted
  `playwright`, with the per-server allowlist landing in the same commit — the previous check was a boolean
  that would have opened MCP to every agent at once.
- Browser policy: **the open web is allowed, the local network is refused.** Agents already hold
  `WebSearch`/`WebFetch`, so blocking the browser closes no prompt-injection risk and only costs research.

---

## What we learned that changes how to work here

**`maxTurns` binds when a dispatch names an `agentType`, and not otherwise.** This repo recorded the opposite
as measured fact. The belief came from a corpus where no agent file was named. Naming `agentType` at four
dispatch sites silently capped every reviewer at 20 tool calls and cost three failed gate runs.
*Bound honestly:* it explains 13 of 20 dropouts; the other 7 exceeded the cap and are unexplained.

**A subagent that stops early reports as "available", not "incomplete".** Two of three independent reviewers
went idle without sending their reports. Taken at face value that reads as *"reviewed it, found nothing."*
**Never trust a subagent's silence — or its report — without checking.**

**MCP tool calls only reach a hook if the matcher names them.** Any claim of the form "the hook still fires"
is false for MCP unless the matcher says so. That sentence propagated into four files before it was caught.

---

## The gate now refuses things

It ran three times against PR #47 and **blocked every time**, all on its own author's work. Then three
independent reviewers — security, correctness, evidence — each returned **FAIL**.

Between them they found, in work I had already called finished: a **CWE-22 path traversal** that read files
outside the skills directory and echoed them into fork-visible CI logs; a **symlink bypass of the fix for
it**; **eleven SSRF bypasses** of a guard whose own comment claimed the address was refused; **two more
bypasses in the rewrite that closed those eleven**; an auto-approved **remote-code-execution path** added in
the same change described as tightening; and **four false or overstated claims** in the documentation.

Every finding was reproduced by hand before being accepted. Every one is now fixed and pinned.

That is the headline: the enforcement layer's value was demonstrated by it repeatedly refusing the person who
built it.

---

## Open — needs a decision

1. **`tools:` binding is unverified.** The judge's "no shell" guarantee rests on it, and its own prompt tells
   it that it has no shell. If `tools:` does not bind, that statement is false to the one agent whose verdict
   cannot be overridden. Tracked as `c-read-only-binding-unverified`.
2. ~~**Nothing was added to `CLAIM-LEDGER.md`.**~~ **CLOSED 2026-08-16.** Four of the facts above are
   registered claims now — `c-mcp-grant-binds-through-agent-dispatch`,
   `c-maxturns-binds-when-agenttype-named`, `c-mcp-hook-matcher-must-name-the-tool` and
   `c-nested-subagent-spawn-works` — all `verified_by: command`, so each fails a check when it stops being
   true rather than sitting in a paragraph. `c-nested-subagent-spawn-works` fails until the false
   *"subagents cannot spawn subagents"* line leaves `.claude/entry/ceo.md`, which is the correct signal and
   not a defect in the claim. Issue **#56** is decided in the same pass: `c-lenses-and-playbooks-are-loaded`
   carries a `refresh` disposition — shrink the 27,069-byte session-start payload with a router, do not raise
   the 4,096 budget to fit it.
3. **The OS sandbox is ARMED — and this item stays open, for a corrected reason.**
   *Superseded 2026-08-24: this item read "The OS sandbox is configured nowhere." That was false.*
   `.claude/settings.json` carries `sandbox.enabled: true` and `failIfUnavailable: true`, armed by Founder
   decision 2026-08-17 and pinned by `npm run test:sandbox` — which fails if either is flipped back, and
   passes today (7 tests, exit 0).
   `operator` and `instrument` are **still specified and still uncreated**, verified rather than recalled:
   `.claude/agents/` holds 18 files and neither is among them, and the `ENGINES` list in
   `.claude/hooks/schema-lint.js` names seven engines, neither of them — that file's own comment says the
   two "join `ENGINES` in the PR that creates their files". So the trigger this item named, *"until it
   exists"*, is now satisfied while the agents remain uncreated.
   **Arming does not discharge the reason.** The sandbox governs Bash and its children, and
   `dangerouslyDisableSandbox` allows a denied command to be retried with it off, so it is a guardrail
   against accident and not a containment boundary against the agent — `docs/03-system-design/SANDBOX.md`,
   Finding 2. A container that cannot hold payment keys and deploy tokens against the agent itself still
   cannot hold them. The open decision is therefore unchanged in substance and different in premise: no
   longer *"configure a sandbox"* but *"decide what actually holds those credentials."*
4. **The prompt-craft gate is still closed.** Nothing under `.claude/agents/` may be created, rewritten or
   deleted until a written prompt standard exists and is approved. Two narrow capability-only exceptions were
   granted explicitly and neither is a precedent.

## Next, in order

0. **Decide whether this is over-built** — the 2026-08-24 review. Acting on it, including changing the
   plan or the system, is in scope. It comes before the items below by founder decision.
1. **One real venture task, end to end** — price something, build the page, promote it, test a payment, read
   the result back. Both boards call this the experiment that settles whether seven is the right number.
   Deferred 2026-08-24 pending item 0; recorded so the deferral stays a choice.
2. **The prompt-craft deep dive**, which unblocks the roster migration (**18** files → 7; `reviewer-readonly.md` landed in #47).
3. **Five of six MCP servers do not exist** — billing, analytics, deploy, DB admin, payments. This is the real
   distance between the specification and a working system.
