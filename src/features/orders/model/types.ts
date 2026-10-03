export type OrderStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded'

export interface Order {
  publicId: string
  email: string
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
}

export type DashboardTrendRange = '30d' | '6m' | '12m'

/** `GET …/orders/dashboard-trends`: revenue and page views per day (30d) or per month (6m, 12m). */
export interface DashboardTrends {
  range: DashboardTrendRange
  granularity: 'day' | 'month'
  points: Array<{ bucketStart: string; revenueCents: number; views: number }>
}
