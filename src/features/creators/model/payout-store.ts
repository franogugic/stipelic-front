import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { getPayoutCountries, startConnectOnboarding } from '../api/creators-api'
import {
  getPayoutProfile,
  getPayoutSummary,
  listPayouts,
  updatePayoutProfile,
} from '../api/payouts-api'
import type { Payout, PayoutCountry, PayoutProfile, PayoutSummary, UpdatePayoutProfileRequest } from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

type PayoutState = {
  payoutCountries: PayoutCountry[]
  payoutCountriesStatus: LoadStatus

  connectOnboardingStatus: SubmitStatus
  connectOnboardingError: string | null

  payoutSummary: PayoutSummary | null
  payoutSummaryStatus: LoadStatus
  payoutSummarySlug: string | null

  payoutHistory: Payout[]
  payoutHistoryStatus: LoadStatus
  payoutHistorySlug: string | null

  payoutProfile: PayoutProfile | null
  payoutProfileStatus: LoadStatus
  payoutProfileSlug: string | null

  updatePayoutProfileStatus: SubmitStatus
  updatePayoutProfileError: string | null

  loadPayoutCountries: () => Promise<void>
  startConnectOnboardingLink: () => Promise<string | null>
  loadPayoutSummary: (slug: string) => Promise<void>
  loadPayoutHistory: (slug: string) => Promise<void>
  loadPayoutProfile: (slug: string) => Promise<void>
  savePayoutProfile: (
    slug: string,
    request: UpdatePayoutProfileRequest,
  ) => Promise<PayoutProfile | null>
  resetUpdatePayoutProfileFeedback: () => void
  resetConnectOnboardingFeedback: () => void
}

export const usePayoutStore = create<PayoutState>((set, get) => ({
  payoutCountries: [],
  payoutCountriesStatus: 'idle',

  connectOnboardingStatus: 'idle',
  connectOnboardingError: null,

  payoutSummary: null,
  payoutSummaryStatus: 'idle',
  payoutSummarySlug: null,

  payoutHistory: [],
  payoutHistoryStatus: 'idle',
  payoutHistorySlug: null,

  payoutProfile: null,
  payoutProfileStatus: 'idle',
  payoutProfileSlug: null,

  updatePayoutProfileStatus: 'idle',
  updatePayoutProfileError: null,

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

  loadPayoutSummary: async (slug) => {
    const { payoutSummaryStatus, payoutSummarySlug } = get()
    if (payoutSummaryStatus === 'loading') return
    if (payoutSummaryStatus === 'success' && payoutSummarySlug === slug) return

    set({ payoutSummaryStatus: 'loading', payoutSummarySlug: slug })
    try {
      const summary = await getPayoutSummary(slug)
      set({ payoutSummary: summary, payoutSummaryStatus: 'success' })
    } catch {
      set({ payoutSummaryStatus: 'error' })
    }
  },

  loadPayoutHistory: async (slug) => {
    const { payoutHistoryStatus, payoutHistorySlug } = get()
    if (payoutHistoryStatus === 'loading') return
    if (payoutHistoryStatus === 'success' && payoutHistorySlug === slug) return

    set({ payoutHistoryStatus: 'loading', payoutHistorySlug: slug })
    try {
      const history = await listPayouts(slug)
      set({ payoutHistory: history, payoutHistoryStatus: 'success' })
    } catch {
      set({ payoutHistoryStatus: 'error' })
    }
  },

  loadPayoutProfile: async (slug) => {
    const { payoutProfileStatus, payoutProfileSlug } = get()
    if (payoutProfileStatus === 'loading') return
    if (payoutProfileStatus === 'success' && payoutProfileSlug === slug) return

    set({ payoutProfileStatus: 'loading', payoutProfileSlug: slug })
    try {
      const profile = await getPayoutProfile(slug)
      set({ payoutProfile: profile, payoutProfileStatus: 'success' })
    } catch {
      set({ payoutProfileStatus: 'error' })
    }
  },

  savePayoutProfile: async (slug, request) => {
    set({ updatePayoutProfileStatus: 'submitting', updatePayoutProfileError: null })
    try {
      const profile = await updatePayoutProfile(slug, request)
      set({
        payoutProfile: profile,
        payoutProfileStatus: 'success',
        payoutProfileSlug: slug,
        updatePayoutProfileStatus: 'success',
        updatePayoutProfileError: null,
      })
      return profile
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not save your payout details. Please try again.'
      set({ updatePayoutProfileStatus: 'error', updatePayoutProfileError: message })
      return null
    }
  },

  resetUpdatePayoutProfileFeedback: () => {
    set({ updatePayoutProfileStatus: 'idle', updatePayoutProfileError: null })
  },
  resetConnectOnboardingFeedback: () => {
    set({ connectOnboardingStatus: 'idle', connectOnboardingError: null })
  },
}))
