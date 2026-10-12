import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  archiveTemplate,
  createTemplate,
  getEmailTemplateStarters,
  listTemplates,
  restoreTemplate,
  updateTemplate,
} from '../api/templates-api'
import type { EmailTemplate, EmailTemplateStarter, SaveTemplateRequest } from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

type TemplateState = {
  templates: EmailTemplate[]
  templatesStatus: LoadStatus
  templatesSlug: string | null
  templatesRevalidating: boolean

  saveTemplateStatus: SubmitStatus
  saveTemplateError: string | null

  archiveTemplateStatus: SubmitStatus
  archiveTemplateError: string | null

  restoreTemplateStatus: SubmitStatus
  restoreTemplateError: string | null

  starters: EmailTemplateStarter[]
  startersStatus: LoadStatus

  loadTemplates: (slug: string) => Promise<void>
  loadStarters: (slug: string) => Promise<void>
  saveTemplate: (
    slug: string,
    templatePublicId: string | null,
    request: SaveTemplateRequest,
  ) => Promise<EmailTemplate | null>
  resetSaveTemplateFeedback: () => void
  archiveTemplateForSlug: (slug: string, templatePublicId: string) => Promise<boolean>
  resetArchiveTemplateFeedback: () => void
  restoreTemplateForSlug: (slug: string, templatePublicId: string) => Promise<boolean>
  reset: () => void
}

const initialTemplateState = {
  templates: [] as EmailTemplate[],
  templatesStatus: 'idle' as LoadStatus,
  templatesSlug: null,
  templatesRevalidating: false,

  saveTemplateStatus: 'idle' as SubmitStatus,
  saveTemplateError: null,

  archiveTemplateStatus: 'idle' as SubmitStatus,
  archiveTemplateError: null,

  restoreTemplateStatus: 'idle' as SubmitStatus,
  restoreTemplateError: null,

  starters: [] as EmailTemplateStarter[],
  startersStatus: 'idle' as LoadStatus,
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  ...initialTemplateState,

  loadTemplates: async (slug) => {
    const { templatesStatus, templatesSlug, templatesRevalidating } = get()
    if (templatesStatus === 'loading' || templatesRevalidating) return

    const revalidatingSilently = templatesStatus === 'success' && templatesSlug === slug
    if (revalidatingSilently) set({ templatesRevalidating: true })
    else set({ templatesStatus: 'loading', templatesSlug: slug })

    try {
      const templates = await listTemplates(slug)
      set({
        templates,
        templatesStatus: 'success',
        templatesSlug: slug,
        templatesRevalidating: false,
      })
    } catch {
      if (revalidatingSilently) set({ templatesRevalidating: false })
      else set({ templatesStatus: 'error', templatesRevalidating: false })
    }
  },

  loadStarters: async (slug) => {
    if (get().startersStatus === 'loading' || get().startersStatus === 'success') return
    set({ startersStatus: 'loading' })
    try {
      const starters = await getEmailTemplateStarters(slug)
      set({ starters, startersStatus: 'success' })
    } catch {
      set({ startersStatus: 'error' })
    }
  },

  saveTemplate: async (slug, templatePublicId, request) => {
    set({ saveTemplateStatus: 'submitting', saveTemplateError: null })
    try {
      const template = templatePublicId
        ? await updateTemplate(slug, templatePublicId, request)
        : await createTemplate(slug, request)
      set({ saveTemplateStatus: 'success', saveTemplateError: null })
      void get().loadTemplates(slug)
      return template
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not save this template. Please try again.'
      set({ saveTemplateStatus: 'error', saveTemplateError: message })
      return null
    }
  },

  resetSaveTemplateFeedback: () => {
    set({ saveTemplateStatus: 'idle', saveTemplateError: null })
  },

  archiveTemplateForSlug: async (slug, templatePublicId) => {
    set({ archiveTemplateStatus: 'submitting', archiveTemplateError: null })
    try {
      await archiveTemplate(slug, templatePublicId)
      set({ archiveTemplateStatus: 'success', archiveTemplateError: null })
      void get().loadTemplates(slug)
      return true
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not archive this template. Please try again.'
      set({ archiveTemplateStatus: 'error', archiveTemplateError: message })
      return false
    }
  },

  resetArchiveTemplateFeedback: () => {
    set({ archiveTemplateStatus: 'idle', archiveTemplateError: null })
  },

  restoreTemplateForSlug: async (slug, templatePublicId) => {
    set({ restoreTemplateStatus: 'submitting', restoreTemplateError: null })
    try {
      await restoreTemplate(slug, templatePublicId)
      set({ restoreTemplateStatus: 'success', restoreTemplateError: null })
      void get().loadTemplates(slug)
      return true
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not restore this template. Please try again.'
      set({ restoreTemplateStatus: 'error', restoreTemplateError: message })
      return false
    }
  },
  reset: () => {
    set(initialTemplateState)
  },
}))
