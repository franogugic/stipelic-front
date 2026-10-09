import { Check } from 'lucide-react'
import { useEffect } from 'react'
import { useCreatorStore } from '../../creators/model/creator-store'
import type { CreatorPlan } from '../../creators/model/types'
import { money, number, percent } from '../../../shared/lib/format'
import { Badge, Button, ErrorState, SkeletonCards } from '../../../shared/ui/ledger'
import { activePlansByPrice } from '../model/plan-figures'
import { useScrollReveal } from '../model/use-page-chrome'

const RECOMMENDED_PLAN_CODE = 'pro'

/** "12 landing pages", "1 product", "Unlimited emails / month". A missing or negative limit means unlimited. */
function limitText(plan: CreatorPlan, key: string, singular: string, pluralForm: string) {
  const value = plan.limits[key]
  if (value === undefined || value < 0) return `Unlimited ${pluralForm}`
  return `${number(value)} ${value === 1 ? singular : pluralForm}`
}

function perks(plan: CreatorPlan) {
  const emails = plan.limits['max_email_sends_per_month']
  const contacts = plan.limits['max_contacts']
  return [
    limitText(plan, 'max_landing_pages', 'landing page', 'landing pages'),
    limitText(plan, 'max_products', 'product', 'products'),
    `${emails === undefined || emails < 0 ? 'Unlimited' : number(emails)} emails / month`,
    `${contacts === undefined || contacts < 0 ? 'Unlimited' : number(contacts)} contacts`,
  ]
}

function PlanCard({ plan }: { plan: CreatorPlan }) {
  const recommended = plan.code === RECOMMENDED_PLAN_CODE
  const paid = plan.priceCents > 0
  const fee = plan.platformFeeBasisPoints / 100
  return (
    <article className={['mk-plan', recommended && 'mk-plan--featured'].filter(Boolean).join(' ')} data-reveal>
      <div className="cluster cluster--between">
        <h3 className="mk-plan__name">{plan.name}</h3>
        {recommended && <Badge tone="solid-accent">Most popular</Badge>}
      </div>
      <p className="mk-plan__price">
        {money(plan.priceCents, plan.currency, { decimals: plan.priceCents % 100 !== 0 })}
        <span>/ {plan.billingInterval === 'Yearly' ? 'year' : 'month'}</span>
      </p>
      <p className="mk-plan__fee">
        <strong>{percent(fee)}</strong> fee per sale · you keep {percent(100 - fee)}
      </p>
      <ul className="mk-plan__perks" role="list">
        {perks(plan).map((perk) => (
          <li key={perk}>
            <Check />
            {perk}
          </li>
        ))}
      </ul>
      <Button to="/register" variant={recommended ? 'accent' : 'secondary'} block>
        {paid ? `Choose ${plan.name}` : 'Start free'}
      </Button>
    </article>
  )
}

/** The pricing cards, from the live plans API (`GET /api/creator-plans`, anonymous). */
export function PricingPlans() {
  const plans = useCreatorStore((state) => state.creatorPlans)
  const status = useCreatorStore((state) => state.creatorPlansStatus)
  const loadCreatorPlans = useCreatorStore((state) => state.loadCreatorPlans)

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  // The cards arrive after the first render, so they are observed once the plans are in.
  useScrollReveal(status)

  const activePlans = activePlansByPrice(plans)

  if (status === 'error' || (status === 'success' && activePlans.length === 0)) {
    return (
      <ErrorState
        compact
        title="Pricing is unavailable"
        text="We couldn’t load the plans. Check your connection and try again."
        onRetry={() => void loadCreatorPlans()}
      />
    )
  }

  if (status !== 'success') return <SkeletonCards count={4} />

  return (
    <div className="mk-pricing">
      {activePlans.map((plan) => (
        <PlanCard key={plan.code} plan={plan} />
      ))}
    </div>
  )
}
