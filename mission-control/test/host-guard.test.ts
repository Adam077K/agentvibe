// test/host-guard.test.ts — HG-1: the Host-header guard against DNS rebinding.
//
// THE ATTACK. A page on evil.example rebinds its name to 127.0.0.1. From then on its requests
// reach this server and the browser calls them SAME-ORIGIN: `Sec-Fetch-Site: same-origin`, the
// response readable by the page. guard.ts cannot see that by construction. The one thing that
// still names the attacker is Host — the browser sends the name it resolved, `evil.example:4300`.
//
// WHAT IS FROZEN HERE (server/routes/host-guard.ts carries the same contract in prose):
//
//   · 421 Misdirected Request — not 403. Two reasons. It is the exact meaning: this server is
//     not authoritative for that name. And it is DISTINGUISHABLE from guard.ts's 403, so a test
//     can tell which control refused: a rebinding POST is already refused by guard.ts's Origin
//     check, and a 403 there would pass with the host guard missing or mounted second.
//   · One constant text/plain body for every refusal — no route data, no echo of the Host.
//   · Allowed: `localhost`, `127.0.0.1`, `[::1]`, each bare, with PORT, or with CLIENT_PORT.
//     CLIENT_PORT because Vite's dev proxy (changeOrigin:false) forwards the browser's own Host,
//     `127.0.0.1:4301`, upstream — measured against vite 7.3.6. Any other port is refused, so
//     `localhost:9999` and `localhost:80` are refused. `LOCALHOST` is accepted (Host is
//     case-insensitive). No normalisation: `127.1`, `localhost.`, `[0::1]` are refused.
//   · Host header when present — even empty — AND the URL authority; both must be ours. No Host
//     header: judged by the URL alone, which is all an in-process `app.fetch(new Request(url))`
//     has. On the wire that case cannot be reached by a browser: Bun 400s a hostless HTTP/1.1
//     request itself, and a hostless HTTP/1.0 one arrives with a relative URL (measured).
//   · No env allowlist. config.ts makes HOST a literal so nothing in the environment widens the
//     network surface; an allowlist variable would be exactly that.
//   · X-Forwarded-Host, Forwarded, X-Host are never read.
//
// THE REAL-SOCKET HALF is gated on whether this process may bind loopback at all. Under the
// armed Claude Code sandbox it may not (Bun reports EADDRINUSE with errno 0 — see SANDBOX.md),
// and that is a property of the machine, not a result. It runs in CI and with the sandbox off.

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { Hono } from 'hono';
import { createApp } from '../server/app.ts';
import { CLIENT_PORT, PORT } from '../server/config.ts';
import { siteVerdict } from '../server/routes/guard.ts';
import { allowedHosts, hostGuard, hostVerdict, LOOPBACK_HOSTNAMES } from '../server/routes/host-guard.ts';
import { LiveState } from '../server/state.ts';

const REFUSED = 421;
const EVIL = 'evil.example:4300';
const INDEX_SENTINEL = 'HG1-INDEX-SENTINEL-5c1e';
const ASSET_SENTINEL = 'HG1-ASSET-SENTINEL-9b2d';

let tmp: string;
let dist: string;
let missionsDir: string;
const envBefore: Record<string, string | undefined> = {};

function fixtureState(name: string): LiveState {
  const root = path.join(tmp, name);
  fs.mkdirSync(path.join(root, 'projects'), { recursive: true });
  fs.mkdirSync(path.join(root, 'claude'), { recursive: true });
  return new LiveState({
    roots: [path.join(root, 'projects')],
    claudeProjectsRoot: path.join(root, 'claude'),
    // Inside the fixture, never $HOME — check.mjs fails a run that writes there.
    indexCachePath: path.join(root, 'index-cache.json'),
  });
}

const appWith = (state: LiveState = fixtureState(`s-${Math.random().toString(36).slice(2)}`)) => createApp(state, dist);

/** The request a rebinding page actually produces: URL authority and Host both name the attacker. */
function rebound(p: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}): Request {
  return new Request(`http://${EVIL}${p}`, {
    method: init.method ?? 'GET',
    headers: { host: EVIL, ...(init.headers ?? {}) },
    body: init.body,
  });
}

function ours(p: string, host = `127.0.0.1:${PORT}`, init: { method?: string; headers?: Record<string, string>; body?: string } = {}): Request {
  return new Request(`http://${host}${p}`, {
    method: init.method ?? 'GET',
    headers: { host, ...(init.headers ?? {}) },
    body: init.body,
  });
}

/**
 * Reads a response the test expects to be a refusal WITHOUT hanging when it is not: an
 * unguarded `/events` is an endless stream, so anything other than 421 has its body cancelled
 * and comes back with `body: null`.
 */
async function settle(res: Response): Promise<{ status: number; type: string | null; body: string | null }> {
  if (res.status !== REFUSED) {
    await res.body?.cancel();
    return { status: res.status, type: res.headers.get('content-type'), body: null };
  }
  return { status: res.status, type: res.headers.get('content-type'), body: await res.text() };
}

function boardLines(): string[] {
  const f = path.join(missionsDir, 'board.jsonl');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean) : [];
}

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-hostguard-'));
  dist = path.join(tmp, 'dist');
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), `<!doctype html><title>MC</title><div id="root">${INDEX_SENTINEL}</div>`);
  fs.writeFileSync(path.join(dist, 'assets', 'app-hg1.js'), `console.log("${ASSET_SENTINEL}")`);
  fs.writeFileSync(path.join(tmp, 'package.json'), '{"name":"outside-dist"}');
  // Every write a handler could make lands in the fixture — on the seam the handlers DO run.
  missionsDir = path.join(tmp, 'missions');
  fs.mkdirSync(missionsDir, { recursive: true });
  for (const k of ['MC_MISSIONS_DIR', 'MC_DISPATCH_QUEUE']) envBefore[k] = process.env[k];
  process.env.MC_MISSIONS_DIR = missionsDir;
  process.env.MC_DISPATCH_QUEUE = path.join(tmp, 'dispatch-queue.jsonl');
});

afterAll(() => {
  for (const [k, v] of Object.entries(envBefore)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ── the allowed set, by value ────────────────────────────────────────────────────────────

describe('allowedHosts — the exact set, pinned by value', () => {
  test('three loopback names × {bare, PORT, CLIENT_PORT}, lowercased', () => {
    expect([...LOOPBACK_HOSTNAMES]).toEqual(['localhost', '127.0.0.1', '[::1]']);
    expect(allowedHosts(4300, 4301).sort()).toEqual(
      [
        'localhost', 'localhost:4300', 'localhost:4301',
        '127.0.0.1', '127.0.0.1:4300', '127.0.0.1:4301',
        '[::1]', '[::1]:4300', '[::1]:4301',
      ].sort()
    );
  });

  test('the default is the configured ports, not a literal', () => {
    expect(allowedHosts().sort()).toEqual(allowedHosts(PORT, CLIENT_PORT).sort());
  });
});

// ── hostVerdict: the whole decision as a pure function ───────────────────────────────────

describe('hostVerdict — the Host header is matched exactly, case-insensitively, port-aware', () => {
  const ALLOWED = allowedHosts(4300, 4301);
  // A URL authority that is ours, so each row below is decided by the HEADER alone.
  const URL_OURS = 'http://127.0.0.1:4300/api/health';
  const verdict = (host: string) => hostVerdict(host, URL_OURS, ALLOWED).allow;

  const accept = [
    'localhost', 'localhost:4300', 'localhost:4301',
    '127.0.0.1', '127.0.0.1:4300', '127.0.0.1:4301',
    '[::1]', '[::1]:4300', '[::1]:4301',
    // Host is case-insensitive (RFC 9110 §4.2.3). Pinned as ACCEPTED.
    'LOCALHOST', 'LocalHost:4300', 'LOCALHOST:4301',
  ];
  for (const h of accept) {
    test(`accepts ${JSON.stringify(h)}`, () => expect(verdict(h)).toBe(true));
  }

  const refuse: Record<string, string[]> = {
    'the rebinding name itself': ['evil.example', 'evil.example:4300', 'EVIL.EXAMPLE:4300'],
    'a loopback name as a PREFIX (startsWith / substring)': [
      'localhost.evil.example', 'localhost.evil.example:4300', '127.0.0.1.nip.io', '127.0.0.1.nip.io:4300',
      'localhostx', '127.0.0.10', '127.0.0.1x:4300', 'localhost-evil.example',
    ],
    'a loopback name as a SUFFIX (endsWith / substring)': [
      'evil.localhost', 'evil.localhost:4300', 'notlocalhost:4300', 'x127.0.0.1', '1127.0.0.1:4300', 'evil.example.localhost',
    ],
    'a port that is not ours (port-aware, decided: only bare / PORT / CLIENT_PORT)': [
      'localhost:9999', 'localhost:80', '127.0.0.1:80', '127.0.0.1:443', '[::1]:9999',
      'localhost:43000', 'localhost:430', 'localhost:04300', 'localhost:', 'localhost:4300:4300',
      'localhost:+4300', 'localhost:4300x', 'localhost:0',
    ],
    'a trailing dot (no normalisation)': ['localhost.', 'localhost.:4300', '127.0.0.1.', '127.0.0.1.:4300', '[::1].'],
    'userinfo': [
      'user@localhost', 'user@localhost:4300', 'localhost@evil.example', 'localhost:4300@evil.example',
      'evil.example@localhost:4300', ':@localhost',
    ],
    'IPv6 variants other than the bracketed [::1]': [
      '::1', '::1:4300', '[::1', '::1]', '[::1]:', '[0:0:0:0:0:0:0:1]', '[0::1]', '[::ffff:127.0.0.1]',
      '[::ffff:7f00:1]', '[::1%25lo0]', '[::1%lo0]', '[::]', '[::1]:4300:4300', '[::1]x', '[[::1]]',
    ],
    'IPv4 spellings a URL parser would fold onto 127.0.0.1': [
      '127.1', '127.0.1', '2130706433', '0x7f000001', '0x7f.0.0.1', '0177.0.0.1', '127.0.0.1:4300.',
      '127.0.0.2', '0.0.0.0', '0',
    ],
    'list, path and injection shapes': [
      'localhost,evil.example', 'localhost, evil.example', 'evil.example, localhost', 'localhost:4300, localhost:4300',
      'localhost/evil', 'localhost/', 'localhost?x', 'localhost#x', 'local host', 'localhost\\evil', 'local%68ost',
      'localhost\tevil.example', 'localhost\u0000',
    ],
    'empty and whitespace': ['', ' ', '\t'],
  };
  for (const [group, hosts] of Object.entries(refuse)) {
    describe(`refuses ${group}`, () => {
      for (const h of hosts) {
        test(`refuses ${JSON.stringify(h)}`, () => expect(verdict(h)).toBe(false));
      }
    });
  }

  test('the configured port is the parameter, not a literal 4300', () => {
    const other = allowedHosts(5555, 5556);
    expect(hostVerdict('localhost:5555', 'http://localhost:5555/', other).allow).toBe(true);
    expect(hostVerdict('localhost:5556', 'http://localhost:5556/', other).allow).toBe(true);
    expect(hostVerdict('localhost:4300', 'http://localhost:4300/', other).allow).toBe(false);
    expect(hostVerdict('localhost:4301', 'http://localhost:4301/', other).allow).toBe(false);
  });
});

describe('hostVerdict — the URL authority is checked too, and absence is not permission', () => {
  const ALLOWED = allowedHosts(4300, 4301);

  test('no Host header: the URL authority decides (Fetch semantics; how in-process tests run)', () => {
    expect(hostVerdict(null, 'http://127.0.0.1/api/health', ALLOWED).allow).toBe(true);
    expect(hostVerdict(undefined, 'http://localhost:4300/api/health', ALLOWED).allow).toBe(true);
    expect(hostVerdict(null, 'http://evil.example:4300/api/health', ALLOWED).allow).toBe(false);
    expect(hostVerdict(null, 'http://localhost:9999/api/health', ALLOWED).allow).toBe(false);
  });

  test('no Host header AND no authority (a hostless HTTP/1.0 request, as Bun presents it) is refused', () => {
    expect(hostVerdict(null, '/api/health', ALLOWED).allow).toBe(false);
    expect(hostVerdict(undefined, '/api/health', ALLOWED).allow).toBe(false);
    expect(hostVerdict(null, 'not a url', ALLOWED).allow).toBe(false);
  });

  test('an EMPTY Host header is present, not absent — it does not fall back to the URL', () => {
    expect(hostVerdict('', 'http://127.0.0.1:4300/api/health', ALLOWED).allow).toBe(false);
    expect(hostVerdict('', '/api/health', ALLOWED).allow).toBe(false);
  });

  test('header and URL must BOTH be ours — absolute-form can make them disagree', () => {
    expect(hostVerdict('localhost:4300', 'http://evil.example/api/health', ALLOWED).allow).toBe(false);
    expect(hostVerdict('evil.example', 'http://localhost:4300/api/health', ALLOWED).allow).toBe(false);
    expect(hostVerdict('localhost:4300', 'http://localhost:4300/api/health', ALLOWED).allow).toBe(true);
  });

  test('the verdict carries a reason, which is for logs and never for the body', () => {
    const v = hostVerdict(EVIL, `http://${EVIL}/`, ALLOWED);
    expect(v.allow).toBe(false);
    expect(typeof v.reason).toBe('string');
    expect(v.reason.length).toBeGreaterThan(0);
  });
});

// ── verify, do not assume: what guard.ts already does and does not stop ──────────────────

describe('REACHABILITY — what the cross-site guard alone does with a rebinding page', () => {
  test('a rebinding POST is ALREADY refused by guard.ts — its Origin names the attacker', () => {
    // Browsers send Origin on every POST, same-origin included. So this half was covered, by
    // the check guard.ts calls defence in depth. Measured here rather than assumed.
    const v = siteVerdict('same-origin', `http://${EVIL}`);
    expect(v.allow).toBe(false);
    expect(v.by).toBe('origin');
  });

  test('a rebinding GET is NOT refused by guard.ts — same-origin, no Origin header. This is the hole', () => {
    expect(siteVerdict('same-origin', null).allow).toBe(true);
  });
});

// ── the assembled app ────────────────────────────────────────────────────────────────────

describe('createApp — a foreign Host is refused with 421 on EVERY route, method and path', () => {
  test('every route registered on the real app, for the method it is registered for', async () => {
    const app = appWith();
    // ENUMERATED FROM THE APP: a route added tomorrow is covered the day it is registered.
    const routes = app.routes
      .filter((r) => r.method !== 'ALL')
      .map((r) => ({ method: r.method, path: r.path.replace(':id', 'hg1-no-such-id') }));
    expect(routes.length).toBeGreaterThanOrEqual(15);
    expect(routes.some((r) => r.path === '/events')).toBe(true);
    expect(routes.some((r) => r.method === 'POST')).toBe(true);

    const bodies = new Set<string>();
    for (const r of routes) {
      const init = r.method === 'POST' ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' } : { method: r.method };
      const res = await settle(await app.fetch(rebound(r.path, init)));
      expect({ route: `${r.method} ${r.path}`, status: res.status }).toEqual({ route: `${r.method} ${r.path}`, status: REFUSED });
      expect(res.type ?? '').toMatch(/^text\/plain/);
      bodies.add(res.body!);
    }
    // ONE constant body: a refusal that varied by route could be carrying that route's data.
    expect(bodies.size).toBe(1);
    const [body] = [...bodies];
    expect(body!.toLowerCase()).not.toContain('evil');
    expect(body!.length).toBeLessThan(512);
  }, 60_000);

  test('the static handler and the SPA fallback: never index.html, never an asset', async () => {
    const app = appWith();
    const bodies = new Set<string>();
    for (const p of ['/', '/index.html', '/fleet', '/missions/abc', '/assets/app-hg1.js', '/api/no-such-route', '/events/x', '/..%2fpackage.json', '/favicon.ico']) {
      const res = await settle(await app.fetch(rebound(p)));
      expect({ p, status: res.status }).toEqual({ p, status: REFUSED });
      expect(res.body!).not.toContain(INDEX_SENTINEL);
      expect(res.body!).not.toContain(ASSET_SENTINEL);
      bodies.add(res.body!);
    }
    expect(bodies.size).toBe(1);
  });

  test('every method, not only GET', async () => {
    const app = appWith();
    for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const res = await settle(await app.fetch(rebound('/api/health', { method })));
      expect({ method, status: res.status }).toEqual({ method, status: REFUSED });
    }
  });

  test('/events: refused before the stream exists — no SSE, no reaper opt-out, no index build', async () => {
    const state = fixtureState('events-refused');
    const app = createApp(state, dist);
    const calls: number[] = [];
    const fakeServer = { timeout: (_r: Request, s: number) => void calls.push(s) };
    const res = await settle(await app.fetch(rebound('/events'), fakeServer));
    expect(res.status).toBe(REFUSED);
    expect(res.type ?? '').not.toContain('text/event-stream');
    expect(res.body!).not.toContain('event:');
    expect(calls).toEqual([]);
    expect(state.isBuilt).toBe(false);
  });

  test('a refused GET does no work — the handler never ran, its response was not merely replaced', async () => {
    const state = fixtureState('get-no-work');
    const app = createApp(state, dist);
    expect((await settle(await app.fetch(rebound('/api/sessions')))).status).toBe(REFUSED);
    expect(state.isBuilt).toBe(false);

    // NON-VACUITY: the same request with our Host builds the index, so `false` above is the guard.
    const ok = await app.fetch(ours('/api/sessions'));
    expect(ok.status).toBe(200);
    expect(state.isBuilt).toBe(true);
  });

  test('a refused POST appends nothing — even one guard.ts would let through (no Origin, no Sec-Fetch-Site)', async () => {
    const app = appWith();
    const before = boardLines().length;
    const body = JSON.stringify({ title: 'hg1 rebinding', goal: 'must never be written' });
    const res = await settle(await app.fetch(rebound('/api/missions', { method: 'POST', headers: { 'content-type': 'application/json' }, body })));
    expect(res.status).toBe(REFUSED);
    expect(boardLines().length).toBe(before);

    // NON-VACUITY: the identical POST with our Host is written.
    const ok = await app.fetch(ours('/api/missions', `127.0.0.1:${PORT}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body }));
    expect(ok.status).toBe(201);
    expect(boardLines().length).toBe(before + 1);
  });

  test('the rebinding POST as a browser sends it gets 421, not guard.ts 403 — the host guard runs FIRST', async () => {
    const app = appWith();
    const before = boardLines().length;
    const res = await settle(
      await app.fetch(
        rebound('/api/missions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: `http://${EVIL}`, 'sec-fetch-site': 'same-origin' },
          body: JSON.stringify({ title: 't', goal: 'g' }),
        })
      )
    );
    expect(res.status).toBe(REFUSED);
    expect(boardLines().length).toBe(before);
  });

  test('a cross-site request with OUR Host is still guard.ts\'s to refuse (403) — the two do not merge', async () => {
    const app = appWith();
    const res = await app.fetch(ours('/api/health', `127.0.0.1:${PORT}`, { headers: { 'sec-fetch-site': 'cross-site' } }));
    expect(res.status).toBe(403);
  });
});

describe('createApp — what the guard reads, and what it never reads', () => {
  test('X-Forwarded-Host, Forwarded, X-Host and X-Original-Host never make a foreign Host acceptable', async () => {
    const app = appWith();
    const loop = `127.0.0.1:${PORT}`;
    const laundering: Record<string, string>[] = [
      { 'x-forwarded-host': loop },
      { forwarded: `host=${loop}` },
      { forwarded: `for=127.0.0.1;host=${loop};proto=http` },
      { 'x-host': loop },
      { 'x-original-host': loop },
      { 'x-forwarded-server': loop },
    ];
    for (const headers of laundering) {
      const res = await settle(await app.fetch(rebound('/api/health', { headers })));
      expect({ headers, status: res.status }).toEqual({ headers, status: REFUSED });
    }
  });

  test('…and never make our own Host unacceptable either: they are not read at all', async () => {
    const app = appWith();
    const res = await app.fetch(ours('/api/health', `127.0.0.1:${PORT}`, { headers: { 'x-forwarded-host': EVIL, forwarded: `host=${EVIL}` } }));
    expect(res.status).toBe(200);
  });

  test('Host and URL authority must both be ours', async () => {
    const app = appWith();
    const headerOursUrlNot = new Request(`http://${EVIL}/api/health`, { headers: { host: `127.0.0.1:${PORT}` } });
    const urlOursHeaderNot = new Request(`http://127.0.0.1:${PORT}/api/health`, { headers: { host: EVIL } });
    expect((await settle(await app.fetch(headerOursUrlNot))).status).toBe(REFUSED);
    expect((await settle(await app.fetch(urlOursHeaderNot))).status).toBe(REFUSED);
  });

  test('two Host headers, in either order, are refused — the joined value is not a name', async () => {
    const app = appWith();
    for (const order of [[`127.0.0.1:${PORT}`, EVIL], [EVIL, `127.0.0.1:${PORT}`]]) {
      const headers = new Headers();
      for (const h of order) headers.append('host', h);
      const res = await settle(await app.fetch(new Request(`http://127.0.0.1:${PORT}/api/health`, { headers })));
      expect({ order, status: res.status }).toEqual({ order, status: REFUSED });
    }
  });

  test('an empty Host header is refused', async () => {
    const app = appWith();
    const res = await settle(await app.fetch(new Request(`http://127.0.0.1:${PORT}/api/health`, { headers: { host: '' } })));
    expect(res.status).toBe(REFUSED);
  });
});

describe('NON-VACUITY — every allowed spelling reaches the route, with real data', () => {
  test('each of the nine allowed authorities, plus LOCALHOST, answers /api/health with ok:true', async () => {
    const app = appWith();
    for (const host of [...allowedHosts(), `LOCALHOST:${PORT}`]) {
      const res = await app.fetch(ours('/api/health', host));
      expect({ host, status: res.status }).toEqual({ host, status: 200 });
      expect(((await res.json()) as { ok: boolean }).ok).toBe(true);
    }
  });

  test('the Vite dev proxy forwards Host 127.0.0.1:CLIENT_PORT unchanged — it must reach the API and /events', async () => {
    const app = appWith();
    for (const host of [`127.0.0.1:${CLIENT_PORT}`, `localhost:${CLIENT_PORT}`]) {
      expect((await app.fetch(ours('/api/health', host))).status).toBe(200);
      const events = await app.fetch(ours('/events', host, { method: 'HEAD' }));
      expect(events.status).toBe(200);
      expect(events.headers.get('content-type')).toContain('text/event-stream');
    }
  });

  test('the page itself is served for our Host', async () => {
    const app = appWith();
    const res = await app.fetch(ours('/', `localhost:${PORT}`));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain(INDEX_SENTINEL);
  });

  test('a request with no Host header and a loopback URL — every existing test — still reaches the route', async () => {
    const app = appWith();
    expect((await app.fetch(new Request('http://127.0.0.1/api/health'))).status).toBe(200);
    expect((await app.fetch(new Request(`http://127.0.0.1:${PORT}/api/health`))).status).toBe(200);
    expect((await app.request('/api/health')).status).toBe(200); // Hono's default: http://localhost
  });
});

describe('hostGuard in isolation', () => {
  test('calls next() for an allowed Host and NOT for a refused one; honours the allowed list it is given', async () => {
    let reached = 0;
    const app = new Hono();
    app.use('*', hostGuard(allowedHosts(5555, 5556)));
    app.all('*', (c) => {
      reached++;
      return c.text('reached');
    });

    const yes = await app.fetch(new Request('http://localhost:5555/x', { headers: { host: 'localhost:5555' } }));
    expect(await yes.text()).toBe('reached');
    expect(reached).toBe(1);

    const no = await app.fetch(new Request('http://localhost:4300/x', { headers: { host: 'localhost:4300' } }));
    expect(no.status).toBe(REFUSED);
    expect(reached).toBe(1);
  });
});

// ── over a real socket ───────────────────────────────────────────────────────────────────

/** Whether this process may bind loopback. Gated on the MACHINE, never on what the guard did. */
function bindRefusal(): string | null {
  try {
    const s = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response('') });
    s.stop(true);
    return null;
  } catch (e) {
    return String(e);
  }
}
const BIND_REFUSED = bindRefusal();
if (BIND_REFUSED) {
  console.warn(
    `\n[host-guard.test] NOT VERIFIED OVER A SOCKET — loopback bind() refused here (${BIND_REFUSED}).\n` +
      '[host-guard.test] This is the armed sandbox, not a result. The raw-TCP and SSE cases below are\n' +
      '[host-guard.test] SKIPPED; run `bun test test/host-guard.test.ts` with the sandbox off, or rely on CI.\n'
  );
}

interface Raw {
  status: number;
  headers: string;
  body: string;
  timedOut: boolean;
}

/** One request, written byte for byte, so Host is exactly what the attacker chooses. */
function raw(port: number, request: string, opts: { headersOnly?: boolean; timeoutMs?: number } = {}): Promise<Raw> {
  return new Promise((resolve, reject) => {
    const sock = net.connect(port, '127.0.0.1', () => sock.write(request));
    let buf = '';
    let timedOut = false;
    const finish = () => {
      clearTimeout(timer);
      const [head = '', ...rest] = buf.split('\r\n\r\n');
      const status = Number(/^HTTP\/1\.[01] (\d{3})/.exec(head)?.[1] ?? 0);
      resolve({ status, headers: head.toLowerCase(), body: rest.join('\r\n\r\n'), timedOut });
    };
    const timer = setTimeout(() => {
      timedOut = true;
      sock.destroy();
      finish();
    }, opts.timeoutMs ?? 3_000);
    sock.on('data', (d) => {
      buf += d.toString('latin1');
      if (opts.headersOnly && buf.includes('\r\n\r\n')) {
        sock.destroy();
        finish();
      }
    });
    sock.on('end', finish);
    sock.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

const get11 = (p: string, host: string, extra = '') =>
  `GET ${p} HTTP/1.1\r\nHost: ${host}\r\n${extra}Connection: close\r\n\r\n`;

describe.skipIf(BIND_REFUSED !== null)('over a real socket — forged Host headers, byte for byte', () => {
  let server: ReturnType<typeof Bun.serve>;
  let port: number;
  let refusalBody: string;
  const LOOP = `127.0.0.1:${PORT}`;

  beforeAll(async () => {
    const app = appWith(fixtureState('socket'));
    // NO idleTimeout override: the shipped server keeps Bun's default (see server/index.ts).
    server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: app.fetch });
    port = server.port!; // set: we asked for a TCP port, not a unix socket
    // The in-process refusal body, to show the wire carries the very same constant.
    refusalBody = (await settle(await app.fetch(rebound('/api/health')))).body ?? '<not refused>';
  });

  afterAll(() => {
    server?.stop(true);
  });

  test('CONTROL: our Host over the wire is answered with real data', async () => {
    const r = await raw(port, get11('/api/health', LOOP));
    expect(r.status).toBe(200);
    expect(r.body).toContain('"ok":true');
    const upper = await raw(port, get11('/api/health', `LOCALHOST:${PORT}`));
    expect(upper.status).toBe(200);
  });

  test('a forged Host is refused with 421 and the constant body, on API, static and SPA paths', async () => {
    for (const p of ['/api/health', '/api/missions', '/api/decisions', '/', '/index.html', '/assets/app-hg1.js', '/fleet']) {
      const r = await raw(port, get11(p, EVIL));
      expect({ p, status: r.status }).toEqual({ p, status: REFUSED });
      expect(r.body).toBe(refusalBody);
      expect(r.body).not.toContain(INDEX_SENTINEL);
      expect(r.body).not.toContain(ASSET_SENTINEL);
    }
  });

  test('GET /events with a forged Host: 421, the response ENDS, and no event is ever written', async () => {
    const r = await raw(port, get11('/events', EVIL), { timeoutMs: 4_000 });
    expect(r.timedOut).toBe(false);
    expect(r.status).toBe(REFUSED);
    expect(r.headers).not.toContain('text/event-stream');
    expect(r.body).not.toContain('event:');
  });

  test('CONTROL: GET /events with our Host is a live event stream', async () => {
    const r = await raw(port, get11('/events', LOOP), { headersOnly: true, timeoutMs: 10_000 });
    expect(r.status).toBe(200);
    expect(r.headers).toContain('text/event-stream');
  });

  test('a missing Host: HTTP/1.0 is refused by the guard; HTTP/1.1 is refused by Bun before it', async () => {
    const h10 = await raw(port, 'GET /api/health HTTP/1.0\r\n\r\n');
    expect(h10.status).toBe(REFUSED);
    expect(h10.body).not.toContain('"ok"');
    const h11 = await raw(port, 'GET /api/health HTTP/1.1\r\nConnection: close\r\n\r\n');
    expect(h11.status).not.toBe(200);
    expect(h11.body).not.toContain('"ok"');
  });

  test('two Host headers on the wire, either order, are refused', async () => {
    for (const [a, b] of [[LOOP, EVIL], [EVIL, LOOP]]) {
      const r = await raw(port, `GET /api/health HTTP/1.1\r\nHost: ${a}\r\nHost: ${b}\r\nConnection: close\r\n\r\n`);
      expect({ a, b, status: r.status }).toEqual({ a, b, status: REFUSED });
    }
  });

  test('absolute-form: the request-line authority and Host must both be ours', async () => {
    const r1 = await raw(port, `GET http://${LOOP}/api/health HTTP/1.1\r\nHost: ${EVIL}\r\nConnection: close\r\n\r\n`);
    expect(r1.status).toBe(REFUSED);
    const r2 = await raw(port, `GET http://${EVIL}/api/health HTTP/1.1\r\nHost: ${LOOP}\r\nConnection: close\r\n\r\n`);
    expect(r2.status).toBe(REFUSED);
  });

  test('spellings Bun folds onto 127.0.0.1 in req.url are refused — the HEADER is judged, raw', async () => {
    for (const h of ['127.1', `127.1:${PORT}`, '2130706433', `0x7f000001:${PORT}`, `localhost.:${PORT}`, `localhost:80`, `[0::1]:${PORT}`]) {
      const r = await raw(port, get11('/api/health', h));
      expect({ h, status: r.status }).toEqual({ h, status: REFUSED });
    }
  });

  test('forwarding headers on the wire do not launder a forged Host', async () => {
    const r = await raw(port, get11('/api/health', EVIL, `X-Forwarded-Host: ${LOOP}\r\nForwarded: host=${LOOP}\r\n`));
    expect(r.status).toBe(REFUSED);
  });

  test('a forged-Host POST over the wire is refused and writes nothing', async () => {
    const before = boardLines().length;
    const body = JSON.stringify({ title: 'hg1 wire', goal: 'must never be written' });
    const r = await raw(
      port,
      `POST /api/missions HTTP/1.1\r\nHost: ${EVIL}\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`
    );
    expect(r.status).toBe(REFUSED);
    expect(boardLines().length).toBe(before);
  });
});
