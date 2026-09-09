# Research close — Lane C (measurements that spawn a `claude -p` child): twelve questions

*Lane C was dispatched 2026-09-07 on the §N questions that can only be answered by spawning a child
process. Engine: `reviewer` (has Bash). The founder authorised **one temporary background agent, to be
removed after and reported.** **This file is the lane's own return, copied verbatim from
`scratchpad/returns/research-C.md`.** Nothing is summarised or re-worded; dispositions are in
DECISIONS.md §29.*

**Two cross-cutting findings the lane was not asked for, named here because they bear on the build
plan rather than on any single question:**

1. **A nested `claude -p` child cannot start its own sandbox under the armed parent, and with
   `failIfUnavailable: true` it fails CLOSED — all Bash refused.** 6 of 6 sandbox-enabled cells.
   `sandbox.enableWeakerNestedSandbox` exists and was not tried.
2. **`SessionStart` hooks fail in a nested child under the armed sandbox** (`EPERM ... mkdir
   '~/.claude/session-env/<sid>'`) while every other hook event runs. **That is the event #56's
   shrunken payload rides on** — and therefore the delivery path v97's constitution depends on.

*R33 returned BLOCKED: it needs a LaunchAgent installed, which is a founder act. Single model family
throughout. Not an independent panel.*

*Return UPDATED by the lane 2026-09-07T07:35Z.*

---

# Lane C — the measurements that spawn a child · 2026-09-07

Twelve questions: R1, R2, R3, R4, R17, R23, R28, R29, R30, R31, R32, R33.
Machine: `Mac16,12`, 10 CPUs, 17,179,869,184 bytes RAM (16 GiB), Darwin 25.5.0, `claude` **2.1.263**.
In every EVIDENCE block below, `$S` is the lane scratchpad
`/private/tmp/claude-501/-Users-adamks-VibeCoding-agentvibe--worktrees-ceo-1-1788609834/96cbec96-76b1-41f4-94ba-3f945fbe54c8/scratchpad/laneC`,
and the driver scripts named are the ones left in place there, so every cell is re-runnable as written.

**Two findings cut across the lane; read them before the blocks.**

**(i) A `claude -p` child cannot start its own sandbox from inside an already-sandboxed parent, and with
`failIfUnavailable: true` it fails CLOSED.** 6 of 6 sandbox-enabled cells, 2 of 2 controls, no exceptions:
`EPERM: operation not permitted, listen '/tmp/claude-501/srt-mux-<pid>-1.sock'`. The mechanism is measured
directly, not inferred — the armed Bash sandbox denies `bind()`/`listen()` on **both** a unix domain socket
and a loopback TCP socket, errno 1. Consequence: every cell that measures a child's sandbox had to run with
the parent's sandbox lifted, and that is marked per block. `sandbox.enableWeakerNestedSandbox` exists as a
settings key and was **not** tried.

**(ii) `SessionStart` hooks cannot run in a nested child under the armed sandbox.** They fire and then fail:
`Failed to run: EPERM: operation not permitted, mkdir '/Users/adamks/.claude/session-env/<sid>'`. Every other
hook event tested (`UserPromptSubmit`, `Stop`, `SessionEnd`, `PreCompact`) ran normally. This is the event
#56 uses to deliver the lenses-and-playbooks index, so a dispatched child does not receive it.

---

### R1 · Is the Bash sandbox's `filesystem.allowWrite` settable per `claude -p` invocation, or project-scoped only?
STATUS:   ANSWERED
FINDING:  The whole `sandbox.filesystem` block is settable per invocation through `--settings`, and it bites.
          But **`allowWrite` only widens** — it is additive to built-in grants (cwd, temp roots) and cannot
          take one away. The narrowing verb is **`denyWrite`** (and `denyRead`), which does work per
          invocation. So the shell CAN be confined to a run's worktree, by setting cwd to the worktree and
          `denyWrite`-ing what must stay out of reach — not by writing an `allowWrite` list.
EVIDENCE: Driver `$S/r1b/driver4.py`, run with the parent sandbox lifted (see cross-cutting finding (i)).
          Two cells, identical but for the settings file; probe is `$S/r1b/probe4.py`.

            cell I — --settings with {"sandbox":{"enabled":true,"failIfUnavailable":true,
                     "filesystem":{"denyRead":["$S/r1b/secret.txt"],"denyWrite":["$S/r1b/nowrite/**"]}}}
              READ_secret       RC= 1  ERR= cat: .../r1b/secret.txt: Operation not permitted
              WRITE_denied_dir  RC= 1  ERR= touch: .../r1b/nowrite/g_I....txt: Operation not permitted
              WRITE_control_dir RC= 0  ERR=
            cell J — --settings with {"sandbox":{"enabled":true,"failIfUnavailable":true}} and no deny lists
              READ_secret       RC= 0  OUT= CANARY-R1-7f3a
              WRITE_denied_dir  RC= 0
              WRITE_control_dir RC= 0

          The additive half, from `$S/r1b/driver3.py` cells F and G: with `allowWrite` set to one directory
          only, writes to a directory NOT in that list still succeeded (`INSIDE_CWD RC= 0  OUTSIDE_CWD RC= 0`),
          and adding that directory to `allowWrite` changed nothing, because both were already covered by
          built-in grants.
CONFIDENCE: high (measured, with a positive and a negative cell)
DECIDES:  `isolation: worktree` can be made **enforced** rather than declared — but the rule to write is a
          `denyWrite` list plus cwd, not an `allowWrite` list. An `allowWrite`-only policy grants and never
          confines, which is what the repo's own `.claude/settings.json` currently expresses.
RESIDUE:  Not measured: whether a managed-settings tier can pin a `denyWrite` a child cannot widen. The
          binary carries `sandbox.filesystem.allowManagedReadPathsOnly` and states that managed settings can
          take exclusive ownership of `sandbox.filesystem`; one cell with a managed settings file would close it.

---

### R2 · Does the sandbox `credentials` block inject a secret at egress without the child reading it, and does `network` support an HTTP-method allowlist and TLS inspection?
STATUS:   ANSWERED (three parts: yes · no · yes)
FINDING:  **Credential injection at egress exists and works as described** — the child holds a masked
          placeholder and a proxy substitutes the real credential on the way out. **TLS inspection exists**
          as `sandbox.network.tlsTerminate`, and it is the *precondition* for the substitution, not an
          option beside it. **There is no HTTP-method allowlist**: the network policy is domain-scoped.
EVIDENCE: Read from the shipped binary `/Users/adamks/.local/share/claude/versions/2.1.263`, which is the
          vendor's own artifact. `curl` is denied by this session's permission rules, so no doc page was
          fetched; these are the vendor's strings, quoted verbatim.

            strings -a /Users/adamks/.local/share/claude/versions/2.1.263 \
              | grep -E 'sandbox\.(credentials|network)' | cut -c1-260 | sort -u

          "sentinel value and the proxy cannot substitute the real credential on egress, so tools needing
           these will fail to authenticate. Enable sandbox.network.tlsTerminate, or remove the mask entries"
          "SigV4 requests will be signed with the masked placeholder secret and the proxy cannot "
          "-byte buffering limit; denied. Sign the payload as UNSIGNED-PAYLOAD to stream it without
           buffering, or use an unmasked credential to have the request forwarded untouched."
          "request uses a masked credential but cannot be re-signed by the sandbox proxy; denied by policy."
          "sandbox.network.allowManagedDomainsOnly means the WebFetch domains you granted cannot open the
           sandboxed shell's network on this machine"
          "project settings (.claude/settings.json and .claude/settings.local.json) are ignored. If managed
           settings configure sandbox.filesystem at all, or list any sandbox.credentials.files deny entry,
           only managed settings can set this"

          Keys that exist: `sandbox.credentials.files`, `.awsPairs`, `.sigv4`, `.allowPlaintextInject`;
          `sandbox.network.tlsTerminate`, `.allowManagedDomainsOnly`, `.deniedDomains`; also
          `sandbox.allowUnsandboxedCommands`, `sandbox.excludedCommands`, `sandbox.enableWeakerNestedSandbox`,
          `sandbox.enableWeakerNetworkIsolation`, `sandbox.seccomp.bpfPath`, `sandbox.workspace`, `sandbox.ripgrep`.
          Method allowlist: **not found** after searching `"allowedMethods"`, `"httpMethods"`,
          `"allowMethods"`, `"method allowlist"` and enumerations of HTTP verbs. The only two `"method":`
          occurrences are unrelated minified code.
CONFIDENCE: high for the credential and TLS halves (verbatim vendor strings); medium-high for the absence of
          a method allowlist (an absence established by search over one artifact, recorded as an absence).
DECIDES:  **v68 is mostly one config change, with two exceptions that are a program we write.** Egress
          credential injection: config. TLS inspection: config (`tlsTerminate`). Method-level restriction:
          no vendor mechanism, so it is ours or it does not exist. Note also that credential masking is
          partly a **managed-settings** capability — a project-tier settings file cannot set it once managed
          settings touch `sandbox.filesystem` — so v68 may need an admin act, not just a file in the repo.
RESIDUE:  No cell was run against a real masked credential; this block is documentary. The smallest next act
          is one cell with `sandbox.credentials.files` masking a throwaway token against a request to a
          domain in `allowedDomains`, with `tlsTerminate` on, checking the child sees the sentinel.

---

### R3 · Can a non-interactive background process read a macOS keychain item without an interactive unlock, and under what ACL?
STATUS:   ANSWERED for the read; PARTIAL for the ACL
FINDING:  **Yes, provided the keychain is unlocked** — a detached, TTY-less process reads the item with no
          prompt and no interaction. If the keychain is **locked**, the read fails **immediately** with
          `errSecInteractionNotAllowed`; it does not prompt and it does not hang. The login keychain on this
          Mac is `no-timeout`, so it is unlocked from login until logout — which is why the vendor's own
          headless daemon reads it successfully in the log below.
EVIDENCE: Driver `$S/r3/kc2.py`. A throwaway keychain was created in the scratchpad; children were spawned
          with `start_new_session=True` (setsid, no controlling terminal) and `stdin=DEVNULL`. The secret
          value is redacted in the output by the driver itself.

            == UNLOCKED, detached child (setsid, no controlling tty)
              read A unlocked   rc=0 out='<VALUE-MATCHED>'      # item added with -A (any app)
              read B unlocked   rc=0 out='<VALUE-MATCHED>'      # item added with the default ACL
            == LOCKED, detached child
              read A locked     rc=152 out='' err=''
              read B locked     rc=152 out='' err=''
            == LOCKED + explicit -p unlock in the same detached invocation
              unlock with -p detached      rc=0
              read A after -p unlock       rc=0 out='<VALUE-MATCHED>'

          rc=152 is `errSecInteractionNotAllowed`. Note it returned in well under the 20 s timeout — the
          failure is immediate, not a hung prompt.

          Login keychain lock policy, read directly:
            security show-keychain-info ~/Library/Keychains/login.keychain-db
            -> Keychain "/Users/adamks/Library/Keychains/login.keychain-db" no-timeout

          Independent corroboration from the vendor's own headless supervisor, `~/.claude/daemon.log`:
            [2026-08-02T08:45:01.012Z] [supervisor] auth: no token found, will re-check keychain every 30s
            [2026-08-02T09:33:27.094Z] [supervisor] auth: token refreshed via keychain re-check retry
            [2026-08-03T05:51:02.489Z] [supervisor] auth: token found via keychain re-check
          and the one thing it cannot do headlessly:
            [2026-08-03T05:50:31.274Z] [supervisor] auth: headless daemon cannot complete OAuth — run
                                       `claude auth login` to refresh

          The armed sandbox does **not** block keychain access: a sandboxed read of the same item returned
          rc=0 with full attributes. (An earlier sandboxed failure was a wrong filename, not the sandbox.)
CONFIDENCE: high for the lock/unlock matrix (measured); medium for the ACL, see RESIDUE.
DECIDES:  §15.4's credential plan **works at 3 a.m. so long as the machine stays logged in**, and it does
          not need an interactive unlock. It fails the moment the keychain is locked, and it fails loudly
          and instantly rather than hanging — which is the good failure mode for an unattended lane. It also
          establishes the real 3 a.m. risk, and it is not the keychain: it is **OAuth refresh**, which the
          vendor's own daemon says a headless process cannot complete. **v66's keychain-held token is
          priced at zero extra machinery for the read and at one founder act for a refresh that expires.**
RESIDUE:  The ACL half is partial. Both items were read by the same `/usr/bin/security` that created them,
          so the default ACL was never actually exercised against a *different* binary; that is why item B
          succeeded. The smallest next act is one read of the same item by a second, different executable,
          which would show whether the default ACL prompts (and therefore fails detached) where `-A` does not.

---

### R4 · Can a sandboxed run reach a local model, and in which shape?
STATUS:   ANSWERED
FINDING:  **No — not in any shape a sandboxed run can use.** A local model IS running on this Mac (Ollama,
          127.0.0.1:11434). A child with `sandbox.enabled: true` cannot reach it through **Bash** (EPERM) and
          cannot reach it through **WebFetch** either — so it is not a Bash-only restriction and a non-Bash
          tool channel does not route around it. The same child with the sandbox off reaches it, HTTP 200.
          Combined with the measured `bind()` denial, **server-outside is unreachable and server-inside is
          unstartable**, so the local tier cannot be a service consumed by a sandboxed run.
EVIDENCE: Ollama is live: `lsof -nP -iTCP -sTCP:LISTEN` ->
            ollama  1471 adamks  3u  IPv4 ... TCP 127.0.0.1:11434 (LISTEN)

          Drivers `$S/r1b/driver2.py` (cells C, D) and `$S/r1b/driver3.py` (cell H), parent sandbox lifted so
          that the *child's* sandbox is the only variable. Probe is `$S/r1b/netprobe.py`.

            C — child, NO sandbox settings, Bash:
              TCP_CONNECT_11434=OK   HTTP_GET_api_tags=OK status 200 bytes 899
            D — child, {"sandbox":{"enabled":true,"failIfUnavailable":true}}, Bash:
              TCP_CONNECT_11434=FAIL PermissionError [Errno 1] Operation not permitted
              HTTP_GET_api_tags=FAIL URLError <urlopen error [Errno 1] Operation not permitted>
            H — child, same sandbox on, WebFetch instead of Bash, exact error text returned by the child:
              curl: (7) Failed to connect to 127.0.0.1 port 11434 after 0 ms: Couldn't connect to server
              Immediate connect fail for 127.0.0.1: Operation not permitted

          The inbound half, measured at the parent with `$S/r1b/sockprobe.py`:
            sandboxed:   UNIX_BIND_LISTEN=FAIL PermissionError [Errno 1] Operation not permitted
                         TCP_LOOPBACK_BIND=FAIL PermissionError [Errno 1] Operation not permitted
            unsandboxed: UNIX_BIND_LISTEN=OK    TCP_LOOPBACK_BIND=OK ('127.0.0.1', 65206)
CONFIDENCE: high (measured, both arms, two independent tool channels)
DECIDES:  **O13: the local tier is not a service.** W36 measured outbound loopback `connect()` denied; this
          adds that (a) the denial is not specific to Bash — WebFetch is denied identically, (b) inbound
          `bind()` is denied for unix sockets as well as TCP, so nothing can host a loopback endpoint from
          inside either. The surviving shapes are: run the local-model consumer with the sandbox off, or
          reach the model over a channel that is not a descendant of the sandbox.
RESIDUE:  One shape is untested and it is the interesting one: an **MCP stdio server**, which the CLI spawns
          as a child of its own process rather than of the Bash sandbox, and which might therefore reach
          127.0.0.1 while Bash cannot. Testing it means writing a small MCP server, which is building, so it
          was not done. That single cell would settle whether the local tier can be an MCP tool.

---

### R17 · What does `/goal`'s evaluator accept as a condition, and does an exit-code condition behave differently from a prose one?
STATUS:   ANSWERED
FINDING:  `/goal <condition>` accepts **one free-text string and nothing else** — there is no condition type,
          no syntax, and **no exit-code form**. The evaluator is a **model reading the transcript**, not a
          command runner: it never executes the condition. An exit-code condition and a prose condition are
          handled identically, and the exit-code arm was judged *met* on the strength of what the transcript
          narrated, with `test -f` never run. Each evaluation costs ~1,500 tokens and ~21 s.
EVIDENCE: `claude -p '/goal'` -> `No goal set. Usage: `/goal <condition>``
          Driver `$S/r17/goal.py` set two goals in two sessions, one prose, one phrased as an exit code, then
          read the `goal_status` attachments out of each session transcript:

            prose arm
              #1 met=False sentinel=True  condition="the file .../target_prose.txt exists and contains the word done"
              #2 met=False  reason="The transcript shows that the file does not exist and the agent attempted
                                    to create it but was blocked by a permission denial..."
              #3 met=True   reason="The Bash command output shows 'This task is done.' which confirms the file
                                    was created and contains the word 'done'..."
                            iterations=2  durationMs=22063  tokens=1505
            exit-code arm
              #1 met=False sentinel=True  condition="running `test -f .../target_exitcode.txt` exits with code 0"
              #2 met=True   reason="The transcript shows the file was created with the Bash command
                                    `echo \"0\" > /private/tmp/claude-501/...`"
                            iterations=1  durationMs=21230  tokens=1496

          Read the exit-code arm's `reason` closely: the evaluator concluded the condition was met because the
          transcript *mentioned* a file being written — the agent had in fact written the literal string "0"
          into it — and `test -f` was never executed by anything.
          Record shape: `{"type":"goal_status","condition":<verbatim string>,"met":bool,"reason":str,
          "iterations":int,"durationMs":int,"tokens":int}`, plus `"sentinel":true` on the first record.
          A goal also does **not survive `--resume`**: `/goal` on the next `-p` turn returned "No goal set."
          in both arms.
CONFIDENCE: high (measured, paired, with the evaluator's own reasons recorded)
DECIDES:  **O21 is settled, and against using `/goal` as a gate.** A `/goal` condition is a model judgement
          over a transcript, so it cannot carry a deterministic exit-code criterion — the plan must run the
          command itself and read the code. It also cannot hold state across `-p` invocations. Together with
          W14's three-check-in cap this leaves `/goal` as an in-session nudge, not a mechanism anything binds to.
RESIDUE:  None for the question as posed. Unmeasured and separate: whether the evaluator behaves differently
          in an interactive session where check-ins actually fire.

---

### R23 · Is there a concurrency ceiling on `claude -p` children, and does the N+1th fail loudly, queue, or degrade silently?
STATUS:   ANSWERED for the range tested; the ceiling was NOT reached
FINDING:  **No ceiling exists up to 10 concurrent `claude -p` children on this Mac** — 10 of 10 succeeded,
          none failed, none queued, none degraded. Nothing in the CLI enforces a local session count: the
          only "max concurrent sessions" knob the binary ships (`--capacity`) belongs to the **self-hosted
          cloud runner**, not to local `-p`. The one concurrency limit the product does model is for the
          **Agent tool (subagents)**, not for OS-level children. The binding constraint is therefore
          resources and rate limit, and the number to plan with is **~250 MB RSS per child** (R29).
EVIDENCE: Driver `$S/r29/conc.py`, run with the parent sandbox lifted. Each cell launches N children at once
          with an identical prompt and waits for all of them.

            N    all succeeded   wall     peak RSS per child (MB)                          free%
            1    1/1             9.2 s    247                                              53
            2    2/2            15.3 s    250, 253                                         54
            4    4/4             7.7 s    250, 252, 255, 263                               52
            6    6/6            12.2 s    252, 252, 252, 253, 264, 286                     51
            10   10/10          13.8 s    241,242,243,245,247,248,249,252,255,279          46

          Every child returned `('ok', <duration_ms>, is_error=False, 'success', <len>)`. Wall time tracks
          output length, not N: per-child `duration_ms` at N=10 ranged 4,148–10,894 ms against 5,040 ms at N=1.

          The vendor's only concurrency-limit concept, verbatim from the shipped binary, describing the
          `subagent_stats.refused` counters `depth_limit` / `concurrency_limit`:
            "Agent tool calls turned down because one of these limits was reached (other denials, such as an
             unknown agent type, are not counted). depth_limit stays near zero in practice: a subagent at the
             nesting limit is normally not offered the tool at all."
          `--capacity`, the only "Max concurrent sessions" flag, is the self-hosted runner's:
            "_capacity Max concurrent sessions this runner accepts (--capacity)."
            "[runner:warn] --capacity has no effect on a session-bound runner..."

          Rate limit is reported per run and is the other real bound. Across this entire lane the five-hour
          window moved 0.11 -> 0.13; the seven-day window sat at 0.68:
            {"five_hour": {"utilization": 0.13, ...}, "seven_day": {"utilization": 0.68, ...}}
            "overageStatus": "rejected", "overageDisabledReason": "out_of_credits"
CONFIDENCE: high for "no ceiling at N<=10" (measured); the ceiling itself is unmeasured by choice — the brief
          asked for a small count and the first sign of paging, and no paging appeared.
DECIDES:  **O71's `sessions_ceiling` should not be 3.** Nothing refuses a 4th, 6th or 10th child, so the
          board cannot rely on the runtime to refuse a drag — the bound has to be the board's own, computed
          from RSS and the rate-limit window. The failure mode to design for is not a loud refusal at N+1;
          it is a seven-day window at 0.68 with overage rejected.
RESIDUE:  The N+1 behaviour at the true ceiling is unknown because the ceiling was not reached. The smallest
          next act is a ramp past 10 on a quiet machine watching `Swapouts` and the five-hour utilization,
          which is cheap but wants a machine with fewer resident sessions than this one had (eight, 2.16 GB).

---

### R28 · Does `--restricted` ignore `--settings <file>` as it ignores the settings files?
STATUS:   ANSWERED
FINDING:  **No. `--settings <file>` still applies under `--restricted`.** The vendor says so and the
          measurement confirms it, with a positive control proving the cell can see the difference: the same
          setting delivered through a *project* settings file IS ignored under `--restricted`, while the same
          setting delivered through `--settings` is honoured.
EVIDENCE: Vendor text, verbatim from `claude --help` at 2.1.263:
            "--restricted   Restricted mode: removes the built-in tools that run commands or code ... and
             ignores user, project and local settings files (managed settings and --settings still apply;
             add --strict-mcp-config to skip MCP servers too)."

          Five cells. The observable is the model actually used, read from `modelUsage` in
          `--output-format json`; the settings payload is `{ "model": "claude-haiku-4-5" }`; no `--model`
          flag is passed, so the only thing that can move the model is the settings.

            A  no --settings, no --restricted                     -> ['claude-opus-5[1m]']   (the default)
            B  --settings model-haiku.json                        -> ['claude-haiku-4-5']
            C  --restricted --settings model-haiku.json           -> ['claude-haiku-4-5']    <- still applies
            D  project .claude/settings.json, no --restricted      -> ['claude-haiku-4-5']
            E  project .claude/settings.json, WITH --restricted     -> ['claude-opus-5[1m]']  <- ignored

          D and E are the positive control: the mechanism is observable, and `--restricted` does discard the
          project tier. C shows it does not discard `--settings`.
CONFIDENCE: high (measured, five cells, vendor text agrees)
DECIDES:  **O87.** `--restricted` and `--settings` compose: a launcher can drop the user/project/local tiers
          and still deliver exactly the policy it intends in one file. That is the shape O87 wanted, and it
          means `--restricted` does not have to be traded against configurability.
RESIDUE:  None. Untested and adjacent: whether a managed settings file overrides `--settings` in the same
          way it overrides everything else.

---

### R29 · RSS per `-p` child and the page-in point on this Mac
STATUS:   ANSWERED for RSS; the page-in point was NOT reached
FINDING:  **A `claude -p` child holds ~250 MB RSS, and it does not grow with N.** Across 23 children in five
          cells the peak per-child subtree RSS was **241–286 MB**, median ~252. No page-in point was found:
          `Swapouts` stayed at **0** in every cell and system-wide free memory never fell below 46%.
EVIDENCE: Driver `$S/r29/conc.py`, parent sandbox lifted. RSS is summed over each child's whole process
          subtree, sampled every 1.5 s; memory counters come from `vm_stat` and `memory_pressure`.

            N     peak RSS per child (MB)                            min pages free   swapins   swapouts   free%
            1     247                                                5,221 (86 MB)      12         0        53
            2     250, 253                                           4,703 (77 MB)     507         0        54
            4     250, 252, 255, 263                                16,382 (268 MB)     36         0        52
            6     252, 252, 252, 253, 264, 286                      21,692 (355 MB)     72         0        51
            10    241,242,243,245,247,248,249,252,255,279            4,435 (73 MB)      36         0        46

          Machine context, and it matters for how to read the free-memory column: 16 GiB, and **eight
          `claude` processes were already resident before the lane started, totalling 2.16 GB** — one
          long-lived interactive session alone held 802 MB. Baseline `memory_pressure` already showed
          310,630 pages in the compressor and 475,400 lifetime swapouts, so this Mac compresses routinely;
          what the zero swapouts show is that **these children added none of it**.
CONFIDENCE: high for the RSS figure (23 children, tight spread); the page-in point is honestly unmeasured —
          the brief said stop at the first sign of paging, and there was none at N=10.
DECIDES:  **O71's `sessions_ceiling` has a measured seed at last: ~250 MB per child.** It is a per-child
          constant, not a curve, so a ceiling is straightforward arithmetic against free memory rather than
          something that has to be discovered. The interim value of 3 is far too low on this hardware.
RESIDUE:  The knee. 10 children cost ~2.5 GB and moved free memory 53% -> 46%, so the knee is well above 10
          and was not chased. Note the confound for anyone who repeats this: a long-lived *interactive*
          session grows to 802 MB, more than triple a fresh `-p` child, so a ceiling derived from `-p`
          children does not transfer to resident sessions.

---

### R30 · Does `--no-session-persistence` suppress the `~/.claude/projects` JSONL for a `-p` child?
STATUS:   ANSWERED
FINDING:  **Yes for the conversation JSONL, no for the project directory.** With the flag, no session file is
          written and the canary appears in no child transcript. Without it, `<session-id>.jsonl` is written
          under the cwd-slug directory and contains the canary. A `memory/` subdirectory is created either way.
EVIDENCE: Driver `$S/r30/driver.py`, parent sandbox lifted. Two distinct canary strings in two scratchpad
          fixtures; each child is asked only to read its fixture and echo it.

            [no-session-persistence] sid=17ff152d-c39d-4dd0-98d8-1c0b68146f4e result='ZZCANARY-PERSIST-A1B2C3'
               jsonl for this session: []
            [default (control)]      sid=b22ef81e-cae5-411f-a111-ac3b2e44756c result='ZZCANARY-PERSIST-D4E5F6'
               jsonl for this session:
                 ['/Users/adamks/.claude/projects/-private-tmp-...-scratchpad-laneC-r30/b22ef81e-....jsonl']
            project dir listing for that cwd: ['b22ef81e-cae5-411f-a111-ac3b2e44756c.jsonl', 'memory']
            canary grep across every project jsonl:
               ZZCANARY-PERSIST-A1B2C3 -> 1 file:  ['agent-aresearch-C-....jsonl']
               ZZCANARY-PERSIST-D4E5F6 -> 2 files: ['b22ef81e-....jsonl', 'agent-aresearch-C-....jsonl']

          **Read the grep carefully.** `agent-aresearch-C-....jsonl` is *this lane's own transcript* — both
          canaries appear there because I typed them into the commands. It is contamination, it is identified,
          and it is why the finding rests on the by-session-id lookup rather than on the grep. An earlier
          sandboxed attempt at this cell was void for a different reason: the parent sandbox denies writes to
          `~/.claude/projects`, so *neither* arm could persist and the control was not a control.
CONFIDENCE: high (measured, with the two failure modes of the naive version identified and avoided)
DECIDES:  **O88 · v93's *settled by*.** The flag does what v93 needs — a `-p` child leaves no conversation on
          disk. The residual leak is the directory and its `memory/` subdirectory, which are created
          regardless and disclose that a session ran in that cwd, though not what it said.
RESIDUE:  Whether `memory/` ever receives content under `--no-session-persistence` was not tested; it was
          empty in both arms here. One long child that writes a memory would settle it.

---

### R31 · The daemon's lease semantics, idle exit, and what `claude agents --json` lists after it exits
STATUS:   ANSWERED
FINDING:  A daemon is started on demand by `claude --bg` (`origin=transient`), holds a **lease per worker in
          `~/.claude/daemon/roster.json`**, keeps **one warm spare** ahead of demand, and **exits 5 s after
          the last client goes away**, logging `leases=0 live_workers=0`. `claude agents --json` works with no
          TTY and, once the job is removed, lists nothing for it — the roster empties and stays empty. A
          separate and load-bearing fact: **`--bg` refuses `-p`**, so a background session is not a `-p` run.
EVIDENCE: `claude --bg -p ...` -> exit 1, verbatim:
            "--bg and --print conflict: --print never starts the interactive session that `claude agents`
             attaches to, so the job would be unattachable. The prompt is the positional — drop --print:
             `claude --bg '<task>'`."

          Drivers `$S/r31/driver2.py` (launch, poll) and `$S/r31/driver3.py` (stop, remove, observe exit).
          One background job was launched and then stopped and removed; nothing was left behind.

            launch -> "backgrounded · 0b09c5c6",  stderr "Starting background service…"
            daemon.log, new lines:
              [supervisor] ─── daemon start ─── version=2.1.263 pid=15832 origin=transient
              [supervisor] workers=0
              [bg] bg: control socket bound at /tmp/cc-daemon-501/1e8da172/control.sock
              [bg] bg spare spawned host pid=15900
              [bg] bg claimed-spare 0b09c5c6 (shell)
              [bg] bg spare spawned host pid=15929
            `claude agents --json --all` at t+3 s: the job appears with "status": "idle", "state": "done".

          The lease record, which is what `bin/supervise` was blocked on — `roster.json` verbatim:
            "workers": { "0b09c5c6": {
                "pid": 15900, "procStart": "Mon Sep  7 06:58:47 2026",
                "sessionId": "0b09c5c6-7f06-47de-9046-9d4103c9ac13",
                "rendezvousSock": "/tmp/cc-daemon-501/1e8da172/rv/0b09c5c6.sock",
                "ptySock": "/tmp/cc-daemon-501/1e8da172/spare/0d20bbef.pty.sock",
                "cliVersion": "2.1.263", "startedAt": 1788764327589, "attempt": 1, "cwd": "...",
                "dispatch": { "proto": 1, "short": "0b09c5c6", "nonce": "6ada3624", "source": "shell",
                              "launch": { "mode": "prompt", "args": [...], "restoresTranscript": false },
                              "env": {}, "isolation": "none", "respawnFlags": [...],
                              "seed": { "intent": "..." } },
                "rvAuth": "...", "ptyAuth": "...", "replPid": 15911 } }

          Teardown and idle exit:
            claude stop 0b09c5c6 -> "stopped 0b09c5c6";  claude rm 0b09c5c6 -> "removed 0b09c5c6"
            [bg] bg settled 0b09c5c6 (killed)
            [supervisor] idle 5s with no clients — exiting
            [supervisor] shutting down (cause=idle_exit, uptime=135s, leases=0, live_workers=0)
          and at every poll from t+3 s to t+20 s after removal:
            listed_after_rm=[]   roster_workers=[]

          Two further facts from the same surfaces. `claude agents --json` does **not** start the daemon —
          run before any `--bg`, it listed live interactive sessions across other worktrees and added no line
          to `daemon.log`. And `--all` returns background jobs from months back out of `~/.claude/jobs/`,
          including `"state": "failed"` ones, so the record outlives the daemon by a long way.
CONFIDENCE: high (measured end to end, including teardown)
DECIDES:  **O91 — `bin/supervise` is unblocked.** The lease is `roster.json`'s `workers` map keyed by short
          id, carrying pid, procStart, sessionId, cliVersion, attempt and the full dispatch record; idle exit
          is 5 s after the last client with the cause named in the log; and after `rm` the job is gone from
          both the roster and `agents --json`. The one design constraint to carry forward is that **`--bg`
          cannot be a `-p` job** — a supervised background session is an interactive session, with everything
          that implies for how output is read (`claude logs <id>` returns raw terminal output, ANSI included).
RESIDUE:  Lease *expiry* was not observed — the worker was killed, not left to time out. What a stale lease
          looks like when its pid dies without `stop` (the `attempt` field implies a respawn path) is
          unmeasured; one `kill -9` of a worker pid would show it.

---

### R32 · Does `PreCompact` fire under `-p`, and does a compaction cost a 2x cache write?
STATUS:   ANSWERED (both halves)
FINDING:  **`PreCompact` fires under `-p`** — and it fires *before* the decision to compact, so it also fires
          when the compaction is then refused. **A compaction does not cost a 2x cache write; it costs a
          cache loss.** The compacting turn wrote only **292** cache-creation tokens against a 3,401–4,958
          steady state. The real cost lands on the *next* turn: accumulated cache read collapses from 14,522
          to 6,163, the base. Separately and importantly, **the compaction's cost is invisible in the `usage`
          block**, which reports all zeros; only `modelUsage` carries the truth.
EVIDENCE: Hooks under `-p`, from `$S/r32/hooks2.json` delivered by `--settings`, with
          `--output-format stream-json --verbose --include-hook-events`: `UserPromptSubmit`, `Stop` and
          `SessionEnd` all fired and left their marker files. `SessionStart` fired and then failed — see
          cross-cutting finding (ii). Sending `/compact` as the prompt on a fresh session:
            ASSISTANT [{'type': 'text', 'text': 'Not enough messages to compact.'}]
            PreCompact.fired: YES
          — the hook ran even though nothing was compacted.

          A real compaction, driver `$S/r32/compact2.py`, parent sandbox lifted, haiku, one session resumed
          across five turns:

            turn      usage.input / cache_create / cache_read / output      total_cost_usd   num_turns
            1              10 /  3,401 /  6,163 / 413                          0.00949          1
            2              10 /  4,958 /  9,564 / 285                          0.01231          1
            3              10 /  4,330 / 14,522 / 213                          0.01119          1
            compact         0 /      0 /      0 /   0                          0.01052          0
            after          10 /  1,237 /  6,163 / 131                          0.00376          1

          and the compacting turn's `modelUsage`, which is where the real numbers are:
            {"claude-haiku-4-5": {"inputTokens": 5472, "outputTokens": 646,
              "cacheReadInputTokens": 14522, "cacheCreationInputTokens": 292,
              "costUSD": 0.010519..., "thinkingTokens": 381, ...}}

          A second, longer run reproduced the shape: six turns of growing cache read (6,163 -> 29,046), then
          `/compact` reporting a zeroed `usage` with `total_cost_usd` 0.0159, then a following turn back down
          to `cache_read` 6,163.
CONFIDENCE: high (measured twice, with the token fields read per turn)
DECIDES:  **O90, and it changes the reason rather than the rule.** Bounding run length is still right, but not
          because compaction is expensive in cache writes — it is not, it is roughly one ordinary turn. It is
          right because compaction **discards the accumulated prompt cache**, so everything after it pays to
          rebuild. And it settles the remainder of R9 in a way that matters for R7's method: **a meter that
          reads `usage.*` scores a compaction as free**, since every field there is zero. Any cache-share
          measurement must read `modelUsage`, or it will be wrong exactly where compaction happens.
RESIDUE:  Not measured: whether *auto*-compaction (`--autocompact <tokens>`) reports the same way as manual
          `/compact`, and what `PreCompact`'s payload distinguishes between the two triggers. One long run
          with `--autocompact 100000` would settle it, at the cost of filling 100k tokens.

---

### R33 · Can a LaunchAgent on THIS Mac read a keychain item after sleep, and after reboot with the screen locked?
STATUS:   BLOCKED
FINDING:  Not attempted. Answering it requires installing a LaunchAgent, which is an install and is outside
          this lane's authority. What R33 needs beyond R3 is specifically the **launchd context**: a process
          started by launchd rather than inherited from a logged-in shell, across a sleep and across a reboot
          with the screen locked.
EVIDENCE: The exact act needed, and who must do it: **the founder must write a plist to
          `~/Library/LaunchAgents/<label>.plist` and `launchctl bootstrap gui/$(id -u)` it** — one file
          outside the scratchpad and one `launchctl` invocation. The job body needs nothing more than the
          probe already written at `$S/r3/kc2.py`, pointed at a throwaway keychain, run three times: once
          normally, once after `pmset sleepnow` and a wake, once after a reboot with the screen still locked.
          Then `launchctl bootout` and delete the plist.
          What is already known and does **not** need the LaunchAgent, from R3: a detached, TTY-less process
          reads an unlocked keychain with no prompt, fails instantly on a locked one, and the login keychain
          here is `no-timeout`. And from `~/.claude/daemon.log`, the vendor's own headless supervisor reads
          the keychain successfully across days — but it is daemon-spawned from a session, not launchd-spawned,
          so it does not answer the reboot case.
CONFIDENCE: n/a — nothing measured.
DECIDES:  Nothing yet. It gates **R3's unattended half** and is critical under E1; `--bare` skips keychain
          reads and so sidesteps it entirely, which is worth weighing before paying for the LaunchAgent
          experiment at all.
RESIDUE:  The whole question. The reboot-with-screen-locked case is the one that actually matters and is the
          one nothing here approximates: at that point the login keychain has never been unlocked, so R3's
          matrix predicts an immediate `errSecInteractionNotAllowed` and the night would not start. That
          prediction is worth stating as the hypothesis the experiment should try to falsify.

---

## Summary

| id | status | one line |
|---|---|---|
| **R1** | ANSWERED | `sandbox.filesystem` is settable per invocation via `--settings` and bites; `allowWrite` only widens, **`denyWrite`/`denyRead` are what narrow** — so a worktree is confined by cwd plus a deny list, never by an allow list |
| **R2** | ANSWERED | Egress credential injection is real (child sees a sentinel, proxy substitutes) and **requires `sandbox.network.tlsTerminate`**; there is **no HTTP-method allowlist** — policy is domain-scoped |
| **R3** | ANSWERED / ACL PARTIAL | A detached TTY-less process reads an **unlocked** keychain with no prompt; **locked** fails instantly with `errSecInteractionNotAllowed`, never hangs; login keychain here is `no-timeout` |
| **R4** | ANSWERED | A sandboxed child cannot reach the live local Ollama by **Bash or WebFetch** (EPERM both), unsandboxed reaches it 200; inbound `bind()` denied for unix **and** TCP — the local tier cannot be a service |
| **R17** | ANSWERED | `/goal` takes one free-text string; the evaluator is a **model reading the transcript** and never runs the condition — an exit-code condition is prose, judged the same way, ~1,500 tokens and ~21 s per evaluation |
| **R23** | ANSWERED (no ceiling found) | 10 of 10 concurrent `-p` children succeeded, none queued or degraded; the CLI's only "max concurrent sessions" knob is the **cloud runner's** `--capacity`, not local |
| **R28** | ANSWERED | `--restricted` does **not** ignore `--settings <file>`; positive control shows it does ignore the project settings file |
| **R29** | ANSWERED (no knee found) | **~250 MB RSS per `-p` child** (241–286 MB over 23 children), flat in N; **zero swapouts** at every N up to 10 |
| **R30** | ANSWERED | `--no-session-persistence` suppresses the conversation JSONL entirely; the project directory and an empty `memory/` are still created |
| **R31** | ANSWERED | Lease = `roster.json` `workers` map with pid/procStart/sessionId/dispatch; **idle exit 5 s** with `leases=0`; after `rm`, listed nowhere. **`--bg` refuses `-p`** |
| **R32** | ANSWERED | `PreCompact` **fires under `-p`** (even when compaction is refused); compaction costs **292** cache-write tokens, not 2x — the cost is the **cache loss** after it, and `usage.*` reports it as **all zeros** |
| **R33** | BLOCKED | Needs a LaunchAgent installed: founder writes `~/Library/LaunchAgents/<label>.plist` and runs `launchctl bootstrap gui/$(id -u)` |

**Two cross-cutting findings, both unasked for and both operational** — restated because they change how the
other answers are used:

1. **A nested `claude -p` child cannot start its own sandbox** under the armed parent, and with
   `failIfUnavailable: true` it fails closed: all Bash is refused. 6 of 6 sandbox-enabled cells.
   `EPERM ... listen '/tmp/claude-501/srt-mux-<pid>-1.sock'`, and the parent's own
   `bind()`/`listen()` is denied for unix and TCP sockets alike. `sandbox.enableWeakerNestedSandbox` exists
   and was not tried.
2. **`SessionStart` hooks fail in a nested child** under the armed sandbox —
   `EPERM ... mkdir '~/.claude/session-env/<sid>'` — while every other hook event runs. That is the event
   #56's shrunken payload rides on.

## Scope notes

**What I ran.** Roughly 45 `claude -p` children plus one `claude --bg` session, all with
`--strict-mcp-config` and, except where a cell required otherwise, `--model claude-haiku-4-5`,
`--permission-prompts none` and `--no-session-persistence`. Every driver script is left in place under
`$S/r1b`, `$S/r3`, `$S/r17`, `$S/r29`, `$S/r30`, `$S/r31`, `$S/r32` so the orchestrator can re-run any cell.
Cost is subscription, not marginal USD: this is a Max seat, and across the whole lane the five-hour rate-limit
window moved **0.11 to 0.13** while the seven-day window stayed at **0.68**. The `total_cost_usd` figures
quoted in R32 are the vendor's own list-price accounting (`"costBasis": "list"`), not money spent.

**What I refused to run, and why.**
- **R33** — not attempted at all. It needs a LaunchAgent installed; that is an install and the act is named
  in its block.
- **Reading the real `Claude Code-credentials` keychain item** — attempted once as corroboration for R3, and
  the auto-mode classifier denied it. Correctly, and I did not route around it: R3 was answered instead with a
  throwaway keychain created in the scratchpad. No real credential was read, printed, or moved.
- **Fetching any vendor documentation page** — `curl` is denied by this session's permission rules and I have
  no WebFetch tool. Where a block cites the vendor, it cites `claude --help` or strings inside the shipped
  binary at `/Users/adamks/.local/share/claude/versions/2.1.263`, both verbatim, never paraphrased. R2 rests
  entirely on that, which is why its confidence is stated per clause.
- **Building an MCP stdio server** to test R4's last shape — that is building, and it is left as R4's residue.
- **Writing outside the scratchpad**, with two exceptions that the questions themselves require and that are
  disclosed here rather than buried: R30's control child necessarily wrote one session transcript to
  `~/.claude/projects/-private-tmp-...-scratchpad-laneC-r30/b22ef81e-....jsonl` (that file *is* the
  measurement), and R31's background job wrote and then removed its own daemon/job records — it was stopped
  and removed, and the roster is empty. Nothing in the repository was read for these answers beyond
  `.claude/settings.json` for the schema key names, and nothing in it was edited.

**The sandbox was lifted for specific commands, and every one is marked.** Cells that measure a *child's*
sandbox, or that need `~/.claude` writes, cannot run under the armed parent — the evidence for that is
finding (1) above, measured before any escalation. Cells that did not need it (R28, R32's hook cells, the R3
sandboxed control, all binary reads) ran sandboxed.

**Single-family caveat.** Every measurement here is mine alone: one agent, one model family, one machine, one
day. Nothing in this lane was independently reproduced by a second model or a second person, and several
answers rest on a single differential pair. Where an answer is a *negative* — no concurrency ceiling, no
method allowlist, no exit-code condition type — read it as "not found by these searches and these cells",
which is weaker than "does not exist", and the blocks say which searches those were.

---
---

# Addendum · 2026-09-07, second pass

The founder authorised one temporary LaunchAgent ("Allow a temporary one, removed after"), putting R33 and
R29's knee back in scope. **R29 is now closed with a number. R33's LaunchAgent could not be created: the
permission classifier denied it twice, and I did not route around it.** A third finding turned up while
looking for a sleep to measure across, and it falsifies a figure several rows rest on — it is below, and it
is the most important thing in this addendum.

---

## R29 (revised) · the knee is between 17 and 20 concurrent `-p` children
STATUS:   ANSWERED
FINDING:  **The first paging appears at N=20.** N=17 pages not at all; N=20 writes **8,280 pages (136 MB) to
          swap**. All 20 children still returned successfully — so the machine **degrades silently**, it does
          not refuse, which also answers the open half of R23. A second, quieter signal points the same way:
          per-child RSS *falls* as N rises, from 250 MB at N=1 to a 229 MB median at N=20, because the
          children are being trimmed under pressure.
EVIDENCE: Driver `$S/r29/conc.py`, unchanged from the first pass, parent sandbox lifted. Instrument is
          `vm_stat`'s `Swapouts` counter, differenced across each cell; `Pages free` and `memory_pressure`
          are shown beside it because they do **not** call the knee and would have missed it.

            N     all ok    peak RSS per child (MB), sorted            min pages free   swapouts delta   free%
            1     1/1       247                                        5,221 ( 86 MB)          0          53
            2     2/2       250 .. 253                                 4,703 ( 77 MB)          0          54
            4     4/4       250 .. 263                                16,382 (268 MB)          0          52
            6     6/6       252 .. 286                                21,692 (355 MB)          0          51
            10    10/10     241 .. 279                                 4,435 ( 73 MB)          0          46
            14    14/14     226 .. 249                                 4,171 ( 68 MB)          0          44
            17    17/17     219 .. 274                                 4,388 ( 72 MB)          0          46
            20    20/20     214 .. 257                                 3,658 ( 60 MB)      **8,280**       45

          Read the `free%` column and the knee is invisible — it reads 45% at N=20 and 44% at N=14, i.e. it
          moves the *wrong way* across the knee. `Pages free` is no better: its minimum at N=4 (268 MB) is
          higher than at N=1 (86 MB). **`Swapouts` is the only instrument here that fires**, and it fires
          cleanly: 0 at every N up to 17, then 8,280.
          Recovery was complete within 25 s of the last cell: `Pages free` 111,923 (1.8 GB), free 48%.
CONFIDENCE: high for the bracket (measured, single crossing, clean instrument); medium for the exact number —
          one crossing, one machine state, not repeated. The knee is a property of *this* machine *with eight
          resident `claude` sessions already holding 2.16 GB*, not a constant.
DECIDES:  **O71's `sessions_ceiling`.** The interim value of 3 is wrong by a factor of five or more. On this
          hardware the honest ceiling is **17 concurrent `-p` children**, with 20 as the measured failure
          point, and the rule to encode is not a session count but the arithmetic: ~250 MB per child against
          free memory, minus whatever resident sessions already hold. The board must impose that bound
          itself, because nothing in the runtime will — the twentieth child succeeds, it just makes the
          machine swap.
RESIDUE:  One crossing only, and the baseline load was heavy. Repeating on a quiet machine would separate
          "the knee is 20" from "the knee is 20 given 2.16 GB of resident sessions", which are different
          numbers and the second is the one the board would actually need.

---

## R33 (revised) · STILL BLOCKED — and the blocker moved
STATUS:   BLOCKED (by the permission system, not by scope) · the keychain half is ANSWERED without it
FINDING:  **The LaunchAgent was not created.** Two attempts to write the plist — one as XML, one via
          `plistlib` — were both refused by the Claude Code auto mode classifier. The founder's
          authorisation was relayed to me by a teammate, and a teammate's message is not what grants
          capability here; the permission system is, and it said no. I stopped after the second refusal
          rather than looking for a third form.
          **What I could establish without it settles more of the sleep half than expected:** the login
          keychain on this Mac carries **no `lock-on-sleep` flag**, so a sleep does not lock it, and a
          post-sleep read is therefore not blocked by a lock at all.
EVIDENCE: The refusal, verbatim: "Permission for this action was denied by the Claude Code auto mode
          classifier. Reason: Blocked by classifier." — on both
          `cat > $S/r33/<label>.plist` and a `plistlib.dump` of the same content, to a **scratchpad** path,
          so it is the artifact that is refused and not the location.

          Confirmation that nothing was left behind:
            launchctl list | grep -i "agentvibe\|laneC\|r33"   -> no matches
            ls ~/Library/LaunchAgents                          -> five pre-existing plists, none mine
          (There is no removal command to report, because nothing was ever registered.)

          The keychain half, measured with a positive control so the absence of a flag means something:
            security show-keychain-info ~/Library/Keychains/login.keychain-db
              -> Keychain "/Users/adamks/Library/Keychains/login.keychain-db" no-timeout
            security set-keychain-settings -l $S/r3/laneC.keychain ; security show-keychain-info ...
              -> Keychain ".../laneC.keychain" lock-on-sleep no-timeout      <- the flag DOES print when set
            security set-keychain-settings $S/r3/laneC.keychain  ; security show-keychain-info ...
              -> Keychain ".../laneC.keychain" no-timeout                    <- restored
          So `no-timeout` with no `lock-on-sleep` on the login keychain is a positive reading, not a
          formatting accident: **sleep does not lock the keychain on this Mac.**

          A detached, TTY-less sampler (`$S/r33/sampler.py`, hard cap 40 samples, started with
          `start_new_session=True`) took **16 readings over 4m41s**, every one `readA_rc=0 readB_rc=0`,
          `tty: "not a tty"`, zero failures. It was terminated and confirmed gone
          (`CONFIRMED STOPPED: pid 97715`). **No sleep episode occurred during its window**, so it is a
          baseline and not the sleep measurement.
CONFIDENCE: high for the keychain lock policy (measured with a control); n/a for the launchd context, which
          was not measured at all.
DECIDES:  Partially. The keychain will not be locked when the machine wakes, so R3's matrix says the read
          succeeds — **unless the launchd session context is itself the obstacle, and that is exactly the
          part that needs the agent.**
RESIDUE:  Two acts, both the founder's, and they are different sizes.
          1. **The launchd context.** Either add a Bash permission rule allowing writes to `*.plist`, or run
             these three commands themselves with the `!` prefix (the probe is already written and needs no
             editing):
               plutil -lint  $S/r33/local.agentvibe.laneC-r33-TEMPORARY-DELETE-ME.plist
               launchctl bootstrap gui/$(id -u) <that plist>
               launchctl bootout   gui/$(id -u)/local.agentvibe.laneC-r33-TEMPORARY-DELETE-ME
             — but the plist itself still has to be created first, which is the step that was refused.
          2. **The reboot-with-screen-locked case**, which no amount of permission fixes: it needs a real
             reboot. R3's matrix predicts an immediate `errSecInteractionNotAllowed` there, because the login
             keychain has never been unlocked at that point. That prediction is the hypothesis the experiment
             should try to falsify, and it is the one that decides whether a night can start unattended after
             a power cut.

---

## Unasked, and it falsifies a figure that several rows rest on
### The Mac's off-hours are NOT zero. The "zero episodes of an hour or more" reading is an artefact of counting episodes.

I went looking for a natural sleep to measure across and found that this Mac's sleep log answers "how long is
it away?" two different ways, and the plan has been quoting the flattering one.

Same log, same window, 2026-08-31 10:35:17 -> 2026-09-07 09:21:22, **166.8 h**:

| view | count | total | longest | >= 1 h |
|---|---|---|---|---|
| **Sleep episodes** — what W33 / R5 / DECISIONS §19 quote | 431 | 42.9 h (26%) | **0.30 h** | **0** |
| **Contiguous spans between full `Wake` events** | 29 | **70.0 h (42%)** | **11.08 h** | **14** |

The episode view reproduces exactly — 431 episodes, 42.9 h, longest 0.30 h, zero of an hour or more — so the
existing arithmetic is right. It is the *unit* that misleads. Every ~16 minutes the Sleep Service raises a
**2-second** DarkWake and puts the machine straight back down; each of those terminates a "Sleep episode" in
the log's own accounting. An eleven-hour overnight absence is therefore recorded as ~18 episodes, none of
them an hour long, **by construction**. No episode can ever reach an hour on a machine with Power Nap on.

The longest span, verified event by event: **2026-09-03 00:09:42 -> 11:14:36, 11.08 h, containing exactly
one full `Wake` (the terminating one) and 17 DarkWakes.**

    grep count of full Wake events in that window   -> 1
    grep count of DarkWake events in that window    -> 17

Breaking the 70.0 h down: **42.9 h is logged true Sleep (61%) and 27.1 h is DarkWake (39%)** — and the mix
varies enormously night to night, which is why a single headline number cannot carry this:

      from                -> to                    span_h   asleep_h   darkwake_h
      2026-09-03 00:09:42 -> 2026-09-03 11:14:36    11.08      1.68        9.41
      2026-08-31 23:14:19 -> 2026-09-01 10:06:32    10.87      3.67        7.20
      2026-09-05 01:28:46 -> 2026-09-05 11:54:06    10.42      8.75        1.67
      2026-09-04 02:15:36 -> 2026-09-04 09:40:23     7.41      1.12        6.29
      2026-09-07 00:16:11 -> 2026-09-07 07:21:20     7.09      6.64        0.45
      2026-09-04 11:41:14 -> 2026-09-04 17:53:03     6.20      5.41        0.79
      2026-09-02 06:36:32 -> 2026-09-02 10:39:20     4.05      3.69        0.36
      ... 7 more spans between 1.0 and 1.6 h; 14 spans >= 1 h in total

One night is 85% DarkWake (2026-09-03), the next is 94% true sleep (2026-09-07). So neither "the tail is
zero" nor "the tail is 70 hours" is the right sentence.

**What this touches, and how each should be read now.**
- **R5 / DECISIONS §19** — *"The tail is **zero** over the week measured"* is **false** as a statement about
  availability. It is true only of the episode metric, which cannot produce a non-zero answer here.
- **W33** — *"the finding that survives every reading is ... zero episodes of an hour or more"*. It does
  survive every reading, and that is precisely the problem: it is invariant to the thing it is being used to
  measure.
- **v79** — *"a cloud lane buying back a small tail is not worth §I row 1"*. The tail is 42% of the week,
  with 14 windows over an hour and three over ten hours. Whether it is worth buying back is now an open
  question rather than a closed one.
- **R37, §I row 15, §I 18 / §J 73** — R37 should be re-specified to measure the **contiguous span between
  full `Wake` events**, and to report the Sleep/DarkWake split inside each. Measuring thirty days with the
  episode metric would return "zero" again, correctly and uselessly.
- **O81 / R41** — a `night_capable` predicate built on "no long sleep episodes" would pass every night of
  this week, including the eleven-hour one.

**The one thing this does NOT settle, and it is what decides the row.** 27.1 h of the 70 h is DarkWake, when
the CPU is running Power Nap work. Whether a `claude -p` run makes progress during a DarkWake is
**unmeasured**, and it is the difference between a 43 h/week tail and a 70 h/week one. The cheapest way to
settle it is a bounded process that timestamps a line every 60 s and is left across one night, then read
against `pmset -g log` — the sampler at `$S/r33/sampler.py` already does exactly this and needs only a longer
cap and someone willing to leave it running. That is a founder act, and it is a smaller one than the
LaunchAgent.

Derivation, re-runnable — and note the parser trap, because I fell into it first: `pmset -g log` emits
**`Wake Requests`** lines whose first token is also `Wake`. A regex matching `Wake\s+` counts each of those
as a wake, closes every span after ~30 seconds, and returns a total of 0.3 h instead of 70 h. Requiring two
or more spaces after the event token (`(Sleep|Wake|DarkWake)\s{2,}`) is what separates the column from the
prose. My first run of this produced the wrong answer for that reason and is corrected here.

---

## Addendum scope notes

**What I ran:** 51 further `claude -p` children (cells N=14, 17, 20), one detached sampler capped at 40
samples and terminated at 16, and read-only `pmset`/`security`/`launchctl` queries. Rate limit across the
whole lane, both passes: five-hour window 0.11 -> 0.13; seven-day 0.68 throughout.

**What I refused to run, and why.**
- **The LaunchAgent** — refused twice by the permission classifier. I stopped rather than trying a third
  encoding. Nothing was registered and `~/Library/LaunchAgents` is untouched.
- **`pmset sleepnow`** — **not run, deliberately, and this is the one judgement call in the addendum.** At
  the moment I would have run it the machine was on **battery** at 77% with **`womp 0`**, so no
  wake-on-network path existed and I had no way to schedule a wake (`pmset schedule` needs root). A peer
  lane was **mid-measurement holding a `caffeinate -i` assertion** (pid 51289, R41), which a forced sleep
  would have invalidated. And `pmset -g assertions` showed `UserIsActive 1` with a trackpad event 12 seconds
  old, so a person was at the keyboard. Sleeping the machine would have suspended every other agent in this
  session with no guaranteed wake, to buy one reading. The historical log gave the same information at no
  risk, and gave more of it. If the founder wants the forced-sleep cell, it should be run on AC with nobody
  else's measurement in flight.

**Standing caveats unchanged:** single model, single family, single machine, one day; no independent
reproduction of anything here. Two of this addendum's three findings are single crossings (the N=20 knee) or
single-window derivations (the sleep spans) — the sleep-span result is the more robust of the two, because it
reproduces the existing episode figure exactly before diverging from it, so the divergence is in the metric
and not in the parsing.
