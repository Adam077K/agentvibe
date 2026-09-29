# Panel 4 — Memory and self-improvement (opus, read-only)

**Position in one line:** memory should be plain markdown in git plus claims that expire and name what they replace. Improvement should be a weekly loop that is limited in size, runs against a fixed eval set, and is judged by a model from a different family (Codex) and by the founder. No vector or graph database, and no self-rewriting between those weekly steps, until one of the triggers below fires.

**Measured in this repo on 2026-09-29.** `CLAUDE.md` is **69,338 bytes (about 17k tokens) and carries 23 "Superseded" blocks.** It loads in full into every session — the worst memory failure in the system right now. The harness already knows the cure (the two-tier skills routers took lookup from ~15k to ~1.1k tokens). Also: `DECISIONS.md` 39,516 of 40,000 bytes; `USER-INSIGHTS.md` empty; 69 project claims and 4 global; 205 session files. Nothing in memory is about a venture yet — all of it is about the harness.

## 1. Keep from S1.1
- **C05 §1 memory-job split** (working, episodic, semantic, procedural, intent, projections). Keep the split, simplify storage. "Indexes are never authority; derivatives can be rebuilt" stays.
- **C05 §2 context manifest** as a small "context pack": source paths with hashes, token count, what was left out. Keep "not found" vs "not searched" vs "excluded". Consequential amounts, deadlines and promises enter as exact references, never summarised.
- **Original wording (C05 §1, L05).** Customer quotes, taste examples and promises stay verbatim with source. A summary never replaces them.
- **Founder corrections (C05 §1, L12 F6).** Captured with scope, effective date, what it replaces, and whether it changes intent or corrects a fact. Silence or a quick approval is not a new standard.
- **CAP-34 lessons** as hypotheses with scope, a rival explanation and a falsifying test. One failure never becomes a global rule.
- **B08 / CAP-46 core.** The candidate change may not control the evaluator, case selection, scoring, or the logs it is judged on (the Darwin Gödel Machine candidate gamed its logging markers — L12). Sealed holdout; exposed cases move into regression. Keep pass^k, injected-defect controls and rollback.
- **C06 invariant.** Producer testimony is not independent observation (already enforced: reviewer has no Write; resolvers never pass what they could not check).
- **Harness pieces that already implement this:** the claim ledger (`valid_until`, three-valued resolvers), `evict-memory.mjs` (stubs, pinning, rotating archives), the block on harness self-edits. Extend, do not replace.

## 2. Cut or defer
| S1.1 item | Now | Trigger to bring back |
|---|---|---|
| 18 C05 record types (ValidityEpoch, DependencyClosure, SemanticMappingVersion…) | Cut to 4: claim, source, context pack, outcome row | A second person writes to the knowledge base |
| Per-item `trust_level`, `dropped_constraints[]`, `assembled_for_class` | One bit: *external content vs owner/agent content* | First inbound customer channel |
| Deletion propagation across embeddings, backups, providers; ForgetRequest | Supersede and archive only | First stored customer personal data, or first EU customer |
| InstrumentCalibration / EvaluatorProfile admission | Small labelled calibration set per judge | A judge gates money, publishing or anything customer-facing |
| Stochastic baseline, cumulative drift statistics | Weekly deltas on 5 metrics | >50 agent tasks a week, or a second operator |
| Canary rollout of system changes | Merge behind QA gate, revert with git | Agent behaviour inside a paying customer's product |
| Graph memory (Zep/Graphiti) | Defer | FTS retrieval <85% on the venture's golden question set, or >~2k docs in one venture |
| Mem0 as primary memory (CLAUDE.md stack) | **Cut as system of record** | Only inside a venture's own product for its end users |
| Automated system improvement | Manual weekly loop, founder-approved | ≥20 labelled cases per skill (unlocks GEPA runs) |

## 3. Add
1. **Context budget as a tested contract**, byte ceilings checked in CI: `CLAUDE.md` ≤8 KB; owner memory ≤4 KB; venture brief ≤6 KB; session-start payload ≤4 KB (existing rule). "Superseded" prose moves to an archive; only the current rule and a link stay.
2. **Six memory layers, one location each:** Working (context window + context pack) · Session (session files + Claude Code transcripts on disk, searchable) · Project/venture (`company/` in each venture repo: decisions, customers, offers, metrics as markdown with embedded claims) · Owner (`~/.warroom/owner.md` + `preference` claims) · Cross-venture (global ledger; a lesson reaches it only with evidence from ≥2 ventures) · Harness (this repo).
3. **Venture isolation by construction.** One repo per venture; the loader refuses cross-venture reads (PersistBench measured 53% median cross-domain leakage).
4. **Supersede edges.** Ledger fields `supersedes:` and `valid_from:` — the useful half of XTDB's two time axes. Fixes the Memora failure where a correction is retrieved next to the belief it replaced.
5. **Write quarantine.** Web pages, customer messages and tool output enter memory only as a `source` claim with a quote — never as a preference, instruction or skill edit (MINJA / AgentPoison defence).
6. **Outcome log.** Append-only `outcomes.jsonl` per venture and globally: task, playbook, skill versions, model, gate result, founder verdict and edit distance, turns, cost, rework within 14 days. The only input to improvement.
7. **`/correct` command.** One founder line creates a scoped preference or fact claim that supersedes the old one.
8. **Weekly improvement loop** (one session, <30 turns): cluster outcome-log failures → ≤3 one-page change packets (evidence, diff, rival explanation, falsifier, rollback) → regression suite + new cases → Codex judges pairs blind → founder yes/no → merge via irreversible-tier gate. After every model upgrade, a subtraction test (current scaffold vs simplified, L12 F7).
9. **Evals:** deterministic floor (`npm run check`); golden suites per skill and playbook (5–20 cases, pass^3); founder-labelled holdout (20–30 cases, promotion only, rotated monthly); retrieval golden set per venture (20 questions with known answers).
10. **Five drift alarms, weekly:** first-pass gate PASS rate; founder edit/reject rate; rework rate; cost and turns per task; `would_block` count. A ≥20% week-on-week move pauses improvement.
11. **Skill retirement.** Unused 90 days, or loses its subtraction test → removed from `CURATION.yml`.

## 4. ADOPT / ADAPT / LEARN / BUILD
| Component | Verdict | Tool (licence) | Reason |
|---|---|---|---|
| Instruction memory, progressive disclosure | ADOPT | Claude Code `CLAUDE.md` hierarchy + skills | Native, cached, zero build |
| Auto memory | ADAPT | Claude Code auto memory; `MEMORY.md` capped at 200 lines (code.claude.com/docs/en/memory, 2026-09-29) | Inbox only, promoted weekly — it writes without review (PersistBench sycophancy risk) |
| Canonical knowledge and claims | ADAPT | This repo's claim ledger + `evict-memory.mjs` | Already enforces expiry, provenance, no-false-pass. Add `supersedes`, `valid_from`, venture scope |
| Search | ADOPT | SQLite FTS5 + ripgrep; sqlite-vec later | Selective Forgetting study: flat retrieval F1 0.468 beat graph 0.417 (L05) |
| Temporal graph | LEARN now, ADOPT on trigger | Graphiti (Apache-2.0) | Take time-bounded facts without the DB; vendor-authored benchmarks |
| Memory service | LEARN | Mem0, Letta (Apache-2.0) | Letta memory blocks + "sleep-time" consolidation → weekly job. Mem0 LLM-decided extraction loses information (LongMemEval) |
| Eval runner | ADOPT | promptfoo (MIT; OpenAI-acquired Mar 2026) | Exec providers can call `claude -p` and `codex exec`; forkable |
| Tracing and eval UI | DEFER then ADOPT | Langfuse (MIT core) | Trigger: outcome log >10k rows or founder wants a UI |
| Prompt/skill optimiser | ADAPT on trigger | GEPA `optimize_anything` (MIT) | Needs ≥20 labelled cases and a capped rollout budget |
| Structure vs parameters | LEARN | DSPy (MIT) | Treat trigger, examples, instructions as separate variables |
| Provenance | LEARN | W3C PROV, XTDB time model | Fields only |
| Context-pack loader, outcome log, `/correct`, weekly retro workflow, budget CI check | BUILD | Node scripts in the harness, ~1 session each (~5 jobs) | Must attach to this ledger, gate and hooks |

## 5. Top 3 risks
1. **Self-grading drift.** Claude writes, judges and proposes improvements; quick founder approvals read as endorsement (MT-Bench self-enhancement; Sharma et al. sycophancy). Mitigation: Codex judges promotions; founder labels the holdout; the candidate cannot edit evals, hooks or resolvers; show the founder the approval-without-edit rate. Codex bug #19945 (empty stdout when detached from a TTY) needs a PTY wrapper or the second opinion is decoration.
2. **Stale or poisoned memory steering action** (superseded belief; customer message as instruction; venture A leaking into B). Mitigation: supersede edges, write quarantine, one repo per venture, weekly expired-claim sweep. Test: a seeded correction must change the next answer; a seeded injection must not.
3. **Context rot and memory-system cost** (the 69 KB `CLAUDE.md` is the evidence; GEPA rollouts burn rate limits; "searching is more engaging than serving customers", L12). Mitigation: CI byte caps; improvement ≤1 session/week plus fixed rollout budget; loop pauses in any week with no shipped venture output.

## 6. Founder-only questions
1. May Codex, on your subscription, be the standing second-family judge for promotions and the irreversible tier (with the TTY workaround)?
2. Claude Code auto memory in venture repos: inbox only, reviewed weekly (recommended), or trusted to write directly?
3. Labelling time: ~20 min/week retro approval + ~1 h/month holdout relabel? Without it, improvement is self-graded.
4. Venture separation: one repo per venture with no cross-reads (recommended), or shared reads for the portfolio view?
5. May the harness `CLAUDE.md` be cut to 8 KB with superseded history archived? (Irreversible tier.)
6. Paused/closed venture memory: archive read-only forever, or keep for a period then erase?

Sources (accessed 2026-09-29): code.claude.com/docs/en/memory · github.com/getzep/graphiti · qaskills.sh promptfoo acquisition · github.com/langfuse/langfuse · gepa-ai.github.io optimize_anything. Research figures from L05, L06, L12 (sources accessed 2026-09-12), not reproduced here.
