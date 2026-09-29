> Archival provenance — 2026-09-12: This separate builder/scribe turn archives the completed read-only judgment below from base `642ee8b290e321b61912e492a50e92fa63bfb95c`. This archival turn has repository write access; the judgment turn performed no repository writes and its independence was procedural, not hardened isolation. The substantive report is unchanged. Relative navigation targets were adjusted from their original planning/reviews context to this research/reviews location; two Markdown hard breaks were normalized to blank lines for whitespace validation. The reviewed subject remains `b9aee22a6589df5037573b172292b49c0abb64e5`; archival is not Phase G acceptance.

# Bounded epistemic traceability audit

**Subject:** `b9aee22a6589df5037573b172292b49c0abb64e5`

**Review date:** 2026-09-12

**Disposition:** One low-severity claim-maintenance gap. No unsupported promotion of architectural superiority, or missing core alternative/reasoning trace, was found in the examined decision chain. This is not Phase G acceptance.

The audit covers directive §6/§8.3, AD001–010, their selected research dependencies, and consequential substrate choices in specification 01/02. I read frozen repository content, followed claim-bearing passages beyond their locators, and made limited new primary-source checks. I did not read 05–08 or consult specification authors.

I previously authored N01, the substrate source audit, architecture/evidence reviews and the preparatory G protocol. Those artifacts are antecedent evidence, not independent corroboration of themselves. I did not repeat their native-execution, PostgreSQL witness or nftables checks, or the earlier six-claim factual audit. The read-only restriction was procedural, not hardened tool isolation. No repository writes, runtime tests, model execution, deployment or spending occurred.

## EPT-01 — Low: new substrate evidence lacks an explicit complete claim-maintenance scope

**Evidence:** [01-contract-kernel.md](../../planning/specification/01-contract-kernel.md#13-primary-evidence-and-design-boundaries), lines 368–379; [02-authority-recovery.md](../../planning/specification/02-authority-recovery.md#15-primary-evidence-and-residual-obligations), lines 465–484. Concrete reliance appears in 01 lines 9/23 and 02 lines 65–71.

These tables correctly provide an access date, identify primary documentation, and separate supported primitives from the composed design. The source index correctly describes itself as a locator. However, for newly introduced sources such as Node, Ajv, Keycloak and openid-client, the chain does not clearly supply or inherit the fuller claim-maintenance treatment found in the research lanes: source publication/version date or explicit unknown, assessed confidence, institutional interests, corroboration limits, and a source-claim revalidation/invalidation rule.

For example, [L06](../L06-evaluation.md#sources-dates-incentives-confidence-and-invalidation), lines 19–43, and [L10](../L10-economics.md), lines 96–119, explicitly distinguish historical attribution, current applicability, confidence and review triggers. The new source tables do not state that those policies cover them. Their source-index entries point back to the same tables.

**Trigger → failure → consequence:** a living documentation page, maintenance policy or security interpretation changes while the selected executable version remains unchanged → a future reader can find the citation and dated assertion but cannot reliably determine the recorded confidence or claim-specific applicability review → a historical source observation may continue supporting a current selection without its uncertainty being reassessed.

The runtime controls partly mitigate this. Kernel lines 23 and 341 require supported patches, pinned configurations, admission expiry and change testing. They do not fully replace the planning evidence map’s metadata: software admission and the status of the source assertion are different objects.

**Required resolution:** provide one shared metadata/maintenance record covering these new source claims, with exceptions where necessary. Existing source records may satisfy this by an explicit reference. Do not repeat boilerplate beside every sentence, fabricate publication dates, or claim independent corroboration where none occurred.

**Discriminating check:** starting with “Keycloak 26.7.3 is the selected maintained distribution,” a reviewer must be able to recover the dated supporting observation, source/version identity or unknown date, narrow confidence, source interests, verification/corroboration limits, and conditions that reopen present reliance—even if no package upgrade has yet occurred.

**Dimensions affected:** Traceability, Evidence quality, Unknown integrity, Changeability.

This is a bounded evidence-map repair, not evidence that these products are unsuitable or that the architecture must change.

## Decision trace results

All AD records preserve alternatives, an epistemic basis, accepted costs and reopen triggers; none claims implementation evidence. Their supporting synthesis supplies the missing reasoning rather than merely multiplying references.

| Decision | Examined trace and conclusion |
|---|---|
| **AD001 — common authority** | Decisions lines 3–30; selection lines 25–40; L13 lines 19–27. Fewer internal coordination contracts is explicitly a structural inference. CMMN supports adaptive case mechanisms, not centralization’s superiority. S0, B and C2 retain substantive winning conditions. |
| **AD002 — execution allocation** | Decisions lines 33–60; selection line 64; L02 lines 79–85; L03 lines 68–99. Deterministic work, durable waiting, model interpretation and actual human performance are a design allocation. Persistent identity’s benefit remains unproved. |
| **AD003 — ordered release** | Decisions lines 63–91; selection lines 76–88; kernel alternatives lines 15–21. Independent checks, provider idempotency and primary logs are rejected for named recovery/ordering requirements. Conceptual review is not presented as implementation proof. I did not revalidate the underlying PostgreSQL claims here. |
| **AD004 — native meaning and lineage** | Decisions lines 94–123; selection lines 92–100; L05 lines 21–33/74–92; L13 lines 41–49. Selective integration remains a proposal with mapping and over-invalidation costs. Conflicting graph/flat-retrieval findings retain their different implementations and limited transfer. |
| **AD005 — protected interpretation** | Decisions lines 126–154; selection lines 100–104; L06 lines 7–17/43–55. Authentic capture, interpretation and truth remain separate. Shared-model agreement is not promoted to independent confirmation; conceptual closure does not establish absence of false evidence. |
| **AD006 — owner participation and redress** | Decisions lines 157–186; selection lines 133–141; L09 lines 22–40/71–86; CF1 lines 106–114. Founder-required competence preservation is separated, through the supporting passages, from the selected participation mechanism. Cadence, delayed transfer, affordability and competent capacity remain unvalidated. |
| **AD007 — separate resource accounts** | Decisions lines 189–217; selection lines 157–159; L10 maintenance table. Founder subscription assumptions remain distinct from current rights, observed allowance and money. Revalidation precedes reliance or surface change. No native-policy checks were repeated. |
| **AD008 — protected improvement** | Decisions lines 220–248; selection lines 102–104; L12 lines 82–103. Benchmark findings motivate bounded controls. Their denominators, exceptions, author interests and transfer limits do not become evidence of company-wide improvement. |
| **AD009 — complete lifecycle performance** | Decisions lines 251–278; selection lines 108–127/141. The scope comes from the directive. Capability labels, packets and internal acceptance are expressly insufficient evidence of actual performance or discharge. This audit did not reassess the complete catalog. |
| **AD010 — selective repository reuse** | Decisions lines 281–309; selection lines 161–165; repository observations R15/R17; baseline-results B01/B02. Direct observations, historical documentation and inferences remain distinct. R17 narrows one failure explanation without claiming a fix or test rerun; retaining two unresolved baseline failures is consistent with that evidence. |

## Selected substrate decisions retain useful boundaries

Kernel lines 13–23 explain the choice against SQLite/local files, asynchronous recovery, synchronous standby alone, additional workflow infrastructure, independent issuers and custom consensus. “SQL outbox/timers suffice” is bounded by the lack of a demonstrated additional need and the explicit unmeasured-throughput limitation at line 343; it is not a reported performance result.

Authority/recovery lines 27–38 identify initial sizing as an estimate, AWS placement as a reproducible reference choice, ordinary Linux VPS placement as potentially cheaper, and separate administration as an actual prerequisite. Co-located R/G explicitly shares a trusted root. The future priced comparison is visibly unfinished; the text does not infer founder funding or willingness.

The examined time and transport paragraphs preserve the distinction between chosen numerical bounds, trusted-root assumptions and observed implementation behavior. This is a traceability finding only; it does not revalidate the underlying controls.

Limited primary checks on **2026-09-12** corroborated three narrow observations:

- The Node release page identifies v24 as LTS and displays v24.21.0. This supports the dated baseline, not comparative system suitability. [Node release page](https://nodejs.org/en/about/previous-releases)
- Keycloak’s download page identifies 26.7.3 and marks its Node adapter deprecated. It does not validate the proposed authentication composition. [Keycloak downloads](https://www.keycloak.org/downloads)
- openid-client’s repository describes the relevant OAuth/OIDC capabilities and PKCE usage. It also exposes sponsorship; that is provenance context, not evidence of incorrect behavior. [openid-client](https://github.com/panva/openid-client)

The step-ca production page failed retrieval twice in this audit. I make no new verification claim about it and do not treat retrieval failure as disproof.

## Preserved disagreements and limits

Selection line 171 retains EAS-R1’s separate comparisons: each candidate’s own rights, matched business effectiveness, representation under equivalent rights, and adaptive A versus compulsory inquiry jurisdiction. Neither conformance to S1’s own rules nor representation equivalence is substituted for evidence against C2’s potential business value.

The observed decision chain also preserves central authority versus native autonomy, selective versus common semantics, participation benefit versus attention cost, and S1 versus the simpler S0 comparator. None is resolved through an aggregate score.

EPT-01 should be repaired before claiming complete directive §6/§8.3 conformance for the examined substrate evidence. The audit establishes no additional foundational blocker in AD001–010. Full-plan coverage, executable contract coherence, costs, operating authority, actual continuity and empirical business/owner outcomes remain outside this disposition.
