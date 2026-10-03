// server/routes/static.ts — serve the built client (client/dist) from the same port as /api.
//
// ONE PORT, ONE ORIGIN. In development Vite serves the client on 4301 and proxies /api and
// /events to 4300. In use there is no reason for two processes: the build is a folder of static
// files, and the server that already holds the index can hand them out. Same origin also means
// the cross-site guard's own-origin allowance covers the page without a second entry.
//
// THIS IS A READ-ONLY HANDLER. It reads files with Bun.file and writes nothing; the write and
// shell bans in test/crosscheck.test.ts apply to this file like any other under server/**.
//
// ORDER. It is mounted LAST in server/app.ts, behind the guard and behind every API route, so
// /api and /events are never shadowed by a file or by the SPA fallback. A path under /api that
// no route claims is a JSON 404 here, never index.html: a client that asked for data and was
// handed HTML would fail somewhere far from the cause.
//
// CONFINEMENT, in three layers, each of which a test pins:
//   1. the path is decoded once and any NUL, backslash or `..` segment is a 400 — refused, not
//      normalised, so `/..%2fpackage.json` is an attack answered as one rather than quietly
//      folded onto a harmless path;
//   2. the file is looked up by joining the remaining segments onto the root, never by
//      resolving an absolute request path;
//   3. the REAL path of the file (symlinks followed) must still sit under the REAL root. The
//      build never makes a symlink, so one in dist is by definition something to refuse.

import fs from 'node:fs';
import path from 'node:path';
import type { Context, Hono, MiddlewareHandler } from 'hono';

/** client/dist relative to this file: server/routes -> server -> mission-control -> client/dist. */
export const DEFAULT_CLIENT_DIST = path.resolve(import.meta.dir, '..', '..', 'client', 'dist');

const MISSING_BUILD = [
  'Mission Control: the client has not been built.',
  '',
  'Run this once, from mission-control/:',
  '',
  '  bun run build',
  '',
  'then reload. The /api routes work without it; only the page needs the build.',
  '',
].join('\n');

/** Prefixes that belong to the server, not the client. An unmatched one is a 404, not the SPA. */
function isServerPath(p: string): boolean {
  return p === '/api' || p.startsWith('/api/') || p === '/events';
}

/** The segments to join onto the root, or null when the path is an attack. */
function safeSegments(rawPath: string): string[] | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null; // malformed percent-encoding
  }
  if (decoded.includes('\0') || decoded.includes('\\')) return null;
  const segments: string[] = [];
  for (const seg of decoded.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') return null;
    segments.push(seg);
  }
  return segments;
}

function realOrNull(p: string): string | null {
  try {
    return fs.realpathSync(p);
  } catch {
    return null;
  }
}

function isFile(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function serveFile(file: string, headers: Record<string, string> = {}): Response {
  const bun = Bun.file(file);
  return new Response(bun, { headers: { 'content-type': bun.type, ...headers } });
}

export function serveClient(distDir: string = DEFAULT_CLIENT_DIST): MiddlewareHandler {
  return async (c: Context) => {
    const pathname = new URL(c.req.url).pathname;

    if (isServerPath(pathname)) return c.json({ error: `no such route: ${pathname}` }, 404);

    // Looked up per request, so a build finished after the server started is picked up
    // without a restart.
    const index = path.join(distDir, 'index.html');
    if (!isFile(index)) return c.text(MISSING_BUILD, 503);

    const segments = safeSegments(pathname);
    if (segments === null) return c.text('Bad request path.', 400);

    const rootReal = realOrNull(distDir);
    if (rootReal === null) return c.text(MISSING_BUILD, 503);

    if (segments.length > 0) {
      const candidate = path.join(rootReal, ...segments);
      const real = realOrNull(candidate);
      if (real !== null && isFile(real)) {
        if (real !== rootReal && !real.startsWith(rootReal + path.sep)) {
          return c.text('Not found.', 404);
        }
        const hashed = segments[0] === 'assets';
        return serveFile(real, hashed ? { 'cache-control': 'public, max-age=31536000, immutable' } : {});
      }
      // A missing file that LOOKS like a file is a 404. Handing back index.html for a missing
      // /assets/app.js turns "stale build" into a JavaScript syntax error in the browser.
      if (path.extname(segments[segments.length - 1]!) !== '') return c.text('Not found.', 404);
    }

    // SPA fallback: a route the client router owns.
    return serveFile(index, { 'cache-control': 'no-cache' });
  };
}

/** Mount last: `app.get('*', serveClient(dir))`. */
export function mountClient(app: Hono, distDir: string = DEFAULT_CLIENT_DIST): void {
  app.get('*', serveClient(distDir));
}
