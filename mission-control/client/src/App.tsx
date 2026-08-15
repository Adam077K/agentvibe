// client/src/App.tsx — the shell: one subscription, one nav, ONE VIEW REGISTRY.
//
// PR3 hardcoded the view list in three places — a `type Tab` union, a `TABS` array, and a
// two-branch ternary in <main>. Two views made that survivable; four does not, and the shape
// of the bug it produces is a tab that renders the wrong panel because one of the three lists
// was updated and another was not. THE REGISTRY IS THE ONLY LIST. `Tab` is derived from it,
// the nav maps it, and <main> looks up the active entry — so adding a view is adding one
// entry, and forgetting a place is a compile error rather than a blank screen.
//
// EACH VIEW OWNS ITS OWN DATA, and they do not all get it the same way. Fleet and Sessions
// read the SSE stream (see api.ts for the measured reason belief and conflicts do not).
// Belief and Conflicts fetch when their tab is opened. A view is MOUNTED only while it is
// active, so opening a tab is what triggers its fetch — and switching away and back refetches
// rather than showing a cached figure from ten minutes ago. On a control plane, a stale
// number that looks live is the more expensive of the two failures.

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  useEndpoint,
  useMissionControlStream,
  useNow,
  type BeliefSummary,
  type ConflictsPayload,
  type ConnectionState,
  type InboxPayload,
  type ProjectDetail,
  type StreamState,
} from './api.ts';
import { formatRelative } from './format.ts';
import { FleetView } from './views/FleetView.tsx';
import { SessionsView } from './views/SessionsView.tsx';
import { BeliefView } from './views/BeliefView.tsx';
import { ConflictsView } from './views/ConflictsView.tsx';
import { InboxView } from './views/InboxView.tsx';
import { ProjectView } from './views/ProjectView.tsx';

/**
 * What a fetched (non-stream) view knows about its own data's age.
 *
 * `failedAt` is here and separate from `loadedAt` because the badge has to distinguish "this
 * is when your data arrived" from "this is when the attempt gave up". Without it the bar read
 * the resting word "fetched" with no timestamp above a panel reporting an error (#39).
 */
export interface Freshness {
  loadedAt: number | null;
  failedAt: number | null;
  loading: boolean;
}

export interface ViewContext {
  stream: StreamState;
  now: number;
  /** A fetched view reports its own freshness here; stream views never call it. */
  onFreshness: (f: Freshness) => void;
  /** Drill-down: Fleet calls this with a project id to open the Project view on it. */
  openProject: (id: string) => void;
  /** The project the Project view is showing, set by the drill-down above. */
  projectId: string | null;
  /** Back out of a drill-down to the list that led here. */
  openTab: (id: Tab) => void;
}

export interface ViewDef {
  id: string;
  label: string;
  /**
   * True when this view's data arrives on the SSE tick. It decides WHICH badge the app bar
   * shows, and it exists because the badge was previously unconditional: ConnectionBadge
   * tracks the stream, so sitting on Belief for ten minutes displayed "updated 6s ago" above
   * figures fetched once at mount. The badge was telling the truth about a subscription that
   * had nothing to do with what was on screen — freshness asserted for the wrong population.
   */
  stream: boolean;
  /**
   * False for a view that is reachable but not a tab. Project is the only one: it is opened
   * by clicking a Fleet row, so a nav entry for it would either be dead until something was
   * selected or would need a second project picker — and the Fleet table already IS the
   * picker, with the figures that tell you which project you want.
   */
  nav: boolean;
  render: (ctx: ViewContext) => ReactNode;
}

/**
 * Belief and Conflicts are wrapped in components rather than called inline because they own
 * hooks. A hook cannot live in a `render` arm that only runs for the active tab — but it can
 * live inside a component that is only mounted for the active tab, which is the same thing
 * expressed where React can see it.
 */
function BeliefPanel({ now, onFreshness }: { now: number; onFreshness: (f: Freshness) => void }) {
  const { data, loading, error, loadedAt, failedAt, refetch } = useEndpoint<BeliefSummary>('/api/belief');
  useEffect(() => onFreshness({ loadedAt, failedAt, loading }), [loadedAt, failedAt, loading, onFreshness]);
  return <BeliefView belief={data} loading={loading} error={error} now={now} onRefresh={refetch} />;
}

function ConflictsPanel({ onFreshness }: { onFreshness: (f: Freshness) => void }) {
  const { data, loading, error, loadedAt, failedAt, refetch } = useEndpoint<ConflictsPayload>('/api/conflicts');
  useEffect(() => onFreshness({ loadedAt, failedAt, loading }), [loadedAt, failedAt, loading, onFreshness]);
  // `untrusted` and `trust.issues` are FORWARDED, not defaulted away. A payload carrying
  // sixteen excluded projects, rendered as none, is the silent narrowing the allowlist exists
  // to avoid — arriving one level above the server that got it right.
  return (
    <ConflictsView
      reports={data?.reports ?? null}
      untrusted={data?.untrusted ?? []}
      trustIssues={data?.trust.issues ?? []}
      loading={loading}
      error={error}
      onRefresh={refetch}
    />
  );
}

function InboxPanel({ onFreshness }: { onFreshness: (f: Freshness) => void }) {
  const { data, loading, error, loadedAt, failedAt, refetch } = useEndpoint<InboxPayload>('/api/inbox');
  useEffect(() => onFreshness({ loadedAt, failedAt, loading }), [loadedAt, failedAt, loading, onFreshness]);
  return <InboxView projects={data?.projects ?? null} loading={loading} error={error} onRefresh={refetch} />;
}

/**
 * The URL is built from an id that came off disk, so it is encoded — a project directory may
 * legitimately contain a space, a `#`, or the shell metacharacters the injection tests use.
 */
function ProjectPanel({
  projectId,
  now,
  onFreshness,
  onBack,
}: {
  projectId: string;
  now: number;
  onFreshness: (f: Freshness) => void;
  onBack: () => void;
}) {
  const { data, loading, error, loadedAt, failedAt, refetch } = useEndpoint<ProjectDetail>(
    `/api/project/${encodeURIComponent(projectId)}`
  );
  useEffect(() => onFreshness({ loadedAt, failedAt, loading }), [loadedAt, failedAt, loading, onFreshness]);
  return (
    <ProjectView
      detail={data}
      loading={loading}
      error={error}
      now={now}
      onRefresh={refetch}
      onBack={onBack}
    />
  );
}

// THE ONE LIST. Order here is the order in the nav.
//
// All four routes now have a view, so the note that used to sit here — "Project and Inbox are
// PR5 and are deliberately absent rather than stubbed" — no longer describes anything. What
// replaces it is the rule that outlived it: a view enters this array when it has real data to
// show, and `nav: false` is how a view that is reachable without being a tab says so.
//
// EXPORTED so views.test.tsx can render each entry against two different stream slices and
// check that `stream:` agrees with whether the entry's output actually moved. The field was
// declared here and read nowhere a test could see it, so flipping any one of them to `true`
// restored #39's original defect with the whole suite green.
export const VIEWS = [
  { id: 'fleet', label: 'Fleet', stream: true, nav: true, render: ({ stream, now, openProject }) => <FleetView fleet={stream.fleet} now={now} onOpenProject={openProject} /> },
  { id: 'sessions', label: 'Sessions', stream: true, nav: true, render: ({ stream, now }) => <SessionsView slice={stream.sessions} now={now} /> },
  { id: 'belief', label: 'Belief', stream: false, nav: true, render: ({ now, onFreshness }) => <BeliefPanel now={now} onFreshness={onFreshness} /> },
  { id: 'conflicts', label: 'Conflicts', stream: false, nav: true, render: ({ onFreshness }) => <ConflictsPanel onFreshness={onFreshness} /> },
  { id: 'inbox', label: 'Inbox', stream: false, nav: true, render: ({ onFreshness }) => <InboxPanel onFreshness={onFreshness} /> },
  {
    id: 'project',
    label: 'Project',
    stream: false,
    nav: false,
    render: ({ projectId, now, onFreshness, openTab }) =>
      projectId === null ? null : (
        <ProjectPanel projectId={projectId} now={now} onFreshness={onFreshness} onBack={() => openTab('fleet')} />
      ),
  },
] as const satisfies readonly ViewDef[];

/** Derived from the registry — there is no second list of view ids to keep in step. */
export type Tab = (typeof VIEWS)[number]['id'];

const CONNECTION_COPY: Record<ConnectionState, { text: string; tone: string; title: string }> = {
  connecting: {
    text: 'connecting',
    tone: 'text-muted',
    title: 'The stream is open but no slice has arrived yet. The first one waits on a cold index build — a few seconds across a large transcript corpus.',
  },
  live: {
    text: 'live',
    tone: 'text-live',
    title: 'Subscribed to /events. The server pushes a slice only when its contents change, so a quiet wire means a quiet fleet, not a stalled feed.',
  },
  retrying: {
    text: 'reconnecting',
    tone: 'text-warn',
    title: 'The stream dropped. EventSource is backing off and will reconnect on its own; the figures below are the last ones received.',
  },
  failed: {
    text: 'disconnected',
    tone: 'text-bad',
    title: 'EventSource gave up. Check that the server is running (bun run server, port 4300) and reload this page.',
  },
};

function ConnectionBadge({ state, lastEventAt, now }: { state: ConnectionState; lastEventAt: number | null; now: number }) {
  const copy = CONNECTION_COPY[state];
  return (
    <div className="flex items-center gap-2 text-[11.5px]" title={copy.title}>
      <span
        className={`inline-block h-[7px] w-[7px] rounded-full ${
          state === 'live' ? 'bg-live breathe' : state === 'failed' ? 'bg-bad' : state === 'retrying' ? 'bg-warn' : 'bg-line-strong'
        }`}
      />
      <span className={copy.tone}>{copy.text}</span>
      {lastEventAt !== null && <span className="fig text-dim">· updated {formatRelative(lastEventAt, now)}</span>}
    </div>
  );
}

/**
 * The freshness badge for a view that FETCHED its data rather than subscribing. Says when the
 * bytes on screen arrived, which for these tabs is a different question from whether the SSE
 * socket is healthy — and it is the question a reader of Belief or Conflicts is actually
 * asking, because nothing refreshes those figures until they ask for it.
 */
export function FetchedBadge({ freshness, now }: { freshness: Freshness | null; now: number }) {
  if (freshness === null || (freshness.loading && freshness.loadedAt === null)) {
    return (
      <div className="flex items-center gap-2 text-[11.5px]" title="This view fetches once when its tab is opened. The first response has not arrived yet.">
        <span className="inline-block h-[7px] w-[7px] rounded-full bg-live breathe" />
        <span className="text-muted">loading</span>
      </div>
    );
  }
  // A FAILED ATTEMPT IS NOT A FETCH. The badge said "fetched" with no timestamp whenever a
  // request errored — `loadedAt` stayed null while `loading` went false — so the app bar
  // asserted success directly above a panel explaining the failure (#39). The two states are
  // now distinct in word, colour and shape, and the failure carries the time it gave up.
  const failedWithNoData = freshness.loadedAt === null && freshness.failedAt !== null && !freshness.loading;
  if (failedWithNoData) {
    return (
      <div
        className="flex items-center gap-2 text-[11.5px]"
        title="The last request for this view failed, and no earlier response is being shown. The panel below carries the reason."
      >
        <span className="inline-block h-[7px] w-[7px] rounded-full bg-bad" />
        <span className="text-bad">fetch failed</span>
        <span className="fig text-dim">· {formatRelative(freshness.failedAt, now)}</span>
      </div>
    );
  }

  // Data on screen AND a later failure: the figures are real but older than they look, and
  // the refresh that would have updated them did not land.
  const staleAfterFailure =
    freshness.loadedAt !== null && freshness.failedAt !== null && freshness.failedAt > freshness.loadedAt;

  return (
    <div
      className="flex items-center gap-2 text-[11.5px]"
      title={
        staleAfterFailure
          ? 'These figures arrived earlier and are still on screen; the most recent refresh failed, so they are older than a successful fetch would have made them. The panel below carries the reason.'
          : 'This view is not on the live stream — it fetched once when you opened the tab, for the measured reason recorded in client/src/api.ts. Nothing refreshes it until you press the refresh button in the panel, so this is the age of what you are reading.'
      }
    >
      <span
        className={`inline-block h-[7px] w-[7px] rounded-full ${
          freshness.loading ? 'bg-live breathe' : staleAfterFailure ? 'bg-warn' : 'border border-muted bg-transparent'
        }`}
      />
      <span className={staleAfterFailure ? 'text-warn' : 'text-muted'}>
        {freshness.loading ? 'refreshing' : staleAfterFailure ? 'stale · refresh failed' : 'fetched'}
      </span>
      {freshness.loadedAt !== null && (
        <span className="fig text-dim">· {formatRelative(freshness.loadedAt, now)}</span>
      )}
    </div>
  );
}

/**
 * WHICH badge the app bar shows for the active view — the one place that decision is made.
 *
 * It was an inline ternary in the header's JSX, which is unreachable from a test without a
 * DOM: rendering <App/> statically only ever exercises the default tab. Lifted out, it is a
 * pure function of the registry entry, so the test can ask it the same question the header
 * asks, for every view, and catch a flipped `stream:` or a flipped ternary (#39).
 */
export function badgeFor(
  view: Pick<ViewDef, 'stream'>,
  ctx: { stream: StreamState; freshness: Freshness | null; now: number }
): ReactNode {
  return view.stream ? (
    <ConnectionBadge state={ctx.stream.connection} lastEventAt={ctx.stream.lastEventAt} now={ctx.now} />
  ) : (
    <FetchedBadge freshness={ctx.freshness} now={ctx.now} />
  );
}

/**
 * The app bar: the nav, the breadcrumb for a non-nav view, and the badge.
 *
 * A COMPONENT, not JSX inside `App()`, because inside `App()` none of it is reachable without
 * a DOM — reaching the breadcrumb means switching tabs, and switching tabs means a click. As
 * a pure function of `active`, every state it has can be rendered directly. The honest
 * accounting that prompted this: `App.tsx` was 135/226 lines covered, 91 uncovered, the whole
 * of `App()`. Splitting the parts that are pure from the parts that need a live React tree is
 * what makes the remaining gap small enough to state precisely.
 */
export function AppBar({
  active,
  tab,
  projectId,
  stream,
  freshness,
  now,
  onSelect,
}: {
  active: ViewDef;
  tab: string;
  projectId: string | null;
  stream: StreamState;
  freshness: Freshness | null;
  now: number;
  onSelect: (id: Tab) => void;
}) {
  return (
    <div className="flex h-full items-center gap-6 px-6">
      <div className="label text-text">Mission Control</div>
      <nav className="flex h-full items-center gap-1" aria-label="Views">
        {VIEWS.filter((t) => t.nav).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`relative flex h-full items-center px-2.5 text-[12.5px] transition-colors ${
              tab === t.id ? 'text-text' : 'text-dim hover:text-muted'
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-2.5 bottom-0 h-px bg-live" />}
          </button>
        ))}
        {/* A non-nav view is still WHERE YOU ARE, and the nav must say so or the bar
            claims you are on Fleet while Project fills the screen. Rendered as a
            breadcrumb rather than a tab, because it is not one: there is no way back to
            it once you leave. */}
        {!active.nav && (
          <span className="flex h-full items-center gap-1.5 px-2.5 text-[12.5px]">
            <span className="text-dim">/</span>
            <span className="relative flex h-full items-center text-text">
              {active.label}
              {projectId !== null && <span className="fig ml-1.5 text-dim">{projectId}</span>}
              <span className="absolute inset-x-0 bottom-0 h-px bg-live" />
            </span>
          </span>
        )}
      </nav>
      <div className="ml-auto">{badgeFor(active, { stream, freshness, now })}</div>
    </div>
  );
}

/**
 * The two notices under the bar, both gated on the active view being stream-backed. They
 * describe the SSE subscription and the session index, and neither is a fact about Belief or
 * Conflicts — "Everything below is the last state received" is simply false above a panel
 * that fetched its own bytes a moment ago. Extracted for the same reason as AppBar: the
 * gating is a correctness fix and it was executed by nothing.
 */
export function StreamNotices({ active, stream }: { active: ViewDef; stream: StreamState }) {
  return (
    <>
      {/* The first slice waits on a full cold index build — several seconds on a large
          transcript corpus. Without saying so, that window looks like a hung page. */}
      {active.stream && stream.fleet === null && stream.sessions === null && stream.connection !== 'failed' && (
        <div className="border-b border-line px-6 py-2 text-[12px] text-muted">
          Building the session index — one full read of every transcript under{' '}
          <code className="fig">~/.claude/projects</code>, a few seconds on a large corpus. Every refresh after this one
          reads only the bytes that were appended.
        </div>
      )}

      {active.stream && stream.connection === 'failed' && (
        <div className="border-b border-bad/40 bg-bad/10 px-6 py-2 text-[12px] text-bad">
          The live stream is closed and will not retry. Start the server with{' '}
          <code className="fig">bun run server</code> in <code className="fig">mission-control/</code>, then reload.
          Everything below is the last state received, not the current one.
        </div>
      )}
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('fleet');
  const stream = useMissionControlStream();
  const now = useNow();

  const active = VIEWS.find((v) => v.id === tab) ?? VIEWS[0];

  const [freshness, setFreshness] = useState<Freshness | null>(null);
  const onFreshness = useCallback((f: Freshness) => setFreshness(f), []);
  // Clear on every tab change, so a stale figure from the tab you just left can never be
  // shown against the tab you just opened.
  useEffect(() => setFreshness(null), [tab]);

  // The drill-down target. Held here rather than in the Project view because the view is
  // unmounted when you leave the tab, and coming back to a project you had open is the
  // expected behaviour — the id outlives the panel.
  const [projectId, setProjectId] = useState<string | null>(null);
  const openProject = useCallback((id: string) => {
    setProjectId(id);
    setTab('project');
  }, []);
  const openTab = useCallback((id: Tab) => setTab(id), []);

  return (
    <div className="min-h-[100dvh]">
      {/* Fixed height, read from the same --mc-header-h the sticky column headers offset by.
          If the bar's height and that offset are ever derived separately they will disagree,
          and the symptom is a table's column labels painted underneath this element. */}
      <header
        className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur-sm"
        style={{ height: 'var(--mc-header-h)' }}
      >
        <AppBar
          active={active}
          tab={tab}
          projectId={projectId}
          stream={stream}
          freshness={freshness}
          now={now}
          onSelect={setTab}
        />
      </header>

      <StreamNotices active={active} stream={stream} />

      <main>{active.render({ stream, now, onFreshness, openProject, projectId, openTab })}</main>
    </div>
  );
}
