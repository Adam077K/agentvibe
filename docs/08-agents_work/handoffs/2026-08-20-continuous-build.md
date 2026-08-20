# Handoff — the continuous build

**From:** ceo (`ceo-3-1787176363`) · **Date:** 2026-08-20 · **Base:** `main` = `5b8e127`

> Founder decision: build the target architecture continuously — parallel lanes, review kept, running until
> done rather than to a calendar. This says what landed, what is queued, and the one thing that must happen
> before lanes can run at all.

---

## 0 · Read this first — you cannot run lanes yet

**Parallel lanes require a session restart.** All three isolation mechanisms fail inside a session started
before `af5a0c1`:

| Mechanism | Result |
|---|---|
| `git worktree add` into `.worktrees/` | `EXIT=1` — "Operation not permitted" |
| Agent `isolation: "worktree"` | worktree **is** created under `.claude/worktrees/`, but the agent **cannot write to it** |
| worktree nested inside the writable project root | refused — git must write the main repo's `.git/` metadata |

The cause is one rule: **writes outside the session's project root are denied.** `af5a0c1` adds
`**/.worktrees` to `sandbox.filesystem.allowWrite`, and settings are read **at session start**, so it cannot
take effect in the session that wrote it.

Measured, so the restart is not a guess: `mkdir` into the main repo's `.git/` **succeeds** (already
allow-listed) while `mkdir` into its `.worktrees/` is **denied** — which is exactly the gap `af5a0c1` closes.
A restart should therefore work. **Verify it before dispatching anything**, and if it fails, say so rather
than falling back to one shared tree — see §1.

**Do not run two lanes in one worktree.** It was tried here. The second lane's `git switch` carried the
first lane's uncommitted files along, and one `git add -A` would have duplicated a pushed branch inside an
unrelated commit. It was caught by checking branch state before writing, not by any mechanism. Worse, git
could not restore the files afterwards — `unable to unlink old '.claude/settings.json': Operation not
permitted` — leaving the tree stuck until a `--discard-changes` switch onto the branch that owned them.

---

## 1 · What landed

Two branches, both off `5b8e127`, both **irreversible** floor, neither merged.

**`feat/provenance-that-travels`** — pushed, 11 commits.
P0.5 plus two founder decisions. Lens provenance now validates against a vendored content-addressed
manifest, so a generated project passes the lint instead of failing before anyone touches it. Reviewed
FAIL → fixed → re-verified: the first cut moved the failure from step 1 to step 17 rather than removing it.

**`feat/merge-gate`** — local only, 4 commits.
`warroom merge` refuses a merge with no verdict bound to the diff it reviewed. 15 tests. The anchor is
`sha256` of the diff against `merge-base origin/main`, excluding the verdicts path so recording a verdict
does not move its own subject — proven stable by execution, then pinned as a test.

**The baseline, established for the first time: the repo is green, 28 of 28.** Not 26 — `npm run check` and
`ci.yml` each omit steps the other runs, so the true condition is their union. Three of those steps fail
*inside* an agent session for environmental reasons only (`test:registration`, `test:skill-clamp`,
`check:mc`); all three pass with the sandbox off, and CI passes them.

---

## 2 · The queue

Ordered by dependency. P0's second half is the next lane.

| | Work |
|---|---|
| **P0** | ~~`cmd_merge` gate~~ ✅ · PR-route CI-signed check-run, deleting the author-committed verdict grep · stale `MODEL-DIVERSITY.md` |
| **P1** | one launcher generation · `newproject` update path · vendor `newproject` into the repo · template substitutions |
| **P2** | `Turn.stop` — a **cache migration**, not the one-liner it is billed as · join key · real liveness · split the event log · stop tests writing the live log |
| **P3** | Kanban · detached dispatch · trust allowlist containment · two charts · MC risk tiering · agent graph |
| **P4** | `DECISIONS.md` byte-cap truth · eviction · delete Mem0 |
| **P5** | two-tier lenses · ops/customer/product playbooks |
| **P6** | 13-project rollout — last, per decision 9 |

**Four items the plan does not contain, added by founder decision 2026-08-20:** budget the prompt-craft
standard as a real constraint · de-duplicate the second risk classifier · resolve Codex-or-Gemini for real
(decision 5 chose Codex, which is uninstalled and whose invocation is unverified) · **end with one real task
driven end to end**, which is the only thing that can show the phases worked.

---

## 3 · Two holes found while closing the first one

**Tier 3, the AI-assisted merge, is a second unreviewed route.** It pipes a conflicted file to a model,
writes the raw output back, adds and commits it, guarded only by a size limit and a grep for conflict
markers. It now sits behind the verdict gate — but the verdict was recorded against the **pre-conflict**
diff, so what lands is not what was reviewed. Its own lane.

**The verdict is hash-bound, not signed.** It cannot be transferred to another diff or go stale, and anyone
with repo write can author one. Real unforgeability needs a signing key and a decision about who holds it.
Stated in the tool's own header rather than papered over.

---

## 4 · Constraints, measured rather than feared

- **The prompt-craft standard is bounded.** 22 `PS-*` rules across 60 tests, gating the **7 engine files
  only**, not the 11 shims. Touching an engine prompt costs conformance to 22 rules; not touching one costs
  nothing. The plan calls this its largest unbudgeted constraint; it is budgetable in one line.
- **`DECISIONS.md` has 91 bytes of headroom** — 39,909 of 40,000. The *entry* cap sits at 23/50 and will
  never bind, while CLAUDE.md tells every agent it has "≤50 entries" of room. Any breadcrumb longer than 91
  bytes turns a blocking CI step red. Nothing says so.
- **`test:tier-gate` is in `ci.yml` but not in `npm run check`** — found twice, independently.
- **Deadlines are a cliff, not a date.** 2026-11-09 lands **27 claims**; 36 fall between then and 2026-11-17.
  The 2026-09-08 date everyone tracks is now the small one, and nothing fires on it — the two claims that
  carried it are waived to 2026-11-17.

---

## 5 · One thing only the founder can do

`c-rolling-five-hour-window` lives in `~/.warroom/ledger/global.yml` — outside the project root, outside git,
unreachable from any PR. Its waiver **lapses 2026-09-09**, and a lapsed waiver fails harder than none. Two
independent controls refused the write and neither was routed around. The replacement text is in the session
file for 2026-08-20.

---

*Every figure marked measured was executed. Where something was not measured, it says so — including that
the restart in §0 is a prediction from two `mkdir` probes, not a demonstration.*
