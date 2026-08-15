// server/routes/guard.ts — reject cross-site browser requests.
//
// ── WHAT THIS BLOCKS, AND THE WORDING IS THE POINT ───────────────────────────────────────
//
// THIS BLOCKS CROSS-SITE BROWSER REQUESTS. It does not "block drive-by", and describing it
// that way would be this codebase's own §0 defect — a guard named for a property it does not
// have. Precisely:
//
//   · A page on any other SITE that you visit can no longer reach these routes. That covers
//     `<img src>`, `<script src>`, `<link rel=stylesheet>`, a form GET and `fetch(…,
//     {mode:'no-cors'})` — none of which needs to read the response, only to trigger the work.
//   · ANYTHING ELSE ON YOUR LOOPBACK STILL REACHES EVERYTHING. A different port on the same
//     host is `same-site`, which is ALLOWED — the app's own client is served by Vite on 4301
//     and proxies here to 4300, and that is the same shape an unrelated local tool has.
//   · A NON-BROWSER CLIENT SENDS NO SUCH HEADER AT ALL. curl, a script, another program on
//     this machine: absent header, allowed. No header check can reach that case, and
//     requiring the header would break every legitimate non-browser caller while an attacker
//     who can run a local process is already past every control this file could add.
//
// So this closes the *browser* vector on top of the allowlist in server/trust.ts. It is not a
// second, independent answer to the three RCEs; it is the other half of one.
//
// ── WHY `Sec-Fetch-Site` AND NOT `Origin` ────────────────────────────────────────────────
//
// Measured in a real browser twice, independently, with an attacker page on localhost:4312
// against a target on 127.0.0.1:4311 (different hosts, so genuinely cross-site):
//
//   request                                    Origin     Sec-Fetch-Site
//   <img> / <script> / <link> / form GET        ABSENT     cross-site
//   fetch(…, {mode:'no-cors'})                  ABSENT     cross-site
//   fetch(…) with CORS                          present    cross-site
//   same host, different port                   absent     same-site
//   the app itself                              absent     same-origin
//
// `Origin` IS ABSENT ON EVERY SUBRESOURCE VECTOR. Only a CORS `fetch` sends it, and the app's
// own same-origin GETs send none either — so an Origin check has to allow absent, and once it
// does, the `<img>` vector walks straight through. An Origin-only check would be a guard
// satisfied while the property it protects is violated. It is here as DEFENCE IN DEPTH ONLY:
// a present Origin that is not one of ours is refused, which catches nothing
// `Sec-Fetch-Site` misses today and costs one comparison.

import type { Context, MiddlewareHandler, Next } from 'hono';
import { CLIENT_PORT, HOST, PORT } from '../config.ts';

/**
 * The one value that is refused. `same-origin`, `same-site` and `none` are all allowed —
 * `none` is a typed URL, a bookmark or an opened file, which is a user navigating here on
 * purpose.
 */
export const REJECTED_FETCH_SITE = 'cross-site';

/**
 * Origins the browser may legitimately name: this server, and the Vite dev server that
 * proxies to it. Both loopback spellings, because `localhost` and `127.0.0.1` are DIFFERENT
 * origins to a browser and either may be what the user typed.
 */
export function allowedOrigins(port: number = PORT, clientPort: number = CLIENT_PORT): string[] {
  const hosts = [HOST, 'localhost'];
  return hosts.flatMap((h) => [`http://${h}:${port}`, `http://${h}:${clientPort}`]);
}

export interface SiteVerdict {
  allow: boolean;
  /** Which check decided. `sec-fetch-site` is the real control; `origin` is defence in depth. */
  by: 'sec-fetch-site' | 'origin' | 'default';
  /** Always set — on an allow it says which branch allowed, on a refusal it is the 403 body. */
  reason: string;
}

/**
 * The whole decision as a pure function of the two headers, so a test can drive every row of
 * the table above without a browser, and the 403 body says the same thing the code decided.
 *
 * FAIL-OPEN ON AN ABSENT HEADER IS DELIBERATE AND IS NOT A HOLE TO BE CLOSED LATER. Every
 * browser that ships `Sec-Fetch-Site` sends it on every request, including the app's own; a
 * request without it is a non-browser client, which this control was never able to reach.
 * Refusing those would break curl, the cold-start check and every local script, and would
 * stop no attacker: a local process can send any header it likes.
 */
export function siteVerdict(
  secFetchSite: string | null | undefined,
  origin: string | null | undefined,
  allowed: string[] = allowedOrigins()
): SiteVerdict {
  const site = secFetchSite?.trim().toLowerCase() ?? null;

  if (site === REJECTED_FETCH_SITE) {
    return {
      allow: false,
      by: 'sec-fetch-site',
      reason:
        'Refused: Sec-Fetch-Site: cross-site. This request was made by a browser on behalf of a page on another site — an <img>, <script>, form or fetch pointed at Mission Control. These routes run programs on this machine, so a page you did not write does not get to trigger them. A request you make yourself (typing the URL, a bookmark, the Mission Control UI) is same-origin, same-site or none, and is allowed.',
    };
  }

  if (origin) {
    const normalised = origin.trim().replace(/\/$/, '').toLowerCase();
    if (!allowed.includes(normalised)) {
      return {
        allow: false,
        by: 'origin',
        reason: `Refused: Origin ${origin} is not one of Mission Control's own (${allowed.join(', ')}). This check is defence in depth behind Sec-Fetch-Site — Origin is absent on every subresource vector, so it is not the control, and a request that reaches here with a foreign Origin and no cross-site marking is one worth refusing anyway.`,
      };
    }
    return { allow: true, by: 'origin', reason: `Origin ${origin} is one of Mission Control's own.` };
  }

  if (site === null) {
    return {
      allow: true,
      by: 'default',
      reason:
        'No Sec-Fetch-Site header: a non-browser client (curl, a local script). Allowed — this control only ever covered the browser vector, and anything that can run a process on this machine is already past it.',
    };
  }

  return { allow: true, by: 'sec-fetch-site', reason: `Sec-Fetch-Site: ${site} — not cross-site.` };
}

/**
 * Applied to EVERY route at the app level (server/app.ts), not per route. The findings doc
 * counted six side-effecting GETs; a seventh added later would have to be remembered, and
 * "remember to add the guard" is not a mechanism. Registering it once above the router means
 * a new route is covered by default, which is the fail-safe direction.
 */
export function crossSiteGuard(allowed: string[] = allowedOrigins()): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const verdict = siteVerdict(c.req.header('sec-fetch-site'), c.req.header('origin'), allowed);
    if (!verdict.allow) {
      return c.json({ error: verdict.reason, refusedBy: verdict.by }, 403);
    }
    await next();
  };
}
