// Arm A (naive): Claude and Codex launched concurrently on ONE checkout. No coordination at all.
// usage: node armA.mjs <run#>
import fs from "node:fs";
import path from "node:path";
import { RUNROOT, RESULTS, copyTemplate, git, launch, task, evaluate } from "./lib.mjs";

const run = process.argv[2] || "1";
const root = path.join(RUNROOT, `A${run}`);
fs.rmSync(root, { recursive: true, force: true });
const repo = path.join(root, "repo");
copyTemplate(repo);
git(repo, "init", "-q", "-b", "main");
git(repo, "add", "-A");
git(repo, "commit", "-qm", "seed");
const logDir = path.join(RESULTS, "logs", `A${run}`);

const t0 = Date.now();
const [d, t] = await Promise.all([
  launch({ arm: "A", run, taskName: "discount", phase: "work", worker: "claude", dir: repo, prompt: task("discount"), logDir }),
  launch({ arm: "A", run, taskName: "tax", phase: "work", worker: "codex", dir: repo, prompt: task("tax"), logDir }),
]);
const wall = (Date.now() - t0) / 1000;

git(repo, "add", "-A");
const stat = git(repo, "diff", "--cached", "--stat");
fs.writeFileSync(path.join(logDir, "final.diff"), git(repo, "diff", "--cached"));
const ev = evaluate(repo);
const out = {
  arm: "A", run, wall_s: +wall.toFixed(1),
  discount: { secs: d.secs, exit: d.exit, self: d.self_report, cost: d.cost_usd },
  tax: { secs: t.secs, exit: t.exit, self: t.self_report, in_tokens: t.in_tokens, out_tokens: t.out_tokens },
  eval: ev, stat,
};
fs.writeFileSync(path.join(logDir, "summary.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
