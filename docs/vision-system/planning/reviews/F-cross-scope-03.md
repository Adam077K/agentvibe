> Archival provenance — 2026-09-13: The recheck below is preserved verbatim from the completed independent read-only turn on frozen subject `cb4bf52`. The reviewer had shell access for computation and no write access; it was instructed not to read any lane worktree or any author self-assessment. The report arrived in three parts because the return channel truncated it twice; the parts are concatenated in order with no edits. This orchestrator scribe turn archives only this report. Archival does not retroactively establish hardened reviewer isolation; the reviewer shares a model family with both repair authors and says so.

**XSR-02 and XSR-03 recheck — XSR-02 partially closed with named residue; XSR-03 closed at the specification level with one named residue**

**Subject:** `cb4bf52`

---

I computed the joins rather than reading the repairs' self-descriptions. I did not read the authors' session files or repair notes; I read the two original review reports, the finding statements, and the artifacts.

**Independence disclosure:** I share a model family with both authors. This is procedural independence only — not an independent panel. I am predisposed to agree in exactly the place where this style of specification is hardest to falsify: dense, plausible-sounding clause lists. I over-weighted computation and deliberately constructed non-conforming implementations before accepting any case.

---

## XSR-02 — partially closed with named residue

**What I computed** (`docs/vision-system/planning/specification/work-knowledge-contracts.json`):

- 268 answers, 54 subcases, 159 assertions, **394 bindings, 0 broken**: every `assertion_id` exists, every `subcase_id` matches its assertion's parent, and **all 394 `location` strings resolve to the correct array index** (I recomputed `#/verification_subcases/{i}/assertions/{j}` from the file itself).
- **0 answers without a binding.** Bindings per answer: 143×1, 124×2, 1×3.
- Reuse is **not** generic: 152 of 159 assertions are used; max reuse is 8 answers on one assertion, median ~2. Histogram (answers-per-assertion): 1→38, 2→44, 3→36, 4→19, 5→9, 6→4, 7→1, 8→1. I inspected the three most-reused assertions (`WK-V43-A2`, `WK-V50-A2`, `WK-V16-A1`); each groups semantically near-duplicate questions (instrument sensitivity, handover preservation, observed-vs-told), which is legitimate sharing, not dilution.
- Root projection `docs/vision-system/coverage/questions.json`: 268 of 566 rows carry bindings, the id set **equals** the 268 source ids, and **0 semantic divergences** in subcase/assertion pairs, question text, `verification_refs`, or recomputed locations (only the path prefix differs, consistently).
- **Both exemplars from the original finding are directly answered.** F08-Q10 now binds `WK-V30` — "Retire a rented provider during an active service: its export omits one field, its context is opaque and the substitute interprets a status differently. Pair with a complete portable export" — which is XSR-02's first falsifying test almost verbatim. F50-Q06 binds `WK-V53` — "Rephrase and refile an equivalent settled inquiry under new local IDs and a provider reset; then provide genuinely new material contrary evidence" — which is the second.

**Discrimination test on a 24-answer sample** spread across 23 source fields (14 random one-per-field, 10 random single-binding answers): 22 have an expected observation whose outcome differs between a conforming and a constructed non-conforming implementation. Two do not.

**Counterexample (still open, residual instance of the same class) — F50-Q08.** Answer: "…*do not invent a permanent adversarial persona as proof of disagreement.*" Its two bindings are `WK-V35-A1` (source interest/entailment) and `WK-V43-A2` (known-defect/always-pass instrument calibration). Non-conforming implementation: supply all challenge through a standing generated "challenger" agent. It still binds exact supporting/opposing source spans (WK-V35-A1 passes — the persona can cite real contrary sources) and its *instrument* still detects planted defects and rejects sham controls (WK-V43-A2 passes — that is a different mechanism). The distinctive prohibition is never exercised. Confirmed by search: across all 54 subcases, `adversar`/`devil`/`red team` occur **0 times**; the 9 `persona` occurrences (`WK-V11-A3`, `WK-V18`, `WK-V26`) concern competence and role-gap claims, not challenge supply.

**Second, weaker — F33-Q04** ("standing instruction vs the request itself"), single binding `WK-V19-A1`. The stimulus varies hostile retrieved instruction, mandate conflict and embedded secret; it never varies *which content sits where*. A system that concatenates the standing instructions and the WorkOrder into one undifferentiated prompt, then emits two labeled log sections, satisfies `WK-V19-A1`'s "pin the actually loaded standing method and current task facts separately" without honoring the allocation rule the answer states. The stimulus varies hostile retrieved text, mandate conflict and an embedded secret — it never varies *which content sits where* — so an implementation that puts current deadlines in the standing instruction and stable method in the WorkOrder produces byte-identical observations.

## XSR-03 — closed at specification level, one named residue

**Computed evidence.** `integration-choice-unresolved` occurs **0 times** in `docs/vision-system/` outside the review that raised it. Across the 11 routes and all 46 capability entries: `not selected` 0, `to be selected` 0, `an adapter` 0, `a provider` 0, `provider choice` 0. **All 150** `capability.fulfillment_route_refs` resolve to one of the 11; 0 capabilities lack refs. **Every** `selected_route_ids` entry resolves to a route defined in `07-integrations-capacity.md` §3/§5; every `selected_contracts.location` file exists. The finding's falsifying test passes: `capabilities.json#/fulfillment_routes`, the F25-Q01 trace (`#/source_question_contracts/61`), `09-company-human-traceability.md:35` and `03-company-capabilities.md:53–56` all yield the same seven committed routes and the same unresolved facts (account eligibility, credentials, funding, actual performers).

| Route | Named performer? | Admission check? | Unavailable-state behavior? |
|---|---|---|---|
| R-DOMAIN | first-party modules, "no external CRM required" — no vendor to choose | `not_established` + 2 facts | n/a external; gated by `implemented:false` |
| R-NATIVE | **Claude 2.1.269 pinned / Codex** — but see counterexample | `not_established` + 3 facts | partial — profile admission only, no dependent-promise rule |
| R-SOURCE | Fastmail, Cloudflare, statements+hledger, human | `not_established` + 2 | partial — quarantine on unknown schema; "model text is not a source statement" |
| R-SEARCH | **Brave Search API** + authorized fetch | `not_established` + 3 | yes — human sourcing is "not an assumed available fallback" |
| R-CONTACT | **Fastmail JMAP, Postmark Basic**, Cloudflare | `not_established` + 3 | yes — full mailbox returns native failure, triggers custodians + published alternative |
| R-PUBLISH | **Cloudflare Workers Static Assets / Workers Free / D1 Free** | `not_established` + 3 | yes — quota exhaustion returns actual failure; "paid migration is not automatic fallback" |
| R-MONEY | **Stripe Checkout/Refunds/BalanceTransactions; hledger 1.52** | `not_established` + 3 | yes — manual bank only "where a competent operator/account exists" |
| R-PERSON | portal+Fastmail route named; **performer is a category, correctly unknown** | `not_established` + 2 | yes — "missing performer acceptance means no verified capacity"; CAP-30 substitute-or-remedy |
| R-REMEDY | Cloudflare intake + separately administered Fastmail; custodian unknown | `not_established` + 3 | yes — "a URL, mailbox or named alternate alone is not meaningful redress" |
| R-RUNTIME | first-party (6 versioned internal contracts) | `not_established` + 2 | n/a external |
| R-OPERATOR | first-party (`04-human-operation.md` HUMAN-1.0) | `not_established` + 2 | n/a external |

Selection and admission are structurally distinct: `AdapterProfile` runs `proposed → examined → admitted` with "author cannot assess its own admission"; `IntegrationConnection` is `pending → active on verified profile/account/standing`; §8 requires test family IC-T11 (human performance, missed deadline, accepted alternate) and states removal "does not discharge a customer duty."

**R-NATIVE counterexample.** `R-NATIVE.selected_route_ids` lists three profiles — `N-CLAUDE-SUPPLIED/v1`, `N-CLAUDE-MEDIATED/v1`, `N-CODEX-SUPPLIED/v1` — while its own `selected_contracts.version` string reads "IC1.0 / N-CLAUDE-SUPPLIED/v1; mediated and Codex profiles require separate admission." A consumer resolving the id list gets three selected routes; one resolving the version string gets one. That is the XSR-03 class (two views of one selection disagreeing) recurring in the single route where the repair did not reach.

**R-PERSON / R-REMEDY residue sentence.** Both name the mechanism (authenticated portal + Fastmail; Cloudflare intake page + separately administered continuity mailbox) but leave the actual performer and custodian as a category — which the original finding *required*, since it asked that genuinely unresolved human engagements be preserved as unknown. So this is correct behavior, not residue; the only XSR-03 residue is R-NATIVE.

## New findings

- **XSR-R-01 (medium)** — 88 of 394 bindings (22%) cite a subcase whose `family_ref` is absent from that answer's `verification_family_refs`, so the declared family points at the wrong planned test module (F50-Q06 declares WK-T04/05/06, binds `WK-V53` in WK-T03).
- **XSR-R-02 (low)** — `procedure`, `positive_control` and `execution_boundary` are 1 distinct string across all 54 subcases, against 54 distinct stimuli.
- **XSR-R-03 (low)** — R-NATIVE's mixed selected/candidate id list, above.
- **XSR-R-04 (informational)** — 7 unbound assertions: `WK-V04-A3, V09-A3, V20-A3, V23-A3, V26-A2, V33-A3, V43-A1`.

## Not checked

- The 298 non-work/knowledge rows in `coverage/questions.json`.
- The 77 scope/lifecycle and 116 company/human answers, except F25-Q01.
- XSR-01, FI-12 and every other register entry.
- Substantive domain truth of any subcase — I judged discrimination only.
- 30 of 54 subcases and ~244 unsampled answers.
- Internal consistency of the 46 `acceptance_contract` conditions.
- Anything at runtime: every status is `specified-unexecuted` / `implemented: false`; no test was run.
- External URL validity in `07-integrations-capacity.md` §3.
- The diff `51de3b46` → `cb4bf52` — I judged the current tree, not the change set.
- Any other worktree.
