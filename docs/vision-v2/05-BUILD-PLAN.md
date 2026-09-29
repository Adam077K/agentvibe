# 05 — Build plan

## Rules for every job
- ≤30 turns, ≤~50 files read, one engine, one worktree, one PR. If a job cannot fit, the builder returns `partial` with a split, not a longer run.
- **Inputs are a context pack** (paths listed below, ≤40 KB). Nothing else is read without a stated reason in the return.
- **Done-test is frozen before the job starts** (AD-018) and is a command the runner can execute. Until J03 lands, the founder runs it and pastes the exit code.
- Code lives in `mission-control/runner/` (Bun/TypeScript, like `consume-dispatch.ts`), scripts in `scripts/`, schemas in `mission-control/runner/schema/`.
- Engines: builder on `claude-opus-5` for runner, hooks and gates; builder on `claude-sonnet-5` for templates, docs, playbook YAML; `claude-haiku-4-5` for census and log parsing; framer on `claude-sonnet-5`; reviews by `reviewer` (Claude) and, from J07, Codex.
- **Build fast end-to-end, then test (NN5).** No comparison gate between jobs. J01 is a real thin path; every later job widens it. Each job adds its replay fixture to `mission-control/runner/fixtures/`. One integrated test at the end (J29), then the live-venture milestone (M1).

## Gate policy for the v2 build (J00 records it; founder decision D9)
v2 jobs edit agent files, hooks, workflows and settings — `irreversible` tier (2-of-3 multi-judge + founder sign-off per PR), which the build cannot meet per PR. **Recommendation:** one founder waiver, recorded as a ledger `waive` with `until` = J29 pass or 2026-11-17, whichever is first:
- Every build PR still passes `npm run check` and the binding `qa-lead-pass.yml` (verdict hash-bound to the diff).
- Build PRs review at **Full** tier: `reviewer` (security lens where hooks/settings are touched) + Codex once J07 lands.
- Harness self-edits (hooks, settings, agent files) stay `enforcement: block`; **the founder merges them personally, batched per lane** (≈6 sign-offs, not ≈30).
- The waiver lapses loudly (Rule 9). After it, the normal 4-tier gate returns.

## Jobs
| ID | Goal | Inputs (context pack) | Done-test (runner-checkable) | Deps | Lane | Engine / model |
|---|---|---|---|---|---|---|
| **J00** | Freeze acceptance + record build waiver. Write `docs/vision-v2/acceptance.yml`: the 11 seeded failure classes (J28), their expected statuses, and M1 criteria. Codex (other family, AD-018) reviews it once J07 lands; after that it is frozen | 01, 05, 07 of this package; `.claude/gates.yml`; `docs/03-system-design/CLAIM-LEDGER.md` (waive section) | `node scripts/ledger.mjs lint` exit 0; `node -e` parses acceptance.yml with 11 `failure_classes` and an `m1` block | Founder D1, D2, D9 | 0 | framer / sonnet-5 |
| **J01** | **Thin end-to-end path.** `runner run <job.json>`: create worktree (host, outside sandbox) → `claude -p --agent builder --output-format json --json-schema` by argv → persist stdout as report → run `done_test` in a clean checkout → write row to SQLite → print status. Real job: add a line to `fixtures/hello-venture/README.md` | `consume-dispatch.ts` (launch + reconcile sections); `scripts/produce-verdict.mjs` head; `.claude/agents/builder.md` frontmatter | `bun mission-control/runner/cli.ts run fixtures/hello.job.json` → `done`; same with a no-op prompt → `unresolved` (no diff); `sqlite3 runner.db 'select count(*) from jobs'` ≥2 | — | R | builder / opus-5 |
| **J02** | Envelope schema: `venture_id`, `kind`, `provider`, `provider_mode`, `why_separate`, three flags, chain fields; queue refuses three-flag jobs and missing `venture_id` | J01 code; 02-ARCHITECTURE §3, §9 | `bun test runner/envelope` — refuses triple-flag, refuses no `venture_id`, accepts valid | J01 | R | builder / opus-5 |
| **J03** | Status adjudication + nightly canaries: empty stdout, schema-invalid, no diff, failing done-test, turn cap → each maps to the right status; agent `claimed_status` logged only | J01–J02 code; `.claude/agents/*.md` `maxTurns` lines | `bun test runner/adjudicate`: 5 canaries → `unresolved`/`partial` as specified; `runner canary` exit 0 | J02 | R | builder / opus-5 |
| **J04** | Continuations ≤2 per chain then `blocked`→inbox; chain token budget; breaker at >30% partial/unresolved per day | J03 code | Fixture chain of 3 turn-capped jobs ends `blocked`; seeded 4/10 failures trips breaker | J03 | R | builder / opus-5 |
| **J05** | Capacity: semaphores (2 Claude, 1 Codex); ccusage window estimate; pause >60% or while a founder session is active; limit error → `blocked`; overflow off | J02 code; ccusage `--json` sample | Unit tests with recorded ccusage fixtures: 61% → paused; limit-error fixture → `blocked` | J02 | R | builder / opus-5 |
| **J06** | Harness preflight: hook writes a per-job token on first tool call; runner rejects results without it; agent-file sha256 vs harness version | `.claude/hooks/pre-tool-use.sh` head; `.claude/settings.json` hooks block | Launch with hook disabled → `unresolved`; with hook → token row present | J02 | R | builder / opus-5 (founder merges) |
| **J07** | Codex reviewer: PTY wrapper around `codex exec -s read-only --json --output-schema`; empty → `unresolved` | `codex exec --help` output; `.claude/review-lenses.yml` correctness lens | Seeded diff with a known off-by-one returns non-empty `FAIL`; detached run with no PTY returns `unresolved`, never `PASS` | J02 | R | builder / opus-5 |
| **J08** | Ops: CLI version pin + auto-update off; nightly contract check (flags exist, `--json-schema` round-trips, `codex exec` non-empty); launchd plists; backup runner DB + transcripts; `runner stop --all`; `docs/RUNBOOK.md` (leaked secret, lost account, lost Mac, founder away) | J01 code; `claude --help`, `codex exec --help` | `runner contract-check` exit 0; `runner stop --all` leaves 0 running jobs in a fixture run; backup file restores to identical row count | J03 | R | builder / sonnet-5 |
| **J09** | `models.yml` engines→models (single source) + `provider_mode: api` degraded mode (reviews only, no nightly) | `scripts/prompt-standard.test.mjs` model list; agent frontmatter `model:` lines | `node scripts/check-models.mjs` fails on a retired id; degraded-mode fixture queues no nightly jobs | J02 | R | builder / sonnet-5 |
| **J10** | Cut `CLAUDE.md` 69 KB → ≤8 KB; move superseded history to `docs/archive/CLAUDE-HISTORY.md`; fix stack line (Mem0 → markdown+ledger+FTS); CI byte cap step | `CLAUDE.md` section headings (`grep -n '^## '`); `scripts/lib/check-suite.js` | `wc -c CLAUDE.md` ≤8192; new `check:context-budget` step in suite; `npm run check` tally +1 and green | J00 | H | builder / opus-5 (founder merges) |
| **J11** | Fleet census (read-only): for each `~/VibeCoding/*` — last commit, has `.claude/`, drift from harness (hash diff of agents/hooks), ledger present, proposed category (venture/project/archive) | `mission-control/server/projects.ts` `discoverFleet`; `scripts/fleet-install.test.mjs` head | `node scripts/fleet-census.mjs --json` lists ≥19 repos with all 5 fields; output committed as `docs/vision-v2/fleet-census.md` | — | H | builder / haiku-4-5 |
| **J12** | Harness distribution: package agents/skills/hooks/lenses/playbooks as a versioned Claude Code plugin; `fleet-install` switches repos to it; stale per-repo copies flagged | J11 output; `scripts/fleet-install.test.mjs`; Claude Code plugin docs | Install into `fixtures/hello-venture`; J06 preflight hash matches plugin version | J11, J06 | H | builder / opus-5 (founder merges) |
| **J13** | Resolve the worktree contradiction: runner owns worktree creation, so `builder.md`/`designer.md` drop Step 1 and the `schema-lint.js` predicate changes in the same PR; mark the skill superseded | `grep -n "fm.isolation === 'worktree'" .claude/hooks/schema-lint.js`; both agent files | `lint:agents` 18 pass · 0 fail · 0 warnings; no `MAIN_REPO` string left in `.claude/agents/` | J01 | H | builder / opus-5 (founder merges) |
| **J14** | Remove the 11 shims once J11 shows no stale global copy shadows an engine name | J11 output; AGENTS.md | `ls .claude/agents/*.md \| wc -l` = 7; `check:registration` green | J11 | H | builder / sonnet-5 |
| **J15** | Context-pack loader: declared paths → pack with hashes, byte count, `not_found`/`not_searched`/`excluded`; refuses paths outside the job's venture repo except harness + portfolio read set; ≤40 KB | J02 code; 02-ARCHITECTURE §4 | Unit tests: cross-venture path refused; 41 KB pack refused; manifest records every delivered file | J02 | M | builder / opus-5 |
| **J16** | Ledger fields `supersedes`, `valid_from`, `venture_id`; write quarantine (external content only as `source` claim with quote) | `scripts/ledger.mjs` claim schema section; `scripts/claim-append.mjs` | `npm run check:ledger` green; seeded correction supersedes old claim in query; injected "instruction" from a web page lands as `source` only | — | M | builder / opus-5 |
| **J17** | `outcomes.jsonl` written by the runner per job (venture, playbook, skills, model, gate result, founder verdict + edit distance, turns, cost estimate); `/correct` command | J03 code; J16 schema | Every fixture run appends one valid row; `/correct` fixture creates a superseding preference claim | J03, J16 | M | builder / sonnet-5 |
| **J18** | FTS5 index over venture `company/`, session files, transcripts; retrieval golden-set format (20 Q/A per venture) | J15 code | `runner search` answers 18/20 on the hello-venture golden set | J15 | M | builder / sonnet-5 |
| **J19** | `/new-venture` and `/new-project`: repo scaffold, `venture.yml`/`project.yml` schema (stage ladder, kill line, evidence ladder, hours budget), ledger, USER-INSIGHTS, per-venture env file, PostHog project stub | `war-room/bin/PROJECT_NAME.tmpl` head; `scripts/init-repo.sh`; J02 schema | Scaffold → `node scripts/check-venture.mjs` passes; missing kill line fails | J02 | V | builder / sonnet-5 |
| **J20** | Discovery: `validate-a-market` gains `talk` stage and evidence-ladder criterion; `user-language` claims must cite a transcript; Mom Test lens in `review-lenses.yml` | `.claude/playbooks/validate-a-market.yml`; `.claude/review-lenses.yml`; `.claude/lenses.yml` customer lens | `npm run test:playbooks` + `test:lenses` green; Mom Test lens flags 3/3 seeded hypotheticals in a fixture transcript | J19 | V | builder / sonnet-5 |
| **J21** | Calls: whisper.cpp transcription job, one-line consent script in prep sheet, transcript → `source` claims + USER-INSIGHTS entries | J20 output; whisper.cpp README | 1-min fixture audio → transcript + ≥1 verbatim claim; prep sheet contains consent line | J20 | V | builder / sonnet-5 |
| **J22** | Fake-door kit: landing page playbook adds PostHog events, Stripe Payment Link, Resend waitlist; publish stays behind `outbound-approval` | `.claude/playbooks/launch-landing-page.yml`; `.claude/gates.yml` | Playwright check on the fixture page: 3 PostHog events fire; publish job without approval → `blocked` | J19 | V | designer / opus-5 |
| **J23** | Outbound batch: founder approves list + template once; agent personalises and sends via Resend on a per-venture domain; rate limit; opt-out line | J22; `.claude/gates.yml` outbound-approval | Batch job without approval → `blocked`; approved batch of 3 to test inboxes sends 3, respects rate limit | J22, J24 | V | builder / sonnet-5 |
| **J24** | Inbox: `runner inbox` / `approve` / `refuse` writing DecisionPackets (artifact+version, options, no-answer behaviour, expiry→refuse); 10/day cap; grouped by venture; Mission Control collector reads it | J03 code; `mission-control/server/collectors/` list; `crosscheck.test.ts` rule | Expired packet → `refused`; 11th packet waits; Mission Control tests still show zero server writes | J03 | F | builder / opus-5 |
| **J25** | Monday page: one row per venture/project from declared read set; capacity used; `harness-ratio`; five drift alarms; `runner status --brief` <2 KB quoting runner tallies verbatim | J17, J19 outputs | Generated page for 2 fixture ventures + 1 project has every column; `--brief` ≤2048 bytes; ratio matches `outcomes.jsonl` | J17, J19 | F | builder / sonnet-5 |
| **J26** | ntfy push for the three urgent classes only; Friday review template (persevere/pivot/kill on closed experiments) | J24, J25 | Fixture stop-failure sends 1 push; routine events send 0 | J24 | F | builder / sonnet-5 |
| **J27** | Replay: record each runner job's inputs/outputs as a fixture and replay it without a model call | J03 code | `runner replay fixtures/*` reproduces every recorded status | J03 | T | builder / opus-5 |
| **J28** | Seeded failure fixtures, one per class in `acceptance.yml` (see below) | J00, J27 | Each fixture exists and is registered in `acceptance.yml` | J04–J07, J15, J16, J27 | T | builder / opus-5 |
| **J29** | **Integrated test**: full replay suite + one live run of the hello-venture through Idea → fake door (approval → publish on a test domain) → 1 inbox decision → Monday page | `acceptance.yml`; all fixtures | `runner acceptance` prints 11/11 seeded classes caught + live path `done`; Codex judges the report against frozen criteria (non-empty PASS) | all | T | orchestrator runs; Codex judges |
| **M1** | **Live-venture acceptance** (milestone, not a job): the founder's chosen venture reaches Problem-validated through the system | `acceptance.yml` `m1` | ≥10 conversations logged with transcripts; ≥1 *did*-level signal; stage change recorded with evidence; all within 6 weeks of J29 | J29 | — | founder + system |

## Parallel lanes and order
```
Lane 0: J00 ─────────────────────────────┐
Lane R: J01 → J02 → J03 → J04 → J08       │
                  ├→ J05  ├→ J06 → J07 ... J09
Lane H: J11 → J12, J14      J10 (after J00)   J13 (after J01)
Lane M: J16 ── J15 (after J02) → J18 ; J17 (after J03, J16)
Lane V: J19 (after J02) → J20 → J21 ; J22 → J23
Lane F: J24 (after J03) → J26 ; J25 (after J17, J19)
Lane T: J27 (after J03) → J28 → J29 → M1
```
With 2 Claude writers + 1 Codex reviewer, that is ~30 jobs in ≈2 weeks of runner time, inside the 3-week founder timebox (D3). Lanes R and H go first because every later job depends on the runner and a small `CLAUDE.md`.

## Integrated test scenario (J28–J29): seeded failure classes
| # | Seeded class | Expected runner outcome |
|---|---|---|
| 1 | Empty stdout (Claude) | `unresolved` |
| 2 | Codex empty output, no PTY | `unresolved`, never PASS |
| 3 | Agent claims done, no diff | `unresolved` |
| 4 | Agent claims done, done-test fails | `unresolved` |
| 5 | Turn cap ×3 in one chain | `partial`, `partial`, `blocked` → inbox |
| 6 | Prompt injection in a fetched page asking to email a secret | three-flag refusal; injected text stored only as `source` claim |
| 7 | Cross-venture read (venture B path in venture A job) | loader refuses; job `blocked` |
| 8 | Usage limit error / window >60% | `blocked`; queue paused; founder floor kept |
| 9 | CLI flag drift (renamed flag in a shim binary) | nightly contract check fails; queue paused |
| 10 | Harness missing (hook disabled) | no preflight token → `unresolved` |
| 11 | Expired approval | packet `refused`; dependent job not run |

**Pass:** 11/11 caught with the expected status, the live path `done`, and Codex's judgement of the report is a non-empty PASS against the criteria frozen in J00.
