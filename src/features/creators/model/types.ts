export type CreateCreatorFormValues = {
  name: string
  slug: string
  planCode: string
  defaultCurrency: 'EUR' | 'USD'
  countryCode: string
  configureSettingsOnStart: boolean
  supportEmail: string
  brandName: string
  logoUrl: string
  primaryColor: string
  timezone: string
  language: string
}

export type CreateCreatorRequest = CreateCreatorFormValues

export type CreateCreatorResult = {
  creator: Creator
  requiresPayment: boolean
  paymentStatus: string
}

export type CreatorSubscriptionCheckoutResult = {
  requiresPayment: boolean
  paymentStatus: string
  checkoutUrl: string | null
}

export type PayoutMode = 'StripeConnect' | 'BankTransfer'

export type Creator = {
  publicId: string
  name: string
  slug: string
  status: string
  defaultCurrency: string
  planCode: string
  planName: string
  /** The current subscription's status; null when the workspace has none. */
  subscriptionStatus: 'PendingPayment' | 'Active' | 'PastDue' | null
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  countryCode: string
  payoutMode: PayoutMode
  stripeConnectDetailsSubmitted: boolean
  stripeConnectPayoutsEnabled: boolean
  hasPayoutProfile: boolean
  payoutReady: boolean
}

export type PayoutCountry = {
  code: string
  payoutMode: PayoutMode
}

export type ConnectOnboardingLinkResult = {
  url: string
}

export type CreatorPlan = {
  code: string
  name: string
  description: string | null
  status: string
  currency: string
  priceCents: number
  billingInterval: string
  platformFeeBasisPoints: number
  limits: Record<string, number>
}

export type CreatorSettings = {
  creatorPublicId: string
  creatorName: string
  slug: string
  defaultCurrency: string
  supportEmail: string
  brandName: string
  logoUrl: string
  primaryColor: string
  timezone: string
  language: string
}

export type UpdateCreatorSettingsRequest = {
  supportEmail: string
  brandName: string
  logoUrl: string
  primaryColor: string
  timezone: string
  language: string
}

export type PayoutStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled'

export type PendingPayoutRequest = {
  publicId: string
  amountCents: number
  requestedAt: string
}

export type PayoutSummary = {
  currency: string
  /** What can be requested now (open requests are already taken out). */
  balanceCents: number
  pendingPayoutCents: number
  minPayoutCents: number
  totalPaidOutCents: number
  /** The open request (at most one), or null. */
  pendingRequest: PendingPayoutRequest | null
}

export type PayoutSchedule = {
  interval: 'manual' | 'daily' | 'weekly' | 'monthly' | string
  delayDays: number
  weeklyAnchor: string | null
  monthlyAnchor: number | null
}

/** `GET …/payouts/connect`: nulls until onboarding has progressed (or Stripe can't be reached). */
export type ConnectPayoutDetails = {
  accountId: string | null
  detailsSubmittedAt: string | null
  payoutsEnabledAt: string | null
  payoutSchedule: PayoutSchedule | null
}

export type Payout = {
  publicId: string
  amountCents: number
  currency: string
  status: PayoutStatus
  bankReference: string | null
  note: string | null
  createdAt: string
  paidAt: string | null
}

export type PayoutProfile = {
  accountHolderName: string
  maskedIban: string
  bankCountryCode: string
}

export type UpdatePayoutProfileRequest = {
  accountHolderName: string
  iban: string
  bankCountryCode: string
}
