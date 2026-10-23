import { CalendarClock, CalendarX, CheckCheck, CircleCheck, Clock, Info, Send } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { date, dateTime, number, percent, plural } from '../../../shared/lib/format'
import { Button, StatusBadge } from '../../../shared/ui/ledger'
import { ESTIMATED_OPENS, nextResendRound, resendStateOf } from '../model/resend'
import type { CampaignDetail, NonOpenerResend } from '../model/types'

/** The icon and sentence for why a resend is not possible right now (the code comes from the server). */
function whyNot(state: NonOpenerResend): [LucideIcon, string] | null {
  switch (state.reason) {
    case 'TOO_EARLY':
      return [Clock, `Available from ${state.eligibleFrom ? dateTime(state.eligibleFrom) : '24 hours after the last send'} — 24 hours after the last send.`]
    case 'RESEND_PENDING': {
      const scheduled = state.resends.find((resend) => resend.status === 'Scheduled')
      return [
        CalendarClock,
        scheduled
          ? `Resend ${scheduled.round} goes out on ${scheduled.scheduledAt ? dateTime(scheduled.scheduledAt) : 'its scheduled time'}. The next one can be planned once it has been sent.`
          : 'A resend is already scheduled. The next one can be planned once it has been sent.',
      ]
    }
    case 'TOO_LATE': {
      const until = state.eligibleUntil
      return [
        CalendarX,
        until && new Date(until).getTime() > Date.now()
          ? `The next resend could only go out after the resend window ends on ${date(until)}. Resends are possible for 30 days after sending.`
          : `The resend window closed${until ? ` on ${date(until)}` : ''}. Resends are possible for 30 days after sending.`,
      ]
    }
    case 'NO_RECIPIENTS':
      return [CircleCheck, 'Everyone who got it has opened it or unsubscribed — there’s no one left to resend to.']
    default:
      return null
  }
}

function Reason({ reason: [Icon, text] }: { reason: [LucideIcon, string] }) {
  return (
    <span className="resend__reason">
      <Icon />
      <span>{text}</span>
    </span>
  )
}

const rateOf = (opened: number, delivered: number) => (delivered > 0 ? (opened / delivered) * 100 : 0)

/** "x of 5 used": a row of small pills, one lit per resend. */
export function Pips({ used, max, label }: { used: number; max: number; label: string }) {
  return (
    <span className="pips" role="img" aria-label={label}>
      {Array.from({ length: max }, (_, index) => (
        <span className={`pips__pip${index < used ? ' is-on' : ''}`} key={index} />
      ))}
    </span>
  )
}

/**
 * "Resend to people who didn't open" on a sent original: how many of the five resends are used, how many people the next
 * one would reach and whether it is possible, with the history of every send. The state comes from the API.
 */
export function ResendCard({ slug, campaign }: { slug: string; campaign: CampaignDetail }) {
  const state = resendStateOf(campaign)
  if (!state) return null

  const resends = [...state.resends].sort((a, b) => a.round - b.round)
  // The server counts each person once, across the original and every sent resend.
  const reach = state.openedAnyCount
  const thanksToResends = state.openedThroughResendsCount
  const maxed = state.reason === 'LIMIT_REACHED'
  const reason = whyNot(state)
  const people = plural(state.recipientCount, 'person', 'people')
  const href = `/app/${slug}/emails/new?mode=resend&of=${campaign.publicId}`
  const rows = [
    {
      key: campaign.publicId,
      label: 'Original',
      to: null as string | null,
      subject: campaign.subject,
      status: campaign.status,
      queuedAt: campaign.queuedAt,
      scheduledAt: null as string | null,
      recipients: campaign.recipientCount,
      delivered: campaign.sentCount,
      opened: campaign.uniqueOpenCount,
      original: true,
    },
    ...resends.map((resend) => ({
      key: resend.publicId,
      label: `Resend ${resend.round}`,
      to: `/app/${slug}/emails/campaigns/${resend.publicId}`,
      subject: resend.subject,
      status: resend.status,
      queuedAt: resend.queuedAt,
      scheduledAt: resend.scheduledAt,
      recipients: resend.recipientCount,
      delivered: resend.deliveredCount,
      opened: resend.uniqueOpenCount,
      original: false,
    })),
  ]

  return (
    <section className="card resend" aria-labelledby="resend-title">
      <div className="card__header">
        <div className="card__heading">
          <h2 className="card__title" id="resend-title">
            Resend to people who didn’t open
          </h2>
          <p className="card__subtitle">
            Send it again to whoever hasn’t opened it yet — up to {state.limit} times, within 30 days of sending.
          </p>
        </div>
        <span className="resend__used">
          <Pips used={state.used} max={state.limit} label={`${state.used} of ${state.limit} resends used`} />
          <span>
            {state.used} of {state.limit} used
          </span>
        </span>
      </div>
      <div className="card__body stack">
        {maxed ? (
          <p className="resend__note">
            <CheckCheck />
            <span>All {state.limit} resends used. How each one did stays below.</span>
          </p>
        ) : (
          <div className="resend__cta">
            <div className="resend__count">
              <span className="resend__number">{number(state.recipientCount)}</span>
              <span className="text-secondary">
                {state.recipientCount === 1 ? 'person hasn’t' : 'people haven’t'} opened it{state.used > 0 ? ' or a resend' : ''}
              </span>
            </div>
            <div className="resend__action">
              {state.eligible ? (
                <>
                  <Button variant="primary" icon={Send} to={href}>
                    Resend to {people}
                  </Button>
                  <span className="text-xs text-muted">
                    Resend {nextResendRound(state)} of {state.limit}
                    {state.eligibleUntil ? ` · possible until ${dateTime(state.eligibleUntil)}` : ''}
                  </span>
                </>
              ) : state.reason === 'NO_RECIPIENTS' ? (
                reason && <Reason reason={reason} />
              ) : (
                <>
                  <Button variant="primary" icon={Send} disabledReason={reason?.[1] ?? 'A resend is not possible right now.'}>
                    Resend to {people}
                  </Button>
                  {reason && <Reason reason={reason} />}
                </>
              )}
            </div>
          </div>
        )}
        <p className="resend__hint">
          <Info />
          <span>{ESTIMATED_OPENS}</span>
        </p>
      </div>
      <div className="card__body card__body--flush">
        <div className="table-wrap">
          <table className="table table--stack resend__history">
            <thead>
              <tr>
                <th scope="col">Send</th>
                <th scope="col">Subject</th>
                <th scope="col">Date</th>
                <th scope="col" className="is-num">
                  Recipients
                </th>
                <th scope="col">Opened</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rate = rateOf(row.opened, row.delivered)
                return (
                  <tr key={row.key} className={row.original ? 'is-original' : undefined}>
                    <td className="is-lead">
                      <span className="resend__round">{row.label}</span>
                    </td>
                    <td data-label="Subject">
                      {row.to ? (
                        <Link className="table__primary" to={row.to}>
                          {row.subject}
                        </Link>
                      ) : (
                        <span className="table__primary">{row.subject}</span>
                      )}
                    </td>
                    <td data-label="Date" className="num">
                      {row.status === 'Scheduled' ? (
                        <StatusBadge kind="campaign" value="scheduled" label={row.scheduledAt ? dateTime(row.scheduledAt) : undefined} />
                      ) : row.status === 'Cancelled' ? (
                        <StatusBadge kind="campaign" value="cancelled" />
                      ) : row.queuedAt ? (
                        date(row.queuedAt)
                      ) : (
                        '—'
                      )}
                    </td>
                    <td data-label="Recipients" className="is-num">
                      {/* A scheduled resend has no recipients yet: they are worked out when it goes out. */}
                      {row.status === 'Scheduled' || row.status === 'Cancelled' ? <span className="text-muted">—</span> : number(row.recipients)}
                    </td>
                    <td data-label="Opened">
                      {row.status === 'Scheduled' || row.status === 'Cancelled' ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <span className="rate-cell">
                          <span className="rate-cell__bar" aria-hidden="true">
                            <span style={{ '--w': `${rate.toFixed(1)}%` } as CSSProperties} />
                          </span>
                          <span className="num">
                            {number(row.opened)} · {percent(rate)}
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="resend__total">
          {number(reach)} of {number(campaign.sentCount)} people have opened at least one send
          {resends.some((resend) => resend.status === 'Queued') && (
            <>
              {' '}
              — <strong>{number(thanksToResends)}</strong> of them thanks to resends
            </>
          )}
          .
        </p>
      </div>
    </section>
  )
}

