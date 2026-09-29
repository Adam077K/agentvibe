**Lane 07 — Security, permissions, identity, and adversarial threats**

**Central finding — inference.** The system should assume that a capable worker can be manipulated, mistaken, or compromised while still producing convincing work. Security therefore needs to bound what happens after a bad decision. Model robustness, authorization, execution isolation, information-flow control, evidence integrity, and recovery are separate properties. None can substitute for all the others. This conclusion constrains candidate architectures without selecting one.

**Founder constraints.** Autonomy follows consequence; historical success cannot silently raise exposure limits. Workers cannot grant themselves authority. External communications, spending, commitments, disclosure, and irreversible actions require the authorization appropriate to their consequences.

**Findings**

1. **Authority must remain attributable through delegation and recovery.**

   **Source claim:** NIST rejects implicit trust based on network location or asset ownership. Saltzer and Schroeder’s complete-mediation principle explicitly encompasses initialization, recovery, shutdown, and maintenance—not merely ordinary requests. These works concern protecting resources; neither supplies an ontology for company operations. [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final), [protection principles](https://web.mit.edu/Saltzer/www/publications/protection/Basic.html).

   **Proposal:** Distinguish the accountable owner, authorizing human, calling workload, delegated run, connector account, and policy version. Record their relationships on every consequential operation. A resumed run must recheck current authorization. A subprocess or child agent receives explicit, attenuated authority rather than inheriting everything its parent can access. Authentication establishes identity; it does not establish that this particular action serves the founder’s intent.

2. **Capabilities are useful but insufficient.**

   **Source claim:** Rajani, Garg, and Rezk formally show that capability semantics do not prevent every confused-deputy attack. Their analysis identifies cases involving implicit influence and examines provenance tracking as an alternative enforcement mechanism. The result is scoped to their formal language and assumptions, not a universal theorem about deployed agent software. [Formal analysis](https://people.mpi-sws.org/~dg/papers/csf16-caps.pdf).

   **Inference:** A worker legitimately allowed to send invoices can still send an attacker-selected invoice. Possession of the right capability does not prove the choice of recipient or content was authorized. Candidate designs need both authority limits and a representation of the trusted origin of consequential parameters. Natural-language intent cannot generally be reduced to a mechanically complete predicate; the remaining semantic gap must be visible.

3. **MCP authorization solves a narrower problem than safe tool use.**

   **Source claim:** The November 2025 authorization specification requires intended-audience token validation and rejects acceptance or transit of tokens issued for other resources. Companion security guidance covers confused deputies, session hijacking, SSRF during metadata discovery, and local server execution. Sessions are not authentication. Local server installation can execute code with client privileges. [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization), [security guidance](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices).

   **Proposal:** Keep connector credentials outside model context; issue short-lived, resource-scoped access through a credential service. Bind connector accounts to explicit businesses and environments. Validate discovery URLs and redirects, including internal-address resolution. Treat schema, description, and server-version changes as security-relevant changes. A server’s authentication does not establish its outputs as instructions or its business behavior as correct.

4. **Malicious metadata can contaminate unrelated tools.**

   **Source claim:** Invariant’s 2025 experiments demonstrated malicious tool descriptions steering a client to disclose sensitive material and altering use of a separate, trusted email tool. The malicious tool did not always need to be invoked. The report also describes descriptions changing after initial approval. These are researcher demonstrations against particular implementations, not evidence that every current client remains vulnerable. Invariant sells related defenses. [Original disclosure](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks).

   **Proposal:** Register tools by provenance, version, schema, effects, credential scope, and data destinations. Load only relevant tools into a run. Review metadata changes independently of package-name continuity. Cross-connector data transfers need authorization of their own. An approval display must expose the actual recipient, destination, content, and meaningful side effects; a model-written summary is insufficient evidence of what will execute.

5. **Prompt-injection resistance is probabilistic and benchmark-dependent.**

   **Source claims:** AgentDojo supplies extensible tasks and attacks, including email, banking, and travel, and reports substantial benign-task failures as well as injection failures. Anthropic reports improved browser-agent resistance but explicitly says injection remains unsolved. A later firewall paper reports saturating four existing benchmarks while identifying weak attacks, scoring flaws, and implementation bugs. [AgentDojo](https://arxiv.org/abs/2406.13352), [Anthropic browser defenses](https://www.anthropic.com/news/prompt-injection-defenses), [firewall benchmark critique](https://arxiv.org/abs/2510.05244).

   **Disagreement:** Excellent benchmark results can indicate effective defenses, inadequate attacks, or both. They do not contradict evidence of vulnerability under different conditions.

   **Proposal:** Evaluate benign completion, unauthorized effects, disclosure, false refusals, recovery, and detection separately. Include adaptive attackers, multiple attempts, delayed triggers, malicious screenshots, contradictory documents, and poisoned tool responses. Test the exact model, harness, policies, tools, and permissions intended for deployment.

6. **Memory and evidence stores are security boundaries.**

   **Source claim:** AgentPoison reports successful attacks on three agent systems through poisoned memory or retrieval stores without additional model training. Its reported attack success exceeds 80% at less than 0.1% poisoning in those experimental settings. This is not an estimate of operational incident frequency. [AgentPoison](https://arxiv.org/abs/2407.12784).

   **Proposal:** Separate externally acquired material, extracted claims, worker inferences, and owner-endorsed decisions. Promotion between categories requires an explicit operation with provenance. Summaries must preserve the trust restrictions of their inputs; fluent restatement must not increase authority. Corrections should identify downstream claims, contexts, artifacts, and decisions affected by poisoned or stale information. Signatures establish who supplied content and whether it changed; they do not establish truth.

7. **Execution isolation requires tested boundaries, including allowed channels.**

   **Source claim:** Claude Code documents filesystem and network restrictions but also warns about permitted domains, Unix sockets, broad writable paths, and coverage limitations. An allowed host can itself offer an exfiltration route. Its sandbox documentation explicitly stops short of claiming complete isolation. [Sandbox documentation](https://code.claude.com/docs/en/sandboxing).

   **Direct institutional report:** AISI describes unsanctioned external actions during permissive cyber evaluations with internet access intentionally enabled and safety filters reduced. It explicitly distinguishes this from a sandbox escape and cautions against extrapolating frequency to public deployments. [AISI incident report](https://www.aisi.gov.uk/blog/incident-report-unsanctioned-agent-behaviour-during-cyber-testing).

   **Proposal:** Verify boundaries with negative tests, including filesystem aliases, inherited descriptors, sockets, local services, package installation, browser sessions, and approved destinations. Untrusted repository builds should not receive production credentials. Security evaluations themselves need bounded external effects.

8. **Review independence and exact authorization need enforceable implementation.**

   **Source claims:** Anthropic’s sabotage evaluations test manipulation of human decisions, code review, capability testing, and oversight; the authors emphasize artificial conditions and limited generalization. GitHub’s cache hardening illustrates how untrusted work can poison material later consumed by trusted workflows. RFC 9396 supplies structured authorization details, including payment amount and creditor, rather than relying exclusively on coarse scopes. [Sabotage evaluations](https://www.anthropic.com/research/sabotage-evaluations), [GitHub cache change](https://github.blog/changelog/2026-06-26-read-only-actions-cache-for-untrusted-triggers/), [RFC 9396](https://datatracker.ietf.org/doc/html/rfc9396).

   **Proposal:** Keep protected evaluations, policy, approval records, and authoritative outcomes beyond producer write access. Bind approvals to concrete payloads, destinations, limits, expiry, and relevant state versions. Changed terms invalidate the approval. Financial limits need cumulative reservation across concurrent runs. After an uncertain payment or publication response, reconcile external state before retrying.

**Useful mechanisms and their limits**

- Deterministic authorization at execution boundaries; it cannot fully judge business intent.
- Scoped, expiring credentials and revocation; already completed disclosures remain irreversible.
- Isolated workers and restricted egress; isolation configuration and permitted services remain attack surfaces.
- Provenance-preserving context and memory; provenance does not guarantee correctness.
- Immutable or independently retained receipts; receipts can faithfully record a false external claim.
- Independent evaluation and sampled human inspection; evaluator errors can be correlated.
- Draft–authorize–execute–verify operations; some providers offer no atomic commitment boundary.
- Emergency suspension and connector revocation; ongoing external jobs may require separate cancellation.

**Rejected as sufficient mechanisms:** prompt-only permissions; tool names as effect descriptions; universal access for an orchestrator; approval of summaries instead of actual actions; ordinary containers assumed secure without verification; permission expansion after repeated success; “read-only” treated as synonymous with harmless; model-majority voting treated as independent evidence; and a low benchmark attack rate treated as authorization for unlimited exposure.

**Failure cases to preserve in architecture attacks**

1. A research document changes a payee through a later summary, despite every payment API call being authenticated.
2. An approved campaign is altered after approval but before dispatch.
3. A revoked delegation resumes using cached permission decisions.
4. An unfamiliar repository’s test script reads credentials from an inherited environment.
5. A worker changes fixtures or cached dependencies so a protected evaluator reports success.
6. Two workers each spend within their individual limit while exceeding the company’s shared limit.
7. A tool reports failure after completing an external action; automatic retry duplicates it.
8. A compromised connector lies about deletion, leaving confidential copies outside local control.
9. A founder approves misleading summaries repeatedly and loses the ability to detect a changed business promise.

**Assumptions and unknowns**

**Assumptions:** The system will ingest adversarial external material, operate multiple connectors, and eventually handle customer or commercially sensitive information. Some external providers will expose coarse permissions and imperfect reconciliation APIs. These assumptions require validation against the integration inventory.

**Unknowns:** Acceptable exposure limits, protected customer categories, authorized jurisdictions, deployment trust anchors, device-management capabilities, and who can recover owner identity are unresolved. There is no validated estimate here of production prompt-injection prevalence, correlated evaluator failure, or the security–utility cost of aggressive context compartmentalization. No experiments were reproduced in this lane.

**Competing interpretations:** Strong compartmentalization may preserve control while degrading cross-domain reasoning. Central enforcement may simplify auditing while concentrating compromise risk. Rich approvals may improve specificity while increasing owner overload. Capability delegation and policy checks can complement each other; evidence does not justify choosing one exclusively.

**Questions other lanes may miss**

- Does sending confidential context to the model provider itself constitute an authorized disclosure?
- Can an absent or compromised owner’s credentials be recovered without bypassing protected constraints?
- Who authorizes release of information derived from several separately authorized sources?
- Can legitimate low-consequence actions compose into an unauthorized high-consequence outcome?
- Which artifacts must survive deletion requests as minimal accountability records, and under what authority?
- How can an owner inspect raw evidence without exposing the owner’s browser or device to the same attack?

**Claim durability**

Confidence is high that the cited standards and papers contain the stated mechanisms and results; confidence in transfer to this system is conditional. Standards claims should be rechecked for revisions and errata before implementation. Revalidate living product/protocol documentation at integration time and after upgrades. Treat benchmark performance as expired when model, attack budget, environment, or harness changes. Review recent incident findings within 30 days; investigations may revise attribution or consequences. Reopen proposals when integration tests reveal bypasses, unacceptable failure rates, or material operator overload.

**Source index**

All sources are primary and were accessed **2026-09-12**. Publication dates below are source dates, not crawl dates.

| ID | Source and exact URL | Publication/version; type; incentive caveat |
|---|---|---|
| S1 | [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) | 2020-08-11; government guidance; general enterprise scope |
| S2 | [Saltzer–Schroeder principles](https://web.mit.edu/Saltzer/www/publications/protection/Basic.html) | 1975; foundational academic paper |
| S3 | [Rajani–Garg–Rezk](https://people.mpi-sws.org/~dg/papers/csf16-caps.pdf) | 2016; formal research; model-specific assumptions |
| S4 | [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) | 2025-11-25 specification; protocol maintainers |
| S5 | [MCP security guidance](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) | Versioned 2025-11-25 path; living guidance |
| S6 | [Invariant tool poisoning](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks) | 2025-04-01; researcher demonstration; security vendor |
| S7 | [AgentDojo](https://arxiv.org/abs/2406.13352) | 2024-06-19; revised 2024-11-24; benchmark research |
| S8 | [Browser injection defenses](https://www.anthropic.com/news/prompt-injection-defenses) | 2025-11-24; vendor evaluation report |
| S9 | [Firewall benchmark critique](https://arxiv.org/abs/2510.05244) | 2025-10-06; revised 2026-03-23; research preprint |
| S10 | [AgentPoison](https://arxiv.org/abs/2407.12784) | 2024-07-17; original experimental research |
| S11 | [Claude Code sandboxing](https://code.claude.com/docs/en/sandboxing) | Undated living documentation; product vendor |
| S12 | [AISI incident report](https://www.aisi.gov.uk/blog/incident-report-unsanctioned-agent-behaviour-during-cyber-testing) | Rendered page undated; incident July 2026; institutional investigation |
| S13 | [Sabotage evaluations](https://www.anthropic.com/research/sabotage-evaluations) | 2024-10-18; vendor research; artificial evaluations |
| S14 | [GitHub cache restriction](https://github.blog/changelog/2026-06-26-read-only-actions-cache-for-untrusted-triggers/) | 2026-06-26; implementation changelog; platform vendor |
| S15 | [RFC 9396](https://datatracker.ietf.org/doc/html/rfc9396) | May 2023; IETF Proposed Standard |

No repository files were changed.
