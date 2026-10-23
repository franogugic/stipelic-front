export type AnalyticsScope = 'page' | 'product' | 'workspace'
export type AnalyticsPeriod = 'today' | '7d' | '15d' | '30d' | '2m' | '3m' | '6m' | 'all'
export type AnalyticsMetric = 'views' | 'emails' | 'sales' | 'revenue' | 'downloads'

/** The bucket size: hours, days, 7-day weeks (2m / 3m), months from the period's first day (6m) or calendar months (all). */
export type AnalyticsStep = 'hour' | 'day' | 'week' | 'month'

export type AnalyticsTotals = {
  views: number
  emails: number
  sales: number
  revenueCents: number
  /** Download requests through personal links, on the day they happen (R6.2). */
  downloads: number
}

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
    downloads: { month: string; value: number } | null
  } | null
  /** Product scope only. */
  product: { refundCount: number; refundedCents: number; creatorRevenueCents: number } | null
  /** Workspace and product scope (R6.3); null for a page. */
  extras: SeriesExtras | null
}

/** The period only, no platform fee. */
export type SeriesExtras = {
  refundCount: number
  refundedCents: number
  /** Distinct buyers with a Paid order counted in the period. */
  customers: number
  /** The same for the previous window; null for "all". */
  previousCustomers: number | null
  /** Of `customers`: those with an earlier Paid order (product scope: of this product). */
  returningCustomers: number
  /** Distinct emails that signed up in the period (product scope: on its lead pages; workspace: new contacts). */
  signups: number
  /** Of `signups`: not unsubscribed now. */
  signupsStillSubscribed: number
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
  /** Products with revenue in the period. */
  productsWithSales: number
  /** Only when a `productId` was asked for: where that product stands, even beyond the listed 20. */
  selected: { publicId: string; name: string; revenueCents: number; sales: number; rank: number | null } | null
}

/** `GET …/analytics/pages` — the top pages of one period (and product). */
export type AnalyticsPages = {
  period: AnalyticsPeriod
  range: AnalyticsRange
  currency: string
  /** Non-archived pages in scope, with or without activity. */
  pageCount: number
  pages: Array<{
    publicId: string
    title: string
    slug: string
    type: 'Sales' | 'LeadGen'
    status: 'Published' | 'Draft'
    productPublicId: string | null
    productName: string | null
    productThumbnailUrl: string | null
    views: number
    emails: number
    sales: number
    revenueCents: number
  }>
}
