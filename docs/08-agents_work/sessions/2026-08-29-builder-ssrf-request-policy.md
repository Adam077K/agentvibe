---
date: 2026-08-29
role: builder
task: ssrf-request-policy
qa_verdict: PASS
tier: full
risk: full
branch: integration/design-layer
commits: 1
---
# The refusal arrived after the request, and a request to an internal host is not undone by refusing it

`scripts/extract-reference.mjs` checked robots.txt against the URL the operator typed and the URL the
browser LANDED on. Both checks are real; neither sits on a request. Driven through `capture()`'s own
`chromium` seam, that produced two timelines and one hole underneath them.

## Measured, before

```
(b)   >> REQUEST ISSUED to http://public.example/
      >> REQUEST ISSUED to http://internal.local/admin      <- the request happened
         robots.txt FETCHED for internal.local              <- ...and THEN we asked
      RESULT: REFUSED (EROBOTS)          INTERNAL REQUEST PRESENT IN TIMELINE: YES

(b2)  >> REQUEST ISSUED to http://public.example/
      >> REQUEST ISSUED to http://internal.local/admin
      >> REQUEST ISSUED to http://public.example/
      RESULT: CAPTURE SUCCEEDED          INTERNAL REQUEST PRESENT IN TIMELINE: YES
```

(b) is structural, not a race: `goto` is awaited, so a check on its result cannot precede the navigation
it checks. (b2) evades the check entirely — `sameReferenceUrl(landed, url)` compares two endpoints and is
blind to every hop between, so a chain returning to its origin was never asked about. **The general hole
underneath is why a narrow redirect fix would have been the wrong fix:** there was no `page.route`, no
`.on('request')`, no host allowlist and no DNS lookup anywhere in `extract-reference.mjs` or
`design-lib.mjs`, so `<img src="http://internal.local/x">` reached an internal host with no redirect at all.

**Exposure, bounded and not inflated:** an arbitrary GET from inside the operator's network, plus script
execution on what it returned (`waitUntil: 'domcontentloaded'`). NOT the internal response body into a
committed artifact — in (b) the refusal precedes `page.evaluate`, in (b2) the browser has navigated away.

## The fix — prevention, one predicate, two surfaces

`capture()` installs `page.route('**/*')` BEFORE `goto`. `checkRequestTarget` judges scheme, then host,
then every resolved address, and the handler aborts anything that fails. That one control covers the
navigation, every redirect hop, every subresource and in-page `fetch`. `checkRobots` calls the SAME
predicate, because its `fetch` runs in node where no route handler can see it — and in the (b) timeline
that fetch is what reached the internal host.

```
(b)   >> REQUEST ISSUED to http://public.example/
      xx REQUEST ABORTED, never issued: http://internal.local/admin
      RESULT: REFUSED (ETARGET)          INTERNAL REQUEST PRESENT IN TIMELINE: NO
(b2)  identical.
```

`ETARGET` is a distinct code from `EROBOTS` on purpose: "we refused to issue a request" is a fact about
us, "the site disallows this" is a fact about the site, and this file has already been bitten once by
collapsing two refusals into one sentence.

**file:// is a DECISION now.** It used to fail closed BY ACCIDENT: `new URL('file:///etc/passwd').origin`
is the literal string `"null"`, so `${u.origin}/robots.txt` built garbage, `fetch` threw and the catch
refused. Nothing tested a scheme, and `hostname` is `""` for `file:`, which no IP-range predicate matches.
The decision is an ALLOWLIST of `http:`/`https:` — a blocklist is wrong the first time a new scheme ships.

## Residual, stated as a limit and never as containment

**DNS rebinding.** The policy resolves the hostname and Chromium resolves it again to connect; a
short-TTL record can differ between the two, and nothing pins the address the browser dials. Closing it
needs an enforcing proxy, and a loopback `bind()` is EPERM under the armed sandbox. Read it the way this
repo reads its own sandbox: a guardrail against accident, not containment.

**One assumption is not measured here** — that Chromium re-invokes a route handler per redirect hop.
Chromium is SIGTRAP-killed under the armed sandbox. A backstop reads the chain back off
`response.request().redirectedFrom()`; it DETECTS and does not prevent, is labelled that way in source,
and is driven by a test that simulates the pessimistic answer.

## Verification

```
node --test scripts/extract-reference.test.mjs   61 tests · 61 pass · 0 fail · exit 0
npm run test:merge-gate                          exit 0
npm run check                                    47 of 48 · 1 failed · 201.2s
16 mutations, each reverted individually         16 of 16 RED
git diff origin/main -- scripts/lib/check-suite.js .github/workflows/   empty
```

**The one `npm run check` failure is `test:run-gate`, it is NOT this change, and the commit that broke
it is `489e5e0` — another lane's, landed while this work was in progress.** `verdict.mjs` dies on
`spawnSync git ENOBUFS`; `HEAD_NOW` is `git rev-parse HEAD`, so no working tree enters it. Measured per
commit against `spawnSync`'s 1,048,576 default `maxBuffer`:

```
32e0cf0    995,960   OK    <- the branch tip this task started from
489e5e0  1,050,273   ENOBUFS   <- crosses the line, and it is not this lane's commit
25693b0  1,103,178   ENOBUFS   <- this change
159f4e0  1,117,464   ENOBUFS
```

*Superseded in the same session: this paragraph first read "the COMMITTED diff `origin/main...32e0cf0`
is 1,050,273 bytes … over by 1,697". The BYTE COUNT was right and THE COMMIT IT NAMED WAS NOT — 1,050,273
is `489e5e0`, which had landed from another lane between this task's start and the measurement, so HEAD
had moved under it. `32e0cf0` is 995,960 and passes. The original wording implied the branch was already
over the line before `489e5e0`, which would have pointed a reader at the wrong commit; the empirical
claim it supported — that stashing this diff does not fix it — was taken at HEAD `489e5e0` and stands.*

Independently bisected the same day by the `design-figure-corrections` lane, which reached the same
root cause and pinned it to `scripts/verdict.mjs:97` — git spawned with no `maxBuffer`. Outside this
task's scope; it will fail for every lane on this branch until it is raised.

## The trap that was worth more than the fix

The seam's stand-in page had no `route` method. A fix installing `page.route` would have been exercised by
a driver that never called the handler, and the test would have passed having tested nothing — which is
this seam's OWN stated failure ("the kind of guarantee that gets written, believed and never executed")
reproduced inside the mechanism added to prevent it. The double now calls the handler and honours an
abort, so the acceptance predicate is **absent from the timeline**, not present-then-refused. Two
mutations survived the first battery, both real test gaps; both are closed and RED now.
