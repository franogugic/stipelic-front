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
  checkoutUrl: string | null
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

export type PayoutSummary = {
  currency: string
  balanceCents: number
  pendingPayoutCents: number
  minPayoutCents: number
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
