import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartAxisTick, chartTooltipStyle } from '../../../shared/ui/chart-colors'
import { Card } from '../../../shared/ui/figma'
import { OPEN_RATE_TREND_MONTHS, useCampaignStore } from '../model/campaign-store'

const BLUE = 'var(--color-chart-1)'

const percent = (rate: number) => Math.round(rate * 1000) / 10

function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
}

export function OpenRateTrendCard({ className = '' }: { className?: string }) {
  const trend = useCampaignStore((s) => s.openRateTrend)
  const status = useCampaignStore((s) => s.openRateTrendStatus)

  const hasOpens = trend !== null && trend.points.some((p) => p.opens > 0)
  const subtitle =
    status === 'error'
      ? 'Could not load the trend'
      : trend === null
        ? 'Loading…'
        : hasOpens
          ? `${OPEN_RATE_TREND_MONTHS}-month average · current: ${
              trend.currentRate === null ? '—' : `${percent(trend.currentRate)}%`
            }`
          : 'No opens tracked yet'

  // A month without delivered mail has no rate (null) and leaves a gap in the line rather than a false 0%.
  const data = (trend?.points ?? []).map((p) => ({
    month: monthLabel(p.month),
    rate: p.rate === null ? null : percent(p.rate),
  }))

  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-sm font-bold mb-1">Open Rate Trend</p>
      <p className="text-[11px] text-muted-foreground mb-4">{subtitle}</p>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="openGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BLUE} stopOpacity={0.3} />
              <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="month" tick={chartAxisTick} axisLine={false} tickLine={false} />
          <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value}%`, 'Open rate']} />
          <Area
            type="monotone"
            dataKey="rate"
            stroke={BLUE}
            strokeWidth={2}
            fill="url(#openGrad)"
            dot={{ r: 3, fill: BLUE, strokeWidth: 0 }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
