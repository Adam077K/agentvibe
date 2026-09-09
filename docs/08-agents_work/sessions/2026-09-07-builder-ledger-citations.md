---
date: 2026-09-07
role: builder
task: ledger-citations
qa_verdict: PASS
tier: lite
risk: lite
branch: ceo-1-1788609834
commits: 1
---
# Nineteen dangling citations, triaged one at a time — 2 registered, 17 declared

**The failure was one cause and two red steps.** `node scripts/ledger.mjs lint` exits 1 with *19 problems*, and `scripts/ledger.test.mjs` runs that same lint and asserts it clean, so `check:ledger-lint` and `test:ledger` fail together. The 19 are backticked claim ids in four lane files — `rethink/L2-company.md` (5), `rethink/L7-cross-model.md` (5), `review/night-safety.md` (5), `review/sandbox-P5-envelope.md` (4) — each in a closing table headed *"claims this lane emits"* or *"claims this lane would register"*. Two of the four say in the heading why nothing was appended: *"this lane holds no `claim-append`"*. The finding-bearing prose of all four files is untouched; only `.claude/unresolvable-citations.yml`, `.claude/ledger/index.json` and this file changed.

**TWO were registered, and the test for registering was not "is it true" but "is there a deterministic check over something this repository owns."** `c-night-child-carries-no-project-hooks` and `c-allowwrite-only-widens` are below. Both check `.claude/settings.json`, both carry `evidence.configuration_only: true`, and that flag is the honest half: the live-behaviour clause of each — that a `--restricted` child discards the project tier, that `allowWrite` cannot confine — was measured in a cell and is **not** what the command re-runs. Negative controls run before committing: pointing the `allowWrite` grep at `package.json` gives exit 1, so the check can fail.

**SEVENTEEN were declared in `.claude/unresolvable-citations.yml` as `scope: none`, with a per-id reason, and the reasons are not one reason.** Ten are framing about the unratified final-v2 plan whose named verifiers are files that do not exist — `roster.yml`, `charter.yml`, `keel/shared/routing.yml`, `bin/check-stores`. Five are cell measurements whose only re-check spawns a live `claude` child, a locked keychain or a provider account; `check:ledger-verify` is a step of `npm run check`, so registering those would spend a model call per check run and be nondeterministic besides. Two — `c-tool-absence-is-the-only-unwalkable-control` and `c-reversibility-compiles-not-enforces` — were proposed as `scope: global` + `verified_by: judge` with no panel, and this repo already carries three of those resolving `unresolved` forever; a fourth adds a would_block and no knowledge.

**One of the nineteen is already false by its own stated falsifier, and that is a finding rather than a cleanup.** `c-l7-family-provenance-absent` asserts *"No field in v2's handover, brief or event-log schema records which model family made or checked an artifact"* and names its falsifier as *"any schema in `final-v2/parts/` naming `maker_family` or an equivalent"*. `docs/03-system-design/final-v2/parts/06-a-run.md` declares `maker_family`, `maker_model`, `checker_family` and `checker_model`, added by fix round D — **the same commit day as L7 itself** (`075e187` and `9d4890b`, both 2026-09-06). Two lanes on one day, one closing a gap the other was still recording. L7's file is left exactly as written, because it was true when written; the exemption reason carries the correction.

**Three ids named as strong registration candidates were not registered, and the premise is where the disagreement is.** `c-restricted-removes-bash`, `c-restricted-composes-with-settings` and `c-keychain-lock-fails-fast` each have a deterministic **cell** — a procedure a lane ran once, with a positive control — and no deterministic **check**: every one needs a live CLI child or an interactively locked keychain. A rot-check proxy was considered and refused, because the only repo-state string available to grep is the review file recording the measurement, and a resolver that greps the document asserting X for the words "X" has passed something it did not check. Building a real probe for them is `bin/probe`-class work and an architectural decision this task did not hold.

**Verified, before and after, `$?` read directly.** `npm run check:ledger-lint` → **19 problems, exit 1** → **clean, exit 0**. `npm run test:ledger` → **exit 1** (`ledger.test.mjs` shells out to that same lint) → **218 tests · 217 pass · 0 fail · 1 skipped · exit 0**. `npm run check:ledger-build` exit 0 after `ledger build` — the index is generated, and 42 project claims became 44. `npm run check:ledger-verify` → **87 pass · 9 would_block · 0 block**; both new claims resolve `✓` with the `(configuration-only: verified configuration, not live behaviour)` annotation, and every one of the 9 predates this change. `npm run check` → **48 of 48 passed · 0 failed · exit 0 · 195.5s**, sandbox armed. **One step failed on the first run and it was mine:** `check:map` exit 1, because `CODEBASE-MAP.md` is generated and counts the ledger — the whole staleness was `42 → 44 project claims` and `internal-fact 16 → 18`, 8 diff lines, no unrelated drift swept in. Tier from `node scripts/classify.mjs`, not assumed: floor **lite** — `.claude/unresolvable-citations.yml` and `.claude/ledger/index.json` match no rule in the tier map and take the default, and `docs/**` is `trivial`.

**Standing caveat:** this PASS means the checks ran green, not that the tier was satisfied — single agent, single model family, accepted risk to 2026-11-17.

```claims
claims:
  - id: c-night-child-carries-no-project-hooks
    assert: "Both hooks this repo relies on — PreToolUse/pre-tool-use.sh and SessionStart/session-start.js — are registered in the PROJECT tier settings file, which is the tier a --restricted child discards (review/restricted-hook-cell.md cells B2 and B3), so the destructive-command guard does not bind an unattended night run"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence:
      cmd: "grep -qF 'SessionStart' .claude/settings.json && grep -qF 'node .claude/hooks/session-start.js' .claude/settings.json && grep -qF 'PreToolUse' .claude/settings.json && grep -qF '.claude/hooks/pre-tool-use.sh' .claude/settings.json"
      expect_exit: 0
      configuration_only: true
    valid_until: 2026-12-07
    confidence: 1

  - id: c-allowwrite-only-widens
    assert: "sandbox.filesystem.allowWrite cannot confine — denyWrite is the narrowing verb (review/sandbox-P1-measure.md R1 driver3 cells F/G) — and this repo's live .claude/settings.json carries a non-empty allowWrite and ZERO denyWrite entries, so nothing in it narrows the sandbox filesystem"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence:
      cmd: "grep -qF 'allowWrite' .claude/settings.json && ! grep -qF 'denyWrite' .claude/settings.json"
      expect_exit: 0
      configuration_only: true
    valid_until: 2026-12-07
    confidence: 1
```
