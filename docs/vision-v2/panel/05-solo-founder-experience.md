# Panel 5 — Solo-founder experience designer (sonnet, read-only)

## 1. Keep from S1.1
- **The six operator jobs** (`04-human-operation.md` §"Operator jobs and authority"; `L09-human.md` §"Operator jobs before surfaces"): what changed, what's owed, what happened, what's unknown, which decision needs me, what if I do nothing, how do I stop it. The organising frame for every founder surface — a design brief, not a literal schema.
- **DecisionPacket** (§"Human records and command contract"): binds an approval to exact artifact/scope/recipient/version, states options including delay/refuse, states no-answer behaviour, expires. The single best idea in S1.1 and exactly "one inbox for approvals".
- **Explicit no-answer behaviour, never silent approval** (§"Decision timing and no-answer behavior"): refuse new commitment / continue authorised work / invoke substitute.
- **Return-from-absence brief including the F2 delta** (§"Collaboration, absence, succession and departure"): what was omitted and contested, not just what was done.
- **Terminal-as-projection requirements** (§"Complete terminal and coding interaction"): persistent checkpoints, diff/test state, separating requested / acknowledged / confirmed for stop. The Claude Code CLI is the founder's daily interface today.
- **Mission Control's shipped ethos** (`mission-control/README.md`): local-only, read-only, SSE diffs, explicit "what this view will not show you" (no invented costs). Already built — build on it.

## 2. Cut or defer
- **Full typed schema layer** (`ActorBinding`, `AuthorityMatrix`, `ParticipationEncounter`, `DomainAssessment`, `OperatorProjection`, `HandoffAcceptance`, §19–36). **Trigger:** first hire/co-founder/board member with standing decision authority.
- **Fixed-cadence `ParticipationPlan`** (one cycle per 5 days, 4 stratified encounter kinds, seeded sampling, §107). Keep the worry (skill atrophy), cut the machinery. **Trigger:** measured judgment degradation.
- **`DomainAssessment` contestation workflow** (§105–113). **Trigger:** first non-founder decision-maker, or real harm from a competence gap.
- **`/people` and `/requests/:id` grievance surfaces** (§82–83). **Trigger:** first hire, or first paying customer with an SLA/legal support obligation.
- **Pixel-office visualisation** (§87). Cut outright.

## 3. Add
- **A literal cross-venture `/inbox`.** One ranked queue with venture as a tag, not N navigations.
- **Taste as a reusable, passively captured artifact.** Capture founder picks, rejections and edits into a preference store that framer/designer consult *before* presenting options. S1.1 only samples taste for competence checks.
- **An explicit trust ladder:** propose-only → approve-then-execute → auto-execute-with-notify → fully autonomous, per capability. The mechanism that shrinks inbox volume over months.
- **A notification policy.** Per-venture/domain; default batch-daily; escalate only inside `latest_decision_at` windows or on stop failure.
- **Chat as a named surface.** "I want X" typed into chat, backed by the same command/projection contract as the terminal — not a shortcut around authority.
- **A standing weekly digest**, generated not narrated: shipped, pending, capacity used vs available, likely decisions next week.

## 4. ADOPT / ADAPT / LEARN / BUILD
| Component | Decision | Tool | Reason |
|---|---|---|---|
| Inbox/approvals shell | ADAPT | Mission Control (existing Inbox view) | Already local/read-only/SSE; needs a write path, not a new app |
| Push/mobile alerts | ADOPT | ntfy.sh or Pushover | Solved problem; no bespoke mobile app |
| Chat front door | ADOPT | Slack Bolt SDK or a minimal Telegram bot | Handles auth, push, threading; wire to the orchestrator's command envelope |
| Taste/preference store | ADAPT + LEARN | Extend `.claude/memory/*.md` with structured preference records; learn passive capture from Superhuman/Raycast | Nothing captures this inside an agent harness |
| Trust ladder / autonomy toggles | BUILD | — | Must sit on this repo's risk-tier QA gate |
| Weekly digest | ADOPT | Cron/GitHub Actions + existing session-file convention | Compose from what's already written |
| Terminal continuity | ADOPT | Claude Code CLI + git worktrees | Render state into Mission Control |

## 5. Top 3 risks
1. **Spec-to-product inversion recurring.** S1.1 stalled on ~34 review docs verifying prose. The founder-surface layer cannot be validated by more prose. Mitigation: ship one working `/inbox` against real session data before more schema.
2. **Autonomy promotion hides failures.** L09 F1 (automation bias): a ladder that promotes on a clean streak makes the founder stop watching exactly the work just trusted. Mitigation: every auto-promoted action still appears in the weekly digest; silence is data.
3. **A flat cross-venture inbox degrades decisions.** L09 F4: interleaving Venture A pricing with Venture B refunds produces fast-but-bad decisions. Mitigation: group by venture inside one ranked list; never interleave across ventures in one batch.

## 6. Founder-only questions
1. How many ventures run concurrently now, and in 6 months?
2. Daily attention budget for approvals — minutes or decision count — and does it vary by day?
3. Urgent-interrupt channel: push, SMS, call, or batch-only until you open the terminal?
4. Is there a second decision-maker (co-founder, spouse, assistant) needing scoped authority now?
5. Trust ladder: one capability fully autonomous on day one, and one that never auto-executes regardless of track record?
