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
}
