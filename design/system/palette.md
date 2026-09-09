---
status: unanswered
artifact: design/tokens/seeds.json (values carried, meanings undecided)
---

# Palette

**UNANSWERED.** Twelve colour values exist. What each one *means* has not been decided.

## The question

What does each colour mean, and which of the twelve carried values are load-bearing?

## What exists today, and what it is not

`design/tokens/seeds.json` carries twelve hex values verbatim from
`mission-control/client/src/styles.css`, and `design/tokens/contrast.md` computes every pair. **That
is a value list and a measurement, not a palette.** Colour is CARRIED through the generator, never
derived — deriving a palette would be a claim this repository has not earned.

`styles.css` itself is the best writing in this repository on the subject: the dark-only decision is
argued, one accent means exactly one thing, and it explains at length why a **ΔE76** figure and not a
contrast ratio is the right metric for a row-banding pair. When this file is answered, that prose is
what it should read like — and the migration is one-way and mechanical.

## What this file will hold when it is answered

- The meaning of each token, and what may and may not carry it. `styles.css` already asserts three
  such rules in comments — "hover only, never the sole carrier of anything", "borders and rules,
  never text", "nothing that carries meaning is allowed below 4.5:1" — and none of them is written
  anywhere a check could read.
- Whether the 12 values map onto a role-assigned scale at all. §7.2 records that **mission-control
  uses 2 of Radix Colors' 12 role slots**; whether that is a defect or a dashboard's correct answer
  is exactly what is undecided.
- Whether neutrals should be tinted, and on what function.

## One finding to carry forward

`--color-warn` is documented in `styles.css` as **8.582:1** and computes **8.581:1**. That file's own
comment says its figures were all re-measured after review found every one of them wrong. One is
still off. This is the argument for the computed table, and it is why no contrast figure belongs in
this file as prose — link to `design/tokens/contrast.md` instead.
