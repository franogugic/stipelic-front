import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { getHomeSummary } from '../../orders/api/orders-api'
import {
  cancelScheduledCampaign,
  getAudiencePreview,
  getAudienceRecipients,
  getCampaignAudiences,
  getOpenRateTrend,
  getCampaign,
  getFailedRecipients,
  listCampaigns,
  resendFailedRecipients,
  sendCampaign,
} from '../api/campaigns-api'
import type {
  AudiencePreview,
  CampaignAudiences,
  CampaignAudienceType,
  CampaignDetail,
  CampaignListItem,
  FailedRecipient,
  OpenRateTrend,
  SendCampaignRequest,
} from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

const AUDIENCE_RECIPIENTS_PAGE_SIZE = 10
export const OPEN_RATE_TREND_MONTHS = 6

// Monthly email allowance; a negative limit means unlimited.
export type EmailUsage = { sent: number; limit: number }

type CampaignState = {
  campaigns: CampaignListItem[]
  campaignsStatus: LoadStatus
  campaignsSlug: string | null
  campaignsRevalidating: boolean

  currentCampaign: CampaignDetail | null
  currentCampaignStatus: LoadStatus

  audiences: CampaignAudiences | null
  audiencesStatus: LoadStatus
  audiencesSlug: string | null

  usage: EmailUsage | null

  openRateTrend: OpenRateTrend | null
  openRateTrendStatus: LoadStatus

  audiencePreview: AudiencePreview | null
  audiencePreviewStatus: LoadStatus

  audienceRecipients: string[]
  audienceRecipientsStatus: LoadStatus
  audienceRecipientsHasMore: boolean
  audienceRecipientsLoadMoreStatus: LoadStatus

  sendCampaignStatus: SubmitStatus
  sendCampaignError: string | null

  cancelScheduleStatus: SubmitStatus
  cancelScheduleError: string | null

  failedRecipients: FailedRecipient[]
  failedRecipientsStatus: LoadStatus

  resendFailedStatus: SubmitStatus
  resendFailedError: string | null

  loadCampaigns: (slug: string) => Promise<void>
  loadCampaign: (slug: string, campaignPublicId: string) => Promise<void>
  loadAudiences: (slug: string) => Promise<void>
  loadUsage: (slug: string) => Promise<void>
  loadOpenRateTrend: (slug: string) => Promise<void>
  clearCurrentCampaign: () => void
  loadAudiencePreview: (
    slug: string,
    audienceType: CampaignAudienceType,
    targetPublicId: string,
  ) => Promise<void>
  clearAudiencePreview: () => void
  loadAudienceRecipients: (
    slug: string,
    audienceType: CampaignAudienceType,
    targetPublicId: string,
  ) => Promise<void>
  loadMoreAudienceRecipients: (
    slug: string,
    audienceType: CampaignAudienceType,
    targetPublicId: string,
  ) => Promise<void>
  clearAudienceRecipients: () => void
  sendCampaignForSlug: (slug: string, request: SendCampaignRequest) => Promise<CampaignDetail | null>
  resetSendCampaignFeedback: () => void
  cancelScheduledCampaignForSlug: (slug: string, campaignPublicId: string) => Promise<boolean>
  resetCancelScheduleFeedback: () => void
  loadFailedRecipients: (slug: string, campaignPublicId: string) => Promise<void>
  clearFailedRecipients: () => void
  resendFailedForSlug: (slug: string, campaignPublicId: string) => Promise<number | null>
  resetResendFailedFeedback: () => void
  reset: () => void
}

const initialCampaignState = {
  campaigns: [] as CampaignListItem[],
  campaignsStatus: 'idle' as LoadStatus,
  campaignsSlug: null,
  campaignsRevalidating: false,

  currentCampaign: null,
  currentCampaignStatus: 'idle' as LoadStatus,

  audiences: null,
  audiencesStatus: 'idle' as LoadStatus,
  audiencesSlug: null,

  usage: null,

  openRateTrend: null,
  openRateTrendStatus: 'idle' as LoadStatus,

  audiencePreview: null,
  audiencePreviewStatus: 'idle' as LoadStatus,

  audienceRecipients: [] as string[],
  audienceRecipientsStatus: 'idle' as LoadStatus,
  audienceRecipientsHasMore: false,
  audienceRecipientsLoadMoreStatus: 'idle' as LoadStatus,

  sendCampaignStatus: 'idle' as SubmitStatus,
  sendCampaignError: null,

  cancelScheduleStatus: 'idle' as SubmitStatus,
  cancelScheduleError: null,

  failedRecipients: [] as FailedRecipient[],
  failedRecipientsStatus: 'idle' as LoadStatus,

  resendFailedStatus: 'idle' as SubmitStatus,
  resendFailedError: null,
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  ...initialCampaignState,

  loadCampaigns: async (slug) => {
    const { campaignsStatus, campaignsSlug, campaignsRevalidating } = get()
    if (campaignsStatus === 'loading' || campaignsRevalidating) return

    const revalidatingSilently = campaignsStatus === 'success' && campaignsSlug === slug
    if (revalidatingSilently) set({ campaignsRevalidating: true })
    else set({ campaignsStatus: 'loading', campaignsSlug: slug })

    try {
      const campaigns = await listCampaigns(slug)
      set({
        campaigns,
        campaignsStatus: 'success',
        campaignsSlug: slug,
        campaignsRevalidating: false,
      })
    } catch {
      if (revalidatingSilently) set({ campaignsRevalidating: false })
      else set({ campaignsStatus: 'error', campaignsRevalidating: false })
    }
  },

  loadCampaign: async (slug, campaignPublicId) => {
    set({ currentCampaignStatus: 'loading' })
    try {
      const campaign = await getCampaign(slug, campaignPublicId)
      set({ currentCampaign: campaign, currentCampaignStatus: 'success' })
    } catch {
      set({ currentCampaignStatus: 'error' })
    }
  },

  loadAudiences: async (slug) => {
    if (get().audiencesStatus === 'loading') return
    // Only the first load for a workspace shows a loading state; later refreshes swap the data in silently.
    if (get().audiences === null || get().audiencesSlug !== slug) {
      set({ audiences: null, audiencesStatus: 'loading', audiencesSlug: slug })
    }
    try {
      const audiences = await getCampaignAudiences(slug)
      set({ audiences, audiencesStatus: 'success', audiencesSlug: slug })
    } catch {
      set({ audiencesStatus: 'error' })
    }
  },

  loadUsage: async (slug) => {
    try {
      const summary = await getHomeSummary(slug)
      set({ usage: { sent: summary.emailsSentThisMonth, limit: summary.emailsMonthlyLimit } })
    } catch {
      // Usage is informational; keep whatever was last known rather than blocking the page.
    }
  },

  loadOpenRateTrend: async (slug) => {
    // Refreshes (after a send, on focus) keep showing the last chart instead of flashing a loader.
    if (get().openRateTrend === null) set({ openRateTrendStatus: 'loading' })
    try {
      const openRateTrend = await getOpenRateTrend(slug, OPEN_RATE_TREND_MONTHS)
      set({ openRateTrend, openRateTrendStatus: 'success' })
    } catch {
      if (get().openRateTrend === null) set({ openRateTrendStatus: 'error' })
    }
  },

  clearCurrentCampaign: () => {
    set({ currentCampaign: null, currentCampaignStatus: 'idle' })
  },

  loadAudiencePreview: async (slug, audienceType, targetPublicId) => {
    set({ audiencePreviewStatus: 'loading' })
    try {
      const preview = await getAudiencePreview(slug, audienceType, targetPublicId)
      set({ audiencePreview: preview, audiencePreviewStatus: 'success' })
    } catch {
      set({ audiencePreview: null, audiencePreviewStatus: 'error' })
    }
  },

  clearAudiencePreview: () => {
    set({ audiencePreview: null, audiencePreviewStatus: 'idle' })
  },

  loadAudienceRecipients: async (slug, audienceType, targetPublicId) => {
    set({ audienceRecipientsStatus: 'loading' })
    try {
      const page = await getAudienceRecipients(slug, audienceType, targetPublicId, {
        limit: AUDIENCE_RECIPIENTS_PAGE_SIZE,
      })
      set({
        audienceRecipients: page.emails,
        audienceRecipientsHasMore: page.hasMore,
        audienceRecipientsStatus: 'success',
      })
    } catch {
      set({ audienceRecipients: [], audienceRecipientsHasMore: false, audienceRecipientsStatus: 'error' })
    }
  },

  loadMoreAudienceRecipients: async (slug, audienceType, targetPublicId) => {
    const { audienceRecipients, audienceRecipientsLoadMoreStatus } = get()
    if (audienceRecipientsLoadMoreStatus === 'loading' || audienceRecipients.length === 0) return

    set({ audienceRecipientsLoadMoreStatus: 'loading' })
    try {
      const afterEmail = audienceRecipients[audienceRecipients.length - 1]
      const page = await getAudienceRecipients(slug, audienceType, targetPublicId, {
        afterEmail,
        limit: AUDIENCE_RECIPIENTS_PAGE_SIZE,
      })
      set({
        audienceRecipients: [...audienceRecipients, ...page.emails],
        audienceRecipientsHasMore: page.hasMore,
        audienceRecipientsLoadMoreStatus: 'success',
      })
    } catch {
      set({ audienceRecipientsLoadMoreStatus: 'error' })
    }
  },

  clearAudienceRecipients: () => {
    set({
      audienceRecipients: [],
      audienceRecipientsHasMore: false,
      audienceRecipientsStatus: 'idle',
      audienceRecipientsLoadMoreStatus: 'idle',
    })
  },

  sendCampaignForSlug: async (slug, request) => {
    set({ sendCampaignStatus: 'submitting', sendCampaignError: null })
    try {
      const campaign = await sendCampaign(slug, request)
      set({ sendCampaignStatus: 'success', sendCampaignError: null, currentCampaign: campaign })
      void get().loadCampaigns(slug)
      return campaign
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not send this campaign. Please try again.'
      set({ sendCampaignStatus: 'error', sendCampaignError: message })
      return null
    }
  },

  resetSendCampaignFeedback: () => {
    set({ sendCampaignStatus: 'idle', sendCampaignError: null })
  },

  cancelScheduledCampaignForSlug: async (slug, campaignPublicId) => {
    set({ cancelScheduleStatus: 'submitting', cancelScheduleError: null })
    try {
      await cancelScheduledCampaign(slug, campaignPublicId)
      set({ cancelScheduleStatus: 'success', cancelScheduleError: null })
      void get().loadCampaigns(slug)
      return true
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not cancel this send. Please try again.'
      set({ cancelScheduleStatus: 'error', cancelScheduleError: message })
      return false
    }
  },

  resetCancelScheduleFeedback: () => {
    set({ cancelScheduleStatus: 'idle', cancelScheduleError: null })
  },

  loadFailedRecipients: async (slug, campaignPublicId) => {
    set({ failedRecipientsStatus: 'loading' })
    try {
      const recipients = await getFailedRecipients(slug, campaignPublicId)
      set({ failedRecipients: recipients, failedRecipientsStatus: 'success' })
    } catch {
      set({ failedRecipients: [], failedRecipientsStatus: 'error' })
    }
  },

  clearFailedRecipients: () => {
    set({ failedRecipients: [], failedRecipientsStatus: 'idle' })
  },

  resendFailedForSlug: async (slug, campaignPublicId) => {
    set({ resendFailedStatus: 'submitting', resendFailedError: null })
    try {
      const result = await resendFailedRecipients(slug, campaignPublicId)
      set({ resendFailedStatus: 'success', resendFailedError: null })
      // Refetch this campaign's own progress and the failed-recipients list, and the send history
      // list (so its Failed(N) badge count reflects the requeue too).
      void get().loadCampaign(slug, campaignPublicId)
      void get().loadFailedRecipients(slug, campaignPublicId)
      void get().loadCampaigns(slug)
      return result.requeuedCount
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not resend failed recipients. Please try again.'
      set({ resendFailedStatus: 'error', resendFailedError: message })
      return null
    }
  },
  resetResendFailedFeedback: () => {
    set({ resendFailedStatus: 'idle', resendFailedError: null })
  },

  reset: () => {
    set(initialCampaignState)
  },
}))
