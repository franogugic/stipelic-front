import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type RevenueTrendChartProps = {
  revenueTrend: number[]
  viewsTrend: number[]
  currency: string
}

export function RevenueTrendChart({ revenueTrend, viewsTrend, currency }: RevenueTrendChartProps) {
  return (
    <div className="rounded-xl bg-card p-5 lg:col-span-3" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-bold">Revenue trend</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Last 7 days · daily</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: 'var(--color-chart-4)' }} />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: 'var(--color-chart-1)' }} />
            Views
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart
          data={revenueTrend.map((v, i) => {
            const daysAgo = revenueTrend.length - 1 - i
            const date = new Date()
            date.setDate(date.getDate() - daysAgo)
            return {
              day: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              revenueCents: v,
              views: viewsTrend[i] ?? 0,
            }
          })}
          margin={{ top: 0, right: 4, bottom: 0, left: -18 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'DM Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => String(v / 100)}
          />
          <Tooltip content={<RevenueTooltip currency={currency} />} />
          <Bar dataKey="revenueCents" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} fillOpacity={0.75} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function RevenueTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: { value?: number; payload?: { revenueCents?: number; views?: number } }[]
  currency: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="flex items-center gap-2 text-white/70">
        <span className="size-2 rounded-full" style={{ backgroundColor: 'var(--color-chart-4)' }} />
        Revenue: <span className="font-semibold text-white">{formatCurrency(row?.revenueCents ?? 0, currency)}</span>
      </p>
      <p className="mt-1 flex items-center gap-2 text-white/70">
        <span className="size-2 rounded-full" style={{ backgroundColor: 'var(--color-chart-1)' }} />
        Views: <span className="font-semibold text-white">{(row?.views ?? 0).toLocaleString()}</span>
      </p>
    </div>
  )
}

function formatCurrency(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}
