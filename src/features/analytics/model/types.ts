export type AnalyticsScope = 'page' | 'product'
export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'all'
export type AnalyticsMetric = 'views' | 'emails' | 'sales' | 'revenue'

export type AnalyticsTotals = { views: number; emails: number; sales: number; revenueCents: number }

export type AnalyticsBucket = AnalyticsTotals & {
  /** "yyyy-MM-ddTHH:mm", local to the creator's timezone. */
  start: string
}

export type AnalyticsRange = { from: string; to: string }

export type AnalyticsSeries = {
  scope: AnalyticsScope
  period: AnalyticsPeriod
  step: 'hour' | 'day' | 'month'
  timezone: string
  currency: string
  since: string
  range: AnalyticsRange
  previousRange: AnalyticsRange | null
  totals: AnalyticsTotals
  previousTotals: AnalyticsTotals | null
  buckets: AnalyticsBucket[]
  previousBuckets: AnalyticsBucket[] | null
  /** "all" only: the strongest month per metric (null when it is 0). */
  bestMonth: {
    views: { month: string; value: number } | null
    emails: { month: string; value: number } | null
    sales: { month: string; value: number } | null
    revenue: { month: string; value: number } | null
  } | null
  /** Product scope only. */
  product: { refundCount: number; refundedCents: number; creatorRevenueCents: number } | null
}
