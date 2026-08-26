---
date: 2026-08-26
role: builder
task: shellops-p1-round-10
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: fix/shellops-comment-procsub-yaml
commits: 3
---
# Round 10: `|N` refused, one false finding removed, four holes enumerated and left alone
**`|N` is REFUSED, and it is pre-existing.** The header regex accepted an explicit indentation indicator and the body baseline came from the first CONTENT line, so a deeper first line made every later line close the block: `run: |2` with 14/12-space body parsed as `"npm run test:gate"` and returned `[]` while PyYAML gives the whole two-command string. **Measured identically on `main` (7f7bddd) and round 9 (bff6bbe)** — the round-9 reviewer predicted it was new, ran the pre-image, and reported its own prediction wrong. `>2`, `|2+`, `|-2` the same; `|9` is invalid YAML. One more deletion, not one more model.
**Chomping stays read, verified here not inherited.** `|-` and `|+` change only the trailing newline — measured — and a trailing newline is not a second command. Refusing them would cost the escape hatch for nothing. Both give the identical finding on both trees.
**The false `unguarded` finding is gone — and I correct my own provenance claim.** `if: "${{ !cancelled() }}"` is a *correctly guarded* step; the quoted scalar is refused and left raw, so `s.if !== CI_GUARD` also reported it as carrying no guard. **`main` reports it unguarded too**, so this range did not introduce it: round 8 masked it as a side effect of unquoting, and deleting the decode took the mask away. Not fail-open — a refused `if:` blocks on its own, so a quoted *and* weakened guard still fails the build, once, with a true message.
**That predicate was spelled twice in the test file**, so the fix had to land in both copies or they would disagree about the same workflow. It is `unguardedSteps()` in the library now — one implementation, exported, mutated.
**The JSDoc said "The escape hatch is total."** The hatch is; the *reading* of it was not, which is exactly what `|N` proves. That is this repo's defining defect — a sentence overstating what is enforced — sitting inside the argument the whole refusal rests on. Split into the claim and the check.
**Item 5, decided by measurement rather than taste:** `ciRunCommands` keeps refused text. A refused step already produces a **blocking** `ciChainFindings` finding against the real allowlist, so the runner-ban's view of it is unreachable in a workflow that can merge; excluding would make the ban blind on text it currently half-sees, for nothing.
**Four pre-existing holes enumerated, none built.** Second job · `run :` with a space · flow-mapping step · quoted `"run":` — **all four confirmed silent-clean on `main` and here**. The 47-vs-48 claim is resolved and **both halves are true of different checks**: `ciChainFindings` is silent on a second job, while the parser cross-check goes red at 47 vs 48 — loud, but on a step-count technicality and only against the real file.
Verified: `npm run check` → **43 of 43 · 0 failed · 90.5s · exit 0** · `test:check-suite` **58 pass · 0 fail** · seven mutations, all seven bite · defeater hunt over 73 workflow shapes: 25 agree · 39 refused · 1 pre-existing over-report · **0 bypasses**.
