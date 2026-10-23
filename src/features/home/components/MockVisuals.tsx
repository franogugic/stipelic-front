import {
  Landmark,
  LayoutDashboard,
  Lock,
  Mail,
  Package,
  PanelsTopLeft,
  Plus,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { money, number } from '../../../shared/lib/format'
import { Avatar, Badge, Brand, Delta, Meter, Metric, Money, Sparkline, StatusBadge } from '../../../shared/ui/ledger'
import {
  MOCK_AVERAGE_ORDER_CENTS,
  MOCK_DATE,
  MOCK_MONTHLY_REVENUE_CENTS,
  MOCK_MONTH_LABELS,
  MOCK_OPEN_RATES,
  MOCK_ORDERS,
  MOCK_REVENUE_GROWTH_PERCENT,
  MOCK_SUBSCRIBERS,
  MOCK_TOTAL_REVENUE_CENTS,
} from '../model/home-content'

// The illustrations on the homepage are decorative: static content, hidden from assistive technology by their parents.

/** The prototype's `.bars` column chart, without the tooltips and chart role of the app's Bars (it is only an illustration). */
function MockBars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1)
  return (
    <div className="bars">
      {values.map((value, index) => (
        <div key={index} className={['bars__col', index === values.length - 1 && 'bars__col--hi'].filter(Boolean).join(' ')}>
          <span className="bars__bar" style={{ '--h': `${((value / max) * 100).toFixed(1)}%` } as CSSProperties} />
          <span className="bars__label">{labels[index]}</span>
        </div>
      ))}
    </div>
  )
}

const MOCK_NAV: Array<[icon: LucideIcon, label: string]> = [
  [LayoutDashboard, 'Dashboard'],
  [PanelsTopLeft, 'Landing Pages'],
  [Package, 'Products'],
  [Receipt, 'Orders'],
  [Mail, 'Email'],
  [Users, 'Subscribers'],
  [Landmark, 'Payouts'],
]

const MOCK_TILES: Array<[label: string, value: ReactNode]> = [
  ['Average order', <Money amountCents={MOCK_AVERAGE_ORDER_CENTS} />],
  ['This month', <Money amountCents={MOCK_MONTHLY_REVENUE_CENTS[11]} />],
  ['Subscribers', '124'],
  ['Customers', '58'],
]

/** The dashboard of a fictional creator, inside a browser frame. */
export function HeroMock() {
  return (
    <div className="mk-mock">
      <div className="mk-mock__chrome">
        <span className="mk-mock__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="mk-mock__url">
          <Lock />
          luma.app/dashboard
        </span>
      </div>
      <div className="mk-mock__body">
        <aside className="mk-mock__side">
          <Brand />
          <ul role="list">
            {MOCK_NAV.map(([Icon, label], index) => (
              <li key={label} className={index === 0 ? 'is-active' : ''}>
                <Icon />
                {label}
              </li>
            ))}
          </ul>
        </aside>
        <div className="mk-mock__main">
          <div className="mk-mock__head">
            <div>
              <p className="eyebrow">{MOCK_DATE}</p>
              <p className="mk-mock__title">
                Good morning, <em>Marko</em>
              </p>
            </div>
            <span className="btn btn--primary btn--sm">
              <Plus />
              <span>New product</span>
            </span>
          </div>
          <div className="mk-mock__grid">
            <div className="card card--feature mk-mock__rev">
              <div className="card__body stack stack--md">
                <span className="metric__label">
                  <Wallet />
                  Total revenue · all time
                </span>
                <span className="metric__value mk-mock__money">
                  <Money amountCents={MOCK_TOTAL_REVENUE_CENTS} />
                </span>
                <span className="metric__meta">
                  <Delta change={MOCK_REVENUE_GROWTH_PERCENT} />
                  <span>vs last quarter</span>
                </span>
                <Sparkline values={MOCK_MONTHLY_REVENUE_CENTS} />
              </div>
            </div>
            <div className="mk-mock__tiles">
              {MOCK_TILES.map(([label, value]) => (
                <Metric key={label} label={label} value={value} />
              ))}
            </div>
            <div className="card mk-mock__chart">
              <div className="card__body stack stack--md">
                <span className="card__title">Revenue by month</span>
                <MockBars values={MOCK_MONTHLY_REVENUE_CENTS} labels={MOCK_MONTH_LABELS} />
              </div>
            </div>
            <div className="card mk-mock__orders">
              <div className="card__body stack stack--sm">
                <span className="card__title">Latest orders</span>
                {MOCK_ORDERS.map((order) => (
                  <div className="list__row" key={order.name}>
                    <Avatar size="xs" neutral>
                      {order.initials}
                    </Avatar>
                    <span className="list__grow text-sm">{order.name}</span>
                    <StatusBadge kind="order" value="paid" />
                    <span className="num text-sm">{money(order.amountCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Features bento, "Email that gets opened": the open rate by month. */
export function EmailVisual() {
  const { labels, values } = MOCK_OPEN_RATES
  return (
    <div className="mk-mini-card">
      <div className="cluster cluster--between">
        <span className="text-sm text-secondary">Open rate</span>
        <Badge tone="solid-accent">{values[values.length - 1]}%</Badge>
      </div>
      <MockBars values={values} labels={labels} />
    </div>
  )
}

/** Features bento, "Know what works": a page's trend and its conversion. */
export function AnalyticsVisual() {
  return (
    <div className="mk-mini-card">
      <div className="cluster cluster--between">
        <span className="text-sm text-secondary">Adriatic Summer Presets</span>
        <div className="segmented">
          <span className="segmented__label">7d</span>
          <span className="segmented__label mk-seg-on">30d</span>
          <span className="segmented__label">1y</span>
        </div>
      </div>
      <Sparkline values={MOCK_MONTHLY_REVENUE_CENTS} />
      <Meter label="Views → purchase" used={38} limit={1000} />
    </div>
  )
}

/** Features bento, "An audience you own": collected emails with the page they came from. */
export function AudienceVisual() {
  return (
    <>
      <div className="mk-audience__stack">
        {MOCK_SUBSCRIBERS.initials.map((initials, index) => (
          <Avatar key={index} neutral>
            {initials}
          </Avatar>
        ))}
        <Avatar>+{number(MOCK_SUBSCRIBERS.more)}</Avatar>
      </div>
      <ul className="mk-audience__list" role="list">
        {MOCK_SUBSCRIBERS.recent.map((subscriber) => (
          <li key={subscriber.email}>
            <span className="mono text-xs">{subscriber.email}</span>
            <Badge tone="outline">{subscriber.source}</Badge>
          </li>
        ))}
      </ul>
    </>
  )
}
