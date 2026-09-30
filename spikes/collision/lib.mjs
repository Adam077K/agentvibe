// SP2 collision spike — shared helpers: worker launch, evaluation, resource (symbol) extraction.
import { spawn, spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const RESULTS = path.join(HERE, "results");
export const RUNROOT = process.env.SP2_RUNROOT || path.join(process.env.TMPDIR || "/tmp", "sp2runs");
fs.mkdirSync(RESULTS, { recursive: true });

export const sh = (cmd, args, cwd, opts = {}) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
export const shTry = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", timeout: 180e3 });
  return { ok: r.status === 0, out: String(r.stdout || "") + String(r.stderr || "") };
};
export const git = (cwd, ...a) => sh("git", ["-c", "user.name=sp2", "-c", "user.email=sp2@local", ...a], cwd);
export const gitTry = (cwd, ...a) => shTry("git", ["-c", "user.name=sp2", "-c", "user.email=sp2@local", ...a], cwd);

export function copyTemplate(dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(path.join(HERE, "target-template"), dest, { recursive: true });
}

export const task = (name) => fs.readFileSync(path.join(HERE, "tasks", `${name}.md`), "utf8");

// ---- worker launch -------------------------------------------------------
const FAKE = !!process.env.SP2_FAKE; // dry-run the harness with canned edits instead of real workers
const CSV = path.join(RESULTS, FAKE ? "launches-fake.csv" : "launches.csv");
if (!fs.existsSync(CSV))
  fs.writeFileSync(CSV, "arm,run,task,phase,worker,model,started_at,secs,exit,cost_usd,in_tokens,out_tokens,self_report\n");

export function launch({ arm, run, taskName, phase, worker, dir, prompt, logDir, timeoutMs = 15 * 60e3 }) {
  fs.mkdirSync(logDir, { recursive: true });
  const tag = `${taskName}-${phase}-${worker}`;
  const logFile = path.join(logDir, `${tag}.jsonl`);
  const lastFile = path.join(logDir, `${tag}.last.txt`);
  let cmd, args;
  if (FAKE) {
    cmd = "node"; args = [path.join(HERE, "fake-worker.mjs"), taskName, phase, dir, worker === "claude" ? "20000" : "8000"];
  } else if (worker === "claude") {
    cmd = "claude";
    args = ["-p", prompt, "--model", "claude-sonnet-5", "--output-format", "stream-json", "--verbose",
      // Scoped permissions, not a bypass: edit files in its cwd and run the test command, nothing else.
      "--permission-mode", "acceptEdits", "--allowedTools", "Read,Edit,Write,Glob,Grep,Bash(bun test:*),Bash(bun test)"];
  } else {
    cmd = "codex";
    args = ["exec", "--skip-git-repo-check", "-s", "workspace-write", "-C", dir, "-o", lastFile, "--json", prompt];
  }
  const started = Date.now();
  return new Promise((resolve) => {
    const out = fs.createWriteStream(logFile);
    const p = spawn(cmd, args, { cwd: dir, stdio: ["ignore", "pipe", "pipe"], env: process.env });
    p.stdout.pipe(out, { end: false });
    p.stderr.on("data", (d) => out.write(JSON.stringify({ stderr: String(d) }) + "\n"));
    const timer = setTimeout(() => p.kill("SIGTERM"), timeoutMs);
    p.on("close", (code) => {
      clearTimeout(timer);
      out.end();
      const secs = (Date.now() - started) / 1000;
      const lines = fs.readFileSync(logFile, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } });
      let cost = "", inTok = 0, outTok = 0, report = "";
      if (worker === "claude") {
        const r = lines.filter((l) => l.type === "result").pop();
        if (r) { cost = r.total_cost_usd ?? ""; report = r.result || ""; inTok = (r.usage?.input_tokens || 0) + (r.usage?.cache_read_input_tokens || 0) + (r.usage?.cache_creation_input_tokens || 0); outTok = r.usage?.output_tokens || 0; }
      } else {
        for (const l of lines) if (l.type === "turn.completed" && l.usage) { inTok += l.usage.input_tokens || 0; outTok += l.usage.output_tokens || 0; }
        try { report = fs.readFileSync(lastFile, "utf8"); } catch {}
      }
      const self = /\bDONE\b/.test(report) ? "DONE" : /FAILED/.test(report) ? "FAILED" : "none";
      const row = { arm, run, task: taskName, phase, worker, model: worker === "claude" ? "claude-sonnet-5" : "gpt-6-astra(default)", started_at: new Date(started).toISOString(), secs: secs.toFixed(1), exit: code, cost_usd: cost, in_tokens: inTok, out_tokens: outTok, self_report: self };
      fs.appendFileSync(CSV, Object.values(row).join(",") + "\n");
      resolve({ ...row, report, logFile, started, ended: Date.now() });
    });
  });
}

// ---- evaluation ----------------------------------------------------------
// Runs the repo's own tests plus the three hidden acceptance suites in `dir`.
export function evaluate(dir) {
  const own = shTry("bun", ["test", "./test"], dir);
  const accDir = path.join(dir, "acceptance");
  fs.cpSync(path.join(HERE, "acceptance"), accDir, { recursive: true });
  const res = { own_tests_pass: own.ok, own_summary: summary(own.out) };
  for (const s of ["discount", "tax", "combined"]) {
    const r = shTry("bun", ["test", `./acceptance/${s}.accept.test.ts`], dir);
    res[`${s}_accept`] = r.ok;
    res[`${s}_summary`] = summary(r.out);
  }
  fs.rmSync(accDir, { recursive: true, force: true });
  return res;
}
const summary = (out) => {
  const p = out.match(/(\d+) pass/); const f = out.match(/(\d+) fail/); const e = out.match(/(\d+) error/);
  return `${p ? p[1] : 0}p/${f ? f[1] : 0}f${e ? "/" + e[1] + "e" : ""}`;
};

// ---- resources: file#symbol ---------------------------------------------
// Symbol-granular files; everything else is leased whole-file (#*).
export const SYMBOL_FILES = new Set(["src/types.ts", "src/config.ts", "src/pricing.ts", "src/cart.ts", "src/money.ts"]);
const DECL = /^(?:export\s+)?(?:async\s+)?(?:function|const|let|type|interface|class|enum)\s+([A-Za-z_$][\w$]*)/;

export function declRanges(text) {
  const lines = text.split("\n");
  const starts = [];
  lines.forEach((l, i) => { const m = l.match(DECL); if (m) starts.push({ name: m[1], start: i + 1 }); });
  return { n: lines.length, ranges: starts.map((s, k) => ({ ...s, end: k + 1 < starts.length ? starts[k + 1].start - 1 : lines.length })) };
}

// Resources touched by the diff base..head in repo `cwd`.
export function touchedResources(cwd, base, head) {
  const res = new Set();
  const ns = sh("git", ["diff", "--name-status", "--no-renames", base, head], cwd).trim().split("\n").filter(Boolean);
  for (const line of ns) {
    const [st, file] = line.split("\t");
    if (st !== "M" || !SYMBOL_FILES.has(file)) { res.add(`${file}#*`); continue; }
    const old = sh("git", ["show", `${base}:${file}`], cwd);
    const { n, ranges } = declRanges(old);
    const diff = sh("git", ["diff", "-U0", base, head, "--", file], cwd).split("\n");
    for (const d of diff) {
      const h = d.match(/^@@ -(\d+)(?:,(\d+))? \+\d+(?:,\d+)? @@/);
      if (h) {
        const s = +h[1], c = h[2] === undefined ? 1 : +h[2];
        if (c === 0) { // pure insertion after line s
          if (s >= n - 1) res.add(`${file}#<eof>`);
          else { const r = ranges.find((r) => s >= r.start && s <= r.end); res.add(r ? `${file}#${r.name}` : `${file}#<header>`); }
        } else {
          let hit = false;
          for (const r of ranges) if (r.start <= s + c - 1 && r.end >= s) { res.add(`${file}#${r.name}`); hit = true; }
          if (!hit) res.add(`${file}#<header>`);
        }
        continue;
      }
      if (d.startsWith("+") && !d.startsWith("+++")) { const m = d.slice(1).match(DECL); if (m) res.add(`${file}#+${m[1]}`); }
    }
  }
  return [...res].sort();
}
