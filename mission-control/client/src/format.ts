// client/src/format.ts — every number-to-string decision in the client, in one file.
//
// Kept separate from the components because the render-parity test (test/views.test.tsx)
// has to be able to reverse what the UI displays back to what the collector returned.
// Formatting may differ from the payload; MAGNITUDE MAY NOT. That rules out abbreviation:
// "1.2M" cannot be reversed to 1,238,441, so token counts are never abbreviated here, at
// any width. A control plane that rounds its own figures is a control plane you have to
// go and check somewhere else.

/** 1238441 → "1,238,441". Grouping separators only; never rounded, never abbreviated. */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * A share of a whole. Returns null — not `'0%'` — when the whole is zero: a share of nothing
 * is undefined, and printing 0% is a computed-looking claim about a ratio nobody computed.
 * Every caller renders the null case as an explicit absence instead.
 */
export function formatShare(part: number, whole: number): string | null {
  if (whole <= 0) return null;
  return `${Math.round((part / whole) * 100)}%`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Coarse relative time — "4m ago", "3h ago", "12d ago". Deliberately one unit and no
 * decimals: the exact instant is always one hover away in the title attribute, and a
 * second-by-second string in a table redraws every row for no information gained.
 */
export function formatRelative(at: number | null, now: number = Date.now()): string {
  if (at === null) return 'never';
  const delta = now - at;
  if (delta < 0) return 'just now'; // a clock skew of a few ms, not a session from the future
  if (delta < 45_000) return `${Math.max(1, Math.round(delta / 1000))}s ago`;
  if (delta < HOUR) return `${Math.round(delta / MINUTE)}m ago`;
  if (delta < DAY) return `${Math.round(delta / HOUR)}h ago`;
  return `${Math.round(delta / DAY)}d ago`;
}

/** The exact instant, for the title attribute behind every relative time. */
export function formatAbsolute(at: number | null): string {
  if (at === null) return 'no recorded turn';
  return new Date(at).toISOString();
}

/** A session counts as live when its most recent turn is inside this window. */
export const LIVE_WINDOW_MS = 5 * MINUTE;

export function isLive(lastTurnAt: number | null, now: number = Date.now()): boolean {
  return lastTurnAt !== null && now - lastTurnAt <= LIVE_WINDOW_MS;
}

/**
 * A short, still-distinguishing label for a session id. Always a CONTIGUOUS SUBSTRING of the
 * full id, so it can be pasted into the filter box and still match, and the full value is
 * one hover away.
 *
 * Three shapes exist on disk, and the first version of this handled one. Corrected by
 * looking at the real fleet on screen:
 *   47ad03a6-3903-4bf0-…                     a main session — a uuid
 *   agent-a8e85914b34bd46cc                  a subagent with no name recorded
 *   agent-acode-reviewer-kol-p4-specs-44b1…  a subagent, named, with a 16-hex suffix
 * Splitting on the first hyphen (the first version) rendered every one of the last two as
 * the literal word "agent" — several hundred identical labels in the column whose entire job
 * is telling rows apart. The named form is the one worth showing, so the `agent-a` prefix
 * every row shares is dropped and the role plus its session slug is kept, with four hex
 * digits to separate two runs of the same agent on the same task.
 */
const SUBAGENT_ID_RE = /^agent-a(.*?)-?([0-9a-f]{16})$/;
const UUID_HEAD_RE = /^([0-9a-f]{8})-[0-9a-f]{4}-/i;

export function shortId(id: string): string {
  const sub = SUBAGENT_ID_RE.exec(id);
  if (sub) {
    const name = sub[1] as string;
    const hex = sub[2] as string;
    return name ? `${name}-${hex.slice(0, 4)}` : hex.slice(0, 8);
  }
  const uuid = UUID_HEAD_RE.exec(id);
  if (uuid) return uuid[1] as string;
  return id.length > 20 ? id.slice(0, 20) : id;
}

/** /Users/x/VibeCoding/finfun → "~/VibeCoding/finfun" when it sits under the home dir. */
export function tildeHome(absPath: string, home: string): string {
  return home && absPath.startsWith(home) ? `~${absPath.slice(home.length)}` : absPath;
}
