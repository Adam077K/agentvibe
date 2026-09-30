// Arm B (coordinated): fenced file#symbol leases, one clone per worker, a merge queue that
// integrates current main + re-runs tests before landing, and a receipt per landed change.
// usage: node armB.mjs <run#> [--drill]
//   --drill: the discount worker's leases are NOT renewed (TTL 40s), simulating a hung/partitioned
//            holder. Its landing then pushes with the tokens it remembers, WITHOUT asking the lease
//            table — so only the storage-side fence (pre-receive hook) stands between it and main.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { RUNROOT, RESULTS, HERE, copyTemplate, git, gitTry, shTry, launch, task, evaluate, touchedResources } from "./lib.mjs";

const run = process.argv[2] || "1";
const DRILL = process.argv.includes("--drill");
const label = `B${run}${DRILL ? "-drill" : ""}${process.argv.includes("--greedy") ? "-greedy" : ""}`;
const root = path.join(RUNROOT, label);
fs.rmSync(root, { recursive: true, force: true });
const logDir = path.join(RESULTS, "logs", label);
fs.rmSync(logDir, { recursive: true, force: true });
fs.mkdirSync(logDir, { recursive: true });
const events = [];
const ev = (e) => { const x = { t: +((Date.now() - T0) / 1000).toFixed(1), ...e }; events.push(x); console.log(JSON.stringify(x)); fs.appendFileSync(path.join(logDir, "events.live.jsonl"), JSON.stringify(x) + "\n"); };
const T0 = Date.now();

// ---- origin (bare) with the storage-side fence ----------------------------
const seed = path.join(root, "seed"); copyTemplate(seed);
git(seed, "init", "-q", "-b", "main"); git(seed, "add", "-A"); git(seed, "commit", "-qm", "seed");
const origin = path.join(root, "origin.git");
git(root, "clone", "-q", "--bare", seed, origin);
const hook = fs.readFileSync(path.join(HERE, "fence-hook.mjs"), "utf8").replace("LIBPATH", pathToFileURL(path.join(HERE, "lib.mjs")).href);
fs.writeFileSync(path.join(origin, "hooks", "pre-receive"), hook, { mode: 0o755 });
const fenceFile = path.join(origin, "fence.json");
const fence = {}; // resource -> {token, holder}  (what STORAGE believes is current)
const writeFence = () => fs.writeFileSync(fenceFile, JSON.stringify(fence, null, 1));
writeFence();

// ---- lease manager ---------------------------------------------------------
const TTL = +(process.env.SP2_TTL_MS || (DRILL ? 40e3 : 60e3));
const leases = {};   // resource -> {holder, token, exp}
const pending = {};  // resource -> [holder...]
const renewing = new Set();
const grant = (r, h) => {
  const token = (fence[r]?.token || 0) + 1;
  leases[r] = { holder: h, token, exp: Date.now() + TTL };
  fence[r] = { token, holder: h }; writeFence();
  ev({ ev: "grant", r, h, token });
};
function acquire(h, rs) {
  for (const r of rs) {
    const l = leases[r];
    if (l && l.holder === h && l.exp > Date.now()) continue;
    if (!l || l.exp <= Date.now()) { if (l) ev({ ev: "expired", r, h: l.holder, token: l.token }); grant(r, h); }
    else if (!(pending[r] ||= []).includes(h)) { pending[r].push(h); ev({ ev: "blocked", r, h, heldBy: l.holder }); }
  }
}
function release(h) {
  for (const [r, l] of Object.entries(leases)) if (l.holder === h) { delete leases[r]; ev({ ev: "release", r, h }); promote(r); }
}
function promote(r) {
  const q = pending[r] || [];
  while (q.length) { const h = q.shift(); grant(r, h); return; }
}
// Land-time acquisition is ALL-OR-NOTHING. (The first dry run grabbed free resources one by one and
// deadlocked: each lander held an undeclared resource the other needed. See results doc.)
function acquireAll(h, rs) {
  const now = Date.now();
  const busy = rs.filter((r) => leases[r] && leases[r].holder !== h && leases[r].exp > now);
  if (!busy.length) return acquire(h, rs);
  for (const r of busy) if (!(pending[r] ||= []).includes(h)) { pending[r].push(h); ev({ ev: "blocked", r, h, heldBy: leases[r].holder }); }
}
const LAND_ACQ = process.argv.includes("--greedy") ? acquire : acquireAll; // --greedy reproduces the deadlock
const DEADLOCK_MS = +(process.env.SP2_DEADLOCK_MS || 12 * 60e3);
const holdsAll = (h, rs) => rs.every((r) => leases[r]?.holder === h && leases[r].exp > Date.now());
const tokensOf = (h, rs) => Object.fromEntries(rs.map((r) => [r, leases[r]?.holder === h ? leases[r].token : undefined]));
const ticker = setInterval(() => {
  for (const [r, l] of Object.entries(leases)) {
    if (renewing.has(l.holder)) l.exp = Date.now() + TTL;
    else if (l.exp <= Date.now()) { ev({ ev: "expired", r, h: l.holder, token: l.token }); delete leases[r]; promote(r); }
  }
}, 1000);

// ---- tasks -----------------------------------------------------------------
const common = ["src/types.ts#Cart", "src/types.ts#Totals", "src/types.ts#<eof>", "src/config.ts#config", "src/pricing.ts#computeTotal", "src/pricing.ts#<header>", "src/index.ts#*", "test/pricing.test.ts#*"];
const TASKS = [
  { name: "discount", worker: "claude", declared: [...common, "src/types.ts#+DiscountCode", "src/discounts.ts#*"] },
  { name: "tax", worker: "codex", declared: [...common, "src/types.ts#+Region", "src/tax.ts#*"] },
];

let queueLock = Promise.resolve();
const withQueue = (fn) => { const p = queueLock.then(fn); queueLock = p.catch(() => {}); return p; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runTask(t) {
  const h = t.name;
  const clone = path.join(root, `clone-${h}`);
  git(root, "clone", "-q", origin, clone);
  const st = { conflicts: 0, reworks: 0, fence_rejections: 0, test_rejections: 0, lease_wait_s: 0, undeclared: [], launches: [] };
  if (!(DRILL && h === "discount")) renewing.add(h);
  acquire(h, t.declared);
  const remembered = tokensOf(h, t.declared); // what a zombie would believe it holds
  const w = await launch({ arm: "B", run: label, taskName: h, phase: "work", worker: t.worker, dir: clone, prompt: task(h), logDir });
  st.launches.push(w);
  ev({ ev: "worker_done", h, secs: w.secs, self: w.self_report });
  git(clone, "add", "-A"); gitTry(clone, "commit", "-qm", `work(${h})`);
  let zombieTried = false;

  for (let attempt = 0; attempt < 6; attempt++) {
    git(clone, "fetch", "-q", "origin");
    const m = gitTry(clone, "merge", "--no-edit", "-q", "origin/main");
    if (!m.ok) {
      const files = git(clone, "diff", "--name-only", "--diff-filter=U").trim().split("\n");
      st.conflicts++; ev({ ev: "conflict", h, files });
      if (st.reworks >= 2) throw new Error(`${h}: rework cap`);
      st.reworks++;
      const r = await launch({ arm: "B", run: label, taskName: h, phase: `rework${st.reworks}`, worker: t.worker, dir: clone, logDir,
        prompt: `Another agent's change has just landed on main and was merged into this working copy. These files now contain git conflict markers: ${files.join(", ")}.\nYour own task was:\n---\n${task(h)}\n---\nResolve every conflict marker so that BOTH features are kept and compose per README's order of operations. Then run \`bun test\` until it passes. Do NOT run any git commands. Reply DONE or FAILED.` });
      st.launches.push(r);
      git(clone, "add", "-A"); git(clone, "commit", "-qm", `resolve(${h})`);
      continue;
    }
    const base = git(clone, "rev-parse", "origin/main").trim();
    git(clone, "reset", "-q", "--soft", base);
    git(clone, "commit", "-qm", `land(${h})`);
    const touched = touchedResources(clone, base, "HEAD");
    const undeclared = touched.filter((r) => !t.declared.includes(r));
    for (const u of undeclared) if (!st.undeclared.includes(u)) st.undeclared.push(u);

    let tokens;
    if (DRILL && h === "discount" && !zombieTried) {
      zombieTried = true; tokens = remembered; // stale holder: trusts its own memory, skips the lease table
      ev({ ev: "zombie_push", h, tokens });
    } else {
      LAND_ACQ(h, touched);
      const w0 = Date.now();
      while (!holdsAll(h, touched)) {
        renewing.add(h); await sleep(500); LAND_ACQ(h, touched);
        if (Date.now() - w0 > DEADLOCK_MS) { ev({ ev: "DEADLOCK", h, missing: touched.filter((r) => leases[r]?.holder !== h), holders: touched.map((r) => leases[r]?.holder) }); throw new Error(`${h}: lease wait > 12 min (deadlock)`); }
      }
      const waited = (Date.now() - w0) / 1000;
      if (waited > 0.6) { st.lease_wait_s += waited; ev({ ev: "lease_wait_done", h, waited }); }
      tokens = tokensOf(h, touched);
      // main may have moved while we waited: go round again if so
      git(clone, "fetch", "-q", "origin");
      if (git(clone, "rev-parse", "origin/main").trim() !== base) { git(clone, "reset", "-q", "--soft", "HEAD~1"); git(clone, "commit", "-qm", `work(${h})`); continue; }
    }

    const outcome = await withQueue(async () => {
      const tr = shTry("bun", ["test"], clone);
      if (!tr.ok) return { kind: "tests" };
      const trailer = `Lease-Holder: ${h}\nLease-Tokens: ${touched.map((r) => `${r}=${tokens[r]}`).join(";")}`;
      git(clone, "commit", "-q", "--amend", "-m", `land(${h}): ${t.worker}\n\n${trailer}`);
      const p = gitTry(clone, "push", "-q", "origin", "HEAD:main");
      if (p.ok) return { kind: "landed", sha: git(clone, "rev-parse", "HEAD").trim(), base, touched, tokens };
      return { kind: /FENCE/.test(p.out) ? "fence" : "push", out: p.out.slice(0, 400) };
    });
    if (outcome.kind === "landed") {
      const receipt = { task: h, worker: t.worker, run: label, base_sha: outcome.base, landed_sha: outcome.sha, resources: outcome.touched, tokens: outcome.tokens,
        declared_missed: undeclared, tests: "bun test pass (pre-push, on integrated tree)", conflicts: st.conflicts, reworks: st.reworks,
        fence_rejections: st.fence_rejections, lease_wait_s: +st.lease_wait_s.toFixed(1), worker_launches: st.launches.length,
        worker_cost_usd: st.launches.reduce((s, l) => s + (+l.cost_usd || 0), 0), landed_at_s: +((Date.now() - T0) / 1000).toFixed(1) };
      fs.appendFileSync(path.join(logDir, "receipts.jsonl"), JSON.stringify(receipt) + "\n");
      ev({ ev: "landed", h, sha: outcome.sha.slice(0, 8) });
      renewing.delete(h); release(h);
      return { ...st, landed: true };
    }
    ev({ ev: "reject", h, kind: outcome.kind, out: outcome.out });
    git(clone, "reset", "-q", "--soft", "HEAD~1"); git(clone, "commit", "-qm", `work(${h})`);
    if (outcome.kind === "fence") { st.fence_rejections++; continue; }
    if (outcome.kind === "tests") {
      st.test_rejections++;
      if (st.reworks >= 2) break;
      st.reworks++;
      const r = await launch({ arm: "B", run: label, taskName: h, phase: `rework${st.reworks}`, worker: t.worker, dir: clone, logDir,
        prompt: `Another agent's change was merged into this working copy and \`bun test\` now fails. Your task was:\n---\n${task(h)}\n---\nMake \`bun test\` pass keeping BOTH features per README. Do NOT run git commands. Reply DONE or FAILED.` });
      st.launches.push(r); git(clone, "add", "-A"); gitTry(clone, "commit", "-qm", `fix(${h})`);
    }
  }
  renewing.delete(h); release(h);
  return { ...st, landed: false };
}

const results = await Promise.all(TASKS.map((t) => runTask(t).catch((e) => ({ error: String(e), landed: false }))));
clearInterval(ticker);
const wall = (Date.now() - T0) / 1000;

// verify every landed main sha is green, then evaluate final main
const check = path.join(root, "check"); git(root, "clone", "-q", origin, check);
const shas = git(check, "rev-list", "--first-parent", "main").trim().split("\n");
const mainHealth = shas.map((s) => { git(check, "checkout", "-q", s); return { sha: s.slice(0, 8), green: shTry("bun", ["test", "./test"], check).ok }; });
git(check, "checkout", "-q", "main");
const evalRes = evaluate(check);
const summary = { arm: "B", run: label, wall_s: +wall.toFixed(1), tasks: Object.fromEntries(TASKS.map((t, i) => [t.name, { ...results[i], launches: undefined, worker_secs: results[i].launches?.map((l) => l.secs), cost: results[i].launches?.map((l) => l.cost_usd) }])),
  lease_blocks: events.filter((e) => e.ev === "blocked").length, main_health: mainHealth, eval: evalRes, fence_log: shTry("cat", [path.join(origin, "fence.log")], root).out };
fs.writeFileSync(path.join(logDir, "events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n") + "\n");
fs.writeFileSync(path.join(logDir, "summary.json"), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(logDir, "final.diff"), git(check, "diff", shas[shas.length - 1], "main"));
console.log(JSON.stringify(summary, null, 2));
