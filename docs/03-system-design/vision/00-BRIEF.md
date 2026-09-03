# The vision round · 2026-09-02

**Envision the whole system at full scale. No floor. No year one.** The board built fifteen controls and one
artifact; four designers then designed inside that floor; the merge chose the small answer on most conflicts.
Nobody has yet been asked the question this round asks: **what is this company when it is fully grown, and what
does the machine do then?** Year one will be derived backwards from your answer, not forwards from repairs.

## The founder's words — these are the brief

> "A one-founder company that runs 24/7 on Claude Code." · "Missions that outlive a session, workers with real
> hands, a loop that walks until a goal is met, a balcony the founder watches and steers from." · "Breadth
> beyond code: design, video, content, social, marketing, customer, data, testing, CI." · "It lost creativity to
> playbooks, and everything built is a stopping mechanism." · "Give them the tools, the way and the
> understanding on how to learn — push back on super-specified packs." · "The whole system: mission control,
> agent skills, the layers of memory, the contexts, the way they communicate, the way they save memory, the way
> we reduce token consumption, the way they optimize and self-improve, which agents we choose, the numbers, the
> packs, how they get knowledge, how we make sure they achieve every goal we set, the prime agents, the whole
> harness, injection prompts, hooks, workflows, skills, the formal structure, and making sure agents can find
> whatever they need." · "Built around Claude Code and Codex." · **"Think big. No limits."**

## What is NOT binding in this round

- The fifteen board decisions D1–D15 are material, not constraints. Use any, ignore any, contradict any.
- The year-one frame in `docs/03-system-design/STARTUP-OS.md` Part II is NOT to be read until your §7.
- "Every rule names its mechanism" is relaxed to: say what would have to exist; you need not prove it.
- Cost caps, the current sandbox, the current hook, the current 7 engines, the current 134 skills: none bind.
  What binds is only physics you can name — e.g. a `claude -p` process cannot call a tool absent from its argv.

## Read, by reference

1. `docs/03-system-design/STARTUP-OS.md` **Part I only** (§1 why · §1b the census · §2 the founder's nine decisions)
   — the reality you start from. Stop at the line "# Part II".
2. `docs/02-competitive/expansion/00-TERRITORY.md` — the fourteen territories and twelve gaps, as a map, not a limit.
3. The catalogue, as you need it: `docs/02-competitive/expansion/concepts.md` (128 mechanisms, C1–C38 creativity,
   P priority, W world, X wiring, SI self-improvement, EC economics, CY company, A anti-mechanisms) ·
   `hands.md` (every MCP, CLI and hand measured) · `open-source.md` (177 repos and what to steal from each).
4. Your own framing file, `docs/03-system-design/vision/r0-<angle>.md`. Read only yours.

## The fixed shape — every vision uses these sections so they can be merged

```
0. THE PICTURE        the company fully grown, one to two pages, written as a visit — a day, a night, a month.
                      Concrete: names of things, numbers, what is on the screen, what is in the process list.
1. WHAT IT MAKES      artifacts, ventures, how many, cadence, how money flows in and out, what a good year looks like.
2. THE FOURTEEN, GROWN  each of the 14 territories (Missions · Workers · Hands · Knowledge · Memory · Communication ·
                      Context&cost · Quality&truth · Control&safety · Surfaces · Runtime · Self-improvement ·
                      Economics · Company) in 6–12 lines: what it IS at full scale. Files, formats, processes, hands.
3. WHAT COMPOUNDS     the flywheels. What the machine accumulates that makes year three easier than year one.
                      Name each store, what feeds it, what reads it, and what it changes.
4. THE FOUNDER        a Tuesday; a week; a quarter. What they touch, decide, see, and never see. How taste enters.
                      How they steer. What the machine may ask and how.
5. THE MACHINE'S NIGHT  3am at full scale: the process list, the hands with reach (publish, spend, contact,
                      inbound), what makes each safe BY CONSTRUCTION at that scale, what it makes, learns, judges.
6. BEYOND THE MAP     territories the fourteen do not contain. New kinds of thing.
7. THE PATH BACKWARDS  now read STARTUP-OS.md Part II. Derive month one FROM your picture. Then a table, one row
                      per territory: is the year-one frame a SLICE of your picture (same shape, smaller) or
                      merely SMALL (a different shape that would have to be replaced)? Be specific.
8. WHAT WOULD HAVE TO BE TRUE  the assumptions and measurements your picture rests on, ranked by how much
                      breaks if false.
```

600–1,000 lines. Cite the catalogue (`C2`, `P7`, a repo) where you draw on it; mark the rest `NEW`. Write as if
the founder will read it on a Tuesday morning and decide whether to build it.

## Output

`docs/03-system-design/vision/2026-09-02-<angle>.md`. Return ≤ 250 words: the picture in five sentences, the
three things in it no reference system has, and the one thing that would have to be true first.
