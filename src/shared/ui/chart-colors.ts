// Multi-color-per-metric palette, cycled across stat cards/chips throughout the redesigned app —
// sourced from the Figma Make reference's chart-1..5 tokens (see index.css), not invented separately.
export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

// Recharts <Tooltip contentStyle> and axis tick styling, from the Figma reference (ttStyle / axis ticks).
export const chartTooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid color-mix(in srgb, var(--color-chart-1) 20%, transparent)',
  borderRadius: '8px',
  color: 'var(--color-foreground)',
  fontSize: '11px',
  fontFamily: 'DM Mono, monospace',
}

export const chartAxisTick = { fill: '#555', fontSize: 10 }
