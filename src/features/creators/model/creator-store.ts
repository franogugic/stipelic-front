import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { createCreator, getCurrentCreator, listCreatorPlans } from '../api/creators-api'
import type { CreateCreatorFormValues, Creator, CreatorPlan } from './types'

type CreatorCreateStatus = 'idle' | 'submitting' | 'success' | 'error'
type CreatorLoadStatus = 'idle' | 'loading' | 'success' | 'error'

type CreatorState = {
  createdCreator: Creator | null
  currentCreator: Creator | null
  currentCreatorStatus: CreatorLoadStatus
  creatorPlans: CreatorPlan[]
  creatorPlansStatus: CreatorLoadStatus
  creatorPlansError: string | null
  createStatus: CreatorCreateStatus
  createError: string | null
  loadCurrentCreator: () => Promise<Creator | null>
  loadCreatorPlans: () => Promise<void>
  createCreatorProfile: (values: CreateCreatorFormValues) => Promise<Creator | null>
  resetCreateCreatorFeedback: () => void
}

export const useCreatorStore = create<CreatorState>((set) => ({
  createdCreator: null,
  currentCreator: null,
  currentCreatorStatus: 'idle',
  creatorPlans: [],
  creatorPlansStatus: 'idle',
  creatorPlansError: null,
  createStatus: 'idle',
  createError: null,
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
  loadCreatorPlans: async () => {
    const currentStatus = useCreatorStore.getState().creatorPlansStatus
    if (currentStatus === 'loading' || currentStatus === 'success') {
      return
    }

    set({ creatorPlansStatus: 'loading', creatorPlansError: null })

    try {
      const plans = await listCreatorPlans()
      set({
        creatorPlans: [...plans].sort((first, second) => first.sortOrder - second.sortOrder),
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
  resetCreateCreatorFeedback: () => {
    set({ createStatus: 'idle', createError: null })
  },
}))
