import {
  AlertTriangle,
  Archive,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../../shared/ui/AppShell";
import { useCreatorStore } from "../../creators/model/creator-store";
import { useProductStore } from "../../products/model/product-store";
import { useLandingPageStore } from "../model/landing-page-store";
import type {
  CreateLandingPageRequest,
  LandingPage,
  LandingPageStatus,
  LandingPageType,
} from "../model/types";

export function LandingPagesPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const currentCreator = useCreatorStore((s) => s.currentCreator);
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus);
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator);
  const creatorPlans = useCreatorStore((s) => s.creatorPlans);
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans);

  const pages = useLandingPageStore((s) => s.pages);
  const listStatus = useLandingPageStore((s) => s.listStatus);
  const loadPages = useLandingPageStore((s) => s.loadPages);
  const archivePage = useLandingPageStore((s) => s.archivePage);
  const restorePage = useLandingPageStore((s) => s.restorePage);
  const includeArchived = useLandingPageStore((s) => s.includeArchived);
  const setIncludeArchived = useLandingPageStore((s) => s.setIncludeArchived);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isLoading =
    currentCreatorStatus === "idle" || currentCreatorStatus === "loading";
  const creator = currentCreator?.slug === slug ? currentCreator : null;
  const currentPlan = creatorPlans.find((p) => p.code === creator?.planCode);
  const maxPages = currentPlan?.limits["max_landing_pages"] ?? null;
  const activePageCount = pages.filter((p) => p.status !== "Archived").length;
  const atLimit =
    maxPages !== null && maxPages >= 0 && activePageCount >= maxPages;
  const sortedPages = [...pages].sort(
    (a, b) => Number(a.status === "Archived") - Number(b.status === "Archived"),
  );

  useEffect(() => {
    if (currentCreatorStatus === "idle") void loadCurrentCreator();
  }, [currentCreatorStatus, loadCurrentCreator]);

  useEffect(() => {
    void loadCreatorPlans();
  }, [loadCreatorPlans]);

  useEffect(() => {
    if (slug && listStatus === "idle") void loadPages(slug);
  }, [slug, listStatus, loadPages]);

  if (!slug) return null;

  return (
    <AppShell slug={slug} activeSection="landing-pages">
      <div className="px-8 py-8">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading workspace…
          </div>
        ) : !creator ? (
          <div className="rounded-xl border border-border bg-card p-8">
            <p className="font-semibold text-white light:text-neutral-950">
              Workspace not found
            </p>
            <button
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-white/70 transition hover:bg-secondary light:text-neutral-600"
              type="button"
              onClick={() => navigate("/")}
            >
              Go home
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Header */}
            <PageHeader
              title="Landing Pages"
              subtitle="Manage your public-facing pages and track their performance."
              action={
                <div className="flex items-center gap-3">
                  {/* Show archived toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Show archived
                    </span>
                    <button
                      onClick={() =>
                        slug && setIncludeArchived(slug, !includeArchived)
                      }
                      className="relative rounded-full transition-colors"
                      style={{
                        width: 32,
                        height: 18,
                        backgroundColor: includeArchived
                          ? "var(--color-chart-1)"
                          : "rgba(255,255,255,0.1)",
                      }}
                    >
                      <div
                        className="absolute w-3.5 h-3.5 rounded-full bg-white shadow transition-all"
                        style={{
                          top: 2,
                          left: includeArchived ? 15 : 2,
                          width: 14,
                          height: 14,
                        }}
                      />
                    </button>
                  </div>
                  <PrimaryBtn onClick={() => setIsCreateOpen(true)}>
                    <Plus size={14} /> New Page
                  </PrimaryBtn>
                </div>
              }
            />

            {/* Plan limit warning */}
            {atLimit ? (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm text-amber-200 light:border-amber-200 light:bg-amber-50 light:text-amber-800">
                <AlertTriangle
                  size={16}
                  className="shrink-0 text-amber-400 light:text-amber-600"
                />
                <span>
                  Plan limit reached ({maxPages} pages). Archive existing pages
                  or upgrade your plan to add more.
                </span>
              </div>
            ) : null}

            {/* Content */}
            {listStatus === "loading" ? (
              <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
                <Loader2 className="animate-spin" size={16} />
                Loading pages…
              </div>
            ) : pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 bg-card py-20 text-center light:border-neutral-300">
                <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-white/40 light:bg-neutral-100 light:text-neutral-400">
                  <FileText size={24} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white light:text-neutral-950">
                    No landing pages yet
                  </p>
                  <p className="mt-1 text-sm text-white/40 light:text-neutral-400">
                    Create your first page to start capturing leads.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={atLimit}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong disabled:opacity-40"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus size={15} />
                  Create first page
                </button>
              </div>
            ) : (
              <Card>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["Page", "Type", "Status", "Views", "Purchases", "Revenue", "Actions"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPages.map((page) => {
                      const isArch = page.status === "Archived";
                      const detailUrl = `/app/${slug}/landing-pages/${page.publicId}`;
                      return (
                        <tr key={page.publicId}
                          onClick={() => navigate(detailUrl)}
                          className={`${isArch ? "opacity-50" : ""} cursor-pointer hover:bg-white/[0.02] transition-colors`}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td className="px-5 py-3.5">
                            <Link to={detailUrl} onClick={(e) => e.stopPropagation()} className="text-sm font-medium hover:text-blue-400 transition-colors text-left">{page.title}</Link>
                            <p className="text-[10px] text-muted-foreground font-mono">/{page.slug}</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">{page.type}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <StatusBadge status={page.status} />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm font-mono">{page.totalViews.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-sm font-mono">{page.purchaseCount}</td>
                          <td className="px-5 py-3.5 text-sm font-mono" style={{ color: "var(--color-chart-1)" }}>
                            {fmt(page.totalRevenueCents, creator.defaultCurrency)}
                          </td>
                          <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              {!isArch && (
                                <>
                                  <GhostBtn onClick={() => navigate(`/app/${slug}/landing-pages/${page.publicId}/edit`)} className="text-[11px] py-1 px-2"><Pencil size={11} /> Edit</GhostBtn>
                                  <button onClick={() => void archivePage(slug, page.publicId)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                    style={{ border: "1px solid rgba(255,255,255,0.08)" }} title="Archive">
                                    <Archive size={12} />
                                  </button>
                                </>
                              )}
                              {isArch && (
                                <button onClick={() => void restorePage(slug, page.publicId)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                                  <RotateCcw size={11} /> Restore
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}
      </div>

      {isCreateOpen && slug ? (
        <CreatePageModal
          slug={slug}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(page) => {
            navigate(`/app/${slug}/landing-pages/${page.publicId}`);
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      {children}
    </div>
  );
}

function GhostBtn({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      {children}
    </button>
  );
}

function fmt(cents: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function CreatePageModal({
  slug,
  onClose,
  onCreated,
}: {
  slug: string;
  onClose: () => void;
  onCreated: (page: LandingPage) => void;
}) {
  const createPage = useLandingPageStore((s) => s.createPage);
  const mutateStatus = useLandingPageStore((s) => s.mutateStatus);
  const mutateError = useLandingPageStore((s) => s.mutateError);
  const resetMutateFeedback = useLandingPageStore((s) => s.resetMutateFeedback);
  const isSubmitting = mutateStatus === "submitting";

  const products = useProductStore((s) => s.products);
  const productsStatus = useProductStore((s) => s.loadStatus);
  const loadProducts = useProductStore((s) => s.loadProducts);

  const [title, setTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [type, setType] = useState<LandingPageType>("LeadGen");
  const [productId, setProductId] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (productsStatus === "idle") void loadProducts(slug);
  }, [productsStatus, loadProducts, slug]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugEdited) setPageSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    const request: CreateLandingPageRequest = {
      title,
      slug: pageSlug,
      type,
      productId,
    };
    const page = await createPage(slug, request);
    if (page) {
      resetMutateFeedback();
      onCreated(page);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:px-5">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-white light:text-neutral-950">
            New landing page
          </h2>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white light:text-neutral-400 light:hover:bg-neutral-100 light:hover:text-neutral-700"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6">
          <div className="grid gap-5">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-white/80 light:text-neutral-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Free Email Course"
                className="w-full rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:text-neutral-950 light:placeholder-neutral-400 light:focus:border-neutral-400 light:focus:ring-neutral-100"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-white/80 light:text-neutral-700">
                URL slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={pageSlug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setPageSlug(e.target.value);
                }}
                placeholder="free-email-course"
                className="w-full rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:text-neutral-950 light:placeholder-neutral-400 light:focus:border-neutral-400 light:focus:ring-neutral-100"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-white/80 light:text-neutral-700">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LandingPageType)}
                className="w-full rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:text-neutral-950 light:focus:border-neutral-400 light:focus:ring-neutral-100"
              >
                <option value="LeadGen">
                  Lead Gen — collect email addresses
                </option>
                <option value="Sales">Sales — sell a product or service</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-white/80 light:text-neutral-700">
                Product <span className="text-red-500">*</span>
              </label>
              {productsStatus === "loading" ? (
                <div className="flex h-[42px] items-center gap-2 px-1 text-sm text-white/40 light:text-neutral-400">
                  <Loader2 className="animate-spin" size={14} />
                  Loading products…
                </div>
              ) : products.length === 0 ? (
                <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200 light:bg-amber-50 light:text-amber-800">
                  You don't have any products yet. Create a product first.
                </p>
              ) : (
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:text-neutral-950 light:focus:border-neutral-400 light:focus:ring-neutral-100"
                >
                  <option value="" disabled>
                    Select a product…
                  </option>
                  {products.map((p) => (
                    <option key={p.publicId} value={p.publicId}>
                      {p.name} —{" "}
                      {(p.priceCents / 100).toLocaleString(undefined, {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-white/40 light:text-neutral-400">
                The product cannot be changed after the page is created.
              </p>
            </div>

            {mutateError ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 light:bg-red-50 light:text-red-600">
                {mutateError}
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-white/70 transition hover:bg-secondary light:text-neutral-700"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title || !pageSlug || !productId}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong disabled:opacity-40"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={15} />
              ) : null}
              Create page
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<LandingPageStatus, { bg: string; color: string }> = {
  Published: {
    bg: "color-mix(in srgb, var(--color-chart-1) 12%, transparent)",
    color: "var(--color-chart-1)",
  },
  Draft: {
    bg: "color-mix(in srgb, var(--color-muted-foreground) 12%, transparent)",
    color: "var(--color-muted-foreground)",
  },
  Archived: {
    bg: "color-mix(in srgb, var(--color-muted-foreground) 12%, transparent)",
    color: "var(--color-muted-foreground)",
  },
};

function StatusBadge({ status }: { status: LandingPageStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-mono"
      style={{
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)`,
      }}
    >
      {status}
    </span>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1
          className="font-bold leading-none"
          style={{
            fontFamily: "Barlow Condensed, sans-serif",
            fontSize: "2rem",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
function PrimaryBtn({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-85 ${className}`}
      style={{ backgroundColor: "var(--color-chart-1)" }}
    >
      {children}
    </button>
  );
}
