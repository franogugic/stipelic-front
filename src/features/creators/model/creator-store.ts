import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  cancelCreatorSubscription,
  createCreator,
  getCreatorBillingPortalUrl,
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
type CreatorCancelSubscriptionStatus = 'idle' | 'submitting' | 'success' | 'error'
type CreatorUpdateStatus = 'idle' | 'submitting' | 'success' | 'error'
type CreatorCheckoutStatus = 'idle' | 'submitting' | 'success' | 'error'
type PollActivationStatus = 'idle' | 'polling' | 'activated' | 'timeout'

const POLL_MAX_ATTEMPTS = 15
const POLL_INTERVAL_MS = 2000

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
  cancelSubscriptionStatus: CreatorCancelSubscriptionStatus
  cancelSubscriptionError: string | null
  pollActivationStatus: PollActivationStatus
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
  openBillingPortal: () => Promise<void>
  cancelSubscription: () => Promise<boolean>
  pollCreatorActivation: () => Promise<Creator | null>
  resetCreateCreatorFeedback: () => void
  resetCancelSubscriptionFeedback: () => void
  resetCreatorCheckoutFeedback: () => void
  resetDeleteCreatorFeedback: () => void
  resetUpdateCreatorSettingsFeedback: () => void
  resetPollActivation: () => void
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
  cancelSubscriptionStatus: 'idle',
  cancelSubscriptionError: null,
  pollActivationStatus: 'idle',

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

  openBillingPortal: async () => {
    try {
      const url = await getCreatorBillingPortalUrl()
      window.location.assign(url)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not open billing portal. Please try again.'
      console.error(message)
    }
  },

  cancelSubscription: async () => {
    set({ cancelSubscriptionStatus: 'submitting', cancelSubscriptionError: null })
    try {
      await cancelCreatorSubscription()
      const creator = await getCurrentCreator()
      set({
        currentCreator: creator ?? null,
        cancelSubscriptionStatus: 'success',
        cancelSubscriptionError: null,
      })
      return true
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not cancel the subscription. Please try again.'
      set({ cancelSubscriptionStatus: 'error', cancelSubscriptionError: message })
      return false
    }
  },

  pollCreatorActivation: async () => {
    set({ pollActivationStatus: 'polling' })

    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

      try {
        const creator = await getCurrentCreator()
        if (creator) {
          set({ currentCreator: creator, createdCreator: creator })

          if (creator.status.toLowerCase() === 'active') {
            set({ pollActivationStatus: 'activated' })
            return creator
          }
        }
      } catch {
        // Silently continue polling on transient errors
      }
    }

    set({ pollActivationStatus: 'timeout' })
    return null
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
  resetCancelSubscriptionFeedback: () => {
    set({ cancelSubscriptionStatus: 'idle', cancelSubscriptionError: null })
  },
  resetPollActivation: () => {
    set({ pollActivationStatus: 'idle' })
  },
}))
