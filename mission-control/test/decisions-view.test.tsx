// test/decisions-view.test.tsx — the Decisions client pieces that are pure: the history list and the
// nav badge. The polling and the POST are covered where the server half is (decisions.test.ts);
// there is no DOM here (same trade views.test.tsx records), so these render to static markup.

import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppBar, VIEWS } from '../client/src/App.tsx';
import { DecisionHistory, singleFlight } from '../client/src/views/DecisionsView.tsx';
import type { DecisionRow, StreamState } from '../client/src/api.ts';

const NOW = 2_000_000;
const row = (over: Partial<DecisionRow>): DecisionRow => ({
  id: '11111111-2222-4333-8444-555555555555',
  missionId: '66666666-2222-4333-8444-555555555555',
  question: 'Which license?',
  options: ['MIT', 'Apache-2.0'],
  createdAt: NOW - 60_000,
  status: 'answered',
  choice: 'MIT',
  answeredAt: NOW - 30_000,
  ...over,
});

describe('DecisionHistory', () => {
  test('an answered row shows the question and the choice; an expired row says so and shows no choice', () => {
    const html = renderToStaticMarkup(
      <DecisionHistory
        now={NOW}
        rows={[row({ missionTitle: 'Write the README' }), row({ id: '22222222-2222-4333-8444-555555555555', question: 'Which tone?', status: 'expired', choice: undefined })]}
      />,
    );
    expect(html).toContain('Which license?');
    expect(html).toContain('→ MIT');
    expect(html).toContain('Write the README');
    expect(html).toContain('Which tone?');
    expect(html).toContain('expired');
  });
});

describe('the Decisions tab', () => {
  const stream: StreamState = { fleet: null, sessions: null, connection: 'live', lastEventAt: NOW };
  const bar = (badges?: Record<string, number>) =>
    renderToStaticMarkup(<AppBar active={VIEWS[0]} tab={VIEWS[0].id} projectId={null} stream={stream} freshness={null} now={NOW} onSelect={() => {}} badges={badges} />);

  test('is registered as a nav view, fetched rather than streamed', () => {
    expect(VIEWS.find((v) => v.id === 'decisions')).toMatchObject({ label: 'Decisions', nav: true, stream: false });
  });

  test('shows the pending count beside its label only when above zero', () => {
    expect(bar({ decisions: 2 })).toContain('title="2 waiting on you"');
    expect(bar({ decisions: 0 })).not.toContain('waiting on you');
    expect(bar()).not.toContain('waiting on you');
  });
});

describe('singleFlight', () => {
  test('ignores a call made while one is in flight (a double click), and accepts the next once it settles', async () => {
    const gate = singleFlight();
    let release!: () => void;
    let ran = 0;
    const first = gate(() => new Promise<void>((r) => ((ran++, (release = r)))));
    const second = gate(async () => void ran++); // the second click, same tick
    expect(await second).toBe(false);
    release();
    expect(await first).toBe(true);
    expect(ran).toBe(1);
    expect(await gate(async () => void ran++)).toBe(true);
    expect(ran).toBe(2);
  });
  test('a failing call still releases the gate', async () => {
    const gate = singleFlight();
    await gate(async () => { throw new Error('boom'); }).catch(() => {});
    expect(await gate(async () => {})).toBe(true);
  });
});
