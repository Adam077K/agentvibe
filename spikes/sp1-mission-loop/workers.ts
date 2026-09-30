// Worker dispatch for SP1: real Claude Code and Codex headless runs, every launch logged.
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Family = "claude" | "codex";
export interface RunResult {
  family: Family;
  role: string;
  text: string;
  costUsd: number | null;
  tokens: number | null;
  seconds: number;
  exit: number;
}

export const OUT = process.env.SP1_OUT ?? join(import.meta.dir, "runs");
const WORK = join(OUT, "work"); // neutral cwd: keeps project CLAUDE.md / hooks out of the worker
mkdirSync(WORK, { recursive: true });
const CSV = join(OUT, "launches.csv");
if (!existsSync(CSV)) writeFileSync(CSV, "n,ts,role,family,model,seconds,cost_usd,tokens,exit\n");

let launches = Number(process.env.SP1_LAUNCH_OFFSET ?? 0);
export const SEARCH_ONLY_NOTE = process.env.SP1_CLAUDE_ONLY
  ? "\nTOOLING NOTE: you have WebSearch only (no page fetch). A source counts only if it appeared in your search results; the quote must be text shown in those results for that URL."
  : "";
export const launchCount = () => launches;
export const LAUNCH_CAP = 40;

function run(cmd: string, args: string[], timeoutMs: number): Promise<{ out: string; err: string; code: number }> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: WORK, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    const t = setTimeout(() => p.kill("SIGTERM"), timeoutMs);
    p.on("close", (code) => { clearTimeout(t); resolve({ out, err, code: code ?? 124 }); });
  });
}

export async function dispatch(family: Family, role: string, prompt: string, opts: { web: boolean; tag: string; timeoutMs?: number }): Promise<RunResult> {
  if (launches >= LAUNCH_CAP) throw new Error("LAUNCH_CAP reached");
  launches++;
  const n = launches;
  const t0 = Date.now();
  const timeout = opts.timeoutMs ?? 15 * 60_000;
  writeFileSync(join(OUT, `${n}-${opts.tag}.prompt.md`), prompt);
  let text = "", cost: number | null = null, tokens: number | null = null, code = 0, model = "";
  // SP1_CLAUDE_ONLY: Codex is unreachable from the sandbox (its auth lives under ~/.codex, which is denyRead,
  // and the unsandboxed launch was refused). Family "codex" is then played by Claude Opus 5; web = WebSearch only
  // (WebFetch is client-side and the sandbox cannot allow arbitrary hosts).
  const claudeOnly = !!process.env.SP1_CLAUDE_ONLY;
  if (family === "claude" || claudeOnly) {
    model = family === "claude" ? "claude-sonnet-5" : "claude-opus-5";
    const args = ["-p", prompt, "--model", model, "--output-format", "json", "--no-session-persistence", "--setting-sources", "user", "--strict-mcp-config"];
    if (opts.web && claudeOnly) args.push("--allowedTools", "WebSearch", "--disallowedTools", "WebFetch", "Bash", "Edit", "Write");
    else if (opts.web) args.push("--allowedTools", "WebSearch", "WebFetch");
    else args.push("--disallowedTools", "Bash", "Edit", "Write", "WebSearch", "WebFetch");
    const r = await run("claude", args, timeout);
    code = r.code;
    try {
      const j = JSON.parse(r.out);
      text = j.result ?? "";
      cost = j.total_cost_usd ?? null;
      const u = j.usage ?? {};
      tokens = (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
    } catch { text = r.out + "\nSTDERR:" + r.err.slice(-2000); }
  } else {
    model = "gpt-6-astra";
    const last = join(OUT, `${n}-${opts.tag}.last.txt`);
    const args = [...(opts.web ? ["--search"] : []), "exec", "--skip-git-repo-check", "-s", "read-only", "-C", WORK, "--json", "-o", last, prompt];
    const r = await run("codex", args, timeout);
    code = r.code;
    text = existsSync(last) ? readFileSync(last, "utf8") : r.out.slice(-4000) + "\nSTDERR:" + r.err.slice(-2000);
    for (const line of r.out.split("\n")) {
      try { const e = JSON.parse(line); const u = e.usage ?? e.info?.total_token_usage; if (u) tokens = (u.input_tokens ?? 0) + (u.output_tokens ?? 0); } catch {}
    }
  }
  const seconds = Math.round((Date.now() - t0) / 1000);
  writeFileSync(join(OUT, `${n}-${opts.tag}.out.md`), text);
  appendFileSync(CSV, `${n},${new Date().toISOString()},${role},${family},${model},${seconds},${cost ?? ""},${tokens ?? ""},${code}\n`);
  return { family, role, text, costUsd: cost, tokens, seconds, exit: code };
}

/** Last fenced ```json block, or the last {...} object in the text. */
export function lastJson<T = any>(text: string): T | null {
  const fences = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  const cands = fences.length ? [fences[fences.length - 1][1]] : [];
  const i = text.lastIndexOf("\n{"), j = text.lastIndexOf("}");
  if (i >= 0 && j > i) cands.push(text.slice(i, j + 1));
  if (text.trim().startsWith("{")) cands.push(text.trim());
  for (const c of cands) { try { return JSON.parse(c); } catch {} }
  return null;
}
