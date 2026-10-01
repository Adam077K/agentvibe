---
role: builder
task: b1-02-userland
branch: build/b1-02-userland
tier: lite
qa_verdict: PENDING
---
userland/src/nouns.ts implements the 7 Zod schemas + toJSONSchema; exports unchanged. done-tests 99/99, unit tests 33/33 (`pnpm run test:unit`), `node build/check-done-tests.mjs` exit 0. No frozen file or kernel/ path touched. pnpm-lock.yaml replaces package-lock.json, with zod 4.6.5 pinned and packageManager pnpm@9.12.3.
Review round 1 FAIL fixed: raw JSON fields now pass through uncopied, so a "__proto__" key survives as it does in Go. Optional fields are absent or non-empty: rationale null or "" is refused, and so is "" for deadline and provider_ref. Label.subjects refuses [].
userland/test/nouns.test.ts pins each fix in decode and in the emitted JSON Schema. Against ddbcefa it fails 15 of 33.
Choices: bigints use a z.codec with a canonical decimal string bounded at 2^64-1. Event.rationale's JSON Schema rule is given through .meta(anyOf) because refinements are not emitted. The 1.0/1e0/-0 mismatch is recorded as accepted (orchestrator).
Open: an untracked .pnpm-store/ sits at the worktree root; the hook blocked rm -rf. The hook also blocked `git checkout --` during the pre-fix proof, and the file was restored from the scratchpad copy (git status clean).
