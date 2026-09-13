> Archival provenance — 2026-09-13: Lane R4 (Authority as the boundary) report for the F2 round, preserved verbatim. Subject package at `ffeba9c` (Step 0 committed; protocol frozen at `26af5d5`). The lane was formed blind: it read only the files named in its brief and no other lane's output. The return channel truncates at about 4,000 characters and drops drains over 16,000, so the report was **extracted in full from the sourcer engine's own session transcript** (the harness's record of the agent's final text block, 58,113 characters) rather than assembled from chunked resends; chunks that had already arrived were compared against the extracted text and matched verbatim. No edits were made. The lane shares a model family with every other lane and reviewer in this round; independence is procedural only. Archival is not acceptance of any finding.

# R4 — Authority as the boundary

## 1. Provenance header

**Lane:** R4 (Authority as the boundary), one of eight lanes formed blind. **Date of research and of this report:** 2026-09-13. All web sources were accessed on 2026-09-13 unless the table says otherwise.

**Repository reads, in order, and nothing else:** `inputs/FOUNDER-THESIS-2026-09-13-agents.md`; `planning/F2/00-acceptance-protocol.md` (whole file, including §7 evidence rules, §3 fixtures, the W6 row in §2); `planning/F2/00-thesis-claims.json` filtered to `lane: "R4"` (three claims: TC-08, TC-24, TC-25, plus the neighbouring entries visible in the same grep window); `planning/specification/02-authority-recovery.md` §1–§10 (first page, lines 1–352); `planning/specification/05-work-agents-skills.md` §1–§10; `research/L07-security.md`; `research/L11-governance.md`; `inputs/DIRECTIVE.md` (whole file). **No other lane's output was read.** L07 and L11 were read because the brief names them; this report extends them and, at two points, contradicts a reading that could be taken from L07.

**Independent formation.** The bounded question, the search plan and the source list were formed from the brief and the pre-flight reads only. No candidate architecture was available to me and none was consulted.

**Model-family disclosure.** This lane was produced by a single Anthropic model. Its findings about Anthropic's own products are therefore doubly conflicted: vendor documentation read by a vendor model. Every such finding is flagged in the source table under conflict of interest, and I have preferred the vendor's own statements of *limitation* over its statements of *capability*, because the former cut against the vendor's interest and the latter do not.

**Truncation of my own return channel.** None. I had no tool for appending to the claim ledger (see §2, finding 14), and that is reported rather than worked around.

---

## 2. Findings

### F1. The bounded question resolves on one structural property, not on a preference between vocabularies. **INFERENCE**, resting on [S1] [S2] [S16] [S17].

A job title is a **designation**: a name that says which thing to hand work to. A tool grant, a permission rule and a consequence class are **authority**: a statement of what may happen. The entire confused-deputy literature is the study of what goes wrong when those two are carried separately, so that the name travels with the request and the power comes from somewhere else [S16, secondary]. Hardy's 1988 case is exactly this: a caller supplies a *file name* and the compiler supplies the *permission*, and the billing file is overwritten because nobody ever combined the two [S16].

This is directly instantiated in the runtime this system runs on. Claude Code lets you write `Agent(AgentName)` permission rules, which govern **which subagent may be spawned** [S2]. The subagent's actual authority comes from the `tools` and `disallowedTools` fields in that subagent's own definition file [S3]. So the gate is on the name and the power is in a file, and the two can be edited independently by different people at different times. That is a title-shaped boundary with an authority-shaped hole in it, and it is the default.

The answer to the bounded question is therefore not "tools and permissions are a better ontology than job titles." It is narrower and harder: **a boundary is real only if the thing that is checked at the moment of the effect is the same thing that was granted.** A title fails that test by construction. A tool grant passes it only when the grant is checked at the call, which is a property of the mechanism and not of the vocabulary. A "capability-differentiated agent" whose capability is declared in a file and never re-checked is a job title with a different noun, and negative control §4.8 of the acceptance protocol would be right to fail it.

### F2. Attenuation on delegation is solved and shipped, in three independent production families, and all three put it in the credential or the call rather than in the holder. **SOURCE CLAIM** [S4] [S5] [S6].

- **AWS session policies.** "The permissions for a session are the intersection of the identity-based policies for the IAM entity (user or role) used to create the session and the session policies." And: "Session policies limit permissions for a created session, but do not grant permissions." And: "An explicit deny in any of these policies overrides the allow." [S4] The attenuation is a parameter of the `AssumeRole` call, supplied by the caller, per session.
- **Macaroons.** Bearer credentials that "embed caveats that attenuate and contextually confine when, where, by who, and for what purpose a target service should authorize requests", built from "nested, chained MACs", supporting "decentralized delegation between principals" without a central authority [S5].
- **Biscuit.** "The holder of a biscuit token can at any time create a new token by adding a block with more checks, thus restricting the rights of the new token, but they cannot remove existing blocks without invalidating the signature." [S6] Attenuation is append-only and cryptographically enforced; the holder can narrow without asking anyone.

Three unrelated designs, one invariant: the derived thing is never broader than the parent, and the check is mechanical. This is what TC-24 asks for, and it is not speculative.

### F3. Attenuation buys narrowing. It does not buy revocation, and the difference is exactly F-3's adverse variation. **INFERENCE** from [S4] [S5] [S6] [S7].

Biscuit derives a revocation identifier from each block's signature and surfaces it to the authorizer as a Datalog fact, but the specification does not define how that identifier is checked against any list, and does not say whether revoking a parent revokes tokens attenuated from it [S6]. A sealed Biscuit can no longer be attenuated, which closes one direction and not the other. Macaroons' third-party caveats push freshness onto a separate discharge step, which is a revocation channel only insofar as the discharging party refuses [S5]. AWS fixes the session policy at the moment the session is created; revoking it is a separate deny, applied elsewhere [S4].

**The consequence for F-3 is specific.** "One permission is revoked mid-attempt" cannot be satisfied by an attenuating credential alone, no matter how well designed. It requires a live re-read at the enforcement point at the moment of the effect. The package already specifies exactly this, and I did not have to invent it: `02-authority-recovery.md` §4 makes expiry "checked live even if a timer has not written the expired revision", carries `identity_epoch`, `grant_epoch` and `scope_epoch` on every grant, and makes parent suspension invalidate descendants for new releases. §6.2 step P3 re-reads "current grants/identity/validity/scope/participant/time/profile/prerequisites" in one serial transaction at release. That is the right shape and it is the half that attenuation does not cover.

### F4. A consequence class attaches to an action only when it is computed from something the acting party cannot author. Two widely used mechanisms fail this test by their own documentation. **SOURCE CLAIM** [S8] [S2] [S9].

- **MCP tool annotations.** The MCP specification carries a normative warning in both the 2025-11-25 and 2026-07-28 revisions: "For trust & safety and security, clients **MUST** consider tool annotations to be untrusted unless they come from trusted servers." [S8] [S18] Annotations are the field where a tool would declare itself read-only or destructive. They are supplied by the same party that supplies the tool, they are optional, and the spec says not to trust them. **They therefore cannot carry a consequence class.** I searched the 2026-07-28 and 2025-11-25 tools pages and the schema page and could not locate the enumerated hint fields (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) in the prose; the prose now says only `annotations`: "Optional properties describing tool behavior". That is a gap in my evidence, recorded in §5, and it does not weaken the warning, which I quoted directly.
- **Bash permission rules in Claude Code.** "A Bash rule matches the command text Claude writes... It doesn't match the same program invoked in a different form, so a deny or ask rule covers the invocation Claude usually produces and isn't a security boundary around the program." [S2] The classifier input is a string the model wrote. A rule over that string classifies **what the model said it would do**, not what will happen.

What passes the test, in the same documents: rules keyed on a structured input parameter rather than free text, such as `WebFetch(domain:github.com)` and `Bash(dangerouslyDisableSandbox:true)` [S2]; operating-system enforcement of filesystem and network boundaries, which the same page directs you to "for filesystem and network enforcement that doesn't depend on the command text" [S2]; and AWS permissions boundaries, which "define the maximum permissions that the identity-based policies can grant to an entity, but do not grant permissions" [S4], a ceiling that is not itself a grant.

Google's published framing names the same split from the other side: a "hybrid, defense-in-depth strategy that combines the strengths of traditional, deterministic security controls with dynamic, reasoning-based defenses", grounded in three principles of which the second is that agents' "powers must be carefully limited" [S9].

### F5. The runtime this system runs on inherits authority by default, in four distinct ways, and this is the second clause of §8.16 failing in production. **SOURCE CLAIM** [S3] [S10] [S2].

1. **Tool inheritance is total unless a file says otherwise.** "Subagents inherit the built-in tools and MCP tools available in the main conversation, narrowed by two filters" [S3]. With neither `tools` nor `disallowedTools` set, "the subagent inherits every tool available to subagents" [S17].
2. **The delegator cannot attenuate at the call.** The Agent tool spawns a subagent; which tools that subagent gets is decided by the subagent definition's `tools`/`disallowedTools` fields, not by the caller [S17]. There is no session-policy equivalent. This is the precise structural difference from [S4].
3. **Escalated permission modes propagate downward and the child may not hold a stricter one.** "When the main conversation is in `bypassPermissions`, `acceptEdits`, or auto mode, the subagent runs in that same mode and Claude Code ignores the `permissionMode` you set." [S3] Attenuation is not merely absent here; the child's attempt to be stricter is discarded.
4. **The Bash sandbox inherits the parent's credentials.** "Sandboxed Bash commands inherit the parent process environment by default, including any credentials set there." [S10] Mitigations exist (`sandbox.credentials`, `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`) and are off by default.

One mechanism runs in the other direction and is worth stating precisely, because it is easy to overstate. A subagent definition may carry an `mcpServers` field "to give a subagent access to MCP servers that aren't available in the main conversation" [S3]. Read strictly, a child can hold a tool its delegating conversation did not hold. Read charitably, the grant comes from a file inside the project, subject to a trust rule on that file's folder [S3], so the authority was always the project's and the conversation is not the right unit. **Both readings support the same conclusion:** the child's authority is a property of a file, not a property of the delegation, which is finding F1 restated at the level of the runtime.

### F6. The first clause of §8.16 ("no agent grants itself greater authority") holds in this runtime against the model but routes through a second model, not through a person, when prompts are off. **SOURCE CLAIM** [S2] [S10] [S11].

The strong statement: "Permission rules are enforced by Claude Code, not by the model. Instructions in your prompt or `CLAUDE.md` shape what Claude tries to do, but they don't change what Claude Code allows." [S2] And: "Hook decisions don't bypass permission rules. Claude Code evaluates deny and ask rules regardless of what a PreToolUse hook returns." [S2] Precedence is "deny, then ask, then allow. The first match in that order determines the outcome, and rule specificity doesn't change the order." [S2] A deny cannot carry an allowlist exception. This is a genuine, checkable, deny-wins lattice, and it is better than most of what the agent field ships.

The qualification: `dangerouslyDisableSandbox` is a parameter the model supplies to move a blocked command out of the sandbox. The retry "goes through the regular permission flow" [S10]. In manual mode that is a person. In auto mode, "the classifier evaluates the underlying command" [S10], and separately, "a separate classifier model reviews actions instead of you and blocks the ones it judges unsafe" [S11]. So the escalation request is refused by a model. That is not self-granting, and it is also not a deterministic boundary. It belongs in the same evidence class as F-4 in the acceptance protocol: an independence claim resting on one model family.

### F7. Deterministic per-agent attenuation IS implementable in this runtime today, without the model, and this is the most actionable finding in the lane. **SOURCE CLAIM** [S12] [S2].

`PreToolUse` hooks fire inside subagents on the same terms as the main conversation, and the hook's input carries two fields that identify the caller: `agent_id`, "Unique identifier for the subagent. Present only when the hook fires inside a subagent call. Use this to distinguish subagent hook calls from main-thread calls", and `agent_type`, the agent's name [S12]. `SubagentStart` and `SubagentStop` hooks exist and match on `agent_type` [S12]. A hook can return `permissionDecision: "deny"` [S12]. Hooks from managed policy settings also run inside subagents [S12].

Combine that with the deny-first precedence and the fact that hooks cannot override a deny [S2], and you have the two halves of a real attenuation mechanism: a deny lattice that nothing can talk its way out of, and a per-agent identity available at the enforcement point. What is missing is not capability. What is missing is a *policy object*, external to the agent files, that states which agent identity may release which effect, and a check that runs on every call.

### F8. The empirical literature supports TC-08's premise and does not measure TC-08's claim. **SOURCE CLAIM** [S13] [S14], both unrefereed preprints, neither reproduced here.

- *When Lower Privileges Suffice* introduces ToolPrivBench and reports that "over-privileged tool selection is common among mainstream LLM agents and is further amplified by transient failures", that "general safety alignment does not reliably transfer to least-privilege tool choice", and that "prompt-level controls provide only limited mitigation under transient failures" [S13]. The last clause matters most here: telling an agent in its instructions to use each permission only for its own part is the arm TC-08 names, and this is direct evidence against that arm.
- *When Child Inherits* models subagent spawn and reports that "current frameworks can violate trust boundaries through insecure memory inheritance, weak resource control, stale post-spawn state, and improper termination authority", demonstrated "in real agent frameworks" [S14]. The abstract reports no attack-success percentages.

**Neither measures what TC-08 measures.** TC-08 counts *released* operations outside the part that needed them, in a one-executor-holds-the-union arm against a three-executors-one-each arm. I found no source running that comparison. TC-08 stays a hypothesis, with its premise strengthened.

I record a disagreement that the round should preserve rather than resolve. The 2026 secondary literature circulates attack-success figures in the range of 58% to 90% for multi-agent code execution and roughly 85% against state-of-the-art defenses under adaptive attack. I did not reach a primary source for any of those numbers within this lane and I am **not** citing them as evidence. Per §7's folklore rule they would be source claims about propagation, not measurements, and I decline to launder them by repetition.

### F9. Confused deputy in agent systems is documented in authoritative vulnerability records, not only in vendor blogs. **FACT**, from the CVE Program's own records [S19] [S20] [S21] [S22].

| Record | What it says, verbatim from the CVE record | Severity |
|---|---|---|
| CVE-2026-13341 | "A vulnerability exists in the Kong Konnect Model Context Protocol (MCP) server prior to version 1.0.0, which could allow a remote attacker to perform an indirect prompt injection attack and execute unintended API requests." | 7.4, `AV:N/AC:L/PR:N/UI:R/S:C` |
| CVE-2025-32711 | "Ai command injection in M365 Copilot allows an unauthorized attacker to disclose information over a network." | 9.3, `AV:N/AC:L/PR:N/UI:N/S:C` |
| CVE-2025-6514 | "mcp-remote is exposed to OS command injection when connecting to untrusted MCP servers due to crafted input from the authorization_endpoint response URL" | 9.6, `AV:N/AC:L/PR:N/UI:R/S:C` |
| CVE-2025-54135 | "Cursor allows writing in-workspace files with no user approval in versions below 1.3.9. If the file is a dotfile, editing it requires approval but creating a new one doesn't." | 8.6, `AV:N/AC:H/PR:L/UI:N/S:C` |

Three observations that the severity scores do not show. **All four carry `S:C`, scope changed**, meaning the impact crosses the vulnerable component's security boundary; that is the confused-deputy signature written in CVSS vector notation. **CVE-2025-32711 is `UI:N`**, requiring no user interaction at all. **CVE-2025-54135 is an authority-from-a-file case**: authority was derived from a configuration file the agent could create but not edit, which is the same asymmetry as F5's `mcpServers` field and is why I stated that one carefully.

### F10. The standards community names the delegation-chain gap as open, and the proposed answer has no standing. **SOURCE CLAIM** [S7] [S15] [S23].

RFC 8693, Standards Track, January 2020, gives the vocabulary. Impersonation: "When principal A impersonates principal B, A is given all the rights that B has within some defined rights context and is indistinguishable from B in that context." Delegation: "Principal A still has its own identity separate from B, and it is explicitly understood that while B may have delegated some of its rights to A, any actions taken are being taken by A representing B." The `act` claim "provides a means within a JWT to express that delegation has occurred and identify the acting party to whom authority has been delegated", and "a chain of delegation can be expressed by nesting one `act` claim within another" [S7]. What RFC 8693 does **not** do is mandate downscoping; the fetch found no requirement that an exchanged token carry fewer rights [S7].

The 2026 individual draft on Attenuating Authorization Tokens states the gap in its own words: existing OAuth mechanisms "do not define an offline, holder-derivable delegation chain in which each downstream holder can attenuate authority and any enforcement point can verify that the resulting token is no broader than its parent" [S15]. It proposes monotonic capability narrowing (`derived.tools ⊆ parent.tools`), parent-hash chain binding, decidable and deterministic subsumption checks, and closed-world argument constraints where "any argument not named in the constraint map MUST be rejected" [S15]. Its status is decisive for how much weight it may carry: individual submission, version 01, expiring 2026-12-17, and the document itself says it is "not endorsed by the IETF" and has "no formal standing" [S15]. A companion draft adds a `requested_actor` parameter so an agent is a distinct principal from the user, with the same no-standing caveat [S23].

**Read together:** as of 2026-09-13 there is an agreed vocabulary for delegation, an agreed representation of an actor chain, and no agreed mechanism for verifying that a chain narrows. This system would be building ahead of the standards, not behind them.

### F11. MCP's own least-privilege guidance contains a documented tension that a reader could easily miss. **SOURCE CLAIM** [S24] [S25].

The security best practices document requires a "progressive, least-privilege scope model" with a "minimal initial scope set", warns against "wildcard or omnibus scopes (`*`, `all`, `full-access`)", and lists "expanded blast radius" as the first risk of broad tokens [S24]. The authorization specification then defines the fallback when no scope challenge is present: "If `scope` is not available, use all scopes defined in `scopes_supported` from the Protected Resource Metadata document" [S25]. The best-practices document acknowledges this and defends it: the fallback "accommodates the general-purpose nature of MCP clients, which typically lack domain-specific knowledge to make informed decisions about individual scope selection" [S24].

The defence is honest and it is also an argument this lane should flag, because the system under design has exactly the property the defence assumes away. A general-purpose client cannot narrow scopes; a client that knows the work order, the consequence class and the acceptance owner can. **The "request everything" fallback is a consequence of not knowing the task, and this system knows the task.**

### F12. Every vendor whose isolation mechanism I read says, in its own documentation, that the mechanism is not a boundary. **SOURCE CLAIM** [S10] [S11] [S26].

- Claude Code sandboxing: "Sandboxing reduces risk but is not a complete isolation boundary. Review the limitations below before relying on it as a hard security control." [S10] Named limitations include domain fronting past a hostname-only allow decision, `/var/run/docker.sock` via `allowUnixSockets` granting host access, writable `$PATH` directories, and `enableWeakerNestedSandbox` which "considerably weakens security" [S10].
- Claude Code security: "While these protections significantly reduce risk, no system is completely immune to all attacks." [S11]
- OpenAI Agents SDK guardrails: the documentation does not characterise guardrails as a security boundary; tool guardrails run "before the tool executes and can skip the call", but "Hosted tools... and built-in execution tools do not use this guardrail pipeline" [S26]. A check that a whole class of tools bypasses is a validation layer, not a boundary.

This corroborates L07 finding 7 and extends it: the correct inference is not "sandboxes are weak" but "**a sandbox is a containment layer under an authority decision, never a substitute for one**", which is why F4's question of what computes the consequence class cannot be delegated to the sandbox.

### F13. Workload identity shows the third leg: authority derived from what a thing *is*, not from a secret it *holds*. **SOURCE CLAIM** [S27].

SPIFFE's Workload API "does not require that a calling workload have any knowledge of its own identity, or possess any authentication token when calling the API. This means your application need not co-deploy any authentication secrets with the workload", and "all private keys (and corresponding certificates) are short lived, rotated frequently and automatically" [S27]. The documentation I read covers identity and credential provisioning and does not describe authorization, access control or permission enforcement [S27]; I record that as an observed absence in the page I fetched, **not** as a claim that SPIFFE forbids authorization, since §7 forbids treating absence of evidence as evidence of absence.

The transferable idea is short-lived credentials attested from the runtime rather than issued to a name, which is the same move `02-authority-recovery.md` §4 already makes with five-minute step-ca certificates bound to `{environment, component_id, actor_id, instance_id}` and the rule that "certificate validity alone never grants consequence authority". This package is, on this point, ahead of the agent field.

### F14. I could not register any claim in the ledger, because the appending tool was not present in this session. **DIRECT OBSERVATION.**

My tool set in this session was Read, Glob, Grep, WebSearch, WebFetch and the messaging tool. `mcp__claim-append__append_claim` was not among them. **This is an absence, not a refusal:** no resolver evaluated any record and rejected it. Nothing in §2 is a claim that failed a check and was restated as prose. The three records I would register, and which someone holding that tool should register, are named in §8.4 with the quote and URL each would carry.

---

## 3. Source table

| id | URL | accessed | source date | type | P/S | confidence | conflict of interest | corroborated by | expiry | invalidator |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations | 2026-09-13 | spec rev 2026-07-28 | protocol spec | P | high | protocol maintainers | S24 | next spec revision | a revision changing the confused-deputy or audience rules |
| S2 | https://code.claude.com/docs/en/permissions | 2026-09-13 | undated living doc | vendor product doc | P | high | **vendor; and this lane is the same vendor's model** | S11 | 90 days | a release changing rule precedence or Bash matching |
| S3 | https://code.claude.com/docs/en/sub-agents | 2026-09-13 | undated living doc | vendor product doc | P | high | same as S2 | S17, S10 | 90 days | a release adding call-time tool restriction |
| S4 | https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#policies_session | 2026-09-13 | undated living doc | vendor product doc | P | high | cloud vendor; no stake in this design | S5, S6, S15 | 180 days | a change to session-policy evaluation |
| S5 | https://research.google/pubs/macaroons-cookies-with-contextual-caveats-for-decentralized-authorization-in-the-cloud/ | 2026-09-13 | 2014, NDSS | peer-reviewed paper | P | high | Google authors; no stake here | S6, S15 | none; foundational | a formal refutation of the caveat construction |
| S6 | https://github.com/eclipse-biscuit/biscuit/blob/main/SPECIFICATIONS.md | 2026-09-13 | living spec, Eclipse | open spec | P | high | project maintainers | S5, S15 | 180 days | a spec change permitting block removal |
| S7 | https://www.rfc-editor.org/rfc/rfc8693.html | 2026-09-13 | 2020-01 | IETF Standards Track | P | high | none | S23 | none; published RFC | an updating or obsoleting RFC |
| S8 | https://modelcontextprotocol.io/specification/2026-07-28/server/tools | 2026-09-13 | spec rev 2026-07-28 | protocol spec | P | high | protocol maintainers | S18 | next spec revision | annotations becoming normatively trusted |
| S9 | https://research.google/pubs/an-introduction-to-googles-approach-for-secure-ai-agents/ | 2026-09-13 | 2025 | vendor framework paper | P | medium (abstract only) | **vendor self-report; flagged per §7** | S1, S10 | 180 days | Google revising the framework |
| S10 | https://code.claude.com/docs/en/sandboxing | 2026-09-13 | undated living doc | vendor product doc | P | high | same as S2 | S11 | 90 days | a release changing env inheritance or the escape hatch |
| S11 | https://code.claude.com/docs/en/security | 2026-09-13 | undated living doc | vendor product doc | P | medium | same as S2, and this page is promotional in tone | S2, S10 | 90 days | a release changing the classifier's role |
| S12 | https://code.claude.com/docs/en/hooks | 2026-09-13 | undated living doc | vendor product doc | P | high | same as S2 | S2 | 90 days | removal of `agent_id`/`agent_type` from hook input |
| S13 | https://arxiv.org/abs/2606.20023 | 2026-09-13 | 2026-06-18, rev 2026-07-07 | **unrefereed preprint** | P | medium | authors propose their own defence | S14 | on peer review or a replication | a failed replication of ToolPrivBench |
| S14 | https://arxiv.org/abs/2605.08460 | 2026-09-13 | 2026-05-08 | **unrefereed preprint** | P | medium | authors propose their own invariants | S13 | on peer review | frameworks fixing the named inheritance defects |
| S15 | https://datatracker.ietf.org/doc/draft-niyikiza-oauth-attenuating-agent-tokens/ | 2026-09-13 | draft-01, expires 2026-12-17 | **individual I-D, no IETF standing** | P | medium | author advancing own proposal | S7, S23 | **2026-12-17** | expiry, adoption, or replacement by a WG document |
| S16 | https://en.wikipedia.org/wiki/Confused_deputy_problem | 2026-09-13 | living article | encyclopedia | **S** | medium | none | S1, S24 | 30 days | primary retrieval contradicting the summary |
| S17 | https://code.claude.com/docs/en/tools-reference | 2026-09-13 | undated living doc | vendor product doc | P | high | same as S2 | S3 | 90 days | a release adding caller-side tool scoping |
| S18 | https://modelcontextprotocol.io/specification/2025-11-25/server/tools | 2026-09-13 | spec rev 2025-11-25 | protocol spec | P | high | protocol maintainers | S8 | superseded revision | n/a; kept to show the warning predates 2026-07-28 |
| S19 | https://cveawg.mitre.org/api/cve/CVE-2026-13341 | 2026-09-13 | published 2026-07-03 | CVE Program record | P | high | vendor-assigned CNA record | S1 | on record update | a rejected or disputed status |
| S20 | https://cveawg.mitre.org/api/cve/CVE-2025-32711 | 2026-09-13 | published 2025-06-11 | CVE Program record | P | high | vendor-assigned CNA record | — | on record update | a rejected or disputed status |
| S21 | https://cveawg.mitre.org/api/cve/CVE-2025-6514 | 2026-09-13 | published 2025-07-09 | CVE Program record | P | high | researcher-reported, JFrog | — | on record update | a rejected or disputed status |
| S22 | https://cveawg.mitre.org/api/cve/CVE-2025-54135 | 2026-09-13 | published 2025-08-05 | CVE Program record | P | high | vendor-assigned CNA record | — | on record update | a rejected or disputed status |
| S23 | https://datatracker.ietf.org/doc/html/draft-oauth-ai-agents-on-behalf-of-user-02 | 2026-09-13 | draft-02 | **I-D, no IETF standing** | P | medium | proposal authors | S7, S15 | on expiry or adoption | replacement by a WG document |
| S24 | https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices | 2026-09-13 | rev 2026-07-28 | protocol guidance | P | high | protocol maintainers | S1 | next revision | a revision changing the scope fallback |
| S25 | https://modelcontextprotocol.io/specification/latest/basic/authorization | 2026-09-13 | rev 2026-07-28 | protocol spec | P | high | protocol maintainers | S24 | next revision | a revision changing scope selection |
| S26 | https://openai.github.io/openai-agents-python/guardrails/ | 2026-09-13 | undated living doc | vendor product doc | P | medium | vendor; competitor to S2's vendor | S11 | 90 days | guardrails gaining an enforcement guarantee |
| S27 | https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/ | 2026-09-13 | undated living doc | open-standard doc | P | high | project maintainers | — | 180 days | a change to the Workload API attestation model |

**Sources sought and not obtained**, recorded because omitting them would read as coverage: the Miller/Yee/Shapiro *Capability Myths Demolished* full text (three fetch routes; PDF unparseable, HTML landing page carries only metadata, `zesty.ca` mirror refused connection); Hardy's 1988 *The Confused Deputy* primary text (`cap-lore.com` refused connection, hence the secondary [S16]); the Capsicum USENIX Security 2010 paper (403, then unparseable PDF); the Biscuit revocation guide (403, hence revocation is drawn from [S6] only); the MCP enumerated tool-annotation hint fields in any specification revision's prose.

---

## 4. Per-claim verdicts

### TC-08 — "Where two parts of one job require different permissions, giving them to one executor increases realised blast radius relative to splitting them, even when the executor is instructed to use each permission only for its own part." *(kind: hypothesis)*

**Verdict: remains a hypothesis. Premise strengthened, claim unmeasured, and the instruction-based arm has direct evidence against it.**

The clause "even when the executor is instructed to use each permission only for its own part" is the testable part, and it is the part with evidence. [S13] reports that "prompt-level controls provide only limited mitigation under transient failures" and that "general safety alignment does not reliably transfer to least-privilege tool choice". [S2] independently states the general principle for this runtime: instructions in a prompt or `CLAUDE.md` "shape what Claude tries to do, but they don't change what Claude Code allows". So the instruction arm is weak by two independent routes, one measured and one architectural.

What is **not** established is the comparison TC-08 actually specifies: released operations outside the needing part, union-holder versus three single-holders, under an injected attack. No source I found runs it. [S14] demonstrates cross-boundary propagation in real frameworks but reports no arm comparison in its abstract.

**One competing consideration the measure should absorb**, or the result will mislead. Splitting into three executors creates a coordination channel between them, and [S14] names inherited memory and stale post-spawn state as the mechanism by which one compromise crosses an agent boundary. A split design can move blast radius from "one holder has three permissions" to "three holders share a poisoned channel" and score better on the stated metric while being no safer. I recommend the measure count released operations **and** record whether the release was reached through an inter-executor message, so the two failure shapes are distinguishable. `05-work-agents-skills.md` §5 already types `WorkMessage`, which makes that recordable.

**What would settle it:** the fixture as written, run with the attack injected at three separate points (tool output, shared-state record, inter-executor message), with releases counted per arm. Expect the union arm to lose on direct release and the split arm to lose on propagation, which would make the honest answer "depends on where the injection lands", not a win for either.

### TC-24 — "A created executor holds an attenuated subset of its creator's authority, and no executor can increase its own authority." *(kind: founder constraint)*

**Verdict: coherent, implementable, and currently false of the default configuration of the runtime this system runs on. It must be built, not assumed.**

Three sub-findings.

1. **The constraint is achievable and not novel.** [S4], [S5] and [S6] each implement it in production, and [S15] specifies it for exactly this setting as `derived.tools ⊆ parent.tools` with a deterministic subsumption check. TC-24 is not asking for research.
2. **The default runtime violates the second clause.** Total tool inheritance [S3] [S17], no call-time attenuation [S17], downward propagation of escalated permission modes with the child's own stricter setting ignored [S3], and environment-and-credential inheritance into sandboxed subprocesses [S10]. Each is documented by the vendor.
3. **The first clause holds against the model and not against the file.** No model instruction changes what the runtime allows [S2], and deny is unconditional and first [S2]. But a subagent definition file can carry `mcpServers` the main conversation lacks [S3], so authority can arrive from a file rather than from the delegator. This is the same defect the Cursor CVE records: authority derived from a workspace file the agent could create [S22].

**The claim's measure is right and should be tightened by one word.** It says to "observe refusal at the enforcement boundary rather than in instruction text". The enforcement boundary that exists here is the `PreToolUse` hook plus the deny lattice, with `agent_id` and `agent_type` in the hook input [S12]. The tightening: the refusal must be observed **at the effect**, not at the spawn. A design that checks the child's declared tool list at spawn time and never again is checking a file, and a file is a designation.

### TC-25 — "The supervision an action requires is set by its possible consequence, reversibility and blast radius; a good record may change review depth but may not silently raise the owner's maximum exposure." *(kind: founder constraint)*

**Verdict: no counterexample found in the literature; and the runtime supplies a concrete anti-pattern this system must not copy.**

Nothing I read argues for record-based authority expansion. The direction of the field is the opposite: Google's second principle is that powers "must be carefully limited" and "dynamically aligned with their intended purpose and user risk tolerance" [S9], and [S13]'s finding that a good general safety posture does not transfer to least-privilege tool choice is evidence that a track record in one dimension predicts nothing in another.

**The anti-pattern, stated precisely because it is easy to wave away.** In Claude Code, when a permission prompt is answered "Yes, and don't ask again", the approval is written as an `allow` rule into `.claude/settings.local.json`, applied "permanently per repository and command", and in a git repository it is written at the repository root and applied across the whole repository [S2]. The rule has no expiry and no review date. Strictly, this does not violate §1.5: a person chose it, so nothing was raised *silently* by the agent. Operationally, it is a monotone ratchet, and over a month of ordinary work the set of effects that may occur without any human at the moment of the effect grows, driven by prompt fatigue, which the same vendor names as a design pressure it is mitigating [S11].

**The claim's measure is the right measure and I would add a second arm.** As written: "an executor's accumulated record must not move any action into a lower supervision class". The gap it leaves: the accumulated **approval set** can move an action into a lower supervision class without the executor's record changing at all. The fixture should therefore hold the executor fixed and vary the approval history, then check that the set of effects releasable without a human is identical to hour one. That arm fails on this runtime's defaults today, which makes it a useful test rather than a formality.

---

## 5. Assumptions · Unknowns · Competing interpretations

**Assumptions.** That the runtime documentation I read describes shipped behaviour rather than intent; I performed no runtime measurement in this lane and the package's own standing caveat applies. That the CVE records accurately characterise the vulnerabilities they describe; I did not reproduce any of them. That "authority" in this system will continue to mean the right to release an external effect, as `02-authority-recovery.md` §1 defines it, and not the ability to compute; the two come apart and every finding here is about the former.

**Unknowns.** Whether splitting a three-permission task across executors reduces or relocates blast radius, which is TC-08 and is open. Whether any attenuating credential format survives contact with a subscription-based coding-agent runtime that has no token to attenuate; the whole of [S4] [S5] [S6] [S15] assumes a credential exists at the boundary, and a Claude Code session's authority is expressed as settings files and hook decisions, not as a bearer token. **This may be the single most important unknown in the lane**, and it is a question for whoever owns the runtime adapter. Whether MCP tool annotations carry the four hint fields in the current revision; I could not find them in prose. Whether revoking a Biscuit parent revokes its attenuated children; the specification does not say [S6]. Whether the classifier that evaluates escalation requests in auto mode can be induced by the same injection that produced the request; nothing I read addresses it.

**Competing interpretations, retained rather than resolved.**

- *Where authority lives.* Reading A: authority belongs to the conversation, so a subagent with `mcpServers` the parent lacks is amplification and violates TC-24. Reading B: authority belongs to the project, whose files are trust-gated, so the child holds a subset of the project's authority and TC-24 is intact. I cannot settle this from documentation, and the choice decides what a candidate must implement. Recommend routing it as a definition question, not an evidence question.
- *Attenuation versus mediation.* Attenuating credentials ([S4] [S5] [S6]) put the constraint in the thing that travels. Mediating gateways (this package's C04 and G) put it in the thing that sits still. L07's finding 2 and the Rajani result it cites argue capabilities alone do not close every confused deputy; [S15] argues the missing piece is argument constraints inside the credential, which is a capability answer to a capability objection. Both may be right at different layers. **Do not force this to consensus.**
- *Does isolation-by-executor buy anything the loader cannot?* TC-09 assigns this to another lane and I make no finding, but F5 bears on it: in this runtime, executor separation does **not** by itself separate credentials, environment, sandbox configuration or process [S10]. Whatever executor separation buys here, it is not what the word suggests.

---

## 6. Useful mechanisms · Rejected mechanisms

**Useful mechanisms**, each with the named problem it solves and whether it exists in a runtime this system could use.

| Mechanism | Problem it solves | Exists in a usable runtime? |
|---|---|---|
| Intersection at the delegating call (AWS session policy pattern) [S4] | The delegator cannot narrow the delegate. Puts attenuation in the call, per delegation, without editing the delegate | Yes in AWS; **no equivalent in the Agent tool** [S17]. Must be built |
| Append-only attenuation with cryptographic monotonicity (macaroons, Biscuit) [S5] [S6] | Offline narrowing with no round trip to an authority; a holder can safely hand on less | Yes, as libraries. Needs a credential at the boundary, which a subscription CLI session does not currently have |
| Deny-first, non-overridable precedence [S2] | Allowlist exceptions silently re-opening a closed path. "A broad deny rule... blocks every matching call, including calls that also match a narrower allow rule" | **Yes, today** |
| `PreToolUse` hook keyed on `agent_id`/`agent_type` [S12] | Per-agent least privilege enforced outside the model, at the effect, with managed-policy hooks running inside subagents | **Yes, today.** This is the buildable path |
| Credential masking with per-host injection at an egress proxy [S10] | Authority without disclosure: the agent authenticates without ever holding the secret, and "the command and anything it logs never hold the real credential" | **Yes, today**, with `tlsTerminate`. Closest shipped thing to an object capability in this runtime |
| Parameter-keyed permission rules (`WebFetch(domain:)`, `Bash(dangerouslyDisableSandbox:true)`) [S2] | Consequence class computed from structure rather than from model-authored prose | **Yes, today** |
| Permissions boundary as a ceiling that does not grant [S4] | Separating "the most this may ever do" from "what this may do now", so a later widening cannot exceed a founder-set maximum | Yes in AWS; maps cleanly onto `ConsequenceVector` in `02-authority-recovery.md` §4 |
| Short-lived, attested workload identity [S27] | Authority tied to what a process is, rather than to a secret it carries and can leak | Yes; already the package's step-ca design |
| Actor-chain representation, `act` nesting [S7] | Recording who acted for whom, auditably, across hops, without impersonation | Yes; Standards Track and stable |

**Rejected mechanisms, with the reason.**

- **Tool self-description as a consequence class.** The MCP spec says clients "MUST consider tool annotations to be untrusted" [S8]. A tool declaring itself read-only is a claim by the party whose behaviour is in question.
- **Command-text matching as a permission boundary.** The vendor says it "isn't a security boundary around the program" [S2]. It classifies a string the model wrote.
- **Instructing an executor to use each permission only for its part.** Measured to provide "only limited mitigation under transient failures" [S13], and structurally void in a runtime where instructions do not change what is allowed [S2].
- **Declaring authority in the delegate's definition file and calling that attenuation.** It is designation without authority [S16], checked at spawn and not at the effect, and CVE-2025-54135 is what it looks like when it fails [S22].
- **Sandbox as authority decision.** "Not a complete isolation boundary" [S10]; guardrails that hosted tools bypass entirely [S26].
- **Requesting every supported scope by default.** Defensible for a general-purpose client that does not know the task [S24]; indefensible for a system that has a typed work order and an acceptance owner.
- **An agent that can spawn without a permission check.** The Agent tool's permission-required column reads "No" [S17]. Delegation is an authority operation and should cost a check.
- **A track-record-driven permanent allow rule with no expiry** [S2], per TC-25.

---

## 7. Failure cases

Each is a concrete attack or accident, with how it would be detected. These are proposed fixtures, not executed results.

1. **The helper that inherited everything.** A worker holding payment-read, customer-write and outbound-send spawns a helper to format a message. The helper is defined with no `tools` field, so it inherits all three [S17], and an instruction embedded in the customer record it formats causes an outbound send. *Detection:* the release record names the helper's identity and the effect class, and a per-agent policy denies outbound for that identity at the hook [S12]. Without that policy the only record is that "the system" sent a message.
2. **Authority arriving from a file.** An injected instruction causes a new agent definition file carrying an `mcpServers` grant to be written into the project, and a later spawn picks it up [S3], mirroring CVE-2025-54135's create-versus-edit asymmetry [S22]. *Detection:* a `FileChanged` or `ConfigChange` hook on agent-definition paths, and treating an unreviewed agent file as untrusted at `SubagentStart` [S12].
3. **Escalation that cannot be refused downward.** A session in an escalated permission mode spawns a child whose definition asks for a stricter mode; the request is discarded [S3]. A worker that was designed to be safer than its parent is not. *Detection:* compare declared child mode against effective mode at `SubagentStart`; any divergence is a finding.
4. **Credential leak through the environment.** A sandboxed test script in an unfamiliar repository reads a token from the inherited environment [S10] and exfiltrates it to an allowed broad domain via domain fronting past a hostname-only allow decision [S10]. *Detection:* env scrubbing plus masking with `injectHosts` [S10], and any sentinel value appearing in a captured output is a positive.
5. **Revocation that arrives too late to mean anything.** A permission is revoked while an attempt holds an already-issued credential. Attenuation formats give no cascade [S6]. *Detection:* live epoch re-read at release, per `02-authority-recovery.md` §4 and §6.2 P3; a release that passed a stale epoch is detectable after the fact, which is the difference between an incident and a mystery.
6. **The confused deputy at production scale.** An MCP server with legitimate API credentials is induced by content it read to issue API calls the caller never asked for, which is CVE-2026-13341 as written [S19]. *Detection:* the effect's parameters must be resolvable to a trusted source record, which is `ParameterAuthority` in `02-authority-recovery.md` §8.1. A recipient chosen from tool output and not from a verified record is the signature.
7. **Zero-click disclosure.** An exfiltration requiring no user interaction at all, which is CVE-2025-32711's `UI:N` vector [S20]. *Detection:* only outbound content construction can catch this, which is the destination-clean or deterministic-rendering split in `02-authority-recovery.md` §8.2. An approval prompt catches nothing when there is no interaction to hook.
8. **Ratchet by fatigue.** Over a month, repeated "don't ask again" answers accumulate repository-wide allow rules with no expiry [S2]. *Detection:* count the effects releasable without a human at week one and week four; if the second number is larger, TC-25 has been violated by accumulation rather than by any decision.
9. **The escalation request judged by a peer.** A model-supplied `dangerouslyDisableSandbox` retry is evaluated in auto mode by a classifier model [S10] [S11] that received the same injected content. *Detection:* the F-4 arm structure, with the known-defect control. If the classifier passes the planted case, the boundary is decorative.

---

## 8. Implications for this system

Bound to the fixed boundaries, which I did not reopen. Nothing here proposes changing the consequence and release boundary, evidence and acceptance, recovery, human responsibility, the founder-competence mechanism, or whole-company scope.

### 8.1 F-3, the three-permission task

**Permission composition.** The protocol's §5 item 6 names this as a candidate (d)-class gap: "no rule for whether a composite grant is minted, borrowed or refused". The evidence says the answer is **minted, narrowly, and never borrowed**, and that the mint must be per attempt. [S4] is the shape: the effective set is the intersection of a standing role and a per-session policy passed at the call. Mapped onto this package, the standing side is the `Grant` and its `ConsequenceVector`; the per-attempt side is the `OperationIntent`'s `grant_refs` and `parameter_authority_refs`. The package already has both halves. What §5 item 6 is really missing is the rule that **the intersection is computed at release and not at assignment**, because only the release-time version survives the revocation variation (F3).

**Attenuation on delegation.** `05-work-agents-skills.md` §5 says a child "cannot further delegate founder values, professional standing, independent acceptance, access that it cannot lawfully transfer, or the parent's responsibility". That is a list of prohibitions. What [S15] adds is the missing predicate: `derived ⊆ parent`, decidable, deterministic, and checked by the enforcement point rather than asserted by the delegator. I recommend the candidate carry that predicate explicitly, because a prohibition list is not a subset test and cannot be mechanised. **Do not adopt the AAT draft as an authority**; it has none [S15]. Adopt the predicate.

**Behaviour on revocation.** Answered above: live epoch re-read at the effect, already specified.

**The record of which identity performed which effect.** [S7]'s nested `act` claim is the stable, Standards Track representation of a delegation chain and costs nothing to adopt as a shape. In the runtime, `agent_id` and `agent_type` are available at every tool call [S12], so the record can be produced deterministically rather than reconstructed from a narrative.

**The buildable path, concretely.** Deny rules for every outward effect class, applied at the managed-settings tier so nothing below can loosen them [S2]; a `PreToolUse` hook that reads `agent_type` and the work order's grant set and returns `deny` for anything outside it [S12]; masking rather than disclosure for any credential a worker must use but must not hold [S10]. All three exist today. None requires the model to cooperate.

### 8.2 F-4, the verification the producer must not influence

Two implications from this lane, both narrow.

First, **the checker's authority must differ from the producer's in kind, not only in name**. The `reviewer` engine already carries no Write, which is the right instinct. This lane adds the mechanism: the difference should be enforced at the hook by `agent_type`, so that "the reviewer cannot write" is a property something computes rather than a property of a file the reviewer's own work could edit.

Second, and this is a caution rather than a proposal: **auto-mode classification and independent review are the same construction wearing two names**. When Claude Code's auto mode evaluates an escalation with a classifier model [S11] and when this system asks a second engine to judge a producer's artifact, both are one model family judging another instance of itself. The package's standing caveat already says this. The addition from this lane is that the *permission boundary* now partly rests on it too, which means the single-family accepted risk reaches further than the review pipeline. That is worth stating in the disposition rather than discovering later.

### 8.3 The other fixtures, briefly

**F-1:** admission of an unknown job is an authority question before it is a routing question. Whatever admits it must be able to say the effect class it may reach, or the refusal path has nothing to refuse on. **F-2:** shedding a lane is itself an authority act, and the identity that sheds should be recorded the same way the identity that releases is. **F-5:** what a resumed attempt may trust intersects this lane at one point only, and it is sharp. A resumed attempt must **not** trust a cached permission decision; L07's failure case 3 names it and [S6]'s lack of a defined revocation check is the mechanism by which it happens. **F-6:** a week of founder absence is a week in which the approval ratchet of TC-25 cannot be corrected by the only person who can correct it. The queue rule should therefore include an expiry on approvals granted during the absence.

### 8.4 The three claims someone with the ledger tool should register

Stated with the quote and URL each would carry, since I could not append them (F14). Each is `verified_by: source` against a fetchable quote, and each names an expiry.

1. **Subagent tool inheritance is total by default in Claude Code.** Quote: "Subagents inherit the built-in tools and MCP tools available in the main conversation, narrowed by two filters". URL [S3]. Suggested `valid_until`: 2026-12-13 (90 days; living vendor doc).
2. **Sandboxed Bash inherits the parent process environment including credentials.** Quote: "sandboxed Bash commands inherit the parent process environment by default, including any credentials set there". URL [S10]. Suggested `valid_until`: 2026-12-13.
3. **MCP tool annotations are normatively untrusted.** Quote: "For trust & safety and security, clients **MUST** consider tool annotations to be untrusted unless they come from trusted servers." URL [S8]. Suggested `valid_until`: next specification revision, or 2027-03-13, whichever is sooner.

---

## 9. Questions other lanes may have missed

1. **Does this system have a credential at the boundary at all?** Every attenuation mechanism in §6 assumes a token exists that can be narrowed. A subscription coding-agent session's authority is settings files and hook decisions, not a bearer credential. If there is nothing to attenuate, TC-24 must be enforced by mediation rather than by delegation, and that is a different architecture. I could not resolve this and believe it is load-bearing.
2. **Who owns an agent definition file, and is writing one a consequence-class action?** If a worker can create the file that grants the next worker its tools, authority creation has been delegated to whoever can write a file. CVE-2025-54135 is this exact bug, shipped [S22].
3. **Is delegation itself an authority operation?** In this runtime spawning costs no permission check [S17]. Fan-out, depth and cost all follow from a call nothing gates. The delegation ceiling in §5 item 7 needs an owner *and* a checkpoint, and the checkpoint does not currently exist.
4. **Can a low-consequence action compose into a high-consequence one?** L07 asked this and it is still open. Read plus read plus send is three C0/C2 actions and one disclosure. Nothing in a per-action consequence class detects the composition. `ConflictClaim` in `02-authority-recovery.md` §5 is the nearest existing mechanism and it is scoped to business conflicts, not to information flow.
5. **Does approval expire?** Neither §1.5 nor §8.16 says approvals have a lifetime, and the runtime's permanent allow rules show what happens when they do not [S2]. An approval with no expiry is a grant, and grants in this package expire.
6. **What is the unit of identity for a work attempt?** [S27] attests a workload; [S7] names an actor; this runtime exposes `agent_id` and `agent_type`. If the acceptance record names a role and the enforcement record names an instance, the two cannot be joined after an incident, and the truthful account §1.4 requires will have a hole exactly where it matters most.
7. **Who may raise a ceiling, and how is that act distinguished from using one?** AWS separates them structurally: a permissions boundary "does not grant permissions" [S4]. This package's `ConsequenceVector` could carry the same separation and currently reads as one object doing both jobs.
8. **Is the escalation classifier in scope for the injection it is judging?** Nothing I read says whether the model evaluating a sandbox-escape retry sees the content that motivated it. If it does, the boundary and the attack share an input.

---

**Standing caveat, restated in my own words.** Nothing in this report is a runtime result. I read specifications and vendor documentation and four vulnerability records; I ran no experiment, reproduced no attack, and measured nothing. Where I say a mechanism exists, I mean a document says it does. Where I say a default is unsafe, I mean the vendor's own documentation describes that default and I have quoted it. Two primary sources central to the capability-security argument were unreachable through my tools and are cited secondhand or not at all, and §3 names them.