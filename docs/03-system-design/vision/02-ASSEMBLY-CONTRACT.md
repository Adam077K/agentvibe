# Assembly contract — STARTUP-OS.md v2, the full system spec

**Inputs:** `vision/spec-A.md` (01–07) · `vision/spec-B.md` (08–14) · `vision/spec-C.md` (15–22, the maps, the
build path) · the current `docs/03-system-design/STARTUP-OS.md` v1 (Part I keep · Part II the year-one frame ·
Part III reconciliation · Part IV the founder's decisions) · `vision/2026-09-02-THE-PICTURE.md` §1 for the
thesis.

**Before writing:** copy the current Part II verbatim to `docs/03-system-design/designs/2026-09-02-year-one-frame-v1.md`
with a two-line header saying what it is and that v2 supersedes it in place. Nothing is lost.

**Output:** `docs/03-system-design/STARTUP-OS.md` v2, in this order:

```
Header        version: 2 · date · status ("the full system spec; year one is the slice inside each section") ·
              sources · how it was made (four designs → frame v1 → three visions → picture → three spec
              groups → this assembly) · the founder's decisions of 2026-09-02 bind.
Part I        why, the census, the founder's nine decisions — v0, verbatim, unchanged.
Part II       THE SYSTEM AT FULL SCALE
              §0 Thesis — the picture's one sentence + the visit in ≤ 12 lines + the frame's argv principle.
              §01–§22 — the twenty-two territories, each in the brief's template exactly, from spec-A/B/C.
              Where a spec section contradicts Part IV's decisions, Part IV wins and the contradiction is
              noted in one line. Where two groups define the same file differently, pick one and note it.
Part III      THE MAPS — process list at full scale · store map · pack roster and schema · hand admission
              test · warrant lifecycle · the founder's day, week, month (from spec-C).
Part IV       THE BUILD PATH — Stage 0 = v1 Part II §15 VERBATIM (already amended) · Stages 1–N by trigger
              (from spec-C) · REFUSES with reopen triggers = v1 §16 verbatim (already narrowed) · WHAT WOULD
              HAVE TO BE TRUE = the picture's §6 condensed to ≤ 14 rows, each marked measurable-in-30-days
              or not.
Part V        PROVENANCE AND DECISIONS — v1 Part III (reconciliation of the four designs) and Part IV (the
              founder's decisions, the eight territories) condensed to ≤ 90 lines together; the reference-
              studies pointer.
```

**Rules:** every `Enforced by` line non-empty · every territory has all seven template blocks · no section
restates the build path (it lives in Part IV only) · the founder's amendments stay visible (grep
"founder's choice" ≥ 13) · every D1–D15 appears in at least one section · vision numbers labelled
illustration · no dates on stages · the phrase 24/7 appears nowhere except inside the rule forbidding it.

**Verify and report** (run these, put the numbers in your return): `grep -c '^\*\*At full scale' ` → 22 ·
`grep -c '^\*\*Growth path' ` → 22 · `grep -c '^\*\*Enforced by' ` → 22 · `grep -c "founder's choice" ` ≥ 13 ·
`wc -l -c`. Return ≤ 150 words: the counts, the contradictions you resolved, and what you could not place.
