// scripts/pid-alive.ts — the one "is this runner still there?" check.
//
// run-missions.ts (reconcile a `working` card, take over a lock) and decisions.ts (expire a question
// nobody can answer) both ask it, and each used to carry its own copy. The two disagreed on any error
// other than ESRCH/EPERM: one said alive, the other dead. Both questions end in something that cannot be
// taken back (a card reaped, a question expired), so doubt has to fall one way, and it falls on ALIVE.

type Kill = (pid: number, signal?: number | string) => unknown;

/**
 * False only when the kernel says there is no such process (ESRCH). EPERM means it exists and is
 * someone else's; every other error, including a thrown value with no code, is not an answer, so the
 * process is treated as alive. `kill` is a seam for tests; production always uses process.kill.
 */
export function pidAlive(pid: number, kill: Kill = process.kill): boolean {
  try {
    kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException)?.code !== 'ESRCH';
  }
}
