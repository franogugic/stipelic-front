export type AnalyticsScope = 'page' | 'product' | 'workspace'
export type AnalyticsPeriod = 'today' | '7d' | '15d' | '30d' | '2m' | '3m' | '6m' | 'all'
export type AnalyticsMetric = 'views' | 'emails' | 'sales' | 'revenue'

/** The bucket size: hours, days, 7-day weeks (2m / 3m / 6m) or calendar months (all time). */
export type AnalyticsStep = 'hour' | 'day' | 'week' | 'month'

export type AnalyticsTotals = { views: number; emails: number; sales: number; revenueCents: number }

export type AnalyticsBucket = AnalyticsTotals & {
  /** "yyyy-MM-ddTHH:mm", local to the creator's timezone. */
  start: string
}

export type AnalyticsRange = { from: string; to: string }

export type AnalyticsSeries = {
  scope: AnalyticsScope
  period: AnalyticsPeriod
  step: AnalyticsStep
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

/** What the period caption needs: the analytics series has all of it, the order and contact summaries most of it. */
export type PeriodWindow = {
  period: AnalyticsPeriod
  timezone: string
  /** When the workspace, page or product started — the start of "all". */
  since: string
  range: AnalyticsRange
  previousRange: AnalyticsRange | null
}

/** `GET …/analytics/products` — paid revenue per product in one period. */
export type ProductRevenueBreakdown = {
  period: AnalyticsPeriod
  range: AnalyticsRange
  currency: string
  /** Every product's revenue in the period: the listed ones and `otherRevenueCents`. */
  totalRevenueCents: number
  /** At most 20 products with revenue, best first. */
  products: Array<{ publicId: string; name: string; revenueCents: number; sales: number }>
  /** The revenue of the products beyond the listed ones. */
  otherRevenueCents: number
}
