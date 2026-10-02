import { ArrowRight, Check, CreditCard, PartyPopper, Plus } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { date, money, percent } from '../../../shared/lib/format'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { StateArt } from '../../../shared/ui/StateArt'
import { Button, Card, CardBody, KeyValue } from '../../../shared/ui/ledger'
import { SoloChecking, SoloRequestFailed } from '../../auth/components/SoloStates'
import { useAuthStore } from '../../auth/model/auth-store'
import { useHasSession } from '../../auth/model/use-has-session'
import { useCreatorStore } from '../model/creator-store'
import type { Creator, CreatorPlan } from '../model/types'

/** Stripe's success URL: waits for the subscription webhook to activate the workspace, then celebrates. */
export function PaymentSuccessPage() {
  const hasStartedPolling = useRef(false)
  const [retrying, setRetrying] = useState(false)

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const pollActivationStatus = useCreatorStore((s) => s.pollActivationStatus)
  const pollCreatorActivation = useCreatorStore((s) => s.pollCreatorActivation)
  const resetPollActivation = useCreatorStore((s) => s.resetPollActivation)

  useDocumentTitle('Payment received · Luma')

  useEffect(() => {
    if (hasStartedPolling.current) return
    hasStartedPolling.current = true
    resetPollActivation()
    void pollCreatorActivation()
  }, [pollCreatorActivation, resetPollActivation])

  // While a retry polls, the failed screen stays up (with a busy button) instead of the checking screen.
  const retry = async () => {
    setRetrying(true)
    await pollCreatorActivation()
    setRetrying(false)
  }

  if (pollActivationStatus === 'activated' && currentCreator) return <Activated creator={currentCreator} />

  if (retrying || pollActivationStatus === 'timeout') {
    return (
      <SoloRequestFailed
        text="We received your payment but couldn’t confirm your workspace yet. This can take a minute."
        retrying={retrying}
        onRetry={() => void retry()}
        secondaryAction={
          <Button variant="secondary" to={currentCreator ? `/app/${currentCreator.slug}` : '/'}>
            Go to dashboard
          </Button>
        }
      />
    )
  }

  return <SoloChecking icon={CreditCard} label="Confirming your payment…" />
}

function Activated({ creator }: { creator: Creator }) {
  const firstName = useAuthStore((s) => s.currentUser?.firstName)
  const hasSession = useHasSession()
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  const plan = creatorPlans.find((candidate) => candidate.code === creator.planCode)

  return (
    <SoloLayout user={hasSession}>
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ '--i': i } as CSSProperties} />
        ))}
      </div>
      <StateArt icon={PartyPopper} badge={Check} />
      <h1 className="solo__title">
        You’re all set, <em>{firstName}.</em>
      </h1>
      <p className="solo__text">
        Payment received. Your <strong>{creator.planName}</strong> plan is active and <strong>{creator.name}</strong> is
        ready to publish.
      </p>
      <Card as="div" className="solo__card">
        <CardBody>
          <KeyValue
            items={[
              { term: 'Plan', description: planLabel(creator.planName, plan) },
              { term: 'Fee per sale', description: plan ? percent(plan.platformFeeBasisPoints / 100) : '—' },
              { term: 'Next payment', description: creator.currentPeriodEnd ? date(creator.currentPeriodEnd) : '—' },
              { term: 'Your address', description: `${window.location.host}/p/${creator.slug}`, mono: true },
            ]}
          />
        </CardBody>
      </Card>
      <div className="cluster cluster--center">
        <Button variant="accent" icon={ArrowRight} to={`/app/${creator.slug}`}>
          Go to dashboard
        </Button>
        <Button variant="secondary" icon={Plus} to={`/app/${creator.slug}/landing-pages`}>
          Create your first page
        </Button>
      </div>
    </SoloLayout>
  )
}

/** "Pro · €30 / month"; just the name until the plans have loaded. */
function planLabel(planName: string, plan: CreatorPlan | undefined) {
  if (!plan || plan.priceCents <= 0) return planName
  const interval = /year|annual/i.test(plan.billingInterval) ? 'year' : 'month'
  const price = money(plan.priceCents, plan.currency, { decimals: plan.priceCents % 100 !== 0 })
  return `${planName} · ${price} / ${interval}`
}
