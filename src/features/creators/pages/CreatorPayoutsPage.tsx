import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { EmptyState, PageHeader, SkeletonCards } from '../../../shared/ui/ledger'
import { BankTransferPayouts } from '../components/payouts/BankTransferPayouts'
import { ConnectPayouts } from '../components/payouts/ConnectPayouts'
import { useCreatorStore } from '../model/creator-store'

/** How the workspace gets paid: Stripe Connect or bank transfer, by the creator's payout mode. */
export function CreatorPayoutsPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const loading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

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
    return creator.payoutMode === 'StripeConnect' ? (
      <ConnectPayouts slug={slug} creator={creator} />
    ) : (
      <BankTransferPayouts slug={slug} creator={creator} />
    )
  }

  return (
    <AppShell slug={slug} activeSection="payouts">
      {body()}
    </AppShell>
  )
}
