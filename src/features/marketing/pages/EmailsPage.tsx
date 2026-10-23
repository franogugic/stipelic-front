import { LayoutTemplate, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { Button, EmptyState, ErrorState, PageHeader, SkeletonCards, SkeletonRows } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { useProductStore } from '../../products/model/product-store'
import { getContactStats } from '../api/contacts-api'
import { CampaignsBoard } from '../components/CampaignsBoard'
import { CampaignsTable } from '../components/CampaignsTable'
import { ComingUpCard } from '../components/ComingUpCard'
import { OpenRateChartCard } from '../components/OpenRateChartCard'
import { useCampaignStore } from '../model/campaign-store'
import { CAMPAIGN_FILTERS, campaignGroup } from '../model/campaign-groups'
import { useTemplateStore } from '../model/template-store'
import type { ContactStats } from '../model/types'
import { useAudienceName } from '../model/use-audience-name'

/** Email marketing: a summary board, the open rate of each sent campaign, what is coming up, and every campaign. */
export function EmailsPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  const loadPages = useLandingPageStore((s) => s.loadPages)
  const loadProducts = useProductStore((s) => s.loadProducts)

  const templates = useTemplateStore((s) => s.templates)
  const templatesSlug = useTemplateStore((s) => s.templatesSlug)
  const templatesStatus = useTemplateStore((s) => s.templatesStatus)
  const loadTemplates = useTemplateStore((s) => s.loadTemplates)

  const campaigns = useCampaignStore((s) => s.campaigns)
  const campaignsStatus = useCampaignStore((s) => s.campaignsStatus)
  const campaignsSlug = useCampaignStore((s) => s.campaignsSlug)
  const loadCampaigns = useCampaignStore((s) => s.loadCampaigns)
  const usage = useCampaignStore((s) => s.usage)
  const loadUsage = useCampaignStore((s) => s.loadUsage)

  const audienceName = useAudienceName()
  const [contacts, setContacts] = useState<{ key: string; stats: ContactStats | null } | null>(null)
  const [query, setQuery] = useState('')

  const filterParam = searchParams.get('status')
  const filter = CAMPAIGN_FILTERS.some(([key]) => key === filterParam) ? (filterParam as string) : 'all'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (!slug) return
    void loadPages(slug)
    void loadProducts(slug)
    void loadCampaigns(slug)
    void loadUsage(slug)
    void loadTemplates(slug)
    getContactStats(slug)
      .then((stats) => setContacts({ key: slug, stats }))
      .catch(() => setContacts({ key: slug, stats: null }))
    const refetchOnFocus = () => {
      void loadCampaigns(slug)
      void loadUsage(slug)
    }
    window.addEventListener('focus', refetchOnFocus)
    return () => window.removeEventListener('focus', refetchOnFocus)
  }, [slug, loadPages, loadProducts, loadCampaigns, loadUsage, loadTemplates])

  if (!slug) return null

  // The store keeps the last workspace's list until the new one has loaded; never show it under another address.
  const listStatus = campaignsSlug === slug || campaignsStatus === 'error' ? campaignsStatus : 'loading'
  const ready = listStatus === 'success'
  // The averages, the open-rate chart and the sent count are about campaigns: a resend (to people who did not open) is
  // listed in the table but would drag every one of them down.
  const sent = campaigns
    .filter((campaign) => campaignGroup(campaign) === 'sent' && !campaign.sourceCampaignPublicId)
    .sort((a, b) => new Date(a.queuedAt ?? a.createdAt).getTime() - new Date(b.queuedAt ?? b.createdAt).getTime())
  const upcoming = campaigns.filter((campaign) => campaignGroup(campaign) === 'upcoming')
  const activeTemplates =
    templatesSlug === slug && templatesStatus === 'success' ? templates.filter((template) => template.status === 'Active').length : null
  const contactStats = contacts?.key === slug ? contacts.stats : null

  const setFilter = (key: string) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (key === 'all') next.delete('status')
        else next.set('status', key)
        return next
      },
      { replace: true },
    )

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
          {listStatus === 'error' ? (
            <ErrorState onRetry={() => void loadCampaigns(slug)} />
          ) : !ready ? (
            <div className="stack stack--lg">
              <SkeletonCards count={4} />
              <SkeletonRows count={4} />
            </div>
          ) : (
            <div className="stack stack--lg reveal">
              <CampaignsBoard sent={sent} upcomingCount={upcoming.length} usage={usage} contacts={contactStats} />
              <div className="dash">
                <div className="span-8">
                  <OpenRateChartCard sent={sent} />
                </div>
                <div className="span-4">
                  <ComingUpCard upcoming={upcoming} slug={slug} templateCount={activeTemplates} audienceName={audienceName} />
                </div>
              </div>
              <CampaignsTable
                campaigns={campaigns}
                status={listStatus}
                filter={filter}
                onFilter={setFilter}
                query={query}
                onQuery={setQuery}
                audienceName={audienceName}
                slug={slug}
                newCampaignTo={`/app/${slug}/emails/new`}
                onRetry={() => void loadCampaigns(slug)}
              />
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}
