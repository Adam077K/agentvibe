// client/src/views/ConflictsView.tsx — files two agent worktrees are both editing right now.
//
// A conflict here is a PREDICTION, not a git state: no merge has been attempted, and git
// would report nothing. Two worktrees holding uncommitted edits to the same path is the
// moment before the collision, which is the only moment at which it is cheap to fix.
//
// FOUR THINGS THIS VIEW MUST SAY OUT LOUD, all of them about what it did NOT look at —
// because the previous collector said none of them and rendered a confident, wrong answer:
//   · how many worktrees the sweep skipped, and why (255 of 285 on this machine)
//   · which worktrees it could not read, kept separate from the ones that were clean
//   · that a project with no agent worktrees is absent from the list, not silently fine
//   · which projects the sweep was NOT ALLOWED to run in, and why — the allowlist
//
// THE FOURTH IS THE NEW ONE AND IT IS THE ONE MOST LIKELY TO BE GOT WRONG. An untrusted
// project is not dropped from the payload and it is not dropped from the denominator: it is
// counted in `projects`, listed by name with the server's own reason, and the file to edit is
// named. Filtering it out would render as "you have no such project", and a security control
// that silently hides data is a new instance of the defect class this codebase is named for,
// not a fix for one.
//
// ConflictsTable is pure and stateless so test/views.test.tsx can render it against a real
// /api/conflicts payload and reverse every displayed figure.

import { useMemo } from 'react';
import type { ConflictReport, UntrustedProject, WorktreeChanges } from '../api.ts';
import { formatCount } from '../format.ts';
import { EmptyState, Figure, Footnote, HeadlineBar, RefreshButton, StatusDot, Td, Th, Unavailable } from '../ui.tsx';

/** The last two path segments — enough to tell `.worktrees/ceo-1-178…` from its siblings. */
export function worktreeLabel(absPath: string): string {
  const parts = absPath.split('/').filter(Boolean);
  return parts.slice(-2).join('/');
}

export interface ConflictTotals {
  /**
   * EVERY DISCOVERED PROJECT — swept and untrusted alike. This is the denominator on screen,
   * so it must count the fleet and not the part of it the allowlist let through; `reports.
   * length` alone would silently shrink "0 of 19" to "0 of 3" the moment somebody removed a
   * line from the trust file, and a denominator that moves when the answer does is exactly
   * how the Fleet headline shipped "2 of 11" for an answer of 4.
   */
  projects: number;
  /** Discovered projects the sweep was not allowed to run in. `projects - untrusted` were. */
  untrusted: number;
  /** Worktrees the sweep ATTEMPTED — readable and unreadable alike. */
  attempted: number;
  /** Of those, the ones git answered for. `attempted - read === unreadable`, always. */
  read: number;
  excluded: number;
  unreadable: number;
  conflicts: number;
  projectsWithConflicts: number;
  /**
   * Projects whose worktree LIST could not be read at all. Distinct from `unreadable`, which
   * counts worktrees the sweep knew about and could not stat — here the population itself is
   * unknown, so for that project neither `attempted` nor `excluded` means anything.
   */
  unenumerated: number;
}

/**
 * Every headline figure, summed in ONE pass over the SAME array the table renders.
 *
 * Exported and pure so a test can assert the header's numbers against the rows on screen.
 * The §0 corollary this exists to obey: a numerator and a denominator drawn from two
 * populations disagree eventually, and the Fleet headline shipped "2 of 11" for an answer of
 * 4 exactly that way.
 *
 * ONE WORD, ONE QUANTITY. "Swept" used to name two different numbers on one screen: the
 * header counted every attempted worktree, and each project line counted attempted-minus-
 * unreadable while using the same word — so adding up the project lines never reached the
 * header, and a reader had no way to see which meaning was in front of them. There is now no
 * field called `swept` at all: `attempted` is what the sweep tried, `read` is what git
 * answered for, and the invariant `attempted - read === unreadable` is pinned by a test.
 */
export function totalsFor(reports: ConflictReport[], untrusted: UntrustedProject[] = []): ConflictTotals {
  let attempted = 0;
  let excluded = 0;
  let unreadable = 0;
  let conflicts = 0;
  let projectsWithConflicts = 0;
  let unenumerated = 0;
  for (const r of reports) {
    attempted += r.worktrees.length;
    excluded += r.excluded.count;
    unreadable += r.worktrees.filter((w) => w.readable === false).length;
    conflicts += r.conflicts.length;
    if (r.conflicts.length > 0) projectsWithConflicts++;
    if (!r.enumerated.readable) unenumerated++;
  }
  return {
    projects: reports.length + untrusted.length,
    untrusted: untrusted.length,
    attempted,
    read: attempted - unreadable,
    excluded,
    unreadable,
    conflicts,
    projectsWithConflicts,
    unenumerated,
  };
}

/**
 * Projects the sweep was not allowed to run in. The server's own sentence is rendered, not a
 * second wording maintained here — it already names the file to edit and the command to run,
 * and two wordings of one rule disagree eventually.
 */
export function UntrustedList({ projects }: { projects: UntrustedProject[] }) {
  return (
    <ul className="space-y-1.5">
      {projects.map((p) => (
        <li key={p.project} className="border-l-2 border-l-warn pl-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <StatusDot tone="warn" title="No program was run for this project" />
            <span className="fig text-[12.5px] text-text" title={p.root}>
              {p.project}
            </span>
            <span className="fig text-[11.5px] text-warn">not swept — not a trusted project</span>
          </div>
          <p className="mt-1 max-w-[78ch] text-[12px] leading-relaxed text-muted">{p.reason}</p>
        </li>
      ))}
    </ul>
  );
}

/** Projects git refused to enumerate — the population is unknown, not empty. */
export function UnenumeratedList({ reports }: { reports: ConflictReport[] }) {
  return (
    <ul className="space-y-1.5">
      {reports.map((r) => (
        <li key={r.project} className="border-l-2 border-l-bad pl-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <StatusDot tone="warn" title="git could not list this project's worktrees" />
            <span className="fig text-[12.5px] text-text">{r.project}</span>
            <span className="fig text-[11.5px] text-bad">worktree list unreadable</span>
          </div>
          <p className="mt-1 max-w-[78ch] text-[12px] leading-relaxed text-muted">
            {r.enumerated.readable ? null : r.enumerated.reason}
          </p>
        </li>
      ))}
    </ul>
  );
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
          {/* Capped, like every other free-text column in this codebase. A repository path
              runs to any length, and uncapped it pushed the Branches column — the part that
              says WHO is about to collide — off the right edge of the screen. The full path
              stays in the title, and CSS truncation never removes text from the
              accessibility tree. */}
          <Th width="52ch">File</Th>
          <Th width="10ch" align="right" title="How many worktrees hold uncommitted edits to this path">
            Worktrees
          </Th>
          <Th>Branches</Th>
        </tr>
      </thead>
      <tbody>
        {report.conflicts.map((c, i) => (
          <tr key={c.file} className={`transition-colors hover:bg-raised ${i % 2 === 1 ? 'bg-row-alt' : ''}`}>
            <Td mono className="text-text" title={c.file}>
              <span className="block max-w-[52ch] truncate">{c.file}</span>
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
  const read = report.worktrees.length - unreadable.length;

  return (
    <section className="border-t border-line px-6 py-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="fig text-[13.5px] text-text">{report.project}</h2>
        {/* "read", not "swept". This line used to subtract the unreadable ones and still call
            the remainder "swept" while the header called the un-subtracted total the same
            thing, so the project lines never summed to the headline. */}
        <span className="text-[11.5px] text-dim">
          {formatCount(report.conflicts.length)} conflicting file{report.conflicts.length === 1 ? '' : 's'} ·{' '}
          {formatCount(read)} worktree{read === 1 ? '' : 's'} read
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
  untrusted = [],
  trustIssues = [],
  loading,
  error,
  onRefresh,
}: {
  reports: ConflictReport[] | null;
  /** Discovered projects the sweep was not allowed to run in — rendered, never dropped. */
  untrusted?: UntrustedProject[];
  /** Lines of the trusted-projects file the parser refused. A refused line trusts nothing. */
  trustIssues?: string[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const totals = useMemo(() => (reports ? totalsFor(reports, untrusted) : null), [reports, untrusted]);

  // The collector's own sentence, rendered rather than restated. Every report with a non-zero
  // exclusion carries the identical EXCLUDED_REASON constant (pinned in
  // test/collectors.test.ts), so taking the first one is taking the only one.
  const excludedReason = useMemo(
    () => (reports ?? []).find((r) => r.excluded.count > 0)?.excluded.reason ?? null,
    [reports]
  );

  const unenumeratedReports = useMemo(() => (reports ?? []).filter((r) => !r.enumerated.readable), [reports]);

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
      <HeadlineBar
        action={
          <RefreshButton
            onClick={onRefresh}
            busy={loading}
            idleLabel="Re-sweep"
            busyLabel="Sweeping…"
            title="Re-runs git status --porcelain in every swept worktree"
          />
        }
      >
        <Figure
          label="Files two worktrees are both editing"
          value={formatCount(totals.conflicts)}
          tone={totals.conflicts > 0 ? 'warn' : 'default'}
          sub={
            <>
              across {formatCount(totals.projectsWithConflicts)} of {formatCount(totals.projects)} projects ·{' '}
              {formatCount(totals.attempted)} agent worktree{totals.attempted === 1 ? '' : 's'} swept
              {totals.unreadable > 0 && <>, {formatCount(totals.read)} of them read</>}
            </>
          }
          title="Paths with uncommitted edits in more than one swept worktree at the same time, from `git status --porcelain` in each. This is a PREDICTION, not a git state — nothing has been merged and git reports no problem in either worktree yet. Only worktrees a project's .worktrees/.registry names are swept."
        />
      </HeadlineBar>

      {/* THE NARROWING, STATED UNDER THE HEADER. The sweep looks at 30 of 285 worktrees on
          this machine; a reader who does not know that would take "3 conflicts" as a
          statement about every worktree they have, which it is not. */}
      {/* THE NARROWING, STATED UNDER THE HEADER. The sweep looks at 30 of 285 worktrees on
          this machine; a reader who does not know that would take "3 conflicts" as a
          statement about every worktree they have, which it is not. The explanation is the
          collector's own string, rendered — not a second wording maintained here. */}
      {totals.excluded > 0 && (
        <p className="border-t border-line px-6 py-2 text-[12px] text-muted">
          <span className="fig text-warn">{formatCount(totals.excluded)}</span> worktrees not swept (not
          agent-started). <span className="text-dim">{excludedReason}</span>
        </p>
      )}

      {/* THE ALLOWLIST, STATED UNDER THE HEADER AND NEVER AS AN ABSENCE. These projects were
          discovered; the sweep simply may not run a program in them. Rendering them as missing
          would be indistinguishable from "you have no such project" — the reported-absence
          defect this codebase is named for, arriving as a security control. */}
      {totals.untrusted > 0 && (
        <div className="border-t border-warn/40 bg-warn/10 px-6 py-3">
          <p className="text-[12px] text-warn">
            {formatCount(totals.untrusted)} of {formatCount(totals.projects)} discovered project
            {totals.projects === 1 ? '' : 's'} {totals.untrusted === 1 ? 'was' : 'were'} not swept: Mission Control runs
            no program for a project that is not on the trusted list. The sweep runs{' '}
            <code>git status</code> inside each worktree, and git there honours that repository&rsquo;s own{' '}
            <code>.git/config</code> — which can name a program git executes. These projects are here, they are
            simply not measured.
          </p>
          <div className="mt-2">
            <UntrustedList projects={untrusted} />
          </div>
        </div>
      )}

      {/* A REFUSED LINE TRUSTS NOTHING, so it has to be visible: a typo in the trust file would
          otherwise present as a project silently staying excluded after somebody added it. */}
      {trustIssues.length > 0 && (
        <div className="border-t border-bad/40 bg-bad/10 px-6 py-3">
          <p className="text-[12px] text-bad">
            {formatCount(trustIssues.length)} line{trustIssues.length === 1 ? '' : 's'} in the trusted-projects file
            {trustIssues.length === 1 ? ' was' : ' were'} refused and {trustIssues.length === 1 ? 'trusts' : 'trust'}{' '}
            nothing:
          </p>
          <ul className="mt-1.5 space-y-1">
            {trustIssues.map((issue) => (
              <li key={issue} className="max-w-[78ch] border-l-2 border-l-bad pl-3 text-[12px] leading-relaxed text-muted">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {totals.unreadable > 0 && (
        <p className="border-t border-line px-6 py-2 text-[12px] text-warn">
          {formatCount(totals.unreadable)} of the {formatCount(totals.attempted)} swept worktree
          {totals.attempted === 1 ? '' : 's'} could not be read. Those are listed below with the reason — they are NOT
          counted as clean.
        </p>
      )}

      {/* THE POPULATION ITSELF IS UNKNOWN HERE, which is worse than an unreadable worktree
          and was rendering as better. `git worktree list` failing returned an empty list, so
          the project reported "0 of 0 not swept" and fed a measured all-clear — the narrowing
          mechanism reporting completeness over a set git had refused to enumerate. */}
      {totals.unenumerated > 0 && (
        <div className="border-t border-bad/40 bg-bad/10 px-6 py-3">
          <p className="text-[12px] text-bad">
            {formatCount(totals.unenumerated)} of {formatCount(totals.projects)} project
            {totals.projects === 1 ? '' : 's'} could not be enumerated at all — git would not list their worktrees, so
            for those projects this panel does not know how many worktrees exist, let alone whether they conflict.
            Nothing below speaks for them.
          </p>
          <div className="mt-2">
            <UnenumeratedList reports={unenumeratedReports} />
          </div>
        </div>
      )}

      {/* NOTHING CHECKED IS NOT AN ALL-CLEAR. With zero worktrees swept this rendered "0
          agent-started worktrees across 19 projects were swept and every one of them was
          readable, so this is a measured all-clear" — a positive finding about a population
          of nothing, in the largest type on the panel, and one missing .registry file away
          from being the normal state. Same defect FleetView's GenerationFigure documents and
          fixes for the drift headline: the all-clear exists in ONE branch, the one where a
          comparison happened. */}
      {totals.attempted === 0 ? (
        <EmptyState
          headline="Nothing was checked."
          body={
            <>
              {/* THE ALLOWLIST BRANCH COMES FIRST, because when every project is untrusted the
                  registry sentence below is FALSE — the sweep never got as far as looking for a
                  .registry file. Naming the wrong cause is how a reader goes and checks the
                  wrong thing, which is this panel's whole failure mode. */}
              {totals.untrusted === totals.projects && totals.projects > 0 ? (
                <>
                  None of the {formatCount(totals.projects)} discovered project
                  {totals.projects === 1 ? ' is' : 's are'} on the trusted list, so the sweep ran in none of them. It
                  did not look for worktrees and find none — it was not allowed to run <code>git status</code> anywhere.{' '}
                  <code>bun run trust seed</code> trusts what is discovered now; <code>bun run trust add &lt;path&gt;</code>{' '}
                  trusts one.
                </>
              ) : totals.unenumerated > 0 ? (
                <>
                  The sweep has no population to report on: git would not enumerate{' '}
                  {formatCount(totals.unenumerated)} of {formatCount(totals.projects)} projects, and no worktree it
                  could see is named by a <code>.worktrees/.registry</code>.
                </>
              ) : (
                <>
                  No worktree in the {formatCount(totals.projects - totals.untrusted)} trusted project
                  {totals.projects - totals.untrusted === 1 ? '' : 's'} is named by a{' '}
                  <code>.worktrees/.registry</code>, so the sweep had nothing in scope.
                </>
              )}{' '}
              This panel is not reporting that your worktrees are clean —{' '}
              {totals.excluded > 0 ? (
                <>
                  it is reporting that it looked at none of them. {formatCount(totals.excluded)} worktree
                  {totals.excluded === 1 ? '' : 's'} exist and were excluded.
                </>
              ) : (
                <>
                  it is reporting that it measured nothing.{' '}
                  {/* "N projects were scanned" is FALSE when they were not: an untrusted project
                      is discovered and then left alone, and claiming it was scanned is a
                      measurement asserted over work that never happened. */}
                  {formatCount(totals.projects - totals.untrusted)} of {formatCount(totals.projects)} discovered project
                  {totals.projects === 1 ? '' : 's'} {totals.projects - totals.untrusted === 1 ? 'was' : 'were'} eligible
                  to be swept.
                </>
              )}{' '}
              A registry file appears when a CEO launcher starts a session; until then a trusted project has no
              population for this view to speak for.
            </>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState
          // THE ALL-CLEAR EXISTS IN ONE BRANCH, and that branch requires every project to
          // have been enumerated AND to have been eligible. With `unenumerated > 0` the
          // sentence below would be counting the worktrees it happened to see while silently
          // omitting projects whose list git refused to produce — an all-clear whose
          // denominator is unknown. `untrusted > 0` is the same hole with a different cause:
          // "no two worktrees are editing the same file" over a fleet where sixteen projects
          // were never looked at is a claim about a population that was not measured, and this
          // is the largest type on the panel.
          headline={
            totals.unenumerated > 0 || totals.untrusted > 0
              ? 'No conflicts among the worktrees that could be checked.'
              : 'No two agent worktrees are editing the same file.'
          }
          body={
            <>
              {formatCount(totals.read)} agent-started worktree{totals.read === 1 ? '' : 's'} across{' '}
              {formatCount(totals.projects - totals.unenumerated - totals.untrusted)} of{' '}
              {formatCount(totals.projects)} projects were read successfully
              {totals.untrusted > 0 && (
                <>
                  , {formatCount(totals.untrusted)} {totals.untrusted === 1 ? 'was' : 'were'} not swept at all because{' '}
                  {totals.untrusted === 1 ? 'it is' : 'they are'} not on the trusted list
                </>
              )}
              {totals.unenumerated > 0 ? (
                <>
                  , and {formatCount(totals.unenumerated)} project{totals.unenumerated === 1 ? '' : 's'} could not be
                  enumerated at all — so this is NOT an all-clear for the fleet, only for the part of it that answered.
                </>
              ) : totals.untrusted > 0 ? (
                <> — so this is NOT an all-clear for the fleet, only for the part of it that was measured.</>
              ) : (
                <>, so this is a measured all-clear rather than an empty list.</>
              )}{' '}
              A conflict appears here when two worktrees hold uncommitted changes to the same path — before either one
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
