# Phase 3 Handoff — the claim ledger spine

> **CLOSED 2026-08-11.** Phase 3 is complete; all three gate criteria were met by execution and are recorded
> in [AGENT-SYSTEM-REBUILD.md §4](AGENT-SYSTEM-REBUILD.md) and [CLAIM-LEDGER.md](CLAIM-LEDGER.md). This
> document is kept as the record of what was handed over and what the handing-over team got wrong — three of
> its five "traps" fired, and one of its assets-table rows was still stale. Do not treat its "State at
> handoff" numbers as current.

**For:** the team executing Phase 3.
**State at handoff:** Phases 1 and 2 complete and merged. `main` = `72337f8`. `npm run check` exits 0.
**Read first:** [AGENT-SYSTEM-REBUILD.md](AGENT-SYSTEM-REBUILD.md) · [ADR-001](adr/001-claim-ledger-as-enforcement-spine.md)

---

## 1 · Where the system actually is

Not what the docs claim — what was measured.

| | Before Phase 1 | Now |
|---|---|---|
| Mechanisms that can block | 1 | **6** |
| CI runs, ever | 0 | every PR |
| Tracked files | 2,290 | 657 |
| `schema-lint` | exit 1 (11 pass / 15 fail) | exit 0 (26 / 0) |
| Launcher copies | 15 standalone, 8 generations | 1 program + 3-value config (agentvibe); 11 still standalone until Phase 9 |

**What blocks today**, each verified by opening the file and reading its exit path:
`pre-tool-use.sh` (`exit 2`) · `schema-lint.js` · `gate-logic.test.mjs` (23 tests) ·
`build-skills-manifest.mjs --check` · `check-registration.mjs` · `warroom-install.test.mjs` (11 tests).
All but the first run through [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

**What does not block:** `qa-lead-pass.yml` runs in **shadow** — full verdict computed, `continue-on-error: true`.
**Promoting it is Phase 3's job.** Delete one line and add it to branch protection.

---

## 2 · What Phase 3 must build

Per [AGENT-SYSTEM-REBUILD.md §3.1](AGENT-SYSTEM-REBUILD.md) and ADR-001:

1. **Claim schema + `claims-lint`** — extend `.claude/hooks/schema-lint.js`, do not write a second linter.
2. **Three resolvers** — `source` (URL 2xx + quote present + `accessed` in window), `command` (run it, assert
   exit/stdout), `judge` (reviewer lenses; at `risk: high` requires ≥2 distinct model families).
3. **`ledger build` / `ledger rebuild`** — claims live inside the artifact they support; a generated index
   compiles them. The index is never hand-edited.
4. **Three scopes** — `global` in `~/.warroom/ledger/`, `project` in the repo, `task` dies with the branch.
5. **Extend the classifier** — `.claude/qa-tier-floor.yml` from `path → tier` to
   `path → {tier, resolvers[], required_claim_kinds[]}`. **One file computes risk.**
6. **Shadow mode everywhere**, except outbound send, deploy, migration and harness self-edit, which block
   from day one.

### The gate to proceed

> A doc with a deliberately dead URL and an expired `valid_until` fires **both** resolvers as `would_block`
> in `events.jsonl`; `ledger rebuild` reproduces the index **byte-identically** from a clean clone.

Add one more, given what Phase 1 found: **`qa-lead-pass.yml` promoted to blocking, with one PR observed red
then green under it.**

---

## 3 · Assets to reuse — verified, not inherited

| Asset | State | Use for |
|---|---|---|
| `.claude/hooks/schema-lint.js` | 360L, exit 0, wired to CI + Stop hook | Extend for claims. Note: it walks `.claude/agents/*.md` only — war-room is excluded **deliberately**, per its own header |
| `scripts/check-registration.mjs` | Blocking; found 7 dead paths on its first two runs | The pattern for a claim resolver: refuse on a named, checkable condition |
| `.claude/workflows/lib/gate-logic.mjs` | 23 tests, running in CI | The PASS/BLOCK verdict logic |
| `.claude/qa-tier-floor.yml` | Live, consumed by `qa-lead-pass.yml` | Extend to the one classifier |
| `~/.<project>/events.jsonl` | Live, written by the launcher | Where `would_block` goes |
| `scripts/warroom-install.mjs` | 11 tests | The model for plan-then-apply and refuse-don't-guess |

**Two rows of the old assets table were wrong** (`qa-lead-pass.yml` is 343 lines with 6 blocking exits, not
176/4; `.agent/` was not an inert mirror). The table in AGENT-SYSTEM-REBUILD.md §5 carries a warning. Re-verify
any row before you rely on it.

---

## 4 · Standing rules — each earned by a specific failure

**1 · Verify by running. A pattern-matched count is a hypothesis.**
The enforcement diagnostic asserted 16 fabrications. **Six were not fabrications** and seven of its numbers
were wrong — it grepped where it claimed to have opened files. Mark every figure VERIFIED or ESTIMATED.

**2 · A repo-scoped search cannot see the fleet.**
Phase 1 deleted `.claude/agents/_seeds/` as "9 orphans, zero references." **8 of 12 launchers read
`_seeds/ceo.md` at startup.** The search covered the repo; the mechanism lived in `~/bin/`. This system's
mechanisms live in both places.

**3 · Test the artifact a guard produces, not just the guard.**
Six install guards were each verified by executing their failure. All six passed. A backup still shipped
non-executable, because the sandbox seeded its file at `0755` — the mismatch the bug needed was never
constructed. *Testing that a backup is taken is not testing that what comes out of it runs.*

**4 · Never assert library or syscall behaviour. Run it.**
"`copyFileSync` truncates in place so the destination keeps its mode" — false on macOS, where Node uses
`fcopyfile` and copies the source's metadata. That claim, made confidently in prose, broke the founder's
launcher.

**5 · Check what depends on a thing before deleting it.**
All 154 MANIFEST paths pointed into `.agent/`, the directory the plan said to delete first. The stated order
would have broken the skills system in the same commit.

**6 · A stop condition that cannot fire until the end is not a stop condition.**
Stop condition 5 had to be split into 5a/5b when rollout moved to Phase 9. Phase 3's shadow-mode window has
the same shape: **decide now what evidence promotes a rule to blocking, and when that decision gets made.**

**7 · Every rule names a hook, CI job, resolver, or data file — or it is deleted.**
See CLAUDE.md § Rules: 8 rules, each marked `ENFORCED`, `SHADOW`, or `ADVISORY` with the phase that will give
it a mechanism. Phase 3 converts several ADVISORY rules to ENFORCED. Do not add a rule without a mechanism.

---

## 5 · Traps specific to Phase 3

- **`schema-lint.js` silently disables its skill check** if MANIFEST is unparseable (`catch → LIVE_SKILLS = null`).
  A claims-lint with the same shape would fail open. `check-registration.mjs` covers the MANIFEST case; cover
  yours.
- **`judge` resolvers inherit model-tier reliability.** One studied system documents its cheapest tier
  *"degrades toward confident false-pass"* on exactly this task. Label every judged claim with the tier that
  judged it, and re-validate on tier change.
- **The claim-decomposition tax is unmeasured.** No studied system ships a per-task claim envelope both checked
  against behaviour and on by default. Measure the overhead in the shadow window; stop condition 3 exists for this.
- **Self-review is circular from here on.** Phase 1 was externally verified by CI executing code. Phase 3 designs
  the mechanism that will verify Phase 4+. Getting the resolvers wrong is not self-correcting.
- **44 agents declare `mcpServers` with no MCP config anywhere.** `check-registration.mjs` reports it as a
  warning. If Phase 3 adds capability claims, this becomes 44 false claims on day one — coordinate with Phase 4.

---

## 6 · Open items inherited

| Item | Owner | Notes |
|---|---|---|
| Promote `qa-lead-pass.yml` to blocking | Phase 3 | One line + branch protection |
| 44 decorative `mcpServers` declarations | Phase 4 | Warning today |
| 12 GSD agents + 6 Leads live in `~/.claude/agents/`, not the repo | Phase 4 | Fresh clone won't have them |
| 24 of 25 war-room agents call unconfigured services | Phase 6 | ~3 rebuilt, rest deleted |
| Fleet rollout to the other 11 launchers | **Phase 9** | Nothing but `agentvibe` is written to before then |
| Monthly: re-run the fleet baseline script | ongoing | Stop condition 5b — if generations rise, deferring rollout is costing more than assumed |
| CLAUDE.md caps session summaries at 10 lines | founder | Several files break it; the cap is unenforced prose |

---

## 7 · How to work

```bash
git checkout -b feat/phase-3-<slug> origin/main
npm run check          # must exit 0 before you push — same checks CI runs
gh pr create --base main
# label risk:irreversible if you touch .claude/agents/**, .github/workflows/**, or migrations
# session file required: docs/08-agents_work/sessions/YYYY-MM-DD-<role>-<branch-slug>.md
#   frontmatter needs qa_verdict: PASS — the shadow QA gate looks for it by branch slug
```

**Stop at the end of Phase 3.** Do not start Phase 4.

---

*Handoff written by: ceo · 2026-08-11 · `main` = `72337f8`*
