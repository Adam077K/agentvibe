# Explorer data

A deterministic JSON projection of the planned system -- "The Company Engine" -- for the
interactive explorer page. Every file here is **generated**; edit
[`scripts/vision-explorer-data.mjs`](../../../../../../../scripts/vision-explorer-data.mjs) and
rebuild, never a file in this directory.

```
node scripts/vision-explorer-data.mjs build   # re-derive and write
node scripts/vision-explorer-data.mjs check   # re-derive, assert coverage, exit 1 on a miss
node scripts/vision-explorer-data.mjs stats   # print file sizes and counts
```

**Nothing here is invented.** Every string is copied from a file under `docs/vision-system/`,
and every emitted object carries a `source` naming the file and the JSON pointer or heading it
came from. Where a registry already had its own `source` field, that value is preserved under
`source_doc` so the two do not collide. The one place the generator composes rather than copies
is `graph.json`, whose edges are derived joins -- and each edge kind is named below so the
derivation is inspectable.

## Files

### `meta.json`
The head sha, the commit date the projection was generated against (the commit date, not the
wall clock, so a rebuild on the same tree is byte-identical), the per-file byte and row counts,
and the package status read from `state.json`: project, directive date, phase, status,
architecture version, `planning_accepted`, `implementation_started`, the founder hold and the
validator last full run, both verbatim.

### `records.json` -- 189
The full record registry. Each record carries its kind, representation, schema ref, owning
component and owner assignment, identity, source of truth, **fields flattened** to a list of
`{path, type, required, owner, note, storage, added_by, group}` rows where a nested payload
becomes `payload/field_name`, the lifecycle (`initial`, `phases`, and `edges` each joined to the
**meaning** of the predicate that guards it), registration, relations, output lifecycle links,
invariants, authorization, retention, deletion, audit, versioning, source contract, planned
module, removal criterion and implementation status. This is the deep-explanation layer and the
text is kept whole.

### `predicates.json` -- 2,398
Every predicate with its version, meaning, owning component, argument types, failure behaviour
and source chapter. The body is stringified into `body_compact`, truncated at 1,200 characters
with `truncated: true` and the untruncated length in `body_bytes` -- the only truncation
anywhere in the projection. `used_by` is derived by scanning, not declared: it lists the record
edges, record registrations, commands, pinned-conjunct tables and other predicate bodies that
name this id.

### `commands.json` -- 105 · `values.json` -- 186 · `primitives.json` -- 58
The command, value and primitive registries in full. Commands additionally carry
`guard_meaning`, the meaning of their guard predicate, so a reader does not have to cross-file
to learn what the guard asserts.

### `control-contracts.json` -- 27 · `endpoints.json` -- 11 · `subject-bindings.json` -- 65
The control contracts as `{id, clauses[]}`, the HTTP endpoints keyed `METHOD /path`, and the
subject bindings with their canonical types and migration rules. All three are complete copies.

### `class-mapping.json` -- 9
The class mapping table, one row per entry. Not in the original file list; included because it
is part of the contract set and nothing else carries it.

### `pins.json` -- 23 tables
Every table in `pinned-conjuncts.json` paired with its own `<table>_why` prose, including
`finding_sources`, `not_answered`, `answered_elsewhere`, `natural_key_create_paths`,
`producer_unauthorable_fields` and `capability_publishing_structures`. Nothing is dropped: the
`_why` keys are folded into their table rather than emitted as separate rows.

### `components.json` -- 9 items, 14 flows, 8 deployment flows
The nine logical components S1-C01..C09. `owns`, `receives`, `returns` and `cannot` are split
out of the single table cell that 02 section 3 writes them in (`Receives -> returns;
prohibition`). Each also carries the nineteen authority attributes and the contract refs from
`components-authority.json`, the S05 question ids it owns, and four **derived** counts:
`records_owned`, `commands`, `predicates_count` and `capabilities`. `flows` are the labelled
edges of the logical flowchart in 08 section 3, with component node ids rewritten to registry
ids and non-component nodes kept as the chapter wrote them; `deployment_flows` is the trust and
fault placement chart beside it.

### `layers.json` -- 5
L1 consequence class, L2 declared procedure, L3 typed standing interest, L4
`ExistenceJustification`, L5 standing accountability -- as tabled in 02 section 3, each joined to
the full text of the section of `05-work-agents-skills.md` its governing rule cites. Only that
chapter is resolved: L1 also cites `02-authority-recovery.md` section 4, and resolving that
number against 05 returned the wrong section. The file also carries the precedence sentence -- the
lower-numbered layer governs -- and the selection-record section that judges the five criteria.

### `capabilities.json` -- 46
Every capability with its concern, required outcome, inputs and outputs, dependencies,
implementation mode, authority, happy path, evidence produced, evaluation, failure behaviour,
replacement and removal, plus: `route` with each fulfillment route id resolved to its
definition, `consequence_class` gathering the classes and the declared floor with its source,
`acceptance` (the acceptance contract), `requirements_row` (the joined
`capability-requirements.json` row), `questions` (the ids it answers) and
`source_question_contracts` (a compact join: question id, source field, question, answer,
answer location, status, uncertainty, implementation status).

### `source-question-contracts.json` -- 116
The **full** source-question contracts, once. They live here rather than inline because most
name many capabilities, and inlining them whole multiplied the projection roughly fourfold for
no new information. `capabilities.json` points at this file by name.

### `stages.json` -- 12
B00..B11. `name` is read from the construction-graph mermaid in
`08-improvement-implementation.md` section 7; `builds`, `completion_evidence` and
`does_not_prove` are the graph rows `components_and_contracts`,
`required_completion_evidence` and `risk_and_full_system_relationship`; `components` is derived
by finding C0x mentions in the stage text. **`phase_g_judgment` is always `null`** -- no such
field exists anywhere in the package, and the field is kept rather than dropped so that its
absence is visible rather than silent.

### `decisions.json` -- 22 · `questions.json` -- 22
AD-001..AD-022 in full (problem, decision, alternatives, evidence and reasoning, epistemic
basis, accepted design costs, external exposure authorized, reversibility, reopen trigger,
implementation evidence) and Q-001..Q-022 in full, each with its packet and its recorded
resolution.

### `risks.json` -- 17 · `attacks.json` -- 33
The risk register with cause, likelihood, consequence, prevention, detection, containment,
rollback, residual risk, accountable owner, escalation requirement and revalidation -- plus
`attack_cases_joined`, each referenced case id resolved to its text and status. `attacks.json`
carries the 33 cases, the 14 dimensions, the join contract, the review subject commit and the
six stated limitations of the coverage claim.

### `adapters.json` -- 7 · `execution-profiles.json` -- 3
The seven IC-* fulfillment adapters of 07 section 3 (selected target, concrete contract, limit
and failure behaviour, simpler alternative) and the three N-* native execution profiles of 07
section 5. Both keep the table headings they were read under, so a reader can see what question
each cell was answering.

### `chapters.json` -- 19 documents, 340 sections
The three planning chapters, the planning report, the twelve specification chapters and three
F2 documents (acceptance protocol, attack consolidation, selection record). Each is split into
sections at every ATX heading, with fenced code treated as opaque so a heading inside a mermaid
block stays content. A section carries a slug `id` unique within its chapter (a repeat gets
`-2`, `-3`), the heading level, the rendered `html`, the exact `text_length` of the source text,
and `mentions`: the record, capability, component, decision, question, risk, attack, stage and
adapter ids found by regex over that section. Record mentions use one alternation ordered
longest-first, so `Case` does not shadow `CasePool`, with word boundaries on both ends. The
markdown renderer is written in the generator and has no dependency: headings, paragraphs,
bold, italic, inline code, links with the href kept, nested bullet and numbered lists, pipe
tables, blockquotes, horizontal rules and fenced code with its language class.

### `reviews.json` -- 39
Every archived review under `planning/reviews/` and `planning/F2/reviews/`. Each opens with a
blockquote provenance line, captured whole; `precis` is the first prose paragraph after it;
`verdict_line` is the bold summary that precedes the precis, with any SUFFICIENT / INSUFFICIENT
/ PASS / FAIL / BLOCK / ACCEPT / REJECT token pulled into `verdicts` and any (a)..(d)-class
mention counted in `class_mentions`. `subject_sha` is the frozen subject the review names;
`G-acceptance-protocol` has none, because it is the protocol rather than a review of a subject.

### `coverage.json` -- 566 rows
All 566 directive question rows: field id and title, question id and text, status, component,
evidence and decision locations, uncertainty, owner, implementation location and status -- and
the **answer**, fetched by following each row `answer_location` as a repo path plus JSON
pointer and reading the field the row itself names in `answer_field`. A row that points at a
JSON file and fails to resolve is a `check` failure, not a silent null. Alongside: 62
`supplemental` rows, 15 `discovered` rows, the 24-item `package` deliverable checklist and the
`status_rule` definitions.

### `findings.json` -- 286 rows across four registers
Each row is tagged with the register it came from. `f2_06_findings` is the 54-entry F2-06 index
with file, class, heading and **disposition**; `f2_step4_findings` is the 111-entry F2 step-4
attack index; `review_findings` is the 115-row register with status, attack cases, resolution,
independent recheck and implementation evidence; `contradictions` is the 6 recorded position
conflicts with their disposition and authority. `items` is the four concatenated.

### `graph.json` -- 3,488 nodes, 28,759 edges
Node ids are namespaced by type, so a record and a value of the same name do not collide; each
node keeps its natural id in `ref`, plus a `label` and the `component` it belongs to where one
applies. Thirteen edge kinds, each a stated join:

| kind | endpoints | read from |
|---|---|---|
| `owns` | component to record, component to command | the registry `owner_component` |
| `relates` | record to record | each relation `targets` |
| `guards` | record to predicate | each lifecycle edge `predicate_id` |
| `uses` | predicate to primitive | every `op` in the body naming a registered primitive |
| `targets` | command to record | the command `target_types` |
| `route` | capability to component | the capability `owner_component` |
| `answers`, `answered-by` | capability and question, both ways | the source-question contracts |
| `depends` | stage to stage | the graph `depends_on` |
| `builds` | stage to component | C0x mentions in the stage text |
| `affects` | decision to record, decision to chapter | ids and chapter paths named in the decision text |
| `covers` | risk to attack | the risk `attack_cases` |
| `flow` | component to component or external | the logical flowchart in 08 section 3 |

### `search.json` -- 4,662 rows
`{type, id, title, snippet}`, one row per addressable thing above. The snippet is the first 200
characters of prose the source already carried -- a record representation, a predicate meaning, a
decision text, a section stripped of its tags -- never a sentence composed here.

## Coverage counts asserted by `check`

`check` re-derives everything from the package and compares. An exact count below is a claim
about the package; if the package changes, `check` exits 1 and names the file.

| file | expected | file | expected |
|---|---|---|---|
| records | 189 | capabilities | 46 |
| predicates | 2398 | stages | 12 |
| commands | 105 | decisions | 22 |
| values | 186 | questions | 22 |
| primitives | 58 | risks | 17 |
| control-contracts | 27 | attacks | 33 |
| endpoints | 11 | coverage | 566 |
| subject-bindings | 65 | components | 9 |
| layers | 5 | adapters | 7 |
| chapters | at least 18 | reviews | at least 30 |
| search | at least 4000 | source-question-contracts | at least 1 |

Nine structural assertions run beside the counts, and each prints the first ten offenders:
every record edge predicate resolves; every command guard predicate resolves; every record id is
unique; every risk attack-case id resolves to an attack case; every capability owner is a
declared component id; every stage dependency resolves to a stage; every chapter section id is
unique within its chapter; the findings registers hold their stated row counts; every coverage
row resolves its answer location; every graph edge endpoint resolves to a node; and every graph
node id exists in the data file for its own type.

## Size

**17.75 MB across 28 files**, against a stated budget of 20 MB total and 8 MB for any one file,
both checked. The largest are `predicates.json` (4.23 MB), `graph.json` (3.67 MB) and
`records.json` (3.04 MB). **Predicate bodies are the only thing truncated anywhere** -- 1,200
characters, flagged, with the full length kept. If the budget is ever exceeded, lower
`BODY_LIMIT` or split `predicates.json` by id order; do not shorten anything else.

## One thing to know about `meta.json`

`head` and `generated` are read from `git HEAD` at build time, so the committed `meta.json`
names the commit **before** the one that carries it. A file cannot contain its own commit sha.
Every other file in this directory is a pure function of the package and rebuilds byte-identical
on the same tree -- which is what makes `check` a real oracle rather than a re-print.
