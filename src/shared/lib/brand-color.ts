import type { CSSProperties } from 'react'

// Creator brand colour → accessible palette, ported from the prototype's brandStyle().
// The creator's colour is used as-is for fills. Text that uses it is shaded until it passes contrast (3:1 for
// display type, 4.5:1 for body text), separately for light and dark backgrounds. Button text picks white or ink.

const LP_LIGHT_BG = '#FBF8F3'
const LP_DARK_BG = '#14110E'
const LP_INK = '#1C1612'

type Rgb = [number, number, number]

const hexToRgb = (hex: string): Rgb => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)) as Rgb
const rgbToHex = (rgb: Rgb) => `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`

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

function shadeFor(hex: string, background: string, ratio: number) {
  const base = hexToRgb(hex)
  const bg = hexToRgb(background)
  const target: Rgb = luminance(bg) > 0.4 ? [0, 0, 0] : [255, 255, 255]
  for (let t = 0; t <= 1; t += 0.04) {
    const mixed = base.map((channel, index) => Math.round(channel + (target[index] - channel) * t)) as Rgb
    if (contrast(mixed, bg) >= ratio) return rgbToHex(mixed)
  }
  return rgbToHex(target)
}

export const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value)

/** The `--brand*` custom properties a creator-branded surface (public page, email preview) reads. */
export function brandStyle(hex: string): CSSProperties {
  const rgb = hexToRgb(hex)
  const onWhite = contrast(rgb, [255, 255, 255])
  const onInk = contrast(rgb, hexToRgb(LP_INK))
  const onBrand = onWhite >= 4.5 || onWhite >= onInk ? '#FFFFFF' : LP_INK
  return {
    '--brand': hex,
    '--on-brand': onBrand,
    '--brand-display-light': shadeFor(hex, LP_LIGHT_BG, 3),
    '--brand-text-light': shadeFor(hex, LP_LIGHT_BG, 4.5),
    '--brand-display-dark': shadeFor(hex, LP_DARK_BG, 3),
    '--brand-text-dark': shadeFor(hex, LP_DARK_BG, 4.5),
  } as CSSProperties
}
