# AGENTS.md — Routing Table

*Seven engines, derived from a 38-job inventory. Domain expertise is a lens, not an agent.*

---

## How to route

**Start at `orchestrator`.** It reads the state, picks the playbook, and dispatches.

| Request type | Start here |
|---|---|
| Any task | `orchestrator` |
| Slash commands | `/build` `/fix` `/ship` `/design` `/research` — each invokes a playbook |

You do not usually name an engine. You name the work; the playbook names the engines.

---

## The seven engines

The roster collapsed from 26 agents in Phase 4b. They were never distinct procedures — they were one
procedure per shape of work, repeated once per domain, with the domain knowledge baked into prose that
rotted. The domain knowledge is now [.claude/lenses.yml](.claude/lenses.yml), which a linter can check.

| Engine | Distinct because | Tools | Model |
|---|---|---|---|
| **orchestrator** | Owns state and the human boundary — the only engine that ends a turn on approval | + `Task` | Opus 4.7 |
| **framer** | Fuzzy → structure → options → decision. Produces the thinking artifact, not the thing | write, no `Bash` | Sonnet 4.6 |
| **sourcer** | "Never assert without evidence" is a discipline, not a skill | web, **no repo write** | Sonnet 4.6 |
| **builder** | Artifact in isolation → structured return | write + `Bash`, worktree | Sonnet 4.6 |
| **designer** | The only producing engine with a perception loop: render → look → iterate | write + `Bash`, worktree | Sonnet 4.6 |
| **reviewer** | Read-only and out-of-band. **No `Write`, no `Edit`** | **read-only** | Sonnet 4.6 |
| **reader** | Not task-triggered — a periodic sweep over the ledger and the run log | **read-only** | Haiku 4.5 |

`reviewer` and `reader` have no write tools at all. *An agent that can edit what it reviews will review what
it can edit* — and before Phase 4a, four of the five read-only reviewers declared `Write`.

---

## What replaced what

| Was | Now | Why they were never separate |
|---|---|---|
| ceo · cto · cpo · cmo · cbo · cco · qa-lead · research-lead · design-lead | **orchestrator** (+ lens) | Nine copies of one orchestration procedure, one per domain |
| backend · frontend · database · ai · devops · data · test engineers · technical-writer · supabase-cleaner | **builder** (+ lens) | One procedure; what differed was which lens verified the result |
| code-reviewer · security-engineer · adversary-engineer · design-critic · qa-engineer | **reviewer** (+ review lens) | Five agents differing only in which lens they carried |
| researcher · research-lead | **sourcer** | The same discipline at two scopes |
| product-designer · design-polisher | **designer** | Build and polish are one perception loop |

---

## Shims — eleven names kept occupied on purpose

Eleven of the collapsed agents also exist in `~/.claude/agents/`, drifted. **Project agents shadow global
ones**, so deleting a repo file does not remove the name — it hands the name to the older copy. For `ceo`
that meant swapping a 226-line Opus definition for a 313-line Sonnet one routing to four agents this repo
retired.

So those eleven names keep a shim: `ceo` · `qa-lead` · `code-reviewer` · `security-engineer` · `design-lead`
· `research-lead` · `researcher` · `ai-engineer` · `database-engineer` · `technical-writer` · `test-engineer`.

A shim declares no tools and no model. It routes, and it names the phase that removes it — **Phase 9**, when
the fleet is reconciled and both copies go.

The other fifteen were deleted outright, because with no global twin their removal fails loudly, which is
what you want.

---

## Where the knowledge lives

| Surface | File | Checked by |
|---|---|---|
| How to **produce** work in a domain | [.claude/lenses.yml](.claude/lenses.yml) | `schema-lint.js` — content, not just shape |
| How to **judge** it | [.claude/review-lenses.yml](.claude/review-lenses.yml) | `schema-lint.js` + the independence rule |
| The **stages** a category of work passes | [.claude/playbooks/](.claude/playbooks/) | `schema-lint.js` — and a stage may not declare method |
| What the system **asserts** | [.claude/ledger/index.json](.claude/ledger/index.json) | `scripts/ledger.mjs` |
| What **risk** a path carries | [.claude/qa-tier-floor.yml](.claude/qa-tier-floor.yml) | `scripts/lib/classifier.js` — one implementation |

Lens provenance is recorded as `git:<path>@<rev>` where the source file was deleted in the collapse. The
claim "this expertise came from that file" stays checkable after the file is gone, and `schema-lint` verifies
it with `git cat-file`.

---

## War-room routines

25 scheduled routines remain under [.claude/agents/war-room/](.claude/agents/war-room/) with their own
schema, deliberately outside `schema-lint`'s walk. **24 of the 25 call services this repo has no
configuration for.** They are cut to roughly three in Phase 6; nothing has been done to them yet, and that is
stated rather than implied.

---

*Updated Phase 4b · 2026-08-11 · supersedes the 3-layer CEO → C-suite → worker topology*
