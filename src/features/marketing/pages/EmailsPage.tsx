import { Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { Card, PageHeader } from '../../../shared/ui/figma'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { useProductStore } from '../../products/model/product-store'
import { NewCampaignCard } from '../components/NewCampaignCard'
import { SentCampaignsCard } from '../components/SentCampaignsCard'
import { OpenRateTrendCard } from '../components/OpenRateTrendCard'
import { TemplatesCard } from '../components/TemplatesCard'
import { useCampaignStore } from '../model/campaign-store'
import { useTemplateStore } from '../model/template-store'
import type { CampaignListItem } from '../model/types'

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
                slug={normalizedSlug}
                campaigns={campaigns}
                status={campaignsStatus}
                audienceName={audienceName}
              />
            </div>

            <TemplatesCard
              className="mt-6"
              slug={normalizedSlug}
              templates={templates}
              templatesStatus={templatesStatus}
              creatorSettings={creatorSettings}
            />
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
