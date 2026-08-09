import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type MonthlyRevenueChartProps = {
  monthlyRevenueTrend: number[]
  currency: string
}

export function MonthlyRevenueChart({ monthlyRevenueTrend, currency }: MonthlyRevenueChartProps) {
  const data = monthlyRevenueTrend.map((v, i) => {
    const monthsAgo = monthlyRevenueTrend.length - 1 - i
    const date = new Date()
    date.setDate(1) // avoid month-length rollover (e.g. Mar 31 minus 1 month landing on a short Feb)
    date.setMonth(date.getMonth() - monthsAgo)
    return {
      month: date.toLocaleDateString(undefined, { month: 'short' }),
      revenueCents: v,
    }
  })
  const rangeLabel =
    data.length > 0 ? `${data[0].month} – ${data[data.length - 1].month} ${new Date().getFullYear()}` : ''

  return (
    <div
      className="col-span-2 h-full flex flex-col rounded-xl bg-card p-5"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-sm font-bold mb-1">Monthly Revenue</p>
      <p className="text-[11px] text-muted-foreground mb-4">{rangeLabel}</p>
      <ResponsiveContainer width="100%" height="100%" className="flex-1">
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#555', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => String(v / 100)}
          />
          <Tooltip content={<MonthlyRevenueTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="revenueCents"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            fill="url(#monthGrad)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-chart-1)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function MonthlyRevenueTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: { payload?: { month?: string; revenueCents?: number } }[]
  currency: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="text-white/70">
        {row?.month}: <span className="font-semibold text-white">{formatCurrency(row?.revenueCents ?? 0, currency)}</span>
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
