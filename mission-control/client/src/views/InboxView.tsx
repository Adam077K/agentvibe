// client/src/views/InboxView.tsx — pending approvals, escalations and binary pings.
//
// EVERY PROJECT IS EMPTY TODAY, and that is the honest state of the feature rather than a gap
// in this view: nothing in this repository has ever written into `~/.<project>/messages/`.
// So this view is mostly an empty state, and the whole question is whether it reads as
// "checked, nothing waiting" or as "nothing here" — which after PR4's zero-swept all-clear is
// a distinction with a scar. The rule applied throughout: a count of zero is only reported
// when the directories were actually looked at, and the probe that looked is printed.

import { useMemo } from 'react';
import type { InboxProject } from '../api.ts';
import { formatCount } from '../format.ts';
import { EmptyState, Figure, Footnote, HeadlineBar, RefreshButton, Td, Th } from '../ui.tsx';

export interface InboxTotals {
  projects: number;
  withMessages: number;
  unreadable: number;
}

/**
 * Summed in ONE pass over the SAME array the table renders — the §0 corollary this codebase
 * keeps paying for. `unreadable` is separate from `withMessages` because a directory the
 * probe could not read is not a project with no messages.
 */
export function inboxTotals(projects: InboxProject[]): InboxTotals {
  let withMessages = 0;
  let unreadable = 0;
  for (const p of projects) {
    if (p.found) withMessages++;
    if (p.readable === false) unreadable++;
  }
  return { projects: projects.length, withMessages, unreadable };
}

export function InboxTable({ projects }: { projects: InboxProject[] }) {
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr>
          <Th width="20ch">Project</Th>
          <Th width="14ch">Messages</Th>
          <Th title="The literal glob this row's answer came from — run it yourself and you get the same answer">
            Probe
          </Th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p, i) => (
          <tr key={p.project} className={`transition-colors hover:bg-raised ${i % 2 === 1 ? 'bg-row-alt' : ''}`}>
            <Td className="fig text-text">{p.project}</Td>
            <Td>
              {p.readable === false ? (
                <span className="fig text-warn" title={p.reason}>
                  could not look
                </span>
              ) : p.found ? (
                <span className="fig text-live">waiting</span>
              ) : (
                <span className="fig text-dim">none</span>
              )}
            </Td>
            <Td mono className="text-dim" title={p.probe}>
              <span className="block max-w-[60ch] truncate">{p.probe}</span>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The one headline figure, extracted for the same reason FleetHeadline and ProjectHeadline
 * are: a test reading it positionally out of the whole view would be reading a number the
 * prose below happened to contain.
 */
export function InboxHeadline({
  totals,
  loading,
  onRefresh,
}: {
  totals: InboxTotals;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <HeadlineBar
      action={
        <RefreshButton
          onClick={onRefresh}
          busy={loading}
          idleLabel="Re-check"
          busyLabel="Checking…"
          title="Re-reads every project's messages directory"
        />
      }
    >
      <Figure
        label="Projects with messages waiting"
        value={formatCount(totals.withMessages)}
        tone={totals.withMessages > 0 ? 'warn' : 'default'}
        sub={
          totals.unreadable > 0 ? (
            <>
              of {formatCount(totals.projects)} checked ·{' '}
              <span className="text-warn">{formatCount(totals.unreadable)} could not be read</span>
            </>
          ) : (
            <>of {formatCount(totals.projects)} checked</>
          )
        }
        title="Discovered projects whose ~/.<project>/messages/ directory holds at least one entry, counted by reading each directory at request time. A project whose directory does not exist counts as none — the feature that would write it has never run."
      />
    </HeadlineBar>
  );
}

export function InboxView({
  projects,
  loading,
  error,
  onRefresh,
}: {
  projects: InboxProject[] | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const totals = useMemo(() => (projects ? inboxTotals(projects) : null), [projects]);

  if (error !== null) {
    return (
      <EmptyState
        headline="The inbox could not be read."
        body={
          <>
            <span className="fig">{error}</span>. This view lists one directory per discovered project; if the server
            is up and this persists, the failure is in discovery rather than in any one project.
          </>
        }
      />
    );
  }

  if (totals === null || projects === null) {
    return (
      <div className="border-t border-line px-6 py-14">
        <div className="max-w-[62ch]">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-live breathe" />
            <span className="text-[15px] font-medium text-text">Checking every project&rsquo;s message directory.</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            One directory read per discovered project — a few milliseconds in total.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section>
      <InboxHeadline totals={totals} loading={loading} onRefresh={onRefresh} />

      {/* ZERO IS ONLY AN ALL-CLEAR IF SOMETHING WAS CHECKED. Same shape as the Conflicts
          zero-swept branch: with no projects discovered there is no population, and saying
          "no messages waiting" would be a statement about nothing. */}
      {totals.projects === 0 ? (
        <EmptyState
          headline="Nothing was checked."
          body={
            <>
              No projects were discovered, so no message directory was read and this panel is not reporting that your
              inbox is clear. Mission Control walks every git repository under the configured roots; if that list is
              empty, <code>MC_PROJECT_ROOTS</code> is pointing somewhere without one.
            </>
          }
        />
      ) : totals.withMessages === 0 && totals.unreadable === 0 ? (
        <EmptyState
          headline="No project has a message waiting."
          body={
            <>
              All {formatCount(totals.projects)} discovered projects were checked and every one of their{' '}
              <code>~/.&lt;project&gt;/messages/</code> directories is absent or empty, so this is a measured
              all-clear rather than an empty list. Nothing in this repository writes into those directories yet —{' '}
              <span className="text-muted">
                the mechanism that would fill this view is an agent handing a decision back to the Founder: a pending
                outbound approval, an escalation, or a binary ping
              </span>
              . The per-project probes are listed below so the answer can be checked without trusting this sentence.
            </>
          }
        />
      ) : null}

      <div className="border-t border-line">
        <InboxTable projects={projects} />
      </div>

      <Footnote>
        Each row is one directory read at request time, and the <span className="text-muted">Probe</span> column is
        the literal glob that produced its answer. A directory that does not exist and one that exists empty both read
        as <span className="text-dim">none</span> — they are the same fact for a reader waiting on a message, and
        neither is inferred: both were looked at. A row reading{' '}
        <span className="text-warn">could not look</span> is neither, and hovering it gives the reason.
      </Footnote>
    </section>
  );
}
