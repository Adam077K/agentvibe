// client/vite.config.ts — the browser client's dev server and build.
//
// Two processes in development: `bun run server` on 4300 holds the index and the SSE tick;
// `bun run dev` serves this on 4301 and proxies /api and /events straight back to it. The
// proxy exists so the browser sees one origin and there is no CORS surface at all — the
// server never has to answer a preflight, and no header there has to be trusted.
//
// host is pinned to 127.0.0.1 for the same reason server/config.ts pins it: Vite's own
// default already binds loopback, but a default is a thing that changes and a literal is
// not. `strictPort` makes a port collision fail loudly instead of silently serving on 4302,
// where the proxy assumptions below would still hold but nothing would tell you the port
// moved.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SERVER_ORIGIN = 'http://127.0.0.1:4300';

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 4301,
    strictPort: true,
    proxy: {
      '/api': { target: SERVER_ORIGIN, changeOrigin: false },
      // SSE dies under response buffering — the browser would receive nothing until the
      // stream ended, which for this stream is never. Vite's proxy passes text/event-stream
      // through unbuffered; the explicit ws:false keeps it from trying to upgrade.
      '/events': { target: SERVER_ORIGIN, changeOrigin: false, ws: false },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
