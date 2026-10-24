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
  stripeConnectDetailsSubmitted: boolean
  stripeConnectPayoutsEnabled: boolean
  /** Stripe reports payouts enabled on the workspace's connected account. */
  payoutReady: boolean
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
