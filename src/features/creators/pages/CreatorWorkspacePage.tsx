import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Package,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getHomeSummary } from '../../orders/api/orders-api'
import type { HomeSummary, Order } from '../../orders/model/types'
import { listProducts } from '../../products/api/products-api'
import type { Product } from '../../products/model/types'
import { AppShell } from '../../../shared/ui/AppShell'
import { CHART_COLORS as STAT_COLORS } from '../../../shared/ui/chart-colors'
import { useAuthStore } from '../../auth/model/auth-store'
import { DeleteCreatorDialog } from '../components/DeleteCreatorDialog'
import { useCreatorStore } from '../model/creator-store'
import { usePayoutStore } from '../model/payout-store'

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

  const payoutSummary = usePayoutStore((s) => s.payoutSummary)
  const payoutSummaryStatus = usePayoutStore((s) => s.payoutSummaryStatus)
  const loadPayoutSummary = usePayoutStore((s) => s.loadPayoutSummary)

  const authUser = useAuthStore((s) => s.currentUser)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [homeSummary, setHomeSummary] = useState<HomeSummary | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)

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
  const productCount = homeSummary?.productCount ?? null
  const landingPageCount = homeSummary?.landingPageCount ?? null
  const currency = homeSummary?.currency ?? creator?.defaultCurrency ?? 'EUR'

  // Recent 5 transactions, 14-day revenue trend, top product and this-month revenue are now computed
  // server-side and returned in the (cached) home summary — no need to pull the full orders list here.
  const recentOrders = homeSummary?.recentOrders ?? []
  const revenueTrend = homeSummary?.revenueTrend ?? []
  const topProduct = homeSummary?.topProduct ?? null
  const thisMonthRevenueCents = homeSummary?.thisMonthRevenueCents ?? 0
  const avgOrderValueCents =
    homeSummary && homeSummary.paidOrderCount > 0
      ? Math.round(homeSummary.totalPaidAmountCents / homeSummary.paidOrderCount)
      : null
  const emailsSentThisMonth = homeSummary?.emailsSentThisMonth ?? 0

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
    void getHomeSummary(slug).then(setHomeSummary).catch(() => {})
  }, [slug])

  useEffect(() => {
    if (!slug) return
    void listProducts(slug).then(setProducts).catch(() => {})
  }, [slug])

  useEffect(() => {
    if (creator?.payoutMode !== 'BankTransfer') return
    const creatorSlug = creator.slug
    void loadPayoutSummary(creatorSlug)
    // Balance moves server-side (purchases, admin payouts) — refresh it whenever the user
    // comes back to this tab, e.g. after paying in Stripe Checkout or browsing the dashboard.
    const refetchOnFocus = () => {
      void loadPayoutSummary(creatorSlug)
    }
    window.addEventListener('focus', refetchOnFocus)
    return () => window.removeEventListener('focus', refetchOnFocus)
  }, [creator?.payoutMode, creator?.slug, loadPayoutSummary])

  const startCheckout = async () => {
    const checkout = await startCreatorCheckout()
    if (checkout?.checkoutUrl) window.location.assign(checkout.checkoutUrl)
  }

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="overview">
      {isLoading ? (
        <div className="flex h-screen items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-950/40">
          <Loader2 className="animate-spin" size={18} />
          Loading workspace…
        </div>
      ) : !creator ? (
        <div className="flex h-screen items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <p className="font-display font-semibold text-white light:text-neutral-950">Workspace not found</p>
            <p className="mt-1 text-sm text-white/40 light:text-neutral-950/40">This slug doesn't match your workspace.</p>
            <button
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-white/70 light:text-neutral-950/70 transition hover:bg-secondary"
              type="button"
              onClick={() => navigate('/')}
            >
              Go home
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col">

          {/* ── Body ────────────────────────────────────────────────── */}
          <div className="flex-1 p-8">

            {(requiresPayment || isSuspended || checkoutError) && (
              <div className="mb-6 grid gap-3">
                {requiresPayment && (
                  <div className="flex items-center gap-4 rounded-xl border border-amber-500/25 light:border-amber-200 bg-amber-500/10 light:bg-amber-50 px-5 py-3.5">
                    <CreditCard className="shrink-0 text-amber-400 light:text-amber-600" size={16} />
                    <p className="flex-1 text-sm text-amber-200 light:text-amber-700">
                      <span className="font-semibold">Payment required</span> — complete checkout to activate this workspace.
                    </p>
                    <button
                      className="shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-50"
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
                  <div className="flex items-center gap-4 rounded-xl border border-red-500/25 light:border-red-200 bg-red-500/10 light:bg-red-50 px-5 py-3.5">
                    <ShieldAlert className="shrink-0 text-red-400 light:text-red-600" size={16} />
                    <p className="text-sm text-red-200 light:text-red-700">
                      <span className="font-semibold">Workspace suspended</span> — your subscription may have lapsed.
                    </p>
                  </div>
                )}
                {checkoutError && (
                  <div className="rounded-xl border border-red-500/25 light:border-red-200 bg-red-500/10 light:bg-red-50 px-5 py-3 text-sm text-red-200 light:text-red-700">
                    {checkoutError}
                  </div>
                )}
              </div>
            )}

            {/* ── Greeting header ──────────────────────────────────── */}
            <div className="animate-rise mb-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold text-white light:text-neutral-950">
                {greeting()}, <span className="text-accent-strong">{authUser?.firstName ?? creator.name}</span>
              </h1>
              <p className="mt-1 text-sm text-white/40 light:text-neutral-950/40">
                Here's how {creator.name} is performing.
              </p>
            </div>

            {/* ── Hero: Total revenue ─────────────────────────────── */}
            <HeroRevenueCard
              totalCents={homeSummary?.totalPaidAmountCents ?? 0}
              currency={currency}
              trend={revenueTrend}
            />

            {/* ── Primary stats ───────────────────────────────────── */}
            <div className="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard
                icon={Package}
                label="Products"
                value={productCount != null ? String(productCount) : '—'}
                onClick={() => navigate(`/app/${creator.slug}/products`)}
                delay={60}
                color={STAT_COLORS[0]}
              />
              <StatCard
                icon={FileText}
                label="Landing pages"
                value={landingPageCount != null ? String(landingPageCount) : '—'}
                onClick={() => navigate(`/app/${creator.slug}/landing-pages`)}
                delay={110}
                color={STAT_COLORS[1]}
              />
              <StatCard
                icon={Mail}
                label="Emails this month"
                value={
                  maxEmailsPerMonth != null
                    ? `${emailsSentThisMonth.toLocaleString()} / ${maxEmailsPerMonth < 0 ? '∞' : maxEmailsPerMonth.toLocaleString()}`
                    : '—'
                }
                onClick={() => navigate(`/app/${creator.slug}/emails`)}
                delay={160}
                color={STAT_COLORS[2]}
              />
            </div>

            {/* ── Secondary stats (real, computed from orders) ────── */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={Trophy}
                label={topProduct ? `Top product · ${formatCurrency(topProduct.totalCents, currency)}` : 'Top product'}
                value={topProduct ? topProduct.name : '—'}
                muted
                delay={200}
                color={STAT_COLORS[3]}
              />
              <StatCard
                icon={Zap}
                label="Avg. order value"
                value={avgOrderValueCents != null ? formatCurrency(avgOrderValueCents, currency) : '—'}
                muted
                delay={240}
                color={STAT_COLORS[4]}
              />
              <StatCard
                icon={TrendingUp}
                label="Revenue this month"
                value={formatCurrency(thisMonthRevenueCents, currency)}
                muted
                delay={280}
                color={STAT_COLORS[0]}
              />
            </div>

            {/* ── Charts row: Revenue trend + Revenue by product ──── */}
            <div className="mb-6 grid gap-4 lg:grid-cols-5">
              <div className="animate-rise rounded-2xl border border-border bg-card p-5 backdrop-blur-sm lg:col-span-3" style={{ animationDelay: '300ms' }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                  Revenue trend
                </p>
                <p className="mt-0.5 text-[11px] text-white/30 light:text-neutral-950/30">Last 14 days</p>
                <div className="mt-4 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueTrend.map((v, i) => ({ day: i, revenueCents: v }))} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                      <YAxis width={34} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => String(v / 100)} />
                      <Tooltip content={<RevenueTooltip currency={currency} />} />
                      <Bar dataKey="revenueCents" name="Revenue" fill="var(--color-chart-4)" radius={[3, 3, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="animate-rise rounded-2xl border border-border bg-card p-5 backdrop-blur-sm lg:col-span-2" style={{ animationDelay: '340ms' }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                  Revenue by product
                </p>
                {products && products.some((p) => p.revenueCents > 0) ? (
                  <>
                    <div className="mt-2 h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={products.filter((p) => p.revenueCents > 0)}
                            dataKey="revenueCents"
                            nameKey="name"
                            innerRadius={38}
                            outerRadius={58}
                            paddingAngle={2}
                          >
                            {products.filter((p) => p.revenueCents > 0).map((p, i) => (
                              <Cell key={p.publicId} fill={STAT_COLORS[i % STAT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ProductTooltip currency={currency} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 grid gap-1.5">
                      {products.filter((p) => p.revenueCents > 0).slice(0, 5).map((p, i) => (
                        <div key={p.publicId} className="flex items-center gap-2 text-xs">
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: STAT_COLORS[i % STAT_COLORS.length] }} />
                          <span className="min-w-0 flex-1 truncate text-white/60 light:text-neutral-950/60">{p.name}</span>
                          <span className="font-data shrink-0 tabular-nums text-white/80 light:text-neutral-950/80">
                            {formatCurrency(p.revenueCents, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
                    <Package size={22} className="text-white/15 light:text-neutral-950/15" />
                    <p className="text-sm text-white/40 light:text-neutral-950/40">No product revenue yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">

              {/* Left column (2/3) */}
              <div className="flex flex-col gap-6 lg:col-span-2">

                {/* ── Section 1: Kutak s planom ──────────────────────── */}
                <div
                  className="animate-rise rounded-2xl border border-border bg-card p-5 backdrop-blur-sm"
                  style={{ animationDelay: '320ms' }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                      Your plan
                    </p>
                    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-cyan px-3 py-1 shadow-lg shadow-accent/20">
                      <Zap size={11} className="text-white light:text-neutral-950" />
                      <span className="text-xs font-bold text-white light:text-neutral-950">{planName}</span>
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
                      progress={
                        maxLandingPages != null && maxLandingPages > 0 && landingPageCount != null
                          ? landingPageCount / maxLandingPages
                          : null
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
                      progress={
                        maxProducts != null && maxProducts > 0 && productCount != null
                          ? productCount / maxProducts
                          : null
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
                      progress={
                        maxEmailsPerMonth != null && maxEmailsPerMonth > 0
                          ? emailsSentThisMonth / maxEmailsPerMonth
                          : null
                      }
                      icon={Mail}
                    />
                  </div>
                </div>

                {/* ── Section 3: Conditional block ────────────────── */}
                <div className="animate-rise flex flex-1 flex-col" style={{ animationDelay: '360ms' }}>
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
              </div>

              {/* Right column (1/3) */}
              <div className="flex flex-col gap-6">

                {/* Plan + billing actions */}
                <div className="animate-rise rounded-2xl border border-border bg-card p-6 backdrop-blur-sm" style={{ animationDelay: '160ms' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                    Billing
                  </p>
                  <p className="font-display mt-1.5 text-2xl font-bold text-white light:text-neutral-950">{planName}</p>
                  {isCancelledAtPeriodEnd && (
                    <p className="mt-1 text-xs text-amber-400 light:text-amber-600">Cancels at period end</p>
                  )}

                  <div className="mt-5 grid gap-2">
                    {creator.planCode === 'free' ? (
                      <button
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong"
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
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-white/70 light:text-neutral-950/70 transition hover:bg-secondary hover:text-white light:hover:text-neutral-950"
                            type="button"
                            onClick={() => void openBillingPortal()}
                          >
                            <ExternalLink size={14} />
                            Manage billing
                          </button>
                        )}
                        {requiresPayment && (
                          <button
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-50"
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
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 light:border-red-200 bg-red-500/10 light:bg-red-50 py-2.5 text-sm font-medium text-red-300 light:text-red-700 transition hover:bg-red-500/20 light:hover:bg-red-100 disabled:opacity-40"
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
                    <p className="mt-3 text-xs text-red-300 light:text-red-700">{cancelSubscriptionError}</p>
                  )}
                </div>

                {/* Workspace info */}
                <div className="animate-rise rounded-2xl border border-border bg-card p-6 backdrop-blur-sm" style={{ animationDelay: '210ms' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                    Workspace info
                  </p>
                  <div className="mt-4 grid gap-3">
                    <InfoRow label="ID" value={creator.publicId} mono />
                    <InfoRow label="Slug" value={`/${creator.slug}`} mono />
                    <InfoRow label="Status" value={creator.status} />
                    <InfoRow label="Currency" value={creator.defaultCurrency} />
                  </div>
                </div>

                {/* Payouts — mini card, full detail lives on the Payouts tab */}
                <button
                  type="button"
                  onClick={() => navigate(`/app/${creator.slug}/payouts`)}
                  className="animate-rise flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-6 text-left backdrop-blur-sm transition hover:bg-secondary"
                  style={{ animationDelay: '230ms' }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                      Payouts
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <PayoutStatusBadge
                        label={payoutStatusLabel(creator)}
                        tone={payoutStatusTone(creator)}
                      />
                    </div>
                    {creator.payoutMode === 'BankTransfer' && creator.hasPayoutProfile ? (
                      payoutSummaryStatus === 'loading' ? (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-white/40 light:text-neutral-950/40">
                          <Loader2 className="animate-spin" size={12} />
                          Loading balance…
                        </p>
                      ) : payoutSummary ? (
                        <p className="font-data mt-2 text-lg font-bold tabular-nums text-white light:text-neutral-950">
                          {formatCurrency(payoutSummary.balanceCents, payoutSummary.currency)}
                        </p>
                      ) : null
                    ) : null}
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-white/40 light:text-neutral-950/40">
                    View payouts
                    <ArrowRight size={11} />
                  </span>
                </button>

                {/* Danger zone */}
                <div className="animate-rise rounded-2xl border border-border bg-card p-6 backdrop-blur-sm" style={{ animationDelay: '260ms' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                    Danger zone
                  </p>
                  <p className="mt-2 text-sm text-white/40 light:text-neutral-950/40">
                    Permanently delete this workspace and all its data.
                  </p>
                  <button
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 light:border-red-200 bg-red-500/10 light:bg-red-50 py-2.5 text-sm font-medium text-red-300 light:text-red-700 transition hover:bg-red-500/20 light:hover:bg-red-100"
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

function HeroRevenueCard({
  totalCents,
  currency,
  trend,
}: {
  totalCents: number
  currency: string
  trend: number[]
}) {
  const animatedCents = useCountUp(totalCents)
  const { line, area } = buildSparklinePath(trend, 220, 64)
  const hasTrendSignal = trend.some((v) => v > 0)

  return (
    <div
      className="animate-rise group relative mb-4 overflow-hidden rounded-3xl border border-border p-7 backdrop-blur-sm transition-shadow hover:border-white/15 light:hover:border-neutral-950/15"
      style={{
        background: 'linear-gradient(135deg, rgba(76,124,240,0.14), transparent 60%)',
        boxShadow: '0 20px 40px -20px rgba(76,124,240,0.25)',
      }}
    >
      <div className="animate-glow-pulse pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-accent-cyan/20 blur-3xl" />
      <div className="relative flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
            Total revenue
          </p>
          <p className="font-data mt-1.5 text-[44px] font-bold leading-none tracking-tight text-accent-strong tabular-nums">
            {formatCurrency(Math.round(animatedCents), currency)}
          </p>
          <p className="mt-2 text-xs font-medium text-white/40 light:text-neutral-950/40">
            Sav prihod od početka rada
          </p>
        </div>
        {hasTrendSignal ? (
        <svg width={220} height={64} viewBox="0 0 220 64" className="hidden shrink-0 sm:block">
          <defs>
            <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5EEAD4" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="heroSparkLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4C7CF0" />
              <stop offset="100%" stopColor="#5EEAD4" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#heroSparkFill)" />
          <path
            d={line}
            fill="none"
            stroke="url(#heroSparkLine)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-line"
            style={{ '--draw-length': 340 } as CSSProperties}
          />
        </svg>
        ) : null}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  onClick,
  muted,
  delay = 0,
  color = 'var(--color-accent)',
}: {
  icon: typeof Package
  label: string
  value: string
  onClick?: () => void
  muted?: boolean
  delay?: number
  color?: string
}) {
  const base =
    'animate-rise group rounded-2xl border border-border bg-card p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 light:hover:border-neutral-950/20 hover:bg-secondary hover:shadow-lg hover:shadow-black/30'
  const interactive = onClick ? 'cursor-pointer' : ''
  return (
    <div
      className={`${base} ${interactive} ${muted ? 'opacity-90' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div
        className="mb-2.5 grid size-6 place-items-center rounded-md transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
      >
        <Icon size={13} />
      </div>
      <p className="font-data truncate text-xl font-bold tracking-tight text-white light:text-neutral-950 tabular-nums">{value}</p>
      <p className="mt-1 truncate text-xs text-white/40 light:text-neutral-950/40">{label}</p>
    </div>
  )
}

function PlanStat({
  label,
  value,
  icon: Icon,
  progress,
}: {
  label: string
  value: string
  icon: typeof FileText
  progress?: number | null
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-3.5">
      <Icon size={14} className="text-white/40 light:text-neutral-950/40" />
      <div>
        <p className="font-data text-sm font-semibold text-white light:text-neutral-950 tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs text-white/40 light:text-neutral-950/40">{label}</p>
      </div>
      {progress != null && (
        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/10 light:bg-neutral-950/10">
          <span
            className="animate-bar-fill block h-full rounded-full bg-gradient-to-r from-accent to-accent-cyan"
            style={{ width: `${Math.min(100, Math.max(2, progress * 100))}%` }}
          />
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-white/40 light:text-neutral-950/40">{label}</span>
      <span className={`truncate text-xs font-medium text-white/80 light:text-neutral-950/80 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function PayoutStatusBadge({ label, tone }: { label: string; tone: 'success' | 'warning' | 'neutral' }) {
  const toneClasses =
    tone === 'success'
      ? 'bg-emerald-500/15 text-emerald-300 light:bg-emerald-50 light:text-emerald-700'
      : tone === 'warning'
        ? 'bg-amber-500/15 text-amber-300 light:bg-amber-50 light:text-amber-700'
        : 'bg-white/10 text-white/50 light:bg-neutral-950/10 light:text-neutral-950/50'
  const dotClasses =
    tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-white/40 light:bg-neutral-950/40'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses}`}>
      <span className={`size-1.5 rounded-full ${dotClasses}`} />
      {label}
    </span>
  )
}

function payoutStatusLabel(creator: { payoutMode: string; stripeConnectPayoutsEnabled: boolean; stripeConnectDetailsSubmitted: boolean; hasPayoutProfile: boolean }): string {
  if (creator.payoutMode === 'StripeConnect') {
    return creator.stripeConnectPayoutsEnabled ? 'Ready' : creator.stripeConnectDetailsSubmitted ? 'In progress' : 'Not connected'
  }
  return creator.hasPayoutProfile ? 'Ready' : 'Bank details missing'
}

function payoutStatusTone(creator: { payoutMode: string; stripeConnectPayoutsEnabled: boolean; stripeConnectDetailsSubmitted: boolean; hasPayoutProfile: boolean }): 'success' | 'warning' | 'neutral' {
  if (creator.payoutMode === 'StripeConnect') {
    if (creator.stripeConnectPayoutsEnabled) return 'success'
    return creator.stripeConnectDetailsSubmitted ? 'warning' : 'neutral'
  }
  return creator.hasPayoutProfile ? 'success' : 'warning'
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
    <div className="flex-1 rounded-2xl border border-border bg-card p-6 backdrop-blur-sm">
      <h3 className="font-display text-sm font-semibold text-white light:text-neutral-950">Getting started</h3>
      <p className="mt-1 text-sm text-white/40 light:text-neutral-950/40">Complete these steps to launch your workspace.</p>

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
    <div className={`flex items-start gap-3 rounded-xl p-3 ${done ? '' : 'bg-card'}`}>
      <div
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
          done ? 'bg-emerald-500' : 'border-2 border-white/15 light:border-neutral-950/15'
        }`}
      >
        {done && <CheckCircle2 size={12} className="text-white light:text-neutral-950" strokeWidth={3} />}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${done ? 'text-white/30 light:text-neutral-950/30 line-through' : 'text-white light:text-neutral-950'}`}>
          {label}
        </p>
        <p className="mt-0.5 text-xs text-white/40 light:text-neutral-950/40">{desc}</p>
      </div>
      {!done && action && (
        <button
          type="button"
          disabled={action.disabled}
          onClick={action.onClick}
          className="shrink-0 inline-flex h-7 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong disabled:opacity-50"
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
    <div className="flex-1 rounded-2xl border border-border bg-card p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-white light:text-neutral-950">Recent transactions</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-medium text-white/40 light:text-neutral-950/40 transition hover:text-white light:hover:text-neutral-950"
        >
          View all
          <ArrowRight size={11} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <ShoppingBag size={22} className="text-white/15 light:text-neutral-950/15" />
          <p className="text-sm text-white/40 light:text-neutral-950/40">No paid orders yet.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {orders.map((order) => (
            <div
              key={order.publicId}
              className="group flex items-center gap-3 rounded-xl bg-muted px-4 py-3 transition-colors hover:bg-secondary"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 text-[10.5px] font-bold text-accent-strong transition-transform duration-200 group-hover:scale-110">
                {orderInitials(order)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white light:text-neutral-950">
                  {order.name ?? order.email}
                </p>
                <p className="truncate text-xs text-white/40 light:text-neutral-950/40">{order.productName}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-data text-sm font-semibold text-white light:text-neutral-950 tabular-nums">
                  {formatCurrency(order.amountCents, order.currency)}
                </p>
                <p className="text-xs text-white/40 light:text-neutral-950/40">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="grid size-11 place-items-center rounded-xl bg-amber-500/12 light:bg-amber-50">
          <AlertTriangle className="text-amber-400 light:text-amber-600" size={22} />
        </div>
        <h2 className="font-display mt-4 text-lg font-semibold text-white light:text-neutral-950">Cancel subscription?</h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-950/50">
          Your plan remains active until the end of the current billing period. After that, the
          workspace will be suspended and landing pages will go offline.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-white/70 light:text-neutral-950/70 transition hover:bg-secondary"
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Keep plan
          </button>
          <button
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong disabled:opacity-40"
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

/* ─── Helpers ─────────────────────────────────────────────────── */

function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

function orderInitials(order: Order): string {
  const source = order.name ?? order.email
  const parts = source.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function buildSparklinePath(values: number[], width: number, height: number): { line: string; area: string } {
  if (values.length === 0) return { line: '', area: '' }
  const max = Math.max(...values, 1)
  const stepX = width / Math.max(values.length - 1, 1)
  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - (v / max) * (height - 4) - 2
    return [x, y] as const
  })
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  return { line, area }
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

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function RevenueTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: { value?: number }[]
  currency: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="flex items-center gap-2 text-white/70">
        <span className="size-2 rounded-full" style={{ backgroundColor: 'var(--color-chart-4)' }} />
        Revenue: <span className="font-semibold text-white">{formatCurrency(payload[0].value ?? 0, currency)}</span>
      </p>
    </div>
  )
}

function ProductTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: { value?: number; payload?: { name?: string } }[]
  currency: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-white">{entry.payload?.name}</p>
      <p className="mt-0.5 text-white/70">{formatCurrency(entry.value ?? 0, currency)}</p>
    </div>
  )
}
