import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Hash,
  Loader2,
  Package,
  Settings,
  ShieldAlert,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { DeleteCreatorDialog } from '../components/DeleteCreatorDialog'
import { useCreatorStore } from '../model/creator-store'

export function CreatorWorkspacePage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)
  const checkoutStatus = useCreatorStore((s) => s.checkoutStatus)
  const checkoutError = useCreatorStore((s) => s.checkoutError)
  const cancelSubscriptionStatus = useCreatorStore((s) => s.cancelSubscriptionStatus)
  const cancelSubscriptionError = useCreatorStore((s) => s.cancelSubscriptionError)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const startCreatorCheckout = useCreatorStore((s) => s.startCreatorCheckout)
  const cancelSubscription = useCreatorStore((s) => s.cancelSubscription)
  const openBillingPortal = useCreatorStore((s) => s.openBillingPortal)
  const resetDeleteCreatorFeedback = useCreatorStore((s) => s.resetDeleteCreatorFeedback)
  const resetCancelSubscriptionFeedback = useCreatorStore((s) => s.resetCancelSubscriptionFeedback)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  const isLoading = currentCreatorStatus === 'loading' || currentCreatorStatus === 'idle'
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const requiresPayment = creator?.status.toLowerCase() === 'pendingpayment'
  const isActive = creator?.status.toLowerCase() === 'active'
  const isSuspended = creator?.status.toLowerCase() === 'suspended'
  const isCancelledAtPeriodEnd = creator?.cancelAtPeriodEnd === true
  const isStartingCheckout = checkoutStatus === 'submitting'
  const isCancellingSubscription = cancelSubscriptionStatus === 'submitting'
  const planName = formatPlanName(creator?.planCode ?? '')
  const currentPlan = creatorPlans.find((p) => p.code === creator?.planCode)
  const maxLandingPages = currentPlan?.limits['max_landing_pages'] ?? null

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  const startCheckout = async () => {
    const checkout = await startCreatorCheckout()
    if (checkout?.checkoutUrl) window.location.assign(checkout.checkoutUrl)
  }

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="overview">
      <div className="px-8 py-8">

        {/* Loading */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading workspace…
          </div>
        ) : null}

        {/* Workspace not found */}
        {!isLoading && !creator ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="font-semibold text-neutral-950">Workspace not found</p>
            <p className="mt-1 text-sm text-neutral-500">This slug doesn't match your workspace.</p>
            <button
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
              type="button"
              onClick={() => navigate('/')}
            >
              Go home
            </button>
          </div>
        ) : null}

        {creator ? (
          <div className="grid gap-8">
            {/* Page header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
                    {creator.name}
                  </h1>
                  <StatusBadge status={creator.status} />
                </div>
                <p className="mt-1 text-sm text-neutral-400">/{creator.slug}</p>
              </div>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 shadow-sm transition hover:bg-neutral-50"
                type="button"
                onClick={() => navigate(`/app/${creator.slug}/settings`)}
              >
                <Settings size={15} />
                Settings
              </button>
            </div>

            {/* Alerts */}
            {requiresPayment ? (
              <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <CreditCard className="mt-0.5 shrink-0 text-amber-600" size={18} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">Payment required</p>
                  <p className="mt-0.5 text-sm text-amber-700">
                    Complete checkout to activate this workspace and start publishing.
                  </p>
                </div>
                <button
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                  type="button"
                  disabled={isStartingCheckout}
                  onClick={() => void startCheckout()}
                >
                  {isStartingCheckout ? <Loader2 className="animate-spin" size={15} /> : <CreditCard size={15} />}
                  Pay now
                </button>
              </div>
            ) : null}

            {checkoutError ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{checkoutError}</p>
            ) : null}

            {isSuspended ? (
              <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
                <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={18} />
                <div>
                  <p className="text-sm font-semibold text-red-900">Workspace suspended</p>
                  <p className="mt-0.5 text-sm text-red-700">
                    Your subscription may have lapsed. Manage billing to reactivate.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Stats grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Plan"
                value={planName}
                sub={creator.planCode === 'free' ? 'Free forever' : 'Monthly billing'}
                highlight={isActive}
              />
              <StatCard
                label="Landing pages"
                value={maxLandingPages !== null && maxLandingPages >= 0 ? `Up to ${maxLandingPages}` : 'Unlimited'}
                sub="on current plan"
              />
              <StatCard
                label="Currency"
                value={creator.defaultCurrency}
                sub="billing currency"
              />
              <StatCard
                label="Status"
                value={isActive ? 'Active' : requiresPayment ? 'Awaiting payment' : creator.status}
                sub={
                  isCancelledAtPeriodEnd
                    ? 'Cancels at period end'
                    : isActive
                      ? 'All features available'
                      : 'Action required'
                }
                danger={isSuspended}
              />
            </div>

            {/* Quick actions */}
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Quick actions
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ActionCard
                  icon={FileText}
                  title="Landing pages"
                  desc="Create and manage your landing pages."
                  onClick={() => navigate(`/app/${creator.slug}/landing-pages`)}
                />
                <ActionCard
                  icon={Package}
                  title="Products"
                  desc="Manage your digital products and offers."
                  onClick={() => navigate(`/app/${creator.slug}/products`)}
                />
                <ActionCard
                  icon={Settings}
                  title="Settings"
                  desc="Brand, logo, timezone, and more."
                  onClick={() => navigate(`/app/${creator.slug}/settings`)}
                />
              </div>
            </div>

            {/* Billing & danger row */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Billing card */}
              {creator.planCode !== 'free' ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-neutral-950">Billing</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {isCancelledAtPeriodEnd
                      ? 'Your subscription will cancel at the end of the current period.'
                      : isActive
                        ? 'Subscription is active. Manage invoices and plan from Stripe.'
                        : 'Complete payment to activate your plan.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isActive ? (
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
                        type="button"
                        onClick={() => void openBillingPortal()}
                      >
                        <ExternalLink size={14} />
                        Manage billing
                      </button>
                    ) : null}
                    {isActive && !isCancelledAtPeriodEnd ? (
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                        type="button"
                        disabled={isCancellingSubscription}
                        onClick={() => {
                          resetCancelSubscriptionFeedback()
                          setIsCancelDialogOpen(true)
                        }}
                      >
                        {isCancellingSubscription ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}
                        Cancel plan
                      </button>
                    ) : null}
                  </div>
                  {cancelSubscriptionError ? (
                    <p className="mt-3 text-xs text-red-600">{cancelSubscriptionError}</p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-neutral-950">Upgrade your plan</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    You're on the Free plan. Upgrade to unlock more landing pages, contacts, and
                    features.
                  </p>
                  <button
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    type="button"
                    onClick={() => void openBillingPortal()}
                  >
                    <ArrowRight size={14} />
                    View plans
                  </button>
                </div>
              )}

              {/* Danger zone */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-neutral-950">Danger zone</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Permanently delete this workspace and all associated data. This cannot be undone.
                </p>
                <button
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  type="button"
                  onClick={() => {
                    resetDeleteCreatorFeedback()
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 size={14} />
                  Delete workspace
                </button>
              </div>
            </div>

            {/* Workspace ID */}
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Hash size={12} />
              <span>Workspace ID:</span>
              <code className="font-mono">{creator.publicId}</code>
            </div>
          </div>
        ) : null}
      </div>

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
    </AppShell>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'active')
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    )
  if (s === 'pendingpayment')
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 text-xs font-semibold text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Pending payment
      </span>
    )
  if (s === 'suspended')
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-red-50 px-2.5 text-xs font-semibold text-red-700">
        <span className="size-1.5 rounded-full bg-red-500" />
        Suspended
      </span>
    )
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-neutral-100 px-2.5 text-xs font-semibold text-neutral-600">
      {status}
    </span>
  )
}

function StatCard({
  label,
  value,
  sub,
  highlight,
  danger,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
  danger?: boolean
}) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${danger ? 'border-red-200' : 'border-neutral-200'}`}>
      <p className="text-xs font-medium text-neutral-400">{label}</p>
      <p className={`mt-2 text-xl font-semibold tracking-tight ${danger ? 'text-red-700' : highlight ? 'text-emerald-700' : 'text-neutral-950'}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: typeof FileText
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:border-neutral-300 hover:shadow"
    >
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-neutral-100 bg-neutral-50 text-neutral-500 transition group-hover:border-neutral-950 group-hover:bg-neutral-950 group-hover:text-white">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-950">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-neutral-400">{desc}</p>
      </div>
    </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <div className="grid size-11 place-items-center rounded-xl bg-amber-50">
          <AlertTriangle className="text-amber-600" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-950">Cancel subscription?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Your plan remains active until the end of the current billing period. After that, the
          workspace will be suspended and landing pages will go offline.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Keep plan
          </button>
          <button
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
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

function formatPlanName(code: string): string {
  switch (code.toLowerCase()) {
    case 'free':  return 'Free'
    case 'basic': return 'Basic'
    case 'pro':   return 'Pro'
    case 'plus':  return 'Pro Plus'
    default:      return code || 'Free'
  }
}
