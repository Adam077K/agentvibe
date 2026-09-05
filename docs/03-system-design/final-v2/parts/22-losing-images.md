## 22 · Losing images

*obeys: SPINE §J entire · inherits: FINAL §21 (a pointer) and FINAL §1's last column*

**(FINAL, and the rule is inherited before the list)** Every decision in §1-v2 keeps the image it beat, by name, in
its own last column. **Nothing from that column is repeated here word for word**, because two copies of one sentence
in one document disagree the first time somebody edits one of them. What this section adds is the thing a column
cannot hold: the **collection**, in one place, so that arguing for any of these later costs one lookup instead of
twenty-four.

**(NEW: why a losing image is kept at all)** A decision recorded without its alternative reads as the only thing
anybody thought of. Each entry below was a real design that a real reader preferred, and five of them were this
system's own position until the founder overruled it on 2026-09-05. **Reopening one is a founder act, by name and by
number.**

---

### 22.1 The five the founder overruled

**(FOUNDER, 2026-09-05)** These are not research findings. The founder read the plan and decided against it, the cost
was stated once, and the chosen thing is then built properly. They are never re-litigated.

| # | The losing image | Beaten by | The founder's words |
|---|---|---|---|
| 1 | **Three shapes — maker · scout · checker — with loadouts assembled per run, and no file per role** | v1, over FINAL row 6 | *"I want us to recreate the whole startup company … between ten and fifteen agents"* |
| 2 | **Labels, not names; no registry of personalities; a run labelled only by what it makes and which window it burns** | v2, over FINAL row 8 | the same instruction, and **every shipped roster fetched agrees with it**: MetaGPT, ChatDev, Magentic-One, CrewAI, the OpenAI SDK, wshobson and VoltAgent all ship named persistent roles; zero of seven ship unnamed-shape-plus-loadout |
| 3 | **`keel/holding/skills/` — the 134 moved whole into a directory read by nothing** | v3, over FINAL row 10 | *"take all the skills that the biggest systems use … we need a skill creator of skill"* |
| 4 | **Five Balcony views over one state, and a room that is a display and never a control** | v4, over FINAL row 15 | *"the mission control surface. I want to add it, bring it back"*, and *"when I click on it, the terminal which runs the agent on my Mac is popping up"* |
| 5 | **Codex admitted only after a headless rehearsal passes; Gemini proving the second-family route first** | v5, over FINAL row 30 | *"I run from day one of the system to include codex and Claude code"* |

---

### 22.2 The thirty-seven moved by a fact, by a rule already written down, or by this round's review

**(NEW: nineteen lost to a measurement; six lost to a rule this system already had)** The column names the row that
beat each image and what did the beating. Where the fact came from a research lane this session, the lane is the
source. **Numbers 6–30 are §J's own, unchanged.** **Numbers 31–42 are new this round — rows v42–v53, each an image the review found the plan still holding in one section while deciding against it in another.** The split is worth seeing: **6–24 fell to a fact from the world**,
and **25–30 fell to a rule that was already on the page** — the trifecta split, FINAL §6.1, the values the existing
engine files already carry. The second kind costs nothing to decide and is the cheaper half of any design.

| # | The losing image | Beaten by | The fact that moved it |
|---|---|---|---|
| 6 | **One artifact designed and built by one agent** | v7 | two agents acting on assumptions *"not prescribed upfront"* is the named failure; making the contract an artifact with a done-test is what prescribes them |
| 7 | **The builder's own tests as the only anchor** | v8 | a test written by the author of the code is a machine grading its own homework. Devin's own guidance — *"Tell Devin to test its own work before opening a PR"* — is the **self-check**, and it is a different test from the anchor |
| 8 | **A fully autonomous run that pauses to ask** | v9 | *"`AskUserQuestion` … are denied even if you've allowed them"* under `dontAsk`. The mode **cannot ask**, so staged-not-sent is load-bearing rather than stylistic |
| 9 | **A managed settings file that locks hooks** | v11 | `/goal` is a session-scoped prompt-based Stop hook and is unavailable under `disableAllHooks` or `allowManagedHooksOnly`. Locking hooks would kill the goal loop the founder asked for |
| 10 | **`/loop` as the always-on tier** | v12 | it is session-scoped, expires in 7 days, and fires *"only while Claude Code is running and idle"*. The Watch is the loop |
| 11 | **One dispatch mechanism for everything** | v13 | three ship and each documents a different job: agent teams (a lead plus named teammates, each a full session, with tmux pane ids on disk), subagents (depth 3, 20 concurrent), and `claude -p` children, which **never form a team** |
| 12 | **"Nothing is only informational" read as refusing a dashboard** | v14 | the collision was two stated positions, not a resolved question. Both are kept: the dashboard is admitted and every number names the tap that acts on it |
| 13 | **n8n and Flowise as canvas substrates** | v15 | n8n's LICENSE.md, read raw: *"only for your own internal business purposes or for non-commercial"*. Flowise is **archived** with licence NOASSERTION |
| 14 | **vibe-kanban as the board reference** | v16 | its own README now reads *"Vibe Kanban is sunsetting"*. OpenAI Symphony (Apache-2.0 [`api`: GitHub SPDX detection, LICENSE not read], last push 2026-08-19) replaces it. **FINAL reached the right conclusion on a weaker reason** |
| 15 | **Importing 2,111+ skills on the strength of an MIT badge** | v17 | the MIT file covers the code; a **separate `LICENSE-CONTENT` exists and was not fetched**, and it may carry different terms for skill content |
| 16 | **The SKILL.md spec's recommended step-by-step body** | v18 | the published spec recommends *"Step-by-step instructions"* and this system refuses procedure, so the two describe *"different artifacts wearing the same filename"*. The container is the standard; the content rule is ours |
| 17 | **"Ninety days uncalled and it leaves"** | v19 | *"Nobody found retires a skill by non-use."* The nearest shipped thing is dead-link and drift detection. Retirement is by forced expiry instead, on a mechanism this repo already runs |
| 18 | **A Haiku executor tier** | v20 | Haiku 4.5's retirement is committed *"Not sooner than October 15, 2026"* — six weeks out and the nearest retirement date of any model named here. The genuinely cheap work goes to local models on electricity |
| 19 | **Fable as anyone's default; wshobson's tier 0 adopted as-is** | v21 | it is an escalation with one named trigger. Its **availability on a subscription seat is UNVERIFIED**, and the SWE-bench Pro ranking behind the tier-0 idea is third-party, confidence L, and is not used to route |
| 20 | **One rolling five-hour window as the whole physical fact** | v22 | there is a **weekly** window too, per seat, shared with Claude chat and Cowork — and a seat limit cannot be escaped with `/model` while a model-family limit can |
| 21 | **`--max-budget-usd` as a spend control** | v23 | print mode only, computed locally at list price, and *"the session cost figure isn't relevant for billing purposes"* for subscribers. Kept as a **stall fuse**, which it is good at |
| 22 | **FINAL §10.1's Letta attribution** | v25 | the current vendor page for that feature no longer supports the sentence. The **principle** stands — the thing that acts never edits memory — with its one shipped counter-example named rather than hidden: Claude Code's own auto memory is written by the acting agent, in-session |
| 23 | **A plan-critique pass the same run performs on itself** | v30 | *"at times, their performance even degrades after self-correction"* (arXiv 2310.01798). Reflexion's 91% is not a counterexample: its feedback is external. That is why `challenger` is an agent |
| 24 | **`script -qfc` wrapped around every Codex child** | v32 | the cure is *"incompatible with normal background / parallel job execution"*, which is what a crew is. Codex runs in the foreground slot instead, and the headless rehearsal is what widens it |
| 25 | **A steward that reads mail with a pen in its hand** | v36 | **a standing rule reaching a collision, not a new fact.** §F held the tainted read at scout only while §B.2 row 12 granted steward the same reads, and steward carries `Write`. The trifecta split decided it: a tainted read is held by `scout` and by the **world's door**, a program with no model, and by nothing else. Steward writes obligations from the handover and the door's rows |
| 26 | **A brief that names no agent and lets the launcher guess; `agent+window+model:` as one widened field** | v37 | fourteen named agents make *which agent* a fact the brief must carry. **Ten fields: FINAL's nine plus `agent:`**, the roster name the launcher composes argv for — chosen because it leaves FINAL's nine untouched. **Mechanism:** `bin/run` refuses a brief whose `agent:` is not a roster file (ABSENT). The field itself is carried in §6, not here |
| 27 | **A read-back page as an eighth page; a briefing nobody can reach from mission control** | v38 | both were **already** published pages, and the founder's pages absorb rather than delete them (v4). The read-back is the intent-creation form on page 4's *new card* and page 7's *add session*; the briefing is page 5's top strip. Both stay phone pages, and neither becomes an eighth page |
| 28 | **The website hosted as a published artifact; a cloud host reaching into the Mac** | v39 | a terminal pop needs `tmux` on the same machine, and a hosted page cannot reach it. `mission-control/` serves the seven pages on the Mac; the phone keeps the published pages for reading and deciding, and they cannot pop a terminal. **The cost, once:** two renderers over one state, which FINAL §13.1 refused |
| 29 | **One `maxTurns` for every agent; no cap** | v40 | the seven existing engine files already use exactly two values — **30 producing, 25 read-only** — `maxTurns` binds when an `agentType` is named, and the lint ceiling is 120. A default that copies the measured seeds is a starting point, not a design, and measurement tunes it per agent afterwards |
| 30 | **A worktree for every agent; no isolation for the four that edit source** | v41 | a worktree is for a run that writes the venture's own files; a store write is narrowed by argv instead (v34). **The cost, once:** creating a worktree still needs the sandbox escalated for that one command, and only four agents ever meet it |
| 31 | **`keel/agents/<name>.md`, the fifteen files beside their argv** | v42 | Claude Code reads `.claude/agents/` and the `PS-*` lint globs it, so fifteen files under a second path would be loaded by nothing (challenge A P1-1) |
| 32 | **"the grant is the argv", said of a teammate** | v43 | a teammate and a subagent are spawned in-process and have no argv at all; four narrowings were claimed on mechanisms that cannot carry them (P1-2) |
| 33 | **`steward` writing the obligations store directly** | v44 | the store table gives the file one writer, the Watch. Two writers under a heading that reads *one writer each* is the defect the store check exists to refuse (P1-3) |
| 34 | **ten brief fields, with the anchor implied** | v45 | §11.11 keys a refusal on the eleventh field, so a launcher built to a ten-field brief refuses nothing and one built to eleven refuses every brief §6.2 describes (P1-4) |
| 35 | **an Operator dispatched as a subagent; or an Operator with no file** | v46 | a dispatched agent file cannot form the agent team page 2 draws, and a bare main session is not the object §17.1 inventories with a model and a tools line (P1-5) |
| 36 | **an `analyst` that does the arithmetic** | v47 | the reconciliation is the anchor that makes every other number rung 1; a model in that loop makes the company's own numbers rung 4 (P2-12) |
| 37 | **skill directories under `ventures/<name>/`** | v48 | the file tree put the generated directories inside a venture while §7.1 put them at the repository root, which leaves the house's own fifteen agents with no skills directory (P2-13) |
| 38 | **a skill creator that is a program dispatching four agents** | v49 | §0.3 admits one dispatcher. A second one is a second place a grant is composed, which is the failure v34 exists to prevent (P2-14) |
| 39 | **ABSENT and WISH as interchangeable marks** | v50 | the two marks decide how much of the plan reads as enforced, and six sections used them for one state — designed-but-unbuilt against no-mechanism-proposed (P2-19) |
| 40 | **one admitted step list, with the curator's five questions smuggled in** | v51 | 0 of 121 free reflections named the cause: evidence for admitting a second list by name, not for declining to call it one (P2-20) |
| 41 | **a card with no writer** | v52 | a card exists before anyone drags it, and `keel/bin/run` writes only what happens after the drag (P2-21) |
| 42 | **seven pages as a ceiling** | v53 | the founder asked for *"a lot more cool and important things"*, and the plan built a door for tools and none for surfaces. An eighth page enters through the §9.3 door or not at all (opinion O-1) |

---

### 22.3 What is not on this list, and where to find it

**(NEW: three kinds of loss are recorded elsewhere on purpose)** A reader looking for a rejected idea and not finding
it here should look in one of three places, not conclude it was never considered.

- **Refusals with a reason** are in the coverage document and in SPINE §B.4: user-testing simulation, a separate
  documentation agent, data labelling as an agent, influencer outreach, churn prediction, an autonomous reply bot,
  contract drafting that binds, and a hiring pipeline. Each is refused **and says why**, and three of them are
  refusals that revisit when a venture has the data or the employees.
- **Tools refused at the door** are in §17.3: RunPod (spends money at a rate under an uncapped key), Mem0 (memory
  leaves the machine), n8n (licence). A refused tool is not a losing image; it is a standing verdict that a new
  credential or a new licence would change.
- **The FINAL rows that neither the founder nor a fact moved** are carried forward unchanged by number in §1-v2, and
  they have no losing image here because nothing beat them this round.
- **One image §J does not list, deliberately:** *a nightly full rewrite of the memory files*, which v24 beat with ACE
  (arXiv 2510.04618). It lives in §1-v2 row v24's last column and is not copied here, because the rule this section
  opens with is that nothing §1 carries word for word is repeated.

**(FINAL)** Everything above is kept so it can be argued for later. **Nothing here is deleted when it loses** — that
is the whole point of writing it down, and it is why §1-v2's last column and this section exist as two views of one
record rather than as two records.
