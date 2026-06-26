import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
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
  Zap,
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
      {isLoading ? (
        <div className="flex h-screen items-center justify-center gap-3 text-sm text-neutral-400">
          <Loader2 className="animate-spin" size={18} />
          Loading workspace…
        </div>
      ) : !creator ? (
        <div className="flex h-screen items-center justify-center p-8">
          <div className="max-w-sm text-center">
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
        </div>
      ) : (
        <div className="flex min-h-screen flex-col">
          {/* ── Hero header ─────────────────────────────────────── */}
          <div className="border-b border-neutral-200 bg-white px-8 pb-6 pt-8">

            {/* Alert banners */}
            {requiresPayment && (
              <div className="mb-6 flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
                <CreditCard className="shrink-0 text-amber-600" size={16} />
                <p className="flex-1 text-sm text-amber-800">
                  <span className="font-semibold">Payment required</span> — complete checkout to activate this workspace.
                </p>
                <button
                  className="shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                  type="button"
                  disabled={isStartingCheckout}
                  onClick={() => void startCheckout()}
                >
                  {isStartingCheckout ? <Loader2 className="animate-spin" size={12} /> : <CreditCard size={12} />}
                  Pay now
                </button>
              </div>
            )}
            {isSuspended && (
              <div className="mb-6 flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5">
                <ShieldAlert className="shrink-0 text-red-600" size={16} />
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Workspace suspended</span> — your subscription may have lapsed.
                </p>
              </div>
            )}
            {checkoutError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
                {checkoutError}
              </div>
            )}

            {/* Workspace identity */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-neutral-950">
                  <span className="text-base font-black tracking-tighter text-white">
                    {creator.name[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950">{creator.name}</h1>
                    <StatusBadge status={creator.status} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-400">
                    <Hash size={11} />
                    {creator.slug}
                  </p>
                </div>
              </div>

              <button
                className="shrink-0 inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
                type="button"
                onClick={() => navigate(`/app/${creator.slug}/settings`)}
              >
                <Settings size={14} />
                Settings
              </button>
            </div>

            {/* Inline metrics strip */}
            <div className="mt-5 flex flex-wrap gap-2">
              <MetricPill
                label="Plan"
                value={planName}
                accent={isActive ? 'emerald' : 'neutral'}
              />
              <MetricPill
                label="Landing pages"
                value={
                  maxLandingPages !== null && maxLandingPages >= 0
                    ? `Up to ${maxLandingPages}`
                    : 'Unlimited'
                }
              />
              <MetricPill label="Currency" value={creator.defaultCurrency} />
              {isCancelledAtPeriodEnd && (
                <MetricPill label="Billing" value="Cancels at period end" accent="amber" />
              )}
            </div>
          </div>

          {/* ── Main content area ────────────────────────────────── */}
          <div className="flex-1 p-8">
            <div className="grid h-full gap-6 lg:grid-cols-3">

              {/* Left column — primary actions (2/3) */}
              <div className="flex flex-col gap-6 lg:col-span-2">

                {/* Navigation cards */}
                <section>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                    Workspace
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <NavCard
                      icon={FileText}
                      title="Landing Pages"
                      desc="Build and publish pages that convert."
                      color="blue"
                      onClick={() => navigate(`/app/${creator.slug}/landing-pages`)}
                    />
                    <NavCard
                      icon={Package}
                      title="Products"
                      desc="Manage digital products and offers."
                      color="violet"
                      onClick={() => navigate(`/app/${creator.slug}/products`)}
                    />
                    <NavCard
                      icon={BarChart3}
                      title="Analytics"
                      desc="Track views, clicks, and revenue."
                      color="emerald"
                      onClick={() => navigate(`/app/${creator.slug}/analytics`)}
                    />
                  </div>
                </section>

                {/* Getting started / checklist */}
                <section className="flex-1 rounded-2xl border border-neutral-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-950">Getting started</h3>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={11} />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-400">
                    Follow these steps to get the most out of your workspace.
                  </p>

                  <div className="mt-5 grid gap-2">
                    <ChecklistItem
                      done={isActive || requiresPayment}
                      label="Create your workspace"
                      desc="You've set up your Creator Platform account."
                    />
                    <ChecklistItem
                      done={isActive}
                      label="Activate subscription"
                      desc={
                        isActive
                          ? 'Subscription is active and running.'
                          : 'Complete checkout to unlock all features.'
                      }
                      action={
                        requiresPayment
                          ? {
                              label: 'Pay now',
                              disabled: isStartingCheckout,
                              onClick: () => void startCheckout(),
                            }
                          : undefined
                      }
                    />
                    <ChecklistItem
                      done={false}
                      label="Create your first landing page"
                      desc="Start publishing to your audience."
                      action={{
                        label: 'Go to Landing Pages',
                        onClick: () => navigate(`/app/${creator.slug}/landing-pages`),
                      }}
                    />
                    <ChecklistItem
                      done={false}
                      label="Add a product"
                      desc="Set up a digital product to sell."
                      action={{
                        label: 'Go to Products',
                        onClick: () => navigate(`/app/${creator.slug}/products`),
                      }}
                    />
                  </div>
                </section>
              </div>

              {/* Right column — plan & billing (1/3) */}
              <div className="flex flex-col gap-6">
                {/* Plan card */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                        Current plan
                      </p>
                      <p className="mt-1 text-2xl font-bold text-neutral-950">{planName}</p>
                    </div>
                    <div className="grid size-10 place-items-center rounded-xl bg-neutral-950">
                      <Zap size={16} className="text-white" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <PlanDetail
                      label="Landing pages"
                      value={
                        maxLandingPages !== null && maxLandingPages >= 0
                          ? `Up to ${maxLandingPages}`
                          : 'Unlimited'
                      }
                    />
                    <PlanDetail label="Currency" value={creator.defaultCurrency} />
                    <PlanDetail
                      label="Billing"
                      value={
                        creator.planCode === 'free'
                          ? 'Free forever'
                          : isCancelledAtPeriodEnd
                            ? 'Cancels at period end'
                            : 'Monthly'
                      }
                    />
                  </div>

                  {/* Billing actions */}
                  <div className="mt-5 grid gap-2">
                    {creator.planCode === 'free' ? (
                      <button
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                        type="button"
                        onClick={() => void openBillingPortal()}
                      >
                        <ArrowRight size={14} />
                        Upgrade plan
                      </button>
                    ) : (
                      <>
                        {isActive && (
                          <button
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                            type="button"
                            onClick={() => void openBillingPortal()}
                          >
                            <ExternalLink size={14} />
                            Manage billing
                          </button>
                        )}
                        {isActive && !isCancelledAtPeriodEnd && (
                          <button
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-40"
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
                        )}
                      </>
                    )}
                  </div>
                  {cancelSubscriptionError && (
                    <p className="mt-3 text-xs text-red-600">{cancelSubscriptionError}</p>
                  )}
                </div>

                {/* Workspace info card */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Workspace info
                  </p>
                  <div className="mt-4 grid gap-3">
                    <PlanDetail label="Workspace ID" value={creator.publicId} mono />
                    <PlanDetail label="Slug" value={`/${creator.slug}`} mono />
                    <PlanDetail label="Status" value={creator.status} />
                  </div>
                </div>

                {/* Danger zone */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Danger zone
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Permanently delete this workspace and all its data.
                  </p>
                  <button
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
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
            </div>
          </div>
        </div>
      )}

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
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 text-xs font-semibold text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        Active
      </span>
    )
  if (s === 'pendingpayment')
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 text-xs font-semibold text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-400" />
        Pending payment
      </span>
    )
  if (s === 'suspended')
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 text-xs font-semibold text-red-400">
        <span className="size-1.5 rounded-full bg-red-400" />
        Suspended
      </span>
    )
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-white/10 px-2.5 text-xs font-semibold text-white/60">
      {status}
    </span>
  )
}

function MetricPill({
  label,
  value,
  accent = 'neutral',
}: {
  label: string
  value: string
  accent?: 'neutral' | 'emerald' | 'amber'
}) {
  const colors = {
    neutral: 'border-neutral-200 bg-neutral-50 text-neutral-600',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${colors[accent]}`}>
      <span className="text-neutral-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function NavCard({
  icon: Icon,
  title,
  desc,
  color,
  onClick,
}: {
  icon: typeof FileText
  title: string
  desc: string
  color: 'blue' | 'violet' | 'emerald'
  onClick: () => void
}) {
  const bg = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
  }[color]

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-neutral-300 hover:shadow-sm"
    >
      <span className={`grid size-10 place-items-center rounded-xl transition ${bg}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-950">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-neutral-400">{desc}</p>
      </div>
      <ArrowRight
        size={14}
        className="mt-auto self-end text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-600"
      />
    </button>
  )
}

function ChecklistItem({
  done,
  label,
  desc,
  action,
}: {
  done: boolean
  label: string
  desc: string
  action?: { label: string; onClick: () => void; disabled?: boolean }
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl p-3 transition ${done ? '' : 'bg-neutral-50'}`}>
      <div className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${done ? 'bg-emerald-500' : 'border-2 border-neutral-300'}`}>
        {done && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${done ? 'text-neutral-400 line-through' : 'text-neutral-950'}`}>
          {label}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">{desc}</p>
      </div>
      {!done && action && (
        <button
          type="button"
          disabled={action.disabled}
          onClick={action.onClick}
          className="shrink-0 inline-flex h-7 items-center gap-1 rounded-lg bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

function PlanDetail({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className={`text-xs font-medium text-neutral-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
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
