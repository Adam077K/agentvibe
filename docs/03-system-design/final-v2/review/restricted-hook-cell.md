# `--restricted` and the project tier — the settling cell

*Dispatched 2026-09-07 to settle an apparent contradiction between `review/night-safety.md` and
`review/r46-classifier.md`. Engine: `reviewer` — **which has Bash but no `Write`**, so the lane could
not create this file and returned its findings as a message. **Recorded verbatim by the orchestrator.**
That is the third lane this round mis-dispatched the same way; the correction is in
`.claude/memory/LONG-TERM.md`.*

*Raw transcripts the lane left behind: `/tmp/claude-501/rcell/*.jsonl`, with its summariser at
`/tmp/claude-501/rcell/sum2.mjs`.*

---

## Answer: No. The hook does not survive `--restricted` — and the question is not malformed.

`--restricted` **does** remove `Bash` (confirmed: 34 built-in tools → 29, no `Bash`; also drops `WebFetch`, `Workflow`, `LSP`, `Monitor`, `CronCreate`, `RemoteTrigger`). But that is a *separate* effect, and I isolated it two ways. With `--tools "Bash,Read"` Bash comes back, the probe command **executed**, and **no `PreToolUse` hook event exists in the stream**. Independently, `Write` survives `--restricted` natively, and it too produced **no hook event**. The registration is discarded; it is not merely unreachable.

Both lanes are correct. `night-safety.md` is right about a `--restricted` child; `r46-classifier.md` is right about a plain `-p` child. They never disagreed.

### Cells (all via `--include-hook-events`, haiku-4.5, `--permission-prompts none`)

| cell | shape | Bash | hook event | control attributed by verbatim signature |
|---|---|---|---|---|
| A1 | `-p`, `echo` | yes | **yes**, `exit_code: 0` | `hook_response PreToolUse:Bash` |
| A3 | `-p`, Write→`$HOME` | yes | **yes**, `exit_code: 2` | `[pre-tool-use] BLOCKED: write outside the project root is refused` |
| B | `--restricted`, `echo` | **no** | — | `init.tools` lacks `Bash`; model reports no Bash |
| **B2** | `--restricted --tools Bash` | yes | **none** | command **ran** (`probe-ok-marker`) with zero hook events ← decisive |
| **B3** | `--restricted`, Write→`$HOME` | n/a | **none** | refused by a *different* control: `--restricted confines the file tools to the working directory` |
| C | `--restricted --settings <hook>` | n/a | **yes**, `exit_code: 2` | `[pre-tool-use] BLOCKED: .env files must be edited via your system editor` |
| D0 | `-p`, `curl 127.0.0.1:1` | yes | yes, `exit_code: 0` (hook **allows** localhost) then denied | `Permission to use Bash with command … has been denied.` = deny list |
| D1 | `--restricted --tools Bash` | yes | none, no deny | `…no approval surface…` = prompt-none, **not** the deny rule → project deny discarded too |
| D2 | `--restricted --tools Bash --settings <deny>` | yes | n/a | `Permission to use Bash with command … has been denied.` → supplied deny works |

Four distinct refusal signatures were observed and kept apart: hook (`exit_code: 2` + `[pre-tool-use] BLOCKED:`), deny rule, prompt-none, and restricted confinement. B3 is the exact trap the brief named — the action failed, and not because of the hook.

### For `bin/run`'s dispatch shape

A `--restricted` child loses three things at once: `Bash`, the `PreToolUse` hook, and the project `permissions` block (allow **and** deny). `--tools` restores Bash without restoring either control — that combination is the dangerous one. `--settings` restores hooks (C) and deny rules (D2) and is the only lever measured to work. Band 2 cannot run a test or a commit under bare `--restricted` at all.

Caveats: single agent, single model family — a measurement, not an independent panel. Nothing recommended about sandbox posture.
