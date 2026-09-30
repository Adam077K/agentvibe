# Round 5 — section writer (common brief)

You write **one file of v3**, the final package. The chief architect's `docs/vision-v3/00-CANON.md` is binding: use its
authority names, its glossary terms exactly, its decisions register, and stay inside the topic its **file map** gives your
file (do not re-explain what another file owns — link to it: `see [05](05-AUTONOMY-AND-FOUNDER.md#…)`).

Read, in order: `docs/vision-v3/_process/SEAT-CONTEXT.md` (rules: never shrink; exceed; concrete), `00-FOUNDER-DIRECTION.md`
(binding), `00-CANON.md` (binding), `01-VISION.md` and `02-ORGANISATION.md` (skim), then **your sources** (in your brief).
Range-read large seat files; never read a 40–60 KB seat whole just to skim.

## Standard for the file
- It is **final**, not a seat memo: a founder and a build team will act on it. Write it as the design, in present tense,
  with the reasoning inline where a choice is non-obvious. No "the seat proposed" framing — say what v3 *is*.
- **Deep and concrete:** mechanisms with names, data shapes (YAML/TS), triggers, numbers, ≥2 mermaid diagrams, tables,
  worked examples; ASCII wireframes where UI is involved.
- Carry forward the seats' best material, the Round 3 expander's additions that land in your topic, the red team's design
  answers for failures in your topic, and the spike findings (`r4-spikes/`) — cite the source file inline in brackets,
  e.g. `[S04 §2.3]`, `[R3-red X01]`, `[SP3]`.
- Every risk gets a design answer, never a cut. Mark targets and speculation as such; never invent facts about real companies.
- End with **"Open questions"** (≤3, each with a recommendation) and **"Sources"** (the files you drew on).
- Do not write backticked ids that start with the letter c and a hyphen (the ledger lint treats them as claim ids).

## Mechanics
- Use the **Write** tool to write your file (path in your brief). Write the skeleton with all headings first, then fill
  section by section with Edit, so running out of turns never loses work.
- Do not commit. Return a **≤150-word summary**: size, what's in it, and any conflict you found with the canon or
  another file's territory.
