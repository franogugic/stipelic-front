import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  archiveLandingPage,
  createLandingPage,
  getLandingPage,
  getLandingPageAnalytics,
  getLandingPageTimeSeries,
  getSectionTemplates,
  listLandingPages,
  publishLandingPage,
  restoreLandingPage,
  saveEditor,
  unpublishLandingPage,
} from '../api/landing-pages-api'
import type {
  CreateLandingPageRequest,
  LandingPage,
  LandingPageAnalytics,
  LandingPageWithSections,
  SaveEditorRequest,
  SectionTemplate,
  TimeSeriesPeriod,
  TimeSeriesResponse,
} from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type MutateStatus = 'idle' | 'submitting' | 'success' | 'error'

type LandingPageState = {
  pages: LandingPage[]
  currentPage: LandingPageWithSections | null
  templates: SectionTemplate[]
  analytics: Record<string, LandingPageAnalytics>
  timeSeries: TimeSeriesResponse | null
  timeSeriesStatus: LoadStatus
  // `${slug}:${pageId}` the current series belongs to — the analytics view uses it so a series
  // left over from another page's charts is never rendered while its own load is in flight.
  timeSeriesPageKey: string | null
  listStatus: LoadStatus
  pageStatus: LoadStatus
  pageError: string | null
  analyticsStatus: LoadStatus
  analyticsError: string | null
  mutateStatus: MutateStatus
  mutateError: string | null
  // 409 = a gating conflict (e.g. publish blocked on payout setup) — the editor uses this to render
  // a specific alert instead of a generic error message.
  mutateErrorStatus: number | null
  includeArchived: boolean

  loadPages: (slug: string, includeArchived?: boolean) => Promise<void>
  setIncludeArchived: (slug: string, includeArchived: boolean) => void
  loadPage: (slug: string, pageId: string) => Promise<void>
  loadTemplates: (slug: string) => Promise<void>
  // Also carries the page header (title/slug/status) — the analytics view uses this as its sole
  // data + status source instead of a separate lightweight page fetch.
  loadAnalytics: (slug: string, pageId: string) => Promise<void>
  loadTimeSeries: (slug: string, pageId: string, period: TimeSeriesPeriod) => Promise<void>
  createPage: (slug: string, request: CreateLandingPageRequest) => Promise<LandingPage | null>
  publishPage: (slug: string, pageId: string) => Promise<boolean>
  unpublishPage: (slug: string, pageId: string) => Promise<boolean>
  archivePage: (slug: string, pageId: string) => Promise<boolean>
  restorePage: (slug: string, pageId: string) => Promise<boolean>
  saveEditor: (slug: string, pageId: string, request: SaveEditorRequest) => Promise<LandingPageWithSections | null>
  resetMutateFeedback: () => void
  reset: () => void
}

// Monotonic token so only the latest time-series request may write its result — rapid period
// switches can resolve out of order.
let timeSeriesRequestId = 0

const initialLandingPageState = {
  pages: [] as LandingPage[],
  currentPage: null,
  templates: [] as SectionTemplate[],
  analytics: {} as Record<string, LandingPageAnalytics>,
  timeSeries: null,
  timeSeriesStatus: 'idle' as LoadStatus,
  timeSeriesPageKey: null,
  listStatus: 'idle' as LoadStatus,
  pageStatus: 'idle' as LoadStatus,
  pageError: null,
  analyticsStatus: 'idle' as LoadStatus,
  analyticsError: null,
  mutateStatus: 'idle' as MutateStatus,
  mutateError: null,
  mutateErrorStatus: null,
  includeArchived: false,
}

export const useLandingPageStore = create<LandingPageState>((set, get) => ({
  ...initialLandingPageState,

  loadPages: async (slug, includeArchived = false) => {
    set({ listStatus: 'loading', includeArchived })
    try {
      const pages = await listLandingPages(slug, includeArchived)
      set({ pages, listStatus: 'success' })
    } catch {
      set({ listStatus: 'error' })
    }
  },

  setIncludeArchived: (slug, includeArchived) => {
    set({ listStatus: 'idle', includeArchived })
    void useLandingPageStore.getState().loadPages(slug, includeArchived)
  },

  loadPage: async (slug, pageId) => {
    set({ pageStatus: 'loading', pageError: null })
    try {
      const page = await getLandingPage(slug, pageId)
      set({ currentPage: page, pageStatus: 'success' })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load landing page.'
      set({ pageStatus: 'error', pageError: message })
    }
  },

  loadAnalytics: async (slug, pageId) => {
    set({ analyticsStatus: 'loading', analyticsError: null })
    try {
      const data = await getLandingPageAnalytics(slug, pageId)
      set((s) => ({ analytics: { ...s.analytics, [pageId]: data }, analyticsStatus: 'success' }))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load analytics.'
      set({ analyticsStatus: 'error', analyticsError: message })
    }
  },

  loadTimeSeries: async (slug, pageId, period) => {
    const pageKey = `${slug}:${pageId}`
    const requestId = ++timeSeriesRequestId
    set((s) => ({
      timeSeriesStatus: 'loading',
      // Keep the previous period's series visible under the loading overlay for the same page;
      // drop it when the charts belong to a different page.
      timeSeries: s.timeSeriesPageKey === pageKey ? s.timeSeries : null,
      timeSeriesPageKey: pageKey,
    }))
    try {
      const data = await getLandingPageTimeSeries(slug, pageId, period)
      if (requestId !== timeSeriesRequestId) return
      set({ timeSeries: data, timeSeriesStatus: 'success' })
    } catch {
      if (requestId !== timeSeriesRequestId) return
      set({ timeSeriesStatus: 'error' })
    }
  },

  loadTemplates: async (slug) => {
    if (get().templates.length > 0) return
    try {
      const templates = await getSectionTemplates(slug)
      set({ templates })
    } catch {
      // non-critical
    }
  },

  createPage: async (slug, request) => {
    set({ mutateStatus: 'submitting', mutateError: null, mutateErrorStatus: null })
    try {
      const page = await createLandingPage(slug, request)
      set((s) => ({ pages: [page, ...s.pages], mutateStatus: 'success' }))
      return page
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create landing page.'
      set({ mutateStatus: 'error', mutateError: message, mutateErrorStatus: err instanceof ApiError ? err.status : null })
      return null
    }
  },

  publishPage: async (slug, pageId) => {
    set({ mutateStatus: 'submitting', mutateError: null, mutateErrorStatus: null })
    try {
      await publishLandingPage(slug, pageId)
      set((s) => ({
        pages: s.pages.map((p) => p.publicId === pageId ? { ...p, status: 'Published' as const } : p),
        currentPage: s.currentPage?.publicId === pageId ? { ...s.currentPage, status: 'Published' as const } : s.currentPage,
        mutateStatus: 'success',
      }))
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to publish landing page.'
      set({ mutateStatus: 'error', mutateError: message, mutateErrorStatus: err instanceof ApiError ? err.status : null })
      return false
    }
  },

  unpublishPage: async (slug, pageId) => {
    set({ mutateStatus: 'submitting', mutateError: null, mutateErrorStatus: null })
    try {
      await unpublishLandingPage(slug, pageId)
      set((s) => ({
        pages: s.pages.map((p) => p.publicId === pageId ? { ...p, status: 'Draft' as const } : p),
        currentPage: s.currentPage?.publicId === pageId ? { ...s.currentPage, status: 'Draft' as const } : s.currentPage,
        mutateStatus: 'success',
      }))
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to unpublish landing page.'
      set({ mutateStatus: 'error', mutateError: message, mutateErrorStatus: err instanceof ApiError ? err.status : null })
      return false
    }
  },

  archivePage: async (slug, pageId) => {
    set({ mutateStatus: 'submitting', mutateError: null, mutateErrorStatus: null })
    try {
      await archiveLandingPage(slug, pageId)
      set((s) => ({
        pages: s.includeArchived
          ? s.pages.map((p) => (p.publicId === pageId ? { ...p, status: 'Archived' as const } : p))
          : s.pages.filter((p) => p.publicId !== pageId),
        mutateStatus: 'success',
      }))
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to archive landing page.'
      set({ mutateStatus: 'error', mutateError: message, mutateErrorStatus: err instanceof ApiError ? err.status : null })
      return false
    }
  },

  restorePage: async (slug, pageId) => {
    set({ mutateStatus: 'submitting', mutateError: null, mutateErrorStatus: null })
    try {
      const restored = await restoreLandingPage(slug, pageId)
      set((s) => ({
        // The restore response carries no stats (views, sales, emails); keep the ones the list loaded.
        pages: s.pages.map((p) =>
          p.publicId === pageId
            ? {
                ...restored,
                totalViews: p.totalViews,
                uniqueVisitors: p.uniqueVisitors,
                purchaseCount: p.purchaseCount,
                totalRevenueCents: p.totalRevenueCents,
                captureCount: p.captureCount,
              }
            : p,
        ),
        mutateStatus: 'success',
      }))
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to restore landing page.'
      set({ mutateStatus: 'error', mutateError: message, mutateErrorStatus: err instanceof ApiError ? err.status : null })
      return false
    }
  },

  saveEditor: async (slug, pageId, request) => {
    set({ mutateStatus: 'submitting', mutateError: null, mutateErrorStatus: null })
    try {
      const page = await saveEditor(slug, pageId, request)
      set((s) => ({
        currentPage: page,
        pages: s.pages.map((p) => p.publicId === pageId ? { ...p, title: page.title, slug: page.slug, type: page.type, status: page.status } : p),
        mutateStatus: 'success',
      }))
      return page
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save.'
      set({ mutateStatus: 'error', mutateError: message, mutateErrorStatus: err instanceof ApiError ? err.status : null })
      return null
    }
  },

  resetMutateFeedback: () => set({ mutateStatus: 'idle', mutateError: null, mutateErrorStatus: null }),
  reset: () => set(initialLandingPageState),
}))
