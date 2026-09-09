---
date: 2026-09-09
role: builder
task: warroom-codex-engine
tier: irreversible
qa_verdict: PASS
branch: vision-path-and-warroom-codex
---

- Measured codex-cli 0.153.4 into `docs/03-system-design/final-v2/research/codex-in-the-pane.md`: every claim carries its command and exit code, and no probe cost a turn — all ran against an empty `CODEX_HOME`, so spending was structurally impossible rather than merely avoided.
- Proved with sentinels through `codex debug prompt-input`: `AGENTS.md` is honoured, `AGENTS.override.md` REPLACES it, `$CODEX_HOME/AGENTS.md` is additive, and `-c developer_instructions=` injects the real 2,931-byte preamble verbatim. That last one is the mechanism the build uses.
- `bin/warroom`: engine is now per-pane data (`--engine codex`, `--engine 2:codex`, `engine:` in `.warroom.yml`). Default stays `claude`; `send_launch_claude` survives as an alias over `send_launch_engine`; the `command -v` guard names the engine that will actually launch; unknown engines are refused before tmux builds anything.
- One preamble source (`.claude/entry/ceo.md`) rendered per engine via `render_ceo_preamble`; new `warroom engine [N]` / `engine render <E>` make the resolution observable without tmux, which is what let the tests assert behaviour instead of a constant.
- 14 new tests in `scripts/warroom-engine.test.mjs` (wired into `test:warroom`). Ten mutations applied to my own fix, each confirmed RED; one mutation silently failed to apply on the first attempt and would have left a test unproven.
- Corrected a stale premise in `PROFILES.codex` — Codex IS installed now — while keeping `verified_against_binary: false`, because the flag governs the parse of a COMPLETED turn and every probe stopped at 401.
- RETRACTED my own finding before it reached the founder: I wrote that `codex exec`'s no-exit-on-auth-failure hangs `claim-judge-external` and defeats Rule 10. It does not — `runExternalJudge` already spawns with a 120s timeout and SIGKILL and maps ETIMEDOUT to `unresolved`. What hung was my own untimed shell probe, and I generalised from an action failing instead of reading the control, which is the error this research file sets as its governing rule. Residual and real: an unauthenticated codex burns the full 120s and reports as a timeout rather than as unauthorized.
- The war-room TEMPLATE (`war-room/bin/PROJECT_NAME.tmpl`, what `install-war-room.sh` ships to new projects) deliberately does NOT get the engine layer: it has no config layer at all (`_cfg` hits: 0) and already inlines a second copy of the CEO preamble, so porting would make a third. Written up in `war-room/README.md` with the three checkable blockers; same tracked P1 as the merge gate.
- Fixed two `npm run check` steps my change broke: `test:launcher-permissions` (assertions followed to `engine_launch_cmd`; one was vacuous on first attempt and was tightened) and `check:map` (regenerated). `Tally: 48 of 48 passed · 0 failed · 209.0s`.
- UNDETERMINED and reported, not papered over: whether the Codex TUI accepts a multi-line `send-keys -l` block (unauthenticated Codex shows a login chooser; `~/.codex` is denyRead and was not escalated). Ghostty needs nothing — both terminfo entries resolve — so no code was written for it. Single Anthropic family; irreversible tier's 2-of-3 multi-judge is unmet.
