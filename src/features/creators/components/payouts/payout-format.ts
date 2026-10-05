const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null

/** "RS" → "Serbia" (the code itself when the browser can't name it). */
export function countryName(code: string) {
  try {
    return regionNames?.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

/**
 * Client-side structural + mod-97 checksum check (mirrors the backend IbanValidator) — only for fast feedback;
 * the server stays the authority and validates again on save.
 */
export function isPlausibleIban(value: string): boolean {
  const normalized = value.replace(/\s+/g, '').toUpperCase()
  if (normalized.length < 15 || normalized.length > 34) return false
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(normalized)) return false

  const rearranged = normalized.slice(4) + normalized.slice(0, 4)
  let remainder = 0
  for (const char of rearranged) {
    const digit = char >= '0' && char <= '9' ? char.charCodeAt(0) - 48 : char.charCodeAt(0) - 55
    remainder = digit < 10 ? (remainder * 10 + digit) % 97 : (remainder * 100 + digit) % 97
  }
  return remainder === 1
}
