> **Provenance.** Verbatim text of the founder's directive, as supplied in the founder's message of 2026-09-12 and re-supplied on resumption 2026-09-13. This is the source of truth that [directive-contract.json](directive-contract.json) declares itself subordinate to ("The original message wins any discrepancy"). It was not preserved in the package before the resumption commit; every earlier phase worked from the structured extraction. The opening phrase "The text above" refers to [THE-PATH-TO-THE-VISION.md](THE-PATH-TO-THE-VISION.md) and its field map [THE-VISION-AND-THE-FIELDS.md](THE-VISION-AND-THE-FIELDS.md). Nothing below has been edited.

---

# AUTONOMOUS DISCOVERY, SYSTEM DESIGN, AND FULL IMPLEMENTATION DIRECTIVE

The text above describes the ambition and provides a broad field map. It does
not prescribe the architecture, ontology, agent hierarchy, workflow model,
technology stack, interface structure, or implementation strategy.

Your job is not merely to answer the questions in the document.

Your job is to independently discover what this system must be, design it in
full, challenge the design from multiple directions, produce a complete and
defensible planning package, and then transition into building the complete
system.

The founders know that they want a system capable of helping one person or a
small founding team create, operate, grow, govern, improve, pause, and close
startups, businesses, products, and other complex projects.

The founders do not yet know exactly:

- what the system should contain;
- how many layers, components, agents, workflows, services, or surfaces it needs;
- which responsibilities belong to models, agents, deterministic software,
  humans, or combinations of them;
- how the parts should communicate;
- how the system should reason, remember, evaluate, recover, improve, and govern
  itself;
- what the correct architecture is;
- which familiar abstractions should be reused;
- which familiar abstractions should be rejected;
- or which entirely new abstractions must be invented.

Discovering those answers is part of the assignment.

Do not ask the founders to design the system for you.

Do not reduce the ambition merely because the initial requirements are broad.

Do not assume that the final answer must resemble an existing agent framework,
software company, operating system, project-management platform, coding agent,
workflow engine, multi-agent hierarchy, or mission-control dashboard.

You may invent a new architecture, combine multiple architectural paradigms,
create new layers or primitives, eliminate familiar concepts, or organize the
system around an entirely different model if the evidence and reasoning support
it.

Novelty is permitted but is not valuable by itself. A new idea must solve a
named problem better than the available alternatives.

---

# 1. NON-NEGOTIABLE INTERPRETATION OF THE MISSION

Treat the following as core constraints.

## 1.1 The system is larger than a coding system

Vibe coding, software development, terminal operation, code review, testing,
deployment, infrastructure, and maintenance are important capabilities, but
they are not the complete system.

The system must also reason about and support work such as:

- company and product direction;
- founder intent;
- customer research;
- market research;
- strategy;
- product management;
- design;
- branding;
- marketing;
- distribution;
- content;
- sales;
- customer communication;
- customer success;
- operations;
- finance;
- bookkeeping;
- legal and regulatory coordination;
- privacy;
- security;
- partnerships;
- procurement;
- hiring and external collaboration;
- analytics;
- experimentation;
- quality assurance;
- incident response;
- knowledge management;
- governance;
- organizational learning;
- and winding down products, projects, or companies.

Do not allow one technically interesting area to consume the planning process
and cause the rest of the company to be treated as secondary.

## 1.2 The system is larger than a collection of agents

Do not begin by inventing agent names and roles.

First determine:

- what must happen;
- why it must happen;
- what information and authority it requires;
- what consequences it can create;
- how its result can be known;
- and whether the work belongs to an agent at all.

A capability may be implemented as:

- deterministic software;
- a fixed workflow;
- an LLM-assisted workflow;
- a temporary agent;
- a persistent agent;
- a group of agents;
- a human decision;
- an external professional or service;
- or a hybrid of these.

Choose based on the nature of the work rather than the desire to maximize the
number of agents.

## 1.3 The system must preserve founder intent

The purpose is not simply to produce more output.

The system must reduce the loss of intent between what the founder actually
wants and what reaches the customer or the outside world.

It must preserve:

- the original purpose of a goal;
- decisions and their reasons;
- constraints;
- taste;
- promises;
- rejected alternatives;
- uncertainty;
- evidence;
- assumptions;
- omissions;
- and changes of mind.

It must distinguish between:

- what the founder decided;
- what the system inferred;
- what the system proposed;
- what remains unknown;
- and what was done only because no better option was available.

## 1.4 The system must produce a truthful account

A log of actions is not enough.

The system must make it possible for a responsible owner to understand work
they did not personally observe.

The account must include not only what happened, but also:

- what was attempted;
- what failed;
- what was skipped;
- what was assumed;
- what was inferred;
- what could not be verified;
- what became stale;
- which alternatives were rejected;
- what evidence supports each important claim;
- what the system chose not to surface;
- why it made that choice;
- what remains unresolved;
- what changed during the work;
- and what consequences may still exist.

Design this evidence and accountability capability as a first-class property of
the system, not as an observability feature added at the end.

## 1.5 Autonomy follows consequence

Do not equate autonomy with an agent being experienced, trusted, or historically
successful.

The amount of supervision required for an action must be based primarily on:

- possible consequence;
- reversibility;
- blast radius;
- financial exposure;
- external communication;
- access to personal or confidential information;
- contractual effect;
- legal effect;
- security effect;
- impact on customers or other people;
- and the ability to detect and repair a mistake.

A good track record may affect the depth or frequency of review.

It must not silently increase the maximum consequence to which the owner is
exposed.

## 1.6 Preserve the competence of the owner

Do not optimize only for reducing human involvement.

The system must help the founder remain capable of:

- explaining the business;
- understanding customers;
- recognizing changes in the market;
- exercising taste;
- judging important work;
- making difficult decisions;
- detecting when summaries are misleading;
- and taking control when needed.

The system may deliberately return selected work, evidence, customer material,
or decisions to the founder even when it could process them automatically.

This must be a designed mechanism, not an optional recommendation.

---

# 2. AUTONOMOUS EXECUTION CONTRACT

There is no predefined time limit for this process.

There is no fixed number of:

- research rounds;
- reasoning rounds;
- architecture attempts;
- review rounds;
- adversarial attacks;
- planning revisions;
- agents;
- sessions;
- model calls;
- or implementation iterations.

Operate autonomously across the complete process.

Do not stop after each stage to request routine confirmation.

Do not ask the founder to approve every research direction, intermediate
artifact, planning revision, technical choice, agent role, schema, or module.

Continue independently whenever responsible progress is possible.

The process is completion-bounded, not time-bounded.

Do not interpret "no time limit" as permission to loop, repeat research without
purpose, produce unnecessary volume, or avoid decisions.

Every additional research or reasoning cycle must serve at least one of these
purposes:

- close a meaningful knowledge gap;
- test an important assumption;
- investigate conflicting evidence;
- generate a materially different alternative;
- attack a proposed solution;
- improve internal consistency;
- answer an uncovered field;
- resolve a dependency;
- or improve the defensibility of an irreversible decision.

Do not stop merely because:

- one plausible architecture has been found;
- the result is already long;
- the obvious topics have been discussed;
- a familiar framework appears to fit;
- one research lane has reached confidence;
- additional work is difficult;
- the current context window is becoming full;
- a model session is ending;
- a subscription usage window has been exhausted;
- or the work must continue in another session.

If execution capacity becomes unavailable:

1. Persist the complete state.
2. Record what has been completed.
3. Record current hypotheses and unresolved disagreements.
4. Record the exact next actions.
5. Record dependencies, blockers, and active risks.
6. Record which sources and repository areas were already examined.
7. Resume from that state when capacity becomes available.
8. Do not restart the process from memory or repeat completed work unnecessarily.

The system must be able to survive:

- context compaction;
- model changes;
- provider changes;
- process restarts;
- machine restarts;
- rate limits;
- usage-limit resets;
- network interruption;
- tool failure;
- and transfer between agents or sessions.

---

# 3. WHEN TO INVOLVE THE FOUNDER

Escalate to the founder only when a decision genuinely depends on:

- personal intent;
- values;
- taste;
- identity;
- risk tolerance;
- a promise only the founder can make;
- an irreversible external commitment;
- acceptance of material legal or financial exposure;
- a trade-off between equally defensible visions;
- missing authorization;
- or information that only the founder possesses.

Do not escalate simply because:

- the decision is difficult;
- evidence is incomplete;
- multiple technical options exist;
- confidence is below 100%;
- an implementation obstacle appeared;
- or the system has not seen the exact situation before.

When escalation is necessary, provide a decision packet containing:

- the exact decision required;
- why the founder is the correct decision-maker;
- the latest responsible decision time;
- the available options;
- the consequences of each option;
- the supporting evidence;
- uncertainty;
- reversibility;
- the recommended option, if one can be recommended;
- what happens if no answer arrives;
- and whether unrelated work can continue.

An escalation must not pause unrelated work.

Continue every branch that can proceed safely and usefully.

---

# 4. RESEARCH PRINCIPLES

Conduct broad, deep, and multi-round research before selecting the final
architecture.

Research must include both academic work and real systems.

Study areas should include, but are not limited to:

- autonomous agents;
- multi-agent systems;
- agent orchestration;
- coding agents;
- computer-use agents;
- long-running agent harnesses;
- workflow engines;
- distributed systems;
- operating systems;
- event-driven systems;
- durable execution;
- process management;
- organizational design;
- company operating models;
- project and portfolio management;
- decision theory;
- human-computer interaction;
- command centers;
- collaborative interfaces;
- knowledge management;
- memory systems;
- retrieval and grounding;
- evaluation science;
- software testing;
- formal methods;
- observability;
- provenance;
- security engineering;
- identity and access management;
- zero-trust systems;
- privacy;
- governance;
- compliance;
- reliability engineering;
- incident management;
- cost and capacity management;
- self-modifying systems;
- continual learning;
- and mechanisms for preserving human competence.

Research existing projects and products such as:

- Claude Code and related agent tooling;
- Codex and Codex CLI;
- Gemini CLI;
- OpenAI Agents SDK;
- Anthropic agent patterns and long-running harnesses;
- Google ADK;
- Microsoft Agent Framework;
- LangGraph;
- AutoGen;
- CrewAI;
- MetaGPT;
- CAMEL;
- OpenHands;
- OpenDevin-derived systems;
- SWE-agent;
- OpenAI Swarm;
- durable workflow systems;
- observability and agent-evaluation platforms;
- MCP servers and registries;
- business operating systems;
- planning tools;
- project-management tools;
- company simulation systems;
- and relevant academic benchmarks.

This list is illustrative, not exhaustive.

Discover additional relevant systems independently.

For each researched system, determine:

- what problem it was actually built to solve;
- its underlying assumptions;
- its architecture;
- its useful mechanisms;
- its limitations;
- its failure modes;
- what it deliberately does not solve;
- what evidence exists that it works;
- what is merely claimed;
- which ideas transfer to this project;
- which ideas do not transfer;
- and what becomes possible by combining or rejecting its assumptions.

Do not inherit the ontology, vocabulary, agent roles, architecture, framework
boundaries, or user interface of an existing system without independent
justification.

Existing systems are evidence, not authority.

---

# 5. INDEPENDENT RESEARCH LANES

Use multiple independent research and reasoning lanes.

At minimum, create lanes for:

1. Vision and founder-intent preservation.
2. Company and organizational operations.
3. Agent and workflow architectures.
4. Coding, terminal, and software-engineering systems.
5. Memory, knowledge, context, and grounding.
6. Evaluation, evidence, truthfulness, and reproducibility.
7. Security, permissions, identity, and adversarial threats.
8. Reliability, durable execution, and incident recovery.
9. Human factors, founder attention, competence, and interfaces.
10. Economics, subscriptions, capacity, and infrastructure.
11. Legal, privacy, governance, and ethical consequences.
12. Self-improvement and controlled system change.
13. Contrarian and architecture-breaking alternatives.
14. Entirely novel system concepts not derived from current frameworks.

Do not allow all lanes to share conclusions before they have independently
formed their own findings.

Each lane must return:

- findings;
- sources;
- assumptions;
- unknowns;
- competing interpretations;
- useful mechanisms;
- rejected mechanisms;
- failure cases;
- implications for the system;
- and questions it believes the other lanes may have missed.

After independent work, compare the lanes.

Preserve disagreements when the evidence does not justify resolving them.

Do not force artificial consensus.

---

# 6. EPISTEMIC DISCIPLINE

Every important statement in the planning work must be distinguishable as one
of the following:

- Fact.
- Direct observation.
- Source claim.
- Inference.
- Hypothesis.
- Design proposal.
- Decision.
- Founder constraint.
- Assumption.
- Unknown.
- Disagreement.
- Refusal.
- Deferred question.
- Implementation discovery.

Do not present an inference as a fact.

Do not allow an unanswered question to become an invisible assumption.

Do not treat the absence of evidence as evidence of absence.

For significant claims, record:

- the source;
- source date;
- source type;
- whether it is primary or secondary;
- confidence;
- possible conflicts of interest;
- whether another source agrees;
- when the claim may expire;
- and what would invalidate it.

When sources disagree:

1. Preserve the disagreement.
2. Investigate the underlying definitions and contexts.
3. Prefer primary evidence when possible.
4. Explain why one interpretation is stronger, if a conclusion is justified.
5. Otherwise retain the disagreement as an unresolved design input.

---

# 7. DO NOT DESIGN THE FINAL SYSTEM IMMEDIATELY

Do not jump directly from reading the vision document to one final
architecture.

Separate the work into distinct cognitive phases:

## Phase A — Understand

- Read the complete vision document.
- Reconstruct the ambition in your own words.
- Identify vision invariants.
- Identify contradictions and tensions.
- Identify non-delegable founder responsibilities.
- Identify non-goals.
- Identify assumptions.
- Identify missing questions.
- Identify questions that may contain hidden architectural assumptions.
- Identify what caused previous planning attempts to narrow prematurely.

## Phase B — Expand

- Research adjacent fields and existing systems.
- Discover additional fields not present in the document.
- Generate new system concepts.
- Explore unusual organizational structures.
- Explore architectures that do not begin with agents.
- Explore centralized, decentralized, hierarchical, market-based,
  event-driven, blackboard-based, evidence-ledger-based, workflow-first,
  runtime-first, organization-simulation, and hybrid models.
- Invent other models when useful.

## Phase C — Produce competing architectures

Create at least three materially different architectural candidates.

They must differ in foundational structure, not merely in:

- programming language;
- database;
- model provider;
- framework;
- number of agents;
- or user-interface style.

Include a simpler architecture where appropriate so that complexity must justify
itself.

For every candidate, define:

- core primitives;
- control structure;
- execution structure;
- information flows;
- memory model;
- evidence model;
- authority model;
- user model;
- failure model;
- self-improvement model;
- expected strengths;
- expected weaknesses;
- scalability limits;
- operational complexity;
- security implications;
- provider dependence;
- migration difficulty;
- and conditions under which the candidate would be the wrong design.

## Phase D — Attack the candidates

Use independent adversarial reviewers.

Attack each candidate from:

- technical;
- architectural;
- product;
- operational;
- organizational;
- economic;
- human;
- security;
- privacy;
- legal;
- ethical;
- reliability;
- evaluation;
- and long-term adaptability perspectives.

Include attacks involving:

- prompt injection;
- malicious external content;
- tool-output manipulation;
- memory poisoning;
- stale memory;
- false evidence;
- model collusion;
- evaluator collusion;
- duplicated actions;
- concurrent conflicting edits;
- silent failure;
- false success;
- irreversible external actions;
- unauthorized spending;
- credential compromise;
- privilege escalation;
- runaway delegation;
- runaway cost;
- infinite retry loops;
- goal drift;
- reward or metric gaming;
- summary distortion;
- owner overload;
- owner deskilling;
- provider outages;
- provider behavior changes;
- subscription exhaustion;
- corrupted state;
- incomplete handoffs;
- model updates;
- dependency changes;
- self-modification drift;
- and a compromised improvement mechanism.

## Phase E — Synthesize

Only after research, divergence, and attack should a final architecture be
selected or synthesized.

The final architecture may:

- select one candidate;
- combine parts of multiple candidates;
- reject all candidates and create another;
- contain several architectural modes;
- or use different structures for different consequence classes.

Explain:

- why the selected architecture won;
- which alternatives were rejected;
- which mechanisms were retained from each;
- which evidence affected the decision;
- what remains uncertain;
- what trade-offs were accepted;
- and what discoveries would cause the decision to be reopened.

## Phase F — Complete the design

Transform the selected architecture into a complete system specification.

Do not remain at the level of diagrams, principles, aspirations, or agent names.

Define the actual responsibilities, states, contracts, data movement,
permissions, failure behavior, evaluations, interfaces, and implementation
boundaries.

## Phase G — Review the complete planning package

Run independent architecture-neutral reviews.

Revise the planning package until the reviews find no unresolved issue that
blocks responsible implementation of the complete system.

## Phase H — Build the complete system

After the complete planning package passes review, transition into full
implementation.

Do not stop after delivering the planning document.

---

# 8. MINIMUM COMPLETE PLANNING PACKAGE

The final planning package must include, but is not limited to, all sections
below.

This is a minimum completeness contract, not a required ontology.

If research discovers better categories, new primitives, new layers, missing
deliverables, or a better structure, add or reorganize them.

Do not omit the required substance merely because the structure changes.

## 8.1 Vision

Define:

- the core ambition;
- intended users;
- founder and owner responsibilities;
- vision invariants;
- desired transformation;
- value created;
- non-delegable responsibilities;
- explicit non-goals;
- boundaries;
- unacceptable outcomes;
- measures of failure;
- known costs of the vision;
- and what must remain true as the architecture changes.

## 8.2 Problem framing

Define:

- users and stakeholders;
- jobs to be done;
- operating environments;
- categories of missions, goals, projects, and tasks;
- current alternatives;
- current limitations;
- user pain;
- system boundaries;
- external dependencies;
- assumptions;
- contradictions;
- unresolved questions;
- founder decisions;
- and conditions under which the problem itself should be reframed.

## 8.3 Evidence map

Create a structured map of:

- researched systems;
- academic findings;
- primary sources;
- industry practices;
- organizational patterns;
- architectural patterns;
- benchmarks;
- known failures;
- conflicting evidence;
- outdated evidence;
- unsupported claims;
- open research questions;
- and implications for the design.

Every consequential architectural decision must be traceable to evidence,
reasoning, a founder constraint, or a clearly labeled hypothesis.

## 8.4 Capability map

Map everything the system must be capable of across the complete lifecycle of:

- starting a project;
- discovering a problem;
- researching a market;
- selecting an opportunity;
- defining a product;
- designing it;
- building it;
- testing it;
- launching it;
- operating it;
- distributing it;
- selling it;
- supporting customers;
- managing money;
- managing legal and regulatory obligations;
- managing privacy and security;
- learning;
- improving;
- scaling;
- pausing;
- recovering;
- changing direction;
- and shutting down responsibly.

For each capability, define:

- purpose;
- inputs;
- outputs;
- dependencies;
- authority;
- consequence class;
- evidence produced;
- evaluation method;
- implementation mode;
- failure behavior;
- and removal or replacement criteria.

## 8.5 Architecture alternatives

Provide materially different architecture candidates and a structured
trade-off analysis.

Do not rank candidates by familiarity.

Evaluate them against architecture-neutral properties.

## 8.6 Selected architecture

Specify:

- logical architecture;
- runtime architecture;
- deployment architecture;
- data architecture;
- trust architecture;
- permission architecture;
- integration architecture;
- interaction architecture;
- and improvement architecture.

Use layers where they help, but do not force a layered architecture if another
structure is better.

Possible concerns that must be addressed, whether or not they become distinct
layers, include:

- intent;
- governance;
- planning;
- execution;
- evidence;
- memory;
- knowledge;
- evaluation;
- improvement;
- communication;
- external integrations;
- and human surfaces.

For every component, define:

- why it exists;
- responsibility;
- non-responsibilities;
- owner;
- interfaces;
- inputs;
- outputs;
- state;
- lifecycle;
- dependencies;
- trust boundary;
- permissions;
- failure modes;
- observability;
- evaluation;
- scaling behavior;
- versioning;
- replacement path;
- and removal criteria.

## 8.7 Agent operating model

Define:

- what an agent is in this system;
- when an agent should exist;
- when an agent should not exist;
- temporary versus persistent agents;
- generalist versus specialist agents;
- planning versus executing agents;
- producer versus evaluator roles;
- model selection;
- context construction;
- tool access;
- delegation;
- sub-agent creation;
- orchestration;
- communication;
- disagreement;
- arbitration;
- retries;
- timeouts;
- interruption;
- recovery;
- termination;
- and refusal.

Define when work should instead use:

- deterministic code;
- a fixed workflow;
- a state machine;
- a queue;
- a scheduled job;
- a human;
- or an external professional.

## 8.8 Agents and organizational structures

If persistent or named agents are justified, define:

- their roles;
- responsibilities;
- authority;
- prohibited actions;
- context boundaries;
- memory access;
- tool access;
- communication paths;
- evaluation;
- creation;
- modification;
- promotion;
- demotion;
- suspension;
- replacement;
- and deletion.

Do not create agents merely to imitate human departments.

Determine whether human organizational structures are useful, harmful, or
unnecessary for each kind of work.

## 8.9 Skills

Define:

- the unit of reusable know-how;
- skill format;
- skill metadata;
- discovery;
- selection;
- loading;
- composition;
- conflict resolution;
- versioning;
- testing;
- evaluation;
- ownership;
- provenance;
- freshness;
- deprecation;
- removal;
- and the relationship between skills, prompts, tools, workflows, policies,
  examples, and code.

Prevent an expanding skill library from making selection progressively worse.

## 8.10 Tools and external connections

Define:

- MCP and non-MCP tools;
- tool registration;
- capability discovery;
- tool selection;
- argument validation;
- output validation;
- permission scoping;
- credentials;
- rate limits;
- retries;
- idempotency;
- timeouts;
- degraded operation;
- provider changes;
- malicious output handling;
- audit trails;
- connection approval;
- connection removal;
- dependency detection;
- and compensation for irreversible or partially completed actions.

Treat external content returned by tools as untrusted data unless explicitly
validated.

Do not allow tool output to silently become system instruction.

## 8.11 Schemas and contracts

At minimum, define schemas and state transitions for:

- Vision;
- Principle;
- Constraint;
- Goal;
- Commitment;
- Mission;
- Project;
- Workstream;
- Task;
- Dependency;
- Blocker;
- Agent;
- Role;
- Skill;
- Tool;
- Connection;
- Workflow;
- Run;
- Step;
- Handoff;
- Message;
- Context Manifest;
- Memory;
- Knowledge Item;
- Claim;
- Source;
- Evidence;
- Artifact;
- Decision;
- Alternative;
- Assumption;
- Unknown;
- Disagreement;
- Approval;
- Permission;
- Consequence Class;
- Budget;
- Evaluation;
- Review;
- Defect;
- Incident;
- Experiment;
- Change Proposal;
- Configuration Version;
- Deployment;
- and Rollback.

For every schema, define:

- identity;
- required fields;
- ownership;
- source of truth;
- lifecycle;
- state transitions;
- invariants;
- versioning;
- relationships;
- authorization;
- retention;
- deletion;
- and audit behavior.

## 8.12 Memory, knowledge, grounding, and context

Define separate treatment where necessary for:

- working context;
- session history;
- episodic memory;
- semantic knowledge;
- procedural knowledge;
- skills;
- founder preferences;
- founder corrections;
- decisions;
- assumptions;
- failures;
- customer information;
- organizational history;
- and external evidence.

Define:

- who can read;
- who can write;
- who can correct;
- who can delete;
- provenance;
- freshness;
- expiration;
- contradiction handling;
- confidence;
- retrieval;
- ranking;
- context assembly;
- context reduction;
- loss during summarization;
- contamination prevention;
- privacy;
- and selective forgetting.

Every significant run should have a context manifest containing:

- what context was loaded;
- why it was loaded;
- where it came from;
- its version;
- its age;
- its trust level;
- what was omitted;
- what was summarized;
- and what may have been lost.

## 8.13 Evidence and truth architecture

Define how the system distinguishes:

- observation;
- measurement;
- external claim;
- inference;
- hypothesis;
- decision;
- opinion;
- preference;
- and unknown.

Define:

- evidence requirements by consequence class;
- provenance;
- citation;
- source disagreement;
- source incentives;
- claim expiration;
- revalidation;
- negative evidence;
- missing evidence;
- and correction of long-held false beliefs.

## 8.14 Evaluation system

Define evaluation at multiple levels:

- model;
- prompt;
- agent;
- skill;
- tool call;
- handoff;
- workflow;
- run;
- artifact;
- decision;
- project;
- business outcome;
- safety outcome;
- and owner-attention outcome.

Include:

- fixed evaluation cases;
- changing real-work cases;
- adversarial cases;
- regression tests;
- negative controls;
- repeated trials for stochastic behavior;
- trace evaluation;
- outcome evaluation;
- process evaluation;
- evidence-quality evaluation;
- human calibration;
- independent evaluators;
- evaluator disagreement;
- evaluator drift;
- and evaluation of the evaluators.

Do not use one aggregate score as the definition of success.

Do not allow an evaluator to determine the architecture by rewarding familiar
patterns.

## 8.15 Risk register and threat model

At minimum, cover:

- assets;
- actors;
- attackers;
- trust boundaries;
- attack surfaces;
- misuse;
- accidental failure;
- misunderstood intent;
- external manipulation;
- prompt injection;
- data exfiltration;
- credential compromise;
- privilege escalation;
- memory poisoning;
- supply-chain compromise;
- malicious dependencies;
- malicious tools;
- malicious agents;
- evaluator corruption;
- financial loss;
- reputational damage;
- privacy harm;
- legal exposure;
- physical-world consequences where relevant;
- owner overload;
- loss of competence;
- and loss of control.

For every material risk, define:

- cause;
- likelihood or uncertainty;
- consequence;
- detection;
- prevention;
- containment;
- rollback or compensation;
- residual risk;
- accountable owner;
- and escalation requirement.

## 8.16 Permissions, approvals, and consequence model

Define consequence classes based on:

- reversibility;
- financial impact;
- public visibility;
- legal effect;
- customer effect;
- privacy;
- security;
- data sensitivity;
- system integrity;
- and blast radius.

For each class, define:

- required identity;
- least privilege;
- allowable tools;
- sandboxing;
- budget;
- evidence requirements;
- review requirements;
- approval requirements;
- monitoring;
- rollback;
- and post-action verification.

No agent may grant itself greater authority.

No component may silently inherit all permissions of the process that created
it.

## 8.17 Reliability and durable execution

Define:

- scheduling;
- queues;
- concurrency;
- locking;
- leases;
- heartbeats;
- checkpointing;
- retries;
- retry classification;
- idempotency;
- deduplication;
- partial completion;
- compensation;
- resume;
- cancellation;
- stuck-run detection;
- loop detection;
- failure isolation;
- graceful degradation;
- backup;
- restore;
- disaster recovery;
- and verification that recovery actually worked.

## 8.18 Human operating system

Design how the founder and other authorized people:

- express intent;
- create goals;
- change direction;
- make commitments;
- review decisions;
- grant approvals;
- inspect evidence;
- understand uncertainty;
- intervene during work;
- pause work;
- stop actions;
- resume work;
- correct the system;
- teach taste;
- manage attention;
- and recover after being absent.

Define how the system avoids turning the founder into a full-time reviewer.

## 8.19 Mission Control and surfaces

Do not begin from a list of attractive pages.

Derive every surface from a real operator need.

Consider, but do not blindly assume, surfaces such as:

- mission and goal control;
- project portfolio;
- task and dependency graph;
- timeline;
- decision inbox;
- approval queue;
- evidence explorer;
- live run view;
- agent and capability canvas;
- memory and knowledge explorer;
- cost and capacity view;
- incident center;
- evaluation center;
- system-change center;
- architecture view;
- terminal;
- coding environment;
- mobile briefing;
- daily and weekly review;
- and a pixel-art company view for presence, comprehension, and enjoyment.

The pixel-art company may be playful, but it must represent real system state
rather than invent activity.

Every surface must define:

- user;
- job;
- source of truth;
- state shown;
- uncertainty shown;
- available actions;
- permissions;
- latency;
- failure behavior;
- accessibility;
- mobile behavior;
- and how it prevents false confidence.

The UI must be a projection of authoritative system state.

Do not make the visual interface the only place where important state exists.

## 8.20 Terminal and coding surface

Reimagine the terminal rather than merely embedding an existing shell.

Determine how it should support:

- conversation;
- commands;
- plans;
- live execution;
- parallel workers;
- code changes;
- diffs;
- tests;
- approvals;
- evidence;
- failures;
- checkpoints;
- environment state;
- context inspection;
- task switching;
- interruption;
- and recovery.

Determine what should remain a traditional terminal, what should become a new
interaction primitive, and what should be available through other surfaces.

## 8.21 Economics and capacity

The current internal operating assumption is:

- approximately $200 per month for Claude Code access;
- approximately $200 per month for Codex access;
- internal work should primarily use these subscription-based coding-agent
  environments;
- pay-per-token APIs are not expected to be the default execution path for
  internal operation;
- APIs may still be required for supported unattended services, customer-facing
  products, or workloads that cannot responsibly or legally rely on personal
  subscriptions.

Do not design the internal system as though every model call has a simple
pay-per-token price.

Design a subscription-capacity operating model covering:

- provider;
- account identity;
- allowed usage;
- authentication method;
- current allowance;
- reset windows;
- weekly or session limits;
- concurrency;
- capacity pressure;
- queued work;
- expected workload;
- fallback behavior;
- provider switching;
- interruption;
- resume;
- and additional credits or API spending.

Track both:

- money spent;
- and scarce capacity consumed.

The absence of a per-call charge does not mean capacity is unlimited.

Prevent silent fallback from a subscription path to a metered API path.

Require explicit policy for any additional paid usage.

Also model:

- infrastructure;
- storage;
- databases;
- backups;
- observability;
- search;
- external services;
- domains;
- communication platforms;
- security services;
- and the opportunity cost of founder attention.

Separate the economics of the founders' internal system from the economics of a
future customer-facing product.

Do not assume that personal subscription credentials may be shared, proxied,
resold, embedded into a service, or used on behalf of other users.

Create provider and execution adapters so that the system's goals, memory,
evidence, tasks, and workflows do not depend on one authentication or billing
mechanism.

## 8.22 Self-improvement

Define how the system may propose improvements to:

- prompts;
- instructions;
- skills;
- tools;
- workflows;
- schemas;
- routing;
- memory policies;
- evaluations;
- agents;
- interfaces;
- and architecture.

A self-improvement proposal must include:

- observed problem;
- evidence;
- proposed change;
- affected components;
- expected benefit;
- possible harm;
- tests;
- rollout plan;
- monitoring;
- rollback plan;
- and authority required.

Do not allow unreviewed self-modification of:

- approval policy;
- identity system;
- permission boundaries;
- audit records;
- evidence history;
- incident records;
- protected founder constraints;
- or the mechanism that decides whether a self-change is safe.

The system may improve itself continuously, but the improvement mechanism must
be more controlled than ordinary task execution.

## 8.23 Full implementation plan

Provide:

- final repository structure;
- services and modules;
- runtime processes;
- deployment topology;
- data stores;
- schemas;
- interfaces;
- dependencies;
- infrastructure;
- environments;
- secrets handling;
- test strategy;
- evaluation strategy;
- observability;
- migration;
- backup;
- recovery;
- security controls;
- release process;
- and dependency-ordered implementation stages.

For every implementation stage, define:

- components built;
- dependencies;
- contracts implemented;
- tests;
- integration requirements;
- completion conditions;
- risks;
- and relationship to the complete final system.

## 8.24 Coverage matrix

Create a traceability matrix covering every field and every meaningful question
in THE-PATH-TO-THE-VISION.md.

For each item, record:

- field;
- question or concern;
- status;
- answer location;
- relevant architecture component;
- supporting evidence;
- decision;
- remaining uncertainty;
- owner;
- and implementation location.

Allowed statuses are:

- Answered.
- Intentionally refused.
- Unresolved but non-blocking.
- Requires founder decision.
- Requires external professional.
- Requires further evidence.
- Superseded by a better framing.
- Not applicable, with explanation.

Silence is not an allowed status.

---

# 9. ARCHITECTURE-NEUTRAL QUALITY EVALUATION

Do not define success in a way that presupposes:

- a specific architecture;
- a specific number of agents;
- a hierarchy;
- a workflow pattern;
- a user interface;
- a framework;
- a database;
- a programming language;
- a provider;
- or a deployment model.

Evaluate the planning package using architecture-neutral properties.

At minimum, evaluate:

## Completeness

Does the plan address the complete ambition, the complete company lifecycle,
the machinery of the agent system, the human operating system, and every field
in the vision document?

## Traceability

Can every major decision be traced to:

- a problem;
- evidence;
- alternatives;
- assumptions;
- trade-offs;
- and consequences?

## Internal coherence

Do the architecture, schemas, agents, workflows, permissions, memory,
evaluation, interfaces, and implementation plan agree with one another?

## Evidence quality

Are important claims supported by credible evidence or clearly labeled as
hypotheses?

## Alternative depth

Were materially different structures considered and genuinely challenged?

## Vision preservation

Does the design preserve the original ambition, or did it narrow into a coding
tool, agent dashboard, workflow product, or another smaller system?

## Unknown integrity

Are unresolved matters visible, or were they converted into hidden assumptions?

## Adversarial robustness

Did independent reviewers find and test technical, human, business, security,
legal, operational, and long-term failure modes?

## Operational feasibility

Can the system run, recover, continue across sessions, handle limits, and
produce trustworthy evidence?

## Buildability

Is the plan detailed enough to implement without inventing foundational
architecture during construction?

## Responsibility

Can a founder responsibly understand and stand behind consequential work they
did not personally observe?

## Changeability

Can components, providers, models, tools, and assumptions change without
destroying the whole system?

Treat these as a multidimensional diagnostic.

Do not combine them into one score.

Do not optimize the architecture to impress the evaluator.

The evaluator must be capable of concluding that the work is:

- incomplete;
- unsupported;
- internally inconsistent;
- overfitted to existing systems;
- unsafe;
- unbuildable;
- disconnected from the vision;
- or not yet defensible.

Evaluation exists to discover weaknesses.

It must not determine in advance what the architecture is allowed to become.

---

# 10. PLANNING COMPLETION CONDITIONS

Planning is complete only when:

- the vision has been converted into explicit invariants and boundaries;
- the original field map has been fully covered;
- additional missing fields discovered during research have also been covered;
- major factual claims are supported or explicitly marked uncertain;
- multiple foundational architectures were seriously considered;
- the selected design has survived independent adversarial review;
- every major component has a defined responsibility and contract;
- information, control, evidence, authority, and failure flows are explicit;
- the agent/workflow/human allocation is justified;
- the permission and consequence model is complete;
- memory, knowledge, grounding, and context behavior are complete;
- evaluation and observability are designed;
- self-improvement is designed;
- the Mission Control and terminal surfaces are derived from operator needs;
- the capacity and subscription model is addressed;
- the implementation architecture is complete;
- the dependency-ordered build plan is complete;
- the coverage matrix contains no silent gaps;
- unresolved matters are non-blocking or explicitly require a founder,
  professional, or external authority;
- and independent reviewers cannot identify a missing foundational decision
  required to begin responsible full implementation.

Planning completeness does not require certainty about everything.

It requires that uncertainty be represented correctly and that no unknown
foundational decision is hidden.

---

# 11. TRANSITION TO FULL IMPLEMENTATION

Do not stop after producing the planning package.

After the planning package passes the architecture-neutral quality review,
transition into building the complete designed system.

Do not redefine the goal as:

- an MVP;
- a proof of concept;
- a disposable prototype;
- a demo;
- a toy implementation;
- a reduced version;
- a narrow coding workflow;
- a dashboard without the underlying system;
- or one vertical slice presented as the complete product.

The implementation target is the complete system described by the accepted
planning package.

A complex system may and should be built in dependency-ordered stages.

Those stages are construction units of the final system.

They are not permission to reduce the final scope.

Every implementation stage must:

- build production-intended components;
- use the final or explicitly versioned contracts;
- include security and observability;
- include automated tests;
- include relevant evaluations;
- include integration tests;
- preserve compatibility with the full architecture;
- update the evidence and decision records;
- produce recoverable state;
- and continue automatically to the next stage when its requirements are met.

Temporary scaffolding is permitted only when:

- its temporary status is explicit;
- its replacement is planned;
- no important claim of completion depends on it;
- and it cannot silently become permanent architecture.

Do not declare the system complete while planned:

- capabilities;
- components;
- integrations;
- agents;
- workflows;
- policies;
- evaluations;
- surfaces;
- recovery paths;
- or operational procedures

remain unimplemented.

---

# 12. IMPLEMENTATION DISCOVERIES MAY REOPEN THE PLAN

The planning package is authoritative but not untouchable.

Implementation may reveal:

- invalid assumptions;
- impossible contracts;
- missing state;
- unacceptable complexity;
- model limitations;
- tool limitations;
- provider limitations;
- security flaws;
- capacity problems;
- performance problems;
- user-interface problems;
- or better abstractions.

When this happens:

1. Record the discovery as evidence.
2. Identify affected decisions and components.
3. Reopen only the relevant parts of the plan.
4. Research the issue.
5. Generate and compare alternatives.
6. Review the proposed change.
7. Update dependent specifications.
8. Version the architecture.
9. Migrate existing implementation if required.
10. Resume construction.

Do not patch around a foundational design failure merely to preserve the plan.

Do not casually rewrite the vision merely to preserve the implementation.

---

# 13. REPOSITORY AND EXTERNAL-ACTION BEHAVIOR

During research and planning:

- read the repository broadly;
- inspect relevant code, documents, history, configurations, tests, issues, and
  previous plans;
- distinguish current behavior from abandoned or speculative designs;
- preserve useful evidence from previous attempts;
- but do not allow previous architecture to define the new result.

Before full implementation begins, preserve the accepted planning package and
its decision records in version control.

During implementation:

- use branches or equivalent isolation;
- make coherent commits;
- preserve buildable states where practical;
- run tests and evaluations;
- avoid destructive changes without recovery;
- protect secrets;
- record migrations;
- and keep the implementation traceable to the plan.

The directive to operate autonomously does not authorize unrestricted external
consequences.

Do not, without the required authorization:

- spend additional money;
- purchase services;
- publish publicly;
- contact customers or strangers;
- make legal commitments;
- accept contracts;
- expose private data;
- weaken security;
- delete irreplaceable information;
- deploy into a consequential production environment;
- or perform another action whose consequence class requires human approval.

Continue all safe repository-local, research, planning, testing, and
implementation work while waiting for such approval.

---

# 14. PERSISTENT WORK STATE

Maintain a durable project state containing at least:

- current phase;
- completed work;
- active work;
- next actions;
- research ledger;
- source index;
- evidence map;
- claim register;
- assumption register;
- contradiction register;
- open-question register;
- founder-decision queue;
- architecture candidates;
- decision ledger;
- risk register;
- coverage matrix;
- implementation dependency graph;
- build progress;
- test and evaluation results;
- incidents;
- migrations;
- and change history.

At every meaningful checkpoint, another capable agent with no prior context
must be able to determine:

- what the project is;
- why the current direction was chosen;
- what has already been done;
- what remains;
- what is uncertain;
- what failed;
- what must not be repeated;
- and what should happen next.

Do not rely on one model's conversational memory as the source of truth.

---

# 15. FINAL REPORTING REQUIREMENTS

When the planning phase is complete, present the founder with:

1. An executive explanation of what the system is.
2. The complete planning package.
3. The selected architecture and its alternatives.
4. The evidence and decision maps.
5. The risks and unresolved decisions.
6. The full implementation plan.
7. The coverage matrix.
8. A clear statement that implementation is beginning.
9. The location of all durable planning artifacts.

Do not compress the final planning package into a short summary.

Make it navigable through:

- clear documents;
- indexes;
- cross-links;
- diagrams;
- tables;
- schemas;
- and machine-readable artifacts where useful.

During implementation, provide progress through durable state and meaningful
milestones rather than requiring the founder to supervise every step.

At final system completion, provide:

- the implemented architecture;
- repository map;
- operating instructions;
- deployment state;
- security model;
- permission model;
- evaluation results;
- known limitations;
- unresolved residual risks;
- recovery instructions;
- and traceability from vision to implementation.

---

# 16. FINAL OVERRIDING INSTRUCTION

Think beyond the current machine, current repository, current tools, current
frameworks, and current agent patterns.

New tools, dependencies, services, local software, frameworks, and
infrastructure may be researched, proposed, installed, created, or integrated
when justified and permitted.

Do not mistake ambition for vagueness.

Convert the ambition into explicit:

- responsibilities;
- capabilities;
- architecture;
- contracts;
- state;
- authority;
- evidence;
- evaluations;
- risks;
- interfaces;
- and implementation.

Do not stop at ideation.

Do not stop at research.

Do not stop at architecture.

Do not stop at planning.

Do not stop at an MVP.

Discover what the complete system must be, design it rigorously, preserve the
uncertainty and disagreements honestly, and then build the complete system in
dependency order until the accepted design has been implemented, integrated,
evaluated, secured, documented, and made operable.

If the current framing is too small, expand it.

If the current abstractions are wrong, replace them.

If an important field is missing, add it.

If the evidence contradicts the plan, reopen the plan.

If a familiar solution limits the vision, do not use it merely because it is
familiar.

The objective is not to reproduce an existing agent framework.

The objective is to discover and build the system required for one responsible
person or a small founding team to direct work at a scale they could not
personally perform or observe, while preserving intent, truthfulness,
competence, control, evidence, and responsibility.
