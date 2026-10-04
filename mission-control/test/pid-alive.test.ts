// test/pid-alive.test.ts — the one liveness check the runner and the decisions module share.
//
// Doubt is read as ALIVE: a runner that wrongly believes a peer is dead reaps its cards and expires
// its questions, and that cannot be taken back; one that wrongly believes it alive only waits.
// The kill function is injected, so nothing here signals a pid it did not spawn.

import { describe, expect, test } from 'bun:test';
import { pidAlive } from '../scripts/pid-alive.ts';

const failing = (code: string | undefined) => () => {
  throw Object.assign(new Error(`kill ${code}`), code === undefined ? {} : { code });
};

describe('pidAlive', () => {
  test('ESRCH is the only answer that means dead', () => {
    expect(pidAlive(123, failing('ESRCH'))).toBe(false);
  });

  test('EPERM means it exists and is not ours: alive', () => {
    expect(pidAlive(123, failing('EPERM'))).toBe(true);
  });

  test('any other error is doubt, and doubt is alive', () => {
    for (const code of ['EINVAL', 'EACCES', 'EAGAIN', 'ENOSYS', undefined]) expect(pidAlive(123, failing(code))).toBe(true);
  });

  test('a kill that succeeds is alive, and it is called with signal 0', () => {
    const calls: [number, number | string | undefined][] = [];
    expect(pidAlive(123, (pid, sig) => (calls.push([pid, sig]), true))).toBe(true);
    expect(calls).toEqual([[123, 0]]);
  });

  test('against the real kernel: this process is alive, a reaped child is not', () => {
    expect(pidAlive(process.pid)).toBe(true);
    expect(pidAlive(Bun.spawnSync([process.execPath, '-e', '']).pid)).toBe(false);
  });
});
