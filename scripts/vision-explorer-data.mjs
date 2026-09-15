#!/usr/bin/env node
// vision-explorer-data.mjs
//
// Deterministic data projection of the planned system ("The Company Engine")
// described under docs/vision-system/. Reads the planning package, writes
// docs/vision-system/planning/site/explorer/data/*.json for the explorer page.
//
//   node scripts/vision-explorer-data.mjs build   -- re-derive and write
//   node scripts/vision-explorer-data.mjs check   -- re-derive, assert coverage, exit 1 on a miss
//   node scripts/vision-explorer-data.mjs stats   -- print file sizes and counts
//
// No dependencies. Node 20+. Nothing here invents a string: every value is
// copied from a package file, and every emitted object carries a "source".

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SRC = path.join(ROOT, "docs/vision-system");
const OUT = path.join(SRC, "planning/site/explorer/data");

const CACHE = new Map();
const readJson = (rel) => {
  if (CACHE.has(rel)) return CACHE.get(rel);
  const v = JSON.parse(fs.readFileSync(path.join(SRC, rel), "utf8"));
  CACHE.set(rel, v);
  return v;
};
const readText = (rel) => fs.readFileSync(path.join(SRC, rel), "utf8");
const hasFile = (rel) => fs.existsSync(path.join(SRC, rel));

// ---- source paths, relative to docs/vision-system/ -------------------------
const P = {
  records: "planning/specification/contracts/record-registry.json",
  predicates: "planning/specification/contracts/predicate-registry.json",
  commands: "planning/specification/contracts/command-registry.json",
  values: "planning/specification/contracts/value-registry.json",
  primitives: "planning/specification/contracts/primitive-registry.json",
  controls: "planning/specification/contracts/control-contracts.json",
  endpoints: "planning/specification/contracts/endpoints.json",
  bindings: "planning/specification/contracts/subject-bindings.json",
  classMap: "planning/specification/contracts/class-mapping-table.json",
  pins: "planning/specification/contracts/pinned-conjuncts.json",
  state: "state.json"
};

// ---- generic helpers -------------------------------------------------------
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Every string reachable from a JSON value, in document order.
const strings = (node, out) => {
  if (typeof node === "string") { out.push(node); return out; }
  if (Array.isArray(node)) { for (const x of node) strings(x, out); return out; }
  if (isObj(node)) { for (const k of Object.keys(node)) strings(node[k], out); }
  return out;
};

const truncate = (s, n) => (s.length > n ? s.slice(0, n) : s);

// A record field tree flattened to a list of leaf and group rows.
const flattenFields = (fields, prefix, acc) => {
  for (const key of Object.keys(fields || {})) {
    const v = fields[key];
    const p = prefix ? prefix + "/" + key : key;
    const row = {
      path: p,
      type: isObj(v) ? (v.type || null) : null,
      required: isObj(v) ? v.required === true : false,
      owner: isObj(v) ? (v.owner || null) : null,
      note: isObj(v) ? (v.note || null) : null,
      storage: isObj(v) ? (v.storage || null) : null,
      added_by: isObj(v) ? (v.added_by || null) : null,
      group: isObj(v) ? isObj(v.fields) : false
    };
    acc.push(row);
    if (row.group) flattenFields(v.fields, p, acc);
  }
  return acc;
};

// ---- emitter registry ------------------------------------------------------
// Each emitter returns the value written to data/<name>.json. Emitters run in
// declaration order and may read what earlier emitters produced through ctx.
const EMITTERS = [];
const emitter = (name, fn) => { EMITTERS.push({ name, fn }); };

const countOf = (data) => {
  if (Array.isArray(data)) return data.length;
  if (isObj(data) && Array.isArray(data.items)) return data.items.length;
  if (isObj(data)) return Object.keys(data).length;
  return 0;
};

const derive = () => {
  const ctx = {};
  const order = [];
  for (const e of EMITTERS) {
    ctx[e.name] = e.fn(ctx);
    order.push(e.name);
  }
  return { ctx, order };
};

// ---- predicate cross-reference --------------------------------------------
// Which record edges, commands, pinned-conjunct tables and other predicates
// name a given predicate id. Derived by scanning, never declared.
let USES = null;
const predicateUses = () => {
  if (USES) return USES;
  const preds = readJson(P.predicates);
  const ids = new Set(Object.keys(preds));
  const uses = new Map();
  const seen = new Set();
  const add = (pid, type, id) => {
    if (typeof pid !== "string") return;
    if (!ids.has(pid)) return;
    const k = pid + "|" + type + "|" + id;
    if (seen.has(k)) return;
    seen.add(k);
    if (!uses.has(pid)) uses.set(pid, []);
    uses.get(pid).push({ type, id });
  };
  const recs = readJson(P.records);
  for (const rid of Object.keys(recs)) {
    const tr = (recs[rid].lifecycle || {}).transitions || [];
    for (const t of tr) add(t.predicate_id, "record-edge", t.edge_id || rid + ":" + t.from + "->" + t.to);
    const reg = recs[rid].registration || {};
    add(reg.initial_guard_predicate_id, "record-registration", rid);
  }
  const cmds = readJson(P.commands);
  for (const cid of Object.keys(cmds)) add(cmds[cid].guard_predicate_id, "command", cid);
  const pins = readJson(P.pins);
  for (const k of Object.keys(pins)) for (const s of strings(pins[k], [])) add(s, "pin", k);
  for (const pid of Object.keys(preds)) {
    for (const s of strings(preds[pid].body, [])) if (s !== pid) add(s, "predicate", pid);
  }
  USES = uses;
  return uses;
};

// ---- records ---------------------------------------------------------------
emitter("records", () => {
  const recs = readJson(P.records);
  const preds = readJson(P.predicates);
  return Object.keys(recs).sort().map((id) => {
    const r = recs[id];
    const lc = r.lifecycle || {};
    const edges = (lc.transitions || []).map((t) => ({
      edge_id: t.edge_id || null,
      from: t.from || null,
      to: t.to || null,
      predicate: t.predicate_id || null,
      predicate_version: t.predicate_version || null,
      meaning: preds[t.predicate_id] ? preds[t.predicate_id].meaning : null,
      owner: t.owner_component || null,
      criterion_id: t.criterion_id || null,
      mutates: t.mutates || null,
      on_denial: t.on_denial || null,
      allowed_command_ids: t.allowed_command_ids || []
    }));
    return {
      id,
      kind: r.kind || null,
      representation: r.representation || null,
      schema_ref: r.schema_ref || null,
      owner_component: r.owner_component || null,
      owner_assignment: r.owner_assignment || null,
      identity: r.identity || null,
      source_of_truth: r.source_of_truth || null,
      fields: flattenFields(r.fields, "", []),
      lifecycle: {
        initial: lc.initial_phase || null,
        phases: lc.phases || [],
        intrinsic: lc.intrinsic === true,
        projection: lc.projection === true,
        state_preserving_update: lc.state_preserving_update || null,
        edges
      },
      registration: r.registration || null,
      relations: r.relations || [],
      output_lifecycle_links: r.output_lifecycle_links || {},
      invariants: r.invariants || [],
      authorization: r.authorization || null,
      retention: r.retention || null,
      deletion: r.deletion || null,
      audit: r.audit || null,
      versioning: r.versioning || null,
      source_contract: r.source_contract || null,
      planned_module: r.planned_module || null,
      removal_criterion: r.removal_criterion || null,
      implementation_status: r.implementation_status || null,
      why: r.justification || r.why || null,
      schema_version: r.schema_version || null,
      source: P.records + "#/" + id
    };
  });
});

// ---- predicates ------------------------------------------------------------
const BODY_LIMIT = 1200;
emitter("predicates", () => {
  const preds = readJson(P.predicates);
  const uses = predicateUses();
  return Object.keys(preds).sort().map((id) => {
    const p = preds[id];
    const body = JSON.stringify(p.body === undefined ? null : p.body);
    const compact = truncate(body, BODY_LIMIT);
    return {
      id,
      version: p.version || null,
      meaning: p.meaning || null,
      owner_component: p.owner_component || null,
      argument_types: p.argument_types || {},
      source_doc: p.source || null,
      failure: p.failure || null,
      implementation_status: p.implementation_status || null,
      body_compact: compact,
      body_bytes: body.length,
      truncated: compact.length < body.length,
      used_by: uses.get(id) || [],
      source: P.predicates + "#/" + id
    };
  });
});

// ---- commands --------------------------------------------------------------
emitter("commands", () => {
  const cmds = readJson(P.commands);
  const preds = readJson(P.predicates);
  return Object.keys(cmds).map((id) => {
    const c = cmds[id];
    return {
      id,
      owner_component: c.owner_component || null,
      payload: c.payload || {},
      target_types: c.target_types || [],
      read_only: c.read_only === true,
      source_guard: c.source_guard || null,
      schema_ref: c.schema_ref || null,
      guard_predicate_id: c.guard_predicate_id || null,
      guard_version: c.guard_version || null,
      guard_meaning: preds[c.guard_predicate_id] ? preds[c.guard_predicate_id].meaning : null,
      transaction_contract: c.transaction_contract || null,
      planned_module: c.planned_module || null,
      implementation_status: c.implementation_status || null,
      source_doc: c.source || null,
      source: P.commands + "#/" + id
    };
  });
});

// ---- values, primitives, control contracts, endpoints, subject bindings -----
emitter("values", () => {
  const vals = readJson(P.values);
  return Object.keys(vals).map((id) => ({ id, ...vals[id], source: P.values + "#/" + id }));
});

emitter("primitives", () => {
  const prims = readJson(P.primitives);
  return Object.keys(prims).map((id) => ({ id, ...prims[id], source: P.primitives + "#/" + id }));
});

emitter("control-contracts", () => {
  const cc = readJson(P.controls);
  return Object.keys(cc).map((id) => {
    const v = cc[id];
    const clauses = Array.isArray(v) ? v : [];
    const extra = Array.isArray(v) ? {} : v;
    return { id, clauses, ...extra, source: P.controls + "#/" + id };
  });
});

emitter("endpoints", () => {
  const eps = readJson(P.endpoints);
  return eps.map((e, i) => ({ id: e.method + " " + e.path, ...e, source: P.endpoints + "#/" + i }));
});

emitter("subject-bindings", () => {
  const sb = readJson(P.bindings);
  return Object.keys(sb).map((id) => ({ id, ...sb[id], source: P.bindings + "#/" + id }));
});

emitter("class-mapping", () => {
  const cm = readJson(P.classMap);
  if (Array.isArray(cm)) return cm.map((r, i) => ({ ...r, source: P.classMap + "#/" + i }));
  return Object.keys(cm).map((id) => ({ id, value: cm[id], source: P.classMap + "#/" + id }));
});

// ---- pinned conjuncts ------------------------------------------------------
// Every table in pinned-conjuncts.json, paired with its own <table>_why prose.
emitter("pins", () => {
  const pins = readJson(P.pins);
  const keys = Object.keys(pins).filter((k) => !k.endsWith("_why"));
  return {
    source: P.pins,
    schema_version: pins.schema_version === undefined ? null : pins.schema_version,
    kind: pins.kind || null,
    items: keys.map((k) => ({
      id: k,
      why: pins[k + "_why"] === undefined ? null : pins[k + "_why"],
      value: pins[k],
      source: P.pins + "#/" + k
    }))
  };
});

// ---- meta ------------------------------------------------------------------
const gitOut = (args) => {
  try { return execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8" }).trim(); }
  catch { return null; }
};

const buildMeta = (ctx, order, files) => {
  const st = readJson(P.state);
  return {
    head: gitOut(["rev-parse", "HEAD"]),
    head_short: gitOut(["rev-parse", "--short", "HEAD"]),
    generated: gitOut(["show", "-s", "--format=%cI", "HEAD"]),
    generator: "scripts/vision-explorer-data.mjs",
    package_root: "docs/vision-system",
    package: {
      project: st.project || null,
      directive_date: st.directive_date || null,
      phase: st.phase || null,
      status: st.status || null,
      architecture_version: st.architecture_version || null,
      planning_accepted: st.planning_accepted === true,
      implementation_started: st.implementation_started === true,
      founder_hold: st.founder_hold === undefined ? null : st.founder_hold,
      validator_last_full_run: st.validator_last_full_run === undefined ? null : st.validator_last_full_run,
      source: P.state
    },
    files: files.map((f) => ({ name: f.name, bytes: f.bytes, count: f.count })),
    counts: Object.fromEntries(order.map((n) => [n, countOf(ctx[n])])),
    total_bytes: files.reduce((a, f) => a + f.bytes, 0),
    source: P.state
  };
};

// ---- expected coverage -----------------------------------------------------
// A number here is a claim about the package, asserted by check mode.
const EXPECT = {
  records: 189,
  predicates: 2398,
  commands: 105,
  values: 186,
  primitives: 58,
  "control-contracts": 27,
  endpoints: 11,
  "subject-bindings": 65
};
const MIN_EXPECT = {};

// ---- structural assertions -------------------------------------------------
// Each returns a list of failure strings. An empty list is a pass.
const STRUCTURAL = [];
const structural = (name, fn) => { STRUCTURAL.push({ name, fn }); };

structural("every record edge predicate resolves", (ctx) => {
  const known = new Set(ctx.predicates.map((p) => p.id));
  const bad = [];
  for (const r of ctx.records) {
    for (const e of r.lifecycle.edges) {
      if (e.predicate === null) { bad.push(r.id + " edge " + e.from + "->" + e.to + " names no predicate"); continue; }
      if (!known.has(e.predicate)) bad.push(r.id + " edge " + e.edge_id + " -> " + e.predicate);
    }
  }
  return bad;
});

structural("every command guard predicate resolves", (ctx) => {
  const known = new Set(ctx.predicates.map((p) => p.id));
  return ctx.commands
    .filter((c) => c.guard_predicate_id !== null)
    .filter((c) => !known.has(c.guard_predicate_id))
    .map((c) => c.id + " -> " + c.guard_predicate_id);
});

structural("every record id is unique", (ctx) => {
  const seen = new Set();
  const bad = [];
  for (const r of ctx.records) { if (seen.has(r.id)) bad.push(r.id); seen.add(r.id); }
  return bad;
});

// ---- write -----------------------------------------------------------------
const writeOne = (name, data) => {
  const text = JSON.stringify(data) + String.fromCharCode(10);
  fs.writeFileSync(path.join(OUT, name + ".json"), text);
  return { name: name + ".json", bytes: Buffer.byteLength(text), count: countOf(data) };
};

const pad = (s, n) => String(s).padEnd(n);
const padl = (s, n) => String(s).padStart(n);
const mb = (n) => (n / 1048576).toFixed(2) + " MB";

// ---- commands --------------------------------------------------------------
const cmdBuild = () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { ctx, order } = derive();
  const files = order.map((n) => writeOne(n, ctx[n]));
  const meta = buildMeta(ctx, order, files);
  files.push(writeOne("meta", meta));
  const total = files.reduce((a, f) => a + f.bytes, 0);
  for (const f of files) console.log(pad(f.name, 26) + padl(f.bytes, 10) + padl(f.count, 8));
  console.log(pad("TOTAL", 26) + padl(total, 10) + "  " + mb(total));
  return 0;
};

const cmdStats = () => {
  if (!fs.existsSync(OUT)) { console.error("no data directory: " + OUT); return 1; }
  const names = fs.readdirSync(OUT).filter((n) => n.endsWith(".json")).sort();
  let total = 0;
  console.log(pad("file", 26) + padl("bytes", 10) + padl("count", 8));
  for (const n of names) {
    const p = path.join(OUT, n);
    const bytes = fs.statSync(p).size;
    total += bytes;
    let count = 0;
    try { count = countOf(JSON.parse(fs.readFileSync(p, "utf8"))); } catch { count = -1; }
    console.log(pad(n, 26) + padl(bytes, 10) + padl(count, 8));
  }
  console.log(pad("TOTAL", 26) + padl(total, 10) + "  " + mb(total));
  return 0;
};

const cmdCheck = () => {
  const { ctx, order } = derive();
  const rows = [];
  let failed = 0;
  for (const name of order) {
    const got = countOf(ctx[name]);
    const want = EXPECT[name];
    const min = MIN_EXPECT[name];
    let verdict = "-";
    if (want !== undefined) verdict = got === want ? "PASS" : "FAIL";
    else if (min !== undefined) verdict = got >= min ? "PASS" : "FAIL";
    if (verdict === "FAIL") failed += 1;
    rows.push([name, got, want === undefined ? (min === undefined ? "" : ">=" + min) : String(want), verdict]);
  }
  console.log(pad("file", 26) + padl("derived", 9) + padl("expected", 10) + "  verdict");
  for (const r of rows) console.log(pad(r[0], 26) + padl(r[1], 9) + padl(r[2], 10) + "  " + r[3]);
  console.log("");
  for (const s of STRUCTURAL) {
    const bad = s.fn(ctx);
    if (bad.length === 0) { console.log("PASS  " + s.name); continue; }
    failed += 1;
    console.log("FAIL  " + s.name + "  (" + bad.length + ")");
    for (const b of bad.slice(0, 10)) console.log("        " + b);
  }
  const total = order.reduce((a, n) => a + Buffer.byteLength(JSON.stringify(ctx[n])) + 1, 0);
  console.log("");
  console.log("total data size: " + total + " bytes (" + mb(total) + ")");
  if (total > 12 * 1048576) { console.log("FAIL  total data size exceeds 12 MB"); failed += 1; }
  console.log(failed === 0 ? "OK" : failed + " check(s) failed");
  return failed === 0 ? 0 : 1;
};

// The dispatch is deferred one microtask so that emitter sections declared
// below this point are registered before anything derives.
const main = () => {
  const mode = process.argv[2] || "build";
  if (mode === "build") return cmdBuild();
  if (mode === "check") return cmdCheck();
  if (mode === "stats") return cmdStats();
  console.error("usage: vision-explorer-data.mjs [build|check|stats]");
  return 2;
};
queueMicrotask(() => { process.exitCode = main(); });
