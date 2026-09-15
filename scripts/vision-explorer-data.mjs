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
  if (total > TOTAL_LIMIT) { console.log("FAIL  total data size exceeds " + mb(TOTAL_LIMIT)); failed += 1; }
  for (const n of order) {
    const bytes = Buffer.byteLength(JSON.stringify(ctx[n])) + 1;
    if (bytes > FILE_LIMIT) { console.log("FAIL  " + n + ".json is " + mb(bytes) + ", over the " + mb(FILE_LIMIT) + " per-file limit"); failed += 1; }
  }
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

// ---- capabilities, stages, registers ---------------------------------------
P.capabilities = "planning/specification/capabilities.json";
P.capReq = "coverage/capability-requirements.json";
P.graph = "planning/implementation-graph.json";
P.decisions = "registers/decisions.json";
P.questions = "registers/open-questions.json";
P.risks = "registers/risks.json";
P.attacks = "research/attack-coverage.json";
P.ch08 = "planning/specification/08-improvement-implementation.md";

emitter("capabilities", () => {
  const cap = readJson(P.capabilities);
  const req = readJson(P.capReq);
  const reqById = new Map(req.capabilities.map((r) => [r.id, r]));
  const sqc = cap.source_question_contracts || [];
  const routes = cap.fulfillment_routes || {};
  return cap.capabilities.map((c, i) => {
    const contracts = sqc.filter((q) => (q.related_capabilities || []).includes(c.id));
    return {
      ...c,
      name: c.concern || null,
      outcome: c.required_outcome || null,
      route: (c.fulfillment_route_refs || []).map((r) => ({ id: r, definition: routes[r] === undefined ? null : routes[r] })),
      components: [c.owner_component].filter(Boolean),
      consequence_class: { classes: c.consequence_classes || [], declared_floor: c.declared_floor || null, declared_floor_source: c.declared_floor_source || null },
      acceptance: c.acceptance_contract || null,
      requirements_row: reqById.get(c.id) || null,
      source_question_contracts: contracts.map((q) => ({ question_id: q.question_id, source_field: q.source_field, question: q.question, answer: q.answer, answer_location: q.answer_location, status: q.status, uncertainty: q.uncertainty, implementation_status: q.implementation_status })),
      source_question_contracts_full: "source-question-contracts.json",
      questions: contracts.map((q) => q.question_id),
      source: P.capabilities + "#/capabilities/" + i
    };
  });
});

emitter("stages", () => {
  const g = readJson(P.graph);
  const names = new Map();
  const text = hasFile(P.ch08) ? readText(P.ch08) : "";
  for (const m of text.matchAll(/\[(B[0-9]{2}) ([^\]]+)\]/g)) names.set(m[1], m[2]);
  return g.stages.map((s, i) => ({
    id: s.id,
    name: names.get(s.id) || null,
    name_source: names.has(s.id) ? P.ch08 + "#7-complete-dependency-ordered-construction-graph" : null,
    depends_on: s.depends_on || [],
    builds: s.components_and_contracts || null,
    components: [...new Set((s.components_and_contracts || "").match(/C0[1-9]/g) || [])].map((c) => "S1-" + c),
    completion_evidence: s.required_completion_evidence || null,
    does_not_prove: s.risk_and_full_system_relationship || null,
    phase_g_judgment: null,
    status: s.status || null,
    completed_evidence: s.completed_evidence || [],
    source_doc: s.source || null,
    source: P.graph + "#/stages/" + i
  }));
});

emitter("decisions", () => {
  const d = readJson(P.decisions);
  return d.map((x, i) => ({ ...x, source: P.decisions + "#/" + i }));
});

emitter("questions", () => {
  const q = readJson(P.questions);
  return q.map((x, i) => ({ ...x, source: P.questions + "#/" + i }));
});

emitter("attacks", () => {
  const a = readJson(P.attacks);
  return {
    source: P.attacks,
    kind: a.kind || null,
    source_doc: a.source || null,
    architecture_selected: a.architecture_selected || null,
    review_subject_commit: a.review_subject_commit || null,
    review_subject_commit_note: a.review_subject_commit_note || null,
    join_contract: a.join_contract || null,
    limitations: a.limitations || [],
    dimensions: a.dimensions || [],
    additional_cases: a.additional_cases || null,
    repair_provenance: a.repair_provenance || [],
    items: (a.cases || []).map((c, i) => ({ ...c, source: P.attacks + "#/cases/" + i }))
  };
});

emitter("risks", (ctx) => {
  const r = readJson(P.risks);
  const byCase = new Map(ctx.attacks.items.map((c) => [c.id, c]));
  return r.risks.map((x, i) => ({
    ...x,
    attack_cases_joined: (x.attack_cases || []).map((id) => {
      const c = byCase.get(id);
      return { id, case: c ? c.case : null, status: c ? c.status : null };
    }),
    source: P.risks + "#/risks/" + i
  }));
});

Object.assign(EXPECT, {
  capabilities: 46,
  stages: 12,
  decisions: 22,
  questions: 22,
  risks: 17,
  attacks: 33
});

structural("every risk attack_case id resolves to an attack case", (ctx) => {
  const known = new Set(ctx.attacks.items.map((c) => c.id));
  const bad = [];
  for (const r of ctx.risks) for (const id of r.attack_cases || []) if (!known.has(id)) bad.push(r.id + " -> " + id);
  return bad;
});

structural("every capability owner_component is a declared component id", (ctx) => {
  const ids = new Set(Object.keys(readJson(P.capabilities).component_ids || {}));
  return ctx.capabilities.filter((c) => c.owner_component !== null).filter((c) => !ids.has(c.owner_component)).map((c) => c.id + " -> " + c.owner_component);
});

structural("every stage depends_on resolves to a stage", (ctx) => {
  const ids = new Set(ctx.stages.map((s) => s.id));
  const bad = [];
  for (const s of ctx.stages) for (const d of s.depends_on) if (!ids.has(d)) bad.push(s.id + " -> " + d);
  return bad;
});

// The full source-question contracts live once, here; capabilities carry a
// compact join plus the id list, because most contracts name many capabilities
// and inlining them whole multiplied the package by roughly four.
emitter("source-question-contracts", () => {
  const cap = readJson(P.capabilities);
  return (cap.source_question_contracts || []).map((q, i) => ({ ...q, source: P.capabilities + "#/source_question_contracts/" + i }));
});

Object.assign(MIN_EXPECT, { "source-question-contracts": 1 });

// ---- markdown toolkit ------------------------------------------------------
// Enough of CommonMark to split a chapter into sections, read its tables and
// render it as HTML. Written here rather than pulled in, because the package
// must project with no dependencies.

const stripInline = (s) => s
  .replace(/`([^`]*)`/g, "$1")
  .replace(/\*\*([^*]*)\*\*/g, "$1")
  .replace(/\*([^*]*)\*/g, "$1")
  .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

const slugify = (heading) => stripInline(heading)
  .toLowerCase()
  .replace(/[^a-z0-9 \-]/g, "")
  .trim()
  .replace(/ +/g, "-");

// Fenced code blocks are opaque: a heading or a pipe inside one is content.
const splitSections = (text) => {
  const lines = text.split(/\r?\n/);
  const out = [];
  let cur = { level: 0, heading: null, lines: [] };
  let fence = null;
  for (const line of lines) {
    const f = line.match(/^(```|~~~)/);
    if (f) { if (fence === null) fence = f[1]; else if (line.startsWith(fence)) fence = null; }
    const h = fence === null ? line.match(/^(#{1,6}) +(.*)$/) : null;
    if (h) { out.push(cur); cur = { level: h[1].length, heading: h[2].trim(), lines: [] }; continue; }
    cur.lines.push(line);
  }
  out.push(cur);
  return out.filter((s) => s.heading !== null || s.lines.join("").trim() !== "");
};

// Every GitHub-style pipe table in a block of lines.
const splitCells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const findTables = (lines) => {
  const tables = [];
  for (let i = 0; i < lines.length; i += 1) {
    const head = lines[i];
    const sep = lines[i + 1];
    if (head === undefined || sep === undefined) continue;
    if (head.trim().startsWith("|") !== true) continue;
    if (/^\|[\s:|-]+\|$/.test(sep.trim()) !== true) continue;
    const headers = splitCells(head);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith("|")) { rows.push(splitCells(lines[j])); j += 1; }
    tables.push({ headers, rows });
    i = j - 1;
  }
  return tables;
};

const sectionOf = (sections, predicate) => sections.find(predicate) || null;
const sectionText = (s) => (s === null ? null : s.lines.join(String.fromCharCode(10)).trim());

// ---- components and layers -------------------------------------------------
P.arch = "planning/02-architecture-selection.md";
P.compAuth = "planning/specification/components-authority.json";
P.ch05 = "planning/specification/05-work-agents-skills.md";
P.selection = "planning/F2/05-selection-record.md";
P.ch07 = "planning/specification/07-integrations-capacity.md";

const archSection3 = () => {
  const secs = splitSections(readText(P.arch));
  return sectionOf(secs, (s) => s.heading !== null && s.heading.startsWith("3."));
};

emitter("components", (ctx) => {
  const ids = readJson(P.capabilities).component_ids || {};
  const order = Object.keys(ids);
  const auth = readJson(P.compAuth);
  const authById = new Map((auth.components || []).map((c) => [c.id, c]));
  const sec = archSection3();
  const tables = sec === null ? [] : findTables(sec.lines);
  const compTable = tables.find((t) => t.headers[0] === "Component") || { rows: [] };
  // "Receives -> returns; prohibition" is one cell in 02 section 3; split it.
  const rows = compTable.rows.map((r) => {
    const owns = r[1] || null;
    const rest = r[2] || "";
    const arrow = rest.split(/→/);
    const receives = arrow.length > 1 ? arrow[0].trim() : null;
    const tail = arrow.length > 1 ? arrow.slice(1).join("→").trim() : rest.trim();
    const cut = tail.search(/;\s*(cannot|no |commands return)/i);
    return {
      label: stripInline(r[0] || ""),
      owns,
      receives,
      returns: cut >= 0 ? tail.slice(0, cut).trim() : tail,
      cannot: cut >= 0 ? tail.slice(cut + 1).trim() : null
    };
  });
  const recs = ctx.records;
  const cmds = ctx.commands;
  const preds = ctx.predicates;
  const caps = ctx.capabilities;
  const items = order.map((id, i) => {
    const a = authById.get(id) || {};
    const row = rows[i] || {};
    return {
      id,
      name: a.name || ids[id],
      short_name: ids[id],
      table_label: row.label === undefined ? null : row.label,
      owns: row.owns === undefined ? null : row.owns,
      receives: row.receives === undefined ? null : row.receives,
      returns: row.returns === undefined ? null : row.returns,
      cannot: row.cannot === undefined ? null : row.cannot,
      implementation_location: a.implementation_location || null,
      attributes: a.attributes || {},
      contract_refs: a.contract_refs || [],
      questions: (auth.questions || []).filter((q) => (q.owner_components || []).includes(id)).map((q) => q.id),
      records_owned: recs.filter((r) => r.owner_component === id).map((r) => r.id),
      commands: cmds.filter((c) => c.owner_component === id).map((c) => c.id),
      predicates_count: preds.filter((p) => p.owner_component === id).length,
      capabilities: caps.filter((c) => c.owner_component === id).map((c) => c.id),
      source: P.arch + "#3-selected-logical-and-responsibility-model",
      source_authority: P.compAuth + "#/components/" + i
    };
  });
  return {
    source: P.arch + "#3-selected-logical-and-responsibility-model",
    items,
    flows: componentFlows(),
    deployment_flows: deploymentFlows()
  };
});

// The labelled edges between components, read from the mermaid flowcharts in
// 08-improvement-implementation.md. Node ids that name a component are
// rewritten to its registry id; the rest stay as the chapter wrote them.
const mermaidBlock = (heading) => {
  const secs = splitSections(readText(P.ch08));
  const s = sectionOf(secs, (x) => x.heading === heading);
  if (s === null) return [];
  const out = [];
  let inside = false;
  for (const line of s.lines) {
    if (line.trim().startsWith("```")) { inside = inside !== true; continue; }
    if (inside) out.push(line);
  }
  return out;
};

const parseMermaid = (lines, sourceAnchor) => {
  const labels = new Map();
  for (const line of lines) {
    for (const m of line.matchAll(/([A-Za-z0-9_]+)[\[(]([^\])]+)[\])]/g)) labels.set(m[1], m[2].trim());
  }
  const nodeId = (n) => (/^C0[1-9]$/.test(n) ? "S1-" + n : n);
  const edges = [];
  const re = /^\s*([A-Za-z0-9_]+)(?:[\[(][^\])]*[\])])?\s*(<-->|-->)(?:\|([^|]*)\|)?\s*([A-Za-z0-9_]+)(?:[\[(][^\])]*[\])])?\s*$/;
  for (const line of lines) {
    const m = line.match(re);
    if (m === null) continue;
    edges.push({
      from: nodeId(m[1]),
      to: nodeId(m[4]),
      arrow: m[2],
      bidirectional: m[2] === "<-->",
      label: m[3] === undefined ? null : m[3].trim(),
      from_label: labels.get(m[1]) || null,
      to_label: labels.get(m[4]) || null,
      source: P.ch08 + sourceAnchor
    });
  }
  return edges;
};

const componentFlows = () => parseMermaid(mermaidBlock("Logical flow"), "#logical-flow");
const deploymentFlows = () => parseMermaid(mermaidBlock("Trust and fault placement"), "#trust-and-fault-placement");

// ---- layers ----------------------------------------------------------------
// L1-L5 as tabled in 02 section 3, each joined to the section of
// 05-work-agents-skills.md its governing rule cites, and to the five criteria
// judged in the F2 selection record.
emitter("layers", () => {
  const sec = archSection3();
  const lines = sec === null ? [] : sec.lines;
  const table = findTables(lines).find((t) => t.headers[0] === "Layer") || { rows: [] };
  const ch05 = splitSections(readText(P.ch05));
  const precedence = lines.find((l) => l.includes("Precedence is fixed and operative")) || null;
  const intro = lines.find((l) => l.includes("the five layers of")) || null;
  const selectionSecs = splitSections(readText(P.selection));
  const criteria = sectionOf(selectionSecs, (s) => s.heading !== null && s.heading.startsWith("2."));
  const items = table.rows.map((r, i) => {
    const name = stripInline(r[0] || "");
    const where = r[3] || "";
    const nums = [...where.matchAll(/`05` *§ ?([0-9]+)/g)].map((m) => m[1]);
    const cited = nums.map((n) => {
      const s = sectionOf(ch05, (x) => x.heading !== null && x.heading.startsWith(n + "."));
      return { section: n, heading: s === null ? null : s.heading, text: sectionText(s), source: P.ch05 };
    });
    return {
      id: "L" + (i + 1),
      name,
      decides: r[1] || null,
      governing_rule: r[2] || null,
      where_specified: where || null,
      rule_sections: cited,
      source: P.arch + "#3-selected-logical-and-responsibility-model"
    };
  });
  return {
    source: P.arch + "#3-selected-logical-and-responsibility-model",
    introduction: intro,
    precedence: precedence,
    selection_record_criteria: { heading: criteria === null ? null : criteria.heading, text: sectionText(criteria), source: P.selection },
    items
  };
});

// ---- adapters and execution profiles ---------------------------------------
const ch07Section = (prefix) => {
  const secs = splitSections(readText(P.ch07));
  return sectionOf(secs, (s) => s.heading !== null && s.heading.startsWith(prefix));
};

emitter("adapters", () => {
  const sec = ch07Section("3.");
  const table = sec === null ? { rows: [], headers: [] } : (findTables(sec.lines)[0] || { rows: [], headers: [] });
  return table.rows.map((r) => {
    const head = (r[0] || "").split("/");
    return {
      id: head[0].trim(),
      selected: (r[0] || "").trim(),
      implemented_target: head.slice(1).join("/").trim() || null,
      contract: r[1] || null,
      limit: r[2] || null,
      simpler_alternative: r[3] || null,
      columns: table.headers,
      source: P.ch07 + "#3-selected-fulfillment-adapters"
    };
  });
});

emitter("execution-profiles", () => {
  const sec = ch07Section("5.");
  const table = sec === null ? { rows: [], headers: [] } : (findTables(sec.lines)[0] || { rows: [], headers: [] });
  return table.rows.map((r) => ({
    id: (r[0] || "").trim(),
    launch_interface: r[1] || null,
    admission_and_boundary: r[2] || null,
    columns: table.headers,
    source: P.ch07 + "#5-native-subscription-execution"
  }));
});

Object.assign(EXPECT, { components: 9, layers: 5, adapters: 7 });
Object.assign(MIN_EXPECT, { "execution-profiles": 1 });

// ---- markdown to HTML ------------------------------------------------------
// A minimal renderer: headings, paragraphs, bold, italic, inline code, links
// with the href kept, bullet and numbered lists, tables, blockquotes and
// fenced code. Text is escaped and otherwise preserved exactly.
const esc = (s) => s
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const inlineHtml = (s) => s.split(/(`[^`]*`)/).map((p) => {
  if (p.length > 1 && p.startsWith("`") && p.endsWith("`")) return "<code>" + esc(p.slice(1, -1)) + "</code>";
  let t = esc(p);
  t = t.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (m, a, b) => "<img src=\"" + b + "\" alt=\"" + a + "\">");
  t = t.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (m, a, b) => "<a href=\"" + b + "\">" + a + "</a>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return t;
}).join("");

const listMark = (line) => {
  const b = line.match(/^(\s*)([-*+]) +(.*)$/);
  if (b !== null) return { indent: b[1].length, ordered: false, text: b[3] };
  const o = line.match(/^(\s*)([0-9]+)[.)] +(.*)$/);
  if (o !== null) return { indent: o[1].length, ordered: true, text: o[3] };
  return null;
};

const renderMarkdown = (lines) => {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i += 1; continue; }
    const fence = line.match(/^ {0,3}(```|~~~)(.*)$/);
    if (fence !== null) {
      const body = [];
      i += 1;
      while (i < lines.length && lines[i].trim().startsWith(fence[1]) !== true) { body.push(lines[i]); i += 1; }
      i += 1;
      const lang = fence[2].trim();
      const cls = lang === "" ? "" : " class=\"language-" + esc(lang) + "\"";
      out.push("<pre><code" + cls + ">" + esc(body.join(String.fromCharCode(10))) + "</code></pre>");
      continue;
    }
    if (/^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push("<hr>"); i += 1; continue; }
    if (line.trim().startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const headers = splitCells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(splitCells(lines[i])); i += 1; }
      const th = headers.map((h) => "<th>" + inlineHtml(h) + "</th>").join("");
      const tb = rows.map((r) => "<tr>" + r.map((c) => "<td>" + inlineHtml(c) + "</td>").join("") + "</tr>").join("");
      out.push("<table><thead><tr>" + th + "</tr></thead><tbody>" + tb + "</tbody></table>");
      continue;
    }
    if (/^ {0,3}> ?/.test(line)) {
      const body = [];
      while (i < lines.length && (/^ {0,3}> ?/.test(lines[i]) || (lines[i].trim() !== "" && body.length > 0 && listMark(lines[i]) === null && lines[i].startsWith(">") === false && false))) {
        body.push(lines[i].replace(/^ {0,3}> ?/, ""));
        i += 1;
      }
      out.push("<blockquote>" + renderMarkdown(body) + "</blockquote>");
      continue;
    }
    const mark = listMark(line);
    if (mark !== null) {
      const items = [];
      const ordered = mark.ordered;
      const baseIndent = mark.indent;
      while (i < lines.length) {
        const m = listMark(lines[i]);
        if (m === null) break;
        if (m.indent < baseIndent) break;
        if (m.indent > baseIndent) {
          const nested = [];
          while (i < lines.length) {
            const n = listMark(lines[i]);
            if (n === null || n.indent <= baseIndent) break;
            nested.push(lines[i]);
            i += 1;
          }
          if (items.length > 0) items[items.length - 1] += renderMarkdown(nested);
          continue;
        }
        items.push(inlineHtml(m.text));
        i += 1;
      }
      const tag = ordered ? "ol" : "ul";
      out.push("<" + tag + ">" + items.map((t) => "<li>" + t + "</li>").join("") + "</" + tag + ">");
      continue;
    }
    const head = line.match(/^(#{1,6}) +(.*)$/);
    if (head !== null) {
      const lvl = head[1].length;
      out.push("<h" + lvl + " id=\"" + slugify(head[2]) + "\">" + inlineHtml(head[2].trim()) + "</h" + lvl + ">");
      i += 1;
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() !== "" && listMark(lines[i]) === null && lines[i].trim().startsWith("|") === false && /^ {0,3}> ?/.test(lines[i]) === false && /^ {0,3}(```|~~~)/.test(lines[i]) === false && /^(#{1,6}) +/.test(lines[i]) === false) {
      para.push(lines[i].trim());
      i += 1;
    }
    if (para.length > 0) out.push("<p>" + inlineHtml(para.join(" ")) + "</p>");
    else i += 1;
  }
  return out.join("");
};

// ---- chapters --------------------------------------------------------------
const CHAPTER_PATHS = [
  "planning/00-executive-guide.md",
  "planning/01-understand.md",
  "planning/02-architecture-selection.md",
  "planning/PLANNING-REPORT.md",
  "planning/specification/01-contract-kernel.md",
  "planning/specification/02-authority-recovery.md",
  "planning/specification/03-company-capabilities.md",
  "planning/specification/04-human-operation.md",
  "planning/specification/05-work-agents-skills.md",
  "planning/specification/06-knowledge-evidence-evaluation.md",
  "planning/specification/07-integrations-capacity.md",
  "planning/specification/08-improvement-implementation.md",
  "planning/specification/09-company-human-traceability.md",
  "planning/specification/10-components-authority-traceability.md",
  "planning/specification/11-schemas-state-contracts.md",
  "planning/specification/12-scope-lifecycle-traceability.md",
  "planning/F2/00-acceptance-protocol.md",
  "planning/F2/04-attack-consolidation.md",
  "planning/F2/05-selection-record.md"
];

const chapterId = (p) => p
  .replace(/^planning\/specification\//, "spec/")
  .replace(/^planning\/F2\//, "f2/")
  .replace(/^planning\//, "")
  .replace(/\.md$/, "");

// One alternation over every record id, longest first, so Case does not shadow
// CasePool. Word boundaries keep prose words out.
let RECORD_RE = null;
const recordRegex = (ids) => {
  if (RECORD_RE !== null) return RECORD_RE;
  const sorted = [...ids].sort((a, b) => b.length - a.length);
  RECORD_RE = new RegExp("\\b(" + sorted.join("|") + ")\\b", "g");
  return RECORD_RE;
};

const mentionsIn = (text, recordIds) => {
  const uniq = (re) => [...new Set([...text.matchAll(re)].map((m) => m[0]))].sort();
  const recs = [...new Set([...text.matchAll(recordRegex(recordIds))].map((m) => m[1]))].sort();
  return {
    records: recs,
    capabilities: uniq(/CAP-[0-9]{2}/g),
    components: [...new Set([...text.matchAll(/\b(?:S1-)?(C0[1-9])\b/g)].map((m) => "S1-" + m[1]))].sort(),
    decisions: uniq(/AD-[0-9]{3}/g),
    questions: uniq(/Q-[0-9]{3}/g),
    risks: uniq(/RISK-[0-9]{2}/g),
    attacks: uniq(/\bAC[0-9]{2}\b/g),
    stages: uniq(/\bB[01][0-9]\b/g),
    adapters: uniq(/\bIC-[A-Z-]+\b/g)
  };
};

emitter("chapters", (ctx) => {
  const recordIds = ctx.records.map((r) => r.id);
  return CHAPTER_PATHS.filter(hasFile).map((p) => {
    const text = readText(p);
    const secs = splitSections(text);
    const title = (secs.find((s) => s.level === 1) || {}).heading || chapterId(p);
    const used = new Map();
    const sections = secs.map((s, i) => {
      const raw = s.lines.join(String.fromCharCode(10));
      const base = s.heading === null ? "preamble" : (slugify(s.heading) || "section");
      const n = (used.get(base) || 0) + 1;
      used.set(base, n);
      const id = n === 1 ? base : base + "-" + n;
      const body = s.heading === null ? raw : "";
      const head = s.heading === null ? "" : "<h" + s.level + " id=\"" + id + "\">" + inlineHtml(s.heading) + "</h" + s.level + ">";
      const full = s.heading === null ? raw : s.heading + String.fromCharCode(10) + raw;
      return {
        id,
        level: s.level,
        heading: s.heading,
        index: i,
        html: head + renderMarkdown(s.lines),
        text_length: full.length,
        mentions: mentionsIn(full, recordIds),
        source: p + (s.heading === null ? "" : "#" + slugify(s.heading))
      };
    });
    return {
      id: chapterId(p),
      title: stripInline(title),
      path: p,
      bytes: text.length,
      sections,
      source: p
    };
  });
});

Object.assign(MIN_EXPECT, { chapters: 18 });

structural("every chapter section id is unique within its chapter", (ctx) => {
  const bad = [];
  for (const ch of ctx.chapters) {
    const seen = new Set();
    for (const s of ch.sections) { if (seen.has(s.id)) bad.push(ch.id + " / " + s.id); seen.add(s.id); }
  }
  return bad;
});

// ---- reviews ---------------------------------------------------------------
// Every archived review under planning/reviews/ and planning/F2/reviews/.
// Each opens with a blockquote provenance line; the precis is the first prose
// paragraph after it, and the verdict line is the bold summary that follows.
const REVIEW_DIRS = ["planning/reviews", "planning/F2/reviews"];

emitter("reviews", () => {
  const out = [];
  for (const dir of REVIEW_DIRS) {
    if (hasFile(dir) !== true) continue;
    const names = fs.readdirSync(path.join(SRC, dir)).filter((n) => n.endsWith(".md")).sort();
    for (const n of names) {
      const rel = dir + "/" + n;
      const text = readText(rel);
      const lines = text.split(/\r?\n/);
      const provLines = [];
      let i = 0;
      while (i < lines.length && /^ {0,3}> ?/.test(lines[i])) { provLines.push(lines[i].replace(/^ {0,3}> ?/, "")); i += 1; }
      const provenance = provLines.join(" ").trim() || null;
      let precis = null;
      let verdictLine = null;
      const rest = lines.slice(i);
      for (const l of rest) {
        const t = l.trim();
        if (t === "" || t === "---" || t.startsWith("#")) continue;
        if (verdictLine === null && /^\*\*/.test(t)) { verdictLine = stripInline(t); continue; }
        precis = t;
        break;
      }
      if (precis === null) precis = verdictLine;
      const head = text.slice(0, 6000);
      const dateM = head.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
      const shaM = head.match(/subject[^`]{0,40}`([0-9a-f]{7,40})`/i);
      const titleM = text.match(/^# +(.*)$/m);
      const verdicts = [...new Set([...(verdictLine || "").matchAll(/\b(SUFFICIENT|INSUFFICIENT|PASS|FAIL|BLOCK|ACCEPT|REJECT)\b/g)].map((m) => m[1]))];
      const classCounts = {};
      for (const m of (verdictLine || "").matchAll(/\(([a-d])\)-class/g)) classCounts[m[1]] = (classCounts[m[1]] || 0) + 1;
      out.push({
        id: (dir === "planning/F2/reviews" ? "f2/" : "") + n.replace(/\.md$/, ""),
        title: titleM === null ? (verdictLine || n.replace(/\.md$/, "")) : stripInline(titleM[1]),
        date: dateM === null ? null : dateM[1],
        subject_sha: shaM === null ? null : shaM[1],
        provenance,
        precis,
        verdict_line: verdictLine,
        verdicts,
        class_mentions: classCounts,
        bytes: text.length,
        path: rel,
        source: rel
      });
    }
  }
  return out;
});

Object.assign(MIN_EXPECT, { reviews: 30 });

// ---- coverage --------------------------------------------------------------
P.covQuestions = "coverage/questions.json";
P.covSupplemental = "coverage/supplemental.json";
P.covDiscovered = "coverage/discovered.json";
P.covPackage = "coverage/package.json";
P.covStatusRule = "coverage/status-rule.json";

// answer_location is a repo path plus a JSON pointer. Follow it and read the
// field the row names, so the answer travels with the question.
const resolvePointer = (loc, field) => {
  if (typeof loc !== "string") return null;
  const hash = loc.indexOf("#");
  if (hash < 0) return null;
  const file = loc.slice(0, hash);
  const pointer = loc.slice(hash + 1);
  if (file.endsWith(".json") !== true) return null;
  if (pointer.startsWith("/") !== true) return null;
  if (hasFile(file) !== true) return null;
  let node = readJson(file);
  for (const rawSeg of pointer.split("/").slice(1)) {
    const seg = rawSeg.replace(/~1/g, "/").replace(/~0/g, "~");
    if (node === null || typeof node !== "object") return null;
    node = Array.isArray(node) ? node[Number(seg)] : node[seg];
    if (node === undefined) return null;
  }
  if (isObj(node) && typeof field === "string" && node[field] !== undefined) return node[field];
  if (typeof node === "string") return node;
  return null;
};

const coverageRow = (r, i, file) => ({
  ...r,
  answer: resolvePointer(r.answer_location, r.answer_field),
  source: file + "#/" + i
});

emitter("coverage", () => {
  const qs = readJson(P.covQuestions);
  const sup = readJson(P.covSupplemental);
  const disc = readJson(P.covDiscovered);
  const pkg = readJson(P.covPackage);
  return {
    source: "coverage/",
    items: qs.map((r, i) => ({
      ...coverageRow(r, i, P.covQuestions),
      field_id: r.field === undefined ? null : r.field,
      field_name: r.field_title || null
    })),
    supplemental: sup.map((r, i) => coverageRow(r, i, P.covSupplemental)),
    discovered: disc.map((r, i) => coverageRow(r, i, P.covDiscovered)),
    package: { ...pkg, items: (pkg.items || []).map((r, i) => ({ ...r, source: P.covPackage + "#/items/" + i })), source: P.covPackage },
    status_rule: hasFile(P.covStatusRule) ? readJson(P.covStatusRule) : null
  };
});

Object.assign(EXPECT, { coverage: 566 });

// ---- findings --------------------------------------------------------------
P.f206Index = "planning/reviews/F2-06-findings-index.json";
P.f2Step4Index = "planning/F2/reviews/findings-index.json";
P.reviewFindings = "registers/review-findings.json";
P.contradictions = "registers/contradictions.json";

emitter("findings", () => {
  const f206 = hasFile(P.f206Index) ? readJson(P.f206Index) : {};
  const step4 = hasFile(P.f2Step4Index) ? readJson(P.f2Step4Index) : {};
  const rf = hasFile(P.reviewFindings) ? readJson(P.reviewFindings) : [];
  const contra = hasFile(P.contradictions) ? readJson(P.contradictions) : [];
  const f206Items = Object.keys(f206).map((id) => ({ register: "F2-06", id, ...f206[id], source: P.f206Index + "#/" + id }));
  const step4Items = Object.keys(step4).map((id) => ({ register: "F2-step4", id, ...step4[id], source: P.f2Step4Index + "#/" + id }));
  const rfItems = rf.map((r, i) => ({ register: "review-findings", ...r, source: P.reviewFindings + "#/" + i }));
  const contraItems = contra.map((r, i) => ({ register: "contradictions", ...r, source: P.contradictions + "#/" + i }));
  return {
    source: "registers/ and planning/reviews/",
    f2_06_findings: f206Items,
    f2_step4_findings: step4Items,
    review_findings: rfItems,
    contradictions: contraItems,
    items: [...f206Items, ...step4Items, ...rfItems, ...contraItems]
  };
});

structural("the findings registers hold their stated row counts", (ctx) => {
  const f = ctx.findings;
  const bad = [];
  if (f.f2_06_findings.length !== 54) bad.push("F2-06 index: " + f.f2_06_findings.length + " not 54");
  if (f.review_findings.length < 1) bad.push("review-findings register is empty");
  if (f.contradictions.length < 1) bad.push("contradictions register is empty");
  return bad;
});

structural("every coverage row resolves its answer location", (ctx) => {
  return ctx.coverage.items
    .filter((r) => typeof r.answer_location === "string")
    .filter((r) => r.answer_location.includes(".json#"))
    .filter((r) => r.answer === null)
    .map((r) => r.id + " -> " + r.answer_location);
});

// Size budget: the whole projection must stay loadable, and no single file may
// grow past what a browser fetch should carry in one piece.
const TOTAL_LIMIT = 20 * 1048576;
const FILE_LIMIT = 8 * 1048576;
