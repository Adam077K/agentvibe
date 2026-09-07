# Sandbox panel — lane P1 · THE MEASURER

*Measured 2026-09-07 on `Mac16,12`, Darwin 25.5.0, `claude` 2.1.263, `codex-cli` 0.153.4.
Posture in one line: **the only lane with a shell — turn the four untried settings into facts, or
record honestly that they stayed untried.***

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
