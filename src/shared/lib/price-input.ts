// Prices are typed in currency units ("29.00") and stored as integer cents. Both directions work on the
// digits of the string — never `float * 100`, which turns "19.99" into 1998.9999… and "0.29" into 28.999…

/** The API stores cents as a 32-bit integer. */
const MAX_CENTS = 2_147_483_647

export type PriceParse = { ok: true; cents: number } | { ok: false; error: string }

/** "29", "29.5", "29,50", ".5" → cents. Rejects empty input, anything but digits and one separator, and more than two decimals. */
export function parsePriceInput(input: string, emptyMessage = 'Enter a price — use 0 for a free product.'): PriceParse {
  const text = input.trim()
  if (!text) return { ok: false, error: emptyMessage }
  const match = /^(\d*)(?:[.,](\d*))?$/.exec(text)
  if (!match || (match[1] === '' && !match[2])) return { ok: false, error: 'Enter a valid price, like 29.00.' }
  const decimals = match[2] ?? ''
  if (decimals.length > 2) return { ok: false, error: 'Use at most two decimals.' }
  const cents = Number(match[1] || '0') * 100 + Number(decimals.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return { ok: false, error: 'This price is too high.' }
  return { ok: true, cents }
}

/** 2900 → "29.00" */
export function formatPriceInput(cents: number) {
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}
