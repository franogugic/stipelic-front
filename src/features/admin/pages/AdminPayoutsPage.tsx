import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminPayoutsStore } from '../model/admin-payouts-store'
import type { AdminPayout, AdminPayoutQueueItem, CreatorBalanceSummary, PayoutStatus } from '../model/types'

type Tab = 'requests' | 'history'
const HISTORY_STATUSES: PayoutStatus[] = ['Paid', 'Failed', 'Cancelled']

export function AdminPayoutsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('requests')

  return (
    <div className="relative min-h-screen bg-background">
      <div className="bg-grid pointer-events-none fixed inset-0 opacity-[0.04]" />

      <header className="relative flex h-14 items-center gap-4 border-b border-border bg-background px-6">
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
        <div className="mb-6 flex items-center gap-2 border-b border-border">
          <TabButton label="Requests" active={tab === 'requests'} onClick={() => setTab('requests')} />
          <TabButton label="History" active={tab === 'history'} onClick={() => setTab('history')} />
        </div>

        {tab === 'requests' ? <RequestsTab /> : <HistoryTab />}

        <ManualPayoutSection />
      </main>
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition ${
        active
          ? 'border-accent text-white light:text-neutral-950'
          : 'border-transparent text-white/40 hover:text-white/70 light:text-neutral-400 light:hover:text-neutral-700'
      }`}
    >
      {label}
    </button>
  )
}

/* ─── Requests (Pending queue) ───────────────────────────────────── */

function RequestsTab() {
  const queue = useAdminPayoutsStore((s) => s.queue)
  const queueStatus = useAdminPayoutsStore((s) => s.queueStatus)
  const queueError = useAdminPayoutsStore((s) => s.queueError)
  const loadQueue = useAdminPayoutsStore((s) => s.loadQueue)

  useEffect(() => {
    void loadQueue('Pending')
  }, [loadQueue])

  const isLoading = queueStatus === 'loading' || queueStatus === 'idle'

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-white light:text-neutral-950">
          Payout requests
        </h1>
        <p className="mt-1 text-sm text-white/40 light:text-neutral-400">
          Creator-initiated requests waiting to be sent in the bank and recorded.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
          <Loader2 className="animate-spin" size={18} />
          Loading requests…
        </div>
      ) : queueStatus === 'error' ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-6 light:border-red-200 light:bg-red-50">
          <p className="text-sm font-semibold text-red-200 light:text-red-800">Could not load payout requests</p>
          <p className="mt-1 text-sm text-red-300 light:text-red-700">{queueError}</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center light:border-neutral-300">
          <Banknote className="mx-auto mb-2 text-white/15 light:text-neutral-300" size={22} />
          <p className="text-sm text-white/40 light:text-neutral-400">No pending payout requests.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {queue.map((item) => (
            <RequestRow key={item.publicId} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function RequestRow({ item }: { item: AdminPayoutQueueItem }) {
  const markPaid = useAdminPayoutsStore((s) => s.markPaid)
  const markFailed = useAdminPayoutsStore((s) => s.markFailed)
  const actionStatus = useAdminPayoutsStore((s) => s.actionStatus)
  const actionError = useAdminPayoutsStore((s) => s.actionError)
  const resetActionFeedback = useAdminPayoutsStore((s) => s.resetActionFeedback)

  const [mode, setMode] = useState<'none' | 'paid' | 'failed'>('none')
  const [bankReference, setBankReference] = useState('')
  const [failNote, setFailNote] = useState('')
  const [copied, setCopied] = useState(false)
  const isSubmitting = actionStatus === 'submitting'

  const copyIban = () => {
    void navigator.clipboard.writeText(item.iban).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white light:text-neutral-950">{item.creatorName}</p>
          <p className="mt-0.5 font-mono text-xs text-white/40 light:text-neutral-400">/{item.creatorSlug}</p>
          <p className="mt-2 text-xs text-white/40 light:text-neutral-400">
            Requested {new Date(item.createdAt).toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <p className="font-mono text-lg font-bold tabular-nums text-white light:text-neutral-950">
          {formatCurrency(item.amountCents, item.currency)}
        </p>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl bg-muted p-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/30 light:text-neutral-400">Account holder</p>
          <p className="mt-0.5 text-sm text-white/80 light:text-neutral-700">{item.accountHolderName}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/30 light:text-neutral-400">
            IBAN · {item.bankCountryCode}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="font-mono text-sm text-white/80 light:text-neutral-700">{item.iban}</p>
            <button
              type="button"
              onClick={copyIban}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-white light:text-neutral-400 light:hover:bg-neutral-200 light:hover:text-neutral-700"
              title="Copy IBAN"
            >
              {copied ? <Check size={13} className="text-emerald-400 light:text-emerald-600" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      {mode === 'none' ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => { resetActionFeedback(); setMode('paid') }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-400"
          >
            <CheckCircle2 size={13} />
            Mark paid
          </button>
          <button
            type="button"
            onClick={() => { resetActionFeedback(); setMode('failed') }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 light:border-red-200 light:bg-red-50 light:text-red-700"
          >
            <XCircle size={13} />
            Mark failed
          </button>
        </div>
      ) : mode === 'paid' ? (
        <form
          className="mt-4 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!bankReference.trim() || isSubmitting) return
            void markPaid(item.creatorPublicId, item.publicId, { bankReference }).then((result) => {
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
            className="h-9 flex-1 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-accent/50"
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
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
          >
            Cancel
          </button>
        </form>
      ) : (
        <form
          className="mt-4 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (isSubmitting) return
            void markFailed(item.creatorPublicId, item.publicId, { note: failNote }).then((result) => {
              if (result) setMode('none')
            })
          }}
        >
          <input
            type="text"
            value={failNote}
            onChange={(e) => { resetActionFeedback(); setFailNote(e.target.value) }}
            placeholder="Reason (optional)"
            className="h-9 flex-1 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-accent/50"
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
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
          >
            Cancel
          </button>
        </form>
      )}

      {actionError ? <p className="mt-2 text-xs text-red-400 light:text-red-600">{actionError}</p> : null}
    </div>
  )
}

/* ─── History ─────────────────────────────────────────────────── */

function HistoryTab() {
  const queue = useAdminPayoutsStore((s) => s.queue)
  const queueStatus = useAdminPayoutsStore((s) => s.queueStatus)
  const queueError = useAdminPayoutsStore((s) => s.queueError)
  const loadQueue = useAdminPayoutsStore((s) => s.loadQueue)
  const [status, setStatus] = useState<PayoutStatus>('Paid')

  useEffect(() => {
    void loadQueue(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const isLoading = queueStatus === 'loading' || queueStatus === 'idle'

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white light:text-neutral-950">
            Payout history
          </h1>
          <p className="mt-1 text-sm text-white/40 light:text-neutral-400">
            Payouts that have already been processed.
          </p>
        </div>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PayoutStatus)}
            className="h-9 appearance-none rounded-lg border border-border bg-secondary py-0 pl-3 pr-8 text-sm text-foreground outline-none"
          >
            {HISTORY_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 light:text-neutral-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
          <Loader2 className="animate-spin" size={18} />
          Loading history…
        </div>
      ) : queueStatus === 'error' ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-6 light:border-red-200 light:bg-red-50">
          <p className="text-sm font-semibold text-red-200 light:text-red-800">Could not load payout history</p>
          <p className="mt-1 text-sm text-red-300 light:text-red-700">{queueError}</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center light:border-neutral-300">
          <p className="text-sm text-white/40 light:text-neutral-400">No {status.toLowerCase()} payouts yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Creator</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Reference / Note</th>
                <th className="px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {queue.map((item) => (
                <tr key={item.publicId}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white light:text-neutral-950">{item.creatorName}</p>
                    <p className="font-mono text-xs text-white/40 light:text-neutral-400">/{item.creatorSlug}</p>
                  </td>
                  <td className="font-data px-4 py-3 font-medium tabular-nums text-white light:text-neutral-950">
                    {formatCurrency(item.amountCents, item.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-white/50 light:text-neutral-500">{item.bankReference ?? item.note ?? '—'}</td>
                  <td className="px-4 py-3 text-white/50 light:text-neutral-500">
                    {new Date(item.paidAt ?? item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: PayoutStatus }) {
  const toneClasses =
    status === 'Paid'
      ? 'bg-emerald-500/15 text-emerald-300 light:bg-emerald-50 light:text-emerald-700'
      : status === 'Failed'
        ? 'bg-red-500/15 text-red-300 light:bg-red-50 light:text-red-700'
        : status === 'Cancelled'
          ? 'bg-white/10 text-white/50 light:bg-neutral-100 light:text-neutral-500'
          : 'bg-amber-500/15 text-amber-300 light:bg-amber-50 light:text-amber-700'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses}`}>
      {status}
    </span>
  )
}

/* ─── Manual payout (secondary action) ───────────────────────────── */

function ManualPayoutSection() {
  const [isOpen, setIsOpen] = useState(false)
  const balances = useAdminPayoutsStore((s) => s.balances)
  const balancesStatus = useAdminPayoutsStore((s) => s.balancesStatus)
  const balancesError = useAdminPayoutsStore((s) => s.balancesError)
  const loadBalances = useAdminPayoutsStore((s) => s.loadBalances)

  const [minCents, setMinCents] = useState(5000)

  useEffect(() => {
    if (isOpen) void loadBalances(minCents)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const isLoading = balancesStatus === 'loading' || balancesStatus === 'idle'

  return (
    <div className="mt-10 border-t border-border pt-6">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-white/50 transition hover:text-white light:text-neutral-500 light:hover:text-neutral-800"
      >
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        Create a payout manually
      </button>
      <p className="mt-1 text-xs text-white/30 light:text-neutral-400">
        For edge cases — e.g. a final payout when closing a creator's account. Creators normally request
        their own payouts via the Requests tab.
      </p>

      {isOpen ? (
        <div className="mt-4">
          <div className="mb-4 flex items-end justify-between gap-4">
            <p className="text-sm text-white/40 light:text-neutral-400">
              BankTransfer creators with a balance at or above the threshold.
            </p>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); void loadBalances(minCents) }}
            >
              <label className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
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
        </div>
      ) : null}
    </div>
  )
}

function BalanceRow({ balance }: { balance: CreatorBalanceSummary }) {
  const activePayouts = useAdminPayoutsStore((s) => s.activePayouts)
  const activePayout = activePayouts[balance.creatorPublicId]

  const [isCreating, setIsCreating] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
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
      className="mt-4 grid gap-3 rounded-xl border border-border bg-muted p-4"
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
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:border-accent/50"
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
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-accent/50"
          />
        </div>
      </div>

      {actionError ? <p className="text-xs text-red-400 light:text-red-600">{actionError}</p> : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
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
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
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
            className="h-9 flex-1 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-accent/50"
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
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
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
            className="h-9 flex-1 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-accent/50"
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
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
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
  // Defensive: the real fix is the backend always sending currency as a string code (see
  // CreatorBalanceSummaryDto), but this stays cheap insurance against a future enum-as-number
  // regression instead of crashing the whole page on `.toUpperCase()`.
  if (typeof currency !== 'string' || !currency.trim()) {
    return `${(cents / 100).toFixed(2)} (unknown currency: ${String(currency)})`
  }

  try {
    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    })
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}
