import { useCallback, useEffect, useState } from 'react'
import { number, plural } from '../../../shared/lib/format'
import { AreaChart, Card, ErrorState, SkeletonBlock } from '../../../shared/ui/ledger'
import { PeriodMenu } from '../../analytics/components/PeriodMenu'
import { bucketLabels, inZone, periodById, periodPhrase } from '../../analytics/model/series'
import type { AnalyticsPeriod } from '../../analytics/model/types'
import { getContactPeriodStats } from '../api/contacts-api'
import type { ContactPeriodStats } from '../model/types'

type Load = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: ContactPeriodStats }

const DEFAULT_PERIOD: AnalyticsPeriod = '6m'

/** "Growth": everyone subscribed at the end of each bucket of the chosen period. Each period is fetched once per workspace. */
export function GrowthCard({ slug }: { slug: string }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(DEFAULT_PERIOD)
  const [loads, setLoads] = useState<Record<string, Load>>({})
  const key = `${slug}|${period}`

  const load = useCallback(
    (id: AnalyticsPeriod) => {
      const loadKey = `${slug}|${id}`
      getContactPeriodStats(slug, id)
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
  const step = periodById(period, DEFAULT_PERIOD).step

  const body = () => {
    if (state.status === 'error') {
      return (
        <ErrorState
          compact
          onRetry={() => {
            setLoads((current) => ({ ...current, [key]: { status: 'loading' } }))
            load(period)
          }}
        />
      )
    }
    if (state.status === 'loading') return <SkeletonBlock />
    const { buckets } = state.data
    const { labels, titles } = bucketLabels(
      buckets.map((bucket) => bucket.start),
      state.data.step,
      inZone(state.data.range.to, state.data.timezone),
    )
    return (
      <AreaChart
        labels={labels}
        titles={titles}
        values={buckets.map((bucket) => bucket.total)}
        label={`Subscribers at the end of each ${state.data.step}, ${periodPhrase(period)}`}
        formatValue={(value) => number(Math.round(value))}
        describe={(value) => plural(Math.round(value), 'subscriber')}
      />
    )
  }

  return (
    <Card
      title="Growth"
      subtitle={`Everyone subscribed at the end of each ${step}`}
      action={<PeriodMenu period={period} onPeriod={setPeriod} align="end" />}
    >
      {body()}
    </Card>
  )
}
