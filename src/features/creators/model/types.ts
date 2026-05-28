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
  publicId: string
  code: string
  name: string
  description: string
  currency: string
  monthlyPriceCents: number
  yearlyPriceCents: number
  limitsJson: string
  featuresJson: string
  sortOrder: number
}
