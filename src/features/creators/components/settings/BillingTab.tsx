import { ArrowUpRight, CalendarClock, CircleAlert, CreditCard, Gauge, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { date, money, number, percent, plural } from '../../../../shared/lib/format'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Meter,
  StatusBadge,
  subscriptionStatusKey,
  useToast,
} from '../../../../shared/ui/ledger'
import { getHomeSummary } from '../../../orders/api/orders-api'
import type { HomeSummary } from '../../../orders/model/types'
import { useCreatorStore } from '../../model/creator-store'
import type { Creator, CreatorPlan } from '../../model/types'

const intervalWord = (plan: CreatorPlan) => (plan.billingInterval === 'Yearly' ? 'year' : 'month')
const limitOf = (plan: CreatorPlan | undefined, key: string) => plan?.limits[key]

/** The first of next month, UTC — when the monthly email counter starts again. */
function nextMonthStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
}

/** Settings → Plan & billing: status banner, current plan, usage and the plan comparison. */
export function BillingTab({ slug, creator }: { slug: string; creator: Creator }) {
  const toast = useToast()
  const plans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)
  const openBillingPortal = useCreatorStore((s) => s.openBillingPortal)
  const startCreatorCheckout = useCreatorStore((s) => s.startCreatorCheckout)
  const cancelSubscription = useCreatorStore((s) => s.cancelSubscription)
  const resetCancelFeedback = useCreatorStore((s) => s.resetCancelSubscriptionFeedback)

  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [paying, setPaying] = useState(false)
  const [portalOpening, setPortalOpening] = useState(false)
  const [upgradingCode, setUpgradingCode] = useState<string | null>(null)
  const compareRef = useRef<HTMLElement>(null)

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  useEffect(() => {
    let active = true
    getHomeSummary(slug)
      .then((data) => active && setSummary(data))
      .catch(() => active && setSummary(null))
    return () => {
      active = false
    }
  }, [slug])

  const plan = plans.find((candidate) => candidate.code === creator.planCode)
  const planName = creator.planName
  const status = subscriptionStatusKey({
    status: creator.status,
    subscriptionStatus: creator.subscriptionStatus,
    cancelAtPeriodEnd: creator.cancelAtPeriodEnd,
  })
  const paid = plan ? plan.priceCents > 0 : creator.planCode !== 'free'
  const endDate = creator.currentPeriodEnd ? date(creator.currentPeriodEnd) : null
  const isCancelling = status === 'cancelling'
  const currency = plan?.currency ?? creator.defaultCurrency
  const onFree = !paid
  const freePlan = plans.find((candidate) => candidate.priceCents === 0)
  const freeSummary = freePlan
    ? ` — ${limitText(freePlan.limits['max_landing_pages'], 'landing page')}, ${limitText(freePlan.limits['max_products'], 'product')} and a ${percent(freePlan.platformFeeBasisPoints / 100)} fee per sale`
    : ''

  const openPortal = async () => {
    setPortalOpening(true)
    const failure = await openBillingPortal()
    setPortalOpening(false)
    if (failure) toast({ tone: 'danger', title: failure })
  }

  // A Free workspace has no billing portal yet: it upgrades by choosing a plan, and pays on Stripe.
  const changePlan = () => {
    if (onFree) compareRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    else void openPortal()
  }

  const upgradeTo = async (option: CreatorPlan) => {
    setUpgradingCode(option.code)
    const checkout = await startCreatorCheckout(option.code)
    if (checkout?.checkoutUrl) {
      window.location.assign(checkout.checkoutUrl)
      return
    }
    setUpgradingCode(null)
    toast({
      tone: 'danger',
      title: useCreatorStore.getState().checkoutError ?? 'We could not start checkout. Please try again.',
    })
  }

  const completePayment = async () => {
    setPaying(true)
    const checkout = await startCreatorCheckout()
    if (checkout?.checkoutUrl) {
      window.location.assign(checkout.checkoutUrl)
      return
    }
    setPaying(false)
    toast({
      tone: 'danger',
      title: useCreatorStore.getState().checkoutError ?? 'We could not start checkout. Please try again.',
    })
  }

  const confirmCancellation = async () => {
    setCancelling(true)
    const ok = await cancelSubscription()
    setCancelling(false)
    setConfirmCancel(false)
    if (ok) {
      const ends = useCreatorStore.getState().currentCreator?.currentPeriodEnd
      toast({
        tone: 'success',
        title: 'Subscription cancelled',
        message: ends ? `Your ${planName} plan ends on ${date(ends)}.` : undefined,
      })
    } else {
      toast({
        tone: 'danger',
        title: useCreatorStore.getState().cancelSubscriptionError ?? 'We could not cancel the subscription. Please try again.',
      })
    }
    resetCancelFeedback()
  }

  const banner: { tone: 'warning' | 'danger' | 'info'; icon: LucideIcon; title: string; text: string; action: React.ReactNode } | null =
    status === 'unpaid'
      ? {
          tone: 'warning',
          icon: CreditCard,
          title: 'Waiting for your first payment',
          text: `Your ${planName} plan starts as soon as it’s paid. Until then, publishing pages is paused.`,
          action: (
            <Button variant="accent" loading={paying} onClick={() => void completePayment()}>
              Complete payment
            </Button>
          ),
        }
      : status === 'past_due'
        ? {
            tone: 'danger',
            icon: CircleAlert,
            title: 'Your last payment didn’t go through',
            text: `Stripe couldn’t charge your card. Update your payment method to keep the ${planName} plan.`,
            action: (
              <Button variant="primary" loading={portalOpening} onClick={() => void openPortal()}>
                Update payment method
              </Button>
            ),
          }
        : isCancelling
          ? {
              tone: 'info',
              icon: CalendarClock,
              title: `Your ${planName} plan ends${endDate ? ` on ${endDate}` : ''}`,
              text: 'After that, your workspace moves to the Free plan and its limits.',
              action: (
                <Button variant="primary" loading={portalOpening} onClick={() => void openPortal()}>
                  Keep my plan
                </Button>
              ),
            }
          : null

  const used = {
    pages: summary?.landingPageCount ?? 0,
    products: summary?.productCount ?? 0,
    emails: summary?.emailsSentThisMonth ?? 0,
    contacts: summary?.subscriberCount ?? 0,
  }

  return (
    <div className="stack stack--lg">
      {banner && (
        <Alert tone={banner.tone} icon={banner.icon} title={banner.title} live>
          {banner.text}
          <div>{banner.action}</div>
        </Alert>
      )}
      <div className="settings-grid">
        <article className="card card--feature">
          <div className="card__body stack stack--lg">
            <div className="cluster cluster--between">
              <span className="metric__label">
                <Gauge />
                Current plan
              </span>
              <StatusBadge kind="subscription" value={status} />
            </div>
            <div className="metric metric--hero">
              <span className="metric__value">{planName}</span>
              <span className="metric__meta">
                {plan
                  ? `${paid ? `${money(plan.priceCents, currency, { decimals: false })} / ${intervalWord(plan)}` : 'Free'} · ${percent(plan.platformFeeBasisPoints / 100)} fee per sale`
                  : '—'}
              </span>
            </div>
            <p className="text-muted">
              {!paid
                ? 'No renewal — the Free plan has no billing.'
                : isCancelling
                  ? `Ends${endDate ? ` on ${endDate}` : ''}`
                  : status === 'unpaid'
                    ? 'Not active until the first payment'
                    : `Renews${endDate ? ` on ${endDate}` : ''}`}
            </p>
            <div className="cluster">
              <Button variant="accent" icon={ArrowUpRight} loading={portalOpening} onClick={changePlan}>
                Change plan
              </Button>
              {paid && !isCancelling && status === 'active' && (
                <button className="btn billing__cancel" type="button" onClick={() => setConfirmCancel(true)}>
                  Cancel subscription
                </button>
              )}
            </div>
          </div>
        </article>
        <Card title="Usage this month" subtitle={`Email sends reset on ${date(nextMonthStart())}`}>
          <div className="stack stack--md">
            <Meter label="Landing pages" used={used.pages} limit={limitOf(plan, 'max_landing_pages')} />
            <Meter label="Products" used={used.products} limit={limitOf(plan, 'max_products')} />
            <Meter
              label="Emails sent"
              used={used.emails}
              limit={summary?.emailsMonthlyLimit ?? limitOf(plan, 'max_email_sends_per_month')}
            />
            <Meter label="Contacts" used={used.contacts} limit={limitOf(plan, 'max_contacts')} />
          </div>
        </Card>
      </div>
      <section ref={compareRef} aria-label="Compare plans">
        <Card title="Compare plans">
          <div className="plan-compare">
            {plans.map((option) => {
              const emails = option.limits['max_email_sends_per_month']
              const optionPaid = option.priceCents > 0
              return (
                <div className={['plan-compare__item', option.code === creator.planCode && 'is-current'].filter(Boolean).join(' ')} key={option.code}>
                  <div className="cluster cluster--between">
                    <strong>{option.name}</strong>
                    {option.code === creator.planCode && <Badge tone="solid-accent">Current</Badge>}
                  </div>
                  <p className="plan__price">
                    {money(option.priceCents, option.currency, { decimals: false })}
                    <small className="text-sm text-muted"> /{optionPaid ? (option.billingInterval === 'Yearly' ? 'yr' : 'mo') : 'mo'}</small>
                  </p>
                  <ul className="plan__list" role="list">
                    <li>{percent(option.platformFeeBasisPoints / 100)} fee per sale</li>
                    <li>
                      {limitText(option.limits['max_landing_pages'], 'landing page')} ·{' '}
                      {limitText(option.limits['max_products'], 'product')}
                    </li>
                    <li>{emails < 0 ? 'Unlimited' : number(emails)} emails / month</li>
                  </ul>
                  {onFree && optionPaid && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={upgradingCode === option.code}
                      disabled={upgradingCode !== null && upgradingCode !== option.code}
                      onClick={() => void upgradeTo(option)}
                    >
                      Upgrade to {option.name}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-sm text-muted plan-compare__note">
            <Lock className="inline-icon" />{' '}
            {onFree
              ? 'Upgrading takes you to Stripe’s secure checkout; invoices and your payment method are managed there afterwards.'
              : 'Plan changes, invoices and your payment method are managed in the secure Stripe billing portal.'}
          </p>
        </Card>
      </section>

      <ConfirmDialog
        open={confirmCancel}
        title={`Cancel your ${planName} subscription?`}
        text={`You keep ${planName}${endDate ? ` until ${endDate}` : ''}. After that your workspace moves to the Free plan${freeSummary}.`}
        confirmLabel="Cancel subscription"
        cancelLabel={`Keep ${planName}`}
        tone="danger"
        busy={cancelling}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => void confirmCancellation()}
      />
    </div>
  )
}

const limitText = (limit: number, noun: string) => (limit < 0 ? `Unlimited ${noun}s` : plural(limit, noun))
