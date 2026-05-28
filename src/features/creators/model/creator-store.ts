import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  createCreator,
  deleteCurrentCreator,
  getCreatorSettings,
  getCurrentCreator,
  listCreatorPlans,
} from '../api/creators-api'
import type { CreateCreatorFormValues, Creator, CreatorPlan, CreatorSettings } from './types'

type CreatorCreateStatus = 'idle' | 'submitting' | 'success' | 'error'
type CreatorLoadStatus = 'idle' | 'loading' | 'success' | 'error'
type CreatorDeleteStatus = 'idle' | 'submitting' | 'success' | 'error'

type CreatorState = {
  createdCreator: Creator | null
  currentCreator: Creator | null
  currentCreatorStatus: CreatorLoadStatus
  creatorPlans: CreatorPlan[]
  creatorPlansStatus: CreatorLoadStatus
  creatorPlansError: string | null
  creatorSettings: CreatorSettings | null
  creatorSettingsStatus: CreatorLoadStatus
  creatorSettingsError: string | null
  createStatus: CreatorCreateStatus
  createError: string | null
  deleteStatus: CreatorDeleteStatus
  deleteError: string | null
  loadCurrentCreator: () => Promise<Creator | null>
  loadCreatorPlans: () => Promise<void>
  loadCreatorSettings: (slug: string) => Promise<CreatorSettings | null>
  createCreatorProfile: (values: CreateCreatorFormValues) => Promise<Creator | null>
  deleteCreatorProfile: () => Promise<boolean>
  resetCreateCreatorFeedback: () => void
  resetDeleteCreatorFeedback: () => void
}

export const useCreatorStore = create<CreatorState>((set) => ({
  createdCreator: null,
  currentCreator: null,
  currentCreatorStatus: 'idle',
  creatorPlans: [],
  creatorPlansStatus: 'idle',
  creatorPlansError: null,
  creatorSettings: null,
  creatorSettingsStatus: 'idle',
  creatorSettingsError: null,
  createStatus: 'idle',
  createError: null,
  deleteStatus: 'idle',
  deleteError: null,
  loadCurrentCreator: async () => {
    set({ currentCreatorStatus: 'loading' })

    try {
      const creator = await getCurrentCreator()
      const currentCreator = creator ?? null
      set({
        currentCreator,
        createdCreator: currentCreator,
        currentCreatorStatus: 'success',
      })
      return currentCreator
    } catch {
      set({ currentCreator: null, currentCreatorStatus: 'error' })
      return null
    }
  },
  loadCreatorSettings: async (slug) => {
    set({ creatorSettingsStatus: 'loading', creatorSettingsError: null })

    try {
      const settings = await getCreatorSettings(slug)
      set({
        creatorSettings: settings,
        creatorSettingsStatus: 'success',
        creatorSettingsError: null,
      })
      return settings
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not load creator settings. Please try again.'

      set({
        creatorSettings: null,
        creatorSettingsStatus: 'error',
        creatorSettingsError: message,
      })
      return null
    }
  },
  loadCreatorPlans: async () => {
    const currentStatus = useCreatorStore.getState().creatorPlansStatus
    if (currentStatus === 'loading' || currentStatus === 'success') {
      return
    }

    set({ creatorPlansStatus: 'loading', creatorPlansError: null })

    try {
      const plans = await listCreatorPlans()
      set({
        creatorPlans: plans,
        creatorPlansStatus: 'success',
        creatorPlansError: null,
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not load creator plans. Please try again.'

      set({ creatorPlansStatus: 'error', creatorPlansError: message })
    }
  },
  createCreatorProfile: async (values) => {
    set({ createStatus: 'submitting', createError: null })

    try {
      const creator = await createCreator(values)
      set({
        createdCreator: creator,
        currentCreator: creator,
        currentCreatorStatus: 'success',
        createStatus: 'success',
        createError: null,
      })
      return creator
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not create this creator profile. Please try again.'

      set({ createStatus: 'error', createError: message })
      return null
    }
  },
  deleteCreatorProfile: async () => {
    set({ deleteStatus: 'submitting', deleteError: null })

    try {
      await deleteCurrentCreator()
      set({
        createdCreator: null,
        currentCreator: null,
        creatorSettings: null,
        creatorSettingsStatus: 'idle',
        creatorSettingsError: null,
        currentCreatorStatus: 'success',
        deleteStatus: 'success',
        deleteError: null,
      })
      return true
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not delete this creator profile. Please try again.'

      set({ deleteStatus: 'error', deleteError: message })
      return false
    }
  },
  resetCreateCreatorFeedback: () => {
    set({ createStatus: 'idle', createError: null })
  },
  resetDeleteCreatorFeedback: () => {
    set({ deleteStatus: 'idle', deleteError: null })
  },
}))
