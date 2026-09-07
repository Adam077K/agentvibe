# Sandbox panel — lane P1 · THE MEASURER

*Measured 2026-09-07 on `Mac16,12`, Darwin 25.5.0, `claude` 2.1.263, `codex-cli` 0.153.4.
Posture in one line: **the only lane with a shell — turn the four untried settings into facts, or
record honestly that they stayed untried.***

> **Round 2 appended as §8 after PROBE REDIRECT 1.** §8 extends §2 and **supersedes §5 R4**.
> `allowLocalBinding` does more than §2 measured; `sandbox.workspace` is a dead end; two further
> settings paths are closed. Read §8 before acting on §5.

**All four are closed. Two came back negative, two positive, and one of the positives contradicts a
standing claim in `CLAUDE.md`.** A fifth finding nobody asked for is the most important thing in this
file, and it is in §0.

Method throughout: temporary settings files under the lane scratchpad, delivered per invocation with
`--settings <file>` (the mechanism close-C R1 established). **`.claude/settings.json` and
`~/.claude/settings.json` were never written** — mtimes at the close of the lane are 2026-09-05
15:03:54 and 2026-09-06 23:06:47, both predating this session. Every negative has a positive control
in the adjacent cell. Cells live at
`…/scratchpad/p1/cells/*.{json,out,err}`; drivers are `drive.py`, `drive2.py`, `childprobe.py`,
`run_d.py`, `run_e.py`, `run_e4.py`, `run_e5.py`, all re-runnable as written.

**Cost of the lane: 18 `claude -p` child invocations and 3 `codex doctor` runs.** That is over the
~15 the brief suggested; the last three bought the complete Codex recipe in §4 and I judged that worth
naming rather than quietly skipping. **Nothing was left running** — `ps` shows no probe process,
`claude agents --json` returns `[]`, and `~/.claude/session-env` holds neither probe directory.
Nothing installed, authenticated, spent, published or pushed. **No credential was copied anywhere**;
§4 explains the isolation that made that unnecessary.

---

## 0 · The finding nobody asked for: `--permission-mode bypassPermissions` SKIPS SANDBOX INITIALISATION

**A nested child launched with `--permission-mode bypassPermissions` does not start a sandbox, does
not fail closed, and silently ignores its own `sandbox` block — including `failIfUnavailable: true`
and its `filesystem.denyRead` list.** It runs confined only by the parent profile it inherited.

The canary is what makes this unambiguous. Every cell below was given
`filesystem.denyRead: ["<scratchpad>/canary.txt"]` in its own settings, and a probe that tries to read
it:

| Cell | child `sandbox` | `--permission-mode` | `READ_CANARY` | verdict |
|---|---|---|---|---|
| `C1_armed` | `enabled:true, failIfUnavailable:true` + denyRead canary | `bypassPermissions` | **`CANARY-P1-9d4e`** | sandbox never started |
| `C3_weaker` | same + `enableWeakerNestedSandbox:true` | `bypassPermissions` | **`CANARY-P1-9d4e`** | sandbox never started |
| `C5_armed_defaultpm` | `enabled:true, failIfUnavailable:true` + denyRead canary | *(default)* | *Bash refused* | fails closed |
| `C6_armed_acceptEdits` | same | `acceptEdits` | *Bash refused* | fails closed |

`C5`'s verbatim result: `"Sandbox is required but failed to initialize: EPERM: operation not
permitted, listen '/tmp/claude-501/srt-mux-97425-1.sock'. Restart to retry."`

**This reconciles the lane with close-C rather than overturning it.** close-C's "6 of 6 fail closed"
is correct for the default and `acceptEdits` modes. It did not see the `bypassPermissions` cell, and
that cell is the dangerous one, because it *looks* like the sandbox working: Bash runs, the settings
file is accepted without complaint, and nothing anywhere reports that confinement was skipped.

**Consequence for Keel.** Any dispatcher that reaches for `bypassPermissions` to stop a `-p` child
stalling on a prompt has, in the same stroke, turned that child's sandbox block into decoration. If
the plan ever writes `sandbox.enabled: true` into a child's settings and also passes
`bypassPermissions`, the resulting security claim is false and no check in this repository would
catch it.

---

## 1 · `sandbox.enableWeakerNestedSandbox` — CLOSED, NEGATIVE

**It does not let a nested child start a sandbox. It is a Linux key with no macOS implementation.**

Measured, all from a parent whose own sandbox is armed (verified in-lane: `cat ~/.codex/config.toml` →
denied, unix `bind()` → `PermissionError errno 1`, TCP `bind()` → `PermissionError errno 1`,
`mkdir ~/.claude/session-env/probe-p1` → `Operation not permitted`):

| Cell | added to child settings | result |
|---|---|---|
| `C5_armed_defaultpm` | *(nothing — control)* | `EPERM … listen '/tmp/claude-501/srt-mux-97425-1.sock'` |
| `C7_weaker_defaultpm` | `enableWeakerNestedSandbox: true` | **same failure**, "sandbox failed to initialize with a socket error" |
| `C8_unixsock_defaultpm` | `network.allowAllUnixSockets:true, allowLocalBinding:true` | **same failure** |

The documentary half explains why, and it is not a subtle read. In the shipped binary
`/Users/adamks/.local/share/claude/versions/2.1.263`:

- the key is declared `enableWeakerNestedSandbox:O().optional()` — **with no `.describe()`**, unlike
  every neighbouring key;
- its only prose anywhere is a security-posture warning, `"sandbox.enableWeakerNestedSandbox exposes
  the host /proc"` — **`/proc` is Linux**;
- it is destructured **only** by the bubblewrap profile builder (the function taking `--ro-bind`,
  `bwrapPath`, `seccompConfig`). The macOS Seatbelt builder — the one emitting `(version 1)`,
  `(deny default …)` and calling `/usr/bin/sandbox-exec` — destructures
  `enableWeakerNetworkIsolation` and `allowAppleEvents` and **does not take this parameter at all**.

**So the single setting that "may decide whether the night runs at all" decides nothing on this
machine.** The nested wall stands. What clears it is not nesting: see §5, R2.

---

## 2 · `sandbox.network` — CLOSED, POSITIVE, AND IT FALSIFIES A STANDING CLAIM

**`sandbox.network` is accepted, is honoured, and bites.** Two keys were measured to change behaviour.

The rig matters: to see a child's *own* sandbox bite, the parent must be unsandboxed (§1 is why).
Both cells below ran from an unsandboxed parent, so the child's sandbox actually started — and
`READ_CANARY=DENIED` in both proves it started **and** that the settings file was in force.

| probe | `D1_armed_repro` | `D2` (+`network.allowLocalBinding`, `allowAllUnixSockets`) |
|---|---|---|
| `READ_CANARY` (denyRead set in both) | `DENIED:PermissionError:1` | `DENIED:PermissionError:1` |
| `BIND_UNIX` | `DENIED:PermissionError:1` | **`BIND_OK`** |
| `BIND_TCP` | `DENIED:PermissionError:1` | **`BIND_OK:58915`** |
| `SESSION_ENV_MKDIR` | `DENIED:PermissionError:1` | `DENIED:PermissionError:1` (see §3) |

Unconfined control, same probe, sandbox off: `READ_CANARY=CANARY-P1-9d4e · BIND_UNIX=BIND_OK ·
BIND_TCP=BIND_OK:58804 · SESSION_ENV_MKDIR=MKDIR_OK`.

`network.allowedDomains` also bites, measured independently in §4: identical cells go from
`HTTP CONNECT failed with status 403` to no 403 on the strength of that key alone.

> **This falsifies `CLAUDE.md`.** That file states the sandbox's network model *"exposes **no setting
> for inbound or loopback binding**"*, cites the vendor docs for it, and builds on it the conclusion
> that `check:mc` is unfixable and that "the local model tier cannot be a service."
> **`sandbox.network.allowLocalBinding: true` is that setting, and it works.** Like
> `enableWeakerNestedSandbox` it carries `.optional()` with no `.describe()`, which is presumably why
> a documentation search missed it — it is absent from the docs and present in the schema. The repo
> reached a correct conclusion *about the documentation* and recorded it as a conclusion about the
> runtime.

Other `sandbox.network` keys present in the schema, quoted from the binary: `allowedDomains`,
`deniedDomains` ("always blocked, even if matched by allowedDomains … Merged from all settings sources
regardless of allowManagedDomainsOnly"), `strictAllowlist` ("the sandbox runtime deterministically
denies hosts not in allowedDomains instead of prompting"), `allowManagedDomainsOnly` (managed tier
only), `allowUnixSockets` (macOS only), `allowAllUnixSockets`, `allowMachLookup`, `httpProxyPort`,
`socksProxyPort`, `tlsTerminate` ("[EXPERIMENTAL] Enable in-process TLS termination so the per-request
filter can see HTTPS request bodies…").

---

## 3 · The `SessionStart` EPERM — CLOSED. It is a WALL for `allowWrite`, and a NESTING symptom

Two separate answers, and the brief was right that the distinction is the whole finding.

**(a) `allowWrite` cannot re-open `~/.claude/session-env`.** Cell `D2` carried
`filesystem.allowWrite: ["/Users/adamks/.claude/session-env", "/Users/adamks/.claude/session-env/**"]`
**in the same settings file whose `network` keys demonstrably bit in the same run**, so this is not a
settings-not-loaded artifact. `SESSION_ENV_MKDIR` stayed `DENIED:PermissionError:1`. This is the same
shape as the worktree paths: the runtime protects it independently of this repo's configuration. The
runtime's own `denyWithinAllow` list names `/Users/adamks/.claude/session-env` explicitly, alongside
`~/.claude/hooks`, `~/.claude/skills`, `~/.claude/agents` and `~/.claude/settings.json`. **It is a
wall, not a config fix.**

**(b) But the EPERM is a symptom of nesting, not of the hook.** In both `D1` and `D2` — unsandboxed
parent — the **`SessionStart` marker FIRED**. The `mkdir` is performed by the child's *claude process*,
which the Bash sandbox does not govern; only the child's Bash commands are confined, which is why the
in-Bash probe was denied in the very same cell where the hook succeeded. close-C's finding (ii) is
therefore correct and its cause is one layer up from where it looked: **`SessionStart` fails when the
parent is sandboxed, because the child process itself is then inside the parent's profile.**

**So the delivery path v97's constitution depends on is not broken — it is broken *when nested under
an armed parent*, and §5 R2 restores it without any new grant.**

One inferential step I could not remove: I may not edit a parent's settings, so "an `allowWrite` in
the *parent* would not help either" rests on both tiers using the same profile builder and the same
`denyWithinAllow` list. Evidence is strong, the step is real, and the managed tier is untested.

---

## 4 · Codex: lifting `denyRead` alone is NOT enough — and here is the recipe that works

**The brief asked whether lifting `denyRead` on `~/.codex` alone makes `codex exec` work sandboxed.
It does not. There are THREE independent blockers, each individually necessary.**

The isolation, which required copying no credential: `CODEX_HOME=<empty writable dir>` removes the
config-read blocker outright while leaving `~/.codex` denied. Sandboxed `codex doctor` then loses its
`✗ config` line and keeps `✗ reachability` — so the network blocker binds with the config blocker
already gone. That is the direct answer.

Then, in child sandboxes that actually start (unsandboxed parent), each knob one at a time:

| Cell | child sandbox | `ChatGPT inference URL` result |
|---|---|---|
| `E1_codex_nosandbox_ctrl` | disabled — **positive control** | `reachable (HTTP 405)` |
| `E2_codex_armed` | armed, no network policy | `connect failed`; `HTTP CONNECT failed with status 403` |
| `E3_codex_weaker_netiso` | armed + `enableWeakerNetworkIsolation` | **still 403** — insufficient alone |
| `E4_codex_alloweddomains` | armed + `network.allowedDomains` | 403 **gone**; reaches OpenAI (`401 Missing bearer` — expected, empty home); but `TLS handshake or certificate validation failed` |
| `E5_domains_plus_weakernetiso` | armed + **both** | **`✓ reachability … reachable (HTTP 405)`** — identical to E1 |

**The recipe, all three necessary:**
1. read access to `~/.codex` (or `CODEX_HOME` pointed at a readable copy) — the config blocker;
2. `sandbox.network.allowedDomains` covering the provider hosts — clears the CONNECT **403**;
3. `sandbox.enableWeakerNetworkIsolation: true` — clears the **TLS/cert-validation** stage.

The vendor names the cost of (3) itself: *"macOS only: Allow access to com.apple.trustd.agent in the
sandbox. Needed for Go-based CLI tools (gh, gcloud, terraform, etc.) to verify TLS certificates when
using httpProxyPort with a MITM proxy and custom CA. **Reduces security** — opens a potential data
exfiltration vector through the trustd service. Default: false."*

**Note what the rehearsal could not have known.** Its sandboxed cell reported *"TLS handshake or
certificate validation failed"*, and reading that as a TLS problem is natural and was my own first
hypothesis. In a child sandbox the first failure is a plain **403 from the egress proxy** — a domain
policy denial — and the TLS stage only becomes visible once the 403 is cleared. The two are stacked,
and any single-knob experiment tests only the outer one.

### The egress mechanism, since three lanes' worth of confusion turns on it

**There is no DNS inside the sandbox.** A raw `tls.connect` to `api.openai.com`, `chatgpt.com`,
`api.anthropic.com`, `github.com` and `registry.npmjs.org` returns `getaddrinfo ENOTFOUND` in 0–12 ms,
every one. Egress is an **authenticating local proxy** — `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY`/
`FTP_PROXY`/`GRPC_PROXY`/`CLOUDSDK_PROXY_*`/`DOCKER_*_PROXY`/`RSYNC_PROXY`/`GIT_SSH_COMMAND` all point
at `localhost:60303` with a per-session basic-auth pair. `NODE_EXTRA_CA_CERTS` is **unset**, so this is
CONNECT tunnelling and `tlsTerminate` is off.

**I record my own method failure here deliberately, because it has exactly the shape of a finding.**
That first `ENOTFOUND` sweep looked like a domain denial and was not — it was me bypassing the proxy.
Re-run correctly as proxy `CONNECT` from this session's parent:
`api.openai.com`, `chatgpt.com`, `api.anthropic.com`, `github.com` → **`200 Connection Established`**;
a nonexistent host → `502`. A resolver keying on "connection failed" would score those two states the
same, which is the Rule 10 hazard the rehearsal already named for `exit 0` vs `exit 1`.

---

## 5 · What I would DO — ranked by what it protects against and what it prevents

**R1 · Never pass `--permission-mode bypassPermissions` to a child that carries a `sandbox` block.**
*Protects against:* believing in confinement that is not there — the worst failure mode available,
since it is invisible. *Prevents:* nothing. *Cost:* none. **Do this first and unconditionally.**

**R2 · Run the overnight parent UNSANDBOXED; sandbox each child individually.**
This is the only posture measured to deliver real per-run confinement: §2 and §3 show `denyRead`,
`denyWrite` and `network.*` all biting in a child whose sandbox actually starts. Under an armed parent
a nested child either fails closed (useless) or runs unconfined (worse than useless), and the same
move restores `SessionStart` (§3b), `git worktree add`, and `check:mc`.
*Protects against:* a child writing outside its worktree or reaching an unapproved domain — enforced
per child, which the current posture does not achieve at all.
*Prevents:* nothing that works today. *Cost:* the top-level process is unconfined. Given `CLAUDE.md`
already concedes the sandbox is *"a guardrail against accident, not containment against the agent"*
because `dangerouslyDisableSandbox` exists, the honest description of this change is **it moves a
guardrail from where it does nothing to where it does something**, not that it removes containment.

**R3 · Confine children with `denyWrite` + `denyRead` + cwd, and `network.allowedDomains` — never
`allowWrite`.** `allowWrite` only widens (close-C R1; re-confirmed here by §3a, where it could not
even re-open a denied path). *Protects against:* cross-worktree writes between parallel lanes, which
`CLAUDE.md` currently records as "a convention they keep, not a rule anything enforces." *Prevents:*
nothing, if the deny list is written against paths the run does not need.

**R4 · Set `network.allowLocalBinding: true` for the mission-control lane.** Measured to flip
`BIND_TCP` from denied to `BIND_OK`. It retires `check:mc`'s exclusion, the synthetic `EADDRINUSE`,
and the "local model tier cannot be a service" conclusion. *Protects against:* nothing — the denial
was breaking a regression test, not stopping an attack. *Prevents:* an inbound listener on loopback.
**Best benefit-to-cost ratio in this document.**

**R5 · For a sandboxed Codex checker, use the §4 recipe — or decide not to bother.** It works; it
costs the trustd exposure the vendor names. For one founder on one Mac with no employees, running
Codex unsandboxed behind the same domain-scoped proxy is close to the same real exposure with less
machinery. *My recommendation is to run Codex unsandboxed and spend the complexity budget on R2
instead* — but the recipe is measured and available if the founder wants it, and that is the
founder's call, not mine.

**R6 · Do not attempt to cure the `SessionStart` EPERM with `allowWrite`.** Measured not to work
(§3a). Cure it with R2.

---

## 6 · What would prove me wrong

- **§0** — a cell where `bypassPermissions` is passed and a child's own `denyRead` *does* bite.
- **§1** — `enableWeakerNestedSandbox` letting a nested child start on any macOS build; or the key
  appearing in the Seatbelt builder's parameter list in a later version.
- **§2** — `allowLocalBinding` failing to enable `bind()` on a different machine or OS version. It is
  one machine, one version here.
- **§3a** — any settings tier, managed included, where `allowWrite` lifts `~/.claude/session-env`.
- **§4** — E5 was **one** run. A second run failing would weaken it materially; it should be repeated
  before anything is built on it.

## 7 · What I could NOT determine

- **Whether managed settings behave differently** for any of this — `denyWrite` a child cannot widen,
  or an `allowWrite` that reaches `session-env`. The binary states managed settings can take exclusive
  ownership of `sandbox.filesystem`. Testing it means writing
  `/Library/Application Support/ClaudeCode/managed-settings.json`, **an admin act and the founder's**.
- **Why this session's parent proxy allows `chatgpt.com` (200) while a fresh armed child denies it
  (403)**, when neither declares `allowedDomains`. Most likely the parent's allowlist is seeded from
  permission-tier WebFetch decisions the child does not inherit. Not measured; do not rely on the
  parent's permissiveness surviving into a child.
- **Whether `tlsTerminate` functions.** Never exercised — the one early cell carrying it never reached
  a started sandbox. Its presence in the schema is documentary only in this lane.
- **Whether the §4 recipe carries a real `codex exec` to completion.** I used an empty `CODEX_HOME` on
  purpose so that no credential was copied, so auth was never present and `✗ auth` is expected in
  every cell. The remaining step needs a real credential and is the founder's.
- **The LaunchAgent / reboot-with-screen-locked case** — unchanged from close-C R33, still blocked on
  a founder install.

---

**Single-family caveat, mandatory and meant.** One model family measured its own runtime and
interpreted the results. **This is not an independent panel.** The mechanical layer is the part least
exposed to that — exit codes, `errno 1`, HTTP 403 vs 401 vs 405, a canary string present or absent —
and I have given the cell name for every one so any reader can re-run them. The *interpretation* is
single-family throughout, and §4 is a live example of why that matters: my first hypothesis about the
Codex TLS failure was wrong, and only a control cell caught it.

---

# 8 · Round 2 — PROBE REDIRECT 1

*Added after the lane's first return. The lead redirected probe #1 as aimed at the wrong OS and named
two new targets. **§8 extends §2 and supersedes §5 R4**, which understated what `allowLocalBinding`
does. Round-2 cost: 7 more `claude -p` children (25 in total for the lane) and one free control run in
the lane's own shell.*

**On the redirect itself: it and this lane converged independently on probe #1.** The lead read the
vendor docs; §1 read the shipped binary and ran the cells. Both landed on Linux-only, for
non-overlapping reasons — the docs say *"Run the Linux sandbox inside an unprivileged container"*, and
the binary hands the key only to the bubblewrap builder while the Seatbelt builder does not accept the
parameter. **It was also tried on macOS despite that** (`C7_weaker_defaultpm`) and failed identically
to its control. So the long shot was taken, and it missed. Nothing to report loudly.

## 8.1 · `network.allowLocalBinding` does MORE than documented — both directions, all depths

One key, one cell, five readouts. `F1_control` is identical but for the key; `F3`, `F4` and `F5` are
three further negative controls carrying the same probe. `READ_CANARY=DENIED` in `F1`/`F2`/`F3` proves
the sandbox was armed and the settings file in force.

| probe | `F1_control` (no key) | `F2_localbinding` (`allowLocalBinding: true`) |
|---|---|---|
| `BIND_TCP_D1` — direct bind | `DENIED:PermissionError:1` | **`BIND_OK:60487`** |
| `BIND_TCP_D2` — **grandchild** (`subprocess`) | `PermissionError [Errno 1]` | **`BIND_OK:60488`** |
| `BIND_TCP_D3` — **great-grandchild** (`/bin/sh -c` wrapper) | `PermissionError [Errno 1]` | **`BIND_OK:60489`** |
| `CONNECT_OLLAMA_11434` — **outbound to the live Ollama** | `DENIED:PermissionError:1` | **`CONNECT_OK: HTTP/1.0 200 OK`** |
| `CONNECT_DRIVER` — outbound to an arbitrary loopback port | `DENIED:PermissionError:1` | **`CONNECT_OK: HTTP/1.0 200 OK`** |

**Three things here contradict what the redirect expected, and all three are good news.**

1. **The depth-2 caveat does not reproduce.** Issue #18545's shape — a daemon forked by a wrapper
   failing at `bind` — was tested at two extra depths, including a `/bin/sh -c` wrapper, which is the
   `bun test`-spawns-a-runner shape. All three depths bind. Reported separately as asked; there is no
   depth cliff on 2.1.263.
2. **The outbound half works too.** The redirect said *"do not expect to fix the outbound half"*, on
   the strength of open issue #28018. On this machine, at this version, `allowLocalBinding: true`
   **alone** — no `allowedDomains` entry for localhost — carried an HTTP request to the live Ollama on
   `127.0.0.1:11434` and got `200`. **This supersedes close-C R4 and its conclusion that "the local
   model tier cannot be a service."** It can. I cannot explain the divergence from #28018 and did not
   try; the honest statement is that it works here and the tracker says it did not work for someone
   else, so anyone relying on it should re-run `childprobe2.py` on their own machine.
3. **`check:mc` is fixable, and here is the end-to-end proof.** Reproducing the exact documented
   signature without installing anything (`mission-control/node_modules` is absent and installing is
   outside the brief), a three-line `Bun.serve({port:0})`:

   | cell | result |
   |---|---|
   | lane's own armed shell (free control) | `SERVE_FAIL code=EADDRINUSE errno=0` |
   | `G1_bun_armed_ctrl` | `SERVE_FAIL code=EADDRINUSE errno=0` |
   | `G2_bun_localbinding` | **`SERVE_OK port=60916`** |

   `errno=0` is the synthetic code `CLAUDE.md` already identified as not-a-real-`EADDRINUSE` (macOS
   returns 48). **One key clears it.** `check:mc`'s exclusion from the suite, and the reasoning in
   `SANDBOX.md` that closed its acceptance questions, both rest on a belief now measured false.

## 8.2 · `sandbox.workspace` — CLOSED, NEGATIVE. It is a namespace collision, not a confinement key

**It is inert as a Bash-sandbox setting, and it is not the missing carrier the envelope bands need.**

`F3_workspace` set `sandbox.workspace: "<scratchpad>/ws"` and is byte-identical to `F1_control` on
every readout — `WRITE_OUTSIDE_WS=WRITE_OK`, no confinement of any kind. `READ_CANARY=DENIED` in the
same cell proves the settings file was read and honoured, so this is inertness, not a typo.

The documentary half agrees and explains why it looked promising. `sandbox.workspace` appears in the
binary exactly three times, always in one list: `sandbox.coworkSurface · sandbox.codeSurface ·
sandbox.chatSurface · sandbox.workspace · sandbox.authentication · connectors.extensions ·
connectors.mcp · telemetry.otlp · limits.tokenLimits · appearance.featureDiscovery`. That is the
**managed enterprise config tree**, where `sandbox` names the Claude *cloud workspace surface* — a
different `sandbox` from the Seatbelt one. Its zod declaration is
`workspace:pJ.WorkspaceConfig.optional()`, sitting beside `codeSurface`, `chatSurface`, `models`,
`plugins`, `telemetry`, `mcp` and `authentication`. It is not in the Bash sandbox schema, not in the
`restrictive:` policy table that lists every real sandbox key, and not in the sensitive-settings list.

**So the peer lane's highest-value-per-minute cell is a dead end**, and the "confine to this worktree"
problem is still unsolved by any documented key. The answer remains §5 R3: cwd plus `denyWrite`.

## 8.3 · `filesystem.allowRead` — CLOSED, POSITIVE, and it is surgical

**It re-opens a file inside a `denyRead` region, exactly as documented.** `F4_allowRead` set
`denyRead: ["/Users/adamks/.codex"]` with `allowRead: ["/Users/adamks/.codex/config.toml"]`:

- `READ_CODEX_CONFIG=READABLE:1B` — the config is readable
- `READ_CODEX_AUTH=DENIED:PermissionError:1` — `auth.json` in the same directory stays denied

**But it does not give what it appears to give, and this is the part to carry forward.** It is a
narrower fix than lifting the deny *for loading config* — and Codex authenticates from `auth.json`,
in `chatgpt` auth mode with stored tokens. A sandboxed Codex that can actually reach the provider must
read that file. So `denyRead` + `allowRead` **cannot** produce a working Codex whose token is hidden
from the sandboxed shell. The one mechanism designed for that — `credentials.files` with `mask` —
carries the vendor's own note that *"On macOS and Windows `mask` currently degrades to `deny`."*

**Conclusion: on macOS there is no way to let Codex authenticate while withholding its token from the
shell it runs in.** Choose: a Codex that works and whose shell can read the token, or a protected
token and no Codex. That is a real constraint, not a configuration gap, and §5 R5's advice — run Codex
unsandboxed and spend the complexity budget elsewhere — gets stronger, not weaker.

## 8.4 · Which settings path works for User-or-managed keys: `--settings` DOES

**Measured, not inferred.** `F5_fsdisabled` delivered `filesystem.disabled: true` through
`--settings <file>` and it took effect: `READ_CANARY=CANARY-P1-9d4e` — the `denyRead` in that same
file stopped biting, i.e. filesystem confinement switched off — while `BIND_*` and
`CONNECT_*` stayed denied, precisely as the key's description promises ("skip filesystem isolation
entirely while keeping network and seccomp isolation"). `READ_CODEX_AUTH` also flipped to readable,
matching "Drops the read protection from filesystem.denyRead and credentials.files deny entries."

The binary states the tier rule verbatim for the credentials keys — *"Only honored from user,
managed/policy, or CLI (`--settings`)"*, with project settings *"ignored"*. **So `--settings` is the
CLI tier and is honoured.** The lead's instinct was right and now has a measurement behind it.

> **This is a security finding, not just a plumbing one.** `filesystem.disabled: true` in a
> `--settings` file switches off the filesystem half of the sandbox — `denyRead` included — from the
> command line. Any dispatcher that lets a brief, a playbook or an untrusted input choose the settings
> file handed to `claude -p` has handed over filesystem confinement entirely. Combined with §0
> (`bypassPermissions` skips sandbox init outright), **there are now two distinct ways for a child to
> end up unconfined while its settings still say `"enabled": true`.** Keel's dispatcher should
> construct child settings itself, from a fixed template, and never accept one as a parameter.

## 8.5 · Revised recommendation ranking

**R4 is promoted and rewritten. It was ranked "best benefit-to-cost ratio"; it is now simply the
first thing to do after R1.**

**R4′ · Set `sandbox.network.allowLocalBinding: true`.** *Protects against:* nothing. *Prevents:* an
inbound loopback listener and outbound loopback connections — neither of which is a threat from a
process that already runs as the founder. *Buys:* `check:mc` back in the suite (§8.1, measured end to
end), the local model tier usable as a service (§8.1, `200` from Ollama), and `SANDBOX.md`'s two
acceptance questions genuinely reopened. Cost: one line. **A control that stops nothing real and
blocks work every day is exactly what the brief said is worse than no control, and this is the clearest
instance of it in the whole panel.**

**New: R7 · The dispatcher must build child settings from a fixed template it owns.** *Protects
against:* the two silent unconfinement paths in §0 and §8.4. *Prevents:* per-run settings flexibility,
which nothing currently needs. Cost: none.

**§5 R1, R2, R3, R5 and R6 stand unchanged.**

## 8.6 · Round-2 additions to §6 and §7

**What would prove round 2 wrong:** `allowLocalBinding`'s outbound half failing on another machine —
issue #28018 says it did for someone, so treat §8.1's outbound result as machine-and-version-scoped
until someone re-runs it. And `F3`'s inertness would be overturned by any vendor page documenting
`sandbox.workspace` as a filesystem key; there is none today.

**Still could not determine:** whether `network.strictAllowlist` and `network.tlsTerminate` are
honoured through `--settings`. §8.4 establishes the *tier* works for one User-or-managed key
(`filesystem.disabled`) and the binary states the same rule for the credentials keys, so the
expectation is yes — but neither was exercised, and `tlsTerminate` remains untested from §7.
