# Lane · skills · 2026-09-05

## Questions answered

What the largest agent systems ship as skill libraries, in what format, under what licence, how they load them, and what mechanism creates or retires a skill. All fetches 2026-09-05. Licences below were read from the LICENSE file where the row says so, and marked UNVERIFIED where they were not.

## Findings (numbered)

**1 · The SKILL.md standard is now a published, versionable spec with hard limits, not a convention.** `https://agentskills.io/specification` — required `name` (max 64 chars, `a-z0-9-`, "Must match the parent directory name") and `description` (max 1024); optional `license`, `compatibility` (max 500), `metadata`, and `allowed-tools` — "A space-separated string of tools that are pre-approved to run… Experimental". Confidence **H**.

**2 · Progressive disclosure is specified numerically.** Same URL: "**Metadata** (~100 tokens): The `name` and `description` fields are loaded at startup for all skills"; "**Instructions** (< 5000 tokens recommended)"; "Keep your main `SKILL.md` under 500 lines." This is the same two-tier shape the local routers implement, and the local `CURATION.yml` size rule ("body under 500 lines") matches the spec line for line. Confidence **H**.

**3 · The spec ships a validator.** "Use the [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) reference library to validate your skills: `skills-ref validate ./my-skill`". I did not fetch that repo; its licence is UNVERIFIED. Confidence **H** for the line, **L** for anything about the tool.

**4 · Governance is explicitly multi-vendor.** `https://agentskills.io` — "The Agent Skills format was originally developed by Anthropic, released as an open standard, and has been adopted by a growing number of agent products." The client showcase on that page enumerates ~47 harnesses with per-product skill docs, including Gemini CLI, ChatGPT & Codex, Cursor, GitHub Copilot, VS Code, OpenCode, Goose, Letta, Amp, Factory, Kiro, Roo Code, Mistral Vibe, Databricks, Snowflake, Pulumi, Laravel Boost. Confidence **H**.

**5 · `anthropics/skills` is small and is a reference corpus, not a library.** `https://github.com/anthropics/skills/tree/main/skills` — **19 skill directories**: academy-guide, algorithmic-art, brand-guidelines, canvas-design, claude-api, discernment-nudge, doc-coauthoring, docx, frontend-design, internal-comms, mcp-builder, pdf, pptx, skill-creator, slack-gif-creator, theme-factory, web-artifacts-builder, webapp-testing, xlsx. Repo tree is `.claude-plugin/`, `skills/`, `spec/`, `template/`, `.gitignore`, `README.md`, `THIRD_PARTY_NOTICES.md`. 174.4k stars, 54 commits. Confidence **H** for the list; date of last commit not rendered — see Gaps.

**6 · `anthropics/skills` has NO LICENSE file at the repository root, and this corrects the prior catalogue's "check".** The tree listing above contains no LICENSE. The only licence statement is in the README: "Many skills in this repo are open source (Apache 2.0). We've also included the document creation & editing skills… in the skills/docx, skills/pdf, skills/pptx, and skills/xlsx subfolders. These are source-available, not open source". Also: "**These skills are provided for demonstration and educational purposes only.**" Per-skill LICENSE files were not checked. Confidence **H** that no root LICENSE exists, **M** on the effective terms.

**7 · The vendor ships a skill creator with a real eval loop, and it is the most complete "skill from a task" mechanism found.** `https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md` — frontmatter: "description: Create new skills, modify and improve existing skills, and measure skill performance." Its process: capture intent → interview → write SKILL.md → **draft 2-3 realistic prompts into `evals/evals.json`** → **run with-skill and baseline runs in parallel** and grade assertions via `eval-viewer/generate_review.py` → improve → `scripts/run_loop` to optimise the description for triggering accuracy → `scripts/package_skill` to emit a `.skill` file. `scripts/aggregate_benchmark` writes `benchmark.json`. Confidence **H**.

**8 · Codex reads SKILL.md, and the directory is `.agents/skills`, NOT `.codex/skills`.** `https://developers.openai.com/codex/skills/` 308-redirects to `https://learn.chatgpt.com/docs/build-skills`. Search order quoted: `"$CWD/.agents/skills"`, `"$CWD/../.agents/skills"`, `"$REPO_ROOT/.agents/skills"`, `"$HOME/.agents/skills"`, `"/etc/codex/skills"`, plus bundled system skills from OpenAI. Collisions are not merged: "if two skills share the same name, Codex doesn't merge them; both can appear in skill selectors." Loading: "ChatGPT and Codex start with each skill's name and description, then load the full SKILL.md instructions when they decide to use that skill." Compatibility stated: skills "build on the open agent skills standard". Confidence **H**.

**9 · Codex has two skill-creation mechanisms, one of them from a demonstration.** Same URL: `$skill-creator` "asks what the skill does, when it should trigger, and whether it should stay instruction-only or include scripts"; Record & Replay can "draft a reusable skill from the demonstration." Confidence **H**.

**10 · Gemini CLI reads SKILL.md and shares the `.agents/skills` path with Codex.** `https://geminicli.com/docs/cli/skills/` — four discovery tiers: built-in, extension skills, user `~/.gemini/skills/` or `~/.agents/skills/`, workspace `.gemini/skills/` or `.agents/skills/`. "At the start of a session, Gemini CLI scans the discovery tiers and injects the name and description of all enabled skills into the system prompt", then activates via an `activate_skill` tool "requiring user consent before injection". Extensions are the outer package that can bundle skills. Confidence **H**. Frontmatter fields and built-in count are not on that page.

**11 · One directory, `.agents/skills`, is read by both Codex and Gemini CLI.** Findings 8 and 10 together. Claude Code reads `.claude/skills`. Confidence **H**.

**12 · This repo's upstream has grown from 147 to 2,111+ and now ships an MCP for discovery.** `https://github.com/sickn33/antigravity-awesome-skills`, now presenting as "Agentic Awesome Skills" — "2,111+ skills across development, testing, security, infrastructure, product, and marketing." Layout `skills/<skill-name>/SKILL.md`; 2,670 commits; 46k stars. Targets "Claude Code, Cursor, Gemini CLI, Codex CLI, Autohand Code, Antigravity IDE, Antigravity CLI, Kiro CLI, GitHub Copilot, OpenCode, AdaL CLI". Discovery is via an **AAS Core MCP** offering "complete local catalog search, agent-owned selection, stack validation, and planning", or `npx agentic-awesome-skills --[tool-flag]`. Confidence **H**.

**13 · The local `SKILLS_SOURCE.md` install command names a package the upstream no longer advertises.** Local file line 20 says `npx antigravity-awesome-skills --path .claude/skills`; the upstream README advertises `npx agentic-awesome-skills --[tool-flag]`. Whether the old name still resolves on npm is UNVERIFIED. Confidence **M**.

**14 · The upstream has a two-part gate on new skills.** Same URL: "Validate with `npm run validate` before opening a PR", and "A `skill-review` automated check runs on PRs modifying skills, though manual logic review remains required." Confidence **M** (rendered summary, not the raw workflow file).

**15 · `obra/superpowers` is a methodology plugin with a closed contribution door and a named eval harness.** `https://github.com/obra/superpowers` — ~14 skills in four README categories (Testing, Debugging, Collaboration, Meta) under `/skills`; 681 commits; 281.9k stars. "Installation differs by harness. If you use more than one, install Superpowers separately for each one." Authoring guide at `skills/writing-skills/SKILL.md`. Retirement/growth policy: "**we don't generally accept contributions of new skills.**" Evals: "Skill-behavior tests use the drill eval harness from superpowers-evals, cloned into evals/". Confidence **H** on the quotes, **L** on the count of 14 — it is read off README categories, not a directory listing. UNVERIFIED as a directory count.

**16 · `wshobson/agents` ships the largest multi-harness bundle found and the only three-tier eval.** `https://github.com/wshobson/agents` — "**94 plugins**, **202 agents**, **183 skills**, **105 commands**"; 39.4k stars, 4.2k forks, 569 commits. Markdown is the "single source-of-truth" and harness-native artifacts are generated from it (`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `.cursor-plugin/`, `.cursor/rules/`, `.agents/plugins/`). Install paths: `/plugin marketplace add wshobson/agents`, `gh skill install wshobson/agents`, `npx skills add wshobson/agents`. Its `plugin-eval` has three layers: "Static — deterministic structural analysis (<2s, free)", "LLM Judge — semantic evaluation across 4 dimensions (~30s)", "Monte Carlo — statistical reliability via 50-100 simulated runs". Maintenance: `make validate` and `make garden` for "drift/dead-link detection". Confidence **H**.

**17 · Claude Code plugin marketplaces are the distribution primitive, and they bundle more than skills.** `https://code.claude.com/docs/en/plugin-marketplaces` — `.claude-plugin/marketplace.json` with required `name`, `owner`, `plugins`. A plugin may bundle "Skills… Agents… Commands… Hooks… MCP Servers… LSP Servers". Validation: `claude plugin validate .` checks "JSON syntax, duplicate plugin names, source path traversal issues, `plugin.json` validity for local path sources, version matching". `anthropic-agent-skills` and `agent-skills` are reserved names. Confidence **H**.

**18 · Anthropic distributes its own corpus through that mechanism.** `anthropics/skills` README: "`/plugin marketplace add anthropics/skills`", then "`/plugin install document-skills@anthropic-agent-skills`" or "`example-skills@anthropic-agent-skills`". Its only stated test discipline is a sentence: "Always test skills thoroughly in your own environment before relying on them for critical tasks." Confidence **H**.

**19 · The two VoltAgent lists are indexes, not libraries.** `https://github.com/VoltAgent/awesome-claude-code-subagents` — "158+ Claude Code subagents across 10 categories", 24.9k stars, 506 commits, "MIT License - see LICENSE", with "All subagents are provided 'as is' without warranty. We do not audit or guarantee the security or correctness of any subagent." `https://github.com/VoltAgent/awesome-claude-skills` now presents as awesome-agent-skills — badge "Skills-1497+", 33.8k stars, links rather than hosts, "Hand-picked, not AI-slop generated", grouped by originating organisation. Confidence **H** on content, licences UNVERIFIED (see table).

**20 · Nobody found retires a skill by non-use.** Across all seven projects the only retirement mechanisms are `make garden` (drift and dead links, wshobson) and a closed contribution door (superpowers). No project ships a usage counter or an unused-for-N-days expiry. Confidence **M** — this is an absence across the sources I fetched, not a proof.

## Licences (table)

| Project | LICENSE URL | Licence | Quoted line |
|---|---|---|---|
| anthropics/skills | none at root — tree shows `.gitignore`, `README.md`, `THIRD_PARTY_NOTICES.md` only | **No root LICENSE file.** README-stated only | "Many skills in this repo are open source (Apache 2.0)" … "These are source-available, not open source" |
| obra/superpowers | `https://github.com/obra/superpowers/blob/main/LICENSE` | MIT | "MIT License / Copyright (c) 2025 Jesse Vincent" |
| sickn33/antigravity-awesome-skills | `https://github.com/sickn33/antigravity-awesome-skills/blob/main/LICENSE` | MIT (plus a separate `LICENSE-CONTENT`, not fetched) | "MIT License / Copyright (c) 2026 Antigravity User" |
| wshobson/agents | `https://github.com/wshobson/agents/blob/main/LICENSE` | MIT | "MIT License / Copyright (c) 2024 Seth Hobson" |
| VoltAgent/awesome-claude-code-subagents | not fetched | MIT **UNVERIFIED** | README only: "MIT License - see LICENSE" |
| VoltAgent/awesome-claude-skills | not fetched | MIT **UNVERIFIED** | file listing only |
| agentskills/agentskills (spec + skills-ref) | not fetched | **UNKNOWN** | — |

## Skill creators found

| Mechanism | Project | URL | In → out |
|---|---|---|---|
| `skill-creator` skill | anthropics/skills | `raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md` | In: user intent, triggering contexts, edge cases, success criteria. Out: a packaged `.skill` (SKILL.md + scripts/references/assets) plus `evals/evals.json`, graded with-skill-vs-baseline runs, `benchmark.json`, and a description tuned by `scripts/run_loop` |
| `$skill-creator` command | OpenAI Codex | `learn.chatgpt.com/docs/build-skills` | In: answers to "what the skill does, when it should trigger, and whether it should stay instruction-only or include scripts". Out: a skill directory under `.agents/skills` |
| Record & Replay | OpenAI Codex | same | In: a recorded demonstration. Out: "draft a reusable skill from the demonstration" |
| `writing-skills` skill | obra/superpowers | `github.com/obra/superpowers` (`skills/writing-skills/SKILL.md`) | In: an authoring intent. Out: a skill, tested by the `drill` harness from `superpowers-evals` |
| `plugin-eval` | wshobson/agents | `github.com/wshobson/agents` | In: a candidate plugin. Out: three graded layers — static, LLM judge across 4 dimensions, Monte Carlo over 50-100 runs |
| `skills-ref validate` | agentskills/agentskills | `agentskills.io/specification` | In: a skill directory. Out: pass/fail on frontmatter and naming |

## What this changes against FINAL-PLAN §11/§16.2

Facts only. §11.3 is the row set I could read; §16.2 I could not — see Gaps.

- **§11.3, "the 134 curated skills… move whole into `keel/holding/skills/`, which nothing reads."** The upstream those 134 came from now advertises 2,111+ skills (finding 12) under an MIT LICENSE file (table). The holding directory's contents are a 2026-08-12 snapshot of a corpus that has grown ~14x, and re-import is licence-clear.
- **§11.3, "admission by test, not excision by argument."** Two shipped implementations of exactly that exist: `skill-creator`'s `evals/evals.json` with paired with-skill and baseline runs (finding 7), and `plugin-eval`'s three layers (finding 16). Neither was in the prior catalogue §14.
- **§11.3, "A skill that is a procedure for how to produce work does not re-enter."** The published standard's recommended body sections are "Step-by-step instructions", "Examples of inputs and outputs", "Common edge cases" (finding 1). A skill written to spec is procedural by the spec's own recommendation. The plan's field-kit schema (§11.1: four descriptive headings, no procedure) and the SKILL.md standard therefore describe different artifacts wearing the same filename.
- **§11.3, "Ninety days uncalled and it leaves."** No project fetched implements usage-based retirement (finding 20). The nearest shipped thing is dead-link and drift detection.
- **§11.1 and §11.3 assume the library is a local directory.** Two of the largest corpora are consumed through a server or a registry instead: an MCP that does "complete local catalog search, agent-owned selection, stack validation, and planning" (finding 12), and `/plugin marketplace add` bundling skills with agents, commands, hooks, MCP and LSP servers in one unit (finding 17).
- **Bearing on founder direction E, not on §11:** one path, `.agents/skills`, is read by both Codex and Gemini CLI (finding 11), and Codex does not use `.codex/skills`.
- **§11.2's anchors table:** nothing fetched changes any row.

## Gaps

1. **I did not read FINAL-PLAN §16.2 (lines 2168–2187).** It was in my brief and I exhausted the 25-call ceiling on the other inputs and the fetches. Everything above about §16.2 is absent, not covered. The only thing I know of it is §11.3's own line: "§16.2 carries the fate class of every one of the 134 from the census."
2. **Last-commit dates: none verified.** GitHub tree pages rendered commit *counts* (54, 681, 2,670, 569, 506) but no dates for any of the six repositories. Every "last commit" in the prior catalogue §14 is therefore un-refreshed by me.
3. **Two licences read from a README or a file listing, not the file:** both VoltAgent repos. `LICENSE-CONTENT` in the upstream was not fetched and may carry different terms for skill *content* than MIT does for code — material if the 2,111 are vendored.
4. **`anthropics/skills` per-skill LICENSE files not checked**, so which of the 19 are Apache 2.0 and which are source-available is inferred from one README sentence naming four directories.
5. **`obra/superpowers` skill count is README-derived (~14) and UNVERIFIED against `/skills`.**
6. **Gemini CLI frontmatter fields and built-in skill count** are not stated on its skills page.
7. **Voyager-style self-building skill libraries were not fetched at all** — no budget reached them. The founder's direction C names this class and it is uncovered here.
8. **`agentskills/agentskills`** (the spec repo and `skills-ref`) was not fetched: licence, release cadence and spec version are unknown.
9. **Star counts are as rendered** (174.4k, 281.9k, 46k, 39.4k, 33.8k, 24.9k). I did not cross-check them against the API.
10. **No claim was appended to the ledger.** No `claim-append` tool was available in this session, so every finding above is prose evidence, not a registered claim.

## Sources fetched (count) · failed fetches

**13 successful fetches**, 6 local file reads, 25 tool calls total.

Fetched: `github.com/anthropics/skills` · `github.com/anthropics/skills/tree/main/skills` · `raw.githubusercontent.com/anthropics/skills/main/README.md` · `raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md` · `agentskills.io` · `agentskills.io/specification` · `github.com/obra/superpowers` · `github.com/obra/superpowers/blob/main/LICENSE` · `github.com/sickn33/antigravity-awesome-skills` · `.../blob/main/LICENSE` · `github.com/wshobson/agents` · `.../blob/main/LICENSE` · `github.com/VoltAgent/awesome-claude-code-subagents` · `github.com/VoltAgent/awesome-claude-skills` · `code.claude.com/docs/en/plugin-marketplaces` · `geminicli.com/docs/cli/skills/` · `learn.chatgpt.com/docs/build-skills`.

**Failed: 2.** `github.com/anthropics/skills/blob/main/LICENSE.md` → HTTP 404 (there is no root LICENSE; finding 6). `developers.openai.com/codex/skills` → 308 redirect to `learn.chatgpt.com/docs/build-skills`, refetched successfully.
