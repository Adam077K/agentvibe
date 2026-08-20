# Bash Sandbox — Configuration Reference

*Added 2026-08-16. Armed 2026-08-17 by Founder decision.*

---

## Emergency revert

**If the sandbox breaks your session**, set these two values in `.claude/settings.json` and restart Claude Code:

```jsonc
"sandbox": {
  "enabled": false,
  "failIfUnavailable": false,
  // ... rest unchanged
}
```

That's it. No other files need changing. The test in `scripts/sandbox-config.test.mjs` will then fail
CI until the sandbox is re-armed, which is the correct behaviour — the failure is a reminder, not a blocker
for hotfixes.

---

## Scope — what this sandbox is (and is not)

**This is the Claude Code Bash sandbox.** It governs Bash commands and their child processes
when run through Claude Code's Bash tool. It does **not** sandbox the file-edit tools (`Write`,
`Edit`, `Read`). It does **not** sandbox an entire Claude Code session.

Earlier documents in this repo implied a session-wide OS sandbox. That is wrong.

The Bash sandbox is a guardrail against accidental credential exfiltration or destructive shell
commands. It is not a containment boundary against the agent itself — see Finding 2 below.

**Platform:** macOS uses Apple Seatbelt (built into Claude Code — nothing to install). Linux and
WSL2 need `bubblewrap` and `socat`. There is no second `.sb` profile to maintain: Claude Code
drives the platform primitives.

---

## What arming does NOT buy

Two limits that are true regardless of configuration:

1. **`dangerouslyDisableSandbox` is an escape hatch.** When a Bash command fails due to sandbox
   restrictions, Claude Code may analyse the failure and retry with the sandbox disabled. This
   means the sandbox is a guardrail against *accident*, not a containment boundary against the
   agent itself. Do not describe it as containment.

2. **This is the Bash sandbox, not the session sandbox.** It governs Bash and its children. The
   file-edit tools (`Write`, `Edit`, `Read`) are not sandboxed by this mechanism. An agent with
   `Write` permissions can still write to any path its permissions allow, regardless of the
   sandbox setting.

**First real verification happens on the Founder's next session start.** Settings are read at
session start; flipping `enabled` in a worktree does not affect the already-running session.
This is a limit of the mechanism, not an omission.

---

## Configuration keys

All keys live under the top-level `sandbox` object in `.claude/settings.json`:

| Key | Type | Description |
|-----|------|-------------|
| `enabled` | boolean | Whether the sandbox is active. **True in this repo (armed).** |
| `failIfUnavailable` | boolean | When `true`, Claude Code aborts the command if the sandbox cannot start. When `false` (default), it prints a warning and runs unsandboxed. |
| `allowUnsandboxedCommands` | string[] | Commands explicitly exempted from the sandbox even when `enabled: true`. |
| `filesystem.allowWrite` | string[] | Additional write paths beyond the default (working dir + session temp). |
| `filesystem.denyWrite` | string[] | Paths to block writes to, even within the default-writable area. |
| `filesystem.allowRead` | string[] | Additional read paths beyond the default. |
| `filesystem.denyRead` | string[] | Paths to block reads from. |
| `network.allowedDomains` | string[] | Allowed outbound domains. Requires Founder input — not set here. |
| `network.httpProxyPort` | number | Proxy port for HTTP traffic. |
| `network.socksProxyPort` | number | Proxy port for SOCKS traffic. |
| `network.tlsTerminate` | boolean | Whether to terminate TLS at the proxy. |
| `network.injectHosts` | object | DNS overrides injected into the sandbox. |
| `credentials.files` | object[] | Files containing secrets, with `mode: mask\|deny`. |
| `credentials.envVars` | object[] | Environment variables containing secrets, with `mode: mask\|deny`. |

### Path-rule precedence

**The more specific path wins.** Rules compose as follows:

- `denyRead: ["~/"]` + `allowRead: ["~/projects"]` → only `~/projects` is readable.
- `allowRead: ["~/"]` + `denyRead: ["~/.env"]` → `~/.env` stays blocked despite the wide allow.

An exact deny always holds inside a wider allow. This means the `denyRead` credential entries in
this repo's config block their targets regardless of any future `allowRead` additions.

---

## Finding 1 — `failIfUnavailable` defaults to fail-open

`failIfUnavailable` defaults to `false`. When the sandbox cannot start — missing `bubblewrap` on
Linux, an unsupported platform, a kernel policy that blocks Seatbelt — Claude Code prints a
warning and runs the command **unsandboxed**.

The docs describe `failIfUnavailable: true` as intended for deployments that require sandboxing
as a security gate: CI runners, shared machines, audited environments where an unsandboxed run is
a policy violation.

**This repo sets `failIfUnavailable: true`.** A sandbox that silently falls back to unsandboxed
operation is worse than none — it appears active while providing no protection.

---

## Finding 2 — `dangerouslyDisableSandbox` is an escape hatch

When a Bash command fails due to sandbox restrictions, Claude Code may analyse the failure and
retry with the sandbox disabled. This is the `dangerouslyDisableSandbox` escape hatch.

**The sandbox is therefore a guardrail against accident, not a containment boundary against the
agent itself.** Do not describe it as containment. This repo has a standing rule against claiming
enforcement that does not exist.

What the sandbox does reliably catch: an agent that blindly reads `~/.ssh/id_rsa`, a script that
writes to an unintended path, or a dependency that exfiltrates credentials silently. An agent that
actively analyses sandbox failures and retries without the sandbox is a different threat model and
is not addressed by this mechanism.

---

## This repo's policy (armed)

```jsonc
// .claude/settings.json — sandbox block
{
  "sandbox": {
    "enabled": true,            // Armed 2026-08-17. Revert: set false + restart session.
    "failIfUnavailable": true,  // Hard failure if sandbox cannot start — fail-open is not acceptable.
    "filesystem": {
      "denyRead": [
        "~/.ssh",               // SSH private keys
        "~/.aws",               // AWS credentials and config
        "~/.config/gh",         // GitHub CLI token
        "~/.netrc",             // FTP/HTTP credentials
        "**/.env",              // Any .env file (secrets)
        "**/.env.*"             // .env.local, .env.production, etc.
      ],
      "allowWrite": [
        "~/.agentvibe",         // scripts/lib/usage.js token-usage cache
        "/private/tmp/claude-501", // agent scratchpad root — see Write-path justification
        "**/.worktrees"         // Added 2026-08-20. Git Worktree Protocol — see below.
      ]
    }
    // network.allowedDomains: not set — requires Founder input.
    // autoAllowBashIfSandboxed: not set — off by default. Do not enable; it bypasses permissions.
  }
}
```

### Write-path justification

The default sandbox writes only to the working directory and the session temp dir. The
`allowWrite` entries are additional paths outside that default, justified from actual scripts:

| Path | Justified by |
|------|-------------|
| `~/.agentvibe` | `scripts/lib/usage.js` line 46: `cachePath = () => path.join(os.homedir(), '.agentvibe', 'usage-cache.json')`. This cache is written by `npm run usage` and the session-start hook. |
| `**/.worktrees` | **Founder decision 2026-08-20.** CLAUDE.md § Git Worktree Protocol *mandates* that every code worker create a worktree, and Rule 7 ("Worktrees for code") is one of the few rules the repo marks `ENFORCED`. Arming the sandbox made that rule unexecutable. Worktrees are created under `$MAIN_REPO/.worktrees/`, which is outside every agent's project root — because the agent's project root **is** a worktree underneath it. Measured 2026-08-20 from a session in `.worktrees/ceo-3-…`: `git worktree add` returns `fatal: could not create leading directories of '…/.worktrees/probe-sandbox-p05/.git': Operation not permitted`, and a spawned worker cannot write into a sibling worktree either. Glob form, not an absolute path: this file ships to every generated project, where `/Users/adamks/…` would grant nothing. `.worktrees/` is gitignored (`.gitignore:16`) and exists solely as agent scratch space, so the boundary widens by a directory that already holds nothing but agent working copies. |
| `/private/tmp/claude-501` | The Claude Code **agent scratchpad** root. Agents are instructed to put all temporary files here rather than `/tmp`, and they do — the CEO session that armed this sandbox wrote and executed merge-queue shell scripts there four times in one sitting. **This is NOT the session temp directory**, which the sandbox already permits: measured 2026-08-17, `$TMPDIR` is `/var/folders/pp/…/T/` while the scratchpad is `/private/tmp/claude-501/…` — different trees. Without this entry, every scratchpad write becomes a hard failure the moment `failIfUnavailable: true` takes effect, and the symptom reads as "the sandbox is broken" rather than "an allow rule is missing." The path is Claude-managed scratch space, not user data, so granting it widens the boundary by very little. |

Paths **not included** despite being written by repo scripts:

| Path | Script | Why omitted |
|------|--------|-------------|
| `~/.warroom/` | `scripts/warroom-install.mjs` | Only written during explicit `npm run warroom:fleet` install, not routine CI or agent operation. Add it if `warroom:fleet` will run sandboxed. |
| `~/bin/` | `scripts/warroom-install.mjs` | Same as above. |

---

## Amendment 2026-08-20 — `**/.worktrees` — **UNVERIFIED**

**What changed.** One entry added to `allowWrite`: `**/.worktrees`. Nothing else. `enabled`,
`failIfUnavailable` and every `denyRead` entry are untouched.

**Why.** Arming the sandbox on 2026-08-17 silently made CLAUDE.md's mandated Git Worktree
Protocol unexecutable. That was not noticed at arming time because nothing tried to create a
worktree in the same session. See the Write-path justification table for the measurement.

**This fix is UNVERIFIED, and that is not a formality.** `.claude/settings.json` is read at
**session start** — the same limit `scripts/sandbox-config.test.mjs` states about `enabled`.
Editing the file does not re-sandbox the already-running Bash of the session that edited it,
so nothing in the session that made this change can demonstrate it works. What has been
verified is only the *shape*: the entry is present and `npm run test:sandbox` pins it.

**Acceptance test — someone must actually run this:**

```bash
# In a FRESH Claude Code session (not the one that made the change):
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
git -C "$MAIN_REPO" worktree add "$MAIN_REPO/.worktrees/sandbox-acceptance" -b probe/sandbox-acceptance
# PASS: the worktree is created.
# FAIL: "could not create leading directories … Operation not permitted" — the glob does not
#       match the way the sandbox resolves paths, and an absolute-path form must be tried
#       (per project, since this file ships to generated projects).
# Either way, record the result HERE and delete the probe worktree and branch.
```

Until that runs, Rule 7 should be treated as still blocked. An unverified fix asserted as
working is the exact failure this document's own posture exists to prevent.

**Not granted, deliberately.** Writing to the main repository's `.git/` directory is still
denied. Observed in the same session: `git branch -D` deletes the ref but then reports
`could not lock config file …/.git/config`. Worktree *creation* is what the protocol needs;
mutating the parent repo's config is not, and it stays outside the boundary.

---

## Arming procedure (completed 2026-08-17)

Steps taken:

1. **Founder decision recorded.** Session file:
   `docs/08-agents_work/sessions/2026-08-17-builder-arm-sandbox.md`.
2. **`denyRead` kept exactly as reviewed in #84.** No credential paths were added or removed.
   `allowWrite` gained one entry: `/private/tmp/claude-501` (the agent scratchpad root).
   Without it, every `scratchpad/` write is a hard failure under `failIfUnavailable: true` — and
   the symptom reads as "the sandbox is broken" rather than "an allow rule is missing." See the
   Write-path justification table for the `$TMPDIR` measurement that established this is not the
   session temp the sandbox already permits.
3. **`failIfUnavailable: true` set at the same time as `enabled: true`.** Fail-open on sandbox
   unavailability is not acceptable for a production security gate.
4. **`autoAllowBashIfSandboxed` is not set** (off by default). Turning it on would bypass the
   `permissions.allow/deny` rules for sandboxed sessions.
5. **`network.allowedDomains` not added** — requires Founder input after surveying every outbound
   host CI scripts and agent hooks contact. Missing a domain breaks CI silently on the first run.
6. **Test inverted, not deleted.** The guard test (`scripts/sandbox-config.test.mjs`) now pins
   the armed state. It fails if `enabled` is turned back off or `failIfUnavailable` is not `true`.
   The guard was not removed; it now watches the opposite fact.

---

## Test

`scripts/sandbox-config.test.mjs` (`npm run test:sandbox`) proves the block is well-formed and
that `enabled` is `true` and `failIfUnavailable` is `true`. It runs in CI (`npm run test:sandbox`
step in `.github/workflows/ci.yml`).

If `sandbox.enabled` is set back to `false`, the test fails with:

```
AssertionError: sandbox.enabled must be true (the sandbox is armed).
```

If `sandbox.failIfUnavailable` is set to `false`, the test fails with:

```
AssertionError: failIfUnavailable must be true when sandbox.enabled is true.
```

Both failures are asserted in the test. Both must continue to fail if the sandbox is disarmed —
losing the check after arming is worse than never having it.
