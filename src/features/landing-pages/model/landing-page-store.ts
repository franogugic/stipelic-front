import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  archiveLandingPage,
  createLandingPage,
  getLandingPage,
  getSectionTemplates,
  listLandingPages,
  publishLandingPage,
  saveEditor,
  unpublishLandingPage,
} from '../api/landing-pages-api'
import type {
  CreateLandingPageRequest,
  LandingPage,
  LandingPageWithSections,
  SaveEditorRequest,
  SectionTemplate,
} from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type MutateStatus = 'idle' | 'submitting' | 'success' | 'error'

type LandingPageState = {
  pages: LandingPage[]
  currentPage: LandingPageWithSections | null
  templates: SectionTemplate[]
  listStatus: LoadStatus
  pageStatus: LoadStatus
  pageError: string | null
  mutateStatus: MutateStatus
  mutateError: string | null

  loadPages: (slug: string) => Promise<void>
  loadPage: (slug: string, pageId: string) => Promise<void>
  loadTemplates: (slug: string) => Promise<void>
  createPage: (slug: string, request: CreateLandingPageRequest) => Promise<LandingPage | null>
  publishPage: (slug: string, pageId: string) => Promise<boolean>
  unpublishPage: (slug: string, pageId: string) => Promise<boolean>
  archivePage: (slug: string, pageId: string) => Promise<boolean>
  saveEditor: (slug: string, pageId: string, request: SaveEditorRequest) => Promise<LandingPageWithSections | null>
  resetMutateFeedback: () => void
}

export const useLandingPageStore = create<LandingPageState>((set, get) => ({
  pages: [],
  currentPage: null,
  templates: [],
  listStatus: 'idle',
  pageStatus: 'idle',
  pageError: null,
  mutateStatus: 'idle',
  mutateError: null,

  loadPages: async (slug) => {
    set({ listStatus: 'loading' })
    try {
      const pages = await listLandingPages(slug)
      set({ pages, listStatus: 'success' })
    } catch {
      set({ listStatus: 'error' })
    }
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
    set({ mutateStatus: 'submitting', mutateError: null })
    try {
      const page = await createLandingPage(slug, request)
      set((s) => ({ pages: [page, ...s.pages], mutateStatus: 'success' }))
      return page
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create landing page.'
      set({ mutateStatus: 'error', mutateError: message })
      return null
    }
  },

  publishPage: async (slug, pageId) => {
    set({ mutateStatus: 'submitting', mutateError: null })
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
      set({ mutateStatus: 'error', mutateError: message })
      return false
    }
  },

  unpublishPage: async (slug, pageId) => {
    set({ mutateStatus: 'submitting', mutateError: null })
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
      set({ mutateStatus: 'error', mutateError: message })
      return false
    }
  },

  archivePage: async (slug, pageId) => {
    set({ mutateStatus: 'submitting', mutateError: null })
    try {
      await archiveLandingPage(slug, pageId)
      set((s) => ({ pages: s.pages.filter((p) => p.publicId !== pageId), mutateStatus: 'success' }))
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to archive landing page.'
      set({ mutateStatus: 'error', mutateError: message })
      return false
    }
  },

  saveEditor: async (slug, pageId, request) => {
    set({ mutateStatus: 'submitting', mutateError: null })
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
      set({ mutateStatus: 'error', mutateError: message })
      return null
    }
  },

  resetMutateFeedback: () => set({ mutateStatus: 'idle', mutateError: null }),
}))
