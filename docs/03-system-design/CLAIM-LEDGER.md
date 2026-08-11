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
| `valid_until` | **Required** for `global` and `project`. A durable claim with no expiry never gets rechecked |
| `confidence` | 0–1 |
| `supports` | `d-NNN` (an ADR) or another `c-` id. Both are resolved; a dangling target fails the lint |

The schema is **closed** — an unknown field is an error, not a comment.

## 3 · The resolvers

| `verified_by` | What runs |
|---|---|
| `source` | URL returns 2xx · the recorded `quote` is present in the fetched text · `accessed` is real and not in the future |
| `command` | Runs it; asserts exit code and optionally a stdout regex |
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
    assert: "The run log is read by something — `ledger events` summarises it by claim, resolver and status"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node scripts/ledger.mjs events --since 30d", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [c-shadow-window-open]

  - id: c-qa-gate-blocks
    assert: "The QA-Lead gate blocks: qa-lead-pass.yml no longer carries continue-on-error"
    kind: internal-fact
    scope: project
    verified_by: command
    evidence: {cmd: "! grep -q 'continue-on-error' .github/workflows/qa-lead-pass.yml", expect_exit: 0}
    valid_until: 2026-11-09
    confidence: 1
    supports: [d-001]
```

---

*Owner: ceo · Phase 3 · 2026-08-11*
