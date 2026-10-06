import { date, number } from '../../../shared/lib/format'
import { Card, ErrorState, Meter, SkeletonBlock } from '../../../shared/ui/ledger'
import type { EmailUsage } from '../model/campaign-store'

/** The allowance is per calendar month (UTC); it resets on the 1st of the next one. */
function nextResetDate() {
  const now = new Date()
  return date(new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
}

/** "Monthly sending": emails sent this month against the plan's allowance. A negative limit means unlimited. */
export function EmailUsageCard({
  usage,
  status,
  onRetry,
}: {
  usage: EmailUsage | null
  status: 'idle' | 'loading' | 'success' | 'error'
  onRetry: () => void
}) {
  if (!usage) {
    return (
      <Card title="Monthly sending">
        {status === 'error' ? <ErrorState compact title="Couldn’t load your usage" onRetry={onRetry} /> : <SkeletonBlock />}
      </Card>
    )
  }

  const unlimited = usage.limit < 0
  const left = Math.max(0, usage.limit - usage.sent)
  const reset = nextResetDate()

  return (
    <Card title="Monthly sending">
      <div className="stack">
        <div className="metric metric--hero">
          <span className="metric__value">
            {number(usage.sent)}
            <small> / {unlimited ? 'Unlimited' : number(usage.limit)}</small>
          </span>
        </div>
        {!unlimited && <Meter label="Sent this month" used={usage.sent} limit={usage.limit} />}
        <p className="text-sm text-secondary">
          {unlimited ? `Resets on ${reset}` : `${number(left)} left · resets on ${reset}`}
        </p>
      </div>
    </Card>
  )
}
