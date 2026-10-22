import { useCallback, useEffect, useState } from 'react'
import { ErrorState, SkeletonCards } from '../../../shared/ui/ledger'
import { PeriodBar } from '../../analytics/components/PeriodBar'
import type { AnalyticsPeriod } from '../../analytics/model/types'
import { getOrderPeriodSummary } from '../api/orders-api'
import type { OrderPeriodSummary } from '../model/types'
import { OrdersBoard } from './OrdersBoard'

type Load = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: OrderPeriodSummary; at: Date }

const DEFAULT_PERIOD: AnalyticsPeriod = '30d'

/** The period menu and the money board it drives. Each period is fetched once per workspace. */
export function OrdersPeriodBoard({ slug, currency }: { slug: string; currency: string }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(DEFAULT_PERIOD)
  const [loads, setLoads] = useState<Record<string, Load>>({})
  const key = `${slug}|${period}`

  const load = useCallback(
    (id: AnalyticsPeriod) => {
      const loadKey = `${slug}|${id}`
      getOrderPeriodSummary(slug, id)
        .then((data) => setLoads((current) => ({ ...current, [loadKey]: { status: 'success', data, at: new Date() } })))
        .catch(() => setLoads((current) => ({ ...current, [loadKey]: { status: 'error' } })))
    },
    [slug],
  )

  const known = key in loads
  useEffect(() => {
    if (!known) load(period)
  }, [known, load, period])

  const state: Load = loads[key] ?? { status: 'loading' }
  const data = state.status === 'success' ? state.data : null

  return (
    <div className="stack stack--md">
      <PeriodBar
        period={period}
        // The summary has no previous window or start of its own: "all" starts where its range starts.
        series={data ? { period: data.period, timezone: data.timezone, since: data.range.from, range: data.range, previousRange: null } : null}
        loading={state.status === 'loading'}
        updatedAt={state.status === 'success' ? state.at : new Date()}
        sinceNote="every order since the workspace started"
        onPeriod={setPeriod}
      />
      {state.status === 'error' ? (
        <ErrorState
          compact
          onRetry={() => {
            setLoads((current) => ({ ...current, [key]: { status: 'loading' } }))
            load(period)
          }}
        />
      ) : data ? (
        <OrdersBoard summary={data} currency={currency} />
      ) : (
        <SkeletonCards count={4} />
      )}
    </div>
  )
}
