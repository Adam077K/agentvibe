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

### The promotion decision — taken 2026-08-20, deferred to 2026-11-17

A shadow window with no end date is not a measurement, it is a disabled check with better manners. Phase 3
shipped one without a date; this is the correction.

**The deadline enforces itself.** `c-shadow-window-open` below carries `valid_until: 2026-09-08`. On that
date `claim-freshness` fails it, and the only way to clear it is to record a disposition. No scheduler, no
reminder, no calendar entry anyone can ignore — the ledger's own expiry mechanism books its own review.

**It worked, and the answer was "not yet."** The review happened early, on 2026-08-20, and the disposition on
`c-shadow-window-open` is `waive` to **2026-11-17** — read the reason on the claim, not this paragraph,
because the reason is where the cost is recorded. In summary: the corpus is **9,837 `claim.would_block` events over 42 claims and 9 days**,
**100% the harness describing itself**, with one deliberate canary supplying 36.0% and four claims supplying
83%. No venture workload has ever run through the harness. Three of the four resolvers are disqualified by
the table below on their own terms. The fourth, `claim-command`, **fails its own bar** —
`c-run-log-has-a-reader`'s evidence command exits 0 or 1 depending on whether a log file exists and is empty,
which `ledger verify` itself decides by writing to that log, so a would_block there measures bookkeeping order
rather than a broken command.

**Those numbers were measured, and the earlier ones were quoted.** The handoff's `9,790 / 42 / four
artifacts` went into two documents before anyone read the log. Re-measured on 2026-08-20 it is `9,837 / 42 /
six artifact strings`, where the six are four real artifacts plus two scratchpad fixtures from an old ledger
test — so "four" and "six" were each right about a different question, and only counting settles it. The
count moved three times in one day (9,790 → 9,806 → 9,837) and **every new event came from someone measuring
the corpus, not from product work.** That is not a footnote about hygiene. A body of evidence that grows when
you look at it is evidence about looking, and promoting a gate on it would be promoting on the harness's
opinion of itself.

The date is **2026-11-17 and not later** because `first_waived: 2026-08-20` puts the two waived claims under
the 90-day cap in `waiverCapIssues()`; a later `until` would make `ledger lint` fail *before* the waiver
lapsed, which is a deadline that fires in the wrong order. Freshness and the cap now come due on the same day.

**Two waivers and one refresh — the third claim is deliberately not waived.**
`c-read-only-binding-unverified` had a waiver drafted and withdrawn: waiving it would have made `claim-judge`
report `✓ waived` against an empty panel, taking `ledger verify` from 5 would_block to 4 while leaving the
claim exactly as unverified as before. That trades **Rule 10** — *a resolver never passes what it could not
check*, one of the few CLAUDE.md marks `ENFORCED`, pinned by `ledger.test.mjs` for every other resolver — for
a smaller number. It stays on `refresh`, and its `valid_until` was bumped instead, because
`dispositionOutcome` returns null for `refresh` and so **only the date can move a deadline**. The two
mechanisms are separate; the claim now uses each for what it does. **5 is the intended count.** A later
reader who finds 5 and tidies it to 4 will have reverted a founder decision.

**The exit condition is a test, not a feeling:** at least one real sourced claim arising from non-harness
work, and a judge panel with two distinct model families. `risk: high` requires the second, and this runtime
supplies one family — so `claim-judge` may be structurally unresolvable rather than merely unexercised, which
is a different problem from the one the table below anticipated.

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
    # DISPOSITION 2026-08-20 — Waive to 2026-11-17. Founder decision, with the cost written down.
    #
    # A BARE WAIVER HERE WOULD BE FULLY COMPLIANT AND WOULD CHANGE NOTHING. The rethink board's
    # P2/K records why: the deadline enforces that a waiver was FILED, not that enforcement
    # advanced, so Waive → Waive passes forever. The reason field is therefore the entire
    # deliverable, and what follows is measurement rather than intention.
    #
    # THE CORPUS DOES NOT FIT THE DECISION IT WAS COLLECTED FOR.
    #
    #   Measured 2026-08-20 by reading ~/.agentvibe/events.jsonl directly. The earlier
    #   figures in the handoff were quoted, not run, and two of them had moved:
    #
    #     total events         11,930   (9,837 of them claim.would_block)
    #     distinct claims          42   handoff figure, confirmed
    #     distinct days             9   2026-08-11 … 2026-08-20, confirmed
    #     artifact strings          6   = 4 REAL artifacts + 2 scratchpad fixtures left by
    #                                     an earlier ledger test. This reconciles the
    #                                     handoff's "four" with a re-count's "six": both
    #                                     were right about different things.
    #     top claim             3,540   c-canary-unresolvable — 36.0%, the deliberate canary
    #     next three            1,698   c-sessionstart-injection-unverified (17.3%)
    #                           1,584   c-lenses-and-playbooks-are-loaded  (16.1%)
    #                           1,342   c-runtime-nested-spawn             (13.6%)
    #     top four together        83%  of every would_block ever recorded
    #
    #   It is 100% harness self-description. No venture workload has ever run through this
    #   harness; that is stop condition 6, still open.
    #
    #   AND THE CORPUS GREW WHILE BEING MEASURED. Three counts in one day: 9,790 in the
    #   handoff, 9,806 on a re-measure, 9,837 here — each larger, none of them caused by
    #   product work, all of them caused by people looking at the ledger. 55 would_block
    #   events were recorded on 2026-08-20 alone and every one is diagnostic. A corpus that
    #   expands when you inspect it is measuring the inspector, and that is the clearest
    #   evidence available that it does not resemble the workload promotion would govern.
    #
    #   Measured alongside this disposition: `ledger verify` → 5 would_block · 0 block. Two
    #   are the example.invalid canary; three are `verified_by: judge` claims with empty
    #   panels. It stays 5: a waiver on c-read-only-binding-unverified would have taken it to
    #   4 by SILENCING a line rather than resolving it, and was withdrawn for that reason —
    #   see that claim. Nobody should read 4 as progress, and nobody should produce it.
    #
    # PER RESOLVER, against the promotion table above:
    #   claim-freshness — the only one with a clean record, and the cheapest to promote.
    #   claim-source    — unchanged: already documented as not promotable on this evidence.
    #   claim-judge     — unexercised, and worse than the table anticipated: `risk: high`
    #                     demands ≥2 distinct model families and this runtime has one, so it
    #                     may be structurally unresolvable rather than merely untested.
    #   claim-command   — DOES NOT CLEAR ITS OWN BAR. This is the finding that decides the
    #                     round, and it was nowhere in the repo before today. The bar is
    #                     "every would_block corresponded to a real broken command."
    #                     `c-run-log-has-a-reader` produced one that did not. Its evidence is
    #                     `ledger sweep --since 30d`, which exits 0 when the events log is
    #                     ABSENT and 1 when it EXISTS BUT IS EMPTY — both verified by
    #                     execution, and both CORRECT, since that is exactly what
    #                     `c-sweep-never-fails-what-it-cannot-check` asserts. But `ledger
    #                     verify` writes to that same log while evaluating claims, so the
    #                     exit code reports the harness's own bookkeeping order rather than
    #                     the property the claim asserts. A resolver whose would_block
    #                     depends on which ledger command ran first is not measuring commands.
    #
    # EXIT CONDITION — stated so the next review has a test and not a feeling: at least one
    # real sourced claim arising from NON-harness work, and a judge panel with two distinct
    # model families. Until both exist, promoting is guessing with better paperwork.
    disposition: {action: waive, until: 2026-11-17, reason: "Founder decision 2026-08-20: waive, with the cost recorded, because a bare waiver changes nothing (P2/K — the deadline enforces that a waiver was filed, not that enforcement advanced). THE CORPUS DOES NOT FIT THE DECISION, measured 2026-08-20 by reading ~/.agentvibe/events.jsonl directly rather than quoting the handoff: 11,930 events of which 9,837 are claim.would_block, over 42 distinct claims and 9 distinct days from 2026-08-11 to 2026-08-20, across 6 artifact strings that are 4 real artifacts plus 2 scratchpad fixtures left by an earlier ledger test — which reconciles the handoff's four with a re-count's six, both right about different things. It is 100% harness self-description: the largest single contributor is the deliberate canary c-canary-unresolvable at 3,540 events or 36.0 percent, and the top four claims are 83 percent of everything. No venture workload has ever run through this harness (stop condition 6). AND THE CORPUS GREW WHILE BEING MEASURED — three counts in one day, 9,790 then 9,806 then 9,837, each larger, none caused by product work and all caused by people looking at the ledger; 55 would_block events were recorded on 2026-08-20 alone and every one is diagnostic. A corpus that expands when you inspect it is measuring the inspector, which is the clearest evidence available that it does not resemble the workload promotion would govern. Measured alongside this disposition: ledger verify gives 5 would_block and 0 block — two the example.invalid canary, three verified_by judge with empty panels. It stays 5. A waiver on c-read-only-binding-unverified would have taken it to 4 by silencing a line rather than resolving it, and was withdrawn for exactly that reason; see that claim. Per resolver: claim-freshness has the only clean record; claim-source is unchanged and still not promotable on this evidence, since an outage would fail builds for reasons unrelated to the diff; claim-judge is unexercised and risk high requires at least 2 distinct model families where this runtime has one, so it may be structurally unresolvable rather than merely untested; and claim-command DOES NOT CLEAR ITS OWN BAR. The bar is that every would_block corresponded to a real broken command, and c-run-log-has-a-reader produced one that did not — its evidence command is ledger sweep --since 30d, which exits 0 when the events log is ABSENT and 1 when it EXISTS BUT IS EMPTY (both verified by execution, and both correct, since that is what c-sweep-never-fails-what-it-cannot-check asserts), while ledger verify writes to that same log as it evaluates claims, so the exit code reports the harness's own bookkeeping order rather than the property the claim asserts. EXIT CONDITION for the next review: at least one real sourced claim arising from non-harness work, and a judge panel with two distinct model families."}
    first_waived: 2026-08-20
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

  # The gate must not be invocable by the thing it gates. Registered 2026-08-26 because the
  # containment was, until then, an ACCIDENT of an omission: `Workflow` was simply missing from
  # `TOOL_UNIVERSE`, so PS-TOOL-EXISTS refused it as "not a runtime tool" — false (binary 2.1.246
  # holds `var Xu="Workflow"`, and the tool fires 55 times in the transcript corpus). A refusal
  # whose stated reason is wrong invites the repair that breaks it: append the name to the
  # universe, and all seven engines may declare it with nothing to object.
  #
  # The orchestrator needs no such declaration and must not carry one either. It is not
  # dispatched — it IS the session, so no frontmatter field binds on the path it runs on
  # (CONTROL-PLANE.md §1.1), and the session already holds the tool. All 55 recorded calls carry
  # `isSidechain: false`; the same scan finds tens of thousands of subagent `Bash` calls, so it
  # sees sidechain entries and never sees this tool in one. Reaching the gate is a ROUTE (scripts/run-gate.mjs),
  # not a grant, and the rethink board's "add Workflow to orchestrator tools" was refuted here.
  #
  # THE ASSERT AND THE COMMAND WERE MISMATCHED IN THE FIRST VERSION OF THIS CLAIM, and the fix is
  # worth recording because it is Rule 10 applied to a claim rather than to a resolver.
  #
  # It cited `node --test scripts/prompt-standard.test.mjs`, which iterates `LIVE` — the SEVEN
  # engines (`prompt-standard.test.mjs:56`) — while asserting something about EVERY agent file,
  # of which there are eighteen. Shims early-return in `lintFile` before PS-WORKFLOW-CONTAINMENT
  # is reached, so a shim declaring the tool would have left the assert false and the claim green.
  # A resolver passing what it could not check is exactly what this repo's Rule 10 forbids.
  #
  # `node .claude/hooks/schema-lint.js` covers all EIGHTEEN, by two different rules, and both were
  # verified by construction against a control that fires:
  #   engine + `Workflow`  -> PS-WORKFLOW-CONTAINMENT   (clean engine file -> no issues)
  #   shim   + `tools:`    -> `shim: must not declare "tools" — a shim routes, it does not run`
  #
  # IT TAKES BOTH COMMANDS, because each has the blind spot the other covers. The lint checks the
  # TREE; the prompt-standard test checks the RULE. Repointing from one to the other traded a blind
  # spot rather than closing it. Measured, with the rule deleted from schema-lint.js:
  #   rule present, engine + `Workflow` -> flagged        (control: clean engine -> no issues)
  #   rule DELETED, engine + `Workflow` -> ADMITTED, lint exits 0  <- claim green, assert FALSE
  #   rule DELETED                      -> prompt-standard exits 1 <- the guard's own existence
  # Hence `&&`: eighteen files AND the rule that judges them. `claim-command` runs `/bin/sh -c`
  # (`scripts/lib/resolvers.js`), so the operator is real rather than decorative.
  #
  # TWO CLAUSES WERE DELETED FROM THE ASSERT, FOR ONE REASON. The first was "the orchestrator
  # reaches it by route rather than by grant" — an unverifiable SUBJECT: nothing in any command
  # touches `run-gate.mjs`. The second was "so the binding QA gate is not invocable by any engine
  # it gates" — an unverifiable PREDICATE, and it is the same shape. That is an ENTAILMENT, sound
  # only if a frontmatter declaration is the SOLE grant channel, and this repo's own
  # `scripts/check-dispatch-agenttype.mjs` says otherwise: a dispatch naming no agentType "gets the
  # runtime default — `general-purpose`, tools `*`". Whether that default contains `Workflow` is
  # measured NOWHERE in this branch. The only thing standing against it is observational absence —
  # exactly what the paragraph below says is not in this sentence.
  #
  # A clause no resolver evaluates is prose wearing a claim's shape, whether the gap is in its
  # subject or its predicate. Applying that to one and not the other is how the first version
  # survived review. The measurements behind both live in the session file and in
  # `scripts/probe-workflow-reach.mjs`.
  #
  # `confidence: 1` is retained deliberately, and only because what remains is a DECIDABLE property
  # of the tree that two deterministic commands settle. The observational half — that `Workflow` is
  # main-session-only, evidenced by absence — is precisely what is NOT in the sentence; had it
  # stayed, a flat 1 would have been miscalibrated.
  - id: c-workflow-invocation-contained
    assert: "No agent file declares a Workflow tool"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "node .claude/hooks/schema-lint.js && node --test scripts/prompt-standard.test.mjs", expect_exit: 0}
    valid_until: 2026-11-26
    confidence: 1
    supports: [c-no-decorative-capabilities]

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
    # BUMPED 2026-08-20 from 2026-09-08. THE DATE IS WHAT MOVED, NOT THE DISPOSITION — see
    # the 2026-08-20 note below. `dispositionOutcome` returns null for `action: refresh`
    # (resolvers.js:82), so a refresh cannot clear a deadline; only this line can.
    valid_until: 2026-11-17
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
    # DISPOSITION 2026-08-20 — STAYS ON REFRESH. The date moved instead.
    #
    # A WAIVER WAS DRAFTED HERE AND WITHDRAWN, and the reason it was withdrawn is the point
    # of this entry. Waiving would have made `claim-judge` report `✓ waived` against an
    # empty panel: measured, `ledger verify` went from 5 would_block to 4, and the line that
    # disappeared was this claim's own. The claim would have been no less unverified — only
    # the report quieter. That trades Rule 10 ("a resolver never passes what it could not
    # check") for a smaller number, and Rule 10 is one of the few CLAUDE.md marks ENFORCED,
    # pinned by ledger.test.mjs for every other resolver: `unresolved` must stay distinct
    # from `pass`. Founder decision 2026-08-20, taken once the cost was surfaced: keep the
    # honest would_block.
    #
    # SO THE COUNT IS 5, AND 5 IS THE INTENDED OUTCOME. If a later reader finds 5 and
    # "fixes" it to 4, they will have undone this decision. The 2026-08-16 author already
    # made the same call and wrote the same reasoning; it is repeated here because it was
    # nearly overwritten.
    #
    # WHAT ACTUALLY CLEARED THE 2026-09-08 DEADLINE is `valid_until`, bumped above to
    # 2026-11-17 — NOT the disposition. Verified by execution against
    # scripts/lib/resolvers.js: `dispositionOutcome` returns null for `action: refresh`, so
    # a refresh renews evidence and does not move a date. The 2026-08-16 refresh was the
    # right instrument and the only thing wrong with it was that it could not do this. The
    # two mechanisms are separate and this claim now uses each for what it does.
    #
    # 2026-11-17 matches the two waivers so all three come due together rather than
    # dribbling. No `first_waived`: the schema requires it only for `action: waive` on
    # scope:project (claims.js:617), and `waiverCapIssues()` keys the 90-day cap off its
    # presence — leaving it on a refreshed claim would apply a waiver cap to a claim nobody
    # waived, and report it as "waived for N days", which would be false.
    #
    #   PRESERVED — the 2026-08-16 refresh reason, verbatim, because it is the record of
    #   what was measured: "Superseded in substance by
    #   c-read-only-binding-verified-by-attempt, measured 2026-08-16: reviewer-readonly was
    #   dispatched and instructed to ATTEMPT Write, Bash and Edit; all three returned
    #   NOT_PRESENT (absent, not refused), the control Read succeeded, and the reported tool
    #   list was exactly [Read, Glob, Grep]. … This claim stays UNRESOLVED rather than
    #   passing: its judged_by is empty, and rule 10 says a resolver never passes what it
    #   could not check"
    #
    # `npm run test:probe-readonly` DOES NOT DISCHARGE THIS CLAIM, and must not be read as
    # doing so. Verified by execution: probe-readonly-engine.sh --report has exactly two
    # outcomes, FAIL (the probe file exists) and UNRESOLVED (everything else) — there is no
    # PASS path in the script at all. Those tests prove a fabricated or newline-injected
    # record cannot reach a success exit, which is a property of the REPORTING HARNESS, not
    # of the binding.
    #
    # THE EXPERIMENT THAT WOULD DISCHARGE IT, and it is cheap: dispatch a read-only engine
    # on the Workflow `agent()` surface — the one qa.js routes its judge through — and have
    # it ATTEMPT Write, Bash and Edit. That is the identical measurement already made on the
    # Agent surface and recorded in c-read-only-binding-verified-by-attempt. Until it is
    # run, the gate's containment rests on the two surfaces behaving alike: likely, and
    # unverified.
    disposition: {action: refresh, reason: "Founder decision 2026-08-20: STAY ON REFRESH and move the date instead. A waiver was drafted here and withdrawn. Waiving would have made claim-judge report waived against an empty panel — measured, ledger verify went from 5 would_block to 4 and the line that vanished was this claim's own — leaving the claim no less unverified and only the report quieter. That trades Rule 10, a resolver never passes what it could not check, for a smaller number; Rule 10 is one of the few CLAUDE.md marks ENFORCED and ledger.test.mjs pins unresolved as distinct from pass for every other resolver. So the count is 5 and 5 IS THE INTENDED OUTCOME: a later reader who finds 5 and fixes it to 4 will have undone this decision. WHAT CLEARED THE 2026-09-08 DEADLINE is valid_until, bumped to 2026-11-17, not this disposition — verified by execution against scripts/lib/resolvers.js, dispositionOutcome returns null for action refresh, so a refresh renews evidence and cannot move a date. The 2026-08-16 refresh was the right instrument and its only defect was that it could not do that; the two mechanisms are separate and this claim now uses each for what it does. No first_waived, because the schema requires it only for waivers on scope:project and waiverCapIssues keys the 90-day cap off its presence — leaving it here would cap a claim nobody waived. WHAT IS DISCHARGED: the Agent tool path, measured 2026-08-16, recorded in c-read-only-binding-verified-by-attempt. WHAT IS NOT: the Workflow surface qa.js dispatches its judge through. npm run test:probe-readonly does NOT discharge this claim — verified by execution, probe-readonly-engine.sh --report has exactly two outcomes, FAIL when the probe file exists and UNRESOLVED otherwise, with no PASS path in the script at all, so it proves the reporting harness is unforgeable rather than proving the binding. THE EXPERIMENT THAT WOULD DISCHARGE IT, and it is cheap: dispatch a read-only engine on the Workflow agent() surface and have it ATTEMPT Write, Bash and Edit — the identical measurement already made on the Agent surface. Until it runs, the gate's containment rests on the two surfaces behaving alike: likely, and unverified."}
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
    # DISPOSITION 2026-08-20 — Waive to 2026-11-17. Still unverified, and honest about it.
    #
    # WHAT CHANGED is the reason it is unverified, not the verdict. When this claim was
    # written, zero agent files declared `effort:`, so the channel could not be exercised
    # even in principle. Measured 2026-08-20: all seven non-shim engines declare it, 7 of 7.
    # The channel is populated now and has still never been observed being READ.
    #
    # The evidence command checks the DECLARATION side only, which is what it says it does.
    # Nothing in this repo can tell "the runtime read the field and chose this effort" apart
    # from "the runtime ignored the field", because both produce a dispatch that runs.
    #
    # WHAT WOULD DISCHARGE IT: two dispatches identical except for `effort:`, with a
    # measurable difference in turns or tokens; or vendor documentation stating the
    # frontmatter field is consumed. The first needs a real workload — the same precondition
    # the shadow window is waiting on, which is why these two waivers share a date.
    disposition: {action: waive, until: 2026-11-17, reason: "Founder decision 2026-08-20. Still unverified, and the reason has changed rather than the verdict: when this claim was written zero agent files declared effort, so the channel could not be exercised at all. Measured 2026-08-20, all 7 non-shim engines now declare it (7 of 7), so the channel is populated and has still never been observed being READ. The evidence command checks the declaration side only, which is what it states — nothing available here separates the runtime reading the field from the runtime ignoring it, since both produce a dispatch that runs. WHAT WOULD DISCHARGE IT: two dispatches identical except for effort, with a measurable difference in turns or tokens, or vendor documentation stating the frontmatter field is consumed. The first needs a real non-harness workload, the same precondition c-shadow-window-open is waiting on, which is why both waivers carry the same date."}
    first_waived: 2026-08-20
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
