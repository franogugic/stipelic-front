import type { CreatorPlan } from '../../creators/model/types'

/** Active plans, cheapest first. */
export const activePlansByPrice = (plans: CreatorPlan[]) =>
  plans.filter((plan) => plan.status.toLowerCase() === 'active').sort((a, b) => a.priceCents - b.priceCents)
