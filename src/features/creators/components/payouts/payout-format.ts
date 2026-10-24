const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null

/** "HR" → "Croatia" (the code itself when the browser can't name it). */
export function countryName(code: string) {
  try {
    return regionNames?.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}
