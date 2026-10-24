import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { getPayoutCountries, startConnectOnboarding } from '../api/creators-api'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

type PayoutState = {
  /** ISO country codes, as the API lists them. */
  payoutCountries: string[]
  payoutCountriesStatus: LoadStatus

  connectOnboardingStatus: SubmitStatus
  connectOnboardingError: string | null

  loadPayoutCountries: () => Promise<void>
  startConnectOnboardingLink: () => Promise<string | null>
  resetConnectOnboardingFeedback: () => void
  reset: () => void
}

const initialPayoutState = {
  payoutCountries: [] as string[],
  payoutCountriesStatus: 'idle' as LoadStatus,

  connectOnboardingStatus: 'idle' as SubmitStatus,
  connectOnboardingError: null,
}

/** The countries a workspace can be created in, and the Stripe Connect onboarding link. */
export const usePayoutStore = create<PayoutState>((set, get) => ({
  ...initialPayoutState,

  loadPayoutCountries: async () => {
    const currentStatus = get().payoutCountriesStatus
    if (currentStatus === 'loading' || currentStatus === 'success') return

    set({ payoutCountriesStatus: 'loading' })
    try {
      const countries = await getPayoutCountries()
      set({ payoutCountries: countries, payoutCountriesStatus: 'success' })
    } catch {
      set({ payoutCountriesStatus: 'error' })
    }
  },

  startConnectOnboardingLink: async () => {
    set({ connectOnboardingStatus: 'submitting', connectOnboardingError: null })
    try {
      const result = await startConnectOnboarding()
      set({ connectOnboardingStatus: 'success' })
      return result.url
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not start Stripe onboarding. Please try again.'
      set({ connectOnboardingStatus: 'error', connectOnboardingError: message })
      return null
    }
  },

  resetConnectOnboardingFeedback: () => {
    set({ connectOnboardingStatus: 'idle', connectOnboardingError: null })
  },
  reset: () => {
    set(initialPayoutState)
  },
}))
