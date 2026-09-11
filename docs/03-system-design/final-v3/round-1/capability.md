# Round 1 · capability

*Salvaged from the workflow journal. The lane ran as a `sourcer`, which has no Write tool,
so it could not author its own file; this is its structured return rendered as prose.*

## Headline

The unit of reusable know-how must carry its own falsifier — a deterministic "tell" over the run trace that is true iff it was followed — because every harness today can prove a skill was loaded and none can prove it was obeyed; and because tool-selection accuracy degrades monotonically from the second item (13.62%→43.13% with retrieval, 43%→2% from 4→51 tools), a capability library is a tax on every unrelated task and must be budgeted with deletion as the default.

**Fields covered:** 8, 34, 35, 36, 37, 38

## Claims

### 1. [measured]

THE FILE WAS NOT WRITTEN. This agent's grant is [Read, Glob, Grep, WebSearch, WebFetch] plus the single-record claim-append MCP server — no Write, Edit or Bash. The full artifact is in the final text message; someone with a shell must save it verbatim to the target path.

**Basis:** measured — own tool list

### 2. [sourced]

Retrieving a small relevant tool subset instead of the full catalogue more than triples selection accuracy: 13.62% baseline to 43.13%, with >50% prompt-token reduction. Registered as c-tool-selection-degrades-with-catalogue-size.

**Basis:** https://arxiv.org/abs/2505.03275

### 3. [sourced]

Presenting more candidates hurts selection even when the correct tool IS in the list: adaptive K=7.4 from 370 tools gave 93.1% correct selection vs 87.1% at fixed K=5. So the fix is not better recall — choosing is a separate, degrading act.

**Basis:** https://arxiv.org/html/2605.24660v1

### 4. [sourced]

The MCP spec concedes it cannot enforce its own security principles at the protocol level, and classifies tool descriptions as untrusted. All enforcement must therefore be host-side — which argues for a broker, not a curation policy. Both registered in the ledger.

**Basis:** https://modelcontextprotocol.io/specification/2025-06-18

### 5. [sourced]

Connection alone is the exposure: tool descriptions enter model context at tools/list, before any invocation ('line jumping'), defeating invocation-based control and turning human-in-the-loop into 'human-as-the-rubber-stamp'.

**Basis:** https://blog.trailofbits.com/2025/04/21/jumping-the-line-how-mcp-servers-can-attack-you-before-you-ever-use-them/

### 6. [sourced]

Tool poisoning succeeds at up to 72.8% across 20 agents on 45 live MCP servers and 353 real tools; best refusal rate under 3%; MORE capable models were often MORE susceptible because the attack rides instruction-following.

**Basis:** https://arxiv.org/pdf/2508.14925

### 7. [sourced]

Rewriting tool descriptions locally is both the security fix (removes the poisoning channel entirely) and the performance fix: Anthropic measured a 40% decrease in task completion time from rewritten descriptions. Highest-leverage single move in this lane.

**Basis:** https://www.anthropic.com/engineering/built-multi-agent-research-system

### 8. [reasoned]

The only reliable defence against the lethal trifecta is architectural avoidance — Willison states 95% detection is 'very much a failing grade'. Proposed: once a session ingests untrusted content, egress is REVOKED for that session by PreToolUse exit 2, not warned about.

**Basis:** https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ plus https://code.claude.com/docs/en/hooks

### 9. [reasoned]

Fixed-vs-figured-out should be derived automatically from the capabilities a worker REQUESTS (spend, egress, others' data, irreversibility), not judged per task by an orchestrator. A worker that asks for egress has thereby chosen the fixed path.

**Basis:** reasoned — from the vision's 'permission follows consequence' applied to control flow

### 10. [speculative]

A fixed path's only legal escape is halting with a named UNANTICIPATED terminal state; and UNANTICIPATED frequency per path is the best untapped signal of whether the path is correctly drawn — zero forever means silent coercion, not perfection.

**Basis:** reasoned

### 11. [reasoned]

Unwinding is mostly fiction: each step declares undoable / compensable / permanent, and a path may contain at most ONE permanent step, which must be last. This is checkable at authoring time and is the structural form of 'killing must be cheap'.

**Basis:** https://learn.microsoft.com/en-us/azure/architecture/patterns/saga plus reasoned

### 12. [speculative]

Measure every human gate's override rate. A gate approved 100% of the time over N decisions is latency, not safety, and the system should propose converting it to auto-approve-and-report. I found no harness that ships this.

**Basis:** reasoned — from WHO checklist compliance data and Trail of Bits' rubber-stamp finding

## Refusals — what this lane says NOT to do

- Never put private-data access, untrusted-content ingestion and egress in one agent context. No 'trusted vendor' exemption — postmark-mcp was trusted and shipped a BCC exfiltration in a point release to 1,643 downloads.
- Never pass vendor-authored tool descriptions to the model verbatim. Rewrite locally from the pinned schema — it removes the poisoning channel and improves performance simultaneously.
- Never let an agent hold a long-lived credential. The broker holds it; the agent gets a work-item-scoped handle. This structurally kills token passthrough and confused deputy.
- Never auto-update a connected server or borrowed skill. A changed content hash STOPS the connection and requires re-admission — this is the rug-pull defence.
- Never ship a know-how library with no resident budget and no eviction rule. Selection degrades monotonically, so each added unit is a cost imposed on every unrelated task.
- Never scale ceremony by size — only by consequence. And never let a gate be paid for with the owner's attention unless it has been shown to change the outcome sometimes, or it becomes a rubber stamp.
- Never treat 'returned without error' as 'worked', and never let an exploratory (unasserted) tool call be cited as evidence downstream.
- Never connect anything that can widen the system's own permissions — the broker, config, IAM, DNS, the domain registrar. And never enter a transacting stage without a rehearsed wind-down path.

## Unknowns — could not determine

- No published measurement of instruction-ADHERENCE rate exists in any harness — whether a loaded skill/rule was actually followed. Cursor's forum is anecdote at volume. This is the largest gap in the literature and the clearest opening.
- No harness appears to run holdouts/ablations on its own instructions; I found no counterexample. The proposal to A/B-test your own skills is therefore unvalidated in practice, though cheap on the hook layer.
- The 43%→2% BFCL figure and the 50/200/740-tool accuracy bands came via secondary summaries, not the primary leaderboard. Directionally corroborated by three primary sources; exact numbers indicative only.
- No numbers on routing-layer cost (latency, tokens) for SKILL libraries as opposed to tool catalogues at realistic sizes.
- Half-life of written-down know-how in agent systems — how fast a unit goes stale. Nothing measured anywhere. It should set the default expiry and would have to be measured locally.
- Base rate of MCP rug-pulls: one confirmed malicious server publicly. One observation is not a rate; the defence is justified by consequence, not frequency.
- Whether broker-side description rewriting measurably reduces successful tool poisoning — reasoned from the mechanism, not measured. No study tests it.
- Aviation checklist design literature (read-do vs do-verify, length limits, challenge-response) — web-search budget was exhausted (200/200) before I could source it. WHO surgical checklist data is a weaker substitute. Someone should close this; aviation has thought harder about ceremony-for-small-work than software has.
