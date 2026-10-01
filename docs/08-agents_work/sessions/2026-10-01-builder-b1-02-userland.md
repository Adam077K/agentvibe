---
role: builder
task: b1-02-userland
branch: build/b1-02-userland
tier: lite
qa_verdict: PENDING
---
userland/src/nouns.ts implements the 7 Zod schemas + toJSONSchema; exports unchanged. `pnpm --dir userland run test:donetest` gives 99 of 99 pass; `node build/check-done-tests.mjs` exit 0 (11 hashes, 3 registers). No frozen file or kernel/ path touched.
Choices for the reviewer: bigints decode to bigint via z.codec; the wire string must be canonical decimal (no sign, no leading zero) bounded at 2^64-1 by a generated regex, so the JSON Schema refuses what decode refuses (200k random strings vs BigInt: 0 mismatches). Raw canon types are z.json(), required where 09a §3 requires. ULIDs get only the non-empty *Id rule. JobState/EffectState stay plain strings (canon does not enumerate them).
pnpm: package-lock.json deleted; pnpm-lock.yaml from pnpm 9.12.3 pins zod 4.6.5 with the same sha512 as the npm lock; packageManager pnpm@9.12.3; `pnpm install --frozen-lockfile --ignore-scripts` exit 0. Classifier: all paths lite/trivial.
Open: B1-02.yml's frozen Run line still says `npm --prefix userland ci`, which now fails with no package-lock; a register change, not mine. Untracked .pnpm-store/ at the worktree root (rm -rf hook-blocked); not committed.
