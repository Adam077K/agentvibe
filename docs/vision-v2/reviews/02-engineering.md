# Review — Engineering mindset (opus, web research first, read-only)

**Verdict:** The control plane is sound — the runner decides status, launch is by argv, done-tests run in a clean checkout, anything unchecked is `unresolved`. But there is no crash or idempotency model, and three security boundaries are policies the worker's own shell can walk around. Fix those before J01 widens.

## Sources (accessed 2026-09-29)
1. Anthropic, multi-agent research system — https://www.anthropic.com/engineering/multi-agent-research-system (~15× chat tokens; resume from checkpoints; errors compound; rainbow deploys).
2. Anthropic, building effective agents — https://www.anthropic.com/engineering/building-effective-agents (workflows over agents where the path is known).
3. Anthropic, demystifying evals for agents (2026-01) — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents (20–50 tasks from real failures; pass^k; read transcripts; separate capability and regression suites).
4. Willison, "The lethal trifecta" — https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ ; Meta "Agents Rule of Two" and "The Attacker Moves Second" — https://simonwillison.net/2025/Nov/2/new-prompt-injection-papers/ (adaptive attacks beat 12 defences at >90%).
5. OWASP Top 10 for Agentic Applications 2026 (summary) — https://cycode.com/blog/owasp-top-10-agentic-applications/
6. OpenAI, practical guide to building agents — https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
7. Inngest, durable execution for agents — https://www.inngest.com/blog/durable-execution-key-to-harnessing-ai-agents ; Temporal vs Inngest — https://wetheflywheel.com/en/comparisons/temporal-vs-inngest/
8. "From Untrusted Input to Trusted Memory" — https://arxiv.org/pdf/2606.04329 ; SitePoint agent memory guide — https://www.sitepoint.com/ai-agent-memory-guide/

## Strengths
- **The runner adjudicates; the agent never does.** Three-valued status; empty Codex output = `unresolved`. Right answer to "errors compound" and silent false success.
- **Argv launch, no `--bare/--safe-mode`, CLI pinned and contract-checked nightly** — the CLI treated as a versioned dependency.
- **Read-only fan-out, serial writes** — Anthropic's orchestrator-worker lesson without write conflicts.
- **Three-flag refusal = Rule of Two in operational form**; write quarantine and supersede + `valid_until` answer memory poisoning and staleness.
- **Deferral by named trigger** (Temporal, Langfuse, graph memory, egress proxy).
- **Thin end-to-end path first**, replay fixture per job, one integrated test with 11 seeded classes.

## Weaknesses and single points of failure
1. **No crash semantics.** No leases, heartbeats, orphan reconciliation or idempotency keys. A runner crash leaves a half-written worktree, an orphaned `claude -p`, a row stuck `running`; a Resend batch or Stripe action can execute twice on retry. Durable execution is deferred until "a workflow waits days on an approval" — but expiring DecisionPackets and approve-then-send outbound are month one. The trigger fires inside M1.
2. **Done-tests frozen in argv only, not content** — the builder writes the test files the command runs.
3. **Done-tests run unsandboxed** — the runner executes LLM-authored argv against LLM-edited code with host privileges: a sandbox escape by design.
4. **The runner builds itself** — J01–J09 modify the adjudicator judging them if run from the working tree.
5. **Venture isolation is policy, not a boundary.** Workers have Bash; the sandbox read policy is deny-only (`cat ~/VibeCoding/other-venture/company/*` works). The per-venture env file lives inside the venture repo, so its protection depends on that repo's `.claude/settings.json` `**/.env*` denyRead — exactly what fleet drift breaks.
6. **Approval and status stores likely writable by workers.** Sandbox `allowWrite` includes `~/.agentvibe`, where `owner.md` and the portfolio live. If `runner.db` or the inbox is there, a worker can mark itself done or approve its own DecisionPacket.
7. **The three flags are self-declared by an LLM author.** Derive them: untrusted = any `source`/web item in the pack or an engine with WebFetch/Playwright; secrets = env injected; external send = network egress or a sending MCP grant. Any Bash + network job already has external send.
8. **The harness-loaded token can be forged** — written where Bash can read/write; proves the hook ran, not that the sandbox was armed.
9. **The second family is one PTY hack.**
10. **SPOFs in order:** the Mac, the Codex wrapper, the founder's 10 decisions/day (fails safe), the subscription terms.

## What will not scale, and when
- **SQLite runner:** fine for years at this volume with WAL, one writer, Mission Control read-only, backups via `VACUUM INTO`/`.backup` (a file copy isn't a live backup). Breaks at a second host or operator. Keep the state machine storage-agnostic.
- **Git worktrees under concurrency:** shared `.git` → `index.lock` and ref-lock contention within week one; no merge queue for job branches.
- **One Mac + subscriptions:** the real ceiling; ccusage is heuristic; headless consumer-subscription automation is a terms and throttling risk growing with each always-on job. Breaks at the first customer-facing SLA; pull the API-key exit forward for Codex judging.
- **Markdown memory:** adequate at ≤2k docs; gap is enforcement — engines with `Write` can bypass the quarantine by writing prose into `company/`. Breaks at ~5+ active ventures or semantic queries.
- **CLI as API:** the nightly check detects breakage but doesn't roll back — keep a known-good pinned binary and drain in-flight jobs before switching (rainbow).

## Security gaps
- **Sandbox escape hatch:** set `sandbox.allowUnsandboxedCommands: false` for headless workers and assert it in preflight (verify the setting exists).
- **Transcripts may contain secrets** — redact at write time; exclude `secrets` jobs from search and backups.
- **No adaptive red-team** — add a monthly adaptive injection run against the three-flag rule and write quarantine.
- **Supply chain** — pin MCP servers and skills by version/hash; re-vet on update.
- **`enforce_admins=false` and direct pushes skip required checks** — with the runner pushing, this becomes the main path.

## Missing
- Job state machine (`queued → leased → running → adjudicating → awaiting_approval → terminal`) with lease TTL, startup reconciler, orphan kill.
- An outbox for external effects: one idempotent effector keyed `job_id + effect_n`; never directly from a worker.
- A trace schema from day one: `job_id`/`chain_id` in hook events and tool logs, plus cost per job.
- A quality eval for venture work before the improvement loop: 20 real tasks, pass^3.
- A merge/integration policy for parallel job branches.
- A threat model mapped to the OWASP agentic top 10.

## Top 5 changes
1. **Durable state machine now:** lease + heartbeat, reconciler on start, runner-owned outbox with idempotency keys for Resend/Stripe/publish; fixtures that kill the runner mid-job and mid-send. Or adopt DBOS (library-only, SQLite/Postgres).
2. **Harden the adjudicator:** run the runner from a pinned installed release, never the working tree it builds; restore test files from the base commit or hash-lock declared test paths; run done-tests in `sandbox-exec` or a container with no secrets and no network.
3. **Real boundary around L3 and approvals:** `runner.db`, inbox and env files outside every worker's `allowWrite` and in `denyRead`; env files out of repos; a human-presence factor for `runner approve` (Touch ID Keychain item or an ntfy action token); preflight token as an HMAC over `job_id` signed by the runner over a local socket.
4. **Derive the three flags;** Bash + network defaults to `external_send=true` until a per-job egress allowlist; bring the tinyproxy ACL forward for `secrets` jobs; `allowUnsandboxedCommands: false`; cross-venture reads as filesystem denial.
5. **Make the second family boring and add eyes:** Codex judging through a small metered API key as primary, PTY as fallback; `job_id`/`chain_id` everywhere; a 20-task venture-work eval at pass^3; a per-repo git mutex and a serial integration step.
