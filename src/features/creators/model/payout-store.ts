import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import { getPayoutCountries, startConnectOnboarding } from '../api/creators-api'
import {
  cancelPayoutRequest,
  getPayoutProfile,
  getPayoutSummary,
  listPayouts,
  requestPayout,
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
  payoutSummaryRevalidating: boolean

  payoutHistory: Payout[]
  payoutHistoryStatus: LoadStatus
  payoutHistorySlug: string | null
  payoutHistoryRevalidating: boolean

  payoutProfile: PayoutProfile | null
  payoutProfileStatus: LoadStatus
  payoutProfileSlug: string | null
  payoutProfileRevalidating: boolean

  updatePayoutProfileStatus: SubmitStatus
  updatePayoutProfileError: string | null

  requestPayoutStatus: SubmitStatus
  requestPayoutError: string | null

  cancelPayoutStatus: SubmitStatus
  cancelPayoutError: string | null

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
  requestPayoutForSlug: (slug: string, amountCents: number | null) => Promise<Payout | null>
  cancelPayoutRequestForSlug: (slug: string, payoutPublicId: string) => Promise<Payout | null>
  resetRequestPayoutFeedback: () => void
  resetCancelPayoutFeedback: () => void
  reset: () => void
}

const initialPayoutState = {
  payoutCountries: [] as PayoutCountry[],
  payoutCountriesStatus: 'idle' as LoadStatus,

  connectOnboardingStatus: 'idle' as SubmitStatus,
  connectOnboardingError: null,

  payoutSummary: null,
  payoutSummaryStatus: 'idle' as LoadStatus,
  payoutSummarySlug: null,
  payoutSummaryRevalidating: false,

  payoutHistory: [] as Payout[],
  payoutHistoryStatus: 'idle' as LoadStatus,
  payoutHistorySlug: null,
  payoutHistoryRevalidating: false,

  payoutProfile: null,
  payoutProfileStatus: 'idle' as LoadStatus,
  payoutProfileSlug: null,
  payoutProfileRevalidating: false,

  updatePayoutProfileStatus: 'idle' as SubmitStatus,
  updatePayoutProfileError: null,

  requestPayoutStatus: 'idle' as SubmitStatus,
  requestPayoutError: null,

  cancelPayoutStatus: 'idle' as SubmitStatus,
  cancelPayoutError: null,
}

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

  loadPayoutSummary: async (slug) => {
    const { payoutSummaryStatus, payoutSummarySlug, payoutSummaryRevalidating } = get()
    if (payoutSummaryStatus === 'loading' || payoutSummaryRevalidating) return

    // Stale-while-revalidate: balance changes server-side (purchases, payouts), so every call
    // refetches — but with data already on screen for this slug we do it silently, without
    // flipping to 'loading', so the card never flickers back to a spinner.
    const revalidatingSilently = payoutSummaryStatus === 'success' && payoutSummarySlug === slug
    if (revalidatingSilently) set({ payoutSummaryRevalidating: true })
    else set({ payoutSummaryStatus: 'loading', payoutSummarySlug: slug })

    try {
      const summary = await getPayoutSummary(slug)
      set({
        payoutSummary: summary,
        payoutSummaryStatus: 'success',
        payoutSummarySlug: slug,
        payoutSummaryRevalidating: false,
      })
    } catch {
      // A failed silent refresh keeps showing the last known balance.
      if (revalidatingSilently) set({ payoutSummaryRevalidating: false })
      else set({ payoutSummaryStatus: 'error', payoutSummaryRevalidating: false })
    }
  },

  loadPayoutHistory: async (slug) => {
    const { payoutHistoryStatus, payoutHistorySlug, payoutHistoryRevalidating } = get()
    if (payoutHistoryStatus === 'loading' || payoutHistoryRevalidating) return

    const revalidatingSilently = payoutHistoryStatus === 'success' && payoutHistorySlug === slug
    if (revalidatingSilently) set({ payoutHistoryRevalidating: true })
    else set({ payoutHistoryStatus: 'loading', payoutHistorySlug: slug })

    try {
      const history = await listPayouts(slug)
      set({
        payoutHistory: history,
        payoutHistoryStatus: 'success',
        payoutHistorySlug: slug,
        payoutHistoryRevalidating: false,
      })
    } catch {
      if (revalidatingSilently) set({ payoutHistoryRevalidating: false })
      else set({ payoutHistoryStatus: 'error', payoutHistoryRevalidating: false })
    }
  },

  loadPayoutProfile: async (slug) => {
    const { payoutProfileStatus, payoutProfileSlug, payoutProfileRevalidating } = get()
    if (payoutProfileStatus === 'loading' || payoutProfileRevalidating) return

    const revalidatingSilently = payoutProfileStatus === 'success' && payoutProfileSlug === slug
    if (revalidatingSilently) set({ payoutProfileRevalidating: true })
    else set({ payoutProfileStatus: 'loading', payoutProfileSlug: slug })

    try {
      const profile = await getPayoutProfile(slug)
      set({
        payoutProfile: profile,
        payoutProfileStatus: 'success',
        payoutProfileSlug: slug,
        payoutProfileRevalidating: false,
      })
    } catch {
      if (revalidatingSilently) set({ payoutProfileRevalidating: false })
      else set({ payoutProfileStatus: 'error', payoutProfileRevalidating: false })
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

  requestPayoutForSlug: async (slug, amountCents) => {
    set({ requestPayoutStatus: 'submitting', requestPayoutError: null })
    try {
      const payout = await requestPayout(slug, amountCents)
      set({ requestPayoutStatus: 'success', requestPayoutError: null })
      void get().loadPayoutSummary(slug)
      void get().loadPayoutHistory(slug)
      return payout
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not submit your payout request. Please try again.'
      set({ requestPayoutStatus: 'error', requestPayoutError: message })
      return null
    }
  },

  cancelPayoutRequestForSlug: async (slug, payoutPublicId) => {
    set({ cancelPayoutStatus: 'submitting', cancelPayoutError: null })
    try {
      const payout = await cancelPayoutRequest(slug, payoutPublicId)
      set({ cancelPayoutStatus: 'success', cancelPayoutError: null })
      void get().loadPayoutSummary(slug)
      void get().loadPayoutHistory(slug)
      return payout
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'We could not cancel this payout request. Please try again.'
      set({ cancelPayoutStatus: 'error', cancelPayoutError: message })
      return null
    }
  },

  resetRequestPayoutFeedback: () => {
    set({ requestPayoutStatus: 'idle', requestPayoutError: null })
  },
  resetCancelPayoutFeedback: () => {
    set({ cancelPayoutStatus: 'idle', cancelPayoutError: null })
  },
  reset: () => {
    set(initialPayoutState)
  },
}))
