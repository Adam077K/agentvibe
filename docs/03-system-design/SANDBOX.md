# Bash Sandbox — Configuration Reference

*Added 2026-08-16. Status: built, not armed.*

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

## Configuration keys

All keys live under the top-level `sandbox` object in `.claude/settings.json`:

| Key | Type | Description |
|-----|------|-------------|
| `enabled` | boolean | Whether the sandbox is active. **False in this repo.** |
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

**Implication for this repo:** Until `enabled: true` is set with `failIfUnavailable: true`, the
sandbox provides no guarantee even when present. It is a best-effort guardrail, not a hard gate.

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

## This repo's policy (unarmed)

```jsonc
// .claude/settings.json — sandbox block
{
  "sandbox": {
    "enabled": false,           // <-- unarmed. Do not change without the arming procedure.
    "failIfUnavailable": false, // Keep false while enabled is false.
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
        "~/.agentvibe"          // scripts/lib/usage.js token-usage cache
      ]
    }
    // network.allowedDomains: not set — requires Founder input.
  }
}
```

### Write-path justification

The default sandbox writes only to the working directory and the session temp dir. The
`allowWrite` entries are additional paths outside that default, justified from actual scripts:

| Path | Justified by |
|------|-------------|
| `~/.agentvibe` | `scripts/lib/usage.js` line 46: `cachePath = () => path.join(os.homedir(), '.agentvibe', 'usage-cache.json')`. This cache is written by `npm run usage` and the session-start hook. |

Paths **not included** despite being written by repo scripts:

| Path | Script | Why omitted |
|------|--------|-------------|
| `~/.warroom/` | `scripts/warroom-install.mjs` | Only written during explicit `npm run warroom:fleet` install, not routine CI or agent operation. Include it when arming if `warroom:fleet` will run sandboxed. |
| `~/bin/` | `scripts/warroom-install.mjs` | Same as above. |

---

## Arming procedure

Do not arm the sandbox without completing these steps in order:

1. **Founder decision recorded.** Add a session file at
   `docs/08-agents_work/sessions/YYYY-MM-DD-founder-sandbox-arm.md` with explicit sign-off.
2. **Start with one deny rule in a throwaway directory.** Never arm with the full production
   policy first. Create a temp directory, add it to `denyWrite`, verify the sandbox actually
   blocks a write to it before relying on any other rule.
3. **Set `failIfUnavailable: true`** at the same time as `enabled: true`. Fail-open on sandbox
   unavailability is not acceptable for a production security gate.
4. **Leave `autoAllowBashIfSandboxed` off** (it is off by default). Turning it on bypasses the
   `permissions.allow/deny` rules for sandboxed sessions.
5. **Add `network.allowedDomains`** only after surveying every outbound host the repo's CI
   scripts and agent hooks contact. Missing a domain breaks CI silently on the first run.
6. **Delete the armed-check assertion** in `scripts/sandbox-config.test.mjs` only when the
   Founder sign-off session file (step 1) exists in the same PR. The test is the machine-checked
   guard against accidental arming; removing it without the session file means losing the guard.

---

## Test

`scripts/sandbox-config.test.mjs` (`npm run test:sandbox`) proves the block is well-formed and
that `enabled` is `false`. It runs in CI (`npm run test:sandbox` step in
`.github/workflows/ci.yml`). If `sandbox.enabled` is set to `true`, the test fails with:

```
AssertionError: sandbox.enabled must remain false until explicitly armed by the Founder.
```

That is the machine-checked form of the Founder's standing instruction.
