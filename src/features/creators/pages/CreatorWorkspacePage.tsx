import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getHomeSummary } from "../../orders/api/orders-api";
import type { HomeSummary } from "../../orders/model/types";
import { listProducts } from "../../products/api/products-api";
import type { Product } from "../../products/model/types";
import { AppShell } from "../../../shared/ui/AppShell";
import { CHART_COLORS as STAT_COLORS } from "../../../shared/ui/chart-colors";
import { useAuthStore } from "../../auth/model/auth-store";
import { DeleteCreatorDialog } from "../components/DeleteCreatorDialog";
import { MonthlyRevenueChart } from "../components/MonthlyRevenueChart";
import { QuickStatsColumn } from "../components/QuickStatsColumn";
import { RecentTransactionsCard } from "../components/RecentTransactionsCard";
import { RevenueByProductChart } from "../components/RevenueByProductChart";
import { RevenueTrendChart } from "../components/RevenueTrendChart";
import { useCreatorStore } from "../model/creator-store";
import { usePayoutStore } from "../model/payout-store";

export function CreatorWorkspacePage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const currentCreator = useCreatorStore((s) => s.currentCreator);
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus);
  const creatorPlans = useCreatorStore((s) => s.creatorPlans);
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans);
  const cancelSubscriptionStatus = useCreatorStore(
    (s) => s.cancelSubscriptionStatus,
  );
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator);
  const cancelSubscription = useCreatorStore((s) => s.cancelSubscription);

  const loadPayoutSummary = usePayoutStore((s) => s.loadPayoutSummary);

  const authUser = useAuthStore((s) => s.currentUser);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [homeSummary, setHomeSummary] = useState<HomeSummary | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);

  const isLoading =
    currentCreatorStatus === "loading" || currentCreatorStatus === "idle";
  const creator = currentCreator?.slug === slug ? currentCreator : null;
  const isCancellingSubscription = cancelSubscriptionStatus === "submitting";
  const currentPlan = creatorPlans.find((p) => p.code === creator?.planCode);
  const maxEmailsPerMonth =
    currentPlan?.limits["max_email_sends_per_month"] ?? null;
  const platformFeePercent =
    currentPlan != null
      ? (currentPlan.platformFeeBasisPoints / 100).toFixed(1)
      : null;
  const currency = homeSummary?.currency ?? creator?.defaultCurrency ?? "EUR";

  // Recent 5 transactions, 14-day revenue trend, top product and this-month revenue are now computed
  // server-side and returned in the (cached) home summary — no need to pull the full orders list here.
  const recentOrders = homeSummary?.recentOrders ?? [];
  const revenueTrend = homeSummary?.revenueTrend ?? [];
  const viewsTrend = homeSummary?.viewsTrend ?? [];
  const monthlyRevenueTrend = homeSummary?.monthlyRevenueTrend ?? [];
  const avgOrderValueCents =
    homeSummary && homeSummary.paidOrderCount > 0
      ? Math.round(homeSummary.totalPaidAmountCents / homeSummary.paidOrderCount)
      : null;
  const emailsSentThisMonth = homeSummary?.emailsSentThisMonth ?? 0;

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
              <RevenueTrendChart
                revenueTrend={revenueTrend}
                viewsTrend={viewsTrend}
                currency={currency}
              />

              <RevenueByProductChart products={products} currency={currency} />
            </div>

            <div className="grid grid-cols-5 gap-4 mb-4">
              <MonthlyRevenueChart monthlyRevenueTrend={monthlyRevenueTrend} currency={currency} />

              <QuickStatsColumn
                avgOrderValueCents={avgOrderValueCents}
                totalPlatformFeeCents={homeSummary?.totalPlatformFeeCents ?? 0}
                currency={currency}
              />

              <RecentTransactionsCard
                orders={recentOrders}
                onViewAll={() => navigate(`/app/${creator.slug}/orders`)}
              />
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
