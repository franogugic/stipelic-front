import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  createCreator,
  deleteCurrentCreator,
  getCreatorSettings,
  getCurrentCreator,
  listCreatorPlans,
  startCreatorSubscriptionCheckout,
  updateCreatorSettings,
} from '../api/creators-api'
import type {
  CreateCreatorFormValues,
  CreateCreatorResult,
  Creator,
  CreatorPlan,
  CreatorSettings,
  CreatorSubscriptionCheckoutResult,
  UpdateCreatorSettingsRequest,
} from './types'

type CreatorCreateStatus = 'idle' | 'submitting' | 'success' | 'error'
type CreatorLoadStatus = 'idle' | 'loading' | 'success' | 'error'
type CreatorDeleteStatus = 'idle' | 'submitting' | 'success' | 'error'
type CreatorUpdateStatus = 'idle' | 'submitting' | 'success' | 'error'
type CreatorCheckoutStatus = 'idle' | 'submitting' | 'success' | 'error'

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
  updateSettingsStatus: CreatorUpdateStatus
  updateSettingsError: string | null
  createStatus: CreatorCreateStatus
  createError: string | null
  checkoutResult: CreatorSubscriptionCheckoutResult | null
  checkoutStatus: CreatorCheckoutStatus
  checkoutError: string | null
  deleteStatus: CreatorDeleteStatus
  deleteError: string | null
  loadCurrentCreator: () => Promise<Creator | null>
  loadCreatorPlans: () => Promise<void>
  loadCreatorSettings: (slug: string) => Promise<CreatorSettings | null>
  updateCreatorSettingsProfile: (
    slug: string,
    values: UpdateCreatorSettingsRequest,
  ) => Promise<CreatorSettings | null>
  createCreatorProfile: (values: CreateCreatorFormValues) => Promise<CreateCreatorResult | null>
  startCreatorCheckout: () => Promise<CreatorSubscriptionCheckoutResult | null>
  deleteCreatorProfile: () => Promise<boolean>
  resetCreateCreatorFeedback: () => void
  resetCreatorCheckoutFeedback: () => void
  resetDeleteCreatorFeedback: () => void
  resetUpdateCreatorSettingsFeedback: () => void
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
  updateSettingsStatus: 'idle',
  updateSettingsError: null,
  createStatus: 'idle',
  createError: null,
  checkoutResult: null,
  checkoutStatus: 'idle',
  checkoutError: null,
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
  updateCreatorSettingsProfile: async (slug, values) => {
    set({ updateSettingsStatus: 'submitting', updateSettingsError: null })

    try {
      const settings = await updateCreatorSettings(slug, values)
      set({
        creatorSettings: settings,
        creatorSettingsStatus: 'success',
        creatorSettingsError: null,
        updateSettingsStatus: 'success',
        updateSettingsError: null,
      })
      return settings
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not update creator settings. Please try again.'

      set({ updateSettingsStatus: 'error', updateSettingsError: message })
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
      const result = await createCreator(values)
      const { creator } = result
      set({
        createdCreator: creator,
        currentCreator: creator,
        currentCreatorStatus: 'success',
        checkoutResult: result.requiresPayment
          ? {
              requiresPayment: result.requiresPayment,
              paymentStatus: result.paymentStatus,
              checkoutUrl: result.checkoutUrl,
            }
          : null,
        createStatus: 'success',
        createError: null,
      })
      return result
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not create this creator profile. Please try again.'

      set({ createStatus: 'error', createError: message })
      return null
    }
  },
  startCreatorCheckout: async () => {
    set({ checkoutStatus: 'submitting', checkoutError: null })

    try {
      const checkout = await startCreatorSubscriptionCheckout()
      set({
        checkoutResult: checkout,
        checkoutStatus: 'success',
        checkoutError: null,
      })
      return checkout
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not start checkout. Please try again.'

      set({ checkoutStatus: 'error', checkoutError: message })
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
        checkoutResult: null,
        checkoutStatus: 'idle',
        checkoutError: null,
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
  resetCreatorCheckoutFeedback: () => {
    set({ checkoutStatus: 'idle', checkoutError: null })
  },
  resetDeleteCreatorFeedback: () => {
    set({ deleteStatus: 'idle', deleteError: null })
  },
  resetUpdateCreatorSettingsFeedback: () => {
    set({ updateSettingsStatus: 'idle', updateSettingsError: null })
  },
}))
