> Archival provenance — 2026-09-12: This separate builder/scribe turn archives the completed source audit below verbatim, with this note as the only addition, from archival base `a19203808e26c8ab9b58814e151a72c2f9a9d5d2`. The judgment was formed in a read-only research turn without reading Phase F drafts. This archival turn has repository write access; the earlier read-only boundary was procedural, not hard isolation. No runtime tests, actual configuration inspection, deployment or spending formed part of the audit. Archival link and whitespace checks do not constitute implementation or whole-plan acceptance.

**Source-audit judgment — 2026-09-12**

The PostgreSQL mechanism is feasible with an explicit witness protocol. The nftables mechanism supports a narrower, clock-dependent admission check; an unconditional UTC cutoff or permanent expiry guarantee is unsupported. The proposed infrastructure has identifiable prerequisites and costs, but neither its sizing nor economic adequacy is established.

I reviewed primary documentation and source only. I did not read Phase F drafts, consult their authors’ conclusions, inspect authentication, execute tests, deploy anything or spend money. The revised topology—A, co-located R/G, and separate ephemeral N/X—supersedes the earlier five-VM proposal. Common AWS-root failure remains explicitly excluded.

**1. PostgreSQL 18: feasible observation path, not automatic witness certification**

**Documented guarantee.** With nonempty `synchronous_standby_names`, `synchronous_commit=remote_apply` waits for the selected synchronous standby’s acknowledgment that the commit was applied, made query-visible and written durably. With an empty standby list, `remote_apply` provides only local synchronization. The setting is transaction-sensitive and can be changed, including through `SET LOCAL`. Therefore a default configuration value does not prove the behavior of every consequential transaction. [PostgreSQL 18 WAL configuration](https://www.postgresql.org/docs/18/runtime-config-wal.html).

PostgreSQL transactions can make multiple application rows visible atomically. On a hot standby, replaying the commit makes those changes visible to **new snapshots**. This supports observing a committed application group when its actual grouping and completeness conditions are defined. A group spanning separate transactions, external blobs or multiple databases does not acquire atomicity merely by sharing an application identifier. [Transactions](https://www.postgresql.org/docs/18/tutorial-transactions.html), [hot-standby visibility](https://www.postgresql.org/docs/18/hot-standby.html).

A hot standby cannot accept ordinary SQL writes, including temporary-table writes. A writable witness therefore requires a separate writable PostgreSQL instance/cluster or another writable store; another database inside the recovering physical cluster is insufficient. Co-locating that second cluster on R is technically possible, but supplies no independence from R’s host, storage or administrator failure. [Hot-standby restrictions](https://www.postgresql.org/docs/18/hot-standby.html).

**Important failure behavior.** Synchronous waiting occurs after local commit. PostgreSQL 18’s `SyncRepWaitForLSN` explicitly handles cancellation by ending the wait with a warning that the transaction committed locally but might not have replicated. Administrative termination similarly preserves local commit uncertainty while terminating the connection. Thus cancellation, timeout or disconnect must not be interpreted as rollback, nor may a driver’s convenient success/status abstraction replace replication evidence. [PostgreSQL 18 synchronous-replication source](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/replication/syncrep.c).

If required standbys disappear, commits can remain waiting indefinitely. Priority or quorum configuration can substitute other named standbys; acknowledgment does not inherently identify the particular independently administered R the application intended. Standby queries can also conflict with replay, producing query cancellation or replay delay. These are availability and latency costs, not reasons to relax the guarantee silently. [Synchronous-replication operation](https://www.postgresql.org/docs/18/warm-standby.html#SYNCHRONOUS-REPLICATION), [standby query conflicts](https://www.postgresql.org/docs/18/hot-standby.html#HOT-STANDBY-CONFLICT).

**Inference and implication.** An authenticated witness can read an exact committed group from the intended standby and durably preserve its observation before an application issues an accepted or dispatch-authorizing response. PostgreSQL supplies useful ingredients; it does not supply that complete protocol.

A primary row or ordinary status lookup alone proves neither independent durability nor witness acknowledgment. A positive standby observation is stronger evidence of application there, but does not establish the separate witness’s durable recording, complete channel membership, required group contents, current authorization, or survival after losing R. Physical replication also reproduces primary data changes; separate administration does not make the replica an immutable historical archive.

**Required validation, not executed:**

- Establish exact group membership, immutable contents, source identity and generation, witness evidence and durability boundary.
- Exercise every accepted/status/dispatch-authorizing response route, including cached responses and recovery queries.
- Interrupt local commit, replication, replay, witness read, witness commit and every acknowledgment independently.
- Include cancellation, driver warnings, standby substitution, stale snapshots, replay conflicts and primary loss.
- Show that missing witness evidence produces uncertainty or refusal, while a previously witnessed group remains recoverable under the declared failure.
- Verify that no session or administrative fallback silently weakens synchronous settings.

The strongest counterexample is a locally committed release row followed by interrupted replication: a second connection reads it and dispatches while the required independent evidence never existed.

**2. nftables: a real evaluation-time predicate, with important limits**

**Source-level finding.** Both Linux v6.12 and current upstream `nft_meta.c` implement `NFT_META_TIME_NS` by calling `ktime_get_real_ns()` during expression evaluation. It reads current kernel realtime; it does not consult an immutable packet-arrival timestamp. Linux 6.12 remains a listed long-term kernel line, but an eventual distribution build and userspace version still require qualification. [Linux v6.12 implementation](https://github.com/torvalds/linux/blob/v6.12/net/netfilter/nft_meta.c), [current upstream implementation](https://github.com/torvalds/linux/blob/master/net/netfilter/nft_meta.c), [kernel release status, dated February 25, 2026](https://www.kernel.org/category/releases.html).

**Clock qualification is essential.** Kernel documentation defines this clock relative to the Unix epoch/UTC and expressly permits backward jumps from clock setting, NTP adjustment or leap-second handling. It is not monotonic. A predicate comparing realtime with an absolute deadline can therefore become true again after having become false. [Kernel timekeeping documentation](https://docs.kernel.org/core-api/timekeeping.html).

For example, after a deadline passes, resetting the host clock backward can admit another packet under the unchanged rule. Rebooting with an incorrect clock and restoring old rules creates a related case. A polling clock-health monitor does not, by itself, exclude packets between a clock change and detection. The claim needs an explicit trustworthy-time/error boundary and fail-closed reset behavior; stock `meta time` alone supplies neither.

**Encoding also needs verification.** The current manual describes integer Unix timestamps, while the nftables wiki—last edited March 28, 2024—describes integer nanoseconds. I inspected the released **nftables 1.1.3** source archive in memory: `src/meta.c`’s `date_type_parse` converts integer seconds to nanoseconds; date-string parsing applies a local timezone offset. Kernel nanosecond storage therefore does not imply that an arbitrary userspace timestamp literal has nanosecond resolution or UTC interpretation. [nftables manual](https://netfilter.org/projects/nftables/manpage.html), [time-selector wiki](https://wiki.nftables.org/wiki-nftables/index.php/Matching_packet_metainformation#Matching_by_time), [upstream 1.1.3 source archive](https://www.netfilter.org/projects/nftables/files/nftables-1.1.3.tar.xz).

**Every-packet scope is conditional.** A forwarding-hook rule can evaluate each relevant packet traversing that path, including packets of established connections. The claim requires that no earlier verdict within its rule path, alternate route, namespace, address family or acceleration mechanism bypasses the evaluation. Host-originated traffic uses the output path rather than automatically traversing forward. Netfilter flowtable hits explicitly bypass the classic forwarding hooks after ingress, and hardware offload introduces another bypass. [Kernel flowtable documentation](https://docs.kernel.org/networking/nf_flowtable.html).

The proposed per-job WireGuard interface can identify a routed job path, but its existence does not prove that N has no direct cloud/host egress. That requires inspection and testing of actual interfaces, routes, IPv4/IPv6 paths and administrative privileges.

**Admission is not transmission or acceptance.** A packet can pass the check before the deadline and then remain buffered, be delayed by scheduling, or await NIC transmission. Segmentation offload can turn one evaluated buffer into multiple later wire frames. “Every packet” must distinguish evaluated kernel buffers from wire-level transmissions. [Linux segmentation-offload documentation](https://docs.kernel.org/networking/segmentation-offloads.html).

Cutting off a connection midway through a request does not prove no effect occurred: the provider may have processed an earlier portion, or the complete request may already be buffered remotely. Conversely, dropping later acknowledgments can make an accepted operation appear unsuccessful. No-pooling, no-HTTP/2, no-redirect and no-retry constraints are separate transport/client claims, not properties established by packet filtering.

For opaque native clients, the disclosed **job-launch, wall-time, process, output and network bounds** are defensible units to investigate. They must not become invented per-request quotas or assertions that remote processing stops when local egress stops.

**Required validation, not executed:** pin kernel/userspace versions and compiled deadline encoding; test equality and precision boundaries, timezone/DST, backward/forward steps, suspend and reboot; inspect all hooks and bypasses; test established traffic, retransmission, alternate routes and offloads; distinguish packets delayed before versus after the check; and exercise partial requests and delayed provider acceptance.

The supported claim is a predicate at a named evaluation boundary using the host’s qualified realtime. Stronger delivery-time, irreversible-expiry or provider-acceptance claims require additional evidence and enforcement.

**3. Operational prerequisites and cost categories**

The superseding proposal places primary A in `eu-central-1`, R’s standby and writable witness in `eu-west-1`, G as a separate privilege/network boundary on R, and N/X on separate ephemeral VMs or devices. Four machines are neither demonstrated necessary nor demonstrated sufficient.

The supplied CPU, memory and storage numbers are **unvalidated sizing assumptions**. Qualification needs workload, concurrency, WAL generation/retention, database growth, replay and witness load, gateway traffic, build-cache needs, restore duration and storage IOPS/throughput. Co-located R/G couples replay, witness persistence and forwarding to the same host resources and maintenance outages.

Minimum operational prerequisites include:

- Actually independent administration and recovery access between A and R, with explicit common IAM, organization, billing, MFA and key-recovery dependencies.
- Protected database and witness credentials, authenticated replication/observation, retained recovery material and demonstrated restore access.
- Gateway rule authority unavailable to ordinary workers, complete routing controls and a declared clock failure policy.
- Owner-authorized native authentication on N, credential-free execution on X, and verified separation of subprocess, metadata-service, storage and network access.
- Accepted funding, regional data authority, ongoing maintenance capacity and a reachable recovery operator.

These are operational requirements, not evidence that the necessary people or permissions currently exist.

Keycloak and step-ca add real dependencies. Current Keycloak guidance requires a production database and production TLS; step-ca guidance requires protecting root/intermediate keys and managing certificate renewal and rotation. A-hosted identity services must not become an undisclosed dependency for R/G recovery after losing A. Exact Keycloak 26.7.3/openid-client 6 compatibility and the recovery behavior of the proposed integration were not certified here. [Keycloak database guidance](https://www.keycloak.org/server/db), [Keycloak TLS](https://www.keycloak.org/server/enabletls), [step-ca production guidance](https://smallstep.com/docs/step-ca/certificate-authority-server-production/).

A priced BOM must include continuous and ephemeral compute; EBS capacity, IOPS and throughput; snapshots, retained WAL and restore copies; cross-region and internet transfer; public addresses; any NAT/endpoints; logging, monitoring and retained evidence; DNS/certificates/key services where selected; backup exercises; upgrades, incidents and administrator labor. AWS separately charges for relevant storage performance, network resources and transfer categories. Ephemeral workers can leave chargeable storage or addresses behind. [EC2 pricing categories](https://aws.amazon.com/ec2/pricing/on-demand/), [EBS categories](https://aws.amazon.com/ebs/pricing/), [VPC categories](https://aws.amazon.com/vpc/pricing/).

No prices, founder budget or availability were assumed. Co-locating G removes one proposed VM but does not establish affordability or eliminate operational complexity.

**Disposition:** PostgreSQL witness feasibility is conditionally supported. nftables supports a precisely scoped packet-evaluation boundary, with unresolved clock and deployment proof obligations. The topology remains a proposed operating arrangement whose independence, sizing, cost and useful availability require validation. None of these source checks constitutes implementation or whole-plan acceptance.
