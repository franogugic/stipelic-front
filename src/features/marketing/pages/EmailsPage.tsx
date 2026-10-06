import { LayoutTemplate, Send } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { Button, EmptyState, PageHeader, SkeletonRows } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { useProductStore } from '../../products/model/product-store'
import { CampaignsTable } from '../components/CampaignsTable'
import { EmailUsageCard } from '../components/EmailUsageCard'
import { NewCampaignCard } from '../components/NewCampaignCard'
import { OpenRateCard } from '../components/OpenRateCard'
import { SentCampaignsCard } from '../components/SentCampaignsCard'
import { TemplatesCard } from '../components/TemplatesCard'
import { useCampaignStore } from '../model/campaign-store'
import { useTemplateStore } from '../model/template-store'
import type { CampaignListItem } from '../model/types'

const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export function EmailsPage() {
  const { slug = '' } = useParams<{ slug: string }>()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

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
  const campaignsSlug = useCampaignStore((s) => s.campaignsSlug)
  const loadCampaigns = useCampaignStore((s) => s.loadCampaigns)
  const usage = useCampaignStore((s) => s.usage)
  const usageStatus = useCampaignStore((s) => s.usageStatus)
  const loadUsage = useCampaignStore((s) => s.loadUsage)
  const openRateTrend = useCampaignStore((s) => s.openRateTrend)
  const openRateTrendStatus = useCampaignStore((s) => s.openRateTrendStatus)
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

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (!slug) return
    void loadCreatorSettings(slug)
    void loadPages(slug)
    void loadProducts(slug)
    void loadTemplates(slug)
    void loadCampaigns(slug)
    void loadUsage(slug)
    void loadOpenRateTrend(slug)
    const refetchOnFocus = () => {
      void loadTemplates(slug)
      void loadCampaigns(slug)
      void loadUsage(slug)
      void loadOpenRateTrend(slug)
    }
    window.addEventListener('focus', refetchOnFocus)
    return () => window.removeEventListener('focus', refetchOnFocus)
  }, [slug, loadCreatorSettings, loadPages, loadProducts, loadTemplates, loadCampaigns, loadUsage, loadOpenRateTrend])

  if (!slug) return null

  // The store keeps the last workspace's list until the new one has loaded; never show it under another address.
  const listStatus = campaignsSlug === slug || campaignsStatus === 'error' ? campaignsStatus : 'loading'

  return (
    <AppShell slug={slug} activeSection="emails">
      {creatorLoading ? (
        <SkeletonRows />
      ) : !creator ? (
        <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
      ) : (
        <>
          <PageHeader
            title={
              <>
                Email <em>marketing</em>
              </>
            }
            subtitle="Campaigns to the people who joined your pages."
            actions={
              <>
                <Button variant="secondary" icon={LayoutTemplate} onClick={() => scrollToSection('email-templates')}>
                  Templates
                </Button>
                <Button variant="primary" icon={Send} onClick={() => scrollToSection('email-composer')}>
                  New campaign
                </Button>
              </>
            }
          />
          <div className="dash reveal">
            <div className="span-5">
              <EmailUsageCard usage={usage} status={usageStatus} onRetry={() => void loadUsage(slug)} />
            </div>
            <div className="span-7">
              <OpenRateCard trend={openRateTrend} status={openRateTrendStatus} onRetry={() => void loadOpenRateTrend(slug)} />
            </div>
            <div className="span-12">
              <CampaignsTable
                campaigns={campaigns}
                status={listStatus}
                audienceName={audienceName}
                onNewCampaign={() => scrollToSection('email-composer')}
                onRetry={() => void loadCampaigns(slug)}
              />
            </div>
          </div>

          {/* Until the composer, campaign detail and templates screens replace them, these stay on the page. */}
          <div className="stack stack--lg mt-10 text-foreground">
            <div id="email-composer" className="scroll-mt-6">
              <NewCampaignCard slug={slug} creatorSettings={creatorSettings} />
            </div>
            <SentCampaignsCard slug={slug} campaigns={campaigns} status={campaignsStatus} audienceName={audienceName} />
            <div id="email-templates" className="scroll-mt-6">
              <TemplatesCard slug={slug} templates={templates} templatesStatus={templatesStatus} creatorSettings={creatorSettings} />
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}

