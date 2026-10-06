import { CalendarClock, Download, GraduationCap, MailPlus, ShoppingBag } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// One status vocabulary for the whole app (ported from the prototype's STATUS / PAGE_TYPES /
// PRODUCT_TYPES). Screens never pick badge colours; they map the API value to a key here.

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral' | 'outline' | 'solid-accent'

export type StatusKind =
  | 'order'
  | 'page'
  | 'product'
  | 'campaign'
  | 'payout'
  | 'subscriber'
  | 'template'
  | 'subscription'
  | 'connect'

/** [tone, label, live] — `live` adds the pulsing dot. */
type StatusEntry = readonly [BadgeTone, string, boolean?]

export const STATUS: Record<StatusKind, Record<string, StatusEntry>> = {
  order: { paid: ['success', 'Paid'], pending: ['warning', 'Pending'], failed: ['danger', 'Failed'], refunded: ['neutral', 'Refunded'] },
  page: { published: ['success', 'Published'], draft: ['neutral', 'Draft'], archived: ['outline', 'Archived'] },
  product: { active: ['success', 'Active'], draft: ['neutral', 'Draft'], archived: ['outline', 'Archived'] },
  campaign: {
    sent: ['success', 'Sent'],
    sending: ['info', 'Sending', true],
    scheduled: ['accent', 'Scheduled'],
    failed: ['danger', 'Failed'],
    cancelled: ['outline', 'Cancelled'],
  },
  payout: { pending: ['warning', 'Pending'], paid: ['success', 'Paid'], failed: ['danger', 'Failed'], cancelled: ['outline', 'Cancelled'] },
  subscriber: { active: ['success', 'Active'], unsubscribed: ['outline', 'Unsubscribed'] },
  template: { active: ['success', 'Active'], archived: ['outline', 'Archived'] },
  subscription: {
    active: ['success', 'Active'],
    unpaid: ['warning', 'Awaiting payment'],
    past_due: ['danger', 'Past due'],
    cancelling: ['info', 'Cancels at period end'],
  },
  connect: {
    enabled: ['success', 'Payouts enabled'],
    details_submitted: ['warning', 'In review'],
    not_started: ['neutral', 'Not connected'],
  },
}

export const PAGE_TYPES: Record<string, readonly [BadgeTone, string, LucideIcon]> = {
  lead: ['info', 'Lead capture', MailPlus],
  sales: ['accent', 'Sales', ShoppingBag],
}

export const PRODUCT_TYPES: Record<string, readonly [string, LucideIcon]> = {
  digital: ['Digital', Download],
  service: ['Service', CalendarClock],
  course: ['Course', GraduationCap],
}

// ---------------------------------------------------------------------------------------------
// API value → prototype key. Values the API can send that are NOT listed here fall through to the
// lower-cased raw value, which the badge renders as a plain, unstyled badge (the prototype's
// behaviour for unknown values). Report such values instead of inventing a colour for them.
// ---------------------------------------------------------------------------------------------

const lower = (value: string) => value.toLowerCase()

/** Order: Pending, Paid, Failed, Refunded. */
export const orderStatusKey = (apiValue: string) => lower(apiValue)

/** Landing page: Draft, Published, Archived. */
export const pageStatusKey = (apiValue: string) => lower(apiValue)

/** Landing page type: LeadGen → lead, Sales → sales. */
export const pageTypeKey = (apiValue: string) => (apiValue === 'LeadGen' ? 'lead' : lower(apiValue))

/** Product: Draft, Active, Archived. */
export const productStatusKey = (apiValue: string) => lower(apiValue)

/** Product type: Digital, Service, Course. */
export const productTypeKey = (apiValue: string) => lower(apiValue)

/** Payout: Pending, Paid, Failed, Cancelled. */
export const payoutStatusKey = (apiValue: string) => lower(apiValue)

/** Email template: Active, Archived. */
export const templateStatusKey = (apiValue: string) => lower(apiValue)

/** Subscriber: the API sends `isUnsubscribed`. */
export const subscriberStatusKey = (isUnsubscribed: boolean) => (isUnsubscribed ? 'unsubscribed' : 'active')

/**
 * Campaign: Scheduled, Failed, Cancelled as-is; Queued is `sending` (label "Sending {sent}/{recipients}")
 * while sent + failed < recipients, otherwise `sent`.
 */
export function campaignStatusKey(campaign: { status: string; sentCount: number; failedCount: number; recipientCount: number }) {
  if (campaign.status === 'Queued') {
    return campaign.sentCount + campaign.failedCount < campaign.recipientCount ? 'sending' : 'sent'
  }
  return lower(campaign.status)
}

export const campaignSendingLabel = (campaign: { sentCount: number; recipientCount: number }) =>
  `Sending ${campaign.sentCount}/${campaign.recipientCount}`

/**
 * Workspace subscription: PendingPayment → unpaid, PastDue → past_due, Active + cancelAtPeriodEnd → cancelling.
 * Past due lives on the subscription (`subscriptionStatus`); the workspace itself stays Active.
 */
export function subscriptionStatusKey(creator: { status: string; subscriptionStatus?: string | null; cancelAtPeriodEnd?: boolean }) {
  if (creator.status === 'PendingPayment' || creator.subscriptionStatus === 'PendingPayment') return 'unpaid'
  if (creator.subscriptionStatus === 'PastDue') return 'past_due'
  if (creator.status === 'Active') return creator.cancelAtPeriodEnd ? 'cancelling' : 'active'
  return lower(creator.status)
}

/** Stripe Connect: payouts enabled → enabled, details submitted → details_submitted, otherwise not_started. */
export function connectStatusKey(connect: { payoutsEnabled: boolean; detailsSubmitted: boolean }) {
  if (connect.payoutsEnabled) return 'enabled'
  if (connect.detailsSubmitted) return 'details_submitted'
  return 'not_started'
}
