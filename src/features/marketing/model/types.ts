export type CampaignAudienceType = 'LandingPage' | 'Product' | 'All'
export type CampaignStatus = 'Draft' | 'Queued' | 'Scheduled' | 'Failed' | 'Cancelled'
export type EmailTemplateStatus = 'Active' | 'Archived'

export type EmailTemplate = {
  publicId: string
  name: string
  subject: string
  bodyText: string
  ctaLabel: string | null
  ctaUrl: string | null
  status: EmailTemplateStatus
  createdAt: string
  updatedAt: string
}

export type SaveTemplateRequest = {
  name: string
  subject: string
  bodyText: string
  ctaLabel: string | null
  ctaUrl: string | null
}

export type EmailTemplateStarter = {
  key: string
  name: string
  subject: string
  bodyText: string
  ctaLabel: string | null
  ctaUrl: string | null
}

export type CampaignListItem = {
  publicId: string
  subject: string
  status: CampaignStatus
  audienceType: CampaignAudienceType
  // Null for the All audience, which targets neither a landing page nor a product.
  targetPublicId: string | null
  recipientCount: number
  queuedAt: string | null
  scheduledAt: string | null
  note: string | null
  createdAt: string
  sentCount: number
  failedCount: number
  uniqueOpenCount: number
}

export type CampaignDetail = {
  publicId: string
  subject: string
  bodyText: string
  ctaLabel: string | null
  ctaUrl: string | null
  audienceType: CampaignAudienceType
  targetPublicId: string | null
  status: CampaignStatus
  recipientCount: number
  queuedAt: string | null
  scheduledAt: string | null
  note: string | null
  createdAt: string
  updatedAt: string
  sentCount: number
  failedCount: number
  uniqueOpenCount: number
}

export type AudiencePreview = {
  recipientCount: number
  monthlyLimit: number
  usedThisMonth: number
  remaining: number
}

// Content is either taken from a template (`templatePublicId` alone) or sent inline (`subject` +
// `bodyText`, CTA label and URL both-or-neither); inline content wins and the template, if also
// given, is only kept as a reference. `targetPublicId` is omitted for the All audience.
export type SendCampaignRequest = {
  templatePublicId?: string
  subject?: string
  bodyText?: string
  ctaLabel?: string
  ctaUrl?: string
  audienceType: CampaignAudienceType
  targetPublicId?: string
  scheduledAt?: string
}

export type CampaignAudiences = {
  all: { recipientCount: number }
  landingPages: { publicId: string; title: string; recipientCount: number }[]
  products: { publicId: string; name: string; recipientCount: number }[]
}

export type OpenRateTrendPoint = {
  // "yyyy-MM" (UTC)
  month: string
  // Ratio 0–1, null when nothing was delivered that month.
  rate: number | null
  sent: number
  opens: number
}

export type OpenRateTrend = {
  points: OpenRateTrendPoint[]
  currentRate: number | null
  averageRate: number | null
}

export type FailedRecipient = {
  email: string
  lastError: string | null
}

export type ResendFailedResult = {
  requeuedCount: number
}

export type Contact = {
  email: string
  firstCapturedAt: string
  sourcesCount: number
  sources: string
  isUnsubscribed: boolean
}

export type ContactsPage = {
  contacts: Contact[]
  hasMore: boolean
}

export type AudienceRecipientsPage = {
  emails: string[]
  hasMore: boolean
}
