---
role: ceo
task: codex-fleet-rollout
date: 2026-09-10
tier: irreversible
qa_verdict: NOT_RUN
branch: ceo-1-1788609834
head: 7bf95ea
---

Codex runs beside Claude in the war room, and ten projects are on it. Two defects were found by
launching it rather than reading it: a Codex pane opened on an update chooser whose default action
was `npm install -g` (fixed, `b9f0020`), and a directory-trust prompt behind it (left alone — a
founder's security decision, one keypress per project).

The acknowledgment left git (`7bf95ea`). It was `codex_unsandboxed_ack:` in a tracked `.warroom.yml`;
a PR could flip the control gating an unsandboxed pane, and the key existed on this branch but not
on `main`, so `git checkout` moved the machine's security posture. It is `WARROOM_CODEX_ACK=true` or
`~/.warroom/codex_ack` now — which also made a ten-project rollout one file instead of ten commits.

Evidence: `npm run check` 48/48, exit 0. `check:warroom` 110/110. Preamble reaches the model —
`codex debug prompt-input`, 42,113 bytes, five sentinels, negative control clean. Per-project
identity real: agentvibe's brief names `reviewer-readonly reviewer sourcer`, ghostb's names
`adversary-engineer qa-lead`, 47 lines differ.

**`qa_verdict` is NOT_RUN, deliberately.** These commits floor at irreversible and the binding panel
has not judged them, so this work is not merge-eligible. The oracle passing is not the tier being
satisfied. Also unfixed: `ml2` (inlined preamble), and one recorded mutation that does not go red
(`-f` → `-e` in the ack file guard).
