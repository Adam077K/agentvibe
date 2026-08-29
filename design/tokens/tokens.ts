// GENERATED — do not edit, run `npm run build:tokens`.
// Source: design/tokens/seeds.json. Type is DERIVED, colour is CARRIED, contrast is COMPUTED.

export const fontFamily = {
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
} as const;

/** Every size in the ramp. There is no other size. */
export const type = {
  'ui-0': { size: 11, lineHeight: 1.353, tracking: 0.0066, band: 'ui' },
  'ui-1': { size: 12, lineHeight: 1.389, tracking: 0.0044, band: 'ui' },
  'ui-2': { size: 13, lineHeight: 1.424, tracking: 0.0022, band: 'ui' },
  'ui-3': { size: 14, lineHeight: 1.458, tracking: 0, band: 'ui' },
  'ui-4': { size: 15, lineHeight: 1.491, tracking: -0.0022, band: 'ui' },
  'display-0': { size: 20, lineHeight: 1, tracking: -0.0132, band: 'display' },
} as const;

export const color = {
  'ink': '#0d0e11',
  'row-alt': '#15171d',
  'raised': '#1e222b',
  'line': '#2a2f39',
  'line-strong': '#3d4451',
  'divider': '#5a6270',
  'dim': '#7b8494',
  'muted': '#9aa1ad',
  'text': '#e6e8ec',
  'live': '#3fbf8f',
  'warn': '#d9a441',
  'bad': '#e2727a',
} as const;

export type TypeToken = keyof typeof type;
export type ColorToken = keyof typeof color;

/** Adjacent ratios of the UI band, and the jump into the display band. */
export const uiAdjacentRatios = [1.091,1.083,1.077,1.071] as const;
export const bandJoinRatio = 1.333;
