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
  ShoppingBag,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getHomeSummary } from "../../orders/api/orders-api";
import type { HomeSummary, Order } from "../../orders/model/types";
import { listProducts } from "../../products/api/products-api";
import type { Product } from "../../products/model/types";
import { AppShell } from "../../../shared/ui/AppShell";
import { CHART_COLORS as STAT_COLORS } from "../../../shared/ui/chart-colors";
import { useAuthStore } from "../../auth/model/auth-store";
import { DeleteCreatorDialog } from "../components/DeleteCreatorDialog";
import { WorkspaceStatusBanner } from "../components/WorkspaceStatusBanner";
import { useCreatorStore } from "../model/creator-store";
import { usePayoutStore } from "../model/payout-store";

export function CreatorWorkspacePage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const currentCreator = useCreatorStore((s) => s.currentCreator);
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus);
  const creatorPlans = useCreatorStore((s) => s.creatorPlans);
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans);
  const checkoutStatus = useCreatorStore((s) => s.checkoutStatus);
  const checkoutError = useCreatorStore((s) => s.checkoutError);
  const cancelSubscriptionStatus = useCreatorStore(
    (s) => s.cancelSubscriptionStatus,
  );
  const cancelSubscriptionError = useCreatorStore(
    (s) => s.cancelSubscriptionError,
  );
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator);
  const startCreatorCheckout = useCreatorStore((s) => s.startCreatorCheckout);
  const cancelSubscription = useCreatorStore((s) => s.cancelSubscription);
  const openBillingPortal = useCreatorStore((s) => s.openBillingPortal);
  const resetDeleteCreatorFeedback = useCreatorStore(
    (s) => s.resetDeleteCreatorFeedback,
  );
  const resetCancelSubscriptionFeedback = useCreatorStore(
    (s) => s.resetCancelSubscriptionFeedback,
  );

  const payoutSummary = usePayoutStore((s) => s.payoutSummary);
  const payoutSummaryStatus = usePayoutStore((s) => s.payoutSummaryStatus);
  const loadPayoutSummary = usePayoutStore((s) => s.loadPayoutSummary);

  const authUser = useAuthStore((s) => s.currentUser);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [homeSummary, setHomeSummary] = useState<HomeSummary | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);

  const isLoading =
    currentCreatorStatus === "loading" || currentCreatorStatus === "idle";
  const creator = currentCreator?.slug === slug ? currentCreator : null;
  const requiresPayment = creator?.status.toLowerCase() === "pendingpayment";
  const isActive = creator?.status.toLowerCase() === "active";
  const isSuspended = creator?.status.toLowerCase() === "suspended";
  const isCancelledAtPeriodEnd = creator?.cancelAtPeriodEnd === true;
  const isStartingCheckout = checkoutStatus === "submitting";
  const isCancellingSubscription = cancelSubscriptionStatus === "submitting";
  const planName = formatPlanName(creator?.planCode ?? "");
  const currentPlan = creatorPlans.find((p) => p.code === creator?.planCode);
  const maxLandingPages = currentPlan?.limits["max_landing_pages"] ?? null;
  const maxProducts = currentPlan?.limits["max_products"] ?? null;
  const maxEmailsPerMonth =
    currentPlan?.limits["max_email_sends_per_month"] ?? null;
  const platformFeePercent =
    currentPlan != null
      ? (currentPlan.platformFeeBasisPoints / 100).toFixed(1)
      : null;
  const productCount = homeSummary?.productCount ?? null;
  const landingPageCount = homeSummary?.landingPageCount ?? null;
  const currency = homeSummary?.currency ?? creator?.defaultCurrency ?? "EUR";

  // Recent 5 transactions, 14-day revenue trend, top product and this-month revenue are now computed
  // server-side and returned in the (cached) home summary — no need to pull the full orders list here.
  const recentOrders = homeSummary?.recentOrders ?? [];
  const revenueTrend = homeSummary?.revenueTrend ?? [];
  const viewsTrend = homeSummary?.viewsTrend ?? [];
  const emailsSentThisMonth = homeSummary?.emailsSentThisMonth ?? 0;

  // Onboarding done = has product + has landing page + status active
  const onboardingDone =
    isActive &&
    productCount != null &&
    productCount > 0 &&
    landingPageCount != null &&
    landingPageCount > 0;

  useEffect(() => {
    if (currentCreatorStatus === "idle") void loadCurrentCreator();
  }, [currentCreatorStatus, loadCurrentCreator]);

  useEffect(() => {
    void loadCreatorPlans();
  }, [loadCreatorPlans]);

  useEffect(() => {
    if (!slug) return;
    void getHomeSummary(slug)
      .then(setHomeSummary)
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    void listProducts(slug)
      .then(setProducts)
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (creator?.payoutMode !== "BankTransfer") return;
    const creatorSlug = creator.slug;
    void loadPayoutSummary(creatorSlug);
    // Balance moves server-side (purchases, admin payouts) — refresh it whenever the user
    // comes back to this tab, e.g. after paying in Stripe Checkout or browsing the dashboard.
    const refetchOnFocus = () => {
      void loadPayoutSummary(creatorSlug);
    };
    window.addEventListener("focus", refetchOnFocus);
    return () => window.removeEventListener("focus", refetchOnFocus);
  }, [creator?.payoutMode, creator?.slug, loadPayoutSummary]);

  const startCheckout = async () => {
    const checkout = await startCreatorCheckout();
    if (checkout?.checkoutUrl) window.location.assign(checkout.checkoutUrl);
  };

  if (!slug) return null;

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
            <p className="font-display font-semibold text-white light:text-neutral-950">
              Workspace not found
            </p>
            <p className="mt-1 text-sm text-white/40 light:text-neutral-950/40">
              This slug doesn't match your workspace.
            </p>
            <button
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-white/70 light:text-neutral-950/70 transition hover:bg-secondary"
              type="button"
              onClick={() => navigate("/")}
            >
              Go home
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col">
          {/* ── Body ────────────────────────────────────────────────── */}
          <div className="flex-1 p-8">
            <WorkspaceStatusBanner
              requiresPayment={requiresPayment}
              isSuspended={isSuspended}
              checkoutError={checkoutError}
              isStartingCheckout={isStartingCheckout}
              onPayNow={() => void startCheckout()}
            />

            {/* ── Greeting header ──────────────────────────────────── */}

            <div className="mb-8">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-mono">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1
                className="font-black leading-none mb-2"
                style={{
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontSize: "2.5rem",
                }}
              >
                {greeting()},{" "}
                <span style={{ color: "var(--color-chart-1)" }}>
                  {authUser?.firstName ?? creator.name}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s your creator workspace at a glance.
              </p>
            </div>

            {/* ── Hero: Total revenue ─────────────────────────────── */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              <StatCard
                label="Total Revenue"
                value={formatCurrency(
                  homeSummary?.totalPaidAmountCents ?? 0,
                  currency,
                )}
                sub="All time"
                color={STAT_COLORS[0]}
              />
              <StatCard
                label="Subscribers"
                value={(homeSummary?.subscriberCount ?? 0).toLocaleString()}
                sub="All landing pages"
                color={STAT_COLORS[1]}
              />
              <StatCard
                label="Page Views"
                value={(homeSummary?.totalPageViews ?? 0).toLocaleString()}
                sub="All landing pages"
                color={STAT_COLORS[2]}
              />
              <StatCard
                label="Emails Sent"
                value={
                  maxEmailsPerMonth != null
                    ? `${emailsSentThisMonth.toLocaleString()}/${maxEmailsPerMonth < 0 ? "∞" : maxEmailsPerMonth.toLocaleString()}`
                    : "—"
                }
                sub={
                  maxEmailsPerMonth != null && maxEmailsPerMonth > 0
                    ? `${Math.max(0, maxEmailsPerMonth - emailsSentThisMonth).toLocaleString()} left this month`
                    : undefined
                }
                color={STAT_COLORS[3]}
              />
              <StatCard
                label="Platform Fee"
                value={
                  platformFeePercent != null ? `${platformFeePercent}%` : "—"
                }
                sub="Per transaction"
                color={STAT_COLORS[4]}
              />
            </div>

            {/* ── Charts row: Revenue trend + Revenue by product ──── */}
            <div className="mb-6 grid gap-4 lg:grid-cols-5">
              <Card className="p-5 lg:col-span-3">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm font-bold">Revenue trend</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Last 7 days · daily
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm inline-block"
                        style={{ backgroundColor: "var(--color-chart-4)" }}
                      />
                      Revenue
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm inline-block"
                        style={{ backgroundColor: "var(--color-chart-1)" }}
                      />
                      Views
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart
                    data={revenueTrend.map((v, i) => {
                      const daysAgo = revenueTrend.length - 1 - i;
                      const date = new Date();
                      date.setDate(date.getDate() - daysAgo);
                      return {
                        day: date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        }),
                        revenueCents: v,
                        views: viewsTrend[i] ?? 0,
                      };
                    })}
                    margin={{ top: 0, right: 4, bottom: 0, left: -18 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.04)"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{
                        fill: "#555",
                        fontSize: 10,
                        fontFamily: "DM Mono",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fill: "#555",
                        fontSize: 10,
                        fontFamily: "DM Mono",
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => String(v / 100)}
                    />
                    <Tooltip content={<RevenueTooltip currency={currency} />} />
                    <Bar
                      dataKey="revenueCents"
                      fill="var(--color-chart-4)"
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.75}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
              {/*
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
              </div>*/}

              <div
                className="animate-rise rounded-2xl border border-border bg-card p-5 backdrop-blur-sm lg:col-span-2"
                style={{ animationDelay: "340ms" }}
              >
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
                            {products
                              .filter((p) => p.revenueCents > 0)
                              .map((p, i) => (
                                <Cell
                                  key={p.publicId}
                                  fill={STAT_COLORS[i % STAT_COLORS.length]}
                                />
                              ))}
                          </Pie>
                          <Tooltip
                            content={<ProductTooltip currency={currency} />}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 grid gap-1.5">
                      {products
                        .filter((p) => p.revenueCents > 0)
                        .slice(0, 5)
                        .map((p, i) => (
                          <div
                            key={p.publicId}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  STAT_COLORS[i % STAT_COLORS.length],
                              }}
                            />
                            <span className="min-w-0 flex-1 truncate text-white/60 light:text-neutral-950/60">
                              {p.name}
                            </span>
                            <span className="font-data shrink-0 tabular-nums text-white/80 light:text-neutral-950/80">
                              {formatCurrency(p.revenueCents, currency)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
                    <Package
                      size={22}
                      className="text-white/15 light:text-neutral-950/15"
                    />
                    <p className="text-sm text-white/40 light:text-neutral-950/40">
                      No product revenue yet.
                    </p>
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
                  style={{ animationDelay: "320ms" }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                      Your plan
                    </p>
                    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-cyan px-3 py-1 shadow-lg shadow-accent/20">
                      <Zap
                        size={11}
                        className="text-white light:text-neutral-950"
                      />
                      <span className="text-xs font-bold text-white light:text-neutral-950">
                        {planName}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <PlanStat
                      label="Landing pages"
                      value={
                        landingPageCount != null && maxLandingPages != null
                          ? `${landingPageCount} / ${maxLandingPages < 0 ? "∞" : maxLandingPages}`
                          : maxLandingPages != null
                            ? maxLandingPages < 0
                              ? "Unlimited"
                              : `Up to ${maxLandingPages}`
                            : "—"
                      }
                      progress={
                        maxLandingPages != null &&
                        maxLandingPages > 0 &&
                        landingPageCount != null
                          ? landingPageCount / maxLandingPages
                          : null
                      }
                      icon={FileText}
                    />
                    <PlanStat
                      label="Products"
                      value={
                        productCount != null && maxProducts != null
                          ? `${productCount} / ${maxProducts < 0 ? "∞" : maxProducts}`
                          : maxProducts != null
                            ? maxProducts < 0
                              ? "Unlimited"
                              : `Up to ${maxProducts}`
                            : "—"
                      }
                      progress={
                        maxProducts != null &&
                        maxProducts > 0 &&
                        productCount != null
                          ? productCount / maxProducts
                          : null
                      }
                      icon={Package}
                    />
                    <PlanStat
                      label="Platform fee"
                      value={
                        platformFeePercent != null
                          ? `${platformFeePercent}%`
                          : "—"
                      }
                      icon={Zap}
                    />
                    <PlanStat
                      label="Email limit / mo"
                      value={
                        maxEmailsPerMonth != null
                          ? maxEmailsPerMonth < 0
                            ? "Unlimited"
                            : maxEmailsPerMonth.toLocaleString()
                          : "—"
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
                <div
                  className="animate-rise flex flex-1 flex-col"
                  style={{ animationDelay: "360ms" }}
                >
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
                      onGoToProducts={() =>
                        navigate(`/app/${creator.slug}/products`)
                      }
                      onGoToLandingPages={() =>
                        navigate(`/app/${creator.slug}/landing-pages`)
                      }
                    />
                  )}
                </div>
              </div>

              {/* Right column (1/3) */}
              <div className="flex flex-col gap-6">
                {/* Plan + billing actions */}
                <div
                  className="animate-rise rounded-2xl border border-border bg-card p-6 backdrop-blur-sm"
                  style={{ animationDelay: "160ms" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-950/30">
                    Billing
                  </p>
                  <p className="font-display mt-1.5 text-2xl font-bold text-white light:text-neutral-950">
                    {planName}
                  </p>
                  {isCancelledAtPeriodEnd && (
                    <p className="mt-1 text-xs text-amber-400 light:text-amber-600">
                      Cancels at period end
                    </p>
                  )}

                  <div className="mt-5 grid gap-2">
                    {creator.planCode === "free" ? (
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
                              resetCancelSubscriptionFeedback();
                              setIsCancelDialogOpen(true);
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
                    <p className="mt-3 text-xs text-red-300 light:text-red-700">
                      {cancelSubscriptionError}
                    </p>
                  )}
                </div>

                {/* Workspace info */}
                <div
                  className="animate-rise rounded-2xl border border-border bg-card p-6 backdrop-blur-sm"
                  style={{ animationDelay: "210ms" }}
                >
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
                  style={{ animationDelay: "230ms" }}
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
                    {creator.payoutMode === "BankTransfer" &&
                    creator.hasPayoutProfile ? (
                      payoutSummaryStatus === "loading" ? (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-white/40 light:text-neutral-950/40">
                          <Loader2 className="animate-spin" size={12} />
                          Loading balance…
                        </p>
                      ) : payoutSummary ? (
                        <p className="font-data mt-2 text-lg font-bold tabular-nums text-white light:text-neutral-950">
                          {formatCurrency(
                            payoutSummary.balanceCents,
                            payoutSummary.currency,
                          )}
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
                <div
                  className="animate-rise rounded-2xl border border-border bg-card p-6 backdrop-blur-sm"
                  style={{ animationDelay: "260ms" }}
                >
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
                      resetDeleteCreatorFeedback();
                      setIsDeleteDialogOpen(true);
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
          onDeleted={() => navigate("/")}
        />
      ) : null}

      {isCancelDialogOpen ? (
        <CancelSubscriptionDialog
          isSubmitting={isCancellingSubscription}
          onClose={() => setIsCancelDialogOpen(false)}
          onConfirm={async () => {
            const ok = await cancelSubscription();
            if (ok) setIsCancelDialogOpen(false);
          }}
        />
      ) : null}
    </AppShell>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function Card({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl bg-card ${className}`}
      style={{ border: "1px solid rgba(255,255,255,0.07)", ...style }}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2.5">
        {label}
      </p>
      <p
        className="font-bold leading-none mb-1.5"
        style={{
          fontFamily: "DM Mono, monospace",
          fontSize: "1.55rem",
          color: color || "#EEE9F0",
        }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function PlanStat({
  label,
  value,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  icon: typeof FileText;
  progress?: number | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-3.5">
      <Icon size={14} className="text-white/40 light:text-neutral-950/40" />
      <div>
        <p className="font-data text-sm font-semibold text-white light:text-neutral-950 tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 text-xs text-white/40 light:text-neutral-950/40">
          {label}
        </p>
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
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-white/40 light:text-neutral-950/40">
        {label}
      </span>
      <span
        className={`truncate text-xs font-medium text-white/80 light:text-neutral-950/80 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function PayoutStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "neutral";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-300 light:bg-emerald-50 light:text-emerald-700"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-300 light:bg-amber-50 light:text-amber-700"
        : "bg-white/10 text-white/50 light:bg-neutral-950/10 light:text-neutral-950/50";
  const dotClasses =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "warning"
        ? "bg-amber-500"
        : "bg-white/40 light:bg-neutral-950/40";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses}`}
    >
      <span className={`size-1.5 rounded-full ${dotClasses}`} />
      {label}
    </span>
  );
}

function payoutStatusLabel(creator: {
  payoutMode: string;
  stripeConnectPayoutsEnabled: boolean;
  stripeConnectDetailsSubmitted: boolean;
  hasPayoutProfile: boolean;
}): string {
  if (creator.payoutMode === "StripeConnect") {
    return creator.stripeConnectPayoutsEnabled
      ? "Ready"
      : creator.stripeConnectDetailsSubmitted
        ? "In progress"
        : "Not connected";
  }
  return creator.hasPayoutProfile ? "Ready" : "Bank details missing";
}

function payoutStatusTone(creator: {
  payoutMode: string;
  stripeConnectPayoutsEnabled: boolean;
  stripeConnectDetailsSubmitted: boolean;
  hasPayoutProfile: boolean;
}): "success" | "warning" | "neutral" {
  if (creator.payoutMode === "StripeConnect") {
    if (creator.stripeConnectPayoutsEnabled) return "success";
    return creator.stripeConnectDetailsSubmitted ? "warning" : "neutral";
  }
  return creator.hasPayoutProfile ? "success" : "warning";
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
  isActive: boolean;
  requiresPayment: boolean;
  isStartingCheckout: boolean;
  productCount: number;
  landingPageCount: number;
  onStartCheckout: () => void;
  onGoToProducts: () => void;
  onGoToLandingPages: () => void;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-card p-6 backdrop-blur-sm">
      <h3 className="font-display text-sm font-semibold text-white light:text-neutral-950">
        Getting started
      </h3>
      <p className="mt-1 text-sm text-white/40 light:text-neutral-950/40">
        Complete these steps to launch your workspace.
      </p>

      <div className="mt-5 grid gap-2">
        <ChecklistItem
          done={isActive || requiresPayment}
          label="Create your workspace"
          desc="You've set up your Creator Platform account."
        />
        <ChecklistItem
          done={isActive}
          label="Activate workspace"
          desc={
            isActive
              ? "Subscription is active."
              : "Complete checkout to unlock all features."
          }
          action={
            requiresPayment
              ? {
                  label: "Pay now",
                  disabled: isStartingCheckout,
                  onClick: onStartCheckout,
                }
              : undefined
          }
        />
        <ChecklistItem
          done={productCount > 0}
          label="Add a product"
          desc="Create at least one digital product to sell."
          action={
            productCount === 0
              ? { label: "Go to Products", onClick: onGoToProducts }
              : undefined
          }
        />
        <ChecklistItem
          done={landingPageCount > 0}
          label="Create a landing page"
          desc="Publish a page to start converting visitors."
          action={
            landingPageCount === 0
              ? { label: "Go to Landing Pages", onClick: onGoToLandingPages }
              : undefined
          }
        />
      </div>
    </div>
  );
}

function ChecklistItem({
  done,
  label,
  desc,
  action,
}: {
  done: boolean;
  label: string;
  desc: string;
  action?: { label: string; onClick: () => void; disabled?: boolean };
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl p-3 ${done ? "" : "bg-card"}`}
    >
      <div
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
          done
            ? "bg-emerald-500"
            : "border-2 border-white/15 light:border-neutral-950/15"
        }`}
      >
        {done && (
          <CheckCircle2
            size={12}
            className="text-white light:text-neutral-950"
            strokeWidth={3}
          />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${done ? "text-white/30 light:text-neutral-950/30 line-through" : "text-white light:text-neutral-950"}`}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs text-white/40 light:text-neutral-950/40">
          {desc}
        </p>
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
  );
}

function RecentTransactions({
  orders,
  onViewAll,
}: {
  orders: Order[];
  onViewAll: () => void;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-card p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-white light:text-neutral-950">
          Recent transactions
        </h3>
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
          <ShoppingBag
            size={22}
            className="text-white/15 light:text-neutral-950/15"
          />
          <p className="text-sm text-white/40 light:text-neutral-950/40">
            No paid orders yet.
          </p>
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
                <p className="truncate text-xs text-white/40 light:text-neutral-950/40">
                  {order.productName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-data text-sm font-semibold text-white light:text-neutral-950 tabular-nums">
                  {formatCurrency(order.amountCents, order.currency)}
                </p>
                <p className="text-xs text-white/40 light:text-neutral-950/40">
                  {new Date(order.paidAt ?? order.createdAt).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CancelSubscriptionDialog({
  isSubmitting,
  onClose,
  onConfirm,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="grid size-11 place-items-center rounded-xl bg-amber-500/12 light:bg-amber-50">
          <AlertTriangle
            className="text-amber-400 light:text-amber-600"
            size={22}
          />
        </div>
        <h2 className="font-display mt-4 text-lg font-semibold text-white light:text-neutral-950">
          Cancel subscription?
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-950/50">
          Your plan remains active until the end of the current billing period.
          After that, the workspace will be suspended and landing pages will go
          offline.
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
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={15} />
            ) : null}
            Confirm cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function orderInitials(order: Order): string {
  const source = order.name ?? order.email;
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function formatPlanName(code: string): string {
  switch (code.toLowerCase()) {
    case "free":
      return "Free";
    case "basic":
      return "Basic";
    case "pro":
      return "Pro";
    case "plus":
      return "Pro Plus";
    default:
      return code || "Free";
  }
}

function formatCurrency(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function RevenueTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: {
    value?: number;
    payload?: { revenueCents?: number; views?: number };
  }[];
  currency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="flex items-center gap-2 text-white/70">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: "var(--color-chart-4)" }}
        />
        Revenue:{" "}
        <span className="font-semibold text-white">
          {formatCurrency(row?.revenueCents ?? 0, currency)}
        </span>
      </p>
      <p className="mt-1 flex items-center gap-2 text-white/70">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: "var(--color-chart-1)" }}
        />
        Views:{" "}
        <span className="font-semibold text-white">
          {(row?.views ?? 0).toLocaleString()}
        </span>
      </p>
    </div>
  );
}

function ProductTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { value?: number; payload?: { name?: string } }[];
  currency: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-white">{entry.payload?.name}</p>
      <p className="mt-0.5 text-white/70">
        {formatCurrency(entry.value ?? 0, currency)}
      </p>
    </div>
  );
}
