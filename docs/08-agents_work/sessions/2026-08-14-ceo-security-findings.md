---
date: 2026-08-14
role: ceo
task: security-findings
tier: lite
qa_verdict: PASS
---

The three RCEs found by the PR #30 security lens existed only in a session scratchpad under `/tmp` and in a task list — both session-lifetime. This records them durably at `docs/03-system-design/SECURITY-FINDINGS-2026-08-14.md` with enough detail to reproduce and to verify a fix: git `core.fsmonitor` executed via the conflicts sweep (and the same request rendering that worktree as **clean**), `node <discovered-project>/scripts/ledger.mjs` executed via `/api/belief` with `?project=` choosing whose code runs, a claim's `evidence.cmd` reaching `/bin/sh -c`, and no Origin check on side-effecting GETs — which turns all three into a drive-by once one untrusted repo sits under `MC_PROJECT_ROOTS`.
The document leads with the finding behind the findings: **"`server/**` invokes no shell" is literally true and operationally void** — the shell is one `execFile` away, in a program the guard does not scan, reached with caller-controlled data. Three PRs and four review rounds defended an invariant that was not the one protecting the system, which is §0 applied to an invariant rather than to a mechanism. So the remediation section states that a fix must change **what is claimed**, not only what is checked, and that leaving the old wording in the README teaches the next reader to check the wrong thing.
Three directions are costed rather than one recommended, because this is a Founder design decision and not a patch: stop executing programs from discovered directories (removes the class), allowlist trusted roots (keeps the feature, moves the decision to the user), or accept and bound it with an Origin check plus a claim carrying an expiry so the acceptance is re-decided rather than forgotten. **F6 should close regardless** — an Origin check is cheap and removes the drive-by vector from all three. Docs-only; no code touched, nothing fixed here, status recorded as OPEN. Author-declared verdict, no reviewer — #24.
