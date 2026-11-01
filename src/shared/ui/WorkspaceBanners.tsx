import { useState } from 'react'
import { CalendarClock, CircleAlert, CreditCard, Landmark, ShieldAlert, Sparkles } from 'lucide-react'
import { useCreatorStore } from '../../features/creators/model/creator-store'
import { date } from '../lib/format'
import { SUPPORT_EMAIL } from '../../features/home/model/home-content'
import { useFeatures } from '../model/features-store'
import { Banner, useToast } from './ledger'

/** How long before a granted plan ends the banner starts. */
const GRANT_WARNING_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Workspace banners shown above every shell page, in this order: unpaid, cancelling, payouts missing,
 * suspended. Everything about money (payment, cancelling, payouts) is left out while payments are off (closed beta). Everything comes from the creator already in the store — no requests of its own.
 */
export function WorkspaceBanners({ slug }: { slug: string }) {
  const toast = useToast()
  const { ready, paymentsOn } = useFeatures()
  // Fixed when the shell mounts: a banner that flips while someone reads it would only be noise.
  const [now] = useState(() => Date.now())
  const creator = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator : null))
  const checkoutStatus = useCreatorStore((s) => s.checkoutStatus)
  const startCreatorCheckout = useCreatorStore((s) => s.startCreatorCheckout)
  const openBillingPortal = useCreatorStore((s) => s.openBillingPortal)

  if (!creator) return null

  const openPortal = async () => {
    const failure = await openBillingPortal()
    if (failure) toast({ tone: 'danger', title: failure })
  }

  const status = creator.status.toLowerCase()
  // Closed beta: a plan the owner granted runs out on a date; say so for a week before it does.
  const grantEnds = creator.planGrant ? new Date(creator.planGrant.expiresAt).getTime() : null
  const grantEndsSoon = !paymentsOn && ready && grantEnds !== null && grantEnds > now && grantEnds - now <= GRANT_WARNING_MS
  const planName = creator.planName

  const completePayment = async () => {
    const checkout = await startCreatorCheckout()
    if (checkout?.checkoutUrl) {
      window.location.assign(checkout.checkoutUrl)
      return
    }
    const { checkoutError } = useCreatorStore.getState()
    toast({ tone: 'danger', title: 'Couldn’t start checkout', message: checkoutError ?? 'Please try again.' })
  }

  return (
    <>
      {grantEndsSoon && creator.planGrant && (
        <Banner
          tone="warning"
          icon={Sparkles}
          title={`Your beta access ends on ${date(creator.planGrant.expiresAt)} — ask us to extend it.`}
          action={SUPPORT_EMAIL ? { label: 'Write to us', variant: 'secondary', href: `mailto:${SUPPORT_EMAIL}` } : undefined}
        >
          After that your workspace moves to the Free plan and its limits.
        </Banner>
      )}
      {paymentsOn && status === 'pendingpayment' && (
        <Banner
          tone="warning"
          icon={CreditCard}
          title="Your workspace is waiting for payment."
          action={{
            label: 'Complete payment',
            variant: 'primary',
            loading: checkoutStatus === 'submitting',
            onClick: () => void completePayment(),
          }}
        >
          Publishing pages is paused until the {planName} subscription is paid.
        </Banner>
      )}
      {paymentsOn && creator.subscriptionStatus === 'PastDue' && (
        <Banner
          tone="danger"
          icon={CircleAlert}
          title="Your last payment didn’t go through."
          action={{ label: 'Update payment method', variant: 'secondary', onClick: () => void openPortal() }}
        >
          Update your payment method to keep the {planName} plan.
        </Banner>
      )}
      {paymentsOn && creator.cancelAtPeriodEnd && (
        <Banner
          tone="info"
          icon={CalendarClock}
          title={creator.currentPeriodEnd ? `Your ${planName} plan ends on ${date(creator.currentPeriodEnd)}.` : `Your ${planName} plan is set to end.`}
          action={{ label: 'Keep my plan', variant: 'secondary', onClick: () => void openPortal() }}
        >
          After that, your workspace moves to the Free plan and its limits.
        </Banner>
      )}
      {paymentsOn && !creator.payoutReady && (
        <Banner
          tone="accent"
          icon={Landmark}
          title="Payouts aren’t set up yet."
          action={{ label: 'Set up payouts', variant: 'secondary', to: `/app/${slug}/payouts` }}
        >
          Connect a Stripe account so your earnings can reach you.
        </Banner>
      )}
      {status === 'suspended' && (
        <Banner tone="danger" icon={ShieldAlert} title="Your workspace is suspended.">
          Your subscription may have lapsed.
        </Banner>
      )}
    </>
  )
}
