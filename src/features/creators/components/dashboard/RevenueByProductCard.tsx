import { useCallback, useEffect, useState } from 'react'
import { money, plural } from '../../../../shared/lib/format'
import { Card, EmptyState, ErrorState, HBars, SkeletonBlock } from '../../../../shared/ui/ledger'
import { getProductRevenue } from '../../../analytics/api/series-api'
import { PeriodMenu } from '../../../analytics/components/PeriodMenu'
import { periodPhrase } from '../../../analytics/model/series'
import type { AnalyticsPeriod, ProductRevenueBreakdown } from '../../../analytics/model/types'

type Load = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: ProductRevenueBreakdown }

const DEFAULT_PERIOD: AnalyticsPeriod = '30d'

/** "Revenue by product": paid revenue per product for the chosen period, with the rest as one "Other" row. */
export function RevenueByProductCard({ slug, currency }: { slug: string; currency: string }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(DEFAULT_PERIOD)
  // Each period is fetched once per workspace; going back to one already loaded reuses it.
  const [loads, setLoads] = useState<Record<string, Load>>({})
  const key = `${slug}|${period}`

  const load = useCallback(
    (id: AnalyticsPeriod) => {
      const loadKey = `${slug}|${id}`
      getProductRevenue(slug, id)
        .then((data) => setLoads((current) => ({ ...current, [loadKey]: { status: 'success', data } })))
        .catch(() => setLoads((current) => ({ ...current, [loadKey]: { status: 'error' } })))
    },
    [slug],
  )

  const known = key in loads
  useEffect(() => {
    if (!known) load(period)
  }, [known, load, period])

  const state: Load = loads[key] ?? { status: 'loading' }
  const formatMoney = (cents: number) => money(cents, currency)

  const body = () => {
    if (state.status === 'error') return (
        <ErrorState
          compact
          onRetry={() => {
            setLoads((current) => ({ ...current, [key]: { status: 'loading' } }))
            load(period)
          }}
        />
      )
    if (state.status === 'loading') return <SkeletonBlock />
    const { products, otherRevenueCents, totalRevenueCents } = state.data
    if (products.length === 0) {
      return <EmptyState compact title="No sales in this period" text="Revenue per product shows up after the first order." />
    }
    const rows = products.map((product) => ({ label: product.name, value: product.revenueCents, display: formatMoney(product.revenueCents) }))
    if (otherRevenueCents > 0) rows.push({ label: 'Other', value: otherRevenueCents, display: formatMoney(otherRevenueCents) })
    return (
      <div className="fill-stack">
        <HBars rows={rows} />
        <p className="fill-stack__foot">
          <span>
            {plural(products.length, 'product')}
            {otherRevenueCents > 0 ? ' and others' : ''} with sales
          </span>
          <strong>{formatMoney(totalRevenueCents)}</strong>
        </p>
      </div>
    )
  }

  return (
    <Card
      title="Revenue by product"
      subtitle={`Paid orders, ${periodPhrase(period)}`}
      action={<PeriodMenu period={period} onPeriod={setPeriod} align="end" />}
    >
      {body()}
    </Card>
  )
}
