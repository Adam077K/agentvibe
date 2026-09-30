#!/usr/bin/env node
// pre-receive hook installed in the bare "origin" repo. This is the STORAGE-side fence:
// it does not trust the coordinator. A push to main is accepted only if
//   (1) it is exactly one (squashed) commit on top of the current main, and
//   (2) for every file#symbol resource the commit touches, the commit's `Lease-Tokens:` trailer
//       presents the token that fence.json records as CURRENT for that resource, issued to that holder.
// A stale holder (lease expired, re-granted with a higher token) is therefore rejected even if
// its own bookkeeping still believes it holds the lease.
import fs from "node:fs";
import path from "node:path";
import { sh, touchedResources } from "LIBPATH";

const gitDir = process.env.GIT_DIR ? path.resolve(process.env.GIT_DIR) : process.cwd();
const fence = JSON.parse(fs.readFileSync(path.join(gitDir, "fence.json"), "utf8"));
const input = fs.readFileSync(0, "utf8").trim().split("\n").filter(Boolean);
const log = (m) => fs.appendFileSync(path.join(gitDir, "fence.log"), `${new Date().toISOString()} ${m}\n`);

for (const line of input) {
  const [oldRev, newRev, ref] = line.split(" ");
  if (ref !== "refs/heads/main") continue;
  const n = sh("git", ["rev-list", "--count", `${oldRev}..${newRev}`], gitDir).trim();
  if (n !== "1") { console.error(`FENCE: landing must be one squashed commit, got ${n}`); log(`REJECT count=${n}`); process.exit(1); }
  const msg = sh("git", ["log", "-1", "--format=%B", newRev], gitDir);
  const holder = (msg.match(/^Lease-Holder: (\S+)/m) || [])[1];
  const toks = Object.fromEntries(((msg.match(/^Lease-Tokens: (.*)$/m) || [])[1] || "").split(";").filter(Boolean).map((kv) => { const i = kv.lastIndexOf("="); return [kv.slice(0, i), +kv.slice(i + 1)]; }));
  const touched = touchedResources(gitDir, oldRev, newRev);
  const bad = [];
  for (const r of touched) {
    const cur = fence[r];
    if (!cur) bad.push(`${r}: no lease ever issued`);
    else if (toks[r] === undefined) bad.push(`${r}: no token presented`);
    else if (toks[r] !== cur.token || cur.holder !== holder) bad.push(`${r}: presented ${toks[r]} by ${holder}, current ${cur.token} by ${cur.holder}`);
  }
  if (bad.length) { console.error(`FENCE: stale or missing lease\n  ${bad.join("\n  ")}`); log(`REJECT ${holder} ${bad.join(" | ")}`); process.exit(1); }
  log(`ACCEPT ${holder} ${newRev} ${touched.join(",")}`);
}
