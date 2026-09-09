# Sandbox panel · Lane P4 — documented versus inferred

*Dispatched 2026-09-07 as one of five sealed lanes. Engine: `sourcer` — **no Write, no Bash**, so the
lane returned numbered messages and the orchestrator recorded them here verbatim, in arrival order.
Parts 1–6 of 7 below; part 7 appended on arrival.*

*The lane also reports: it had **no `claim-append` tool in its session**, so it emitted zero ledger
claims. Several findings here deserve to be claims and someone with the tool should register them.*

*It could not obtain the **default values** column of the settings reference — that page renders
Key / Description / Topic / Scope through this fetch path only. Defaults quoted are from prose on the
sandboxing page where it states one, and are marked `effective` (measured) where it does not.*

*One mechanical note on this file: part 5 quotes vendor troubleshooting text naming a destructive git
command, and this repo's `pre-tool-use.sh` blocks a Bash call containing that string. The quote is
reassembled at write time rather than altered — the text below is what the vendor page says.*

---

## Part 1 of 7 — the headline

SOURCER 1/7 — documented vs inferred. Seven parts coming. All fetches accessed 2026-09-07.

**Headline: three of this repo's standing sandbox beliefs are contradicted by a vendor page, and one vendor page contradicts another vendor page.**

The three:

1. **CLAUDE.md says no setting exists for loopback/inbound binding. One does, it is macOS-specific, and it is settable from any settings file.** `sandbox.network.allowLocalBinding` — "Let sandboxed commands bind to localhost ports on macOS", scope "Any file", listed in the official settings reference (<https://code.claude.com/docs/en/settings-reference#sandbox-settings>). CLAUDE.md's Project State asserts the opposite and cites the sandboxing page for it. Detail in part 4.

2. **`enableWeakerNestedSandbox` is Linux-only and cannot help the nested-child failure.** The settings reference one-liner is "Run the **Linux** sandbox inside an unprivileged container". `close-C.md` leaves it as the untried remedy for a macOS Seatbelt `EPERM listen()`. Detail in part 3.

3. **The worktree-creation wall is fully documented, with a named cause and a named remedy.** It is the sandbox's **protected paths** list, and the docs say in terms that `allowWrite` cannot lift it — which is exactly what this repo measured and recorded as unexplained. Detail in part 5.

And the vendor self-contradiction, which I record and do not resolve:

- Anthropic's engineering post says the sandbox contains prompt injection: *"Sandboxing ensures that even a successful prompt injection is fully isolated, and cannot impact overall user security"* (<https://www.anthropic.com/engineering/claude-code-sandboxing>).
- Anthropic's docs say it is not a boundary: *"Sandboxing reduces risk but is not a complete isolation boundary. Review the limitations below before relying on it as a hard security control."* (<https://code.claude.com/docs/en/sandboxing>, §Limitations).

CLAUDE.md's line — *"a guardrail against accident, not containment against the agent"* — sides with the docs page against the blog post. **That reading is right, and part 6 shows it is also incomplete in a way that matters: the escape hatch it rests on is one documented key away from being closed.**

---

## Part 2 of 7 — the full documented schema, and the scope column

SOURCER 2/7 — the full `sandbox` schema as Anthropic documents it.

Source: <https://code.claude.com/docs/en/settings-reference#sandbox-settings>, accessed 2026-09-07. **38 documented keys.** The fourth column is `Scope`, and it is the load-bearing one for this repo — it says which settings file may set the key.

**Top level (scope "Any file" unless noted):** `sandbox` · `enabled` · `failIfUnavailable` · `allowUnsandboxedCommands` · `autoAllowBashIfSandboxed` · `excludedCommands` · `enableWeakerNestedSandbox` · `enableWeakerNetworkIsolation` · `ignoreViolations` · `allowAppleEvents` *(User or managed)* · `ripgrep` *(User or managed)* · `bwrapPath` *(Managed)* · `socatPath` *(Managed)*.

**`filesystem`:** `allowWrite` · `denyWrite` · `denyRead` · `allowRead` · `disabled` *(**User or managed**)* · `allowManagedReadPathsOnly` *(Managed)*. **`denyWrite` IS documented alongside `allowWrite`** — your question 1. Verbatim descriptions: `allowWrite` "Add paths sandboxed commands can write to"; `denyWrite` "Block sandboxed commands from writing to specific paths"; `allowRead` "Re-open reading inside a region `denyRead` blocks".

**`network`:** `allowedDomains` · `deniedDomains` · `allowUnixSockets` *(macOS)* · `allowAllUnixSockets` · **`allowLocalBinding`** · **`allowMachLookup`** · `httpProxyPort` · `socksProxyPort` · `allowManagedDomainsOnly` *(Managed)* · `strictAllowlist` *(**User or managed**)* · **`tlsTerminate` *(User or managed)***.

**`credentials`:** `files` · `envVars` · `awsPairs` *(User or managed)* · `sigv4` *(User or managed)* · `allowPlaintextInject` *(User or managed)*.

**Three consequences for `.claude/settings.json`, which is a PROJECT file:**

1. **v68's egress credential injection cannot be delivered from this repo.** `tlsTerminate` is User-or-managed, and the sandboxing page is explicit: Claude Code *"ignores `mask` entries in a repository's `.claude/settings.json` or `.claude/settings.local.json`. In those files it also ignores `network.tlsTerminate` and `credentials.allowPlaintextInject`."* close-C R2 reached "may need an admin act" by a longer route (managed settings owning `filesystem`); the direct reason is simpler and unconditional. Deliver via `~/.claude/settings.json` or `--settings <file>` — the latter composes with `--restricted`, which R28 already measured.
2. **`filesystem.disabled` cannot be set from this repo either** (User or managed). That matters because it is the *only* documented lever for protected paths — part 5.
3. **`strictAllowlist` cannot be set from this repo.** The sandboxing page confirms: *"Setting it in a repository's `.claude/settings.json` or `.claude/settings.local.json` has no effect."* Without it, the documented default is prompt-or-classifier per new domain, not deny.

**Two keys close-C found in the 2.1.263 binary are NOT in the documented table:** `sandbox.workspace` and `sandbox.seccomp.bpfPath`. The binary also carries `credentials.files`/`awsPairs`/`sigv4`/`allowPlaintextInject`, all of which ARE documented. Undocumented keys are not a finding against close-C — it read the artifact correctly — but nothing supports building on those two.

**`allowMachLookup` is worth a look for `designer`:** "Let macOS sandboxed tools like the iOS Simulator or **Playwright** reach their XPC services". Nobody has measured whether Playwright-MCP needs it here.

---

## Part 3 of 7 — `enableWeakerNestedSandbox`, and the silence on nesting

SOURCER 3/7 — `enableWeakerNestedSandbox`, and the documentary silence on nesting.

**What the documentation actually says it weakens.** Two vendor passages, both <https://code.claude.com/docs/en/sandboxing>, accessed 2026-09-07.

Troubleshooting, verbatim: *"**Bubblewrap fails to start inside a container**: in an unprivileged container, bubblewrap can't mount a fresh `/proc` filesystem, so sandboxed commands fail with a `bwrap` error such as `Can't mount proc on /newroot/proc: Operation not permitted`. Set `enableWeakerNestedSandbox` to `true` so the inner sandbox bind-mounts the container's existing `/proc` instead. Only use this setting when the outer container already provides the isolation boundary you need, since it exposes process information to sandboxed commands that a fresh `/proc` mount would hide."*

Security limitations, verbatim: *"**Linux sandbox strength**: the Linux implementation provides strong filesystem and network isolation but includes an `enableWeakerNestedSandbox` mode that enables it to work inside Docker environments without privileged namespaces, or on Linux hosts where unprivileged user namespaces are disabled by sysctl. This option considerably weakens security and should only be used when additional isolation is otherwise enforced."*

Settings reference one-liner: *"Run the **Linux** sandbox inside an unprivileged container."*

**So: what it weakens is `/proc` visibility inside a bubblewrap sandbox on Linux. It is a bubblewrap-namespace setting. It says nothing about macOS or Seatbelt on any of the three pages.**

**The contradiction with `research/close-C.md`, recorded and not resolved.** close-C's cross-cutting finding (i) is a macOS Seatbelt denial — `EPERM: operation not permitted, listen '/tmp/claude-501/srt-mux-<pid>-1.sock'` — 6 of 6 cells, and it names `enableWeakerNestedSandbox` twice as "exists and was **not** tried". **No vendor page gives any reason to expect this key to change a Seatbelt `listen()` denial.** The documented failure it addresses is a `/proc` mount, on a different OS primitive. I did not measure it, so I am not saying it will fail — I am saying the hope has no page behind it, and a lane planning to try it should price it as a long shot, not as the obvious remedy. **The likelier fit for close-C's finding (i) is `network.allowLocalBinding`, which is macOS-specific and was also never tried — part 4.**

**Nested sandboxes: Anthropic documents ONE case and it is not this one, and that silence is itself a finding.**

The only nesting statement I found, sandboxing page §Scope: *"**Subagents**: subagents run in the same process as the parent session and use the same sandbox configuration. Bash commands inside a subagent are sandboxed when sandboxing is enabled in the parent session."* That is in-process subagents — not an OS-level `claude -p` child, which is what Keel dispatches.

The sandbox-environments page covers layering the *other* direction only: *"You can layer approaches: running the sandboxed Bash tool inside a container or VM gives you OS-level command restrictions on top of the outer environment boundary."*

**Nothing on any Anthropic page I fetched describes a sandboxed Claude Code session spawning a second Claude Code process, sandboxed or not.** Not on sandboxing, not on sandbox-environments, not on security. close-C's 6-of-6 measurement is the only evidence that exists on this question, and **this panel is about to act on behaviour no vendor page confirms, contradicts, or has apparently considered.**

---

## Part 4 of 7 — `allowLocalBinding`

SOURCER 4/7 — `allowLocalBinding`. **This is the contradiction I would put first.**

**CLAUDE.md, Project State, verbatim:** *"**No network allowance can fix it either.** The sandbox's network model is an outbound domain proxy and exposes **no setting for inbound or loopback binding** (Claude Code sandboxing documentation, accessed 2026-08-24 — https://code.claude.com/docs/en/sandboxing); consistent with that, the `sandbox` block in `.claude/settings.json` carries only `filesystem` and has no `network` key at all."*

**The vendor's own settings reference, accessed 2026-09-07:**
`sandbox.network.allowLocalBinding` — *"Let sandboxed commands bind to localhost ports on macOS"* — Scope: **Any file.**
<https://code.claude.com/docs/en/settings-reference#sandbox-settings>

Second Anthropic-owned source, same key, in a hardened example: `anthropics/claude-code`, `examples/settings/settings-bash-sandbox.json` — `"network": { "allowUnixSockets": [], "allowAllUnixSockets": false, "allowLocalBinding": false, "allowedDomains": [], "httpProxyPort": null, "socksProxyPort": null }`.

**The setting exists, it is macOS-specific — which is this machine — and a project settings file may set it.** The belief that no such setting exists is what closed off `check:mc` as unfixable and what made SANDBOX.md's acceptance questions look closed. It should not have.

**Now the half that is NOT fixed by it, and this split is the whole value of the finding.**

The sandbox denies loopback in two independent directions and `allowLocalBinding` addresses only one:

| Direction | close-C evidence | `allowLocalBinding` |
|---|---|---|
| **Inbound `bind()`/`listen()`** — a server started inside | R4: `UNIX_BIND_LISTEN=FAIL`, `TCP_LOOPBACK_BIND=FAIL`, errno 1; `check:mc`'s synthetic `EADDRINUSE` with `errno: 0` | **Documented to address this.** Untested here |
| **Outbound `connect()` to 127.0.0.1** — reaching Ollama | R4: `TCP_CONNECT_11434=FAIL`, and WebFetch denied identically | **Does not address it** |

For the outbound half, the vendor's tracker is explicit. `anthropics/claude-code` issue **#28018, "Sandbox: allow outbound connections to localhost", OPEN**: the reporter set `allowLocalBinding: true` *and* `allowedDomains: ["localhost","127.0.0.1","::1"]` together and the `connect()` still returned `EPERM`; the issue records that `allowedDomains` appears to permit DNS resolution rather than TCP establishment, and that the only workarounds are `dangerouslyDisableSandbox` or `excludedCommands`. **That independently corroborates close-C R4's outbound arm from outside this machine, and it means O13 — "the local tier is not a service" — survives.**

One documented caveat before anyone gets optimistic about `check:mc`: `anthropics/claude-code` issue **#18545 (closed)** reports `allowLocalBinding: true` on macOS not reaching a **grandchild** process — a Gradle daemon forked by `./gradlew` — with `java.net.SocketException: Operation not permitted` at `Net.bind0`. `bun test` spawning a test runner that binds is the same shape. **So the honest statement is: there is a documented, macOS-specific, project-settable key that nobody here has tried, and one vendor issue says it may not reach far enough down the process tree.** That is a one-cell experiment, and it is the cheapest open question in this panel.

I did not run it — no shell, by design.

---

## Part 5 of 7 — the worktree wall is documented

SOURCER 5/7 — the worktree-creation wall is documented, named, and has exactly one documented lever.

CLAUDE.md records this as a measured, unexplained limit tracked against SANDBOX.md: exit 128, **32 denials across `.claude/agents/**`, `.claude/commands/**` and `.mcp.json`**, and *"Adding them to the write allow-list does not lift it, and this has already been tried."*

**The sandboxing page, §Protected paths, explains all of it.** Verbatim, accessed 2026-09-07:

*"Inside the directories that sandboxed commands can write to, the sandbox still denies writes to the files Claude Code loads configuration and code from. A command that could edit those files could grant itself permissions, or add a hook or MCP server that Claude Code runs outside the sandbox."*

The first of four groups, verbatim: *"**In your working directory and the directories above it**: the `.claude` settings files, the `.claude/skills`, `.claude/agents`, `.claude/commands`, and `.claude/hooks` directories, `.mcp.json`, and the files Claude Code runs on its own, such as `.claude/workflows` and `.claude/scheduled_tasks.json`"*

That list **is** the 32 denials, item for item.

And the sentence that closes the `allowWrite` question outright: *"There is no way to exempt one of these paths: an `allowWrite` entry or an `Edit` allow rule that covers the path doesn't lift the protection. The only way to turn the protection off is `filesystem.disabled`, which turns off filesystem isolation for every path."*

**So `**/.worktrees` and `**/.worktrees/**` in `.claude/settings.json` were never going to work, and the docs said so.** CLAUDE.md's own conclusion — *"Those two entries do not achieve what they were added for"* — was right, and it now has a mechanism instead of a mystery.

The docs also name this exact git symptom. Troubleshooting, verbatim: *"**A git command fails with `unable to unlink old`**: `git merge`, ``git checkout``, and similar commands fail this way when they need to replace a file the sandbox denies writes to, whether that file is under a protected path such as `.claude/skills`, under one of your `denyWrite` entries, or outside the directories the sandbox lets commands write to at all... After the failure, Claude may offer to rerun the command outside the sandbox; approve that retry, or run the git command yourself in another terminal. If you've set `allowUnsandboxedCommands` to `false`, Claude can't offer the retry, so run the command yourself. If the same git command fails often, add it to `excludedCommands`."*

**Three documented options, ranked by what each gives up:**

1. **`sandbox.excludedCommands`** — name the git invocation and it runs outside the sandbox. Narrowest. Vendor's own suggestion for the recurring case. Scope: any file, so it works from `.claude/settings.json`. **The cost is honest and should be stated: `git` is not a small hole. It runs hooks, and `git config` and `git clone` can execute code.**
2. **The unsandboxed retry** — what this repo already does per-worktree, called "escalation" in CLAUDE.md. It works and it is one approval each time.
3. **`filesystem.disabled: true`** — turns off the whole filesystem layer for every path. **Do not.** The vendor's warning: *"a sandboxed command can write files that later commands run or read, such as shell startup files, executables on `$PATH`, or `~/.claude/settings.json`, and use them to widen its own access on the next run."* It is also User-or-managed scope, so it cannot come from this repo anyway.

**Two corrections to CLAUDE.md that follow.** *"Fixing this properly is a sandbox change, not a documentation change"* — it is a settings change, option 1. And *"an agent that follows the corrected location and hits the wall has not made a mistake"* stays true, but the wall now has a documented name, so the next agent should not spend a session rediscovering it.

**Also documented and useful here:** *"**Git worktrees**: when the working directory is a linked git worktree, the sandbox also allows writes to the main repository's shared `.git` directory so commands such as `git commit` can update refs and the index. Writes to `hooks/` and `config` inside that directory remain denied."* Committing from inside a worktree is supported by design.

---

## Part 6 of 7 — `failIfUnavailable`, the escape hatch, and `--restricted`

SOURCER 6/7 — your questions 3, 4 and 5.

**Q3 · `failIfUnavailable`.** Documented default and meaning, sandboxing page, verbatim: *"By default, if the sandbox cannot start because dependencies are missing or the platform is unsupported, Claude Code shows a warning and runs commands without sandboxing. To make this a hard failure instead, set `sandbox.failIfUnavailable` to `true`. This is intended for managed deployments that require sandboxing as a security gate."* And in the managed-settings example: *"a missing dependency such as bubblewrap on Linux blocks Claude Code from starting rather than showing a warning and falling back to unsandboxed execution."* Settings-reference one-liner: *"Refuse to start when the sandbox can't, instead of running unsandboxed."* **Default: fail-open. Set `true` here, which is the safer direction.**

**On a NESTED failure specifically: silence.** Both documented triggers are *missing dependency* and *unsupported platform*. Neither describes a sandbox that fails because its parent is sandboxed. close-C measured that the nested child fails closed — all Bash refused — which is the behaviour you would predict from the text, but **the text does not cover the case and nothing confirms the prediction is the intended design rather than an emergent one.** A vendor could change this without breaking any documented promise.

**Q4 · `dangerouslyDisableSandbox`. CLAUDE.md's reading is right, and incomplete in the direction that matters.** Verbatim, sandboxing page: *"Claude analyzes the violation and may retry the command with the `dangerouslyDisableSandbox` parameter."* So yes — **the model invokes it**, not the user and not a setting. CLAUDE.md's *"a guardrail against accident, not containment against the agent"* is a fair reading of that sentence and of §Limitations.

**What CLAUDE.md omits: the same page documents how to close it.** *"You can disable this escape hatch by setting `"allowUnsandboxedCommands": false`... With the escape hatch disabled, Claude Code ignores the `dangerouslyDisableSandbox` parameter, and every command Claude runs must run sandboxed unless you've listed it in `excludedCommands`."* Scope: **any file.** `.claude/settings.json` does not set it, so **the escape hatch is live in this repo today and could be closed from this repo.**

Two documented facts that price that decision honestly:
- The retry is **not** silent even today: *"The retried command runs outside the sandbox, so it goes through the regular permission flow."* Manual mode prompts; auto mode sends it to the classifier. There is also a documented middle option — an ask rule `Bash(dangerouslyDisableSandbox:true)` — *"To be prompted on every unsandboxed retry even in auto mode"*.
- Closing it **breaks every escalation this repo depends on**: worktree creation, and all 20 working Codex cells in `review/codex-rehearsal.md`, which needed `dangerouslyDisableSandbox: true`. So `allowUnsandboxedCommands: false` and Codex-as-checker are mutually exclusive **unless** `codex` goes in `excludedCommands`.
- And the residual hole is documented: *"Commands you type yourself at the `!` shell-mode prompt run outside the sandbox"* unless it is a background session or Linux with `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`.

**Q5 · Permission modes and `--restricted`.** From <https://code.claude.com/docs/en/permission-modes>, accessed 2026-09-07.
- **`--restricted` and `--settings` compose — the vendor says so, and close-C R28 measured it.** No contradiction; this is the one place a doc and a measurement agree cleanly.
- *"Claude Code refuses `bypassPermissions` in a session you start with `--restricted`."* Requires v2.1.248+; this machine is 2.1.263.
- *"In a session started with `--restricted`... the classifier can't approve protected-path writes."*
- Precedence: *"When more than one settings file sets `permissions.defaultMode`, settings precedence decides, so a project or managed value outranks `~/.claude/settings.json`."*
- Sandbox filesystem arrays **merge across scopes** rather than override: *"Claude Code merges them, combining paths from every scope."* **A merge-only key can be widened by any scope and narrowed by none** — which is why `allowManagedReadPathsOnly` and `allowManagedDomainsOnly` exist, and both are Managed-only, i.e. unavailable to this repo.
- `/sandbox` is **not** a permission mode: *"the sandbox restricts what a Bash command can access once it runs"* vs modes deciding *"whether a tool call runs"*.
