---
status: unanswered
artifact: none
---

# Audience

**UNANSWERED.** Nobody has written down who this is for.

## The question

Who is this for, what do they already use, and **what does that forbid?**

## What this file will hold when it is answered

- The actual users, in specifics — not a persona template.
- The products they already use daily, because that is what sets their expectations of an interface
  before it renders.
- What that forbids. This is the half that makes the file useful: an audience that lives in a
  terminal forbids a marketing-site hero; an audience on a phone forbids a nine-column table.

## Why this is a question and not a persona

`docs/03-system-design/agents/DESIGNER.md` §3.1 is explicit that **demographics is data, not
procedure** — inventing a persona here would produce a document that reads like research and is not.
This file gets answered from customer evidence or it stays unanswered.

## One measurement that already constrains it

mission-control, live: **574px of horizontal overflow at 390px**, nav clipped after "Belief", Inbox
and Dispatch unreachable at any scroll offset, and **57 of 64 interactive elements below the WCAG 2.2
AA target size** (SC 2.5.8, 24×24). Either mobile is out of scope — which is an audience decision
nobody has recorded — or the product is unusable for a case it claims. **Those are the only two
readings, and this file is where the choice belongs.**
