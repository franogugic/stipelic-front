import { AlertTriangle, Archive, FileText, History, Loader2, Mail, Pencil, Plus, RotateCcw, Send, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { CHART_COLORS } from '../../../shared/ui/chart-colors'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { getHomeSummary } from '../../orders/api/orders-api'
import type { HomeSummary } from '../../orders/model/types'
import { useProductStore } from '../../products/model/product-store'
import { SendWizardModal } from '../components/SendWizardModal'
import { TemplateEditorModal } from '../components/TemplateEditorModal'
import { useCampaignStore } from '../model/campaign-store'
import { useTemplateStore } from '../model/template-store'
import type { CampaignListItem, EmailTemplate } from '../model/types'

type EmailsTab = 'send' | 'templates' | 'history'

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

  const templates = useTemplateStore((s) => s.templates)
  const templatesStatus = useTemplateStore((s) => s.templatesStatus)
  const loadTemplates = useTemplateStore((s) => s.loadTemplates)

  const campaigns = useCampaignStore((s) => s.campaigns)
  const campaignsStatus = useCampaignStore((s) => s.campaignsStatus)
  const loadCampaigns = useCampaignStore((s) => s.loadCampaigns)

  const [tab, setTab] = useState<EmailsTab>('send')
  const [homeSummary, setHomeSummary] = useState<HomeSummary | null>(null)

  const isLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (!normalizedSlug) return
    void getHomeSummary(normalizedSlug).then(setHomeSummary).catch(() => {})
  }, [normalizedSlug])

  useEffect(() => {
    if (!normalizedSlug) return
    void loadCreatorSettings(normalizedSlug)
    void loadPages(normalizedSlug)
    void loadProducts(normalizedSlug)
    void loadTemplates(normalizedSlug)
    void loadCampaigns(normalizedSlug)
    const refetchOnFocus = () => {
      void loadTemplates(normalizedSlug)
      void loadCampaigns(normalizedSlug)
    }
    window.addEventListener('focus', refetchOnFocus)
    return () => window.removeEventListener('focus', refetchOnFocus)
  }, [normalizedSlug, loadCreatorSettings, loadPages, loadProducts, loadTemplates, loadCampaigns])

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
            <div>
              <h1 className="font-display text-3xl font-bold leading-none text-white light:text-neutral-950">Emails</h1>
              <p className="mt-1.5 text-sm text-white/40 light:text-neutral-400">
                Build reusable templates and send them to your captured contacts.
              </p>
            </div>

            {homeSummary ? (
              <MonthlyUsageCard sent={homeSummary.emailsSentThisMonth} limit={homeSummary.emailsMonthlyLimit} />
            ) : null}

            <div className="flex gap-1.5 border-b border-white/10 light:border-neutral-200">
              <TabButton icon={Send} label="Send" active={tab === 'send'} onClick={() => setTab('send')} />
              <TabButton icon={FileText} label="Templates" active={tab === 'templates'} onClick={() => setTab('templates')} />
              <TabButton icon={History} label="History" active={tab === 'history'} onClick={() => setTab('history')} />
            </div>

            {tab === 'send' ? (
              <SendTab
                slug={normalizedSlug}
                templates={templates}
                templatesStatus={templatesStatus}
                pages={pages}
                products={products}
                creatorSettings={creatorSettings}
                onGoToTemplates={() => setTab('templates')}
                onSent={() => setTab('history')}
              />
            ) : null}

            {tab === 'templates' ? (
              <TemplatesTab
                slug={normalizedSlug}
                templates={templates}
                templatesStatus={templatesStatus}
                creatorSettings={creatorSettings}
              />
            ) : null}

            {tab === 'history' ? (
              <HistoryTab
                slug={normalizedSlug}
                campaigns={campaigns}
                campaignsStatus={campaignsStatus}
                pages={pages}
                products={products}
              />
            ) : null}

          </div>
        )}
      </div>
    </AppShell>
  )
}

function MonthlyUsageCard({ sent, limit }: { sent: number; limit: number }) {
  const isUnlimited = limit < 0
  const pct = isUnlimited ? 0 : Math.min(100, limit > 0 ? (sent / limit) * 100 : 100)
  const color = pct > 85 ? CHART_COLORS[3] : CHART_COLORS[0]

  return (
    <div className="max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
      <p className="text-sm font-semibold text-white light:text-neutral-950">Monthly usage</p>
      <p className="mt-0.5 text-xs text-white/40 light:text-neutral-400">Resets on the 1st of each month</p>
      <p className="font-data mt-3 text-2xl font-bold tabular-nums" style={{ color }}>
        {sent.toLocaleString()}
        <span className="text-base font-normal text-white/40 light:text-neutral-400">
          /{isUnlimited ? '∞' : limit.toLocaleString()}
        </span>
      </p>
      {!isUnlimited ? (
        <>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10 light:bg-neutral-100">
            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <p className="mt-2 text-xs text-white/40 light:text-neutral-400">
            {Math.max(0, limit - sent).toLocaleString()} emails remaining
          </p>
        </>
      ) : null}
    </div>
  )
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Send
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? 'border-accent text-white light:text-neutral-950'
          : 'border-transparent text-white/40 hover:text-white/70 light:text-neutral-400 light:hover:text-neutral-700'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function SendTab({
  slug,
  templates,
  templatesStatus,
  pages,
  products,
  creatorSettings,
  onGoToTemplates,
  onSent,
}: {
  slug: string
  templates: EmailTemplate[]
  templatesStatus: 'idle' | 'loading' | 'success' | 'error'
  pages: ReturnType<typeof useLandingPageStore.getState>['pages']
  products: ReturnType<typeof useProductStore.getState>['products']
  creatorSettings: ReturnType<typeof useCreatorStore.getState>['creatorSettings']
  onGoToTemplates: () => void
  onSent: () => void
}) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const activeTemplates = templates.filter((t) => t.status === 'Active')
  const publishedPages = pages.filter((p) => p.status === 'Published')
  const activeProducts = products.filter((p) => p.status === 'Active')
  const hasAudience = publishedPages.length > 0 || activeProducts.length > 0

  if (templatesStatus === 'loading') {
    return (
      <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
        <Loader2 className="animate-spin" size={16} />
        Loading templates…
      </div>
    )
  }

  if (activeTemplates.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No templates yet"
        description="Create a reusable template first — then you can send it to any audience."
        actionLabel="Create your first template"
        onAction={onGoToTemplates}
      />
    )
  }

  if (!hasAudience) {
    return (
      <EmptyState
        icon={Mail}
        title="No audience yet"
        description="Publish a landing page and capture some contacts before you can send an email."
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-20 text-center light:border-neutral-300 light:bg-white">
      <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-white/40 light:bg-neutral-100 light:text-neutral-400">
        <Send size={24} strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-sm font-semibold text-white light:text-neutral-950">Ready to send</p>
        <p className="mt-1 text-sm text-white/40 light:text-neutral-400">
          Pick a template and an audience, then send it.
        </p>
      </div>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong"
        onClick={() => setIsWizardOpen(true)}
      >
        <Send size={15} />
        Send email
      </button>

      {isWizardOpen ? (
        <SendWizardModal
          slug={slug}
          templates={templates}
          landingPages={pages}
          products={products}
          creatorSettings={creatorSettings}
          onClose={() => setIsWizardOpen(false)}
          onSent={() => { setIsWizardOpen(false); onSent() }}
        />
      ) : null}
    </div>
  )
}

function TemplatesTab({
  slug,
  templates,
  templatesStatus,
  creatorSettings,
}: {
  slug: string
  templates: EmailTemplate[]
  templatesStatus: 'idle' | 'loading' | 'success' | 'error'
  creatorSettings: ReturnType<typeof useCreatorStore.getState>['creatorSettings']
}) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

  const currentTemplate = useTemplateStore((s) => s.currentTemplate)
  const loadTemplate = useTemplateStore((s) => s.loadTemplate)
  const clearCurrentTemplate = useTemplateStore((s) => s.clearCurrentTemplate)

  const openCreate = () => {
    clearCurrentTemplate()
    setEditingTemplateId(null)
    setIsEditorOpen(true)
  }

  const openEdit = (templatePublicId: string) => {
    void loadTemplate(slug, templatePublicId)
    setEditingTemplateId(templatePublicId)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setIsEditorOpen(false)
    setEditingTemplateId(null)
    clearCurrentTemplate()
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong"
          onClick={openCreate}
        >
          <Plus size={15} />
          New template
        </button>
      </div>

      {templatesStatus === 'loading' ? (
        <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
          <Loader2 className="animate-spin" size={16} />
          Loading templates…
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates yet"
          description="Templates are reusable — write the content once, then send it to any audience whenever you like."
          actionLabel="Create your first template"
          onAction={openCreate}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
          <div className="grid grid-cols-[1fr_1fr_120px_160px_60px] items-center border-b border-white/10 px-5 py-3 light:border-neutral-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Name</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Subject</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Status</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Last modified</p>
            <span />
          </div>
          <ul className="divide-y divide-white/10 light:divide-neutral-100">
            {templates.map((template) => (
              <li key={template.publicId} className="group transition-colors hover:bg-white/[0.02] light:hover:bg-neutral-50">
                <div className="grid grid-cols-[1fr_1fr_120px_160px_60px] items-center px-5 py-4">
                  <p className="truncate text-sm font-semibold text-white light:text-neutral-950">{template.name}</p>
                  <p className="truncate text-xs font-medium text-white/60 light:text-neutral-600">{template.subject}</p>
                  <TemplateStatusBadge status={template.status} />
                  <p className="text-xs text-white/50 light:text-neutral-500">
                    {new Date(template.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex items-center justify-end opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      title="Edit"
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-600 light:hover:bg-neutral-100"
                      onClick={() => openEdit(template.publicId)}
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isEditorOpen ? (
        editingTemplateId && currentTemplate?.publicId !== editingTemplateId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        ) : (
          <TemplateEditorModal
            key={editingTemplateId ?? 'new'}
            slug={slug}
            template={editingTemplateId ? currentTemplate ?? undefined : undefined}
            creatorSettings={creatorSettings}
            onClose={closeEditor}
          />
        )
      ) : null}
    </div>
  )
}

function TemplateStatusBadge({ status }: { status: EmailTemplate['status'] }) {
  if (status === 'Archived') {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/50 light:bg-neutral-100 light:text-neutral-500">
        <Archive size={10} />
        Archived
      </span>
    )
  }

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 light:bg-emerald-50 light:text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-400" />
      Active
    </span>
  )
}

function HistoryTab({
  slug,
  campaigns,
  campaignsStatus,
  pages,
  products,
}: {
  slug: string
  campaigns: CampaignListItem[]
  campaignsStatus: 'idle' | 'loading' | 'success' | 'error'
  pages: ReturnType<typeof useLandingPageStore.getState>['pages']
  products: ReturnType<typeof useProductStore.getState>['products']
}) {
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignListItem | null>(null)

  const targetName = useMemo(() => {
    const lpByPublicId = new Map(pages.map((p) => [p.publicId, p.title]))
    const productByPublicId = new Map(products.map((p) => [p.publicId, p.name]))
    return (campaign: CampaignListItem) =>
      campaign.audienceType === 'LandingPage'
        ? lpByPublicId.get(campaign.targetPublicId) ?? '—'
        : productByPublicId.get(campaign.targetPublicId) ?? '—'
  }, [pages, products])

  if (campaignsStatus === 'loading') {
    return (
      <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
        <Loader2 className="animate-spin" size={16} />
        Loading sends…
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No sends yet"
        description="Once you send an email, it will show up here with its delivery progress."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
      <div className="grid grid-cols-[1fr_140px_320px_140px] items-center border-b border-white/10 px-5 py-3 light:border-neutral-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Subject</p>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Audience</p>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Status</p>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Date</p>
      </div>
      <ul className="divide-y divide-white/10 light:divide-neutral-100">
        {campaigns.map((campaign) => (
          <li key={campaign.publicId}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCampaign(campaign)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCampaign(campaign) }}
              className="grid w-full cursor-pointer grid-cols-[1fr_140px_320px_140px] items-center px-5 py-4 text-left transition hover:bg-white/[0.03] light:hover:bg-neutral-50"
            >
              <p className="truncate text-sm font-semibold text-white light:text-neutral-950">{campaign.subject}</p>
              <p className="truncate text-xs font-medium text-white/60 light:text-neutral-600">{targetName(campaign)}</p>
              <StatusCell campaign={campaign} slug={slug} />
              <p className="text-xs text-white/50 light:text-neutral-500">
                {new Date(campaign.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {selectedCampaign ? (
        <CampaignDetailModal
          slug={slug}
          campaign={selectedCampaign}
          audienceName={targetName(selectedCampaign)}
          onClose={() => setSelectedCampaign(null)}
        />
      ) : null}
    </div>
  )
}

function CampaignDetailModal({
  slug,
  campaign,
  audienceName,
  onClose,
}: {
  slug: string
  campaign: CampaignListItem
  audienceName: string
  onClose: () => void
}) {
  const failedRecipients = useCampaignStore((s) => s.failedRecipients)
  const failedRecipientsStatus = useCampaignStore((s) => s.failedRecipientsStatus)
  const loadFailedRecipients = useCampaignStore((s) => s.loadFailedRecipients)
  const clearFailedRecipients = useCampaignStore((s) => s.clearFailedRecipients)
  const resendFailedStatus = useCampaignStore((s) => s.resendFailedStatus)
  const resendFailedError = useCampaignStore((s) => s.resendFailedError)
  const resendFailedForSlug = useCampaignStore((s) => s.resendFailedForSlug)
  const resetResendFailedFeedback = useCampaignStore((s) => s.resetResendFailedFeedback)
  const [isConfirmingResend, setIsConfirmingResend] = useState(false)

  useEffect(() => {
    if (campaign.failedCount > 0) void loadFailedRecipients(slug, campaign.publicId)
    return () => clearFailedRecipients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, campaign.publicId, campaign.failedCount])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 py-8 backdrop-blur-sm">
      <div className="grid max-h-[85vh] w-full max-w-2xl grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl light:border-neutral-200 light:bg-white">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 light:border-neutral-100">
          <div>
            <h2 className="text-base font-semibold text-white light:text-neutral-950">{campaign.subject}</h2>
            <p className="mt-0.5 text-xs text-white/40 light:text-neutral-400">
              {audienceName} · {new Date(campaign.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white light:text-neutral-400 light:hover:bg-neutral-100 light:hover:text-neutral-700"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-6">
          <StatusCell campaign={campaign} slug={slug} />

          {campaign.status === 'Failed' && campaign.note ? (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 light:bg-red-50 light:text-red-700">
              {campaign.note}
            </p>
          ) : null}

          {campaign.status === 'Queued' && campaign.failedCount > 0 ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white light:text-neutral-950">
                  Failed ({campaign.failedCount})
                </p>
                <button
                  type="button"
                  onClick={() => { resetResendFailedFeedback(); setIsConfirmingResend(true) }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-600 light:hover:bg-neutral-50"
                >
                  <RotateCcw size={13} />
                  Resend failed
                </button>
              </div>
              <p className="text-xs text-white/40 light:text-neutral-400">
                Monthly limit was refunded for failed recipients — resending does not charge it again.
              </p>
              {resendFailedStatus === 'error' && resendFailedError ? (
                <p className="text-xs text-red-400 light:text-red-500">{resendFailedError}</p>
              ) : null}

              {failedRecipientsStatus === 'loading' ? (
                <div className="flex items-center gap-2 text-sm text-white/40 light:text-neutral-400">
                  <Loader2 className="animate-spin" size={14} />
                  Loading failed recipients…
                </div>
              ) : (
                <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 light:divide-neutral-100 light:border-neutral-200">
                  {failedRecipients.map((recipient) => (
                    <li key={recipient.email} className="px-4 py-3">
                      <p className="text-sm font-medium text-white light:text-neutral-950">{recipient.email}</p>
                      {recipient.lastError ? (
                        <p className="mt-0.5 truncate text-xs text-white/40 light:text-neutral-400">{recipient.lastError}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {isConfirmingResend ? (
        <ResendFailedConfirmDialog
          failedCount={campaign.failedCount}
          isSubmitting={resendFailedStatus === 'submitting'}
          onCancel={() => setIsConfirmingResend(false)}
          onConfirm={async () => {
            const requeued = await resendFailedForSlug(slug, campaign.publicId)
            if (requeued !== null) setIsConfirmingResend(false)
          }}
        />
      ) : null}
    </div>
  )
}

function ResendFailedConfirmDialog({
  failedCount,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  failedCount: number
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl light:border-neutral-200 light:bg-white">
        <h2 className="text-base font-semibold text-white light:text-neutral-950">
          Resend to {failedCount} failed recipient{failedCount === 1 ? '' : 's'}?
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-500">
          They'll be retried with the same content. This does not use any of your monthly email
          allowance.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex h-9 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-700 light:hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
            Resend
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusCell({ campaign, slug }: { campaign: CampaignListItem; slug: string }) {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const cancelScheduledCampaignForSlug = useCampaignStore((s) => s.cancelScheduledCampaignForSlug)
  const cancelScheduleStatus = useCampaignStore((s) => s.cancelScheduleStatus)
  const resetCancelScheduleFeedback = useCampaignStore((s) => s.resetCancelScheduleFeedback)

  if (campaign.status === 'Scheduled') {
    return (
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1" onClick={(e) => e.stopPropagation()}>
        <span className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 light:bg-cyan-50 light:text-cyan-700">
          <span className="size-1.5 shrink-0 rounded-full bg-cyan-400" />
          Scheduled for {campaign.scheduledAt ? formatDateTime(campaign.scheduledAt) : '—'}
        </span>
        <button
          type="button"
          onClick={() => { resetCancelScheduleFeedback(); setIsConfirmingCancel(true) }}
          className="shrink-0 text-xs font-medium text-white/40 underline decoration-white/20 underline-offset-2 transition hover:text-white/70 light:text-neutral-400 light:hover:text-neutral-700"
        >
          Cancel
        </button>
        {isConfirmingCancel ? (
          <CancelScheduleConfirmDialog
            isSubmitting={cancelScheduleStatus === 'submitting'}
            onCancel={() => setIsConfirmingCancel(false)}
            onConfirm={async () => {
              const ok = await cancelScheduledCampaignForSlug(slug, campaign.publicId)
              if (ok) setIsConfirmingCancel(false)
            }}
          />
        ) : null}
      </div>
    )
  }

  if (campaign.status === 'Failed') {
    return (
      <span
        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-300 light:bg-red-50 light:text-red-700"
        title={campaign.note ?? undefined}
      >
        <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
        Failed
      </span>
    )
  }

  if (campaign.status === 'Cancelled') {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/50 light:bg-neutral-100 light:text-neutral-500">
        Cancelled
      </span>
    )
  }

  return <ProgressCell campaign={campaign} />
}

function CancelScheduleConfirmDialog({
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl light:border-neutral-200 light:bg-white">
        <h2 className="text-base font-semibold text-white light:text-neutral-950">Cancel this scheduled send?</h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-500">
          It will never be dispatched. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex h-9 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-700 light:hover:bg-neutral-50"
          >
            Keep it
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
            Cancel send
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function ProgressCell({ campaign }: { campaign: CampaignListItem }) {
  const allSent = campaign.sentCount + campaign.failedCount >= campaign.recipientCount
  const tone = campaign.failedCount > 0
    ? 'text-amber-300 light:text-amber-700'
    : allSent
      ? 'text-emerald-300 light:text-emerald-700'
      : 'text-white/70 light:text-neutral-600'
  const dot = campaign.failedCount > 0
    ? 'bg-amber-400'
    : allSent
      ? 'bg-emerald-500'
      : 'bg-white/40 light:bg-neutral-400'

  return (
    <p className={`font-data flex items-center gap-1.5 text-xs font-semibold tabular-nums ${tone}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
      Sent {campaign.sentCount}/{campaign.recipientCount}
      {campaign.failedCount > 0 ? (
        <span className="text-red-400 light:text-red-600">· {campaign.failedCount} failed</span>
      ) : null}
    </p>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: typeof AlertTriangle
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-20 text-center light:border-neutral-300 light:bg-white">
      <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-white/40 light:bg-neutral-100 light:text-neutral-400">
        <Icon size={24} strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-sm font-semibold text-white light:text-neutral-950">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-white/40 light:text-neutral-400">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong"
          onClick={onAction}
        >
          <Plus size={15} />
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
