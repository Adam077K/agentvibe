# DR-LABEL-RECONCILE: 06 label names reconciled to the 09a wire schema (2026-10-01)

**Basis.** DR-68 says: "One versioned wire schema for labels, owned by 09a, with a published mapping. 06 owns semantics
and uses the wire names … Human provenance is a provenance field, not a new origin." That text is at `00-CANON.md:515`.
Where 06 §4 `type Label` differed from 09a §12 `LabelV1`, 06 was wrong. This note serves B1-26 (`14-BUILD-PLAN.md:315`:
"every 06 label name maps to one wire name").

All line citations are at `origin/main` `59dbe01`, before this change.

## What changed

- **09a §12** adds `Provenance`, `SourceRef` and `PrincipalRef`. It adds a "06 → wire" table and turns the
  collaborator/contractor row into a function.
- **06 §4**: `type Label` is now field for field `LabelV1`. The examples are rewritten to the wire names: §3 (l.129),
  L2/L3/L5, Scenario A steps 1 and 3, §8 (l.327), §11 (l.472, 479, 501) and §13 (l.545).
- **06 §3**: the record envelope no longer holds `confidence` or `provenance`. Both now live only in `label`
  (founder decision 8). The `quarantined_at` comment and the §8 Quarantine row now agree with `taint: quarantined`.
- **09b**: the `twin_run` example (l.745) changes from `labels: [synthetic, non_exportable]` to a `label/1` record.

## Mappings decided from the canon

| Former 06 | Wire | Cited basis |
|---|---|---|
| `origin: system` | `system_of_record` | `06:159` "'system' = a system of record"; `06:179` "`system` (system of record)" |
| `origin: web` | `public_web` | `06:479` "origin: web … like any public evidence"; `13-WORKED-SCENARIOS.md:94,586` label public-source findings `origin: public_web` |
| `origin: collaborator` | no origin. Channel origin + `provenance.human_principal` | `00-CANON.md:515`; `06:130-131` "keeps an existing origin … no separate human origin"; `09a:622` |
| `tainted: true` / `false` | `taint: untrusted` / `clean` | `09a:604` "non-clean if ANY data or control ancestor is untrusted"; `06:163` uses the same predicate |
| `permission: non_exportable` | `exportable: false` (separate field) | `09a:575` "twin records carry `origin: synthetic, exportable: false`"; `09a:603`; DR-50 |
| `retention` (06 §8 names) | `retention.hold`; `synthetic` → `retention.class` | `09a:627-629`. The comment at `06:165` ("wire values per 09a §11.6") contradicted those rows and is gone |
| `retention_deadline` | `retention.deadline` | `09a:601` "retention deadline, computed; never a class" |
| `SourceRef` | `{ref; quote?; accessed?; system_of_record?}` | `06:102` (the sources shape) |

## Founder decisions (founder, 2026-10-01)

The orchestrator relayed these decisions; it reports collecting them from the founder through AskUserQuestion. The
builder did not see the exchange itself. Each one replaces an item that was OPEN at `44f3136`.

1. **`origin: worker` → `internal`** (founder, 2026-10-01).
2. **`permission: data_only` → `informs`.** The data may shape a decision and never authorises an action (founder,
   2026-10-01). Scenario A step 1 and the Pain Index example now carry `permission: informs`.
3. **Every HumanTask kind, `participant` included, → `counterparty`**, the same as every outside person (founder,
   2026-10-01). The broker case at `13:587` already agreed. *Narrowed by C below.*
4. **On other channels (email, forms), origin follows the author.** An outside person is `counterparty`. The founder
   and the founder's agents are `internal` (founder, 2026-10-01). *Amended by A below.*
5. **`taint` keeps `clean` · `untrusted` · `quarantined`** (founder, 2026-10-01). The contradicting comment at `06:99`
   now says `quarantined_at` records when quarantine was set. The §8 Quarantine row also sets `taint: quarantined`.
6. **`PrincipalRef = {id, role}`** (founder, 2026-10-01).
   - `id` is a stable person id.
   - `role` is the relationship to the founder, one of `founder` · `collaborator` · `contractor` · `customer`.
7. **`human_principal` is one per record, not per source** (founder, 2026-10-01). It sits at
   `provenance.human_principal` and is no longer on `SourceRef`.
8. **The label holds the only copy of provenance and confidence** (founder, 2026-10-01). The 06 §3 envelope drops its
   copy and references `label.provenance` and `label.confidence`.

**What decision 8 changed in the wire, flagged for review.** Moving the envelope's copy into the label without losing
data changed two `LabelV1` field types:
- `provenance` goes from `SourceRef[]` to `Provenance {sources, derived_from, author, human_principal?}`. L6's cascade
  walks `derived_from`.
- `confidence` goes from `number` to `{rung: E0–E5; p?}`. Evidence rungs are 06's.

The schema stays `label/1`, because no `label/1` reader has shipped yet. B1-26 is that reader.

## Founder decisions, round 2 (founder, 2026-10-01)

The orchestrator relayed these after the round-3 review passed at `a1eeed7`. They answer the two OPEN items raised at
`a1eeed7` and one more.

- **A. The founder's own messages, email included, keep `origin: founder`** (founder, 2026-10-01). They therefore keep
  `may_authorise` under L5 (`06:179`). Decision 4 now reads as follows, on every channel and not only in 09a's
  collaborator row:
  - an outside person is `counterparty`;
  - the founder is `founder`;
  - the founder's agents and collaborators are `internal`.
- **B. Taste-panel transcripts are `counterparty`** (founder, 2026-10-01). 16 makes taste panels `participant`
  HumanTasks (16 §13, "Participant protocol"). `06:457`, which said `origin: customer`, is changed.
- **C. A HumanTask the founder does himself is `founder`** (founder, 2026-10-01). An example is the key rotation in
  `13:1391`. Only an outside person's HumanTask is `counterparty`.

## Decided from the canon: the join (review p2)

- **Provenance is not joined.** `author` and `human_principal` describe the output itself: the job that produced it,
  and a human only when one supplied it. The inputs stay reachable through `provenance.derived_from`.
  - Basis: `06:103` defines `derived_from` as "record ids → transitive labels".
  - Basis: `06:105` defines `human_principal` as "who supplied it, when a human did".
  - Basis: L6 already walks `derived_from` for the quarantine cascade (`06:180`).
- This is written into 09a §12's Join bullet and 06's L1.

## Founder decisions, round 3 (founder, 2026-10-01)

The orchestrator relayed these. They answer the two items that were OPEN at `2777a0d`.

- **E. A message a customer writes gets `origin: customer`**, which is a separate origin from `counterparty`
  (founder, 2026-10-01). The origin rule now reads: an outsider is `counterparty` unless they are a customer, who is
  `customer`. *Correction:* an earlier draft cited `13:927` as following E. That email is from a customer's
  accountant (`13:866`), not from the customer, so it is no example of E and is no longer cited.
  - Decision B still governs panels. A taste-panel transcript is a `participant` HumanTask (16 §13), so it is
    `counterparty`.
  - E covers what a customer writes in their own right.
- **F. A join's confidence starts at the lowest input rung, and later evidence may raise it** (founder, 2026-10-01).
  `06:127` already allows a settled citation to raise a rung.
  - This is written into 09a §12's Join bullet and 06's L1.

## OPEN

Every item raised at `44f3136`, `a1eeed7` and `2777a0d` is closed. The final review at `0b372b0` surfaced three that
the canon cannot settle:

1. **`venture: 'founder'`.** The 06 §3 envelope allows `venture: 'founder'` for founder memory (06 §12), but
   `LabelV1.venture` is `VentureId | 'portfolio'`. So a founder-memory record's label has no valid venture. Fixing it
   means adding `'founder'` to the wire or choosing another value, and that is a wire decision.
2. **Which other 16 §12 Principals are collaborators.** The rule names `role: collaborator` as `internal` and treats
   contractors and customers as outside people. 16 §12 also lists a human co-founder, an advisor and an investor
   (`16:518-531`), and their `role` is not decided.
3. **A customer's agent or adviser.** `13:927` labels an email from a customer's accountant (`13:866`)
   `origin: customer`. E does not say whether someone acting for a customer is `customer` or `counterparty`.

**06 §8 retention wording: resolved, not open.** §8 now says the hold picks the verbs, which matches §4 and 09a §12's
mapping rows. The canon did not truly conflict; §8 still had the pre-DR-68 names.

## Not done (out of scope, mapping already decided)

- Stragglers elsewhere still use pre-wire names:
  - 13 uses `authority:` and `data_class:` (`13:185,812,927,1281,1312`).
  - 13 uses `origin: participant` (`13:1202,1553`), which should be `counterparty` under decision 3.
  - 02 uses `origin: external, class: D2` (`02:519`).
