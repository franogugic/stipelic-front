import { AlertTriangle, FileText, Loader2, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { Card, PageHeader } from '../../../shared/ui/figma'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { useProductStore } from '../../products/model/product-store'
import { NewCampaignCard } from '../components/NewCampaignCard'
import { SentCampaignsCard } from '../components/SentCampaignsCard'
import { OpenRateTrendCard } from '../components/OpenRateTrendCard'
import { TemplateEditorPanel } from '../components/TemplateEditorPanel'
import { useCampaignStore } from '../model/campaign-store'
import { useTemplateStore } from '../model/template-store'
import type { CampaignListItem, EmailTemplate } from '../model/types'

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
  const usage = useCampaignStore((s) => s.usage)
  const loadUsage = useCampaignStore((s) => s.loadUsage)
  const loadOpenRateTrend = useCampaignStore((s) => s.loadOpenRateTrend)

  const audienceName = useMemo(() => {
    const lpByPublicId = new Map(pages.map((p) => [p.publicId, p.title]))
    const productByPublicId = new Map(products.map((p) => [p.publicId, p.name]))
    return (campaign: CampaignListItem) => {
      if (campaign.audienceType === 'All') return 'All subscribers'
      const target = campaign.targetPublicId ?? ''
      return (campaign.audienceType === 'LandingPage' ? lpByPublicId.get(target) : productByPublicId.get(target)) ?? '—'
    }
  }, [pages, products])

  const isLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (!normalizedSlug) return
    void loadCreatorSettings(normalizedSlug)
    void loadPages(normalizedSlug)
    void loadProducts(normalizedSlug)
    void loadTemplates(normalizedSlug)
    void loadCampaigns(normalizedSlug)
    void loadUsage(normalizedSlug)
    void loadOpenRateTrend(normalizedSlug)
    const refetchOnFocus = () => {
      void loadTemplates(normalizedSlug)
      void loadCampaigns(normalizedSlug)
      void loadUsage(normalizedSlug)
      void loadOpenRateTrend(normalizedSlug)
    }
    window.addEventListener('focus', refetchOnFocus)
    return () => window.removeEventListener('focus', refetchOnFocus)
  }, [normalizedSlug, loadCreatorSettings, loadPages, loadProducts, loadTemplates, loadCampaigns, loadUsage, loadOpenRateTrend])

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="emails">
      <div className="p-8">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={18} />
            Loading workspace…
          </div>
        ) : !creator ? (
          <Card className="p-8">
            <p className="font-semibold">Workspace not found</p>
            <button
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
              type="button"
              onClick={() => navigate('/')}
            >
              Go home
            </button>
          </Card>
        ) : (
          <>
            <PageHeader title="Email Marketing" subtitle="Send campaigns to your captured subscribers" />

            <div className="grid grid-cols-3 gap-4 mb-6">
              <MonthlyUsageCard usage={usage} />
              <OpenRateTrendCard className="col-span-2" />
            </div>

            <div className="grid grid-cols-5 gap-6 mb-6">
              <NewCampaignCard className="col-span-3" slug={normalizedSlug} creatorSettings={creatorSettings} />
              <SentCampaignsCard
                className="col-span-2"
                campaigns={campaigns}
                status={campaignsStatus}
                audienceName={audienceName}
              />
            </div>

            <div className="grid gap-8">
              <TemplatesTab
                slug={normalizedSlug}
                templates={templates}
                templatesStatus={templatesStatus}
                creatorSettings={creatorSettings}
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function MonthlyUsageCard({ usage }: { usage: { sent: number; limit: number } | null }) {
  // The allowance is per calendar month; the next reset is the 1st of the following month (UTC).
  const now = new Date()
  const resetsOn = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const isUnlimited = usage !== null && usage.limit < 0
  const pct = usage === null || isUnlimited ? 0 : Math.min(100, usage.limit > 0 ? (usage.sent / usage.limit) * 100 : 100)
  const color = pct > 85 ? 'var(--color-chart-4)' : 'var(--color-chart-1)'

  return (
    <Card className="p-5">
      <p className="text-sm font-bold mb-1">Monthly Usage</p>
      <p className="text-[11px] text-muted-foreground mb-4">Resets {resetsOn}</p>
      {usage === null ? (
        <p className="text-[11px] text-muted-foreground">Loading usage…</p>
      ) : (
        <>
          <p className="font-bold mb-3" style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.4rem', color }}>
            {usage.sent.toLocaleString()}
            <span className="text-muted-foreground text-base font-normal">
              /{isUnlimited ? '∞' : usage.limit.toLocaleString()}
            </span>
          </p>
          {!isUnlimited && (
            <div className="h-1.5 rounded-full w-full mb-2 bg-white/[0.08] light:bg-secondary">
              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            {isUnlimited ? 'Unlimited' : `${Math.max(0, usage.limit - usage.sent).toLocaleString()} emails remaining`}
          </p>
        </>
      )}
    </Card>
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

  if (templatesStatus === 'loading') {
    return (
      <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
        <Loader2 className="animate-spin" size={16} />
        Loading templates…
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No templates yet"
        description="Templates are reusable — write the content once, then send it to any audience whenever you like."
        actionLabel="Create your first template"
        onAction={openCreate}
      />
    )
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 280px)' }}>
      {/* Left list */}
      <div className="flex w-[38%] flex-col">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Email Templates</p>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-chart-1)' }}
          >
            <Plus size={12} /> New Template
          </button>
        </div>
        <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card">
          {templates.map((template) => {
            const isSelected = isEditorOpen && editingTemplateId === template.publicId
            return (
              <button
                key={template.publicId}
                type="button"
                onClick={() => openEdit(template.publicId)}
                className="w-full text-left px-4 py-3 transition-all"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  backgroundColor: isSelected ? 'color-mix(in srgb, var(--color-chart-1) 10%, transparent)' : 'transparent',
                  borderLeft: isSelected ? '2px solid var(--color-chart-1)' : '2px solid transparent',
                }}
              >
                <div className="mb-0.5 flex items-center justify-between">
                  <p className="truncate text-sm font-medium">{template.name}</p>
                  <TemplateStatusBadge status={template.status} />
                </div>
                <p className="truncate text-[11px] text-muted-foreground">{template.subject}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right edit panel */}
      <div className="flex-1">
        {!isEditorOpen ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Select a template or create a new one</p>
          </div>
        ) : editingTemplateId && currentTemplate?.publicId !== editingTemplateId ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-border bg-card">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        ) : (
          <TemplateEditorPanel
            key={editingTemplateId ?? 'new'}
            slug={slug}
            template={editingTemplateId ? currentTemplate ?? undefined : undefined}
            creatorSettings={creatorSettings}
            onClose={closeEditor}
          />
        )}
      </div>
    </div>
  )
}

const TEMPLATE_STATUS_STYLES: Record<EmailTemplate['status'], { bg: string; color: string }> = {
  Active: {
    bg: 'color-mix(in srgb, var(--color-chart-1) 12%, transparent)',
    color: 'var(--color-chart-1)',
  },
  Archived: {
    bg: 'color-mix(in srgb, var(--color-muted-foreground) 12%, transparent)',
    color: 'var(--color-muted-foreground)',
  },
}

function TemplateStatusBadge({ status }: { status: EmailTemplate['status'] }) {
  const s = TEMPLATE_STATUS_STYLES[status]
  return (
    <span
      className="inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-mono"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid color-mix(in srgb, ${s.color} 13%, transparent)` }}
    >
      {status}
    </span>
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
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 bg-card py-20 text-center light:border-neutral-300">
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
