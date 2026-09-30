// SP1 control (one long Claude run, no loop) and the blind Codex judge.
// Usage: bun control-and-judge.ts control | judge
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { dispatch, OUT } from "./workers";

const GOAL = "Find a real, underserved B2B niche where a one-person AI-run agency could sign its first paying client within 30 days; produce the evidence and a first offer.";
const mode = process.argv[2];

if (mode === "control") {
  const r = await dispatch("claude", "control", `${GOAL}\n\nResearch this properly on the live web (WebSearch/WebFetch), take as long as you need, then write the final deliverable. Cite a real URL inline for every factual claim. Structure: 1) the niche and why it is underserved, 2) evidence (buyer pain, reachability, willingness-to-pay/price anchors, competitive gap), 3) the first offer (scope, price, deliverables, 30-day path to a signed client), 4) open risks. 600-1200 words. Markdown. Output only the deliverable.`, { web: true, tag: "control", timeoutMs: 40 * 60_000 });
  writeFileSync(join(OUT, "control-deliverable.md"), r.text);
  console.log(`control done ${r.seconds}s $${r.costUsd}`);
} else if (mode === "judge") {
  const loop = readFileSync(join(OUT, "loop-deliverable.md"), "utf8");
  const ctrl = readFileSync(join(OUT, "control-deliverable.md"), "utf8");
  const loopIsA = Math.random() < 0.5;
  const [A, B] = loopIsA ? [loop, ctrl] : [ctrl, loop];
  writeFileSync(join(OUT, "judge-mapping.json"), JSON.stringify({ A: loopIsA ? "loop" : "control", B: loopIsA ? "control" : "loop" }));
  const r = await dispatch("codex", "judge", `You are a blind judge. Two deliverables (A and B) answer the same brief:\n"${GOAL}"\nThey were produced by two different processes; you are not told which.\n\nUse live web search to spot-check at least 3 cited claims in EACH (open the URL, confirm it says what is claimed). Then score each 1-10 on:\n- evidence_verifiability (share of claims whose cited source actually supports them — from your spot checks)\n- niche_specificity (is it a concrete, reachable niche, not a category)\n- offer_actionability (could a solo operator send this offer tomorrow)\n- honesty_about_uncertainty\n- overall_decision_usefulness (would you bet 30 days on it)\nDo NOT reward length. Report each spot check (url, claimed, found, ok/not-ok).\n\n=== A ===\n${A}\n\n=== B ===\n${B}\n\nEnd with ONLY this json block:\n\`\`\`json\n{"spot_checks":{"A":[{"url":"","claimed":"","ok":true}],"B":[]},"scores":{"A":{"evidence_verifiability":0,"niche_specificity":0,"offer_actionability":0,"honesty_about_uncertainty":0,"overall_decision_usefulness":0},"B":{}},"winner":"A|B|tie","reason":"..."}\n\`\`\``, { web: true, tag: "judge", timeoutMs: 25 * 60_000 });
  writeFileSync(join(OUT, "judge.md"), r.text);
  console.log(`judge done ${r.seconds}s; mapping A=${loopIsA ? "loop" : "control"}`);
}
