import type { AnalyticsPeriod, AnalyticsStep } from '../../analytics/model/types'

export type OrderStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded'

export interface Order {
  publicId: string
  /** Null while Pending: the buyer types it into Stripe Checkout and it arrives with the payment. */
  email: string | null
  name: string | null
  productName: string
  amountCents: number
  currency: string
  status: OrderStatus
  createdAt: string
  paidAt: string | null
  platformFeeCents: number
  netAmountCents: number
  landingPageTitle: string | null
}

export interface OrdersPage {
  orders: Order[]
  hasMore: boolean
}

export interface OrderSummary {
  paidOrderCount: number
  totalPaidAmountCents: number
  currency: string | null
  totalPlatformFeeCents: number
  netAmountCents: number
  refundedOrderCount: number
  /** Every order of the workspace, whatever its status (no filter applies). */
  totalOrderCount: number
  pendingOrderCount: number
  failedOrderCount: number
  /** Money returned to buyers: the sum over refunded orders. */
  refundedAmountCents: number
  /** The last 12 calendar months in the creator's timezone, oldest first, the current month last. */
  monthlyTrend: OrderMonthTrend[]
}

/** `GET …/orders/summary?period=` — the totals of one period and its chart buckets. */
export interface OrderPeriodSummary {
  period: AnalyticsPeriod
  step: AnalyticsStep
  timezone: string
  currency: string | null
  range: { from: string; to: string }
  paidOrderCount: number
  totalPaidAmountCents: number
  totalPlatformFeeCents: number
  netAmountCents: number
  refundedOrderCount: number
  refundedAmountCents: number
  pendingOrderCount: number
  failedOrderCount: number
  /** Paid + refunded + pending + failed in the period. */
  totalOrderCount: number
  /** Oldest first, zero-filled; `start` is "yyyy-MM-ddTHH:mm" in `timezone`. */
  buckets: Array<{ start: string; grossCents: number; netCents: number; refundedCount: number }>
}

export interface OrderMonthTrend {
  /** "yyyy-MM" */
  month: string
  grossCents: number
  feeCents: number
  netCents: number
  refundedCount: number
}

export interface HomeSummary {
  totalPaidAmountCents: number
  paidOrderCount: number
  currency: string | null
  productCount: number
  landingPageCount: number
  recentOrders: Order[]
  thisMonthRevenueCents: number
  topProduct: { name: string; totalCents: number } | null
  revenueTrend: number[]
  emailsSentThisMonth: number
  emailsMonthlyLimit: number
  totalPageViews: number
  subscriberCount: number
  viewsTrend: number[]
  monthlyRevenueTrend: number[]
  totalPlatformFeeCents: number
  /** Paid orders per calendar month, the last 12 (oldest first, the current month last). */
  monthlyPaidOrderCounts: number[]
  /** Distinct buyers over paid orders, all time. */
  customerCount: number
  refundedOrderCount: number
  refundedAmountCents: number
}

export type DashboardTrendRange = '30d' | '6m' | '12m'

/** `GET …/orders/dashboard-trends`: revenue and page views per day (30d) or per month (6m, 12m). */
export interface DashboardTrends {
  range: DashboardTrendRange
  granularity: 'day' | 'month'
  points: Array<{ bucketStart: string; revenueCents: number; views: number }>
}
