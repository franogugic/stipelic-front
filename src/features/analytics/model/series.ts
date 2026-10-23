import { Download, Eye, MailPlus, ShoppingBag, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { dateShort, month, monthYear, money, number } from '../../../shared/lib/format'
import type { Product } from '../../products/model/types'
import type { AnalyticsBucket, AnalyticsMetric, AnalyticsPeriod, AnalyticsSeries, AnalyticsStep, AnalyticsTotals } from './types'

/** The one period menu of every chart. `compare` is the previous period's name (null: nothing to compare with). */
export const PERIODS: Array<{ id: AnalyticsPeriod; label: string; compare: string | null; step: AnalyticsStep }> = [
  { id: 'today', label: 'Today', compare: 'same time yesterday', step: 'hour' },
  { id: '7d', label: 'Last 7 days', compare: 'previous 7 days', step: 'day' },
  { id: '15d', label: 'Last 15 days', compare: 'previous 15 days', step: 'day' },
  { id: '30d', label: 'Last 30 days', compare: 'previous 30 days', step: 'day' },
  { id: '2m', label: 'Last 2 months', compare: 'previous 2 months', step: 'week' },
  { id: '3m', label: 'Last 3 months', compare: 'previous 3 months', step: 'week' },
  { id: '6m', label: 'Last 6 months', compare: 'previous 6 months', step: 'month' },
  { id: 'all', label: 'All time', compare: null, step: 'month' },
]

export const METRICS: Array<{ id: AnalyticsMetric; label: string; icon: LucideIcon; unit?: [string, string] }> = [
  { id: 'views', label: 'Views', icon: Eye, unit: ['view', 'views'] },
  { id: 'emails', label: 'Emails collected', icon: MailPlus, unit: ['email', 'emails'] },
  { id: 'sales', label: 'Sales', icon: ShoppingBag, unit: ['sale', 'sales'] },
  { id: 'revenue', label: 'Revenue', icon: Wallet },
  { id: 'downloads', label: 'Downloads', icon: Download, unit: ['download', 'downloads'] },
]

export const periodById = (id: string | null, fallback: AnalyticsPeriod): (typeof PERIODS)[number] =>
  PERIODS.find((period) => period.id === id) ?? PERIODS.find((period) => period.id === fallback) ?? PERIODS[1]

/** "Last 30 days" → "last 30 days"; "Today" and "All time" stay readable mid-sentence the same way. */
export const periodPhrase = (id: AnalyticsPeriod) => periodById(id, '30d').label.toLowerCase()

/** Labels and tooltip titles for bucket starts of any step ("yyyy-MM-ddTHH:mm", creator-local). A week runs seven days
 * from its start; the last one is cut at `end` (the period's end, as creator-local wall time) when that comes earlier. */
export function bucketLabels(starts: string[], step: AnalyticsStep, end?: Date) {
  const dates = starts.map(wallTime)
  if (step === 'hour') {
    const labels = dates.map((value) => hourLabel(value.getHours()))
    return { labels, titles: dates.map((value) => `${hourLabel(value.getHours())}–${hourLabel(value.getHours() + 1)}`) }
  }
  if (step === 'month') return { labels: dates.map((value) => month(value)), titles: dates.map((value) => monthYear(value)) }
  if (step === 'week') {
    return {
      labels: dates.map((value) => dateShort(value)),
      titles: dates.map((value) => {
        const last = new Date(value.getFullYear(), value.getMonth(), value.getDate() + 6)
        return `${dateShort(value)} – ${dateShort(end && end < last ? end : last)}`
      }),
    }
  }
  return { labels: dates.map((value) => dateShort(value)), titles: dates.map((value) => dateShort(value)) }
}

export const metricById = (id: string | null, fallback: AnalyticsMetric) =>
  METRICS.find((metric) => metric.id === id) ?? METRICS.find((metric) => metric.id === fallback) ?? METRICS[0]

export const valueOf = (totals: AnalyticsTotals, metric: AnalyticsMetric) =>
  metric === 'revenue' ? totals.revenueCents : totals[metric]

/** "yyyy-MM-ddTHH:mm" (creator-local wall time) as a Date whose local fields are those same numbers. */
export function wallTime(value: string) {
  const [day, clock = '00:00'] = value.split('T')
  const [year, monthIndex, dayOfMonth] = day.split('-').map(Number)
  const [hours, minutes] = clock.split(':').map(Number)
  return new Date(year, monthIndex - 1, dayOfMonth, hours, minutes)
}

/** An instant ("2026-10-04T22:00:00+00:00") as a Date whose local fields are the wall time in `timeZone`. */
export function inZone(instant: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(instant))
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
}

const pad = (value: number) => String(value).padStart(2, '0')
const hourLabel = (hour: number) => `${pad(hour % 24)}:00`

/** Formats an amount of one metric: money for revenue, a plain number otherwise. */
export const formatMetric = (metric: AnalyticsMetric, value: number, currency: string) =>
  metric === 'revenue' ? money(Math.round(value), currency, { decimals: false }) : number(Math.round(value))

/** "219 views", "1 email", "€58". */
export function describeMetric(metric: AnalyticsMetric, value: number, currency: string) {
  const def = METRICS.find((candidate) => candidate.id === metric)
  const rounded = Math.round(value)
  return def?.unit ? `${number(rounded)} ${rounded === 1 ? def.unit[0] : def.unit[1]}` : formatMetric(metric, value, currency)
}

/** Axis labels, tooltip titles and values for one metric, plus the period before it. */
export function chartOf(series: AnalyticsSeries, metric: AnalyticsMetric) {
  const pick = (buckets: AnalyticsBucket[]) => buckets.map((bucket) => valueOf(bucket, metric))
  if (series.period === 'today') {
    const hours = Array.from({ length: 24 }, (_, hour) => hour)
    const labels = hours.map(hourLabel)
    return {
      labels,
      titles: hours.map((hour) => `${hourLabel(hour)}–${hourLabel(hour + 1)}`),
      values: pick(series.buckets),
      previous: series.previousBuckets ? pick(series.previousBuckets) : null,
    }
  }
  const { labels, titles } = bucketLabels(
    series.buckets.map((bucket) => bucket.start),
    series.step,
    inZone(series.range.to, series.timezone),
  )
  return {
    labels,
    titles,
    values: pick(series.buckets),
    // "All time" has no previous period; a 6-month window has 6 monthly buckets before it.
    previous: series.previousBuckets ? pick(series.previousBuckets) : null,
  }
}

/** What the dashboard can be narrowed to: active and archived products (drafts have no numbers yet). */
export const scopeProducts = (products: Product[]) => products.filter((product) => product.status !== 'Draft')
