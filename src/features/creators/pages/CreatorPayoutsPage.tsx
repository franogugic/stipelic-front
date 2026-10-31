import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useFeatures } from '../../../shared/model/features-store'
import { AppShell } from '../../../shared/ui/AppShell'
import { EmptyState, PageHeader, SkeletonCards } from '../../../shared/ui/ledger'
import { ConnectPayouts } from '../components/payouts/ConnectPayouts'
import { useCreatorStore } from '../model/creator-store'

/** How the workspace gets paid: always through the creator's own connected Stripe account. */
export function CreatorPayoutsPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { ready, paymentsEnabled } = useFeatures()
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const loading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  // The closed beta has no payouts: the address still exists (old links, bookmarks) but leads back to the dashboard.
  if (ready && !paymentsEnabled) return <Navigate to={`/app/${slug}`} replace />

  const body = () => {
    if (loading) {
      return (
        <>
          <PageHeader title={<em>Payouts</em>} />
          <SkeletonCards count={2} />
        </>
      )
    }
    if (!creator) return <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
    return <ConnectPayouts slug={slug} creator={creator} />
  }

  return (
    <AppShell slug={slug} activeSection="payouts">
      {body()}
    </AppShell>
  )
}
