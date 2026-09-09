## 23 · Coverage of the founder's list

*obeys: SPINE §K row 23 — §B.4 for the founder's §23–§30, the rest against §A · inherits: FINAL §22 (a pointer) and
`final/COVERAGE.md` as a floor, not a frame*

**(NEW: a pointer, because a coverage table in two places is two tables that disagree)** Every item of the founder's
thirty-five sections and nine wings is placed — **IN · RENAMED · REFUSED · FOUNDER'S · OUTSIDE** — with the v2 section
that carries it and one line of reason, in **[`COVERAGE.md`](COVERAGE.md)** beside this document. Nothing from that
table is restated here. A `?` marks a row a reviewer should read first.

**(NEW: what makes v2's coverage different from FINAL's)** `final/COVERAGE.md` was written against three shapes, one
Balcony and a holding directory. Five founder overrules move rows across the table rather than editing them in place:
**v1 and v2** give the founder's departments named agents instead of loadouts, so §23–§30 are placed against the
roster of fifteen; **v3** moves the skills rows from REFUSED to IN, admitted by eval and retired by expiry; **v4**
moves the surface rows from REFUSED to IN as seven pages; **v5** moves Codex from *later* to day one. The prior table
is the **floor** — a row it placed and v2 does not is a regression, and a row v2 places that it refused needs the
overrule named.

**(FOUNDER)** The founder's §23–§30 — design and product, engineering, data and analytics, marketing and content,
sales and growth, customer service, finance and legal, operations and HR — are placed in **SPINE §B.4**, department by
department, each naming both the agents that cover it and the one thing refused with its reason. That table is
reproduced in §5, not here.

**(NEW: two departments carry the least outside evidence, and the coverage table says so)** Sales and growth as a
function, and legal and contracts, have **no shipped precedent anywhere** in the roster research. `growth` and
`steward` are therefore the two entries whose anchors are the most external: a reply from a real person, recorded by
the world's door, and a record the company does not write.

---

### The tally

**(NEW: written by the coverage lane, against `COVERAGE.md` as it lands, never from memory)**

```
TALLY (v2 · FINAL): IN 505 · 410 — RENAMED 88 · 157 — REFUSED 52 · 77 — OUTSIDE 13 · 14 — FOUNDER'S 13 · 13; 671 items, 139 rows changed, 2 marked `?`
```

*(moved 2026-09-06: the line read `IN 503 · RENAMED 90 · 137 rows changed · 5 marked ?`, correct until the rethink
round re-placed the rows below.)* **The two `?` rows that remain, named rather than counted:** **`Compute rental tool`** (IN in FINAL,
**REFUSED** in v2 — RunPod spends money at a rate under an uncapped key) and **`Infra layer: hosting, edge
functions, serverless`** in the wings (IN in both). A `?` is a row a reviewer should read first, so naming the two
costs one line and saves the reader the lookup a count alone forces.

**The `?` sequence, and one correction to it:** **8** when first written · **7**
after the review round · **5** after the founder's interview · **2** after the rethink round. The old line
parenthesised this as *"the review settled two, the founder's interview two more"*, which does not reach 5 from 8 —
**it was one out**, and the sequence above is taken from `COVERAGE.md`'s own dated notes rather than re-derived here.

**(NEW, 2026-09-06: what the rethink round did to this table — one absence closed, three `?` rows settled, and one
row that moved backwards)** The round read all ~640 keywords against v2 again, lane by lane, and the headline is a
number that is hard to improve on: **it found exactly ONE keyword, of roughly six hundred and forty, absent from
v2's own text.**

- **`consent`** — *may we contact this person at all* — was the absence. **(FOUNDER, rethink 2026-09-06: D4 · v69)**
  It closes with a **consent register**: one store, one writer, **read by the Sender before any contact**. It arrives
  beside the erasable path — no personal datum enters the event log or memory, both hold a hash, one per-subject
  store holds the body, and erasure deletes that row so the hash becomes *a known absence*. **Mechanism:** one
  indirection in `bin/log` and the memory writer; two stores whose single writer `bin/check-stores` enforces —
  **`keel/consent.yml`** for the register and **`keel/subjects/<hash>.yml`** for the bodies, both ABSENT; one line
  on the Sender's checklist. §12 and §16 carry it, and §19 places both in the build order.
- **`worker-to-worker request`** and **`peer help request`** were one `?` seen twice, and **v80** settles both: a
  message between two running agents **is a handover or an objection**, on the handover schema, one append-only file
  each. It is not a fourth dispatch mechanism, and the vendor transport's ids are recorded as attributes and never
  as a join key.
- **`agent color tag`** was the third `?`, refused for want of a home. **O2** gives it one: `color:` is a field of
  `keel/shared/roster.yml`, beside `wave`, `valid_until`, `maxTurns`, `isolation` and the anchor — REFUSED → IN
  because a store exists to hold it, which is the only thing that was ever missing.
- **`menu-bar agent status` moved the other way — IN → REFUSED** (deletion 23). No substrate was ever named, it is a
  new dependency if built, and **a status living in two places is one that disagrees**. `bin/bell` (**O18**) and page
  5's strip hold its job.

**(NEW: what the one absence is evidence for, and what it is not)** One absent keyword in ~640 is evidence that the
**coverage** is real. It is **not** evidence that the plan is right — a keyword can be placed by a sentence that
names no mechanism, which is why every row carries a `Rule` column and why the round's other output was eighty
mechanisms rather than more placements. **Contradictions 19 and 20 make the same point from the other side:** the
department and hands tables were *over*-covered, rendered three and four times each, and had already drifted. Placed
three times is not covered three times.

**(NEW, 2026-09-06, fixer round: the tally RE-DERIVED against `COVERAGE.md` as it stands, and it has not moved)**
Run from the table's own `awk` (its *"The tally"* section) on 2026-09-06: **671 rows · 139 changed · v2 IN 505 ·
RENAMED 88 · REFUSED 52 · OUTSIDE 13 · FOUNDER'S 13 · 2 `?`** — identical to the line above, because **`COVERAGE.md`
carries no fixer-round row yet**: no `SPINE v85`–`v106` citation, no `E`/`O` column on SYNTHESIS §8's ledger, no
`market.jsonl` row. That is the table's state, not this pointer's opinion, and the line above is not edited to
anticipate it. **What the fixer round will move when the table lands it** (SPINE §K row 23, sixth column): **v85** —
the second venture places the keywords the harness never exercises, §26–§28's `growth`, `writer` and `steward` rows,
whose anchors were the two most external on this page (FOUNDER, fixer round 2026-09-06: E2 / THINKER: conv. 2);
**v99** — *cross-venture* rows of §31 gain a store, `keel/shared/market.jsonl`, where they had only taste (NEW: O99);
**v86** — `founder_hours:` places the founder-attention rows of §14 that were IN by a sentence and had no field
(FOUNDER: E3 / THINKER: conv. 1). None of the three is a new disposition class; each is a `Rule` column that names a
mechanism where it named none. The count of `?` stays two until the table says otherwise.

**(NEW: what the tally must count, so that a number here cannot drift from the table beside it)** One row per founder
item; the five dispositions summing to the total; and separately the count of `?` rows. **If the tally and
`COVERAGE.md` disagree, `COVERAGE.md` is right** — it is the table, this is a pointer to it.
