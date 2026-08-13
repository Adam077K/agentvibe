// client/src/views/FleetView.tsx — every git repo under the roots, agent-active first.
//
// DISCOVERED, NEVER CONFIGURED. The rows here are whatever discoverProjects() walked off
// disk. There is no list of projects in this file, and there must never be one: the
// hand-typed list this replaced omitted `finfun`, and a project missing from a control
// plane is worse than no control plane, because it looks complete.
//
// FleetTable takes its data as a prop and holds no state, so test/views.test.tsx can render
// it against a real /api/fleet payload and compare every displayed figure to the payload it
// came from. Anything that fetches, ticks or subscribes lives in FleetView below it.

import { useMemo } from 'react';
import type { FleetRow, FleetSummary } from '../api.ts';
import { formatCount, formatPercent, formatRelative, formatAbsolute, tildeHome } from '../format.ts';
import { EmptyState, Figure, Footnote, LoadingRows, StatusDot, Td, Th, Unavailable } from '../ui.tsx';

const COLUMNS = 9;

/** Agent-active first, then by most recent activity. Dormant projects sort below, never out. */
export function sortFleet(rows: FleetRow[]): FleetRow[] {
  return [...rows].sort((a, b) => {
    if (a.agentActive !== b.agentActive) return a.agentActive ? -1 : 1;
    const byActivity = (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0);
    return byActivity !== 0 ? byActivity : a.id.localeCompare(b.id);
  });
}

function GenerationCell({ row }: { row: FleetRow }) {
  if (!('gen' in row.launcher)) {
    return <Unavailable short="no launcher" why={row.launcher.reason} />;
  }
  return (
    <span title={`${row.launcher.lines} lines · ${row.launcher.fns} functions · ${row.launcher.scope}`}>
      {row.launcher.gen}
    </span>
  );
}

function DriftCell({ row, modalGeneration }: { row: FleetRow; modalGeneration: string | null }) {
  if (row.launcherDrift === null) {
    const why =
      !('gen' in row.launcher)
        ? 'No launcher for this project, so there is no generation to compare.'
        : row.launcher.scope === 'excluded'
          ? 'This launcher is excluded from the managed set — it is not expected to match the fleet generation, so a difference is not drift.'
          : 'No single modal generation among in-scope launchers (a tie), so there is nothing to call current.';
    return <Unavailable short="n/a" why={why} />;
  }
  if (!row.launcherDrift) {
    return <span className="text-dim">current</span>;
  }
  return (
    <span className="text-warn" title={`Generation differs from the modal in-scope generation ${modalGeneration}`}>
      drift
    </span>
  );
}

export function FleetTable({ fleet, now }: { fleet: FleetSummary | null; now: number }) {
  const rows = useMemo(() => (fleet ? sortFleet(fleet.projects) : []), [fleet]);
  const home = useMemo(() => {
    const first = fleet?.projects[0]?.root ?? '';
    const match = /^(\/(?:Users|home)\/[^/]+)\//.exec(first);
    return match?.[1] ?? '';
  }, [fleet]);

  const firstDormant = rows.findIndex((r) => !r.agentActive);

  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr>
          <Th width="26px" title="Filled when this project has a live .worktrees/.registry">
            <span className="sr-only">Agent</span>
          </Th>
          <Th>Project</Th>
          <Th title="Launcher generation hash from `node scripts/warroom-install.mjs fleet`">Generation</Th>
          <Th title="Whether this launcher's generation differs from the modal in-scope generation">Drift</Th>
          <Th align="right" title="git worktrees other than the main checkout">
            Worktrees
          </Th>
          <Th align="right" title="Transcripts indexed for this project, all time">
            Sessions
          </Th>
          <Th align="right" title="Output tokens across every indexed transcript, all time">
            Output tokens
          </Th>
          <Th align="right" title="The subagent share of those output tokens">
            Subagent
          </Th>
          <Th align="right">Last activity</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line/70">
        {fleet === null && <LoadingRows columns={COLUMNS} />}
        {rows.map((row, i) => (
          <tr
            key={row.id}
            // The break between agent-active and dormant is a real grouping, so it gets a
            // stronger rule and real space rather than another 1px line identical to the
            // eighteen row separators around it.
            className={`transition-colors hover:bg-raised ${row.agentActive ? '' : 'text-muted'} ${
              i === firstDormant && firstDormant > 0 ? 'border-t border-t-line-strong [&>td]:pt-4' : ''
            }`}
          >
            <Td className="pr-0 pl-4">
              <StatusDot
                tone={row.agentActive ? 'live' : 'idle'}
                breathing={row.agentActive}
                title={row.agentActive ? 'Agent-active — live .worktrees/.registry' : 'Dormant — no registry file'}
              />
            </Td>
            <Td>
              <span className={`fig ${row.agentActive ? 'text-text' : ''}`} title={row.root}>
                {row.id}
              </span>
              {/* Marked when PRESENT, not when absent. One project in nineteen has a built
                  ledger, so flagging the absence tagged eighteen rows with the same words
                  and turned the identifier column into noise. */}
              {row.ledgerPresent && (
                <span
                  className="ml-2 rounded-[2px] border border-line-strong px-1 py-px text-[10px] text-muted"
                  title="This project has a built claim ledger index at .claude/ledger/index.json"
                >
                  ledger
                </span>
              )}
            </Td>
            <Td mono className="text-muted">
              <GenerationCell row={row} />
            </Td>
            <Td>
              <DriftCell row={row} modalGeneration={fleet?.modalGeneration ?? null} />
            </Td>
            <Td align="right" mono className={row.worktreeCount > 0 ? '' : 'text-dim'}>
              {formatCount(row.worktreeCount)}
            </Td>
            <Td align="right" mono className={row.sessionCount > 0 ? '' : 'text-dim'}>
              {formatCount(row.sessionCount)}
            </Td>
            <Td align="right" mono className={row.outputTokens > 0 ? '' : 'text-dim'}>
              {formatCount(row.outputTokens)}
            </Td>
            <Td
              align="right"
              mono
              className="text-muted"
              title={`${formatPercent(row.subagentOutputTokens, row.outputTokens)} of this project's output tokens`}
            >
              {formatCount(row.subagentOutputTokens)}
            </Td>
            <Td align="right" className="text-muted" title={formatAbsolute(row.lastActivityAt)}>
              {formatRelative(row.lastActivityAt, now)}
            </Td>
          </tr>
        ))}
      </tbody>
      {fleet !== null && rows.length > 0 && (
        <caption className="caption-bottom text-left">
          <Footnote>
            Roots are walked, not configured — every git repository directly under{' '}
            <span className="fig text-muted">{tildeHome(rows[0]?.root ?? '', home).replace(/\/[^/]+$/, '')}</span> is a
            row here, dormant ones included. <span className="fig text-muted">no launcher</span> means{' '}
            <code>warroom-install.mjs fleet</code> listed no <code>~/bin/&lt;project&gt;</code>; hover any dotted cell
            for its exact reason. Output tokens are all-time totals from the transcript index — the rolling 5-hour
            figure above is account-wide, and no per-project window figure exists to show here.
          </Footnote>
        </caption>
      )}
    </table>
  );
}

export function FleetHeadline({ fleet }: { fleet: FleetSummary | null }) {
  if (fleet === null) {
    return (
      <div className="flex items-stretch divide-x divide-line px-6 py-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="px-5 py-3 first:pl-0">
            <div className="skeleton h-[8px] w-16" />
            <div className="skeleton mt-2 h-[16px] w-28" />
          </div>
        ))}
      </div>
    );
  }

  const active = fleet.projects.filter((p) => p.agentActive).length;
  const drifted = fleet.projects.filter((p) => p.launcherDrift === true).length;
  const budget = fleet.budget;

  return (
    <div className="flex flex-wrap items-stretch divide-x divide-line px-6 py-1">
      <Figure
        label={`Output tokens · rolling ${budget.window_hours}h`}
        value={formatCount(budget.output_tokens)}
        sub={`${formatCount(budget.subagent_output_tokens)} subagent (${formatPercent(
          budget.subagent_output_tokens,
          budget.output_tokens
        )}) · account-wide, every project`}
        title={`${formatCount(budget.filesScanned)} transcripts scanned, ${formatCount(budget.bytesRead)} bytes read`}
      />
      <Figure
        label="Projects"
        value={formatCount(fleet.projects.length)}
        sub={`${formatCount(active)} agent-active · ${formatCount(fleet.projects.length - active)} dormant`}
      />
      <Figure
        label="Modal launcher generation"
        value={fleet.modalGeneration ?? 'none'}
        sub={
          drifted === 0
            ? 'every in-scope launcher on the modal generation'
            : `${formatCount(drifted)} in-scope launcher${drifted === 1 ? '' : 's'} off the modal generation`
        }
        tone={drifted > 0 ? 'warn' : 'default'}
        title="The most common generation among in-scope launchers"
      />
    </div>
  );
}

export function FleetView({ fleet, now }: { fleet: FleetSummary | null; now: number }) {
  const empty = fleet !== null && fleet.projects.length === 0;
  return (
    <section>
      <FleetHeadline fleet={fleet} />
      {empty ? (
        <EmptyState
          headline="No git repositories found under the configured roots."
          body={
            <>
              Mission Control walks each root and treats every directory containing a <code>.git</code> as a project.
              The default root is <code>~/VibeCoding</code>; set <code>MC_PROJECT_ROOTS</code> (colon-separated, like{' '}
              <code>PATH</code>) on the server process to point it somewhere else. A root that does not exist yields
              zero projects rather than an error, which is what this screen is showing.
            </>
          }
        />
      ) : (
        <FleetTable fleet={fleet} now={now} />
      )}
    </section>
  );
}
