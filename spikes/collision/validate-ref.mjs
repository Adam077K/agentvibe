// Sanity check: acceptance suites against the reference implementations in fake/ (no workers).
import fs from "node:fs";
import path from "node:path";
import { HERE, RUNROOT, copyTemplate, evaluate } from "./lib.mjs";
for (const v of ["discount", "tax", "combined"]) {
  const d = path.join(RUNROOT, `val-${v}`);
  fs.rmSync(d, { recursive: true, force: true });
  copyTemplate(d);
  fs.cpSync(path.join(HERE, "fake", v, "src"), path.join(d, "src"), { recursive: true });
  console.log(v, JSON.stringify(evaluate(d)));
}
