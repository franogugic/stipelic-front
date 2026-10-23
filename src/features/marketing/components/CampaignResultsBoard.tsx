import { MailCheck, MailOpen, MailX, MousePointerClick, Users } from 'lucide-react'
import { number, percent, plural } from '../../../shared/lib/format'
import { KpiCell, PointsBadge, campaignStatusKey } from '../../../shared/ui/ledger'
import type { CSSProperties } from 'react'
import { clickInfoOfDetail, clickInfoOfItem } from '../model/clicks'
import type { CampaignDetail, CampaignListItem } from '../model/types'

const share = (count: number, of: number) => (of > 0 ? (count / of) * 100 : 0)

/**
 * "Campaign results": recipients → delivered → opened, with failures, each compared with the average of your other
 * sent campaigns, and a delivery bar underneath. Computed client-side from the campaigns list.
 */
export function CampaignResultsBoard({
  campaign,
  audience,
  recipients,
  others,
}: {
  campaign: CampaignDetail
  audience: string
  /** The recipients to show: the campaign's own, or the audience's size right now for a scheduled one (null: unknown). */
  recipients: number | null
  /** Your other sent campaigns (this one excluded). */
  others: CampaignListItem[]
}) {
  const isResend = Boolean(campaign.sourceCampaignPublicId)
  const statusKey = campaignStatusKey(campaign)
  const done = statusKey === 'sent' || statusKey === 'sending' || statusKey === 'failed'
  const total = campaign.recipientCount
  const delivered = campaign.sentCount
  const failed = campaign.failedCount
  const opens = campaign.uniqueOpenCount
  const pending = Math.max(total - delivered - failed, 0)

  const comparable = others.filter((other) => other.recipientCount > 0)
  const average = (of: (other: CampaignListItem) => number) =>
    comparable.length > 0 ? comparable.reduce((sum, other) => sum + of(other), 0) / comparable.length : null
  const averageDelivery = average((other) => share(other.sentCount, other.recipientCount))
  const averageOpen = average((other) => share(other.uniqueOpenCount, other.sentCount))
  const averageFailed = average((other) => share(other.failedCount, other.recipientCount))
  // Resends go only to people who hadn't opened, so they stay out of every average; so do campaigns sent before click
  // tracking and emails without links.
  const clickRates = others.flatMap((other) => {
    const info = clickInfoOfItem(other)
    return !other.sourceCampaignPublicId && info.kind === 'tracked' ? [info.rate] : []
  })
  const averageClick = clickRates.length > 0 ? clickRates.reduce((sum, rate) => sum + rate, 0) / clickRates.length : null
  const sending = statusKey === 'sending'
  const click = clickInfoOfDetail(campaign)
  const compare = (badge: React.ReactNode, averageValue: number | null) => {
    // While it is still going out, a comparison with finished campaigns would only look bad.
    if (sending) return <span>So far — still sending</span>
    return averageValue === null ? null : (
      <>
        {badge}
        <span>vs your average {percent(averageValue)}</span>
      </>
    )
  }
  const notYet = <span>After it’s sent</span>

  return (
    <section className="card board" aria-label="Campaign results">
      <div className="board__kpis board__kpis--5">
        <KpiCell
          label="Recipients"
          icon={Users}
          value={recipients === null ? '—' : number(recipients)}
          meta={<span>{audience}</span>}
        />
        <KpiCell
          label="Delivered"
          icon={MailCheck}
          value={done ? number(delivered) : '—'}
          meta={done ? compare(<PointsBadge value={share(delivered, total)} average={averageDelivery} />, averageDelivery) : notYet}
          bar={done ? { ratio: share(delivered, total), tone: 'success' } : undefined}
        />
        <KpiCell
          label="Open rate"
          icon={MailOpen}
          value={done && delivered > 0 ? percent(share(opens, delivered)) : '—'}
          meta={
            done && delivered > 0
              ? isResend
                ? // A resend only goes to people who hadn't opened: comparing it with the averages would only look bad.
                  <span>{plural(opens, 'more person', 'more people')} reached for the original</span>
                : compare(<PointsBadge value={share(opens, delivered)} average={averageOpen} />, averageOpen)
              : notYet
          }
          bar={done && delivered > 0 ? { ratio: share(opens, delivered), tone: 'accent' } : undefined}
        />
        <KpiCell
          label="Click rate"
          icon={MousePointerClick}
          value={done && delivered > 0 && click.kind === 'tracked' ? percent(click.rate) : '—'}
          meta={
            !done || delivered === 0 ? (
              notYet
            ) : click.kind === 'untracked' ? (
              <span>Click tracking wasn’t on when it was sent</span>
            ) : click.kind === 'nolinks' ? (
              <span>No links in this email</span>
            ) : isResend ? (
              <span>{plural(campaign.clicks.uniqueClickers, 'person', 'people')} clicked</span>
            ) : (
              compare(<PointsBadge value={click.rate} average={averageClick} />, averageClick)
            )
          }
          bar={done && delivered > 0 && click.kind === 'tracked' ? { ratio: click.rate, tone: 'ink' } : undefined}
        />
        <KpiCell
          label="Failed"
          icon={MailX}
          value={done ? number(failed) : '—'}
          meta={
            done ? compare(<PointsBadge value={share(failed, total)} average={averageFailed} lowerIsBetter />, averageFailed) : notYet
          }
          bar={done ? { ratio: share(failed, total), tone: 'danger' } : undefined}
        />
      </div>
      {done && (
        <div className="board__foot">
          <div className="stackbar">
            <div
              className="stackbar__track"
              role="img"
              aria-label={`${delivered} delivered, ${opens} opened, ${failed} failed, ${pending} still sending`}
            >
              <span className="stackbar__seg stackbar__seg--success" style={{ '--w': `${share(delivered, total).toFixed(1)}%` } as CSSProperties} />
              <span className="stackbar__seg stackbar__seg--danger" style={{ '--w': `${share(failed, total).toFixed(1)}%` } as CSSProperties} />
              <span className="stackbar__seg stackbar__seg--pending" style={{ '--w': `${share(pending, total).toFixed(1)}%` } as CSSProperties} />
            </div>
            <ul className="stackbar__legend" role="list">
              <li>
                <span className="stackbar__key stackbar__key--success" />
                Delivered <strong>{number(delivered)}</strong>
              </li>
              <li>
                <span className="stackbar__key stackbar__key--danger" />
                Failed <strong>{number(failed)}</strong>
              </li>
              {pending > 0 && (
                <li>
                  <span className="stackbar__key stackbar__key--pending" />
                  Still sending <strong>{number(pending)}</strong>
                </li>
              )}
              <li className="stackbar__total">
                {plural(opens, 'person', 'people')} opened it{click.kind === 'tracked' ? ` · ${number(campaign.clicks.uniqueClickers)} clicked` : ''}
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
