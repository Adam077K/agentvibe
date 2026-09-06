# L3 · guard — hands, control, identity, privacy, legal · rethink round · 2026-09-06

```
lane:   L3 guard (framer). Sections 03 Hands, 09 Control & safety, 15 Identity & access,
        16 Data & privacy, 18 Legal & compliance
inputs: parts/00, SPINE, DECISIONS 15+17, FOUNDER-LIST, COVERAGE, parts/{08,12,15,17},
        research/{cognition,cloud,runtimes}. v1-v5 and v54-v65 are fixed: improved inside, never reversed
```

**Verdict tally — 97 keywords.** KEEP **57** · IMPROVE **26** · RETHINK **8** · ADD **1** · REFUSE-STANDS **5**.

**(NEW: the tally's own finding, and it decides how to read the rest.)** Exactly **one** of ninety-seven keywords is
absent from v2. Coverage is not the problem. **This field's coverage rests on six programs that do not exist** —
`bin/run`, `bin/probe`, `bin/send`, `bin/door`, `bin/inbound`, the managed file — and §12 says so: *"Six of those
mechanisms do not exist yet, and until they do, the parts of this section that depend on them are WISHes wearing
rule clothing."* A lane proposing twenty new rules would add to the pile of things nothing enforces. **Every
proposal below narrows an existing mechanism or replaces a rule with a program, and four are one shape: put a
no-model program in the path.**

---

## Section 03 · Hands (tools & access) — 41 keywords

KEEP 29 · IMPROVE 6 · RETHINK 2 · REFUSE-STANDS 4

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| Read tool | the one grant every agent holds; reading a stranger's text is not neutral | IN §5 — all fifteen carry it | **KEEP** | read is universal, taint is separate |
| Write tool | the pen; five of fourteen carry none | IN §5 | **KEEP** | scoped by argv, not by prose |
| Edit tool | the same pen on existing files | IN §5 — checkers carry neither | **KEEP** | reviewer cannot edit what it judges |
| Bash tool | a shell is every other tool at once | IN §5 — eight carry none, four can touch source | **RETHINK** | **P:** the shell is the least-narrowed grant in the plan — a `Bash` grant equals `Write` on everything the sandbox allows, and the sandbox list is per repository, not per run. Narrow the **process**, not the tool. **M:** `sandbox.filesystem.allowWrite` set to the run's worktree at dispatch (per-invocation settability **UNVERIFIED**, RQ1); `bin/probe` attempts an out-of-worktree write nightly. **C:** one probe, possibly a per-run settings file. **S:** RQ1. **R:** v41 gains a shell row |
| Glob tool | search, no content | IN §5 | **KEEP** | part of the universal read grant |
| Grep tool | search over content | IN §5 | **KEEP** | same grant, same reasoning |
| Browser automation | render and look, no credential | IN §8 READ-ONLY, `designer` per run | **KEEP** | headless, isolated, one agent |
| Authenticated browser session | the widest hand in the building | IN §8 — founder's Chrome, day, Floor only | **KEEP** | never a night grant, ever |
| Publish tool | the act that cannot be recalled | IN §12 — REACHES THE WORLD, Sender only | **KEEP** | the Sender holds no model |
| Sandbox exec | running code that a model wrote | IN §12 — worktrees plus the armed sandbox | **IMPROVE** | **P:** the escape hatch is used routinely and recorded nowhere — `dangerouslyDisableSandbox` exists and every worktree creation in a measured session needed escalation (FACT: CLAUDE.md, 2026-08-24). Every escalation writes an event row and appears in the briefing. **M:** `bin/run` records it; the briefing renders it. **C:** one field. **S:** count escalations for one week against the zero recorded today. **R:** new row |
| Virality predictor | a number nobody can falsify | REFUSED §11 | **REFUSE-STANDS** | no anchor, and would be believed |
| Email tool | the highest-value inbound and outbound path | IN §12 — door reads, writer drafts, Sender sends | **KEEP** | three programs, one act each |
| Design tool integration | a file that reverts | IN §8 WRITES-reversible, after the undo is drilled | **KEEP** | drilled undo or it is one-way |
| Prototype tool integration | a shared link does not revert | IN §8, same class | **KEEP** | the published link is the Sender's |
| Review tool integration | reading someone else's judgement | IN §8 read-only through the door | **KEEP** | read-only instruments go first |
| Drawing tool integration | an artifact surface | IN §8, the same door | **KEEP** | one door, a named intent behind it |
| Two-scope auth | read and write are different credentials | IN §8 — scoped, expiring | **IMPROVE** | **P:** the scope we request is recorded; the scope the provider actually granted is not. Record what was granted, not what was asked. **M:** `bin/door` stores `scopes_observed` read back from the provider; `bin/probe` diffs it against `scopes_requested`. **C:** one field per credential. **S:** request read-only, read back what was granted, compare. **R:** new row |
| OAuth gap | a hand that was never connected | IN §8 — `gemini` unauthenticated since install | **KEEP** | a named gap with a decision |
| Compute rental tool | money at a rate, unattended | REFUSED §8 — RunPod, uncapped key | **REFUSE-STANDS** | reversal condition is generalised below |
| Connection-closed error | a tool that is not there | IN §6 — handover `blocked` | **KEEP** | blocked is the honest terminal value |
| Re-authentication queue | expiry as a work item | IN §8 — surfaces in the briefing | **KEEP** | never a silent failure |
| Pending grant approval | a grant with state | IN §8 — state and horizon | **KEEP** | page 5 taps a store to its schema |
| Live grant status | what a run can actually touch | IN §8 — `bin/probe` nightly | **KEEP** | assert it, never assume it |
| Unconnected server count | a count nobody acts on | REFUSED §14 | **REFUSE-STANDS** | every number must name its tap |
| Registry unreachable | the world is down | IN §6 — surfaces as blocked | **KEEP** | Rule 10: unresolved is not pass |
| Non-MCP hands | a CLI is a hand too | IN §8 — one door for all shapes | **KEEP** | the door is material, not a list |
| macOS binary tools | a binary has no description to hash | IN §15 — tmux's own CLI | **IMPROVE** | **P:** version pinning is defined for MCP descriptions and undefined for binaries, which is what actually runs at night. Record the binary's version string and sha256 at admission. **M:** `bin/door` stores both; `bin/run` re-checks before use. **C:** one hash per binary. **S:** change a binary and confirm the run refuses. **R:** new row |
| Ad platform read access | spend that is read is spend that reconciles | IN §8 wish list | **KEEP** | a read comes before any write |
| Ad platform write access | spending money outward | IN §12 REACHES THE WORLD | **KEEP** | no agent holds it |
| Spend rate limit | rate, not only amount | IN §12 — pre-action ceilings | **IMPROVE** | **P1: a cap we promise to respect is not a cap.** Make *"the cap lives at the provider"* a column of the door, not one refusal's reason — a SPENDS-MONEY tool is admitted only with a provider-side cap and its number recorded. **M:** `bin/door` requires `provider_cap`; `bin/run` refuses a tool whose recorded cap is null. **C:** RunPod stays refused and Higgsfield may join it. **S:** read Higgsfield's own cap surface; absent one, it is night-refused. **R:** §F gains a column |
| Deploy tool | `git revert` does not undo it | IN §12 — blocks from day one | **KEEP** | one of three day-one blocks |
| Database tool | the state, not the intention | IN §8 — read replica on the wish list | **KEEP** | a migration is the architect's anchor |
| Payments tool | there is no revenue truth without it | IN §8 — first wish-list row | **KEEP** | §16 has no source of truth without it |
| Missing payments MCP | not having it is also a property | RENAMED §8 | **KEEP** | a safety property and a gap at once |
| Tool allowlist | the closed set | IN §8 — `--restricted` plus explicit `--tools` | **KEEP** | composed by one launcher |
| Tool denylist | the floor under every mode | IN §12 — managed `permissions.deny` | **IMPROVE** | **P:** three tiers state one thing — argv, project `settings.json`, managed. Grants live in exactly **two**: argv and managed. Delete the project tier for tool grants. **M:** a lint failing a tool grant expressed in project settings. **C:** this repo's 39 allow/deny rules move or go. **S:** express a grant only in project settings and let the probe show it is not what binds. **R:** v34 · v43 |
| Tool discovery protocol | automatic connection | REFUSED §8 | **REFUSE-STANDS** | fifteen servers got connected by clicking |
| Tool version pinning | the rug pull is a description change | IN §8 — pinned, hashes re-checked each session | **KEEP** | a string comparison catches CVE-2025-54136 |
| Tool audit log | every call, attributable | IN §14 — the event log, `gen_ai.*` names | **RETHINK** | **P2:** an MCP call reaches a hook **only if the matcher names that exact tool** (FACT: `c-mcp-hook-matcher-must-name-the-tool`, this branch) — so *"every call logged"* is unenforceable by our own machinery. Put every admitted server behind **one local no-model proxy** that logs each call; `--strict-mcp-config` names only the proxy. **M:** `bin/egress` (ABSENT); one row per call in the event log. **C:** one program, one hop of latency, each server declared twice. **S:** compare the proxy's call count with the runtime's for one night. **R:** new row in §F |
| Tool sandbox isolation | one run cannot reach another venture | IN §12 — worktrees, sandbox, trifecta | **IMPROVE** | **P:** isolation is per repository, not per venture or per run, and CLAUDE.md records that isolation between agents in one session *"is a convention they keep, not a rule anything enforces."* **M:** `bin/run` refuses a brief naming two ventures; `bin/probe` attempts a cross-venture read nightly. **C:** cross-venture work becomes two runs and a promotion. **S:** the nightly attempt either succeeds or does not. **R:** v41 |
| Tool timeout policy | a hand that never returns | IN §6 — the wall-clock half of the ceiling | **KEEP** | the ceiling already owns it |

---

## Section 09 · Control & safety — 30 keywords

KEEP 17 · IMPROVE 9 · RETHINK 3 · REFUSE-STANDS 1

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| Pre-tool-use hook | the door at the tool boundary | IN §12 | **IMPROVE** | **P:** the obvious hook shape silently fails to deny — *"Exit code 2 isn't honored for this event and the permission flow proceeds unchanged. Deny through the `decision` object instead"* on `PermissionRequest` (FACT: runtimes.md, 2026-09-05). This repo's hook exits 2. Deny through `decision` for non-blocking events; keep exit 2 for the ten documented blocking ones. **M:** the hook rewrite (founder's — it edits judging machinery) plus `bin/probe`. **C:** one irreversible-tier change. **S:** attempt a denied act under each event class and record whether it ran. **R:** new row |
| MCP policy file | per-server allow and deny | IN §12 — `.mcp.json`, `.claude/mcp-policy.json` | **IMPROVE** | **P:** a policy file whose calls no hook can see is a policy nothing enforces. Fold it into P2's egress proxy as that proxy's configuration, and stop treating it as an independent control. **M:** `bin/egress` reads it; the lint stops treating it as a grant surface. **C:** one file changes owner. **S:** call a denied server directly and see which layer refuses. **R:** → P2 |
| Allow list policy | what may be used | IN §12 — `--tools` composed by the launcher | **KEEP** | allow has no effect in bypass |
| Deny list policy | what may never be used | IN §12 — binds in every mode | **KEEP** | the floor is real, the ceiling is not |
| Unlisted-denied default | closed set, not open | IN §12 — `--restricted` plus explicit `--tools` | **KEEP** | the grant is a closed set |
| Sandbox isolation | a guardrail, not containment | IN §12 — armed, honestly described | **KEEP** | the honesty is the load-bearing part |
| Credential read denial | the key the model never sees | IN §12 — `denyRead` over the stores | **IMPROVE** | **P3:** `denyRead` hides a **file**; it does not stop a process that inherits an env var, and `gh` reads a store the sandbox denies (FACT: §17.3). Resolve keys **only inside no-model programs, at egress**. **M:** the runtime's sandbox `credentials` block — `mask`, per-host `injectHosts` — documented and **unused here** (FINAL §9.7, via §12.10). **C:** one build; RQ2. **S:** RQ2, then a deliberate exfiltration attempt from a night run. **R:** v33 gains a mechanism |
| Permission rule count | counting rules | REFUSED §12 | **REFUSE-STANDS** | a count is not a measure of safety |
| Hook event coverage | which events we watch | IN §12 — 34 events, 10 blocking | **KEEP** | and the managed file omits the two hook settings |
| Blocking gate | a gate that fails a build | IN §11 — four gates, exit ≠ 0\|1 is unresolved | **KEEP** | the gate is not invocable by what it gates |
| Blocking-human gate | a person must decide | IN §12 — a `human` gate has no `run:` | **KEEP** | "nobody implements this" is a different string |
| Live worldly risk | the act, not the file | IN §12 — REACHES THE WORLD is a class | **KEEP** | no agent holds the class |
| Publish-action risk | delivered to a person | IN §12 — one-way by any reading | **KEEP** | recall is not undo, and the receipt says so |
| Spend-rate policy | rate as well as amount | IN §12 — pre-action | **KEEP** | there is no warn-at-80% to reason past |
| Daily spend cap | the day's ceiling | IN §12 — the Sender recomputes before acting | **IMPROVE** | → **P1**: the ceiling binds only where the provider holds it. Ours binds the Sender; nothing binds a tool that spends under its own key. **R:** §F column |
| Kill switch | stop everything, now | IN §14 — the cord, a file read first every tick | **IMPROVE** | **P4:** a file read on every tick stops **dispatch**, not a run already in flight, and §12.9 claims it *"cancels running work."* Give the cord a second carrier: the launcher owns every child's process group and signals it. `SIGTERM` gives **exit 143 and a resumable turn** (FACT: §15.8) — so the cord stops without destroying, which is exactly what *"leaves every artifact in place"* asks for. **M:** `bin/run` records the pgid; the cord signals the group. **C:** one field, one signal path. **S:** pull the cord mid-run; measure time to quiescence and whether the run resumes. **R:** new row |
| Remote kill access | the cord from the phone | IN §14 — the same cord | **RETHINK** | **P:** the phone route is undecided and it is the identity question in disguise (see §15 below). Reach the cord from the **published artifact page**, which writes a cord request the Watch reads — never by exposing the local server to the network. **M:** the published page writes the request; the Watch reads it first every tick. **C:** the cord from the phone is one tick, not instant. **S:** measure the tick period against the worst act it must stop. **R:** v39 |
| Prompt injection defense | the one attack no prompt fixes | IN §12 — the trifecta, structural | **IMPROVE** | **P5: prevention is the plan's strongest idea and there is no detection at all.** Add one deterministic tripwire: the world's door writes a per-venture canary string into every inbound row's provenance; `bin/send` refuses any staged artifact containing it, and the attempt is a `wake-me`. **M:** `bin/inbound` writes it, `bin/send` compares — a string compare, no model, the same shape as the description-hash check. **C:** one string per venture. **S:** plant the canary in an inbound row and try to get it into a staged artifact. **R:** new row |
| Fetched-content taint tracking | taint travels with the datum | IN §8 — a class held by `scout` and the door | **IMPROVE** | **P:** taint is decided at dispatch (correctly) and then **stops travelling** — nothing marks what was derived from a tainted read. Stamp each inbound row with a taint id; a handover derived from it carries the id; the Sender refuses a staged artifact whose lineage names a taint id nobody cleared. **M:** one field on three stores, read by `bin/send`. **C:** one field. **S:** trace a marked inbound string to the furthest artifact it reaches. **R:** v36 gains lineage |
| Research reach exemption | the reader holds nothing | IN §8 — `scout` reaches because it holds nothing | **KEEP** | the exemption is the trifecta, not an exception |
| Structured-input matching | judge the field, not the string | IN §12 — declare what is read, refuse the rest | **KEEP** | eight bypasses closed by this rewrite |
| String-matching bypass fix | the same lesson | IN §12 | **KEEP** | at the line, not at the value |
| Least-privilege default | the table is the mapping | IN §5 — eight no shell, five no write | **KEEP** | expressed as a table, not a rule |
| Privilege escalation audit | a child cannot widen its grant | IN §12 — subagent `permissionMode` is ignored | **IMPROVE** | **P6:** the property is the vendor's and it is sound; **the log that would prove it was respected is not tamper-evident.** Hash-chain the event log: each row carries the sha256 of the previous row. **M:** `bin/log` writes the chain; a checker verifies it as a rung-1 anchor. **C:** one field; a rewrite of history becomes detectable, not impossible. **S:** edit one historical row and confirm the checker fails. **R:** new row |
| Incident response plan | what happens after it goes wrong | IN §12 — cord, freeze, log, deliberate undo | **RETHINK** | **P7: it is a sentence in a field where every neighbouring control is drilled.** The plan already holds *"an undo is drilled or the door is one-way"* and drills restore monthly. Name five incident classes and drill each: leaked credential · rug pull · a send past its recall window · runaway spend · a night run that touched what it may not. **M:** `shared/drills/<class>.yml` and the drill runner that already writes undo dates; a stale date shows in the briefing. **C:** five drills. **S:** run the credential drill and record wall-clock to full revocation. **R:** new row |
| Rollback mechanism | undo is a decision | IN §12 — git for artifacts, idempotency outward | **KEEP** | never automatic, and that is the choice |
| Approval workflow | there is no approve verb | RENAMED §3 — the *which*, and `dontAsk` denies the ask | **KEEP** | the best idea in the plan |
| Human override path | the founder wins | IN §15 — from either surface | **KEEP** | every tap opens a terminal on the Mac |
| Compliance policy mapping | the chain of direction is the trail | IN §12 | **IMPROVE** | → **P6**: a chain that cannot be verified is a story about a chain. **R:** §18 below |
| Data retention policy | what is kept, and for how long | IN §15 — a separate stream for bodies | **RETHINK** | → **P8** (§16 below): the log is append-only forever and nothing declares its retention, so retention is defined for the one stream that has it and undefined for the one that grows without bound |

---

## Section 15 · Identity & access — 9 keywords

KEEP 2 · IMPROVE 5 · RETHINK 2

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| Agent identity token | who did this, provable at the far end | RENAMED §6 — the session UUID we mint | **RETHINK** | **P9:** a UUID we mint is a **correlation id, not an identity** — it authenticates nothing, and every outward act is performed with the founder's own credential, so **no act is attributable to a run by anyone outside our own log.** Identity per **(venture × outward class)**, not per agent, so the count stays small. The Sender writes a receipt binding artifact sha256, run id, intent id and the identity used; the world's door records the far-end id. **M:** `bin/send` writes the receipt; `bin/inbound` reconciles it. **C:** one account per venture per channel; the founder's own credential stays on the Floor. **S:** can a far-end record be traced to one run **without** reading our log? **R:** new row |
| Human identity verification | is this actually the founder | IN §12 — *"whoever holds the machine and the phone"* | **RETHINK** | **P10: mission control is an unauthenticated control plane whose taps open terminals.** (FACT: `mission-control/server/config.ts` on this branch pins `HOST = '127.0.0.1'` with no override, and `server/routes/guard.ts` records that *"ANYTHING ELSE ON YOUR LOOPBACK STILL REACHES EVERYTHING"* and that a non-browser client sends no `Sec-Fetch-Site` header at all, so it is allowed — read 2026-09-06.) v39 says the phone reaches *"the local server over the founder's own network"*, **which requires breaking that pin**, and past it there is no authentication of any kind. **P:** keep the pin; the phone reads and decides through the published artifact pages and writes requests the Watch reads. **M:** the existing pin and its test; the request file. **C:** the phone loses instant taps and keeps reads, *whiches* and the cord. **S:** attempt a tap from the phone under the pin today — it fails, and that failure is the measurement. **R:** v39 |
| Service account management | a key a program can fetch at 3 a.m. | IN §15 — the OS keychain | **IMPROVE** | **P:** a keychain read from a non-interactive background process may prompt, and nothing has tested it — the credential plan's whole unattended half rests on an unmeasured assumption. Rehearse it as a door test before any night credential exists. **M:** the rehearsal runner, a known call and a known answer, headless. **C:** one rehearsal. **S:** RQ3. **R:** new row |
| API key rotation | rotation that actually happens | IN §15 — *"at the horizon"* | **IMPROVE** | **P:** rotation is a promise with no clock. It needs no new mechanism: **rotation is an obligation** — something owed, by a date, with a consequence and a record that proves it discharged, which is exactly the store the plan already has. **M:** a row per credential in `obligations.yml`, written by the Watch (v44), surfaced by the briefing. **C:** one row per credential. **S:** let one lapse deliberately and see whether it wakes anyone. **R:** v55 covers it as a standing intent |
| Secrets vault | the key is never in a file | IN §15 — keychain references, `denyRead` | **IMPROVE** | **P:** references are **stated** and nothing resolves them or checks them — §13.2 already names a `gitleaks`-class scan as ABSENT, and §15.3's *"excluding secrets by construction"* rests on that absent scan by its own admission. One resolver reads a reference into a **no-model** process only; the scan runs as a rung-1 anchor on every push. **M:** `bin/secrets` (ABSENT) plus the scan (ABSENT). **C:** two small programs. **S:** plant a live-looking key in a store write and confirm the push fails. **R:** new row; feeds **P3** |
| Least-privilege role mapping | roles exist now, so the mapping can | IN §5 — the `tools` column | **KEEP** | the mapping is a column, not a policy |
| Session token expiry | a grant that ends | IN §12 — the grant horizon | **KEEP** | the horizon is the expiry |
| Multi-tenant isolation | one venture cannot read another | IN §12 — the never-shared list | **IMPROVE** | **P:** enforced by *not handing over the credential*, which is one mistaken brief away from being wrong and has no checker. **M:** `bin/run` refuses a brief naming two ventures; `bin/probe` attempts the cross-venture read nightly. **C:** cross-venture work becomes two runs and a promotion. **S:** the nightly attempt. **R:** new row |
| Cross-venture data isolation | customer data, keys and beliefs never cross | IN §12 | **IMPROVE** | **P:** memory items are per venture and *"do not cross without a promotion"* — the right rule, with nothing checking it. The store check refuses a memory write whose venture scope differs from the writing run's. **M:** `bin/check-stores`. **C:** one predicate. **S:** attempt the write. **R:** v25 · v48 |

---

## Section 16 · Data & privacy — 9 keywords

KEEP 4 · IMPROVE 3 · RETHINK 1 · ADD 1

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| PII detection | find a person's data before it leaves | IN §9 — a local model, on electricity | **IMPROVE** | **P:** detection with no refusal is a note. Make it a **gate on two paths, both programs**: the Sender's checklist and the mining pass's redaction. A positive **blocks**; it does not warn, and an override is a *which*. **M:** `bin/send` and `bin/curate` call the local classifier (MiniLM / Qwen3-0.6B, no window at all). **C:** a false positive costs one *which*. **S:** measure the false-positive rate over a week of staged artifacts **before** it blocks. **R:** new row |
| Data classification tags | what class of thing is this row | IN §13 — memory items carry scope | **IMPROVE** | **P:** *scope* is a memory field, not a class of datum, so the never-list keys on paths. Three classes on every store row — **ours · a third party's · a named person's** — assigned by the writing program; the never-list keys on the class. **M:** `bin/check-stores` refuses a row with no class. **C:** one field. **S:** sample rows and check the class predicts what may leave the machine. **R:** new row |
| Data residency policy | where the data physically is | IN §15 — local-first; Mem0 refused | **KEEP** | the refusal *is* the policy, and it is enforced |
| GDPR/privacy compliance | the law, per venture | FOUNDER'S §2 — an obligation with a statutory clock | **KEEP** | statutory clocks wake the founder |
| Data retention schedule | how long each store keeps a thing | IN §15 — a separate retention for bodies | **IMPROVE** | **P:** retention is declared for prompt and response bodies and **undeclared for the log**, which is append-only forever. Retention belongs to the **store**, declared beside its one writer; a store that declares *forever* may not hold a body. **M:** §17.4's store table gains a retention column; `bin/check-stores` refuses a body write to a forever store. **C:** bodies move to a bounded store and are referenced by hash. **S:** count how many current rows carry a body. **R:** §17.4 |
| Data deletion request | erase one person, on demand | IN §13 — *"the one exception to archive-not-delete"* | **RETHINK** | **P8: it cannot be honoured as designed, and two sections say so.** The log *"is the truth and is never edited"* (§15.3) and eviction *"archives and never deletes"* (§13) — so a person's data inside either is **structurally unerasable**, and §16's exception is a sentence with no path. **P:** no personal datum enters the log or memory; both hold a **hash**. One erasable per-subject store holds the body. Erasure deletes that row and the hash becomes *a known absence* — a phrase §15.3 already uses for a missing blob. **M:** `bin/log` refuses a body; the blob store is content-addressed already; deletion writes a tombstone. **C:** one indirection on every inbound row. **S:** run one erasure end to end, then grep the whole tree for the subject. **R:** new row; §13 and §15.3 move |
| Consent management | may we contact this person at all | **ABSENT from every section** — *"the people register"* appears **only** in COVERAGE.md, in no part of the plan | **ADD** | **P:** COVERAGE names a mechanism §12 does not carry, which is a rule enforced by a coverage table. Give it a store like every other: **one writer** (`steward`, from the door's rows), read by the Sender before any contact, carrying the lawful basis and the date it was recorded. **M:** `bin/check-stores` fails a contact whose subject is absent; the Sender's checklist reads it. **C:** one store, one checklist line. **S:** attempt a contact to a person not in the register. **R:** new row |
| Anonymization pipeline | redact before it moves | IN §13 — redaction before mining, not after | **KEEP** | only redacted extracts leave the machine |
| Third-party data sharing policy | a client's data never travels | IN §12 — the never list | **KEEP** | it stays off every outward path |

---

## Section 18 · Legal & compliance — 8 keywords

KEEP 5 · IMPROVE 3

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| Terms of service | ours, for a venture's customers | FOUNDER'S §2 | **KEEP** | drafted by the system, signed by the founder |
| Data processing agreement | ours, with a processor | FOUNDER'S §2 | **KEEP** | a signature is always the founder's |
| Model usage license | may we drive a subscription seat at all | IN §20 — open decision 1, **open by the founder's word** | **IMPROVE** | **P11:** the plan's own words are *"the downside of being wrong is the account, which takes the company"*, and this is the **only** durable open question in the system with **no expiry**, while Rule 9 forces one on every claim. Give the row an expiry and a bounded blast radius until it closes: automated seat access confined to the harness venture — which v64 makes free — and a dated disposition of refresh, decide, or waive with a new date. **C:** nothing today, because the first venture is already the harness. **M:** the ledger's expiry rule applied to §I rows. **S:** the date arrives and exactly one disposition is recorded. **R:** §I row 1 |
| Export-control compliance | a watching intent, not an action | IN §2 | **KEEP** | proposals, never autonomous acts |
| Liability policy | who is answerable | FOUNDER'S §2 | **KEEP** | legal reaches the founder, at no tempo |
| Audit-readiness checklist | could we show what happened | IN §14 — the chain of direction | **IMPROVE** | → **P6** (hash chain) plus the escalation record (Hands · sandbox exec). The trail exists, is not tamper-evident, and **omits the one class of act that bypasses the controls** — every sandbox escalation. **C:** one field each. **S:** edit a row; count a week's escalations. **R:** new row |
| Regulatory monitoring | the world's rules changed | IN §2 — a watching intent over a few pages | **KEEP** | opens a proposal on change |
| IP infringement check | did we copy someone's work | IN §11 — the licence read is the check | **IMPROVE** | **P:** **inbound** licences are read exceptionally well — n8n, Flowise, Gource, pixel-agents, `LICENSE-CONTENT` each moved a decision. **Outbound is unchecked**: nothing records the licence of a third-party asset embedded in an artifact the Sender publishes, and Higgsfield's verb set is UNVERIFIED. Add a provenance line to the Sender's checklist beside v63's disclosure: source, licence, date read. **M:** `bin/send`'s checklist — the one admitted step list (v18, v51). **C:** one field per embedded asset. **S:** stage an artifact with an unlicensed asset and confirm refusal. **R:** v63 |

---

## Top 5 proposals of this lane

**1 · One egress program: everything leaving a run's process goes through a thing with no model.** Three paths leave
an agent's process and each is governed differently — the open web (nothing but the trifecta), an MCP call (a hook
that cannot see it), an outward act (the Sender, which is right). Unify them: one no-model program logs every call,
filters by domain **and by HTTP method**, and injects credentials the agent never sees. Two pieces are documented
and unused — the sandbox `network` block and its `credentials` block (`mask`, `injectHosts`), named in §12.10 as
*"the scout's read-only proxy and the Sender's key-at-egress, and both are unbuilt here."* The third has a vendor
precedent: OpenAI's hosted agent **blocks internet by default during the agent phase** and can *"restrict network
requests to `GET`, `HEAD`, and `OPTIONS`"* (FACT: cloud.md, 2026-09-05) — a night lane that cannot POST cannot
exfiltrate over HTTP, however persuaded. **Why better:** the trifecta guarantees a leg is missing at dispatch; this
guarantees it stays missing at the syscall, and it is the only proposal that survives an agent being *fully*
persuaded. **Cost:** one program, one hop of latency, RQ2. **Know it worked:** a deliberate exfiltration attempt
fails at the proxy rather than at the prompt, and the proxy's call count matches the runtime's for one night.

**2 · The data path becomes erasable by construction.** Two sections say the log is never edited and eviction never
deletes; a third says a deletion request is honoured. All three cannot hold, and the third is the false one. Keep
the first two: **no personal datum enters the log or memory — both hold a hash — and one erasable per-subject store
holds the body.** Erasure deletes that row and the hash becomes *a known absence*, a phrase §15.3 already uses of a
missing blob. **Why better:** it is the only version of the rule a venture with real customers can keep, and it
turns a legal exposure into a file layout. **Cost:** one indirection per inbound row. **Know it worked:** run one
erasure end to end, then grep the whole tree for the subject and find nothing but hashes.

**3 · Narrow the shell, the grant the plan narrows least.** *"Eight of the fourteen carry no shell"* is the roster's
headline safety claim and it is true. What it omits is what the other four can do: a `Bash` grant is `Write` on
everything the sandbox allows, that list is per repository rather than per run, and this repo measured that the hook
*"gives `Bash` no path concept at all; only `Edit`/`Write` are root-scoped"* — same instruction, opposite outcomes,
invisible to all three agents it happened to. **Why better:** it makes `isolation: worktree` (v41) an enforced fact
rather than a declared one. **Cost:** RQ1, one probe, possibly a per-run settings file. **Know it worked:** the
nightly probe's out-of-worktree write is refused, in the log, every night.

**4 · Incident response becomes drilled, and the log becomes tamper-evident.** The plan's sharpest rule is that *an
untested kill switch is a story about a kill switch*, and it applies it to undo and restore and nothing else. Name
five incident classes and drill each so it writes a date the briefing shows as stale: leaked credential, rug pull, a
send past its recall window, runaway spend, a night run that touched what it may not. Beside it, hash-chain the
event log. **Why better:** the audit story is *"the chain of direction is the audit trail"* — a chain nobody can
verify is a story about a chain, and this is one field. **Cost:** five drills and one field. **Know it worked:** the
credential drill produces a wall-clock number to full revocation; editing a historical row fails a check.

**5 · The cord actually stops a run, and the phone's route is decided rather than assumed.** §12.9 says the cord
*"cancels running work"*; the mechanism is a file read every tick, which stops the next dispatch and nothing in
flight. Give it a second carrier — the launcher owns every child's process group — using `SIGTERM`, measured to give
**exit 143 and a resumable turn**, so it stops without destroying and *"leaves every artifact in place"* stays true.
In the same change settle the phone's route: the mission-control seed pins loopback with no authentication behind
the pin, and v39's *"over the founder's own network"* requires breaking it. **Why better:** the cord is the founder's
only emergency control and cannot do what its own section claims. **Cost:** one field, one signal path, and a phone
cord that is one tick rather than instant. **Know it worked:** pull it mid-run, measure quiescence, resume.

---

## Top 3 research questions

1. **Is the Bash sandbox's `filesystem.allowWrite` settable per `claude -p` invocation** — argv, environment
   variable or a session-scoped settings file — **or project-scoped only?** *Source:* the vendor's sandboxing and
   settings reference, then one measured cell (write inside the worktree, write outside it, one dispatch).
   *Decides:* whether proposal 3 is buildable or whether shell narrowing needs a per-run project directory.
2. **Does the sandbox `credentials` block inject a secret at egress without it being readable from inside the child,
   and does `network` support an HTTP-method allowlist and TLS inspection?** *Source:* the sandboxing reference,
   then a cell that tries to read the injected value from the child and POSTs to an allowed domain. *Decides:*
   whether proposal 1 is one config change or a program we write. §12.10 already names two holes — `excludedCommands`
   and `allowRead` merge across scopes with no managed-only lock, and the proxy does not inspect TLS by default.
3. **Can a non-interactive background process read a macOS keychain item without an interactive unlock, and under
   what ACL?** *Source:* Apple's platform documentation, then one measurement from a detached process with no TTY.
   *Decides:* whether §15.4's credential plan works at 3 a.m. at all. The unattended half of the design assumes it
   does and nothing in the inputs measures it.

---

## What the best system in the world would have here that v2 lacks

**(NEW: reasoning)** The best guard layer is not the one with the most rules; it is the one where the dangerous
capability is **absent from the process holding the model**, and every remaining path is a program you can read. v2
already believes this — the Sender, the door, the launcher, the probe are that idea. It stops one layer short in
five places.

- **(NEW: reasoning)** A credential the model never sees. v2 hides credential *files* and then hands the model a
  `gh` binary that reads one. The best system injects at egress: the agent holds a handle, not a key.
- **(FACT: cloud.md, 2026-09-05)** A method-restricted, default-closed network for anything unattended. OpenAI ships
  this for hosted agents against a published threat model — *"Prompt injection from untrusted web content"*, *"Code
  or secret exfiltration"*. v2 has no network policy at all: `.claude/settings.json` carries `filesystem` only.
- **(NEW: reasoning)** Detection, not only prevention. v2's injection defence is structural, excellent and
  **silent**: nothing tells the founder an injection was attempted.
- **(NEW: reasoning)** A tamper-evident trail and a loud break-glass. Both escape hatches are used and recorded
  nowhere, in a log editable without trace.
- **(NEW: reasoning)** Attributable outward acts. Everything reaches the world as the founder, so the far end cannot
  tell a run from a person, and neither can we without our own log.

**Where this field breaks, by scale.**

| Scenario | What breaks in **this** field | Smallest change that prevents it |
|---|---|---|
| **10 ventures** | One Sender holds every venture's credentials and becomes the highest-value target in the company; cross-venture isolation is a convention with no checker | One Sender **process per venture**, credentials scoped to it; `bin/run` refuses a two-venture brief |
| **50 concurrent sessions** | The cord cannot reach 50 in-flight children; `F_FULLFSYNC` on every append serialises 50 writers, so the audit log becomes the bottleneck and then the thing that gets relaxed | Proposal 5's process groups; one log-writer program with a queue, so the fsync guarantee survives contention |
| **A second human** | No second principal exists, and *"you may not share your Account login information … with anyone else"* (FACT: runtimes.md quoting Anthropic Consumer Terms §3) makes a shared seat a terms problem before a security one | v65 defers this correctly. Write down now that a second human needs **their own seat and keychain**, not a role in our files |
| **A year of logs** | Inbound rows accumulate third-party personal data that cannot be erased, and audit value decays because nothing verifies the chain | Proposals 2 and 4 — hashes in the log, bodies in one erasable store, a chained row |
| **A second Mac** | Keychain and OAuth are device-bound; the disaster plan covers restore, not concurrent operation. Two Macs appending one log is an unresolved single-writer question | Name one writer process on one host; the second Mac is a reader until that is decided |
| **Founder away a month** | Nothing rotates itself; an expired OAuth stops the night lane silently, and the interruption budget is all that would surface it | Rotation as an obligation (§15) — the store, the clock and the wake already exist |

---

## What I would delete

1. **`.claude/mcp-policy.json` as an independent control.** A per-server allow/deny file whose calls no hook can see
   is a policy nothing enforces (FACT: `c-mcp-hook-matcher-must-name-the-tool`, this branch). Keep it as the egress
   proxy's configuration; stop counting it as a guarantee.
2. **The project-`settings.json` tier of tool allow/deny.** Grants belong in two places — the argv the launcher
   composes and the managed file a running process cannot clear. A third tier neither of them owns is where a
   mistake hides, and this repo carries 39 rules in it.
3. **Three of the four copies of the four-class hands table** (SPINE §F, §8.2, §17.3, COVERAGE). Four statements of
   one decision disagree silently, the failure this repository names in five other places. Keep §F as the decision
   and §17.3 as the inventory.
4. **`--max-budget-usd` from the control section.** It is a stall fuse, the plan corrects that reading three times,
   and each restatement invites a fourth misreading. It belongs in §16 and nowhere else.
5. **The `Night?` column of the four-class table.** The admitted-tool file already carries a horizon, written by the
   door. Two fields for one fact, and the door's is the enforced one.

---

## Assumptions and limits of this lane

- **UNVERIFIED:** whether the sandbox's `credentials` and `network` blocks behave as their schema suggests (RQ2);
  whether `allowWrite` is per-invocation (RQ1); whether a keychain read works headless (RQ3). Nothing was run and
  nothing was fetched — this lane read the inputs only.
- **Not decided here:** §I rows 1 and 15 are the founder's. Proposal 11 does not decide row 1; it asks only that an
  open row carry an expiry, as every claim must.
- **Not re-argued:** v1–v5 and v54–v65. Proposals 1, 3 and 5 make v33, v41 and v9 work better; none reverses a row.
- **The honest summary, in §12's own words:** the rules are decided and every one names a mechanism; six of those
  mechanisms do not exist. Nothing here changes that count except by narrowing what the six must do.
