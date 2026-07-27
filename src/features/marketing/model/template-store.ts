import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  archiveTemplate,
  createTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from '../api/templates-api'
import type { EmailTemplate, SaveTemplateRequest } from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

type TemplateState = {
  templates: EmailTemplate[]
  templatesStatus: LoadStatus
  templatesSlug: string | null
  templatesRevalidating: boolean

  currentTemplate: EmailTemplate | null
  currentTemplateStatus: LoadStatus

  saveTemplateStatus: SubmitStatus
  saveTemplateError: string | null

  archiveTemplateStatus: SubmitStatus
  archiveTemplateError: string | null

  loadTemplates: (slug: string) => Promise<void>
  loadTemplate: (slug: string, templatePublicId: string) => Promise<void>
  clearCurrentTemplate: () => void
  saveTemplate: (
    slug: string,
    templatePublicId: string | null,
    request: SaveTemplateRequest,
  ) => Promise<EmailTemplate | null>
  resetSaveTemplateFeedback: () => void
  archiveTemplateForSlug: (slug: string, templatePublicId: string) => Promise<boolean>
  resetArchiveTemplateFeedback: () => void
  reset: () => void
}

const initialTemplateState = {
  templates: [] as EmailTemplate[],
  templatesStatus: 'idle' as LoadStatus,
  templatesSlug: null,
  templatesRevalidating: false,

  currentTemplate: null,
  currentTemplateStatus: 'idle' as LoadStatus,

  saveTemplateStatus: 'idle' as SubmitStatus,
  saveTemplateError: null,

  archiveTemplateStatus: 'idle' as SubmitStatus,
  archiveTemplateError: null,
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

  loadTemplate: async (slug, templatePublicId) => {
    set({ currentTemplateStatus: 'loading' })
    try {
      const template = await getTemplate(slug, templatePublicId)
      set({ currentTemplate: template, currentTemplateStatus: 'success' })
    } catch {
      set({ currentTemplateStatus: 'error' })
    }
  },

  clearCurrentTemplate: () => {
    set({ currentTemplate: null, currentTemplateStatus: 'idle' })
  },

  saveTemplate: async (slug, templatePublicId, request) => {
    set({ saveTemplateStatus: 'submitting', saveTemplateError: null })
    try {
      const template = templatePublicId
        ? await updateTemplate(slug, templatePublicId, request)
        : await createTemplate(slug, request)
      set({ saveTemplateStatus: 'success', saveTemplateError: null, currentTemplate: template })
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
  reset: () => {
    set(initialTemplateState)
  },
}))
