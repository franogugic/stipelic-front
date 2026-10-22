import { date, dateShort, time } from '../../../shared/lib/format'
import { PERIODS, inZone } from '../model/series'
import type { AnalyticsPeriod, PeriodWindow } from '../model/types'
import { PeriodMenu } from './PeriodMenu'

/** "23 – 29 Sep 2026" or "31 Aug – 29 Sep 2026"; without the year for the comparison. */
function dateRange(from: Date, to: Date, withYear = true) {
  const end = withYear ? date(to) : dateShort(to)
  return from.getMonth() === to.getMonth() ? `${from.getDate()} – ${end}` : `${dateShort(from)} – ${end}`
}

function Caption({ series, sinceNote }: { series: PeriodWindow; sinceNote: string }) {
  const period = PERIODS.find((candidate) => candidate.id === series.period)
  const zone = (instant: string) => inZone(instant, series.timezone)
  const to = zone(series.range.to)
  if (series.period === 'today') {
    return (
      <>
        {date(to)}, until {time(to)} <span>· compared with {period?.compare}</span>
      </>
    )
  }
  if (series.period === 'all') {
    return (
      <>
        Since {date(zone(series.since))} <span>· {sinceNote}</span>
      </>
    )
  }
  const from = zone(series.range.from)
  // The range's end is exclusive-ish ("now" or midnight); the last day shown is the one before midnight.
  const last = to.getHours() === 0 && to.getMinutes() === 0 ? new Date(to.getFullYear(), to.getMonth(), to.getDate() - 1) : to
  const previous = series.previousRange
  const previousFrom = previous ? zone(previous.from) : null
  const previousToRaw = previous ? zone(previous.to) : null
  const previousTo =
    previousToRaw && previousToRaw.getHours() === 0 && previousToRaw.getMinutes() === 0
      ? new Date(previousToRaw.getFullYear(), previousToRaw.getMonth(), previousToRaw.getDate() - 1)
      : previousToRaw
  return (
    <>
      {dateRange(from, last)}
      {previousFrom && previousTo && <span> · compared with {dateRange(previousFrom, previousTo, false)}</span>}
    </>
  )
}

/** Period menu, the dates it covers and a live marker — the same on every analytics screen. */
export function PeriodBar({
  period,
  series,
  loading,
  updatedAt,
  sinceNote,
  onPeriod,
}: {
  period: AnalyticsPeriod
  /** The window the numbers cover (an analytics series, or a summary's period and range); null while it loads. */
  series: PeriodWindow | null
  loading: boolean
  updatedAt: Date
  sinceNote: string
  onPeriod: (period: AnalyticsPeriod) => void
}) {
  return (
    <div className="period-bar">
      <PeriodMenu period={period} onPeriod={onPeriod} />
      <p className="period-bar__range">{loading ? 'Loading…' : series ? <Caption series={series} sinceNote={sinceNote} /> : null}</p>
      <span className="live">
        <span className="live__dot" aria-hidden="true" />
        Live · updated {time(updatedAt)}
      </span>
    </div>
  )
}
