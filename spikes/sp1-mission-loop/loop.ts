// SP1 — a mission choosing its own next steps on an open goal. No playbook.
// Steward (Claude, no tools) keeps the uncertainty map and picks the next step;
// a worker (Claude or Codex, web-capable) acts; the OTHER family referees the step's claims.
import { writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { dispatch, lastJson, launchCount, OUT, type Family } from "./workers";

const GOAL = process.env.SP1_GOAL ??
  "Find a real, underserved B2B niche where a one-person AI-run agency could sign its first paying client within 30 days; produce the evidence and a first offer.";
const MAX_ITER = 12;
const RESERVE = 3; // compose + control + judge
const COST_CAP = 20;

interface Question { id: string; text: string; voi: number; confidence: number; status: "open" | "answered" | "dropped"; note?: string }
interface Evidence { id: string; iter: number; question_id: string; claim: string; source_url: string; quote: string; worker: Family; verdict?: string; referee_note?: string }
interface State {
  intent: string; success_test: string; kill_test: string;
  questions: Question[]; evidence: Evidence[]; artifacts: { iter: number; kind: string; body: string }[];
  history: { iter: number; question_id: string; action: string; worker: Family; referee: Family; why: string; conf_before: number; conf_after: number; supported: number; unsupported: number; unverifiable: number; steward_decision: string; steward_reason: string }[];
  budget: { launches: number; claude_usd: number; seconds: number };
}

const state: State = {
  intent: GOAL, success_test: "", kill_test: "",
  questions: [], evidence: [], artifacts: [], history: [],
  budget: { launches: 0, claude_usd: 0, seconds: 0 },
};
const t0 = Date.now();
const log = (s: string) => { console.log(s); appendFileSync(join(OUT, "loop.log"), s + "\n"); };
const save = () => { state.budget.launches = launchCount(); state.budget.seconds = Math.round((Date.now() - t0) / 1000); writeFileSync(join(OUT, "state.json"), JSON.stringify(state, null, 2)); };
const acct = (r: { costUsd: number | null }) => { state.budget.claude_usd += r.costUsd ?? 0; };

function view(): string {
  const ev = state.evidence.map((e) => `- [${e.id}] (${e.question_id}, referee:${e.verdict ?? "n/a"}) ${e.claim} <${e.source_url}>${e.referee_note ? ` — referee: ${e.referee_note}` : ""}`).join("\n");
  const arts = state.artifacts.map((a) => `### artifact iter ${a.iter} (${a.kind})\n${a.body.slice(0, 2500)}`).join("\n");
  const hist = state.history.map((h) => `- iter ${h.iter}: ${h.question_id} via ${h.worker} (refereed by ${h.referee}) — ${h.action.slice(0, 160)} → supported ${h.supported}/unsupported ${h.unsupported}/unverifiable ${h.unverifiable}`).join("\n");
  return `INTENT: ${state.intent}\nSUCCESS TEST: ${state.success_test}\nKILL TEST: ${state.kill_test}\n\nUNCERTAINTY MAP:\n${JSON.stringify(state.questions, null, 1)}\n\nEVIDENCE LOG (only referee:supported may raise confidence):\n${ev || "(none)"}\n\nARTIFACTS:\n${arts || "(none)"}\n\nHISTORY:\n${hist || "(none)"}\n\nBUDGET: iteration ${state.history.length}/${MAX_ITER}, worker launches used ${launchCount()}/40, Claude cost $${state.budget.claude_usd.toFixed(2)}`;
}

const STEWARD_RULES = `You are the Mission Steward. There is NO playbook: you decide the next step from the state alone.
Rules:
- Keep an uncertainty map: the open questions whose answers most change what we do next. Rank by value-of-information (voi 0-10 = how much the answer could change the decision x how uncertain we are). Confidence 0-1.
- Only evidence the Referee marked "supported" may raise a question's confidence. "unsupported"/"unverifiable" evidence must NOT raise it; if a key claim failed refereeing, say what that means.
- Every step must target exactly ONE named question on the map. No sideways work.
- You may pivot (drop questions / replace the candidate niche) or kill (the intent is infeasible) if evidence warrants — say why.
- Stop with "stop_success" only when the SUCCESS TEST is met by supported evidence. Stop with "stop_budget" if remaining budget cannot plausibly move the decision.
- Choose the worker family for the next step: "claude" (Claude Code + WebSearch/WebFetch) or "codex" (Codex CLI + live web search). The Referee will be the other family. Do not pick the same family 3 times in a row. Give a one-line reason.
- An action can be research (find/verify facts) or production (e.g. draft the first offer from supported evidence).`;

async function steward(first: boolean, lastStep: string): Promise<any> {
  const prompt = first
    ? `${STEWARD_RULES}\n\nThis is iteration 0. Given only the intent below, write:\n- success_test: a concrete, checkable test for when the mission is done (what evidence + what artifact)\n- kill_test: what evidence would make us kill or pivot\n- questions: 5-8 initial questions ranked by voi (ids q1..qN)\n- next: the first step\n\nINTENT: ${GOAL}\n\nReturn ONLY a json block:\n\`\`\`json\n{"success_test":"...","kill_test":"...","questions":[{"id":"q1","text":"...","voi":9,"confidence":0.1,"status":"open"}],"decision":"continue","reason":"...","next":{"question_id":"q1","action":"precise instruction to the worker","worker":"claude|codex","worker_reason":"...","why_this_question":"..."}}\n\`\`\``
    : `${STEWARD_RULES}\n\nCURRENT STATE:\n${view()}\n\nLAST STEP (worker output + referee verdicts):\n${lastStep}\n\nUpdate the map (full list; you may add/drop/re-rank questions, set confidence using only supported evidence), decide, and pick the next step.\nReturn ONLY a json block:\n\`\`\`json\n{"questions":[...],"decision":"continue|pivot|kill|stop_success|stop_budget","reason":"...","next":{"question_id":"...","action":"...","worker":"claude|codex","worker_reason":"...","why_this_question":"..."}}\n\`\`\``;
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await dispatch("claude", "steward", prompt, { web: false, tag: `steward-i${state.history.length}`, timeoutMs: 6 * 60_000 });
    acct(r);
    const j = lastJson(r.text);
    if (j) return j;
    log(`steward returned unparseable output (attempt ${attempt})`);
  }
  throw new Error("steward failed twice");
}

function workerPrompt(q: Question, action: string): string {
  return `You are a research worker on a mission. Mission intent: ${GOAL}\n\nYou are assigned ONE question. Stay on it.\nQUESTION ${q.id}: ${q.text}\nACTION: ${action}\n\nContext (supported evidence so far):\n${state.evidence.filter((e) => e.verdict === "supported").map((e) => `- ${e.claim} <${e.source_url}>`).join("\n") || "(none)"}\n${state.artifacts.length ? "Latest artifact:\n" + state.artifacts[state.artifacts.length - 1].body.slice(0, 2000) : ""}\n\nUse the live web. Every factual claim MUST carry a real source URL you actually opened and a SHORT VERBATIM quote from that page that supports it. Mark claims that are your own reasoning as type "inference" (they need no URL). Do not invent sources. 3-8 claims is plenty.\nIf the ACTION asks you to produce an artifact (e.g. an offer), put it in "artifact".\n\nEnd with ONLY this json block:\n\`\`\`json\n{"question_id":"${q.id}","answer_summary":"2-4 sentences","claims":[{"claim":"...","type":"fact|inference","source_url":"https://...","quote":"verbatim"}],"artifact":null,"confidence_after":0.0,"new_questions":["..."]}\n\`\`\``;
}

function refereePrompt(workerJson: any, workerFam: Family): string {
  return `You are the Referee. A ${workerFam === "claude" ? "Claude" : "Codex"} worker (a different model family from you) produced the claims below. Your job is acceptance, not agreement.\nFor EACH claim of type "fact": open the source_url yourself and check (a) the page exists, (b) the quote (or a near-verbatim equivalent) appears, (c) the quote actually supports the claim as stated (no inflated numbers, wrong dates, wrong entity, overgeneralisation).\nVerdict per claim: "supported" | "unsupported" (quote absent, or does not support the claim) | "unverifiable" (page unreachable/paywalled after a real attempt). For "inference" claims judge only whether they follow from the supported facts: "supported" or "unsupported".\nAlso judge the answer_summary: does it claim more than the supported claims show?\n\nWORKER OUTPUT:\n${JSON.stringify(workerJson, null, 1)}\n\nEnd with ONLY this json block:\n\`\`\`json\n{"verdicts":[{"i":0,"verdict":"supported|unsupported|unverifiable","note":"what you checked / what was wrong"}],"summary_overreach":"none | description"}\n\`\`\``;
}

async function main() {
  log(`SP1 start ${new Date().toISOString()} goal=${GOAL}`);
  let s = await steward(true, "");
  state.success_test = s.success_test; state.kill_test = s.kill_test; state.questions = s.questions;
  save();
  let lastFam: Family[] = [];
  let stopReason = "";
  for (let iter = 1; iter <= MAX_ITER; iter++) {
    if (launchCount() + 3 + RESERVE > 40) { stopReason = "hard: launch cap"; break; }
    if (state.budget.claude_usd > COST_CAP) { stopReason = "hard: cost cap"; break; }
    const next = s.next;
    let q = state.questions.find((x) => x.id === next?.question_id);
    if (!q) { log(`iter ${iter}: steward named unknown question ${next?.question_id} — SIDEWAYS`); q = { id: next?.question_id ?? "?", text: next?.action ?? "", voi: 0, confidence: 0, status: "open" }; }
    let fam: Family = next.worker === "codex" ? "codex" : "claude";
    const forced = lastFam.length >= 2 && lastFam.slice(-2).every((f) => f === fam);
    if (forced) fam = fam === "claude" ? "codex" : "claude";
    const ref: Family = fam === "claude" ? "codex" : "claude";
    const confBefore = q.confidence;
    log(`iter ${iter}: ${q.id} (voi ${q.voi}, conf ${q.confidence}) worker=${fam}${forced ? " (forced alternation)" : ""} — ${next.action}`);

    const w = await dispatch(fam, "worker", workerPrompt(q, next.action), { web: true, tag: `worker-i${iter}-${fam}` });
    acct(w);
    const wj = lastJson(w.text) ?? { question_id: q.id, answer_summary: w.text.slice(0, 1500), claims: [], parse_error: true };
    const claims: any[] = Array.isArray(wj.claims) ? wj.claims : [];
    log(`  worker ${w.seconds}s exit ${w.exit} claims=${claims.length} q_id_returned=${wj.question_id}`);

    const r = await dispatch(ref, "referee", refereePrompt(wj, fam), { web: true, tag: `referee-i${iter}-${ref}` });
    acct(r);
    const rj = lastJson(r.text) ?? { verdicts: [], summary_overreach: "referee output unparseable" };
    const verdicts: any[] = Array.isArray(rj.verdicts) ? rj.verdicts : [];
    let sup = 0, uns = 0, unv = 0;
    claims.forEach((c, i) => {
      const v = verdicts.find((x) => Number(x.i) === i) ?? verdicts[i];
      const verdict = String(v?.verdict ?? "no-verdict");
      if (verdict === "supported") sup++; else if (verdict === "unsupported") uns++; else unv++;
      state.evidence.push({ id: `e${state.evidence.length + 1}`, iter, question_id: q!.id, claim: `${c.type === "inference" ? "[inference] " : ""}${c.claim}`, source_url: c.source_url ?? "", quote: c.quote ?? "", worker: fam, verdict, referee_note: v?.note });
    });
    if (wj.artifact) state.artifacts.push({ iter, kind: typeof wj.artifact === "string" ? "offer" : "artifact", body: typeof wj.artifact === "string" ? wj.artifact : JSON.stringify(wj.artifact, null, 1) });
    log(`  referee(${ref}) ${r.seconds}s: supported ${sup} unsupported ${uns} unverifiable ${unv}; overreach: ${String(rj.summary_overreach).slice(0, 200)}`);

    const lastStep = `Worker (${fam}) summary: ${wj.answer_summary}\nWorker claimed confidence_after: ${wj.confidence_after}\nNew questions suggested: ${JSON.stringify(wj.new_questions ?? [])}\nReferee (${ref}) overreach: ${rj.summary_overreach}\nPer-claim verdicts are in the evidence log for iter ${iter}.${wj.artifact ? "\nAn artifact was produced (see ARTIFACTS)." : ""}`;
    s = await steward(false, lastStep);
    if (Array.isArray(s.questions) && s.questions.length) state.questions = s.questions;
    const qAfter = state.questions.find((x) => x.id === q!.id);
    state.history.push({ iter, question_id: q.id, action: next.action, worker: fam, referee: ref, why: next.why_this_question ?? "", conf_before: confBefore, conf_after: qAfter?.confidence ?? -1, supported: sup, unsupported: uns, unverifiable: unv, steward_decision: s.decision, steward_reason: s.reason });
    lastFam.push(fam);
    save();
    log(`  steward: ${s.decision} — ${String(s.reason).slice(0, 300)}; ${q.id} conf ${confBefore} → ${qAfter?.confidence}`);
    if (s.decision === "kill" || String(s.decision).startsWith("stop")) { stopReason = `steward: ${s.decision} — ${s.reason}`; break; }
    if (iter === MAX_ITER) stopReason = "hard: iteration cap";
  }
  log(`STOP: ${stopReason}`);

  // Compose the deliverable from refereed state only.
  const supported = state.evidence.filter((e) => e.verdict === "supported");
  const c = await dispatch("claude", "compose", `Write the final mission deliverable for this intent: ${GOAL}\n\nUse ONLY the referee-supported evidence below (cite each by its URL inline). Where the evidence is thin, say so plainly. Structure: 1) the niche and why it is underserved, 2) evidence (buyer pain, reachability, willingness-to-pay/price anchors, competitive gap), 3) the first offer (scope, price, deliverables, 30-day path to a signed client), 4) open risks. 600-1200 words. Markdown.\n\nSUPPORTED EVIDENCE:\n${supported.map((e) => `- ${e.claim} <${e.source_url}> "${e.quote}"`).join("\n")}\n\nLATEST ARTIFACT:\n${state.artifacts.at(-1)?.body ?? "(none)"}\n\nFINAL UNCERTAINTY MAP:\n${JSON.stringify(state.questions, null, 1)}\n\nStop reason: ${stopReason}`, { web: false, tag: "compose" });
  acct(c);
  writeFileSync(join(OUT, "loop-deliverable.md"), c.text);
  (state as any).stopReason = stopReason;
  save();
  log(`DONE loop. launches=${launchCount()} claude_usd=${state.budget.claude_usd.toFixed(2)} seconds=${state.budget.seconds}`);
}

main().catch((e) => { log(`FATAL ${e?.stack ?? e}`); save(); process.exit(1); });
