import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Globe,
  Hash,
  Loader2,
  Settings,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DeleteCreatorDialog } from '../components/DeleteCreatorDialog'
import { useCreatorStore } from '../model/creator-store'

export function CreatorWorkspacePage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const checkoutStatus = useCreatorStore((s) => s.checkoutStatus)
  const checkoutError = useCreatorStore((s) => s.checkoutError)
  const cancelSubscriptionStatus = useCreatorStore((s) => s.cancelSubscriptionStatus)
  const cancelSubscriptionError = useCreatorStore((s) => s.cancelSubscriptionError)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const startCreatorCheckout = useCreatorStore((s) => s.startCreatorCheckout)
  const cancelSubscription = useCreatorStore((s) => s.cancelSubscription)
  const resetDeleteCreatorFeedback = useCreatorStore((s) => s.resetDeleteCreatorFeedback)
  const resetCancelSubscriptionFeedback = useCreatorStore((s) => s.resetCancelSubscriptionFeedback)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  const isLoading = currentCreatorStatus === 'loading' || currentCreatorStatus === 'idle'
  const isCurrentSlug = currentCreator?.slug === slug
  const creator = isCurrentSlug ? currentCreator : null
  const requiresPayment = creator?.status.toLowerCase() === 'pendingpayment'
  const isActive = creator?.status.toLowerCase() === 'active'
  const isSuspended = creator?.status.toLowerCase() === 'suspended'
  const isCancelledAtPeriodEnd = creator?.cancelAtPeriodEnd === true
  const isStartingCheckout = checkoutStatus === 'submitting'
  const isCancellingSubscription = cancelSubscriptionStatus === 'submitting'

  const planName = formatPlanName(creator?.planCode ?? '')

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  const startCheckout = async () => {
    const checkout = await startCreatorCheckout()
    if (checkout?.checkoutUrl) window.location.assign(checkout.checkoutUrl)
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-neutral-950 text-white">
              <span className="text-xs font-bold">CP</span>
            </span>
            <span className="text-sm text-neutral-300">/</span>
            <span className="text-sm font-medium text-neutral-950">{slug}</span>
          </div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
            type="button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={14} />
            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10 lg:px-8">

        {/* Loading */}
        {isLoading ? (
          <div className="flex h-32 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 text-sm text-neutral-400 shadow-sm">
            <Loader2 className="animate-spin" size={17} />
            Loading workspace
          </div>
        ) : null}

        {/* Not found */}
        {!isLoading && !creator ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="font-semibold">Workspace not found</p>
            <p className="mt-1 text-sm text-neutral-500">This slug doesn't match your workspace.</p>
            <button
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
              type="button"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={14} />
              Back to dashboard
            </button>
          </div>
        ) : null}

        {creator ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
            <div className="grid gap-4">

              {/* Hero card */}
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                {/* Top band */}
                <div className="bg-neutral-950 px-6 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 text-white text-xl font-bold">
                        {creator.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{creator.name}</p>
                        <p className="mt-0.5 text-sm text-white/50">/{creator.slug}</p>
                      </div>
                    </div>
                    <StatusBadge status={creator.status} />
                  </div>
                </div>

                {/* Info rows */}
                <div className="grid divide-y divide-neutral-100">
                  <InfoRow icon={Zap} label="Plan" value={planName} highlight />
                  <InfoRow icon={CircleDollarSign} label="Currency" value={creator.defaultCurrency} />
                  <InfoRow icon={Globe} label="Slug" value={`/${creator.slug}`} />
                  <InfoRow icon={Hash} label="Workspace ID" value={creator.publicId} mono />
                </div>

                {/* Actions footer */}
                <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-6 py-4">
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
                    type="button"
                    onClick={() => navigate(`/app/${creator.slug}/settings`)}
                  >
                    <Settings size={15} />
                    Settings
                  </button>
                </div>
              </div>

              {/* Payment required */}
              {requiresPayment ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Payment required</p>
                      <p className="mt-1 text-sm text-amber-700">
                        Complete checkout to activate this workspace.
                      </p>
                    </div>
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
                      type="button"
                      disabled={isStartingCheckout}
                      onClick={() => void startCheckout()}
                    >
                      {isStartingCheckout
                        ? <Loader2 className="animate-spin" size={16} />
                        : <CreditCard size={16} />}
                      Pay now
                    </button>
                  </div>
                  {checkoutError ? (
                    <p className="mt-3 text-sm text-red-600">{checkoutError}</p>
                  ) : null}
                </div>
              ) : null}

              {/* Active notice */}
              {isActive ? (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800">
                    Workspace is active. Landing pages and analytics are ready.
                  </p>
                </div>
              ) : null}

              {/* Suspended notice */}
              {isSuspended ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
                  <p className="text-sm font-semibold text-red-800">Workspace suspended</p>
                  <p className="mt-1 text-sm text-red-600">
                    Your subscription may have lapsed. Check billing to reactivate.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Sidebar */}
            <div className="grid gap-4 h-fit">
              {/* Plan card */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Current plan</p>
                <p className="mt-3 text-2xl font-semibold text-neutral-950">{planName}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {creator.planCode === 'free' ? 'Free forever' : 'Monthly billing'}
                </p>

                {/* Status badges */}
                {requiresPayment ? (
                  <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    Awaiting payment
                  </div>
                ) : isCancelledAtPeriodEnd ? (
                  <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    Cancelled — active until end of billing period
                  </div>
                ) : isActive ? (
                  <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    Active subscription
                  </div>
                ) : null}

                {/* Cancel button — only shown when active, not free, not already cancelling */}
                {isActive && !isCancelledAtPeriodEnd && creator.planCode !== 'free' ? (
                  <button
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                    type="button"
                    disabled={isCancellingSubscription}
                    onClick={() => { resetCancelSubscriptionFeedback(); setIsCancelDialogOpen(true) }}
                  >
                    {isCancellingSubscription
                      ? <Loader2 className="animate-spin" size={15} />
                      : <XCircle size={15} />}
                    Cancel plan
                  </button>
                ) : null}

                {cancelSubscriptionError ? (
                  <p className="mt-3 text-xs text-red-600">{cancelSubscriptionError}</p>
                ) : null}
              </div>

              {/* Danger zone */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Danger zone</p>
                <p className="mt-3 text-sm text-neutral-500">Permanently disable this workspace.</p>
                <button
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  type="button"
                  onClick={() => { resetDeleteCreatorFeedback(); setIsDeleteDialogOpen(true) }}
                >
                  <Trash2 size={15} />
                  Delete workspace
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {creator ? (
        <DeleteCreatorDialog
          creator={creator}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={() => navigate('/')}
        />
      ) : null}

      {isCancelDialogOpen ? (
        <CancelSubscriptionDialog
          isSubmitting={isCancellingSubscription}
          onClose={() => setIsCancelDialogOpen(false)}
          onConfirm={async () => {
            const ok = await cancelSubscription()
            if (ok) setIsCancelDialogOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'active')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        Active
      </span>
    )
  if (s === 'pendingpayment')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
        <span className="size-1.5 rounded-full bg-amber-400" />
        Pending payment
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
      {status}
    </span>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
  mono,
}: {
  icon: typeof Hash
  label: string
  value: string
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3.5">
      <div className="flex items-center gap-2.5 text-sm text-neutral-400">
        <Icon size={15} />
        {label}
      </div>
      <span
        className={`text-sm font-semibold ${
          highlight ? 'text-neutral-950' : mono ? 'truncate font-mono text-xs text-neutral-500' : 'text-neutral-700'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function CancelSubscriptionDialog({
  isSubmitting,
  onClose,
  onConfirm,
}: {
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
          <AlertTriangle size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-950">Cancel subscription?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Your plan will remain active until the end of the current billing period. After that, your
          workspace will be suspended.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Keep subscription
          </button>
          <button
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : null}
            Confirm cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────── */

function formatPlanName(code: string) {
  switch (code.toLowerCase()) {
    case 'free':  return 'Free'
    case 'basic': return 'Basic'
    case 'pro':   return 'Pro'
    case 'plus':  return 'Pro Plus'
    default:      return code || 'Free'
  }
}
