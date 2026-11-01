import { number, plural } from '../../../shared/lib/format'
import type { AudiencePreview } from './types'

/** "about 3 minutes": the sending time the API estimates, in the units a person thinks in. */
export function estimateDuration(seconds: number): string {
  if (seconds < 60) return 'under a minute'
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 90) return `about ${plural(minutes, 'minute')}`
  return `about ${plural(Math.round(minutes / 60), 'hour')}`
}

/**
 * The line under the confirmation: "N recipients · M skipped (bounced or complained) · about X minutes".
 * A part the API did not send (null) is left out; with nothing to say there is no line.
 */
export function sendingEstimateLine(preview: AudiencePreview | null): string | null {
  if (!preview) return null
  const { suppressedCount, estimatedSeconds } = preview
  if (suppressedCount == null && estimatedSeconds == null) return null
  const parts = [plural(preview.recipientCount, 'recipient')]
  if (suppressedCount != null && suppressedCount > 0) parts.push(`${number(suppressedCount)} skipped (bounced or complained)`)
  if (estimatedSeconds != null) parts.push(estimateDuration(estimatedSeconds))
  return parts.join(' · ')
}

/** How many recipients fall after the daily quota (they send once it resets); null when everyone fits or the quota is unknown. */
export function overDailyQuota(preview: AudiencePreview | null): number | null {
  if (!preview || preview.quotaRemainingToday == null) return null
  const over = preview.recipientCount - Math.max(0, preview.quotaRemainingToday)
  return over > 0 ? over : null
}
