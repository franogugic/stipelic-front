import { Copy, Gauge, Link, Package, Receipt, Users, Wallet } from 'lucide-react'
import { date, initials, money, month, number, plural } from '../../shared/lib/format'
import {
  Avatar,
  Card,
  CardBody,
  CardHeader,
  CardSubtitle,
  CardTitle,
  Delta,
  KeyValue,
  Menu,
  Metric,
  Meter,
  Money,
  PageTypeBadge,
  ProductTypeBadge,
  Badge,
  Sparkline,
  StatusBadge,
  TableFooter,
  TabPanel,
  Tabs,
  UrlPill,
  useTabs,
  useToast,
} from '../../shared/ui/ledger'
import type { StatusKind } from '../../shared/ui/ledger'
import { ChipsAndAvatarsCard } from './ButtonsAndForms'

// Specimen data only — the prototype computes these figures from its mock data, which is not ported.
const MONTHLY_REVENUE_CENTS = [18200, 24100, 31800, 29900, 41200, 38600, 47100, 52800, 49300, 61500, 58900, 68500]
const TOTAL_CENTS = 468500
const THIS_MONTH_CENTS = 68500
const LAST_MONTH_CENTS = 58900
const CHANGE = ((THIS_MONTH_CENTS - LAST_MONTH_CENTS) / LAST_MONTH_CENTS) * 100

const BADGES: Array<[string, StatusKind, string[]]> = [
  ['Orders', 'order', ['paid', 'pending', 'failed', 'refunded']],
  ['Landing pages', 'page', ['published', 'draft', 'archived']],
  ['Products', 'product', ['active', 'draft', 'archived']],
  ['Campaigns', 'campaign', ['sent', 'sending', 'scheduled', 'failed', 'cancelled']],
  ['Payouts', 'payout', ['pending', 'paid', 'failed', 'cancelled']],
  ['Subscribers', 'subscriber', ['active', 'unsubscribed']],
  ['Subscription', 'subscription', ['active', 'unpaid', 'past_due', 'cancelling']],
]

const ORDERS = [
  { id: 1, number: 1042, name: 'Ana Kovač', email: 'ana.kovac@example.com', product: 'Adriatic Summer Presets', createdAt: '2026-07-14T09:30:00', status: 'paid', cents: 2900 },
  { id: 2, number: 1041, name: 'Luka Marić', email: 'luka.maric@example.com', product: 'Color Grading Guide', createdAt: '2026-07-13T17:05:00', status: 'paid', cents: 4900 },
  { id: 3, number: 1040, name: 'Ivana Babić', email: 'ivana.babic@example.com', product: 'Adriatic Summer Presets', createdAt: '2026-07-12T11:48:00', status: 'pending', cents: 2900 },
  { id: 4, number: 1039, name: 'Marko Jurić', email: 'marko.juric@example.com', product: 'Color Grading Guide', createdAt: '2026-07-11T20:12:00', status: 'failed', cents: 4900 },
  { id: 5, number: 1038, name: 'Petra Novak', email: 'petra.novak@example.com', product: 'Adriatic Summer Presets', createdAt: '2026-07-10T08:21:00', status: 'refunded', cents: 2900 },
  { id: 6, number: 1037, name: 'Tomislav Pavić', email: 'tomislav.pavic@example.com', product: 'Color Grading Guide', createdAt: '2026-07-09T14:02:00', status: 'paid', cents: 4900 },
]

export function DataSection() {
  const toast = useToast()
  const tabs = useTabs({
    label: 'Order filter',
    items: [
      { key: 'all', label: 'All' },
      { key: 'paid', label: 'Paid' },
      { key: 'other', label: 'Needs attention' },
    ],
    panelId: 'sg-panel-orders',
  })
  const rows = ORDERS.filter((order) => tabs.active === 'all' || (tabs.active === 'paid' ? order.status === 'paid' : order.status !== 'paid')).slice(0, 5)
  const matching = ORDERS.filter((order) => tabs.active === 'all' || (tabs.active === 'paid' ? order.status === 'paid' : order.status !== 'paid'))
  const previousMonth = new Date(2026, 5, 1)

  return (
    <section className="section" id="data" aria-labelledby="data-title">
      <div className="section__header">
        <div className="stack stack--xs">
          <h2 className="section-title" id="data-title">
            Data display
          </h2>
          <p>Metrics, badges, meters and tables — all figures below are specimen data.</p>
        </div>
      </div>

      <div className="sg-metrics">
        <article className="card card--feature sg-metrics__hero">
          <div className="card__body stack stack--lg">
            <Metric
              card={false}
              size="hero"
              label="Total revenue · all time"
              icon={Wallet}
              value={<Money amountCents={TOTAL_CENTS} />}
              meta={
                <>
                  <Delta change={CHANGE} />
                  <span className="text-muted">
                    {money(THIS_MONTH_CENTS)} this month vs {money(LAST_MONTH_CENTS)} in {month(previousMonth)}
                  </span>
                </>
              }
            />
            <Sparkline values={MONTHLY_REVENUE_CENTS} label="Revenue over the last 12 months" />
          </div>
        </article>
        <Metric label="Average order value" icon={Receipt} value={<Money amountCents={3700} />} meta={plural(86, 'paid order')} />
        <Metric
          label="Active subscribers"
          icon={Users}
          value={number(1248)}
          meta={
            <>
              <Delta change={1}>{number(64)}</Delta> new this month
            </>
          }
        />
        <article className="card sg-metrics__plan">
          <div className="card__body stack stack--md">
            <div className="cluster cluster--between">
              <span className="metric__label">
                <Gauge />
                Plan usage
              </span>
              <Badge tone="solid-accent">Pro</Badge>
            </div>
            <Meter label="Landing pages" used={12} limit={20} />
            <Meter label="Products" used={18} limit={20} />
            <Meter label="Emails this month" used={4200} limit={5000} />
          </div>
        </article>
      </div>

      <Card as="div">
        <CardHeader>
          <CardTitle>Status badges</CardTitle>
          <CardSubtitle>One mapping for every entity</CardSubtitle>
        </CardHeader>
        <CardBody>
          <dl className="sg-badges">
            {BADGES.map(([label, kind, values]) => (
              <div className="sg-badges__row" key={kind}>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="cluster cluster--sm">
                  {values.map((value) => (
                    <StatusBadge key={value} kind={kind} value={value} />
                  ))}
                </dd>
              </div>
            ))}
            <div className="sg-badges__row">
              <dt className="text-sm text-muted">Types</dt>
              <dd className="cluster cluster--sm">
                <PageTypeBadge type="lead" />
                <PageTypeBadge type="sales" />
                <ProductTypeBadge type="digital" />
                <ProductTypeBadge type="service" />
                <ProductTypeBadge type="course" />
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <div className="grid grid--2">
        <Card as="div">
          <CardHeader>
            <CardTitle>Details list</CardTitle>
            <CardSubtitle>Summaries, bank data, campaign facts</CardSubtitle>
          </CardHeader>
          <CardBody>
            <KeyValue
              items={[
                { term: 'Account holder', description: 'Marko Horvat' },
                { term: 'IBAN', description: 'RS35 •••• •••• •••• 1379', mono: true },
                {
                  term: 'Public link',
                  description: <UrlPill icon={Link}>luma.app/p/mh-studio/adriatic-summer-presets</UrlPill>,
                },
              ]}
            />
          </CardBody>
        </Card>
        <ChipsAndAvatarsCard />
      </div>

      <div className="card">
        <div className="card__header">
          <div className="card__heading">
            <h3 className="card__title">Latest orders</h3>
            <p className="card__subtitle">Table with row actions — stacks into cards on phones</p>
          </div>
          <Tabs {...tabs.tablistProps} className="sg-tabs" />
        </div>
        <TabPanel tabs={tabs} className="card__body card__body--flush">
          <div className="table-wrap">
            <table className="table table--stack">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Product</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="is-num">
                    Amount
                  </th>
                  <th scope="col" className="is-actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <tr key={order.id}>
                    <td className="is-lead">
                      <div className="table__main">
                        <Avatar size="sm" neutral>
                          {initials(order.name)}
                        </Avatar>
                        <div>
                          <span className="table__primary">{order.name}</span>
                          <span className="table__secondary">{order.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Product">{order.product}</td>
                    <td data-label="Date" className="num">
                      {date(order.createdAt)}
                    </td>
                    <td data-label="Status">
                      <StatusBadge kind="order" value={order.status} />
                    </td>
                    <td data-label="Amount" className="is-num">
                      <Money amountCents={order.cents} />
                    </td>
                    <td className="is-actions">
                      <Menu
                        label={`Actions for order #${order.number}`}
                        items={[
                          {
                            label: 'Copy customer email',
                            icon: Copy,
                            onSelect: () => {
                              void navigator.clipboard?.writeText(order.email)
                              toast({ title: 'Email copied', message: order.email })
                            },
                          },
                          { label: 'View product', icon: Package, href: '#data' },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableFooter count={`Showing ${rows.length} of ${plural(matching.length, 'order')}`} />
        </TabPanel>
      </div>
    </section>
  )
}
