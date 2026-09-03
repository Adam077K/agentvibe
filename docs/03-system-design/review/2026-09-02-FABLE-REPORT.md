# The Fable report — joint review of StartupOS v2 · 2026-09-02

```
status:    SIGNED BY BOTH · 2026-09-02. Merged by fable-2 from 2026-09-02-fable-1.md and 2026-09-02-fable-2.md;
           fable-1 edited in place (1.1 provenance, 1.13, 8.2, 8.5, 8.7, 9), then folded its audit lane's seven
           citation corrections (1.1, 1.2, 1.4, 1.8, 1.14, 2.8, 4.3, 9) and signed. 772 lines.
object:    docs/03-system-design/STARTUP-OS.md v2, 2,826 lines. OS:<n> = a line in it. CO/CR/MI/RU = the four
           designs; FLY/FDR/MAC/PIC = the visions; BD = the board file; frame = year-one-frame-v1.md.
evidence:  every claim about this repo carries a path or a measurement run in this worktree on 2026-09-02;
           every claim about the world carries a URL and the date read, or is marked SPECULATION. "measured
           (fable-1)" = twelve `claude -p` probes on v2.1.258 reading the system/init roster, run by fable-1's
           argv lane; "measured (fable-2)" = a command fable-2 ran. Full detail is in the two findings files.
posture:   read-only, breached once by each reviewer's sourcer lane — §9.
```

---

## 0 · VERDICT

This is the right system at the wrong altitude and in the wrong first month. The shape — one register of what
left and what came back, one model-free mouth, a pack as an argv, the fuse with a reversible default, an
evidence ladder whose assertion string is generated from its rung, refusals that carry their own reopen
command, one writer per store — is right, and no shipped product or open-source system governs the class of
act it governs (publish, send, spend, contact a named human); Routines, Managed Agents, Codex, Jules and Devin
every one terminate at a pull request. **The single largest thing wrong is the physics claim:** the compiled
argv narrows with `--allowedTools`, which restricts nothing (measured: `--allowedTools Read` left Bash, Task,
WebFetch, Workflow and 210 MCP tools present); the "second layer" is inherited settings a maker holding Bash
discards with `claude -p --setting-sources ""` (measured: 3 hooks → 0); `permissionMode` on this Mac is
`auto`; both measurements behind the `MEASURED` label were taken inside a session and the frame's own
sentence *"under launchd it runs outside the hook"* was dropped — so every "safe by construction" sentence
rests on a label the document's own line 181 calls a defect, while the two vendor mechanisms that would make
it true, `--restricted` and managed settings, appear nowhere. Second, the whole build path forks on a "looking
test" whose "measured base rate of zero" is a misread of its own source — OS:53 says beeond *could not look*,
OS:1268 makes it the founder, and the founder judged all eleven — whose fail branch the spec's own fuse already
implements as a setting, and whose surface, "terminal only", refuses the one channel this founder demonstrably
opens: rendered pages, three consumed in one session. Third, it is 2,826 lines naming 153 paths of which 37
exist and 10 of those are described wrongly, and it carries the disease it diagnoses: fourteen landings,
forty-plus artifacts, and the second real exposure on day 20–30.

**What survives, and should be defended.** The argv as the policy seam is right and its scope was overstated:
it is physics for MCP servers and bare-denied built-ins, and it extends to the whole grant — tools, settings
inheritance, file confinement, network — the moment the compiler emits `--restricted --tools
--strict-mcp-config --permission-mode dontAsk` under a managed settings file (1.1). The mouth with no model in
it survives whole. Refusal 8 (no judge resolves a done-test) survives and the evidence is stronger than the
spec claims (4.9). Refusals with countable reopens are the most transferable idea in the document. The fuse
survives and dissolves the fork (2.3). `unresolved ≠ pass`, `no_data ≠ not_checked`, the rung-generated
assertion, the one-classifier rule and "a finding about the instrument, not the work" survive untouched.

---

## 1 · FIX — wrong, contradictory, unbuildable, or unsafe as written

*Ranked by consequence. what · why (evidence) · where · cost · confidence · endorsed.*

**1.1 The seam is mis-specified by one flag and leaks by one Bash call.** The compiled argv (OS:329-335) and
Map 1 (OS:2257) narrow with `--allowedTools`. `claude --help` v2.1.258 on this Mac: `--allowedTools` is *"a
list of tool names to allow"* and `--tools` is *"the list of available tools from the built-in set"*; the
cli-reference page (read 2026-09-02) is explicit: *"To restrict which tools are available, use `--tools`
instead."* And landing 2 (OS:2515) names M3 — `--disallowedTools` — as the go/no-go for packs-as-argv while
the compiled argv never uses that flag to narrow a built-in. Measured
(fable-1): `--allowedTools Read` → 30 built-ins and 210 MCP tools present including Bash, Task, WebFetch,
Workflow and `mcp__higgsfield__tiktok_publish`; `--tools Read,Write,Edit,Bash,Glob,Grep` → those six, Task and
WebFetch gone, **154 MCP tools survived**; add `--strict-mcp-config` → 0 MCP; `--disallowedTools 'mcp__*'`
removes the tools but 14 servers still start holding their credentials. So Map 1's makers, as written, hold
everything. The error predates the spec: the Territory page the founder read on 2026-09-01 already called
`launchd` running `claude -p --allowedTools "…"` *"a working 24/7 worker with a real per-run capability
grant"* (its "Three findings that reframed the day"), so the founder has now been shown the wrong flag as the
seam twice. Then the second layer: hooks, `permissions.deny`, `sandbox.*`, `denyRead` all live in user/project
settings a child loads from its cwd; measured (fable-1): `claude -p` in the repo fired 3 SessionStart hooks,
the same with `--setting-sources ""` fired **zero** and `permissionMode` fell from `auto` to `default`;
`--bare` likewise. A maker with Bash runs `claude -p --setting-sources "" …` and gets a grandchild with no hook
and no deny set. Only managed settings survive argv (*"Nothing you set overrides them"*, docs 2026-09-02).
And a plain `claude -p` on this Mac starts in `permissionMode: auto` (verified by both) — a classifier that
auto-approves — and the argv names no `--permission-mode`. On the Bash door itself (fable-2, measured):
`credential.helper` is `osxkeychain` with an HTTPS origin, so `git push` reaches GitHub without reading a
secret; `gh osascript mail sendmail ssh open shortcuts security curl` are on PATH; the project sandbox has
**no `network` key** and the spec never mentions `sandbox.network`; in-session DNS is denied only by a
session default (`ENOTFOUND`); the hook is a substring matcher that blocked a read-only `for` loop because
the word `curl` appeared as data. One nuance keeps a layer standing: Seatbelt binds *"every Bash command and
its child processes"*, so the OS layer survives a re-exec **if it was armed for the parent** — and the docs
are silent on whether a launchd child arms it. The frame measured *"Under launchd it runs outside the hook"*
(frame:135); the spec dropped the sentence and presents `pre-tool-use.sh` as a live second layer for the loop
(OS:473, OS:1118). **Fix:** see 2.1 — `--restricted --tools <list> --strict-mcp-config --permission-mode
dontAsk` under a managed settings file. Where: §0, §02, §03, §09, Map 1, WWHTBT #2. Cost: small, and the
managed file is a founder act. Confidence: high. Endorsed: both.

**1.2 Five `MEASURED` / physics labels have no measurement behind them, and both real probes were taken in
the wrong condition.** (i) `--strict-mcp-config` "makes user-scope servers absent" — `MEASURED` at OS:214,
OS:1111, OS:2265; no record anywhere; `docs/03-system-design/designs/2026-09-02-runtime-first.md:797` lists it as open M2. It happens to be true
(measured today by fable-1). (ii) "Never `--bare` (`MEASURED`: no auth)" (OS:337) — no record;
`hands.md:536` quotes the vendor recommending `--bare` for scripted calls; the docs say `--bare` never reads
OAuth or the keychain, so "no auth" is true only of subscription auth. (iii) "`claude mcp list` exits 0 when
unhealthy (`MEASURED`)" (OS:496-498) — `docs/03-system-design/designs/2026-09-02-runtime-first.md:807` lists it as open M12, absent from the spec's own
probe set (OS:2515). (iv) `session_id`, `total_cost_usd`, `num_turns`, `stop_reason`, `cache_read_input_tokens`
"every one of them `MEASURED` present" (OS:592, OS:860, OS:890) — nobody probed the envelope; measured
(fable-1): `--max-turns 1` returns `subtype: "error_max_turns"`, `terminal_reason: "max_turns"`,
`stop_reason: "tool_use"` (the *model's* stop reason), `is_error: true` and **no `result` key**, exit 1; so
`return.test.mjs` (OS:783, OS:876) keys `truncated` off the wrong field. (v) "a `Workflow` is main-session
only" stated as binding physics at OS:25 — which deletes D10's own stated justification for the loop shape,
*"the only loop shape that reaches the producing workflows, because … a claude -p process under launchd is
not a sidechain"* (BD:296), held at confidence medium because nobody has run `claude -p` under launchd. And the two real probes (M1 `Write`, M3 `BASH_UNAVAILABLE`) were taken
**inside a sandboxed session** (frame:268); the loop's actual condition — launchd, no parent — is unmeasured
for every flag. Where: §02, §03, §07, §08, §11, Part I. Cost: small (~$0.50 on haiku, plus one launchd run
the founder authorises). Confidence: high. Endorsed: both.

**1.3 The looking test's "base rate of zero" is a misread, and the fork rests on it.** OS:53: "beeond made
11 mockups and **could not look at one of them**" — subject beeond, the agent; OS:1268: "an attention record
that reads … **eleven mockups unlooked at**" — now the founder, and the basis of "measured base rate zero"
(OS:1287, OS:2726). The beeond record: the agent could not view them (`2026-08-26-ceo-website-design-process.md` (line 35, a session file in the beeond repository));
the founder judged all eleven, "right craft, wrong shape" (`:19`); the rethink session says "Sight works"
(`2026-09-01-ceo-startup-os-rethink.md:54`). The other two legs — "seven views, one acts" and "an Inbox empty
on every project" — measure the machine's supply, not the founder's appetite. OS:138-140 ("sight is not a
blocker") is refuted by the same record and by OS:499. **Fix:** assumption #1 reads *base rate unknown*; the
fork becomes a mode (2.3); the surface changes (2.4). Where: §10, §17, Stage 1, WWHTBT #1. Cost: zero.
Confidence: high. Endorsed: fable-2 (fable-1's R5 reaches the same design conclusion from the field record).

**1.4 Ten things the spec says about existing code that a grep contradicts.** (a) OS:858, OS:871
`logEvent(task, obj)` "two-argument arity" — `scripts/lib/events.js:55` is `logEvent(obj, repoRoot)`; landing 3
is built on the wrong signature, and the company-first design warned a logger that can abort the loop is
worse than none (CO:138-142). (b) OS:993, OS:1008 `verdict.mjs --subject-kind` — no such flag; the script
refuses unknown flags at exit 2 (`verdict.mjs:442`), so the invocation as written fails; the test is
`merge-gate.test.mjs`. (c) OS:1096 `reach_floors:` "floors as data" — zero occurrences in `qa-tier-floor.yml`;
no `classifyGrant`; `classifier.js` computes path only. (d) OS:992 `claim-world` in `resolvers.js` —
`RESOLVER_NAMES` (`:39`) has five names, not it. (e) OS:2359 "`check-registration.mjs` sweeps packs
`[exists]`" — zero hits. (f) OS:110 "board-meetings/ does not exist" — it exists with 36 entries, and OS:18
cites it. (g) "171 session files" restated as current in Part II (OS:1648, OS:1708) — a self-recomputing figure
(origin/main 162, this tree 174); the defect is a dated census restated as current, not the number.
(h) "the `steps/how/method/implementation` predicate" — `schema-lint.js:1722` has six keys and one call site;
pointing it at `intent:`/`packs/` is new code. (i) OS:87 `qa.js` "8 runs" — the record is three (CLAUDE.md;
`2026-08-16-ceo-harness-brief-v2.md:12`). (j) OS:569, 1343, 1459, 1946 name `check-fields`, `probe-headless`,
`monthly`, `check-obligations` as "a suite step" — none exists; `check-suite.js` STEPS (48) contains none.
Plus OS:51's "the `design` lens has five steps, all judging" cites the DECISIONS entry that *fixed* it —
`.claude/lenses.yml` has twelve steps and refuses a score at `:180`. Where: throughout. Cost: small each.
Confidence: high. Endorsed: both.

**1.5 The §07 prompt cap cannot hold its own contents.** `prompt.mjs` output "≤ 4,096 bytes" with seven
components, the fourth `BOARD.md` (OS:883-885), itself capped at 4,000 bytes (OS:695, OS:771, OS:2282).
Measured (fable-2): `INDEX.md` 1,539 bytes; namespaces 2,477–5,310; index plus the smallest namespace is 4,016
bytes before pack preamble, `TASTE.md`, `BOARD.md`, `STEER.md`, ORIENT and the task. `prompt.test.mjs` checks
"bytes and order" (OS:576, OS:873): jointly enforced, jointly unsatisfiable. Company-first had six per-surface
budgets ≤ 6 KB (CO:504-511). **Fix:** per-surface budgets or ids-only router injection. Where: §07, §06.
Cost: low. Confidence: high. Endorsed: fable-2.

**1.6 The rope is a fraction of an undefined quantity, meters the wrong thing, is tripped by the founder,
and collides with the spec's own spend refusal.** `rope_fraction: 0.6` of "the rolling 5-hour window"
(OS:1587, OS:1600) — no absolute plan limit is published: four first-party pages read 2026-09-02 state only
multipliers and "resets every five hours"; the only denominator in the repo is `WINDOW_BLOCK = 3_000_000`
output tokens (`budget-guard.js:47`), 1.5× the founder's own peak (`usage.js:24-25`). Over a 35-day scan of
2,925 transcripts, **output tokens are 11% of list-price cost** (cache reads 57%, writes 32%) — `usage.js:18`
concedes it. `windowUsage()` is account-wide with no per-actor axis: fable-2's review session alone produced
1,409,678 output tokens in five hours, 78% of a 0.6 rope, with no loop running (BD:532's open question 4,
answered: not with this meter). `RETAIN_HOURS = 6` (`usage.js:40`) collapses `sinceLastArtifact()` into
`windowUsage()` past six hours — the board measured both at 193,027 (BD:218) — and §1b still prints two
numbers (OS:115-116) and calls `budget-guard.js` "Decision 8 already built" (OS:128); a durable artifact is any
commit (`usage.js:182-185`), so a maker told to commit often never stalls. And if the loop moves to an API key
(2.6), `pack.mjs` "refuses `reach: spends` while `usd_per_day` is null" (OS:1129, OS:1590) — an API-billed loop
*is* spending, so the year-one refusal blocks the loop it was never aimed at unless model spend is typed
exempt. `budget-guard.js` is also over its < 200 ms budget cold (939 ms measured) and every `-p` move is cold.
Where: §13, §01, §11, Part I. Cost: low. Confidence: high. Endorsed: both.

**1.7 `StartInterval 300` equals the prompt-cache TTL, so the tick can never hit the cache.** Cache lifetime is
five minutes from the start of the request that wrote the entry, generation time counting
(<https://platform.claude.com/docs/en/build-with-claude/prompt-caching>, read 2026-09-02); `launchd
StartInterval` counts from launch, so tick N+1's first request begins at T + 300 + ε — deterministically. Every
tick pays the 1.25× write and never collects the 0.1× read, under a §07 whose cost argument rests on cache
order (OS:844-846). `tick.lock` makes an overlapping tick a no-op, so the interval is only a polling rate and
`WatchPaths` covers latency. **Fix:** `StartInterval 240`. Where: §11, §07. Cost: zero. Confidence: high.
Endorsed: fable-2.

**1.8 Compaction is not designed out, the watchdog leaves the grandchild running, and a `-p` child has an
address.** (a) OS:852, OS:877, OS:1354: the process exits so nothing compacts. Settings reference: compaction
runs "when the conversation reaches the model's context limit" unless `autoCompactEnabled: false`; a `-p` run
is a conversation. (b) OS:1340, OS:1365: "a node spawn timer sending SIGTERM at `timeout_s`". Measured
(fable-1, Node v24.11.1): `spawn(…, {timeout})` and `AbortSignal.timeout()` killed the child at ~1 s while its
grandchild ran to 6 s; `detached: true` + `process.kill(-pid)` killed both — a "killed" move keeps the lock
and keeps spending. (c) OS:742, OS:780: "a `claude -p` child has no address … physics". False, and `--tools` does not fix it:
the cross-session-messaging page (read 2026-09-02) says *"Claude Code binds an inbox socket for a `claude -p`
session like an interactive one"*; removing `SendMessage` stops the child sending, not being addressed; only
`--bare` skips the bind — which OS:337 forbids — and `crossSessionInbound: refuse` drops messages while *"Claude
Code still binds each session's inbox socket"*. Worse for 1.1: `CLAUDE_CODE_MESSAGING_SOCKET` and
`CLAUDE_CODE_MESSAGING_TOKEN` are exported *"to hooks and Bash commands"*, so a maker holding Bash inherits both;
`sandbox.network.allowUnixSockets` is the relevant key — measured: both variables are set in fable-2's own sandboxed Bash environment in this session, 2026-09-02. **Fix:** `autoCompactEnabled: false` for makers;
key `truncated` off `subtype`/`terminal_reason`, absent `result` → `failed`, exit 143 → `timeout`;
process-group kill with a SIGKILL grace. Where: §06, §07, §11. Cost: small. Confidence: high. Endorsed: both.

**1.9 The assembly did not reconcile its three spec groups, and Map 2 is neither the one table nor one
writer.** The named-human register has three names — `policy/humans.yml` (OS:461, OS:1103), `people.yml`
(OS:1101, OS:1936, OS:2299), bare `humans.yml` (OS:2254), OS:1101 and OS:1103 two lines apart; `outcomes.jsonl`,
trust's only input (OS:342, OS:359, OS:379), is absent from Map 2, "the one store table" (OS:2276);
`EXPOSURES.yml` has three writers (OS:2285, OS:991, OS:361) against "exactly one" (OS:636, OS:681), and Map 2
lists two writers on six rows (OS:2281, 2290, 2294, 2296, 2298, 2303); `STOP` is step one (OS:284) and "the
tick's second step" (OS:2198); `outbound-approval` "gets its caller in tick step 7" (OS:2523) while step 7 is
the spawn (OS:284-285); `instead_of:` is on every dispatch (OS:274) and lands in Stage 2 (OS:2584); the
apprenticeship counter lands at two packs (OS:385) and three (OS:405); `notify_per_day` escalates on three
triggers (OS:818, 1283, 1910); `tick.lock` goes stale at 30 min (OS:787) while `timeout_s: 1800` (OS:2341), so
a move at its limit is byte-identical to a dead tick; `sweep` is a pack (OS:361, OS:2326) and a harness
script (OS:2292); `codex` is a held tier-H hand (OS:438) and not installed (OS:124); and **nineteen stores
named in Components are absent from Map 2** (`PORTFOLIO.yml`, `packs/`, `LIMITS.yml`, `personas/`,
`outcomes.jsonl`, `policy/hands/`, `hands.json`, `policy/humans.yml`, `staged/`, `decks/`,
`mediated-paths.yml`, `LADDERS.yml`, `findings.yml`, `qa-tier-floor.yml`, `gates.yml`, `STOP`, `rates.yml`,
`.out-of-scope/`, `PL.md`/`OFFER.yml`, `outbound.q`). Where: throughout. Cost: low. Confidence: high.
Endorsed: both.

**1.10 `select.js` is "pure and total" with no branch for the case Rule 10 exists for.** OS:975-977: eliminate
P1s → fewest P2s → archive distance; nothing for *every candidate carries a P1*. `docs/03-system-design/designs/2026-09-02-creativity-first.md:629` had
it: *"the round is `unresolved`, never 'least bad'."* As written, eight broken candidates return a winner. And
no common-cause branch: eight variants from one prompt assembler, one ORIENT block and one model (OS:351)
sharing a finding is `common_cause`, not "all bad". Where: §08. Cost: small. Confidence: high. Endorsed: both.

**1.11 D13 is violated and Part V says all fifteen stand.** D13 (BD:333-344): the board does not reconvene
without (a) an agent file per persona narrowing its roster and (b) a cost cap something reads. REFUSES 7
(OS:2711) swaps both for an unrelated trigger; OS:323 "zero new agent files, ever" makes (a) unreachable;
OS:410 and OS:816 conflate the board with creativity-first's council; Part V (OS:2808) lists four narrowings,
not this. The concrete answer existed: personas as packs — `persona-adversary.yml`, `--allowedTools
Read,Grep,Glob`, empty MCP config, JSON output for cost (RU:537-542); the spec keeps `personas/<id>.md` with no
argv (OS:363). Where: §02, §06, Part V. Cost: small. Confidence: high. Endorsed: both.

**1.12 The trust key omits the model id, and the three-count rule has no decay.** "A done-test passed on a
cheaper model is a different fact" (OS:1323, OS:1535); key is `(pack × field)` (OS:340) — a pinned-id bump
inherits a record earned by another model. Counts (a)(b)(c) (OS:2435-2437) are lifetime-monotone; 14 CFR
61.57 requires three landings in the preceding 90 days and instrument currency lapses at six months without
self-restoration (<https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-61>, read 2026-09-02).
**Fix:** `(pack × field × model)`; rolling-window counts; a standing warrant with no exercise in the window
reverts to `morning`. Where: §02, §16, Map 5. Cost: low. Confidence: high. Endorsed: fable-2.

**1.13 Refusal 8 forbids the score the spec builds — or does it?** "Any summed or averaged score … reopen:
never" (OS:2712); `trust(pack, field)` (OS:340-344, OS:2361-2366) is a number over counters, outcome-anchored,
recomputed at dispatch, failing closed — a calibrated score in all but name (NEWS2, APACHE II, Apgar work
because inputs are measured and weights fitted to outcomes). D7's own text is narrower than refusal 8: *"No
score summed or averaged from judge outputs"* (BD:257); OS:2712 broadened it to *any* summed score. Restoring
D7's scope — no score whose inputs are model judgements, ever; counters over world outcomes may be summed only
with a denominator floor and `undefined` at zero — resolves it without narrowing anything the board decided
(§8.5). Where: §08, REFUSES 8. Cost: low. Confidence: high. Endorsed: both.

**1.14 Two live hazards beside the spec.** `.claude/settings.json.proposed` — **tracked and clean since the
initial commit** (`abf26c2`, the template import), so it ships with the template; keys
`permissions, hooks, statusLine`, **no `sandbox` block, hooks `SessionStart, PostToolUse` only** — would delete
the sandbox and the `PreToolUse` hook, "layer two and untouched" (OS:2777; the seam itself at OS:1124). And four hook files on disk
(`budget-guard.js`, `schema-lint.js`, `stop.sh`, `gsa-context-monitor.js`) are registered nowhere; the founder
edit at landing 5 is load-bearing for four files, not one. Where: §09, §13. Cost: small. Confidence: high.
Endorsed: both.

**1.15 `PL.md` will print list price, and pricing is keyed to a price that never took effect.**
`total_cost_usd` is a client-side list estimate; the costs page says for Max/Pro subscribers "the session cost
figure isn't relevant for billing purposes" (<https://code.claude.com/docs/en/costs>, read 2026-09-02). Cost per
surviving exposure will read 30–50× the outlay; ESTIMATE by day 30 the denominator is 1 — the founder's
hand-posted page — against $3,200–6,800 list, ~$100–200 billed. Sonnet 5 is $2/$10 standard, the scheduled
$3/$15 "will not occur" (platform pricing, 2026-09-02), so §07's "~$700 a month" Batch illustration (OS:855)
should be re-keyed — and Batch is unreachable from the CLI, not "unverified" (OS:854). Where: §07, §13. Cost:
low. Confidence: high on the gap, medium on figures. Endorsed: both.

**1.16 Part I is stale and five census cells quote words no record holds.** "board-meetings/ does not exist"
(OS:110) and "/board-meeting … Never run" (OS:81) — the board met 2026-09-01. Cells OS:81, 82, 85, 86, 87 under
"in the founder's words" match nothing in `board-meetings/2026-09-01-startup-os/r0-shared.md:35-46`; only
OS:88 matches. The §0 thesis (OS:196-207) and twenty other figures carry neither `illustration` nor `MEASURED`
— `rope_fraction: 0.6` (RU:879's number), `10%`, `48 hours`, `24 hours`, `diversity_floor: 0.3` (altered from
CR:191's 0.34), `timeout_s: 1800` (RU:168's 900) — and `scripts/check-figures.mjs` (57 lines) enforces exactly
that rule and is not named. Where: Part I, §0, §10-§13. Cost: low. Confidence: high. Endorsed: both.

**1.17 Unattended `claude -p` under a subscription is a terms question nobody has asked.** Consumer Terms
(<https://www.anthropic.com/legal/consumer-terms>, read 2026-09-02): automated access is prohibited *"except
… via an Anthropic API Key or where we otherwise explicitly permit it"*; Routines and desktop tasks are the
permitted unattended surfaces; a launchd loop on OAuth is docs-silent. Not agent-resolvable. The API-key path
(2.6) also answers it. Where: §11, §13. Cost: zero to ask. Confidence: high that it is open. Endorsed: both.

---

## 2 · CHANGE — same goal, better mechanism

**2.1 Compile every child with the vendor's containment flags; put the deny set where argv cannot reach.**
```
claude -p --restricted --model <id> \
  --tools "Read,Write,Edit,Glob,Grep[,Bash]" --strict-mcp-config [--mcp-config $TMPDIR/pack-<id>.json] \
  --permission-mode dontAsk --max-turns N --max-budget-usd C \
  --add-dir <worktree> --output-format json --json-schema <return.schema.json> \
  --settings '{"sandbox":{"enabled":true,"failIfUnavailable":true,"allowUnsandboxedCommands":false,
               "network":{"strictAllowlist":true,"allowedDomains":[]}},"hooks":{…}}' \
  --append-system-prompt "$(node scripts/loop/prompt.mjs <task>)"
```
plus a managed settings file (`/Library/Application Support/ClaudeCode/managed-settings.json`, absent today)
carrying the same deny set, `disableBypassPermissionsMode`, `disableAutoMode`,
`allowManagedPermissionRulesOnly`, the sandbox block and the `PreToolUse` hook. `--restricted` (`--help`
v2.1.258): "removes the built-in tools that run commands or code … and WebFetch unless `--tools` names them,
and ignores user, project and local settings files (managed settings and `--settings` still apply … confines
the file tools to the working directories … refuses bypassPermissions)." `strictAllowlist` "set in a
repository's `.claude/settings.json` has no effect" — it binds only from user, managed or CLI settings. This
is Map 3's pack as a grant in two vendor flags and one file, and it makes "the argv is the policy seam"
(OS:214) true. **Measure before relying on it:** whether `--settings` carries hooks under `--restricted`, and
the whole set under launchd (1.2). Where: §02, §09, Map 1, Map 3. Cost: small–medium. Confidence: high on
the flags, medium on the two unmeasured interactions. Endorsed: both.

**2.2 Decide what Bash a maker holds; the spec picked the widest without saying so.** *None*: makers hold
`Read Write Edit Glob Grep`; the harness runs `npm run check`, the oracle, the screenshot (already the spec's
shape at OS:936) — kills the re-exec leak by construction; cost: no mid-move test loop. *Whitelisted*:
`--tools Bash --permission-mode dontAsk --allowedTools "Bash(npm run check:*)"` — the permissions doc:
*"Claude Code is aware of shell operators, so a rule like `Bash(safe-cmd *)` won't give it permission to run
`safe-cmd && other-cmd`"*; the `( npx … )` finding is about the hook's string matcher, not this one. *Full*
(OS:388, OS:2257): then 1.1 is live and only managed settings and the sandbox stand. fable-1: none for
`web-feature` in year one; fable-2: whitelisted from day one for `web-feature`, none for content packs — §8.
Where: §02, Map 3. Cost: small. Confidence: high. Endorsed: both (the fork), split on the lean.

**2.3 The Stage 1 fork becomes a runtime mode, measured after a run-in, on acts as well as opens.**
`ABSENCE.yml` with a closed enum `normal | reduced | shelf-only | shutdown`, each a *set* (which packs
dispatch, which hands fire, which card classes may fuse), read at tick top beside `STOP`; unknown mode →
refuse all dispatch. `shelf-only` **is** the "smaller, stranger machine" (OS:2556-2559), and `shutdown` is
§22's dead-man's switch (OS:2173-2175) moved from Stage 6 to Stage 1. The fuse already makes a silent founder a
setting (`default_if_unanswered:` + `fused`, OS:1216-1220; "EXPIRE and the fuse are the same edge", OS:2428):
the staging machine and the asking machine differ by one flag — `notify_per_day`, `default_if_unanswered`,
`reach: local` are all Stage 0. Start the looking test's clock at landing 13, when `BRIEFING.md` has real rows,
not day 8 when it is three days old and the founder is building the machine (a pass is confounded
optimistically; only a fail carries signal). Add a second signal: `EXPOSURES.yml` rows by the founder's hand —
the founder's hand on the artifacts while the briefing sits unopened is a finding about the instrument. And do
not announce the threshold to its subject (OS:2549 already did). Where: Stage 1, §17, §22. Cost: medium.
Confidence: high. Endorsed: both.

**2.4 The year-one surface, redesigned for this founder: `BRIEFING.html` plus the shelf.** At 08:00 the
briefing writes `BRIEFING.md` **and** `BRIEFING.html` from the same query — no server, no acting, opened with
`open`; money first, four sections, "nothing" spoken; plus one block a terminal cannot render, THE SHELF —
every artifact made overnight, thumbnail or first 60 words, losers included (catalogue C37). Verbs stay CLI
acts (OS:1261); the page cannot send, spend or approve. Done-test, all three: (a) opened twice unprompted
> 48 h apart by access time; (b) ≥ 1 `promote.mjs` naming a cell the machine did *not* nominate — the real
instrument, since it measures looking at *work*; (c) day-8 numbers without chasing. Control arm: instrument
`npm run balcony` too. `renderers.test.mjs` already forbids divergence. Sort the queue by time-to-fuse ×
irreversibility × what it unblocks (the six rows are ordered by nothing visible). Where: §10, landings 3 and
13, REFUSES 12. Cost: low. Confidence: high. Endorsed: fable-2 (fable-1: triage ordering).

**2.5 The founder's tap is a program from day one.** In year one the one component performing every outbound
act has zero checks on it (OS:486-487), and Stage 4 (OS:2621) is the first time any of Map 5's eight checks
executes. `bin/tap.mjs` runs the subset that exists — artifact exists and sha256 matches the staged row ·
`not_before` passed · no `NEVER-SAY` pattern · counters under ceiling · `pack_id` + `grant_hash` unchanged
(ultra vires, 5.5) — and the founder's act is the *last* check. Stage 4's mouth becomes a credential handed to
a program that has already refused a hundred times; the Stage 3 drill (OS:2618) has something to drill from
week one. Where: §03, Map 4, Map 5. Cost: small. Confidence: high. Endorsed: both.

**2.6 Bill the loop to an API key; the rope changes unit.** Authentication docs (2026-09-02): *"In
non-interactive mode (`-p`), the key is always used when present"* — set `ANTHROPIC_API_KEY` in the launchd
job's environment only and the loop never touches the founder's window; `--max-budget-usd` then caps a real
bill (on subscription auth it caps a notional figure nobody is billed); Decision 8's intent is met better than
by a fraction of an undefined window (1.6). Cost is the open number: fable-1's lane ESTIMATEs $74/month at 40
moves/night counting each move once, $147 with six tool turns, $558 with a cold cache; fable-2's lane
ESTIMATEs $0.9–1.2 per move on Sonnet 5 (a ~60k-token base context calibrated from the $0.088 haiku probe;
this repo's CLAUDE.md is large) → $1,300–1,700/month at 48 moves/night, $130–420 at 5–10 — §8. Either way:
1.7's cache miss must be fixed first, and model spend must be typed exempt from `usd_per_day: null`. Where:
§13, §11, Decision 8. Cost: small. Confidence: high on the mechanism. Endorsed: both.

**2.7 Liveness by world-effect, not by token count.** `stalled` = output tokens since the last durable
artifact (OS:268, OS:1601-1603); `stuck` = three distinct approach hashes (OS:269). Vending-Bench
(arXiv:2502.15840): the meltdown is verbose *and* inventive, uncorrelated with context fill (r = 0.167) — both
meters read green through the entire failure. **Change:** `stalled` = no change in a world-observable (worktree
tree hash, staged dir, `EXPOSURES.yml`) since the last checkpoint — at minimum an *oracle-passing* artifact,
never any commit; `stuck` = N moves against one falsifier with no movement in it; keep the token meter as the
cost brake it is. Where: §01, §13. Cost: medium. Confidence: high. Endorsed: both.

**2.8 Warrants on Biscuit, not a hand-rolled HMAC chain.** With HMAC the verifier holds the minting secret, so
**a compromised mouth is a minter**, and Map 1's minter/mouth separation rests on their not being one
authority. Biscuit v3 (Eclipse, Apache-2.0; <https://www.biscuitsec.org>, read 2026-09-02): the mouth holds
only the root public key; blocks cannot be removed without invalidating the signature; `sealed` forbids
further attenuation — the leaf warrant. UCAN where the delegate is a spawned sub-worker; `SO_PEERCRED` on the
minter↔mouth socket. One caveat (fable-1's audit lane): on one Mac under one uid a compromised mouth reads the
key file whatever the algorithm, so Ed25519 buys real separation only when the mouth moves off-box or to its
own uid — adopt it as one dependency now that removes an unverifiable assumption later. Where: §16, Map 5.
Cost: medium. Confidence: high. Endorsed: both.

**2.9 Keep the tick; fix its constants; `decide()` as a pure function with an injected clock and a cursor;
Agent/Workflow only where a verdict binds.** Of the reference set only two shapes run when nobody types
(auto-company's while-true and the tick); the tick is auto-company plus a spend brake, a circling detector and
no restart storm, and its property is that the process exits (ralph measurably accumulates and compacts,
RU:199, RU:462-463). `/loop` is session-only with a seven-day expiry — the right day-1-to-12 dry run, not the
loop; Routines cannot read the local state model in Stage 0; Managed Agents are hosted. `decide(defs, state,
now, cursor)` returning the ranked eligible set (Dagster's `evaluate_automation_conditions` shape) prints the
ranking into the record and survives a crash between decide and write. launchd **drops** an overlapping
firing (`man 5 launchd.plist`) and throttles `KeepAlive` to one spawn per 10 s — a better sentence than
OS:1312's unsourced circuit breaker; supervisord's `startsecs`/`startretries`/`FATAL` is the sentinel's
missing contract. Dispatch: the Agent path's measured claims read as measurements of its unreliability
(`c-mcp-grant-binds-through-agent-dispatch`: ARRIVES contradicted at 0.6), so `claude -p` for makers follows
the measurements; keep Agent/Workflow for the oracle and the QA gate, where the failure mode is a wrong
verdict, not a wrong act — its blocker, whether a launchd `claude -p` can invoke a Workflow (M7), is in landing
2's probe list and **no landing consumes the answer**. Whether Agent may also do in-move fan-out is §8. Where:
§01, §06, §11, Stage 0. Cost: small. Confidence: high. Endorsed: both.

**2.10 Fix the hook by parsing, not by "reading `tool_input`."** OS:1121's wish is already true
(`pre-tool-use.sh:229-247` parses the JSON) and does not help: every rule is `grep -qE` over the flattened
string (`:285`+). mvdan/sh (`sh-syntax` on npm) or tree-sitter-bash, matching resolved command words, resolves
`( npx … )`, `$(printf …)` and a `grep` whose argument contains `curl`. Roo-Code's four CVEs are all in-process
string parsers. Where: §09. Cost: low. Confidence: high. Endorsed: fable-2.

**2.11 Sign the verdict; write the exposure row before the act; narrow refusal 5 to model-authored
fields; give "no caller" a detector.** in-toto statement over the existing diff hash, signed keylessly via
gitsign (<https://github.com/sigstore/gitsign>) — forging then needs the OIDC identity, not repo-write
(OS:1136). Write-ahead register row (FLY:510-511): a crash between post and record leaves *attempted*, not
nothing. Cost of delay from exogenous clocks — a competitor's ship date, a domain expiry — carries provenance
no model writes; refuse only model-authored value/effort (OS:2709; Reinertsen ch. 2, 5). `knip --production`
on base and head is the preventive half of OS:1479, the spec's "most consequential wish"; the minimal design's
*has a reader, on a schedule, in the same commit* (MI:26-28) is the narrower rule. Where: §01, §03, §09, §12.
Cost: low. Confidence: high. Endorsed: fable-2.

**2.12 Rung 1 as a machine cold-read; retirement by self-test; every limit paired with a reading; cadences on
counts.** Rung 1 `resolver: human` (OS:1013) → a fresh `claude -p` with no project context asked "what is this
offering?", matched deterministically to `taste.yml`'s `one_line` (RU:516-520) — removes one founder
appointment from the base-rate-zero axis. `self_test:` as a command on every pack, hand, step, resolver and
renderer; a failing self-test marks it unavailable tonight before disuse retires it (the `parseCiSteps`
regression class). `check-observability.mjs`: every ceiling in a policy file names a reading whose latency is
shorter than the interval it governs, or does not compile (OS:1621 done once, generalised). The Friday audit
fires when a warrant's exercise count changes; the reckoning when N findings accumulate — "no dates below
Stage 0" (OS:2495) applied to Map 6. Where: §08, §12, §13, Map 6. Cost: small. Confidence: high (rung 1:
medium). Endorsed: both.

---

## 3 · IMPROVE — keep, but make stronger

| # | what | where | why (evidence) | cost | endorsed |
|---|---|---|---|---|---|
| 3.1 | **Landing 2's probe list gains** `--tools` absence under launchd · `--restricted` + `--settings` hook loading · grandchild re-exec + auth under the armed sandbox · `WatchPaths` · `osascript` from `gui/501` · `--json-schema` acceptance · `git push --dry-run` via the keychain · `dns.lookup` from the compiled argv | OS:2515 | the cheapest measurements in the document and they decide the seam (1.1, 1.2) | S | both |
| 3.2 | **Pre-registration per exposure**: `PREREG {rung_intended, threshold, uninformative_band, horizon_days, analysis (a command), stopping_rule}` minted at stage time; `sweep` applies only that analysis | OS:2514 once by hand; OS:1009 WISH; OS:2739 | removes the degrees of freedom a register-optimising machine would use | S–M | both |
| 3.3 | **Little's law on the queue**: `open_cards_max`; at the cap a card-emitting dispatch blocks; balcony prints λ, μ (fused ≠ served), W | OS:1216-1220 drains by expiry; OS:1901 caps interruptions not cards | fusing is abandonment, not service: 40 cards emitted, 38 fused, reads healthy | S | both |
| 3.4 | **Position limits on open exposures**: `open_exposures_max`, `unresolved_max`; the tap refuses a new exposure while N are past `check_on` | OS:1541-1545 rates are per act; OS:685 fails the build after the fact | a desk is limited by inventory held, not trades per day | S | both |
| 3.5 | **Findings disposition**: a P2 on a staged artifact carries `fixed \| accepted(reason) \| waived_until` before the tap; `findings_declined: [{id, reason}]` on the return (CR:648-653) | OS:950-956 no disposition; OS:772 return schema | every other object is forced to a disposition; findings alone may lapse, and a silently dropped P1 is undetectable | S | both |
| 3.6 | **Common-cause branch in `select.js`**; across lanes, every lane failing on one finding in one night stops the tick | OS:975-977; OS:2350 measures output diversity, not failure independence | correlated failure has no concept anywhere in the spec | S–M | both |
| 3.7 | **Quarantine delay on foreign leaves**: `quarantine_until = arrival + T`; `next.mjs` may not return it before then | OS:763 (the stated hole); OS:1119-1120 | a temporal defence closes the fast case of the taint hole even on an unmediated path | S | both |
| 3.8 | **Self/non-self by presentation**: every artifact carries a provenance manifest of its inputs; one presenting nothing is tainted | OS:762-764 | inverts the default the spec already inverts for probes and resolvers (MHC presentation) | M | fable-2 |
| 3.9 | **Model canary battery** on any change in pinned id, returned model fields, `prompt.mjs` bytes or the ORIENT builder; a drop marks the model unavailable | OS:1321-1323 records the model — a label, not a control | silent model drift has no answer | M | both |
| 3.10 | **MEL / degraded modes** `policy/mel.yml`: per component which pack families and rungs stay dispatchable while it is inoperative, with a repair deadline | OS:476, OS:496-499 (unhealthy server → a balcony row; the loop keeps dispatching) | provider outage has zero occurrences | M | both |
| 3.11 | **Backup, tested restore, retention per store; a restore drill as a suite step** (fresh clone, `~/.agentvibe` denied, regenerate `HANDOVER.md`, `npm run check`, tick one mission) | `grep -ci backup` → 0; OS:656; OS:2225 "no forward test" | the company is files on one Mac; "never deleted" collides with erasure duties the moment a person is in `people.yml` | S | both |
| 3.12 | **`assumptions.yml`**: WWHTBT (OS:2720-2739) as rows with `reading:` commands, printed by `monthly.mjs`, with the observation lag beside every count-based constant (3 sightings, 3× by hand, N consecutive, 90 days close loops with 30–45 days of dead time) | OS:2720-2739 has no owner; OS:1433 `reading:` exists | the best analytical artifact in the document, made live; a controller acting on a 3-count observed 90 days later oscillates (Åström & Murray ch. 9-10) | S | both |
| 3.13 | **Ballots, not verdicts**; strict majority with NaN in the denominator; no majority → `unscored`; a fail-closed model-family predicate | OS:972-974; `.qa/verdicts/*.json` | a 2-of-3 PASS where the dissenter found the bug is byte-identical to 3-of-3 today; panels saturate at 2–3 judges (arXiv:2605.29800) | S | both |
| 3.14 | **Segregation of duties**: the pack that produced an artifact may not resolve its outcome; `sweep`'s `--add-dir` excludes the producing worktree; trust reads no worker-authored field | OS:361, OS:2326; OS:748-751 (`tried:` is worker-authored) | the review half is right; the outcome half is unnamed | S | both |
| 3.15 | **Canary decisions in the queue — measure the founder**: a known-bad row on a random schedule; when the catch rate falls under a floor the queue shrinks; plus the founder's retention curve over `balcony.open` rows with a churn threshold whose response is *shrink*, never notify more | OS:2462; OS:1258 | Anthropic's 1,053-user study: 97% approved, 13.6% of injected dangerous commands caught, block rate 17% → 5% after 50 prompts — at six rows a day that is day 8 | M | both |
| 3.16 | **Type every state entry** world-fact (names its re-derivation command, stale on a clock) vs machine-opinion; inbound provenance quarantined | OS:695 `BOARD.md` rewritten whole | crash-only reloads a false note faithfully every tick; append-only memory scores below no memory under reversal (arXiv:2608.07429) | M | both |
| 3.17 | **`retry_if:` implemented**: `git log --since=<ts> -- <file>` against a threshold | OS:587, OS:598-599 (a predicate nothing evaluates) | one line; projectmem's `staleness.py` shape | S | both |
| 3.18 | **Settling window on limits** (`changed_on` per key; a second change inside the window refused) · **management of change** (a dispatch whose `pack.mjs`/`prompt.mjs`/`oracle.mjs` changed in the last N hours runs in shadow) · **`shadow_until`** on new suite steps · **consumables at tick step 0** (disk, window reserve, credential expiry, `~/.agentvibe` writable; an erroring check refuses) | OS:237-238, OS:1898; Stage 0 promotes ~30 checks to blocking on landing; OS:1078 | two principles with one mechanism; the repo's own shadow-first practice as a schema field; a full volume looks like a quiet night | S | both |
| 3.19 | **An objects clause and a held-out register for the mouth**; a **challenge-response time-out** for tier F (WHO checklist); a **non-punitive near-miss stream** never joined to the trust key (ASRS) | OS:1996; OS:441, OS:515; OS:344-345 | apparent authority attaches to surfaces (Restatement §2.03); tier F has no procedure; every report path is adversarial to the reporter | S | fable-2 |
| 3.20 | **Make N legible and graded**: print the rule-of-three bound beside `promotion_n` (0/3 → 63%, 0/10 → 26%, 0/20 → 15%); an EPA level-4 between morning and standing (act, then land as a *review* row); probation with a reversal resetting the class; re-validation at the audit | Map 5, Map 6 | ten Cate 2013; the spec goes from by-hand to unattended across one edge | S | fable-2 |
| 3.21 | **HAZOP guide words generate falsifiers** (NO/MORE/LESS/REVERSE/OTHER THAN/AS WELL AS/EARLY/LATE over `end_state` and every hand); a **LOPA table** per hazard naming layers and independence; a **diversity checker** before judging and `filled: 0` as not-a-success (CR:663-672, CR:430-431) | OS:227; OS:1049-1063; OS:2350 | `falsifier:` inherits the author's blind spot; two layers terminating at one shell are one-and-a-fraction; `diversity_floor` has no checker | M | fable-2 |
| 3.22 | **Anti-windup on `TASTE.md`**; **approve as debt** in `monthly.mjs`; **error budget on nights** (`night_slo`; venture zero takes the window only while the budget is burnt); **restore typed eviction** (two entries archived 2026-09-02 "to make room", `DECISIONS.md:195`, `:205`) | OS:1194-1198; OS:238, OS:1646; §05 | a pure integrator with no leak; approve should be scarce by construction; a static share is a WISH; the 2026-08-26 rule's stated non-criterion | S | both |

---

## 4 · RETHINK — assumptions the founder and the CEO should reconsider

**4.1 "Physics, not policy" inverts the stack.** The argv is the top layer — the binary reading its own flags;
the OS sandbox is beneath it and the spec concedes it is "a guardrail against accident, not containment"
(OS:1138); managed settings are the only tier a child cannot clear. State it in that order: *a tool absent from
the argv is never registered, so there is no call site; the sandbox survives if that assumption fails; the one
tier no process can argue with is a file the founder writes outside the repository.* Name the residual the
mouth does not close — branch steering (NOVA, arXiv:2601.09923): an injected artifact cannot make the mouth do
an unwarranted thing, but can steer *which* warranted thing is chosen; `artifact_sha256` is the answer.
Endorsed: both.

**4.2 Three centres, not one, and each moves on a countable moment.** "The register is the centre" (OS:189-191)
is the centre of *evidence* and is empty for at least a year — §02 concedes "single-digit exposures" — and it
records *what* the world did, never *why*. The *state* centre in year one is `MISSIONS.yml` and `tick.mjs`;
the *scarce-resource* centre is the founder's queue of six rows, for at least a year. Say so; design the queue
as the centre it is (3.3, 3.15, 2.3); add a verbatim store for *why* (5.4); and add the one mechanism no
outside party would let you skip — **reconciliation** against the world's own record (5.1), the structural
answer to the machine optimising the register, which the spec fears (OS:2734) and has no answer to. Goodhart's
other face: exposure count is optimisable by shipping many small reversible things. Whether the thesis
*sentence* changes or is annotated is §8. Endorsed: both.

**4.3 Venture zero eats year one again, and the spec's own diagnosis applies to the spec.** 174 session files
about the harness; Stage 0 is fourteen landings, forty-plus artifacts, thirty-one test files, and the second
real exposure on day 20–30 (OS:2514-2527). The minimal design's budget — *"five state files and six mechanisms
… nothing else without a triggered reopen"* (MI:57-58, MI:77) — was not refused, it was omitted, and its throughput
falsifier (>10 stageable artifacts a week and the outbound wrapper becomes forced work, MI:1157-1159) went
with it; three of four designs' falsifiers test the founder and the one that tested the machine's rate against
the founder's capacity was dropped. Economics (fable-2's lane, ESTIMATE): Stage 0 ≈ $3–5k list and ~19.5
founder-hours; eight of fourteen landings are bold founder acts whose hours are the same on the hand-first
path, which is strictly cheaper in model spend. **Alternative:** Stage 0 is three things — the demand test by
hand (landing 1), a hundred-line loop (mini-SWE-agent scores 65% on SWE-bench Verified in 100 lines), and
`tap.mjs` (2.5) — the founder *is* the loop for week one, the tick mechanises what the hand did three times
(the spec's own hand rule, OS:508, applied to the loop), and every other landing gates on *one real mission
has run through it*. The spec's best sentence already says this: *"mission 2 is real … or the machine has only
tested itself"* (OS:1706). Endorsed: both.

**4.4 v2 diagnoses a truth machine and builds a safety machine.** Nine of twenty-two territories and four of
six maps are authority, control, attention and refusal; §13 says "money in is a declared gap" (OS:1564) and
defers `OFFER.yml` to the first dollar; no territory is the offer or the customer; the board's own verdict on
itself was "eight decisions about control and one about creativity" and the founder's instruction "the frame
is the system spec, full" produced a fuller spec of the same imbalance. **Alternative:** territories 23 (the
offer — an intake artifact beside the three at OS:1651, because "free" is a priced offer and the price is the
only artifact with a rung-4 resolver specified) and 24 (the customer — what a person *said*); and commission
the producing voices the board page itself names as the fix. Endorsed: fable-2.

**4.5 This founder's revealed channel is a rendered page, and year one refuses it.** Three dense HTML
artifacts consumed in one session (the territory census, the board with a vote widget, the picture with eight
choices), each with click handlers and local state; a 108-file / 66 MB visual reference library the founder
built unasked (`/Users/adamks/VibeCoding/beeond/docs/design-brain/`, verified); eleven mockups judged by eye
with a structural verdict; "pick one of three" rejected and replaced; decisions bound through
`AskUserQuestion` (OS:2795). **In one sentence: opens dense visual pages unprompted, judges by eye against a
library of their own, corrects the shape of what is shown rather than picking, commits through a prompt pushed
into their hands.** Against it: "Terminal only" (OS:1261), and REFUSES 12 (OS:2716) refuses "a web UI" for
"seven views, one acts, an Inbox empty on every project" — every clause naming mission-control, a server. **The
refusal was written against a stateful app and is enforced against a file format.** The gallery — in the CEO's
sealed definition of the company (`docs/03-system-design/vision/2026-09-02-ceo-position.md:9`, `:29`) — is dropped to a circular trigger (OS:1279)
while `SHELF · +14` renders fourteen artifacts as an integer. Decision 5 and REFUSES 12 were both taken without
the founder's actual reading channel on the table. **Alternative:** 2.4. Endorsed: fable-2.

**4.6 The founder not looking is the normal path, not the failure branch.** Every autonomous-company
experiment in the record failed at the human's *attention*, not the machine's capability: 97% approval rates,
catch rates decaying by day 8, a $5,000 goal met at $510. Design for absence (2.3), bound the queue (3.3),
measure the reviewer (3.15), and treat a looking founder as the upside case. A fatal branch is a plan to be
surprised. Endorsed: both.

**4.7 Harness as product or scaffolding — the dropped founder item decides half the document.** Founder
action item 7 (BD:510) is gone; `bin/fleet-install.mjs` (1,053 lines) already installs the harness into
another project; `HANDOVER.md` is generated from the store map (OS:2180-2185); Phase 8b's undischarged exit
gate is the harness's own rung-0 done-test as a product. Decision 4 says "a later question"; the repo has
answered it in code. **Alternative:** name the trigger — mission 2 published by hand *and* one outsider asks
how it works. Endorsed: both.

**4.8 "Nothing is deleted to meet a cap" is an epistemic rule wearing a legal costume.** Right for decisions
and claims; wrong for people. The first real person in `people.yml`, and the owned address at landing 14,
bring erasure and data-protection duties that an append-only never-expiring store (OS:644, OS:656, OS:2288)
cannot meet; §19 pushes the entity outside every process (OS:2008) and §18's `regulatory` kind (OS:1934) has no
dates. **Alternative:** a retention column on Map 2, a deletion *program* in the `evict-memory.mjs` shape, and
one dated row per known duty in `OBLIGATIONS.yml` from the first subscriber. Endorsed: both.

**4.9 Refusal 8 is right, and the evidence is stronger than the spec claims.** A constant "Pick me!" scores
86.5% on AlpacaEval 2.0 (arXiv:2410.07137); JudgeBench's strongest judge is 64% on objective correctness
(2410.12784); a production gate flagged 0 of 100 rounds where humans confirmed 23 defects (2606.10315);
Project Vend 2's supervising CEO agent authorised eight times as often as it denied. Keep *no judge resolves a
done-test* forever and cite this. Whether *no summed score over counters* also stays absolute is 1.13 / §8.
Endorsed: both (the judge half).

**4.10 Four smaller reversals.** Decision 5 ("balcony-only, Claude-native") is contradicted by `osascript`,
plists and a Shortcut (OS:774, OS:1336, OS:1266) while Routines, desktop scheduled tasks (a Manual-mode task
"stalls until you approve it" — a founder gate) and the `Notification` hook's `agent_needs_input` matcher with
Remote Control push now exist — re-decide with the docs in hand. Do not set `promotion_n` "with that class's
by-hand count in front of them" (OS:2822) — set it blind or accept it is a rationalisation. "The founder never
reads the Book" (OS:559) applies to this document. A second family as judge is not a second supplier (OS:1322):
one supplier for 100% of production is a single-vendor exposure invisible because the vendor is the substrate.
Endorsed: fable-2 (fable-1 on Decision 5's native channel).

---

## 5 · ADD — beyond what anyone in the building said

| # | what | lands in | mechanism / falsifier | cost | endorsed |
|---|---|---|---|---|---|
| 5.1 | **Reconciliation** `scripts/reconcile.mjs`: diff `EXPOSURES.yml` / `WARRANTS.jsonl` / `SAID.jsonl` against the world's record (git host, Stripe events, analytics page list, mail sent log, platform post list); breaks `only_ours \| only_theirs \| mismatch`; an unaged break past 7 days fails the build | §08 §13 §19 | the one mechanism a customer, regulator, tax authority, platform and insurer would all ask for first; today every number the founder reads is a projection of the company's own log | M | both |
| 5.2 | **Hazard register** `policy/hazards.yml`: one bowtie per top event (money leaves · a stranger is contacted · a false assertion · a credential leaks · runaway · personal data exposed), each layer naming `implemented_by:` and `independent_of:`; two layers sharing a file, process or argv cannot both be credited | §09 | the residual eight are prose (OS:1134-1138); for *money leaves*, argv absence and `usd_per_day: null` share one failure mode | M | both |
| 5.3 | **Game days** `scripts/gameday.mjs`: a closed scenario enum, monthly, in a sacrificial worktree — SIGKILL mid-move, corrupt the last `events.jsonl` line, empty model stdout, expired credential, full volume, deleted `tick.lock`, injection payload to the relay, unreachable oracle; each declares its expected terminal value | §11 §09 | crash-only recovery is asserted, never induced (OS:1306-1308) | M | both |
| 5.4 | **`VOICE.jsonl`** — one sourced customer sentence per row, joined to the exposure that provoked it; the next rung-1 done-test is written in that language with the quote as the claim's source; `check-donetests.mjs` fails a rung-1 test with no phrase traceable to a row, `none` counted | §04 §08 | done-tests today are the founder's guess twice (OS:2345); the register cannot hear a customer | S | fable-2 |
| 5.5 | **Ultra vires**: `pack_id` + `grant_hash` on every staged row; the tap/mouth recomputes the grant at exercise and refuses on change; narrowing or retiring a pack invalidates its pending artifacts | §16 §03 | the warrant binds bytes (OS:1812), not authority; demotion (OS:344) says nothing about work already staged | S | both |
| 5.6 | **The two-challenge rule**: `steer.mjs` refuses a redirect that contradicts a `TASTE.md` NO-GO, a standing refusal, a live obligation or a `NEVER-SAY` pattern, writing a challenge row; two challenges on one subject → a card that cannot fuse | §01 §06 | redirect is unconditional (OS:1239); the only mechanism that protects the company from the founder, and there is none | S | both |
| 5.7 | **Nomination ledger**: the machine's sealed call on *every* founder-clearable row before the founder answers, scored by Brier; a class where accuracy saturates is a measured candidate for Map 6's "remove whole classes of decision" | §10 §16 | clause (b) of the three-count rule (OS:2436) today accrues only for acts the machine already stages; falsifier: after 50 rows it does not beat "always predict the reversible default" | S | fable-2 |
| 5.8 | **Revealed-versus-declared taste**: monthly, re-derive a taste file from the exposures actually made and diff it against `TASTE.md`; the diff is a balcony row | §04 §12 §19 | drift, not a bad tweet, is the largest unattended risk; the only anti-drift control is a Friday audit reading counts | S | fable-2 |
| 5.9 | **Falsifier-first dispatch** (`intent.kind: falsify` runs the cheapest killer before any build leaf; `killed` writes a venture dead-end; `tick.mjs` refuses a build leaf when `falsifier.cost_usd < cost_estimate` and the falsify leaf has no terminal value) and **M&M on shortfall** (every exposure whose realised rung < `rung_intended` enters a 14-day queue with the Mechanism enum) | §01 §14 §12 | `falsifier:` is required (OS:227) and never executed; post-mortems trigger on failure, not on shortfall with perfect process | S | both |
| 5.10 | **Standing red team against the register**: one read-only pack, monthly, brief *the cheapest way to make `monthly.mjs`'s numbers improve without the company being better*; and **a standing adversarial twin** whose only objective is to make staged and live surfaces produce something embarrassing, false or exposed — decorrelated by *objective* rather than model family, measurable as overlap with the judge's findings | §12 §08 §09 | the third leg of the anti-Goodhart set with 5.1 and 3.2; supplies the near-miss stream and HAZOP deviations per artifact; SPECULATION that objective-decorrelation substitutes for family-decorrelation (the accepted risk to 2026-11-17) | S | both |
| 5.11 | **`reach: buys-evidence`**: money that buys a fact — a report, a corpus, a panel — bounded by its price, landing read-only in the `orient` argv; a fourth reach value with its own meter, refuse-while-null; trigger: three `evidence_of_demand` claims `unresolved` in a quarter | §13 §09 | the reach enum (OS:1067) lacks it; refusal 2 refuses it with distribution spend; a machine at this size cannot afford *not* to buy answers | M | fable-2 |
| 5.12 | **The offer as a varied artifact before the first dollar**; **the founder's taste corpus wired** (108 curated reference files in beeond's `references/founder-brain/`, per-founder, with no home under Decision 9; the founder vision's rubric-extraction door FDR:639-645 — references feed an extraction, the founder approves the rubric, the maker never sees the references) | §13 §04 §05 | `OFFER.yml` waits for the first dollar so the first price is never tested; the largest taste asset this founder has is unwired | M | fable-2 |
| 5.13 | **Thompson sampling over `outcomes.jsonl`** for window allocation, clamped by floors and ceilings, seeded and reproducible | §01 §13 | refusal 5 bars ranking over *declared* fields; world-resolved outcomes have no field a model fills; self-damps as posteriors tighten — the actual answer to "the loudest venture wins" (OS:237) | M | both (medium) |
| 5.14 | **A forecast book**: sealed forecasts on "will this done-test resolve rung ≥ 2 by `check_on`", resolved by `claim-world`, never a judge; Brier over resolved rows, `undefined` at zero; **parallel exposure** for reversible near-free artifacts (the world as selector; refused unless `reach_ceiling` supports the rung and the power calculation returns non-`unresolved`) | §01 §08 §15 | the only number the company can honestly score is one whose scorer is outside the building; picking one candidate throws away the only selector whose verdict counts | M | fable-2 |
| 5.15 | **Recusal**: a harness mission may not author a diff changing venture zero's share · **`SO_PEERCRED`** on the minter↔mouth socket · **publication-time jitter** and a rule that the register and ladder are never public · **sender infrastructure as claims** (SPF/DKIM/DMARC, warm-up, ToS and rate limits with `valid_until`, complaint rate as a `STANDING.yml` instrument) | §14 §16 §19 §15 | the conflict is named (OS:1646-1649) and answered with a share the harness can propose; a bearer token can be logged, peer creds cannot; a 03:14 signature advertises to a competitor; zero occurrences of sender reputation | S | both |
| 5.16 | **`CUSTODY.yml`** — assets against theft, not misuse: every credential, where it lives, who can rotate it, its recovery path, no secrets; **dated entity obligations from the first subscriber**; **consent-scoped audience grants** across ventures; **the machine's own reputation account** (quarantines a machine-caused loss, makes a machine-earned gain portable; the mouth refuses a machine artifact onto a `human_only` account) | new; §18 §19; §15 §18; §19 | §09's threat model is the machine doing something bad, never the Mac stolen or the Stripe account taken; one process holds every outbound credential (OS:451-452) with no rotation or recovery named; `made_by:` is proposed, not decided, and unbackfillable | S | fable-2 |
| 5.17 | **Doorbell from the vendor**: `Notification` hook matcher `agent_needs_input` + Remote Control push (Decision 5's native channel; forwarded dialogs expire at 5 min so the overnight queue is still built) · **`--json-schema`** for the return contract · **OTel export** as the events superset (task id as trace id; Links for variation siblings) · **Cedar `check_implies`** to prove pack ⊑ engine when packs exceed a handful | §06 §07 §10 §02 | the return contract is validated in application code today; OTel already attributes `cost_usd` per agent/skill/server | S–M | both |
| 5.18 | **Intake generator** with `drafted_by:` and an edit-distance meter (OS:1718's own trigger has no mechanism) · **a per-state observability/controllability matrix** generated from the store map (every state × who can read it × who can change it) · **cold-reader panel** of sealed `[Read]`-only readers answering fixed questions before rung 1 | §14 §05 §09 §08 | "accepted verbatim" becomes a counted event; would have surfaced the WISH rows as a class (taint is neither observable nor controllable) | S | fable-2 |

---

## 6 · OPTIONS — forks the spec closed without stating the alternative

| # | fork | the spec took | the alternative, and when it is right | lean |
|---|---|---|---|---|
| 6.1 | Bash for makers | full Bash (OS:388, OS:2257) | none / whitelisted under `dontAsk` (2.2) | fable-1 none; fable-2 whitelisted for `web-feature` |
| 6.2 | where the deny set lives | project settings + hook | managed settings + `--restricted` (2.1) | both, managed is the floor |
| 6.3 | the worker primitive | `claude -p` per move, never `Agent` (OS:323, OS:377) | `--agents` JSON packs on the measured `Agent` path for fan-out; Agent SDK `query()` with `canUseTool`, `maxBudgetUsd`, `outputFormat`, `forkSession` | `-p` for the move; Agent for the gate (both); Agent for in-move fan-out is §8 |
| 6.4 | who pays for the night | the founder's subscription window, roped at 0.6 (OS:1600) | `ANTHROPIC_API_KEY` in the job env; `--max-budget-usd` per move (2.6) | API key |
| 6.5 | the warrant's crypto | HMAC chain (OS:1814) | Biscuit Ed25519 (2.8); UCAN for spawn-tree delegation; RFC 9396 `authorization_details` as the non-payment shape | Biscuit |
| 6.6 | the loop's host process | a tick that exits every 300 s (OS:1336) | a supervisor around a pure `decide()` (2.9); DBOS-shaped recovery of PENDING work | tick + `decide()`, interval 240 |
| 6.7 | the second family | one `gemini -p` run from the harness (OS:1018) | inspect_ai as a separate Python process — the blocker is credential/egress policy, not reachability; Anthropic does not support routing Claude Code to non-Claude models through any gateway | inspect_ai when the panel exists |
| 6.8 | the always-on host | a box, deferred (choice 6) | Routines (cloud, 1 h minimum, `/fire` endpoint = the relay, per-environment allowlist; cannot read local state) · Managed Agents (resumable `budget_reached`; hosted, no local files) | measure Routines at Stage 5 when state moves; refuse Managed Agents in writing |
| 6.9 | the first pack | `web-feature` (OS:388) | `content-copy` — cheapest artifact, fastest rung-1 reading (CO:258-260); Stage 0's exit criterion is a rung-1 reading | content-copy, or say why not |
| 6.10 | rung 1 | `resolver: human` at every scale (OS:967, OS:1013) | a deterministic stranger test (RU:516-520) | machine cold-read |
| 6.11 | Stage 1 | a fatal fork (OS:2557) | a runtime mode (2.3) | mode |
| 6.12 | the year-one surface | terminal only (OS:1261) | a harness-written `BRIEFING.html` with the shelf, no server (2.4) | the page, with the terminal as control |
| 6.13 | `dead-ends/` | per venture (OS:565, OS:2287) | global and never expiring (CO:398, CO:441) — negative knowledge now dies with the venture, contradicting "a dead venture still pays" (OS:1660) | global |
| 6.14 | preference pairs' reader | judge calibration **and MAKE** (OS:2289) | judge only (CO:645-648) — with no judge in year one, MAKE is the only live reader, which inverts the constraint | judge only |
| 6.15 | the machine's question | one a day, required (OS:2469) | three (FDR:663) · none — "an open question in the morning queue is a defect" (MAC:499-503) | say which vision won and why |
| 6.16 | prompt budget | one 4,096-byte total (OS:883) | six per-surface budgets (CO:504-511) | per-surface |
| 6.17 | personas | markdown, no argv (OS:363) | packs with `[Read, Grep, Glob]` and a cost cap (RU:537-542) | packs |
| 6.18 | scores | none, ever (OS:2712) | calibrated counters with a denominator floor (1.13) | §8 |
| 6.19 | taint | boundary stamp, enumerable half (OS:790) | presentation manifests (3.8); quarantine delay (3.7) | both mechanisms |
| 6.20 | verdict binding | hash-bound (OS:1136) | in-toto + gitsign (2.11) | sign |
| 6.21 | trust | `(pack × field)` (OS:340) | T6 "reach only, no trust" — in the catalogue, not recorded as Stage 2's counterfactual; `(pack × field × model)` | add the model id; record T6 |
| 6.22 | the lock | `openSync 'wx'` stale at 30 min (OS:787) | a lease renewed by the move; stale > `timeout_s` + margin | lease |
| 6.23 | exposure record | after the act (OS:1238) | write-ahead (FLY:510-511) | write-ahead |
| 6.24 | the rope's meter | output tokens over 5 h, account-wide (OS:1575) | per-actor rows; or an API key, the one meter that is a bill | API key |

---

## 7 · FROM THE WORLD — concretely

**Shipped products (read 2026-09-02).** Routines: cloud, three trigger kinds (schedule ≥ 1 h, `/fire` with a
bearer token, GitHub events), `claude/` branches, per-environment network allowlist, the fired `text` wrapped
as untrusted (§06's taint stamp, shipped), *"no permission-mode picker and no approval prompts"*, everything
"appears as you". Managed Agents: a per-session `budget` that pauses at `budget_reached` and resumes when
raised — EC1 done better than EC1. Codex Smart Approvals put a *model* in the refusal path, which the spec
refuses by construction, correctly. Jules: recurring tasks, tiered concurrency. Devin: automation queue depth.
Four vendor schedulers, none fits the night: `/loop` needs an open session and expires in 7 days; Desktop
tasks need the GUI; Routines have no local files; Managed Agents are hosted. **None governs an act that leaves
the machine.** The scheduler, the sandbox, the spend cap and the approval queue are buyable; the mouth is not.
Sandboxing is GA with the network model the spec wants — build nothing there. `--bare` "will become the default
for `-p`". Auto memory ships the spec's two-tier index shape independently.

**The catalogue, corrected.** `open-source.md` — 177 repositories — is cited by **zero** `grafted_from` lines;
thirty of 134 concept ids are never cited, and the gap has a shape: every producing mechanism (C11 reverse
brainstorming, C12 TRIZ, C14 precedent mining, C15 taste transfer — the missing mechanism behind WWHTBT #8) is
unused while nine of twelve judging entries are cited. beads (the catalogue's #1) moved its source of truth to
embedded Dolt; `.beads/issues.jsonl` is "not the source of truth or a backup" — "reviewable in a PR" is gone.
humanlayer is self-declared deprecated; Daytona gutted; Letta a landing page; Roo-Code archived (its four CVEs
are all in-process string parsers). `ruvnet/claude-flow` (70k★) is absent from the survey and carries the
nearest prior art to the tasks/events/outcomes split. OpenHands has no entry and is the closest thing to
`reach:` tiering, with risk annotated *on the call*. Plandex ships the autonomy matrix the spec collapses into
one `reach:` value (`can-exec` ≠ `auto-exec` ≠ `auto-apply`). **Nobody in agent-land has shipped a fuse** (0 of
7 approval systems); the workflow world has had timer boundary events for twenty years, and n8n #25311 — a
HITL gate that "continues down either the approved or declined path randomly" — is the spec's typing rule
written before the bug.

**Repos, one thing each.** Temporal — **Updates** with validators (a rejected update writes no history) as the
shape of `STEER.md`'s reader. Aider — `--watch-files` as the cheapest second inbound channel. OPA — decision
logs, the opposite of the refused registry. LangGraph — the checkpointer/Store split *is* Map 2's four physics;
fork-from-checkpoint for post-mortems. ralph-loop-agent — `allResults` visible to the verifier is the
anti-circling primitive; `stopWhen` composes a cost stop the spec lacks. sandbox-runtime — the SOCKS5 leg plus
seccomp unix-socket block answers `check:mc`'s denied loopback bind; `allowLocalBinding` exists (PR #127), so
SANDBOX.md's exclusion rationale is falsified — measure. Inngest — `step.waitForEvent` is a durable
`blocking-human` gate, and it is the declared stack default with a one-line catalogue row. Dagster —
`evaluate_automation_conditions` is `decide()`. inspect_ai — `majority_score`/`at_least(k)` ship ballots.
projectmem — `staleness.py` is `retry_if:`. Closing the spec's own WISHes: knip · mvdan/sh, tree-sitter-bash ·
in-toto, gitsign · Biscuit, UCAN, SPIFFE · CaMeL (taint as a tag on a value, design only) · Dolt · supervisord ·
OpenTelemetry · Cedar.

**Machines running a business, measured.** Project Vend 1 was robbed through inbound chat alone; Vend 2:
forced procedure helped, a supervising model hurt (8:1 authorise:deny). Vending-Bench: meltdown uncorrelated
with context fill; a single unrechecked world-belief is the trigger. AI Village: ~300 emails, most with
fabricated claims, caught only by humans reading 109,000 chain-of-thought summaries; a hallucinated contact
list propagated to every agent by sycophancy. Sakana's scientist edited its own timeout. TheAgentCompany's
headline failure — premature "done" — is the one refusal 8 catches. Graded against fourteen observed failure
modes: **five CATCH/PARTIAL, nine MISS**, clustering on liveness-by-tokens (2.7), state-file provenance (3.16),
reviewer degradation (3.15), single-source belief propagation (3.6), between-run variance, and multi-party
deception.

**Fields.** TPS poka-yoke and the andon cord (2.5) · finance reconciliation, position limits, maker-checker
(5.1, 3.4) · aviation MEL, the two-challenge rule, currency and recency (3.10, 5.6, 1.12), ASRS non-punitive
reporting (3.19) · process safety LOPA, HAZOP, management of change, bow-ties (3.21, 3.18, 5.2) · clinical M&M,
triage, EPA supervision levels, NEWS2 calibration, the WHO time-out (5.9, 2.4, 3.20, 1.13, 3.19) · control
theory's settling window, observability pairing, anti-windup, delay margin (3.18, 2.12, 3.22, 3.12) · queueing
and Little's law (3.3) · experimental pre-registration (3.2) · immunology's incubation delay and MHC
presentation (3.7, 3.8) · law's ultra vires, apparent authority, limitation periods, the springing power (5.5,
3.19, 3.5) · reliability's canary, bathtub and error budget (3.9, 2.12, 3.22) · military ROE as absence modes
(2.3) · intelligence's standing devil's advocate (5.10) · Reinertsen's cost of delay from exogenous clocks
(2.11) · Kelly-constrained allocation (5.13).

---

## 8 · DISAGREEMENTS — both positions, stated fairly

**8.1 Is the length the problem?** fable-1's verdict says "wrong altitude": 2,826 lines for one pack, one
venture, WIP 1, is venture zero at work. fable-2: the length is not the defect — the founder asked for the
full-scale spec ("the frame is the system spec, full"), a full-scale spec with a three-item Stage 0 is exactly
right, and the defects are Stage 0's size, greenfield written in the present tense, and unearned `MEASURED`
labels. **Both agree** on the alternative (4.3); the disagreement is what to call the disease.

**8.2 Agent for in-move fan-out.** fable-1 (R4, medium): a pack compiles to both an argv and an `--agents`
entry; `-p` for the move, the measured Agent path for variation fan-out; D13's precondition (a) becomes
satisfiable. fable-2: fan-out at the *tick* (the harness spawns N `-p` variants under one grant, OS:350-351)
keeps the star; fan-out *inside* the move via Agent is a worker spawning workers — exactly OS:781's org-chart
worry — and the Agent path's ARRIVES binding is contradicted at confidence 0.6. Agent only where a verdict
binds (2.9). fable-1, on reading this: concedes the org-chart point for in-move fan-out — the tick spawning N
`-p` variants under one grant is the same fan-out with no edge — and holds only that `--agents` JSON is the
right *form* for personas-as-packs (1.11) and for the gate, where it carries `tools`/`maxTurns` on the
measured path. **Resolved for makers; open only for the gate's form.**

**8.3 API billing versus Decision 8's intent.** fable-1 (C6): an API key fulfils "never competes with the
founder" better than a fraction of an undefined window; $74–558/month. fable-2: agrees on the mechanism and
the collision with `usd_per_day: null`, but the cost estimate diverges by an order of magnitude — $0.9–1.2 a
move on this repo's ~60k-token base context, calibrated from the measured haiku probe, so $1,300–1,700/month at
48 moves/night — which makes the API key affordable only at 5–10 moves a night or after the prompt and
CLAUDE.md are cut. **Both ESTIMATE; the founder should run ten moves and read `total_cost_usd`.**

**8.4 Bash for makers.** fable-1: none in year one for `web-feature`; the harness runs build, oracle and
screenshot. fable-2: a `web-feature` pack that cannot run `npm run check` mid-move learns of a failing build
one tick later through `BOARD.md`, which is crash-only-consistent but slow; whitelisted
`Bash(npm run check:*)` under `dontAsk` from day one, none for content packs. **Open; both prefer either to
full Bash.**

**8.5 Refusal 8's second half.** fable-1 (4.9) wanted "no summed or averaged score" kept absolute; fable-2
(1.13) noted the spec builds one — `trust(pack, field)` — and would narrow the rule to *no score whose inputs
are model judgements, none without calibration and a denominator floor*. The board's own D7 settles it: its
text is *"No score summed or averaged from judge outputs"* (BD:257), and OS:2712 broadened that to *any*
summed score at assembly. **Resolved: restore D7's scope.** The judge half stays absolute forever with 4.9's
evidence; counters over world outcomes may be summed with a denominator floor and `undefined` at zero, which
is what `trust` already is. Nothing the board decided is narrowed; something the assembly added is removed.

**8.6 The thesis sentence.** fable-1 (R2): say in the thesis that the operating centre for at least a year is
the founder's queue. fable-2: keep the thesis sentence — it is about full scale and it is right — and add one
sentence naming three centres (state, scarce resource, evidence) and the countable moment each moves. **A
difference about a word; both agree on 4.2.**

**8.7 The read-only breach.** Both reviewers' sourcer lanes appended claims. fable-1's findings file at first
said both ledger files had been restored with `git checkout --`. That sentence was written before the act and
was wrong: fable-1 never ran the command, fable-2 ran it and the blocking hook refused it, and `git status` at
sign-off shows both files modified (+176 / +122). fable-1 has corrected the file and records the error here as
the defect class this repo names — a claim ahead of its evidence. The restore is the CEO's; the report records
both breaches (§9). **Resolved.**

---

## 9 · WHAT WE RAN

**fable-1's lanes (six).** census (Explore) — 37 of 153 paths exist, 10 inaccuracies, `--strict-mcp-config`
and `--bare` labels have no record, both probes in-session · argv (opus) — twelve `-p` probes reading
`system/init`: `--allowedTools` restricts nothing, `--tools` does, `--strict-mcp-config` alone → 0 MCP,
`--setting-sources ""`/`--bare` → 0 hooks, default `-p` is `auto` and holds Task, max-turns → `error_max_turns`
with no `result` · other fields (opus) — 30 mechanisms · open source (opus) — beads → Dolt, nobody ships a
fuse, Biscuit, liveness by world-effect, 14 failure modes graded · drift (opus) — 25 drops, 18 narrowings, 17
dissents graded, D13 violated, `select.js` all-P1 branch gone · economics (sourcer) — no per-window quota
published, API key wins in `-p`, Sonnet 5 $2/$10, Batch unreachable — **and it appended five claims to the
ledger** (`c-anthropic-api-key-wins-in-print-mode`, `c-bare-mode-never-reads-oauth`,
`c-sonnet-5-api-price-2-in-10-out`, `c-batch-api-half-price-both-directions`,
`c-managed-agents-session-runtime-rate`) · adversarial audit of fable-1's file (opus, cut off by the session
limit) — seven citation corrections, all applied to both files: the `--help` quote was the docs page's;
`.proposed` is tracked, not uncommitted; six two-writer rows; two line pins; the session count demoted; D10's
deleted justification; and the `-p` inbox socket that `--tools` does not remove.

**fable-2's lanes (eleven).** repo reality (Explore) — 15 spec/repo mismatches, `RETAIN_HOURS = 6` · CC
facts (sourcer) — 13 doc questions; **appended three claims** (`c-cli-max-budget-usd-print-mode`,
`c-routines-run-on-anthropic-cloud`, `c-bare-deny-rule-removes-tool-from-context`) · the world (opus) —
`open-source.md` cited zero times, humanlayer dead, beads on Dolt, ten WISH-closing projects, Routines/Managed
Agents/Codex/Jules/Devin · provenance (opus) — 4 of 17 dissents dropped silently, 15 lost ideas, 16 internal
contradictions, 19 stores absent from Map 2, §0 unlabelled, minimal's throughput falsifier lost · context
(Explore) — unrecorded `MEASURED` labels, the beeond misread, 5 unsourced census quotes, the design-lens
finding stale · fields (opus) — 12 mechanisms; the keychain, PATH and no-network-key measurements; NEWS2;
the false fork; currency, EPA level 4, rule of three · ADD (opus) — 15 additions, 5 territories, 5 stops, a bill
of rights · verifier (sonnet) — 148 of 150 spec citations exact, 8 defects fixed, 9 measurements re-run · F
economics (opus) — no plan limit, rope undefined, output tokens 11% of cost, one move ≈ $0.9–1.2, a night
$14–105, the founder's day trips the brakes, Stage 0 ≈ $3–5k and ~19.5 founder-hours, `PL.md` prints list · G
loop shapes (opus) — the tick is the right shape, `StartInterval 300` = cache TTL, `/loop` session-only,
Routines cannot read local state, OS:87's "8 runs" is 3, run-in + fork on acts, hybrid dispatch, M7 consumed
by nothing · H the founder's morning (opus) — revealed preference is rendered pages judged against a
108-file library; OS:53 → OS:1268 subject shift; REFUSES 12 written against mission-control; the gallery is the
largest loss; `BRIEFING.html` + shelf.

**Measurements run by the reviewers themselves (2026-09-02).** `claude --help` flag inventory (v2.1.258:
`--tools`, `--restricted`, `--bare`, `--setting-sources`, `--max-budget-usd`, `--strict-mcp-config`,
`--permission-mode` present) · `~/.claude/settings.json` `permissionMode: auto` · `.claude/settings.json`
sandbox keys `enabled, failIfUnavailable, filesystem`, no `network`; hooks `SessionStart, PreToolUse` ·
`.claude/settings.json.proposed` keys and hooks · `git config credential.helper` → `osxkeychain`, origin
HTTPS · PATH binaries · `node fetch example.com` → `ENOTFOUND` in-session · `wc -c .claude/skills/routers/*.md`
(1,539 / 2,477–5,310 / 25,743) · 24 spec-named paths (11 absent) · `design.js` `total` at `:49,55,111` ·
`grep -c budget-guard settings.json` → 0 · `.mcp.json` servers `playwright, claim-append` · 174 sessions, 173
dated · `pre-tool-use.sh` structure (`:229-247`, `:285`, `:342`) · `usage.js:40` · `.claude/lenses.yml` (line 180 at the session branch's version of the file) ·
`grep -c STATUS.md STARTUP-OS.md` → 0 · `grep -o "expansion/…"` → one hit · beeond `docs/design-brain/` 108
files, 66 MB, untracked · `check-figures.mjs` 57, `probe-agent-tool-inheritance.mjs` 383,
`produce-verdict.mjs` 1,084, `judges.js` 421, `fleet-install.mjs` 1,053, `consume-dispatch.ts` 685, `stop.sh`
139, `gsa-context-monitor.js` 182 lines · frame:135, `hands.md:536`, OS:53/87/1268/1336 by `sed` · every grep
in fable-1's F5–F8 and R3 · `git status` / `git diff --stat` on the two ledger files. **The hook blocked two
of fable-2's read-only commands**: `git checkout -- <file>` (by design) and a `for` loop containing the word
`curl` as data (the substring defect, 1.1).

**The breach, in full.** Both reviewers dispatched the `sourcer` engine, which holds `mcpServers:
[claim-append]`, with a brief forbidding tools that act on the world; both lanes read the claim ledger as
not-the-world and appended — eight claims in total — to `docs/03-system-design/SOURCED-CLAIMS.md` (+176 lines)
and `.claude/ledger/index.json` (+122). fable-2 ran `git checkout --` on both; `pre-tool-use.sh` blocked it by
design and fable-2 did not work around the hook. fable-1 never ran it, and an early draft of fable-1's file
claimed the restore anyway — a claim ahead of its evidence, since corrected; `git status` at sign-off shows
both files still modified. The claims are sourced and resolved `pass`; the defect is that reviewers wrote
them. **Recommended:** the CEO restores both, or keeps them knowingly. Lesson, the spec's own: a grant narrow
enough to name is still a write, and "does not act on the world" was the wrong predicate for a read-only review
— any sourcer dispatched by a reviewer must be told explicitly not to call `claim-append`.

**Not run, and why.** No `gh` (denyRead on `~/.config/gh`). No `claude -p` under launchd (needs the founder's
say-so per landing 2). No `gemini` (the founder's Google quota). Nothing published, sent, posted or deployed.
