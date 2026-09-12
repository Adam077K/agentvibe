> Archival provenance — 2026-09-12: The report below is preserved verbatim from the completed read-only sourcer turn. This separate builder/scribe turn writes and commits only this archive, from base commit `94fc0eba422055a4e851525fa2fa600c353f3840`; it adds no research judgment or executed-test evidence.

**Subscription-native execution is a feasible internal default, subject to explicit adapter admission.** A useful path can keep the founder’s native model login in a trusted client while restricting work to authorized context and mediated tools. Neither provider’s ordinary sandbox setting, by itself, establishes the reviewed disclosure and effective-authority contracts.

Evidence was checked on **2026-09-12**, using L04/L07/L10, technical-foundation repairs §5/§9, sanitized local help, and current primary documentation. Local versions were **Codex CLI 0.154.0** and **Claude Code 2.1.269**. I inspected no credential values, personal history or live account configuration; invoked no model; performed no isolation tests; and wrote no repository files. Documentation claims, implementation proposals and unverified guarantees are distinguished below. The living documentation generally lacks publication dates; dated support articles are identified explicitly.

**1. Supported native modes provide workable interfaces.**

| Mode | Documented capability | Admission implication |
|---|---|---|
| Codex `exec` | Noninteractive execution, JSONL events, schema-constrained final output, explicit session resume, ephemeral runs, and saved CLI authentication | Suitable for an internal adapter; continuation and successful exit do not establish current authority or business acceptance |
| Claude `-p` | Noninteractive execution, structured output and explicit session resume | Suitable for subscription-backed internal work, with startup context and tools separately controlled |
| Claude with no built-ins and explicit MCP | `--tools ""` removes built-ins; it does **not** remove MCP tools. Explicit MCP configuration can expose a broker | Provides a concrete mediation interface without giving the model a native host shell |
| Native direct-shell build worker | Both clients expose filesystem, command-network and approval controls | Potentially useful for editing/testing, but requires a verified host boundary and complete tool-surface inventory |

These interfaces are documented in [Codex noninteractive mode](https://learn.chatgpt.com/docs/non-interactive-mode), [Claude headless operation](https://code.claude.com/docs/en/headless), and [Claude custom-tool availability](https://code.claude.com/docs/en/agent-sdk/custom-tools).

**2. Model authentication and worker authority can be separated, but the separation must be real.**

**Source claims:** Codex supports ChatGPT subscription authentication and API-key authentication as distinct routes. Its configuration reference exposes `forced_login_method = "chatgpt"`. Claude’s `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` preserves credentials in the parent client while stripping recognized credentials from Bash, hooks and stdio-MCP subprocess environments. On Linux, that mode additionally gives Bash subprocesses an isolated PID namespace to prevent reading host process environments through `/proc`. [Codex authentication](https://learn.chatgpt.com/docs/auth), [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference), [Claude environment-variable reference](https://code.claude.com/docs/en/env-vars).

**Inference:** Native model authentication does not require every model-directed subprocess to possess the login credential. However, environment scrubbing alone does not prove that a subprocess cannot recover credentials from files, keychains, sockets, inherited descriptors, another process or a mounted host directory. Claude’s documentation describes recognized credentials, not arbitrary-secret completeness.

**Implementation proposal:** Keep owner authentication in the trusted native client. Give a separate execution worker only task-scoped filesystem access and, where needed, a distinct broker capability. Do not put model-login or production-tool credentials in the worker. A stdio MCP server that executes arbitrary model-supplied code in its own credential-bearing process would defeat this separation.

The §9 `AccessGraph` must therefore include the native login, its storage and refresh routes, MCP server identity, worker processes, local IPC, connector sessions and persistent execution routes—not merely the named API tokens.

**3. Codex has stronger read restrictions than the legacy sandbox names imply, with consequential configuration precedence.**

**Source claims:** Current **beta permission profiles** support minimal runtime reads, explicit filesystem roots, read/write/deny rules, and disabled command networking. Profiles do not compose with legacy sandbox settings: a loaded `sandbox_mode`, selected legacy profile or `--sandbox` flag causes the older configuration to win, unless managed `allowed_permission_profiles` requires profile use. When command networking is enabled, domain rules require the network proxy; enabling network access without that proxy permits direct network access. The documented platform implementations refuse unsupported policies in specified cases. [Codex permission profiles](https://learn.chatgpt.com/docs/permissions).

**Design consequence:** A launcher must inspect the effective profile, rather than infer confinement from its intended configuration file. A job needing confidential-source exclusion should name permitted roots explicitly. “Workspace write” principally communicates a write boundary; it is insufficient evidence that unrelated private files are unreadable.

Codex’s child environment policy supports `inherit = "none"` and explicit permitted values. The documented default skips automatic credential-name exclusions: `ignore_default_excludes` defaults to `true`. Login-shell startup is separately controllable through `allow_login_shell`; permitting it can reintroduce configuration or credentials after initial environment filtering. [Codex shell environment policy](https://learn.chatgpt.com/docs/config-file/config-advanced#shell-environment-policy).

Local help confirmed `--ignore-user-config`, which skips the base user configuration while retaining authentication, and `--ignore-rules`, which skips user/project execution-policy files. Neither means “ignore all user context.” Likewise, documented `features.shell_tool=false` disables the default shell tool; this investigation did not establish that it removes every native code-execution or filesystem surface.

**4. Claude has useful restricted-startup controls, but their differences matter.**

**Source claims:** `--restricted`, available since 2.1.248, excludes user/project/local settings, confines built-in file tools to working directories, and removes code-running tools and WebFetch unless explicitly named. Managed and explicit settings remain applicable. `--safe-mode` preserves normal authentication while suppressing customary context and integrations, including CLAUDE.md, memory, skills, plugins and MCP. Managed policy can still supply hooks and certain helper commands. [Claude CLI reference](https://code.claude.com/docs/en/cli-reference).

Conversely, ordinary `claude -p` can load project hooks and MCP configuration without a workspace-trust prompt. `--bare` avoids much automatic discovery but never reads OAuth credentials or the system keychain; it requires API or other provider authentication. **Bare mode therefore cannot be the clean subscription solution.** [Claude headless startup](https://code.claude.com/docs/en/headless#start-faster-with-bare-mode).

The newer `blockReadsOutsideWorkingDirectories` setting covers file tools and adds sandbox restrictions, but deliberately preserves files the harness needs, including some skills, plugins and CLAUDE.md. For linked worktrees, the shared Git directory remains accessible to sandboxed commands. [Claude read-boundary setting](https://code.claude.com/docs/en/settings-reference#permissions-blockreadsoutsideworkingdirectories).

**Inference:** Restricted mode is useful, but it does not establish a complete startup-context manifest. Use a dedicated, controlled client environment and a standalone checkout when shared repository metadata would cross the task boundary. Treat every retained managed hook and configuration source as part of the trusted computing base.

**5. Neither shell sandbox supplies a global disclosure or effects firewall.**

**Source claims:** Codex explicitly excludes hosted search, apps/connectors, MCP, browser/Computer Use, cloud tasks and client model/authentication traffic from its command-network proxy. Its app/MCP approval behavior can depend on tool-advertised annotations. Those annotations are not independent evidence of actual effect semantics. [Codex security and network scope](https://learn.chatgpt.com/docs/agent-approvals-security).

Claude’s Bash sandbox likewise does not govern built-in file tools or desktop computer use. Its credential protections apply to listed files and variables; there is no built-in complete credential deny list. Credential masking substitutes real credentials into requests to permitted hosts: it hides secret bytes while retaining authenticated authority. [Claude sandbox scope and credential handling](https://code.claude.com/docs/en/sandboxing).

**Inference under TF §5:** An allowed domain does not authorize an arbitrary recipient, request body, search query or claim. A masked GitHub credential can still authorize a harmful GitHub operation. Model-provider traffic remains a disclosure destination even when the worker has no network.

For direct Bash admission, Claude additionally needs `sandbox.enabled=true`, `failIfUnavailable=true`, disabled unsandboxed retries, and no unintended excluded commands. The default for `failIfUnavailable` is false, allowing warning-and-unsandboxed fallback when the sandbox cannot start. [Claude fail-closed setting](https://code.claude.com/docs/en/settings-reference#sandbox-failifunavailable).

External OS isolation or mediated execution is required wherever these native controls leave a surface outside the intended boundary. Docker sockets, permissive local services, Apple Events, shared writable startup files and weakened nested sandboxes require explicit exclusion or separate justification.

**6. Two useful paths merit implementation, without asserting tested isolation.**

**Path A — constrained native drafting and research.** Use Claude’s subscription-authenticated `-p` with safe mode, restricted mode, no built-ins, denied MCP, noninteractive permission handling and structured output. Supply an explicit package of provider-authorized documents. An external deterministic parser can accept proposed patches into an isolated workspace, run permitted checks there, and construct the next authorized input.

This supports document analysis, code drafting and bounded repair loops. It does not depend on arbitrary shell access in the login-bearing client. Safe mode’s managed-policy exceptions still require inspection. The exact combined launch configuration must be tested before admission.

**Path B — native client with mediated MCP tools.** Use a controlled clean client environment, restricted mode, no built-ins, explicit MCP configuration and exact preapproved broker tools. Implement repository reads, patch application and test execution in a separate worker. The broker must validate paths, operation schemas, context lineage, limits and outputs independently of the model.

Claude documents the availability/permission distinction needed for this interface. Its MCP administration documentation also warns that ordinary allowlists can merge with user configuration; server names alone do not establish the executable or endpoint identity. A deployed exclusive managed MCP configuration can conflict with `--strict-mcp-config` and cause startup failure. [Claude custom tools](https://code.claude.com/docs/en/agent-sdk/custom-tools), [Claude managed MCP](https://code.claude.com/docs/en/managed-mcp).

Do not assume safe mode and explicit MCP compose: safe mode documents MCP suppression. Path B needs separately verified startup controls.

For external research, authorize the query and fetch destination separately. A mixed-confidentiality model should not supply arbitrary outward queries merely because the search tool is called “read-only.”

**7. Unattended continuation is supported; authority renewal and reproducibility remain adapter obligations.**

Claude’s `dontAsk` mode denies calls that would require a prompt, while permitting actions already allowed by its permission system; it is not equivalent to “only tools explicitly listed in this invocation.” [Claude unattended permission mode](https://code.claude.com/docs/en/permission-modes#allow-only-pre-approved-tools-with-dontask-mode).

Both CLIs support explicit session identifiers. The adapter should bind those identifiers to a work order and lineage manifest; avoid “latest session” selection. Reapply current restrictions and revalidate authority before continuation. Reducing today’s tools does not remove yesterday’s confidential context from a resumed conversation.

Use fresh context when destination or purpose changes. Capture effective model, client version, configuration, tool schemas, input digests and resulting artifacts independently. Native history and JSON events aid investigation but do not establish complete reproducibility, effect reconciliation or discharge.

**8. Subscription routing remains viable, with fail-closed billing conditions.**

Anthropic’s **June 16, 2026** support article says the proposed SDK billing change was paused; `claude -p` and Agent SDK usage still draw from subscription limits. Its **May 5, 2026** authentication article says an environment API key overrides a subscription login and incurs API billing. [Current SDK/subscription notice](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), [Authentication precedence](https://support.claude.com/en/articles/12304248-manage-api-key-environment-variables-in-claude-code).

Codex documents reuse of saved CLI authentication and an advanced ChatGPT-account CI route, explicitly excluding public/open-source repositories from that workflow. [Codex automation authentication](https://learn.chatgpt.com/docs/non-interactive-mode#authenticate-in-automation).

Local help confirmed `claude auth status` with JSON output and `codex login status`; I did not fetch their live payloads. Prior L10 observations cannot attest a future launch’s account, remaining quota, credit settings or billing route.

The adapter must reject unintended API/provider overrides and stop on authentication, quota or credit-boundary failure. It must not silently purchase credits, select metered infrastructure or reuse subscription credentials through a proxy. These internal paths do not establish permission for credential sharing, resale or customer embedding.

**Remaining implementation checks**

1. **Effective launch:** verify configuration precedence, retained startup content, model/provider route and complete available-tool inventory; reject unknown fields and incompatible settings.
2. **Context canaries:** challenge parent directories, linked Git metadata, hidden files, symlinks, memory, skills and resumed context using synthetic data.
3. **Credential canaries:** test environment, credential files, keychain access, process inspection, descriptors, sockets and subprocess descendants without using real secrets.
4. **All egress surfaces:** test shell, MCP, search, browser, telemetry, feedback and client-service paths separately, including forbidden data in permitted fields.
5. **Broker identity and enforcement:** pin executable/endpoint/schema provenance; attempt path escapes, argument substitutions, unapproved operations and changed tool metadata.
6. **Failure behavior:** verify sandbox-unavailable, denied approval, lost authentication, quota exhaustion, cancellation and worker death stop safely without escalation or paid fallback.
7. **Recovery and persistence:** verify old sessions/capabilities cannot continue after revocation and inspect permitted code, hooks, schedules and shared directories for persistent authority.
8. **Useful-work trial:** demonstrate an authorized research/build task completes with these restrictions, measuring blocked work, owner intervention and maintenance burden.

**Strongest counterexample:** a permitted test process reads confidential data from an inherited environment or accessible home directory and prints it. The command has no network, but its output reaches the native client and then the model provider. Alternatively, a credential-masking proxy authenticates an unauthorized operation at an allowed API host. Both can satisfy superficial “sandboxed” and “secret hidden” checks while violating TF §5/§9.

The feasibility gap is therefore narrowed to concrete admission tests and trusted-boundary implementation. Subscription-native internal execution is supportable; complete isolation, semantic disclosure safety, uninterrupted availability and demonstrated utility remain unproven.
