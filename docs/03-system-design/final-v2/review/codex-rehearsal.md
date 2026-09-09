# The Codex headless rehearsal — measured 2026-09-07

Closes SPINE §I row 5 · settles **R26** · informs **R10**.
Binary: `codex-cli 0.153.4`, npm install at `~/.npm-global`, model `gpt-5.6-luna` (provider `openai`),
auth mode `chatgpt` (stored ChatGPT tokens; **no API key** — `stored API key false`).
No `codex login` was run. No key was supplied. Nothing was committed.

---

## 1 · The verdict in one line

**Yes — Codex is usable as a detached checker on this machine today: 20 of 20 invocations returned
exit 0 with a non-empty, correct-shaped answer on stdout, including fully detached with no controlling
terminal. #19945 did not reproduce once. The binding constraint is not the TTY, it is the Bash
sandbox: sandboxed, `codex exec` dies at exit 1 with 0 bytes before it reaches the network.**

---

## 2 · The four cells

Every cell ran the same five cases. All four ran **with the sandbox disabled**; the sandboxed cell is
recorded separately below it, because that failure is itself the measurement.

| Cell | How | exit | stdout bytes | stderr bytes | wall (s) | correct |
|---|---|---|---|---|---|---|
| **A** | `codex exec`, stdout→file, stdin inherited — **but there is no TTY to inherit** | 0 ×5 | 102 · 128 · 137 · 115 · 106 | 987 · 1061 · 1008 · 1176 · 1086 | 7.7 · 6.2 · 5.9 · 6.2 · 5.7 | **4 / 5** |
| **B** | detached — `start_new_session=True` (= `setsid(2)`), `stdin < /dev/null`, **no controlling terminal** | 0 ×5 | 125 · 114 · 138 · 123 · 127 | 1010 · 1047 · 1009 · 1184 · 1107 | 7.7 · 8.2 · 8.3 · 6.1 · 6.3 | **4 / 5** |
| **C** | `codex exec --json`, detached exactly as B | 0 ×5 | 445 · 461 · 440 · 450 · 444 | 39 ×5 | 6.3 · 6.7 · 5.8 · 6.4 · 6.0 | **4 / 5** |
| **D** | `script -q /dev/null codex exec …` — the issue's own documented cure | 0 ×5 | 1087 · 1141 · 1067 · 1305 · 1189 | 0 ×5 | 5.2 · 5.7 · 5.9 · 6.4 · 5.2 | **4 / 5** |
| **S** | **sandboxed** `codex exec`, case 1 only | **1** | **0** | **229** | 0.0 | — |

Columns are in case order 1 · 2 · 3 · 4 · 5.

**No cell returned exit 0 with zero bytes on stdout. #19945 did not reproduce, in any cell, on any case.**

### What each cell says

- **A is not the cell v32 describes, and could not be.** v32's day-one shape says *"inheriting the
  parent shell's TTY."* There is no TTY here: `tty` → `not a tty`, exit 1, and `codex doctor` agrees
  independently — `stdin is terminal false · stdout is terminal false · stderr is terminal false`,
  `color output disabled (stdout is not a terminal)`. So cell A as run is *"foreground, no TTY"*, and
  it passed. **The TTY clause of v32 is unmeasurable from inside an agent, which is exactly how a
  resolver runs.** It is not that the TTY was missing and Codex coped; it is that the TTY is
  structurally unavailable and Codex did not need one.
- **B is the load-bearing cell.** New session, no controlling terminal, stdin `/dev/null` — #19945's
  precise condition. Five for five, exit 0, 114–138 bytes of real answer.
- **C is the cell to build on.** Four well-formed JSONL events every time, identical shape across all
  five cases: `thread.started` → `turn.started` → `item.completed` → `turn.completed`. The verdict is
  at `item.completed.item.text`. stderr is 39 bytes — one line, `Reading additional input from
  stdin...` — and the banner that cell A puts on stderr is gone entirely.
- **D works and costs.** `script` gives Codex a pty, and the pty merges stderr into stdout: the stream
  is ~9× larger (1067–1305 bytes vs 102–137), carries the banner, the full echoed prompt, ANSI SGR
  escapes and CRLF line endings. It is the most expensive cell to parse and it buys nothing that B and
  C do not already have. runtimes.md's objection — the cure is *"incompatible with normal background /
  parallel job execution"* — is unchanged and now moot.
- **S is the finding nobody asked for.** Sandboxed, Codex never reaches the model:
  ```
  WARNING: proceeding, even though we could not create PATH aliases: Operation not permitted (os error 1)
  Error loading config.toml: Failed to read config file /Users/adamks/.codex/config.toml: Operation not permitted (os error 1)
  ```
  `~/.codex` is `denyRead`, so it dies reading its own config. Sandboxed `codex doctor` gets further
  and shows a **second, independent** blocker: `ChatGPT inference URL … TLS handshake or certificate
  validation failed (required)` — the egress proxy. Unsandboxed the same command is `19 ok · 0 fail`,
  `websocket connected (HTTP 101 Switching Protocols)`, `reachability … reachable (HTTP 405)`.
  **Two blockers, either sufficient.** Every one of the 20 working invocations required
  `dangerouslyDisableSandbox: true`.

**The two zero-byte signatures must never be conflated** — and this is a Rule 10 obligation, not a
nicety. `exit 0 + 0 bytes` is #19945. `exit 1 + 0 bytes` is the sandbox. A resolver that keys only on
"empty stdout" reports the same `unresolved` for a broken tool and a denied one.

---

## 3 · The five cases scored

Truth was fixed before the run. Three planted defects, two clean.

| # | Case | Truth | A | B | C | D |
|---|---|---|---|---|---|---|
| 1 | off-by-one: `i < values.length` → `i <= values.length` | DEFECT | ✓ | ✓ | ✓ | ✓ |
| 2 | `catch` swallows the write error, still returns `{ ok: true }` | DEFECT | ✓ | ✓ | ✓ | ✓ |
| 3 | `undefined` expiry guard deleted; `undefined < Date.now()` is `false` | DEFECT | ✓ | ✓ | ✓ | ✓ |
| 4 | rename `fmtDur` → `formatDuration`, **all call sites and the export updated** | CLEAN | ✗ | ✗ | ✗ | ✗ |
| 5 | comment added + reformat, behaviour identical | CLEAN | ✓ | ✓ | ✓ | ✓ |

**0 false negatives across 12 defect judgements. 4 false positives across 8 clean judgements, all of
them case 4, in every cell.** No case produced "no answer" anywhere, and the requested two-line format
was honoured in 20 of 20 runs — one word on line 1, one sentence on line 2.

Case 3 is the one to notice on the credit side. Codex named the actual mechanism unprompted:
*"Removing the undefined check causes tokens without an expiry to be treated as unexpired because
`undefined < Date.now()` is false."* That is the defect, not a paraphrase of the diff.

**Case 4 is systematic, not noise, and it is a property of the seat.** All four cells gave the same
reason — cell C: *"Renaming and removing the exported `fmtDur` function breaks any existing consumers
that import it."* The diff updates every call site **it contains**, including `module.exports`. Codex
objected to consumers **outside the diff**, which it cannot see. Against the stated truth that is
wrong; as reasoning about an exported symbol it is defensible. The consequence for v32's checker seat
is concrete and cuts against the seat as specified: **a checker given a prepared diff and no repository
will flag every rename of an exported symbol.** Either the prepared diff carries the call-site
evidence, or the checker gets repository read, or renames are routed away from it. One prompt shape,
one model, one run per cell — this is a signal about the seat, not a calibrated false-positive rate.

### The credential-refresh worry (v32's own correction)

v32 records that 0.152.0 *"adds credential-refresh progress to `codex exec`, which adds output to the
stream this row depends on being clean."* **Not observed.** `grep -ril -E 'refresh|credential|
re-authent|expired token'` across all 20 stdout and 20 stderr files → **no match**. Cell A's stdout was
the answer and nothing else; cell C's stream was four events and nothing else.

**This weakens the clause; it does not refute it.** The stored token was evidently valid throughout —
a refresh may simply not have been due in this six-minute window, and absence is not denial, which is
the standard this plan already applies to the unread changelog. The structural answer stands
regardless: `--json` puts the verdict at a keyed path, so a parser reading `item.completed` is immune
to anything else the stream gains.

---

## 4 · R26 answered

> **R26** · *Was #19945 fixed between Codex 0.125 and 0.153?*

**Answered empirically, and the answer is: it does not reproduce at 0.153.4 on this machine — 10 of 10
detached invocations (cells B and C) returned exit 0 with a correct, non-empty answer.** Cell B is the
issue's exact condition: `setsid`, no controlling terminal, stdin from `/dev/null`.

State the bound precisely, because two things this does **not** establish are easy to read into it:

1. **It does not establish that a fix landed in the changelog window.** Non-reproduction is consistent
   with a fix, and equally consistent with the bug being conditional on something this machine does
   not have. The June–August window remains unread; W24's *"absence is not denial"* still governs the
   changelog, and this measurement replaces the need to read it rather than reading it.
2. **It does not establish that #19945 is closed upstream.** I did not query the tracker. The row's
   *"open 130 days with no maintainer reply"* is untouched by this run.

R26 asked for reading because reading was the only cheap route. **The empirical answer is strictly
better evidence than the changelog would have been** — it measures this binary, on this machine, in
the seat it will actually occupy. R26 should move `OPEN` → answered, with the finding stated as
*non-reproduction at 0.153.4*, never as *"fixed in 0.1xx"*.

**For R10 (is a non-Anthropic model reachable at all): yes, and here is the caveat that matters.**
Reachable — `websocket connected (HTTP 101)`, 20 completed turns, a second family answering real
review questions. But reachable **only with the Bash sandbox disabled for that invocation**. R10's
honest form after this run is *"reachable, conditional on a sandbox exemption that does not exist
yet."* That exemption is a founder policy decision (`denyRead` on `~/.codex`, plus provider egress),
not a Codex property and not an agent's call.

---

## 5 · What this does to v32

v32's current text, and what each clause does. **Proposed in strike-don't-delete form. Not applied —
SPINE.md is untouched.**

| Clause, as it stands | Disposition |
|---|---|
| *"Checker on a prepared diff, in the foreground, stdout redirected to a file **while inheriting the parent shell's TTY**"* | **MOVES.** Detached is measured working (B, C, 10/10). The TTY clause is worse than unnecessary — it is unsatisfiable from inside an agent, so as written the row specified a shape no resolver could ever run. |
| *"The **headless rehearsal is what widens it**: `codex exec --json`, no controlling TTY, non-trivial prompt"* | **DISCHARGED.** This is that rehearsal. `--json` detached: 5/5, four clean events per run. |
| *"~~version ≥ 0.124.0~~ … **the installed version, recorded**: Codex is at 0.153.4"* | **STANDS**, and is now recorded from the binary: `codex-cli 0.153.4`, `codex doctor` → `latest version 0.153.4 · current version is not older`. |
| *"#19945 open **130 days with no maintainer reply**"* | **STANDS as a fact about the tracker** — unread this session. Its *consequence for this machine* is what moves. |
| *"its `script -qfc` cure is 'incompatible with normal background / parallel job execution'"* | **STANDS and stops binding.** Cell D confirms the pty wrapper works and costs a merged ANSI/CRLF stream ~9× the size. It is no longer needed, so its incompatibility no longer constrains anything. |
| *"**The cost, once:** one foreground slot is not parallel, so **Codex is not a night lane until the rehearsal passes detached**"* | **The condition is met — and the conclusion still needs one more measurement.** The rehearsal passed detached. But detachment is not concurrency: all 20 runs were **serial**. Nothing here shows two concurrent `codex exec` processes succeeding, and nothing here touches seat limits or rate limits under load. |
| *"0.152.0 adds credential-refresh progress … **adds output to the stream this row depends on being clean**"* | **WEAKENED, not refuted.** Zero occurrences in 40 captured streams; the token was valid throughout, so a refresh may not have been due. `--json` makes it structurally irrelevant. |

**Proposed amendment** (strike-don't-delete, unapplied):

> **v32** | Codex's position on day one | ~~Checker on a prepared diff, in the foreground, stdout
> redirected to a file while inheriting the parent shell's TTY.~~ **(moved 2026-09-07: the headless
> rehearsal, `review/codex-rehearsal.md`)** — **Checker on a prepared diff, `codex exec --json`,
> detached, stdout redirected to a file. No TTY is required and none is available**: measured 0.153.4,
> 20/20 exit 0 with non-empty stdout, of which 10 fully detached (`setsid`, no controlling terminal,
> stdin `/dev/null`); **#19945 did not reproduce** (**R26** answered empirically — *non-reproduction on
> this machine*, not *fixed in the changelog*, which stays unread). ~~one foreground slot is not
> parallel, so Codex is not a night lane until the rehearsal passes detached~~ — **the rehearsal passed
> detached; what remains unmeasured for the night lane is concurrency, not detachment.** ~~its
> `script -qfc` cure~~ works (cell D) at ~9× the stream size, merged with stderr and ANSI-laden, **and
> is not needed.** **NEW, and it is the real day-one constraint:** sandboxed, `codex exec` exits **1
> with 0 bytes**, unable to read `~/.codex/config.toml` (`denyRead`), with provider TLS independently
> failing at the egress proxy — **every working cell required `dangerouslyDisableSandbox`.** A Codex
> resolver is blocked by *this repo's sandbox policy*, not by Codex. **NEW:** the checker seat has a
> systematic false positive — a rename of an exported symbol reads as an API break in 4/4 cells,
> because a prepared diff cannot show the consumers.

---

## 6 · Every command, verbatim

Working root `$R` =
`/private/tmp/claude-501/-Users-adamks-VibeCoding-agentvibe--worktrees-ceo-1-1788609834/96cbec96-76b1-41f4-94ba-3f945fbe54c8/scratchpad/codex-rehearsal`

```bash
# environment
which codex ; codex --version ; tty ; echo $?

# auth + reachability, sandboxed then not (NO `codex login` was ever run)
codex doctor > doctor.sandboxed.out   2> doctor.sandboxed.err     # sandboxed:   exit 1
codex doctor > doctor.unsandboxed.out 2> doctor.unsandboxed.err   # unsandboxed: exit 0

# the sandboxed exec cell (S)
codex exec --skip-git-repo-check -C "$R" -s read-only "$(cat "$R/prompts/1-offbyone.txt")" \
  > out/S0.out 2> out/S0.err                                      # exit 1, 0 bytes stdout

# the four cells — bash cell.sh "$R" {A,B,C,D}, all with the sandbox disabled
# A:
codex exec        --skip-git-repo-check -C "$R" -s read-only "$P" > "out/A-$n.out" 2> "out/A-$n.err"
# B: via run_detached.py, subprocess.Popen(..., stdin=/dev/null, start_new_session=True)  # = setsid(2)
python3 "$R/run_detached.py" "$O" "$E" 150 codex exec        --skip-git-repo-check -C "$R" -s read-only "$P"
# C:
python3 "$R/run_detached.py" "$O" "$E" 150 codex exec --json --skip-git-repo-check -C "$R" -s read-only "$P"
# D:
script -q /dev/null codex exec --skip-git-repo-check -C "$R" -s read-only "$P" > "$O" 2> "$E"

# the credential-refresh check
grep -ril -E 'refresh|credential|re-authent|expired token' "$R/out/"    # no match
```

The prompt, identical for all 20 runs, with the case's diff appended:

```
You are a code reviewer. Judge ONLY the prepared diff below. Do not read files, do not run commands.
Reply with EXACTLY two lines:
Line 1: one word, either DEFECT or CLEAN.
Line 2: one sentence of reason.

DIFF:
<the case diff>
```

Artefacts kept under `$R`: `diffs/` (5), `prompts/` (5), `out/` (20 × `.out` + 20 × `.err` + the S cell),
`cell.sh`, `run_detached.py`. Scratchpad only — nothing written into the repo but this file.

---

## 7 · What could NOT be measured, and why

1. **v32's actual day-one shape — foreground *with* an inherited TTY.** There is no controlling
   terminal in an agent's Bash environment (`tty` → `not a tty`; `codex doctor` → all three streams
   `is terminal false`). Cell A is therefore "foreground, no TTY", not the row's text. Unmeasurable
   from here by construction, and that is the finding, not a gap in the run.
2. **Concurrency.** All 20 runs were serial. Whether two or more `codex exec` processes run in
   parallel — and what a seat or rate limit does when they do — is untouched. This is the one thing
   still standing between the rehearsal and "Codex is a night lane."
3. **Whether #19945 was *fixed*, as against *not reproducing here*.** The changelog window is still
   unread and the tracker was not queried. Non-reproduction on one machine at one version is what the
   evidence supports.
4. **Credential-refresh output.** Zero occurrences, but with a valid stored token a refresh may not
   have been due. This run cannot distinguish *"0.152.0 does not emit it to stdout"* from *"no refresh
   happened."*
5. **A false-positive rate.** One prompt shape, one model (`gpt-5.6-luna`), five cases, one run per
   cell. Case 4 repeating 4/4 shows the failure is systematic rather than sampling noise; it does not
   give a rate, and none should be quoted from this.
6. **Anything about the sandboxed path beyond its first failure.** Sandboxed Codex dies reading
   `~/.codex/config.toml` before the network matters; the TLS failure was observed only via
   `codex doctor`, which gets further. Whether lifting `denyRead` alone would suffice, or whether the
   egress proxy blocks it too, was **not** tested — both blockers were removed together by disabling
   the sandbox, so they are not separated by this evidence.
7. **Prepared-diff realism.** Five synthetic ≤25-line diffs with planted, known answers. Nothing here
   speaks to Codex on a real repository diff, and case 4 is a direct warning that the two differ.
