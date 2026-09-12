> Archival provenance — 2026-09-12: This separate builder/scribe turn archives the completed read-only recheck verbatim from base `c3519f53cfa03d29c6acb8a067464776d83f27d2`. This archival turn has repository write access; the judgment turn performed no repository writes and its independence was procedural, not hardened isolation. The reviewed subject remains `12e4f8c99cdc0bc3c6e9b325c9a61ab75667d9b4`. Archival adds no new judgment, source verification, runtime evidence or Phase G acceptance.

# EPT-01 metadata-scope recheck

**Subject:** `12e4f8c99cdc0bc3c6e9b325c9a61ab75667d9b4`

**Prior subject:** `b9aee22a6589df5037573b172292b49c0abb64e5`

**Review date:** 2026-09-12

**Disposition:** **EPT-01 closed at the planning evidence-map level.** The repair resolves the original unchanged-package counterexample. No new material defect was found within this bounded scope. This is not Phase G or runtime acceptance.

## Scope and independence

I examined the frozen shared substrate claim register, corresponding source-index references, explicit inheritance in kernel §13 and authority §15, and the additional lexical-source inheritance in knowledge §3.

I compared claim wording and source identities with their actual specification passages and applied the original discriminator. Static parsing and reference checks supported that reading; record counts were not treated as evidence of factual correctness.

I did not consult author self-assessment, browse sources again, modify repository content, or execute runtime tests. I authored the original EPT-01 finding and earlier source audits but did not author this repair. Rechecking their transcription does not independently corroborate their underlying observations. Read-only conduct remained procedural, not hardened isolation.

## Why EPT-01 closes

[substrate-claims.json](../substrate-claims.json), lines 6–25, now supplies an explicitly inherited policy covering ownership, source interests, confidence, unknown dates, freshness, expiry, invalidation, correction and the boundary between source review and runtime acceptance.

The previously implicit relationship is now explicit at:

- [01-contract-kernel.md](../../planning/specification/01-contract-kernel.md#13-primary-evidence-and-design-boundaries), line 368.
- [02-authority-recovery.md](../../planning/specification/02-authority-recovery.md#15-primary-evidence-and-residual-obligations), line 465.
- [06-knowledge-evidence-evaluation.md](../../planning/specification/06-knowledge-evidence-evaluation.md#3-retrieval-ranking-freshness-and-contradiction), line 40, limited to its new lexical-primitive claims.

The first two passages cover both their source tables and corresponding version/mechanism reliance earlier in the contracts. That prevents the maintenance policy from applying only to a bibliography while leaving the consequential assertion outside its scope.

## Original discriminator: Keycloak without a package upgrade

SC-011, register lines 254–288, identifies the source pages, reported observation date, explicit unknown publication dates, scoped confidence and narrow independent observation. The advertised version and deprecated adapter are preserved separately from support-lifecycle, vulnerability and authentication-composition assessment.

The decisive change is in policy lines 14–24:

1. Documentation, security-advisory and maintenance/support changes trigger revalidation even when the installed package remains unchanged.
2. Dependency locking and operational admission require current verification; the scheduled review date is an upper bound, not permission to postpone an earlier relevant check.
3. Overdue, inaccessible or contradicted material loses eligibility as a sole current prerequisite.
4. Corrections preserve historical attribution, identify affected decisions/contracts and reopen relevant reliance.

Thus, if Keycloak remains installed at 26.7.3 while a relevant support or security statement changes, the old release-page observation cannot renew present applicability merely because the binary is pinned. The written policy addresses the original failure sequence.

This establishes the required planning rule. It does not prove that an operating system detects upstream changes or performs the review.

## Coverage and exceptions

| Probe | Result |
|---|---|
| Kernel and authority source tables | Their eight and sixteen assertion rows respectively match SC-001–024 in claim wording and cited URLs. Each claim inherits the common policy. This establishes trace coverage, not source truth. |
| Source-index navigation | Corresponding entries resolve to claim records containing the same source URL. Keycloak references appear at source-index lines 2213–2241. Shared-source pointers do not confer independent corroboration. |
| Unknown dates | Missing publication/update dates remain explicitly unknown. Access dates are not substituted. Remaining version/content capture is visible as a future reliance obligation. |
| Confidence | Confidence concerns attributed documented primitives. Runtime composition, security sufficiency and comparative suitability are explicitly excluded. No measured confidence was invented. |
| Narrow prior checks | SC-001, SC-011 and SC-013 retain the limited Node, Keycloak and openid-client observations. Their wording does not enlarge those checks into deployment validation. |
| Failed retrieval | SC-014, lines 334–354, preserves both failed step-ca retrievals and makes no new verification claim. Failure remains neither confirmation nor disproof. |
| Additional lexical sources | SC-025/026, lines 584–627, identify author-reported PostgreSQL documentation support and deny independent corroboration or runtime authorization, recall, storage and usefulness results. Their scope matches knowledge §3 lines 40–42. |

I found no newly invented independent corroboration. The common institutional-interest description is qualified, while standards, documentation and source repositories retain their distinct source types.

## Remaining limits

Current source retrieval, precise version/content capture, dependency locking and operational admission remain obligations. So do any required implementation mechanisms for review scheduling, change detection, correction propagation and enforcement. Unknown dates are disclosed unknowns, not newly completed research.

The additional lexical-source check accepts only its metadata inheritance and epistemic limits. It does not accept the retrieval architecture, protected-text storage design or complete knowledge/evaluation contracts.

**EPT-01 therefore closes for the corrected subset.** This disposition does not reopen or independently revalidate AD001–010, certify all research metadata, or accept the full plan or implemented system.
