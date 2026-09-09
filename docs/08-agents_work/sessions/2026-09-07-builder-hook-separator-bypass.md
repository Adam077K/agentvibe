---
date: 2026-09-07
role: builder
task: hook-separator-bypass
qa_verdict: PASS
tier: irreversible
branch: fix/hook-separator-bypass
pushed: false
---
Four fix commits on `.claude/hooks/pre-tool-use.sh`. **One defect class throughout: a rule that recognises one spelling of a thing and misses the conventional one, or computes its anchor over the whole command instead of the one command it governs.**
**`3b5ce7e`** — five rules matched `<trigger>[^|;]*<payload>`, which cannot span a semicolon *inside a quoted string*: `node -e "const fs = require('fs'); fs.rmSync(…)"` exit 0. `segment_command` splits once on `;`/`|` outside quotes and escapes; `seg_match` runs each rule per segment. Not widened to `.*` — that refuses `node --version; echo rmSync`.
**`8b584d3`** — `rm -rf ~` exit 2 but `rm -rf $HOME` exit 0. Inverted: refused unless every target is shown strictly inside the project root or scratchpad. One character of the old rule changed (`\/[^a-zA-Z]?` → `\/([^a-zA-Z]|$)`), whose optional class refused *every* absolute path and left the new allowlist's absolute branch untestable.
**`354b925`** — the browser guard's URL canonicalisation moved into `url_class`; the curl rule asks that same parser instead of grepping for the word `localhost`. Closed eight holes and **the three false positives, which were half the deliverable**.
**`161bd76`** — `curl example.com` reached the network on every prior version. **Not a policy gap** — external is refused, and a bare host is an external fetch — but a **parsing** gap: the grep saw only `https?://`. `curl_urls` walks the invocation, and the fact that makes it safe is that in curl every positional operand IS a URL. Unrecognised flags are assumed to take a value, so the failure direction is a miss, never a phantom host. `curl file:///etc/passwd` closed for free.
**Not one instrument failure this session was caught by reading.** The curl refactor's first splice left the original `case` block below the new one and refused every browser navigation — 30 SSRF tests named it. A wrong measurement of my own (`rm -rf /opt/data` claimed allowed; it was exit 2) was caught by a control run and is kept in the source, because it would have aimed the fix at "paths the list forgot". A blanket glob refusal was measured, found to refuse `rm -rf build/*`, and narrowed.
**Costs measured and pinned, never assumed.** Five `$VAR` cleanup shapes refused — the message now names the literal project root and scratchpad. The curl rule refuses past 12 URLs rather than checking some. Latency is reported as a **delta**, +32 ms on the curl path: absolutes are load-dominated, with an unrelated baseline moving 78→140 ms on identical code between rounds.
**Numbers.** Hook tests **318 pass · 0 fail**; 21, 20, 21 then 13 red against each respective pre-fix hook; **no pre-existing test ever moved**. Suite **46 of 48** — `test:ledger`/`check:ledger-lint`, 19 prose citations under `final-v2/`, id set `diff`-identical to base on every run.
**Open, reported, not fixed:** nothing from the review remains. The heredoc false positive is unfixable without a shell parser and is widened by one shape here, pinned `[C2b]`; the hook refused four of my own commands, which went through files.
Standing caveat: author-recorded, one agent, one model family; `irreversible` asks 2-of-3 multi-judge and ≥2 families, unmet. Unpushed, unmerged, for founder sign-off.
