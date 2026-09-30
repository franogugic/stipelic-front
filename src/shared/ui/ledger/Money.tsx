import { moneyParts } from '../../lib/format'

/** Money with receding decimals: <span class="money">€4,685<span class="money__dec">.00</span></span> */
export function Money({ amountCents, currency = 'EUR' }: { amountCents: number; currency?: string }) {
  const { whole, fraction } = moneyParts(amountCents, currency)
  return (
    <span className="money">
      {whole}
      <span className="money__dec">{fraction}</span>
    </span>
  )
}
