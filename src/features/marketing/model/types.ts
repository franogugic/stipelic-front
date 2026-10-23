import type { AnalyticsPeriod, AnalyticsStep } from '../../analytics/model/types'
export type CampaignAudienceType = 'LandingPage' | 'Product' | 'All' | 'CampaignNonOpeners'

/** Up to five resends per campaign, within 30 days of the original. */
export const RESEND_LIMIT = 5

/** Why a non-opener resend is not possible right now (`NOT_SENT` and `IS_RESEND` mean the card is not shown at all). */
export type ResendReason =
  | 'TOO_EARLY'
  | 'TOO_LATE'
  | 'LIMIT_REACHED'
  | 'RESEND_PENDING'
  | 'NOT_SENT'
  | 'IS_RESEND'
  | 'NO_RECIPIENTS'

/** A resend as listed under its original. */
export type ResendHistoryItem = {
  publicId: string
  /** 1–5 */
  round: number
  status: CampaignStatus
  subject: string
  queuedAt: string | null
  scheduledAt: string | null
  recipientCount: number
  deliveredCount: number
  uniqueOpenCount: number
}

/** On the original's detail: where resending stands. Everything here is the server's answer, never recomputed. */
export type NonOpenerResend = {
  eligible: boolean
  reason: ResendReason | null
  /** The live size of the next resend: delivered, opened nothing yet, not unsubscribed. */
  recipientCount: number
  /** When the next resend becomes possible (24 h after the last send), and when the window closes (30 days). */
  eligibleFrom: string | null
  eligibleUntil: string | null
  used: number
  limit: number
  resends: ResendHistoryItem[]
}

/** Set on a resend (null on an original): which campaign it follows. */
export type ResendSource = { publicId: string; subject: string }
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
  description: string
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
  /** The original this is a resend of; null for originals. Averages and charts leave resends out. */
  sourceCampaignPublicId: string | null
  /** 1–5 for a resend, null for an original. */
  resendRound: number | null
  source: ResendSource | null
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
  sourceCampaignPublicId: string | null
  resendRound: number | null
  source: ResendSource | null
  /** Originals only; null on a resend. */
  nonOpenerResend: NonOpenerResend | null
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

/** `monthlyLimit` is negative for an unlimited plan; `remaining` is then meaningless. */
export type AudiencePreview = {
  recipientCount: number
  monthlyLimit: number
  usedThisMonth: number
  remaining: number
}

export type CampaignAudiences = {
  all: { recipientCount: number }
  landingPages: { publicId: string; title: string; recipientCount: number }[]
  products: { publicId: string; name: string; recipientCount: number }[]
}

export type FailedRecipient = {
  email: string
  lastError: string | null
}

export type ResendFailedResult = {
  requeuedCount: number
}

export type ContactSource = {
  landingPagePublicId: string
  title: string
}

export type Contact = {
  email: string
  firstCapturedAt: string
  sourcesCount: number
  /** The landing pages the contact signed up on. */
  sourceList: ContactSource[]
  isUnsubscribed: boolean
}

export type ContactsPage = {
  contacts: Contact[]
  hasMore: boolean
}

/** `GET …/contacts/stats` — all-time and unfiltered. */
export type ContactStats = {
  total: number
  active: number
  newThisMonth: number
  /** Opt-outs on record; can exceed `total - active` because opt-outs outlive a deleted contact. */
  unsubscribed: number
  /** The last 12 UTC months, oldest first, current month last; `total` is cumulative. `month` is "yyyy-MM". */
  growth: Array<{ month: string; total: number }>
  /** Landing pages (archived included) with at least one contact, most contacts first. */
  sources: Array<{ landingPagePublicId: string; title: string; count: number }>
  /** The same 12 months: contacts first captured, and opt-outs recorded, in each. */
  monthly: Array<{ month: string; joined: number; unsubscribed: number }>
}

/** `GET …/contacts/stats?period=` — the same all-time headline counts, with the growth cut to one period. */
export type ContactPeriodStats = {
  total: number
  active: number
  newThisMonth: number
  unsubscribed: number
  sources: ContactStats['sources']
  period: AnalyticsPeriod
  step: AnalyticsStep
  timezone: string
  range: { from: string; to: string }
  /** Oldest first, zero-filled; `start` is "yyyy-MM-ddTHH:mm" in `timezone`. `total` is the running size of the list at the end of the bucket. */
  buckets: Array<{ start: string; joined: number; unsubscribed: number; total: number }>
}
