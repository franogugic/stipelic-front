import { CreditCard, Info, RotateCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { StateArt } from '../../../shared/ui/StateArt'
import { Alert, Button, useToast } from '../../../shared/ui/ledger'
import { useHasSession } from '../../auth/model/use-has-session'
import { useCreatorStore } from '../model/creator-store'

type Action = 'checkout' | 'free' | null

/** Stripe's cancel URL: nothing was charged; pay again or keep the workspace on Free. */
export function PaymentCancelledPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const hasSession = useHasSession()
  const [running, setRunning] = useState<Action>(null)

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const startCreatorCheckout = useCreatorStore((s) => s.startCreatorCheckout)
  const continueOnFreePlan = useCreatorStore((s) => s.continueOnFreePlan)

  useDocumentTitle('Payment not completed · Luma')

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  // Nothing until we know the workspace, so an active one never sees this page flash.
  if (currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading') return null
  if (!currentCreator) return <Navigate to="/" replace />
  // While an action runs the workspace may already have changed; leave the redirect to the action.
  if (running === null && currentCreator.status.toLowerCase() !== 'pendingpayment') {
    return <Navigate to={`/app/${currentCreator.slug}`} replace />
  }

  const tryPaymentAgain = async () => {
    setRunning('checkout')
    const checkout = await startCreatorCheckout()
    if (checkout?.checkoutUrl) {
      window.location.assign(checkout.checkoutUrl)
      return
    }
    setRunning(null)
    toast({
      tone: 'danger',
      title: useCreatorStore.getState().checkoutError ?? 'We could not start checkout. Please try again.',
    })
  }

  const continueOnFree = async () => {
    setRunning('free')
    const result = await continueOnFreePlan()

    if (result.outcome === 'free') {
      toast({ tone: 'success', title: 'You’re on the Free plan' })
      navigate(`/app/${result.creator.slug}`, { replace: true })
      return
    }
    if (result.outcome === 'paid') {
      // The payment went through after all; the success page waits for the activation.
      navigate('/payment/success', { replace: true })
      return
    }
    if (result.outcome === 'not-pending') {
      const creator = await loadCurrentCreator()
      navigate(creator ? `/app/${creator.slug}` : '/', { replace: true })
      return
    }

    setRunning(null)
    toast({ tone: 'danger', title: result.message })
  }

  return (
    <SoloLayout user={hasSession}>
      <StateArt icon={CreditCard} badge={X} tone="state--error" />
      <h1 className="solo__title">Payment not <em>completed</em></h1>
      <p className="solo__text">
        Nothing was charged. Your workspace is saved — finish the payment whenever you’re ready, or continue on the Free
        plan for now.
      </p>
      <Alert tone="info" icon={Info} className="solo__card">
        Until the {currentCreator.planName} plan is paid, publishing pages is paused.
      </Alert>
      <div className="cluster cluster--center">
        <Button
          variant="primary"
          icon={RotateCw}
          loading={running === 'checkout'}
          disabled={running !== null}
          onClick={() => void tryPaymentAgain()}
        >
          Try payment again
        </Button>
        <Button
          variant="secondary"
          loading={running === 'free'}
          disabled={running !== null}
          onClick={() => void continueOnFree()}
        >
          Continue on Free
        </Button>
      </div>
    </SoloLayout>
  )
}
