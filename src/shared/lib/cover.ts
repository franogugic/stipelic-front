import type { CSSProperties } from 'react'

/** The prototype's hand-made cover variants (`.cover--{variant}` in app-layout.css). */
const COVER_VARIANTS = ['sunset', 'grid', 'portrait', 'blocks', 'kit', 'lens'] as const

/** FNV-1a, so a page keeps the same variant across loads and devices. */
function hash(value: string) {
  let result = 0x811c9dc5
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 0x01000193)
  }
  return result >>> 0
}

/** A CSS `url("…")` for an http(s) address, or null for anything else. Quotes, backslashes and line breaks are
 * escaped so the value can never break out of the string. */
function cssUrl(address: string) {
  try {
    const { protocol } = new URL(address)
    if (protocol !== 'https:' && protocol !== 'http:') return null
  } catch {
    return null
  }
  return `url("${address.replace(/["\\\n\r\f]/g, (char) => `\\${char.charCodeAt(0).toString(16)} `)}")`
}

/**
 * Cover art for a tile or a table thumb: the image through the prototype's `--cover` variable, else one of the
 * six prototype variants picked from the public id.
 */
export function cover(publicId: string, imageUrl: string | null): { className: string; style?: CSSProperties } {
  const image = imageUrl ? cssUrl(imageUrl) : null
  if (image) {
    return { className: 'cover', style: { '--cover': `center / cover no-repeat ${image}` } as CSSProperties }
  }
  return { className: `cover cover--${COVER_VARIANTS[hash(publicId) % COVER_VARIANTS.length]}` }
}
