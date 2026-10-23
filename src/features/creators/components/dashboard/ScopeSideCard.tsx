import { Package } from 'lucide-react'
import { money, number, percent, plural } from '../../../../shared/lib/format'
import { Card, ErrorState, HBars, SkeletonBlock } from '../../../../shared/ui/ledger'
import { QuietPeriod } from '../../../analytics/components/QuietPeriod'
import { periodPhrase } from '../../../analytics/model/series'
import type { AnalyticsSeries, ProductRevenueBreakdown } from '../../../analytics/model/types'
import type { Load } from '../../../../shared/lib/use-keyed-load'

const rate = (part: number, whole: number) => percent(whole ? (part / whole) * 100 : 0)

/**
 * Beside the chart. All products: revenue by product. One product that sells: where it stands among the others
 * (`selected` comes from the API, so the product shows even beyond the listed ones).
 */
export function ProductRevenueCard({
  load,
  currency,
  onRetry,
  onShowAll,
}: {
  load: Load<ProductRevenueBreakdown>
  currency: string
  onRetry: () => void
  onShowAll: () => void
}) {
  const body = () => {
    if (load.status === 'error') return <ErrorState compact onRetry={onRetry} />
    if (load.status === 'loading') return <SkeletonBlock />
    const { products, otherRevenueCents, totalRevenueCents, productsWithSales, selected, period } = load.data
    if (productsWithSales === 0) {
      return (
        <QuietPeriod
          period={period}
          icon={Package}
          title="No sales in this period"
          text={selected ? 'None of your products sold anything.' : `Nothing sold ${period === 'today' ? 'today' : period === 'all' ? 'so far' : `in the ${periodPhrase(period)}`}.`}
          onShowAll={onShowAll}
        />
      )
    }
    const rows = products.map((product) => ({ label: product.name, value: product.revenueCents, display: money(product.revenueCents, currency) }))
    const listed = selected ? products.some((product) => product.publicId === selected.publicId) : true
    // A product beyond the listed ones still appears, so the highlighted row is always there.
    if (selected && !listed && selected.revenueCents > 0) {
      rows.push({ label: selected.name, value: selected.revenueCents, display: money(selected.revenueCents, currency) })
    }
    if (otherRevenueCents > 0) rows.push({ label: 'Other', value: otherRevenueCents, display: money(otherRevenueCents, currency) })
    return (
      <div className="fill-stack">
        <HBars rows={rows} highlight={selected?.name} />
        <p className="fill-stack__foot">
          {selected ? (
            selected.rank ? (
              <>
                <span>
                  #{selected.rank} of {productsWithSales} by revenue
                </span>
                <strong>{rate(selected.revenueCents, totalRevenueCents)} of revenue</strong>
              </>
            ) : (
              <>
                <span>No sales in this period</span>
                <strong>—</strong>
              </>
            )
          ) : (
            <>
              <span>
                {plural(productsWithSales, 'product')} with sales
              </span>
              <strong>{money(totalRevenueCents, currency)}</strong>
            </>
          )}
        </p>
      </div>
    )
  }
  const period = load.status === 'success' ? load.data.period : null
  return (
    <Card
      title={load.status === 'success' && load.data.selected ? 'Compared with your other products' : 'Revenue by product'}
      subtitle={period ? `${load.status === 'success' && load.data.selected ? 'Revenue' : 'Paid orders'} · ${periodPhrase(period)}` : undefined}
    >
      {body()}
    </Card>
  )
}

/** A free product: from visit to download. */
export function FunnelCard({ series, onShowAll }: { series: AnalyticsSeries; onShowAll: () => void }) {
  const { views, emails, downloads } = series.totals
  return (
    <Card title="From visit to download" subtitle={periodPhrase(series.period)}>
      {views > 0 ? (
        <div className="fill-stack">
          <HBars
            rows={[
              { label: 'Page views', value: views, display: number(views) },
              { label: 'Sign-ups', value: emails, display: `${number(emails)} · ${rate(emails, views)}` },
              { label: 'Downloads', value: downloads, display: number(downloads) },
            ]}
          />
          <p className="fill-stack__foot">
            <span>Downloads per sign-up</span>
            <strong>{emails ? (downloads / emails).toFixed(1) : '—'}</strong>
          </p>
        </div>
      ) : (
        <QuietPeriod period={series.period} title="No visits in this period" text="Nobody saw the lead page that gives it away." onShowAll={onShowAll} />
      )}
    </Card>
  )
}
