# DR-B1-06-ADAPTER-RULINGS: the `claude` WorkerAdapter's harness check, nested agents and context profiles (2026-10-02)

**Basis.** An Opus review failed the B1-06 done-tests at `8ec0bd4`. Three of its findings were canon gaps,
not test defects. The founder decided all three on 2026-10-02, asked through AskUserQuestion in the main
session ("founder, 2026-10-02"). This note records the rulings. B1-06 (`14-BUILD-PLAN.md` §6) is frozen against
them in `build/done-tests/B1-06.yml`. They refine 09a §8.2 and §8.4 and add nothing beyond them. The round-2 review
of `d0f0fc8` led to two more rulings the same day, D and E. They are recorded below, in the same way.

## A. MCP change detection

09a §8.2 says the `system/init` harness check covers "tool-description hashes … so a changed MCP description aborts
before the first tool call". The measured CLI surface (09a §8.1) carries no tool descriptions in `system/init`. A
field invented for them would be absent from every real run, so every real job would abort.

**Ruling (founder, 2026-10-02).** The Kernel supplies the exact MCP server configuration for each job, pins it, and
hashes it. The adapter aborts before the first tool call if the tool list reported in `system/init` differs from the
pinned one. There is no tool-description field.

`init_expect` is the hash of exactly the four harness fields that ENGINE-SPEC §8.2 names: `tools`, `mcp_servers`,
`agents` and `plugins`. Per-run fields are outside it, because hashing them would abort every job: `session_id`,
`uuid`, `cwd` (one worktree per job) and `model` (recorded under 09a §8.7, not checked).

*What remains:* a server that changes a description but keeps its tool names cannot be seen from `system/init`. The
pinned, hashed config is the control for that case. It lives on the Kernel side, outside the adapter.

## B. Nested-agent tools

The pinned line reads `--disallowedTools <forbidden, incl. Agent,Task>`. 09a §8.4 forbids nested-agent tools
"unless the funded team shape includes them".

**Ruling (founder, 2026-10-02).** `Agent` and `Task` are forbidden by default. They are allowed only when the job is
explicitly a funded team (`LaunchSpec.FundedTeam`). Two rules apply in both cases:

- A tool may not be both allowed and forbidden.
- Each tool-list element is one tool name. An element that carries a comma is refused, so `"Read,Agent"` cannot
  smuggle `Agent` past the check.

## C. Context profiles

The pinned line reads `--setting-sources <profile>`. The CLI accepts only `user`, `project` and `local`.

**Ruling (founder, 2026-10-02).** A fixed, pinned table maps each context profile to its `--setting-sources` value.
A profile the table does not hold is refused. The profile name is never passed through verbatim.

**The table.** It has one row: `launch-pack` → `project`. The Launch Pack is the default profile (09a §8.3), and
`project` is the value the frozen B1-08 launcher test pins in that slot. `user` appears in no row, because
inheriting the operator's user settings is what 09a §8.3 forbids. A new row is a protected-base change.

## D. The profile table's row (ratifies C)

**Ruling (founder, 2026-10-02).** `launch-pack` maps to project settings only, never user settings. The row
`launch-pack` → `project` is **ratified**.

## E. Rate limits

ENGINE-SPEC §8.3 maps a usage or rate limit to `blocked(capacity)`. The round-2 tests froze a guessed wire shape for
that signal: a `rate_limit_event` with `status: rejected` maps to `blocked(capacity)`, and a warning does not block.
No real run has measured that shape.

**Ruling (founder, 2026-10-02).** Measure first, freeze later. Until a measurement exists, the frozen rule is this:
any rate-limit signal, or any signal the adapter does not recognise, never counts as a pass. It yields `unresolved`
or `blocked`. In the tests, "recognised" means the four top-level event types `system`, `assistant`, `user` and
`result`. A rate-limit event's own fields buy nothing, so a status of `allowed` does not pass either.

**OPEN.** Exact rate-limit shape: measure on a real run, then re-freeze. That re-freeze is where `blocked(capacity)`,
as opposed to `unresolved`, gets pinned.

## Also frozen, from canon or from review (r2, r3)

- **Stream lines.** They may be of any length; the tests use lines over 1 MiB and over 4 MiB. A tool result can be
  large, and a reader that truncates or stops on a long line turns a real run into `unresolved`.
- **Tool-list elements.** The CLI splits tool lists on commas and on whitespace. So whitespace outside parentheses
  makes two names: `"Read Agent"` is refused. A rule with an inner space, `Bash(git diff:*)`, is one name.
- **A result with no `system/init` before it** aborts or is `unresolved`. It is never adjudicated.
