# The claim ledger — how it works, and how to use it

**Status:** Phase 3, shipped 2026-08-11 · **Decision:** [ADR-001](adr/001-claim-ledger-as-enforcement-spine.md)
**Code:** [`scripts/ledger.mjs`](../../scripts/ledger.mjs) · [`scripts/lib/claims.js`](../../scripts/lib/claims.js) ·
[`scripts/lib/resolvers.js`](../../scripts/lib/resolvers.js) · [`scripts/lib/classifier.js`](../../scripts/lib/classifier.js)

---

## 1 · Why a claim and not a diff

A pricing model, a market number, a positioning statement and a GTM sequence have no diff
to gate, no compiler to run and no test to fail. A harness that gates diffs covers the
recoverable half of the work — code, which `git revert` undoes — and leaves the
unrecoverable half completely ungated.

Code, pricing, research and copy all ultimately **assert things**. So the claim is the
unit, and one ledger covers both halves.

The failure that settled it: *"subagents cannot spawn subagents"* sat in this system's
operating instructions and shaped its entire topology. Probed directly, it is false. It
was true once, carried no expiry, and rotted silently while everything kept obeying it.
No diff gate would ever have caught that, because nothing about it was a diff.

## 2 · Writing a claim

A claim lives **inside the artifact it supports** — never in a separate registry that can
drift away from it. Two forms, one parser:

````markdown
```claims
claims:
  - id: c-something-true
    assert: "One sentence that is either true or false"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "npm run check", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [d-001]
```
````

or a `claims:` key in a file's YAML frontmatter. Then `node scripts/ledger.mjs build`
compiles every claim into `.claude/ledger/index.json`. **The index is never hand-edited** —
`ledger build --check` fails CI if it drifts, exactly as the skills manifest does.

| Field | Notes |
|---|---|
| `id` | `c-kebab-case`, unique across the ledger |
| `kind` | `external-fact` · `internal-fact` · `behavior` · `user-language` · `judgment` · `runtime-capability` · `preference` |
| `scope` | `global` (all projects, `~/.warroom/ledger/`) · `project` (this repo) · `task` (dies with the branch) |
| `verified_by` | `source` · `command` · `judge` — picks the resolver |
| `evidence.unchecked_exit` | **`command` only, opt-in.** An integer exit code that means "I could not measure this" rather than "the claim is broken". Maps to `unresolved` with stderr as the reason. Must differ from `expect_exit` — a code that simultaneously means "checked, held" and "could not check" has no coherent meaning. See [issue #81](https://github.com/Adam077K/agentvibe/issues/81). |
| `evidence.configuration_only` | **`command` only, opt-in, must be `true`.** Marks a command claim as checking only the configuration its measurement was taken against, not live behaviour. The status is still `pass` when the configuration check passes; the resolver annotates the reason with `(configuration-only: verified configuration, not live behaviour)` so `verify` output is distinguishable from a claim that re-measured the asserted behaviour. The sibling of `evidence.unchecked_exit`: both let the ledger represent "I did not actually check the thing I asserted" — the difference is that `unchecked_exit` means the check could not run at all, while `configuration_only` means the check ran and passed a proxy. See [issue #90](https://github.com/Adam077K/agentvibe/issues/90). |
| `valid_until` | **Required** for `global` and `project`. A durable claim with no expiry never gets rechecked |
| `confidence` | 0–1 |
| `supports` | `d-NNN` (an ADR) or another `c-` id. Both are resolved; a dangling target fails the lint |

The schema is **closed** — an unknown field is an error, not a comment.

## 3 · The resolvers

| `verified_by` | What runs |
|---|---|
| `source` | URL returns 2xx · the recorded `quote` is present in the fetched text · `accessed` is real and not in the future |
| `command` | Runs it; asserts exit code and optionally a stdout regex. Opt-in: declare `evidence.unchecked_exit: N` to map exit code N to `unresolved` — the corollary of Rule 10, for checks that gate on *environment* (load, corpus presence) not *result* |
| `judge` | Checks that a judgment was recorded, that no judge dissented, and that a `risk: high` panel spans **≥2 model families** |

`claim-freshness` runs over every durable claim regardless: an expiry nobody checks is the
same as no expiry.

**The one invariant: no resolver returns `pass` when it could not check.** Three outcomes —
`pass`, `fail`, `unresolved` — and `unresolved` is treated as a would_block. This is the
whole difference between a gate and a decoration.

**Stated limit on `judge`.** It does not call a model. It verifies that a judgment exists,
is unanimous, and is independent; an unjudged claim stays `unresolved` forever until
someone runs `node scripts/ledger.mjs judge <id>` and pastes the verdicts back. A resolver
that invents a verdict is worse than one that admits it has none.

## 4 · Shadow mode, and what blocks anyway

Every gate ships in shadow first — the verdict is computed and written to `events.jsonl` as
`claim.would_block`, and the build stays green — so the friction is *measured* rather than
guessed. The exceptions block from day one, because `git revert` does not undo them:
**migration · deploy · harness self-edit**. They are marked `enforcement: block` in
[`.claude/qa-tier-floor.yml`](../../.claude/qa-tier-floor.yml).

Outbound send is named in ADR-001 as a fourth exception and is **not** in the tier map,
because this repository has no outbound-send path. A pattern matching nothing would read as
coverage it does not have.

Network-dependent resolvers never guard a blocking path — every `enforcement: block` rule
uses `claim-command` only — so an outage produces an honest log line, not a red build for an
unrelated reason.

### Dispositions — what happens when a claim comes due

On expiry, exactly one disposition is recorded:

| `action` | Effect | Requires |
|---|---|---|
| `refresh` | The evidence was renewed. **Does not short-circuit anything** — the resolver still runs, because saying you refreshed it is not the same as it passing, and only one of those is checkable | `reason` |
| `deprecate` | The claim is retired and resolves clean. Nothing is checked because nothing is claimed | `reason` |
| `waive` | Checking is postponed to a date. Live → passes, showing the deadline. **Lapsed → fails harder than no disposition at all**, because somebody promised to come back and did not | `until` + `reason` |

A waiver with no end date is refused by the schema. That is not pedantry: an open-ended waiver is the claim
being switched off, which is the exact thing the expiry mechanism exists to prevent.

### The promotion decision — due 2026-09-08

A shadow window with no end date is not a measurement, it is a disabled check with better manners. Phase 3
shipped one without a date; this is the correction.

**The deadline enforces itself.** `c-shadow-window-open` below carries `valid_until: 2026-09-08`. On that
date `claim-freshness` fails it, and the only way to clear it is to record a disposition. No scheduler, no
reminder, no calendar entry anyone can ignore — the ledger's own expiry mechanism books its own review.

**Read the evidence with `node scripts/ledger.mjs events --since 30d`.** Then, per resolver:

| Resolver | Promote to `enforcement: block` when… | Keep in shadow if… |
|---|---|---|
| `claim-freshness` | Its only would_blocks came from the canary and from claims that were genuinely stale. Deterministic, no network, no model — the cheapest to promote | It fired on claims that were *fine*, meaning the expiry windows are set too short |
| `claim-command` | Every would_block corresponded to a real broken command | It produced flakes — a timeout, a machine-specific path, anything that failed for a reason the change did not cause |
| `claim-source` | **Not promotable on this evidence alone.** It needs the network, so an outage makes it `unresolved` and promoting it would fail builds for reasons unrelated to the diff | Always, until either an offline evidence cache exists or it is scoped to paths where a network failure is an acceptable build failure |
| `claim-judge` | It has judged something. As of this writing it has resolved exactly one claim, `unresolved` | It stays unexercised — a mechanism nothing invokes is stop condition 7, not a gate |

The bar is the one used to promote `qa-lead-pass.yml`: **promote only what fired correctly and cost nothing.**
A resolver that produced no events at all is not quiet, it is not running — that is a bug report, not a
promotion.

## 5 · One classifier

[`.claude/qa-tier-floor.yml`](../../.claude/qa-tier-floor.yml) answers all four questions
about a path — `tier`, `resolvers`, `required_claim_kinds`, `enforcement` — and
[`scripts/lib/classifier.js`](../../scripts/lib/classifier.js) is its only implementation.
The 25 lines of bash that reimplemented the same matching inside `qa-lead-pass.yml` are
gone. Two implementations of risk classification will disagree, and you find out during the
incident.

Test it by execution: `node --test scripts/classifier.test.mjs`. Never by reading a glob and
believing you know what it matches.

## 6 · Commands

```bash
node scripts/ledger.mjs build          # regenerate the index
node scripts/ledger.mjs build --check  # CI: exit 1 if the index drifted
node scripts/ledger.mjs rebuild        # ADR-001's name for the same thing
node scripts/ledger.mjs lint           # parse + schema + supports resolution
node scripts/ledger.mjs verify         # run every resolver; log; block where required
node scripts/ledger.mjs verify --offline   # network resolvers report unresolved, never pass
node scripts/ledger.mjs judge <id>     # print the lens pack for a judged claim
node scripts/ledger.mjs views          # the generated views over the ledger
node scripts/classify.mjs <paths...>   # what the classifier says about a path
```

## 7 · What this does not do yet

Stated rather than implied, so nobody has to discover it:

- **`DECISIONS.md`, `LONG-TERM.md`, `USER-INSIGHTS.md` and `CODEBASE-MAP.md` are not yet
  generated views.** ADR-001 says they become one; `ledger views` proves the rendering
  works, but migrating four hand-maintained files carrying real founder memory is a data
  migration, not a Phase 3 deliverable. Losing that content to a conversion bug would cost
  more than the staleness it fixes. **Owner: Phase 6**, whose gate now includes proving the
  migration non-lossy against the pre-migration files — recorded in
  [AGENT-SYSTEM-REBUILD.md §4](AGENT-SYSTEM-REBUILD.md) rather than left as a shrug.
- **No `claim-arithmetic` resolver.** §3.2 of the rebuild plan shows one. It is deliberately
  absent from the tier map: the classifier's registry is closed and throws on a resolver
  name nothing implements.
- **The claim-decomposition tax is still unmeasured.** That is what the shadow window is
  for. Stop condition 3 in the rebuild plan is the check.

---

## Claims this document makes about the system

Each of these runs. `node scripts/ledger.mjs verify` executes every one of them, and CI
runs that on every PR.

```claims
claims:
  - id: c-schema-lint-clean
    assert: "Every agent definition under .claude/agents/ passes the 07b schema lint"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node .claude/hooks/schema-lint.js", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-gate-logic-tested
    assert: "The QA verdict logic in gate-logic.mjs passes its unit tests"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node --test .claude/workflows/lib/gate-logic.test.mjs", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-skills-manifest-matches-disk
    assert: "The skills MANIFEST is generated from disk and has not been hand-edited"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/build-skills-manifest.mjs --check", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-no-dead-registrations
    assert: "Every registration points at a file that exists, and every governing doc names only real repo paths"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/check-registration.mjs", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [d-001]

  - id: c-one-risk-classifier
    assert: "Risk classification has exactly one implementation — the bash reimplementation inside qa-lead-pass.yml is gone"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "! grep -q 'declare -A RANK' .github/workflows/qa-lead-pass.yml", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [d-001]

  - id: c-classifier-tested-by-execution
    assert: "The tier map is tested by running it against a path list, not by reading its globs"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node --test scripts/classifier.test.mjs", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [c-one-risk-classifier]

  - id: c-resolvers-never-pass-unchecked
    assert: "No resolver returns pass when it could not check — proven by the resolver test suite"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node --test scripts/ledger.test.mjs", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [d-001]

  - id: c-shadow-window-open
    assert: "Claim resolvers on documentation paths are still in shadow mode; the promotion decision is due on this claim's valid_until"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/classify.mjs docs/02-competitive/any.md | grep -q 'enforcement=shadow'", expect_exit: 0}
    valid_until: 2026-09-08
    confidence: 1
    supports: [d-001]

  - id: c-run-log-has-a-reader
    assert: "The run log is read on a schedule — `ledger sweep` reports expiry, lapsed waivers and dead resolvers, and is run by a cron workflow and by the session-start hook"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/ledger.mjs sweep --since 30d", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [c-shadow-window-open]

  - id: c-sweep-never-fails-what-it-cannot-check
    assert: "An absent run log makes the sweep PARTIAL with zero findings; only a log that EXISTS and is empty counts as a dead resolver"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node --test scripts/ledger.test.mjs", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [c-resolvers-never-pass-unchecked]

  # CORRECTED 2026-08-12. The previous assert — "injected into each session ... mechanical
  # rather than discretionary" — was FALSE, at confidence 1, and its resolver could not see
  # that. It ran `session-start.test.mjs`, which tests what the HOOK EMITS. The hook emits
  # correctly: 25,613 bytes. What the SESSION RECEIVES is a ~2KB preview plus a path to a
  # persisted file, so an agent must CHOOSE to open it — the definition of discretionary.
  #
  # Standing rule 3: test the artifact a guard produces, not just the guard. The evidence
  # below now checks both halves, so the claim can only pass once the payload actually fits.
  # It FAILS today and logs claim.would_block, which is the correct state for known debt:
  # visible, dated, and not asserted away. The fix is a router — lens ids and one-line
  # summaries, ~1.5KB — the same cure Phase 7 found for skills.
  #
  # THRESHOLD 4096 IS A SAFETY MARGIN, NOT THE REAL LIMIT, and the distinction matters.
  # The runtime's actual cutoff is undocumented; "~2KB" is inferred from one sighting of a
  # rounded UI label ("Preview (first 2KB)"). `wc -c` also measures the whole hook JSON —
  # including the ~65-100 byte hookSpecificOutput wrapper — not the bare additionalContext
  # string, so it is a proxy, not the quantity the runtime actually gates on. At today's
  # 25,613 bytes the imprecision is irrelevant: it is 6x over even the generous line. It
  # would matter once the router lands near 1.5KB, which is why the gate sits at 4096
  # rather than the guessed 2048 — a claim must not flip on an unverified boundary. Confirm
  # the real threshold before the router ships, and tighten this then.
  - id: c-lenses-and-playbooks-are-loaded
    assert: "The lens and playbook index REACHES AGENT CONTEXT at session start — the hook emits a compact router (ids + one-line summaries + file paths, ~2.9KB) that stays under the 4,096 byte inline threshold, so the router is mechanical; full lens and playbook files are read on demand"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node --test scripts/session-start.test.mjs && test $(AGENTVIBE_HOOK_NO_REFRESH=1 node .claude/hooks/session-start.js | wc -c) -le 4096", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    # REFRESH COMPLETE 2026-08-16 (feat/session-start-router). The hook previously emitted
    # 27,069 bytes; the runtime inlined ~2KB and handed the rest over as a file pointer, so
    # the full files never reached context. Fix: the hook now emits a compact router carrying
    # ids + one-line summaries + paths (~2.9KB), the same cure that took skills discovery from
    # ~15,000 tokens to ~1,300. Measured: AGENTVIBE_HOOK_NO_REFRESH=1 node .claude/hooks/session-start.js | wc -c -> 2,941.
    disposition: {action: refresh, reason: "Router shipped 2026-08-16 on feat/session-start-router: the hook now emits a compact index at 2,941 bytes (was 27,069 — 6.6x over budget). The payload was shrunk, not the budget. Historical record: pre-fix the runtime inlined a ~2KB preview and persisted the rest as a file path, so loading was discretionary. Now the entire payload fits inline."}

  # REFRESHED 2026-08-12, by direct observation from a fresh session — the one thing the
  # waiver said it was waiting for. The runtime DOES honour hookSpecificOutput.additionalContext:
  # the hook fired and its output was delivered. But delivery is not inlining. 25,613 bytes
  # were emitted; 24,490 were persisted to a file under the session's tool-results directory
  # and a ~2KB preview was inlined with the path. So the capability is real and the payload
  # is the problem — which is why c-lenses-and-playbooks-are-loaded above now fails rather
  # than this one. verified_by stays `judge` with judged_by empty, so this sits UNRESOLVED
  # rather than passing: a single observation by the agent that wrote the hook is not a
  # judgement panel, and rule 10 says a resolver never passes what it could not check.
  - id: c-sessionstart-injection-unverified
    assert: "Claude Code honours hookSpecificOutput.additionalContext at SessionStart — the hook's output IS delivered to the session — but a payload above the runtime's inline threshold arrives as a persisted file path plus a short preview rather than as inline context"
    kind: runtime-capability
    scope: project
    verified_by: judge
    evidence:
      lenses: [reproducibility]
      risk: high
      judged_by: []
    valid_until: 2026-11-09
    # 0.7, not the 0.9 first written. This is a risk: high, verified_by: judge claim, which
    # the design gates behind an independent panel spanning ≥2 model families. The evidence
    # is one observation, by the same agent that wrote the hook, with no panel. That is
    # strong for a BINARY question — was the output delivered at all — and weak as a basis
    # for a near-settled number a skimming reader would trust.
    confidence: 0.7
    disposition: {action: refresh, reason: "observed directly from a fresh session on 2026-08-12: the hook emitted 25,613 bytes, 24,490 were persisted to tool-results and a ~2KB preview was inlined with the file path. Delivery confirmed; inlining disproved. The remaining risk moved to c-lenses-and-playbooks-are-loaded, which now checks payload size and fails until the router fix lands"}

  - id: c-skills-curation-is-auditable
    assert: "Every one of the 63 skill cuts names the test it failed in CURATION.yml, and CI fails when the directory drifts from that decision — a skill cannot creep back in, nor a survivor quietly vanish"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/curate-skills.mjs --check", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-skill-discovery-is-two-tier
    assert: "Skill discovery costs ~1,070 tokens via routers/INDEX.md plus one namespace, against ~15,000 for reading MANIFEST.json whole, and the routers cannot drift from the namespace mapping"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/build-skill-routers.mjs --check", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-skills-lint-only-universal-fields
    assert: "Only name and description are required of a skill, because they are the two fields near-universal across the 803-file candidate pool — requiring more fails on contact with any corpus we did not author"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/curate-skills.mjs --check", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-external-skill-corpora-not-evaluated
    assert: "The 803 external candidates across 11 public corpora were NOT evaluated in this curation — this is the local 147 honestly cut, and no claim of best-in-the-world is made anywhere"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "grep -q 'were NOT evaluated' .claude/skills/CURATION.yml", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-codebase-map-is-generated
    assert: "CODEBASE-MAP.md is generated from disk and the ledger, and CI fails when it drifts — a hand-maintained map is trusted and wrong the moment someone forgets"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/gen-codebase-map.mjs --check", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-decisions-not-ledger-derivable
    assert: "DECISIONS.md is NOT a generated view: it records rejected options and rationale, and the claim schema has no field for either, so a non-lossy migration is impossible by construction rather than by difficulty"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/ledger.mjs lint", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-war-room-removed
    assert: "The war-room directory is gone — 25 files and 3,256 lines whose three populations each had an existing home, including 16 decorative budget: blocks that nothing read"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "test ! -d .claude/agents/war-room", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-no-nul-bytes-in-tracked-source
    assert: "No tracked text file contains a NUL byte, so no grep-based check can silently return nothing and exit 1 on a file it appears to have searched"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/check-registration.mjs", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-lens-content-is-linted
    assert: "Lens files are checked for content, not only shape — vagueness, placeholders and dead provenance all fail"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node --test scripts/lenses.test.mjs", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [d-001]

  - id: c-reviewers-cannot-write
    assert: "No read-only reviewer declares a Write or Edit tool — an agent that can edit what it reviews will review what it can edit"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "! grep -lE '^tools:.*(Write|Edit)' .claude/agents/code-reviewer.md .claude/agents/security-engineer.md .claude/agents/design-critic.md .claude/agents/researcher.md .claude/agents/adversary-engineer.md", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-no-decorative-capabilities
    assert: "No agent declares an mcpServers capability that no MCP configuration backs"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "node .claude/hooks/schema-lint.js", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-playbooks-declare-no-method
    assert: "Every playbook declares stages and exit criteria only — a stage carrying steps, how or method fails the lint"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node --test scripts/playbooks.test.mjs", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [d-001]

  - id: c-commands-name-no-phantom-agents
    assert: "No slash command assigns work to an agent that does not exist in this repository"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/check-registration.mjs", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-read-only-engines-declare-no-write
    assert: "The reviewer engine declares no Write or Edit tool — verified as a declaration, NOT as a runtime binding"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "node .claude/hooks/schema-lint.js", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1

  - id: c-read-only-binding-unverified
    assert: "Whether the tools field actually BINDS at runtime is unverified — the probe needs subagent spawning, which is disabled in these sessions"
    kind: runtime-capability
    scope: project
    verified_by: judge
    evidence:
      lenses: [reproducibility]
      risk: high
      judged_by: []
    valid_until: 2026-09-08
    confidence: 0.5
    # DISPOSITION 2026-08-16 — Refresh. BOTH HALVES OF THE ASSERT ABOVE ARE NOW FALSE, and
    # the assert is left standing on purpose: it is the evidence for why expiry discipline
    # exists. A claim that sat waived for a month, reasoning from a constraint that had been
    # deleted from the live prompts, is worth more as a preserved record than as a tidy edit.
    #
    # False half 1: "subagent spawning is disabled in these sessions" — PR #63 removed that
    # constraint from the entry prompts and `c-nested-subagent-spawn-works` records depth 2
    # confirmed by direct probe.
    # False half 2: "whether the tools field BINDS is unverified" — it was measured today.
    # See `c-read-only-binding-verified-by-attempt` below for the probe and its bound.
    #
    # `refresh` is chosen over `deprecate` deliberately. Refresh does NOT short-circuit the
    # resolver, so this claim's `claim-judge` still reports `unresolved` against its empty
    # panel — which is correct and costs one `would_block`. The verification lives in a
    # command claim now; this entry is the history, not the evidence. Deprecating it would
    # buy a green line by asserting the question was retired, and it was not: it was answered
    # somewhere else, on a path this claim never named.
    disposition: {action: refresh, reason: "Superseded in substance by c-read-only-binding-verified-by-attempt, measured 2026-08-16: reviewer-readonly was dispatched and instructed to ATTEMPT Write, Bash and Edit; all three returned NOT_PRESENT (absent, not refused), the control Read succeeded, and the reported tool list was exactly [Read, Glob, Grep]. The assert above is retained unedited because both of its halves are now false — subagent spawning is not disabled (PR #63 deleted that constraint from the live prompts) and the binding is no longer unverified — and a stale assert preserved beside its correction is the ledger's own argument for expiry. This claim stays UNRESOLVED rather than passing: its judged_by is empty, and rule 10 says a resolver never passes what it could not check"}
    supports: [c-read-only-engines-declare-no-write]

  # MEASURED 2026-08-16 by dispatching `reviewer-readonly` — the container the binding QA
  # judge runs in — and instructing it to genuinely ATTEMPT the forbidden actions rather than
  # reason about whether it could. Reasoning about a capability is not a measurement of it;
  # that distinction is the whole reason the claim above sat unverified for a month.
  #
  #   write NOT_PRESENT · bash NOT_PRESENT · edit NOT_PRESENT
  #   tools_i_actually_have  ["Read","Glob","Grep"]
  #   control_read SUCCEEDED  ("# Agentvibe — Project Context")
  #
  # Three properties make it strong. The tools were ABSENT, not present-and-refused — a
  # refusal would mean the capability exists and a hook is the only thing standing in front
  # of it, and hooks fail (see c-mcp-hook-matcher-must-name-the-tool, where the matcher's
  # fall-through allows every tool it does not name). The control read SUCCEEDED, so the
  # probe could demonstrably act and its silence on write was not inability to do anything.
  # And the reported tool list matched the declaration exactly, with nothing extra.
  #
  # THE BOUND, AND IT IS NOT A FORMALITY: the probe ran through the `Agent` TOOL path.
  # `qa.js` dispatches its judge through `agent()` on the WORKFLOW surface (qa.js:321-324).
  # Those are very likely the same mechanism — MCP grant probes behaved identically across
  # both — but the workflow path was NOT measured, and this claim certifies the containment
  # of the gate that runs on that path. Reporting success about a path nobody exercised is
  # the exact defect this ledger exists to catch, so the gap is written into the assert
  # rather than left to a reader's charity.
  #
  # The command cannot re-run the dispatch — no resolver can. It pins the DECLARATION side:
  # the tool list is exactly [Read, Glob, Grep], JUDGE_AGENT still resolves to this engine,
  # and the judge dispatch still names an agentType (without which nothing binds at all, per
  # c-maxturns-binds-when-agenttype-named). Each of the three was mutation-tested and fails
  # on its own.
  - id: c-read-only-binding-verified-by-attempt
    assert: "The tools field BINDS at runtime on the Agent dispatch path, measured 2026-08-16 rather than reasoned about: reviewer-readonly was dispatched and instructed to attempt the forbidden actions, and Write, Bash and Edit all returned NOT_PRESENT — absent, not present-and-refused — while a control Read succeeded and the reported tool list was exactly [Read, Glob, Grep]. BOUND: this measured the Agent tool path only. qa.js dispatches its judge via agent() on the Workflow surface, which was NOT measured, so the gate's containment rests on the two paths behaving alike — likely, and unverified. The command checks the declaration side only: reviewer-readonly declares exactly [Read, Glob, Grep], JUDGE_AGENT routes to it, and the judge dispatch names an agentType"
    kind: runtime-capability
    scope: project
    verified_by: command
    evidence:
      cmd: "grep -qxF 'tools: [Read, Glob, Grep]' .claude/agents/reviewer-readonly.md && grep -qxF \"const JUDGE_AGENT = 'reviewer-readonly'\" .claude/workflows/qa.js && grep -qF 'agentType: JUDGE_AGENT' .claude/workflows/qa.js"
      expect_exit: 0
    valid_until: 2026-11-14
    confidence: 0.8
    supports: [c-read-only-engines-declare-no-write]

  - id: c-effort-frontmatter-binding-unverified
    assert: "Whether the frontmatter effort field is READ at all is unverified — the VALUE binds where it is set, but zero agent files declared it before 2026-08-16, so that channel has never been exercised"
    kind: runtime-capability
    scope: project
    verified_by: command
    evidence: {cmd: "test $(grep -lE '^effort: (low|medium|high|xhigh|max)$' .claude/agents/*.md | wc -l) -eq $(grep -L 'kind: shim' .claude/agents/*.md | wc -l) && grep -q 'WHAT IS NOT VERIFIED: whether the FRONTMATTER FIELD is read at all' .claude/hooks/schema-lint.js", expect_exit: 0}
    valid_until: 2026-09-08
    confidence: 0.5
    supports: [c-read-only-binding-unverified]

  - id: c-qa-gate-blocks
    assert: "The QA-Lead gate blocks: qa-lead-pass.yml no longer carries continue-on-error"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "! grep -q 'continue-on-error' .github/workflows/qa-lead-pass.yml", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [d-001]

  # ── Registered 2026-08-16 ──────────────────────────────────────────────────
  # Four facts that were living in prose. STATUS.md named the problem exactly:
  # "durable facts live only in prose — which is exactly where the maxTurns belief
  # lived while it was wrong."
  #
  # Every one is verified_by: command, deliberately. A `judge` claim with judged_by: []
  # resolves `unresolved` forever, and two already sit in that state
  # (c-sessionstart-injection-unverified, and c-runtime-nested-spawn in the global
  # scope). A third would be registering a fact as a permanent would_block.

  # MEASURED 2026-08-16 by two probes dispatched through the `Agent` tool: `designer`
  # held 24 mcp__playwright__* tools including browser_navigate; `builder` held zero
  # mcp__* tools. That settles a question three documents left contested —
  # GRANT-HOLDERS.md §3.7, ROSTER-SIZE F1, GRANT-HOLDERS.md §8 X2.
  #
  # The command below CANNOT re-run that probe — a runtime dispatch is not available to
  # a resolver. It checks the CONFIGURATION the measurement was taken against: that
  # designer still declares playwright, that .mcp.json still backs it, and that builder
  # still declares nothing. If any of the three changes, the measurement no longer
  # describes this repository and the grant must be re-probed.
  - id: c-mcp-grant-binds-through-agent-dispatch
    assert: "An agent file's mcpServers: grant NARROWS across an Agent dispatch — builder (declares nothing) held zero mcp__* tools in all observations. Whether ARRIVES is uncertain: on 2026-08-16 a designer probe held 24 mcp__playwright__* tools; on 2026-08-17 three independent designer dispatches held zero, with configuration intact (.mcp.json and designer.md both declare playwright). Cause unknown. The command verifies only configuration, not live behaviour."
    kind: runtime-capability
    scope: project
    verified_by: command
    evidence:
      cmd: "grep -qF 'mcpServers: [playwright]' .claude/agents/designer.md && grep -qF '\"playwright\"' .mcp.json && ! grep -q '^mcpServers:' .claude/agents/builder.md"
      expect_exit: 0
      configuration_only: true
    valid_until: 2026-11-14
    confidence: 0.6
    supports: [c-no-decorative-capabilities]
    disposition: {action: refresh, reason: "ARRIVES contradicted — three designer dispatches on 2026-08-17 held zero playwright tools while configuration (mcp.json, designer.md) was intact; NARROWS not contradicted (builder held zero in both observations). Assert narrowed to state only what both observations agree on. Confidence lowered from 0.9 to 0.6. configuration_only:true added so verify reports this claim distinctly from claims that re-measure live behaviour. See issue #90."}

  # CORRECTED 2026-08-16. This repository recorded the OPPOSITE as measured fact. The
  # corpus behind that belief named no agent file, so nothing in it could have been
  # capped. Naming `agentType` at four dispatch sites in qa.js made the cap live and
  # cost three failed gate runs before anyone looked at the field. Do not "clean up"
  # maxTurns believing it inert.
  #
  # Observed ceilings on the seven engines as of this writing: builder, designer,
  # orchestrator, reviewer and reviewer-readonly at 30; framer and sourcer at 25. The
  # command checks that the field is required and range-checked and that all seven
  # declare one — not the specific numbers, which are a tuning decision and would make
  # this claim fail on a legitimate edit.
  - id: c-maxturns-binds-when-agenttype-named
    assert: "maxTurns binds when a dispatch names an agentType and not otherwise, so the field is live rather than decorative: schema-lint.js requires it on every agent, refuses any value outside [5, 120], and all seven engines declare one. Bounded honestly — the cap explains 13 of 20 observed reviewer dropouts; the other 7 recorded 21-34 tool calls, above the cap, and are unexplained. The dropout measurement is against the DECLARED values (25-30), which this branch did not change; only the lint ceiling moved, 30 to 120"
    kind: runtime-capability
    scope: project
    verified_by: command
    evidence:
      cmd: "sed -n '/const REQUIRED_FRONTMATTER/,/^];/p' .claude/hooks/schema-lint.js | grep -qF maxTurns && grep -qF 'fm.maxTurns < 5 || fm.maxTurns > 120' .claude/hooks/schema-lint.js && test $(grep -lE '^maxTurns: [0-9]+$' .claude/agents/builder.md .claude/agents/designer.md .claude/agents/framer.md .claude/agents/orchestrator.md .claude/agents/reviewer.md .claude/agents/reviewer-readonly.md .claude/agents/sourcer.md | wc -l) -eq 7"
      expect_exit: 0
    valid_until: 2026-11-14
    confidence: 0.8
    supports: [c-schema-lint-clean]

  # The sentence "the hook still fires" propagated into four files before anyone checked
  # the matcher. It is false for every MCP tool the matcher does not name, because
  # pre-tool-use.sh's final case is `*)` with the comment "Unknown tool — allow."
  #
  # This claim is deliberately a change-detector: it pins the matcher string AND the
  # fall-through, so it fails the day either one moves. That is the point — the cost of
  # this fact going stale unnoticed has already been paid once.
  - id: c-mcp-hook-matcher-must-name-the-tool
    assert: "An mcp__* tool call reaches pre-tool-use.sh only if settings.json's PreToolUse matcher names that exact tool. The matcher names exactly one — mcp__playwright__browser_navigate — and the hook's final case allows any tool it does not recognise, so every other MCP tool on this machine is unhooked"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence:
      cmd: "grep -qE 'matcher.: .Bash[|]Edit[|]Write[|]NotebookEdit[|]mcp__playwright__browser_navigate.' .claude/settings.json && grep -qxF '  *)' .claude/hooks/pre-tool-use.sh && grep -qF 'Unknown tool — allow' .claude/hooks/pre-tool-use.sh"
      expect_exit: 0
    valid_until: 2026-11-14
    confidence: 1
    disposition: {action: deprecate, reason: "THE CHANGE-DETECTOR FIRED, AND IT WAS RIGHT. PR #73 (merged 2026-08-16) moved both pinned strings: the matcher became 'Bash|Edit|Write|NotebookEdit|mcp__' — a prefix, so every MCP tool now reaches the hook rather than one — and the '# Unknown tool — allow' fall-through was replaced by mcp_policy_check(), which decides by server scope. The assert above is retained UNEDITED because it is now false in both halves, and a stale assert preserved beside its correction is this ledger's own argument for expiry. Deprecate rather than refresh: the question this claim asked — 'is every other MCP tool unhooked?' — was retired by the fix, not re-answered. Verified by the CEO on 2026-08-16 while auditing a would_block that first read as a regression and was not one. Succeeded by c-mcp-matcher-names-the-prefix-and-policy-decides"}

  # The successor to c-mcp-hook-matcher-must-name-the-tool, registered 2026-08-16 the same
  # day its predecessor was deprecated. PR #73 fixed the defect that claim documented and
  # registered NOTHING in its place, which left the new containment behaviour unclaimed —
  # the gap is easy to miss precisely because the ledger got quieter, not louder.
  #
  # Kept as a change-detector in the same spirit: it pins the matcher AND the decision
  # function AND the tests, so it fails the day any of the three moves. A claim that only
  # ran the test suite would not have caught a matcher revert, because the suite exercises
  # the hook script and not the settings wiring that routes calls into it — the "check
  # looked somewhere the answer was always yes" defect this repo keeps finding.
  - id: c-mcp-matcher-names-the-prefix-and-policy-decides
    assert: "Every mcp__* tool call reaches pre-tool-use.sh, because settings.json's PreToolUse matcher names the mcp__ PREFIX rather than one exact tool; the hook then decides by server scope in mcp_policy_check() instead of falling through to allow. An absent policy file allows every MCP call (the pre-policy behaviour) and an unreadable one blocks, so the failure mode is closed rather than open"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence:
      cmd: "grep -qE 'matcher.: .Bash[|]Edit[|]Write[|]NotebookEdit[|]mcp__.' .claude/settings.json && grep -qF 'mcp_policy_check' .claude/hooks/pre-tool-use.sh && node scripts/pre-tool-use.test.mjs"
      expect_exit: 0
    valid_until: 2026-11-14
    confidence: 1
    supports: [c-mcp-hook-matcher-must-name-the-tool]

  # The founding fabrication, registered at last. "Subagents cannot spawn subagents
  # (nested Task is blocked)" is FALSE on this runtime — probed 2026-08-11 and again
  # 2026-08-13, depth 2 confirmed, depth 3 observed in the fleet corpus
  # (AGENT-ARCHITECTURE.md:386-387: main → cto → qa-lead → adversary-engineer).
  #
  # The measured half lives in the global ledger as c-runtime-nested-spawn, which is
  # verified_by: judge with an empty panel and therefore permanently unresolved. This
  # claim is the CHECKABLE half: that the repository's own operating instructions no
  # longer assert the falsified constraint. A false belief contradicted only in a status
  # document still ships inside the prompt.
  #
  # OPEN CAVEAT, preserved rather than rounded off: the probe ran in plan mode with a
  # read-only child. Write-capable nesting outside plan mode still needs one confirming
  # test before the caveat can be dropped.
  - id: c-nested-subagent-spawn-works
    assert: "Subagents CAN spawn subagents on this runtime — depth 2 confirmed by direct probe on 2026-08-13, depth 3 observed in the fleet corpus — and no live operating instruction under .claude/entry/ asserts the contrary. Caveat: the probe ran in plan mode with a read-only child, so write-capable nesting outside plan mode is still unconfirmed"
    kind: runtime-capability
    scope: project
    verified_by: command
    evidence:
      cmd: "! git grep -q 'subagents cannot spawn' -- .claude/entry/"
      expect_exit: 0
    valid_until: 2026-11-14
    confidence: 0.85
    supports: [d-001]
```

---

*Owner: ceo · Phase 3 · 2026-08-11*
