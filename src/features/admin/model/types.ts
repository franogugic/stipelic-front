export type PayoutStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled'

export type AdminPayout = {
  publicId: string
  amountCents: number
  currency: string
  status: PayoutStatus
  bankReference: string | null
  note: string | null
  createdAt: string
  paidAt: string | null
}

export type CreatorBalanceSummary = {
  creatorPublicId: string
  name: string
  slug: string
  currency: string
  balanceCents: number
  hasPayoutProfile: boolean
}

export type CreatePayoutRequest = {
  creatorPublicId: string
  amountCents: number
  currency: string
  note?: string
}

export type MarkPayoutPaidRequest = {
  bankReference: string
}

export type MarkPayoutFailedRequest = {
  note?: string
}
