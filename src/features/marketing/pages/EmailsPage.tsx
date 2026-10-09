import { LayoutTemplate, Send } from 'lucide-react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { Button, EmptyState, PageHeader, SkeletonRows } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { useProductStore } from '../../products/model/product-store'
import { CampaignsTable } from '../components/CampaignsTable'
import { EmailUsageCard } from '../components/EmailUsageCard'
import { OpenRateCard } from '../components/OpenRateCard'
import { TemplatesCard } from '../components/TemplatesCard'
import { useCampaignStore } from '../model/campaign-store'
import { useTemplateStore } from '../model/template-store'
import { useAudienceName } from '../model/use-audience-name'

export function EmailsPage() {
  const { slug = '' } = useParams<{ slug: string }>()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  const creatorSettings = useCreatorStore((s) => s.creatorSettings)
  const loadCreatorSettings = useCreatorStore((s) => s.loadCreatorSettings)

  const loadPages = useLandingPageStore((s) => s.loadPages)
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

  const audienceName = useAudienceName()

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
                <Button variant="secondary" icon={LayoutTemplate} to={`/app/${slug}/emails/templates`}>
                  Templates
                </Button>
                <Button variant="primary" icon={Send} to={`/app/${slug}/emails/new`}>
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
                slug={slug}
                newCampaignTo={`/app/${slug}/emails/new`}
                onRetry={() => void loadCampaigns(slug)}
              />
            </div>
          </div>

          {/* Stays on the page until the templates screens replace it. */}
          <div className="stack stack--lg mt-10 text-foreground">
            <div>
              <TemplatesCard slug={slug} templates={templates} templatesStatus={templatesStatus} creatorSettings={creatorSettings} />
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}

