// client/src/views/BeliefView.tsx — what this machine believes, banded by the scope the
// belief reaches: one repository, or every project on the machine.
//
// TWO BANDS BECAUSE THERE ARE TWO LEDGERS, and conflating them hides the more dangerous one.
// `.claude/ledger/index.json` is committed, in CI, and reviewed. `~/.warroom/ledger/
// global.yml` is in no git repository at all — no push backs it up, no workflow reads it —
// and it holds the claims that reach every project here. A single merged list would let a
// global claim's expiry read like a repository detail.
//
// BeliefBands is pure and stateless so test/views.test.tsx can render it against a real
// /api/belief payload and reverse every displayed figure back to what the collector returned.

import type { BeliefSummary, ClaimsSummary, LedgerClaim, ScopeBand, VerdictCounts, Waiver } from '../api.ts';
import { formatCount } from '../format.ts';
import { EmptyState, Figure, Footnote, HeadlineBar, RefreshButton, Td, Th, Unavailable } from '../ui.tsx';

const SCOPE_COPY: Record<ScopeBand['scope'], { title: string; blurb: string }> = {
  project: {
    title: 'Project scope',
    blurb:
      'Claims that reach this repository. Compiled into .claude/ledger/index.json by scripts/ledger.mjs — generated, never hand-edited — and checked by CI on every push.',
  },
  global: {
    title: 'Global scope',
    blurb:
      'Claims that reach every project on this machine: runtime capabilities, model facts, shell mechanics. This file is in no git repository, so nothing in CI sees it and no push backs it up.',
  },
};

/**
 * Whole days remaining on a date-only claim deadline, counting the deadline day itself as
 * live — the same rule scripts/lib/resolvers.js applies: `deadline = valid_until + 1 day`.
 *
 * FLOOR, NOT CEIL, and the difference is not cosmetic. The first version here used ceil,
 * which is what `ledger sweep` uses for its own "expiring soon" list — and the result was
 * that one date rendered TWO different numbers in this single view: c-rolling-five-hour-
 * window, which carries both `valid_until: 2026-09-08` and a waiver `until: 2026-09-08`,
 * showed "27" in the expiry table and "26d left" in the waiver list directly beneath it,
 * because the waiver figure comes from resolvers.js's waiverState (floor) and this one did
 * not. Two implementations of one date rule, disagreeing on screen, in the view whose whole
 * subject is expiry. Floor also happens to be the honest reading: at noon on 2026-08-13
 * there are 26 whole days left until the 2026-09-09 deadline, not 27.
 */
export function daysUntil(dateStr: string, now: number): number | null {
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return null;
  return Math.floor((t + 86_400_000 - now) / 86_400_000);
}

function VerdictFigures({ verdicts }: { verdicts: VerdictCounts | { present: false; reason: string } }) {
  if ('present' in verdicts) {
    return (
      <div className="fig text-[12.5px]">
        <Unavailable short="verdicts not attributed" why={verdicts.reason} />
      </div>
    );
  }
  const { pass, wouldBlock, block } = verdicts;
  return (
    <div className="fig flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12.5px]">
      <span title="Resolver runs that checked the claim and found it holds">
        <span className="text-live">{formatCount(pass)}</span> <span className="text-dim">pass</span>
      </span>
      {/* would_block is amber even at zero — it is the shadow-mode count, and the number
          that tells you how much the ledger WOULD be failing if enforcement were on. */}
      <span title="Resolver runs that failed or could not resolve, on a path the tier map runs in shadow — logged as claim.would_block, not failing the build">
        <span className={wouldBlock > 0 ? 'text-warn' : 'text-dim'}>{formatCount(wouldBlock)}</span>{' '}
        <span className="text-dim">would_block</span>
      </span>
      <span title="Resolver runs that failed on a path marked enforcement:block — migration, deploy, harness self-edit. These fail the build.">
        <span className={block > 0 ? 'text-bad' : 'text-dim'}>{formatCount(block)}</span>{' '}
        <span className="text-dim">block</span>
      </span>
    </div>
  );
}

export function ExpiringTable({ claims, now }: { claims: LedgerClaim[]; now: number }) {
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr>
          <Th>Claim</Th>
          <Th width="12ch">Kind</Th>
          <Th width="14ch" align="right" title="valid_until — the claim is live through the end of this day">
            Expires
          </Th>
          <Th width="12ch" align="right">
            Days left
          </Th>
        </tr>
      </thead>
      <tbody>
        {claims.map((c, i) => {
          const left = c.valid_until ? daysUntil(c.valid_until, now) : null;
          const overdue = left !== null && left <= 0;
          return (
            <tr key={c.id} className={`transition-colors hover:bg-raised ${i % 2 === 1 ? 'bg-row-alt' : ''}`}>
              {/* The file, and no line. The ledger index stopped recording `source_line`
                  because a committed position is stale the moment anything above it moves;
                  positions are resolved on demand by `node scripts/ledger.mjs locate <id>`.
                  There is no number to print here that would be a measurement, and a
                  plausible-looking `:0` or `:?` in a tooltip is the same defect the drop
                  was made to remove — so this names the artifact and stops. */}
              <Td mono title={`${c.assert}\n\n${c.source_file}`}>
                <span className={overdue ? 'text-bad' : 'text-text'}>{c.id}</span>
              </Td>
              <Td className="text-muted">{c.kind}</Td>
              <Td align="right" mono className="text-muted">
                {c.valid_until}
              </Td>
              {/* Overdue is stated in words as well as colour — "expired" versus a number —
                  because a negative figure in a red cell is one encoding, not two. */}
              <Td align="right" mono className={overdue ? 'text-bad' : left !== null && left <= 14 ? 'text-warn' : 'text-muted'}>
                {left === null ? '—' : overdue ? `expired ${formatCount(Math.abs(left))}d ago` : formatCount(left)}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function WaiverList({ waivers }: { waivers: Waiver[] }) {
  if (waivers.length === 0) {
    return (
      <p className="text-[12.5px] text-muted">
        No claim in this scope carries a waiver. Every expiry here is either still in the future or has been
        dispositioned another way — Refreshed or Deprecated.
      </p>
    );
  }
  return (
    <ul className="space-y-2.5">
      {waivers.map((w) => (
        <li
          key={w.claimId}
          // LAPSED IS A DIFFERENT THING, NOT A REDDER VERSION OF THE SAME THING. Rule 9:
          // a lapsed waiver fails HARDER than no disposition at all, because somebody
          // promised to come back to this and did not. It is distinguished three ways —
          // the left rule, the colour, and the word LAPSED in the status — so it survives
          // low contrast, colour blindness, and a greyscale screenshot in a review.
          className={`border-l-2 pl-3 ${w.lapsed ? 'border-l-bad' : 'border-l-line-strong'}`}
        >
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="fig text-[12.5px] text-text">{w.claimId}</span>
            {w.lapsed ? (
              <span className="fig text-[11.5px] font-medium text-bad">
                WAIVER LAPSED
                {w.days === null ? ' — until is not a date' : ` ${formatCount(w.days)}d ago`}
                {w.until === null ? '' : ` (until ${w.until})`}
              </span>
            ) : (
              <span className="fig text-[11.5px] text-muted">
                waived{w.until === null ? '' : ` until ${w.until}`}
                {w.days === null ? '' : ` · ${formatCount(w.days)}d left`}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-[78ch] text-[12px] leading-relaxed text-muted">
            {w.reason || <span className="text-dim">no reason recorded</span>}
          </p>
          {w.lapsed && (
            <p className="mt-1 max-w-[78ch] text-[12px] leading-relaxed text-bad/90">
              A lapsed waiver is worse than no disposition. Refresh it, deprecate it, or waive it again with a new
              date and a reason that has changed.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * A whole absent section, with its reason ON SCREEN rather than in a title attribute.
 *
 * `Unavailable` is the right primitive for an absent CELL — a short marker whose reason is
 * one hover (and one screen-reader announcement) away, used because 900 visible reasons in a
 * table would be unreadable. A missing BAND is the opposite case: there is nothing else in
 * that space, the reason is the only content there is, and putting it behind a hover would
 * make the single most important sentence on the panel — "this machine has no global ledger,
 * and here is what would create one" — reachable only by pointer.
 */
function AbsentSection({ short, reason }: { short: string; reason: string }) {
  return (
    <div className="border-l-2 border-l-line-strong pl-3">
      <div className="fig text-[12px] text-dim">{short}</div>
      <p className="mt-1 max-w-[78ch] text-[12.5px] leading-relaxed text-muted">{reason}</p>
    </div>
  );
}

function ClaimsBlock({ claims, now }: { claims: ClaimsSummary | { present: false; reason: string }; now: number }) {
  if ('present' in claims) {
    return <AbsentSection short="no claim catalog" reason={claims.reason} />;
  }
  // A BAND WITH NO CLAIMS IS NOT A BAND WITH NOTHING DUE. Same defect as the Conflicts
  // zero-swept all-clear: at `total: 0` this rendered "0 claims ·" — a dangling separator
  // with nothing after it — above "0 claims were checked, so this is a measured all-clear",
  // which is a positive finding about a population of nothing.
  if (claims.total === 0) {
    return (
      <AbsentSection
        short="no claims in this scope"
        reason="This ledger was read successfully and holds no claims at all, so nothing here is expiring — and that is not an all-clear, because there is nothing to be clear about. A row appears once a claim is written into an artifact this scope covers."
      />
    );
  }

  const kinds = Object.entries(claims.byKind).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return (
    <div className="space-y-4">
      <div className="fig text-[12.5px] text-muted">
        <span className="text-text">{formatCount(claims.total)}</span> claims
        {kinds.map(([kind, n]) => (
          <span key={kind}>
            {' · '}
            {formatCount(n)} {kind}
          </span>
        ))}
      </div>
      <div>
        {/* THE LABEL NAMES WHAT THE LIST ACTUALLY HOLDS. summarizeClaims filters on
            `t - now < THIRTY_DAYS`, which has no lower bound, so an ALREADY-EXPIRED claim
            satisfies it — the canary (valid_until 2026-01-02, deliberately in the past) sat
            under a heading promising the next 30 days beside a cell reading "expired 224d
            ago". The filter is right and stays: an overdue claim is precisely what a reader
            of this panel needs to see. It was the heading that was lying. */}
        <div className="label mb-1.5">Expired, or expiring within 30 days</div>
        {claims.expiringWithin30Days.length === 0 ? (
          <p className="text-[12.5px] text-muted">
            Nothing in this scope is overdue or comes due in the next 30 days. {formatCount(claims.total)} claims were
            checked, so this is a measured all-clear rather than an empty list.
          </p>
        ) : (
          <ExpiringTable claims={claims.expiringWithin30Days} now={now} />
        )}
      </div>
    </div>
  );
}

export function BeliefBands({ belief, now }: { belief: BeliefSummary; now: number }) {
  return (
    <>
      {belief.bands.map((band) => (
        <section key={band.scope} className="border-t border-line px-6 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[14px] font-medium text-text">{SCOPE_COPY[band.scope].title}</h2>
            <VerdictFigures verdicts={band.verdicts} />
          </div>
          <p className="mt-1 max-w-[78ch] text-[12px] leading-relaxed text-dim">
            {SCOPE_COPY[band.scope].blurb} <span className="fig">{band.source}</span>
          </p>

          <div className="mt-4 space-y-5">
            <ClaimsBlock claims={band.claims} now={now} />
            <div>
              <div className="label mb-1.5">Waivers</div>
              {Array.isArray(band.waivers) ? (
                <WaiverList waivers={band.waivers} />
              ) : (
                <AbsentSection short="waivers not recorded here" reason={band.waivers.reason} />
              )}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

/**
 * The pending state. NOT a bare spinner: this route measured 18,781 ms warm on the real
 * ledger (10.4 s of it is `ledger.mjs verify` re-running every resolver, several of which
 * shell out to real test suites). Eighteen silent seconds is indistinguishable from a hung
 * page, and the no-placeholder rule applies to waiting as much as to absence — say what is
 * running and why it costs what it costs.
 */
function BeliefPending() {
  return (
    <div className="border-t border-line px-6 py-14">
      <div className="max-w-[62ch]">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-live breathe" />
          <span className="text-[15px] font-medium text-text">Running the claim ledger.</span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          <code className="fig">node scripts/ledger.mjs verify --offline</code> is resolving every claim in both
          scopes. Several resolvers shell out to real test suites, so this takes about ten seconds and the whole
          request about twenty — it is re-running the checks, not reading a cached verdict. Nothing is written by this
          view; the figures appear when the run finishes.
        </p>
      </div>
    </div>
  );
}

export function BeliefView({
  belief,
  loading,
  error,
  now,
  onRefresh,
}: {
  belief: BeliefSummary | null;
  loading: boolean;
  error: string | null;
  now: number;
  onRefresh: () => void;
}) {
  if (error !== null) {
    return (
      <EmptyState
        headline="The claim ledger could not be read."
        body={
          <>
            <span className="fig">{error}</span>. The server is what runs{' '}
            <code>scripts/ledger.mjs</code>; if it is up and this persists, run that command by hand in the repository
            root to see the failure directly.
          </>
        }
      />
    );
  }

  if (belief === null) return <BeliefPending />;

  const { projectsDiscovered, projectsWithLedgerIndex } = belief.fleet;

  return (
    <section>
      <HeadlineBar
        action={
          <RefreshButton
            onClick={onRefresh}
            busy={loading}
            idleLabel="Re-verify"
            busyLabel="Verifying…"
            title="Re-runs scripts/ledger.mjs verify against both scopes — about twenty seconds"
          />
        }
      >
        {/* THE FIGURE IS COMPUTED, and both halves come from one array in one pass on the
            server (see collectBelief) — never a numerator counted over one population and a
            denominator over another, which is what put "2 of 11" on the Fleet headline when
            the answer was 4.
            AND IT IS NOW WORDED AS WHAT IT COUNTS. "projects carry a claim ledger" is looser
            than the predicate behind it: `ledgerIndex.present` is true only when
            .claude/ledger/index.json has been BUILT. A project can hold claims in its
            artifacts and be counted here as not carrying one. */}
        <Figure
          label="Ledger coverage"
          value={`${formatCount(projectsWithLedgerIndex)} of ${formatCount(projectsDiscovered)}`}
          sub={
            <>
              projects have a built ledger index · showing <span className="fig">{belief.project}</span>
            </>
          }
          title="Discovered projects whose .claude/ledger/index.json exists and parsed, counted from the same array this request discovered. A project holding claims in its artifacts but with no built index is NOT counted — `node scripts/ledger.mjs build` in that project is what changes it."
        />
      </HeadlineBar>

      {/* NOT A TOOLTIP. Both verdict bands below already render `Unavailable` carrying this
          same reason, but that reason lives in a title attribute — a reader has to hover the
          right two words to learn that the ledger was never run. "No verdicts were produced"
          and "no verdicts were PERMITTED" are different facts, and only one of them is about
          this project's claims, so the second is stated in the panel, in text. */}
      {!belief.trust.trusted && (
        <div className="border-t border-warn/40 bg-warn/10 px-6 py-3">
          <p className="fig text-[12px] text-warn">
            no verify was run — <span className="text-text">{belief.project}</span> is not a trusted project
          </p>
          <p className="mt-1 max-w-[78ch] text-[12.5px] leading-relaxed text-muted">{belief.trust.reason}</p>
          <p className="mt-2 max-w-[78ch] text-[12px] leading-relaxed text-dim">
            The claim catalogs below are still real — they are read from{' '}
            <code className="fig">.claude/ledger/index.json</code> and{' '}
            <code className="fig">~/.warroom/ledger/global.yml</code>, both files. What is missing is every VERDICT,
            because producing one means running this project&rsquo;s own{' '}
            <code className="fig">scripts/ledger.mjs</code> as you.
          </p>
        </div>
      )}

      <BeliefBands belief={belief} now={now} />

      <Footnote>
        A claim expires or it is not a claim (rule 9), and on expiry exactly one disposition is recorded — Refresh,
        Deprecate, or Waive with a new deadline. A <span className="text-bad">lapsed waiver</span> fails harder than
        no disposition at all: somebody promised to come back to this and did not. Verdict counts are resolver RUNS,
        not claims — a claim with two resolvers contributes two — and they are attributed to a scope from the
        per-claim lines of the same verify run that produced the totals, which is why a disagreement between the two
        readings shows as <span className="text-muted">not attributed</span> rather than as a smaller number.
      </Footnote>
    </section>
  );
}
