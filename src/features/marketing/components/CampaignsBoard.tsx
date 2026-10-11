import { Mails, MailOpen, Send, Users } from 'lucide-react'
import { dateShort, number, percent } from '../../../shared/lib/format'
import { KpiCell, PointsBadge } from '../../../shared/ui/ledger'
import type { ContactStats } from '../model/types'
import type { EmailUsage } from '../model/campaign-store'
import { openRateOf } from '../model/campaign-groups'
import type { CampaignListItem } from '../model/types'

/** The 1st of next month (UTC calendar month): when the monthly allowance resets. */
function nextReset() {
  const now = new Date()
  return new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
}

/** The summary board above the email overview: sends used, open rate, campaigns sent, people you can reach. */
export function CampaignsBoard({
  sent,
  upcomingCount,
  usage,
  contacts,
}: {
  /** Sent campaigns, oldest first. */
  sent: CampaignListItem[]
  upcomingCount: number
  usage: EmailUsage | null
  contacts: ContactStats | null
}) {
  const delivered = sent.reduce((total, campaign) => total + campaign.sentCount, 0)
  const opened = sent.reduce((total, campaign) => total + campaign.uniqueOpenCount, 0)
  const average = delivered > 0 ? (opened / delivered) * 100 : null
  const lastSent = sent[sent.length - 1]
  const before = sent.slice(0, -1)
  const beforeDelivered = before.reduce((total, campaign) => total + campaign.sentCount, 0)
  const averageBefore =
    beforeDelivered > 0 ? (before.reduce((total, campaign) => total + campaign.uniqueOpenCount, 0) / beforeDelivered) * 100 : null

  const unlimited = usage !== null && usage.limit < 0
  const perMonth = new Map<string, number>()
  for (const campaign of sent) {
    const when = new Date(campaign.queuedAt ?? campaign.createdAt)
    const key = `${when.getFullYear()}-${when.getMonth()}`
    perMonth.set(key, (perMonth.get(key) ?? 0) + 1)
  }
  const now = new Date()
  const campaignsPerMonth = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1)
    return perMonth.get(`${month.getFullYear()}-${month.getMonth()}`) ?? 0
  })

  return (
    <section className="card board" aria-label="Email overview">
      <div className="board__kpis">
        <KpiCell
          label="Sent this month"
          icon={Send}
          value={
            usage ? (
              <>
                {number(usage.sent)}
                <small className="kpi__of"> / {unlimited ? 'Unlimited' : number(usage.limit)}</small>
              </>
            ) : (
              '—'
            )
          }
          meta={
            usage ? (
              <span>
                {unlimited ? 'Unlimited sending' : `${number(Math.max(0, usage.limit - usage.sent))} left`} · resets {dateShort(nextReset())}
              </span>
            ) : undefined
          }
          bar={usage && !unlimited && usage.limit > 0 ? { ratio: (usage.sent / usage.limit) * 100 } : undefined}
        />
        <KpiCell
          label="Average open rate"
          icon={MailOpen}
          value={average === null ? '—' : percent(average)}
          meta={
            lastSent ? (
              <>
                <PointsBadge value={openRateOf(lastSent)} average={averageBefore} />
                <span>last campaign {percent(openRateOf(lastSent))}</span>
              </>
            ) : (
              <span>After your first campaign</span>
            )
          }
          spark={sent.length > 1 ? { values: sent.map(openRateOf), label: 'Open rate per campaign' } : undefined}
        />
        <KpiCell
          label="Campaigns sent"
          icon={Mails}
          value={number(sent.length)}
          meta={<span>{upcomingCount > 0 ? `${upcomingCount} more on the way` : 'Nothing scheduled'}</span>}
          spark={{ values: campaignsPerMonth, label: 'Campaigns per month' }}
        />
        <KpiCell
          label="People you can reach"
          icon={Users}
          value={contacts ? number(contacts.active) : '—'}
          meta={contacts ? <span>+{number(contacts.newThisMonth)} joined this month</span> : undefined}
          spark={contacts && contacts.growth.length > 1 ? { values: contacts.growth.map((point) => point.total), label: 'Subscribers over time' } : undefined}
        />
      </div>
    </section>
  )
}

