# DR-LABEL-RECONCILE — 06 label names reconciled to the 09a wire schema (2026-10-01)

**Basis.** DR-68 says: "One versioned wire schema for labels, owned by 09a, with a published mapping. 06 owns semantics
and uses the wire names … Human provenance is a provenance field, not a new origin." That text is at `00-CANON.md:515`.
Where 06 §4 `type Label` differed from 09a §12 `LabelV1`, 06 was wrong. This note serves B1-26 (`14-BUILD-PLAN.md:315`:
"every 06 label name maps to one wire name").

All line citations are at `origin/main` `59dbe01`, before this change.

## What changed

- **09a §12**: adds `SourceRef` and `PrincipalRef`, adds a "06 → wire" table and makes the collaborator/contractor row
  a function wherever the canon supports one.
- **06 §4**: `type Label` is now field for field `LabelV1`. The examples are rewritten to the wire names: §3 (l.129),
  L2/L3/L5, Scenario A steps 1 and 3, §8 (l.327), §11 (l.472, 479, 501) and §13 (l.545).
- **09b**: the `twin_run` example (l.745) changes from `labels: [synthetic, non_exportable]` to a `label/1` record.

## Mappings decided

| Former 06 | Wire | Cited basis |
|---|---|---|
| `origin: system` | `system_of_record` | `06:159` "'system' = a system of record"; `06:179` "`system` (system of record)" |
| `origin: web` | `public_web` | `06:479` "origin: web … like any public evidence"; `13-WORKED-SCENARIOS.md:94,586` label public-source findings `origin: public_web` |
| `origin: worker` | `internal` | `13:1404` "Backlot: 41 assets, each `origin: internal`, provenance to repo and sha". **This is the weakest mapping**: it rests on one worked example, not on a definition |
| `origin: collaborator` | no origin. Channel origin + `provenance[].human_principal` | `00-CANON.md:515`; `06:130-131` "keeps an existing origin … no separate human origin"; `09a:622` |
| collaborator via the Human Task Market | `counterparty` | `13:587` broker corrections: "`origin: counterparty` + provenance {… contract: Human Task Market ref}"; HumanTask is defined at `16:548-556` |
| `tainted: true` / `false` | `taint: untrusted` / `clean` | `09a:604` "non-clean if ANY data or control ancestor is untrusted"; `06:163` uses the same predicate |
| `permission: data_only` (Scenario A only) | `permission: none` | `13:1281,1311-1312` record the same Front Desk step of the same scenario as `taint: untrusted, authority: none`; `09a:625` maps `authority` to `permission` with the same values |
| `permission: non_exportable` | `exportable: false` (separate field) | `09a:575` "twin records carry `origin: synthetic, exportable: false`"; `09a:603`; DR-50 |
| `retention` (06 §8 names) | `retention.hold`; `synthetic` → `retention.class` | `09a:627-629`. The comment at `06:165` ("wire values per 09a §11.6") contradicted those rows and is gone |
| `retention_deadline` | `retention.deadline` | `09a:601` "retention deadline, computed; never a class" |
| `SourceRef` | `{ref; quote?; accessed?; system_of_record?; human_principal?: PrincipalRef}` | `06:102` (sources shape) + `09a:605` (human_principal on the entry) |
| `PrincipalRef` | `{id: string; role: string}` | `06:105` |

## OPEN — not chosen, because the canon does not support a choice

1. **`data_only` in general: `none` or `informs`?** `13:1312` uses `none` for an untrusted counterparty email, and
   `13:927` uses `informs` for a customer email. Neither value is defined anywhere. `06:501` (Pain Index) is left
   without a permission, with an OPEN comment.
2. **Channels other than the Human Task Market.** No canon text names the channel that yields `internal` (`09a:622`).
   This includes a contribution made in a Room by a co-founder or contractor (`16:520-528`).
3. **`taint: quarantined` against `06:99`.** That line reads "`quarantined_at` … a record state (§8), not a label
   value". The wire carries quarantine as a taint value.
4. **`PrincipalRef` semantics.** It is unsettled whether `id` refers to a 16 §12 Principal record, and whether `role`
   takes 16's Principal kinds.
5. **Placement of `human_principal`.** The 06 envelope holds one per record (`06:105`). The wire holds one per source
   entry (`09a:605,622`).
6. **Envelope vs label.** The 06 RecordEnvelope carries `provenance` and `confidence` outside `label` (`06:102-105`),
   and `LabelV1` carries them inside. The canon does not say whether these are one value or two.

## Not done (out of scope, mapping already decided)

- 06 §8 prose still calls `ordinary` … `pinned` "retention classes" (`06:319,325`).
- 06 §3 still writes `provenance.human_principal` (`06:131`).
- Stragglers elsewhere still use pre-wire names:
  - 13 uses `authority:` and `data_class:` (`13:185,812,927,1281,1312`) and `origin: participant` (`13:1202,1553`), which contradicts DR-68.
  - 02 uses `origin: external, class: D2` (`02:519`).
