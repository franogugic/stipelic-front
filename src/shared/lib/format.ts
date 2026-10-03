// Formatting helpers for the Ledger UI — English copy, EUR first, dates as "14 Jul 2026".
// Ported from designer-prototype/js/components.js (format). Money helpers take cents and a currency
// code as the API sends it ("Eur" / "EUR" / "Usd"), which is normalised to an uppercase ISO code.

type DateInput = Date | string | number

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CURRENCY_LOCALE: Record<string, string> = { EUR: 'en-IE', USD: 'en-US' }
const moneyFormatters = new Map<string, Intl.NumberFormat>()
const numberFormatter = new Intl.NumberFormat('en-US')
const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value))

export function normalizeCurrency(currency: string | null | undefined) {
  return (currency || 'EUR').toUpperCase()
}

function moneyFormatter(currency: string, decimals: boolean) {
  const key = `${currency}:${decimals}`
  let formatter = moneyFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(CURRENCY_LOCALE[currency] || 'en-IE', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    })
    moneyFormatters.set(key, formatter)
  }
  return formatter
}

export function money(amountCents: number, currency = 'EUR', { decimals = true }: { decimals?: boolean } = {}) {
  return moneyFormatter(normalizeCurrency(currency), decimals).format(amountCents / 100)
}

/** Money split for receding decimals: "€4,685" + ".00". */
export function moneyParts(amountCents: number, currency = 'EUR') {
  const parts = moneyFormatter(normalizeCurrency(currency), true).formatToParts(amountCents / 100)
  const decimalIndex = parts.findIndex((part) => part.type === 'decimal')
  if (decimalIndex === -1) return { whole: parts.map((part) => part.value).join(''), fraction: '' }
  return {
    whole: parts.slice(0, decimalIndex).map((part) => part.value).join(''),
    fraction: parts.slice(decimalIndex).map((part) => part.value).join(''),
  }
}

/** "€" / "$" — the symbol of a currency code, for input addons. */
export function currencySymbol(currency = 'EUR') {
  const code = normalizeCurrency(currency)
  const symbol = new Intl.NumberFormat(CURRENCY_LOCALE[code] || 'en-IE', { style: 'currency', currency: code })
    .formatToParts(0)
    .find((part) => part.type === 'currency')
  return symbol?.value ?? code
}

export function number(value: number) {
  return numberFormatter.format(value)
}

export function compact(value: number) {
  if (Math.abs(value) < 1000) return String(value)
  return `${(value / 1000).toFixed(value < 10000 ? 1 : 0).replace(/\.0$/, '')}k`
}

/** Takes a percentage (2.5 → "2.5%", 54.21 → "54.2%"). */
export function percent(value: number, digits = 1) {
  const rounded = Number(value.toFixed(digits))
  return `${rounded}%`
}

export function date(value: DateInput) {
  const d = toDate(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function dateShort(value: DateInput) {
  const d = toDate(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function month(value: DateInput) {
  return MONTHS[toDate(value).getMonth()]
}

export function monthYear(value: DateInput) {
  const d = toDate(value)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function time(value: DateInput) {
  const d = toDate(value)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function dateTime(value: DateInput) {
  return `${date(value)}, ${time(value)}`
}

export function relative(value: DateInput) {
  const d = toDate(value)
  const minutes = Math.round((Date.now() - d.getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return date(d)
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${number(count)} ${count === 1 ? singular : pluralForm}`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

/** Brand monogram: keeps a leading acronym ("MH Studio" → "MH"), otherwise initials. */
export function monogram(name: string) {
  const [first = ''] = name.trim().split(/\s+/)
  if (/^[A-Z0-9]{2,3}$/.test(first)) return first
  return initials(name)
}
