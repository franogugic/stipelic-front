import { Archive, PanelsTopLeft, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { number } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCards,
  Switch,
  useToast,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { CreateLandingPageModal } from '../components/CreateLandingPageModal'
import { LandingPageTile } from '../components/LandingPageTile'
import { useLandingPageStore } from '../model/landing-page-store'
import type { LandingPage } from '../model/types'

type PageAction = 'publish' | 'unpublish' | 'archive' | 'restore'

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
  const includeArchived = useLandingPageStore((s) => s.includeArchived)
  const loadPages = useLandingPageStore((s) => s.loadPages)
  const setIncludeArchived = useLandingPageStore((s) => s.setIncludeArchived)
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
    if (slug) void loadPages(slug, useLandingPageStore.getState().includeArchived)
  }, [slug, loadPages])

  const plan = creatorPlans.find((candidate) => candidate.code === creator?.planCode)
  const maxPages = plan?.limits['max_landing_pages']
  const activePageCount = pages.filter((page) => page.status !== 'Archived').length
  // With "Show archived", archived pages come after the live ones (stable, so the API's order is kept within each).
  const sortedPages = [...pages].sort((a, b) => Number(a.status === 'Archived') - Number(b.status === 'Archived'))
  const atLimit = maxPages !== undefined && maxPages >= 0 && activePageCount >= maxPages
  const limitReason =
    atLimit && creator
      ? maxPages === 1
        ? `You’ve used your 1 landing page on the ${creator.planName} plan.`
        : `You’ve used all ${number(maxPages)} landing pages on the ${creator.planName} plan.`
      : undefined

  const openCreate = () => {
    setCreateKey((key) => key + 1)
    setCreateOpen(true)
  }

  const runAction = async (page: LandingPage, action: PageAction) => {
    const run = { publish: publishPage, unpublish: unpublishPage, archive: archivePage, restore: restorePage }[action]
    setBusyPageId(page.publicId)
    const ok = await run(slug, page.publicId)
    const error = useLandingPageStore.getState().mutateError
    resetMutateFeedback()
    setBusyPageId(null)
    if (ok) toast({ tone: 'success', title: SUCCESS_TITLES[action] })
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
    <Button variant="primary" icon={Plus} disabledReason={limitReason} onClick={openCreate}>
      New landing page
    </Button>
  )

  const content = () => {
    if (listStatus === 'error') return <ErrorState onRetry={() => void loadPages(slug, includeArchived)} />
    if (listStatus !== 'success') return <SkeletonCards count={3} />
    if (pages.length === 0) {
      return (
        <EmptyState
          icon={PanelsTopLeft}
          title="No landing pages yet"
          text="Create your first page to sell a product or collect emails."
          action={limitReason ? undefined : { label: 'New landing page', icon: Plus, variant: 'primary', onClick: openCreate }}
        />
      )
    }
    return (
      <div className="tiles reveal">
        {sortedPages.map((page) => (
          <LandingPageTile
            key={page.publicId}
            page={page}
            creatorSlug={slug}
            currency={creator?.defaultCurrency ?? 'EUR'}
            busy={busyPageId === page.publicId}
            onTogglePublish={() => void runAction(page, page.status === 'Published' ? 'unpublish' : 'publish')}
            onArchive={() => setArchiveTarget(page)}
            onRestore={() => void runAction(page, 'restore')}
            onCopyLink={() => void copyLink(page)}
          />
        ))}
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
            actions={
              <>
                <Switch
                  label="Show archived"
                  checked={includeArchived}
                  onChange={(event) => setIncludeArchived(slug, event.target.checked)}
                />
                {newPageButton}
              </>
            }
          />
          {content()}

          {createKey > 0 && (
            <CreateLandingPageModal
              key={createKey}
              open={createOpen}
              creatorSlug={slug}
              currency={creator.defaultCurrency}
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
