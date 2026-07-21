export type CampaignAudienceType = 'LandingPage' | 'Product'
export type CampaignStatus = 'Draft' | 'Queued'
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

export type CampaignListItem = {
  publicId: string
  subject: string
  status: CampaignStatus
  audienceType: CampaignAudienceType
  targetPublicId: string
  recipientCount: number
  queuedAt: string | null
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
}

export type FailedRecipient = {
  email: string
  lastError: string | null
}
