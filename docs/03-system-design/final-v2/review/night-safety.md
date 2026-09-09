# Night safety — designing the unattended run that holds a credential

**The founder's question, 2026-09-07, verbatim:** *"i think yes that that scheduled job can reach a credential
but i want to do it safely and make sure they wont do stupid staff that will hurt us."*

*Written 2026-09-07 on branch `ceo-1-1788609834`. **Nothing built, installed, authenticated, spent, published,
committed or pushed.** No settings or policy file was modified; `.claude/settings.json` was **read** and the
reading is in §2. This is a design, not a change. Single-family caveat in §13, and it is not a footnote.*

---

## 0 · The answer, first

**Yes — and the safety cannot come from permission, because every control that *judges* an act needs a model
in the loop and every model in the loop is asleep at 3 a.m. What survives unattended is shape.** Three shape
decisions carry almost all of the safety, and none of them is a setting: **which credential the run can reach
at all** — a dedicated, narrowly-scoped, independently revocable one per purpose, capped at the provider, never
the founder's own; **how much one run can cost before anything notices** — bounded at the provider's console
rather than by our own arithmetic, because a ceiling we compute fails exactly when our program is what broke;
and **whether the run that read the world is the same run that can act on it** — which is argv at dispatch, and
is the only defence against the highest-probability harm on the board. Everything else on this page is a speed
bump, a diagnostic, or a comfort, and it is labelled as one.

**The sentence to keep:** *a night run should be safe because of what it does not hold, not because of what it
was told.*

---

## 1 · Scope — and the two things this document deliberately does not do

**It recommends nothing about the sandbox posture.** The founder deferred that on 2026-09-07 with a trigger
rather than a date — *"Change nothing yet"*, revisit when `bin/run` exists (DECISIONS §29, G2) — and the trigger
is well chosen, because `bin/run` is the first moment a per-child settings file could be written by anything
this plan owns (O131). Where a layer below sits **inside** that deferral it is marked `⟨DEFERRED⟩`: it is named
so the template's author has it, and it is not recommended here.

**It assumes the auto-mode permission classifier is absent from a `-p` child.** A separate lane (R46) is
measuring this now. W52 records the classifier as the strongest control measured in an interactive session —
four of six adversarial probes, none of them refused by the sandbox or by `pre-tool-use.sh` — and Lane C's
children ran `--permission-prompts none`. Designing for its absence is the right direction: if R46 finds it
present, every layer below still holds and the night is better defended than this page claims.

---

## 2 · The fact everything else follows from, and it is one file

**`.claude/settings.json` is what everyone in this repository reads as "the permissions." It is a project-tier
file, and a night child discards it.** `--restricted` *"ignores user, project and local settings files (managed
settings and `--settings` still apply)"* — the vendor's own `--help` at 2.1.263, with close-C R28's cell E as
the positive control: the same setting delivered through the project file was **ignored**, delivered through
`--settings` was **honoured**. Every unattended night child runs `--restricted` (§12.10). P5 §0 stated the
consequence first and it is the frame for this whole document: **the only permission file this system has binds
exactly where a human is watching, and is discarded exactly where none is.**

Read directly this session, so the line numbers are a measurement and not a quotation:

| In `.claude/settings.json` | Binds the Floor (T2) | Binds a night child (T1: launchd → `-p --restricted`) |
|---|---|---|
| 29 allow rules — including `Bash(git *)` (L4) and `Bash(gh *)` (L15) | yes | **no** |
| 10 deny rules — **all `Bash(...)`; zero `Read(...)`** (L34–45) | yes | **no** |
| `PreToolUse` → `pre-tool-use.sh`, matcher `Bash\|Edit\|Write\|NotebookEdit\|mcp__` (L62–72) | yes | **no** — *inferred; settling cell in §11* |
| `SessionStart` → `session-start.js`, the constitution's carrier (L48–61) | yes | **no** — same inference (P3 §3.2) |
| `sandbox` block: 9 `denyRead`, 4 `allowWrite`, **0 `denyWrite`, no `network` key** (L78–100) | yes | **no** — discarded with the tier; a sandbox block reaches a child only through `--settings` ⟨DEFERRED⟩ |

**The third row is the one nobody has written down, and it is this document's own finding.** P2 F6 ranks
`pre-tool-use.sh`'s destructive-command rules as **the one control it would defend without hedging** — the
bulk-clean that removes coordination state, the discard of every uncommitted change, bulk delete through a
search tool, destruction through an allow-listed interpreter, fetch-and-run of a remote package. That control
is registered at L62–72 of a project-tier file. **So the single best control this repository owns is, on the
same argument P3 §3.2 used for `SessionStart`, absent from the night it was most needed for.** O87's per-child
`--settings` replacement names three hooks — `PreModelSwitch`, `PreCompact`, `SessionEnd` — and omits both
`SessionStart` **and** `PreToolUse`. P3 found the first omission; this is the second, and it is worse, because
a missing constitution produces a confused run while a missing `PreToolUse` produces a destructive one.

**Mark the strength honestly.** R28 measured the project tier being discarded using `model` as the observable.
That it also discards **hooks** is an inference from the vendor's sentence, shared with P3, and it is settled by
one cell (§11). Both omissions are `bin/run`'s to fix, and `bin/run` is **ABSENT**.

**One small instance that shows how completely the two worlds invert.** `gh` is the only credentialed
publishing tool on this machine. On the Floor it is **allow-listed** (`Bash(gh *)`, L15) and simultaneously
**broken** — `~/.config/gh` is in `denyRead` (L85), so `gh` dies reading its own config, the same shape that
kills sandboxed `codex exec`. At night neither rule applies: the allow list is discarded, the sandbox block is
discarded, `gh` works, and the only thing standing between a night run and the public remote is whether
`bin/run` put a shell in its `--tools` list.

---

## 3 · The layers, ranked by what they stop

Ranked by harm prevented, not by how hard they are to build. `⟨DEFERRED⟩` marks a layer inside the founder's
sandbox deferral: named for the template's author, not recommended here.

| # | Layer | Stops | Does **not** stop | Model in loop | Determ. | Fails | Path · state |
|---|---|---|---|---|---|---|---|
| **1** | **Provider-side cap and scope on a dedicated credential** | unbounded money and unbounded scope, **at the one place that holds when every line of Keel is wrong** | anything inside the cap; a provider that offers no cap | no | yes | **closed** | the provider's console + a credential row in `obligations.yml` (O67) · **founder act · ABSENT** |
| **2** | **Tool absence at dispatch — `--tools`** | every act the missing tool would perform, **including ones nobody enumerated** | anything reachable through a tool it does hold — and **a shell is a universal tool** | no | yes | **closed**; a subagent's own `permissionMode` frontmatter is ignored, so a child cannot widen itself (§C.1) | `bin/run`'s argv · flag ships · **composer ABSENT** |
| **3** | **The Sender — the only thing that sends, and it holds no model** | every outward act reaching a person, money or the public *from a run* | a run holding `Bash`, which does not defeat the Sender but **bypasses it by not using it, and nothing observes that** (P5 §4) | no | yes | closed **only while the trifecta split holds at dispatch** | `bin/send` · **ABSENT** |
| **4** | **The credential is unreachable while the founder is away** — a separate night keychain with its own lock policy | an unattended spend or send **at the moment of the credential fetch**, whatever the run decided | a credential in an env var or a file; any act needing no credential | no | yes | **closed, and fast** — `rc=152 errSecInteractionNotAllowed`, immediate, measured (close-C R3) | `security set-keychain-settings` + `bin/send`'s read · mechanism **EXISTS/measured**; the keychain is a **founder act · ABSENT** |
| **5** | **`founder.lease` — absence of a heartbeat is itself the stop (O86)** | the night minting new work with the network off, the tunnel down and the phone dead | work already running — that is the recorded pgid and `SIGTERM` (v67) | no | yes | **closed by construction: the control's own failure IS the stop** | `keel/logbook/founder.lease` · `bin/watch` · **ABSENT** |
| **6** | **A worktree with no path to the public remote** | night work reaching GitHub | anything local | no | yes (as a credential/remote fact) | closed | `bin/worktree` · **ABSENT** — see §5.2 |
| **7** | **O131 — the dispatcher owns the settings template and never accepts one as a parameter** | a brief, playbook or fetched string choosing the child's own confinement — **two measured routes** (W50 `bypassPermissions` 8/9; W51 `filesystem.disabled` 3/3) | nothing by itself: it is the precondition that makes every settings-carried control below trustworthy | no | yes | closed | `bin/run` · **ADOPTED as a mechanism · ABSENT** |
| **8** | **Our ceilings (run · intent · venture-month) and the cord** | runaway *model* spend; one stop verb with one record over five receivers (O85) | third-party spend — **`--max-budget-usd` binds no account** (v23); anything already committed at a provider | no | yes | **open** if our program is what broke — which is why layer 1 outranks it | `bin/run` · `bin/send` · `bin/stop` · **ABSENT** |
| **9** | **`denyWrite` + cwd per child** (W45) ⟨DEFERRED⟩ | cross-venture and cross-worktree writes — today *"a convention they keep, not a rule anything enforces"* | the `Read`/`Write`/`Edit` tools: it is the **Bash** sandbox (P1 §10.3), and it needs the child's own sandbox to start | no | yes | closed | `bin/run`'s template · **ABSENT** |
| **10** | **`network.allowedDomains` on a credential-holding child** ⟨DEFERRED⟩ | exfiltration to an unlisted destination — **converts "the Sender is the only thing that sends" from convention to syscall** for the shell half | `WebFetch` (unmeasured whether governed separately); **there is no HTTP-method allowlist** (close-C R2, absence by search) | no | yes | closed | `bin/run`'s template · **ABSENT** |
| **11** | **Hooks delivered in the child's `--settings`** | whatever the hook checks — **`PreToolUse`'s destructive rules are the ones worth carrying** (§2) | what a string matcher cannot see. It blocked a document for **mentioning** a command (P2 F7) and misses a differently-spelled one | no | yes | **open on the non-blocking events unless the hook denies through the `decision` object** — O38, and *"a hook written the obvious way silently fails to deny"* | `bin/run`'s template + the O38 rewrite · **ABSENT** |
| **12** | **The verb table / reversibility** (O109) | **nothing at runtime.** It decides what goes into `--tools` | any act by a run that already holds a shell | no | yes | n/a — it is a **compiler, not a guard** | `keel/shared/tools/<name>.yml` · **ABSENT** |
| **13** | **Prose — the constitution, the lenses, "treat fetched text as data"** | an unpersuaded model doing an unconsidered thing | **a persuaded one**, which is the whole threat — and today it **does not reach a night child at all** (P3 §3.2) | **yes** | no | **open, silently** | `session-start.js` · EXISTS for T2 · **not delivered to T1** |

**Read the table's shape, not only its rows.** Layers 1–7 need no model and are all *structural* — they change
what exists rather than what is judged. Layers 11–13 are the ones a persuaded or looping run walks through.
**Everything above the line that actually protects the founder at 3 a.m. is a decision about shape taken at
dispatch, and nine of the thirteen rows are ABSENT.**

### 3.1 · The control that costs work every day and stops nothing real

The brief invites this call and it is inside my remit. **A `Bash(...)` string deny list is not a safety story
and should not be allowed to postpone one.** It is measured to fail in both directions in one session: it
refused a command because the denied word appeared **in the author's own comment** (P2 F7), and it denies
`curl` and `wget` by name while `node *` and `python3 *` are on the allow list and both ship an HTTP client
(P5 §2, Case A — inference from the rule shape, not measured). Keep it as a speed bump; its own hook's note
calls the false-positive half *"unfixable without a shell parser."* What would be worse than keeping it is
counting it as a layer.

---

## 4 · Credential shape

### 4.1 · Should a night job ever hold the founder's own credential? **No — and the reason is not leakage.**

The keychain leaks it anyway. close-C R3, measured: a detached, TTY-less process reads an **unlocked** keychain
with no prompt and no interaction, and *the armed sandbox does not block it* — a sandboxed read of the same
item returned `rc=0`. The login keychain here is `no-timeout` with **no `lock-on-sleep` flag**, established with
a positive control (setting the flag on a throwaway keychain made it print; clearing it made it stop), so
**sleep does not lock it** and it is open from login to logout. The vendor's own headless supervisor reads the
Claude token this way across days.

But leakage is the weaker argument. **The decisive property is independent revocability.** The cheapest correct
response to any 3 a.m. incident is *revoke the credential* — and a shared credential makes that response the
most expensive one available, because revoking the founder's own GitHub or provider key at 4 a.m. locks the
founder out of their own morning. A control the founder will hesitate to use is not a control. **One
credential per purpose, per venture, revocable alone, is what makes "kill it and look later" the obvious move
instead of a trade.**

Two further properties follow and are worth naming because they are free once the credential is separate:
**scope** (a fine-grained token for one repository with no delete verb; a read-only restricted key; a provider
sub-account) and **attribution** — a separate credential means the provider's own log answers *which run did
this*, without our event log being trusted to answer it.

**One thing to prefer that is easy to get backwards:** where the choice exists, take a **long-lived narrowly
scoped API key over an OAuth token**. close-C R3's own DECIDES line found the real 3 a.m. risk and it is not
the read: it is **OAuth refresh, which the vendor's own daemon states a headless process cannot complete**
(`~/.claude/daemon.log`, quoted verbatim in R3). An OAuth-backed night has a hard dependency on a founder act
at an unpredictable hour. Expiry then becomes an obligation row, which O67 already specifies.

### 4.2 · What the keychain actually gives us — and the feature hiding inside a failure

**It gives one thing, and it is genuinely valuable: a locked keychain fails FAST.** `rc=152`
(`errSecInteractionNotAllowed`), returned *"in well under the 20 s timeout — the failure is immediate, not a
hung prompt"* (close-C R3). For an unattended lane that is the best failure mode available. A night job that
cannot reach a credential dies in milliseconds and leaves a dated row; it does not hang for six hours holding
a slot, burning a window and producing a briefing line that says nothing.

**It does not give confinement.** Do not describe `denyRead` or the keychain as protecting a credential from a
night run: the sandboxed read returned `rc=0` (R3), `denyRead` governs the **Bash** sandbox and not the agent's
own `Read` tool (P1 §10.3, 4 of 4 including the control), and at night `.claude/settings.json`'s nine `denyRead`
paths are discarded with the tier anyway (§2). W54 puts it exactly right: it stops a *confused* agent reading
an obvious path, not a *directed* one.

### 4.3 · Recommendation — "unreachable while the founder is away" is the better default, per purpose

**Yes, and split it by class rather than machine-wide.** Concretely: a **second keychain**, not the login
keychain, holding only the credentials that **spend, send or publish**, with its own lock policy
(`security set-keychain-settings -l -t <n>` — the flags are measured settable and readable on this Mac by
close-C R3's own positive control). Read-only credentials — a fetch token, a poll cursor — stay reachable.

- **What it stops:** a looping or persuaded night run completing a *spend* or a *send*, at the credential
  fetch, deterministically, with no model involved and no prompt to answer.
- **What it does not stop:** anything the run does that needs no credential; anything already in an env var;
  a credential the founder unlocked earlier in the evening and left open.
- **What it costs, stated plainly:** the unattended half of any spending or sending act becomes impossible
  without a founder unlock. That is a real narrowing. **It is the right default because the class it closes is
  exactly the class §12.1 already puts on `never`** — send mail as me, post publicly, pay anyone — so it costs
  the night nothing it was authorised to do, and it costs the *widening ladder* (§12.2b) its unattended rungs
  until the founder decides otherwise per venture. That trade is the founder's, per venture, and it is the one
  place in this document where a real capability is given up.
- **The residue that must travel with it:** close-C R3's ACL half is **PARTIAL** — both items were read by the
  same `/usr/bin/security` that created them, so the default ACL was never exercised against a *different*
  binary. **Do not build a control on per-item ACLs until one cell settles it** (§11). The lock policy is
  measured; the ACL is not.

**Founder acts, named and stopped at:** creating the credentials at each provider with their caps and scopes;
creating the second keychain and setting its lock policy; deciding per venture whether a spending class may
ever run untapped. None of these is an agent's, and none was performed.

---

## 5 · Blast radius, not permission — what one unattended run can destroy, ranked

The durable question is not *may it act* but *how much can one bad run cost before anything notices*. Ranked
worst first, with the control that actually bounds each.

**1 · Money at a provider with no cap.** The most likely 3 a.m. failure is not an adversary, it is a **loop**.
A credit-based generator or a GPU host can burn real money in one, and **nothing in this system today bounds
third-party spend**: `--max-budget-usd` is a stall fuse that binds the model call and *"does not bind the
account"* (§12.9, v23), and our three ceilings are ABSENT. W55 is the sharp version — the servers that hold
credentials, spend money and write into the founder's own workspaces are **user-scope and absent from
`.claude/mcp-policy.json` entirely**, and the two servers the policy does govern hold no credential, which is
precisely why it blocks nothing. **Bound this at the provider.** A cap in the provider's console holds when our
launcher has a bug, when a hook fails open, and when a model is fully persuaded. A cap we compute does not.

**2 · An outward act to a real person or the public.** Irreversible in public; the recall window is a recall,
not an undo, and §12.2 already says the receipt must say so. Bounded by layer 3 (the Sender) **and only while
the trifecta split holds at dispatch** — three of fourteen roster agents carry a shell, and for those the
Sender is bypassed rather than defeated, with nothing observing it (P5 §4).

**3 · Founder data written or deleted in a workspace the founder owns.** Notion, Drive, design workspaces —
user-scope MCP, out of the policy's scope by design (W55). Sometimes recoverable; the founder does not know it
happened. Bounded only by layer 2, tool absence.

**4 · Destruction of local work.** The one control that genuinely stops this is `pre-tool-use.sh`, and **§2
shows it does not run at night.** This is the single largest gap between what the repository believes it has
and what a night child actually carries.

**5 · The harness disarming itself.** In T2 this is covered twice — `pre-tool-use.sh`'s write-outside-root rule
and the runtime's documented **protected paths** (P4 part 5: the `.claude` settings files, `skills`, `agents`,
`commands`, `hooks`, `.mcp.json`, and *"there is no way to exempt one of these paths"*). In T1 neither applies.
**What does survive is `--restricted` itself**, which the vendor's `--help` says *"lets only a person or the
configured permission handler approve writes to settings, git and tool-configuration files"* (quoted in P4
part 6, P1 §9.2). Worth naming loudly: **`--restricted` is the one control on this page that travels into the
night on argv rather than in a file.**

**6 · Cross-venture contamination.** Layer 9, ⟨DEFERRED⟩.

### 5.1 · The ranking's own conclusion

**Rows 1, 2 and 3 are all outward, and not one of them is touched by anything in the filesystem layer.** The
filesystem layer bounds row 6 and helps with row 4. That asymmetry is the argument for spending the next unit
of effort on credential shape and tool absence rather than on paths.

### 5.2 · The worktree with no push — get the mechanism right

A linked worktree **shares `.git`, including remotes**, so "remove the remote" is not available: it would remove
it for every worktree. Two mechanisms actually work, and they are not equal:

- **Durable: no push credential in the night's reach.** A push needs an identity. If the night's credential set
  contains no GitHub write credential — §4.3's second keychain, locked — then `git push` fails at the
  credential, not at a rule, and it fails for every spelling of the command. Cost: night work lands locally and
  promoting it is a morning act or the Sender's, which is the correct shape anyway.
- **Cheap: `permissions.deny: ["Bash(git push*)"]` in the per-child `--settings`.** Measured tier (R28,
  P1 §8.4). **A speed bump, not a wall** — `permissions.deny` is believed to match command strings rather than
  parsed input (P5 §8.1, load-bearing and unmeasured), so a run that wants to push can spell it differently.

**Take both, and do not mistake the second for the first.**

---

## 6 · What replaces the classifier — what actually runs in a dispatched child

Assume the classifier is gone (§1). What remains, and where does each one actually execute?

| Candidate | Runs in a `-p --restricted` child launched from launchd? | Note |
|---|---|---|
| Auto-mode permission classifier | **No** (assumed; R46 measuring) — and the design already sets `--permission-mode dontAsk --permission-prompts none` | model in the loop; unavailable by definition |
| `pre-tool-use.sh` — project-tier hook | **No** — inference from R28 + L62–72 (§2) | the settling cell is in §11 |
| Hooks delivered **in `--settings`** | **Yes** — R28 measured `--settings` honoured under `--restricted`; P1 §3b saw `SessionStart` fire in a child whose sandbox started | this is where the `PreToolUse` rules must go |
| **`--tools`** | **Yes.** Deterministic, no model, fails closed | **the strongest control available at night** |
| Managed `permissions.deny` | **Yes**, and a running process cannot clear it | the file is **ABSENT** and writing it is a **founder act** (admin, outside the repo) |
| `permissions.deny` in `--settings` | **Yes** (tier measured) | the dispatcher owns the file — which is why O131 exists |
| Sandbox `denyWrite` / `network` | **Only if the child's own sandbox starts.** From launchd the parent is unsandboxed, so **PREDICTED yes; unmeasured** (P3 §8) | ⟨DEFERRED⟩; governs Bash only |
| The verb table | compile-time, not runtime | ABSENT |

**The recommendation is one sentence: an agent with no `Bash` cannot run a command, and that is the only item
in this list that cannot be talked around.** §12.7 already counts eleven of fourteen roster agents with no
shell. So **split the night by whether the run needs one**:

- **No-shell runs** — scout, reviewer, guard, challenger, analyst, and every read-and-report brief — can be
  given wide latitude, because their blast radius is bounded by an enumerable tool list and by nothing else
  needing to be true. This is where most of the night's value is, and it is the cheapest half to make safe.
- **Shell-carrying runs** — the three that build — get their own worktree, no credential in the environment,
  a `--settings` file with the `PreToolUse` hook block, and a `denyWrite` list ⟨DEFERRED⟩. And they are the
  runs where every other layer has to be right.

### 6.1 · A contradiction that falls out of this and decides the whole builder band

**P1 states twice that `--restricted` also removes `Bash`** (§9.2: *"note the cost — `--restricted` also
removes Bash, so it is not a drop-in for a dispatcher that needs a child to run commands"*; §10.2: *"there is
no Bash to probe with"*, which is why its `--restricted` cells used a `Read`-tool probe instead). If that is
right, then **§C.1's band 2 — *"`dontAsk` with `--restricted` and an explicit `--tools`"* — cannot build
anything**: no `npm test`, no `git commit`. And the fork matters far beyond convenience, because **dropping
`--restricted` to get a shell also drops the refusal of `bypassPermissions`** (P1 §9.2, exit 1 in 0.1 s) —
which is W50's 8-of-9 unconfinement path — and re-admits the project settings tier.

**No cell in the panel isolates this, and P4's verbatim `--help` quote of `--restricted` does not mention
Bash.** So it is stated here as load-bearing and unsettled, with the cell named in §11. **It is the cheapest
open question in this document and it decides more than any other.**

---

## 7 · The injection path, honestly

**This is the threat with the worst ratio of likelihood to coverage, and nothing in the system addresses it.**
Six of seven inbound doors poll **outbound** — Gmail, Calendar, Drive, Stripe, GitHub, Slack — so the
inbound-`bind()` denial gates this system's own components and no adversary (W53, close-W R6). The attack is:
the run *fetches* attacker-influenced text and then *acts on it with tools*. Measured: the `PreToolUse` matcher
is `Bash|Edit|Write|NotebookEdit|mcp__`, so **`WebFetch`, `WebSearch`, `Read` and `Task` are matched by no hook
at all**; the only content-aware guard in the repository classifies *destinations*, not payloads. And the
vendor's own recommendation for untrusted content is a VM, not the Bash sandbox.

### 7.1 · What would actually reduce it

**a · Separate the poller from the actor, and make the boundary a file rather than an instruction.** §12.8
already specifies this: `bin/inbound` writes one row and does nothing else, and no model reads a stranger's
text with a tool in its hand. Keep it exactly as written. **ABSENT.**

**b · Never let fetched content reach a run that holds a credential — enforced at dispatch, not in prose.**
§12.7's mechanism already says `bin/run` refuses a brief whose grant carries both an outside-reading tool and
any of `Write`, `Edit`, `Bash` or a reaching tool. **ABSENT.** Two additions this design would make:

- **Extend the refusal to credential-bearing MCP servers**, not only to `Write`/`Edit`/`Bash`. The money and
  the founder's workspaces are behind MCP, and W55 shows the policy layer governs none of it.
- **Close the transitive path, which is open today.** The plan's boundary is *"scout returns facts only,
  quoted, with URL and date."* **A quoted attacker sentence in a handover is still attacker text in the
  actor's context**, and the summarising step is a model — the very thing under attack. The durable form is a
  data-shape change, not a prompt: **the handover carries a taint flag, and a tainted handover may be read by a
  run with no outward leg.** It does not forbid acting on what was learned outside; it forbids acting **in the
  same run**. A `which` staged for the founder is the exit, which is the shape §12.2 already uses.

**c · Bound the destination set** ⟨DEFERRED⟩. Not because it inspects payloads — it cannot — but because
**exfiltration needs a destination and a night child's is small and known at dispatch**. P5 ranked this its
number one and it is right: it is the only item that converts *the Sender is the only thing that sends* from a
convention into a boundary. Two costs to carry into the template author's decision: there is **no HTTP-method
allowlist** (close-C R2, absence established by search over the shipped binary), so v68's method filtering is
ours or it is dropped; and whether the domain policy governs `WebFetch` as well as the sandboxed shell is
**unmeasured**.

### 7.2 · What is merely comforting — say it plainly

- **Instructions telling the model to treat fetched text as data.** A persuaded model is persuaded. Layer 13.
- **The browser URL classifier.** It classifies destinations, not payloads, and would allow all six doors
  (P2 §2).
- **`--strict-mcp-config`.** Real for *which servers exist*; nothing about payloads.
- **The sandbox in any configuration.** The attack never crosses that perimeter (P2 §2). Stated as a fact about
  coverage, not as a posture recommendation.
- **Marking a run "read-only" and letting it write a handover another run executes.** This is a laundering
  path and it is the one the plan currently has. §7.1c is the fix.

---

## 8 · The morning — what must be true at the briefing

**A control that refuses silently teaches nothing, and it does something worse: it teaches the founder the
system is safe when what actually happened is that nothing was tried.** Six rows, each **written by the
mechanism that refused**, never reconstructed afterwards:

1. **Every brief the Watch refused, with the gate number and the printed reason.** §4.1 already specifies this
   for gate 9; extend it to all ten stopping gates. Cheap, deterministic, and it is the only view of what the
   night *wanted* to do.
2. **Every tool call denied, and by which mechanism — and here is the honest limit.** A `permissions.deny`
   refusal and a sandbox denial produce an error in the child's transcript. **A tool omitted from `--tools`
   produces nothing at all**: the model simply works around an absence it cannot see, and no record exists
   anywhere. So *"what a run attempted and was refused"* is **structurally only partly recoverable, and the
   unrecoverable part is the most common one.** The consequence is a design rule: **a run cannot report a
   capability it never had, so the briefing states the loadout, not only the denials** — one line per run
   naming the tools it held and the credential class it could reach. That is the only honest form of *what was
   it prevented from doing*.
3. **Every sandbox escalation, as an event row.** O31 already says this and it is the right shape; both escape
   hatches are used today and recorded nowhere.
4. **Every outward act staged and not sent, with its age.** A staging queue that grows is a control working; a
   staging queue that grows **unread** is a control that has quietly become a backlog, and only the age column
   tells them apart.
5. **Every credential reach: succeeded · failed-fast · not attempted.** This is where §4.3 pays off twice —
   `rc=152` is a loud, dated, deterministic event, which is the best possible input to a morning briefing, and
   it distinguishes *the credential was locked* from *nothing tried*.
6. **Spend, from two sources.** Model spend read from `modelUsage` and never from `usage.*`, which **scores a
   compaction as free** (W46). Third-party spend read **from the provider**, not from our own count — and
   where the provider exposes no balance read the line must say `unknown from here` rather than omit itself.
   O32 measured that this is already the case for at least one provider.

**And the line worth fighting for: an empty briefing must state which instruments were read to produce it.**
Otherwise a quiet night and a broken writer are byte-identical — which is the failure this repository has
already had twice, in `.qa/verdicts/` read as empty and in a `parseCiSteps` that reported a clean parse after
a control was deleted. O15's reconciler writing `orphaned` rather than `finished` is the same instinct,
generalised.

---

## 9 · The three things I would do first

**1 · Create one dedicated, provider-capped, independently revocable credential per purpose. Founder act.**
*Cost:* an hour across the provider consoles, plus giving up the convenience of the founder's own key. *Why
first:* it is the only control on this page that holds when every line of Keel is wrong, and **the only one the
founder can complete today with nothing built.** Everything else here waits on `bin/run`.

**2 · Run the one cell that decides the builder band: does `--restricted` remove `Bash`?**
*Cost:* one `claude -p` invocation —
`claude -p 'run: echo hi' --restricted --tools Bash --output-format json --no-session-persistence`, and look
for whether the command ran. *Why:* §6.1. Band 2 of §C.1 either exists as specified or does not, and the same
answer decides whether a night builder keeps `--restricted`'s refusal of `bypassPermissions` — which is W50's
8-of-9 unconfinement path. No other cell in this document changes as much for as little.

**3 · Put `PreToolUse` and `SessionStart` into O131's template, in the spec, now.**
*Cost:* two lines in the spec of a program that does not exist yet — so **nothing today, and a whole class of
silent failure later.** As the design stands, tonight's child would run with no constitution (P3's finding) and
**no destructive-command guard** (§2's finding), and both are invisible from inside the run. This costs nothing
to decide now and cannot be discovered cheaply after the fact.

*A fourth, which is the founder's alone and is not mine to order:* decide, per venture, whether any spending or
sending class may ever run untapped. §4.3 makes the default *no*, and it is a real capability given up.

---

## 10 · What would prove me wrong

1. **R46 finds the classifier present in a `-p` child.** Then §1's assumption is pessimistic, layer 13 is much
   stronger than ranked, and the night is better defended than this page claims. Nothing here becomes wrong;
   the urgency of §9.3 falls.
2. **`--restricted` keeps project-registered hooks.** Then §2's third and fourth rows are wrong,
   `pre-tool-use.sh` binds the night, and §9.3 is unnecessary. This is the single largest correction available
   to this document, and the cell is one line (§11).
3. **`--restricted` keeps `Bash`.** Then §6.1's contradiction dissolves and band 2 stands as written.
4. **A provider that matters exposes no spend cap.** Then layer 1 collapses to *watch the balance and hope*,
   §5's rank 1 loses its only real control, and the answer to the founder's question becomes materially more
   negative than §0 states.
5. **A year of night runs in which no run ever reached for a credential it should not have had.** Then §4.3's
   locked keychain was ceremony, and the tool list was the whole system.

---

## 11 · What I could not determine

Recorded as unmeasured rather than guessed, each with the cell that settles it.

- **Whether the classifier exists in a `-p` child.** R46 is measuring; I assumed absence and designed for it.
- **Whether `--restricted` discards project-registered *hooks*, not merely project settings values.** R28 used
  `model` as its observable. *Cell:* register a marker `SessionStart` or `PreToolUse` hook in
  `.claude/settings.json`, run `claude -p --restricted`, look for the marker. **This decides §2's third row,
  which is this document's own headline finding.** I am not confident enough in it to have written it without
  this line, and nobody should build on it without running the cell.
- **Whether `--restricted` removes `Bash`.** §6.1. P1 asserts it twice and built its own probes around it; no
  cell isolates it; P4's verbatim `--help` quote does not mention it.
- **Whether the default keychain ACL prompts for a second binary.** close-C R3's own RESIDUE — both items were
  read by the `/usr/bin/security` that created them. *Cell:* one read of the same item by a different
  executable. **Until it is run, do not build a control on per-item ACLs**; the *lock* policy is measured and
  the ACL is not.
- **Whether a launchd-spawned `claude -p` starts its own sandbox.** PREDICTED, not measured (P3 §8, blocked on
  a founder install). Decides whether layers 9 and 10 exist at all in T1.
- **Whether `network.allowedDomains` governs `WebFetch` as well as the sandboxed shell.** Decides whether §7.1c
  covers the tool half or only the Bash half.
- **Whether `permissions.deny` matches command strings or parsed tool input.** P5 §8.1. Load-bearing under
  §5.2's speed bump and under §3.1.
- **Which providers actually offer a spend cap.** I did not check: it needs a fetch I do not hold and a look at
  the founder's own accounts. O32 measured only that RunPod exposes a balance read and Higgsfield does not,
  which is a different question. **Layer 1 is ranked first on an assumption about the world that this document
  did not verify**, and that is the largest unverified premise on the page.
- **Anything about what the other panel lanes are doing now.** I read their returned files and nothing live.

---

## 12 · Claims this design would register — proposed; nothing appended

*This lane holds no `claim-append`. Someone with the tool should register these.*

| id | claim | kind | verified_by | valid_until |
|---|---|---|---|---|
| `c-night-child-carries-no-project-hooks` | Both hooks this repo relies on — `PreToolUse`/`pre-tool-use.sh` and `SessionStart`/`session-start.js` — are registered in the project tier, which a `--restricted` night child discards; so the destructive-command guard does not bind the night | project | command (the marker-hook cell, §11) | 2026-12-07 |
| `c-keychain-lock-fails-fast` | A locked keychain refuses a detached read immediately with `errSecInteractionNotAllowed` rather than hanging, which makes lock state a usable unattended control | project | command (close-C R3 `kc2.py`, re-run) | 2026-12-07 |
| `c-max-budget-binds-no-account` | `--max-budget-usd` bounds a child's model spend and binds no third-party account, so no mechanism in this system caps provider spend | project | command | 2026-12-07 |
| `c-tool-absence-is-the-only-unwalkable-control` | Of the controls available to an unattended child, only the absence of a tool from `--tools` cannot be reached around by a run that holds a shell | global | judge (≥2 families) | 2027-03-07 |
| `c-restricted-removes-bash` | `--restricted` removes `Bash`, so `--restricted` and a building night child are mutually exclusive | project | command (the §9.2 cell) | 2026-12-07 |

---

## 13 · Single-family caveat

One model family, one agent, one pass, designing safety **for its own runtime**, on evidence produced by the
same family on the same machine on the same day. That is the weakest possible position for a safety review and
it should be read that way. **I ran no cells of my own:** every measurement cited is another lane's, and my two
original findings — §2's third row (the destructive-command guard does not reach the night) and §6.1's
`--restricted`/`Bash` fork — are **inferences from two measured facts each**, not measurements, and both name
the cell that settles them. Where I state a negative — no HTTP-method allowlist, no third-party spend cap, no
record of a tool that was never granted — read it as *not found by these reads of these lanes' returns*, and
each says which. The `irreversible` tier's 2-of-3 multi-judge and its ≥2-distinct-model-family predicate are
**unmet on every line above**. This is not an independent panel, and the two conclusions most worth a second
family's eyes are §0's central claim that shape beats permission unattended, and §7.1c's taint-flag proposal,
which changes a data shape the whole plan reads.
