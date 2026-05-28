export type CreateCreatorFormValues = {
  name: string
  slug: string
  planCode: string
  defaultCurrency: 'EUR' | 'USD'
  configureSettingsOnStart: boolean
  supportEmail: string
  brandName: string
  logoUrl: string
  primaryColor: string
  timezone: string
  language: string
}

export type CreateCreatorRequest = CreateCreatorFormValues

export type Creator = {
  publicId: string
  name: string
  slug: string
  status: string
  defaultCurrency: string
  planCode: string
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
