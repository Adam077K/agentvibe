// server/routes/host-guard.ts — refuse any request whose Host is not a loopback name of ours.
//
// ── THE ATTACK THIS ANSWERS: DNS REBINDING ───────────────────────────────────────────────
//
// A page on evil.example serves with a short TTL, then rebinds evil.example to 127.0.0.1. Its
// next request to http://evil.example:4300/ reaches THIS server, and the browser counts it as
// SAME-ORIGIN with the page: `Sec-Fetch-Site: same-origin`, and the response is readable. The
// cross-site guard (routes/guard.ts) cannot see it, by construction. What still names the
// attacker is the Host header: the browser sends the name it resolved, `evil.example:4300`.
//
// POSTs are already refused by guard.ts's Origin check — a rebinding page's POST carries
// `Origin: http://evil.example:4300` — and test/host-guard.test.ts pins that rather than
// assuming it. What nothing refused was READING: GET /api/* and /events answered a rebinding
// page in full.
//
// ── THE CONTRACT (frozen by test/host-guard.test.ts, HG-1) ───────────────────────────────
//
//   · Allowed: `localhost`, `127.0.0.1`, `[::1]` — each bare, with PORT, or with CLIENT_PORT.
//     CLIENT_PORT because the Vite dev server proxies with changeOrigin:false and forwards the
//     browser's own Host (`127.0.0.1:4301`) upstream — measured against vite 7.3.6.
//   · Exact, case-insensitive, port-aware. No suffix, prefix or substring match; no
//     normalisation (`127.1`, `localhost.`, `[0::1]` are refused, not folded).
//   · The Host header when present (even empty), AND the request URL's authority. Both must be
//     allowed. A request with no Host header is judged by its URL alone — which is what the
//     Fetch spec means by a Request's host, and is the only authority an in-process
//     `app.fetch(new Request(url))` has. Off the wire Bun refuses a hostless HTTP/1.1 request
//     itself (400), and a hostless HTTP/1.0 one arrives with a relative URL: no authority, refused.
//   · X-Forwarded-Host, Forwarded and friends are never read. Nothing proxies to this server
//     except Vite, and Vite forwards Host itself.
//   · Refusal is 421 Misdirected Request with one constant text/plain body — never route data,
//     never the presented Host echoed back — returned before any other middleware, route,
//     static file or SSE stream runs.
//
// An exact lookup in a fixed list. No regex, no URL parsing of the Host header, no environment.

import type { MiddlewareHandler } from 'hono';
import { CLIENT_PORT, PORT } from '../config.ts';

/** The three loopback spellings a browser on this machine may legitimately put in Host. */
export const LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'] as const;

/**
 * Every exact authority accepted, lowercased: each loopback name bare, with `port`, and with
 * `clientPort`. Parameterised for the same reason allowedOrigins() in guard.ts is: a test can
 * drive a non-default port without touching MC_PORT.
 */
export function allowedHosts(port: number = PORT, clientPort: number = CLIENT_PORT): string[] {
  return LOOPBACK_HOSTNAMES.flatMap((h) => [h, `${h}:${port}`, `${h}:${clientPort}`]);
}

export interface HostVerdict {
  allow: boolean;
  /** Why — for logs and tests. NEVER placed in the response body. */
  reason: string;
}

/** One constant body for every refusal: never route data, never the presented Host. */
const REFUSAL_BODY = 'Misdirected Request: this server answers only to localhost, 127.0.0.1 and [::1].';

/**
 * The authority of a request URL, as written: what sits between `://` and the first `/`, `?`
 * or `#`. `null` when the URL has none (a relative target, or no URL at all). Userinfo is left
 * in, so it can never match an allowed entry.
 */
function urlAuthority(requestUrl: string): string | null {
  const at = requestUrl.indexOf('://');
  if (at < 1) return null;
  const rest = requestUrl.slice(at + 3);
  let end = rest.length;
  for (const stop of ['/', '?', '#']) {
    const i = rest.indexOf(stop);
    if (i >= 0 && i < end) end = i;
  }
  return rest.slice(0, end);
}

/**
 * The whole decision as a pure function of the Host header and the request URL.
 *
 * `hostHeader` is `null`/`undefined` when the request carries no Host header at all, and the
 * literal string (possibly empty, possibly comma-joined from duplicates) when it does.
 */
export function hostVerdict(
  hostHeader: string | null | undefined,
  requestUrl: string,
  allowed: string[] = allowedHosts()
): HostVerdict {
  if (hostHeader !== null && hostHeader !== undefined && !allowed.includes(hostHeader.toLowerCase())) {
    return { allow: false, reason: 'Host header is not a loopback name of this server.' };
  }
  const authority = urlAuthority(requestUrl);
  if (authority === null) return { allow: false, reason: 'Request URL carries no authority.' };
  if (!allowed.includes(authority.toLowerCase())) {
    return { allow: false, reason: 'Request URL authority is not a loopback name of this server.' };
  }
  return { allow: true, reason: 'Host and URL authority are loopback names of this server.' };
}

/**
 * Applied FIRST in server/app.ts — above crossSiteGuard, every route, mountClient and /events.
 * On a refusal it answers 421 and does not call next().
 */
export function hostGuard(allowed: string[] = allowedHosts()): MiddlewareHandler {
  return async (c, next) => {
    const verdict = hostVerdict(c.req.header('host'), c.req.url, allowed);
    if (!verdict.allow) return c.text(REFUSAL_BODY, 421);
    await next();
  };
}
