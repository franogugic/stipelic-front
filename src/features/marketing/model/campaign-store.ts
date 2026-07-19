import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  createCampaign,
  deleteCampaign,
  getAudiencePreview,
  getCampaign,
  listCampaigns,
  sendCampaign,
  updateCampaign,
} from '../api/campaigns-api'
import type {
  AudiencePreview,
  CampaignAudienceType,
  CampaignDetail,
  CampaignListItem,
  SaveCampaignRequest,
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

  saveCampaignStatus: SubmitStatus
  saveCampaignError: string | null

  deleteCampaignStatus: SubmitStatus
  deleteCampaignError: string | null

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
  saveCampaign: (
    slug: string,
    campaignPublicId: string | null,
    request: SaveCampaignRequest,
  ) => Promise<CampaignDetail | null>
  resetSaveCampaignFeedback: () => void
  deleteCampaignForSlug: (slug: string, campaignPublicId: string) => Promise<boolean>
  resetDeleteCampaignFeedback: () => void
  sendCampaignForSlug: (slug: string, campaignPublicId: string) => Promise<CampaignDetail | null>
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

  saveCampaignStatus: 'idle',
  saveCampaignError: null,

  deleteCampaignStatus: 'idle',
  deleteCampaignError: null,

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

  saveCampaign: async (slug, campaignPublicId, request) => {
    set({ saveCampaignStatus: 'submitting', saveCampaignError: null })
    try {
      const campaign = campaignPublicId
        ? await updateCampaign(slug, campaignPublicId, request)
        : await createCampaign(slug, request)
      set({ saveCampaignStatus: 'success', saveCampaignError: null, currentCampaign: campaign })
      void get().loadCampaigns(slug)
      return campaign
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not save this campaign. Please try again.'
      set({ saveCampaignStatus: 'error', saveCampaignError: message })
      return null
    }
  },

  resetSaveCampaignFeedback: () => {
    set({ saveCampaignStatus: 'idle', saveCampaignError: null })
  },

  deleteCampaignForSlug: async (slug, campaignPublicId) => {
    set({ deleteCampaignStatus: 'submitting', deleteCampaignError: null })
    try {
      await deleteCampaign(slug, campaignPublicId)
      set({ deleteCampaignStatus: 'success', deleteCampaignError: null })
      void get().loadCampaigns(slug)
      return true
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not delete this campaign. Please try again.'
      set({ deleteCampaignStatus: 'error', deleteCampaignError: message })
      return false
    }
  },

  resetDeleteCampaignFeedback: () => {
    set({ deleteCampaignStatus: 'idle', deleteCampaignError: null })
  },

  sendCampaignForSlug: async (slug, campaignPublicId) => {
    set({ sendCampaignStatus: 'submitting', sendCampaignError: null })
    try {
      const campaign = await sendCampaign(slug, campaignPublicId)
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
