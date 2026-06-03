import { AlertTriangle, FileText, Loader2, Plus, Globe, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../model/landing-page-store'
import type { CreateLandingPageRequest, LandingPage, LandingPageStatus, LandingPageType } from '../model/types'

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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-2">
            <button type="button" className="grid size-7 place-items-center rounded-lg bg-neutral-950 text-white" onClick={() => navigate(`/app/${slug ?? ''}`)}>
              <span className="text-xs font-bold">CP</span>
            </button>
            <span className="text-sm text-neutral-300">/</span>
            <button type="button" className="text-sm font-medium text-neutral-500 hover:text-neutral-950 transition" onClick={() => navigate(`/app/${slug ?? ''}`)}>
              {slug}
            </button>
            <span className="text-sm text-neutral-300">/</span>
            <span className="text-sm font-medium text-neutral-950">Landing pages</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10 lg:px-8">
        {isLoading ? (
          <div className="flex h-32 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 text-sm text-neutral-400 shadow-sm">
            <Loader2 className="animate-spin" size={17} />
            Loading workspace
          </div>
        ) : !creator ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="font-semibold">Workspace not found</p>
            <button className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50" type="button" onClick={() => navigate('/')}>Go home</button>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-neutral-950">Landing pages</h1>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {maxPages !== null && maxPages >= 0 ? `${pages.length} / ${maxPages} used` : `${pages.length} page${pages.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                type="button"
                disabled={atLimit}
                title={atLimit ? `Plan limit reached (${maxPages ?? 0})` : undefined}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={16} />
                New page
              </button>
            </div>

            {atLimit ? (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0" />
                Plan limit reached. Archive existing pages or upgrade your plan.
              </div>
            ) : null}

            {listStatus === 'loading' ? (
              <div className="flex h-24 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 text-sm text-neutral-400 shadow-sm">
                <Loader2 className="animate-spin" size={16} />
                Loading pages…
              </div>
            ) : pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center shadow-sm">
                <FileText size={32} className="text-neutral-300" />
                <p className="text-sm font-medium text-neutral-500">No landing pages yet</p>
                <button type="button" disabled={atLimit} className="inline-flex h-9 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40" onClick={() => setIsCreateOpen(true)}>
                  <Plus size={15} />
                  Create your first page
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {pages.map((page) => (
                  <PageCard key={page.publicId} page={page} onClick={() => navigate(`/app/${slug ?? ''}/landing-pages/${page.publicId}`)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {isCreateOpen && slug ? (
        <CreatePageModal slug={slug} onClose={() => setIsCreateOpen(false)} onCreated={(page) => { navigate(`/app/${slug}/landing-pages/${page.publicId}`) }} />
      ) : null}
    </div>
  )
}

function PageCard({ page, onClick }: { page: LandingPage; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm text-left transition hover:border-neutral-300 hover:shadow-md">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-neutral-950">{page.title}</p>
          <StatusBadge status={page.status} />
        </div>
        <p className="mt-0.5 truncate text-xs text-neutral-400">/{page.slug} · {page.type}</p>
      </div>
      {page.customDomain ? (
        <div className="flex items-center gap-1 text-xs text-neutral-400">
          <Globe size={13} />
          {page.customDomain}
        </div>
      ) : null}
    </button>
  )
}

function CreatePageModal({ slug, onClose, onCreated }: { slug: string; onClose: () => void; onCreated: (page: LandingPage) => void }) {
  const createPage = useLandingPageStore((s) => s.createPage)
  const mutateStatus = useLandingPageStore((s) => s.mutateStatus)
  const mutateError = useLandingPageStore((s) => s.mutateError)
  const resetMutateFeedback = useLandingPageStore((s) => s.resetMutateFeedback)
  const isSubmitting = mutateStatus === 'submitting'

  const [title, setTitle] = useState('')
  const [pageSlug, setPageSlug] = useState('')
  const [type, setType] = useState<LandingPageType>('LeadGen')

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!pageSlug || pageSlug === slugify(title)) {
      setPageSlug(slugify(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const request: CreateLandingPageRequest = { title, slug: pageSlug, type }
    const page = await createPage(slug, request)
    if (page) { resetMutateFeedback(); onCreated(page) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-950">New landing page</h2>
          <button type="button" className="grid size-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="p-6">
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">Title <span className="text-red-500">*</span></label>
              <input type="text" required maxLength={100} value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. My awesome course" className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">URL slug <span className="text-red-500">*</span></label>
              <input type="text" required maxLength={100} value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} placeholder="my-awesome-course" className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 placeholder-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as LandingPageType)} className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100">
                <option value="LeadGen">Lead Gen — collect emails</option>
                <option value="Sales">Sales — sell a product</option>
              </select>
            </div>
            {mutateError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{mutateError}</p> : null}
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50" disabled={isSubmitting} onClick={onClose}>Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40">
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
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" />Published</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500"><span className="size-1.5 rounded-full bg-neutral-400" />Draft</span>
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
