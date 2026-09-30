// server/model-family.ts — B0-20 / DR-83: a launch's family is derived from the model id it was
// launched with, never from the slot it was launched into. A slot is a declaration ("this is the
// Claude seat"); the model id is what actually ran. Cross-family evidence labelled from the slot
// would call a Codex review a Claude one the first time someone points MC_CLAUDE_MODEL at a GPT
// model, and nothing downstream could tell.

export type ModelFamily = 'claude' | 'codex' | 'unknown';

/**
 * Pure: model id → family. `claude-*` is Claude; `gpt-*`, `codex-*` and the `o<digit>` reasoning
 * line (o1, o3, o4-mini, …) are Codex. Anything else is `unknown` — never guessed, and never
 * borrowed from the slot, because a guess here is exactly the mislabel this function exists to stop.
 */
export function familyOf(model: string): ModelFamily {
  const id = String(model ?? '').trim().toLowerCase();
  if (/^claude-/.test(id)) return 'claude';
  if (/^(gpt-|codex-)/.test(id) || /^o\d/.test(id)) return 'codex';
  return 'unknown';
}

/** The fields a receipt carries about who ran: the derived family, and a flag when the slot disagreed. */
export interface FamilyStamp {
  family: ModelFamily;
  slotFamily: ModelFamily;
  slotModelMismatch?: true;
}

/** Compare a slot's declared family with the family derived from the model id it was given. */
export function stampFamily(slotFamily: ModelFamily, model: string): FamilyStamp {
  const family = familyOf(model);
  return family === slotFamily ? { family, slotFamily } : { family, slotFamily, slotModelMismatch: true };
}
