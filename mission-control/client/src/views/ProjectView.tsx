// client/src/views/ProjectView.tsx — one project, reached by clicking its row in Fleet.
//
// NO PICKER, deliberately. A second project selector would be a second list of projects on
// screen, and the Fleet table already is that list — with the activity, worktree and token
// figures that tell you which project you actually want. A drill-down keeps one population
// visible and one way in.
//
// WHAT THIS VIEW HONESTLY HAS. Three of its four sections are real data — transcript rollups
// from the session index, the event-log summary, and discovery facts. The fourth, playbook
// stage progress, has NO SOURCE: nothing in this repository emits it. That absence is the
// whole reason server/collectors/empty.ts exists, and it is rendered here as a probe a reader
// can re-run, not as an empty panel implying there is nothing to report.

import type { ProjectDetail } from '../api.ts';
import { PROJECT_PROBE_TIMEOUT_SECONDS } from '../../../server/collectors/probe-bounds.ts';
import { formatCount, formatRelative, formatShare, tildeHome } from '../format.ts';
import { EmptyState, Figure, Footnote, HeadlineBar, RefreshButton, StatusDot, Td, Th, Unavailable } from '../ui.tsx';

/** The event kinds worth a row of their own, in the order a reader cares about them. */
const EVENT_ORDER = ['claim.block', 'claim.would_block', 'budget.block', 'budget.allowed_safelisted'];

function eventRows(byEvent: Record<string, number>): { event: string; count: number }[] {
  const known = EVENT_ORDER.filter((e) => byEvent[e] !== undefined).map((e) => ({ event: e, count: byEvent[e] as number }));
  const rest = Object.entries(byEvent)
    .filter(([e]) => !EVENT_ORDER.includes(e))
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count || a.event.localeCompare(b.event));
  return [...known, ...rest];
}

export function ProjectEvents({ events }: { events: ProjectDetail['project']['events'] }) {
  if (!events.found) {
    return (
      <div className="border-l-2 border-l-line-strong pl-3">
        <div className="fig text-[12px] text-dim">no event log</div>
        <p className="mt-1 max-w-[78ch] text-[12.5px] leading-relaxed text-muted">
          Nothing has been written to <span className="fig">{events.path}</span>. That path is resolved the same way
          scripts/ledger.mjs and the budget guard resolve it — from this project&rsquo;s own{' '}
          <code>.warroom.yml</code>, falling back to <code>~/.&lt;project&gt;/events.jsonl</code>. The file appears the
          first time a claim resolver or the budget guard logs, so an absent one means neither has run here, NOT that
          both ran clean.
        </p>
      </div>
    );
  }

  const rows = eventRows(events.byEvent);
  const { real, synthetic, unknown } = events.budgetBlock;
  return (
    <div className="space-y-3">
      <div className="fig text-[12.5px] text-muted">
        <span className="text-text">{formatCount(events.totalLines)}</span> lines
        {events.unparseableLines > 0 && (
          <>
            {' · '}
            <span className="text-warn" title="Lines that did not parse as JSON. Counted, never skipped silently.">
              {formatCount(events.unparseableLines)} unparseable
            </span>
          </>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-[12.5px] text-muted">
          The log exists and holds {formatCount(events.totalLines)} lines, none of which are events this view
          summarises.
        </p>
      ) : (
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <Th>Event</Th>
              <Th width="12ch" align="right">
                Count
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.event} className={`transition-colors hover:bg-raised ${i % 2 === 1 ? 'bg-row-alt' : ''}`}>
                <Td mono className={r.event.startsWith('claim.block') ? 'text-bad' : 'text-text'}>
                  {r.event}
                </Td>
                <Td align="right" mono className="text-muted">
                  {formatCount(r.count)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* A budget block is not one thing. `real` means the reason cited the ceiling actually
          configured in budget-guard.js; `synthetic` means it cited a different one, which is
          what a test run produces; `unknown` means the reason could not be parsed at all.
          Collapsing them would let a suite's own fixtures read as production incidents. */}
      {real + synthetic + unknown > 0 && (
        <div className="fig text-[12px] text-muted">
          budget blocks — <span className={real > 0 ? 'text-warn' : 'text-dim'}>{formatCount(real)} real</span> ·{' '}
          <span className="text-dim">{formatCount(synthetic)} synthetic</span> ·{' '}
          <span className="text-dim">{formatCount(unknown)} unknown</span>
          {events.configuredCeilings !== null && (
            <span className="text-dim">
              {' '}
              · ceilings {formatCount(events.configuredCeilings.window)} window /{' '}
              {formatCount(events.configuredCeilings.stall)} stall
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectStageProbe({ empty }: { empty: ProjectDetail['empty'] }) {
  // THE PROBE COULD NOT COMPLETE — distinct from "it completed and found nothing", and the
  // 34 GB project on this machine is exactly the case: 107,806 ms of scanning, cut off at the
  // 10 s bound. Rendering that as an empty state would be a claim about a tree nobody read.
  if (empty.readable === false) {
    return (
      <div className="border-l-2 border-l-warn pl-3">
        <div className="fig text-[12px] text-warn">could not look at all of it</div>
        <p className="mt-1 max-w-[78ch] text-[12.5px] leading-relaxed text-muted">{empty.reason}</p>
        <p className="mt-2 max-w-[78ch] text-[12px] leading-relaxed text-dim">
          {empty.found
            ? 'A marker WAS found in the part that was searched, so this project does emit stage progress — the count below it is simply incomplete.'
            : 'No marker was found in the part that was searched, which is not the same as none existing.'}{' '}
          The probe is <code className="fig">{empty.probe}</code> — run it yourself to see the same answer.
        </p>
      </div>
    );
  }

  if (empty.found) {
    return (
      <p className="max-w-[78ch] text-[12.5px] leading-relaxed text-muted">
        This project emits playbook stage progress — <code className="fig">{empty.probe}</code> matched. Mission
        Control does not yet read those markers into a stage timeline; the probe reports only that they exist.
      </p>
    );
  }

  return (
    <div className="border-l-2 border-l-line-strong pl-3">
      <div className="fig text-[12px] text-dim">no stage progress emitted</div>
      <p className="mt-1 max-w-[78ch] text-[12.5px] leading-relaxed text-muted">
        The probe ran to completion and matched nothing: <code className="fig">{empty.probe}</code>. This is a checked
        answer, not an unvisited panel.
      </p>
      <p className="mt-2 max-w-[78ch] text-[12px] leading-relaxed text-dim">{empty.would_fill}</p>
    </div>
  );
}

/**
 * The headline band. A separate export for the same reason FleetHeadline is one: the three
 * largest figures on the screen are the ones worth reversing to the payload positionally, and
 * a test can only read them positionally if it can render them without the four sections
 * below them contributing numbers of their own.
 */
export function ProjectHeadline({
  project,
  now,
  loading,
  onRefresh,
}: {
  project: ProjectDetail['project'];
  now: number;
  loading: boolean;
  onRefresh: () => void;
}) {
  const { stats } = project;
  const subagentShare = formatShare(stats.totalSubagentOutputTokens, stats.totalOutputTokens);
  const home = /^(\/(?:Users|home)\/[^/]+)\//.exec(project.root)?.[1] ?? '';

  return (
    <HeadlineBar
      action={
        <RefreshButton
          onClick={onRefresh}
          busy={loading}
          idleLabel="Re-read"
          busyLabel="Reading…"
          title="Re-reads the session index and re-runs the stage probe for this project"
        />
      }
    >
      <Figure
        label="Project"
        value={
          <span className="flex items-center gap-2">
            <StatusDot
              tone={project.agentActive ? 'live' : 'idle'}
              breathing={project.agentActive}
              title={project.agentActive ? 'Agent-active — live .worktrees/.registry' : 'Dormant — no registry file'}
            />
            {project.id}
          </span>
        }
        sub={tildeHome(project.root, home)}
        title="The directory name under a configured root. Agent-active means this project has a live .worktrees/.registry, which a CEO launcher writes when it starts a session."
      />
      <Figure
        label="Sessions · all time"
        value={formatCount(stats.sessionCount)}
        sub={
          stats.lastActivityAt === null
            ? 'no recorded turn'
            : `last activity ${formatRelative(stats.lastActivityAt, now)}`
        }
        title="Transcripts indexed for this project across every directory under ~/.claude/projects whose encoded path matches this root. All time, not the rolling window."
      />
      <Figure
        label="Output tokens · all time"
        value={formatCount(stats.totalOutputTokens)}
        sub={
          subagentShare === null ? (
            <Unavailable
              short="no share"
              why="This project has no recorded output tokens, so there is no subagent share to compute."
            />
          ) : (
            `${formatCount(stats.totalSubagentOutputTokens)} subagent (${subagentShare})`
          )
        }
        title="Summed from every indexed transcript for this project, from scripts/lib/usage.js's own turn parsing by way of the session index. All time — the rolling 5-hour figure on Fleet is account-wide and is a different quantity."
      />
    </HeadlineBar>
  );
}

export function ProjectView({
  detail,
  loading,
  error,
  now,
  onRefresh,
  onBack,
}: {
  detail: ProjectDetail | null;
  loading: boolean;
  error: string | null;
  now: number;
  onRefresh: () => void;
  onBack: () => void;
}) {
  if (error !== null) {
    return (
      <EmptyState
        headline="This project could not be read."
        body={
          <>
            <span className="fig">{error}</span>. A project disappears from this route when its directory is removed
            or renamed between the Fleet row being drawn and this request — reopen Fleet to see the current list.
          </>
        }
      />
    );
  }

  if (detail === null) {
    return (
      <div className="border-t border-line px-6 py-14">
        <div className="max-w-[62ch]">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-live breathe" />
            <span className="text-[15px] font-medium text-text">Reading this project.</span>
          </div>
          {/* The bound is READ FROM THE CONSTANT the collector enforces, never spelled out.
              This sentence said "ten seconds" in prose while empty.ts interpolated the
              constant into its reason string — so changing the constant left the pending
              state announcing a bound that no longer existed. */}
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Session rollups come from the in-memory index and are instant; the stage probe is a recursive{' '}
            <code className="fig">grep</code> over the project tree, which is milliseconds on a small repository and
            seconds on a large one. It is bounded at {PROJECT_PROBE_TIMEOUT_SECONDS} seconds and will say so if it
            hits that.
          </p>
        </div>
      </div>
    );
  }

  const { project, empty } = detail;

  return (
    <section>
      <ProjectHeadline project={project} now={now} loading={loading} onRefresh={onRefresh} />

      <div className="border-t border-line px-6 py-2">
        <button
          type="button"
          onClick={onBack}
          className="text-[12px] text-dim transition-colors hover:text-text"
          title="Back to the project list"
        >
          &larr; Fleet
        </button>
      </div>

      <section className="border-t border-line px-6 py-5">
        <h2 className="text-[14px] font-medium text-text">Run log</h2>
        <p className="mt-1 max-w-[78ch] text-[12px] leading-relaxed text-dim">
          Claim verdicts and budget decisions this project has recorded, read from{' '}
          <span className="fig">{project.events.path}</span>.
        </p>
        <div className="mt-4">
          <ProjectEvents events={project.events} />
        </div>
      </section>

      <section className="border-t border-line px-6 py-5">
        <h2 className="text-[14px] font-medium text-text">Playbook stage progress</h2>
        <p className="mt-1 max-w-[78ch] text-[12px] leading-relaxed text-dim">
          The one section of this view with no data source anywhere in the repository. What is shown is a probe and
          its result, executed on request.
        </p>
        <div className="mt-4">
          <ProjectStageProbe empty={empty} />
        </div>
      </section>

      <Footnote>
        Every figure above is read at request time: session rollups from the in-memory transcript index, the run log
        by parsing <code>events.jsonl</code>, and the stage probe by executing the grep printed beside it. There is no
        cache between them and no per-project cost figure — this repository holds no price table, and a hardcoded one
        would go stale the next time rates move.
      </Footnote>
    </section>
  );
}
