// v3 Explorer generator. Discovers docs by glob, extracts mermaid + wireframe blocks,
// and writes a single self-contained page from template.html.
// Usage: node docs/vision-v3/site/build.js "$PWD" docs/vision-v3/site $(git rev-parse --short HEAD)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [, , V = process.cwd(), S = 'docs/vision-v3/site', commitArg] = process.argv;
const ROOT = path.resolve(V), SITE = path.resolve(ROOT, S), BASE = 'docs/vision-v3', D = path.join(ROOT, BASE);

const coll = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const natural = (a, b) => coll.compare(a, b);
const ls = (rel, re) => { const dir = path.join(D, rel); if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => re.test(f) && fs.statSync(path.join(dir, f)).isFile()).sort(natural).map(f => rel ? rel + '/' + f : f); };

// ---- Discovery -----------------------------------------------------------
// round: which process round a doc belongs to (for the Rounds view)
const PLAN = [
  ['The v3 package', ls('', /^[01][^/]*\.md$/).filter(f => f !== '00-FOUNDER-DIRECTION.md'), () => 'R5'],
  ['How it was made', [
    ...ls('', /^00-FOUNDER-DIRECTION\.md$/), ...ls('r0-outward', /\.md$/), ...ls('r1-concepts', /\.md$/),
    ...ls('r2-seats', /\.md$/), ...ls('_process', /^R2-CHALLENGES\.md$/), ...ls('r3-stretch', /\.md$/), ...ls('r4-spikes', /\.md$/)],
    f => f.startsWith('00-') ? 'D' : f.startsWith('_process/R2') ? 'R2' : f.slice(0, 2).toUpperCase()],
  ['Engineering inputs', ls('engineering', /\.md$/), () => 'ENG'],
];

function shortNum(file, group) {
  const b = path.basename(file, '.md');
  if (group === 'The v3 package') return (b.match(/^\d+[a-z]?/) || [''])[0];
  const m = b.match(/^[A-Z]+\d*[a-z]?(?:-[A-Z](?=-))?|^\d+/);
  return m ? m[0].slice(0, 6) : '';
}
function cleanTitle(s) { return s.replace(/[`*_]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim(); }

const BOX = /[┌┐└┘├┤┬┴┼─│╔╗╚╝═║╠╣╦╩╬╭╮╰╯▔▁]/g, CORNER = /[┌┐└┘╔╗╚╝╭╮╰╯]/;
function extract(md) {
  const lines = md.split('\n'), mer = [], wf = []; let heading = '', fence = null;
  for (const line of lines) {
    if (!fence) {
      const h = line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/); if (h) { heading = cleanTitle(h[1]); continue; }
      const f = line.match(/^(\s*)(`{3,}|~{3,})\s*([^\s`]*)(.*)$/);
      if (f) fence = { indent: f[1].length, mark: f[2], lang: (f[3] || '').toLowerCase(), info: (f[3] + f[4]).toLowerCase(), heading, body: [] };
      continue;
    }
    const t = line.trim();
    if (t[0] === fence.mark[0] && t.length >= fence.mark.length && t === fence.mark[0].repeat(t.length)) {
      const code = fence.body.map(l => l.slice(Math.min(fence.indent, l.length - l.trimStart().length))).join('\n').replace(/\s+$/, '');
      if (fence.lang === 'mermaid') mer.push({ heading: fence.heading, code });
      else {
        const n = (code.match(BOX) || []).length;
        if (/wireframe/.test(fence.info) || CORNER.test(code) || n >= 3) wf.push({ heading: fence.heading, code, lang: fence.lang });
      }
      fence = null; continue;
    }
    fence.body.push(line);
  }
  return { mer, wf };
}

const docs = [], diagrams = [], wireframes = [], used = new Set(); let bytes = 0;
for (const [group, files, roundOf] of PLAN) files.forEach((file, fi) => {
  const md = fs.readFileSync(path.join(D, file), 'utf8'), b = Buffer.byteLength(md);
  const base = path.basename(file, '.md').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let id = base; if (used.has(id) || ['home', 'rounds', 'diagrams', 'wireframes'].includes(id)) id = path.dirname(file).replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + base;
  used.add(id);
  const h1 = md.match(/^#\s+(.+)$/m);
  const doc = { id, file, path: BASE + '/' + file, num: group === 'Engineering inputs' ? 'E' + (fi + 1) : shortNum(file, group), title: h1 ? cleanTitle(h1[1]) : path.basename(file, '.md'),
    group, round: roundOf(file), family: /codex/i.test(file) ? 'Codex' : 'Claude', bytes: b, md };
  bytes += b; docs.push(doc);
  const { mer, wf } = extract(md);
  mer.forEach((m, n) => diagrams.push({ doc: id, n, heading: m.heading, code: m.code }));
  wf.forEach((w, n) => wireframes.push({ doc: id, n, heading: w.heading, code: w.code }));
});

// ---- Static diagram gallery (mermaid renders natively from <pre class="mermaid"> present at load) ----
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const byId = Object.fromEntries(docs.map(d => [d.id, d]));
const gallery = diagrams.map((g, i) => { const d = byId[g.doc];
  return `<figure class="card" data-i="${i}" data-doc="${d.id}" data-group="${esc(d.group)}">` +
    `<figcaption><a href="#${d.id}" data-jump="mermaid" data-n="${g.n}"><span class="doc">${esc(d.num ? d.num + ' · ' : '')}${esc(d.title)}</span>` +
    `<span class="where">${esc(g.heading || 'Top of document')}</span></a></figcaption>` +
    `<div class="figscroll"><pre class="mermaid">${esc(g.code)}</pre></div></figure>`; }).join('\n');

let branch = 'vision/v3-agentic-org', commit = commitArg || '';
try { branch = cp.execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || branch; } catch (e) {}
try { if (!commit) commit = cp.execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) {}

const data = { branch, commit, date: new Date().toISOString().slice(0, 10), bytes, docs, wireframes,
  diagrams: diagrams.map(({ doc, n, heading }) => ({ doc, n, heading })) };
// Escape every '<' so no '</script' (or '<!--') can end the data block early; U+2028/9 for older parsers.
const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(new RegExp('\\u2028', 'g'), '\\u2028').replace(new RegExp('\\u2029', 'g'), '\\u2029');
const out = fs.readFileSync(path.join(SITE, 'template.html'), 'utf8')
  .replace('__GALLERY__', () => gallery).replace('__DATA__', () => json);
fs.writeFileSync(path.join(SITE, 'index.html'), out);
const pkg = docs.filter(d => d.group === 'The v3 package').length;
console.log(`docs ${docs.length} (package ${pkg}) · md ${(bytes / 1024).toFixed(0)} KB · mermaid ${diagrams.length} · wireframes ${wireframes.length} · html ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`);
