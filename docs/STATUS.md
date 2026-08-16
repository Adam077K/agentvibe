# Where we stand — 16 August 2026

Living status. Replaces nothing; read it before starting, and correct it when it goes stale.

---

## The short version

The enforcement layer works now. Three sessions ago it did not — the safety hook blocked nothing, the QA gate
had never refused anything, and the permission model was inert. All three are fixed and each one is pinned by
a test that fails if it regresses.

**The system still has not done any venture work.** Every one of the 44 session files is infrastructure. That
remains the largest open item and no amount of further specification shortens it.

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
3. **The OS sandbox is configured nowhere.** `operator` and `instrument` are specified and deliberately
   uncreated until it exists; they would hold payment keys and deploy tokens in a container that cannot hold
   them.
4. **The prompt-craft gate is still closed.** Nothing under `.claude/agents/` may be created, rewritten or
   deleted until a written prompt standard exists and is approved. Two narrow capability-only exceptions were
   granted explicitly and neither is a precedent.

## Next, in order

1. **One real venture task, end to end** — price something, build the page, promote it, test a payment, read
   the result back. Both boards call this the experiment that settles whether seven is the right number.
2. **The prompt-craft deep dive**, which unblocks the roster migration (**18** files → 7; `reviewer-readonly.md` landed in #47).
3. **Five of six MCP servers do not exist** — billing, analytics, deploy, DB admin, payments. This is the real
   distance between the specification and a working system.
