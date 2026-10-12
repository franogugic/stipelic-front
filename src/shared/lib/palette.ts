// Colour palettes for the signed-in app, ported from the prototype's `PALETTES` / `paletteTokens` (js/components.js).
// A palette is a handful of seeds (accent, ink, success, chart hues and a neutral tint); every themed token for both
// themes is derived from them, and anything used as text is shaded until it passes contrast.

export type PaletteId = 'volt' | 'ocean' | 'sunset' | 'forest' | 'berry' | 'iris'

export type Palette = {
  id: PaletteId
  label: string
  mood: string
  accent: string
  ink: string
  success: string
  charts: string[]
  /** The neutral tint the greys lean toward; null for the default palette (no overrides). */
  tint: string | null
}

export const PALETTES: Palette[] = [
  { id: 'volt', label: 'Volt', mood: 'Lime on warm paper — the Luma original', accent: '#CDF24B', ink: '#17160F', success: '#22A052', charts: ['#8FB31C', '#D9733A', '#4F74D9', '#B29A72', '#9466C4'], tint: null },
  { id: 'ocean', label: 'Ocean', mood: 'Adriatic blues, coral and cool stone', accent: '#4CC9F0', ink: '#0B1D2E', success: '#12A27E', charts: ['#2A9D8F', '#E76F51', '#3D5A98', '#C9A23F', '#8E6CC9'], tint: '#C3D3E2' },
  { id: 'sunset', label: 'Sunset', mood: 'Peach and raspberry on a warm dusk', accent: '#FF8A5B', ink: '#2B1420', success: '#2F9E5B', charts: ['#D1495B', '#EDAE49', '#00798C', '#6B4E9B', '#A3A847'], tint: '#EBD2C6' },
  { id: 'forest', label: 'Forest', mood: 'Mint, moss and lake water', accent: '#7BE495', ink: '#0F2219', success: '#1F9D55', charts: ['#4D8B31', '#C8763A', '#3E6E9E', '#B8A05A', '#8A5A83'], tint: '#CFDAC6' },
  { id: 'berry', label: 'Berry', mood: 'Pink and violet with a teal kick', accent: '#FF7AB6', ink: '#22132B', success: '#23A26D', charts: ['#8B5CF6', '#F59E0B', '#0EA5A3', '#EF6F6C', '#5B7FDB'], tint: '#E2D2E0' },
  { id: 'iris', label: 'Iris', mood: 'Lavender, midnight and apricot', accent: '#9D8CFF', ink: '#15152B', success: '#20A06A', charts: ['#5B8DEF', '#F08A5D', '#2BB3A3', '#D4A84B', '#D16BA5'], tint: '#D4D4E8' },
]

export const DEFAULT_PALETTE = PALETTES[0]

// Written only when a non-default palette is chosen (like the theme); the derived CSS is kept next to it so the inline
// script in index.html can apply it before the first paint without any colour maths.
export const PALETTE_STORAGE_KEY = 'luma.palette'
export const PALETTE_CSS_STORAGE_KEY = 'luma.palette.css'
const STYLE_ELEMENT_ID = 'luma-palette'

type Rgb = [number, number, number]

const toRgb = (hex: string): Rgb => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)) as Rgb
const toHex = (rgb: number[]) => `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('').toUpperCase()}`

function luminance(rgb: Rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Mixes two hex colours; amount 0 → a, 1 → b. */
function mix(a: string, b: string, amount: number) {
  const [x, y] = [toRgb(a), toRgb(b)]
  return toHex(x.map((channel, index) => channel + (y[index] - channel) * amount))
}

const rgba = (hex: string, alpha: number) => `rgba(${toRgb(hex).join(', ')}, ${alpha})`

/** Darkens (on light) or lightens (on dark) a colour until it reaches `ratio` against the background. */
function shadeFor(hex: string, background: string, ratio: number) {
  const target = luminance(toRgb(background)) > 0.4 ? '#000000' : '#FFFFFF'
  for (let t = 0; t <= 1; t += 0.02) {
    const mixed = mix(hex, target, t)
    if (contrast(toRgb(mixed), toRgb(background)) >= ratio) return mixed
  }
  return target
}

/** Whichever of the candidates reads best on the colour. */
function bestText(hex: string, candidates: string[]) {
  const rgb = toRgb(hex)
  return candidates.reduce((best, candidate) => (contrast(rgb, toRgb(candidate)) > contrast(rgb, toRgb(best)) ? candidate : best))
}

// The Volt tokens in tokens.css, used as the base the other palettes are tinted from.
const BASE = {
  light: { bg: '#ECEBE4', canvas: '#F7F6F2', surface: '#FFFFFF', surface2: '#F4F3EE', surface3: '#EAE9E2', border: '#E4E2D9', borderStrong: '#CFCCC1', divider: '#EDEBE4', neutralSoft: '#EFEEE8', secondary: '#55534A', muted: '#6B695F' },
  dark: { bg: '#0A0A09', canvas: '#111110', surface: '#181816', surface2: '#201F1C', surface3: '#2A2925', border: '#282723', borderStrong: '#3A3934', divider: '#22211E', neutralSoft: '#23221F', toast: '#24231F' },
}

type Tokens = Record<string, string>

/** Every themed token for one palette, for both themes. A palette without a tint (Volt) has none. */
export function paletteTokens(p: Palette): { light: Tokens; dark: Tokens } {
  const { light: L, dark: D } = BASE
  const tintColour = p.tint ?? p.ink
  const tint = (base: string, amount: number) => mix(base, tintColour, amount)
  const darkTint = (base: string, amount: number) => mix(base, p.ink, amount)

  // Light: neutrals lean toward the tint, ink carries text, buttons and the feature card.
  const bg = tint(L.bg, 0.4)
  const canvas = tint(L.canvas, 0.16)
  const strongLight = shadeFor(p.accent, L.surface, 4.5)
  const successSoft = mix(p.success, '#FFFFFF', 0.88)
  const light: Tokens = {
    'color-bg': bg,
    'color-canvas': canvas,
    'color-surface-2': tint(L.surface2, 0.2),
    'color-surface-3': tint(L.surface3, 0.32),
    'color-border': tint(L.border, 0.32),
    'color-border-strong': tint(L.borderStrong, 0.3),
    'color-divider': tint(L.divider, 0.26),
    'color-neutral-soft': tint(L.neutralSoft, 0.3),
    'color-surface-inverse': p.ink,
    'color-text': p.ink,
    'color-text-secondary': shadeFor(mix(L.secondary, p.ink, 0.35), bg, 4.5),
    'color-text-muted': shadeFor(mix(L.muted, p.ink, 0.3), bg, 4.5),
    'color-primary': p.ink,
    'color-primary-hover': mix(p.ink, '#FFFFFF', 0.16),
    'color-accent': p.accent,
    'color-accent-hover': mix(p.accent, '#000000', 0.07),
    'color-on-accent': bestText(p.accent, [p.ink, '#FFFFFF']),
    'color-accent-strong': strongLight,
    'color-accent-soft': mix(p.accent, '#FFFFFF', 0.74),
    'color-success': shadeFor(p.success, successSoft, 4.5),
    'color-success-solid': p.success,
    'color-success-soft': successSoft,
    'color-feature-bg': p.ink,
    'color-feature-text': mix(p.ink, '#FFFFFF', 0.95),
    'color-feature-muted': shadeFor(mix(p.ink, '#FFFFFF', 0.6), p.ink, 4.5),
    'color-feature-border': mix(p.ink, '#FFFFFF', 0.14),
    'color-feature-glow': rgba(p.accent, 0.16),
    'color-feature-spark-fill': rgba(p.accent, 0.2),
    'color-toast-bg': p.ink,
    'color-toast-success': shadeFor(p.accent, p.ink, 4.5),
    'color-focus': strongLight,
    'focus-ring': `0 0 0 3px ${rgba(strongLight, 0.22)}`,
    selection: rgba(p.accent, 0.45),
    'skeleton-base': tint(L.surface3, 0.32),
    'skeleton-shine': canvas,
    'chart-1': p.ink,
    'chart-1-fill': rgba(p.accent, 0.42),
    'chart-grid': tint(L.divider, 0.26),
    'chart-tooltip-bg': p.ink,
    ...Object.fromEntries(p.charts.map((hue, index) => [`chart-${index + 2}`, hue])),
  }

  // Dark: near-blacks take on the ink's hue; colours are lifted until they read on them.
  const surface = darkTint(D.surface, 0.35)
  const accent = contrast(toRgb(p.accent), toRgb(surface)) >= 3 ? p.accent : shadeFor(p.accent, surface, 3)
  const strongDark = shadeFor(accent, surface, 4.5)
  const darkCanvas = darkTint(D.canvas, 0.4)
  const dark: Tokens = {
    'color-bg': darkTint(D.bg, 0.35),
    'color-canvas': darkCanvas,
    'color-surface': surface,
    'color-surface-2': darkTint(D.surface2, 0.32),
    'color-surface-3': darkTint(D.surface3, 0.3),
    'color-border': darkTint(D.border, 0.32),
    'color-border-strong': darkTint(D.borderStrong, 0.26),
    'color-divider': darkTint(D.divider, 0.32),
    'color-neutral-soft': darkTint(D.neutralSoft, 0.3),
    'color-accent': accent,
    'color-accent-hover': mix(accent, '#FFFFFF', 0.14),
    'color-on-accent': bestText(accent, ['#0A0A09', '#FFFFFF']),
    'color-accent-strong': strongDark,
    'color-accent-soft': mix(accent, surface, 0.86),
    'color-success': shadeFor(p.success, surface, 4.5),
    'color-success-solid': shadeFor(p.success, surface, 3),
    'color-success-soft': mix(p.success, surface, 0.84),
    'color-feature-bg': mix(accent, darkCanvas, 0.92),
    'color-feature-border': mix(accent, darkCanvas, 0.82),
    'color-feature-glow': rgba(accent, 0.1),
    'color-feature-spark-fill': rgba(accent, 0.14),
    'color-toast-bg': darkTint(D.toast, 0.3),
    'color-toast-success': strongDark,
    'color-focus': strongDark,
    'focus-ring': `0 0 0 3px ${rgba(strongDark, 0.2)}`,
    selection: rgba(accent, 0.3),
    'skeleton-base': darkTint(D.surface2, 0.32),
    'skeleton-shine': darkTint(D.surface3, 0.3),
    'chart-1': strongDark,
    'chart-1-fill': rgba(accent, 0.16),
    'chart-grid': darkTint(D.divider, 0.32),
    ...Object.fromEntries(p.charts.map((hue, index) => [`chart-${index + 2}`, shadeFor(hue, surface, 3.2)])),
  }
  return { light, dark }
}

/**
 * The CSS for a palette, scoped to signed-in app pages: `<html data-app>` is set by the app shell (and, before first
 * paint, by the inline script in index.html for /app and /admin addresses). The homepage, auth, creators' public pages
 * and emails never carry it, so they always stay Volt.
 */
export function paletteCss(p: Palette) {
  const tokens = paletteTokens(p)
  const block = (set: Tokens) => Object.entries(set).map(([name, value]) => `--${name}: ${value};`).join(' ')
  return `:root[data-app][data-theme="light"] { ${block(tokens.light)} }\n:root[data-app][data-theme="dark"] { ${block(tokens.dark)} }`
}

export function readStoredPalette(): Palette {
  try {
    const id = window.localStorage.getItem(PALETTE_STORAGE_KEY)
    return PALETTES.find((palette) => palette.id === id) ?? DEFAULT_PALETTE
  } catch {
    return DEFAULT_PALETTE
  }
}

/** Puts the palette's CSS in the page (and removes it for Volt). */
export function applyPalette(p: Palette) {
  let style = document.getElementById(STYLE_ELEMENT_ID)
  if (p.id === DEFAULT_PALETTE.id) {
    style?.remove()
    return
  }
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ELEMENT_ID
    document.head.appendChild(style)
  }
  style.textContent = paletteCss(p)
}

/** Saves and applies a palette. Volt clears the saved choice. */
export function storePalette(p: Palette) {
  try {
    if (p.id === DEFAULT_PALETTE.id) {
      window.localStorage.removeItem(PALETTE_STORAGE_KEY)
      window.localStorage.removeItem(PALETTE_CSS_STORAGE_KEY)
    } else {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, p.id)
      window.localStorage.setItem(PALETTE_CSS_STORAGE_KEY, paletteCss(p))
    }
  } catch {
    // Storage can be blocked (private mode); the palette still applies for this session.
  }
  applyPalette(p)
}
