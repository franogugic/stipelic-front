import { CreditCard, Palette, TriangleAlert, User } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonCards,
  TabPanel,
  Tabs,
  useTabs,
} from '../../../shared/ui/ledger'
import type { TabItem } from '../../../shared/ui/ledger'
import { BillingTab } from '../components/settings/BillingTab'
import { BrandTab } from '../components/settings/BrandTab'
import { DangerTab } from '../components/settings/DangerTab'
import { ProfileTab } from '../components/settings/ProfileTab'
import { useCreatorStore } from '../model/creator-store'
import { usePayoutStore } from '../model/payout-store'

const TAB_ITEMS: TabItem[] = [
  {
    key: 'profile',
    label: (
      <>
        <User />
        Profile
      </>
    ),
  },
  {
    key: 'brand',
    label: (
      <>
        <Palette />
        Brand
      </>
    ),
  },
  {
    key: 'billing',
    label: (
      <>
        <CreditCard />
        Plan &amp; billing
      </>
    ),
  },
  {
    key: 'danger',
    label: (
      <>
        <TriangleAlert />
        Danger zone
      </>
    ),
  },
]

export function CreatorSettingsPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorSettings = useCreatorStore((s) => s.creatorSettings)
  const creatorSettingsStatus = useCreatorStore((s) => s.creatorSettingsStatus)
  const loadCreatorSettings = useCreatorStore((s) => s.loadCreatorSettings)
  const startConnectOnboardingLink = usePayoutStore((s) => s.startConnectOnboardingLink)

  const tabs = useTabs({ items: TAB_ITEMS, label: 'Settings', defaultValue: 'profile', paramName: 'tab' })

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (slug) void loadCreatorSettings(slug)
  }, [slug, loadCreatorSettings])

  // Stripe Connect return/refresh flow — see CreatorConnectService.StartConnectOnboardingAsync for the query
  // params this page must handle. Connect status lives on the Payouts page, so a successful return refreshes the
  // creator record and sends the user there. Runs once per page load (guarded by the ref), since re-triggering on
  // every render / searchParams identity change would loop.
  const connectFlowHandled = useRef(false)
  useEffect(() => {
    if (connectFlowHandled.current) return
    const connectParam = searchParams.get('connect')
    if (!connectParam) return
    connectFlowHandled.current = true

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('connect')
        return next
      },
      { replace: true },
    )

    if (connectParam === 'return') {
      void loadCurrentCreator().finally(() => navigate(`/app/${slug}/payouts`, { replace: true }))
    } else if (connectParam === 'refresh') {
      void startConnectOnboardingLink().then((url) => {
        if (url) window.location.href = url
      })
    }
  }, [searchParams, setSearchParams, loadCurrentCreator, startConnectOnboardingLink, navigate, slug])

  const body = () => {
    if (creatorLoading || creatorSettingsStatus === 'idle' || creatorSettingsStatus === 'loading') {
      return <SkeletonCards count={2} />
    }
    if (!creator) return <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
    if (creatorSettingsStatus === 'error' || !creatorSettings) {
      return <ErrorState onRetry={() => void loadCreatorSettings(slug)} />
    }
    return (
      <>
        <Tabs {...tabs.tablistProps} className="settings__tabs" />
        <TabPanel tabs={tabs} value="profile">
          <ProfileTab />
        </TabPanel>
        <TabPanel tabs={tabs} value="brand">
          <BrandTab slug={slug} settings={creatorSettings} currency={creator.defaultCurrency} />
        </TabPanel>
        <TabPanel tabs={tabs} value="billing">
          <BillingTab slug={slug} creator={creator} />
        </TabPanel>
        <TabPanel tabs={tabs} value="danger">
          <DangerTab slug={slug} creator={creator} />
        </TabPanel>
      </>
    )
  }

  return (
    <AppShell slug={slug} activeSection="settings">
      <PageHeader title={<em>Settings</em>} subtitle="Your profile, brand, plan and workspace." />
      {body()}
    </AppShell>
  )
}
