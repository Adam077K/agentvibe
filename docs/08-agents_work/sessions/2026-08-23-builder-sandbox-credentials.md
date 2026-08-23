---
date: 2026-08-23
role: builder
task: sandbox-worktree-allowlist-v2
branch: feat/sandbox-worktree-allowlist-v2
tier: irreversible
qa_verdict: PENDING
---

Widens the `**/.worktrees` allowlist from the parent branch (`feat/sandbox-worktree-allowlist`) and adds the
missing `denyRead` credential paths `TARGET-ARCHITECTURE.md:327-330` recommends, on `.claude/settings.json`
— `enforcement: block` per `.claude/qa-tier-floor.yml`, hence `tier: irreversible`.

**(a) `**/.worktrees/**` added alongside the existing `**/.worktrees`.** Measured this session, in a fresh
session started after the parent branch's glob had already landed: `git worktree add` still failed one level
deeper — `fatal: could not create leading directories of
'/Users/adamks/VibeCoding/agentvibe/.worktrees/probe-97756/.git': Operation not permitted`. The refused path
is *inside* `.worktrees`, not the directory itself, so a glob naming only the directory does not grant its
descendants. Both entries are kept — they cover different things. Pinned in
`scripts/sandbox-config.test.mjs` (`REQUIRED_ALLOW_WRITES`). **Still UNVERIFIED for the structural reason
`SANDBOX.md` already states about the first fix**: settings are read at session start, so no session that
edits the file can prove the edit works — only a fresh session started after this PR lands can. Recorded as
its own dated amendment in `docs/03-system-design/SANDBOX.md` rather than silently overwriting the still-open
2026-08-20 amendment; both are marked UNVERIFIED and neither is asserted as fixed.

**(b) The credential-containment gap `TARGET-ARCHITECTURE.md:327-330` names — `~/.gemini`, `~/.codex`, `~/.config/openai` added to `denyRead`** as directories (a rotated
credential lands under a new filename). Pinned in `scripts/sandbox-config.test.mjs`
(`REQUIRED_DENY_READS`).

**The limitation stated plainly in `SANDBOX.md`, because it matters more than the entries.** Measured this
session: adding `~/.config/gh` to `denyRead` did not slow `git push` at all (git authenticates via the macOS
Keychain / `osxkeychain` helper, which a filesystem deny cannot reach), but it broke `gh` outright —
`failed to read configuration: open /Users/adamks/.config/gh/config.yml: operation not permitted` — because
`gh` reads its config from that file directly. So a filesystem `denyRead` is a hard tool outage for a
config-file reader and no effect at all for a keychain-backed one. `TARGET-ARCHITECTURE.md:303-306` records
the identical caveat for Codex (`cli_auth_credentials_store: keyring` routes around the deny) as a plan; this
is the same caveat measured in practice, for a second tool.

**Not verified in this PR (and said so, not glossed over):** whether `git worktree add` actually succeeds
under the widened glob in a fresh session. That is the acceptance test recorded in `SANDBOX.md`'s new
Amendment 2026-08-23 section, and it cannot be run from inside the session that made the change.

Files changed: `.claude/settings.json`, `scripts/sandbox-config.test.mjs`,
`docs/03-system-design/SANDBOX.md`, this session file.

`.claude/agents/designer.md — declares mcpServers [playwright]` reported by `lint:agents` is a pre-existing
artifact of the reduced (sparse) file set this clone uses, which excludes `.mcp.json` (deliberately absent),
not a change on this branch: comparing `.claude/agents/designer.md` against `origin/main` shows no diff.
