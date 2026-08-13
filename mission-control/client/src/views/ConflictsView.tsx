// client/src/views/ConflictsView.tsx — files two agent worktrees are both editing right now.
//
// A conflict here is a PREDICTION, not a git state: no merge has been attempted, and git
// would report nothing. Two worktrees holding uncommitted edits to the same path is the
// moment before the collision, which is the only moment at which it is cheap to fix.
//
// THREE THINGS THIS VIEW MUST SAY OUT LOUD, all of them about what it did NOT look at —
// because the previous collector said none of them and rendered a confident, wrong answer:
//   · how many worktrees the sweep skipped, and why (255 of 285 on this machine)
//   · which worktrees it could not read, kept separate from the ones that were clean
//   · that a project with no agent worktrees is absent from the list, not silently fine
//
// ConflictsTable is pure and stateless so test/views.test.tsx can render it against a real
// /api/conflicts payload and reverse every displayed figure.

import { useMemo } from 'react';
import type { ConflictReport, WorktreeChanges } from '../api.ts';
import { formatCount } from '../format.ts';
import { EmptyState, Footnote, StatusDot, Td, Th, Unavailable } from '../ui.tsx';

const COLUMNS = 3;

/** The last two path segments — enough to tell `.worktrees/ceo-1-178…` from its siblings. */
export function worktreeLabel(absPath: string): string {
  const parts = absPath.split('/').filter(Boolean);
  return parts.slice(-2).join('/');
}

export interface ConflictTotals {
  projects: number;
  swept: number;
  excluded: number;
  unreadable: number;
  conflicts: number;
  projectsWithConflicts: number;
}

/**
 * Every headline figure, summed in ONE pass over the SAME array the table renders.
 *
 * Exported and pure so a test can assert the header's numbers against the rows on screen.
 * The §0 corollary this exists to obey: a numerator and a denominator drawn from two
 * populations disagree eventually, and the Fleet headline shipped "2 of 11" for an answer of
 * 4 exactly that way. `swept` counts worktree rows; `excluded` sums the collector's own
 * per-project exclusion counts; nothing here recounts anything the server already counted.
 */
export function totalsFor(reports: ConflictReport[]): ConflictTotals {
  let swept = 0;
  let excluded = 0;
  let unreadable = 0;
  let conflicts = 0;
  let projectsWithConflicts = 0;
  for (const r of reports) {
    swept += r.worktrees.length;
    excluded += r.excluded.count;
    unreadable += r.worktrees.filter((w) => w.readable === false).length;
    conflicts += r.conflicts.length;
    if (r.conflicts.length > 0) projectsWithConflicts++;
  }
  return { projects: reports.length, swept, excluded, unreadable, conflicts, projectsWithConflicts };
}

/** Worktrees the sweep could not read — never folded in with the ones that were clean. */
export function UnreadableList({ worktrees }: { worktrees: WorktreeChanges[] }) {
  return (
    <ul className="space-y-1.5">
      {worktrees.map((w) => (
        <li key={w.path} className="border-l-2 border-l-warn pl-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <StatusDot tone="warn" title="The sweep could not read this worktree" />
            <span className="fig text-[12.5px] text-text" title={w.path}>
              {worktreeLabel(w.path)}
            </span>
            <span className="fig text-[11.5px] text-warn">could not look</span>
            {w.changedFiles.length > 0 && (
              <span className="fig text-[11.5px] text-muted">
                · {formatCount(w.changedFiles.length)} changed file
                {w.changedFiles.length === 1 ? '' : 's'} recovered before it failed
              </span>
            )}
          </div>
          <p className="mt-1 max-w-[78ch] text-[12px] leading-relaxed text-muted">{w.reason}</p>
        </li>
      ))}
    </ul>
  );
}

export function ConflictsTable({ report }: { report: ConflictReport }) {
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr>
          <Th>File</Th>
          <Th width="10ch" align="right" title="How many swept worktrees hold uncommitted edits to this path">
            Worktrees
          </Th>
          <Th>Branches</Th>
        </tr>
      </thead>
      <tbody>
        {report.conflicts.map((c, i) => (
          <tr key={c.file} className={`transition-colors hover:bg-raised ${i % 2 === 1 ? 'bg-row-alt' : ''}`}>
            <Td mono className="text-text" title={c.file}>
              {c.file}
            </Td>
            <Td align="right" mono className="text-warn">
              {formatCount(c.worktrees.length)}
            </Td>
            <Td className="text-muted">
              {c.worktrees.map((w, j) => (
                <span key={w.path} title={w.path}>
                  {j > 0 && <span className="text-dim"> · </span>}
                  <span className="fig">
                    {w.branch ?? <Unavailable short="detached" why={`${w.path} is in a detached-HEAD state, so it has no branch name to show.`} />}
                  </span>
                </span>
              ))}
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProjectSection({ report }: { report: ConflictReport }) {
  const unreadable = report.worktrees.filter((w) => w.readable === false);
  const clean = report.worktrees.length - unreadable.length;

  return (
    <section className="border-t border-line px-6 py-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="fig text-[13.5px] text-text">{report.project}</h2>
        <span className="text-[11.5px] text-dim">
          {formatCount(report.conflicts.length)} conflicting file{report.conflicts.length === 1 ? '' : 's'} ·{' '}
          {formatCount(clean)} worktree{clean === 1 ? '' : 's'} swept
          {unreadable.length > 0 && (
            <>
              {' · '}
              <span className="text-warn">{formatCount(unreadable.length)} unreadable</span>
            </>
          )}
        </span>
      </div>

      {report.conflicts.length > 0 && (
        <div className="mt-3">
          <ConflictsTable report={report} />
        </div>
      )}

      {unreadable.length > 0 && (
        <div className="mt-4">
          <div className="label mb-1.5">Could not look</div>
          <UnreadableList worktrees={unreadable} />
        </div>
      )}
    </section>
  );
}

export function ConflictsView({
  reports,
  loading,
  error,
  onRefresh,
}: {
  reports: ConflictReport[] | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const totals = useMemo(() => (reports ? totalsFor(reports) : null), [reports]);

  // Every project with something to say — a conflict, or a worktree it could not read.
  // A project with neither is genuinely nothing to report and is left out rather than
  // printed as a row of zeros nineteen times.
  const shown = useMemo(
    () => (reports ?? []).filter((r) => r.conflicts.length > 0 || r.worktrees.some((w) => w.readable === false)),
    [reports]
  );

  if (error !== null) {
    return (
      <EmptyState
        headline="The worktree sweep could not run."
        body={
          <>
            <span className="fig">{error}</span>. This view shells out to <code>git status --porcelain</code> in each
            agent-started worktree; if the server is up and this persists, run that command by hand in one of them to
            see the failure directly.
          </>
        }
      />
    );
  }

  if (totals === null) {
    return (
      <div className="border-t border-line px-6 py-14">
        <div className="max-w-[62ch]">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-live breathe" />
            <span className="text-[15px] font-medium text-text">Sweeping agent worktrees.</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            One <code className="fig">git status --porcelain</code> per worktree named in a project&rsquo;s{' '}
            <code className="fig">.worktrees/.registry</code>, run concurrently — about a second across the fleet.
            Nothing is written: the sweep passes <code className="fig">--no-optional-locks</code> so git does not
            refresh anybody&rsquo;s index behind it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-6 py-3">
        <div>
          <div className="label">Files two worktrees are both editing</div>
          <div className={`fig mt-1 text-xl leading-none ${totals.conflicts > 0 ? 'text-warn' : 'text-text'}`}>
            {formatCount(totals.conflicts)}
          </div>
          <div className="mt-1.5 text-[11px] text-dim">
            across {formatCount(totals.projectsWithConflicts)} of {formatCount(totals.projects)} projects ·{' '}
            {formatCount(totals.swept)} agent worktrees swept
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="ml-auto rounded-[3px] border border-line-strong px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-live hover:text-text active:translate-y-[1px] disabled:cursor-wait disabled:opacity-50"
          title="Re-runs git status --porcelain in every swept worktree"
        >
          {loading ? 'Sweeping…' : 'Re-sweep'}
        </button>
      </div>

      {/* THE NARROWING, STATED UNDER THE HEADER. The sweep looks at 30 of 285 worktrees on
          this machine; a reader who does not know that would take "3 conflicts" as a
          statement about every worktree they have, which it is not. */}
      {totals.excluded > 0 && (
        <p className="border-t border-line px-6 py-2 text-[12px] text-muted">
          <span className="fig text-warn">{formatCount(totals.excluded)}</span> worktrees not swept (not
          agent-started).{' '}
          <span className="text-dim">
            A worktree is swept when its project&rsquo;s <code className="fig">.worktrees/.registry</code> names it and
            git does not report it prunable. The rest are real worktrees that may hold uncommitted work — they are
            outside what an agent-conflict view can speak for, and sweeping all {formatCount(totals.swept + totals.excluded)}{' '}
            cost 17 seconds per request.
          </span>
        </p>
      )}

      {totals.unreadable > 0 && (
        <p className="border-t border-line px-6 py-2 text-[12px] text-warn">
          {formatCount(totals.unreadable)} swept worktree{totals.unreadable === 1 ? '' : 's'} could not be read. Those
          are listed below with the reason — they are NOT counted as clean.
        </p>
      )}

      {shown.length === 0 ? (
        <EmptyState
          headline="No two agent worktrees are editing the same file."
          body={
            <>
              {formatCount(totals.swept)} agent-started worktrees across {formatCount(totals.projects)} projects were
              swept and every one of them was readable, so this is a measured all-clear rather than an empty list. A
              conflict appears here when two worktrees hold uncommitted changes to the same path — before either one
              merges, which is when it is still cheap to resolve.
            </>
          }
        />
      ) : (
        shown.map((r) => <ProjectSection key={r.project} report={r} />)
      )}

      <Footnote>
        A row here is a PREDICTION, not a git state: nothing has been merged and{' '}
        <code>git status</code> in either worktree reports no problem. It is the moment before the collision. The
        sweep reads <code>git status --porcelain</code> in each swept worktree with{' '}
        <code>--no-optional-locks</code>, so it never writes to anybody&rsquo;s index, and it does not yet catch two
        worktrees that both COMMITTED changes to one file with no uncommitted state left — that needs a merge-base
        diff. A worktree the sweep could not read is listed separately and never counted as clean, because &ldquo;I
        could not look&rdquo; and &ldquo;there is nothing here&rdquo; are different answers.
      </Footnote>
    </section>
  );
}

export { COLUMNS as CONFLICT_COLUMNS };
