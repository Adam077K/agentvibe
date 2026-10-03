# DR-B1-07-CODEX-RULINGS: the `codex` WorkerAdapter's pins, nested agents, user config and result file (2026-10-02)

**Basis.** The B1-07 done-tests were first frozen on `build/b1-07-tests` at `f111312`. They left six canon
gaps open and refused each one with `ErrUndecided`. The founder ruled on all six on 2026-10-02, asked
through AskUserQuestion in the main session ("founder, 2026-10-02"). This note records those rulings. B1-07
(`14-BUILD-PLAN.md` §6) is re-frozen against them in `build/done-tests/B1-07.yml`, with the reason
"2026-10-02 founder rulings B1-07". The rulings refine 09a §8.2, §8.4 and §8.8 for the codex line. They
follow [DR-B1-06](DR-B1-06-ADAPTER-RULINGS-2026-10-02.md) where the two adapters meet.

## 1 + 3. Pinning: the profile hash and the binary hash

The pinned codex line (09a §8.2) has no tool-list flag. Its stream reports no tools and no model, so it has
nothing that a `system/init` harness check could compare.

**Ruling (founder, 2026-10-02).** Tool limits live in the generated Codex profile file. The launch records the
sha256 of that profile file and of the codex binary. If either differs from its pinned value, the launch is
refused with `ErrSpec` before exec. This mirrors B1-06 ruling A's pinned and hashed MCP config.

How the tests read this ruling:

- The pinned binary hash is the grant digest that the adapter is built with (`NewCodex(digest)`).
  `LaunchSpec.BinaryDigest` is the measured digest.
- For codex, the pinned profile hash is `init_expect`. `LaunchSpec.ProfileDigest` is the measured digest.
- Each value must have the form `sha256:` followed by 64 lowercase hex digits. Values that are missing,
  malformed or unequal are `ErrSpec`. A pin that is not a sha256 value is no pin, even when the measured
  value equals it.
- `Watch` receives the pin. A run whose pin is missing or malformed never adjudicates.
- A tool lease in the spec is `ErrSpec`. The lease belongs in the pinned profile, and an argv that dropped it
  would read as enforced when nothing enforced it.

## 2. Nested agents: never

**Ruling (founder, 2026-10-02).** Nested agents are never allowed for codex, funded or not.
`LaunchSpec.FundedTeam` is `ErrSpec`. A `collab_tool_call` in the stream never adjudicates, and `Children`
still reports it (09a §8.4: nested agents are visible).

## 4. Ignore the user config

> **Superseded 2026-10-03.** Ruling 4 is superseded by the founder ruling of 2026-10-03 (see "Round 2"
> below). Measured on codex-cli 0.154.0, `--ignore-user-config` stops `-p` from loading the profile, so
> rulings 1+3 and 4 could not both hold. The flag is no longer passed, and `--ignore-rules` is.

`-p` layers `$CODEX_HOME/<name>.config.toml` on top of the user's `~/.codex/config.toml`, so the pinned
profile alone did not decide what the worker loaded.

**Ruling (founder, 2026-10-02).** Always pass `--ignore-user-config`. An argv without it fails the tests.
The adapter's template is the 09a §8.2 codex line with `--ignore-user-config` appended.

*Follow-up, not done here:* two places must change to match. The first is the line in 09a §8.2. The second
is the frozen B1-08 launcher done-test, whose `codexTokens` pins the line without the flag. Until both
follow, the adapter's argv does not match the launcher's codex template.

## 5. The `-o` file must match the stream

**Ruling (founder, 2026-10-02).** The `-o` result file must equal the stream's answer, which is the last
`item.completed` `agent_message` text. If they differ, or if either is missing, the outcome is UNPARSED
(09a §8.8) and never a pass.

The tests read "equal" as byte for byte. A reordered or re-spaced JSON document does not match. The runner
reads the file after exit and passes it in `ExitInfo.ResultFile`. `ExitInfo.ResultFileRead` is false when
the file was missing or unreadable.

## 6. Rate-limit shape

**Ruling (founder, 2026-10-02).** Per B1-06 ruling E: measure the shape on a real run first, then freeze
it. Until then, a rate limit or an unrecognised signal is never a pass. In the tests, an `error` event, an
`error` item, a `turn.failed`, an unknown event type or an unknown item type never adjudicates. The tests
do not pin whether a rate limit becomes `blocked(capacity)` or `unresolved`.

## What remains open

- How the Kernel measures the profile and binary digests, and when, sits on the launcher and runner side
  (B1-08, B1-09). The adapter compares; it does not read files.
- Whether codex writes the `-o` file with a trailing newline is unmeasured. Under the byte-for-byte reading,
  a trailing newline would make every run UNPARSED, and the per-family UNPARSED rate (09a §8.8) would show
  it.
- The budget has no codex flag. `BudgetUSD` is validated, and the runner enforces it.

## Round 2 (2026-10-03): ruling 4 superseded, and the profile must be complete

**What failed.** An Opus review failed the implementation at `2592de6` (`build/b1-07`), which was built on
the `cbd3155` tests. Its HIGH finding came from a measurement on codex-cli 0.154.0: `--ignore-user-config`
stops `-p` from loading the profile. Rulings 1+3 and 4 therefore contradicted each other, because the pinned
profile never loaded.

This builder reproduced the finding the same day. The run used a throwaway `CODEX_HOME` that held no
credential, and network access was denied, so no model turn was served. The `exec` banner reported a
different model in each case:

| Flags | Model in the banner |
|---|---|
| `-p prof` | the profile's model (`profile-model-qqq`) |
| `-p prof --ignore-user-config` | the default model (`gpt-6-astra`) |
| `-p prof --ignore-rules` | the profile's model |

**Ruling (founder, 2026-10-03, via AskUserQuestion).** This supersedes ruling 4. Load the pinned profile and
drop `--ignore-user-config`. The user's own Codex config is honoured.

**Fail-safe (orchestrator, 2026-10-03).** Because the user config is honoured, the pinned profile must set
every safety-relevant key itself. A profile that omits any required key is `ErrSpec`. The required keys are:

- `approval_policy`
- `approvals_reviewer`
- `sandbox_mode`
- `sandbox_workspace_write.network_access`
- `sandbox_workspace_write.writable_roots`
- `sandbox_workspace_write.exclude_tmpdir_env_var`
- `sandbox_workspace_write.exclude_slash_tmp`
- `shell_environment_policy.inherit`
- `mcp_servers`
- `web_search`
- `model_provider`
- `model_providers`
- `notify`
- `hooks`
- `features`
- `tools`
- `projects`

That is 17 keys. The candidates came from the config field names in the installed binary. Each key was
accepted in a profile by `codex exec --strict-config` 0.154.0. As a control, an unknown key (`bogus_key_zz`)
was refused with "unknown configuration field", and `zsh_path` was also refused. The test profile with all 17
keys loads under `--strict-config --ignore-rules`, and the banner shows `sandbox: workspace-write [workdir]`.

**Not required: `default_permissions`, which was measured.** Setting it needs either a built-in name or a
`[permissions]` table. The built-in `":workspace"` puts `/tmp` and `$TMPDIR` back into the writable roots,
undoing `exclude_slash_tmp` and `exclude_tmpdir_env_var`. A custom `[permissions.<name>]` table would not
start under the armed sandbox. A user-config `default_permissions` (`":danger-full-access"`, or a custom
table) did not take effect over the profile's `sandbox_mode`; the banner stayed `workspace-write [workdir]`.
So requiring the key would loosen the sandbox, while omitting it was measured not to leak. The decision is
open for a ruling if the founder wants the key pinned anyway.

**`--ignore-rules` is required.** `codex exec --help` describes it as: "Do not load user or project
execpolicy `.rules` files". A project rules file can sit in the worktree that the worker writes, and a user
rules file is outside the pin, and either can allow commands that the pinned profile would not. The run above
shows the profile still loads with the flag. The template is now the 09a §8.2 line with `--ignore-rules`
appended.

**Medium review findings (`codex.go:83-88`), now pinned.**

- `LaunchSpec.Worktree` is the job's worktree. `-C` must be a clean, absolute ASCII path inside it, and
  neither `/` nor a path containing `..` is accepted.
- `-o` must be a clean path outside the worktree. Neither the path nor any existing ancestor may be a
  symlink.
- `Env["CODEX_HOME"]` must be absent, or exactly equal to the pinned `LaunchSpec.CodexHome`. The pinned
  value must be clean, absolute, and outside the worktree.
- `LaunchSpec.CodexProfileTOML` is the profile's exact bytes. Its sha256 must equal the pin (`init_expect`).

**Residual risk, not closed here.** The adapter checks only that each required key is present; it does not
check the values. Two holes remain:

- An `-o` path outside the worktree is still writable by the worker if it lies under a root that the
  profile makes writable, such as `/tmp` when `exclude_slash_tmp` is false.
- A table-valued key such as `mcp_servers = {}` may be deep-merged with the user's table rather than
  replacing it. This is unmeasured.

Pinning required values, and measuring how tables merge, are the next step.
