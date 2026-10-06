import { CalendarClock, CircleAlert, CreditCard, Landmark, ShieldAlert } from 'lucide-react'
import { useCreatorStore } from '../../features/creators/model/creator-store'
import { date } from '../lib/format'
import { Banner, useToast } from './ledger'

/**
 * Workspace banners shown above every shell page, in this order: unpaid, cancelling, payouts missing,
 * suspended. Everything comes from the creator already in the store — no requests of its own.
 */
export function WorkspaceBanners({ slug }: { slug: string }) {
  const toast = useToast()
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
      {status === 'pendingpayment' && (
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
      {creator.subscriptionStatus === 'PastDue' && (
        <Banner
          tone="danger"
          icon={CircleAlert}
          title="Your last payment didn’t go through."
          action={{ label: 'Update payment method', variant: 'secondary', onClick: () => void openPortal() }}
        >
          Update your payment method to keep the {planName} plan.
        </Banner>
      )}
      {creator.cancelAtPeriodEnd && (
        <Banner
          tone="info"
          icon={CalendarClock}
          title={creator.currentPeriodEnd ? `Your ${planName} plan ends on ${date(creator.currentPeriodEnd)}.` : `Your ${planName} plan is set to end.`}
          action={{ label: 'Keep my plan', variant: 'secondary', onClick: () => void openPortal() }}
        >
          After that, your workspace moves to the Free plan and its limits.
        </Banner>
      )}
      {!creator.payoutReady && (
        <Banner
          tone="accent"
          icon={Landmark}
          title="Payouts aren’t set up yet."
          action={{ label: 'Set up payouts', variant: 'secondary', to: `/app/${slug}/payouts` }}
        >
          {creator.payoutMode === 'BankTransfer'
            ? 'Add your bank details so you can request payouts of your earnings.'
            : 'Connect a Stripe account so your earnings can reach you.'}
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
