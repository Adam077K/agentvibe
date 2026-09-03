# The full system spec · brief · 2026-09-02

**Founder's instruction:** *"The frame is the system spec, full. We envision the big system."* The year-one
frame (`STARTUP-OS.md` Part II) is a slice. The picture (`vision/2026-09-02-THE-PICTURE.md`) is a vision
written as a visit. Neither is the spec of the big system. **This round writes that spec**: every territory at
full scale, concrete enough that a builder could start from any section, with the year-one slice inside it
and the growth path from year one to full scale as triggers, never dates.

## Read, by reference
1. `docs/03-system-design/vision/2026-09-02-THE-PICTURE.md` — the merged picture: §1 the visit, §2 the
   fourteen grown, the eight new territories, §3 slice-or-small, §4 the path backwards, §5 what compounds,
   §6 what would have to be true, §7 the founder's choices. **This is your primary source.**
2. `docs/03-system-design/STARTUP-OS.md` — Part II is the year-one frame (each section's IS / grafted_from /
   binds / enforced_by / decided), **already amended by the founder's decisions of 2026-09-02** (marked
   *founder's choice N*); Part IV records those decisions and the eight new territories. The year-one slice
   in your sections comes from here, condensed, never contradicted.
3. The three visions, for detail the picture compressed: `vision/2026-09-02-flywheel.md`, `-founder.md`,
   `-machine.md` (each ~1,000 lines, §2 has every territory at full scale in that vision's own words).
4. The catalogue as needed: `docs/02-competitive/expansion/concepts.md` · `hands.md` · `open-source.md`.

## Binding
- The founder's decisions of 2026-09-02 (STARTUP-OS.md Part IV) bind: all fifteen board decisions as the
  floor, four narrowed, six amendments, the owned address later in month one, **the Mac in year one** with an
  always-on host as a later stage.
- Physics binds: a `claude -p` process cannot call a tool absent from its argv (measured); a `Workflow` is
  main-session only; `PostToolUse` cannot block; the only blocking hook is PreToolUse exit 2.
- Every rule names the mechanism that enforces it, or is labelled `WISH`. Every number the visions gave is
  kept as an **illustration** and labelled so, never as a measurement.

## The section template — every territory uses exactly this
```
## NN · <Territory name>
**At full scale — what it IS.** 8–20 lines. Files (path + format), processes (name + argv), stores (writer
  and reader), hands, checks. Concrete beats comprehensive: one file format and one check beats six ideas.
**Components.** A parts list, one line each: `path or process` — what it is — who writes / who reads.
**Enforced by.** Each rule → its mechanism (argv absence · schema refusal · test · resolver · hook · human
  gate) or `WISH`.
**Year one — the slice.** What exists first, condensed from STARTUP-OS.md Part II §NN plus the founder's
  amendments. For a new territory (15–22): what exists in year one, if anything, and the one-string
  reservations already decided.
**Growth path.** Ordered rows: `trigger (countable) → what lands`. Triggers come from the frame's reopen
  triggers, the picture's §3/§7, and the three-count rule for earning a hand. No dates.
**Would have to be true.** 1–3 lines, ranked; mark which is measurable in the first 30 days.
**grafted_from.** picture § · vision(s) · frame § · catalogue ids.
```

## Cross-cutting maps (group C writes these; the assembler places them)
- **The process list at full scale** — every process, its argv, its ring, what it holds, what it can touch.
- **The store map** — every store: path · format · one writer · readers · expiry rule · cap.
- **The pack roster** — the five families, the `orient` and `sweep` packs, the pack schema in full.
- **The hand admission test** — the five parts, night / day / not-a-hand, with the loader/wrapper/counter
  that checks each.
- **The warrant lifecycle** — mint · attenuate · exercise · refuse · expire · audit · widen · revoke, and the
  three-count rule, as a state diagram in text.
- **The founder's day, week, month** — the one daily appointment, the Friday reckoning, the monthly report.
- **THE BUILD PATH, as stages by trigger** — Stage 0 is the thirty days already ordered in Part II §15
  (do not re-order it). Then Stage 1, 2, 3 … up to full scale: each with `entry trigger · what lands · what
  reopens · what must be measured before the next stage`. Roughly six stages. This is the spine of the spec.

## Output
Group A → `docs/03-system-design/vision/spec-A.md` (territories 01–07: Missions · Workers · Hands · Knowledge
  · Memory · Communication · Context & cost)
Group B → `docs/03-system-design/vision/spec-B.md` (08–14: Quality & truth · Control & safety · Surfaces ·
  Runtime · Self-improvement · Economics · The company)
Group C → `docs/03-system-design/vision/spec-C.md` (15–22: Distribution & audience · Authority · Attention ·
  Obligation & people · Identity & standing · The calendar and the clock · Silence · Succession — plus every
  cross-cutting map above and THE BUILD PATH)
Each 500–900 lines. Return ≤ 150 words: the two hardest merges you made and the one number you refused to invent.
