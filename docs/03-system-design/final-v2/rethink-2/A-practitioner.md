# Fixer A · the practitioner · what changes so Keel runs on this Mac on a Monday morning · 2026-09-06

*Written by the framer engine from the brief at `scratchpad/fixers-brief.md`. Primary input `review/thinker-A.md`;
cross-checks `thinker-B.md`, `thinker-C.md`, `thinkers-digest.md`. Read whole: SPINE §A–§N, FINAL-PLAN-v2 §0–§23,
rethink/SYNTHESIS.md, research/world.md, DECISIONS §1–§23, CLAUDE.md, AGENTS.md, the engine files, lenses.yml, the
playbooks. Nothing built, run, installed, spent or pushed; no existing file edited. Provenance marks: (FOUNDER,
proposed) a founder row the founder must amend · (NEW: On) a mechanism I decide · (THINKER: A1) a measurement lane
A took on this Mac on 2026-09-06 · (FACT: world.md n) the world lane.*

---

## 1 · The big idea as I read it

Keel is a company that keeps working when one person stops: it takes a project and walks it, across every field a
company has, until a stranger acts and a record the company did not write says so. What it must never lose is the
four things nobody else ships — direction with a done-test, an append-only record with provenance, truth from anchors
and reconciliation, and one founder's taste — and the shape rule under them: the thing that sends holds no model, the
thing that judges cannot edit, the thing that reads the world holds no key. What the thinkers' findings threaten is
not the idea but its first night: on the machine the plan names, the night cannot start (sleep in sixty seconds, on
battery, lid closed), the tap opens nothing (no pane exists), the managed file removes the founder's own working mode,
the erasure greps the wrong tree, the egress proxy is unreachable by the process it governs, and five Operators run
where the plan drew one. Every one of those is a runtime fact, not a design flaw, and every one has a shape that runs
on real hardware. This document gives each that shape, puts the night on a machine that can hold it, and gives the
first month a scoreboard that is not the rung-1 share — because in month one every anchor is unrated by construction
and the honest number is *did the night run and did anything come back*.

---

## 2 · Fixes, one per finding

Format per fix: **what changes** · **why this shape** · **cost, once** · **losing image → `wins_if:`** · **how we
would know** · **founder?** New O rows are in §6 in SPINE §L format; new §A rows are v83+.

### A1 · The night has no runtime on this machine

**What changes.** New row **v83** (NEW, proposed — Q1): the night runs on an always-on box; the founder's Mac is the
Floor and the client. §15.1's *"bought after the first measured overnight"* inverts: the box is bought before the
first night, because the first night cannot be measured without it. The Watch, the Sender, the log, `bin/run`'s
children, the local tier and the managed file live on the box; nothing unattended runs on the Mac. **O81**:
`bin/watch` computes `night_capable` from `pmset -g batt` (AC), `pmset -g custom` (`sleep 0` or `disablesleep 1`),
`pmset -g assertions` and the host id in `watch.lease`; a brief carrying `unattended: true` is refused with the
printed reason when false, and the predicate and reason are a page-3 fact and a briefing line. `keel/host/power.yml`
declares the contract; `bin/probe` asserts it by minting a twenty-minute detached child across `pmset sleepnow` and
reading `run.started` against the wake. §20.2 row 7 (`pmset -a disablesleep 1`, deferred for thermal and battery
cost) is re-read: on a desktop `pmset -a sleep 0` has neither cost, so the deferral was a laptop's.
**Why.** (THINKER: A1) `sleep 1` on AC and battery, 391 maintenance sleeps in seven days, 24 clamshell sleeps, on
battery at 71%. A night on this Air orphans at the first maintenance sleep; `caffeinate -i` is process-scoped; a habit
the Watch cannot verify is a wish. The box is the only node that makes `WATCH` real, and it dissolves A3 (the managed
file lives where no founder works), A9 (the launchd context is the box's), C13 (identity on the Mac, autonomy on the
box) and half of v66 (the box is the server; the Mac is a client like the phone).
**Cost, once.** Q1's money; one `ssh` hop on every tap that attaches to a night run; a box profile in `keel/host/`;
the Mac stays logged in nowhere it did not already.
**Losing image.** A founder habit — AC, lid open, `disablesleep` — as a `FOUNDER ACT` node gating `WATCH`.
`wins_if:` thirty days of `pmset -g log` on the Air show zero maintenance sleeps inside declared nights and the
machine never on battery in that span.
**How we would know.** First night: `run.started` at 01:00, the anchor line by 07:00, zero `orphaned`, and the Air's
own `pmset -g log` showing it slept through it.
**Founder?** Q1.

### A2 · Page 2's tap opens nothing (with A17)

**What changes.** v4 and v59 keep their decision; their implementation becomes **O89**: `keel/surfaces/pages/2.yml`
declares two verbs per row and the row says which — `attach:` only where `sessions.jsonl` carries a tmux name (every
child `bin/run` mints is `tmux new-session -d -s <uuid8> -c <dir> claude -p …`, `--tmux=classic` for the four
worktree agents) or `config.json` carries a real `%N` pane id; `message:` for in-process teammates through the
shipped `SendMessage` and inbox path. The manifest carries `terminal: ghostty`; where the run is on the box the pop is
`ghostty -e ssh box -t tmux attach -t <name>` (R32). `--teammate-mode tmux` inside tmux is a Floor habit the page
detects, never a rule.
**Why.** (THINKER: A2) 48 teams, 224 members, 219 `backendType: in-process`, pane ids that are the strings
`"in-process"` and `"leader"`; `--tmux` wants iTerm2 and the founder runs Ghostty. The founder's sentence is
satisfiable for minted children and not for teammates, and a page that promises one verb will be blamed for the
runtime.
**Cost, once.** Two verbs where one was drawn; one ssh hop.
**Losing image.** One tap that always attaches. `wins_if:` `claude --attach` accepts an in-process teammate id — then
`attach:` covers every row and `message:` is a convenience.
**How we would know.** After one team started in tmux mode, `grep -c '"%' ~/.claude/teams/*/config.json` is non-zero;
a tap on a `-p` row opens that pane in Ghostty, latency recorded.
**Founder?** Q8.

### A3 · The managed file costs the founder auto mode (with A15)

**What changes.** **v11** (NEW row, amended): the managed file carries `permissions.deny` and
`disableBypassPermissionsMode` only; `disableAutoMode` is struck. Night children run `dontAsk --restricted`, where
auto mode is inert, so nothing is lost at night; on the Floor the founder keeps the mode they work in. Under v83 the
file lives on the box and the Mac carries none. **O88**: `bin/run` composes `--settings <json>` per child carrying
that child's hooks (`PreModelSwitch`, `PreCompact`, `SessionEnd`) and child-specific denies; v43's grant matrix gains
the `--settings` carrier on the `-p` row; `bin/run` refuses `--agents <json>` (v42, one home); `bin/probe` attempts
`claude agents --allow-dangerously-skip-permissions` and expects refusal. **R27**: does `--restricted` also ignore
`--settings`?
**Why.** (THINKER: A3) the founder's settings carry `autoMode`, `skipDangerousModePermissionPrompt`,
`skipAutoPermissionPrompt`; managed settings are machine-wide; §19.3 priced the act at four lines of JSON and did not
price the Floor. The classifier is still not the envelope (§12.3) — striking the key does not promote it; it stops
removing it from the founder's own hands.
**Cost, once.** One sentence beside the act; one JSON per child.
**Losing image.** The file as v11 wrote it. `wins_if:` the founder chooses to give up auto mode (Q4) — then the key
returns and the Floor runs `default`.
**How we would know.** Write the file; `/permissions auto` in the founder's usual session still works; the probe's
bypass attempt fails.
**Founder?** Q4 (default: keep auto mode).

### A4 · The erasable path is defeated by the transcript corpus

**What changes.** FOUNDER ROW **v69**, proposed amendment to its *settled by*: the erasure grep covers
`~/.claude/projects` on every host and the box, not only `keel/`; §12.8b names vendor-side retention (Anthropic,
Google) as outside the plan's reach, and the consent register's disclosure line says so. **O82**: `bin/run` passes
`--no-session-persistence` on every child whose brief carries a taint id (O65), and on the box on every child — the
run's own trace in `logbook/runs/<id>/` (stream-json) is our record, the vendor's transcript is not; `bin/mine
--since` reads only the Floor's `~/.claude/projects` on the Mac and refuses any episode whose provenance carries a
taint id; `cleanupPeriodDays` is set in `keel/host/settings.json`. **R29**: the canary test below.
**Why.** (THINKER: A4) 62 directories, 3,116 files, 3.1 GB, growing 56 a day, every stranger's body verbatim, inside
the mining input. The founder would believe an erasure completed while the subject sat on the same disk.
**Cost, once.** No vendor transcripts for night runs; one flag; a retention setting.
**Losing image.** Grep `keel/` and stop. `wins_if:` the vendor ships a per-project transcript exclusion or an erasure
verb — then the flag is unnecessary and mining may read children.
**How we would know.** Plant a canary in a fixture inbound row, run scout → steward, `grep -r <canary>
~/.claude/projects` on both hosts returns nothing; erase; `grep -r <canary> keel/` finds only the hash.
**Founder?** Q7 (the Floor's own transcripts).

### A5 · `bin/egress` on loopback is unreachable from the process it governs

**What changes.** FOUNDER ROW **v68**, proposed restatement of its shape, inside its own *"R2 may halve it"*
clause: `bin/egress` is three transports with one configuration and one log — (1) a **stdio MCP server** `bin/run`
spawns per child and names alone in `--strict-mcp-config`, fronting every admitted server: the call log, the
domain-and-method filter, the credential injection; (2) the sandbox **`network` block** (`allowedDomains`,
`strictAllowlist`, `tlsTerminate`) for anything Bash does; (3) `credentials.injectHosts` where R2 shows it injects.
`WebFetch` and `WebSearch` are runtime-side and never reach a proxy: they are absent from `--tools` for every agent
but `scout`, and `scout` holds no credential — the trifecta is the control there and the row says so. **R2** becomes
the transport question: which of the three carries what, measured one cell each. **O13** is confirmed as programs:
(THINKER: A5) outbound loopback is denied for sandboxed Bash, so R4's unmeasured half is measured; `ollama`
(installed, `/usr/local/bin`) is the carrier candidate for Qwen3 from the launchd context, never from a run.
**Why.** `dial tcp 127.0.0.1:11434: connect: operation not permitted` — the proxy's zero call count would read as
success on the night it mattered.
**Cost, once.** Three transports declared instead of one hop; *one program* becomes one program plus configuration it
owns.
**Losing image.** An HTTP proxy on `127.0.0.1`. `wins_if:` the sandbox gains a per-invocation loopback allow scoped
to one port — then the proxy is reachable and it is one hop again.
**How we would know.** From a `--restricted` child, `nc -z 127.0.0.1 <port>` returns the errno; an MCP call appears in
the egress log with its method; a deliberate exfiltration fails at the sandbox, not at the prompt.
**Founder?** No — a restatement the row already licenses; labelled FOUNDER ROW so it is read as such.

### A6 · One Operator is the plan; five is the founder (with A21)

**What changes.** v46 (NEW) amended into **v84**: an Operator instance is a row in `sessions.jsonl` (`kind:
operator`, venture, host, heartbeat from a `SessionStart`/`Stop` hook pair in `operator.md`'s own settings). Gate 2
*is the founder on the Floor* is true per venture when a fresh operator row names it; the WIP limit counts interactive
sessions; the reserve stays per seat, one number, shared by all Operators. **O84**: a *which* in `decide.jsonl` is
answered only by a claimant — `claim: {operator, at}`, expiring after one tick — so two Operators cannot answer one
question. **O100**: the cord has two named scopes on every page and in `keel stop`: `--night` signals `bin/run`'s
process groups and stops dispatch; `--all` also `SIGTERM`s every registered operator session and its team. The phone's
control defaults to `--night` and is labelled *stops the night, not the Floor*.
**Why.** (THINKER: A6) five `ceo-*` worktrees, three terminals, one console login, 825 commits by Claude Code to
129 by the founder; CLAUDE.md itself names parallel orchestrator colours. A premise false on day one makes the
reserve, sterility and the lease misreport rather than fail.
**Cost, once.** One hook pair; one field on the decide row; one flag on the cord.
**Losing image.** One Operator at a time, enforced by an O16-style lease — a founder behaviour change. `wins_if:` a
month of `sessions.jsonl` shows one live operator row at a time — then the registry is one row and the lease is free.
**How we would know.** Build day: `git worktree list | grep -c ceo-` and `ls ~/.claude/teams | wc -l`; two Operators
holding one claim is the failure; pull `--all` and count survivors.
**Founder?** No.

### A7 · The vendor ships a daemon; the plan designs a supervisor beside it

**What changes.** **O90**: `bin/run` mints via bare `claude -p` inside a detached tmux session — ours: the pane, the
process group (v67), the session id — and never via `--bg`. §10.5 and §15.6 gain a daemon row: started by `--bg`;
exits *"idle 5s with no clients"*; `daemon-auth-status.json` reads `auth_required`; its paths are under this repo's
own `denyRead`. O15's reconciler reads `~/.claude/daemon/roster.json` and `claude agents --json --all` as the vendor's
view of anything the founder started by hand, read-only, never as the list of our runs. `bin/supervise` supervises
`bin/watch` and its tree only. **R30**: the daemon's lease semantics and what `claude agents --json` lists once it
has exited.
**Why.** (THINKER: A7) `[supervisor] idle 5s with no clients — exiting … leases=0`. Two supervisors and one process
table argue over the first orphan at 03:00.
**Cost, once.** No `--bg` for night runs; page 2 joins two sources, which O70 already does.
**Losing image.** `--bg` as the night's carrier under the vendor's supervisor. `wins_if:` the daemon documents a
service mode that does not idle-exit and leases we can read — then `bin/supervise` is a second implementation and
goes.
**How we would know.** `claude --bg` one child, read `daemon.log` for `idle_exit`; a `-p` child in tmux survives the
daemon exiting.
**Founder?** No.

### A8 · `--fallback-model` is a shipped chain that reroutes silently

**What changes.** FOUNDER ROW **v78**, proposed amendment: the chain's same-family links are composed by `bin/run`
from `roster.yml` into `--fallback-model a,b`; a `PreModelSwitch` hook in the child's `--settings` (O88) writes a
`model.switch` event row carrying the rung demotion and **blocks** a switch to a family that has not passed the
rehearsal for the move class; the cross-family link and *stop and stage* — which the flag cannot express — are done
by `bin/run` between runs, where the handover records `maker_model` (O7). §9.4a names the flag.
**Why.** (THINKER: A8) the flag ships, re-tries the primary, reroutes on availability, and the plan mentions it
zero times. Refusing it forfeits the vendor's retry; passing it unannotated is the silent reroute v78 forbids.
**Cost, once.** One hook; the chain has two carriers and one source.
**Losing image.** Refuse the flag and reroute only between runs. `wins_if:` `PreModelSwitch` does not fire under
`-p` (R31's sibling) — then the flag is refused and the launcher does every reroute.
**How we would know.** Dispatch with an invalid primary id; the handover's `maker_model` and the `model.switch` row
agree, and the rung field fell.
**Founder?** The row is theirs; the amendment composes the decided chain onto the shipped carrier. Gains: the vendor's
retry and a blocking gate. Loses: nothing the row has.

### A9 · The second family cannot start under the sandbox (with A16)

**What changes.** **O86**: Gemini and Codex run only as `bin/run` children from the launchd context (the box);
§9.2's Gemini row names that carrier. `keel/host/denyread.yml` carries the real list: `~/.ssh ~/.aws ~/.config/gh
~/.netrc **/.env* ~/.gemini ~/.codex ~/.config/openai ~/.claude/daemon ~/.claude/jobs ~/.claude/routines`.
`bin/probe` asserts from both contexts — `gemini --version` EPERM inside a sandboxed Claude shell, exit 0 from
launchd. **O96**: `bin/probe`, `bin/run` and `bin/send` never run inside a Claude session; (THINKER: A16) the
auto-mode classifier blocked a read-only `security find-generic-password` — the harness would deny the programs that
serve it. R3 sharpened: the login keychain is `no-timeout`; `--bare` skips keychain reads, so a child needs the
keychain only for OAuth; the open question is a LaunchAgent on the box after reboot (**R33**).
**Why.** (THINKER: A9) `EPERM: operation not permitted` on `~/.gemini/settings.json`, which reads as a broken
install.
**Cost, once.** None beyond stating the carrier and the list.
**Losing image.** Gemini callable from any shell. `wins_if:` `denyRead` becomes narrowable per invocation — then a
scout subagent on Gemini works inside a session.
**How we would know.** The measurement, repeated from launchd, both exit codes recorded.
**Founder?** No.

### A10 · Auto-compact is on by default and breaks v24 inside every long run

**What changes.** **O87**: `bin/run` sets `--autocompact <context>` from `prices.yml`'s new `context:` column
(1,000,000 on Opus 5 and Fable 5.1; 200,000 on Haiku) so a run ends at `maxTurns` or its ceiling before it can
compact; O77's `tokenizer:` rides beside it. `PreCompact` — a documented hook event — is registered in the child's
`--settings` to write a `run.compacted` row, so a compaction becomes an event O39's prefix hash can name. R9 narrows
to **R31**: does `PreCompact` fire under `-p`?
**Why.** (THINKER: A10) `--autocompact <auto|tokens>` in `--help`, `autoCompactWindow` in user settings; a
compaction is the runtime rewriting the run's context — the ACE collapse — and a 2x cache write on the next turn.
**Cost, once.** One flag; a run that would have compacted stops and resumes by id instead.
**Losing image.** Let it compact and log it. `wins_if:` R31 shows the event fires and the cache-write spike is small
— then compaction is a logged event and the ceiling may sit lower.
**How we would know.** One `-p` run past 200k under `stream-json --verbose`: no compaction message, no 2x write.
**Founder?** No.

### A11 · The bootstrap is undescribed and every step is irreversible-tier

**What changes.** **v86** (NEW, proposed — Q2): during the build, Keel's PRs ride today's classifier with two
changes: the fifteen agent files are generated from `roster.yml` (O2), so the irreversible edit is one generator diff
per wave with founder sign-off per wave, not per file; `qa-tier-floor.yml` gains `keel/**` as `lite`, with
`keel/bin/{run,send,watch,inbound,egress}` and `keel/host/**` as `full`. **O91** (C14's shape, adopted): a pack has
`state: seed | harvested`; a seed pack needs the rehearsal case and namespaces; the first `bin/run` dispatch of the
agent **is** its demonstration and its handover row is the artifact; the exemplar is harvested after N anchored
handovers. §19 gains a preamble naming the builder of every node: today's `builder` engine under `ship-feature`, in a
`keel/` worktree, on this harness. `bin/log` counts founder sign-offs from the first Keel commit to the first
dispatch.
**Why.** (THINKER: A11) twelve nodes before one dispatch, each under `.claude/agents/**` or `.claude/hooks/**` →
irreversible with a 2-of-3 panel that is unmet; the pack's demonstration needs the run that needs the pack.
**Cost, once.** One tier-table edit, irreversible itself.
**Losing image.** Every Keel PR at irreversible. `wins_if:` a second family becomes reachable — then the tier's own
requirement is satisfiable and the waiver is unnecessary.
**How we would know.** Sign-offs before the first dispatch ≤ 4.
**Founder?** Q2.

### A12 · Window share has no denominator on day one

**What changes.** **O92**: `keel/logbook/window-highwater.yml` is seeded from `budget-guard.js`'s measured baseline
(peak 1,961,285 output tokens in a rolling five hours over 99 transcripts), marked `seed: true` and `tokenizer:
sonnet-4.6-era`; the founder writes `ceiling:` as a percentage; page 3 shows the absolute beside it; the first
observed week replaces the seed. C8's subsidy line reads the same file.
**Why.** (THINKER: A12) a fraction of an unobserved mark is a guessed ceiling, which v74 refuses; a measured mark
already sits on disk and O50 registers the file that holds it.
**Cost, once.** None.
**Losing image.** No seed; ceilings absent in week one. `wins_if:` the vendor emits window utilization as a status
field (W4's `rate_limits` widens) — then the gauge reads it and the file is a cache.
**How we would know.** The first charter: the founder types a percentage without asking what a window is.
**Founder?** No (v74 keeps its unit).

### A13 · The skill metadata tax, measured

**What changes.** **O93**: v77's checker measures its own constant — frontmatter bytes ÷ 4 per skill, re-measured on
every run — rather than carrying the spec's 100; R8 runs before the import and its result is the checker's first row.
**Why.** (THINKER: A13) 53 tokens per skill here: ≈7k at 134, ≈110k at 2,111.
**Cost, once.** An hour.
**Losing image.** The spec's figure. `wins_if:` R8 shows the tax scales with declared namespaces — the generator is
the whole fix (v77's own losing image).
**How we would know.** `claude -p "" --output-format json` on two trees, `input_tokens` compared.
**Founder?** No.

### A14 · Twenty children on a 16 GB fanless laptop

**What changes.** **R28**: RSS per `-p` child and the page-in point, measured from launchd on the box and once on
the Air; O71's `sessions_ceiling` is set from it; until measured the Air's value is 3, stated as arbitrary.
**Why.** (THINKER: A14) 16 GB, 44% free at rest with five sessions, `ps` denied inside the sandbox.
**Losing image.** The vendor's 20. `wins_if:` the box carries enough memory that R28's knee is above 20.
**How we would know.** `memory_pressure` while N children run from launchd; the first swap-in is the ceiling.
**Founder?** No.

### A18 · O21's goal condition is read by a model, not run by a shell

**What changes.** **O97**: every anchor script ends by printing `ANCHOR <name> exit=<code>` on its own line; the
`/goal` condition names that line and the done-test; the evaluator reads a printed line and never runs anything; R17
measures whether it honours the line.
**Cost, once.** One `printf` per anchor.
**Losing image.** *"`<anchor>` exits 0"* in prose. `wins_if:` R17 shows the evaluator accepts an exit code directly.
**Founder?** No.

### A19 · The bell is a wrapper; the watermark is day-one

**What changes.** **O98**: `bin/bell`'s transport is the vendor's push (Remote Control push, `agentPushNotifEnabled`);
it adds only the classes, the budget and the per-channel acted-on rate. O42's watermark is a day-one program: the
corpus grows 56 files a day.
**Losing image.** A fourth channel. `wins_if:` the vendor's push exposes an acted-on read — then the rate is a field.
**Founder?** No.

### A20 · The founder's tempo is bursts

**What changes.** FOUNDER ROW **v76**, proposed amendment: the reserve is held per weekly window (v22) and the
away predicate gains a second edge — a **burst edge**: when founder-authored events in the current five-hour window
exceed a rate the founder sets, autonomous Claude-seat work pauses and routes off-seat (Gemini, local, Codex) until the
window rolls; silent days release the reserve as v76 already says. The rate reads `founder.last`'s history.
**Why.** (THINKER: A20) commits per day over a fortnight: 15 · 85 · 35 · 305 · 0 · 105 · 100 · 1 · 12 · 0 · 0 · 0 · 0
· 56 · 40. On a 305-day the reserve is the constraint; on four silent days it is idle capacity.
**Cost, once.** One predicate on a file that exists.
**Losing image.** A daily reserve. `wins_if:` a month of `founder.last` shows a flat daily rate.
**How we would know.** The reserve hit rate on the burst day against the silent days.
**Founder?** Q5 — inside *"keep 30% and 3/day; evidence moves them"*; this is the evidence.

### Convergence 1 · The founder's attention is the scarcest input and nothing budgets it

**What changes.** **O105** and **v87** (FOUNDER, proposed — Q6): the harness charter gains `founder_hours:` per week,
read by the Desk like a token ceiling — harness intents stop starting when it is spent, venture intents do not.
`bin/log` writes a `founder.act` row for every tap, sign-off, terminal open and read-back confirm (it already writes
`founder.last`), so founder-minutes are measured from day one, not estimated. The briefing's first line is decisions
taken · deferred · defaulted, with the minutes. The runbook (§3, S3) lists every founder act of the first month with a
count, and the count is its acceptance test. B's which budget per window is adopted as data on the same charter.
**Why.** Twenty-plus sign-offs, thirty pack artifacts and an unbounded which queue in the plan's first month, and
§2.7's list is the steady state, not the start.
**Cost, once.** One charter line, one log row class.
**Losing image.** Founder-minutes measured after the fact only. `wins_if:` month two's harness minutes fall on their
own with no ceiling ever binding.
**How we would know.** Founder-minutes per week split harness/venture on the briefing from week one.
**Founder?** Q6 sets the number.

### Convergence 2 · No stranger in the build graph

**What changes.** **O106**: a second venture node `VENTURE2` in wave one, with `outcome:` (C5's field) set to
contact rung 1 by its horizon; the practitioner's order for reaching it — the world's door, the consent register and
the Sender exist in fixtures before pages 1, 6 and 7 exist at all, and the first outward act with a founder tap
happens inside the first month. `OVERNIGHT`'s exit gains *one contact-rung movement recorded by `bin/reconcile`*.
**Why.** *Worked* is defined as a stranger acting and no node reaches one; the door and the Sender are eight programs
away from a pop-up office.
**Cost, once.** One charter the founder writes (Q3).
**Losing image.** The harness as the only venture until the pages exist. `wins_if:` the founder has no venture with a
reachable stranger — then the harness stays alone and the stranger is a second-wave charter, said so.
**How we would know.** The first briefing carrying a contact-rung row.
**Founder?** Q3.

### Convergence 3 · R12 on the harness cannot test assumption 1

**What changes.** **O107**: R12 runs now, twice. First on the founder's own past: thirty random Floor episodes from
`~/.claude/projects`, domain-labelled by one Sonnet `-p` pass (since `bin/classify` is ABSENT), each rated by the
founder in one sitting — *could a program have judged this?* — with *inventing an anchor* defined as *an anchor that
tests a property the done-test did not state*. Second on `VENTURE2`'s first thirty real intents. Both fractions print
side by side per domain.
**Cost, once.** Thirty minutes of the founder (counted under O105).
**Losing image.** The harness's thirty alone. `wins_if:` the per-domain fractions agree with the harness's within the
sample floor.
**How we would know.** Two fractions on one page.
**Founder?** No (the sitting is counted, not asked).

### Convergence 4 · Vendors are shipping the bottom half of the plan

**What changes.** Doctrine change, adopted from C3 with the practitioner's half: **O104** — every §L row and every
`bin/` program carries `kind: kernel | adapter` and an adapter carries `vendor_wins_if:`; an adapter is built only as a
wrapper over the vendor surface it names. The adapter table for §17.5: `bin/bell` → vendor push · `bin/supervise` →
the daemon (partial, O90) · page 2 → `claude agents` and agent view · page 3's arithmetic → `prompt_cache`,
`rate_limits`, `modelPricing` · v78's chain → `--fallback-model` · `bin/worktree` → `-w`/`--worktree` where the
sandbox permits · the terminal pop → `--tmux=classic`. Kernel: log, run, send, inbound, reconcile, probe, egress,
check-stores, horizon, redact, the consent register, the taste and negatives stores.
**Cost, once.** Eighty lines and one lint rule; it costs the doctrine one word.
**Losing image.** Build every mechanism as ours. `wins_if:` a year passes in which no adapter's vendor surface
changes under it.
**How we would know.** When the first `bin/` program lands, the share of its functions a vendor field now provides.
**Founder?** No.

### Convergence 5 · The night is designed before the machine exists

**What changes.** v83 (A1) plus **v85** (NEW): bounded-day first. Until the box runs, *the night* is the hours the
founder is at the desk and not typing — which R5's 487 short sleeps say the Air supports; the first month's scoreboard
(S3) counts those and the box's first nights alike; §20.2 row 12's comparison is the first measurement after the
scoreboard has three rows. A third of §L is unchanged and re-ordered behind it.
**Losing image.** The night machinery first. `wins_if:` the box arrives before `bin/watch` exists — then bounded-day
first costs nothing and the order is moot.
**Founder?** Q1.

### Convergence 6 · Sixteen of sixteen is a warning

**What changes.** B5's two classes of founder row are adopted as a doctrine change, with the practitioner's evidence:
five ratified rows — v68, v69, v74, v76, v78 — needed amendment within a day of a measurement, and every amendment
above had to be written as *proposed* because the class does not exist. Ratified rows become reopenable by any engine
with a reason and a falsifier; the digest's §5 corrections stop waiting on a founder round. Every future option set
carries a second option with its own mechanism cost written to the same depth as the first.
**Cost, once.** Relabel sixteen rows.
**Losing image.** One class. `wins_if:` a year in which no ratified row is ever reopened by measurement.
**Founder?** It is a rule about their rows; recorded as a doctrine change, not a question.

### Convergence 7 · The plan cannot bind because nothing that acts can read it

**What changes.** **O109**: `keel/shared/rules.yml` — one row per rule: `rule · mechanism · path · state:
exists|absent|wish · vendor_wins_if` — beside O2/O3/O4/O5/O6/O8, and the prose rendered from them. The
constitution is **≤ 4,096 bytes**, because that is `session-start.js`'s measured payload budget (#76) and the only
size that reaches an agent's context whole; it carries §0.3's four invariants, the doctrine, the envelope's three lists
and the open rows. The first-month runbook is generated from `rules.yml` where `state: absent` plus the founder-act
list.
**Cost, once.** One file and a renderer; the prose loses its authority and keeps its record.
**Losing image.** Prose as the source. `wins_if:` a builder brief for any §L program fits in 8K tokens with nothing
missing, drawn from the prose alone.
**Founder?** No.

### Convergence 8 · The capacity model is economics carried as a legal footnote

**What changes.** **O110**: the briefing carries a shadow subsidy line from the first run — Σ shadow USD of
unattended runs at `prices.yml` list price ÷ the seat price per month — computed from O92's file and the per-run cost
fields. The metered-key design (batch at 50%, five-minute TTL, no weekly window) is written as a losing image with
`wins_if:` the subsidy exceeds N× the seat price or the vendor narrows the terms. The checker-family key is a founder
decision (money and terms) and is not asked here; C's lane owns it.
**Losing image.** Row 17 chained behind row 1. `wins_if:` row 1 is answered before the first month ends.
**Founder?** No for the line.

---

## 3 · Systemic redesigns

### S1 · The box is the night's machine; the Mac is the Floor

**What changes.** v83; O81; the split §15.1 called *the target* becomes day one: on the box — `bin/watch`,
`bin/send`, `bin/log`, `bin/run` and its children, `bin/embed`/`bin/classify` with `ollama`, the managed file, the
LaunchAgent, `keel/host/box.yml`; on the Mac — the Floor, the Operators, mission control's client, `bin/mine` over
the Floor's transcripts. The box stays logged in with the screen locked (the LaunchAgent needs a user session for the
keychain). The phone reaches the box; the Mac reaches the box; v66's tunnel terminates on the box. A tap that attaches
runs `ssh box -t tmux attach` (R32). The credential split is C13's: the founder's identity stays on the Mac, the
company's credentials on the box, and a prompt injection at night finds the company's keys, not the founder's Chrome.
**Sections rewritten.** §15.1, §15.1a (the cloud lane's tail is genuinely zero when the server never sleeps — v56's
exception waits on a box-outage measurement), §15.2 (no clamshell; `pmset -a sleep 0`), §3.1a, §14.1, §14.11, §12.6,
§19 (a `BOX` root).
**Why.** A1, A3, A9, A21, C13: five findings, one purchase.
**Cost, once.** Q1. **Losing image.** §15.1 as written. `wins_if:` A1's own.
**How we would know.** Three consecutive nights with zero orphans on the box while the Air slept.
**Founder?** Q1, Q8.

### S2 · The Floor is a bullpen

**What changes.** v84, O84, O100 (A6, A21). §3.1 draws N Operators; §4.1 gate 2 and §4.4 read the registry; §12.9
and §14.13 draw the two cord scopes; §14.2's sterile rule is per venture. Nothing changes for the founder's hands.
**Cost, once.** A6's. **Losing image.** A6's. **Founder?** No.

### S3 · Bounded-day first, the first month's runbook, and a cold-start metric that is not the rung-1 share

**What changes.** v85; **O101** the scoreboard; **O102** the runbook. The scoreboard is written by programs only —
`bin/watch`, `bin/run`, `bin/reconcile`, `bin/log` — one row per night:
`nights_attempted · night_capable_all_night · runs_minted · handovers_with_anchor_line · orphaned · founder_taps ·
founder_minutes · shadow_usd · contact_rung_moves`. Month-one success is three things and none is a share: **three
consecutive nights with `orphaned = 0` and at least one handover each · one contact-rung movement recorded by the
door · founder-minutes per finished intent recorded, not targeted.** The rung-1 share is reported and read as
*unrated* by construction until packs harvest. The runbook, ordered by dependency (the calendar words are the
founder's framing; nothing here is a schedule):

| Step | Needs | What is built or done | Founder acts (counted) | Exit |
|---|---|---|---|---|
| 0 | Q1 | the box plugged in, logged in; `keel/host/` applied; `pmset -a sleep 0`; `bin/probe` green from launchd, both contexts (O86) | buy · log in · one settings file · Gemini auth | probe exit 0 |
| 1 | 0 | `bin/log` with O6 schema, hash chain, `founder.act`; `bin/run` with the full argv — `--restricted --tools --session-id --no-session-persistence --autocompact --settings --fallback-model` — in tmux, writing `sessions.jsonl`, `run.started`, pgid | none | one child prints `ANCHOR … exit=0` and a handover row exists |
| 2 | 1 | one real venture intent through the read-back; one bounded night; the morning read | one read-back tap | scoreboard row 1: handovers ≥ 1, orphaned 0 |
| 3 | 2 | `bin/watch` with O81, O15, O16, `--night` cord; three nights | none | orphaned 0 on three consecutive rows |
| 4 | 3 | `bin/inbound`, `consent.yml`, `bin/send` in `keel/fixtures/`; VENTURE2's charter; the first outward act with a tap | one charter · one tap | a contact-rung-1 row from the door |
| 5 | 2 | page 4, then page 2 with attach/message; packs `seed → harvested` | wave sign-off (Q2) | a card launches a session whose done-test exits 0 |
| 6 | 3, 4 | §20.2 row 12's comparison; R12 on VENTURE2's thirty; O110's line | R12 sitting | two numbers side by side |

**Sections rewritten.** §0.5, §19 (order), §21.4 (month-one reading), §2.7 (the first-month list beside the
steady-state one).
**Why.** A1, C9, C4, the plan's own §21.4 *first measurable thing*.
**Cost, once.** The pages wait; the office waits longest.
**Losing image.** §19 as drawn. `wins_if:` the box and `bin/watch` land in the same week — then the order buys
nothing.
**How we would know.** The scoreboard has rows before page 1 has pixels.
**Founder?** Q1, Q2, Q3, Q6.

### S4 · Founder attention as a budgeted resource — O105, v87 (Q6). Sections: §2.1, §2.7, §16.8, §21.1.
### S5 · The commodity line — O104. Sections: §L's format, §17.5, §19's ordering by `kind`.
### S6 · Data-first with a constitution that fits the payload — O109. Sections: §0.3, §1, `session-start.js`.

---

## 4 · What I would not fix, and why

- **B1 (label the plan LOW-CONFIDENCE, freeze §A).** Freezing §A while five ratified rows sit on measured
  falsifications is the wrong order; convergence 6 and the amendments above are the fix. The header sentence is
  cheap and I would take it; the freeze I would not.
- **B22 / C15 (fourteen as fourteen loadouts).** Already answered by O2's generator and v31's falsifier; it does not
  change what runs on Monday. Not reopened.
- **C19 (the cloud lane against a tail of zero).** Under S1 the server never sleeps, so the lane waits on a
  box-outage measurement that does not exist yet. Premature, not wrong.
- **B15 (R5 is one busy week).** True, and moot once the night is not on the Air; re-measuring on the laptop buys a
  number nothing reads.
- **B9 (weighted fair queueing).** Right shape, no plant to test it on; O20's replayer is the instrument, and it needs
  a month of Desk rows first.
- **B11 (sequential testing for skills).** Right, and it waits on R8 and the first admission cycle; C16 says most of
  the corpus is refused before it matters.
- **C6 (Gemini as reviewer and challenger for every diff now).** Gemini is unauthenticated, EPERM under the sandbox
  (A9), and R11 is blocked on O7's fields; route it as `scout` first, as decided, and measure.
- **C11 (a vanilla-runtime week).** Worth running, after the scoreboard exists — the comparison needs the same
  done-tests and a record, and neither exists before step 3.
- **B19 (a dead-man lease renewed by the founder).** A renewal is a founder act per period, which is attention; on the
  box the cord is reachable (S1) and the two scopes (O100) are the practitioner's e-stop. Hold for B's lane.
- **C12 (an outage drill with the Claude carrier denied, before wave one).** A drill on a runtime that has never run a
  night is theatre; it belongs after step 3.

---

## 5 · Questions for the founder

Each: the question · why only you · options, recommended first · the default I proceeded on.

1. **Buy the box now, and which?** Your money and your desk. **(a) A Mac mini, plugged in, no battery, logged in and
   locked** — keeps every macOS mechanism the plan rests on (LaunchAgent, keychain, Seatbelt, `pmset`, tmux,
   pixel-agents) — **(b)** a Linux VPS or mini PC (cheaper per month; bubblewrap sandbox; a credentials file instead of
   the keychain, so R3 and §15 change shape) — **(c)** no box: the Air with a `disablesleep` habit (measured to fail
   today) — **(d)** other. *Default: (a).*
2. **Keel's own PRs during the build.** Your appetite for review. **(a) sign-off per wave** on generated agent files,
   `keel/**` lite except the five world-touching programs — **(b)** every Keel PR irreversible as today (2-of-3 unmet)
   — **(c)** a named `keel-build` tier with no founder sign-off until the first venture — **(d)** other. *Default:
   (a).*
3. **The first stranger.** Only you know your ventures. **(a) name an existing project of yours** whose next step is
   a stranger understanding it (contact rung 1) — **(b)** a greenfield charter in a field you choose — **(c)** the
   harness only, the stranger in wave two, said so — **(d)** other. *Default: (a), charter unwritten until you name
   it; the graph carries `VENTURE2` either way.*
4. **Auto mode on the Floor.** Your working mode. **(a) keep it**: the managed file carries no `disableAutoMode` and
   lives on the box — **(b)** give it up machine-wide as v11 wrote — **(c)** other. *Default: (a).*
5. **The reserve on burst days.** Your tempo. **(a) add the burst edge** to v76: above a rate you set, autonomous
   Claude-seat work pauses and routes off-seat until the window rolls — **(b)** keep 30% flat — **(c)** other.
   *Default: (a), rate unset until you set it.*
6. **Founder-hours per week on the harness charter.** Only you know your hours. **(a) 10** — **(b)** 5 — **(c)** 20 —
   **(d)** other. *Default: 10, and the first month's runbook counts acts against it.*
7. **Your own Floor transcripts.** Your data. **(a) keep them for mining** (`cleanupPeriodDays` long; children write
   none; erasure greps them too) — **(b)** cap at 30 days and lose most of the taste corpus — **(c)** other.
   *Default: (a).*
8. **Is a Ghostty window on your Mac attached over ssh to a tmux pane on the box "the terminal on my Mac popping
   up"?** Only your experience answers it. **(a) yes** — **(b)** no: runs you may tap must run on the Mac, which puts
   them back on a machine that sleeps — **(c)** other. *Default: (a).*

---

## 6 · Proposed SPINE changes, as rows

### New and amended §A rows

| # | The question | Decided | From | Losing image · `wins_if:` |
|---|---|---|---|---|
| **v83** | Where the night runs | **On an always-on box bought before the first night; the Mac is the Floor and the client.** Watch, Sender, log, `bin/run` children, local tier, managed file on the box | (NEW, proposed · Q1) (THINKER: A1) · S1 | a founder habit gating WATCH · thirty days of Air logs with no maintenance sleep inside declared nights |
| **v84** | How many Operators | **N, each a row in `sessions.jsonl` with a heartbeat; gate 2 per venture; a which is answered by its claimant; the cord has `--night` and `--all`** | (NEW, amends v46) (THINKER: A6, A21) · O84, O100 | one Operator by lease · a month of one live row at a time |
| **v85** | What runs first | **Bounded-day first: the scoreboard (O101) before the night machinery; row 12's comparison after three rows** | (NEW) (THINKER: A1) · C9 | night first · box and Watch land the same week |
| **v86** | Keel's build tier | **Agent files generated from `roster.yml`, sign-off per wave; `keel/**` lite except five programs and `keel/host/`** | (NEW, proposed · Q2) (THINKER: A11) | every PR irreversible · a second family reachable |
| **v87** | The founder's hours | **`founder_hours:` per week on the harness charter, read by the Desk** | (FOUNDER, proposed · Q6) · C1 | measured after the fact · minutes fall unforced |
| **v11** (amend) | The managed file | **`permissions.deny` + `disableBypassPermissionsMode` only; `disableAutoMode` struck; on the box** | (NEW, amended) (THINKER: A3) · Q4 | v11 as written · the founder gives up auto mode |
| **v43** (amend) | Grant carriers | **`-p` row gains `--settings <json>` per child; `--agents` refused** | (NEW, amended) (THINKER: A15) · R27 | argv only · `--restricted` ignores `--settings` |
| **v46** → v84 | | | | |
| **v68** (FOUNDER, proposed) | Egress | **stdio MCP server + sandbox `network` block + `credentials.injectHosts`; `WebFetch`/`WebSearch` governed by `--tools` and the trifecta** | (THINKER: A5) · R2 | a loopback proxy · a per-invocation loopback allow |
| **v69** (FOUNDER, proposed) | Erasable path — *settled by* | **grep covers `~/.claude/projects` on every host; vendor retention named out of reach; `--no-session-persistence` on tainted children** | (THINKER: A4) · O82, R29, Q7 | grep `keel/` only · a vendor erasure verb |
| **v76** (FOUNDER, proposed) | Away and burst | **reserve per weekly window; a burst edge pauses Claude-seat autonomy above a founder-set rate** | (THINKER: A20) · Q5 | a daily reserve · a flat daily rate |
| **v78** (FOUNDER, proposed) | Fallback carrier | **same-family links in `--fallback-model`; `PreModelSwitch` annotates and blocks; cross-family and stop-and-stage by `bin/run` between runs** | (THINKER: A8) · O85 | refuse the flag · the hook does not fire under `-p` |
| **v4/v59** (implementation) | Page 2's tap | **`attach:` and `message:` per row; `terminal: ghostty`; ssh+tmux for box runs** | (THINKER: A2, A17) · O89, Q8 | one verb · an attachable teammate id |
| **v12** (amend) | Long runs | **`--autocompact` at full context; `PreCompact` logged** | (THINKER: A10) · O87, R31 | let it compact · the event fires and the write is small |

### New §L mechanisms (O81+)

| id | The fix | Path | Moves | Status |
|---|---|---|---|---|
| **O81** | `night_capable` predicate from `pmset` (AC, `sleep 0`/`disablesleep`, assertions) and the lease host; an `unattended` brief refused with the reason; a page-3 fact | `bin/watch` · `keel/host/power.yml` · `bin/probe` — ABSENT | §4 · §15 · §14 | ADOPTED |
| **O82** | `--no-session-persistence` on tainted children (all children on the box); `bin/mine` reads the Floor only and refuses taint ids; `cleanupPeriodDays` in host settings | `bin/run` · `bin/mine` · `keel/host/settings.json` — ABSENT; the flag ships | §12 · §13 | ADOPTED (R29 is the canary) |
| **O84** | Operator registry rows with heartbeat; `claim:` on a which; gate 2 per venture; WIP counts interactive sessions | `sessions.jsonl` · `decide.jsonl` · `operator.md` hooks — ABSENT | §3 · §4 · §14 | ADOPTED |
| **O85** | `--fallback-model` composed from `roster.yml`; `PreModelSwitch` writes `model.switch` with the demotion and blocks an unrehearsed family | `bin/run` · the child's `--settings` — ABSENT; both ship | §9 · §12 | ADOPTED (the row is v78's) |
| **O86** | Gemini and Codex only as launchd children; the real `denyRead` list; the probe asserts from both contexts | `keel/host/denyread.yml` · `bin/probe` — ABSENT | §9 · §10 · §15 | ADOPTED |
| **O87** | `--autocompact <context>` from `prices.yml`'s `context:`; `PreCompact` → `run.compacted` row | `bin/run` · `prices.yml` — ABSENT | §6 · §13 | ADOPTED (R31 sharpens) |
| **O88** | `--settings <json>` per child carrying hooks and denies; `--agents` refused; the bypass-skip flag probed | `bin/run` · `bin/probe` — ABSENT | §12 | DEPENDS-ON-R27 |
| **O89** | Page 2's two verbs; `terminal:` in the manifest; ssh+tmux attach for box runs | `keel/surfaces/pages/2.yml` · `bin/run` — ABSENT | §14 | ADOPTED (R32 measures the pop) |
| **O90** | Bare `-p` in tmux, never `--bg`; a daemon row; O15 reads the daemon roster read-only; `bin/supervise` scoped to `bin/watch` | `bin/run` · `bin/watch` · §10.5/§15.6 — ABSENT | §10 · §15 | ADOPTED (R30) |
| **O91** | Pack `state: seed \| harvested`; the first dispatch is the demonstration; exemplar harvested after N handovers | `roster.yml` pack fields — ABSENT | §5 · §19 | ADOPTED |
| **O92** | High-water file seeded from `budget-guard.js`'s baseline, `seed: true`, replaced by the first observed week | `keel/logbook/window-highwater.yml` — ABSENT; the baseline exists | §16 · §4 | ADOPTED |
| **O93** | v77's checker measures its own per-skill constant; R8 first | the checker — ABSENT | §7 | ADOPTED |
| **O96** | `bin/probe`, `bin/run`, `bin/send` never run inside a Claude session | the programs — ABSENT | §15 | ADOPTED |
| **O97** | Every anchor prints `ANCHOR <name> exit=<code>`; the goal condition names the line | `keel/shared/anchors/*` — ABSENT | §6 · §11 | DEPENDS-ON-R17 |
| **O98** | `bin/bell` wraps the vendor push; the watermark is day-one | `bin/bell` · `bin/mine` — ABSENT | §14 · §13 | ADOPTED |
| **O100** | Cord scopes `--night` and `--all`; the phone defaults to `--night`, labelled | `keel stop` · every page's control — ABSENT | §12 · §14 | ADOPTED |
| **O101** | The cold-start scoreboard, one row per night, written by programs only; month-one success stated in S3 | `keel/logbook/nights.jsonl` — ABSENT | §21 · §16 | ADOPTED |
| **O102** | The first-month runbook, generated from `rules.yml` (`state: absent`) plus the founder-act list; founder acts counted by `bin/log` | `keel/host/RUNBOOK.md` — ABSENT | §19 · §2 | ADOPTED (rests on O109) |
| **O104** | `kind: kernel \| adapter` and `vendor_wins_if:` on every §L row and `bin/` program; adapters built only as wrappers | `rules.yml` · the lint — ABSENT | §L · §17 · §19 | ADOPTED (doctrine change, C3) |
| **O105** | `founder.act` rows; the briefing's first line; founder-minutes measured from day one | `bin/log` · the briefing — ABSENT | §2 · §16 · §21 | ADOPTED (v87 is the founder's) |
| **O106** | `VENTURE2` with `outcome:` contact rung 1; door → consent → Sender before pages 1/6/7; `OVERNIGHT` exits on a rung movement | `ventures/<v2>/charter.md` · §19 — ABSENT | §19 · §21 | ADOPTED (Q3 names it) |
| **O107** | R12 twice: thirty Floor episodes per domain now; VENTURE2's thirty later; *inventing an anchor* defined | one Sonnet `-p` pass · one founder sitting — ABSENT | §11 · §21 | ADOPTED |
| **O109** | `rules.yml` and a constitution ≤ 4,096 bytes that `session-start.js` injects whole | `keel/shared/rules.yml` · `keel/CONSTITUTION.md` — ABSENT; the budget exists | §0 · §1 | ADOPTED (doctrine change, B6/C18) |
| **O110** | The shadow subsidy line on the briefing from the first run | the briefing · `prices.yml` · O92's file — ABSENT | §16 | ADOPTED |

### New §N research (R27+)

| id | The question | Source class | What it decides | Status |
|---|---|---|---|---|
| **R27** | Does `--restricted` ignore `--settings <file>` as it ignores the settings files? | one measured cell | O88 — whether per-child hooks and denies ride argv | OPEN |
| **R28** | RSS per `-p` child and the page-in point on the box and on the Air | `memory_pressure` from launchd under N children | O71's `sessions_ceiling` | OPEN |
| **R29** | Does `--no-session-persistence` suppress the `~/.claude/projects` JSONL for a `-p` child? | the canary test in A4 | O82; v69's *settled by* | OPEN |
| **R30** | The daemon's lease semantics, idle exit, and what `claude agents --json` lists after it exits | `daemon.log` and one `--bg` child | O90; whether `bin/supervise` is a second implementation | OPEN |
| **R31** | Does `PreCompact` fire under `-p`, and does a compaction cost a 2x cache write? | one long `-p` run, `stream-json --verbose` | O87; the rest of R9 | OPEN |
| **R32** | `ghostty -e ssh box -t tmux attach -t <name>` — does it open, and at what latency? | one measured tap | O89, Q8 | OPEN |
| **R33** | Can a LaunchAgent on the box read a keychain item after reboot with the screen locked? | one detached read on the box | R3's box half; §15.4 | OPEN |

### New §M facts (sourced from thinker-A's measurements, 2026-09-06, this Mac)

| id | The fact | Row · change |
|---|---|---|
| **W33** | `pmset -g custom` → `sleep 1` on AC and battery; 391 maintenance sleeps, 74 back-to-sleep, 24 clamshell in seven days; battery at 71% (THINKER: A1) | v83 · O81 · §15.1 |
| **W34** | 48 teams, 224 members, 219 `backendType: in-process`; no `%N` pane id exists (THINKER: A2) | v4/v59 · O89 · §14.5 |
| **W35** | `claude --help` 2.1.263 lists `--no-session-persistence`, `--settings`, `--setting-sources`, `--agents`, `--autocompact`, `--fallback-model`, `-w/--worktree`, `--tmux[=classic]` (THINKER: A4, A8, A10, A15, A17) | O82, O85, O87, O88, O89 · §10.6 gap 6 closes |
| **W36** | Outbound loopback `connect()` is denied for sandboxed Bash (THINKER: A5) | v68 · O13 · R4's outbound half |
| **W37** | `gemini --version` → EPERM on `~/.gemini/settings.json` under the live sandbox; `~/.gemini`, `~/.codex`, `~/.config/openai` are denied (THINKER: A9) | O86 · §15.4 |
| **W38** | `~/.claude/daemon/{control.key,dispatch,roster.json}`, `~/.claude/jobs/`, `auth_required`, *"idle 5s with no clients — exiting … leases=0"* (THINKER: A7) | O90 · §10.5 |
| **W39** | `budget-guard.js` baseline: peak 1,961,285 output tokens in any rolling five hours over 99 transcripts (THINKER: A12) | O92 · v74's seed |
| **W40** | 134 skills, 28,250 bytes of `name`+`description`, ≈53 tokens per skill (THINKER: A13) | O93 · v77 |
| **W41** | Five `ceo-*` worktrees, three terminals, one console login; 825 commits by Claude Code to 129 by the founder (THINKER: A6) | v84 · O84 |

---

## 7 · Build-order consequences

**One new root, and §19.3's *"not one new root"* stops being true on purpose.** `BOX` (FOUNDER ACT, Q1) is a root:
`BOX → HOST → PROBE → RUN`, and `MANAGED` moves under `BOX`. `LOG` moves to the box. Gains: `BOX`, `OPREG` (O84,
joins `RUN` and `WATCH`), `SCOREBOARD` (O101, joins `LOG` and `WATCH`), `RUNBOOK` (O102, off `RULES`), `RULES` (O109,
before `SCHEMAS`), `CONSTITUTION` (off `RULES`, into `session-start`), `VENTURE2` (O106, off `INBOUND`, `CONSENT`,
`SENDER`), `SUBSIDY` (O110, joins `METER`). Loses nothing; `CLOUD` is re-labelled *waits on a box-outage
measurement* rather than on the Air's sleep log. Reorders: `WATCH` before every page; `P4 → P2 → P3 → P5`, and
`P1`, `P7`, `P6` behind `VENTURE2`'s first rung movement; `EGRESS` splits into its three transports with `R2` on each;
`ROUTING → RUN` keeps the pack ordering with `seed` packs admitted; every `kind: adapter` node carries its vendor
surface as a dashed edge.

**The first three things built**, after the box is plugged in: (1) `bin/log` with O6's schema, O31's chain and
`founder.act`; (2) `bin/run` with the full argv in tmux, writing `sessions.jsonl`, `run.started` and the pgid, its
first child printing the canonical anchor line; (3) one builder against one real venture intent through one anchor,
read in the morning — the scoreboard's first row.

---

## 8 · Scope notes

**Read, whole, in the brief's order:** thinkers-digest.md · thinker-A.md (primary) · thinker-B.md · thinker-C.md ·
SPINE.md §A–§N · FINAL-PLAN-v2.md §0–§23 (every section a fix above touches read in full: §0, §2, §3, §4, §6, §8.1a,
§9.4a–9.11, §10, §11.9–11.10, §12, §13.7, §14.1, §14.5, §14.11–14.13, §15, §16, §17.5–17.8, §19, §20.2, §21) ·
rethink/SYNTHESIS.md · research/world.md · DECISIONS.md §1–§23 · CLAUDE.md · AGENTS.md · `.claude/agents/`
orchestrator, builder, sourcer · lenses.yml · playbooks/ship-feature.yml. **Not read, per the brief:** `round-6/`,
the scratchpad `returns/`, any session file, any other fixer's file. **Nothing measured, run, installed, spent,
committed or pushed**; every figure is a thinker's or the plan's and is marked so. **Decided alone:** every O row,
v84–v86, the amendments to v11, v43, v46 and v12, the adapter table, the scoreboard and the runbook. **Sent to the
founder:** eight questions, each with the default I proceeded on; five founder-row amendments (v68, v69, v76, v78,
v87) written as proposals; the two doctrine changes (convergences 4 and 6) recorded as changes with their cost.
**Single model family, single agent:** one Anthropic model reading three reports of the same family; rung 4 by the
plan's own ladder, certifying nothing.
