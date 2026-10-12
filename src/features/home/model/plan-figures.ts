import { percent } from '../../../shared/lib/format'
import type { CreatorPlan } from '../../creators/model/types'

/** Active plans, cheapest first. */
export const activePlansByPrice = (plans: CreatorPlan[]) =>
  plans.filter((plan) => plan.status.toLowerCase() === 'active').sort((a, b) => a.priceCents - b.priceCents)

/**
 * The platform fee across the live plans: the highest fee (the cheapest plan) and the lowest (the dearest one).
 * `null` while the plans are not loaded.
 */
export function feeRange(plans: CreatorPlan[]) {
  const active = activePlansByPrice(plans)
  if (active.length === 0) return null
  const fees = active.map((plan) => plan.platformFeeBasisPoints)
  const highest = active[fees.indexOf(Math.max(...fees))]
  const lowest = active[fees.indexOf(Math.min(...fees))]
  return {
    from: percent(lowest.platformFeeBasisPoints / 100),
    sentence:
      highest === lowest
        ? `${percent(highest.platformFeeBasisPoints / 100)} on ${highest.name}`
        : `from ${percent(highest.platformFeeBasisPoints / 100)} on ${highest.name} down to ${percent(lowest.platformFeeBasisPoints / 100)} on ${lowest.name}`,
  }
}
