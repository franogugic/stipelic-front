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
}
