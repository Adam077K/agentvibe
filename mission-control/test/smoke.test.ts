// test/smoke.test.ts — proves the rail, nothing more. No views, no collectors exist yet.
import { describe, expect, test } from 'bun:test';
import * as config from '../server/config.ts';
import mc from '../server/index.ts';

describe('mission-control rail', () => {
  test('binds loopback only', () => {
    expect(config.HOST).toBe('127.0.0.1');
  });

  test('default port is 4300 (not the old dashboard\'s 4200)', () => {
    expect(config.PORT).toBe(4300);
  });

  test('GET /api/health returns 200 and ok: true', async () => {
    const res = await mc.fetch(new Request('http://127.0.0.1/api/health'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
