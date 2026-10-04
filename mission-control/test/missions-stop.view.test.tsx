// test/missions-stop.view.test.tsx — J2: the Stop button on a Missions card.
//
// Rendered with the real component, as test/views.test.tsx does: the markup is what the founder sees.

import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Card } from '../client/src/views/MissionsView.tsx';
import type { Mission } from '../server/missions.ts';

const base: Mission = { id: '11111111-1111-4111-8111-111111111111', title: 'T', goal: 'G', status: 'working', createdAt: 1, updatedAt: 1 };
const html = (m: Partial<Mission>, stopping = false) =>
  renderToStaticMarkup(<Card m={{ ...base, ...m }} now={2} selected={false} needsYou={false} stopping={stopping} onSelect={() => {}} onLaunch={() => {}} onStop={() => {}} />);
// The button is the only <button> a working card has, and its attributes are what is asserted.
const isDisabled = (b: string | undefined) => / disabled=""/.test(b ?? '');
const button = (h: string) => /<button[^>]*>.*?<\/button>/s.exec(h)?.[0];

describe('Stop button', () => {
  test.each(['working', 'queued'] as const)('a %s card has an enabled Stop button', (status) => {
    const b = button(html({ status }));
    expect(b).toContain('>Stop<');
    expect(isDisabled(b)).toBe(false);
  });

  test.each(['waiting', 'done', 'failed', 'stopped'] as const)('a %s card has no Stop button', (status) => {
    expect(html({ status })).not.toContain('>Stop<');
    expect(html({ status })).not.toContain('Stopping');
  });

  test('disabled and relabelled while the request is in flight', () => {
    const b = button(html({}, true));
    expect(isDisabled(b)).toBe(true);
    expect(b).toContain('Stopping…');
  });

  test('stays disabled once the board reports the request, until the runner writes stopped', () => {
    const h = html({ stopRequested: true });
    expect(isDisabled(button(h))).toBe(true);
    expect(h).toContain('stopping…'); // the pill
  });

  test('a stopped card shows the stopped state, not failed and not a verdict', () => {
    const h = html({ status: 'stopped' });
    expect(h).toContain('>stopped<');
    expect(h).not.toContain('text-bad');
    expect(h).not.toContain('Referee');
  });
});
