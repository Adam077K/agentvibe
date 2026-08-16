---
date: 2026-08-15
role: ceo
task: rce-allowlist
tier: full
qa_verdict: PASS
---

Closes the three confirmed RCEs recorded in [SECURITY-FINDINGS-2026-08-14.md](../../03-system-design/SECURITY-FINDINGS-2026-08-14.md), by Founder decision of 2026-08-15 ([DECISIONS.md](../../../.claude/memory/DECISIONS.md)): **allowlist trusted roots, plus reject `Sec-Fetch-Site: cross-site`.** New `server/trust.ts` and `server/routes/guard.ts`; edits to `server/state.ts`, `server/projects.ts`, `server/collectors/fleet.ts`; `test/trust.test.ts` (678 lines).

**All three vectors CONFIRMED closed, each executed against both ends.** An exploit demonstrated only against the fix proves nothing, so each was first run against base `609839f` to prove it works at all: **RCE-1** — `core.fsmonitor` from a discovered repo wrote a marker file (uid 501) during the conflicts sweep on base; on head with no trust file the marker is **absent** and the project is still **reported, not hidden**, with the trusted control still firing. (`git status` triggers fsmonitor; `git worktree list` does not.) **RCE-2** — `/api/belief` ran a hostile `scripts/ledger.mjs` on base; on head an untrusted project does not run it and a trusted one does, with the gate **fail-closed** (`!== true`). **RCE-3** — a fenced command-claim reached `/bin/sh` via `verify --offline`; **`--offline` does not disable exec, only `--no-exec` does** — a distinction nobody had recorded — and head gates it identically.

**The load-bearing requirement holds: an untrusted project renders PRESENT with its reason**, and both the server and client denominators remain the whole fleet. A control that made projects vanish would have been a p1 regardless of how well the RCEs were closed, because a security control that silently hides data is a fresh instance of the defect class this codebase is named for.

`Sec-Fetch-Site: cross-site` is rejected **first, before any `Origin` check**; `Origin` is defence-in-depth only, never the primary gate — which matters because `Origin` is **absent** on `<img>`, `<script>`, `<link>`, form GET and no-cors `fetch`, so a check treating absent as allowed lets every subresource vector through. An absent `Sec-Fetch-Site` **fails open**, documented, since non-browser clients send none. Trust-list parsing was probed for symlinks, `..` traversal, prefix collisions, trailing slashes, APFS case-sensitivity, and empty/missing/unreadable files — **all fail-closed, executed**.

**Wording verified rather than trusted:** the guard is only ever described as blocking *"cross-site browser requests"*; every occurrence of "drive-by" is an explicit negation, and a test pins `reason.not.toContain('drive-by')`. The author also struck the Origin recommendation from the findings doc, preserving the original finding as found and marking the correction rather than rewriting it.

Mutations, sha256-anchored with shas restored: disabling the header check turns **11** tests red including *"cross-site performs NO WORK"*; disabling the belief gate reddens F2/F3; reverting the conflicts partition reddens F1 and the denominator. Full suite **261 pass**.

**Three LOW findings, none blocking, all recorded rather than fixed here.** **L1 —** `fleet.ts listWorktrees` runs `git worktree list` against every discovered repo **ungated**; benign today because that command honours no program-executing config (confirmed: fsmonitor does not fire), but it is a residual subprocess outside allowlist coverage and should not be assumed safe forever. **L2 —** the defence-in-depth `Origin` check is slightly stricter than the "same-site reaches everything" wording implies, for CORS requests. **L3 —** CLI orphan detection uses a non-canonical `project.root`.

**Review: PASS on security and correctness, single anthropic model family** — **not** the ≥2-model-family independent panel the `adversarial` and `security` lenses require at tier `full`, and no review in this phase has met it. Recorded, not papered over.

Tier `full` by CEO judgement, **not by mechanism**: `node scripts/classify.mjs` floors every mission-control path at `lite` (`matched: (none — default)`), so the code deciding whose code gets executed classifies as lite today. That is #34·#35, now the fourth PR tiered by hand, and fixing it requires editing `qa-tier-floor.yml`, itself `irreversible` tier.

**What this does not close, stated plainly:** `same-site` is allowed, so any other service on the user's loopback still reaches everything, and a non-browser client sends no such header at all. The control blocks cross-site browser requests. It is not a general fix for a hostile local process.
