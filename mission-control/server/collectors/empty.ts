// server/collectors/empty.ts — the honest-empty-state helper shared by Project and
// Inbox (constraint 3, PR2 brief). Neither view has a real data source yet: nothing in
// this repo emits playbook stage progress, and no project's `~/.<id>/messages/` has ever
// held a message. Both facts are executed here, not asserted — `probe` is the literal
// command/glob a caller (or a test) can re-run to see the same answer independently.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { Project } from '../projects.ts';

export interface EmptyState {
  probe: string;
  found: boolean;
  would_fill: string;
}

/**
 * Project view: "nothing anywhere emits playbook stage progress" (PR2 brief). The probe
 * is a literal grep for the one marker a stage-progress emitter would have to write.
 * Scoped away from .git/node_modules/.worktrees so it stays cheap on a large repo.
 */
export function projectEmptyState(project: Project): EmptyState {
  const probe = `grep -rl --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.worktrees "playbook_stage" ${project.root}`;
  let found = false;
  try {
    const out = execFileSync('bash', ['-c', probe], { encoding: 'utf8' });
    found = out.trim().length > 0;
  } catch {
    found = false; // grep exits 1 on "no match" — that IS the honest answer, not a failure
  }
  return {
    probe,
    found,
    would_fill:
      'Goals, playbook stage progress, open claims, expired claims, blocked items — once something in this project emits playbook stage progress, this view has real data to show.',
  };
}

/**
 * Inbox view: "no project has a populated ~/.<name>/messages/ dir" (PR2 brief). The
 * probe is the literal glob a human would run to check.
 */
export function inboxEmptyState(project: Project, homeDir: string = os.homedir()): EmptyState {
  const dir = path.join(homeDir, `.${project.id}`, 'messages');
  const probe = `${dir}/*`;
  let found = false;
  try {
    found = fs.readdirSync(dir).length > 0;
  } catch {
    found = false; // directory absent is the same honest "nothing here" as directory empty
  }
  return {
    probe,
    found,
    would_fill:
      'Pending outbound approvals, escalations, binary pings — once this project writes into its messages/ directory, this view has real data to show.',
  };
}
