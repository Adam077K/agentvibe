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
import type { FleetRow, FleetSummary, ModalGeneration } from '../api.ts';
import { formatCount, formatShare, formatRelative, formatAbsolute, tildeHome } from '../format.ts';
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

const NO_MODAL_REASON: Record<Exclude<ModalGeneration['kind'], 'modal'>, string> = {
  tie: 'In-scope launchers are split evenly across several generations, so there is no current one to compare against.',
  'none-in-scope': 'Every launcher is excluded from the managed set, so there is no generation the fleet is expected to converge on.',
  'no-launchers': 'No launchers were listed at all — typically a machine with no ~/bin — so there is nothing to compare against.',
};

function DriftCell({ row, modal }: { row: FleetRow; modal: ModalGeneration }) {
  if (row.launcherDrift === null) {
    const why = !('gen' in row.launcher)
      ? 'No launcher for this project, so there is no generation to compare.'
      : row.launcher.scope === 'excluded'
        ? 'This launcher is excluded from the managed set — it is not expected to match the fleet generation, so a difference is not drift.'
        : NO_MODAL_REASON[modal.kind as Exclude<ModalGeneration['kind'], 'modal'>];
    return <Unavailable short="n/a" why={why} />;
  }
  if (!row.launcherDrift) {
    return <span className="text-muted">current</span>;
  }
  return (
    <span
      className="text-warn"
      title={`Generation differs from ${modal.kind === 'modal' ? modal.generation : 'the modal in-scope generation'}`}
    >
      drift
    </span>
  );
}

/** The parent directory of a project root — its configured root, as a display string. */
function parentDir(absPath: string): string {
  return absPath.replace(/\/[^/]+$/, '');
}

export function FleetTable({ fleet, now }: { fleet: FleetSummary | null; now: number }) {
  const rows = useMemo(() => (fleet ? sortFleet(fleet.projects) : []), [fleet]);
  const home = useMemo(() => {
    const first = fleet?.projects[0]?.root ?? '';
    const match = /^(\/(?:Users|home)\/[^/]+)\//.exec(first);
    return match?.[1] ?? '';
  }, [fleet]);

  // EVERY root, not the first row's. MC_PROJECT_ROOTS is colon-separated like PATH, and
  // naming one root while rows come from several is a completeness claim about a set the
  // sentence does not describe — the reader would have no way to know a second root exists.
  const roots = useMemo(
    () => [...new Set((fleet?.projects ?? []).map((p) => parentDir(p.root)))].sort(),
    [fleet]
  );

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
          <Th align="right" title="Output tokens across every indexed transcript for this project, all time">
            Output tokens · all time
          </Th>
          <Th align="right" title="The subagent share of those all-time output tokens">
            Subagent
          </Th>
          <Th align="right">Last activity</Th>
        </tr>
      </thead>
      <tbody>
        {fleet === null && <LoadingRows columns={COLUMNS} />}
        {rows.map((row, i) => (
          <tr
            key={row.id}
            // Zebra, not hairlines. A 1px separator at 1.17:1 across a 1600px eight-column
            // row is not something an eye can track; alternating fill is.
            //
            // The agent-active/dormant break is carried by SPACE. It had a rule too, at
            // 1.42:1 — invisible, and therefore a line that claimed to divide and did not.
            // The padding is what a reader actually perceives, so the padding is what stayed.
            className={`transition-colors even:bg-row-alt hover:bg-raised ${
              row.agentActive ? '' : 'text-muted'
            } ${i === firstDormant && firstDormant > 0 ? '[&>td]:pt-5' : ''}`}
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
            <Td>{fleet && <DriftCell row={row} modal={fleet.modalGeneration} />}</Td>
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
              title={
                formatShare(row.subagentOutputTokens, row.outputTokens)
                  ? `${formatShare(row.subagentOutputTokens, row.outputTokens)} of this project's all-time output tokens`
                  : 'This project has no output tokens recorded, so there is no share to compute'
              }
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
            {roots.map((root, i) => (
              <span key={root}>
                {i > 0 && (i === roots.length - 1 ? ' and ' : ', ')}
                <span className="fig text-muted">{tildeHome(root, home)}</span>
              </span>
            ))}{' '}
            is a row here, dormant ones included. <span className="fig text-muted">no launcher</span> means{' '}
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
  const subagentShare = formatShare(budget.subagent_output_tokens, budget.output_tokens);

  return (
    <div className="flex flex-wrap items-stretch divide-x divide-line px-6 py-1">
      {/* "Burn", not "Output tokens". This figure sat directly above a column headed
          `OUTPUT TOKENS` meaning something ~30x larger and scoped completely differently —
          one is account-wide over five hours, the other is per-project over all time. Two
          identical labels for two unrelated quantities is a reading error waiting to happen,
          so neither label is allowed to be the bare words any more. */}
      <Figure
        label={`Burn · rolling ${budget.window_hours}h · account-wide`}
        value={formatCount(budget.output_tokens)}
        sub={
          subagentShare
            ? `${formatCount(budget.subagent_output_tokens)} subagent (${subagentShare}) · every project on this account`
            : `no output tokens in the last ${budget.window_hours}h · every project on this account`
        }
        title={`${formatCount(budget.filesScanned)} transcripts scanned, ${formatCount(budget.bytesRead)} bytes read for this figure`}
      />
      <Figure
        label="Projects"
        value={formatCount(fleet.projects.length)}
        sub={`${formatCount(active)} agent-active · ${formatCount(fleet.projects.length - active)} dormant`}
      />
      <GenerationFigure modal={fleet.modalGeneration} drifted={drifted} />
    </div>
  );
}

/**
 * THE ALL-CLEAR IS ONLY PRINTED WHEN A COMPARISON HAPPENED.
 *
 * The first version read `drifted === 0 ? 'every in-scope launcher on the modal generation'
 * : …`. When there is no modal generation, every row's drift is null, so `drifted` is 0, so
 * that branch rendered a positive convergence claim — in the largest type on the screen, in
 * exactly the case where nothing was compared. `DriftCell` had it right per row (`n/a` plus
 * the specific reason) and the headline contradicted it.
 *
 * Now the three no-comparison cases are distinct values from the collector, each rendered as
 * an explicitly unavailable figure naming what would fill it, and the convergence sentence
 * exists in one branch only: `kind === 'modal'`.
 */
export function GenerationFigure({ modal, drifted }: { modal: ModalGeneration; drifted: number }) {
  // The FIGURE IS THE DRIFT COUNT, not the generation hash. Amber previously landed on the
  // modal generation — the healthy target every launcher is supposed to match — while the
  // number that actually needs attention was a small word further down each drifted row.
  // The colour of alarm now sits on the count of things wrong, and the target it is measured
  // against moves to the caption, where a hash belongs.
  const label = 'Launcher drift';

  if (modal.kind === 'modal') {
    return (
      <Figure
        label={label}
        value={formatCount(drifted)}
        sub={
          drifted === 0
            ? `all ${formatCount(modal.inScopeLaunchers)} in-scope launchers on ${modal.generation}`
            : `of ${formatCount(modal.inScopeLaunchers)} in-scope launcher${
                modal.inScopeLaunchers === 1 ? '' : 's'
              }, off ${modal.generation}`
        }
        tone={drifted > 0 ? 'warn' : 'default'}
        title={`Launchers whose generation differs from ${modal.generation}, the most common among in-scope launchers`}
      />
    );
  }

  if (modal.kind === 'tie') {
    return (
      <Figure
        label={label}
        value={
          <Unavailable
            short="not compared"
            why={`${modal.inScopeLaunchers} in-scope launchers are split evenly across ${modal.candidates.length} generations (${modal.candidates.join(', ')}), so there is no current generation to measure against. No project was compared and none is marked drifted — this is not a clean bill of health. Rolling the fleet onto one generation would fill this.`}
          />
        }
        sub={`${formatCount(modal.candidates.length)} generations tied across ${formatCount(modal.inScopeLaunchers)} in-scope launchers`}
        tone="warn"
      />
    );
  }

  if (modal.kind === 'none-in-scope') {
    return (
      <Figure
        label={label}
        value={
          <Unavailable
            short="not compared"
            why={`All ${modal.launchers} launchers are marked excluded from the managed set, so none is expected to converge and a difference between them is not drift. No project was compared. One in-scope launcher would fill this.`}
          />
        }
        sub={`${formatCount(modal.launchers)} launchers, every one excluded`}
      />
    );
  }

  return (
    <Figure
      label={label}
      value={
        <Unavailable
          short="not compared"
          why="`node scripts/warroom-install.mjs fleet` listed no launchers at all — typically a machine with no ~/bin, such as a CI runner. Nothing was compared and no project is marked drifted. Installing a standalone launcher would fill this."
        />
      }
      sub="no launchers listed on this machine"
    />
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
