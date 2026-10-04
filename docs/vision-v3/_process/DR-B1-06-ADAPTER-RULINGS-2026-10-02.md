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

## F. `Task` is an alias of `Agent`

The CLI maps `Task` to `Agent`. Until r6 the adapter auto-forbade `Task` for a funded team that allowed `Agent(x)`.
With that forbid in place, the CLI denied the very `Agent(reviewer)` the team was funded for (re-review of `a90071b`).

**Ruling (founder, 2026-10-02).** Task is an alias of Agent. Unfunded: both are forbidden. Funded: bare Agent or a
named Agent(x) is allowed, and Task follows the same rule.

Frozen in r6:
- When a funded team is allowed `Agent(x)` or `Task(x)`, no disallow that denies it appears in the argv, under either
  name. A disallow denies the rule if it is bare `Agent` or bare `Task`, or if it carries the same argument.
- An explicit forbid that would deny the allowed rule makes the lease `ErrSpec`.
- For an unfunded team, both bare names are in `--disallowedTools`.

*Clarified (founder, 2026-10-02, AskUserQuestion).* r6 left one question open: does "only the approved `Agent(x)`
form" bar a funded team from bare `Agent`? It does not. Bare `Agent` remains allowed for a funded team. No test
changed for the clarification, because the tests frozen since r2 already accept bare `Agent` and `Task` for a funded
team.

## Also frozen, from canon or from review (r2, r3)

- **Stream lines.** They may be of any length; the tests use lines over 1 MiB and over 4 MiB. A tool result can be
  large, and a reader that truncates or stops on a long line turns a real run into `unresolved`.
- **Tool-list elements.** The CLI splits tool lists on commas and on whitespace. So whitespace outside parentheses
  makes two names: `"Read Agent"` is refused. A rule with an inner space, `Bash(git diff:*)`, is one name.
- **A result with no `system/init` before it** aborts or is `unresolved`. It is never adjudicated.

## Also frozen by r4 (after the implementation review of `22ab9a4`)

- **Tool rules are ASCII.** The CLI splits tool lists with JavaScript's `\s`, which matches Unicode separators
  (U+00A0, U+2028, U+3000, U+FEFF and others) that a byte-level check does not see. Any non-ASCII rune in a tool
  rule is therefore refused. This applies in both lists and whether or not the team is funded. Without it, a funded
  `Agent(x<U+00A0>Bash)` would reach the CLI as two rules. This applies ruling B, which says one element is one rule.
- **The permission mode is checked.** `system/init` must report `permissionMode: dontAsk`, the pinned value
  (09a §8.2). Any other value, or none, aborts before the first tool call. It is a separate check: `init_expect`
  keeps ruling A's four fields.
- **Assumption: an unrecognised event is UNPARSED.** 09a §8.8 counts runs with no typed outcome toward the
  per-family UNPARSED rate, but canon is silent on unrecognised events. Ruling E says they never pass. The safe
  reading, frozen as an assumption by the test builder, is that such a run is UNPARSED. It reports `Reason` unparsed
  and so counts toward the rate. Revisit once the rate-limit shape is measured (ruling E's OPEN).

## Also frozen by r5 (after the re-review of `a8ea780`)

- **No nested parentheses in a tool rule.** The installed CLI, 2.1.287 as measured by the re-review, splits tool lists
  with a boolean in-parentheses flag rather than a depth counter. So a nested parenthesis ends the rule early:
  - `Read(a(b) Bash c)` grants a bare `Bash`, with or without a funded team;
  - `Bash(echo (x) Agent y)` grants a bare `Agent` to a funded team.

  The fail-safe rule:
  - A rule has at most one parenthesised argument.
  - That argument holds no parenthesis and no comma.
  - Its whitespace is only what r3 already permits (`Bash(git diff:*)`), read as single ASCII spaces between
    non-space characters.

  This applies ruling B, which says one element is one rule. It holds in both lists, whether or not the team is
  funded.
- **JSON keys are matched exactly.** The CLI writes JSON from JavaScript, where keys are case-sensitive. Go's decoder
  is not. A case-variant key (`permissionmode`, `Is_Error`, `Type`, …) is never the field and never overrides the
  exact one, in `system/init` or in a result. A run that carries one aborts or stays `unresolved`.
- **Every `system/init` is checked for the pinned mode**, not only the first, and a nested-agent tool's spelling
  (`agent`, `AGENT(x)`) does not get it past the funded-team rule.

## Also frozen by r6 (after the re-review of `a90071b`)

- **Ruling F**, above.
- **No backslash in a tool rule.** The CLI ignores a rule such as `Bash(x\)` that it cannot read. Written as a forbid,
  that rule would be silently void, so a backslash anywhere in a rule is `ErrSpec`.
- **No empty argument.** `Bash()` is refused, and it is never read as all of `Bash`.
- **No control character inside an argument**, including the ones the whitespace checks do not catch.
- **Every `permission_denials` entry must be an object with a string `tool_name`.** Anything else leaves the result
  mistyped: `unresolved(unparsed)`.

## Also frozen by r7 (after the re-review of `b3cc99d`)

The CLI evidence was read on 2026-10-02 from the source embedded in the installed binaries
(`~/.local/share/claude/versions/2.1.284` and `2.1.287`). No CLI process was run.
- The rule parser treats an argument of `""` or `"*"` as the bare tool:
  `if(n.rawContent===""||n.rawContent==="*")return{toolName:…}`.
- Tool names match case-sensitively:
  - the alias table `{Task:"Agent",…}` is looked up by exact key;
  - the matcher compares names with `===`;
  - the glob fallback builds its RegExp with the flags `s` or `su`, never `i`.

From that evidence:
- **`X(*)` is the bare `X`, for every tool.** Wherever the adapter compares rules, a lease holding `X(*)` has the same
  outcome as the same lease holding `X`. Under ruling F, a funded team allowed an `Agent` or `Task` rule while
  `Task(*)` or `Agent(*)` is forbidden is `ErrSpec`. Unfunded, `Agent(*)` and `Task(*)` are refused like any other
  `Agent` or `Task` form.
- **A case-variant `Agent`/`Task` forbid is refused when it meets an allowed nested-agent rule.** The CLI matches
  case-sensitively, so `agent` or `TASK(*)` denies nothing. Passing one through would be a silently void forbid,
  which r6 rules out. This is why the exact-name variant of that check is not equivalent.

- **Any case-variant tool name is refused** (orchestrator's call, fail-safe, 2026-10-02; closes the r7 OPEN). A rule
  is `ErrSpec`, in either list, funded or not, bare or with an argument, if its tool name equals a known tool
  case-insensitively but not exactly. The pinned tools are `Bash`, `Read`, `Edit`, `Write` and `WebFetch`, plus the
  `mcp__` prefix: `bash`, `BASH(*)`, `webfetch`, `MCP__x__y` are all refused.

  As a forbid, such a rule is a deny the founder believes is in force but is not. As an allow, it grants nothing.
  Exact names pass. So do names that are only longer (`Bashful`, `bashful`, `webfetcher`) and unknown tools.

  *Limit:* case variants inside an MCP server or tool name (`mcp__Tracker__x`) are not caught. The adapter does not
  know the pinned MCP tool list at `Argv` time.
