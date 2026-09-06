## 7 · Skills

*obeys: v3, v17, v18, v19 (SPINE §E entire), and **v77** (the rethink round of 2026-09-06); inherits: FINAL §11, §16.2*

**(FOUNDER, overruling FINAL §1 row 10.)** *"take all the skills that the biggest systems use, the biggest agent
systems use, we can learn a lot from them, like, to have more engineering stuff and more creative stuff and to give
the agents the tools the knowledge they will need in order to achieve tasks without limiting their point of view."*
And: *"we need a skill creator of skill, which, you know, we will research a task or a mission and, like, to break it
down two steps and to give it to the agents."* The library is built, not shelved. FINAL's holding directory —
`keel/holding/skills/`, the 134 moved whole into a place nothing reads — is the losing image and is kept by name in
section 22.

---

### 7.1 The library plan

**(NEW: the format is now a published spec, not a convention, so it can be obeyed rather than approximated.)** The
container is the **open SKILL.md standard** (`agentskills.io/specification`, fetched 2026-09-05). Its published
limits are the file's limits and they are not ours to soften:

| Field | Limit, quoted from the spec |
|---|---|
| `name` | max 64 chars, `a-z0-9-`, *"Must match the parent directory name"* |
| `description` | max 1024 chars |
| Metadata cost | *"(~100 tokens): The `name` and `description` fields are loaded at startup for all skills"* |
| Instructions | *"(< 5000 tokens recommended)"* |
| Body | *"Keep your main `SKILL.md` under 500 lines."* |
| Optional | `license`, `compatibility` (max 500), `metadata`, `allowed-tools` (*"Experimental"*) |

**(NEW: one artifact has to load in three runtimes, and the runtimes disagree about the path.)** Claude Code reads
`.claude/skills/`. **Codex and Gemini CLI both read `.agents/skills/`, and Codex does not read `.codex/skills`** —
Codex's search order is `$CWD/.agents/skills`, `$CWD/../.agents/skills`, `$REPO_ROOT/.agents/skills`,
`$HOME/.agents/skills`, `/etc/codex/skills`. So there are **two directories and one source of truth**: Markdown is
the source, and both directories are generated from it. That is wshobson's shipped shape — *"single
source-of-truth"* with harness-native artifacts generated — and it is adopted because it is the only shape that
survives a third runtime.

**(NEW: collisions are not merged, so a generated directory cannot be allowed to drift.)** Codex states it plainly:
*"if two skills share the same name, Codex doesn't merge them; both can appear in skill selectors."* A drifted
generated copy therefore does not error; it appears twice with different bodies. **Mechanism:** the generator is the
only writer of either directory, and the existing manifest check is re-pointed at the generated-versus-source diff
(see 7.7). Nothing hand-edits `.claude/skills/` or `.agents/skills/`.

**(NEW: the bulk import is blocked on one unread file, and it is cheap to clear.)** The upstream this repo already
draws from now advertises **2,111+ skills** and is MIT **on the code** — but a separate `LICENSE-CONTENT` file
exists at that repository and **was not fetched**, and it may carry different terms for skill *content* than MIT
does for code. **No bulk vendoring until it is read** (v17). One fetch clears it; open decision 4 in section 20.

**(R13, OPEN — and it is narrower than section 20 row 4, which is what makes it decisive.)** The question is not
*may we redistribute these bodies*. Under v18 an imported body written to the spec's own recommendation **fails
admission and is rewritten** into one of the four kinds of 7.2 — a **derivative work**, which MIT-on-the-code says
nothing about. So the answer that matters is whether `LICENSE-CONTENT` permits derivatives, not whether it permits
copying. **Source class:** the licence file, read raw. Until it is read, 7.2's conversion pass is blocked on the
same fetch as the bulk import, and both are one act.
Related and smaller: this branch's `SKILLS_SOURCE.md` (EXISTS, branch `ceo-1-1788609834`) names
`npx antigravity-awesome-skills`, while the upstream now advertises `npx agentic-awesome-skills` — whether the old
name still resolves is UNVERIFIED.

**(NEW: the corpora that look like libraries are mostly indexes, and one of them is not licensed at all.)** Read the
sources for what they are before importing from them:

| Source | What it actually is | Licence, read from the file where the row says so |
|---|---|---|
| `anthropics/skills` | **19 skill directories** — a reference corpus, not a library | **No root LICENSE file.** README only: *"Many skills in this repo are open source (Apache 2.0)"*, document skills *"source-available, not open source"*, and *"provided for demonstration and educational purposes only"* |
| `sickn33/antigravity-awesome-skills` | 2,111+ skills; this repo's own upstream | MIT on the code; **`LICENSE-CONTENT` unfetched** (v17) |
| `wshobson/agents` | 183 skills, 202 agents, 94 plugins, 105 commands; multi-harness generation | MIT, read from LICENSE |
| `obra/superpowers` | ~14 methodology skills; count is README-derived and UNVERIFIED | MIT, read from LICENSE |
| Both VoltAgent lists | indexes of links, not hosted skills | MIT **UNVERIFIED** — README and file listing only |
| `agentskills/agentskills` (spec, `skills-ref`) | the spec and its validator | **UNKNOWN** — not fetched |

---

### 7.2 The content rule, and the collision it resolves

**(NEW: the published spec recommends the one body this system refuses, so the collision is real and has to be
decided rather than noticed later.)** The spec's recommended body sections are *"Step-by-step instructions"*,
*"Examples of inputs and outputs"*, *"Common edge cases"*. FINAL §11.1 built the field kit out of four descriptive
headings precisely so that **no heading can hold *first do this, then do that***. A skill written to the spec's own
recommendation is procedural by that recommendation. Two different artifacts were wearing one filename.

**(NEW, v18.) The container is the open standard; the content rule is ours.** Four admissible bodies:

| Body | What it contains | Why it is admissible |
|---|---|---|
| **anchor** | a check with an exit code | it decides; it does not advise |
| **exemplar** | examples of good, each with provenance | it shows, and the run still judges |
| **rehearsal case** | an input plus a known answer | it can be failed, so it can be trusted |
| **reference** | a vendor fact carrying an expiry | it is a fact, and it rots on a date rather than silently |

**A step list is admitted in exactly two places (v51).** The second is the curator's five fixed questions per failed handover (§13.6, §13a.3), admitted on the evidence FINAL §10.7 cites — 0 of 121 free reflections named the cause. The first is a checklist the **Sender** reads aloud, where the judge is absent
and the act cannot be taken back — sending to a list, a migration over real data, a filing, a charge. **(FINAL
§9.4.)** The Sender contains no model and cannot decide to skip an item, which is the only condition under which a
written procedure is safe here.

**The cost of v18, stated once and not re-litigated:** an imported skill written to the spec's recommendation
**fails our admission and needs a pass**. That is a real conversion cost on 2,111+ candidates and it is accepted,
because the alternative is a library of procedure, which is the container the done-test replaced.

---

### 7.2a Eval-only bodies — the case that judges a run may not be readable by it

**(NEW: O11, and it resolves contradiction 11 — two rules already written, which together defeat one of them.)**
v18 makes **rehearsal case** one of four admissible bodies, and 7.1 generates every admitted skill into the two
directories an agent loads from. Read together, **the known-answer case that will judge a run ships inside that
run's own skill directory.** A rehearsal case an agent can read is not a rehearsal case; it is the answer key filed
with the exam.

**The fix is one field, not a second library.** Every admitted skill carries an **eval-only** flag in its
frontmatter. The generator writes eval-only bodies into **`keel/golden/` (ABSENT)** and **never** into
`.claude/skills/` or `.agents/skills/`, and the manifest check of 7.7 is re-pointed to fail a case body found in
either loaded directory. `bin/skill-eval` (ABSENT) reads `keel/golden/`; a run does not.

| Body | Ships into the loaded directories | Ships into `keel/golden/` |
|---|---|---|
| anchor | yes | no |
| exemplar | yes | no |
| reference | yes | no |
| **rehearsal case** | **no** | **yes** |

**The cost, once:** one frontmatter field and one generator rule. **Settled by:** grep a live run's loaded skill
directories for a known answer and find nothing. This is the same rule §11.4 states about the tester — blindness is
a property of what the process can open, never of what the prompt asked for — applied to the library rather than to
the grant.

---

### 7.3 Admission by eval

**(NEW: the mechanism already ships, so this is an import rather than a design.)** `skill-creator` in
`anthropics/skills` implements exactly what FINAL §11.3 asked for as *"admission by test, not excision by
argument"*: draft **2–3 realistic prompts** into `evals/evals.json`, **run with-skill and baseline in parallel**,
grade the assertions, tune the description for triggering accuracy, package. Added to it: `plugin-eval`'s **static
layer** — *"deterministic structural analysis (<2s, free)"*.

**Refused for now:** `plugin-eval`'s Monte Carlo layer, *"statistical reliability via 50-100 simulated runs"*. **The
cost, once:** without it a skill's reliability is measured on 2–3 cases, so **the expiry of 7.4 does the work a
larger sample would have done**. That is why retirement is not optional in this design.

**(NEW: O25 — one sample floor, and it resolves contradiction 12.)** §11.10 prints **`insufficient`** rather than a
number below a sample floor, *"because a pass rate over four cases is a number that invites a decision it cannot
support"* — and this section admits a skill on **2–3 cases**. Two rules about the same arithmetic, disagreeing, and
the one that admits is the looser. **The fix is one shared predicate with two call sites (ABSENT):** the trust
score, skill admission and §11's error rates all ask the same function whether the sample is enough, and it answers
once. **The consequence is stated rather than softened:** an admission on 2–3 cases is admission **below the
floor**, so it is recorded as `insufficient` and is exactly why v19's expiry is what does the work here. The
alternative — raising skill admission to the trust score's floor — is refused because it would price a skill's
admission above the work it saves, and the losing image is kept: *two floors, one per section, each defensible
alone*.

**(NEW: O47 — admission is bound to the bytes it was granted on.)** The admission record carries the **body hash**,
and **a changed hash voids admission until re-eval**. Without it, admission is a claim about a file that anyone may
then rewrite, which is the rug pull of §8.1 aimed at the library instead of at a server. **Mechanism:**
`.claude/skills/CURATION.yml` (**EXISTS** and is checked on branch `ceo-1-1788609834`) gains the hash beside the
test; `check:curation` fails a hash that does not match the file it names. **The cost, once:** one sha256 per
admitted body.

**(NEW: the mechanism is imported, the corpus is not — and the licence is the reason.)** `anthropics/skills` has no
root LICENSE and says its skills are *"provided for demonstration and educational purposes only"*. We take the eval
loop's shape. We do not vendor its 19 skills on the strength of a README sentence.

```mermaid
flowchart TD
    P["A skill is proposed:<br/>written, imported, or made by bin/skill"] --> LIC{"Licence read from the LICENSE file,<br/>not from a badge or a README?"}
    LIC -->|"no, or LICENSE-CONTENT unread"| HOLD["Not admitted. Blocked at v17.<br/>One fetch clears the class"]
    LIC -->|"yes"| SPEC{"Passes the open standard:<br/>name under 64 and matching its directory,<br/>description under 1024, body under 500 lines"}
    SPEC -->|"no"| FIX["Returned, with the failing field named"]
    SPEC -->|"yes"| BODY{"Is the body one of the four<br/>admissible kinds of 7.2?"}
    BODY -->|"a step list"| SEND{"Is it a Sender checklist —<br/>judge absent, act not takeable back?"}
    SEND -->|"no"| REJ["Refused. Procedure is what the<br/>done-test replaced"]
    SEND -->|"yes"| STATIC
    BODY -->|"anchor, exemplar,<br/>rehearsal case, reference"| STATIC["Static layer:<br/>deterministic structural analysis"]
    STATIC --> EVAL["Eval layer: 2 to 3 realistic prompts,<br/>with-skill and baseline run in parallel,<br/>assertions graded"]
    EVAL --> BEAT{"Does with-skill beat baseline?"}
    BEAT -->|"no"| NEG["Not admitted. The cut is written to<br/>CURATION.yml with the test that made it —<br/>house scope, never a venture store (O47)"]
    BEAT -->|"yes"| TRIG["Tune the description<br/>for triggering accuracy"]
    TRIG --> EXP["Admitted: a namespace, a valid_until,<br/>and the body hash (O47)"]
    EXP --> EVO{"Is the body a rehearsal case?"}
    EVO -->|"yes"| GOLD["keel/golden/ ONLY — eval-only.<br/>Never into a directory a run loads (O11)"]
    EVO -->|"no"| GEN["Generated from the one Markdown source into<br/>.claude/skills/ and .agents/skills/"]
```

---

### 7.4 Retirement by forced expiry

**(NEW, v19: nobody in the world retires a skill by non-use, so the plan stops pretending that is a mechanism.)**
Across all seven projects researched, the only retirement mechanisms found are **drift and dead-link detection**
(`make garden`, wshobson) and **a closed contribution door** (*"we don't generally accept contributions of new
skills"*, superpowers). **No project ships a usage counter or an unused-for-N-days expiry.** FINAL §11.3's *"Ninety
days uncalled and it leaves"* is therefore a losing image and is kept by name in section 22.

**Every skill carries `valid_until`. When it comes due, exactly one disposition is recorded — Refresh, Deprecate, or
Waive with a new date.** There is no fourth outcome and no silence. **Mechanism, and it exists on this branch:**
`scripts/ledger.mjs` already forces exactly this disposition for claims and refuses a waiver with no `until`, and
`scripts/check-citations.mjs` already blocks on a dead path — both EXIST on branch `ceo-1-1788609834`. The skill
expiry rides those two rather than adding a third implementation, because two implementations of one check disagree
silently and this repository has hit that before.

**The date is set at admission, per skill, by the agent that proposed it.** No fixed window is written into the plan:
a vendor fact and a code exemplar do not rot at the same rate, and a single number would be wrong for both.

---

### 7.4a What the disposition reads, and the event when nothing resolves

**(NEW: O41 — `DEPENDS-ON-R14`.)** 7.4 forces a disposition on a date and says nothing about what informs it. **Log
skill activation and join it to outcomes**, and a skill that never fired once in its whole life defaults to
**Deprecate** at expiry, with a founder waiver the only thing that keeps it. **v19 stays whole:** retirement is
still date-forced and non-use is still not a trigger — 7.4's finding that no project in the world retires by
non-use is unchanged. What changes is only what the human reads before choosing among three dispositions that are
already compulsory.

**(R14, OPEN.)** Do any of the three CLIs emit a **skill-activation event** we can read? **Source class:** the three
vendors' hook and telemetry documentation. **What it decides:** whether O41 is a field lookup or instrumentation we
build. **Mechanism:** `bin/log` (**ABSENT**) either way; only its input moves.

**(NEW: O48 — the miss is the signal, and today nothing emits it.)** A **`skill.miss` event** is written when a
brief's declared namespace resolves to **zero unexpired skills**. Uncovered-field detection is named in this plan
as something the Operator notices, which is not a mechanism — a gap in the library is silent by construction,
because the run simply proceeds without help and produces something plausible. A miss is the cheapest possible
trigger for 7.5's creator, and it is one line in `bin/log` (**ABSENT**).

---

### 7.5 The skill creator

**(FOUNDER.)** *"we need a skill creator of skill, which, you know, we will research a task or a mission and, like,
to break it down two steps and to give it to the agents."*

**(NEW: v49 — it is a routing rule the Operator follows plus one no-model program, not a fifteenth agent and not
a second dispatcher, and it names which agent does each move, which is what keeps it from being a stage that
states method.)** Only the Operator dispatches (§0.3), so the creator is this: the Operator routes **scout →
product → curator**, each under its own grant, and one program scores the result — the eval runner
**`bin/skill-eval`** (**ABSENT**), which holds no model and dispatches nothing. The routing rule, in order:

1. **scout** answers the bounded question of how the field actually does this. Every claim carries URL, quote and
   access date; `scripts/check-citations.mjs` (EXISTS, this branch) blocks on a dead one.
2. **product** states the **done-test** the skill is supposed to make reachable — falsifiable by someone who did not
   do the work, or the store check refuses it.
3. **curator** writes the artifact into one of the four admissible bodies of 7.2 and proposes its `valid_until`.
   The curator is the only writer of memory, and a skill is knowledge, so the writer is the same one.
4. The **admission eval of 7.3** runs with-skill against baseline. **A candidate that does not beat baseline is not
   admitted, and the cut is written to ~~the negatives store~~ `CURATION.yml` with the test that made it (moved
   2026-09-06: O47)** rather than discarded — the failure is the cheapest thing the run produced.

**(NEW: O47 — contradiction 10, and the fix was already on disk.)** §7.5 step 4 used to send a failed candidate to
the **per-venture** negatives store, while v48 and §13.2 make skills **house scope**: a skill refused for the
harness would have been invisible to a venture that later proposed the same body. `.claude/skills/CURATION.yml`
already records every cut with the test that made it, is house scope, and is checked by `npm run check:curation` on
branch `ceo-1-1788609834`. **The negatives store keeps everything else and loses nothing** — what moves is one
class of row, to the file built for it.

```mermaid
flowchart TD
    T["A task or mission arrives with<br/>no skill behind it"] --> SC["scout — how does the field actually do this?<br/>URL, quote, access date on every claim"]
    SC --> PR["product — the done-test this skill<br/>is supposed to make reachable"]
    PR --> CU["curator — writes it into one of the four<br/>admissible bodies; proposes valid_until"]
    CU --> AD["The admission eval of 7.3"]
    AD -->|"beats baseline"| IN["Admitted. Namespaced.<br/>Generated into both directories"]
    AD -->|"does not beat baseline"| OUT["Refused. Recorded in CURATION.yml with<br/>its test — house scope, not a venture store"]
    IN --> EXPY["valid_until falls due"]
    EXPY --> DISP{"Exactly one disposition"}
    DISP --> R1["Refresh — re-run admission"]
    DISP --> R2["Deprecate"]
    DISP --> R3["Waive, with a new date"]
```

**(FINAL §11.1, surviving.)** The scout fan-out inside move 1 is the **one place parallelism is earned**: four
scouts asking four independent questions do not need each other's context, and that is the same reason v6 refuses to
parallelise a build.

---

### 7.6 Namespaces per agent

**(NEW: SPINE §E.4 says "Seven namespaces" and then lists thirteen. The list is the true statement; the count is a
defect and is corrected here.)** **Thirteen namespaces**, and every one of them is claimed by at least one agent —
there are no orphans:

| Namespace | Held by |
|---|---|
| `engineering` | builder · reviewer · architect |
| `testing` | builder · tester |
| `quality` | reviewer · tester · challenger |
| `security` | guard |
| `design` | designer |
| `frontend` | designer |
| `product` | product |
| `data` | architect · analyst |
| `growth` | writer · growth |
| `craft` | writer |
| `operations` | steward |
| `knowledge` | curator |
| `research` | scout · challenger |

**(FACT: world.md 16 — the thirteen do not cover everything installed, and the gap arrived from the vendor.)**
The `Workflow` tool's prompt footprint fell from ~5.7k to ~1k tokens *"with the script-writing reference moved into
a bundled `workflow-authoring` skill"*. That skill is **installed by the runtime and claimed by no namespace above**
— so the table is a statement about what *we* admit, not about what an agent actually loads. v35's containment is
unchanged and now cheaper; what this costs is that the startup metadata of 7.6a must count bundled skills we did
not admit, or it counts the wrong library.

**(FINAL, and now the standard's own mechanism rather than a local convention.)** **Never preloaded.** Progressive
disclosure is what enforces it: *"The `name` and `description` fields are loaded at startup for all skills"* at
**~100 tokens each**, the body loads only on judged relevance, and bundled files load below that. The consequence
binds the library's size: **every admitted skill taxes every unrelated task at startup**, so the namespace is not
cosmetic — it is the thing that keeps a growing library from making a shrinking one's job more expensive. That is
the same defect this repository already fixed once, when reading the whole manifest cost ~15,000 tokens per lookup.

---

### 7.6a How big the library may get — a measured budget, not a number

**(FOUNDER, rethink 2026-09-06: D12 → v77.)** *"As big as a measured budget allows."* The founder's answer to
*how many skills* is neither a count nor "unlimited": it is **a per-agent startup metadata budget enforced by a
checker, plus one generated directory per namespace so an agent loads only what its own file declares. The import
stops when the budget binds.**

**Why a budget and not a count.** 7.6's own arithmetic is the argument: the published standard loads *"the `name`
and `description` fields … at startup for all skills"* at roughly **100 tokens each**, so **every admitted skill
taxes every unrelated run**, and the upstream advertises 2,111 candidates. That is the same defect this repository
already paid for once, when reading the whole manifest cost ~15,000 tokens a lookup and a good new skill made every
unrelated task dearer. A count would be arbitrary; a budget is the thing that actually binds, and it binds on the
quantity that hurts.

**Mechanism.** One checker modelled on `scripts/check-memory-budget.mjs` — which **EXISTS and blocks** on branch
`ceo-1-1788609834`, so this is a second subject for a proven shape rather than a new kind of gate — plus **one
generator pass** that writes a directory per namespace (**both ABSENT**). It extends v48 and this section's 7.1
generator: the generator already owns both output directories, so the per-namespace split is a rule inside it, not
a second writer. **The cost, once:** the library stops being open-ended, which is what v3's ambition needs in order
to stay affordable.

**(R8, OPEN — and it can refute this row outright.)** Does the skill metadata tax scale with the **installed
library** or with the agent's **declared namespaces**? **Source class:** two trees, identical prompt, input tokens
read from `--output-format json` — one with the full house library installed, one carrying only one agent's
namespaces. **What it decides:** if the tax scales with declared namespaces, **the generated directories are the
whole fix and the budget is unnecessary**; the checker is then over-built and should not be written.

**(R15, OPEN.)** Is there any published measurement of **selection accuracy as installed-skill count rises**? The
budget bounds a *cost*; nothing here bounds the risk that a model picks the wrong skill out of two thousand.
**Source class:** the spec's authors, vendor engineering posts, the harness showcase. **What it decides:** the real
exposure of importing thousands. **If nobody has measured it, v77's budget is what bounds the exposure** — which
is a weaker guarantee than it sounds, and is stated here rather than assumed away.

---

### 7.7 The 134 on disk, and what each becomes

**(measured on branch `ceo-1-1788609834`: 135 directories under `.claude/skills/`, of which one is `routers/` —
so 134 skills, plus `CURATION.yml` and `MANIFEST.json`, all EXIST.)**

**(NEW: they are no longer a holding directory. There is no shelf.)** FINAL §16.2's fate classes are kept, and they
change status: they were a **verdict**, and they become a **starting classification for admission**. Each of the 134
now has exactly two futures — it re-enters through 7.3, or its `valid_until` falls due and 7.4 takes one of three
dispositions. Nothing sits in a directory read by nothing.

| Fate class (FINAL §16.2) | Count | Admissible body it targets under v18 | How it re-enters, or does not |
|---|---|---|---|
| **PROCEDURE** | 73 | none, as procedure | One door only: a **Sender checklist**, where the judge is absent and the act cannot be taken back. Otherwise it may **donate its examples** to an exemplar, one at a time, with a caller. All 28 `thinking-*` sit here |
| **ANCHOR-CANDIDATE** | 22 | **anchor** | It must carry a check with an exit code and beat baseline. First candidates named by the census: `wcag-audit-patterns`, `security-audit`, `web-security-testing`, `e2e-testing-patterns`, `writing-good-tests`, `verification-before-completion` |
| **EXEMPLAR-CANDIDATE** | 16 | **exemplar** | Provenance per example, then the eval. `react-patterns`, `error-handling-patterns`, `high-end-visual-design`, `seo-content-writer` and the rest |
| **REHEARSAL-CANDIDATE** | 1 | **rehearsal case** | `react19-test-patterns` carries before/after pairs with known answers — the only one in the corpus. **Its admitted form is eval-only: it lands in `keel/golden/` and leaves `.claude/skills/`** (7.2a, O11) |
| **INFRA** | 22 | **reference** | **(NEW: this row moves.)** FINAL §16.2 said INFRA is *"never loaded into a run as a skill"*. v18 admits a fourth body — a vendor fact with an expiry — so an INFRA entry now has a legitimate skill form, and 7.4's expiry is what makes it safe |

73 + 22 + 16 + 1 + 22 = 134. **The distribution is the finding, not the total:** the largest class is the one the
content rule refuses, so the honest prediction is that the library grows mostly by import and creation rather than
by re-admitting what is here.

**(NEW: two existing checks do not retire — they change subject, and that corrects FINAL §16.2.)** §16.2 wrote that
*"`check:manifest` and `check:curation` … retire with it"*, because the library was going to a shelf. The library
does not go to a shelf, so they stay and are re-pointed:

- **`check:manifest`** becomes the **drift check between the one Markdown source and the two generated directories**
  — the mechanism 7.1 needs, given that Codex does not merge same-named skills. **(NEW: O11 adds a second
  assertion to it)** — it also fails when an eval-only body is found in either loaded directory, which is what makes
  7.2a a gate rather than a convention.
- **`check:curation`** already records every cut with the test that made it. Inverted per FINAL §11.3, that is the
  **admission record**: every entry keeps the eval that admitted it and the date it expires.

Both are steps of the check suite on branch `ceo-1-1788609834` today, so the mechanism is a re-pointing rather than
a new blocking check.

---

### 7.8 What enforces this section

| Rule | Mechanism | State |
|---|---|---|
| A skill matches the published spec | the spec's own validator, `skills-ref validate` | licence of `skills-ref` **UNKNOWN**; the checks are re-implementable from the spec text |
| A skill's body is one of four kinds | the admission gate in `bin/skill` | **ABSENT** |
| A skill beats baseline before admission | `evals/evals.json` plus paired with-skill and baseline runs | **ABSENT** here; **shipped** upstream as `skill-creator` |
| A skill expires and one disposition is recorded | `scripts/ledger.mjs` (forces the disposition; refuses a waiver with no `until`) | **EXISTS**, branch `ceo-1-1788609834` |
| A skill citing a dead path fails | `scripts/check-citations.mjs` | **EXISTS**, branch `ceo-1-1788609834` |
| The generated directories match the source | `check:manifest`, re-pointed | **EXISTS** as a suite step; the re-pointing is **ABSENT** |
| Every admission keeps the test that made it | `.claude/skills/CURATION.yml`, inverted | **EXISTS**, branch `ceo-1-1788609834` |
| No bulk import before the licence is read | a founder decision, section 20 row 4; **R13** narrows it to *derivative bodies* | **WISH** until the fetch happens — nothing today blocks a vendoring commit |
| Skills are never preloaded | the standard's progressive disclosure | **shipped by the runtimes** |
| **A rehearsal case cannot be read by the run it judges** (O11, 7.2a) | the eval-only frontmatter field; the generator writes it to `keel/golden/` only; `check:manifest` fails a case body in a loaded directory | **ABSENT** — `keel/golden/`; `check:manifest` **EXISTS** and is re-pointed |
| **Admission is bound to the body it was granted on** (O47) | the body hash in `CURATION.yml`; `check:curation` fails a mismatch | `CURATION.yml` **EXISTS** and is checked, branch `ceo-1-1788609834`; the hash field is **ABSENT** |
| **A failed candidate is house scope, never a venture store** (O47, contradiction 10) | `.claude/skills/CURATION.yml` | **EXISTS**, branch `ceo-1-1788609834` |
| **One sample floor answers for admission and for the trust score** (O25, contradiction 12) | one shared predicate, two call sites — §11.10 and 7.3 | **ABSENT** |
| **Startup metadata stays inside a per-agent budget** (v77) | a checker modelled on `scripts/check-memory-budget.mjs`, plus one generated directory per namespace | checker shape **EXISTS** (memory budget); the skills checker and the generator pass are **ABSENT**; **R8** may retire the checker |
| **A skill that never fired defaults to Deprecate at expiry** (O41) | activation logged by `bin/log` and joined to outcomes | **ABSENT** · **DEPENDS-ON-R14** — whether any CLI emits the event is unread |
| **A namespace that resolves to nothing raises an event** (O48) | a `skill.miss` event from `bin/log` | **ABSENT** |
