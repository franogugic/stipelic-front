import { ArrowUpRight, BadgeCheck, Check, ExternalLink, Hourglass, Landmark } from 'lucide-react'
import { useEffect, useState } from 'react'
import { date } from '../../../../shared/lib/format'
import { Button, Card, ErrorState, PageHeader, StatusBadge, useToast, connectStatusKey } from '../../../../shared/ui/ledger'
import { ApiError } from '../../../../shared/api/http-client'
import { createConnectDashboardLink, getConnectPayoutDetails } from '../../api/payouts-api'
import { usePayoutStore } from '../../model/payout-store'
import type { ConnectPayoutDetails, Creator, PayoutSchedule } from '../../model/types'
import { HowItWorks } from './HowItWorks'

const WEEKDAYS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

/** "Daily · 2 business days", "Weekly on Friday · 7 business days", … */
function scheduleText(schedule: PayoutSchedule | null) {
  if (!schedule) return '—'
  const delay = schedule.delayDays > 0 ? ` · ${schedule.delayDays} business day${schedule.delayDays === 1 ? '' : 's'}` : ''
  switch (schedule.interval) {
    case 'daily':
      return `Daily${delay}`
    case 'weekly':
      return `Weekly${schedule.weeklyAnchor ? ` on ${WEEKDAYS[schedule.weeklyAnchor.toLowerCase()] ?? schedule.weeklyAnchor}` : ''}${delay}`
    case 'monthly':
      return `Monthly${schedule.monthlyAnchor ? ` on day ${schedule.monthlyAnchor}` : ''}${delay}`
    case 'manual':
      return 'Manual payouts'
    default:
      return schedule.interval
  }
}

/** Payouts for a Stripe Connect workspace: not connected, in review, or enabled. */
export function ConnectPayouts({ slug, creator }: { slug: string; creator: Creator }) {
  const toast = useToast()
  const startOnboarding = usePayoutStore((s) => s.startConnectOnboardingLink)
  const [details, setDetails] = useState<ConnectPayoutDetails | null>(null)
  const [detailsFailed, setDetailsFailed] = useState(false)
  const [starting, setStarting] = useState(false)
  const [openingDashboard, setOpeningDashboard] = useState(false)
  const status = connectStatusKey({
    payoutsEnabled: creator.stripeConnectPayoutsEnabled,
    detailsSubmitted: creator.stripeConnectDetailsSubmitted,
  })

  useEffect(() => {
    // Nothing to read until Stripe has an account for this workspace.
    if (status === 'not_started') return
    let active = true
    getConnectPayoutDetails(slug)
      .then((data) => active && setDetails(data))
      .catch(() => active && setDetailsFailed(true))
    return () => {
      active = false
    }
  }, [slug, status])

  const beginOnboarding = async () => {
    setStarting(true)
    const url = await startOnboarding()
    if (url) {
      window.location.href = url
      return
    }
    setStarting(false)
    toast({
      tone: 'danger',
      title: usePayoutStore.getState().connectOnboardingError ?? 'We could not start Stripe onboarding. Please try again.',
    })
  }

  /** The tab opens synchronously on the click (popup blockers allow that) and is pointed at the link once it exists. */
  const openDashboard = async () => {
    if (openingDashboard) return
    const tab = window.open('', '_blank')
    setOpeningDashboard(true)
    try {
      const { url } = await createConnectDashboardLink()
      if (tab) {
        tab.opener = null
        tab.location.href = url
      } else {
        window.location.href = url
      }
    } catch (caught) {
      tab?.close()
      toast({
        tone: 'danger',
        title: caught instanceof ApiError ? caught.message : 'We could not open your Stripe dashboard. Please try again.',
      })
    } finally {
      setOpeningDashboard(false)
    }
  }

  if (status === 'not_started') {
    return (
      <>
        <PageHeader title={<em>Payouts</em>} subtitle="Connect Stripe so your earnings reach your bank account." />
        <div className="grid grid--2 grid--gap-lg reveal">
          <article className="card card--feature">
            <div className="card__body stack stack--lg">
              <span className="metric__label">
                <Landmark />
                Stripe account
              </span>
              <p className="display payout-hero__title">
                Connect Stripe to <em>get paid.</em>
              </p>
              <div className="cluster">
                <StatusBadge kind="connect" value="not_started" />
              </div>
              <p className="text-muted">
                Stripe asks for your ID and bank details — it takes about five minutes, and you come straight back here
                when you’re done.
              </p>
              <div>
                <Button variant="accent" icon={ArrowUpRight} loading={starting} onClick={() => void beginOnboarding()}>
                  Start Stripe onboarding
                </Button>
              </div>
            </div>
          </article>
          <Card title="What you’ll need" subtitle="Stripe checks this to keep payments safe">
            <div className="stack stack--sm">
              {[
                'A photo ID — passport or ID card',
                'A bank account (IBAN) in your name',
                'Your home address and date of birth',
                'About five minutes',
              ].map((item) => (
                <div className="checklist__item" key={item}>
                  <span className="checklist__dot" />
                  <span className="list__grow">{item}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="span-full">
            <HowItWorks creator={creator} />
          </div>
        </div>
      </>
    )
  }

  const accountId = details?.accountId ?? null
  const detailsLabel = (value: string | null | undefined) => (value ? date(value) : '—')

  if (status === 'details_submitted') {
    return (
      <>
        <PageHeader
          title={<em>Payouts</em>}
          subtitle="Stripe is checking your details."
          actions={
            <Button variant="secondary" icon={ArrowUpRight} loading={starting} onClick={() => void beginOnboarding()}>
              Continue on Stripe
            </Button>
          }
        />
        <div className="grid grid--2 grid--gap-lg reveal">
          <article className="card card--feature">
            <div className="card__body stack stack--lg">
              <span className="metric__label">
                <Hourglass />
                Stripe account
              </span>
              <p className="display payout-hero__title">
                Stripe is <em>reviewing</em> your details.
              </p>
              <div className="cluster">
                <StatusBadge kind="connect" value="details_submitted" />
                {accountId && <span className="mono text-sm">{accountId}</span>}
              </div>
              <p className="text-muted">
                This usually takes one or two business days. You can keep selling — your earnings wait safely in Stripe
                until payouts are switched on.
              </p>
            </div>
          </article>
          <Card title="Connection">
            <div className="stack">
              <div className="checklist__item checklist__item--done">
                <span className="checklist__dot">
                  <Check />
                </span>
                <span className="list__grow">Details submitted</span>
                <span className="text-sm text-muted">{detailsLabel(details?.detailsSubmittedAt)}</span>
              </div>
              <div className="checklist__item checklist__item--waiting">
                <span className="checklist__dot">
                  <Hourglass />
                </span>
                <span className="list__grow">Payouts enabled</span>
                <span className="text-sm text-muted">Waiting for Stripe</span>
              </div>
              <p className="text-sm text-secondary">
                If Stripe needs anything else, we’ll email you and show it here. You can also check on Stripe.
              </p>
            </div>
          </Card>
          <div className="span-full">
            <HowItWorks creator={creator} />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={<em>Payouts</em>}
        subtitle="Your earnings go straight to your Stripe account."
        actions={
          <Button variant="primary" icon={ExternalLink} loading={openingDashboard} onClick={() => void openDashboard()}>
            Open Stripe dashboard
          </Button>
        }
      />
      {detailsFailed && <ErrorState compact title="Couldn’t load the Stripe details" text="Showing what we have. Try again later." />}
      <div className="grid grid--2 grid--gap-lg reveal">
        <article className="card card--feature">
          <div className="card__body stack stack--lg">
            <span className="metric__label">
              <BadgeCheck />
              Stripe account
            </span>
            <p className="display payout-hero__title">
              Payouts are <em>on.</em>
            </p>
            <div className="cluster">
              <StatusBadge kind="connect" value="enabled" />
              {accountId && <span className="mono text-sm">{accountId}</span>}
            </div>
            <p className="text-muted">Schedule: {scheduleText(details?.payoutSchedule ?? null)}</p>
          </div>
        </article>
        <Card title="Connection">
          <div className="stack">
            {[
              ['Details submitted', detailsLabel(details?.detailsSubmittedAt)],
              ['Payouts enabled', detailsLabel(details?.payoutsEnabledAt)],
            ].map(([title, when]) => (
              <div className="checklist__item checklist__item--done" key={title}>
                <span className="checklist__dot">
                  <Check />
                </span>
                <span className="list__grow">{title}</span>
                <span className="text-sm text-muted">{when}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="span-full">
          <HowItWorks creator={creator} />
        </div>
      </div>
    </>
  )
}
