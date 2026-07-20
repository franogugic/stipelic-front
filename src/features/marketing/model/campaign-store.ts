import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  getAudiencePreview,
  getCampaign,
  listCampaigns,
  sendCampaign,
} from '../api/campaigns-api'
import type {
  AudiencePreview,
  CampaignAudienceType,
  CampaignDetail,
  CampaignListItem,
  SendCampaignRequest,
} from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

type CampaignState = {
  campaigns: CampaignListItem[]
  campaignsStatus: LoadStatus
  campaignsSlug: string | null
  campaignsRevalidating: boolean

  currentCampaign: CampaignDetail | null
  currentCampaignStatus: LoadStatus

  audiencePreview: AudiencePreview | null
  audiencePreviewStatus: LoadStatus

  sendCampaignStatus: SubmitStatus
  sendCampaignError: string | null

  loadCampaigns: (slug: string) => Promise<void>
  loadCampaign: (slug: string, campaignPublicId: string) => Promise<void>
  clearCurrentCampaign: () => void
  loadAudiencePreview: (
    slug: string,
    audienceType: CampaignAudienceType,
    targetPublicId: string,
  ) => Promise<void>
  clearAudiencePreview: () => void
  sendCampaignForSlug: (slug: string, request: SendCampaignRequest) => Promise<CampaignDetail | null>
  resetSendCampaignFeedback: () => void
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  campaignsStatus: 'idle',
  campaignsSlug: null,
  campaignsRevalidating: false,

  currentCampaign: null,
  currentCampaignStatus: 'idle',

  audiencePreview: null,
  audiencePreviewStatus: 'idle',

  sendCampaignStatus: 'idle',
  sendCampaignError: null,

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
}))
