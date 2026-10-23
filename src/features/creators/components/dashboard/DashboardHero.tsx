import { MailPlus, Wallet } from 'lucide-react'
import { number, plural } from '../../../../shared/lib/format'
import { Money, Sparkline } from '../../../../shared/ui/ledger'
import { Versus } from '../../../analytics/components/Versus'
import { periodPhrase } from '../../../analytics/model/series'
import type { AnalyticsSeries } from '../../../analytics/model/types'

/** The hero: revenue for everything or a product that sells, sign-ups for a free product, with the trend over the period. */
export function DashboardHero({ series, free }: { series: AnalyticsSeries; free: boolean }) {
  const phrase = periodPhrase(series.period)
  const Icon = free ? MailPlus : Wallet
  const metric = free ? 'emails' : 'revenue'
  const label = free ? 'Sign-ups' : 'Revenue'
  const values = series.buckets.map((bucket) => (free ? bucket.emails : bucket.revenueCents))
  return (
    <article className="card card--feature span-7 hero-rev">
      <div className="card__body stack stack--lg">
        <span className="metric__label">
          <Icon />
          {label} · {phrase}
        </span>
        <div className="metric metric--xl">
          <span className="metric__value">
            {free ? number(series.totals.emails) : <Money amountCents={series.totals.revenueCents} currency={series.currency} />}
          </span>
          <span className="metric__meta">
            <Versus series={series} metric={metric} />
            {free && <span>· {plural(series.totals.downloads, 'download')}</span>}
          </span>
        </div>
        {values.length > 0 && <Sparkline values={values} label={`${label}, ${phrase}`} />}
      </div>
    </article>
  )
}
