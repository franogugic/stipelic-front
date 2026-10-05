import { useEffect } from 'react'
import { percent } from '../../../../shared/lib/format'
import { Card } from '../../../../shared/ui/ledger'
import { useCreatorStore } from '../../model/creator-store'
import type { Creator } from '../../model/types'

/** The three-step explainer under the Stripe Connect states. */
export function HowItWorks({ creator }: { creator: Creator }) {
  const plans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)
  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  const plan = plans.find((candidate) => candidate.code === creator.planCode)
  const fee = plan ? `${percent(plan.platformFeeBasisPoints / 100)} platform fee on your ${creator.planName} plan.` : `Platform fee on your ${creator.planName} plan.`
  const steps: Array<[string, string, string]> = [
    ['1', 'A customer pays', 'Card payment through Stripe checkout.'],
    ['2', 'Fee is deducted', fee],
    ['3', 'Money reaches you', 'Stripe pays out to your bank automatically.'],
  ]

  return (
    <Card title="How it works">
      <div className="grid grid--3">
        {steps.map(([number, title, text]) => (
          <div className="stack stack--sm" key={number}>
            <span className="payout-step__num">0{number}</span>
            <strong>{title}</strong>
            <p className="text-secondary text-sm">{text}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
