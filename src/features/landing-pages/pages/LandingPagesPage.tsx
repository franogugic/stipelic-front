import {
  AlertTriangle,
  Eye,
  FileText,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../model/landing-page-store'
import type {
  CreateLandingPageRequest,
  LandingPage,
  LandingPageAnalytics,
  LandingPageStatus,
  LandingPageType,
} from '../model/types'

export function LandingPagesPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)

  const pages = useLandingPageStore((s) => s.pages)
  const listStatus = useLandingPageStore((s) => s.listStatus)
  const loadPages = useLandingPageStore((s) => s.loadPages)
  const analytics = useLandingPageStore((s) => s.analytics)
  const loadAnalytics = useLandingPageStore((s) => s.loadAnalytics)

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const isLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const currentPlan = creatorPlans.find((p) => p.code === creator?.planCode)
  const maxPages = currentPlan?.limits['max_landing_pages'] ?? null
  const atLimit = maxPages !== null && maxPages >= 0 && pages.length >= maxPages

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  useEffect(() => {
    if (slug && listStatus === 'idle') void loadPages(slug)
  }, [slug, listStatus, loadPages])

  useEffect(() => {
    if (!slug || listStatus !== 'success') return
    pages
      .filter((p) => p.status === 'Published')
      .forEach((p) => {
        if (!analytics[p.publicId]) void loadAnalytics(slug, p.publicId)
      })
  }, [slug, listStatus, pages, analytics, loadAnalytics])

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="landing-pages">
      <div className="px-8 py-8">

        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading workspace…
          </div>
        ) : !creator ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="font-semibold text-neutral-950">Workspace not found</p>
            <button
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
              type="button"
              onClick={() => navigate('/')}
            >
              Go home
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
                  Landing pages
                </h1>
                <p className="mt-1 text-sm text-neutral-400">
                  {maxPages !== null && maxPages >= 0
                    ? `${pages.length} of ${maxPages} used`
                    : `${pages.length} page${pages.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                type="button"
                disabled={atLimit}
                title={atLimit ? `Plan limit reached (${maxPages ?? 0})` : undefined}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={15} />
                New page
              </button>
            </div>

            {/* Plan limit warning */}
            {atLimit ? (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                <span>
                  Plan limit reached ({maxPages} pages). Archive existing pages or upgrade your
                  plan to add more.
                </span>
              </div>
            ) : null}

            {/* Content */}
            {listStatus === 'loading' ? (
              <div className="flex h-32 items-center justify-center gap-3 text-sm text-neutral-400">
                <Loader2 className="animate-spin" size={16} />
                Loading pages…
              </div>
            ) : pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
                  <FileText size={24} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-950">No landing pages yet</p>
                  <p className="mt-1 text-sm text-neutral-400">
                    Create your first page to start capturing leads.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={atLimit}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus size={15} />
                  Create first page
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_120px_120px_160px_40px] items-center border-b border-neutral-100 px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Page</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Type</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Status</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Views</p>
                  <span />
                </div>

                <ul className="divide-y divide-neutral-100">
                  {pages.map((page) => (
                    <PageRow
                      key={page.publicId}
                      page={page}
                      slug={slug}
                      pageAnalytics={analytics[page.publicId] ?? null}
                      onAnalyticsClick={() =>
                        navigate(`/app/${slug}/landing-pages/${page.publicId}`)
                      }
                      onEditClick={() =>
                        navigate(`/app/${slug}/landing-pages/${page.publicId}/edit`)
                      }
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {isCreateOpen && slug ? (
        <CreatePageModal
          slug={slug}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(page) => {
            navigate(`/app/${slug}/landing-pages/${page.publicId}`)
          }}
        />
      ) : null}
    </AppShell>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function PageRow({
  page,
  slug,
  pageAnalytics,
  onAnalyticsClick,
  onEditClick,
}: {
  page: LandingPage
  slug: string
  pageAnalytics: LandingPageAnalytics | null
  onAnalyticsClick: () => void
  onEditClick: () => void
}) {
  const publicUrl = `/p/${slug}/${page.slug}`

  return (
    <li>
      <div className="grid w-full grid-cols-[1fr_120px_120px_160px_80px] items-center px-5 py-4">
        <button
          type="button"
          onClick={onAnalyticsClick}
          className="flex items-center gap-3 min-w-0 text-left"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
            <FileText size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-950">{page.title}</p>
            <p className="mt-0.5 truncate text-xs text-neutral-400">/{page.slug}</p>
          </div>
        </button>
        <p className="text-xs font-medium text-neutral-600">{page.type}</p>
        <StatusBadge status={page.status} />
        <div className="flex items-center gap-3">
          {page.status === 'Published' && pageAnalytics !== null ? (
            <>
              <span className="flex items-center gap-1 text-xs text-neutral-500" title="Total views">
                <Eye size={12} className="text-neutral-400" />
                {pageAnalytics.allTime.totalViews.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-xs text-neutral-500" title="Unique visitors">
                <Users size={12} className="text-neutral-400" />
                {pageAnalytics.allTime.uniqueVisitors.toLocaleString()}
              </span>
            </>
          ) : page.status === 'Published' ? (
            <span className="text-xs text-neutral-300">—</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Edit page"
            onClick={(e) => { e.stopPropagation(); onEditClick() }}
            className="grid size-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <Pencil size={14} />
          </button>
          {page.status === 'Published' ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open public page"
              onClick={(e) => e.stopPropagation()}
              className="grid size-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              <Globe size={14} />
            </a>
          ) : (
            <span className="size-8" />
          )}
        </div>
      </div>
    </li>
  )
}

function CreatePageModal({
  slug,
  onClose,
  onCreated,
}: {
  slug: string
  onClose: () => void
  onCreated: (page: LandingPage) => void
}) {
  const createPage = useLandingPageStore((s) => s.createPage)
  const mutateStatus = useLandingPageStore((s) => s.mutateStatus)
  const mutateError = useLandingPageStore((s) => s.mutateError)
  const resetMutateFeedback = useLandingPageStore((s) => s.resetMutateFeedback)
  const isSubmitting = mutateStatus === 'submitting'

  const [title, setTitle] = useState('')
  const [pageSlug, setPageSlug] = useState('')
  const [type, setType] = useState<LandingPageType>('LeadGen')
  const [slugEdited, setSlugEdited] = useState(false)

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugEdited) setPageSlug(slugify(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const request: CreateLandingPageRequest = { title, slug: pageSlug, type }
    const page = await createPage(slug, request)
    if (page) {
      resetMutateFeedback()
      onCreated(page)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:px-5">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:rounded-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-950">New landing page</h2>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6">
          <div className="grid gap-5">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Free Email Course"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-neutral-700">
                URL slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={pageSlug}
                onChange={(e) => {
                  setSlugEdited(true)
                  setPageSlug(e.target.value)
                }}
                placeholder="free-email-course"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-neutral-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LandingPageType)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              >
                <option value="LeadGen">Lead Gen — collect email addresses</option>
                <option value="Sales">Sales — sell a product or service</option>
              </select>
            </div>

            {mutateError ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{mutateError}</p>
            ) : null}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title || !pageSlug}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : null}
              Create page
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: LandingPageStatus }) {
  if (status === 'Published')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Published
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500">
      <span className="size-1.5 rounded-full bg-neutral-400" />
      Draft
    </span>
  )
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
