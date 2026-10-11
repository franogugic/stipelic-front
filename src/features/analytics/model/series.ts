import { Eye, MailPlus, ShoppingBag, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { dateShort, month, monthYear, money, number } from '../../../shared/lib/format'
import type { AnalyticsBucket, AnalyticsMetric, AnalyticsPeriod, AnalyticsSeries, AnalyticsTotals } from './types'

export const PERIODS: Array<{ id: AnalyticsPeriod; label: string; days: number; compare: string | null; step: string }> = [
  { id: 'today', label: 'Today', days: 1, compare: 'same time yesterday', step: 'hour' },
  { id: '7d', label: 'Last 7 days', days: 7, compare: 'previous 7 days', step: 'day' },
  { id: '30d', label: 'Last 30 days', days: 30, compare: 'previous 30 days', step: 'day' },
  { id: 'all', label: 'All time', days: 365, compare: null, step: 'month' },
]

export const METRICS: Array<{ id: AnalyticsMetric; label: string; icon: LucideIcon; unit?: [string, string] }> = [
  { id: 'views', label: 'Views', icon: Eye, unit: ['view', 'views'] },
  { id: 'emails', label: 'Emails collected', icon: MailPlus, unit: ['email', 'emails'] },
  { id: 'sales', label: 'Sales', icon: ShoppingBag, unit: ['sale', 'sales'] },
  { id: 'revenue', label: 'Revenue', icon: Wallet },
]

export const periodById = (id: string | null, fallback: AnalyticsPeriod): (typeof PERIODS)[number] =>
  PERIODS.find((period) => period.id === id) ?? PERIODS.find((period) => period.id === fallback) ?? PERIODS[1]

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
  if (series.step === 'month') {
    const dates = series.buckets.map((bucket) => wallTime(bucket.start))
    return {
      labels: dates.map((value) => month(value)),
      titles: dates.map((value) => monthYear(value)),
      values: pick(series.buckets),
      previous: null,
    }
  }
  const dates = series.buckets.map((bucket) => wallTime(bucket.start))
  return {
    labels: dates.map((value) => dateShort(value)),
    titles: dates.map((value) => dateShort(value)),
    values: pick(series.buckets),
    previous: series.previousBuckets ? pick(series.previousBuckets) : null,
  }
}
