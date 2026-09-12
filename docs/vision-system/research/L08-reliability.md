# L08 — Reliability, durable execution, and incident recovery

Reliability must preserve a truthful account of commitments and consequences across interruption. A process restarting successfully is insufficient if it repeats an invoice, revives cancelled outreach, loses a customer's deletion request, or conceals an unfinished refund.

**Founder constraint:** the [vision](../inputs/THE-VISION-AND-THE-FIELDS.md) and [directive](../inputs/directive-contract.json) require continuity across models, providers, sessions, machines, and capacity interruptions; autonomy follows consequence, with no silent paid fallback. This lane informs fields 2, 6, 9–10, 15–20, 22, 24, 26, 28, 31–32, 35–39, 42, 45, 48, and business winding down. Architecture remains unselected.

Evidence was accessed **2026-09-12**. **SC** means Source claim; **I** means Inference; **P** means Design proposal; **U** means Unknown. SC confidence is high about what the source documents, not independent verification of implementation. Inferences/proposals have medium confidence unless stated otherwise. Product claims expire **2026-12-12**, or immediately when the relevant version, connector contract, storage configuration, or deployment changes. Historical findings expire for applicability review **2027-09-12**; corrections invalidate them sooner. No runtime experiments or performance comparisons were conducted.

## Findings and transfer limits

**F1 — Durable execution has a defined replay boundary. [SC]** Temporal reconstructs execution from recorded history and checks replayed commands. Restate records nondeterministic operations through durable steps. DBOS stores workflow inputs and step outputs in Postgres, reuses completed results, and requires deterministic workflow code plus retry-safe steps. These systems corroborate a common mechanism; they do not establish equivalent guarantees or operational costs. [Temporal](https://docs.temporal.io/workflow-execution), [Restate](https://docs.restate.dev/develop/ts/durable-steps), [DBOS](https://docs.dbos.dev/architecture).

**[I]** A stored model response can become replayable data; generating another response is new work. A checkpoint cannot preserve a judgement, omission, or external effect that was never recorded. Transferable: separate durable progress from replaceable execution. Nontransferable: assuming a vendor session transcript is a complete continuation format. Reopen when the checkpoint boundary or serialization changes.

**F2 — Exactly-once claims require a cooperating effect boundary. [SC]** RIFL couples operation effects atomically with durable completion records, migrates them together, and uses leases to prevent retries after completion records are discarded. Its RAMCloud implementation establishes feasibility under those assumptions, not universal exactly-once behavior for third-party tools. An outbox atomically records a local change and the intent to publish, but its delivery may duplicate. Stripe documents pruning idempotency keys after at least 24 hours, with a reused pruned key treated as a new request. [RIFL, §§3–4](https://web.stanford.edu/~ouster/cgi-bin/papers/rifl.pdf), [AWS outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html), [Stripe](https://docs.stripe.com/api/idempotent_requests).

**[I]** Recovery after a week can exceed a recipient's deduplication horizon. Preserve logical operation identity, exact parameters, attempt identities, receipts, and unresolved outcomes. AWS's practice of rejecting reused identifiers with changed parameters reinforces the distinction between retry and changed intent. A timeout after transmission belongs in an **unknown-effect** state until reconciliation establishes what happened. Reopen on retention or recipient behavior changes. [AWS idempotency](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).

**F3 — Compensation changes consequences; it does not erase history. [SC]** The original Sagas paper permits interleaved subtransactions and semantic compensation without restoring the exact prior database state; other transactions may have observed intermediate effects. It explicitly recognizes actions without a possible compensation. [García-Molina and Salem](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf).

**[I]** A refund does not unsend a promise, and account closure can leave reporting obligations. Compensation needs its own authority, attempt history, deadline, and failure state. An unavailable compensating service leaves a continuing obligation. The useful assumption is identifiable corrective actions; the dangerous assumption is that every business commitment is reversible.

**F4 — Liveness detection is weaker than exclusive authority. [SC]** Redis's own locking documentation calls for fencing tokens and warns that wall-clock shifts can undermine TTL-based exclusivity. PostgreSQL requires preventing a recovered former primary from continuing as primary after failover. [Redis](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/), [PostgreSQL failover](https://www.postgresql.org/docs/18/warm-standby-failover.html).

**[I/P]** A worker may heartbeat while looping, or wake after its lease expires and another worker takes over. Track meaningful progress separately; require the resource accepting a write to reject obsolete execution epochs or stale versions. A token recorded only in the coordinator cannot fence an external endpoint that ignores it. Concurrency must be scoped to the actual shared resource—customer, account, budget, document—not merely task identity. Isolation limits damage between ventures; it does not resolve shared-account conflicts. Reopen whenever a write bypasses the enforcing boundary.

**F5 — Calendar recovery is a business policy. [SC]** Kubernetes acknowledges duplicate or missing CronJob creation, scopes concurrency policy to one CronJob, and limits catch-up after more than 100 missed schedules in its evaluation window. Apple's archived guide distinguishes calendar jobs missed during sleep from those missed while powered off: the former run on wake; the latter wait for the next occurrence. [Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/), [Apple](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/ScheduledJobs.html).

**[P]** Specify scheduled time, time zone, deadline, occurrence identity, and catch-up choice: replay all, coalesce, skip, or escalate. Daily research may coalesce; unpaid invoices require individual reconciliation; expired campaigns should not burst outward after reconnection. Represent offline periods and omissions explicitly. Test daylight-saving changes, clock jumps, sleep, reboot, and absent network. **U:** Apple's 2016 guidance is historical; current target-machine behavior requires verification before use.

**F6 — Retrying indefinitely can violate the mission. [SC]** Restate documents infinite retries with exponential backoff by default, with terminal errors and configurable limits. [Restate errors](https://docs.restate.dev/develop/ts/error-handling).

**[P]** Separate transient transport faults, throttling, exhausted subscription capacity, authentication failure, invalid requests, policy refusal, corrupted state, and unknown effects. Apply bounded attempts, elapsed-time budgets, jitter, and dependency-level concurrency limits. Repeated identical failures without meaningful progress should become visible blocked work. Capacity exhaustion should durably park eligible work until a verified reset or authorized alternative is available; it should not consume repeated model calls to rediscover the limit. Maintain distinct waiting-for-capacity, waiting-for-credentials, waiting-for-owner, and dependency-unavailable states. Reopening requires new evidence or changed conditions, not another timer alone.

**F7 — Cancellation needs evidence of containment. [SC]** Temporal documents heartbeat-delivered activity cancellation, which an activity can ignore; cancellation propagation can also be shielded. [Temporal activities](https://docs.temporal.io/activity-execution).

**[I/P]** Distinguish stop requested, further dispatch denied, worker stopped, external operation settled, and compensation complete. Revocation should invalidate authority for queued work and future retries, while a separate cleanup authority may remain necessary. An already accepted external request may finish despite local termination. Never infer “nothing happened” from a killed process. Reopen when an adapter cannot report cancellation or settlement status.

**F8 — Redundancy does not establish recoverability. [SC]** PostgreSQL's default asynchronous replication permits loss of committed transactions at failover; synchronous replication trades additional waiting for stronger durability. Point-in-time recovery needs a base backup and an unbroken WAL sequence, and does not restore configuration changes. GitLab's January 2017 outage exposed absent backups caused by a binary-version mismatch, rejected failure notifications, and missing ownership of recovery testing. [PostgreSQL replication](https://www.postgresql.org/docs/18/warm-standby.html), [PITR](https://www.postgresql.org/docs/18/continuous-archiving.html), [GitLab postmortem](https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/).

**[I/P]** Restore authority, artifacts, schemas, keys, configuration, deduplication records, and deletion/cancellation history consistently. A backup predating revocation can resurrect permission; a restored queue can resend completed work. Restore into containment, reconcile with external systems and independently retained deletion/revocation records, then admit work. Deletion policy must cover backups, logs, and model-output archives, including what becomes impossible to reconstruct. Define acceptable data loss and restoration time separately for each consequence class. A second worker sharing one lost database is not disaster recovery.

**F9 — Incident operations must survive failure of normal operation. [SC]** Google's incident guidance calls for explicit command, a living incident record, controlled operational changes, acknowledged handoffs, and communication infrastructure independent of the failing service. Its staffing model assumes multiple people and does not transfer to one owner. [Google SRE](https://sre.google/sre-book/managing-incidents/).

**[P]** A minimal incident account records affected commitments, first evidence, uncertain effects, containment, failed remedies, current authority, next action, and recovery criteria. Use a reachable fallback surface and deterministic checks that do not require the unavailable model provider. Alert on missing expected evidence, oldest unresolved consequence, overdue commitments, and failed restores—not only process uptime. Owner absence requires predeclared containment and escalation behavior. A recovery dashboard cannot declare success merely because the dashboard recovered.

## Continuation across models, providers, and machines

**[P; medium]** A portable continuation packet should contain intent and constraint versions, decisions with reasons, exact next actions, dependencies, completed and partial artifacts, source manifests, hypotheses, disagreements, omissions, unknown effects, action receipts, authority expiry, capacity state, and compatible execution versions. Store references with integrity checks; redact credentials. A new session should validate the packet and current world state before claiming ownership.

Completed model/tool results should remain attributable to their original provider and version. Switching a provider for an unfinished step creates a new attempt requiring capability, schema, permission, and quality checks; credentials and allowances do not silently transfer. DBOS explicitly describes version-compatible recovery and patching, illustrating that durable state alone does not make changed code safe. [DBOS](https://docs.dbos.dev/architecture).

**U:** no evidence here proves lossless semantic transfer between model families, automatic detection of all subscription reset conditions, or preservation of every terminal session. Pinning an unavailable model forever is also not continuity. The unresolved choice is when to retain compatible execution, migrate state, or stop for renewed judgement.

## Competing models and disagreements

These are **Design proposals**, not selections; confidence is medium and expires at the first workload/recovery trial.

| Model | Useful assumptions | Failure or nontransferable assumption |
|---|---|---|
| Durable task register, one writer, explicit checkpoints, operator recovery | Few concurrent commitments; interruption is tolerable; straightforward inspection | Weak unattended deadlines; recovery consumes scarce owner attention |
| Transactional database state machine, outbox, replaceable workers | Business transitions fit explicit records; database operations skills exist | Bespoke timers, upgrades, fencing, and reconciliation accumulate |
| Dedicated durable-workflow runtime | Long waits and many resumable paths justify runtime machinery | Replay constraints, history retention, migration, and runtime operations remain |
| Reconcile desired state against external state | Effects are observable and repeatable; current correctness matters most | Poor fit for one-time messages, promises, or unobservable irreversible effects |

**Disagreement:** availability can favor retries and rapid takeover; correctness can require stopping uncertain work. Sagas favor progress with compensation; uncompensatable commitments demand a different boundary. Full histories support replay and accountability; minimization and deletion reduce retained evidence. None has a universal winner. Consequence, acceptable downtime, connector observability, and owner capacity decide applicability.

## Unknowns and overlooked questions

Which effect receipts outlive the longest permitted interruption? Can restoring an older backup recreate an operation identity already forgotten by its recipient? What independently preserves revocations when the primary store is corrupted? Who can recover encryption keys if the owner is ill? Which deadlines remain binding after a venture is abandoned? Can the recovery process itself spend money or disclose customer data?

**Required evidence, not completed tests:** interrupt execution before dispatch, after recipient acceptance, and before receipt persistence; wake an obsolete worker after takeover; restore before a deletion; exhaust subscription capacity mid-action; corrupt a checkpoint; remove the original provider; and recover while the owner is absent. Check business outcomes, duplicate effects, authority, lost evidence, and time to trustworthy reconciliation. Workload scale, downtime tolerance, connector contracts, and recovery staffing remain unknown. These gaps prevent architecture selection from this lane alone.

## Source register

All external sources are **primary**. Undated means no publication date established; access date above is not a publication date. Product documentation has vendor adoption incentives; project documentation has ecosystem incentives. Academic work has publication and system-demonstration incentives; its benchmarks are not transferred here. Cross-source corroboration is identified in findings, not assumed from repeated marketing language.

| Source | Date / type | Incentive or limit |
|---|---|---|
| Temporal, *Workflow Execution*; *Activity Execution* (F1, F7 links) | Undated; official product documentation | Commercial adoption; SDK-specific behavior |
| Restate, *Durable Steps*; *Error Handling* (F1, F6 links) | Undated; TypeScript documentation | Commercial adoption; configured defaults matter |
| DBOS, *Architecture* (F1 link) | Undated; official product documentation | Commercial adoption; Postgres and compatible-code assumptions |
| Lee, Park, Kejriwal, Matsushita, Ousterhout, *Implementing Linearizability at Large Scale and Low Latency* (F2 link) | SOSP, 2015-10-04–07; academic paper | Authors implemented evaluated RAMCloud system |
| AWS, *Transactional outbox pattern* (F2 link) | Undated; official engineering guidance | AWS service adoption; local atomic boundary |
| Stripe, *Idempotent requests* (F2 link) | Undated; API contract documentation | Vendor contract; finite retention |
| Malcolm Featonby / AWS, *Making retries safe with idempotent APIs* (F2 link) | Undated; practitioner account | Vendor experience and adoption |
| García-Molina, Salem, *Sagas* (F3 link) | SIGMOD, 1987; academic paper | Database model, semantic compensation assumptions |
| Redis, *Distributed Locks with Redis* (F4 link) | Undated; official technical documentation | Vendor; explicitly documents disputed assumptions |
| Kubernetes, *CronJob* (F5 link) | Undated; project documentation | Ecosystem; version-sensitive semantics |
| Apple, *Scheduling Timed Jobs* (F5 link) | Updated 2016-09-13; archived official guide | Historical platform guidance; current applicability unverified |
| PostgreSQL 18, *Failover*; *Log-Shipping Standby Servers*; *Continuous Archiving and PITR* (F4, F8 links) | Undated; versioned project documentation | Ecosystem; deployment configuration determines guarantees |
| GitLab, *Postmortem of database outage of January 31* (F8 link) | 2017-02-10; incident-owner postmortem | Transparency and reputation; self-reported, historical |
| Andrew Stribblehill / Google, *Managing Incidents* (F9 link) | Earlier article April 2015; book-page copyright 2017 | Practitioner guidance; large-team resources |

No claims about comparative availability, price, operating effort, or present subscription limits were established. Systemd documentation fetches failed; no systemd behavior is asserted. Architecture-neutral implications above remain proposals until implementation and recovery evidence exist.
