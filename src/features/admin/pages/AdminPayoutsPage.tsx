import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminPayoutsStore } from '../model/admin-payouts-store'
import type { AdminPayout, CreatorBalanceSummary } from '../model/types'

export function AdminPayoutsPage() {
  const navigate = useNavigate()
  const balances = useAdminPayoutsStore((s) => s.balances)
  const balancesStatus = useAdminPayoutsStore((s) => s.balancesStatus)
  const balancesError = useAdminPayoutsStore((s) => s.balancesError)
  const loadBalances = useAdminPayoutsStore((s) => s.loadBalances)

  const [minCents, setMinCents] = useState(5000)

  useEffect(() => {
    void loadBalances(minCents)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLoading = balancesStatus === 'loading' || balancesStatus === 'idle'

  return (
    <div className="relative min-h-screen bg-neutral-950 light:bg-neutral-100">
      <div className="bg-grid pointer-events-none fixed inset-0 opacity-[0.04]" />

      <header className="relative flex h-14 items-center gap-4 border-b border-white/10 bg-neutral-950 px-6 light:border-neutral-200 light:bg-white">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex size-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white light:text-neutral-400 light:hover:bg-neutral-100 light:hover:text-neutral-700"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-white light:bg-neutral-950">
            <Banknote size={14} className="text-neutral-950 light:text-white" />
          </span>
          <p className="text-sm font-semibold text-white light:text-neutral-950">Payout administration</p>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white light:text-neutral-950">
              BankTransfer balances
            </h1>
            <p className="mt-1 text-sm text-white/40 light:text-neutral-400">
              Creators with a platform-held balance at or above the minimum payout threshold.
            </p>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => { e.preventDefault(); void loadBalances(minCents) }}
          >
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70 light:border-neutral-200 light:bg-white light:text-neutral-600">
              Min. balance (cents)
              <input
                type="number"
                min={0}
                value={minCents}
                onChange={(e) => setMinCents(Number(e.target.value))}
                className="w-24 bg-transparent text-right font-mono text-white outline-none light:text-neutral-950"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent-strong light:text-neutral-950"
            >
              <Search size={14} />
              Filter
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading balances…
          </div>
        ) : balancesStatus === 'error' ? (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-6 light:border-red-200 light:bg-red-50">
            <p className="text-sm font-semibold text-red-200 light:text-red-800">Could not load balances</p>
            <p className="mt-1 text-sm text-red-300 light:text-red-700">{balancesError}</p>
          </div>
        ) : balances.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center light:border-neutral-300">
            <p className="text-sm text-white/40 light:text-neutral-400">
              No creators currently have a balance at or above this threshold.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {balances.map((balance) => (
              <BalanceRow key={balance.creatorPublicId} balance={balance} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

/* ─── Row ─────────────────────────────────────────────────────── */

function BalanceRow({ balance }: { balance: CreatorBalanceSummary }) {
  const activePayouts = useAdminPayoutsStore((s) => s.activePayouts)
  const activePayout = activePayouts[balance.creatorPublicId]

  const [isCreating, setIsCreating] = useState(false)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white light:text-neutral-950">{balance.name}</p>
          <p className="mt-0.5 font-mono text-xs text-white/40 light:text-neutral-400">/{balance.slug}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-lg font-bold tabular-nums text-white light:text-neutral-950">
              {formatCurrency(balance.balanceCents, balance.currency)}
            </p>
            <p className="text-xs text-white/40 light:text-neutral-400">available balance</p>
          </div>
          {!balance.hasPayoutProfile ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 light:bg-amber-50 light:text-amber-700">
              <AlertTriangle size={12} />
              No payout profile
            </span>
          ) : !activePayout && !isCreating ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong light:text-neutral-950"
            >
              Create payout
            </button>
          ) : null}
        </div>
      </div>

      {isCreating && !activePayout ? (
        <CreatePayoutForm
          balance={balance}
          onClose={() => setIsCreating(false)}
        />
      ) : null}

      {activePayout ? <ActivePayoutPanel creatorPublicId={balance.creatorPublicId} payout={activePayout} /> : null}
    </div>
  )
}

/* ─── Create payout ──────────────────────────────────────────── */

function CreatePayoutForm({
  balance,
  onClose,
}: {
  balance: CreatorBalanceSummary
  onClose: () => void
}) {
  const createPayoutForCreator = useAdminPayoutsStore((s) => s.createPayoutForCreator)
  const actionStatus = useAdminPayoutsStore((s) => s.actionStatus)
  const actionError = useAdminPayoutsStore((s) => s.actionError)
  const resetActionFeedback = useAdminPayoutsStore((s) => s.resetActionFeedback)

  const [amount, setAmount] = useState(String(balance.balanceCents / 100))
  const [note, setNote] = useState('')
  const isSubmitting = actionStatus === 'submitting'

  const amountCents = Math.round(Number(amount) * 100)
  const canSubmit = Number.isFinite(amountCents) && amountCents > 0 && amountCents <= balance.balanceCents && !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const payout = await createPayoutForCreator({
      creatorPublicId: balance.creatorPublicId,
      amountCents,
      currency: balance.currency,
      note,
    })
    if (payout) onClose()
  }

  return (
    <form
      className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 light:border-neutral-200 light:bg-neutral-50"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-white/60 light:text-neutral-600">Amount ({balance.currency})</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => { resetActionFeedback(); setAmount(e.target.value) }}
            className="h-9 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-white/25 light:border-neutral-200 light:bg-white light:text-neutral-950"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-white/60 light:text-neutral-600">Note (optional)</label>
          <input
            type="text"
            value={note}
            maxLength={500}
            onChange={(e) => { resetActionFeedback(); setNote(e.target.value) }}
            placeholder="e.g. July payout"
            className="h-9 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25 light:border-neutral-200 light:bg-white light:text-neutral-950 light:placeholder-neutral-400"
          />
        </div>
      </div>

      {actionError ? <p className="text-xs text-red-400 light:text-red-600">{actionError}</p> : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-8 items-center gap-2 rounded-lg bg-accent px-3 text-xs font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40 light:text-neutral-950"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={12} /> : null}
          Confirm payout
        </button>
      </div>
    </form>
  )
}

/* ─── Active payout (mark paid / failed) ────────────────────────── */

function ActivePayoutPanel({
  creatorPublicId,
  payout,
}: {
  creatorPublicId: string
  payout: AdminPayout
}) {
  const markPaid = useAdminPayoutsStore((s) => s.markPaid)
  const markFailed = useAdminPayoutsStore((s) => s.markFailed)
  const actionStatus = useAdminPayoutsStore((s) => s.actionStatus)
  const actionError = useAdminPayoutsStore((s) => s.actionError)
  const resetActionFeedback = useAdminPayoutsStore((s) => s.resetActionFeedback)

  const [bankReference, setBankReference] = useState('')
  const [failNote, setFailNote] = useState('')
  const [mode, setMode] = useState<'none' | 'paid' | 'failed'>('none')
  const isSubmitting = actionStatus === 'submitting'

  if (payout.status !== 'Pending') {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 light:border-neutral-200 light:bg-neutral-50">
        {payout.status === 'Paid' ? (
          <CheckCircle2 size={16} className="text-emerald-400 light:text-emerald-600" />
        ) : (
          <XCircle size={16} className="text-red-400 light:text-red-600" />
        )}
        <p className="text-sm text-white/70 light:text-neutral-600">
          Payout {formatCurrency(payout.amountCents, payout.currency)} marked{' '}
          <span className="font-semibold">{payout.status}</span>
          {payout.bankReference ? ` — ref. ${payout.bankReference}` : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 light:border-amber-200 light:bg-amber-50">
      <p className="text-sm text-amber-200 light:text-amber-800">
        Payout {formatCurrency(payout.amountCents, payout.currency)} created — <span className="font-semibold">Pending</span>.
        Send the bank transfer, then record the result below.
      </p>

      {mode === 'none' ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { resetActionFeedback(); setMode('paid') }}
            className="inline-flex h-8 items-center gap-2 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-400"
          >
            <CheckCircle2 size={13} />
            Mark paid
          </button>
          <button
            type="button"
            onClick={() => { resetActionFeedback(); setMode('failed') }}
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 light:border-red-200 light:bg-red-50 light:text-red-700"
          >
            <XCircle size={13} />
            Mark failed
          </button>
        </div>
      ) : mode === 'paid' ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!bankReference.trim() || isSubmitting) return
            void markPaid(creatorPublicId, payout.publicId, { bankReference }).then((result) => {
              if (result) setMode('none')
            })
          }}
        >
          <input
            type="text"
            required
            value={bankReference}
            onChange={(e) => { resetActionFeedback(); setBankReference(e.target.value) }}
            placeholder="Bank transaction reference"
            className="h-9 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25 light:border-neutral-200 light:bg-white light:text-neutral-950 light:placeholder-neutral-400"
          />
          <button
            type="submit"
            disabled={!bankReference.trim() || isSubmitting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={12} /> : null}
            Confirm paid
          </button>
          <button
            type="button"
            onClick={() => setMode('none')}
            className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-700"
          >
            Cancel
          </button>
        </form>
      ) : (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (isSubmitting) return
            void markFailed(creatorPublicId, payout.publicId, { note: failNote }).then((result) => {
              if (result) setMode('none')
            })
          }}
        >
          <input
            type="text"
            value={failNote}
            onChange={(e) => { resetActionFeedback(); setFailNote(e.target.value) }}
            placeholder="Reason (optional)"
            className="h-9 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25 light:border-neutral-200 light:bg-white light:text-neutral-950 light:placeholder-neutral-400"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40 light:border-red-200 light:bg-red-50 light:text-red-700"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={12} /> : null}
            Confirm failed
          </button>
          <button
            type="button"
            onClick={() => setMode('none')}
            className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-700"
          >
            Cancel
          </button>
        </form>
      )}

      {actionError ? <p className="text-xs text-red-400 light:text-red-600">{actionError}</p> : null}
    </div>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function formatCurrency(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}
