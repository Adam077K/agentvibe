# Sandbox panel · lane P3 — walking one unattended night, end to end

**Posture:** trace one designed night from launchd waking the Watch to the founder reading the briefing, and
name at every step the program, the thing it touches, the permission that governs it, and whether today's
armed sandbox permits it — with the measurement or the setting that says so.

*Written 2026-09-07 against branch `ceo-1-1788609834`. Nothing installed, authenticated, spent, published or
committed. `SPINE.md` untouched. Single-family caveat in §9 and it is not a footnote.*

---

## 1 · The verdict, first

**No. A designed night does not complete today, and it stops twice — in two different places, for two
unrelated reasons, and only one of them is the sandbox.**

- **It stops first at step 0, and the sandbox is not involved.** The Watch does not exist. `ls
  ~/Library/LaunchAgents/*.plist` returns **eight plists — Google ×3, Perplexity ×3, `com.beamix.clapdetector`,
  Steam — and none of them is the Watch.** `keel/` does not exist on this branch at all (`Glob keel/**` → no
  files), so `bin/watch`, `bin/run`, `bin/worktree`, `bin/send`, `bin/probe` and `bin/reconcile` are ABSENT
  in v50's exact sense: designed, named, not built.
- **It stops second at step 1, and again the sandbox is not involved.** `night_capable` reads **false every
  night** on today's power settings: `pmset -g custom` → `Battery Power: sleep 1 ... AC Power: sleep 1`
  (close-M R41, verbatim, 2026-09-07). Gate 9 refuses every `unattended: true` brief before anything is
  minted (§4.1, §15.1b).

**And the third stop — the one the panel was convened about — does not fire on the designed path at all**,
because of a structural fact the sketch I was handed does not carry:

> **The armed sandbox governs Bash commands and their children *when run through Claude Code's Bash tool*.
> It does not sandbox a Claude Code session, and it does not sandbox the machine.**
> — `docs/03-system-design/SANDBOX.md` §Scope, lines 27–29, this repo's own standing write-up.

**The night, as designed, does not live inside a Claude Code Bash tool.** O93 already says so in the
strongest form available — *"`bin/probe`, `bin/run` and `bin/send` never run inside a Claude session"* — and
O92 says the same of the second family. So for the trace below there are **two process trees**, and almost
every permission question has two different answers depending on which one you are in:

| Tree | Who starts it | Does `.claude/settings.json`'s `sandbox` block apply? |
|---|---|---|
| **T1 — launchd** · `launchd` → `bin/watch` → `bin/run` → `tmux` → `claude -p` | the LaunchAgent, as the founder's user | **No.** Not a Claude Code Bash child. The block is read by Claude Code, not by the OS |
| **T2 — a session** · an orchestrator session → `Bash` → anything | the founder, or an agent | **Yes**, and it fails closed |

**Everything this repo has ever actually done is T2. Everything the night is specified to do is T1.** That
gap is the finding under all four of the questions I was asked, and it is why the honest answer to *"what
does the armed sandbox cost the night"* is **almost nothing — provided the night is never driven from a
session**, and **everything** the moment it is.

---

## 2 · The walk

`SB?` reads: does the armed Bash sandbox permit this **in T2** (from inside a session)? The T1 column is the
designed path.

| # | Program | Touches | Governed by | T2 (session, armed) | T1 (launchd) | Anchor |
|---|---|---|---|---|---|---|
| 0 | `launchd` → `bin/watch` | `~/Library/LaunchAgents/<label>.plist`; dies at logout | macOS launchd; the founder's login session | n/a | **ABSENT** | 8 plists on disk, none the Watch (measured this session); §15.2 |
| 1 | `bin/watch` | `pmset -g batt` · `-g custom` · `-g assertions`; `keel/host/power.yml` | nothing privileged; `Bash(pmset *)` is **not** in the 29 allow rules, so T2 prompts | reads work; **no prompt to answer unattended** | works | close-M R41 ran all three; `.claude/settings.json` L3–33 |
| 2 | `bin/watch` cheap pass (the Desk) | charters, intents, obligations, `settings.yml`, `facts.yml`, `founder.lease` | file reads; writes need a writable root | reads fine | works | §4.1; O1, O9, O86 — all ABSENT |
| 3 | `bin/run` mints | `tmux new-session -d -s <uuid8> -c <dir> claude -p …`; writes `run.started`, records `pgid` | `Bash(claude *)`/`Bash(tmux *)` absent from the allow list, and the design **denies** `Bash(claude *)` in managed settings on purpose | **refused twice over** — §6.6's deny is deliberate, and tmux needs a bind (row 3a) | works | §6.6 items 1–3; O91; `.claude/settings.json` L34–45 |
| 3a | `tmux` server | `bind()`/`listen()` on a unix socket under `/private/tmp/tmux-501/` | the sandbox denies inbound bind for **unix and TCP** | **denied** (PREDICTED — see §8) | works | close-C sockprobe: `UNIX_BIND_LISTEN=FAIL … Errno 1` |
| 4 | `claude -p` child starts | its own `srt-mux` unix socket; its own sandbox | same denial, applied to the child's own startup | **fails CLOSED — all Bash refused, 6 of 6 cells** | **PREDICTED to work; unmeasured** | close-C finding (i): `EPERM … listen '/tmp/claude-501/srt-mux-<pid>-1.sock'` |
| 5 | the child's policy | `--settings <file>` + argv | **`--settings` applies even under `--restricted`; the project file does not** | — | the whole of the night's posture | close-C R28, 5 cells; cell C honoured, cell E ignored |
| 6 | the child works | its worktree (`--add-dir`), `stream-json` on stdout | cwd + **`denyWrite`**; `allowWrite` only widens | — | works | close-C R1 cells I/J (deny bites) and F/G (allow is additive) |
| 6a | `bin/worktree` | `git worktree add` | writes `.claude/agents/**`, `.claude/commands/**`, `.mcp.json` | **exit 128, 32 denials; `allowWrite` does not lift it** | works | CLAUDE.md §Git Worktree Protocol, measured 2026-08-24; O14 |
| 7 | the child writes stores | the worktree; **no** `~/.claude/projects` transcript | `--no-session-persistence` | — | works | close-C R30, by-session-id lookup |
| 8 | `bin/send` | outbound HTTPS; a keychain item; `keel/consent.yml`; the ladder file | keychain ACL + lock state | keychain read **rc=0 even sandboxed** | works **while logged in** | close-C R3: unlocked rc=0 detached; locked rc=152 `errSecInteractionNotAllowed`, immediate; login keychain `no-timeout` |
| 9 | Codex checker | `codex exec --json`, detached, on a prepared diff | `~/.codex` is `denyRead`; **plus** provider TLS at the egress proxy | **exit 1, 0 bytes** — dies reading its own config | **works, 20/20 exit 0** | `review/codex-rehearsal.md` §2 cells B/C/S |
| 10 | `bin/reconcile` on wake | `claude agents --json --all`; tmux list; **process table**; daemon `roster.json` read-only | `ps` and the roster read | `ps` **denied**; roster read denied *if* O92's list is applied | works | §15.8 last row (`ps` denied in the sandbox); O15 + O92 collide, §5.3 |
| 11 | the briefing rendered | mission-control: `Bun.serve({ hostname: '127.0.0.1', port: 4300 })` | an **inbound TCP bind** | **denied** — synthetic `EADDRINUSE` with `errno: 0` where macOS gives 48 | works | `mission-control/server/config.ts:11`, `server/index.ts:55`; CLAUDE.md `check:mc` bullet |
| 12 | the phone reads it | an authenticated tunnel + a keychain-held token | — | — | **ABSENT** | §14.1 (v66); the loopback pin exists, token and tunnel do not |

**Read row 3a, 4 and 11 together, because they are one fact seen three times.** The night's three carriers —
**tmux's server socket, the Claude child's own `srt-mux` socket, and mission-control's TCP listener** — each
require an **inbound `bind()`**, and the armed sandbox denies inbound bind for unix and TCP alike. That is the
whole mechanism behind "a nested child fails closed": it is not a nested-sandbox rule, it is one bind denial
hit three times. close-C says so directly — *"The mechanism is measured directly, not inferred."*

---

## 3 · The four questions, traced

### 3.1 The nested child fails closed. Does the night run at all today?

**On T2, no, and it stops at step 3 — one step earlier than the sandbox would have stopped it.** Before a
child can fail to start its sandbox, `bin/run` has to be invoked from a shell, and `Bash(claude *)` is
(a) absent from the 29 allow rules and (b) **deliberately denied** by §6.6 — *"a run cannot dispatch its own
successor"*, held in managed `permissions.deny`, `--restricted` cannot lift it. The fail-closed child is the
**second** wall, not the first. If someone widened the deny to test it, the child then fails closed: 6 of 6
sandbox-enabled cells, all Bash refused.

**On T1, the sandbox is never consulted**, and the night stops at step 0 and step 1 for reasons that have
nothing to do with it. **So the honest answer to the founder is: the armed sandbox is not what is stopping
the night. Absence is.** Changing the sandbox posture today would move nothing, because the two programs
that would notice do not exist.

**One untried lever would collapse T1 and T2 into one and is worth naming loudly:**
`sandbox.enableWeakerNestedSandbox` **exists as a settings key and has never been tried** (close-C finding (i),
explicitly). If it works, the night can be driven from a session, which is how every piece of work in this
repository has ever actually been driven. One cell, no install, no spend. Highest value-per-cost item on this
page.

### 3.2 `SessionStart` fails in a nested child. What actually binds a night child?

This is the most important thing I found, and the sandbox turns out to be the *lesser* of two independent
reasons.

**Reason one, measured, sandbox-caused, and T2-only.** `SessionStart` hooks fire and then fail in a nested
child: `EPERM: operation not permitted, mkdir '/Users/adamks/.claude/session-env/<sid>'`, while
`UserPromptSubmit`, `Stop`, `SessionEnd` and `PreCompact` all run (close-C finding (ii)). On T1 the parent
denial does not exist, so this **probably does not fire** — PREDICTED, unmeasured.

**Reason two, and it applies on T1 as well, so it is the one that decides.** A night child runs
`--restricted` (§6.5, §12.10). `--restricted` *"ignores user, project and local settings files (managed
settings and `--settings` still apply)"* — the vendor's own `--help` at 2.1.263, with R28's cell E as the
positive control: the same setting delivered through `.claude/settings.json` **was ignored**, delivered
through `--settings` **was honoured**.

**`.claude/settings.json` lines 47–61 are where `session-start.js` is registered.** So a night child does not
run this repo's `SessionStart` hooks — not because of the sandbox, but because of a flag the design chose on
purpose.

**And the replacement does not carry it.** O87 composes `--settings <json>` per child *"with its hooks
(`PreModelSwitch`, `PreCompact`, `SessionEnd`)"* — **three hooks, and `SessionStart` is not among them.**
Meanwhile O107 makes the constitution a ≤ 4,096-byte body sized precisely to *"`session-start.js`'s budget,
#76"* — i.e. specified against the delivery path the night child does not have.

**So: what binds a night child today, and under the design exactly as written, is argv and nothing else** —
`--restricted --tools <list> --strict-mcp-config --permission-mode dontAsk --permission-prompts none
--add-dir <wt>`, over managed `permissions.deny`. Not the constitution. Not the lenses index. Not the
playbooks. And if O39's `--exclude-dynamic-system-prompt-sections` is turned on as adopted — it *"moves cwd,
environment, memory paths and git status out of the system prompt"* (§15.5) — **`CLAUDE.md` goes too**, and
the child arrives with no prose direction whatever.

**The fix is cheap and it is a `bin/run` fix, not a sandbox fix: the constitution must be composed into the
prompt text, or into `--settings`' own hook block, and never left riding a project-tier `SessionStart`.**
Two adopted mechanisms (O87, O107) currently disagree about a path that neither one measured, and this is
exactly the class §6.3 warns about — *a summary that lost a number cannot propagate*, here a delivery path
that lost its carrier.

### 3.3 Inbound `bind()` is denied. What in the night assumed it could be a service?

Four things, and the plan has already surrendered two of them:

| Assumed a listener | Status |
|---|---|
| **The local model tier** (Ollama on `127.0.0.1:11434`) | already surrendered. O13 makes it `bin/embed`/`bin/classify`, no-model programs in the Watch's launchd context. R4 closed both directions: server-outside unreachable (Bash **and** WebFetch, EPERM both), server-inside unstartable |
| **The daemon as the night's carrier** (`--bg` binds `control.sock`) | already surrendered. O91 refuses `--bg`, for the daemon's leases rather than for the bind. R31 measured the socket: `bg: control socket bound at /tmp/cc-daemon-501/…/control.sock` |
| **tmux, which O91 chose as the replacement carrier** | **not surrendered, and nobody noticed.** A tmux server binds a unix socket. PREDICTED denied in T2 on the same measurement that denies everything else; fine in T1 |
| **mission-control, which renders the briefing** | **not surrendered, and it cannot be.** It binds `127.0.0.1:4300` by a literal in `server/config.ts:11`. This is why `check:mc` is EXCLUDED from `npm run check` and run unsandboxed in CI |

**The world's door is the one thing that was checked and came back clean.** R6: Gmail, Calendar, Drive,
Stripe and GitHub all poll with a cursor; Slack reaches parity by opening the socket **outbound**; **only
Notion requires a publicly reachable endpoint** and documents no change feed. So the door is a reader, and
the bind denial gates none of it.

**The generalisation worth keeping:** the runtime is itself a service — Claude Code binds a socket at
startup — so an armed Bash sandbox cannot host a Claude child, cannot host a terminal multiplexer, and cannot
host the surface the founder reads. Not three limitations; one, seen where three different mechanisms happen
to need a listener.

### 3.4 `git worktree add` cannot complete. Does a night that builds anything work today?

**On T1, yes in principle and no in fact. On T2, no.**

`git worktree add` under the armed sandbox is exit 128 with 32 denials across `.claude/agents/**`,
`.claude/commands/**` and `.mcp.json`; **`allowWrite` does not lift it, and `**/.worktrees` and
`**/.worktrees/**` are already in the file at lines 96–97 and were refused anyway.** From launchd there is no
Seatbelt profile and the command completes — measured as *"the same command with the sandbox disabled: exit
0, 809 files"* (CLAUDE.md), which is the same absence of profile by a different route, and I mark the step
from *sandbox off* to *launchd* as an inference rather than a measurement.

O14 has already drawn the right conclusion: **a run never makes its own worktree; `bin/worktree` makes it and
`bin/run` hands the path in argv.** Two things still block it today:

1. **`bin/worktree` is ABSENT** — `keel/` does not exist.
2. **The agent files still teach the superseded self-creation form, and `schema-lint.js` still requires it.**
   CLAUDE.md carries this as a known, deliberate contradiction: `builder.md` and `designer.md` carry the
   worktree-creation block as Step 1 and `lint:agents` is green **only because they do**. So a builder
   dispatched tonight reads its own file and tries to make its own worktree. In T1 that would silently
   *succeed*, violating O72's file lease rather than failing loudly. **The failure mode of building tonight is
   not a crash; it is two runs in one file, found at landing.**

---

## 4 · The artifact — the minimum permission set a night needs

Not the maximal safe set and not the current one. The minimum that lets a designed night complete. It has
three tiers, and **the first tier is the surprise: most of the night needs no Claude Code permission at all.**

### Tier A — the no-model programs. Claude Code permissions: **none required.**

`bin/watch` · `bin/run` · `bin/worktree` · `bin/log` · `bin/send` · `bin/reconcile` · `bin/probe` ·
`bin/embed` · `bin/classify` · `bin/bell` · `bin/say`. All from launchd (O93). What they need is from macOS,
not from a settings file:

| # | Must be true | Whose act | Today |
|---|---|---|---|
| A1 | A LaunchAgent at `~/Library/LaunchAgents/<label>.plist`, bootstrapped `gui/$(id -u)`, running `bin/watch` on `StartInterval` | **founder** — an install, named in close-C R33 | **ABSENT** (8 plists, none is it) |
| A2 | On AC · charge above a floor · sleep prevented — `pmset -a disablesleep 1`, or an assertion that reads **listed per-process AND binding system-wide** | **founder** | **FALSE** — `sleep 1` on both; §20.2 row 7 deferred the act |
| A3 | The Mac stays logged in, so the login keychain stays unlocked | founder habit | **TRUE** — `no-timeout`, read directly |
| A4 | `keel/` and the eleven programs exist | build | **ABSENT** |
| A5 | The managed settings file, carrying `permissions.deny` + `disableBypassPermissionsMode` only | **founder**, outside the repo | **ABSENT** — §I row 8 |

### Tier B — the night child's own policy. This is the whole of the night's sandbox posture.

**And it is not written by editing any file in this repo.** R28 measured the mechanism: `--settings <file>`
survives `--restricted` while the project file does not. So `bin/run` composes it per child. The minimum:

```
argv:  claude -p --restricted --tools <exact list> --strict-mcp-config
       --permission-mode dontAsk --permission-prompts none
       --add-dir <worktree> --session-id <uuid> --no-session-persistence
       --autocompact <context> --max-budget-usd <n> --settings <policy.json>
cwd:   the worktree bin/worktree made
```

```jsonc
// policy.json — composed per child, never checked in
{
  "sandbox": {
    "enabled": true, "failIfUnavailable": true,
    "filesystem": {
      // denyWrite is the ONLY verb that confines. allowWrite widens and cannot take anything away.
      "denyWrite": ["~/.claude/**", "~/.agentvibe/**", "<every venture root but this one>"],
      "denyRead":  ["~/.ssh","~/.aws","~/.config/gh","~/.netrc","~/.gemini","~/.codex",
                    "~/.config/openai","**/.env","**/.env.*","~/.claude/projects"]
    },
    "network": { "allowedDomains": ["<the small, known set this shape needs>"] }
  },
  "hooks": {
    "SessionStart":   [ /* THE CONSTITUTION'S ONLY REMAINING CARRIER — see §3.2 */ ],
    "PreModelSwitch": [ /* O89 */ ], "PreCompact": [ /* O90 */ ], "SessionEnd": [ /* O87 */ ]
  }
}
```

Three things about that block are load-bearing and each is measured:

- **`denyWrite`, not `allowWrite`.** R1's own DECIDES line: *"An `allowWrite`-only policy grants and never
  confines, which is what the repo's own `.claude/settings.json` currently expresses."*
- **`SessionStart` must be in this file or the constitution does not arrive** (§3.2). O87 as written omits it.
- **`network.allowedDomains` is free here and expensive nowhere.** A night child's domain set is small and
  known at dispatch. Note the bound: **there is no HTTP-method allowlist** — policy is domain-scoped only
  (R2, absence established by search over the shipped binary) — so `bin/egress`'s method filtering stays a
  program we write, and `credentials` masking needs `tlsTerminate` and may need **managed** settings, which
  is an admin act.

### Tier C — the Floor and this repository. **Change nothing.**

The armed project-tier sandbox governs T2 only. It costs the night nothing, because the night is T1. Keep it.

---

## 5 · The delta from what is configured today

### 5.1 The headline

**Zero edits to `.claude/settings.json` are required for a night to run.** What is required is two files that
do not exist — the managed settings file (A5) and the per-child policy `bin/run` composes (Tier B) — and one
founder act on power (A2). If the founder reads only one line of this page, it is that one: **the sandbox
debate and the night's blockers are disjoint sets.**

### 5.2 Ranked, by what it protects against versus what it prevents

| Rank | Change | Protects against | Prevents | Verdict |
|---|---|---|---|---|
| 1 | **Try `sandbox.enableWeakerNestedSandbox`** — one cell, never attempted | nothing; it is a measurement | nothing | **DO IT FIRST.** If it works, the night is drivable from a session and T1/T2 stop being two worlds |
| 2 | **Add `SessionStart` to O87's per-child `--settings`** | a night child running with no constitution, no lenses, no CLAUDE.md | nothing | **DO.** Cost: one hook block. This is a plan defect, not a posture question |
| 3 | **Write the managed settings file** (A5) | a run launching a child with different settings; `bypassPermissions` | nothing the design wants | **DO.** §12.4 is a WISH until it exists; today `bypassPermissions` is refused *by convention* |
| 4 | **Replace `allowWrite` with `denyWrite` + cwd in the child's policy** | one venture's run writing into another's tree; O27's cross-venture claim | nothing measured | **DO in Tier B.** Leave the project file alone — its four `allowWrite` entries are inert-to-harmless, and two of them (`**/.worktrees*`) are already **measured not to achieve what they were added for** |
| 5 | **Add `~/.claude/projects` to the child's `denyRead`** | a night child reading every stranger's transcript body | `bin/mine` — **but that runs from launchd**, so nothing real | **DO in Tier B only.** Not in the project file: it would break R30-class measurement from a session |
| 6 | **O92's `~/.claude/{daemon,jobs,routines}` on `denyRead`** | the daemon's `control.key` | **O15's reconciler, which is specified to read `roster.json` in that exact directory** | **DO ONLY WITH `allowRead: ["~/.claude/daemon/roster.json"]` beside it.** SANDBOX.md: *"the more specific path wins."* Two ADOPTED mechanisms currently collide here and nothing has noticed |
| 7 | **A sandbox exemption for `codex exec`** — what the rehearsal called *"a founder policy decision"* | — | — | **DO NOT.** Move Codex to launchd instead and the question dissolves: both blockers (`~/.codex` `denyRead`, and provider TLS at the egress proxy) are properties of the Bash sandbox, and neither exists in T1. O92 already routes it there. An exemption would reopen in the Floor what launchd closes for free |
| 8 | **Disarm the sandbox** | — | every accident it currently catches on the Floor | **DO NOT.** It blocks nothing the night needs. A control that costs the night nothing is not the control to trade away |

### 5.3 The one contradiction this walk found that nobody has recorded

**O15 and O92 disagree about `~/.claude/daemon/roster.json`.** O15 has the wake reconciler read it
(*"O15 reads the daemon roster read-only"*); O92 puts the whole directory on `denyRead`. Both are ADOPTED,
both are in §L, and they only fail to collide today because both are ABSENT and because the reconciler is
specified to run in T1 where `denyRead` is inert. It becomes a live defect the moment anyone runs the
reconciler from a session, or applies O92's list to the child policy without the paired `allowRead`. Row 6
above is the fix; I am not editing SPINE.md to record it.

---

## 6 · Where my walk corrects the sketch I was given

| Sketch | Correction | Anchor |
|---|---|---|
| *"the nested child fails closed — so does the night run at all?"* | The night as designed has no nested child. The fail-closed measurement was taken in T2 and describes T2 | SANDBOX.md §Scope; O93 |
| *"`SessionStart` fails in a nested child, and that is the path the constitution arrives on"* | Two failures, and the sandbox is the lesser. `--restricted` drops the project tier on **every** carrier, T1 included, and O87's replacement omits `SessionStart` | close-C R28 cells C/E; O87; O107 |
| *"the local model tier cannot be a service"* | True, and already surrendered. The unsurrendered ones are **tmux** and **mission-control** | close-C R4/sockprobe; `config.ts:11` |
| *"builders are specified to work in worktrees — does a night that builds work?"* | O14 already fixed the specification. What is unfixed is that the agent files and the lint still teach the superseded form, so tonight's builder would try, and in T1 would **succeed** — breaking O72 rather than failing loudly | CLAUDE.md known-contradiction bullet; O72 |

---

## 7 · What would prove me wrong

1. **The pivotal cell.** A LaunchAgent runs `claude -p --settings <armed> 'write a file'` and the child
   **fails to start its own sandbox**. My entire T1/T2 split collapses, the night needs
   `enableWeakerNestedSandbox` or a disarmed posture, and §5's ranking inverts. This is R33's cell plus one
   flag; **it needs an install and is the founder's act**, named in close-C R33.
2. **`--restricted` turns out to keep project-registered hooks.** R28 measured the project tier being ignored
   using `model` as the observable — that it also drops **hooks** is an inference from the vendor's sentence,
   not a measurement. One cell: register a `SessionStart` marker in `.claude/settings.json`, run
   `claude -p --restricted`, look for the marker. If it fires, §3.2's second reason evaporates and only the
   sandbox one remains.
3. **A tmux server starts fine under the armed sandbox.** Then row 3a is wrong and my "three carriers, one
   bind denial" generalisation loses a leg. One cell: `tmux new-session -d -s probe true` from a sandboxed Bash.
4. **The keychain is locked at 3 a.m.** R3's matrix predicts `bin/send` fails instantly with
   `errSecInteractionNotAllowed` after a reboot with the screen locked. That would move the night's outward
   half from *works* to *cannot start*, and it is the same R33 cell.

---

## 8 · What I could not determine

Recorded as unmeasured, not guessed — this panel exists because three earlier readings guessed from the same
partial window.

- **Whether a launchd-spawned `claude -p` starts its own sandbox.** The pivotal question of this page, and it
  is **PREDICTED, not measured**. The best available support is that this very session is a top-level Claude
  Code process with `enabled: true` whose Bash works — but it was started from a terminal, not from launchd,
  and R33 is BLOCKED precisely on the launchd context.
- **Whether tmux's server can bind under the armed sandbox.** Predicted denied from close-C's unix
  `bind()`/`listen()` measurement; not run. Whether a *client* can `connect()` to an existing server is
  separately unmeasured — W36 measured outbound loopback **TCP** connect denied, not unix.
- **Whether `sandbox.enableWeakerNestedSandbox` changes anything.** Exists; never tried; close-C says so.
- **Whether lifting `denyRead` on `~/.codex` alone would unblock Codex.** Both blockers were removed together
  by disabling the sandbox — the rehearsal names this as its own residue (§7.6).
- **Whether a LaunchAgent needs Full Disk Access** to read `/var/log/powermanagement` for O82's collector.
  Unmeasured; `syslog -d` worked from a session.
- **Codex concurrency.** All 20 rehearsal runs were serial (§7.2). Detachment is settled; concurrency is not.
- **Whether `tmux` is installed on this Mac at all.** Not checked; `Bash(tmux *)` is not in the allow list, so
  checking it from a session would prompt.

---

## 9 · Single-family caveat

Every judgement on this page is one agent, one model family, one machine, one day, reading a system its own
family built. The measurements I lean on — close-C, close-M, close-W, the Codex rehearsal — are the same
family again, and several rest on a single differential pair. This is **not an independent panel**, and the
two conclusions most worth a second family's eyes are the T1/T2 split in §1 (which is an inference from a
scope sentence plus one unmeasured cell) and §3.2's claim that `--restricted` drops project-registered hooks
(inference from vendor text, with the settling cell named in §7.2). Where I state a negative — no method
allowlist, no `SessionStart` in O87, no Watch plist on disk — read it as *not found by these searches and
these reads*, and each says which.
