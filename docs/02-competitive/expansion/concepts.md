# Concepts — mechanisms this system has not considered

**Expansion study 3 of 3, written 2026-09-01.** Lane: **mechanisms and concepts — ideas, not products.**
Tools/MCPs are `hands.md`'s lane; open-source projects to adopt are `oss.md`'s. Everything here is a *way
of doing something*, drawn from wherever the idea actually lives.

**Nothing here is decided or recommended for adoption.** Where a problem matters, there are at least two
competing mechanisms, deliberately not reconciled — the filtering conversation needs alternatives, not a
verdict.

---

## How to read this

Every entry carries five fields, per the brief:

- **Problem** — what breaks without it
- **How** — the mechanism, 2-4 sentences
- **Enforced by** — the thing in *this repo* that would make it real. If nothing would, the entry says
  **`WISH`** in bold. Per the standing rule, a rule with no mechanism is a wish, and saying so is the
  only honest option.
- **Fails when** — the failure mode. Every mechanism has one. An entry with no failure mode named is an
  entry I did not think about hard enough.
- **Territories** — which of the 14 it touches.

**Provenance labels.** `[SOURCED]` — a real named practice or paper, cited in §16 with an access date.
`[ANALOGY]` — a real practice from another domain, transposed here by me; the practice is real, the
transposition is mine. `[INVENTED]` — mine, no precedent claimed. There are no unlabelled claims and no
citation I did not verify this session.

**Counts.** 128 mechanisms — re-derive rather than trusting this line:
`grep -cE '^\*\*[A-Z]+[0-9]+ · ' concepts.md`. §1 creativity (38) · §2–§13 the twelve never-named (62) ·
§14 the remaining territories (28) · §15 anti-mechanisms, six things to refuse · §17 the five I would
fight for.

**One finding first, because it changes §1.** The repo's only piece of creativity machinery —
`.claude/workflows/design.js` — selects a winner by **summing four 0-10 scores into a `total` and
sorting**. `STARTUP-OS.md` §7 states the opposite rule: *"Union, never average. A panel returns findings;
it never returns a score."* And the same document reports a design PASS/BLOCK judge measuring **0.543
against a panel only 0.741 self-consistent**. So the one mechanism built to preserve creativity uses the
exact selector the repo's own evidence says does not work. This is not a small detail: §1 is largely about
what to put in its place.

---

## 1 · Creativity — mechanisms that PRODUCE

The founder's complaint is that the system lost creativity to playbooks, and that almost everything built
is a *stopping* mechanism. This section is the answer. It is the longest section on purpose.

The organising idea: **creativity in a machine is variation plus selection plus memory of what was
already tried.** Every sub-family below attacks one of those three, and the failures are different —
weak variation gives you sameness, weak selection gives you regression to the mean, weak memory gives
you circling.

### 1a · Variation — making the candidate set actually different

**C1 · Blind pairwise tournament instead of absolute scoring** — *[SOURCED]*
- **Problem** — `design.js` sums four 0-10 axes. Absolute numeric scores from an LLM judge are the least
  reliable output it can produce, and summing them averages away exactly the spikiness that makes one
  variation interesting. A variation that is 10/2/2/2 loses to four 5s, every time.
- **How** — Judges never score. They compare two candidates and say which is better *and why*, with
  identities stripped and presentation order randomised per comparison. Aggregate with Bradley-Terry or
  a simple Copeland count (how many pairwise wins). Run each pair twice with the order swapped and
  discard any pair where the judge flips — a flip means the judge could not tell, which is information.
- **Enforced by** — Replace `SCORE_SCHEMA` in `.claude/workflows/design.js` with a comparison schema, and
  add a test in the `test:playbooks` family asserting that (a) no schema in `.claude/workflows/` contains
  a numeric field named `total`, and (b) every judged comparison has a swapped twin. Rule 10 applies: a
  pair that flips resolves `unresolved`, never to a winner.
- **Fails when** — N candidates cost O(N²) comparisons. At N=6 that is 15 pairs × 2 orders = 30 judge
  calls. Mitigate with a Swiss-style tournament (log N rounds) rather than round robin.
- **Territories** — 08, 04, 13

**C2 · Quality-Diversity archive — keep an elite per niche, not one winner** — *[SOURCED]*
- **Problem** — A tournament returns one winner and throws away five. The five contain the ideas you will
  want in three weeks, and they are gone. Worse, the winner is the *centre* of the space, because judges
  reward inoffensiveness.
- **How** — MAP-Elites: define 2-3 **behaviour descriptors** for the artifact type (for a landing page:
  information density · structural metaphor · motion budget; for copy: register · length · concreteness),
  discretise each into 3-5 bins, and keep the best artifact **per cell**. Selection is per-cell, so a
  weird-but-excellent corner survives next to the safe centre. The archive is the durable asset; the
  "winner" is just the cell you shipped from this time.
- **Enforced by** — An `archive/` directory per project with one file per occupied cell, and a check in
  the suite that a design round which produced no *new* occupied cell is recorded as `filled: 0` rather
  than as a success. The descriptors are declared in the pack, so `schema-lint.js` can refuse a pack with
  a QD phase and no descriptors — the same shape as its existing "declares `mcpServers` that no config
  backs" rule.
- **Fails when** — Bad descriptors. If the two axes are both proxies for quality, every cell fills with
  the same thing and the archive is theatre. The descriptor set has to be *orthogonal to quality* and
  that is a design judgement someone must make per artifact type.
- **Territories** — 04, 05, 08, 12

**C3 · Novelty search — a fraction of the budget selects for difference, not quality** — *[SOURCED]*
- **Problem** — Objective-driven search is deceptive: the path to the best landing page may run through
  three landing pages that score worse than where you started, and a quality-selecting loop will never
  walk it. Lehman & Stanley showed objective functions actively misdirect search toward dead ends.
- **How** — Reserve a fixed fraction of each round (say 1 in 4 variants) that is judged **only** on
  distance from everything in the archive, with quality ignored entirely. It is allowed to be bad. Its
  job is to occupy a cell nothing occupies. Over rounds, the archive's coverage is the metric, not its
  peak.
- **Enforced by** — A `novelty_slots: N` field in the pack that the dispatch harness honours by
  constructing N prompts with the quality rubric *removed* and the archive summary *inserted*. A test
  asserts the novelty prompt contains no rubric text. Distance is computed mechanically (trigram Jaccard
  on the artifact text, or embedding distance if a local embedder exists) — and if it cannot be computed,
  the slot resolves `unresolved` and does not count as filled.
- **Fails when** — Novelty is cheap to fake. "Now in Comic Sans" is maximally distant and worthless. This
  is the known weakness of pure novelty search, and it is why it should be a *fraction*, with a quality
  floor as a filter rather than a selector.
- **Territories** — 04, 08, 13

**C4 · Island model with migration and culling** — *[SOURCED]*
- **Problem** — One population converges. Every variant descends from the same ancestor within two rounds
  and the round-three candidates are indistinguishable.
- **How** — FunSearch's structure: run K independent populations ("islands") that cannot see each other,
  each evolving its own best. Periodically, kill the worst half of islands and re-seed them by cloning a
  survivor's best — but the clone is a *seed*, not a continuation, so it diverges again. Cross-island
  migration is rare and one-way.
- **Enforced by** — The `pipeline()` primitive in `.claude/workflows/design.js` already fans out; islands
  are that fan-out held across rounds in separate directories with no shared context. A test asserts each
  island's dispatch prompt contains no text from another island — the same assertion Metaswarm's
  fresh-instance rule needs and this repo already knows how to write.
- **Fails when** — Cost. K islands × R rounds multiplies quickly, and one founder's 5-hour window is the
  hard constraint. This is a mechanism for the *one* artifact that matters, not for every move.
- **Territories** — 07, 08, 13

**C5 · Mandatory, auditable grafting** — *[SOURCED, from this repo]*
- **Problem** — `design.js` already asks the synthesiser to graft the runners-up's best ideas, and there
  is nothing that checks it did. A synthesiser that returns `grafted_ideas: []` is byte-identical, to
  every check in the system, to one that grafted three.
- **How** — Make the graft a checked contract: the synthesis must name ≥1 idea per runner-up, and each
  named idea must be **traceable to that runner-up's output** — the same mechanical anti-hallucination
  guard `/board-meeting` already specifies as `source_persona_round`. An unsourceable graft is a
  fabrication and fails.
- **Enforced by** — `SYNTH_SCHEMA` gains `grafted_ideas: [{from_angle, idea, quote}]` where `quote` must
  appear verbatim in the named variation's serialised output; a `test:playbooks` assertion checks the
  substring. This is exactly the check `check-citations` already performs on prose.
- **Fails when** — Quote-matching is gameable by grafting a trivial phrase. Mitigate by requiring the
  quote to be ≥ N words and to come from the variation's `concept` or `layout` field, not its `risks`.
- **Territories** — 08, 12

**C6 · Recombination — a child from two named parents** — *[ANALOGY]*
- **Problem** — Grafting is one-directional: winner takes a garnish from a loser. Genuine recombination —
  "A's structure with B's voice" — produces things neither parent contained, and nothing in the current
  design does it.
- **How** — After ranking, dispatch a variant whose brief is explicitly *"take the information
  architecture of variation 2 and the tone of variation 5; you may keep nothing else from either."* The
  child competes in the next round as a peer, not as a synthesis.
- **Enforced by** — A `recombine` phase in the workflow with a schema requiring `parent_a`, `parent_b`,
  and `inherited_from_each` — two non-empty lists. **`WISH`** as to whether the child is genuinely a
  recombination: no check can verify that. What *is* checkable is that both parents are named and both
  contributed a named trait.
- **Fails when** — The model averages the parents instead of combining them, producing something blander
  than either. Detect by measuring the child's archive distance (C3): a child closer to the centroid than
  both parents is an average and should be discarded.
- **Territories** — 08

**C7 · Anti-inbreeding rule — one variant per round must not descend from the leader** — *[INVENTED]*
- **Problem** — Iterative refinement is a hill climb, and after round two every candidate is a tweak of
  the round-one winner. The system cannot leave a local optimum it has already climbed.
- **How** — A structural rule on the round: at least one candidate is generated with **no knowledge of
  the current best** — fresh context, original brief only. If it wins, the hill was the wrong hill.
- **Enforced by** — The dispatch harness constructs one prompt from the original brief with the ranking
  omitted; a test asserts that prompt contains none of the leader's text. Cheap and fully mechanical.
- **Fails when** — On a genuinely convergent problem this wastes a slot every round. Make the slot count
  configurable per pack and let the founder's approved done-test decide whether it is worth it.
- **Territories** — 08, 13

**C8 · Diversity floor — a candidate set that is too similar is rejected before judging** — *[SOURCED,
  from this repo's own `/board-meeting` spec]*
- **Problem** — Six variations that are the same variation is the failure that produces "pick one of three
  directions", which the founder already rejected once on beeond. Nothing currently notices.
- **How** — Before any judging, compute pairwise distinctness across the candidate set. Below a threshold,
  the round **fails and regenerates with an explicit diversity instruction** rather than proceeding to
  pick a winner from clones. `/board-meeting`'s own spec already proposes failing its persona roster below
  40% inter-persona distinctness — this is that rule applied to artifacts.
- **Enforced by** — A distinctness function in `scripts/lib/` (trigram Jaccard is enough and is
  deterministic), called by the workflow before ranking, with the threshold declared in the pack. Rule 10:
  if distinctness is uncomputable for the artifact type (a binary, an image), the round returns
  `unresolved` and asks a human — it does not pass.
- **Fails when** — Textual distance is a poor proxy for conceptual distance. Two designs described in
  different words may be the same design. This measures the *description*, and should be labelled as
  doing so.
- **Territories** — 08, 04

**C9 · Deliberate constraint injection — a random handicap per variant** — *[SOURCED]*
- **Problem** — Unconstrained generation returns the median of the training distribution. Constraint is
  the cheapest known creativity intervention and the system applies none.
- **How** — Each variant draws a constraint card from a per-field deck: *no images · one colour · works at
  320px · explain it in nine words · no hero section · the whole thing is one sentence · it must load
  with JavaScript off*. The constraint is binding, not advisory, and is recorded with the artifact. Eno &
  Schmidt's Oblique Strategies is the canonical instance of the practice.
- **Enforced by** — A `constraints:` deck declared in the pack; the dispatch harness draws without
  replacement and appends to the prompt; the return schema requires `constraint_honoured: true` plus a
  one-line statement of how. Where the constraint is mechanically checkable (no images → grep the
  artifact for `<img`), check it and fail the variant if violated.
- **Fails when** — A constraint that is wrong for the brief wastes the slot. Accept it: that is the price,
  and the archive (C2) keeps the result anyway.
- **Territories** — 04, 08

**C10 · Asymmetric budgets — variants get different amounts of time** — *[INVENTED]*
- **Problem** — Equal budgets produce equal strategies. Everyone plans, everyone drafts, everyone polishes.
- **How** — One variant gets a tenth of the budget (forcing a single decisive idea), one gets triple
  (permitting a structure nobody would attempt at normal cost). The cheap one is often the sharpest, and
  it is nearly free.
- **Enforced by** — The per-dispatch cap that `maxTurns` already provides — it **binds when a dispatch
  names an `agentType`**, which is a registered claim in this repo (`c-maxturns-binds-when-agenttype-named`).
  Set different `maxTurns` per variant dispatch; the cap is real, not advisory.
- **Fails when** — The cheap variant times out mid-artifact and returns a fragment that the ranking treats
  as a bad idea rather than an unfinished one. Require a `complete: true|false` field and rank only
  complete artifacts, keeping fragments in the archive.
- **Territories** — 07, 13, 08

**C11 · Reverse brainstorming — build the worst version first** — *[SOURCED]*
- **Problem** — Asking for "good" anchors on the median. Asking for the *worst possible* version maps the
  boundary of the space, and the inversion of a specific bad idea is usually a specific good one.
- **How** — A cheap opening dispatch produces "the version that would make the founder close the tab in
  two seconds, and say exactly why each choice does that." The output is not shipped; it becomes the
  **no-go list** for the round, and the makers see it.
- **Enforced by** — A phase whose output feeds the maker prompt; a check that the maker prompt contains
  the no-go list. Whether the makers *avoided* the no-gos is **`WISH`** unless a no-go is mechanically
  checkable, in which case check it.
- **Fails when** — The anti-list becomes a checklist and the output becomes the absence of bad things
  rather than the presence of a good one. This is precisely how `design`'s lens became a critic's
  checklist. Cap the anti-list at five items.
- **Territories** — 04, 08

**C12 · TRIZ contradiction — name the trade-off and refuse it** — *[SOURCED, and the skill already exists
  here]*
- **Problem** — Most design decisions are recorded as trade-offs ("denser but less calm") and a trade-off
  is where thinking stops. TRIZ's whole premise is that the interesting solutions dissolve the
  contradiction rather than splitting it.
- **How** — Require every variant to state its central contradiction in the form *"we want X and Y, and X
  costs Y because Z"* — then produce one idea that gets both. `.claude/skills/thinking-triz/` exists in
  this repo and **is cited by zero of 18 agents**.
- **Enforced by** — A schema field `contradiction: {want_a, want_b, why_they_conflict, dissolution}` with
  all four required and non-placeholder; `schema-lint.js` already refuses placeholders and vague steps
  with no measurable anchor, so the predicate exists.
- **Fails when** — The model produces a fake dissolution that is really a trade-off in different words.
  Nothing detects this. Label it: the field forces the *attempt*, it does not verify the *success*.
- **Territories** — 04, 08

### 1b · Transfer — importing structure from somewhere else

**C13 · Analogy transplant with a forced-far source** — *[SOURCED]*
- **Problem** — Cross-domain transfer is where a large share of real invention comes from, and nothing in
  the system ever asks the question. Every prompt is about the field it is in.
- **How** — Each round, one variant is briefed with a randomly drawn **far domain**: *how would a Japanese
  railway signage system solve this? a hospital triage board? a chef's mise en place? a 1970s hi-fi
  faceplate? a submarine control room?* The variant must name what it took and what it dropped.
- **Enforced by** — A `transfer_sources:` deck in the pack; a return schema requiring `transfer_source`
  and `what_transferred`; a check that `transfer_source` is not in the same field as the brief (a declared
  field taxonomy in `FIELDS/` makes this mechanical).
- **Fails when** — Surface transfer — the design gets a railway *aesthetic* rather than a railway
  *information-hierarchy principle*. Require `what_transferred` to name a principle, and steer the deck
  toward domains whose principles are legible.
- **Territories** — 04, 08

**C14 · Precedent mining before making** — *[ANALOGY]*
- **Problem** — The ORIENT step in `STARTUP-OS.md` §5 asks "who does this best? pull references" and
  nothing checks it happened, or that the references are real.
- **How** — A bounded, sourced protocol: find the five best-in-class artifacts in the world for this
  exact job; for each, write the one non-obvious thing it does. The output is five sourced observations,
  not a summary. Only then does MAKE start.
- **Enforced by** — This is `sourcer`'s existing discipline — URL, access date, confidence, gaps named —
  and `claim-source` already fetches a URL and asserts the quote is present. Register the five
  observations as claims with `verified_by: source` and the round cannot proceed on invented references.
- **Fails when** — The best examples are behind a login, in a native app, or not on the web. The resolver
  correctly returns `unresolved`, and the honest response is to proceed with fewer sourced references and
  say so — not to fabricate.
- **Territories** — 04, 08, 03

**C15 · Taste transfer as rule extraction, not imitation** — *[ANALOGY]*
- **Problem** — Given references, a model copies them. Copying gives you a derivative artifact and teaches
  the system nothing reusable.
- **How** — The references are inputs to an *extraction* step whose output is a written rubric — "type
  scale is 1.25 not 1.333; every section has exactly one accent; motion is 120-180ms and only on enter" —
  and **the rubric is what the founder approves**. The maker then works from the rubric and never sees the
  references. Taste enters once, as §7 requires, but it enters as *rules the system now owns*.
- **Enforced by** — The rubric is a project-taste file; the maker's dispatch includes the rubric and
  excludes the reference images; a test asserts the maker prompt contains no reference URL. Rubric items
  that are numeric (spacing, timings, counts) are mechanically checkable against the artifact.
- **Fails when** — The extractable part of taste is the measurable part, and the measurable part is not
  the interesting part. This gets you correct proportions and not a point of view. Pair it with C13.
- **Territories** — 04, 08, 14

**C16 · Exemplars over rules in field knowledge** — *[SOURCED]*
- **Problem** — `FIELDS/` is designed to hold "how a field works", and the natural shape for that is a
  list of rules. Expertise research says experts do not run rules; they recognise cases.
- **How** — A field file's core is **three annotated exemplars** — a good one, a bad one, and a
  near-miss — each with what makes it what it is. Rules are derived from and subordinate to the
  exemplars. Klein's recognition-primed decision model is the underlying claim about how expertise
  actually operates.
- **Enforced by** — The `FIELDS/` schema requires `exemplars: [3]` with a source per exemplar, resolved by
  `claim-source`; a field file with rules and no exemplars fails lint. Same expiry as any other claim, so
  exemplars rot on schedule.
- **Fails when** — Three exemplars is a small sample and can encode a fashion as a principle. The claim
  expiry is the mitigation, and it is why this belongs in the ledger rather than in prose.
- **Territories** — 04, 05

### 1c · Selection — choosing without averaging

**C17 · Findings-only panel with deterministic aggregation** — *[SOURCED, this repo's §7]*
- **Problem** — If a panel returns findings and never a score, *something* must still pick a winner. §7
  states the rule and does not name the selector, and `design.js` filled that hole with a sum.
- **How** — Each judge returns findings with a severity, never a number. Selection is then **arithmetic
  over findings**: eliminate any candidate with a P1 finding; among survivors, prefer the one with the
  fewest distinct P2s; break ties by archive distance (C3), not by preference. The judges are finders;
  the selector is a function.
- **Enforced by** — A `select()` in `scripts/lib/` with unit tests, called by the workflow. Determinism is
  testable: the same findings always yield the same pick. `scripts/lib/judges.js` already exists as the
  home for this.
- **Fails when** — Every candidate has a P1 and the rule eliminates everything. That is the correct
  answer — the round produced nothing shippable — but the loop must handle it as `unresolved`, not
  degrade to "least bad".
- **Territories** — 08

**C18 · Deferred judgement — critique tools denied during divergence** — *[SOURCED]*
- **Problem** — Osborn's original insight, and the most-violated rule in every brainstorm: evaluation
  during generation kills generation. In an agent, the maker critiques itself inside the same context and
  regresses to safe.
- **How** — Separate divergence from convergence **in time and in capability**. During the generate phase,
  the maker's prompt carries no rubric, no scoring axes, no "quality bar" language, and — the mechanical
  part — the dispatch cannot reach a judging tool.
- **Enforced by** — The policy seam proposed in `STARTUP-OS.md` §8b: a handler at the `tool_call` phase
  that DENYs judge dispatch while the round is in `diverge` state. Without the seam, a lighter version:
  assert the maker prompt contains none of the rubric strings.
- **Fails when** — Real makers do micro-evaluate, and forbidding it entirely produces sloppy output. The
  constraint should be on *comparative* evaluation against siblings, not on the maker's own craft
  standard.
- **Territories** — 08, 09

**C19 · Identity and order stripped from the judge's input** — *[SOURCED]*
- **Problem** — `design.js` passes the full variation object to the judge, **including its `angle`
  label**. "bold / brand-forward" and "minimal / restraint-led" are not neutral strings; they prime the
  judgement before the artifact is read. Position bias and verbosity bias are documented and large.
- **How** — Serialise candidates with labels removed, order shuffled per judge, and lengths noted so a
  length-correlated verdict is visible. Run the swapped twin (C1). A judge whose verdict tracks position
  or length is reporting its bias, not the artifact.
- **Enforced by** — A one-line change at the critique dispatch in `.claude/workflows/design.js`, plus a
  test asserting the judge prompt contains no `angle` field and that the same candidate set is presented
  in ≥2 orders. Both mechanical.
- **Fails when** — Some artifacts are self-identifying (a design that is obviously "the minimal one").
  Blinding is partial and should be described as partial.
- **Territories** — 08

**C20 · The Braintrust rule — feedback has no authority** — *[SOURCED]*
- **Problem** — When a reviewer can mandate a change, the maker optimises for the reviewer and the work
  becomes a compromise. This is the same wall §7 builds with *"a persona may never be dispatched to
  produce"*, seen from the other side.
- **How** — Pixar's Braintrust: peers give candid, specific feedback and hold **no authority to prescribe
  a fix**; the director decides. Transposed: the panel returns findings, the *maker* decides which to act
  on, and records which it declined and why. The declined list is reviewed, not the fix.
- **Enforced by** — The maker's return schema gains `findings_declined: [{finding_id, reason}]`; the
  workflow refuses a return that neither addresses nor declines a P1. A finding silently dropped is the
  failure this catches, and it is mechanically detectable by set difference.
- **Fails when** — The maker declines everything with plausible reasons. Mitigate at the trust layer
  (§11): decline rates that correlate with later founder rework are a demotion signal.
- **Territories** — 08, 02, 12

**C21 · Founder preference pairs as a growing calibration set** — *[INVENTED]*
- **Problem** — §7 says taste enters once, at the top. But taste *deepens*, and every time the founder
  picks A over B that information is currently lost the moment the session ends.
- **How** — Every founder choice between two candidates writes a durable pair: the two artifacts, the
  pick, and — required — one sentence of why. The file is preference data, not prose. Future judges are
  given the N most relevant pairs as few-shot calibration before they judge.
- **Enforced by** — The balcony's approve/redirect surface writes the pair (it is the only place a founder
  choice happens); the judge dispatch injects pairs and a test asserts the injection. **`WISH`** on the
  "why" being accurate — a one-line rationalisation may not be the real reason, and nothing can check
  that.
- **Fails when** — Preference pairs from six months ago encode a taste the founder has moved past.
  Apply the ledger's expiry: pairs are claims about current taste and go stale like anything else.
- **Territories** — 05, 08, 14

**C22 · Second model family as a judge, fail-closed** — *[SOURCED]*
- **Problem** — A single model family judging its own family's output has a documented self-preference
  bias, and this repo carries the multi-family gap as accepted risk to 2026-11-17 while `gemini` sits
  installed at `~/.npm-global/bin/gemini`, never executed.
- **How** — GSD's pattern: shell out to an installed competitor CLI as a real subprocess for one seat on
  the panel. It returns findings, never a score, like every other seat. Union, not average — a second
  family is valuable precisely because it finds *different* things.
- **Enforced by** — `claim-judge-external` is already a registered, dispatchable resolver
  (`scripts/lib/resolvers.js:600`), and `scripts/ledger.test.mjs` already asserts registration and
  attachment. Rule 10 is the load-bearing part: exit 0 with empty stdout — the exact shape of Codex bug
  #19945 — must resolve `unresolved`, never pass. `ledger.test.mjs` already pins `unresolved` as distinct
  from `pass` for every resolver.
- **Fails when** — Vendor discontinuation. GSD's own ABANDONED list includes the Gemini CLI runtime,
  retired by the vendor. Treat the second family as a seat that can be empty, not a dependency.
- **Territories** — 08, 11

### 1d · Memory of what was already tried — the anti-repetition family

**C23 · The boredom detector — the same thing produced repeatedly** — *[INVENTED]*
- **Problem** — `budget-guard.js`'s stall ceiling detects *nothing being produced*. It cannot detect *the
  same thing being produced*, which reads as healthy progress: commits land, artifacts appear, tokens are
  spent, and the output is a monoculture.
- **How** — Compute the distance of each new artifact from the last N in the same field. If the rolling
  mean drops below a floor, the loop forces a novelty round (C3) before continuing. Two different
  failures, two different detectors: **stall = no artifact · boredom = no new artifact.**
- **Enforced by** — Reuse `scripts/lib/usage.js`'s `lastArtifactAt()` machinery, which already knows what
  a durable artifact on disk is, and add the distance function from C8. If distance is uncomputable, the
  detector reports `unresolved` and does not silently read as healthy.
- **Fails when** — Genuine convergence looks identical to boredom. A landing page iterated to its final
  form *should* stop moving. Gate the detector on whether the field's done-test has been met: converging
  toward a met done-test is good; converging without one is circling.
- **Territories** — 01, 08, 12

**C24 · The "we already tried that" tripwire** — *[INVENTED]*
- **Problem** — Auto-Co's anti-circling rule is one line of prose enforced by nothing; Ralph's is a
  hardcoded nudge string. Neither detects repetition. A third identical attempt is the clearest possible
  signal and nothing watches for it.
- **How** — Hash the *approach* — (goal id, primary tool, one-line method) — and store it. A second
  identical hash is allowed and logged. A third is refused unless the dispatch states a named difference,
  which is stored with it.
- **Enforced by** — A pre-dispatch check reading the event log; `scripts/lib/events.js` already writes
  typed events. The refusal is a hard stop at dispatch, not a nudge.
- **Fails when** — The hash is too coarse (everything collides, everything is refused) or too fine
  (nothing ever matches). Start coarse, log the false-positive rate, and tune with data rather than
  guessing.
- **Territories** — 01, 04, 12

**C25 · Dead-end retrieval before ORIENT** — *[ANALOGY]*
- **Problem** — Negative knowledge that exists but is not retrieved is negative knowledge that does not
  exist. §7 of this study covers *recording* failures; this covers *reaching* them at the moment of use.
- **How** — Before ORIENT, the harness greps the dead-end store by field and by tool and injects any hits
  into the prompt. Not a summary — the actual entries, capped by byte budget.
- **Enforced by** — The dispatch wrapper performs the retrieval, so it cannot be skipped by an agent; a
  test asserts that when a matching dead-end exists, the constructed prompt contains it. This is the same
  "the harness does it, not the agent" pattern that made the QA oracle trustworthy.
- **Fails when** — Keyword retrieval misses the relevant entry, which is the normal case. Accept partial
  recall and pair with C24, which catches the repeat even when retrieval missed.
- **Territories** — 04, 05, 07

### 1e · How human studios actually work

**C26 · The 60-second pitch as a required field** — *[ANALOGY]*
- **Problem** — Work that cannot be explained in a sentence is usually not finished, and the system
  currently returns structured artifacts with no obligation to argue for them.
- **How** — Every artifact carries `pitch:` — ≤ 60 words, addressed to the founder, saying what it is and
  why this one. If the pitch needs the artifact to make sense, the artifact has no idea in it.
- **Enforced by** — Schema field with a word cap, checkable; and it is the natural `say:` for the voice
  surface (§10), so one field serves two purposes.
- **Fails when** — Pitches become boilerplate. Mitigate by making the pitch the *only* thing the founder
  sees first — a bad pitch then costs the artifact its audience, which is the correct incentive.
- **Territories** — 10, 08

**C27 · Everyone speaks once before anyone speaks twice** — *[ANALOGY]*
- **Problem** — In a panel where outputs are visible, the first strong opinion anchors the rest. Metaswarm
  named this correctly as anchoring bias and solved it with fresh instances and zero cross-visibility.
- **How** — Round 1 is fully blind and parallel. Round 2 shows everyone everything and asks specifically
  *what changed your mind*. Round 3 escalates. `/board-meeting` already specifies exactly this, including
  `changed_mind_on` and `remaining_dissent` — and has never convened.
- **Enforced by** — The round-1 dispatch prompts must contain no peer output; assert it. The
  `changed_mind_on` field must be present and may be empty, but an empty one across all personas is a
  signal that round 2 did nothing and should be reported.
- **Fails when** — Round 2 produces false convergence — everyone updates toward the loudest. Preserving
  dissent explicitly (as the spec does) is the mitigation; a synthesis with zero preserved dissents from
  six personas is suspicious and should be flagged, not celebrated.
- **Territories** — 06, 08

**C28 · The rotating designated dissenter** — *[SOURCED]*
- **Problem** — Groupthink. Janis's remedies include an assigned critical evaluator, and the key word is
  *assigned* — dissent as a role, not a personality, so that dissenting is not costly.
- **How** — Each cycle, one worker is dispatched with the explicit and sole job of arguing the work should
  not ship. The role rotates by task id parity, so it is never the same seat. Its findings enter the union
  like any other.
- **Enforced by** — The dispatch harness assigns the role deterministically from the task id; a test
  asserts rotation. The dissenter's prompt is a different prompt, so it is checkable.
- **Fails when** — Ritual dissent — the role produces the same three objections every time. Measure: a
  dissenter whose findings are never acted on and never correlate with later rework is producing noise,
  and that is measurable at the trust layer (§11).
- **Territories** — 06, 08, 02

**C29 · Maker and editor are never the same context** — *[ANALOGY]*
- **Problem** — Self-editing in the same context is anchored by everything the maker just decided. §7's
  "fresh context per unit of work" says this for cost; it is also a quality rule.
- **How** — Two roles, always separate contexts: the maker produces, the editor cuts. The editor's brief
  is subtractive — *what would you remove* — not additive, because additive editors produce bloat and the
  measurable failure mode of LLM revision is length growth.
- **Enforced by** — Separate dispatches (structural); an editor return schema with `removed:` non-empty
  and `added:` empty or justified; and a mechanical length check — an edit pass that grew the artifact
  must say why.
- **Fails when** — Over-cutting into blandness. The length check runs both directions: report the delta,
  do not optimise it.
- **Territories** — 08, 02

**C30 · Ten then one, with the ten kept** — *[ANALOGY]*
- **Problem** — Studios make many and show one. The system makes four and keeps one. The discarded work is
  where the next round starts, and it is being deleted.
- **How** — Generation volume goes up (cheap, short, structural sketches rather than finished artifacts)
  and everything is retained in the archive (C2). Only the finalist gets finishing cost. The current
  design spends full cost on every variant and then throws most away, which is the worst of both.
- **Enforced by** — Two-stage budgets in the pack: `sketch_budget` and `finish_budget`, with `maxTurns`
  enforcing each (it binds when `agentType` is named). The archive write is a workflow step, not an
  agent's discretion.
- **Fails when** — Sketches are too thin to judge, so selection happens on descriptions rather than
  artifacts. Set the sketch bar at "enough to look at", and where sight is possible — `designer` holds
  `mcpServers: [playwright]` — render it.
- **Territories** — 08, 13, 07

### 1f · Making surprise measurable

**C31 · Novelty relative to this project's own archive** — *[INVENTED, on a sourced base]*
- **Problem** — "Surprising" is unmeasurable in the abstract and perfectly measurable relative to a
  corpus. The right corpus is not the internet; it is what this project has already shipped.
- **How** — Every shipped artifact enters a project corpus. A new artifact's novelty is its distance from
  that corpus. Report it beside quality; never sum them. A high-quality, zero-novelty artifact is a
  correct outcome for a maintenance move and a failure for a creative one — which is a **property of the
  move**, declared in advance.
- **Enforced by** — The distance function from C8; a `novelty_expected: high|low` field on the move that
  the founder or the priority function sets before dispatch, so the number is interpreted against a
  declared expectation rather than after the fact.
- **Fails when** — The corpus is small. With three artifacts, distance is noise. Rule 10: below a minimum
  corpus size, novelty is `unresolved`, not high.
- **Territories** — 08, 05, 12

**C32 · Interestingness as prediction error** — *[ANALOGY]*
- **Problem** — Novelty and quality are both weak proxies for the thing the founder actually reacts to,
  which is *"I did not expect that and it is right."*
- **How** — Before revealing a candidate, ask a separate model to predict what the candidate will be from
  the brief alone. The candidate's interestingness is how wrong the prediction was, conditional on the
  candidate being good. This is compression-progress/curiosity framing, applied as a measurement rather
  than a training signal.
- **Enforced by** — Two dispatches and a distance function — all machinery that exists. **`WISH`** on
  whether the number means anything: it is untested here and I am proposing it as an experiment with a
  cheap falsification (does it correlate with the founder's picks over 20 artifacts?).
- **Fails when** — The predictor is too good (everything is boring) or too bad (everything is
  interesting). Calibrate against the preference pairs in C21 before trusting it for anything.
- **Territories** — 08, 12

### 1g · Spending on exploration at all

**C33 · An explore budget that is not justified by outcome** — *[SOURCED]*
- **Problem** — Every mechanism in the system so far is tied to a goal. Exploration that must justify
  itself in advance is not exploration. Google's 20% time is the famous instance; the more rigorous
  framing is the explore/exploit split in bandit problems.
- **How** — A fixed fraction of the rolling window — say 10% — is reserved for moves with **no requested
  outcome**: try a tool nobody has used, make something nobody asked for, read a field nobody needs yet.
  Its output goes to the archive and to `FIELDS/`. It is never asked to pay off, and the reservation is
  spent or lost, never banked.
- **Enforced by** — `budget-guard.js` already computes `windowUsage()` account-wide over the rolling
  5-hour window, which is exactly the meter this needs. The reservation is a second threshold on the same
  meter: exploit work stops at 90%, explore work may use the last 10%.
- **Fails when** — At one-founder scale, 10% of a 5-hour window is small, and exploration that produces
  nothing looks like waste in every review. Pre-commit to the fraction so the decision is not re-litigated
  each time it produces nothing.
- **Territories** — 13, 01, 04

**C34 · Bandit allocation across creative directions** — *[SOURCED]*
- **Problem** — When several directions are live, attention should follow evidence, and "which direction
  is working" is a classic explore/exploit problem currently decided by whichever the founder mentioned
  last.
- **How** — Treat each direction as an arm; the reward is the world's verdict (§5), not a judge's opinion.
  Thompson sampling allocates the next move. Uncertainty is explicit, so a direction with one success and
  one trial is not confused with one with twenty.
- **Enforced by** — A deterministic allocator function with tests, reading the outcome log. Rule 10: an
  arm with no resolved outcomes has an *undefined* posterior, not a good one — it must be sampled as
  unknown, and if the outcome instrument is unreachable the allocator returns `unresolved` and asks.
- **Fails when** — Reward signal latency. Marketing outcomes take weeks; bandits assume fast feedback. At
  this volume the posterior is dominated by the prior for a long time, which means the mechanism mostly
  reports its own ignorance. That may still be more honest than the current answer.
- **Territories** — 01, 13, 08

**C35 · Option value as a tiebreak — prefer moves that create moves** — *[SOURCED]*
- **Problem** — Two moves of equal expected value are not equal if one opens three follow-on moves and the
  other closes the branch. Nothing currently sees this.
- **How** — Each move declares `unlocks:` — the goal ids that become available if it succeeds. Where the
  priority function ties, the move with more unlocks wins. `.claude/skills/thinking-reversibility/` and
  `thinking-opportunity-cost/` are both already in this repo, cited by nobody.
- **Enforced by** — `MISSIONS.yml` schema requires `unlocks:` (possibly empty) and every id must resolve
  to a real goal — the same dangling-reference lint that `schema-lint.js` already runs on playbook
  `review(lens=X)` references.
- **Fails when** — `unlocks:` is padded to win priority. It is authored by the same system that benefits.
  Mitigate by checking retrospectively: an unlock claimed and never taken up is recorded, and a pattern of
  those is a trust signal.
- **Territories** — 01, 13

**C36 · Cheap falsification first — the smallest thing that could kill the idea** — *[ANALOGY]*
- **Problem** — Creative work runs long before meeting reality. The most valuable move is often the
  cheapest one that could prove the direction wrong, and it is rarely the one chosen.
- **How** — Before a mission's first expensive move, one dispatch answers: *what is the cheapest artifact
  that would tell us this is wrong?* — and that is done first. This is pre-mortem plus the
  minimum-viable-test discipline, applied to the machine's own plans.
- **Enforced by** — A required `falsifier:` field on a mission with a cost estimate; the loop refuses to
  dispatch any move costing more than N× the falsifier's cost until the falsifier has an outcome.
  `.claude/skills/thinking-pre-mortem/` exists.
- **Fails when** — Some directions have no cheap falsifier and the rule blocks real work. Allow
  `falsifier: none` with a written reason, and count them — a project where every mission declares `none`
  has found a loophole, and the count makes that visible.
- **Territories** — 01, 08, 13

**C37 · Publish the losers to the founder, not just the winner** — *[INVENTED]*
- **Problem** — The founder's taste is the highest-value signal in the system and it is only ever applied
  to one candidate per round. Five artifacts they never see cost the same to produce and teach nothing.
- **How** — The balcony shows the round, not the pick: the winner plus the archive cells filled, each with
  its one-line pitch (C26). The founder can promote a loser with one action, and that promotion is the
  single most informative event the system can receive (it becomes a preference pair, C21).
- **Enforced by** — The balcony row schema carries the candidate set, not the winner; a check that a
  design round writes ≥2 candidates to the row. Cheap, and it is the difference between a mirror and a
  console.
- **Fails when** — Founder attention is the scarcest resource in the company and this spends it. Cap the
  shown set at three and order by archive distance so the three are genuinely different.
- **Territories** — 10, 08, 14

**C38 · A standing "what would be embarrassing to ship" check** — *[ANALOGY]*
- **Problem** — Taste failures are rarely subtle. They are placeholder text, lorem ipsum, a broken image,
  a stock photo, an em-dash where an en-dash belongs. Rule 6 in `CLAUDE.md` ("no placeholder UI") is
  explicitly `ADVISORY — no mechanism`.
- **How** — A deterministic embarrassment linter over the artifact: placeholder strings, TODOs, `#`
  hrefs, unreplaced template variables, duplicate section headings, image alt text equal to the filename,
  a colour not in the project palette. Not taste — hygiene, and hygiene is fully checkable.
- **Enforced by** — A script in the check suite, run against the artifact rather than the source tree.
  This converts an `ADVISORY` rule into an `ENFORCED` one, which is the repo's own standard for whether a
  rule exists.
- **Fails when** — It catches only the known list, and reads as a quality gate while checking hygiene.
  Name it precisely — it is a placeholder detector, not a taste judge, and it must never be reported as
  the latter.
- **Territories** — 08, 09

---

## 2 · What to do next — priority, and abandonment

*Never-named item 3: "Nothing decides what to do next — five goals, one window."*

This is the single most consequential gap, because everything else is downstream of it. Six competing
mechanisms, deliberately not reconciled.

**P1 · Deterministic priority function over declared fields** — *[ANALOGY]*
- **Problem** — Today the next move is whatever the founder mentioned most recently, and at 3am there is
  no founder. Any mechanism where a model *chooses* the next goal reintroduces the thing this repo
  distrusts most: an unauditable judgement in the control path.
- **How** — Every goal declares `deadline`, `blocks:` (goal ids depending on it), `reversibility`,
  `cost_estimate`, `evidence_of_demand`, `unlocks:`. The next move is **computed** by a pure function over
  those fields and printed with its arithmetic. The model's job is to fill the fields honestly, not to
  pick.
- **Enforced by** — `scripts/next.mjs` printing the pick and the working; a test asserting the same
  `MISSIONS.yml` always yields the same pick (determinism is the whole property). The classifier
  (`scripts/lib/classifier.js`) is the precedent — one file computes the tier of a path, and the repo has
  already paid to learn what happens when two implementations disagree.
- **Fails when** — Field-gaming. The system that fills `evidence_of_demand` benefits from a high value.
  Mitigate by sourcing that one field through `claim-source` so it cannot be asserted without a URL and a
  quote.
- **Territories** — 01, 13

**P2 · Theory of constraints — always work the bottleneck, refuse everything else** — *[SOURCED]*
- **Problem** — A priority function that ranks produces a *list*, and a list gets worked top-down while
  the actual blocker sits at position four. In a one-founder company the constraint is almost always the
  founder's attention, and almost nothing is scheduled around that fact.
- **How** — Identify one constraint. The loop may only dispatch moves that relieve it. Everything else is
  explicitly `not now` with a reason. `.claude/skills/thinking-theory-of-constraints/` exists in this repo
  and is cited by zero of 18 agents.
- **Enforced by** — `MISSIONS.yml` carries exactly one `constraint:` pointer; the loop refuses to dispatch
  a move whose goal does not name it, unless the founder pins an override that is logged with its reason
  (the same override shape `budget-guard.js` already implements — a written reason, logged with the
  numbers).
- **Fails when** — The constraint is misidentified and the whole company works the wrong thing with
  discipline. Mitigate with a forced re-identification on a fixed cadence, and by making the constraint a
  claim with an expiry.
- **Territories** — 01, 13, 14

**P3 · Weighted shortest job first — cost of delay over job size** — *[SOURCED]*
- **Problem** — Priority schemes that ignore *size* systematically starve small high-value work, which is
  most of what an agent company can actually finish in a window.
- **How** — WSJF: rank by (cost of delay ÷ job size). Cost of delay decomposes into user value, time
  criticality, and risk-reduction/opportunity-enablement. Both terms are estimates, which is the honest
  weakness; the ranking is still deterministic given them.
- **Enforced by** — Same as P1 — a pure function with a determinism test. The difference from P1 is *which
  fields*, and WSJF's are fewer and better understood.
- **Fails when** — It is a ratio of two guesses, and the ratio is sensitive to the denominator. A move
  estimated at "small" and actually large distorts the queue for as long as the estimate stands. Record
  actual against estimate and report the ratio — an estimator that is consistently 3× optimistic is a
  measurable fact.
- **Territories** — 01, 13

**P4 · Forecast tournament — personas predict, Brier scores accumulate** — *[SOURCED]*
- **Problem** — There is no way to tell which voice in the system is worth listening to about *what will
  work*, so all voices are weighted equally forever. This is the same defect as never-named item 10
  (worker trust), seen from the priority side.
- **How** — Before a mission starts, each persona forecasts a specific, resolvable proposition: *"the
  founder ships something from this mission within 14 days"* — as a probability. Outcomes resolve; Brier
  scores accumulate; forecasts from calibrated personas are shown first. Cowgill & Zitzewitz found
  corporate prediction markets beat internal expert forecasts by up to a 25% reduction in mean squared
  error at Google and Ford.
- **Enforced by** — Forecasts are claims with `valid_until` — the ledger's forced-expiry machinery is
  *exactly* a resolution deadline, and its three dispositions (refresh, deprecate, waive) already model
  what happens when one comes due. Brier is arithmetic over resolved claims and is fully deterministic.
- **Fails when** — Volume. Brier scores need dozens of resolutions to mean anything, and a one-founder
  company produces a handful of resolvable propositions a month. Honest framing: this is a mechanism that
  pays off in year two, and its year-one value is that it forces propositions to be *stated resolvably*,
  which is worth something on its own.
- **Territories** — 01, 02, 08, 12

**P5 · WIP limit of one at the mission level** — *[SOURCED]*
- **Problem** — Five goals and one window. Kanban's core finding is that throughput collapses long before
  utilisation reaches capacity, and the fix is a hard cap on work in progress, not better prioritisation.
- **How** — One mission in flight. A second may not open until the first reaches a terminal state
  (shipped, abandoned, or explicitly parked with a date). Parallelism lives *inside* a mission, across
  moves — which is where it is cheap — not across missions, where it fragments the founder.
- **Enforced by** — `MISSIONS.yml` schema refuses a second `state: in_flight`; the loop refuses to
  dispatch against a mission that is not the in-flight one. Trivially mechanical, and the hardest one to
  actually live with.
- **Fails when** — A mission blocks on something external for a week and the machine idles. Mitigate by
  making `blocked` a non-in-flight state (see §5), which frees the slot — and note that this makes the
  blocked/stalled distinction load-bearing rather than cosmetic.
- **Territories** — 01, 14, 13

**P6 · Sunk-cost kill rule — forced re-justification, not a budget cap** — *[ANALOGY]*
- **Problem** — Abandonment is named in territory 01 and has no mechanism. Nothing ever gets killed, so
  everything competes forever, and the priority function degrades as its input set grows.
- **How** — Two competing sub-mechanisms. **(a) Hard kill:** a goal that has consumed X% of a declared
  budget with no artifact surviving the world's verdict is auto-closed. **(b) Forced re-justification:**
  at the same trigger the goal is not killed but must be **re-argued from zero**, in a brief that may not
  reference prior investment — the sunk cost is made literally unmentionable. (b) is better where value is
  slow to appear; (a) is better where the founder will not read another brief.
- **Enforced by** — Budget consumption per goal is derivable from event rows carrying a task id (see
  §14/CT2). The re-justification brief's schema forbids fields naming prior spend, and a lint checks for
  spend language — crude, but it is the same class of check `schema-lint.js` already runs when it refuses
  a playbook stage carrying `steps:`.
- **Fails when** — (a) kills a slow winner; (b) produces a brief that launders the sunk cost into
  "momentum". Neither is safe alone, which is why both are here.
- **Territories** — 01, 13

**P7 · Commander's intent — the brief states purpose and end state, never method** — *[SOURCED]*
- **Problem** — A dispatched move either over-specifies (and the worker executes a playbook, which is the
  founder's original complaint) or under-specifies (and the worker guesses at the point). Mission command
  solved this: state the task, the purpose, and the desired end state; leave the method to the executor,
  because the executor is the one with the current information.
- **How** — Every move brief carries exactly four fields: **task** (what), **purpose** (why, one level up),
  **end state** (what is true when this is done), **constraints** (the boundaries, including tools and
  budget). No `method`, no `steps`. This is `STARTUP-OS.md`'s "constrain the exit, never the path" under
  its military name, and the military version is 200 years older and better tested.
- **Enforced by** — The brief schema, and **the exact predicate already in `schema-lint.js`** — it refuses
  a playbook stage carrying `steps:`, `how:`, `method:` or `implementation:`. Point the same rule at move
  briefs and the enforcement is already written.
- **Fails when** — Purpose is stated so abstractly ("delight the user") that it constrains nothing, and
  the worker improvises past the point. The end-state field is the guard: it must be a testable statement,
  and `schema-lint.js` already fails a vague step with no measurable anchor.
- **Territories** — 01, 06, 02

---

## 3 · Steering something already running

*Never-named item 4: "You cannot steer something already running."*

Five mechanisms. The important insight is that **redirect and annotate are different acts** and merging
them is why steering feels impossible.

**S1 · Two channels, not one: REDIRECT and ANNOTATE** — *[INVENTED]*
- **Problem** — "Steering" bundles two incompatible things: *stop doing that and do this instead* (which
  must interrupt) and *for future reference, warmer, less corporate* (which must not). Building one
  mechanism for both gets a mechanism that is too heavy for the second and too slow for the first.
- **How** — Two typed inputs with different latencies and different destinations. A **redirect** targets a
  task id, must be acknowledged, and changes the current move. An **annotation** targets a *field or
  project*, requires no acknowledgement, and lands in the taste file for the next artifact. The founder
  says which; the system never guesses.
- **Enforced by** — Two event kinds in `scripts/lib/events.js`; the balcony surfaces two verbs. A redirect
  with no task id is refused (this is CAST's lesson: no task id, no join, no accountability).
- **Fails when** — The founder uses the wrong one — types an annotation when they meant to stop the world.
  Mitigate at the surface: a redirect is one tap on the row it applies to, so the target is implicit.
- **Territories** — 10, 06, 01

**S2 · The steer file, polled at loop boundaries** — *[ANALOGY]*
- **Problem** — A worker running with fresh context has no inbox. Anything sent to it after dispatch is
  invisible unless something makes it visible.
- **How** — A `STEER.md` per task id. The worker loop reads it at every phase boundary — ORIENT → PROPOSE →
  MAKE → ATTACK → SEE — and treats its contents as the highest-priority instruction. The founder writes to
  it; the loop harness injects it; the worker cannot skip it because injection happens outside the worker.
- **Enforced by** — The dispatch/loop harness performs the read and the injection, and a test asserts a
  non-empty `STEER.md` appears in the constructed prompt at each boundary. "The harness does it, not the
  agent" is the pattern that made this repo's QA oracle trustworthy.
- **Fails when** — A worker inside a single long tool call reaches no boundary for twenty minutes. This
  mechanism has unbounded latency by construction, which is why S3 exists.
- **Territories** — 06, 10, 11

**S3 · The andon cord — the founder stops the line, it halts at the next station** — *[SOURCED]*
- **Problem** — Immediate hard kills lose work; polite polling has unbounded latency. Toyota's andon cord
  resolves exactly this trade-off in a physical factory: any worker may stop the line, and it stops at a
  defined point, not instantly and not eventually.
- **How** — A pull sets a flag. The worker halts at its next **durable artifact** — a commit, a written
  file, a claim event — and reports where it stopped, so the state is resumable. Not the next token; the
  next safe point.
- **Enforced by** — `scripts/lib/usage.js`'s `lastArtifactAt()` already defines "durable artifact on disk"
  for `budget-guard.js`'s stall ceiling, and **never the agent's own claim to be done**. The same
  definition is the correct halt point, which means the hard part is already built and named.
- **Fails when** — A worker that produces no durable artifact never reaches a station, and the cord is a
  wish for exactly the worker you most want to stop. Pair with S4.
- **Territories** — 09, 11, 10

**S4 · Dual-layer supervision — inner watchdog, outer daemon** — *[SOURCED]*
- **Problem** — Two different failures need two different mechanisms and this system has neither: a call
  that hangs, and a loop process that dies. Auto-Co ships both — an inner watchdog that SIGTERMs a hung
  call at 1800s, and an outer daemon that restarts the script if the script dies.
- **How** — Inner: a per-call timeout that kills and records. Outer: a supervisor that notices the loop is
  gone and restarts it from `BOARD.md`, which is why the baton must be durable and capped. Neither
  supervises the other's failure, which is the point.
- **Enforced by** — Both live outside the control plane, which matters here:
  `mission-control/test/crosscheck.test.ts` bans a shell call under `server/` at **zero exceptions**, so
  the supervisor cannot live there. A Claude-native scheduled task is the containment-preserving home
  (`STARTUP-OS.md` §8 open question 2).
- **Fails when** — Restart loops. A script that dies immediately on start gets restarted forever, burning
  the window. The outer daemon needs its own circuit breaker — and note that Auto-Co's `.gitignore` names
  a circuit breaker that **exists nowhere in its code**, so the reference implementation has this exact
  hole.
- **Territories** — 11, 09, 13

**S5 · Steering as a policy handler** — *[SOURCED]*
- **Problem** — Steering built as its own subsystem is a fifth mechanism doing what four others already
  do: observe an event, decide, and stop something.
- **How** — If the Omnigent policy seam is built (`PolicyEvent → PolicyResponse | None`, fired at six
  phases, first DENY short-circuits), steering is one handler at the `tool_call` phase that returns DENY
  with a message when a redirect targets the running task. No new subsystem, and every future control is
  the same shape.
- **Enforced by** — The seam itself, plus a test that a redirect event produces a DENY on the next tool
  call of the targeted task. **Conditional**: this mechanism does not exist unless the seam is built, and
  should be evaluated as part of that decision rather than separately.
- **Fails when** — The seam becomes the place everything is dumped, and a policy chain of forty handlers
  is a control plane nobody understands. Cap the handler count and require each to name what it enforces.
- **Territories** — 09, 06, 10

---

## 4 · The world's verdict

*Never-named item 5: "No verdict from the world — nothing asks did it work, only is it right."*

This is where the claim ledger gets the job `STARTUP-OS.md` §6 says it deserves. Five mechanisms.

**W1 · A `world` verifier on the ledger, fail-closed** — *[ANALOGY, on this repo's own machinery]*
- **Problem** — The ledger verifies `source`, `command`, and `judge`. All three ask *is this true about the
  artifact*. None asks *did the artifact do anything*. That is a missing verifier, not a missing
  subsystem.
- **How** — A fifth verifier: `verified_by: world`, whose evidence names an instrument and a threshold —
  the page got ≥1 visitor, the email got a reply, the deploy stayed up 24h, the video passed 100 views.
  The resolver queries the instrument. Rule 10 governs it absolutely: unreachable instrument →
  `unresolved`, never `pass`.
- **Enforced by** — `scripts/lib/resolvers.js` has the registration shape (five resolvers registered at
  lines 596-600) and `scripts/ledger.test.mjs` already pins `unresolved` as distinct from `pass` for every
  resolver. Forced expiry means a world-claim comes due and demands a disposition, which is exactly right:
  "it worked" rots faster than "it is true".
- **Fails when** — Every instrument is a third-party API with its own auth, and most will be unreachable
  most of the time. The system will report `unresolved` far more often than `pass`, which is honest and
  will feel like failure. Say that in advance.
- **Territories** — 08, 01, 03

**W2 · The evidence ladder — declare which rung, never report a lower rung as a higher one** — *[INVENTED]*
- **Problem** — "It works" is used for five different things with five different strengths, and the
  strongest available evidence gets reported as though it were the strongest possible.
- **How** — A fixed, ordered ladder declared per artifact type: **(0) it renders · (1) a stranger
  understands it in five seconds · (2) someone clicked · (3) someone came back · (4) someone paid.** Every
  done-test names its rung. A rung-0 result may never be phrased as a rung-2 claim, and the balcony row
  shows the rung.
- **Enforced by** — A `rung:` field on every done-test, validated against the declared ladder; the claim's
  `assert` string is generated from the rung so it cannot overstate. This is a type system for evidence,
  which is precisely the kind of thing this repo enforces well.
- **Fails when** — Most work will sit at rung 0-1 for a long time and the ladder will read as an
  indictment. That is the correct reading, and it is more useful than the current absence of one.
- **Territories** — 08, 12

**W3 · The shipped register with a mandatory follow-up date** — *[ANALOGY]*
- **Problem** — Artifacts leave the machine and are never revisited. Nothing in the system has a memory of
  *what is out there*, so nothing can ask how it did.
- **How** — Anything that leaves — published, sent, deployed — creates a register entry with a `check_on`
  date. On that date the loop must record an outcome. Crucially, **"no data" is an allowed outcome and is
  distinct from "not checked"** — conflating them is how this kind of register dies.
- **Enforced by** — A check in the suite that no register entry is past its `check_on` with no recorded
  disposition — structurally identical to `claim-freshness`, which already fails a claim once its date
  passes.
- **Fails when** — The founder becomes the instrument and does not answer. Then every entry resolves "no
  data", and the register measures the founder's availability rather than the world. Detect it: a run of
  consecutive "no data" is itself a finding.
- **Territories** — 08, 01, 14

**W4 · Counterfactual holdback, with a refusal below threshold** — *[SOURCED]*
- **Problem** — Any claim that a change *caused* an outcome, without a control, is unfalsifiable — and
  marketing is where this claim is made most often and checked least.
- **How** — Ship two versions where the medium allows it; measure both. Below a minimum sample, **refuse
  to claim a result at all** rather than reporting a direction. This is Rule 10 applied to marketing, and
  it is a place where the discipline this repo already has is unusually valuable, because the surrounding
  industry does not have it.
- **Enforced by** — A power calculation in the resolver: below the minimum detectable effect for the
  observed N, return `unresolved`. Deterministic arithmetic, testable.
- **Fails when** — At one-founder traffic volumes, nearly everything is below threshold, so the mechanism
  mostly says "cannot tell". Correct, and unsatisfying. Its real value is preventing confident nonsense in
  the other direction.
- **Territories** — 08, 13

**W5 · The founder's own usage as the oracle for internal work** — *[INVENTED]*
- **Problem** — For tools the founder uses themselves, the world's verdict is available, free, and
  mechanically observable, and nothing collects it.
- **How** — For any internal artifact, the done-test is *did the founder use it twice, unprompted, more
  than 48 hours apart*. That is detectable from event logs and file access without asking anyone anything.
  It is the strongest available signal for internal work and the cheapest.
- **Enforced by** — Event log query; the artifact's claim resolves from it. **Bounded**: it only works for
  artifacts whose use produces an event, which is a real and narrow subset. Name the subset rather than
  generalising the mechanism.
- **Fails when** — The founder uses something twice out of duty, or forgets a good thing exists. Usage is
  a proxy for value and should be reported as usage.
- **Territories** — 08, 12, 14

---

## 5 · Blocked vs stalled

*Never-named item 6: "Blocked and stalled look identical."*

The organising idea, and the cheapest good idea in this document: **blocked is a declaration, stalled is a
measurement.** One is authored by a worker; the other is computed about a worker. Once they come from
different sources they can never be confused, and no classifier is needed.

**B1 · Blocked is authored, stalled is computed** — *[INVENTED]*
- **Problem** — Today both present as "nothing is happening". A system that cannot tell them apart cannot
  respond to either: blocked needs a person, stalled needs a kill, and doing the wrong one is worse than
  doing nothing.
- **How** — **Blocked** is a worker declaration carrying a specific external dependency and a
  `clearable_by:` naming who or what clears it. **Stalled** is the stall ceiling firing: output tokens
  since the last durable artifact on disk. A worker cannot author "stalled" and the meter cannot author
  "blocked", so the two are structurally distinct.
- **Enforced by** — `budget-guard.js`'s stall ceiling already computes the second, against the last
  durable artifact and **never the agent's own claim to be done** — which is exactly the property that
  makes it unforgeable. The first is a `BOARD.md` schema field whose `clearable_by:` must resolve to a
  known clearer (the founder, a named credential, a named external party) or the declaration is refused.
- **Fails when** — A worker declares blocked to avoid being killed for stalling. Detect it: a block whose
  `clearable_by` is the founder, raised while the founder is available and never escalated, is a
  measurable pattern.
- **Territories** — 01, 09, 12

**B2 · Three states, not two: blocked · stuck · stalled** — *[INVENTED]*
- **Problem** — B1's two states leave out the interesting one. A worker that has tried four approaches and
  all four failed is neither blocked (nothing external is missing) nor stalled (it is producing
  furiously). It needs a *different approach*, which is a third response.
- **How** — **Blocked** = external dependency, needs a person. **Stuck** = N approaches attempted, all
  failed, needs a different method or a council. **Stalled** = no artifact and no declaration, needs a
  kill. Each has one response and they are not interchangeable.
- **Enforced by** — Stuck is derivable from the attempt hashes in C24 — N distinct approaches against one
  goal with no passing done-test. Deterministic, and it reuses machinery proposed for anti-circling.
- **Fails when** — The boundary between stuck and stalled is a threshold, and thresholds are wrong at the
  edges. Report the underlying counts alongside the state so a human can see the near-miss.
- **Territories** — 01, 08, 12

**B3 · A block carries an expiry, and expiry forces a disposition** — *[SOURCED, this repo's Rule 9]*
- **Problem** — Blocks accumulate. A goal blocked in March is still blocked in September, and nobody
  decided anything — the block simply outlived attention. This is *exactly* the failure Rule 9 was written
  for, applied to a different object.
- **How** — A block with no `until:` is refused at write time. When it comes due, exactly one disposition
  is recorded: **cleared**, **escalated**, or **waived with a new deadline** — the same three the ledger
  already forces on claims, and a lapsed waiver fails harder than none.
- **Enforced by** — Reuse the freshness resolver's shape wholesale: `claim-freshness` already fails an
  item once its date passes, and the schema already refuses a `waive` with no `until`. This is a new
  object type through an existing mechanism, not a new mechanism.
- **Fails when** — Serial waiving. Each waiver is legitimate; the sequence is not. Count waivers per block
  and surface the count — three waivers on one block is a decision being avoided.
- **Territories** — 01, 09, 12

**B4 · The escalation ladder with maximum dwell times** — *[ANALOGY]*
- **Problem** — Escalation is currently "the Inbox", and the Inbox has been empty on every project ever.
  An escalation path with no time bound is a path nothing travels.
- **How** — Three rungs, each with a maximum dwell: **L1** the worker tries another approach (max: the
  stall ceiling) · **L2** the council convenes (max: one cycle) · **L3** the founder is woken (no max —
  it is their call). Exceeding a dwell **auto-promotes**; nothing waits at a rung indefinitely. Hospital
  rapid-response systems and on-call rotations both work this way, and both exist because "someone will
  notice" does not.
- **Enforced by** — The rung and its entry timestamp are event rows; a scheduled check promotes on expiry.
  Auto-promotion must be mechanical — if promotion requires a judgement, the ladder has the same failure
  as the empty Inbox.
- **Fails when** — Everything promotes to L3 and the founder is woken constantly, so they mute it, and the
  ladder is worse than nothing. The dwell times are the tuning surface and must be tuned against a
  measured interruption rate, not guessed.
- **Territories** — 01, 10, 06

**B5 · Blocked frees the mission slot** — *[ANALOGY]*
- **Problem** — P5's WIP limit of one is unliveable if a blocked mission holds the slot for a week. This is
  the standard kanban objection and it has a standard answer.
- **How** — `blocked` is not `in_flight`. A blocked mission is parked with its block's expiry (B3), the
  slot opens, and the mission returns to the queue when the block clears. Parking is not abandonment and
  is recorded differently.
- **Enforced by** — The `MISSIONS.yml` state machine: transitions are enumerated and a transition not in
  the table is refused. A state machine in data is checkable; a state machine in prose is not.
- **Fails when** — Everything gets parked to keep the slot free, and the company has nine parked missions
  and no work. Cap parked missions too, and make the cap visible.
- **Territories** — 01, 14

---

## 6 · Negative knowledge — what failed

*Never-named item 7: "Nothing records what failed."*

Five mechanisms. Note that the repo already holds an unusually good version of this instinct in prose —
the supersession blocks throughout `CLAUDE.md`, which record not just the correction but *what was
believed and why it was wrong*. The gap is that it is prose about the harness, not data about the work.

**N1 · `DEAD-ENDS/` — a file per failed approach** — *[SOURCED]*
- **Problem** — Every abandoned approach is re-attempted by the next worker with fresh context, because
  fresh context is exactly the property that erases it. Fresh context is right for quality and wrong for
  memory, and the resolution is to put the memory outside the context.
- **How** — GSD's `.out-of-scope/`, generalised: one file per dead end, carrying **what was tried · what
  happened · why it failed · what would make it worth retrying**. That last field is the one that matters
  — it converts a dead end from a prohibition into a dated hypothesis.
- **Enforced by** — The loop refuses to close a move with `outcome: abandoned|failed` and no dead-end
  file — mechanically checkable at close, in the same way the documentation gate already refuses a task
  with no session file.
- **Fails when** — Dead-end files accumulate into an unreadable pile that nothing retrieves. Pair with
  C25 (retrieval before ORIENT) and X-series retirement, or this becomes another built-and-never-read
  store.
- **Territories** — 04, 05, 12

**N2 · Negative claims — "X does not work because Y", with a reproducing command** — *[ANALOGY on this
  repo's ledger]*
- **Problem** — A dead end recorded as prose is unfalsifiable and permanent. The world moves: a vendor
  ships the missing feature, a model gets better, and the prohibition outlives its cause. Some of this
  repo's own accepted risks are exactly this shape.
- **How** — Register the failure as a claim: `assert: "the sandbox denies loopback bind()"`,
  `verified_by: command`, evidence naming the command that reproduces it, plus `valid_until`. Expiry then
  forces the useful question on a schedule: **does this still fail?**
- **Enforced by** — `claim-command` is already a registered resolver; `claim-freshness` already fails a
  claim once the date passes. The measured `check:mc` finding in `CLAUDE.md` is a worked example of a
  negative claim that *should* be in this shape and is currently prose.
- **Fails when** — Many failures are not reproducible by a command (a design direction the founder
  disliked). Those belong in N1, and the split between the two stores must be by *whether a command
  exists*, not by importance.
- **Territories** — 04, 08, 12

**N3 · Help requests carry "what I tried", so negative knowledge is a by-product** — *[INVENTED]*
- **Problem** — Recording failures as a separate act is a tax, and taxed acts are skipped. The moment a
  worker is *most* motivated to write down what failed is when it is asking for help.
- **How** — A help request is a typed event with a required `tried:` list — each entry an approach and its
  outcome. The request is refused without it. The list is simultaneously the help request's context and a
  dead-end record, written at the one moment the worker wants to write it.
- **Enforced by** — The event schema refuses the emission; `scripts/lib/events.js` already writes typed
  events, and a typed event with a required field is a solved problem here.
- **Fails when** — `tried:` becomes three words of boilerplate. Require each entry to name a tool or a
  method and an observed result — checkable at the shape level, not the truth level. Say which.
- **Territories** — 06, 04, 12

**N4 · Failure taxonomy with counts, driving where mechanism gets built** — *[SOURCED]*
- **Problem** — Post-mortems produce narratives, and narratives do not aggregate. Aviation's safety record
  comes substantially from categorising every event and letting the *counts* decide where money goes.
- **How** — Every failure is tagged from a fixed, small taxonomy (wrong target · missing capability ·
  unclear brief · hallucinated fact · budget exhausted · external block · tooling defect). Monthly, the
  counts are printed. Mechanism gets built where the counts are, not where the last incident was.
- **Enforced by** — A closed enum in the event schema — an unlisted tag is refused, which is what makes the
  counts comparable — plus a report script. The enum's *closedness* is the mechanism; an open tag field
  produces 40 singleton categories and no signal.
- **Fails when** — The taxonomy is wrong and the interesting failures all land in "other". Watch the
  "other" rate: above ~15% the taxonomy needs revision, and that revision should be dated and recorded.
- **Territories** — 12, 08

**N5 · Supersession as a data operation, not a prose convention** — *[SOURCED, from this repo]*
- **Problem** — This repo's supersession blocks are genuinely excellent and entirely manual. They exist in
  `CLAUDE.md` because a human wrote them; nothing produces one, nothing checks one exists after a
  correction, and none of them are queryable.
- **How** — When a stored belief is corrected, the correction writes a superseded record: the old claim,
  the new claim, the evidence that moved it, and the date. The old is never deleted — the repo's own rule
  that "a cap on the lifetime total of an append-only decision log is a mechanism for losing decisions"
  applies to beliefs too.
- **Enforced by** — `scripts/evict-memory.mjs` already implements exactly this discipline for
  `DECISIONS.md`: four mechanised rules, a stub left under the original heading so citations still
  resolve, and a check that no byte was lost. Point the same tool at field knowledge.
- **Fails when** — Volume. Every belief update writing a record produces a large store. That is what the
  archive rotation (`DECISIONS_ARCHIVE_002.md`, `_003.md`, …) already exists to handle — cap what one
  reader must load, never the lifetime total.
- **Territories** — 05, 04, 12

---

## 7 · Worldly risk tiers

*Never-named item 8: "Worldly risk has no tier — send / publish / pay / contact a person."*

The current classifier tiers by **what code is touched**. Everything dangerous about an autonomous company
is invisible to that axis: sending an email touches no risky path and cannot be reverted. Six mechanisms.

**R1 · REACH as a second axis on the one classifier** — *[ANALOGY]*
- **Problem** — `scripts/lib/classifier.js` computes tier from paths. An agent that publishes a post,
  emails a stranger, or charges a card does so through paths the classifier reads as `trivial`.
- **How** — A second declared axis: `reach: internal · outbound-private · outbound-public · financial ·
  human-contact`. The effective tier is the **max** of the code axis and the reach axis. One function, two
  inputs, one answer.
- **Enforced by** — Extend `scripts/lib/classifier.js` and add rows to `.claude/qa-tier-floor.yml` — do
  **not** write a second classifier. This repo has already paid for that lesson: `qa-lead-pass.yml` once
  computed a second, stricter answer, and `scripts/classify.mjs`'s own header warns *"Two implementations
  of risk classification will disagree, and you find out during the incident."*
- **Fails when** — Reach must be *declared* by whoever wires the tool, and a mis-declared tool is invisible
  until it fires. Mitigate with R2, which attaches reach to the grant rather than to the call site.
- **Territories** — 09, 03, 02

**R2 · Reversibility and blast radius declared on the tool grant, not the call** — *[INVENTED]*
- **Problem** — Reach declared per action is declared hundreds of times and will be wrong somewhere.
  Declared per *tool*, it is declared once, at the moment a capability enters the system — which is also
  the moment someone is thinking about it.
- **How** — Every grant in a pack carries `reversible: yes|no|partial` and `blast_radius: self · founder ·
  stranger · public`. A pack granting a tool with no declaration is invalid. The action's reach is then
  derived from the tools it used, not asserted.
- **Enforced by** — `schema-lint.js` already fails an agent declaring `mcpServers` that no configuration
  backs — the identical shape: fail a grant carrying no risk declaration. And the precedent for narrow,
  named capability already exists: `sourcer` holds `mcpServers: [claim-append]` while its `tools:` line
  carries **no `Write` and no `Edit`**.
- **Fails when** — A tool's blast radius depends on its arguments (a browser can read a page or submit a
  form). Declare the *maximum* radius for the grant, and split genuinely dual-purpose tools into two
  grants where the MCP allows it.
- **Territories** — 09, 03, 02

**R3 · Two-tier gates — `blocking` and `blocking-human`** — *[SOURCED]*
- **Problem** — "How autonomous should it be at 3am" is currently a policy question answered by a
  judgement, and judgements at 3am are made by a model with no supervision.
- **How** — GSD's distinction: some gates the machine may clear on its own, and a second class it
  **structurally cannot**, however autonomous the mode. Anything with `blast_radius: stranger|public` or
  `reversible: no` is `blocking-human` by type, not by policy — so no configuration, mode, or reasoning
  chain can clear it.
- **Enforced by** — `.claude/gates.yml` already declares gates in two kinds, `command` and `human`, and
  `scripts/check-gates.mjs` resolves them; `scripts/gates.test.mjs` is a blocking assertion. A `human`
  gate has no `run:` and **writing one is refused** — which is precisely the structural impossibility this
  needs, already built.
- **Fails when** — Overnight work stops constantly at human gates and the loop's autonomy is theatre. That
  is the correct trade and should be measured: count human-gate stops per night, and if it is high, the
  answer is to change *what the loop attempts overnight*, not to weaken the gate.
- **Territories** — 09, 01, 11

**R4 · Dry-run by default on every outbound tool** — *[SOURCED, from this repo's #116]*
- **Problem** — The dangerous version and the safe version of an outbound action differ by one flag, and
  the failure direction is asymmetric: a missed send costs nothing, a wrong send cannot be recalled.
- **How** — Every outbound tool wrapper produces the artifact by default — the draft email, the unpublished
  post, the unsigned invoice — and requires a **separate, explicit** send call carrying the artifact's
  hash. The default is always the reversible branch.
- **Enforced by** — The wrapper, plus the lesson already learned in `scripts/verdict.mjs` (#116): an
  unknown flag must **refuse** rather than perform the non-dry action. A mistyped `--dry-run` was
  previously dropped in silence and the real thing ran. Same defect class, same cure.
- **Fails when** — Two-step sending doubles the cost of every legitimate send and workers learn to chain
  both calls immediately. Mitigate by requiring the hash — the second call must reference an artifact that
  already exists on disk, so at minimum the artifact was written and is inspectable.
- **Territories** — 09, 03

**R5 · Absolute rate limits on outbound action, independent of reasoning** — *[ANALOGY]*
- **Problem** — Every reasoning-based control can be reasoned around. A cap that binds regardless of
  argument is the only control that survives a persuasive plan, and a runaway loop's damage is
  proportional to its rate.
- **How** — Hard ceilings: N outbound-public actions per hour, M per day, per project. Not advisory, not
  model-visible in a way it can argue with — enforced at the wrapper. Exceeding requires a founder
  override that is logged with the numbers.
- **Enforced by** — Counting from the event log at the wrapper; `budget-guard.js` is the working precedent
  for a ceiling with a safelist and a logged, reasoned override.
- **Fails when** — A legitimate burst (a launch day) is throttled. The override exists for that, and the
  log of overrides is itself useful data about whether the cap is set right.
- **Territories** — 09, 13

**R6 · A named-human register — no contact with anyone not on it** — *[INVENTED]*
- **Problem** — The worst available autonomous mistake is contacting a real person wrongly: the wrong
  person, the wrong tone, a fabricated premise. It is unrecoverable in a way no code change is, and
  nothing currently stands between the system and anyone's inbox.
- **How** — An approved-contacts file. Any action addressing a human requires the recipient to be present,
  with a note on the relationship. Anyone absent → refuse and escalate; adding someone is a founder act.
- **Enforced by** — The outbound wrapper checks the register before the send call and refuses otherwise.
  Deterministic string matching, fail-closed by construction: an unparseable recipient is not on the list.
- **Fails when** — Replies. Answering an inbound message means contacting someone who was never
  pre-approved. Allow reply-in-thread as a distinct, narrower permission — never a general send — and
  treat first contact as the thing that requires approval.
- **Territories** — 09, 14, 03

---

## 8 · Voice as a first-class surface

*Never-named item 9: "The founder talks to this system by voice; nothing is designed for that."*

Voice is not a skin on a dashboard. It is a **linear, interruptible, low-bandwidth channel with no
scanning**, and designing for it changes the data, not the presentation.

**V1 · Every row carries a spoken form** — *[INVENTED]*
- **Problem** — A balcony row is currently a record for reading: paths, hashes, ids. Read aloud it is
  unusable, so a voice surface built on it must *generate* speech from data, which means a model in the
  path and a chance to be wrong about what happened.
- **How** — Every row carries `say:` — one sentence, ≤ 15 words, no paths, no hashes, no identifiers.
  Written at emission by the thing that knows what happened. Voice then reads a field; it does not
  summarise a record.
- **Enforced by** — Row schema requires it; a lint fails a `say:` containing `/`, a 7+ hex run, or more
  than 15 words. All mechanical. And it improves the written surface too — a row that cannot be said in
  15 words is usually a row that bundles two events.
- **Fails when** — `say:` becomes generic ("a task completed"). Require it to name the artifact or the
  goal — checkable as a substring against the row's own fields.
- **Territories** — 10, 06

**V2 · The briefing is a generated document with a fixed shape** — *[ANALOGY]*
- **Problem** — Voice cannot scan seven views. It needs a narrative with a known order so the listener can
  predict what comes next and stop listening when they have what they need.
- **How** — Four sections, always, always in this order: **what changed · what is blocked · what needs
  you · what I would do next**. Each may be "nothing", and "nothing" is spoken. Fixed order is what makes
  it skimmable by ear.
- **Enforced by** — A generator with a byte-budget ratchet (the GSD steal — forced progressive disclosure
  under a shrinking cap) and a test that all four sections are present, with explicit "nothing" allowed.
  A briefing missing a section fails rather than silently shortening.
- **Fails when** — "What I would do next" is the section that needs the priority function (§2). Without
  one it is a model's opinion wearing a system's voice, and it should be labelled as an opinion until P1
  or P2 exists.
- **Territories** — 10, 01

**V3 · Barge-in and progressive disclosure — the briefing is a tree** — *[ANALOGY]*
- **Problem** — A three-minute monologue is unusable. The founder needs to interrupt with "skip", "more on
  that", "do it" — which means the briefing cannot be a script.
- **How** — Headline per item, detail on demand, one level deeper on request. This is the same two-tier
  discovery pattern that took skills lookup from ~15,000 tokens to ~1,070 in this repo, and the same one
  that fixed `session-start.js` from 27,069 bytes to 2,941.
- **Enforced by** — The briefing generator emits a tree, not a string; a test asserts every node has both
  a headline and an expandable body. **`WISH`** on the barge-in transport itself — that is a surface
  capability, not a mechanism, and belongs to whoever owns the balcony build.
- **Fails when** — Trees are harder to author than scripts, and the headline layer degrades into a table
  of contents. Require the headline layer alone to be a complete, if shallow, briefing.
- **Territories** — 10, 07

**V4 · Confirm-back — a voice instruction is read back before it binds** — *[SOURCED]*
- **Problem** — Voice transcription errors are silent and confident, and a voice channel that can dispatch
  work is a channel where a misheard word becomes an action. Aviation solved this decades ago with
  readback/hearback, and CRM training formalises the challenge.
- **How** — Any voice-originated instruction is restated **in the system's own words** — not the
  transcript — and requires confirmation before it binds. The restatement in different words is the point:
  echoing the transcript confirms the transcription, not the intent.
- **Enforced by** — A voice-originated move carries `confirmed: true` or the loop refuses to dispatch it.
  Fail-closed, and a direct application of Rule 10: unconfirmed intent is unmeasured intent, and a
  resolver never passes what it could not check.
- **Fails when** — Confirmation friction makes voice slower than typing for anything non-trivial. Scope it
  by reach (§7): confirm-back is required for anything above `internal`, and skipped below it.
- **Territories** — 10, 09, 06

**V5 · A phone-shaped balcony with exactly three verbs** — *[ANALOGY]*
- **Problem** — Attempting parity between the phone and the terminal produces a surface that is bad at
  both. The escalation Inbox has been empty on every project ever, which is evidence that a
  richer-but-unused surface is worth less than a poorer-but-used one.
- **How** — On the phone: **approve · redirect · stop**. Nothing else. Anything richer queues for a
  keyboard. Three verbs is what fits under a thumb at a traffic light, and it covers the founder's actual
  overnight role.
- **Enforced by** — The row schema exposes exactly three actions to that surface; anything else is
  rendered read-only. **`WISH`** on whether three is the right number — that is a founder judgement, and
  the mechanism is that the number is *declared and small*, not what it is.
- **Fails when** — "Redirect" needs typing, which is the thing phones are worst at. Mitigate by making
  redirect a *choice among candidates* wherever possible (C37 already surfaces the losers), so the common
  case is a tap.
- **Territories** — 10, 14

---

## 9 · Worker trust

*Never-named item 10: "Every worker is trusted equally, forever."*

**T1 · Trust is computed from outcomes, never declared** — *[ANALOGY]*
- **Problem** — A declared trust level is a field somebody sets, and the entity that benefits from a high
  value is in the loop. Any trust system where trust can be asserted is a trust system that will be
  asserted.
- **How** — Three levels: `supervised` (every outbound action asks) · `trusted` (asks only at
  `blocking-human`) · `autonomous` (asks only on reach). Promotion requires **N consecutive moves whose
  artifacts survived the world's verdict and were not reverted**, computed from the event log at dispatch
  time. There is no field to edit.
- **Enforced by** — Recomputation at every dispatch, so a hand-edited value is simply overwritten; a test
  asserts that a tampered stored level does not change the effective level. The event log with real task
  ids (CT2) is the prerequisite.
- **Fails when** — There is no outcome signal yet (§4 is unbuilt), so N is never reached and everything
  stays `supervised` forever. Honest sequencing: trust is downstream of the world's verdict and cannot be
  built first.
- **Territories** — 02, 08, 09

**T2 · Trust is per (pack × field), not per worker** — *[SOURCED]*
- **Problem** — A worker excellent at landing pages is not thereby trustworthy on pricing. A single trust
  scalar per worker transfers competence across domains where it does not transfer, which is the exact
  failure mode `thinking-circle-of-competence` describes — and that skill is cited by zero of 18 agents.
- **How** — The trust key is the pair. `video-short × short-form-video` can be `autonomous` while
  `video-short × regulated-claims` is `supervised`. The pack declares which fields it has standing in;
  everything else starts at `supervised`.
- **Enforced by** — The key is (pack id, field id) in the event log; the lookup fails closed to
  `supervised` on an unknown pair, which is the correct default and requires no special case.
- **Fails when** — Sparsity. Many pairs will have too few observations to promote, and the matrix mostly
  reads `supervised`. That is accurate, and the alternative — a single scalar — is not.
- **Territories** — 02, 04

**T3 · Judges have track records too** — *[SOURCED]*
- **Problem** — A judge that says PASS to everything is indistinguishable from a judge that is right,
  until the founder reworks the output. Nothing measures agreement between a judge and the eventual
  outcome.
- **How** — For each judge seat, record its verdict and later the founder's disposition. A seat whose
  findings are never acted on, or whose PASSes are systematically reworked, loses its seat. Brier-style
  calibration on judges rather than on work — and the same machinery as P4.
- **Enforced by** — Verdicts are already records: `.qa/verdicts/` holds 50 files, every one
  `verified: PASS`, each sha256-bound to a diff. Joining verdicts to later rework is a query, given a task
  id. **Note the standing caveat**: all 50 are author-recorded, single-agent, single-family, so the
  current corpus can measure agreement with the founder but not inter-judge agreement.
- **Fails when** — Rework is a noisy signal — the founder reworks good things for taste reasons. Use it as
  a finding about a judge, never as an automatic demotion.
- **Territories** — 08, 02, 12

**T4 · Shadow apprenticeship for a new pack** — *[SOURCED, this repo's idiom]*
- **Problem** — A new pack's first real dispatch is also its first test, on real work, with real reach.
- **How** — A new pack runs in **shadow**: it receives real moves, produces real artifacts, and ships
  nothing. Its output is compared to the incumbent's. It graduates on a record, not on an argument.
  Shadow mode is already this repo's answer for exactly this question — claim failures are computed,
  written as `claim.would_block`, and do not fail the build, *so the friction is measured rather than
  guessed*.
- **Enforced by** — A `shadow: true` flag on the pack that the dispatch wrapper honours by discarding the
  artifact and recording the comparison; a test that a shadow pack's artifact never reaches a publish
  path. The exceptions rule carries over too: some things block from day one because `git revert` does not
  undo them, and a shadow pack must never hold those grants at all.
- **Fails when** — Doubled cost for every shadowed move. Shadow selectively — one move in five — and say
  the sample is small.
- **Territories** — 02, 12, 13

**T5 · Demotion on incident, re-earned not restored** — *[ANALOGY]*
- **Problem** — Trust that only rises is a ratchet toward the first serious mistake. Every high-reliability
  domain that grants graduated authority also has a mechanism for taking it back, and it is automatic
  rather than discretionary.
- **How** — Any incident above a severity threshold drops the pair (T2) to `supervised` immediately. The
  level is re-earned through the same counting rule as promotion; there is no restore, no appeal that
  skips the count.
- **Enforced by** — Same recomputation as T1 — an incident event resets the consecutive-success counter,
  so demotion needs no separate code path. That is the elegance: one counter, both directions.
- **Fails when** — A single anomalous incident costs weeks of accumulated standing, and the system becomes
  timid. Tune N, and record the cost of demotions so the tuning has data.
- **Territories** — 02, 09, 12

**T6 · The competing position: no trust at all, only reach** — *[INVENTED]*
- **Problem** — Every mechanism above adds a reputation surface, and reputation is state that can drift,
  be gamed, or be wrong. It is worth stating the simpler alternative rather than assuming trust is
  necessary.
- **How** — Never trust a worker. Gate purely on what the *action* touches (§7). A publish is
  `blocking-human` whether the pack has done it three hundred times or never. Fewer moving parts, nothing
  to game, no state to maintain — and the system never gets faster.
- **Enforced by** — R1-R3 alone, with no T-series machinery at all.
- **Fails when** — The founder is a bottleneck forever, which is the thing the whole company exists to
  avoid. The real question for the filtering conversation is whether autonomy should grow through *trust*
  (T1) or through *narrowing reach* (R2) — and those are genuinely different bets.
- **Territories** — 02, 09

---

## 10 · Retirement

*Never-named item 11: "Nothing ever retires."* This section directly attacks what
`STARTUP-OS.md` §8b calls the field's endemic failure mode, present in four of four studied systems.

**X1 · The birth certificate — nothing is created without a caller in the same diff** — *[INVENTED]*
- **Problem** — Six of ten things the founder asked for already existed and were connected to nothing.
  Four of four studied systems have the same defect. Every existing cure is a *detector* run after the
  fact; nothing prevents the creation.
- **How** — A new pack, skill, workflow, persona, or command may not merge unless the same diff contains
  a **caller** — a dispatch site, a registration, a command that invokes it. Not a plan to wire it; the
  wire. The diff is the unit because the diff is what CI can see.
- **Enforced by** — A CI check on the diff: for each added artifact of a governed type, require a
  reference from a governed caller set. `scripts/check-registration.mjs` already implements the hard half
  — the dead-path check — and `PS-WORKFLOW-CONTAINMENT` shows the repo already knows how to write a
  structural reachability rule.
- **Fails when** — A caller can be a stub that satisfies the check and invokes nothing meaningful. That is
  a real hole and X2 is what closes it — the caller must eventually *fire*, not merely exist.
- **Territories** — 12, 02, 04

**X2 · Last-use telemetry — the retirement trigger is zero calls, not an opinion** — *[ANALOGY]*
- **Problem** — "Is this still used?" is currently answerable only by grep, which finds references and not
  executions. A skill referenced by a file nobody runs looks alive.
- **How** — Every skill load, pack dispatch, persona convening and workflow run writes an event. A monthly
  report lists everything with **zero events in 90 days**. That list is the retirement queue, and it is
  computed, not proposed.
- **Enforced by** — `scripts/lib/events.js` already writes typed events, and the report is a query. This
  is the mechanism the repo's own meta-finding demands and does not have — it *diagnoses* the disease
  better than anyone studied and has not taken its own medicine.
- **Fails when** — Instrumenting every load is itself an unwired change if the loads are not instrumented
  at a chokepoint. Instrument the dispatch harness, not each artifact.
- **Territories** — 12, 04, 02

**X3 · Sunset by default — everything carries a `retire_on`** — *[SOURCED, this repo's Rule 9]*
- **Problem** — The burden currently sits on whoever proposes deletion, and nobody proposes deletion.
  Inverting the burden is what made the claim ledger work, and packs, skills and personas rot the same
  way claims do.
- **How** — Every governed artifact carries `retire_on`. When it comes due, exactly one disposition:
  **renew** (with evidence of use), **retire**, or **waive with a new date**. `retire_on: never` is
  allowed — Lindy is real and `.claude/skills/thinking-lindy-effect/` exists here — but requires a written
  reason, reviewed on the same cadence.
- **Enforced by** — `claim-freshness`'s exact shape: fails once the date passes, refuses a waiver with no
  `until`, and a **lapsed waiver fails harder than none**. New object type, existing mechanism.
- **Fails when** — Mass expiry on a quiet month produces fifty simultaneous decisions and everything is
  waived in a batch. Stagger the dates at creation.
- **Territories** — 12, 04, 09

**X4 · A ratchet — no new pack without a retired one** — *[ANALOGY]*
- **Problem** — Rosters grow monotonically. This repo went 26 agents → 7 engines in one correction; the
  correction was right and the growth that made it necessary was never resisted at the margin.
- **How** — Above a declared ceiling, adding a pack requires retiring one. The ceiling is a number in a
  config file, raised deliberately and visibly rather than drifted past.
- **Enforced by** — A count check in the suite against a declared ceiling — the same shape as the
  byte-budget ratchet, applied to a roster.
- **Fails when** — A genuinely needed pack is blocked by an arbitrary number, and the ceiling gets raised
  reflexively, which is fine — the point is that raising it is an *act* someone performs, not a drift
  nobody notices.
- **Territories** — 02, 14

**X5 · Retirement is archival, never deletion** — *[SOURCED, this repo]*
- **Problem** — Deletion loses the reasoning, and the reasoning is what stops the same thing being rebuilt
  in six months.
- **How** — A retired artifact moves to an archive with its retirement reason and its last-use date, and a
  stub remains where it was so references still resolve. GSD's `.out-of-scope/` is the same instinct
  applied earlier in the cycle.
- **Enforced by** — `scripts/evict-memory.mjs` already does exactly this for decisions: **every archival
  leaves a stub under the original heading, so a citation by date or by title still resolves**, and the
  tool checks that no byte was lost. Reuse the pattern rather than inventing one.
- **Fails when** — The archive grows without bound. Volume rotation is already solved here — the cap
  bounds what one reader must load, never the lifetime total.
- **Territories** — 12, 05

---

## 11 · The system explaining itself

*Never-named item 12: "It cannot explain itself — walkthroughs and Q&A were asked for and dropped."*

**E1 · Explanation is a replay, not a generation** — *[ANALOGY]*
- **Problem** — Asking a model to explain what the system did produces a plausible narrative reconstructed
  from partial context. It will be fluent, and it will be wrong in the places that matter, because those
  are the places the model was not present for.
- **How** — Given a task id, reconstruct the chain **from the event log**: what was chosen, by what rule,
  at what cost, with what verdict, and what the founder did next. The renderer joins rows; it does not
  invent connective tissue.
- **Enforced by** — Every row carries a real task id from day one (CT2). CAST is the cautionary case: it
  cannot cleanly answer "what did this task cost?" because there is no foreign key, so it uses a heuristic
  60-second time-window join — and that is **not retrofittable**.
- **Fails when** — The log is incomplete and the replay has holes. E2 is the rule that makes that safe.
- **Territories** — 10, 12, 07

**E2 · An explanation with a hole must say so** — *[INVENTED, on this repo's Rule 10]*
- **Problem** — The dangerous failure of self-explanation is not being wrong; it is being *smooth*. A
  narrative that silently bridges a missing link is more harmful than a refusal, because it is believed.
- **How** — The renderer fails loudly on a missing link: *"I cannot explain step 3 — no row was written
  between the dispatch and the artifact."* The gap is the finding. This is Rule 10 applied to explanation:
  a renderer never explains what it could not observe.
- **Enforced by** — The renderer asserts chain continuity — every step has a predecessor row — and emits an
  explicit gap marker otherwise. Mechanical, and it turns the explanation surface into an instrumentation
  audit that runs every time anyone asks a question.
- **Fails when** — Early on, most explanations will be mostly holes, and the surface will look broken. It
  is not broken; it is reporting that the instrumentation is thin, which is exactly what you want to know
  before you trust it.
- **Territories** — 10, 12

**E3 · Counterfactual explanation — "what would have changed your mind?"** — *[ANALOGY]*
- **Problem** — "Why did you choose this?" invites rationalisation. "What would have made you choose
  differently?" is answerable, checkable, and far more useful to someone deciding whether to override.
- **How** — Where priority is a deterministic function (P1/P3), perturb its inputs and report the flip
  point: *"if the deadline moved out four days, goal B wins."* No model involved; it is arithmetic over
  the same function.
- **Enforced by** — Falls out of P1/P3 for free — a pure function can be evaluated repeatedly.
  **Conditional**: this mechanism does not exist unless priority is computed rather than chosen, which is
  an argument for P1 over any model-chooses design.
- **Fails when** — Multi-dimensional flip surfaces are not summarisable in a sentence. Report the two most
  sensitive inputs and say the rest were held fixed.
- **Territories** — 10, 01

**E4 · Q&A grounded in the log, with unsourced answers refused** — *[SOURCED, this repo]*
- **Problem** — A Q&A surface over an agent system is an invitation to fluent invention about the system's
  own behaviour — the single worst place for it, because the answer is unlikely to be independently
  checked.
- **How** — Every answer about system behaviour must cite an event id, a file path, or a claim id. No
  citation → the answer is *"I don't have a record of that"*. Rule 3 (`source claims`) applied inward.
- **Enforced by** — `check-citations-exist` is already a blocking step with a mutation gate
  (`test:citations`), and the ledger already fails a claim citing a nonexistent ADR. The same existence
  check over answer citations is the same code path pointed at a new corpus.
- **Fails when** — Existence checking is not accuracy checking — a real event id attached to a wrong claim
  passes. The repo already made this distinction deliberately and split the posture: **existence blocks,
  drift warns**. Inherit that split rather than re-deciding it.
- **Territories** — 10, 08, 12

**E5 · Three renderers over one log** — *[ANALOGY]*
- **Problem** — "Explain yourself" is three different requests. The founder wants meaning, an operator
  wants the next action, an auditor wants the sequence. One rendering serves none of them well, and
  building three logs would guarantee they disagree.
- **How** — One event log; three views. **Founder**: what changed and what it means. **Operator**: what is
  stuck and what to do. **Auditor**: the full chain with ids. Same rows, different projections, and the
  projections are code.
- **Enforced by** — A single log with typed rows and three renderers, plus a test that all three render
  from the same query. The failure to avoid is a second store — CAST's cost figures come from **two
  pipelines that disagree, with a third richer source never read**.
- **Fails when** — The founder view needs interpretation, which needs a model, which reintroduces
  generation. Keep the model on the `say:` field (V1), written once at emission by the thing that knew
  what happened, not at render time.
- **Territories** — 10, 12

---

## 12 · The 2,936 transcripts nothing reads

*Never-named item 2.* The reader already exists: `scripts/lib/usage.js` parses every transcript to count
tokens. It measures one thing. Everything below is another thing the same parse could measure.

**M1 · A regex correction classifier** — *[SOURCED]*
- **Problem** — The highest-value signal in the company — the founder saying "no, not like that" — is
  emitted constantly and captured never. Metaswarm's answer is ~50 lines of regex, and it is better than
  asking a model to notice, because a mechanical detector cannot decide it was not important.
- **How** — Scan founder turns for correction markers (*no, · actually · that's wrong · I said · don't ·
  stop · not what I meant*), extract the surrounding exchange, and emit a **candidate** feedback memory.
  Candidates are reviewed once by the founder; confirmed ones enter the taste file and bind.
- **Enforced by** — A scheduled task writing candidates; the confirm step is a founder act at the balcony.
  Note the caution from the source: Metaswarm's *own* self-improvement loop is prose that nothing checks
  ran, and its canonical command **no longer calls** the working classifier. Take the classifier; refuse
  the loop around it.
- **Fails when** — Precision. Regex over conversational text will surface many non-corrections, and the
  review burden is the whole cost. Measure the confirm rate; below ~30% the markers need narrowing.
- **Territories** — 05, 12, 04

**M2 · Transcript mining as instrumentation, not as memory** — *[ANALOGY]*
- **Problem** — The obvious use — RAG over transcripts — is the wrong one (see §15/A4). The right use is
  measurement: transcripts are the only record of what actually happened across 2,936 sessions.
- **How** — Mine for facts nothing else knows: how often a skill was loaded, how long a move really takes,
  how often a rule was violated, where sessions die. `usage.js` already walks every transcript and
  extracts turns — the walk is built and one extractor is wired.
- **Enforced by** — Extractors as pure functions over the existing parse, each with a test on a fixture
  transcript. Cheap, and it converts a dead corpus into the measurement base every other mechanism here
  needs.
- **Fails when** — Transcript format drift silently breaks an extractor and the number quietly goes to
  zero. Every extractor needs a **positive control** — a known-present pattern it must still find — which
  is the pattern this repo already uses when it checks a grep can find a tool that is there.
- **Territories** — 12, 07, 05

**M3 · Negative mining — promises that never landed** — *[ANALOGY, on this repo's §7 rule]*
- **Problem** — §7 says *"never trust a subagent's silence or its report — nine of nine reviewers once
  completed and never sent."* That rule is enforced going forward by nothing, and its evidence base is one
  anecdote.
- **How** — Scan transcripts for statements of intent ("I'll add X", "next I will Y") and check whether the
  corresponding artifact exists on disk. The gap set is the base rate of unkept agent promises — a number
  nobody currently has, and a number that should inform how much verification is worth.
- **Enforced by** — A one-off mining script producing a rate; if the rate is material, a live check at
  task close comparing declared intent to artifacts on disk. `lastArtifactAt()` already knows what an
  artifact is.
- **Fails when** — Intent statements are hard to extract reliably and the false-positive rate could swamp
  the signal. Treat the first run as an estimate with a stated method, not a metric.
- **Territories** — 12, 08

**M4 · Session archaeology — where sessions die** — *[INVENTED]*
- **Problem** — Nobody knows what kills a session: context exhaustion, a blocked tool, a loop, the founder
  losing patience. Design decisions about the loop are currently made without this.
- **How** — Classify the last N turns of every transcript into terminal causes and count them. The
  distribution tells you which failure to build against first — the same logic as N4's taxonomy, applied
  retrospectively to a corpus that already exists.
- **Enforced by** — A closed enum plus a report. The corpus is on disk today, so this is a measurement
  that can be taken this week without building anything.
- **Fails when** — Terminal cause is often ambiguous from the transcript alone. Allow `unknown` and report
  its share honestly; a 40% unknown rate is itself a finding about instrumentation.
- **Territories** — 12, 11, 07

---

## 13 · The bought hands — the mechanism half only

*Never-named item 1.* Cataloguing the ~15 connected MCP servers is `hands.md`'s lane. What belongs here is
only the **mechanism** by which a capability becomes reachable, and the mechanism by which the gap is
detected.

**H1 · Capability is a grant on a pack, and the grant is the security boundary** — *[SOURCED, this repo]*
- **Problem** — 16 of 18 agent files hold no MCP tool while hundreds sit unused. The axis the roster was
  collapsed on was *shape of work*; what actually separates a marketer from a backend engineer is which
  tools they hold.
- **How** — A pack is a grant plus a stop. The grant names tools; the agent cannot research its way into
  holding one it was not given. The narrow precedent already exists and is the model: `sourcer` holds
  `mcpServers: [claim-append]` while its `tools:` line carries **no `Write` and no `Edit`** — it can
  append a claim through one audited server and still cannot edit a file.
- **Enforced by** — `schema-lint.js` already **fails any `mcpServers` declaration that no configuration
  backs**, which is the exact check that keeps a grant honest in both directions.
- **Fails when** — Grants drift wide because a wide grant is easier than a narrow one. R2's risk
  declaration is the friction that makes widening a visible act.
- **Territories** — 03, 02, 09

**H2 · The reachability probe — measure what a dispatched worker can actually touch** — *[SOURCED, this
  repo]*
- **Problem** — A grant that exists in a file and does not survive dispatch is worse than no grant: the
  system believes it has a capability. This repo has already been burned by the inverse — a
  `Workflow` call from a dispatched engine would be a **silent no-op, not an error**.
- **How** — Probe empirically: dispatch a worker whose only job is to call each granted tool once and
  report. The output is a matrix of what is actually reachable from inside a dispatch, which is a
  different question from what is configured.
- **Enforced by** — `scripts/probe-workflow-reach.mjs` is the working precedent — it measured 0 of 55
  recorded `Workflow` calls from a sidechain against 57,590 subagent `Bash` calls, and that measurement is
  what turned a believed gap into a deliberate containment. Generalise the probe across grants.
- **Fails when** — A probe that calls a tool has side effects. Probe with read-only or dry-run
  invocations (R4), and where neither exists, record the grant as **unprobed** rather than assuming it
  works.
- **Territories** — 03, 09, 11

**H3 · Taint tracking — untrusted content narrows the grant** — *[ANALOGY]*
- **Problem** — Prompt injection is named in territory 09 and has no mechanism. The moment a worker fetches
  a web page, an email, or a document, its context contains instructions written by someone else — and it
  is holding tools that can send, publish, and pay.
- **How** — Every piece of context carries provenance: **authored** (founder), **derived** (the system's
  own work), or **foreign** (fetched from the world). While foreign content is in context, the effective
  grant narrows automatically — outbound tools become `blocking-human` regardless of trust level. The
  taint is a property of the context, not a judgement about the content.
- **Enforced by** — The policy seam is the natural home (a handler at `tool_call` reading a taint flag);
  without it, the dispatch wrapper can set the flag when it injects fetched content. **`WISH`** on
  detecting foreign content that arrives by a path the wrapper does not mediate — that hole is real and
  should be stated.
- **Fails when** — Nearly all useful work involves reading something from the world, so the narrowed state
  becomes the normal state and the mechanism reads as a permanent block. That may be the correct posture
  for an unattended loop, and it should be decided deliberately rather than discovered.
- **Territories** — 09, 03, 07

**H4 · Match on structured tool input, never on the command string** — *[SOURCED, this repo, measured this
  session]*
- **Problem** — A blocking control in this repo is defeated by one pair of parentheses: `npx --version` is
  blocked by `.claude/hooks/pre-tool-use.sh`; `( npx --version )` runs. A string matcher over shell is a
  matcher over an infinite grammar, and it will always lose.
- **How** — Two competing repairs. **(a)** Parse the command with a real shell parser and match on the
  resulting command list — subshells, pipelines, `env` prefixes and `\`command substitution\`` all
  normalise. **(b)** Abandon string matching: allowlist by *executable path* resolved at exec time, which
  is what an OS-level control does and what the sandbox already does for the filesystem.
- **Enforced by** — Either is a change to `pre-tool-use.sh` plus a fixture suite of bypass shapes. The
  precedent for the fixture suite is exact and recent: **eight** bypasses of the exit-code guard were
  closed by declaring what is read and refusing the rest, at the *line* rather than the value — and the
  eighth was a regression introduced by the fix for the first seven.
- **Fails when** — (a) inherits the parser's own edge cases; (b) breaks legitimate composite commands.
  Whichever is chosen, the fixture suite is the durable part, and the repo's own lesson applies: check
  whether the other rules in `pre-tool-use.sh` share the shape before declaring it fixed.
- **Territories** — 09, 11

---

## 14 · The remaining territories

### 14a · Knowledge (04)

**K1 · Learning a new field is a bounded protocol with a checkable exit** — *[INVENTED]*
- **Problem** — Decision 6 says agents research their way into new fields. "Research the field" with no
  shape is where an unattended loop burns a window and returns a summary of Wikipedia.
- **How** — Four required outputs, then stop: **five practitioners named · three canonical artifacts
  sourced · seven rules extracted · one proposed done-test**. The protocol is bounded by its outputs, not
  by a step list — it constrains the exit, not the path.
- **Enforced by** — The `FIELDS/` file schema requires all four; the sourced artifacts resolve through
  `claim-source`, which fetches and asserts the quote is present, so invented references fail.
- **Fails when** — Fields with no public literature (a niche B2B buyer) yield five practitioners nobody can
  verify. Allow `sourced: partial` with the gaps named — `sourcer`'s existing discipline already requires
  naming gaps.
- **Territories** — 04, 08

**K2 · Model-hint injection, and a return that names which models were used** — *[SOURCED, this repo]*
- **Problem** — 134 skills including **28 mental models with stop rules**, and **0 of 18 agents cite one**.
  The library is orphaned: `grep -rl 'thinking-'` returns 0 of 18 agents, 0 of 6 playbooks, 0 of 17
  commands, against a control of 9 files for `brainstorming`.
- **How** — The dispatch harness — not the agent — selects 1-2 thinking models from the router based on the
  move's shape and injects them. The return must name which it used and what the model's stop rule said.
  Injection is not discretionary; citation is checkable.
- **Enforced by** — Harness-side injection (a test asserts the constructed prompt contains a model), and a
  return schema field validated against the real skill directory — a named model that does not exist fails,
  the same dead-path check `check-registration.mjs` already performs.
- **Fails when** — Wrong model injected, and the worker reasons in a frame that does not fit. The stop
  rules are the mitigation — a mental model with a stop rule tells you when it does not apply, which is
  why these 28 are unusually good raw material.
- **Territories** — 04, 07, 02

**K3 · Global facts, project taste — enforced by scope, not by convention** — *[SOURCED, Decision 9]*
- **Problem** — Decision 9 splits knowledge into global (how a field works) and project (brand, voice,
  customer, stack). Without a mechanism, one project's brand leaks into the global store and every other
  project inherits it silently.
- **How** — `FIELDS/` is global and may contain no project-specific proper nouns; project taste is
  project-scoped and never read by another project. The check is mechanical: a global field file
  containing a project name fails.
- **Enforced by** — The ledger already carries `scope` on every claim (`global`/`project`) and already
  fails a `global`/`project` claim with no expiry, so the scope concept is live. Add a lint that a
  `global` field file names no project.
- **Fails when** — A genuinely global fact is expressed through a project example, which is often the
  clearest way to state it. Allow examples in a marked block excluded from the check.
- **Territories** — 04, 05, 14

### 14b · Memory (05)

**MEM1 · Name the episodic/semantic split — the system has both and confuses them** — *[SOURCED]*
- **Problem** — `events.jsonl` records *what happened* (episodic); the claim ledger records *what is true*
  (semantic). Both are used as "memory", and the distinction is never stated, so queries hit the wrong
  store and beliefs get read out of an event log.
- **How** — State it as a rule with a routing consequence: **an event is never evidence for a belief
  without a claim.** "The deploy succeeded on Tuesday" is an event; "the deploy pipeline works" is a claim
  and needs a verifier. Events are append-only and never expire; claims expire and force dispositions.
- **Enforced by** — Both stores already exist with these properties. The mechanism is the *routing rule*
  plus a check that no resolver reads `events.jsonl` as a truth source. Cheap, and it prevents a class of
  quiet error.
- **Fails when** — Some claims genuinely resolve from event counts (T1's trust computation does). Those are
  `verified_by: command` where the command is the query — legitimate, because the query is reproducible.
- **Territories** — 05, 08

**MEM2 · Conflict resolution: newer wins, older superseded in place with its reason** — *[SOURCED, this
  repo]*
- **Problem** — Territory 05 names conflict and nothing resolves it. Two memories disagreeing is the normal
  state of a system that learns, and "the newer one" alone loses the information about *why* the older one
  was believed — which is the part that stops the error recurring.
- **How** — The newer belief wins **and** the older is retained with a supersession note carrying the
  evidence that moved it. This is the practice `CLAUDE.md` already follows by hand, everywhere, and it is
  the single best thing in that document.
- **Enforced by** — `scripts/evict-memory.mjs`'s rules mechanised in `scripts/lib/memory-entries.js`,
  pinned by mutation testing in `scripts/evict-memory.test.mjs` — including that **anything cited by a live
  claim is pinned** and cannot be silently dropped.
- **Fails when** — Automatic supersession on a false correction buries a true belief. The pin rule is the
  guard: a belief supporting a live claim cannot be superseded without the claim also moving.
- **Territories** — 05, 12

**MEM3 · Forgetting is a tool, not a judgement call** — *[SOURCED, this repo]*
- **Problem** — Every memory design grows until it stops being loadable, and the usual answer — an agent
  deciding what to drop — is the least auditable possible mechanism.
- **How** — Eviction is a program with rules: irreversible entries are never archived while their subject
  exists; entries whose targets are all gone are archivable on sight; anything cited by a live claim is
  pinned; every archival leaves a resolvable stub. **Never hand-edit an entry out of the file.**
- **Enforced by** — `scripts/evict-memory.mjs plan` prints the **net** bytes each eviction frees (the entry
  minus its stub) and `apply` performs it, refusing what the rules forbid and checking that no byte was
  lost. Generalise the same tool to `FIELDS/` and the archive.
- **Fails when** — The rules are tuned for decisions and may not fit field knowledge, which has different
  citation patterns. Re-derive the four rules for the new object type rather than assuming they transfer.
- **Territories** — 05, 07

### 14c · Communication (06)

**CO1 · A fixed handoff shape — SBAR** — *[SOURCED]*
- **Problem** — The baton (`BOARD.md`) is a free-form document with a size cap. Free-form handoffs lose the
  same field every time, and the field lost is usually the one the receiver most needed.
- **How** — Adopt a clinical handoff structure: **Situation** (what is happening now) · **Background**
  (how we got here) · **Assessment** (what I think it means) · **Recommendation** (what I would do next).
  Four fields, always present, "nothing" allowed. Hospitals adopted SBAR because free-form handoff kills
  people; the structural argument transfers even though the stakes do not.
- **Enforced by** — `BOARD.md` schema with four required sections and a per-section byte cap; a lint
  failing a missing section. The hard size cap already proposed in `STARTUP-OS.md` §3 becomes per-section,
  which is what stops one section eating the budget.
- **Fails when** — Assessment and Recommendation get filled with hedges. Require Recommendation to name a
  specific next move id, which is checkable against `MISSIONS.yml`.
- **Territories** — 06, 05

**CO2 · Read-back on the baton** — *[SOURCED]*
- **Problem** — A receiving worker that misreads the baton proceeds confidently in the wrong direction, and
  nothing notices until the artifact is wrong. Aviation's readback exists for exactly this and is cheap.
- **How** — The receiver restates the baton **in its own words** before acting; a mechanical similarity
  check against the original flags a large divergence for a human. The restatement is one paragraph and
  costs almost nothing.
- **Enforced by** — A required `understood_as:` field on the first return, plus the same distance function
  as C8. Divergence above a threshold is a **finding**, not a block — the receiver may be right and the
  baton wrong.
- **Fails when** — The receiver paraphrases the baton without understanding it, which read-back cannot
  detect in a language model any more than in a tired pilot. It catches gross misreads, which is what it
  claims.
- **Territories** — 06, 08

**CO3 · Star topology — workers never message workers** — *[INVENTED]*
- **Problem** — Worker-to-worker messaging is how an org chart grows back: informal channels become
  dependencies, dependencies become roles, and §7's wall ("a persona may never be dispatched to produce")
  is bypassed socially rather than structurally.
- **How** — A worker's only outputs are its artifact and its rows. To reach another worker it writes a row
  the dispatcher reads. Every inter-worker communication is therefore auditable, replayable, and passes
  through something that can refuse it.
- **Enforced by** — Tool grants: no worker holds a messaging tool. This is enforceable *today* — 16 of 18
  agent files hold no MCP tool at all, so the restrictive default already exists and only needs to be
  deliberate rather than accidental.
- **Fails when** — Genuine pair work (a maker and an editor iterating) becomes slow and lossy through a
  hub. Allow an explicit **pod** — two workers sharing one dispatch — as the named exception, rather than
  opening general messaging.
- **Territories** — 06, 02, 09

**CO4 · Leases on path prefixes, not file locks** — *[SOURCED, this repo's launcher]*
- **Problem** — Parallel workers editing the same area is a collision that presents as a merge conflict
  much later, or worse as silently reverted work. `bin/warroom` already implements cross-worker file
  overlap detection — a feature that must be reborn as data when the bash program goes.
- **How** — A worker declares the path prefixes it will write and takes a **time-limited lease**. Overlap
  with a live lease is refused at dispatch, not discovered at merge. Leases expire, so a dead worker does
  not hold ground forever.
- **Enforced by** — A lease file plus a dispatch-time check; the expiry is what makes it safe without a
  supervisor. Worktree isolation is the complement, not the substitute — the repo has measured that
  isolation between agents inside a session is **a convention they keep, not a rule anything enforces**.
- **Fails when** — Prefixes are declared too broadly and everything collides. Report lease conflicts as
  data; a prefix that always conflicts is a signal about how work is being cut, not about locking.
- **Territories** — 06, 11, 02

### 14d · Context and cost (07)

**CT1 · The byte-budget ratchet with forced progressive disclosure** — *[SOURCED]*
- **Problem** — Every injected surface grows, because adding is easy and each addition is individually
  justified. `session-start.js` reached **27,069 bytes against a 4,096 budget**, at which point the runtime
  truncated it and inlined a ~2KB preview — so the lenses and playbooks **never reached agent context at
  all**.
- **How** — A declared byte cap per injected surface that only ever ratchets **down**. Exceeding it does
  not raise the cap; it forces a two-tier split — ids and one-line summaries, with the full content loaded
  on demand.
- **Enforced by** — A check in the suite comparing emitted bytes to the declared cap. The precedent is
  measured twice here: skills discovery went ~15,000 → ~1,070 tokens, and `session-start.js` 27,069 →
  2,941 bytes (#76), a 9.2× cut with no content lost.
- **Fails when** — The summary layer is uninformative and everything gets loaded anyway, so the cap moves
  cost rather than removing it. Measure the on-demand load rate: if it is near 100%, the tiering failed.
- **Territories** — 07, 04

**CT2 · A real task id on every row, from day one** — *[SOURCED]*
- **Problem** — Without a shared id, "what did this cost / who decided this / why did it happen" requires a
  heuristic join, and heuristic joins are wrong in the cases you most want to examine.
- **How** — One id, minted at dispatch, carried by every event, cost record, artifact, verdict, and balcony
  row. The dispatch wrapper refuses to dispatch without it.
- **Enforced by** — The wrapper refuses; the row schema requires it; a check asserts no row lacks one.
  CAST is the cautionary evidence: it needs a **60-second time-window join** between `dispatch_decisions`
  and `agent_runs` because there is no foreign key, and this is **not retrofittable** — which is why this
  belongs in the first commit rather than the tenth.
- **Fails when** — Sub-work spawned inside a task needs its own identity. Use a parent/child id pair from
  the start; adding a hierarchy later has the same retrofit problem as adding the id.
- **Territories** — 07, 10, 12, 13

**CT3 · Compaction declares what it dropped** — *[INVENTED]*
- **Problem** — Compaction is lossy and silent. After it, the agent does not know what it no longer knows,
  which is the worst possible epistemic state and indistinguishable from the state before.
- **How** — A compaction writes a short manifest: what was summarised, what was dropped entirely, and
  where the full record lives. The manifest stays in context; the content does not. The agent can then
  *ask* for what it lost.
- **Enforced by** — **`WISH`** on native compaction, which the runtime performs and this repo does not
  control. Enforceable for the parts the system owns: the baton, injected surfaces, and any harness-side
  summarisation, all of which can emit a manifest.
- **Fails when** — The manifest itself grows to the size of the thing it summarises. Cap it, and let the
  cap force it to name categories rather than items.
- **Territories** — 07, 05

### 14e · Runtime (11)

**RT1 · Moves are idempotent, or they declare that they are not and take a lease** — *[ANALOGY]*
- **Problem** — Crash-only design assumes any process can die at any time and be restarted. That is exactly
  the world an unattended 24/7 loop lives in, and a move that is not safe to re-run turns a restart into a
  double send or a double charge.
- **How** — Every move is either idempotent (re-running produces the same result) or declares
  `idempotent: false` and takes a lease that survives its death. Non-idempotent moves are also, by
  definition, the ones that need `blocking-human` treatment (R3) — the two properties correlate.
- **Enforced by** — A schema field with no default — the author must choose — and the dispatcher refuses to
  auto-restart a non-idempotent move, escalating instead. Refusing a default is the mechanism; a default
  would be silently wrong for the dangerous half.
- **Fails when** — Idempotency is claimed and false. Sample it: re-run a sample of allegedly idempotent
  moves in a scratch worktree and diff the outputs.
- **Territories** — 11, 09, 01

**RT2 · Where the loop lives — three competing homes** — *[SOURCED, this repo's open question 2]*
- **Problem** — The control plane structurally cannot spawn: `mission-control/test/crosscheck.test.ts` bans
  a shell call under `server/` at **zero exceptions**, deliberately, because it closed three RCEs on
  2026-08-14. So the loop needs a home that does not weaken that.
- **How** — **(a) Scheduled task** — Claude-native, fires on a cadence, writes rows the balcony reads;
  containment kept, cadence coarse. **(b) Long-running process with a sleep** — finer control, needs the
  dual-layer supervision of S4, and is a new always-on surface. **(c) Event-driven** — fires on a file
  change or a webhook; most responsive, most ways to fire unexpectedly. (a) is what
  `STARTUP-OS.md` §8 proposes and has not agreed.
- **Enforced by** — Whichever is chosen, `crosscheck.test.ts`'s zero-exception ban is the constraint that
  must survive, and it is already a blocking test. That test is the mechanism; the choice is a design
  decision.
- **Fails when** — (a) cannot react within a cycle, so steering latency is bounded below by the cadence —
  which interacts directly with §3. Decide them together.
- **Territories** — 11, 01, 09

**RT3 · A kill switch that is a file, checked at every dispatch** — *[ANALOGY]*
- **Problem** — Territory 09 names a kill switch. A kill switch that requires the system to be working in
  order to work is not one.
- **How** — The presence of a file stops all dispatch. Checked at the top of every dispatch, by the
  wrapper, before anything else. The founder creates it with `touch`; no service, no API, no auth, nothing
  that can be down.
- **Enforced by** — The dispatch wrapper's first statement, and a test that dispatch refuses when the file
  exists. Fail-closed on ambiguity: if the check itself errors, refuse.
- **Fails when** — A worker already running is not stopped by it — it stops *new* dispatch only. That is
  S3's job, and the two must be described as different switches so nobody believes the file stops the
  world.
- **Territories** — 09, 11, 10

### 14f · Self-improvement (12)

**SI1 · A post-mortem's output is a mechanism, or an explicit "none" that is counted** — *[SOURCED]*
- **Problem** — Blameless post-mortems produce good narratives and few changes. The narrative is the
  deliverable, and six months later the same failure recurs with a better-written history.
- **How** — Every post-mortem ends in a table row with a **Mechanism** column. `none` is a permitted value
  — most incidents do not warrant machinery — but `none` is *counted*, and a failure class with three
  `none`s is escalated by the count, not by anyone's memory.
- **Enforced by** — `CLAUDE.md`'s own Rules table is the working model: every rule names its mechanism, and
  `ADVISORY` is an honest label rather than a hidden gap. Generalise the format and add the count.
- **Fails when** — A mechanism is named that nobody builds, which is worse than `none` because it reads as
  closed. Tie the row to X1's birth certificate: a named mechanism has an owner and a date, or it is
  `none`.
- **Territories** — 12, 08

**SI2 · Pattern promotion at three sightings** — *[ANALOGY]*
- **Problem** — Useful patterns are re-derived each time because nothing notices they recurred. Promoting
  on the first sighting produces a library of one-offs — which is how 134 skills came to include ones
  nothing cites.
- **How** — Three independent sightings of the same approach make it a **candidate** skill. Candidacy
  triggers a review, not an automatic write. Rule of three, applied mechanically rather than by taste.
- **Enforced by** — The approach hashes from C24 already count sightings; a report lists candidates. The
  review is a human act and should stay one — `CURATION.yml` already records 55 cuts *with the test that
  justified each*, and more than ten reversals, which is the right standard for entering the library.
- **Fails when** — Three sightings of a bad pattern promote a bad pattern. The review is the filter, and
  `check:curation` already fails when the directory drifts from the recorded decision.
- **Territories** — 12, 04

**SI3 · A/B on the system's own prompts — and the honest caveat** — *[SOURCED]*
- **Problem** — Prompt and mechanism changes are currently justified by argument. Nobody knows whether
  last month's change to a lens made anything better.
- **How** — Two variants of one engine's prompt, assigned by task id parity, compared on a real outcome
  (world's verdict, rework rate, founder intervention). Deterministic assignment, so it is auditable.
- **Enforced by** — The assignment function plus outcome joins on the task id. **Stated plainly: at
  one-founder volume this is probably not achievable.** Detecting a modest effect needs dozens of
  observations per arm, and this company will produce a handful of comparable moves a month. Its realistic
  value is catching *large* regressions, not tuning.
- **Fails when** — Under-powered comparisons get read as results, which is worse than no comparison. Refuse
  to report a direction below the minimum detectable effect — W4's rule, applied inward.
- **Territories** — 12, 08

**SI4 · One company metric: founder interventions per shipped artifact** — *[INVENTED]*
- **Problem** — There is no number that says whether this is working. Token spend, artifacts produced, and
  sessions run all go up when things go badly.
- **How** — Count founder interventions — redirects, rejections, rework — per artifact that survived the
  world's verdict. It should fall. It captures autonomy, quality, and taste alignment in one number, and
  it cannot be gamed by producing more, because the denominator is *surviving* artifacts.
- **Enforced by** — Both terms are event queries given CT2 and W1. Report it monthly with its two
  components visible, so a fall caused by fewer surviving artifacts is not read as a win.
- **Fails when** — The founder disengages and interventions fall for the wrong reason. Pair it with an
  engagement count so the two cannot be confused — a metric with one number is a metric that will be
  gamed, including by accident.
- **Territories** — 12, 13, 14

### 14g · Economics (13)

**EC1 · A hard cost ceiling downgrades the model rather than stopping the work** — *[SOURCED]*
- **Problem** — A hard stop at a budget ceiling loses the work in progress, and losing work is more
  expensive than finishing it more cheaply. This is a real design choice with a shipped precedent.
- **How** — Omnigent's cost policy: soft ASK thresholds, and the hard maximum acts as a **model-downgrade
  gate** rather than a stop. Above the ceiling, work continues on a cheaper model. And it **fails closed
  when a model has no catalogue price** — asking rather than silently scoring the spend at zero.
- **Enforced by** — A price table plus a policy handler at the `llm_request` phase. The fail-closed clause
  is Rule 10 applied to money, and two systems reaching it independently is the strongest evidence in this
  document that a rule is right.
- **Fails when** — Downgrading mid-task produces a worse artifact under a passing done-test, so quality
  degrades invisibly. Record the model on the artifact; a done-test passed on a downgraded model is a
  different fact.
- **Territories** — 13, 09, 08

**EC2 · Cost per *surviving* artifact, not cost per run** — *[INVENTED]*
- **Problem** — Cost per run rewards cheap runs that produce nothing. Every existing cost view in this
  repo and in CAST measures spend, not yield.
- **How** — Divide spend by artifacts that passed a world-verdict rung ≥ 2 (W2). A month of cheap runs
  producing nothing has an **undefined** cost per surviving artifact — which is the honest reading, and
  far more informative than a low cost-per-run.
- **Enforced by** — Arithmetic over CT2-joined rows and W1 claims. Rule 10: undefined is reported as
  undefined, never as zero or as excellent.
- **Fails when** — Early on the denominator is zero for months. Report the numerator and the zero
  separately rather than suppressing the metric.
- **Territories** — 13, 08, 12

**EC3 · Opportunity cost recorded on every move** — *[SOURCED skill, unused]*
- **Problem** — In a company with one 5-hour window, every move is a choice against every other move, and
  the alternative is never written down. `.claude/skills/thinking-opportunity-cost/` exists and is cited by
  nobody.
- **How** — Each dispatch records `instead_of:` — the runner-up move the priority function ranked second.
  Free if priority is computed (P1/P3): the function already knows. Over time it reveals what the system
  systematically never gets to, which is invisible today.
- **Enforced by** — The priority function emits it; the row schema requires it; the id must resolve to a
  real goal (the same dangling-reference lint used elsewhere).
- **Fails when** — Meaningless when there is only one candidate. Allow `instead_of: none` and count them —
  a queue that is always length one is itself a finding about how work is generated.
- **Territories** — 13, 01, 10

**EC4 · The rope — reserve headroom in the rolling window** — *[SOURCED, this repo, Decision 8]*
- **Problem** — An autonomous loop competes with the founder for their own quota, and the failure is
  discovered at the worst moment: the founder sits down to work and the window is gone.
- **How** — The loop stops itself at a set fraction of the rolling 5-hour window. Critically, at the
  ceiling a **safelist** still permits `git commit/push`, `npm run check`, `gh pr create`, ledger writes,
  and writes to session files and `DECISIONS.md` — so **landing work is never blocked**, only starting new
  work is. An override demands a written reason and logs it with the numbers, and the guard announces its
  own fail-open rather than pretending.
- **Enforced by** — `.claude/hooks/budget-guard.js`, verified by execution this session at 0.08s warm
  latency. It is **registered nowhere** — `grep -c budget-guard .claude/settings.json` → 0, against a
  control of 1 for `pre-tool-use.sh`. Registering it edits `.claude/settings.json`, which is
  `irreversible` tier and denied to the write tools, so it needs the founder.
- **Fails when** — It is a Bash-layer guard and does not govern the file-edit tools; and this repo has a
  measured instance of a blocking control defeated by one pair of parentheses (H4). Neither is a reason not
  to register it; both are reasons not to describe it as containment.
- **Territories** — 13, 09, 11

### 14h · The company itself (14)

**CY1 · Venture intake is a bounded protocol producing three artifacts** — *[INVENTED]*
- **Problem** — Onboarding a venture is currently "start working and find out". The things a project needs
  before its first move — taste, first mission, done-tests — are exactly the things that are impossible to
  add later without redoing the work.
- **How** — Intake produces exactly three things and then stops: **a taste file** (references, adjectives,
  no-gos) · **one mission with a falsifier** (C36) · **one approved done-test**. Nothing else is authored,
  and no move dispatches until all three exist.
- **Enforced by** — The loop refuses to dispatch against a project missing any of the three. Mechanical,
  and it makes the founder's one unavoidable contribution happen at the only time it is cheap.
- **Fails when** — Intake becomes a long questionnaire and the founder abandons it. Cap it — three
  artifacts, one sitting — and let the system propose drafts the founder edits rather than asking open
  questions.
- **Territories** — 14, 04, 01

**CY2 · Portfolio allocation across ventures, with a floor and a ceiling** — *[SOURCED]*
- **Problem** — Several ventures at once means the loudest one takes everything. Stage-gate portfolio
  management exists because organisations reliably over-fund the visible project and starve the early one.
- **How** — Each venture gets a declared share of the window, with a **floor** (so a quiet venture is not
  starved to zero) and a **ceiling** (so a loud one cannot take everything). Shares are reviewed on a
  cadence, not continuously — continuous reallocation is how the loudest wins.
- **Enforced by** — `windowUsage()` already meters account-wide across every project, which is exactly the
  meter multi-venture allocation needs; the shares are a config the dispatcher reads.
- **Fails when** — A floor keeps a dead venture on life support. Pair with X3's `retire_on` applied at the
  venture level — a venture is a governed artifact too.
- **Territories** — 14, 13, 01

**CY3 · A second human is a role with declared decision rights** — *[SOURCED]*
- **Problem** — Territory 14 names a second human and nothing says what changes. The failure mode is
  well-documented and boring: two people, both assuming the other approved.
- **How** — Decision rights are declared per decision *type*, RACI-style: who is Accountable (exactly one),
  who is Consulted, who is Informed. `blocking-human` gates name **which** human. A gate that names no
  human is invalid.
- **Enforced by** — `.claude/gates.yml` already distinguishes `kind: human` from `kind: command` and a
  `human` gate has no `run:` — writing one is refused. Adding a required `who:` to human gates is a small
  schema change with a large clarifying effect.
- **Fails when** — The founder is Accountable for everything, and the field is ceremony. That is fine and
  honest for a one-founder company; the field's value is that it makes the exception visible when it
  arrives.
- **Territories** — 14, 09, 10

**CY4 · Wind-down is a protocol, and it archives rather than deletes** — *[ANALOGY]*
- **Problem** — Shutting a venture down is named in territory 14 and unspecified. Ad-hoc shutdown loses the
  learnings, which are the only thing a failed venture produces.
- **How** — Four steps: **stop dispatch · resolve every open claim to a disposition · write a dead-end
  record for the venture as a whole (N1) · archive with a stub**. The global facts learned stay global —
  Decision 9's split means a dead venture still contributes to `FIELDS/`, which is the strongest argument
  for that split.
- **Enforced by** — The venture's state machine; a check that a project marked `wound_down` has no
  unresolved claims. `evict-memory.mjs`'s stub discipline supplies the archival half.
- **Fails when** — Resolving every open claim is real work at exactly the moment nobody wants to do it.
  Allow bulk `deprecate` with one shared reason, which is honest and cheap.
- **Territories** — 14, 05, 12

---

## 15 · Anti-mechanisms — six things to refuse

Naming what not to build is cheaper than un-building it, and GSD's `.out-of-scope/` is the practice of
recording a rejection with its reasoning *before* code exists.

**A1 · Averaging scores from a panel.** Weak judges are excellent finders and useless scorers. Averaging
converts a set of specific findings into one number that has lost the findings and gained nothing. This
repo already holds the rule and its own `design.js` violates it. **Refuse:** any schema with a `total`
field summed from judge outputs.

**A2 · Weighted voting among personas.** It looks like rigour and is an average wearing a costume. It also
requires weights, which requires a trust model for opinions, which cannot be validated at this volume.
Auto-Co's Munger veto is the cautionary instance — **prose in `CLAUDE.md`, not a gate**, with all 14
personas at `model: inherit` (the same weights) and nothing checking disagreement occurred. **Refuse:**
weights on voices. Take findings from all of them; let a deterministic function select.

**A3 · A model scoring its own work.** Self-evaluation has a documented self-preference bias, and this
repo has the local measurement too: a design PASS/BLOCK judge at 0.543 against a panel only 0.741
self-consistent. **Refuse:** any done-test whose resolver is the producing model. The done-test must be
deterministic, external, or human.

**A4 · RAG over the 2,936 transcripts as a memory.** Transcripts are mostly noise and are full of
*superseded* beliefs stated confidently. Retrieval cannot tell a corrected belief from a current one, so
this resurrects exactly the errors the supersession discipline exists to bury. **Refuse** as memory;
**take** as instrumentation (M1-M4).

**A5 · A second implementation of risk classification.** `scripts/classify.mjs`'s own header says it:
*"Two implementations of risk classification will disagree, and you find out during the incident."* It has
already happened here once — `qa-lead-pass.yml` computed a stricter second answer and demanded a tier on
session files the classifier tiers `trivial`. **Refuse:** extend `scripts/lib/classifier.js`, never
parallel it. This applies directly to R1.

**A6 · Any rule stated without its mechanism.** `CLAUDE.md`'s Rules table previously carried eight rules
with zero enforcement. The cure was not deleting them; it was labelling `ADVISORY` honestly and naming
what would change that. **Refuse:** a proposal that reads as enforcement while nothing checks it. Every
entry in this document either names a mechanism or says **`WISH`**.

---

## 16 · Sources

All URLs accessed **2026-09-01** unless noted. `[SOURCED]` entries above draw on these; `[ANALOGY]` entries
transpose a real practice and say so; `[INVENTED]` entries claim no precedent.

**Search and creativity**
- Mouret, J-B. & Clune, J. (2015). *Illuminating search spaces by mapping elites.* arXiv:1504.04909 —
  https://arxiv.org/abs/1504.04909 (C2)
- Lehman, J. & Stanley, K. O. (2011). *Abandoning Objectives: Evolution Through the Search for Novelty
  Alone.* Evolutionary Computation 19(2):189-223 —
  https://direct.mit.edu/evco/article-abstract/19/2/189/1365/ (C3)
- Romera-Paredes, B. et al. *Mathematical discoveries from program search with large language models.*
  Nature 625 — https://www.nature.com/articles/s41586-023-06924-6 (C4, island model and LLM-driven
  evolutionary search)
- Wang, G. et al. (2023). *Voyager: An Open-Ended Embodied Agent with Large Language Models.*
  arXiv:2305.16291 — https://arxiv.org/abs/2305.16291 (skill-library-as-growing-asset, behind C2/SI2)
- Eno, B. & Schmidt, P. *Oblique Strategies* (1975) — the canonical constraint-card practice (C9)
- Catmull, E. *Creativity, Inc.* (2014) — the Pixar Braintrust: candid feedback with no authority to
  mandate a fix (C20). Cited from the book; not verified online this session.
- Osborn, A. *Applied Imagination* (1953) — deferred judgement, the separation of divergence from
  convergence (C18). Cited from the literature; not verified online this session.
- Janis, I. *Groupthink* (1972/1982) — the assigned critical evaluator as a structural remedy (C28).
  Cited from the literature; not verified online this session.
- Klein, G. *Sources of Power* (1998) — recognition-primed decision making; expertise as case recognition
  rather than rule application (C16). Cited from the literature; not verified online this session.

**Judging and evaluation**
- Zheng, L. et al. (2023). *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena.* arXiv:2306.05685 —
  https://arxiv.org/abs/2306.05685 — position bias, verbosity bias, self-enhancement bias; pairwise
  comparison with order-swapping as the mitigation (C1, C19, A3)

**Decision, forecasting and priority**
- Cowgill, B. & Zitzewitz, E. (2015). *Corporate Prediction Markets: Evidence from Google, Ford, and Firm
  X.* Review of Economic Studies 82:1309-1341 —
  https://business.columbia.edu/faculty/research/corporate-prediction-markets-evidence-google-ford-and-firm-x
  — internal markets improved on expert forecasts by up to a 25% reduction in mean squared error (P4)
- Goldratt, E. *The Goal* (1984) / Theory of Constraints — always work the bottleneck (P2). Cited from the
  literature; not verified online this session. The local instance is
  `.claude/skills/thinking-theory-of-constraints/`.
- WSJF (cost of delay ÷ job size), from the Scaled Agile body of practice (P3). Cited as a named industry
  practice; not verified online this session.

**High-reliability operations**
- FAA Advisory Circular **AC 120-51E**, *Crew Resource Management Training* (2004-01-22) —
  https://www.faa.gov/documentlibrary/media/advisory_circular/ac_120-51e.pdf — CRM, challenge-and-response
  discipline (V4, CO2)
- Sterile flight deck rule, 14 CFR §121.542 (in force since 1981) —
  https://skybrary.aero/articles/sterile-flight-deck — protected phases where non-essential activity is
  prohibited (the discipline behind C18's phase separation)
- Toyota Production System's andon cord — any worker may stop the line, and it stops at a defined point
  (S3). Cited as a documented industrial practice; not verified online this session.
- SBAR (Situation · Background · Assessment · Recommendation) — structured clinical handoff (CO1). Cited
  as a documented clinical practice; not verified online this session.

**Software practice**
- Beyer, B. et al. *Site Reliability Engineering*, ch. 3 *Embracing Risk* —
  https://sre.google/sre-book/embracing-risk/ — error budgets; *"100% is the wrong reliability target for
  basically everything"*; reliability cost is non-linear (the model behind an autonomy error budget, and
  behind EC1's soft/hard threshold split)
- Kanban WIP limits — throughput collapses well before utilisation reaches capacity (P5). Cited as a
  documented practice; not verified online this session.
- Mission command / commander's intent — task, purpose, end state, constraints (P7). Cited as documented
  military doctrine; not verified online this session.

**From this repository and the five reference studies** (all read this session, in-repo):
`docs/03-system-design/STARTUP-OS.md` · `docs/02-competitive/expansion/00-TERRITORY.md` ·
`CLAUDE.md` · `.claude/workflows/design.js` · `.claude/commands/board-meeting.md` ·
`scripts/lib/{resolvers,claims,usage,events,classifier,judges}.js` · `.claude/hooks/{budget-guard,schema-lint,pre-tool-use}.*`
— and, through `STARTUP-OS.md` §8b, the GSD, Auto-Co, Omnigent, Metaswarm and CAST studies.

---

## 17 · The five I would fight hardest to keep

Not a recommendation — a statement of where I think the leverage is, so the filtering conversation knows
what I would defend.

1. **X1 · The birth certificate** — nothing merges without a caller in the same diff. Four of four studied
   systems have the built-and-never-wired defect and every existing cure detects it after the fact. This is
   the only proposal here that *prevents* it, and it is a CI check.
2. **C1 + C17 · Kill the score, keep the findings** — replace `design.js`'s summed 0-10 axes with blind
   pairwise findings and a deterministic selector. The one creativity mechanism in the repo currently uses
   the selector the repo's own evidence says does not work. Smallest diff, largest correction.
3. **R1-R3 · REACH as a second classifier axis, with `blocking-human` by type** — worldly risk is the gap
   that makes 24/7 dangerous rather than merely expensive, and it reuses the one file that computes tier
   plus the gate kinds that already exist.
4. **W1 + W2 · A `world` verifier and the evidence ladder** — gives the ledger the job it deserves and is
   the prerequisite for trust (§9), bandits (C34), and cost-per-surviving-artifact (EC2). Almost everything
   downstream needs an outcome signal and there is none.
5. **B1 · Blocked is authored, stalled is computed** — one sentence, near-zero cost, and it makes an
   entire class of confusion structurally impossible. The measurement half is already built in
   `budget-guard.js`.

Runners-up I would argue for if there were room: **E2** (an explanation with a hole must say so — Rule 10
applied to self-explanation), **C2** (the quality-diversity archive, the only mechanism here that makes the
system's creative range *accumulate*), and **EC4** (register `budget-guard.js`; it is Decision 8, already
built and verified by execution, and registered nowhere).
