import { Archive, PanelsTopLeft, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { number } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  SkeletonCards,
  useToast,
} from '../../../shared/ui/ledger'
import type { FilterView } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { CreateLandingPageModal } from '../components/CreateLandingPageModal'
import { LandingPageTile } from '../components/LandingPageTile'
import { PagesTable } from '../components/PagesTable'
import { useLandingPageStore } from '../model/landing-page-store'
import type { LandingPage } from '../model/types'

type PageAction = 'publish' | 'unpublish' | 'archive' | 'restore'

const PAGE_TYPES: Array<[string, string]> = [
  ['all', 'All'],
  ['sales', 'Sales'],
  ['lead', 'Lead capture'],
]

const VIEW_KEY = 'landing-pages-view'

/** The remembered grid/list choice; the URL wins when it has one. Storage can be unavailable. */
function storedView(): FilterView | null {
  try {
    const value = window.localStorage.getItem(VIEW_KEY)
    return value === 'list' || value === 'grid' ? value : null
  } catch {
    return null
  }
}

const SUCCESS_TITLES: Record<PageAction, string> = {
  publish: 'Page published',
  unpublish: 'Page unpublished',
  archive: 'Page archived',
  restore: 'Page restored',
}

export function LandingPagesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { slug = '' } = useParams<{ slug: string }>()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)

  const pages = useLandingPageStore((s) => s.pages)
  const listStatus = useLandingPageStore((s) => s.listStatus)
  const loadPages = useLandingPageStore((s) => s.loadPages)
  const publishPage = useLandingPageStore((s) => s.publishPage)
  const unpublishPage = useLandingPageStore((s) => s.unpublishPage)
  const archivePage = useLandingPageStore((s) => s.archivePage)
  const restorePage = useLandingPageStore((s) => s.restorePage)
  const resetMutateFeedback = useLandingPageStore((s) => s.resetMutateFeedback)

  const [busyPageId, setBusyPageId] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<LandingPage | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  // A new key per opening, so the create form always starts empty.
  const [createKey, setCreateKey] = useState(0)
  const [createProductId, setCreateProductId] = useState<string | undefined>(undefined)
  const [searchParams, setSearchParams] = useSearchParams()
  // `?create=1&product=<id>` (from a product card) opens the create form once, with that product chosen.
  const [handledCreateLink, setHandledCreateLink] = useState(false)

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  // Fresh numbers on every visit (and for another workspace's address).
  useEffect(() => {
    if (slug) void loadPages(slug, true)
  }, [slug, loadPages])

  // Type, archived and view live in the URL (so a filtered list can be linked to); the search box filters in place.
  const typeParam = searchParams.get('type')
  const type = PAGE_TYPES.some(([key]) => key === typeParam) ? (typeParam as string) : 'all'
  const showArchived = searchParams.get('archived') === '1'
  const viewParam = searchParams.get('view')
  const view: FilterView = viewParam === 'list' || viewParam === 'grid' ? viewParam : (storedView() ?? 'grid')
  const [query, setQuery] = useState('')

  const updateParams = (changes: Record<string, string | null>) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )

  const chooseView = (next: FilterView) => {
    try {
      window.localStorage.setItem(VIEW_KEY, next)
    } catch {
      // The choice still lives in the URL.
    }
    updateParams({ view: next === 'grid' ? null : next })
  }

  const plan = creatorPlans.find((candidate) => candidate.code === creator?.planCode)
  const maxPages = plan?.limits['max_landing_pages']
  const activePageCount = pages.filter((page) => page.status !== 'Archived').length
  // Archived pages are always loaded, so "Show archived" and the counts are client-side. They come after the live
  // ones (stable, so the API's order is kept within each).
  const inScope = pages
    .filter((page) => showArchived || page.status !== 'Archived')
    .sort((a, b) => Number(a.status === 'Archived') - Number(b.status === 'Archived'))
  const typeKey = (page: LandingPage) => (page.type === 'Sales' ? 'sales' : 'lead')
  const countOf = (key: string) => inScope.filter((page) => key === 'all' || typeKey(page) === key).length
  const byType = inScope.filter((page) => type === 'all' || typeKey(page) === type)
  const needle = query.trim().toLowerCase()
  const visiblePages = needle ? byType.filter((page) => page.title.toLowerCase().includes(needle)) : byType
  const atLimit = maxPages !== undefined && maxPages >= 0 && activePageCount >= maxPages
  const limitReason =
    atLimit && creator
      ? maxPages === 1
        ? `You’ve used your 1 landing page on the ${creator.planName} plan.`
        : `You’ve used all ${number(maxPages)} landing pages on the ${creator.planName} plan.`
      : undefined

  const openCreate = (productId?: string) => {
    setCreateProductId(productId)
    setCreateKey((key) => key + 1)
    setCreateOpen(true)
  }

  if (!handledCreateLink && creator && searchParams.get('create') === '1') {
    setHandledCreateLink(true)
    openCreate(searchParams.get('product') ?? undefined)
  }

  // The link has done its job; a reload or a share of the address must not reopen the form.
  useEffect(() => {
    if (searchParams.get('create') !== null || searchParams.get('product') !== null) {
      if (handledCreateLink) {
        setSearchParams(
          (current) => {
            const next = new URLSearchParams(current)
            next.delete('create')
            next.delete('product')
            return next
          },
          { replace: true },
        )
      }
    }
  }, [handledCreateLink, searchParams, setSearchParams])

  const runAction = async (page: LandingPage, action: PageAction) => {
    const run = { publish: publishPage, unpublish: unpublishPage, archive: archivePage, restore: restorePage }[action]
    setBusyPageId(page.publicId)
    const ok = await run(slug, page.publicId)
    const error = useLandingPageStore.getState().mutateError
    resetMutateFeedback()
    setBusyPageId(null)
    if (ok) {
      toast({
        tone: 'success',
        title: SUCCESS_TITLES[action],
        message: action === 'restore' ? `${page.title} is back as a draft.` : undefined,
      })
    }
    else toast({ tone: 'danger', title: error ?? 'Something went wrong. Please try again.' })
  }

  const copyLink = async (page: LandingPage) => {
    const url = `${window.location.origin}/p/${slug}/${page.slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ tone: 'success', title: 'Link copied' })
    } catch {
      toast({ tone: 'danger', title: 'Couldn’t copy the link', message: url })
    }
  }

  const newPageButton = (
    <Button variant="primary" icon={Plus} disabledReason={limitReason} onClick={() => openCreate()}>
      New landing page
    </Button>
  )

  const content = () => {
    if (listStatus === 'error') return <ErrorState onRetry={() => void loadPages(slug, true)} />
    if (listStatus !== 'success') return <SkeletonCards count={3} />
    if (pages.length === 0) {
      return (
        <EmptyState
          icon={PanelsTopLeft}
          title="No landing pages yet"
          text="Create your first page to sell a product or collect emails."
          action={limitReason ? undefined : { label: 'New landing page', icon: Plus, variant: 'primary', onClick: () => openCreate() }}
        />
      )
    }
    const pageActions = {
      onTogglePublish: (page: LandingPage) => void runAction(page, page.status === 'Published' ? 'unpublish' : 'publish'),
      onArchive: (page: LandingPage) => setArchiveTarget(page),
      onRestore: (page: LandingPage) => void runAction(page, 'restore'),
      onCopyLink: (page: LandingPage) => void copyLink(page),
    }
    const currency = creator?.defaultCurrency ?? 'EUR'
    return (
      <div className="stack stack--lg reveal">
        <FilterBar
          noun="pages"
          types={PAGE_TYPES}
          type={type}
          count={countOf}
          onType={(key) => updateParams({ type: key === 'all' ? null : key })}
          query={query}
          onQuery={setQuery}
          showArchived={showArchived}
          onShowArchived={(value) => updateParams({ archived: value ? '1' : null })}
          view={view}
          onView={chooseView}
        />
        {visiblePages.length > 0 &&
          (view === 'list' ? (
            <PagesTable
              pages={visiblePages}
              creatorSlug={slug}
              currency={currency}
              busyPageId={busyPageId}
              {...pageActions}
            />
          ) : (
            <div className="tiles">
              {visiblePages.map((page) => (
                <LandingPageTile
                  key={page.publicId}
                  page={page}
                  creatorSlug={slug}
                  currency={currency}
                  busy={busyPageId === page.publicId}
                  onTogglePublish={() => pageActions.onTogglePublish(page)}
                  onArchive={() => pageActions.onArchive(page)}
                  onRestore={() => pageActions.onRestore(page)}
                  onCopyLink={() => pageActions.onCopyLink(page)}
                />
              ))}
            </div>
          ))}
        {visiblePages.length === 0 && (
          <p className="filter-results text-sm text-muted">
            {byType.length > 0 ? 'No pages match your search.' : 'No pages of this type yet.'}
          </p>
        )}
      </div>
    )
  }

  return (
    <AppShell slug={slug} activeSection="landing-pages">
      {creatorLoading ? (
        <SkeletonCards count={3} />
      ) : !creator ? (
        <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
      ) : (
        <>
          <PageHeader
            title={
              <>
                Landing <em>pages</em>
              </>
            }
            subtitle="Pages that sell your products and collect emails."
            actions={newPageButton}
          />
          {content()}

          {createKey > 0 && (
            <CreateLandingPageModal
              key={createKey}
              open={createOpen}
              creatorSlug={slug}
              currency={creator.defaultCurrency}
              initialProductId={createProductId}
              onClose={() => setCreateOpen(false)}
              onCreated={(page) => navigate(`/app/${slug}/landing-pages/${page.publicId}`)}
            />
          )}

          <ConfirmDialog
            open={archiveTarget !== null}
            title={`Archive “${archiveTarget?.title ?? ''}”?`}
            text="Visitors will no longer be able to open it. You can restore it from “Show archived” at any time."
            confirmLabel="Archive page"
            tone="danger"
            icon={Archive}
            onCancel={() => setArchiveTarget(null)}
            onConfirm={() => {
              const target = archiveTarget
              setArchiveTarget(null)
              if (target) void runAction(target, 'archive')
            }}
          />
        </>
      )}
    </AppShell>
  )
}
