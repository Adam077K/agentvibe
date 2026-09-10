# Handoff — Codex in the war room

*Written 2026-09-10. Branch `vision-path-and-warroom-codex`, HEAD `37c0428`, 46 commits ahead of
`main`, not merged. `npm run check`: 48/48 green. Tree clean.*

---

## What the founder asked for

Two things, over several turns:
1. Make **Codex** runnable in the war room — a CEO pane that runs `codex` instead of (or alongside)
   `claude`, with the same standing prompts, in `agentvibe` and across the fleet (ghostb etc.).
2. Push that capability to the other projects on this launcher (the fleet).

Then, after six QA-gate rounds (below), the founder **narrowed the scope explicitly**: *"just make
sure that codex will work in the system … in the war room … move fast it's an easy task."* The
elaborate hardening loop is closed by that instruction. Do not reopen the security gate on this
branch unless the founder asks.

## What was built (on the branch, not merged)

A per-pane engine layer in `bin/warroom` (the single versioned launcher shared by shim projects):

- `<session> --engine codex` (all panes) · `--engine N:codex` (one pane, mixes with a default) ·
  `engine: codex` in `.warroom.yml`. Default stays `claude` — change nothing, nothing changes.
- Unknown engine is **refused**, never silently defaulted.
- A Codex pane gets a **translated preamble** rendered from ONE source (`render_ceo_preamble`):
  the "you are Codex, not Claude Code" adapter (no `Agent` tool, no `.claude/agents/` dispatch, no
  `/color`, no `@"name (agent)"`) plus the standing CEO brief, delivered via
  `-c developer_instructions="$(cat <file>)"`. Resume form is `codex resume <id>`.
- `<session> engine [N]` dry-runs the launch lines and starts nothing; `engine render <E>` prints
  the preamble as engine E receives it.
- Codex requires an explicit acknowledgement (`codex_unsandboxed_ack: true`) — see "Known
  limitation" below.
- `war-room/bin/PROJECT_NAME.tmpl` (the OLD generation used by newly-installed projects) was
  deliberately **not** given the engine layer — it has no config discovery and inlines its own
  preamble. See `war-room/README.md` § Engine choice. Migrating a project to a shim (below) is how
  it gets the engine layer.

Measured Codex facts are in `docs/03-system-design/final-v2/research/codex-in-the-pane.md`:
instructions file is `AGENTS.md`; `-c developer_instructions=` is additive and carries the real
preamble verbatim; `PROFILES.codex`'s `codex exec - --json` argv is real (`verified_against_binary`
stays `false` — no completed turn was ever run, by design).

## The QA-gate saga — six irreversible-tier BLOCKs, and what it means

The branch touches `scripts/lib/**`, so it floors at `irreversible`. The binding gate ran six times.
Security findings by round:

| Round | P1 | P2 security | Note |
|---|---|---|---|
| 1 | 3 | — | config→shell injection, entry_ceo exfil, tool-scoping-as-prose |
| 2 | 2 | — | session_id injection, more |
| 3 | 1 | — | seed-file exfil (same class, sibling path); judge output corrupted |
| 4 | 0 | 2 | state_dir base too broad; python-source injection |
| 5 | 0 | 0 | quality/coverage only |
| 6 | 1 | 3 | **the ack gate is satisfied by untrusted git-tracked config** |

The security work was real and is done for rounds 1–5: config values can no longer reach a pane's
shell, files read-and-shipped-to-the-LLM are confined physically (not just lexically), the whole
`python3 -c` interpolation class is closed (argv, all 44 sites), `state_dir`/`.worktrees` writes are
confined off bare `$HOME`. Every fix carries a mutation-proven test.

**The lesson, stated plainly:** a config-driven bash launcher that reads files and ships them to an
LLM, types values into live shells, and interpolates paths into `python3 -c`, has a large and
hard-to-fully-enumerate injection/exfil surface. Each round closed the named sinks; the next found
another member of the same class. It converged (P1s 3→2→1→0) but round 6 reintroduced a P1 — a flaw
in the *mitigation* added for an earlier finding. The orchestrator (CEO) called security "closed"
after round 5 and was wrong. Six rounds is the evidence that this launcher is a security-hostile
place for this feature; the founder's narrowing to "just make it work" is the right response to that.

## Known limitation — a Codex pane is NOT sandboxed (by design)

This cannot be fixed in this architecture and the founder should run Codex knowing it:

- A Codex pane is one unscoped process. Per-engine `tools:` scoping (a `reviewer` that structurally
  cannot `Write`) does **not** hold in it — the boundary is prose + an stderr warning, not a control.
  There is no role→pane mapping to refuse Codex on (every pane is the CEO).
- The opt-in gate (`codex_unsandboxed_ack: true`) currently lives in the git-tracked `.warroom.yml`,
  which the gate correctly flags as untrusted (a PR could flip it). **Round-6 P1.** For a solo
  founder on their own machine with their own configs, this is an accepted risk, not an exploit path;
  in a shared/PR context it is real. The clean fix (deferred, founder's call) is to move the ack
  out-of-band — an env var or a non-git-tracked `~/.warroom/codex_ack` — so a PR cannot enable it.

## How to actually turn Codex on (four steps, only the founder can do 3–4)

1. **Land the launcher.** Either merge the branch, or (faster, no gate) the founder runs the branch's
   `bin/warroom` directly. The binding gate will not pass this branch while the round-6 P1 + P2s
   stand; the founder's options were (A) fix them + re-gate, (B) accept the risk and appeal, (C)
   shelve. The founder chose to verify-and-move-fast.
2. **Install the launcher** to the shared location: `node scripts/warroom-install.mjs install
   --config <path/to/.warroom.yml>` — writes `~/bin/<session>` and `~/.warroom/bin/warroom`, never
   inside a project, takes a backup, `rollback --session <name>` reverses it. (Outside the repo —
   needs the founder's go.)
3. **Per project:** add `codex_unsandboxed_ack: true` and (optionally) `engine: codex` to that
   project's `.warroom.yml`.
4. **Authenticate Codex** (`codex` login). An unauthenticated Codex renders a login chooser, not a
   composer — this is the one thing no agent could verify without the founder's credential and spend.

Then: `<session> --engine codex` (all panes), `--engine N:codex` (one), or `engine: codex` in config.
`<session> engine 3` dry-runs it first and starts nothing.

## The fleet — `fleet/MIGRATION.md`

Census: **1 shim** (`agentvibe`) shares `~/.warroom/bin/warroom`; **14 standalone** launchers
(ghostb, beeond, aiclub, etc.) each carry a private ~100KB copy and share nothing, so the engine
layer reaches them only via migration to a shim. Disposition, measured:

- **Migrate cleanly (9):** ghostb · beeond · aiclub · etsyc · evalove · finfun · noam-website ·
  realestate · beamix.
- **Migrate after extracting an inlined preamble (3):** ml2 · test1 · hitstampjavagame (no entry
  file; their launchers inline the preamble).
- **Excluded (1):** adamos — it is **Cato**, a different persona, not a CEO war room. Migrating would
  replace Cato with a CEO.
- **Dead (1):** acme — `~/VibeCoding/Acme` does not exist.

Migration order is not interchangeable: the shared launcher must carry the engine layer (step 1–2
above) **before** any project becomes a shim, or migration moves a project onto an *older* launcher.
`scripts/warroom-parity.sh <old-launcher> <config>` proves behaviour is preserved before switching.

## Follow-ups, recorded not chased

- **Round-6 P1:** move the Codex ack out-of-band (env var / non-git file) so a PR cannot enable
  unsandboxed Codex. Founder's call whether to do this before wider/shared use.
- **Round-6 P2s:** CEO preamble passed on Codex argv (visible via `ps`); the `state_dir` symlink
  sweep runs on every write command (perf); two duplication findings; the stale-engine-map bug on
  the kill-and-restart paths (recurred — `engines_forget` is not called on restart).
- **Pre-existing, not this branch:** `cmd_files`'s `declare -A` breaks on bash 3.2.57 (the founder's
  shell) — `warroom files` is broken on `main` today, unrelated to Codex.

## Process notes for the next session

- The async teammate mailbox **drops mid-turn sends** repeatedly this session; a busy builder's
  return often did not name the task just sent it. **Verify every "done" against the committed blob
  in git, never against the message.** That discipline is the only reason nothing broke.
- Idle lanes woke and wrote files they were not dispatched to, twice, cleanly-but-uninvited. Freeze
  the branch and assign one writer per file when it matters.
- The CEO over-managed the middle of this (flip-flopped a restore decision three times, mis-read a
  moving file). The builders converged on correct answers partly by trusting committed code over the
  orchestrator's running commentary. That is the right instinct.
