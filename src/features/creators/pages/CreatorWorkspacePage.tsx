import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Hash,
  Loader2,
  Mail,
  Package,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listLandingPages } from '../../landing-pages/api/landing-pages-api'
import { listOrders, getOrderSummary } from '../../orders/api/orders-api'
import type { Order, OrderSummary } from '../../orders/model/types'
import { listProducts } from '../../products/api/products-api'
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
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [productCount, setProductCount] = useState<number | null>(null)
  const [landingPageCount, setLandingPageCount] = useState<number | null>(null)

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
  const maxProducts = currentPlan?.limits['max_products'] ?? null
  const maxEmailsPerMonth = currentPlan?.limits['max_email_sends_per_month'] ?? null
  const platformFeePercent =
    currentPlan != null ? (currentPlan.platformFeeBasisPoints / 100).toFixed(1) : null

  // Onboarding done = has product + has landing page + status active
  const onboardingDone =
    isActive &&
    productCount != null && productCount > 0 &&
    landingPageCount != null && landingPageCount > 0

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  useEffect(() => {
    if (!slug) return
    void getOrderSummary(slug).then(setOrderSummary).catch(() => {})
    void listProducts(slug).then((p) => setProductCount(p.length)).catch(() => {})
    void listLandingPages(slug).then((p) => setLandingPageCount(p.length)).catch(() => {})
    void listOrders(slug)
      .then((orders) => setRecentOrders(orders.filter((o) => o.status === 'Paid').slice(0, 5)))
      .catch(() => {})
  }, [slug])

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

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="border-b border-neutral-100 bg-white px-8 pb-6 pt-8">
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

            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-neutral-950">
                  <span className="text-sm font-black tracking-tighter text-white">
                    {creator.name[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-950">{creator.name}</h1>
                    <StatusBadge status={creator.status} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                    <Hash size={10} />
                    {creator.slug}
                  </p>
                </div>
              </div>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
                type="button"
                onClick={() => navigate(`/app/${creator.slug}/settings`)}
              >
                <Settings size={14} />
                Settings
              </button>
            </div>
          </div>

          {/* ── Body ────────────────────────────────────────────────── */}
          <div className="flex-1 p-8">
            <div className="grid gap-6 lg:grid-cols-3">

              {/* Left column (2/3) */}
              <div className="flex flex-col gap-6 lg:col-span-2">

                {/* ── Section 2: Glavni brojevi ──────────────────────── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard
                    label="Total revenue"
                    value={
                      orderSummary != null
                        ? formatCurrency(
                            orderSummary.totalPaidAmountCents,
                            orderSummary.currency ?? creator.defaultCurrency,
                          )
                        : '—'
                    }
                  />
                  <StatCard
                    label="Products"
                    value={productCount != null ? String(productCount) : '—'}
                    onClick={() => navigate(`/app/${creator.slug}/products`)}
                  />
                  <StatCard
                    label="Landing pages"
                    value={landingPageCount != null ? String(landingPageCount) : '—'}
                    onClick={() => navigate(`/app/${creator.slug}/landing-pages`)}
                  />
                  <StatCard
                    label="Emails this month"
                    value={maxEmailsPerMonth != null ? `0 / ${maxEmailsPerMonth.toLocaleString()}` : '—'}
                  />
                </div>

                {/* ── Section 1: Kutak s planom ──────────────────────── */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                      Your plan
                    </p>
                    <div className="flex items-center gap-1.5 rounded-full bg-neutral-950 px-3 py-1">
                      <Zap size={11} className="text-white" />
                      <span className="text-xs font-bold text-white">{planName}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <PlanStat
                      label="Landing pages"
                      value={
                        landingPageCount != null && maxLandingPages != null
                          ? `${landingPageCount} / ${maxLandingPages < 0 ? '∞' : maxLandingPages}`
                          : maxLandingPages != null
                            ? maxLandingPages < 0 ? 'Unlimited' : `Up to ${maxLandingPages}`
                            : '—'
                      }
                      icon={FileText}
                    />
                    <PlanStat
                      label="Products"
                      value={
                        productCount != null && maxProducts != null
                          ? `${productCount} / ${maxProducts < 0 ? '∞' : maxProducts}`
                          : maxProducts != null
                            ? maxProducts < 0 ? 'Unlimited' : `Up to ${maxProducts}`
                            : '—'
                      }
                      icon={Package}
                    />
                    <PlanStat
                      label="Platform fee"
                      value={platformFeePercent != null ? `${platformFeePercent}%` : '—'}
                      icon={Zap}
                    />
                    <PlanStat
                      label="Email limit / mo"
                      value={
                        maxEmailsPerMonth != null
                          ? maxEmailsPerMonth < 0 ? 'Unlimited' : maxEmailsPerMonth.toLocaleString()
                          : '—'
                      }
                      icon={Mail}
                    />
                  </div>
                </div>

                {/* ── Section 3: Conditional block ──────────────────── */}
                {onboardingDone ? (
                  <RecentTransactions
                    orders={recentOrders}
                    onViewAll={() => navigate(`/app/${creator.slug}/orders`)}
                  />
                ) : (
                  <OnboardingChecklist
                    isActive={isActive}
                    requiresPayment={requiresPayment}
                    isStartingCheckout={isStartingCheckout}
                    productCount={productCount ?? 0}
                    landingPageCount={landingPageCount ?? 0}
                    onStartCheckout={() => void startCheckout()}
                    onGoToProducts={() => navigate(`/app/${creator.slug}/products`)}
                    onGoToLandingPages={() => navigate(`/app/${creator.slug}/landing-pages`)}
                  />
                )}
              </div>

              {/* Right column (1/3) */}
              <div className="flex flex-col gap-6">

                {/* Plan + billing actions */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Billing
                  </p>
                  <p className="mt-1.5 text-2xl font-bold text-neutral-950">{planName}</p>
                  {isCancelledAtPeriodEnd && (
                    <p className="mt-1 text-xs text-amber-600">Cancels at period end</p>
                  )}

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
                        {requiresPayment && (
                          <button
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                            type="button"
                            disabled={isStartingCheckout}
                            onClick={() => void startCheckout()}
                          >
                            {isStartingCheckout ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <CreditCard size={14} />
                            )}
                            Complete payment
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

                {/* Workspace info */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Workspace info
                  </p>
                  <div className="mt-4 grid gap-3">
                    <InfoRow label="ID" value={creator.publicId} mono />
                    <InfoRow label="Slug" value={`/${creator.slug}`} mono />
                    <InfoRow label="Status" value={creator.status} />
                    <InfoRow label="Currency" value={creator.defaultCurrency} />
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

function StatCard({
  label,
  value,
  onClick,
}: {
  label: string
  value: string
  onClick?: () => void
}) {
  const base =
    'rounded-2xl border border-neutral-200 bg-white p-5 transition'
  const interactive = onClick ? 'cursor-pointer hover:border-neutral-300 hover:shadow-sm' : ''
  return (
    <div className={`${base} ${interactive}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <p className="text-2xl font-bold tracking-tight text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-400">{label}</p>
    </div>
  )
}

function PlanStat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof FileText
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-neutral-50 p-3.5">
      <Icon size={14} className="text-neutral-400" />
      <div>
        <p className="text-sm font-semibold text-neutral-950">{value}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{label}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className={`truncate text-xs font-medium text-neutral-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function OnboardingChecklist({
  isActive,
  requiresPayment,
  isStartingCheckout,
  productCount,
  landingPageCount,
  onStartCheckout,
  onGoToProducts,
  onGoToLandingPages,
}: {
  isActive: boolean
  requiresPayment: boolean
  isStartingCheckout: boolean
  productCount: number
  landingPageCount: number
  onStartCheckout: () => void
  onGoToProducts: () => void
  onGoToLandingPages: () => void
}) {
  return (
    <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-neutral-950">Getting started</h3>
      <p className="mt-1 text-sm text-neutral-400">Complete these steps to launch your workspace.</p>

      <div className="mt-5 grid gap-2">
        <ChecklistItem
          done={isActive || requiresPayment}
          label="Create your workspace"
          desc="You've set up your Creator Platform account."
        />
        <ChecklistItem
          done={isActive}
          label="Activate workspace"
          desc={isActive ? 'Subscription is active.' : 'Complete checkout to unlock all features.'}
          action={
            requiresPayment
              ? { label: 'Pay now', disabled: isStartingCheckout, onClick: onStartCheckout }
              : undefined
          }
        />
        <ChecklistItem
          done={productCount > 0}
          label="Add a product"
          desc="Create at least one digital product to sell."
          action={
            productCount === 0
              ? { label: 'Go to Products', onClick: onGoToProducts }
              : undefined
          }
        />
        <ChecklistItem
          done={landingPageCount > 0}
          label="Create a landing page"
          desc="Publish a page to start converting visitors."
          action={
            landingPageCount === 0
              ? { label: 'Go to Landing Pages', onClick: onGoToLandingPages }
              : undefined
          }
        />
      </div>
    </div>
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
    <div className={`flex items-start gap-3 rounded-xl p-3 ${done ? '' : 'bg-neutral-50'}`}>
      <div
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
          done ? 'bg-emerald-500' : 'border-2 border-neutral-300'
        }`}
      >
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

function RecentTransactions({
  orders,
  onViewAll,
}: {
  orders: Order[]
  onViewAll: () => void
}) {
  return (
    <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-950">Recent transactions</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-medium text-neutral-400 transition hover:text-neutral-700"
        >
          View all
          <ArrowRight size={11} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <ShoppingBag size={22} className="text-neutral-300" />
          <p className="text-sm text-neutral-400">No paid orders yet.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {orders.map((order) => (
            <div
              key={order.publicId}
              className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-950">
                  {order.name ?? order.email}
                </p>
                <p className="truncate text-xs text-neutral-400">{order.productName}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-neutral-950">
                  {formatCurrency(order.amountCents, order.currency)}
                </p>
                <p className="text-xs text-neutral-400">
                  {new Date(order.paidAt ?? order.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'active')
    return (
      <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    )
  if (s === 'pendingpayment')
    return (
      <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-amber-50 px-2 text-[11px] font-semibold text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Pending payment
      </span>
    )
  if (s === 'suspended')
    return (
      <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-red-50 px-2 text-[11px] font-semibold text-red-700">
        <span className="size-1.5 rounded-full bg-red-500" />
        Suspended
      </span>
    )
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-neutral-100 px-2 text-[11px] font-semibold text-neutral-500">
      {status}
    </span>
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

function formatCurrency(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
}
