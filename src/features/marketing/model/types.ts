export type CampaignAudienceType = 'LandingPage' | 'Product'
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
  targetPublicId: string
  recipientCount: number
  queuedAt: string | null
  scheduledAt: string | null
  note: string | null
  createdAt: string
  sentCount: number
  failedCount: number
}

export type CampaignDetail = {
  publicId: string
  subject: string
  bodyText: string
  ctaLabel: string | null
  ctaUrl: string | null
  audienceType: CampaignAudienceType
  targetPublicId: string
  status: CampaignStatus
  recipientCount: number
  queuedAt: string | null
  scheduledAt: string | null
  note: string | null
  createdAt: string
  updatedAt: string
  sentCount: number
  failedCount: number
}

export type AudiencePreview = {
  recipientCount: number
  monthlyLimit: number
  usedThisMonth: number
  remaining: number
}

export type SendCampaignRequest = {
  templatePublicId: string
  audienceType: CampaignAudienceType
  targetPublicId: string
  scheduledAt?: string
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
