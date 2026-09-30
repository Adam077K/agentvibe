# Handoff — after v3 (2026-09-30)

**For:** the next orchestrator session. **Branch:** `vision/v3-agentic-org` (off `vision/v2-reenvision`). Nothing is merged
to `main`, and nothing should be without the founder.

## Where things stand
- **v3 is written** — `docs/vision-v3/` 00–17 plus README. Start at [README.md](README.md); the canon
  ([00-CANON.md](00-CANON.md)) is the single source of names and decisions (DR-01…DR-83).
- **Process record** is kept in full: `r0-outward/` → `r1-concepts/` → `r2-seats/` → `r3-stretch/` → `r4-spikes/`, with
  `_process/` holding every seat prompt, the R2 challenge log, the R5 issue log, the Codex scenario walk (40 breaks) and the
  architect's fix plan (163 items, all applied by per-file fixers; no re-check chain, by design).
- **Explorer**: generator in `docs/vision-v3/site/`; rebuild with
  `node docs/vision-v3/site/build.js "$PWD" docs/vision-v3/site $(git rev-parse --short HEAD)` and republish to the same URL: https://claude.ai/artifact/Lw6qgjWGAAz6YgV7t1JAoD .
- **Spike and slice code** is on four unmerged branches: `vision/v3-sp1-mission-loop`, `vision/v3-sp2-collision`,
  `vision/v3-sp3-hybrid`, `vision/v3-slice` (worktrees under this session's `.worktrees/`). The slice is a working
  board-card → Claude builder → Codex referee → live Mission Control page. All four are pushed.

## What the founder must do first
1. **Read** the 45-minute path in the README and **answer the ten decisions** in [15 §8](15-RISKS-AND-DECISIONS.md).
   Build phase P0 is gated on D1 and D2; model work is subscriptions-only (DR-61, decided 2026-09-30), and D2 now asks
   only how many seats to start with and whether he accepts the provider-terms risk (15 V25) with its mitigations.
2. **Grant a standing launch rule** for headless Claude and Codex workers. Auto-mode refused worker launches from
   subagents in SP1 and SP2 while SP3 and the slice got through — today it is inconsistent, and 14 P0 assumes a stable path.
3. **Sign the Build Charter** (DR-60): it funds construction until Handover.

## What the next team does
- Execute [14-BUILD-PLAN.md](14-BUILD-PLAN.md) P0 (Ground): 128 jobs total, each ≤30 turns, with builder and Referee from
  different families. P0 includes the pricing fetch (B0-02) and SP1-bis (B0-09); read 14 §P0 for the full order.
- Run the next spikes in the order [12 §6](12-SPIKE-RESULTS.md) gives: SP2's live arms with real workers, SP1
  with a real cross-family Referee, SP3's title-vs-procedure ablation.

## Known sharp edges
- `codex exec` hangs on "Reading additional input from stdin" when run without `</dev/null` in a backgrounded shell.
- Codex and Claude headless both need the Bash sandbox lifted (they read auth under `~`); local ports are blocked in the
  sandbox, so Mission Control's server must run outside it.
- `git worktree add` needs the sandbox lifted; the initial branch switch in this session left a half checkout until forced.
- Section files are large (45–115 KB): range-read; never read the seat files whole.
