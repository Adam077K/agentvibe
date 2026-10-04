// test/missions-card.test.tsx — B0-20: the Team panel's agent card shows the family of the model
// that ran, and says so when that is not the family the slot declared.

import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { AgentCardView } from '../client/src/views/MissionsView.tsx';
import type { AgentCard } from '../server/missions.ts';

const card = (over: Partial<AgentCard> = {}): AgentCard => ({
  agent: 'referee', title: 'Referee', model: 'claude-opus-5', family: 'claude', status: 'finished', eventCount: 3, latest: [], ...over,
});

describe('AgentCardView', () => {
  test('shows the derived family, not the slot name', () => {
    const html = renderToStaticMarkup(<AgentCardView a={card()} now={Date.now()} />);
    expect(html).toContain('claude-opus-5');
    expect(html).toContain('(claude)');
    expect(html).not.toContain('(openai)');
    expect(html).not.toContain('slot-mismatch');
  });

  test('a mismatch is marked on the card, naming both families', () => {
    const html = renderToStaticMarkup(<AgentCardView a={card({ slotMismatch: { slotFamily: 'codex', family: 'claude' } })} now={Date.now()} />);
    expect(html).toContain('data-testid="slot-mismatch"');
    expect(html).toContain('model ≠ slot');
    expect(html).toContain('slot declares codex');
    expect(html).toContain('model is claude');
  });
});
