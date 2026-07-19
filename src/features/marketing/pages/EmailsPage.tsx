import { AlertTriangle, Loader2, Mail, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { useProductStore } from '../../products/model/product-store'
import { CampaignFormModal } from '../components/CampaignFormModal'
import { useCampaignStore } from '../model/campaign-store'
import type { CampaignListItem, CampaignStatus } from '../model/types'

export function EmailsPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const normalizedSlug = slug ?? ''

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creator = currentCreator?.slug === normalizedSlug ? currentCreator : null

  const creatorSettings = useCreatorStore((s) => s.creatorSettings)
  const loadCreatorSettings = useCreatorStore((s) => s.loadCreatorSettings)

  const pages = useLandingPageStore((s) => s.pages)
  const loadPages = useLandingPageStore((s) => s.loadPages)
  const products = useProductStore((s) => s.products)
  const loadProducts = useProductStore((s) => s.loadProducts)

  const campaigns = useCampaignStore((s) => s.campaigns)
  const campaignsStatus = useCampaignStore((s) => s.campaignsStatus)
  const loadCampaigns = useCampaignStore((s) => s.loadCampaigns)
  const deleteCampaignForSlug = useCampaignStore((s) => s.deleteCampaignForSlug)
  const deleteCampaignStatus = useCampaignStore((s) => s.deleteCampaignStatus)
  const resetDeleteCampaignFeedback = useCampaignStore((s) => s.resetDeleteCampaignFeedback)
  const clearCurrentCampaign = useCampaignStore((s) => s.clearCurrentCampaign)

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<CampaignListItem | null>(null)

  const editingCampaignDetail = useCampaignStore((s) => s.currentCampaign)
  const loadCampaign = useCampaignStore((s) => s.loadCampaign)

  const isLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (!normalizedSlug) return
    void loadCreatorSettings(normalizedSlug)
    void loadPages(normalizedSlug)
    void loadProducts(normalizedSlug)
    void loadCampaigns(normalizedSlug)
    const refetchOnFocus = () => void loadCampaigns(normalizedSlug)
    window.addEventListener('focus', refetchOnFocus)
    return () => window.removeEventListener('focus', refetchOnFocus)
  }, [normalizedSlug, loadCreatorSettings, loadPages, loadProducts, loadCampaigns])

  const openCreate = () => {
    clearCurrentCampaign()
    setEditingCampaignId(null)
    setIsEditorOpen(true)
  }

  const openEdit = (campaignPublicId: string) => {
    void loadCampaign(normalizedSlug, campaignPublicId)
    setEditingCampaignId(campaignPublicId)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setIsEditorOpen(false)
    setEditingCampaignId(null)
    clearCurrentCampaign()
  }

  const targetName = useMemo(() => {
    const lpByPublicId = new Map(pages.map((p) => [p.publicId, p.title]))
    const productByPublicId = new Map(products.map((p) => [p.publicId, p.name]))
    return (campaign: CampaignListItem) =>
      campaign.audienceType === 'LandingPage'
        ? lpByPublicId.get(campaign.targetPublicId) ?? '—'
        : productByPublicId.get(campaign.targetPublicId) ?? '—'
  }, [pages, products])

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="emails">
      <div className="px-8 py-8">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading workspace…
          </div>
        ) : !creator ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
            <p className="font-semibold text-white light:text-neutral-950">Workspace not found</p>
            <button
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-600 light:hover:bg-neutral-50"
              type="button"
              onClick={() => navigate('/')}
            >
              Go home
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white light:text-neutral-950">Emails</h1>
                <p className="mt-1 text-sm text-white/40 light:text-neutral-400">
                  Send campaign emails to your captured contacts.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong"
                onClick={openCreate}
              >
                <Plus size={15} />
                New campaign
              </button>
            </div>

            {campaignsStatus === 'loading' ? (
              <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
                <Loader2 className="animate-spin" size={16} />
                Loading campaigns…
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-20 text-center light:border-neutral-300 light:bg-white">
                <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-white/40 light:bg-neutral-100 light:text-neutral-400">
                  <Mail size={24} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white light:text-neutral-950">No campaigns yet</p>
                  <p className="mt-1 text-sm text-white/40 light:text-neutral-400">
                    Send an update to the people who signed up on your landing pages.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong"
                  onClick={openCreate}
                >
                  <Plus size={15} />
                  New campaign
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
                <div className="grid grid-cols-[1fr_160px_100px_110px_160px_100px] items-center border-b border-white/10 px-5 py-3 light:border-neutral-100">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Subject</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Audience</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Status</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Progress</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Date</p>
                  <span />
                </div>
                <ul className="divide-y divide-white/10 light:divide-neutral-100">
                  {campaigns.map((campaign) => (
                    <li key={campaign.publicId} className="group">
                      <div className="grid grid-cols-[1fr_160px_100px_110px_160px_100px] items-center px-5 py-4">
                        <p className="truncate text-sm font-semibold text-white light:text-neutral-950">{campaign.subject}</p>
                        <p className="truncate text-xs font-medium text-white/60 light:text-neutral-600">{targetName(campaign)}</p>
                        <StatusBadge status={campaign.status} />
                        <ProgressCell campaign={campaign} />
                        <p className="text-xs text-white/50 light:text-neutral-500">
                          {new Date(campaign.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            title={campaign.status === 'Draft' ? 'Edit' : 'View'}
                            className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-600 light:hover:bg-neutral-100"
                            onClick={() => openEdit(campaign.publicId)}
                          >
                            <Pencil size={12} />
                          </button>
                          {campaign.status === 'Draft' ? (
                            <button
                              type="button"
                              title="Delete"
                              className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 light:border-neutral-200 light:bg-white light:text-neutral-500 light:hover:border-red-200 light:hover:bg-red-50 light:hover:text-red-600"
                              onClick={() => setDeletingCampaign(campaign)}
                            >
                              <Trash2 size={12} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditorOpen && slug ? (
        <CampaignFormModal
          slug={slug}
          campaign={editingCampaignId ? editingCampaignDetail ?? undefined : undefined}
          landingPages={pages}
          products={products}
          creatorSettings={creatorSettings}
          onClose={closeEditor}
        />
      ) : null}

      {deletingCampaign ? (
        <DeleteCampaignDialog
          slug={slug}
          campaign={deletingCampaign}
          status={deleteCampaignStatus}
          onDelete={deleteCampaignForSlug}
          onResetFeedback={resetDeleteCampaignFeedback}
          onClose={() => setDeletingCampaign(null)}
        />
      ) : null}
    </AppShell>
  )
}

function ProgressCell({ campaign }: { campaign: CampaignListItem }) {
  if (campaign.status === 'Draft') {
    return <p className="text-xs text-white/30 light:text-neutral-400">—</p>
  }
  return (
    <p className="font-data text-xs font-medium tabular-nums text-white/70 light:text-neutral-600">
      Sent {campaign.sentCount}/{campaign.recipientCount}
      {campaign.failedCount > 0 ? (
        <span className="ml-1 text-red-400 light:text-red-600">· {campaign.failedCount} failed</span>
      ) : null}
    </p>
  )
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  if (status === 'Queued')
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 light:bg-emerald-50 light:text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Queued
      </span>
    )
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/50 light:bg-neutral-100 light:text-neutral-500">
      <span className="size-1.5 rounded-full bg-white/40 light:bg-neutral-400" />
      Draft
    </span>
  )
}

function DeleteCampaignDialog({
  slug,
  campaign,
  status,
  onDelete,
  onResetFeedback,
  onClose,
}: {
  slug: string
  campaign: CampaignListItem
  status: 'idle' | 'submitting' | 'success' | 'error'
  onDelete: (slug: string, campaignPublicId: string) => Promise<boolean>
  onResetFeedback: () => void
  onClose: () => void
}) {
  const isSubmitting = status === 'submitting'

  const handleConfirm = async () => {
    const ok = await onDelete(slug, campaign.publicId)
    if (ok) { onResetFeedback(); onClose() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl light:border-neutral-200 light:bg-white">
        <div className="grid size-11 place-items-center rounded-xl bg-amber-500/15 light:bg-amber-50">
          <AlertTriangle className="text-amber-400 light:text-amber-600" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white light:text-neutral-950">Delete this draft?</h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-500">
          <span className="font-medium text-white/80 light:text-neutral-800">{campaign.subject}</span> will be permanently deleted.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-700 light:hover:bg-neutral-50" disabled={isSubmitting} onClick={onClose}>Cancel</button>
          <button type="button" disabled={isSubmitting} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-40" onClick={() => void handleConfirm()}>
            {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
