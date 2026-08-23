# /color — Set Agent Session Color

Set the badge color of the current session in the Claude Code UI. Use this to visually distinguish parallel agents running simultaneously.

## Usage
```
/color [colorname]
```

## Color Palette

> **Superseded.** This command previously listed colors by C-suite role (CTO, CPO, CMO, CBO,
> backend-engineer, frontend-engineer, etc.). The roster collapsed in Phases 4b and 6 into
> seven engines. The tables below reflect the current roster.

### Orchestrator

| Instance | Color | When to use |
|----------|-------|-------------|
| Primary `orchestrator` | `gold` | First / only orchestrator session |
| Second parallel | `orange` | Second orchestrator in a parallel worktree |
| Third parallel | `teal` | Third orchestrator in a parallel worktree |
| Fourth parallel | `lime` | Fourth orchestrator in a parallel worktree |

### Producing engines

| Engine | Color |
|--------|-------|
| `framer` | `cyan` |
| `sourcer` | `purple` |
| `builder` | `blue` |
| `designer` | `pink` |

### Review engines

| Engine | Color |
|--------|-------|
| `reviewer` | `gray` |
| `reviewer-readonly` | `gray` |

### Shims (routing stubs — not direct session colors)

The following eleven names exist as shims to shadow drifted global copies: `ceo`, `qa-lead`,
`code-reviewer`, `security-engineer`, `design-lead`, `research-lead`, `researcher`,
`ai-engineer`, `database-engineer`, `technical-writer`, `test-engineer`. They route to a real
engine and should not be used as session names — use the target engine's color instead.

## Rules

1. **Every session must have a color.** Default is no color — always set it explicitly.
2. **Parallel orchestrators MUST use different colors.** This is how you tell them apart at a glance.
3. **Set color immediately** at the start of the identity_setup step, before any work.
4. **Color matches engine** — use the table above, don't invent new assignments.

## Example
```
/color gold       → orchestrator primary instance
/color blue       → builder
/color gray       → reviewer or reviewer-readonly
```

## Combined with /name
Always set both color AND name together:
```
/color gold
/name orchestrator-auth-redesign
```
