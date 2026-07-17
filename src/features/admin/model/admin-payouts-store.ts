import { create } from 'zustand'
import { ApiError } from '../../../shared/api/http-client'
import {
  createPayout,
  getPayoutBalances,
  markPayoutFailed,
  markPayoutPaid,
} from '../api/admin-payouts-api'
import type {
  AdminPayout,
  CreatePayoutRequest,
  CreatorBalanceSummary,
  MarkPayoutFailedRequest,
  MarkPayoutPaidRequest,
} from './types'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

type AdminPayoutsState = {
  balances: CreatorBalanceSummary[]
  balancesStatus: LoadStatus
  balancesError: string | null

  // Payouts created/updated this session, keyed by creator public id — shown inline on the
  // creator's balance row (Pending → Mark Paid / Mark Failed) until the admin navigates away.
  activePayouts: Record<string, AdminPayout>

  actionStatus: SubmitStatus
  actionError: string | null

  loadBalances: (minCents?: number, limit?: number) => Promise<void>
  createPayoutForCreator: (request: CreatePayoutRequest) => Promise<AdminPayout | null>
  markPaid: (creatorPublicId: string, payoutPublicId: string, request: MarkPayoutPaidRequest) => Promise<AdminPayout | null>
  markFailed: (creatorPublicId: string, payoutPublicId: string, request: MarkPayoutFailedRequest) => Promise<AdminPayout | null>
  resetActionFeedback: () => void
}

export const useAdminPayoutsStore = create<AdminPayoutsState>((set) => ({
  balances: [],
  balancesStatus: 'idle',
  balancesError: null,

  activePayouts: {},

  actionStatus: 'idle',
  actionError: null,

  loadBalances: async (minCents, limit) => {
    set({ balancesStatus: 'loading', balancesError: null })
    try {
      const balances = await getPayoutBalances(minCents, limit)
      set({ balances, balancesStatus: 'success' })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not load payout balances. Please try again.'
      set({ balancesStatus: 'error', balancesError: message })
    }
  },

  createPayoutForCreator: async (request) => {
    set({ actionStatus: 'submitting', actionError: null })
    try {
      const payout = await createPayout(request)
      set((s) => ({
        actionStatus: 'success',
        actionError: null,
        activePayouts: { ...s.activePayouts, [request.creatorPublicId]: payout },
        balances: s.balances.map((b) =>
          b.creatorPublicId === request.creatorPublicId
            ? { ...b, balanceCents: b.balanceCents - request.amountCents }
            : b,
        ),
      }))
      return payout
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not create this payout. Please try again.'
      set({ actionStatus: 'error', actionError: message })
      return null
    }
  },

  markPaid: async (creatorPublicId, payoutPublicId, request) => {
    set({ actionStatus: 'submitting', actionError: null })
    try {
      const payout = await markPayoutPaid(payoutPublicId, request)
      set((s) => ({
        actionStatus: 'success',
        actionError: null,
        activePayouts: { ...s.activePayouts, [creatorPublicId]: payout },
      }))
      return payout
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not mark this payout as paid. Please try again.'
      set({ actionStatus: 'error', actionError: message })
      return null
    }
  },

  markFailed: async (creatorPublicId, payoutPublicId, request) => {
    set({ actionStatus: 'submitting', actionError: null })
    try {
      const payout = await markPayoutFailed(payoutPublicId, request)
      set((s) => ({
        actionStatus: 'success',
        actionError: null,
        activePayouts: { ...s.activePayouts, [creatorPublicId]: payout },
        // A failed payout compensates the creator's balance back — reload to reflect it accurately
        // (the Adjustment amount mirrors the original payout, so we can restore it optimistically).
        balances: s.balances.map((b) =>
          b.creatorPublicId === creatorPublicId ? { ...b, balanceCents: b.balanceCents + payout.amountCents } : b,
        ),
      }))
      return payout
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'We could not mark this payout as failed. Please try again.'
      set({ actionStatus: 'error', actionError: message })
      return null
    }
  },

  resetActionFeedback: () => set({ actionStatus: 'idle', actionError: null }),
}))
