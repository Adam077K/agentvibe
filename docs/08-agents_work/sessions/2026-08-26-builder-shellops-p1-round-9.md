---
date: 2026-08-26
role: builder
task: shellops-p1-round-9
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: fix/shellops-comment-procsub-yaml
commits: 3
---
# Round 9 is a deletion: the YAML modelling is gone and the shapes are refused
**I reproduced the P1 before touching anything.** `run: "npm run good <\` + `  (npm run bad)"` — an escaped line break, which real YAML collapses to NOTHING. My fold joined with a space, the leftover `\`+space decoded as the escaped-space escape, and the value came out `npm run good < (npm run bad)`: `<(` never adjacent, `ciChainFindings` → `[]`. **A silent clean on the construct round 8 added detection for.** Ninth bypass in this function, third in the YAML layer.
**The team lead's call is right, and the round-3 rule is why: the third fix of a kind means the approach is the defect.** Deleted `YAML_DQ_ESCAPES` (17 entries), `decodeFlowScalar` (95 lines), the plain-scalar fold, the `blockKeys` skip. A `run:`/`if:` value is read in exactly two shapes — plain single-line, verbatim; block scalar, joined literally — and every other shape is a refusal. **Refusing cannot under-report: there is no decoding left to get wrong.**
**Two corrections to the brief, both measured.** (1) The class must be wider than "a quote": `run: *c` with `&c npm run a && npm run b` anchored earlier is a **YAML alias** — PyYAML resolves it to the chain, this parser returned `[]`, and that was true **before round 8 as well as after**. A quote-only refusal leaves it open. Refused on the indicator class now. (2) **Block scalars must stay modelled**, and that is what makes refusing cost nothing: they have no quoting rules and no escapes, so any command that cannot be a plain scalar can be written as one. Refusing them would leave a command containing `: ` unwritable — measured, `run: node -e "a: 1"` is invalid YAML unquoted.
**Scoped to `run:` and `if:` only.** Both are compared BY VALUE and can hide a chain or an unguarded step. `name:` and `uses:` are read for identity alone, and the refusal FAILS A BUILD — `name: "Build: step 1"` is correct, harmless YAML and must not.
**Impact: ZERO, and it is the same measurement three ways.** All 44 ci.yml `run:` values byte-identical across `main`, round 8 and here; **0 of 114** governed commands changes verdict; `auditSuite` output identical.
**I attacked my own new predicate and found nothing.** Verdict differential over **52** workflow shapes against PyYAML 6.0.3: 19 agree, 32 loud refusals, 1 over-report (`run: >` joined literally — pre-existing, pinned as deliberate), **0 bypasses**. One flagged case turned out to be my harness: `bash -c '"npm run a && npm run b"'` is ONE command, so `[]` was right.
**Six of the seven blockers die with the code; the seventh I closed rather than deferred** — the CLI remedy branch now has a subprocess test that executes both arms, and three mutations against it bite.
Verified: `npm run check` → **43 of 43 · 0 failed · 87.0s · exit 0**, sandbox armed · `test:check-suite` **56 pass · 0 fail** · thirteen mutations, the one survivor labelled inert in the comment with the 58-input differential that shows it.
