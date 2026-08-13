// client/src/ui.tsx — the small set of primitives both views share.
//
// No card component. At this density a card is a box drawn around data that was already
// grouped by a heading and a 1px rule, and twelve of them on a screen is twelve borders
// competing with the one border that matters — the row separator you read along. Grouping
// here is done with `border-t`, `divide-y` and space.

import type { ReactNode } from 'react';

/**
 * Live vs dormant, encoded by SHAPE as well as colour: live is a filled disc, dormant a
 * hollow ring. The first version varied only colour, and the dormant fill (`line-strong` as
 * it then was, #333944) measured 1.663:1 against the 3:1 a non-text indicator needs — so in
 * the rendered fleet that column read as a run of empty cells, and the sole encoding of "is
 * an agent running here" was invisible. Disc-versus-ring survives low contrast and colour
 * blindness both, and the ring is drawn in `muted` (7.422:1), not a hairline nobody can see.
 */
export function StatusDot({ tone, breathing = false, title }: { tone: 'live' | 'idle' | 'warn'; breathing?: boolean; title: string }) {
  const shape =
    tone === 'live' ? 'bg-live' : tone === 'warn' ? 'bg-warn' : 'border border-muted bg-transparent';
  return (
    <span
      title={title}
      aria-label={title}
      role="img"
      className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full ${shape} ${breathing ? 'breathe' : ''}`}
    />
  );
}

/** A headline figure. Label above, number below, nothing boxed. */
export function Figure({
  label,
  value,
  sub,
  title,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  title?: string;
  tone?: 'default' | 'warn';
}) {
  return (
    <div className="min-w-0 px-5 py-3 first:pl-0">
      <div className="label">{label}</div>
      <div
        title={title}
        className={`fig mt-1 text-xl leading-none ${tone === 'warn' ? 'text-warn' : 'text-text'}`}
      >
        {value}
      </div>
      {sub !== undefined && <div className="mt-1.5 truncate text-[11px] text-dim">{sub}</div>}
    </div>
  );
}

export function Th({
  children,
  align = 'left',
  width,
  title,
}: {
  children: ReactNode;
  align?: 'left' | 'right';
  width?: string;
  title?: string;
}) {
  return (
    <th
      scope="col"
      title={title}
      // Pinned BELOW the app bar, not underneath it. `top-0` here against a `top-0 z-20`
      // header meant the column labels were painted over the instant the table scrolled —
      // total occlusion on a 2,037-row view. The offset is the shared --mc-header-h.
      style={{ ...(width ? { width } : {}), top: 'var(--mc-header-h)' }}
      className={`label sticky z-10 border-b border-line bg-ink px-3 py-2 font-medium whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  mono = false,
  className = '',
  title,
}: {
  children: ReactNode;
  align?: 'left' | 'right';
  mono?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <td
      title={title}
      className={`px-3 py-[7px] align-middle whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'} ${
        mono ? 'fig' : ''
      } ${className}`}
    >
      {children}
    </td>
  );
}

/**
 * The value is genuinely not available. Says so, and says what would fill it — TO EVERYONE.
 *
 * This carries the whole design principle of the view, and for one round it delivered it to
 * a pointer only. `title` is not reachable by keyboard, is not in the accessibility tree as
 * anything a screen reader will volunteer, and vanishes on touch. A keyboard user got the
 * absence without the reason, which is strictly worse than showing no reason at all: it
 * names a gap and withholds the one sentence that makes it actionable.
 *
 * So: `tabIndex={0}` puts it in the tab order, and `aria-label` carries the short form AND
 * the full reason as the element's accessible name, announced on focus. `title` stays for
 * the pointer. Nothing is added to the DOM text, so what the parity tests read out of a cell
 * is still exactly what a sighted reader sees.
 *
 * Deliberately NOT applied to all ~900 `title` attributes in the two tables. Making every
 * exact-token-count and every timestamp a tab stop would put hundreds of them between the
 * reader and the next control, which is its own accessibility failure. The rule drawn here
 * is: an element whose *whole purpose* is to explain an absence must be focusable; a title
 * that merely adds precision to a value already on screen need not be.
 */
export function Unavailable({ short, why }: { short: string; why: string }) {
  return (
    <span className="unavailable" tabIndex={0} role="note" aria-label={`${short}: ${why}`} title={why}>
      {short}
    </span>
  );
}

/** Skeleton rows sized like the real ones — never a spinner, which says nothing about shape. */
export function LoadingRows({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-t border-line/60">
          {Array.from({ length: columns }, (__, c) => (
            <td key={c} className="px-3 py-[7px]">
              <div
                className="skeleton h-[10px]"
                style={{ width: `${[70, 45, 55, 38, 62, 50, 44, 58][(r + c) % 8]}%`, animationDelay: `${(r % 5) * 90}ms` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** An empty result that explains itself and names what would populate it. */
export function EmptyState({ headline, body }: { headline: string; body: ReactNode }) {
  return (
    <div className="border-t border-line px-6 py-14">
      <div className="max-w-[62ch]">
        <div className="text-[15px] font-medium text-text">{headline}</div>
        <div className="mt-2 text-[13px] leading-relaxed text-muted">{body}</div>
      </div>
    </div>
  );
}

/** A one-line note under a table, for a rule the reader would otherwise have to infer. */
export function Footnote({ children }: { children: ReactNode }) {
  return <p className="max-w-[78ch] px-6 py-3 text-[11.5px] leading-relaxed text-dim">{children}</p>;
}
