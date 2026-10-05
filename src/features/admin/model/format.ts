import { money, normalizeCurrency } from '../../../shared/lib/format'

/** "RS35260005601001611379" → "RS35 2600 0560 1001 6113 79". */
export function groupIban(iban: string) {
  return iban.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ')
}

export type CurrencyTotals = { primary: { currency: string; cents: number }; others: string[] }

/**
 * Sums amounts per currency — never across currencies. The EUR total is the headline (the first currency when there
 * is no EUR); the other currencies come back as "+ $120.00" strings for the meta line.
 */
export function totalsByCurrency<T>(items: T[], currencyOf: (item: T) => string, centsOf: (item: T) => number): CurrencyTotals {
  const sums = new Map<string, number>()
  for (const item of items) {
    const currency = normalizeCurrency(currencyOf(item))
    sums.set(currency, (sums.get(currency) ?? 0) + centsOf(item))
  }
  const currencies = [...sums.keys()]
  const primaryCurrency = currencies.includes('EUR') ? 'EUR' : (currencies[0] ?? 'EUR')
  return {
    primary: { currency: primaryCurrency, cents: sums.get(primaryCurrency) ?? 0 },
    others: currencies.filter((c) => c !== primaryCurrency).sort().map((c) => `+ ${money(sums.get(c) ?? 0, c)}`),
  }
}
