# Research close — Lane M (measurements that spawn nothing): R34, R35, R22, R37, R41

*Lane M was dispatched 2026-09-07 on the five §N questions answerable by measuring this machine without
spawning a child process. Engine: `reviewer` (has Bash). **This file is the lane's own return, copied
verbatim from `scratchpad/returns/research-M.md`.** Nothing is summarised or re-worded; dispositions
are in DECISIONS.md §29.*

*Two of the five findings overturn something the plan currently records as settled — R37 falsifies the
"zero episodes of an hour or more" reading that §I row 15 rests on, and R35 is a refutation of its own
named source. The lane refused four acts, each named in its scope notes with its owner.*

*Single model family, one pass. Not an independent panel.*

---

# Lane M · measurements that spawn nothing · R34, R35, R22, R37, R41
Measured on this Mac (Adams-MacBook-Air, Darwin 25.5.0), 2026-09-07, 09:39–10:30 +0300.
Nothing installed, nothing authenticated, nothing spent, nothing published, no file written outside the scratchpad.
Blocks are in id order: R22, R34, R35, R37, R41.

Every command below assumes:
`S=/private/tmp/claude-501/-Users-adamks-VibeCoding-agentvibe--worktrees-ceo-1-1788609834/96cbec96-76b1-41f4-94ba-3f945fbe54c8/scratchpad`
The helper scripts (`gen.mjs`, `page3.mjs`, `r34b.py`, `r34c.py`, `r35.py`, `r37.py`, `r37b.py`) and the
synthetic logs are in `$S/laneM/` and survive this session.

---

### R22 · What does page 3 cost to render at a year of rows, and where is the knee?

STATUS:   ANSWERED (the knee), PARTIAL (not measured against the real server — see RESIDUE)

FINDING:  **Page 3's arithmetic costs 0.98 µs per row under Bun and 1.10 µs under Node, and the 1-second knee
sits at ~1.06 million rows.** In time that is **7.7 years at this Mac's `events.jsonl` emission rate (377
rows/day) and 8 months at its model-call rate (4,287 rows/day)** — so O40 is a later migration under one
reading of the log and a day-one shape under the other, and **the design has not fixed which rate page 3's log
carries.** That undecided rate, not the timing, is what decides O40. One year at the events rate renders in
**110 ms**; one year at the model-call rate renders in **1,495 ms**. O40's own shape — one month's partition at
the model-call rate, 130,396 rows — renders in **102 ms**, 14.6x cheaper than the year.

EVIDENCE:
This Mac's two emission rates, both derived, not quoted:
```
$ python3 -c "...min/max ts over ~/.agentvibe/events.jsonl..."
events.jsonl: 3825 rows over 10.15 days = 376.8 rows/day -> 137522 rows/year
transcript model-call rate: 180053 priced assistant records over 42 calendar days
                          = 4287.0/day -> 1564746 rows/year
```
Fixture: `$S/laneM/gen.mjs` synthesises rows in page 3's declared substrate — `gen_ai.*` attribute names, an id
on every row (§D page 3) — with token magnitudes sampled from 20,000 **real** usage records out of
`~/.claude/projects`, so row bytes and cache ratios are this machine's, not invented.
Render: `$S/laneM/page3.mjs` computes page 3's stated arithmetic — spend and tokens per run, per agent, per
venture; cache hit rate; the rolling five-hour **and** the weekly window — priced by §9.6's table.
```
$ for f in 137522 500000 1564746 3000000; do bun  $S/laneM/page3.mjs $S/laneM/log_$f.jsonl 3; done
$ for f in 137522 500000 1564746 3000000; do node $S/laneM/page3.mjs $S/laneM/log_$f.jsonl 3; done
```
Median of 3 reps, warm page cache:

| rows | file MiB | bun 1.3.10 ms | node 24.11.1 ms | µs/row (bun) |
|---|---|---|---|---|
| 137,522  (1 yr @ events rate)     | 47.5   | 110.1   | 128.5   | 0.801 |
| 500,000                           | 172.9  | 422.9   | 518.1   | 0.846 |
| 1,564,746 (1 yr @ model-call rate)| 542.0  | 1,495.3 | 1,657.8 | 0.956 |
| 3,000,000                         | 1,040.7| 2,894.4 | 3,273.5 | 0.965 |
| 130,396 (O40: ONE MONTH @ model-call rate) | 45.0 | 102.1 | — | 0.783 |

Linear fit and the crossings (`numpy.polyfit`):
```
bun 1.3.10     ms = 0.000979 x rows - 42.5   (0.979 us/row)
    100 ms crossed at   145,588 rows = 1.06 yr @377/day |  0.09 yr @4287/day
    250 ms crossed at   298,812 rows = 2.17 yr @377/day |  0.19 yr @4287/day
   1000 ms crossed at 1,064,933 rows = 7.74 yr @377/day |  0.68 yr @4287/day
node 24.11.1   ms = 0.001098 x rows - 33.6   (1.098 us/row)
   1000 ms crossed at   941,309 rows = 6.84 yr @377/day |  0.60 yr @4287/day
```
Correctness cross-check: both runtimes returned byte-identical aggregates at every size — at 3M rows
`spend_usd 496724.01`, `cache_hit 0.9439`, `distinct_runs 428572`. The two independent engines agreeing is
what lets the timing be read as timing.
Scaling is mildly **super**linear (0.80 → 0.97 µs/row): the per-run map grows to 428,572 entries at 3M rows.
`/usr/bin/time -l` returned no rusage block under this shell, so peak RSS is unmeasured; the map cardinality
above is the measured memory driver.

CONFIDENCE: high for the arithmetic and the fit (measured, two runtimes, three reps). Medium for the absolute
knee — these are **warm-cache** reads of files written minutes earlier, so every figure is a **floor**; a cold
read of 542 MiB adds disk I/O this cell did not pay.

DECIDES:  **O40** (`DEPENDS-ON-R22`) — "rotate the log into a file per period with a rebuildable rollup; no
surface reads the raw file." The answer is conditional and the condition is nameable: **fix page 3's row rate
first.** If page 3's log emits at the `events.jsonl` rate, rotation is a later migration with seven years of
head-room. If it emits one row per model call, the 1-second budget is crossed inside the first year and
rotation is day one — and §16.1a's own warning applies, that a later migration touches the one store the plan
says is never edited.

RESIDUE: Not measured against the real server. `mission-control/node_modules` does not exist and installing is
refused by this brief; Bun 1.3.10 is installed and is the server's own runtime, so the arithmetic was measured
on the right engine but not through Hono, SSE and the React client. Smallest next act: `cd mission-control &&
bun install`, then time the page-3 route end to end — that adds HTTP, serialisation and paint to the 110 ms /
1,495 ms floors above. Second residue, and it is the one that matters: **write down which rate the log emits
at.** Nothing in §D, §16.1a or O40 says whether a row is a run, a step, or a model call, and the answer moves
the knee by 11x.

---

### R34 · The founder's measured decision throughput — whiches and AskUserQuestion rounds answered per day

STATUS:   ANSWERED

FINDING:  **The founder answers 3.09 AskUserQuestion rounds per active day (median 2.5, p90 6, max 8) and 8.68
questions per active day (median 6.5, p90 17, max 24)** — 68 answered rounds carrying 191 answered questions
across 22 active days in a 41-day span. Measured directly against O96's own predicate, **the peak in any
rolling five-hour window is 7 rounds and 16 questions.** O96's seed of *six per five-hour window* is therefore
**about right if a "which" is one AskUserQuestion round** (it would have refused once in 41 days) and **2.7x too
small if a "which" is one question** — and O96 does not say which unit it means. That ambiguity, not the
number, is the finding. A second fact worth as much: **the founder rejects 81% of the rounds put to them** (291
of 359), so throughput is not the binding constraint — relevance is.

EVIDENCE:
```
$ grep -rl 'AskUserQuestion' ~/.claude/projects --include='*.jsonl' | wc -l
     436                       # of 3,037 session files, 982 MiB
$ python3 $S/laneM/r34b.py $S/laneM/auq_files.txt
ASKUSERQUESTION rounds: 359  (questions inside: 670)
  tool_result recorded : 359
  ANSWERED             : 68
  result, not an answer: 291     # "The user doesn't want to proceed with this tool use. The tool use was rejected"
  no result (abandoned):   0
  asked from a sidechain:  0
ANSWERED ROUNDS 68 over 22 active UTC days; first 2026-07-28 last 2026-09-06; calendar span 41 days
ROUNDS per ACTIVE day : mean 3.09  median 2.5  p90 6.0  min 1  max 8
ROUNDS per CALENDAR day over the span: 1.66
QUESTIONS per ACTIVE day: mean 8.68  median 6.5  p90 17.0  max 24
QUESTIONS per CALENDAR day: 4.66
TIME TO ANSWER (s): n=68 median 217  p90 921  max 59204
ExitPlanMode tool_uses: 39 ; results recorded: 39 ; approved: 35
approved plans per active day: mean 1.75 over 20 days
$ python3 $S/laneM/r34c.py $S/laneM/auq_files.txt
PEAK ROUNDS in any rolling 5-hour window (41-day corpus): 7  starting 2026-08-11 10:57:40 UTC
PEAK QUESTIONS in any rolling 5-hour window:              16 starting 2026-09-05 16:02:44 UTC
window occupancy in ROUNDS at each answered which: median 2.0 p90 4.0 max 7
last 14 days: 36 answered rounds, 112 questions, over 10 distinct days
  peak rounds/5h last 14 days: 4 ; peak questions/5h last 14 days: 16
```
Method: two passes. Pass 1 collects every `tool_use` named `AskUserQuestion` with its question count and
timestamp; pass 2 matches `tool_result` by `tool_use_id` and classifies on the runtime's own literal, `"The
user answered"`. A one-pass filter on the string `AskUserQuestion` **misses every result** — the result record
does not carry the tool name — and returned a false zero on the first run. Recorded because anyone re-running
this will hit it.
The corpus is the founder's own transcripts. Only counts and timings were carried out of it; no question or
answer text appears in this return.

CONFIDENCE: high — a full census of the corpus, not a sample, with the answered/rejected split taken from the
runtime's own result string rather than inferred.

DECIDES:  **O96**'s seed ("no which opens past `decisions_per_window × intent.horizon`; six per five-hour
window until R34") and with it **v87**'s which budget. Two consequences. (1) **Name the unit.** At rounds the
seed is well calibrated; at questions it under-counts by 2.7x, and the Desk would refuse whiches the founder
demonstrably answers. (2) **The 81% rejection rate is the number O96 should be tuned against, not the answer
rate.** A budget that limits how many whiches *open* is aimed at the wrong end: the founder is not running out
of capacity to answer, they are declining four of five as not worth answering. `cost_to_answer_bytes` and
`recommendation_shown:` — already in O96 — are the fields that would test that, and neither is measured yet.

RESIDUE: "Which-shaped exchanges" beyond `AskUserQuestion` and `ExitPlanMode` are uncounted — a decision put in
prose and answered in prose leaves no tool record, and this corpus cannot see it. Smallest next act: label 30
random founder turns by hand for *was this a decision?* — which is exactly R27(b)'s one sitting, already
scheduled, so it costs nothing extra.

---

### R35 · Cumulative shadow USD of unattended work on this seat against the seat price, today

STATUS:   ANSWERED, and the answer is that **the named source cannot produce it**

FINDING:  **`~/.agentvibe/events.jsonl` carries no price inputs at all** — no model, no token counts, no cost
field — so it cannot be priced by §9.6, today or ever, in its current schema. The one numeric field that looks
like a gauge, `window_output`, is the **constant 5000 on all 1,422 records that carry it**: a fixture value, not
a measurement. Read strictly, O116's first line is therefore **$0.00 ÷ $100 = 0.0x**, because **zero unattended
runs have ever happened.** The number O116 will eventually print does exist, in `~/.claude/projects`: **180,053
priced model calls, $27,069.46 at §9.6 list price over 42 calendar days**, which is **$19,619/month = 196x the
$100 seat price the plan carries.** The two nearest proxies for *unattended*: subagent (sidechain) work
**$15,971.68, 115.8x the seat**, and local night hours 00:00–06:59 **$4,591.55, 33.3x the seat**.

EVIDENCE:
The named source, and what it does not contain:
```
$ wc -l ~/.agentvibe/events.jsonl
    3843
$ python3 ...  # census of every top-level key across all 3,843 rows
kinds: claim.would_block 2392 · budget.allowed_safelisted 948 · budget.block 474 ·
       claim.append 14 · mcp.call 5 · claim.append_refused 4 · war_room_kill 3 · ...
top-level keys: artifact at body_sha256 by claim code decision detail details dry_run enforcement event
                file host id kind mode reason resolver rule safelist scope server stall_output status
                tier tool ts url window_output
fields matching token|cost|usd|model|price: ['stall_output', 'window_output']
window_output: min 5000 max 5000          # constant across all 1422 records
ts span: 2026-08-26 08:25:07 -> 2026-09-05 12:04:00 = 10.15 days
```
The corpus that does carry it, priced by §9.6's table (base in/out, cache read, cache write 5m/1h per model,
with `ephemeral_1h`/`ephemeral_5m` read from each record so the write rate is the right one):
```
$ python3 $S/laneM/r35.py $S/laneM/r35.json
files walked: 3037   priced assistant records: 180053
TOTAL SHADOW USD AT §9.6 LIST PRICE: $27069.46
tokens: in 4,153,548  cache_read 30,507,205,992  cache_write_5m 1,271,575,753
        cache_write_1h 307,740,577  out 120,065,147
by model:  claude-opus-5 $19865.43 · claude-fable-5-1 $4823.27 · claude-sonnet-5 $2358.76
           · claude-haiku-4-5-20251001 $22.00
UNPRICED (retired ids, no §9.6 row): claude-sonnet-4-6, claude-opus-4-8, claude-opus-4-7, claude-fable-5
           — 7.79M output tokens against 120.07M priced = 6.1% of output unpriced
main $11097.78 (41.0%) · sidechain $15971.68 (59.0%)
span 2026-07-28 -> 2026-09-07 : 42 calendar days, 37 active days
NIGHT (local 00:00-06:59) $4591.55 = 17.0%
```
Against the seat price, and **the seat price is taken from the plan, not the web** — FINAL-PLAN-v2.md line 4182
and SPINE.md line 536 both record the pricing page rendering *"From $100 per month"* for both Max tiers, with
*"The Max 20x price is UNVERIFIED"*:
```
                            total      $/cal-day    $/30.44-day month   ratio to the $100 seat
all recorded work        $27,069.46     $644.51        $19,618.91             196.2 x
sidechain (subagent)     $15,971.68     $380.28        $11,575.67             115.8 x
night 00:00-06:59 local   $4,591.55     $109.32         $3,327.78              33.3 x
LAST 14 DAYS  all                                      $30,973.28             309.7 x
LAST 14 DAYS  sidechain                                $19,164.30             191.6 x
LAST 14 DAYS  night                                     $3,858.39              38.6 x
```
Cache reads are the whole story, exactly as §9.6 says: 30.5 **billion** cache-read tokens against 4.2 million
uncached input tokens.

CONFIDENCE: high on the arithmetic and on the emptiness of `events.jsonl` (full census of both stores).
Medium on the ratio, for two stated reasons: the seat price is a *"From"* floor the plan itself marks
UNVERIFIED, so 196x is an upper bound on the multiple; and 6.1% of output tokens sit on retired model ids
§9.6 has no row for, so the $27,069 is itself a floor.

DECIDES:  **O116** ("the shadow subsidy line on the briefing from the first run: Σ shadow USD of unattended runs
at list price ÷ the seat price per month") and it triggers **§J 74**, whose `wins_if:` is *"O116's line exceeds
N× the seat price."* Three things follow. (1) **O116 cannot be sourced from `events.jsonl`** — the store named
in R35 and in §D page 3's "spine" row has no price columns; the `gen_ai.*` shape page 3 declares is what O116
needs and it is not what this file emits. (2) **§J 74's threshold is already crossed by two orders of
magnitude on attended work alone**, before a single unattended run: at list price this seat consumes ~196x its
monthly price. If N is any number below 100, the metered-API-key design wins on the day the line is first
printed. (3) The **strict** reading stays $0.00 and should be printed as such, with the attended figure beside
it — a subsidy line that silently prices attended work as unattended is the same defect class this repo keeps
finding.

RESIDUE: "Unattended" has no marker in either store. Sidechain (59%) is a proxy for *no founder in the turn
loop* but a subagent also runs while the founder watches; night hours (17%) is a proxy for *nobody awake* but
this founder demonstrably works past midnight — the hourly profile peaks at 17:00–18:00 and is still $1,178 at
00:00. Smallest next act, and it is free: **write `unattended: true` into the run record at dispatch.** O7's
provenance fields are the place; this is the "cheap now, unreconstructable later" case R11 already flags.

---

### R37 · The Mac's off-hours and longest gap over thirty days including a weekend away, as a floor

STATUS:   PARTIAL — **14.40 days measured of the 30 asked, and no weekend away in the window**

FINDING:  Over the longest power history this Mac retains today — **345.6 h, 14.40 days, 2026-08-23 21:06Z →
2026-09-07 06:40Z** — the machine was asleep **68.23 h (19.7%) across 633 episodes**, and **the longest single
gap is 6 h 41 min**: 2026-08-28 00:48:20Z → 07:28:56Z, cause `'Low Power Sleep'`, waking on AC at **1% charge**.
The battery ran flat. **This falsifies the standing claim that this Mac has "zero episodes of an hour or
more."** That claim is true of the seven-day `pmset -g log` window and false of the fourteen-day store, and
every prior reading — W33, R5, DECISIONS §19, census D — looked only at the seven-day window. **The
distribution is bimodal and that is the useful shape: one episode of 400.7 minutes, and the second-longest is
18.0 minutes.**

EVIDENCE:
`pmset -g log` today reproduces the old seven-day answer exactly, which is why the two readings must be shown
together:
```
$ pmset -g log > pmlog.txt ; python3 r37.py pmlog.txt
SPAN local: 2026-08-31 09:52:20 +0300 -> 2026-09-07 09:39:54 +0300   SPAN hours: 167.8
SLEEP events: 435  WAKE events: 436  paired episodes: 435
ASLEEP total: 43.57 h  (26.0% of span)
LONGEST episode: 17.9 min
episodes >= 1800s: 0        episodes >= 3600s: 0
```
The store reaches twice as far, and `pmset` does not show it:
```
$ ls /var/log/powermanagement          # 15 daily .asl files, 2026.08.24 ... 2026.09.07
$ syslog -d /var/log/powermanagement -T utc.3 -F '$((Time)(utc.3)) $Message' > asl.txt
$ python3 r37b.py asl.txt
SPAN UTC: 2026-08-23 21:06:32 -> 2026-09-07 06:40:21  = 345.6 h (14.40 days)
SLEEP 633  WAKE 633  paired 633
ASLEEP 68.23 h = 19.7% of span
LONGEST 2:
   400.7 min  2026-08-28 00:48:20 -> 2026-08-28 07:29:00 | 'Low Power Sleep':TCPKeepAlive=inactive
    18.0 min  2026-08-25 11:25:06 -> 2026-08-25 11:43:04 | 'Maintenance Sleep':TCPKeepAlive=active
episodes >= 30 min: 1   >= 60 min: 1   >= 120 min: 1
LOG-COVERAGE gaps >= 30 min: 2
   400.6 min  2026-08-28 00:48:21 -> 2026-08-28 07:28:56 UTC   # the same episode, seen as silence
    31.1 min  2026-09-04 16:05:22 -> 2026-09-04 16:36:27 UTC
sleep causes over 14.4 days:
  Maintenance Sleep 482 · Sleep Service Back to Sleep 115 · Clamshell Sleep 34
  · Notification Wake Back to Sleep 1 · Low Power Sleep 1
```
The episode itself, raw, and the wake line is what names the cause:
```
2026-08-28 00:48:20.355Z Entering Sleep state due to 'Low Power Sleep':TCPKeepAlive=inactive
2026-08-28 00:48:20.392Z [System: No Assertions]
2026-08-28 07:28:56.544Z [System: No Assertions]
2026-08-28 07:28:57.159Z Warning level: 1 time: -1 cap: 1
2026-08-28 07:28:57.204Z Summary- [System: No Assertions] Using AC(Charge: 1)
```
Per-day asleep hours (UTC), with the two weekends the window does cover:
```
08-24 Mon 4.66 · 08-25 Tue 6.40 · 08-26 Wed 0 · 08-27 Thu 0 · 08-28 Fri 6.68
08-29 Sat 0 · 08-30 Sun 0.66 · 08-31 Mon 8.23 · 09-01 Tue 5.20 · 09-02 Wed 6.69
09-03 Thu 1.34 · 09-04 Fri 7.24 · 09-05 Sat 9.50 · 09-06 Sun 6.12 · 09-07 Mon 5.52
```
Both weekends are ordinary working weekends — 08-29 carries 4,597 log lines and zero sleep episodes; 09-05/06
carry 4,254 and 4,538 lines. Timestamps were normalised to UTC through each line's own offset so a timezone
shift cannot manufacture a gap.

CONFIDENCE: high for the 14.40-day window (full parse of the retained store, sleep/wake pairing cross-checked
against log-coverage silence — the 400.6-minute silence and the 400.7-minute episode are the same event seen
two independent ways). Low for extrapolating to thirty days: one flat battery in fourteen days is n=1.

DECIDES:  **§I row 15** on a month, **§I 18 / §J 73**'s `wins_if:`, and it moves **v84 · O81 · W33**. The
correction that matters: **the night on this Mac is not bounded by an eighteen-minute maintenance sleep. It is
bounded by the battery.** `night_capable` built only from `pmset -g custom` and assertions would have returned
true through the whole of 2026-08-28 00:48–07:29, the exact window an unattended night occupies, while the
machine was dark. **The predicate must read AC and charge, not only sleep settings and assertions.** W33's
surviving finding — *"zero episodes of an hour or more"* — should now read *"zero episodes of an hour or more
while on AC; one of 6 h 41 min on a flat battery in fourteen days."*

RESIDUE: Sixteen of the thirty days are unmeasurable today — **the ASL store rotates at about fifteen days**, so
the missing history is already gone and no amount of reading recovers it. R37 cannot be closed by reading; it
needs collection to start. Smallest next act, and it is O82's standing intent reduced to its minimum: **copy
`/var/log/powermanagement/*.asl` into a durable directory once a day for thirty days**, then re-run the parse
above. This lane refused to start it — it persists beyond the session and writes outside the scratchpad. Whose
act: the founder, or O82 once `bin/watch` exists. The weekend away is not schedulable and must simply be
waited for.

---

### R41 · Does a held `caffeinate -i` assertion satisfy `night_capable`, and does it survive a lid close?

STATUS:   PARTIAL — visibility ANSWERED; the lid close answered for `-i` and for `-s` on battery, BLOCKED for
`-s` on AC

FINDING:  **The assertion is visible in a form the predicate can read, but neither half of `pmset -g
assertions` is sufficient alone, and that is the finding.** The per-process listing names it exactly —
`pid <N>(caffeinate): ... PreventUserIdleSystemSleep named: "caffeinate command-line tool"` — and appears
within 2 s and disappears on exit. But **the system-wide counter cannot discriminate**: at baseline, with no
caffeinate running, `PreventUserIdleSystemSleep` already read **1**, held by `coreaudiod` and by `powerd`'s
*"Prevent sleep while display is on"*. And **the per-process listing cannot either**: on battery, `caffeinate
-s` was **listed per-process while the system-wide `PreventSystemSleep` stayed 0** — the assertion existed and
did not bind. **`night_capable` must read both**: the per-process line to know the assertion is ours, and the
system-wide counter to know it binds. On the lid: `caffeinate -i` is documented as **idle** sleep only, and
clamshell sleep is not idle sleep; measured, **two Clamshell Sleeps occurred inside a held `PreventSystemSleep`
window**, both on battery, which is consistent with the documented AC-only restriction and does not settle the
AC case. **No AC lid close inside a held window exists in the retained log**, so that one cell is unmeasured.

EVIDENCE:
Baseline, before any caffeinate — the counter is already 1:
```
$ pmset -g assertions
2026-09-07 09:42:44 +0300
Assertion status system-wide:
   PreventUserIdleSystemSleep     1
   PreventSystemSleep             0
Listed by owning process:
   pid 417(coreaudiod): ... PreventUserIdleSystemSleep named: "com.apple.audio.BuiltInMicrophoneDevice.context.preventuseridlesleep"
   pid 346(powerd):     ... PreventUserIdleSystemSleep named: "Powerd - Prevent sleep while display is on"
$ pmset -g custom        # confirms W33
Battery Power: sleep 1 ... AC Power: sleep 1
```
Held in the foreground, `-i`, and read while held:
```
$ caffeinate -i -t 12 & sleep 2; pmset -g assertions | grep -A2 -i caffeinate
   pid 16802(caffeinate): [0x000238a4000183f5] 00:00:02 PreventUserIdleSystemSleep named: "caffeinate command-line tool"
	Details: caffeinate asserting for 12 secs
	Localized=THE CAFFEINATE TOOL IS PREVENTING SLEEP.
	Timeout will fire in 10 secs Action=TimeoutActionRelease
$ # after it exits:
$ pmset -g assertions | grep -ci caffeinate
0
```
The discriminating cell — `-s` on battery, listed but not binding:
```
$ pmset -g batt
Now drawing from 'Battery Power'   -InternalBattery-0  87%; discharging
$ caffeinate -s -t 10 & sleep 2; pmset -g assertions
   PreventSystemSleep             0                       <-- system-wide: does NOT bind
   pid 28886(caffeinate): [...] PreventSystemSleep named: "caffeinate command-line tool"   <-- but IS listed
```
The vendor's own sentences, quoted verbatim from `man caffeinate` (CAFFEINATE(8), Darwin, 2012-11-09), read on
this machine 2026-09-07:
> `-i      Create an assertion to prevent the system from idle sleeping.`
> `-s      Create an assertion to prevent the system from sleeping. This assertion is valid only when system is running on AC power.`

The man page names **no** flag that speaks to the lid.
The lid-close half, measured against the retained log rather than argued:
```
$ python3 ...  # reconstruct caffeinate assertion intervals from Created/ClientDied/TimedOut pairs
PreventSystemSleep(caffeinate) windows in the 7-day pmset log:
  pid 46786  2026-09-01 12:55:54 -> 15:51:57  (176.1 min)
  pid 32919  2026-09-02 13:19:08 -> 18:58:56  (339.8 min)
CLAMSHELL inside a held PreventSystemSleep window: 2026-09-02 13:51:10  source=BATT  pid=32919
CLAMSHELL inside a held PreventSystemSleep window: 2026-09-02 15:26:07  source=BATT  pid=32919
clamshell sleeps by source (7d): {'AC': 5, 'BATT': 21}
```
raw:
```
2026-09-02 13:51:10 +0300 Sleep  Entering Sleep state due to 'Clamshell Sleep':TCPKeepAlive=active Using Batt (Charge:65%)
2026-09-02 15:26:02 +0300 Assertions  PID 32919(caffeinate) Summary PreventSystemSleep "caffeinate command-line tool" 02:06:53
2026-09-02 15:26:07 +0300 Sleep  Entering Sleep state due to 'Clamshell Sleep':TCPKeepAlive=active Using Batt (Charge:44%)
```
None of the five AC clamshell sleeps fell inside a held window, so the AC case has no observation either way.

CONFIDENCE: high on visibility, on the baseline-counter collision and on the battery non-binding (all three
measured directly, minutes apart, with a clean before/after). High on `-i` versus the lid (the vendor's own
one-line definition plus the fact that clamshell sleep is a distinct cause in the log). Medium on `-s` versus
the lid on AC: unobserved, and the two observations that exist are both on battery where the documentation
already predicts the outcome.

DECIDES:  **O81's contract** and **§20.2 row 7**. Three consequences, and the middle one changes the founder's
act rather than confirming it. (1) **The predicate is buildable and its shape is now known** — read the
per-process listing for `caffeinate command-line tool` *and* the system-wide counter for the matching kind, and
treat listed-but-zero as **false**. A predicate reading either half alone is wrong in a different direction:
the counter alone says true whenever the display is on, the listing alone says true on battery where nothing
binds. (2) **A bounded `caffeinate -i` does NOT substitute for `pmset -a disablesleep 1`.** `-i` is idle-only,
`-s` is AC-only, and neither is documented to hold a lid close — so the founder's deferred machine-wide change
is not obviously replaceable by a per-night command, and §20.2 row 7 should not be closed as though it were.
(3) **R37's flat battery outranks both.** The 6 h 41 min `Low Power Sleep` at 1% charge is a state no assertion
of any kind prevents, so the smallest honest `night_capable` is **AC present AND charge above a floor AND the
assertion binding** — with the assertion the *last* of the three conditions, not the first.

RESIDUE: One cell, and it needs a hand: hold `caffeinate -s` **on AC**, close the lid, wait, reopen, and read
whether a `Clamshell Sleep` was logged inside the window. That is a physical act on the machine, so it is
**BLOCKED on the founder**, not on this lane. The same session should record `run.started` against the wake, as
§N R41 asks, which needs the night runner to exist. Second residue: whether a lid close is even the relevant
risk for an unattended night — the lid is presumably open on a desk — and if it is not, this whole half is
lower value than the AC-and-charge condition R37 surfaced.

---

## Summary

| id | status | one-line finding |
|---|---|---|
| **R22** | ANSWERED (knee) · PARTIAL (real server) | 0.98 µs/row under Bun; the 1-second knee is 1.06M rows = **7.7 yr at the events rate, 8 months at the model-call rate**; O40 turns on which rate the log emits at, and that is undecided |
| **R34** | ANSWERED | **3.09 answered rounds and 8.68 questions per active day**; peak in any 5-h window is **7 rounds / 16 questions**; O96's seed of six is right per round and 2.7x low per question — and **81% of rounds are rejected** |
| **R35** | ANSWERED (as a refutation) | `events.jsonl` has **no price inputs**, so O116 cannot be sourced from it; strict reading **$0.00 = 0x**; the real corpus prices at **$27,069 over 42 days = 196x the $100 seat**, sidechain 116x, night 33x |
| **R37** | PARTIAL (14.40 of 30 days) | Longest gap is **6 h 41 min on a flat battery**, 2026-08-28 — **"zero episodes of an hour or more" is false** beyond the 7-day `pmset` window; the store rotates at ~15 days so the rest must be collected, not read |
| **R41** | PARTIAL | The assertion **is** readable, but **neither half of `pmset -g assertions` suffices alone** — on battery `-s` is listed while the counter stays 0; `-i` is idle-only and no flag speaks to the lid; the AC lid close is **BLOCKED on a physical act** |

## Scope notes

**What I ran.** Read-only commands on this Mac: `pmset -g log`, `pmset -g custom`, `pmset -g assertions`,
`pmset -g batt`, `man caffeinate`, `syslog -d /var/log/powermanagement`, `caffeinate -i -t 12` and `caffeinate
-s -t 10` (both foreground, both self-expiring, both confirmed released), full read-only scans of
`~/.claude/projects` (3,037 files, 2.86 GB) and `~/.agentvibe/events.jsonl`, and four synthetic-log benchmarks
under Node 24.11.1 and Bun 1.3.10. Every file I wrote is under
`/private/tmp/claude-501/.../scratchpad/laneM/` and `.../scratchpad/returns/`. **No file in the repository was
read for its content beyond `SPINE.md` §M/§N and `FINAL-PLAN-v2.md` §9.6, §14.6, §16.1a, and no repository file
was edited.**

**What I refused to run, and why.** (a) **O82's standing collector** for R37 — it persists beyond the session
and writes outside the scratchpad; the brief forbids both, and the missing sixteen days are already rotated out
regardless. (b) **`cd mission-control && bun install`** for R22's "against the real server" — that is an
install. (c) **A lid close** for R41 — a physical act on the founder's machine. (d) **`pmset -a disablesleep
1`** or any other write to power policy — a machine-wide configuration change, and the exact one §20.2 row 7
records the founder as having deferred. Each is named in its own RESIDUE with the act and the actor.

**Two method notes that cost time and will cost it again.** `pmset -g log` shows roughly seven days while
`/var/log/powermanagement` retains roughly fifteen; reading only `pmset` is what produced the "zero episodes of
an hour or more" reading that R37 has now falsified. And an `AskUserQuestion` result record does not contain
the string `AskUserQuestion`, so a single-pass grep for the tool name finds every question and no answer, and
returns a confident zero.

**Single-family caveat.** Every measurement here was taken and interpreted by one agent on one model family
(Anthropic, Opus 5). Nothing in this lane was cross-checked by a second family, so it meets neither the
`risk: high` two-family predicate nor the `irreversible` 2-of-3 multi-judge requirement. The arithmetic in R22
is the one exception with an internal control: two independent JavaScript engines produced byte-identical
aggregates, which checks the computation but not the judgement built on it. The numbers are reproducible from
the commands above; the readings of what they *decide* are one agent's.
