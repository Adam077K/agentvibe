// Scorecard v0 + Budget Ledger v0 — B0-12 (docs/vision-v3/14-BUILD-PLAN.md §6 P0; 09b §3, §23).
//
// "Measure first." A pure function from three inputs to a weekly scorecard object and its Markdown:
//   1. launch receipts   — every <missions>/<id>/launches.jsonl line (server/missions.ts LaunchReceipt)
//   2. founder minutes   — a hand-kept CSV (build/founder-minutes.csv): date,minutes,kind,note
//   3. provider registry — build/providers/registry.yml (B0-02), read only for model -> plan and line
//
// Every metric cell is either a VALUE carrying its provenance (n, launch ids, file:line ranges) or FOG
// with the reason there is no receipt. Nothing here defaults, estimates or writes a zero where data is
// missing: an absent reading is fog, never zero (09b §1). A line that cannot be read as a receipt is
// COUNTED as unparsed with its location, never dropped silently.
//
// Window and weekly caps are FOG until B0-00 measures them: the registry holds published text, which is
// not a measurement.
//
// CLI:  bun run scripts/scorecard.ts --week 2026-W40 [--missions-dir D] [--minutes F] [--registry F] [--out F]
//       writes docs/08-agents_work/scorecards/<week>.md by default.

import fs from 'node:fs';
import path from 'node:path';
import { missionsDir } from '../server/missions.ts';

// ---------- types ----------

export interface Provenance {
  n: number;
  launchIds?: string[];
  /** "file:line" or "file:first-last", relative paths as given by the caller */
  locations: string[];
  /** partial coverage, stated in words — e.g. "2 of 3 receipts carry turns" */
  coverage?: string;
}
export type Cell =
  | { kind: 'value'; value: number; unit: string; provenance: Provenance }
  | { kind: 'fog'; reason: string };

export interface SourceText { file: string; text: string }
export interface Unparsed { file: string; line: number; reason: string }

export interface ParsedReceipt {
  launchId: string; missionId: string; role: string; model: string;
  startedAt: number; endedAt: number; exit: number | null; turns: number | null;
  file: string; line: number;
}
export interface MinuteRow { date: string; minutes: number; kind: string; file: string; line: number }
export interface RegistryRow { plan: string; model: string; line: number }

export interface ScorecardInput {
  week: string;
  receipts: SourceText[];
  /** null = the file does not exist */
  founderMinutes: SourceText | null;
  registry: SourceText | null;
}

export interface FamilyLedger {
  family: string;
  models: string[];
  launches: Cell; turns: Cell; wallClock: Cell; windowCap: Cell; weeklyCap: Cell;
}

export interface Scorecard {
  week: string;
  window: { start: string; end: string };
  sources: { receiptFiles: string[]; founderMinutes: string | null; registry: string | null };
  metrics: { dimension: string; measure: string; cell: Cell }[];
  budgetLedger: FamilyLedger[];
  unparsed: Unparsed[];
}

const fog = (reason: string): Cell => ({ kind: 'fog', reason });

// ---------- ISO week ----------

const DAY = 86_400_000;

/** "2026-W40" -> [Monday 00:00Z, next Monday 00:00Z). Throws on anything that is not a real ISO week. */
export function isoWeekWindow(week: string): { start: number; end: number } {
  const m = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!m) throw new Error(`--week must be YYYY-Www, got ${JSON.stringify(week)}`);
  const year = Number(m[1]);
  const w = Number(m[2]);
  const jan4 = Date.UTC(year, 0, 4);
  const week1Monday = jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * DAY;
  const start = week1Monday + (w - 1) * DAY * 7;
  if (w < 1 || isoWeekOf(start + 3 * DAY) !== week) throw new Error(`${week} is not a week of ${year}`);
  return { start, end: start + 7 * DAY };
}

export function isoWeekOf(ms: number): string {
  const d = new Date(ms);
  const thursday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + (3 - ((d.getUTCDay() + 6) % 7)) * DAY;
  const y = new Date(thursday).getUTCFullYear();
  const wk = Math.floor((thursday - Date.UTC(y, 0, 1)) / DAY / 7) + 1;
  return `${y}-W${String(wk).padStart(2, '0')}`;
}

// ---------- parsers ----------

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function parseReceipts(sources: SourceText[]): { receipts: ParsedReceipt[]; unparsed: Unparsed[] } {
  const receipts: ParsedReceipt[] = [];
  const unparsed: Unparsed[] = [];
  for (const { file, text } of sources) {
    text.split('\n').forEach((raw, i) => {
      const line = i + 1;
      if (!raw.trim()) return;
      let p: Record<string, unknown>;
      try {
        const j: unknown = JSON.parse(raw);
        if (typeof j !== 'object' || j === null || Array.isArray(j)) throw new Error('not an object');
        p = j as Record<string, unknown>;
      } catch {
        unparsed.push({ file, line, reason: 'not a JSON object' });
        return;
      }
      const missing = ['launchId', 'missionId', 'role', 'model'].filter((k) => !isStr(p[k]));
      if (!isNum(p.startedAt)) missing.push('startedAt');
      if (!isNum(p.endedAt)) missing.push('endedAt');
      if (missing.length) {
        unparsed.push({ file, line, reason: `missing or mistyped: ${missing.join(', ')}` });
        return;
      }
      if ((p.endedAt as number) < (p.startedAt as number)) {
        unparsed.push({ file, line, reason: 'endedAt before startedAt' });
        return;
      }
      if (p.turns !== null && p.turns !== undefined && !(isNum(p.turns) && p.turns >= 0)) {
        unparsed.push({ file, line, reason: 'turns is neither a count nor null' });
        return;
      }
      receipts.push({
        launchId: p.launchId as string, missionId: p.missionId as string, role: p.role as string,
        model: p.model as string, startedAt: p.startedAt as number, endedAt: p.endedAt as number,
        exit: isNum(p.exit) ? p.exit : null, turns: isNum(p.turns) ? p.turns : null, file, line,
      });
    });
  }
  return { receipts, unparsed };
}

/** CSV: header `date,minutes,kind,note`; `#` lines are comments. Quoting is not supported — keep notes comma-free. */
export function parseFounderMinutes(src: SourceText): { rows: MinuteRow[]; unparsed: Unparsed[] } {
  const rows: MinuteRow[] = [];
  const unparsed: Unparsed[] = [];
  src.text.split('\n').forEach((raw, i) => {
    const line = i + 1;
    const t = raw.trim();
    if (!t || t.startsWith('#') || /^date\s*,/i.test(t)) return;
    const [date = '', minutes = '', kind = ''] = t.split(',').map((s) => s.trim());
    const n = Number(minutes);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z'))) {
      unparsed.push({ file: src.file, line, reason: 'date is not YYYY-MM-DD' });
    } else if (minutes === '' || !Number.isFinite(n) || n < 0) {
      unparsed.push({ file: src.file, line, reason: 'minutes is not a non-negative number' });
    } else {
      rows.push({ date, minutes: n, kind: kind || 'unspecified', file: src.file, line });
    }
  });
  return { rows, unparsed };
}

/** Reads only `- plan:` / `model:` pairs from registry.yml, keeping the model line for provenance. */
export function parseRegistry(src: SourceText): RegistryRow[] {
  const rows: RegistryRow[] = [];
  let plan: string | null = null;
  src.text.split('\n').forEach((raw, i) => {
    const p = /^\s*-\s+plan:\s*(.+?)\s*$/.exec(raw);
    if (p) { plan = p[1]!.replace(/^["']|["']$/g, ''); return; }
    const m = /^\s+model:\s*(\S+)\s*$/.exec(raw);
    if (m && plan) rows.push({ plan, model: m[1]!.replace(/^["']|["']$/g, ''), line: i + 1 });
  });
  return rows;
}

// ---------- provenance ----------

function locations(items: { file: string; line: number }[]): string[] {
  const byFile = new Map<string, number[]>();
  for (const { file, line } of items) byFile.set(file, [...(byFile.get(file) ?? []), line]);
  const out: string[] = [];
  for (const [file, lines] of [...byFile].sort(([a], [b]) => a.localeCompare(b))) {
    const s = [...new Set(lines)].sort((a, b) => a - b);
    let lo = s[0]!, prev = s[0]!;
    for (const l of [...s.slice(1), NaN]) {
      if (l === prev + 1) { prev = l; continue; }
      out.push(lo === prev ? `${file}:${lo}` : `${file}:${lo}-${prev}`);
      lo = prev = l;
    }
  }
  return out;
}

const fromReceipts = (rs: ParsedReceipt[], coverage?: string): Provenance => ({
  n: rs.length, launchIds: rs.map((r) => r.launchId), locations: locations(rs), ...(coverage ? { coverage } : {}),
});

function receiptMetrics(rs: ParsedReceipt[], none: string): { launches: Cell; turns: Cell; wallClock: Cell; nonzeroExit: Cell } {
  if (rs.length === 0) return { launches: fog(none), turns: fog(none), wallClock: fog(none), nonzeroExit: fog(none) };
  const withTurns = rs.filter((r) => r.turns !== null);
  const withExit = rs.filter((r) => r.exit !== null);
  return {
    launches: { kind: 'value', value: rs.length, unit: 'launches', provenance: fromReceipts(rs) },
    turns: withTurns.length === 0
      ? fog(`${rs.length} receipt(s), none carry turns (turns: null)`)
      : { kind: 'value', value: withTurns.reduce((a, r) => a + (r.turns ?? 0), 0), unit: 'turns',
          provenance: fromReceipts(withTurns, withTurns.length < rs.length ? `${withTurns.length} of ${rs.length} receipts carry turns` : undefined) },
    wallClock: { kind: 'value', value: Math.round(rs.reduce((a, r) => a + (r.endedAt - r.startedAt), 0) / 1000), unit: 's', provenance: fromReceipts(rs) },
    nonzeroExit: withExit.length === 0
      ? fog(`${rs.length} receipt(s), none carry an exit code`)
      : { kind: 'value', value: withExit.filter((r) => r.exit !== 0).length, unit: 'launches',
          provenance: fromReceipts(withExit, withExit.length < rs.length ? `${withExit.length} of ${rs.length} receipts carry an exit code` : undefined) },
  };
}

// ---------- the pure function ----------

const NO_RECEIPT_KIND = 'no receipt kind records this yet (P0 receipts are launch receipts only)';

export function buildScorecard(input: ScorecardInput): Scorecard {
  const { start, end } = isoWeekWindow(input.week);
  const parsed = parseReceipts(input.receipts);
  const inWeek = parsed.receipts.filter((r) => r.startedAt >= start && r.startedAt < end);
  const noneInWeek = input.receipts.length === 0 ? 'no receipt: no launches.jsonl found' : `no receipt: no launch started in ${input.week}`;
  const all = receiptMetrics(inWeek, noneInWeek);

  const unparsed = [...parsed.unparsed];
  let founder: Cell;
  if (input.founderMinutes === null) {
    founder = fog('no receipt: founder-minutes file does not exist (minutes are logged by hand)');
  } else {
    const fm = parseFounderMinutes(input.founderMinutes);
    unparsed.push(...fm.unparsed);
    const rows = fm.rows.filter((r) => { const t = Date.parse(r.date + 'T00:00:00Z'); return t >= start && t < end; });
    founder = rows.length === 0
      ? fog(`no receipt: no hand-logged entry for ${input.week}`)
      : { kind: 'value', value: rows.reduce((a, r) => a + r.minutes, 0), unit: 'min',
          provenance: { n: rows.length, locations: locations(rows),
            coverage: [...new Set(rows.map((r) => r.kind))].sort().join(', ') } };
  }

  const scanned = input.receipts.length;
  const unparsedCell: Cell = scanned === 0 && input.founderMinutes === null
    ? fog('no receipt: nothing to parse')
    : { kind: 'value', value: unparsed.length, unit: 'lines',
        provenance: { n: unparsed.length, locations: locations(unparsed),
          coverage: `${scanned} receipt file(s)${input.founderMinutes ? ' + founder-minutes file' : ''} scanned` } };

  const metrics: Scorecard['metrics'] = [
    { dimension: 'Progress', measure: 'accepted Charter outcomes', cell: fog(NO_RECEIPT_KIND) },
    { dimension: 'Delivery', measure: 'launches', cell: all.launches },
    { dimension: 'Delivery', measure: 'launches exiting non-zero', cell: all.nonzeroExit },
    { dimension: 'Delivery', measure: 'first-attempt acceptance', cell: fog(NO_RECEIPT_KIND) },
    { dimension: 'Reliability', measure: 'share passing all 3 trials', cell: fog(NO_RECEIPT_KIND) },
    { dimension: 'Harm', measure: 'unauthorised effects', cell: fog(NO_RECEIPT_KIND) },
    { dimension: 'Economics', measure: 'cost per accepted outcome', cell: fog(NO_RECEIPT_KIND) },
    { dimension: 'Founder', measure: 'decision + rescue minutes (hand-logged)', cell: founder },
    { dimension: 'Compute', measure: 'turns', cell: all.turns },
    { dimension: 'Compute', measure: 'wall-clock', cell: all.wallClock },
    { dimension: 'Measurement', measure: 'unparsed input lines', cell: unparsedCell },
    { dimension: 'Improvement', measure: 'weeks with no demonstrated improvement', cell: fog(NO_RECEIPT_KIND) },
  ];

  // Budget Ledger v0: per family (registry plan), from receipts. Caps are fog until B0-00 measures them.
  const registry = input.registry ? parseRegistry(input.registry) : [];
  const planOf = (model: string) => registry.find((r) => r.model === model);
  const families = new Map<string, ParsedReceipt[]>();
  for (const r of inWeek) {
    const fam = planOf(r.model)?.plan ?? `unregistered model: ${r.model}`;
    families.set(fam, [...(families.get(fam) ?? []), r]);
  }
  for (const row of registry) if (!families.has(row.plan)) families.set(row.plan, []);
  const budgetLedger: FamilyLedger[] = [...families].sort(([a], [b]) => a.localeCompare(b)).map(([family, rs]) => {
    const regRows = registry.filter((r) => r.plan === family);
    const m = receiptMetrics(rs, `no receipt: no ${family} launch in ${input.week}`);
    const capFog = regRows.length === 0
      ? fog('not measured: model absent from the provider registry')
      : fog(`not measured: B0-00 has not run (registry lines ${regRows.map((r) => r.line).join(', ')} hold published text, not a measurement)`);
    return {
      family,
      models: [...new Set([...regRows.map((r) => r.model), ...rs.map((r) => r.model)])].sort(),
      launches: m.launches, turns: m.turns, wallClock: m.wallClock, windowCap: capFog, weeklyCap: capFog,
    };
  });

  return {
    week: input.week,
    window: { start: new Date(start).toISOString(), end: new Date(end).toISOString() },
    sources: {
      receiptFiles: input.receipts.map((s) => s.file).sort(),
      founderMinutes: input.founderMinutes?.file ?? null,
      registry: input.registry?.file ?? null,
    },
    metrics, budgetLedger, unparsed,
  };
}

// ---------- render ----------

function cellMd(c: Cell): string {
  if (c.kind === 'fog') return `**FOG** — ${c.reason}`;
  const p = c.provenance;
  const where = p.locations.length > 6 ? [...p.locations.slice(0, 6), `+${p.locations.length - 6} more`] : p.locations;
  const bits = [`n=${p.n}`, ...(p.coverage ? [p.coverage] : []), ...(where.length ? [where.map((l) => `\`${l}\``).join(' ')] : [])];
  return `${c.value} ${c.unit} (${bits.join('; ')})`;
}

const esc = (s: string) => s.replace(/\|/g, '\\|');

export function renderMarkdown(s: Scorecard): string {
  const fogCount = s.metrics.filter((m) => m.cell.kind === 'fog').length
    + s.budgetLedger.reduce((a, f) => a + [f.launches, f.turns, f.wallClock, f.windowCap, f.weeklyCap].filter((c) => c.kind === 'fog').length, 0);
  const out = [
    `# Scorecard — ${s.week}`,
    '',
    `Window: \`${s.window.start}\` to \`${s.window.end}\` (launches bucketed by \`startedAt\`). Rendered from receipts only;`,
    `every missing value is **FOG**, never zero. ${fogCount} cell(s) are fog. Generated by \`mission-control/scripts/scorecard.ts\`.`,
    '',
    '## Sources',
    '',
    `- Receipt files: ${s.sources.receiptFiles.length === 0 ? '**none found**' : s.sources.receiptFiles.map((f) => `\`${f}\``).join(', ')}`,
    `- Founder minutes: ${s.sources.founderMinutes ? `\`${s.sources.founderMinutes}\`` : '**file absent**'}`,
    `- Provider registry: ${s.sources.registry ? `\`${s.sources.registry}\`` : '**file absent**'}`,
    '',
    '## Scorecard',
    '',
    '| Dimension | Measure | Reading |',
    '|---|---|---|',
    ...s.metrics.map((m) => `| ${m.dimension} | ${esc(m.measure)} | ${esc(cellMd(m.cell))} |`),
    '',
    '## Budget Ledger v0',
    '',
    '| Family | Models | Launches | Turns | Wall-clock | Window cap | Weekly cap |',
    '|---|---|---|---|---|---|---|',
    ...s.budgetLedger.map((f) => `| ${esc(f.family)} | ${f.models.join(', ')} | ${[f.launches, f.turns, f.wallClock, f.windowCap, f.weeklyCap].map((c) => esc(cellMd(c))).join(' | ')} |`),
    '',
    '## Unparsed lines',
    '',
    ...(s.unparsed.length === 0 ? ['None.'] : s.unparsed.map((u) => `- \`${u.file}:${u.line}\` — ${u.reason}`)),
    '',
  ];
  return out.join('\n');
}

// ---------- CLI ----------

function readIfExists(file: string, label: string): SourceText | null {
  try { return { file: label, text: fs.readFileSync(file, 'utf8') }; } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const repo = path.resolve(import.meta.dir, '..', '..');
  const week = opt('--week') ?? isoWeekOf(Date.now());
  const dir = path.resolve(opt('--missions-dir') ?? missionsDir());
  const minutesFile = path.resolve(opt('--minutes') ?? path.join(repo, 'build', 'founder-minutes.csv'));
  const registryFile = path.resolve(opt('--registry') ?? path.join(repo, 'build', 'providers', 'registry.yml'));
  const outFile = path.resolve(opt('--out') ?? path.join(repo, 'docs', '08-agents_work', 'scorecards', `${week}.md`));
  const rel = (f: string) => (f.startsWith(repo + path.sep) ? path.relative(repo, f) : f.replace(process.env.HOME ?? '\0', '~'));

  const receipts: SourceText[] = [];
  let entries: string[] = [];
  try { entries = fs.readdirSync(dir); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
  for (const id of entries.sort()) {
    const f = path.join(dir, id, 'launches.jsonl');
    const s = readIfExists(f, rel(f));
    if (s) receipts.push(s);
  }
  const card = buildScorecard({
    week, receipts,
    founderMinutes: readIfExists(minutesFile, rel(minutesFile)),
    registry: readIfExists(registryFile, rel(registryFile)),
  });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, renderMarkdown(card));
  const fogged = card.metrics.filter((m) => m.cell.kind === 'fog').length;
  console.log(`scorecard ${week}: ${receipts.length} receipt file(s), ${card.unparsed.length} unparsed line(s), ${fogged}/${card.metrics.length} metrics fog -> ${rel(outFile)}`);
}
