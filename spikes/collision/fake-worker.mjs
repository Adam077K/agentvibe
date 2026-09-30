// Canned worker for harness dry-runs: after a delay, writes the reference files for its task
// (phase "work") or the combined reference (any rework phase). Emits a line like a real worker.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const [task, phase, dir, delay] = process.argv.slice(2);
const here = path.dirname(fileURLToPath(import.meta.url));
await new Promise((r) => setTimeout(r, +delay));
fs.cpSync(path.join(here, "fake", phase === "work" ? task : "combined", "src"), path.join(dir, "src"), { recursive: true });
console.log(JSON.stringify({ type: "result", result: "DONE", total_cost_usd: 0 }));
