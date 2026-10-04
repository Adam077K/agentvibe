// test/static.test.ts — the one-port mode: the server that answers /api also serves client/dist.
//
// Every case builds the app through createApp(), the thing the process serves, with a fixture
// dist directory. The fixture holds a SECRET file one level ABOVE the dist root, so a
// traversal that works shows up as that file's bytes in a response body rather than as a
// status code someone has to interpret.
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.ts';
import { LiveState } from '../server/state.ts';
import { safeSegments } from '../server/routes/static.ts';

const SECRET = 'SECRET-OUTSIDE-DIST-7f3a';
let tmp: string;
let dist: string;
let app: ReturnType<typeof createApp>;
let appNoDist: ReturnType<typeof createApp>;

const get = (p: string, init?: RequestInit) => app.fetch(new Request(`http://127.0.0.1:4300${p}`, init));

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-static-'));
  dist = path.join(tmp, 'dist');
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>MC</title><div id="root"></div>');
  fs.writeFileSync(path.join(dist, 'assets', 'app-abc123.js'), 'console.log("app")');
  fs.writeFileSync(path.join(dist, 'assets', 'app-abc123.css'), 'body{color:red}');
  fs.writeFileSync(path.join(tmp, 'package.json'), `{"secret":"${SECRET}"}`);
  fs.writeFileSync(path.join(tmp, 'secret.txt'), SECRET);
  // A symlink inside dist that points outside it. A build never produces one; a confinement
  // check that only looks at the path string would follow it.
  fs.symlinkSync(path.join(tmp, 'secret.txt'), path.join(dist, 'leak.txt'));
  app = createApp(new LiveState({ indexCachePath: path.join(tmp, 'index-cache.json') }), dist);
  appNoDist = createApp(new LiveState({ indexCachePath: path.join(tmp, 'index-cache.json') }), path.join(tmp, 'does-not-exist'));
});

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('static client', () => {
  test('GET / serves index.html', async () => {
    const res = await get('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('<div id="root">');
  });

  test('serves hashed assets with their content type', async () => {
    const js = await get('/assets/app-abc123.js');
    expect(js.status).toBe(200);
    expect(js.headers.get('content-type')).toMatch(/javascript/);
    expect(await js.text()).toBe('console.log("app")');
    const css = await get('/assets/app-abc123.css');
    expect(css.status).toBe(200);
    expect(css.headers.get('content-type')).toContain('text/css');
  });

  test('SPA fallback: an extensionless non-api path gets index.html', async () => {
    const res = await get('/fleet/some-view');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<div id="root">');
  });

  test('a missing file WITH an extension is a 404, not index.html', async () => {
    const res = await get('/assets/nope.js');
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain('<div id="root">');
  });

  test('/api routes take precedence and are unchanged', async () => {
    const res = await get('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, host: '127.0.0.1' });
  });

  test('an unknown /api path is a 404, never index.html', async () => {
    const res = await get('/api/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain('<div id="root">');
  });

  test('non-GET requests are not answered by the static handler', async () => {
    const res = await get('/', { method: 'POST' });
    expect(res.status).toBe(404);
  });

  test('files carry nosniff and a frame-ancestors policy', async () => {
    for (const p of ['/', '/assets/app-abc123.js', '/fleet']) {
      const res = await get(p);
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
      expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    }
  });

  test('/events/ and /events/x are 404s, not the SPA page', async () => {
    for (const p of ['/events/', '/events/x']) {
      const res = await get(p);
      expect(res.status).toBe(404);
      expect(await res.text()).not.toContain('<div id="root">');
    }
  });

  test('an unmatched /api path is a JSON 404 for every method', async () => {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
      const res = await get('/api/definitely-not-a-route', { method });
      expect(res.status).toBe(404);
      expect(res.headers.get('content-type')).toContain('application/json');
    }
  });

  test('the cross-site guard still sits above the static handler', async () => {
    const res = await get('/', { headers: { 'sec-fetch-site': 'cross-site' } });
    expect(res.status).toBe(403);
  });
});

describe('static root confinement', () => {
  const attempts = [
    '/../package.json',
    '/..%2fpackage.json',
    '/%2e%2e/package.json',
    '/%2e%2e%2fpackage.json',
    '/assets/../../package.json',
    '/assets/..%2f..%2fpackage.json',
    '/%252e%252e/package.json',
    '/..%5cpackage.json',
    '/assets/%2e%2e%5c%2e%2e%5cpackage.json',
    '/%00/../package.json',
    '/package.json%00.js',
    '/leak.txt', // symlink out of the root
    '//etc/passwd',
    '/%2fetc%2fpasswd',
  ];

  for (const p of attempts) {
    test(`refuses ${p}`, async () => {
      const res = await get(p);
      const body = await res.text();
      expect(body).not.toContain(SECRET);
      expect(body).not.toContain('root:');
      // Whatever the status, it must not be the file: either refused outright or the
      // SPA shell for a harmless extensionless path.
      expect([200, 400, 403, 404]).toContain(res.status);
    });
  }

  // THE URL PARSER NORMALISES LITERAL `/../`, `/%2e%2e/` AND `\` BEFORE THE HANDLER SEES THEM
  // (new Request() does it here, and so does the HTTP layer), so the cases above land on a
  // harmless path and never reach safeSegments. Only a dot-dot hidden behind %2f or %5c survives
  // to the handler. These pin that the handler itself answers 400 for it — the layer the cases
  // above cannot exercise — and the unit tests below pin the function directly.
  test('a dot-dot hidden behind %2f or %5c is a 400 from the handler', async () => {
    for (const p of [
      '/..%2fpackage.json',
      '/assets/..%2f..%2fpackage.json',
      '/..%5cpackage.json',
      '/assets/%2e%2e%5c%2e%2e%5cpackage.json',
      '/%2e%2e%2fpackage.json',
    ]) {
      const res = await get(p);
      expect(res.status).toBe(400);
      expect(await res.text()).not.toContain(SECRET);
    }
  });

  test('NUL and malformed percent-encoding are 400s', async () => {
    for (const p of ['/%00/x', '/package.json%00.js', '/%E0%A4%A']) {
      expect((await get(p)).status).toBe(400);
    }
  });

  test('the symlink that leaves the root is refused', async () => {
    const res = await get('/leak.txt');
    expect(res.status).toBe(404);
  });
});

describe('client/dist missing', () => {
  test('/ says what to run', async () => {
    const res = await appNoDist.fetch(new Request('http://127.0.0.1:4300/'));
    expect(res.status).toBe(503);
    expect(await res.text()).toContain('bun run build');
  });

  test('an SPA path says the same', async () => {
    const res = await appNoDist.fetch(new Request('http://127.0.0.1:4300/fleet'));
    expect(res.status).toBe(503);
    expect(await res.text()).toContain('bun run build');
  });

  test('/api still works', async () => {
    const res = await appNoDist.fetch(new Request('http://127.0.0.1:4300/api/health'));
    expect(res.status).toBe(200);
  });
});

describe('safeSegments', () => {
  test('returns the segments of an ordinary path, dropping empty and dot segments', () => {
    expect(safeSegments('/')).toEqual([]);
    expect(safeSegments('/assets/app.js')).toEqual(['assets', 'app.js']);
    expect(safeSegments('//a/./b//')).toEqual(['a', 'b']);
    expect(safeSegments('/a%20b')).toEqual(['a b']);
  });

  test('refuses a dot-dot segment however it was spelled before decoding', () => {
    for (const p of ['/..', '/../x', '/a/../x', '/..%2fx', '/a/%2e%2e/x', '/%2e%2e%2fx', '/a%2f..%2fx']) {
      expect(safeSegments(p)).toBeNull();
    }
  });

  test('refuses NUL, backslash and malformed encoding', () => {
    for (const p of ['/%00', '/a%00b', '/a%5cb', '/a\\b', '/%E0%A4%A', '/%']) {
      expect(safeSegments(p)).toBeNull();
    }
  });

  test('decodes exactly once: a double-encoded dot-dot is a literal name, not a traversal', () => {
    expect(safeSegments('/%252e%252e/x')).toEqual(['%2e%2e', 'x']);
  });
});
